/**
 * A number held between two ends, at every side of them.
 *
 * The case worth stating is the range with no room in it: a caller clamping into space that has
 * run out asks for a top below the bottom, and the answer must be the bottom rather than the top.
 */

import { assertStrictEquals } from "@std/assert";
import { clampNumber } from "#/libs/number-range.ts";

Deno.test("a value inside its range is the value, and outside it is the end it passed", () => {
    assertStrictEquals(clampNumber(5, 0, 10), 5, "a value between two ends is itself");
    assertStrictEquals(clampNumber(0, 0, 10), 0, "a value standing on the bottom is the bottom");
    assertStrictEquals(clampNumber(10, 0, 10), 10, "and one standing on the top is the top");
    assertStrictEquals(clampNumber(1, 0, 10), 1, "the neighbour of the bottom is inside");
    assertStrictEquals(clampNumber(9, 0, 10), 9, "and so is the neighbour of the top");

    assertStrictEquals(clampNumber(-1, 0, 10), 0, "a value below the bottom is held at it");
    assertStrictEquals(clampNumber(11, 0, 10), 10, "and one above the top is held at that");
});

Deno.test("a range with no room in it answers its bottom", () => {
    assertStrictEquals(clampNumber(5, 0, -3), 0, "a top below the bottom leaves only the bottom");
    assertStrictEquals(clampNumber(-5, 0, -3), 0, "whichever side the value came from");
    assertStrictEquals(clampNumber(5, 4, 4), 4, "a range of one holds that one");
    assertStrictEquals(clampNumber(3, 4, 4), 4, "from either side of it");
});

Deno.test("a range below nothing is a range like any other", () => {
    assertStrictEquals(clampNumber(-5, -10, -1), -5, "a value between two ends below nothing");
    assertStrictEquals(clampNumber(0, -10, -1), -1, "and zero is above that range, not inside it");
});
