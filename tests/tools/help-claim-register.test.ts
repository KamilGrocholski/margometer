/**
 * The register's claims about the published help, read back into phrases. The phrases below are
 * invented: what a reader of the real register finds is `tests/repository/protocol-keys.test.ts`'s.
 */

import { assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import {
    parseBacktickedPhrases,
    parseCitedHelpPhrases,
    parseHelpClaim,
    PHRASES_MAXIMUM,
} from "#/tools/help-claim-register.ts";
import { HelpArticleError } from "#/tools/margometer-tool-error.ts";

Deno.test("every backticked phrase is read, in order, and an unclosed one is none", () => {
    assertEquals(parseBacktickedPhrases("names `evade` and `parry`"), ["evade", "parry"], "both");
    assertEquals(parseBacktickedPhrases("names `evade` and `parry"), ["evade"], "and one closed");
    assertEquals(parseBacktickedPhrases("names nothing"), [], "and none where none is");
});

Deno.test("a claim naming past the bound is refused, and one at it is read whole", () => {
    const naming = (count: number) => parseBacktickedPhrases("`phrase` ".repeat(count));
    assertStrictEquals(naming(PHRASES_MAXIMUM).length, PHRASES_MAXIMUM, "every phrase at it");
    assertThrows(() => naming(PHRASES_MAXIMUM + 1), HelpArticleError, "more than the");
});

Deno.test("a claim naming no phrase is refused, and one naming a phrase is read", () => {
    assertEquals(parseHelpClaim("_Help:_ names `evade`.", 3)?.phrases, ["evade"], "one phrase");
    assertThrows(() => parseHelpClaim("_Help:_ names nothing cited.", 3), HelpArticleError, ":3");
});

Deno.test("an empty phrase cited is refused, and a phrase of one character is read", () => {
    assertEquals(
        parseCitedHelpPhrases("_Help:_ names `a`."),
        ["a"],
        "one character says something",
    );
    assertThrows(() => parseCitedHelpPhrases("_Help:_ names ``."), HelpArticleError, "empty");
});
