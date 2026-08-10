/**
 * Every number this project reads or writes passes through here.
 *
 * `Number(text)`, `parseInt` and `parseFloat` are conversions, not parsers, and
 * each has a way of producing a number nobody wrote:
 *
 *   Number("")        === 0          an empty field becomes a measurement
 *   Number(" 5 ")     === 5          whitespace is discarded
 *   Number("0x10")    === 16         a different base is accepted silently
 *   Number("1e3")     === 1000       so is scientific notation
 *   parseInt("12abc") === 12         the tail is dropped
 *
 * The first is the expensive one: `0` is a perfectly good reading, so a field
 * that arrived empty becomes indistinguishable from one that arrived as zero.
 *
 * Reading and writing are not symmetrical, and the difference decides the shape
 * of every function below:
 *
 *   - **Reading** takes something somebody else produced, so it returns `null`
 *     and throws nothing. What that means depends on where the text came from,
 *     and only the caller knows: an invariant of ours gets an assertion,
 *     material handed to a tool gets a thrown error, and the live protocol
 *     becomes an explicit unknown the panel can show. Deciding here would take
 *     that choice away from all three.
 *   - **Writing** takes a number that is already ours — parsed by the functions
 *     above, or counted by us — so a value that cannot be written is a broken
 *     invariant rather than a failure anyone can handle. It asserts, and the
 *     caller gets a `string` instead of a `null` to thread through.
 */

import { assert } from "@/libs/assert.ts";

const INTEGER_TEXT = /^-?\d+$/;
const DECIMAL_TEXT = /^-?\d+\.\d+$/;
const HEXADECIMAL_TEXT = /^[0-9a-f]+$/i;

/**
 * Null unless the text is a plain decimal integer that survives the round trip.
 * Beyond 2^53 the digits stop mapping one-to-one onto values, so a longer
 * number would silently come back as a neighbour of itself.
 */
export function getIntegerFromText(text: string): number | null {
  if (!INTEGER_TEXT.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Null unless the text is hexadecimal digits and nothing else.
 *
 * Its own reader because the ways of spelling this all lie: `parseInt("zz", 16)`
 * is `NaN`, `parseInt("ffzz", 16)` is 255 — it reads as far as it can and keeps
 * what it got — and `Number("0xff")` needs a prefix the text may not carry. A
 * colour channel read half-way is a colour nobody chose.
 */
export function getIntegerFromHexadecimalText(text: string): number | null {
  if (!HEXADECIMAL_TEXT.test(text)) return null;
  const value = parseInt(text, 16);
  return Number.isSafeInteger(value) ? value : null;
}

/** Null unless the text is digits, a point, and digits. No exponent, no bare `.5`. */
export function getDecimalFromText(text: string): number | null {
  if (!DECIMAL_TEXT.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/**
 * A number that already arrived as a number — out of `JSON.parse`, so its type
 * is `unknown` and nothing has checked it. Same magnitude rule as the text
 * side: an id past 2^53 is refused rather than snapped to its neighbour, and a
 * numeric *string* is refused rather than quietly converted.
 */
export function getIntegerFromValue(value: unknown): number | null {
  if (typeof value !== "number") return null;
  return Number.isSafeInteger(value) ? value : null;
}

/** The same, where the concept allows a fraction. `NaN` and both infinities are refused. */
export function getFiniteNumberFromValue(value: unknown): number | null {
  if (typeof value !== "number") return null;
  return Number.isFinite(value) ? value : null;
}

/**
 * Digits, and nothing else. `String(1e21)` is `"1e+21"` and `String(NaN)` is
 * `"NaN"` — both are text that will not read back, which is why the range is an
 * assertion and not a comment.
 */
export function composeIntegerText(value: number): string {
  assert(Number.isSafeInteger(value), "an integer written back is a safe integer");
  return value.toFixed(0);
}

/** Fixed-point, `places` digits after the point. Same reasoning as above for the range. */
export function composeDecimalText(value: number, places: number): string {
  assert(Number.isFinite(value), "a decimal written back is finite");
  assert(Number.isSafeInteger(places) && places >= 0, "a digit count is a whole number of digits");
  return value.toFixed(places);
}
