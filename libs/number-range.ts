/**
 * A number held between two ends.
 *
 * `@std/math`'s `clamp` answers the top where the top is below the bottom. Here the bottom wins:
 * that is the case a caller meets when the space it is clamping into has run out entirely.
 */

import { assert } from "@std/assert/assert";

export function clamp(value: number, minimum: number, maximum: number): number {
    assert(Number.isFinite(value), "a value being held between two ends is a number");
    assert(Number.isFinite(minimum), "and so is the bottom");
    assert(Number.isFinite(maximum), "and the top");
    if (maximum < minimum) return minimum;
    if (value < minimum) return minimum;
    if (value > maximum) return maximum;
    return value;
}
