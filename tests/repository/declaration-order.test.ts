/**
 * C1: a module reads top-down in TigerBeetle's order — its imports, its types, its constants, then
 * its functions — and a function nobody outside calls stands under the first function that calls
 * it, before the next exported one. A constant a type is derived from stands with the types.
 */

import { assert, assertEquals } from "@std/assert";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import {
    type AstNode,
    composeSample,
    getLineAt,
    readAstNodes,
    readSourceFiles,
    SOURCE_DIRECTORIES,
    type SourceFile,
} from "#/tests/source-tree.ts";

const SECTION = {
    imports: "imports",
    types: "types",
    constants: "constants",
    functions: "functions",
} as const;
type Section = VocabularyWord<typeof SECTION>;

/** One declaration at the top of a module, as the order reads it. */
interface TopItem {
    name: string;
    section: Section;
    isExported: boolean;
    isFunction: boolean;
    range: [number, number];
}

const SECTION_RANKS: { readonly [Kind in Section]: number } = {
    [SECTION.imports]: 0,
    [SECTION.types]: 1,
    [SECTION.constants]: 2,
    [SECTION.functions]: 3,
};
const TYPE_NODES = ["TSInterfaceDeclaration", "TSTypeAliasDeclaration"];
const IMPORT_NODES = ["ImportDeclaration", "ExportAllDeclaration"];
const ITEMS_MAXIMUM = 400;
const TYPEOF_OPENER = "typeof ";
const CASE_OPENER = "Deno.test(";

Deno.test("a constant above a type, and a function above a constant, are flagged", () => {
    const sample = composeSample([
        'import { a } from "./a.ts";',
        "const LIMIT = 1;",
        "interface Late { a: number }",
        "function first(): number { return LIMIT; }",
        "const TOO_LATE = 2;",
    ]);
    assertEquals(lookupDeclarationsOutOfOrder(sample), [
        "sample.ts:3 Late stands with the types but after LIMIT, which is one of the constants",
        "sample.ts:5 TOO_LATE stands with the constants but after first, which is one of the " +
        "functions",
    ], "each is named once, against the declaration it stands after");
});

function lookupDeclarationsOutOfOrder(file: SourceFile): string[] {
    const items = readTopItems(file);
    return [
        ...lookupSectionsOutOfOrder(file, items),
        ...lookupHelpersOutOfPlace(file, items),
    ];
}

/** The module's top-level declarations, in the order they stand. */
function readTopItems(file: SourceFile): TopItem[] {
    const program = readAstNodes(file, ["Program"])[0];
    if (program === undefined) return [];
    const statements = Array.isArray(program.body) ? program.body : [];
    const derived = readTopItemsDerivedNames(file);
    const items: TopItem[] = [];
    for (const statement of statements) {
        const item = readTopItemsStatement(file, statement, derived);
        if (item !== null) items.push(item);
    }
    assert(items.length <= ITEMS_MAXIMUM, `${file.path} stays inside the bound a walk states`);
    return items;
}

/** Every name a type takes `typeof` of, which is what puts a constant among the types. */
function readTopItemsDerivedNames(file: SourceFile): Set<string> {
    const names = new Set<string>();
    for (const query of readAstNodes(file, ["TSTypeQuery"])) {
        const text = file.text.slice(query.range[0], query.range[1]);
        if (!text.startsWith(TYPEOF_OPENER)) continue;
        let end = TYPEOF_OPENER.length;
        while (end < text.length) {
            if (!isNameCharacter(text.charAt(end))) break;
            end += 1;
        }
        names.add(text.slice(TYPEOF_OPENER.length, end));
    }
    return names;
}

function isNameCharacter(character: string): boolean {
    if (character === "_") return true;
    if (character === "$") return true;
    if (character.toLowerCase() !== character.toUpperCase()) return true;
    if (character < "0") return false;
    return character <= "9";
}

function readTopItemsStatement(
    file: SourceFile,
    statement: AstNode,
    derived: Set<string>,
): TopItem | null {
    const range = statement.range;
    if (file.text.startsWith(CASE_OPENER, range[0])) {
        // A test file's cases are what it is for, so each opens a run as an export does.
        const name = `the case at line ${getLineAt(file.text, range[0])}`;
        return { name, section: SECTION.functions, isExported: true, isFunction: true, range };
    }
    if (IMPORT_NODES.includes(statement.type)) {
        return { name: "", section: SECTION.imports, isExported: false, isFunction: false, range };
    }
    const isExported = statement.type === "ExportNamedDeclaration";
    const declaration = isExported ? statement.declaration : statement;
    if (declaration === null || declaration === undefined) {
        return { name: "", section: SECTION.imports, isExported, isFunction: false, range };
    }
    if (TYPE_NODES.includes(declaration.type)) {
        const name = declaration.id?.name ?? "";
        return { name, section: SECTION.types, isExported, isFunction: false, range };
    }
    if (declaration.type === "FunctionDeclaration") {
        const name = declaration.id?.name ?? "";
        return { name, section: SECTION.functions, isExported, isFunction: true, range };
    }
    if (declaration.type === "VariableDeclaration") {
        const name = declaration.declarations?.[0]?.id?.name ?? "";
        const section = derived.has(name) ? SECTION.types : SECTION.constants;
        return { name, section, isExported, isFunction: false, range };
    }
    return null;
}

function lookupSectionsOutOfOrder(file: SourceFile, items: readonly TopItem[]): string[] {
    const found: string[] = [];
    let highest: TopItem | null = null;
    for (const item of items) {
        if (highest !== null) {
            if (SECTION_RANKS[item.section] < SECTION_RANKS[highest.section]) {
                const line = getLineAt(file.text, item.range[0]);
                found.push(
                    `${file.path}:${line} ${item.name} stands with the ${item.section} ` +
                        `but after ${highest.name}, which is one of the ${highest.section}`,
                );
                continue;
            }
        }
        highest = item;
    }
    return found;
}

/**
 * A function nobody outside calls is read where its caller reads it: under the first function that
 * names it, and inside the run that function's export opens.
 */
function lookupHelpersOutOfPlace(file: SourceFile, items: readonly TopItem[]): string[] {
    const functions = items.filter((item) => item.isFunction);
    const mentions = readHelpersMentions(file, functions);
    const found: string[] = [];
    for (let index = 0; index < functions.length; index += 1) {
        const helper = functions[index]!;
        if (helper.isExported) continue;
        const first = mentions.findIndex((names, at) => {
            if (at === index) return false;
            return names.has(helper.name);
        });
        if (first === -1) continue;
        const line = getLineAt(file.text, helper.range[0]);
        const caller = functions[first]!;
        if (first > index) {
            found.push(
                `${file.path}:${line} ${helper.name} stands above ${caller.name}, ` +
                    `the first function that calls it`,
            );
            continue;
        }
        const between = functions.slice(first + 1, index).find((one) => one.isExported);
        if (between === undefined) continue;
        found.push(
            `${file.path}:${line} ${helper.name} stands under ${between.name}, ` +
                `past ${caller.name}, the first function that calls it`,
        );
    }
    return found;
}

/** The names each function's text mentions, a callback handed on counting as a call. */
function readHelpersMentions(file: SourceFile, functions: readonly TopItem[]): Set<string>[] {
    const mentions = functions.map(() => new Set<string>());
    for (const identifier of readAstNodes(file, ["Identifier"])) {
        const at = identifier.range[0];
        const owner = functions.findIndex((one) => at >= one.range[0] && at < one.range[1]);
        if (owner === -1) continue;
        mentions[owner]!.add(identifier.name ?? "");
    }
    return mentions;
}

Deno.test("imports, types, constants and functions in that order pass", () => {
    const sample = composeSample([
        'import { a } from "./a.ts";',
        "export interface Shape { a: number }",
        "const LIMIT = 1;",
        "export function first(): number { return LIMIT; }",
    ]);
    assertEquals(lookupDeclarationsOutOfOrder(sample), [], "the order a reader meets them in");
});

Deno.test("a vocabulary stands with the type derived from it, and nowhere lower", () => {
    const standing = composeSample([
        'const WORD = { one: "one" } as const;',
        "type Word = (typeof WORD)[keyof typeof WORD];",
        "const LIMIT = 1;",
    ]);
    assertEquals(lookupDeclarationsOutOfOrder(standing), [], "a vocabulary is part of its type");
    const lower = composeSample([
        "type Word = (typeof WORD)[keyof typeof WORD];",
        "const LIMIT = 1;",
        'const WORD = { one: "one" } as const;',
    ]);
    assertEquals(lookupDeclarationsOutOfOrder(lower), [
        "sample.ts:3 WORD stands with the types but after LIMIT, which is one of the constants",
    ], "and among the constants it is out of place");
});

Deno.test("a helper above its caller, or past the next export, is flagged", () => {
    const sample = composeSample([
        "function early(): number { return 1; }",
        "export function first(): number { return early() + shared(); }",
        "export function second(): number { return 2; }",
        "function shared(): number { return 3; }",
    ]);
    assertEquals(lookupDeclarationsOutOfOrder(sample), [
        "sample.ts:1 early stands above first, the first function that calls it",
        "sample.ts:4 shared stands under second, past first, the first function that calls it",
    ], "a helper is read after what calls it, in the run of that export");
});

Deno.test("a helper under its first caller, and a helper's helper under it, pass", () => {
    const sample = composeSample([
        "export function first(): number { return shared() + 1; }",
        "function shared(): number { return deeper(); }",
        "function deeper(): number { return 2; }",
        "export function second(): number { return shared(); }",
    ]);
    assertEquals(lookupDeclarationsOutOfOrder(sample), [], "top-down, as the calls are read");
});

Deno.test("a test file's helper stands under the first case that calls it, and not above", () => {
    const above = composeSample([
        "function sampleOf(): number { return 1; }",
        'Deno.test("one", () => { sampleOf(); });',
    ]);
    assertEquals(lookupDeclarationsOutOfOrder(above), [
        "sample.ts:1 sampleOf stands above the case at line 2, the first function that calls it",
    ], "a case is what a test file is for, so it is read first");
    const under = composeSample([
        'Deno.test("one", () => { sampleOf(); });',
        "function sampleOf(): number { return 1; }",
        'Deno.test("two", () => { sampleOf(); });',
    ]);
    assertEquals(lookupDeclarationsOutOfOrder(under), [], "and under its first case it passes");
});

Deno.test("every module in the tree reads in that order", () => {
    const found = readSourceFiles(SOURCE_DIRECTORIES).flatMap(lookupDeclarationsOutOfOrder);
    assertEquals(found, [], "C1");
});
