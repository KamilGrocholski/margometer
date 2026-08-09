import type { RosterEntry } from "../src/roster.ts";
import type { BattleEvent, Hit } from "../src/types.ts";

/**
 * Budowanie strumieni `BattleEvent[]` wprost, bez przechodzenia przez odczyt.
 *
 * PO CO. Testy agregatu opisywały wejście SYNTETYCZNYMI ZDANIAMI i puszczały je
 * przez odczyt — wygodnie, ale wiązało `stats.ts` z warstwą, która została
 * usunięta 2026‑08‑04. Zdarzenia są kontraktem między KAŻDYM źródłem
 * a agregatem, więc test agregatu ma je podawać wprost.
 *
 * Zysk poza samą niezależnością: wejście przestaje przechodzić przez drugi kod.
 * Gdy test „nie zgaduje sprawcy trucizny" padał, trzeba było najpierw ustalić,
 * czy zawinił agregat, czy odczyt zdania. Teraz jest jedna odpowiedź.
 *
 * ⚠️ Te pomocniki NIE MAJĄ walidować ani domyślać się pól. Mają być na tyle
 * cienkie, żeby dało się przeczytać, jakie dokładnie zdarzenie powstaje —
 * inaczej test opisywałby pomocnik, a nie agregat.
 */

/**
 * SKŁAD walki, nie zdarzenie — drugi argument `aggregate`, ten sam kanał, którym
 * skład podaje gra (`Engine.battle` → `roster.ts`).
 *
 * ⚠️ **DO 2026‑08‑09 ODDAWAŁO `{kind: "fight-start"}` I BYŁO TO JEDYNE, CO TEN
 * WARIANT TRZYMAŁO PRZY ŻYCIU.** Dekoder protokołu nigdy go nie produkował, więc
 * cały korpus testowy karmił `stats.ts` drogą, której produkcja nie ma. Nazwa
 * `otwarcie` zostaje mimo zmiany typu: opisuje, CO się podaje (kto z kim staje
 * do walki), a nie którym wariantem zdarzenia.
 *
 * Wygodny skrót zapisu `"Gracz 1w"` — bo w testach uczestnicy różnią się
 * zwykle tylko nazwą, a rozpisywanie czterech pól przy każdym zaciemniało
 * to, co w danym teście istotne. Strona 0 to drużyna gracza, 1 to przeciwnicy.
 *
 * `id` nadajemy z pozycji, bo `stats.ts` używa go jako klucza składu; wartości
 * są dowolne, byle różne. Zdarzenia z tych pomocników `id` NIE niosą, więc
 * rozdzielanie instancji leci tu heurystyką po życiu, dokładnie jak przedtem.
 */
export function otwarcie(strona0: string[], strona1: string[]): RosterEntry[] {
  const czytaj = (opis: string, side: number, id: number): RosterEntry => {
    const [name, statystyki] = opis.split(/\s+(?=\d)/);
    const poziom = Number.parseInt(statystyki ?? "1", 10);
    return {
      id,
      name: name!,
      side,
      prof: (statystyki ?? "1w").slice(-1),
      lvl: Number.isFinite(poziom) ? poziom : 1,
    };
  };
  return [
    ...strona0.map((o, i) => czytaj(o, 0, i + 1)),
    ...strona1.map((o, i) => czytaj(o, 1, strona0.length + i + 1)),
  ];
}

/** Pojedyncza liczba obrażeń w ciosie. Domyślnie zwykłe trafienie bez żywiołu. */
export function trafienie(raw: number, applied = raw, nadpisz: Partial<Hit> = {}): Hit {
  return {
    raw,
    applied,
    crit: false,
    superCrit: false,
    secondary: false,
    element: null,
    dodged: false,
    ...nadpisz,
  };
}

export function cios(
  source: string,
  target: string,
  hits: Hit[],
  nadpisz: Partial<Extract<BattleEvent, { kind: "attack" }>> = {},
): BattleEvent {
  return {
    kind: "attack",
    source,
    target,
    sourceHpPct: 100,
    targetHpPct: 100,
    hits,
    dodged: false,
    blocked: null,
    procs: [],
    ability: null,
    strike: true,
    ...nadpisz,
  };
}

/** Tyknięcie obrażeń bez sprawcy — trucizna, głęboka rana, zranienie. */
export function tykniecie(
  target: string,
  targetHpPct: number,
  amount: number,
  dotType: string,
  via: "od" | "po" = "od",
  weakenedPct: number | null = null,
): BattleEvent {
  return { kind: "dot", target, targetHpPct, amount, via, dotType, weakenedPct };
}

export function leczenie(
  target: string,
  amount: number,
  nadpisz: Partial<Extract<BattleEvent, { kind: "heal" }>> = {},
): BattleEvent {
  return {
    kind: "heal",
    ability: null,
    target,
    amount,
    self: false,
    targetHpPct: null,
    ...nadpisz,
  };
}

/** „Wilk(100%) zrobił krok do przodu." — treści komunikatu zdarzenie już nie niesie. */
export function krok(actor: string, hpPct: number): BattleEvent {
  return { kind: "move", actor, hpPct };
}

/** Zapowiedź „X wykonuje Y." — obrażenia niosą dopiero kolejne zdarzenia. */
export function umiejetnosc(actor: string, name: string): BattleEvent {
  return { kind: "ability", actor, name };
}

/**
 * Linia, której odczyt nie zrozumiał.
 *
 * Potrzebne, bo część syntetycznych wejść w testach agregatu NIOSŁA takie linie
 * — na przykład gołe „Wilk(80%) otrzymał -100 obrażeń" bez poprzedzającego
 * ciosu. Odczyt zgłaszał je jako nierozpoznane i do statystyk nie
 * wchodziły; przy przepisywaniu tych testów na zdarzenia zostają wiernie,
 * zamiast po cichu zniknąć. Inaczej test twierdziłby, że sprawdza coś, czego
 * jego wejście nigdy nie niosło.
 */
export function nieznane(
  line: string,
  lineNo: number,
  /**
   * Domyślnie CAŁY komunikat i STRATA — bo tak wyglądały wszystkie wejścia,
   * dla których ten helper powstał (gołe „otrzymał" bez ciosu, `AUDYT‑114`).
   * Wywołania badające segment podają to jawnie; domyślna wartość jest tu
   * wygodą TESTU, a nie skrótem dostępnym w `src/`, gdzie każde wywołanie
   * czujki musi wybrać komórkę samo.
   */
  poza: Partial<Pick<Extract<BattleEvent, { kind: "unknown" }>, "scope" | "dropped">> = {},
): BattleEvent {
  return { kind: "unknown", line, lineNo, scope: "message", dropped: true, ...poza };
}
