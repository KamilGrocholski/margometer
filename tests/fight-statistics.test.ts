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
 * The per-call version of this comparison is `tests/health-witness.test.ts`,
 * which handles both by skipping what it cannot add. Repeating it here at fight
 * scale would either duplicate that or need a tolerance wide enough to prove
 * nothing. What this file holds instead is the invariant the aggregate itself
 * owns: every figure landed is also a figure taken.
 */

import { describe, expect, test } from "bun:test";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import {
  composeFightStatistics,
  type CombatantStatistics,
} from "@/src/core/fight-statistics.ts";
import { CAPTURED_FIGHTS, type CapturedFight } from "@/tests/captured-fight-catalog.ts";

function getStatisticsOf(fight: CapturedFight) {
  const names = new Map<number, string>();
  for (const call of fight.dump.calls) {
    for (const combatant of [...call.combatantsBefore, ...call.combatantsAfter]) {
      names.set(combatant.id, combatant.name);
    }
  }
  const roster = composeCombatantRoster([...names].map(([id, name]) => ({ id, name })));
  return composeFightStatistics(
    decodeFight(
      fight.dump.calls.flatMap((call) => call.protocolMessages),
      roster,
    ),
  );
}

const FROM_CAPTURES = CAPTURED_FIGHTS.map((fight) => ({
  name: fight.name,
  statistics: getStatisticsOf(fight),
}));

function getEveryRow(statistics: ReturnType<typeof composeFightStatistics>): CombatantStatistics[] {
  return [...statistics.byCombatantId.values(), statistics.unattributed];
}

const ATTACK_ON_NOBODY: BattleEvent = {
  kind: "attack",
  actorId: null,
  targetId: null,
  dealt: [{ damageType: "dmg", amount: 100 }],
  taken: [{ damageType: "dmg", amount: 60 }],
  prevented: [{ prevention: "absorb", amount: 40 }],
  procs: ["crit"],
  destroyed: [{ statistic: "acdmg", amount: 7 }],
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
  test("what could not be read reaches the aggregate", () => {
    for (const { name, statistics } of FROM_CAPTURES) {
      expect(statistics.reading.unreadableMessages, name).toBeGreaterThan(0);
      expect(statistics.reading.messagesByReason.size, name).toBeGreaterThan(0);
    }
  });

  // Zero is a measurement; unknown is the absence of one. They are different
  // fields here so the panel can keep them apart on screen.
  test("a figure of zero and something unread are not the same thing", () => {
    const { statistics } = FROM_CAPTURES[0]!;
    const idle = [...statistics.byCombatantId.values()].find((row) => row.healed === 0);
    expect(idle).toBeDefined();
    expect(idle?.healed).toBe(0);
    expect(statistics.reading.unreadableMessages).toBeGreaterThan(0);
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
      { kind: "health-change", combatantId: null, amount: -300, source: "poison" },
      { kind: "health-change", combatantId: null, amount: 120, source: "heal" },
    ]);

    expect(statistics.unattributed.healthLost).toBe(300);
    expect(statistics.unattributed.healed).toBe(120);
    expect(statistics.byCombatantId.size).toBe(0);
  });

  test("a skill nobody is named for is counted, not attributed", () => {
    const statistics = composeFightStatistics([
      { kind: "skill-used", actorId: null, targetId: null, skillName: "x", skillId: null },
    ]);

    expect(statistics.unattributed.skillsUsed).toBe(1);
    expect(statistics.byCombatantId.size).toBe(0);
  });
});
