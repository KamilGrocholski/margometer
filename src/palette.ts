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
