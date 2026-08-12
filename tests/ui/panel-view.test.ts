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
import { composeIntegerText } from "@/libs/number.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import {
  composeDefaultState,
  composePanelView,
  PANEL_METRICS,
  PANEL_RATES,
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
    turnsByCombatantId: new Map([
      [1, 2],
      [2, 1],
      [3, 1],
    ]),
    fightTurns: 4,
    turnsWithoutActor: 0,
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
    ...view.rateTabs.map((tab) => tab.label),
    ...view.metricTabs.map((tab) => tab.label),
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

  test("the bracket carries the share and the other measure", () => {
    const view = composePanelView(composeReading(), composeState());

    expect(view.lists[0]!.rows[0]!.bracketText).toMatch(/^\(\d+% · [\d ,]+\/t\)$/);
  });

  test("under a rate the bracket carries the total instead", () => {
    const view = composePanelView(composeReading(), composeState({ rate: "ownTurn" }));

    expect(view.lists[0]!.rows[0]!.valueText).toMatch(/\/t$/);
    expect(view.lists[0]!.rows[0]!.bracketText).toMatch(/^\(\d+% · [\d ]+\)$/);
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
      turnsByCombatantId: new Map([[1, 2]]),
      fightTurns: 2,
      turnsWithoutActor: 0,
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
  test("opens who, with what, and of what", () => {
    const view = composePanelView(composeReading(), composeState({ focusCombatantId: 1 }));

    expect(view.lists.map((list) => list.heading)).toEqual([
      "KOMU",
      "CZYM (UMIEJĘTNOŚCI)",
      "TYP OBRAŻEŃ",
    ]);
    expect(view.crumb?.backLabel).toBe("‹ skład");
    expect(view.crumb?.hereLabel).toBe("mag");
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
    const view = composePanelView(composeReading(), composeState({ focusCombatantId: 1 }));
    const skills = view.lists.find((list) => list.heading === "CZYM (UMIEJĘTNOŚCI)");
    const plain = skills?.rows.find((row) => row.label === "Zwykły cios");

    expect(plain).toBeDefined();
    // One blow in the fixture carries no announcement over it.
    expect(plain?.bracketText).toContain("×1");
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
      turnsByCombatantId: new Map([[1, 1]]),
      fightTurns: 1,
      turnsWithoutActor: 0,
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
          turnsByCombatantId: new Map([[1, 1]]),
          fightTurns: 1,
          turnsWithoutActor: 0,
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
      turnsByCombatantId: new Map([[1, 1]]),
      fightTurns: 1,
      turnsWithoutActor: 0,
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

describe("na turę", () => {
  /**
   * ⚠️ **Two divisors on one screen, and it is not a mistake.** The mage's rate
   * is what they dealt over the two turns *they* took; the poison's is what it
   * did over the fight's four, because there is nobody whose turns it could be
   * divided by — which is the rule `getDivisor` states for a figure with no
   * combatant behind it.
   *
   * The bar still measures against the ranking's scale rather than its own, or
   * the row saying something is missing would draw full width whatever it came
   * to.
   */
  test("what nobody can be charged with divides by the fight, not by anyone's turns", () => {
    const view = composePanelView(composeReading(), composeState({ rate: "ownTurn" }));

    expect(view.pinnedRow?.valueText).toBe("15,0/t");
    expect(view.lists[0]!.rows[0]!.valueText).toBe("200,0/t");
    expect(view.pinnedRow?.fill).toBeCloseTo(15 / 200, 5);
  });

  /**
   * The switch has to mean the same thing at every level. A rate in the ranking
   * over totals in the breakdown is two questions answered on one screen with
   * nothing saying which is which.
   */
  test("divides the ranking, the breakdown, its total and the side summary", () => {
    const totals = composePanelView(composeReading(), composeState({ focusCombatantId: 1 }));
    const rates = composePanelView(
      composeReading(),
      composeState({ focusCombatantId: 1, rate: "ownTurn" }),
    );

    expect(totals.lists[0]!.totalText).not.toContain("/t");
    expect(rates.lists[0]!.totalText).toContain("/t");
    expect(rates.lists[0]!.rows.every((row) => row.valueText.endsWith("/t"))).toBe(true);

    const sides = composePanelView(composeReading(), composeState({ rate: "ownTurn" })).sides;
    expect(sides?.mineText).toContain("/t");
    expect(sides?.enemyText).toContain("/t");
  });

  /**
   * ⚠️ **The metric no longer picks the divisor, the reader does.**
   *
   * This replaces a test that guarded the opposite: dealt divided by the
   * combatant's own turns and taken by the fight's, under one button labelled
   * only `na turę`. Both figures were defensible and neither was named, so one
   * switch meant two things on one screen. The mage struck 400 over the two turns
   * they took; the thing they were fighting took 560 over the one turn it took and
   * over the fight's four — now the divisor is a choice and every metric follows it.
   */
  test("na turę postaci divides every metric by that combatant's own turns", () => {
    const dealt = composePanelView(composeReading(), composeState({ rate: "ownTurn" }));
    expect(dealt.lists[0]!.rows[0]!.valueText).toBe("200,0/t");

    const taken = composePanelView(
      composeReading(),
      composeState({ rate: "ownTurn", metric: "taken" }),
    );
    const victim = taken.lists[0]!.rows.find((row) => row.label === "coś dużego");
    expect(victim?.valueText).toBe("560,0/t");
  });

  test("na turę walki divides every metric by the fight's turns", () => {
    const dealt = composePanelView(composeReading(), composeState({ rate: "fightTurn" }));
    expect(dealt.lists[0]!.rows[0]!.valueText).toBe("100,0/t");

    const taken = composePanelView(
      composeReading(),
      composeState({ rate: "fightTurn", metric: "taken" }),
    );
    const victim = taken.lists[0]!.rows.find((row) => row.label === "coś dużego");
    expect(victim?.valueText).toBe("140,0/t");
  });

  /**
   * A combatant the turn axis says nothing about has no rate — and a rate of zero
   * would put them at the bottom of the ranking as if they had acted and achieved
   * nothing. Zero and unknown are two sentences (§9.6), and the bar goes to zero
   * because a bar cannot say "unknown" at all.
   */
  test("a combatant with no turns of their own gets a mark, not a zero", () => {
    const reading = composeReading({ turnsByCombatantId: new Map([[2, 1]]), fightTurns: 4 });
    const view = composePanelView(reading, composeState({ rate: "ownTurn" }));
    const mage = view.lists[0]!.rows.find((row) => row.label === "mag");

    expect(mage?.valueText).toBe("—/t");
    expect(mage?.fill).toBe(0);
  });

  /**
   * ⚠️ **One unknown rate must not take every bar with it.** The bar scale is the
   * largest figure on screen, and `Math.max(most, NaN)` is `NaN` — so a single
   * combatant the axis cannot serve would blank the whole panel.
   */
  test("the bar scale ignores a row whose rate cannot be computed", () => {
    const reading = composeReading({ turnsByCombatantId: new Map([[2, 1]]), fightTurns: 4 });
    const rows = composePanelView(reading, composeState({ rate: "ownTurn" })).lists[0]!.rows;

    expect(rows.every((row) => Number.isFinite(row.fill))).toBe(true);
    expect(Math.max(...rows.map((row) => row.fill))).toBeCloseTo(1, 5);
  });

  /**
   * ⚠️ **A side's turns are counted, never derived from the other side's.**
   *
   * The arithmetic this replaces was `fightTurns − mineTurns`, which handed the
   * enemy every turn nobody was named for and every turn of a combatant the
   * roster could not place — deflating their rate by exactly that much. Here the
   * fight ran 10 turns, our side took 3 of them and theirs took 1, and the other 6
   * belong to nobody: subtracting would divide what the enemy took by 7 instead of
   * by 1, and report 80,0/t where the truth is 560,0/t.
   */
  test("each side divides by its own turns, not by the fight less the other's", () => {
    const reading = composeReading({
      turnsByCombatantId: new Map([
        [1, 2],
        [2, 1],
        [3, 1],
      ]),
      fightTurns: 10,
      turnsWithoutActor: 6,
    });
    const ownTurn = composeState({ rate: "ownTurn" });

    // 500 dealt over the three turns our side took, not over the fight's ten.
    expect(composePanelView(reading, ownTurn).sides?.mineText).toBe("166,7/t");
    expect(composePanelView(reading, { ...ownTurn, metric: "taken" }).sides?.enemyText).toBe(
      "560,0/t",
    );
  });

  /**
   * Both captured solo fights arrive in one payload, so the game states one turn
   * ordinal and never another. There is nothing to divide by, and §9.6 says a
   * number that might be wrong must never look like one that is right — so the
   * panel offers no rate and says why rather than dividing by a substituted 1.
   */
  test("a fight the game never numbered offers no rate and says so", () => {
    const reading = composeReading({
      fightTurns: null,
      turnsByCombatantId: new Map(),
      turnsWithoutActor: 0,
    });
    // The choice outlives a fight, so this is the state a reader actually arrives
    // in — having picked a rate in the fight before.
    const view = composePanelView(reading, composeState({ rate: "fightTurn" }));

    expect(view.rateTabs.map((tab) => tab.isEnabled)).toEqual([true, false, false]);
    expect(view.rateTabs.find((tab) => tab.isSelected)?.rate).toBe("total");
    expect(view.lists[0]!.rows.every((row) => !row.valueText.includes("/t"))).toBe(true);
    expect(view.warnings.some((one) => one.includes("tylko sumy"))).toBe(true);
    // The turn count on a row is a dash and not a zero: they certainly took some.
    const turnsLine = view.lists[0]!.rows[0]!.detail.find(
      (line) => line.kind === "stat" && line.label === "Tury",
    );
    expect(turnsLine).toEqual({ kind: "stat", label: "Tury", value: "—", isStrong: false });
  });

  /**
   * The warning belongs where the consequence is (§9.6), and under `Sumy` nothing
   * divides — so there is no consequence and no sentence.
   */
  test("turns nobody was seen taking are warned about only under a rate", () => {
    const reading = composeReading({ turnsWithoutActor: 2 });
    const hasWarning = (state: PanelState) =>
      composePanelView(reading, state).warnings.some((one) =>
        one.includes("nie widać, kto działał"),
      );

    expect(hasWarning(composeState({ rate: "ownTurn" }))).toBe(true);
    expect(hasWarning(composeState({ rate: "fightTurn" }))).toBe(true);
    expect(hasWarning(composeState())).toBe(false);
  });

  test("the share and the side bar stay on raw sums", () => {
    const totals = composePanelView(composeReading(), composeState());
    const rates = composePanelView(composeReading(), composeState({ rate: "ownTurn" }));

    expect(rates.sides?.mineShare).toBe(totals.sides?.mineShare);
    expect(rates.lists[0]!.rows[0]!.bracketText.startsWith("(83%")).toBe(
      totals.lists[0]!.rows[0]!.bracketText.startsWith("(83%"),
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
  ];

  test("carry no word from the code and no key from the game", () => {
    const strings: string[] = [];

    // Both readings, because the sentences a fight with no turn axis produces are
    // reachable from no other state — and a warning is exactly the kind of string
    // that starts explaining the reader our own problem.
    for (const reading of [
      composeReading(),
      composeReading({ fightTurns: null, turnsByCombatantId: new Map(), turnsWithoutActor: 0 }),
      composeReading({ turnsWithoutActor: 2 }),
    ]) {
      for (const metric of PANEL_METRICS) {
        for (const team of PANEL_TEAMS) {
          for (const rate of PANEL_RATES) {
            const base = composeState({ metric, team, rate });
            strings.push(...getEveryString(composePanelView(reading, base)));
            for (const focusCombatantId of reading.statistics.byCombatantId.keys()) {
              const inside = composeState({ metric, team, rate, focusCombatantId });
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
        turnsByCombatantId: new Map(),
        fightTurns: null,
        turnsWithoutActor: 0,
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

  /**
   * Under a rate the biggest total is not the biggest figure: somebody who acted
   * twice can out-rate the row above them, and a bar measured against the total
   * would run past the end of its own row.
   */
  test("a rate measures against the biggest rate, not the biggest total", () => {
    const view = composePanelView(composeReading(), composeState({ rate: "ownTurn" }));

    for (const row of view.lists[0]!.rows) expect(row.fill).toBeLessThanOrEqual(1);
    expect(view.lists[0]!.rows.some((row) => row.fill === 1)).toBe(true);
  });
});
