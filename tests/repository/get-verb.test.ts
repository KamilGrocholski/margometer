/**
 * N2: a `get` reaches what the program holds and works nothing out. An arithmetic operator or a
 * `Math` call in a `get…` is a figure worked out, unless it picks an index or stands in an
 * assertion's arguments, and its verb is `calculate`, `tally`, `count` or `clamp` (ADR 0051).
 */

import { assert, assertEquals } from "@std/assert";
import {
    type AstNode,
    composeSample,
    formatNodePlace,
    lookupCallerDeclaration,
    readAstNodes,
    readDeclaredFunctionName,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";
import { readVerb } from "#/tests/verb-purities.ts";

/** What the rule binds: the program and its tools. */
const CHECKED_DIRECTORIES = ["libs", "src", "tools"];
const ARITHMETIC_OPERATORS = ["+", "-", "*", "/", "%", "**"];
const ARITHMETIC_ASSIGNMENTS = ["+=", "-=", "*=", "/=", "%=", "**="];
const WORKING_KINDS = ["BinaryExpression", "AssignmentExpression", "CallExpression"];
const ACCESS_VERB = "get";
const MATH_NAME = "Math";
const ASSERTION_PREFIX = "assert";
/** Past the depth of any expression here, so the climb to its declaration carries a bound. */
const CLIMB_DEPTH_MAXIMUM = 64;

Deno.test("arithmetic in a get is flagged, and an index, an assertion and words are not", () => {
    const sample = composeSample([
        "function getHeight(rows) { return rows.length * 2; }",
        "function getLast(rows) { return rows[rows.length - 1]; }",
        "function getRows(rows) { assert(rows.length + 1 > 0); return rows; }",
        'function getLabel(name) { return name + " (1)"; }',
        "function getRounded(size) { return Math.round(size); }",
        "function getTotal(rows) { let total = 0; for (const row of rows) total += row; return 1; }",
        "function calculateHeight(rows) { return rows.length * 2; }",
        "const getHalves = (sizes) => sizes.map((size) => size / 2);",
        "function getMiddle(rows) { return rows[Math.floor((rows.length - 1) / 2)]; }",
    ]);
    assertEquals(
        lookupWorkedOutGets(sample),
        [
            "sample.ts:1 getHeight works out *",
            "sample.ts:5 getRounded works out Math.round",
            "sample.ts:6 getTotal works out +=",
            "sample.ts:8 getHalves works out /",
        ],
        "N2",
    );
});

/** Every figure a `get…` works out, by the place it is worked out at. */
function lookupWorkedOutGets(file: SourceFile): string[] {
    const flagged: string[] = [];
    for (const working of readAstNodes(file, WORKING_KINDS)) {
        const operation = readArithmetic(working);
        if (operation === null) continue;
        const declaration = lookupCallerDeclaration(working);
        if (declaration === null) continue;
        const name = readDeclaredFunctionName(declaration) ?? "";
        if (readVerb(name) !== ACCESS_VERB) continue;
        if (isPickingOrAsserting(working, declaration)) continue;
        flagged.push(`${formatNodePlace(file, working)} ${name} works out ${operation}`);
    }
    return flagged;
}

/** The arithmetic a node does, or null where it does none: a `+` joining words does none. */
function readArithmetic(working: AstNode): string | null {
    const operator = working.operator ?? "";
    if (working.type === "AssignmentExpression") {
        return ARITHMETIC_ASSIGNMENTS.includes(operator) ? operator : null;
    }
    if (working.type === "BinaryExpression") {
        if (!ARITHMETIC_OPERATORS.includes(operator)) return null;
        if (isWords(working.left)) return null;
        if (isWords(working.right)) return null;
        return operator;
    }
    const callee = working.callee;
    if (callee?.type !== "MemberExpression") return null;
    if (callee.object?.name !== MATH_NAME) return null;
    return `${MATH_NAME}.${callee.property?.name ?? ""}`;
}

function isWords(operand: AstNode | undefined): boolean {
    if (operand?.type === "TemplateLiteral") return true;
    if (operand?.type !== "Literal") return false;
    return typeof operand.value === "string";
}

/** Whether a node stands in an index or an assertion's arguments, below its declaration. */
function isPickingOrAsserting(working: AstNode, declaration: AstNode): boolean {
    let child = working;
    let ancestor = working.parent ?? null;
    for (let depth = 0; ancestor !== null; depth += 1) {
        assert(depth < CLIMB_DEPTH_MAXIMUM, "a climb stays inside the depth it states");
        if (isSameNode(ancestor, declaration)) return false;
        if (ancestor.type === "MemberExpression") {
            if (ancestor.computed === true) {
                if (isSameNode(ancestor.property, child)) return true;
            }
        } else if (ancestor.type === "CallExpression") {
            const callee = ancestor.callee?.name ?? "";
            if (callee.startsWith(ASSERTION_PREFIX)) return true;
        }
        child = ancestor;
        ancestor = ancestor.parent ?? null;
    }
    return false;
}

/** One node reached twice: the parse hands out a fresh object for it each time. */
function isSameNode(left: AstNode | undefined, right: AstNode): boolean {
    if (left?.range[0] !== right.range[0]) return false;
    return left.range[1] === right.range[1];
}

Deno.test("no get in libs/, src/ or tools/ works a figure out", () => {
    const files = readSourceFiles(CHECKED_DIRECTORIES);
    assert(files.length > 0, "an empty tree is a reader that stopped finding files, not a pass");
    assertEquals(files.flatMap(lookupWorkedOutGets), [], "N2");
});
