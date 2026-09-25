/**
 * The combatants the running fight holds, copied for a recording (`docs/design.md` §7).
 *
 * A snapshot is evidence and refuses nothing inside a warrior: an absent field is a fact about the
 * fight. What it refuses is a fight holding no collection of warriors at all, and one holding more
 * than a fight can. Only the fields the recordings already carry are kept, so new material and
 * admitted material are the same kind of thing.
 */

import { assert } from "@std/assert/assert";
import { err, ok, type Result } from "#/libs/result.ts";
import { isRecord, type UnknownRecord } from "#/libs/unknown-value.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";

/**
 * One combatant as the running fight holds them. The keys are the client's own and are the file's
 * as well (`captures/`), which is why this record is spelled in them.
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

export type WarriorSnapshot = readonly CapturedCombatant[];

export const WARRIOR_FAILURE = {
    warriorsAbsent: "warriors-absent",
    warriorsExceeded: "warriors-exceeded",
} as const;

export type WarriorFailure =
    | { kind: typeof WARRIOR_FAILURE.warriorsAbsent }
    | { kind: typeof WARRIOR_FAILURE.warriorsExceeded; count: number; maximum: number };

/**
 * Where the running fight keeps its combatants, in the order tried. Each receives every field of a
 * payload's own `w` entry verbatim (`OneWarrior.js`, development build `1781609507010`:
 * `for (var i in w) { _this[i] = w[i]; }`). `warriors` is tried after it because the client carries
 * a collection under that name too; whichever answers with named combatants first is the one used.
 */
const WARRIOR_COLLECTIONS = ["warriorsList", "warriors"] as const;
/** The id the game draws a warrior under; `originalId` is only ever a fallback for a recording. */
export const WARRIOR_ID_KEY = "id";
const IDENTITY_KEYS = [WARRIOR_ID_KEY, "originalId"] as const;
const COPIED_KEYS = ["name", "team", "prof", "lvl", "mana", "energy"] as const;
/** Live objects the game goes on mutating: held by reference, the after reads as the before. */
const SHALLOW_COPIED_KEYS = ["hp", "ac"] as const;
const NAME_KEY = "name";

export function readWarriorSnapshot(battle: unknown): Result<WarriorSnapshot, WarriorFailure> {
    const named = readNamedWarriors(battle);
    if (!named.ok) return named;
    const snapshot = named.value.map(readWarriorSnapshotCombatant);
    assert(snapshot.length === named.value.length, "every named warrior is copied once");
    return ok(snapshot);
}

/** Never `structuredClone` of the warrior, which carries references to the page and the engine. */
function readWarriorSnapshotCombatant(warrior: UnknownRecord): CapturedCombatant {
    let id: number | null = null;
    for (const key of IDENTITY_KEYS) {
        if (id !== null) break;
        const stated = warrior[key];
        if (typeof stated !== "number") continue;
        if (Number.isFinite(stated)) id = stated;
    }
    const copied: Record<string, unknown> = {};
    for (const key of COPIED_KEYS) copied[key] = warrior[key] ?? null;
    for (const key of SHALLOW_COPIED_KEYS) {
        const value = warrior[key];
        copied[key] = isRecord(value) ? { ...value } : value ?? null;
    }
    assert(Object.keys(copied).length === COPIED_KEYS.length + SHALLOW_COPIED_KEYS.length, "all");
    const { name, team, prof, lvl, hp, mana, energy, ac } = copied;
    return { id, name, team, prof, lvl, hp, mana, energy, ac };
}

/**
 * The warriors themselves, out of whichever collection answers first: the objects the game goes on
 * drawing, so the one other reader of them, the tooltip, writes through their own methods.
 */
export function readNamedWarriors(battle: unknown): Result<UnknownRecord[], WarriorFailure> {
    if (!isRecord(battle)) return err({ kind: WARRIOR_FAILURE.warriorsAbsent });
    for (const collection of WARRIOR_COLLECTIONS) {
        const held = battle[collection];
        if (!isRecord(held)) continue;
        const named = Object.values(held).filter(isNamedWarrior);
        if (named.length === 0) continue;
        if (named.length > COMBATANTS_MAXIMUM) {
            const count = named.length;
            const maximum = COMBATANTS_MAXIMUM;
            return err({ kind: WARRIOR_FAILURE.warriorsExceeded, count, maximum });
        }
        return ok(named);
    }
    return err({ kind: WARRIOR_FAILURE.warriorsAbsent });
}

function isNamedWarrior(value: unknown): value is UnknownRecord {
    if (!isRecord(value)) return false;
    const name = value[NAME_KEY];
    if (typeof name !== "string") return false;
    return name.length > 0;
}
