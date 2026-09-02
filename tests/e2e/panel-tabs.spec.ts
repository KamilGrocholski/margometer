/**
 * Every tab the panel offers, pressed: the two nouns, the two directions, the three audiences and
 * the three places a shelf can be kept.
 */

import { expect, test } from "@/tests/e2e/panel-fixture.ts";

/** Two nouns and two directions, and the panel's own arithmetic says there are four of them. */
const TABS_ON_A_FIGHT = 4;
/** One mark per strip, and there are two strips of screens: the nouns and the directions. */
const MARKS_ON_THE_SCREENS = 2;
/** Everyone, the reader's side, the other one. */
const SIDES_ON_A_FIGHT = 3;
/** On the shelf: kept for good, kept until the tab closes, kept only for now. */
const PLACES_TO_KEEP = 3;
/** The one key the choice is written under, named as `src/userscript-entry.ts` names it. */
const STORAGE_KEY = "MargoMeter-storage";

test("every noun and direction is a tab, and pressing one moves the mark", async ({ panel }) => {
    const tabs = panel.at("[data-screen]");
    await expect(tabs, "the strips carry four between them").toHaveCount(TABS_ON_A_FIGHT);
    await expect(panel.at("[data-screen].selected"), "each strip marks where it stands")
        .toHaveCount(MARKS_ON_THE_SCREENS);

    const drawn: string[] = [];
    for (let at = 0; at < TABS_ON_A_FIGHT; at += 1) {
        // Re-read every round: pressing a noun rewrites what the direction tabs are tabs for.
        const name = await panel.at("[data-screen]").nth(at).getAttribute("data-screen");
        expect(name, "a tab says which screen it opens").not.toBeNull();
        await panel.at("[data-screen]").nth(at).click();
        // The tab itself and not a lookup by name: a noun and a direction can both be tabs for
        // the same screen, so `[data-screen="…"]` finds two and neither is "the one pressed".
        await expect(panel.at("[data-screen]").nth(at), `${name} is where it stands now`)
            .toHaveClass("tab selected");
        await expect(panel.at("[data-screen].selected"), "and neither strip lost its mark")
            .toHaveCount(MARKS_ON_THE_SCREENS);
        drawn.push(await panel.said());
        await panel.expectHonest(`the ${name} screen`);
    }
    expect(drawn.length, "all four were pressed").toBe(TABS_ON_A_FIGHT);
    // Not four distinct: a noun and a direction can be tabs for the same screen, and pressing
    // where the panel already stands redraws the same figures. What is held is that the strips
    // lead somewhere, rather than one screen wearing four labels.
    expect(new Set(drawn).size, "and they are not one screen four times").toBeGreaterThan(1);
});

test("the audiences are three, and each draws a ranking of its own", async ({ panel }) => {
    const sides = panel.at("[data-side]");
    await expect(sides, "the reader's side was named, so the strip is drawn").toHaveCount(
        SIDES_ON_A_FIGHT,
    );
    const drawn: string[] = [];
    for (let at = 0; at < SIDES_ON_A_FIGHT; at += 1) {
        await sides.nth(at).click();
        await expect(panel.at("[data-side].selected"), "one audience is marked").toHaveCount(1);
        drawn.push(await panel.said());
        await panel.expectHonest(`the audience at ${at}`);
    }
    expect(new Set(drawn).size, "and the three of them are not one screen three times")
        .toBeGreaterThan(1);
});

test("the strip that says where a shelf is kept belongs to the shelf", async ({ panel }) => {
    await expect(panel.at("[data-storage]"), "no such strip over a ranking").toHaveCount(0);
    await panel.at("[data-shelf]").click();
    await expect(panel.at("[data-storage]"), "local, session and memory, and nothing else")
        .toHaveCount(PLACES_TO_KEEP);
    await expect(panel.at("[data-screen].selected"), "and no screen is marked while it is up")
        .toHaveCount(0);

    expect(await panel.stored(STORAGE_KEY), "the reader has chosen nothing yet").toBeNull();
    await expect(panel.at("[data-storage].selected"), "and the panel stands on its default")
        .toHaveCount(1);
    // Never starting at the first: the panel already stands on it, and pressing where a reader
    // already is asks the store for nothing — so the round would prove the write by not making it.
    for (const at of [1, 2, 0]) {
        const choice = panel.at("[data-storage]").nth(at);
        const named = await choice.getAttribute("data-storage");
        await choice.click();
        expect(await panel.stored(STORAGE_KEY), `${named} was written down`).toBe(named);
        await expect(panel.at("[data-fight]"), "and the live fight is on every shelf")
            .not.toHaveCount(0);
        await panel.expectHonest(`the shelf kept in ${named}`);
    }

    await panel.at("[data-shelf]").click();
    await expect(panel.at("[data-storage]"), "the strip leaves with the shelf").toHaveCount(0);
});
