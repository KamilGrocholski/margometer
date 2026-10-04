/**
 * Health read out of the share the protocol states, and the casts stated about a whole side sized
 * onto its members.
 *
 * A reading is refused rather than defaulted: a share taken of a maximum nobody stated is a figure
 * that is too high, which is the one direction a panel cannot mark.
 */

import { assert } from "@std/assert/assert";
import { clampNumber } from "#/libs/number-range.ts";
import { BATTLE_EVENT, type BattleEvent } from "./battle-event.ts";
import { type CombatantRoster, COMBATANTS_MAXIMUM } from "./combatant-roster.ts";
import { ENDS_MAXIMUM } from "./fight-decoder.ts";
import { HEALING_REDUCER_KEY } from "./protocol-key.ts";
import { HEALTH_PERCENT_PLACES } from "./protocol-number.ts";

/** What each combatant held when the fight began. Missing where nothing ever stated them. */
export type FightEntryHealth = ReadonlyMap<number, number>;

export interface SideHeal {
    casterId: number;
    source: string;
    declaredShare: number;
    restoredByCombatantId: ReadonlyMap<number, number>;
    /** False where a side-mate could not be sized, so the cast is still counted as unsized. */
    isWhole: boolean;
}

const PERCENT_WHOLE = 100;
const DECIMAL_BASE = 10;
/** Two places stand for a band half a place wide, and the health behind it is that share. */
const HALF_PLACE = 0.5;

/**
 * How far a health read from a two-place percentage can be off. The guards measuring the corpus
 * against it read the band from here, so `HEALTH_PERCENT_PLACES` is spelled once.
 */
export function composeHealthTolerance(healthMaximum: number): number {
    assert(Number.isFinite(healthMaximum), "a maximum to measure against is a number");
    assert(healthMaximum >= 0, "a maximum is never below nothing");
    const places = DECIMAL_BASE ** HEALTH_PERCENT_PLACES;
    const band = (healthMaximum * HALF_PLACE) / (PERCENT_WHOLE * places);
    return Math.ceil(band + HALF_PLACE);
}

/** Null where nothing stated a maximum. Zero is a reading, and never stands in for one. */
export function composeHealthFromPercent(
    percent: number,
    healthMaximum: number | null,
): number | null {
    assert(Number.isFinite(percent), "a percentage to read from is a number");
    assert(percent >= 0, "a percentage is never below nothing");
    if (healthMaximum === null) return null;
    assert(Number.isFinite(healthMaximum), "a maximum to read against is a number");
    const health = Math.round((percent * healthMaximum) / PERCENT_WHOLE);
    assert(health >= 0, "health read from a percentage is never below nothing");
    return health;
}

/** Where an event says a combatant stands, as `[combatantId, percent]`: one reading for all. */
export function getHealthPercentsFromEvent(event: BattleEvent): [number, number][] {
    const stated: [number, number][] = [];
    const addStatedPercent = (combatantId: number | null, percent: number | null): void => {
        if (combatantId === null) return;
        if (percent !== null) stated.push([combatantId, percent]);
    };
    switch (event.kind) {
        case BATTLE_EVENT.attack:
        case BATTLE_EVENT.skillUsed:
            addStatedPercent(event.actorId, event.actorHealthPercent);
            addStatedPercent(event.targetId, event.targetHealthPercent);
            break;
        case BATTLE_EVENT.healthChange:
        case BATTLE_EVENT.declaration:
            addStatedPercent(event.combatantId, event.healthPercent);
            break;
        case BATTLE_EVENT.damageToNamedCombatant:
        case BATTLE_EVENT.healingToNamedCombatant:
            addStatedPercent(event.targetId, event.targetHealthPercent);
            break;
    }
    assert(stated.length <= ENDS_MAXIMUM, "an event states where at most two combatants stand");
    return stated;
}

/**
 * The health a fight was entered with, unwound from the **first** statement about each combatant.
 * A message that moves somebody's health names them, so the first percentage stated is at or before
 * anything that could have changed it. A combatant nothing states, or one with no maximum, is left
 * out rather than guessed at.
 */
export function indexFightEntryHealth(
    events: readonly BattleEvent[],
    roster: CombatantRoster,
): FightEntryHealth {
    assert(roster.byId.size <= COMBATANTS_MAXIMUM, "a roster stays inside its stated bound");
    const entryHealthByCombatantId = new Map<number, number>();
    for (const event of events) {
        for (const [combatantId, percent] of getHealthPercentsFromEvent(event)) {
            if (entryHealthByCombatantId.has(combatantId)) continue;
            const maximum = roster.byId.get(combatantId)?.healthMaximum ?? null;
            const health = composeHealthFromPercent(percent, maximum);
            if (health === null) continue;
            assert(maximum !== null, "a health read off a percentage was read against a pool");
            assert(health <= maximum, "nobody enters above their own pool");
            entryHealthByCombatantId.set(combatantId, health);
        }
    }
    assert(
        entryHealthByCombatantId.size <= roster.byId.size,
        "a fight is entered by the people in it",
    );
    return entryHealthByCombatantId;
}

/**
 * Every cast in a fight, sized against where each member stood when it landed. Nothing is sized on
 * a side a reducer reached: the help scopes that reduction and the protocol never states the figure
 * it left, so a cast there is refused whole rather than reported short.
 */
export function indexSideHeals(
    events: readonly BattleEvent[],
    roster: CombatantRoster,
): ReadonlyMap<BattleEvent, SideHeal> {
    const entryHealthByCombatantId = indexFightEntryHealth(events, roster);
    const reducedSides = indexReducedSides(events, roster);
    const healthByCombatantId = new Map<number, number>();
    const heals = new Map<BattleEvent, SideHeal>();
    for (const event of events) {
        const heal = composeSideHeal(event, roster, entryHealthByCombatantId, healthByCombatantId);
        if (heal !== null) {
            const casterSide = roster.byId.get(heal.casterId)?.side;
            assert(casterSide !== undefined, "a cast is sized only on a side its caster stands on");
            if (!reducedSides.has(casterSide)) {
                heals.set(event, heal);
                // What a cast put back is health the next one cannot put back again.
                for (const [combatantId, amount] of heal.restoredByCombatantId) {
                    const healthNow = healthByCombatantId.get(combatantId);
                    assert(healthNow !== undefined, "a cast is sized only over health it read");
                    healthByCombatantId.set(combatantId, healthNow + amount);
                }
            }
        }
        for (const [combatantId, percent] of getHealthPercentsFromEvent(event)) {
            const maximum = roster.byId.get(combatantId)?.healthMaximum ?? null;
            const health = composeHealthFromPercent(percent, maximum);
            if (health !== null) healthByCombatantId.set(combatantId, health);
        }
    }
    assert(heals.size <= events.length, "a cast is one event");
    return heals;
}

/** Sides a reducer reached: the ones its own caster faced, which is what the help states. */
function indexReducedSides(events: readonly BattleEvent[], roster: CombatantRoster): Set<number> {
    const reducedSides = new Set<number>();
    for (const event of events) {
        if (event.kind !== BATTLE_EVENT.skillUsed) continue;
        if (
            !event.declared.some((declaredEffect) => declaredEffect.effect === HEALING_REDUCER_KEY)
        ) continue;
        // A caster nobody can name spared no side anybody can name, so every side is reduced.
        const casterSide = event.actorId === null
            ? undefined
            : roster.byId.get(event.actorId)?.side;
        for (const combatant of roster.byId.values()) {
            if (combatant.side !== casterSide) reducedSides.add(combatant.side);
        }
    }
    assert(reducedSides.size <= roster.byId.size, "a side reduced is a side somebody is on");
    return reducedSides;
}

/**
 * One cast, sized onto the caster's own side: a share of each member's maximum, floored, and capped
 * at what they entered the fight with. A member missing any of the three is not sized, and the cast
 * keeps saying so.
 */
function composeSideHeal(
    event: BattleEvent,
    roster: CombatantRoster,
    entryHealthByCombatantId: FightEntryHealth,
    healthByCombatantId: ReadonlyMap<number, number>,
): SideHeal | null {
    if (event.kind !== BATTLE_EVENT.unaccountedHealth) return null;
    if (event.combatantId === null) return null;
    const casterSide = roster.byId.get(event.combatantId)?.side;
    if (casterSide === undefined) return null;
    assert(event.declaredShare >= 0, "a share sized is never below nothing");
    const restoredByCombatantId = new Map<number, number>();
    let isWhole = true;
    for (const combatant of roster.byId.values()) {
        if (combatant.side !== casterSide) continue;
        const healthAtEntry = entryHealthByCombatantId.get(combatant.id);
        const healthNow = healthByCombatantId.get(combatant.id);
        const maximum = combatant.healthMaximum;
        if (maximum === null) isWhole = false;
        else if (healthAtEntry === undefined) isWhole = false;
        else if (healthNow === undefined) isWhole = false;
        else {
            const share = Math.floor((event.declaredShare * maximum) / PERCENT_WHOLE);
            const amount = clampNumber(share, 0, healthAtEntry - healthNow);
            assert(amount <= share, "nobody is given more than the share the protocol stated");
            restoredByCombatantId.set(combatant.id, amount);
        }
    }
    assert(
        restoredByCombatantId.size <= roster.byId.size,
        "a cast reaches the people in the fight",
    );
    const casterId = event.combatantId;
    const source = event.source;
    return {
        casterId,
        source,
        declaredShare: event.declaredShare,
        restoredByCombatantId,
        isWhole,
    };
}
