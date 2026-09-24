/**
 * A6 and A10: assertions come from `@std/assert`, and what the bundle carries takes the plain
 * `assert` by its module path, never the barrel. There is no assertion module of our own.
 */

import { assertEquals } from "@std/assert";
import {
    composeSample,
    formatNodePlace,
    readAstNodes,
    readBundleFiles,
    readImportSources,
    readSourceFiles,
    SOURCE_DIRECTORIES,
    type SourceFile,
} from "@/tests/source-tree.ts";

const ASSERT_PACKAGE = "@std/assert";
const ASSERT_MODULE = "@std/assert/assert";
const ASSERT_NAME = "assert";

function lookupBarrelAsserts(file: SourceFile): string[] {
    const sources = readImportSources(file).filter((source) => {
        if (!source.startsWith(ASSERT_PACKAGE)) return false;
        return source !== ASSERT_MODULE;
    });
    return sources.map((source) => `${file.path} imports "${source}"`);
}

function lookupOwnAsserts(file: SourceFile): string[] {
    const found: string[] = [];
    for (const node of readAstNodes(file, ["FunctionDeclaration", "VariableDeclarator"])) {
        if (node.id?.name === ASSERT_NAME) found.push(formatNodePlace(file, node));
    }
    return found;
}

Deno.test("the barrel and a module beside it are flagged, and the plain assert is not", () => {
    const sample = composeSample([
        'import { assertEquals } from "@std/assert";',
        'import { assertExists } from "@std/assert/exists";',
        'import { assert } from "@std/assert/assert";',
    ]);
    const flagged = ['sample.ts imports "@std/assert"', 'sample.ts imports "@std/assert/exists"'];
    assertEquals(lookupBarrelAsserts(sample), flagged, "only the module path ships");
});

Deno.test("an assert of our own is flagged, in either spelling, and a call to one is not", () => {
    const sample = composeSample([
        "function assert(condition: boolean) {}",
        "const assert = (condition: boolean) => {};",
        'assert(isRead, "a call is not a definition");',
    ]);
    assertEquals(lookupOwnAsserts(sample), ["sample.ts:1", "sample.ts:2"], "both definitions");
});

Deno.test("what the bundle carries takes the plain assert by its module path", () => {
    assertEquals(readBundleFiles().flatMap(lookupBarrelAsserts), [], "A10");
});

Deno.test("nothing in the tree defines an assert of its own", () => {
    assertEquals(readSourceFiles(SOURCE_DIRECTORIES).flatMap(lookupOwnAsserts), [], "A6");
});
