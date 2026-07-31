/**
 * Wspólne narzędzia testów.
 *
 * Wyjęte z `overlay.test.ts` przy rozbijaniu go na pliki modułowe — te same
 * fixture'y i te same odczyty z panelu są potrzebne po kilku stronach, a kopia
 * w każdym pliku rozjechałaby się przy pierwszej zmianie formatu.
 */
import type { Overlay } from "../src/overlay.ts";

export const FIXTURES = new URL("./fixtures/", import.meta.url).pathname;
export const readFixture = (name: string) => Bun.file(`${FIXTURES}${name}/raw.txt`).text();

export const number = new Intl.NumberFormat("pl-PL");
/** Musi się zgadzać z formatem tempa w `overlay.ts`. */
export const rate = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });

/**
 * Suma WSZYSTKICH liczb w dowolnie zagnieżdżonej strukturze.
 *
 * Służy strażnikowi sumowania sesji: dzięki temu, że nie wie nic o kształcie
 * `ActorStats`, obejmuje także pola, których jeszcze nie ma.
 */
export const deepSum = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (Array.isArray(value)) return value.reduce((sum: number, item) => sum + deepSum(item), 0);
  if (value && typeof value === "object") {
    return Object.values(value).reduce((sum: number, item) => sum + deepSum(item), 0);
  }
  return 0;
};

// Pasek niesie numer, nazwę i JEDNĄ liczbę wiodącą, a reszta (udział, druga
// miara) siedzi w nawiasie WEWNĄTRZ tej liczby — nie w osobnej kolumnie. Stąd
// te dwa helpery: `.value` bez czytania firstChild dałoby liczbę razem
// z nawiasem, a `.share` — cały nawias zamiast samego procentu.
/** Sama liczba wiodąca, bez nawiasu: „39,4k (21% · 1,2k/t)” → „39,4k”. */
export const valueOf = (row: ParentNode | null | undefined) =>
  row?.querySelector(".value")?.firstChild?.textContent?.trim() ?? null;
/** Sam procent z nawiasu: „(21% · 1,2k/t)” → „21%”. */
export const shareOf = (row: ParentNode | null | undefined) =>
  row?.querySelector(".share")?.textContent?.match(/\d+%/)?.[0] ?? null;

export const metricButton = (overlay: Overlay, label: string) =>
  [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === label)!;
