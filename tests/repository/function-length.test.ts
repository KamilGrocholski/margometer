/**
 * S4: no function runs past seventy lines, which is one printed page.
 */

import { assertEquals } from "@std/assert";
import {
    composeSample,
    formatNodePlace,
    FUNCTION_NODES,
    getLineAt,
    readAstNodes,
    readSourceFiles,
    SOURCE_DIRECTORIES,
    type SourceFile,
} from "#/tests/source-tree.ts";

const FUNCTION_LINES_MAXIMUM = 70;

Deno.test("a function of seventy lines passes, and one of seventy-one is flagged", () => {
    const atMaximum = composeFunctionSample(FUNCTION_LINES_MAXIMUM - 2);
    assertEquals(lookupLongFunctions(atMaximum), [], "seventy lines is one page");
    const pastMaximum = composeFunctionSample(FUNCTION_LINES_MAXIMUM - 1);
    assertEquals(lookupLongFunctions(pastMaximum), ["sample.ts:1 runs 71 lines"], "one past it");
});

function composeFunctionSample(bodyLines: number): SourceFile {
    const body = Array.from({ length: bodyLines }, (_, index) => `    const a${index} = ${index};`);
    return composeSample(["function sample() {", ...body, "}"]);
}

function lookupLongFunctions(file: SourceFile): string[] {
    const found: string[] = [];
    for (const node of readAstNodes(file, FUNCTION_NODES)) {
        const first = getLineAt(file.text, node.range[0]);
        const last = getLineAt(file.text, node.range[1]);
        const lines = last - first + 1;
        if (lines <= FUNCTION_LINES_MAXIMUM) continue;
        found.push(`${formatNodePlace(file, node)} runs ${lines} lines`);
    }
    return found;
}

Deno.test("no function in the tree runs past seventy lines", () => {
    const found = readSourceFiles(SOURCE_DIRECTORIES).flatMap(lookupLongFunctions);
    assertEquals(found, [], "S4");
});
