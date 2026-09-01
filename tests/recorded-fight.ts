/**
 * The recordings, read once for every test whose subject needs one.
 *
 * Their field names are the recordings' own and Polish, and are taken from the constant the
 * file that writes them spells — **N13**. A recording arrives as `unknown` and is walked rather
 * than cast: a shape a recording does not have is a finding, not a field that quietly reads
 * `undefined`.
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import type { Combatant } from "@/src/core/combatant-roster.ts";
import { getJsonReading } from "@/libs/json-text.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import { readCombatantFromWarrior } from "@/src/game/engine-warrior.ts";
import { CAPTURE_FIELDS } from "@/src/game/fight-capture.ts";
import { getRecordingPaths as getRecordingFilePaths } from "@/project/repository-layout.ts";

function getNumberFromField(value: unknown, subject: string): number {
    assert(typeof value === "number", `${subject} is stated as a number`);
    assert(Number.isFinite(value), `${subject} is a number a reading can use`);
    return value;
}

export function getRecordingPaths(): string[] {
    const paths = getRecordingFilePaths();
    assert(paths.length > 0, "an empty evidence directory is a finding, not a pass");
    assertStrictEquals(new Set(paths).size, paths.length, "a recording is listed once");
    return paths;
}

function getRecordedEntries(path: string): Record<string, unknown>[] {
    const reading = getJsonReading(Deno.readTextFileSync(path));
    assert(reading.isOk, `${path} is JSON`);
    const document = reading.value;
    assert(isRecord(document), `${path} is a record`);
    const entries = document[CAPTURE_FIELDS.calls];
    assert(Array.isArray(entries), `${path} lists the calls the engine made`);
    const found: Record<string, unknown>[] = [];
    for (const entry of entries) {
        assert(isRecord(entry), `${path} states an entry as a record`);
        found.push(entry);
    }
    return found;
}

export function getRecordedMessages(path: string): string[] {
    const messages: string[] = [];
    for (const entry of getRecordedEntries(path)) {
        const carried = entry[CAPTURE_FIELDS.messages];
        assert(Array.isArray(carried), `${path} states the messages an entry carried`);
        for (const message of carried) {
            assert(typeof message === "string", `${path} carries a message as text`);
            messages.push(message);
        }
    }
    return messages;
}

/** One combatant's health at one moment, as the client itself stated all three figures. */
export interface RecordedHealth {
    combatantId: number;
    health: number;
    healthMaximum: number;
    healthPercent: number;
}

export function getRecordedHealthReadings(path: string): RecordedHealth[] {
    const readings: RecordedHealth[] = [];
    for (const entry of getRecordedEntries(path)) {
        const after = entry[CAPTURE_FIELDS.combatantsAfter];
        assert(Array.isArray(after), `${path} states the combatants an entry left`);
        for (const snapshot of after) {
            assert(isRecord(snapshot), `${path} states a combatant as a record`);
            const health = snapshot.hp;
            assert(isRecord(health), `${path} states a combatant's health`);
            readings.push({
                combatantId: getNumberFromField(snapshot.id, `${path}: an id`),
                health: getNumberFromField(health.cur, `${path}: health held`),
                healthMaximum: getNumberFromField(health.max, `${path}: a health maximum`),
                healthPercent: getNumberFromField(health.hpp, `${path}: a health percentage`),
            });
        }
    }
    return readings;
}

/** The payload each call carried, exactly as the engine received it. */
export function getRecordedEngineUpdates(path: string): unknown[] {
    const updates: unknown[] = [];
    for (const entry of getRecordedEntries(path)) {
        assert(CAPTURE_FIELDS.payload in entry, `${path} states the payload an entry carried`);
        updates.push(entry[CAPTURE_FIELDS.payload]);
    }
    assert(updates.length > 0, `${path} carries at least one call`);
    return updates;
}

/** One list per call the engine made, which is the unit an announcement is glued inside. */
export function getRecordedPayloads(path: string): string[][] {
    const payloads: string[][] = [];
    for (const entry of getRecordedEntries(path)) {
        const carried = entry[CAPTURE_FIELDS.messages];
        assert(Array.isArray(carried), `${path} states the messages an entry carried`);
        const messages: string[] = [];
        for (const message of carried) {
            assert(typeof message === "string", `${path} carries a message as text`);
            messages.push(message);
        }
        payloads.push(messages);
    }
    return payloads;
}

/**
 * A recording's snapshots carry the client's own field names, so they are read by the file that
 * spells them. What is asserted here is that a recording states every one of them, which the
 * live client does not promise and the material has held on every entry.
 */
function getRecordedCombatant(snapshot: unknown, path: string): Combatant {
    const combatant = readCombatantFromWarrior(snapshot);
    assertExists(combatant, `${path} states a combatant the roster can hold`);
    assertExists(combatant.profession, `${path}: a profession`);
    assertExists(combatant.level, `${path}: a level`);
    assertExists(combatant.healthMaximum, `${path}: a health maximum`);
    return combatant;
}

/**
 * Every combatant the recording snapshots, first sighting kept. Measured over every recording,
 * 2026-08-28: what the game states about a combatant never changes inside one fight, so a later
 * sighting that disagrees is a finding rather than an update.
 */
export function getRecordedCombatants(path: string): Combatant[] {
    const byId = new Map<number, Combatant>();
    for (const entry of getRecordedEntries(path)) {
        const after = entry[CAPTURE_FIELDS.combatantsAfter];
        assert(Array.isArray(after), `${path} states the combatants an entry left`);
        for (const snapshot of after) {
            const combatant = getRecordedCombatant(snapshot, path);
            const first = byId.get(combatant.id);
            if (first === undefined) byId.set(combatant.id, combatant);
            else assertEquals(first, combatant, `${path} restates a combatant differently`);
        }
    }
    return [...byId.values()];
}
