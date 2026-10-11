/**
 * A level open while the fight goes on, which is the state the panel exists for and the one no
 * other spec drives: `panel-states.spec.ts` feeds payloads from the ranking, `panel-crawl.spec.ts`
 * walks the levels with nothing arriving, and `panel-scroll.spec.ts` puts the two together only
 * for the place a reader scrolled to.
 *
 * A redraw of the same place keeps the region a reader is scrolling (`develop ADR 0052`), so what the
 * level asks for has to reach that region rather than the replacement it never gets.
 */

import { expect, type PanelHandle, test } from "./panel-fixture.ts";
import { waitForFrame } from "./panel-page.ts";
import { readCentreOf } from "./panel-probe.ts";

/** A group fight, so an opened row has several cuts to grow. */
const GROWING = "captures/2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0.json";
/** Early in its 111 calls: a roster and some figures, with most of the fight still to come. */
const FED_THROUGH = 12;
/** Payloads per step, and more steps than this recording needs at that rate. */
const AT_A_TIME = 10;
const STEPS_MOST = 100;
/** Rows pressed in turn before the recording is taken to reorder none of them. */
const ROWS_TRIED_MOST = 6;

test.use({ recording: GROWING, fedThrough: FED_THROUGH });

/**
 * A payload landing between the press and the release, which is what a fight being read is: the
 * row pressed is gone by the release, and the browser's own click with it (ADR 0052).
 */
test("a row opens though a payload drew it again between the press and the release", async ({ panel }) => {
    const pressedNode = await panel.at("[data-row]").first().elementHandle();
    const over = await readCentreOf(panel.page, "[data-row]");
    await panel.page.mouse.move(over.x, over.y);
    await panel.page.mouse.down();
    expect(await panel.remaining(), "the fight has more to deliver").toBeGreaterThan(0);
    await panel.feed(1);
    await waitForFrame(panel.page);
    expect(
        await pressedNode?.evaluate((drawn) => drawn.isConnected),
        "the row pressed was drawn again under the hand",
    ).toBe(false);
    await panel.page.mouse.up();

    await expect(panel.at(".crumb-here"), "and letting go over it opened it").toHaveCount(1);
    await panel.expectHonest("a row released after a payload");
});

/**
 * The ranking reordering under a hand held still, which is what a fight does to the rows a reader
 * aims at: the release lands on somebody else's row, and the press is what the reader meant.
 */
test("a row pressed opens though the ranking moved another under the still hand", async ({ panel }) => {
    const ROW = ".list .row.drillable";
    let pressedIndex = -1;
    let over = { x: 0, y: 0 };
    let pressedId: string | null = null;
    let underHand: string | null = null;
    // Each row in turn, the fight going on, until one is overtaken under the hand.
    for (let index = 0; index < ROWS_TRIED_MOST; index += 1) {
        if ((await panel.at(ROW).count()) <= index) break;
        over = await readCentreOf(panel.page, ROW, index);
        pressedId = await readRowIdAt(panel, over);
        await panel.page.mouse.move(over.x, over.y);
        await panel.page.mouse.down();
        underHand = pressedId;
        for (let fed = 0; fed < STEPS_MOST; fed += 1) {
            if (underHand !== pressedId) break;
            if ((await panel.remaining()) === 0) break;
            await panel.feed(1);
            await waitForFrame(panel.page);
            underHand = await readRowIdAt(panel, over);
        }
        if (underHand !== pressedId) {
            pressedIndex = index;
            break;
        }
        // Let go off the panel, so the press opens nothing and the next row starts clean.
        await panel.page.mouse.move(1, 1, { steps: 4 });
        await panel.page.mouse.up();
    }
    expect(pressedIndex, "the fight moves some row from under a hand held still").not.toBe(-1);
    expect(pressedId, "the row pressed said who it was").not.toBeNull();
    const pressedName = await panel.at(`${ROW}[data-row="${pressedId}"] .row-name`).first()
        .innerText();
    await panel.page.mouse.up();

    await expect(panel.at(".crumb-here"), "letting go opened a level").toHaveCount(1);
    expect(await panel.at(".crumb-here").innerText(), "and it is the row pressed").toContain(
        pressedName,
    );
    await panel.expectHonest("a row released after the ranking moved under it");
});

/** Who stands under a point of the page, read off the row's mark. */
async function readRowIdAt(
    panel: PanelHandle,
    point: { x: number; y: number },
): Promise<string | null> {
    return await panel.host.evaluate((host, pointed) => {
        const hit = host.shadowRoot?.elementFromPoint(pointed.x, pointed.y) ?? null;
        return hit?.closest("[data-row]")?.getAttribute("data-row") ?? null;
    }, point);
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

/** The region as the browser reports it: what it draws, and how many rows it says it stands. */
async function readLevel(panel: PanelHandle) {
    await waitForFrame(panel.page);
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
