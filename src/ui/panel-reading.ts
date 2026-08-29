/**
 * One screen's worth of a fight: the rows, in the order they are drawn.
 *
 * A row's figure is the one the statistics already hold, and no figure here is ever recomputed
 * from the events. The one sum this file does is the listed side's total, which the statistics
 * cannot hold because nothing under `ui/` tells them who is on which side — and without it a
 * share on a one-side list would be measured against a whole the list does not show.
 *
 * Every combatant the roster holds gets a row, including the ones who did nothing: zero happened
 * and is drawn, which is not what unknown looks like.
 */

import { assert } from "@std/assert";
import { type CombatantRoster, getCombatantIdByName } from "@/src/core/combatant-roster.ts";
import type { CombatantFigures, FightStatistics, FigureCut } from "@/src/core/fight-statistics.ts";
import { getIntegerFromText } from "@/src/core/protocol-number.ts";
import { type PanelSideChoice, SCREEN_ORDER, SIDE_CHOICES } from "@/src/ui/panel-screen.ts";
import {
    composeShareText,
    composeShareTexts,
    composeUnplacedHealWarning,
    composeUnreadWarning,
} from "@/src/ui/panel-words.ts";

/** A fight holds twenty, and a list draws a row for each. */
const MAXIMUM_ROWS = 20;
/**
 * The ranking's height, in bars. Ten is the most one side fields and eleven the most a whole
 * fight does, measured over `captures/`, where a group fight is ten of ours against one. A bigger
 * fight scrolls rather than growing the window: a ranking is watched while a fight is on, and a
 * height that changed as combatants joined would move it under the reader's hand.
 */
const RANKING_ROWS = 11;
const SIDE_ROWS = 10;

/** Which figure a screen is showing. Each names a field the statistics already state. */
export type PanelMetric =
    | "damageDealtApplied"
    | "damageTakenApplied"
    | "healthGiven"
    | "healthRestored";

export interface PanelRow {
    combatantId: number;
    /** Null where the roster could not say, which the panel draws as unknown rather than blank. */
    name: string | null;
    side: number | null;
    /** The game's own one-letter code, or null where it stated none. The badge is drawn from it. */
    profession: string | null;
    figure: number;
    /**
     * How much of the row the bar covers: this figure against the biggest one on screen, never
     * against the whole. A bar measured against the whole leaves the top row a stub on a screen
     * ten people share, which is the length a reader compares rows by.
     */
    fill: number;
    /** The share of the whole the screen divides by, apportioned once across every figure on it. */
    shareText: string;
}

/** Which end of a blow the protocol left out, on the row standing for what it could not place. */
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

/** A figure the protocol named one end of, on a row of its own below the ranking. */
export interface PinnedRow {
    end: PanelUnnamedEnd;
    standing: PinnedStanding;
    figure: number;
    fill: number;
    shareText: string;
}

/** One fight already fought, as much of it as a shelf row shows. */
export interface ShelfRow {
    openedAt: number;
    /** Where it was fought, already in words, or null where the client would not say. */
    place: string | null;
    combatants: number;
}

/** How a fight went, from the reader's own seat. A draw needs no seat: nobody won it. */
export type PanelOutcome = "won" | "lost" | "drawn";

export interface PanelReading {
    rows: PanelRow[];
    /** Null where the game has not said, or said nothing this reader's seat can be read into. */
    outcome: PanelOutcome | null;
    /** The fight as a headcount, the reader's own side first, and who could be placed on none. */
    sizes: number[];
    unplaced: number;
    /** The figure the rows are shares of: the fight's own, or the listed side's where one is. */
    total: number;
    /** What the log tied to no actor, and to no target: on no row, so each is a row of its own. */
    pinned: PinnedRow[];
    /** What could not be read or placed on **this screen's** figure, each as one sentence. */
    warnings: string[];
    /** The fight in two figures, or null where nothing said which side is the reader's own. */
    sides: PanelSides | null;
    /** How many bars the list stands at, so opening a row cannot shorten the window. */
    visibleRows: number;
}

function getFigure(figures: CombatantFigures, metric: PanelMetric): number {
    const figure = figures[metric];
    assert(Number.isFinite(figure), "a figure a screen shows is a number");
    assert(figure >= 0, "and never below nothing");
    return figure;
}

/**
 * What may be short about this screen's own figure, said where its consequence is.
 *
 * A message nobody could read may have carried anything, so it qualifies whatever screen is being
 * looked at. A cast nobody could place is narrower: what it puts back is health, so it shortens
 * both halves of the healing and neither half of the damage — saying it on a damage screen would
 * put a doubt on a figure that cannot carry it.
 */
function composeWarnings(statistics: FightStatistics, metric: PanelMetric): string[] {
    assert(statistics.unreadMessages >= 0, "a count of unread messages is never below nothing");
    assert(statistics.castsUnplaced >= 0, "and neither is a count of casts nobody could place");
    const said: string[] = [];
    assert(SCREEN_ORDER.includes(metric), "a screen is qualified by what could shorten its own");
    if (statistics.unreadMessages > 0) said.push(composeUnreadWarning(statistics.unreadMessages));
    const isHealing = metric === "healthRestored" || metric === "healthGiven";
    if (isHealing && statistics.castsUnplaced > 0) {
        said.push(composeUnplacedHealWarning(statistics.castsUnplaced));
    }
    return said;
}

/**
 * Whether a row belongs on the list.
 *
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

/** A row before it knows what the rest of the screen holds: no bar, and no share yet. */
interface UnsharedRow {
    combatantId: number;
    name: string | null;
    side: number | null;
    profession: string | null;
    figure: number;
}

/** By figure, then by id, so a fight redrawn without changing states the same order. */
function compareRows(one: UnsharedRow, other: UnsharedRow): number {
    assert(Number.isFinite(one.figure), "a row compared states a figure");
    if (one.figure !== other.figure) return other.figure - one.figure;
    return one.combatantId - other.combatantId;
}

/** Every combatant the fight holds, with the figure this screen is about and no share yet. */
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
 * What no row can carry, on the one screen of the pair it belongs to.
 *
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
    // What is charged to nobody on the screen being read, and where it stands against the rows.
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

/** The bar every row on a screen is drawn against, pinned rows included. */
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

/** Whether any of those names belongs to somebody on the reader's own side. */
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
    const outcome = statistics.outcome;
    if (outcome === null) return null;
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
        warnings: composeWarnings(statistics, metric),
        sides: composePanelSides(statistics, roster, metric, readerSide),
        visibleRows: choice === "everyone" ? RANKING_ROWS : SIDE_ROWS,
    };
}

/**
 * The fight in two figures and a remainder, whatever the list is narrowed to.
 *
 * What it answers is how the fight is going, and that question does not change when the ranking
 * narrows — only the label does. Null where the client never said which side is the reader's own:
 * two sides nothing can tell apart are not two figures.
 */
export interface PanelSides {
    ours: number;
    theirs: number;
    /** What no side can be charged with: it named neither end, or the roster places nobody. */
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

/** What one row holds of the figure whose other end the protocol did not name, on this screen. */
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

/** One kind of damage, and as much of a row's figure as the blows of that kind carried. */
export interface ElementRow {
    /** The client's own token. What a reader is shown for it is the panel's, not the reading's. */
    element: string;
    figure: number;
    fill: number;
    shareText: string;
}

/** As much of an opened figure as the protocol stated no end or no kind for. */
export interface UnnamedRow {
    figure: number;
    fill: number;
    shareText: string;
}

/** One cut of an opened figure: its rows and its unnamed part come to the figure it cut. */
export interface OpponentCut {
    rows: PanelRow[];
    unnamed: UnnamedRow | null;
}

export interface ElementCut {
    rows: ElementRow[];
    unnamed: UnnamedRow | null;
}

/** What pressing a row opens: one combatant's own figure, cut twice — by whom, and by what. */
export interface DrillReading {
    combatantId: number;
    name: string | null;
    profession: string | null;
    byOpponent: OpponentCut;
    byElement: ElementCut;
    total: number;
}

interface MetricCuts {
    byOpponent: FigureCut;
    /** Null on the one screen whose second cut would word a figure with somebody else's cause. */
    byElement: FigureCut | null;
}

/**
 * What a row opens onto, on every screen there is.
 *
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
 * Every kind the protocol stated on this combatant's blows, and the remainder it stated none for.
 *
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
        stated.push({ element, figure });
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

/** The other end of each blow, and as much of the figure as the protocol named nobody for. */
function composeOpponentCut(
    cut: FigureCut,
    roster: CombatantRoster,
    total: number,
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
 * One row opened. Nothing is aggregated here either: the cut is the one the statistics hold, and
 * the share is against that row's own figure rather than against the fight's.
 */
export function composeDrillReading(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    combatantId: number,
): DrillReading | null {
    const figures = statistics.byCombatantId.get(combatantId);
    if (figures === undefined) return null;
    const cuts = getCutsForMetric(figures, metric);
    const total = getFigure(figures, metric);
    const held = roster.byId.get(combatantId);
    const byOpponent = composeOpponentCut(cuts.byOpponent, roster, total);
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
        byElement,
        total,
    };
}
