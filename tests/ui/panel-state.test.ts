import { describe, expect, test } from "bun:test";
import {
  composeStateAfterBack,
  composeStateAfterMetric,
  composeStateAfterTeam,
  composeStateFromRow,
} from "@/src/ui/panel-state.ts";
import { composeDefaultState, type PanelState } from "@/src/ui/panel-view.ts";

/**
 * The four reducers, on their own.
 *
 * They were driven only through `composePanelView` over a captured fight in
 * `tests/game/engine-attachment.test.ts`, which is the right place to prove the
 * screens nest and the wrong place to say what one function returns: a wrong
 * answer here surfaces there as a screen that looks slightly off.
 *
 * That block stays where it is — it is checking the loop, not the arithmetic.
 * This checks the arithmetic.
 */

function composeState(over: Partial<PanelState> = {}): PanelState {
  return { ...composeDefaultState(), ...over };
}

describe("a clicked row", () => {
  test("opens a combatant and closes anything deeper", () => {
    const state = composeState({ focusTargetId: 9, focusSkill: { ownerId: 1, key: "x" } });
    expect(composeStateFromRow(state, "combatant:42")).toEqual({
      focusCombatantId: 42,
      focusTargetId: null,
      focusSkill: null,
    });
  });

  test("opens an opponent and closes the skill under it", () => {
    expect(composeStateFromRow(composeState(), "target:7")).toEqual({
      focusTargetId: 7,
      focusSkill: null,
    });
  });

  test("opens a skill under whoever owns it", () => {
    expect(composeStateFromRow(composeState(), "skill:7:fireball")).toEqual({
      focusSkill: { ownerId: 7, key: "fireball" },
      focusTargetId: null,
    });
  });

  /**
   * A skill's own key is the game's id where it stated one and the skill's
   * **name** where it did not, so it can carry anything — a colon included. Only
   * the owner is split off the front; the rest is taken whole.
   */
  test("keeps a skill key that carries a colon of its own", () => {
    expect(composeStateFromRow(composeState(), "skill:7:legbon:facade")).toEqual({
      focusSkill: { ownerId: 7, key: "legbon:facade" },
      focusTargetId: null,
    });
  });

  /**
   * ⚠️ The guard on the divider is load-bearing, not defensive. Without it a key
   * nobody composed slices as `rest.slice(0, -1)`, turning `78` into the owner id
   * `7` — a row that quietly opens somebody else's figures, which is the defect
   * this shape exists to end.
   */
  test.each([
    ["a skill with no owner", "skill:78"],
    ["a skill whose owner will not read", "skill:abc:78"],
    ["a key that is not one of ours", "skill:nonsense"],
    ["a combatant whose id will not read", "combatant:nobody"],
    ["an opponent whose id will not read", "target:nobody"],
    ["a kind nothing draws", "region:1"],
    ["a key with no kind at all", "78"],
  ])("changes nothing for %s", (_what, key) => {
    expect(composeStateFromRow(composeState(), key)).toEqual({});
  });

  test("the back key goes back rather than opening anything", () => {
    const state = composeState({ focusCombatantId: 1, focusTargetId: 2 });
    expect(composeStateFromRow(state, "back")).toEqual(composeStateAfterBack(state));
  });
});

describe("choosing a side", () => {
  /**
   * Further than the metric goes, and the asymmetry is the point: the same
   * combatant exists in every metric, but a side filter decides who is on the
   * list at all and can put the one in focus off it.
   */
  test("closes the breakdown as well as the deep level", () => {
    expect(composeStateAfterTeam("enemy")).toEqual({
      team: "enemy",
      focusCombatantId: null,
      focusTargetId: null,
      focusSkill: null,
    });
  });
});

describe("choosing a figure", () => {
  /**
   * A deep level does not survive turning the figure round: under healing
   * received an open skill belongs to whoever cast it, and under healing given
   * the skills are the combatant's own. The combatant stays — they exist in
   * every metric.
   */
  test("drops the deep level and keeps the combatant", () => {
    expect(composeStateAfterMetric("healingGiven")).toEqual({
      metric: "healingGiven",
      focusTargetId: null,
      focusSkill: null,
    });
    expect(composeStateAfterMetric("healingGiven")).not.toHaveProperty("focusCombatantId");
  });
});

describe("going back", () => {
  test("one level out, and only one", () => {
    expect(composeStateAfterBack(composeState({ focusCombatantId: 1, focusTargetId: 2 }))).toEqual({
      focusTargetId: null,
      focusSkill: null,
    });
  });

  test("leaves the combatant last", () => {
    expect(composeStateAfterBack(composeState({ focusCombatantId: 1 }))).toEqual({
      focusCombatantId: null,
    });
  });

  test("from a skill, closes the skill before the combatant", () => {
    const state = composeState({ focusCombatantId: 1, focusSkill: { ownerId: 1, key: "x" } });
    expect(composeStateAfterBack(state)).toEqual({ focusTargetId: null, focusSkill: null });
  });

  test("from the ranking, asks for the ranking again rather than throwing", () => {
    expect(composeStateAfterBack(composeState())).toEqual({ focusCombatantId: null });
  });
});
