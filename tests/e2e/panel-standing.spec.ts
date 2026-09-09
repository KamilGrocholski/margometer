/**
 * The window beside the panel, in a real browser: two grips under one root, two folds, two
 * corners, and a row a real pointer opens.
 *
 * Every fault this file holds was invisible to the suite that runs without one — a window opening
 * exactly under the panel passed every unit test there is, and was found in a screenshot.
 */

import { expect, test } from "@/tests/e2e/panel-fixture.ts";
import { setDragged } from "@/tests/e2e/panel-probe.ts";
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
    await expect(card, "the card opened").not.toHaveClass(/tip-hidden/);
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
