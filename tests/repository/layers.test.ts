/**
 * `docs/design.md` §4: dependencies point one way. A layer imports what stands below it and
 * nothing above; `libs/` imports no layer at all.
 */

import { assertEquals } from "@std/assert";
import {
    composeSample,
    lookupImportedPath,
    readImportSources,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

/** What each layer may import from this repository, by path prefix. */
const IMPORTS_ALLOWED: readonly (readonly [string, readonly string[]])[] = [
    ["libs/", ["libs/"]],
    ["src/core/", ["libs/", "src/core/"]],
    ["src/game/", ["libs/", "src/core/", "src/game/"]],
    ["src/runtime/", ["libs/", "src/core/", "src/game/", "src/ui/", "src/runtime/"]],
    ["src/ui/", ["libs/", "src/core/", "src/ui/"]],
];

function lookupLayerReach(path: string): readonly string[] | null {
    const layer = IMPORTS_ALLOWED.find(([prefix]) => path.startsWith(prefix));
    return layer === undefined ? null : layer[1];
}

function lookupImportsUpward(file: SourceFile): string[] {
    const allowed = lookupLayerReach(file.path);
    if (allowed === null) return [];
    const found: string[] = [];
    for (const source of readImportSources(file)) {
        const target = lookupImportedPath(file, source);
        if (target === null) continue;
        if (!allowed.some((prefix) => target.startsWith(prefix))) {
            found.push(`${file.path} imports ${target}`);
        }
    }
    return found;
}

Deno.test("an import from above a layer is flagged, and one from below it is not", () => {
    const upward = composeSample([
        'import { a } from "#/src/game/payload-envelope.ts";',
        'import { b } from "#/libs/result.ts";',
        'import { c } from "@std/assert/assert";',
        'import { d } from "./sibling.ts";',
    ]);
    const core = { ...upward, path: "src/core/sample.ts" };
    assertEquals(lookupImportsUpward(core), [
        "src/core/sample.ts imports src/game/payload-envelope.ts",
    ], "core reaching into game is flagged, and libs and the standard library are not");
    const library = { ...upward, path: "libs/sample.ts" };
    assertEquals(lookupImportsUpward(library), [
        "libs/sample.ts imports src/game/payload-envelope.ts",
    ], "a library imports no layer, and other libraries and its sibling are not one");
    const game = { ...upward, path: "src/game/sample.ts" };
    assertEquals(lookupImportsUpward(game), [], "and game may import from core and libs both");
});

Deno.test("no file in libs/ or src/ imports from a layer above its own", () => {
    const found = readSourceFiles(["libs", "src"]).flatMap(lookupImportsUpward);
    assertEquals(found, [], "docs/design.md §4");
});
