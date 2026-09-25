/**
 * C8: an import from the importing file's own directory is written `./name.ts`, and every other one
 * from the repository root, `#/path.ts`; both carry the file's extension.
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
} from "#/tests/source-tree.ts";

const ROOT_PREFIX = "#/";
const SIBLING_PREFIX = "./";
const STANDARD_PREFIX = "@std/";

function lookupMisspeltImports(file: SourceFile): string[] {
    const directory = file.path.slice(0, file.path.lastIndexOf("/") + 1);
    const sources = readImportSources(file).filter((source) => {
        return !isImportSpeltForItsPlace(source, directory);
    });
    return sources.map((source) => `${file.path} imports "${source}"`);
}

function isImportSpeltForItsPlace(source: string, directory: string): boolean {
    if (source.startsWith(STANDARD_PREFIX)) return true;
    const name = source.slice(source.lastIndexOf("/") + 1);
    if (!name.includes(".")) return false;
    if (source.startsWith(SIBLING_PREFIX)) {
        return !source.slice(SIBLING_PREFIX.length).includes("/");
    }
    if (!source.startsWith(ROOT_PREFIX)) return false;
    const path = source.slice(ROOT_PREFIX.length);
    return path.slice(0, path.lastIndexOf("/") + 1) !== directory;
}

Deno.test("a sibling from the root, a cousin by a relative path, a bare URL and no extension are flagged", () => {
    const sample = composeSample([
        'import { a } from "#/src/ui/a.ts";',
        'import { b } from "jsr:@std/assert";',
        'import { c } from "#/libs/c";',
        'export { d } from "../d.ts";',
        'import { e } from "./nested/e.ts";',
        'import { f } from "./f";',
        'import { g } from "@/libs/g.ts";',
        'import { h } from "#/libs/h.ts";',
        'import { i } from "./i.ts";',
        'import { j } from "@std/assert/assert";',
    ]);
    const flagged = [
        'src/ui/sample.ts imports "#/src/ui/a.ts"',
        'src/ui/sample.ts imports "jsr:@std/assert"',
        'src/ui/sample.ts imports "#/libs/c"',
        'src/ui/sample.ts imports "../d.ts"',
        'src/ui/sample.ts imports "./nested/e.ts"',
        'src/ui/sample.ts imports "./f"',
        'src/ui/sample.ts imports "@/libs/g.ts"',
    ];
    assertEquals(
        lookupMisspeltImports({ ...sample, path: "src/ui/sample.ts" }),
        flagged,
        "and another directory from the root, a sibling by ./ and the standard library are not",
    );
});

Deno.test("a file at the root imports its sibling by ./ and nothing else from the root", () => {
    const sample = composeSample(['import { a } from "#/a.ts";', 'import { b } from "./b.ts";']);
    assertEquals(lookupMisspeltImports(sample), ['sample.ts imports "#/a.ts"'], "the root's own");
});

Deno.test("every import in the tree is spelt for where it stands", () => {
    const found = readSourceFiles(SOURCE_DIRECTORIES).flatMap(lookupMisspeltImports);
    assertEquals(found, [], "C8");
});
