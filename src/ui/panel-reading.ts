/**
 * One screen's worth of a fight: the rows, in the order they are drawn.
 *
 * Nothing here aggregates. A row's figure is the one the statistics already hold and a share is
 * that figure against the fight's own total, which the statistics hold too — folding those into
 * the cut a screen shows is the panel's work, and adding one row to another is not.
 *
 * Every combatant the roster holds gets a row, including the ones who did nothing: zero happened
 * and is drawn, which is not what unknown looks like.
 */

import { assert } from "@std/assert";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import type { CombatantFigures, FightStatistics, FigureCut } from "@/src/core/fight-statistics.ts";
import { getIntegerFromText } from "@/src/core/protocol-number.ts";

/** Which figure a screen is showing. Each names a field the statistics already state. */
export type PanelMetric =
    | "damageDealtApplied"
    | "damageTakenApplied"
    | "damagePrevented"
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
    total: number;
    /** Applied damage the log tied to nobody. A row cannot carry it, so it stands on its own. */
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
 * looked at. A cast nobody could place is narrower than that: what it puts back is health, and
 * health restored is the only figure it feeds — marking a damage screen for it would put a doubt
 * on a figure that cannot carry it.
 */
function getIsScreenSuspect(statistics: FightStatistics, metric: PanelMetric): boolean {
    assert(statistics.unreadMessages >= 0, "a count of unread messages is never below nothing");
    assert(statistics.castsUnplaced >= 0, "and neither is a count of casts nobody could place");
    if (statistics.unreadMessages > 0) return true;
    if (metric !== "healthRestored") return false;
    return statistics.castsUnplaced > 0;
}

/** By figure, then by id, so a fight redrawn without changing states the same order. */
function compareRows(one: PanelRow, other: PanelRow): number {
    assert(Number.isFinite(one.figure), "a row compared states a figure");
    if (one.figure !== other.figure) return other.figure - one.figure;
    return one.combatantId - other.combatantId;
}

export function composePanelReading(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
): PanelReading {
    const total = getFigure(statistics.totals, metric);
    const rows: PanelRow[] = [];
    const seen = new Set<number>();
    for (const [combatantId, figures] of statistics.byCombatantId) {
        seen.add(combatantId);
        const held = roster.byId.get(combatantId);
        const figure = getFigure(figures, metric);
        rows.push({
            combatantId,
            name: held?.name ?? null,
            side: held?.side ?? null,
            profession: held?.profession ?? null,
            share: total === 0 ? 0 : figure / total,
            figure,
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
    rows.sort(compareRows);
    assert(rows.length >= roster.byId.size, "every combatant the roster holds is drawn");
    assert(rows.every((one) => one.share <= 1), "a row is never more than the whole of a fight");
    return {
        rows,
        total,
        withoutActor: metric === "damageDealtApplied" ? statistics.dealtByNobody : 0,
        withoutTarget: metric === "damageTakenApplied" ? statistics.takenByNobody : 0,
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
