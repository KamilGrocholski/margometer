/**
 * Every control, on every screen, at every level, in a real browser: pressed, walked, and closed
 * behind, with the panel held to the same invariants at every stop. Nothing thrown and nothing
 * said is the fixture's, over every stop the crawl made.
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { expect, test } from "@/tests/e2e/panel-fixture.ts";
import { composeCrawlScript, type CrawlReport } from "@/tests/e2e/panel-crawler.ts";

/** The largest recording there is, which is the one worth walking to the bottom. */
const DEEPEST = "captures/2026-08-12-tempest-grupa-vs-hildur-1-1786514810315-none.json";
/** Two nouns, two directions, three audiences. The panel's own arithmetic, not a measurement. */
const SCREENS_ON_A_FIGHT = 12;
/** A floor, so a crawler that stopped finding its subject fails rather than passing quietly. */
const LEAST_OPENED = 60;
/** A deep crawl is thousands of presses and one page; it is given room the others do not need. */
const CRAWL_MILLISECONDS = 300_000;

/**
 * Every recording, read at collection time so each is a test of its own and the workers share them
 * out. Read rather than listed (`captures/AGENTS.md`), and an empty directory is a failure.
 */
function readRecordingPaths(): string[] {
    const root = process.cwd();
    const names = readdirSync(join(root, "captures"))
        .filter((name) => name.endsWith(".json"))
        .sort();
    expect(names.length, `there are recordings under ${join(root, "captures")}`).toBeGreaterThan(0);
    return names.map((name) => join("captures", name));
}

test.describe("one recording, walked to the bottom", () => {
    test.use({ recording: DEEPEST });

    test("every control on every screen is pressed, and every level walked", async ({ panel }) => {
        test.setTimeout(CRAWL_MILLISECONDS);
        const report = await panel.page.evaluate(composeCrawlScript(true)) as CrawlReport;
        expect(report.faults, "the panel held at every stop the crawl made").toEqual([]);
        expect(report.screens, "every screen was walked").toBe(SCREENS_ON_A_FIGHT);
        expect(report.opened, `only ${report.opened} rows opened`).toBeGreaterThanOrEqual(
            LEAST_OPENED,
        );
        expect(report.second, "and the crawl reached a second level to look under")
            .toBeGreaterThan(0);
        expect(
            report.closed,
            "every level that opened was closed again, and none closed twice",
        ).toBe(report.opened + report.second);

        // **ADR 0034**: a press that changes nothing is a control that should not be drawn.
        expect(report.leaves, "no control the panel drew is a control that does nothing").toBe(0);

        // `docs/drill-levels.md`: the third level is the last — held by nothing on it to press.
        expect(report.deeper, "and nothing under it opens onto a fourth").toBe(0);
    });
});

/**
 * The sample the width check must flag, and the reason it needs one of its own.
 *
 * ⚠️ **No recording overflows the panel**: taking `min-width:0` off the name cell lit nothing
 * over the deepest one on 2026-09-06, no nickname in `captures/` being long enough to push a row
 * past 260 pixels. So the condition is made rather than found — a rule of the test's own, put
 * into the root, narrowing the panel under content composed for the width it was drawn at.
 */
test.describe("a panel narrower than what it drew", () => {
    test.use({ recording: DEEPEST });

    test("is what the crawl's width check is looking for", async ({ panel }) => {
        await panel.page.evaluate(() => {
            const root = document.getElementById("MargoMeter-Panel")?.shadowRoot ?? null;
            if (root === null) throw new ReferenceError("no panel to narrow");
            const rule = document.createElement("style");
            rule.textContent = ".panel{width:120px}.list{width:120px}";
            root.append(rule);
        });

        const report = await panel.page.evaluate(composeCrawlScript(false)) as CrawlReport;
        const said = report.faults.join(" ");
        expect(report.faults.length, "a panel too narrow for its rows is a fault").toBeGreaterThan(
            0,
        );
        expect(said, "and the fault says what held more than it had room for").toContain("holds");
    });
});

for (const path of readRecordingPaths()) {
    test.describe(path, () => {
        test.use({ recording: path });

        test("holds up under a crawl of every screen", async ({ panel }) => {
            const report = await panel.page.evaluate(composeCrawlScript(false)) as CrawlReport;
            expect(report.faults, "a fight nobody picked is one the panel still holds under")
                .toEqual([]);
            expect(report.screens, "every screen was walked").toBe(SCREENS_ON_A_FIGHT);
            expect(report.closed, "and no level was left standing").toBe(report.opened);
        });
    });
}
