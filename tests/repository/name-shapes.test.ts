/**
 * N22: a function declared on its own is an action and what it acts on, never a bare verb; a
 * local or a parameter names what it holds, never a placeholder that would fit any value. A
 * method is read by its receiver, and so is a function every importer reaches through its module
 * (`errors.attempt`, ADR 0009): whether either reads as a sentence is left to a reader.
 */

import { assertEquals } from "@std/assert";
import {
    type AstNode,
    composeSample,
    formatNodePlace,
    FUNCTION_NODES,
    lookupImportedPath,
    NAME_MARK,
    readAstNodes,
    readBoundNames,
    readDeclaredFunctionName,
    readSourceFiles,
    SOURCE_DIRECTORIES,
    type SourceFile,
} from "#/tests/source-tree.ts";

/** Which modules are reached through a namespace, and which of their names are imported alone. */
interface ImportReach {
    namespaced: ReadonlySet<string>;
    named: ReadonlySet<string>;
}

/** Where a bare verb is looked for: the code a reader of the tree follows by its calls. */
const FUNCTION_DIRECTORIES = ["libs", "src"];
/** Where a placeholder is looked for, a layer at a time as each is renamed. */
const BINDING_DIRECTORIES = ["libs", "src"];
/** Words that fit any value, so a name made of one says nothing of what it holds. */
const PLACEHOLDERS = [
    "a",
    "at",
    "b",
    "current",
    "data",
    "element",
    "entry",
    "first",
    "found",
    "item",
    "last",
    "next",
    "node",
    "one",
    "other",
    "part",
    "previous",
    "read",
    "result",
    "value",
];
/** What a parameter list stands on, a type's signatures included: a parameter there is named too. */
const SIGNATURE_NODES = [
    ...FUNCTION_NODES,
    "TSDeclareFunction",
    "TSMethodSignature",
    "TSFunctionType",
    "TSCallSignatureDeclaration",
    "TSConstructSignatureDeclaration",
];
const BINDING_NODES = [...SIGNATURE_NODES, "VariableDeclarator", "CatchClause"];
const DECLARING_NODES = ["FunctionDeclaration", "VariableDeclarator"];
const IMPORT_NODE = "ImportDeclaration";
const NAMESPACE_SPECIFIER = "ImportNamespaceSpecifier";
const NAMED_SPECIFIER = "ImportSpecifier";
const EXPORT_NODE = "ExportNamedDeclaration";

Deno.test("a bare verb declared on its own is flagged, and a method or a sentence is not", () => {
    const sample = composeSample([
        "function clamp(number: number): number { return number; }",
        "const settle = () => 1;",
        "function clampHealthPercent(number: number): number { return number; }",
        "const shelf = { keep() { return 1; } };",
        "interface Drawing { settle(): void }",
        "const count = 3;",
        "function readV2(): number { return 2; }",
        "export function attempt(): number { return 1; }",
        "export function hold(): number { return 1; }",
    ]);
    const importer = {
        ...composeSample([
            'import * as errors from "./sample.ts";',
            'import { hold } from "./sample.ts";',
        ]),
        path: "importer.ts",
    };
    const reach = indexImportReach([sample, importer]);
    assertEquals(lookupBareVerbs(sample, reach), [
        "sample.ts:1 clamp",
        "sample.ts:2 settle",
        "sample.ts:9 hold",
    ], "the declared ones, not a method, a value, a name that goes on, or one read off its module");
});

function lookupBareVerbs(file: SourceFile, reach: ImportReach): string[] {
    const bareVerbs: string[] = [];
    for (const declaration of readAstNodes(file, DECLARING_NODES)) {
        const name = readDeclaredFunctionName(declaration);
        if (name === null) continue;
        if (!isOneWord(name)) continue;
        if (isReadOffItsModule(file, declaration, name, reach)) continue;
        bareVerbs.push(`${formatNodePlace(file, declaration)} ${name}`);
    }
    return bareVerbs;
}

/** A camelCase name with no second word: lower-case letters and digits alone. */
function isOneWord(name: string): boolean {
    for (const character of name) {
        if (character >= "a") {
            if (character <= "z") continue;
        }
        if (character >= "0") {
            if (character <= "9") continue;
        }
        return false;
    }
    return name.length > 0;
}

/** Exported, its module imported as a namespace somewhere, and the name never imported alone. */
function isReadOffItsModule(
    file: SourceFile,
    declaration: AstNode,
    name: string,
    reach: ImportReach,
): boolean {
    const holder = declaration.type === "VariableDeclarator"
        ? declaration.parent?.parent
        : declaration.parent;
    if (holder?.type !== EXPORT_NODE) return false;
    if (!reach.namespaced.has(file.path)) return false;
    return !reach.named.has(`${file.path}${NAME_MARK}${name}`);
}

function indexImportReach(files: readonly SourceFile[]): ImportReach {
    const namespaced = new Set<string>();
    const named = new Set<string>();
    for (const file of files) {
        for (const declaration of readAstNodes(file, [IMPORT_NODE])) {
            const source = declaration.source?.value;
            if (typeof source !== "string") continue;
            const path = lookupImportedPath(file, source);
            if (path === null) continue;
            for (const specifier of declaration.specifiers ?? []) {
                if (specifier.type === NAMESPACE_SPECIFIER) namespaced.add(path);
                if (specifier.type !== NAMED_SPECIFIER) continue;
                named.add(`${path}${NAME_MARK}${specifier.imported?.name ?? ""}`);
            }
        }
    }
    return { namespaced, named };
}

Deno.test("a placeholder bound anywhere is flagged, and a name that says what it holds is not", () => {
    const sample = composeSample([
        "function read(value: number, { at, keptFight }: Shape): number {",
        "    const found = [value];",
        "    const [first, healthPercent] = found;",
        "    try { return at; } catch (result) { return first; }",
        "}",
        "const fights = [].filter((one) => one > 0);",
        "interface Setter { setTypeStep(next: number): void }",
        "type Compare = (a: number, b: number) => number;",
        "const valueByName = new Map();",
    ]);
    assertEquals(lookupPlaceholders(sample), [
        "sample.ts:1 value",
        "sample.ts:1 at",
        "sample.ts:2 found",
        "sample.ts:3 first",
        "sample.ts:4 result",
        "sample.ts:6 one",
        "sample.ts:7 next",
        "sample.ts:8 a",
        "sample.ts:8 b",
    ], "every placeholder once where it is bound, and not a name holding one as a word");
});

function lookupPlaceholders(file: SourceFile): string[] {
    const placeholders: string[] = [];
    for (const binding of readAstNodes(file, BINDING_NODES)) {
        for (const name of readBindingNames(binding)) {
            if (!PLACEHOLDERS.includes(name)) continue;
            placeholders.push(`${formatNodePlace(file, binding)} ${name}`);
        }
    }
    return placeholders;
}

/** The names a node binds: a declarator's, a catch clause's, or a signature's parameters. */
function readBindingNames(binding: AstNode): string[] {
    if (binding.type === "VariableDeclarator") return readBoundNames(binding.id ?? null);
    if (binding.type === "CatchClause") return readBoundNames(binding.param ?? null);
    return (binding.params ?? []).flatMap((parameter) => readBoundNames(parameter));
}

Deno.test("every function and every binding in the tree is named as N22 asks", () => {
    const reach = indexImportReach(readSourceFiles(SOURCE_DIRECTORIES));
    const functions = readSourceFiles(FUNCTION_DIRECTORIES).flatMap((file) =>
        lookupBareVerbs(file, reach)
    );
    assertEquals(functions, [], "N22: a function declared on its own says what it acts on");
    const bindings = readSourceFiles(BINDING_DIRECTORIES).flatMap(lookupPlaceholders);
    assertEquals(bindings, [], "N22: a local or a parameter says what it holds");
});
