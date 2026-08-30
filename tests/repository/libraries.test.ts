/**
 * `libs/` against the one sentence that defines it: it knows nothing of this project.
 *
 * Two readers, because one is not enough. An import can be seen by walking specifiers, and that
 * catches a layer reached for. What it cannot catch is a file that imports nothing and knows
 * anyway — `src/core/protocol-number.ts` carries a count taken over `captures/` and would have
 * passed an import test unchanged. **ADR 0020.**
 */

import { assert, assertEquals } from "@std/assert";
import { getCodeOutsideStrings } from "@/tests/source-line.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";

const LIBRARY_ROOT = "libs/";
/** Both roots below a layer. Neither may reach up into one; only `libs/` is held to the words. */
const LAYERLESS_ROOTS = ["libs/", "project/"];
/** Every directory a layer lives in. A file reaching into one of these belongs inside it. */
const LAYER_PREFIXES = ["@/src/", "@/tools/", "@/tests/", "@/frozen/"];
/** What a library must not be able to name. Lower case: the reader folds before it looks. */
const PROJECT_WORDS = ["captures", "margonem", "margometer"];

/** The specifier of an `import … from "…"` line, or the empty string. */
function getImportSpecifier(line: string): string {
    const code = getCodeOutsideStrings(line).trimStart();
    if (!code.startsWith("import ")) return "";
    const raw = line.trimStart();
    const from = raw.indexOf(' from "');
    if (from === -1) return "";
    const start = from + ' from "'.length;
    const end = raw.indexOf('"', start);
    if (end === -1) return "";
    assert(end >= start, "a specifier ends at or after it begins");
    assert(start > 0, "and begins after the word that introduces it");
    return raw.slice(start, end);
}

/** Every layer a file's imports reach into, named by the prefix that gave it away. */
function getLayersReached(text: string): string[] {
    const found: string[] = [];
    for (const line of text.split("\n")) {
        const specifier = getImportSpecifier(line);
        if (specifier === "") continue;
        for (const prefix of LAYER_PREFIXES) {
            if (specifier.startsWith(prefix)) found.push(specifier);
        }
    }
    assert(found.length <= text.length, "no more reaches than there is text");
    return found;
}

/** Every word of this project's own the text names, folded so a capital cannot hide one. */
function getProjectWordsNamed(text: string): string[] {
    const folded = text.toLowerCase();
    const found: string[] = [];
    for (const word of PROJECT_WORDS) {
        if (folded.includes(word)) found.push(word);
    }
    assert(found.length <= PROJECT_WORDS.length, "a word is reported once");
    return found;
}

function getPathsUnder(roots: readonly string[]): string[] {
    const found = getSourcePaths().filter((path) => roots.some((one) => path.startsWith(one)));
    assert(found.length > 0, "there is something below a layer to read");
    assert(found.every((path) => path.endsWith(".ts")), "and it is TypeScript");
    return found;
}

Deno.test("nothing below a layer reaches up into one", () => {
    const reaching = 'import { x } from "@/src/core/fight-decoder.ts";\n';
    assertEquals(getLayersReached(reaching).length, 1, "a layer import is found");
    const clean =
        'import { assert } from "@std/assert";\nimport { y } from "@/libs/text-walk.ts";\n';
    assertEquals(getLayersReached(clean), [], "@std and a sibling are not a layer");
    const quoted = 'const said = "import { x } from \\"@/src/a.ts\\";";\n';
    assertEquals(getLayersReached(quoted), [], "a specifier inside a string is not an import");

    const wrong: string[] = [];
    for (const path of getPathsUnder(LAYERLESS_ROOTS)) {
        for (const one of getLayersReached(Deno.readTextFileSync(path))) {
            wrong.push(`${path} reaches ${one}`);
        }
    }
    assertEquals(wrong, [], "ADR 0020: a file below a layer that reached up into one");
});

Deno.test("a library names nothing of this project", () => {
    assertEquals(
        getProjectWordsNamed("measured over captures/, 2026-08-28"),
        ["captures"],
        "found",
    );
    assertEquals(
        getProjectWordsNamed("The bundle MargoMeter builds"),
        ["margometer"],
        "and folded",
    );
    assertEquals(getProjectWordsNamed("a run of digits ends inside the text"), [], "and not found");

    const wrong: string[] = [];
    for (const path of getPathsUnder([LIBRARY_ROOT])) {
        for (const word of getProjectWordsNamed(Deno.readTextFileSync(path))) {
            wrong.push(`${path} names ${word}`);
        }
    }
    assertEquals(wrong, [], "ADR 0020: a library that knows what it is for");
});
