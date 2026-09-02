/**
 * The panel taken hold of and moved: where a drag starts, where it does not, how far the window
 * lets it go, and what the browser is told about where it landed.
 */

import { expect, test } from "@/tests/e2e/panel-fixture.ts";
import {
    readCentreOf,
    readHostStyle,
    readPointsAlongBar,
    setDragged,
} from "@/tests/e2e/panel-probe.ts";

/** In from the bar's left edge, past the grip mark and short of anything the bar draws. */
const ALONG_THE_BAR = [10, 20, 40, 60, 80, 100, 130, 160, 190, 210, 230, 250];
/** Far enough that no rounding could account for it, and inside the window either way. */
const ACROSS = 120;
const DOWN = 60;
/** What `src/ui/panel-drag.ts` keeps on screen whatever a drag asks for. */
const VISIBLE_LEAST = 64;
const WINDOW_WIDTH = 1280;
const WINDOW_HEIGHT = 900;
/** The one key a drag writes, named as `src/userscript-entry.ts` names it. */
const PLACE_KEY = "MargoMeter-place";

test("a drag by the bar moves it, and the browser is told where it went", async ({ panel }) => {
    expect(await panel.stored(PLACE_KEY), "nobody has moved it yet").toBeNull();
    const before = await panel.place();
    const bar = await readPointsAlongBar(panel.page, [20]);
    expect(bar[0]?.isGrip, "the point taken hold of is the bar itself").toBe(true);

    await setDragged(panel.page, { x: bar[0]?.x ?? 0, y: bar[0]?.y ?? 0 }, { x: ACROSS, y: DOWN });

    const after = await panel.place();
    expect(after.left - before.left, "it went where it was taken").toBe(ACROSS);
    expect(after.top - before.top, "on both axes").toBe(DOWN);
    expect(await panel.stored(PLACE_KEY), "and where it landed was written down").not.toBeNull();
});

test("the place is written on release, and not once per move", async ({ panel }) => {
    const bar = await readPointsAlongBar(panel.page, [20]);
    const from = { x: bar[0]?.x ?? 0, y: bar[0]?.y ?? 0 };
    await panel.page.mouse.move(from.x, from.y);
    await panel.page.mouse.down();
    await panel.page.mouse.move(from.x + ACROSS, from.y + DOWN, { steps: 6 });
    const moved = await panel.place();
    expect(moved.left, "the panel has already followed the pointer").toBeGreaterThan(0);
    expect(await panel.stored(PLACE_KEY), "and nothing is written while it is held").toBeNull();

    await panel.page.mouse.up();
    expect(await panel.stored(PLACE_KEY), "the release is what writes it").not.toBeNull();
});

test("a drag writes a left, a top, and the corner given up", async ({ panel }) => {
    const bar = await readPointsAlongBar(panel.page, [20]);
    await setDragged(panel.page, { x: bar[0]?.x ?? 0, y: bar[0]?.y ?? 0 }, { x: ACROSS, y: DOWN });
    const style = await readHostStyle(panel.page);
    for (const declaration of ["left:", "top:", "--MargoMeter-panel-top:", "right:auto"]) {
        expect(style, `the host states ${declaration}`).toContain(declaration);
    }
});

test("the bar is grabbable along its bare length, and its labels are not", async ({ panel }) => {
    const points = await readPointsAlongBar(panel.page, ALONG_THE_BAR);
    expect(points.some((point) => point.isGrip), "some of the bar is bare grip").toBe(true);
    expect(points.some((point) => !point.isGrip), "and some of it is covered").toBe(true);

    for (const point of points) {
        // Measured again for every point, never once for all of them: a drag that works moves the
        // bar out from under the coordinates the next one was going to use, and the second point
        // would then press the page instead of the panel.
        const again = await readPointsAlongBar(panel.page, [point.along]);
        const at = again[0];
        expect(at, "the bar is still there to take hold of").toBeDefined();
        const before = await panel.place();
        await setDragged(panel.page, { x: at?.x ?? 0, y: at?.y ?? 0 }, { x: 40, y: 0 });
        const after = await panel.place();
        const moved = after.left - before.left;
        expect(moved, `at ${point.along}px the bar is ${at?.onto}`).toBe(at?.isGrip ? 40 : 0);
    }
});

test("nothing the bar draws starts a drag, and neither does a row", async ({ panel }) => {
    // The ranking first: pressing a control does what that control does — the fold below takes
    // the list down — and what is being held here is only that none of them moves the panel.
    const before = await panel.place();
    await setDragged(panel.page, await readCentreOf(panel.page, ".list .row"), { x: 40, y: 20 });
    const afterRow = await panel.place();
    expect(afterRow.left - before.left, "a row in the ranking is not a handle").toBe(0);
    expect(afterRow.top - before.top, "on either axis").toBe(0);

    for (const selector of [".titlebar-version", "[data-shelf]", "[data-save]", "[data-fold]"]) {
        const standing = await panel.place();
        await setDragged(panel.page, await readCentreOf(panel.page, selector), { x: 40, y: 20 });
        const after = await panel.place();
        expect(after.left - standing.left, `${selector} is not a handle`).toBe(0);
        expect(after.top - standing.top, `${selector} moves it on neither axis`).toBe(0);
    }
});

test("dragged at any edge, the panel keeps its footing on the screen", async ({ panel }) => {
    const corners = [
        { name: "off the left", by: { x: -WINDOW_WIDTH, y: 0 } },
        { name: "off the top", by: { x: 0, y: -WINDOW_HEIGHT } },
        { name: "off the right", by: { x: WINDOW_WIDTH, y: 0 } },
        { name: "off the bottom", by: { x: 0, y: WINDOW_HEIGHT } },
    ];
    for (const corner of corners) {
        const bar = await readPointsAlongBar(panel.page, [20]);
        await setDragged(panel.page, { x: bar[0]?.x ?? 0, y: bar[0]?.y ?? 0 }, corner.by);
        const at = await panel.place();
        expect(at.left + at.width, `${corner.name}: something is left on the right`)
            .toBeGreaterThanOrEqual(VISIBLE_LEAST);
        expect(at.left, `${corner.name}: and it did not leave to the right`)
            .toBeLessThanOrEqual(WINDOW_WIDTH - VISIBLE_LEAST);
        expect(at.top, `${corner.name}: the bar is reachable from the top`)
            .toBeGreaterThanOrEqual(0);
        expect(at.top, `${corner.name}: and from the bottom`)
            .toBeLessThanOrEqual(WINDOW_HEIGHT - VISIBLE_LEAST);
    }
    await panel.expectHonest("a panel pushed at every edge");
});

test("a folded panel is still a panel that can be moved", async ({ panel }) => {
    await panel.at("[data-fold]").click();
    await expect(panel.at(".MargoMeter-body.folded"), "it is folded away").toHaveCount(1);
    const before = await panel.place();
    const bar = await readPointsAlongBar(panel.page, [20]);
    expect(bar[0]?.isGrip, "the bar it is dragged by is still there").toBe(true);
    await setDragged(panel.page, { x: bar[0]?.x ?? 0, y: bar[0]?.y ?? 0 }, { x: ACROSS, y: DOWN });
    const after = await panel.place();
    expect(after.left - before.left, "and folded it moves the same way").toBe(ACROSS);
    expect(after.top - before.top, "on both axes").toBe(DOWN);
});
