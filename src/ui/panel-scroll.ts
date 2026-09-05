/**
 * Where a reader left the one region that scrolls, kept by which list was standing in it.
 *
 * A redraw replaces the region whole, so the position is read off the element about to go and
 * written onto whichever list stands next under the same name. **ADR 0050.**
 */

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
            const kept = held.get(name);
            if (kept === undefined) return 0;
            if (!Number.isFinite(kept)) return 0;
            if (kept < 0) return 0;
            return kept;
        },
        // A name nobody can look up again, or a position no region could be put at, is refused
        // rather than kept: what a bad one costs is the place a reader was at (**E14**).
        setTop(name: string, top: number): void {
            if (name.length === 0) return;
            if (!Number.isFinite(top)) return;
            if (top < 0) return;
            held.set(name, top);
            if (held.size <= MAXIMUM_LISTS_KEPT) return;
            const oldest = held.keys().next();
            if (!oldest.done) held.delete(oldest.value);
        },
    };
}

function getRegionIsList(region: PanelElement): boolean {
    return region.className.includes(CLASS.list);
}

/** Null where what stands in the region is a slot, which does not scroll and holds no position. */
export function getTopOfList(region: PanelElement): number | null {
    if (!getRegionIsList(region)) return null;
    const top = region.scrollTop;
    if (!Number.isFinite(top)) return null;
    if (top < 0) return null;
    return top;
}

/**
 * ⚠️ **A wheel turn belongs to the element it is turning**, so the rows are swapped under the
 * reader rather than the region replaced. False where either side is not a list. **ADR 0052.**
 */
export function setListRowsDrawn(standing: PanelElement, next: PanelElement): boolean {
    if (!getRegionIsList(standing)) return false;
    if (!getRegionIsList(next)) return false;
    standing.className = next.className;
    standing.replaceChildren(...Array.from(next.children));
    return true;
}

/**
 * ⚠️ **A slot is left alone**, so a fold does not write a zero over the place a reader was at.
 * Measured on Chrome 152.0.7977.64, 2026-09-04: written straight after `replaceWith` the position
 * sticks, onto a replacement of the same height and onto a taller one.
 */
export function setTopOfList(region: PanelElement, top: number): void {
    if (!Number.isFinite(top)) return;
    if (top < 0) return;
    if (!getRegionIsList(region)) return;
    region.scrollTop = top;
}
