/**
 * The combatants the game states, read two ways: into the roster's own shape, and into the
 * snapshot a recording carries.
 *
 * A combatant missing what the roster needs is refused rather than defaulted; a snapshot refuses
 * nothing, because it is evidence and an absent field is a fact about the fight.
 */

import { assert } from "@std/assert/assert";
import { MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import type { Combatant } from "@/src/core/combatant-roster.ts";
import type { ChargedSkillStatement } from "@/src/core/charged-skill.ts";
import {
    getNumberFromUnknown,
    getStatedTextFromUnknown,
    isRecord,
} from "@/libs/unknown-reading.ts";

const WARRIORS_KEY = "w";
const HEALTH_KEY = "hp";
const HEALTH_MAXIMUM_KEY = "max";
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
    side: "team",
    profession: "prof",
    level: "lvl",
    health: HEALTH_KEY,
    healthMaximum: HEALTH_MAXIMUM_KEY,
} as const;

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

export function readCombatantFromWarrior(value: unknown): Combatant | null {
    if (!isRecord(value)) return null;
    const id = getNumberFromUnknown(value[WARRIOR_FIELDS.identity]);
    if (id === null) return null;
    const name = getStatedTextFromUnknown(value[WARRIOR_FIELDS.name]);
    if (name === null) return null;
    const side = getNumberFromUnknown(value[WARRIOR_FIELDS.side]);
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
        profession: getStatedTextFromUnknown(value[WARRIOR_FIELDS.profession]),
        level: getNumberFromUnknown(value[WARRIOR_FIELDS.level]),
        healthMaximum,
    };
}

/**
 * The client keys its warriors by id, in every payload of `captures/` that carries any. A list
 * of them would be the same people in order, and asking which spelling it is would lose a whole
 * cast to a shape that means what the other one means. Only the payload holding them is asked to
 * be keyed, because that is looked up by name.
 */
function readWarriorsFromValue(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (!isRecord(value)) return [];
    const stated = Object.values(value);
    assert(stated.length <= Object.keys(value).length, "a keyed cast is read once per key");
    assert(stated.length <= MAXIMUM_COMBATANTS, "and stays inside the fight's stated bound");
    return stated;
}

/** Every combatant a payload states in full. One stating only what moved states none. */
export function readCombatantsFromPayload(payload: unknown): Combatant[] {
    if (!isRecord(payload)) return [];
    const found: Combatant[] = [];
    for (const value of readWarriorsFromValue(payload[WARRIORS_KEY])) {
        const combatant = readCombatantFromWarrior(value);
        if (combatant === null) continue;
        found.push(combatant);
    }
    assert(found.length <= MAXIMUM_COMBATANTS, "a payload stays inside the fight's stated bound");
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

function readIdentityFromWarrior(warrior: Record<string, unknown>): number | null {
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
        id: readIdentityFromWarrior(warrior),
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

function readNamedWarriors(collection: unknown): Record<string, unknown>[] {
    if (!isRecord(collection)) return [];
    const named: Record<string, unknown>[] = [];
    for (const warrior of Object.values(collection)) {
        if (!isRecord(warrior)) continue;
        if (getStatedTextFromUnknown(warrior[NAME_KEY]) === null) continue;
        named.push(warrior);
    }
    assert(named.length <= MAXIMUM_COMBATANTS, "a fight stays inside its stated bound");
    return named;
}

/** An empty list where neither collection answers: a snapshot saying nothing, not a guess. */
export function composeSnapshotFromBattle(battle: Record<string, unknown>): CapturedCombatant[] {
    for (const field of WARRIOR_COLLECTIONS) {
        const named = readNamedWarriors(battle[field]);
        if (named.length === 0) continue;
        assert(named.length > 0, "a collection that answered answered with somebody");
        return named.map((warrior) => composeCapturedCombatant(warrior));
    }
    assert(WARRIOR_COLLECTIONS.length > 0, "there is a collection to look in");
    return [];
}

/**
 * The charge a warrior record carries, under the client's own name for it. Spelled here and
 * nowhere else (**N13**); `docs/protocol-keys.md` covers message keys and this is an envelope
 * field, so what it means is `src/core/charged-skill.ts`'s docblock.
 */
const CHARGE_KEY = "super_cast";
const CHARGE_FIELDS = {
    name: "name",
    turnsElapsed: "turn",
    turnsStated: "total_turns",
} as const;

/**
 * A charge refused rather than defaulted, on the same terms a combatant is: the pair of figures
 * is the whole of what the panel draws, so half of it is nothing worth drawing. A record stating
 * no charge is a **statement** and not a refusal — that is how the game says one has ended.
 */
function readChargeFromWarrior(value: Record<string, unknown>) {
    const stated = value[CHARGE_KEY];
    if (!isRecord(stated)) return null;
    const skillName = getStatedTextFromUnknown(stated[CHARGE_FIELDS.name]);
    if (skillName === null) return null;
    const turnsElapsed = getNumberFromUnknown(stated[CHARGE_FIELDS.turnsElapsed]);
    if (turnsElapsed === null) return null;
    const turnsStated = getNumberFromUnknown(stated[CHARGE_FIELDS.turnsStated]);
    if (turnsStated === null) return null;
    if (turnsElapsed < 0) return null;
    if (turnsStated < turnsElapsed) return null;
    assert(skillName.length > 0, "a charge that was read names the blow it is making ready");
    assert(Number.isFinite(turnsStated), "and states how long the whole of it runs");
    return { skillName, turnsElapsed, turnsStated };
}

/**
 * Every combatant this payload stated, with the charge they carry or the absence of one. Both
 * halves matter: a payload states only what moved, so a combatant it says nothing about is
 * charging what they were charging, and only a record carrying no charge ends one.
 */
export function readChargedSkillStatements(payload: unknown): ChargedSkillStatement[] {
    if (!isRecord(payload)) return [];
    const found: ChargedSkillStatement[] = [];
    for (const value of readWarriorsFromValue(payload[WARRIORS_KEY])) {
        if (!isRecord(value)) continue;
        // The roster is keyed by `id`, so a charge is keyed by `id` too: reading the other
        // spelling here would hand the panel a combatant its own roster cannot place.
        const combatantId = getNumberFromUnknown(value[WARRIOR_FIELDS.identity]);
        if (combatantId === null) continue;
        found.push({ combatantId, charge: readChargeFromWarrior(value) });
    }
    assert(found.length <= MAXIMUM_COMBATANTS, "a payload stays inside the fight's stated bound");
    return found;
}
