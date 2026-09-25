/**
 * N13's other half: the browser suite spells the store keys a second time, because Node cannot
 * import a module that reaches `jsr:`. Every `…_KEY` constant it declares holds a key `STORE_KEY`
 * names, so a key renamed in `src/game/browser-store.ts` reddens here rather than in a browser.
 */

import { assert, assertEquals } from "@std/assert";
import { STORE_KEY } from "#/src/game/browser-store.ts";
import {
    composeSample,
    formatNodePlace,
    readAstNodes,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

const KEY_SUFFIX = "_KEY";
const STORE_KEYS: readonly string[] = Object.values(STORE_KEY);
/** One per window's place and fold, the shelf and the choice: fewer found is a reader gone blind. */
const KEYS_FOUND_MINIMUM = STORE_KEYS.length;

Deno.test("a key constant holding a word no store key is, is flagged", () => {
    const sample = composeSample([
        'const SHELF_KEY = "MargoMeter-fights";',
        'const PLACE_KEY = "MargoMeter-plac";',
        'const HOST_SELECTOR = "#MargoMeter-Panel";',
    ]);
    const read = readSuiteKeys(sample);
    assertEquals(read.found, 2, "both key constants are read, and the selector is not");
    assertEquals(read.unknown, ['sample.ts:2 PLACE_KEY holds "MargoMeter-plac"'], "the misspelt");
});

function readSuiteKeys(file: SourceFile): { found: number; unknown: string[] } {
    const unknown: string[] = [];
    let found = 0;
    for (const declarator of readAstNodes(file, ["VariableDeclarator"])) {
        const name = declarator.id?.name ?? "";
        if (!name.endsWith(KEY_SUFFIX)) continue;
        const held = declarator.init?.value;
        if (typeof held !== "string") continue;
        found += 1;
        if (STORE_KEYS.includes(held)) continue;
        unknown.push(`${formatNodePlace(file, declarator)} ${name} holds "${held}"`);
    }
    return { found, unknown };
}

Deno.test("every store key the browser suite spells is one the add-on writes", () => {
    const reads = readSourceFiles(["tests/e2e"]).map(readSuiteKeys);
    const found = reads.reduce((sum, read) => sum + read.found, 0);
    assert(found >= KEYS_FOUND_MINIMUM, `the suite names its keys: ${found} read`);
    assertEquals(reads.flatMap((read) => read.unknown), [], "N13");
});
