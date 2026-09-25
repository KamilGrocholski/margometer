/**
 * E4: what the bundle carries catches broadly in `callForeign` and `runGuarded` and nowhere else,
 * and each of the two still does. Read both ways, because a reader proved only on what it must flag
 * calls the tree clean once the two have moved. `tools/` catches at the network and at a
 * subprocess (E5), which is a judgement of what a `try` holds, and no reader here makes it.
 */

import { assertEquals } from "@std/assert";
import {
    composeSample,
    FUNCTION_NODES,
    lookupEnclosingFunction,
    readAstNodes,
    readBundleFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

const GUARD_PATH = "libs/result.ts";
const BROAD_CATCHES = [`${GUARD_PATH} callForeign`, `${GUARD_PATH} runGuarded`];
const ANONYMOUS = "(a function with no name)";

Deno.test("a catch is read as the function it stands in, and a finally is not a catch", () => {
    const sample = composeSample([
        "function callForeign(call) {",
        "    try { return call(); } catch (cause) { return cause; }",
        "}",
        "function draw() { try { paint(); } finally { done(); } }",
        "function hand() { return () => { try { paint(); } catch { return; } }; }",
    ]);
    assertEquals(
        lookupCatchPlaces(sample),
        ["sample.ts callForeign", `sample.ts ${ANONYMOUS}`],
        "the named one, and the closure rather than the function holding it",
    );
});

function lookupCatchPlaces(file: SourceFile): string[] {
    const functions = readAstNodes(file, FUNCTION_NODES);
    return readAstNodes(file, ["CatchClause"]).map((node) => {
        const name = lookupEnclosingFunction(functions, node)?.id?.name ?? ANONYMOUS;
        return `${file.path} ${name}`;
    });
}

Deno.test("the bundle catches broadly in the two functions E4 names, and each still does", () => {
    assertEquals(readBundleFiles().flatMap(lookupCatchPlaces), BROAD_CATCHES, "E4");
});
