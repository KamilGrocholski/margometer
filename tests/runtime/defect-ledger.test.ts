/**
 * What could not be done, and how often: counted per kind and region, and the first of a kind
 * written to the console as one line, never per render (`AGENTS.md` E9).
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { RESULT_FAILURE } from "#/libs/result.ts";
import { DEFECT_KIND, initDefectLedger } from "#/src/runtime/defect-ledger.ts";
import { PANEL_DEFECT_KIND, PANEL_REGION } from "#/src/ui/panel-words.ts";

/** Past this the ledger stops counting, restated here on purpose: it is not exported. */
const COUNT_STATED = 1048576;

const FIRST = { kind: RESULT_FAILURE.invariantBroken, cause: "first" } as const;
const SECOND = { kind: RESULT_FAILURE.invariantBroken, cause: "second" } as const;

Deno.test("the first defect of a kind writes one line, and the rest are counted", () => {
    const { ledger, lines } = composeLedger();
    ledger.add({ kind: DEFECT_KIND.reading, region: null, failure: FIRST });
    assertEquals(lines, [[DEFECT_KIND.reading, FIRST]], "one line, with the failure beside it");
    ledger.add({ kind: DEFECT_KIND.reading, region: null, failure: SECOND });
    ledger.add({ kind: DEFECT_KIND.reading, region: null, failure: SECOND });
    assertStrictEquals(lines.length, 1, "and no second line for the same kind");
    const counts = ledger.getCounts();
    const row = { kind: DEFECT_KIND.reading, region: null, count: 3, first: FIRST };
    assertEquals(counts, [row], "three, and the first");
});

function composeLedger() {
    const lines: [string, unknown][] = [];
    const ledger = initDefectLedger({
        writeBrandedLine: (kind, detail) => void lines.push([kind, detail]),
    });
    return { ledger, lines };
}

Deno.test("counts are kept per kind, and each kind has its own line", () => {
    const { ledger, lines } = composeLedger();
    assertEquals(ledger.getCounts(), [], "a ledger nothing was added to holds nothing");
    ledger.add({ kind: DEFECT_KIND.file, region: null, failure: FIRST });
    ledger.add({ kind: DEFECT_KIND.engine, region: null, failure: SECOND });
    ledger.add({ kind: DEFECT_KIND.file, region: null, failure: SECOND });
    assertEquals(
        lines.map(([kind]) => kind),
        [DEFECT_KIND.file, DEFECT_KIND.engine],
        "a line each",
    );
    const counts = ledger.getCounts().map((one) => [one.kind, one.count]);
    assertEquals(counts, [[DEFECT_KIND.file, 2], [DEFECT_KIND.engine, 1]], "and a count each");
});

Deno.test("what the ledger hands out is a copy, so a reader cannot move a count (S9)", () => {
    const { ledger } = composeLedger();
    ledger.add({ kind: DEFECT_KIND.kept, region: null, failure: FIRST });
    const handed = ledger.getCounts();
    const row = handed[0];
    if (row !== undefined) row.count = 99;
    assertStrictEquals(ledger.getCounts()[0]?.count, 1, "the ledger's own count is untouched");
});

/** Reached by adding: a million adds take well under a second, and the bound is what is proved. */
Deno.test("the count stops at its bound, and counts to it", () => {
    const { ledger, lines } = composeLedger();
    for (let added = 0; added < COUNT_STATED - 1; added += 1) {
        ledger.add({ kind: DEFECT_KIND.region, region: null, failure: FIRST });
    }
    assertStrictEquals(ledger.getCounts()[0]?.count, COUNT_STATED - 1, "one short of the bound");
    ledger.add({ kind: DEFECT_KIND.region, region: null, failure: FIRST });
    assertStrictEquals(ledger.getCounts()[0]?.count, COUNT_STATED, "at the bound");
    ledger.add({ kind: DEFECT_KIND.region, region: null, failure: FIRST });
    assertStrictEquals(ledger.getCounts()[0]?.count, COUNT_STATED, "and no further past it");
    assertStrictEquals(lines.length, 1, "with still one line");
});

Deno.test("a kind drawn in two regions is two rows, and one line", () => {
    const { ledger, lines } = composeLedger();
    ledger.add({ kind: DEFECT_KIND.region, region: PANEL_REGION.list, failure: FIRST });
    ledger.add({ kind: DEFECT_KIND.region, region: PANEL_REGION.tip, failure: SECOND });
    ledger.add({ kind: DEFECT_KIND.region, region: PANEL_REGION.list, failure: SECOND });
    const rows = ledger.getCounts().map((one) => [one.region, one.count]);
    assertEquals(rows, [[PANEL_REGION.list, 2], [PANEL_REGION.tip, 1]], "a row per region");
    assertEquals(lines, [[DEFECT_KIND.region, FIRST]], "and the kind said once");
});

/**
 * The panel words every defect the runtime keeps, and imports nothing from the runtime to do it
 * (`docs/design.md` §4), so the two lists are held to each other here.
 */
Deno.test("every defect the runtime keeps is one the panel has words for", () => {
    const kept = Object.values(DEFECT_KIND).sort();
    assertEquals(kept, Object.values(PANEL_DEFECT_KIND).sort(), "the same kinds, both ways");
});
