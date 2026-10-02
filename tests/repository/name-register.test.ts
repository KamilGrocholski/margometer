/**
 * `docs/names.md`, re-earned from the tree it lists: every name the code declares, every string a
 * module-level constant holds, every task, directory and file. The register is composed here and
 * compared line by line, so a name renamed, added or gone reddens this until `deno task names` runs
 * this suite with `--write` and the file is written again. Which name is right is `AGENTS.md`'s.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { parse as parseJsonc } from "@std/jsonc";
import { isDigitAt } from "#/libs/text-walk.ts";
import { isRecord } from "#/libs/unknown-value.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import {
    type AstNode,
    composeSample,
    FUNCTION_NODES,
    readAstNodes,
    readDeclaredFunctionName,
    readSourceFiles,
    SOURCE_DIRECTORIES,
    type SourceFile,
} from "#/tests/source-tree.ts";
import { type Purity, readVerb, readVerbPurities, RULES_PATH } from "#/tests/verb-purities.ts";

const NAME_KIND = {
    function: "function",
    type: "type",
    typeParameter: "type parameter",
    failure: "failure class",
    class: "class",
    constant: "module constant",
    alias: "import alias",
    local: "local",
    parameter: "parameter",
    field: "field",
} as const;
type NameKind = VocabularyWord<typeof NAME_KIND>;

/** One name, of one kind, where one file declares it. */
interface NameSighting {
    name: string;
    kind: NameKind;
    path: string;
}

/** A class as declared, before its chain says whether it is a failure. */
interface ClassSighting {
    name: string;
    base: string | null;
    path: string;
}

/** A string a module-level constant holds: where a name somebody else chose is spelled. */
interface HeldString {
    value: string;
    holder: string;
    path: string;
}

/** A closed set of our own strings (N18), by its keys. */
interface Vocabulary {
    name: string;
    keys: string[];
    path: string;
}

interface FileNames {
    sightings: NameSighting[];
    classes: ClassSighting[];
    strings: HeldString[];
    vocabularies: Vocabulary[];
}

/** Everything the register is composed of. */
interface NameTree {
    files: readonly FileNames[];
    tracked: readonly string[];
    tasks: readonly string[];
    scripts: readonly string[];
    purities: ReadonlyMap<string, Purity>;
}

const REGISTER_PATH = "docs/names.md";
const WRITE_FLAG = "--write";
const CONFIGURATION_PATH = "deno.json";
const MANIFEST_PATH = "package.json";
/** Evidence rather than names of ours, and `captures/AGENTS.md` keeps it. */
const EVIDENCE_PREFIX = "captures/";
/** A suite's strings are material it is handed, never a name the tree reads by. */
const SUITE_PREFIX = "tests/";
/** What a reader of the panel is told (L2): words, never names, however short. */
const WORDS_SUFFIX = "_WORDS";
/** A name standing in more files than this is given as a count and its layers. */
const PATHS_LISTED_MAXIMUM = 3;
/** Past the depth of any parse here, so a climb or a walk of a pattern carries a stated bound. */
const DEPTH_MAXIMUM = 512;
/** Past the classes the tree declares, so resolving their chains carries a stated bound. */
const CLASSES_MAXIMUM = 4096;
/** Most specific first: a path takes the first that opens it. */
const LAYERS = [
    "libs/",
    "src/core/",
    "src/ports/",
    "src/runtime/",
    "src/ui/",
    "src/",
    "frozen/",
    "tools/",
    "tests/",
];
/** What every failure's chain ends in. */
const FAILURE_ROOT = "Error";
const CONSTRUCTOR_NAME = "constructor";
/** The one type an `as const` names. */
const CONST_NAME = "const";
const DECLARING_NODES = [
    ...FUNCTION_NODES,
    "TSDeclareFunction",
    "TSMethodSignature",
    "TSFunctionType",
    "TSCallSignatureDeclaration",
    "TSConstructSignatureDeclaration",
    "VariableDeclarator",
    "ClassDeclaration",
    "ClassExpression",
    "TSInterfaceDeclaration",
    "TSTypeAliasDeclaration",
    "TSTypeParameter",
    "ImportSpecifier",
    "ImportDefaultSpecifier",
    "ImportNamespaceSpecifier",
    "CatchClause",
    "TSPropertySignature",
    "PropertyDefinition",
    "MethodDefinition",
    "Property",
    "Literal",
];
/** What a parameter list stands on. */
const SIGNATURE_NODES = [
    ...FUNCTION_NODES,
    "TSDeclareFunction",
    "TSMethodSignature",
    "TSFunctionType",
    "TSCallSignatureDeclaration",
    "TSConstructSignatureDeclaration",
];
/** What a string climbs through to the constant holding it: a literal of literals, typed. */
const HOLDING_NODES = [
    "ArrayExpression",
    "ObjectExpression",
    "Property",
    "TSAsExpression",
    "TSSatisfiesExpression",
];
const TOP_NODES = ["Program", "ExportNamedDeclaration"];
/** The printable ASCII run: a string past it, or with a space, is text rather than a name. */
const PRINTABLE_FIRST = "!";
const PRINTABLE_LAST = "~";
const SPAN_MARK = "`";
const SECTION_HEADINGS: Record<NameKind, string> = {
    [NAME_KIND.function]: "Functions",
    [NAME_KIND.type]: "Types",
    [NAME_KIND.typeParameter]: "Type parameters",
    [NAME_KIND.failure]: "Failure classes",
    [NAME_KIND.class]: "Other classes",
    [NAME_KIND.constant]: "Module constants",
    [NAME_KIND.alias]: "Import aliases",
    [NAME_KIND.local]: "Locals",
    [NAME_KIND.parameter]: "Parameters",
    [NAME_KIND.field]: "Fields",
};
/** The sections after the functions, in the order the register states them. */
const LAYERED_KINDS: readonly NameKind[] = [
    NAME_KIND.type,
    NAME_KIND.typeParameter,
    NAME_KIND.failure,
    NAME_KIND.class,
    NAME_KIND.constant,
    NAME_KIND.alias,
    NAME_KIND.local,
    NAME_KIND.parameter,
    NAME_KIND.field,
];

Deno.test("a name is read by what declares it, and a comment or a sentence is not", () => {
    const sample = composeSample([
        "/** readHidden is only said here. */",
        'import { parse as parseText } from "@std/jsonc";',
        "export interface WarriorShape<Side> { health: number; readCount(at: number): number }",
        "export class StoreRefused extends Error {}",
        "class RefusedTwice extends StoreRefused {}",
        "class Plain { field = 1; }",
        'const STORE_KEY = { fights: "MargoMeter-fights", shelf: ["data-shelf"] } as const;',
        'const SENTENCE = "Walka trwa dalej";',
        'const POLISH = "Żółw";',
        'const OUTCOME_WORDS = { draw: "remis" } as const;',
        'const FROZEN = { fetchedAt: "2026-10-02T14:46:17.315Z", article: "372" };',
        "export function readPlace(text: string, { at, ...rest }: Shape): number {",
        '    const local = "inside-a-function";',
        "    const [first] = [text];",
        "    try { return at; } catch (failure) { return first; }",
        "}",
        "const formatRow = (row: string) => row;",
        "const object = { tallyRows() { return 1; } };",
    ]);
    const read = readFileNames(sample);
    const sightings = composeSightings([read]).map((one) => `${one.kind} ${one.name}`);
    assertEquals(sightings.sort(), [
        "class Plain",
        "failure class RefusedTwice",
        "failure class StoreRefused",
        "field article",
        "field draw",
        "field fetchedAt",
        "field field",
        "field fights",
        "field health",
        "field shelf",
        "function formatRow",
        "function readCount",
        "function readPlace",
        "function tallyRows",
        "import alias parseText",
        "local first",
        "local local",
        "module constant FROZEN",
        "module constant OUTCOME_WORDS",
        "module constant POLISH",
        "module constant SENTENCE",
        "module constant STORE_KEY",
        "module constant object",
        "parameter at",
        "parameter failure",
        "parameter rest",
        "parameter row",
        "parameter text",
        "type WarriorShape",
        "type parameter Side",
    ], "every declaration once, and the comment's name is none");
    const strings = read.strings.map((one) => `${one.holder} ${one.value}`);
    assertEquals(strings, [
        "STORE_KEY MargoMeter-fights",
        "STORE_KEY data-shelf",
    ], "a constant's strings, and not a sentence, a word, a date, a count or a function's string");
    assertEquals(read.vocabularies, [
        { name: "STORE_KEY", keys: ["fights", "shelf"], path: "sample.ts" },
        { name: "OUTCOME_WORDS", keys: ["draw"], path: "sample.ts" },
    ], "and a vocabulary by its keys");
    const suite = composeSample(['const FIXTURE = "luvia-grupa-vs-amaimon";']);
    const fixture = readFileNames({ ...suite, path: "tests/sample.test.ts" });
    assertEquals(fixture.strings, [], "and a suite's material is no name at all");
});

/** What one file declares, each name once per kind. */
function readFileNames(file: SourceFile): FileNames {
    const read: FileNames = { sightings: [], classes: [], strings: [], vocabularies: [] };
    const seen = new Set<string>();
    const addName = (name: string | null, kind: NameKind) => {
        if (name === null) return;
        const key = `${kind} ${name}`;
        if (seen.has(key)) return;
        seen.add(key);
        read.sightings.push({ name, kind, path: file.path });
    };
    for (const node of readAstNodes(file, DECLARING_NODES)) {
        if (SIGNATURE_NODES.includes(node.type)) {
            for (const parameter of node.params ?? []) {
                for (const name of readBoundNames(parameter)) addName(name, NAME_KIND.parameter);
            }
        }
        switch (node.type) {
            case "FunctionDeclaration":
            case "FunctionExpression":
            case "TSDeclareFunction":
                addName(node.id?.name ?? null, NAME_KIND.function);
                break;
            case "VariableDeclarator":
                readDeclaratorNames(file, node, read, addName);
                break;
            case "ClassDeclaration":
            case "ClassExpression":
                readClass(file, node, read);
                break;
            case "TSInterfaceDeclaration":
            case "TSTypeAliasDeclaration":
                addName(node.id?.name ?? null, NAME_KIND.type);
                break;
            case "TSTypeParameter":
                addName(readNodeName(node.name), NAME_KIND.typeParameter);
                break;
            case "ImportSpecifier":
                if (node.local?.name !== node.imported?.name) {
                    addName(node.local?.name ?? null, NAME_KIND.alias);
                }
                break;
            case "ImportDefaultSpecifier":
            case "ImportNamespaceSpecifier":
                addName(node.local?.name ?? null, NAME_KIND.alias);
                break;
            case "CatchClause":
                for (const name of readBoundNames(node.param ?? null)) {
                    addName(name, NAME_KIND.parameter);
                }
                break;
            case "TSPropertySignature":
            case "PropertyDefinition":
                addName(readKeyName(node), NAME_KIND.field);
                break;
            case "MethodDefinition":
            case "TSMethodSignature":
                if (readKeyName(node) !== CONSTRUCTOR_NAME) {
                    addName(readKeyName(node), NAME_KIND.function);
                }
                break;
            case "Property":
                readPropertyName(node, addName);
                break;
            case "Literal":
                readHeldString(file, node, read);
                break;
        }
    }
    return read;
}

/** The names a binding pattern declares: an identifier, and every one a destructuring holds. */
function readBoundNames(pattern: AstNode | null): string[] {
    const names: string[] = [];
    const pending: AstNode[] = pattern === null ? [] : [pattern];
    for (let step = 0; pending.length > 0; step += 1) {
        assert(step < DEPTH_MAXIMUM, "a pattern stays inside the bound its walk states");
        const node = pending.pop()!;
        if (node.type === "Identifier") {
            names.push(node.name ?? "");
            continue;
        }
        const value = readChildNode(node.value);
        const parts = [node.left, node.argument, node.parameter, value];
        for (const part of [...parts, ...(node.elements ?? []), ...(node.properties ?? [])]) {
            if (part !== undefined && part !== null) pending.push(part);
        }
    }
    return names;
}

/** A node a field typed `unknown` holds, or null where it holds a value. */
function readChildNode(value: unknown): AstNode | null {
    if (!isRecord(value)) return null;
    if (typeof value.type !== "string") return null;
    return value as unknown as AstNode;
}

function readDeclaratorNames(
    file: SourceFile,
    node: AstNode,
    read: FileNames,
    addName: (name: string | null, kind: NameKind) => void,
): void {
    const isTop = isTopLevel(node);
    const function_ = readDeclaredFunctionName(node);
    if (function_ !== null) {
        addName(function_, NAME_KIND.function);
        return;
    }
    const kind = isTop ? NAME_KIND.constant : NAME_KIND.local;
    for (const name of readBoundNames(node.id ?? null)) addName(name, kind);
    const keys = isTop ? readVocabularyKeys(node.init ?? null) : null;
    if (keys !== null) read.vocabularies.push({ name: node.id?.name ?? "", keys, path: file.path });
}

/** A declarator standing at a module's top, exported or not. */
function isTopLevel(declarator: AstNode): boolean {
    const declaration = declarator.parent ?? null;
    if (declaration === null) return false;
    const holder = declaration.parent ?? null;
    if (holder === null) return false;
    if (holder.type === "Program") return true;
    if (holder.type !== "ExportNamedDeclaration") return false;
    return TOP_NODES.includes(holder.parent?.type ?? "");
}

/** The keys of an object literal `as const`, or null where the value is anything else. */
function readVocabularyKeys(init: AstNode | null): string[] | null {
    if (init === null) return null;
    if (init.type !== "TSAsExpression") return null;
    if (init.typeAnnotation?.typeName?.name !== CONST_NAME) return null;
    const object = init.expression ?? null;
    if (object === null) return null;
    if (object.type !== "ObjectExpression") return null;
    const keys: string[] = [];
    for (const property of object.properties ?? []) {
        const key = readKeyName(property);
        if (key !== null) keys.push(key);
    }
    return keys;
}

function readClass(file: SourceFile, node: AstNode, read: FileNames): void {
    const name = node.id?.name ?? null;
    if (name === null) return;
    const base = node.superClass?.name ?? null;
    read.classes.push({ name, base, path: file.path });
}

/** A key as written: an identifier, or a string that is a name; null where it is computed. */
function readKeyName(node: AstNode): string | null {
    if (node.computed === true) return null;
    const key = node.key ?? null;
    if (key === null) return null;
    if (typeof key.value === "string") return isNameLike(key.value) ? key.value : null;
    return key.name ?? null;
}

/** A name a node states either as a string or as an identifier holding one. */
function readNodeName(value: unknown): string | null {
    if (typeof value === "string") return value;
    if (!isRecord(value)) return null;
    return typeof value.name === "string" ? value.name : null;
}

/** An object literal's key is a field and its method a function; a pattern's key binds nothing. */
function readPropertyName(
    node: AstNode,
    addName: (name: string | null, kind: NameKind) => void,
): void {
    if (node.parent?.type !== "ObjectExpression") return;
    const value = readChildNode(node.value);
    const isFunction = FUNCTION_NODES.some((kind) => kind === value?.type);
    addName(readKeyName(node), isFunction ? NAME_KIND.function : NAME_KIND.field);
}

/**
 * A string literal, kept where a module-level constant holds it, and only if it is a name: not a
 * suite's material, not a figure or a date, which open with a digit, and not a reader's word.
 */
function readHeldString(file: SourceFile, node: AstNode, read: FileNames): void {
    if (typeof node.value !== "string") return;
    if (!isNameLike(node.value)) return;
    if (isDigitAt(node.value, 0)) return;
    if (file.path.startsWith(SUITE_PREFIX)) return;
    let child = node;
    let at = node.parent ?? null;
    for (let depth = 0; at !== null; depth += 1) {
        assert(depth < DEPTH_MAXIMUM, "a parse stays inside the depth a climb states");
        if (at.type === "VariableDeclarator") {
            if (!isTopLevel(at)) return;
            const holder = at.id?.name ?? null;
            if (holder === null) return;
            if (holder.endsWith(WORDS_SUFFIX)) return;
            read.strings.push({ value: node.value, holder, path: file.path });
            return;
        }
        if (!HOLDING_NODES.includes(at.type)) return;
        if (at.type === "Property") {
            if (isSameRange(at.key ?? null, child)) return;
        }
        child = at;
        at = at.parent ?? null;
    }
}

function isSameRange(one: AstNode | null, other: AstNode): boolean {
    if (one === null) return false;
    if (one.range[0] !== other.range[0]) return false;
    return one.range[1] === other.range[1];
}

/** Printable ASCII and no space: what a key, a selector or a class is spelled in. */
function isNameLike(text: string): boolean {
    if (text.length === 0) return false;
    for (const character of text) {
        if (character < PRINTABLE_FIRST) return false;
        if (character > PRINTABLE_LAST) return false;
    }
    return true;
}

/** Every sighting, each class resolved to a failure where its chain ends in `Error`. */
function composeSightings(files: readonly FileNames[]): NameSighting[] {
    const classes = files.flatMap((file) => file.classes);
    assert(classes.length < CLASSES_MAXIMUM, "the tree stays inside the classes its walk states");
    const failures = new Set([FAILURE_ROOT]);
    for (let pass = 0; pass <= classes.length; pass += 1) {
        const grown = classes.filter((one) => failures.has(one.base ?? ""));
        const before = failures.size;
        for (const one of grown) failures.add(one.name);
        if (failures.size === before) break;
    }
    const resolved = classes.map((one) => ({
        name: one.name,
        kind: failures.has(one.name) ? NAME_KIND.failure : NAME_KIND.class,
        path: one.path,
    }));
    return [...files.flatMap((file) => file.sightings), ...resolved];
}

Deno.test("a name in many files is counted, and one in few is placed", () => {
    const few = ["src/core/a.ts", "tests/b.test.ts"];
    assertEquals(formatEntry("`x`", few), "- `x` — `src/core/a.ts`, `tests/b.test.ts`", "placed");
    const many = ["libs/a.ts", "libs/b.ts", "src/ui/c.ts", "tests/d.test.ts"];
    assertEquals(formatEntry("`x`", many), "- `x` — in 4 files: `libs/`, `src/ui/`, `tests/`");
    assertEquals(formatCodeSpan("a`b"), "``a`b``", "a backtick inside widens the span");
    assertEquals(formatCodeSpan("`"), "`` ` ``", "and one at an edge pads it");
    assertEquals(lookupLayer("src/userscript-boot.ts"), "src/", "an entry is the bare layer");
});

/** One line of a list: the name, then where it stands or how widely. */
function formatEntry(name: string, paths: readonly string[]): string {
    if (paths.length <= PATHS_LISTED_MAXIMUM) {
        return `- ${name} — ${paths.map(formatCodeSpan).join(", ")}`;
    }
    const layers = [...new Set(paths.map(lookupLayer))].sort(compareText);
    return `- ${name} — in ${paths.length} files: ${layers.map(formatCodeSpan).join(", ")}`;
}

function lookupLayer(path: string): string {
    return LAYERS.find((layer) => path.startsWith(layer)) ?? path.slice(0, path.indexOf("/") + 1);
}

/**
 * A code span that holds its text whole, backticks included. A space pads the text only where it
 * opens or closes on a backtick, because `deno fmt` strips one that stands anywhere else.
 */
function formatCodeSpan(text: string): string {
    if (!text.includes(SPAN_MARK)) return `${SPAN_MARK}${text}${SPAN_MARK}`;
    const fence = SPAN_MARK + SPAN_MARK;
    const pad = isEdgedBy(text, SPAN_MARK) ? " " : "";
    return `${fence}${pad}${text}${pad}${fence}`;
}

function isEdgedBy(text: string, mark: string): boolean {
    if (text.startsWith(mark)) return true;
    return text.endsWith(mark);
}

function compareText(one: string, other: string): number {
    if (one < other) return -1;
    return one > other ? 1 : 0;
}

Deno.test("docs/names.md lists every name the tree spells, as the tree spells it now", async () => {
    const configuration = parseJsonc(Deno.readTextFileSync(CONFIGURATION_PATH));
    assert(isRecord(configuration), "deno.json is a configuration");
    const manifest = parseJsonc(Deno.readTextFileSync(MANIFEST_PATH));
    assert(isRecord(manifest), "package.json is a manifest");
    const tree: NameTree = {
        files: readSourceFiles(SOURCE_DIRECTORIES).map(readFileNames),
        tracked: readTrackedPaths().filter((path) => !path.startsWith(EVIDENCE_PREFIX)),
        tasks: readRecordKeys(configuration.tasks),
        scripts: readRecordKeys(manifest.scripts),
        purities: readVerbPurities(Deno.readTextFileSync(RULES_PATH)),
    };
    const composed = await formatMarkdown(composeNameRegister(tree));
    if (Deno.args.includes(WRITE_FLAG)) {
        Deno.writeTextFileSync(REGISTER_PATH, composed);
        return;
    }
    const written = Deno.readTextFileSync(REGISTER_PATH);
    assertStrictEquals(lookupFirstDifference(written, composed), null, "run `deno task names`");
});

/**
 * The text as `deno fmt` leaves it, under this tree's configuration: it wraps a long line of a list
 * or a paragraph at the width `deno.json` states, and a register composed to that width by hand
 * would be a second formatter to keep level with the first.
 */
async function formatMarkdown(text: string): Promise<string> {
    const command = new Deno.Command(Deno.execPath(), {
        args: ["fmt", "--ext", "md", "-"],
        stdin: "piped",
        stdout: "piped",
    });
    const child = command.spawn();
    const writer = child.stdin.getWriter();
    await writer.write(new TextEncoder().encode(text));
    await writer.close();
    const output = await child.output();
    assert(output.success, "deno fmt formats the register");
    return new TextDecoder().decode(output.stdout);
}

function readTrackedPaths(): string[] {
    const asked = new Deno.Command("git", { args: ["ls-files"], stdout: "piped" }).outputSync();
    assert(asked.success, "git names what it tracks");
    const paths = new TextDecoder().decode(asked.stdout).split("\n").filter((one) => one !== "");
    assert(paths.length > 0, "and it tracks something");
    return paths;
}

function readRecordKeys(value: unknown): string[] {
    assert(isRecord(value), "a configuration's tasks are a record");
    return Object.keys(value).sort(compareText);
}

/** The whole register, in the order its sections stand. */
function composeNameRegister(tree: NameTree): string {
    const sightings = composeSightings(tree.files);
    const lines = [
        "# Names",
        "",
        "Every name this tree spells, composed off it by `tests/repository/name-register.test.ts`,",
        "which fails while this file and the tree disagree; `deno task names` writes it again. A name",
        "is listed by what declares it and where it stands, and whether it is the right name is",
        `\`AGENTS.md\`'s to say. A name standing in more than ${PATHS_LISTED_MAXIMUM} files is given`,
        "as a count and the layers it stands in. The files under `captures/` are evidence rather",
        "than names of ours: only the paths the code spells to them are listed.",
        "",
        `## ${SECTION_HEADINGS[NAME_KIND.function]}`,
        "",
        "By the verb a name opens with, and the purity N2 states for that verb.",
    ];
    lines.push(...composeFunctionLines(sightings, tree.purities));
    for (const kind of LAYERED_KINDS) {
        lines.push("", `## ${SECTION_HEADINGS[kind]}`);
        lines.push(...composeLayeredLines(sightings.filter((one) => one.kind === kind)));
    }
    lines.push(...composeVocabularyLines(tree.files.flatMap((file) => file.vocabularies)));
    lines.push(...composeStringLines(tree.files.flatMap((file) => file.strings)));
    lines.push("", "## Tasks", "", `### ${formatCodeSpan(CONFIGURATION_PATH)}`, "");
    lines.push(...tree.tasks.map((task) => `- ${formatCodeSpan(task)}`));
    lines.push("", `### ${formatCodeSpan(MANIFEST_PATH)}`, "");
    lines.push(...tree.scripts.map((script) => `- ${formatCodeSpan(script)}`));
    lines.push(...composeTreeLines(tree.tracked));
    return lines.join("\n") + "\n";
}

/** The functions, a run per verb: N2's verbs in its order, then every other alphabetically. */
function composeFunctionLines(
    sightings: readonly NameSighting[],
    purities: ReadonlyMap<string, Purity>,
): string[] {
    const functions = sightings.filter((one) => one.kind === NAME_KIND.function);
    const byVerb = new Map<string, NameSighting[]>();
    for (const one of functions) {
        const verb = readVerb(one.name);
        byVerb.set(verb, [...(byVerb.get(verb) ?? []), one]);
    }
    const tabled = [...purities.keys()].filter((verb) => byVerb.has(verb));
    const other = [...byVerb.keys()].filter((verb) => !purities.has(verb)).sort(compareText);
    const lines: string[] = [];
    for (const verb of [...tabled, ...other]) {
        const purity = purities.get(verb);
        const stated = purity === undefined ? "not in N2's table" : purity;
        const heading = verb === "" ? "No verb" : `${formatCodeSpan(verb)} — ${stated}`;
        lines.push("", `### ${heading}`, "");
        lines.push(...composeEntryLines(byVerb.get(verb) ?? []));
    }
    return lines;
}

/** One entry per name, sorted, each with every file it stands in. */
function composeEntryLines(sightings: readonly NameSighting[]): string[] {
    const pathsByName = new Map<string, Set<string>>();
    for (const one of sightings) {
        const paths = pathsByName.get(one.name) ?? new Set<string>();
        paths.add(one.path);
        pathsByName.set(one.name, paths);
    }
    return [...pathsByName.keys()].sort(compareText).map((name) => {
        const paths = [...(pathsByName.get(name) ?? [])].sort(compareText);
        return formatEntry(formatCodeSpan(name), paths);
    });
}

/** A section's names, a run per layer, in the order `LAYERS` states them. */
function composeLayeredLines(sightings: readonly NameSighting[]): string[] {
    const lines: string[] = [];
    for (const layer of LAYERS) {
        const standing = sightings.filter((one) => lookupLayer(one.path) === layer);
        if (standing.length === 0) continue;
        lines.push("", `### ${formatCodeSpan(layer)}`, "");
        lines.push(...composeEntryLines(standing));
    }
    return lines;
}

function composeVocabularyLines(vocabularies: readonly Vocabulary[]): string[] {
    const lines = ["", "## Vocabularies", "", "Each `as const` object of a module, by its keys."];
    for (const layer of LAYERS) {
        const standing = vocabularies.filter((one) => lookupLayer(one.path) === layer);
        if (standing.length === 0) continue;
        lines.push("", `### ${formatCodeSpan(layer)}`, "");
        const sorted = [...standing].sort((one, other) => compareText(one.name, other.name));
        for (const one of sorted) {
            const keys = one.keys.map(formatCodeSpan).join(", ");
            lines.push(`- ${formatCodeSpan(one.name)} — ${formatCodeSpan(one.path)}: ${keys}`);
        }
    }
    return lines;
}

/** The strings, a run per file, each with the constants that hold it. */
function composeStringLines(strings: readonly HeldString[]): string[] {
    const lines = [
        "",
        "## Strings held by name",
        "",
        "Every string a module-level constant of the program or its tools holds, by the file that spells",
        "it: the game's keys and fields, the store's keys, the sheet's classes and variables, the page's",
        "attributes. Text is left out: a string with a space or a letter past ASCII, one opening with a",
        "digit, which is a figure or a date, and a word a `…_WORDS` table holds for the reader. So is a",
        "suite's material.",
    ];
    const paths = [...new Set(strings.map((one) => one.path))].sort(compareText);
    for (const path of paths) {
        lines.push("", `### ${formatCodeSpan(path)}`, "");
        const holdersByValue = new Map<string, Set<string>>();
        for (const one of strings.filter((held) => held.path === path)) {
            const holders = holdersByValue.get(one.value) ?? new Set<string>();
            holders.add(one.holder);
            holdersByValue.set(one.value, holders);
        }
        for (const value of [...holdersByValue.keys()].sort(compareText)) {
            const holders = [...(holdersByValue.get(value) ?? [])].sort(compareText);
            const spelled = formatCodeSpan(JSON.stringify(value));
            lines.push(`- ${spelled} — ${holders.map(formatCodeSpan).join(", ")}`);
        }
    }
    return lines;
}

/** Every directory a tracked file stands in, then every tracked file. */
function composeTreeLines(tracked: readonly string[]): string[] {
    const directories = new Set<string>();
    for (const path of tracked) {
        let at = path.indexOf("/");
        for (let depth = 0; at !== -1; depth += 1) {
            assert(depth < DEPTH_MAXIMUM, "a path stays inside the depth its walk states");
            directories.add(path.slice(0, at + 1));
            at = path.indexOf("/", at + 1);
        }
    }
    const lines = ["", "## Directories", ""];
    lines.push(...[...directories].sort(compareText).map((one) => `- ${formatCodeSpan(one)}`));
    lines.push("", "## Files", "");
    lines.push(...[...tracked].sort(compareText).map((one) => `- ${formatCodeSpan(one)}`));
    return lines;
}

/** Where two texts first part, by line, or null where they are one text. */
function lookupFirstDifference(written: string, composed: string): string | null {
    const writtenLines = written.split("\n");
    const composedLines = composed.split("\n");
    const count = Math.max(writtenLines.length, composedLines.length);
    for (let index = 0; index < count; index += 1) {
        const one = writtenLines[index];
        const other = composedLines[index];
        if (one !== other) return `line ${index + 1}: written ${one}, composed ${other}`;
    }
    return null;
}
