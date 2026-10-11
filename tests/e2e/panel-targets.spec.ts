/**
 * Every target the panel offers a pointer, as a browser lays it out: 24 pixels across and down, and
 * the size grip alone under it, standing where a 24-pixel circle about its middle meets no other
 * target — WCAG 2.2's 2.5.8 — at every step of type, in every place a reader can stand (ADR 0053).
 */

import { expect, type PanelHandle, test } from "./panel-fixture.ts";
import { waitForFrame } from "./panel-page.ts";

interface TargetBox {
    name: string;
    mark: string;
    left: number;
    top: number;
    width: number;
    height: number;
}

interface TargetReading {
    targets: TargetBox[];
    unmarked: string[];
}

/**
 * What a press is read off: the marks `PANEL_MARK` in `src/ui/panel-intent.ts` names, and the two
 * `src/ui/panel-drag.ts` grabs a window by.
 */
const TARGET_MARKS = [
    "data-fold",
    "data-save",
    "data-shelf",
    "data-options",
    "data-screen",
    "data-side",
    "data-row",
    "data-back",
    "data-skill",
    "data-source",
    "data-kind",
    "data-plain",
    "data-fight",
    "data-pin",
    "data-unnamed",
    "data-storage",
    "data-type-step",
    "data-reset-size",
    "data-helper-fold",
    "data-grip",
    "data-size-grip",
];
/**
 * The one target kept under the least, and held to the spacing instead: a corner as large would
 * cover the figures at the panel's foot (ADR 0053).
 */
const SPACED_MARKS = ["data-size-grip"];
/** The cursors that tell a reader a press does something here. */
const PRESSED_CURSORS = ["pointer", "move", "nwse-resize"];
/** WCAG 2.2, Success Criterion 2.5.8, Target Size (Minimum), read 2026-10-11. */
const TARGET_PIXELS_MINIMUM = 24;
const STEPS = ["small", "medium", "large"];
/** A recording that ends its fight, so the shelf keeps one a pin can be put on. */
const ENDING = "captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json";
/** Named as `STORE_KEY` in `src/ports/browser-store.ts` names it. */
const SHELF_KEY = "MargoMeter-fights";

test.use({ recording: ENDING });

test("every target is 24 pixels square, and the corner spaced as wide, at every step and level", async ({ panel }) => {
    expect(await panel.stored(SHELF_KEY), "the fight was kept, so the shelf has a pin").not
        .toBeNull();
    await panel.page.reload();
    await expect(panel.host, "and the page came back on a fight of its own").toHaveCount(1);
    // A window sized by its corner, so the options draw the control that gives its size back.
    const corner = await panel.at('[data-size-grip="helper"]').boundingBox();
    expect(corner, "the window beside the panel has a corner").not.toBeNull();
    const cornerAcross = (corner?.x ?? 0) + (corner?.width ?? 0) / 2;
    const cornerDown = (corner?.y ?? 0) + (corner?.height ?? 0) / 2;
    await panel.page.mouse.move(cornerAcross, cornerDown);
    await panel.page.mouse.down();
    // Down alone: a window widened toward the panel stands over its rows, which a box cannot tell.
    await panel.page.mouse.move(cornerAcross, cornerDown + 30, { steps: 4 });
    await panel.page.mouse.up();
    for (const step of STEPS) {
        await panel.at("[data-options]").click();
        await panel.at(`[data-type-step="${step}"]`).click();
        await expect(panel.at("[data-reset-size]"), `${step}: the options offer a size back`).not
            .toHaveCount(0);
        await expectTargetsSized(panel, `${step}: the options`);
        await panel.at("[data-options]").click();
        await expectTargetsSized(panel, `${step}: the ranking`);
        await panel.at(".list .row[data-row]").first().click();
        await expectTargetsSized(panel, `${step}: a person opened`);
        await panel.at(".list .row[data-skill], .list .row[data-kind]").first().click();
        await expectTargetsSized(panel, `${step}: a part opened`);
        // A press of the other button steps back one level: the part, then the person.
        await panel.at("[data-back]").click({ button: "right" });
        await panel.at("[data-back]").click({ button: "right" });
        await expect(panel.at("[data-back]"), `${step}: back on the ranking`).toHaveCount(0);
        await panel.at("[data-shelf]").click();
        await expect(panel.at(".row-pin"), `${step}: the shelf draws a pin`).not.toHaveCount(0);
        await expectTargetsSized(panel, `${step}: the shelf`);
        await panel.at("[data-shelf]").click();
        await panel.at("[data-fold]").click();
        await panel.at("[data-helper-fold]").click();
        await expectTargetsSized(panel, `${step}: both windows folded`);
        await panel.at("[data-fold]").click();
        await panel.at("[data-helper-fold]").click();
    }
});

async function expectTargetsSized(panel: PanelHandle, where: string): Promise<void> {
    await waitForFrame(panel.page);
    const reading: TargetReading = await panel.host.evaluate((host, asked) => {
        const root = host.shadowRoot;
        const targets: TargetBox[] = [];
        const unmarked: string[] = [];
        if (root === null) return { targets, unmarked: ["the host carries no open root"] };
        const isMarked = (element: Element) =>
            asked.marks.some((mark) => element.hasAttribute(mark));
        for (const element of root.querySelectorAll("*")) {
            const box = element.getBoundingClientRect();
            if (box.width === 0) continue;
            // A press offered where nothing marked reads it is a target this spec cannot see.
            const cursor = getComputedStyle(element).cursor;
            if (asked.cursors.includes(cursor)) {
                let marked: Element | null = element;
                while (marked !== null && !isMarked(marked)) marked = marked.parentElement;
                if (marked === null) unmarked.push(`${element.className} offers ${cursor}`);
            }
            const mark = asked.marks.find((name) => element.hasAttribute(name));
            if (mark === undefined) continue;
            // A cell carrying its row's mark is that row, pressed, and not a target of its own.
            const stated = element.getAttribute(mark);
            if (element.parentElement?.getAttribute(mark) === stated) continue;
            // A target scrolled partly out of its list is a scroll position, not a size.
            let clipper = element.parentElement;
            let isClipped = false;
            while (clipper !== null) {
                if (getComputedStyle(clipper).overflowY !== "visible") {
                    const edge = clipper.getBoundingClientRect();
                    if (box.top < edge.top) isClipped = true;
                    if (box.bottom > edge.bottom) isClipped = true;
                }
                clipper = clipper.parentElement;
            }
            if (isClipped) continue;
            targets.push({
                name: `${element.className} [${mark}="${stated}"]`,
                mark,
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
            });
        }
        return { targets, unmarked };
    }, { marks: TARGET_MARKS, cursors: PRESSED_CURSORS });
    expect(reading.targets.length, `${where}: targets are read`).toBeGreaterThan(0);
    expect(reading.unmarked, `${where}: every press offered is a mark measured`).toEqual([]);
    expect.soft(findTargetsCrowded(reading.targets), `${where}: WCAG 2.5.8`).toEqual([]);
}

/**
 * Each target under the size: one not let off it, and one let off whose circle meets another
 * target or another such circle.
 */
function findTargetsCrowded(targets: readonly TargetBox[]): string[] {
    const radius = TARGET_PIXELS_MINIMUM / 2;
    const isUndersized = (target: TargetBox) =>
        target.width < TARGET_PIXELS_MINIMUM || target.height < TARGET_PIXELS_MINIMUM;
    const crowded: string[] = [];
    for (const target of targets) {
        if (!isUndersized(target)) continue;
        const middleAcross = target.left + target.width / 2;
        const middleDown = target.top + target.height / 2;
        const size = `${target.width}×${target.height}`;
        if (!SPACED_MARKS.includes(target.mark)) {
            crowded.push(`${target.name} ${size} is under the least`);
            continue;
        }
        for (const neighbour of targets) {
            if (neighbour === target) continue;
            const right = neighbour.left + neighbour.width;
            const bottom = neighbour.top + neighbour.height;
            const across = Math.max(neighbour.left - middleAcross, 0, middleAcross - right);
            const down = Math.max(neighbour.top - middleDown, 0, middleDown - bottom);
            if (Math.hypot(across, down) < radius) {
                crowded.push(`${target.name} ${size} reaches ${neighbour.name}`);
                continue;
            }
            if (!isUndersized(neighbour)) continue;
            const neighbourAcross = neighbour.left + neighbour.width / 2;
            const neighbourDown = neighbour.top + neighbour.height / 2;
            const apart = Math.hypot(neighbourAcross - middleAcross, neighbourDown - middleDown);
            if (apart < TARGET_PIXELS_MINIMUM) {
                crowded.push(`${target.name} ${size} crowds ${neighbour.name}`);
            }
        }
    }
    return crowded;
}
