import {
  ELEMENT_MARKER,
  FIGHT_START_TEXT,
  type BattleEvent,
  type Hit,
  type Participant,
} from "./types.ts";

/**
 * Litera z klasy `dmgX` w DOM gry. Fizycznych obrażeń gra tak nie znakuje.
 *
 * UWAGA: to NIE jest taksonomia żywiołów, choć nazwa na to wskazuje. Gra wrzuca
 * w tę jedną klasę odpowiedzi na trzy różne pytania i wybiera JEDNĄ z nich na
 * liczbę — czym oberwałeś, czym uderzono i w ilu naraz:
 *
 * - **żywioł**: `f`, `l`, `c`
 * - **broń/slot**: brak litery (zwarcie), `d` (dystans), `o` (broń pomocnicza)
 * - **zasięg**: `g` (globalne, czyli we WSZYSTKICH)
 * - **osobne**: `a` (nieuchronne)
 *
 * Skutek praktyczny: przy `dmgg` i `dmgo` gra podaje zasięg albo slot ZAMIAST
 * żywiołu, więc żywiołu tych liczb po prostu nie znamy. Etykieta mówi wtedy to,
 * co log naprawdę powiedział, a nie to, o co pytaliśmy.
 */
const ELEMENTS: Record<string, string> = {
  f: "ogień",
  l: "błyskawica",
  c: "zimno",
  // Klasa `dmg` bez litery — obrażenia broni bez żywiołu. W korpusie wyłącznie
  // od profesji walczących w zwarciu (wojownik, paladyn, tancerz ostrzy).
  p: "fizyczne",
  // `dmga` niosą linie własnych obrażeń umiejętności (Fuzja żywiołów,
  // Wycieńczająca strzała). Opisy obu mówią "obrażenia nieuchronne", stąd
  // nazwa — to wniosek z opisów, nie dosłowny zapis z logu.
  a: "nieuchronne",
  // `dmgd` wyłącznie od łowcy i tropiciela, `dmg` wyłącznie od trzech profesji
  // zwarcia — 686 liczb w korpusie, zero przecięć. To oś BRONI, nie żywiołu.
  d: "dystansowe",
  // `dmgo` stoi zawsze jako druga liczba u tancerza ostrzy, a proc
  // "+Cios krytyczny broni pomocniczej" podbija wyłącznie ją (z procem 886-1007,
  // bez proca 611-699, zero zachodzenia). Jedyna nazwa w tej mapie zapisana
  // w logu DOSŁOWNIE, a nie wywnioskowana.
  o: "broń pomocnicza",
  // `dmgg` pada, gdy umiejętność bije we WSZYSTKICH naraz — samo "w kilku" nie
  // wystarcza: `Szarża zastępcy` (5 celów z 10), `Bicie rogu` (3) i `Osobisty
  // rozrachunek` (2) niosą zwykłe `dmg`, a `Śpiew zagłady` (10 z 10) `dmgg`.
  // Nazwa z terminologii gry; w dokumentacji mechaniki walk jej NIE MA, więc
  // opiera się na tym zestawieniu i na wiedzy o grze, nie na cytacie.
  g: "globalne",
};

/**
 * Znacznik żywiołu niesie DOKŁADNIE jedną literę (patrz `extractText`), więc
 * `[a-z]` bez plusa. Z plusem zachłanne dopasowanie zjadało pierwszą literę
 * następnego słowa, gdy po liczbie nie było spacji.
 */
const RE_ELEMENT = new RegExp(`${ELEMENT_MARKER}([a-z])`, "g");
const RE_DAMAGE_VALUE = new RegExp(`(-?\\d+)(?:${ELEMENT_MARKER}([a-z]))?`, "g");

/** Tekst bez znaczników — wszystko poza dwiema liniami obrażeń widzi tę wersję. */
function clean(text: string): string {
  return text.replace(RE_ELEMENT, "");
}

/** Nazwa aktora + jego HP w procentach, np. `Magister Kazrek(0.01%)`. */
const ACTOR = String.raw`(.+?)\((\d+(?:[.,]\d+)?)%\)`;
/**
 * Procent w treści komunikatu tła. Ułamek jest realny: leczenie grupowe potrafi
 * podać "22.5% życia", bo procent liczy się z czegoś, co samo bywa ułamkiem.
 *
 * Świadomie NIE wchodzi do `(osłabione o (\d+)%)` w `RE_DOT`/`RE_DOT_TAKEN`:
 * tamta grupa idzie do `parseInt`, więc poszerzenie obcięłoby "12.5" do "12" po
 * cichu. Tam ułamek ma zostać nieznaną linią — głośno.
 */
const PCT = String.raw`\d+(?:[.,]\d+)?`;

const RE_FIGHT_START = new RegExp(`^${FIGHT_START_TEXT} (.+)$`);
const RE_PARTICIPANT = /(.+?)\s\((\d+)([a-zA-Z])\)/g;
/**
 * Końcówka rodzaju w czasowniku akcji. Cudzą postać log opisuje formą
 * bezpieczną ("uderzył(a)"), ale o WŁASNEJ pisze wprost — u właścicielki
 * będzie "uderzyła". Fixture'y mają samych właścicieli mężczyzn, więc nie da
 * się na nich tego rozstrzygnąć; awaria byłaby jednak całkowita, bo bez tej
 * alternatywy KAŻDA linia akcji postaci kobiecej leci w `unknown`.
 *
 * Ten sam alfabet, co w `RE_VICTORY`/`RE_DEFEAT`, które odmieniają od dawna —
 * niespójność była wewnętrzna, nie wynikała z formatu logu.
 */
const GENDER = String.raw`(?:a|o|\(a\))?`;
const RE_ATTACK = new RegExp(`^${ACTOR}\\s+uderzył${GENDER} z siłą\\s+(.+)$`);
const RE_TAKEN = new RegExp(
  `^${ACTOR}\\s+otrzymał${GENDER}\\s+(.+?)\\s+obrażeń$`,
);
// Modyfikator zaczyna się od + lub -. Po znaku bywa liczba ("+14 energii"),
// więc linie niosące obrażenia muszą być sprawdzane WCZEŚNIEJ niż ta. Wymóg
// litery zostawia czujkę na linie czysto liczbowe, gdyby format się zmienił.
const RE_MODIFIER = /^[+-]\s*(.*\p{L}.*)$/u;
/**
 * Procent życia w treści linii. Niesie go KAŻDE pełne zdarzenie logu (cios,
 * trucizna, ruch) i żaden modyfikator — te są gołymi etykietami ("Unik",
 * "Klątwa", "Zablokowanie 47 obrażeń").
 *
 * Stąd zakaz: bez niego `RE_MODIFIER` był catch-allem i połykał jako proc
 * dowolną niezrozumianą linię zaczynającą się od znaku — w tym linię własnych
 * obrażeń umiejętności bez zapowiedzi ("-507 obrażeń otrzymał(a) X(75%)").
 * Kwota przepadała, a czujka `unknown` — jedyny sygnał zmiany formatu — na tej
 * całej klasie linii nie odpalała.
 *
 * `\S` przed nawiasem, bo bez niego strażnik odrzucał JAKĄKOLWIEK linię
 * z procentem w nawiasie — w tym proca zapisanego "+Wampiryzm (10%)", który
 * rozpadał się wtedy na trzy `unknown` (cios, modyfikator, linia obrażeń)
 * i gubił całą kwotę ciosu. Zmierzone na korpusie: wszystkie **2794** linie
 * niosące `(N%)` mają nawias przyklejony do nazwy postaci, ani jedna nie ma
 * przed nim spacji. Odstęp jest więc wolnym rozróżnieniem: życie przykleja się
 * do nazwy, wartość efektu stoi po spacji.
 */
const RE_CARRIES_HP = /\S\(\d+(?:[.,]\d+)?%\)/;

/**
 * Treść modyfikatora albo null, gdy linia nim nie jest. Jedno miejsce na tę
 * decyzję, bo pytają o nią dwa konteksty: środek bloku ataku i modyfikator
 * stojący luzem.
 */
function modifierOf(line: string): string | null {
  if (RE_CARRIES_HP.test(line)) return null;
  const match = RE_MODIFIER.exec(line);
  return match ? match[1]!.trim().replace(/\.$/, "") : null;
}
/** "wf agar psk wykonuje Podwójne trafienie." — zapowiedź umiejętności. */
const RE_ABILITY_USE = /^(.+?) wykonuje (.+?)\.?$/;
/** Obrażenia samej umiejętności: "-507 obrażeń otrzymał(a) X(75.08%)." */
const RE_ABILITY_DAMAGE = new RegExp(
  `^[+-]?(\\d+)\\s+obrażeń otrzymał${GENDER}\\s+${ACTOR}\\.?$`,
);
/** "X(80.00%) otrzymał 162 obrażeń od błyskawic." — inny szyk niż RE_DOT. */
const RE_DOT_TAKEN = new RegExp(
  `^${ACTOR}\\s+otrzymał${GENDER}\\s+(\\d+)\\s*(?:\\(osłabione o (\\d+)%\\))?\\s*obrażeń (od|po) (.+?)\\.?$`,
);
// Kropka na końcu jest opcjonalna w KAŻDYM szyku leczenia — tak jak w `RE_DOT`
// i `RE_MOVE`. Bez niej "…życia X(93.01%)." nie tylko nie pasowało: goły szyk
// `RE_HEAL_PLAIN` łykał wtedy kropkę i procent do NAZWY, więc w panelu stawała
// osobna postać-widmo "X(93.01%).".
const RE_HEAL_ABILITY = new RegExp(
  `^(.+?):\\s*zregenerowano\\s+(\\d+)\\s+punktów życia\\s+${ACTOR}\\.?$`,
);
/** Leczenie w szyku "X(38.00%): Ostatni ratunek, zregenerowano 3056 ...". */
const RE_HEAL_SELF = new RegExp(
  `^${ACTOR}:\\s*(.+?),\\s*zregenerowano\\s+(\\d+)\\s+punktów życia\\.?$`,
);
// HP% celu bywa nieobecne — leczenie potwora (np. bossa) log podaje bez procenta:
// "Przywrócono 1847 punktów życia Regulus Mętnooki". Dlatego nie ${ACTOR}, tylko
// nazwa z opcjonalnym procentem.
const RE_HEAL_PLAIN = new RegExp(
  `^Przywrócono\\s+(\\d+)\\s+punktów życia\\s+(.+?)(?:\\((\\d+(?:[.,]\\d+)?)%\\))?\\.?$`,
);
/**
 * "Uleczono Zsz Przeworsk o 11937 punktów życia." — leczenie KIEROWANE: kwota
 * bezwzględna, nazwany cel i ani słowa o tym, kto i czym leczył. Nazwę
 * umiejętności da się wziąć wyłącznie z zapowiedzi stojącej nad tą linią, stąd
 * `ability` wpychane do `sideEvent` z zewnątrz.
 *
 * Od sąsiedniego "Uleczono sojuszników o 22.5% życia." (zostaje w `RE_INFO`)
 * odróżnia je "punktów życia" kontra "% życia" — tamto niesie procent i cel
 * zbiorowy, więc nie ma czego i komu przypisać.
 *
 * Leniwe `(.+?)\s+o\s+` rozcina na pierwszym " o ", po którym stoją już tylko
 * cyfry i "punktów życia" do końca linii. Nazwa zawierająca " o " jest
 * bezpieczna; nazwa KOŃCZĄCA się na " o " i przechodząca w liczbę nie — takiej
 * w korpusie nie ma i nie bronimy się przed nią na zapas.
 */
const RE_HEAL_TARGET = new RegExp(`^Uleczono\\s+(.+?)\\s+o\\s+(\\d+)\\s+punktów życia\\.?$`);
const RE_DOT = new RegExp(
  `^${ACTOR}:\\s*(\\d+)\\s*(?:\\(osłabione o (\\d+)%\\))?\\s*obrażeń (od|po) (.+?)\\.?$`,
);
// Ruch to zawsze "krok ...". Bez tego zawężenia każde "zrobił X" udawałoby
// ruch i nowa linia z logu przestałaby być zgłaszana jako nieznana.
const RE_MOVE = new RegExp(`^${ACTOR}\\s+zrobił${GENDER}\\s+(krok\\b.*?)\\.?$`);
// Po "utrata tury" bywa dopisany powód w nawiasie: "(redukcja ogłuszenia 90%)".
const RE_TURN_LOST = /^(.+?) - utrata tury(?: \(.+\))?$/;
// Rodzaj bywa dopisany wprost ("Poległa") albo w nawiasie ("Poległ(a)") — tak
// gra pisze o potworach, u których nie zna formy.
const RE_VICTORY = /^Zwyciężył(?:a|o|\(a\))?(?: drużyna)? (.+)$/;
const RE_DEFEAT = /^Poległ(?:a|o|y|\(a\))?(?: drużyna)? (.+)$/;
const RE_DRAW = /^(Walka nie wyłoniła zwycięzcy)$/;
const RE_BLOCKED = /^Zablokowanie (\d+) obrażeń$/;
/**
 * "Absorpcja 261 obrażeń fizycznych" — tarcza CELU, nie efekt atakującego.
 * Trzymana osobno od proc-ów z dwóch powodów: liczona jako efekt napastnika
 * byłaby przypisana nie tej postaci, co trzeba, a jej wartość i tak siedzi już
 * w `damageAbsorbed` (różnica między ciosem surowym a przyjętym).
 */
const RE_ABSORBED = /^Absorpcja \d+ obrażeń/;
/**
 * "Przerwanie ciosu specjalnego." — cios przerwał szykowany przez cel cios
 * specjalny. Stoi w środku bloku ataku (między "uderzył" a "otrzymał") i nie
 * niesie liczby; trzymamy jako modyfikator zadanego ciosu, żeby nie rozbił
 * trwającej akcji ani nie zgłosił się jako nieznana linia.
 */
const RE_STRIKE_NOTE = /^Przerwanie ciosu specjalnego\.?$/;
/**
 * Komunikaty tła: nie niosą żadnej liczby do statystyk, ale są częścią logu.
 * Lista jest wąska celowo — wszystko spoza niej ma nadal lądować w "unknown",
 * bo to jedyny sygnał, że format się zmienił.
 */
const RE_INFO = [
  /^Walka bez Punktów Honoru\b/,
  // Przyrost zasobu, np. "Łowcosław Kazrek otrzymuje 15 energii." albo
  // "Sir Krzysztof otrzymuje 28 many". Statystyk many ani energii nie liczymy,
  // ale linia jest znana.
  //
  // Zasoby wymienione z NAZWY, a nie jako „liczba i dowolne słowa": poprzedni
  // wzorzec (`\d+(?: \p{L}+)+`) nie odróżniał „energii" od „obrażeń", więc
  // „X otrzymuje 500 obrażeń od trucizny." wpadało tu jako `info` — kwota
  // znikała, a `unknownLines` zostawało zerem. Dokładnie catch-all, przed
  // którym broni komentarz przy `RE_MODIFIER`, i wyłom w zasadzie „nieznane
  // jest głośne". Nowy zasób ma trafić w `unknown` i dać się dopisać świadomie.
  /^.+ otrzymuje \d+ (?:punktów )?(?:many|energii)\.?$/u,
  // Aura nakładana na starcie, np. "X spowija się trującą mgłą: -3% ...".
  /\sspowija się\s/,
  // Wzmocnienie za małą grupę: "Wzmocnienie X o 35% ze względu na małą grupę...".
  new RegExp(`^Wzmocnienie .+ o ${PCT}%`),
  // Ładowanie ciosu specjalnego: "X(100%) przygotowuje się do wykonania Y(0%).".
  // Sama zapowiedź naboju — obrażenia (jeśli padną) przyjdą osobną linią później.
  /\sprzygotowuje się do wykonania\s/,
  // "Przerwanie ciosu specjalnego." poza blokiem ataku (w bloku łapane wcześniej).
  RE_STRIKE_NOTE,
  // "X - atak w martwego przeciwnika." — cel padł, zanim cios doszedł. Linia
  // nie niesie żadnej liczby, a tury nie zabiera: obok stoi normalny cios tej
  // samej postaci w kolejny cel.
  / - atak w martwego przeciwnika\.?$/,
  // "X poddał walkę." — postać wycofała się z walki. Liczby nie niesie, tury
  // nie zabiera (log nie dopisuje przy niej "utrata tury"), a dalej po prostu
  // przestaje się w nim pojawiać. Rodzaj odmieniony wprost, jak w RE_VICTORY.
  new RegExp(`^.+ poddał${GENDER} walkę\\.?$`),
  // Opis efektu umiejętności obszarowej, stojący zaraz za jej zapowiedzią
  // ("Opusheteh wykonuje Szadź." → "Spowolnienie przeciwników o 14%").
  // Wszystkie cztery szyki niosą procent, ale ŻADEN nie mówi, na kim efekt
  // usiadł. Przy leczeniu ("Uleczono sojuszników o 30% życia.") log nie
  // rozbija go na postacie ani nie dokłada linii "Przywrócono" — tej kwoty
  // nie da się nikomu przypisać i statystyki jej nie widzą.
  /^Aura .+ została aktywowana\b/,
  new RegExp(`^Spowolnienie przeciwników o ${PCT}%\\.?$`),
  new RegExp(`^Osłabienie leczenia .+ o ${PCT}%\\.?$`),
  new RegExp(`^Uleczono sojuszników o ${PCT}% życia\\.?$`),
  // Zaczepienie: "Zsz Przeworsk wykonuje Wyzywający okrzyk." → "Uwaga Hildur
  // Muza Śmierci została skupiona na Zsz Przeworsk." Jedyna z tej rodziny BEZ
  // procentu — mówi o kierunku uwagi bossa, nie o wielkości efektu.
  /^Uwaga .+ została skupiona na .+\.?$/,
  // Opisy osłabień i wzmocnień spod zaczepienia i tarczy. Wzorce są dosłowne,
  // a nie "^Zmniejszenie .+ o N%", bo szerszy szyk połknąłby kiedyś linię
  // niosącą liczbę do przypisania — a `unknown` jest jedyną czujką na to.
  new RegExp(`^Zmniejszenie szansy na blok u przeciwników o ${PCT}%\\.?$`),
  new RegExp(`^Zmniejszenie ataku przeciwników o ${PCT}%\\.?$`),
  new RegExp(`^Zwiększenie szansy na blok o ${PCT}%\\.?$`),
  // "jakis Maciek wykonuje Piętno bestii." → "Wszyscy przeciwnicy otrzymują
  // zwiększone obrażenia." Jedyna z tej rodziny bez JAKIEJKOLWIEK liczby —
  // nawet procentu. Pominięcie niczego nie gubi, bo sam efekt jest w logu
  // policzony osobno i z właścicielem: każdy późniejszy cios niesie modyfikator
  // "+Piętno bestii: atak +503" oraz własne trafienie tej wysokości.
  /^Wszyscy przeciwnicy otrzymują zwiększone obrażenia\.?$/,
  // Łup z potwora: "Gnoll łucznik: zdobyto Niebieskawy pancerz gnolla".
  // Nazwa przed dwukropkiem to dawca łupu, nie aktor akcji — nic tu nie ma
  // do policzenia. Zwykle na końcu logu, ale nie jest to regułą, więc łapiemy
  // po treści, nie po pozycji.
  /^.+?:\s*zdobyto\s+.+$/,
  // Doświadczenie za walkę: "Zwycięzca zdobył łącznie 2043 punktów
  // doświadczenia" plus "Dodatkowe punkty doświadczenia z przedmiotów +1021.".
  //
  // Linie ZNANE i świadomie nieliczone. Parser niósł je kiedyś jako osobne
  // zdarzenie `experience`, którego nie czytało nic poza ignorowanym `case`
  // w `stats.ts` — decyzja z `SOLID §4.22` brzmi „usunąć", bo to jedyna liczba
  // z tej czwórki opisująca WALKĘ, a nie postać, i licznik obrażeń nie ma dla
  // niej miejsca. Wzorce zostają tutaj, żeby usunięcie pola nie zrobiło
  // z sześciu linii logu linii nieznanych i nie zapaliło ostrzeżenia parsera.
  /^Zwycięzca zdobył łącznie \d+ punktów doświadczenia$/,
  /^Dodatkowe punkty doświadczenia z przedmiotów \+\d+\.?$/,
];

/**
 * Znaczniki bbcode potrafią się rozjechać na dwie linie (otwarcie przy treści,
 * zamknięcie samotnie niżej), więc usuwamy je przed podziałem na linie.
 * `[b]` otacza komunikaty systemowe, `[i]` akcje przeciwnika.
 */
function normalize(text: string): string {
  // Spacja nierozdzielająca ma zniknąć razem ze znacznikami: `normalizeLine`
  // zbiera ją dopiero w środku linii, a tu tekst jest jeszcze w całości.
  // (Wcześniej stało tu `.replace(/ /g, " ")` — spacja na spację, czyli nic.)
  return text.replace(/\[\/?[a-zA-Z]+\]/g, "").replace(/\u00A0/g, " ");
}

function normalizeLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

/**
 * Linia sprowadzona do postaci, w której parser ją WIDZI — bez bbcode'u i bez
 * rozjechanych odstępów.
 *
 * Potrzebna poza parserem, bo nagrywarka odpowiada na to samo pytanie co sesja:
 * „czy powtórzony nagłówek to ta sama walka?". Sesja pyta o skład ODCZYTANY
 * przez parser, więc po tej normalizacji; nagrywarka trzyma surowy tekst
 * i porównywała go dosłownie. Wystarczyło, że gra rozjechała `[b]` albo zmieniła
 * odstęp, i obie strony dawały inną odpowiedź: panel widział jedną walkę,
 * archiwum zapisywało dwie, w tym jedną śmieciową.
 *
 * Nagranie nadal zostaje SUROWE — normalizacja dotyczy wyłącznie porównania.
 */
export function canonicalLine(line: string): string {
  return normalizeLine(normalize(line));
}

function toPct(raw: string): number {
  return parseFloat(raw.replace(",", "."));
}

type DamageValue = { value: number; element: string | null };

/** `+4053  +2729` → dwie wartości; znaki pomijamy, liczy się wartość i żywioł. */
function toDamages(segment: string): DamageValue[] {
  RE_DAMAGE_VALUE.lastIndex = 0;
  return [...segment.matchAll(RE_DAMAGE_VALUE)].map((m) => ({
    value: Math.abs(parseInt(m[1]!, 10)),
    // Nieznana litera NIE wpada do tego samego worka co "brak DOM": zostaje
    // surowa nazwa klasy (`dmgo`), żeby zmiana formatu była widoczna zamiast
    // wsiąkać w "bez żywiołu". Liczy ją `aggregate` — patrz `unknownElements`.
    element: m[2] ? (ELEMENTS[m[2]] ?? `dmg${m[2]}`) : null,
  }));
}

function splitNames(segment: string): string[] {
  return segment
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name !== "");
}

/**
 * Dzieli skład na dwie strony po słowie "a": "A (1w), B (2w) a C (3w)".
 * Szukamy "a" stojącego zaraz za nawiasem z poziomem, żeby nie rozciąć nazwy,
 * w której to słowo wystąpiłoby samo z siebie.
 */
function splitSides(segment: string): string[] {
  const separator = /\)\s+a\s+/.exec(segment);
  if (!separator) return [segment];
  return [
    segment.slice(0, separator.index + 1),
    segment.slice(separator.index + separator[0].length),
  ];
}

function parseParticipants(segment: string): Participant[] {
  return splitSides(segment).flatMap((side, index) => {
    RE_PARTICIPANT.lastIndex = 0;
    return [...side.matchAll(RE_PARTICIPANT)].map((m) => ({
      // Kolejne nazwy niosą separator z poprzedniego dopasowania (`a `, `, `).
      name: m[1]!.trim().replace(/^(?:a|i|,)\s+/, ""),
      level: parseInt(m[2]!, 10),
      professionCode: m[3]!,
      side: index,
    }));
  });
}

type PendingAttack = {
  source: string;
  sourceHpPct: number | null;
  rawDamages: DamageValue[];
  modifiers: string[];
  line: string;
  lineNo: number;
};

type Modifiers = {
  mainCrit: boolean;
  offhandCrit: boolean;
  superCrit: boolean;
  dodged: boolean;
  blocked: number | null;
  procs: string[];
};

function classifyModifiers(modifiers: string[]): Modifiers {
  const result: Modifiers = {
    mainCrit: false,
    offhandCrit: false,
    superCrit: false,
    dodged: false,
    blocked: null,
    procs: [],
  };

  for (const modifier of modifiers) {
    if (modifier === "Unik") {
      result.dodged = true;
    } else if (modifier.includes("Cios bardzo krytyczny")) {
      result.superCrit = true;
    } else if (modifier.includes("Cios krytyczny")) {
      if (modifier.includes("broni pomocniczej")) result.offhandCrit = true;
      else result.mainCrit = true;
    } else {
      const blocked = RE_BLOCKED.exec(modifier);
      if (blocked) result.blocked = parseInt(blocked[1]!, 10);
      // Absorpcja należy do celu — pod napastnikiem byłaby kłamstwem.
      else if (!RE_ABSORBED.test(modifier)) result.procs.push(modifier);
    }
  }

  return result;
}

/**
 * Trafienie, którego w logu nie było.
 *
 * Zero surowych ORAZ zero przyjętych obrażeń przy braku uniku nie opisuje
 * żadnego zdarzenia — powstaje, gdy jedna liczba rozpadnie się na dwie. Tak
 * zachowa się separator tysięcy: „+10 000" daje `10` i `000`, czyli cios za
 * dziesięć zamiast dziesięciu tysięcy plus widmowa broń pomocnicza. Format
 * z separatorem nie jest potwierdzony (w korpusie liczby mają najwyżej cztery
 * cyfry), ale gdyby się pojawił, ta reguła zamienia cichą pomyłkę o trzy rzędy
 * wielkości w głośne `unknown`.
 */
function isPhantomHit(hit: Hit): boolean {
  return hit.raw === 0 && hit.applied === 0 && !hit.dodged;
}

/**
 * Sparowanie liczb surowych z przyjętymi — po kolei, ale NIE na ślepo po indeksie.
 *
 * Gdy cel wytłumi jedną z liczb do zera, log jej w linii przyjętych po prostu
 * nie pisze: cios „+930 +147 +799" zamyka się wtedy „-426 -375". Parowanie po
 * indeksie przypisywało 375 do surowego 147 — czyli cios przyjęty WIĘKSZY niż
 * zadany, a w zrzucie z DOM-u dodatkowo pod cudzym żywiołem (liczba zimna
 * lądowała pod ogniem). Sumy się zgadzały, więc nic tego nie zgłaszało.
 *
 * Obie linie wypisują sloty w tej samej kolejności, więc dla każdej przyjętej
 * liczby bierzemy pierwszy slot, który ją UNIESIE. Slot unosi liczbę, gdy nie
 * jest od niej mniejszy i gdy zgadza się żywioł — o ile obie strony go niosą.
 * Sloty pominięte zostają z zerem: tyle cel z nich zdjął. Liczba, której nie
 * przyjmie żaden slot, zostaje osobnym trafieniem, bo proc potrafi dołożyć
 * w linii przyjętych wartość nieobecną w ciosie surowym („Zmiażdżenie 25%").
 *
 * Żywioł jest tu MOCNIEJSZYM dowodem niż wielkość i tylko on rozstrzyga część
 * przypadków: „+1054(d) +159(f) +1143(c)" zamknięte „-179(d) -17(c)" ma 17
 * mniejsze od 159, więc sam warunek wielkości wsadziłby zimno pod ogień, nie
 * łamiąc przy tym niczego widocznego. W tekście z „Kopiuj logi" żywiołów nie
 * ma wcale i wtedy zostaje sama wielkość — ale tam nie ma też rozbicia na
 * rodzaje obrażeń, więc slot i tak nie ma czego przekłamać.
 */
function pairApplied(raw: DamageValue[], applied: DamageValue[]) {
  const fits = (slot: DamageValue, value: DamageValue) =>
    value.value <= slot.value &&
    (slot.element === null || value.element === null || slot.element === value.element);

  const slots: Array<DamageValue | undefined> = new Array(raw.length);
  const extra: DamageValue[] = [];
  let cursor = 0;
  for (const value of applied) {
    let slot = cursor;
    while (slot < raw.length && !fits(raw[slot]!, value)) slot++;
    if (slot < raw.length) {
      slots[slot] = value;
      cursor = slot + 1;
    } else extra.push(value);
  }
  return { slots, extra };
}

function buildHits(raw: DamageValue[], applied: DamageValue[], mods: Modifiers): Hit[] {
  const { slots, extra } = pairApplied(raw, applied);
  // Sloty ciosu, a za nimi liczby dołożone dopiero po redukcji — te nie mają
  // surowego odpowiednika, więc stają się własnymi trafieniami.
  const paired = [...slots, ...extra];
  return Array.from({ length: paired.length }, (_, i) => {
    const secondary = i > 0;
    const appliedValue = paired[i]?.value ?? 0;
    return {
      /**
       * Brak odpowiednika w linii "uderzył z siłą" znaczy, że tę liczbę dołożył
       * proc CELNIE po redukcji — "Zmiażdżenie 25%" dokłada w linii otrzymanych
       * czwartą wartość (`dmga`), której w ciosie surowym nie było. Wartości
       * surowej log dla niej nie podaje, więc bierzemy przyjętą: zero
       * kłamałoby o pochłonięciu, bo `raw - applied` szłoby na minus i
       * napastnik dostawał ujemną absorpcję.
       */
      raw: raw[i]?.value ?? appliedValue,
      applied: appliedValue,
      // Żywioł niosą obie linie tak samo; bierzemy pierwszy, który go ma.
      element: raw[i]?.element ?? paired[i]?.element ?? null,
      crit: secondary ? mods.offhandCrit : mods.mainCrit,
      superCrit: secondary ? false : mods.superCrit,
      secondary,
      // Unik bywa częściowy: broń pomocnicza potrafi trafić mimo "-Unik",
      // więc o uniknięciu decyduje zerowa wartość przy tym trafieniu.
      dodged: mods.dodged && appliedValue === 0,
    };
  });
}

/**
 * Zamienia surowy tekst okna walki na listę zdarzeń.
 *
 * Parser jest maszyną stanów, bo atak rozkłada się na kilka linii: linia
 * "uderzył z siłą", opcjonalne modyfikatory, i dopiero linia "otrzymał"
 * domykająca akcję po stronie celu.
 */
export function parse(text: string): BattleEvent[] {
  const events: BattleEvent[] = [];
  const lines = normalize(text).split("\n");
  let pending: PendingAttack | null = null;

  /**
   * Umiejętność zapowiedziana linią "X wykonuje Y." Obowiązuje do końca bloku:
   * "Podwójne trafienie" niesie dwa ataki pod jedną nazwą. Kończy ją pierwsza
   * linia niebędąca atakiem ani modyfikatorem (leczenie, DoT, ruch).
   *
   * Cios stojący za zapowiedzią należy do umiejętności, bo w tej grze użycie
   * umiejętności zużywa turę, w której postać i tak uderza. Potwierdzają to
   * opisy: "Wycieńczająca strzała" dokłada własne obrażenia nieuchronne, a
   * "Strzała z niespodzianką" sama nie zadaje nic — tylko podbija ten cios.
   *
   * Trzymamy przy niej autora: w walce grupowej zaraz po zapowiedzi uderzają
   * przeciwnicy i bez tego ich ciosy dostałyby cudzą nazwę.
   */
  let ability: { actor: string; name: string } | null = null;
  /** Modyfikatory stojące luzem, przed linią obrażeń albo po niej. */
  let loose: string[] = [];

  /** Atak bez domykającej linii "otrzymał" — zgłaszamy zamiast zgadywać. */
  const flushPending = () => {
    if (!pending) return;
    events.push({ kind: "unknown", line: pending.line, lineNo: pending.lineNo });
    pending = null;
  };

  /**
   * Modyfikatory z zamkniętego już bloku doklejamy do jego akcji. Gdy blok nie
   * miał ataku (np. sam DoT), przepadają — same nie niosą obrażeń, a jako
   * modyfikatory zostały rozpoznane, więc nie są sygnałem zmiany formatu.
   */
  const flushLoose = () => {
    if (loose.length === 0) return;
    const last = events.at(-1);
    if (last?.kind === "attack") last.procs.push(...classifyModifiers(loose).procs);
    loose = [];
  };

  /** Koniec bloku umiejętności — dalsze ataki są już zwykłe. */
  const endBlock = () => {
    flushLoose();
    ability = null;
  };

  /**
   * Zdarzenia, które log potrafi wcisnąć w środek bloku ataku — leczenie celu
   * albo tykający efekt. Nie przerywają trwającego ciosu.
   *
   * `block` to umiejętność zapowiedziana nad tą linią. Potrzebuje jej wyłącznie
   * leczenie kierowane: sama linia "Uleczono X o N punktów życia." nie mówi ani
   * czym, ani kto — obie te rzeczy stoją piętro wyżej.
   */
  const sideEvent = (
    line: string,
    block: { actor: string; name: string } | null,
  ): BattleEvent | null => {
    const healAbility = RE_HEAL_ABILITY.exec(line);
    if (healAbility) {
      return {
        kind: "heal",
        ability: healAbility[1]!.trim(),
        amount: parseInt(healAbility[2]!, 10),
        target: healAbility[3]!.trim(),
        targetHpPct: toPct(healAbility[4]!),
        // Proc siada na tym, kto uderzył — leczy sam siebie.
        self: true,
      };
    }

    const healSelf = RE_HEAL_SELF.exec(line);
    if (healSelf) {
      return {
        kind: "heal",
        ability: healSelf[3]!.trim(),
        amount: parseInt(healSelf[4]!, 10),
        target: healSelf[1]!.trim(),
        targetHpPct: toPct(healSelf[2]!),
        self: true,
      };
    }

    const healTarget = RE_HEAL_TARGET.exec(line);
    if (healTarget) {
      const target = healTarget[1]!.trim();
      return {
        kind: "heal",
        // Nazwa z otaczającego bloku — bez niej całe leczenie drużyny stanęłoby
        // pod wspólną "Regeneracją" i nie dałoby się odróżnić "Leczenia ran" od
        // "Kojącego ochłodzenia". Poza blokiem `null`: wtedy naprawdę nie
        // wiadomo, co to było.
        ability: block?.name ?? null,
        amount: parseInt(healTarget[2]!, 10),
        target,
        // Ten szyk NIE podaje życia celu — jedyny obok leczenia potwora.
        targetHpPct: null,
        // Porównanie zostaje tutaj: na zewnątrz wychodzi tylko "czy tę kwotę
        // wolno komuś dopisać", a nie sam leczący.
        self: block?.actor === target,
      };
    }

    const healPlain = RE_HEAL_PLAIN.exec(line);
    if (healPlain) {
      return {
        kind: "heal",
        ability: null,
        amount: parseInt(healPlain[1]!, 10),
        target: healPlain[2]!.trim(),
        // Jedyny szyk, w którym procentu naprawdę bywa brak (leczenie potwora).
        targetHpPct: healPlain[3] ? toPct(healPlain[3]) : null,
        self: false,
      };
    }

    const dot = RE_DOT.exec(line);
    if (dot) {
      return {
        kind: "dot",
        target: dot[1]!.trim(),
        targetHpPct: toPct(dot[2]!),
        amount: parseInt(dot[3]!, 10),
        weakenedPct: dot[4] ? parseInt(dot[4], 10) : null,
        via: dot[5] as "od" | "po",
        dotType: dot[6]!.trim(),
      };
    }

    const dotTaken = RE_DOT_TAKEN.exec(line);
    if (dotTaken) {
      return {
        kind: "dot",
        target: dotTaken[1]!.trim(),
        targetHpPct: toPct(dotTaken[2]!),
        amount: parseInt(dotTaken[3]!, 10),
        weakenedPct: dotTaken[4] ? parseInt(dotTaken[4], 10) : null,
        via: dotTaken[5] as "od" | "po",
        dotType: dotTaken[6]!.trim(),
      };
    }

    return null;
  };

  lines.forEach((rawLine, index) => {
    // Znaczniki żywiołów zostają tylko w `marked`. Wszystkie wzorce pracują na
    // `line`, więc żaden znacznik nie ma szans wyciec do nazw ani komunikatów.
    const marked = normalizeLine(rawLine);
    const line = clean(marked);
    const lineNo = index + 1;
    if (line === "") return;

    if (pending) {
      // Linia obrażeń przed modyfikatorem: "-507 obrażeń..." też zaczyna się
      // od znaku, a modyfikatory dopuszczają teraz cyfry ("+14 energii").
      const taken = RE_TAKEN.exec(line);
      if (taken) {
        const mods = classifyModifiers([...pending.modifiers, ...loose]);
        loose = [];
        // Cios kogoś innego niż autor zapowiedzi zamyka jej blok — to już
        // czyjaś tura.
        if (ability && ability.actor !== pending.source) ability = null;
        const hits = buildHits(pending.rawDamages, toDamages(RE_TAKEN.exec(marked)?.[3] ?? ""), mods);
        if (hits.some(isPhantomHit)) {
          // Cios rozsypał się na trafienia, których nie ma — patrz
          // `isPhantomHit`. Kwota jest wtedy nie do odtworzenia, więc zgłaszamy
          // linię zamiast zapisywać liczbę, o której wiemy, że jest zła.
          events.push({ kind: "unknown", line: pending.line, lineNo: pending.lineNo });
          events.push({ kind: "unknown", line, lineNo });
          pending = null;
          return;
        }
        events.push({
          kind: "attack",
          source: pending.source,
          target: taken[1]!.trim(),
          sourceHpPct: pending.sourceHpPct,
          targetHpPct: toPct(taken[2]!),
          hits,
          dodged: mods.dodged,
          blocked: mods.blocked,
          procs: mods.procs,
          // Twardy warunek: nazwę dostaje wyłącznie cios TEGO, kto ją zapowiedział.
          // Nie polegamy na tym, że stan zdążył się wyczyścić wcześniej.
          ability: ability?.actor === pending.source ? ability.name : null,
          strike: true,
        });
        pending = null;
        return;
      }

      const modifier = modifierOf(line);
      if (modifier !== null) {
        pending.modifiers.push(modifier);
        return;
      }

      // Nota bez znaku ("Przerwanie ciosu specjalnego.") wpina się między cios a
      // linię obrażeń; jako modyfikator jedzie z ciosem, zamiast go rozbijać.
      if (RE_STRIKE_NOTE.test(line)) {
        pending.modifiers.push(line.replace(/\.$/, ""));
        return;
      }

      // Leczenie celu potrafi stanąć MIĘDZY linią ciosu a linią obrażeń.
      const side = sideEvent(line, ability);
      if (side) {
        events.push(side);
        return;
      }

      flushPending();
    }

    const abilityUse = RE_ABILITY_USE.exec(line);
    if (abilityUse) {
      flushLoose();
      ability = { actor: abilityUse[1]!.trim(), name: abilityUse[2]!.trim() };
      events.push({ kind: "ability", actor: ability.actor, name: ability.name });
      return;
    }

    // Obrażenia zadane przez samą umiejętność, bez linii "uderzył z siłą".
    //
    // Bez zapowiedzi nie ma komu ich przypisać, więc linia leci dalej i kończy
    // jako `unknown` — świadomie, bo to sygnał, że format się rozjechał. Kiedyś
    // połykał ją `RE_MODIFIER` jako proc i kwota znikała bez śladu.
    const abilityDamage = RE_ABILITY_DAMAGE.exec(line);
    if (abilityDamage && ability) {
      const amount = parseInt(abilityDamage[1]!, 10);
      // Żywioł niesie ta sama liczba w wersji ze znacznikami (`<b class="dmga">`).
      const element = toDamages(marked)[0]?.element ?? null;
      const mods = classifyModifiers(loose);
      loose = [];
      events.push({
        kind: "attack",
        source: ability.actor,
        target: abilityDamage[2]!.trim(),
        // Log NIE podaje życia rzucającego w tej linii. `null`, nie `0` —
        // zero znaczyłoby "padł" i wpisywało maga na listę poległych.
        sourceHpPct: null,
        targetHpPct: toPct(abilityDamage[3]!),
        // Log podaje tylko wartość po redukcji — surowej nie znamy.
        hits: [
          {
            raw: amount,
            applied: amount,
            crit: false,
            superCrit: false,
            secondary: false,
            dodged: false,
            element,
          },
        ],
        dodged: false,
        blocked: mods.blocked,
        procs: mods.procs,
        ability: ability.name,
        strike: false,
      });
      return;
    }

    // Modyfikator poza atakiem: albo należy do bloku umiejętności, albo opisuje
    // stojącą niżej linię DoT-a.
    const looseModifier = modifierOf(line);
    if (looseModifier !== null) {
      loose.push(looseModifier);
      return;
    }

    const attack = RE_ATTACK.exec(line);
    if (attack) {
      pending = {
        source: attack[1]!.trim(),
        sourceHpPct: toPct(attack[2]!),
        rawDamages: toDamages(RE_ATTACK.exec(marked)?.[3] ?? attack[3]!),
        modifiers: [],
        line,
        lineNo,
      };
      return;
    }

    if (RE_INFO.some((pattern) => pattern.test(line))) {
      events.push({ kind: "info", line });
      return;
    }

    // Leczenie i DoT bada się PRZED endBlock: log potrafi wcisnąć je w środek
    // bloku umiejętności (leczenie "Ostatni ratunek" staje między jej kolejnymi
    // liniami obrażeń), a domknięcie bloku osierociłoby następny cios tej samej
    // umiejętności — jego linia "N obrażeń otrzymał(a) X" straciłaby autora.
    const side = sideEvent(line, ability);
    if (side) {
      events.push(side);
      return;
    }

    endBlock();

    const start = RE_FIGHT_START.exec(line);
    if (start) {
      events.push({ kind: "fight-start", participants: parseParticipants(start[1]!) });
      return;
    }

    const move = RE_MOVE.exec(line);
    if (move) {
      events.push({
        kind: "move",
        actor: move[1]!.trim(),
        hpPct: toPct(move[2]!),
        description: move[3]!.trim(),
      });
      return;
    }

    const turnLost = RE_TURN_LOST.exec(line);
    if (turnLost) {
      events.push({ kind: "turn-lost", actor: turnLost[1]!.trim() });
      return;
    }

    const victory = RE_VICTORY.exec(line);
    if (victory) {
      events.push({
        kind: "fight-end",
        outcome: "victory",
        actors: splitNames(victory[1]!),
        result: line,
      });
      return;
    }

    const defeat = RE_DEFEAT.exec(line);
    if (defeat) {
      events.push({
        kind: "fight-end",
        outcome: "defeat",
        actors: splitNames(defeat[1]!),
        result: line,
      });
      return;
    }

    const draw = RE_DRAW.exec(line);
    if (draw) {
      events.push({ kind: "fight-end", outcome: "draw", actors: [], result: line });
      return;
    }

    events.push({ kind: "unknown", line, lineNo });
  });

  flushPending();
  flushLoose();
  return events;
}
