/**
 * The one region that scrolls, and what scrolling it must not do.
 *
 * The ranking never overflows — it is drawn to the height of the rows it shows — so the region is
 * put past its own height the way a reader does it: by opening a row onto a level with more under
 * it than fits. Measured 2026-09-02 on Chrome 152: 491 px of rows in a 437 px region.
 */

import { expect, type PanelHandle, test } from "@/tests/e2e/panel-fixture.ts";
import { readCentreOf } from "@/tests/e2e/panel-probe.ts";

/** A group fight whose opened row holds more than the region can show. */
const OVERFLOWING = "captures/2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0.json";
/** Short of its 111 calls, so there is a payload left to redraw the panel with. */
const FED_THROUGH = 110;
/** How many rows of the ranking are tried before a level that overflows is given up on. */
const ROWS_TRIED = 6;
/** More than the region can hold, so one turn puts it at the bottom. */
const WHEEL_DOWN = 400;
/** A page taller than the window, so there is something behind the panel that could scroll. */
const PAGE_HEIGHT = 4000;
/** The screen a panel opens on, and the one beside it on the strip that says which way round. */
const HOME_SCREEN = "damageDealtApplied";
const OTHER_SCREEN = "damageTakenApplied";

test.use({ recording: OVERFLOWING, fedThrough: FED_THROUGH });

/** The list, as the browser reports it, and whatever else in the panel could scroll beside it. */
async function readScrollers(panel: PanelHandle) {
    return await panel.page.evaluate(() => {
        const root = document.querySelector("#MargoMeter-Panel")?.shadowRoot ?? null;
        const list = root?.querySelector(".list") ?? null;
        const others: string[] = [];
        for (const one of root?.querySelectorAll("*") ?? []) {
            if (one.className === "list") continue;
            if (one.scrollHeight > one.clientHeight + 1) others.push(one.className);
        }
        return {
            top: list?.scrollTop ?? -1,
            height: list?.scrollHeight ?? 0,
            shown: list?.clientHeight ?? 0,
            bars: list === null ? "" : getComputedStyle(list).scrollbarWidth,
            others,
            behind: globalThis.scrollY,
        };
    });
}

/**
 * A level with more under it than the region shows, and which ranking row opened it. Which row
 * has one moves with the fight, so it is looked for rather than named — a row picked by number
 * would quietly stop overflowing on the next intake and the scroll tests would then measure
 * nothing.
 */
async function setOverflowingLevelOpened(panel: PanelHandle): Promise<number> {
    for (let at = 0; at < ROWS_TRIED; at += 1) {
        await panel.at(".list .row.drillable").nth(at).click();
        const seen = await readScrollers(panel);
        if (seen.height > seen.shown) return at;
        await panel.at("[data-back]").click();
    }
    expect(false, `no row in the first ${ROWS_TRIED} opens onto a level that overflows`).toBe(true);
    return -1;
}

test("the list is the one region that scrolls, and it hides its bar", async ({ panel }) => {
    await setOverflowingLevelOpened(panel);
    const seen = await readScrollers(panel);
    expect(seen.height, "the level that opened is taller than the region").toBeGreaterThan(
        seen.shown,
    );
    expect(seen.others, "and nothing else in the panel overflows its own box").toEqual([]);
    expect(seen.bars, "the bar is taken away; a reader scrolls, not drags").toBe("none");
});

test("a wheel over the list moves it, and the page behind stays where it is", async ({ panel }) => {
    await panel.page.evaluate((height) => {
        const tall = document.createElement("div");
        tall.style.height = `${height}px`;
        tall.style.width = "1px";
        document.body.append(tall);
    }, PAGE_HEIGHT);
    await setOverflowingLevelOpened(panel);
    const before = await readScrollers(panel);
    expect(before.top, "the region starts at the top").toBe(0);
    expect(before.behind, "and so does the page under it").toBe(0);

    const over = await readCentreOf(panel.page, ".list");
    await panel.page.mouse.move(over.x, over.y);
    await panel.page.mouse.wheel(0, WHEEL_DOWN);

    // ⚠️ A wheel turn is not finished when `mouse.wheel` answers: Chrome animates the scroll on
    // its compositor, and a reading taken straight after says the region never moved. Measured on
    // Chrome 152, 2026-09-02. So the region is read until it settles, not once.
    await expect.poll(async () => (await readScrollers(panel)).top, {
        message: "the wheel moved the region as far as it goes",
    }).toBe(before.height - before.shown);

    // `overscroll-behavior: contain`: at the bottom of the region the wheel stops there rather
    // than handing the rest of the turn to the page, which would move the game out from under it.
    await panel.page.mouse.wheel(0, WHEEL_DOWN);
    await expect.poll(async () => (await readScrollers(panel)).behind, {
        message: "the page behind was never handed the rest of the turn",
    }).toBe(0);
    await panel.expectHonest("a region scrolled to its end");
});

test("a heading stays over the rows it names while they go past", async ({ panel }) => {
    await setOverflowingLevelOpened(panel);
    const heading = panel.at(".section-heading").first();
    await expect(heading, "the opened level draws its cuts under headings").toHaveCount(1);
    const before = await heading.boundingBox();

    const over = await readCentreOf(panel.page, ".list");
    await panel.page.mouse.move(over.x, over.y);
    await panel.page.mouse.wheel(0, WHEEL_DOWN);

    await expect.poll(async () => (await readScrollers(panel)).top).toBeGreaterThan(0);
    const after = await heading.boundingBox();
    const list = await panel.at(".list").boundingBox();
    expect((before?.y ?? 0) - (list?.y ?? 0), "it started below the top of the region")
        .toBeGreaterThan(0);
    expect(Math.abs((after?.y ?? 0) - (list?.y ?? 0)), "and scrolling stuck it to that top")
        .toBeLessThanOrEqual(1);
});

/**
 * The turn rather than the position, and the difference is the whole test. Chrome animates a wheel
 * turn on its compositor, so a payload landing inside one used to throw the turn away and write the
 * position from before it back over the region. Under 50ms wide, and the preview plays a payload
 * every 220ms. **ADR 0052.**
 */
test("a payload landing inside a wheel turn does not take the turn away", async ({ panel }) => {
    await setOverflowingLevelOpened(panel);
    const before = await readScrollers(panel);
    expect(before.top, "the region starts at the top").toBe(0);
    expect(await panel.remaining(), "the fight has more to deliver").toBeGreaterThan(0);
    const over = await readCentreOf(panel.page, ".list");
    await panel.page.mouse.move(over.x, over.y);

    // ⚠️ Nothing at all between the turn and the payload, and that is the whole test: every other
    // test here reads the region to a standstill first, which is the one timing that loses nothing,
    // and a single question asked of the page in between is already wider than the window.
    await panel.page.mouse.wheel(0, WHEEL_DOWN);
    await panel.feed(1);

    await expect.poll(async () => (await readScrollers(panel)).top, {
        message: "the turn went as far as the reader aimed it",
    }).toBe(before.height - before.shown);
    await panel.expectHonest("a payload landed inside a wheel turn");
});

test("a payload arriving leaves the region where the reader left it", async ({ panel }) => {
    await setOverflowingLevelOpened(panel);
    const over = await readCentreOf(panel.page, ".list");
    await panel.page.mouse.move(over.x, over.y);
    await panel.page.mouse.wheel(0, WHEEL_DOWN);
    await expect.poll(async () => (await readScrollers(panel)).top, {
        message: "the reader has scrolled down",
    }).toBeGreaterThan(0);
    const left = (await readScrollers(panel)).top;

    expect(await panel.remaining(), "the fight has more to deliver").toBeGreaterThan(0);
    await panel.feed(1);

    expect((await readScrollers(panel)).top, "and the redraw is where they were").toBe(left);
    await panel.expectHonest("a payload landed under a region a reader had scrolled");
});

/**
 * A tab is the other way a reader leaves a level and comes back to it, and it takes a different
 * road through the panel than the crumb: the strips are redrawn, the screen changes and the level
 * is composed again out of the other figure. What is on the strip is `panel-tabs.spec.ts`'s.
 */
test("a screen away and back is where the reader left it", async ({ panel }) => {
    // Two: the noun above and the direction below both stand on the screen a panel opens on,
    // and both are marked. Which tab is which is `panel-tabs.spec.ts`'s subject, not this one's.
    await expect(panel.at(`[data-screen="${HOME_SCREEN}"].selected`), "the panel opens here")
        .toHaveCount(2);
    await setOverflowingLevelOpened(panel);
    const over = await readCentreOf(panel.page, ".list");
    await panel.page.mouse.move(over.x, over.y);
    await panel.page.mouse.wheel(0, WHEEL_DOWN);
    await expect.poll(async () => (await readScrollers(panel)).top, {
        message: "the reader has scrolled down",
    }).toBeGreaterThan(0);
    const left = (await readScrollers(panel)).top;

    // ⚠️ **The way back is the direction tab and never the noun above it.** A noun keeps the
    // direction being read, so from the screen crossed to it leads back to that same screen.
    // Once the panel is there, one tab and only one answers to the screen left behind.
    await panel.at(`[data-screen="${OTHER_SCREEN}"]`).click();
    expect((await readScrollers(panel)).top, "the same row on the next screen is its own place")
        .toBe(0);

    const back = panel.at(`[data-screen="${HOME_SCREEN}"]`);
    await expect(back, "and the way back is one tab, on the strip that says which way round")
        .toHaveCount(1);
    await back.click();
    expect((await readScrollers(panel)).top, "and the screen came back where it was").toBe(left);
    await panel.expectHonest("a reader crossed to the next screen and back");
});

/**
 * The way back and in again, rather than a level opened from inside this one: a press lands
 * wherever Playwright scrolls the row it is pressing into view, so a gesture inside a region that
 * has been scrolled measures the auto-scroll as much as the panel. The crumb stands outside the
 * list and moves nothing, and the ranking it goes back to overflows on no recording here.
 */
test("a level a reader comes back to is where they left it", async ({ panel }) => {
    const at = await setOverflowingLevelOpened(panel);
    expect((await readScrollers(panel)).top, "a level just opened starts at its top").toBe(0);
    const over = await readCentreOf(panel.page, ".list");
    await panel.page.mouse.move(over.x, over.y);
    await panel.page.mouse.wheel(0, WHEEL_DOWN);
    await expect.poll(async () => (await readScrollers(panel)).top, {
        message: "the reader has scrolled down",
    }).toBeGreaterThan(0);
    const left = (await readScrollers(panel)).top;

    await panel.at("[data-back]").click();
    expect((await readScrollers(panel)).top, "the ranking under it was never scrolled").toBe(0);

    await panel.at(".list .row.drillable").nth(at).click();
    expect((await readScrollers(panel)).top, "and the level opened again is where it was")
        .toBe(left);
    await panel.expectHonest("a reader went back into a level they had scrolled");
});
