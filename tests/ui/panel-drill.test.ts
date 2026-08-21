import { describe, expect, test } from "bun:test";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics, getCombatantIdsInFight } from "@/src/core/fight-statistics.ts";
import {
  composeBreakdownLists,
  composeCombatantDetail,
  composeDeepLists,
  composeStat,
  type PanelDetailPlace,
} from "@/src/ui/panel-drill.ts";
import {
  composeDefaultState,
  NO_ACTOR_ROW_KEY,
  NO_TARGET_ROW_KEY,
  PANEL_METRICS,
  type PanelMetric,
  type PanelRow,
  type PanelState,
  UNANNOUNCED_ROW_KEY,
} from "@/src/ui/panel-screen.ts";
import { getMetricValue, getName, getRow, type PanelReading } from "@/src/ui/panel-reading.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterOfFight,
  getMessagesOfFight,
} from "@/tests/captured-fight-catalog.ts";
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

import { composeFigureText } from "@/src/ui/panel-words.ts";

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
   *
   * ⚠️ **And so is the closing row where it counts something.**
   * `Zwykły cios 2 644 (100% · ×8)` says eight blows where the figure above says
   * none, and that count is reachable nowhere else — the closing row one level
   * down states none. A lone *announced* skill is not exempt: measured over the
   * captures, all 31 of its occurrences are reachable by opening a person it was
   * used on
   * (`docs/specs/2026-08-19-a-row-opens-only-what-it-does-not-say.md`). Both
   * branches are counted, so neither can go quiet and leave the other passing
   * alone.
   */
  test("draws a cut of a single row only where nothing announced it", () => {
    let cuts = 0;
    let counted = 0;
    for (const { name, reading, metric, combatantId } of getScreens()) {
      const lists = composeBreakdownLists(reading, composeState({ metric }), combatantId, null);
      for (const list of lists.slice(1)) {
        const where = `${name} ${metric} #${combatantId} ${list.heading}`;
        if (list.rows.length > 1) {
          cuts += 1;
          continue;
        }
        expect(list.rows[0]!.key, where).toBe(UNANNOUNCED_ROW_KEY);
        // The bracket is where a count shows, and the only place it does.
        expect(list.rows[0]!.bracketText, where).toContain("×");
        counted += 1;
      }
    }
    expect(cuts).toBeGreaterThan(0);
    expect(counted).toBeGreaterThan(0);
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
        if (row.key === NO_ACTOR_ROW_KEY || row.key === NO_TARGET_ROW_KEY) continue;
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
          if (row.key === NO_ACTOR_ROW_KEY || row.key === NO_TARGET_ROW_KEY) continue;
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
 * `src/ui/panel-words.ts`'s and is asserted through `getPhrase`'s callers, never
 * here.
 */


const SCOPE_NOTE = "Liczby z całej walki.";
const DRILL_NOTE = "LPM — rozbicie · PPM — powrót";
const BACK_NOTE = "PPM — powrót";

/**
 * The same recordings as `FIGHTS` above, decoded **with** the health each fight
 * was entered with.
 *
 * ⚠️ **Deliberately a second corpus and not the one above** (§9.3). The card
 * states what a combatant came in with, so it needs the input the drill's own
 * suite deliberately withholds; folding the two would silently give every drill
 * assertion a third argument it was never written against.
 */
const FIGHTS_WITH_ENTRY_HEALTH = CAPTURED_FIGHTS.map((fight) => {
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

/** Every combatant of every capture, on every metric — the sweep the drill uses. */
function* getCards(place: PanelDetailPlace): Generator<{
  where: string;
  reading: PanelReading;
  combatantId: number;
  lines: ReturnType<typeof composeCombatantDetail>;
}> {
  for (const { name, reading } of FIGHTS_WITH_ENTRY_HEALTH) {
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
  expect([...getCards("ranking")].length).toBeGreaterThan(FIGHTS_WITH_ENTRY_HEALTH.length);
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
