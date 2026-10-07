/**
 * S5: assertion density, directory by directory, held at the floor each one stood at when the guard
 * came (ADR 0044). A floor is raised as its directory gains assertions, and never lowered to pass.
 */

import { assert, assertEquals } from "@std/assert";
import {
    composeSample,
    FUNCTION_NODES,
    lookupEnclosingFunction,
    readAstNodes,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

interface AssertionCount {
    assertions: number;
    functions: number;
}

/**
 * Measured on 2026-10-07 (ADR 0044) and cut down to a tenth, so that deleting an assertion **A12**
 * calls no assertion never reddens the gate: `libs/` 1.60, `src/core/` 1.61, `src/ports/` 0.49,
 * `src/runtime/` 0.69, `tools/` 0.90.
 */
const DENSITY_FLOOR_BY_DIRECTORY: ReadonlyMap<string, number> = new Map([
    ["libs", 1.6],
    ["src/core", 1.6],
    ["src/ports", 0.4],
    ["src/runtime", 0.6],
    ["tools", 0.9],
]);
const ASSERTION_PREFIX = "assert";

Deno.test("an assertion counts toward the function it stands in, where that takes something", () => {
    const sample = composeSample([
        "function readCount(count: number): number {",
        '    assert(count > 0, "a count of something");',
        '    assertStrictEquals(count, count, "and itself");',
        "    return count;",
        "}",
        "function readNothing(): number {",
        '    assert(true, "a function handed nothing states no precondition");',
        "    return 1;",
        "}",
        "const tallyBoth = (left: number, right: number) => left + right;",
        'const assertion = "an assert named in text is no call";',
    ]);
    assertEquals(
        countAssertions([sample]),
        { assertions: 2, functions: 2 },
        "two assertions over two functions taking something, the one handed nothing left out",
    );
});

function countAssertions(files: readonly SourceFile[]): AssertionCount {
    const count: AssertionCount = { assertions: 0, functions: 0 };
    for (const file of files) {
        const functions = readAstNodes(file, [...FUNCTION_NODES]);
        const taking = functions.filter((declared) => (declared.params?.length ?? 0) > 0);
        count.functions += taking.length;
        for (const call of readAstNodes(file, ["CallExpression"])) {
            const callee = call.callee;
            if (callee?.type !== "Identifier") continue;
            if (!(callee.name ?? "").startsWith(ASSERTION_PREFIX)) continue;
            const enclosing = lookupEnclosingFunction(functions, call);
            if (enclosing === null) continue;
            if ((enclosing.params?.length ?? 0) > 0) count.assertions += 1;
        }
    }
    return count;
}

Deno.test("a directory under its floor is flagged, and one at it is not", () => {
    const count = { assertions: 3, functions: 2 };
    assertEquals(lookupUnderFloor("libs", count, 1.6), ["libs 1.50 under its floor of 1.6"]);
    assertEquals(lookupUnderFloor("libs", count, 1.5), [], "a density at its floor holds");
});

function lookupUnderFloor(directory: string, count: AssertionCount, floor: number): string[] {
    assert(count.functions > 0, "a density is taken over functions");
    const density = count.assertions / count.functions;
    if (density >= floor) return [];
    return [`${directory} ${density.toFixed(2)} under its floor of ${floor}`];
}

Deno.test("every directory S5 names holds its assertions at its floor or above", () => {
    const under: string[] = [];
    for (const [directory, floor] of DENSITY_FLOOR_BY_DIRECTORY) {
        under.push(
            ...lookupUnderFloor(directory, countAssertions(readSourceFiles([directory])), floor),
        );
    }
    assertEquals(under, [], "S5");
});
