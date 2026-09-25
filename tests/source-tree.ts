/**
 * The tree as a parser reads it, for the guards in `tests/repository/`.
 *
 * `Deno.lint.runPlugin` parses a file and hands each node of the kinds asked for to a visitor, so a
 * comment or a string literal is never read as code. It answers only under `deno test`, measured on
 * Deno 2.9.7, 2026-09-24. Ranges are UTF-16 offsets into the text, the same as `String#slice`.
 */

import { assert } from "@std/assert";
import { existsSync, walkSync } from "@std/fs";

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
    superClass?: AstNode | null;
}
type AstVisitor = Record<string, (node: AstNode) => void>;
interface LintPlugin {
    name: string;
    rules: Record<string, { create: () => AstVisitor }>;
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

/** Every `.ts` file under the directories asked for that exist, by repository-relative path. */
export function readSourceFiles(directories: readonly string[]): SourceFile[] {
    const files: SourceFile[] = [];
    for (const directory of directories) {
        if (!existsSync(directory, { isDirectory: true })) continue;
        for (const entry of walkSync(directory, { exts: [".ts"], includeDirs: false })) {
            files.push({ path: entry.path, text: Deno.readTextFileSync(entry.path) });
            assert(files.length <= FILES_MAXIMUM, "the tree stays inside the bound a walk states");
        }
    }
    return files.sort((one, other) => one.path < other.path ? -1 : 1);
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
    for (const node of readAstNodes(file, IMPORT_NODES)) {
        const value = node.source?.value;
        if (typeof value === "string") sources.push(value);
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
    const found: AstNode[] = [];
    const visitors: AstVisitor = {};
    for (const kind of kinds) visitors[kind] = (node) => found.push(node);
    lint.runPlugin(
        { name: "read", rules: { walk: { create: () => visitors } } },
        file.path,
        file.text,
    );
    return found;
}

/** One-based, as an editor and `file:line` read it. */
export function getLineAt(text: string, offset: number): number {
    assert(offset <= text.length, "an offset lies inside the text it was taken from");
    let line = 1;
    let at = text.indexOf("\n");
    while (at !== -1) {
        if (at >= offset) break;
        line += 1;
        at = text.indexOf("\n", at + 1);
    }
    return line;
}

/** Where a finding stands, as `path:line`, so a red gate points at it. */
export function formatNodePlace(file: SourceFile, node: AstNode): string {
    return `${file.path}:${getLineAt(file.text, node.range[0])}`;
}

/** A sample the guards are proved on, never a file in the tree. */
export function composeSample(lines: readonly string[]): SourceFile {
    return { path: "sample.ts", text: lines.join("\n") };
}
