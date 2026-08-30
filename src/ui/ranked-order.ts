/**
 * The tie-break is what makes a ranking stable, so two readings of one fight draw the same rows
 * in the same places. `DESIGN.md` owns what a ranking looks like; this is only its order.
 */

import { assert } from "@std/assert";

export function getRankedOrder(
    oneFigure: number,
    otherFigure: number,
    oneText: string,
    otherText: string,
): number {
    assert(Number.isFinite(oneFigure), "a rank is decided between two figures");
    assert(Number.isFinite(otherFigure), "and both of them are stated");
    if (otherFigure !== oneFigure) return otherFigure - oneFigure;
    if (oneText === otherText) return 0;
    return oneText < otherText ? -1 : 1;
}
