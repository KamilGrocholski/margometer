/**
 * The file the panel hands over: that the browser really takes one, what it is called, and what is
 * inside it.
 *
 * It is read off the download the browser performed rather than off the text the page built — the
 * object URL is revoked on the next macrotask, so a claim taken from the `Blob` alone would not
 * say whether a reader ends up with a file at all.
 */

import { readFileSync } from "node:fs";
import { expect, type PanelHandle, test } from "@/tests/e2e/panel-fixture.ts";
import { GAME_BUILD, PAGE_WORLD } from "@/tests/e2e/panel-page.ts";

/** The envelope's own field names, as `src/game/fight-capture.ts` writes them. */
const ENVELOPE = [
    "formatVersion",
    "addOnVersion",
    "capturedAt",
    "world",
    "gameBuild",
    "calls",
    "report",
];

/** The file the browser took, read back off disk. */
async function readHandedOver(panel: PanelHandle) {
    const [download] = await Promise.all([
        panel.page.waitForEvent("download"),
        panel.at("[data-save]").click(),
    ]);
    const at = await download.path();
    expect(at, "the browser took the file rather than refusing it").not.toBeNull();
    return {
        named: download.suggestedFilename(),
        read: JSON.parse(readFileSync(at, "utf8")) as Record<string, unknown>,
    };
}

test("the file is named for the world and the build it was taken on", async ({ panel }) => {
    const handed = await readHandedOver(panel);
    expect(handed.named.startsWith(`margometer-${PAGE_WORLD}-${GAME_BUILD}-${panel.version}-`))
        .toBe(true);
    expect(handed.named.endsWith(".json"), "and it is a JSON file").toBe(true);
});

test("the file is the envelope an intake reads, and carries the whole fight", async ({ panel }) => {
    const handed = await readHandedOver(panel);
    for (const field of ENVELOPE) {
        expect(field in handed.read, `the file states its ${field}`).toBe(true);
    }
    expect(handed.read.world, "the world it was taken in").toBe(PAGE_WORLD);
    expect(handed.read.addOnVersion, "and the build that took it").toBe(panel.version);
    const carried = handed.read.calls;
    expect(Array.isArray(carried), "it carries the calls the game delivered").toBe(true);
    expect((carried as unknown[]).length, "and there are some of them").toBeGreaterThan(0);
    // The field's presence is `ENVELOPE`'s to hold, and this says it carries something: without
    // both, a build that stopped writing the report at all still passes here.
    expect(handed.read.report, "with the figures the panel drew beside them").not.toBeNull();

    const kept = await panel.saved();
    expect(kept, "and the text the browser took is the text the page built").toBe(
        JSON.stringify(handed.read, null, 2),
    );
});

test.describe("before any fight has happened", () => {
    test.use({ fedThrough: "none" });

    test("the bar carries no control to hand a fight over with", async ({ panel }) => {
        await expect(panel.host, "the panel is up").toHaveCount(1);
        await expect(panel.at("[data-shelf]"), "and the bar has its other controls").toHaveCount(1);
        // Not disabled and not inert: absent. A control that does nothing is worse than one that
        // is not there (`DESIGN.md`), and this one handed over an empty envelope (ADR 0053).
        await expect(panel.at("[data-save]"), "but nothing to save with").toHaveCount(0);
        await panel.expectHonest("a panel that has read no fight");
    });
});

test.describe("a fight the panel read back off its own shelf", () => {
    test("is what the file carries, and it says what it could not read", async ({ panel }) => {
        // The fight ends, the reader comes back to a page no fight has started on, and the panel
        // stands on what it kept — which is when a press used to hand over nothing (ADR 0053).
        await panel.reloadWithNoFightFed();
        await expect(panel.at(".list .row").first(), "drawing the fight it kept").toBeVisible();

        const handed = await readHandedOver(panel);
        for (const field of ENVELOPE) {
            expect(field in handed.read, `the file states its ${field}`).toBe(true);
        }
        const calls = handed.read.calls;
        expect(Array.isArray(calls), "it carries the calls the shelf kept").toBe(true);
        expect((calls as unknown[]).length, "and there are some of them").toBeGreaterThan(0);
        expect(handed.read.report, "with the figures the panel drew beside them").not.toBeNull();
        const first = (calls as Record<string, unknown>[])[0];
        expect(first?.combatantsBefore, "a snapshot the shelf never kept is absent").toBeNull();
        expect(first?.combatantsAfter, "on either side of the call").toBeNull();
        expect(handed.read.droppedCalls, "and what nobody counted is not counted as none")
            .toBeNull();
    });
});
