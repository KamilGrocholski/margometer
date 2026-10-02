/**
 * The three sizes of type as a browser lays them out: each one is the size a row counts, every
 * control stays on the bar, and the window beside the panel is drawn in the same type (ADR 0013).
 */

import { expect, test } from "./panel-fixture.ts";

/** Named as `STORE_KEY` in `src/ports/browser-store.ts` names it. */
const TYPE_KEY = "MargoMeter-type";
/** Each step, the type it prints and the row it draws: `TYPE_TOKENS` in `src/ui/panel-look.ts`. */
const STEPS = [
    { step: "small", font: "11px", row: 18 },
    { step: "medium", font: "12px", row: 19 },
    { step: "large", font: "13px", row: 21 },
];
const CONTROLS = ["[data-options]", "[data-shelf]", "[data-save]", "[data-fold]"];

test("every size of type draws its own row, keeps the bar whole, and reaches both windows", async ({ panel }) => {
    for (const { step, font, row } of STEPS) {
        await panel.at("[data-options]").click();
        await panel.at(`[data-type-step="${step}"]`).click();
        await panel.at("[data-options]").click();
        expect(await panel.stored(TYPE_KEY), `${step} is kept`).toBe(
            step,
        );
        const drawn = await panel.at(".list .row").first().boundingBox();
        expect(drawn?.height, `${step}: a row is the height the list counts`).toBe(row);
        const bar = await panel.at(".MargoMeter-titlebar").boundingBox();
        for (const selector of CONTROLS) {
            const box = await panel.at(selector).boundingBox();
            expect((box?.x ?? 0) + (box?.width ?? 0), `${step}: ${selector} ends inside the bar`)
                .toBeLessThanOrEqual((bar?.x ?? 0) + (bar?.width ?? 0));
        }
        const beside = await panel.at(".MargoMeter-helper").boundingBox();
        expect((beside?.x ?? 0) + (beside?.width ?? 0), `${step}: the window beside stays beside`)
            .toBeLessThanOrEqual(bar?.x ?? 0);
        const standing = await panel.at(".MargoMeter-helper").evaluate((one) =>
            getComputedStyle(one).fontSize
        );
        expect(standing, `${step}: the window beside the panel prints the same type`).toBe(font);
        await panel.expectHonest(`the ranking at the ${step} step`);
    }
});

test("a size of type chosen is the size the page comes back at", async ({ panel }) => {
    await panel.at("[data-options]").click();
    await panel.at('[data-type-step="large"]').click();
    expect(await panel.stored(TYPE_KEY), "the browser keeps the choice").toBe("large");
    await panel.page.reload();
    const font = await panel.at(".meter").evaluate((one) => getComputedStyle(one).fontSize);
    expect(font, "and the panel comes back in it").toBe("13px");
});
