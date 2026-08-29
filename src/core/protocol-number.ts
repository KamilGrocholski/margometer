/**
 * The numbers the protocol states, read out of its text.
 *
 * `Number("")` answers 0 and `Number("12abc")` answers NaN, so nothing here reaches a caller
 * before its text has been walked. A reading answers null and throws nothing; writing asserts,
 * because by then the number is ours.
 */

import { assert } from "@std/assert";

/** Every percentage in `captures/` is written to two places, 18215 of them, 2026-08-28. */
export const HEALTH_PERCENT_PLACES = 2;

function isDigitRun(text: string): boolean {
    if (text.length === 0) return false;
    for (const character of text) {
        if (character < "0") return false;
        if (character > "9") return false;
    }
    assert(text.length > 0, "a digit run holds at least one digit");
    return true;
}

export function isIntegerText(text: string): boolean {
    const digits = text.startsWith("-") ? text.slice(1) : text;
    assert(digits.length <= text.length, "dropping a sign never grows the text");
    assert(!digits.startsWith("-"), "a sign is dropped once");
    return isDigitRun(digits);
}

/** `70.07` — a whole part, a point, and exactly the two places the protocol writes. */
export function isHealthPercentText(text: string): boolean {
    const point = text.indexOf(".");
    if (point === -1) return false;
    const fraction = text.slice(point + 1);
    if (fraction.length !== HEALTH_PERCENT_PLACES) return false;
    if (!isDigitRun(text.slice(0, point))) return false;
    assert(point < text.length, "a point sits inside the text it was found in");
    assert(fraction.length === HEALTH_PERCENT_PLACES, "the fraction is the stated width");
    return isDigitRun(fraction);
}

/** Null where the text is not an integer, and where it states one no number holds exactly. */
export function getIntegerFromText(text: string): number | null {
    if (!isIntegerText(text)) return null;
    const value = Number(text);
    if (!Number.isSafeInteger(value)) return null;
    assert(Number.isFinite(value), "an integer read from digits is a number");
    assert(String(value).length <= text.length, "reading a number never lengthens its text");
    return value;
}

export function getHealthPercentFromText(text: string): number | null {
    if (!isHealthPercentText(text)) return null;
    const value = Number(text);
    assert(Number.isFinite(value), "a percentage read from digits is a number");
    assert(value >= 0, "a percentage read from digits is never below nothing");
    return value;
}

/**
 * A share the protocol writes with or without a fraction — `30` and `22.5` are both in
 * `captures/`. Null for anything else, so a value nobody wrote never becomes a figure.
 */
export function getShareFromText(text: string): number | null {
    const point = text.indexOf(".");
    if (point === -1) {
        if (!isDigitRun(text)) return null;
        return Number(text);
    }
    if (!isDigitRun(text.slice(0, point))) return null;
    if (!isDigitRun(text.slice(point + 1))) return null;
    const value = Number(text);
    assert(Number.isFinite(value), "a share read from digits is a number");
    assert(value >= 0, "and never below nothing");
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

export function composeHealthPercentText(value: number): string {
    assert(Number.isFinite(value), "a percentage written back is a number");
    assert(value >= 0, "a percentage written back is never below nothing");
    return value.toFixed(HEALTH_PERCENT_PLACES);
}
