/**
 * E10: a callback the bundle hands to a listener, a timer or a frame calls nothing but
 * `errors.attempt`, or a function of ours that calls nothing but that. A closure it writes stands
 * only as the step `attempt` is handed. A parameter handed straight on is a port passing the
 * callback through, and the call handing it to the port is read here in its turn.
 *
 * ⚠️ **The wrapped engine call is the one handover this does not read**: it is an assignment over
 * the game's method, not a call. `tests/simulation.test.ts` holds that nothing reaches the game.
 */

import { assertEquals } from "@std/assert";
import {
    type AstNode,
    composeSample,
    formatNodePlace,
    FUNCTION_NODES,
    lookupEnclosingFunction,
    readAstNodes,
    readBundleFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

/** Where each browser API takes the callback it will call later. */
const CALLBACK_INDEX_BY_METHOD: Record<string, number> = {
    addEventListener: 1,
    requestAnimationFrame: 0,
    setInterval: 0,
    setTimeout: 0,
};
const GUARDS = ["attempt"];

Deno.test("a guarded callback passes, and an unguarded one is flagged in each spelling", () => {
    const sample = composeSample([
        "root.addEventListener('click', (event) => { errors.attempt(() => handle(event)); });",
        "root.addEventListener('wheel', (event) => handle(event));",
        "const guarded = () => { const ran = errors.attempt(step); if (ran instanceof Error) report(ran); };",
        "frames.requestAnimationFrame(guarded);",
        "function report(failure) { void errors.attempt(() => say(failure)); }",
        "setTimeout(later, 0);",
        "const pass = (step, after) => void page.setTimeout(step, after);",
        "timers.setInterval(() => { const hand = () => draw(); errors.attempt(hand); }, 1);",
    ]);
    assertEquals(
        lookupUnguardedCallbacks(sample, lookupGuardingNames([sample])),
        ["sample.ts:2", "sample.ts:6", "sample.ts:8"],
        "the bare listener, the callback read from nowhere, and the closure no guard is handed",
    );
});

/** Every function of ours that calls nothing but a guard, which a handed callback may call. */
function lookupGuardingNames(files: readonly SourceFile[]): Set<string> {
    const found = new Set<string>(GUARDS);
    for (const file of files) {
        const functions = readAstNodes(file, FUNCTION_NODES);
        const calls = readAstNodes(file, ["CallExpression"]);
        for (const declared of readAstNodes(file, ["FunctionDeclaration"])) {
            const name = declared.id?.name;
            if (name === undefined) continue;
            if (isGuardedBody(declared, functions, calls, new Set(GUARDS))) found.add(name);
        }
    }
    return found;
}

/**
 * Every call the body makes itself is to a guarding name, and every closure it writes is handed
 * straight to a guard, where what it calls is the guard's to catch.
 */
function isGuardedBody(
    body: AstNode,
    functions: readonly AstNode[],
    calls: readonly AstNode[],
    guarding: ReadonlySet<string>,
): boolean {
    for (const call of calls) {
        if (!isOwnNode(body, functions, call)) continue;
        if (!guarding.has(readCalleeName(call))) return false;
    }
    for (const closure of functions) {
        if (!isOwnNode(body, functions, closure)) continue;
        const parent = closure.parent;
        if (parent === null || parent === undefined) return false;
        if (!GUARDS.includes(readCalleeName(parent))) return false;
    }
    return true;
}

/** `attempt` is called through its module, `errors.attempt`, and a function of ours by its name. */
function readCalleeName(call: AstNode): string {
    return call.callee?.property?.name ?? call.callee?.name ?? "";
}

/** A node the body stands around, and no closure inside it stands closer. */
function isOwnNode(body: AstNode, functions: readonly AstNode[], node: AstNode): boolean {
    const enclosing = lookupEnclosingFunction(functions, node);
    if (enclosing === null) return false;
    if (enclosing.range[0] !== body.range[0]) return false;
    return enclosing.range[1] === body.range[1];
}

function lookupUnguardedCallbacks(file: SourceFile, guarding: ReadonlySet<string>): string[] {
    const functions = readAstNodes(file, FUNCTION_NODES);
    const calls = readAstNodes(file, ["CallExpression"]);
    const declarators = readAstNodes(file, ["VariableDeclarator"]);
    const found: string[] = [];
    for (const call of calls) {
        const method = call.callee?.property?.name ?? call.callee?.name ?? "";
        const index = CALLBACK_INDEX_BY_METHOD[method];
        if (index === undefined) continue;
        const handed = call.arguments?.[index];
        if (handed === undefined) continue;
        const callback = lookupUnguardedCallbacksBody(handed, call, functions, declarators);
        if (callback === true) continue;
        if (callback !== null) {
            if (isGuardedBody(callback, functions, calls, guarding)) continue;
        }
        found.push(formatNodePlace(file, call));
    }
    return found;
}

/**
 * The function a handed argument names: a closure written there, or a constant of the same file
 * holding one. True where it is a parameter handed straight on; null where it names nothing here.
 */
function lookupUnguardedCallbacksBody(
    handed: AstNode,
    call: AstNode,
    functions: readonly AstNode[],
    declarators: readonly AstNode[],
): AstNode | true | null {
    if (FUNCTION_NODES.some((kind) => kind === handed.type)) return handed;
    const name = handed.name;
    if (name === undefined) return null;
    const enclosing = lookupEnclosingFunction(functions, call);
    if (enclosing?.params?.some((parameter) => parameter.name === name)) return true;
    for (const declarator of declarators) {
        if (declarator.id?.name !== name) continue;
        const init = declarator.init;
        if (init === null || init === undefined) return null;
        return FUNCTION_NODES.some((kind) => kind === init.type) ? init : null;
    }
    return null;
}

Deno.test("every callback the bundle hands to the browser is guarded where it is handed", () => {
    const files = readBundleFiles();
    const guarding = lookupGuardingNames(files);
    const found = files.flatMap((file) => lookupUnguardedCallbacks(file, guarding));
    assertEquals(found, [], "E10");
});
