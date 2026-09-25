/**
 * The numbers the protocol states, in the shapes it states them in.
 *
 * The arithmetic is `libs/number-text.ts`'s. What is here is the shape a percentage is written in,
 * which is a measurement over the recordings and not a property of numbers.
 */

import { assert } from "@std/assert/assert";
import { formatDecimal, parseDecimal } from "#/libs/number-text.ts";
import { isDigitRun } from "#/libs/text-walk.ts";

/** Every percentage in `captures/` is written to two places, 18215 of them, 2026-08-28. */
export const HEALTH_PERCENT_PLACES = 2;

const POINT = ".";

/** `70.07`: a whole part, a point, and exactly the places the protocol writes. */
export function parseHealthPercent(text: string): number | null {
    const point = text.indexOf(POINT);
    if (point === -1) return null;
    const fraction = text.slice(point + POINT.length);
    if (fraction.length !== HEALTH_PERCENT_PLACES) return null;
    if (!isDigitRun(text.slice(0, point))) return null;
    if (!isDigitRun(fraction)) return null;
    const value = parseDecimal(text);
    assert(value !== null, "text of the stated shape is text a decimal is read from");
    assert(value >= 0, "a percentage read from digits is never below nothing");
    return value;
}

export function encodeHealthPercent(value: number): string {
    assert(Number.isFinite(value), "a percentage written is a number");
    assert(value >= 0, "and never below nothing");
    const text = formatDecimal(value, HEALTH_PERCENT_PLACES);
    assert(parseHealthPercent(text) !== null, "what is written is what the reader reads");
    return text;
}
