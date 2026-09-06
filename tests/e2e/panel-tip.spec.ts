/**
 * The card the pointer leaves behind: what opens it, what keeps it open, what closes it, and what
 * it says that the row under the pointer does not.
 *
 * It is driven by the mouse the browser owns. A dispatched `pointermove` would reach the same
 * listener, but it would not settle where the card ends up standing, and half of these claims are
 * about that.
 */

import { expect, HOST_SELECTOR, test } from "@/tests/e2e/panel-fixture.ts";
import { readCentreOf, readPointsAlongBar, setDragged } from "@/tests/e2e/panel-probe.ts";

/** The card, and the mark it wears while nobody is being told anything. */
const CARD = ".MargoMeter-tip";
const CARD_OPEN = ".MargoMeter-tip:not(.tip-hidden)";
/** The one instruction the panel gives, drawn on the card of a row that opens onto a level. */
const OPENS_NOTE = "LPM — rozbicie";
/** Far enough left that the card cannot stand on that side of the panel any more. */
const TO_THE_LEFT = -420;

test("the card opens under the pointer, and names the row it describes", async ({ panel }) => {
    await expect(panel.at(CARD), "the card is there before anybody is told anything").toHaveCount(
        1,
    );
    await expect(panel.at(CARD_OPEN), "and it is not open").toHaveCount(0);

    const row = panel.at(".list .row").first();
    const named = await row.locator(".row-name").innerText();
    await row.hover();

    await expect(panel.at(CARD_OPEN), "hovering a row opens it").toHaveCount(1);
    await expect(panel.at(`${CARD} .tip-name`), "and it names that row").toHaveText(named);
    await panel.expectHonest("a card open over the ranking");
});

test("crossing inside a row keeps the card, and leaving takes it away", async ({ panel }) => {
    const row = panel.at(".list .row").first();
    await row.locator(".row-name").hover();
    await expect(panel.at(CARD_OPEN), "the name opened it").toHaveCount(1);
    const named = await panel.at(`${CARD} .tip-name`).innerText();

    // A row is four elements, and `pointerout` bubbles: the crossing from its name to its figure
    // is a leaving of an element, and it must not be read as a leaving of the row.
    await row.locator(".row-value").hover();
    await expect(panel.at(CARD_OPEN), "and the figure beside it keeps it open").toHaveCount(1);
    await expect(panel.at(`${CARD} .tip-name`), "still describing the same row").toHaveText(named);

    // ⚠️ Dispatched, and this is the one place in the suite that dispatches. A real crossing is a
    // `pointerout` **and** a `pointermove`, and the move would reopen a card the out had wrongly
    // closed — so the two together cannot tell a listener that reads `relatedTarget` from one
    // that hides on anything. The leaving is delivered on its own for that reason.
    const stayed = await panel.page.evaluate((selector) => {
        const root = document.querySelector(selector)?.shadowRoot ?? null;
        const name = root?.querySelector(".list .row .row-name") ?? null;
        const value = root?.querySelector(".list .row .row-value") ?? null;
        if (name === null || value === null) return null;
        name.dispatchEvent(
            new PointerEvent("pointerout", { bubbles: true, composed: true, relatedTarget: value }),
        );
        const card = root?.querySelector(".MargoMeter-tip") ?? null;
        return card === null ? null : card.className;
    }, HOST_SELECTOR);
    expect(stayed, "a leaving read on its own still leaves the card standing").toBe(
        "MargoMeter-tip",
    );

    await panel.at(".MargoMeter-titlebar").hover();
    await expect(panel.at(CARD_OPEN), "leaving the row closes it").toHaveCount(0);
});

test("a row that opens says so on its card; one that does not says nothing", async ({ panel }) => {
    await panel.at(".row.drillable").first().hover();
    await expect(panel.at(CARD_OPEN), "the card of a row with a level under it").toHaveCount(1);
    expect(await panel.at(CARD).innerText(), "carries the one instruction the panel gives")
        .toContain(OPENS_NOTE);

    // A leaf is reached under an opened row: the ranking is drillable all the way down.
    await panel.at(".row.drillable").first().click();
    await panel.at(".row.leaf").first().hover();
    await expect(panel.at(CARD_OPEN), "a row with nothing under it still has a card").toHaveCount(
        1,
    );
    expect(await panel.at(CARD).innerText(), "and it promises nothing").not.toContain(OPENS_NOTE);
});

test("the card is never in the way of the row it describes", async ({ panel }) => {
    const row = panel.at(".list .row").first();
    await row.hover();
    await expect(panel.at(CARD_OPEN), "the card stands over the panel").toHaveCount(1);

    // `pointer-events: none` on the card, so the press underneath still reaches the row.
    await row.click();

    await expect(panel.at(".crumb-here"), "and the row opened").toHaveCount(1);
    await panel.expectHonest("a row pressed through its own card");
});

test("a redraw that drops the row takes its card with it", async ({ panel }) => {
    await panel.at(".list .row").first().hover();
    await expect(panel.at(CARD_OPEN), "a card is open").toHaveCount(1);

    await panel.at("[data-shelf]").click();

    await expect(panel.at(CARD_OPEN), "the shelf drew rows the card knew nothing of").toHaveCount(
        0,
    );
});

/**
 * ⚠️ **The draw counts the card in lines and the sheet turns that count into a height** — and it
 * is that height, and nothing measured, that clamps the top edge so the card stays on the screen
 * (`composeTipTop` in `src/ui/panel-look.ts`). A count that came out **under** what the browser
 * draws would let the clamp place a card whose bottom is off the screen, with no scrollbar and
 * nothing said: the card carries `overflow:hidden` and takes no pointer.
 *
 * So the claim is an inequality and not an equality. Measured on Chrome 152, 2026-09-06, over
 * every row of `2026-08-06-tempest-grupa-vs-hildur`: the count stands 17 px above the drawing on
 * all eleven, and the tallest card comes to 533 px drawn against 550 px counted.
 */
test("a card is counted at or above what it draws, and stays on screen", async ({ panel }) => {
    const rows = await panel.at(".list .row").count();
    expect(rows, "there are rows whose cards can be opened").toBeGreaterThan(0);
    const under: string[] = [];
    const off: string[] = [];
    for (let at = 0; at < rows; at += 1) {
        await panel.at(".list .row").nth(at).hover();
        const seen = await readCardHeight(panel.page);
        expect(seen, `row ${at} opened a card`).not.toBeNull();
        if (seen === null) continue;
        // The count is read off the properties the draw wrote and the costs off the sheet's own
        // computed values, so neither half of the arithmetic is restated here.
        if (seen.counted < seen.drawn) {
            under.push(`row ${at}: counted ${seen.counted}, drew ${seen.drawn}`);
        }
        if (seen.bottom > seen.viewport) {
            off.push(`row ${at}: bottom at ${seen.bottom} of ${seen.viewport}`);
        }
    }
    expect(under, "a card counted under what it draws is one the clamp may put off the screen")
        .toEqual([]);
    expect(off, "and the clamp is what keeps every card's bottom edge on it").toEqual([]);
    await panel.expectHonest("every card of a ranking opened");
});

/** The card as the browser has it: what the draw counted, what it drew, and where it ends. */
async function readCardHeight(page: import("@playwright/test").Page) {
    return await page.evaluate(() => {
        const root = document.querySelector("#MargoMeter-Panel")?.shadowRoot ?? null;
        const tip = root?.querySelector(".MargoMeter-tip") ?? null;
        if (tip === null) return null;
        const style = getComputedStyle(tip);
        const group = tip.querySelector(".tip-group");
        const groupStyle = group === null ? null : getComputedStyle(group);
        const groupCost = groupStyle === null ? 0 : parseFloat(groupStyle.marginTop) +
            parseFloat(groupStyle.paddingTop) + parseFloat(groupStyle.borderTopWidth);
        const lines = Number(style.getPropertyValue("--MargoMeter-tip-lines"));
        const groups = Number(style.getPropertyValue("--MargoMeter-tip-groups"));
        const counted = lines * parseFloat(style.lineHeight) + groups * groupCost +
            2 * parseFloat(style.paddingTop) + 2 * parseFloat(style.borderTopWidth);
        return {
            counted: Math.round(counted),
            drawn: tip.scrollHeight,
            bottom: Math.round(tip.getBoundingClientRect().bottom),
            viewport: globalThis.innerHeight,
        };
    });
}

test("the card stands on whichever side of the panel it fits", async ({ panel }) => {
    const row = panel.at(".list .row").first();
    await row.hover();
    const before = await readCentreOf(panel.page, CARD_OPEN);
    const standing = await panel.place();
    expect(before.x, "with room to its left, the card stands there").toBeLessThan(standing.left);

    const bar = await readPointsAlongBar(panel.page, [20]);
    await setDragged(panel.page, { x: bar[0]?.x ?? 0, y: bar[0]?.y ?? 0 }, {
        x: TO_THE_LEFT,
        y: 0,
    });
    await panel.at(".list .row").first().hover();

    const after = await readCentreOf(panel.page, CARD_OPEN);
    const moved = await panel.place();
    expect(after.x, "pushed against the left edge, it goes to the other side")
        .toBeGreaterThan(moved.left);
});
