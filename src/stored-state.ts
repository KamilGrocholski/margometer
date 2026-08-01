/**
 * Odczyt stanu okien z `localStorage` — i jedyne miejsce, gdzie mu się NIE ufa.
 *
 * Pod kluczami dodatku może stać zapis starszej albo NOWSZEJ wersji, ręczna
 * poprawka albo śmieć po przerwanym zapisie. Panel wstawia te liczby prosto
 * w styl, więc jedno złe pole nie kończy się „brzydko", tylko:
 *
 * - `{"width": 1e9}` → nakładka o szerokości miliarda pikseli, przykrywająca
 *   całą grę razem z uchwytem, którym dałoby się ją zmniejszyć;
 * - `{"width": "szeroko"}` → `NaN` przechodzi przez `clampToViewport`
 *   (`Math.min(0, NaN)` to `NaN`) i host zostaje bez `left` i `top`;
 * - `{"collapsed": "nope"}` → prawdziwy string, czyli panel zwinięty na starcie.
 *
 * Stąd trzy funkcje zamiast rozsypanych `typeof`: każda odpowiada na jedno
 * pytanie i każda ma wyjście awaryjne. Wspólne dla panelu i archiwum, bo oba
 * czytają geometrię z tego samego rodzaju zapisu — dwie kopie tej samej
 * ostrożności rozjechałyby się przy pierwszej zmianie.
 */

/** Liczba nadająca się do wstawienia w styl: skończona i w granicach. */
export function storedNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

export function storedBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Wartość z zamkniętego zestawu — metryka, filtr składu, cokolwiek nazwanego. */
export function storedOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/**
 * Surowa treść spod klucza albo `null`.
 *
 * `null` znaczy „nie ma czego czytać" i obejmuje też treść, która nie jest
 * obiektem (`"null"`, `"[]"`, `"7"`) — wołający dostaje wtedy same domyślne
 * zamiast rozkładać tablicę na pola.
 */
export function storedRecord(
  // Ten sam wąski kształt, którym posługują się panel i archiwum — czytamy
  // i piszemy, reszty `Storage` nie potrzebujemy, a testy podstawiają atrapę.
  storage: Pick<Storage, "getItem"> | undefined,
  key: string,
): Record<string, unknown> | null {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    // Zepsuty JSON albo magazyn niedostępny — stan domyślny jest zawsze lepszy
    // niż brak panelu.
    return null;
  }
}
