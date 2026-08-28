/**
 * Every TypeScript file, against the three rules a machine can count.
 *
 * C5, S4 and S5 were measured by hand on the one source file this tree had, and the hand
 * measurement found S5 broken. This holds them from the first line of every file that
 * follows. Text is walked, not matched — C7.
 */

import { assert, assertEquals } from "@std/assert";
import { countCallsOutsideStrings, getCodeOutsideStrings } from "@/tests/source-line.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";

const COMMENT_OPENERS = ["//", "/*", "*/", "*"];
const ASSERTION_CALLS = ["assert", "assertEquals", "assertThrows"];
const MAXIMUM_FUNCTION_LINES = 70;
const MAXIMUM_COMMENT_SHARE = 25;
const MINIMUM_ASSERTION_DENSITY = 2;

interface SourceReading {
    lines: number;
    commentLines: number;
    functions: number;
    assertions: number;
    longestFunctionLines: number;
    longestFunctionAt: number;
}

function isCommentLine(line: string): boolean {
    const trimmed = line.trimStart();
    return COMMENT_OPENERS.some((opener) => trimmed.startsWith(opener));
}

/** A declaration, not a callback: `function`, a named arrow, or a test. */
function isFunctionOpener(line: string): boolean {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("function ") || trimmed.startsWith("export function ")) return true;
    if (trimmed.startsWith("Deno.test(")) return true;
    const isNamedArrow = (trimmed.startsWith("const ") || trimmed.startsWith("export const ")) &&
        (trimmed.includes(" = (") || trimmed.includes(" = async ("));
    return isNamedArrow && trimmed.includes("=>");
}

function getSourceReading(path: string): SourceReading {
    const lines = Deno.readTextFileSync(path).split("\n");
    const reading: SourceReading = {
        lines: lines.length,
        commentLines: 0,
        functions: 0,
        assertions: 0,
        longestFunctionLines: 0,
        longestFunctionAt: 0,
    };
    let openedAt = -1;
    for (const [offset, line] of lines.entries()) {
        if (isCommentLine(line)) reading.commentLines += 1;
        reading.assertions += countCallsOutsideStrings(line, ASSERTION_CALLS);
        if (isFunctionOpener(line)) {
            reading.functions += 1;
            openedAt = offset;
        } else if (openedAt !== -1 && (line === "}" || line === "});")) {
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
    assert(openedAt === -1, "every function opened is closed");
    assert(reading.longestFunctionAt <= reading.lines, "a line number is inside the file");
    return reading;
}

function getReadings(): Map<string, SourceReading> {
    const paths = getSourcePaths();
    const readings = new Map(paths.map((path) => [path, getSourceReading(path)]));
    assert(readings.size > 0, "there is TypeScript to measure");
    assert(readings.size === paths.length, "each path is read once");
    assert([...readings.values()].every((one) => one.lines > 0), "an empty file is a finding");
    return readings;
}

Deno.test("no file is more than a quarter comment", () => {
    const over: string[] = [];
    for (const [path, reading] of getReadings()) {
        const share = Math.floor((reading.commentLines * 100) / reading.lines);
        if (share > MAXIMUM_COMMENT_SHARE) over.push(`${path} at ${share}%`);
    }
    assert(MAXIMUM_COMMENT_SHARE > 0, "the ceiling is a real bound");
    assertEquals(over, [], "C5: a file past a quarter comment is an ADR that was not written");
});

Deno.test("no function runs past seventy lines", () => {
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
    assert(MINIMUM_ASSERTION_DENSITY === 2, "P10 rule 5 states two");
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

Deno.test("the readers know a declaration from a callback", () => {
    assert(isCommentLine("  // why this is here"), "a comment is recognised");
    assert(!isCommentLine("const rate = a / b;"), "division is not a comment");

    assert(isFunctionOpener("function getFightStatistics(): void {"), "a declaration");
    assert(isFunctionOpener("const readSector = (at: number) => {"), "a named arrow");
    assert(!isFunctionOpener("    items.filter((one) => one > 0);"), "a callback is not one");
    assert(!isFunctionOpener("const total = (a + b) * 2;"), "an expression is not one");
});

Deno.test("a declaration whose arrow is on the next line is not yet counted", () => {
    const wrapped = "const readSector = (\n    at: number,\n) => {";
    const first = wrapped.split("\n")[0] ?? "";
    assert(!isFunctionOpener(first), "the known limit, pinned so it cannot drift unnoticed");
    assert(first.includes("=>") === false, "the arrow is what the reader needs and does not have");
});

/** Each declared function with the lines of its body, by brace depth. */
export function getFunctionBodies(text: string): Map<string, string[]> {
    const bodies = new Map<string, string[]>();
    const lines = text.split("\n");
    let name = "";
    let depth = 0;
    let body: string[] = [];
    for (const line of lines) {
        if (name === "" && isFunctionOpener(line)) {
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
    assert(condition.includes("while"), "the reader was handed a loop");
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
    assert(specifier.length === end - start, "the slice is the specifier and nothing else");
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
