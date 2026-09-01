/**
 * The controls a crawl cannot press: the ones that leave the panel, and the ones that need a
 * pointer the browser owns rather than an event dispatched at a node.
 *
 * `tests/e2e/panel-crawl.test.ts` walks everything that opens a level. What is left is the strip
 * along the title bar — the file handed over, the fold, the shelf, a pin, where the shelf is kept
 * — and the bar itself, which is dragged and not pressed.
 */

import { assert, assertEquals } from "@std/assert";
import { CAPTURE_FIELDS } from "@/src/game/fight-capture.ts";
import { getRecordedEngineUpdates } from "@/tests/recorded-fight.ts";
import { withBrowserPage } from "@/tests/e2e/browser-host.ts";
import { PROBE_NAME } from "@/tests/e2e/browser-page.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
/** Along the bar, in from its left edge. The first is bare grip; the rest are measured. */
const ALONG_THE_BAR = [10, 20, 40, 60, 80, 100, 130, 160, 190, 210, 230, 250];

/** Presses one control by attribute, and says whether the panel was still standing after. */
const PRESS_BY = `function (selector, at) {
    var root = document.getElementById("MargoMeter-Panel").shadowRoot;
    var found = [].slice.call(root.querySelectorAll(selector));
    if (at >= found.length) return null;
    found[at].dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true, composed: true, button: 0
    }));
    return found.length;
}`;

Deno.test("the save control hands over the fight, and it is the file intake reads", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const saved = await page.evaluate(
                `(function () {
                    var pressBy = ${PRESS_BY};
                    pressBy("[data-save]", 0);
                    var held = window.${PROBE_NAME}.saved;
                    return held.length === 0 ? null : held[held.length - 1];
                })()`,
            ) as string | null;
            assert(saved !== null, "pressing the control handed a file over");
            const read = JSON.parse(saved) as Record<string, unknown>;
            for (const field of ["formatVersion", "addOnVersion", "world", "calls"] as const) {
                assert(CAPTURE_FIELDS[field] in read, `the file states its ${field}`);
            }
            const carried = read[CAPTURE_FIELDS.calls];
            assert(Array.isArray(carried), "and carries the calls the game delivered");
            assertEquals(carried.length, calls.length, "every one of them, not a window of them");
        },
    );
});

Deno.test("the fold, the shelf and every pin are pressed", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const seen = await page.evaluate(
                `(function () {
                    var pressBy = ${PRESS_BY};
                    var root = document.getElementById("MargoMeter-Panel").shadowRoot;
                    var all = function (s) { return root.querySelectorAll(s).length; };
                    var steps = [];
                    var note = function (said) { steps.push(said + ":" + all(".row")); };
                    note("standing");
                    pressBy("[data-fold]", 0); note("folded");
                    pressBy("[data-fold]", 0); note("unfolded");
                    pressBy("[data-shelf]", 0); note("shelf");
                    var shelfRows = all("[data-fight]");
                    for (var p = 0; p < all("[data-pin]"); p += 1) pressBy("[data-pin]", p);
                    for (var f = 0; f < shelfRows; f += 1) pressBy("[data-fight]", f);
                    note("after the shelf");
                    var probe = window.${PROBE_NAME};
                    return {
                        steps: steps, shelfRows: shelfRows,
                        drawn: root.children.length > 0,
                        undrawn: all(".undrawn"),
                        failures: probe.failures.length, said: probe.said.length
                    };
                })()`,
            ) as {
                steps: string[];
                shelfRows: number;
                drawn: boolean;
                undrawn: number;
                failures: number;
                said: number;
            };
            const standing = seen.steps[0] ?? "";
            assert(standing.startsWith("standing:"), "the panel was drawing rows to begin with");
            assert(standing !== "standing:0", "and there were some of them");
            assertEquals(seen.steps[1], "folded:0", "folding takes the ranking down");
            // The count is not written here: it moves with every intake, and what is being held
            // is that unfolding gives back exactly what folding took, whatever that was.
            assertEquals(
                seen.steps[2],
                standing.replace("standing", "unfolded"),
                "and unfolding brings back every row it had",
            );
            assert(seen.shelfRows > 0, "the shelf offers the live fight at least");
            assertEquals(seen.drawn, true, "and the panel is standing after all of it");
            assertEquals(seen.undrawn, 0, "with no region given way");
            assertEquals(seen.failures, 0, "nothing reached the page uncaught");
            assertEquals(seen.said, 0, "and the one console stayed shut");
        },
    );
});

Deno.test("every place the shelf can be kept is chosen, and the fights travel", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const seen = await page.evaluate(
                `(function () {
                    var pressBy = ${PRESS_BY};
                    var root = document.getElementById("MargoMeter-Panel").shadowRoot;
                    pressBy("[data-shelf]", 0);
                    var choices = root.querySelectorAll("[data-storage]").length;
                    var kept = [];
                    for (var c = 0; c < choices; c += 1) {
                        pressBy("[data-storage]", c);
                        kept.push(root.querySelectorAll("[data-fight]").length);
                    }
                    var probe = window.${PROBE_NAME};
                    return {
                        choices: choices, kept: kept,
                        stored: window.localStorage.getItem("MargoMeter-storage"),
                        failures: probe.failures.length, said: probe.said.length
                    };
                })()`,
            ) as {
                choices: number;
                kept: number[];
                stored: string | null;
                failures: number;
                said: number;
            };
            assertEquals(seen.choices, 3, "local, session and memory, and nothing else");
            assertEquals(seen.kept.length, seen.choices, "each of them was chosen");
            for (const rows of seen.kept) assert(rows > 0, "and the live fight is on every shelf");
            assert(seen.stored !== null, "the reader's own answer was written down");
            assertEquals(seen.failures, 0, "nothing reached the page uncaught");
            assertEquals(seen.said, 0, "and the one console stayed shut");
        },
    );
});

Deno.test("the bar is grabbable along its bare length, and its labels are not", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const points = await page.evaluate((offsets: number[]) => {
                const host = document.getElementById("MargoMeter-Panel");
                const root = host?.shadowRoot ?? null;
                const grip = root?.querySelector("[data-grip]") ?? null;
                if (host === null || root === null || grip === null) return null;
                const bar = grip.getBoundingClientRect();
                return offsets.map((along) => {
                    const x = Math.round(bar.left + along);
                    const y = Math.round(bar.top + bar.height / 2);
                    const under = root.elementFromPoint(x, y);
                    return {
                        along,
                        x,
                        y,
                        isGrip: under !== null && under.getAttribute("data-grip") !== null,
                        onto: under === null ? "nothing" : under.className,
                    };
                });
            }, { args: [ALONG_THE_BAR] }) as
                | { along: number; x: number; y: number; isGrip: boolean; onto: string }[]
                | null;
            assert(points !== null, "the panel draws a bar to measure along");
            const grabbable = points.filter((point) => point.isGrip);
            const covered = points.filter((point) => !point.isGrip);
            assert(grabbable.length > 0, "some of the bar is bare grip");
            assert(covered.length > 0, "and some of it is covered by what the bar draws");

            for (const point of [...grabbable, ...covered]) {
                // Measured again for every point, never once for all of them: a drag that works
                // moves the bar out from under the coordinates the next one was going to use, and
                // the second point then presses the page instead of the panel.
                const at = await page.evaluate((along: number) => {
                    const host = document.getElementById("MargoMeter-Panel");
                    const grip = host?.shadowRoot?.querySelector("[data-grip]") ?? null;
                    if (host === null || grip === null) return null;
                    const bar = grip.getBoundingClientRect();
                    return {
                        x: Math.round(bar.left + along),
                        y: Math.round(bar.top + bar.height / 2),
                        left: Math.round(host.getBoundingClientRect().left),
                    };
                }, { args: [point.along] }) as { x: number; y: number; left: number } | null;
                assert(at !== null, "the bar is still there to take hold of");
                await page.mouse.move(at.x, at.y);
                await page.mouse.down();
                await page.mouse.move(at.x + 40, at.y, { steps: 3 });
                await page.mouse.up();
                const after = await page.evaluate(() =>
                    Math.round(
                        document.getElementById("MargoMeter-Panel")
                            ?.getBoundingClientRect().left ?? 0,
                    )
                );
                const moved = after - at.left;
                // A press has to land on the grip itself, not on a child of it
                // (`composePanelDragGrab`, `src/ui/panel-drag.ts`). So what a point does is
                // decided by what is under it, and both answers are held here.
                const expected = point.isGrip ? 40 : 0;
                assertEquals(moved, expected, `at ${point.along}px the bar is ${point.onto}`);
            }
        },
    );
});
