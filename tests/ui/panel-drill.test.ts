/**
 * The two levels a row opens onto, held directly and over real material.
 *
 * `panel-view.test.ts` reaches them through `composePanelView` on a hand-written
 * fight, because the drill names skills and combatants and those are the game's own
 * prose (§5). What it cannot do from there is sweep **every** combatant of every
 * capture through every screen, which is what the two claims below need: a section
 * that closes against the row it was entered from, and a cut of one row that is not
 * drawn at all. Both were the module's own docblocks and nothing measured them
 * across the material (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`,
 * F26).
 *
 * Structural only — no label of the game's is read, written down or asserted on.
 */

import { describe, expect, test } from "bun:test";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics, getCombatantIdsInFight } from "@/src/core/fight-statistics.ts";
import { composeBreakdownLists, composeDeepLists } from "@/src/ui/panel-drill.ts";
import type { PanelRow } from "@/src/ui/panel-shape.ts";
import { composeFigureText } from "@/src/ui/panel-figure-text.ts";
import { PANEL_METRICS, type PanelMetric } from "@/src/ui/panel-metric.ts";
import { getMetricValue, getRow, type PanelReading } from "@/src/ui/panel-reading.ts";
import { NOBODY_ROW_KEY } from "@/src/ui/panel-row-key.ts";
import { composeDefaultState, type PanelState } from "@/src/ui/panel-state.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterOfFight,
  getMessagesOfFight,
} from "@/tests/captured-fight-catalog.ts";

const FIGHTS = CAPTURED_FIGHTS.map((fight) => {
  const roster = composeRosterOfFight(fight);
  const statistics = composeFightStatistics(decodeFight(getMessagesOfFight(fight), roster), roster);
  return {
    name: fight.name,
    reading: { statistics, roster, ourSide: 1, isFromFightStart: true } satisfies PanelReading,
  };
});

function composeState(over: Partial<PanelState> = {}): PanelState {
  return { ...composeDefaultState(), ...over };
}

/**
 * Every combatant of every capture, on every screen.
 *
 * Everyone **in the fight** rather than everyone the aggregate counted, which is
 * the set the ranking draws — a sweep over the smaller one would stop covering
 * rows the panel offers the moment the two differ. Over a whole capture they do
 * not differ, so this changes nothing here today and keeps the sweep pointed at
 * what a reader can actually click.
 */
function* getScreens(): Generator<{
  name: string;
  reading: PanelReading;
  metric: PanelMetric;
  combatantId: number;
}> {
  for (const { name, reading } of FIGHTS) {
    for (const metric of PANEL_METRICS) {
      for (const combatantId of getCombatantIdsInFight(reading.statistics, reading.roster)) {
        yield { name, reading, metric, combatantId };
      }
    }
  }
}

/** Whether the row opens the card, rather than a note or nothing at all. */
function getIsCard(row: PanelRow): boolean {
  return row.detail.some((line) => line.kind === "title");
}

test("there is material to drill into", () => {
  expect(FIGHTS.length).toBeGreaterThan(0);
  expect([...getScreens()].length).toBeGreaterThan(FIGHTS.length);
});

describe("a breakdown", () => {
  /**
   * The claim the whole level rests on: the first section is what the level is
   * about, and it adds up to the figure the row was entered from. The part with no
   * counterpart is a row inside it rather than a silence, which is what makes the
   * sum come out — spelled per metric instead, two of the four cases were missing
   * and a combatant opened onto no section at all.
   */
  test("closes against the figure it was entered from", () => {
    let closed = 0;
    for (const { name, reading, metric, combatantId } of getScreens()) {
      const figure = getMetricValue(getRow(reading, combatantId), metric);
      if (figure <= 0) continue;
      const lists = composeBreakdownLists(reading, composeState({ metric }), combatantId, null);
      const first = lists[0];
      if (first === undefined) continue;
      expect(first.totalText, `${name} ${metric} #${combatantId}`).toBe(composeFigureText(figure));
      closed += 1;
    }
    // A loop over nothing is green and proves nothing (§9.2).
    expect(closed).toBeGreaterThan(0);
  });

  /**
   * A cross-section of a single row repeats the total standing over it, so it is
   * not drawn — three of them in a row read as a panel that has run out of things
   * to say. The list the level is *about* is exempt: one opponent is a real answer.
   */
  test("draws no cut of a single row", () => {
    let cuts = 0;
    for (const { name, reading, metric, combatantId } of getScreens()) {
      const lists = composeBreakdownLists(reading, composeState({ metric }), combatantId, null);
      for (const list of lists.slice(1)) {
        expect(list.rows.length, `${name} ${metric} #${combatantId} ${list.heading}`).toBeGreaterThan(1);
        cuts += 1;
      }
    }
    expect(cuts).toBeGreaterThan(0);
  });

  /**
   * The section the level is about lists people, so every row of it opens the card
   * the ranking's rows open — the reader used to have to go back out to the list to
   * ask who they were looking at. The card names the row it stands over, which is
   * how the two are held together without writing a name of the game's down (§5).
   */
  test("opens a card over each person, and over nobody else", () => {
    let people = 0;
    let others = 0;
    for (const { name, reading, metric, combatantId } of getScreens()) {
      const lists = composeBreakdownLists(reading, composeState({ metric }), combatantId, null);
      const [about, ...cuts] = lists;
      for (const row of about?.rows ?? []) {
        // The row for what has no counterpart is not a person and says so instead.
        if (row.key === NOBODY_ROW_KEY) continue;
        expect(row.detail[0], `${name} ${metric} #${combatantId} ${row.key}`).toEqual({
          kind: "title",
          text: row.label,
        });
        people += 1;
      }
      // A skill and a damage type are not people, and a card over one would be a
      // card about whoever is in focus, standing where it says it is not.
      for (const row of cuts.flatMap((cut) => cut.rows)) {
        expect(getIsCard(row), `${name} ${metric} #${combatantId} ${row.key}`).toBe(false);
        others += 1;
      }
    }
    expect(people).toBeGreaterThan(0);
    expect(others).toBeGreaterThan(0);
  });

  // Every row of every section is a share of that section, so no bar is drawn past
  // the end of its track — the same rule the ranking is held to.
  test("fills no bar past its track", () => {
    for (const { name, reading, metric, combatantId } of getScreens()) {
      const lists = composeBreakdownLists(reading, composeState({ metric }), combatantId, null);
      for (const list of lists) {
        for (const row of list.rows) {
          expect(row.fill, `${name} ${metric} #${combatantId}`).toBeLessThanOrEqual(1);
          expect(row.fill, `${name} ${metric} #${combatantId}`).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

describe("the deepest level", () => {
  // Neither focus set is not a level at all: the caller decides that, and answering
  // with a list would draw a screen nobody navigated to.
  test("is nothing without a pair or a skill in focus", () => {
    const first = FIGHTS[0];
    expect(first).toBeDefined();
    const combatantId = [...(first?.reading.statistics.byCombatantId.keys() ?? [])][0] ?? 0;
    expect(composeDeepLists(first!.reading, composeState(), combatantId, null)).toEqual([]);
  });

  /**
   * A skill's own level closes against the skill's figure, the way the level above
   * closes against the combatant's. This was the one level in the panel that closed
   * against nothing: the pairs exist only where the other end resolved, so the list
   * could total less than the entry it was opened from and say nothing about it.
   */
  test("a skill closes against what that skill did", () => {
    let closed = 0;
    for (const { name, reading, combatantId } of getScreens()) {
      const state = composeState({ metric: "dealt", focusCombatantId: combatantId });
      for (const [key, skill] of getRow(reading, combatantId).skills) {
        if (skill.dealtApplied <= 0) continue;
        const lists = composeDeepLists(
          reading,
          { ...state, focusSkill: { ownerId: combatantId, key } },
          combatantId,
          null,
        );
        const only = lists[0];
        if (only === undefined) continue;
        expect(only.totalText, `${name} #${combatantId} ${key}`).toBe(
          composeFigureText(skill.dealtApplied),
        );
        closed += 1;
      }
    }
    expect(closed).toBeGreaterThan(0);
  });

  /**
   * A skill's own level lists people again, and it is the last rung: the card
   * stands over them the way it does one level up, and closes with the one gesture
   * that still does something there.
   */
  test("opens a card over each person, and closes it with the way back", () => {
    let seen = 0;
    for (const { name, reading, combatantId } of getScreens()) {
      const state = composeState({ metric: "dealt", focusCombatantId: combatantId });
      for (const [key] of getRow(reading, combatantId).skills) {
        const lists = composeDeepLists(
          reading,
          { ...state, focusSkill: { ownerId: combatantId, key } },
          combatantId,
          null,
        );
        for (const row of lists.flatMap((list) => list.rows)) {
          if (row.key === NOBODY_ROW_KEY) continue;
          const where = `${name} #${combatantId} ${key} ${row.key}`;
          expect(row.detail[0], where).toEqual({ kind: "title", text: row.label });
          expect(row.detail.at(-1), where).toEqual({ kind: "note", text: "PPM — powrót" });
          seen += 1;
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  // Entering through an opponent asks *with what*, so that level lists skills and
  // damage types — neither is a person, and neither opens a card.
  test("opens no card where the level is not about people", () => {
    let seen = 0;
    for (const { name, reading, metric, combatantId } of getScreens()) {
      const state = composeState({ metric, focusCombatantId: combatantId });
      for (const focusTargetId of getRow(reading, combatantId).dealtByTargetId.keys()) {
        const lists = composeDeepLists(reading, { ...state, focusTargetId }, combatantId, null);
        for (const row of lists.flatMap((list) => list.rows)) {
          expect(getIsCard(row), `${name} ${metric} #${combatantId} ${row.key}`).toBe(false);
          seen += 1;
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  // A skill nobody announced is not a level: the state can name a key the row does
  // not hold, and the honest answer is no list rather than an empty one.
  test("a skill the row does not hold opens nothing", () => {
    const first = FIGHTS[0];
    const combatantId = [...(first?.reading.statistics.byCombatantId.keys() ?? [])][0] ?? 0;
    const state = composeState({
      focusCombatantId: combatantId,
      focusSkill: { ownerId: combatantId, key: "nothing-announced-this" },
    });
    expect(composeDeepLists(first!.reading, state, combatantId, null)).toEqual([]);
  });
});
