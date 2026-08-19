/**
 * The vocabulary a screen is named in, and the strips that switch between them.
 *
 * Driven only through `composePanelView` until the composing was split along its
 * seams (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F26): the
 * view's own tests record what a tab *says*, which is a claim about the panel's
 * words, and pass just as happily when the rule behind the tab changes. What is
 * held here is the rule — that every screen is one pair of axes and no two share
 * it, and that moving between nouns keeps the direction the reader is in.
 */

import { describe, expect, test } from "bun:test";
import {
  composeDirectionTabs,
  composeNounTabs,
  composeTeamTabs,
  getMetricNoun,
  isGivenMetric,
  isHealingMetric,
  METRIC_LABELS,
  PANEL_METRICS,
  PANEL_TEAMS,
  TEAM_LABELS,
} from "@/src/ui/panel-metric.ts";

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
