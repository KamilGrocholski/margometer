/**
 * A level open while the fight goes on, which is the state the panel exists for and the one no
 * other spec drives: `panel-states.spec.ts` feeds payloads from the ranking, `panel-crawl.spec.ts`
 * walks the levels with nothing arriving, and `panel-scroll.spec.ts` puts the two together only
 * for the place a reader scrolled to.
 *
 * A redraw of the same place keeps the region a reader is scrolling (**ADR 0052**), so what the
 * level asks for has to reach that region rather than the replacement it never gets.
 */

import { expect, type PanelHandle, test } from "@/tests/e2e/panel-fixture.ts";

/** A group fight, so an opened row has several cuts to grow. */
const GROWING = "captures/2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0.json";
/** Early in its 111 calls: a roster and some figures, with most of the fight still to come. */
const FED_THROUGH = 12;
/** Payloads per step, and more steps than this recording needs at that rate. */
const AT_A_TIME = 10;
const STEPS_MOST = 100;

test.use({ recording: GROWING, fedThrough: FED_THROUGH });

/** The region as the browser reports it: what it draws, and how many rows it says it stands. */
async function readLevel(panel: PanelHandle) {
    return await panel.page.evaluate(() => {
        const root = document.querySelector("#MargoMeter-Panel")?.shadowRoot ?? null;
        const list = root?.querySelector(".list") ?? null;
        if (list === null) return { drawn: -1, promised: -1, shown: 0, height: 0 };
        const stated = getComputedStyle(list).getPropertyValue("--MargoMeter-rows");
        return {
            drawn: list.children.length,
            promised: Number(stated),
            shown: list.clientHeight,
            height: list.scrollHeight,
        };
    });
}

test("a level open while payloads land grows with the fight under it", async ({ panel }) => {
    await panel.at(".list .row.drillable").first().click();
    await expect(panel.at(".crumb-here"), "a level stands over the screen").toHaveCount(1);
    const opened = await panel.at(".crumb-here").innerText();
    const before = await readLevel(panel);
    expect(before.drawn, "and it draws something").toBeGreaterThan(0);
    expect(before.promised, "a region promises at least what it draws").toBeGreaterThanOrEqual(
        before.drawn,
    );

    // A count of steps rather than a wait, so the loop is bounded by arithmetic (**S2**).
    let left = await panel.remaining();
    for (let step = 0; step < STEPS_MOST; step += 1) {
        if (left === 0) break;
        await panel.feed(AT_A_TIME);
        left = await panel.remaining();
    }
    expect(left, "the rest of the fight was delivered").toBe(0);

    await expect(panel.at(".crumb-here"), "the reader is still on the level they opened")
        .toHaveText(opened);
    const after = await readLevel(panel);
    expect(after.drawn, "which the fight has grown").toBeGreaterThan(before.drawn);
    expect(
        after.promised,
        "and the region grew with it rather than staying the height it was first drawn at",
    ).toBeGreaterThanOrEqual(after.drawn);
    await panel.expectHonest("a level open through the rest of a fight");
});
