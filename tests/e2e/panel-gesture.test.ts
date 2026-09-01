/**
 * Gestures as a browser delivers them, which is the one thing a document of our own cannot fake.
 *
 * A press inside a shadow root is retargeted for every listener outside it, so a panel listening
 * on the host reads the host as the target and every row, tab and crumb answers `null`.
 * `tests/fake-document.ts` once modelled that wrongly and let such a panel pass the whole suite;
 * these tests are the engine's own answer instead of ours.
 */

import { assert, assertEquals } from "@std/assert";
import { getRecordedEngineUpdates } from "@/tests/recorded-fight.ts";
import { withBrowserPage } from "@/tests/e2e/browser-host.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
/**
 * The fourth tab, addressed by position and never by its label: the labels are Polish and this
 * file is English (**L2**). The order is `composeNounTabs` then `composeDirectionTabs`
 * (`src/ui/panel-screen.ts`), so two nouns are followed by two directions.
 */
const TAB_DAMAGE_TAKEN = 3;

/**
 * Which tabs are open, and how many there are. Every open one, not the first: the panel draws two
 * strips and each carries a selection of its own, so a reader that stopped at the first would
 * report the noun's answer whichever direction was pressed.
 */
const READ_SELECTED = `(() => {
    const host = document.getElementById("MargoMeter-Panel");
    if (host === null || host.shadowRoot === null) return null;
    const tabs = [...host.shadowRoot.querySelectorAll("[data-screen]")];
    const open = [];
    tabs.forEach((tab, at) => {
        if (tab.className.split(" ").includes("selected")) open.push(at);
    });
    return { open, count: tabs.length };
})()`;

Deno.test("a press inside the shadow root says what was pressed", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const before = await page.evaluate(`${READ_SELECTED}`) as {
                open: number[];
                count: number;
            } | null;
            assert(before !== null, "the panel is up before anything is pressed");
            assert(before.count > TAB_DAMAGE_TAKEN, "and it draws the tab about to be pressed");
            assertEquals(
                before.open.includes(TAB_DAMAGE_TAKEN),
                false,
                "which is not one already open",
            );

            // A press and never a click: a browser assembles a click out of two moments and
            // dispatches it only if both resolve to a node still in the tree, so a redraw between
            // them dispatches nothing at all (`src/ui/panel-element.ts`).
            await page.evaluate((at: number) => {
                const host = document.getElementById("MargoMeter-Panel");
                const tabs = host?.shadowRoot?.querySelectorAll("[data-screen]");
                tabs?.[at]?.dispatchEvent(
                    new PointerEvent("pointerdown", { bubbles: true, composed: true, button: 0 }),
                );
            }, { args: [TAB_DAMAGE_TAKEN] });

            const after = await page.evaluate(`${READ_SELECTED}`) as { open: number[] } | null;
            assert(after !== null, "the panel is still up after it");
            assertEquals(
                after.open.includes(TAB_DAMAGE_TAKEN),
                true,
                "the tab pressed is the tab now open",
            );
        },
    );
});

Deno.test("a row opened by a press draws a way back, and the way back leads out", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const opened = await page.evaluate(() => {
                const root = document.getElementById("MargoMeter-Panel")?.shadowRoot ?? null;
                if (root === null) return null;
                const press = (selector: string) =>
                    root.querySelector(selector)?.dispatchEvent(
                        new PointerEvent("pointerdown", {
                            bubbles: true,
                            composed: true,
                            button: 0,
                        }),
                    );
                press("[data-row]");
                const back = root.querySelectorAll(".crumb-back").length;
                const here = root.querySelectorAll(".crumb-here").length;
                press(".crumb-back");
                return { back, here, backAfter: root.querySelectorAll(".crumb-back").length };
            });
            assert(opened !== null, "the panel drew a row to open");
            assertEquals(opened.here, 1, "an opened row says where the reader is standing");
            assert(opened.back > 0, "and offers a way out of it");
            assertEquals(opened.backAfter, 0, "which, pressed, leads back to the screen");
        },
    );
});

Deno.test("right-click goes back, and the game's own menu is not opened over it", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            // A default nothing can fake: only a real browser has a context menu to prevent, so
            // only here does `defaultPrevented` carry an answer rather than whatever a stub set.
            const answered = await page.evaluate(() => {
                const root = document.getElementById("MargoMeter-Panel")?.shadowRoot ?? null;
                const row = root?.querySelector("[data-row]") ?? null;
                if (root === null || row === null) return null;
                row.dispatchEvent(
                    new PointerEvent("pointerdown", {
                        bubbles: true,
                        composed: true,
                        button: 0,
                    }),
                );
                const opened = root.querySelectorAll(".crumb-here").length;
                // Asked for again, and never the node that was pressed: opening a row replaces
                // the region holding it, so the row is out of the tree by now and an event
                // dispatched on it bubbles to nobody. Measured on Chrome 152, 2026-09-01 — this
                // is the hazard `src/ui/panel-element.ts` cites for listening at the root.
                const standing = root.querySelector(".crumb-here");
                if (standing === null) return null;
                const menu = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
                standing.dispatchEvent(menu);
                return {
                    opened,
                    stopped: menu.defaultPrevented,
                    here: root.querySelectorAll(".crumb-here").length,
                };
            });
            assert(answered !== null, "the panel drew a row to open and go back out of");
            assertEquals(answered.opened, 1, "the row opened first");
            assertEquals(answered.stopped, true, "the game's own menu is stopped");
            assertEquals(answered.here, 0, "and the gesture took the reader back out");
        },
    );
});

Deno.test("a second copy on one page stands down, and one panel is drawn", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: true },
        async (page) => {
            const drawn = await page.evaluate(() =>
                document.querySelectorAll("#MargoMeter-Panel").length
            );
            assertEquals(drawn, 1, "two copies of the file leave one panel on the page");
        },
    );
});
