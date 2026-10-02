/**
 * Both windows sized by their corner, as a browser lays them out: the corner moves by the hand, the
 * size is written once and comes back, and the corner covers no figure (ADR 0013).
 */

import { expect, test } from "./panel-fixture.ts";
import { readCentreOf, setDragged } from "./panel-probe.ts";

/** The keys a size is written under, named as `STORE_KEY` in `src/ports/browser-store.ts` names them. */
const SIZE_KEY = "MargoMeter-size";
const HELPER_SIZE_KEY = "MargoMeter-pomocnik-size";
/** Far enough that no rounding could account for it, and inside the window either way. */
const WIDER = 60;
const TALLER = 50;
const PANEL_GRIP = '[data-size-grip="meter"]';
const HELPER_GRIP = '[data-size-grip="helper"]';

test("the panel's corner moves with the hand, and the size is written once, on release", async ({ panel }) => {
    const before = await panel.place();
    const from = await readCentreOf(panel.page, PANEL_GRIP);
    await panel.page.mouse.move(from.x, from.y);
    await panel.page.mouse.down();
    await panel.page.mouse.move(from.x + WIDER, from.y + TALLER, { steps: 4 });
    expect(await panel.stored(SIZE_KEY), "nothing is written while the hand is on it").toBeNull();
    await panel.page.mouse.up();
    const after = await panel.place();
    expect(after.width - before.width, "the panel is as much wider as the hand went").toBe(WIDER);
    expect(after.left, "and it grew from where it stood").toBe(before.left);
    expect(await panel.stored(SIZE_KEY), "let go, the size is written").not.toBeNull();
    const list = await panel.at(".list").boundingBox();
    const body = await panel.at(".meter").boundingBox();
    expect(list?.height ?? 0, "the list takes the room the panel was given").toBeGreaterThan(0);
    // Pressed at the corner's middle, six in from its edge, which is the panel's.
    expect((body?.y ?? 0) + (body?.height ?? 0), "the panel's foot is where the corner was let go")
        .toBe(from.y + TALLER + 6);
    await panel.expectHonest("a panel sized by its corner");
});

test("a size comes back after a reload, and the options give it back", async ({ panel }) => {
    const before = await panel.place();
    await setDragged(panel.page, await readCentreOf(panel.page, PANEL_GRIP), {
        x: WIDER,
        y: TALLER,
    });
    const sized = await panel.place();
    await panel.page.reload();
    expect((await panel.place()).width, "it comes back as wide as it was left").toBe(sized.width);
    await panel.at("[data-options]").click();
    await panel.at('[data-reset-size="meter"]').click();
    expect(await panel.stored(SIZE_KEY), "given back, nothing is kept").toBeNull();
    await panel.at("[data-options]").click();
    expect((await panel.place()).width, "and it stands as wide as its type").toBe(before.width);
});

test("a window sized is offered back at once, with the options shut or open", async ({ panel }) => {
    await setDragged(panel.page, await readCentreOf(panel.page, PANEL_GRIP), {
        x: WIDER,
        y: TALLER,
    });
    await panel.at("[data-options]").click();
    await expect(panel.at('[data-reset-size="meter"]'), "sized before the options opened")
        .toHaveCount(1);
    await setDragged(panel.page, await readCentreOf(panel.page, HELPER_GRIP), {
        x: -40,
        y: TALLER,
    });
    await expect(panel.at('[data-reset-size="helper"]'), "and sized while they stood open")
        .toHaveCount(1);
});

test("the window beside the panel is sized by its own corner, under its own key", async ({ panel }) => {
    const before = await panel.at(".MargoMeter-helper").boundingBox();
    await setDragged(panel.page, await readCentreOf(panel.page, HELPER_GRIP), {
        x: -40,
        y: TALLER,
    });
    // Narrower than its type is not a size it takes: its bar holds its controls at that width.
    const after = await panel.at(".MargoMeter-helper").boundingBox();
    expect(after?.width, "it stays as wide as its type").toBe(before?.width);
    expect(after?.height ?? 0, "and grows down").toBeGreaterThan(before?.height ?? 0);
    expect(await panel.stored(HELPER_SIZE_KEY), "under its own key").not.toBeNull();
    expect(await panel.stored(SIZE_KEY), "and not the panel's").toBeNull();
});

test("a folded window is its bar alone, and its corner goes with its body", async ({ panel }) => {
    await setDragged(panel.page, await readCentreOf(panel.page, PANEL_GRIP), {
        x: WIDER,
        y: TALLER,
    });
    await panel.at("[data-fold]").click();
    await expect(panel.at(PANEL_GRIP), "the corner is folded away").toBeHidden();
    const folded = await panel.place();
    const bar = await panel.at(".MargoMeter-titlebar").boundingBox();
    expect(folded.height, "the folded panel is its bar").toBe(bar?.height);
});

test("neither corner stands over a figure or a mark a reader reads", async ({ panel }) => {
    for (const grip of [PANEL_GRIP, HELPER_GRIP]) {
        const corner = await panel.at(grip).boundingBox();
        const read = await panel.page.evaluate(() => {
            const root = document.querySelector("#MargoMeter-Panel")?.shadowRoot;
            const cells = [...(root?.querySelectorAll(".figure, .row-value, .row-share") ?? [])];
            return cells.map((one) => {
                const box = one.getBoundingClientRect();
                return { x: box.x, y: box.y, right: box.right, bottom: box.bottom };
            });
        });
        for (const cell of read) {
            const apart = cell.right <= (corner?.x ?? 0) ||
                cell.bottom <= (corner?.y ?? 0) ||
                cell.x >= (corner?.x ?? 0) + (corner?.width ?? 0) ||
                cell.y >= (corner?.y ?? 0) + (corner?.height ?? 0);
            expect(apart, `${grip} stands clear of a figure at ${cell.x},${cell.y}`).toBe(true);
        }
    }
});

test("a panel made shorter than its regions grows to hold them, on its own ground", async ({ panel }) => {
    await setDragged(panel.page, await readCentreOf(panel.page, PANEL_GRIP), { x: 0, y: -400 });
    const drawn = await panel.page.evaluate(() => {
        const root = document.querySelector("#MargoMeter-Panel")?.shadowRoot;
        const ground = root?.querySelector(".meter");
        const summary = root?.querySelector(".MargoMeter-sides");
        const list = root?.querySelector(".list");
        return {
            overflow: (ground?.scrollHeight ?? 0) - (ground?.clientHeight ?? 0),
            foot: ground?.getBoundingClientRect().bottom ?? 0,
            summary: summary?.getBoundingClientRect().bottom ?? 0,
            rows: list?.querySelectorAll(".row").length ?? 0,
            shown: list?.clientHeight ?? 0,
        };
    });
    expect(drawn.overflow, "nothing stands past the panel's own box").toBeLessThanOrEqual(1);
    expect(drawn.summary, "the summary stands on the panel's ground").toBeLessThanOrEqual(
        drawn.foot,
    );
    expect(drawn.shown, "and the list keeps rows to read").toBeGreaterThan(40);
});

test("a smaller window keeps a sized panel on the screen", async ({ panel }) => {
    await setDragged(panel.page, await readCentreOf(panel.page, PANEL_GRIP), { x: WIDER, y: 200 });
    await panel.page.setViewportSize({ width: 1280, height: 500 });
    const place = await panel.place();
    expect(place.top + place.height, "its foot stays above the window's").toBeLessThanOrEqual(500);
});
