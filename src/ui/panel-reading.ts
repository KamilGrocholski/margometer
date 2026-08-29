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
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import type { CombatantFigures, FightStatistics, FigureCut } from "@/src/core/fight-statistics.ts";
import { getIntegerFromText } from "@/src/core/protocol-number.ts";
import { type PanelSideChoice, SIDE_CHOICES } from "@/src/ui/panel-screen.ts";

/** A fight holds twenty, and a list draws a row for each. */
const MAXIMUM_ROWS = 20;

/** Which figure a screen is showing. Each names a field the statistics already state. */
export type PanelMetric =
    | "damageDealtApplied"
    | "damageTakenApplied"
    | "damagePrevented"
    | "healthGiven"
    | "healthRestored";

export interface PanelRow {
    combatantId: number;
    /** Null where the roster could not say, which the panel draws as unknown rather than blank. */
    name: string | null;
    side: number | null;
    /** The game's own one-letter code, or null where it stated none. The bar is drawn from it. */
    profession: string | null;
    figure: number;
    /** The row against the fight's total. Zero where the fight has no figure of that kind. */
    share: number;
}

/** One fight already fought, as much of it as a shelf row shows. */
export interface ShelfRow {
    openedAt: number;
    /** Where it was fought, already in words, or null where the client would not say. */
    place: string | null;
    combatants: number;
}

export interface PanelReading {
    rows: PanelRow[];
    /** The figure the rows are shares of: the fight's own, or the listed side's where one is. */
    total: number;
    /** What the log tied to no actor — damage nobody dealt, health nobody is credited with. */
    withoutActor: number;
    withoutTarget: number;
    /** Something feeding **this screen's** figure went unread or unplaced, so it may be short. */
    isSuspect: boolean;
}

function getFigure(figures: CombatantFigures, metric: PanelMetric): number {
    const figure = figures[metric];
    assert(Number.isFinite(figure), "a figure a screen shows is a number");
    assert(figure >= 0, "and never below nothing");
    return figure;
}

/**
 * Whether this screen's own figure may be short.
 *
 * A message nobody could read may have carried anything, so it shortens whatever screen is being
 * looked at. A cast nobody could place is narrower than that: what it puts back is health, so it
 * shortens both halves of the healing and neither half of the damage — marking a damage screen
 * for it would put a doubt on a figure that cannot carry it.
 */
function getIsScreenSuspect(statistics: FightStatistics, metric: PanelMetric): boolean {
    assert(statistics.unreadMessages >= 0, "a count of unread messages is never below nothing");
    assert(statistics.castsUnplaced >= 0, "and neither is a count of casts nobody could place");
    if (statistics.unreadMessages > 0) return true;
    if (metric === "healthRestored") return statistics.castsUnplaced > 0;
    if (metric === "healthGiven") return statistics.castsUnplaced > 0;
    return false;
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

/** By figure, then by id, so a fight redrawn without changing states the same order. */
function compareRows(one: PanelRow, other: PanelRow): number {
    assert(Number.isFinite(one.figure), "a row compared states a figure");
    if (one.figure !== other.figure) return other.figure - one.figure;
    return one.combatantId - other.combatantId;
}

/** Every combatant the fight holds, with the figure this screen is about and no share yet. */
function composeUnsharedRows(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
): PanelRow[] {
    assert(statistics.byCombatantId.size <= MAXIMUM_ROWS, "a fight stays inside its stated bound");
    assert(roster.byId.size <= MAXIMUM_ROWS, "and so does the roster it is fought by");
    const rows: PanelRow[] = [];
    const seen = new Set<number>();
    for (const [combatantId, figures] of statistics.byCombatantId) {
        seen.add(combatantId);
        const held = roster.byId.get(combatantId);
        rows.push({
            combatantId,
            name: held?.name ?? null,
            side: held?.side ?? null,
            profession: held?.profession ?? null,
            share: 0,
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
            share: 0,
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
    rows: readonly PanelRow[],
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
function getFigureWithoutEnd(
    stated: number,
    isThisScreen: boolean,
    choice: PanelSideChoice,
): number {
    assert(stated >= 0, "a figure nobody can be charged with is never below nothing");
    assert(SIDE_CHOICES.includes(choice), "and a choice a reader could have made");
    if (!isThisScreen) return 0;
    if (choice !== "everyone") return 0;
    return stated;
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
    const total = getListedTotal(statistics, listed, metric, choice);
    const rows = listed.map((row) => ({
        ...row,
        share: total === 0 ? 0 : row.figure / total,
    }));
    rows.sort(compareRows);
    assert(rows.length <= MAXIMUM_ROWS, "a list stays inside the fight's stated bound");
    assert(
        rows.every((one) => one.share <= 1),
        "a row is never more than the whole it is drawn in",
    );
    const isEveryone = choice === "everyone" || readerSide === null;
    assert(!isEveryone || rows.length >= roster.byId.size, "everybody listed is everybody drawn");
    return {
        rows,
        total,
        withoutActor: getFigureWithoutEnd(
            metric === "healthGiven" ? statistics.givenByNobody : statistics.dealtByNobody,
            metric === "damageDealtApplied" || metric === "healthGiven",
            choice,
        ),
        withoutTarget: getFigureWithoutEnd(
            statistics.takenByNobody,
            metric === "damageTakenApplied",
            choice,
        ),
        isSuspect: getIsScreenSuspect(statistics, metric),
    };
}

/** One kind of damage, and as much of a row's figure as the blows of that kind carried. */
export interface ElementRow {
    /** The client's own token. What a reader is shown for it is the panel's, not the reading's. */
    element: string;
    figure: number;
    share: number;
}

/** What pressing a row opens: one combatant's own figure, cut twice — by whom, and by what. */
export interface DrillReading {
    combatantId: number;
    name: string | null;
    byOpponent: PanelRow[];
    byElement: ElementRow[];
    /** As much of the figure as no kind was stated for. Never guessed at, and never spread. */
    withoutElement: number;
    total: number;
}

/** The cut by kind, and what fell outside every kind in it. */
interface ElementCut {
    rows: ElementRow[];
    withoutElement: number;
}

interface MetricCuts {
    byOpponent: FigureCut;
    byElement: FigureCut;
}

/** Null where the screen has no cut to open. A screen without one is not a row a reader presses. */
function getCutsForMetric(figures: CombatantFigures, metric: PanelMetric): MetricCuts | null {
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
    return null;
}

/** By figure, then by the token, so a cut redrawn without changing states the same order. */
function compareElementRows(one: ElementRow, other: ElementRow): number {
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
    const rows: ElementRow[] = [];
    let stated = 0;
    for (const [element, figure] of cut) {
        assert(figure >= 0, "a part of a figure is never below nothing");
        stated += figure;
        rows.push({ element, figure, share: total === 0 ? 0 : figure / total });
    }
    rows.sort(compareElementRows);
    assert(stated <= total, "the kinds a figure was dealt in come to no more than that figure");
    assert(rows.every((one) => one.share <= 1), "and no kind of it is more than the whole");
    return { rows, withoutElement: total - stated };
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
    if (cuts === null) return null;
    const total = getFigure(figures, metric);
    const byOpponent: PanelRow[] = [];
    for (const [stated, figure] of cuts.byOpponent) {
        const other = getIntegerFromText(stated);
        if (other === null) continue;
        const held = roster.byId.get(other);
        byOpponent.push({
            combatantId: other,
            name: held?.name ?? null,
            side: held?.side ?? null,
            profession: held?.profession ?? null,
            figure,
            share: total === 0 ? 0 : figure / total,
        });
    }
    byOpponent.sort(compareRows);
    assert(
        byOpponent.length <= statistics.byCombatantId.size,
        "a row opens onto the people in the fight",
    );
    assert(byOpponent.every((one) => one.share <= 1), "and no part of a row is more than the row");
    const byElement = composeElementCut(cuts.byElement, total);
    assert(byElement.withoutElement >= 0, "a part no kind was stated for is not below nothing");
    return {
        combatantId,
        name: roster.byId.get(combatantId)?.name ?? null,
        byOpponent,
        byElement: byElement.rows,
        withoutElement: byElement.withoutElement,
        total,
    };
}
