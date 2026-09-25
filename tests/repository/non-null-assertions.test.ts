/**
 * C12: `!` is never used in `src/` or `tools/`. Tests keep it.
 */

import { assertEquals } from "@std/assert";
import {
    composeSample,
    formatNodePlace,
    readAstNodes,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

Deno.test("an asserted non-null is flagged, and a negation and an inequality are not", () => {
    const asserted = composeSample(["const first = rows[0]!;"]);
    assertEquals(lookupNonNullAssertions(asserted), ["sample.ts:1"], "the postfix `!`");
    const negated = composeSample(["const isEmpty = !rows.length;", "if (a !== b) run();"]);
    assertEquals(lookupNonNullAssertions(negated), [], "a prefix `!` and `!==` are no assertion");
});

function lookupNonNullAssertions(file: SourceFile): string[] {
    const nodes = readAstNodes(file, ["TSNonNullExpression"]);
    return nodes.map((node) => formatNodePlace(file, node));
}

Deno.test("nothing in src/ or tools/ asserts a value is not null", () => {
    const found = readSourceFiles(["src", "tools"]).flatMap(lookupNonNullAssertions);
    assertEquals(found, [], "C12");
});
