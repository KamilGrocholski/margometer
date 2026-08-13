import { describe, expect, test } from "bun:test";
import {
  composeCombatantRoster,
  getCombatantIdByName,
  type RosteredCombatant,
} from "@/src/core/combatant-roster.ts";

/**
 * The rule the module's own docblock calls "the failure this project exists to
 * prevent", held directly for the first time.
 *
 * It had no test of its own — covered through `fight-decoder.test.ts` and
 * `fight-statistics.test.ts`, which use it and cannot say which half broke
 * (`docs/audits/2026-08-13-the-whole-tree-read-once.md`, F5).
 */

function composeCombatant(id: number, name: string): RosteredCombatant {
  return { id, name, side: 1, profession: null, level: null };
}

describe("matching a name the protocol states to the combatant it means", () => {
  test("a name only one combatant answers to resolves to them", () => {
    const roster = composeCombatantRoster([composeCombatant(1, "one"), composeCombatant(2, "two")]);
    expect(getCombatantIdByName(roster, "one")).toBe(1);
    expect(getCombatantIdByName(roster, "two")).toBe(2);
  });

  /**
   * One captured fight fields two combatants called the same thing. Attributing
   * real damage to the wrong one is worse than attributing it to nobody, so the
   * answer is nobody rather than the first match.
   */
  test("a name two combatants answer to resolves to nobody", () => {
    const roster = composeCombatantRoster([
      composeCombatant(1, "same"),
      composeCombatant(2, "same"),
    ]);
    expect(getCombatantIdByName(roster, "same")).toBeNull();
  });

  /**
   * ⚠️ Ambiguity is two **combatants**, not two entries — the fix this test was
   * written for. The roster used to mark a name ambiguous on the second entry
   * carrying it, so the same person listed twice made their own name resolve to
   * nobody, and every figure the protocol stated against it went unattributed.
   *
   * No caller reached it: `composeMergedCombatants` deduplicates by id and so
   * does `tests/captured-fight-catalog.ts`. That is exactly the shape a latent
   * fault has — an invariant that is real, load-bearing and stated nowhere,
   * waiting for a third caller.
   */
  test("the same person listed twice is still that person", () => {
    const roster = composeCombatantRoster([
      composeCombatant(1, "twice"),
      composeCombatant(1, "twice"),
    ]);
    expect(getCombatantIdByName(roster, "twice")).toBe(1);
    expect(roster.byId.size).toBe(1);
  });

  test("a repeat does not undo an ambiguity already found", () => {
    const roster = composeCombatantRoster([
      composeCombatant(1, "same"),
      composeCombatant(2, "same"),
      composeCombatant(1, "same"),
    ]);
    expect(getCombatantIdByName(roster, "same")).toBeNull();
  });

  test("a name nobody carries resolves to nobody", () => {
    const roster = composeCombatantRoster([composeCombatant(1, "one")]);
    expect(getCombatantIdByName(roster, "somebody else")).toBeNull();
  });

  /**
   * ⚠️ Recorded rather than fixed. "Nobody has that name" and "more than one
   * does" come back as the same `null`, which collapses two readings §3 would
   * keep apart. Widening it is a change to what flows between decoder and
   * aggregator (§4, `[ASK]`), and the panel has nothing it would do differently
   * — so the audit declines it, and this is the test that says the collapse is
   * a decision rather than an oversight.
   */
  test("an unknown name and an ambiguous one are the same answer, deliberately", () => {
    const roster = composeCombatantRoster([
      composeCombatant(1, "same"),
      composeCombatant(2, "same"),
    ]);
    expect(getCombatantIdByName(roster, "same")).toBe(getCombatantIdByName(roster, "absent"));
  });

  test("a later entry for one id replaces the earlier one", () => {
    const roster = composeCombatantRoster([
      composeCombatant(1, "before"),
      { ...composeCombatant(1, "after"), level: 120 },
    ]);
    expect(roster.byId.get(1)?.name).toBe("after");
    expect(roster.byId.get(1)?.level).toBe(120);
  });

  test("an empty roster resolves nothing and says so", () => {
    const roster = composeCombatantRoster([]);
    expect(roster.byId.size).toBe(0);
    expect(getCombatantIdByName(roster, "anyone")).toBeNull();
  });
});
