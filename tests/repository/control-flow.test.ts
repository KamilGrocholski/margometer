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
    type AstNode,
    composeSample,
    formatNodePlace,
    FUNCTION_NODES,
    lookupImportedPath,
    readAstNodes,
    readSourceFiles,
    SOURCE_DIRECTORIES,
    type SourceFile,
} from "#/tests/source-tree.ts";

/** What S1 binds: the program and its tools. A test's fake may recurse as the page it fakes does. */
const CHECKED_DIRECTORIES = ["frozen", "libs", "src", "tools"];
const NAME_MARK = "#";
/** Past the depth of any parse here, so the climb to a declaration carries a stated bound. */
const DEPTH_MAXIMUM = 512;
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
        const known = indexCallsNames(file);
        for (const call of readAstNodes(file, ["CallExpression"])) {
            const called = known.get(call.callee?.name ?? "");
            if (called === undefined) continue;
            const caller = lookupCallerName(call);
            if (caller === null) continue;
            const key = file.path + NAME_MARK + caller;
            const reached = calls.get(key) ?? new Set<string>();
            reached.add(called);
            calls.set(key, reached);
        }
    }
    return calls;
}

/** What each name a file can call stands for: its own declarations, and what it imports. */
function indexCallsNames(file: SourceFile): Map<string, string> {
    const known = new Map<string, string>();
    for (const declared of readAstNodes(file, ["FunctionDeclaration", "VariableDeclarator"])) {
        const name = readDeclaredFunctionName(declared);
        if (name !== null) known.set(name, file.path + NAME_MARK + name);
    }
    for (const imported of readAstNodes(file, ["ImportDeclaration"])) {
        const source = imported.source?.value;
        if (typeof source !== "string") continue;
        const path = lookupImportedPath(file, source);
        if (path === null) continue;
        for (const specifier of imported.specifiers ?? []) {
            const local = specifier.local?.name;
            const name = specifier.imported?.name;
            if (local === undefined) continue;
            if (name !== undefined) known.set(local, path + NAME_MARK + name);
        }
    }
    return known;
}

/** The name a declaration gives a function, or null where it declares something else. */
function readDeclaredFunctionName(node: AstNode): string | null {
    if (node.type === "FunctionDeclaration") return node.id?.name ?? null;
    const init = node.init;
    if (init === null || init === undefined) return null;
    if (!FUNCTION_NODES.some((kind) => kind === init.type)) return null;
    return node.id?.name ?? null;
}

/** The declaration a call stands in, climbing out of every closure; null at a module's top. */
function lookupCallerName(call: AstNode): string | null {
    let node = call.parent ?? null;
    for (let depth = 0; node !== null; depth += 1) {
        assert(depth < DEPTH_MAXIMUM, "a parse stays inside the depth a climb states");
        const name = readDeclaredFunctionName(node);
        if (name !== null) return name;
        node = node.parent ?? null;
    }
    return null;
}

/** Every declaration the calls lead back to itself, in order. */
function lookupRecursiveNames(calls: ReadonlyMap<string, ReadonlySet<string>>): string[] {
    const found: string[] = [];
    for (const start of calls.keys()) {
        if (isReachingItself(calls, start)) found.push(start);
    }
    return found.sort();
}

function isReachingItself(calls: ReadonlyMap<string, ReadonlySet<string>>, start: string): boolean {
    const seen = new Set<string>();
    const pending = [...(calls.get(start) ?? [])];
    for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
        if (next === start) return true;
        if (seen.has(next)) continue;
        seen.add(next);
        assert(seen.size <= DECLARATIONS_MAXIMUM, "the graph stays inside the bound a walk states");
        pending.push(...(calls.get(next) ?? []));
    }
    return false;
}

Deno.test("a call is followed through the import that names it", () => {
    const one = {
        path: "one.ts",
        text: 'import { back } from "./two.ts";\nexport function go() { back(); }',
    };
    const two = {
        path: "two.ts",
        text: 'import { go } from "./one.ts";\nexport function back() { go(); }',
    };
    assertEquals(
        lookupRecursiveNames(indexCalls([one, two])),
        ["one.ts#go", "two.ts#back"],
        "a pair",
    );
    const alone = { path: "two.ts", text: "export function back() { return 1; }" };
    assertEquals(lookupRecursiveNames(indexCalls([one, alone])), [], "and one that returns");
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
    const found: string[] = [];
    for (const node of readAstNodes(file, FUNCTION_NODES)) {
        const body = node.body;
        if (body === null || body === undefined) continue;
        if (Array.isArray(body)) continue;
        const statements = body.body;
        if (!Array.isArray(statements)) continue;
        if (statements.length === 0) continue;
        const text = file.text.slice(body.range[0], body.range[1]);
        if (!text.includes("\n")) found.push(formatNodePlace(file, node));
    }
    return found;
}

Deno.test("no body in the tree is written on one line", () => {
    const files = readSourceFiles(SOURCE_DIRECTORIES);
    assertEquals(files.flatMap(lookupBodiesOnOneLine), [], "S1");
});
