/**
 * C9: a module of a layer that one other module of the same layer imports is written in it. The
 * importers counted are the program's own: a test imports whatever the module it reads exports.
 */

import { assertEquals } from "@std/assert";
import {
    composeSample,
    lookupImportedPath,
    readImportSources,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

/** The layers of `docs/design.md` §4 that hold modules; the entry and its boot stand above them. */
const LAYER_DIRECTORIES = ["src/core/", "src/game/", "src/runtime/", "src/ui/"];

Deno.test("a module one sibling imports is flagged, and one two import or from above is not", () => {
    const files = [
        { ...composeSample(['import { a } from "./alone.ts";']), path: "src/ui/panel.ts" },
        { ...composeSample(['import { b } from "./shared.ts";']), path: "src/ui/panel.ts" },
        { ...composeSample(['import { b } from "#/src/ui/shared.ts";']), path: "src/ui/card.ts" },
        { ...composeSample(['import { c } from "#/src/core/below.ts";']), path: "src/ui/card.ts" },
        { ...composeSample(['import { d } from "#/src/ui/entry-only.ts";']), path: "src/entry.ts" },
        { ...composeSample(['import { e } from "#/src/game/top.ts";']), path: "src/game/one.ts" },
        { ...composeSample(['import { e } from "#/src/game/top.ts";']), path: "src/game/one.ts" },
    ];
    assertEquals(
        lookupSingleImported(files),
        [
            "src/game/top.ts, imported only by src/game/one.ts",
            "src/ui/alone.ts, imported only by src/ui/panel.ts",
        ],
        "two importers, an importer in another layer, or one importing twice are told apart",
    );
});

/** Every module of a layer whose importers in `src/` are one module, standing in its directory. */
function lookupSingleImported(files: readonly SourceFile[]): string[] {
    const importersByModule = new Map<string, Set<string>>();
    for (const file of files) {
        for (const source of readImportSources(file)) {
            const target = lookupImportedPath(file, source);
            if (target === null) continue;
            const importers = importersByModule.get(target) ?? new Set<string>();
            importers.add(file.path);
            importersByModule.set(target, importers);
        }
    }
    const found: string[] = [];
    for (const [target, importers] of importersByModule) {
        if (importers.size !== 1) continue;
        const directory = target.slice(0, target.lastIndexOf("/") + 1);
        if (!LAYER_DIRECTORIES.includes(directory)) continue;
        const [importer] = [...importers];
        if (!importer!.startsWith(directory)) continue;
        found.push(`${target}, imported only by ${importer}`);
    }
    return found.sort();
}

Deno.test("no module of a layer stands apart from the one module that imports it", () => {
    assertEquals(lookupSingleImported(readSourceFiles(["src"])), [], "C9");
});
