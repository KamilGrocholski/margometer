/**
 * Which screen the panel is on, held in the four parts the subject has: the
 * vocabulary and its strips, the grammar of a row key, the shape, and the
 * reducer.
 *
 * All four were driven only through `composePanelView` until the composing was
 * split along its seams (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`,
 * F26). That is why they are still held apart from the view's own tests, which
 * record what a tab *says* — a claim about the panel's words, and one that passes
 * just as happily when the rule behind the tab changes. What is held here is the
 * rule: that every screen is one pair of axes and no two share it, that moving
 * between nouns keeps the direction the reader is in, that a key composed here
 * reads back to the same screen, and that a click lands on the screen it names.
 */

import { describe, expect, test } from "bun:test";
import {
  BACK_ROW_KEY,
  composeCombatantRowKey,
  composeDefaultState,
  composeDirectionTabs,
  composeLeafRowKey,
  composeNounTabs,
  composeSkillLeafRowKey,
  composeSkillRowKey,
  composeSourceRowKey,
  composeStateAfterBack,
  composeStateAfterFightStart,
  composeStateAfterMetric,
  composeStateAfterTeam,
  composeStateFromRow,
  composeTargetRowKey,
  composeTeamTabs,
  getMetricNoun,
  getRowKeyKind,
  getRowKeyMeaning,
  isGivenMetric,
  isHealingMetric,
  METRIC_LABELS,
  NO_ACTOR_ROW_KEY,
  NO_TARGET_ROW_KEY,
  PANEL_METRICS,
  PANEL_TEAMS,
  type PanelState,
  TEAM_LABELS,
  UNANNOUNCED_ROW_KEY,
  PANEL_SCREENS,
  PANEL_STORAGE_CHOICES,
  composeStateAfterFightChosen,
  composeStateAfterFightsToggled,
} from "@/src/ui/panel-screen.ts";
import { STORAGE_CHOICES } from "@/src/userscript-storage.ts";

describe("the axes", () => {
  /**
   * The claim the table is for: a metric *is* a pair, and a pair with no metric is
   * a screen that cannot be expressed. Two metrics sharing a pair would make one
   * of them unreachable from the strips while both stayed in the state.
   */
  test("every metric is its own pair of axes", () => {
    const pairs = PANEL_METRICS.map(
      (metric) => `${getMetricNoun(metric)}/${isGivenMetric(metric) ? "given" : "received"}`,
    );
    expect(new Set(pairs).size).toBe(PANEL_METRICS.length);
  });

  test("the noun and the direction are read from the same table", () => {
    expect(PANEL_METRICS.filter(isHealingMetric)).toEqual(["healingGiven", "healed"]);
    expect(PANEL_METRICS.filter(isGivenMetric)).toEqual(["dealt", "healingGiven"]);
    expect(PANEL_METRICS.map(getMetricNoun)).toEqual(["damage", "damage", "healing", "healing"]);
  });

  // Two quantities under one label is a wrong number that looks right, so every
  // label is a different label — the same rule `panel-names.test.ts` holds.
  test("no two screens are called the same thing", () => {
    const labels = PANEL_METRICS.map((metric) => METRIC_LABELS[metric]);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.filter((label) => label === "")).toEqual([]);

    const teams = PANEL_TEAMS.map((team) => TEAM_LABELS[team]);
    expect(new Set(teams).size).toBe(teams.length);
  });
});

describe("the noun strip", () => {
  test("one tab per noun, and the one showing is selected", () => {
    for (const metric of PANEL_METRICS) {
      const tabs = composeNounTabs(metric);
      expect(tabs.length, metric).toBe(2);
      expect(tabs.filter((tab) => tab.isSelected).length, metric).toBe(1);
      const selected = tabs.find((tab) => tab.isSelected);
      expect(getMetricNoun(selected?.metric ?? metric), metric).toBe(getMetricNoun(metric));
    }
  });

  /**
   * The rule the strip exists for: moving between nouns must not silently turn the
   * figure round. Every tab carries the metric it would switch *to*, so this is
   * checkable without a browser and without a click.
   */
  test("switching noun keeps the direction the reader is in", () => {
    for (const metric of PANEL_METRICS) {
      for (const tab of composeNounTabs(metric)) {
        expect(isGivenMetric(tab.metric), `${metric} → ${tab.metric}`).toBe(isGivenMetric(metric));
      }
    }
  });

  // The tab that is already showing switches to nothing: a control that moved the
  // reader somewhere else would be a control lying about where they are.
  test("the selected tab offers the metric already on screen", () => {
    for (const metric of PANEL_METRICS) {
      const selected = composeNounTabs(metric).find((tab) => tab.isSelected);
      expect(selected?.metric, metric).toBe(metric);
    }
  });
});

describe("the direction strip", () => {
  test("both directions of the noun, with the current one selected", () => {
    for (const metric of PANEL_METRICS) {
      const tabs = composeDirectionTabs(metric);
      expect(tabs.map((tab) => tab.metric).includes(metric), metric).toBe(true);
      expect(tabs.filter((tab) => tab.isSelected).map((tab) => tab.metric), metric).toEqual([
        metric,
      ]);
      // Every tab it offers is the same noun turned round, never a different one.
      for (const tab of tabs) expect(getMetricNoun(tab.metric), metric).toBe(getMetricNoun(metric));
    }
  });

  /**
   * ⚠️ **Every noun offers two, and the strip no longer has an answer for a noun
   * that offers one.**
   *
   * `composeDirectionTabs` used to return nothing in that case, and the line never
   * ran — mutating its bound reddened nothing. The protection is real and the
   * unreachable line was not, so it is asserted here instead: a third noun with a
   * single direction fails this, and whoever adds one decides then what a strip of
   * one tab should do, rather than getting a silently empty strip (§9.6).
   */
  test("every noun offers exactly two directions", () => {
    for (const metric of PANEL_METRICS) {
      expect(composeDirectionTabs(metric).map((tab) => tab.metric), metric).toHaveLength(2);
    }
  });

  /**
   * The direction is worded per noun because Polish does not use one word for
   * both, so the two strips must not read as two lists of the same kind of thing.
   * Recorded rather than described: changing what a direction is called is one
   * line of a diff and has to be meant.
   */
  test("the wording is the noun's own", () => {
    expect(composeDirectionTabs("dealt").map((tab) => tab.label)).toEqual([
      "zadane",
      "otrzymane",
    ]);
    expect(composeDirectionTabs("healed").map((tab) => tab.label)).toEqual(["dane", "otrzymane"]);
  });
});

describe("the side strip", () => {
  test("one tab per side, in the order the vocabulary states, one selected", () => {
    for (const team of PANEL_TEAMS) {
      const tabs = composeTeamTabs(team);
      expect(tabs.map((tab) => tab.team)).toEqual([...PANEL_TEAMS]);
      expect(tabs.filter((tab) => tab.isSelected).map((tab) => tab.team)).toEqual([team]);
      expect(tabs.map((tab) => tab.label)).toEqual(PANEL_TEAMS.map((one) => TEAM_LABELS[one]));
    }
  });
});

/**
 * The grammar three files used to agree on by convention.
 *
 * ⚠️ **What was guarded before was one parser, never the grammar.**
 * The state tests below hold `composeStateFromRow` against the
 * mis-slicing bug that turns `78` into the owner id `7` — a real test of a real
 * defect, and it says nothing about whether the keys it is handed are the keys
 * the view composes. They were composed in `panel-view.ts`, invented a third
 * time in `panel-element.ts`, and taken apart by prefix comparison in the
 * reducer — three files agreeing on a grammar nothing stated
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F17).
 *
 * So the test that matters here is the round trip: what one end writes, the
 * other end reads back as the same thing.
 */


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
   * must not read back as owner `7`. The reducer tests below hold the parser
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

/**
 * The five reducers, on their own.
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

describe("a fight opening", () => {
  /**
   * Every level goes, from wherever the reader was — the levels belonged to the
   * fight that is over. What stays is the tab and the window: neither is a level
   * somebody opened, and a fight ending does not un-choose either.
   */
  test("drops every level, whatever depth the reader was at", () => {
    expect(composeStateAfterFightStart()).toEqual({
      focusCombatantId: null,
      focusTargetId: null,
      focusSkill: null,
    });
  });

  test.each(["metric", "team", "isCollapsed"] as const)("leaves %s alone", (field) => {
    expect(composeStateAfterFightStart()).not.toHaveProperty(field);
  });

  /**
   * Said over a state rather than over the returned part, because the part is
   * what the mount spreads and the state is what the panel is then drawn from.
   */
  test("a reader deep in a drill comes back to the tab they chose", () => {
    const deep = composeState({
      metric: "healed",
      team: "enemy",
      focusCombatantId: 1,
      focusTargetId: 2,
      focusSkill: { ownerId: 1, key: "x" },
      isCollapsed: true,
    });
    expect({ ...deep, ...composeStateAfterFightStart() }).toEqual(
      composeState({ metric: "healed", team: "enemy", isCollapsed: true }),
    );
  });
});

describe("the shelf of kept fights is a screen and not a level", () => {
  test("the panel opens on the fight, not on the shelf", () => {
    expect(composeDefaultState().screen).toBe("fight");
    expect([...PANEL_SCREENS]).toEqual(["fight", "fights"]);
  });

  /**
   * One gesture, both ways — and the claim is what it does *not* return. Only the
   * screen moves, so the level the shelf covered is the level the second press
   * comes back to.
   */
  test("the shelf goes over the panel and comes off it again", () => {
    expect(composeStateAfterFightsToggled(composeState())).toEqual({ screen: "fights" });
    expect(composeStateAfterFightsToggled(composeState({ screen: "fights" }))).toEqual({
      screen: "fight",
    });
  });

  test("and a reader deep in a breakdown gets that breakdown back", () => {
    const deep = composeState({
      metric: "healed",
      team: "enemy",
      focusCombatantId: 7,
      focusTargetId: 9,
      focusSkill: { ownerId: 7, key: "x" },
    });
    const covered = { ...deep, ...composeStateAfterFightsToggled(deep) };

    expect(covered.screen).toBe("fights");
    expect({ ...covered, ...composeStateAfterFightsToggled(covered) }).toEqual(deep);
  });

  /**
   * The asymmetry the reducer argues for: a drill belongs to the fight it was
   * opened in, and the fight has changed.
   */
  test("choosing a fight drops the drill and keeps the tabs", () => {
    const chosen = composeStateAfterFightChosen();
    expect(chosen).toEqual({
      screen: "fight",
      focusCombatantId: null,
      focusTargetId: null,
      focusSkill: null,
    });
    expect(chosen).not.toHaveProperty("metric");
    expect(chosen).not.toHaveProperty("team");
  });

  /**
   * ⚠️ The order is the whole of it: the shelf covers the panel, so a drill left
   * open underneath is not something the reader can see themselves leaving.
   */
  test("stepping back leaves the shelf before it closes a drill", () => {
    const deep: PanelState = {
      ...composeDefaultState(),
      screen: "fights",
      focusCombatantId: 7,
      focusTargetId: 9,
    };
    expect(composeStateAfterBack(deep)).toEqual({ screen: "fight" });
    expect(composeStateAfterBack({ ...deep, screen: "fight" })).toEqual({
      focusTargetId: null,
      focusSkill: null,
    });
  });

  /**
   * §9.3: the panel spells these three itself because `src/ui/` may not import the
   * module that owns the stores, and two spellings with nothing holding them
   * together is exactly what that rule refuses.
   */
  test("the three places the panel offers are the three that exist", () => {
    expect([...PANEL_STORAGE_CHOICES]).toEqual([...STORAGE_CHOICES]);
  });
});
