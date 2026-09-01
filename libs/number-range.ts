/**
 * Where the top is below the bottom there is no room between them, and the bottom wins — the
 * case a caller hits when the space it is clamping into has run out entirely.
 */

import { assert } from "@std/assert/assert";

export function getValueWithin(value: number, minimum: number, maximum: number): number {
    assert(Number.isFinite(value), "a value being held between two ends is a number");
    assert(Number.isFinite(minimum), "and both of the ends are numbers too");
    assert(Number.isFinite(maximum), "the top of the range included");
    if (maximum < minimum) return minimum;
    if (value < minimum) return minimum;
    if (value > maximum) return maximum;
    return value;
}
