/**
 * The grammar three files used to agree on by convention.
 *
 * ⚠️ **What was guarded before was one parser, never the grammar.**
 * `tests/ui/panel-state.test.ts` holds `composeStateFromRow` against the
 * mis-slicing bug that turns `78` into the owner id `7` — a real test of a real
 * defect, and it says nothing about whether the keys it is handed are the keys
 * the view composes. They were composed in `panel-view.ts`, invented a third
 * time in `panel-element.ts`, and taken apart by prefix comparison in
 * `panel-state.ts`
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F17).
 *
 * So the test that matters here is the round trip: what one end writes, the
 * other end reads back as the same thing.
 */

import { describe, expect, test } from "bun:test";
import {
  BACK_ROW_KEY,
  composeCombatantRowKey,
  composeLeafRowKey,
  composeSkillLeafRowKey,
  composeSkillRowKey,
  composeSourceRowKey,
  composeTargetRowKey,
  getRowKeyKind,
  getRowKeyMeaning,
  NO_ACTOR_ROW_KEY,
  NO_TARGET_ROW_KEY,
  UNANNOUNCED_ROW_KEY,
} from "@/src/ui/panel-row-key.ts";

describe("a row key, written and read back", () => {
  test("a combatant", () => {
    expect(getRowKeyMeaning(composeCombatantRowKey(42))).toEqual({
      opens: "combatant",
      combatantId: 42,
    });
  });

  test("a target, which is a different level under the same id", () => {
    expect(getRowKeyMeaning(composeTargetRowKey(42))).toEqual({
      opens: "target",
      combatantId: 42,
    });
    expect(composeTargetRowKey(42)).not.toBe(composeCombatantRowKey(42));
  });

  // Negative ids are what the game gives a monster, so they are not an edge here
  // — every capture in this repository has one on the other side.
  test("a combatant the game numbered below zero", () => {
    expect(getRowKeyMeaning(composeCombatantRowKey(-10000542))).toEqual({
      opens: "combatant",
      combatantId: -10000542,
    });
  });

  test("a skill, by its owner and its own key", () => {
    expect(getRowKeyMeaning(composeSkillRowKey(7, "23"))).toEqual({
      opens: "skill",
      ownerId: 7,
      key: "23",
    });
  });

  /**
   * The one the whole shape exists for. A skill's key is the game's identifier
   * where the message stated one and the skill's **name** where it did not, so it
   * carries whatever the game wrote — including a colon, and including something
   * that looks like the rest of the grammar.
   */
  test("a skill whose own key carries the divider", () => {
    for (const key of ["a:b", "skill:7:x", "::", ":", "combatant:1"]) {
      expect(getRowKeyMeaning(composeSkillRowKey(7, key)), key).toEqual({
        opens: "skill",
        ownerId: 7,
        key,
      });
    }
  });

  /**
   * The defect the grammar was written down for, from the composing end: id `78`
   * must not read back as owner `7`. `panel-state.test.ts` holds the parser
   * against it; this holds the pair.
   */
  test("an owner id is never a prefix of another owner id", () => {
    expect(getRowKeyMeaning(composeSkillRowKey(78, "x"))).toEqual({
      opens: "skill",
      ownerId: 78,
      key: "x",
    });
  });
});

describe("a row key that opens nothing", () => {
  test("the bare words, and each says something different", () => {
    expect(getRowKeyMeaning(BACK_ROW_KEY)).toEqual({ opens: "back" });
    expect(getRowKeyMeaning(NO_ACTOR_ROW_KEY)).toEqual({ opens: "nothing" });
    expect(getRowKeyMeaning(NO_TARGET_ROW_KEY)).toEqual({ opens: "nothing" });
    expect(getRowKeyMeaning(UNANNOUNCED_ROW_KEY)).toEqual({ opens: "nothing" });
    expect(
      new Set([BACK_ROW_KEY, NO_ACTOR_ROW_KEY, NO_TARGET_ROW_KEY, UNANNOUNCED_ROW_KEY]).size,
    ).toBe(4);
  });

  test("a leaf, whatever names it", () => {
    for (const token of ["dmgf", "skill:Name", UNANNOUNCED_ROW_KEY, "7"]) {
      expect(getRowKeyMeaning(composeLeafRowKey(token)), token).toEqual({ opens: "nothing" });
    }
  });

  /**
   * The skill leaf, which is the one token that needs a namespace: a skill is
   * called whatever the game called it, and the two other kinds of leaf on that
   * level are a combatant id and a damage type.
   *
   * The collision is what is checked, not the spelling. Both sides of it are
   * here — a skill named for a number, and the bare number beside it — because a
   * composer that dropped the namespace would still open nothing and still look
   * right, and only two rows carrying the same key would say otherwise.
   */
  test("a skill leaf, which cannot collide with the leaves beside it", () => {
    expect(getRowKeyMeaning(composeSkillLeafRowKey("Name"))).toEqual({ opens: "nothing" });
    expect(composeSkillLeafRowKey("7")).not.toBe(composeLeafRowKey("7"));
    expect(composeSkillLeafRowKey("Name")).toBe(composeLeafRowKey("skill:Name"));
  });

  // A key this module did not compose. Deciding what an unknown prefix means is
  // the reason the meaning is a value rather than something each caller works out
  // from the text.
  test("anything nobody here wrote", () => {
    for (const key of ["", ":", "combatant:", "combatant:x", "target:x", "skill:x:y", "what"]) {
      expect(getRowKeyMeaning(key), key).toEqual({ opens: "nothing" });
    }
  });

  /**
   * The row naming what a figure came *from*, which the breakdown used to compose
   * by hand — one caller reproducing the divider and the word either side of it
   * (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F5).
   *
   * It opens nothing, like every other leaf of that level, and that is the half
   * worth checking here: a caller reading the prefix would have had to decide what
   * an unknown one meant, and this module is where that is decided once.
   */
  test("a row named for what a figure came from", () => {
    expect(getRowKeyMeaning(composeSourceRowKey("dmgf"))).toEqual({ opens: "nothing" });
    expect(composeSourceRowKey("dmgf")).not.toBe(composeLeafRowKey("dmgf"));
  });
});

/**
 * The other question a key can be asked, and the reason there are two readers.
 *
 * `getRowKeyMeaning` answers what a *click* does, so everything that opens
 * nothing is one answer — right for the panel, useless to anything counting what
 * the panel drew. `tools/drill-report.ts` needed the second question and was
 * answering it with prefixes of its own until this existed.
 */
describe("which kind of row a key names", () => {
  test.each([
    [composeCombatantRowKey(7), "combatant"],
    [composeTargetRowKey(7), "target"],
    [composeSkillRowKey(7, "78"), "skill"],
    [composeSourceRowKey("dmgf"), "source"],
    [composeLeafRowKey("7"), "leaf"],
    [composeSkillLeafRowKey("Name"), "leaf"],
    [BACK_ROW_KEY, "other"],
    [NO_ACTOR_ROW_KEY, "other"],
    [NO_TARGET_ROW_KEY, "other"],
    [UNANNOUNCED_ROW_KEY, "other"],
    ["what", "other"],
    ["", "other"],
    // A key that *has* a divider and a word nobody here wrote, which is the only
    // way to reach the answer past the one for a key with no divider at all —
    // and the case the sweep found nothing standing on.
    ["wat:1", "other"],
  ] as const)("%s is %s", (key, kind) => {
    expect(getRowKeyKind(key)).toBe(kind);
  });
});
