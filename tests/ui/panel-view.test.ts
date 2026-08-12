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
import { assertDefined } from "@/libs/assert.ts";
import { composeIntegerText, getIntegerFromText } from "@/libs/number.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import {
  composeDefaultState,
  composePanelView,
  PANEL_METRICS,
  PANEL_TEAMS,
  type PanelReading,
  type PanelRow,
  type PanelState,
  type PanelView,
} from "@/src/ui/panel-view.ts";
import { CAPTURED_FIGHTS, composeRosterOfFight } from "@/tests/captured-fight-catalog.ts";

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
        "1=90.00;4=80.00;tspell=Leczenie ran;skillId=7",
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

/** Every string the panel would put on screen for this view. */
function getEveryString(view: PanelView): string[] {
  return [
    view.title,
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
      row.bracketText,
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
    expect(rows.map((row) => row.canDrill)).toEqual([true, true, true, true]);
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

describe("what nobody can be charged with", () => {
  /**
   * Health that fell without a blow is real damage with no attacker. It cannot
   * sit on a row, and dropping it would take 13% of what hit the boss in the
   * group capture off the screen.
   */
  test("stands under the list, in its own row, for dealt and for healed", () => {
    const dealt = composePanelView(composeReading(), composeState());
    const healed = composePanelView(composeReading(), composeState({ metric: "healed" }));

    expect(dealt.pinnedRow?.label).toBe("Bez sprawcy");
    expect(dealt.pinnedRow?.canDrill).toBe(false);
    expect(healed.pinnedRow?.label).toBe("Bez sprawcy");
  });

  /**
   * Not under `Otrzymane`: there the victim is always named, so the figure sits
   * on their row instead — and it is the same 60 points either way.
   */
  test("is part of the victim's own figure under taken", () => {
    const view = composePanelView(composeReading(), composeState({ metric: "taken" }));
    const victim = view.lists[0]!.rows.find((row) => row.label === "coś dużego");

    expect(view.pinnedRow).toBeNull();
    // 400 + 100 from the blows, and 60 that fell on its own.
    expect(victim?.valueText).toBe("560");
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
   */
  /**
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
    expect(second.lists[0]?.rows.map((row) => row.label)).toEqual(["Leczenie ran"]);
  });

  test("a leaf offers no way further in", () => {
    const view = composePanelView(
      composeReading(),
      composeState({ focusCombatantId: 1, focusTargetId: 3 }),
    );

    expect(view.lists[0]?.rows.every((row) => !row.canDrill)).toBe(true);
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
  ];

  test("carry no word from the code and no key from the game", () => {
    const strings: string[] = [];

    for (const reading of [composeReading()]) {
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

describe("against the captured fights", () => {
  const fights = CAPTURED_FIGHTS.map((fight) => {
    const roster = composeRosterOfFight(fight);
    const statistics = composeFightStatistics(
      decodeFight(
        fight.dump.calls.flatMap((call) => call.protocolMessages),
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
        /**
         * No turn axis, which is what two of the three captures actually give.
         *
         * It used to say one turn per combatant — a number nobody measured, put
         * there so the field could be filled. These tests are about what a
         * breakdown adds up to, and a fabricated divisor cannot help them: it can
         * only make a rate look checked when the only thing checked was the
         * arithmetic of a figure nobody read off a capture.
         */
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
   * captures it exceeded it under `Leczenie` in five of seven, up to 1.56, and
   * `.row { overflow: hidden }` clips that into a bar indistinguishable from a
   * full one: the row that says *something here is missing* drawn as the largest
   * thing in the fight.
   */
  /**
   * ⚠️ **The share was halved under `Leczenie`, and nothing said so.**
   *
   * Healing nobody announced still lands on somebody, so it is already counted on
   * the receiver's row; the pinned row marks it rather than adding it. Dividing by
   * "the ranking plus this" therefore counted it twice — 44% reported against the
   * 79% it is on the group capture. Under `Leczenie dane` the same points really
   * are outside the ranking, so the two directions must arrive at **one** share of
   * one whole. They are the same missing healing measured the same way.
   */
  test.each(fights)("$name reports one share for the healing nobody announced", ({ reading }) => {
    const given = composePanelView(reading, composeState({ metric: "healingGiven" })).pinnedRow;
    const received = composePanelView(reading, composeState({ metric: "healed" })).pinnedRow;
    if (given === null || received === null) return;

    expect(given.valueText).toBe(received.valueText);
    expect(given.bracketText).toBe(received.bracketText);
  });

  /**
   * ⚠️ **These figures used to be one `·`-joined line with no heading.**
   *
   * Points of armour, percentage points of resistance and absorbed damage stood
   * in one string, which reads as one list of comparable things and invites the
   * addition §10 forbids. They are two blocks now, each labelled, and the unit
   * rides in the value of the one that is not in points.
   */
  /**
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
