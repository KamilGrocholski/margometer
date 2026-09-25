/**
 * Health read out of the share the protocol states, and the casts stated about a whole side sized
 * onto its members.
 *
 * A reading is refused rather than defaulted: a share taken of a maximum nobody stated is a figure
 * that is too high, which is the one direction a panel cannot mark.
 */

import { assert } from "@std/assert/assert";
import { clamp } from "#/libs/number-range.ts";
import { BATTLE_EVENT, type BattleEvent } from "./battle-event.ts";
import { type CombatantRoster, COMBATANTS_MAXIMUM } from "./combatant-roster.ts";
import { HEALING_REDUCER_KEY } from "./protocol-key.ts";
import { HEALTH_PERCENT_PLACES } from "./protocol-number.ts";

/** What each combatant held when the fight began. Missing where nothing ever stated them. */
export type FightEntryHealth = ReadonlyMap<number, number>;

export interface TeamHeal {
    casterId: number;
    source: string;
    declaredShare: number;
    restoredByCombatantId: ReadonlyMap<number, number>;
    /** False where a side-mate could not be sized, so the cast is still counted as missing. */
    isWhole: boolean;
}

const PERCENT_WHOLE = 100;
const DECIMAL_BASE = 10;
/** Two places stand for a band half a place wide, and the health behind it is that share. */
const HALF_PLACE = 0.5;
const ENDS_MAXIMUM = 2;

/**
 * How far a health read from a two-place percentage can be off. The guards measuring the corpus
 * against it read the band from here, so `HEALTH_PERCENT_PLACES` is spelled once.
 */
export function deriveHealthTolerance(healthMaximum: number): number {
    assert(Number.isFinite(healthMaximum), "a maximum to measure against is a number");
    assert(healthMaximum >= 0, "a maximum is never below nothing");
    const places = DECIMAL_BASE ** HEALTH_PERCENT_PLACES;
    const band = (healthMaximum * HALF_PLACE) / (PERCENT_WHOLE * places);
    return Math.ceil(band + HALF_PLACE);
}

/** Null where nothing stated a maximum. Zero is a reading, and never stands in for one. */
export function deriveHealthFromPercent(
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
export function getStatedHealthsFromEvent(event: BattleEvent): [number, number][] {
    const stated: [number, number][] = [];
    const add = (combatantId: number | null, percent: number | null): void => {
        if (combatantId === null) return;
        if (percent !== null) stated.push([combatantId, percent]);
    };
    switch (event.kind) {
        case BATTLE_EVENT.attack:
        case BATTLE_EVENT.skillUsed:
            add(event.actorId, event.actorHealthPercent);
            add(event.targetId, event.targetHealthPercent);
            break;
        case BATTLE_EVENT.healthChange:
        case BATTLE_EVENT.declaration:
            add(event.combatantId, event.healthPercent);
            break;
        case BATTLE_EVENT.damageToNamedCombatant:
        case BATTLE_EVENT.healingToNamedCombatant:
            add(event.targetId, event.targetHealthPercent);
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
    const entered = new Map<number, number>();
    for (const event of events) {
        for (const [combatantId, percent] of getStatedHealthsFromEvent(event)) {
            if (entered.has(combatantId)) continue;
            const maximum = roster.byId.get(combatantId)?.healthMaximum ?? null;
            const health = deriveHealthFromPercent(percent, maximum);
            if (health === null) continue;
            if (maximum !== null) assert(health <= maximum, "nobody enters above their own pool");
            entered.set(combatantId, health);
        }
    }
    assert(entered.size <= roster.byId.size, "a fight is entered by the people in it");
    return entered;
}

/**
 * Every cast in a fight, sized against where each member stood when it landed. Nothing is sized on
 * a side a reducer reached: the help scopes that reduction and the protocol never states the figure
 * it left, so a cast there is refused whole rather than reported short.
 */
export function indexTeamHeals(
    events: readonly BattleEvent[],
    roster: CombatantRoster,
): ReadonlyMap<BattleEvent, TeamHeal> {
    const entered = indexFightEntryHealth(events, roster);
    const reduced = indexReducedSides(events, roster);
    const held = new Map<number, number>();
    const heals = new Map<BattleEvent, TeamHeal>();
    for (const event of events) {
        const heal = deriveTeamHeal(event, roster, entered, held);
        if (heal !== null) {
            const casterSide = roster.byId.get(heal.casterId)?.side;
            let isReduced = false;
            if (casterSide !== undefined) isReduced = reduced.has(casterSide);
            if (!isReduced) {
                heals.set(event, heal);
                // What a cast put back is health the next one cannot put back again.
                for (const [combatantId, amount] of heal.restoredByCombatantId) {
                    held.set(combatantId, (held.get(combatantId) ?? 0) + amount);
                }
            }
        }
        for (const [combatantId, percent] of getStatedHealthsFromEvent(event)) {
            const maximum = roster.byId.get(combatantId)?.healthMaximum ?? null;
            const health = deriveHealthFromPercent(percent, maximum);
            if (health !== null) held.set(combatantId, health);
        }
    }
    assert(heals.size <= events.length, "a cast is one event");
    return heals;
}

/** Sides a reducer reached: the ones its own caster faced, which is what the help states. */
function indexReducedSides(events: readonly BattleEvent[], roster: CombatantRoster): Set<number> {
    const reduced = new Set<number>();
    for (const event of events) {
        if (event.kind !== BATTLE_EVENT.skillUsed) continue;
        if (!event.declared.some((one) => one.effect === HEALING_REDUCER_KEY)) continue;
        if (event.actorId === null) continue;
        const casterSide = roster.byId.get(event.actorId)?.side;
        for (const combatant of roster.byId.values()) {
            if (combatant.side !== casterSide) reduced.add(combatant.side);
        }
    }
    assert(reduced.size <= roster.byId.size, "a side reduced is a side somebody is on");
    return reduced;
}

/**
 * One cast, sized onto the caster's own side: a share of each member's maximum, floored, and capped
 * at what they entered the fight with. A member missing any of the three is not sized, and the cast
 * keeps saying so.
 */
function deriveTeamHeal(
    event: BattleEvent,
    roster: CombatantRoster,
    entered: FightEntryHealth,
    held: ReadonlyMap<number, number>,
): TeamHeal | null {
    if (event.kind !== BATTLE_EVENT.unaccountedHealth) return null;
    if (event.combatantId === null) return null;
    if (event.declaredShare === null) return null;
    const casterSide = roster.byId.get(event.combatantId)?.side;
    if (casterSide === undefined) return null;
    assert(event.declaredShare >= 0, "a share sized is never below nothing");
    const restored = new Map<number, number>();
    let isWhole = true;
    for (const combatant of roster.byId.values()) {
        if (combatant.side !== casterSide) continue;
        const entry = entered.get(combatant.id);
        const now = held.get(combatant.id);
        const maximum = combatant.healthMaximum;
        if (maximum === null) isWhole = false;
        else if (entry === undefined) isWhole = false;
        else if (now === undefined) isWhole = false;
        else {
            const share = Math.floor((event.declaredShare * maximum) / PERCENT_WHOLE);
            const amount = clamp(share, 0, entry - now);
            assert(amount <= share, "nobody is given more than the share the protocol stated");
            restored.set(combatant.id, amount);
        }
    }
    assert(restored.size <= roster.byId.size, "a cast reaches the people in the fight");
    const casterId = event.combatantId;
    const source = event.source;
    return {
        casterId,
        source,
        declaredShare: event.declaredShare,
        restoredByCombatantId: restored,
        isWhole,
    };
}
