/**
 * Every control, on every screen, at every level, in a real browser.
 *
 * It presses whatever the panel drew, walks whatever opened, comes back out, and holds the panel
 * to the same invariants at every stop: nothing thrown, nothing said, no region given way, no row
 * reading `undefined`, and a way back landing exactly where it left. **ADR 0046** carries what
 * that buys and what it does not — measured, it caught no defect the gate missed.
 */

import { assert, assertEquals } from "@std/assert";
import { getRecordedEngineUpdates, getRecordingPaths } from "@/tests/recorded-fight.ts";
import { withBrowserPage, withBrowserPagesOver } from "@/tests/e2e/browser-host.ts";
import { composeCrawlScript, type CrawlReport } from "@/tests/e2e/panel-crawler.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
/** Two nouns, two directions, three audiences. The panel's own arithmetic, not a measurement. */
const SCREENS_ON_A_FIGHT = 12;
/**
 * Floors, so a crawler that stopped finding its subject fails rather than passing quietly.
 * Measured 2026-09-01: 84 controls on one screen's first level and 3038 on its second.
 */
const LEAST_OPENED = 300;
const LEAST_SECOND = 3000;

Deno.test("every control on every screen is pressed, and every level walked", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const report = await page.evaluate(composeCrawlScript(true)) as CrawlReport;
            assertEquals(report.faults, [], "the panel held at every stop the crawl made");
            assertEquals(report.screens, SCREENS_ON_A_FIGHT, "every screen was walked");
            assert(report.opened >= LEAST_OPENED, `only ${report.opened} rows opened`);
            assert(report.second >= LEAST_SECOND, `only ${report.second} second levels opened`);
            assertEquals(
                report.closed,
                report.opened + report.second,
                "every level that opened was closed again, and none closed twice",
            );

            // **ADR 0034**: a row with a level under it opens, and one with nothing under it is
            // not drawn as openable at all. So a press that changes nothing is a control that
            // should not have been drawn — measured 2026-09-01, there is not one on any screen.
            assertEquals(
                report.leaves,
                0,
                "no control the panel drew is a control that does nothing",
            );

            // `docs/drill-levels.md`: the third level is the last. Held here by there being
            // nothing on it to press, rather than by something on it refusing to open.
            assert(report.second > 0, "the crawl reached a second level to look under");
            assertEquals(report.deeper, 0, "and nothing under it opens onto a fourth");
        },
    );
});

Deno.test("every recording is crawled on every screen, and none of them says a word", async () => {
    const paths = getRecordingPaths();
    const fights = paths.map((path) => {
        const calls = getRecordedEngineUpdates(path);
        return { calls, entryIndex: calls.length, doesLoadTwice: false };
    });
    const loud: string[] = [];
    let opened = 0;
    await withBrowserPagesOver(fights, async (page, at) => {
        const report = await page.evaluate(composeCrawlScript(false)) as CrawlReport;
        const name = paths[at] ?? "a recording nobody named";
        for (const fault of report.faults) loud.push(`${name}: ${fault}`);
        if (report.screens !== SCREENS_ON_A_FIGHT) loud.push(`${name}: ${report.screens} screens`);
        if (report.closed !== report.opened) loud.push(`${name}: a level was left standing`);
        opened += report.opened;
    });
    assertEquals(loud, [], "a fight nobody picked is a fight the panel still holds up under");
    assert(opened >= LEAST_OPENED, `only ${opened} rows opened across the whole corpus`);
});
