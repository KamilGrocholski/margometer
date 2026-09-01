/**
 * Real input and real storage: the two things the suite could only pretend at.
 *
 * A drag is driven through the browser's own mouse rather than by dispatching an event at a node.
 * `.agents/skills/verify/SKILL.md` records why that matters: `setPointerCapture` throws for a
 * pointerId no real pointer owns, the guarded handler swallows the whole drag, and a synthetic
 * gesture therefore reports a panel that never moved as a panel that cannot be moved.
 *
 * What comes back after a reload is `localStorage`, cleared by nobody, read by a second boot of
 * the same file. Elsewhere in the suite it is a `Map` that cannot refuse and outlives no document.
 */

import { assert, assertEquals } from "@std/assert";
import { getRecordedEngineUpdates } from "@/tests/recorded-fight.ts";
import { withBrowserPage } from "@/tests/e2e/browser-host.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
/** In from the bar's left edge, which is bare grip. See `READ_PLACE`. */
const GRIP_IN_FROM_LEFT = 20;
/** Far enough that no rounding could account for it, and inside the window either way. */
const DRAGGED_ACROSS = 120;
const DRAGGED_DOWN = 60;

/**
 * Where the panel stands now, what the browser has been told to remember about it, and a point on
 * the bar a pointer can actually take hold of.
 *
 * ⚠️ **Not the middle of the bar.** A drag starts only where the press lands on the grip itself
 * and not on a child of it (`composePanelDragGrab`, `src/ui/panel-drag.ts`), and the middle of
 * the bar is the version label — measured on Chrome 152, 2026-09-01: the bar runs 510–770 and
 * `titlebar-version` covers 609–669, with the controls to its right. So the point is taken near
 * the left edge and the reading says which element is really under it, because a point that
 * silently stopped being the grip would report a panel that cannot be dragged as one nobody
 * dragged. `deno task screenshots` cannot see this at all: it dispatches straight at `[data-grip]`.
 */
const READ_PLACE = `(() => {
    const host = document.getElementById("MargoMeter-Panel");
    if (host === null || host.shadowRoot === null) return null;
    const root = host.shadowRoot;
    const box = host.getBoundingClientRect();
    const grip = root.querySelector("[data-grip]");
    const hold = grip === null ? null : grip.getBoundingClientRect();
    const at = hold === null ? null : {
        x: Math.round(hold.left + ${GRIP_IN_FROM_LEFT}),
        y: Math.round(hold.top + hold.height / 2),
    };
    const under = at === null ? null : root.elementFromPoint(at.x, at.y);
    return {
        left: Math.round(box.left),
        top: Math.round(box.top),
        grip: at,
        isOnGrip: under !== null && under.getAttribute("data-grip") !== null,
        stored: window.localStorage.getItem("MargoMeter-place"),
        folded: window.localStorage.getItem("MargoMeter-folded"),
    };
})()`;

interface PanelPlace {
    left: number;
    top: number;
    grip: { x: number; y: number } | null;
    isOnGrip: boolean;
    stored: string | null;
    folded: string | null;
}

Deno.test("a drag by the bar moves the panel, and the browser is told where it went", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const before = await page.evaluate(`${READ_PLACE}`) as PanelPlace | null;
            assert(before !== null, "the panel is up before it is taken hold of");
            assert(before.grip !== null, "and it draws the bar it is dragged by");
            assertEquals(before.isOnGrip, true, "and the point taken hold of is that bar");
            assertEquals(before.stored, null, "nobody has moved it yet");

            // The browser's own mouse, not a dispatched event: only a pointer the browser owns
            // has an id `setPointerCapture` will take.
            await page.mouse.move(before.grip.x, before.grip.y);
            await page.mouse.down();
            await page.mouse.move(
                before.grip.x + DRAGGED_ACROSS,
                before.grip.y + DRAGGED_DOWN,
                { steps: 4 },
            );
            await page.mouse.up();

            const after = await page.evaluate(`${READ_PLACE}`) as PanelPlace | null;
            assert(after !== null, "the panel is still up after the drag");
            assertEquals(after.left - before.left, DRAGGED_ACROSS, "it went where it was taken");
            assertEquals(after.top - before.top, DRAGGED_DOWN, "on both axes");
            assert(after.stored !== null, "and where it landed was written down");
        },
    );
});

Deno.test("the panel comes back where it was left, after a reload nobody staged", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const before = await page.evaluate(`${READ_PLACE}`) as PanelPlace | null;
            assert(before !== null, "the panel is up");
            assert(before.grip !== null, "and has a bar to be taken hold of");
            assertEquals(before.isOnGrip, true, "at the point about to be pressed");
            await page.mouse.move(before.grip.x, before.grip.y);
            await page.mouse.down();
            await page.mouse.move(
                before.grip.x + DRAGGED_ACROSS,
                before.grip.y + DRAGGED_DOWN,
                { steps: 4 },
            );
            await page.mouse.up();
            const moved = await page.evaluate(`${READ_PLACE}`) as PanelPlace | null;
            assert(moved !== null, "the panel survived the drag");

            await page.reload();

            const back = await page.evaluate(`${READ_PLACE}`) as PanelPlace | null;
            assert(back !== null, "a second boot of the same file put a panel up again");
            assertEquals(back.left, moved.left, "standing where the reader left it");
            assertEquals(back.top, moved.top, "on both axes");
            assertEquals(back.stored, moved.stored, "off the store the first boot wrote to");
        },
    );
});

Deno.test("a panel folded away is still folded when the reader comes back", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const folded = await page.evaluate(() => {
                const root = document.getElementById("MargoMeter-Panel")?.shadowRoot ?? null;
                const control = root?.querySelector("[data-fold]") ?? null;
                if (control === null) return null;
                control.dispatchEvent(
                    new PointerEvent("pointerdown", {
                        bubbles: true,
                        composed: true,
                        button: 0,
                    }),
                );
                return { rows: root?.querySelectorAll("[data-row]").length ?? -1 };
            });
            assert(folded !== null, "the panel draws a control that folds it");
            assertEquals(folded.rows, 0, "and folding it takes the ranking down");

            await page.reload();

            const after = await page.evaluate(`${READ_PLACE}`) as PanelPlace | null;
            const rows = await page.evaluate(() =>
                document.getElementById("MargoMeter-Panel")?.shadowRoot
                    ?.querySelectorAll("[data-row]").length ?? -1
            );
            assert(after !== null, "a second boot put the panel up again");
            assert(after.folded !== null, "the browser was told the panel was folded");
            assertEquals(rows, 0, "and it came back folded rather than open");
        },
    );
});
