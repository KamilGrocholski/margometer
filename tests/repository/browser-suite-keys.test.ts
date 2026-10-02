/**
 * N13's other half: the browser suite spells the store keys a second time, because Node cannot
 * import a module that reaches `jsr:`. Every `…_KEY` constant it declares holds a key `STORE_KEY`
 * names, so a key renamed in `src/ports/browser-store.ts` reddens here rather than in a browser.
 */

import { assert, assertEquals } from "@std/assert";
import { STORE_KEY } from "#/src/ports/browser-store.ts";
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
    const sampleKeys = readSuiteKeys(sample);
    assertEquals(sampleKeys.found, 2, "both key constants are read, and the selector is not");
    assertEquals(
        sampleKeys.unknown,
        ['sample.ts:2 PLACE_KEY holds "MargoMeter-plac"'],
        "the misspelt",
    );
});

function readSuiteKeys(file: SourceFile): { found: number; unknown: string[] } {
    const unknown: string[] = [];
    let keysFound = 0;
    for (const declarator of readAstNodes(file, ["VariableDeclarator"])) {
        const name = declarator.id?.name ?? "";
        if (!name.endsWith(KEY_SUFFIX)) continue;
        const held = declarator.init?.value;
        if (typeof held !== "string") continue;
        keysFound += 1;
        if (STORE_KEYS.includes(held)) continue;
        unknown.push(`${formatNodePlace(file, declarator)} ${name} holds "${held}"`);
    }
    return { found: keysFound, unknown };
}

Deno.test("every store key the browser suite spells is one the add-on writes", () => {
    const reads = readSourceFiles(["tests/e2e"]).map(readSuiteKeys);
    const keysFound = reads.reduce((sum, suiteKeys) => sum + suiteKeys.found, 0);
    assert(keysFound >= KEYS_FOUND_MINIMUM, `the suite names its keys: ${keysFound} read`);
    assertEquals(reads.flatMap((suiteKeys) => suiteKeys.unknown), [], "N13");
});
