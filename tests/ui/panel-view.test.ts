/**
 * What the panel decides, held to the spec that decided it.
 *
 * Nothing here touches a document: the view is data, and every promise worth
 * making — what a figure is divided by, which row can be clicked, what is said
 * when there is nothing to say — is a promise about that data.
 *
 * The words are checked as carefully as the numbers. A panel that says
 * "protokół" to a player is broken in the same way a wrong total is: it answers
 * a question nobody asked, in a vocabulary they did not agree to learn.
 */

import { describe, expect, test } from "bun:test";
import { composeJsonText } from "@/libs/json.ts";
import { setRunningTotal } from "@/libs/running-total.ts";
import { assertDefined } from "@/libs/assert.ts";
import { composeIntegerText, getIntegerFromText } from "@/libs/number.ts";
import { composeCombatantsOfPayload } from "@/tools/fight-dump-parser.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics, getCombatantIdsInFight } from "@/src/core/fight-statistics.ts";
import {
  composeFigureText,
  getNeitherEndLeftover,
  HEALTH_GAIN_SOURCE_NAMES,
  HEALTH_LOSS_SOURCE_NAMES,
} from "@/src/ui/panel-words.ts";
import {
  composeDefaultState,
  isGivenMetric,
  NO_ACTOR_ROW_KEY,
  NO_TARGET_ROW_KEY,
  PANEL_METRICS,
  PANEL_TEAMS,
  type PanelDetailLine,
  type PanelMetric,
  type PanelRow,
  type PanelState,
  type PanelView,
  PANEL_KEEP_LIMITS,
  PANEL_STORAGE_CHOICES,
  type PanelKeptFight,
} from "@/src/ui/panel-screen.ts";
import type { PanelReading } from "@/src/ui/panel-reading.ts";
import {
  composeFightsView,
  composePanelView,
  getFightOutcome,
  PANEL_WAITING,
  type PanelFightsReading,
} from "@/src/ui/panel-view.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterFromSnapshots,
  composeRosterOfFight,
  composeStatisticsOfFight,
} from "@/tests/captured-fight-catalog.ts";

/**
 * A fight with two sides, a healer, a tick of poison and one unreadable message.
 *
 * Hand-written rather than captured, because the point of most of these is a
 * shape the material happens not to contain — a combatant who did nothing, a
 * side with one member, a heal that names its caster.
 */
function composeReading(overrides: Partial<PanelReading> = {}): PanelReading {
  const roster = composeCombatantRoster([
    { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
    { id: 2, name: "łowca", side: 1, profession: "h", level: 93, maximumHealth: null },
    { id: 4, name: "tarcza", side: 1, profession: "w", level: 120, maximumHealth: null },
    { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
  ]);
  const statistics = composeFightStatistics(
    decodeFight(
      [
        "1=90.00;3=50.00;+dmg=500;-dmg=400",
        "2=90.00;3=40.00;+dmg=200;-dmg=100",
        "3=40.00;0;poison=60",
        // The skill name is ours. This file is driven by a hand-written fight
        // precisely because the drill names skills and combatants and those are
        // the game's own prose (§5) — and it had one of the game's own ability
        // names in it, which is the contradiction
        // `docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md` F2 is
        // about, arriving from a direction the finding did not name.
        "1=90.00;4=80.00;tspell=Skill One;skillId=7",
        "1=90.00;4=95.00;heal_target=300",
        // ⚠️ **A heal nothing announced, under a key the help says nothing about.**
        // It was `4=95.00;0;heal=50` — regeneration — until the help settled that
        // `heal` is the healed combatant's own effect and it stopped being
        // healer-less (`docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`).
        // The figure is the same 50 on the same combatant, so every total in this
        // file is untouched; what the key change preserves is the one thing this
        // fixture needs and `heal` can no longer provide — healing the panel has
        // nobody to put on the giving end of.
        "1=90.00;4=95.00;heal_target=50",
        // And a heal that does have one: regeneration, which the help calls the
        // healed combatant's own effect, so `tarcza` is both ends of it. The two
        // lines together are what keep this fixture drawing both healing shapes —
        // and on one combatant, so `łowca` stays the row with no healing at all,
        // which is what "zero and unknown are different sentences" reads.
        "4=95.00;0;heal=50",
        "0;0;nonsense_key=1",
      ],
      roster,
    ),
    roster,
  );

  return {
    statistics,
    roster,
    ourSide: 1,
    isFromFightStart: true,
    ...overrides,
  };
}

/**
 * A fight where one end of a blow goes unnamed — both ends, in one of them.
 *
 * Hand-written because no capture reaches it: every name in every recording
 * resolves, so `unattributed` is zero throughout and the terms this fight is for
 * would be invisible. Three readers now — the closure below, the sweep of every
 * sentence, and the summary's third part, which stands for exactly this shape
 * (`docs/specs/2026-08-18-a-tick-nobody-swung-still-has-a-side.md`).
 */
function composeReadingWithUnnamedEnds(): PanelReading {
  const roster = composeCombatantRoster([
    { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
    { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
  ]);
  const statistics = composeFightStatistics(
    decodeFight(
      [
        // Nobody swung it, and it landed on somebody named.
        "0;3=50.00;+dmg=500;-dmg=400",
        // Somebody named swung it, and it landed on nobody the roster holds.
        "1=90.00;0;+dmg=300;-dmg=200",
      ],
      roster,
    ),
    roster,
  );
  return { statistics, roster, ourSide: 1, isFromFightStart: true } satisfies PanelReading;
}

function composeState(overrides: Partial<PanelState> = {}): PanelState {
  return { ...composeDefaultState(), ...overrides };
}

/**
 * The row for the figure with no actor, off a view that now draws up to two.
 *
 * Almost everything here asks about that one: it is the hole every capture
 * carries, and the one the fixture is built around. The row for a missing
 * **target** is asked about by name where it is the subject
 * (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`).
 */
function getNoActorRow(view: PanelView): PanelRow | null {
  return view.pinnedRows.find((row) => row.key === NO_ACTOR_ROW_KEY) ?? null;
}

function getNoTargetRow(view: PanelView): PanelRow | null {
  return view.pinnedRows.find((row) => row.key === NO_TARGET_ROW_KEY) ?? null;
}

function getEveryRow(view: PanelView): PanelRow[] {
  return [...view.lists.flatMap((list) => list.rows), ...view.pinnedRows];
}

/**
 * What this screen divides by, as a number, read back off the summary.
 *
 * The view states the whole in exactly one place — `My + Oni + Bez strony`, the
 * three parts every bracket on the screen is a share of, the third of them absent
 * on any fight where every point has a side at one end. Reading it here rather
 * than exporting the function keeps the test on what the panel *says*, which is
 * the thing a wrong total would be wrong in.
 */
function getWholeFromSummary(view: PanelView): number | null {
  const { sides } = view;
  if (sides === null) return null;
  const parts = [sides.mineText, sides.enemyText, sides.nobody?.text ?? "0"].map((text) =>
    getIntegerFromText(text.replace(/\s/g, "")),
  );
  if (parts.some((part) => part === null)) return null;
  return parts.reduce<number>((total, part) => total + (part ?? 0), 0);
}

/** The bar's three figures as numbers, in the order it draws them. */
function getSideFigures(view: PanelView): { mine: number; enemy: number; nobody: number } {
  const { sides } = view;
  const getFigure = (text: string): number =>
    assertDefined(getIntegerFromText(text.replace(/\s/gu, "")), `figure in ${text}`);
  if (sides === null) return { mine: 0, enemy: 0, nobody: 0 };
  return {
    mine: getFigure(sides.mineText),
    enemy: getFigure(sides.enemyText),
    nobody: sides.nobody === null ? 0 : getFigure(sides.nobody.text),
  };
}

/**
 * Every string the panel would put on screen for this view.
 *
 * ⚠️ **The summary under the list was missing from here**, so the one region
 * this round changes was also the one the §3 sweeps had never read. A list of
 * places to look is a list somebody keeps, and it goes stale the moment a region
 * is added — which is what happened.
 */
function getEveryString(view: PanelView): string[] {
  return [
    view.title,
    ...(view.sides === null
      ? []
      : [
          view.sides.label,
          view.sides.mineText,
          view.sides.enemyText,
          view.sides.nobody?.label ?? "",
          view.sides.nobody?.text ?? "",
        ]),
    view.outcomeText ?? "",
    view.emptyText ?? "",
    view.emptyLimitText ?? "",
    ...view.nounTabs.map((tab) => tab.label),
    ...view.directionTabs.map((tab) => tab.label),
    ...view.teamTabs.map((tab) => tab.label),
    ...(view.crumb === null ? [] : [view.crumb.backLabel, view.crumb.hereLabel]),
    ...view.lists.flatMap((list) => [list.heading ?? "", list.totalText ?? ""]),
    ...getEveryRow(view).flatMap((row) => [
      row.label,
      row.valueText,
      row.bracketText ?? "",
      // Every line of the detail, whatever shape it is: a heading going technical
      // would be as bad as a label doing it, and only one of the two is obvious.
      ...row.detail.map((line) => (line.kind === "stat" ? `${line.label} ${line.value}` : line.text)),
      // ⚠️ **The row's own warnings, which arrived with nothing reading them.**
      // They are also in `detail`, so a sweep reading only that would pass while
      // the sentence the mark opens onto said something else entirely — the two
      // are one string by construction and this is what holds them to it.
      ...row.warnings,
    ]),
    ...view.warnings,
  ];
}

describe("the ranking", () => {
  test("numbers the rows from one, biggest first", () => {
    const view = composePanelView(composeReading(), composeState());
    const rows = view.lists[0]!.rows;

    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3, 4]);
    expect(rows[0]!.label).toBe("mag");
    expect(rows.map((row) => row.isDrillable)).toEqual([true, true, true, true]);
  });

  /**
   * A combatant who has not done anything yet is still in the fight, and a row
   * missing reads as "there is no such person" rather than "they have not
   * started".
   *
   * `tarcza` deals nothing all fight and is healed, so the protocol names her
   * and the aggregate holds a row. The stronger case — somebody no message
   * mentions at all — is below, and it needs its own fixture.
   */
  test("keeps a combatant who has done nothing", () => {
    const view = composePanelView(composeReading(), composeState());

    expect(view.lists[0]!.rows.map((row) => row.label)).toContain("tarcza");
  });

  /**
   * The other half of that, and the half the panel did not do: somebody the
   * **protocol has not mentioned**, so the aggregate has no row for them at all.
   *
   * Its own fixture rather than a fifth member of the shared one, whose rank and
   * side-filter assertions are about four named combatants and should stay that
   * way. Every metric, because a row that appeared under one figure and vanished
   * under another would be worse than one that was never there.
   */
  test("keeps a combatant no message has named", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
      { id: 2, name: "cichy", side: 1, profession: "w", level: 90, maximumHealth: null },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
    ]);
    const reading: PanelReading = {
      statistics: composeFightStatistics(
        decodeFight(["1=90.00;3=50.00;+dmg=500;-dmg=400"], roster),
        roster,
      ),
      roster,
      ourSide: 1,
      isFromFightStart: true,
    };

    expect(reading.statistics.byCombatantId.has(2)).toBe(false);
    for (const metric of PANEL_METRICS) {
      const rows = composePanelView(reading, composeState({ metric })).lists[0]!.rows;
      const silent = rows.find((row) => row.label === "cichy");

      expect(silent?.valueText, metric).toBe(composeFigureText(0));
      // Drilling in says the fact rather than opening onto nothing, which is the
      // sentence the panel already had for a combatant on zero.
      expect(
        composePanelView(reading, composeState({ metric, focusCombatantId: 2 })).emptyText,
        metric,
      ).toBeTruthy();
    }
  });

  /**
   * ⚠️ **At the start of a fight every figure is zero, so the whole list is one
   * tie** — and what breaks it has to be a property of the fight rather than of
   * the figures, or the list reshuffles under the eye of somebody reading it
   * while the panel redraws every few seconds.
   *
   * It is the game's own order: the roster keeps first-seen order
   * (`src/game/engine-roster.ts`), so the opening screen reads the way the client
   * listed the warriors. `pierwsza` is written second by id on purpose — an
   * id-sorted or name-sorted answer gets this wrong.
   */
  test("ties keep the order the game listed the fight in", () => {
    const roster = composeCombatantRoster([
      { id: 9, name: "pierwsza", side: 1, profession: "m", level: 100, maximumHealth: null },
      { id: 2, name: "druga", side: 1, profession: "w", level: 100, maximumHealth: null },
      { id: 5, name: "trzecia", side: 2, profession: "h", level: 100, maximumHealth: null },
    ]);
    const reading: PanelReading = {
      statistics: composeFightStatistics([], roster),
      roster,
      ourSide: 1,
      isFromFightStart: true,
    };

    const drawn = composePanelView(reading, composeState()).lists[0]!.rows.map((row) => row.label);

    expect(drawn).toEqual(["pierwsza", "druga", "trzecia"]);
    // And the same order on the next redraw, which is the property this exists
    // for: two composings of one reading cannot disagree.
    expect(composePanelView(reading, composeState()).lists[0]!.rows.map((row) => row.label)).toEqual(
      drawn,
    );
  });

  test("the bracket carries the share of the whole", () => {
    const view = composePanelView(composeReading(), composeState());

    expect(view.lists[0]!.rows[0]!.bracketText).toMatch(/^\(\d+%\)$/);
  });

  /**
   * Ten under a filter because that is the most a side fields, eleven when both
   * are on the list. The number is the view's so the height can be computed from
   * a token rather than typed into a stylesheet twice.
   *
   * A **floor** and not a size: four combatants get eleven bars' worth of window,
   * because a list that grew as they arrived would move under the hand of somebody
   * reading it mid-fight. What a *breakdown* does with the same number is below.
   */
  test("says how many bars fit before the list scrolls", () => {
    expect(composePanelView(composeReading(), composeState()).visibleRows).toBe(11);
    expect(composePanelView(composeReading(), composeState({ team: "mine" })).visibleRows).toBe(10);
    expect(composePanelView(composeReading(), composeState({ team: "enemy" })).visibleRows).toBe(10);
  });

  test("a side filter lists only that side", () => {
    const ours = composePanelView(composeReading(), composeState({ team: "mine" }));
    const theirs = composePanelView(composeReading(), composeState({ team: "enemy" }));

    expect(ours.lists[0]!.rows.map((row) => row.label).sort()).toEqual(["mag", "tarcza", "łowca"]);
    expect(theirs.lists[0]!.rows.map((row) => row.label)).toEqual(["coś dużego"]);
  });

  /**
   * The bracket belongs to the number it breaks down, so it has to be a share of
   * it and not a second count standing beside it.
   *
   * Its own fixture rather than the shared one: there every blow is plain, so
   * `1 (w tym 1 zwykłe)` would pass just as well with the two fields swapped.
   */
  test("the counters break the blows down by what nobody announced", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
    ]);
    const reading: PanelReading = {
      statistics: composeFightStatistics(
        decodeFight(
          [
            "1=90.00;3=50.00;tspell=Czar testowy;skillId=7",
            // Glued to the announcement above it, so a skill covers this one.
            "1=90.00;3=40.00;+dmg=300;-dmg=200",
            "1=90.00;3=30.00;+dmg=500;-dmg=400",
          ],
          roster,
        ),
        roster,
      ),
      roster,
      ourSide: 1,
      isFromFightStart: true,
    };

    const view = composePanelView(reading, composeState());
    const counters = view.lists[0]!.rows[0]!.detail.find(
      (line) => line.kind !== "stat" && line.text.startsWith("ciosy"),
    );

    // Two blows, one of them announced — so the bracket is a part, not a total.
    expect(counters).toEqual({
      kind: "note",
      text: "ciosy 2 (w tym 1 zwykłe) · kryt. 0 · maks. cios 400",
    });
  });
});

/**
 * Which pinned rows **add** to the screen's whole rather than cutting into it —
 * written out here rather than imported, so the guard states the claim instead of
 * agreeing with whatever the view currently believes (§7.5).
 *
 * A figure with no actor is on nobody's *given* row, so under `Zadane` and
 * `Leczenie dane` it is one of its own; the health it moved landed on somebody, so
 * under `Otrzymane` and `Leczenie` it is already counted there and adding it again
 * would double it. A figure with no *target* is on nobody's row anywhere — except
 * under `Zadane`, where the striker is named and their own total holds it, and
 * where the panel therefore draws no such row at all.
 */
const ROWS_ADDING_TO_THE_WHOLE: Record<PanelMetric, readonly string[]> = {
  dealt: [NO_ACTOR_ROW_KEY],
  taken: [NO_TARGET_ROW_KEY],
  healingGiven: [NO_ACTOR_ROW_KEY],
  healed: [NO_TARGET_ROW_KEY],
};

/**
 * How the panel spells a share it refuses to round down to nothing
 * (`src/ui/panel-words.ts`). Named once here, because three sweeps below
 * have to tell it apart from a bracket they simply could not read.
 */
const BELOW_A_POINT = "<1%";

describe("what nobody can be charged with", () => {
  /**
   * Health that fell without a blow is real damage with no attacker. It cannot
   * sit on a row, and dropping it would take 13% of what hit the boss in the
   * group capture off the screen.
   *
   * ⚠️ **Every tab, and for a whole release one of the four had nothing.**
   * `Otrzymane` returned early, so the one screen where 13% of what hit the boss
   * in the group capture is *already inside the rows* was also the one screen
   * that never said so.
   */
  test.each(PANEL_METRICS.map((metric) => [metric] as const))(
    "stands under the list on %s, in its own row",
    (metric) => {
      const view = composePanelView(composeReading(), composeState({ metric }));

      expect(getNoActorRow(view)?.label).toBe("Nieznany sprawca");
      expect(getNoActorRow(view)?.isDrillable).toBe(false);
    },
  );

  /**
   * The sentence that decides whether a reader may add the figure to the rows —
   * and the reason the row belongs on all four tabs rather than on the two where
   * it stands apart. Under a received direction it does not stand apart, and
   * saying nothing there is the same mistake as saying the wrong thing.
   */
  test.each([
    ["dealt", "stoi osobno"],
    ["taken", "już policzone wyżej"],
    ["healingGiven", "stoi osobno"],
    ["healed", "już policzone wyżej"],
  ] as const)("says on %s where it stands against the rows", (metric, phrase) => {
    const view = composePanelView(composeReading(), composeState({ metric }));

    expect(
      getNoActorRow(view)?.detail.map((line) => (line.kind === "stat" ? "" : line.text)).join(" "),
    ).toContain(phrase);
  });

  /**
   * Under `Otrzymane` the victim is always named, so the same 60 points are on
   * their row as well — which is exactly why the pinned row there says they are.
   */
  test("is part of the victim's own figure under taken", () => {
    const view = composePanelView(composeReading(), composeState({ metric: "taken" }));
    const victim = view.lists[0]!.rows.find((row) => row.label === "coś dużego");

    // 400 + 100 from the blows, and 60 that fell on its own.
    expect(victim?.valueText).toBe("560");
    expect(getNoActorRow(view)?.valueText).toBe("60");
    expect(victim?.detail.map((line) => (line.kind === "stat" ? line.label : ""))).toContain(
      "  poza ciosem",
    );
  });

  /**
   * ⚠️ **Every tab narrows it, and the charge says which way.** The team comes
   * from the end the game *did* name: health that fell is charged to the side
   * facing the victim, health that rose to the side that received it
   * (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`).
   *
   * It narrowed on no given screen for one round, because a figure with no actor
   * was held to have no side — and before that it narrowed on all four by the
   * **victim**, which put a received-end figure over a given-end list and inside
   * its denominator: 38.7% of `Zadane · Oni` on the Hildur capture
   * (`docs/specs/2026-08-18-a-figure-with-no-actor-has-no-side.md`).
   *
   * ⚠️ **The two directions of one noun land on opposite tabs, and that is the
   * whole of what a mutation here breaks.** The hand-written fight ticks 60 points
   * of poison off `coś dużego` on side two, so `Zadane` charges them to side one —
   * our side dealt them — while `Otrzymane` leaves them on side two, which took
   * them. Healing crosses nothing: 50 points of regeneration reach `tarcza` on
   * side one and belong to side one read either way.
   */
  test.each([
    ["dealt", "all", "60"],
    ["dealt", "mine", "60"],
    ["dealt", "enemy", null],
    ["taken", "all", "60"],
    ["taken", "mine", null],
    ["taken", "enemy", "60"],
    ["healingGiven", "all", "50"],
    ["healingGiven", "mine", "50"],
    ["healingGiven", "enemy", null],
    ["healed", "all", "50"],
    ["healed", "mine", "50"],
    ["healed", "enemy", null],
  ] as const)("narrows to the side on screen on %s · %s", (metric, team, expected) => {
    const view = composePanelView(composeReading(), composeState({ metric, team }));

    expect(getNoActorRow(view)?.valueText ?? null).toBe(expected);
  });

  /**
   * ⚠️ **A share on every one of the twelve screens, and four of them went a
   * release without one.**
   *
   * A bracket needs a whole containing the figure, and twice there was none: once
   * because a fight-wide numerator sat over one side's denominator — 320% under
   * `Leczenie · Oni` on
   * `tests/captured-fights/2026-08-11-tempest-tancerz-vs-wermont.json` — and once
   * because the figure was held to belong to no side at all, so `Zadane · Oni`
   * printed none (`docs/specs/2026-08-18-a-figure-with-no-actor-has-no-side.md`).
   *
   * Both are gone for one reason: the figure and the list are scoped alike now.
   * Stated as an equality over every screen rather than as a list of the ones that
   * have a bracket, so an exception cannot widen unnoticed — a bracket that came
   * back as `(0%)` beside a five-figure number is the other half of what §9.6
   * forbids, and `toMatch` on a leading paren catches a blank one.
   */
  test.each(
    PANEL_METRICS.flatMap((metric) => PANEL_TEAMS.map((team) => [metric, team] as const)),
  )("states its share on %s · %s", (metric, team) => {
    const pinned = getNoActorRow(composePanelView(composeReading(), composeState({ metric, team })));
    if (pinned === null) return;

    expect(pinned.bracketText, `${metric} ${team}`).toMatch(/^\(\d|^\(<1%/);
    expect(pinned.fill, `${metric} ${team}`).toBeGreaterThan(0);
  });

  /**
   * And the cut under it narrows with it. A `Komu` list naming people the ranking
   * above has filtered off would be one side's total broken down by another side's
   * members — which is what it did, and what nothing on the screen would have said.
   */
  test("names only the side on screen in its own breakdown", () => {
    const view = composePanelView(composeReading(), composeState({ metric: "taken", team: "enemy" }));
    const stats = getNoActorRow(view)?.detail.filter((line) => line.kind === "stat") ?? [];

    expect(stats).toEqual([{ kind: "stat", label: "coś dużego", value: "60", isStrong: false }]);
    expect(
      getNoActorRow(view)?.detail.map((line) => (line.kind === "stat" ? "" : line.text)).join(" "),
    ).toContain("Tylko z pokazanej drużyny");
  });
});

describe("drilling", () => {
  /**
   * A combatant with more than one of everything, because the cross-sections are
   * drawn only where they divide something: one row repeats the total standing
   * over it, which is not a second reading of anything.
   */
  function composeDrillReading(): PanelReading {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
      { id: 5, name: "coś mniejszego", side: 2, profession: null, level: null, maximumHealth: null },
    ]);
    const statistics = composeFightStatistics(
      decodeFight(
        [
          "1=90.00;3=50.00;tspell=Czar testowy;skillId=7",
          "1=90.00;3=40.00;+dmgf=300;-dmgf=200",
          "1=90.00;3=30.00;+dmg=500;-dmg=400",
          "1=90.00;5=30.00;+dmgc=100;-dmgc=80",
        ],
        roster,
      ),
      roster,
    );
    return { statistics, roster, ourSide: 1, isFromFightStart: true };
  }

  test("opens who, with what, and of what", () => {
    const view = composePanelView(composeDrillReading(), composeState({ focusCombatantId: 1 }));

    expect(view.lists.map((list) => list.heading)).toEqual([
      "KOMU",
      "CZYM (UMIEJĘTNOŚCI)",
      "TYP OBRAŻEŃ",
    ]);
    expect(view.crumb?.backLabel).toBe("‹ skład");
    expect(view.crumb?.hereLabel).toBe("mag");
  });

  /**
   * ⚠️ **The one this corrects used to shrink.** A breakdown sized purely to its
   * content drew a window a fifth the height of the ranking it was opened from —
   * so a click moved everything below the list up under the reader's hand, on the
   * one gesture the panel exists for. The ranking's height is the floor, and the
   * breakdown may only grow past it.
   */
  test("a breakdown is never shorter than the ranking it was opened from", () => {
    const state = composeState({ focusCombatantId: 1 });
    const view = composePanelView(composeReading(), state);

    // One section of one row: two rows' worth of content in an eleven-row window.
    expect(view.lists.reduce((rows, list) => rows + list.rows.length + 1, 0)).toBeLessThan(11);
    expect(view.visibleRows).toBe(11);
    expect(composePanelView(composeReading(), { ...state, team: "mine" }).visibleRows).toBe(10);
  });

  /**
   * A cut of one row says the same thing as the figure above it. Three of them in
   * a row is what `Leczenie` drew before this: the same number, three times, under
   * three headings.
   *
   * ⚠️ **Unless it is the row nothing announced, counting the blows.** The damage
   * type is the same number under another word and stays hidden; `Zwykły cios`
   * says how many times, and that count is reachable nowhere else — the closing
   * row one level down states none
   * (`docs/specs/2026-08-19-a-row-opens-only-what-it-does-not-say.md`). A lone
   * *announced* skill is not exempt: opening any person it was used on shows it,
   * with its count.
   */
  test("a cut of one row is drawn only where nothing announced it", () => {
    const view = composePanelView(composeReading(), composeState({ focusCombatantId: 1 }));

    expect(view.lists.map((list) => list.heading)).toEqual(["KOMU", "CZYM (UMIEJĘTNOŚCI)"]);
    expect(view.lists[1]!.rows).toHaveLength(1);
    expect(view.lists[1]!.rows[0]!.label).toBe("Zwykły cios");
    // The bracket is where a count shows, and the only place it does.
    expect(view.lists[1]!.rows[0]!.bracketText).toContain("×");
  });

  /**
   * Entering an opponent asks *with what*, so the level lists skills and closes
   * them against that pair's own figure; the elements stand beside them as a
   * second cut of the same number.
   */
  test("entering an opponent lists the skills used on them, then the damage types", () => {
    const reading = composeDrillReading();
    const view = composePanelView(
      reading,
      composeState({ focusCombatantId: 1, focusTargetId: 3 }),
    );

    expect(view.lists.map((list) => list.heading)).toEqual(["CZYM — coś dużego", "TYP OBRAŻEŃ"]);
    expect(view.lists[0]!.rows.map((row) => row.label)).toEqual(["Czar testowy", "Zwykły cios"]);
    // The section adds up to the figure it was entered from, which is what makes
    // a breakdown safe to read.
    expect(view.lists[0]!.totalText).toBe(view.lists[1]!.totalText);
  });

  /**
   * The property that makes a breakdown safe to read: what the named parts do
   * not cover has a row of its own, so the section adds up to the figure it was
   * entered from.
   *
   * ⚠️ **The row a player asked for.** A combatant who announces nothing appeared
   * only as a figure with no shape: the panel could say what a skill did and
   * could not say that somebody simply swung. It carries a count for the same
   * reason the skills beside it do.
   */
  test("names what no skill announced, and says how many times", () => {
    const view = composePanelView(composeDrillReading(), composeState({ focusCombatantId: 1 }));
    const skills = view.lists.find((list) => list.heading === "CZYM (UMIEJĘTNOŚCI)");
    const plain = skills?.rows.find((row) => row.label === "Zwykły cios");

    expect(plain).toBeDefined();
    // Two blows in the fixture carry no announcement over them.
    expect(plain?.bracketText).toContain("×2");
  });

  /**
   * Three blows that were all blocked are still three blows. A section that drew
   * the row only when it landed something would say the combatant did not swing.
   */
  test("draws the row even when those blows landed nothing", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
    ]);
    const reading: PanelReading = {
      statistics: composeFightStatistics(
        decodeFight(["1=90.00;3=100.00;+dmg=500;-absorb=500"], roster),
        roster,
      ),
      roster,
      ourSide: 1,
      isFromFightStart: true,
    };

    const view = composePanelView(reading, composeState({ focusCombatantId: 1 }));

    // Nothing landed, so there are no sections — but the swing is still said.
    expect(view.lists).toEqual([]);
    expect(view.emptyText).toBe("Nie zadała nikomu obrażeń. Uderzyła 1 raz — nic nie weszło.");
  });

  /**
   * Two cases, because `raz` has two forms and not the three most Polish nouns
   * take: 2 razy and 5 razy are the same word. A test that also asserted 5 and
   * 12 would be asserting the same branch three times over.
   */
  test("says one swing and several swings differently", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
    ]);
    const blocked = "1=90.00;3=100.00;+dmg=500;-absorb=500";
    const compose = (blows: number): string | null =>
      composePanelView(
        {
          statistics: composeFightStatistics(
            decodeFight(
              Array.from({ length: blows }, () => blocked),
              roster,
            ),
            roster,
          ),
          roster,
          ourSide: 1,
          isFromFightStart: true,
        },
        composeState({ focusCombatantId: 1 }),
      ).emptyText;

    expect(compose(1)).toContain("Uderzyła 1 raz —");
    expect(compose(2)).toContain("Uderzyła 2 razy —");
  });

  /**
   * ⚠️ **The assumption the closing row's wording rests on.** Nothing announces a
   * blow you take, so `Otrzymane` has no skills section — which is why that row
   * only ever has to speak for `Zadane` and `Leczenie`. Without this, deleting
   * the early return in `composeSkillEntries` would put a row reading `Zwykły
   * cios`, and a note about swinging at somebody, under damage received.
   */
  test("what was taken has no skills section, because nothing announces a blow you take", () => {
    const reading = composeReading();

    for (const focusCombatantId of reading.statistics.byCombatantId.keys()) {
      const view = composePanelView(reading, composeState({ metric: "taken", focusCombatantId }));

      expect(view.lists.map((list) => list.heading), composeIntegerText(focusCombatantId)).not.toContain(
        "CZYM (UMIEJĘTNOŚCI)",
      );
    }
  });

  test("healing opens who healed, and one more level says with what", () => {
    const first = composePanelView(
      composeReading(),
      composeState({ metric: "healed", focusCombatantId: 4 }),
    );
    expect(first.lists[0]?.heading).toBe("OD KOGO");
    expect(first.lists[0]?.rows.map((row) => row.label)).toContain("mag");

    const second = composePanelView(
      composeReading(),
      composeState({ metric: "healed", focusCombatantId: 4, focusTargetId: 1 }),
    );
    expect(second.lists[0]?.heading).toBe("CZYM — mag");
    expect(second.lists[0]?.rows.map((row) => row.label)).toEqual(["Skill One"]);
  });

  test("a leaf offers no way further in", () => {
    const view = composePanelView(
      composeReading(),
      composeState({ focusCombatantId: 1, focusTargetId: 3 }),
    );

    expect(view.lists[0]?.rows.every((row) => !row.isDrillable)).toBe(true);
  });
});

/**
 * The field nothing draws, and the one thing it has to get right.
 *
 * A fight redraws every few seconds and every redraw builds a new list, so the
 * reader's own scroll position can only survive if the drawing half can tell "the
 * same screen again" from "they went somewhere". Every choice that changes what is
 * in the list has to change this key; nothing else may.
 */
describe("which screen this is", () => {
  const getKey = (state: Partial<PanelState>): string =>
    composePanelView(composeReading(), composeState(state)).levelKey;

  test("two readings of the same screen carry the same key", () => {
    expect(getKey({ focusCombatantId: 1 })).toBe(getKey({ focusCombatantId: 1 }));
    // The fight moves on and the figures change; the screen does not.
    expect(composePanelView(composeReading(), composeState()).levelKey).toBe(
      composePanelView(composeReading({ ourSide: 2 }), composeState()).levelKey,
    );
  });

  test("every choice that changes the list changes it", () => {
    const keys = [
      getKey({}),
      getKey({ metric: "taken" }),
      getKey({ team: "mine" }),
      getKey({ focusCombatantId: 1 }),
      getKey({ focusCombatantId: 1, focusTargetId: 3 }),
      getKey({ focusCombatantId: 1, focusSkill: { ownerId: 1, key: "7" } }),
      // Same key, different owner: two combatants announcing one skill are two
      // screens, which is the pair `focusSkill` carries a name for at all.
      getKey({ focusCombatantId: 1, focusSkill: { ownerId: 2, key: "7" } }),
    ];

    expect(new Set(keys).size).toBe(keys.length);
  });
});

/**
 * The one line on screen that is a verdict rather than a figure, and the panel
 * says it about a fight it can place — or says nothing.
 */
describe("the header says how the fight ended", () => {
  function getOutcomeText(message: string, overrides: Partial<PanelReading> = {}): string | null {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
    ]);
    const reading: PanelReading = {
      statistics: composeFightStatistics(decodeFight([message], roster), roster),
      roster,
      ourSide: 1,
      isFromFightStart: true,
      ...overrides,
    };

    return composePanelView(reading, composeState()).outcomeText;
  }

  test("a side of ours among the winners is a win, and among the losers a loss", () => {
    expect(getOutcomeText("0;0;winner=mag")).toBe("wygrana");
    expect(getOutcomeText("0;0;loser=mag")).toBe("przegrana");
  });

  /**
   * Kills the `isDrawn` branch, and kills its place above the `ourSide` guard:
   * ordered the other way, a draw in a fight the game never placed us in reads as
   * a fight whose ending was never stated.
   *
   * A draw is the same word from every seat — the protocol states it by naming
   * nobody — so it is the one verdict that does not wait for `myteam`.
   */
  test("a fight nobody won is a draw, whether or not the panel knows our side", () => {
    expect(getOutcomeText("0;0;winner=?")).toBe("remis");
    expect(getOutcomeText("0;0;winner=?", { ourSide: null })).toBe("remis");
  });

  test("a fight whose winners we cannot place says nothing", () => {
    expect(getOutcomeText("0;0;winner=ktoś inny")).toBeNull();
    expect(getOutcomeText("0;0;winner=mag", { ourSide: null })).toBeNull();
  });
});

/**
 * ⚠️ **The title was swept for its language and never for its meaning.** It sits
 * in `getEveryString`, so every word of it was held to §3 — and no test ever
 * asked what it said. `bun tools/mutation-sweep.ts` found it: turning the
 * "nobody is placed" test from `=== 0` into `=== 1` left 2046 tests green while
 * a fight with one side on screen announced it had no roster at all.
 */
describe("the title says how big the fight is", () => {
  const getTitle = (reading: PanelReading): string =>
    composePanelView(reading, composeState()).title;

  test("two sides are counted apart, ours first", () => {
    expect(getTitle(composeReading())).toBe("3 vs 1");
    expect(getTitle(composeReading({ ourSide: 2 }))).toBe("1 vs 3");
  });

  test("one side is a roster, not the absence of one", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
      { id: 2, name: "łowca", side: 1, profession: "h", level: 93, maximumHealth: null },
    ]);
    const reading = composeReading({
      roster,
      statistics: composeFightStatistics(
        decodeFight(["1=90.00;2=80.00;+dmg=100;-dmg=100"], roster),
        roster,
      ),
    });

    expect(getTitle(reading)).toBe("2");
  });

  test("nobody placed at all is the only thing that says so", () => {
    // A roster that named nobody, which is what a fight the game never described
    // looks like — the combatants still fight, and no side can be put to any of
    // them. Not the same as `+1` below: there, somebody was placed.
    const roster = composeCombatantRoster([]);
    const reading = composeReading({
      roster,
      ourSide: null,
      statistics: composeFightStatistics(
        decodeFight(["1=90.00;3=50.00;+dmg=500;-dmg=400"], roster),
        roster,
      ),
    });

    expect(getTitle(reading)).toBe("brak składu");
  });

  /**
   * ⚠️ **Two on the left, and `łowca` is why.** Nothing in this fight names her,
   * so the aggregate has no row for her — and the header counts the people the
   * *list* draws, which is everyone in the fight. Counting the aggregate instead
   * is what put `2 vs 1` over eleven rows for the opening payloads of every
   * group capture.
   */
  test("a combatant the roster cannot place is added on, not folded in", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
      { id: 2, name: "łowca", side: 1, profession: "h", level: 93, maximumHealth: null },
    ]);
    // Id 3 fights and is in no roster, so it has no side to be counted under.
    const reading = composeReading({
      roster,
      statistics: composeFightStatistics(
        decodeFight(["1=90.00;3=50.00;+dmg=500;-dmg=400"], roster),
        roster,
      ),
    });

    expect(getTitle(reading)).toBe("2 +1");
    // The header and the list are one count, said twice: the row nobody named
    // is drawn, and the one nobody could place is drawn beside it.
    expect(composePanelView(reading, composeState()).lists[0]?.rows.map((row) => row.label)).toEqual(
      ["mag", "łowca", "#3"],
    );
  });
});

describe("zero and unknown are different sentences", () => {
  test("a combatant with nothing gets the fact, not three empty headings", () => {
    const view = composePanelView(composeReading(), composeState({ focusCombatantId: 4 }));

    expect(view.lists).toEqual([]);
    expect(view.emptyText).toBe("Nie zadała nikomu obrażeń.");
  });

  test("and the limit only where something in this fight really has no actor", () => {
    const withOrphans = composePanelView(composeReading(), composeState({ focusCombatantId: 4 }));
    expect(withOrphans.emptyLimitText).toContain("nie da się sprawdzić");

    // Same fight without the tick of poison: nothing is unattributed, so there is
    // nothing to be uncertain about and the second sentence would be noise.
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
      { id: 4, name: "tarcza", side: 1, profession: "w", level: 120, maximumHealth: null },
    ]);
    const clean: PanelReading = {
      statistics: composeFightStatistics(decodeFight(["1=90.00;4=50.00;+dmg=500;-dmg=400"], roster), roster),
      roster,
      ourSide: 1,
      isFromFightStart: true,
    };

    expect(composePanelView(clean, composeState({ focusCombatantId: 4 })).emptyLimitText).toBeNull();
  });

  /**
   * ⚠️ **Healing gets no second sentence, and the asymmetry is the point.** The
   * game always names who was healed, so nothing received is a complete answer.
   * What it does not name is who healed, and that is said in the breakdown rather
   * than in place of the figure.
   */
  test("nothing healed is a complete answer", () => {
    const view = composePanelView(
      composeReading(),
      composeState({ metric: "healed", focusCombatantId: 2 }),
    );

    expect(view.emptyText).toBe("Nikt jej nie leczył.");
    expect(view.emptyLimitText).toBeNull();
  });

  /**
   * ⚠️ **A third state, and it is neither of the two above.** A combatant with
   * nothing has been measured and came to zero; a figure we could not read is a
   * limit; and before any payload there is no fight to have measured or failed to
   * read. What the panel drew for it was nothing at all — a body so empty it was
   * the same picture as a collapsed one — so the sentence is recorded here rather
   * than described, and its height is held against the ranking's own.
   */
  test("no fight yet is a third sentence, and it states no figure", () => {
    expect(PANEL_WAITING.text).toBe("Nie było jeszcze walki.");
    expect(PANEL_WAITING.visibleRows).toBe(
      composePanelView(composeReading(), composeState()).visibleRows,
    );
  });
});

describe("the words a player reads", () => {
  /**
   * ⚠️ **The panel never explains itself in our vocabulary** (§3). It says what
   * cannot be known, not why our reader cannot know it — so no key of the game's
   * and none of the words we use to talk about reading one may appear in
   * anything the panel draws.
   *
   * Checked across every screen the view has rather than on a sample: the strings
   * are scattered across a dozen composers, and one of them going technical is
   * exactly the drift nobody would notice.
   */
  const FORBIDDEN = [
    "protok",
    "klucz",
    "komunikat",
    "dekoder",
    "healall",
    "oth_dmg",
    "tspell",
    "skillId",
    "JSON",
    "payload",
    "event",
    // Ours for the two things this panel is most tempted to name in English,
    // and the region that says both of them was outside every sweep until now.
    "unattributed",
    "unaccounted",
  ];

  test("carry no word from the code and no key from the game", () => {
    // The one sentence that belongs to no view: it is what the panel says before
    // there is a fight to compose one from, and a screen nothing sweeps is a
    // screen where our vocabulary goes unnoticed.
    const strings: string[] = [PANEL_WAITING.text];

    // The second is a fight that did not all arrive. Its sentences exist only
    // when there is something to say, so a sweep over a clean reading alone would
    // never see them — which is how a warning comes to name a field of the game's
    // in front of a player.
    const readings = [
      composeReading(),
      composeReading({
        engineReading: {
          unreadablePayloadsByFault: new Map([
            ["messages-lost", 2],
            ["payload-not-a-record", 1],
          ]),
          lostMessages: 5,
          unreadableCombatants: 1,
        },
      }),
    ];
    for (const reading of readings) {
      for (const metric of PANEL_METRICS) {
        for (const team of PANEL_TEAMS) {
          {
            const base = composeState({ metric, team });
            strings.push(...getEveryString(composePanelView(reading, base)));
            for (const focusCombatantId of reading.statistics.byCombatantId.keys()) {
              const inside = composeState({ metric, team, focusCombatantId });
              strings.push(...getEveryString(composePanelView(reading, inside)));
              strings.push(
                ...getEveryString(composePanelView(reading, { ...inside, focusTargetId: 3 })),
              );
            }
          }
        }
      }
    }

    // The sweep has to have swept something, or an empty list would pass it.
    expect(strings.length).toBeGreaterThan(100);
    for (const text of strings) {
      for (const word of FORBIDDEN) {
        expect(text.toLowerCase(), text).not.toContain(word.toLowerCase());
      }
    }
  });

  test("name an effect in Polish rather than as the game spells it", () => {
    const view = composePanelView(composeReading(), composeState());
    const detail = view.lists[0]!
      .rows.flatMap((row) => row.detail)
      .map((line) => (line.kind === "stat" ? `${line.label} ${line.value}` : line.text))
      .join("\n");

    expect(detail).toContain("kryt.");
    expect(detail).not.toContain("crit");
  });

  test("say what is missing without naming what we could not read", () => {
    const view = composePanelView(composeReading(), composeState());

    expect(view.warnings.some((warning) => warning.includes("Nie dało się odczytać"))).toBe(true);
    expect(view.warnings.join(" ")).not.toContain("nonsense_key");
  });
});

/**
 * A fight that never fully arrived, as against one that arrived and could not be
 * read.
 *
 * ⚠️ **Two claims a player must be able to tell apart.** "A message carried
 * something we have no meaning for" is a suspicion about a total. "Part of this
 * fight never reached the panel" is a certainty about one, and the repairs are
 * different. The panel had a sentence for the first and none for the second,
 * because until now the second could not be observed at all — a renamed field
 * simply produced a quiet zero.
 */
describe("a fight that did not all arrive", () => {
  const composeGaps = (
    gaps: Partial<NonNullable<PanelReading["engineReading"]>> = {},
  ): NonNullable<PanelReading["engineReading"]> => ({
    unreadablePayloadsByFault: new Map(),
    lostMessages: 0,
    unreadableCombatants: 0,
    ...gaps,
  });

  const getWarnings = (gaps: NonNullable<PanelReading["engineReading"]>): string[] =>
    composePanelView(composeReading({ engineReading: gaps }), composeState()).warnings;

  test("a clean reading says none of this", () => {
    const warnings = getWarnings(composeGaps()).join(" ");

    expect(warnings).not.toContain("Nie dotarło");
    expect(warnings).not.toContain("nie dotarła");
    expect(warnings).not.toContain("ze składu");
  });

  test("a reading with no engine behind it says none of it either", () => {
    // The offline tools and most of this file. Nothing to say is not zero.
    const warnings = composePanelView(composeReading(), composeState()).warnings.join(" ");

    expect(warnings).not.toContain("Nie dotarło");
    expect(warnings).not.toContain("nie dotarła");
  });

  test("messages that never arrived are stated with their number", () => {
    expect(getWarnings(composeGaps({ lostMessages: 7 }))[0]).toContain("7");
    expect(getWarnings(composeGaps({ lostMessages: 7 }))[0]).toContain("Nie dotarło");
  });

  /**
   * The case the count cannot be known: a payload we could not read at all never
   * said how much was in it. §9.6 keeps unknown and zero apart on screen, so the
   * sentence loses its figure rather than gaining a nought.
   */
  test("and without one where nothing said how many", () => {
    const warnings = getWarnings(
      composeGaps({ unreadablePayloadsByFault: new Map([["payload-not-a-record", 3]]) }),
    );

    expect(warnings.some((warning) => warning.includes("Część tej walki nie dotarła"))).toBe(true);
    expect(warnings.join(" ")).not.toContain("0");
  });

  test("a combatant nobody could read is its own sentence", () => {
    const warnings = getWarnings(composeGaps({ unreadableCombatants: 2 })).join(" ");

    expect(warnings).toContain("ze składu");
    expect(warnings).toContain("2");
  });

  /**
   * The order is the rule the file already states for the warnings below: what is
   * certain goes above what is merely suspected. These two are certain — the
   * material is not here — so they precede the decoder's "some totals may be low".
   */
  test("what never arrived is said before what could not be read", () => {
    const warnings = getWarnings(composeGaps({ lostMessages: 4 }));
    const missing = warnings.findIndex((warning) => warning.includes("Nie dotarło"));
    const unreadable = warnings.findIndex((warning) => warning.includes("Nie dało się odczytać"));

    expect(missing).toBeGreaterThan(-1);
    expect(unreadable).toBeGreaterThan(-1);
    expect(missing).toBeLessThan(unreadable);
  });

  test("and neither sentence carries a word of ours or a name of the game's", () => {
    const warnings = getWarnings(
      composeGaps({
        lostMessages: 4,
        unreadableCombatants: 1,
        unreadablePayloadsByFault: new Map([["messages-lost", 2]]),
      }),
    ).join(" ");

    // The fault names are `game`'s vocabulary and must not reach a player.
    for (const forbidden of ["messages-lost", "payload", "fault", "protok", "klucz"]) {
      expect(warnings, forbidden).not.toContain(forbidden);
    }
  });
});

/**
 * The warning that stands beside the figure it shortens, rather than under the
 * whole panel.
 *
 * §9.6 has asked for this since it was written and nothing had ever done it: the
 * strip at the foot says *something in this fight could not be read* and leaves the
 * reader to work out whose totals that cost
 * (`docs/specs/2026-08-24-a-warning-on-the-row-it-shortens.md`).
 *
 * ⚠️ **Built by hand because no recording carries either state.**
 * `bun run tools/fight-report.ts` prints `unreadable messages: 0` and
 * `unaccounted healing: 0 casts` for every file in `tests/captured-fights/` as the
 * set stands 2026-08-24, so the corpus can only say that nothing here fires — which
 * is the last test in this block, and the claim that this round moved no number
 * anybody has already read.
 */
describe("a warning on the row it shortens", () => {
  const roster = composeCombatantRoster([
    { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
    { id: 2, name: "łowca", side: 1, profession: "h", level: 93, maximumHealth: null },
    { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
  ]);

  /** A fight whose one unread message names `mag` and the boss, and not `łowca`. */
  function composeUnreadReading(): PanelReading {
    return {
      statistics: composeFightStatistics(
        decodeFight(
          [
            "1=90.00;3=50.00;+dmg=500;-dmg=400",
            "2=90.00;3=40.00;+dmg=200;-dmg=100",
            // Invented on purpose: every key the material carries is read.
            "1=90.00;3=50.00;no_such_key=13",
          ],
          roster,
        ),
        roster,
      ),
      roster,
      ourSide: 1,
      isFromFightStart: true,
    } satisfies PanelReading;
  }

  /** A fight where `mag` cast over the side and nothing here could size it. */
  function composeUnsizedReading(): PanelReading {
    return {
      statistics: composeFightStatistics(
        [
          ...decodeFight(["1=90.00;3=50.00;+dmg=500;-dmg=400"], roster),
          {
            kind: "unaccounted-health",
            source: "healall_per",
            combatantId: 1,
            declaredShare: 12,
            announced: null,
          },
        ],
        roster,
      ),
      roster,
      ourSide: 1,
      isFromFightStart: true,
    } satisfies PanelReading;
  }

  const getRankedRow = (view: PanelView, label: string): PanelRow | null =>
    view.lists.flatMap((list) => list.rows).find((row) => row.label === label) ?? null;

  for (const metric of PANEL_METRICS) {
    test(`marks whoever an unread message named, on the ${metric} screen`, () => {
      const view = composePanelView(composeUnreadReading(), composeState({ metric }));

      expect(getRankedRow(view, "mag")?.warnings.length).toBe(1);
      expect(getRankedRow(view, "coś dużego")?.warnings.length).toBe(1);
      // The boundary from the other side (§7.5). `łowca` fought in the same fight
      // and no unread message names them, so their figures are what happened.
      expect(getRankedRow(view, "łowca")?.warnings).toEqual([]);
    });
  }

  /**
   * The other counter is not metric-blind, and that is the difference between the
   * two claims. An unread key could have moved any figure; a cast nobody could size
   * is healing this combatant gave, and the protocol says so — so it qualifies the
   * one screen that draws it and stays quiet on the three where their numbers are
   * exactly what happened.
   */
  test("marks a cast nobody could size on the screen that draws it, and only there", () => {
    const reading = composeUnsizedReading();
    const given = composePanelView(reading, composeState({ metric: "healingGiven" }));

    expect(getRankedRow(given, "mag")?.warnings.length).toBe(1);
    for (const metric of ["dealt", "taken", "healed"] as const) {
      const view = composePanelView(reading, composeState({ metric }));
      expect(getRankedRow(view, "mag")?.warnings, metric).toEqual([]);
    }
  });

  /**
   * ⚠️ **The certain one above the suspicion**, which is the order the fight's own
   * strip already keeps. One of these says a figure *is* low by an amount the game
   * never states; the other says one *may* be. Ranking them the other way round
   * buries the only line here that is not a guess.
   */
  test("says what is missing before what might be", () => {
    const reading = composeUnsizedReading();
    const withBoth: PanelReading = {
      ...reading,
      statistics: composeFightStatistics(
        [
          ...decodeFight(["1=90.00;3=50.00;no_such_key=13"], roster),
          {
            kind: "unaccounted-health",
            source: "healall_per",
            combatantId: 1,
            declaredShare: 12,
            announced: null,
          },
        ],
        roster,
      ),
    };
    const view = composePanelView(withBoth, composeState({ metric: "healingGiven" }));
    const warnings = getRankedRow(view, "mag")?.warnings ?? [];

    expect(warnings.length).toBe(2);
    expect(warnings[0]).toContain("jest zaniżone");
    expect(warnings[1]).toContain("mogą być zaniżone");
  });

  /**
   * The mark and what it opens onto are one string, and this is what holds them to
   * it. A row marked with a sentence its card does not carry is a mark that leads
   * nowhere, and nothing else in this file would notice.
   */
  test("puts the same sentence in the card the row opens", () => {
    const view = composePanelView(composeUnreadReading(), composeState());
    const row = assertDefined(getRankedRow(view, "mag"), "mag is on the screen");
    const notes = row.detail.filter((line) => line.kind === "note").map((line) => line.text);

    expect(row.warnings.length).toBe(1);
    for (const warning of row.warnings) expect(notes).toContain(warning);
  });

  /**
   * A cut of a figure carries none of it, at any level. A shortfall cannot be
   * placed onto one opponent or one skill — the combatant's own row is where the
   * claim is true, and it is on that row at every level.
   */
  test("marks no row inside a breakdown, however far in", () => {
    const reading = composeUnreadReading();
    const view = composePanelView(reading, composeState({ focusCombatantId: 1 }));
    const rows = view.lists.flatMap((list) => list.rows);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.warnings.length === 0)).toBe(true);
  });

  test("says it without naming what we could not read", () => {
    const view = composePanelView(composeUnreadReading(), composeState());
    const said = getRankedRow(view, "mag")?.warnings.join(" ") ?? "";

    expect(said.length).toBeGreaterThan(0);
    for (const forbidden of ["no_such_key", "klucz", "protok", "komunikat", "payload"]) {
      expect(said, forbidden).not.toContain(forbidden);
    }
  });

  /**
   * The corpus half, and the only thing it can say: **no capture grows a mark.**
   * Every recording reads clean, so a row wearing one here would mean this round
   * had started qualifying figures somebody has already read.
   */
  test.each(CAPTURED_FIGHTS)("$name marks no row at all", (fight) => {
    const reading: PanelReading = {
      statistics: composeStatisticsOfFight(fight),
      roster: composeRosterOfFight(fight),
      ourSide: 1,
      isFromFightStart: true,
    };
    for (const metric of PANEL_METRICS) {
      const view = composePanelView(reading, composeState({ metric }));
      const rows = [...view.lists.flatMap((list) => list.rows), ...view.pinnedRows];
      expect(rows.every((row) => row.warnings.length === 0), metric).toBe(true);
    }
  });
});

describe("against the captured fights", () => {
  const fights = CAPTURED_FIGHTS.map((fight) => {
    const roster = composeRosterOfFight(fight);
    // Read the way the panel is fed, or the mirror below is measured on a fight
    // missing every point of team healing in it.
    const statistics = composeStatisticsOfFight(fight);
    return {
      name: fight.name,
      reading: {
        statistics,
        roster,
        ourSide: 1,
        isFromFightStart: true,
      } satisfies PanelReading,
    };
  });

  /**
   * Everyone in the fight is on the screen, in every metric and every filter
   * that should hold them.
   *
   * ⚠️ **Written because the shape it guards was once false.** A combatant the
   * roster could not place was counted and then dropped from the panel. Naming
   * the set rather than the bucket keeps that from coming back through a bucket
   * nobody has added yet — and the set is now the fight's, not the aggregate's,
   * so it also holds the combatant nothing has named. Over a whole capture the
   * two are the same list on all of them, which is exactly why this claim cannot
   * be the only one and `the panel before anybody has acted` below exists.
   */
  test.each(fights)("$name draws everyone in the fight", ({ reading }) => {
    const drawn = composePanelView(reading, composeState()).lists[0]!.rows.map((row) => row.label);
    const inFight = getCombatantIdsInFight(reading.statistics, reading.roster).map(
      (id) => reading.roster.byId.get(id)?.name ?? `#${id}`,
    );

    expect(drawn.length).toBe(inFight.length);
    for (const name of inFight) expect(drawn).toContain(name);
  });

  /**
   * The other half of the height rule, on material tall enough to break it.
   *
   * The hand-written fight cannot: every breakdown in it fits inside the floor, so
   * a view that ignored its content entirely would pass there. A real group fight
   * opens breakdowns of a dozen rows and more, and the claim is the same at both
   * ends — the window is exactly what the sections need, or the ranking's height,
   * whichever is larger. The last line is what makes the rest of it worth running:
   * if no capture ever exceeds the floor, this test is arithmetic about nothing.
   */
  test("a breakdown gets the rows its sections need", () => {
    let tallest = 0;
    for (const { reading } of fights) {
      for (const metric of PANEL_METRICS) {
        for (const focusCombatantId of reading.statistics.byCombatantId.keys()) {
          const view = composePanelView(reading, composeState({ metric, focusCombatantId }));
          const needed = view.lists.reduce((rows, list) => rows + list.rows.length + 1, 0);

          expect(view.visibleRows, `${metric} ${focusCombatantId}`).toBe(Math.max(needed, 11));
          tallest = Math.max(tallest, view.visibleRows);
        }
      }
    }

    expect(tallest).toBeGreaterThan(11);
  });

  /**
   * The arithmetic the panel promises: what a breakdown adds up to is the figure
   * it was entered from. Checked on every combatant of every capture, in every
   * metric, because a section that quietly totals less than its row is the exact
   * failure this project exists to prevent — in miniature.
   */
  test.each(fights)("$name closes every breakdown against the row above it", ({ reading }) => {
    for (const metric of PANEL_METRICS) {
      for (const focusCombatantId of reading.statistics.byCombatantId.keys()) {
        const ranking = composePanelView(reading, composeState({ metric }));
        const row = ranking.lists[0]!.rows.find(
          (each) => each.key === `combatant:${focusCombatantId}`,
        );
        const view = composePanelView(reading, composeState({ metric, focusCombatantId }));
        if (view.lists.length === 0) continue;

        for (const list of view.lists) {
          // Read back from the text, which is what a person compares: a total
          // agreeing in floating point while reading differently on screen would
          // still be the mismatch this guards against.
          expect(list.totalText, `${metric} ${focusCombatantId} ${list.heading}`).toBe(
            row?.valueText ?? null,
          );
        }
      }
    }
  });

  /**
   * ⚠️ **The same claim as the fixture test above, on material that can break it.**
   *
   * The hand-written fight has 60 points of poison against a 400-point mage, so
   * the pinned row could not exceed the scale there however wrong the scale was —
   * a guard agreeing with the bug it was written to prevent (§7.5). On the
   * captures it exceeded it under `Leczenie` in most of them, up to 1.56, and
   * `.row { overflow: hidden }` clips that into a bar indistinguishable from a
   * full one: the row that says *something here is missing* drawn as the largest
   * thing in the fight.
   *
   * ⚠️ **The share was halved under `Leczenie`, and nothing said so.**
   *
   * Healing nobody announced still lands on somebody, so it is already counted on
   * the receiver's row; the pinned row marks it rather than adding it. Dividing by
   * "the ranking plus this" therefore counted it twice — 44% reported against the
   * 79% it is on the group capture. Under `Leczenie dane` the same points really
   * are outside the ranking, so the two directions must arrive at **one** share of
   * one whole. They are the same missing healing measured the same way.
   *
   * ⚠️ **And the same claim for damage, which is where the balance is written
   * down.** `Σ dealt + unattributed = Σ taken` is the spec's own sentence, and
   * this is the only place it is measured: the two directions state one figure
   * and one share only if the totals either side of it agree to the point.
   *
   * It could not be made before this round — `Otrzymane` had no pinned row to
   * compare against, which is how the balance went four screens unchecked.
   */
  test.each(
    fights.flatMap((fight) =>
      (
        [
          ["obrażenia", "dealt", "taken"],
          ["leczenie", "healingGiven", "healed"],
        ] as const
      ).map(([noun, given, received]) => ({ ...fight, noun, given, received })),
    ),
  )("$name reports one figure for the $noun nobody can be charged with", ({ reading, given, received }) => {
    const inGiven = getNoActorRow(composePanelView(reading, composeState({ metric: given })));
    const inReceived = getNoActorRow(composePanelView(reading, composeState({ metric: received })));

    // Both or neither, checked before the figures: a direction that simply stops
    // drawing the row would otherwise pass this by having nothing to disagree
    // with, which is how the missing screen survived until now.
    expect(inGiven === null).toBe(inReceived === null);
    if (inGiven === null || inReceived === null) return;

    // ⚠️ The figures being equal was structural once — `getPinnedValue` branched
    // on the noun alone, so both directions reached it down one arm and could not
    // disagree. They reach it down two now: a received direction sums the rows the
    // side tab admits and adds what no row holds, a given one reads the fight. So
    // this is a measurement under `Wszyscy`, and the arm that ends the round short
    // by whatever the roster could not place lights up here rather than nowhere.
    expect(inGiven.valueText).toBe(inReceived.valueText);

    // ⚠️ **The share is the same reading and not always the same word.** The row
    // is part of the whole under a given direction and an overlap under a received
    // one (`HOLE_STANDING`), so only the first competes for the points the
    // apportionment has left to hand out (`composeShareTexts`). One figure, one
    // denominator, and at most a point between how the two screens write it — the
    // alternative is a column that does not add up, which is what the reader
    // checks.
    const shares = [inGiven, inReceived].map((row) =>
      getIntegerFromText((row.bracketText ?? "").replace(/[()%]/g, "")),
    );
    expect(shares[0], inGiven.bracketText ?? "").not.toBeNull();
    expect(shares[1], inReceived.bracketText ?? "").not.toBeNull();
    expect(Math.abs((shares[0] ?? 0) - (shares[1] ?? 0))).toBeLessThanOrEqual(1);
  });

  /**
   * **The two teams and what neither holds come back to the fight**, on every one
   * of the four screens.
   *
   * The closure is what makes the narrowing readable rather than merely different:
   * a filter that dropped points would show two teams summing to less than the
   * fight with nothing saying so, and a filter that did nothing would show each
   * team holding all of it. Both are one assertion away, in opposite directions.
   *
   * ⚠️ **The given screens did not narrow at all for one round**, because a figure
   * with no actor was held to have no side; the round before that they narrowed by
   * the victim, which is the other side's question
   * (`docs/specs/2026-08-18-a-figure-with-no-actor-has-no-side.md`). Both are
   * caught here: the first would make each tab equal the fight's, the second would
   * put the halves on the wrong tabs, and the mirror below is what tells those two
   * apart.
   *
   * What no name reaches is read off the `Wszyscy` screen's own breakdown rather
   * than computed here — that is the one place the view states it as a number, and
   * on these captures it is zero, because every name in them resolves.
   */
  test.each(
    fights.flatMap((fight) =>
      PANEL_METRICS.map((metric) => ({ ...fight, metric })),
    ),
  )("$name closes the two teams against the fight on $metric", ({ reading, metric }) => {
    const getFigure = (team: (typeof PANEL_TEAMS)[number]): number => {
      const pinned = getNoActorRow(composePanelView(reading, composeState({ metric, team })));
      if (pinned === null) return 0;
      return getIntegerFromText(pinned.valueText.replace(/\s/gu, "")) ?? Number.NaN;
    };

    // Off the `Wszyscy` screen's own breakdown, which is the one place the view
    // states it as a number.
    const unplaced = getNeitherEndLeftover();
    const wholeFight = getNoActorRow(
      composePanelView(reading, composeState({ metric, team: "all" })),
    );
    const leftoverLine = wholeFight?.detail.find(
      (line) => line.kind === "stat" && line.label === unplaced.label,
    );
    const leftover =
      leftoverLine?.kind === "stat"
        ? (getIntegerFromText(leftoverLine.value.replace(/\s/gu, "")) ?? Number.NaN)
        : 0;

    expect(getFigure("mine") + getFigure("enemy") + leftover, metric).toBe(getFigure("all"));
  });

  /**
   * ⚠️ **The one inference this panel draws, held to a measurement.**
   *
   * The team comes from the end the game *did* name, and the derivation is the
   * noun's: damage crosses, healing does not
   * (`getPartCharged`, `docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`).
   * The protocol states neither — it holds while there are two sides and nobody
   * harms their own.
   *
   * That assumption is what this asserts, and it asserts it as a measurement
   * rather than as a construction: the two directions reach their figures through
   * different fields of the aggregate — `dealtApplied` against `taken`,
   * `healingGiven` against `healed` — so a blow between two of ours, or an end
   * that stops resolving, breaks the equality here instead of moving a figure
   * where nobody would look. Both the row and the bar are read, because they are
   * two regions that must not disagree and they reach the charge separately.
   */
  test.each(fights)("$name reads a team's figure the same from either end", ({ reading }) => {
    const getRowFigure = (metric: PanelMetric, team: (typeof PANEL_TEAMS)[number]): number => {
      const pinned = getNoActorRow(composePanelView(reading, composeState({ metric, team })));
      return pinned === null
        ? 0
        : (getIntegerFromText(pinned.valueText.replace(/\s/gu, "")) ?? Number.NaN);
    };
    const getBarFigures = (metric: PanelMetric): ReturnType<typeof getSideFigures> =>
      getSideFigures(composePanelView(reading, composeState({ metric })));

    // There is something to compare: an equality between two zeroes would hold for
    // a panel that had stopped drawing any of it.
    expect(getRowFigure("dealt", "mine")).toBeGreaterThan(0);
    expect(getBarFigures("dealt").mine).toBeGreaterThan(0);

    // Damage crosses: what our side dealt with no name on it is what theirs took.
    expect(getRowFigure("dealt", "mine"), "wiersz zadane · My").toBe(getRowFigure("taken", "enemy"));
    expect(getRowFigure("dealt", "enemy"), "wiersz zadane · Oni").toBe(getRowFigure("taken", "mine"));
    expect(getBarFigures("dealt").mine, "pasek zadane · My").toBe(getBarFigures("taken").enemy);

    // Healing does not: the healer and the healed are on one side.
    expect(getRowFigure("healingGiven", "mine")).toBe(getRowFigure("healed", "mine"));
    expect(getRowFigure("healingGiven", "enemy")).toBe(getRowFigure("healed", "enemy"));
    expect(getBarFigures("healingGiven").mine).toBe(getBarFigures("healed").mine);

    // And nothing in this material is left without a team at either end, which is
    // what made the old third part's label false on these very screens.
    for (const metric of PANEL_METRICS) {
      expect(getBarFigures(metric).nobody, metric).toBe(0);
    }
  });

  /**
   * **The summary does not move when the list does** — the one figure on the screen
   * that must not.
   *
   * It answers how the *fight* is going, and that question does not narrow because
   * the reader is looking at one side (`composeSides`). The pinned figure above it
   * now does narrow, and the two were reading one function: a mutation pointing the
   * summary at the narrowed figure lit nothing at all, because every closure over
   * the captures is measured under `Wszyscy`, where the two agree.
   */
  test.each(fights)("$name keeps the fight's own two figures whatever side is picked", ({ reading }) => {
    for (const metric of PANEL_METRICS) {
      const said = PANEL_TEAMS.map((team) => {
        const sides = composePanelView(reading, composeState({ metric, team })).sides;
        return composeJsonText([sides?.mineText, sides?.enemyText, sides?.nobody?.text]);
      });

      expect(said[0], metric).toBe(said[1]);
      expect(said[0], metric).toBe(said[2]);
    }
  });

  /**
   * ⚠️ **And the material reaches a screen where both sides hold some of it**, or
   * the closure above would pass on a filter that does nothing.
   *
   * Half the captures are one side taking everything — a group against a boss, so
   * the poison ticks are all the boss's and the healing all ours — and on those a
   * side really does hold the whole figure. Measured on the set as it stands at
   * this commit: `Leczenie` on
   * `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-1.json` splits
   * 56 406 to 55 365, and `Otrzymane` on
   * `tests/captured-fights/2026-08-12-tempest-grupa-vs-hildur-1.json` splits 966 to
   * 49 690. Stated as a property of the set rather than per fight, because which
   * fight has the shape is the recording's business and not the panel's.
   */
  test("the captures reach a screen where the figure is split between the sides", () => {
    const split = fights.flatMap(({ reading }) =>
      PANEL_METRICS.filter((metric) =>
        (["mine", "enemy"] as const).every(
          (team) => getNoActorRow(composePanelView(reading, composeState({ metric, team }))) !== null,
        ),
      ),
    );

    expect(split.length).toBeGreaterThan(0);
  });

  /**
   * Which screens the **recordings** still leave a figure with no actor on —
   * written out rather than derived, so the guard states the claim instead of
   * agreeing with whatever the corpus currently produces (§7.5).
   *
   * ⚠️ **Both halves are load-bearing.** Damage keeps its hole: `poison` and
   * `fire` arrive with the subject in the actor slot and a literal `0` at the other
   * end, and nothing announces them or documents who caused them. `injure` arrives
   * in the identical shape and no longer leaves one — the blow before it announced
   * the wound and named who applied it
   * (`docs/specs/2026-08-19-a-wound-remembers-who-dealt-it.md`), which is why this
   * cell still says `true` on the strength of two keys rather than three. Healing
   * has none left — every point in every recording reaches a healer since
   * the three keys the help calls the healed combatant's own started saying so
   * (`docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`).
   *
   * A `false` that turned `true` again would be a healing key nobody has read, and
   * a `true` that turned `false` would be damage quietly acquiring an attacker.
   * Neither is something the corpus should be allowed to decide on its own, which
   * is why this is a table and not a `?? `.
   */
  const CAPTURES_LEAVE_NO_ACTOR: Record<PanelMetric, boolean> = {
    dealt: true,
    taken: true,
    healingGiven: false,
    healed: false,
  };

  /**
   * **The pinned row's own breakdown closes against the pinned row.**
   *
   * The property that makes all four cuts worth reading, and the one the panel
   * demands of every other list it draws — a section that quietly totals less than
   * the row above it with nothing saying why is the failure this project exists to
   * prevent, in miniature (`docs/specs/2026-08-11-the-panel-that-drills.md`).
   *
   * ⚠️ **It did not hold on `Zadane` before this round**, and could not be seen: the
   * cut summed the rows' `healthLostBySource` while the figure also carried
   * `unattributed.dealtApplied`, which is zero on every capture and is the whole
   * figure on a fight joined in progress, where no name resolves
   * (`src/core/fight-decoder.ts`). The hand-written fight below reaches that shape;
   * this reaches the sizes.
   */
  test.each(fights.flatMap((fight) => PANEL_METRICS.map((metric) => ({ ...fight, metric }))))(
    "$name closes what nobody can be charged with against its own parts, on $metric",
    ({ reading, metric }) => {
      /**
       * ⚠️ **Every side tab, and for one round it was only `Wszyscy`.** The figure
       * narrows now and both cuts had to narrow with it; a mutation stopping either
       * one lit nothing at all, because the screens where they could disagree were
       * the three the sweep never composed.
       */
      for (const team of PANEL_TEAMS) {
        const view = composePanelView(reading, composeState({ metric, team }));
        const pinned = getNoActorRow(view);
        // A side with none of it draws no row, which the figures above measure.
        if (pinned === null) continue;

        const parts = pinned.detail
          .filter((line) => line.kind === "stat")
          .map((line) => getIntegerFromText(line.value.replace(/\s/g, "")));
        expect(parts.length, `${metric} ${team}`).toBeGreaterThan(0);
        expect(parts.every((part) => part !== null), `${metric} ${team}`).toBe(true);

        const total = parts.reduce((sum: number, part) => sum + (part ?? 0), 0);
        expect(composeFigureText(total), `${metric} ${team}`).toBe(pinned.valueText);
      }

      // And whether it is drawn at all under no filter, which the loop above would
      // let a vanished row pass on every tab.
      const drawn = getNoActorRow(composePanelView(reading, composeState({ metric })));
      if (CAPTURES_LEAVE_NO_ACTOR[metric]) expect(drawn, metric).not.toBeNull();
      else expect(drawn, metric).toBeNull();
    },
  );

  /**
   * And the words it closes with belong to the screen.
   *
   * ⚠️ **`heal` is stated in both directions and used to be named once.** The
   * client reports a health *loss* under it with a negative figure
   * (`docs/protocol-keys.md`), so `Zadane` and `Otrzymane` printed `leczenie`
   * against a row of damage — healing on a damage screen, which is what the whole
   * of this round was reported as. Held against the **gain** table rather than
   * against the word, so rewording either one cannot quietly satisfy it.
   */
  test.each(fights)("$name says no healing word on a damage screen", ({ reading }) => {
    const gainOnly = Object.entries(HEALTH_GAIN_SOURCE_NAMES)
      .filter(([token]) => !(token in HEALTH_LOSS_SOURCE_NAMES))
      .map(([, named]) => named.fallback);
    expect(gainOnly.length).toBeGreaterThan(0);

    for (const metric of ["dealt", "taken"] as const) {
      const pinned = getNoActorRow(composePanelView(reading, composeState({ metric })));
      const labels = [...(pinned?.detail ?? [])].map((line) =>
        line.kind === "stat" ? line.label : "",
      );
      for (const word of [...gainOnly, HEALTH_GAIN_SOURCE_NAMES.heal?.fallback ?? ""]) {
        expect(labels, `${metric}/${word}`).not.toContain(word);
      }
    }
  });

  /**
   * `Σ zadane + bez sprawcy = Σ otrzymane`, as an equation on integers.
   *
   * ⚠️ **The test above was standing in for this and could not do it.** One of
   * its two comparisons is structural, and the other is a percentage rounded to
   * the unit — so the balance was held to a point in a hundred on a figure that
   * runs to six digits.
   *
   * The whole is read off the summary, because that is the one place the view
   * states it as a number: `My + Oni + Bez strony` is the rows the screen admits
   * plus whatever no row holds, which is `getWholeOnScreen` under no filter — how
   * the bar divides that total between the three is a different question, and the
   * one this does not ask. The two directions reach it by different arms of
   * `getMetricValue` and different arms of `getFigureOutsideRows`, so their
   * agreement is a measurement.
   */
  test.each(
    fights.flatMap((fight) =>
      (
        [
          ["obrażenia", "dealt", "taken"],
          ["leczenie", "healingGiven", "healed"],
        ] as const
      ).map(([noun, given, received]) => ({ ...fight, noun, given, received })),
    ),
  )("$name closes the $noun to the point from either direction", ({ reading, given, received }) => {
    const inGiven = getWholeFromSummary(composePanelView(reading, composeState({ metric: given })));
    const inReceived = getWholeFromSummary(composePanelView(reading, composeState({ metric: received })));

    expect(inGiven).not.toBeNull();
    expect(inGiven).toBe(inReceived);
  });

  /**
   * The same equation over a fight where the bucket is **not empty**.
   *
   * ⚠️ **Every capture resolves every name, so `unattributed` is zero on all of
   * them** — both its `dealtApplied` and its `taken`. The equation above would
   * therefore hold just as well for a panel that had dropped the term entirely,
   * which is the difference between a guard and a coincidence. A fight joined in
   * progress has no roster and every name in it resolves to nobody
   * (`src/core/fight-decoder.ts`), so this is the live shape, not a contrivance.
   */
  test("closes the damage from either direction when the figures have no actor", () => {
    const reading = composeReadingWithUnnamedEnds();
    const { statistics } = reading;

    // Read, not assumed: if a later round makes these resolve, the fight stops
    // being the one this test is for and says so here rather than passing.
    expect(statistics.unattributed.dealtApplied).toBe(400);
    expect(statistics.unattributed.taken).toBe(200);

    expect(getWholeFromSummary(composePanelView(reading, composeState({ metric: "dealt" })))).toBe(600);
    expect(getWholeFromSummary(composePanelView(reading, composeState({ metric: "taken" })))).toBe(600);

    /**
     * ⚠️ **And the pinned row's own breakdown, which the captures cannot reach.**
     * Every name in them resolves, so both cuts of this figure are empty there and
     * a panel that had simply dropped the term would pass the sweep above. Here
     * the blow with no striker is the whole figure — so `Zadane` has to name the
     * element it arrived as, and `Otrzymane` has to name the combatant it landed
     * on rather than filing 400 points as unplaceable while row 3 holds them.
     */
    const bySource = getNoActorRow(composePanelView(reading, composeState({ metric: "dealt" })));
    expect(bySource?.valueText).toBe("400");
    expect(bySource?.detail.filter((line) => line.kind === "stat")).toEqual([
      { kind: "stat", label: "fizyczne", value: "400", isStrong: false },
    ]);

    const byCombatant = getNoActorRow(composePanelView(reading, composeState({ metric: "taken" })));
    expect(byCombatant?.valueText).toBe("400");
    expect(byCombatant?.detail.filter((line) => line.kind === "stat")).toEqual([
      { kind: "stat", label: "coś dużego", value: "400", isStrong: false },
    ]);

    /**
     * ⚠️ **And the side tab reaches the whole of it from one end and nothing from
     * the other.** No recording reaches this shape: in every one of them the blow
     * with no striker is a tick on a row that also took ordinary blows, so a filter
     * dropping the term entirely would still leave a figure behind. Here the blow
     * *is* the figure, and it landed on side two.
     */
    for (const [team, expected] of [
      ["mine", null],
      ["enemy", "400"],
    ] as const) {
      const sided = getNoActorRow(composePanelView(reading, composeState({ metric: "taken", team })));
      expect(sided?.valueText ?? null, team).toBe(expected);
    }

    /**
     * ⚠️ **And the given direction narrows the other way, which is what makes the
     * two tabs differ.** The blow landed on side two, so `Otrzymane · My` pins
     * nothing — and by the same token our side is the one credited with dealing
     * it, so `Zadane · My` pins all 400 and `Zadane · Oni` pins none. That is the
     * mirror on the smallest fight that can show it, and it is the pair a mutation
     * inverting the charge breaks.
     *
     * The cut travels with the figure: by source on a given screen, narrowed to
     * the team charged with it, closing against it on both tabs.
     */
    for (const [team, expected] of [
      ["mine", "400"],
      ["enemy", null],
    ] as const) {
      const givenBySide = getNoActorRow(composePanelView(reading, composeState({ metric: "dealt", team })));
      expect(givenBySide?.valueText ?? null, team).toBe(expected);
      if (expected === null) continue;
      expect(givenBySide?.detail.filter((line) => line.kind === "stat"), team).toEqual([
        { kind: "stat", label: "fizyczne", value: "400", isStrong: false },
      ]);
      // The whole on that screen contains it, so it states its share of one.
      expect(givenBySide?.bracketText, team).toMatch(/^\(/);
    }
  });

  /**
   * **What has no side at *either* end stays outside the two figures.**
   *
   * The summary charges a figure with no actor to the side the game named at the
   * other end (`docs/specs/2026-08-18-a-tick-nobody-swung-still-has-a-side.md`).
   * A blow naming neither end has no such side, so it is the part that survives —
   * and it is the whole reason the part survives at all, since it is zero in every
   * recording and a bar that had dropped it would draw identically on all of them.
   *
   * Read from both directions, because the two reach it through different terms:
   * `Zadane` through what no row holds of the fight's own figure, `Otrzymane`
   * through what the aggregate could not place at all.
   */
  test("keeps a blow that names neither end outside both sides", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
    ]);
    const statistics = composeFightStatistics(
      decodeFight(["1=90.00;3=50.00;+dmg=500;-dmg=400", "0;0;+dmg=90;-dmg=70"], roster),
      roster,
    );
    const reading = { statistics, roster, ourSide: 1, isFromFightStart: true } satisfies PanelReading;

    // Read, not assumed: the fight stops being the one this test is for if a later
    // round makes either end resolve.
    expect(statistics.unattributed.dealtApplied).toBe(70);
    expect(statistics.unattributed.taken).toBe(70);

    expect(getSideFigures(composePanelView(reading, composeState({ metric: "dealt" })))).toEqual({
      mine: 400,
      enemy: 0,
      nobody: 70,
    });
    expect(getSideFigures(composePanelView(reading, composeState({ metric: "taken" })))).toEqual({
      mine: 0,
      enemy: 400,
      nobody: 70,
    });
  });

  /**
   * ⚠️ **The row for a missing target is charged by the striker, to the team
   * facing them — and nothing lit up when that was made to charge the striker's
   * own team.**
   *
   * The captures cannot show it: every one of them resolves every name, so
   * `unattributed.takenByActorId` is empty in every one and the row never draws.
   * The hand-built fights that do reach the row reach it through a blow naming
   * *neither* end, whose figure is not charged at all. So the one screen where the
   * charge on this row can be read is this one, and until it was written the
   * direction was free to be either.
   *
   * The mage is on our side and swung at a name the roster has nobody for. The
   * blow landed on somebody — it is `Otrzymane`, so the question is who *took* it
   * — and by the rule that damage crosses, that is the other team.
   */
  test("charges a blow with no target to the team facing whoever swung it", () => {
    const reading = composeReadingWithUnnamedEnds();

    // Read, not assumed: the striker resolved and the target did not.
    expect([...reading.statistics.unattributed.takenByActorId.keys()]).toEqual([1]);
    expect(reading.roster.byId.get(1)?.side).toBe(reading.ourSide ?? undefined);

    for (const [team, expected] of [
      ["all", "200"],
      ["mine", null],
      ["enemy", "200"],
    ] as const) {
      const row = getNoTargetRow(composePanelView(reading, composeState({ metric: "taken", team })));
      expect(row?.valueText ?? null, team).toBe(expected);
    }

    // And the cut under it names the one end the game did state.
    const row = getNoTargetRow(composePanelView(reading, composeState({ metric: "taken" })));
    expect(row?.detail.filter((line) => line.kind === "stat")).toEqual([
      { kind: "stat", label: "mag", value: "200", isStrong: false },
    ]);
  });

  /**
   * **An announced heal whose recipient nobody could place reaches both screens**
   * — the giver's own row on one, and the row for a target the game did not name
   * on the other.
   *
   * ⚠️ **It reached neither for a release.** The aggregate credited a healer only
   * where both ends resolved, so these points were on no row, in no total, and
   * filed as healing nobody announced (`src/core/fight-statistics.ts`). The panel
   * could not have shown them however it composed itself, which is why the fix is
   * one layer down and this test is here to say what it bought.
   */
  test("puts an announced heal with no recipient on the giver and on the row for it", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
    ]);
    const statistics = composeFightStatistics(
      decodeFight(
        ["1=90.00;0;tspell=Uzdrowienie;skillId=7", "1=90.00;0;heal_target=300"],
        roster,
      ),
      roster,
    );
    const reading = { statistics, roster, ourSide: 1, isFromFightStart: true } satisfies PanelReading;

    // Given: the healer holds it, so no row stands apart from the ranking.
    const given = composePanelView(reading, composeState({ metric: "healingGiven" }));
    expect(given.lists[0]?.rows.find((row) => row.label === "mag")?.valueText).toBe("300");
    expect(given.pinnedRows).toEqual([]);

    // And their own breakdown names the end that is missing rather than coming up
    // short of the row above it. The announcement is a cut of one row and stays
    // hidden: it is not the closing row, and a reader who wants it opens the row
    // above.
    const drill = composePanelView(
      reading,
      composeState({ metric: "healingGiven", focusCombatantId: 1 }),
    );
    expect(drill.lists.flatMap((list) => list.rows).map((row) => [row.label, row.valueText])).toEqual(
      [["Nieznany cel", "300"]],
    );

    // Received: nobody's row holds it, so the row for a missing target does — on
    // the healer's own team, because healing does not cross.
    for (const [team, expected] of [
      ["all", "300"],
      ["mine", "300"],
      ["enemy", null],
    ] as const) {
      const row = getNoTargetRow(composePanelView(reading, composeState({ metric: "healed", team })));
      expect(row?.valueText ?? null, team).toBe(expected);
    }
  });

  /**
   * **The `Z czego` cut narrows with the figure over it, and the charge decides
   * which way** — on the one shape that can tell: a blow whose striker did not
   * resolve, landing on a placed combatant on each side.
   *
   * ⚠️ **This has been asserted three ways in three rounds, and each assertion was
   * that round's understanding written down.** It narrowed by the victim, which
   * put a received-end figure over a given-end list; then it stopped narrowing at
   * all, because the figure was held to have no side
   * (`docs/specs/2026-08-18-a-figure-with-no-actor-has-no-side.md`); now it
   * narrows by the charge, which is the victim's *opposite* under `Zadane`
   * (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`). The three are
   * told apart by which tab each element lands on, which is why the fight is built
   * with one of each on a different side.
   *
   * ⚠️ **A mutation here lights nothing over the captures.** Every recording
   * resolves every striker, so the element half of this cut is empty in all of
   * them and the sources half is per victim already. Two sides and two elements is
   * the smallest fight that can tell, which is why it is built by hand.
   */
  test("cuts what nobody can be charged with by the team it is charged to", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
    ]);
    const statistics = composeFightStatistics(
      decodeFight(
        [
          "0;1=50.00;+dmgf=200;-dmgf=150",
          "0;3=50.00;+dmg=500;-dmg=400",
        ],
        roster,
      ),
      roster,
    );
    const reading = { statistics, roster, ourSide: 1, isFromFightStart: true } satisfies PanelReading;

    // Read, not assumed: both blows have a striker nobody could name, and they
    // land on opposite sides.
    expect(statistics.unattributed.dealtApplied).toBe(550);

    const getCut = (team: (typeof PANEL_TEAMS)[number]): PanelDetailLine[] =>
      getNoActorRow(composePanelView(reading, composeState({ metric: "dealt", team })))?.detail.filter(
        (line) => line.kind === "stat",
      ) ?? [];

    // Biggest first, the way every cut on the panel is ordered. 400 of physical
    // fell on side two, so our side dealt it; 150 of fire fell on ours, so theirs
    // did — the opposite tab from the one the victim is on.
    expect(getCut("all"), "all").toEqual([
      { kind: "stat", label: "fizyczne", value: "400", isStrong: false },
      { kind: "stat", label: "ogień", value: "150", isStrong: false },
    ]);
    expect(getCut("mine"), "mine").toEqual([
      { kind: "stat", label: "fizyczne", value: "400", isStrong: false },
    ]);
    expect(getCut("enemy"), "enemy").toEqual([
      { kind: "stat", label: "ogień", value: "150", isStrong: false },
    ]);

    // And each cut closes against the figure standing over it.
    for (const [team, figure] of [
      ["all", "550"],
      ["mine", "400"],
      ["enemy", "150"],
    ] as const) {
      const pinned = getNoActorRow(composePanelView(reading, composeState({ metric: "dealt", team })));
      expect(pinned?.valueText, team).toBe(figure);
    }
  });

  /**
   * ⚠️ **The healing cut is narrowed to the side on screen, and one line does it.**
   * `getNoActorHealingBySource` opens with `if (!isCharged(id)) continue;` — the
   * same line, character for character, that `getNoActorDamageBySource` opens
   * with one function above. Dropping the negation on the damage side reddens
   * seventeen tests; dropping it on the healing side reddened nothing, so the
   * pinned row under `Leczenie · My` could have listed exactly the points that are
   * **not** ours with the label and the bracket unchanged
   * (`docs/audits/2026-08-21-the-rest-of-the-code-read-for-its-smells.md`, F1).
   *
   * Two sides, both healed by nobody, and each tab has to show its own — which is
   * what makes the inversion visible rather than merely wrong.
   */
  test("narrows healing nobody gave to the side the tab is showing", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
    ]);
    // `heal_target` and no announcement over it: healing that arrived with nobody
    // on the giving end, which is what the pinned row under `Leczenie` stands for.
    const statistics = composeFightStatistics(
      decodeFight(["0;1=50.00;heal_target=100", "0;3=40.00;heal_target=70"], roster),
      roster,
    );
    const reading = { statistics, roster, ourSide: 1, isFromFightStart: true } satisfies PanelReading;

    // `Leczenie dane`, because that is the screen whose cut is by **what the
    // healing came from** — the one `getNoActorHealingBySource` builds. Under
    // `Leczenie` the same row is cut by recipient and never reaches it.
    const getCut = (team: (typeof PANEL_TEAMS)[number]): string[] =>
      (
        getNoActorRow(
          composePanelView(reading, composeState({ metric: "healingGiven", team })),
        )?.detail ?? []
      )
        .filter((line) => line.kind === "stat")
        .map((line) => (line.kind === "stat" ? line.value : ""));

    expect(getCut("mine")).toEqual(["100"]);
    expect(getCut("enemy")).toEqual(["70"]);
    expect(getCut("all")).toEqual(["170"]);
  });

  /**
   * **What names neither end rides one row, under `Wszyscy`, and nowhere else.**
   *
   * A blow naming neither end is the one part of this screen no team can claim: it
   * left nobody and it reached nobody the roster places, so no end is left to
   * derive a team from. Under `Wszyscy` it is inside the row that stands apart
   * from the ranking and the breakdown names it; under a side tab it is on no row
   * at all, or the two teams would each be handed the other's unplaceable points
   * and the closure over the captures would still pass.
   *
   * ⚠️ **It rides the row for a missing *target* here, and it used to ride the one
   * for a missing actor.** Under `Otrzymane` the actor row is a cut of the ranking
   * — every point of it is already on a victim's row — so a figure no row holds
   * could not sit inside it without making the cut total more than the ranking it
   * cuts into (`getHoleCarryingNeitherEnd`).
   *
   * The captures cannot reach this — every name in them resolves — and the fight
   * above cannot either: its unnamed blow still names a target. A second message
   * is what makes the leftover non-zero.
   */
  test("keeps what no team can hold to the screen that shows the whole fight", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
    ]);
    const statistics = composeFightStatistics(
      decodeFight(
        [
          // Nobody swung it, and it landed on somebody named.
          "0;3=50.00;+dmg=500;-dmg=400",
          // Nobody swung it and it landed on nobody: neither team can hold this.
          "0;0;+dmg=100;-dmg=90",
        ],
        roster,
      ),
      roster,
    );
    const reading = { statistics, roster, ourSide: 1, isFromFightStart: true } satisfies PanelReading;

    // Read, not assumed, the way the fight above is.
    expect(statistics.unattributed.dealtApplied).toBe(490);

    const view = composePanelView(reading, composeState({ metric: "taken" }));
    const noActor = getNoActorRow(view);
    expect(noActor?.valueText).toBe("400");
    expect(noActor?.detail.filter((line) => line.kind === "stat")).toEqual([
      { kind: "stat", label: "coś dużego", value: "400", isStrong: false },
    ]);

    const noTarget = getNoTargetRow(view);
    expect(noTarget?.valueText).toBe("90");
    expect(noTarget?.detail.filter((line) => line.kind === "stat")).toEqual([
      { kind: "stat", label: getNeitherEndLeftover().label, value: "90", isStrong: false },
    ]);
    /**
     * ⚠️ **The words themselves, and this is the one screen that draws them.**
     * Everywhere else this pair is read back from the module that writes it, which
     * holds the two sides to be the same and neither to be right — so both halves
     * could have been replaced by anything at all, including a key of the game's
     * or a word of ours, with the gate green (§3,
     * `docs/audits/2026-08-21-the-code-read-for-its-smells.md`, F4). It is the row
     * for what names neither end, which no recording has ever produced.
     */
    expect(getNeitherEndLeftover()).toEqual({
      label: "Nie do przypisania",
      note: "Ta część nie trafiła na żaden wiersz — nie wiadomo ani kto, ani komu.",
    });

    // A side tab takes the part with a team and leaves the part without one.
    const sided = composePanelView(reading, composeState({ metric: "taken", team: "enemy" }));
    expect(getNoActorRow(sided)?.valueText).toBe("400");
    expect(getNoTargetRow(sided)).toBeNull();
  });

  /**
   * The other half of the same shape: a blow with no striker that also landed on
   * nobody, and nothing else in the fight. Then no row can hold any of it, and the
   * screen says so on the one row that stands apart — with the one sentence in
   * `panel-words.ts` that names a limit of **ours** as well as of the game's.
   */
  test("names the part no row can hold, where a blow reached nobody either", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
    ]);
    const statistics = composeFightStatistics(
      decodeFight(["0;0;+dmg=500;-dmg=400"], roster),
      roster,
    );
    const reading = { statistics, roster, ourSide: 1, isFromFightStart: true } satisfies PanelReading;

    expect(statistics.unattributed.dealtApplied).toBe(400);
    expect(statistics.unattributed.taken).toBe(400);

    const view = composePanelView(reading, composeState({ metric: "taken" }));
    expect(getNoActorRow(view)).toBeNull();

    const pinned = getNoTargetRow(view);
    expect(pinned?.valueText).toBe("400");
    const stats = [...(pinned?.detail ?? [])].filter((line) => line.kind === "stat");
    expect(stats.length).toBe(1);
    expect(stats[0]?.value).toBe("400");
    expect(stats[0]?.label).toBe(getNeitherEndLeftover().label);
  });

  /**
   * ⚠️ **The summary under the list used to draw a part of the fight as the whole
   * of it.** It summed the rows and nothing else, so under `Zadane` it was short
   * by everything with no actor — 1.3% to 18.6% across these captures — and under
   * `Leczenie dane` by 55.6% to 88.3%, while the pinned row directly above it
   * stated that very figure. On `2026-08-12-tempest-grupa-vs-hildur-2` the bar
   * divided 14 393 points 100/0 with 109 113 unaccounted for beside it.
   *
   * Checked as a property rather than against a number: the three parts are one
   * whole, so their shares come to one and their figures come to the figure every
   * bracket on that screen divides by.
   */
  test.each(fights)("$name closes the summary against the whole on screen", ({ reading }) => {
    for (const metric of PANEL_METRICS) {
      const view = composePanelView(reading, composeState({ metric }));
      const sides = view.sides;
      if (sides === null || sides.shares === null) continue;

      const where = `${reading.statistics.byCombatantId.size} ${metric}`;
      expect(sides.shares.mine + sides.shares.enemy + sides.shares.nobody, where).toBeCloseTo(1, 10);

      // Off the drawn text, which is what a person adds up. The rows plus the
      // pinned row are the same whole read the other way round.
      const parts = [sides.mineText, sides.enemyText, sides.nobody?.text ?? "0"].map((text) =>
        assertDefined(getIntegerFromText(text.replace(/\s/gu, "")), `figure in ${text}`),
      );
      const rows = view.lists.flatMap((list) => list.rows);
      const pinned = view.pinnedRows.filter((row) =>
        ROWS_ADDING_TO_THE_WHOLE[metric].includes(row.key),
      );
      const onScreen = [...rows, ...pinned]
        .reduce(
          (sum, row) =>
            sum + assertDefined(getIntegerFromText(row.valueText.replace(/\s/gu, "")), row.key),
          0,
        );
      expect(parts.reduce((sum, part) => sum + part, 0), where).toBe(onScreen);
    }
  });

  /**
   * ⚠️ **These figures used to be one `·`-joined line with no heading.**
   *
   * Points of armour, percentage points of resistance and absorbed damage stood
   * in one string, which reads as one list of comparable things and invites the
   * addition §10 forbids. They are two blocks now, each labelled, and the unit
   * rides in the value of the one that is not in points.
   *
   * ⚠️ **Read off the material, not off a list somebody keeps.**
   *
   * The sweep above holds the panel against tokens written down by hand, and a
   * hand-written list only ever forbids what somebody thought of: `fastarrow` and
   * `contra` reached the screen as the game wrote them for as long as they were
   * absent from it. This takes every token the captures actually carry and asks
   * whether any of them survived to a label — so a key the game adds next month
   * fails the gate the first time a recording of it lands here.
   */
  test.each(fights)("$name turns every token the game wrote into a phrase", ({ reading }) => {
    const tokens = new Set<string>();
    for (const row of [...reading.statistics.byCombatantId.values(), reading.statistics.unattributed]) {
      for (const token of row.procsOnBlowsStruck.keys()) tokens.add(token);
      for (const token of row.prevented.keys()) tokens.add(token);
      for (const token of row.destroyed.keys()) tokens.add(token);
      for (const token of row.healedBySource.keys()) tokens.add(token);
      for (const token of row.healthLostBySource.keys()) tokens.add(token);
      // The two the sweep was missing, and the omission cost exactly what the
      // comment above predicts: `thirdatt` had no phrase at all, and `+oth_dmg`
      // built a second physical element out of a blank kind field.
      for (const token of row.dealtAppliedByElement.keys()) tokens.add(token);
      for (const token of row.takenByElement.keys()) tokens.add(token);
    }
    expect(tokens.size, "the capture carries tokens to check").toBeGreaterThan(0);

    for (const metric of PANEL_METRICS) {
      for (const focusCombatantId of [null, ...reading.statistics.byCombatantId.keys()]) {
        const strings = getEveryString(
          composePanelView(reading, composeState({ metric, focusCombatantId })),
        );
        for (const token of tokens) {
          // As a whole word, not as a substring: `blok` is the root of the Polish
          // `zablokowane` and finding it there is the translation working, not
          // failing. What must not appear is the token standing on its own.
          const asWord = new RegExp(
            `(^|[^\\p{L}])${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`,
            "u",
          );
          for (const text of strings) {
            expect(asWord.test(text), `${metric} ${focusCombatantId} ${token} in "${text}"`).toBe(
              false,
            );
          }
        }
      }
    }
  });

  test.each(fights)("$name labels what a defence stopped and what an attack destroyed", ({ reading }) => {
    for (const [id, row] of reading.statistics.byCombatantId) {
      const detail = composePanelView(
        reading,
        composeState({ metric: "taken" }),
      ).lists[0]!.rows.find((each) => each.key === `combatant:${id}`)?.detail;
      if (detail === undefined) continue;

      const headings = detail.filter((line) => line.kind === "heading").map((line) => line.text);
      const stats = detail.filter((line) => line.kind === "stat");

      const stoppedTokens = [...row.prevented.values()].filter((amount) => amount > 0);
      if (stoppedTokens.length > 0) {
        expect(headings, `${id} stopped`).toContain("Zatrzymane");
        // Counted between its own heading and the next, so the assertion is
        // about this block rather than about every stat in the tooltip — and it
        // needs no second copy of the vocabulary to stay in step with.
        const from = detail.findIndex((line) => line.kind === "heading" && line.text === "Zatrzymane");
        const rest = detail.slice(from + 1);
        const until = rest.findIndex((line) => line.kind === "heading");
        const inBlock = until === -1 ? rest : rest.slice(0, until);
        const stoppedLines = inBlock.filter((line) => line.kind === "stat");
        expect(stoppedLines.length, `${id} stopped lines`).toBe(stoppedTokens.length);
      }

      if ([...row.destroyed.values()].some((amount) => amount > 0)) {
        expect(headings, `${id} destroyed`).toContain("Zniszczone");
        // The unit is the whole point of the split: resistance is percentage
        // points and its neighbours are not, so exactly one of them says so.
        const resistance = stats.find((line) => line.label === "zniszczona odporność");
        const armour = stats.find((line) => line.label === "zniszczony pancerz");
        if (resistance !== undefined) expect(resistance.value.endsWith("%")).toBe(true);
        if (armour !== undefined) expect(armour.value.endsWith("%")).toBe(false);
      }
    }
  });

  /**
   * ⚠️ **A column of shares that does not add up to what it divides by.**
   *
   * Every share used to be rounded on its own, and eleven of them rounded apart
   * from one another lose up to half a point each in the same direction. Measured
   * over every recording on 2026-08-22: of the 188 screens drawing a figure, 78
   * printed a set that did not come to a hundred — 30 a point over, 18 a point
   * under, three points out at the worst. The figures beside them were right the
   * whole time; a reader adding up the column was told a fight that was not the
   * one in front of them.
   *
   * The set is the ranking plus the pinned rows that **add** to the whole rather
   * than cutting into it, which is `ROWS_ADDING_TO_THE_WHOLE` above — written out
   * here so this states the claim rather than agreeing with the view. A share the
   * panel refuses to round down to nothing takes no point and counts as none,
   * which is how the floor and the sum stay out of each other's way.
   */
  test.each(fights)("$name prints shares that add up to the whole", ({ reading }) => {
    for (const metric of PANEL_METRICS) {
      for (const team of PANEL_TEAMS) {
        const view = composePanelView(reading, composeState({ metric, team }));
        const drawn = [
          ...view.lists.flatMap((list) => list.rows),
          ...view.pinnedRows.filter((row) => ROWS_ADDING_TO_THE_WHOLE[metric].includes(row.key)),
        ];
        // Nothing to divide by is not a division: every bracket on such a screen
        // says zero, and zero is what it measured.
        const figures = drawn.map((row) => getIntegerFromText(row.valueText.replace(/\s/g, "")) ?? 0);
        if (figures.reduce((sum, figure) => sum + figure, 0) <= 0) continue;

        let points = 0;
        for (const row of drawn) {
          expect(row.bracketText, `${metric} ${team} ${row.key}`).not.toBeNull();
          if (row.bracketText === null) continue;
          if (row.bracketText.includes(BELOW_A_POINT)) continue;
          const percent = getIntegerFromText(row.bracketText.replace(/[()%]/g, ""));
          expect(percent, `${metric} ${team} ${row.bracketText}`).not.toBeNull();
          points += percent ?? 0;
        }
        expect(points, `${metric} ${team}: the shares on screen add up to ${points}`).toBe(100);
      }
    }
  });

  /**
   * ⚠️ **Every bracket on a screen divides by the same figure.**
   *
   * The ranking used to divide by the ranking and the pinned row by the ranking
   * plus itself — two denominators, printed identically. Under `Zadane` it showed
   * as rows adding to 107% and nobody noticed; under `Leczenie dane` as a ranking
   * summing to 100% beside a row saying 79%.
   *
   * Checked by working backwards: a figure and its printed share imply a range the
   * denominator must lie in, and every row's range has to overlap every other's.
   * That way the test never needs to know what the whole *is* — only that there is
   * one of it, which is the property that broke.
   *
   * ⚠️ **A point either way, not half a point.** A share is no longer rounded on
   * its own: the set is apportioned so the column adds to the whole
   * (`composeShareTexts`), and that moves a row's last point up or down by one.
   * So the range a printed share implies is `(percent - 1, percent + 1)`, and this
   * is the weaker half of the claim — the sum below is the sharp one, and it is
   * the sum that is stated forwards.
   */
  test.each(fights)("$name divides every share by one and the same whole", ({ reading }) => {
    for (const metric of PANEL_METRICS) {
      for (const team of PANEL_TEAMS) {
        const view = composePanelView(reading, composeState({ metric, team }));
        const drawn = [
          ...view.lists.flatMap((list) => list.rows),
          ...view.pinnedRows,
        ];

        let low = 0;
        let high = Number.POSITIVE_INFINITY;
        for (const row of drawn) {
          // A row that states no share is outside this whole by decision, so it
          // bounds nothing — and it is checked for being outside where that is
          // decided, not read as a bracket that went missing.
          if (row.bracketText === null) continue;
          // A share the panel refuses to round to zero bounds the whole from one
          // side only, so it is no use working backwards — read as its own case
          // rather than as a parse that failed, which is a defect and not this.
          if (row.bracketText.includes(BELOW_A_POINT)) continue;
          const value = getIntegerFromText(row.valueText.replace(/\s/g, ""));
          const percent = getIntegerFromText(row.bracketText.replace(/[()%]/g, ""));
          expect(value, row.valueText).not.toBeNull();
          expect(percent, row.bracketText).not.toBeNull();
          if (value === null || percent === null) continue;
          // A share that rounded to zero bounds nothing, and a figure of zero
          // divides by anything — neither says which whole was used.
          if (value <= 0 || percent <= 0) continue;
          low = Math.max(low, (value * 100) / (percent + 1));
          high = Math.min(high, (value * 100) / (percent - 1));
        }

        if (low > 0 && Number.isFinite(high)) {
          expect(low, `${metric} ${team}: the shares imply two different wholes`).toBeLessThanOrEqual(high);
        }
      }
    }
  });

  /**
   * ⚠️ **A share of a whole the figure is not part of.**
   *
   * The test above holds that every bracket on a screen divides by *one* figure,
   * and it passed while the pinned row printed 320%: the denominator really was
   * the same one: it just did not contain the fight-wide numerator being divided
   * by it. One denominator and a meaningless denominator look identical from
   * inside that property, so the ceiling is stated here separately.
   *
   * Measured before the fix, over the captures: ten of the forty-eight filtered
   * received screens went over a hundred, the worst at 320%.
   */
  test.each(fights)("$name never states a share above the whole", ({ reading }) => {
    for (const metric of PANEL_METRICS) {
      for (const team of PANEL_TEAMS) {
        const view = composePanelView(reading, composeState({ metric, team }));
        const drawn = [
          ...view.lists.flatMap((list) => list.rows),
          ...view.pinnedRows,
        ];

        for (const row of drawn) {
          // A row outside this screen's whole states no share, and a share it does
          // not state cannot be above anything.
          if (row.bracketText === null) continue;
          // Under a point is under a hundred, and says nothing else this can read.
          if (row.bracketText.includes(BELOW_A_POINT)) continue;
          const percent = getIntegerFromText(row.bracketText.replace(/[()%]/g, "").split("·")[0]!.trim());
          expect(percent, `${metric} ${team} ${row.label} ${row.bracketText}`).not.toBeNull();
          expect(percent ?? 0, `${metric} ${team} ${row.label} ${row.bracketText}`).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  /**
   * The other end of the same fault: where the filtered side received nothing,
   * the denominator was zero and a five-figure number printed `(0%)`. §9.6 keeps
   * "measured nothing" apart from "could not be read", and a real figure drawn as
   * nothing fails that in the direction that costs most.
   */
  test.each(fights)("$name never marks the pinned figure as none of the screen", ({ reading }) => {
    for (const metric of PANEL_METRICS) {
      for (const team of PANEL_TEAMS) {
        const pinned = getNoActorRow(composePanelView(reading, composeState({ metric, team })));
        if (pinned === null || pinned.bracketText === null) continue;
        const value = getIntegerFromText(pinned.valueText.replace(/\s/g, ""));
        if (value === null || value <= 0) continue;
        expect(pinned.bracketText, `${metric} ${team}`).not.toBe("(0%)");
      }
    }
  });

  /**
   * ⚠️ **A share on every screen, and the two ways it went missing are both
   * closed.**
   *
   * The bracket was dropped on a received direction under a side filter for a
   * whole release, because a fight-wide numerator over one side's denominator
   * printed 320% and, where that side received nothing, `(0%)` beside a
   * five-figure number. Then it was dropped on the given directions instead, when
   * the figure was held to have no side at all. Both were the same fault seen from
   * different ends — figure and whole scoped differently — and the charge closes
   * it: the row narrows exactly as the list does
   * (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`).
   *
   * Stated over every screen rather than as an enumerated exception, because an
   * exception is the thing that widens unnoticed.
   */
  test.each(fights)("$name states a share on every screen it draws a row", ({ reading }) => {
    for (const metric of PANEL_METRICS) {
      for (const team of PANEL_TEAMS) {
        const view = composePanelView(reading, composeState({ metric, team }));
        for (const pinned of view.pinnedRows) {
          expect(pinned.bracketText, `${metric} ${team} ${pinned.key}`).toMatch(/^\(/);
        }
      }
    }
  });

  test.each(fights)("$name never draws a bar past the end of its track", ({ reading }) => {
    for (const metric of PANEL_METRICS) {
      for (const team of PANEL_TEAMS) {
        const view = composePanelView(reading, composeState({ metric, team }));
        const drawn = [
          ...view.lists.flatMap((list) => list.rows),
          ...view.pinnedRows,
        ];
        if (drawn.length === 0) continue;

        for (const row of drawn) {
          expect(row.fill, `${metric} ${team} ${row.label}`).toBeLessThanOrEqual(1);
        }

        // The scale is the list's, so the row that is not on the list's arithmetic
        // is not on it either: under a given direction with a side picked the
        // pinned figure is the fight's, it draws no bar, and seeding the scale with
        // it would shrink every bar that is measured against it.
        const onScale = drawn.filter(
          (row) => !(row.key === "nobody" && isGivenMetric(metric) && team !== "all"),
        );
        if (onScale.length === 0) continue;

        // And the scale is still tight: something on screen reaches the end, or
        // clamping every bar would pass this while measuring against nothing.
        //
        // ⚠️ **Unless nothing on the scale happened**, which is a screen the panel
        // reached only once the pinned figure started answering the side tab:
        // `Leczenie · Oni` on the group captures is a side that received no
        // healing at all, and a full bar over a column of zeroes would draw
        // nothing as everything. Read off the figures rather than assumed, so a
        // screen that lost its numbers cannot excuse itself here.
        if (onScale.every((row) => getIntegerFromText(row.valueText.replace(/\s/g, "")) === 0)) continue;
        expect(onScale.some((row) => row.fill === 1), `${metric} ${team}`).toBe(true);
      }
    }
  });
});

/**
 * The panel part-way through a fight, which is the only place the difference
 * shows.
 *
 * ⚠️ **Every test above this one runs on a whole capture, where the roster and
 * the aggregate are the same list** — measured on all of them: each rostered
 * combatant is eventually named, so a ranking built from either set draws the
 * same rows and nothing here could tell the two apart. The gap lives at the
 * start of a fight, which is exactly when somebody is watching: on the first
 * engine call of `2026-08-06-tempest-grupa-vs-hildur` the roster holds 11 and
 * the aggregate 2, and somebody is missing for its first 21 calls of 102.
 *
 * So the material is one call rather than a fight: the roster the game had
 * stated by then, and only the messages that arrived with it.
 */
describe("the panel before anybody has acted", () => {
  const OPENINGS = CAPTURED_FIGHTS.map((fight) => {
    const [first] = fight.dump.calls;
    // The payload as well as the snapshots, because that is what the session has
    // to work with at this moment: a fight fought on auto opens with no battle
    // object to snapshot, and its roster rides in `ladunek.w` alone. Read off the
    // snapshots only, that opening was a fight of nobody with three rows drawn
    // over it (`composeCombatantsOfPayload`).
    const roster = composeRosterFromSnapshots([
      ...(first === undefined ? [] : composeCombatantsOfPayload(first)),
      ...(first?.combatantsBefore ?? []),
      ...(first?.combatantsAfter ?? []),
    ]);
    return {
      name: fight.name,
      roster,
      reading: {
        statistics: composeFightStatistics(decodeFight(first?.protocolMessages ?? [], roster), roster),
        roster,
        ourSide: 1,
        isFromFightStart: true,
      } satisfies PanelReading,
    };
  });

  /**
   * Without this the sweep below could go quiet — a capture set whose first call
   * always names everybody would pass it by drawing the rows it was already
   * drawing (§9.2: a loop over nothing is green).
   */
  test("the material still has fights the aggregate lags behind", () => {
    const lagging = OPENINGS.filter(
      ({ roster, reading }) => roster.byId.size > reading.statistics.byCombatantId.size,
    );

    expect(lagging.length).toBeGreaterThan(0);
    // And the gap is a list of people, not a row or two.
    expect(
      Math.max(
        ...lagging.map(({ roster, reading }) => roster.byId.size - reading.statistics.byCombatantId.size),
      ),
    ).toBeGreaterThan(1);
  });

  test.each(OPENINGS)("$name lists everyone from its first payload", ({ roster, reading }) => {
    for (const metric of PANEL_METRICS) {
      const drawn = composePanelView(reading, composeState({ metric })).lists[0]!.rows;

      expect(drawn.length, metric).toBe(roster.byId.size);
      for (const combatant of roster.byId.values()) {
        expect(drawn.map((row) => row.label), metric).toContain(combatant.name);
      }
    }
  });

  /**
   * A combatant nothing has named is drawn on zero rather than left out, and
   * zero is a reading — §9.6's line, at the one moment a player meets it. What
   * they must not get is a row that is missing, which says there is no such
   * person.
   */
  test.each(OPENINGS)("$name draws a nought where it has measured nothing", ({ roster, reading }) => {
    for (const id of roster.byId.keys()) {
      if (reading.statistics.byCombatantId.has(id)) continue;
      const drawn = composePanelView(reading, composeState()).lists[0]!.rows;
      const row = drawn.find((one) => one.label === roster.byId.get(id)?.name);

      expect(row?.valueText).toBe(composeFigureText(0));
      expect(row?.fill).toBe(0);
      expect(row?.isDrillable).toBe(true);
    }
  });

  /**
   * The header counts the people the list draws, and it is the one line a reader
   * checks the list against. It used to count what the aggregate had grouped, so
   * the opening of every group fight said `2 vs 1` above eleven rows.
   */
  test.each(OPENINGS)("$name counts in its header what it drew", ({ reading }) => {
    const view = composePanelView(reading, composeState());
    const bySide = new Map<number, number>();
    for (const row of view.lists[0]!.rows) {
      const side = [...reading.roster.byId.values()].find((one) => one.name === row.label)?.side;
      if (side !== undefined) setRunningTotal(bySide, side, 1);
    }
    const ourFirst = [...bySide].sort(([one], [other]) => {
      if (reading.ourSide === one) return -1;
      if (reading.ourSide === other) return 1;
      return one - other;
    });

    expect(view.title).toBe(ourFirst.map(([, count]) => composeFigureText(count)).join(" vs "));
  });
});

/**
 * The bars, against the one thing a bar means: length is the share of the
 * biggest figure on screen.
 */
describe("what a bar's length says", () => {
  test("the longest row fills it and the rest are measured against that one", () => {
    const view = composePanelView(composeReading(), composeState());
    const rows = view.lists[0]!.rows;

    expect(rows[0]!.fill).toBe(1);
    for (const row of rows.slice(1)) expect(row.fill).toBeLessThan(1);
  });

  /**
   * ⚠️ **It was drawn full width.** The row that says something is missing is
   * not the largest thing in the fight, and a bar claiming it was is a figure
   * misread at a glance — which is the whole of what a bar is for.
   */
  test("the row for what nobody can be charged with is measured the same way", () => {
    const view = composePanelView(composeReading(), composeState());
    const largest = view.lists[0]!.rows[0]!;
    const pinned = assertDefined(getNoActorRow(view), "the pinned row is drawn");

    expect(pinned.fill).toBeLessThan(1);
    // 60 points of poison against the 400 the mage landed.
    expect(pinned.fill).toBeCloseTo(60 / 400, 5);
    expect(largest.fill).toBe(1);
  });

  test("every bar is measured against the biggest figure on screen", () => {
    const view = composePanelView(composeReading(), composeState());

    for (const row of view.lists[0]!.rows) expect(row.fill).toBeLessThanOrEqual(1);
    expect(view.lists[0]!.rows.some((row) => row.fill === 1)).toBe(true);
  });
});

/**
 * Every sentence this panel says, recorded rather than described.
 *
 * ⚠️ **The words were swept for what they must not say and never for what they
 * do.** The block above walks every screen refusing a key of the game's or a
 * term of ours — a check on the *vocabulary*, and it passes just as happily when
 * one phrase is replaced by a different phrase. `bun tools/mutation-sweep.ts`
 * put a sentinel through 55 string literals in this file and nothing anywhere
 * went red. The panel's own title had already shown what that costs: it sat in
 * the sweep the whole time, and still announced `brak składu` over a roster.
 *
 * So this holds the other half. It is the same walk, and it asserts the set of
 * phrases exactly — a changed sentence has to be stated in a diff, and a new one
 * has to be added here on purpose, which is the right amount of friction for a
 * word a player reads (§3).
 *
 * *Driven by the hand-written fight and not the captures**, and that is the
 * condition it exists under rather than a convenience: the drill names skills
 * and combatants, and those are the game's own prose (§5, NOTICE.md). Anything
 * carrying a figure or a name from the fixture is dropped, so what is left is
 * only ever ours.
 *
 * A fight where the game names a target this fight has nobody to match.
 *
 * `+oth_dmg` states the target by **name**, and a name resolves through the
 * roster — so it comes back as nobody when the roster is absent, when it holds
 * no such name, or when two combatants answer to it
 * (`src/core/combatant-roster.ts`). A fight joined in progress has no roster at
 * all, which makes this the ordinary shape rather than a corner.
 *
 * The blow still lands on its striker's own figure, because `dealtApplied` is
 * added whatever the other end did. Only the pair is missing.
 */
function composeReadingWithUnnamedTarget(): PanelReading {
  const roster = composeCombatantRoster([
    { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
    { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
  ]);
  const statistics = composeFightStatistics(
    decodeFight(
      [
        "1=90.00;3=50.00;tspell=Ogień;skillId=9",
        "1=90.00;3=40.00;+oth_dmg=400, ,ktoś inny(66.95%)",
        "1=90.00;3=50.00;tspell=Ogień;skillId=9",
        "1=90.00;3=40.00;+dmg=500;-dmg=300",
      ],
      roster,
    ),
    roster,
  );
  return { statistics, roster, ourSide: 1, isFromFightStart: true };
}

/**
 * ⚠️ **The breakdown was empty under a row of 400.**
 *
 * Every section here closes against the row it was entered from, and that was
 * held only for the two received directions — because those were the two whose
 * shortfall the captures happen to contain. Under `Zadane` the pairs are written
 * only where the target resolved while the row's figure is added regardless, so
 * a name the roster could not place took the whole section with it: measured on
 * the fight above before the fix, entering a combatant ranked at 400 produced no
 * lists at all, and the panel did not even say they had done nothing, because
 * they had not.
 *
 * The deep level had the same hole and no closing row of any kind — the one list
 * in the panel that closed against nothing.
 */
describe("a target the fight cannot name", () => {
  const reading = composeReadingWithUnnamedTarget();

  test("still closes the opponents against the row above them", () => {
    const view = composePanelView(reading, composeState({ metric: "dealt", focusCombatantId: 1 }));
    const opponents = view.lists.find((list) => list.heading === "KOMU");

    expect(opponents?.totalText).toBe("700");
    expect(opponents?.rows.map((row) => [row.label, row.valueText])).toEqual([
      ["coś dużego", "300"],
      ["Nieznany cel", "400"],
    ]);
  });

  test("still closes the deep level against the skill it was entered from", () => {
    const view = composePanelView(
      reading,
      composeState({ metric: "dealt", focusCombatantId: 1, focusSkill: { ownerId: 1, key: "9" } }),
    );

    expect(view.lists[0]?.totalText).toBe("700");
    expect(view.lists[0]?.rows.at(-1)?.label).toBe("Nieznany cel");
  });

  /**
   * The row says what is not known, never why our reader cannot know it (§3) —
   * and it is a different sentence from the received directions' on purpose:
   * there nobody swung, here somebody did.
   */
  test("says what is missing without naming anything of ours", () => {
    const view = composePanelView(reading, composeState({ metric: "dealt", focusCombatantId: 1 }));
    const missing = view.lists.flatMap((list) => list.rows).find((row) => row.key === NO_TARGET_ROW_KEY);

    expect(missing?.detail).toEqual([
      { kind: "note", text: "Gra nie mówi, w kogo — wiadomo tylko, że cios wszedł." },
    ]);
    for (const forbidden of ["roster", "skład", "protok", "klucz", "null", "id"]) {
      expect(`${missing?.label} ${composeJsonText(missing?.detail)}`, forbidden).not.toContain(forbidden);
    }
  });
});

/**
 * **Every shape the protocol can send, and what the panel draws for it.**
 *
 * The table this walks is written out in `docs/half-named-figures.md`, and this
 * is the half a machine can check. What it asks about is the two pinned rows: which of
 * them appears, with what figure, on which tab. The ranked rows are the closures
 * above, and the bar is the mirror.
 *
 * ⚠️ **Written out rather than derived.** A test that computed the expected row
 * from the same rule the panel uses would agree with it whatever the rule became
 * (§7.5). These are the fights the protocol can produce, each with the answer
 * somebody decided — and the count is the list below, never a number in this
 * sentence: it read `twelve` over sixteen of them for three rounds
 * (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F4).
 *
 * The roster is two of ours, one of theirs, and an id it does not carry at all.
 */
const CASE_ROSTER = composeCombatantRoster([
  { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
  { id: 2, name: "tarcza", side: 1, profession: "w", level: 100, maximumHealth: null },
  { id: 3, name: "boss", side: 2, profession: null, level: null, maximumHealth: null },
]);

/** What the pinned rows say, per tab, in the order the panel draws them. */
type PinnedByTeam = { all: string[]; mine: string[]; enemy: string[] };

const EVERY_CASE: Array<{
  name: string;
  messages: string[];
  ourSide: number | null;
  drawn: Partial<Record<PanelMetric, PinnedByTeam>>;
  /**
   * What the **ranking** holds, where the answer is the point of the case.
   *
   * Optional, and stated only where a figure is supposed to reach a combatant's
   * own row: the pinned rows above say where a figure did *not* land, and a shape
   * whose whole claim is that it landed on somebody needs the other half read too.
   * A case that omits it is one the pinned rows already settle.
   */
  ranked?: Partial<Record<PanelMetric, PinnedByTeam>>;
}> = [
  {
    name: "both ends named",
    messages: ["1=90.00;3=50.00;+dmg=500;-dmg=400"],
    ourSide: 1,
    drawn: {
      dealt: { all: [], mine: [], enemy: [] },
      taken: { all: [], mine: [], enemy: [] },
    },
  },
  {
    name: "the actor named and no target",
    messages: ["1=90.00;0;+dmg=300;-dmg=200"],
    ourSide: 1,
    drawn: {
      dealt: { all: [], mine: [], enemy: [] },
      taken: { all: ["Nieznany cel 200"], mine: [], enemy: ["Nieznany cel 200"] },
    },
  },
  {
    name: "no actor, and the subject is theirs",
    messages: ["3=50.00;0;poison=60"],
    ourSide: 1,
    drawn: {
      dealt: { all: ["Nieznany sprawca 60"], mine: ["Nieznany sprawca 60"], enemy: [] },
      taken: { all: ["Nieznany sprawca 60"], mine: [], enemy: ["Nieznany sprawca 60"] },
    },
  },
  {
    name: "no actor, and the subject is ours",
    messages: ["2=90.00;0;poison=60"],
    ourSide: 1,
    drawn: {
      dealt: { all: ["Nieznany sprawca 60"], mine: [], enemy: ["Nieznany sprawca 60"] },
      taken: { all: ["Nieznany sprawca 60"], mine: ["Nieznany sprawca 60"], enemy: [] },
    },
  },
  {
    // ⚠️ **Written exactly like the two `poison` cases above, and read
    // differently.** The blow before it announced the wound and named who applied
    // it, and the tick states what that announcement stated — so both ends are
    // known and no row is pinned. The figure is the attacker's, beside their blow
    // and not inside it (§9.6,
    // `docs/specs/2026-08-19-a-wound-remembers-who-dealt-it.md`).
    name: "a wound the blow before it announced",
    messages: ["1=90.00;3=50.00;+dmg=500;-dmg=400;+injure=60", "3=50.00;0;injure=60"],
    ourSide: 1,
    drawn: {
      dealt: { all: [], mine: [], enemy: [] },
      taken: { all: [], mine: [], enemy: [] },
    },
    ranked: {
      dealt: { all: ["mag 460"], mine: ["mag 460"], enemy: [] },
      taken: { all: ["boss 460"], mine: [], enemy: ["boss 460"] },
    },
  },
  {
    // The other half of the same reading: a tick nothing announced has nobody to
    // charge, and is the `poison` case again. This is what a fight joined after the
    // blow that applied the wound sends.
    name: "a wound nothing announced",
    messages: ["3=50.00;0;injure=60"],
    ourSide: 1,
    drawn: {
      dealt: { all: ["Nieznany sprawca 60"], mine: ["Nieznany sprawca 60"], enemy: [] },
      taken: { all: ["Nieznany sprawca 60"], mine: [], enemy: ["Nieznany sprawca 60"] },
    },
    ranked: {
      dealt: { all: [], mine: [], enemy: [] },
      taken: { all: ["boss 60"], mine: [], enemy: ["boss 60"] },
    },
  },
  {
    name: "neither end named",
    messages: ["0;0;+dmg=90;-dmg=70"],
    ourSide: 1,
    drawn: {
      dealt: { all: ["Nieznany sprawca 70"], mine: [], enemy: [] },
      taken: { all: ["Nieznany cel 70"], mine: [], enemy: [] },
    },
  },
  {
    name: "a healer and the healed",
    messages: ["1=90.00;0;tspell=Skill One;skillId=7", "1=90.00;2=50.00;heal_target=100"],
    ourSide: 1,
    drawn: {
      healingGiven: { all: [], mine: [], enemy: [] },
      healed: { all: [], mine: [], enemy: [] },
    },
  },
  {
    name: "a healer named and no recipient",
    messages: ["1=90.00;0;tspell=Skill One;skillId=7", "1=90.00;0;heal_target=300"],
    ourSide: 1,
    drawn: {
      healingGiven: { all: [], mine: [], enemy: [] },
      healed: { all: ["Nieznany cel 300"], mine: ["Nieznany cel 300"], enemy: [] },
    },
  },
  {
    // ⚠️ **The hole that is left, and the only way it still arrives.** `heal_target`
    // takes its giver from the announcement over it and the help says nothing about
    // whose effect it is, so one with no announcement has a healed combatant and
    // nobody on the giving end. This row used to be `2=90.00;0;heal=50`.
    name: "the healed named and no healer",
    messages: ["1=90.00;2=50.00;heal_target=50"],
    ourSide: 1,
    drawn: {
      healingGiven: { all: ["Nieznany sprawca 50"], mine: ["Nieznany sprawca 50"], enemy: [] },
      healed: { all: ["Nieznany sprawca 50"], mine: ["Nieznany sprawca 50"], enemy: [] },
    },
    ranked: {
      healingGiven: { all: [], mine: [], enemy: [] },
      healed: { all: ["tarcza 50"], mine: ["tarcza 50"], enemy: [] },
    },
  },
  {
    // The help calls `heal` the healed combatant's own effect, so this names both
    // ends and no row is pinned on either screen (§9.6,
    // `docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`). The `poison`
    // case above arrives in the identical shape and keeps its pinned row, which is
    // what makes this a reading of the documentation and not of the message.
    name: "the healed named, and the help says whose effect it was",
    messages: ["2=90.00;0;heal=50"],
    ourSide: 1,
    drawn: {
      healingGiven: { all: [], mine: [], enemy: [] },
      healed: { all: [], mine: [], enemy: [] },
    },
    ranked: {
      healingGiven: { all: ["tarcza 50"], mine: ["tarcza 50"], enemy: [] },
      healed: { all: ["tarcza 50"], mine: ["tarcza 50"], enemy: [] },
    },
  },
  {
    // ⚠️ **What the fill needs is the id, and the roster is not what supplies it.**
    // The message names combatant 9 whether or not this fight can put a name or a
    // side on them, so both ends resolve and no row is pinned — the figure is on
    // their own row under `Wszyscy`, on no side tab, and the bar says `Bez strony`.
    // The shape with genuinely nothing to fill with is `0;0;heal=40` below.
    name: "a combatant the roster cannot place is healed by their own effect",
    messages: ["9=90.00;0;heal=50"],
    ourSide: 1,
    drawn: {
      healingGiven: { all: [], mine: [], enemy: [] },
      healed: { all: [], mine: [], enemy: [] },
    },
    ranked: {
      healingGiven: { all: ["#9 50"], mine: [], enemy: [] },
      healed: { all: ["#9 50"], mine: [], enemy: [] },
    },
  },
  {
    name: "neither end of a heal",
    messages: ["0;0;heal=40"],
    ourSide: 1,
    drawn: {
      healingGiven: { all: ["Nieznany sprawca 40"], mine: [], enemy: [] },
      healed: { all: ["Nieznany cel 40"], mine: [], enemy: [] },
    },
  },
  {
    name: "a combatant the roster cannot place swings",
    messages: ["9=90.00;3=50.00;+dmg=500;-dmg=400"],
    ourSide: 1,
    drawn: {
      dealt: { all: [], mine: [], enemy: [] },
      taken: { all: [], mine: [], enemy: [] },
    },
  },
  {
    name: "a combatant the roster cannot place is poisoned",
    messages: ["9=90.00;0;poison=60"],
    ourSide: 1,
    drawn: {
      dealt: { all: ["Nieznany sprawca 60"], mine: [], enemy: [] },
      taken: { all: ["Nieznany sprawca 60"], mine: [], enemy: [] },
    },
  },
  {
    name: "the game never said which side is ours",
    messages: ["3=50.00;0;poison=60"],
    ourSide: null,
    drawn: {
      dealt: { all: ["Nieznany sprawca 60"], mine: [], enemy: [] },
      taken: { all: ["Nieznany sprawca 60"], mine: [], enemy: [] },
    },
  },
];

describe("every shape the protocol can send", () => {
  test.each(EVERY_CASE)("$name", ({ messages, ourSide, drawn, ranked }) => {
    const statistics = composeFightStatistics(decodeFight(messages, CASE_ROSTER), CASE_ROSTER);
    const reading = {
      statistics,
      roster: CASE_ROSTER,
      ourSide,
      isFromFightStart: true,
    } satisfies PanelReading;

    for (const [metric, byTeam] of Object.entries(drawn) as Array<[PanelMetric, PinnedByTeam]>) {
      for (const team of PANEL_TEAMS) {
        const view = composePanelView(reading, composeState({ metric, team }));
        const said = view.pinnedRows.map((row) => `${row.label} ${row.valueText}`);
        expect(said, `${metric} · ${team}`).toEqual(byTeam[team]);
      }
    }

    // Rows carrying nothing are left out: everyone in a fight has a row from the
    // first payload, so listing them all would make every case's expectation a
    // copy of the roster rather than a statement about the figure.
    for (const [metric, byTeam] of Object.entries(ranked ?? {}) as Array<
      [PanelMetric, PinnedByTeam]
    >) {
      for (const team of PANEL_TEAMS) {
        const view = composePanelView(reading, composeState({ metric, team }));
        const said = (view.lists[0]?.rows ?? [])
          .filter((row) => row.valueText !== "0")
          .map((row) => `${row.label} ${row.valueText}`);
        expect(said, `ranking ${metric} · ${team}`).toEqual(byTeam[team]);
      }
    }
  });

  /**
   * ⚠️ **And the bar names what no row could take.** Three of those fights leave a
   * figure with no end to derive a side from; under a side tab it is on no row at
   * all, so the summary is the only thing that can say it is there (§9.6).
   */
  test.each([
    ["neither end named", ["0;0;+dmg=90;-dmg=70"], "70"],
    ["a combatant the roster cannot place is poisoned", ["9=90.00;0;poison=60"], "60"],
  ] as const)("says on the bar what %s leaves unplaceable", (_name, messages, figure) => {
    const statistics = composeFightStatistics(decodeFight([...messages], CASE_ROSTER), CASE_ROSTER);
    const reading = {
      statistics,
      roster: CASE_ROSTER,
      ourSide: 1,
      isFromFightStart: true,
    } satisfies PanelReading;

    for (const team of PANEL_TEAMS) {
      const view = composePanelView(reading, composeState({ metric: "dealt", team }));
      expect(view.sides?.nobody, team).toEqual({ label: "Bez strony", text: figure });
    }
  });

  /**
   * The team heal's own section of `docs/half-named-figures.md`, read off the
   * panel the way every table in that file is.
   *
   * It is not a half-named figure — the message names one end and a whole *side*
   * at the other — so it gets a walk of its own rather than a row in the table
   * above: what varies here is not which end the game named but whether this meter
   * holds the three figures a share has to be sized against.
   */
  describe("a share stated about a whole side", () => {
    const ROSTER = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: 1000 },
      { id: 2, name: "tarcza", side: 1, profession: "w", level: 100, maximumHealth: 1000 },
      { id: 3, name: "boss", side: 2, profession: null, level: null, maximumHealth: 5000 },
    ]);
    // `tarcza` is 400 down when the cast lands, so the cap binds on one member and
    // not on the other — with both at full the figures would be zero and the walk
    // would assert nothing.
    const MESSAGES = [
      "3=100.00;2=60.00;+dmg=400;-dmg=400",
      "1=100.00;1=100.00;tspell=Fala;skillId=9;healall_per=30",
    ];

    /** The ranking, as the panel draws it: one continuous list, no headings. */
    function getRanking(view: PanelView): string[] {
      return view.lists.flatMap((list) => list.rows).map((row) => `${row.label} ${row.valueText}`);
    }

    function composeCastReading(entry: ReadonlyMap<number, number>): PanelReading {
      return {
        statistics: composeFightStatistics(decodeFight(MESSAGES, ROSTER), ROSTER, entry),
        roster: ROSTER,
        ourSide: 1,
        isFromFightStart: entry.size > 0,
      };
    }

    const READ = new Map([
      [1, 1000],
      [2, 1000],
      [3, 5000],
    ]);

    test("puts the caster in the ranking and the healed on their own rows", () => {
      const reading = composeCastReading(READ);
      const given = composePanelView(reading, composeState({ metric: "healingGiven", team: "mine" }));
      const received = composePanelView(reading, composeState({ metric: "healed", team: "mine" }));

      // `tarcza` was 400 down and 30% of 1000 is 300, so the share binds rather
      // than the cap; `mag` was at full, so the cap gives them nothing. Everyone in
      // the fight has a row, which is why the zero is drawn rather than absent.
      expect(getRanking(given)).toEqual(["mag 300", "tarcza 0"]);
      expect(getRanking(received)).toEqual(["tarcza 300", "mag 0"]);
      // Nothing is left over: the caster is named, so no row for a missing end.
      expect(given.pinnedRows).toEqual([]);
      expect(received.pinnedRows).toEqual([]);
    });

    test("and says nothing about healing being short", () => {
      const view = composePanelView(
        composeCastReading(READ),
        composeState({ metric: "healed", team: "mine" }),
      );
      expect(view.warnings.filter((line) => line.includes("Uleczenie sojuszników"))).toEqual([]);
    });

    /**
     * The degrade path, and the two ways into it read identically to a player:
     * healing is short by an amount the game never stated.
     */
    test("draws no figure at all where the fight was joined in progress", () => {
      const reading = composeCastReading(new Map());
      const given = composePanelView(reading, composeState({ metric: "healingGiven", team: "mine" }));
      const received = composePanelView(reading, composeState({ metric: "healed", team: "mine" }));

      // Rows for everybody, figures for nobody — the difference between a fight
      // that healed nothing and one this meter could not size is the warning.
      expect(getRanking(given)).toEqual(["mag 0", "tarcza 0"]);
      expect(getRanking(received)).toEqual(["mag 0", "tarcza 0"]);
      expect(
        received.warnings.filter((line) => line.includes("Uleczenie sojuszników")).length,
      ).toBe(1);
    });

    test("and none where the caster has no side-mate to heal", () => {
      const alone = composeCombatantRoster([
        { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: 1000 },
        { id: 3, name: "boss", side: 2, profession: null, level: null, maximumHealth: 5000 },
      ]);
      const view = composePanelView(
        {
          statistics: composeFightStatistics(
            decodeFight(MESSAGES, alone),
            alone,
            new Map([
              [1, 1000],
              [3, 5000],
            ]),
          ),
          roster: alone,
          ourSide: 1,
          isFromFightStart: true,
        },
        composeState({ metric: "healed", team: "mine" }),
      );
      expect(getRanking(view)).toEqual(["mag 0"]);
      expect(view.warnings.filter((line) => line.includes("Uleczenie sojuszników")).length).toBe(1);
    });
  });

  /** No seat, no bar: the two figures are `My` and `Oni`, and neither exists yet. */
  test("draws no summary where the game never said which side is ours", () => {
    const statistics = composeFightStatistics(
      decodeFight(["1=90.00;3=50.00;+dmg=500;-dmg=400"], CASE_ROSTER),
      CASE_ROSTER,
    );
    const view = composePanelView(
      { statistics, roster: CASE_ROSTER, ourSide: null, isFromFightStart: true },
      composeState(),
    );

    expect(view.sides).toBeNull();
  });
});

describe("every sentence the panel says", () => {
  const OURS = [
    "  poza ciosem",
    "  z ciosów",
    "CZYM (UMIEJĘTNOŚCI)",
    "Cała walka · My / Oni",
    "Cios, przed którym nie stała żadna umiejętność. Gra nie odróżnia go od dodatkowego zamachu, który sama jej dała.",
    "Część tej walki nie dotarła do panelu — liczby są zaniżone.",
    "Część leczenia w tej walce jest bez sprawcy — nie da się sprawdzić, czy któreś z niego jest jej.",
    "Część obrażeń w tej walce jest bez sprawcy — nie da się sprawdzić, czy któreś z nich są jej.",
    "Gra nie mówi, kto leczył — wiadomo tylko, komu życia przybyło.",
    "Gra nie mówi, kto to zadał — wiadomo tylko, że życia ubyło.",
    "Gra nie mówi, w kogo — wiadomo tylko, że cios wszedł.",
    "KOMU",
    "Komu",
    "LPM — rozbicie · PPM — powrót",
    "Leczenie",
    "Leczenie dane",
    "Liczby z całej walki.",
    "My",
    "My / Oni",
    "Nic jej nie ubyło.",
    "Nie ma czego pokazać.",
    "Kto",
    "Nieznany cel",
    "Nieznany sprawca",
    "Nie zadała nikomu obrażeń.",
    "Nikogo nie leczyła.",
    "Nikt jej nie leczył.",
    "Nikt tego nie ma na swoim wierszu — dlatego stoi osobno.",
    "OD CZEGO",
    "OD KOGO",
    "Obrażenia",
    "Oni",
    "Otrzymane",
    "PPM — powrót",
    "Panel wpiął się w trakcie tej walki — to nie są jej pełne liczby.",
    "TYP OBRAŻEŃ",
    "Te obrażenia są już policzone wyżej, u tych, którym ubyło życia.",
    "To leczenie jest już policzone wyżej, u tych, którzy je dostali.",
    "Tylko z pokazanej drużyny — liczone po tym, komu przybyło życia.",
    "Tylko z pokazanej drużyny — liczone po tym, komu ubyło życia.",
    "Tylko z pokazanej drużyny — gra nie mówi, kogo z niej.",
    "Tylko z pokazanej drużyny — to ona to wyleczyła, choć gra nie mówi kto.",
    "Tylko z pokazanej drużyny — to ona to zadała, choć gra nie mówi kto.",
    "Użycia umiejętności",
    "Wszyscy",
    "Z czego",
    "Zadane",
    "Zwykły cios",
    "dane",
    "fizyczne",
    "przywracanie życia",
    "uleczenie wskazanego",
    "otrzymane",
    "trucizna",
    "umiejętność",
    "zadane",
    "‹ skład",
  ];

  /**
   * A figure or a name is data; everything else on the screen is our writing.
   *
   * Deliberately **not** `getEveryString`, which is right for its own job and
   * wrong for this one: it renders a detail line as its label and its value
   * joined, so every stat label would arrive carrying a number and be filtered
   * away as data. Written out the first time, that silently dropped six phrases
   * — including three of the four words on the tabs.
   */
  function getPhrasesOf(view: PanelView, reading: PanelReading): string[] {
    const fromTheFight = [...reading.roster.byId.values()]
      .map((one) => one.name)
      .concat("Skill One");
    const said = [
      view.title,
      view.outcomeText ?? "",
      view.emptyText ?? "",
      view.emptyLimitText ?? "",
      ...view.nounTabs.map((tab) => tab.label),
      ...view.directionTabs.map((tab) => tab.label),
      ...view.teamTabs.map((tab) => tab.label),
      ...(view.sides === null ? [] : [view.sides.label, view.sides.nobody?.label ?? ""]),
      ...(view.crumb === null ? [] : [view.crumb.backLabel, view.crumb.hereLabel]),
      ...view.lists.flatMap((list) => [list.heading ?? "", list.totalText ?? ""]),
      ...view.warnings,
      ...getEveryRow(view).flatMap((row) => [
        row.label,
        ...row.detail.map((line) => (line.kind === "stat" ? line.label : line.text)),
      ]),
    ];

    return said.filter(
      (text) =>
        text !== "" && !/\d/.test(text) && !fromTheFight.some((name) => text.includes(name)),
    );
  }

  /**
   * Three readings, because a warning that never fires is a sentence this walk
   * never sees. Written after the sweep put a sentinel through the joined-late
   * warning and nothing went red: the fixture starts at the beginning of its
   * fight, so that line had no way to appear.
   */
  const READINGS = [
    composeReading(),
    composeReading({ isFromFightStart: false }),
    composeReading({
      engineReading: {
        unreadablePayloadsByFault: new Map([["payload-not-a-record", 1]]),
        lostMessages: 0,
        unreadableCombatants: 0,
      },
    }),
    // ⚠️ **A fourth, and the summary's third part is why.** Every name in the
    // fixture resolves and every point of it therefore has a side, so `Bez strony`
    // stopped being said the moment the bar began charging a figure with no actor
    // to the side facing it — and the walk would have reported the sentence
    // retired rather than unreachable.
    composeReadingWithUnnamedEnds(),
  ];

  const said = new Set<string>();
  for (const reading of READINGS) for (const metric of PANEL_METRICS) {
    for (const team of PANEL_TEAMS) {
      const base = composeState({ metric, team });
      const states = [base];
      for (const focusCombatantId of reading.statistics.byCombatantId.keys()) {
        states.push({ ...base, focusCombatantId });
        states.push({ ...base, focusCombatantId, focusSkill: { ownerId: focusCombatantId, key: "7" } });
        for (const focusTargetId of reading.statistics.byCombatantId.keys()) {
          states.push({ ...base, focusCombatantId, focusTargetId });
        }
      }
      for (const state of states) {
        for (const phrase of getPhrasesOf(composePanelView(reading, state), reading)) said.add(phrase);
      }
    }
  }

  test("is one that was decided, and every one that was decided is still said", () => {
    expect([...said].sort()).toEqual([...OURS].sort());
  });

  // Without this the assertion above would pass by comparing two empty lists the
  // day the walk stopped reaching any screen at all.
  test("and there are sentences to hold", () => {
    expect(said.size).toBeGreaterThan(40);
  });
});

/**
 * The formatter every number on screen goes through.
 *
 * ⚠️ **No test named it.** It has twenty-seven callers inside its own file and
 * had none outside, so every figure a player reads was formatted by code the
 * gate could not have told you was there
 * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F24).
 */
describe("how a figure is written", () => {
  test("groups from the right, in threes", () => {
    expect(composeFigureText(354258)).toBe("354 258");
    expect(composeFigureText(1000)).toBe("1 000");
    expect(composeFigureText(1000000)).toBe("1 000 000");
  });

  // Either side of where the grouping starts, because that is the boundary and
  // §7.5 asks for both sides of one.
  test("and not below a thousand", () => {
    expect(composeFigureText(999)).toBe("999");
    expect(composeFigureText(0)).toBe("0");
    expect(composeFigureText(1)).toBe("1");
  });

  // A share is the only fractional figure that reaches it, and a bar's length is
  // not a number anybody reads — so a figure is whole by the time it is drawn.
  test("rounds rather than showing a fraction of a hit", () => {
    expect(composeFigureText(1499.4)).toBe("1 499");
    expect(composeFigureText(1499.6)).toBe("1 500");
  });

  // Health lost reaches the panel as a positive figure, but nothing in the type
  // says so, and a minus sign that broke the grouping would be a wrong number
  // that looks right.
  test("a negative figure keeps its sign and its grouping", () => {
    expect(composeFigureText(-354258)).toBe("-354 258");
  });
});

describe("the shelf, as data", () => {
  const READING: PanelFightsReading = {
    storage: "local",
    keepLimit: 5,
    hasStoreRefused: false,
    isEverySlotPinned: false,
    hasChoiceRefused: false,
  };

  function composeShelfFight(over: Partial<PanelKeptFight> = {}): PanelKeptFight {
    return {
      id: "one",
      isLive: false,
      isPinnable: true,
      isPinned: false,
      isSelected: false,
      at: { hour: 21, minute: 4 },
      sideCounts: [4, 4],
      outcome: "won",
      ...over,
    };
  }

  test("says what each fight was, without anything decoding one", () => {
    const view = composeFightsView([composeShelfFight()], READING);
    expect(view.rows).toHaveLength(1);
    expect(view.rows[0]).toMatchObject({
      id: "one",
      timeText: "21:04",
      sizesText: "4×4",
      outcomeText: "wygrana",
    });
    expect(view.emptyText).toBeNull();
  });

  test("says what will be here where nothing is", () => {
    const view = composeFightsView([], READING);
    expect(view.emptyText).not.toBeNull();
    expect(view.rows).toEqual([]);
  });

  test("marks the live fight as one nothing can pin", () => {
    const view = composeFightsView(
      [composeShelfFight({ id: "live", isLive: true, isPinnable: false, at: null, outcome: null })],
      READING,
    );
    expect(view.rows[0]?.isLive).toBe(true);
    expect(view.rows[0]?.timeText).toBe("teraz");
    expect(view.rows[0]?.outcomeText).toBe("trwa");
  });

  test("shows which of the two controls the reader is on", () => {
    const view = composeFightsView([], { ...READING, storage: "session", keepLimit: 10 });
    expect(view.storageTabs.filter((tab) => tab.isSelected).map((tab) => tab.choice)).toEqual([
      "session",
    ]);
    expect(view.keepLimitTabs.filter((tab) => tab.isSelected).map((tab) => tab.limit)).toEqual([10]);
  });

  /**
   * A limit off the strip is one an older build stored. Drawing four tabs with
   * none of them selected would say the panel had lost the reader's answer.
   */
  test("keeps a limit the strip does not offer, rather than moving the reader", () => {
    const view = composeFightsView([], { ...READING, keepLimit: 7 });
    expect(view.keepLimitTabs.map((tab) => tab.limit)).toContain(7);
    expect(view.keepLimitTabs.filter((tab) => tab.isSelected)).toHaveLength(1);
    expect([...view.keepLimitTabs].map((tab) => tab.limit)).toEqual(
      [...view.keepLimitTabs].map((tab) => tab.limit).sort((one, other) => one - other),
    );
  });

  test("exactly one tab is chosen on each strip, whatever the reader picked", () => {
    for (const storage of PANEL_STORAGE_CHOICES) {
      for (const keepLimit of PANEL_KEEP_LIMITS) {
        const view = composeFightsView([], { ...READING, storage, keepLimit });
        expect(view.storageTabs.filter((tab) => tab.isSelected)).toHaveLength(1);
        expect(view.keepLimitTabs.filter((tab) => tab.isSelected)).toHaveLength(1);
      }
    }
  });

  /** The reader's own doing first: one of the three has a remedy on this screen. */
  test("says all three things that can have gone wrong, the fixable one first", () => {
    const view = composeFightsView([], {
      ...READING,
      hasStoreRefused: true,
      isEverySlotPinned: true,
      hasChoiceRefused: true,
    });
    expect(view.warnings).toHaveLength(3);
    expect(view.warnings[0]).toContain("przypięte");
    expect(composeFightsView([], READING).warnings).toEqual([]);
  });

  /**
   * Read in words at the point it is drawn, and never back off the module that
   * composes it (§7.5): a sentence naming a quota, a store or an exception would
   * be ours rather than the reader's, and one saying nothing at all would pass a
   * test that compared the module with itself.
   */
  test("tells the reader a refused choice changed nothing, in their own words", () => {
    const view = composeFightsView([], { ...READING, hasChoiceRefused: true });
    expect(view.warnings).toEqual([
      "Przeglądarka nie zapisała tego wyboru — zostaje tak, jak było.",
    ]);
  });
});

describe("which way a fight went, from the reader's seat", () => {
  const roster = composeCombatantRoster([
    { id: 1, name: "A", side: 1, profession: null, level: null, maximumHealth: null },
    { id: 2, name: "B", side: 2, profession: null, level: null, maximumHealth: null },
  ]);

  test("is won where our side is named among the winners", () => {
    expect(getFightOutcome(roster, 1, { wonNames: ["A"], lostNames: ["B"], isDrawn: false })).toBe(
      "won",
    );
    expect(getFightOutcome(roster, 2, { wonNames: ["A"], lostNames: ["B"], isDrawn: false })).toBe(
      "lost",
    );
  });

  /** The one answer that needs no seat: the game states it by naming nobody. */
  test("is a draw for everybody, even where nothing says which side is ours", () => {
    expect(getFightOutcome(roster, null, { wonNames: [], lostNames: [], isDrawn: true })).toBe(
      "drawn",
    );
  });

  test("is nothing where nothing places the reader in the fight", () => {
    expect(getFightOutcome(roster, null, { wonNames: ["A"], lostNames: ["B"], isDrawn: false })).toBeNull();
    expect(getFightOutcome(roster, 3, { wonNames: ["A"], lostNames: ["B"], isDrawn: false })).toBeNull();
    expect(getFightOutcome(roster, 1, null)).toBeNull();
  });
});
