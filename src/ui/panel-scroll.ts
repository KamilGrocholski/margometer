/**
 * Where a reader left the one region that scrolls, kept by which list was standing in it. A
 * redraw that replaces the region reads the position off the element about to go and writes it
 * onto whichever list stands next under the same name. `develop ADR 0050`.
 */

import { type PanelElement, STYLE_ATTRIBUTE } from "@/src/ui/panel-document.ts";
import { CLASS } from "@/src/ui/panel-look.ts";

/** Headroom rather than a bound anything meets: a reader comes back to a handful of places. */
const LISTS_KEPT_MAXIMUM = 32;

export interface ScrollMemo {
    getTop(name: string): number;
    setTop(name: string, top: number): void;
}

/** In memory: a position that outlived a reload would open on a fight the page no longer holds. */
export function initScrollMemo(): ScrollMemo {
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
        // rather than kept: what a bad one costs is the place a reader was at (**E12**).
        setTop(name: string, top: number): void {
            if (name.length === 0) return;
            if (!Number.isFinite(top)) return;
            if (top < 0) return;
            held.set(name, top);
            if (held.size <= LISTS_KEPT_MAXIMUM) return;
            const oldest = held.keys().next();
            if (!oldest.done) held.delete(oldest.value);
        },
    };
}

function isRegionList(region: PanelElement): boolean {
    return region.className.includes(CLASS.list);
}

/** Null where what stands in the region is a slot, which does not scroll and holds no position. */
export function readTopOfList(region: PanelElement): number | null {
    if (!isRegionList(region)) return null;
    const top = region.scrollTop;
    if (!Number.isFinite(top)) return null;
    if (top < 0) return null;
    return top;
}

/**
 * ⚠️ **A wheel turn belongs to the element it is turning**, so the rows are swapped under the
 * reader rather than the region replaced — and the style with them, since a list's own height is
 * written there and one left behind froze (`tests/ui/panel-scroll.test.ts`). False where either
 * side is not a list. `develop ADR 0052`.
 */
export function renderListRows(standing: PanelElement, next: PanelElement): boolean {
    if (!isRegionList(standing)) return false;
    if (!isRegionList(next)) return false;
    standing.className = next.className;
    standing.setAttribute(STYLE_ATTRIBUTE, next.getAttribute(STYLE_ATTRIBUTE) ?? "");
    standing.replaceChildren(...Array.from(next.children));
    return true;
}

/**
 * ⚠️ **A slot is left alone**, so a fold does not write a zero over the place a reader was at.
 * Measured on Chrome 152.0.7977.64, 2026-09-04: written straight after `replaceWith` the position
 * sticks, onto a replacement of the same height and onto a taller one.
 */
export function writeTopOfList(region: PanelElement, top: number): void {
    if (!Number.isFinite(top)) return;
    if (top < 0) return;
    if (!isRegionList(region)) return;
    region.scrollTop = top;
}
