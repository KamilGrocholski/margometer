/**
 * Where a reader left the one region that scrolls, kept by which list was standing in it.
 *
 * A redraw replaces the region whole, so the position is read off the element about to go and
 * written onto whichever list stands next under the same name. **ADR 0050.**
 */

import { assert } from "@std/assert/assert";
import type { PanelElement } from "@/src/ui/panel-element.ts";
import { CLASS } from "@/src/ui/panel-look.ts";

/** Headroom rather than a bound anything meets: a reader comes back to a handful of places. */
const MAXIMUM_LISTS_KEPT = 32;

export interface KeptScrolls {
    getTop(name: string): number;
    setTop(name: string, top: number): void;
}

/** In memory: a position that outlived a reload would open on a fight the page no longer holds. */
export function composeKeptScrollMemo(): KeptScrolls {
    const held = new Map<string, number>();
    return {
        getTop(name: string): number {
            assert(name.length > 0, "a position is looked up under the name of a list");
            const kept = held.get(name);
            if (kept === undefined) return 0;
            assert(kept >= 0, "a position kept is at or below the top of the region");
            return kept;
        },
        setTop(name: string, top: number): void {
            assert(name.length > 0, "a position is kept under the name of a list");
            assert(Number.isFinite(top), "and is a number a region answered with");
            assert(top >= 0, "and is at or below the top of that region");
            held.set(name, top);
            if (held.size > MAXIMUM_LISTS_KEPT) {
                const oldest = held.keys().next();
                if (!oldest.done) held.delete(oldest.value);
            }
            assert(held.size <= MAXIMUM_LISTS_KEPT, "no more is kept than the stated maximum");
        },
    };
}

function getRegionIsList(region: PanelElement): boolean {
    assert(CLASS.list.length > 0, "the one region that scrolls is named");
    return region.className.includes(CLASS.list);
}

/** Null where what stands in the region is a slot, which does not scroll and holds no position. */
export function getTopOfList(region: PanelElement): number | null {
    if (!getRegionIsList(region)) return null;
    const top = region.scrollTop;
    if (!Number.isFinite(top)) return null;
    assert(top >= 0, "a region answers with a position at or below its own top");
    return top;
}

/**
 * ⚠️ **A slot is left alone**, so a fold does not write a zero over the place a reader was at.
 * Measured on Chrome 152.0.7977.64, 2026-09-04: written straight after `replaceWith` the position
 * sticks, onto a replacement of the same height and onto a taller one.
 */
export function setTopOfList(region: PanelElement, top: number): void {
    assert(Number.isFinite(top), "a region is put at a position that is a number");
    assert(top >= 0, "and at one at or below its own top");
    if (!getRegionIsList(region)) return;
    region.scrollTop = top;
}
