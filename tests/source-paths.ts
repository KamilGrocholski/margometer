/**
 * Every TypeScript file this repository writes: the root, and the directories under it. `@std/fs`
 * walks them — **C17**: the
 * recursion is the library's rather than this tree's, which is what S1 binds, and the bound S2
 * wants is stated below over what comes back.
 */

import { assert, assertStrictEquals } from "@std/assert";
import { walkSync } from "@std/fs";

export const SOURCE_DIRECTORIES = ["libs", "project", "src", "tools", "tests"];

/** More files than any tree this repository will hold, so the count stays a stated bound. */
const MAXIMUM_FILES = 4096;

/** A `.ts` file at the root belongs to none of the directories above, and was read past once. */
const ROOT_DIRECTORY = ".";
const ROOT_DEPTH = 1;

export function getSourcePaths(): string[] {
    const found: string[] = [];
    for (
        const entry of walkSync(ROOT_DIRECTORY, {
            exts: [".ts"],
            includeDirs: false,
            maxDepth: ROOT_DEPTH,
        })
    ) {
        assert(found.length <= MAXIMUM_FILES, "the walk stays inside its stated bound");
        found.push(entry.path);
    }
    for (const directory of SOURCE_DIRECTORIES) {
        for (const entry of walkSync(directory, { exts: [".ts"], includeDirs: false })) {
            assert(found.length <= MAXIMUM_FILES, "the walk stays inside its stated bound");
            found.push(entry.path);
        }
    }
    assert(found.length > 0, "there is TypeScript to walk");
    assertStrictEquals(new Set(found).size, found.length, "a path is walked once");
    return found;
}
