/**
 * The screens a panel can be on, and the strip that says which one it is.
 *
 * A screen is a figure the statistics state, so the list here is held against what a reading can
 * actually be composed for rather than against itself.
 */

import { assert, assertEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { composePanelReading } from "@/src/ui/panel-reading.ts";
import {
    composeScreenState,
    getScreenFromName,
    getWordsForScreen,
    SCREEN_ORDER,
} from "@/src/ui/panel-screen.ts";

Deno.test("every screen names a figure a reading can be composed for", () => {
    const statistics = composeFightStatistics([], new Map());
    const roster = composeCombatantRoster([]);
    for (const screen of SCREEN_ORDER) {
        const reading = composePanelReading(statistics, roster, screen);
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

Deno.test("a panel opens on a screen it can draw", () => {
    const state = composeScreenState();
    assert(SCREEN_ORDER.includes(state.current), "the opening screen is one of them");
    assertEquals(state.current, "damageDealtApplied", "and it is what the reader did");
});
