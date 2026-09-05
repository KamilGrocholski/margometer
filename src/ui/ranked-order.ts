/**
 * The tie-break is what makes a ranking stable, so two readings of one fight draw the same rows
 * in the same places. A figure that is not a number sorts last rather than stopping the draw
 * (**E14**): subtracting one answers `NaN`, and a sort handed `NaN` orders by nothing at all.
 * `DESIGN.md` owns what a ranking looks like; this is only its order.
 */

export function getRankedOrder(
    oneFigure: number,
    otherFigure: number,
    oneText: string,
    otherText: string,
): number {
    const isOneStated = Number.isFinite(oneFigure);
    const isOtherStated = Number.isFinite(otherFigure);
    if (isOneStated) {
        if (!isOtherStated) return -1;
        if (otherFigure !== oneFigure) return otherFigure - oneFigure;
    }
    if (!isOneStated) {
        if (isOtherStated) return 1;
    }
    if (oneText === otherText) return 0;
    return oneText < otherText ? -1 : 1;
}
