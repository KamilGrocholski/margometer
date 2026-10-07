/**
 * What a tool reports on, and each fight in it read the add-on's own way. No path is every
 * recording under `captures/`; a path is any file on disk, so a fresh recording can be asked
 * about before an intake takes it. A file is read by the tests' reader, which spells the format
 * by `FILE_FIELD`, and a fight by `replayFightPayloads`, the runtime's chain, on the tables the
 * add-on composes at its start: nothing here decodes or tallies on its own.
 */

import { basename } from "@std/path";
import { assert, assertStrictEquals } from "@std/assert";
import { parseJson } from "#/libs/json-text.ts";
import * as errors from "#/libs/errors.ts";
import { isRecord } from "#/libs/unknown-value.ts";
import type { DecoderTables } from "#/src/core/fight-decoder.ts";
import { type PayloadRecord, SESSION_OPTIONS } from "#/src/core/fight-session.ts";
import { CALLS_MAXIMUM } from "#/src/ports/fight-capture.ts";
import { readPayloadEnvelope } from "#/src/ports/payload-envelope.ts";
import { type KeptFightState, replayFightPayloads } from "#/src/runtime/fight-state.ts";
import { FILE_FIELD } from "#/src/runtime/fight-file.ts";
import { composeRuntimeTables } from "#/src/userscript-entry.ts";
import {
    readRecordedFight,
    readRecordedFights,
    type RecordedFight,
} from "#/tests/recorded-fights.ts";
import { RECORDINGS_DIRECTORY } from "#/tests/recording-sources.ts";
import { RecordingReadError } from "./margometer-tool-error.ts";

export interface RecordedMaterial {
    /** Named beside the figures, because a report is a claim about what it was taken on (V4). */
    material: string;
    fights: readonly RecordedFight[];
}

/** A recording beside what the add-on reads it as. */
export interface ReplayedFight {
    fight: RecordedFight;
    reading: KeptFightState;
}

/** One call, what the envelope read of it, and the fight as it stood once that call landed. */
export interface ReplayedStep {
    update: unknown;
    record: PayloadRecord;
    reading: KeptFightState;
}

/** A recording beside every state the add-on read it in, call by call. */
export interface SteppedFight {
    fight: RecordedFight;
    steps: readonly ReplayedStep[];
}

/**
 * The game's keys only the tools read, spelled once (N13): who is a monster, and the skill list
 * whose prose an intake takes out. Nothing in `src/` reads either.
 */
export const INTAKE_KEYS = { nonPlayer: "npc", skills: "skills" } as const;
/** Past every recording `captures/` holds, the one bound every tool reading them shares. */
export const RECORDINGS_MAXIMUM = 1_000;
export const RECORDING_SUFFIX = ".json";
export const DECODER_TABLES: DecoderTables = composeRuntimeTables().decoder;

/**
 * The recordings a command line named, or null where it named one by a number: `parseArgs` reads
 * `12` as a number, and a recording is named by its path.
 */
export function lookupRecordingPaths(named: readonly (string | number)[]): string[] | null {
    if (named.length > RECORDINGS_MAXIMUM) {
        throw new RecordingReadError(`no more than ${RECORDINGS_MAXIMUM} recordings at once`);
    }
    const paths = named.filter((argument): argument is string => typeof argument === "string");
    if (paths.length < named.length) return null;
    return paths;
}

/** The recordings where no path was named, the files named otherwise. */
export function readRecordedMaterial(paths: readonly string[]): RecordedMaterial {
    if (paths.length > RECORDINGS_MAXIMUM) {
        throw new RecordingReadError(`no more than ${RECORDINGS_MAXIMUM} recordings at once`);
    }
    if (paths.length === 0) {
        const fights = readRecordedFights();
        assert(fights.length <= RECORDINGS_MAXIMUM, "the recordings stay inside their bound");
        return { material: RECORDINGS_DIRECTORY, fights };
    }
    const fights = paths.map(readRecordingFile);
    assertStrictEquals(fights.length, paths.length, "every file named is read");
    return { material: paths.join(" "), fights };
}

export function readRecordingFile(path: string): RecordedFight {
    assert(path.length > 0, "a recording is opened from somewhere");
    const text = errors.attempt(() => Deno.readTextFileSync(path));
    if (text instanceof Error) {
        throw new RecordingReadError(`${path} is not a file this tool can open`, {
            cause: text,
        });
    }
    const document = parseJson(text);
    if (document instanceof Error) {
        throw new RecordingReadError(`${path} is not JSON`, { cause: document });
    }
    if (!isRecord(document)) throw new RecordingReadError(`${path} is not a record`);
    const calls = document[FILE_FIELD.calls];
    if (!Array.isArray(calls)) throw new RecordingReadError(`${path} lists no calls`);
    if (calls.length > CALLS_MAXIMUM) {
        throw new RecordingReadError(`${path} lists more than ${CALLS_MAXIMUM} calls`);
    }
    return readRecordedFight(path, document);
}

/** Every fight of the material, read as the add-on reads it, or a refusal naming the file. */
export function replayRecordedMaterial(material: RecordedMaterial): ReplayedFight[] {
    const replayed = material.fights.map((fight) => {
        return { fight, reading: replayRecordedCalls(fight, fight.updates.length) };
    });
    assertStrictEquals(replayed.length, material.fights.length, "every fight read is replayed");
    return replayed;
}

/** What the first calls of a recording add up to, replayed from its first call. */
function replayRecordedCalls(fight: RecordedFight, count: number): KeptFightState {
    assert(count >= 0, "a fight is replayed from no fewer calls than none");
    assert(count <= fight.updates.length, "and from no call the recording does not carry");
    const updates = fight.updates.slice(0, count);
    const reading = replayFightPayloads(updates, DECODER_TABLES, SESSION_OPTIONS);
    if (reading instanceof Error) {
        throw new RecordingReadError(
            `${fight.path}: the add-on refused a call, ${reading.name}`,
            { cause: reading },
        );
    }
    if (reading === null) {
        throw new RecordingReadError(`${fight.path} carries no payload the add-on would read`);
    }
    return reading;
}

/**
 * The same chain stopped after each call, for a reading graded against what the game restates
 * call by call. ⚠️ **Every step is a replay of the calls up to it**, rather than one session read as
 * it grows: a view hands out the session's own event list, so a step held beside the next would
 * grow with it. Measured over `captures/` on 2026-09-25, the whole material steps in about two
 * seconds (S3).
 */
export function replayMaterialSteps(material: RecordedMaterial): SteppedFight[] {
    const stepped = material.fights.map((fight) => {
        return { fight, steps: replayRecordedSteps(fight) };
    });
    assertStrictEquals(stepped.length, material.fights.length, "every fight read is stepped");
    return stepped;
}

/**
 * The fight as the panel stood at each call. A step is replayed from the first call rather than
 * carried on from the step before, so it is what the chain answers at that call and nothing here
 * holds a fight of its own.
 */
export function replayRecordedSteps(fight: RecordedFight): ReplayedStep[] {
    assert(fight.updates.length <= CALLS_MAXIMUM, "a recording stays inside its stated bound");
    if (fight.updates.length === 0) {
        throw new RecordingReadError(`${fight.path} carries no payload the add-on would read`);
    }
    const steps: ReplayedStep[] = [];
    for (const [index, update] of fight.updates.entries()) {
        const record = readPayloadEnvelope(update);
        if (record instanceof Error) {
            throw new RecordingReadError(
                `${fight.path}: the envelope refused call ${index}, ${record.name}`,
                { cause: record },
            );
        }
        const reading = replayRecordedCalls(fight, index + 1);
        steps.push({ update, record, reading });
    }
    assertStrictEquals(steps.length, fight.updates.length, "every call is a step");
    return steps;
}

/** The heading a report stands under: the file's own name, the directory and suffix off. */
export function formatRecordingName(path: string): string {
    assert(path.length > 0, "a recording is named by its path");
    const name = basename(path, RECORDING_SUFFIX);
    assert(name.length > 0, "and answers under a name that says something");
    return name;
}
