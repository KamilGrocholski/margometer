/**
 * The walk: where a run of digits ends, what counts as one, and where a quoted literal closes.
 */

import {
    assertEquals,
    assertInstanceOf,
    AssertionError,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import {
    getEndOfRun,
    isDigitAt,
    isDigitRun,
    isWhitespaceAt,
    LITERAL_CHARACTERS_MAXIMUM,
    LiteralTooLong,
    lookupEndOfRun,
    lookupQuotedLiteral,
    RUN_CHARACTERS_MAXIMUM,
} from "#/libs/text-walk.ts";

/** One backslash, spelt where a raw template cannot end on one. */
const ESCAPE = "\\";

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

Deno.test("a run is walked up to the bound its caller states, and one reaching it is none", () => {
    assertStrictEquals(lookupEndOfRun("12a", 0, 3, isDigitAt), 2, "a run one short of the bound");
    assertStrictEquals(lookupEndOfRun("123a", 0, 3, isDigitAt), null, "and one reaching it");
    assertStrictEquals(lookupEndOfRun("a", 0, 1, isDigitAt), 0, "no run is under a bound of one");
    assertStrictEquals(
        lookupEndOfRun("1", 0, 1, isDigitAt),
        null,
        "while one character reaches it",
    );
    assertStrictEquals(lookupEndOfRun("a12", 1, 3, isDigitAt), 3, "counted from where it starts");
    assertThrows(() => lookupEndOfRun("1", 0, 0, isDigitAt), AssertionError, "of at least one");
    assertStrictEquals(lookupEndOfRun("12", 2, 3, isDigitAt), 2, "a run at the text's end is none");
    assertThrows(() => lookupEndOfRun("12", 3, 3, isDigitAt), AssertionError, "nor past its end");
});

Deno.test("whitespace is what HTML and JavaScript both take for it, and nothing else", () => {
    assertStrictEquals(isWhitespaceAt("\f", 0), true, "a form feed is");
    assertStrictEquals(
        isWhitespaceAt("\v", 0),
        false,
        "while a vertical tab is JavaScript's alone",
    );
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

Deno.test("a literal closes on the quote that opened it, and an escape takes what follows", () => {
    assertEquals(lookupQuotedLiteral(`"a'b"`, 0), { text: "a'b", end: 5 }, "another quote is text");
    assertStrictEquals(lookupQuotedLiteral(`"a'`, 0), null, "and closes nothing");
    assertEquals(
        lookupQuotedLiteral(String.raw`"a\"b"`, 0),
        { text: String.raw`a\"b`, end: 6 },
        "an escaped quote of its own kind is text",
    );
    assertEquals(
        lookupQuotedLiteral(String.raw`"a\\"b`, 0),
        { text: String.raw`a\\`, end: 5 },
        "and an escaped escape leaves the quote after it closing",
    );
    assertStrictEquals(lookupQuotedLiteral(`"a${ESCAPE}`, 0), null, "an escape at the end too");
});

/** Text a literal is looked for in comes from outside, so one past the bound is an answer. */
Deno.test("a literal is read up to the bound on its length, and one past it is answered so", () => {
    // The bound counts looks, and the closing quote is one of them, as a run's end is.
    const longest = "a".repeat(LITERAL_CHARACTERS_MAXIMUM - 1);
    assertEquals(
        lookupQuotedLiteral(`"${longest}"`, 0),
        { text: longest, end: LITERAL_CHARACTERS_MAXIMUM + 1 },
        "the longest literal under the bound is read",
    );
    const past = lookupQuotedLiteral(`"${longest}a"`, 0);
    assertInstanceOf(past, LiteralTooLong, "and one past it is too long, not none");
    assertStrictEquals(past.maximum, LITERAL_CHARACTERS_MAXIMUM, "saying the bound");
});
