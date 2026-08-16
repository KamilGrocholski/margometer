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
import { setPairRunningTotal, setRunningTotal } from "@/libs/running-total.ts";

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
