/**
 * The module written to stop the order belonging to the machine, held to
 * answering what it was written to answer.
 *
 * ⚠️ **It existed for two audits with nothing executing either function.** Its
 * only appearance under `tests/` was as a path string in
 * `tests/tools/source-layout.test.ts`, where it is named as the file allowed to
 * spell `localeCompare` — a claim about *where* the call may live, which says
 * nothing about what it answers. So the fix for "the order belongs to the machine
 * rather than to the data" was itself held by nothing: the guard would have
 * stayed green if `getCollatedTextOrder` returned the locale-default order it was
 * written to replace
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F11).
 */

import { describe, expect, test } from "bun:test";
import { getCollatedTextOrder, getTextOrder } from "@/libs/text-order.ts";

describe("order a machine compares", () => {
  test("is the same three answers a comparator owes", () => {
    expect(getTextOrder("a", "b")).toBe(-1);
    expect(getTextOrder("b", "a")).toBe(1);
    expect(getTextOrder("a", "a")).toBe(0);
  });

  /**
   * The point of it: by code unit, so the answer is a property of the data and
   * not of the machine. `ł` sits after `z` here, which is **wrong** as an
   * alphabet and right as a sort — the collated reader below is where an alphabet
   * is asked for.
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

describe("order a person reads", () => {
  /**
   * The one that would have gone unnoticed. In Polish, `ł` belongs between `l`
   * and `m`; by code unit it lands after `z`. If this returned the deterministic
   * order the guard about `localeCompare` would still pass, and the panel would
   * put a name in a place a reader does not look for it.
   */
  test("puts a letter where the stated language puts it", () => {
    expect(getCollatedTextOrder("ł", "m", "pl")).toBe(-1);
    expect(getCollatedTextOrder("ł", "l", "pl")).toBe(1);
    // And it is genuinely a different answer from the deterministic reader,
    // which is the whole reason there are two.
    expect(getTextOrder("ł", "m")).toBe(1);
  });

  test("orders a list the way that language does", () => {
    const sorted = ["zebra", "łoś", "lis", "mysz"].sort((one, other) =>
      getCollatedTextOrder(one, other, "pl"),
    );
    expect(sorted).toEqual(["lis", "łoś", "mysz", "zebra"]);
  });

  /**
   * The locale is a required parameter, and this is what that buys: two languages
   * disagreeing about one pair. In Swedish `ä` sorts after `z`; in German it
   * sorts with `a`. A defaulted locale would silently pick whichever the machine
   * had.
   */
  test("gives a different answer for a different language", () => {
    expect(getCollatedTextOrder("ä", "z", "sv")).toBe(1);
    expect(getCollatedTextOrder("ä", "z", "de")).toBe(-1);
  });

  test("says nothing separates a word from itself", () => {
    expect(getCollatedTextOrder("łoś", "łoś", "pl")).toBe(0);
  });
});
