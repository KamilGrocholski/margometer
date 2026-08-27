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
import {
  getEndOfDigits,
  isHexadecimalDigitAt,
} from "@/libs/text-runs.ts";

const MINUS = "-";
const POINT = ".";

/**
 * `-?digits`, whole — the shape alone, with nothing said about magnitude.
 *
 * Exported because a caller that has to tell a malformed field from an
 * out-of-range one needs the two answers apart: `src/core/protocol-message.ts`
 * refuses a side segment that is not an id differently from one stating an id
 * past 2^53, and the decoder turns only the second into a loud unknown.
 */
export function isIntegerText(text: string): boolean {
  const start = text[0] === MINUS ? 1 : 0;
  const end = getEndOfDigits(text, start);
  return end > start && end === text.length;
}

/**
 * Unsigned digits, a point, and exactly `places` digits — the shape alone.
 *
 * Its own reader because two callers need the shape without the value, and both
 * of them read the same field: the health percentage the protocol writes to two
 * places, in a side segment (`src/core/protocol-message.ts`) and in the tail of
 * a name (`src/core/fight-decoder.ts`). A tail that is not this shape is not a
 * percentage at all and the text is a name; a tail that is this shape and still
 * will not read is a fault. One answer cannot carry both.
 */
export function isFixedDecimalText(text: string, places: number): boolean {
  assert(Number.isSafeInteger(places) && places > 0, "a fixed decimal has a whole number of places");
  const whole = getEndOfDigits(text, 0);
  if (whole === 0 || text[whole] !== POINT) return false;
  const fraction = getEndOfDigits(text, whole + 1);
  return fraction - whole - 1 === places && fraction === text.length;
}

/** `-?digits.digits`, whole. No exponent, no bare `.5`, no trailing point. */
function isDecimalText(text: string): boolean {
  const start = text[0] === MINUS ? 1 : 0;
  const whole = getEndOfDigits(text, start);
  if (whole === start || text[whole] !== POINT) return false;
  const fraction = getEndOfDigits(text, whole + 1);
  return fraction > whole + 1 && fraction === text.length;
}

/** Hexadecimal digits in either case, whole. */
function isHexadecimalText(text: string): boolean {
  if (text.length === 0) return false;
  for (let index = 0; index < text.length; index += 1) {
    if (!isHexadecimalDigitAt(text, index)) return false;
  }
  return true;
}

/**
 * Null unless the text is a plain decimal integer that survives the round trip.
 * Beyond 2^53 the digits stop mapping one-to-one onto values, so a longer
 * number would silently come back as a neighbour of itself.
 */
export function getIntegerFromText(text: string): number | null {
  if (!isIntegerText(text)) return null;
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
  if (!isHexadecimalText(text)) return null;
  const value = parseInt(text, 16);
  return Number.isSafeInteger(value) ? value : null;
}

/** Null unless the text is digits, a point, and digits. No exponent, no bare `.5`. */
export function getDecimalFromText(text: string): number | null {
  if (!isDecimalText(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/**
 * A number that may or may not carry a fraction — either spelling, one reader.
 *
 * Arrived at the third caller, which is the rule: the protocol states `30` and
 * `22.5` for the same key in the same fight, so "is this a number" cannot be
 * answered by either reader alone. Both were being tried in sequence in two
 * tests and the decoder, and three copies of `a ?? b` is exactly how two files
 * end up disagreeing about what a number is.
 *
 * Deliberately **not** a loosening of the two above: each still answers its own
 * narrower question, and a caller that needs a whole number should keep asking
 * for one.
 */
export function getNumberFromText(text: string): number | null {
  return getIntegerFromText(text) ?? getDecimalFromText(text);
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

/**
 * A byte as two hexadecimal digits, which is the other direction of
 * `getIntegerFromHexadecimalText`.
 *
 * It asserts rather than returning null because the number is ours: §9.5 splits
 * reading from writing on exactly that. `.toString(16)` is one of the spellings
 * that answers with a value nobody wrote — `(-1).toString(16)` is `"-1"` and
 * `(1.5).toString(16)` is `"1.8"`, and either one padded to two digits is a
 * colour channel that looks like a colour channel.
 */
export function composeHexadecimalByteText(value: number): string {
  assert(
    Number.isSafeInteger(value) && value >= 0 && value <= 255,
    "a byte written back as hexadecimal is a whole number of one byte",
  );
  return value.toString(16).padStart(2, "0");
}

/** Fixed-point, `places` digits after the point. Same reasoning as above for the range. */
export function composeDecimalText(value: number, places: number): string {
  assert(Number.isFinite(value), "a decimal written back is finite");
  assert(Number.isSafeInteger(places) && places >= 0, "a digit count is a whole number of digits");
  return value.toFixed(places);
}
