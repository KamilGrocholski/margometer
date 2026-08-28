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
import type { CombatantFigures, FightStatistics } from "@/src/core/fight-statistics.ts";

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
