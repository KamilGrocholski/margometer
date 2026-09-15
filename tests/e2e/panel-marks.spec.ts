/**
 * What a mark before a name costs the name, in the browser that draws both.
 *
 * `DESIGN.md` lets a mark ride a row on one argument, and it is about width: **ADR 0023** removed
 * a profession letter because it took the one cell allowed to shorten. Nothing in the tree held
 * that — a name the panel shortens is cut with an ellipsis, which overflows no box and reads the
 * same to every other check here, so the cost was invisible to the gate and to this suite alike.
 */

import { expect, test } from "@/tests/e2e/panel-fixture.ts";
import { HOST_SELECTOR } from "@/tests/e2e/panel-fixture.ts";

/** Each row of the open level: what its name says, how much of it is not shown, and its marks. */
async function readRowsDrawn(page: import("@playwright/test").Page) {
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

test("a mark before a name leaves that name whole", async ({ panel }) => {
    await panel.at("[data-row]").first().click();
    await expect(panel.at(".list .row-caveat"), "a level draws the row a mark rides")
        .toHaveCount(1);

    const rows = await readRowsDrawn(panel.page);
    const marked = rows.filter((one) => one.marks.length > 0);
    expect(marked.length, "the marks reach some of the list").toBeGreaterThan(0);
    expect(marked.length, "and never the whole of it").toBeLessThan(rows.length);
    // The cost ADR 0023 measured, asked of the rows actually paying it. A name cut on a row
    // wearing none is the ellipsis doing its job; a name cut on a row wearing one is the mark
    // spending width the row did not have.
    for (const row of marked) {
        expect(row.cut, `${row.text}: a mark took the name it stands before`).toBe(0);
    }
    await panel.expectHonest("a level drawing the row a mark rides");
});
