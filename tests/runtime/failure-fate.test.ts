/**
 * Every failure meets a fate. The table's completeness is the compiler's; what is held here is that
 * every fate is somebody's, and the fates `docs/design.md` §10.5 names outright.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { FAILURE_FATE, FAILURE_FATES } from "#/src/runtime/failure-fate.ts";

Deno.test("every fate the vocabulary names is the fate of some failure", () => {
    const used = new Set(Object.values(FAILURE_FATES));
    const unused = Object.values(FAILURE_FATE).filter((fate) => !used.has(fate));
    assertEquals(unused, [], "a fate nothing meets is a fate that does not exist");
});

Deno.test("the fates §10.5 names outright are the ones the table holds", () => {
    assertStrictEquals(FAILURE_FATES["another-reader"], FAILURE_FATE.standDown, "a second copy");
    assertStrictEquals(FAILURE_FATES["unread"], FAILURE_FATE.shownAsSuspect, "an unread message");
    assertStrictEquals(
        FAILURE_FATES["page-reading-absent"],
        FAILURE_FATE.shownAsUnknown,
        "a reading the page did not give",
    );
    assertStrictEquals(FAILURE_FATES["invariant-broken"], FAILURE_FATE.defect, "a bug of ours");
    assertStrictEquals(FAILURE_FATES["every-slot-pinned"], FAILURE_FATE.shelfAnswer, "a shelf");
});
