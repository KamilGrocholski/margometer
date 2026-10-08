/** The one question asked of a string arriving from outside: is it a word of ours. */

import { AssertionError, assertStrictEquals, assertThrows } from "@std/assert";
import { isOneOf } from "#/libs/vocabulary.ts";

const SHAPE = { round: "round", square: "square", digit: "1" } as const;
const SHAPES = Object.values(SHAPE);

Deno.test("a word of the vocabulary is one, and anything else is not", () => {
    assertStrictEquals(isOneOf(SHAPES, "round"), true, "a member");
    assertStrictEquals(isOneOf(SHAPES, "oval"), false, "a string that is no member");
    assertStrictEquals(isOneOf(SHAPES, "Round"), false, "nor one spelled in another case");
    assertStrictEquals(isOneOf(SHAPES, "1"), true, "a member spelled in digits");
    assertStrictEquals(isOneOf(SHAPES, 1), false, "is not the number it spells");
    assertStrictEquals(isOneOf(SHAPES, null), false, "and nothing is no word");
});

Deno.test("a vocabulary of one word holds it, and one of none is a broken call", () => {
    assertStrictEquals(isOneOf(["round"], "round"), true, "one word is a vocabulary");
    assertThrows(
        () => isOneOf([], "round"),
        AssertionError,
        "a vocabulary holds at least one word",
    );
});
