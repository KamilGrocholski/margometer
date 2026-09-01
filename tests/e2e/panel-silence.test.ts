/**
 * `PRODUCT.md`'s fourth pillar, asserted rather than intended: the panel is a guest on somebody
 * else's page and never costs the reader their game — not a frame, not a click, not an exception.
 *
 * Nothing held that until now. A failure inside the add-on becomes state at a boundary (**E5**),
 * and every one of those boundaries is covered by the suite — but whether anything reaches the
 * page **past** them is a question only a page can answer, and there has been no page. The probe
 * is installed before the bundle loads, which is the whole reason this suite has a page of its
 * own rather than the preview's.
 *
 * The sweep is over every recording, because the one that breaks this will be the one nobody
 * picked. It runs in one browser: a launch is 0.9 s and a page is 0.1 s, measured on Chrome 152,
 * 2026-09-01.
 */

import { assert, assertEquals } from "@std/assert";
import { getRecordedEngineUpdates, getRecordingPaths } from "@/tests/recorded-fight.ts";
import { withBrowserPage, withBrowserPagesOver } from "@/tests/e2e/browser-host.ts";
import { ENGINE_ANSWER, PROBE_NAME } from "@/tests/e2e/browser-page.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";

interface Probe {
    failures: string[];
    said: string[];
    answers: unknown[];
    calls: number;
}

const READ_PROBE = `window[${JSON.stringify(PROBE_NAME)}]`;

Deno.test("every recording plays through a browser, saying nothing", async () => {
    const paths = getRecordingPaths();
    assert(paths.length > 0, "there are recordings to play through");
    const fights = paths.map((path) => ({
        calls: getRecordedEngineUpdates(path),
        entryIndex: getRecordedEngineUpdates(path).length,
        doesLoadTwice: false,
    }));
    const loud: string[] = [];
    await withBrowserPagesOver(fights, async (page, at) => {
        const probe = await page.evaluate(`${READ_PROBE}`) as Probe;
        const name = paths[at] ?? "a recording nobody named";
        for (const failure of probe.failures) loud.push(`${name}: ${failure}`);
        for (const said of probe.said) loud.push(`${name}: ${said}`);
        if (probe.calls !== fights[at]?.calls.length) loud.push(`${name}: calls went missing`);
    });
    assertEquals(loud, [], "a fight the add-on cannot read still costs the reader nothing");
});

Deno.test("the game's own call is answered with the game's own value, every time", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const probe = await page.evaluate(`${READ_PROBE}`) as Probe;
            assertEquals(probe.calls, calls.length, "every payload reached the game's own method");
            assertEquals(probe.answers.length, calls.length, "and every call answered something");
            const wrong = probe.answers.filter((answer) => answer !== ENGINE_ANSWER);
            assertEquals(wrong, [], "and what came back is what the game itself returned");
        },
    );
});

Deno.test("a payload of a shape the client never sends costs the game nothing", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            // Nothing captured: shapes the client never sends, put through the wrap after a
            // real fight has been read. The one thing that must not happen is a throw arriving in
            // the game's own call stack, which only a page can be asked about.
            //
            // ⚠️ **This does not reach E5's inbound catch, and nothing from a page can.**
            // Measured 2026-09-01 with that `try` removed: thirteen hostile shapes — a bare
            // number, text, a message list of numbers, a warrior with no fields, a 100 000
            // character message — and not one of them threw. The reader answers every shape,
            // charging what it cannot read to an unknown. That catch is there for a broken
            // invariant of ours (**A7**), which only a mutation inside `src/` reaches.
            const seen = await page.evaluate((name: string) => {
                const held = globalThis as unknown as {
                    Engine: { battle: { updateData(payload: unknown): unknown } };
                };
                const nonsense = [null, 7, "not a payload", { m: 4 }, { w: "nobody" }];
                const answers: unknown[] = [];
                let threw = 0;
                for (const payload of nonsense) {
                    try {
                        answers.push(held.Engine.battle.updateData(payload));
                    } catch {
                        threw += 1;
                    }
                }
                const probe = (globalThis as unknown as Record<string, unknown>)[name];
                const watched = probe as { failures: string[]; said: string[] };
                return {
                    threw,
                    answers,
                    offered: nonsense.length,
                    failures: watched.failures.length,
                    drawn: document.getElementById("MargoMeter-Panel") !== null,
                };
            }, { args: [PROBE_NAME] });
            assertEquals(seen.threw, 0, "not one of them threw back at the game");
            assertEquals(seen.answers.length, seen.offered, "and every one was answered");
            const wrong = seen.answers.filter((answer) => answer !== ENGINE_ANSWER);
            assertEquals(wrong, [], "with the value the game itself returned");
            assertEquals(seen.failures, 0, "nothing reached the page uncaught");
            assertEquals(seen.drawn, true, "and the panel is still standing");
        },
    );
});
