/**
 * Where this repository keeps things, named once for every layer that has to agree.
 *
 * No reader owns them: `tools/changelog.ts` takes the version out of the configuration and
 * `tools/build-userscript.ts` hands the same file to the bundler, and the second already imports
 * the first — an owner among them would be a cycle. **ADR 0003** placed the recordings.
 */

import { assert, assertStrictEquals } from "@std/assert";

export const CONFIGURATION_FILE = "deno.json";
export const CHANGELOG_FILE = "CHANGELOG.md";
export const RECORDING_DIRECTORY = "captures";
export const RECORDING_SUFFIX = ".json";

/** Sorted, and possibly none: what an empty set means is the caller's to say — **E7**. */
export function getRecordingNames(): string[] {
    const names: string[] = [];
    for (const entry of Deno.readDirSync(RECORDING_DIRECTORY)) {
        if (!entry.name.endsWith(RECORDING_SUFFIX)) continue;
        names.push(entry.name.slice(0, entry.name.length - RECORDING_SUFFIX.length));
    }
    assertStrictEquals(new Set(names).size, names.length, "a recording is listed once");
    assert(names.every((name) => name.length > 0), "and under a name that says something");
    return names.sort();
}

export function composeRecordingPath(name: string): string {
    assert(name.length > 0, "a recording is asked for by name");
    const path = `${RECORDING_DIRECTORY}/${name}${RECORDING_SUFFIX}`;
    assert(path.endsWith(RECORDING_SUFFIX), "and answered as the file it is filed as");
    return path;
}

/** The same set as paths, for a reader that opens them rather than naming them. */
export function getRecordingPaths(): string[] {
    const paths = getRecordingNames().map(composeRecordingPath);
    assertStrictEquals(new Set(paths).size, paths.length, "a recording is opened once");
    assert(paths.every((path) => path.startsWith(RECORDING_DIRECTORY)), "and from where they sit");
    return paths;
}
