/**
 * The names this repository chooses, in the shapes N1 and N11 require.
 *
 * Every reader is proved on a sample before it is let near the tree, because a naming guard
 * over seven files of one author's code would otherwise pass by having nothing to find.
 */

import { assert, assertEquals } from "@std/assert";
import { basename } from "@std/path";
import { getCodeOutsideStrings } from "@/tests/source-line.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";

const FORBIDDEN_NAMES = ["utils", "helpers", "common", "misc", "index"];
const TYPE_KEYWORDS = ["interface", "type", "class", "enum"];

function isLowerLetter(character: string): boolean {
    return character >= "a" && character <= "z";
}

function isUpperLetter(character: string): boolean {
    return character >= "A" && character <= "Z";
}

function isKebabCase(name: string): boolean {
    for (const character of name) {
        const allowed = isLowerLetter(character) || (character >= "0" && character <= "9") ||
            character === "-" || character === ".";
        if (!allowed) return false;
    }
    return name.length > 0 && !name.startsWith("-");
}

/** The identifier that follows a keyword on an exported declaration, or the empty string. */
function getExportedName(line: string, keyword: string): string {
    const code = getCodeOutsideStrings(line).trimStart();
    const opener = `export ${keyword} `;
    if (!code.startsWith(opener)) return "";
    const rest = code.slice(opener.length);
    let end = 0;
    while (
        end < rest.length && (isLowerLetter(rest[end] ?? "") || isUpperLetter(rest[end] ?? ""))
    ) {
        end += 1;
    }
    const name = rest.slice(0, end);
    assert(!name.includes(" "), "a name is one word");
    assert(name.length <= rest.length, "a name fits inside its line");
    return name;
}

function getExportedNames(text: string, keyword: string): string[] {
    const found: string[] = [];
    for (const line of text.split("\n")) {
        const name = getExportedName(line, keyword);
        if (name.length > 0) found.push(name);
    }
    assert(found.every((one) => one.length > 0), "an empty name is never collected");
    assert(new Set(found).size <= found.length, "duplicates are kept, not silently dropped");
    return found;
}

Deno.test("every file name is kebab-case and names its contents", () => {
    assert(isKebabCase("fight-decoder.ts"), "the reader accepts what it should");
    assert(!isKebabCase("fightDecoder.ts"), "the reader rejects camelCase");
    const wrong: string[] = [];
    for (const path of getSourcePaths()) {
        const name = basename(path);
        const stem = name.slice(0, name.indexOf("."));
        if (!isKebabCase(name)) wrong.push(`${path} is not kebab-case`);
        if (FORBIDDEN_NAMES.includes(stem)) wrong.push(`${path} names a category, not contents`);
    }
    assertEquals(wrong, [], "N1 and N11");
});

Deno.test("every exported function is camelCase", () => {
    assertEquals(getExportedNames("export function getFightStatistics(", "function"), [
        "getFightStatistics",
    ], "the reader works");
    assertEquals(getExportedNames("function local() {", "function"), [], "unexported is skipped");
    const wrong: string[] = [];
    for (const path of getSourcePaths()) {
        for (const name of getExportedNames(Deno.readTextFileSync(path), "function")) {
            if (!isLowerLetter(name.charAt(0))) wrong.push(`${path}: ${name}`);
            if (name.includes("_")) wrong.push(`${path}: ${name} carries an underscore`);
        }
    }
    assertEquals(wrong, [], "N1: a function is camelCase");
});

Deno.test("every exported type is PascalCase", () => {
    assertEquals(getExportedNames("export interface CombatantSnapshot {", "interface"), [
        "CombatantSnapshot",
    ], "the reader works");
    const wrong: string[] = [];
    for (const path of getSourcePaths()) {
        const text = Deno.readTextFileSync(path);
        for (const keyword of TYPE_KEYWORDS) {
            for (const name of getExportedNames(text, keyword)) {
                if (!isUpperLetter(name.charAt(0))) wrong.push(`${path}: ${keyword} ${name}`);
            }
        }
    }
    assertEquals(wrong, [], "N1: a type is PascalCase");
});
