/**
 * The call graph this repository's guards read: what a function is, what it reaches, and what
 * stands over the call when it does.
 *
 * Shared because two guards ask the same question of it — **S1** whether anything reaches itself,
 * and **E14** whether anything the browser enters reaches something that throws — and a second
 * copy of a reader this delicate would drift the day one of them was fixed.
 */

import { assert } from "@std/assert";
import { getCodeOutsideStrings, isCommentLine } from "@/tests/source-line.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";

/** A declaration wrapped over more lines than this is a signature nobody can read anyway. */
export const MAXIMUM_DECLARATION_LINES = 12;

/** A declaration, not a callback: `function`, a named arrow, or a test. */
export function isDeclarationOpener(line: string): boolean {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("function ") || trimmed.startsWith("export function ")) return true;
    if (trimmed.startsWith("Deno.test(")) return true;
    if (!trimmed.startsWith("const ") && !trimmed.startsWith("export const ")) return false;
    return trimmed.includes(" = (") || trimmed.includes(" = async (");
}

/**
 * Whether a declaration opens a **block**, reading across as many lines as it takes.
 *
 * ⚠️ **A declaration is not a line, and reading it as one broke this guard twice.** A named arrow
 * wrapped over three lines — `const read = (`, its parameters, `) => {` — carried no arrow on the
 * line that named it, so S4 and S5 never saw it. And a one-line `const read = () => value;`
 * carried one, so it was read as opening a body that never closed: every line after it, the next
 * declaration included, was collected as its own, and a later call to it read as a call to itself.
 * A false positive is worse than a blind spot, and this had one of each.
 *
 * So the answer is the brace, not the arrow. An expression-bodied arrow opens no block, and this
 * counts none: it has no body to measure against S4 and nowhere to put an assertion for S5.
 */
export function getBlockOpenedAt(lines: readonly string[], from: number): number | null {
    assert(from >= 0, "a declaration starts somewhere inside the file");
    const first = (lines[from] ?? "").trimStart();
    // A `const` says nothing about being a function until its arrow, and the arrow may be lines
    // away — `const total = (a + b) * 2;` opens with the same three tokens as a named arrow does.
    let needsArrow = first.startsWith("const ") || first.startsWith("export const ");
    const limit = Math.min(lines.length, from + MAXIMUM_DECLARATION_LINES);
    for (let at = from; at < limit; at += 1) {
        const code = getCodeOutsideStrings(lines[at] ?? "").trimEnd();
        if (code.includes("=>")) needsArrow = false;
        if (code.endsWith(";")) return null;
        if (code.endsWith("{")) return needsArrow ? null : at;
    }
    return null;
}

export function getDeclaredName(line: string): string {
    const code = getCodeOutsideStrings(line).trimStart();
    for (const opener of ["export function ", "function ", "const ", "export const "]) {
        if (!code.startsWith(opener)) continue;
        const rest = code.slice(opener.length);
        let end = 0;
        while (end < rest.length && (isWordCharacter(rest.charAt(end)))) end += 1;
        return rest.slice(0, end);
    }
    return "";
}

export function countOutside(line: string, character: string): number {
    const code = getCodeOutsideStrings(line);
    let count = 0;
    for (const one of code) {
        if (one === character) count += 1;
    }
    return count;
}

/**
 * Each declared function with the lines of its body, by brace depth.
 *
 * ⚠️ **A body is not closed until it has opened, and reading it otherwise truncated every function
 * whose declaration takes more than one line.** `export function wrapEngineBattle(` carries no
 * brace, so the depth was still nought on the parameter under it and the body was stored two lines
 * long — the whole of `src/` bar the one-line declarations. Measured 2026-09-05: 17 of the 41
 * functions in `src/userscript-entry.ts` alone. S1 read those two lines for recursion and found
 * none because there was nothing left to find, and its samples all declared on one line, which is
 * how a reader that had stopped finding its subject stayed green.
 */
export function getFunctionBodies(text: string): Map<string, string[]> {
    const bodies = new Map<string, string[]>();
    const lines = text.split("\n");
    let name = "";
    let depth = 0;
    let isOpened = false;
    let body: string[] = [];
    for (const [offset, line] of lines.entries()) {
        if (name === "" && isDeclarationOpener(line) && getBlockOpenedAt(lines, offset) !== null) {
            name = getDeclaredName(line);
            depth = 0;
            isOpened = false;
            body = [];
        }
        if (name === "") continue;
        depth += countOutside(line, "{") - countOutside(line, "}");
        body.push(line);
        if (depth > 0) isOpened = true;
        if (isOpened) {
            if (depth <= 0) {
                bodies.set(name, body);
                name = "";
            }
        }
    }
    assert(bodies.size <= lines.length, "no more functions than lines");
    assert(![...bodies.keys()].includes(""), "an unnamed body is never stored");
    return bodies;
}

/** The names a declaration is handed, which are somebody else's functions and not this file's. */
export function getParameterNames(lines: readonly string[]): Set<string> {
    const found = new Set<string>();
    const limit = Math.min(lines.length, MAXIMUM_DECLARATION_LINES);
    let depth = 0;
    for (let at = 0; at < limit; at += 1) {
        for (const character of getCodeOutsideStrings(lines[at] ?? "")) {
            if (character === "(") depth += 1;
            if (character === ")") depth -= 1;
        }
        if (at === 0) continue;
        const named = lines[at]?.trim().split(":")[0]?.trim() ?? "";
        if (named.length > 0) found.add(named);
        if (depth <= 0) break;
    }
    return found;
}

/** What the browser runs. `project/` and `tools/` are not in it, and neither are their throws. */
const BUNDLED_ROOTS = ["libs/", "src/"];
export const ENTRY = "src/userscript-entry.ts#startFromUserscriptWindow";
/** More functions than this tree will hold, so the walk states a bound like every other. */
const MAXIMUM_FUNCTIONS = 4096;
/** Read as a call by the syntax and by nobody's definition, so no edge is drawn for one. */
const NOT_A_CALL = [
    "if",
    "for",
    "while",
    "switch",
    "catch",
    "return",
    "typeof",
    "function",
    "new",
    "await",
    "super",
    "void",
    "delete",
    "in",
    "of",
    "do",
    "else",
];

interface SourceFunction {
    throws: boolean;
    /** Whether it hands back the failure it was given, which makes it a narrowing and no guard. */
    isRethrowing: boolean;
    /** Only what is called where no `try` stands over it: the walk follows nothing else. */
    reaches: string[];
    /** The same, for calls whose object nothing here can resolve. */
    methods: string[];
}

export function isWordCharacter(character: string): boolean {
    if (character >= "a" && character <= "z") return true;
    if (character >= "A" && character <= "Z") return true;
    if (character >= "0" && character <= "9") return true;
    if (character === "_") return true;
    return character === "$";
}

export function hasWord(code: string, word: string): boolean {
    for (let at = 0; at < code.length; at += 1) {
        if (!code.startsWith(word, at)) continue;
        if (isWordCharacter(at === 0 ? "" : code.charAt(at - 1))) continue;
        if (isWordCharacter(code.charAt(at + word.length))) continue;
        return true;
    }
    return false;
}

/**
 * The line closing a `try`, where that line is its `catch`. **A `try`/`finally` catches nothing**,
 * and `writeTextToFile` holds the one in this tree — reading it as a guard would call the download
 * path covered when `saveRecording` is what covers it.
 *
 * ⚠️ **Counted a character at a time, because `} catch {` nets nothing.** Taking the braces a line
 * at a time never sees the depth fall to zero at a catch, so every `try` read as never closing and
 * every guard read as absent.
 */
function getCloseOfTry(body: readonly string[], at: number): number | null {
    let depth = 0;
    for (let after = at; after < body.length; after += 1) {
        const code = getCodeOutsideStrings(body[after] ?? "");
        for (let index = 0; index < code.length; index += 1) {
            if (code.charAt(index) === "{") depth += 1;
            if (code.charAt(index) !== "}") continue;
            depth -= 1;
            if (depth > 0) continue;
            if (hasWord(code.slice(index), "catch")) return after;
            return null;
        }
    }
    return null;
}

/**
 * Whether a line stands on this function's **own frame**, rather than inside a closure written in
 * it. `getFunctionBodies` reads a body by brace depth, so a listener, a method of a returned
 * object and a step handed to a clock all come back as lines of whoever wrote them — and a walk
 * that took them for calls made here would say the add-on reaches, while standing up, everything
 * it will ever do. A closure is entered by whoever holds it, and **E12** guards that handover.
 */
export function getOwnLines(body: readonly string[]): boolean[] {
    const own = body.map(() => true);
    for (const [at, line] of body.entries()) {
        if (at === 0) continue;
        if (isCommentLine(line)) continue;
        if (!isClosureOpener(getCodeOutsideStrings(line))) continue;
        const closed = getCloseOfBlock(body, at);
        for (let inside = at + 1; inside < closed; inside += 1) own[inside] = false;
    }
    return own;
}

/**
 * The name a caller reaches a closure under, or nothing where it has none. `const held = () => {`,
 * `read(key: string): string | null {` and `handlePayload: (payload) => {` are the three shapes
 * this tree writes one in; an arrow handed straight to a call has no name and needs none.
 */
export function getClosureName(code: string): string {
    const trimmed = code.trim();
    if (trimmed.startsWith("const ")) return getFirstWordOf(trimmed.slice("const ".length));
    const named = getFirstWordOf(trimmed);
    if (named.length === 0) return "";
    const after = trimmed.charAt(named.length);
    // ⚠️ `keep(fight: KeptFight): void {` declares one and `setGuardedListener(root, (event) => {`
    // calls one, and both open with a name and a bracket. What tells them apart is whether the
    // bracket closed: a declaration's has, and a call handing over an arrow has not.
    if (after === "(") return getBracketDepth(trimmed) === 0 ? named : "";
    if (after !== ":") return "";
    return trimmed.includes("=>") ? named : "";
}

function getBracketDepth(code: string): number {
    let depth = 0;
    for (const character of code) {
        if (character === "(") depth += 1;
        if (character === ")") depth -= 1;
    }
    return depth;
}

function getFirstWordOf(code: string): string {
    let at = 0;
    for (let index = 0; index < code.length; index += 1) {
        if (!isWordCharacter(code.charAt(index))) break;
        at += 1;
    }
    return code.slice(0, at);
}

/** A line opening a body somebody else will enter: an arrow, a method, a nested declaration. */
export function isClosureOpener(code: string): boolean {
    const trimmed = code.trimEnd();
    if (!trimmed.endsWith("{")) return false;
    if (trimmed.includes("=>")) return true;
    if (trimmed.trimStart().startsWith("function ")) return true;
    return trimmed.includes("): ");
}

/**
 * Where the block a line opens closes, by depth. The end of the body where nothing does.
 *
 * ⚠️ **A brace closing something that opened before this line is not this block's.** `} catch (
 * failure) {` leads with the one that closes the `try`, so counting it took the depth to nought
 * on the opening line and every catch body came back one line long — which is a catch body that
 * reaches nothing, and a walk that finds nothing in one.
 */
function getCloseOfBlock(body: readonly string[], at: number): number {
    let depth = 0;
    let isOpened = false;
    for (let after = at; after < body.length; after += 1) {
        const code = getCodeOutsideStrings(body[after] ?? "");
        for (let index = 0; index < code.length; index += 1) {
            if (code.charAt(index) === "{") {
                depth += 1;
                isOpened = true;
            }
            if (code.charAt(index) !== "}") continue;
            if (!isOpened) continue;
            depth -= 1;
            if (depth <= 0) return after;
        }
    }
    return body.length - 1;
}

export function getGuardedLines(body: readonly string[]): boolean[] {
    const guarded = body.map(() => false);
    for (const [at, line] of body.entries()) {
        if (isCommentLine(line)) continue;
        if (!hasWord(getCodeOutsideStrings(line), "try")) continue;
        const closed = getCloseOfTry(body, at);
        if (closed === null) continue;
        for (let inside = at + 1; inside < closed; inside += 1) guarded[inside] = true;
    }
    return guarded;
}

/** Every plain name called on this line. A method is `getCalledMethods`', and resolves wider. */
export function getCalledNames(code: string): string[] {
    return getCallsOn(code, false);
}

/**
 * Every method called on this line. **What object it stands on is nobody's to say here**, so the
 * graph resolves one to every closure of that name in the bundle — `store.read(…)` reaches both
 * stores, and a guard that over-reaches errs where a safety guard should.
 */
export function getCalledMethods(code: string): string[] {
    return getCallsOn(code, true);
}

function getCallsOn(code: string, wanted: boolean): string[] {
    const found: string[] = [];
    for (let at = 0; at < code.length; at += 1) {
        if (code.charAt(at) !== "(") continue;
        let start = at;
        for (let back = 0; back < at; back += 1) {
            if (!isWordCharacter(code.charAt(start - 1))) break;
            start -= 1;
        }
        const name = code.slice(start, at);
        if (name.length === 0) continue;
        if (NOT_A_CALL.includes(name)) continue;
        // ⚠️ **A spread wears a dot too.** `...composeGameReports(environment)` read as a method
        // of somebody, so a plain call this graph can resolve was left unresolved instead.
        const isDotted = start > 0 && code.charAt(start - 1) === ".";
        const isSpread = start > 1 && code.charAt(start - 2) === ".";
        if ((isDotted && !isSpread) !== wanted) continue;
        found.push(name);
    }
    return found;
}

/** The name a part of an import list is bound to here: `type X`, `X as Y`, or `X`. */
function getBoundName(part: string): string {
    const words = part.trim().split(" ").filter((one) => one.length > 0);
    return words[words.length - 1] ?? "";
}

/** `import { a, b as c, type D } from "@/x/y.ts";`, wrapped over as many lines as it takes. */
export function getImportedNames(text: string): Map<string, string> {
    const found = new Map<string, string>();
    let held = "";
    for (const line of text.split("\n")) {
        if (held === "") {
            if (!line.startsWith("import ")) continue;
        }
        held = held === "" ? line : `${held} ${line.trim()}`;
        const from = held.indexOf('from "');
        if (from === -1) continue;
        const path = held.slice(from + 6, held.indexOf('"', from + 6));
        const opened = held.indexOf("{");
        const shut = held.indexOf("}");
        const stated = held;
        held = "";
        if (opened === -1) continue;
        if (shut < opened) continue;
        if (!path.startsWith("@/")) continue;
        for (const part of stated.slice(opened + 1, shut).split(",")) {
            const name = getBoundName(part);
            if (name.length > 0) found.set(name, path.slice(2));
        }
    }
    return found;
}

/**
 * Every `catch` body written inside a function. **A throw in one escapes**: it is not inside the
 * `try` it belongs to, and the frame under it is whoever the boundary was protecting — the game's
 * own update call, a dispatch loop, the browser's timer. So each is walked like an entry of its
 * own, because that is what it is.
 */
/** What a `catch` binds its failure to, so a line handing it back reads as the rethrow it is. */
export function getCaughtName(code: string): string {
    const at = code.indexOf("catch (");
    if (at === -1) return "";
    const closed = code.indexOf(")", at);
    if (closed === -1) return "";
    return code.slice(at + "catch (".length, closed).trim();
}

export function getCatchBodies(body: readonly string[]): string[][] {
    const found: string[][] = [];
    for (const [at, line] of body.entries()) {
        if (isCommentLine(line)) continue;
        const code = getCodeOutsideStrings(line);
        if (!hasWord(code, "catch")) continue;
        if (!code.trimEnd().endsWith("{")) continue;
        found.push(body.slice(at, getCloseOfBlock(body, at) + 1));
    }
    return found;
}

/** Every closure written inside a body, by the name a caller reaches it under. */
export function getNamedClosures(body: readonly string[]): Map<string, string[]> {
    const found = new Map<string, string[]>();
    for (const [at, line] of body.entries()) {
        if (at === 0) continue;
        if (isCommentLine(line)) continue;
        const code = getCodeOutsideStrings(line);
        if (!isClosureOpener(code)) continue;
        const name = getClosureName(code);
        if (name.length === 0) continue;
        if (found.has(name)) continue;
        found.set(name, body.slice(at, getCloseOfBlock(body, at) + 1));
    }
    return found;
}

/** Every closure name a file writes, to the node or nodes it stands for. */
function composeClosureIndex(
    path: string,
    bodies: ReadonlyMap<string, string[]>,
): Map<string, string[]> {
    const index = new Map<string, string[]>();
    for (const [name, body] of bodies) {
        for (const inner of getNamedClosures(body).keys()) {
            const held = index.get(inner) ?? [];
            held.push(`${path}#${name}.${inner}`);
            index.set(inner, held);
        }
    }
    return index;
}

/** Every function and every named closure the bundle carries, by `path#name`. */
export function composeCallGraph(): Map<string, SourceFunction> {
    const graph = new Map<string, SourceFunction>();
    for (const path of getSourcePaths()) {
        if (!BUNDLED_ROOTS.some((root) => path.startsWith(root))) continue;
        const text = Deno.readTextFileSync(path);
        const imported = getImportedNames(text);
        const bodies = getFunctionBodies(text);
        const closures = composeClosureIndex(path, bodies);
        for (const [name, body] of bodies) {
            const compose = (lines: readonly string[]) =>
                composeSourceFunction(lines, path, bodies, imported, closures);
            graph.set(`${path}#${name}`, compose(body));
            for (const [inner, lines] of getNamedClosures(body)) {
                graph.set(`${path}#${name}.${inner}`, compose(lines));
            }
            for (const [at, lines] of getCatchBodies(body).entries()) {
                graph.set(`${path}#${name}!catch${at}`, compose(lines));
            }
        }
    }
    assert(graph.size > 0, "there are functions in the bundle to walk");
    assert(graph.size <= MAXIMUM_FUNCTIONS, "and no more of them than the walk is bounded to");
    return graph;
}

function composeSourceFunction(
    body: readonly string[],
    path: string,
    bodies: ReadonlyMap<string, string[]>,
    imported: ReadonlyMap<string, string>,
    closures: ReadonlyMap<string, string[]>,
): SourceFunction {
    const guarded = getGuardedLines(body);
    const own = getOwnLines(body);
    const reaches: string[] = [];
    const methods: string[] = [];
    const caught = getCaughtName(body[0] ?? "");
    let throws = false;
    let isRethrowing = false;
    for (const [at, line] of body.entries()) {
        if (isCommentLine(line)) continue;
        const code = getCodeOutsideStrings(line);
        if (own[at] === true) {
            if (hasWord(code, "throw")) throws = true;
            if (hasWord(code, "assert")) throws = true;
            if (caught.length > 0) {
                if (code.includes(`throw ${caught}`)) isRethrowing = true;
            }
        }
        if (guarded[at] === true) continue;
        if (own[at] !== true) continue;
        // A closure's opener line names it and calls nothing: without this, `keep(fight): void {`
        // read as `composeShelfKeeper` calling the `keep` it merely declares, and the walk went
        // through every method of every object this file returns. **Asked only of a line that
        // opens one**, because `countFailure(failure);` is a call and balances its brackets too.
        const declared = isClosureOpener(code) ? getClosureName(code) : "";
        for (const name of getCalledNames(code)) {
            if (name === declared) continue;
            if (bodies.has(name)) reaches.push(`${path}#${name}`);
            const held = imported.get(name);
            if (held !== undefined) reaches.push(`${held}#${name}`);
            // A closure is called by the name it was written under, and `getFunctionBodies` keeps
            // only what a file declares at its margin — so without this a `catch` handing its
            // failure to a counter beside it reaches nothing at all.
            for (const inner of closures.get(name) ?? []) reaches.push(inner);
        }
        for (const name of getCalledMethods(code)) {
            if (name === declared) continue;
            methods.push(name);
        }
    }
    return { throws, isRethrowing, reaches, methods };
}

/**
 * Where the walk starts: the add-on standing up, and every `catch` body in the bundle.
 *
 * **A catch that hands back what it caught is not one of them.** `decodeOneMessage` catches its own
 * format error and rethrows anything else, which is **E4** narrowing a catch rather than standing a
 * boundary — the boundary is whoever called it, and this walk reaches that one from its own entry.
 */
function getEntries(graph: ReadonlyMap<string, SourceFunction>): string[] {
    const found = [ENTRY];
    for (const [name, held] of graph) {
        if (!name.includes("!catch")) continue;
        if (held.isRethrowing) continue;
        found.push(name);
    }
    return found;
}

/** Everything an entry reaches with no `try` between, which is what may never throw. */
export function getUnguardedReach(graph: ReadonlyMap<string, SourceFunction>): string[] {
    const entries = getEntries(graph);
    const seen = new Set<string>(entries);
    const left = [...entries];
    for (let step = 0; step < MAXIMUM_FUNCTIONS; step += 1) {
        const held = left.pop();
        if (held === undefined) break;
        for (const name of graph.get(held)?.reaches ?? []) {
            if (seen.has(name)) continue;
            seen.add(name);
            left.push(name);
        }
    }
    assert(left.length === 0, "the walk finished inside the bound it states");
    return [...seen];
}

export function getCrossings(graph: ReadonlyMap<string, SourceFunction>): string[] {
    const found = new Set<string>();
    for (const name of getUnguardedReach(graph)) {
        for (const method of graph.get(name)?.methods ?? []) found.add(`${method} ← ${name}`);
    }
    return [...found].sort();
}
