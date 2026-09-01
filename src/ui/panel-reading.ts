/**
 * One screen's worth of a fight: the rows, in the order they are drawn.
 *
 * A row's figure is the one the statistics already hold, and no figure here is ever recomputed
 * from the events. What this file does sum is what turns on who is on which side: the listed
 * side's total, and that side's share of what the protocol half-named. The statistics cannot hold
 * either, because nothing under `ui/` tells them the seat — and without them a share on a
 * one-side list would be measured against a whole the list does not show.
 */

import { getRankedOrder } from "@/src/ui/ranked-order.ts";
import { assert, assertEquals } from "@std/assert";
import { type CombatantRoster, getCombatantIdByName } from "@/src/core/combatant-roster.ts";
import {
    type CombatantFigures,
    composeCombatantFigures,
    type FightOutcome,
    type FightStatistics,
    type FigureCut,
    type SkillFigures,
} from "@/src/core/fight-statistics.ts";
import { getIntegerFromText } from "@/libs/number-text.ts";
import {
    getDirectionForScreen,
    getNounForScreen,
    type PanelSideChoice,
    SCREEN_ORDER,
    SIDE_CHOICES,
} from "@/src/ui/panel-screen.ts";
import {
    composeJoinedInProgressWarning,
    composeLostMessageWarning,
    composeShareText,
    composeShareTexts,
    composeUnplacedHealRowWarning,
    composeUnplacedHealWarning,
    composeUnreadRowWarning,
    composeUnreadWarning,
} from "@/src/ui/panel-words.ts";

/** A fight holds twenty, and a list draws a row for each. */
const MAXIMUM_ROWS = 20;
/** As many parts as the widest cut a card draws: the kinds, the defences, the procs. */
const MAXIMUM_CUT_PARTS = 64;
/** What one combatant's own skills are kept inside: 81 names over `captures/`, 2026-08-29. */
const MAXIMUM_SKILLS = 256;
/**
 * The ranking's height, in bars. Ten is the most one side fields and eleven the most a whole
 * fight does, measured over `captures/`, where a group fight is ten of ours against one. A bigger
 * fight scrolls rather than growing the window: a ranking is watched while a fight is on, and a
 * height that changed as combatants joined would move it under the reader's hand.
 */
const RANKING_ROWS = 11;
const SIDE_ROWS = 10;

export type PanelMetric =
    | "damageDealtApplied"
    | "damageTakenApplied"
    | "healthGiven"
    | "healthRestored";

export interface PanelRow {
    combatantId: number;
    name: string | null;
    side: number | null;
    profession: string | null;
    figure: number;
    fill: number;
    shareText: string;
}

/**
 * **Numbers, and not one word.** A card is composed when a pointer opens it, so a fight redrawing
 * every few seconds pays for the twenty it draws rather than for twenty cards nobody looks at.
 *
 * Raw stands beside applied and is never taken from it: their difference is not what a defence
 * stopped, and the protocol reports neither armour nor resistance
 * (`src/core/fight-statistics.ts`).
 */
export interface RowDetail {
    level: number | null;
    damageDealtApplied: number;
    damageTakenApplied: number;
    /**
     * **The raw of the blows, and never the raw of the figure beside it.** The protocol states a
     * figure before reduction on a blow and nowhere else, while an applied figure grows from
     * blows, from damage named against somebody and from health moving outside one. What the card
     * owes for drawing these is the label saying what they are a sum of (`src/ui/panel-words.ts`).
     */
    damageDealtRaw: number;
    damageTakenRaw: number;
    healthGiven: number;
    healthRestored: number;
    damagePrevented: number;
    blowsStruck: number;
    blowsWithoutSkill: number;
    /** What their announcements came to, which is a count of announcements and not of blows. */
    skillUses: number;
    damageDealtToNobody: number;
    damageTakenFromNobody: number;
    healthRestoredByNobody: number;
    /** Blows that landed critically, against `blowsStruck`, which is what a rate is taken of. */
    blowsCritical: number;
    damageDealtBlowLargest: number;
    damageTakenBlowLargest: number;
    /**
     * The four cuts a card draws, each already in the order it is drawn in. **Readings rather than
     * the maps they were read off**: a card handed the statistics' own map could write into the
     * figures it is drawing.
     */
    procsWhenStriking: readonly CutPart[];
    procsWhenStruck: readonly CutPart[];
    damagePreventedByDefence: readonly CutPart[];
    statisticsDestroyed: readonly CutPart[];
    /**
     * This person's own share of the fight's two doubts, which is what puts a mark on their row
     * rather than under the whole list (`src/core/fight-statistics.ts` says why neither sums to
     * the fight's own count).
     */
    unreadMessages: number;
    castsUnplaced: number;
}

/**
 * One part of a cut, under the protocol's own key. What a reader is shown for that key is the
 * panel's to say and never this file's, the way an element's token reaches `ElementRow`.
 */
export interface CutPart {
    key: string;
    figure: number;
}

/** A row with somebody behind it, wherever it stands: the ranking, an end, or an opened skill. */
export interface PersonRow extends PanelRow {
    detail: RowDetail;
}

export type RankingRow = PersonRow;

export type PanelUnnamedEnd = "actor" | "target";

/**
 * Where a figure the protocol half-named stands against the ranking above it, and there are two
 * answers because there are two situations:
 *
 * - `apart` — no ranked row holds these points, so the figure joins the whole the screen divides
 *   by and takes a share of it like any row.
 * - `cut` — the rows hold the points already but cannot say this about them. The figure is a
 *   slice of what is on screen, so it states a share and adds nothing to the whole.
 */
export type PinnedStanding = "apart" | "cut";

/**
 * The five figures the protocol can leave half-named, one name each — and the name is the key
 * every table about these rows is written on.
 *
 * **Five and not eight.** A screen states a figure for one end, so `healthGiven` has no target to
 * leave out and `healthRestored` no second end at all. Keyed by the screen and the end instead,
 * three of the eight cells would be sentences nobody can reach, and a table with holes in it is
 * one nobody can reuse.
 */
export type PinnedCase =
    | "dealtWithNoActor"
    | "givenWithNoActor"
    | "takenWithNoActor"
    | "takenWithNoTarget"
    | "restoredWithNoActor";

/** The end the game **did** name, as the per-combatant figure that end carries. */
type HalfNamedField = "damageTakenFromNobody" | "damageDealtToNobody" | "healthRestoredByNobody";

/** And the same figure cut by the key it was stated under, which is what it was dealt with. */
type HalfNamedKindField =
    | "damageTakenFromNobodyByElement"
    | "damageDealtToNobodyByElement"
    | "healthRestoredByNobodyBySource";

interface PinnedShape {
    metric: PanelMetric;
    end: PanelUnnamedEnd;
    standing: PinnedStanding;
    field: HalfNamedField;
    kinds: HalfNamedKindField;
}

/**
 * What each of the five is. **The one place the four answers are decided together**, so a screen
 * cannot acquire an end it states no figure for, and a standing cannot drift from the end it was
 * chosen for.
 *
 * `field` is what both the figure and the level under it are read off, and `kinds` is the same
 * figure cut by the key it was stated under. `src/core/fight-statistics.ts` asserts the three
 * fields total the fight's own counts and each cut totals its own field — which is what lets a
 * pinned row be summed from what stands under it rather than beside it, twice over.
 */
const PINNED_SHAPES: Record<PinnedCase, PinnedShape> = {
    dealtWithNoActor: {
        metric: "damageDealtApplied",
        end: "actor",
        standing: "apart",
        field: "damageTakenFromNobody",
        kinds: "damageTakenFromNobodyByElement",
    },
    givenWithNoActor: {
        metric: "healthGiven",
        end: "actor",
        standing: "apart",
        field: "healthRestoredByNobody",
        kinds: "healthRestoredByNobodyBySource",
    },
    takenWithNoActor: {
        metric: "damageTakenApplied",
        end: "actor",
        standing: "cut",
        field: "damageTakenFromNobody",
        kinds: "damageTakenFromNobodyByElement",
    },
    takenWithNoTarget: {
        metric: "damageTakenApplied",
        end: "target",
        standing: "apart",
        field: "damageDealtToNobody",
        kinds: "damageDealtToNobodyByElement",
    },
    restoredWithNoActor: {
        metric: "healthRestored",
        end: "actor",
        standing: "cut",
        field: "healthRestoredByNobody",
        kinds: "healthRestoredByNobodyBySource",
    },
};

/** In the order the screens pin them, which is the order a screen's two are drawn in. */
export const PINNED_CASES: readonly PinnedCase[] = [
    "dealtWithNoActor",
    "givenWithNoActor",
    "takenWithNoActor",
    "takenWithNoTarget",
    "restoredWithNoActor",
];

export function getEndForPinned(kase: PinnedCase): PanelUnnamedEnd {
    assert(kase.length > 0, "a pinned figure is asked about by name");
    return PINNED_SHAPES[kase].end;
}

export function getMetricForPinned(kase: PinnedCase): PanelMetric {
    assert(kase.length > 0, "a pinned figure is asked about by name");
    return PINNED_SHAPES[kase].metric;
}

/**
 * Which of the five a screen and an end come to, or nothing where that screen pins no such end.
 * Null is the answer a press deserves: a mark left over from another screen names no figure here,
 * and opening the screen's other end instead would be a level about something else.
 */
export function getPinnedCase(metric: PanelMetric, end: PanelUnnamedEnd): PinnedCase | null {
    assert(SCREEN_ORDER.includes(metric), "an end is asked about on a screen the strips draw");
    assert(end.length > 0, "and about an end asked for by name");
    const found = PINNED_CASES.filter((kase) => {
        const shape = PINNED_SHAPES[kase];
        if (shape.metric !== metric) return false;
        return shape.end === end;
    });
    assert(found.length <= 1, "a screen pins one figure per end, never two");
    return found[0] ?? null;
}

/** What one screen can pin, in the order it draws them. One screen pins two; the rest pin one. */
function getPinnedCasesForScreen(metric: PanelMetric): PinnedCase[] {
    assert(SCREEN_ORDER.includes(metric), "a screen pins on a screen the strips draw");
    const named = Object.keys(PINNED_SHAPES).length;
    assert(PINNED_CASES.length === named, "and every case the table holds is one the list names");
    return PINNED_CASES.filter((kase) => PINNED_SHAPES[kase].metric === metric);
}

export interface PinnedRow {
    case: PinnedCase;
    end: PanelUnnamedEnd;
    standing: PinnedStanding;
    figure: number;
    fill: number;
    shareText: string;
}

/** One person under a pinned row: the end the game named, and what it carries of that figure. */
export type HalfNamedRow = PersonRow;

/**
 * What stands under a pinned row — the end the game **did** name, person by person, and the part
 * of the figure naming neither end where there is one.
 *
 * Nothing on it opens. A pair between somebody and nobody is not a pair, and a kind under it
 * would be a cut of a cut the statistics do not keep.
 */
export interface HalfNamedReading {
    case: PinnedCase;
    end: PanelUnnamedEnd;
    total: number;
    rows: HalfNamedRow[];
    /**
     * What the figure was dealt with — the one question a row naming nobody can still answer, and
     * the reason it is worth opening at all where the level above lists a single person.
     */
    kinds: ElementCut;
    /**
     * The part of the figure that named **neither** end — inside the count above it and on nobody's
     * row, so a section without it falls short of what it is a cut of.
     */
    neither: UnnamedRow | null;
}

/** Which row of a pinned level a reader pressed. The two shapes that level draws, and no third. */
export type HalfNamedOpened =
    | { kind: "person"; combatantId: number }
    | { kind: "element"; element: string };

/**
 * What stands under one row of a pinned level: a person's own keys, or a key's own people. The two
 * are the same fold read the two ways round, which is why neither opens any further.
 */
export type HalfNamedDrillReading =
    | {
        opened: "person";
        case: PinnedCase;
        row: HalfNamedRow;
        total: number;
        kinds: ElementCut;
    }
    | {
        opened: "element";
        case: PinnedCase;
        element: string;
        end: PanelUnnamedEnd;
        total: number;
        rows: HalfNamedRow[];
        /** A key may carry part of what named neither end, and that part is on nobody's row. */
        neither: UnnamedRow | null;
    };

export interface ShelfRow {
    openedAt: number;
    at: { hour: number; minute: number } | null;
    sizes: number[];
    place: string | null;
    outcome: PanelOutcome | null;
    isLive: boolean;
    isChosen: boolean;
    isPinned: boolean;
    /**
     * Whether there is anything to pin. A fight nothing has written down yet is not in the store
     * and the rotation has never seen it, so a pin on it would be a control that does nothing —
     * which is worse than one that is not there. It is not the same as *not live*: a fight is
     * both for as long as the gap between it ending and the next one starting.
     */
    isPinnable: boolean;
}

/** How a fight went, from the reader's own seat. A draw needs no seat: nobody won it. */
export type PanelOutcome = "won" | "lost" | "drawn";

export interface PanelReading {
    rows: RankingRow[];
    outcome: PanelOutcome | null;
    sizes: number[];
    unplaced: number;
    total: number;
    pinned: PinnedRow[];
    warnings: string[];
    sides: PanelSides | null;
    visibleRows: number;
}

function getFigure(figures: CombatantFigures, metric: PanelMetric): number {
    const figure = figures[metric];
    assert(Number.isFinite(figure), "a figure a screen shows is a number");
    assert(figure >= 0, "and never below nothing");
    return figure;
}

/** What is short about the reading rather than about a figure on it. The session states both. */
export interface FightDoubts {
    messagesLost: number;
    hasJoinedInProgress: boolean;
}

export const NOTHING_MISSED: FightDoubts = { messagesLost: 0, hasJoinedInProgress: false };

/** The list below is the bound, not anything a fight can do. */
const MAXIMUM_WARNINGS = 4;
/** And a row carries the two of the four that can be charged to one person. */
const ROW_WARNINGS = 2;

/**
 * Widening to narrowing. The first three qualify every screen; a cast nobody could place puts back
 * health, so saying it on a damage screen would put a doubt on a figure that cannot carry it.
 */
function composeWarnings(
    statistics: FightStatistics,
    metric: PanelMetric,
    doubts: FightDoubts,
): string[] {
    assert(statistics.unreadMessages >= 0, "a count of unread messages is never below nothing");
    assert(statistics.castsUnplaced >= 0, "and neither is a count of casts nobody could place");
    assert(doubts.messagesLost >= 0, "and neither is a count of messages that never arrived");
    const said: string[] = [];
    assert(SCREEN_ORDER.includes(metric), "a screen is qualified by what could shorten its own");
    if (doubts.hasJoinedInProgress) said.push(composeJoinedInProgressWarning());
    if (doubts.messagesLost > 0) said.push(composeLostMessageWarning(doubts.messagesLost));
    if (statistics.unreadMessages > 0) said.push(composeUnreadWarning(statistics.unreadMessages));
    const isHealing = metric === "healthRestored" || metric === "healthGiven";
    if (isHealing && statistics.castsUnplaced > 0) {
        said.push(composeUnplacedHealWarning(statistics.castsUnplaced));
    }
    assert(said.length <= MAXIMUM_WARNINGS, "a screen says at most the four things it can");
    return said;
}

/**
 * What this row's own figure is short of, as sentences a reader can act on.
 *
 * The screen decides which of the two are owed for the same reason it decides the fight's own:
 * a cast nobody could place puts back health, so saying it beside a damage figure would be a
 * doubt over a figure that cannot carry it. Composed on demand, like a card's other words.
 */
export function composeRowWarnings(detail: RowDetail, metric: PanelMetric): string[] {
    assert(detail.unreadMessages >= 0, "a count of what went unread is never below nothing");
    assert(detail.castsUnplaced >= 0, "and neither is a count of casts nobody could place");
    const said: string[] = [];
    if (detail.unreadMessages > 0) said.push(composeUnreadRowWarning(detail.unreadMessages));
    const isHealing = getNounForScreen(metric) === "healing";
    if (isHealing && detail.castsUnplaced > 0) {
        said.push(composeUnplacedHealRowWarning(detail.castsUnplaced));
    }
    assert(said.length <= ROW_WARNINGS, "a row says at most the two things it can");
    return said;
}

/**
 * Whether the row wears the mark, which is the same question `composeRowWarnings` answers and
 * asked without composing a sentence: this runs per row per redraw and that runs when a pointer
 * stops on one.
 */
export function getRowHasDoubt(detail: RowDetail, metric: PanelMetric): boolean {
    assert(SCREEN_ORDER.includes(metric), "a row is qualified on a screen the strips draw");
    if (detail.unreadMessages > 0) return true;
    if (getNounForScreen(metric) !== "healing") return false;
    return detail.castsUnplaced > 0;
}

/**
 * A combatant with no side belongs to neither, so a one-side list leaves them out rather than
 * putting them on the side that happens to be showing; they are drawn under everybody, where
 * saying nothing about their side costs nothing. With no seat to read from, every list is
 * everybody: a filter that cannot tell the two apart is a filter that would guess.
 */
function getIsRowListed(
    side: number | null,
    choice: PanelSideChoice,
    readerSide: number | null,
): boolean {
    assert(side === null || Number.isFinite(side), "a side a row states is a number or nothing");
    assert(readerSide === null || Number.isFinite(readerSide), "and so is the reader's own");
    if (choice === "everyone") return true;
    if (readerSide === null) return true;
    if (side === null) return false;
    if (choice === "reader") return side === readerSide;
    return side !== readerSide;
}

interface UnsharedRow {
    combatantId: number;
    name: string | null;
    side: number | null;
    profession: string | null;
    figure: number;
}

function getSkillUses(figures: CombatantFigures): number {
    assert(figures.skills.size <= MAXIMUM_SKILLS, "a combatant stays inside the skills bound");
    let uses = 0;
    for (const skill of figures.skills.values()) {
        assert(
            skill.uses >= 0,
            "a skill was announced a number of times that is not below nothing",
        );
        uses += skill.uses;
    }
    assert(uses >= 0, "and what they announced in all is not below nothing either");
    return uses;
}

/**
 * A cut as the card draws it: biggest first, then by the key, so a fight redrawn without changing
 * states the same order. A part that came to nothing takes a row and adds none of it, so it is
 * left out — the same rule `composeElementCut` keeps.
 */
function composeCutParts(cut: FigureCut): CutPart[] {
    assert(cut.size <= MAXIMUM_CUT_PARTS, "a cut stays inside its stated bound");
    const parts: CutPart[] = [];
    for (const [key, figure] of cut) {
        assert(figure >= 0, "a part of a figure is never below nothing");
        if (figure > 0) parts.push({ key, figure });
    }
    parts.sort((one, other) => getRankedOrder(one.figure, other.figure, one.key, other.key));
    return parts;
}

/**
 * Everything a row can say on demand, off the figures it already holds. A combatant the
 * statistics never saw is handed an empty set rather than a set of nulls: they did nothing, and
 * nothing is a reading.
 */
function composeRowDetail(figures: CombatantFigures, level: number | null): RowDetail {
    assert(figures.damageDealtApplied >= 0, "a figure a card states is not below nothing");
    assert(figures.blowsStruck >= 0, "and neither is a count of the blows behind one");
    return {
        level,
        damageDealtApplied: figures.damageDealtApplied,
        damageTakenApplied: figures.damageTakenApplied,
        damageDealtRaw: figures.damageDealtRaw,
        damageTakenRaw: figures.damageTakenRaw,
        healthGiven: figures.healthGiven,
        healthRestored: figures.healthRestored,
        damagePrevented: figures.damagePrevented,
        blowsStruck: figures.blowsStruck,
        blowsWithoutSkill: figures.blowsWithoutSkill,
        skillUses: getSkillUses(figures),
        damageDealtToNobody: figures.damageDealtToNobody,
        damageTakenFromNobody: figures.damageTakenFromNobody,
        healthRestoredByNobody: figures.healthRestoredByNobody,
        blowsCritical: figures.blowsCritical,
        damageDealtBlowLargest: figures.damageDealtBlowLargest,
        damageTakenBlowLargest: figures.damageTakenBlowLargest,
        procsWhenStriking: composeCutParts(figures.procsWhenStriking),
        procsWhenStruck: composeCutParts(figures.procsWhenStruck),
        damagePreventedByDefence: composeCutParts(figures.damagePreventedByDefence),
        statisticsDestroyed: composeCutParts(figures.statisticsDestroyed),
        unreadMessages: figures.unreadMessages,
        castsUnplaced: figures.castsUnplaced,
    };
}

/**
 * The card's figures for one combatant, wherever their row stands. Somebody the statistics never
 * saw is handed an empty set rather than nothing: they are on the roster and did nothing, which is
 * a reading.
 */
function composeRowDetailFor(
    statistics: FightStatistics,
    roster: CombatantRoster,
    combatantId: number,
): RowDetail {
    assert(Number.isSafeInteger(combatantId), "a card is composed for somebody the panel names");
    assert(statistics.byCombatantId.size <= MAXIMUM_ROWS, "out of a fight inside its stated bound");
    return composeRowDetail(
        statistics.byCombatantId.get(combatantId) ?? composeCombatantFigures(),
        roster.byId.get(combatantId)?.level ?? null,
    );
}

/** By figure, then by id — a tie broken by something that does not move between draws. */
function compareRows(one: UnsharedRow, other: UnsharedRow): number {
    assert(Number.isFinite(one.figure), "a row compared states a figure");
    if (one.figure !== other.figure) return other.figure - one.figure;
    return one.combatantId - other.combatantId;
}

function composeUnsharedRows(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
): UnsharedRow[] {
    assert(statistics.byCombatantId.size <= MAXIMUM_ROWS, "a fight stays inside its stated bound");
    assert(roster.byId.size <= MAXIMUM_ROWS, "and so does the roster it is fought by");
    const rows: UnsharedRow[] = [];
    const seen = new Set<number>();
    for (const [combatantId, figures] of statistics.byCombatantId) {
        seen.add(combatantId);
        const held = roster.byId.get(combatantId);
        rows.push({
            combatantId,
            name: held?.name ?? null,
            side: held?.side ?? null,
            profession: held?.profession ?? null,
            figure: getFigure(figures, metric),
        });
    }
    for (const combatant of roster.byId.values()) {
        if (seen.has(combatant.id)) continue;
        rows.push({
            combatantId: combatant.id,
            name: combatant.name,
            side: combatant.side,
            profession: combatant.profession,
            figure: 0,
        });
    }
    assert(rows.length >= roster.byId.size, "every combatant the roster holds gets a row");
    assert(rows.length <= MAXIMUM_ROWS, "and the fight stays inside its stated bound");
    return rows;
}

/**
 * What the shares on this list are measured against: the fight's own total under everybody, and
 * the listed side's under either of the other two. A one-side list whose shares came to a fifth
 * of a percent would be answering a question nobody on that list asked.
 */
function getListedTotal(
    statistics: FightStatistics,
    rows: readonly UnsharedRow[],
    metric: PanelMetric,
    choice: PanelSideChoice,
): number {
    assert(SIDE_CHOICES.includes(choice), "a list is totalled for a choice a reader could make");
    if (choice === "everyone") return getFigure(statistics.totals, metric);
    let total = 0;
    assert(rows.length <= MAXIMUM_ROWS, "a list stays inside the fight's stated bound");
    for (const row of rows) total += row.figure;
    assert(Number.isSafeInteger(total), "a total stays inside what a number holds exactly");
    return total;
}

/**
 * Which part of the strip a list is showing, or nothing where it is showing everybody. With no
 * seat to read from, every list is everybody: `getIsRowListed` answers that way and this has to
 * answer the same, or a figure would be charged to a side no row was filtered by.
 */
function getPartListed(choice: PanelSideChoice, readerSide: number | null): PanelSidePart | null {
    assert(SIDE_CHOICES.includes(choice), "a list is shown for a choice a reader could make");
    assert(readerSide === null || Number.isFinite(readerSide), "from a seat, or from none at all");
    if (choice === "everyone") return null;
    if (readerSide === null) return null;
    if (choice === "reader") return "ours";
    return "theirs";
}

/** One person under a pinned figure, before anything has been said about how they are drawn. */
interface HalfNamedPart {
    combatantId: number;
    figure: number;
}

/**
 * The end the game **did** name, person by person — **one walk, read by both the pinned row and
 * the level under it**, so a figure and what stands beneath it cannot disagree. Which field is
 * walked is `PINNED_SHAPES`', and which people are kept turns on the standing:
 *
 * - `cut` — the rows the list is showing, because on those screens the listed row **is** the named
 *   end. No inference is involved.
 * - `apart` under one side — whoever the strip charges that side with, which is ADR 0013's rule
 *   read through `getPartCharged`. There is one copy of it, and the strip reads the same one.
 * - `apart` under everybody — everyone the statistics hold.
 *
 * What names **neither** end is on nobody's row and is added by the caller, never here.
 */
function composeHalfNamedParts(
    statistics: FightStatistics,
    roster: CombatantRoster,
    kase: PinnedCase,
    rows: readonly UnsharedRow[],
    part: PanelSidePart | null,
    readerSide: number | null,
): HalfNamedPart[] {
    assert(statistics.byCombatantId.size <= MAXIMUM_ROWS, "a fight stays inside its stated bound");
    assert(part !== "nobody", "a figure is charged to a side, never to the refusal beside them");
    const shape = PINNED_SHAPES[kase];
    const listed = new Set(rows.map((one) => one.combatantId));
    const found: HalfNamedPart[] = [];
    for (const [combatantId, figures] of statistics.byCombatantId) {
        const figure = figures[shape.field];
        assert(figure >= 0, "a half-named figure is never below nothing");
        if (figure <= 0) continue;
        const held = getPartOfSide(roster.byId.get(combatantId)?.side ?? null, readerSide);
        if (!getIsHalfNamedKept(shape, held, listed.has(combatantId), part)) continue;
        found.push({ combatantId, figure });
    }
    assert(found.length <= MAXIMUM_ROWS, "and so does what stands under one of its pinned rows");
    return found;
}

/** The three rules the paragraph above states, as the one condition each of them is. */
function getIsHalfNamedKept(
    shape: PinnedShape,
    held: PanelSidePart,
    isListed: boolean,
    part: PanelSidePart | null,
): boolean {
    assert(shape.field.length > 0, "a figure is kept out of a cut the shape names");
    if (shape.standing === "cut") return isListed;
    if (part === null) return true;
    return getPartCharged(held, shape.metric) === part;
}

/**
 * What the pinned figure comes to: the sum of the level under it, and what named neither end where
 * that is inside the same count.
 *
 * Only damage can name neither end, and only a figure standing `apart` holds it: a `cut` is summed
 * over rows the list already draws, and nobody's row is not one of them. Under one side it drops
 * out too — `getPartCharged` charges from a row, and there is no row to charge from.
 */
function getPinnedFigure(
    statistics: FightStatistics,
    kase: PinnedCase,
    parts: readonly HalfNamedPart[],
    part: PanelSidePart | null,
): number {
    assert(statistics.byNeitherEnd >= 0, "what names neither end is never below nothing");
    let total = 0;
    for (const one of parts) total += one.figure;
    total += getNeitherEndForPinned(statistics, kase, part);
    assert(Number.isSafeInteger(total), "a total stays inside what a number holds exactly");
    assertPinnedTotalsTheFight(statistics, kase, total, part);
    return total;
}

function getNeitherEndForPinned(
    statistics: FightStatistics,
    kase: PinnedCase,
    part: PanelSidePart | null,
): number {
    assert(statistics.byNeitherEnd >= 0, "what names neither end is never below nothing");
    assert(part !== "nobody", "and a list is narrowed to a side, never to the refusal beside them");
    const shape = PINNED_SHAPES[kase];
    if (part !== null) return 0;
    if (shape.standing === "cut") return 0;
    if (getNounForScreen(shape.metric) === "healing") return 0;
    return statistics.byNeitherEnd;
}

const PINNED_SUM_SAID = "a pinned figure is the whole of what stands under it";

/**
 * Under everybody a figure standing apart **is** the fight's own count, and this says so out loud.
 * `getHalfNamedBalance` in `src/core/fight-statistics.ts` is what makes it hold — the count is the
 * sum of one field across the rows plus what named neither end, and nothing else.
 */
function assertPinnedTotalsTheFight(
    statistics: FightStatistics,
    kase: PinnedCase,
    total: number,
    part: PanelSidePart | null,
): void {
    if (part !== null) return;
    if (PINNED_SHAPES[kase].standing === "cut") return;
    if (kase === "dealtWithNoActor") assert(total === statistics.dealtByNobody, PINNED_SUM_SAID);
    if (kase === "takenWithNoTarget") assert(total === statistics.takenByNobody, PINNED_SUM_SAID);
    if (kase === "givenWithNoActor") assert(total === statistics.givenByNobody, PINNED_SUM_SAID);
}

/**
 * The ends the protocol can leave out, as figures standing under the list that is showing.
 *
 * Each is summed from the level under it rather than read off a count beside it, which is what
 * keeps the row and that level one answer. **ADR 0036** charges a one-side list the way the strip
 * charges it; **ADR 0034** is why the level is there at all.
 */
function composePinnedFigures(
    statistics: FightStatistics,
    roster: CombatantRoster,
    rows: readonly UnsharedRow[],
    metric: PanelMetric,
    choice: PanelSideChoice,
    readerSide: number | null,
): Array<Omit<PinnedRow, "fill" | "shareText">> {
    assert(SIDE_CHOICES.includes(choice), "a figure is pinned for a choice a reader could make");
    assert(statistics.dealtByNobody >= 0, "and one that is never below nothing");
    const part = getPartListed(choice, readerSide);
    const found = getPinnedCasesForScreen(metric).map((kase) => {
        const parts = composeHalfNamedParts(statistics, roster, kase, rows, part, readerSide);
        const shape = PINNED_SHAPES[kase];
        return {
            case: kase,
            end: shape.end,
            standing: shape.standing,
            figure: getPinnedFigure(statistics, kase, parts, part),
        };
    });
    assert(found.length <= 2, "a screen pins the two ends the protocol can leave out, at most");
    return found.filter((one) => one.figure > 0);
}

/**
 * What stands under a pinned row, composed only when a reader asks for it. Null where that row is
 * not on the screen at all — a figure of nothing is not pinned, so there is nothing to open.
 *
 * The rows are the same walk the pinned figure was summed from, so the section totals the figure
 * over it by construction rather than by a second count agreeing with the first.
 */
interface HalfNamedListing {
    parts: HalfNamedPart[];
    part: PanelSidePart | null;
}

/**
 * Who stands under a pinned row on the list as it is narrowed — read once here, so the row, the
 * level and the level under **that** are three drawings of one walk rather than three walks.
 */
function composeHalfNamedListing(
    statistics: FightStatistics,
    roster: CombatantRoster,
    kase: PinnedCase,
    choice: PanelSideChoice,
    readerSide: number | null,
): HalfNamedListing {
    assert(SIDE_CHOICES.includes(choice), "a level opens for a choice a reader could make");
    const metric = getMetricForPinned(kase);
    const listed = composeUnsharedRows(statistics, roster, metric).filter((row) =>
        getIsRowListed(row.side, choice, readerSide)
    );
    const part = getPartListed(choice, readerSide);
    return {
        parts: composeHalfNamedParts(statistics, roster, kase, listed, part, readerSide),
        part,
    };
}

export function composeHalfNamedReading(
    statistics: FightStatistics,
    roster: CombatantRoster,
    kase: PinnedCase,
    choice: PanelSideChoice,
    readerSide: number | null,
): HalfNamedReading | null {
    const { parts, part } = composeHalfNamedListing(statistics, roster, kase, choice, readerSide);
    const total = getPinnedFigure(statistics, kase, parts, part);
    if (total <= 0) return null;
    const neither = getNeitherEndForPinned(statistics, kase, part);
    const largest = getLargestFigure([...parts.map((one) => one.figure), neither]);
    const shares = composeShareTexts([...parts.map((one) => one.figure), neither], total);
    return {
        case: kase,
        end: getEndForPinned(kase),
        total,
        rows: composeHalfNamedRows(statistics, roster, parts, shares, largest),
        kinds: composeHalfNamedKinds(statistics, kase, parts, neither, total),
        neither: neither <= 0 ? null : {
            figure: neither,
            fill: getFill(neither, largest),
            shareText: shares[parts.length] ?? "",
        },
    };
}

/**
 * What the figure was dealt with, folded from the **same** people it was summed from — so the two
 * sections under one pinned row are two cuts of one number rather than two numbers.
 *
 * The fold is the panel's because the set of people is: a reader narrowing to one side narrows
 * what is folded, and `src/core/fight-statistics.ts` cannot know what they narrowed it to. What
 * that file does hold is each person's own cut against each person's own figure, which is what
 * makes this sum the figure over it.
 */
function composeHalfNamedKinds(
    statistics: FightStatistics,
    kase: PinnedCase,
    parts: readonly HalfNamedPart[],
    neither: number,
    total: number,
): ElementCut {
    assert(total > 0, "a figure being cut by kind is a figure there is something of");
    assert(neither >= 0, "and what named neither end is never below nothing");
    const shape = PINNED_SHAPES[kase];
    const folded = new Map<string, number>();
    for (const one of parts) {
        const figures = statistics.byCombatantId.get(one.combatantId);
        if (figures === undefined) continue;
        addFoldedCut(folded, figures[shape.kinds]);
    }
    if (neither > 0) addFoldedCut(folded, statistics.byNeitherEndByElement);
    // A key standing only for what named neither end has nobody's row to open onto, and a level
    // holding one refusal says nothing the row above it did not.
    return composeElementCut(folded, total, (element) => {
        return getHalfNamedByKind(statistics, shape.kinds, parts, element).length > 0;
    });
}

/** Whoever carries one key of a half-named figure, with the part of it their row holds. */
function getHalfNamedByKind(
    statistics: FightStatistics,
    kinds: HalfNamedKindField,
    parts: readonly HalfNamedPart[],
    element: string,
): HalfNamedPart[] {
    assert(element.length > 0, "a key is asked about by the name the protocol wrote");
    assert(parts.length <= MAXIMUM_ROWS, "and asked of a level inside its stated bound");
    const found: HalfNamedPart[] = [];
    for (const one of parts) {
        const figures = statistics.byCombatantId.get(one.combatantId);
        if (figures === undefined) continue;
        const figure = figures[kinds].get(element) ?? 0;
        assert(figure >= 0, "a part of a figure is never below nothing");
        if (figure <= 0) continue;
        found.push({ combatantId: one.combatantId, figure });
    }
    return found;
}

/** One person's own cut into the fold, under the key the protocol wrote it with. */
function addFoldedCut(folded: Map<string, number>, held: FigureCut): void {
    assert(folded.size <= MAXIMUM_CUT_PARTS, "a fold stays inside the bound one cut is kept to");
    assert(held.size <= MAXIMUM_CUT_PARTS, "and so does each cut folded into it");
    for (const [key, figure] of held) {
        assert(figure >= 0, "a part of a figure is never below nothing");
        folded.set(key, (folded.get(key) ?? 0) + figure);
    }
}

/**
 * What stands under one row of a pinned level, composed only when a reader asks for it. Null where
 * the row pressed is not on that level — a mark left over from another screen, or a person the
 * narrowing has since dropped — because a level of somebody else's figure is worse than none.
 *
 * Both shapes are read off the listing the level above was drawn from, so a figure here is a part
 * of the figure there by construction. Nothing on this level opens: it is the third.
 */
export function composeHalfNamedDrillReading(
    statistics: FightStatistics,
    roster: CombatantRoster,
    kase: PinnedCase,
    choice: PanelSideChoice,
    readerSide: number | null,
    opened: HalfNamedOpened,
): HalfNamedDrillReading | null {
    const { parts, part } = composeHalfNamedListing(statistics, roster, kase, choice, readerSide);
    assert(getPinnedFigure(statistics, kase, parts, part) >= 0, "a level opens under a figure");
    if (opened.kind === "person") {
        return composeHalfNamedForPerson(statistics, roster, kase, parts, opened.combatantId);
    }
    return composeHalfNamedForKind(statistics, roster, kase, { parts, part }, opened);
}

/** One person's share of a half-named figure, cut by what the protocol says it was dealt with. */
function composeHalfNamedForPerson(
    statistics: FightStatistics,
    roster: CombatantRoster,
    kase: PinnedCase,
    parts: readonly HalfNamedPart[],
    combatantId: number,
): HalfNamedDrillReading | null {
    assert(Number.isSafeInteger(combatantId), "a person is opened by the number the game named");
    assert(parts.length <= MAXIMUM_ROWS, "on a level inside its stated bound");
    const held = parts.find((one) => one.combatantId === combatantId);
    if (held === undefined) return null;
    const figures = statistics.byCombatantId.get(combatantId);
    if (figures === undefined) return null;
    assert(held.figure > 0, "a person on a level carries some of the figure over it");
    const [row] = composeHalfNamedRows(statistics, roster, [held], ["100%"], held.figure);
    if (row === undefined) return null;
    return {
        opened: "person",
        case: kase,
        row,
        total: held.figure,
        kinds: composeElementCut(figures[PINNED_SHAPES[kase].kinds], held.figure, () => false),
    };
}

/**
 * And the same fold the other way round: whoever carries one key of that figure. The part of the
 * key that named neither end comes with it, because the level above counted it into the key's own
 * figure — a level short of the row over it states a figure a reader cannot check.
 */
function composeHalfNamedForKind(
    statistics: FightStatistics,
    roster: CombatantRoster,
    kase: PinnedCase,
    listing: HalfNamedListing,
    opened: { kind: "element"; element: string },
): HalfNamedDrillReading | null {
    const shape = PINNED_SHAPES[kase];
    const found = getHalfNamedByKind(statistics, shape.kinds, listing.parts, opened.element);
    if (found.length === 0) return null;
    const apart = getNeitherEndForPinned(statistics, kase, listing.part);
    const neither = apart <= 0 ? 0 : statistics.byNeitherEndByElement.get(opened.element) ?? 0;
    let total = neither;
    for (const one of found) total += one.figure;
    assert(total > 0, "a key that opens carries some of the figure over it");
    const figures = [...found.map((one) => one.figure), neither];
    const shares = composeShareTexts(figures, total);
    const largest = getLargestFigure(figures);
    return {
        opened: "element",
        case: kase,
        element: opened.element,
        end: shape.end,
        total,
        rows: composeHalfNamedRows(statistics, roster, found, shares, largest),
        neither: neither <= 0 ? null : {
            figure: neither,
            fill: getFill(neither, largest),
            shareText: shares[found.length] ?? "",
        },
    };
}

/** Ranked the way every list here is: by the figure, then by the name beside it. */
function composeHalfNamedRows(
    statistics: FightStatistics,
    roster: CombatantRoster,
    parts: readonly HalfNamedPart[],
    shares: readonly string[],
    largest: number,
): HalfNamedRow[] {
    const rows = parts.map((one, at): HalfNamedRow => {
        const held = roster.byId.get(one.combatantId);
        return {
            combatantId: one.combatantId,
            name: held?.name ?? null,
            side: held?.side ?? null,
            profession: held?.profession ?? null,
            figure: one.figure,
            fill: getFill(one.figure, largest),
            shareText: shares[at] ?? "",
            detail: composeRowDetailFor(statistics, roster, one.combatantId),
        };
    });
    rows.sort((one, other) =>
        getRankedOrder(one.figure, other.figure, one.name ?? "", other.name ?? "")
    );
    assert(rows.length <= MAXIMUM_ROWS, "a level stays inside the fight's stated bound");
    return rows;
}

function getLargestFigure(figures: readonly number[]): number {
    assert(figures.every((one) => Number.isFinite(one)), "a screen draws figures that are numbers");
    let largest = 0;
    for (const figure of figures) {
        if (figure > largest) largest = figure;
    }
    assert(figures.every((one) => one <= largest), "and none of them stands above the biggest");
    return largest;
}

function getFill(figure: number, largest: number): number {
    assert(figure >= 0, "a bar is drawn for a figure that is not below nothing");
    assert(largest >= 0, "and against a screen whose biggest figure is not either");
    if (largest <= 0) return 0;
    return figure / largest;
}

/**
 * The fight as a headcount, and it counts the people the list draws rather than the ones the
 * statistics measured: the two are the same list only once everybody has acted, so a header
 * reading off the other set says `2 vs 1` over eleven rows for the opening payloads of a group
 * fight. Sides in the order the panel puts them in everywhere: the reader's own first.
 */
function composeHeadcount(
    statistics: FightStatistics,
    roster: CombatantRoster,
    readerSide: number | null,
): { sizes: number[]; unplaced: number } {
    const countBySide = new Map<number, number>();
    let unplaced = 0;
    const everybody = new Set<number>([...statistics.byCombatantId.keys(), ...roster.byId.keys()]);
    assert(everybody.size <= MAXIMUM_ROWS, "a fight stays inside the headcount it is bounded to");
    for (const combatantId of everybody) {
        const side = roster.byId.get(combatantId)?.side ?? null;
        if (side === null) unplaced += 1;
        else countBySide.set(side, (countBySide.get(side) ?? 0) + 1);
    }
    const sides = [...countBySide].sort(([one], [other]) => {
        if (readerSide === one) return -1;
        if (readerSide === other) return 1;
        return one - other;
    });
    assert(unplaced >= 0, "a headcount of people on no side is never below nothing");
    return { sizes: sides.map(([, count]) => count), unplaced };
}

function getIsOurSideNamed(
    roster: CombatantRoster,
    readerSide: number,
    names: readonly string[],
): boolean {
    assert(Number.isFinite(readerSide), "a seat is read from a side the client stated");
    assert(names.every((one) => one.length > 0), "and against names the protocol wrote out");
    for (const name of names) {
        const combatantId = getCombatantIdByName(roster, name);
        if (combatantId === null) continue;
        if (roster.byId.get(combatantId)?.side === readerSide) return true;
    }
    return false;
}

/**
 * How the fight went **from the reader's seat**, or nothing at all.
 *
 * The protocol names both sides and says nothing about which is the reader's, so the answer is
 * composed here. Without a seat, or where no name resolves, the header says nothing: a fight the
 * panel cannot place is not a fight it may call a loss. A draw is the one answer needing no seat
 * — the game states it by naming nobody, so it is the same word for everybody in the fight.
 */
function getOutcomeForReader(
    statistics: FightStatistics,
    roster: CombatantRoster,
    readerSide: number | null,
): PanelOutcome | null {
    if (statistics.outcome === null) return null;
    return getOutcomeForSeat(statistics.outcome, roster, readerSide);
}

export function getOutcomeForSeat(
    outcome: FightOutcome,
    roster: CombatantRoster,
    readerSide: number | null,
): PanelOutcome | null {
    assert(
        outcome.wonNames.every((one) => one.length > 0),
        "a side is named by names that say something",
    );
    if (outcome.isDrawn) return "drawn";
    if (readerSide === null) return null;
    if (getIsOurSideNamed(roster, readerSide, outcome.wonNames)) return "won";
    if (getIsOurSideNamed(roster, readerSide, outcome.lostNames)) return "lost";
    return null;
}

/**
 * The pinned rows, each with the share its standing gives it: one apportioned with the ranking,
 * one rounded on its own, because a cut and the rows it is a cut of overlap on purpose.
 */
function composePinnedRows(
    pinned: ReadonlyArray<Omit<PinnedRow, "fill" | "shareText">>,
    apartShares: readonly string[],
    whole: number,
    largest: number,
): PinnedRow[] {
    assert(pinned.length <= 2, "a screen pins the two ends the protocol can leave out, at most");
    assert(whole >= 0, "and divides by a whole that is never below nothing");
    let taken = 0;
    return pinned.map((one) => {
        const shareText = one.standing === "apart"
            ? apartShares[taken++] ?? ""
            : composeShareText(whole === 0 ? 0 : one.figure / whole);
        return { ...one, fill: getFill(one.figure, largest), shareText };
    });
}

export function composePanelReading(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    choice: PanelSideChoice,
    readerSide: number | null,
    doubts: FightDoubts,
): PanelReading {
    assert(metric.length > 0, "a reading is composed for a screen asked for by name");
    const listed = composeUnsharedRows(statistics, roster, metric).filter((row) =>
        getIsRowListed(row.side, choice, readerSide)
    );
    listed.sort(compareRows);
    const total = getListedTotal(statistics, listed, metric, choice);
    const pinned = composePinnedFigures(statistics, roster, listed, metric, choice, readerSide);
    // Only a figure standing apart joins the whole: one standing as a cut is already inside the
    // rows, so paying it out of the hundred would take a point off a row that owns one.
    const apart = pinned.filter((one) => one.standing === "apart");
    const whole = apart.reduce((sum, one) => sum + one.figure, total);
    const shared = [...listed.map((row) => row.figure), ...apart.map((one) => one.figure)];
    const shares = composeShareTexts(shared, whole);
    const largest = getLargestFigure([...shared, ...pinned.map((one) => one.figure)]);
    const rows = listed.map((row, at) => ({
        ...row,
        fill: getFill(row.figure, largest),
        shareText: shares[at] ?? "",
        detail: composeRowDetailFor(statistics, roster, row.combatantId),
    }));
    assert(rows.length <= MAXIMUM_ROWS, "a list stays inside the fight's stated bound");
    assert(rows.every((one) => one.shareText.length > 0), "and every row states a share");
    const isEveryone = choice === "everyone" || readerSide === null;
    assert(!isEveryone || rows.length >= roster.byId.size, "everybody listed is everybody drawn");
    const sides = composePanelSides(statistics, roster, metric, readerSide);
    assertWholeIsTheSide(whole, sides, getPartListed(choice, readerSide));
    return {
        rows,
        outcome: getOutcomeForReader(statistics, roster, readerSide),
        ...composeHeadcount(statistics, roster, readerSide),
        total,
        pinned: composePinnedRows(pinned, shares.slice(listed.length), whole, largest),
        warnings: composeWarnings(statistics, metric, doubts),
        sides,
        visibleRows: choice === "everyone" ? RANKING_ROWS : SIDE_ROWS,
    };
}

/**
 * What a one-side list divides its shares by is the figure the strip states for that side, and
 * the two are read apart: the list off each row's own figure, the strip off the row the game did
 * name. A charge that stopped agreeing with the list it stands over is a broken invariant, not a
 * figure that quietly moved. **ADR 0036.**
 */
function assertWholeIsTheSide(
    whole: number,
    sides: PanelSides | null,
    part: PanelSidePart | null,
): void {
    assert(whole >= 0, "a list divides by a whole that is never below nothing");
    if (part === null) return;
    if (sides === null) return;
    const stated = part === "ours" ? sides.ours : sides.theirs;
    assertEquals(whole, stated, "a one-side list divides by that side's own figure");
}

/** Null without a seat: two sides nothing can tell apart are not two figures. */
export interface PanelSides {
    ours: number;
    theirs: number;
    nobody: number;
}

/** Which part of the bar a figure belongs to. `nobody` is a refusal, never a third side. */
type PanelSidePart = "ours" | "theirs" | "nobody";

function getPartOfSide(side: number | null, readerSide: number | null): PanelSidePart {
    assert(side === null || Number.isFinite(side), "a side a row states is a number or nothing");
    assert(readerSide === null || Number.isFinite(readerSide), "and so is the reader's own");
    if (side === null) return "nobody";
    if (readerSide === null) return "nobody";
    return side === readerSide ? "ours" : "theirs";
}

/**
 * Which side is charged with a figure the protocol left half-named — **the one inference this
 * panel draws, and the only place it draws one. ADR 0013.**
 *
 * The known end is a side: the roster places the row the message did name. The unknown end is
 * derived from it, and the derivation is the noun's — damage crosses, healing does not. What is
 * never derived is a **name**: the pinned rows go on saying which end the game left out.
 */
function getPartCharged(part: PanelSidePart, metric: PanelMetric): PanelSidePart {
    assert(metric.length > 0, "a figure is charged on a screen asked for by name");
    assert(SCREEN_ORDER.includes(metric), "and one the strips draw");
    if (part === "nobody") return part;
    if (metric === "healthGiven") return part;
    if (metric === "healthRestored") return part;
    return part === "ours" ? "theirs" : "ours";
}

function getHalfNamed(figures: CombatantFigures, metric: PanelMetric): number {
    assert(figures.damageTakenFromNobody >= 0, "a half-named figure is never below nothing");
    if (metric === "damageDealtApplied") return figures.damageTakenFromNobody;
    if (metric === "damageTakenApplied") return figures.damageDealtToNobody;
    if (metric === "healthGiven") return figures.healthRestoredByNobody;
    return 0;
}

/** What names neither end, which belongs to no side at all and is only ever damage. */
function getWithNeitherEnd(statistics: FightStatistics, metric: PanelMetric): number {
    assert(statistics.byNeitherEnd >= 0, "what names neither end is never below nothing");
    assert(SCREEN_ORDER.includes(metric), "and is asked about on a screen the strips draw");
    if (metric === "damageDealtApplied") return statistics.byNeitherEnd;
    if (metric === "damageTakenApplied") return statistics.byNeitherEnd;
    return 0;
}

export function composePanelSides(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    readerSide: number | null,
): PanelSides | null {
    if (readerSide === null) return null;
    const totals: Record<PanelSidePart, number> = { ours: 0, theirs: 0, nobody: 0 };
    assert(statistics.byCombatantId.size <= MAXIMUM_ROWS, "a fight stays inside its stated bound");
    for (const [combatantId, figures] of statistics.byCombatantId) {
        const part = getPartOfSide(roster.byId.get(combatantId)?.side ?? null, readerSide);
        totals[part] += getFigure(figures, metric);
        totals[getPartCharged(part, metric)] += getHalfNamed(figures, metric);
    }
    totals.nobody += getWithNeitherEnd(statistics, metric);
    assert(totals.ours >= 0, "a side's own figure is never below nothing");
    assert(totals.nobody >= 0, "and neither is what no side can be charged with");
    return totals;
}

export interface ElementRow {
    /** The client's own token. What a reader is shown for it is the panel's, not the reading's. */
    element: string;
    opensPart: boolean;
    figure: number;
    fill: number;
    shareText: string;
}

export interface UnnamedRow {
    figure: number;
    fill: number;
    shareText: string;
}

/**
 * What a row of a cut stands for: what an announcement called it, the key the protocol wrote it
 * under, or the kind the blows carried. A discriminant rather than a name that may be any of the
 * three, because they are worded from different tables — `heal` is in the gain table and the loss
 * table both, and named from the wrong one it reads as a kind of damage.
 */
export type NamedPart =
    | { kind: "skill"; name: string }
    | { kind: "source"; source: string }
    | { kind: "element"; element: string };

/** The text a part is ordered by where two of them come to the same figure. */
export function getTextForNamedPart(part: NamedPart | { kind: "plain" }): string {
    if (part.kind === "skill") return part.name;
    if (part.kind === "source") return part.source;
    if (part.kind === "element") return part.element;
    return "";
}

export interface SkillRow {
    part: NamedPart;
    opensPart: boolean;
    /**
     * How many times it was announced, and null where a count would be a claim the protocol
     * never makes — the section below says under which heading that happens.
     */
    uses: number | null;
    figure: number;
    fill: number;
    shareText: string;
}

/**
 * It carries a count where the rows above it carry one, because that is the question a plain
 * attack raises and the figure alone cannot answer it.
 */
export interface PlainRow {
    /** Null where nothing is counted: only a blow is counted, and health moving is not one. */
    blows: number | null;
    figure: number;
    fill: number;
    shareText: string;
}

export interface SkillCut {
    rows: SkillRow[];
    plain: PlainRow | null;
}

/**
 * The card stands over this row too, so the row carries what the card states — the same figures
 * the ranking's own row holds, because the card is about the person and not about the cut.
 */
export interface OpponentRow extends PersonRow {
    opensPair: boolean;
}

export interface OpponentCut {
    rows: OpponentRow[];
    unnamed: UnnamedRow | null;
}

export interface ElementCut {
    rows: ElementRow[];
    unnamed: UnnamedRow | null;
}

/** The same, plus the row that closes a section against the figure over it. */
export type PairPart = NamedPart | { kind: "plain" };

/** No count, whichever kind it is, and the section below says why one would be wrong. */
export interface PairPartRow {
    part: PairPart;
    figure: number;
    fill: number;
    shareText: string;
}

/**
 * The last rung. Nothing on it opens, in any screen: the protocol states no further cut of a pair
 * than what one of them announced, the key it moved under, and the kinds those blows carried.
 *
 * The parts are **one** list because they are drawn as one section, and a section accounts for the
 * whole of the figure over it. Two lists would be two columns of shares each coming to some part
 * of a hundred, and sorted apart they would put a large row under a small one.
 */
export interface PairReading {
    combatantId: number;
    otherId: number;
    otherName: string | null;
    otherProfession: string | null;
    total: number;
    parts: PairPartRow[];
    byElement: ElementCut;
}

/**
 * The other last rung, and every kind of row in a cut reaches it: whom one skill, one key or one
 * kind of a figure reached, person by person. It is the column the section it was opened from
 * does not have — a name folds every caster's announcement into one row, and this says which of
 * them it came from.
 */
export interface PartReading {
    part: NamedPart;
    total: number;
    byOpponent: OpponentCut;
}

export interface DrillReading {
    combatantId: number;
    name: string | null;
    profession: string | null;
    byOpponent: OpponentCut;
    /**
     * What the figure was done with, on the screen the protocol states it for. Empty on the
     * others: what hit you is named and what the other side chose never is.
     */
    bySkill: SkillCut;
    byElement: ElementCut;
    total: number;
}

interface MetricCuts {
    byOpponent: FigureCut;
    /** Null on the one screen whose second cut would word a figure with somebody else's cause. */
    byElement: FigureCut | null;
}

/** Healing given has no cut by key, and the empty map says so outright — whose those keys are
 * is `core/fight-statistics.ts`'s to state, and it does. */
function getCutsForMetric(figures: CombatantFigures, metric: PanelMetric): MetricCuts {
    assert(metric.length > 0, "a screen is asked for by name");
    assert(figures.damageDealtApplied >= 0, "a figure that could be cut is not below nothing");
    if (metric === "damageDealtApplied") {
        return {
            byOpponent: figures.damageDealtByOpponent,
            byElement: figures.damageDealtByElement,
        };
    }
    if (metric === "damageTakenApplied") {
        return {
            byOpponent: figures.damageTakenByOpponent,
            byElement: figures.damageTakenByElement,
        };
    }
    if (metric === "healthGiven") {
        return { byOpponent: figures.healthGivenByReceiver, byElement: null };
    }
    return {
        byOpponent: figures.healthRestoredByGiver,
        byElement: figures.healthRestoredBySource,
    };
}

/** By figure, then by the token, so a cut redrawn without changing states the same order. */
function compareElementRows(one: { element: string; figure: number }, other: {
    element: string;
    figure: number;
}): number {
    assert(one.element.length > 0, "a kind compared is a kind the protocol named");
    if (one.figure !== other.figure) return other.figure - one.figure;
    return one.element < other.element ? -1 : 1;
}

/**
 * ⚠️ **The remainder here is nothing, on every screen, and the row for it is unreached.** Each
 * writer of a figure in `src/core/fight-statistics.ts` writes the kind it moved under in the same
 * breath — a blow's elements beside its applied damage, a bare movement's key beside the health it
 * took, a restoring key beside what it put back — so a kind cut comes to the figure it is a cut
 * of. Measured over `captures/` on 2026-08-30: 0 of 1,060 combatant-and-screen readings.
 *
 * It stays rather than becoming an assertion, unlike the one `composeSkillCut` keeps. That
 * invariant is one condition over one movement; this one is four call sites agreeing, and a fifth
 * that forgot the cut should leave a reader a row saying so rather than a region that failed to
 * draw.
 */
function composeElementCut(
    cut: FigureCut,
    total: number,
    opens: (element: string) => boolean,
): ElementCut {
    assert(total >= 0, "a figure being cut is never below nothing");
    const stated: Array<{ element: string; figure: number }> = [];
    let held = 0;
    for (const [element, figure] of cut) {
        assert(figure >= 0, "a part of a figure is never below nothing");
        held += figure;
        // A part that came to nothing is not a part of the figure: it takes a row and adds none
        // of it. The combatant at zero on a ranking is the other case and is still drawn — that
        // is a person who did nothing, and this is a nothing that has no person.
        if (figure > 0) stated.push({ element, figure });
    }
    stated.sort(compareElementRows);
    assert(held <= total, "the kinds a figure was dealt in come to no more than that figure");
    const unnamed = total - held;
    const figures = unnamed > 0 ? [...stated.map((one) => one.figure), unnamed] : stated.map((
        one,
    ) => one.figure);
    const shares = composeShareTexts(figures, total);
    const largest = getLargestFigure(figures);
    return {
        rows: stated.map((one, at) => ({
            ...one,
            opensPart: opens(one.element),
            fill: getFill(one.figure, largest),
            shareText: shares[at] ?? "",
        })),
        unnamed: unnamed > 0
            ? {
                figure: unnamed,
                fill: getFill(unnamed, largest),
                shareText: shares[stated.length] ?? "",
            }
            : null,
    };
}

/**
 * The remainder is a figure whose other end the protocol never named: health that moved down
 * outside a blow carries the movement and no attacker, so there is nobody to charge it to. Over
 * `captures/` on 2026-08-30 that is 45 of 1,060 combatant-and-screen readings, in 28 of the
 * recordings, and every one of them on damage taken — which is where the protocol states a bare
 * movement and the dealing side never is.
 */
function composeOpponentCut(
    cut: FigureCut,
    statistics: FightStatistics,
    roster: CombatantRoster,
    total: number,
    opens: (otherId: number) => boolean,
): OpponentCut {
    assert(total >= 0, "a figure being cut is never below nothing");
    const stated: UnsharedRow[] = [];
    let held = 0;
    for (const [named, figure] of cut) {
        const other = getIntegerFromText(named);
        if (other === null) continue;
        held += figure;
        const combatant = roster.byId.get(other);
        stated.push({
            combatantId: other,
            name: combatant?.name ?? null,
            side: combatant?.side ?? null,
            profession: combatant?.profession ?? null,
            figure,
        });
    }
    stated.sort(compareRows);
    assert(held <= total, "the ends a figure reached come to no more than that figure");
    const unnamed = total - held;
    const figures = stated.map((one) => one.figure);
    if (unnamed > 0) figures.push(unnamed);
    const shares = composeShareTexts(figures, total);
    const largest = getLargestFigure(figures);
    return {
        rows: stated.map((row, at) => ({
            ...row,
            fill: getFill(row.figure, largest),
            shareText: shares[at] ?? "",
            opensPair: opens(row.combatantId),
            detail: composeRowDetailFor(statistics, roster, row.combatantId),
        })),
        unnamed: unnamed > 0
            ? {
                figure: unnamed,
                fill: getFill(unnamed, largest),
                shareText: shares[stated.length] ?? "",
            }
            : null,
    };
}

interface UnsharedPart {
    part: NamedPart;
    /**
     * How many times it was announced, and null where a count would be a claim the protocol
     * never makes — `SkillRow` says under which heading that happens.
     */
    uses: number | null;
    figure: number;
}

/** The same row once the level under it has been composed and counted. */
interface UnsharedSkill extends UnsharedPart {
    opensPart: boolean;
}

/**
 * What the game named and no announcement did, as rows of its own rather than as a row saying the
 * game had not told us — because it had.
 *
 * The help calls `heal` an effect spread over time, fired in a turn the combatant stands below the
 * health they started the fight with and weakening by a twentieth of its opening value each time
 * (article `view,372`, read 2026-08-26): what is missing over it is an **announcement**, not a
 * name, and a player reads a row saying otherwise as the panel having lost the figure. Over
 * `captures/` on 2026-08-30 the whole of it is three keys — `heal` 89.1%, `legbon_lastheal` 7.9%
 * and `legbon_holytouch_heal` 3.0%, of 1,429,693 points — and the last two are legendary bonuses
 * rather than a regeneration, which is why the section names each and not the lot.
 */
function composeSourceRows(cut: FigureCut): UnsharedPart[] {
    assert(cut.size <= MAXIMUM_CUT_PARTS, "a cut stays inside the bound it is kept to");
    const stated: UnsharedPart[] = [];
    for (const [source, figure] of cut) {
        // No count: the protocol states no number of applications of a key.
        if (figure > 0) stated.push({ part: { kind: "source", source }, uses: null, figure });
    }
    return stated;
}

/**
 * What reached this combatant, under the name it was announced by and never under whose it was:
 * two healers both announcing `Leczenie ran` put health in under one name, and this screen has no
 * column that could tell the two apart. A combatant's own casts count — health somebody put into
 * themselves is health they received.
 *
 * The announcement is kept on the record of whoever made it, so a received figure is cut by
 * walking everybody rather than by reading one row. Which cut of theirs answers is the caller's:
 * `restoredByOpponent` where health arrived, `dealtByOpponent` where a blow did.
 */
function composeSkillRowsReceived(
    statistics: FightStatistics,
    combatantId: number,
    getCut: (skill: SkillFigures) => FigureCut,
): UnsharedPart[] {
    assert(statistics.byCombatantId.size <= MAXIMUM_ROWS, "a fight stays inside its bound");
    const byName = new Map<string, number>();
    for (const held of statistics.byCombatantId.values()) {
        for (const skill of held.skills.values()) {
            const figure = getCut(skill).get(`${combatantId}`) ?? 0;
            if (figure > 0) byName.set(skill.name, (byName.get(skill.name) ?? 0) + figure);
            assert(byName.size <= MAXIMUM_SKILLS, "a cut stays inside the skills bound");
        }
    }
    // No count: the announcement was somebody else's, and how many times it was made says
    // nothing about how much of what came of it reached this row.
    return [...byName].map(([name, figure]) => ({
        part: { kind: "skill" as const, name },
        uses: null,
        figure,
    }));
}

/**
 * ⚠️ **A section is a cut of the figure over it, so a skill stands in it by what it did and never
 * by having been announced.** An announcement alone let auras, shouts and heals stand under
 * `Zadane` at nothing: 285 of the 685 skill rows over `captures/` on 2026-08-30, and 28 of the 81
 * skills the corpus announces never deal anything at all.
 *
 * A swing that landed nothing still stands, which is what `blows` is for — cast eight times and
 * blocked eight times is a thing the reader did with damage in mind. Not one of those 28 ever
 * struck a blow or stated a figure against a name, so the two claims come apart cleanly.
 */
function composeSkillRows(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    combatantId: number,
): UnsharedSkill[] {
    const stated = composeSkillRowsStated(statistics, figures, metric, combatantId);
    // Asked by composing the level and counting it, rather than by a rule written beside the
    // composer: two spellings of one question disagree silently, and the reader meets the
    // disagreement as an arrow leading nowhere.
    return stated.map((one) => ({
        ...one,
        opensPart: composePartCut(statistics, figures, metric, combatantId, one.part) !== null,
    }));
}

function composeSkillRowsStated(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    combatantId: number,
): UnsharedPart[] {
    assert(SCREEN_ORDER.includes(metric), "a cut is composed for a screen the strips draw");
    if (metric === "healthRestored") {
        return [
            ...composeSkillRowsReceived(statistics, combatantId, (one) => one.restoredByOpponent),
            ...composeSourceRows(figures.healthRestoredWithoutSkillBySource),
        ];
    }
    // No keys beside them: what a blow was made of stands in a section of its own, and putting it
    // here as well would draw it twice.
    if (metric === "damageTakenApplied") {
        return composeSkillRowsReceived(statistics, combatantId, (one) => one.dealtByOpponent);
    }
    const own = [...figures.skills.values()];
    if (metric === "healthGiven") {
        return [
            ...own.filter((one) => one.restored > 0).map((one) => ({
                part: { kind: "skill" as const, name: one.name },
                uses: one.uses,
                figure: one.restored,
            })),
            ...composeSourceRows(getGivenSourceCut(figures)),
        ];
    }
    return own.filter((one) => one.dealt > 0 || one.blows > 0).map((one) => ({
        part: { kind: "skill" as const, name: one.name },
        uses: one.uses,
        figure: one.dealt,
    }));
}

/**
 * The keys behind what this combatant **gave**, folded out of the cut that keeps them per pair.
 *
 * Folded rather than kept flat, and that is the whole of why the flat cut does not exist: a key
 * belongs to whoever received the health, so it may stand on a giver's row only where the row
 * above names the receiver. Here the section is a cut of the giver's own figure and the pairs it
 * is made of are one rung down, so folding is a reading of their own figure and not a claim about
 * somebody else's cause.
 */
function getGivenSourceCut(figures: CombatantFigures): FigureCut {
    const folded = new Map<string, number>();
    for (const cut of figures.healthGivenWithoutSkillByReceiverAndSource.values()) {
        for (const [source, figure] of cut) {
            folded.set(source, (folded.get(source) ?? 0) + figure);
            assert(folded.size <= MAXIMUM_CUT_PARTS, "a cut stays inside the bound it is kept to");
        }
    }
    return folded;
}

/**
 * The closing row is the remainder rather than a second reading, and **every cut that is drawn
 * carries one**: a section whose rows came to less than the figure over them would be a column of
 * shares adding to ninety-something, which is a panel a reader cannot check.
 *
 * Only the dealing screen counts what stands in it. There the remainder is swings the game
 * announced nothing before, and the count is what a figure alone cannot say; on the healing
 * screens it is health that moved under a key naming no skill, which is not a number of
 * anything.
 */
function composeSkillCut(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    total: number,
    combatantId: number,
): SkillCut {
    assert(total >= 0, "a figure being cut is never below nothing");
    const stated = composeSkillRows(statistics, figures, metric, combatantId);
    stated.sort((one, other) =>
        getRankedOrder(
            one.figure,
            other.figure,
            getTextForNamedPart(one.part),
            getTextForNamedPart(other.part),
        )
    );
    const held = stated.reduce((sum, one) => sum + one.figure, 0);
    assert(held <= total, "what the skills came to is no more than the figure they are a cut of");
    // Drawn even where it landed nothing: three blows that were all blocked are three blows, and
    // a section that skipped them would say the combatant never swung.
    const plain = total - held;
    // On the healing screens the keys hold what no announcement did, and by construction: one
    // condition sends a movement to a skill's row or to the key cut, never to both and never to
    // neither. A remainder here is that condition having come apart, not a figure to close against.
    if (getNounForScreen(metric) === "healing") {
        assert(plain === 0, "health that moved is on a skill's row or under the key that moved it");
    }
    const isCounted = metric === "damageDealtApplied";
    const hasPlain = plain > 0 || (isCounted && figures.blowsWithoutSkill > 0);
    const figuresOnScreen = stated.map((one) => one.figure);
    if (hasPlain) figuresOnScreen.push(plain);
    const shares = composeShareTexts(figuresOnScreen, total);
    const largest = getLargestFigure(figuresOnScreen);
    return {
        rows: stated.map((one, at) => ({
            ...one,
            fill: getFill(one.figure, largest),
            shareText: shares[at] ?? "",
        })),
        plain: hasPlain
            ? {
                blows: isCounted ? figures.blowsWithoutSkill : null,
                figure: Math.max(plain, 0),
                fill: getFill(Math.max(plain, 0), largest),
                shareText: shares[stated.length] ?? "",
            }
            : null,
    };
}

/**
 * Whom one part of an opened figure reached, person by person — the level a skill row, a key row
 * or a kind row opens onto, and the same shape whichever of the three it was.
 *
 * ⚠️ **It lists everybody, the one it was opened from included.** Health somebody put into
 * themselves is health they gave, and it stands inside the figure on the row that was pressed: a
 * level narrowed against the caster closed against a smaller number and said nothing about the
 * difference — 31 of the 74 levels a reader could then reach, 143,888 points, the largest single
 * drop 13,167, over `captures/` on 2026-08-30.
 */
export function composePartReading(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    combatantId: number,
    part: NamedPart,
): PartReading | null {
    const figures = statistics.byCombatantId.get(combatantId);
    if (figures === undefined) return null;
    const cut = composePartCut(statistics, figures, metric, combatantId, part);
    if (cut === null) return null;
    const total = getPartTotal(figures, metric, part, cut);
    assert(total >= 0, "a part opened states a figure that is not below nothing");
    return {
        part,
        total,
        byOpponent: composeOpponentCut(cut, statistics, roster, total, () => false),
    };
}

/**
 * The people one part of a figure reached, and null where the statistics keep no such cut. Null
 * is the whole of the register's `never`: a key on the screen about what reached you names no
 * giver, and neither does a kind of it.
 */
function composePartCut(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    combatantId: number,
    part: NamedPart,
): FigureCut | null {
    assert(SCREEN_ORDER.includes(metric), "a part is opened on a screen the strips draw");
    if (part.kind === "skill") {
        return composePartCutForSkill(statistics, figures, metric, combatantId, part.name);
    }
    if (part.kind === "source") {
        // Only the giving side keeps a key per person: a key names whoever received the health,
        // so a received row has no second end to be cut by.
        if (metric !== "healthGiven") return null;
        return composePartCutFromPairs(
            figures.healthGivenWithoutSkillByReceiverAndSource,
            part.source,
        );
    }
    if (metric === "damageDealtApplied") {
        return composePartCutFromPairs(figures.damageDealtByOpponentAndKind, part.element);
    }
    if (metric === "damageTakenApplied") {
        return composePartCutFromPairs(figures.damageTakenByOpponentAndKind, part.element);
    }
    // A key the health moved under is the receiver's, and the giver is not kept beside it.
    return null;
}

/**
 * An announcement is kept on the record of whoever **made** it, so a skill is read off this row
 * where the direction is giving and off everybody's where it is receiving. The receiving side is
 * the level worth the most: the section above folds every caster under one name, and this is the
 * column that says which of them it came from.
 */
function composePartCutForSkill(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    combatantId: number,
    name: string,
): FigureCut | null {
    assert(name.length > 0, "a skill is opened by the name it was announced under");
    const isDamage = getNounForScreen(metric) === "damage";
    if (getDirectionForScreen(metric) === "given") {
        const skill = figures.skills.get(name);
        if (skill === undefined) return null;
        return composePartCutStated(isDamage ? skill.dealtByOpponent : skill.restoredByOpponent);
    }
    assert(statistics.byCombatantId.size <= MAXIMUM_ROWS, "a fight stays inside its bound");
    const reached = new Map<string, number>();
    for (const [otherId, held] of statistics.byCombatantId) {
        for (const skill of held.skills.values()) {
            if (skill.name !== name) continue;
            const cut = isDamage ? skill.dealtByOpponent : skill.restoredByOpponent;
            const figure = cut.get(`${combatantId}`) ?? 0;
            if (figure > 0) reached.set(`${otherId}`, (reached.get(`${otherId}`) ?? 0) + figure);
        }
        assert(reached.size <= MAXIMUM_ROWS, "and so does the level under one of its rows");
    }
    return reached.size === 0 ? null : reached;
}

/** A cut of a cut, read the other way round: the part is named, and the people are the rows. */
function composePartCutFromPairs(
    pairs: ReadonlyMap<string, FigureCut>,
    named: string,
): FigureCut | null {
    assert(named.length > 0, "a part is opened under the name the game wrote it under");
    assert(pairs.size <= MAXIMUM_ROWS, "a fight stays inside its bound");
    const reached = new Map<string, number>();
    for (const [other, cut] of pairs) {
        const figure = cut.get(named) ?? 0;
        if (figure > 0) reached.set(other, figure);
    }
    return reached.size === 0 ? null : reached;
}

/** A reading of the cut and never the cut itself, and a part that came to nothing is no part. */
function composePartCutStated(cut: FigureCut): FigureCut | null {
    assert(cut.size <= MAXIMUM_ROWS, "a part reaches the people a fight holds, at most");
    const stated = new Map<string, number>();
    for (const [other, figure] of cut) {
        if (figure > 0) stated.set(other, figure);
    }
    return stated.size === 0 ? null : stated;
}

/**
 * The figure the row that was pressed states, and never the sum of the level under it: a blow the
 * protocol tied to nobody is inside what a skill dealt and outside every row of whom it reached,
 * and the difference is the row `composeOpponentCut` draws for nobody. Read off the same field
 * the section read, so a level cannot open under a figure the reader never saw.
 */
function getPartTotal(
    figures: CombatantFigures,
    metric: PanelMetric,
    part: NamedPart,
    cut: FigureCut,
): number {
    if (part.kind === "element") {
        return getCutsForMetric(figures, metric).byElement?.get(part.element) ??
            getTotalFromCut(cut);
    }
    if (part.kind === "skill") {
        if (getDirectionForScreen(metric) === "given") {
            const skill = figures.skills.get(part.name);
            if (skill === undefined) return getTotalFromCut(cut);
            return getNounForScreen(metric) === "damage" ? skill.dealt : skill.restored;
        }
    }
    // What was received under a name, and what a key gave, are read by folding the same cut the
    // level is: the section above states no second figure for either.
    return getTotalFromCut(cut);
}

/**
 * Null where the pair states nothing: a combatant the fight does not hold, or two the screen's own
 * figure never passed between.
 */
export function composePairReading(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    combatantId: number,
    otherId: number,
): PairReading | null {
    const figures = statistics.byCombatantId.get(combatantId);
    if (figures === undefined) return null;
    const total = getPairTotal(figures, metric, otherId);
    if (total === null) return null;
    const kinds = getPairKinds(figures, metric, otherId);
    const held = roster.byId.get(otherId);
    assert(total >= 0, "what passed between two combatants is never below nothing");
    return {
        combatantId,
        otherId,
        otherName: held?.name ?? null,
        otherProfession: held?.profession ?? null,
        total,
        parts: composePairParts(statistics, metric, combatantId, otherId, total),
        // Nothing on the last rung opens: the protocol states no further cut of a pair.
        byElement: kinds === null
            ? { rows: [], unnamed: null }
            : composeElementCut(kinds, total, () => false),
    };
}

function getPairKinds(
    figures: CombatantFigures,
    metric: PanelMetric,
    otherId: number,
): FigureCut | null {
    assert(Number.isSafeInteger(otherId), "the other end of a pair is named by a number");
    if (metric === "damageDealtApplied") {
        return figures.damageDealtByOpponentAndKind.get(`${otherId}`) ?? null;
    }
    if (metric === "damageTakenApplied") {
        return figures.damageTakenByOpponentAndKind.get(`${otherId}`) ?? null;
    }
    return null;
}

/**
 * What passed between the two, on the screen being read — and null where nothing did, which is a
 * pair that does not exist rather than one standing at nothing. It is the whole of the question a
 * person row inside an opened row is asked: where there is a figure between the two, the level
 * exists and the row opens onto it.
 *
 * On healing it is read off the flat cut the opponent row above it was drawn from, so an opened
 * pair states the figure that was pressed rather than a sum of the rows under it. A cut of the
 * skills would close against a figure nobody pressed: a pair no announcement covered would come to
 * nothing and open onto an empty level.
 *
 * One branch per screen rather than a fall-through past the kinds: a damage screen whose cut of a
 * cut was missing an opponent the flat cut holds would answer with a figure off the healing maps,
 * and a figure under the wrong noun is the one thing a drill must never state.
 */
function getPairTotal(
    figures: CombatantFigures,
    metric: PanelMetric,
    otherId: number,
): number | null {
    assert(Number.isSafeInteger(otherId), "the other end of a pair is named by a number");
    if (getNounForScreen(metric) === "damage") {
        const kinds = getPairKinds(figures, metric, otherId);
        return kinds === null ? null : getTotalFromCut(kinds);
    }
    if (metric === "healthGiven") return figures.healthGivenByReceiver.get(`${otherId}`) ?? null;
    return figures.healthRestoredByGiver.get(`${otherId}`) ?? null;
}

function getTotalFromCut(cut: FigureCut): number {
    let total = 0;
    for (const figure of cut.values()) total += figure;
    assert(Number.isSafeInteger(total), "a total stays inside what a number holds exactly");
    assert(total >= 0, "and is never below nothing");
    return total;
}

interface UnsharedPairPart {
    part: PairPart;
    figure: number;
}

function getTotalFromParts(parts: readonly UnsharedPairPart[]): number {
    let total = 0;
    for (const one of parts) {
        assert(one.figure > 0, "a part that is drawn is a part with a figure in it");
        total += one.figure;
    }
    assert(Number.isSafeInteger(total), "a total stays inside what a number holds exactly");
    return total;
}

/**
 * Whose row a pair's parts are read off, and how the cuts on it are keyed.
 *
 * It turns on the **direction** rather than on the quantity: mine where I gave it, theirs where I
 * received it. Written as a test for damage it would read as a fact about damage and be a fact
 * about giving, which is what kept healing off this rung.
 */
function getPairGivingEnd(
    statistics: FightStatistics,
    metric: PanelMetric,
    combatantId: number,
    otherId: number,
): { figures: CombatantFigures | undefined; subject: string } {
    assert(SCREEN_ORDER.includes(metric), "a pair is read for a screen the strips draw");
    if (getDirectionForScreen(metric) === "received") {
        return { figures: statistics.byCombatantId.get(otherId), subject: `${combatantId}` };
    }
    return { figures: statistics.byCombatantId.get(combatantId), subject: `${otherId}` };
}

/**
 * What an announcement put behind this one pair, and what the game named for it with nothing
 * announced in front. Both on the same list because they make up one section: the keys hold what
 * the announcements do not, and a reader adding the column gets the figure they pressed.
 *
 * The keys are healing's alone. On the damage screens what a blow was made of stands in a section
 * of its own beside this one, and putting it here as well would draw it twice.
 */
function composePairPartFigures(
    statistics: FightStatistics,
    metric: PanelMetric,
    combatantId: number,
    otherId: number,
): UnsharedPairPart[] {
    const end = getPairGivingEnd(statistics, metric, combatantId, otherId);
    if (end.figures === undefined) return [];
    const isDamage = getNounForScreen(metric) === "damage";
    const stated: UnsharedPairPart[] = [];
    for (const skill of end.figures.skills.values()) {
        const figure = isDamage
            ? skill.dealtByOpponent.get(end.subject) ?? 0
            : skill.restoredByOpponent.get(end.subject) ?? 0;
        if (figure > 0) stated.push({ part: { kind: "skill", name: skill.name }, figure });
    }
    assert(stated.length <= MAXIMUM_SKILLS, "a cut stays inside the skills bound");
    if (isDamage) return stated;
    const cut = end.figures.healthGivenWithoutSkillByReceiverAndSource.get(end.subject);
    if (cut === undefined) return stated;
    for (const [source, figure] of cut) {
        if (figure > 0) stated.push({ part: { kind: "source", source }, figure });
    }
    return stated;
}

/**
 * The section an opened pair is, sorted once over the whole of it.
 *
 * ⚠️ **Sorted here rather than where each kind of part was gathered.** Appending the keys after an
 * ordered list of skills puts a key larger than every skill at the bottom of the column, which is
 * the one thing a list of bars says without being read.
 *
 * The closing row carries no count: an announcement is counted where it was made, and the protocol
 * states no number of anything against one opponent rather than another.
 */
function composePairParts(
    statistics: FightStatistics,
    metric: PanelMetric,
    combatantId: number,
    otherId: number,
    total: number,
): PairPartRow[] {
    assert(total >= 0, "a figure being cut is never below nothing");
    const stated = composePairPartFigures(statistics, metric, combatantId, otherId);
    stated.sort((one, other) =>
        getRankedOrder(
            one.figure,
            other.figure,
            getTextForNamedPart(one.part),
            getTextForNamedPart(other.part),
        )
    );
    const held = getTotalFromParts(stated);
    assert(held <= total, "what the parts came to is no more than what passed between the two");
    const plain = total - held;
    const figures = stated.map((one) => one.figure);
    if (plain > 0) figures.push(plain);
    const shares = composeShareTexts(figures, total);
    const largest = getLargestFigure(figures);
    const rows: PairPartRow[] = stated.map((one, at) => ({
        part: one.part,
        figure: one.figure,
        fill: getFill(one.figure, largest),
        shareText: shares[at] ?? "",
    }));
    if (plain > 0) {
        rows.push({
            part: { kind: "plain" },
            figure: plain,
            fill: getFill(plain, largest),
            shareText: shares[stated.length] ?? "",
        });
    }
    return rows;
}

export function composeDrillReading(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    combatantId: number,
): DrillReading | null {
    const held = roster.byId.get(combatantId);
    // Every row of a ranking opens, including a combatant nothing has named yet: they are on the
    // list at zero, and a row that drew nothing when it was pressed would leave the panel saying
    // the press did not land. What they open onto is the sentence saying they did nothing.
    const figures = statistics.byCombatantId.get(combatantId) ??
        (held === undefined ? undefined : composeCombatantFigures());
    if (figures === undefined) return null;
    const cuts = getCutsForMetric(figures, metric);
    const total = getFigure(figures, metric);
    const byOpponent = composeOpponentCut(
        cuts.byOpponent,
        statistics,
        roster,
        total,
        (otherId) => getPairTotal(figures, metric, otherId) !== null,
    );
    const byElement = cuts.byElement === null ? { rows: [], unnamed: null } : composeElementCut(
        cuts.byElement,
        total,
        (element) =>
            composePartCut(statistics, figures, metric, combatantId, {
                kind: "element",
                element,
            }) !== null,
    );
    assert(byOpponent.rows.length <= MAXIMUM_ROWS, "an opened row stays inside the fight's bound");
    assert(byElement.rows.every((one) => one.figure >= 0), "and no kind of it is below nothing");
    return {
        combatantId,
        name: held?.name ?? null,
        profession: held?.profession ?? null,
        byOpponent,
        bySkill: composeSkillCut(statistics, figures, metric, total, combatantId),
        byElement,
        total,
    };
}
