/**
 * The line readers, against a second reading of the same tree.
 *
 * Every guard here walks TypeScript by hand, and the failure that has cost this repository six
 * rounds is never a wrong verdict — it is a reader that quietly stops finding its subject and
 * goes on answering. `Deno.lint.runPlugin` parses the same files properly, so what it counts is
 * the second way of counting AGENTS.md asks for. It settles no rule: it says the readers still
 * see what they claim to see, and it holds S4 on a reading of its own.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import {
    composeCallGraph,
    getBlockOpenedAt,
    getFunctionBodies,
    getIsTakingSomething,
    isDeclarationOpener,
} from "@/tests/source-graph.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";

/**
 * `Deno.lint` is declared only under the `deno.unstable` library, and naming that in
 * `compilerOptions.lib` would show every unstable API of the runtime to `src/` as well. C13 keeps
 * the assertion inside a test for exactly this, and the shape below is the whole of what is used.
 */
interface AstNode {
    type: string;
    range: [number, number];
    body?: { type: string } | null;
    params?: readonly unknown[];
}
type AstVisitor = Record<string, (node: AstNode) => void>;
interface LintPlugin {
    name: string;
    rules: Record<string, { create: () => AstVisitor }>;
}
const lint = (Deno as unknown as {
    lint: { runPlugin(plugin: LintPlugin, filename: string, source: string): unknown };
}).lint;

const FUNCTION_NODES = ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"];
const MAXIMUM_FUNCTION_LINES = 70;
const BUNDLED_ROOTS = ["libs/", "src/"];
/**
 * What each reader held on 2026-09-10, against what the parser finds in the bundle. The counting
 * one is the graph, at 657 nodes to 664 parsed functions.
 *
 * ⚠️ **The body reader is held by the lines it collects, never by how many bodies it collects.**
 * Its documented failure — a body closed before it had opened — leaves every function in the map
 * and truncates what each one holds, so a count of bodies stays whole while the reading behind it
 * is gone. Measured 2026-09-10 by putting that fault back: the count did not move at all, and the
 * lines held fell from 8844 to 4826.
 */
const BODY_LINE_SHARE_FLOOR = 85;
const GRAPH_SHARE_FLOOR = 95;
/** Far under the declarations the bundle holds, so a reader that found nothing fails loudly. */
const COMPARED_FLOOR = 400;

/** Where a byte offset falls, as a line number counting from one. */
function composeLineIndex(text: string): (offset: number) => number {
    const starts = [0];
    for (let at = 0; at < text.length; at += 1) {
        if (text.charAt(at) === "\n") starts.push(at + 1);
    }
    return (offset: number) => {
        let found = 1;
        for (const [at, start] of starts.entries()) {
            if (start > offset) break;
            found = at + 1;
        }
        return found;
    };
}

/** Every function the parser finds with a block to walk, by the lines it spans. */
function readAstFunctions(path: string, text: string): { from: number; to: number }[] {
    assert(path.length > 0, "a file being parsed is named");
    const lineAt = composeLineIndex(text);
    const found: { from: number; to: number }[] = [];
    const visit = (node: AstNode) => {
        if (node.body?.type !== "BlockStatement") return;
        found.push({ from: lineAt(node.range[0]), to: lineAt(node.range[1]) });
    };
    const visitors: AstVisitor = {};
    for (const kind of FUNCTION_NODES) visitors[kind] = visit;
    lint.runPlugin({ name: "read", rules: { walk: { create: () => visitors } } }, path, text);
    assert(found.every((one) => one.to >= one.from), "a function never ends before it opens");
    return found;
}

function countParsedInBundle(): number {
    let parsed = 0;
    for (const path of getSourcePaths()) {
        if (!BUNDLED_ROOTS.some((root) => path.startsWith(root))) continue;
        parsed += readAstFunctions(path, Deno.readTextFileSync(path)).length;
    }
    assert(parsed > 0, "the parser finds functions in the bundle");
    return parsed;
}

/** The functions no other one is written inside, which is what a file collects at its margin. */
function getOutermost(
    found: readonly { from: number; to: number }[],
): { from: number; to: number }[] {
    return found.filter((one) =>
        !found.some((other) =>
            other !== one && other.from <= one.from && other.to >= one.to &&
            (other.from < one.from || other.to > one.to)
        )
    );
}

/** The lines the parser spans at a file's margin, and the lines the body reader collected there. */
function countBundleLines(): { parsed: number; held: number } {
    const counts = { parsed: 0, held: 0 };
    for (const path of getSourcePaths()) {
        if (!BUNDLED_ROOTS.some((root) => path.startsWith(root))) continue;
        const text = Deno.readTextFileSync(path);
        for (const one of getOutermost(readAstFunctions(path, text))) {
            counts.parsed += one.to - one.from + 1;
        }
        for (const body of getFunctionBodies(text).values()) counts.held += body.length;
    }
    assert(counts.parsed > 0, "the parser spans lines in the bundle");
    return counts;
}

/**
 * ⚠️ **Written as a list of lines, never as a template literal.** The readers under test walk raw
 * lines, so TypeScript inside a template is read as this file's own — `getClosingLine` expects a
 * closer at the margin, an indented one never arrives, and `getSourceReading` throws on a
 * declaration it never closed. Joined strings are invisible to them, which is what a sample owes.
 */
const NESTED_SAMPLE = [
    "function outer(a: number) {",
    "    const inner = (b: number) => {",
    "        return b + 1;",
    "    };",
    "    return inner(a);",
    "}",
    "",
].join("\n");

/** Where the parser puts each function it finds with a block, and whether it is handed anything. */
function readParsedByLine(path: string, text: string): Map<number, boolean> {
    const lineAt = composeLineIndex(text);
    const found = new Map<number, boolean>();
    const visit = (node: AstNode) => {
        if (node.body?.type !== "BlockStatement") return;
        found.set(lineAt(node.range[0]), (node.params ?? []).length > 0);
    };
    const visitors: AstVisitor = {};
    for (const kind of FUNCTION_NODES) visitors[kind] = visit;
    lint.runPlugin({ name: "handed", rules: { walk: { create: () => visitors } } }, path, text);
    return found;
}

/**
 * ⚠️ **The count S5 divides by, asked a second way — which it had never been.**
 * `getIsTakingSomething` answered only where it had found something in the parameter list, so an
 * empty `()` walked it into the body and it took the arguments of the first call there. Forty-three
 * functions of 679 sat in a denominator the rule does not name, and the guard was green for every
 * one of them because nothing counted the same thing twice.
 *
 * ⚠️ **Compared declaration by declaration, and not as a share.** A share does not hold this: the
 * fault makes the reader find **more**, and more passes a floor. Measured 2026-09-22 by putting it
 * back, the reader went from 664 of 712 to 681 — from 93% to 96%, up through any floor written
 * under it. What holds it is the parser disagreeing about one line.
 *
 * Only the lines both readers call a function are compared, because the parser is also shown a
 * method and an arrow assigned to a property, which `isDeclarationOpener` is not asking about.
 */
Deno.test("the count S5 divides by agrees with a parser, declaration by declaration", () => {
    const disagreed: string[] = [];
    let compared = 0;
    for (const path of getSourcePaths()) {
        if (!BUNDLED_ROOTS.some((root) => path.startsWith(root))) continue;
        const text = Deno.readTextFileSync(path);
        const parsed = readParsedByLine(path, text);
        const lines = text.split("\n");
        for (const [offset, line] of lines.entries()) {
            if (!isDeclarationOpener(line)) continue;
            if (getBlockOpenedAt(lines, offset) === null) continue;
            const said = parsed.get(offset + 1);
            if (said === undefined) continue;
            compared += 1;
            if (said === getIsTakingSomething(lines, offset)) continue;
            disagreed.push(`${path}:${offset + 1} ${line.trim()}`);
        }
    }
    assert(compared > COMPARED_FLOOR, `only ${compared} declarations were read both ways`);
    assertEquals(disagreed, [], "the two readings say the same of every declaration they share");
});

Deno.test("the parser finds a nested body, and finds no function where there is none", () => {
    const found = readAstFunctions("sample.ts", NESTED_SAMPLE);
    assertStrictEquals(found.length, 2, "the declaration and the arrow written inside it");
    assertEquals(found[0], { from: 1, to: 6 }, "the outer one spans the whole of its body");
    assertEquals(found[1], { from: 2, to: 4 }, "and the inner one only its own");
    const plain = readAstFunctions("plain.ts", "const held = 1;\nconst other = held + 1;\n");
    assertEquals(plain, [], "a file declaring no function reads as none");
    const short = readAstFunctions("short.ts", "const get = (one: number) => one + 1;\n");
    assertEquals(short, [], "and an arrow with no block has no body to walk");
});

Deno.test("S4 holds on a reading of its own, and not only on the line reader's", () => {
    const over: string[] = [];
    for (const path of getSourcePaths()) {
        for (const one of readAstFunctions(path, Deno.readTextFileSync(path))) {
            const span = one.to - one.from + 1;
            if (span <= MAXIMUM_FUNCTION_LINES) continue;
            over.push(`${path}:${one.from} at ${span} lines`);
        }
    }
    assert(MAXIMUM_FUNCTION_LINES > 0, "the bound is a real one");
    assertEquals(over, [], "S4: a function longer than one printed page, parsed rather than read");
});

Deno.test("the body reader still collects the lines the guards walk", () => {
    assertStrictEquals(getFunctionBodies(NESTED_SAMPLE).size, 1, "it reads a file's own margin");
    const outer = getFunctionBodies(NESTED_SAMPLE).get("outer") ?? [];
    assertStrictEquals(outer.length, 6, "and collects the whole of a body, closure included");

    const counts = countBundleLines();
    const share = Math.floor((counts.held * 100) / counts.parsed);
    assert(
        share >= BODY_LINE_SHARE_FLOOR,
        `the body reader holds ${counts.held} lines where the parser spans ${counts.parsed}`,
    );
});

Deno.test("the call graph still holds the bundle it walks for S1 and E14", () => {
    const graph = composeCallGraph();
    const walked = [...graph.keys()].filter((one) => !one.includes("!catch")).length;
    const parsed = countParsedInBundle();
    const share = Math.floor((walked * 100) / parsed);
    assert(share >= GRAPH_SHARE_FLOOR, `the graph holds ${walked} nodes against ${parsed} parsed`);
});
