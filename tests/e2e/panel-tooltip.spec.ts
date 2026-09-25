/**
 * What the add-on writes into the game's own tooltip, in a real browser and through the built
 * file: one block on each fighter with something to say, one call to `concatTip` per row.
 *
 * Nothing else here can hold it. A unit test over the composer reads a string, and a string
 * cannot say whether the bundle found the fighters, whether the rows went over separately, or
 * whether an open tooltip was told they had.
 */

import { expect, test } from "./panel-fixture.ts";
import type { Page } from "@playwright/test";
import { waitForFrame } from "./panel-page.ts";

/** The add-on's own name, which the first row carries — `SECURITY.md`'s guest rule. */
const ADD_ON_NAME = "MargoMeter";

test("the add-on's rows land in the game's own tooltips", async ({ panel }) => {
    const landed = await readTooltips(panel.page);
    const written = Object.values(landed).filter((rows) => rows.length > 0);
    expect(written.length, "somebody was written to").toBeGreaterThan(0);
    const told = await readTold(panel.page);
    for (const [id, rows] of Object.entries(landed)) {
        if (rows.length === 0) continue;
        expect(told[id] ?? 0, `${id}'s open tooltip was told its rows went on`).toBeGreaterThan(0);
    }
    for (const rows of written) {
        expect(rows[0], "the name stands alone, over the rows").toBe(ADD_ON_NAME);
        expect(rows.slice(1).some((row) => row.includes(ADD_ON_NAME)), "and is said once")
            .toBe(false);
        expect(rows.length, "and never goes over on its own").toBeGreaterThan(1);
    }
    await panel.expectHonest("rows in the game's tooltips");
});

/** What stands in every fighter's tooltip past what the game composed, row by row. */
async function readTooltips(page: Page): Promise<Record<string, string[]>> {
    await waitForFrame(page);
    const found = await page.evaluate(() => {
        const held = (window as unknown as { MARGOMETER_TIPS?: Record<string, string> })
            .MARGOMETER_TIPS;
        return held ?? null;
    });
    expect(found, "the page collected what was written to its fighters").not.toBeNull();
    const rows: Record<string, string[]> = {};
    for (const [id, text] of Object.entries(found ?? {})) rows[id] = text.split("<br>").slice(1);
    return rows;
}

/** How many times each fighter's open tooltip was told to draw again. */
async function readTold(page: Page): Promise<Record<string, number>> {
    await waitForFrame(page);
    const found = await page.evaluate(() => {
        return (window as unknown as { MARGOMETER_TOLD?: Record<string, number> })
            .MARGOMETER_TOLD ?? null;
    });
    expect(found, "the page counted what its tooltips were told").not.toBeNull();
    return found ?? {};
}

/**
 * ⚠️ **The rows are separate calls on purpose.** The client's own `concatTip` puts a `<br>`
 * between what is there and what it is handed, so the block's shape costs this add-on no markup —
 * and a row carrying a tag would be markup of ours in somebody else's string (`develop ADR 0024`).
 */
test("a row is never markup, and several rows stand on the client's break", async ({ panel }) => {
    await panel.feed(60);
    const landed = await readTooltips(panel.page);
    let many = 0;
    for (const rows of Object.values(landed)) {
        // Past the name and one thing said under it, which every block that says anything has.
        if (rows.length > 2) many += 1;
        for (const row of rows) {
            expect(row.includes("<"), `no row opens markup: ${row}`).toBe(false);
            expect(row.includes("&"), `nor an entity: ${row}`).toBe(false);
            expect(row.trim().length, "and no row is written empty").toBeGreaterThan(0);
        }
    }
    expect(many, "a fighter with more than one thing to say got more than one row")
        .toBeGreaterThan(0);
});

/**
 * ⚠️ **The failure this is guarded for.** Every fighter is written on every payload, so a block
 * the writer could not find again would stand under the one already there — and the page's stub
 * keeps a tooltip it did not rebuild, as the client does, which is what makes a second copy
 * visible. The client's focus pass is `tests/userscript-entry.test.ts`'s to hold.
 */
test("nobody is written to twice over one payload", async ({ panel }) => {
    await panel.feed(40);
    const landed = await readTooltips(panel.page);
    for (const [id, rows] of Object.entries(landed)) {
        const names = rows.filter((row) => row.includes(ADD_ON_NAME));
        expect(names.length, `${id} took one block and not two`).toBeLessThanOrEqual(1);
    }
});
