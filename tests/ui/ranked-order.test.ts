/**
 * The order a ranking is drawn in, at the place two rows cannot be told apart by their figure.
 *
 * A comparator that never answers zero leaves two equal rows in whatever order they arrived in,
 * which is how one fight draws two different rankings from the same figures.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { getRankedOrder } from "@/src/ui/ranked-order.ts";

Deno.test("the bigger figure is drawn first, whichever side it arrived on", () => {
    assertEquals(getRankedOrder(9, 4, "a", "b") < 0, true, "the bigger figure comes first");
    assertEquals(getRankedOrder(4, 9, "a", "b") > 0, true, "and the smaller one after it");
    assertEquals(getRankedOrder(1, 0, "a", "b") < 0, true, "one outranks nothing");
    assertEquals(getRankedOrder(0, 1, "a", "b") > 0, true, "and nothing is outranked by one");
});

Deno.test("two figures that are equal are decided by their text", () => {
    assertEquals(getRankedOrder(4, 4, "a", "b"), -1, "the earlier text comes first");
    assertEquals(getRankedOrder(4, 4, "b", "a"), 1, "and the later one after it");
    assertEquals(
        getRankedOrder(0, 0, "a", "b"),
        -1,
        "including where neither figure says anything",
    );
});

Deno.test("two rows nothing tells apart are drawn in the order they arrived", () => {
    assertEquals(getRankedOrder(4, 4, "a", "a"), 0, "an equal figure and an equal text is a tie");
    assertEquals(getRankedOrder(0, 0, "", ""), 0, "and so is nothing against nothing");
});

/**
 * A figure that is not a number used to stop the ranking. It now sorts last, which is a place: a
 * comparator answering `NaN` orders by nothing at all, so the same fight would draw its rows in a
 * different order every time it was drawn. **E14**.
 */
Deno.test("a figure that is not a number sorts last, and the sort stays decided", () => {
    assertStrictEquals(getRankedOrder(10, Number.NaN, "a", "b"), -1, "a stated figure comes first");
    assertStrictEquals(
        getRankedOrder(Number.NaN, 10, "a", "b"),
        1,
        "and one that is not comes after",
    );
    assertStrictEquals(
        getRankedOrder(Number.NaN, Number.NaN, "a", "b"),
        -1,
        "two of them fall back to the text, which is what decides a tie already",
    );
    assertStrictEquals(
        getRankedOrder(Number.POSITIVE_INFINITY, 10, "a", "b"),
        1,
        "and a figure with no end to it is not a figure either",
    );
});
