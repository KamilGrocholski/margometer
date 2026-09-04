/**
 * What a skill put on more than one combatant, as the strip beside the panel reads it.
 *
 * One group per skill, one row per caster inside it, soonest to end first. No DOM: the strip is
 * composed here and drawn in `src/ui/panel-element.ts`, the way every other reading is.
 */

import { assert } from "@std/assert/assert";
import type { AuraStanding } from "@/src/core/aura-standing.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import type { FightStatistics } from "@/src/core/fight-statistics.ts";

/** The bound `src/core/fight-statistics.ts` counts casts inside, read here as rows. */
const MAXIMUM_AURA_ROWS = 256;

export interface AuraRow {
    casterName: string | null;
    /** Null where the game never said which side the reader is on, so neither hue is earned. */
    isReaderSide: boolean | null;
    turnsElapsed: number;
    turnsStated: number;
}

export interface AuraGroup {
    skillName: string;
    rows: readonly AuraRow[];
}

export interface AuraReading {
    groups: readonly AuraGroup[];
    rows: number;
}

/**
 * Null rather than a name of our own where the roster cannot place the caster: a cast is drawn
 * under whoever the game named, and never under a guess (`PRODUCT.md`).
 */
function getCasterName(roster: CombatantRoster, casterId: number): string | null {
    const combatant = roster.byId.get(casterId);
    if (combatant === undefined) return null;
    assert(combatant.name.length > 0, "a combatant the roster holds is named");
    return combatant.name;
}

function getIsReaderSide(
    roster: CombatantRoster,
    casterId: number,
    readerSide: number | null,
): boolean | null {
    if (readerSide === null) return null;
    const combatant = roster.byId.get(casterId);
    if (combatant === undefined) return null;
    assert(Number.isFinite(combatant.side), "a combatant the roster holds stands on a side");
    return combatant.side === readerSide;
}

function composeAuraRow(
    standing: AuraStanding,
    roster: CombatantRoster,
    readerSide: number | null,
): AuraRow {
    assert(standing.turnsStated > 0, "a cast that is drawn runs for a stated number of turns");
    assert(standing.turnsElapsed >= 0, "and has run no fewer than none of them");
    return {
        casterName: getCasterName(roster, standing.casterId),
        isReaderSide: getIsReaderSide(roster, standing.casterId, readerSide),
        turnsElapsed: standing.turnsElapsed,
        turnsStated: standing.turnsStated,
    };
}

/**
 * The groups, in the order their first row stands: the statistics already sort every cast soonest
 * to end first, so a skill is placed by the one of its casts about to go.
 */
export function composeAuraReading(
    statistics: FightStatistics,
    roster: CombatantRoster,
    readerSide: number | null,
): AuraReading {
    const byName = new Map<string, AuraRow[]>();
    for (const standing of statistics.auraStandings) {
        const held = byName.get(standing.skillName) ?? [];
        held.push(composeAuraRow(standing, roster, readerSide));
        byName.set(standing.skillName, held);
    }
    const groups: AuraGroup[] = [];
    let rows = 0;
    for (const [skillName, held] of byName) {
        assert(held.length > 0, "a group that was made holds a cast");
        groups.push({ skillName, rows: held });
        rows += held.length;
    }
    assert(rows <= MAXIMUM_AURA_ROWS, "a fight stays inside its stated bound");
    assert(groups.length <= rows, "and no group holds fewer than one cast");
    return { groups, rows };
}
