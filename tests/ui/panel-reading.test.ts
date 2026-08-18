/**
 * The three questions every part of the panel asks of a combatant, held directly.
 *
 * They were driven only through `composePanelView` until the composing was split
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F26), and two of
 * the four claims below cannot be reached from there at all: what a combatant with
 * no row at all reads as, and what healing with no named healer comes to when the
 * named part is larger than the whole. Both are §9.6's line — a figure nobody
 * measured must not read as a measurement of zero.
 */

import { describe, expect, test } from "bun:test";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { PANEL_METRICS } from "@/src/ui/panel-metric.ts";
import {
  getDamageWithoutActor,
  getDamageWithoutActorByElement,
  getHealingWithoutHealer,
  getMetricValue,
  getName,
  getRow,
  type PanelReading,
} from "@/src/ui/panel-reading.ts";

/** Two blows and a tick of poison: one row with both a blow and health lost. */
function composeReading(): PanelReading {
  const roster = composeCombatantRoster([
    { id: 1, name: "mag", side: 1, profession: "m", level: 105 },
    { id: 3, name: "coś dużego", side: 2, profession: null, level: null },
  ]);
  const statistics = composeFightStatistics(
    decodeFight(["1=90.00;3=50.00;+dmg=500;-dmg=400", "3=40.00;0;poison=60"], roster),
    roster,
  );
  return { statistics, roster, ourSide: 1, isFromFightStart: true };
}

describe("the row", () => {
  /**
   * A combatant the aggregate never counted has no row, and every figure of theirs
   * is a measured zero rather than an absence — reading `undefined` here would
   * surface a layer later as a bad number with its cause no longer visible (§9.5).
   */
  test("somebody with nothing gets zero in every metric, never undefined", () => {
    const reading = composeReading();
    const absent = 404;
    expect(reading.statistics.byCombatantId.has(absent)).toBe(false);
    for (const metric of PANEL_METRICS) {
      expect(getMetricValue(getRow(reading, absent), metric), metric).toBe(0);
    }
    expect(getRow(reading, absent).skills.size).toBe(0);
    expect(getRow(reading, absent).procsOnBlowsStruck.size).toBe(0);
  });

  test("somebody the fight counted gets their own row", () => {
    const reading = composeReading();
    expect(getRow(reading, 1).dealtApplied).toBeGreaterThan(0);
  });
});

describe("the name", () => {
  test("the roster's, where it has one", () => {
    expect(getName(composeReading(), 1)).toBe("mag");
  });

  // The id, marked as one, rather than a blank or a guess: a row nobody can name is
  // still a row somebody has to be able to point at in a report.
  test("the id, where the roster has nobody", () => {
    expect(getName(composeReading(), 404)).toBe("#404");
  });
});

describe("the figure for a metric", () => {
  /**
   * **Taken is a blow plus health that fell on its own.** The two are separate in
   * the aggregate because they differ by whether anybody can be charged with them,
   * and to the combatant losing the health that is no difference at all — leaving
   * the second out showed the boss of one capture 13% short.
   */
  test("taken is both readings, and the others are their own", () => {
    const reading = composeReading();
    const row = getRow(reading, 3);
    expect(row.healthLost).toBeGreaterThan(0);
    expect(getMetricValue(row, "taken")).toBe(row.taken + row.healthLost);
    expect(getMetricValue(row, "dealt")).toBe(row.dealtApplied);
    expect(getMetricValue(row, "healingGiven")).toBe(row.healingGiven);
    expect(getMetricValue(row, "healed")).toBe(row.healed);
  });

  // The other side of the boundary: a row with no health lost is its blows alone,
  // so the addition above cannot be reading the same number twice.
  test("a row with nothing unattributed is its blows alone", () => {
    const reading = composeReading();
    const row = getRow(reading, 1);
    expect(row.healthLost).toBe(0);
    expect(getMetricValue(row, "taken")).toBe(row.taken);
  });
});

describe("healing with nobody to credit", () => {
  const composeRow = (healed: number, byHealerId: Array<[number, number]>) =>
    ({
      ...getRow(composeReading(), 404),
      healed,
      healedByHealerId: new Map(byHealerId),
    });

  test("what is left after the named healers", () => {
    expect(getHealingWithoutHealer(composeRow(100, [[1, 40]]))).toBe(60);
  });

  // Both sides of zero. All of it named is nothing left over, which is a reading;
  // more named than received cannot happen and must not come out negative, because
  // a negative here would be subtracted from a total somewhere as though measured.
  test("nothing left over where every point has a healer", () => {
    expect(getHealingWithoutHealer(composeRow(100, [[1, 100]]))).toBe(0);
    expect(getHealingWithoutHealer(composeRow(100, [[1, 140]]))).toBe(0);
    expect(getHealingWithoutHealer(composeRow(1, []))).toBe(1);
    expect(getHealingWithoutHealer(composeRow(0, []))).toBe(0);
  });
});

/**
 * The damage twin, and the one the panel had been doing without.
 *
 * `Bez sprawcy` counts health that fell outside a blow **and** a blow whose
 * striker did not resolve. Cutting that row by combatant needs both, or somebody's
 * share is reported as unplaceable while their own row is holding it — which is
 * what a fight joined in progress would have shown, since no name resolves there
 * (`src/core/fight-decoder.ts`).
 */
describe("a blow with nobody to charge it to", () => {
  const composeRow = (taken: number, byActorId: Array<[number, Array<[string, number]>]>) => ({
    ...getRow(composeReading(), 404),
    taken,
    takenByActorId: new Map(byActorId.map(([id, byElement]) => [id, new Map(byElement)])),
  });

  test("what is left after the named strikers, summed across their elements", () => {
    expect(
      getDamageWithoutActor(
        composeRow(100, [
          [1, [["dmg", 30]]],
          [2, [["dmgf", 10]]],
        ]),
      ),
    ).toBe(60);
  });

  // Both sides of zero, for the reason the healing twin above has them: a negative
  // would be subtracted from a total somewhere as though somebody had measured it.
  test("nothing left over where every blow has a striker", () => {
    expect(getDamageWithoutActor(composeRow(100, [[1, [["dmg", 100]]]]))).toBe(0);
    expect(getDamageWithoutActor(composeRow(100, [[1, [["dmg", 140]]]]))).toBe(0);
    expect(getDamageWithoutActor(composeRow(1, []))).toBe(1);
    expect(getDamageWithoutActor(composeRow(0, []))).toBe(0);
  });

  /**
   * ⚠️ **It is not `healthLost` under another name.** A real fight's row can carry
   * both, and the pinned row counts both — so the two are measured apart here, on
   * a row where poison ticked and every blow had a striker.
   */
  test("says nothing about health that fell outside a blow", () => {
    const row = getRow(composeReading(), 3);
    expect(row.healthLost).toBeGreaterThan(0);
    expect(getDamageWithoutActor(row)).toBe(0);
  });

  /**
   * And the same figure kept apart by element, which is what lets the pinned row's
   * `Z czego` cut narrow with it: the elements used to be read off a fight-wide
   * bucket that holds no combatant, so it could not be put on a side at all.
   *
   * ⚠️ **It has to sum to the figure above**, or the cut would stand under the row
   * totalling something else. Held here rather than left to the view, which is
   * where the two were allowed to disagree.
   */
  test("the same, kept apart by the element the game named", () => {
    const row = composeRow(100, [
      [1, [["dmg", 30]]],
      [2, [["dmgf", 10]]],
    ]);
    row.takenByElement = new Map([
      ["dmg", 70],
      ["dmgf", 30],
    ]);

    const byElement = getDamageWithoutActorByElement(row);
    expect([...byElement]).toEqual([
      ["dmg", 40],
      ["dmgf", 20],
    ]);
    expect([...byElement.values()].reduce((sum, one) => sum + one, 0)).toBe(getDamageWithoutActor(row));
  });

  /**
   * Both sides of the boundary, and zero is the boundary (§7.5). An element every
   * point of which has a striker is not an element of nothing — it is absent, or a
   * cut would draw a row reading `0` beside a figure nobody is missing.
   */
  test("leaves out an element no blow is short a striker for", () => {
    const row = composeRow(100, [[1, [["dmg", 70]]]]);
    row.takenByElement = new Map([
      ["dmg", 70],
      ["dmgf", 30],
    ]);

    expect([...getDamageWithoutActorByElement(row)]).toEqual([["dmgf", 30]]);
    expect(getDamageWithoutActorByElement({ ...row, takenByElement: new Map() }).size).toBe(0);
  });
});
