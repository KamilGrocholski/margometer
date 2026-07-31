import type { RosterEntry } from "./roster.ts";
import { typeFamily } from "./types.ts";
import type {
  ActorStats,
  AttackerBreakdown,
  BattleEvent,
  DamageSource,
  ProcCount,
} from "./types.ts";

/** Wpis składu w postaci, w której liczy go agregacja — bez względu na źródło. */
type Seat = { name: string; side: number; prof?: string | undefined; level?: number | undefined };

/**
 * Etykieta instancji postaci o zdublowanej nazwie. Numer jest NASZ — log nie
 * daje żadnego identyfikatora, więc "Locha #1" znaczy tylko "ta, którą
 * zobaczyliśmy pierwsza", a nie któryś konkretny potwór na ekranie.
 */
function instanceLabel(name: string, index: number): string {
  return `${name} #${index + 1}`;
}

type Instance = { index: number; hpPct: number; touched: number };

/**
 * Nazwa, procent życia z tej samej linii i kierunek zmiany życia. `rising`
 * znaczy "ta wartość jest PO wyleczeniu" — jedyny przypadek, w którym życie
 * idzie w górę, więc dopasowanie instancji musi patrzeć w drugą stronę.
 */
type NameRef = [name: string, hpPct: number | null, rising?: boolean];

/**
 * Wymienia nazwy padające w zdarzeniu wraz z procentem życia, jaki niesie ta
 * sama linia. Jedno miejsce na tę wiedzę, bo przebiegamy zdarzenia dwa razy
 * (raz na policzenie instancji, raz na właściwe liczenie) i oba przebiegi
 * MUSZĄ widzieć dokładnie tę samą kolejność.
 */
function namesIn(event: BattleEvent): NameRef[] {
  switch (event.kind) {
    case "attack":
      return [
        [event.source, event.sourceHpPct],
        [event.target, event.targetHpPct],
      ];
    case "dot":
      return [[event.target, event.targetHpPct]];
    case "move":
      return [[event.actor, event.hpPct]];
    // Leczenie jako jedyne PODNOSI życie, więc dopasowanie idzie od dołu —
    // patrz `rising` w `instanceResolver`.
    case "heal":
      return [[event.target, event.targetHpPct, true]];
    case "turn-lost":
    case "ability":
      return [[event.actor, null]];
    default:
      return [];
  }
}

/**
 * Rozdziela postacie o tej samej nazwie po procencie życia z linii logu.
 *
 * Log nie numeruje potworów, ale życie nie rośnie, więc linia należy do tej
 * instancji, która stoi tuż NAD podaną wartością. Kolejną instancję zakładamy
 * dopiero wtedy, gdy log jej ZAŻĄDA: linia z HP wyższym niż u wszystkich
 * dotąd widzianych nie może dotyczyć żadnej z nich.
 *
 * Ta zwłoka jest sednem. Dwie "Wieczornice" stojące całą walkę na 100% są
 * w logu nieodróżnialne i rozbicie ich na dwa wiersze byłoby zmyśleniem —
 * przypisałoby konkretnej postaci obrażenia, o których log milczy. Wtedy
 * zostaje jedna scalona instancja pod gołą nazwą, tak jak przed rozdzielaniem.
 */
function instanceResolver(
  roster: Seat[],
  events: BattleEvent[],
  /**
   * Skład pochodzi z gry, nie z logu — wtedy liczba postaci o danej nazwie
   * jest FAKTEM, a nie wnioskiem. Zmienia to dwie rzeczy: wiersze zakładamy
   * wszystkim od razu (także tym, których log nigdy nie wymieni), a duplikaty
   * numerujemy zawsze, bo wiemy, że to osobne postacie.
   */
  authoritative = false,
) {
  const counts = new Map<string, number>();
  for (const participant of roster) {
    counts.set(participant.name, (counts.get(participant.name) ?? 0) + 1);
  }

  const track = () => {
    const live = new Map<string, Instance[]>();
    let clock = 0;

    return (name: string, hpPct: number | null, rising = false): number => {
      const total = counts.get(name) ?? 0;
      // Nazwa jedyna w składzie (albo spoza składu) — nie ma czego rozdzielać.
      if (total < 2) return 0;

      clock += 1;
      const list = live.get(name) ?? [];
      if (list.length === 0) live.set(name, list);

      const spawn = () => {
        const created = { index: list.length, hpPct: hpPct ?? 100, touched: clock };
        list.push(created);
        return created;
      };

      if (list.length === 0) return spawn().index;

      if (hpPct === null) {
        // Bez procentu nie ma czego dopasować — linia lgnie do instancji,
        // która działała ostatnio, bo takie linie lecą tuż obok jej akcji.
        const recent = list.reduce((best, one) => (one.touched > best.touched ? one : best));
        recent.touched = clock;
        return recent.index;
      }

      if (rising) {
        // Leczenie jest jedyną linią, po której życie ROŚNIE, więc reguła
        // "stał wyżej, spadł tutaj" jest tu odwrócona: instancją jest ta, która
        // stała najbliżej POD podaną wartością i właśnie do niej doszła.
        //
        // Leczenie nigdy nie zakłada nowej instancji. Ubytek życia dowodzi, że
        // ktoś stał wyżej; przyrost nie dowodzi niczego — bez tego zastrzeżenia
        // wyleczenie do pełna rodziłoby postać-widmo przy każdej zdublowanej
        // nazwie, bo nikt nie stałby dość wysoko.
        const below = list.filter((one) => one.hpPct <= hpPct);
        const pick =
          below.length > 0
            ? below.reduce((best, one) => (one.hpPct > best.hpPct ? one : best))
            : list.reduce((best, one) => (one.touched > best.touched ? one : best));
        pick.hpPct = hpPct;
        pick.touched = clock;
        return pick.index;
      }

      // Ostro powyżej: żeby zejść do `hpPct`, trzeba było stać WYŻEJ. Bierzemy
      // najniższą taką instancję — najbliżej tej wartości, więc najpewniej to
      // ona właśnie oberwała.
      const above = list.filter((one) => one.hpPct > hpPct);
      if (above.length > 0) {
        const pick = above.reduce((best, one) => (one.hpPct < best.hpPct ? one : best));
        pick.hpPct = hpPct;
        pick.touched = clock;
        return pick.index;
      }

      // Równo: linia bez ubytku życia (unik, krok w bok) dotyczy tej instancji,
      // która stoi dokładnie tam — a przy kilku takich tej ostatnio aktywnej.
      const equal = list.filter((one) => one.hpPct === hpPct);
      if (equal.length > 0) {
        const pick = equal.reduce((best, one) => (one.touched > best.touched ? one : best));
        pick.touched = clock;
        return pick.index;
      }

      // Nikt nie stoi dość wysoko — to musi być postać, której jeszcze nie
      // widzieliśmy. Zakładamy ją, o ile skład na to pozwala.
      if (list.length < total) return spawn().index;

      // Skład wyczerpany, a HP i tak wyższe: ktoś się wyleczył albo heurystyka
      // odpłynęła. Najzdrowsza instancja jest najmniej złym strzałem.
      const pick = list.reduce((best, one) => (one.hpPct > best.hpPct ? one : best));
      pick.hpPct = hpPct;
      pick.touched = clock;
      return pick.index;
    };
  };

  // Przebieg rozpoznawczy: ile instancji każda nazwa faktycznie ujawni. Dopiero
  // to rozstrzyga, czy etykietą jest goła nazwa, czy "Nazwa #n".
  const dry = track();
  const spawned = new Map<string, number>();
  for (const event of events) {
    for (const [name, hpPct, rising] of namesIn(event)) {
      const index = dry(name, hpPct, rising);
      spawned.set(name, Math.max(spawned.get(name) ?? 0, index + 1));
    }
  }

  /** Ile wierszy dana nazwa dostanie. Ze składu z gry — tyle, ile postaci. */
  const rows = (name: string): number =>
    authoritative ? (counts.get(name) ?? 1) : (spawned.get(name) ?? 0);

  const label = (name: string, index: number): string =>
    rows(name) > 1 ? instanceLabel(name, index) : name;

  const live = track();
  const resolve = (name: string, hpPct: number | null, rising = false): string =>
    label(name, live(name, hpPct, rising));

  /**
   * Skład z rozwiniętymi duplikatami — po jednym wpisie na wiersz.
   *
   * Ze składu z gry wpis dostaje KAŻDA postać, także ta, której log nigdy nie
   * wymieni: jej istnienie jest faktem, więc pusty wiersz nie jest zmyśleniem.
   * Ze składu z logu tylko te, które log ujawnił — tam pusty wiersz dla
   * drugiego duplikatu twierdziłby, że akurat ta postać nic nie zrobiła.
   */
  const seats = (() => {
    const out: Array<{
      key: string;
      side: number;
      prof?: string | undefined;
      level?: number | undefined;
    }> = [];
    const used = new Set<string>();
    for (const participant of roster) {
      const total = Math.max(rows(participant.name), 1);
      for (let index = 0; index < total; index += 1) {
        const key = label(participant.name, index);
        if (used.has(key)) continue;
        used.add(key);
        // Profesja jedzie tą samą drogą co strona — obie są własnością SKŁADU,
        // nie linii logu, więc dostaje je każdy wiersz, także ten na zerach.
        out.push({ key, side: participant.side, prof: participant.prof, level: participant.level });
      }
    }
    return out;
  })();

  /**
   * Wiersze, którym overlay ma dokleić gwiazdkę: liczby nie są pewne.
   *
   * Ze składu z logu — nazwa scalająca kilka postaci albo etykiety rozdzielone
   * heurystycznie. Ze składu z gry wiersze są prawdziwe, ale gdy log nie
   * ujawnił wszystkich instancji danej nazwy, to znaczy, że ich nie rozróżnił
   * i całość obrażeń wylądowała na tych, które ujawnił.
   */
  const ambiguousKeys = [...counts]
    .filter(([, total]) => total > 1)
    .flatMap(([name]) => {
      const count = Math.max(rows(name), 1);
      // Rozdzielone (#1, #2) albo scalone pod gołą nazwą — w obu razach liczba
      // jest wnioskiem ze spadku HP, bo linia logu nie niesie tożsamości.
      return count > 1
        ? Array.from({ length: count }, (_, index) => instanceLabel(name, index))
        : [name];
    });

  return { resolve, seats, ambiguousKeys };
}

/** Cios bez zapowiedzi "X wykonuje Y." — log nie daje mu nazwy. */
const PLAIN_ATTACK = "Zwykły atak";

/**
 * Typ obrażeń, gdy żywiołu nie znamy: log wklejony jako tekst albo klasa CSS,
 * której jeszcze nie rozpoznajemy (obrażenia fizyczne). Nie nazywamy tego
 * "fizyczne", bo dla maga w logu tekstowym byłoby to nieprawdą.
 */
const UNKNOWN_ELEMENT = "bez żywiołu";
/**
 * Etykieta, którą parser zostawia dla nierozpoznanej klasy `dmgX`. Nazwa klasy
 * wprost, bo to jedyne, co o tym rodzaju obrażeń wiadomo.
 */
const RE_RAW_ELEMENT = /^dmg[a-z]+$/;

/** Leczenie bez nazwy umiejętności — log nie mówi, co je wywołało. */
const PLAIN_HEAL = "Regeneracja";

/**
 * Aktor tury, której nagłówka nie widzieliśmy — bufor logu zaczyna się w jej
 * środku. Puste, bo to nie jest niczyja tura z nazwy: gdybyśmy wstawili tu
 * jakąkolwiek nazwę, kolumna na osi dostałaby stronę, o której log milczy.
 */
const BACKGROUND_ACTOR = "";

/**
 * Sprowadza wariantowe nazwy efektów do jednej etykiety: "Niszczenie pancerza
 * o 10" i "o 11" to ten sam efekt, a liczba w nazwie nie sumuje się sensownie.
 */
function procLabel(proc: string): string {
  return proc.replace(/\d+/g, "N");
}

type Breakdown = {
  dealt: Map<string, DamageSource>;
  taken: Map<string, DamageSource>;
  /** Drugi przekrój tych samych obrażeń — wg typu. */
  dealtType: Map<string, DamageSource>;
  takenType: Map<string, DamageSource>;
  healed: Map<string, DamageSource>;
  procs: Map<string, ProcCount>;
  procsReceived: Map<string, ProcCount>;
  abilityUses: Map<string, ProcCount>;
  /** Przyjęte w dwóch szczeblach: napastnik → czym uderzał. */
  takenBy: Map<string, Map<string, DamageSource>>;
  /** Lustro `takenBy` po stronie zadających: cel → czym w niego uderzano. */
  dealtTo: Map<string, Map<string, DamageSource>>;
};

/** Wewnętrzna mapa jednego napastnika, zakładana przy pierwszym ciosie. */
function branchOf(
  into: Map<string, Map<string, DamageSource>>,
  attacker: string,
): Map<string, DamageSource> {
  const branch = into.get(attacker) ?? new Map<string, DamageSource>();
  into.set(attacker, branch);
  return branch;
}

function bumpCount(into: Map<string, ProcCount>, label: string): void {
  const entry = into.get(label) ?? { label, count: 0 };
  entry.count += 1;
  into.set(label, entry);
}

function entryFor<K>(into: Map<K, DamageSource>, key: K): DamageSource {
  const entry = into.get(key) ?? { label: String(key), amount: 0, hits: 0 };
  into.set(key, entry);
  return entry;
}

/**
 * Dokłada obrażenia do pozycji rozbicia — bez ruszania licznika ciosów.
 *
 * Jeden cios potrafi nieść kilka liczb: "Lodowa strzała" zadaje osobno
 * dystansowe i zimno. To nadal JEDEN cios z dwóch źródeł, więc liczby sumuje
 * się tutaj, a cios zgłasza `countStrike` raz na zdarzenie.
 */
function addDamage<K>(into: Map<K, DamageSource>, key: K, amount: number): void {
  entryFor(into, key).amount += amount;
}

/** Odnotowuje jeden cios pod daną pozycją. Wołane raz na zdarzenie, nie raz na liczbę. */
function countStrike<K>(into: Map<K, DamageSource>, key: K): void {
  entryFor(into, key).hits += 1;
}

function byAmount(...sources: Array<Map<unknown, DamageSource>>): DamageSource[] {
  return sources
    .flatMap((source) => [...source.values()])
    .sort((a, b) => b.amount - a.amount);
}

/** Trucizna bez sprawcy w rozbiciu na stronę poszkodowanego. */
export type UnattributedDot = { mine: number; enemy: number; loose: number };

/** Suma po wszystkich stronach — tyle trucizny bez sprawcy padło w walce. */
export function totalUnattributedDot(dot: UnattributedDot): number {
  return dot.mine + dot.enemy + dot.loose;
}

export type BattleStats = {
  actors: ActorStats[];
  /**
   * Obrażenia od efektów (trucizna itd.), których nie dało się przypisać do
   * sprawcy — log nie mówi, kto je nałożył.
   *
   * W rozbiciu na stronę POSZKODOWANEGO, bo tę log podaje. Dzięki temu przypis
   * pod listą mówi o tym, co widać na ekranie: przy "Oni" o truciźnie tykającej
   * im, a nie o całej walce. `loose` to postacie spoza składu.
   */
  unattributedDotDamage: UnattributedDot;
  /** Leczenie bez podanego źródła — zliczone tylko po stronie leczonego. */
  unattributedHealing: number;
  /**
   * Wiersze, którym nie ufamy w pełni — overlay oznacza je gwiazdką. Dwa
   * przypadki, obie o tym samym dla patrzącego: liczba nie jest pewna.
   * Nazwa goła ("Wieczornica") — log nie rozdzielił dwóch postaci i wiersz
   * je sumuje. Nazwa z numerem ("Locha #1") — rozdzieliliśmy je wnioskując
   * ze spadku HP, a nie odczytując stan gry.
   */
  ambiguousNames: string[];
  /** Linie, których parser nie zrozumiał. Niezerowe = statystyki są niepełne. */
  unknownLines: number;
  /**
   * Klasy `dmgX` z DOM gry, których nie umiemy nazwać — np. `dmgo`.
   *
   * Osobno od `unknownLines`, bo linia jest zrozumiana i liczby się zgadzają;
   * niepewny jest sam RODZAJ obrażeń. Bez tego nowa klasa wsiąkała w „bez
   * żywiołu" razem z logiem wklejonym jako tekst, czyli zmiana formatu
   * przechodziła bez śladu — wbrew kontraktowi „nieznane ma być głośne".
   */
  unknownElements: string[];
  /**
   * Obrażenia w podziale na tury, po jednym wpisie na turę walki.
   *
   * Tura jest GLOBALNA, nie per postać: `ActorStats.turns` liczy tury danej
   * osoby, a tu chodzi o oś czasu walki, na której da się zestawić obie strony.
   */
  timeline: TurnSlice[];
  /** Zgony w kolejności, w jakiej log je ujawnił. */
  deaths: Death[];
  /** Kto kogo bił — po jednym wpisie na parę, malejąco po obrażeniach. */
  matrix: DamageEdge[];
};

/** Jedna tura walki widziana z góry: ile poszło z której strony. */
export type TurnSlice = {
  /** Numer tury, od 1. */
  turn: number;
  /** Kto działał w tej turze. */
  actor: string;
  side: number | null;
  damage: number;
};

/**
 * Zgon postaci. Log nie ma osobnej linii „X ginie” — jedynym śladem jest
 * zejście życia do zera, więc śmierć rozpoznajemy po `(0%)` w linii.
 */
export type Death = { name: string; side: number | null; turn: number };

/** Krawędź „kto kogo”: obrażenia od jednej postaci do drugiej. */
export type DamageEdge = { source: string; target: string; damage: number };

function blank(name: string): ActorStats {
  return {
    name,
    side: null,
    professionCode: null,
    level: null,
    typeByLabel: [],
    damageDealt: 0,
    damageTaken: 0,
    damageAbsorbed: 0,
    healingDone: 0,
    healingReceived: 0,
    hits: 0,
    misses: 0,
    crits: 0,
    turns: 0,
    maxHit: 0,
    turnsLost: 0,
    dealtBy: [],
    takenFrom: [],
    dealtByType: [],
    takenByType: [],
    healedBy: [],
    procs: [],
    procsReceived: [],
    abilityUses: [],
    takenFromBy: [],
    dealtToBy: [],
    unattributedDotTaken: 0,
  };
}

/**
 * Agreguje zdarzenia do statystyk per postać.
 *
 * Obrażenia liczymy z wartości `applied` (po redukcji celu), bo to one
 * faktycznie zdejmują życie. `raw - applied` ląduje osobno jako pochłonięte.
 */
export function aggregate(events: BattleEvent[], fromGame?: RosterEntry[] | null): BattleStats {
  const actors = new Map<string, ActorStats>();
  const get = (name: string) => {
    let actor = actors.get(name);
    if (!actor) {
      actor = blank(name);
      actors.set(name, actor);
    }
    return actor;
  };

  const breakdowns = new Map<string, Breakdown>();
  const breakdownOf = (name: string) => {
    let breakdown = breakdowns.get(name);
    if (!breakdown) {
      breakdown = {
        dealt: new Map(),
        taken: new Map(),
        dealtType: new Map(),
        takenType: new Map(),
        healed: new Map(),
        procs: new Map(),
        procsReceived: new Map(),
        abilityUses: new Map(),
        takenBy: new Map(),
        dealtTo: new Map(),
      };
      breakdowns.set(name, breakdown);
    }
    return breakdown;
  };

  const fromLog = events.find((e) => e.kind === "fight-start")?.participants ?? [];
  // Skład z gry ma pierwszeństwo: zna wszystkie postacie, także te, o których
  // log milczy. Gdy go nie ma (testy, wklejony tekst, patch gry), lecimy z linii
  // otwierającej — dokładnie jak przedtem.
  const useGame = fromGame != null && fromGame.length > 0;
  /**
   * Jedyny skład, którym liczymy strony. Wszystko, co pyta „po której stronie
   * stoi ta nazwa", MUSI czytać z tej samej listy co `seats` — inaczej przy
   * wyjechanym z bufora nagłówku część kodu widzi skład z gry, a część pustkę.
   */
  // Profesję i poziom niosą OBA źródła tak samo, więc bierzemy to, co jest.
  // Skład z gry rządzi stronami, ale gdy jego wpis nie ma `prof` (starszy klient,
  // patch), dokłada je linia otwierająca — i odwrotnie.
  const fromLogByName = new Map(fromLog.map((p) => [p.name, p]));
  /**
   * Ile obrażeń dana etykieta zadała w każdej rodzinie typów.
   *
   * Pasek ma JEDEN kolor, a etykieta potrafi nieść kilka żywiołów naraz („Fuzja
   * żywiołów" to zimno, błyskawica i obrażenia nieuchronne) — więc wygrywa ten,
   * który dominuje OBRAŻENIAMI, a nie ten, który akurat padł pierwszy.
   */
  const typeTally = new Map<string, Map<string, Map<string, number>>>();
  const noteType = (actor: string, label: string, type: string, amount: number) => {
    const family = typeFamily(type);
    // Bez rozpoznanej rodziny nie ma czego zapisywać: brak wpisu znaczy „log nie
    // mówi", a widok pokaże wtedy barwę neutralną zamiast zgadywać.
    if (family === null) return;
    const byLabel = typeTally.get(actor) ?? new Map<string, Map<string, number>>();
    typeTally.set(actor, byLabel);
    const families = byLabel.get(label) ?? new Map<string, number>();
    byLabel.set(label, families);
    families.set(family, (families.get(family) ?? 0) + amount);
  };

  const roster: Seat[] = useGame
    ? fromGame.map((entry) => ({
        name: entry.name,
        side: entry.side,
        prof: entry.prof ?? fromLogByName.get(entry.name)?.professionCode,
        level: entry.lvl ?? fromLogByName.get(entry.name)?.level,
      }))
    : fromLog.map((p) => ({
        name: p.name,
        side: p.side,
        prof: p.professionCode,
        level: p.level,
      }));
  const { resolve, seats, ambiguousKeys } = instanceResolver(roster, events, useGame);

  /**
   * Sprawcę tykającego efektu da się wskazać, gdy po drugiej stronie stoi
   * dokładnie jedna postać — wtedy nie ma wątpliwości, kto go nałożył. Liczy
   * się strona, nie rozmiar walki: w 1 vs 3 trucizna na przeciwniku ma jednego
   * możliwego sprawcę, choć uczestników jest czterech.
   *
   * Liczymy WPISY składu, nie unikalne nazwy: dwie "Lochy" po drugiej stronie
   * to dwóch możliwych sprawców, choć nazwa jest jedna.
   *
   * Stronę celu bierzemy z tego samego `roster`, z którego powstały `seats` —
   * przy składzie z gry działa więc także wtedy, gdy linia otwierająca wyjechała
   * już z bufora. Wcześniej czytało to wyłącznie uczestników z `fight-start`,
   * więc w tej samej walce sprawca trucizny „gubił się” po przycięciu logu.
   */
  const opponentOf = (name: string): string | null => {
    const matches = roster.filter((p) => p.name === name);
    const target = matches[0];
    if (!target) return null;
    // Ta sama nazwa po OBU stronach (dwa "Wilki", jeden nasz) nie mówi, czyj
    // jest cel — a wtedy nie wiadomo też, po której stronie szukać sprawcy.
    // `find` brał po prostu pierwszy wpis, więc trucizna potrafiła trafić na
    // konto sojusznika.
    if (matches.some((one) => one.side !== target.side)) return null;
    const enemies = seats.filter((seat) => seat.side !== target.side);
    return enemies.length === 1 ? enemies[0]!.key : null;
  };

  /**
   * Kto działał ostatnio. Turę zamyka dopiero akcja kogoś innego — DoT-y i
   * leczenie lecą pomiędzy, ale nie są niczyją akcją, więc jej nie przerywają.
   */
  // Oś tur walki. Rośnie razem z turami postaci, ale numeruje je globalnie —
  // dopiero na tym da się zestawić obie strony obok siebie.
  const timeline: TurnSlice[] = [];
  const openTurn = (actor: string): TurnSlice => {
    const slice = { turn: timeline.length + 1, actor, side: null, damage: 0 };
    timeline.push(slice);
    return slice;
  };
  /**
   * Obrażenia dopisujemy do tury, która właśnie trwa. Gdy żadna jeszcze nie
   * padła, otwieramy turę tła: trucizna tyka w CZYJEJŚ turze, tylko że jej
   * nagłówek wyjechał już z bufora (przewidziany przypadek — log traci treść od
   * góry). Bez tego kwota przepadała po cichu i oś przestawała się zgadzać
   * z sumą zdarzeń.
   *
   * Aktora zostawiamy puściutkiego, bo naprawdę go nie znamy — `sideOf` zwróci
   * dla niego `null`, więc kolumna na osi jest neutralna, a nie przypisana
   * przypadkowej stronie.
   */
  const addToTurn = (amount: number) => {
    const slice = timeline.at(-1) ?? openTurn(BACKGROUND_ACTOR);
    slice.damage += amount;
  };

  /**
   * Kto komu ile zadał. Klucz sklejamy znakiem, który nie pada w nazwach
   * postaci — nick z myślnikiem czy kropką rozbiłby prostszy separator.
   */
  const edges = new Map<string, DamageEdge>();
  const addEdge = (source: string, target: string, amount: number) => {
    const key = `${source}\u0000${target}`;
    const edge = edges.get(key) ?? { source, target, damage: 0 };
    edge.damage += amount;
    edges.set(key, edge);
  };

  const deaths: Death[] = [];
  const fallen = new Set<string>();
  /**
   * Śmierć poznajemy po zejściu życia do zera — log nie ma linii „X ginie”.
   * Notujemy raz: kolejne linie martwej postaci (DoT dobijający do 0%) nie są
   * drugim zgonem.
   */
  const observeDeath = (key: string, hpPct: number | null) => {
    if (hpPct === null || hpPct > 0 || fallen.has(key)) return;
    fallen.add(key);
    deaths.push({ name: key, side: null, turn: Math.max(1, timeline.length) });
  };

  let lastActor: string | null = null;
  const beginTurn = (actor: string) => {
    if (actor === lastActor) return;
    get(actor).turns += 1;
    openTurn(actor);
    lastActor = actor;
  };
  /**
   * Nowa tura mimo tego samego aktora. Zapowiedź "X wykonuje Y." jest twardym
   * znacznikiem: bez niej dwie tury pod rząd tej samej postaci (gdy przeciwnik
   * stracił swoją) skleiłyby się w jedną.
   */
  const forceTurn = (actor: string) => {
    get(actor).turns += 1;
    openTurn(actor);
    lastActor = actor;
  };

  // Sprawcy log nie zna, ale POSZKODOWANEGO tak — zbieramy po nim, a na stronę
  // przeliczymy na końcu, gdy skład jest już kompletny.
  const unattributedDotByTarget = new Map<string, number>();
  let unattributedHealing = 0;
  let unknownLines = 0;
  /** Klasy `dmgX`, których nie umiemy nazwać — patrz `BattleStats`. */
  const unknownElements = new Set<string>();
  const noteElement = (element: string | null) => {
    if (element !== null && RE_RAW_ELEMENT.test(element)) unknownElements.add(element);
  };

  for (const event of events) {
    switch (event.kind) {
      case "attack": {
        const sourceKey = resolve(event.source, event.sourceHpPct);
        const targetKey = resolve(event.target, event.targetHpPct);
        beginTurn(sourceKey);
        // Obie strony ciosu niosą procent życia, więc obie mogą ujawnić zgon:
        // atakujący dobity DoT-em przed swoją turą i cel, który właśnie padł.
        observeDeath(sourceKey, event.sourceHpPct);
        observeDeath(targetKey, event.targetHpPct);
        const source = get(sourceKey);
        const target = get(targetKey);
        // Obie liczby ciosu idą pod jedną nazwę — to jedna akcja, nie dwie.
        const label = event.ability ?? PLAIN_ATTACK;
        // Użycia umiejętności bierzemy z linii "X wykonuje Y", bo tylko ona
        // odpowiada jednemu odpaleniu; ciosów pod tą nazwą bywa więcej.
        // Zwykły atak własnej linii nie ma, więc liczymy go tutaj — jeden
        // atak to jedno użycie, także gdy przepadł na uniku.
        if (event.ability === null && event.strike) {
          bumpCount(breakdownOf(sourceKey).abilityUses, PLAIN_ATTACK);
        }
        // Unik liczymy raz na atak, nie raz na liczbę obrażeń — inaczej ten sam
        // unik dawałby 1 u łowcy (jedna liczba) i 2 u tropiciela (dwie), więc
        // licznik nie dałby się porównywać między profesjami.
        if (event.hits.some((hit) => hit.dodged)) source.misses += 1;

        // Cios liczymy raz, choćby niósł kilka liczb (mag: zimno + błyskawica).
        // Własne obrażenia umiejętności nie są osobnym ciosem — lecą obok tego
        // z tej samej tury.
        const landed = event.hits.filter((hit) => !hit.dodged);
        if (event.strike && landed.length > 0) source.hits += 1;

        // Tylko CIOS bije rekord — `maxHit` jest zdefiniowany jako najsilniejsze
        // pojedyncze uderzenie. Własne obrażenia umiejętności (`strike: false`)
        // lecą obok ciosu w tej samej turze i nie są osobnym uderzeniem, więc
        // przy silnej Fuzji podstawiłyby pod rekord liczbę, której nikt nie dostał
        // jednym trafieniem.
        if (event.strike) {
          const total = landed.reduce((sum, hit) => sum + hit.applied, 0);
          if (total > source.maxHit) source.maxHit = total;
        }

        event.hits.forEach((hit) => {
          // Unik bywa częściowy: broń pomocnicza potrafi trafić mimo "-Unik",
          // a te obrażenia są prawdziwe i muszą wejść do sumy.
          if (hit.dodged) return;
          source.damageDealt += hit.applied;
          target.damageTaken += hit.applied;
          target.damageAbsorbed += hit.raw - hit.applied;
          if (hit.crit) source.crits += 1;
          addToTurn(hit.applied);
          addEdge(sourceKey, targetKey, hit.applied);

          addDamage(breakdownOf(sourceKey).dealt, label, hit.applied);
          // Po stronie otrzymanych liczy się i kto uderzył, i czym.
          addDamage(breakdownOf(targetKey).taken, `${sourceKey} · ${label}`, hit.applied);
          // Ten sam cios drugi raz, tym razem w dwóch szczeblach: napastnik,
          // a pod nim czym uderzył. Osobna struktura, nie rozbiór etykiety —
          // nazwa postaci może zawierać cokolwiek, łącznie z separatorem.
          addDamage(branchOf(breakdownOf(targetKey).takenBy, sourceKey), label, hit.applied);
          // Lustrzany szczebel po stronie zadających: pod celem, a w nim czym
          // padło. Ten sam cios, drugi kierunek — „na kim” zamiast „od kogo”.
          addDamage(branchOf(breakdownOf(sourceKey).dealtTo, targetKey), label, hit.applied);

          // Żywioł znany tylko z DOM-u gry; przy wklejonym tekście go nie ma.
          const type = hit.element ?? UNKNOWN_ELEMENT;
          noteElement(hit.element);
          addDamage(breakdownOf(sourceKey).dealtType, type, hit.applied);
          addDamage(breakdownOf(targetKey).takenType, type, hit.applied);
          // Ten sam żywioł zapisany pod ETYKIETAMI, które go niosły — po nich
          // widok dobiera barwę paska w rozbiciu. Trzy zapisy, bo ta sama akcja
          // stoi pod trzema nazwami: u zadającego, w gałęzi celu i w płaskim
          // rozbiciu przyjętych.
          noteType(sourceKey, label, type, hit.applied);
          noteType(targetKey, label, type, hit.applied);
          noteType(targetKey, `${sourceKey} · ${label}`, type, hit.applied);
        });

        // Ciosy dopisujemy po sumach, raz na zdarzenie, a nie raz na liczbę
        // obrażeń: "Lodowa strzała" to jeden cios niosący dystansowe i zimno,
        // więc pod nazwą umiejętności ma stać 1, a nie 2.
        //
        // Ten sam warunek co przy `source.hits`, i z tego samego powodu:
        // "Fuzja żywiołów" wchodzi dwoma zdarzeniami — własne obrażenia
        // umiejętności i właściwy cios — a to nadal jedno użycie i jeden cios.
        if (event.strike && landed.length > 0) {
          countStrike(breakdownOf(sourceKey).dealt, label);
          countStrike(breakdownOf(targetKey).taken, `${sourceKey} · ${label}`);
          countStrike(branchOf(breakdownOf(targetKey).takenBy, sourceKey), label);
          countStrike(branchOf(breakdownOf(sourceKey).dealtTo, targetKey), label);
        }
        // Przekrój po żywiole liczy się inaczej: tu pytanie brzmi "ile ciosów
        // niosło ten żywioł", a własne obrażenia umiejętności mają swój własny
        // ("nieuchronne" w Fuzji nie pada nigdzie indziej). Gdyby i je odciąć,
        // pozycja stałaby z obrażeniami i zerem ciosów.
        for (const type of new Set(landed.map((hit) => hit.element ?? UNKNOWN_ELEMENT))) {
          countStrike(breakdownOf(sourceKey).dealtType, type);
          countStrike(breakdownOf(targetKey).takenType, type);
        }
        // Ten sam efekt zapisujemy dwa razy, z dwóch perspektyw: pod tym, kto
        // go wyzwolił (bo to on ma go w ekwipunku), i pod tym, na kim się
        // odpalił. To dwa różne pytania i jedna liczba nie odpowiada na oba.
        for (const proc of event.procs) {
          const label = procLabel(proc);
          bumpCount(breakdownOf(sourceKey).procs, label);
          bumpCount(breakdownOf(targetKey).procsReceived, label);
        }
        break;
      }
      case "dot": {
        // Sprawcy szukamy po nazwie z logu — instancja celu nie zmienia tego,
        // kto stoi po drugiej stronie.
        const source = opponentOf(event.target);
        const targetKey = resolve(event.target, event.targetHpPct);
        get(targetKey).damageTaken += event.amount;
        observeDeath(targetKey, event.targetHpPct);
        // DoT tyka między turami, więc trafia do tury, która właśnie trwa.
        addToTurn(event.amount);
        if (source) addEdge(source, targetKey, event.amount);
        const effect = `${event.via} ${event.dotType}`;
        // Każde tyknięcie DoT-u to osobne wystąpienie — tu, w odróżnieniu od
        // ciosu, jedna linia niesie dokładnie jedną liczbę.
        const takenKey = source ? `${source} (${effect})` : effect;
        // Etykietą tykającego efektu jest on sam, więc rodzinę zna od razu.
        noteType(targetKey, effect, effect, event.amount);
        noteType(targetKey, takenKey, effect, event.amount);
        if (source) noteType(source, effect, effect, event.amount);
        addDamage(breakdownOf(targetKey).taken, takenKey, event.amount);
        countStrike(breakdownOf(targetKey).taken, takenKey);
        // DoT bez sprawcy nie ma napastnika, więc pierwszym szczeblem zostaje
        // sam efekt — "od trucizny" stoi wtedy obok postaci, bo tyle wiadomo.
        const branch = branchOf(breakdownOf(targetKey).takenBy, source ?? effect);
        addDamage(branch, effect, event.amount);
        countStrike(branch, effect);
        addDamage(breakdownOf(targetKey).takenType, effect, event.amount);
        countStrike(breakdownOf(targetKey).takenType, effect);
        if (source) {
          get(source).damageDealt += event.amount;
          addDamage(breakdownOf(source).dealt, effect, event.amount);
          countStrike(breakdownOf(source).dealt, effect);
          const branchTo = branchOf(breakdownOf(source).dealtTo, targetKey);
          addDamage(branchTo, effect, event.amount);
          countStrike(branchTo, effect);
          addDamage(breakdownOf(source).dealtType, effect, event.amount);
          countStrike(breakdownOf(source).dealtType, effect);
        } else {
          unattributedDotByTarget.set(
            targetKey,
            (unattributedDotByTarget.get(targetKey) ?? 0) + event.amount,
          );
        }
        break;
      }
      case "heal": {
        // Procent życia PO wyleczeniu — stąd `rising`. Gdy go nie ma (leczenie
        // potwora bez procentu), instancja bierze się po ostatniej aktywności,
        // tak jak dotąd.
        const targetKey = resolve(event.target, event.targetHpPct, true);
        get(targetKey).healingReceived += event.amount;
        // "Razy" w rozbiciu leczenia: jedna linia to jedno wyleczenie.
        const healLabel = event.ability ?? PLAIN_HEAL;
        addDamage(breakdownOf(targetKey).healed, healLabel, event.amount);
        countStrike(breakdownOf(targetKey).healed, healLabel);
        // Log nie podaje leczącego. Przy proc-ach (jest nazwa umiejętności)
        // leczy się sam trafiony; przy gołym "Przywrócono" nie wiadomo kto.
        if (event.ability !== null) get(targetKey).healingDone += event.amount;
        else unattributedHealing += event.amount;
        break;
      }
      case "turn-lost": {
        // Utrata tury to nadal tura tej postaci — po prostu bez akcji.
        const actorKey = resolve(event.actor, null);
        forceTurn(actorKey);
        get(actorKey).turnsLost += 1;
        break;
      }
      case "unknown":
        unknownLines += 1;
        break;
      case "move":
        beginTurn(resolve(event.actor, event.hpPct));
        break;
      case "ability": {
        const actorKey = resolve(event.actor, null);
        forceTurn(actorKey);
        bumpCount(breakdownOf(actorKey).abilityUses, event.name);
        break;
      }
      case "fight-start":
      case "fight-end":
      case "experience":
      case "info":
        break;
    }
  }

  // Stronę bierzemy ze składu; postać spoza składu zostaje z null. To tu każdy
  // uczestnik dostaje swój wpis, także ten, który przez całą walkę nic nie
  // zrobił — overlay ma go pokazać na zerach, nie pominąć.
  for (const seat of seats) {
    const actor = get(seat.key);
    actor.side ??= seat.side;
    actor.professionCode ??= seat.prof ?? null;
    actor.level ??= seat.level ?? null;
  }

  // Dominujący typ na etykietę — dopiero teraz, gdy wszystkie trafienia są już
  // policzone. Sortowanie po etykiecie, żeby wynik był powtarzalny.
  for (const [name, byLabel] of typeTally) {
    get(name).typeByLabel = [...byLabel]
      .map(([label, families]) => {
        const [top] = [...families].sort(
          (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pl"),
        );
        return { label, type: top![0] };
      })
      .sort((a, b) => a.label.localeCompare(b.label, "pl"));
  }

  for (const [name, breakdown] of breakdowns) {
    const actor = get(name);
    actor.dealtBy = byAmount(breakdown.dealt);
    actor.takenFrom = byAmount(breakdown.taken);
    actor.dealtByType = byAmount(breakdown.dealtType);
    actor.takenByType = byAmount(breakdown.takenType);
    actor.healedBy = byAmount(breakdown.healed);
    actor.procs = [...breakdown.procs.values()].sort((a, b) => b.count - a.count);
    actor.procsReceived = [...breakdown.procsReceived.values()].sort((a, b) => b.count - a.count);
    actor.abilityUses = [...breakdown.abilityUses.values()].sort((a, b) => b.count - a.count);
    // Napastnicy i cele składają się identycznie — jeden przepis na oba szczeble.
    const twoTier = (branches: Map<string, Map<string, DamageSource>>) =>
      [...branches]
        .map(([label, by]) => {
          const entries = byAmount(by);
          return {
            label,
            amount: entries.reduce((sum, entry) => sum + entry.amount, 0),
            hits: entries.reduce((sum, entry) => sum + entry.hits, 0),
            by: entries,
          };
        })
        .sort((a, b) => b.amount - a.amount);
    actor.takenFromBy = twoTier(breakdown.takenBy);
    actor.dealtToBy = twoTier(breakdown.dealtTo);
  }

  // Strony na osi tur i przy zgonach dopisujemy dopiero teraz: w trakcie pętli
  // skład bywa jeszcze nieznany, bo postać potrafi wejść do logu później.
  const sideOf = (name: string) => actors.get(name)?.side ?? null;
  for (const slice of timeline) slice.side = sideOf(slice.actor);
  for (const death of deaths) death.side = sideOf(death.name);

  // Ta sama zasada dla trucizny bez sprawcy: skoro wiadomo, KOMU tyka, to przy
  // filtrze składu przypis ma iść za poszkodowanym, a nie wisieć przy każdej
  // zakładce z tą samą liczbą.
  const unattributedDotDamage = { mine: 0, enemy: 0, loose: 0 };
  for (const [name, amount] of unattributedDotByTarget) {
    const side = sideOf(name);
    const bucket = side === null ? "loose" : side === 0 ? "mine" : "enemy";
    unattributedDotDamage[bucket] += amount;
    // Ta sama liczba zapisana też przy poszkodowanym: po wejściu w postać
    // przypis ma mówić o NIEJ, a nie o całej stronie.
    get(name).unattributedDotTaken += amount;
  }

  return {
    actors: [...actors.values()].sort((a, b) => b.damageDealt - a.damageDealt),
    unattributedDotDamage,
    unattributedHealing,
    ambiguousNames: ambiguousKeys,
    unknownLines,
    unknownElements: [...unknownElements].sort(),
    timeline,
    deaths,
    matrix: [...edges.values()].sort((a, b) => b.damage - a.damage),
  };
}

/**
 * Odwraca dwuszczeblowe rozbicie: „cel → czym” staje się „czym → w kogo”.
 *
 * Te same liczby, inny klucz pierwszego szczebla. Panel drąży zadane przez CEL,
 * ale pytanie „która umiejętność robi robotę” wymaga sumy po wszystkich celach —
 * a tego nie da się odczytać z listy celów bez dodawania w głowie.
 *
 * Liczymy z `dealtToBy`/`takenFromBy`, a nie z gotowego `dealtBy`, bo drugi
 * szczebel (komu ta umiejętność zadała) i tak musi wyjść z rozbicia po parze.
 * Jedno źródło znaczy, że nie da się kliknąć w wiersz, który nie ma czego
 * pokazać. `dealtBy` zostaje wyrocznią w testach — patrz `stats.test.ts`.
 */
export function invertBreakdown(tiers: AttackerBreakdown[]): AttackerBreakdown[] {
  const flipped = new Map<string, AttackerBreakdown>();

  for (const tier of tiers) {
    for (const leaf of tier.by) {
      const entry = flipped.get(leaf.label) ?? { label: leaf.label, amount: 0, hits: 0, by: [] };
      entry.amount += leaf.amount;
      entry.hits += leaf.hits;
      entry.by.push({ label: tier.label, amount: leaf.amount, hits: leaf.hits });
      flipped.set(leaf.label, entry);
    }
  }

  for (const entry of flipped.values()) entry.by.sort((a, b) => b.amount - a.amount);
  return [...flipped.values()].sort((a, b) => b.amount - a.amount);
}

/**
 * Czy wejście w tę pozycję pokaże cokolwiek nowego.
 *
 * Trucizna bez sprawcy stoi na pierwszym szczeblu pod nazwą EFEKTU (patrz
 * `stats.ts` przy DoT), więc po odwróceniu wychodzi „od trucizny → od trucizny”
 * — jeden wiersz powtarzający sam siebie. Za `UX.md §6`: liść bez danych się nie
 * podświetla i nie kusi kliknięciem.
 */
export function leadsDeeper(entry: AttackerBreakdown): boolean {
  if (entry.by.length === 0) return false;
  return !(entry.by.length === 1 && entry.by[0]!.label === entry.label);
}

/**
 * Szacuje maksymalne HP celu z obrażeń i spadku procentowego życia.
 *
 * Służy jako niezmiennik kontrolny: jeśli parser gubi trafienia, wynik
 * rozjeżdża się względem obrażeń policzonych bezpośrednio.
 *
 * Zwraca null, gdy procent życia w trakcie walki rośnie — wtedy albo cel się
 * leczył, albo (częściej) pod jedną nazwą kryją się dwie różne postacie
 * i szacowanie nie ma sensu.
 */
export function estimateMaxHp(events: BattleEvent[], target: string): number | null {
  let first: number | null = null;
  let previous: number | null = null;
  let last: number | null = null;
  let damage = 0;

  const observe = (hpPct: number) => {
    if (previous !== null && hpPct > previous) return false;
    first ??= hpPct;
    previous = hpPct;
    last = hpPct;
    return true;
  };

  for (const event of events) {
    if (event.kind === "attack" && event.target === target) {
      if (!observe(event.targetHpPct)) return null;
      for (const hit of event.hits) damage += hit.applied;
    } else if (event.kind === "dot" && event.target === target) {
      if (!observe(event.targetHpPct)) return null;
      damage += event.amount;
    }
  }

  if (first === null || last === null || first <= last) return null;
  return damage / ((first - last) / 100);
}
