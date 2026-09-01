/**
 * Health read out of the share the protocol states, and how far that reading can be off.
 *
 * A reading is refused rather than defaulted: a share taken of a maximum nobody stated is a
 * figure that is too high, which is the one direction a panel cannot mark.
 */

import { getValueWithin } from "@/libs/number-range.ts";
import { assert } from "@std/assert/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { type CombatantRoster, MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import { HEALTH_PERCENT_PLACES } from "@/src/core/protocol-number.ts";

const PERCENT_WHOLE = 100;
const DECIMAL_BASE = 10;
/** Two places stand for a band half a place wide, and the health behind it is that share. */
const HALF_PLACE = 0.5;

export function getHealthToleranceFromMaximum(healthMaximum: number): number {
    assert(Number.isFinite(healthMaximum), "a maximum to measure against is a number");
    assert(healthMaximum >= 0, "a maximum is never below nothing");
    const places = DECIMAL_BASE ** HEALTH_PERCENT_PLACES;
    const band = (healthMaximum * HALF_PLACE) / (PERCENT_WHOLE * places);
    return Math.ceil(band + HALF_PLACE);
}

/** Null where nothing stated a maximum. Zero is a reading, and never stands in for one. */
export function getHealthFromPercent(percent: number, healthMaximum: number | null): number | null {
    assert(Number.isFinite(percent), "a percentage to read from is a number");
    assert(percent >= 0, "a percentage is never below nothing");
    if (healthMaximum === null) return null;
    assert(Number.isFinite(healthMaximum), "a maximum to read against is a number");
    const health = Math.round((percent * healthMaximum) / PERCENT_WHOLE);
    assert(health >= 0, "health read from a percentage is never below nothing");
    return health;
}

/** What each combatant held when the fight began. Missing where nothing ever stated them. */
export type FightEntryHealth = ReadonlyMap<number, number>;

/**
 * Where an event says a combatant stands. Read here rather than at each caller, so the health
 * the protocol states is gathered in one place whatever event carried it.
 */
export function getStatedHealthFromEvent(event: BattleEvent): [number, number][] {
    const stated: [number, number][] = [];
    if (event.kind === "attack" || event.kind === "skill-used") {
        if (event.actorId !== null && event.actorHealthPercent !== null) {
            stated.push([event.actorId, event.actorHealthPercent]);
        }
        if (event.targetId !== null && event.targetHealthPercent !== null) {
            stated.push([event.targetId, event.targetHealthPercent]);
        }
    }
    if (event.kind === "health-change" || event.kind === "declaration") {
        if (event.combatantId !== null && event.healthPercent !== null) {
            stated.push([event.combatantId, event.healthPercent]);
        }
    }
    if (event.kind === "damage-to-named-combatant" || event.kind === "healing-to-named-combatant") {
        if (event.targetId !== null && event.targetHealthPercent !== null) {
            stated.push([event.targetId, event.targetHealthPercent]);
        }
    }
    assert(stated.length <= 2, "an event states where at most two combatants stand");
    return stated;
}

/**
 * The health a fight was entered with, unwound from the **first** statement about each combatant.
 *
 * A message that moves somebody's health names them, so the first percentage stated about a
 * combatant is at or before anything that could have changed it. The exception is the one gap 12
 * records: a payload that moves health with no message at all.
 *
 * A combatant nothing states, or one with no maximum, is left out rather than guessed at: a share
 * capped against an entry health we assumed is a figure that is too high.
 */
export function composeFightEntryHealth(
    events: readonly BattleEvent[],
    roster: CombatantRoster,
): FightEntryHealth {
    const entered = new Map<number, number>();
    assert(roster.byId.size <= MAXIMUM_COMBATANTS, "a roster stays inside its stated bound");
    for (const event of events) {
        for (const [combatantId, percent] of getStatedHealthFromEvent(event)) {
            if (entered.has(combatantId)) continue;
            const maximum = roster.byId.get(combatantId)?.healthMaximum ?? null;
            const health = getHealthFromPercent(percent, maximum);
            if (health === null) continue;
            assert(maximum === null || health <= maximum, "nobody enters above their own pool");
            entered.set(combatantId, health);
        }
    }
    assert(entered.size <= roster.byId.size, "a fight is entered by the people in it");
    assert([...entered.values()].every((one) => one >= 0), "nobody enters below nothing");
    return entered;
}

export interface TeamHeal {
    casterId: number;
    source: string;
    declaredShare: number;
    restoredByCombatantId: ReadonlyMap<number, number>;
    /** False where a side-mate could not be sized, so the cast is still counted as missing. */
    isWhole: boolean;
}

/** The key that reduces this healing, which the help scopes to the caster's opposing side. */
const HEALING_REDUCER_KEY = "lowheal_per-enemies";
const PERCENT_SHARE = 100;

/** Sides a reducer reached: the ones its own caster faced, which is what the help states. */
function getReducedSides(events: readonly BattleEvent[], roster: CombatantRoster): Set<number> {
    assert(HEALING_REDUCER_KEY.length > 0, "the reducer is a key with a name");
    const reduced = new Set<number>();
    for (const event of events) {
        if (event.kind !== "skill-used") continue;
        if (!event.declared.some((one) => one.effect === HEALING_REDUCER_KEY)) continue;
        const casterSide = roster.byId.get(event.actorId ?? Number.NaN)?.side;
        for (const combatant of roster.byId.values()) {
            if (combatant.side === casterSide) continue;
            reduced.add(combatant.side);
        }
    }
    assert(reduced.size <= roster.byId.size, "a side reduced is a side somebody is on");
    return reduced;
}

/**
 * One cast, sized onto the caster's own side: a share of each member's maximum, floored, and
 * capped at what they entered the fight with. A member missing any of the three is not sized,
 * and the cast keeps saying so.
 */
function composeTeamHeal(
    event: BattleEvent,
    roster: CombatantRoster,
    entered: FightEntryHealth,
    held: ReadonlyMap<number, number>,
): TeamHeal | null {
    if (event.kind !== "unaccounted-health") return null;
    if (event.combatantId === null) return null;
    if (event.declaredShare === null) return null;
    const casterSide = roster.byId.get(event.combatantId)?.side;
    if (casterSide === undefined) return null;
    const restored = new Map<number, number>();
    assert(event.declaredShare >= 0, "a share sized is never below nothing");
    let isWhole = true;
    for (const combatant of roster.byId.values()) {
        if (combatant.side !== casterSide) continue;
        const entry = entered.get(combatant.id);
        const now = held.get(combatant.id);
        if (combatant.healthMaximum === null || entry === undefined || now === undefined) {
            isWhole = false;
            continue;
        }
        const share = Math.floor((event.declaredShare * combatant.healthMaximum) / PERCENT_SHARE);
        const amount = getValueWithin(share, 0, entry - now);
        assert(amount <= share, "nobody is given more than the share the protocol stated");
        restored.set(combatant.id, amount);
    }
    assert(restored.size <= roster.byId.size, "a cast reaches the people in the fight");
    return {
        casterId: event.combatantId,
        source: event.source,
        declaredShare: event.declaredShare,
        restoredByCombatantId: restored,
        isWhole,
    };
}

/**
 * Every cast in a fight, sized against where each member stood when it landed. Nothing is sized
 * on a side a reducer reached: the help scopes that reduction and the protocol never states the
 * figure it left, so a cast there is refused whole rather than reported short.
 */
export function composeTeamHeals(
    events: readonly BattleEvent[],
    roster: CombatantRoster,
): ReadonlyMap<BattleEvent, TeamHeal> {
    const entered = composeFightEntryHealth(events, roster);
    const reduced = getReducedSides(events, roster);
    const held = new Map<number, number>();
    // Keyed by the event it was sized from, so a walker over the same fight can put the health
    // back exactly where the cast landed rather than guessing at the order.
    const heals = new Map<BattleEvent, TeamHeal>();
    for (const event of events) {
        const heal = composeTeamHeal(event, roster, entered, held);
        if (heal !== null && !reduced.has(roster.byId.get(heal.casterId)?.side ?? Number.NaN)) {
            heals.set(event, heal);
            // What a cast put back is health the next one cannot put back again. Without this a
            // second cast between two statements is sized against the health before the first,
            // and the two together restore more than the protocol's own percentages allow.
            for (const [combatantId, amount] of heal.restoredByCombatantId) {
                held.set(combatantId, (held.get(combatantId) ?? 0) + amount);
            }
        }
        for (const [combatantId, percent] of getStatedHealthFromEvent(event)) {
            const health = getHealthFromPercent(
                percent,
                roster.byId.get(combatantId)?.healthMaximum ?? null,
            );
            if (health !== null) held.set(combatantId, health);
        }
    }
    assert(
        [...heals.values()].every((one) => one.declaredShare >= 0),
        "a share sized is never below nothing",
    );
    return heals;
}
