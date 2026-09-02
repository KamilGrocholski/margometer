/**
 * What the panel says before a fight, during one, after it ends, and when the next begins.
 *
 * The sentences are written out here rather than imported: a test that reads a string back from
 * the module that writes it holds the two to be the same and neither to be right
 * (`tests/AGENTS.md`).
 */

import { expect, test } from "@/tests/e2e/panel-fixture.ts";

/** A recording whose fight reaches its end, so there is an outcome to read. */
const ENDING = "captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json";
/**
 * Enough payloads for a roster and some figures, and short of the end. The recording is thinned
 * at intake and carries fifteen calls in all, so a few here is genuinely a few.
 */
const A_FEW = 5;
/** What a reader is told before anything has happened, word for word. */
const NOTHING_YET = "Nie było jeszcze walki.";
/** Payloads per step, and more steps than the longest recording needs at that rate. */
const AT_A_TIME = 10;
const STEPS_MOST = 1000;
/**
 * How a fight can end, in the words a **reader** sees. The panel composes them in lower case and
 * the sheet puts them in upper (`DESIGN.md` owns the look), so this is what is on the screen and
 * `innerText` is what reports it.
 */
const OUTCOMES = ["WYGRANA", "PRZEGRANA", "REMIS"];

test.use({ recording: ENDING });

test.describe("before the game has said anything", () => {
    test.use({ fedThrough: "none" });

    test("the panel stands, and says there has been no fight", async ({ panel }) => {
        await expect(panel.host, "the panel is up before there is anything to draw").toHaveCount(1);
        await expect(panel.at(".list .empty"), "and it says so where the ranking would be")
            .toHaveText(NOTHING_YET);
        await expect(panel.at("[data-screen]"), "with no tabs to press").toHaveCount(0);
        await expect(panel.at(".list .row"), "and no rows").toHaveCount(0);
        await panel.expectHonest("a panel waiting for a fight");
    });
});

test.describe("while the fight is going on", () => {
    test.use({ fedThrough: A_FEW });

    test("the header, the tabs and the ranking are all drawn", async ({ panel }) => {
        await expect(panel.at(".header-line"), "the header says who is against whom")
            .not.toHaveCount(0);
        await expect(panel.at(".header-place"), "and where").not.toHaveCount(0);
        await expect(panel.at("[data-screen]"), "the strips are up").not.toHaveCount(0);
        await expect(panel.at(".list .row"), "and the ranking has somebody on it").not.toHaveCount(
            0,
        );
        await expect(panel.at(".header-outcome"), "nothing has been decided yet").toHaveCount(0);
        await panel.expectHonest("a fight going on");
    });

    test("every payload redraws the panel, and it holds all the way through", async ({ panel }) => {
        // A count of steps rather than a wait on the count reaching zero: the recording states
        // how many calls it has, so the loop is bounded by arithmetic (**S2**).
        let left = await panel.remaining();
        for (let step = 0; step < STEPS_MOST; step += 1) {
            if (left === 0) break;
            await panel.feed(AT_A_TIME);
            left = await panel.remaining();
        }
        expect(left, "the whole fight was delivered inside the stated bound").toBe(0);
        await expect(panel.at(".header-outcome"), "and at the end it says how it went")
            .toHaveCount(1);
        const outcome = await panel.at(".header-outcome").innerText();
        expect(OUTCOMES, `${outcome} is one of the three ways a fight ends`).toContain(outcome);
        await panel.expectHonest("a fight run to its end");
    });
});

test("a fight opening again closes what the reader had open", async ({ panel }) => {
    await panel.at("[data-row]").first().click();
    await expect(panel.at(".crumb-here"), "a row is open").toHaveCount(1);

    await panel.rewind();
    await panel.feed(A_FEW);

    await expect(panel.at(".crumb-here"), "and a new fight puts the reader back on the ranking")
        .toHaveCount(0);
    await expect(panel.at(".list .row"), "with a ranking of its own").not.toHaveCount(0);
    await panel.expectHonest("a second fight opening");
});
