/**
 * Numbers read out of text and written back into it.
 *
 * `Number("")` answers 0 and `Number("12abc")` answers NaN, so nothing here reaches a caller
 * before its text has been walked. A reading answers null and throws nothing; writing asserts,
 * because by then the number is the caller's own.
 */

import { assert } from "@std/assert/assert";
import { isDigitRun } from "@/libs/text-walk.ts";

/** Text signed twice is refused, never asserted against: a reading never throws — **E9**. */
export function isIntegerText(text: string): boolean {
    const digits = text.startsWith("-") ? text.slice(1) : text;
    assert(digits.length <= text.length, "dropping a sign never grows the text");
    return isDigitRun(digits);
}

export function getIntegerFromText(text: string): number | null {
    if (!isIntegerText(text)) return null;
    const value = Number(text);
    if (!Number.isSafeInteger(value)) return null;
    assert(Number.isFinite(value), "an integer read from digits is a number");
    assert(String(value).length <= text.length, "reading a number never lengthens its text");
    return value;
}

export function getDecimalFromText(text: string): number | null {
    const point = text.indexOf(".");
    if (point === -1) {
        if (!isDigitRun(text)) return null;
        return Number(text);
    }
    if (!isDigitRun(text.slice(0, point))) return null;
    if (!isDigitRun(text.slice(point + 1))) return null;
    const value = Number(text);
    assert(Number.isFinite(value), "a decimal read from digits is a number");
    assert(value >= 0, "and never below nothing, because no sign was admitted");
    return value;
}

export function composeIntegerText(value: number): string {
    assert(Number.isSafeInteger(value), "an integer written back is an integer that was read");
    const text = String(value);
    assert(text.length > 0, "a number is written as at least one character");
    return text;
}

/**
 * A number written to a fixed number of places, for a declaration a browser is handed as text.
 *
 * Through a writer rather than through interpolation: a share of a tenth comes out as
 * `10.000000000000002` in template text, and a value that is not a number at all reaches the
 * declaration as `NaN` with nothing marked.
 */
export function composeDecimalText(value: number, places: number): string {
    assert(Number.isFinite(value), "a number written back is a number");
    assert(Number.isSafeInteger(places), "and is written to a whole number of places");
    return value.toFixed(places);
}
