/**
 * C13: nothing outside the tests asserts a type, in either spelling. `as const` asserts nothing and
 * `satisfies` asks the compiler rather than overriding it, so neither is read as one. No crossing
 * has needed a cast yet, so there is no register; the first one is `[ASK]` and starts it. No file,
 * a test included, silences the compiler with a `@ts-` directive: `deno lint`'s `ban-ts-comment`
 * lets one through that carries a description, so the lint alone does not hold it.
 */

import { assertEquals } from "@std/assert";
import {
    type AstNode,
    composeSample,
    formatNodePlace,
    readAstNodes,
    readCommentTexts,
    readSourceFiles,
    SOURCE_DIRECTORIES,
    type SourceFile,
} from "#/tests/source-tree.ts";

/** Every source directory but `tests/`, which C13 lets keep the cast. */
const CHECKED_DIRECTORIES = ["frozen", "libs", "src", "tools"];
const CONST_NAME = "const";
/** How TypeScript opens every directive that turns a check off or down. */
const DIRECTIVE_OPENER = "@ts-";
/** What may stand before a directive inside its comment: a block comment's stars and the blanks. */
const DIRECTIVE_LEAD = " \t*/";

Deno.test("a cast is flagged in either spelling, and `as const` and `satisfies` are not", () => {
    const sample = composeSample([
        "const one = read() as Reading;",
        "const two = <Reading>read();",
        "const three = { a: 1 } as const;",
        "const four = <const>[1];",
        "const five = { a: 1 } satisfies Shape;",
    ]);
    assertEquals(lookupTypeAssertions(sample), ["sample.ts:1", "sample.ts:2"], "the two casts");
});

function lookupTypeAssertions(file: SourceFile): string[] {
    const casts: string[] = [];
    for (const assertion of readAstNodes(file, ["TSAsExpression", "TSTypeAssertion"])) {
        if (!isConstAssertion(assertion)) casts.push(formatNodePlace(file, assertion));
    }
    return casts;
}

function isConstAssertion(assertion: AstNode): boolean {
    return assertion.typeAnnotation?.typeName?.name === CONST_NAME;
}

Deno.test("nothing outside the tests asserts a type", () => {
    const files = readSourceFiles(CHECKED_DIRECTORIES);
    assertEquals(files.flatMap(lookupTypeAssertions), [], "C13");
});

Deno.test("a `@ts-` directive is flagged in either comment, and one named in prose is not", () => {
    const sample = composeSample([
        "// @ts-ignore",
        "const one = read();",
        "/* @ts-expect-error the reading is late */",
        "const two = read();",
        "// A @ts-ignore here would silence the compiler.",
        "const three = read();",
    ]);
    assertEquals(lookupDirectives(sample), [
        "sample.ts: @ts-ignore",
        "sample.ts: @ts-expect-error the reading is late ",
    ], "the two directives");
});

function lookupDirectives(file: SourceFile): string[] {
    const directives: string[] = [];
    for (const text of readCommentTexts(file)) {
        let characterIndex = 0;
        while (
            characterIndex < text.length && DIRECTIVE_LEAD.includes(text[characterIndex] ?? "")
        ) characterIndex += 1;
        if (text.startsWith(DIRECTIVE_OPENER, characterIndex)) {
            directives.push(`${file.path}: ${text.slice(characterIndex)}`);
        }
    }
    return directives;
}

Deno.test("no file silences the compiler with a directive", () => {
    const files = readSourceFiles(SOURCE_DIRECTORIES);
    assertEquals(files.flatMap(lookupDirectives), [], "C13");
});
