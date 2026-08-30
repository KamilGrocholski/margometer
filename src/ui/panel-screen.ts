/**
 * Which screen the panel is on, and the three questions the strips ask to move it.
 *
 * A screen sits on two axes: which quantity, and which way round. The pair is derived and the
 * metric stays the one field the state holds, so a pair with no figure behind it cannot be
 * expressed at all and the compiler counts the rows.
 */

import { assert } from "@std/assert";
import type { PanelMetric } from "@/src/ui/panel-reading.ts";
import {
    getWordsForDirection,
    getWordsForNoun,
    getWordsForSide,
    PANEL_WORDS,
} from "@/src/ui/panel-words.ts";

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

/** A pair with no row here is a screen that does not exist: healing has no prevented half. */
const SCREEN_AXES: Record<PanelMetric, { noun: PanelNoun; direction: PanelDirection }> = {
    damageDealtApplied: { noun: "damage", direction: "given" },
    damageTakenApplied: { noun: "damage", direction: "received" },
    healthGiven: { noun: "healing", direction: "given" },
    healthRestored: { noun: "healing", direction: "received" },
};

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

/** Never one of the game's own sides, which are bare numbers belonging to a single fight. */
export const SIDE_CHOICES = ["everyone", "reader", "opposing"] as const;
export type PanelSideChoice = (typeof SIDE_CHOICES)[number];

const OPPONENT_WORDS: Record<PanelMetric, string> = {
    damageDealtApplied: PANEL_WORDS.dealtTo,
    damageTakenApplied: PANEL_WORDS.takenFrom,
    healthGiven: PANEL_WORDS.dealtTo,
    healthRestored: PANEL_WORDS.takenFrom,
};

/**
 * Healing given has no cut by key and its entry is never read. It stays: an exhaustive table
 * makes a fifth screen a question the compiler asks.
 */
const KIND_WORDS: Record<PanelMetric, string> = {
    damageDealtApplied: PANEL_WORDS.damageKind,
    damageTakenApplied: PANEL_WORDS.damageKind,
    healthGiven: PANEL_WORDS.healthSource,
    healthRestored: PANEL_WORDS.healthSource,
};

export interface ScreenState {
    current: PanelMetric;
    side: PanelSideChoice;
    isOnShelf: boolean;
    openRowId: number | null;
    openPairId: number | null;
    openSkillName: string | null;
    /** A fight chosen is read from what was kept of it, never from figures somebody stored. */
    openFightId: number | null;
    isCollapsed: boolean;
}

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

export function getScreenFromName(name: string): PanelMetric | null {
    for (const screen of SCREEN_ORDER) {
        if (screen === name) return screen;
    }
    assert(name.length >= 0, "a name that was asked for is text");
    return null;
}

export function getSideFromName(name: string): PanelSideChoice | null {
    for (const choice of SIDE_CHOICES) {
        if (choice === name) return choice;
    }
    assert(name.length >= 0, "a name that was asked for is text");
    return null;
}

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

export function getNounForScreen(screen: PanelMetric): PanelNoun {
    assert(SCREEN_ORDER.includes(screen), "a screen asked about is one the strips draw");
    return SCREEN_AXES[screen].noun;
}

export function getDirectionForScreen(screen: PanelMetric): PanelDirection {
    assert(SCREEN_ORDER.includes(screen), "a screen asked about is one the strips draw");
    return SCREEN_AXES[screen].direction;
}

export function getWordsForScreen(screen: PanelMetric): string {
    assert(screen.length > 0, "a screen is asked for by name");
    assert(SCREEN_ORDER.includes(screen), "and one the strips draw");
    const axes = SCREEN_AXES[screen];
    const words = `${getWordsForNoun(axes.noun)} ${getWordsForDirection(screen)}`;
    assert(words.length > 0, "a screen a reader can reach is a screen with a name");
    return words;
}

export interface ScreenTab {
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
 * Keeps the direction already being read, so crossing between the nouns never silently turns a
 * figure round. Where the new noun has no such direction, its first is the honest answer.
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
