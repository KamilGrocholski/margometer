/**
 * The recordings, read out of git at the revision `AGENTS.md` W8 names, without a checkout.
 *
 * `captures/` lives on `develop`, and touching it is asked first on any branch, so this reads git's
 * objects and writes nothing. A recording arrives as `unknown` and is walked rather than cast: a
 * shape a recording does not have is a finding, not a field that quietly reads `undefined`.
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { type Combatant, indexCombatantRoster } from "@/src/core/combatant-roster.ts";
import {
    decodePayloadMessages,
    type DecoderTables,
    indexBlowsGrantedBySkillId,
    type UnreadMessage,
} from "@/src/core/fight-decoder.ts";

export const RECORDINGS_REVISION = "fa1dcce";

/**
 * The published table as `develop:frozen/blows-granted.ts` froze it, fetched
 * 2026-09-23T08:58:25.997Z. A test wanting the rule with no table behind it hands over an empty
 * map instead.
 */
export const BLOWS_GRANTED: DecoderTables = {
    blowsGrantedBySkillId: indexBlowsGrantedBySkillId([
        { id: 97, blowsGrantedMinimum: 1 },
        { id: 239, blowsGrantedMinimum: 1 },
        { id: 283, blowsGrantedMinimum: 2 },
    ]),
};

const RECORDINGS_DIRECTORY = "captures/";
const RECORDING_EXTENSION = ".json";

/**
 * The recording's own keys, as `develop:src/game/fight-capture.ts` spells them, and the warrior
 * keys inside a snapshot, which are the game's and `develop:src/game/engine-warrior.ts` spells
 * for the add-on (N13).
 */
const CAPTURE_FIELDS = { calls: "calls", messages: "messages", after: "combatantsAfter" } as const;
const WARRIOR_FIELDS = {
    id: "id",
    name: "name",
    side: "team",
    profession: "prof",
    level: "lvl",
    health: "hp",
    healthMaximum: "max",
    healthNow: "cur",
    healthPercent: "hpp",
} as const;

export interface RecordedFight {
    path: string;
    /** One list per call the engine made, which is the unit an announcement is glued inside. */
    payloads: readonly (readonly string[])[];
    messages: readonly string[];
    /** Off the snapshots, first sighting kept. Two recordings hold no snapshot, and so nobody. */
    combatants: readonly Combatant[];
    /** Every snapshot's health, as the client itself stated all three figures. */
    healthReadings: readonly RecordedHealth[];
}

export interface RecordedHealth {
    combatantId: number;
    health: number;
    healthMaximum: number;
    healthPercent: number;
}

export interface RecordedDecoding {
    events: BattleEvent[];
    unread: UnreadMessage[];
}

let recordedFights: readonly RecordedFight[] | null = null;

export function readRecordedFights(): readonly RecordedFight[] {
    if (recordedFights !== null) return recordedFights;
    const paths = readGitText(["ls-tree", "--name-only", RECORDINGS_REVISION, RECORDINGS_DIRECTORY])
        .split("\n")
        .filter((line) => line.endsWith(RECORDING_EXTENSION));
    assert(paths.length > 0, "an empty evidence directory is a finding, not a pass");
    assertStrictEquals(new Set(paths).size, paths.length, "a recording is listed once");
    recordedFights = paths.map((path) => {
        const text = readGitText(["show", `${RECORDINGS_REVISION}:${path}`]);
        return readRecordedFight(path, JSON.parse(text));
    });
    return recordedFights;
}

/** By the path it has under `captures/` on `develop`. */
export function lookupRecordedFight(path: string): RecordedFight {
    const found = readRecordedFights().find((one) => one.path === path);
    assertExists(found, `${path} is a recording at ${RECORDINGS_REVISION}`);
    return found;
}

/** Each payload decoded on its own, as `develop` decodes a call: no announcement spans two. */
export function decodeRecordedFight(fight: RecordedFight): RecordedDecoding {
    const roster = indexCombatantRoster(fight.combatants);
    const decoding: RecordedDecoding = { events: [], unread: [] };
    for (const payload of fight.payloads) {
        const context = { roster, standing: null, tables: BLOWS_GRANTED };
        const decoded = decodePayloadMessages(payload, context);
        decoding.events.push(...decoded.events);
        decoding.unread.push(...decoded.unread);
    }
    return decoding;
}

function readRecordedFight(path: string, document: unknown): RecordedFight {
    const calls = readRecordedField(document, CAPTURE_FIELDS.calls, path);
    assert(Array.isArray(calls), `${path} lists the calls the engine made`);
    const payloads: string[][] = [];
    const byId = new Map<number, Combatant>();
    const healthReadings: RecordedHealth[] = [];
    for (const call of calls) {
        const carried = readRecordedField(call, CAPTURE_FIELDS.messages, path);
        assert(Array.isArray(carried), `${path} states the messages a call carried`);
        const messages: string[] = [];
        for (const message of carried) {
            assert(typeof message === "string", `${path} carries a message as text`);
            messages.push(message);
        }
        payloads.push(messages);
        const after = readRecordedField(call, CAPTURE_FIELDS.after, path);
        if (!Array.isArray(after)) continue;
        for (const snapshot of after) {
            const combatant = readRecordedCombatant(snapshot, path);
            healthReadings.push(readRecordedHealth(snapshot, path));
            const first = byId.get(combatant.id);
            if (first === undefined) byId.set(combatant.id, combatant);
            else assertEquals(first, combatant, `${path} restates a combatant differently`);
        }
    }
    const combatants = [...byId.values()];
    return { path, payloads, messages: payloads.flat(), combatants, healthReadings };
}

function readRecordedHealth(snapshot: unknown, path: string): RecordedHealth {
    const combatantId = readRecordedField(snapshot, WARRIOR_FIELDS.id, path);
    const held = readRecordedField(snapshot, WARRIOR_FIELDS.health, path);
    const health = readRecordedField(held, WARRIOR_FIELDS.healthNow, path);
    const healthMaximum = readRecordedField(held, WARRIOR_FIELDS.healthMaximum, path);
    const healthPercent = readRecordedField(held, WARRIOR_FIELDS.healthPercent, path);
    assert(typeof combatantId === "number", `${path}: an id`);
    assert(typeof health === "number", `${path}: health held`);
    assert(typeof healthMaximum === "number", `${path}: a health maximum`);
    assert(typeof healthPercent === "number", `${path}: a health percentage`);
    return { combatantId, health, healthMaximum, healthPercent };
}

function readRecordedCombatant(snapshot: unknown, path: string): Combatant {
    const id = readRecordedField(snapshot, WARRIOR_FIELDS.id, path);
    const name = readRecordedField(snapshot, WARRIOR_FIELDS.name, path);
    const side = readRecordedField(snapshot, WARRIOR_FIELDS.side, path);
    const profession = readRecordedField(snapshot, WARRIOR_FIELDS.profession, path);
    const level = readRecordedField(snapshot, WARRIOR_FIELDS.level, path);
    const health = readRecordedField(snapshot, WARRIOR_FIELDS.health, path);
    const healthMaximum = readRecordedField(health, WARRIOR_FIELDS.healthMaximum, path);
    assert(typeof id === "number", `${path}: a combatant's id is a number`);
    assert(typeof name === "string", `${path}: a combatant's name is text`);
    assert(typeof side === "number", `${path}: a combatant's side is a number`);
    assert(typeof profession === "string", `${path}: a profession`);
    assert(typeof level === "number", `${path}: a level`);
    assert(typeof healthMaximum === "number", `${path}: a health maximum`);
    return { id, name, side, profession, level, healthMaximum };
}

function readRecordedField(record: unknown, key: string, path: string): unknown {
    assert(typeof record === "object", `${path} states a record where ${key} is read`);
    assert(record !== null, `${path} states a record, not null, where ${key} is read`);
    return Reflect.get(record, key);
}

function readGitText(args: string[]): string {
    const output = new Deno.Command("git", { args, stdout: "piped", stderr: "piped" }).outputSync();
    const error = new TextDecoder().decode(output.stderr);
    assert(output.success, `git ${args.join(" ")} answered: ${error}`);
    return new TextDecoder().decode(output.stdout);
}
