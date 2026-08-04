/**
 * Wspólne narzędzia testów.
 *
 * Wyjęte z `overlay.test.ts` przy rozbijaniu go na pliki modułowe — te same
 * fixture'y i te same odczyty z panelu są potrzebne po kilku stronach, a kopia
 * w każdym pliku rozjechałaby się przy pierwszej zmianie formatu.
 */
import type { Overlay } from "../src/overlay.ts";
import type { BattleEvent } from "../src/types.ts";
import { syntheticFight } from "../tools/synthetic-log.ts";

/**
 * Walka „z korpusu" — SYNTETYCZNA, bo korpusu nie ma.
 *
 * ⚠️ **`tests/fixtures/` zniknęło 2026‑08‑04 w całości.** Funkcja przyjmuje
 * dalej nazwę katalogu — tak wygodniej było przepiąć ~30 wywołań — ale **nie
 * czyta niczego z dysku**: nazwa służy wyłącznie do tego, żeby ta sama nazwa
 * dawała zawsze tę samą walkę. Walki produkuje `tools/synthetic-log.ts`,
 * deterministycznie.
 *
 * Co to znaczy dla testów, które ją wołają: sensowne zostaje pytanie „czy panel
 * rysuje to, co dostał"; znika pytanie „czy gra produkuje takie kształty".
 */
export function readEvents(name: string): BattleEvent[] {
  const ROZMIARY = [2, 3, 4, 6, 8, 12, 20];
  let suma = 0;
  for (const znak of name) suma = (suma * 31 + znak.codePointAt(0)!) >>> 0;
  return syntheticFight(ROZMIARY[suma % ROZMIARY.length]!);
}

export const number = new Intl.NumberFormat("pl-PL");
/** Musi się zgadzać z formatem tempa w `overlay.ts`. */
export const rate = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });

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
