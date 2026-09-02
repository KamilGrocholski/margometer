/**
 * What a test reaches into the page for, and the gestures the browser's own pointer makes.
 *
 * A drag goes through the mouse the browser owns and never a dispatched event:
 * `setPointerCapture` throws for a pointerId no real pointer owns, the guarded handler swallows
 * the gesture, and a synthetic drag then reports a panel that cannot be moved as one nobody
 * moved. **ADR 0047.**
 */

import { expect, type Page } from "@playwright/test";
import { HOST_SELECTOR } from "@/tests/e2e/panel-fixture.ts";

export interface PagePoint {
    x: number;
    y: number;
}

export interface BarPoint extends PagePoint {
    along: number;
    isGrip: boolean;
    onto: string;
}

/** Read inside the shadow root, which is the only place `elementFromPoint` can see a row. */
export async function readUnderPoint(page: Page, at: PagePoint): Promise<string> {
    return await page.evaluate(({ selector, x, y }) => {
        const root = document.querySelector(selector)?.shadowRoot ?? null;
        const under = root === null ? null : root.elementFromPoint(x, y);
        if (under === null) return "nothing";
        return under.getAttribute("data-grip") === null ? `covered:${under.className}` : "grip";
    }, { selector: HOST_SELECTOR, x: at.x, y: at.y });
}

/**
 * ⚠️ **Never the middle of the bar.** A drag starts only where the press lands on the grip itself
 * and not on a child of it (`composePanelDragGrab`, `src/ui/panel-drag.ts`), and the middle is the
 * version label. So each point is measured rather than assumed: one that silently stopped being
 * the grip would report a panel that cannot be dragged as one nobody dragged.
 */
export async function readPointsAlongBar(
    page: Page,
    offsets: readonly number[],
): Promise<BarPoint[]> {
    const box = await page.locator("[data-grip]").boundingBox();
    expect(box, "the panel draws a bar to measure along").not.toBeNull();
    const bar = box ?? { x: 0, y: 0, width: 0, height: 0 };
    const points: BarPoint[] = [];
    for (const along of offsets) {
        const at = { x: Math.round(bar.x + along), y: Math.round(bar.y + bar.height / 2) };
        const onto = await readUnderPoint(page, at);
        points.push({ ...at, along, isGrip: onto === "grip", onto });
    }
    expect(points.length, "every offset was looked at").toBe(offsets.length);
    return points;
}

export async function readCentreOf(page: Page, selector: string, at = 0): Promise<PagePoint> {
    const box = await page.locator(selector).nth(at).boundingBox();
    expect(box, `${selector} #${at} is somewhere on the page`).not.toBeNull();
    const found = box ?? { x: 0, y: 0, width: 0, height: 0 };
    return {
        x: Math.round(found.x + found.width / 2),
        y: Math.round(found.y + found.height / 2),
    };
}

export async function setDragged(page: Page, from: PagePoint, by: PagePoint): Promise<void> {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    // In steps, so the panel sees the moves a hand would make rather than one jump.
    await page.mouse.move(from.x + by.x, from.y + by.y, { steps: 4 });
    await page.mouse.up();
}

export async function readHostStyle(page: Page): Promise<string> {
    return await page.evaluate((selector) => {
        return document.querySelector(selector)?.getAttribute("style") ?? "";
    }, HOST_SELECTOR);
}

/**
 * Everything the panel draws, as one string, for the way back: a level that opened and closed has
 * to land on the markup it left, character for character, where two counts would miss a crumb
 * left standing. The hover card is left out — a real press moves the pointer onto the row first,
 * so a shape carrying the card would differ for no reason but where the mouse came from.
 */
export async function readPanelShape(page: Page): Promise<string> {
    const shape = await page.evaluate((selector) => {
        const root = document.querySelector(selector)?.shadowRoot ?? null;
        const regions = root === null ? [] : [...root.children];
        return regions.filter((region) => !region.className.startsWith("MargoMeter-tip"))
            .map((region) => region.outerHTML).join("");
    }, HOST_SELECTOR);
    expect(shape.length, "the panel is drawing something to compare").toBeGreaterThan(0);
    return shape;
}
