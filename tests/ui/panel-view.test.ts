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
import { assertDefined } from "@/libs/assert.ts";
import { composeIntegerText, getIntegerFromText } from "@/libs/number.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { composeFigureText } from "@/src/ui/panel-figure-text.ts";
import {
  PANEL_METRICS,
  PANEL_TEAMS,
  type PanelMetric,
} from "@/src/ui/panel-metric.ts";
import type { PanelReading } from "@/src/ui/panel-reading.ts";
import type { PanelRow, PanelView } from "@/src/ui/panel-shape.ts";
import { composeDefaultState, type PanelState } from "@/src/ui/panel-state.ts";
import { composePanelView } from "@/src/ui/panel-view.ts";
import { CAPTURED_FIGHTS, composeRosterOfFight, getMessagesOfFight, } from "@/tests/captured-fight-catalog.ts";

/**
 * A fight with two sides, a healer, a tick of poison and one unreadable message.
 *
 * Hand-written rather than captured, because the point of most of these is a
 * shape the material happens not to contain — a combatant who did nothing, a
 * side with one member, a heal that names its caster.
 */
function composeReading(overrides: Partial<PanelReading> = {}): PanelReading {
  const roster = composeCombatantRoster([
    { id: 1, name: "mag", side: 1, profession: "m", level: 105 },
    { id: 2, name: "łowca", side: 1, profession: "h", level: 93 },
    { id: 4, name: "tarcza", side: 1, profession: "w", level: 120 },
    { id: 3, name: "coś dużego", side: 2, profession: null, level: null },
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
        // Regeneration: nothing announced it, so nobody can be credited with it.
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

function composeState(overrides: Partial<PanelState> = {}): PanelState {
  return { ...composeDefaultState(), ...overrides };
}

function getEveryRow(view: PanelView): PanelRow[] {
  return [...view.lists.flatMap((list) => list.rows), ...(view.pinnedRow === null ? [] : [view.pinnedRow])];
}

/**
 * What this screen divides by, as a number, read back off the summary.
 *
 * The view states the whole in exactly one place — `My + Oni + Bez strony`, the
 * three parts every bracket on the screen is a share of. Reading it here rather
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
   */
  test("keeps a combatant who has done nothing", () => {
    const view = composePanelView(composeReading(), composeState());

    expect(view.lists[0]!.rows.map((row) => row.label)).toContain("tarcza");
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
      { id: 1, name: "mag", side: 1, profession: "m", level: 105 },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null },
    ]);
    const reading: PanelReading = {
      statistics: composeFightStatistics(
        decodeFight(
          [
            "1=90.00;3=50.00;tspell=Kula ognia;skillId=7",
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
 * Where the figure with no actor already sits among the rows — written out here
 * rather than imported, so the guard states the claim instead of agreeing with
 * whatever the view currently believes (§7.5).
 *
 * A blow with no actor is on nobody's *given* row, so under `Zadane` and
 * `Leczenie dane` it is a figure of its own. The health it moved landed on
 * somebody, so under `Otrzymane` and `Leczenie` it is already counted there and
 * adding it again would double it.
 */
const IS_PINNED_INSIDE_ROWS: Record<PanelMetric, boolean> = {
  dealt: false,
  taken: true,
  healingGiven: false,
  healed: true,
};

/**
 * Whether the pinned row states a share **under a side filter** — written out
 * per metric for the same reason the table above is, and because the compiler
 * counting the rows is what makes a fifth screen ask the question rather than
 * inherit an answer.
 *
 * It is the negation of `IS_PINNED_INSIDE_ROWS` and deliberately not spelled as
 * one: that table says where the figure sits, this one says whether the
 * denominator contains it, and a future screen could break the coincidence.
 */
const HAS_PINNED_SHARE_UNDER_FILTER: Record<PanelMetric, boolean> = {
  dealt: true,
  taken: false,
  healingGiven: true,
  healed: false,
};

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

      expect(view.pinnedRow?.label).toBe("Bez sprawcy");
      expect(view.pinnedRow?.isDrillable).toBe(false);
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
      view.pinnedRow?.detail.map((line) => (line.kind === "stat" ? "" : line.text)).join(" "),
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
    expect(view.pinnedRow?.valueText).toBe("60");
    expect(victim?.detail.map((line) => (line.kind === "stat" ? line.label : ""))).toContain(
      "  bez sprawcy",
    );
  });

  test("keeps the whole fight's scope under a side filter, and says so", () => {
    const view = composePanelView(composeReading(), composeState({ team: "mine" }));

    expect(
      view.pinnedRow?.detail.map((line) => (line.kind === "stat" ? "" : line.text)).join(" "),
    ).toContain("Z całej walki");
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
      { id: 1, name: "mag", side: 1, profession: "m", level: 105 },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null },
      { id: 5, name: "coś mniejszego", side: 2, profession: null, level: null },
    ]);
    const statistics = composeFightStatistics(
      decodeFight(
        [
          "1=90.00;3=50.00;tspell=Kula ognia;skillId=7",
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
   */
  test("a cross-section of one row is not drawn at all", () => {
    const view = composePanelView(composeReading(), composeState({ focusCombatantId: 1 }));

    expect(view.lists.map((list) => list.heading)).toEqual(["KOMU"]);
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
    expect(view.lists[0]!.rows.map((row) => row.label)).toEqual(["Kula ognia", "Zwykły cios"]);
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
      { id: 1, name: "mag", side: 1, profession: "m", level: 105 },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null },
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
      { id: 1, name: "mag", side: 1, profession: "m", level: 105 },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null },
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
      { id: 1, name: "mag", side: 1, profession: "m", level: 105 },
      { id: 2, name: "łowca", side: 1, profession: "h", level: 93 },
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

  test("a combatant the roster cannot place is added on, not folded in", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105 },
      { id: 2, name: "łowca", side: 1, profession: "h", level: 93 },
    ]);
    // Id 3 fights and is in no roster, so it has no side to be counted under.
    const reading = composeReading({
      roster,
      statistics: composeFightStatistics(
        decodeFight(["1=90.00;3=50.00;+dmg=500;-dmg=400"], roster),
        roster,
      ),
    });

    expect(getTitle(reading)).toBe("1 +1");
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
      { id: 1, name: "mag", side: 1, profession: "m", level: 105 },
      { id: 4, name: "tarcza", side: 1, profession: "w", level: 120 },
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
    const strings: string[] = [];

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

describe("against the captured fights", () => {
  const fights = CAPTURED_FIGHTS.map((fight) => {
    const roster = composeRosterOfFight(fight);
    const statistics = composeFightStatistics(
      decodeFight(
        getMessagesOfFight(fight),
        roster,
      ),
      roster,
    );
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
   * Everyone the aggregate counted is on the screen, in every metric and every
   * filter that should hold them.
   *
   * ⚠️ **Written because the shape it guards was once false.** A combatant the
   * roster could not place was counted and then dropped from the panel. Counting
   * rows against the aggregate rather than naming the bucket keeps that from
   * coming back through a bucket nobody has added yet.
   */
  test.each(fights)("$name draws everyone it counted", ({ reading }) => {
    const drawn = composePanelView(reading, composeState()).lists[0]!.rows.map((row) => row.label);
    const counted = [...reading.statistics.byCombatantId.keys()].map(
      (id) => reading.roster.byId.get(id)?.name ?? `#${id}`,
    );

    expect(drawn.length).toBe(counted.length);
    for (const name of counted) expect(drawn).toContain(name);
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
    const inGiven = composePanelView(reading, composeState({ metric: given })).pinnedRow;
    const inReceived = composePanelView(reading, composeState({ metric: received })).pinnedRow;

    // Both or neither, checked before the figures: a direction that simply stops
    // drawing the row would otherwise pass this by having nothing to disagree
    // with, which is how the missing screen survived until now.
    expect(inGiven === null).toBe(inReceived === null);
    if (inGiven === null || inReceived === null) return;

    // ⚠️ The figures being equal is structural, not measured: `getPinnedValue`
    // branches on the noun alone, so both directions reach it down one arm and
    // could not disagree. Kept because it is cheap and would catch a direction
    // gaining its own reading, but the balance itself is the test below.
    expect(inGiven.valueText).toBe(inReceived.valueText);
    expect(inGiven.bracketText).toBe(inReceived.bracketText);
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
   * plus whatever no row holds, which is `getWholeOnScreen` under no filter. The
   * two directions reach it by different arms of `getMetricValue` and different
   * arms of `getFigureOutsideRows`, so their agreement is a measurement.
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
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105 },
      { id: 3, name: "coś dużego", side: 2, profession: null, level: null },
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
    const reading = { statistics, roster, ourSide: 1, isFromFightStart: true } satisfies PanelReading;

    // Read, not assumed: if a later round makes these resolve, the fight stops
    // being the one this test is for and says so here rather than passing.
    expect(statistics.unattributed.dealtApplied).toBe(400);
    expect(statistics.unattributed.taken).toBe(200);

    expect(getWholeFromSummary(composePanelView(reading, composeState({ metric: "dealt" })))).toBe(600);
    expect(getWholeFromSummary(composePanelView(reading, composeState({ metric: "taken" })))).toBe(600);
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
      const pinned = IS_PINNED_INSIDE_ROWS[metric] ? [] : [view.pinnedRow ?? []].flat();
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
   * ⚠️ **Every bracket on a screen divides by the same figure.**
   *
   * The ranking used to divide by the ranking and the pinned row by the ranking
   * plus itself — two denominators, printed identically. Under `Zadane` it showed
   * as rows adding to 107% and nobody noticed; under `Leczenie dane` as a ranking
   * summing to 100% beside a row saying 79%.
   *
   * Checked by working backwards: a figure and its rounded share imply a range the
   * denominator must lie in, and every row's range has to overlap every other's.
   * That way the test never needs to know what the whole *is* — only that there is
   * one of it, which is the property that broke.
   */
  test.each(fights)("$name divides every share by one and the same whole", ({ reading }) => {
    for (const metric of PANEL_METRICS) {
      for (const team of PANEL_TEAMS) {
        const view = composePanelView(reading, composeState({ metric, team }));
        const drawn = [
          ...view.lists.flatMap((list) => list.rows),
          ...(view.pinnedRow === null ? [] : [view.pinnedRow]),
        ];

        let low = 0;
        let high = Number.POSITIVE_INFINITY;
        for (const row of drawn) {
          // A row with no bracket states no whole, so it bounds nothing here.
          // Which rows those are is held next door, not by silence in this loop.
          if (row.bracketText === null) continue;
          const value = getIntegerFromText(row.valueText.replace(/\s/g, ""));
          const percent = getIntegerFromText(row.bracketText.replace(/[()%]/g, ""));
          expect(value, row.valueText).not.toBeNull();
          expect(percent, row.bracketText).not.toBeNull();
          if (value === null || percent === null) continue;
          // A share that rounded to zero bounds nothing, and a figure of zero
          // divides by anything — neither says which whole was used.
          if (value <= 0 || percent <= 0) continue;
          low = Math.max(low, (value * 100) / (percent + 0.5));
          high = Math.min(high, (value * 100) / (percent - 0.5));
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
          ...(view.pinnedRow === null ? [] : [view.pinnedRow]),
        ];

        for (const row of drawn) {
          if (row.bracketText === null) continue;
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
        const pinned = composePanelView(reading, composeState({ metric, team })).pinnedRow;
        if (pinned === null || pinned.bracketText === null) continue;
        const value = getIntegerFromText(pinned.valueText.replace(/\s/g, ""));
        if (value === null || value <= 0) continue;
        expect(pinned.bracketText, `${metric} ${team}`).not.toBe("(0%)");
      }
    }
  });

  /**
   * Which screens state a share at all, held against a table rather than against
   * whatever the view does. The bracket goes when the figure is not inside the
   * denominator — a received direction under a side filter — and stays everywhere
   * else, including `Wszyscy`, where the two cuts overlap on purpose and the row
   * says so in words.
   */
  test.each(fights)("$name states the pinned share exactly where there is one", ({ reading }) => {
    for (const metric of PANEL_METRICS) {
      for (const team of PANEL_TEAMS) {
        const pinned = composePanelView(reading, composeState({ metric, team })).pinnedRow;
        if (pinned === null) continue;
        const expected = team === "all" || HAS_PINNED_SHARE_UNDER_FILTER[metric];
        expect(pinned.bracketText !== null, `${metric} ${team}`).toBe(expected);
      }
    }
  });

  test.each(fights)("$name never draws a bar past the end of its track", ({ reading }) => {
    for (const metric of PANEL_METRICS) {
      for (const team of PANEL_TEAMS) {
        const view = composePanelView(reading, composeState({ metric, team }));
        const drawn = [
          ...view.lists.flatMap((list) => list.rows),
          ...(view.pinnedRow === null ? [] : [view.pinnedRow]),
        ];
        if (drawn.length === 0) continue;

        for (const row of drawn) {
          expect(row.fill, `${metric} ${team} ${row.label}`).toBeLessThanOrEqual(1);
        }
        // And the scale is still tight: something on screen reaches the end, or
        // clamping every bar would pass this while measuring against nothing.
        expect(drawn.some((row) => row.fill === 1), `${metric} ${team}`).toBe(true);
      }
    }
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
    const pinned = assertDefined(view.pinnedRow, "the pinned row is drawn");

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
    { id: 1, name: "mag", side: 1, profession: "m", level: 105 },
    { id: 3, name: "coś dużego", side: 2, profession: null, level: null },
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
      ["Nie wiadomo, w kogo", "400"],
    ]);
  });

  test("still closes the deep level against the skill it was entered from", () => {
    const view = composePanelView(
      reading,
      composeState({ metric: "dealt", focusCombatantId: 1, focusSkill: { ownerId: 1, key: "9" } }),
    );

    expect(view.lists[0]?.totalText).toBe("700");
    expect(view.lists[0]?.rows.at(-1)?.label).toBe("Nie wiadomo, w kogo");
  });

  /**
   * The row says what is not known, never why our reader cannot know it (§3) —
   * and it is a different sentence from the received directions' on purpose:
   * there nobody swung, here somebody did.
   */
  test("says what is missing without naming anything of ours", () => {
    const view = composePanelView(reading, composeState({ metric: "dealt", focusCombatantId: 1 }));
    const missing = view.lists.flatMap((list) => list.rows).find((row) => row.key === "nobody");

    expect(missing?.detail).toEqual([
      { kind: "note", text: "Gra nie mówi, w kogo — wiadomo tylko, że cios wszedł." },
    ]);
    for (const forbidden of ["roster", "skład", "protok", "klucz", "null", "id"]) {
      expect(`${missing?.label} ${composeJsonText(missing?.detail)}`, forbidden).not.toContain(forbidden);
    }
  });
});

describe("every sentence the panel says", () => {
  const OURS = [
    "  bez sprawcy",
    "  z ciosów",
    "Bez sprawcy",
    "Bez strony",
    "CZYM (UMIEJĘTNOŚCI)",
    "Cała walka · My / Oni",
    "Cios, przed którym nie stała żadna umiejętność. Gra nie odróżnia go od dodatkowego zamachu, który sama jej dała.",
    "Część tej walki nie dotarła do panelu — liczby są zaniżone.",
    "Część leczenia w tej walce jest bez sprawcy — nie da się sprawdzić, czy któreś z niego jest jej.",
    "Część obrażeń w tej walce jest bez sprawcy — nie da się sprawdzić, czy któreś z nich są jej.",
    "Gra nie mówi, kto leczył — wiadomo tylko, komu życia przybyło.",
    "Gra nie mówi, kto to zadał — wiadomo tylko, że życia ubyło.",
    "KOMU",
    "Komu",
    "LPM — rozbicie · PPM — powrót",
    "Leczenie",
    "Leczenie dane",
    "My",
    "My / Oni",
    "Nic jej nie ubyło.",
    "Nic nie zapowiedziało tego leczenia, więc gra nie mówi, co je dało.",
    "Nie ma czego pokazać.",
    "Nie wiadomo, czym",
    "Nie zadała nikomu obrażeń.",
    "Nikogo nie leczyła.",
    "Nikt jej nie leczył.",
    "Nikt tego nie ma na swoim wierszu — dlatego stoi osobno.",
    "OD CZEGO",
    "OD KOGO",
    "Obrażenia",
    "Oni",
    "Otrzymane",
    "Panel wpiął się w trakcie tej walki — to nie są jej pełne liczby.",
    "TYP OBRAŻEŃ",
    "Te obrażenia są już policzone wyżej, u tych, którym ubyło życia.",
    "To leczenie jest już policzone wyżej, u tych, którzy je dostali.",
    "Użycia umiejętności",
    "Wszyscy",
    "Z całej walki — bez sprawcy nie ma czego przypisać do strony.",
    "Z czego",
    "Zadane",
    "Zwykły cios",
    "dane",
    "fizyczne",
    "leczenie",
    "leczenie na wskazanego",
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
