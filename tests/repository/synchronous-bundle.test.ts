/**
 * S13: what the bundle carries is synchronous. No `async`, `await`, `Promise` or `.then` in `src/`,
 * or in the `libs/` modules it reaches.
 */

import { assertEquals } from "@std/assert";
import {
    composeSample,
    formatNodePlace,
    FUNCTION_NODES,
    readAstNodes,
    readBundleFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

const PROMISE_NAME = "Promise";
const THEN_NAME = "then";

Deno.test("every spelling of a promise is flagged, and a word in a string is not", () => {
    const sample = composeSample([
        "async function load() {",
        "    await Promise.resolve(1);",
        "}",
        "fetch(url).then(read);",
        'const said = "then await a Promise"; // async',
    ]);
    const flagged = [
        "sample.ts:1 async",
        "sample.ts:2 await",
        "sample.ts:2 Promise",
        "sample.ts:4 .then",
    ];
    assertEquals(lookupAsynchronousCode(sample), flagged, "each spelling once");
    const synchronous = composeSample(["function load() {", "    return read(1);", "}"]);
    assertEquals(lookupAsynchronousCode(synchronous), [], "a synchronous call is not");
});

function lookupAsynchronousCode(file: SourceFile): string[] {
    const found: string[] = [];
    for (const node of readAstNodes(file, [...FUNCTION_NODES, "AwaitExpression", "Identifier"])) {
        const place = formatNodePlace(file, node);
        if (node.async === true) found.push(`${place} async`);
        if (node.type === "AwaitExpression") found.push(`${place} await`);
        if (node.name === PROMISE_NAME) found.push(`${place} Promise`);
    }
    for (const node of readAstNodes(file, ["MemberExpression"])) {
        if (node.computed === true) continue;
        if (node.property?.name === THEN_NAME) found.push(`${formatNodePlace(file, node)} .then`);
    }
    return found;
}

Deno.test("nothing the bundle carries waits for anything", () => {
    assertEquals(readBundleFiles().flatMap(lookupAsynchronousCode), [], "S13");
});
