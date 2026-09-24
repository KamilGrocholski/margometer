/**
 * C8: every import is written from the repository root, with `@/` and the file's extension.
 *
 * The standard library is imported by the name `deno.json` maps for it, and nothing else is.
 */

import { assertEquals } from "@std/assert";
import {
    composeSample,
    readImportSources,
    readSourceFiles,
    SOURCE_DIRECTORIES,
    type SourceFile,
} from "@/tests/source-tree.ts";

const ROOT_PREFIX = "@/";
const STANDARD_PREFIX = "@std/";

function isRootedImport(source: string): boolean {
    if (source.startsWith(STANDARD_PREFIX)) return true;
    if (!source.startsWith(ROOT_PREFIX)) return false;
    const name = source.slice(source.lastIndexOf("/") + 1);
    return name.includes(".");
}

function lookupUnrootedImports(file: SourceFile): string[] {
    const sources = readImportSources(file).filter((source) => !isRootedImport(source));
    return sources.map((source) => `${file.path} imports "${source}"`);
}

Deno.test("a relative path, a bare URL and a missing extension are flagged", () => {
    const sample = composeSample([
        'import { a } from "./a.ts";',
        'import { b } from "jsr:@std/assert";',
        'import { c } from "@/libs/c";',
        'export { d } from "../d.ts";',
        'import { e } from "@/libs/e.ts";',
        'import { f } from "@std/assert/assert";',
    ]);
    const flagged = [
        'sample.ts imports "./a.ts"',
        'sample.ts imports "jsr:@std/assert"',
        'sample.ts imports "@/libs/c"',
        'sample.ts imports "../d.ts"',
    ];
    assertEquals(
        lookupUnrootedImports(sample),
        flagged,
        "and a rooted one with its extension is not",
    );
});

Deno.test("every import in the tree is written from the root", () => {
    const found = readSourceFiles(SOURCE_DIRECTORIES).flatMap(lookupUnrootedImports);
    assertEquals(found, [], "C8");
});
