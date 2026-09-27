/**
 * The options, as a browser lays them out: reached from the bar, covering the screen, and there
 * before any fight has come (ADR 0013).
 */

import { expect, test } from "./panel-fixture.ts";

/** Named as `STORE_KEY` in `src/game/browser-store.ts` names it. */
const STORAGE_KEY = "MargoMeter-storage";
const CONTROLS = ["[data-options]", "[data-shelf]", "[data-save]", "[data-fold]"];

test("every control the bar carries stands inside the bar", async ({ panel }) => {
    // The bar is one line whatever it holds, so a control pushed past its end is cut off rather
    // than wrapped — and the fold, the last of them, is the one a reader loses first.
    const bar = await panel.at(".MargoMeter-titlebar").boundingBox();
    expect(bar, "the bar is drawn").not.toBeNull();
    for (const selector of CONTROLS) {
        const box = await panel.at(selector).boundingBox();
        expect(box, `${selector} is drawn`).not.toBeNull();
        expect((box?.x ?? 0) + (box?.width ?? 0), `${selector} ends inside the bar`)
            .toBeLessThanOrEqual((bar?.x ?? 0) + (bar?.width ?? 0));
        expect(box?.y ?? 0, `${selector} stands on the bar's one line`).toBeGreaterThanOrEqual(
            bar?.y ?? 0,
        );
    }
});

test("the options cover the ranking, and a right press anywhere puts them away", async ({ panel }) => {
    await panel.at("[data-options]").click();
    await expect(panel.at(".crumb-here"), "the options say what they are").toHaveText("Opcje");
    await expect(panel.at(".list .row"), "with no row of the fight beside them").toHaveCount(0);
    await panel.at(".crumb-here").click({ button: "right" });
    await expect(panel.at(".crumb-here"), "the way back leaves them").toHaveCount(0);
    await expect(panel.at(".list .row"), "onto the ranking they covered").not.toHaveCount(0);
    await panel.expectHonest("the ranking after the options");
});

test.describe("before any fight", () => {
    test.use({ fedThrough: "none" });

    test("the options open, and a choice made there is kept", async ({ panel }) => {
        await panel.at("[data-options]").click();
        await expect(panel.at("[data-storage]"), "the three places a shelf can be kept")
            .toHaveCount(3);
        await panel.at('[data-storage="session"]').click();
        await expect(panel.at('[data-storage="session"].selected'), "the strip marks the answer")
            .toHaveCount(1);
        expect(await panel.stored(STORAGE_KEY), "and the browser keeps it").toBe(
            "session",
        );
    });
});
