/**
 * Health read out of the share the protocol states, and how far that reading can be off.
 *
 * A reading is refused rather than defaulted: a share taken of a maximum nobody stated is a
 * figure that is too high, which is the one direction a panel cannot mark.
 */

import { assert } from "@std/assert";
import { HEALTH_PERCENT_PLACES } from "@/src/core/protocol-number.ts";

const PERCENT_WHOLE = 100;
const DECIMAL_BASE = 10;
/** Two places stand for a band half a place wide, and the health behind it is that share. */
const HALF_PLACE = 0.5;

export function getHealthToleranceFromMaximum(healthMaximum: number): number {
    assert(Number.isFinite(healthMaximum), "a maximum to measure against is a number");
    assert(healthMaximum >= 0, "a maximum is never below nothing");
    const places = DECIMAL_BASE ** HEALTH_PERCENT_PLACES;
    const band = (healthMaximum * HALF_PLACE) / (PERCENT_WHOLE * places);
    return Math.ceil(band + HALF_PLACE);
}

/** Null where nothing stated a maximum. Zero is a reading, and never stands in for one. */
export function getHealthFromPercent(percent: number, healthMaximum: number | null): number | null {
    assert(Number.isFinite(percent), "a percentage to read from is a number");
    assert(percent >= 0, "a percentage is never below nothing");
    if (healthMaximum === null) return null;
    assert(Number.isFinite(healthMaximum), "a maximum to read against is a number");
    const health = Math.round((percent * healthMaximum) / PERCENT_WHOLE);
    assert(health >= 0, "health read from a percentage is never below nothing");
    return health;
}
