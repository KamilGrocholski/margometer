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

import { describe, expect, test } from "bun:test";
import { getRecordOrArrayFromValue } from "@/libs/record.ts";
import type { RosteredCombatant } from "@/src/core/combatant-roster.ts";
import {
  composeBattleRoster,
  composeRosterFragmentFromBattle,
  composeMergedCombatants,
  composeRosteredCombatant,
  composeStatedHealthByCombatantId,
  getOurSideFromBattle,
} from "@/src/game/engine-roster.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

function composeCombatant(over: Partial<RosteredCombatant> = {}): RosteredCombatant {
  return { id: 1, name: "one", side: 1, profession: "m", level: 100, maximumHealth: null, ...over };
}

describe("one warrior off the live object", () => {
  test("reads what a row needs", () => {
    expect(composeRosteredCombatant({ id: 7, team: 2, name: "seven", prof: "w", lvl: 120 })).toEqual(
      { id: 7, name: "seven", side: 2, profession: "w", level: 120, maximumHealth: null },
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
    const fragment = composeRosterFragmentFromBattle(battle);

    expect(fragment.combatants.map((one) => one.id)).toEqual([11, 22]);
    expect(fragment.unreadableEntries).toBe(0);
  });

  test("drops the unreadable ones and keeps the rest", () => {
    const mixed = { w: { a: { id: 1, team: 1, name: "one" }, b: { name: "no id" }, c: null } };
    const fragment = composeRosterFragmentFromBattle(mixed);

    expect(fragment.combatants.map((one) => one.name)).toEqual(["one"]);
    // `b` names somebody and cannot be read; `c` names nobody and is not a drop.
    expect(fragment.unreadableEntries).toBe(1);
  });

  /**
   * ⚠️ **Three of the four identity fields were carried and never tested.**
   * `hasStatedCombatant` asks whether *any* of them is stated, and every test
   * here reached it through `name` — so `bun tools/mutation-sweep.ts` could
   * replace `"team"`, `"prof"` or `"lvl"` in that list and nothing anywhere went
   * red. The list looked like four claims about the game and was one.
   *
   * It matters which four, because the whole counter rests on the split being
   * clean: an entry states all of them or none. A field quietly dropped from the
   * list narrows what counts as "describing a person", and the first entry to
   * arrive stating only that field goes back to vanishing in silence — which is
   * the failure this counter exists to end.
   */
  test.each([["name", "ktoś"], ["team", 1], ["prof", "m"], ["lvl", 100]] as const)(
    "an entry stating only %s is describing a person, so failing to read it counts",
    (field, value) => {
      // An id and one identity field: enough to be somebody, never enough to be
      // read, because a row needs an id, a side and a name together.
      const fragment = composeRosterFragmentFromBattle({ w: { a: { id: 1, [field]: value } } });

      expect(fragment.combatants).toEqual([]);
      expect(fragment.unreadableEntries).toBe(1);
    },
  );

  /**
   * The other side of the same claim, and the reason the counter is not noise:
   * an entry carrying none of those fields is a health delta, not a person, and
   * the captured material is overwhelmingly made of them.
   */
  test("an entry stating none of them is not a person and is not counted", () => {
    const fragment = composeRosterFragmentFromBattle({ w: { a: { id: 1, hp: 120, ac: 4 } } });

    expect(fragment.combatants).toEqual([]);
    expect(fragment.unreadableEntries).toBe(0);
  });

  test.each([
    ["nothing at all", undefined],
    ["a battle with no warriors", {}],
    ["warriors that are not an object", { w: 5 }],
  ])("answers with an empty list for %s", (_what, value) => {
    expect(composeRosterFragmentFromBattle(value)).toEqual({
      combatants: [],
      unreadableEntries: 0,
    });
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

  // Every capture contains a call whose warrior list is empty. A roster
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

/**
 * An entry that names somebody and cannot be read, against every payload the
 * game has actually sent.
 *
 * ⚠️ **A dropped combatant does not merely go missing from a list.** Damage the
 * protocol states against a name reaches a row only through the roster, so a
 * combatant who drops out takes their name resolution with them and their
 * figures land in the pile nobody can be charged with. Before this counter a
 * renamed field did that in complete silence: the roster simply came back
 * smaller, which is indistinguishable from a fragment that mentioned fewer
 * people — and fragments do exactly that on nearly every call.
 *
 * What makes the counter safe is the second measurement below: the entries under
 * `w` are overwhelmingly health deltas carrying an id and nothing else, so a
 * counter of every refusal would warn on the great majority of them in every
 * fight.
 * What is counted is an entry that states one of the identity fields and still
 * cannot be read, and the captures say that split is clean.
 */
describe("the captured roster fragments, read as the session reads them", () => {
  const FRAGMENTS = CAPTURED_FIGHTS.flatMap((fight) =>
    fight.dump.calls
      .filter((call) => getRecordOrArrayFromValue(call.payload)?.["w"] !== undefined)
      .map((call) => ({
        fight: fight.name,
        call: call.index,
        entries: Object.values(
          getRecordOrArrayFromValue(getRecordOrArrayFromValue(call.payload)?.["w"]) ?? {},
        ),
        fragment: composeRosterFragmentFromBattle(call.payload),
      })),
  );

  test("there are fragments to read", () => {
    expect(FRAGMENTS.length).toBeGreaterThan(0);
  });

  test("no entry that names somebody is one we cannot read", () => {
    const unreadable = FRAGMENTS.filter(({ fragment }) => fragment.unreadableEntries > 0).map(
      ({ fight, call, fragment }) => `${fight} call ${call}: ${fragment.unreadableEntries}`,
    );

    expect(unreadable).toEqual([]);
  });

  /**
   * The split this counter's definition rests on, re-measured rather than
   * remembered: every entry states all of the identity fields or none of them.
   * If the game ever sends a partial one, this goes red and the definition needs
   * deciding again — which is the point of measuring it here instead of writing
   * the finding into a comment and moving on.
   */
  test("an entry names everybody or nobody, never somebody in part", () => {
    const IDENTITY = ["name", "team", "prof", "lvl"];
    const partial: string[] = [];
    let naming = 0;
    let silent = 0;

    for (const { fight, call, entries } of FRAGMENTS) {
      for (const entry of entries) {
        const record = getRecordOrArrayFromValue(entry);
        const stated = record === null ? [] : IDENTITY.filter((key) => record[key] !== undefined);
        if (stated.length === IDENTITY.length) naming += 1;
        else if (stated.length === 0) silent += 1;
        else partial.push(`${fight} call ${call}: ${stated.join(",")}`);
      }
    }

    expect(partial).toEqual([]);
    expect(naming).toBeGreaterThan(0);
    // The reason a counter of every refusal would be noise rather than a warning.
    expect(silent).toBeGreaterThan(naming);
  });
});

/**
 * The health a combatant's entry carries, which is what a share of a pool has to
 * be taken against (`src/core/combatant-health.ts`).
 */
describe("the health an entry states", () => {
  const warrior = { id: 7, name: "seven", team: 2, prof: "w", lvl: 120, hp: { max: 900, cur: 300 } };

  test("a maximum reaches the roster", () => {
    expect(composeRosteredCombatant(warrior)?.maximumHealth).toBe(900);
  });

  /**
   * ⚠️ **A missing `hp` must never refuse the entry.** Doing so would shrink the
   * roster to whoever the game happened to state health for, and a roster short a
   * combatant sends that person's damage to nobody.
   */
  test("and an entry without one is still a combatant", () => {
    const withoutHealth = { id: 7, name: "seven", team: 2, prof: "w", lvl: 120 };
    const combatant = composeRosteredCombatant(withoutHealth);
    expect(combatant?.id).toBe(7);
    expect(combatant?.maximumHealth).toBeNull();
  });

  test("a health object stating no maximum leaves it unread rather than zero", () => {
    expect(composeRosteredCombatant({ ...warrior, hp: { cur: 300 } })?.maximumHealth).toBeNull();
  });

  test("current health is read on its own, keyed by combatant", () => {
    expect([...composeStatedHealthByCombatantId({ w: { 7: warrior } })]).toEqual([[7, 300]]);
  });

  test("and a battle stating no warriors states no health", () => {
    expect([...composeStatedHealthByCombatantId({})]).toEqual([]);
    expect([...composeStatedHealthByCombatantId(null)]).toEqual([]);
  });

  /**
   * ⚠️ **Current health must not become a property of the roster**, and this is
   * the consequence that would bite: the session decides a fight needs reading
   * again by comparing the merged list against what it held, so a figure that
   * moves every payload would re-decode the whole fight several times a turn.
   * A maximum does not move, so including it in the comparison costs nothing —
   * and leaving it out would let a corrected pool pass as "nothing happened".
   */
  test("a fragment correcting only the maximum is a change the session can see", () => {
    const before = [composeRosteredCombatant(warrior)].filter((c) => c !== null);
    const after = [composeRosteredCombatant({ ...warrior, hp: { max: 1200, cur: 300 } })].filter(
      (c) => c !== null,
    );
    expect(composeMergedCombatants(before, after)).not.toBe(before);
  });

  test("and one correcting only current health is not", () => {
    const before = [composeRosteredCombatant(warrior)].filter((c) => c !== null);
    const after = [composeRosteredCombatant({ ...warrior, hp: { max: 900, cur: 12 } })].filter(
      (c) => c !== null,
    );
    expect(composeMergedCombatants(before, after)).toBe(before);
  });

  /**
   * The `IDENTITY_FIELDS` trap, held against the material. Nearly every delta
   * entry under `w` carries an id and an `hp` and nothing else, so admitting `hp`
   * as a field that describes a person would turn most of a fight into entries the
   * roster reports it could not read.
   */
  test("an entry stating only health is not an entry the roster failed to read", () => {
    for (const fight of CAPTURED_FIGHTS) {
      for (const call of fight.dump.calls) {
        const fragment = composeRosterFragmentFromBattle(call.payload);
        expect(fragment.unreadableEntries, fight.name).toBe(0);
      }
    }
  });
});
