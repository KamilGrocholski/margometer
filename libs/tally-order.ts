/**
 * How a tally is ordered for a reader: the largest count first, and ties by name.
 *
 * Two tools spelled this comparator identically under two names, so a tie broken one way in one
 * report and another way in the other would have read as the material disagreeing with itself.
 */

/** Biggest first, then alphabetically, so a report of the same material reads the same twice. */
export function getTallyOrder(
    one: readonly [string, number],
    other: readonly [string, number],
): number {
    if (one[1] !== other[1]) return other[1] - one[1];
    if (one[0] < other[0]) return -1;
    if (one[0] > other[0]) return 1;
    return 0;
}
