/**
 * The numbers the protocol states, in the shapes it states them in.
 *
 * The arithmetic is `libs/number-text.ts`'s; what is here is the shape a percentage and a share
 * are written in, which is a measurement over `captures/` and not a property of numbers.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { composeDecimalText, getDecimalFromText } from "@/libs/number-text.ts";
import { isDigitRun } from "@/libs/text-walk.ts";

/** Every percentage in `captures/` is written to two places, 18215 of them, 2026-08-28. */
export const HEALTH_PERCENT_PLACES = 2;

/** `70.07` — a whole part, a point, and exactly the two places the protocol writes. */
function isHealthPercentText(text: string): boolean {
    const point = text.indexOf(".");
    if (point === -1) return false;
    const fraction = text.slice(point + 1);
    if (fraction.length !== HEALTH_PERCENT_PLACES) return false;
    if (!isDigitRun(text.slice(0, point))) return false;
    assert(point < text.length, "a point sits inside the text it was found in");
    assertEquals(fraction.length, HEALTH_PERCENT_PLACES, "the fraction is the stated width");
    return isDigitRun(fraction);
}

export function getHealthPercentFromText(text: string): number | null {
    if (!isHealthPercentText(text)) return null;
    const value = getDecimalFromText(text);
    assertExists(value, "text of the stated width is text a decimal is read from");
    assert(value >= 0, "a percentage read from digits is never below nothing");
    return value;
}

/**
 * A share the protocol writes with or without a fraction — `30` and `22.5` are both in
 * `captures/`. Null for anything else, so a value nobody wrote never becomes a figure.
 */
export function getShareFromText(text: string): number | null {
    return getDecimalFromText(text);
}

export function composeHealthPercentText(value: number): string {
    assert(Number.isFinite(value), "a percentage written back is a number");
    assert(value >= 0, "a percentage written back is never below nothing");
    return composeDecimalText(value, HEALTH_PERCENT_PLACES);
}
