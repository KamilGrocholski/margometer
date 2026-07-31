/**
 * Znacznik doklejany przez `extractText` do liczby obrażeń, gdy DOM gry niesie
 * żywioł w klasie CSS (`<b class="dmgc">`). W samym tekście logu żywiołu nie ma
 * — widać go wyłącznie po kolorze, więc bez DOM-u ta informacja nie istnieje.
 */
export const ELEMENT_MARKER = "\u0001";

/**
 * Zdanie otwierające walkę — jedyne, po czym poznajemy jej początek.
 *
 * Stoi tu, a nie w trzech modułach osobno, bo decyduje o TRZECH niezależnych
 * rzeczach: znalezieniu okna walki w DOM (`source.ts`), podziale na walki
 * w parserze i podziale na nagrania w nagrywarce. Zmiana formatu po stronie
 * gry wywala wszystkie trzy PO CICHU — czujka `unknown` pilnuje wyłącznie
 * parsera, więc panel powiedziałby „brak danych", a nie „nie rozumiem".
 *
 * Każdy moduł buduje z tego własny wzorzec: parser potrzebuje zakotwiczenia
 * i grupy ze składem, pozostałe tylko sprawdzają obecność.
 */
export const FIGHT_START_TEXT = "Rozpoczęła się walka pomiędzy";

/** Kod profesji tak, jak pojawia się w logu, np. `85b`. */
export type ProfessionCode = "w" | "p" | "t" | "h" | "m" | "b";

export const PROFESSIONS: Record<ProfessionCode, string> = {
  w: "wojownik",
  p: "paladyn",
  t: "tropiciel",
  h: "łowca",
  m: "mag",
  b: "tancerz ostrzy",
};

export type Participant = {
  name: string;
  level: number;
  /** Kod z logu. Nieznane litery zostawiamy surowe zamiast zgadywać. */
  professionCode: string;
  /**
   * Strona konfliktu z linii otwierającej: 0 przed słowem "a", 1 po nim.
   * Log pisany jest z perspektywy gracza, więc strona 0 to jego drużyna.
   */
  side: number;
};

/**
 * Pojedyncza liczba obrażeń w ramach jednego ataku. Linia "uderzył z siłą"
 * potrafi ich nieść kilka i log NIE mówi, czym one są: u tancerza ostrzy to
 * broń główna i pomocnicza, u tropiciela żywioły (zimno, błyskawica, ogień),
 * a nazw żywiołów w logu nie ma w ogóle.
 *
 * `raw` to liczba z linii "uderzył z siłą", `applied` z linii "otrzymał".
 * Różnica to redukcja po stronie celu — NIE sumuj obu, to ta sama akcja.
 */
export type Hit = {
  raw: number;
  applied: number;
  crit: boolean;
  /** "Cios bardzo krytyczny" — występuje razem ze zwykłym krytykiem. */
  superCrit: boolean;
  /**
   * Nie pierwsza liczba w linii. Że to akurat broń pomocnicza, wiadomo tylko
   * wtedy, gdy log dopisze "Cios krytyczny broni pomocniczej".
   */
  secondary: boolean;
  /**
   * Żywioł odczytany z klasy CSS w DOM gry ("ogień", "błyskawica", "zimno").
   * null dla obrażeń fizycznych i dla logu wklejonego jako sam tekst.
   */
  element: string | null;
  /**
   * Cel uniknął tego konkretnego trafienia. "Unik" bywa częściowy — przy
   * ataku dwiema broniami główna wchodzi za 0, a pomocnicza mimo to trafia.
   */
  dodged: boolean;
};

export type BattleEvent =
  | { kind: "fight-start"; participants: Participant[] }
  | {
      kind: "attack";
      source: string;
      target: string;
      /**
       * `null`, gdy log nie podaje życia bijącego — tak jest przy własnych
       * obrażeniach umiejętności ("-507 obrażeń otrzymał(a) X"). Zaślepka `0`
       * była tu wcześniej czytana jako zgon, więc rzucający kończył walkę na
       * liście poległych.
       */
      sourceHpPct: number | null;
      targetHpPct: number;
      hits: Hit[];
      /** Log zgłosił "Unik". Które trafienia faktycznie przepadły — patrz `hits`. */
      dodged: boolean;
      /** Ile obrażeń cel zablokował ("Zablokowanie 47 obrażeń"). */
      blocked: number | null;
      /** Efekty bez własnych liczb obrażeń: "Klątwa", "Szybka strzała", ... */
      procs: string[];
      /**
       * Umiejętność zapowiedziana linią "X wykonuje Y." albo null dla zwykłego
       * ciosu. Jedna umiejętność potrafi objąć kilka ataków pod rząd.
       */
      ability: string | null;
      /**
       * Czy to cios z linii "uderzył z siłą". `false` dla własnych obrażeń
       * umiejętności ("-507 obrażeń otrzymał(a) X") — te lecą obok ciosu w tej
       * samej turze, więc liczone osobno zawyżałyby liczbę ciosów.
       */
      strike: boolean;
    }
  /** `ability` jest null, gdy log nie podaje źródła (linia "Przywrócono N..."). */
  | {
      kind: "heal";
      ability: string | null;
      target: string;
      amount: number;
      /**
       * Życie celu PO wyleczeniu — log podaje je przy większości linii leczenia.
       * `null` tylko tam, gdzie go faktycznie nie ma (leczenie potwora bez
       * procentu). Bez tego pola leczenie przy zdublowanych nazwach lgnęło do
       * "ostatnio aktywnej" instancji, choć dana stała w logu.
       */
      targetHpPct: number | null;
    }
  | {
      kind: "dot";
      target: string;
      targetHpPct: number;
      amount: number;
      /** Przyimek z logu: "od trucizny" kontra "po zranieniu". */
      via: "od" | "po";
      dotType: string;
      /** "osłabione o 25%" → 25. */
      weakenedPct: number | null;
    }
  | { kind: "move"; actor: string; hpPct: number; description: string }
  | { kind: "turn-lost"; actor: string }
  | {
      kind: "fight-end";
      outcome: "victory" | "defeat" | "draw";
      /** Kto wygrał/poległ. Pusta lista dla walki bez rozstrzygnięcia. */
      actors: string[];
      result: string;
    }
  /** `bonus` odróżnia dodatek z przedmiotów od głównej puli — nie sumuj ślepo. */
  | { kind: "experience"; amount: number; bonus: boolean }
  /** Zapowiedź umiejętności; obrażenia niosą dopiero kolejne linie. */
  | { kind: "ability"; actor: string; name: string }
  /** Komunikat tła bez wpływu na statystyki (aura, brak Punktów Honoru, ...). */
  | { kind: "info"; line: string }
  /**
   * Linia, której parser nie rozumie. Nie połykamy jej po cichu — niezerowa
   * liczba takich zdarzeń oznacza, że format logu się zmienił i statystyki
   * są niepełne.
   */
  | { kind: "unknown"; line: string; lineNo: number };

/**
 * Jeden wiersz rozbicia obrażeń, pokazywany po najechaniu na pasek.
 *
 * Log nie nazywa zwykłych ciosów żadną umiejętnością, więc po stronie zadanych
 * rozróżniamy je po broni; nazwane są tylko efekty (trucizna, proc-i).
 */
export type DamageSource = {
  label: string;
  amount: number;
  /**
   * Ciosy, nie liczby obrażeń. Jeden cios potrafi nieść kilka liczb — tancerz
   * bije dwiema broniami, mag zadaje zimno i błyskawicę naraz — a to nadal
   * jedno uderzenie z kilku źródeł. Rozjazd z `abilityUses` jest wtedy
   * prawdziwy tylko tam, gdzie umiejętność faktycznie uderza kilka razy
   * ("Podwójny strzał"), i sam z siebie spada do 1, gdy cel padnie po
   * pierwszym trafieniu.
   */
  hits: number;
};

/** Efekt bez własnych obrażeń — log podaje samą nazwę, np. "Klątwa". */
export type ProcCount = { label: string; count: number };

/**
 * Jeden napastnik w rozbiciu obrażeń przyjętych, wraz z tym, CZYM uderzał.
 *
 * Dwa poziomy zamiast jednej sklejonej etykiety „Napastnik · Umiejętność”:
 * pytanie „od kogo obrywam” zadaje się częściej niż „którą umiejętnością”,
 * a przy kilku przeciwnikach płaska lista mieszała oba porządki naraz.
 *
 * `label` to nazwa napastnika, a przy DoT bez sprawcy — nazwa samego efektu
 * („od trucizny”), bo log nie mówi, kto go nałożył.
 */
/**
 * Dwuszczeblowe rozbicie: postać po drugiej stronie ciosu, a pod nią czym padło.
 * Służy obu kierunkom — napastnikom (`takenFromBy`) i celom (`dealtToBy`) — bo
 * pytanie jest symetryczne, zmienia się tylko strona: „od kogo” kontra „na kim”.
 */
export type AttackerBreakdown = {
  label: string;
  amount: number;
  hits: number;
  /** Czym uderzano — malejąco po obrażeniach. */
  by: DamageSource[];
};

/** Rodzina typu obrażeń przypięta do etykiety rozbicia — patrz `ActorStats.typeByLabel`. */
export type LabelType = { label: string; type: string };

/**
 * Sprowadza etykietę typu obrażeń do RODZINY.
 *
 * Log nazywa tę samą rzecz dwojako, zależnie od tego, którędy przyszła: żywioł
 * odczytany z klasy CSS mówi „ogień", a tykający efekt „od ognia". W korpusie
 * takich etykiet jest dwanaście, a rodzin siedem — i to rodzina jest jednostką,
 * w której warto o tym myśleć.
 *
 * Nierozpoznane zostaje bez rodziny: „bez żywiołu" (log wklejony jako sam
 * tekst) ma znaczyć „nie wiadomo", a nie udawać kolejnego typu. Tak samo każdy
 * typ, którego gra dopiero dorobi — zgadywanie byłoby gorsze niż brak koloru.
 *
 * Mieszka tu, a nie w palecie, bo to podział DZIEDZINY, nie decyzja o wyglądzie:
 * korzysta z niego i agregacja (dominujący typ umiejętności), i widok (barwa).
 */
export function typeFamily(label: string): string | null {
  const text = label.toLowerCase();
  if (text.includes("ogni") || text.includes("ogień")) return "ogień";
  if (text.includes("błyskaw")) return "błyskawica";
  if (text.includes("zimn")) return "zimno";
  if (text.includes("truci")) return "trucizna";
  if (text.includes("ran")) return "rana";
  if (text.includes("nieuchron")) return "nieuchronne";
  if (text.includes("fizyczn") || text.includes("dystans")) return "broń";
  return null;
}

export type ActorStats = {
  name: string;
  /** Strona z linii otwierającej; null, gdy postaci nie było w składzie. */
  side: number | null;
  /**
   * Kod profesji z logu (`85b` → `b`), null dla postaci spoza składu. Litera,
   * nie nazwa: `PROFESSIONS` tłumaczy ją na tekst, a nierozpoznanej litery nie
   * zgadujemy — log potrafi dodać profesję, której jeszcze nie znamy.
   */
  professionCode: string | null;
  /** Poziom z linii otwierającej albo ze składu z gry; null dla postaci spoza składu. */
  level: number | null;
  damageDealt: number;
  damageTaken: number;
  /** Obrażenia pochłonięte przez cel (raw - applied). */
  damageAbsorbed: number;
  healingDone: number;
  healingReceived: number;
  /**
   * Ciosy, które weszły (bez uników). Liczymy CIOSY, nie liczby obrażeń: jeden
   * cios maga niesie dwie liczby (zimno + błyskawica), a to nadal jeden cios.
   */
  hits: number;
  /** Ataki zakończone unikiem celu. */
  misses: number;
  crits: number;
  /**
   * Tury, w których postać działała. Log nie numeruje tur, więc turą jest
   * nieprzerwany ciąg jej akcji: "Podwójny strzał" to dwa ciosy w JEDNEJ turze.
   * Wliczamy też tury utracone.
   */
  turns: number;
  /** Najsilniejszy pojedynczy cios — suma jego liczb, nie największa z nich. */
  maxHit: number;
  turnsLost: number;
  /** Z czego złożyły się obrażenia zadane, malejąco. */
  dealtBy: DamageSource[];
  /**
   * To samo w dwóch szczeblach, lustro `takenFromBy`: komu postać zadała, a po
   * zejściu w konkretny cel — czym w niego uderzała. Płaski przekrój „czym
   * zadane w ogóle” zostaje w `dealtBy`; tu chodzi o rozbicie po celu.
   */
  dealtToBy: AttackerBreakdown[];
  /**
   * Od kogo/od czego przyszły obrażenia przyjęte, malejąco. Etykieta skleja
   * napastnika z ciosem („Wilk · Zwykły atak”) — płaski przekrój na potrzeby
   * sum i dymków. Do drążenia służy `takenFromBy`.
   */
  takenFrom: DamageSource[];
  /** To samo w dwóch szczeblach: najpierw napastnik, potem czym uderzał. */
  takenFromBy: AttackerBreakdown[];
  /**
   * Obrażenia od DoT-u, którego sprawcy log nie podał — ta część `damageTaken`,
   * której nie da się nikomu przypisać. Wliczona w `damageTaken`, więc NIE
   * dodawaj jej osobno; służy do przypisu „trucizna bez sprawcy” w widoku tej
   * jednej postaci.
   */
  unattributedDotTaken: number;
  /**
   * Te same obrażenia w drugim przekroju: wg typu (żywioł, trucizna, głęboka
   * rana...). Suma jest identyczna jak w `dealtBy` — to inny podział, nie
   * dodatkowe obrażenia.
   */
  dealtByType: DamageSource[];
  /** Jak `dealtByType`, ale dla obrażeń przyjętych. */
  takenByType: DamageSource[];
  /**
   * Skąd wzięło się leczenie, malejąco. Log nie podaje leczącego, więc gołe
   * "Przywrócono N punktów życia" idzie pod "Regeneracja".
   */
  healedBy: DamageSource[];
  /**
   * Efekty, które ta postać WYZWOLIŁA w swoich ciosach — czyli te, które ma
   * z ekwipunku. Malejąco po liczbie wystąpień.
   */
  procs: ProcCount[];
  /**
   * Ten sam worek widziany z drugiej strony: efekty, które ktoś wyzwolił NA
   * tej postaci. Osobne pole, bo to inne pytanie — "co ja nakładam" kontra
   * "co się na mnie sypie" — a jedna liczba nie odpowiada na oba.
   */
  procsReceived: ProcCount[];
  /**
   * Ile razy postać ODPALIŁA daną akcję, malejąco. To nie to samo, co `hits`
   * w `dealtBy`: "Podwójny strzał" to jedno użycie i dwa ciosy, a akcja
   * wyunikana w całości ma użycie i zero ciosów.
   *
   * Osobne pole, a nie kolejna kolumna w `DamageSource`, bo użycie ma sens
   * wyłącznie po stronie zadających. W rozbiciu obrażeń przyjętych ta sama
   * etykieta znaczy "czyjeś uderzenie we mnie", a jedno użycie umiejętności
   * potrafi trafić kilka celów — liczba użyć nie rozkłada się wtedy na cele.
   */
  abilityUses: ProcCount[];
  /**
   * Rodzina typu obrażeń dla etykiet rozbicia — po niej overlay dobiera barwę
   * paska („Lodowy pocisk" → zimno, „od trucizny" → trucizna).
   *
   * Osobne pole, a nie kolumna w `DamageSource`, z dwóch powodów: ta sama
   * etykieta pada w kilku rozbiciach naraz (płaskim, dwuszczeblowym, po typie),
   * a typ jest jej wspólną własnością — powtarzanie go w każdej pozycji
   * rozjeżdżałoby się przy sumowaniu sesji. Etykiety niosące kilka żywiołów
   * (Fuzja żywiołów: zimno + błyskawica + nieuchronne) dostają ten, który
   * DOMINUJE obrażeniami — pasek ma jeden kolor, więc musi wybrać.
   */
  typeByLabel: LabelType[];
};
