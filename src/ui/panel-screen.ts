/**
 * Which screen the panel is on, and the three questions the strips ask to move it.
 *
 * A screen sits on two axes: which quantity, and which way round. The pair is derived and the
 * metric stays the one field the state holds, so a pair with no figure behind it cannot be
 * expressed at all and the compiler counts the rows.
 */

import type { VocabularyWord } from "#/libs/vocabulary.ts";
import type { OpenedPart, PanelUnnamedEnd } from "./panel-reading.ts";
import {
    getWordsForDirection,
    getWordsForNoun,
    getWordsForSide,
    PANEL_WORDS,
} from "./panel-words.ts";

/** The words are the figures' own fields, so a screen names the figure it draws. */
export const PANEL_METRIC = {
    damageDealtApplied: "damageDealtApplied",
    damageTakenApplied: "damageTakenApplied",
    healthGiven: "healthGiven",
    healthRestored: "healthRestored",
} as const;
export type PanelMetric = VocabularyWord<typeof PANEL_METRIC>;
export const SCREEN_ORDER = Object.values(PANEL_METRIC);

export const PANEL_NOUN = { damage: "damage", healing: "healing" } as const;
export type PanelNoun = VocabularyWord<typeof PANEL_NOUN>;

export const PANEL_DIRECTION = { given: "given", received: "received" } as const;
export type PanelDirection = VocabularyWord<typeof PANEL_DIRECTION>;

interface ScreenAxes {
    noun: PanelNoun;
    direction: PanelDirection;
}

/** A pair with no row here is a screen that does not exist: healing has no prevented half. */
const SCREEN_AXES: Record<PanelMetric, ScreenAxes> = {
    damageDealtApplied: { noun: PANEL_NOUN.damage, direction: PANEL_DIRECTION.given },
    damageTakenApplied: { noun: PANEL_NOUN.damage, direction: PANEL_DIRECTION.received },
    healthGiven: { noun: PANEL_NOUN.healing, direction: PANEL_DIRECTION.given },
    healthRestored: { noun: PANEL_NOUN.healing, direction: PANEL_DIRECTION.received },
};

/** The kinds of part a reader can open: the three a game names, and the row closing a section. */
export const OPENED_PART = {
    skill: "skill",
    source: "source",
    element: "element",
    plain: "plain",
} as const;

/** Never one of the game's own sides, which are bare numbers belonging to a single fight. */
export const SIDE_CHOICE = {
    everyone: "everyone",
    reader: "reader",
    opposing: "opposing",
} as const;
export type PanelSideChoice = VocabularyWord<typeof SIDE_CHOICE>;
export const SIDE_CHOICES = Object.values(SIDE_CHOICE);

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
    /**
     * Which pinned row stands open, and it is never open beside `openRowId`: a pinned row is drawn
     * under the ranking, so a reader inside somebody's figure has none to press.
     */
    openUnnamedEnd: PanelUnnamedEnd | null;
    openPairId: number | null;
    /** Which row of a cut stands open — a skill, a key or a kind, and never two of them. */
    openPart: OpenedPart | null;
    /** A fight chosen is read from what was kept of it, never from figures somebody stored. */
    openFightId: number | null;
    isCollapsed: boolean;
    /** The window beside the panel, which folds apart from it — `develop ADR 0060`. */
    isStandingCollapsed: boolean;
}

export function createScreenState(
    isCollapsed: boolean,
    isStandingCollapsed = false,
): ScreenState {
    const state: ScreenState = {
        current: PANEL_METRIC.damageDealtApplied,
        side: SIDE_CHOICE.everyone,
        isOnShelf: false,
        openRowId: null,
        openUnnamedEnd: null,
        openPairId: null,
        openPart: null,
        openFightId: null,
        isCollapsed,
        isStandingCollapsed,
    };
    return state;
}

/**
 * The name a reader's place is kept under, which is every field that decides which list is drawn.
 * The shelf answers alone: it covers the screens rather than being one of them.
 *
 * The fight is the moment it opened, so a new fight is a place nobody has been rather than the
 * last one's ranking with somebody else's position on it. `develop ADR 0050`.
 */
export function composeListName(screen: ScreenState, fightId: number | null): string {
    if (screen.isOnShelf) return "shelf";
    const part = screen.openPart === null ? "" : composeNameForPart(screen.openPart);
    const name = [
        screen.current,
        screen.side,
        `${fightId}`,
        `${screen.openRowId}`,
        `${screen.openUnnamedEnd}`,
        `${screen.openPairId}`,
        part,
    ].join("|");
    return name;
}

/**
 * The four shapes a part comes in, each spelling its own field, so no two share a name. The
 * closing row states a constant: it has no field of its own, and a place a reader was left at is
 * the whole of what this name is for (`develop ADR 0050`).
 */
function composeNameForPart(part: OpenedPart): string {
    if (part.kind === OPENED_PART.skill) return `${OPENED_PART.skill}:${part.name}`;
    if (part.kind === OPENED_PART.source) return `${OPENED_PART.source}:${part.source}`;
    if (part.kind === OPENED_PART.plain) return `${OPENED_PART.plain}:`;
    return `kind:${part.element}`;
}

/**
 * ⚠️ **These index a table and do not check what comes back.** Every table is a `Record` over the
 * whole of `PanelMetric`, and a name off a strip or out of storage becomes one only through
 * `isOneOf(SCREEN_ORDER, …)` (**N18**). A fallback here is a branch no test can reach: written,
 * then mutated away with nothing going red (**W4**, `develop ADR 0051`).
 */
export function getWordsForOpponentCut(metric: PanelMetric): string {
    return OPPONENT_WORDS[metric];
}

export function getWordsForKindCut(metric: PanelMetric): string {
    return KIND_WORDS[metric];
}

export function getNounForMetric(metric: PanelMetric): PanelNoun {
    return SCREEN_AXES[metric].noun;
}

export function getDirectionForMetric(metric: PanelMetric): PanelDirection {
    return SCREEN_AXES[metric].direction;
}

export function getWordsForMetric(metric: PanelMetric): string {
    const axes = SCREEN_AXES[metric];
    return `${getWordsForNoun(axes.noun)} ${getWordsForDirection(metric)}`;
}

export interface ScreenStrip {
    name: string;
    words: string;
    isCurrent: boolean;
}

function getScreensForNoun(noun: PanelNoun): PanelMetric[] {
    const found = SCREEN_ORDER.filter((screen) => SCREEN_AXES[screen].noun === noun);
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
    return reached;
}

export function presentNounStrips(current: PanelMetric): ScreenStrip[] {
    const strips = Object.values(PANEL_NOUN).map((noun) => ({
        name: getScreenAfterNoun(noun, current),
        words: getWordsForNoun(noun),
        isCurrent: noun === SCREEN_AXES[current].noun,
    }));
    return strips;
}

export function presentDirectionStrips(current: PanelMetric): ScreenStrip[] {
    const strips = getScreensForNoun(SCREEN_AXES[current].noun).map((screen) => ({
        name: screen,
        words: getWordsForDirection(screen),
        isCurrent: screen === current,
    }));
    return strips;
}

export function presentSideStrips(current: PanelSideChoice): ScreenStrip[] {
    const strips = SIDE_CHOICES.map((choice) => ({
        name: choice,
        words: getWordsForSide(choice),
        isCurrent: choice === current,
    }));
    return strips;
}
