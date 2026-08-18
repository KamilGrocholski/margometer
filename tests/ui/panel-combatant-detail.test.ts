/**
 * The card a combatant's row opens, held over real material.
 *
 * What it is for, now that the drill draws it too: the card is the **same card**
 * wherever it stands — a person's totals do not narrow because the row under the
 * pointer does — and the only thing that may differ is what it says about itself
 * at the foot. Held as a difference between the three places rather than by
 * spelling one card out, so a line added to the card cannot pass here by being
 * added to one place and forgotten in the others.
 *
 * Structural, with one exception: the two sentences `place` decides are written
 * down, because deciding them is what this file is about. Every other word is
 * `src/ui/panel-names.ts`'s and is asserted through `getPhrase`'s callers, never
 * here.
 */

import { describe, expect, test } from "bun:test";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics, getCombatantIdsInFight } from "@/src/core/fight-statistics.ts";
import {
  composeCombatantDetail,
  composeStat,
  type PanelDetailPlace,
} from "@/src/ui/panel-combatant-detail.ts";
import { PANEL_METRICS } from "@/src/ui/panel-metric.ts";
import { getName, type PanelReading } from "@/src/ui/panel-reading.ts";
import { composeDefaultState, type PanelState } from "@/src/ui/panel-state.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterOfFight,
  getMessagesOfFight,
} from "@/tests/captured-fight-catalog.ts";

const SCOPE_NOTE = "Liczby z całej walki.";
const DRILL_NOTE = "LPM — rozbicie · PPM — powrót";
const BACK_NOTE = "PPM — powrót";

const FIGHTS = CAPTURED_FIGHTS.map((fight) => {
  const roster = composeRosterOfFight(fight);
  const statistics = composeFightStatistics(
    decodeFight(getMessagesOfFight(fight), roster),
    roster,
    fight.entryHealthByCombatantId,
  );
  return {
    name: fight.name,
    reading: { statistics, roster, ourSide: 1, isFromFightStart: true } satisfies PanelReading,
  };
});

function composeState(over: Partial<PanelState> = {}): PanelState {
  return { ...composeDefaultState(), ...over };
}

/** Every combatant of every capture, on every metric — the sweep the drill uses. */
function* getCards(place: PanelDetailPlace): Generator<{
  where: string;
  reading: PanelReading;
  combatantId: number;
  lines: ReturnType<typeof composeCombatantDetail>;
}> {
  for (const { name, reading } of FIGHTS) {
    for (const metric of PANEL_METRICS) {
      for (const combatantId of getCombatantIdsInFight(reading.statistics, reading.roster)) {
        yield {
          where: `${name} ${metric} #${combatantId} ${place}`,
          reading,
          combatantId,
          lines: composeCombatantDetail(reading, combatantId, composeState({ metric }), null, place),
        };
      }
    }
  }
}

test("there is material to open a card over", () => {
  expect([...getCards("ranking")].length).toBeGreaterThan(FIGHTS.length);
});

test("a stat line is a label, a figure, and whether it is the one on screen", () => {
  expect(composeStat("A", "1")).toEqual({ kind: "stat", label: "A", value: "1", isStrong: false });
  expect(composeStat("A", "1", true)).toEqual({ kind: "stat", label: "A", value: "1", isStrong: true });
});

describe("the card", () => {
  // Who this is, before anything about them — and the name is asked of the panel
  // rather than written down, because it is the game's (§5).
  test("opens with the name of whoever the row is", () => {
    let seen = 0;
    for (const { where, reading, combatantId, lines } of getCards("ranking")) {
      expect(lines[0], where).toEqual({ kind: "title", text: getName(reading, combatantId) });
      seen += 1;
    }
    expect(seen).toBeGreaterThan(0);
  });

  /**
   * The claim the whole change rests on: one level in, the reader gets what the
   * ranking gives them. Everything above the foot is the same card, line for line
   * — a figure that narrowed with the row would be a second reading of a person,
   * and there is only one.
   */
  test("is the same card wherever it stands", () => {
    let seen = 0;
    for (const { where, reading, combatantId, lines } of getCards("ranking")) {
      const state = composeState({ metric: "dealt" });
      const inRanking = composeCombatantDetail(reading, combatantId, state, null, "ranking");
      const breakdown = composeCombatantDetail(reading, combatantId, state, null, "breakdown");
      const leaf = composeCombatantDetail(reading, combatantId, state, null, "leaf");

      expect(breakdown.slice(0, -2), where).toEqual(inRanking.slice(0, -1));
      expect(leaf.slice(0, -2), where).toEqual(inRanking.slice(0, -1));
      // A card of two lines would satisfy the three comparisons above by holding
      // nothing at all.
      expect(lines.length, where).toBeGreaterThan(2);
      seen += 1;
    }
    expect(seen).toBeGreaterThan(0);
  });

  /**
   * Said only where the row underneath states a narrower figure than the card
   * does. On the ranking they are the same number, and a note repeating that
   * answers a question nobody has.
   */
  test("says the figures are the fight's only where the row's are not", () => {
    for (const place of ["breakdown", "leaf"] as const) {
      for (const { where, lines } of getCards(place)) {
        expect(lines.at(-2), where).toEqual({ kind: "note", text: SCOPE_NOTE });
      }
    }
    for (const { where, lines } of getCards("ranking")) {
      expect(lines.map((line) => line.kind === "note" && line.text), where).not.toContain(SCOPE_NOTE);
    }
  });

  /**
   * ⚠️ **The gesture note has to be true where it stands.** A combatant row under
   * an opened skill opens no further level, so a card promising `LPM` over it
   * would be the panel saying something it cannot do — the one instruction it
   * gives, and the one place it could quietly become a lie.
   */
  test("closes with what a click does on the row it stands over", () => {
    for (const [place, note] of [
      ["ranking", DRILL_NOTE],
      ["breakdown", DRILL_NOTE],
      ["leaf", BACK_NOTE],
    ] as const) {
      let seen = 0;
      for (const { where, lines } of getCards(place)) {
        expect(lines.at(-1), where).toEqual({ kind: "note", text: note });
        seen += 1;
      }
      expect(seen, place).toBeGreaterThan(0);
    }
  });
});
