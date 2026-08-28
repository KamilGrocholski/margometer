/**
 * Health read out of the share the protocol states, and how far that reading can be off.
 *
 * A reading is refused rather than defaulted: a share taken of a maximum nobody stated is a
 * figure that is too high, which is the one direction a panel cannot mark.
 */

import { assert } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
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
    assert(roster.byId.size >= 0, "a roster states who is in the fight, however few");
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
