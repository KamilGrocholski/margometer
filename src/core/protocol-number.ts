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

/** Everything left: a share of a pool is never more than the pool, and one past it is unread. */
const HEALTH_PERCENT_MAXIMUM = 100;

const POINT = ".";

/** `70.07`: a whole part, a point, exactly the places the protocol writes, and no more than all. */
export function parseHealthPercent(text: string): number | null {
    const pointIndex = text.indexOf(POINT);
    if (pointIndex === -1) return null;
    const fraction = text.slice(pointIndex + POINT.length);
    if (fraction.length !== HEALTH_PERCENT_PLACES) return null;
    if (!isDigitRun(text.slice(0, pointIndex))) return null;
    if (!isDigitRun(fraction)) return null;
    const healthPercent = parseDecimal(text);
    if (healthPercent === null) return null;
    if (healthPercent > HEALTH_PERCENT_MAXIMUM) return null;
    assert(healthPercent >= 0, "a percentage read from digits is never below nothing");
    return healthPercent;
}

export function encodeHealthPercent(healthPercent: number): string {
    assert(Number.isFinite(healthPercent), "a percentage written is a number");
    assert(healthPercent >= 0, "and never below nothing");
    const text = formatDecimal(healthPercent, HEALTH_PERCENT_PLACES);
    assert(parseHealthPercent(text) !== null, "what is written is what the reader reads");
    return text;
}
