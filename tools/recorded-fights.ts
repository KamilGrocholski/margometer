/**
 * The recordings, as a tool reads them: a name, and the engine calls the game made.
 *
 * Their field names are the recording's own and Polish, and they are taken from the constant the
 * file that writes them spells — **N13**. The directory is walked rather than listed, so a
 * recording admitted yesterday is one the preview draws today (`captures/AGENTS.md`).
 */

import { assert } from "@std/assert";
import { CAPTURE_FIELDS } from "@/src/game/fight-capture.ts";
import { getValueFromJsonText, isRecord } from "@/src/core/unknown-reading.ts";
import { PreviewBuildError } from "@/tools/margometer-tool-error.ts";

const CAPTURE_DIRECTORY = "captures";
const CAPTURE_SUFFIX = ".json";
/** A fight holds twenty and a long one runs to thousands of calls; this is well past both. */
const MAXIMUM_CALLS = 100000;

/** One recording, under the name it is filed as, without the suffix a picker has no use for. */
export interface RecordedFight {
    name: string;
    calls: unknown[];
}

export function getRecordedFightNames(): string[] {
    const names: string[] = [];
    for (const entry of Deno.readDirSync(CAPTURE_DIRECTORY)) {
        if (!entry.name.endsWith(CAPTURE_SUFFIX)) continue;
        names.push(entry.name.slice(0, entry.name.length - CAPTURE_SUFFIX.length));
    }
    if (names.length === 0) {
        throw new PreviewBuildError("there is no recording to draw");
    }
    assert(new Set(names).size === names.length, "a recording is listed once");
    assert(names.every((name) => name.length > 0), "and under a name that says something");
    return names.sort();
}

export function getRecordedFightCalls(name: string): unknown[] {
    assert(name.length > 0, "a recording is asked for by name");
    const path = `${CAPTURE_DIRECTORY}/${name}${CAPTURE_SUFFIX}`;
    const document = getValueFromJsonText(Deno.readTextFileSync(path));
    if (!isRecord(document)) {
        throw new PreviewBuildError(`${name} is not a record`);
    }
    const entries = document[CAPTURE_FIELDS.calls];
    if (!Array.isArray(entries)) {
        throw new PreviewBuildError(`${name} lists no calls`);
    }
    assert(entries.length <= MAXIMUM_CALLS, "a recording stays inside its stated bound");
    const calls: unknown[] = [];
    for (const entry of entries) {
        if (!isRecord(entry)) continue;
        if (!(CAPTURE_FIELDS.payload in entry)) continue;
        calls.push(entry[CAPTURE_FIELDS.payload]);
    }
    if (calls.length === 0) {
        throw new PreviewBuildError(`${name} carries no call the add-on would see`);
    }
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
