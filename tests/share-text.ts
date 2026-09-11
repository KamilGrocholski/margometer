/**
 * A share the panel drew, read back into whole points.
 *
 * The inverse of what `src/ui/panel-words.ts` composes, and the two guards over the share column
 * both needed it. The floor comes from that module rather than from a copy here: a guard holding
 * the panel to a string the panel stopped drawing is a guard measuring nothing.
 */

import { assert } from "@std/assert";
import { SHARE_FLOOR } from "@/src/ui/panel-words.ts";

export function getPointsFromShareText(text: string): number {
    assert(text.length > 0, `a row that was drawn states a share, and this one states "${text}"`);
    if (text === SHARE_FLOOR) return 0;
    assert(text.endsWith("%"), `a share is written in points of a hundred, not as "${text}"`);
    const points = Number(text.slice(0, -1).split(" ").join(""));
    assert(Number.isSafeInteger(points), `a share reading ${text} is not a whole number of points`);
    return points;
}
