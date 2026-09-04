/**
 * The screens a panel can be on, and the three strips that say which one it is.
 *
 * A screen is a figure the statistics state, so the list here is held against what a reading can
 * actually be composed for rather than against itself. The strips are held against the screens:
 * a tab that reaches nothing and a screen no tab reaches are the same defect from either end.
 */

import { assert, assertArrayIncludes, assertEquals, assertExists } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { composePanelReading, NOTHING_MISSED } from "@/src/ui/panel-reading.ts";
import {
    composeDirectionTabs,
    composeListName,
    composeNounTabs,
    composeScreenState,
    composeSideTabs,
    getScreenFromName,
    getSideFromName,
    getWordsForScreen,
    SCREEN_ORDER,
    SIDE_CHOICES,
} from "@/src/ui/panel-screen.ts";

Deno.test("every screen names a figure a reading can be composed for", () => {
    const statistics = composeFightStatistics([], new Map());
    const roster = composeCombatantRoster([]);
    for (const screen of SCREEN_ORDER) {
        const reading = composePanelReading(
            statistics,
            roster,
            screen,
            "everyone",
            null,
            NOTHING_MISSED,
        );
        assertEquals(reading.total, 0, `${screen} composes, and an empty fight totals nothing`);
    }
    assert(SCREEN_ORDER.length > 1, "there is more than one screen to reach for");
});

Deno.test("every screen has words of its own, and no two share them", () => {
    const said = SCREEN_ORDER.map((screen) => getWordsForScreen(screen));
    for (const words of said) assert(words.length > 0, "a screen a reader can reach is named");
    assertEquals(new Set(said).size, said.length, "and two screens never say the same thing");
});

Deno.test("a name no screen answers to moves nothing", () => {
    assertEquals(getScreenFromName("damageDealtApplied"), "damageDealtApplied", "a screen is read");
    assertEquals(getScreenFromName("healthRestored"), "healthRestored", "and so is another");
    assertEquals(getScreenFromName("whatever"), null, "a stray name is nobody's screen");
    assertEquals(getScreenFromName(""), null, "and neither is nothing at all");
});

Deno.test("a panel opens on a screen it can draw, folded as the reader last left it", () => {
    const state = composeScreenState(false);
    assertArrayIncludes(SCREEN_ORDER, [state.current], "the opening screen is one of them");
    assertEquals(state.current, "damageDealtApplied", "and it is what the reader did");
    assertEquals(state.side, "everyone", "and lists everybody before a reader narrows it");
    assertEquals(state.isCollapsed, false, "and a reader who folded nothing away opens unfolded");
    assertEquals(composeScreenState(true).isCollapsed, true, "while one who did opens folded");
});

Deno.test("a name no side answers to moves nothing either", () => {
    assertEquals(getSideFromName("reader"), "reader", "a choice is read");
    assertEquals(getSideFromName("opposing"), "opposing", "and so is another");
    assertEquals(getSideFromName("damageDealtApplied"), null, "a screen is not a side");
    assertEquals(getSideFromName(""), null, "and neither is nothing at all");
});

Deno.test("every screen is reachable through the two strips, and every tab reaches one", () => {
    const reached = new Set<string>();
    for (const screen of SCREEN_ORDER) {
        for (const tab of [...composeNounTabs(screen), ...composeDirectionTabs(screen)]) {
            assertExists(getScreenFromName(tab.name), `${tab.name} is a screen that exists`);
            reached.add(tab.name);
        }
    }
    assertEquals(reached.size, SCREEN_ORDER.length, "and no screen is left with no way in");
});

Deno.test("one tab is marked on each strip, and it is the screen the panel is on", () => {
    for (const screen of SCREEN_ORDER) {
        const nouns = composeNounTabs(screen);
        const directions = composeDirectionTabs(screen);
        assertEquals(nouns.filter((one) => one.isCurrent).length, 1, "one noun is marked");
        assertEquals(directions.filter((one) => one.isCurrent).length, 1, "and one direction");
        const marked = directions.find((one) => one.isCurrent);
        assertEquals(marked?.name, screen, "and the marked direction is the screen itself");
    }
});

/**
 * The whole reason the two axes are named apart: healing given had nowhere to go while healing
 * was a noun with no direction. Crossing the nouns keeps the direction the reader is reading in.
 */
Deno.test("crossing between the nouns keeps the direction, or says there is none to keep", () => {
    const fromDealt = composeNounTabs("damageDealtApplied").find((one) => !one.isCurrent);
    assertEquals(fromDealt?.name, "healthGiven", "damage given crosses to healing given");
    const fromTaken = composeNounTabs("damageTakenApplied").find((one) => !one.isCurrent);
    assertEquals(fromTaken?.name, "healthRestored", "and damage taken to healing received");
    const back = composeNounTabs("healthGiven").find((one) => !one.isCurrent);
    assertEquals(back?.name, "damageDealtApplied", "and the crossing goes back the way it came");
});

Deno.test("the direction strip draws the noun's own screens and nobody else's", () => {
    const damage = composeDirectionTabs("damageDealtApplied").map((one) => one.name);
    assertEquals(damage, ["damageDealtApplied", "damageTakenApplied"], "damage both ways round");
    const healing = composeDirectionTabs("healthRestored").map((one) => one.name);
    assertEquals(healing, ["healthGiven", "healthRestored"], "and healing two");
    for (const name of healing) assert(!damage.includes(name), "and no screen is on both strips");
});

Deno.test("the side strip offers every choice there is, one of them marked", () => {
    for (const choice of SIDE_CHOICES) {
        const tabs = composeSideTabs(choice);
        assertEquals(tabs.length, SIDE_CHOICES.length, "every choice is on the strip");
        assertEquals(tabs.filter((one) => one.isCurrent).length, 1, "and one of them is marked");
        assertEquals(tabs.find((one) => one.isCurrent)?.name, choice, "the one that was chosen");
    }
    assertEquals(
        new Set(composeSideTabs("everyone").map((one) => one.words)).size,
        3,
        "worded apart",
    );
});

/** A fight of its own, so a name never comes back as the live one's by accident. */
const FIGHT = 1786514810315;

Deno.test("a place a reader stands in is named, and every field of it counts", () => {
    const screen = composeScreenState(false);
    const first = composeListName(screen, FIGHT);
    assertEquals(composeListName(screen, FIGHT), first, "the same place twice is the same name");
    const moved: string[] = [];
    for (
        const change of [
            () => screen.current = "healthRestored",
            () => screen.side = "reader",
            () => screen.openRowId = 469657,
            () => screen.openPairId = 469658,
            () => screen.openPart = { kind: "skill", name: "Cios" },
        ]
    ) {
        change();
        const name = composeListName(screen, FIGHT);
        assert(!moved.includes(name), `${name}: a field moved alone is a place of its own`);
        moved.push(name);
    }
    assert(!moved.includes(first), "and none of them is the place they started from");
    assertEquals(moved.length, 5, "five fields, five places");
});

Deno.test("a part names its own kind, so two of them never share a place", () => {
    const screen = composeScreenState(false);
    screen.openPart = { kind: "skill", name: "Cios" };
    const skill = composeListName(screen, FIGHT);
    screen.openPart = { kind: "source", source: "Cios" };
    const source = composeListName(screen, FIGHT);
    screen.openPart = { kind: "element", element: "Cios" };
    assert(skill !== source, "a skill and a key of the same word are two places");
    assert(composeListName(screen, FIGHT) !== source, "and so are a key and a kind");
});

Deno.test("the ends the protocol leaves out are places of their own", () => {
    const screen = composeScreenState(false);
    const ranking = composeListName(screen, FIGHT);
    screen.openUnnamedEnd = "actor";
    const actor = composeListName(screen, FIGHT);
    screen.openUnnamedEnd = "target";
    assert(actor !== ranking, "an end opened is not the ranking it was opened from");
    assert(composeListName(screen, FIGHT) !== actor, "and one end is not the other");
});

Deno.test("the shelf is a place of its own, whatever screen stands under it", () => {
    const screen = composeScreenState(false);
    screen.isOnShelf = true;
    const shelf = composeListName(screen, FIGHT);
    screen.current = "healthGiven";
    screen.side = "opposing";
    screen.openRowId = 469657;
    assertEquals(composeListName(screen, FIGHT), shelf, "the shelf covers the screens it is over");
    screen.isOnShelf = false;
    assert(composeListName(screen, FIGHT) !== shelf, "and the screen under it is somewhere else");
});

Deno.test("a fight is part of the place, so a new one is nobody's position", () => {
    const screen = composeScreenState(false);
    const first = composeListName(screen, FIGHT);
    assert(composeListName(screen, FIGHT + 1) !== first, "another fight is another place");
    assertEquals(composeListName(screen, FIGHT), first, "and the fight itself is where it was");
});
