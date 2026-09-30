/**
 * P1, P3 and P4: a function keeps the purity its verb states, a strong function takes readings, and
 * a module holds no state of its own. The purity of each verb is read off N2's table in
 * `AGENTS.md`, never spelled here a second time.
 *
 * ⚠️ **A call is read by name.** A method called on a port, and a handed thing reached through a
 * local alias or a callback's parameter, name nothing a parse can follow, so both are outside this
 * reading, as they are outside S1's.
 */

import { assert, assertEquals } from "@std/assert";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { isOneOf } from "#/libs/vocabulary.ts";
import {
    type AstNode,
    composeSample,
    formatNodePlace,
    indexCallableNames,
    lookupCallerDeclaration,
    NAME_MARK,
    readAstNodes,
    readDeclaredFunctionName,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

const PURITY = { strong: "strong", weak: "weak", none: "none", either: "either" } as const;
type Purity = VocabularyWord<typeof PURITY>;
const PURITIES = Object.values(PURITY);

/** What the section binds: the program and its tools. */
const CHECKED_DIRECTORIES = ["libs", "src", "tools"];
const RULES_PATH = "AGENTS.md";
const VERB_ROW_OPENER = "  | `";
const CELL_SEPARATOR = "|";
const ALTERNATIVE_SEPARATOR = " / ";
const QUOTE = "`";
const PREDICATE_RULE_OPENER = "- **N8.**";
const PREDICATE_RULE_CLOSER = "- **N9.**";
/** The methods of an array, a map and a set that change it where it stands. */
const CHANGING_METHODS = [
    "push",
    "pop",
    "shift",
    "unshift",
    "splice",
    "sort",
    "reverse",
    "fill",
    "copyWithin",
    "set",
    "delete",
    "clear",
    "add",
];
const CHANGING_NODES = ["AssignmentExpression", "UpdateExpression"];
const MUTABLE_COLLECTIONS = ["Map", "Set", "Array"];
/** Past the depth of any member chain here, so the climb to its root carries a stated bound. */
const CHAIN_DEPTH_MAXIMUM = 64;
const TABLE = readVerbPurities(Deno.readTextFileSync(RULES_PATH));

Deno.test("each verb's purity is read off N2's table, and a predicate's off N8", () => {
    const rules = [
        "  | Action | Means | Purity |",
        "  | `init` | Creates | none |",
        "  | `create` / `delete` | Brings / erases | strong / none |",
        "  | `add` / `remove` | Puts / takes | weak |",
        "  | `read` | Takes | either |",
        "- **N8.** Booleans carry a prefix: `is`, `has`.",
        "- **N9.** Something else: `was`.",
    ].join("\n");
    const purities = readVerbPurities(rules);
    assertEquals(
        [...purities.entries()],
        [
            ["init", PURITY.none],
            ["create", PURITY.strong],
            ["delete", PURITY.none],
            ["add", PURITY.weak],
            ["remove", PURITY.weak],
            ["read", PURITY.either],
            ["is", PURITY.strong],
            ["has", PURITY.strong],
        ],
        "one row a verb, a pair split or shared, the predicates strong, and nothing past N8",
    );
});

/** Each verb the rules name, and the purity they state for it. */
function readVerbPurities(rules: string): Map<string, Purity> {
    const purities = new Map<string, Purity>();
    const lines = rules.split("\n");
    for (const line of lines) {
        if (!line.startsWith(VERB_ROW_OPENER)) continue;
        const cells = line.split(CELL_SEPARATOR).map((cell) => cell.trim());
        const verbs = cells[1]!.split(ALTERNATIVE_SEPARATOR).map(readQuoted);
        const stated = cells[3]!.split(ALTERNATIVE_SEPARATOR);
        const isShared = stated.length === 1;
        assert(isShared || verbs.length === stated.length, `${cells[1]} states each a purity`);
        for (let index = 0; index < verbs.length; index += 1) {
            const purity = isShared ? stated[0] : stated[index];
            assert(isOneOf(PURITIES, purity), `${verbs[index]} states a purity N2 names`);
            purities.set(verbs[index]!, purity);
        }
    }
    const opener = lines.findIndex((line) => line.startsWith(PREDICATE_RULE_OPENER));
    assert(opener !== -1, "the rules name the prefixes of a predicate");
    for (const line of lines.slice(opener)) {
        if (line.startsWith(PREDICATE_RULE_CLOSER)) break;
        const words = line.split(QUOTE).filter((_, index) => index % 2 === 1);
        for (const word of words) purities.set(word, PURITY.strong);
    }
    return purities;
}

function readQuoted(cell: string): string {
    assert(cell.startsWith(QUOTE), `${cell} names a verb in code`);
    return cell.slice(QUOTE.length, cell.lastIndexOf(QUOTE));
}

Deno.test("a function's verb is the lower-case run its name opens with", () => {
    assertEquals(readVerb("tallyFightFigures"), "tally", "a verb and its object");
    assertEquals(readVerb("add"), "add", "a verb alone");
    assertEquals(readVerb("settle"), "settle", "a longer word is not the shorter verb");
});

function readVerb(name: string): string {
    let end = 0;
    for (const character of name) {
        if (character !== character.toLowerCase()) break;
        end += character.length;
    }
    return name.slice(0, end);
}

Deno.test("a strong or weak function calling one of none is flagged, and a read is not", () => {
    const sample = composeSample([
        "function tallyRows(rows) { renderRows(rows); readRows(rows); formatRows(rows); }",
        "function addRow(rows) { writeRow(rows); }",
        "function initRows(rows) { renderRows(rows); }",
        "function renderRows(rows) { return rows; }",
        "function readRows(rows) { return rows; }",
        "function formatRows(rows) { return rows; }",
        "function writeRow(rows) { return rows; }",
    ]);
    assertEquals(
        lookupPurityBreaches([sample], TABLE),
        [
            "sample.ts:1 tallyRows, strong, calls renderRows, of none",
            "sample.ts:2 addRow, weak, calls writeRow, of none",
        ],
        "P1",
    );
});

/** Every call from a strong or weak function to one of none, and every handed thing a strong one changes. */
function lookupPurityBreaches(
    files: readonly SourceFile[],
    purities: ReadonlyMap<string, Purity>,
): string[] {
    const found: string[] = [];
    for (const file of files) {
        const known = indexCallableNames(file);
        for (const call of readAstNodes(file, ["CallExpression"])) {
            const callee = known.get(call.callee?.name ?? "");
            if (callee === undefined) continue;
            const caller = lookupCallerDeclaration(call);
            if (caller === null) continue;
            const breach = lookupCallBreach(caller, callee, purities);
            if (breach !== null) found.push(`${formatNodePlace(file, call)} ${breach}`);
        }
        found.push(...lookupHandedChanges(file, purities));
    }
    return found;
}

/** What a call breaks of P1, or null where it keeps it. */
function lookupCallBreach(
    caller: AstNode,
    callee: string,
    purities: ReadonlyMap<string, Purity>,
): string | null {
    const callerName = readDeclaredFunctionName(caller)!;
    const calleeName = callee.slice(callee.indexOf(NAME_MARK) + NAME_MARK.length);
    const callerPurity = getPurity(callerName, purities);
    if (callerPurity === PURITY.none) return null;
    if (callerPurity === PURITY.either) return null;
    if (getPurity(calleeName, purities) !== PURITY.none) return null;
    return `${callerName}, ${callerPurity}, calls ${calleeName}, of none`;
}

function getPurity(name: string, purities: ReadonlyMap<string, Purity>): Purity {
    return purities.get(readVerb(name)) ?? PURITY.none;
}

/** Every change a strong function makes to a parameter: an assignment into it, or a method. */
function lookupHandedChanges(file: SourceFile, purities: ReadonlyMap<string, Purity>): string[] {
    const found: string[] = [];
    for (const changed of readChangedNodes(file)) {
        const root = readRootName(changed);
        if (root === null) continue;
        const caller = lookupCallerDeclaration(changed);
        if (caller === null) continue;
        const name = readDeclaredFunctionName(caller)!;
        if (getPurity(name, purities) !== PURITY.strong) continue;
        if (!readParameterNames(caller).has(root)) continue;
        found.push(
            `${formatNodePlace(file, changed)} ${name}, strong, changes ${root}, ` +
                `which it was handed`,
        );
    }
    return found;
}

/** Every node a file changes in place, by an assignment into it or a method, in the file's order. */
function readChangedNodes(file: SourceFile): AstNode[] {
    const changes = [
        ...readAstNodes(file, CHANGING_NODES).map(readChangedByAssignment),
        ...readAstNodes(file, ["CallExpression"]).map(readChangedByMethod),
    ];
    const found = changes.filter((node) => node !== null);
    return found.sort((one, other) => one.range[0] - other.range[0]);
}

/** What an assignment changes in place — `rows[0]` of `rows[0] = 1` — or null where it rebinds a name. */
function readChangedByAssignment(node: AstNode): AstNode | null {
    const target = node.left ?? node.argument;
    if (target === undefined) return null;
    if (target.type === "Identifier") return null;
    return target;
}

/** The object a call changes where it stands — `rows` of `rows.push(1)` — or null. */
function readChangedByMethod(call: AstNode): AstNode | null {
    const callee = call.callee;
    if (callee?.type !== "MemberExpression") return null;
    if (!CHANGING_METHODS.includes(callee.property?.name ?? "")) return null;
    return callee.object ?? null;
}

/** The identifier a member chain stands on — `rows` of `rows[0]!.cells` — or null. */
function readRootName(node: AstNode): string | null {
    let at: AstNode | undefined = node;
    for (let depth = 0; at !== undefined; depth += 1) {
        assert(depth < CHAIN_DEPTH_MAXIMUM, "a member chain stays inside the depth a climb states");
        if (at.type === "Identifier") return at.name ?? null;
        if (at.type === "MemberExpression") at = at.object;
        else if (at.type === "TSNonNullExpression") at = at.expression;
        else return null;
    }
    return null;
}

/** The names a declared function's parameters bind, destructured ones included. */
function readParameterNames(declaration: AstNode): Set<string> {
    const node = readDeclaredFunction(declaration);
    const names = new Set<string>();
    for (const parameter of node.params ?? []) {
        const pattern = parameter.type === "AssignmentPattern" ? parameter.left! : parameter;
        if (pattern.type === "Identifier") names.add(pattern.name ?? "");
        for (const property of readPatternNames(pattern)) names.add(property);
    }
    return names;
}

/** The function node a declaration holds: itself, or the function a constant is bound to. */
function readDeclaredFunction(declaration: AstNode): AstNode {
    if (declaration.type === "FunctionDeclaration") return declaration;
    const init = declaration.init;
    assert(init !== null && init !== undefined, "a declared function has a body");
    return init;
}

/** The names a destructuring pattern binds, one level deep: `{ rows, cells }` and `[first]`. */
function readPatternNames(pattern: AstNode): string[] {
    const found: string[] = [];
    const members = pattern as unknown as { properties?: AstNode[]; elements?: AstNode[] };
    for (const member of [...(members.properties ?? []), ...(members.elements ?? [])]) {
        const value = (member as unknown as { value?: AstNode }).value ?? member;
        if (value?.type === "Identifier") found.push(value.name ?? "");
    }
    return found;
}

Deno.test("a strong function changing what it is handed is flagged, and what it made is not", () => {
    const sample = composeSample([
        "function tallyRows(rows, { cells }) {",
        "    rows.push(1);",
        "    cells[0]!.count += 1;",
        "    const made = new Map();",
        "    made.set(1, 2);",
        "    const copy = [...rows].sort();",
        "    return copy;",
        "}",
        "function addRow(rows) { rows.push(1); }",
    ]);
    assertEquals(
        lookupPurityBreaches([sample], TABLE),
        [
            "sample.ts:2 tallyRows, strong, changes rows, which it was handed",
            "sample.ts:3 tallyRows, strong, changes cells, which it was handed",
        ],
        "P1",
    );
});

Deno.test("no function of the program breaks the purity its verb states", () => {
    const files = readSourceFiles(CHECKED_DIRECTORIES);
    assert(files.length > 0, "an empty tree is a reader that stopped finding files, not a pass");
    assertEquals(lookupPurityBreaches(files, TABLE), [], "P1");
});

Deno.test("a strong function handed a collection it could change is flagged", () => {
    const sample = composeSample([
        "function tallyRows(rows: Row[], byId: Map<string, Row>, seen: Set<string> | null) {}",
        "function presentRows(rows: readonly Row[], byId: ReadonlyMap<string, Row>) {}",
        "function addRow(rows: Row[]) {}",
    ]);
    assertEquals(
        lookupWritableParameters(sample, TABLE),
        [
            "sample.ts:1 tallyRows is handed rows as Row[]",
            "sample.ts:1 tallyRows is handed byId as Map<string, Row>",
            "sample.ts:1 tallyRows is handed seen as Set<string>",
        ],
        "P3",
    );
});

/** Every parameter of a strong function typed as a collection it could change. */
function lookupWritableParameters(
    file: SourceFile,
    purities: ReadonlyMap<string, Purity>,
): string[] {
    const found: string[] = [];
    for (const declaration of readAstNodes(file, ["FunctionDeclaration", "VariableDeclarator"])) {
        const name = readDeclaredFunctionName(declaration);
        if (name === null) continue;
        if (getPurity(name, purities) !== PURITY.strong) continue;
        for (const parameter of readDeclaredFunction(declaration).params ?? []) {
            const pattern = parameter.type === "AssignmentPattern" ? parameter.left! : parameter;
            const annotation = pattern.typeAnnotation?.typeAnnotation;
            if (annotation === null || annotation === undefined) continue;
            const types = annotation.type === "TSUnionType" ? annotation.types! : [annotation];
            for (const type of types) {
                if (!isWritableCollection(type)) continue;
                const text = file.text.slice(type.range[0], type.range[1]);
                const binding = pattern.name ?? file.text.slice(...pattern.range);
                found.push(
                    `${formatNodePlace(file, declaration)} ${name} is handed ${binding} as ${text}`,
                );
            }
        }
    }
    return found;
}

function isWritableCollection(type: AstNode): boolean {
    if (type.type === "TSArrayType") return true;
    if (type.type !== "TSTypeReference") return false;
    return MUTABLE_COLLECTIONS.includes(type.typeName?.name ?? "");
}

Deno.test("no strong function of the program is handed a collection it could change", () => {
    const files = readSourceFiles(CHECKED_DIRECTORIES);
    assertEquals(files.flatMap((file) => lookupWritableParameters(file, TABLE)), [], "P3");
});

Deno.test("a module's own let, and a collection of its own that it changes, are flagged", () => {
    const sample = composeSample([
        "let count = 0;",
        "export var total = 0;",
        "const SEEN = new Set<string>();",
        "const ROWS = [1, 2];",
        "const HELD = new Map<string, number>();",
        "function addSeen(name) { SEEN.add(name); }",
        "function readHeld(name) { return HELD.get(name); }",
        "function tallyRows() { let local = 0; local += ROWS.length; return local; }",
    ]);
    assertEquals(
        lookupModuleStates(sample),
        ["sample.ts:1 holds count", "sample.ts:2 holds total", "sample.ts:3 changes SEEN"],
        "P4",
    );
});

/** Every top-level `let` or `var`, and every top-level collection the module changes. */
function lookupModuleStates(file: SourceFile): string[] {
    const found: string[] = [];
    const collections = new Map<string, AstNode>();
    for (const declaration of readAstNodes(file, ["VariableDeclaration"])) {
        if (!isTopLevel(declaration)) continue;
        for (const declarator of declaration.declarations ?? []) {
            const name = declarator.id?.name ?? "";
            if (declaration.kind !== "const") {
                found.push(`${formatNodePlace(file, declarator)} holds ${name}`);
            } else if (isCollectionMade(declarator.init)) {
                collections.set(name, declarator);
            }
        }
    }
    const changed = new Set<string>();
    for (const node of readChangedNodes(file)) {
        const root = readRootName(node);
        if (root !== null) changed.add(root);
    }
    for (const [name, declarator] of collections) {
        if (changed.has(name)) found.push(`${formatNodePlace(file, declarator)} changes ${name}`);
    }
    return found;
}

function isTopLevel(declaration: AstNode): boolean {
    const parent = declaration.parent;
    if (parent?.type === "Program") return true;
    if (parent?.type !== "ExportNamedDeclaration") return false;
    return parent.parent?.type === "Program";
}

function isCollectionMade(init: AstNode | null | undefined): boolean {
    if (init === null || init === undefined) return false;
    if (init.type === "ArrayExpression") return true;
    if (init.type !== "NewExpression") return false;
    return MUTABLE_COLLECTIONS.includes(init.callee?.name ?? "");
}

Deno.test("no module of the program holds state of its own", () => {
    const files = readSourceFiles(CHECKED_DIRECTORIES);
    assertEquals(files.flatMap(lookupModuleStates), [], "P4");
});
