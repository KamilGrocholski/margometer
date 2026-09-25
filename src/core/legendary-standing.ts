/**
 * The two legendary bonuses a fighter's own tooltip can be honest about: the one still running,
 * and the one that has been spent.
 *
 * Neither rides a `skillId`, so the published skill table dates neither. The first is counted by
 * its own heals, each of which the payload carries; the second fires once (`develop ADR 0113`).
 * The lighting rides the **holder's own** blow: _Zdarzenie może zajść wyłącznie podczas wykonania
 * ataku przez posiadacza bonusu_ (article `view,372`, read 2026-09-21).
 */

import { assert } from "@std/assert/assert";
import { BATTLE_EVENT, type BattleEvent } from "./battle-event.ts";
import { HOLYTOUCH_DECLARATION_KEY, HOLYTOUCH_HEAL_KEY, LASTHEAL_KEY } from "./protocol-key.ts";

/**
 * _Postać aplikuje na siebie efekt rozłożony na **3 tury**, którego każde wyzwolenie leczy Postaci
 * 6% puli punktów zdrowia_ (article `view,372`, read 2026-09-21). ⚠️ **Counted in heals and never
 * in the holder's turns**, which the heals do not keep to.
 */
export const HOLYTOUCH_HEALS_STATED = 3;

/** As many holders as a board has combatants. */
const HOLDERS_MAXIMUM = 64;

/** What one fight's bonuses have come to so far, carried payload to payload. */
export interface LegendaryWalk {
    /** The heals the holder's current run has given them so far. */
    readonly holytouchHealsByHolder: ReadonlyMap<number, number>;
    readonly spentLastheal: ReadonlySet<number>;
}

export const NO_LEGENDARY_WALK: LegendaryWalk = {
    holytouchHealsByHolder: new Map(),
    spentLastheal: new Set(),
};

/** One combatant, and what the two bonuses say about them now. */
export interface LegendaryStanding {
    combatantId: number;
    /** The heals their current run has given them, or null where it is not standing on them. */
    holytouchHealsGiven: number | null;
    hasSpentLastheal: boolean;
}

/**
 * One payload's events onto the walk, in order: a heal in the same payload as its lighting belongs
 * to the run that lighting opened. ⚠️ **A second declaration restarts the run**: over
 * `develop:captures/` on 2026-09-23, nine runs were cut short this way after one or two heals. A
 * heal with no run open is dropped rather than opening one: none of the 171 heals there did.
 */
export function prepareLegendaryWalk(
    walk: LegendaryWalk,
    events: readonly BattleEvent[],
): LegendaryWalk {
    const holytouchHealsByHolder = new Map(walk.holytouchHealsByHolder);
    const spentLastheal = new Set(walk.spentLastheal);
    for (const event of events) {
        if (event.kind === BATTLE_EVENT.attack) {
            const isLit = event.declared.some((one) => one.effect === HOLYTOUCH_DECLARATION_KEY);
            if (isLit) {
                if (event.actorId !== null) holytouchHealsByHolder.set(event.actorId, 0);
            }
        }
        if (event.kind === BATTLE_EVENT.healthChange) {
            if (event.source === HOLYTOUCH_HEAL_KEY) {
                addHeal(holytouchHealsByHolder, event.combatantId);
            }
        }
        if (event.kind === BATTLE_EVENT.healingToNamedCombatant) {
            if (event.source === LASTHEAL_KEY) {
                if (event.targetId !== null) spentLastheal.add(event.targetId);
            }
        }
    }
    assert(holytouchHealsByHolder.size <= HOLDERS_MAXIMUM, "a board holds a bounded cast");
    assert(spentLastheal.size <= HOLDERS_MAXIMUM, "and so does what has been spent on it");
    return { holytouchHealsByHolder, spentLastheal };
}

function addHeal(healsByHolder: Map<number, number>, holderId: number | null): void {
    if (holderId === null) return;
    const heals = healsByHolder.get(holderId);
    if (heals === undefined) return;
    assert(heals >= 0, "a run open on a holder has given none or more");
    healsByHolder.set(holderId, heals + 1);
}

/**
 * What stands now, one row per combatant either bonus has anything to say about. A run that has
 * given its stated heals leaves on the payload that carried the last of them. ⚠️ **A run the game
 * stops short stands until the fight ends**: no run over `develop:captures/` outlived its heals, so
 * a turn bound would be a guess.
 */
export function composeLegendaryStandings(walk: LegendaryWalk): LegendaryStanding[] {
    const found = new Map<number, LegendaryStanding>();
    for (const [combatantId, heals] of walk.holytouchHealsByHolder) {
        assert(heals >= 0, "a run has given no fewer heals than none");
        if (heals >= HOLYTOUCH_HEALS_STATED) continue;
        const hasSpentLastheal = walk.spentLastheal.has(combatantId);
        found.set(combatantId, { combatantId, holytouchHealsGiven: heals, hasSpentLastheal });
    }
    for (const combatantId of walk.spentLastheal) {
        if (found.has(combatantId)) continue;
        found.set(combatantId, { combatantId, holytouchHealsGiven: null, hasSpentLastheal: true });
    }
    assert(found.size <= HOLDERS_MAXIMUM * 2, "no more rows than the two bonuses can put up");
    return [...found.values()].sort((one, other) => one.combatantId - other.combatantId);
}
