/**
 * The screens a panel can be on, and the three strips that say which one it is.
 *
 * A screen is a figure the statistics state, so the list here is held against what a reading can
 * actually be composed for rather than against itself. The strips are held against the screens:
 * a strip that reaches nothing and a screen no strip reaches are the same defect from either end.
 */

import { assert, assertArrayIncludes, assertEquals, assertStrictEquals } from "@std/assert";
import { indexCombatantRoster } from "#/src/core/combatant-roster.ts";
import { tallyFightStatistics } from "#/src/core/fight-statistics.ts";
import { isOneOf } from "#/libs/vocabulary.ts";
import { NOTHING_SUSPECT, presentScreen, UNNAMED_END } from "#/src/ui/panel-content.ts";
import {
    composeListName,
    createScreenState,
    getWordsForMetric,
    OPENED_PART,
    PANEL_METRIC,
    presentDirectionStrips,
    presentNounStrips,
    presentSideStrips,
    SCREEN_ORDER,
    SIDE_CHOICE,
    SIDE_CHOICES,
} from "#/src/ui/panel-screen.ts";

/** A fight of its own, so a name never comes back as the live one's by accident. */
const FIGHT = 1786514810315;

Deno.test("every screen names a figure a reading can be composed for", () => {
    const statistics = tallyFightStatistics([], new Map());
    const roster = indexCombatantRoster([]);
    for (const screen of SCREEN_ORDER) {
        const reading = presentScreen(
            statistics,
            roster,
            screen,
            SIDE_CHOICE.everyone,
            null,
            NOTHING_SUSPECT,
        );
        assertStrictEquals(
            reading.total,
            0,
            `${screen} composes, and an empty fight totals nothing`,
        );
    }
    assert(SCREEN_ORDER.length > 1, "there is more than one screen to reach for");
});

Deno.test("every screen has words of its own, and no two share them", () => {
    const said = SCREEN_ORDER.map((screen) => getWordsForMetric(screen));
    for (const words of said) assert(words.length > 0, "a screen a reader can reach is named");
    assertStrictEquals(new Set(said).size, said.length, "and two screens never say the same thing");
});

Deno.test("a name no screen answers to moves nothing", () => {
    assert(isOneOf(SCREEN_ORDER, "damageDealt"), "a screen is read");
    assert(isOneOf(SCREEN_ORDER, "healthRestored"), "and so is another");
    assert(!isOneOf(SCREEN_ORDER, "whatever"), "a stray name is nobody's screen");
    assert(!isOneOf(SCREEN_ORDER, ""), "and neither is nothing at all");
});

Deno.test("a panel opens on a screen it can draw, folded as the reader last left it", () => {
    const state = createScreenState(false);
    assertArrayIncludes(SCREEN_ORDER, [state.metric], "the opening screen is one of them");
    assertStrictEquals(state.metric, PANEL_METRIC.damageDealt, "and it is what the reader did");
    assertStrictEquals(
        state.side,
        SIDE_CHOICE.everyone,
        "and lists everybody before a reader narrows it",
    );
    assertStrictEquals(
        state.isMeterCollapsed,
        false,
        "and a reader who folded nothing away opens unfolded",
    );
    assertStrictEquals(
        createScreenState(true).isMeterCollapsed,
        true,
        "while one who did opens folded",
    );
});

Deno.test("a name no side answers to moves nothing either", () => {
    assert(isOneOf(SIDE_CHOICES, "reader"), "a choice is read");
    assert(isOneOf(SIDE_CHOICES, "opposing"), "and so is another");
    assert(!isOneOf(SIDE_CHOICES, "damageDealt"), "a screen is not a side");
    assert(!isOneOf(SIDE_CHOICES, ""), "and neither is nothing at all");
});

Deno.test("every screen is reachable through the two rows, and every strip reaches one", () => {
    const reached = new Set<string>();
    for (const screen of SCREEN_ORDER) {
        for (const strip of [...presentNounStrips(screen), ...presentDirectionStrips(screen)]) {
            assert(isOneOf(SCREEN_ORDER, strip.name), `${strip.name} is a screen that exists`);
            reached.add(strip.name);
        }
    }
    assertStrictEquals(reached.size, SCREEN_ORDER.length, "and no screen is left with no way in");
});

Deno.test("one strip is marked on each row, and it is the screen the panel is on", () => {
    for (const screen of SCREEN_ORDER) {
        const nouns = presentNounStrips(screen);
        const directions = presentDirectionStrips(screen);
        assertStrictEquals(
            nouns.filter((strip) => strip.isCurrent).length,
            1,
            "one noun is marked",
        );
        assertStrictEquals(
            directions.filter((strip) => strip.isCurrent).length,
            1,
            "and one direction",
        );
        const marked = directions.find((strip) => strip.isCurrent);
        assertStrictEquals(marked?.name, screen, "and the marked direction is the screen itself");
    }
});

/**
 * The whole reason the two axes are named apart: healing given had nowhere to go while healing
 * was a noun with no direction. Crossing the nouns keeps the direction the reader is reading in.
 */
Deno.test("crossing between the nouns keeps the direction, or says there is none to keep", () => {
    const fromDealt = presentNounStrips(PANEL_METRIC.damageDealt).find((strip) => !strip.isCurrent);
    assertStrictEquals(
        fromDealt?.name,
        PANEL_METRIC.healthGiven,
        "damage given crosses to healing given",
    );
    const fromTaken = presentNounStrips(PANEL_METRIC.damageTaken).find((strip) => !strip.isCurrent);
    assertStrictEquals(
        fromTaken?.name,
        PANEL_METRIC.healthRestored,
        "and damage taken to healing received",
    );
    const back = presentNounStrips(PANEL_METRIC.healthGiven).find((strip) => !strip.isCurrent);
    assertStrictEquals(
        back?.name,
        PANEL_METRIC.damageDealt,
        "and the crossing goes back the way it came",
    );
});

Deno.test("the direction strip draws the noun's own screens and nobody else's", () => {
    const damage = presentDirectionStrips(PANEL_METRIC.damageDealt).map((strip) => strip.name);
    assertEquals(
        damage,
        [PANEL_METRIC.damageDealt, PANEL_METRIC.damageTaken],
        "damage both ways round",
    );
    const healing = presentDirectionStrips(PANEL_METRIC.healthRestored).map((strip) => strip.name);
    assertEquals(
        healing,
        [PANEL_METRIC.healthGiven, PANEL_METRIC.healthRestored],
        "and healing two",
    );
    for (const name of healing) assert(!damage.includes(name), "and no screen is on both strips");
});

Deno.test("the side strip offers every choice there is, one of them marked", () => {
    for (const choice of SIDE_CHOICES) {
        const strips = presentSideStrips(choice);
        assertStrictEquals(strips.length, SIDE_CHOICES.length, "every choice is on the strip");
        assertStrictEquals(
            strips.filter((strip) => strip.isCurrent).length,
            1,
            "and one of them is marked",
        );
        assertStrictEquals(
            strips.find((strip) => strip.isCurrent)?.name,
            choice,
            "the one that was chosen",
        );
    }
    assertStrictEquals(
        new Set(presentSideStrips(SIDE_CHOICE.everyone).map((strip) => strip.words)).size,
        3,
        "worded apart",
    );
});

Deno.test("a place a reader stands in is named, and every field of it counts", () => {
    const screen = createScreenState(false);
    const placeName = composeListName(screen, FIGHT);
    assertStrictEquals(
        composeListName(screen, FIGHT),
        placeName,
        "the same place twice is the same name",
    );
    const moved: string[] = [];
    for (
        const change of [
            () => screen.metric = PANEL_METRIC.healthRestored,
            () => screen.side = SIDE_CHOICE.reader,
            () => screen.openedCombatantId = 469657,
            () => screen.pairCombatantId = 469658,
            () => screen.openPart = { kind: OPENED_PART.skill, name: "Cios" },
        ]
    ) {
        change();
        const name = composeListName(screen, FIGHT);
        assert(!moved.includes(name), `${name}: a field moved alone is a place of its own`);
        moved.push(name);
    }
    assert(!moved.includes(placeName), "and none of them is the place they started from");
    assertStrictEquals(moved.length, 5, "five fields, five places");
});

Deno.test("a part names its own kind, so two of them never share a place", () => {
    const screen = createScreenState(false);
    screen.openPart = { kind: OPENED_PART.skill, name: "Cios" };
    const skill = composeListName(screen, FIGHT);
    screen.openPart = { kind: OPENED_PART.source, source: "Cios" };
    const source = composeListName(screen, FIGHT);
    screen.openPart = { kind: OPENED_PART.element, element: "Cios" };
    assert(skill !== source, "a skill and a key of the same word are two places");
    assert(composeListName(screen, FIGHT) !== source, "and so are a key and a kind");
});

Deno.test("the ends the protocol leaves out are places of their own", () => {
    const screen = createScreenState(false);
    const ranking = composeListName(screen, FIGHT);
    screen.openUnnamedEnd = UNNAMED_END.actor;
    const actor = composeListName(screen, FIGHT);
    screen.openUnnamedEnd = UNNAMED_END.target;
    assert(actor !== ranking, "an end opened is not the ranking it was opened from");
    assert(composeListName(screen, FIGHT) !== actor, "and one end is not the other");
});

Deno.test("the shelf is a place of its own, whatever screen stands under it", () => {
    const screen = createScreenState(false);
    screen.isOnShelf = true;
    const shelf = composeListName(screen, FIGHT);
    screen.metric = PANEL_METRIC.healthGiven;
    screen.side = SIDE_CHOICE.opposing;
    screen.openedCombatantId = 469657;
    assertStrictEquals(
        composeListName(screen, FIGHT),
        shelf,
        "the shelf covers the screens it is over",
    );
    screen.isOnShelf = false;
    assert(composeListName(screen, FIGHT) !== shelf, "and the screen under it is somewhere else");
});

Deno.test("the options are a place of their own, and not the shelf's", () => {
    const screen = createScreenState(false);
    screen.isOnShelf = true;
    const shelf = composeListName(screen, FIGHT);
    screen.isOnShelf = false;
    screen.isOnOptions = true;
    const options = composeListName(screen, FIGHT);
    assert(options !== shelf, "two covers, two places");
    screen.metric = PANEL_METRIC.healthGiven;
    screen.openedCombatantId = 469657;
    assertStrictEquals(
        composeListName(screen, FIGHT),
        options,
        "whatever screen stands under them",
    );
});

Deno.test("a fight is part of the place, so a new one is nobody's position", () => {
    const screen = createScreenState(false);
    const placeName = composeListName(screen, FIGHT);
    assert(composeListName(screen, FIGHT + 1) !== placeName, "another fight is another place");
    assertStrictEquals(
        composeListName(screen, FIGHT),
        placeName,
        "and the fight itself is where it was",
    );
});
