/**
 * The counter five files had written out by hand.
 *
 * A test of its own rather than coverage through its callers, which is the
 * lesson `libs/text-order.ts` is still an open finding for: a module written to
 * remove a duplication and then held by nothing would stay green if it returned
 * something else entirely
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F11).
 */

import { describe, expect, test } from "bun:test";
import {
  getTotalOfValues,
  getTotalsByInnerKey,
  setPairRunningTotal,
  setRunningTotal,
} from "@/libs/running-total.ts";

describe("adding to a running total", () => {
  test("starts a key nobody has counted yet at zero", () => {
    const totals = new Map<string, number>();
    setRunningTotal(totals, "a", 5);

    expect([...totals]).toEqual([["a", 5]]);
  });

  test("adds to what a key already carries", () => {
    const totals = new Map([["a", 5]]);
    setRunningTotal(totals, "a", 3);

    expect(totals.get("a")).toBe(8);
  });

  // Both sides of the boundary, and a subtraction is what the health witness
  // hands it: the replay counts damage down and healing up through one reader.
  test("counts down as readily as up, and settles on zero rather than skipping it", () => {
    const totals = new Map<string, number>();
    setRunningTotal(totals, "a", 5);
    setRunningTotal(totals, "a", -5);

    expect(totals.get("a")).toBe(0);
    expect(totals.has("a")).toBe(true);
  });

  // Adding nothing is a measurement of nothing, so the key exists afterwards.
  // §9.6 keeps "counted nothing" and "was never counted" apart, and a reader
  // that skipped a zero would merge them.
  test("records a key added to by nothing", () => {
    const totals = new Map<string, number>();
    setRunningTotal(totals, "a", 0);

    expect(totals.get("a")).toBe(0);
  });

  test("keeps keys apart", () => {
    const totals = new Map<string, number>();
    setRunningTotal(totals, "a", 1);
    setRunningTotal(totals, "b", 2);

    expect([...totals].sort()).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });

  // Numbers as keys, because that is what every caller in `src/` uses: a
  // combatant id. A reader keyed to strings would have been silently useless to
  // four of the five sites it replaced.
  test("counts against a key that is not text", () => {
    const totals = new Map<number, number>();
    setRunningTotal(totals, 7, 3);
    setRunningTotal(totals, 7, 4);

    expect(totals.get(7)).toBe(7);
  });
});

describe("adding to a total per pair", () => {
  test("starts both levels where neither has been seen", () => {
    const pairs = new Map<number, Map<string, number>>();
    setPairRunningTotal(pairs, 1, "dmg", 5);

    expect([...(pairs.get(1) ?? [])]).toEqual([["dmg", 5]]);
  });

  test("adds to an inner key the outer one already holds", () => {
    const pairs = new Map<number, Map<string, number>>();
    setPairRunningTotal(pairs, 1, "dmg", 5);
    setPairRunningTotal(pairs, 1, "dmg", 2);

    expect(pairs.get(1)?.get("dmg")).toBe(7);
  });

  /**
   * The one that matters, and the reason this is a reader of its own: the outer
   * key's missing entry has to become a map while the inner one's becomes a
   * zero. A caller composing two `??`s gets that wrong by dropping whatever the
   * outer key already held.
   */
  test("keeps what the outer key already held", () => {
    const pairs = new Map<number, Map<string, number>>();
    setPairRunningTotal(pairs, 1, "dmg", 5);
    setPairRunningTotal(pairs, 1, "heal", 2);
    setPairRunningTotal(pairs, 2, "dmg", 9);

    expect([...(pairs.get(1) ?? [])].sort()).toEqual([
      ["dmg", 5],
      ["heal", 2],
    ]);
    expect(pairs.get(2)?.get("dmg")).toBe(9);
  });
});

describe("what a map of totals comes to", () => {
  // Empty is zero because a map holding nothing has counted nothing, which is
  // the same argument the `?? 0` above rests on — and the boundary a caller
  // subtracting this from a row's own figure stands on (§7.5).
  test("nothing counted comes to nothing", () => {
    expect(getTotalOfValues(new Map<string, number>())).toBe(0);
  });

  test("one key comes to what that key carries", () => {
    expect(getTotalOfValues(new Map([["a", 5]]))).toBe(5);
  });

  test("adds every key, not the first or the last", () => {
    expect(
      getTotalOfValues(
        new Map([
          ["a", 5],
          ["b", 3],
          ["c", 1],
        ]),
      ),
    ).toBe(9);
  });

  // A total counted down is what the health witness hands the writing half, so
  // the reading half has to answer the same way rather than clamping.
  test("counts a negative as a negative", () => {
    expect(
      getTotalOfValues(
        new Map([
          ["a", 5],
          ["b", -8],
        ]),
      ),
    ).toBe(-3);
  });
});

describe("a total per inner key", () => {
  test("nothing folds to nothing", () => {
    expect([...getTotalsByInnerKey(new Map<number, Map<string, number>>())]).toEqual([]);
  });

  /**
   * The whole of what this reader is for: the outer key is summed **away**, so
   * two combatants who both dealt `dmg` come back as one entry holding both.
   * Written out at the call site, that is a nested walk somebody eventually
   * writes as a single level
   * (`docs/audits/2026-08-21-the-code-read-for-its-smells.md`, F12).
   */
  test("adds an inner key across every outer one", () => {
    const pairs = new Map<number, Map<string, number>>([
      [
        1,
        new Map([
          ["dmg", 5],
          ["dmgf", 2],
        ]),
      ],
      [2, new Map([["dmg", 3]])],
    ]);

    expect([...getTotalsByInnerKey(pairs)].sort()).toEqual([
      ["dmg", 8],
      ["dmgf", 2],
    ]);
  });

  test("keeps an inner key only one outer key carries", () => {
    const pairs = new Map<number, Map<string, number>>([
      [1, new Map([["dmg", 5]])],
      [2, new Map([["heal", 4]])],
    ]);

    expect(getTotalsByInnerKey(pairs).get("heal")).toBe(4);
  });

  // The map that comes back is the caller's own: `getDamageWithoutActorByElement`
  // reads it against a second map and would otherwise be writing into the row it
  // was handed.
  test("hands back a map nobody else is holding", () => {
    const inner = new Map([["dmg", 5]]);
    const totals = getTotalsByInnerKey(new Map([[1, inner]]));
    totals.set("dmg", 99);

    expect(inner.get("dmg")).toBe(5);
  });
});
