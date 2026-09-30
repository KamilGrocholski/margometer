/**
 * S4: a function called from one place is written in its caller, unless its verb is strong. A
 * function counts as called once where its name is mentioned once in its module, as the callee of
 * that one call; one handed on as a value, exported, or strong is left where it stands.
 */

import { assertEquals } from "@std/assert";
import {
    type AstNode,
    composeSample,
    formatNodePlace,
    lookupCallerDeclaration,
    readAstNodes,
    readDeclaredFunctionName,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";
import { PURITY, readVerb, readVerbPurities, RULES_PATH } from "#/tests/verb-purities.ts";

/** What S4 binds: the program and its tools. A test keeps its helpers. */
const CHECKED_DIRECTORIES = ["libs", "src", "tools"];
const STRONG_VERBS = new Set(
    [...readVerbPurities(Deno.readTextFileSync(RULES_PATH))]
        .filter(([, purity]) => purity === PURITY.strong)
        .map(([verb]) => verb),
);

Deno.test("a function called once, not strong and not exported, is flagged", () => {
    const sample = composeSample([
        "export function run(rows) {",
        "    addRows(rows);",
        "    formatRows(rows);",
        "    rows.forEach(renderRow);",
        "    writeTwice(rows);",
        "    writeTwice(rows);",
        "    const onPress = () => rows;",
        "    onPress();",
        "}",
        "function addRows(rows) { return rows; }",
        "function formatRows(rows) { return rows; }",
        "function renderRow(row) { return row; }",
        "function writeTwice(rows) { return rows; }",
        "export function readRows(rows) { return rows; }",
        "function isShown(rows) { return rows; }",
        "function readShown(rows) { return isShown(rows); }",
        "function createTable() { return 1; }",
        "const TABLE = createTable();",
        "function openWatch() { readEvents().then(() => {}, () => {}); }",
        "async function readEvents() { return 1; }",
        "async function openAll() { await readAll(); }",
        "async function readAll() { return 1; }",
    ]);
    assertEquals(
        lookupCalledOnce(sample, new Set(["format", "is"])),
        [
            "sample.ts:7 onPress, called once by run",
            "sample.ts:10 addRows, called once by run",
            "sample.ts:22 readAll, called once by openAll",
        ],
        "strong, handed on, twice, exported, from the module, or started async are not",
    );
});

/** Every function its module calls at one place, whose verb is not strong and that nobody imports. */
function lookupCalledOnce(file: SourceFile, strong: ReadonlySet<string>): string[] {
    const identifiers = readAstNodes(file, ["Identifier"]);
    const found: string[] = [];
    for (const declaration of readAstNodes(file, ["FunctionDeclaration", "VariableDeclarator"])) {
        const name = readDeclaredFunctionName(declaration);
        if (name === null) continue;
        if (strong.has(readVerb(name))) continue;
        if (declaration.parent?.type === "ExportNamedDeclaration") continue;
        if (declaration.parent?.parent?.type === "ExportNamedDeclaration") continue;
        const declared = declaration.id?.range[0];
        const mentions = identifiers.filter((one) => {
            if (one.name !== name) return false;
            return one.range[0] !== declared;
        });
        if (mentions.length !== 1) continue;
        const call = mentions[0]!.parent;
        if (call?.type !== "CallExpression") continue;
        if (call.callee?.range[0] !== mentions[0]!.range[0]) continue;
        const caller = lookupCallerDeclaration(call);
        if (caller === null) continue;
        if (isStartedAsync(declaration, caller)) continue;
        const callerName = readDeclaredFunctionName(caller);
        found.push(`${formatNodePlace(file, declaration)} ${name}, called once by ${callerName}`);
    }
    return found.sort((one, other) => readLine(one) - readLine(other));
}

/** An `async` function a synchronous caller starts: only a function can hold its awaits. */
function isStartedAsync(declaration: AstNode, caller: AstNode): boolean {
    if (readFunctionNode(declaration).async !== true) return false;
    return readFunctionNode(caller).async !== true;
}

function readFunctionNode(declaration: AstNode): AstNode {
    if (declaration.type === "FunctionDeclaration") return declaration;
    return declaration.init ?? declaration;
}

function readLine(found: string): number {
    const from = found.indexOf(":") + 1;
    return Number(found.slice(from, found.indexOf(" ", from)));
}

Deno.test("no function of the program is called from one place and stands apart", () => {
    const files = readSourceFiles(CHECKED_DIRECTORIES);
    assertEquals(files.flatMap((file) => lookupCalledOnce(file, STRONG_VERBS)), [], "S4");
});
