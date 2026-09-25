/**
 * C13: nothing outside the tests asserts a type, in either spelling. `as const` asserts nothing and
 * `satisfies` asks the compiler rather than overriding it, so neither is read as one. No crossing
 * has needed a cast yet, so there is no register; the first one is `[ASK]` and starts it.
 */

import { assertEquals } from "@std/assert";
import {
    type AstNode,
    composeSample,
    formatNodePlace,
    readAstNodes,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

/** Every source directory but `tests/`, which C13 lets keep the cast. */
const CHECKED_DIRECTORIES = ["frozen", "libs", "src", "tools"];
const CONST_NAME = "const";

Deno.test("a cast is flagged in either spelling, and `as const` and `satisfies` are not", () => {
    const sample = composeSample([
        "const one = read() as Reading;",
        "const two = <Reading>read();",
        "const three = { a: 1 } as const;",
        "const four = <const>[1];",
        "const five = { a: 1 } satisfies Shape;",
    ]);
    assertEquals(lookupTypeAssertions(sample), ["sample.ts:1", "sample.ts:2"], "the two casts");
});

function lookupTypeAssertions(file: SourceFile): string[] {
    const found: string[] = [];
    for (const node of readAstNodes(file, ["TSAsExpression", "TSTypeAssertion"])) {
        if (!isConstAssertion(node)) found.push(formatNodePlace(file, node));
    }
    return found;
}

function isConstAssertion(node: AstNode): boolean {
    return node.typeAnnotation?.typeName?.name === CONST_NAME;
}

Deno.test("nothing outside the tests asserts a type", () => {
    const files = readSourceFiles(CHECKED_DIRECTORIES);
    assertEquals(files.flatMap(lookupTypeAssertions), [], "C13");
});
