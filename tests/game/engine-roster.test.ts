import { describe, expect, test } from "bun:test";
import type { RosteredCombatant } from "@/src/core/combatant-roster.ts";
import {
  composeBattleRoster,
  composeCombatantsFromBattle,
  composeMergedCombatants,
  composeRosteredCombatant,
  getOurSideFromBattle,
} from "@/src/game/engine-roster.ts";

/**
 * The layer that decides which side is ours, held directly.
 *
 * It had no test of its own until an audit went looking
 * (`docs/audits/2026-08-13-the-whole-tree-read-once.md`, F1) — six exports named
 * by nothing, reached only through `battle-session.test.ts`, which exercises
 * them as a dependency and therefore cannot say which of them broke.
 *
 * Two things here are contracts rather than behaviour. `composeMergedCombatants`
 * returns the **same array reference** when a fragment adds nothing, and the
 * session skips re-reading the fight on that identity — a comment said so and
 * nothing held it. And `getOurSideFromBattle` is the single thing `core` cannot
 * know (§10, *side*): null is a real answer, and a wrong one puts every row
 * under the wrong heading.
 */

function composeCombatant(over: Partial<RosteredCombatant> = {}): RosteredCombatant {
  return { id: 1, name: "one", side: 1, profession: "m", level: 100, ...over };
}

describe("one warrior off the live object", () => {
  test("reads what a row needs", () => {
    expect(composeRosteredCombatant({ id: 7, team: 2, name: "seven", prof: "w", lvl: 120 })).toEqual(
      { id: 7, name: "seven", side: 2, profession: "w", level: 120 },
    );
  });

  /**
   * ⚠️ An id the game stated as text is **not** read, and this asymmetry is
   * deliberate rather than an oversight: `getIntegerFromValue` refuses anything
   * that is not already a number (§9.5's "from a value" reader), while
   * `isFightStart` in `src/game/battle-session.ts` goes out of its way to read
   * `init` both ways because the captures state `"1"` and the client compares
   * with `==`.
   *
   * Recorded here so the next person who meets a dropped warrior knows which of
   * the two readings this file made, and that nothing in the material has ever
   * needed the other one.
   */
  test("drops an id the game stated as text rather than reading it", () => {
    expect(composeRosteredCombatant({ id: "7", team: 2, name: "seven" })).toBeNull();
    expect(composeRosteredCombatant({ id: 7, team: "2", name: "seven" })).toBeNull();
  });

  test.each([
    ["no id", { team: 1, name: "one" }],
    ["no side", { id: 1, name: "one" }],
    ["no name", { id: 1, team: 1 }],
    ["an empty name", { id: 1, team: 1, name: "" }],
    ["a name that is not text", { id: 1, team: 1, name: 5 }],
    ["an unreadable id", { id: "not a number", team: 1, name: "one" }],
  ])("drops an entry with %s rather than filling it in", (_why, value) => {
    expect(composeRosteredCombatant(value)).toBeNull();
  });

  test.each([["null", null], ["a number", 5], ["text", "one"], ["nothing", undefined]])(
    "answers null for %s rather than throwing into the game",
    (_what, value) => {
      expect(composeRosteredCombatant(value)).toBeNull();
    },
  );

  // A profession nobody stated must not be drawn as though it had one: the panel
  // colours a bar by it, and an empty string would take the first colour going.
  test.each([["absent", undefined], ["empty", ""], ["not text", 3]])(
    "leaves a profession that is %s as null",
    (_what, prof) => {
      expect(composeRosteredCombatant({ id: 1, team: 1, name: "one", prof })?.profession).toBeNull();
    },
  );
});

describe("the warriors a battle states", () => {
  const battle = {
    w: {
      "11": { id: 11, team: 1, name: "one", prof: "m", lvl: 100 },
      "22": { id: 22, team: 2, name: "two" },
    },
  };

  test("reads them keyed by id, taking the id from the entry", () => {
    expect(composeCombatantsFromBattle(battle).map((one) => one.id)).toEqual([11, 22]);
  });

  test("drops the unreadable ones and keeps the rest", () => {
    const mixed = { w: { a: { id: 1, team: 1, name: "one" }, b: { name: "no id" }, c: null } };
    expect(composeCombatantsFromBattle(mixed).map((one) => one.name)).toEqual(["one"]);
  });

  test.each([
    ["nothing at all", undefined],
    ["a battle with no warriors", {}],
    ["warriors that are not an object", { w: 5 }],
  ])("answers with an empty list for %s", (_what, value) => {
    expect(composeCombatantsFromBattle(value)).toEqual([]);
  });
});

describe("the side that is ours", () => {
  test.each([
    ["a number", { myteam: 2 }, 2],
    ["zero, which is a side and not an absence", { myteam: 0 }, 0],
  ])("is read from %s", (_what, battle, expected) => {
    expect(getOurSideFromBattle(battle)).toBe(expected);
  });

  /**
   * Read after the game has tidied up at the end of a fight, `myteam` is simply
   * gone. Null is the answer, and it is not a defect: guessing puts every row
   * under the wrong heading, which is worse than showing sides unlabelled.
   */
  test.each([
    ["the game did not say", {}],
    ["the value is text", { myteam: "2" }],
    ["there is no battle", null],
  ])("is null where %s", (_what, battle) => {
    expect(getOurSideFromBattle(battle)).toBeNull();
  });
});

describe("merging a snapshot into what is known", () => {
  const known = [composeCombatant({ id: 1 }), composeCombatant({ id: 2, name: "two" })];

  /**
   * ⚠️ The assertion is `toBe`, not `toEqual`, and that is the whole point. The
   * session decides whether a payload changed anything by comparing this against
   * what it held, and skips re-reading the fight when it did not — so an equal
   * list at a new address is a fight re-read on every payload.
   */
  test("hands back the very same list when nothing is new", () => {
    expect(composeMergedCombatants(known, [])).toBe(known);
    expect(composeMergedCombatants(known, [...known])).toBe(known);
  });

  // Both captured fights contain a call whose warrior list is empty. A roster
  // that vanished would take every name resolution with it.
  test("an empty snapshot takes nobody away", () => {
    expect(composeMergedCombatants(known, [])).toEqual(known);
  });

  test("a new combatant is added at the end", () => {
    const merged = composeMergedCombatants(known, [composeCombatant({ id: 3, name: "three" })]);
    expect(merged.map((one) => one.id)).toEqual([1, 2, 3]);
  });

  /**
   * A rename keeps the roster's size, so a merge that compared counts would call
   * this "nothing happened" and the panel would go on showing the old name.
   */
  test("a correction updates in place and is not mistaken for nothing", () => {
    const merged = composeMergedCombatants(known, [composeCombatant({ id: 2, name: "second" })]);
    expect(merged).not.toBe(known);
    expect(merged.map((one) => one.name)).toEqual(["one", "second"]);
  });

  test.each([
    ["a side", { side: 9 }],
    ["a profession", { profession: "p" }],
    ["a level", { level: 101 }],
  ])("a changed %s is a change", (_what, over) => {
    expect(composeMergedCombatants(known, [composeCombatant(over)])).not.toBe(known);
  });
});

describe("the roster core consumes", () => {
  test("carries the side the game stated beside it, not on every row", () => {
    const built = composeBattleRoster([composeCombatant()], 2);
    expect(built.ourSide).toBe(2);
    expect(built.roster.byId.get(1)?.name).toBe("one");
    expect(Object.keys(composeCombatant())).not.toContain("ourSide");
  });

  test("keeps a side nobody stated as null rather than favouring one", () => {
    expect(composeBattleRoster([composeCombatant()], null).ourSide).toBeNull();
  });
});
