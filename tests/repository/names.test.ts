/**
 * N1 and N10: file names are kebab-case and name their contents; exported functions are
 * camelCase and exported types PascalCase.
 */

import { assertEquals } from "@std/assert";
import {
    composeSample,
    formatNodePlace,
    readAstNodes,
    readSourceFiles,
    SOURCE_DIRECTORIES,
    type SourceFile,
} from "#/tests/source-tree.ts";
import { isDigitAt } from "#/libs/text-walk.ts";

/** Named for their category rather than their contents (N10). */
const CATEGORY_STEMS = ["utils", "helpers", "common", "misc", "index"];
const TYPE_NODES = ["TSTypeAliasDeclaration", "TSInterfaceDeclaration", "ClassDeclaration"];
const FILE_SUFFIXES = [".test.ts", ".spec.ts", ".ts"];

Deno.test("a file named for its category or out of kebab-case is flagged", () => {
    assertEquals(lookupMisnamedFile("libs/utils.ts"), ["libs/utils.ts names a category"], "N10");
    assertEquals(lookupMisnamedFile("src/index.ts"), ["src/index.ts names a category"], "N10");
    const camel = ["libs/numberText.ts is not kebab-case"];
    assertEquals(lookupMisnamedFile("libs/numberText.ts"), camel, "camelCase");
    const snake = ["libs/number_text.ts is not kebab-case"];
    assertEquals(lookupMisnamedFile("libs/number_text.ts"), snake, "snake_case");
    const doubled = ["libs/number--text.ts is not kebab-case"];
    assertEquals(lookupMisnamedFile("libs/number--text.ts"), doubled, "an empty word");
});

function lookupMisnamedFile(path: string): string[] {
    const name = path.slice(path.lastIndexOf("/") + 1);
    const suffix = FILE_SUFFIXES.find((one) => name.endsWith(one));
    if (suffix === undefined) return [`${path} is not a module`];
    const stem = name.slice(0, name.length - suffix.length);
    if (CATEGORY_STEMS.includes(stem)) return [`${path} names a category`];
    if (!isKebabCase(stem)) return [`${path} is not kebab-case`];
    return [];
}

/** Lower-case words of letters and digits, joined by one hyphen each. */
function isKebabCase(stem: string): boolean {
    const words = stem.split("-");
    for (const word of words) {
        if (!isLowerAt(word, 0)) return false;
        if (!isEveryCharacter(word, isLowerOrDigitAt)) return false;
    }
    return true;
}

function isLowerAt(text: string, index: number): boolean {
    const character = text.charAt(index);
    if (character < "a") return false;
    return character <= "z";
}

function isEveryCharacter(text: string, isMember: (text: string, index: number) => boolean) {
    for (let index = 0; index < text.length; index += 1) {
        if (!isMember(text, index)) return false;
    }
    return true;
}

function isLowerOrDigitAt(text: string, index: number): boolean {
    if (isLowerAt(text, index)) return true;
    return isDigitAt(text, index);
}

Deno.test("a kebab-case module and its test pass", () => {
    assertEquals(lookupMisnamedFile("libs/number-text.ts"), [], "a module");
    assertEquals(lookupMisnamedFile("tests/libs/number-text.test.ts"), [], "and its test");
    assertEquals(lookupMisnamedFile("src/core/protocol-message2.ts"), [], "a digit is a letter");
});

Deno.test("an exported function out of camelCase and a type out of PascalCase are flagged", () => {
    const sample = composeSample([
        "export function ParseText() {}",
        "export const read_text = () => 1;",
        "export interface fightView {}",
        "export type fight_file = number;",
        "export function parseText() {}",
        "export const readText = () => 1;",
        "export interface FightView {}",
        "export const ROWS_MAXIMUM = 1;",
    ]);
    const flagged = [
        "sample.ts:1 function ParseText",
        "sample.ts:2 function read_text",
        "sample.ts:3 type fightView",
        "sample.ts:4 type fight_file",
    ];
    assertEquals(lookupMisnamedExports(sample), flagged, "and the right spellings are not");
});

function lookupMisnamedExports(file: SourceFile): string[] {
    const found: string[] = [];
    for (const node of readAstNodes(file, ["ExportNamedDeclaration"])) {
        const declaration = node.declaration;
        if (declaration === null) continue;
        if (declaration === undefined) continue;
        const place = formatNodePlace(file, node);
        const name = declaration.id?.name;
        if (declaration.type === "FunctionDeclaration") {
            if (name !== undefined) {
                if (!isCamelCase(name)) found.push(`${place} function ${name}`);
            }
        }
        if (TYPE_NODES.includes(declaration.type)) {
            if (name !== undefined) {
                if (!isPascalCase(name)) found.push(`${place} type ${name}`);
            }
        }
        for (const declarator of declaration.declarations ?? []) {
            const initType = declarator.init?.type ?? "";
            if (initType !== "ArrowFunctionExpression") continue;
            const bound = declarator.id?.name ?? "";
            if (!isCamelCase(bound)) found.push(`${place} function ${bound}`);
        }
    }
    return found;
}

function isCamelCase(name: string): boolean {
    if (!isLowerAt(name, 0)) return false;
    return isEveryCharacter(name, isAlphanumericAt);
}

function isAlphanumericAt(text: string, index: number): boolean {
    if (isLowerAt(text, index)) return true;
    if (isUpperAt(text, index)) return true;
    return isDigitAt(text, index);
}

function isUpperAt(text: string, index: number): boolean {
    const character = text.charAt(index);
    if (character < "A") return false;
    return character <= "Z";
}

function isPascalCase(name: string): boolean {
    if (!isUpperAt(name, 0)) return false;
    return isEveryCharacter(name, isAlphanumericAt);
}

Deno.test("every file in the tree is named as N1 and N10 ask", () => {
    const files = readSourceFiles(SOURCE_DIRECTORIES);
    assertEquals(files.flatMap((file) => lookupMisnamedFile(file.path)), [], "N10");
    assertEquals(files.flatMap(lookupMisnamedExports), [], "N1");
});
