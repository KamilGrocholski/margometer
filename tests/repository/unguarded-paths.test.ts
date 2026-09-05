/**
 * **E14's own half: no path from outside reaches something that throws.** The other guards read a
 * file — nothing in `src/ui/` asserts, every handover opens on a `try`. This one reads the
 * **path**, which is what the rule says, and it is the reader `ARCHITECTURE.md` said was missing.
 *
 * The walk starts at `startFromUserscriptWindow`, not at `startFromWindow`: the outer `try` there
 * is a last resort, and starting above it would make every guarantee under it vacuous. Every other
 * way in is a callback, and **E12** holds those to opening on a `try`.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { getCodeOutsideStrings, isCommentLine } from "@/tests/source-line.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";
import { getFunctionBodies } from "@/tests/repository/sources.test.ts";

/** What the browser runs. `project/` and `tools/` are not in it, and neither are their throws. */
const BUNDLED_ROOTS = ["libs/", "src/"];
const ENTRY = "src/userscript-entry.ts#startFromUserscriptWindow";
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
    /** Only what is called where no `try` stands over it: the walk follows nothing else. */
    reaches: string[];
    /** The same, for calls whose object nothing here can resolve. */
    methods: string[];
}

function isWordCharacter(character: string): boolean {
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
    if (after === "(") return named;
    if (after !== ":") return "";
    return trimmed.includes("=>") ? named : "";
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

/** Where the block a line opens closes, by depth. The end of the body where nothing does. */
function getCloseOfBlock(body: readonly string[], at: number): number {
    let depth = 0;
    for (let after = at; after < body.length; after += 1) {
        const code = getCodeOutsideStrings(body[after] ?? "");
        for (let index = 0; index < code.length; index += 1) {
            if (code.charAt(index) === "{") depth += 1;
            if (code.charAt(index) !== "}") continue;
            depth -= 1;
            if (depth <= 0) return after;
        }
    }
    return body.length;
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

/** Every function and every named closure the bundle carries, by `path#name`. */
function composeCallGraph(): Map<string, SourceFunction> {
    const graph = new Map<string, SourceFunction>();
    for (const path of getSourcePaths()) {
        if (!BUNDLED_ROOTS.some((root) => path.startsWith(root))) continue;
        const text = Deno.readTextFileSync(path);
        const imported = getImportedNames(text);
        const bodies = getFunctionBodies(text);
        for (const [name, body] of bodies) {
            graph.set(`${path}#${name}`, composeSourceFunction(body, path, bodies, imported));
            for (const [inner, lines] of getNamedClosures(body)) {
                graph.set(
                    `${path}#${name}.${inner}`,
                    composeSourceFunction(lines, path, bodies, imported),
                );
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
): SourceFunction {
    const guarded = getGuardedLines(body);
    const own = getOwnLines(body);
    const reaches: string[] = [];
    const methods: string[] = [];
    let throws = false;
    for (const [at, line] of body.entries()) {
        if (isCommentLine(line)) continue;
        const code = getCodeOutsideStrings(line);
        if (own[at] === true) {
            if (hasWord(code, "throw")) throws = true;
            if (hasWord(code, "assert")) throws = true;
        }
        if (guarded[at] === true) continue;
        if (own[at] !== true) continue;
        for (const name of getCalledNames(code)) {
            if (bodies.has(name)) reaches.push(`${path}#${name}`);
            const held = imported.get(name);
            if (held !== undefined) reaches.push(`${held}#${name}`);
        }
        for (const name of getCalledMethods(code)) methods.push(name);
    }
    return { throws, reaches, methods };
}

/** Everything the entry reaches with no `try` between, which is what may never throw. */
function getUnguardedReach(graph: ReadonlyMap<string, SourceFunction>): string[] {
    const seen = new Set<string>([ENTRY]);
    const left = [ENTRY];
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

Deno.test("a `try` covers what stands inside it, and a `finally` covers nothing", () => {
    const caught = ["function f() {", "    try {", "        a();", "    } catch {", "    }", "}"];
    assertEquals(getGuardedLines(caught), [false, false, true, false, false, false], "a catch");
    const swept = ["function f() {", "    try {", "        a();", "    } finally {", "    }", "}"];
    assertEquals(getGuardedLines(swept), [false, false, false, false, false, false], "a finally");
});

Deno.test("a call is a name before a bracket, and a method is nobody's to resolve", () => {
    assertEquals(getCalledNames("    return compose(one);"), ["compose"], "a plain call");
    assertEquals(getCalledNames("    if (held.read(key)) return;"), [], "a method, and a keyword");
    assertEquals(
        getCalledNames("    return one(two(three));"),
        ["one", "two"],
        "and a nested pair",
    );
});

Deno.test("an import binds the name it is written under, however it is wrapped", () => {
    const wrapped = 'import {\n    one,\n    two as three,\n    type Four,\n} from "@/src/a.ts";';
    const found = getImportedNames(wrapped);
    assertStrictEquals(found.get("one"), "src/a.ts", "a plain name");
    assertStrictEquals(found.get("three"), "src/a.ts", "the name a renaming binds");
    assertStrictEquals(found.get("four"), undefined, "and a type by the name it is written under");
    assertStrictEquals(found.get("Four"), "src/a.ts", "which is the one after the keyword");
    assertStrictEquals(getImportedNames('import { x } from "@std/assert";').size, 0, "ours only");
});

/**
 * The walk itself. A path this finds is a frame the browser can reach with nothing standing over
 * it, and something on that frame that can stop the add-on — **E14**, **ADR 0051**.
 */
Deno.test("nothing the add-on reaches while standing up can stop it", () => {
    const graph = composeCallGraph();
    assert(graph.has(ENTRY), "the entry this walks from is a function that exists");
    const throwing: string[] = [];
    for (const name of getUnguardedReach(graph)) {
        if (graph.get(name)?.throws === true) throwing.push(name);
    }
    assertEquals(throwing.sort(), [], "E14: a throw on a frame the browser reaches unguarded");
});

/**
 * ⚠️ **What object a method stands on is not this reader's to say**, so a call through one draws
 * no edge and the walk would step over it in silence. Every one standing on a frame the walk
 * reaches unguarded is written down instead, and the register is read both ways: a crossing that
 * is gone stops being excused, and a new one fails until somebody has looked at it.
 *
 * Three kinds, and every row below is one of them. **The runtime's own** — `Array.isArray`,
 * `Number.isFinite`, `String.slice`, `Date.now` — which are not this program's to guard. **The
 * page's own**, which `isUserscriptWindow` proved was there before anything called it. And
 * **ours, answering for itself**: both stores turn a refusal into an answer (**E5**), the defect
 * keeper asserts nothing (**A11**) and reports inside its own `try`, and `composeShelfStore`
 * reaches `composeStoreForChoice`, which catches the property read as well as the call.
 */
const CROSSINGS_WITH_A_REASON = [
    "add ← src/userscript-entry.ts#readShelfOrNothing",
    "add ← src/userscript-entry.ts#startMargoMeter",
    "clearInterval ← src/userscript-entry.ts#startFromUserscriptWindow",
    "composeShelfStore ← src/userscript-entry.ts#composeShelfKeeper",
    "error ← src/userscript-entry.ts#startFromUserscriptWindow",
    "isArray ← libs/unknown-reading.ts#isRecord",
    "isFinite ← libs/unknown-reading.ts#getNumberFromUnknown",
    "now ← src/userscript-entry.ts#startFromUserscriptWindow",
    "read ← src/userscript-entry.ts#composeShelfKeeper",
    "read ← src/userscript-entry.ts#startMargoMeter",
    "report ← src/userscript-entry.ts#composeGameReports",
    "report ← src/userscript-entry.ts#startMargoMeter",
    "setInterval ← src/userscript-entry.ts#startFromUserscriptWindow",
    "slice ← src/userscript-entry.ts#composeShelfKeeper",
];

function getCrossings(graph: ReadonlyMap<string, SourceFunction>): string[] {
    const found = new Set<string>();
    for (const name of getUnguardedReach(graph)) {
        for (const method of graph.get(name)?.methods ?? []) found.add(`${method} ← ${name}`);
    }
    return [...found].sort();
}

/**
 * The blind spot, named row by row rather than left silent. A row here is a person's judgement and
 * not a machine's, which is what **V1**'s `by-reading` marker is for elsewhere — what the machine
 * holds is that the list is neither short nor long.
 */
Deno.test("every method the walk steps over is one somebody has looked at", () => {
    const crossings = getCrossings(composeCallGraph());
    const excused = [...CROSSINGS_WITH_A_REASON].sort();
    assertEquals(
        crossings.filter((one) => !excused.includes(one)),
        [],
        "a method on an unguarded frame that nobody has judged",
    );
    assertEquals(
        excused.filter((one) => !crossings.includes(one)),
        [],
        "and a row excusing a crossing the walk no longer makes",
    );
});

Deno.test("a spread is not a method, and a method is not a plain call", () => {
    assertEquals(
        getCalledNames("    ...composeGameReports(one),"),
        ["composeGameReports"],
        "a spread",
    );
    assertEquals(
        getCalledMethods("    ...composeGameReports(one),"),
        [],
        "which is nobody's method",
    );
    assertEquals(getCalledMethods("    store.read(key);"), ["read"], "while a method is one");
    assertEquals(getCalledNames("    store.read(key);"), [], "and is not read as a plain call");
});
