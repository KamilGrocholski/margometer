import { typeFamily } from "./types.ts";

/**
 * Kolory kategorialne dla postaci — kolejność jest stała i nigdy nie zapętlana.
 * Zwalidowane dla ciemnego tła (`validate_palette.js --mode dark`): pasmo
 * jasności, próg chromy, separacja CVD i kontrast ≥ 3:1 — wszystko PASS.
 */
export const SERIES_COLORS = [
  "#3987e5", // niebieski
  "#008300", // zielony
  "#d55181", // magenta
  "#c98500", // żółty
  "#199e70", // akwamaryna
  "#d95926", // pomarańczowy
  "#9085e9", // fioletowy
  "#e66767", // czerwony
] as const;

/** Postacie ponad ten limit trafiają do zbiorczego wiersza zamiast nowego koloru. */
export const MAX_SERIES = SERIES_COLORS.length;

export const OTHER_COLOR = "#8a8a80";
export const OTHER_LABEL = "Inni";

/**
 * Nazwane sloty tej samej, zwalidowanej listy. Obie palety niżej biorą barwy
 * WYŁĄCZNIE stąd — dobieranie hexów z palca omijałoby walidację, a to ona
 * odpowiada za to, że wiersze da się od siebie odróżnić.
 */
const [BLUE, GREEN, MAGENTA, YELLOW, AQUA, ORANGE, VIOLET, RED] = SERIES_COLORS;
// Fiolet jako jedyny nie ma dziś przydziału — zostaje wolny na kolejną profesję
// albo rodzinę obrażeń, gdy gra takie doda.
void VIOLET;

/**
 * Kolor profesji — wzorzec z SKADA/Details!: pasek niesie KLASĘ, a tożsamość
 * postaci niesie nazwa i odznaka obok niej. Dwóch magów dostaje ten sam kolor
 * i tak ma być: kolor odpowiada na „kto tu jest czym", nie „która to postać".
 *
 * Sześciu barw nie da się zrobić wzajemnie rozłącznymi na tym tle — przeszukanie
 * wszystkich podzbiorów udokumentowanej palety dało sufit czterech, a dla
 * pełnej szóstki najlepszy możliwy rozstęp to ΔE 10,6 (próg 15). Ponieważ ten
 * sufit jest taki sam dla KAŻDEGO przypisania, skojarzenia nic nie kosztują —
 * stąd układ trzymający się konwencji gatunku (mag niebieski, łowca zielony,
 * paladyn różowy). Rozróżnialność zapewnia odznaka z literą profesji, nie barwa.
 */
export const PROFESSION_COLORS: Record<string, string> = {
  w: ORANGE, // wojownik
  p: MAGENTA, // paladyn
  t: YELLOW, // tropiciel
  h: GREEN, // łowca
  m: BLUE, // mag
  b: AQUA, // tancerz ostrzy
};

export function professionColor(code: string | null): string {
  return (code && PROFESSION_COLORS[code]) || OTHER_COLOR;
}

/**
 * Kolor rodziny obrażeń — odpowiednik szkół magii w Details!.
 *
 * Tu semantyka się broni (ogień pomarańczowy, zimno niebieskie, trucizna
 * zielona) i tu kolor niesie najwięcej: w rozbiciu zwykły cios i tykająca
 * trucizna wyglądają dziś identycznie. U jednej postaci stoją naraz najwyżej
 * TRZY rodziny (maksimum z całego korpusu), a wszystkie pary, które w korpusie
 * faktycznie sąsiadowały, przechodzą próg normalnego widzenia (najgorsza 17,2).
 *
 * Siedmiu rodzin nie da się rozdzielić wzajemnie — najsłabsza para to
 * ogień↔rana (ΔE 7,1), obie ciepłe. Przeniesienie rany na wolny fiolet
 * podniosłoby najgorszą parę tylko do 9,8 (wtedy zimno↔rana), więc próg i tak
 * pozostaje niezaliczony, a krwawienie przestałoby być czerwone. Przy równym
 * wyniku wygrywa czytelność skojarzenia; etykieta na pasku niesie resztę.
 */
export const TYPE_COLORS: Record<string, string> = {
  ogień: ORANGE,
  błyskawica: YELLOW,
  zimno: BLUE,
  trucizna: GREEN,
  rana: RED,
  broń: MAGENTA,
  nieuchronne: AQUA,
};

export function typeColor(label: string | null): string {
  if (label === null) return OTHER_COLOR;
  // Etykieta bywa już nazwą rodziny (przekrój po typie — „Broń", „Ogień") albo
  // surowym zapisem z logu („od trucizny", „dystansowe"). Jedno i drugie ma
  // trafić w tę samą barwę, stąd dwie drogi.
  //
  // Pierwsza szuka po nazwie rodziny i MUSI zdjąć wielkość liter: klucze są
  // małą literą, a wiersz przychodzi z wielkiej. Sześć rodzin ratowała druga
  // droga — ich nazwa zawiera własny wzorzec, więc `typeFamily("Ogień")` je
  // odnajduje — ale „broń" powstaje z „fizyczne" i „dystansowe" i sama nie
  // zawiera żadnego. Bez `toLowerCase()` NAJWIĘKSZY wiersz w panelu dostawał
  // barwę „nie wiadomo", nie do odróżnienia od „Nieznany".
  return (
    TYPE_COLORS[label.toLowerCase()] ?? TYPE_COLORS[typeFamily(label) ?? ""] ?? OTHER_COLOR
  );
}

/**
 * Przypisuje kolor do nazwy postaci na stałe.
 *
 * Kolor idzie za postacią, nie za jej pozycją w rankingu — przełączenie
 * metryki czy przesortowanie tabeli nie może przemalować wierszy.
 */
export class ColorAssignment {
  private readonly assigned = new Map<string, string>();

  colorFor(name: string): string {
    const existing = this.assigned.get(name);
    if (existing) return existing;

    const slot = this.assigned.size;
    const color = slot < MAX_SERIES ? SERIES_COLORS[slot]! : OTHER_COLOR;
    this.assigned.set(name, color);
    return color;
  }

  /** Rejestruje kolejność, w jakiej postacie mają dostawać kolory. */
  seed(names: readonly string[]): void {
    for (const name of names) this.colorFor(name);
  }
}
