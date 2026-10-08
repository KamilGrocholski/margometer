/**
 * The legendary bonuses: how many times each showed itself on whoever holds it, and the two a
 * fighter's own tooltip can be honest about now — the one still running, and the one spent.
 *
 * Neither of those two rides a `skillId`, so the published skill table dates neither. The first is
 * counted by its own heals, each of which the payload carries; the second fires once (`develop ADR
 * 0113`). The lighting rides the **holder's own** blow: the help lets it happen only while the
 * bonus's holder is attacking (article `view,372`, read 2026-09-21).
 */

import { assert } from "@std/assert/assert";
import { BATTLE_EVENT, type BattleEvent } from "./battle-event.ts";
import { COMBATANTS_MAXIMUM } from "./combatant-roster.ts";
import {
    HOLYTOUCH_DECLARATION_KEY,
    HOLYTOUCH_HEAL_KEY,
    LASTHEAL_KEY,
    lookupLegendaryBonus,
    PROC_END,
} from "./protocol-key.ts";

/** What one fight's bonuses have come to so far, carried payload to payload. */
export interface LegendaryWalk {
    /** The heals the holder's current run has given them so far. */
    readonly holytouchHealsByBearerId: ReadonlyMap<number, number>;
    readonly lastHealSpentCombatantIds: ReadonlySet<number>;
}

/** One combatant, and what the two bonuses say about them now. */
export interface LegendaryStanding {
    combatantId: number;
    /** The heals their current run has given them, or null where it is not standing on them. */
    holytouchHealsReceived: number | null;
    hasSpentLastheal: boolean;
}

/** How many times each legendary bonus showed itself, by its key, on whoever it belongs to. */
export type LegendaryBonusesByCombatantId = ReadonlyMap<number, ReadonlyMap<string, number>>;

/** Each bonus twice: on the combatant it belongs to, and on the one it acted on. */
export interface LegendaryBonusTally {
    byHolderId: LegendaryBonusesByCombatantId;
    byReachedId: LegendaryBonusesByCombatantId;
}

/**
 * The holder puts an effect on themselves spread over **three** firings, each healing 6% of their
 * health pool (article `view,372`, read 2026-09-21). ⚠️ **Counted in heals and never in the
 * holder's turns**, which the heals do not keep to.
 */
export const HOLYTOUCH_HEALS_STATED = 3;

/** As many holders as a board has combatants. */
const HOLDERS_MAXIMUM = COMBATANTS_MAXIMUM;
/** Past the keys `src/core/protocol-key.ts` names a legendary bonus by. */
const BONUSES_PER_HOLDER_MAXIMUM = 16;

export const NO_LEGENDARY_WALK: LegendaryWalk = {
    holytouchHealsByBearerId: new Map(),
    lastHealSpentCombatantIds: new Set(),
};

/**
 * One payload's events onto the walk, in order: a heal in the same payload as its lighting belongs
 * to the run that lighting opened. ⚠️ **A second declaration restarts the run**: over
 * `captures/` on 2026-09-23, nine runs were cut short this way after one or two heals. A
 * heal with no run open is dropped rather than opening one: none of the 171 heals there did.
 */
export function prepareLegendaryWalk(
    walk: LegendaryWalk,
    events: readonly BattleEvent[],
): LegendaryWalk {
    const holytouchHealsByBearerId = new Map(walk.holytouchHealsByBearerId);
    const lastHealSpentCombatantIds = new Set(walk.lastHealSpentCombatantIds);
    for (const event of events) {
        if (event.kind === BATTLE_EVENT.attack) {
            const isLit = event.declared.some((declaredEffect) =>
                declaredEffect.effect === HOLYTOUCH_DECLARATION_KEY
            );
            if (isLit) {
                if (event.actorId !== null) holytouchHealsByBearerId.set(event.actorId, 0);
            }
        }
        if (event.kind === BATTLE_EVENT.healingToNamedCombatant) {
            if (event.source === LASTHEAL_KEY) {
                if (event.targetId !== null) lastHealSpentCombatantIds.add(event.targetId);
            }
        }
        if (event.kind !== BATTLE_EVENT.healthChange) continue;
        if (event.source !== HOLYTOUCH_HEAL_KEY) continue;
        // Count the heal onto the run open on its holder.
        const holderId = event.combatantId;
        if (holderId === null) continue;
        const heals = holytouchHealsByBearerId.get(holderId);
        if (heals === undefined) continue;
        assert(heals >= 0, "a run open on a holder has given none or more");
        holytouchHealsByBearerId.set(holderId, heals + 1);
    }
    assert(holytouchHealsByBearerId.size <= HOLDERS_MAXIMUM, "a board holds a bounded cast");
    assert(
        lastHealSpentCombatantIds.size <= HOLDERS_MAXIMUM,
        "and so does what has been spent on it",
    );
    return { holytouchHealsByBearerId, lastHealSpentCombatantIds };
}

/**
 * What stands now, one row per combatant either bonus has anything to say about. A run that has
 * given its stated heals leaves on the payload that carried the last of them. ⚠️ **A run the game
 * stops short stands until the fight ends**: every run left short over `captures/` was one the
 * fight ended inside (35 recordings, 2026-09-23, `develop ADR 0113`), so a turn bound would be a
 * guess.
 */
export function composeLegendaryStandings(walk: LegendaryWalk): LegendaryStanding[] {
    const standingByCombatantId = new Map<number, LegendaryStanding>();
    for (const [combatantId, heals] of walk.holytouchHealsByBearerId) {
        assert(heals >= 0, "a run has given no fewer heals than none");
        if (heals >= HOLYTOUCH_HEALS_STATED) continue;
        const hasSpentLastheal = walk.lastHealSpentCombatantIds.has(combatantId);
        standingByCombatantId.set(combatantId, {
            combatantId,
            holytouchHealsReceived: heals,
            hasSpentLastheal,
        });
    }
    for (const combatantId of walk.lastHealSpentCombatantIds) {
        if (standingByCombatantId.has(combatantId)) continue;
        standingByCombatantId.set(combatantId, {
            combatantId,
            holytouchHealsReceived: null,
            hasSpentLastheal: true,
        });
    }
    assert(
        standingByCombatantId.size <= HOLDERS_MAXIMUM * 2,
        "no more rows than the two bonuses can put up",
    );
    return [...standingByCombatantId.values()].sort((leftStanding, rightStanding) =>
        leftStanding.combatantId - rightStanding.combatantId
    );
}

/**
 * Every legendary bonus the events name, on the row of whoever it belongs to and, where it acts on
 * the blow's other end, on that one's too. A blow carries the bonuses as procs and as declarations
 * alike; the heal stated by name carries its key as its source. A bonus whose holder the message
 * names nobody at reaches no row, and a bonus nobody can be named as the giver of reaches nobody.
 */
export function countLegendaryBonuses(events: readonly BattleEvent[]): LegendaryBonusTally {
    const countsByCombatantId = new Map<number, Map<string, number>>();
    const reachedByCombatantId = new Map<number, Map<string, number>>();
    for (const event of events) {
        let keys: readonly string[];
        let actorId: number | null;
        let targetId: number | null;
        if (event.kind === BATTLE_EVENT.attack) {
            keys = [...event.procs, ...event.declared.map((declared) => declared.effect)];
            actorId = event.actorId;
            targetId = event.targetId;
        } else if (event.kind === BATTLE_EVENT.healingToNamedCombatant) {
            keys = [event.source];
            actorId = null;
            targetId = event.targetId;
        } else {
            continue;
        }
        for (const key of keys) {
            const bonus = lookupLegendaryBonus(key);
            if (bonus === null) continue;
            const holderId = bonus.end === PROC_END.actor ? actorId : targetId;
            if (holderId === null) continue;
            const countByKey = countsByCombatantId.get(holderId) ?? new Map<string, number>();
            countByKey.set(key, (countByKey.get(key) ?? 0) + 1);
            countsByCombatantId.set(holderId, countByKey);
            assert(countByKey.size <= BONUSES_PER_HOLDER_MAXIMUM, "a holder shows a bounded few");
            if (!bonus.doesReachOtherEnd) continue;
            const reachedId = bonus.end === PROC_END.actor ? targetId : actorId;
            if (reachedId === null) continue;
            const reachedByKey = reachedByCombatantId.get(reachedId) ?? new Map<string, number>();
            reachedByKey.set(key, (reachedByKey.get(key) ?? 0) + 1);
            reachedByCombatantId.set(reachedId, reachedByKey);
            assert(
                reachedByKey.size <= BONUSES_PER_HOLDER_MAXIMUM,
                "and is reached by a bounded few",
            );
        }
    }
    assert(countsByCombatantId.size <= HOLDERS_MAXIMUM, "a board holds a bounded cast");
    assert(reachedByCombatantId.size <= HOLDERS_MAXIMUM, "and so does whoever a bonus reached");
    return { byHolderId: countsByCombatantId, byReachedId: reachedByCombatantId };
}
