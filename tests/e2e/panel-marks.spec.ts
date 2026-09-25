/**
 * What a mark before a name costs the name, in the browser that draws both.
 *
 * `DESIGN.md` lets a mark ride a row on one argument, and it is about width: `develop ADR 0023` removed
 * a profession letter because it took the one cell allowed to shorten. Nothing in the tree held
 * that — a name the panel shortens is cut with an ellipsis, which overflows no box and reads the
 * same to every other check here, so the cost was invisible to the gate and to this suite alike.
 */

import { expect, test } from "./panel-fixture.ts";
import { HOST_SELECTOR } from "./panel-fixture.ts";
import { waitForFrame } from "./panel-page.ts";

test("a mark before a name leaves that name whole", async ({ panel }) => {
    await panel.at("[data-row]").first().click();
    await expect(panel.at(".list .row-caveat"), "a level draws the row a mark rides")
        .toHaveCount(1);

    const rows = await readRowsDrawn(panel.page);
    const marked = rows.filter((one) => one.marks.length > 0);
    expect(marked.length, "the marks reach some of the list").toBeGreaterThan(0);
    expect(marked.length, "and never the whole of it").toBeLessThan(rows.length);
    // The cost `develop ADR 0023` measured, asked of the rows actually paying it. A name cut on a row
    // wearing none is the ellipsis doing its job; a name cut on a row wearing one is the mark
    // spending width the row did not have.
    for (const row of marked) {
        expect(row.cut, `${row.text}: a mark took the name it stands before`).toBe(0);
    }
    await panel.expectHonest("a level drawing the row a mark rides");
});

/** Each row of the open level: what its name says, how much of it is not shown, and its marks. */
async function readRowsDrawn(page: import("@playwright/test").Page) {
    await waitForFrame(page);
    return await page.evaluate((host) => {
        const root = document.querySelector(host)?.shadowRoot;
        if (root === null || root === undefined) return [];
        return [...root.querySelectorAll(".list .row")].map((row) => {
            const name = row.querySelector(".row-name");
            const marks = [".row-suspect", ".row-caveat", ".row-turn"]
                .filter((one) => row.querySelector(one) !== null);
            if (!(name instanceof HTMLElement)) return { text: "", cut: 0, marks };
            return {
                text: name.textContent ?? "",
                cut: name.scrollWidth - name.clientWidth,
                marks,
            };
        });
    }, HOST_SELECTOR);
}

/**
 * ⚠️ **The one claim about the caveat mark that no unit test can make.** Its shape is the
 * browser's answer, not the tree's: `ⓘ` was a codepoint until 2026-09-15 and measured 6.5px wide
 * against 10.23 for `O` at the same 13px — the same 6.5 under every family this machine offers,
 * none of them carrying U+24D8. What a reader met was a vertical sliver. The ring is drawn now
 * (`develop ADR 0092`), and round is a thing only a laid-out box can be asked about.
 */
test("the caveat mark is a circle, on the row and on the card alike", async ({ panel }) => {
    await panel.at("[data-row]").first().click();
    const row = panel.at(`${HOST_SELECTOR} .list .row-caveat`).first();
    await expect(row, "a level draws the row a mark rides").toHaveCount(1);

    const boxes = [await row.boundingBox()];
    await panel.at(`${HOST_SELECTOR} .list .row`).first().hover();
    const onCard = panel.at(`${HOST_SELECTOR} .MargoMeter-tip .tip-caveat`).first();
    await expect(onCard, "and a card carries it beside a figure").not.toHaveCount(0);
    boxes.push(await onCard.boundingBox());

    for (const box of boxes) {
        expect(box, "every mark drawn is somewhere on the page").not.toBeNull();
        const seen = box ?? { width: 0, height: 0, x: 0, y: 0 };
        expect(seen.width, "a mark has a width to be round at").toBeGreaterThan(0);
        expect(
            Math.round(seen.width),
            "and it is as wide as it is tall, which the codepoint never was",
        ).toBe(Math.round(seen.height));
    }
});
