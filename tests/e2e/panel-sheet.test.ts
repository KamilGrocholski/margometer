/**
 * The stylesheet as an engine resolves it, which is a different claim from the one the sheet
 * makes.
 *
 * `tests/ui/panel-look.test.ts` does arithmetic over the token values and holds the sheet to what
 * `DESIGN.md` states. What neither it nor a fake document can say is whether a browser applied
 * any of it: a rule that never parsed, one a later selector wins over, a sheet that never reached
 * inside the shadow root, and `box-sizing` doing the opposite of what a length assumed all leave
 * the sheet exactly as it is written and the panel wrong.
 *
 * ⚠️ **The expected lengths are read from `src/ui/panel-look.ts` on purpose**, which
 * `tests/AGENTS.md` otherwise forbids. The claim held here is not "the sheet says 18px" — that
 * would be reading a string back from the module that wrote it — but "the engine resolved it to
 * what the sheet states", and the engine is the other party. A token that moves is caught by
 * `tests/ui/panel-look.test.ts` against `DESIGN.md`, not here: measured 2026-09-01, moving
 * `rowHeight` reddens two tests there and none of these. Measured on Chrome 152.0.7977.64.
 */

import { assert, assertEquals } from "@std/assert";
import { PLACE, SPACE } from "@/src/ui/panel-look.ts";
import { getRecordedEngineUpdates } from "@/tests/recorded-fight.ts";
import { WINDOW_HEIGHT, withBrowserPage } from "@/tests/e2e/browser-host.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";

/** A length the sheet states, as the whole pixels the engine will report it in. */
function getSheetPixels(stated: string): number {
    assert(stated.endsWith("px"), "a length read off the sheet is stated in pixels");
    const read = Number(stated.slice(0, -2));
    assert(Number.isFinite(read), "and a length compared against a computed one is a number");
    return read;
}

Deno.test("every row is the height the sheet gives it, as the engine works it out", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const rows = await page.evaluate(() => {
                const root = document.getElementById("MargoMeter-Panel")?.shadowRoot ?? null;
                if (root === null) return null;
                return [...root.querySelectorAll(".row")].map((row) => {
                    const style = globalThis.getComputedStyle(row);
                    return { height: style.height, sizing: style.boxSizing };
                });
            }) as { height: string; sizing: string }[] | null;
            assert(rows !== null, "the panel is up and drawing rows");
            assert(rows.length > 0, "and there are rows to measure");
            const wrong = rows.filter((row) => row.height !== SPACE.rowHeight);
            assertEquals(wrong, [], "every row stands at the one height the sheet states");
            // A div nobody styled is `content-box`, and at this font it happens to lay out
            // 18px tall — measured on Chrome 152, 2026-09-01, with the sheet moved out of the
            // shadow root. The height alone would have agreed with an unstyled row.
            const loose = rows.filter((row) => row.sizing !== "border-box");
            assertEquals(loose, [], "and it is the sheet that put it there, not the default");
        },
    );
});

Deno.test("the panel is the width it declares, and nothing in it scrolls sideways", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const measured = await page.evaluate(() => {
                const host = document.getElementById("MargoMeter-Panel");
                const root = host?.shadowRoot ?? null;
                if (host === null || root === null) return null;
                const over = [...root.querySelectorAll(".list, .row, .sides, .tabs")]
                    .filter((one) => one.scrollWidth > one.clientWidth)
                    .map((one) => `${one.className} by ${one.scrollWidth - one.clientWidth}`);
                return {
                    width: host.getBoundingClientRect().width,
                    pageOver: document.documentElement.scrollWidth >
                        document.documentElement.clientWidth,
                    over,
                };
            });
            assert(measured !== null, "the panel is up and has been laid out");
            assertEquals(measured.width, getSheetPixels(PLACE.width), "the width it declares");
            assertEquals(measured.over, [], "and no region of it is wider than it can show");
            assertEquals(measured.pageOver, false, "nor is the page the panel is a guest on");
        },
    );
});

Deno.test("the sheet reached inside the shadow root, and the list is what scrolls", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const seen = await page.evaluate(() => {
                const root = document.getElementById("MargoMeter-Panel")?.shadowRoot ?? null;
                const list = root?.querySelector(".list") ?? null;
                if (root === null || list === null) return null;
                const listStyle = globalThis.getComputedStyle(list);
                const row = root.querySelector(".row");
                return {
                    sheets: root.styleSheets.length,
                    overflowDown: listStyle.overflowY,
                    // A row is a flex box only because the sheet says so; a div nobody styled is
                    // `block`, which is what an unapplied sheet would leave behind.
                    rowDisplay: row === null ? null : globalThis.getComputedStyle(row).display,
                    listBottom: list.getBoundingClientRect().bottom,
                };
            });
            assert(seen !== null, "the panel is up and drawing a list");
            assert(seen.sheets > 0, "the shadow root carries a sheet of its own");
            assertEquals(seen.rowDisplay, "flex", "and the engine laid a row out by it");
            assertEquals(seen.overflowDown, "auto", "the list is the region that scrolls");
            assert(seen.listBottom <= WINDOW_HEIGHT, "and it ends inside the window it opened in");
        },
    );
});
