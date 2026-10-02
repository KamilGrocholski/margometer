/**
 * S16: a body nests at most `NESTING_DEPTH_MAXIMUM` blocks deep, counting its own. Every statement
 * is measured, under its blocks, its `case` and every arrow it stands in, braced or not; a lambda
 * written inside a statement adds nothing to it. A declaration standing deeper than the bound is
 * named once, at its deepest place.
 */

import { assert, assertEquals } from "@std/assert";
import {
    type AstNode,
    composeSample,
    countEnclosingBlocks,
    formatNodePlace,
    NESTING_DEPTH_MAXIMUM,
    readNestedNodes,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

/** What S16 binds: the program and its tools. A test's table of cases nests as its data does. */
const CHECKED_DIRECTORIES = ["libs", "src", "tools"];
/** Past the depth of any parse here, so the climb to the top carries a stated bound. */
const CLIMB_MAXIMUM = 512;

Deno.test("a body past the bound is flagged in each shape, and one at the bound is not", () => {
    const sample = composeSample([
        "function atBound(rows) {",
        "    for (const row of rows) {",
        "        if (row) {",
        "            while (row) {",
        "                if (row) return 1;",
        "                else { row = 0; }",
        "            }",
        "        }",
        "    }",
        "}",
        "function pastBound(rows) {",
        "    for (const row of rows) {",
        "        if (row) {",
        "            while (row) {",
        "                if (row) {",
        "                    if (row) {",
        "                        row = 0;",
        "                    }",
        "                }",
        "            }",
        "        }",
        "    }",
        "}",
        "function throughArrows(rows) {",
        "    return rows.map((row) => row.map((cell) => {",
        "        switch (cell) {",
        "            case 1: {",
        "                if (cell) {",
        "                    return 1;",
        "                }",
        "            }",
        "        }",
        "    }));",
        "}",
        "const ARROWS = (a) => a.map((b) => b.map((c) => c.map((d) => d.map((e) => e.map((f) => {",
        "    return f;",
        "}))))));",
        "const SHALLOW = (a) => a.map((b) => b.map((c) => c.map((d) => { return d; }))));",
        "function lambdas(rows) {",
        "    for (const row of rows) {",
        "        if (row) {",
        "            while (row) {",
        "                if (row) return row.map((one) => one.map((two) => two));",
        "            }",
        "        }",
        "    }",
        "}",
    ]);
    assertEquals(
        lookupDeepBodies(sample, NESTING_DEPTH_MAXIMUM),
        [
            "sample.ts:17 6 deep",
            "sample.ts:29 6 deep",
            "sample.ts:36 6 deep",
        ],
        "a block, a case, a closure's block and an expression arrow each count one",
    );
});

/** Each top-level declaration nesting past the bound, at its deepest place and how deep it goes. */
function lookupDeepBodies(file: SourceFile, maximum: number): string[] {
    const deepest = new Map<number, { node: AstNode; depth: number }>();
    for (const statement of readNestedNodes(file)) {
        const depth = countEnclosingBlocks(statement);
        if (depth <= maximum) continue;
        // Two walks hand two copies of a node, so a declaration is keyed by where it starts.
        const top = lookupTopDeclaration(statement).range[0];
        const was = deepest.get(top);
        if (was === undefined || depth > was.depth) deepest.set(top, { node: statement, depth });
    }
    return [...deepest.values()]
        .map((place) => `${formatNodePlace(file, place.node)} ${place.depth} deep`)
        .sort();
}

/** The statement a node stands in at its module's top. */
function lookupTopDeclaration(statement: AstNode): AstNode {
    let ancestor = statement;
    for (let depth = 0; ancestor.parent?.type !== "Program"; depth += 1) {
        assert(depth < CLIMB_MAXIMUM, "a parse stays inside the depth a climb states");
        assert(
            ancestor.parent !== null && ancestor.parent !== undefined,
            "a node stands in a program",
        );
        ancestor = ancestor.parent;
    }
    return ancestor;
}

Deno.test("no body of the program nests past the bound", () => {
    const files = readSourceFiles(CHECKED_DIRECTORIES);
    assertEquals(
        files.flatMap((file) => lookupDeepBodies(file, NESTING_DEPTH_MAXIMUM)),
        [],
        "S16",
    );
});
