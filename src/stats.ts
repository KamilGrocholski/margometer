import type { RosterEntry } from "./roster.ts";
import { UNKNOWN_ELEMENT, dotLabel, typeDisplay, typeFamily } from "./types.ts";
import type {
  ActorStats,
  AttackerBreakdown,
  BattleEvent,
  DamageSource,
  ProcCount,
} from "./types.ts";

/**
 * Wpis składu w postaci, w której liczy go agregacja — bez względu na źródło.
 *
 * `id` niesie WYŁĄCZNIE skład z gry; linia otwierająca go nie ma. To dlatego
 * rozdzielanie instancji po identyfikatorze wymaga OBU stron naraz — składu
 * z gry i zdarzeń z protokołu — i samo się wyłącza wszędzie indziej.
 */
type Seat = {
  id?: number;
  name: string;
  side: number;
  prof?: string | undefined;
  level?: number | undefined;
};

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
type NameRef = [name: string, hpPct: number | null, rising?: boolean, id?: number | undefined];

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
        [event.source, event.sourceHpPct, false, event.sourceId],
        [event.target, event.targetHpPct, false, event.targetId],
      ];
    case "dot":
      return [[event.target, event.targetHpPct, false, event.targetId]];
    case "move":
      return [[event.actor, event.hpPct, false, event.actorId]];
    // Leczenie jako jedyne PODNOSI życie, więc dopasowanie idzie od dołu —
    // patrz `rising` w `instanceResolver`.
    case "heal":
      return [[event.target, event.targetHpPct, true, event.targetId]];
    case "ability":
      return [[event.actor, null, false, event.actorId]];
    case "turn-lost":
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

  /**
   * NUMER INSTANCJI ODCZYTANY, NIE ZGADNIĘTY — `id` → pozycja w składzie.
   *
   * Protokół niesie `id` po obu stronach każdego zdarzenia, a skład z gry niesie
   * je przy każdym wpisie. Gdy obie strony są, rozdzielanie postaci o tej samej
   * nazwie przestaje być wnioskiem ze spadku życia i staje się odczytem.
   *
   * ⚠️ **NUMER IDZIE Z KOLEJNOŚCI SKŁADU, NIE Z KOLEJNOŚCI UJAWNIANIA** i to nie
   * jest szczegół. Heurystyka numeruje w kolejności, w jakiej log pokazuje
   * postacie — a log rośnie i przeliczamy go CAŁY przy każdej porcji, więc numer
   * potrafił się przesunąć między klatkami. Z pozycji w składzie jest stały,
   * a `seats` (budowane z tej samej kolejności) zgadza się z `resolve`
   * z definicji, a nie przypadkiem.
   */
  const indexById = new Map<string, Map<number, number>>();
  for (const participant of roster) {
    if (participant.id === undefined) continue;
    const wg = indexById.get(participant.name) ?? new Map<number, number>();
    indexById.set(participant.name, wg);
    if (!wg.has(participant.id)) wg.set(participant.id, wg.size);
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

  /**
   * Nazwy, które wolno rozdzielić po `id` — decyzja jest ZERO-JEDYNKOWA.
   *
   * Warunek jest potrójny i każdy człon ma powód: w składzie musi stać więcej
   * niż jeden wpis tej nazwy (inaczej nie ma czego rozdzielać), wszystkie te
   * wpisy muszą mieć `id` (skład z gry, nie z linii otwierającej), a KAŻDE
   * wystąpienie nazwy w zdarzeniach musi nieść `id` pasujący do składu.
   *
   * Ostatni człon jest tym, przez który to jest „wszystko albo nic": gdyby część
   * wystąpień szła po `id`, a część po spadku życia, ta sama postać dostawałaby
   * dwa różne numery w jednej walce — czyli błąd gorszy od tego, który naprawiamy.
   */
  const poId = new Set<string>();
  for (const [name, total] of counts) {
    if (total < 2) continue;
    const wg = indexById.get(name);
    if (wg === undefined || wg.size !== total) continue;
    poId.add(name);
  }
  for (const event of events) {
    for (const [name, , , id] of namesIn(event)) {
      if (!poId.has(name)) continue;
      if (id === undefined || !indexById.get(name)?.has(id)) poId.delete(name);
    }
  }

  // Przebieg rozpoznawczy: ile instancji każda nazwa faktycznie ujawni. Dopiero
  // to rozstrzyga, czy etykietą jest goła nazwa, czy "Nazwa #n". Nazwy w trybie
  // `id` go nie potrzebują — ich liczba wierszy stoi w składzie.
  const dry = track();
  const spawned = new Map<string, number>();
  for (const event of events) {
    for (const [name, hpPct, rising] of namesIn(event)) {
      if (poId.has(name)) continue;
      const index = dry(name, hpPct, rising);
      spawned.set(name, Math.max(spawned.get(name) ?? 0, index + 1));
    }
  }

  /** Ile wierszy dana nazwa dostanie. Ze składu z gry — tyle, ile postaci. */
  const rows = (name: string): number =>
    poId.has(name) || authoritative ? (counts.get(name) ?? 1) : (spawned.get(name) ?? 0);

  const label = (name: string, index: number): string =>
    rows(name) > 1 ? instanceLabel(name, index) : name;

  const live = track();
  const resolve = (
    name: string,
    hpPct: number | null,
    rising = false,
    id?: number | undefined,
  ): string => {
    if (poId.has(name) && id !== undefined) {
      const index = indexById.get(name)?.get(id);
      if (index !== undefined) return label(name, index);
    }
    return label(name, live(name, hpPct, rising));
  };

  /**
   * Skład z rozwiniętymi duplikatami — po jednym wpisie na wiersz.
   *
   * Ze składu z gry wpis dostaje KAŻDA postać, także ta, której log nigdy nie
   * wymieni: jej istnienie jest faktem, więc pusty wiersz nie jest zmyśleniem.
   * Ze składu z logu tylko te, które log ujawnił — tam pusty wiersz dla
   * drugiego duplikatu twierdziłby, że akurat ta postać nic nie zrobiła.
   */
  /**
   * Strona przypisana NAZWIE, nie wpisowi składu — `null`, gdy ta sama nazwa
   * stoi po obu stronach.
   *
   * Numer instancji nadaje `track()` w kolejności, w jakiej log ujawnia kolejne
   * postacie, a ta nie ma nic wspólnego z kolejnością składu. Przy „Wilk” po
   * obu stronach linia `Wilk(80%)` nie mówi więc, czy oberwał nasz, czy ich —
   * i to dotyczy KAŻDEJ instancji tej nazwy, także pierwszej. Wcześniej obie
   * dostawały stronę pierwszego pasującego wpisu: nie „nie wiadomo”, tylko
   * fałszywe twierdzenie. Ta sama zasada, co w `opponentOf` niżej.
   */
  const sideByName = new Map<string, number | null>();
  for (const participant of roster) {
    if (!sideByName.has(participant.name)) {
      sideByName.set(participant.name, participant.side);
    } else if (sideByName.get(participant.name) !== participant.side) {
      sideByName.set(participant.name, null);
    }
  }

  /**
   * Wpisy składu pogrupowane po nazwie, W KOLEJNOŚCI SKŁADU.
   *
   * ⚠️ Potrzebne, bo pętla niżej iteruje po składzie, a dla nazwy zdublowanej
   * zakłada WSZYSTKIE jej wiersze przy pierwszym napotkanym wpisie — kolejne są
   * pomijane przez `used`. Branie strony i profesji z tamtego jednego wpisu
   * dawało obu Wilkom stronę pierwszego z nich. Przy heurystyce to nie bolało,
   * bo strona i tak schodziła do `null`; w trybie `id` byłoby to twierdzenie,
   * i fałszywe.
   */
  const wpisyWgNazwy = new Map<string, Seat[]>();
  for (const participant of roster) {
    const lista = wpisyWgNazwy.get(participant.name) ?? [];
    wpisyWgNazwy.set(participant.name, lista);
    lista.push(participant);
  }

  const seats = (() => {
    const out: Array<{
      key: string;
      side: number | null;
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
        // Profesja i poziom zostają przy wpisie: przy nazwie po obu stronach to
        // i tak ten sam potwór, więc "Wilk 10x" jest prawdą, choć strona nie.
        // W trybie `id` wiersz `#n` to KONKRETNY wpis składu — ten n-ty
        // w kolejności. Strona, profesja i poziom idą więc z niego, a nie
        // z pierwszego wpisu o tej nazwie.
        const wpis = poId.has(participant.name)
          ? (wpisyWgNazwy.get(participant.name)?.[index] ?? participant)
          : participant;
        out.push({
          key,
          // ⚠️ W trybie `id` strona jest ODCZYTANA ze składu, więc `null` przy
          // nazwie stojącej po obu stronach przestaje być potrzebne — wiemy,
          // KTÓRA to instancja, więc wiemy i po czyjej stoi stronie.
          side: poId.has(participant.name)
            ? wpis.side
            : (sideByName.get(participant.name) ?? null),
          prof: wpis.prof,
          level: wpis.level,
        });
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
    // Nazwa rozdzielona po `id` NIE jest niepewna: numer jest odczytany
    // z protokołu, a nie wywnioskowany ze spadku życia. Gwiazdka przy takim
    // wierszu twierdziłaby, że liczbie nie ufamy — a ufamy.
    .filter(([name]) => !poId.has(name))
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
 * Etykieta zostawiana dla nierozpoznanego kodu `dmgX`. Kod wprost, bo to
 * jedyne, co o tym rodzaju obrażeń wiadomo.
 *
 * ⚠️ `[a-z0-9]`, nie `[a-z]` — i to jest naprawa, nie ozdoba. Czujka była
 * WĘŻSZA niż przestrzeń kodów, które mogą do niej dojść: trzeci cios tancerza
 * dostał kod `"3"`, czyli CYFRĘ (`THIRD_STRIKE_CODE` w `types.ts`). Przestrzeń
 * cyfr otworzyła się więc 2026‑08‑03, ale czujki nikt nie poszerzył: kod
 * cyfrowy dawał etykietę `dmg4`, która NIE pasowała do tego wzorca, więc nie
 * trafiała do `unknownElements` i nie zapalała ostrzeżenia w panelu.
 *
 * To jest dokładnie ten tryb awarii, którego `unknownElements` ma pilnować —
 * są one jedyną czujką na zmianę nazewnictwa żywiołów po stronie gry. Czujka
 * ślepa na połowę własnej przestrzeni nie jest czujką.
 */
const RE_RAW_ELEMENT = /^dmg[a-z0-9]+$/;

/** Leczenie bez nazwy umiejętności — log nie mówi, co je wywołało. */
const PLAIN_HEAL = "Regeneracja";
/**
 * Pierwszy szczebel rozbicia dla wszystkiego, czego log nikomu nie przypisuje.
 *
 * Ranking „OD KOGO" wymienia POSTACIE, więc tykający efekt bez sprawcy nie ma
 * prawa w nim stać pod własną nazwą — czytałoby się to jak jeszcze jeden
 * przeciwnik. Jedna pozycja zbiorcza mówi dokładnie tyle, ile log: „ktoś, ale
 * nie wiadomo kto", a CO w niej siedzi, widać po wejściu o szczebel niżej.
 *
 * Eksportowana, bo widok musi ją rozpoznać, żeby postawić ją na końcu listy
 * i odróżnić wizualnie od postaci — a porównywanie po literach w dwóch plikach
 * rozjeżdża się przy pierwszej zmianie nazwy.
 */
export const UNATTRIBUTED_SOURCE = "Bez sprawcy";

/**
 * Malejąco po kwocie, ale pozycja zbiorcza zawsze na końcu.
 *
 * To nie jest uczestnik rankingu, tylko reszta, której log nie rozdzielił —
 * wciśnięta między postacie po samej wielkości udawałaby jedną z nich. Jej
 * miejsce ma mówić „tu kończą się ci, o których coś wiadomo".
 *
 * Eksportowany, bo tę samą listę składa też sumowanie sesji (`mergeAttackers`),
 * a dwie kopie reguły rozjechałyby się dokładnie wtedy, gdy walk jest więcej
 * niż jedna — czyli tam, gdzie nikt by tego nie sprawdzał.
 */
export function byAmountUnattributedLast(
  a: { label: string; amount: number },
  b: { label: string; amount: number },
): number {
  if (a.label === UNATTRIBUTED_SOURCE) return 1;
  if (b.label === UNATTRIBUTED_SOURCE) return -1;
  return b.amount - a.amount;
}
/**
 * "+Zranienie (339)" — jedyny zmierzony proc, który nazywa NARAZ sprawcę
 * (stoi przy jego ciosie) i dokładną kwotę przyszłego tyknięcia.
 *
 * Dlatego tylko ten jeden wiąże DoT ze sprawcą wprost, z pominięciem zgadywania
 * po układzie stron: kwota daje się porównać z tyknięciem, więc wiązanie jest
 * SPRAWDZALNE, a nie oparte na kolejności linii. "+Głęboka rana" kwoty nie
 * podaje (jeden proc, tyknięcia 754 → 1131), a trucizna, ogień i błyskawice nie
 * mają w logu żadnego proca nakładającego — te zostają przy `opponentOf`.
 */
const RE_WOUND_PROC = /^Zranienie \((\d+)\)$/;
/** Typ DoT-a, przy którym wiązanie z proca ma sens — patrz `RE_WOUND_PROC`. */
const WOUND_DOT = "po zranieniu";

/**
 * Tykające efekty, przy których sprawcy NIE WOLNO zgadywać z układu stron.
 *
 * `opponentOf` opiera się na założeniu, którego nie wypowiada wprost: że efekt
 * przyszedł Z DRUGIEJ STRONY, więc przy jednym przeciwniku nie ma wątpliwości,
 * kto go nałożył. Dla trucizny, ognia i błyskawic to prawda. Dla ubytku życia
 * jest odwrotnie — pomiar w `docs/MECHANIKA.md` pokazuje, że linia „Stracono
 * −N punktów życia" tyka wyłącznie postaciom, które SAME rzuciły trującą mgłę,
 * czyli źródło stoi po tej samej stronie co cel.
 *
 * Bez tego wyjątku kwota lądowała na jedynym przeciwniku i nie było w tym ani
 * jednej prawdziwej liczby: na `2026-08-03_druzyna-vs-hildur-absorpcja` boss
 * dostawał 2 026 obrażeń, których nie zadał, a Łowcomir Kazrek i Png Holak
 * mieli w panelu napisane, że oberwali od niego 966 i 1 060 — czyli 100 % tego,
 * co stracili, choć boss nie tknął żadnego z nich ani razu.
 *
 * Zbiór, nie pojedyncza stała, bo to KATEGORIA: każdy kolejny efekt „z własnej
 * strony" ma tu dopisać jedną linię, a nie kolejny warunek w `case "dot"`.
 */
const SELF_INFLICTED_DOTS = new Set(["od ubytku życia"]);

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

/**
 * Pula bez sprawcy w rozbiciu na stronę tego, KOGO dotyczy.
 *
 * Sprawcy log nie podaje, ale poszkodowanego/leczonego już tak — a skoro tak, to
 * przy filtrze składu przypis ma iść za nim. Jedna liczba dla obu zakładek
 * mówiłaby „tyle samo u nas i u nich", czyli nieprawdę.
 *
 * `loose` to postacie spoza składu — te, których strony nie znamy.
 */
export type BySide = { mine: number; enemy: number; loose: number };

/**
 * DoT bez sprawcy. Ponad podział na strony dochodzi `types`: CO w tej puli
 * siedzi — bez tego przypis w panelu nazywał całość trucizną, choć trafiają tu
 * także rany i ogień.
 */
export type UnattributedDot = BySide & {
  types: Array<{ label: string; amount: number }>;
};

/** Suma po wszystkich stronach — tyle bez sprawcy padło w całej walce. */
export function totalBySide(pool: BySide): number {
  return pool.mine + pool.enemy + pool.loose;
}

/**
 * Co da się policzyć dla DOWOLNEGO zbioru walk — jednej albo całej sesji.
 *
 * Wszystko tutaj sumuje się przez sklejenie: obrażenia, rozbicia, procki,
 * ostrzeżenia o nierozpoznanym. Sesja to po prostu suma walk i nic tu nie traci sensu.
 */
export type Aggregate = {
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
  /**
   * Leczenie bez podanego źródła, w rozbiciu na stronę LECZONEGO — bo tę log
   * podaje, choć leczącego nie. Lustro `unattributedDotDamage`, tyle że bez
   * rodzajów: leczenie ma tu tylko dwa szyki i oba znaczą to samo.
   */
  unattributedHealing: BySide;
  /**
   * Wiersze, którym nie ufamy w pełni — overlay oznacza je gwiazdką. Dwa
   * przypadki, obie o tym samym dla patrzącego: liczba nie jest pewna.
   * Nazwa goła ("Wieczornica") — log nie rozdzielił dwóch postaci i wiersz
   * je sumuje. Nazwa z numerem ("Locha #1") — rozdzieliliśmy je wnioskując
   * ze spadku HP, a nie odczytując stan gry.
   */
  ambiguousNames: string[];
  /** Komunikaty, których dekoder nie zrozumiał. Niezerowe = statystyki niepełne. */
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
};

/**
 * Statystyki JEDNEJ walki.
 *
 * Ponad `Aggregate` dochodzi to, co jest własnością pojedynczego starcia i przez
 * sesję nie przechodzi: oś tur, zgony i macierz „kto kogo".
 */
export type BattleStats = Aggregate & {
  /**
   * Obrażenia w podziale na tury, po jednym wpisie na turę walki.
   *
   * Tura jest GLOBALNA, nie per postać: `ActorStats.turns` liczy tury danej
   * osoby, a tu chodzi o oś czasu walki, na której da się zestawić obie strony.
   */
  timeline: TurnSlice[];
};

/**
 * Pusty komplet jednej walki — punkt startowy panelu i sesji bez walk.
 *
 * ZAMROŻONY, bo jest współdzielonym singletonem: siedzi naraz w `Session`,
 * w `Overlay` i w dwóch argumentach pierwszego `render()`. Dopóki nikt go nie
 * mutuje, wszystko działa — a `Object.freeze` jest tańszy niż nadzieja, że tak
 * zostanie. Tablice też, bo zamrożenie obiektu jest płytkie.
 */
export const EMPTY_STATS: BattleStats = Object.freeze({
  actors: Object.freeze([] as ActorStats[]),
  unattributedDotDamage: Object.freeze({
    mine: 0,
    enemy: 0,
    loose: 0,
    types: Object.freeze([] as UnattributedDot["types"]),
  }),
  unattributedHealing: Object.freeze({ mine: 0, enemy: 0, loose: 0 }),
  ambiguousNames: Object.freeze([] as string[]),
  unknownLines: 0,
  unknownElements: Object.freeze([] as string[]),
  timeline: Object.freeze([] as TurnSlice[]),
}) as BattleStats;

/** Jedna tura walki widziana z góry: ile poszło z której strony. */
export type TurnSlice = {
  /** Numer tury, od 1. */
  turn: number;
  /** Kto działał w tej turze. */
  actor: string;
  side: number | null;
  damage: number;
};

function blank(name: string): ActorStats {
  return {
    name,
    side: null,
    inRoster: false,
    professionCode: null,
    level: null,
    typeByLabel: [],
    damageDealt: 0,
    damageTaken: 0,
    damageAbsorbed: 0,
    damageBlocked: 0,
    damageWeakened: 0,
    healingDone: 0,
    healingReceived: 0,
    hits: 0,
    misses: 0,
    partialMisses: 0,
    crits: 0,
    superCrits: 0,
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
    unattributedDotTypes: [],
    unattributedHealingReceived: 0,
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
        id: entry.id,
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
  /** To samo w rozbiciu na rodzaj — po to, żeby stopka mówiła, CO w puli jest. */
  const unattributedDotTypes = new Map<string, number>();
  /** To samo w rozbiciu na poszkodowanego — przypis zmienia zakres z widokiem. */
  const unattributedDotTypesByTarget = new Map<string, Map<string, number>>();
  /**
   * Ostatnie „+Zranienie (N)" nałożone na cel — sprawca i zapowiedziana kwota.
   * Jeden proc obejmuje kilka tyknięć pod rząd i obowiązuje aż do następnego na
   * ten sam cel, więc wpisu nie kasujemy po użyciu, tylko nadpisujemy.
   */
  const woundBy = new Map<string, { source: string; amount: number }>();
  // Leczącego log nie podaje, ale LECZONEGO tak — zbieramy po nim, a na stronę
  // przeliczymy na końcu, dokładnie tak samo jak przy tykających obrażeniach.
  const unattributedHealingByTarget = new Map<string, number>();
  let unknownLines = 0;
  /** Klasy `dmgX`, których nie umiemy nazwać — patrz `BattleStats`. */
  const unknownElements = new Set<string>();
  const noteElement = (element: string | null) => {
    if (element !== null && RE_RAW_ELEMENT.test(element)) unknownElements.add(element);
  };

  for (const event of events) {
    switch (event.kind) {
      case "attack": {
        const sourceKey = resolve(event.source, event.sourceHpPct, false, event.sourceId);
        const targetKey = resolve(event.target, event.targetHpPct, false, event.targetId);
        beginTurn(sourceKey);
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
        // Cios liczymy raz, choćby niósł kilka liczb (mag: zimno + błyskawica).
        // Własne obrażenia umiejętności nie są osobnym ciosem — lecą obok tego
        // z tej samej tury.
        const landed = event.hits.filter((hit) => !hit.dodged);
        if (event.strike && landed.length > 0) source.hits += 1;

        // Unik liczymy raz na atak, nie raz na liczbę obrażeń — inaczej ten sam
        // unik dawałby 1 u łowcy (jedna liczba) i 2 u tropiciela (dwie), więc
        // licznik nie dałby się porównywać między profesjami.
        //
        // Pełny i częściowy idą do OSOBNYCH pól, bo odpowiadają na różne pytania.
        // Atak, w którym broń główna przepadła, a pomocnicza trafiła, jest
        // jednocześnie ciosem — doliczony do `misses` kazałby czytelnikowi
        // policzyć go dwa razy („ciosy 12 · uniki 2" przy dwunastu atakach).
        // Dzięki rozdzieleniu `hits + misses` to dokładnie liczba ataków.
        //
        // Strażnik `event.strike` jest tu z tego samego powodu, co przy `hits`:
        // własne obrażenia umiejętności nie są atakiem. Dziś nic nie zmienia
        // (te zdarzenia mają `dodged: false` na sztywno), ale asymetria między
        // dwoma licznikami tej samej rzeczy prosi się o regresję.
        if (event.strike && landed.length < event.hits.length) {
          if (landed.length === 0) source.misses += 1;
          else source.partialMisses += 1;
        }

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
          // "Cios bardzo krytyczny" stoi w logu OBOK zwykłego kryta, nie
          // zamiast niego — dlatego bez `else`. Gdyby kiedyś przyszedł sam,
          // wpadnie tu i tak, a `superCrits > crits` zapali test niezmiennika.
          if (hit.superCrit) source.superCrits += 1;
          addToTurn(hit.applied);

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
          // Przekrój po typie idzie po RODZINACH (`typeDisplay`), a nie po
          // surowych etykietach: inaczej ta sama rzecz stoi w nim dwa razy —
          // „ogień" z klasy CSS obok „od ognia" z tykającego efektu. Rodzinę
          // dla BARWY liczy `noteType` niżej, z etykiety surowej; obie drogi
          // kończą się w tym samym `typeFamily`.
          addDamage(breakdownOf(sourceKey).dealtType, typeDisplay(type), hit.applied);
          addDamage(breakdownOf(targetKey).takenType, typeDisplay(type), hit.applied);
          // Ten sam żywioł zapisany pod ETYKIETAMI, które go niosły — po nich
          // widok dobiera barwę paska w rozbiciu. Trzy zapisy, bo ta sama akcja
          // stoi pod trzema nazwami: u zadającego, w gałęzi celu i w płaskim
          // rozbiciu przyjętych.
          noteType(sourceKey, label, type, hit.applied);
          noteType(targetKey, label, type, hit.applied);
          noteType(targetKey, `${sourceKey} · ${label}`, type, hit.applied);
        });

        // Blok należy do CELU, choć log podaje go w bloku ciosu napastnika:
        // "Zablokowanie 47 obrażeń" mówi, ile zdjęła TARCZA bitego. Raz na
        // zdarzenie, nie raz na trafienie — jedna linia opisuje cały cios,
        // choćby niósł dwie liczby.
        if (event.blocked !== null) target.damageBlocked += event.blocked;

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
        //
        // Zbiór liczy się po RODZINACH, tak jak klucz wyżej: cios tancerza niesie
        // „fizyczne" i „broń pomocniczą", czyli dwie etykiety JEDNEJ rodziny —
        // po surowych nazwach ten sam cios wpadłby do „Broni" dwa razy.
        for (const type of new Set(landed.map((hit) => typeDisplay(hit.element ?? UNKNOWN_ELEMENT)))) {
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
          // Jedyny proc, który nazywa i sprawcę, i kwotę przyszłego tyknięcia.
          const wound = RE_WOUND_PROC.exec(proc);
          if (wound) woundBy.set(targetKey, { source: sourceKey, amount: parseInt(wound[1]!, 10) });
        }
        break;
      }
      case "dot": {
        const targetKey = resolve(event.target, event.targetHpPct, false, event.targetId);
        // Dwie postacie tej samej nazwy. SUROWA rozstrzyga o wiązaniu, bo musi
        // pasować do `WOUND_DOT`, czyli do zapisu z logu; wygładzona idzie do
        // panelu. Rozdzielone, bo pomylenie ich zrywa wiązanie „+Zranienie (N)"
        // po cichu — kwota nadal by się zgadzała, tylko nikt by o nią nie pytał.
        const rawEffect = `${event.via} ${event.dotType}`;
        const effect = dotLabel(event.via, event.dotType);
        // Zranienie ma w logu sprawcę WPROST — proc "+Zranienie (N)" stoi przy
        // jego ciosie i zapowiada kwotę tyknięcia. Zgodność kwoty jest tu
        // warunkiem, nie ozdobą: bez niej wiązalibyśmy po samej kolejności
        // linii, czyli tak samo na wiarę jak przy truciźnie.
        //
        // Reszta rodzajów nie ma czego z czym wiązać, więc zostaje przy
        // zgadywaniu z układu stron: sprawca jest znany tylko wtedy, gdy po
        // drugiej stronie stoi dokładnie jeden przeciwnik. Pyta się o niego po
        // NAZWIE z logu, nie po kluczu instancji — instancja celu nie zmienia
        // tego, kto stoi po drugiej stronie.
        const wound = rawEffect === WOUND_DOT ? woundBy.get(targetKey) : undefined;
        const source = SELF_INFLICTED_DOTS.has(rawEffect)
          ? // Świadome „nie wiadomo": efekt idzie z tej samej strony co cel,
            // więc reguła jednego przeciwnika by tu skłamała — patrz komentarz
            // przy `SELF_INFLICTED_DOTS`.
            null
          : wound && wound.amount === event.amount
            ? wound.source
            : opponentOf(event.target);
        get(targetKey).damageTaken += event.amount;
        // "(osłabione o 25%)" — kwota w logu stoi już PO osłabieniu, więc pełne
        // tyknięcie wychodzi z dzielenia, a różnica jest tym, co osłabienie
        // zdjęło. Sprawdzone pomiarem: odtworzona baza trafia w tik tego
        // samego DoT-a BEZ osłabienia szesnaście razy na szesnaście, z błędem
        // do 2 % — bierze się on z tego, że gra podaje procent zaokrąglony do
        // liczby całkowitej. Dlatego to osobne pole, a nie dopisek do
        // `damageAbsorbed`, które jest wyliczone wprost z dwóch liczb logu.
        //
        // Zakres 0 < p < 100 jest strażnikiem, nie ozdobą: "osłabione o 100%"
        // dałoby dzielenie przez zero, a takiej linii nie było w żadnej zmierzonej walce, więc
        // nie wiadomo nawet, czy gra ją w ogóle pisze.
        const weakened = event.weakenedPct;
        if (weakened !== null && weakened > 0 && weakened < 100) {
          const full = Math.round(event.amount / (1 - weakened / 100));
          get(targetKey).damageWeakened += full - event.amount;
        }
        // DoT tyka między turami, więc trafia do tury, która właśnie trwa.
        addToTurn(event.amount);
        // Każde tyknięcie DoT-u to osobne wystąpienie — tu, w odróżnieniu od
        // ciosu, jedna linia niesie dokładnie jedną liczbę.
        const owner = source ?? UNATTRIBUTED_SOURCE;
        const takenKey = `${owner} (${effect})`;
        // Etykietą tykającego efektu jest on sam, więc rodzinę zna od razu.
        noteType(targetKey, effect, effect, event.amount);
        noteType(targetKey, takenKey, effect, event.amount);
        if (source) noteType(source, effect, effect, event.amount);
        addDamage(breakdownOf(targetKey).taken, takenKey, event.amount);
        countStrike(breakdownOf(targetKey).taken, takenKey);
        // Sprawcy log nie zna, ale wiersz na pierwszym szczeblu musi być czymś.
        // Wcześniej stawał nim SAM EFEKT, więc „od trucizny" siadało w rankingu
        // „OD KOGO" między postaciami, jakby nią było — i prowadziło w ślepy
        // zaułek, bo szczebel niżej powtarzał tę samą nazwę. Teraz wszystko bez
        // sprawcy zbiera się pod jedną pozycją, a to, CO w niej siedzi, wychodzi
        // dopiero po wejściu w nią.
        const branch = branchOf(breakdownOf(targetKey).takenBy, owner);
        addDamage(branch, effect, event.amount);
        countStrike(branch, effect);
        addDamage(breakdownOf(targetKey).takenType, typeDisplay(effect), event.amount);
        countStrike(breakdownOf(targetKey).takenType, typeDisplay(effect));
        if (source) {
          get(source).damageDealt += event.amount;
          addDamage(breakdownOf(source).dealt, effect, event.amount);
          countStrike(breakdownOf(source).dealt, effect);
          const branchTo = branchOf(breakdownOf(source).dealtTo, targetKey);
          addDamage(branchTo, effect, event.amount);
          countStrike(branchTo, effect);
          addDamage(breakdownOf(source).dealtType, typeDisplay(effect), event.amount);
          countStrike(breakdownOf(source).dealtType, typeDisplay(effect));
        } else {
          // Rodzaj idzie razem z kwotą: bez niego stopka nazywa TRUCIZNĄ całą
          // pulę, w której siedzi też ogień i rany.
          unattributedDotTypes.set(effect, (unattributedDotTypes.get(effect) ?? 0) + event.amount);
          // Rodzaj zapisany TAKŻE przy poszkodowanym. Przypis w panelu zmienia
          // zakres razem z widokiem (postać, strona, cała walka), a rodzaje szły
          // dotąd zawsze z całej walki — nawias potrafił być większy od liczby,
          // którą rzekomo rozbijał.
          const byTypeForTarget = unattributedDotTypesByTarget.get(targetKey) ?? new Map();
          unattributedDotTypesByTarget.set(targetKey, byTypeForTarget);
          byTypeForTarget.set(effect, (byTypeForTarget.get(effect) ?? 0) + event.amount);
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
        const targetKey = resolve(event.target, event.targetHpPct, true, event.targetId);
        get(targetKey).healingReceived += event.amount;
        // "Razy" w rozbiciu leczenia: jedna linia to jedno wyleczenie.
        const healLabel = event.ability ?? PLAIN_HEAL;
        addDamage(breakdownOf(targetKey).healed, healLabel, event.amount);
        countStrike(breakdownOf(targetKey).healed, healLabel);
        // Log nie podaje leczącego — najwyżej tyle, że leczony i leczący to ta
        // sama postać (proc, samoratunek). Tylko wtedy wolno komuś tę kwotę
        // dopisać; "Uleczono X o N" niesie nazwę umiejętności, ale rzucił ją
        // ktoś inny, więc mimo nazwy idzie do puli nierozdzielonej.
        if (event.self) get(targetKey).healingDone += event.amount;
        else {
          unattributedHealingByTarget.set(
            targetKey,
            (unattributedHealingByTarget.get(targetKey) ?? 0) + event.amount,
          );
        }
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
        beginTurn(resolve(event.actor, event.hpPct, false, event.actorId));
        break;
      case "ability": {
        const actorKey = resolve(event.actor, null, false, event.actorId);
        forceTurn(actorKey);
        bumpCount(breakdownOf(actorKey).abilityUses, event.name);
        break;
      }
      case "fight-start":
      case "fight-end":
      case "info":
        break;
    }
  }

  // Stronę bierzemy ze składu; postać spoza składu zostaje z null. To tu każdy
  // uczestnik dostaje swój wpis, także ten, który przez całą walkę nic nie
  // zrobił — overlay ma go pokazać na zerach, nie pominąć.
  for (const seat of seats) {
    const actor = get(seat.key);
    actor.inRoster = true;
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
        .sort(byAmountUnattributedLast);
    actor.takenFromBy = twoTier(breakdown.takenBy);
    actor.dealtToBy = twoTier(breakdown.dealtTo);
  }

  // Strony na osi tur i przy zgonach dopisujemy dopiero teraz: w trakcie pętli
  // skład bywa jeszcze nieznany, bo postać potrafi wejść do logu później.
  const sideOf = (name: string) => actors.get(name)?.side ?? null;
  for (const slice of timeline) slice.side = sideOf(slice.actor);

  // Ta sama zasada dla trucizny bez sprawcy: skoro wiadomo, KOMU tyka, to przy
  // filtrze składu przypis ma iść za poszkodowanym, a nie wisieć przy każdej
  // zakładce z tą samą liczbą.
  const unattributedDotDamage: UnattributedDot = {
    mine: 0,
    enemy: 0,
    loose: 0,
    types: [...unattributedDotTypes]
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount),
  };
  const bucketOf = (name: string) => {
    const side = sideOf(name);
    return side === null ? "loose" : side === 0 ? "mine" : "enemy";
  };
  for (const [name, amount] of unattributedDotByTarget) {
    unattributedDotDamage[bucketOf(name)] += amount;
    // Ta sama liczba zapisana też przy poszkodowanym: po wejściu w postać
    // przypis ma mówić o NIEJ, a nie o całej stronie. Rodzaje idą tą samą
    // drogą, żeby nawias nie rozbijał liczby z innego zakresu niż własny.
    get(name).unattributedDotTaken += amount;
    get(name).unattributedDotTypes = [...(unattributedDotTypesByTarget.get(name) ?? [])]
      .map(([label, typeAmount]) => ({ label, amount: typeAmount }))
      .sort((a, b) => b.amount - a.amount);
  }

  // Leczenie bez leczącego dzieli się dokładnie tak samo — po LECZONYM. Dopóki
  // była to jedna liczba, filtr „My"/„Oni" pokazywał na obu zakładkach to samo,
  // a w widoku postaci przypis znikał zupełnie, choć to właśnie ona tę kwotę
  // dostała.
  const unattributedHealing: BySide = { mine: 0, enemy: 0, loose: 0 };
  for (const [name, amount] of unattributedHealingByTarget) {
    unattributedHealing[bucketOf(name)] += amount;
    get(name).unattributedHealingReceived += amount;
  }

  return {
    actors: [...actors.values()].sort((a, b) => b.damageDealt - a.damageDealt),
    unattributedDotDamage,
    unattributedHealing,
    ambiguousNames: ambiguousKeys,
    unknownLines,
    unknownElements: [...unknownElements].sort(),
    timeline,
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

  // Ten sam komparator co przy składaniu `takenFromBy` — inaczej pozycja
  // zbiorcza po odwróceniu ląduje w środku listy, z kreską odcinającą nad sobą
  // i nazwanymi napastnikami pod spodem. Miejsce ma mówić, gdzie kończą się ci,
  // o których coś wiadomo, więc musi to mówić na KAŻDEJ drodze do listy.
  for (const entry of flipped.values()) entry.by.sort(byAmountUnattributedLast);
  return [...flipped.values()].sort(byAmountUnattributedLast);
}

/**
 * Czy wejście w tę pozycję pokaże cokolwiek nowego.
 *
 * Pozycja, pod którą stoi wyłącznie ona sama, jest liściem — wejście w nią
 * pokazałoby wiersz powtarzający własną nazwę. Za `UX.md §6`: liść bez danych
 * się nie podświetla i nie kusi kliknięciem.
 *
 * Historycznie wyzwalała to trucizna bez sprawcy, która stała na pierwszym
 * szczeblu pod nazwą EFEKTU. Odkąd zbiera się pod `UNATTRIBUTED_SOURCE`, oba
 * szczeble mówią co innego i ten konkretny przypadek nie zachodzi — reguła
 * zostaje, bo dotyczy KSZTAŁTU rozbicia, nie trucizny.
 */
export function leadsDeeper(entry: AttackerBreakdown): boolean {
  if (entry.by.length === 0) return false;
  return !(entry.by.length === 1 && entry.by[0]!.label === entry.label);
}

