/**
 * Numbers read out of text and written back into it.
 *
 * `Number("")` answers 0 and `Number("12abc")` answers NaN, so nothing here reaches `Number` before
 * its text has been walked. A reading has one reason to fail and answers `null` (E6); a writer
 * asserts, because by then the number is the caller's own (E8).
 */

import { assert } from "@std/assert/assert";
import { isDigitRun } from "./text-walk.ts";

const MINUS = "-";
/** What `toFixed` writes at most, and throws a `RangeError` past (ECMA-262 §21.1.3.3). */
const PLACES_MAXIMUM = 100;
const POINT = ".";

/** Digits with an optional minus, held exactly: past 2^53 is refused, never neighboured. */
export function parseInteger(text: string): number | null {
    const digits = text.startsWith(MINUS) ? text.slice(MINUS.length) : text;
    if (!isDigitRun(digits)) return null;
    const integer = Number(text);
    if (!Number.isSafeInteger(integer)) return null;
    assert(String(integer).length <= text.length, "reading a number never lengthens its text");
    if (digits === text) assert(integer >= 0, "digits with no minus read as nothing or above");
    else assert(integer <= 0, "digits behind a minus read as nothing or below");
    return integer;
}

/** Digits, optionally a point and more digits. No sign, and past the largest double is refused. */
export function parseDecimal(text: string): number | null {
    const point = text.indexOf(POINT);
    if (point === -1) {
        if (!isDigitRun(text)) return null;
    } else {
        if (!isDigitRun(text.slice(0, point))) return null;
        if (!isDigitRun(text.slice(point + POINT.length))) return null;
    }
    const decimal = Number(text);
    // ⚠️ Digits never read as NaN, but enough of them read as `Infinity`, which states no number.
    if (!Number.isFinite(decimal)) return null;
    assert(decimal >= 0, "a decimal read from digits is never below nothing, having no sign");
    return decimal;
}

export function formatInteger(integer: number): string {
    assert(Number.isSafeInteger(integer), "an integer written is one held exactly");
    const text = String(integer);
    assert(text.length > 0, "a number is written as at least one character");
    return text;
}

/**
 * Through a writer rather than interpolation: a share of a tenth comes out as `10.000000000000002`
 * in template text, and a value that is not a number reaches the text as `NaN` with nothing marked.
 */
export function formatDecimal(decimal: number, places: number): string {
    assert(Number.isFinite(decimal), "a number written is a number");
    assert(Number.isSafeInteger(places), "and is written to a whole number of places");
    assert(places >= 0, "never fewer than none");
    assert(places <= PLACES_MAXIMUM, "and never more than the platform writes");
    return decimal.toFixed(places);
}
