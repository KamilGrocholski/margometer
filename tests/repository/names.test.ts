/**
 * N1 and N10: file names are kebab-case and name their contents; exported functions are
 * camelCase and exported types PascalCase. N21: no identifier carries the word `Game`, which named
 * the game whichever way it was reached; `Margonem…` and its channel say both.
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
/** N21's retired word, in both spellings a name here takes. */
const RETIRED_WORDS = ["Game", "GAME"];
const WORD_JOINER = "_";

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
    const suffix = FILE_SUFFIXES.find((candidate) => name.endsWith(candidate));
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
    const misnamed: string[] = [];
    for (const exported of readAstNodes(file, ["ExportNamedDeclaration"])) {
        const declaration = exported.declaration;
        if (declaration === null) continue;
        if (declaration === undefined) continue;
        const place = formatNodePlace(file, exported);
        const name = declaration.id?.name;
        if (declaration.type === "FunctionDeclaration") {
            if (name !== undefined) {
                if (!isCamelCase(name)) misnamed.push(`${place} function ${name}`);
            }
        }
        if (TYPE_NODES.includes(declaration.type)) {
            if (name !== undefined) {
                if (!isPascalCase(name)) misnamed.push(`${place} type ${name}`);
            }
        }
        for (const declarator of declaration.declarations ?? []) {
            const initType = declarator.init?.type ?? "";
            if (initType !== "ArrowFunctionExpression") continue;
            const bound = declarator.id?.name ?? "";
            if (!isCamelCase(bound)) misnamed.push(`${place} function ${bound}`);
        }
    }
    return misnamed;
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

Deno.test("a name holding the word Game is flagged, and a lower-case key or a string is not", () => {
    const sample = composeSample([
        "const initGamePlace = 1;",
        "const GAME_KEYS = [];",
        "class StoreGame {}",
        "const record = { gameBuild: 1 };",
        "const gameplay = 2;",
        'const text = "GameValue";',
        "// GameValue in a comment",
        "const MargonemEnginePlace = 3;",
    ]);
    const flagged = [
        "sample.ts:1 initGamePlace",
        "sample.ts:2 GAME_KEYS",
        "sample.ts:3 StoreGame",
    ];
    assertEquals(lookupRetiredWords(sample), flagged, "and the rest are not");
    assertEquals(readNameWords("HTMLGame2Value"), ["HTML", "Game2", "Value"], "an acronym ends");
});

function lookupRetiredWords(file: SourceFile): string[] {
    const retired: string[] = [];
    for (const identifier of readAstNodes(file, ["Identifier"])) {
        const name = identifier.name ?? "";
        const words = readNameWords(name);
        if (!words.some((word) => RETIRED_WORDS.includes(word))) continue;
        retired.push(`${formatNodePlace(file, identifier)} ${name}`);
    }
    return retired;
}

/** The words of a name: split at `_`, and where an upper-case letter opens a word. */
function readNameWords(name: string): string[] {
    const words: string[] = [];
    let word = "";
    for (let index = 0; index < name.length; index += 1) {
        const character = name.charAt(index);
        const isBreak = character === WORD_JOINER;
        if (isBreak || isWordStartAt(name, index)) {
            if (word !== "") words.push(word);
            word = "";
        }
        if (!isBreak) word += character;
    }
    if (word !== "") words.push(word);
    return words;
}

/** An upper-case letter after a lower-case one or a digit, or the last of a run before one. */
function isWordStartAt(name: string, index: number): boolean {
    if (index === 0) return false;
    if (!isUpperAt(name, index)) return false;
    if (isLowerOrDigitAt(name, index - 1)) return true;
    if (!isUpperAt(name, index - 1)) return false;
    return isLowerAt(name, index + 1);
}

Deno.test("every file and name in the tree is as N1, N10 and N21 ask", () => {
    const files = readSourceFiles(SOURCE_DIRECTORIES);
    assertEquals(files.flatMap((file) => lookupMisnamedFile(file.path)), [], "N10");
    assertEquals(files.flatMap(lookupMisnamedExports), [], "N1");
    assertEquals(files.flatMap(lookupRetiredWords), [], "N21");
});
