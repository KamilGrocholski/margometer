/**
 * The recordings, read out of git at the revision `AGENTS.md` W8 names, without a checkout.
 *
 * `captures/` lives on `develop`, and touching it is asked first on any branch, so this reads git's
 * objects and writes nothing. A recording arrives as `unknown` and is walked rather than cast: a
 * shape a recording does not have is a finding, not a field that quietly reads `undefined`.
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import type { BattleEvent } from "#/src/core/battle-event.ts";
import {
    type Combatant,
    type CombatantRoster,
    indexCombatantRoster,
} from "#/src/core/combatant-roster.ts";
import { decodePayloadMessages, type UnreadMessage } from "#/src/core/fight-decoder.ts";
import {
    commitPayload,
    type FightSession,
    type FightView,
    getFightView,
    initFightSession,
    preparePayload,
    SESSION_OPTIONS,
} from "#/src/core/fight-session.ts";
import { tallyFightFigures } from "#/src/core/fight-figures.ts";
import type { FightStatistics } from "#/src/core/fight-statistics.ts";
import { readPayloadEnvelope } from "#/src/game/payload-envelope.ts";
import { FILE_FIELD } from "#/src/runtime/fight-file.ts";
import { BLOWS_GRANTED } from "./frozen-tables.ts";
import { RECORDINGS_DIRECTORY, RECORDINGS_REVISION } from "./recording-revision.ts";

export interface RecordedFight {
    path: string;
    /** Each call's payload exactly as the engine received it, for the envelope to read. */
    updates: readonly unknown[];
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

/** A recording as the panel is handed it: the session's view, and the figures tallied off it. */
export interface RecordedTally {
    view: FightView;
    roster: CombatantRoster;
    statistics: FightStatistics;
}

export interface RecordedDecoding {
    events: BattleEvent[];
    unread: UnreadMessage[];
}

const RECORDING_EXTENSION = ".json";

/**
 * The warrior keys inside a snapshot, as a recording keeps them. They are the game's, and
 * `src/game/warrior-snapshot.ts` copies them under their own names; the recording's own keys are
 * `FILE_FIELD`'s (N13).
 */
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

function readGitText(args: string[]): string {
    const output = new Deno.Command("git", { args, stdout: "piped", stderr: "piped" }).outputSync();
    const error = new TextDecoder().decode(output.stderr);
    assert(output.success, `git ${args.join(" ")} answered: ${error}`);
    return new TextDecoder().decode(output.stdout);
}

function readRecordedFight(path: string, document: unknown): RecordedFight {
    const calls = readRecordedField(document, FILE_FIELD.calls, path);
    assert(Array.isArray(calls), `${path} lists the calls the engine made`);
    const payloads: string[][] = [];
    const updates: unknown[] = [];
    const byId = new Map<number, Combatant>();
    const healthReadings: RecordedHealth[] = [];
    for (const call of calls) {
        const carried = readRecordedField(call, FILE_FIELD.messages, path);
        assert(Array.isArray(carried), `${path} states the messages a call carried`);
        const messages: string[] = [];
        for (const message of carried) {
            assert(typeof message === "string", `${path} carries a message as text`);
            messages.push(message);
        }
        payloads.push(messages);
        updates.push(readRecordedField(call, FILE_FIELD.payload, path));
        const after = readRecordedField(call, FILE_FIELD.combatantsAfter, path);
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
    return { path, updates, payloads, messages: payloads.flat(), combatants, healthReadings };
}

function readRecordedField(record: unknown, key: string, path: string): unknown {
    assert(typeof record === "object", `${path} states a record where ${key} is read`);
    assert(record !== null, `${path} states a record, not null, where ${key} is read`);
    return Reflect.get(record, key);
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

/**
 * A recording run the add-on's own way: every call through the envelope, then into the session.
 * The cast comes off the payloads here, as the add-on reads it, and not off the snapshots.
 */
export function replayRecordedFight(fight: RecordedFight): FightSession {
    const session = initFightSession(SESSION_OPTIONS);
    for (const update of fight.updates) {
        const record = readPayloadEnvelope(update);
        assert(record.ok, `${fight.path}: a recorded call is read by the envelope`);
        const prepared = preparePayload(session, record.value, BLOWS_GRANTED);
        assert(prepared.ok, `${fight.path}: and is inside every bound the session states`);
        commitPayload(session, prepared.value);
    }
    return session;
}

export function tallyRecordedFight(path: string): RecordedTally {
    const view = getFightView(replayRecordedFight(lookupRecordedFight(path)));
    assertExists(view, `${path}: a recording states a fight to tally`);
    return { view, roster: view.roster, statistics: tallyFightFigures(view).statistics };
}
