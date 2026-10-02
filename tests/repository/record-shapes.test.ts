/**
 * S15: a record this program builds is born whole. In the layers that build records, no property is
 * `delete`d and no type marks one optional; `src/ui/` and the entry keep `?:`, because what they type
 * there is an object the page hands over.
 */

import { assertEquals } from "@std/assert";
import {
    composeSample,
    formatNodePlace,
    readAstNodes,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

/** The layers that build records, and `libs/`, which the bundle carries. */
const CHECKED_DIRECTORIES = ["libs", "src/core", "src/ports", "src/runtime"];
const DELETE_OPERATOR = "delete";

Deno.test("a deleted and an optional property are flagged, and a map's delete and null are not", () => {
    const sample = composeSample([
        "delete reading.total;",
        "interface Reading { total?: number; }",
        "type Shape = { name?: string };",
        "interface Whole { total: number | null; }",
        "byName.delete(name);",
        "const isEmpty = !reading;",
    ]);
    assertEquals(
        lookupShapeChanges(sample),
        ["sample.ts:1", "sample.ts:2", "sample.ts:3"],
        "the delete and the two optional properties",
    );
});

function lookupShapeChanges(file: SourceFile): string[] {
    const shapeChanges: string[] = [];
    for (const candidate of readAstNodes(file, ["UnaryExpression", "TSPropertySignature"])) {
        if (candidate.operator === DELETE_OPERATOR) {
            shapeChanges.push(formatNodePlace(file, candidate));
        }
        if (candidate.optional === true) shapeChanges.push(formatNodePlace(file, candidate));
    }
    return shapeChanges;
}

Deno.test("no record the layers build changes its shape", () => {
    const files = readSourceFiles(CHECKED_DIRECTORIES);
    assertEquals(files.flatMap(lookupShapeChanges), [], "S15");
});
