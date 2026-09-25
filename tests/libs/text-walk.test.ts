/**
 * The walk: where a run of digits ends, and what counts as one.
 */

import { assertStrictEquals } from "@std/assert";
import { getEndOfRun, isDigitAt, isDigitRun } from "#/libs/text-walk.ts";

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

Deno.test("digits and nothing else are a run, and empty text is not one", () => {
    assertStrictEquals(isDigitRun("0"), true, "one digit is a run");
    assertStrictEquals(isDigitRun("01"), true, "and so are two");
    assertStrictEquals(isDigitRun(""), false, "empty text is no run");
    assertStrictEquals(isDigitRun("1 "), false, "and a space ends one before the text does");
});
