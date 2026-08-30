/**
 * One screen's worth of a fight: the rows, in the order they are drawn.
 *
 * A row's figure is the one the statistics already hold, and no figure here is ever recomputed
 * from the events. The one sum this file does is the listed side's total, which the statistics
 * cannot hold because nothing under `ui/` tells them who is on which side — and without it a
 * share on a one-side list would be measured against a whole the list does not show.
 */

import { assert } from "@std/assert";
import { type CombatantRoster, getCombatantIdByName } from "@/src/core/combatant-roster.ts";
import {
    type CombatantFigures,
    composeCombatantFigures,
    type FightOutcome,
    type FightStatistics,
    type FigureCut,
} from "@/src/core/fight-statistics.ts";
import { getIntegerFromText } from "@/src/core/protocol-number.ts";
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
    parts.sort((one, other) => other.figure - one.figure || (one.key < other.key ? -1 : 1));
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
    blows: number;
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
 * The last rung. Nothing on it opens, in any screen: the protocol states no further cut of a pair
 * than the skills one of them announced and the kinds those blows carried.
 */
export interface PairReading {
    combatantId: number;
    otherId: number;
    otherName: string | null;
    otherProfession: string | null;
    total: number;
    bySkill: SkillCut;
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

function composeSkillRows(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    combatantId: number,
): UnsharedSkill[] {
    assert(SCREEN_ORDER.includes(metric), "a cut is composed for a screen the strips draw");
    if (metric === "healthRestored") {
        const found: UnsharedSkill[] = [];
        assert(statistics.byCombatantId.size <= MAXIMUM_ROWS, "a fight stays inside its bound");
        for (const [ownerId, held] of statistics.byCombatantId) {
            if (ownerId === combatantId) continue;
            for (const skill of held.skills.values()) {
                const figure = skill.restoredByOpponent.get(`${combatantId}`) ?? 0;
                // No count: the announcement was somebody else's, and how many times they made
                // it says nothing about how much of it reached this row.
                if (figure > 0) {
                    found.push({ name: skill.name, uses: null, figure, opensSkill: false });
                }
            }
        }
        return found;
    }
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
 * The closing row is the remainder rather than a second reading: every point dealt came from a
 * blow, and a blow either carried an announcement or did not — so what the skills do not hold is
 * what the plain ones did, and it is drawn with the count only an announcement's absence states.
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
    stated.sort((one, other) => other.figure - one.figure || (one.name < other.name ? -1 : 1));
    const held = stated.reduce((sum, one) => sum + one.figure, 0);
    assert(held <= total, "what the skills came to is no more than the figure they are a cut of");
    // Drawn even where it landed nothing: three blows that were all blocked are three blows, and
    // a section that skipped them would say the combatant never swung. Only the damage a
    // combatant dealt closes this way — there is no such thing as a plain heal, and what no
    // announcement covered on a healing screen is named by the key it moved under instead.
    const plain = total - held;
    const isClosing = metric === "damageDealtApplied";
    const hasPlain = isClosing && (plain > 0 || figures.blowsWithoutSkill > 0);
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
                blows: figures.blowsWithoutSkill,
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
 * Null where the pair states nothing — a combatant the fight does not hold, or a screen whose
 * figure the protocol cuts by no pair at all. Healing is such a screen: the keys it names belong
 * to the row the health moved on, and a pair of a healer and the healed is cut by nothing else.
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
    const kinds = getPairKinds(figures, metric, otherId);
    if (kinds === null) return null;
    const total = getTotalFromCut(kinds);
    const held = roster.byId.get(otherId);
    assert(total >= 0, "what passed between two combatants is never below nothing");
    return {
        combatantId,
        otherId,
        otherName: held?.name ?? null,
        otherProfession: held?.profession ?? null,
        total,
        bySkill: composePairSkillCut(figures, metric, otherId, total),
        byElement: composeElementCut(kinds, total),
    };
}

/**
 * It opens where an announcement named a skill for the pair, or where the blows between them
 * carried more than one kind. It does not where the level would be one row repeating the figure
 * just pressed — every blow between them unannounced and of one type.
 */
function getOpensPair(figures: CombatantFigures, metric: PanelMetric, otherId: number): boolean {
    const kinds = getPairKinds(figures, metric, otherId);
    if (kinds === null) return false;
    assert(kinds.size >= 0, "a pair carries the kinds it carries, however few");
    assert(Number.isSafeInteger(otherId), "and the other end of it is named by a number");
    if (kinds.size > 1) return true;
    for (const skill of figures.skills.values()) {
        if ((skill.dealtByOpponent.get(`${otherId}`) ?? 0) > 0) return true;
    }
    return false;
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

function getTotalFromCut(cut: FigureCut): number {
    let total = 0;
    for (const figure of cut.values()) total += figure;
    assert(Number.isSafeInteger(total), "a total stays inside what a number holds exactly");
    assert(total >= 0, "and is never below nothing");
    return total;
}

/**
 * The closing row carries no count here: a blow's announcement is counted where it was made, and
 * the protocol states no number of blows against one opponent.
 */
function composePairSkillCut(
    figures: CombatantFigures,
    metric: PanelMetric,
    otherId: number,
    total: number,
): SkillCut {
    assert(total >= 0, "a figure being cut is never below nothing");
    if (metric !== "damageDealtApplied") return { rows: [], plain: null };
    const stated = [...figures.skills.values()]
        .map((one) => ({
            name: one.name,
            uses: null,
            figure: one.dealtByOpponent.get(`${otherId}`) ?? 0,
            opensSkill: false,
        }))
        .filter((one) => one.figure > 0);
    stated.sort((one, other) => other.figure - one.figure || (one.name < other.name ? -1 : 1));
    const held = stated.reduce((sum, one) => sum + one.figure, 0);
    assert(held <= total, "what the skills came to is no more than what passed between the two");
    const plain = total - held;
    const shares = composeShareTexts(
        plain > 0 ? [...stated.map((one) => one.figure), plain] : stated.map((one) => one.figure),
        total,
    );
    const largest = getLargestFigure([...stated.map((one) => one.figure), plain]);
    return {
        rows: stated.map((one, at) => ({
            ...one,
            fill: getFill(one.figure, largest),
            shareText: shares[at] ?? "",
        })),
        plain: plain > 0
            ? {
                blows: 0,
                figure: plain,
                fill: getFill(plain, largest),
                shareText: shares[stated.length] ?? "",
            }
            : null,
    };
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
        (otherId) => getOpensPair(figures, metric, otherId),
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
