/**
 * Wspólne narzędzia testów.
 *
 * Wyjęte z `overlay.test.ts` przy rozbijaniu go na pliki modułowe — te same
 * fixture'y i te same odczyty z panelu są potrzebne po kilku stronach, a kopia
 * w każdym pliku rozjechałaby się przy pierwszej zmianie formatu.
 */
import type { Overlay } from "../src/overlay.ts";
import type { Proc } from "../src/types.ts";
import { aggregate, type BattleStats } from "../src/stats.ts";
import { syntheticFight, type SyntetycznaWalka } from "../tools/synthetic-log.ts";

/**
 * Efekt w ciosie — materiał testowy dla `BattleEvent.attack.procs`.
 *
 * Domyślnie po stronie BIJĄCEGO, bo tak jest z większością (167 z 200 kluczy).
 * `side: "target"` podaje się jawnie i to jest zamierzone: strona jest tu
 * treścią testu, a nie szczegółem konstrukcji.
 *
 * `key` domyślnie schodzi z etykiety, bo w większości testów nie ma znaczenia —
 * liczy się tam, gdzie kod DECYDUJE po kluczu (`+injure`), i wtedy podaje się go
 * wprost.
 */
export function efekt(label: string, poza: Partial<Proc> = {}): Proc {
  return { key: label, label, value: null, side: "attacker", ...poza };
}

/**
 * Walka pod nazwą — SYNTETYCZNA, deterministyczna, **nieczytana z dysku**.
 *
 * ⚠️ **NAZWA JEST DZIŚ TYLKO ZIARNEM.** Do 2026‑08‑04 wskazywała katalog
 * z prawdziwą walką; katalog zszedł z drzewa razem z korpusem, a funkcja
 * przyjmuje nazwę dalej — tak było taniej niż przepinać ~30 wywołań. Ta sama
 * nazwa daje zawsze tę samą walkę i to jest cała jej rola. Walki produkuje
 * `tools/synthetic-log.ts`.
 *
 * Co to znaczy dla testów, które ją wołają: sensowne zostaje pytanie „czy panel
 * rysuje to, co dostał"; znika pytanie „czy gra produkuje takie kształty".
 *
 * ⚠️ Oddaje PARĘ (zdarzenia + skład) od 2026‑08‑09, bo skład przestał jechać
 * w strumieniu jako `fight-start`. Para, a nie dwie funkcje: nie da się wtedy
 * wziąć zdarzeń i zapomnieć składu, a agregat bez składu liczy co innego.
 */
export function readEvents(name: string): SyntetycznaWalka {
  const ROZMIARY = [2, 3, 4, 6, 8, 12, 20];
  let suma = 0;
  for (const znak of name) suma = (suma * 31 + znak.codePointAt(0)!) >>> 0;
  return syntheticFight(ROZMIARY[suma % ROZMIARY.length]!);
}

/**
 * `aggregate` obiema stronami walki syntetycznej naraz.
 *
 * Istnieje po to, żeby ~30 wywołań w testach panelu nie powtarzało rozpakowania
 * pary — a przy okazji żeby nie dało się podać zdarzeń BEZ składu i dostać
 * cichaczem innych liczb.
 */
export const statsZWalki = (walka: SyntetycznaWalka): BattleStats =>
  aggregate(walka.events, walka.sklad);

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
