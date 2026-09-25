/**
 * ADR 0004: the frozen readings are `develop`'s at `DEVELOP_REVISION`, byte for byte. The
 * figures are held to `develop`'s drawn on those tables (W8), so a table refreshed on one side
 * alone would be a difference no code made. Refreshing is `develop`'s routine, and a reading moves
 * here only with the revision.
 */

import { assert, assertEquals } from "@std/assert";
import { readSourceFiles, type SourceFile } from "#/tests/source-tree.ts";
import { DEVELOP_REVISION } from "#/tests/recording-sources.ts";

Deno.test("a reading unlike develop's is flagged, one alike is not, and one develop lacks is", () => {
    const develop = new Map([["frozen/one.ts", "a\n"], ["frozen/two.ts", "b\n"]]);
    const found = lookupFrozenDrift([
        { path: "frozen/one.ts", text: "a\n" },
        { path: "frozen/two.ts", text: "B\n" },
        { path: "frozen/three.ts", text: "c\n" },
    ], (path) => develop.get(path) ?? null);
    assertEquals(found, [
        `frozen/two.ts is not develop's at ${DEVELOP_REVISION}`,
        `frozen/three.ts is no reading develop has at ${DEVELOP_REVISION}`,
    ], "a letter of the same length is a difference, and a file of this branch's own is one too");
});

function lookupFrozenDrift(
    files: readonly SourceFile[],
    readDevelop: (path: string) => string | null,
): string[] {
    const found: string[] = [];
    for (const file of files) {
        const held = readDevelop(file.path);
        if (held === null) {
            found.push(`${file.path} is no reading develop has at ${DEVELOP_REVISION}`);
        } else if (held !== file.text) {
            found.push(`${file.path} is not develop's at ${DEVELOP_REVISION}`);
        }
    }
    return found;
}

Deno.test("every frozen reading here is develop's at the revision the recordings are read at", () => {
    const files = readSourceFiles(["frozen"]);
    assert(files.length > 0, "the tables the bundle carries are read, or the guard holds nothing");
    assertEquals(lookupFrozenDrift(files, readDevelopText), [], "ADR 0004");
});

/** Null where the revision has no such file: `git show` refuses it rather than answering empty. */
function readDevelopText(path: string): string | null {
    const output = new Deno.Command("git", {
        args: ["show", `${DEVELOP_REVISION}:${path}`],
        stdout: "piped",
        stderr: "null",
    }).outputSync();
    if (!output.success) return null;
    return new TextDecoder().decode(output.stdout);
}
