/**
 * What a tool reports on, and each fight in it read the add-on's own way. No path is every
 * recording at `RECORDINGS_REVISION`; a path is a file on disk, so a fresh recording can be asked
 * about before an intake takes it. A file is read by the tests' reader, which spells the format
 * by `FILE_FIELD`, and a fight by `replayFightPayloads`, the runtime's chain, on the tables the
 * add-on composes at its start: nothing here decodes or tallies on its own.
 */

import { assert, assertStrictEquals } from "@std/assert";
import { parseJson } from "#/libs/json-text.ts";
import { callForeign } from "#/libs/result.ts";
import { isRecord } from "#/libs/unknown-value.ts";
import { SESSION_OPTIONS } from "#/src/core/fight-session.ts";
import { type KeptReading, replayFightPayloads } from "#/src/runtime/fight-reading.ts";
import { FILE_FIELD } from "#/src/runtime/fight-file.ts";
import { composeRuntimeTables } from "#/src/userscript-entry.ts";
import {
    readRecordedFight,
    readRecordedFights,
    type RecordedFight,
} from "#/tests/recorded-fights.ts";
import { RECORDINGS_DIRECTORY } from "#/tests/recording-revision.ts";
import { RecordingReadError } from "./margometer-tool-error.ts";

export interface RecordedMaterial {
    /** Named beside the figures, because a report is a claim about what it was taken on (V4). */
    material: string;
    fights: readonly RecordedFight[];
}

/** A recording beside what the add-on reads it as. */
export interface ReplayedFight {
    fight: RecordedFight;
    reading: KeptReading;
}

const RECORDINGS_MAXIMUM = 1_000;
const RECORDING_SUFFIX = ".json";
const PATH_SEPARATOR = "/";
const DECODER_TABLES = composeRuntimeTables().decoder;

/** The recordings where no path was named, the files named otherwise. */
export function readRecordedMaterial(paths: readonly string[]): RecordedMaterial {
    assert(paths.length <= RECORDINGS_MAXIMUM, "a tool is named no more files than it reads");
    if (paths.length === 0) {
        const fights = readRecordedFights();
        assert(fights.length <= RECORDINGS_MAXIMUM, "the recordings stay inside their bound");
        return { material: RECORDINGS_DIRECTORY, fights };
    }
    const fights = paths.map(readRecordingFile);
    assertStrictEquals(fights.length, paths.length, "every file named is read");
    return { material: paths.join(" "), fights };
}

function readRecordingFile(path: string): RecordedFight {
    assert(path.length > 0, "a recording is opened from somewhere");
    const text = callForeign(() => Deno.readTextFileSync(path));
    if (!text.ok) {
        throw new RecordingReadError(`${path} is not a file this tool can open`, {
            cause: text.error.cause,
        });
    }
    const document = parseJson(text.value);
    if (!document.ok) {
        throw new RecordingReadError(`${path} is not JSON`, { cause: document.error });
    }
    if (!isRecord(document.value)) throw new RecordingReadError(`${path} is not a record`);
    if (!Array.isArray(document.value[FILE_FIELD.calls])) {
        throw new RecordingReadError(`${path} lists no calls`);
    }
    return readRecordedFight(path, document.value);
}

/** Every fight of the material, read as the add-on reads it, or a refusal naming the file. */
export function replayRecordedMaterial(material: RecordedMaterial): ReplayedFight[] {
    const replayed = material.fights.map((fight) => {
        const reading = replayFightPayloads(fight.updates, DECODER_TABLES, SESSION_OPTIONS);
        if (!reading.ok) {
            throw new RecordingReadError(
                `${fight.path}: the add-on refused a call, ${reading.error.kind}`,
            );
        }
        if (reading.value === null) {
            throw new RecordingReadError(`${fight.path} carries no payload the add-on would read`);
        }
        return { fight, reading: reading.value };
    });
    assertStrictEquals(replayed.length, material.fights.length, "every fight read is replayed");
    return replayed;
}

/** The heading a report stands under: the file's own name, the directory and suffix off. */
export function formatRecordingName(path: string): string {
    assert(path.length > 0, "a recording is named by its path");
    const last = path.split(PATH_SEPARATOR).at(-1) ?? path;
    const name = last.endsWith(RECORDING_SUFFIX)
        ? last.slice(0, last.length - RECORDING_SUFFIX.length)
        : last;
    assert(name.length > 0, "and answers under a name that says something");
    return name;
}
