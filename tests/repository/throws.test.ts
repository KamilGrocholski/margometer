/**
 * E1, E3 and E13: nothing the bundle carries throws on purpose except an assertion; a failure class
 * of the bundle names itself, by a `name` spelled as its class is and by no other class of it; and
 * outside the bundle nothing extends `Error` but the one base file `tools/` owns.
 */

import { assert, assertEquals } from "@std/assert";
import {
    type AstNode,
    composeSample,
    formatNodePlace,
    readAstNodes,
    readBundleFiles,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

const TOOL_ERROR_PATH = "tools/margometer-tool-error.ts";
const ERROR_NAME = "Error";
const NAME_FIELD = "name";
const CLASS_NODES = ["ClassDeclaration", "ClassExpression"];
/** Everything but the bundle, which `readBundleFiles` reads apart. */
const TERMINAL_DIRECTORIES = ["tools", "tests"];

Deno.test("a throw is flagged, and a word in a string is not", () => {
    const sample = composeSample(['const said = "throw";', "throw new Error(said);"]);
    assertEquals(lookupThrows(sample), ["sample.ts:2"], "the statement alone");
});

function lookupThrows(file: SourceFile): string[] {
    return readAstNodes(file, ["ThrowStatement"]).map((throwStatement) =>
        formatNodePlace(file, throwStatement)
    );
}

Deno.test("a class extending Error is flagged in either spelling, and another is not", () => {
    const sample = composeSample([
        "class Refusal extends Error {}",
        "const Late = class extends Error {};",
        "class Reader extends Base {}",
    ]);
    assertEquals(lookupErrorClasses(sample), ["sample.ts:1", "sample.ts:2"], "both spellings");
});

function lookupErrorClasses(file: SourceFile): string[] {
    if (file.path === TOOL_ERROR_PATH) return [];
    return readErrorClasses(file).map((errorClass) => formatNodePlace(file, errorClass));
}

function readErrorClasses(file: SourceFile): AstNode[] {
    return readAstNodes(file, CLASS_NODES).filter((errorClass) =>
        errorClass.superClass?.name === ERROR_NAME
    );
}

Deno.test("a failure class naming itself passes, and one naming nothing or another is flagged", () => {
    const sample = composeSample([
        'class Refused extends Error { override readonly name = "Refused"; }',
        "class Silent extends Error { readonly count = 0; }",
        'class Borrowed extends Error { override readonly name = "Refused"; }',
        'const Late = class extends Error { override readonly name = "Late"; };',
    ]);
    assertEquals(
        lookupUnnamedFailures(sample),
        ["sample.ts:2", "sample.ts:3", "sample.ts:4"],
        "no name, another class's name, and a class with no name of its own to match",
    );
});

/** A failure class whose `name` is not the literal of its own class name. */
function lookupUnnamedFailures(file: SourceFile): string[] {
    const unnamed: string[] = [];
    for (const errorClass of readErrorClasses(file)) {
        const declared = errorClass.id?.name;
        if (declared === undefined) unnamed.push(formatNodePlace(file, errorClass));
        else if (readStatedName(errorClass) !== declared) {
            unnamed.push(formatNodePlace(file, errorClass));
        }
    }
    return unnamed;
}

/** The literal a class assigns its `name` field in its body, or null where it assigns none. */
function readStatedName(errorClass: AstNode): string | null {
    const body = errorClass.body;
    if (body === null || body === undefined || Array.isArray(body)) return null;
    const members = Array.isArray(body.body) ? body.body : [];
    for (const member of members) {
        if (member.type !== "PropertyDefinition") continue;
        if (member.key?.name !== NAME_FIELD) continue;
        const statedName = isRecordNode(member.value) ? member.value.value : undefined;
        return typeof statedName === "string" ? statedName : null;
    }
    return null;
}

function isRecordNode(candidate: unknown): candidate is { value?: unknown } {
    return typeof candidate === "object" && candidate !== null;
}

Deno.test("nothing the bundle carries throws on purpose", () => {
    assertEquals(readBundleFiles().flatMap(lookupThrows), [], "E1");
});

Deno.test("every failure class of the bundle names itself, by a name no other class takes", () => {
    const files = readBundleFiles();
    assertEquals(files.flatMap(lookupUnnamedFailures), [], "E3");
    const names = files.flatMap(readErrorClasses).map((errorClass) => errorClass.id?.name ?? "");
    const repeated = names.filter((name, nameIndex) => names.indexOf(name) !== nameIndex);
    assertEquals(repeated, [], "FAILURE_FATES is keyed by the name, so one name is one class");
    assert(names.length > 0, "and the bundle has failure classes to read");
});

Deno.test("nothing outside the bundle extends Error but the tools' base", () => {
    assertEquals(readSourceFiles(TERMINAL_DIRECTORIES).flatMap(lookupErrorClasses), [], "E13");
});
