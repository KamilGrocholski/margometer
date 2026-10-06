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
    assertStrictEquals(
        FAILURE_FATES.MargonemEngineAlreadyWrapped,
        FAILURE_FATE.standDown,
        "a second copy",
    );
    assertStrictEquals(
        FAILURE_FATES.UnreadMessage,
        FAILURE_FATE.shownAsSuspect,
        "an unread message",
    );
    assertStrictEquals(
        FAILURE_FATES.MargonemValueAbsent,
        FAILURE_FATE.shownAsUnknown,
        "a reading the page did not give",
    );
    assertStrictEquals(
        FAILURE_FATES.Caught,
        FAILURE_FATE.byPlace,
        "a throw, a defect of its step or a reading of the page unknown",
    );
    assertStrictEquals(FAILURE_FATES.StoreRefused, FAILURE_FATE.byPlace, "a store, by its place");
    assertStrictEquals(FAILURE_FATES.EverySlotPinned, FAILURE_FATE.shelfAnswer, "a shelf");
});

Deno.test("a failure that leaves no mark by design is none, and never by its place", () => {
    assertStrictEquals(
        FAILURE_FATES.WrapCovered,
        FAILURE_FATE.none,
        "a wrap covered, which only a test's detach meets",
    );
    assertStrictEquals(
        FAILURE_FATES.MargonemEngineWarriorsAbsent,
        FAILURE_FATE.none,
        "a board of nobody, for the file and the tooltip alike",
    );
});
