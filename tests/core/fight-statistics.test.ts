/**
 * What the aggregate is allowed to do with the events it is handed.
 *
 * Two halves, and the second is the one worth writing. The captured fights
 * exercise the ordinary path — real totals, real elements, real defences. They
 * exercise **none** of the paths where the protocol names nobody: measured, both
 * captures resolve every side and every name, so `unattributed` stays empty on
 * real material. Those cases are built here by hand rather than left untested,
 * because "shown, never guessed" (§5) is exactly the rule that has no evidence
 * behind it until the day it does.
 *
 * **What is deliberately absent: a fight-scale check against the snapshots.**
 * It was attempted and the material will not carry it, for two reasons that are
 * both about the game rather than about this file:
 *
 *   - health stops at zero, so a killing blow is accounted in full while the
 *     snapshot can only show the health there was. Measured on the boar fight,
 *     where both boars die: 834 accounted against 745 lost, and 1119 against
 *     763. The excess is overkill, not over-counting.
 *   - healing we do not read swamps everything else over a long fight. In the
 *     group fight the players end near full health after 20–38k accounted
 *     damage each; `healall_per` is the known cause and the register already
 *     states why it cannot be read without a roster side.
 *
 * The per-call version of this comparison is
 * `tests/core/health-witness.test.ts`, which handles both by skipping what it
 * cannot add. Repeating it here at fight scale would either duplicate that or
 * need a tolerance wide enough to prove nothing. What this file holds instead is
 * the invariant the aggregate itself owns: every figure landed is also a figure
 * taken.
 */

import { describe, expect, test } from "bun:test";
import { composeIntegerText, getFiniteNumberFromValue } from "@/libs/number.ts";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import {
  composeFightStatistics,
  type CombatantStatistics,
  type SideStatistics,
} from "@/src/core/fight-statistics.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterOfFight,
  type CapturedFight,
} from "@/tests/captured-fight-catalog.ts";

function getStatisticsOf(fight: CapturedFight) {
  const roster = composeRosterOfFight(fight);
  return composeFightStatistics(
    decodeFight(
      fight.dump.calls.flatMap((call) => call.protocolMessages),
      roster,
    ),
    roster,
  );
}

function getEventsOf(fight: CapturedFight): BattleEvent[] {
  return decodeFight(
    fight.dump.calls.flatMap((call) => call.protocolMessages),
    composeRosterOfFight(fight),
  );
}

const FROM_CAPTURES = CAPTURED_FIGHTS.map((fight) => ({
  name: fight.name,
  statistics: getStatisticsOf(fight),
  events: getEventsOf(fight),
}));

function getEveryRow(statistics: ReturnType<typeof composeFightStatistics>): CombatantStatistics[] {
  return [...statistics.byCombatantId.values(), statistics.unattributed];
}

const ATTACK_ON_NOBODY: BattleEvent = {
  kind: "attack",
  announced: null,
  actorId: null,
  targetId: null,
  dealt: [{ damageType: "dmg", amount: 100 }],
  taken: [{ damageType: "dmg", amount: 60 }],
  prevented: [{ prevention: "absorb", amount: 40 }],
  procs: ["crit"],
  destroyed: [{ statistic: "acdmg", amount: 7 }],
  declared: [],
};

describe("the aggregate over captured fights", () => {
  test("the captures produce figures to check", () => {
    expect(FROM_CAPTURES.length).toBeGreaterThan(0);
    for (const { name, statistics } of FROM_CAPTURES) {
      expect(statistics.byCombatantId.size, name).toBeGreaterThan(0);
      const landed = getEveryRow(statistics).reduce((total, row) => total + row.taken, 0);
      expect(landed, name).toBeGreaterThan(0);
    }
  });

  /**
   * ⚠️ **The aggregate kept one outcome and the protocol states two.** The
   * `loser` message arrives after the `winner` message, so a single variable
   * held "lost" at the end of every fight ever recorded — including the boar
   * fight, which the player finished at full health with all three opponents
   * dead. Both fights carry exactly one of each message
   * (`tests/core/battle-event.test.ts`), so the material settles this: whoever
   * won has to survive the aggregate as well as the decoder.
   */
  test("both sides of the ending survive, and nobody is on both", () => {
    for (const { name, statistics } of FROM_CAPTURES) {
      const outcome = statistics.outcome;
      expect(outcome, name).not.toBeNull();
      if (outcome === null) continue;

      expect(outcome.wonNames.length, name).toBeGreaterThan(0);
      expect(outcome.lostNames.length, name).toBeGreaterThan(0);
      for (const winner of outcome.wonNames) {
        expect(outcome.lostNames, `${name}: ${winner}`).not.toContain(winner);
      }
    }
  });

  /**
   * One blow is one figure on two rows, so the two sides must balance exactly.
   * A conservation law rather than a spot check: it fails on any future change
   * that credits a striker without debiting a target, which is the shape a
   * double-counted total takes.
   */
  test("everything landed is also everything taken", () => {
    for (const { name, statistics } of FROM_CAPTURES) {
      const rows = getEveryRow(statistics);
      const landed = rows.reduce((total, row) => total + row.dealtApplied, 0);
      const taken = rows.reduce((total, row) => total + row.taken, 0);
      expect(landed, name).toBe(taken);
    }
  });

  /**
   * Why raw and applied are separate fields and not one. A combatant working
   * through `+oth_dmg` lands more than its raw column shows, because damage
   * stated against a name carries no raw figure at all — so the two are not
   * merely "before and after" of each other and cannot share a total.
   */
  test("raw and landed are different numbers, and the captures prove it", () => {
    const rows = FROM_CAPTURES.flatMap(({ statistics }) => [...statistics.byCombatantId.values()]);
    expect(rows.some((row) => row.dealtRaw > row.dealtApplied)).toBe(true);
    expect(rows.some((row) => row.dealtApplied > row.dealtRaw)).toBe(true);
  });

  // Units are not comparable, so the aggregate keeps the tokens apart. If these
  // ever collapse into one figure, the panel would show armour added to
  // percentage points.
  test("destroyed statistics stay keyed by their own token", () => {
    const withDestruction = FROM_CAPTURES.flatMap(({ statistics }) =>
      [...statistics.byCombatantId.values()].filter((row) => row.destroyed.size > 0),
    );
    expect(withDestruction.length).toBeGreaterThan(0);
    expect(withDestruction.some((row) => row.destroyed.size > 1)).toBe(true);
  });

  /**
   * §9.6: a total that might be too low has to be markable as such, which is
   * impossible if the aggregate forgets what it could not read. Both captures
   * carry unread keys, so this is measured rather than constructed.
   */
  /**
   * ⚠️ Both halves of this used to be measured on the captures, and one of them
   * has gone to zero: no message in either fight is unread any more. The path is
   * still worth guarding, so it is guarded on a message written for the purpose
   * — and the captures are held to the new truth rather than the old one.
   */
  test("what could not be read reaches the aggregate", () => {
    const invented = composeFightStatistics(decodeFight(["0;0;no_such_key=1"]));
    expect(invented.reading.unreadableMessages).toBe(1);
    expect(invented.reading.messagesByReason.size).toBe(1);
    expect(invented.reading.occurrencesByUnreadKey.get("no_such_key")).toBe(1);

    for (const { name, statistics } of FROM_CAPTURES) {
      expect(statistics.reading.unreadableMessages, name).toBe(0);
    }
  });

  /**
   * What the captures do still carry, and it is the stronger claim: healing that
   * reached a whole side, which the protocol reports without naming anyone it
   * healed. One fight has it and one does not, so both branches are real.
   */
  test("and health that moved where nobody can be credited is carried too", () => {
    const withTeamHeal = FROM_CAPTURES.filter(
      ({ statistics }) => statistics.reading.unaccountedHealthBySource.size > 0,
    );
    expect(withTeamHeal.length).toBeGreaterThan(0);
    for (const { name, statistics } of withTeamHeal) {
      expect(statistics.reading.unaccountedHealthBySource.get("healall_per"), name).toBeGreaterThan(
        0,
      );
    }
  });

  // Zero is a measurement; unknown is the absence of one. They are different
  // fields here so the panel can keep them apart on screen.
  test("a figure of zero and something unread are not the same thing", () => {
    const { statistics } = FROM_CAPTURES[0]!;
    const idle = [...statistics.byCombatantId.values()].find((row) => row.healed === 0);
    expect(idle).toBeDefined();
    expect(idle?.healed).toBe(0);

    const unread = composeFightStatistics(decodeFight(["0;0;no_such_key=1"]));
    expect(unread.reading.unreadableMessages).toBe(1);
    expect(unread.byCombatantId.size).toBe(0);
  });
});

describe("rows grouped by side", () => {
  test("both captures split into more than one side, with nobody left out", () => {
    for (const { name, statistics } of FROM_CAPTURES) {
      expect(statistics.bySide.size, name).toBeGreaterThan(1);
      expect(statistics.combatantIdsWithoutSide, name).toEqual([]);

      const grouped = [...statistics.bySide.values()].flatMap((side) => side.combatantIds);
      expect(grouped.length, name).toBe(statistics.byCombatantId.size);
      expect(new Set(grouped).size, name).toBe(grouped.length);
    }
  });

  // Recomputed from the members rather than trusted, so the totals cannot drift
  // from the rows they claim to add up.
  test("a side's totals are its members added together", () => {
    for (const { name, statistics } of FROM_CAPTURES) {
      for (const [side, group] of statistics.bySide) {
        const members = group.combatantIds.map((id) => statistics.byCombatantId.get(id));
        const taken = members.reduce((total, row) => total + (row?.taken ?? 0), 0);
        const landed = members.reduce((total, row) => total + (row?.dealtApplied ?? 0), 0);
        expect(group.totals.taken, `${name} side ${side}`).toBe(taken);
        expect(group.totals.dealtApplied, `${name} side ${side}`).toBe(landed);
      }
    }
  });

  /**
   * What one side lands is what the other takes — exactly, in both captures.
   *
   * The strongest evidence the grouping is coherent: a combatant filed on the
   * wrong side breaks it immediately, and no per-row check would notice.
   *
   * It **assumes nobody damages their own side**, which is true of this material
   * and is not a law of the game. A capture with area damage catching an ally
   * would fail here, and that is the intended outcome: the assumption is what
   * changed, and someone should look rather than have it absorbed silently.
   */
  test("what one side lands is what the other takes", () => {
    for (const { name, statistics } of FROM_CAPTURES) {
      const sides = [...statistics.bySide.values()];
      expect(sides.length, name).toBe(2);
      const [first, second] = sides as [SideStatistics, SideStatistics];
      expect(first.totals.dealtApplied, name).toBe(second.totals.taken);
      expect(second.totals.dealtApplied, name).toBe(first.totals.taken);
    }
  });

  /**
   * Without a roster there are no sides, and that has to be visible rather than
   * silent: a fight joined in progress still shows its rows, and the panel needs
   * to know it cannot group them.
   */
  test("no roster means no sides, and every combatant said to be unplaced", () => {
    const statistics = composeFightStatistics([{ ...ATTACK_ON_NOBODY, actorId: 7, targetId: 8 }]);

    expect(statistics.bySide.size).toBe(0);
    expect([...statistics.combatantIdsWithoutSide].sort()).toEqual([7, 8]);
    expect(statistics.byCombatantId.size).toBe(2);
  });

  // A roster that knows one combatant and not the other must not quietly file
  // the stranger anywhere.
  test("a combatant the roster never heard of is placed on no side", () => {
    const roster = composeCombatantRoster([{ id: 7, name: "known", side: 1, profession: null, level: null }]);
    const statistics = composeFightStatistics(
      [{ ...ATTACK_ON_NOBODY, actorId: 7, targetId: 8 }],
      roster,
    );

    expect([...statistics.bySide.keys()]).toEqual([1]);
    expect(statistics.bySide.get(1)?.combatantIds).toEqual([7]);
    expect(statistics.combatantIdsWithoutSide).toEqual([8]);
  });
});

describe("figures the log ties to nobody", () => {
  test("a blow naming neither side lands on nobody, and is not dropped", () => {
    const statistics = composeFightStatistics([ATTACK_ON_NOBODY]);

    expect(statistics.byCombatantId.size).toBe(0);
    expect(statistics.unattributed.dealtRaw).toBe(100);
    expect(statistics.unattributed.dealtApplied).toBe(60);
    expect(statistics.unattributed.taken).toBe(60);
    expect(statistics.unattributed.prevented.get("absorb")).toBe(40);
    expect(statistics.unattributed.destroyed.get("acdmg")).toBe(7);
    expect(statistics.unattributed.procsOnBlowsStruck.get("crit")).toBe(1);
  });

  // Half-named is the commoner case and the more dangerous one: the figure that
  // does have an owner must still reach them.
  test("a blow naming only its striker splits between the row and the bucket", () => {
    const statistics = composeFightStatistics([{ ...ATTACK_ON_NOBODY, actorId: 7 }]);

    expect(statistics.byCombatantId.get(7)?.dealtApplied).toBe(60);
    expect(statistics.byCombatantId.get(7)?.taken).toBe(0);
    expect(statistics.unattributed.taken).toBe(60);
    expect(statistics.unattributed.dealtApplied).toBe(0);
  });

  /**
   * The ambiguous name `combatant-roster.ts` documents. The decoder hands the
   * damage over with a null id, and it has to stay visible: two combatants
   * answer to the name, so putting it on either row would be the invented number
   * this project exists to prevent.
   */
  test("damage against a name nobody can resolve stays visible", () => {
    const statistics = composeFightStatistics([
      {
        kind: "damage-to-named-combatant",
        announced: null,
        actorId: 7,
        targetName: "a name two combatants answer to",
        targetId: null,
        targetHealthPercent: null,
        damage: { damageType: "dmgc", amount: 250 },
      },
    ]);

    expect(statistics.unattributed.taken).toBe(250);
    expect(statistics.byCombatantId.get(7)?.dealtApplied).toBe(250);
    // No raw figure exists for this key, so none may be invented for it.
    expect(statistics.byCombatantId.get(7)?.dealtRaw).toBe(0);
  });

  test("health moving for nobody is kept rather than discarded", () => {
    const statistics = composeFightStatistics([
      { kind: "health-change", announced: null, combatantId: null, amount: -300, source: "poison", declared: [] },
      { kind: "health-change", announced: null, combatantId: null, amount: 120, source: "heal", declared: [] },
    ]);

    expect(statistics.unattributed.healthLost).toBe(300);
    expect(statistics.unattributed.healed).toBe(120);
    expect(statistics.byCombatantId.size).toBe(0);
  });

  test("a skill nobody is named for is counted, not attributed", () => {
    const statistics = composeFightStatistics([
      { kind: "skill-used", actorId: null, targetId: null, skillName: "x", skillId: null, declared: [] },
    ]);

    expect(statistics.unattributed.skillsUsed).toBe(1);
    expect(statistics.byCombatantId.size).toBe(0);
  });
});

/**
 * The figures a row carries besides its totals: how a combatant fought, who they
 * fought, and what moved their health when nobody swung.
 *
 * Every one of these is checked against the captures rather than against a
 * fixture, because the question each answers is about real material — a
 * hand-written blow can be made to satisfy any of them.
 */
describe.each(FROM_CAPTURES)("$name", ({ statistics, events }) => {
  const rows = [...statistics.byCombatantId.values()];

  /**
   * Counted from the events rather than restated: the aggregate walks the same
   * list, so the only check worth having comes at it from the decoder end.
   *
   * The distinction is not academic — a blow in this material carries several
   * damage figures, so counting figures instead of swings inflates the number
   * for exactly the combatants who hit hardest.
   */
  test("a blow is counted once however many figures it carried", () => {
    const swings = new Map<number, number>();
    const largest = new Map<number, number>();
    for (const event of events) {
      if (event.kind !== "attack" || event.actorId === null) continue;
      swings.set(event.actorId, (swings.get(event.actorId) ?? 0) + 1);
      const landed = event.taken.reduce((sum, one) => sum + one.amount, 0);
      largest.set(event.actorId, Math.max(largest.get(event.actorId) ?? 0, landed));
    }

    for (const [id, row] of statistics.byCombatantId) {
      expect(row.blowsStruck, String(id)).toBe(swings.get(id) ?? 0);
      expect(row.largestBlow, String(id)).toBe(largest.get(id) ?? 0);
    }
  });

  /**
   * The two ends of one blow. They are filled a line apart in the same case, so
   * a drift between them would be invisible in the totals — which is exactly why
   * it is worth a test of its own.
   */
  test("who hit whom reads the same from both ends", () => {
    for (const [id, row] of statistics.byCombatantId) {
      for (const [targetId, byElement] of row.dealtByTargetId) {
        const mirrored = statistics.byCombatantId.get(targetId)?.takenByActorId.get(id);
        expect(mirrored).toEqual(byElement);
      }
    }
  });

  test("what a combatant dealt to named targets never exceeds what they landed", () => {
    for (const row of rows) {
      const byTarget = [...row.dealtByTargetId.values()].reduce(
        (sum, byElement) => sum + [...byElement.values()].reduce((inner, one) => inner + one, 0),
        0,
      );
      expect(byTarget).toBeLessThanOrEqual(row.dealtApplied);
    }
  });

  /**
   * Health that moved without a blow is the panel's `Bez sprawcy`, and the panel
   * shows what it was made of. The sum has to be the whole of it, or the
   * breakdown would be quietly short of the figure it explains.
   */
  test("health moved outside a blow adds up to its own sources", () => {
    for (const row of rows) {
      const lost = [...row.healthLostBySource.values()].reduce((sum, one) => sum + one, 0);
      const healed = [...row.healedBySource.values()].reduce((sum, one) => sum + one, 0);

      expect(lost).toBe(row.healthLost);
      expect(healed).toBe(row.healed);
    }
  });
});

/**
 * The counter test above is only worth running where a blow can carry several
 * figures — otherwise counting figures and counting swings agree and the test
 * proves nothing. The solo capture has no such blow, so the guard sits here,
 * over the whole material, rather than inside a per-fight loop it would fail.
 */
test("the material contains a blow carrying more than one damage figure", () => {
  const multiple = FROM_CAPTURES.flatMap(({ events }) =>
    events.filter((event) => event.kind === "attack" && event.taken.length > 1),
  );

  expect(multiple.length).toBeGreaterThan(0);
});

/**
 * Blows nobody announced, which is most of what happens.
 *
 * Measured: 8 of 8 in the solo capture, and 21 of 31 for one hunter in the group
 * one. Without the count the panel can say what a skill did and cannot say that
 * somebody simply swung — which is what a reader asked for.
 */
describe.each(FROM_CAPTURES)("$name", ({ statistics, events }) => {
  test("splits the blows into announced and not, and the halves make the whole", () => {
    const plain = new Map<number, number>();
    for (const event of events) {
      if (event.kind !== "attack" || event.actorId === null || event.announced !== null) continue;
      plain.set(event.actorId, (plain.get(event.actorId) ?? 0) + 1);
    }

    // The material has to contain both kinds, or the split proves nothing.
    expect([...plain.values()].reduce((sum, one) => sum + one, 0)).toBeGreaterThan(0);

    for (const [id, row] of statistics.byCombatantId) {
      expect(row.blowsWithoutSkill, composeIntegerText(id)).toBe(plain.get(id) ?? 0);
      expect(row.blowsWithoutSkill).toBeLessThanOrEqual(row.blowsStruck);
    }
  });

  /**
   * Every figure a side's totals hold, against its members' — field by field,
   * discovered from the object rather than listed.
   *
   * `SideStatistics.totals` is typed `CombatantStatistics`, so the type promises
   * each of these is a measurement. A counter added to that type and merged
   * nowhere leaves a side reading `0`, and a zero is a measurement: quietly too
   * low looks exactly like right (§3). Three of them were doing that.
   *
   * `largestBlow` is the one thing this cannot discover for itself, because it
   * is a maximum and not a sum — and the distinction is real rather than
   * pedantic: in the group capture one side's largest blows sum to 42 631
   * against a maximum of 9 807.
   */
  const MAXIMUM_FIELDS = new Set<keyof CombatantStatistics>(["largestBlow"]);

  test("a side's totals are its members' totals, figure by figure", () => {
    for (const [side, group] of statistics.bySide) {
      const members = group.combatantIds.map((id) => statistics.byCombatantId.get(id));
      const fields = Object.entries(group.totals)
        .filter(([, value]) => getFiniteNumberFromValue(value) !== null)
        .map(([field]) => field as keyof CombatantStatistics);

      expect(fields.length).toBeGreaterThan(0);

      for (const field of fields) {
        const figures = members.map((row) => getFiniteNumberFromValue(row?.[field]) ?? 0);
        const expected = MAXIMUM_FIELDS.has(field)
          ? figures.reduce((most, one) => Math.max(most, one), 0)
          : figures.reduce((sum, one) => sum + one, 0);

        expect(getFiniteNumberFromValue(group.totals[field]), `${field} of ${composeIntegerText(side)}`).toBe(
          expected,
        );
      }
    }
  });
});
