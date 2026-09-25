/**
 * C7: no regular expression, in either spelling. Text is read by walking it.
 */

import { assertEquals } from "@std/assert";
import {
    composeSample,
    formatNodePlace,
    readAstNodes,
    readSourceFiles,
    SOURCE_DIRECTORIES,
    type SourceFile,
} from "#/tests/source-tree.ts";

const CONSTRUCTOR_NAME = "RegExp";

function lookupRegularExpressions(file: SourceFile): string[] {
    const found: string[] = [];
    for (const node of readAstNodes(file, ["Literal", "Identifier"])) {
        const isLiteral = typeof node.regex === "object" && node.regex !== null;
        const isConstructor = node.name === CONSTRUCTOR_NAME;
        if (isLiteral) found.push(`${formatNodePlace(file, node)} spells a literal`);
        if (isConstructor) found.push(`${formatNodePlace(file, node)} names the constructor`);
    }
    return found;
}

Deno.test("both spellings are flagged, and a slash inside a string is not", () => {
    const literal = composeSample(["const found = /x/.test(text);"]);
    assertEquals(lookupRegularExpressions(literal), ["sample.ts:1 spells a literal"], "a literal");
    const built = composeSample(["", "const found = new RegExp(pattern);"]);
    const named = ["sample.ts:2 names the constructor"];
    assertEquals(lookupRegularExpressions(built), named, "the constructor");
    const quoted = composeSample(['const path = "/x/"; // new RegExp']);
    assertEquals(lookupRegularExpressions(quoted), [], "a string and a comment are not code");
});

Deno.test("no file in the tree spells a regular expression", () => {
    const found = readSourceFiles(SOURCE_DIRECTORIES).flatMap(lookupRegularExpressions);
    assertEquals(found, [], "C7");
});
