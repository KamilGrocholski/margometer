/**
 * V5 over the one thing this repository counts most often: its own recordings.
 *
 * The corpus grows, and a sentence that says how big it is stops being true without changing a
 * word. Four such sentences were found stale on 2026-09-10 — `28 recordings` in the structure
 * block against a tree holding thirty, `29 recordings` beside a guard that walks every one of
 * them, and two more — so the size of the corpus is `docs/captured-fights.md`'s to state, in a
 * table something re-earns. Everywhere else cites it or drops the figure.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { readRecordingPaths } from "@/project/repository-layout.ts";

const COUNTED = " recording";
/** More places than this tree writes prose in, so the walk states a bound like every other. */
const MAXIMUM_DOCUMENTS = 256;
/** Where a count is allowed, and what re-earns it: prose is a count nothing recomputes. */
const RE_EARNED: Record<string, string> = {
    // `tests/tools/turn-count.test.ts` composes this figure and asks the document for it word
    // for word: the recordings the game numbered twice, which is fewer than the corpus holds.
    "docs/turns-taken.md": "the recordings a turn count can be asked of",
};

/**
 * Every document that states what is true **now**, which is where a stale count would sit.
 *
 * ⚠️ **`docs/adr/` is not one of them, and neither is `CHANGELOG.md`.** A decision record is a
 * dated snapshot and its own README binds it to keep saying what was decided then, so a count of
 * the corpus inside one is evidence of when it was written rather than a claim about today. This
 * guard read them once and called sixteen of them stale.
 */
function readDocumentPaths(): string[] {
    const found = ["AGENTS.md", "ARCHITECTURE.md", "CONTEXT.md", "DESIGN.md", "PRODUCT.md"];
    found.push("SECURITY.md", "README.md", "README.en.md", "deno.json");
    for (const entry of Deno.readDirSync("docs")) {
        if (entry.isFile) found.push(`docs/${entry.name}`);
    }
    assert(found.length <= MAXIMUM_DOCUMENTS, "the walk stays inside its stated bound");
    return found;
}

/** Where a document states a number of recordings. Walked backwards from the word (**C7**). */
export function getCountedRecordings(text: string): string[] {
    const found: string[] = [];
    for (const [offset, line] of text.split("\n").entries()) {
        let at = line.indexOf(COUNTED);
        for (let held = 0; held < line.length; held += 1) {
            if (at === -1) break;
            let start = at;
            for (let back = 0; back < at; back += 1) {
                const before = line.charAt(start - 1);
                if (before < "0") break;
                if (before > "9") break;
                start -= 1;
            }
            if (start < at) found.push(`${line.slice(start, at)} at ${offset + 1}`);
            at = line.indexOf(COUNTED, at + COUNTED.length);
        }
    }
    return found;
}

Deno.test("the reader finds a count of recordings, and finds none where there is none", () => {
    assertEquals(
        getCountedRecordings("held across all 28 recordings today"),
        ["28 at 1"],
        "a count before the word is the count",
    );
    assertEquals(
        getCountedRecordings("a recording says who wrote it"),
        [],
        "the bare word states no number",
    );
    assertEquals(
        getCountedRecordings("the recording, and 7 recordings beside it"),
        ["7 at 1"],
        "and only the one carrying digits is read",
    );
});

Deno.test("no document states the size of the corpus, which the census owns", () => {
    const paths = readDocumentPaths();
    assert(paths.length > 0, "there are documents to read");
    const stated: string[] = [];
    for (const path of paths) {
        if (path in RE_EARNED) continue;
        for (const one of getCountedRecordings(Deno.readTextFileSync(path))) {
            stated.push(`${path}: ${one}`);
        }
    }
    assertEquals(stated, [], "V5: a count of recordings goes stale where nothing recomputes it");
});

Deno.test("every place allowed to count recordings still counts some", () => {
    assertStrictEquals(Object.keys(RE_EARNED).length, 1, "the register holds what it says it does");
    for (const [path, reason] of Object.entries(RE_EARNED)) {
        assert(reason.length > 0, `${path}: a place in the register says why it is there`);
        const found = getCountedRecordings(Deno.readTextFileSync(path));
        assert(found.length > 0, `${path}: registered as counting recordings, and counts none`);
    }
    assert(readRecordingPaths().length > 0, "and there are recordings for a count to be of");
});
