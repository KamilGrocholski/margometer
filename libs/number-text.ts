/**
 * Numbers read out of text and written back into it.
 *
 * `Number("")` answers 0 and `Number("12abc")` answers NaN, so nothing here reaches `Number` before
 * its text has been walked. A reading has one reason to fail and answers `null` (E6); a writer
 * asserts, because by then the number is the caller's own (E8).
 */

import { assert } from "@std/assert/assert";
import { isDigitRun } from "@/libs/text-walk.ts";

const MINUS = "-";
const POINT = ".";

/** Digits with an optional minus, held exactly: past 2^53 is refused, never neighboured. */
export function parseInteger(text: string): number | null {
    const digits = text.startsWith(MINUS) ? text.slice(MINUS.length) : text;
    if (!isDigitRun(digits)) return null;
    const value = Number(text);
    if (!Number.isSafeInteger(value)) return null;
    assert(String(value).length <= text.length, "reading a number never lengthens its text");
    if (digits === text) assert(value >= 0, "digits with no minus read as nothing or above");
    else assert(value <= 0, "digits behind a minus read as nothing or below");
    return value;
}

/** Digits, optionally a point and more digits. No sign. */
export function parseDecimal(text: string): number | null {
    const point = text.indexOf(POINT);
    if (point === -1) {
        if (!isDigitRun(text)) return null;
    } else {
        if (!isDigitRun(text.slice(0, point))) return null;
        if (!isDigitRun(text.slice(point + POINT.length))) return null;
    }
    const value = Number(text);
    assert(Number.isFinite(value), "a decimal read from digits is a number");
    assert(value >= 0, "and never below nothing, because no sign was admitted");
    return value;
}

export function formatInteger(value: number): string {
    assert(Number.isSafeInteger(value), "an integer written is one held exactly");
    const text = String(value);
    assert(text.length > 0, "a number is written as at least one character");
    return text;
}

/**
 * Through a writer rather than interpolation: a share of a tenth comes out as `10.000000000000002`
 * in template text, and a value that is not a number reaches the text as `NaN` with nothing marked.
 */
export function formatDecimal(value: number, places: number): string {
    assert(Number.isFinite(value), "a number written is a number");
    assert(Number.isSafeInteger(places), "and is written to a whole number of places");
    assert(places >= 0, "never fewer than none");
    return value.toFixed(places);
}
