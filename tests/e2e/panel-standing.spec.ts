/**
 * The window beside the panel, in a real browser: two grips under one root, two folds, two
 * corners, and a row a real pointer opens.
 *
 * Every fault this file holds was invisible to the suite that runs without one — a window opening
 * exactly under the panel passed every unit test there is, and was found in a screenshot.
 */

import { expect, test } from "@/tests/e2e/panel-fixture.ts";
import {
    type PanelEdges,
    readEdgesOf,
    readPointsAlongBar,
    setDragged,
} from "@/tests/e2e/panel-probe.ts";
import type { Page } from "@playwright/test";

/**
 * Every sentence of the window standing wider than the box it is drawn in.
 *
 * A **row** is exempt and by name: it cuts its words on purpose, because the figure beside them
 * may not fold (`DESIGN.md`). Everything else in this window is a sentence, and a sentence a
 * reader cannot finish is one this window has no gesture to reach the rest of.
 */
async function readCutSentences(page: Page): Promise<string[]> {
    const found = await page.evaluate(() => {
        const root = document.querySelector("#MargoMeter-Panel")?.shadowRoot ?? null;
        const window = root?.querySelector(".MargoMeter-standing") ?? null;
        if (window === null) return null;
        const said: string[] = [];
        for (const element of window.querySelectorAll("*")) {
            if (element.closest(".row") !== null) continue;
            if (element.scrollWidth <= element.clientWidth + 1) continue;
            if ((element.textContent ?? "").trim() === "") continue;
            said.push(`${element.className}: ${element.textContent}`);
        }
        return said;
    });
    expect(found, "the window was found and measured").not.toBeNull();
    return found ?? [];
}

/** The keys the two windows are kept under, named as `src/userscript-entry.ts` names them. */
const PLACE_KEY = "MargoMeter-place";
const STANDING_PLACE_KEY = "MargoMeter-pomocnik-place";
const STANDING_FOLD_KEY = "MargoMeter-pomocnik-folded";
/** The air the sheet keeps between a window and the card beside it, as `SPACE.small` states it. */
const GAP = 4;
const FOLD_MARK = "—";
const UNFOLD_MARK = "+";

test("the window stands beside the panel and never under it", async ({ panel }) => {
    await expect(panel.at(".MargoMeter-standing"), "a window of its own").toHaveCount(1);
    const both = await panel.page.evaluate(() => {
        const root = document.querySelector("#MargoMeter-Panel")?.shadowRoot ?? null;
        const read = (selector: string) =>
            root?.querySelector(selector)?.getBoundingClientRect() ?? null;
        const panelBox = read(".MargoMeter-titlebar");
        const standing = read(".MargoMeter-standing");
        if (panelBox === null || standing === null) return null;
        return {
            standingRight: Math.round(standing.right),
            panelLeft: Math.round(panelBox.left),
            sameTop: Math.round(standing.top) === Math.round(panelBox.top),
        };
    });
    expect(both, "both windows are on the page").not.toBeNull();
    expect(both?.standingRight, "the window ends before the panel begins")
        .toBeLessThanOrEqual(both?.panelLeft ?? 0);
    expect(both?.sameTop, "and opens level with it").toBe(true);
});

test("dragging the window by its bar leaves the panel where it was", async ({ panel }) => {
    const before = await panel.place();
    const bar = await panel.at(".standing-bar").boundingBox();
    expect(bar, "the window carries a bar to drag it by").not.toBeNull();

    await setDragged(panel.page, { x: (bar?.x ?? 0) + 30, y: (bar?.y ?? 0) + 6 }, {
        x: -60,
        y: 40,
    });

    const after = await panel.place();
    expect(after, "the panel did not move").toEqual(before);
    expect(await panel.stored(PLACE_KEY), "and its stored corner was not written").toBeNull();
    expect(await panel.stored(STANDING_PLACE_KEY), "the window's own was").not.toBeNull();
});

test("each window folds on its own, and both are remembered", async ({ panel }) => {
    await expect(panel.at("[data-standing-fold]"), "the window offers its own control")
        .toHaveText(FOLD_MARK);

    await panel.at("[data-standing-fold]").click();

    await expect(panel.at(".MargoMeter-standing.standing-folded"), "the window folds away")
        .toHaveCount(
            1,
        );
    await expect(panel.at("[data-standing-fold]"), "and its mark turns round")
        .toHaveText(UNFOLD_MARK);
    await expect(panel.at(".MargoMeter-body.folded"), "the panel stays open").toHaveCount(0);
    await expect(panel.at(".list .row"), "with its ranking drawn").not.toHaveCount(0);
    expect(await panel.stored(STANDING_FOLD_KEY), "the browser is told").not.toBeNull();

    await panel.page.reload();

    await expect(panel.at(".MargoMeter-standing.standing-folded"), "and it comes back folded")
        .toHaveCount(1);
    await expect(panel.at(".MargoMeter-body.folded"), "with the panel still open").toHaveCount(0);
});

test("a counted row opens onto its casters, and shuts again", async ({ panel }) => {
    const rows = panel.at(".MargoMeter-standing .row[data-standing]");
    await expect(rows, "the fight leaves something standing").not.toHaveCount(0);
    const shut = await panel.at(".MargoMeter-standing .row").count();

    await rows.first().click();

    const opened = await panel.at(".MargoMeter-standing .row").count();
    expect(opened, "the casters stand under the skill they cast").toBeGreaterThan(shut);
    await expect(panel.at(".MargoMeter-standing .row.standing-under"), "each on a row of its own")
        .not.toHaveCount(0);

    await rows.first().click();

    expect(await panel.at(".MargoMeter-standing .row").count(), "and a second press shuts it")
        .toBe(shut);
    await panel.expectHonest("a window whose row was opened and shut");
});

/**
 * Whom a shout holds is read off its value, so the section is exactly the characters the game
 * named and carries no line about a rest (**ADR 0064**). The fixture fight names one; the corpus
 * test in `tests/core/aura-standing.test.ts` is the one that reads a value naming two.
 */
test("a shout is drawn under whoever holds it, and no rest is claimed", async ({ panel }) => {
    // The section is the caster and the characters under them, so what is counted is the nested
    // rows rather than a sentence — the holder line is gone (**ADR 0067**).
    const under = panel.at(".MargoMeter-standing .row.standing-under");
    await expect(under, "the fight leaves somebody provoked").not.toHaveCount(0);
    await expect(
        panel.at(".MargoMeter-standing .standing-holder"),
        "and says it in rows, never in a sentence under a name",
    ).toHaveCount(0);
    // Every line under the section is a row: nothing claims a rest the game did not name.
    const lines = await panel.at(".MargoMeter-standing .standing-body > div").allTextContents();
    for (const said of lines) {
        expect(said, "no line stands for somebody the game never named").not.toContain("losowo");
    }

    // A whole-team cast says nothing about whom, so opening one adds no held character — only its
    // own casters, which are nested by the same rule and so counted apart from them.
    const held = await panel.at(".MargoMeter-standing .row-name").count();
    const rows = panel.at(".MargoMeter-standing .row[data-standing]");
    const many = await rows.count();
    for (let at = 0; at < many; at += 1) {
        await rows.nth(at).click();
        await expect(under, "the casters stand under their skill").not.toHaveCount(0);
        await rows.nth(at).click();
        await expect(
            panel.at(".MargoMeter-standing .row-name"),
            "and shutting it leaves the provocation exactly as it was",
        ).toHaveCount(held);
    }

    // The window grows by a line per caster; the body scrolls, and the frame stays on the page.
    const place = await panel.page.evaluate(() => {
        const root = document.querySelector("#MargoMeter-Panel")?.shadowRoot ?? null;
        const box = root?.querySelector(".MargoMeter-standing")?.getBoundingClientRect() ?? null;
        return box === null ? null : { bottom: Math.round(box.bottom), top: Math.round(box.top) };
    });
    expect(place?.top, "the window starts on the screen").toBeGreaterThanOrEqual(0);
    expect(place?.bottom, "and ends on it").toBeLessThanOrEqual(
        panel.page.viewportSize()?.height ?? 0,
    );
});

/**
 * The rule, not the instance. One line of this window was written as a row and cut with an
 * ellipsis, hiding the very name it was drawn to say — and this window has no gesture to reach the
 * rest with. So: **a sentence is never cut, and a row is the only thing allowed to.**
 *
 * A row cuts its words on purpose, because the figure beside them may not fold (`DESIGN.md`), and
 * that is why the exemption is by name rather than by silence.
 */
test("no sentence is cut, and a row is the only thing that may be", async ({ panel }) => {
    const rows = panel.at(".MargoMeter-standing .row[data-standing]");
    const many = await rows.count();
    expect(many, "the fight leaves something standing to open").toBeGreaterThan(0);

    // ⚠️ **Every row, not the first.** Written against `first()` this passed with the sentence
    // put back to an ellipsis: the row that came first carried the shortest line in the window and
    // was never going to be cut. A reader is proved by the sample it must flag.
    const cut: string[] = [];
    for (let at = 0; at < many; at += 1) {
        await rows.nth(at).click();
        cut.push(...await readCutSentences(panel.page));
        await rows.nth(at).click();
    }
    expect(cut, "a sentence a reader would have to go looking for").toEqual([]);
});

/**
 * The stacking order, proved by asking the browser what is actually on top rather than by reading
 * a number out of the sheet. The window may be dragged over the panel — that is what makes it a
 * window — and a card is the one thing a reader asked for by pointing. **ADR 0068.**
 */
test("a card stands over the window, even where the window covers it", async ({ panel }) => {
    // ⚠️ Written twice before it measured anything. First as a drag of the window onto the row,
    // which cannot work — the window takes the pointer, so no card opens. Then as
    // `elementFromPoint`, which measured nothing either: the card is `pointer-events:none`, so
    // hit-testing skips it and answers with whatever child of the window was underneath. What
    // proves paint order is the **stack** at a point, with the card made hit-testable for the
    // probe — the one property this changes, and never the layer under test.
    const row = panel.at("#MargoMeter-Panel .list .row").first();
    await row.hover();
    const card = panel.at(".MargoMeter-tip");
    // Walked rather than matched (**C7**), and the class list rather than the whole attribute:
    // `toHaveClass` with text compares the list entire, so it would pass on a hidden card too.
    const classes = (await card.getAttribute("class") ?? "").split(" ");
    expect(classes, "the card opened").not.toContain("tip-hidden");
    const stack = await panel.page.evaluate(() => {
        const root = document.getElementById("MargoMeter-Panel")?.shadowRoot ?? null;
        if (root === null) return null;
        const tip = root.querySelector(".MargoMeter-tip");
        const standing = root.querySelector(".MargoMeter-standing");
        if (tip === null || standing === null) return null;
        const held = tip.getBoundingClientRect();
        // Put the window exactly over the card, the way a reader who dragged it there would.
        const moved = standing as HTMLElement;
        moved.style.left = `${held.x}px`;
        moved.style.top = `${held.y}px`;
        moved.style.width = `${held.width}px`;
        moved.style.height = `${held.height}px`;
        (tip as HTMLElement).style.pointerEvents = "auto";
        const box = tip.getBoundingClientRect();
        const found = root.elementsFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        const at = (owner: Element) => found.findIndex((one) => owner.contains(one));
        return {
            tipAt: at(tip),
            standingAt: at(standing),
            doesCover: standing.getBoundingClientRect().width > 0,
        };
    });
    expect(stack?.doesCover, "the window really is over the card").toBe(true);
    expect(stack?.tipAt ?? -1, "the card is in the stack at that point").toBeGreaterThanOrEqual(0);
    expect(stack?.standingAt ?? -1, "and so is the window").toBeGreaterThanOrEqual(0);
    // Topmost first, so the card standing over the window is the smaller index.
    expect(
        stack?.tipAt ?? 1,
        "and the card is drawn over it, not under it",
    ).toBeLessThan(stack?.standingAt ?? 0);
});

/** Whether two boxes share no pixel of the screen between them, read off their edges. */
function getIsClearOf(one: PanelEdges, other: PanelEdges): boolean {
    if (one.right <= other.left) return true;
    return one.left >= other.right;
}

/**
 * ⚠️ **Asked of the edges, never the centre.** A card overlapping this window by 248px — its whole
 * width — and one overlapping by nothing put their centres in much the same place, which is how
 * `cc481f2` shipped a 43px overlap of the panel's own rows under a green test.
 *
 * The card opens to this window's left while there is room there, and to its own right once there
 * is not — the panel is not consulted either way (**ADR 0090**). At the width this suite runs at
 * there is no room on the left, so what it holds is the flip.
 */
test("a card from this window's row stands clear of this window", async ({ panel }) => {
    const rows = panel.at(".MargoMeter-standing .row[data-standing]");
    await expect(rows, "the window is drawing rows to hover").not.toHaveCount(0);

    await rows.first().hover();

    await expect(panel.at(".MargoMeter-tip:not(.tip-hidden)"), "hovering one opens a card")
        .toHaveCount(1);
    const card = await readEdgesOf(panel.page, ".MargoMeter-tip:not(.tip-hidden)");
    const window = await readEdgesOf(panel.page, ".MargoMeter-standing");
    expect(
        getIsClearOf(card, window),
        `the card at ${card.left}..${card.right} is off the window at ` +
            `${window.left}..${window.right}`,
    ).toBe(true);
    await panel.expectHonest("a card open over a row of the window beside the panel");
});

/**
 * ⚠️ **The panel's card belongs to the panel, wherever the second window is standing.** Dragged
 * hard left the panel flips its card to its own right — and a flip that also stepped past the
 * second window put it 177px further on, beside a window the reader was not pointing at. Reported
 * on the branch that introduced it, which is why both windows are measured here (**ADR 0090**).
 */
test("the panel's own card follows the panel, not the window beside it", async ({ panel }) => {
    const bar = await readPointsAlongBar(panel.page, [20]);
    await setDragged(panel.page, { x: bar[0]?.x ?? 0, y: bar[0]?.y ?? 0 }, { x: -600, y: 0 });
    await panel.at("#MargoMeter-Panel .list .row").first().hover();

    await expect(panel.at(".MargoMeter-tip:not(.tip-hidden)"), "hovering a panel row opens a card")
        .toHaveCount(1);
    const card = await readEdgesOf(panel.page, ".MargoMeter-tip:not(.tip-hidden)");
    const frame = await readEdgesOf(panel.page, "#MargoMeter-Panel");
    const window = await readEdgesOf(panel.page, ".MargoMeter-standing");
    expect(
        card.left - frame.right,
        `the card at ${card.left}..${card.right} opens one gap past the panel at ` +
            `${frame.left}..${frame.right}`,
    ).toBe(GAP);
    // The claim that tells the two rules apart. Stepping past the second window as well put this
    // card at that window's right edge; beside its own panel it starts well before it. That it
    // then lies over the window is ADR 0068's case, decided, and not what this measures.
    expect(
        card.left,
        `and never out past the window at ${window.left}..${window.right}`,
    ).toBeLessThan(window.right);
});

/**
 * A row of this window opens onto the casters under it and wears the cursor that says so, and for
 * two releases said nothing: the rows carried no card mark at all, so the sentence written for
 * them reached nobody (**ADR 0086**). Held here because the card is opened by a real pointer.
 */
test("a row of the window says on its card that it opens", async ({ panel }) => {
    const rows = panel.at(".MargoMeter-standing .row[data-standing]");
    await expect(rows, "the window is drawing rows to hover").not.toHaveCount(0);
    const named = await rows.first().locator(".row-name").innerText();

    await rows.first().hover();

    await expect(panel.at(".MargoMeter-tip:not(.tip-hidden)"), "hovering one opens a card")
        .toHaveCount(1);
    await expect(panel.at(".MargoMeter-tip .tip-name"), "which names that row").toHaveText(named);
    expect(await panel.at(".MargoMeter-tip").innerText(), "and says the row opens")
        .toContain("LPM — kto rzucił");
});
