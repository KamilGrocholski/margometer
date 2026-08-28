/**
 * The two levels a row opens onto, held directly and over real material.
 *
 * `panel-view.test.ts` reaches them through `composePanelView` on a hand-written fight,
 * because the drill names skills and combatants and those are the game's own prose
 * (§5). What it cannot do from there is sweep **every** combatant of every capture
 * through every screen, which is what the two claims below need: a section that closes
 * against the row it was entered from, and a cut of one row that is not drawn at all.
 * Both were the module's own docblocks and nothing measured them across the material.
 *
 * Structural only — no label of the game's is read, written down or asserted on.
 */

import { describe, expect, test } from "bun:test";
import { getIntegerFromText } from "@/libs/number.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import {
  composeEmptyCombatantStatistics,
  composeFightStatistics,
  getCombatantIdsInFight,
} from "@/src/core/fight-statistics.ts";
import {
  composeBreakdownLists,
  composeCombatantDetail,
  composeDeepLists,
  composeStat,
  type PanelDetailPlace,
} from "@/src/ui/panel-drill.ts";
import type { SkillStatistics } from "@/src/core/fight-statistics.ts";
import {
  composeDefaultState,
  getRowKeyMeaning,
  METRIC_LABELS,
  NO_ACTOR_ROW_KEY,
  NO_TARGET_ROW_KEY,
  PANEL_METRICS,
  type PanelMetric,
  type PanelList,
  type PanelRow,
  type PanelState,
  UNANNOUNCED_ROW_KEY,
} from "@/src/ui/panel-screen.ts";
import {
  getHealingGivenWithoutSkillBySource,
  getHealingReceivedWithoutSkillBySource,
  getMetricValue,
  getName,
  getRow,
  type PanelReading,
} from "@/src/ui/panel-reading.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterOfFight,
  composeStatisticsOfFight,
} from "@/tests/captured-fight-catalog.ts";

import {
  composeFigureText,
  CRITICAL_EFFECT_TOKENS,
  CRITICAL_TOKEN,
  DESTRUCTION_NAMES,
  getPhrase,
  PERCENT_DESTRUCTION_TOKEN,
} from "@/src/ui/panel-words.ts";
import { composeWithoutBrackets } from "@/tests/drawn-text.ts";

/**
 * ⚠️ **Composed the way the panel composes it, which it was not.** The entry health was
 * left off here, and it is what sizes a share the game states about a whole side — so
 * every assertion in this file ran over a fight whose healing was less than half of
 * what the panel draws, on fourteen of the seventeen recordings that audit read.
 * Nothing here was wrong: a section closing against the row it was entered from closes
 * either way. It was simply not this fight.
 */
const FIGHTS = CAPTURED_FIGHTS.map((fight) => ({
  name: fight.name,
  reading: {
    statistics: composeStatisticsOfFight(fight),
    roster: composeRosterOfFight(fight),
    ourSide: 1,
    isFromFightStart: true,
  } satisfies PanelReading,
}));

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

/**
 * How the panel spells a share it refuses to round down to nothing
 * (`src/ui/panel-words.ts`). Written out rather than imported: a sweep that read
 * the spelling off the module it is checking would agree with it whatever it said.
 */
const BELOW_A_POINT = "<1%";

/**
 * The heading the skills section is drawn under, written out for `BELOW_A_POINT`'s
 * reason: a sweep that read it off the module it is checking would find the section
 * whatever the module called it, and find nothing the day it called it nothing.
 */
const SKILL_HEADING = "CZYM (UMIEJĘTNOŚCI)";

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
   * **The measurement that lets the closing row retire from healing.**
   *
   * `Nie wiadomo, czym` used to stand for every point no announcement covered, and
   * it was a claim about the game rather than about the announcement: the game had
   * named the effect, under `heal`, `legbon_holytouch_heal` or `legbon_lastheal`,
   * and the panel was printing those very keys one section lower. The section now
   * names them, and what makes that safe rather than lossy is here — a skill or a
   * key accounts for every point, exactly, so nothing is left for a row to close
   * against (`src/ui/panel-drill.ts`, `CLOSING_LABELS`).
   *
   * Totalled by hand rather than through the reader that composes the section: a
   * test borrowing the subject's own arithmetic agrees with it whatever it says
   * (§9.5's note on `libs/running-total.ts`).
   */
  test("accounts for every point of healing by a skill or by a key", () => {
    let rows = 0;
    let drawn = 0;
    for (const { name, reading, metric, combatantId } of getScreens()) {
      if (metric !== "healed" && metric !== "healingGiven") continue;
      const row = getRow(reading, combatantId);
      const figure = getMetricValue(row, metric);
      if (figure <= 0) continue;

      let byKey = 0;
      const bySource =
        metric === "healed"
          ? getHealingReceivedWithoutSkillBySource(row)
          : getHealingGivenWithoutSkillBySource(row);
      for (const amount of bySource.values()) byKey += amount;

      let bySkill = 0;
      if (metric === "healingGiven") {
        for (const skill of row.skills.values()) bySkill += skill.healed;
      } else {
        // Healing received is announced on somebody else's row, so the sweep is
        // over every row's skills and not over this one's.
        for (const other of reading.statistics.byCombatantId.values()) {
          for (const skill of other.skills.values()) {
            bySkill += skill.healedByCombatantId.get(combatantId) ?? 0;
          }
        }
      }

      const where = `${name} ${metric} #${combatantId}`;
      expect(byKey + bySkill, where).toBe(figure);

      /**
       * And the section drawn from those two says the same figure. Both halves are
       * needed: the arithmetic above holds the aggregate, this holds the reader that
       * composes the rows out of it, and a section that stopped listing the keys
       * would pass the first while stating a total short by every one of them.
       *
       * Only where it is drawn — a cut of a single row repeats the figure above it
       * and is suppressed, which is `composeCrossSection`'s rule and not this test's
       * to restate.
       */
      const section = composeBreakdownLists(reading, composeState({ metric }), combatantId, null)
        .find((list) => list.heading === SKILL_HEADING);
      if (section !== undefined) {
        expect(section.totalText, where).toBe(composeFigureText(figure));
        drawn += 1;
      }
      rows += 1;
    }
    // A loop over nothing is green and proves nothing (§9.2).
    expect(rows).toBeGreaterThan(0);
    expect(drawn).toBeGreaterThan(0);
  });

  /**
   * The same claim read off what is drawn, which the one above cannot see: a
   * section short by a point is suppressed rather than shown wrong where it holds
   * one row, so the arithmetic and the rows are checked separately.
   *
   * Under damage the closing row is expected and counted, so neither half of this
   * can pass by finding nothing.
   */
  test("draws no row saying a heal cannot be named, at either level", () => {
    let healingRows = 0;
    let damageClosings = 0;
    for (const { name, reading, metric, combatantId } of getScreens()) {
      const state = composeState({ metric });
      const lists = composeBreakdownLists(reading, state, combatantId, null);
      const deep = lists
        .flatMap((list) => list.rows)
        .filter((row) => row.isDrillable && getRowKeyMeaning(row.key).opens === "target")
        .flatMap((row) => {
          const meaning = getRowKeyMeaning(row.key);
          if (meaning.opens !== "target") return [];
          return composeDeepLists(
            reading,
            { ...state, focusCombatantId: combatantId, focusTargetId: meaning.combatantId },
            combatantId,
            null,
          );
        });

      for (const list of [...lists, ...deep]) {
        for (const row of list.rows) {
          const where = `${name} ${metric} #${combatantId} ${list.heading}`;
          if (!row.key.includes(UNANNOUNCED_ROW_KEY)) {
            if (metric === "healed" || metric === "healingGiven") healingRows += 1;
            continue;
          }
          expect(metric, where).not.toBe("healed");
          expect(metric, where).not.toBe("healingGiven");
          damageClosings += 1;
        }
      }
    }
    expect(healingRows).toBeGreaterThan(0);
    expect(damageClosings).toBeGreaterThan(0);
  });

  /**
   * ⚠️ **A section states its own total and then a set of shares that does not come
   * to it.** Rounded a row at a time, 446 of the 5 612 sections the captures open
   * printed a column adding to 99, 101 or worse (measured 2026-08-22) — under a
   * heading stating the figure they are shares of, which is where a reader is most
   * likely to add them up. Apportioned together, they come to a hundred
   * (`composeShareTexts`).
   *
   * A share too small to round to a point states none and takes none, so it is
   * counted here as the nothing it prints.
   */
  test("prints shares that add up to the section total", () => {
    let sections = 0;
    for (const { name, reading, metric, combatantId } of getScreens()) {
      for (const list of composeBreakdownLists(reading, composeState({ metric }), combatantId, null)) {
        const where = `${name} ${metric} #${combatantId} ${list.heading}`;
        // A section of nothing divides by nothing, and every bracket in it says so.
        if (list.rows.every((row) => row.valueText === composeFigureText(0))) continue;
        let points = 0;
        for (const row of list.rows) {
          const bracket = row.bracketText;
          expect(bracket, where).not.toBeNull();
          if (bracket === null) continue;
          if (bracket.includes(BELOW_A_POINT)) continue;
          const percent = getIntegerFromText(composeWithoutBrackets(bracket).split("·")[0]!.trim());
          expect(percent, `${where} ${bracket}`).not.toBeNull();
          points += percent ?? 0;
        }
        expect(points, `${where}: the shares add up to ${points}`).toBe(100);
        sections += 1;
      }
    }
    // A loop over nothing is green and proves nothing (§9.2).
    expect(sections).toBeGreaterThan(0);
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
   * captures as the set stood 2026-08-19, all 31 of its occurrences are reachable
   * by opening a person it was used on
   * (`docs/specs/the-panel-that-drills.md`). Both
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
      // ⚠️ **By what the rows are, not by where the list sits.** The people list is
      // dropped where it would be empty, so on a screen with no named counterpart the
      // first list is a cut — and reading `lists[0]` as *the* people list held only
      // while the fixture never produced that screen.
      const about = lists.find((list) =>
        list.rows.some((row) => getRowKeyMeaning(row.key).opens === "target"),
      );
      const cuts = lists.filter((list) => list !== about);
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

/**
 * The one place the card counts a token of the game's by name, and the one place it has
 * to leave the same token out.
 *
 * ⚠️ **Four spellings of two names, and none of them stood on anything.** The counters
 * line asked the row for `crit` and `legbon_verycrit`; the effects line beside it
 * filtered the same two out, because a critical already counted must not be counted
 * again. Every one of the four could be pointed at a token the game never sends with
 * the whole gate green — the counter reading nothing, or the effects line growing a row
 * that is already above it.
 */
describe("a critical, counted once", () => {
  const WITH_EFFECTS = FIGHTS.flatMap(({ name, reading }) =>
    [...reading.statistics.byCombatantId]
      .filter(([, row]) => row.procsOnBlowsStruck.size > 0)
      .map(([combatantId, row]) => ({ name, reading, combatantId, row })),
  );

  test("the recordings carry a critical to count", () => {
    expect(WITH_EFFECTS.length).toBeGreaterThan(0);
    expect(
      WITH_EFFECTS.some(({ row }) => (row.procsOnBlowsStruck.get(CRITICAL_TOKEN) ?? 0) > 0),
    ).toBe(true);
  });

  test("stands in the counters line under its own count", () => {
    let counted = 0;
    for (const { name, reading, combatantId, row } of WITH_EFFECTS) {
      const critical = row.procsOnBlowsStruck.get(CRITICAL_TOKEN) ?? 0;
      if (critical <= 0) continue;
      const lines = composeCombatantDetail(reading, combatantId, composeState(), null, "ranking");
      const counters = lines.filter((line) => line.kind === "note" && line.text.includes("kryt."));

      expect(counters.length, `${name} #${combatantId}`).toBe(1);
      expect(counters[0]?.kind === "note" ? counters[0].text : "", `${name} #${combatantId}`)
        .toContain(`kryt. ${composeFigureText(critical)}`);
      counted += 1;
    }
    expect(counted).toBeGreaterThan(0);
  });

  test("and is left out of the effects line, which lists what is not counted above", () => {
    let listed = 0;
    let withheld = 0;
    for (const { name, reading, combatantId, row } of WITH_EFFECTS) {
      const lines = composeCombatantDetail(reading, combatantId, composeState(), null, "ranking");
      const at = lines.findIndex(
        (line) => line.kind === "heading" && line.text === "Efekty w ciosach",
      );
      const rest = [...row.procsOnBlowsStruck.keys()].filter(
        (token) => !CRITICAL_EFFECT_TOKENS.includes(token),
      );
      const where = `${name} #${combatantId}`;

      if (rest.length === 0) {
        // Everything this combatant fired is already in the counters line, so the
        // section is absent rather than empty.
        expect(at, where).toBe(-1);
        withheld += 1;
        continue;
      }
      expect(at, where).toBeGreaterThan(-1);
      const note = lines[at + 1];
      expect(note?.kind, where).toBe("note");
      expect((note?.kind === "note" ? note.text : "").split(" · ").length, where).toBe(rest.length);
      listed += 1;
    }
    expect(listed).toBeGreaterThan(0);
    expect(withheld).toBeGreaterThan(0);
  });
});

/**
 * The destroyed block's members are not in one unit, and only one of them says so.
 *
 * `+resdmg` is percentage points and the other three are points
 * (`docs/protocol-keys.md`), so the `%` is the whole of what keeps four figures under
 * one heading from reading as four of the same thing (§10). The token that decides it
 * was spelled at the conditional and nothing held it.
 */
describe("a destroyed statistic carries its unit", () => {
  const DESTROYED = FIGHTS.flatMap(({ name, reading }) =>
    [...reading.statistics.byCombatantId]
      .filter(([, row]) => [...row.destroyed.values()].some((amount) => amount > 0))
      .map(([combatantId, row]) => ({ name, reading, combatantId, row })),
  );

  function getStatValue(
    reading: PanelReading,
    combatantId: number,
    label: string,
  ): string | null {
    for (const line of composeCombatantDetail(reading, combatantId, composeState(), null, "ranking")) {
      if (line.kind === "stat" && line.label === label) return line.value;
    }
    return null;
  }

  test("the recordings carry both units", () => {
    expect(DESTROYED.some(({ row }) => row.destroyed.has(PERCENT_DESTRUCTION_TOKEN))).toBe(true);
    expect(
      DESTROYED.some(({ row }) =>
        [...row.destroyed.keys()].some((token) => token !== PERCENT_DESTRUCTION_TOKEN),
      ),
    ).toBe(true);
  });

  test("percentage points are drawn as percentage points, and points are not", () => {
    let inPercent = 0;
    let inPoints = 0;
    for (const { name, reading, combatantId, row } of DESTROYED) {
      for (const [token, amount] of row.destroyed) {
        if (amount <= 0) continue;
        const value = getStatValue(reading, combatantId, getPhrase(DESTRUCTION_NAMES, token, null));
        const where = `${name} #${combatantId} ${token}`;
        expect(value, where).not.toBeNull();
        if (token === PERCENT_DESTRUCTION_TOKEN) {
          expect(value, where).toBe(`${composeFigureText(amount)}%`);
          inPercent += 1;
        } else {
          expect(value, where).toBe(composeFigureText(amount));
          inPoints += 1;
        }
      }
    }
    expect(inPercent).toBeGreaterThan(0);
    expect(inPoints).toBeGreaterThan(0);
  });
});

/**
 * One combatant with figures put there by hand.
 *
 * A capture cannot be asked for a figure of exactly one point, or for a pair whose
 * cut holds exactly two rows, and both are edges the drill decides something on.
 */
const CRAFTED_ROSTER = composeCombatantRoster([
  { id: 1, name: "a", side: 1, profession: "m", level: 100, maximumHealth: null },
  { id: 2, name: "b", side: 2, profession: null, level: null, maximumHealth: null },
  { id: 3, name: "c", side: 2, profession: null, level: 40, maximumHealth: null },
]);

type CraftedRow = Partial<ReturnType<typeof composeEmptyCombatantStatistics>>;

/** Pairs rather than an object: an object's keys are text, and turning them back
 * into numbers would put a reader here that `libs/number.ts` owns (§9.5). */
function composeCraftedReading(rows: ReadonlyArray<readonly [number, CraftedRow]>): PanelReading {
  const statistics = composeFightStatistics(decodeFight([], CRAFTED_ROSTER), CRAFTED_ROSTER);
  return {
    statistics: {
      ...statistics,
      byCombatantId: new Map(
        rows.map(([id, row]) => [id, { ...composeEmptyCombatantStatistics(), ...row }]),
      ),
    },
    roster: CRAFTED_ROSTER,
    ourSide: 1,
    isFromFightStart: true,
  };
}

/**
 * Whether a row opens onto anything is decided by how many rows the level below would
 * hold — elements and keys **together**, because they are drawn as one section. That
 * addition could be turned into a subtraction with the gate green, which turns a pair
 * holding one of each into a leaf.
 */
describe("a pair opens on what its cut would hold", () => {
  const OPPONENT = 2;

  function getOpponentRow(opponent: CraftedRow): PanelRow | undefined {
    const reading = composeCraftedReading([
      [
        1,
        {
          taken: 5,
          takenByElement: new Map([["dmg", 5]]),
          takenByActorId: new Map([[OPPONENT, new Map([["dmg", 5]])]]),
        },
      ],
      [OPPONENT, opponent],
    ]);
    for (const list of composeBreakdownLists(reading, composeState({ metric: "taken" }), 1, null)) {
      for (const row of list.rows) {
        const meaning = getRowKeyMeaning(row.key);
        if (meaning.opens === "target" && meaning.combatantId === OPPONENT) return row;
      }
    }
    return undefined;
  }

  test("one element and one key together are two rows, so it opens", () => {
    const row = getOpponentRow({
      dealtApplied: 5,
      dealtByTargetId: new Map([[1, new Map([["dmg", 5]])]]),
      healthLostCaused: 3,
      healthLostCausedByTargetId: new Map([[1, new Map([["poison", 3]])]]),
    });

    expect(row?.isDrillable).toBe(true);
  });

  test("one row is what the row above already says, so it does not", () => {
    const row = getOpponentRow({
      dealtApplied: 5,
      dealtByTargetId: new Map([[1, new Map([["dmg", 5]])]]),
    });

    expect(row?.isDrillable).toBe(false);
  });
});

/**
 * Every figure on the card, at one point and at none.
 *
 * ⚠️ **Zero is the boundary and one is the side of it nothing stood on** (§7.5). Each
 * section here is drawn on `> 0`, and every one of those edges could be moved a step
 * with the whole gate green: a combatant who blocked one point, took one outside a blow
 * or destroyed one point of somebody's resistance simply lost the line saying so. A
 * hand-built row rather than a capture, because a fight where a figure is exactly one
 * is not something the recordings can be asked for.
 */
describe("a figure of one point, and of none", () => {
  function composeCardOf(over: CraftedRow) {
    return composeCombatantDetail(
      composeCraftedReading([[1, over]]),
      1,
      composeState(),
      null,
      "ranking",
    );
  }

  const ONE = {
    taken: 1,
    healthLost: 1,
    dealtApplied: 1,
    healthLostCaused: 1,
    largestBlow: 1,
    blowsStruck: 1,
    prevented: new Map([["blok", 1]]),
    destroyed: new Map([["resdmg", 1]]),
  };

  function getLabels(lines: ReturnType<typeof composeCombatantDetail>): string[] {
    return lines.map((line) => (line.kind === "stat" ? line.label : line.text));
  }

  test("one point of health lost outside a blow is said, and none is not", () => {
    // Both directions: the split reads `healthLost` under what was received and
    // `healthLostCaused` under what was dealt, and one point of either draws it. The
    // two labels are the words a player reads, so they are read here rather than
    // fetched from the module that writes them.
    const said = getLabels(composeCardOf(ONE));
    expect(said.filter((label) => label === "  z ciosów").length).toBe(2);
    expect(said.filter((label) => label === "  poza ciosem").length).toBe(2);
    expect(getLabels(composeCardOf({ taken: 1, dealtApplied: 1 }))).not.toContain("  poza ciosem");
  });

  /**
   * The counters line, whole — the words, their order, and the ` · ` between them.
   * Everything in it is drawn from one string, so a separator nothing asserts is a
   * line that can run together with the gate green (F4).
   */
  test("the counters line reads as one sentence of counts", () => {
    const said = composeCardOf({
      ...ONE,
      blowsStruck: 3,
      blowsWithoutSkill: 2,
      procsOnBlowsStruck: new Map([[CRITICAL_TOKEN, 1]]),
    }).find((line) => line.kind === "note" && line.text.startsWith("ciosy"));

    expect(said?.kind === "note" ? said.text : "").toBe(
      "ciosy 3 (w tym 2 zwykłe) · kryt. 1 · maks. cios 1",
    );
  });

  /** What a defence stopped is part of what never arrived, and the note says so. */
  test("the stopped block carries the limit of what the game states", () => {
    expect(getLabels(composeCardOf(ONE))).toContain(
      "To część tego, co nie doszło — reszty gra nie podaje.",
    );
    expect(
      getLabels(composeCardOf({ ...ONE, prevented: new Map([["blok", 0]]) })),
    ).not.toContain("To część tego, co nie doszło — reszty gra nie podaje.");
  });

  /** A combatant the roster cannot describe is said to be one, never left blank. */
  test("a profession nobody stated is named as one", () => {
    // The roster states this one's level and not their profession, which is the
    // shape a monster arrives in: the heading has something to say and half of it
    // is missing.
    const lines = composeCombatantDetail(
      composeCraftedReading([[3, { taken: 1 }]]),
      3,
      composeState(),
      null,
      "ranking",
    );

    expect(getLabels(lines)).toContain("nieznana profesja (40)");
  });

  test("one point stopped by a defence is said, and none is not", () => {
    expect(getLabels(composeCardOf(ONE))).toContain("Zatrzymane");
    expect(getLabels(composeCardOf({ ...ONE, prevented: new Map([["blok", 0]]) }))).not.toContain(
      "Zatrzymane",
    );
  });

  test("one point destroyed is said, and none is not", () => {
    expect(getLabels(composeCardOf(ONE))).toContain("Zniszczone");
    expect(getLabels(composeCardOf({ ...ONE, destroyed: new Map([["resdmg", 0]]) }))).not.toContain(
      "Zniszczone",
    );
  });

  test("a largest blow of one point is said, and none is not", () => {
    const getCounters = (row: Partial<typeof ONE>) =>
      composeCardOf(row).find((line) => line.kind === "note" && line.text.startsWith("ciosy"));

    const said = getCounters(ONE);
    expect(said?.kind === "note" ? said.text : "").toContain("maks. cios 1");
    const silent = getCounters({ ...ONE, largestBlow: 0 });
    expect(silent?.kind === "note" ? silent.text : "").not.toContain("maks. cios");
  });
});

/**
 * Every list the drill draws reads downwards, and until this existed nothing said so.
 *
 * ⚠️ **Six comparators, every one of which could be turned into a sum with the gate
 * green**. A breakdown answers *what is this figure made of*, and the answer is read
 * off the top of the list — the largest contributor first, the way the ranking above it
 * reads. Writing the closing round of this test is what found the healing screen's `OD
 * CZEGO` returning before the sort.
 *
 * The rows that close a list are exempt and stand last whatever they hold: what nobody
 * is named for is not a contributor to be ranked among the ones who are.
 */
describe("a breakdown reads downwards", () => {
  test("every list is ordered by its figure, largest first", () => {
    let compared = 0;
    for (const { name, reading, metric, combatantId } of getScreens()) {
      for (const list of composeBreakdownLists(reading, composeState({ metric }), combatantId, null)) {
        const ranked = list.rows.filter(
          (row) =>
            row.key !== NO_ACTOR_ROW_KEY &&
            row.key !== NO_TARGET_ROW_KEY &&
            !row.key.includes(UNANNOUNCED_ROW_KEY),
        );
        for (let at = 1; at < ranked.length; at += 1) {
          const where = `${name} ${metric} #${combatantId} ${list.heading} ${at}`;
          expect(ranked[at]!.fill, where).toBeLessThanOrEqual(ranked[at - 1]!.fill);
        }
        if (ranked.length > 1) compared += 1;
      }
    }
    // A sweep over lists of one row proves nothing about an order (§9.2).
    expect(compared).toBeGreaterThan(0);
  });

  /**
   * The section of a pair, one level further in, where the same comparator is
   * written again. Reached only where a row opens onto a pair, so it is counted
   * rather than assumed.
   */
  test("and so does the list under one opponent", () => {
    let compared = 0;
    for (const { name, reading, metric, combatantId } of getScreens()) {
      for (const list of composeBreakdownLists(reading, composeState({ metric }), combatantId, null)) {
        for (const row of list.rows) {
          if (!row.isDrillable) continue;
          const meaning = getRowKeyMeaning(row.key);
          if (meaning.opens !== "target") continue;
          const state = composeState({ metric, focusCombatantId: combatantId, focusTargetId: meaning.combatantId });
          for (const deep of composeDeepLists(reading, state, combatantId, null)) {
            const ranked = deep.rows.filter((one) => !one.key.includes(UNANNOUNCED_ROW_KEY));
            for (let at = 1; at < ranked.length; at += 1) {
              const where = `${name} ${metric} #${combatantId} → ${deep.heading} ${at}`;
              expect(ranked[at]!.fill, where).toBeLessThanOrEqual(ranked[at - 1]!.fill);
            }
            if (ranked.length > 1) compared += 1;
          }
        }
      }
    }
    expect(compared).toBeGreaterThan(0);
  });
});

/**
 * The headings the sections are drawn under, read off the screen rather than
 * fetched from the table that writes them (F4).
 */
describe("what a section is called", () => {
  test("healing received is broken down by what it came from", () => {
    // Two rows, because a cut of one repeats the figure above it and is not drawn
    // (`docs/specs/the-panel-that-drills.md`).
    const reading = composeCraftedReading([
      [
        1,
        {
          healed: 12,
          healedBySource: new Map([
            ["heal", 10],
            ["heal_target", 2],
          ]),
        },
      ],
    ]);
    const headings = composeBreakdownLists(
      reading,
      composeState({ metric: "healed" }),
      1,
      null,
    ).map((list) => list.heading);

    expect(headings).toContain("OD CZEGO");
  });

  /**
   * ⚠️ **And healing *given* has no such section at all.** The keys the game states
   * belong to whoever received the health, so a giver has none — the heading for that
   * screen is vocabulary nothing can read, and this is what says so rather than a
   * comment.
   */
  test("healing given is broken down by nothing, on every recording", () => {
    let screens = 0;
    for (const { name, reading } of FIGHTS) {
      for (const combatantId of reading.statistics.byCombatantId.keys()) {
        const headings = composeBreakdownLists(
          reading,
          composeState({ metric: "healingGiven" }),
          combatantId,
          null,
        ).map((list) => list.heading);

        expect(headings, `${name} #${combatantId}`).not.toContain("OD CZEGO");
        screens += 1;
      }
    }
    expect(screens).toBeGreaterThan(0);
  });

  test("damage is broken down by its type", () => {
    const reading = composeCraftedReading([
      [
        1,
        {
          taken: 12,
          takenByElement: new Map([
            ["dmg", 10],
            ["dmgf", 2],
          ]),
        },
      ],
    ]);
    const headings = composeBreakdownLists(
      reading,
      composeState({ metric: "taken" }),
      1,
      null,
    ).map((list) => list.heading);

    expect(headings).toContain("TYP OBRAŻEŃ");
  });
});

/**
 * The edges the fifth audit's F2 left, swept again and asked for one at a time.
 *
 * ⚠️ **Its close named three and there were twenty** — every one of them a `> 0` or a
 * `<= 0` deciding whether a row, a section or a count exists at all. They are asked of
 * a hand-built row for the reason the rest of this file's crafted cases are: a
 * recording cannot be asked for a figure of exactly one.
 */
describe("what a single point decides", () => {
  const OPPONENT = 2;

  function composeSkill(over: Partial<SkillStatistics> = {}): SkillStatistics {
    return {
      skillName: "coś",
      uses: 1,
      dealtApplied: 0,
      dealtByTargetId: new Map(),
      healed: 0,
      healedByCombatantId: new Map(),
      ...over,
    };
  }

  function getLists(row: CraftedRow, metric: PanelMetric = "dealt"): PanelList[] {
    return composeBreakdownLists(
      composeCraftedReading([[1, row]]),
      composeState({ metric }),
      1,
      null,
    );
  }

  test("a use of a skill is counted where there is one, and said nowhere where there is none", () => {
    const getStatLabels = (uses: number): string[] =>
      composeCombatantDetail(
        composeCraftedReading([[1, { dealtApplied: 10, skillsUsed: uses }]]),
        1,
        composeState(),
        null,
        "ranking",
      ).map((line) => (line.kind === "stat" ? line.label : ""));

    expect(getStatLabels(1)).toContain("Użycia umiejętności");
    expect(getStatLabels(0)).not.toContain("Użycia umiejętności");
  });

  /** The screen's own figure is the bold one, and it is the only bold one. */
  test("the card marks the metric the screen is on, and no other", () => {
    for (const metric of PANEL_METRICS) {
      const strong = composeCombatantDetail(
        composeCraftedReading([[1, { dealtApplied: 4, taken: 3, healingGiven: 2, healed: 1 }]]),
        1,
        composeState({ metric }),
        null,
        "ranking",
      ).filter((line) => line.kind === "stat" && line.isStrong);

      expect(strong.length, metric).toBe(1);
      expect(strong[0]?.kind === "stat" ? strong[0].label : "", metric).toBe(METRIC_LABELS[metric]);
    }
  });

  test("a pair holding one point is a row, and a pair holding none is not", () => {
    const getPairRows = (amount: number): string[] =>
      getLists({
        dealtApplied: amount,
        dealtByTargetId: new Map([[OPPONENT, new Map([["dmg", amount]])]]),
      })[0]?.rows.map((row) => row.valueText) ?? [];

    expect(getPairRows(1)).toEqual(["1"]);
    expect(getPairRows(0)).toEqual([]);
  });

  /**
   * The bar's own arithmetic: every row is drawn against the largest of its list,
   * and a list whose largest is nothing must not divide by it.
   */
  test("a list of nothing draws no bar, and the largest row fills its own", () => {
    const lists = getLists({
      dealtApplied: 3,
      dealtByTargetId: new Map([
        [OPPONENT, new Map([["dmg", 2]])],
        [3, new Map([["dmg", 1]])],
      ]),
    });

    expect(lists[0]?.rows.map((row) => row.fill)).toEqual([1, 0.5]);
  });

  /**
   * What the pairs do not cover is a row of its own, or the section would total
   * less than the figure it was entered from with nothing saying why — and one
   * point is a difference as much as a thousand are.
   */
  test("a single point no pair covers is a row, and none is not", () => {
    const getRowKeys = (figure: number): string[] =>
      getLists({
        dealtApplied: figure,
        dealtByTargetId: new Map([[OPPONENT, new Map([["dmg", 5]])]]),
      })[0]?.rows.map((row) => row.key) ?? [];

    expect(getRowKeys(6)).toContain(NO_TARGET_ROW_KEY);
    expect(getRowKeys(5)).not.toContain(NO_TARGET_ROW_KEY);
  });

  test("a skill that landed one point is a row, and one that landed none is not", () => {
    // Two skills, because a cut of one row repeats the figure above it and is not
    // drawn at all (`docs/specs/the-panel-that-drills.md`).
    const getSkillFigures = (amount: number): string[] =>
      getLists({
        dealtApplied: amount + 5,
        skills: new Map([
          ["small", composeSkill({ skillName: "mały", dealtApplied: amount })],
          ["big", composeSkill({ skillName: "duży", dealtApplied: 5 })],
        ]),
      })
        .find((list) => list.heading === "CZYM (UMIEJĘTNOŚCI)")
        ?.rows.map((row) => row.valueText) ?? [];

    expect(getSkillFigures(1)).toEqual(["5", "1"]);
    // At nothing the skill is not a row, which leaves the section a single row
    // repeating the figure above it — so the section is not drawn at all.
    expect(getSkillFigures(0)).toEqual([]);
  });

  /**
   * The closing row is what nothing announced, and it says two different things:
   * a figure, and how many blows carried no skill at all. Either one alone is
   * enough to draw it, and neither is enough to draw it wrong — a figure of
   * nothing beside a count is the shape a plain blow that dealt nothing takes.
   */
  test("what nothing announced is a row for a point, for a blow, and for neither", () => {
    const getClosingRow = (rest: number, plainBlows: number): PanelRow | undefined =>
      getLists({
        dealtApplied: 10 + rest,
        blowsStruck: plainBlows,
        blowsWithoutSkill: plainBlows,
        skills: new Map([["k", composeSkill({ dealtApplied: 10 })]]),
      })
        .find((list) => list.heading === "CZYM (UMIEJĘTNOŚCI)")
        ?.rows.find((row) => row.key.includes(UNANNOUNCED_ROW_KEY));

    expect(getClosingRow(1, 0)?.valueText).toBe("1");
    expect(getClosingRow(0, 1)?.valueText).toBe("0");
    expect(getClosingRow(0, 1)?.bracketText).toContain("×1");
    expect(getClosingRow(0, 0)).toBeUndefined();
  });
});
