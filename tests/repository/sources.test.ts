/**
 * Every TypeScript file, against the rules a machine can count.
 *
 * C5, S4 and S5 were measured by hand on the one source file this tree had, and the hand
 * measurement found S5 broken. This holds them from the first line of every file that
 * follows. Text is walked, not matched — C7.
 */

import {
    assert,
    assertArrayIncludes,
    assertEquals,
    assertStrictEquals,
    assertStringIncludes,
} from "@std/assert";
import {
    countCallsOutsideStrings,
    getCodeOutsideStrings,
    isCommentLine,
} from "@/tests/source-line.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";

/**
 * `assertExists(` holds no `assert(` inside it, so a counter that knows one name reads the other
 * as nothing and S5 measures the spelling instead of the assertion. A9 chooses among these.
 */
const ASSERTION_CALLS = [
    "assert",
    "assertEquals",
    "assertThrows",
    "assertExists",
    "assertStrictEquals",
    "assertNotStrictEquals",
    "assertInstanceOf",
    "assertStringIncludes",
    "assertArrayIncludes",
];
const MAXIMUM_FUNCTION_LINES = 70;
const MAXIMUM_COMMENT_SHARE = 25;
const MAXIMUM_DIRECTORY_SHARE = 22;
const MINIMUM_ASSERTION_DENSITY = 2;
/** The directories that hold the program and the tools that build it, which is what C16 binds. */
const SHIPPED_ROOTS = ["libs/", "project/", "src/", "tools/"];
/** One line said twice is a citation; a block said twice is an essay with two copies. */
const MINIMUM_REPEATED_LINES = 2;
/** More blocks than any tree this repository will hold, so the count stays a stated bound. */
const MAXIMUM_COMMENT_BLOCKS = 4096;
/** A declaration wrapped over more lines than this is a signature nobody can read anyway. */
const MAXIMUM_DECLARATION_LINES = 12;

interface SourceReading {
    lines: number;
    commentLines: number;
    functions: number;
    assertions: number;
    longestFunctionLines: number;
    longestFunctionAt: number;
}

/** A declaration, not a callback: `function`, a named arrow, or a test. */
function isDeclarationOpener(line: string): boolean {
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
function getBlockOpenedAt(lines: readonly string[], from: number): number | null {
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

/**
 * The lines a file holds. A file ends in a newline, so splitting on one leaves an empty tail
 * that is not a line — counting it divided every share by one line more than the file had, and
 * `src/game/game-dictionary.ts` sat over C5 at 26% reading as 25%. Measured 2026-08-30.
 */
function getHeldLines(lines: readonly string[]): number {
    assert(lines.length > 0, "a file read as text is at least one line");
    if (lines[lines.length - 1] === "") return lines.length - 1;
    return lines.length;
}

/**
 * What closes a declaration, by the kind that opened it.
 *
 * ⚠️ **A tool that writes JavaScript writes the closing lines of somebody else's code too.**
 * Closing on any `});` at the margin ended `composePreviewPicks` inside the template it composes:
 * measured 2026-08-30, the guard read 68 lines where `tools/preview-page.ts` holds 88.
 */
function getClosingLine(opener: string): string {
    const trimmed = opener.trimStart();
    assert(trimmed.length > 0, "a declaration that opens a block says something");
    if (trimmed.startsWith("Deno.test(")) return "});";
    if (trimmed.startsWith("const ") || trimmed.startsWith("export const ")) return "};";
    return "}";
}

function getSourceReading(path: string): SourceReading {
    const lines = Deno.readTextFileSync(path).split("\n");
    const reading: SourceReading = {
        lines: getHeldLines(lines),
        commentLines: 0,
        functions: 0,
        assertions: 0,
        longestFunctionLines: 0,
        longestFunctionAt: 0,
    };
    let openedAt = -1;
    let closing = "";
    for (const [offset, line] of lines.entries()) {
        if (isCommentLine(line)) reading.commentLines += 1;
        reading.assertions += countCallsOutsideStrings(line, ASSERTION_CALLS);
        // The declaration is measured from the line that names it, and it counts only where a
        // block opens: the brace is what says there is a body to measure.
        const isOpener = openedAt === -1 && isDeclarationOpener(line) &&
            getBlockOpenedAt(lines, offset) !== null;
        if (isOpener) {
            reading.functions += 1;
            openedAt = offset;
            closing = getClosingLine(line);
        } else if (openedAt !== -1 && line === closing) {
            const length = offset - openedAt + 1;
            if (length > reading.longestFunctionLines) {
                reading.longestFunctionLines = length;
                reading.longestFunctionAt = openedAt + 1;
            }
            openedAt = -1;
        }
    }
    assert(reading.commentLines <= reading.lines, "a comment line is a line");
    assert(reading.longestFunctionLines <= reading.lines, "a function fits inside its file");
    assert(reading.functions <= reading.lines, "a function opener is a line");
    assertStrictEquals(openedAt, -1, "every function opened is closed");
    assert(reading.longestFunctionAt <= reading.lines, "a line number is inside the file");
    return reading;
}

function getReadings(): Map<string, SourceReading> {
    const paths = getSourcePaths();
    const readings = new Map(paths.map((path) => [path, getSourceReading(path)]));
    assert(readings.size > 0, "there is TypeScript to measure");
    assertStrictEquals(readings.size, paths.length, "each path is read once");
    assert([...readings.values()].every((one) => one.lines > 0), "an empty file is a finding");
    return readings;
}

Deno.test("no file is more than a quarter comment", () => {
    assertEquals(getHeldLines("one\ntwo\n".split("\n")), 2, "a closing newline ends a line");
    assertEquals(getHeldLines("one\ntwo".split("\n")), 2, "a file without one holds them too");

    const over: string[] = [];
    for (const [path, reading] of getReadings()) {
        const share = Math.floor((reading.commentLines * 100) / reading.lines);
        if (share > MAXIMUM_COMMENT_SHARE) over.push(`${path} at ${share}%`);
    }
    assert(MAXIMUM_COMMENT_SHARE > 0, "the ceiling is a real bound");
    assertEquals(over, [], "C5: a file past a quarter comment is an ADR that was not written");
});

function isShippedPath(path: string): boolean {
    assert(path.length > 0, "a path being placed is a path");
    return SHIPPED_ROOTS.some((root) => path.startsWith(root));
}

/** The directory a file sits in, which is the unit C16 counts over. */
function getDirectoryOfPath(path: string): string {
    assertStringIncludes(path, "/", "a source path names a directory before its file");
    let at = 0;
    for (let offset = 0; offset < path.length; offset += 1) {
        if (path.charAt(offset) === "/") at = offset;
    }
    assert(at > 0, "and the directory is not the empty name");
    return path.slice(0, at);
}

Deno.test("no directory of the program is past its own share of comment", () => {
    assertStrictEquals(
        getDirectoryOfPath("src/ui/panel-look.ts"),
        "src/ui",
        "the reader places a file",
    );
    assertStrictEquals(
        getDirectoryOfPath("src/userscript-entry.ts"),
        "src",
        "including one at a root",
    );
    assert(isShippedPath("tools/build-preview.ts"), "a tool ships");
    assert(!isShippedPath("tests/repository/sources.test.ts"), "a guard does not");

    const lines = new Map<string, number>();
    const comment = new Map<string, number>();
    for (const [path, reading] of getReadings()) {
        if (!isShippedPath(path)) continue;
        const directory = getDirectoryOfPath(path);
        lines.set(directory, (lines.get(directory) ?? 0) + reading.lines);
        comment.set(directory, (comment.get(directory) ?? 0) + reading.commentLines);
    }
    assert(lines.size > 0, "there are directories to measure");
    const over: string[] = [];
    for (const [directory, held] of lines) {
        const share = Math.floor(((comment.get(directory) ?? 0) * 100) / held);
        if (share > MAXIMUM_DIRECTORY_SHARE) over.push(`${directory} at ${share}%`);
    }
    assert(MAXIMUM_DIRECTORY_SHARE < MAXIMUM_COMMENT_SHARE, "a directory is bound below a file");
    assertEquals(over, [], "C16: a directory writing comment up to the ceiling C5 leaves it");
});

/** Every comment block in a file: a run of `//` lines, or one delimited block, indentation off. */
function getCommentBlocks(text: string): string[] {
    const blocks: string[] = [];
    let held: string[] = [];
    let isInsideBlock = false;
    for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (isInsideBlock) {
            held.push(trimmed);
            if (!trimmed.includes("*/")) continue;
            blocks.push(held.join("\n"));
            held = [];
            isInsideBlock = false;
            continue;
        }
        if (trimmed.startsWith("//")) {
            held.push(trimmed);
            continue;
        }
        if (held.length > 0) blocks.push(held.join("\n"));
        held = [];
        if (!trimmed.startsWith("/*")) continue;
        held.push(trimmed);
        if (!trimmed.includes("*/")) isInsideBlock = true;
        else {
            blocks.push(held.join("\n"));
            held = [];
        }
    }
    if (held.length > 0) blocks.push(held.join("\n"));
    assert(blocks.length <= MAXIMUM_COMMENT_BLOCKS, "a file holds no more blocks than that");
    return blocks;
}

/** The blocks of more than one line that stand in more than one place. */
function getRepeatedBlocks(blocks: readonly string[]): string[] {
    assert(blocks.length <= MAXIMUM_COMMENT_BLOCKS, "no more blocks than the stated bound");
    const seen = new Map<string, number>();
    for (const block of blocks) {
        if (block.split("\n").length < MINIMUM_REPEATED_LINES) continue;
        seen.set(block, (seen.get(block) ?? 0) + 1);
    }
    const repeated: string[] = [];
    for (const [block, count] of seen) {
        if (count > 1) repeated.push(block.split("\n")[0] ?? "");
    }
    assert(repeated.length <= seen.size, "no more repeats than there are blocks");
    return repeated;
}

/**
 * The blocks standing in more than one **file**, whatever their length.
 *
 * `getRepeatedBlocks` skips a one-line block because one line said twice inside a file is a
 * citation. Across two files it is not: it is one fact with two copies to keep true, and it was
 * invisible here until this. Found by measuring — a bound on how many combatants a fight holds
 * stood word for word in three files, and a tool's docblock in two.
 */
function getBlocksInTwoFiles(byPath: ReadonlyMap<string, readonly string[]>): string[] {
    assert(byPath.size > 0, "there are files to read blocks out of");
    const where = new Map<string, Set<string>>();
    for (const [path, blocks] of byPath) {
        for (const block of blocks) {
            const held = where.get(block) ?? new Set<string>();
            held.add(path);
            where.set(block, held);
        }
    }
    const shared: string[] = [];
    for (const [block, paths] of where) {
        if (paths.size > 1) shared.push(`${block.split("\n")[0] ?? ""} — ${[...paths].join(", ")}`);
    }
    assert(shared.length <= where.size, "no more shared blocks than there are blocks");
    return shared.sort();
}

Deno.test("a comment block standing in two files is one fact with two copies", () => {
    const sample = new Map<string, string[]>([
        ["one.ts", ["/** said once. */", "// twice"]],
        ["other.ts", ["/** said once. */"]],
    ]);
    assertEquals(getBlocksInTwoFiles(sample).length, 1, "the reader finds the shared block");
    // The sample it must not flag: the same line twice inside one file, which is a citation.
    const cited = new Map<string, string[]>([["one.ts", ["// twice", "// twice"]]]);
    assertEquals(getBlocksInTwoFiles(cited), [], "and a line cited twice in one file is not one");

    const byPath = new Map<string, string[]>();
    for (const path of getSourcePaths()) {
        if (!isShippedPath(path)) continue;
        byPath.set(path, getCommentBlocks(Deno.readTextFileSync(path)));
    }
    assertEquals(getBlocksInTwoFiles(byPath), [], "C15: a block standing in two files");
});

Deno.test("a comment block written twice is a finding", () => {
    const twice = "// one\n// two\ncall();\n// one\n// two\ncall();";
    assertEquals(getRepeatedBlocks(getCommentBlocks(twice)).length, 1, "the reader finds a repeat");

    const apart = "// one\n// two\ncall();\n// three\n// four\ncall();";
    assertEquals(getRepeatedBlocks(getCommentBlocks(apart)), [], "and does not find what is not");

    const single = "// one\ncall();\n// one\ncall();";
    assertEquals(getRepeatedBlocks(getCommentBlocks(single)), [], "one line said twice is a cite");

    const found: string[] = [];
    for (const path of getSourcePaths()) {
        if (!isShippedPath(path)) continue;
        for (const block of getCommentBlocks(Deno.readTextFileSync(path))) found.push(block);
    }
    assert(found.length > 0, "there is comment in the program to read");
    assertEquals(getRepeatedBlocks(found), [], "C15: a comment block standing in two places");
});

Deno.test("no function runs past seventy lines", () => {
    assertEquals(getClosingLine("function compose(): string {"), "}", "a body closes on a brace");
    assertEquals(getClosingLine('Deno.test("a name", () => {'), "});", "a test closes on its call");
    assertEquals(getClosingLine("const read = ("), "};", "and a named arrow on an assignment");

    const over: string[] = [];
    for (const [path, reading] of getReadings()) {
        if (reading.longestFunctionLines > MAXIMUM_FUNCTION_LINES) {
            over.push(`${path}:${reading.longestFunctionAt} at ${reading.longestFunctionLines}`);
        }
    }
    assert(MAXIMUM_FUNCTION_LINES > 0, "the limit is a real bound");
    assertEquals(over, [], "S4: a function longer than a page");
});

Deno.test("assertion density averages two per function where the program is", () => {
    let assertions = 0;
    let functions = 0;
    for (const [path, reading] of getReadings()) {
        if (path.startsWith("tests/")) continue;
        assertions += reading.assertions;
        functions += reading.functions;
    }
    assertStrictEquals(MINIMUM_ASSERTION_DENSITY, 2, "S5 states two");
    if (functions === 0) return;
    const density = assertions / functions;
    assert(
        density >= MINIMUM_ASSERTION_DENSITY,
        `S5: ${density.toFixed(2)} assertions per function across ${functions} functions`,
    );
});

Deno.test("the guards carry their own density, reported and not enforced", () => {
    let assertions = 0;
    let functions = 0;
    for (const [path, reading] of getReadings()) {
        if (!path.startsWith("tests/")) continue;
        assertions += reading.assertions;
        functions += reading.functions;
    }
    assert(functions > 0, "there are guards to read");
    assert(assertions > functions, "a guard that asserts less than once per function is suspect");
});

/**
 * The blind spot a wider list opens: a name the counter does not know reads as no assertion, and
 * a name it knows too loosely reads as one where a group of ours holds several.
 */
Deno.test("the counter sees every assertion the library ships, and no group of our own", () => {
    assertArrayIncludes(ASSERTION_CALLS, ["assert"], "the plain one is still counted");
    assertEquals(
        countCallsOutsideStrings('    assertExists(row, "a row was drawn");', ASSERTION_CALLS),
        1,
        "an assertion named for what it checks counts once",
    );
    assertEquals(
        countCallsOutsideStrings("    assertNotStrictEquals(one, other);", ASSERTION_CALLS),
        1,
        "and the longest name is not read as the shorter one inside it",
    );
    assertEquals(
        countCallsOutsideStrings("    assertPinnedTotalsTheFight(one, two, three);", []),
        0,
        "a group of ours is not an assertion whatever the counter is asked for",
    );
    assertEquals(
        countCallsOutsideStrings("    assertWholeIsTheSide(whole, sides, part);", ASSERTION_CALLS),
        0,
        "and holding several assertions still counts as none of them",
    );
});

/** The roots the bundle carries. `project/` runs beside the tools that read it and is not one. */
const BUNDLED_ROOTS = ["libs/", "src/"];
/** Every name in the list but the plain one, which is the only one A10 admits where it ships. */
const REPORTING_ASSERTIONS = ASSERTION_CALLS.filter((name) => name !== "assert");

/** `countCallsOutsideStrings` reads one line: a quote it never closes swallows the file. */
function getNamesSpelled(path: string, names: readonly string[]): Set<string> {
    const found = new Set<string>();
    for (const line of Deno.readTextFileSync(path).split("\n")) {
        for (const name of names) {
            if (countCallsOutsideStrings(line, [name]) > 0) found.add(name);
        }
    }
    return found;
}

Deno.test("what the bundle carries asserts with the plain one and no other", () => {
    assert(REPORTING_ASSERTIONS.length > 0, "there are names to look for");
    const spelled: string[] = [];
    for (const path of getSourcePaths()) {
        if (!BUNDLED_ROOTS.some((root) => path.startsWith(root))) continue;
        for (const name of getNamesSpelled(path, REPORTING_ASSERTIONS)) {
            spelled.push(`${path}: ${name}`);
        }
    }
    assertEquals(spelled.sort(), [], "A10: a reporting assertion in what a reader installs");
    // Proved the other way as well: a reader that has stopped finding its subject would call an
    // empty list a clean tree, and this one has to find the names where they are written.
    const guards = getNamesSpelled("tests/repository/sources.test.ts", REPORTING_ASSERTIONS);
    assert(guards.has("assertEquals"), "and it still finds one where one stands");
});

/** C9 over the list itself: a name nothing spells is a name that could only inflate S5. */
Deno.test("every assertion the counter knows is one this tree writes", () => {
    const spelled = new Set<string>();
    for (const path of getSourcePaths()) {
        for (const name of getNamesSpelled(path, ASSERTION_CALLS)) spelled.add(name);
    }
    assert(spelled.size > 0, "there are assertions to find");
    const unspelled = ASSERTION_CALLS.filter((name) => !spelled.has(name));
    assertEquals(unspelled, [], "a name the counter knows that nothing in the tree writes");
});

Deno.test("the readers know a declaration from a callback", () => {
    assert(isCommentLine("  // why this is here"), "a comment is recognised");
    assert(!isCommentLine("const rate = a / b;"), "division is not a comment");

    assert(isDeclarationOpener("function getFightStatistics(): void {"), "a declaration");
    assert(isDeclarationOpener("const readSector = (at: number) => {"), "a named arrow");
    assert(!isDeclarationOpener("    items.filter((one) => one > 0);"), "a callback is not one");
    // The opener is a prefilter and says only that a declaration might start here; whether one
    // does is the block's answer, because a `const` and a `(` are not yet a function.
    assertEquals(
        getBlockOpenedAt(["const total = (a + b) * 2;"], 0),
        null,
        "an expression that never reaches an arrow opens no function",
    );
});

/** The blind spot that was, and the false positive beside it. Both were pinned; both are gone. */
Deno.test("a declaration is read across the lines it takes, and by the brace that ends it", () => {
    const wrapped = ["const readSector = (", "    at: number,", ") => {"];
    assert(isDeclarationOpener(wrapped[0] ?? ""), "the line that names it is a declaration");
    assertEquals(getBlockOpenedAt(wrapped, 0), 2, "and the block it opens is two lines down");

    const expression = ["const readSector = (at: number) => at + 1;", "", "function next() {"];
    assert(isDeclarationOpener(expression[0] ?? ""), "an expression-bodied arrow declares one too");
    assertEquals(getBlockOpenedAt(expression, 0), null, "and opens no block, so nothing counts it");

    const plain = ["function readSector(at: number): number {"];
    assertEquals(getBlockOpenedAt(plain, 0), 0, "a declaration and its brace on one line");
});

/**
 * The damage the false positive did, from the other end: an expression-bodied arrow swallowed the
 * declaration after it, so a call to the swallowed one read as a call to itself.
 */
Deno.test("an arrow with no block never collects the declaration standing after it", () => {
    const text =
        "const name = () => 1;\n\nfunction walk(at: number): number {\n    return name();\n}";
    const bodies = getFunctionBodies(text);
    assert(!bodies.has("name"), "the arrow has no body to collect");
    assert(bodies.has("walk"), "and the declaration after it is its own");
    assertEquals(
        (bodies.get("walk") ?? []).some((line) => line.includes("name(")),
        true,
        "which calls the arrow rather than itself",
    );
});

/** Each declared function with the lines of its body, by brace depth. */
export function getFunctionBodies(text: string): Map<string, string[]> {
    const bodies = new Map<string, string[]>();
    const lines = text.split("\n");
    let name = "";
    let depth = 0;
    let body: string[] = [];
    for (const [offset, line] of lines.entries()) {
        if (name === "" && isDeclarationOpener(line) && getBlockOpenedAt(lines, offset) !== null) {
            name = getDeclaredName(line);
            depth = 0;
            body = [];
        }
        if (name === "") continue;
        depth += countOutside(line, "{") - countOutside(line, "}");
        body.push(line);
        if (depth <= 0 && body.length > 1) {
            if (name !== "") bodies.set(name, body);
            name = "";
        }
    }
    assert(bodies.size <= lines.length, "no more functions than lines");
    assert(![...bodies.keys()].includes(""), "an unnamed body is never stored");
    return bodies;
}

function countOutside(line: string, character: string): number {
    const code = getCodeOutsideStrings(line);
    let count = 0;
    for (const one of code) {
        if (one === character) count += 1;
    }
    return count;
}

function getDeclaredName(line: string): string {
    const code = getCodeOutsideStrings(line).trimStart();
    for (const opener of ["export function ", "function ", "const ", "export const "]) {
        if (!code.startsWith(opener)) continue;
        const rest = code.slice(opener.length);
        let end = 0;
        while (end < rest.length && (isNameCharacter(rest.charAt(end)))) end += 1;
        return rest.slice(0, end);
    }
    return "";
}

function isNameCharacter(character: string): boolean {
    return (character >= "a" && character <= "z") || (character >= "A" && character <= "Z") ||
        (character >= "0" && character <= "9") || character === "_";
}

Deno.test("no function calls itself, directly or through another", () => {
    const selfCalling = "function walk(at: number): void {\n    walk(at + 1);\n}";
    const bodies = getFunctionBodies(selfCalling);
    assert(bodies.has("walk"), "the reader found the declaration");
    assert((bodies.get("walk") ?? []).some((line) => line.includes("walk(")), "and its own call");

    const plain = "function once(): number {\n    return 1;\n}";
    const plainBody = getFunctionBodies(plain).get("once") ?? [];
    assert(
        !plainBody.some((line) => line.trim().startsWith("once(")),
        "a plain body calls nothing",
    );

    const bodiesByName = new Map<string, string[]>();
    for (const path of getSourcePaths()) {
        for (const [name, lines] of getFunctionBodies(Deno.readTextFileSync(path))) {
            bodiesByName.set(name, lines);
        }
    }
    assert(bodiesByName.size > 10, "the walk found the declarations it should have");

    const calls = new Map<string, Set<string>>();
    for (const [name, lines] of bodiesByName) {
        const reached = new Set<string>();
        for (const line of lines.slice(1)) {
            const code = getCodeOutsideStrings(line);
            for (const other of bodiesByName.keys()) {
                if (code.includes(`${other}(`)) reached.add(other);
            }
        }
        calls.set(name, reached);
    }

    const selfReaching: string[] = [];
    for (const [name, reached] of calls) {
        const pending = [...reached];
        const seen = new Set<string>();
        let steps = 0;
        while (pending.length > 0) {
            const next = pending.pop();
            if (next === undefined) break;
            steps += 1;
            assert(steps <= 4096, "the call graph walk stays inside its bound");
            if (next === name) {
                selfReaching.push(name);
                break;
            }
            if (seen.has(next)) continue;
            seen.add(next);
            for (const further of calls.get(next) ?? []) pending.push(further);
        }
    }
    assertEquals(selfReaching, [], "S1: a function that reaches itself");
});

/** A `while` is bounded by its condition, or by an assertion standing at the head of its body. */
/** The condition as written, however many lines `deno fmt` wrapped it across. */
function getLoopCondition(lines: string[], at: number): string {
    let condition = "";
    let depth = 0;
    for (let ahead = 0; ahead <= 6; ahead += 1) {
        const line = getCodeOutsideStrings(lines[at + ahead] ?? "");
        condition += line;
        for (const character of line) {
            if (character === "(") depth += 1;
            if (character === ")") depth -= 1;
        }
        if (ahead > 0 && depth <= 0) break;
        if (depth === 0 && condition.includes(")")) break;
    }
    assertStringIncludes(condition, "while", "the reader was handed a loop");
    assert(condition.length > 0, "a condition is never empty");
    return condition;
}

function isBoundedLoop(lines: string[], at: number): boolean {
    const condition = getLoopCondition(lines, at);
    if (condition.includes(".length")) return true;
    for (let ahead = 1; ahead <= 3; ahead += 1) {
        const line = lines[at + ahead] ?? "";
        if (line.includes("assert(") && line.includes("bound")) return true;
    }
    return false;
}

Deno.test("every loop is bounded by its condition or by an assertion", () => {
    const bounded = ["while (index < text.length) {", "  rest"];
    assert(isBoundedLoop(bounded, 0), "a length in the condition bounds the loop");
    const asserted = ["while (more) {", '    assert(n <= max, "stays inside its bound");'];
    assert(isBoundedLoop(asserted, 0), "an assertion at the head bounds the loop");
    const wrapped = ["while (", "    end < rest.length &&", ") {"];
    assert(isBoundedLoop(wrapped, 0), "a condition the formatter wrapped is still a condition");
    const neither = ["while (index !== -1) {", "    index = next(index);"];
    assert(!isBoundedLoop(neither, 0), "a scan on indexOf bounds nothing by itself");

    const unbounded: string[] = [];
    for (const path of getSourcePaths()) {
        const lines = Deno.readTextFileSync(path).split("\n");
        for (const [offset, line] of lines.entries()) {
            if (!getCodeOutsideStrings(line).includes("while (")) continue;
            if (!isBoundedLoop(lines, offset)) unbounded.push(`${path}:${offset + 1}`);
        }
    }
    assertEquals(unbounded, [], "S2: a loop a checker cannot prove terminates");
});

/** The specifier of an `import … from "…"` line, or the empty string. */
function getImportSpecifier(line: string): string {
    const code = line.trimStart();
    if (!code.startsWith("import ")) return "";
    const from = code.indexOf(' from "');
    if (from === -1) return "";
    const start = from + ' from "'.length;
    const end = code.indexOf('"', start);
    if (end === -1) return "";
    const specifier = code.slice(start, end);
    assert(!specifier.includes('"'), "a specifier stops at its closing quote");
    assertStrictEquals(
        specifier.length,
        end - start,
        "the slice is the specifier and nothing else",
    );
    return specifier;
}

Deno.test("every import is written from the repository root", () => {
    assertEquals(
        getImportSpecifier('import { a } from "@/tests/source-line.ts";'),
        "@/tests/source-line.ts",
        "the reader works",
    );
    assertEquals(getImportSpecifier("const near = 1;"), "", "a plain statement is not an import");

    const relative: string[] = [];
    for (const path of getSourcePaths()) {
        for (const [offset, line] of Deno.readTextFileSync(path).split("\n").entries()) {
            const specifier = getImportSpecifier(line);
            if (specifier.startsWith(".")) relative.push(`${path}:${offset + 1} → ${specifier}`);
        }
    }
    assert(getSourcePaths().length > 0, "there is TypeScript to read");
    assertEquals(relative, [], "C8: an import that reads differently depending on where it sits");
});

/**
 * The globals `ui/` must not reach for. `document` is deliberately absent: it is the name of the
 * parameter every function there takes, which is the whole of the discipline.
 */
const BROWSER_GLOBALS = [
    "window",
    "globalThis",
    "navigator",
    "location",
    "localStorage",
    "sessionStorage",
    "XMLHttpRequest",
    "fetch",
];

/** A line holds no more occurrences than characters, which is where S2's bound comes from. */
function hasBareName(code: string, name: string): boolean {
    let at = code.indexOf(name);
    let looked = 0;
    while (at !== -1) {
        looked += 1;
        assert(looked <= code.length + 1, "the walk stays inside its stated bound");
        const before = at === 0 ? "" : code.charAt(at - 1);
        const after = code.charAt(at + name.length);
        if (!isNameCharacter(before)) {
            if (!isNameCharacter(after)) return true;
        }
        at = code.indexOf(name, at + 1);
    }
    return false;
}

Deno.test("the panel reaches for no browser global, and takes its document as an argument", () => {
    assert(hasBareName("const a = window.x;", "window"), "the reader finds a bare name");
    assert(!hasBareName("const shown = windowless;", "window"), "and not one inside another");
    assert(isCommentLine(" * the window's height"), "a docblock line is prose, not code");

    const reaching: string[] = [];
    for (const path of getSourcePaths()) {
        if (!path.startsWith("src/ui/")) continue;
        for (const [offset, line] of Deno.readTextFileSync(path).split("\n").entries()) {
            if (isCommentLine(line)) continue;
            const code = getCodeOutsideStrings(line);
            for (const global of BROWSER_GLOBALS) {
                if (!hasBareName(code, global)) continue;
                reaching.push(`${path}:${offset + 1} → ${global}`);
            }
        }
    }
    assert(getSourcePaths().some((path) => path.startsWith("src/ui/")), "there is a panel to read");
    assertEquals(reaching, [], "the panel's surface stays declared rather than ambient");
});

/** The barrel, spelled as an import writes it. `@std/assert/assert` does not contain this. */
const ASSERTION_BARREL = '"@std/assert"';

/** Whole text rather than a line: `deno fmt` wraps an import list, never a string literal. */
function isImportingAssertionBarrel(text: string): boolean {
    assert(ASSERTION_BARREL.length > 0, "there is a specifier to look for");
    assert(!"@std/assert/assert".includes(ASSERTION_BARREL), "and the module path is not it");
    return text.includes(ASSERTION_BARREL);
}

Deno.test("what the bundle carries imports the assertion by module path", () => {
    assert(BUNDLED_ROOTS.length > 0, "there are roots that ship");
    const spelled: string[] = [];
    for (const path of getSourcePaths()) {
        if (!BUNDLED_ROOTS.some((root) => path.startsWith(root))) continue;
        if (isImportingAssertionBarrel(Deno.readTextFileSync(path))) spelled.push(path);
    }
    assertEquals(spelled.sort(), [], "A10: the barrel imported where the bundle reaches");
    // Both ways, because a reader that has stopped finding its subject calls every tree clean.
    assert(isImportingAssertionBarrel('import { assert } from "@std/assert";'), "it finds one");
    assert(
        !isImportingAssertionBarrel('import { assert } from "@std/assert/assert";'),
        "and the module path is not read as the barrel it starts with",
    );
});
