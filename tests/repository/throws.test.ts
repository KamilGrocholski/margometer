/**
 * E1 and E13: nothing the bundle carries throws on purpose except an assertion, and nothing
 * extends `Error` outside the one base file `tools/` owns.
 */

import { assertEquals } from "@std/assert";
import {
    composeSample,
    formatNodePlace,
    readAstNodes,
    readBundleFiles,
    readSourceFiles,
    SOURCE_DIRECTORIES,
    type SourceFile,
} from "#/tests/source-tree.ts";

const TOOL_ERROR_PATH = "tools/margometer-tool-error.ts";
const ERROR_NAME = "Error";

Deno.test("a throw is flagged, and a word in a string is not", () => {
    const sample = composeSample(['const said = "throw";', "throw new Error(said);"]);
    assertEquals(lookupThrows(sample), ["sample.ts:2"], "the statement alone");
});

function lookupThrows(file: SourceFile): string[] {
    return readAstNodes(file, ["ThrowStatement"]).map((node) => formatNodePlace(file, node));
}

Deno.test("a class extending Error is flagged in either spelling, and another is not", () => {
    const sample = composeSample([
        "class Refusal extends Error {}",
        "const Late = class extends Error {};",
        "class Reader extends Base {}",
    ]);
    assertEquals(lookupErrorClasses(sample), ["sample.ts:1", "sample.ts:2"], "both spellings");
});

function lookupErrorClasses(file: SourceFile): string[] {
    if (file.path === TOOL_ERROR_PATH) return [];
    const found: string[] = [];
    for (const node of readAstNodes(file, ["ClassDeclaration", "ClassExpression"])) {
        if (node.superClass?.name === ERROR_NAME) found.push(formatNodePlace(file, node));
    }
    return found;
}

Deno.test("nothing the bundle carries throws on purpose", () => {
    assertEquals(readBundleFiles().flatMap(lookupThrows), [], "E1");
});

Deno.test("nothing in the tree extends Error outside the tools' base", () => {
    assertEquals(readSourceFiles(SOURCE_DIRECTORIES).flatMap(lookupErrorClasses), [], "E13");
});
