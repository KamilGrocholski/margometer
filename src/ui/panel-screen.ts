/**
 * Which screen the panel is on, and the strip that says so.
 *
 * A screen is one of the figures the statistics state, and the panel never invents one: the list
 * below is the list a reading can be composed for. Which one is current is marked by more than
 * colour, because colour never carries meaning on its own.
 */

import { assert } from "@std/assert";
import type { PanelMetric } from "@/src/ui/panel-reading.ts";
import { PANEL_WORDS } from "@/src/ui/panel-words.ts";

/** In the order the strip draws them, which is the order a reader reaches for them. */
export const SCREEN_ORDER: readonly PanelMetric[] = [
    "damageDealtApplied",
    "damageTakenApplied",
    "damagePrevented",
    "healthRestored",
];

const SCREEN_WORDS: Record<PanelMetric, string> = {
    damageDealtApplied: PANEL_WORDS.damageDealt,
    damageTakenApplied: PANEL_WORDS.damageTaken,
    damagePrevented: PANEL_WORDS.prevented,
    healthRestored: PANEL_WORDS.healthRestored,
};

/** The strip's own tab for the fights already fought, which is not a figure and not a metric. */
export const SHELF_SCREEN = "fights";

export interface ScreenState {
    current: PanelMetric;
    /** Whether the shelf is showing. Pressing its tab goes back to the figures, as v1's did. */
    isOnShelf: boolean;
    /**
     * Whose row is open, or nobody. A cut belongs to the screen it was opened on, so leaving that
     * screen closes it: the same combatant on another screen is another figure entirely.
     */
    openRowId: number | null;
}

/** The screen a fight opens on: what the reader did, which is what they came to see. */
export function composeScreenState(): ScreenState {
    const state: ScreenState = { current: "damageDealtApplied", isOnShelf: false, openRowId: null };
    assert(SCREEN_ORDER.includes(state.current), "a panel opens on a screen it can draw");
    assert(state.openRowId === null, "and with every row closed");
    return state;
}

/** Null for a name no screen answers to, so a stray attribute never moves the panel. */
export function getScreenFromName(name: string): PanelMetric | null {
    for (const screen of SCREEN_ORDER) {
        if (screen === name) return screen;
    }
    assert(name.length >= 0, "a name that was asked for is text");
    return null;
}

export function getWordsForScreen(screen: PanelMetric): string {
    assert(screen.length > 0, "a screen is asked for by name");
    const words = SCREEN_WORDS[screen];
    assert(words.length > 0, "a screen a reader can reach is a screen with a name");
    assert(SCREEN_ORDER.includes(screen), "and one the strip draws");
    return words;
}
