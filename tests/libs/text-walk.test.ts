/**
 * The walk: where a run of digits ends, what counts as one, and where a quoted literal closes.
 */

import { assertEquals, AssertionError, assertStrictEquals, assertThrows } from "@std/assert";
import {
    getEndOfRun,
    isDigitAt,
    isDigitRun,
    isWhitespaceAt,
    LITERAL_CHARACTERS_MAXIMUM,
    lookupQuotedLiteral,
    RUN_CHARACTERS_MAXIMUM,
} from "#/libs/text-walk.ts";

Deno.test("a digit is told from its neighbours in the character table", () => {
    assertStrictEquals(isDigitAt("0", 0), true, "the lowest digit is one");
    assertStrictEquals(isDigitAt("9", 0), true, "and so is the highest");
    assertStrictEquals(isDigitAt("/", 0), false, "the character below the digits is not");
    assertStrictEquals(isDigitAt(":", 0), false, "and neither is the one above them");
    assertStrictEquals(isDigitAt("1", 1), false, "past the end of the text there is nothing");
});

Deno.test("a run ends where its first non-member stands, and is empty where none match", () => {
    assertStrictEquals(getEndOfRun("12a", 0, isDigitAt), 2, "a run stops at a letter");
    assertStrictEquals(getEndOfRun("a12", 0, isDigitAt), 0, "and one that never starts is empty");
    assertStrictEquals(getEndOfRun("a12", 1, isDigitAt), 3, "a run may run to the end");
    assertStrictEquals(getEndOfRun("", 0, isDigitAt), 0, "empty text holds no run");
});

Deno.test("a run is walked up to the bound on its length, and a run reaching it is broken", () => {
    const longest = " ".repeat(RUN_CHARACTERS_MAXIMUM - 1);
    assertStrictEquals(
        getEndOfRun(`${longest}a`, 0, isWhitespaceAt),
        RUN_CHARACTERS_MAXIMUM - 1,
        "a run one short of the bound is read",
    );
    assertThrows(
        () => getEndOfRun(`${longest} a`, 0, isWhitespaceAt),
        AssertionError,
        "a run ends inside the bound on its length",
    );
    assertStrictEquals(isDigitRun("1".repeat(RUN_CHARACTERS_MAXIMUM - 1)), true, "under the bound");
    assertStrictEquals(isDigitRun("1".repeat(RUN_CHARACTERS_MAXIMUM)), false, "and none at it");
});

Deno.test("a position is a whole one, never before the text", () => {
    assertThrows(() => isWhitespaceAt("a b", 1.5), AssertionError, "a whole position");
    assertThrows(() => isWhitespaceAt("a b", -1), AssertionError, "never before the text");
    assertThrows(() => lookupQuotedLiteral(`"a"`, 0.5), AssertionError, "a whole position");
});

Deno.test("digits and nothing else are a run, and empty text is not one", () => {
    assertStrictEquals(isDigitRun("0"), true, "one digit is a run");
    assertStrictEquals(isDigitRun("01"), true, "and so are two");
    assertStrictEquals(isDigitRun(""), false, "empty text is no run");
    assertStrictEquals(isDigitRun("1 "), false, "and a space ends one before the text does");
});

Deno.test("a quoted literal is read in any of the three quotings, and an open one is none", () => {
    assertEquals(lookupQuotedLiteral(`x "ab" y`, 2), { text: "ab", end: 6 });
    assertEquals(lookupQuotedLiteral("'a'", 0), { text: "a", end: 3 });
    assertEquals(lookupQuotedLiteral("`a`", 0), { text: "a", end: 3 });
    assertEquals(lookupQuotedLiteral(`""`, 0), { text: "", end: 2 }, "an empty literal is one");
    assertStrictEquals(lookupQuotedLiteral(`"ab`, 0), null, "a literal never closed is none");
    assertStrictEquals(lookupQuotedLiteral("ab", 0), null, "and no quote opens none");
    assertStrictEquals(lookupQuotedLiteral("", 0), null);
});

Deno.test("a literal is read up to the bound on its length, and a walk past it is a broken one", () => {
    const longest = "a".repeat(LITERAL_CHARACTERS_MAXIMUM);
    assertEquals(
        lookupQuotedLiteral(`"${longest}"`, 0),
        { text: longest, end: LITERAL_CHARACTERS_MAXIMUM + 2 },
        "a literal at the bound is read",
    );
    assertThrows(
        () => lookupQuotedLiteral(`"${longest}a"`, 0),
        AssertionError,
        "a literal closes inside the bound on its length",
    );
});
