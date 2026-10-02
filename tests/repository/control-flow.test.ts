/**
 * S1: no function reaches itself, directly or through others, and no body is written on one line.
 * The calls are read by name, across files through the imports that name them. A call inside a
 * closure is its enclosing declaration's, so recursion through a callback is still recursion.
 *
 * ⚠️ **A method call is nobody's to resolve.** `store.read()` names no declaration a parse can
 * find, so a cycle closing through a port's method is outside this reading.
 */

import { assert, assertEquals } from "@std/assert";
import {
    composeSample,
    formatNodePlace,
    FUNCTION_NODES,
    indexCallableNames,
    lookupCallerDeclaration,
    NAME_MARK,
    readAstNodes,
    readDeclaredFunctionName,
    readSourceFiles,
    SOURCE_DIRECTORIES,
    type SourceFile,
} from "#/tests/source-tree.ts";

/** What S1 binds: the program and its tools. A test's fake may recurse as the page it fakes does. */
const CHECKED_DIRECTORIES = ["frozen", "libs", "src", "tools"];
/** Past the declarations of the whole tree, so a walk of the graph carries a stated bound. */
const DECLARATIONS_MAXIMUM = 8192;

Deno.test("a function reaching itself is flagged in each shape, and a plain call is not", () => {
    const sample = composeSample([
        "function countdown(at) { if (at > 0) countdown(at - 1); }",
        "function ping() { pong(); }",
        "function pong() { ping(); }",
        "function walk(rows) { return rows.map((row) => walk(row.children)); }",
        "const read = () => { format(); };",
        "function format() { return 1; }",
    ]);
    assertEquals(
        lookupRecursiveNames(indexCalls([sample])),
        ["sample.ts#countdown", "sample.ts#ping", "sample.ts#pong", "sample.ts#walk"],
        "itself, a pair, and through a closure; and a call that returns is not one",
    );
});

/** Every declaration that calls another, by `path#name`, and what it calls. */
function indexCalls(files: readonly SourceFile[]): Map<string, Set<string>> {
    const calls = new Map<string, Set<string>>();
    for (const file of files) {
        const known = indexCallableNames(file);
        for (const call of readAstNodes(file, ["CallExpression"])) {
            const called = known.get(call.callee?.name ?? "");
            if (called === undefined) continue;
            const declaration = lookupCallerDeclaration(call);
            if (declaration === null) continue;
            const caller = readDeclaredFunctionName(declaration);
            if (caller === null) continue;
            const key = file.path + NAME_MARK + caller;
            const reached = calls.get(key) ?? new Set<string>();
            reached.add(called);
            calls.set(key, reached);
        }
    }
    return calls;
}

/** Every declaration the calls lead back to itself, in order. */
function lookupRecursiveNames(calls: ReadonlyMap<string, ReadonlySet<string>>): string[] {
    const recursive: string[] = [];
    for (const start of calls.keys()) {
        if (isReachingItself(calls, start)) recursive.push(start);
    }
    return recursive.sort();
}

function isReachingItself(calls: ReadonlyMap<string, ReadonlySet<string>>, start: string): boolean {
    const seen = new Set<string>();
    const pending = [...(calls.get(start) ?? [])];
    for (let pendingName = pending.pop(); pendingName !== undefined; pendingName = pending.pop()) {
        if (pendingName === start) return true;
        if (seen.has(pendingName)) continue;
        seen.add(pendingName);
        assert(seen.size <= DECLARATIONS_MAXIMUM, "the graph stays inside the bound a walk states");
        pending.push(...(calls.get(pendingName) ?? []));
    }
    return false;
}

Deno.test("a call is followed through the import that names it", () => {
    const goFile = {
        path: "one.ts",
        text: 'import { back } from "./two.ts";\nexport function go() { back(); }',
    };
    const backFile = {
        path: "two.ts",
        text: 'import { go } from "./one.ts";\nexport function back() { go(); }',
    };
    assertEquals(
        lookupRecursiveNames(indexCalls([goFile, backFile])),
        ["one.ts#go", "two.ts#back"],
        "a pair",
    );
    const alone = { path: "two.ts", text: "export function back() { return 1; }" };
    assertEquals(lookupRecursiveNames(indexCalls([goFile, alone])), [], "and one that returns");
});

Deno.test("no function of the program reaches itself", () => {
    const calls = indexCalls(readSourceFiles(CHECKED_DIRECTORIES));
    assert(calls.size > 0, "an empty graph is a reader that stopped finding calls, not a pass");
    assertEquals(lookupRecursiveNames(calls), [], "S1");
});

Deno.test("a body on one line is flagged, and an empty one or an expression is not", () => {
    const sample = composeSample([
        "function a(n) { return n; }",
        "const b = () => { return 1; };",
        "const c = () => {};",
        "const d = (n) => ({ n });",
        "function e(n) {",
        "    return n;",
        "}",
    ]);
    assertEquals(lookupBodiesOnOneLine(sample), ["sample.ts:1", "sample.ts:2"], "S1");
});

function lookupBodiesOnOneLine(file: SourceFile): string[] {
    const oneLiners: string[] = [];
    for (const functionNode of readAstNodes(file, FUNCTION_NODES)) {
        const body = functionNode.body;
        if (body === null || body === undefined) continue;
        if (Array.isArray(body)) continue;
        const statements = body.body;
        if (!Array.isArray(statements)) continue;
        if (statements.length === 0) continue;
        const text = file.text.slice(body.range[0], body.range[1]);
        if (!text.includes("\n")) oneLiners.push(formatNodePlace(file, functionNode));
    }
    return oneLiners;
}

Deno.test("no body in the tree is written on one line", () => {
    const files = readSourceFiles(SOURCE_DIRECTORIES);
    assertEquals(files.flatMap(lookupBodiesOnOneLine), [], "S1");
});
