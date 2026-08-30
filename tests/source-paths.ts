/**
 * Every TypeScript file under the directories that hold one.
 *
 * The walk carries an explicit worklist rather than calling itself: S1 forbids recursion, and
 * a worklist is where S2's bound can be stated and asserted. A directory that is not there is
 * not an error — it is a layer this tree has not needed yet.
 */

import { assert } from "@std/assert";

export const SOURCE_DIRECTORIES = ["src", "tools", "tests"];

/** Deep enough for any tree this repository will hold, shallow enough to catch a cycle. */
const MAXIMUM_DIRECTORIES = 512;

export function getSourcePaths(): string[] {
    const pending = [...SOURCE_DIRECTORIES];
    const found: string[] = [];
    let visited = 0;
    while (pending.length > 0) {
        const directory = pending.pop();
        if (directory === undefined) break;
        visited += 1;
        assert(visited <= MAXIMUM_DIRECTORIES, "the walk stays inside its stated bound");
        let entries: Deno.DirEntry[] = [];
        try {
            entries = [...Deno.readDirSync(directory)];
        } catch {
            continue;
        }
        for (const entry of entries) {
            const path = `${directory}/${entry.name}`;
            if (entry.isDirectory) pending.push(path);
            else if (entry.name.endsWith(".ts")) found.push(path);
        }
    }
    assert(found.length > 0, "there is TypeScript to walk");
    assert(new Set(found).size === found.length, "a path is walked once");
    return found;
}
