/**
 * The three sizes of type as a browser lays them out: each one is the size a row counts, every
 * control stays on the bar at one size, and the window beside the panel is drawn in the same type
 * (ADR 0013, ADR 0036).
 */

import { expect, test } from "./panel-fixture.ts";

/** Named as `STORE_KEY` in `src/ports/browser-store.ts` names it. */
const TYPE_KEY = "MargoMeter-type-step";
/** Each step, the type it prints and the row it draws: `TYPE_TOKENS` in `src/ui/panel-look.ts`. */
const STEPS = [
    { step: "small", font: "11px", row: 18 },
    { step: "medium", font: "12px", row: 19 },
    { step: "large", font: "13px", row: 21 },
];
const CONTROLS = ["[data-options]", "[data-shelf]", "[data-save]", "[data-fold]"];
const SVG_MASK_OPENER = 'url("data:image/svg+xml,';

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
        const sizes = new Set<string>();
        for (const selector of CONTROLS) {
            const box = await panel.at(selector).boundingBox();
            expect((box?.x ?? 0) + (box?.width ?? 0), `${step}: ${selector} ends inside the bar`)
                .toBeLessThanOrEqual((bar?.x ?? 0) + (bar?.width ?? 0));
            sizes.add(`${box?.width}×${box?.height}`);
        }
        // Each mark is a different width, which padding turned into as many widths (ADR 0036).
        // The window beside folds by a control of the same class.
        const fold = await panel.at("[data-helper-fold]").boundingBox();
        sizes.add(`${fold?.width}×${fold?.height}`);
        expect([...sizes], `${step}: every control on both bars is one size`).toHaveLength(1);
        const beside = await panel.at(".MargoMeter-helper").boundingBox();
        expect((beside?.x ?? 0) + (beside?.width ?? 0), `${step}: the window beside stays beside`)
            .toBeLessThanOrEqual(bar?.x ?? 0);
        const standing = await panel.at(".MargoMeter-helper").evaluate((helper) =>
            getComputedStyle(helper).fontSize
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
    const font = await panel.at(".meter").evaluate((meter) => getComputedStyle(meter).fontSize);
    expect(font, "and the panel comes back in it").toBe("13px");
});

/**
 * ⚠️ **A glyph's ink stands where its face puts it**, and the save arrow's stood two pixels under
 * its box's middle at every device scale (ADR 0036). The icons are drawn instead, and a drawing is
 * centred only if its shapes are laid out about the middle of their square, which the browser's
 * own `getBBox` reads off the mask each control really wears.
 */
test("every bar icon is drawn about the middle of its square, folded and not", async ({ panel }) => {
    for (const isFolded of [false, true]) {
        const selectors = [...CONTROLS, "[data-helper-fold]"];
        for (const selector of selectors) {
            // ⚠️ Waited for and measured in one read: the fold redraws on the next frame, and a
            // mask read apart from the wait that found it may no longer be a drawing.
            let middle = { unread: "", across: Number.NaN, down: Number.NaN };
            await expect.poll(async () => {
                middle = await panel.at(selector).evaluate((control, opener) => {
                    const mask = getComputedStyle(control, "::before").maskImage;
                    const start = mask.indexOf(opener);
                    const end = mask.lastIndexOf('")');
                    const unread = {
                        unread: `mask-image: ${mask}`,
                        across: Number.NaN,
                        down: Number.NaN,
                    };
                    if (start < 0) return unread;
                    if (end < start) return unread;
                    const drawing = decodeURIComponent(mask.slice(start + opener.length, end));
                    const parsed = new DOMParser().parseFromString(drawing, "image/svg+xml");
                    const svg = document.importNode(parsed.documentElement, true);
                    if (!(svg instanceof SVGSVGElement)) return unread;
                    document.body.append(svg);
                    const box = svg.getBBox();
                    svg.remove();
                    const view = svg.viewBox.baseVal;
                    return {
                        unread: "",
                        across: box.x + box.width / 2 - view.width / 2,
                        down: box.y + box.height / 2 - view.height / 2,
                    };
                }, SVG_MASK_OPENER);
                return middle.unread;
            }, { message: `${selector}: wears a drawing that parses` }).toBe("");
            expect(Math.abs(middle.across), `${selector}: centred across`).toBeLessThan(0.01);
            expect(Math.abs(middle.down), `${selector}: and down`).toBeLessThan(0.01);
        }
        if (!isFolded) {
            await panel.at("[data-fold]").click();
            await panel.at("[data-helper-fold]").click();
        }
    }
});
