/**
 * The register's claims about the published help, read back into phrases. The phrases below are
 * invented: what a reader of the real register finds is `tests/repository/protocol-keys.test.ts`'s.
 */

import { assertEquals, AssertionError, assertStrictEquals, assertThrows } from "@std/assert";
import { parseBacktickedPhrases, PHRASES_MAXIMUM } from "#/tools/help-claim-register.ts";

Deno.test("every backticked phrase is read, in order, and an unclosed one is none", () => {
    assertEquals(parseBacktickedPhrases("names `evade` and `parry`"), ["evade", "parry"], "both");
    assertEquals(parseBacktickedPhrases("names `evade` and `parry"), ["evade"], "and one closed");
    assertEquals(parseBacktickedPhrases("names nothing"), [], "and none where none is");
});

Deno.test("a claim naming past the bound is refused, and one at it is read whole", () => {
    const naming = (count: number) => parseBacktickedPhrases("`phrase` ".repeat(count));
    assertStrictEquals(naming(PHRASES_MAXIMUM).length, PHRASES_MAXIMUM, "every phrase at it");
    assertThrows(() => naming(PHRASES_MAXIMUM + 1), AssertionError, "the bound");
});
