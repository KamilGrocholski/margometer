/**
 * The combatants the game states, read two ways: into the roster's own shape, and into the
 * snapshot a recording carries.
 *
 * This file spells the client's field names, and it is the only one that does. Everything above
 * it reads a `Combatant` or a `CapturedCombatant`, so a name the game changes is one edit here
 * rather than a field reading `undefined` in five places.
 *
 * A combatant missing what the roster needs is refused rather than defaulted; a snapshot refuses
 * nothing, because it is evidence and an absent field is a fact about the fight.
 */

import { assert } from "@std/assert";
import type { Combatant } from "@/src/core/combatant-roster.ts";
import { getNumberFromUnknown, getTextFromUnknown, isRecord } from "@/src/core/unknown-reading.ts";

const WARRIORS_KEY = "w";
const HEALTH_KEY = "hp";
/**
 * What a payload's own warrior is read by, wherever it is read — **N13**. `npc` is here and
 * nowhere in a `Combatant`: this add-on never needs to know who is a person, and the one reader
 * that does is the intake tool, which refuses a combatant it cannot read it for.
 */
export const WARRIOR_FIELDS = {
    warriors: WARRIORS_KEY,
    identity: "id",
    name: "name",
    nonPlayer: "npc",
} as const;
const HEALTH_MAXIMUM_KEY = "max";
/** A side holds at most ten, so a fight holds twenty. The largest in `captures/` is 11. */
const MAXIMUM_WARRIORS = 20;
/**
 * Where the running fight keeps its combatants, in the order tried. Each value receives every
 * field of a payload's own `w` entry verbatim — `OneWarrior.js` on development build
 * `1781609507010`: `for (var i in w) { _this[i] = w[i]; }`, and `this.warriorsList={}` appears on
 * production `1786441768914` as well. `warriors` is tried after it because the client carries a
 * collection under that name too; whichever answers with named combatants first is the one used.
 */
const WARRIOR_COLLECTIONS = ["warriorsList", "warriors"];
const NAME_KEY = "name";
const IDENTITY_KEYS = ["id", "originalId"];

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

/**
 * One combatant as the running fight holds them, for a recording rather than a reading. Only the
 * fields the recordings already carry, so new material and admitted material are the same kind of
 * thing. `npc` is deliberately absent, as it is from every recording: it rides in the payload's
 * own `w`, which is recorded whole.
 */
export interface CapturedCombatant {
    id: number | null;
    name: unknown;
    team: unknown;
    prof: unknown;
    lvl: unknown;
    hp: unknown;
    mana: unknown;
    energy: unknown;
    ac: unknown;
}

/**
 * A copy, because `hp` and `ac` are live objects the game goes on mutating: holding the reference
 * would show the state after a call as the state before it. Never `structuredClone` of the
 * combatant, which carries references to the page and to the engine itself.
 */
function composeShallowCopy(value: unknown): unknown {
    if (!isRecord(value)) return value ?? null;
    const copied = { ...value };
    assert(copied !== value, "a snapshot holds a copy rather than what the game goes on changing");
    assert(Object.keys(copied).length === Object.keys(value).length, "and loses nothing to it");
    return copied;
}

function getIdentityFromWarrior(warrior: Record<string, unknown>): number | null {
    for (const key of IDENTITY_KEYS) {
        const stated = getNumberFromUnknown(warrior[key]);
        if (stated !== null) return stated;
    }
    assert(IDENTITY_KEYS.length > 0, "there is a spelling of an id to try");
    return null;
}

function composeCapturedCombatant(warrior: Record<string, unknown>): CapturedCombatant {
    assert(NAME_KEY.length > 0, "a combatant put in a snapshot was found by a name");
    assert(isRecord(warrior), "and is a record before any field is read off it");
    return {
        id: getIdentityFromWarrior(warrior),
        name: warrior[NAME_KEY] ?? null,
        team: warrior.team ?? null,
        prof: warrior.prof ?? null,
        lvl: warrior.lvl ?? null,
        hp: composeShallowCopy(warrior[HEALTH_KEY]),
        mana: warrior.mana ?? null,
        energy: warrior.energy ?? null,
        ac: composeShallowCopy(warrior.ac),
    };
}

/** Every named combatant in a collection, or nothing where none of them is named. */
function getNamedWarriors(collection: unknown): Record<string, unknown>[] {
    if (!isRecord(collection)) return [];
    const named: Record<string, unknown>[] = [];
    for (const warrior of Object.values(collection)) {
        if (!isRecord(warrior)) continue;
        if (getTextFromUnknown(warrior[NAME_KEY]) === null) continue;
        named.push(warrior);
    }
    assert(named.length <= MAXIMUM_WARRIORS, "a fight stays inside its stated bound");
    return named;
}

/** An empty list where neither collection answers: a snapshot saying nothing, not a guess. */
export function composeSnapshotFromBattle(battle: Record<string, unknown>): CapturedCombatant[] {
    for (const field of WARRIOR_COLLECTIONS) {
        const named = getNamedWarriors(battle[field]);
        if (named.length === 0) continue;
        assert(named.length > 0, "a collection that answered answered with somebody");
        return named.map((warrior) => composeCapturedCombatant(warrior));
    }
    assert(WARRIOR_COLLECTIONS.length > 0, "there is a collection to look in");
    return [];
}
