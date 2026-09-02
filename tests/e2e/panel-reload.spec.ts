/**
 * What a reader finds waiting after they come back, and what they do not.
 *
 * Both halves are held. A test that only asserted what survives would pass just as well over a
 * panel that remembered everything, and remembering the open row would be a bug — a reload lands
 * a reader on a fight that has moved on.
 */

import { expect, test } from "@/tests/e2e/panel-fixture.ts";
import { readPointsAlongBar, setDragged } from "@/tests/e2e/panel-probe.ts";

const ACROSS = 120;
const DOWN = 60;
/** The keys a reader's own answers are written under, as `src/userscript-entry.ts` names them. */
const PLACE_KEY = "MargoMeter-place";
const FOLD_KEY = "MargoMeter-folded";
const STORAGE_KEY = "MargoMeter-storage";

test("the panel comes back where it was left, after a reload nobody staged", async ({ panel }) => {
    const bar = await readPointsAlongBar(panel.page, [20]);
    await setDragged(panel.page, { x: bar[0]?.x ?? 0, y: bar[0]?.y ?? 0 }, { x: ACROSS, y: DOWN });
    const moved = await panel.place();
    const written = await panel.stored(PLACE_KEY);
    expect(written, "where it landed was written down").not.toBeNull();

    await panel.page.reload();

    await expect(panel.host, "a second boot of the same file puts a panel up").toHaveCount(1);
    const back = await panel.place();
    expect(back.left, "standing where the reader left it").toBe(moved.left);
    expect(back.top, "on both axes").toBe(moved.top);
    expect(await panel.stored(PLACE_KEY), "off the store the first boot wrote to").toBe(written);
});

test("everything a reader chose is still chosen, all of it at once", async ({ panel }) => {
    const bar = await readPointsAlongBar(panel.page, [20]);
    await setDragged(panel.page, { x: bar[0]?.x ?? 0, y: bar[0]?.y ?? 0 }, { x: ACROSS, y: DOWN });
    await panel.at("[data-shelf]").click();
    await panel.at('[data-storage="session"]').click();
    await panel.at("[data-shelf]").click();
    await panel.at("[data-fold]").click();
    const place = await panel.stored(PLACE_KEY);

    await panel.page.reload();

    expect(await panel.stored(PLACE_KEY), "the place").toBe(place);
    expect(await panel.stored(FOLD_KEY), "the fold").not.toBeNull();
    expect(await panel.stored(STORAGE_KEY), "and where the shelf is kept").toBe("session");
    await expect(panel.at(".MargoMeter-body.folded"), "the panel comes back folded").toHaveCount(1);
    await panel.at("[data-fold]").click();
    await panel.at("[data-shelf]").click();
    await expect(panel.at('[data-storage="session"].selected'), "on the shelf it was asked for")
        .toHaveCount(1);
});

test("what the reader was reading is not remembered, and that is the point", async ({ panel }) => {
    const screens = panel.at("[data-screen]");
    const opening = await screens.first().getAttribute("data-screen");
    await screens.nth(3).click();
    const other = await panel.at("[data-screen]").nth(3).getAttribute("data-screen");
    expect(other, "the reader moved off the screen the panel opens on").not.toBe(opening);
    await panel.at("[data-side]").nth(2).click();
    await panel.at("[data-row]").first().click();
    await expect(panel.at(".crumb-here"), "with a row open under them").toHaveCount(1);

    await panel.page.reload();

    // A fight moves on while a reader is away, and a panel that came back three levels down would
    // be showing a level the fight no longer has.
    await expect(panel.at(".crumb-here"), "the open row is gone").toHaveCount(0);
    await expect(panel.at("[data-screen]").first(), "the panel opens where it always opens")
        .toHaveClass("tab selected");
    await expect(panel.at("[data-side]").first(), "and on the audience it always opens on")
        .toHaveClass("tab selected");
    await panel.expectHonest("a panel come back to");
});
