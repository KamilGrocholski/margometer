/**
 * The recordings, as a tool reads them: a name, and the engine calls the game made.
 *
 * Their field names are the recording's own and Polish, and they are taken from the constant the
 * file that writes them spells — **N13**. The directory is walked rather than listed, so a
 * recording admitted yesterday is one the preview draws today (`captures/AGENTS.md`).
 *
 * A recording is also opened **at a path**, which need not be under `captures/`: what decides
 * whether an intake is worth starting is what the file carries, and asking that after the
 * redaction step is the wrong way round. A file opened that way is not material and nothing here
 * pretends otherwise — `tools/capture-intake.ts` still decides what enters the repository.
 */

import { assert } from "@std/assert";
import { CAPTURE_FIELDS } from "@/src/game/fight-capture.ts";
import { getJsonReading } from "@/libs/json-text.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import { PreviewBuildError, RecordingReadError } from "@/tools/margometer-tool-error.ts";
import {
    composeRecordingPath,
    getRecordingNames,
    RECORDING_SUFFIX,
} from "@/project/repository-layout.ts";

/** A fight holds twenty and a long one runs to thousands of calls; this is well past both. */
const MAXIMUM_CALLS = 100000;
const PATH_SEPARATOR = "/";

/** One recording, under the name it is filed as, without the suffix a picker has no use for. */
export interface RecordedFight {
    name: string;
    calls: unknown[];
}

export function getRecordedFightNames(): string[] {
    const names = getRecordingNames();
    if (names.length === 0) {
        throw new RecordingReadError("there is no recording to read");
    }
    assert(names.length > 0, "a preview is drawn from at least one recording");
    assert(names.every((name) => name.length > 0), "and under a name that says something");
    return names;
}

/**
 * What a report puts over its table: the file's own name, with the suffix off. A recording read
 * from somewhere else is named the same way as one out of `captures/`, so a heading does not say
 * where the file was sitting.
 */
function composeNameOfPath(path: string): string {
    assert(path.length > 0, "a recording is opened from somewhere");
    const last = path.split(PATH_SEPARATOR).at(-1) ?? path;
    const name = last.endsWith(RECORDING_SUFFIX)
        ? last.slice(0, last.length - RECORDING_SUFFIX.length)
        : last;
    assert(name.length > 0, "and answers under a name that says something");
    return name;
}

/**
 * The file's text, or a refusal branded so a reader can place it. `Deno.readTextFileSync` is a
 * call this project did not author and it throws a family of its own — a path that is not there,
 * a directory, a file nobody may open — so the catch is broad here and nowhere else (**E4**).
 */
function getRecordingText(path: string): string {
    assert(path.length > 0, "a recording is opened from somewhere");
    try {
        return Deno.readTextFileSync(path);
    } catch (cause) {
        throw new RecordingReadError(`${path} is not a file this tool can open`, { cause });
    }
}

/** One recording at a path, whether or not it has ever passed intake. */
export function getRecordedFightAt(path: string): RecordedFight {
    assert(path.length > 0, "a recording is asked for by path");
    const reading = getJsonReading(getRecordingText(path));
    if (!reading.isOk) {
        throw new RecordingReadError(`${path} is not JSON this tool can read`, {
            cause: reading.cause,
        });
    }
    const document = reading.value;
    if (!isRecord(document)) {
        throw new RecordingReadError(`${path} is not a record`);
    }
    const entries = document[CAPTURE_FIELDS.calls];
    if (!Array.isArray(entries)) {
        throw new RecordingReadError(`${path} lists no calls`);
    }
    assert(entries.length <= MAXIMUM_CALLS, "a recording stays inside its stated bound");
    const calls: unknown[] = [];
    for (const entry of entries) {
        if (!isRecord(entry)) continue;
        if (!(CAPTURE_FIELDS.payload in entry)) continue;
        calls.push(entry[CAPTURE_FIELDS.payload]);
    }
    if (calls.length === 0) {
        throw new RecordingReadError(`${path} carries no call the add-on would see`);
    }
    return { name: composeNameOfPath(path), calls };
}

export function getRecordedFightCalls(name: string): unknown[] {
    assert(name.length > 0, "a recording is asked for by name");
    const calls = getRecordedFightAt(composeRecordingPath(name)).calls;
    assert(calls.length > 0, "and one that is answered has something to play");
    return calls;
}

export function getRecordedFights(): RecordedFight[] {
    const fights: RecordedFight[] = [];
    for (const name of getRecordedFightNames()) {
        const calls = getRecordedFightCalls(name);
        assert(calls.length > 0, "a recording that is carried has something to play");
        fights.push({ name, calls });
    }
    assert(fights.length > 0, "a preview draws at least one fight");
    return fights;
}

/** The one a page opens on: the newest, since the oldest here is a solo hunt of two rows. */
export function getNewestRecordedFight(fights: readonly RecordedFight[]): RecordedFight {
    const newest = fights.at(-1);
    if (newest === undefined) {
        throw new PreviewBuildError("there is no recording to open on");
    }
    assert(newest.calls.length > 0, "the fight a page opens on has something to play");
    return newest;
}
