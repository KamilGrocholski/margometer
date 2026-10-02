/**
 * The tree as a parser reads it, for the guards in `tests/repository/`.
 *
 * `Deno.lint.runPlugin` parses a file and hands each node of the kinds asked for to a visitor, so a
 * comment or a string literal is never read as code. It answers only under `deno test`, measured on
 * Deno 2.9.7, 2026-09-24. Ranges are UTF-16 offsets into the text, the same as `String#slice`.
 */

import { assert } from "@std/assert";
import { existsSync, walkSync } from "@std/fs";
import { isRecord } from "#/libs/unknown-value.ts";

/**
 * `Deno.lint` is declared only under the `deno.unstable` library, and naming that in
 * `compilerOptions.lib` would show every unstable API to `src/` as well. The shape below is the
 * whole of what the guards read, and C13 lets a test keep the cast.
 */
export interface AstNode {
    type: string;
    range: [number, number];
    async?: boolean;
    name?: string;
    computed?: boolean;
    source?: { value?: unknown } | null;
    regex?: { pattern: string } | null;
    body?: AstNode[] | AstNode | null;
    declaration?: AstNode | null;
    declarations?: AstNode[];
    id?: AstNode | null;
    value?: unknown;
    init?: AstNode | null;
    property?: AstNode;
    key?: AstNode;
    superClass?: AstNode | null;
    callee?: AstNode;
    arguments?: AstNode[];
    params?: AstNode[];
    typeAnnotation?: AstNode | null;
    typeName?: AstNode;
    parent?: AstNode | null;
    specifiers?: AstNode[];
    local?: AstNode;
    imported?: AstNode;
    kind?: string;
    operator?: string;
    optional?: boolean;
    left?: AstNode;
    object?: AstNode;
    argument?: AstNode;
    expression?: AstNode;
    types?: AstNode[];
    properties?: AstNode[];
    elements?: (AstNode | null)[];
    param?: AstNode | null;
    parameter?: AstNode;
}
type AstVisitor = Record<string, (visitedNode: AstNode) => void>;
interface AstComment {
    type: string;
    range: [number, number];
    value: string;
}
interface LintContext {
    sourceCode: { getAllComments(): AstComment[] };
}
interface LintPlugin {
    name: string;
    rules: Record<string, { create: (context: LintContext) => AstVisitor }>;
}

export interface SourceFile {
    path: string;
    text: string;
}

const lint = (Deno as unknown as {
    lint: { runPlugin(plugin: LintPlugin, filename: string, source: string): unknown };
}).lint;

export const SOURCE_DIRECTORIES = ["frozen", "libs", "src", "tests", "tools"] as const;
export const FUNCTION_NODES = [
    "FunctionDeclaration",
    "FunctionExpression",
    "ArrowFunctionExpression",
] as const;

const FILES_MAXIMUM = 2000;
const IMPORT_NODES = ["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"];
const ROOT_PREFIX = "#/";
const SIBLING_PREFIX = "./";
/** What `src/` reaches outside itself and ships with it. */
const BUNDLED_PREFIXES = ["frozen/", "libs/"];
/** Between a file's path and a declaration's name, in the key a call graph is indexed by. */
export const NAME_MARK = "#";
/** Past the depth of any parse here, so the climb to a declaration carries a stated bound. */
const DEPTH_MAXIMUM = 512;
/** S16: how many blocks a body may nest, counting its own. */
export const NESTING_DEPTH_MAXIMUM = 5;
/** The statements S16 measures. */
const NESTED_NODES = [
    "BreakStatement",
    "ContinueStatement",
    "DoWhileStatement",
    "ExpressionStatement",
    "ForInStatement",
    "ForOfStatement",
    "ForStatement",
    "FunctionDeclaration",
    "IfStatement",
    "LabeledStatement",
    "ReturnStatement",
    "SwitchStatement",
    "ThrowStatement",
    "TryStatement",
    "VariableDeclaration",
    "WhileStatement",
] as const;

/**
 * Every `.ts` file under the directories asked for, by repository-relative path. A directory that is
 * gone fails rather than reading as empty: a guard naming a layer a rename moved held nothing.
 */
export function readSourceFiles(directories: readonly string[]): SourceFile[] {
    const files: SourceFile[] = [];
    for (const directory of directories) {
        assert(
            existsSync(directory, { isDirectory: true }),
            `${directory} is a directory of the tree`,
        );
        for (const walkedFile of walkSync(directory, { exts: [".ts"], includeDirs: false })) {
            files.push({ path: walkedFile.path, text: Deno.readTextFileSync(walkedFile.path) });
            assert(files.length <= FILES_MAXIMUM, "the tree stays inside the bound a walk states");
        }
    }
    return files.sort((left, right) => left.path < right.path ? -1 : 1);
}

/** What ships: `src/`, and every `frozen/` and `libs/` module it reaches through an import. */
export function readBundleFiles(): SourceFile[] {
    const libs = new Map(readSourceFiles(["frozen", "libs"]).map((file) => [file.path, file]));
    const bundle = readSourceFiles(["src"]);
    const reached = new Set<string>();
    for (let index = 0; index < bundle.length; index += 1) {
        assert(index < FILES_MAXIMUM, "the bundle stays inside the bound a walk states");
        const file = bundle[index]!;
        for (const imported of readImportSources(file)) {
            const path = lookupImportedPath(file, imported);
            if (path === null) continue;
            if (!BUNDLED_PREFIXES.some((prefix) => path.startsWith(prefix))) continue;
            if (reached.has(path)) continue;
            const library = libs.get(path);
            assert(library !== undefined, `${file.path} imports ${path}, which exists`);
            reached.add(path);
            bundle.push(library);
        }
    }
    return bundle;
}

export function readImportSources(file: SourceFile): string[] {
    const sources: string[] = [];
    for (const declaration of readAstNodes(file, IMPORT_NODES)) {
        const source = declaration.source?.value;
        if (typeof source === "string") sources.push(source);
    }
    return sources;
}

/**
 * The repository path an import names, or null where it names no file of ours: `#/` is read from
 * the root and `./` from the importing file's directory (C8).
 */
export function lookupImportedPath(file: SourceFile, source: string): string | null {
    if (source.startsWith(ROOT_PREFIX)) return source.slice(ROOT_PREFIX.length);
    if (!source.startsWith(SIBLING_PREFIX)) return null;
    const directory = file.path.slice(0, file.path.lastIndexOf("/") + 1);
    return directory + source.slice(SIBLING_PREFIX.length);
}

/** Every node of the kinds asked for, in the order the parser meets them. */
export function readAstNodes(file: SourceFile, kinds: readonly string[]): AstNode[] {
    const matchingNodes: AstNode[] = [];
    const visitors: AstVisitor = {};
    for (const kind of kinds) visitors[kind] = (visitedNode) => matchingNodes.push(visitedNode);
    lint.runPlugin(
        { name: "read", rules: { walk: { create: () => visitors } } },
        file.path,
        file.text,
    );
    return matchingNodes;
}

/** The innermost of the functions given that a node stands in, or null at a module's top level. */
export function lookupEnclosingFunction(
    functions: readonly AstNode[],
    enclosed: AstNode,
): AstNode | null {
    let innermost: AstNode | null = null;
    for (const candidate of functions) {
        if (candidate.range[0] > enclosed.range[0]) continue;
        if (candidate.range[1] < enclosed.range[1]) continue;
        if (isSameRange(candidate, enclosed)) continue;
        if (innermost === null || candidate.range[0] >= innermost.range[0]) innermost = candidate;
    }
    return innermost;
}

function isSameRange(left: AstNode, right: AstNode): boolean {
    if (left.range[0] !== right.range[0]) return false;
    return left.range[1] === right.range[1];
}

/** The text of every comment in a file, without its marks, in the order the file states them. */
export function readCommentTexts(file: SourceFile): string[] {
    const commentTexts: string[] = [];
    const visitors = (context: LintContext): AstVisitor => ({
        Program: () => {
            for (const comment of context.sourceCode.getAllComments()) {
                commentTexts.push(comment.value);
            }
        },
    });
    lint.runPlugin({ name: "read", rules: { walk: { create: visitors } } }, file.path, file.text);
    return commentTexts;
}

/** One-based, as an editor and `file:line` read it. */
export function getLineAt(text: string, offset: number): number {
    assert(offset <= text.length, "an offset lies inside the text it was taken from");
    let line = 1;
    let newlineIndex = text.indexOf("\n");
    while (newlineIndex !== -1) {
        if (newlineIndex >= offset) break;
        line += 1;
        newlineIndex = text.indexOf("\n", newlineIndex + 1);
    }
    return line;
}

/** Where a finding stands, as `path:line`, so a red gate points at it. */
export function formatNodePlace(file: SourceFile, flaggedNode: AstNode): string {
    return `${file.path}:${getLineAt(file.text, flaggedNode.range[0])}`;
}

/** A sample the guards are proved on, never a file in the tree. */
export function composeSample(lines: readonly string[]): SourceFile {
    return { path: "sample.ts", text: lines.join("\n") };
}

/** What each name a file can call stands for, by `path#name`: its own declarations and imports. */
export function indexCallableNames(file: SourceFile): Map<string, string> {
    const known = new Map<string, string>();
    for (const declared of readAstNodes(file, ["FunctionDeclaration", "VariableDeclarator"])) {
        const name = readDeclaredFunctionName(declared);
        if (name !== null) known.set(name, file.path + NAME_MARK + name);
    }
    for (const imported of readAstNodes(file, ["ImportDeclaration"])) {
        const source = imported.source?.value;
        if (typeof source !== "string") continue;
        const path = lookupImportedPath(file, source);
        if (path === null) continue;
        for (const specifier of imported.specifiers ?? []) {
            const local = specifier.local?.name;
            const name = specifier.imported?.name;
            if (local === undefined) continue;
            if (name !== undefined) known.set(local, path + NAME_MARK + name);
        }
    }
    return known;
}

/** The name a declaration gives a function, or null where it declares something else. */
export function readDeclaredFunctionName(declaration: AstNode): string | null {
    if (declaration.type === "FunctionDeclaration") return declaration.id?.name ?? null;
    const init = declaration.init;
    if (init === null || init === undefined) return null;
    if (!FUNCTION_NODES.some((kind) => kind === init.type)) return null;
    return declaration.id?.name ?? null;
}

/** The names a binding pattern declares: an identifier, and every one a destructuring holds. */
export function readBoundNames(pattern: AstNode | null): string[] {
    const names: string[] = [];
    const pending: AstNode[] = pattern === null ? [] : [pattern];
    for (let step = 0; pending.length > 0; step += 1) {
        assert(step < DEPTH_MAXIMUM, "a pattern stays inside the bound its walk states");
        const subpattern = pending.pop()!;
        if (subpattern.type === "Identifier") {
            names.push(subpattern.name ?? "");
            continue;
        }
        const valueNode = readChildNode(subpattern.value);
        const parts = [subpattern.left, subpattern.argument, subpattern.parameter, valueNode];
        for (
            const child of [
                ...parts,
                ...(subpattern.elements ?? []),
                ...(subpattern.properties ?? []),
            ]
        ) {
            if (child !== undefined && child !== null) pending.push(child);
        }
    }
    return names;
}

/** A node a field typed `unknown` holds, or null where it holds a value. */
export function readChildNode(fieldValue: unknown): AstNode | null {
    if (!isRecord(fieldValue)) return null;
    if (typeof fieldValue.type !== "string") return null;
    return fieldValue as unknown as AstNode;
}

/** The declaration a node stands in, climbing out of every unnamed closure; null at the top. */
export function lookupCallerDeclaration(enclosed: AstNode): AstNode | null {
    let ancestor = enclosed.parent ?? null;
    for (let depth = 0; ancestor !== null; depth += 1) {
        assert(depth < DEPTH_MAXIMUM, "a parse stays inside the depth a climb states");
        if (readDeclaredFunctionName(ancestor) !== null) return ancestor;
        ancestor = ancestor.parent ?? null;
    }
    return null;
}

/**
 * The blocks a node stands in, up to its module's top: a braced body, a `case`, and an arrow whose
 * body is an expression each count one, because written in braces that body would be a block.
 */
export function countEnclosingBlocks(enclosed: AstNode): number {
    let count = 0;
    let ancestor = enclosed.parent ?? null;
    for (let depth = 0; ancestor !== null; depth += 1) {
        assert(depth < DEPTH_MAXIMUM, "a parse stays inside the depth a climb states");
        if (ancestor.type === "BlockStatement" || ancestor.type === "SwitchCase") count += 1;
        if (isExpressionArrow(ancestor)) count += 1;
        ancestor = ancestor.parent ?? null;
    }
    return count;
}

/** An arrow whose body is an expression rather than a block. */
function isExpressionArrow(candidate: AstNode): boolean {
    if (candidate.type !== "ArrowFunctionExpression") return false;
    const body = candidate.body;
    if (body === null || body === undefined || Array.isArray(body)) return false;
    return body.type !== "BlockStatement";
}

/** What S16 measures in a file: every statement, an arrow's expression body being none. */
export function readNestedNodes(file: SourceFile): AstNode[] {
    return readAstNodes(file, NESTED_NODES);
}
