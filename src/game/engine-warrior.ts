/**
 * The combatants the game states in a payload, read into the roster's own shape.
 *
 * This file spells the client's field names, and it is the only one that does: `w`, `hp`, `lvl`,
 * `prof`, `team`. Everything above it reads a `Combatant`, so a name the game changes is one
 * edit here rather than a field reading `undefined` in five places.
 *
 * A combatant missing any of them is refused rather than defaulted, and a payload that states
 * only what moved is most of them — the game repeats the whole warrior only when it must.
 */

import { assert } from "@std/assert";
import type { Combatant } from "@/src/core/combatant-roster.ts";
import { getNumberFromUnknown, getTextFromUnknown, isRecord } from "@/src/core/unknown-reading.ts";

const WARRIORS_KEY = "w";
const HEALTH_KEY = "hp";
const HEALTH_MAXIMUM_KEY = "max";
/** A side holds at most ten, so a fight holds twenty. The largest in `captures/` is 11. */
const MAXIMUM_WARRIORS = 20;

export function getCombatantFromWarrior(value: unknown): Combatant | null {
    if (!isRecord(value)) return null;
    const id = getNumberFromUnknown(value.id);
    if (id === null) return null;
    const name = getTextFromUnknown(value.name);
    if (name === null) return null;
    const side = getNumberFromUnknown(value.team);
    if (side === null) return null;
    const health = isRecord(value[HEALTH_KEY]) ? value[HEALTH_KEY] : null;
    assert(Number.isFinite(id), "an id that was read is a number");
    assert(name.length > 0, "a name that was read says something");
    const healthMaximum = health === null ? null : getNumberFromUnknown(health[HEALTH_MAXIMUM_KEY]);
    assert(healthMaximum === null || healthMaximum > 0, "a pool that was read holds something");
    return {
        id,
        name,
        side,
        profession: getTextFromUnknown(value.prof),
        level: getNumberFromUnknown(value.lvl),
        healthMaximum,
    };
}

/**
 * The client keys its warriors by id, in every payload of `captures/` that carries any. A list
 * of them would be the same people in order, and asking which spelling it is would lose a whole
 * cast to a shape that means what the other one means. Only the payload holding them is asked to
 * be keyed, because that is looked up by name.
 */
function getWarriorsFromValue(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (!isRecord(value)) return [];
    const stated = Object.values(value);
    assert(stated.length <= Object.keys(value).length, "a keyed cast is read once per key");
    assert(stated.length <= MAXIMUM_WARRIORS, "and stays inside the fight's stated bound");
    return stated;
}

/** Every combatant a payload states in full. One stating only what moved states none. */
export function getCombatantsFromPayload(payload: unknown): Combatant[] {
    if (!isRecord(payload)) return [];
    const found: Combatant[] = [];
    for (const value of getWarriorsFromValue(payload[WARRIORS_KEY])) {
        const combatant = getCombatantFromWarrior(value);
        if (combatant === null) continue;
        found.push(combatant);
    }
    assert(found.length <= MAXIMUM_WARRIORS, "a payload stays inside the fight's stated bound");
    assert(new Set(found.map((one) => one.id)).size === found.length, "a combatant is read once");
    assert(found.every((one) => one.name.length > 0), "every combatant read is named");
    assert(found.every((one) => Number.isFinite(one.side)), "every combatant read has a side");
    return found;
}
