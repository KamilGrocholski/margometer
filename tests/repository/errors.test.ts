/**
 * The error hierarchy, held before it exists.
 *
 * No error class is written yet, so every walk below finds nothing — which is exactly how a
 * guard passes while checking nothing. Each test therefore carries a **positive control**: a
 * sample it must flag. The sample proves the reader; the walk proves the tree.
 */

import { assert, assertEquals } from "@std/assert";
import { getCodeOutsideStrings, hasOutsideStrings } from "@/tests/source-line.ts";
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

Deno.test("every branded subclass is named by a catch", () => {
    const sample = "export class ProtocolMessageFormatError extends MargoMeterError {}";
    assertEquals(getBrandedSubclassNames(sample), ["ProtocolMessageFormatError"], "reader works");
    const plain = "class Plain extends Error {}";
    assertEquals(getBrandedSubclassNames(plain), [], "an unbranded class is not a subclass here");
    const declared = new Map<string, string>();
    let mentioned = "";
    for (const path of getSourcePaths()) {
        const text = Deno.readTextFileSync(path);
        for (const name of getBrandedSubclassNames(text)) declared.set(name, path);
        mentioned += text;
    }
    const dead = [...declared].filter(([name]) => !mentioned.includes(`instanceof ${name}`));
    assertEquals(dead, [], "E2: a subclass no catch names is a naming convention, not a type");
});
