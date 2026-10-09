/**
 * The combatants the running fight holds, copied for a recording (`docs/design.md` §7).
 *
 * A snapshot is evidence and refuses nothing inside a warrior: an absent field is a fact about the
 * fight. What it refuses is a fight holding no collection of warriors at all, and one holding more
 * than a fight can. Only the fields the recordings already carry are kept, so new material and
 * admitted material are the same kind of thing.
 */

import { assert } from "@std/assert/assert";
import { isRecord, type UnknownRecord } from "#/libs/unknown-value.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import { WARRIOR_FIELDS } from "./payload-envelope.ts";

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

export type MargonemEngineWarriorSnapshot = readonly CapturedCombatant[];

export class MargonemEngineWarriorsAbsent extends Error {
    override readonly name = "MargonemEngineWarriorsAbsent";
}

/**
 * A battle holding neither collection the game keeps its fighters in. Production build `DHSqC3Uh`
 * empties `warriorsList` between fights (`clearWarriorList`) and never removes it, so this is a
 * game that keeps its fighters somewhere else now, not a board with nobody on it.
 */
export class MargonemEngineWarriorCollectionAbsent extends Error {
    override readonly name = "MargonemEngineWarriorCollectionAbsent";
}

export class MargonemEngineWarriorsExceeded extends Error {
    override readonly name = "MargonemEngineWarriorsExceeded";
    readonly count: number;
    readonly maximum: number;

    constructor(count: number, maximum: number) {
        super();
        this.count = count;
        this.maximum = maximum;
    }
}

export type MargonemEngineWarriorFailure =
    | MargonemEngineWarriorsAbsent
    | MargonemEngineWarriorCollectionAbsent
    | MargonemEngineWarriorsExceeded;

/**
 * Where the running fight keeps its combatants, in the order tried. Each receives every field of a
 * payload's own `w` entry verbatim (`OneWarrior.js`, development build `1781609507010`:
 * `for (var i in w) { _this[i] = w[i]; }`). `warriors` is tried after it because the client carries
 * a collection under that name too; whichever answers with named combatants first is the one used.
 */
const WARRIOR_COLLECTIONS = ["warriorsList", "warriors"] as const;
/**
 * The engine's warrior is built from the payload's entry key for key, so the keys the envelope
 * reads are spelled once, in `WARRIOR_FIELDS`. The id is the one the game draws a warrior under;
 * `originalId` is only ever a fallback for a recording.
 */
export const WARRIOR_ID_KEY = WARRIOR_FIELDS.id;
/** The keys a warrior carries that no payload's envelope reads, and a snapshot copies. */
export const WARRIOR_SNAPSHOT_FIELDS = {
    originalId: "originalId",
    mana: "mana",
    energy: "energy",
    armour: "ac",
} as const;
const IDENTITY_KEYS = [WARRIOR_ID_KEY, WARRIOR_SNAPSHOT_FIELDS.originalId] as const;
const COPIED_KEYS = [
    WARRIOR_FIELDS.name,
    WARRIOR_FIELDS.side,
    WARRIOR_FIELDS.profession,
    WARRIOR_FIELDS.level,
    WARRIOR_SNAPSHOT_FIELDS.mana,
    WARRIOR_SNAPSHOT_FIELDS.energy,
] as const;
/** Live objects the game goes on mutating: held by reference, the after reads as the before. */
const SHALLOW_COPIED_KEYS = [WARRIOR_FIELDS.health, WARRIOR_SNAPSHOT_FIELDS.armour] as const;
const NAME_KEY = WARRIOR_FIELDS.name;

export function readMargonemEngineWarriorSnapshot(
    battle: unknown,
): MargonemEngineWarriorSnapshot | MargonemEngineWarriorFailure {
    const named = readMargonemEngineWarriorsNamed(battle);
    if (named instanceof Error) return named;
    const snapshot = named.map(readCapturedCombatant);
    assert(snapshot.length === named.length, "every named warrior is copied once");
    return snapshot;
}

/** Never `structuredClone` of the warrior, which carries references to the page and the engine. */
function readCapturedCombatant(warrior: UnknownRecord): CapturedCombatant {
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
        const copiedValue = warrior[key];
        copied[key] = isRecord(copiedValue) ? { ...copiedValue } : copiedValue ?? null;
    }
    assert(
        Object.keys(copied).length === COPIED_KEYS.length + SHALLOW_COPIED_KEYS.length,
        "a copy holds every kept key of the warrior, once",
    );
    const { name, team, prof, lvl, hp, mana, energy, ac } = copied;
    return { id, name, team, prof, lvl, hp, mana, energy, ac };
}

/**
 * The warriors themselves, out of whichever collection answers first: the objects the game goes on
 * drawing, so the one other reader of them, the tooltip, writes through their own methods. A
 * collection of theirs that repeats an id holds one fighter, so each id is taken once, before the
 * bound is held: a full board with one fighter under two keys is a full board, not one past it.
 */
export function readMargonemEngineWarriorsNamed(
    battle: unknown,
): UnknownRecord[] | MargonemEngineWarriorFailure {
    if (!isRecord(battle)) return new MargonemEngineWarriorsAbsent();
    let hasCollection = false;
    for (const collectionKey of WARRIOR_COLLECTIONS) {
        const collection = battle[collectionKey];
        if (!isRecord(collection)) continue;
        hasCollection = true;
        const named: UnknownRecord[] = [];
        const idsSeen = new Set<number>();
        for (const warrior of Object.values(collection)) {
            if (!isMargonemEngineWarriorNamed(warrior)) continue;
            const id = warrior[WARRIOR_ID_KEY];
            if (typeof id === "number") {
                if (idsSeen.has(id)) continue;
                idsSeen.add(id);
            }
            named.push(warrior);
            // A board past the bound is refused as soon as it is past it, never walked to its end.
            if (named.length > COMBATANTS_MAXIMUM) {
                return new MargonemEngineWarriorsExceeded(named.length, COMBATANTS_MAXIMUM);
            }
        }
        if (named.length === 0) continue;
        return named;
    }
    if (!hasCollection) return new MargonemEngineWarriorCollectionAbsent();
    return new MargonemEngineWarriorsAbsent();
}

function isMargonemEngineWarriorNamed(
    warriorCandidate: unknown,
): warriorCandidate is UnknownRecord {
    if (!isRecord(warriorCandidate)) return false;
    const name = warriorCandidate[NAME_KEY];
    if (typeof name !== "string") return false;
    return name.length > 0;
}
