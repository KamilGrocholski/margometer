/**
 * The module written to stop the order belonging to the machine, held to answering what
 * it was written to answer.
 *
 * ⚠️ **It existed for two audits with nothing executing either function.** Its only
 * appearance under `tests/` was as a path string in
 * `tests/tools/source-layout.test.ts`, where it was named as the file allowed to spell
 * `localeCompare` — a claim about *where* the call may live, which says nothing about
 * what it answers. So the fix for "the order belongs to the machine rather than to the
 * data" was itself held by nothing.
 *
 * The collated reader those tests covered is gone with its last caller — the panel's
 * tie-break, which is the fight's own roster order now. `localeCompare` is spelled
 * nowhere in the tree, and `tests/tools/source-layout.test.ts` holds that rather than
 * holding an owner for it.
 */

import { describe, expect, test } from "bun:test";
import { getTextOrder } from "@/libs/text-order.ts";

describe("order a machine compares", () => {
  test("is the same three answers a comparator owes", () => {
    expect(getTextOrder("a", "b")).toBe(-1);
    expect(getTextOrder("b", "a")).toBe(1);
    expect(getTextOrder("a", "a")).toBe(0);
  });

  /**
   * The point of it: by code unit, so the answer is a property of the data and
   * not of the machine. `ł` sits after `z` here, which is **wrong** as an
   * alphabet and right as a sort — nothing in this tree sorts names for a reader
   * any more, and where it did, the game's own order took over.
   */
  test("is by code unit and not by anybody's alphabet", () => {
    expect(getTextOrder("ł", "z")).toBe(1);
    expect(getTextOrder("Z", "a")).toBe(-1);
  });

  test("sorts the same list the same way whatever the machine thinks", () => {
    const sorted = ["ł", "z", "a", "Z"].sort(getTextOrder);
    expect(sorted).toEqual(["Z", "a", "z", "ł"]);
  });

  // A comparator that is not a total order sorts differently depending on where
  // the runtime starts, which is the failure this whole module is against.
  test("agrees with itself in both directions, over every pair", () => {
    const words = ["", "a", "A", "ab", "b", "ł", "z", "Z", "0", "10", "9"];
    for (const one of words) {
      for (const other of words) {
        // `Math.sign` rather than a negation, because `-0` is not `0` to
        // `toBe` and a comparator answering zero both ways is exactly right.
        expect(Math.sign(getTextOrder(one, other)), `${one} vs ${other}`).toBe(
          -Math.sign(getTextOrder(other, one)) || 0,
        );
      }
    }
  });
});
