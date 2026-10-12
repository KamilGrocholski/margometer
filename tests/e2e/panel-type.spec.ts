/**
 * The three sizes of type as a browser lays them out: each one is the size a row counts, every
 * control stays on the bar at one size, the window beside the panel is drawn in the same type, and
 * every icon drawn stands in the middle of its square (ADR 0013, ADR 0036, ADR 0057).
 */

import type { Locator } from "@playwright/test";
import { expect, test } from "./panel-fixture.ts";

/** Named as `STORE_KEY` in `src/ports/browser-store.ts` names it. */
const TYPE_KEY = "MargoMeter-type-step";
/** Each step, the type it prints and the row it draws: `TYPE_TOKENS` in `src/ui/panel-look.ts`. */
const STEPS = [
    { step: "small", font: "12px", row: 25 },
    { step: "medium", font: "13px", row: 27 },
    { step: "large", font: "14px", row: 29 },
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
    expect(font, "and the panel comes back in it").toBe("14px");
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
            await expectDrawnAboutMiddle(panel.at(selector), selector);
        }
        if (!isFolded) {
            await panel.at("[data-fold]").click();
            await panel.at("[data-helper-fold]").click();
        }
    }
});

/**
 * The drawing a mark wears, measured about the middle of its square. ⚠️ Waited for and measured in
 * one read: a redraw lands on the next frame, and a mask read apart from the wait that found it may
 * no longer be a drawing.
 */
async function expectDrawnAboutMiddle(mark: Locator, named: string): Promise<void> {
    let middle = { unread: "", across: Number.NaN, down: Number.NaN };
    await expect.poll(async () => {
        middle = await mark.evaluate((drawn, opener) => {
            const mask = getComputedStyle(drawn, "::before").maskImage;
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
    }, { message: `${named}: wears a drawing that parses` }).toBe("");
    expect(Math.abs(middle.across), `${named}: centred across`).toBeLessThan(0.01);
    expect(Math.abs(middle.down), `${named}: and down`).toBeLessThan(0.01);
}

/**
 * The pin's star is drawn for the reason the bar's icons are, and larger than the row's type,
 * because the glyph it replaced inked 10px of a 27px box (ADR 0057).
 */
test("the pin's star is drawn about its middle and larger than its row's type, either way pressed", async ({ panel }) => {
    for (const { step, font } of STEPS) {
        await panel.at("[data-options]").click();
        await panel.at(`[data-type-step="${step}"]`).click();
        await panel.at("[data-options]").click();
        await panel.at("[data-shelf]").click();
        const states = [
            { state: "outlined", glyph: "☆", isPressed: false },
            { state: "filled", glyph: "★", isPressed: true },
            { state: "outlined again", glyph: "☆", isPressed: true },
        ];
        for (const { state, glyph, isPressed } of states) {
            const pin = panel.at(".row-pin[data-pin]").first();
            if (isPressed) await pin.click();
            // ⚠️ A press redraws the shelf on the next frame, and a pin read before it lands has
            // no star to measure: the glyph says which pin stands, and the size is waited for.
            await expect(pin, `${step}: the ${state} star stands`).toHaveText(glyph);
            await expectDrawnAboutMiddle(pin, `${step}: the ${state} star`);
            const readStarRoom = () =>
                pin.evaluate((mark) => {
                    const star = Number.parseFloat(getComputedStyle(mark, "::before").width);
                    return { star, spare: mark.getBoundingClientRect().height - star };
                });
            await expect.poll(async () => (await readStarRoom()).star, {
                message: `${step}: the ${state} star is larger than ${font} type`,
            }).toBeGreaterThan(Number.parseFloat(font));
            await expect.poll(async () => (await readStarRoom()).spare, {
                message: `${step}: and inside its box`,
            }).toBeGreaterThan(0);
        }
        await panel.at("[data-shelf]").click();
    }
});
