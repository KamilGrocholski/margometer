/**
 * The shelf of fights the panel keeps: what is on it, which one is being read, what a pin holds,
 * and the three places a reader can ask for it to be kept.
 */

import { expect, type PanelHandle, test } from "@/tests/e2e/panel-fixture.ts";

/** The keys the shelf and the choice are written under, as `src/userscript-entry.ts` names them. */
const SHELF_KEY = "MargoMeter-fights";
const STORAGE_KEY = "MargoMeter-storage";
/** What the row of the fight going on right now states, rather than a time it opened at. */
const LIVE = "live";
/**
 * A recording that ends the fights it carries. Most do not — a capture is stopped by hand — and a
 * shelf needs a fight that reached `endBattle`, which is where one is kept. Measured over
 * `captures/` on 2026-09-02: this one carries three.
 */
const ENDING = "captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json";

test.use({ recording: ENDING });

/**
 * Two fights on one shelf. A recording holds one fight, so the second is the same page opened
 * again: the fight that ended is in the browser's store, and the reload starts a new live one.
 */
async function setSecondFightKept(panel: PanelHandle): Promise<void> {
    expect(await panel.stored(SHELF_KEY), "the first fight reached its end").not.toBeNull();
    await panel.page.reload();
    await expect(panel.host, "and the page came back up on a fight of its own").toHaveCount(1);
}

test("the shelf carries the fight being read, and the one that ended", async ({ panel }) => {
    await panel.at("[data-shelf]").click();
    await expect(panel.at(".list .row"), "the shelf draws rows").not.toHaveCount(0);
    await expect(panel.at(`.row[data-fight="${LIVE}"]`), "the fight going on is one of them")
        .toHaveCount(1);
    expect(await panel.stored(SHELF_KEY), "and it was written down when it ended").not.toBeNull();
    await panel.expectHonest("a shelf carrying one fight");

    await setSecondFightKept(panel);

    await panel.at("[data-shelf]").click();
    await expect(panel.at(".list .row[data-fight]"), "the one that ended stayed for the next")
        .toHaveCount(2);
    await panel.expectHonest("a shelf carrying two");
});

test("pressing a row reads that fight, and pressing the live one comes back", async ({ panel }) => {
    await setSecondFightKept(panel);
    await panel.at("[data-shelf]").click();
    const rows = panel.at(".list .row[data-fight]");
    const first = await rows.first().getAttribute("data-fight");
    const second = await rows.nth(1).getAttribute("data-fight");
    expect(first, "the rows say which fight each is").not.toBeNull();
    expect(second, "and they are not the same fight twice").not.toBe(first);

    await rows.nth(1).click();
    await expect(panel.at("[data-storage]"), "the shelf steps aside for the fight").toHaveCount(0);
    await expect(panel.at(".list .row"), "and that fight is drawn").not.toHaveCount(0);
    await panel.expectHonest("a fight read off the shelf");

    await panel.at("[data-shelf]").click();
    await expect(panel.at(`.row.chosen[data-fight="${second}"]`), "the shelf marks which is read")
        .toHaveCount(1);
    await panel.at(`.list .row[data-fight="${LIVE}"]`).click();
    await panel.at("[data-shelf]").click();
    await expect(panel.at(`.row.chosen[data-fight="${LIVE}"]`), "and the live row takes it back")
        .toHaveCount(1);
});

test("a pin marks a fight, and the fights travel to wherever they are kept", async ({ panel }) => {
    await panel.at("[data-shelf]").click();
    const pin = panel.at(".row-pin[data-pin]").first();
    await expect(pin, "a kept fight offers a pin").not.toHaveCount(0);
    const before = await pin.innerText();

    await pin.click();

    const after = await panel.at(".row-pin[data-pin]").first().innerText();
    expect(after, "and pressing it changes what the star says").not.toBe(before);
    await expect(panel.at(".list .row[data-fight]"), "the shelf is no shorter for it")
        .not.toHaveCount(0);

    const kept = await panel.at(".list .row[data-fight]").count();
    for (const at of [1, 2, 0]) {
        const choice = panel.at("[data-storage]").nth(at);
        const named = await choice.getAttribute("data-storage");
        await choice.click();
        expect(await panel.stored(STORAGE_KEY), `${named} is where the reader asked`).toBe(named);
        await expect(panel.at(".list .row[data-fight]"), `and the fights came to ${named}`)
            .toHaveCount(kept);
    }
    await panel.expectHonest("a shelf moved between stores");
});

test("what a reader keeps only for now is gone when they come back", async ({ panel }) => {
    await setSecondFightKept(panel);
    await panel.at("[data-shelf]").click();
    await expect(panel.at(".list .row[data-fight]"), "there is a fight to lose").toHaveCount(2);
    await panel.at('[data-storage="memory"]').click();
    expect(await panel.stored(SHELF_KEY), "nothing is left in the browser's own store").toBeNull();

    await panel.page.reload();
    await panel.at("[data-shelf]").click();

    // The page replays the fight again, so the live row is back; what a memory store cannot
    // bring back is the one that ended before the reload.
    await expect(panel.at(".list .row[data-fight]"), "only the fight going on now").toHaveCount(1);
    await expect(panel.at(`.list .row[data-fight="${LIVE}"]`), "and it is the live one")
        .toHaveCount(1);
});
