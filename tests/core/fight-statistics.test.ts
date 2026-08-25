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

import { getTotalOfValues, getTotalsByInnerKey, setRunningTotal } from "@/libs/running-total.ts";
import { describe, expect, test } from "bun:test";
import { assertDefined } from "@/libs/assert.ts";
import { composeIntegerText, getFiniteNumberFromValue } from "@/libs/number.ts";
import type { AttackEvent, BattleEvent } from "@/src/core/battle-event.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight, SELF_SOURCED_HEALING_KEYS } from "@/src/core/fight-decoder.ts";
import {
  composeEmptyCombatantStatistics,
  composeFightStatistics,
  getCombatantIdsInFight,
  type CombatantStatistics,
  type SideStatistics,
} from "@/src/core/fight-statistics.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterOfFight,
  composeStatisticsOfFight,
  getMessagesOfFight,
  type CapturedFight,
} from "@/tests/captured-fight-catalog.ts";

/**
 * A capture read the way the panel reads a live fight — entry health included.
 *
 * ⚠️ **Without the third argument this whole file measures a reading nothing
 * ships.** The add-on hands the aggregate what each combatant entered the fight
 * with, and every team heal in the corpus is sized because of it; a test that
 * left it out would go on asserting the totals from before that was true.
 */
function getStatisticsOf(fight: CapturedFight) {
  return composeStatisticsOfFight(fight);
}

function getEventsOf(fight: CapturedFight): BattleEvent[] {
  return decodeFight(
    getMessagesOfFight(fight),
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

const ATTACK_ON_NOBODY: AttackEvent = {
  kind: "attack",
  announced: null,
  actorId: null,
  targetId: null,
  actorHealthPercent: null,
  targetHealthPercent: null,
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
   * dead. Every capture carries exactly one of each message
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
   * impossible if the aggregate forgets what it could not read. Every capture
   * carries unread keys, so this is measured rather than constructed.
   *
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
   * ⚠️ **This has asserted three different things, and the third is the second
   * again.** Healing that reached a whole side was once reported without naming
   * anyone it healed, and every capture carrying it counted the casts as health
   * nobody could place. Then all of them were placed and this read `toEqual([])`.
   * Then `2026-08-23-tempest-grupa-vs-hildur-auto` arrived and it named that
   * recording as an exception for one commit.
   *
   * The exception was ours, not the material's: one combatant's entry health was
   * refused over a single point, because the allowance meant to absorb that
   * rounding was smaller than a health point on their pool
   * (`docs/specs/2026-08-23-an-allowance-smaller-than-a-health-point.md`). No
   * figure was wrong — the six casts it cost size to exactly the same numbers —
   * so what the panel had been showing was *unknown* where the answer was *zero*,
   * which is the one distinction §9.6 makes about this screen.
   *
   * A zero here is the claim, not an absence: it says the panel has nothing left
   * to warn about on this material. The counter itself is still live, and
   * `tests/core/combatant-health.test.ts` holds the fights that fill it — one
   * joined in progress, one whose caster has no standing ally.
   */
  test("and no capture is left with healing nobody can be credited for", () => {
    const withTeamHeal = FROM_CAPTURES.filter(
      ({ statistics }) => statistics.reading.unaccountedHealthBySource.size > 0,
    ).map(({ name }) => name);
    expect(withTeamHeal).toEqual([]);

    // And the casts really are there to have been placed, or the sentence above is
    // about a corpus that never carried one.
    const casts = FROM_CAPTURES.flatMap(({ events }) =>
      events.filter((event) => event.kind === "unaccounted-health"),
    );
    expect(casts.length).toBeGreaterThan(0);
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
  test("every capture splits into more than one side, with nobody left out", () => {
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
   * What one side lands is what the other takes — exactly, on every capture.
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
    const roster = composeCombatantRoster([{ id: 7, name: "known", side: 1, profession: null, level: null, maximumHealth: null }]);
    const statistics = composeFightStatistics(
      [{ ...ATTACK_ON_NOBODY, actorId: 7, targetId: 8 }],
      roster,
    );

    expect([...statistics.bySide.keys()]).toEqual([1]);
    expect(statistics.bySide.get(1)?.combatantIds).toEqual([7]);
    expect(statistics.combatantIdsWithoutSide).toEqual([8]);
  });
});

/**
 * Who is in the fight, which is a different question from who was measured.
 *
 * `byCombatantId` is keyed on the protocol — a row appears when somebody is
 * named — and that stays exactly as it is, because it is a record of what was
 * measured. The panel needs the other list, and the difference between the two
 * is the whole of what a reader mid-fight was missing: a combatant who has not
 * acted yet was not on screen at all, and a missing row reads as "there is no
 * such person".
 */
describe("everyone in the fight", () => {
  const ROSTER = composeCombatantRoster([
    { id: 4, name: "later", side: 1, profession: "w", level: 100, maximumHealth: null },
    { id: 7, name: "known", side: 1, profession: "m", level: 100, maximumHealth: null },
  ]);

  test("holds somebody the protocol has not named yet", () => {
    const statistics = composeFightStatistics([{ ...ATTACK_ON_NOBODY, actorId: 7, targetId: 7 }], ROSTER);

    expect(statistics.byCombatantId.has(4)).toBe(false);
    expect(getCombatantIdsInFight(statistics, ROSTER)).toEqual([4, 7]);
  });

  /**
   * The roster's own order, which is the order the game first listed each
   * warrior (`src/game/engine-roster.ts`). It is the panel's tie-break, so a
   * list where every figure is still zero reads the way the client showed it —
   * and `later` is written first here precisely so an id-sorted answer fails.
   */
  test("is in the order the game listed them, not in id order", () => {
    const statistics = composeFightStatistics([], ROSTER);

    expect(getCombatantIdsInFight(statistics, ROSTER)).toEqual([4, 7]);
  });

  /**
   * ⚠️ **The roster is not the whole answer, and this is why it is a union.** A
   * fight joined in progress states figures against ids no roster fragment has
   * arrived for; keying the list on the roster alone would drop them, which is
   * the bug `getRankedIds` avoided by keying on the aggregate in the first
   * place. They come last, because the roster is what has an order.
   */
  test("keeps somebody the roster cannot place, after the ones it can", () => {
    const statistics = composeFightStatistics([{ ...ATTACK_ON_NOBODY, actorId: 8, targetId: 7 }], ROSTER);

    expect(getCombatantIdsInFight(statistics, ROSTER)).toEqual([4, 7, 8]);
  });

  test("names nobody twice", () => {
    const statistics = composeFightStatistics([{ ...ATTACK_ON_NOBODY, actorId: 7, targetId: 4 }], ROSTER);
    const ids = getCombatantIdsInFight(statistics, ROSTER);

    expect(ids).toEqual([...new Set(ids)]);
  });

  // No roster at all is a real state — a fight joined before the game described
  // it — and the answer is then everyone the protocol named, which is what the
  // panel drew before any of this.
  test("without a roster is everyone the protocol named", () => {
    const statistics = composeFightStatistics([{ ...ATTACK_ON_NOBODY, actorId: 7, targetId: 8 }]);

    expect(getCombatantIdsInFight(statistics, null)).toEqual([7, 8]);
  });

  test("is nobody where nothing has happened and nobody is rostered", () => {
    expect(getCombatantIdsInFight(composeFightStatistics([]), null)).toEqual([]);
  });
});

/**
 * The row a combatant nobody has named yet is read through.
 *
 * Every field is a zero or an empty map, and that is a measurement rather than
 * an absence (§9.6): the fight has stated nothing about them. It lives here
 * because the aggregate owns the shape — three consumers wanted one and the
 * fields grow one at a time (§4).
 */
describe("a row of zeros", () => {
  test("measures nothing in every figure the panel reads", () => {
    const empty = composeEmptyCombatantStatistics();

    expect(empty.dealtApplied).toBe(0);
    expect(empty.dealtRaw).toBe(0);
    expect(empty.taken).toBe(0);
    expect(empty.healed).toBe(0);
    expect(empty.healingGiven).toBe(0);
    expect(empty.healthLost).toBe(0);
    expect(empty.blowsStruck).toBe(0);
    expect(empty.skills.size).toBe(0);
    expect(empty.dealtAppliedByElement.size).toBe(0);
  });

  /**
   * A fresh one each time, and it is not a detail. A shared literal hands every
   * uncounted combatant the same maps, so anything that wrote to one would be
   * writing to all of them at once — a figure appearing on a row nobody
   * measured is the failure this project exists to prevent, arriving by
   * aliasing.
   */
  test("is a fresh row rather than one shared object", () => {
    expect(composeEmptyCombatantStatistics()).not.toBe(composeEmptyCombatantStatistics());
    expect(composeEmptyCombatantStatistics().skills).not.toBe(
      composeEmptyCombatantStatistics().skills,
    );
  });
});

/**
 * Healing reads in two directions, and only one of them was ever kept.
 *
 * The panel is forbidden to derive the other for itself (§9.1), so the aggregate
 * holds both — and holding two views of one quantity is exactly the arrangement
 * that drifts. These three claims are what stop it: the two maps are one reading
 * transposed, the fight balances, and a side total counts its own members.
 */
describe.each(FROM_CAPTURES)("$name healing in both directions", ({ statistics }) => {
  test("what a healer gave is what the healed say they got", () => {
    const givenPerPair = new Map<string, number>();
    const receivedPerPair = new Map<string, number>();
    for (const [id, row] of statistics.byCombatantId) {
      for (const [to, amount] of row.healingGivenByCombatantId) {
        givenPerPair.set(`${composeIntegerText(id)}->${composeIntegerText(to)}`, amount);
      }
      for (const [from, amount] of row.healedByHealerId) {
        receivedPerPair.set(`${composeIntegerText(from)}->${composeIntegerText(id)}`, amount);
      }
    }

    expect([...givenPerPair].sort()).toEqual([...receivedPerPair].sort());
  });

  /**
   * ⚠️ **An equality on this material and an inequality in general.** The map is
   * keyed by the recipient, so a heal whose recipient did not resolve is in the
   * total and in no entry — every name in the captures resolves, which is why it
   * is an equality here. The fight built by hand below is where the two part.
   */
  test("a healer's total is the sum of what they gave each person", () => {
    for (const [id, row] of statistics.byCombatantId) {
      const perPerson = [...row.healingGivenByCombatantId.values()].reduce((sum, one) => sum + one, 0);
      expect(row.healingGiven, composeIntegerText(id)).toBe(perPerson);
    }
  });

  /**
   * The balance the whole screen rests on: healing given, plus the healing
   * nobody announced, is every point anybody received. Without the second term
   * the two directions would look like a discrepancy rather than like a limit,
   * and on this material most of the healing has no author at all.
   */
  test("given plus the healing nobody announced is all the healing received", () => {
    let given = 0;
    let received = 0;
    let withoutHealer = 0;
    for (const row of [...statistics.byCombatantId.values(), statistics.unattributed]) {
      given += row.healingGiven;
      received += row.healed;
      const named = [...row.healedByHealerId.values()].reduce((sum, one) => sum + one, 0);
      withoutHealer += row.healed - named;
    }

    expect(given + withoutHealer).toBe(received);
  });

  // No test here that a side's total counts it: dropping it from `setTotalsFrom`
  // already lights "a side's totals are its members' totals, figure by figure",
  // which is generic over every plain number a row holds. A second test for one
  // claim is a test that has to be kept in step with the first.
});

/**
 * Healing split by whether an **announcement** covered it — the second of the two
 * splits this aggregate keeps, and the one the panel's skills section rests on.
 *
 * ⚠️ **Not the same split as the one below, and the difference is a whole screen.**
 * That one asks whether anybody was *credited*; this one asks whether anything was
 * *announced*, and since `docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`
 * the three keys the help calls the healed combatant's own have a healer without
 * having an announcement. So the first split is empty on every recording while this
 * one holds 97 470 of the 346 284 points restored on
 * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`.
 *
 * No arithmetic over the other maps recovers it: `healedByHealerId` drops the key,
 * `healedBySource` drops the announcement, and a `SkillStatistics` carries no key at
 * all. That is why these are fields and this describe is what holds them honest.
 */
describe("healing an announcement covered and healing it did not", () => {
  /**
   * The two maps are one reading transposed, held apart only so that neither
   * direction has to be derived across every other row (§9.1). Written twice, they
   * drift — so this is the same claim "what a healer gave is what the healed say
   * they got" makes, with the key on it.
   */
  test.each(FROM_CAPTURES)("$name reads the same from either end", ({ statistics }) => {
    const given = new Map<string, number>();
    const received = new Map<string, number>();
    for (const [id, row] of statistics.byCombatantId) {
      for (const [to, bySource] of row.healingGivenWithoutSkillByCombatantId) {
        for (const [source, amount] of bySource) {
          given.set(`${composeIntegerText(id)}->${composeIntegerText(to)} ${source}`, amount);
        }
      }
      for (const [from, bySource] of row.healedWithoutSkillByHealerId) {
        for (const [source, amount] of bySource) {
          received.set(`${composeIntegerText(from)}->${composeIntegerText(id)} ${source}`, amount);
        }
      }
    }

    expect([...given].sort()).toEqual([...received].sort());
    // Without this the equality above would pass by comparing two empty maps the
    // day nothing was filed in either.
    expect(given.size).toBeGreaterThan(0);
  });

  /**
   * A narrowing is a narrowing: no key may hold more points than the map it is a
   * part of, in either direction. An inequality rather than an equality because the
   * rest of each figure is what an announcement did cover, and that is counted on
   * the skill rather than here.
   */
  test.each(FROM_CAPTURES)("$name never exceeds the healing it is part of", ({ statistics }) => {
    for (const [id, row] of statistics.byCombatantId) {
      const where = composeIntegerText(id);
      for (const [source, amount] of getTotalsByInnerKey(row.healedWithoutSkillByHealerId)) {
        expect(amount, `${where} ${source}`).toBeLessThanOrEqual(row.healedBySource.get(source) ?? 0);
      }
      for (const [to, bySource] of row.healingGivenWithoutSkillByCombatantId) {
        const pair = `${where}->${composeIntegerText(to)}`;
        expect(getTotalOfValues(bySource), pair).toBeLessThanOrEqual(
          row.healingGivenByCombatantId.get(to) ?? 0,
        );
      }
    }
  });

  /**
   * The two heals differ in one field and land in opposite halves — which is the
   * whole of what the maps are for, on material where nothing else varies.
   *
   * `heal` on both, because a key that changed as well would let the split pass by
   * reading the source and never looking at the announcement (§7.5: a mutation that
   * lights nothing is a finding, and so is a test that cannot tell two things
   * apart).
   */
  test("files a heal by its key exactly where no announcement covered it", () => {
    const statistics = composeFightStatistics([
      {
        kind: "health-change",
        combatantId: 4,
        amount: 50,
        healthPercent: null,
        source: "heal",
        announced: null,
        declared: [],
      },
      {
        kind: "health-change",
        combatantId: 4,
        amount: 30,
        healthPercent: null,
        source: "heal",
        announced: { actorId: 9, skillName: "coś", skillId: null },
        declared: [],
      },
    ]);

    const healed = assertDefined(statistics.byCombatantId.get(4), "the healed combatant has a row");
    expect(healed.healed).toBe(80);
    // The unannounced half is the self-sourced one, so both ends of it are 4.
    expect([...assertDefined(healed.healedWithoutSkillByHealerId.get(4), "self-healed")]).toEqual([
      ["heal", 50],
    ]);
    expect([...assertDefined(healed.healingGivenWithoutSkillByCombatantId.get(4), "self-gave")]).toEqual([
      ["heal", 50],
    ]);
    // The announced half is on the announcer and in neither map.
    const announcer = assertDefined(statistics.byCombatantId.get(9), "the announcer has a row");
    expect(announcer.healingGiven).toBe(30);
    expect([...announcer.healingGivenWithoutSkillByCombatantId]).toEqual([]);
    expect(healed.healedWithoutSkillByHealerId.get(9)).toBeUndefined();
  });

  /**
   * ⚠️ **An announcement with no actor is not an announcement**, and the aggregate
   * has one condition deciding that for both halves (`hasAnnouncer`). Two spellings
   * of it would put this heal on a skill and out of the maps at the same time, or in
   * neither, and the panel's section would silently stop adding up.
   */
  test("treats an announcement whose actor did not resolve as no announcement", () => {
    const statistics = composeFightStatistics([
      {
        kind: "health-change",
        combatantId: 4,
        amount: 50,
        healthPercent: null,
        source: "heal",
        announced: { actorId: null, skillName: "coś", skillId: null },
        declared: [],
      },
    ]);

    const healed = assertDefined(statistics.byCombatantId.get(4), "the healed combatant has a row");
    expect([...assertDefined(healed.healedWithoutSkillByHealerId.get(4), "self-healed")]).toEqual([
      ["heal", 50],
    ]);
    expect(healed.skills.size).toBe(0);
  });
});

/**
 * Healing split by whether anybody was credited with it — one reading transposed,
 * held the way `healingGiven` is.
 *
 * The panel's `Bez sprawcy` row stands for the healing nobody gave, and a reader
 * asking *what it was made of* cannot be answered from `healedBySource`: that map
 * holds every point restored, the credited ones included. Measured on
 * `tests/captured-fights/2026-08-12-tempest-grupa-vs-hildur-2.json`, the two differ
 * by more than a tenth, so there is no arithmetic recovering the split afterwards
 * and the aggregate has to write it.
 *
 * What holds the two together is that they **partition** `healed` — the same
 * property `getHealingWithoutHealer` has been deriving in the panel all along, now
 * with a source beside each point instead of one number.
 */
describe("healing with a healer and healing without one", () => {
  test.each(FROM_CAPTURES)("$name splits every point restored between the two", ({ statistics }) => {
    for (const row of getEveryRow(statistics)) {
      const credited = [...row.healedByHealerId.values()].reduce((sum, one) => sum + one, 0);
      const uncredited = [...row.healedWithoutHealerBySource.values()].reduce(
        (sum, one) => sum + one,
        0,
      );
      expect(credited + uncredited).toBe(row.healed);
    }
  });

  /**
   * ⚠️ **A healer named over a recipient nobody could place, which the captures
   * cannot reach and the aggregate used to get wrong.**
   *
   * The credit demanded both ends, so an announced heal landing on a name this
   * fight has nobody for was filed under `healedWithoutHealerBySource` — healing
   * *nobody gave*. The announcement had named the giver, so the panel then said
   * "nic nie zapowiedziało tego leczenia" about points something had announced,
   * and the giver's own total was short by them with nothing saying so. That is a
   * claim about the game that is false (§3), not merely a figure left out
   * (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`).
   *
   * Every name in every capture resolves, so nothing here is measurable
   * over them: the shape is the live one, where a fight is joined on a name the
   * roster cannot tell apart.
   */
  test("credits a healer the announcement named, even where the healed did not resolve", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
    ]);
    const statistics = composeFightStatistics(
      decodeFight(
        [
          "1=90.00;0;tspell=Uzdrowienie;skillId=7",
          // The heal rides the announcement, and its subject is the target slot,
          // which the protocol wrote as nobody.
          "1=90.00;0;heal_target=300",
        ],
        roster,
      ),
      roster,
    );

    const giver = assertDefined(statistics.byCombatantId.get(1), "the healer has a row");
    expect(giver.healingGiven).toBe(300);
    // Keyed by the recipient, and there is none to key it by.
    expect([...giver.healingGivenByCombatantId]).toEqual([]);

    // The points landed on the row nobody owns, with the healer named on them.
    expect(statistics.unattributed.healed).toBe(300);
    expect([...statistics.unattributed.healedByHealerId]).toEqual([[1, 300]]);
    expect([...statistics.unattributed.healedWithoutHealerBySource]).toEqual([]);
  });

  /**
   * And it is a partition of something, not of nothing: a fight where every point
   * happened to be uncredited would let a map that simply copied `healedBySource`
   * pass the sweep above.
   *
   * ⚠️ **The captures used to carry both kinds and now carry only one.** Every
   * point of healing in every recording reaches a healer since the three keys the
   * help calls the healed combatant's own started saying so
   * (`docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`). So the second
   * half of the partition is held by the hand-built fights above — a heal whose
   * announcer this fight cannot place — and this test states the corpus reading
   * that replaced it rather than being deleted for having gone quiet. A capture
   * that ever carries uncredited healing again is a key nobody has read.
   */
  test("every point of healing in the captures reaches a healer", () => {
    const credited = FROM_CAPTURES.flatMap(({ statistics }) => getEveryRow(statistics)).reduce(
      (sum, row) => sum + [...row.healedByHealerId.values()].reduce((one, other) => one + other, 0),
      0,
    );
    const uncredited = FROM_CAPTURES.flatMap(({ statistics }) => getEveryRow(statistics)).reduce(
      (sum, row) =>
        sum + [...row.healedWithoutHealerBySource.values()].reduce((one, other) => one + other, 0),
      0,
    );
    const received = FROM_CAPTURES.flatMap(({ statistics }) => getEveryRow(statistics)).reduce(
      (sum, row) => sum + row.healed,
      0,
    );

    expect(credited).toBeGreaterThan(0);
    expect(uncredited).toBe(0);
    // The two halves partition `healed`, so with one of them empty the other is
    // the whole of it — which is the same claim read a second way.
    expect(credited).toBe(received);
  });

  /**
   * The key stays with the points, which is the whole reason the map is keyed at
   * all: a heal an announcement claimed and one that arrived on its own can share
   * a source, and only the second is the pinned row's.
   */
  test("keeps the key the game stated, on the points nobody was credited with", () => {
    // ⚠️ **`heal_target` and not `heal`, and the swap is the point.** `heal` is on
    // `SELF_SOURCED_HEALING_KEYS`, so an unannounced one has a healer now and
    // there would be no uncredited half left to key. This test is about a source
    // the help says nothing about, which is the only kind that can still arrive
    // with nobody on the giving end.
    const statistics = composeFightStatistics([
      {
        kind: "health-change",
        combatantId: 4,
        amount: 50,
        healthPercent: null,
        source: "heal_target",
        announced: null,
        declared: [],
      },
      {
        kind: "health-change",
        combatantId: 4,
        amount: 30,
        healthPercent: null,
        source: "heal_target",
        announced: { actorId: 9, skillName: "coś", skillId: null },
        declared: [],
      },
    ]);

    const row = assertDefined(statistics.byCombatantId.get(4), "the healed combatant has a row");
    expect(row.healed).toBe(80);
    expect(row.healedBySource.get("heal_target")).toBe(80);
    expect(row.healedWithoutHealerBySource.get("heal_target")).toBe(50);
    expect(row.healedByHealerId.get(9)).toBe(30);
  });

  /**
   * Healing stated against a **name** is the holder's own legendary bonus, so the
   * combatant the value names is both ends of it — never the message's actor, who
   * is whoever struck the blow that triggered it (§9.6).
   */
  test("counts healing stated against a name as the named combatant's own", () => {
    const statistics = composeFightStatistics([
      {
        kind: "healing-to-named-combatant",
        targetName: "ktoś",
        targetId: 2,
        targetHealthPercent: null,
        amount: 70,
        source: "legbon_lastheal",
      },
    ]);

    const row = assertDefined(statistics.byCombatantId.get(2), "the healed combatant has a row");
    expect(row.healedBySource.get("legbon_lastheal")).toBe(70);
    expect([...row.healedWithoutHealerBySource]).toEqual([]);
    expect(row.healedByHealerId.get(2)).toBe(70);
    expect(row.healingGiven).toBe(70);
    expect(row.healingGivenByCombatantId.get(2)).toBe(70);
    // One row, and only one: nobody else is credited with a point of it.
    expect(statistics.byCombatantId.size).toBe(1);
  });

  /**
   * The three keys the published help calls the healed combatant's **own** effect,
   * and what the aggregate does with them (§9.6,
   * `docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`).
   *
   * One combatant on both ends, which is the shape a self-cast `heal_target` and a
   * team heal's caster share have always had here — so this is three keys joining
   * a reading rather than a new one being invented for them.
   */
  test.each([...SELF_SOURCED_HEALING_KEYS])("credits %s to the combatant it healed", (source) => {
    const statistics = composeFightStatistics([
      {
        kind: "health-change",
        combatantId: 7,
        amount: 120,
        healthPercent: null,
        source,
        announced: null,
        declared: [],
      },
    ]);

    const row = assertDefined(statistics.byCombatantId.get(7), "the healed combatant has a row");
    expect(row.healed).toBe(120);
    expect(row.healingGiven).toBe(120);
    expect(row.healedByHealerId.get(7)).toBe(120);
    expect(row.healingGivenByCombatantId.get(7)).toBe(120);
    // Nothing is left for the panel's pinned row to draw.
    expect([...row.healedWithoutHealerBySource]).toEqual([]);
    expect(statistics.byCombatantId.size).toBe(1);
  });

  /**
   * ⚠️ **An announcement still wins.** A giver the protocol actually stated beats
   * one derived from the help, so a self-sourced key arriving under an
   * announcement is credited to whoever announced it and not to the combatant it
   * reached. No capture carries the shape — every `heal` in all of them is
   * unannounced — so it is a hand-built fight, and it is what keeps the fill from
   * quietly overwriting a reading the game made itself.
   */
  test("prefers an announcer over the key, where a self-sourced heal has one", () => {
    const statistics = composeFightStatistics([
      {
        kind: "health-change",
        combatantId: 7,
        amount: 120,
        healthPercent: null,
        source: "heal",
        announced: { actorId: 3, skillName: "coś", skillId: null },
        declared: [],
      },
    ]);

    const healed = assertDefined(statistics.byCombatantId.get(7), "the healed combatant has a row");
    const healer = assertDefined(statistics.byCombatantId.get(3), "the announcer has a row");
    expect(healed.healed).toBe(120);
    expect(healed.healingGiven).toBe(0);
    expect(healed.healedByHealerId.get(3)).toBe(120);
    expect(healer.healingGiven).toBe(120);
  });

  /**
   * ⚠️ **Only the restoring direction.** `heal` states a loss as readily as a
   * gain, and nothing documents a self-damage reading — so a negative one is
   * health lost with nobody charged for it, exactly as before.
   */
  test("charges nobody for a self-sourced key stating a loss", () => {
    const statistics = composeFightStatistics([
      {
        kind: "health-change",
        combatantId: 7,
        amount: -120,
        healthPercent: null,
        source: "heal",
        announced: null,
        declared: [],
      },
    ]);

    const row = assertDefined(statistics.byCombatantId.get(7), "the combatant has a row");
    expect(row.healthLost).toBe(120);
    expect(row.healthLostBySource.get("heal")).toBe(120);
    expect(row.healed).toBe(0);
    expect(row.healingGiven).toBe(0);
    expect(row.dealtApplied).toBe(0);
  });

  /**
   * A key the help says nothing about keeps its hole. `poison` and `fire` arrive
   * in the very shape `heal` does — the subject in the actor slot, the target a
   * literal `0` — and stay on the panel's pinned row, which is what makes the
   * asymmetry a reading of the documentation rather than of the message.
   */
  test("leaves a key the help does not name without a healer", () => {
    const statistics = composeFightStatistics([
      {
        kind: "health-change",
        combatantId: 7,
        amount: 120,
        healthPercent: null,
        source: "heal_target",
        announced: null,
        declared: [],
      },
    ]);

    const row = assertDefined(statistics.byCombatantId.get(7), "the healed combatant has a row");
    expect(row.healed).toBe(120);
    expect(row.healingGiven).toBe(0);
    expect(row.healedWithoutHealerBySource.get("heal_target")).toBe(120);
    expect(row.healedByHealerId.size).toBe(0);
  });

  /**
   * And a name this fight cannot place still reaches nobody. The fill names a
   * combatant the message already named; where it named none there is nothing to
   * fill with, which is the limit of §9.6's clause rather than a gap in it.
   */
  test("counts healing stated against a name nobody matches as nobody's", () => {
    const statistics = composeFightStatistics([
      {
        kind: "healing-to-named-combatant",
        targetName: "ktoś",
        targetId: null,
        targetHealthPercent: null,
        amount: 70,
        source: "legbon_lastheal",
      },
    ]);

    expect(statistics.byCombatantId.size).toBe(0);
    expect(statistics.unattributed.healed).toBe(70);
    expect(statistics.unattributed.healedWithoutHealerBySource.get("legbon_lastheal")).toBe(70);
    expect(statistics.unattributed.healingGiven).toBe(0);
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
      { kind: "health-change", announced: null, combatantId: null, amount: -300, healthPercent: null, source: "poison", declared: [] },
      { kind: "health-change", announced: null, combatantId: null, amount: 120, healthPercent: null, source: "heal", declared: [] },
    ]);

    expect(statistics.unattributed.healthLost).toBe(300);
    expect(statistics.unattributed.healed).toBe(120);
    expect(statistics.byCombatantId.size).toBe(0);
  });

  test("a skill nobody is named for is counted, not attributed", () => {
    const statistics = composeFightStatistics([
      {
        kind: "skill-used",
        actorId: null,
        targetId: null,
        actorHealthPercent: null,
        targetHealthPercent: null,
        skillName: "x",
        skillId: null,
        declared: [],
      },
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
      setRunningTotal(swings, event.actorId, 1);
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
 * The split is only worth counting where the material has both kinds, and one
 * capture has neither half: every blow in the duel is announced, all 41 of them.
 * So the "both kinds exist" half sits over the whole corpus, beside the
 * multiple-figures guard above and for the same reason, while the arithmetic
 * below stays per fight where it belongs.
 */
test("the material contains a blow nobody announced", () => {
  const plain = FROM_CAPTURES.flatMap(({ events }) =>
    events.filter((event) => event.kind === "attack" && event.announced === null),
  );

  expect(plain.length).toBeGreaterThan(0);
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
      setRunningTotal(plain, event.actorId, 1);
    }

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

/**
 * What could not be read, counted where the consequence is.
 *
 * Zero on every recording — `bun run tools/fight-report.ts` prints
 * `unreadable messages: 0` and `unaccounted healing: 0 casts` for all of
 * `tests/captured-fights/` as the set stands 2026-08-24 — so these are the two
 * counters the corpus can say nothing about at all, and they are built by hand for
 * the same reason `unattributed` is
 * (`docs/specs/2026-08-24-a-warning-on-the-row-it-shortens.md`).
 *
 * The claim each holds is *whose figure may be short*. Getting it wrong is silent
 * in both directions: a count that never lands leaves a total marked clean while it
 * is low, and one that lands on the wrong row tells somebody their numbers are
 * suspect when they are not.
 */
describe("what could not be read, per row", () => {
  const roster = composeCombatantRoster([
    { id: 1, name: "mag", side: 1, profession: "m", level: 100, maximumHealth: null },
    { id: 2, name: "tarcza", side: 1, profession: "w", level: 100, maximumHealth: null },
    { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
  ]);

  /** The counters of everyone the fight mentions, so a stray one cannot hide. */
  function getUnreadableByCombatantId(messages: readonly string[]): Map<number, number> {
    const statistics = composeFightStatistics(decodeFight(messages, roster), roster);
    return new Map([...statistics.byCombatantId].map(([id, row]) => [id, row.unreadableMessages]));
  }

  test("raises the count of both ends the unread message named, and nobody else's", () => {
    const counts = getUnreadableByCombatantId(["1=90.00;3=50.00;no_such_key=13"]);

    expect(counts.get(1)).toBe(1);
    expect(counts.get(3)).toBe(1);
    expect(counts.get(2) ?? 0).toBe(0);
  });

  /**
   * The boundary from the other side (§7.5): a message the decoder read in full
   * leaves every row at zero. Without this the counter could be raised on every
   * message and the test above would still pass.
   */
  test("leaves every row alone where the message was read in full", () => {
    const counts = getUnreadableByCombatantId(["1=90.00;3=50.00;+dmg=500;-dmg=400"]);

    expect(counts.size).toBeGreaterThan(0);
    expect([...counts.values()].every((count) => count === 0)).toBe(true);
  });

  /**
   * A message naming nobody is still unreadable and still has to be said — by the
   * fight-wide figure, which is the only thing that can carry it. It must not land
   * on `unattributed`: that bucket holds figures this meter has and cannot place,
   * and there is no figure here at all.
   */
  test("keeps a message naming nobody in the fight's own count and off every row", () => {
    const statistics = composeFightStatistics(decodeFight(["0;0;no_such_key=13"], roster), roster);

    expect(statistics.reading.unreadableMessages).toBe(1);
    expect(statistics.unattributed.unreadableMessages).toBe(0);
    expect(
      [...statistics.byCombatantId.values()].every((row) => row.unreadableMessages === 0),
    ).toBe(true);
  });

  /**
   * A cast this meter could not size lands on the caster and on nobody else — the
   * one end the protocol names. The recipients are the whole difficulty
   * (`src/core/battle-event.ts`), so their rows stay clean and the shortfall stays
   * in the fight's own reading.
   */
  test("charges a cast nobody could size to the caster the protocol named", () => {
    const statistics = composeFightStatistics(
      [
        {
          kind: "unaccounted-health",
          source: "healall_per",
          combatantId: 1,
          declaredShare: 12,
          announced: null,
        },
      ],
      roster,
    );

    expect(statistics.byCombatantId.get(1)?.unaccountedHealingCasts).toBe(1);
    expect(statistics.byCombatantId.get(2)?.unaccountedHealingCasts ?? 0).toBe(0);
    // And no health moved anywhere, which is the whole reason the cast is counted
    // rather than added: the figure is what is missing.
    expect(statistics.byCombatantId.get(1)?.healingGiven).toBe(0);
  });

  test("counts a cast with no caster in the fight's reading and on no row", () => {
    const statistics = composeFightStatistics(
      [
        {
          kind: "unaccounted-health",
          source: "healall_per",
          combatantId: null,
          declaredShare: 12,
          announced: null,
        },
      ],
      roster,
    );

    expect(getTotalOfValues(statistics.reading.unaccountedHealthBySource)).toBe(1);
    expect(statistics.unattributed.unaccountedHealingCasts).toBe(0);
    expect(statistics.byCombatantId.size).toBe(0);
  });
});

/**
 * The four edges `bun tools/mutation-sweep.ts` found nothing holding.
 *
 * ⚠️ **Three of the four are the number zero**, which is the third round running
 * that this boundary has turned out to be the untested one. It is not an
 * accident of where tests were written: zero is the neutral element of every sum
 * here, so an off-by-one at that edge changes no total on real material and
 * changes the *meaning* of every figure that sits on the boundary. §9.6 spends a
 * paragraph on keeping "measured nothing" apart from "could not be read", and
 * this is where the two touch.
 */
describe("the edges of the aggregate", () => {
  const roster = composeCombatantRoster([
    { id: 1, name: "mag", side: 1, profession: "m", level: 100, maximumHealth: null },
    { id: 2, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
  ]);

  /**
   * Kills `landed > 0` → `>= 0` and → `> 1`. A blow that reached the target and
   * did nothing must not open a per-target entry under the skill: the drill lists
   * *whom this skill hit*, and an entry of zero says it hit somebody for nothing
   * rather than that it never reached them at all.
   */
  test("a blow that landed nothing opens no entry under the skill that threw it", () => {
    const statistics = composeFightStatistics(
      decodeFight(
        ["1=90.00;2=50.00;tspell=Czar testowy;skillId=7", "1=90.00;2=50.00;+dmg=0;-dmg=0"],
        roster,
      ),
      roster,
    );
    const skill = [...assertDefined(statistics.byCombatantId.get(1), "the mage has a row").skills][0];

    expect(assertDefined(skill, "the skill was announced")[1].dealtApplied).toBe(0);
    expect([...assertDefined(skill, "the skill was announced")[1].dealtByTargetId]).toEqual([]);
  });

  /**
   * One, and not a comfortable number: the boundary has two sides and a test
   * sitting well clear of it only holds one. Written as `30` first, which left
   * `landed > 0` → `> 1` alive — the smallest blow the game can report would
   * have gone missing from the drill and nothing would have said so.
   */
  test("while the smallest blow there is does", () => {
    const statistics = composeFightStatistics(
      decodeFight(
        ["1=90.00;2=50.00;tspell=Czar testowy;skillId=7", "1=90.00;2=50.00;+dmg=1;-dmg=1"],
        roster,
      ),
      roster,
    );
    const skill = [...assertDefined(statistics.byCombatantId.get(1), "the mage has a row").skills][0];

    expect([...assertDefined(skill, "the skill was announced")[1].dealtByTargetId]).toEqual([[2, 1]]);
  });

  /**
   * Kills `event.amount >= 0` → `> 0` and → `>= 1`. Health that moved by zero is
   * healing that measured nothing, and it belongs on the healed side of the row.
   * Sent the other way it becomes health *lost*, so a figure of nothing turns
   * into a wound nobody took.
   */
  test("health that moved by zero is healing of nothing, not damage of nothing", () => {
    const statistics = composeFightStatistics(decodeFight(["1=90.00;0;heal=0"], roster), roster);
    const row = assertDefined(statistics.byCombatantId.get(1), "the mage has a row");

    expect(row.healed).toBe(0);
    expect(row.healthLost).toBe(0);
    expect([...row.healedBySource]).toEqual([["heal", 0]]);
    expect([...row.healthLostBySource]).toEqual([]);
  });

  /** Kills `event.result === "won"` → `!==`, which swaps both sides of the fight. */
  test("who won and who lost are not the same list", () => {
    const statistics = composeFightStatistics(
      decodeFight(["0;0;winner=mag", "0;0;loser=coś dużego"], roster),
      roster,
    );

    expect(statistics.outcome).toEqual({
      wonNames: ["mag"],
      lostNames: ["coś dużego"],
      isDrawn: false,
    });
  });

  /**
   * Kills `event.result === "drawn"` → `!==`, which turns every stated winner
   * into a draw, and kills the `true` it sets.
   *
   * The one outcome that arrives without a name, so the two lists stay empty and
   * the flag is the whole of what the fight said about how it ended.
   */
  test("a fight nobody won is drawn, and puts no one on either side", () => {
    const statistics = composeFightStatistics(decodeFight(["0;0;winner=?"], roster), roster);

    expect(statistics.outcome).toEqual({ wonNames: [], lostNames: [], isDrawn: true });
  });

  /**
   * Kills the `1` in `setRunningTotal(messagesByReason, event.reason, 1)`. The
   * count is of messages, so each one adds itself once — a two counts every
   * unreadable message twice and reports a fight as twice as unreadable as it is.
   */
  test("an unreadable message counts once, however many share its reason", () => {
    const statistics = composeFightStatistics(
      decodeFight(["0;0;no_such_key=1", "0;0;no_such_key=2", "0;0;other_key=3"]),
    );

    expect(statistics.reading.unreadableMessages).toBe(3);
    expect([...statistics.reading.messagesByReason.values()]).toEqual([2, 1]);
    expect(statistics.reading.occurrencesByUnreadKey.get("no_such_key")).toBe(2);
  });
});
