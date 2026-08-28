/**
 * The recordings, read once for every test whose subject needs one.
 *
 * Their field names are the recordings' own and Polish, and this file is where they stop.
 * `JSON.parse` answers `unknown` here and is walked rather than cast: a shape a recording does
 * not have is a finding, not a field that quietly reads `undefined`.
 */

import { assert, assertEquals } from "@std/assert";
import type { Combatant } from "@/src/core/combatant-roster.ts";

const CAPTURE_DIRECTORY = "captures";

function isRecord(value: unknown): value is Record<string, unknown> {
    if (typeof value !== "object") return false;
    return value !== null;
}

function getNumberFromField(value: unknown, subject: string): number {
    assert(typeof value === "number", `${subject} is stated as a number`);
    assert(Number.isFinite(value), `${subject} is a number a reading can use`);
    return value;
}

function getTextFromField(value: unknown, subject: string): string {
    assert(typeof value === "string", `${subject} is stated as text`);
    assert(value.length > 0, `${subject} is text that says something`);
    return value;
}

export function getRecordingPaths(): string[] {
    const paths: string[] = [];
    for (const entry of Deno.readDirSync(CAPTURE_DIRECTORY)) {
        if (!entry.name.endsWith(".json")) continue;
        paths.push(`${CAPTURE_DIRECTORY}/${entry.name}`);
    }
    assert(paths.length > 0, "an empty evidence directory is a finding, not a pass");
    assert(new Set(paths).size === paths.length, "a recording is listed once");
    return paths.sort();
}

function getRecordedEntries(path: string): Record<string, unknown>[] {
    const document: unknown = JSON.parse(Deno.readTextFileSync(path));
    assert(isRecord(document), `${path} is a record`);
    const entries = document.wpisy;
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
        const carried = entry.komunikaty;
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
        const after = entry.wojownicyPo;
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

/** One list per call the engine made, which is the unit an announcement is glued inside. */
export function getRecordedPayloads(path: string): string[][] {
    const payloads: string[][] = [];
    for (const entry of getRecordedEntries(path)) {
        const carried = entry.komunikaty;
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

function getRecordedCombatant(snapshot: unknown, path: string): Combatant {
    assert(isRecord(snapshot), `${path} states a combatant as a record`);
    const health = snapshot.hp;
    assert(isRecord(health), `${path} states a combatant's health`);
    return {
        id: getNumberFromField(snapshot.id, `${path}: an id`),
        name: getTextFromField(snapshot.name, `${path}: a name`),
        side: getNumberFromField(snapshot.team, `${path}: a side`),
        profession: getTextFromField(snapshot.prof, `${path}: a profession`),
        level: getNumberFromField(snapshot.lvl, `${path}: a level`),
        healthMaximum: getNumberFromField(health.max, `${path}: a health maximum`),
    };
}

/**
 * Every combatant the recording snapshots, first sighting kept. Measured over every recording,
 * 2026-08-28: what the game states about a combatant never changes inside one fight, so a later
 * sighting that disagrees is a finding rather than an update.
 */
export function getRecordedCombatants(path: string): Combatant[] {
    const byId = new Map<number, Combatant>();
    for (const entry of getRecordedEntries(path)) {
        const after = entry.wojownicyPo;
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
