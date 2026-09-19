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
    readRecordingNames,
    RECORDING_SUFFIX,
} from "@/project/repository-layout.ts";

/** A fight holds twenty and a long one runs to thousands of calls; this is well past both. */
const MAXIMUM_CALLS = 100000;
const PATH_SEPARATOR = "/";

/** One recording, under the name it is filed as, without the suffix a picker has no use for. */
export interface RecordedFight {
    name: string;
    calls: unknown[];
    /** Whether the file states a cast read off the engine, which is what intake asks of it. */
    hasSnapshot: boolean;
}

/**
 * Every recording `captures/` holds, branded where the directory itself will not answer.
 *
 * `project/repository-layout.ts` opens the directory and reaches for no layer (**ADR 0020**), so
 * it cannot brand its own failure and does not try: a missing or unreadable `captures/` leaves
 * `Deno.readDirSync` throwing a family of its own. The brand is put on here, where a terminal
 * reads it, exactly as `getRecordingText` does for the file below it (**E1**, **E4**).
 */
export function getRecordedFightNames(): string[] {
    let names: string[];
    try {
        names = readRecordingNames();
    } catch (cause) {
        throw new RecordingReadError("captures/ is not a directory this tool can read", { cause });
    }
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

/**
 * Whether any call states the cast read off the engine. `null` is what nobody read and `[]` is a
 * reading that found nobody: only the first is no snapshot (**E10**), and the second is why a
 * recording of a fight the game settled by itself is material. **ADR 0053** says what turns on it.
 */
export function isSnapshotCarried(calls: readonly unknown[]): boolean {
    assert(calls.length <= MAXIMUM_CALLS, "a recording stays inside its stated bound");
    let carried = 0;
    for (const call of calls) {
        if (!isRecord(call)) continue;
        if (Array.isArray(call[CAPTURE_FIELDS.combatantsBefore])) carried += 1;
        else if (Array.isArray(call[CAPTURE_FIELDS.combatantsAfter])) carried += 1;
    }
    assert(carried <= calls.length, "and a call states its cast once");
    return carried > 0;
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
    return { name: composeNameOfPath(path), calls, hasSnapshot: isSnapshotCarried(entries) };
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
        const fight = getRecordedFightAt(composeRecordingPath(name));
        assert(fight.calls.length > 0, "a recording that is carried has something to play");
        fights.push(fight);
    }
    assert(fights.length > 0, "a preview draws at least one fight");
    return fights;
}

/**
 * The one every preview opens on, named rather than derived: the server, the published site and
 * the screenshots then show the same fight, and a recording admitted tomorrow changes none of
 * them.
 *
 * Chosen 2026-09-19 for the **published page replaying it**, which is a use the earlier pick did
 * not have to serve. Measured over both on that date: this carries **99 calls** against the other's
 * 15, so a replay climbs instead of jumping in sixths, and it was recorded on 0.15.0 rather than
 * 0.9.0. What it gives up is stated and small — 46 announced skills against 48, 12 elements
 * against 14, eight of the eleven with healing against all eleven, three with a prevented figure
 * against five.
 *
 * The one it replaces, `2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0`, was picked on
 * 2026-08-30 for that density alone, back when the page opened on a fight and left it standing.
 */
export const PREVIEW_FIGHT_NAME = "2026-09-11-luvia-grupa-vs-amaimon-Cl9U89Zr-0.15.0";

/** Loudly (**E7**): a preview opening on some other fight is worse than one that does not open. */
export function getPreviewRecordedFight(fights: readonly RecordedFight[]): RecordedFight {
    const found = fights.find((fight) => fight.name === PREVIEW_FIGHT_NAME);
    if (found === undefined) {
        throw new PreviewBuildError(`${PREVIEW_FIGHT_NAME} is not among the recordings`);
    }
    assert(found.calls.length > 0, "the fight a page opens on has something to play");
    return found;
}
