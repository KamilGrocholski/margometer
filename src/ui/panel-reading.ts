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
    /** Something feeding these figures could not be read or placed, so any may be short. */
    isSuspect: boolean;
}

function getFigure(figures: CombatantFigures, metric: PanelMetric): number {
    const figure = figures[metric];
    assert(Number.isFinite(figure), "a figure a screen shows is a number");
    assert(figure >= 0, "and never below nothing");
    return figure;
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
        isSuspect: statistics.unreadMessages > 0 || statistics.castsUnplaced > 0,
    };
}

/** What pressing a row opens: one combatant's own figure, cut by the other end of each blow. */
export interface DrillReading {
    combatantId: number;
    name: string | null;
    rows: PanelRow[];
    total: number;
}

/** Null where the screen has no cut to open. A screen without one is not a row a reader presses. */
function getCutForMetric(figures: CombatantFigures, metric: PanelMetric): FigureCut | null {
    assert(metric.length > 0, "a screen is asked for by name");
    assert(figures.damageDealtApplied >= 0, "a figure that could be cut is not below nothing");
    if (metric === "damageDealtApplied") return figures.damageDealtByOpponent;
    if (metric === "damageTakenApplied") return figures.damageTakenByOpponent;
    return null;
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
    const cut = getCutForMetric(figures, metric);
    if (cut === null) return null;
    const total = getFigure(figures, metric);
    const rows: PanelRow[] = [];
    for (const [stated, figure] of cut) {
        const other = getIntegerFromText(stated);
        if (other === null) continue;
        const held = roster.byId.get(other);
        rows.push({
            combatantId: other,
            name: held?.name ?? null,
            side: held?.side ?? null,
            figure,
            share: total === 0 ? 0 : figure / total,
        });
    }
    rows.sort(compareRows);
    assert(
        rows.length <= statistics.byCombatantId.size,
        "a row opens onto the people in the fight",
    );
    assert(rows.every((one) => one.share <= 1), "and no part of a row is more than the row");
    return { combatantId, name: roster.byId.get(combatantId)?.name ?? null, rows, total };
}
