/**
 * The card the pointer leaves behind: what opens it, what keeps it open, what closes it, and what
 * it says that the row under the pointer does not.
 *
 * It is driven by the mouse the browser owns. A dispatched `pointermove` would reach the same
 * listener, but it would not settle where the card ends up standing, and half of these claims are
 * about that.
 */

import { expect, HOST_SELECTOR, type PanelHandle, test } from "./panel-fixture.ts";
import { readEdgesOf, readPointsAlongBar, setDragged } from "./panel-probe.ts";
import { waitForFrame } from "./panel-page.ts";

/** The card, and the mark it wears while nobody is being told anything. */
const CARD = ".MargoMeter-tip";
const CARD_OPEN = ".MargoMeter-tip:not(.tip-hidden)";
/** The one instruction a row gives, drawn on the card of a row that opens onto a level. */
const OPENS_NOTE = "LPM — rozwiń wiersz";
/** The two the crumb gives, and the second is named nowhere else on the panel (`develop ADR 0086`). */
const BACK_NOTE = "LPM tutaj — wróć o krok";
const BACK_ANYWHERE_NOTE = "PPM gdziekolwiek — wróć o krok";
/** Far enough left that the card cannot stand on that side of the panel any more. */
const TO_THE_LEFT = -420;
/** Far enough right that the widest card there is has room on that window's left (`develop ADR 0091`). */
const TO_THE_RIGHT = 420;
/** Under the 549 px the tallest card this corpus composes needs, measured 2026-09-06. */
const SHORT_WINDOW = 480;
/** What the card says where a run of it was given up. Read in words, as every sentence is. */
const CUT_NOTE = "Nie wszystko się mieści w tym oknie.";
/** `TIP.widthMaximum`, as the number a measurement is compared against. */
const BOUND = 250;
/** `SPACE.small`, which is the air the sheet keeps between a window and the card beside it. */
const GAP = 4;

/**
 * ⚠️ **A place too long for its own row is the case the card exists to answer** (`develop ADR 0084`),
 * and it is the one case no recording can carry: a map name reaches the panel off the game's own
 * page state, never off a payload. So the suite says where the fight is, and these two say it at
 * lengths the row cannot hold.
 *
 * Long enough to fold to **three** lines and not two. What a mutation to the count has to move is
 * a card standing 17 px above what it draws, measured over this corpus on 2026-09-06 — one line of
 * 15 px disappears into that slack and two do not.
 */
const LONG_PLACE = "E2E Nieprzebyta Puszcza Grzybiarzy Polnocna Zachodnia Dolina Wschodnia";
/** One word with nowhere to break, which is what `overflow-wrap:break-word` is bought for. */
const UNBROKEN_PLACE = "E2E" + "w".repeat(56);
/** What the stub's own hero stands on, which `composePlaceWords` puts after the name. */
const TILE = " (1, 1)";
/** `LINE_HEIGHT`, as the number a drawn name is measured in. */
const LINE = 15;

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

/**
 * ⚠️ **The one claim about the card that characters cannot make.**
 * `MAXIMUM_LABEL_CHARACTERS` counts a label's letters as a stand-in for the column's width, and
 * the glyph a caveated figure wears is a cell of its own — so the count cannot see what it costs
 * the label beside it. A cut label reads as a shorter label and nothing says it was cut.
 * **`develop ADR 0088`.**
 */
test("no label the card draws is cut by the column it is drawn in", async ({ panel }) => {
    const row = panel.at(".list .row").first();
    await row.hover();
    await expect(panel.at(CARD_OPEN), "a card is open to measure").toHaveCount(1);

    const labels = panel.at(`${CARD} .tip-label`);
    const counted = await labels.count();
    expect(counted, "and it draws labels to measure").toBeGreaterThan(0);
    const cut: string[] = [];
    for (let at = 0; at < counted; at += 1) {
        const one = labels.nth(at);
        const room = await one.evaluate((element) => ({
            said: element.textContent ?? "",
            drawn: element.scrollWidth,
            given: element.clientWidth,
        }));
        if (room.drawn > room.given) cut.push(`${room.said} ${room.drawn}>${room.given}`);
    }
    expect(cut, "every label stands whole, glyph and all").toEqual([]);

    const marks = await panel.at(`${CARD} .tip-caveat`).count();
    expect(marks, "and a figure naming more than it counts wears its mark").toBeGreaterThan(0);
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
    await waitForFrame(panel.page);
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

    // A leaf is reached two presses down, on the third level, which is the only one where
    // nothing opens any more (`develop:docs/drill-levels.md`). Every row on the second one opens.
    await panel.at(".row.drillable").first().click();
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
        if (seen.drawn > seen.shown + 1) {
            under.push(`row ${at}: holds ${seen.drawn} and shows ${seen.shown}`);
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
    await waitForFrame(page);
    return await page.evaluate(() => {
        const root = document.querySelector("#MargoMeter-Panel")?.shadowRoot ?? null;
        const tip = root?.querySelector(".MargoMeter-tip") ?? null;
        if (tip === null) return null;
        const style = getComputedStyle(tip);
        const group = tip.querySelector(".tip-group");
        const groupStyle = group === null ? null : getComputedStyle(group);
        const groupCost = groupStyle === null ? 0 : parseFloat(groupStyle.marginTop) +
            parseFloat(groupStyle.paddingTop) + parseFloat(groupStyle.borderTopWidth);
        return {
            // The panel's own answer, as the one property it writes the height on.
            counted: Math.round(parseFloat(style.getPropertyValue("--MargoMeter-tip-height"))),
            groupCost,
            drawn: tip.scrollHeight,
            // What the box is showing of it. Less than it holds is a card cut in silence.
            shown: tip.clientHeight,
            bottom: Math.round(tip.getBoundingClientRect().bottom),
            viewport: globalThis.innerHeight,
            said: tip.textContent ?? "",
        };
    });
}

/**
 * ⚠️ **A window too short for the card must not take the bottom off it in silence.** The box
 * carries `overflow:hidden` and takes no pointer, so an unmarked cut leaves no scrollbar and no
 * way to reach what has gone — a 533 px card in a 480 px window showing 464 of it, measured
 * unmarked on Chrome 152, 2026-09-06. What will not fit is given up at a run's own edge and the
 * card states it, so nothing goes missing without a mark.
 */
test("a window too short for the card is told about, not cut around", async ({ panel }) => {
    await panel.page.setViewportSize({ width: 1280, height: SHORT_WINDOW });
    await panel.at(".list .row").first().hover();

    const seen = await readCardHeight(panel.page);
    expect(seen, "the card opened").not.toBeNull();
    if (seen === null) return;
    expect(seen.drawn, "and the box shows the whole of what it drew").toBeLessThanOrEqual(
        seen.shown + 1,
    );
    expect(seen.bottom, "with its bottom edge on the screen").toBeLessThanOrEqual(seen.viewport);
    expect(seen.said, "and it says a part of it is not there").toContain(CUT_NOTE);
    await panel.expectHonest("a card in a window too short for it");
});

test("the card stands on whichever side of the panel it fits", async ({ panel }) => {
    const row = panel.at(".list .row").first();
    await row.hover();
    const before = await readEdgesOf(panel.page, CARD_OPEN);
    const standing = await panel.place();
    expect(before.right, "with room to its left, the card ends before the panel begins")
        .toBeLessThanOrEqual(standing.left);

    const bar = await readPointsAlongBar(panel.page, [20]);
    await setDragged(panel.page, { x: bar[0]?.x ?? 0, y: bar[0]?.y ?? 0 }, {
        x: TO_THE_LEFT,
        y: 0,
    });
    await panel.at(".list .row").first().hover();

    const after = await readEdgesOf(panel.page, CARD_OPEN);
    const moved = await panel.place();
    expect(after.left, "pushed against the left edge, it goes to the other side")
        .toBeGreaterThan(moved.left);
});

/**
 * The way out of a level, said where a level is open and nowhere else. Held in a browser because
 * both halves are about a node under a real pointer: that the mark reaches the card from the way
 * back, and that the name beside it is left alone.
 */
test("the way back says both gestures, and only where a level is open", async ({ panel }) => {
    await expect(panel.at(".crumb-back"), "the ranking draws no way back").toHaveCount(0);

    await panel.at("[data-row]").first().click();
    await panel.at(".crumb-back").hover();

    await expect(panel.at(CARD_OPEN), "the way back opens a card of its own").toHaveCount(1);
    const said = await panel.at(CARD).innerText();
    expect(said, "which names the press that lands on it").toContain(BACK_NOTE);
    expect(said, "and the one that works from anywhere").toContain(BACK_ANYWHERE_NOTE);
    expect(said, "and promises no opening, because nothing here opens").not.toContain(OPENS_NOTE);
    await panel.expectHonest("a card open over the way back");

    // ⚠️ Closed-ness is read off the mark, never off the words. A card that is not being rendered
    // returns its `textContent` from `innerText`, so a hidden card goes on reading exactly like
    // the one that was open a moment ago.
    await panel.at(".crumb-here").hover();
    await expect(panel.at(CARD_OPEN), "the name beside it carries no card of its own")
        .toHaveCount(0);
});

/**
 * ⚠️ **The one claim a unit test cannot make: how wide the card ends up.** The width is the
 * sheet's — `max-content` under a bound (`develop ADR 0091`) — so nothing in `src/` knows it and only a
 * browser laying the card out can answer. Before that decision every card was the bound: the
 * second window's card, a skill name over one instruction, stood at the whole of the bound for
 * sixteen characters.
 */
test("a card is as wide as what it says, up to the bound", async ({ panel }) => {
    const standingRow = panel.at(`${HOST_SELECTOR} .MargoMeter-standing .row[data-tip]`)
        .first();
    await expect(standingRow, "the fight leaves something standing to point at").toHaveCount(1);
    await standingRow.hover();
    await expect(panel.at(CARD_OPEN), "which opens a card of its own").toHaveCount(1);
    const little = await readEdgesOf(panel.page, CARD_OPEN);

    const wide = panel.at(".list .row").first();
    await wide.hover();
    await expect(panel.at(CARD_OPEN), "and a ranking row opens one too").toHaveCount(1);
    const much = await readEdgesOf(panel.page, CARD_OPEN);

    const said = much.right - much.left;
    const little_ = little.right - little.left;
    expect(said, "a card of four figures and both runs stands at the bound").toBe(BOUND);
    expect(little_, "and one of a name and a sentence stands at what it says").toBeLessThan(said);
    // A floor as well as a ceiling: a card narrower than this would be one the sheet had
    // collapsed rather than one it had fitted, and nothing else here would notice.
    expect(little_, "which is a width and not a collapse").toBeGreaterThan(40);
});

/**
 * The half the width change could have broken quietly: a card pinned by a **left** offset worked
 * out from the bound would float the difference away from the window the moment it drew narrower
 * (`develop ADR 0091`).
 *
 * ⚠️ **It has to be a narrow card standing to its window's left, and the second window has to be
 * dragged to get one.** Where the card is the bound wide, an offset from the left and one from
 * the right put it in the same place to the pixel — so the wide card passes either way, and the
 * narrow one flips to the right in the layout this suite opens on. Both halves of the mutation
 * were run: without the drag, breaking the anchoring lit nothing at all.
 */
test("a card keeps the edge facing its window, whatever width it draws at", async ({ panel }) => {
    expect(
        await readGapTo(panel, ".list .row", ".panel"),
        "the wide card stands a gap from the window whose row it names",
    ).toBe(GAP);

    const grip = await panel.at('[data-grip="standing"]').first().boundingBox();
    expect(grip, "the second window draws a bar to drag it by").not.toBeNull();
    const from = { x: Math.round(grip?.x ?? 0) + 20, y: Math.round(grip?.y ?? 0) + 6 };
    await setDragged(panel.page, from, { x: TO_THE_RIGHT, y: 0 });

    const standing = await readEdgesOf(panel.page, `${HOST_SELECTOR} .MargoMeter-standing`);
    expect(standing.left, "dragged right, it has room on its left for any card there is")
        .toBeGreaterThan(BOUND + GAP);

    // The drag took the pointer off the row, so the card is asked for again before it is read.
    const gap = await readGapTo(
        panel,
        ".MargoMeter-standing .row[data-tip]",
        ".MargoMeter-standing",
    );
    const narrow = await readEdgesOf(panel.page, CARD_OPEN);
    expect(narrow.right - narrow.left, "the card that window opens is narrower than the bound")
        .toBeLessThan(BOUND);
    expect(narrow.right, "and it stands to that window's left, which is the case that bites")
        .toBeLessThanOrEqual(standing.left);
    expect(gap, "so it stands the same gap, pinned by the edge that faces the window").toBe(GAP);
});

/**
 * The air between a window and the card one of its rows opened, on whichever side the card landed
 * — this holds the gap and never the side, which is `composeTipAcross`'s answer and held in
 * `tests/ui/panel-drag.test.ts`. The row is hovered again each time, because a drag in between
 * takes the pointer off it and the card with it.
 */
async function readGapTo(
    panel: PanelHandle,
    rowSelector: string,
    windowSelector: string,
): Promise<number> {
    await panel.at(rowSelector).first().hover();
    await expect(panel.at(CARD_OPEN), `${rowSelector} opens a card`).toHaveCount(1);
    const card = await readEdgesOf(panel.page, CARD_OPEN);
    const window = await readEdgesOf(panel.page, `${HOST_SELECTOR} ${windowSelector}`);
    if (card.right <= window.left) return window.left - card.right;
    return card.left - window.right;
}

test.describe("a place too long for its row", () => {
    test.use({ place: LONG_PLACE });

    test("is drawn whole on the card, over as many lines as it takes", async ({ panel }) => {
        await setShelfCardOpen(panel);
        const name = await readCardName(panel.page);
        expect(name, "the card names the fight").not.toBeNull();
        if (name === null) return;

        expect(name.said, "and it says the whole place, which the row could not")
            .toBe(`${LONG_PLACE}${TILE}`);
        expect(name.height, "over more than one line").toBeGreaterThan(LINE * 2);
        // The claim no unit test can make: a fake document folds nothing, so it reads a name that
        // is whole while the browser is drawing one that is cut.
        expect(name.scrollWidth, "with nothing running off its side")
            .toBeLessThanOrEqual(name.clientWidth + 1);
        expect(name.scrollHeight, "and nothing cut off its foot")
            .toBeLessThanOrEqual(name.clientHeight + 1);
        await panel.expectHonest("a card naming a place too long for its row");
    });

    test("is counted at the lines it draws, so the card stays on the screen", async ({ panel }) => {
        await setShelfCardOpen(panel);
        const seen = await readCardHeight(panel.page);
        expect(seen, "the card opened").not.toBeNull();
        if (seen === null) return;
        expect(seen.counted, "a card counted under what it draws is one the clamp may put off it")
            .toBeGreaterThanOrEqual(seen.drawn);
        expect(seen.drawn, "and the box shows the whole of what it drew")
            .toBeLessThanOrEqual(seen.shown + 1);
        expect(seen.bottom, "with its bottom edge on the screen")
            .toBeLessThanOrEqual(seen.viewport);
    });
});

/** The shelf, and the card its live row opens — the row that carries the place. */
async function setShelfCardOpen(panel: PanelHandle): Promise<void> {
    await panel.at("[data-shelf]").click();
    await expect(panel.at(".list .row[data-fight]"), "the shelf draws the fight going on")
        .not.toHaveCount(0);
    await panel.at(".list .row[data-fight]").first().hover();
    await expect(panel.at(CARD_OPEN), "which opens a card of its own").toHaveCount(1);
}

/** The name on the open card, as the browser laid it out. */
async function readCardName(page: import("@playwright/test").Page) {
    await waitForFrame(page);
    return await page.evaluate(() => {
        const root = document.querySelector("#MargoMeter-Panel")?.shadowRoot ?? null;
        const name = root?.querySelector(".MargoMeter-tip:not(.tip-hidden) .tip-name") ?? null;
        if (name === null) return null;
        return {
            said: name.textContent ?? "",
            height: Math.round(name.getBoundingClientRect().height),
            // What the box holds against what it shows, both ways: a name cut sideways and a name
            // cut off the bottom read differently, and neither may happen.
            scrollWidth: name.scrollWidth,
            clientWidth: name.clientWidth,
            scrollHeight: name.scrollHeight,
            clientHeight: name.clientHeight,
        };
    });
}

test.describe("a place with nowhere to break", () => {
    test.use({ place: UNBROKEN_PLACE });

    test("breaks inside the word rather than running off the card", async ({ panel }) => {
        await setShelfCardOpen(panel);
        const name = await readCardName(panel.page);
        expect(name, "the card names the fight").not.toBeNull();
        if (name === null) return;

        expect(name.said, "the whole of it is there").toBe(`${UNBROKEN_PLACE}${TILE}`);
        expect(name.height, "on more than one line, because it was broken").toBeGreaterThan(LINE);
        expect(name.scrollWidth, "and none of it is off the side of the card")
            .toBeLessThanOrEqual(name.clientWidth + 1);
        await panel.expectHonest("a card naming a place with no space in it");
    });
});
