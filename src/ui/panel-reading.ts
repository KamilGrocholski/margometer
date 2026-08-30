/**
 * One screen's worth of a fight: the rows, in the order they are drawn.
 *
 * A row's figure is the one the statistics already hold, and no figure here is ever recomputed
 * from the events. The one sum this file does is the listed side's total, which the statistics
 * cannot hold because nothing under `ui/` tells them who is on which side — and without it a
 * share on a one-side list would be measured against a whole the list does not show.
 */

import { getRankedOrder } from "@/src/ui/ranked-order.ts";
import { assert } from "@std/assert";
import { type CombatantRoster, getCombatantIdByName } from "@/src/core/combatant-roster.ts";
import {
    type CombatantFigures,
    composeCombatantFigures,
    type FightOutcome,
    type FightStatistics,
    type FigureCut,
} from "@/src/core/fight-statistics.ts";
import { getIntegerFromText } from "@/libs/number-text.ts";
import { type PanelSideChoice, SCREEN_ORDER, SIDE_CHOICES } from "@/src/ui/panel-screen.ts";
import {
    composeJoinedInProgressWarning,
    composeLostMessageWarning,
    composeShareText,
    composeShareTexts,
    composeUnplacedHealWarning,
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
    damageDealtRaw: number;
    damageTakenApplied: number;
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
}

/**
 * One part of a cut, under the protocol's own key. What a reader is shown for that key is the
 * panel's to say and never this file's, the way an element's token reaches `ElementRow`.
 */
export interface CutPart {
    key: string;
    figure: number;
}

export interface RankingRow extends PanelRow {
    detail: RowDetail;
}

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

export interface PinnedRow {
    end: PanelUnnamedEnd;
    standing: PinnedStanding;
    figure: number;
    fill: number;
    shareText: string;
}

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
 * A combatant with no side belongs to neither, so a one-side list leaves them out rather than
 * putting them on the side that happens to be showing; they are drawn under everybody, where
 * saying nothing about their side costs nothing. Where the client never said which side is the
 * reader's own, every list is everybody: a filter that cannot tell the two apart is a filter that
 * would guess.
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
        damageDealtRaw: figures.damageDealtRaw,
        damageTakenApplied: figures.damageTakenApplied,
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
    };
}

/** By figure, then by id, so a fight redrawn without changing states the same order. */
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
 * Shown only where everybody is listed. It belongs to nobody, so it belongs to no side either,
 * and putting it inside one side's total would be claiming a side the log never stated.
 */
function composePinnedFigures(
    statistics: FightStatistics,
    metric: PanelMetric,
    choice: PanelSideChoice,
): Array<{ end: PanelUnnamedEnd; standing: PinnedStanding; figure: number }> {
    assert(SIDE_CHOICES.includes(choice), "a figure is pinned for a choice a reader could make");
    assert(statistics.dealtByNobody >= 0, "and one that is never below nothing");
    if (choice !== "everyone") return [];
    const found: Array<{ end: PanelUnnamedEnd; standing: PinnedStanding; figure: number }> = [];
    if (metric === "damageDealtApplied") {
        found.push({ end: "actor", standing: "apart", figure: statistics.dealtByNobody });
    }
    if (metric === "healthGiven") {
        found.push({ end: "actor", standing: "apart", figure: statistics.givenByNobody });
    }
    if (metric === "damageTakenApplied") {
        found.push({
            end: "actor",
            standing: "cut",
            figure: getHalfNamedTotal(statistics, metric),
        });
        found.push({ end: "target", standing: "apart", figure: statistics.takenByNobody });
    }
    if (metric === "healthRestored") {
        found.push({
            end: "actor",
            standing: "cut",
            figure: getHalfNamedTotal(statistics, metric),
        });
    }
    return found.filter((one) => one.figure > 0);
}

/**
 * As much of what the rows on this screen hold as the protocol named only one end of — the end
 * being the row itself. It is what the received screens can say and the given ones cannot: a row
 * that took damage holds the blow whether or not anybody was named for striking it.
 *
 * Not the same reading as the one the two sides are charged from, which asks the opposite
 * question: there the named end is the row and the figure belongs to whoever is not on it.
 */
function getHalfNamedTotal(statistics: FightStatistics, metric: PanelMetric): number {
    assert(statistics.byCombatantId.size <= MAXIMUM_ROWS, "a fight stays inside its stated bound");
    assert(metric.length > 0, "and a screen asked for by name");
    let total = 0;
    for (const figures of statistics.byCombatantId.values()) {
        if (metric === "damageTakenApplied") total += figures.damageTakenFromNobody;
        if (metric === "healthRestored") total += figures.healthRestoredByNobody;
    }
    return total;
}

function getLargestFigure(figures: readonly number[]): number {
    assert(figures.length >= 0, "a screen states the figures it draws, however few");
    let largest = 0;
    for (const figure of figures) {
        if (figure > largest) largest = figure;
    }
    assert(largest >= 0, "the biggest figure on a screen is never below nothing");
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
 * composed here. Where the client never said which side is the reader's own, or where no name
 * resolves, the header says nothing: a fight the panel cannot place is not a fight it may call a
 * loss. A draw is the one answer needing no seat — the game states it by naming nobody, so it is
 * the same word for everybody in the fight.
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
    assert(outcome.wonNames.length >= 0, "a side that is named is named in full, or not at all");
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
    pinned: ReadonlyArray<{ end: PanelUnnamedEnd; standing: PinnedStanding; figure: number }>,
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
    const pinned = composePinnedFigures(statistics, metric, choice);
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
        detail: composeRowDetail(
            statistics.byCombatantId.get(row.combatantId) ?? composeCombatantFigures(),
            roster.byId.get(row.combatantId)?.level ?? null,
        ),
    }));
    assert(rows.length <= MAXIMUM_ROWS, "a list stays inside the fight's stated bound");
    assert(rows.every((one) => one.shareText.length > 0), "and every row states a share");
    const isEveryone = choice === "everyone" || readerSide === null;
    assert(!isEveryone || rows.length >= roster.byId.size, "everybody listed is everybody drawn");
    return {
        rows,
        outcome: getOutcomeForReader(statistics, roster, readerSide),
        ...composeHeadcount(statistics, roster, readerSide),
        total,
        pinned: composePinnedRows(pinned, shares.slice(listed.length), whole, largest),
        warnings: composeWarnings(statistics, metric, doubts),
        sides: composePanelSides(statistics, roster, metric, readerSide),
        visibleRows: choice === "everyone" ? RANKING_ROWS : SIDE_ROWS,
    };
}

/**
 * Null where the client never said which side is the reader's own: two sides nothing can tell
 * apart are not two figures.
 */
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
    figure: number;
    fill: number;
    shareText: string;
}

export interface UnnamedRow {
    figure: number;
    fill: number;
    shareText: string;
}

export interface SkillRow {
    name: string;
    opensSkill: boolean;
    /**
     * How many times it was announced, and null where nothing states a count: an announcement is
     * counted where it was made, and the protocol says nothing about how many blows fell on one
     * opponent rather than another.
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

export interface OpponentRow extends PanelRow {
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

/**
 * One row of a pair's own section, and what it stands for. A discriminant rather than a name that
 * may be a key: the two are worded from different tables, and `heal` is in both of them running
 * opposite ways — named from the wrong one it reads as a kind of damage.
 */
export type PairPart =
    | { kind: "skill"; name: string }
    | { kind: "source"; source: string }
    | { kind: "plain" };

/**
 * No count, whichever kind it is. An announcement is counted where it was made, and the protocol
 * states no number of anything against one opponent rather than another.
 */
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
 * The other last rung, and the only one a skill has. It exists on the giving side of healing
 * alone: what a skill did to somebody is stated on the row of whoever announced it, and a screen
 * about what reached **you** cuts by the skills that reached you rather than by their targets.
 */
export interface SkillReading {
    name: string;
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

/**
 * Healing given has no cut by key and the empty map says so outright: the keys the protocol
 * names belong to whoever received the health, so putting one under the giver's row would word
 * their figure with a cause that is not theirs.
 */
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
 * The remainder is health that moved down outside a blow: the message carries the movement and no
 * kind, so there is nothing to charge it to. Over `captures/` on 2026-08-29 that is 45 of 530
 * combatant-and-screen pairs, in 28 of the recordings, and every one of them on damage taken —
 * which is where the protocol states a bare movement and the dealing side never is.
 */
function composeElementCut(cut: FigureCut, total: number): ElementCut {
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

function composeOpponentCut(
    cut: FigureCut,
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

interface UnsharedSkill {
    name: string;
    uses: number | null;
    figure: number;
    opensSkill: boolean;
}

/**
 * What reached this combatant, under the name it was announced by and never under whose it was:
 * two healers both announcing `Leczenie ran` put health in under one name, and this screen has no
 * column that could tell the two apart. A combatant's own casts count — health somebody put into
 * themselves is health they received.
 */
function composeSkillRowsReceived(
    statistics: FightStatistics,
    combatantId: number,
): UnsharedSkill[] {
    assert(statistics.byCombatantId.size <= MAXIMUM_ROWS, "a fight stays inside its bound");
    const byName = new Map<string, number>();
    for (const held of statistics.byCombatantId.values()) {
        for (const skill of held.skills.values()) {
            const figure = skill.restoredByOpponent.get(`${combatantId}`) ?? 0;
            if (figure > 0) byName.set(skill.name, (byName.get(skill.name) ?? 0) + figure);
            assert(byName.size <= MAXIMUM_SKILLS, "a cut stays inside the skills bound");
        }
    }
    // No count: the announcement was somebody else's, and how many times it was made says
    // nothing about how much of what it put back reached this row.
    return [...byName].map(([name, figure]) => ({ name, uses: null, figure, opensSkill: false }));
}

function composeSkillRows(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    combatantId: number,
): UnsharedSkill[] {
    assert(SCREEN_ORDER.includes(metric), "a cut is composed for a screen the strips draw");
    if (metric === "healthRestored") return composeSkillRowsReceived(statistics, combatantId);
    const own = [...figures.skills.values()];
    if (metric === "healthGiven") {
        return own.filter((one) => one.restored > 0).map((one) => ({
            name: one.name,
            uses: one.uses,
            figure: one.restored,
            opensSkill: getOpensSkill(figures, metric, combatantId, one.name),
        }));
    }
    return own.filter((one) => one.dealt > 0 || one.uses > 0).map((one) => ({
        name: one.name,
        uses: one.uses,
        figure: one.dealt,
        opensSkill: false,
    }));
}

/**
 * The closing row is the remainder rather than a second reading, and **every cut that is drawn
 * carries one**: a section whose rows came to less than the figure over them would be a column of
 * shares adding to ninety-something, which is a panel a reader cannot check.
 *
 * Only the dealing screen counts what stands in it. There the remainder is swings the game
 * announced nothing before, and the count is what a figure alone cannot say; on the healing
 * screens it is health that moved under a key naming no ability, which is not a number of
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
    if (metric === "damageTakenApplied") return { rows: [], plain: null };
    const stated = composeSkillRows(statistics, figures, metric, combatantId);
    stated.sort((one, other) => getRankedOrder(one.figure, other.figure, one.name, other.name));
    const held = stated.reduce((sum, one) => sum + one.figure, 0);
    assert(held <= total, "what the skills came to is no more than the figure they are a cut of");
    // Drawn even where it landed nothing: three blows that were all blocked are three blows, and
    // a section that skipped them would say the combatant never swung.
    const plain = total - held;
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
 * Null where the screen states no such cut, and null where the skill reached nobody but the
 * combatant it was opened from — that level would name the reader back to themselves.
 */
export function composeSkillReading(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    combatantId: number,
    name: string,
): SkillReading | null {
    assert(name.length > 0, "a skill is opened by the name it was announced under");
    if (metric !== "healthGiven") return null;
    const skill = statistics.byCombatantId.get(combatantId)?.skills.get(name);
    if (skill === undefined) return null;
    const reached = composeReachedCut(skill.restoredByOpponent, combatantId);
    if (reached.size === 0) return null;
    const total = getTotalFromCut(reached);
    assert(total >= 0, "what a skill put back is never below nothing");
    return {
        name: skill.name,
        total,
        byOpponent: composeOpponentCut(reached, roster, total, () => false),
    };
}

/** Everybody but the one who announced it: a level naming them back to themselves says none. */
function composeReachedCut(cut: FigureCut, combatantId: number): FigureCut {
    const reached = new Map<string, number>();
    assert(cut.size <= MAXIMUM_ROWS, "a skill reaches the people a fight holds, at most");
    assert(Number.isSafeInteger(combatantId), "and is read from the row it was opened on");
    for (const [other, figure] of cut) {
        if (other === `${combatantId}`) continue;
        if (figure <= 0) continue;
        reached.set(other, figure);
    }
    return reached;
}

function getOpensSkill(
    figures: CombatantFigures,
    metric: PanelMetric,
    combatantId: number,
    name: string,
): boolean {
    assert(name.length > 0, "a skill is asked about by name");
    if (metric !== "healthGiven") return false;
    const skill = figures.skills.get(name);
    if (skill === undefined) return false;
    return composeReachedCut(skill.restoredByOpponent, combatantId).size > 0;
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
        byElement: kinds === null ? { rows: [], unnamed: null } : composeElementCut(kinds, total),
    };
}

/**
 * It opens where the level under it would say something the row does not, and stays shut where that
 * level would be one row repeating the figure just pressed.
 *
 * Two branches, because the two screens draw a different number of sections. On damage the kinds
 * stand in a section of their own beside the announcements, so more than one kind is already a
 * level worth opening; on healing there is one section, and the honest answer is to compose it and
 * count. Answered by composing the level rather than by a second rule about it: a predicate written
 * alongside the composer is two spellings of one question, and the disagreement is silent — an
 * arrow leading nowhere, or none where there was something to see.
 */
function getOpensPair(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    combatantId: number,
    otherId: number,
): boolean {
    assert(Number.isSafeInteger(otherId), "the other end of a pair is named by a number");
    const kinds = getPairKinds(figures, metric, otherId);
    if (kinds !== null) {
        if (kinds.size > 1) return true;
        // Asked on the one screen that draws them. On the screen about what reached this combatant
        // these rows say what they dealt, so a pair would open onto the row above it and nothing.
        if (metric !== "damageDealtApplied") return false;
        for (const skill of figures.skills.values()) {
            if ((skill.dealtByOpponent.get(`${otherId}`) ?? 0) > 0) return true;
        }
        return false;
    }
    const total = getPairTotal(figures, metric, otherId);
    if (total === null) return false;
    const stated = composePairPartFigures(statistics, metric, combatantId, otherId);
    const held = getTotalFromParts(stated);
    assert(held <= total, "what the parts came to is no more than what passed between the two");
    return stated.length + (held < total ? 1 : 0) > 1;
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
 * pair that does not exist rather than one standing at nothing.
 *
 * On healing it is read off the flat cut the opponent row above it was drawn from, so an opened
 * pair states the figure that was pressed rather than a sum of the rows under it. A cut of the
 * skills would close against a figure nobody pressed: a pair no announcement covered would come to
 * nothing and open onto an empty level.
 */
function getPairTotal(
    figures: CombatantFigures,
    metric: PanelMetric,
    otherId: number,
): number | null {
    assert(Number.isSafeInteger(otherId), "the other end of a pair is named by a number");
    const kinds = getPairKinds(figures, metric, otherId);
    if (kinds !== null) return getTotalFromCut(kinds);
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

interface UnsharedPart {
    part: PairPart;
    figure: number;
}

/** The text a part is ordered by where two of them come to the same figure. */
function getTextForPairPart(part: PairPart): string {
    if (part.kind === "skill") return part.name;
    if (part.kind === "source") return part.source;
    return "";
}

function getTotalFromParts(parts: readonly UnsharedPart[]): number {
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
    if (metric === "healthRestored") {
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
): UnsharedPart[] {
    if (metric === "damageTakenApplied") return [];
    const end = getPairGivingEnd(statistics, metric, combatantId, otherId);
    if (end.figures === undefined) return [];
    const stated: UnsharedPart[] = [];
    for (const skill of end.figures.skills.values()) {
        const figure = metric === "damageDealtApplied"
            ? skill.dealtByOpponent.get(end.subject) ?? 0
            : skill.restoredByOpponent.get(end.subject) ?? 0;
        if (figure > 0) stated.push({ part: { kind: "skill", name: skill.name }, figure });
    }
    assert(stated.length <= MAXIMUM_SKILLS, "a cut stays inside the skills bound");
    if (metric === "damageDealtApplied") return stated;
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
 * states no number of anything against one opponent rather than another. It is not drawn at all on
 * the screen about what reached this combatant: nothing announces a blow you take, so a section
 * there would be one row saying the figure just pressed under the word for an unannounced swing.
 */
function composePairParts(
    statistics: FightStatistics,
    metric: PanelMetric,
    combatantId: number,
    otherId: number,
    total: number,
): PairPartRow[] {
    assert(total >= 0, "a figure being cut is never below nothing");
    if (metric === "damageTakenApplied") return [];
    const stated = composePairPartFigures(statistics, metric, combatantId, otherId);
    stated.sort((one, other) =>
        getRankedOrder(
            one.figure,
            other.figure,
            getTextForPairPart(one.part),
            getTextForPairPart(other.part),
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
        roster,
        total,
        (otherId) => getOpensPair(statistics, figures, metric, combatantId, otherId),
    );
    const byElement = cuts.byElement === null
        ? { rows: [], unnamed: null }
        : composeElementCut(cuts.byElement, total);
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
