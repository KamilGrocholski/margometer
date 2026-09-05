/**
 * The error hierarchy, held before it exists.
 *
 * No error class is written yet, so every walk below finds nothing — which is exactly how a
 * guard passes while checking nothing. Each test therefore carries a **positive control**: a
 * sample it must flag. The sample proves the reader; the walk proves the tree.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { getCodeOutsideStrings, hasOutsideStrings, isCommentLine } from "@/tests/source-line.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";

const ERROR_BASE_FILES = [
    "src/core/margometer-error.ts",
    "tools/margometer-tool-error.ts",
];

const BRANDED_BASES = ["MargoMeterError", "MargoMeterToolError"];

function getLinesExtendingError(text: string): number[] {
    const found: number[] = [];
    for (const [offset, line] of text.split("\n").entries()) {
        if (hasOutsideStrings(line, "extends Error")) found.push(offset + 1);
    }
    assert(found.every((one) => one > 0), "a line number is one-based");
    assert(found.length <= text.length, "a file holds no more lines than characters");
    return found;
}

function getLinesConstructingBareError(text: string): number[] {
    const found: number[] = [];
    for (const [offset, line] of text.split("\n").entries()) {
        if (hasOutsideStrings(line, "new Error(")) found.push(offset + 1);
    }
    assert(found.every((one) => one > 0), "a line number is one-based");
    assert(!found.includes(0), "there is no line zero");
    return found;
}

function getEmptyCatchLines(text: string): number[] {
    const found: number[] = [];
    const lines = text.split("\n");
    for (const [offset, line] of lines.entries()) {
        const code = getCodeOutsideStrings(line).trimEnd();
        if (!code.includes("catch")) continue;
        if (code.endsWith("{}")) found.push(offset + 1);
        else if (code.endsWith("{") && (lines[offset + 1] ?? "").trim() === "}") {
            found.push(offset + 1);
        }
    }
    assert(found.every((one) => one >= 1), "a line number is one-based");
    assert(found.length <= lines.length, "no more findings than lines");
    return found;
}

function getBrandedSubclassNames(text: string): string[] {
    const found: string[] = [];
    for (const line of text.split("\n")) {
        const code = getCodeOutsideStrings(line);
        const classAt = code.indexOf("class ");
        if (classAt === -1) continue;
        if (!BRANDED_BASES.some((base) => code.includes(`extends ${base}`))) continue;
        const name = code.slice(classAt + 6).split(" ")[0] ?? "";
        if (name.length > 0) found.push(name);
    }
    assert(found.every((one) => one.length > 0), "a subclass has a name");
    assert(!found.includes("class"), "the keyword is never the name");
    return found;
}

Deno.test("nothing extends Error outside the two base files", () => {
    const sample = "export class Rogue extends Error {}";
    assertEquals(getLinesExtendingError(sample), [1], "the reader flags its own sample");
    const quoted = 'const label = "extends Error";';
    assertEquals(getLinesExtendingError(quoted), [], "a literal is not a declaration");
    const offenders: string[] = [];
    for (const path of getSourcePaths()) {
        if (ERROR_BASE_FILES.includes(path)) continue;
        for (const line of getLinesExtendingError(Deno.readTextFileSync(path))) {
            offenders.push(`${path}:${line}`);
        }
    }
    assertEquals(offenders, [], "E1: a hierarchy of one is not a hierarchy");
});

Deno.test("nobody throws a bare Error", () => {
    const sample = 'throw new Error("no brand, no code");';
    assertEquals(getLinesConstructingBareError(sample), [1], "the reader flags its own sample");
    assertEquals(getLinesConstructingBareError("// new Error( in prose"), [], "not a comment");
    const offenders: string[] = [];
    for (const path of getSourcePaths()) {
        if (ERROR_BASE_FILES.includes(path)) continue;
        for (const line of getLinesConstructingBareError(Deno.readTextFileSync(path))) {
            offenders.push(`${path}:${line}`);
        }
    }
    assertEquals(offenders, [], "E1: an unbranded error says nothing about whose it is");
});

/** What a reader touches, which E14 binds and A11 holds the other half of. **ADR 0051.** */
const READER_FACING = ["src/ui/", "src/userscript-entry.ts", "src/userscript-boot.ts"];

function getLinesThrowing(text: string): number[] {
    const found: number[] = [];
    for (const [offset, line] of text.split("\n").entries()) {
        // A docblock saying what a throw would cost is not one: four of them stand in this layer,
        // and every one of them is there because the throw was taken out.
        if (isCommentLine(line)) continue;
        if (hasOutsideStrings(line, "throw ")) found.push(offset + 1);
    }
    return found;
}

/**
 * **E14 in part.** That the layer never fails is held by reading; that it never *throws* is not,
 * and it is the half that turns a broken invariant into a panel a reader is left staring at. The
 * other half — every value checked, every call that can throw caught — has no reader yet, and
 * `ARCHITECTURE.md` says so.
 */
Deno.test("what a reader touches throws nothing at all", () => {
    const sample = 'throw new RangeError("a region that will not draw");';
    assertEquals(getLinesThrowing(sample), [1], "the reader flags its own sample");
    assertEquals(getLinesThrowing('const said = "throw a fight";'), [], "a literal is not one");
    assertEquals(getLinesThrowing(" * a throw out of `handle` reaches nobody"), [], "nor is prose");

    const offenders: string[] = [];
    for (const path of getSourcePaths()) {
        if (!READER_FACING.some((one) => path.startsWith(one))) continue;
        for (const line of getLinesThrowing(Deno.readTextFileSync(path))) {
            offenders.push(`${path}:${line}`);
        }
    }
    assertEquals(offenders, [], "E14: a throw where the panel is what somebody is looking at");
});

Deno.test("no catch is empty", () => {
    const sample = "try {\n    read();\n} catch {}";
    assertEquals(getEmptyCatchLines(sample), [3], "the reader flags its own sample");
    const spread = "try {\n    read();\n} catch (failure) {\n}";
    assertEquals(getEmptyCatchLines(spread), [3], "an empty body spread over two lines counts");
    const handled = "try {\n    read();\n} catch (failure) {\n    mark(failure);\n}";
    assertEquals(getEmptyCatchLines(handled), [], "a catch that marks is not empty");
    const offenders: string[] = [];
    for (const path of getSourcePaths()) {
        for (const line of getEmptyCatchLines(Deno.readTextFileSync(path))) {
            offenders.push(`${path}:${line}`);
        }
    }
    assertEquals(offenders, [], "E11: a failure nobody marks is a failure nobody sees");
});

/** `new MargoMeterError(` and its tool twin: the two constructions the rule forbids. */
function getLinesConstructingBase(text: string): number[] {
    const found: number[] = [];
    for (const [offset, line] of text.split("\n").entries()) {
        for (const base of BRANDED_BASES) {
            if (hasOutsideStrings(line, `new ${base}(`)) found.push(offset + 1);
        }
    }
    assert(found.every((one) => one > 0), "a line number is one-based");
    assert(found.length <= text.length, "no more findings than characters");
    return found;
}

Deno.test("no base is ever thrown, and every failure has a class of its own", () => {
    const sample = 'throw new MargoMeterError("ProtocolMessageFormat", reason);';
    assertEquals(getLinesConstructingBase(sample), [1], "the reader flags its own sample");
    const named = "throw new ProtocolMessageFormatError(reason);";
    assertEquals(getLinesConstructingBase(named), [], "a class of its own is not a base");

    const offenders: string[] = [];
    let subclasses = 0;
    for (const path of getSourcePaths()) {
        const text = Deno.readTextFileSync(path);
        subclasses += getBrandedSubclassNames(text).length;
        if (ERROR_BASE_FILES.includes(path)) continue;
        for (const line of getLinesConstructingBase(text)) offenders.push(`${path}:${line}`);
    }
    assert(subclasses > 0, "there are failures, and each of them is a class");
    assertEquals(offenders, [], "E2: a base thrown leaves every catch nothing narrower to name");
});

/**
 * E12: the calls that hand a function of ours to a loop somebody else runs, spelled with the
 * receiver they are reached through. `every` alone would be `Array.prototype.every`, which is
 * ours and runs here — the scheduler's is the one that hands a step to a clock.
 */
const HANDOVER_SPELLINGS = [
    ".addEventListener(",
    ".setTimeout(",
    ".setInterval(",
    "schedule.every(",
];
/** E13's exception: below this line a throw is the mark, and the exit code is what is read. */
const MAIN_OPENER = "if (import.meta.main)";

/** Code with comment and string bodies blanked, every line kept at the length it had. */
function getCodeOfText(text: string): string {
    const kept: string[] = [];
    for (const line of text.split("\n")) {
        const bare = isCommentLine(line) ? "" : getCodeOutsideStrings(line);
        kept.push(bare.padEnd(line.length, " ").slice(0, line.length));
    }
    const code = kept.join("\n");
    assertStrictEquals(code.length, text.length, "blanking leaves every offset where it was");
    return code;
}

function getLineOfOffset(code: string, offset: number): number {
    assert(offset <= code.length, "an offset falls inside the text it is read from");
    let line = 1;
    for (let at = 0; at < offset; at += 1) {
        if (code.charAt(at) === "\n") line += 1;
    }
    return line;
}

/**
 * One call's arguments, from the paren after the name to the one closing it, read across lines.
 * A handover written over four of them is the shape that hid one, so a line at a time is no use.
 */
function getCallArguments(code: string, opensAt: number): string {
    assertStrictEquals(code.charAt(opensAt), "(", "a call's arguments open on a paren");
    let depth = 0;
    let at = opensAt;
    while (at < code.length) {
        const character = code.charAt(at);
        if (character === "(") depth += 1;
        if (character === ")") {
            depth -= 1;
            if (depth === 0) return code.slice(opensAt + 1, at);
        }
        at += 1;
    }
    return "";
}

/** Whether the function handed over opens with the `try` **E12** asks for. */
function isHandoverGuarded(argumentText: string): boolean {
    const arrowAt = argumentText.indexOf("=>");
    if (arrowAt === -1) return true;
    const body = argumentText.slice(arrowAt + 2).trimStart();
    if (!body.startsWith("{")) return false;
    return body.slice(1).trimStart().startsWith("try");
}

function getUnguardedHandovers(text: string): number[] {
    const code = getCodeOfText(text);
    const found: number[] = [];
    for (const spelling of HANDOVER_SPELLINGS) {
        let at = code.indexOf(spelling);
        let steps = 0;
        while (at !== -1) {
            steps += 1;
            assert(steps <= code.length, "the scan stays inside the file's bound");
            const args = getCallArguments(code, at + spelling.length - 1);
            if (!isHandoverGuarded(args)) found.push(getLineOfOffset(code, at));
            at = code.indexOf(spelling, at + spelling.length);
        }
    }
    return found.sort((one, other) => one - other);
}

Deno.test("no callback is handed to somebody else's loop unguarded", () => {
    const bare = "root.addEventListener(PRESS, (event) => {\n    handle(event);\n});";
    assertEquals(getUnguardedHandovers(bare), [1], "the reader flags a bare listener");
    const spread = "schedule.every(\n    () => look(search),\n    250,\n);";
    assertEquals(getUnguardedHandovers(spread), [1], "and one written over four lines");
    const guarded = "root.addEventListener(PRESS, (event) => {\n    try {\n        handle(event);" +
        "\n    } catch (failure) {\n        mark(failure);\n    }\n});";
    assertEquals(getUnguardedHandovers(guarded), [], "a listener opening on a try is guarded");
    const passed = "page.setInterval(step, everyMilliseconds);";
    assertEquals(getUnguardedHandovers(passed), [], "a step already guarded is passed, not made");
    const stated = "    every(step: () => void, everyMilliseconds: number): number;";
    assertEquals(getUnguardedHandovers(stated), [], "an interface states a step, it hands none");
    const ours = 'assert(found.every((one) => one.name.length > 0), "each is named");';
    assertEquals(
        getUnguardedHandovers(ours),
        [],
        "a walk of our own runs in this loop, not theirs",
    );

    const found: string[] = [];
    for (const path of getSourcePaths()) {
        if (!path.startsWith("src/")) continue;
        for (const line of getUnguardedHandovers(Deno.readTextFileSync(path))) {
            found.push(`${path}:${line}`);
        }
    }
    assertEquals(found, [], "E12: a failure unwinding into a loop nobody here runs");
});

function hasTopLevelComma(argumentText: string): boolean {
    let depth = 0;
    for (let at = 0; at < argumentText.length; at += 1) {
        const character = argumentText.charAt(at);
        if ("([{".includes(character)) depth += 1;
        if (")]}".includes(character)) depth -= 1;
        if (character === "," && depth === 0) return true;
    }
    return false;
}

/** One statement from the line it opens on, joined until the semicolon closing it. */
function getStatementFrom(lines: readonly string[], startsAt: number): string {
    let joined = "";
    let depth = 0;
    for (let at = startsAt; at < lines.length; at += 1) {
        const code = getCodeOutsideStrings(lines[at] ?? "");
        joined += code;
        for (let index = 0; index < code.length; index += 1) {
            const character = code.charAt(index);
            if (character === "(") depth += 1;
            if (character === ")") depth -= 1;
        }
        if (depth === 0) {
            if (code.trimEnd().endsWith(";")) return joined;
        }
    }
    return joined;
}

/** A rejection is read where `.then` is handed a second function, which is what `catch` is. */
function isRejectionRead(statement: string): boolean {
    const thenAt = statement.indexOf(".then(");
    if (thenAt === -1) return false;
    return hasTopLevelComma(getCallArguments(statement, thenAt + ".then".length));
}

function getFloatingPromiseLines(text: string): number[] {
    const lines = text.split("\n");
    const found: number[] = [];
    for (const [offset, line] of lines.entries()) {
        if (hasOutsideStrings(line, MAIN_OPENER)) return found;
        if (isCommentLine(line)) continue;
        if (!getCodeOutsideStrings(line).trimStart().startsWith("void ")) continue;
        const statement = getStatementFrom(lines, offset);
        // A `void` over a plain value is S7's explicit discard; only a call answers a promise.
        if (!statement.includes("(")) continue;
        if (!isRejectionRead(statement)) found.push(offset + 1);
    }
    assert(found.every((one) => one > 0), "a line number is one-based");
    return found;
}

Deno.test("no promise is left with its rejection unread", () => {
    const dropped = "    void readFileEvents(watcher, state);";
    assertEquals(getFloatingPromiseLines(dropped), [1], "the reader flags a discarded promise");
    const half = "    void state.readBundle().then((script) => {\n        set(script);\n    });";
    assertEquals(getFloatingPromiseLines(half), [1], "and one told only how it went right");
    const read = "    void state.readBundle().then(\n        (script) => set(script),\n" +
        "        (failure: unknown) => mark(failure),\n    );";
    assertEquals(getFloatingPromiseLines(read), [], "a second function is where a rejection lands");
    const loud = `${MAIN_OPENER} {\n    void preview.stop();\n}`;
    assertEquals(getFloatingPromiseLines(loud), [], "E7 is the mark below the entry line");
    const discarded = "    void refusal;";
    assertEquals(getFloatingPromiseLines(discarded), [], "a value discarded is not a promise");

    const found: string[] = [];
    for (const path of getSourcePaths()) {
        if (!path.startsWith("tools/")) continue;
        for (const line of getFloatingPromiseLines(Deno.readTextFileSync(path))) {
            found.push(`${path}:${line}`);
        }
    }
    assertEquals(found, [], "E13: a promise discarded is a failure discarded");
});
