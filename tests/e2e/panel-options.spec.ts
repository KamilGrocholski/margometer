/**
 * The options, as a browser lays them out: reached from the bar, covering the screen, and there
 * before any fight has come (ADR 0013).
 */

import { expect, test } from "./panel-fixture.ts";

/** Named as `STORE_KEY` in `src/game/browser-store.ts` names it. */
const STORAGE_KEY = "MargoMeter-storage";
const CONTROLS = ["[data-options]", "[data-shelf]", "[data-save]", "[data-fold]"];
/** Named as `SIZE_VARIABLES` in `src/ui/panel-look.ts` names the panel's width. */
const PANEL_WIDTH_VARIABLE = "--MargoMeter-meter-width";
/** Each step and the row it draws: `TYPE_TOKENS` in `src/ui/panel-look.ts`. */
const STEPS = [
    { step: "small", row: 18 },
    { step: "medium", row: 19 },
    { step: "large", row: 21 },
];
/** What in the options is one row of answer, and so must never fold (ADR 0015). */
const ANSWERS = [".options-step", ".options-answer", ".options-window"];

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

test("a bar too short for what it holds cuts the version, never a control", async ({ panel }) => {
    // Set past the clamp a corner drag meets, which never goes under the width of the type: this
    // stands in for a reader's font that asks more of the bar than the one it was measured in.
    await panel.host.evaluate((host, variable) => {
        (host as HTMLElement).style.setProperty(variable, "220px");
    }, PANEL_WIDTH_VARIABLE);
    const bar = await panel.at(".MargoMeter-titlebar").boundingBox();
    expect(bar?.width, "the bar is as narrow as it was made").toBe(220);
    for (const selector of CONTROLS) {
        const box = await panel.at(selector).boundingBox();
        expect((box?.x ?? 0) + (box?.width ?? 0), `${selector} ends inside the bar`)
            .toBeLessThanOrEqual((bar?.x ?? 0) + (bar?.width ?? 0));
    }
    const version = await panel.at(".titlebar-version").evaluate((one) => ({
        drawn: one.clientWidth,
        asked: one.scrollWidth,
    }));
    expect(version.drawn, "the version is what gave way").toBeLessThan(version.asked);
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

test("every answer in the options stands on one line inside the panel, at every step", async ({ panel }) => {
    // Where the shelf is kept has the longest words, and three abreast they do not fit the small
    // step's width: that is why they stand a row each, and what this holds.
    await panel.at("[data-options]").click();
    for (const { step, row } of STEPS) {
        await panel.at(`[data-type-step="${step}"]`).click();
        await expect(panel.at(`[data-type-step="${step}"].selected`), `${step} is taken`)
            .toHaveCount(1);
        const edge = await panel.at(".meter").evaluate((one) => one.getBoundingClientRect().right);
        for (const selector of ANSWERS) {
            const drawn = await panel.at(selector).evaluateAll((all) =>
                all.map((one) => ({
                    height: one.getBoundingClientRect().height,
                    right: one.getBoundingClientRect().right,
                    spill: one.scrollWidth - one.clientWidth,
                }))
            );
            expect(drawn.length, `${step}: ${selector} is drawn`).toBeGreaterThan(0);
            for (const one of drawn) {
                expect(one.height, `${step}: ${selector} is one row`).toBe(row);
                expect(one.spill, `${step}: ${selector} holds its words`).toBeLessThanOrEqual(0);
                expect(one.right, `${step}: ${selector} ends inside the panel`)
                    .toBeLessThanOrEqual(edge);
            }
        }
    }
    await panel.expectHonest("the options at every step");
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
