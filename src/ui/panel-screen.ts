/**
 * Which screen the panel is on, and the three strips that say so.
 *
 * A screen sits on two axes: which quantity, and which way round. Naming them apart is what gives
 * healing a giving side — one noun with no direction is what left it nowhere to go. The pair is
 * derived and the metric stays the one field the state holds, so a pair with no figure behind it
 * cannot be expressed at all and the compiler counts the rows.
 *
 * A third strip picks whose rows are listed. It is drawn only where the client said which side is
 * the reader's own, because the protocol never does.
 */

import { assert } from "@std/assert";
import type { PanelMetric } from "@/src/ui/panel-reading.ts";
import {
    getWordsForDirection,
    getWordsForNoun,
    getWordsForSide,
    PANEL_WORDS,
} from "@/src/ui/panel-words.ts";

/** In the order the strips draw them, which is the order a reader reaches for them. */
export const SCREEN_ORDER: readonly PanelMetric[] = [
    "damageDealtApplied",
    "damageTakenApplied",
    "healthGiven",
    "healthRestored",
];

const PANEL_NOUNS = ["damage", "healing"] as const;
export type PanelNoun = (typeof PANEL_NOUNS)[number];

const PANEL_DIRECTIONS = ["given", "received"] as const;
export type PanelDirection = (typeof PANEL_DIRECTIONS)[number];

/**
 * The whole vocabulary of screens. A pair this table has no row for is a screen that does not
 * exist — healing has no prevented half, and nothing can ask the panel for one.
 */
const SCREEN_AXES: Record<PanelMetric, { noun: PanelNoun; direction: PanelDirection }> = {
    damageDealtApplied: { noun: "damage", direction: "given" },
    damageTakenApplied: { noun: "damage", direction: "received" },
    healthGiven: { noun: "healing", direction: "given" },
    healthRestored: { noun: "healing", direction: "received" },
};

/**
 * Where the shelf is kept: as long as the browser will hold it, until the tab closes, or only
 * while this page is up. The reader's own answer, and the panel's only question about storage.
 */
export const STORAGE_CHOICES = ["local", "session", "memory"] as const;
export type PanelStorageChoice = (typeof STORAGE_CHOICES)[number];

/** Null for a name no choice answers to, so a stray attribute never moves the shelf. */
export function getStorageFromName(name: string): PanelStorageChoice | null {
    for (const choice of STORAGE_CHOICES) {
        if (choice === name) return choice;
    }
    assert(name.length >= 0, "a name that was asked for is text");
    return null;
}

/**
 * Whose rows are listed. Never one of the game's own sides, which are bare numbers: what a reader
 * picks is a relation to their own side, and which number that is belongs to one fight.
 */
export const SIDE_CHOICES = ["everyone", "reader", "opposing"] as const;
export type PanelSideChoice = (typeof SIDE_CHOICES)[number];

/**
 * What the other end of a blow is called on each screen, and null where a screen states no other
 * end at all — a defence stopping a blow and health moving are cut by nothing here.
 */
const OPPONENT_WORDS: Record<PanelMetric, string> = {
    damageDealtApplied: PANEL_WORDS.dealtTo,
    damageTakenApplied: PANEL_WORDS.takenFrom,
    healthGiven: PANEL_WORDS.dealtTo,
    healthRestored: PANEL_WORDS.takenFrom,
};

/**
 * What the second cut is headed. **One of the four is never read and stays anyway**: healing
 * given has no cut by key, so the reading hands over an empty one and no heading is drawn — the
 * entry is here because an exhaustive table makes a fifth screen a question the compiler asks.
 */
const KIND_WORDS: Record<PanelMetric, string> = {
    damageDealtApplied: PANEL_WORDS.damageKind,
    damageTakenApplied: PANEL_WORDS.damageKind,
    healthGiven: PANEL_WORDS.healthSource,
    healthRestored: PANEL_WORDS.healthSource,
};

export interface ScreenState {
    current: PanelMetric;
    /** Whose rows the ranking lists. Kept across a change of screen: it is a standing choice. */
    side: PanelSideChoice;
    /** Whether the shelf is showing. Pressing its control goes back to the figures, as v1's did. */
    isOnShelf: boolean;
    /** Whose row is open, or nobody. A reader who went into somebody is reading that somebody. */
    openRowId: number | null;
    /**
     * Which pair stands open over that row, or nobody. The last rung: what passed between the two
     * is cut by nothing further, so nothing on it opens.
     */
    openPairId: number | null;
    /** Or which skill does, which is the other last rung and is named rather than numbered. */
    openSkillName: string | null;
    /**
     * Which fight the panel is drawing: one off the shelf, or null for the one going on now.
     * A fight chosen is read from what was kept of it, never from figures somebody stored.
     */
    openFightId: number | null;
    /** Folded to the title bar. The reader chose it, so the entry reads it back next visit. */
    isCollapsed: boolean;
}

/** The screen a fight opens on: what the reader did, which is what they came to see. */
export function composeScreenState(isCollapsed: boolean): ScreenState {
    const state: ScreenState = {
        current: "damageDealtApplied",
        side: "everyone",
        isOnShelf: false,
        openRowId: null,
        openPairId: null,
        openSkillName: null,
        openFightId: null,
        isCollapsed,
    };
    assert(SCREEN_ORDER.includes(state.current), "a panel opens on a screen it can draw");
    assert(state.openRowId === null, "and with every row closed");
    assert(state.openPairId === null, "and no pair standing over one");
    assert(state.openSkillName === null, "and no skill standing over that");
    assert(state.openFightId === null, "and the fight being read is the one going on");
    assert(state.side === "everyone", "and listing everybody, before a reader has narrowed it");
    assert(state.isCollapsed === isCollapsed, "and folded exactly as the reader last left it");
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

/** Null for a name no choice answers to, for the same reason as the screen above. */
export function getSideFromName(name: string): PanelSideChoice | null {
    for (const choice of SIDE_CHOICES) {
        if (choice === name) return choice;
    }
    assert(name.length >= 0, "a name that was asked for is text");
    return null;
}

/** What the cut by the other end of each movement is headed. Every screen has one. */
export function getWordsForOpponentCut(screen: PanelMetric): string {
    assert(screen.length > 0, "a screen is asked for by name");
    const words = OPPONENT_WORDS[screen];
    assert(words.length > 0, "a cut that is drawn says what it is cut by");
    return words;
}

export function getWordsForKindCut(screen: PanelMetric): string {
    assert(screen.length > 0, "a screen is asked for by name");
    const words = KIND_WORDS[screen];
    assert(words.length > 0, "a cut that is drawn says what it is cut by");
    return words;
}

/** Which noun a screen belongs to, for anything worded per noun rather than per screen. */
export function getNounForScreen(screen: PanelMetric): PanelNoun {
    assert(SCREEN_ORDER.includes(screen), "a screen asked about is one the strips draw");
    return SCREEN_AXES[screen].noun;
}

/**
 * A screen's full name, composed from its two axes rather than spelled a second time. Two
 * spellings of one screen are two spellings that drift, and the strips are the ones a reader sees.
 */
export function getWordsForScreen(screen: PanelMetric): string {
    assert(screen.length > 0, "a screen is asked for by name");
    assert(SCREEN_ORDER.includes(screen), "and one the strips draw");
    const axes = SCREEN_AXES[screen];
    const words = `${getWordsForNoun(axes.noun)} ${getWordsForDirection(screen)}`;
    assert(words.length > 0, "a screen a reader can reach is a screen with a name");
    return words;
}

/** One control on a strip, and where a press on it goes. */
export interface ScreenTab {
    /** What the press carries. A screen's own name, or a side choice's. */
    name: string;
    words: string;
    isCurrent: boolean;
}

function getScreensForNoun(noun: PanelNoun): PanelMetric[] {
    const found = SCREEN_ORDER.filter((screen) => SCREEN_AXES[screen].noun === noun);
    assert(found.length > 0, "a noun a strip draws is a noun with a screen behind it");
    return found;
}

/**
 * The screen a noun goes to, keeping the direction already being read — so crossing between the
 * nouns never silently turns a figure round. Where the new noun has no such direction there is
 * nothing to keep, and its first is the honest answer rather than a tab that does nothing.
 */
function getScreenAfterNoun(noun: PanelNoun, current: PanelMetric): PanelMetric {
    const wanted = SCREEN_AXES[current].direction;
    const screens = getScreensForNoun(noun);
    const kept = screens.find((screen) => SCREEN_AXES[screen].direction === wanted);
    const reached = kept ?? screens[0] ?? current;
    assert(SCREEN_AXES[reached].noun === noun, "a noun's tab reaches that noun's own screen");
    assert(SCREEN_ORDER.includes(reached), "and one the strips draw");
    return reached;
}

/** The upper strip: which quantity. */
export function composeNounTabs(current: PanelMetric): ScreenTab[] {
    assert(SCREEN_ORDER.includes(current), "a strip is drawn for a screen the panel is on");
    const tabs = PANEL_NOUNS.map((noun) => ({
        name: getScreenAfterNoun(noun, current),
        words: getWordsForNoun(noun),
        isCurrent: noun === SCREEN_AXES[current].noun,
    }));
    assert(tabs.filter((one) => one.isCurrent).length === 1, "and marks the noun being read");
    return tabs;
}

/** The middle strip: the noun the reader is on, turned round. */
export function composeDirectionTabs(current: PanelMetric): ScreenTab[] {
    assert(SCREEN_ORDER.includes(current), "a strip is drawn for a screen the panel is on");
    const tabs = getScreensForNoun(SCREEN_AXES[current].noun).map((screen) => ({
        name: screen,
        words: getWordsForDirection(screen),
        isCurrent: screen === current,
    }));
    assert(tabs.filter((one) => one.isCurrent).length === 1, "and marks the way round being read");
    return tabs;
}

/** The lower strip: whose rows are listed. */
export function composeSideTabs(current: PanelSideChoice): ScreenTab[] {
    assert(SIDE_CHOICES.includes(current), "a strip is drawn for a choice a reader could make");
    const tabs = SIDE_CHOICES.map((choice) => ({
        name: choice,
        words: getWordsForSide(choice),
        isCurrent: choice === current,
    }));
    assert(tabs.filter((one) => one.isCurrent).length === 1, "and marks the one that was made");
    return tabs;
}
