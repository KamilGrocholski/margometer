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
const ENVELOPE = ["formatVersion", "addOnVersion", "capturedAt", "world", "gameBuild", "calls"];

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
    expect(handed.read.report, "with the figures the panel drew beside them").not.toBeNull();

    const kept = await panel.saved();
    expect(kept, "and the text the browser took is the text the page built").toBe(
        JSON.stringify(handed.read, null, 2),
    );
});

test.describe("before any fight has happened", () => {
    test.use({ fedThrough: "none" });

    test("the file still says what it is, and says there is nothing in it", async ({ panel }) => {
        const handed = await readHandedOver(panel);
        for (const field of ENVELOPE) {
            expect(field in handed.read, `the file states its ${field}`).toBe(true);
        }
        expect(handed.read.report, "nothing was counted, and it says so").toBeNull();
        expect(handed.read.calls, "and nothing was delivered to count").toEqual([]);
    });
});
