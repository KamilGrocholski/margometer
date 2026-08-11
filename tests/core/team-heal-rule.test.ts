/**
 * The rule `docs/protocol-keys.md` states for `healall_per`, re-earned on every
 * run — and the one reading of it the captures refuse.
 *
 * This key is the only reason the health witness ever declines a whole engine
 * call, so its entry decides how much of the material anything is held to. The
 * entry used to say the blocker was a missing roster; the roster arrived, and
 * what the measurement then found was a different blocker and a shape claim that
 * was wrong. Prose is where that goes to stop being checked (AGENTS.md §7.5), so
 * every figure the entry states is measured here instead.
 *
 * Deltas are read only from calls carrying a single message. Anywhere else the
 * health that moved is the sum of everything in the call, and a rule confirmed
 * against a contaminated figure is a rule confirmed against nothing.
 */

import { describe, expect, test } from "bun:test";
import { getNumberFromText } from "@/libs/number.ts";
import { decodeFight, UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS, type CapturedFight } from "@/tests/captured-fight-catalog.ts";
import { getKeysWithHealthEffect } from "@/tests/protocol-key-register.ts";

const TEAM_HEAL_KEY = "healall_per";

/** Each use of a skill carrying the effect is weaker by this much of its first. */
const WEAKENING_PER_USE = 0.25;

/** Health is whole numbers, so a share landing between two of them is exact enough. */
const TOLERANCE_IN_HEALTH_POINTS = 0.5;

type Cast = {
  fight: string;
  call: number;
  casterId: number;
  /** The share the protocol states, already weakened — see the test below. */
  percent: number;
};

type Reading = {
  fight: string;
  call: number;
  combatantId: number;
  currentHealth: number;
  maximumHealth: number;
  startingHealth: number;
  gained: number;
  /** Whether the combatant stood on the caster's side. */
  isSideMate: boolean;
  percent: number;
};

function getCasts(fight: CapturedFight): Cast[] {
  return fight.dump.calls.flatMap((call) =>
    call.protocolMessages.flatMap((message) => {
      const parsed = parseProtocolMessage(message);
      const stated = parsed.parameters.find((parameter) => parameter.key === TEAM_HEAL_KEY);
      if (stated === undefined) return [];

      // Both readers, because they split on the decimal point rather than on
      // "is this a number": the same fight states 30 and 22.5, and asking only
      // the decimal reader drops every whole share on the floor.
      const percent =
        stated.value === null
          ? null
          : getNumberFromText(stated.value);
      if (percent === null || parsed.actor === null) return [];

      return [{ fight: fight.name, call: call.index, casterId: parsed.actor.combatantId, percent }];
    }),
  );
}

/**
 * What the health of everyone present did across a cast that was the whole call.
 *
 * The side comes from the snapshots rather than from a roster: the question here
 * is what the game did, and joining that to what the decoder could know is the
 * next round's problem, not this one's.
 */
function getReadings(fight: CapturedFight): Reading[] {
  return fight.dump.calls.flatMap((call) => {
    if (call.protocolMessages.length !== 1) return [];

    const cast = getCasts(fight).find((candidate) => candidate.call === call.index);
    if (cast === undefined) return [];

    const after = new Map(call.combatantsAfter.map((combatant) => [combatant.id, combatant]));
    const caster = call.combatantsBefore.find((combatant) => combatant.id === cast.casterId);
    if (caster === undefined) return [];

    return call.combatantsBefore.flatMap((before) => {
      const combatant = after.get(before.id);
      if (combatant === undefined) return [];

      return [
        {
          fight: fight.name,
          call: call.index,
          combatantId: before.id,
          currentHealth: before.health.current,
          maximumHealth: before.health.maximum,
          startingHealth: fight.startingHealthByCombatantId.get(before.id) ?? 0,
          gained: combatant.health.current - before.health.current,
          isSideMate: before.team === caster.team,
          percent: cast.percent,
        },
      ];
    });
  });
}

const CASTS: Cast[] = CAPTURED_FIGHTS.flatMap(getCasts);
const READINGS: Reading[] = CAPTURED_FIGHTS.flatMap(getReadings);
const SIDE_MATES: Reading[] = READINGS.filter((reading) => reading.isSideMate);

/** The share before any cap, which is where the two rejected readings differ. */
function getShare(reading: Reading, of: number, round: (value: number) => number): number {
  return round((reading.percent / 100) * of);
}

function getRestored(reading: Reading, ceiling: number): number {
  return Math.min(
    getShare(reading, reading.maximumHealth, Math.floor),
    Math.max(0, ceiling - reading.currentHealth),
  );
}

function composeReport(reading: Reading): string {
  return `${reading.fight} call ${reading.call}, combatant ${reading.combatantId}`;
}

function getDisagreeing(ceiling: (reading: Reading) => number): string[] {
  return SIDE_MATES.filter(
    (reading) =>
      Math.abs(getRestored(reading, ceiling(reading)) - reading.gained) >
      TOLERANCE_IN_HEALTH_POINTS,
  ).map(composeReport);
}

describe("what `healall_per` restores", () => {
  test("the captures carry casts, and casts nothing else shares a call with", () => {
    expect(CASTS.length).toBeGreaterThan(0);
    expect(SIDE_MATES.length).toBeGreaterThan(0);
  });

  /**
   * The help states that each successive use of a skill carrying this effect is
   * weaker by a quarter of the base. Measured here, the protocol states the
   * *result* of that — so a reading takes the figure as given and re-derives
   * nothing. Grouped by caster and not by skill: two casters used the same skill
   * from different bases, so a per-skill grouping would report the weakening as
   * a contradiction.
   */
  test("the share the protocol states is already the weakened one", () => {
    const byCaster = new Map<number, number[]>();
    for (const cast of CASTS) {
      byCaster.set(cast.casterId, [...(byCaster.get(cast.casterId) ?? []), cast.percent]);
    }

    const disagreeing = [...byCaster].filter(([, shares]) =>
      shares.some((share, use) => {
        const base = shares[0] ?? 0;
        return Math.abs(share - base * (1 - WEAKENING_PER_USE * use)) > Number.EPSILON;
      }),
    );
    expect(disagreeing).toEqual([]);
  });

  test("nobody on the other side gains anything", () => {
    const opposing = READINGS.filter((reading) => !reading.isSideMate);
    // Counted first: a side restriction checked against nobody is green, and it
    // stays green through exactly the mistake it exists to catch.
    expect(opposing.length).toBeGreaterThan(0);
    expect(opposing.filter((reading) => reading.gained > 0).map(composeReport)).toEqual([]);
  });

  /**
   * The share is of the maximum. Reading it against current health is the error
   * that looks right on anyone near full and is wildly wrong on anyone who needs
   * the heal, so the rejected reading stays as a test rather than as a sentence.
   */
  test("the share is of maximum health, not of the health the combatant has left", () => {
    const wouldDiffer = SIDE_MATES.filter(
      (reading) =>
        Math.abs(
          getShare(reading, reading.maximumHealth, Math.floor) -
            getShare(reading, reading.currentHealth, Math.floor),
        ) > TOLERANCE_IN_HEALTH_POINTS,
    );
    expect(wouldDiffer.length).toBeGreaterThan(0);
  });

  /** One combatant's share lands on .5 and the game keeps the lower whole number. */
  test("and it floors, where rounding would answer one point higher", () => {
    const wouldDiffer = SIDE_MATES.filter(
      (reading) =>
        getShare(reading, reading.maximumHealth, Math.round) !==
        getShare(reading, reading.maximumHealth, Math.floor),
    );
    expect(wouldDiffer.length).toBeGreaterThan(0);
  });

  /**
   * Measured across every occurrence, not only these calls: the cap binds on 84
   * of 120 side-mates, and dropping it reports 120% more healing than happened.
   * It is the difference between a figure and twice a figure, so it is not a
   * refinement of the rule — it is most of it.
   */
  test("the cap binds, so no reading of this key can leave it out", () => {
    const capped = SIDE_MATES.filter(
      (reading) =>
        getShare(reading, reading.maximumHealth, Math.floor) - reading.gained >
        TOLERANCE_IN_HEALTH_POINTS,
    );
    expect(capped.length).toBeGreaterThan(0);
  });

  /**
   * The cap, and the single reading that refuses it.
   *
   * The help says the effect cannot restore a combatant past the health it began
   * the fight with, and that reproduces every reading here but one: a combatant
   * already **above** its starting health was taken to full anyway. It is also
   * the only reading in the material standing above its starting health when a
   * cast landed — so the one case that could test the cap in that direction is
   * the one case that refuses it, and the key stays unread on the strength of
   * exactly that.
   *
   * Named rather than counted, so a second exception says which it is.
   */
  test("the cap is the health the fight began with, on all but one reading", () => {
    expect(getDisagreeing((reading) => reading.startingHealth)).toEqual([
      "2026-08-06-tempest-grupa-vs-hildur call 59, combatant 445202",
    ]);
  });

  /** The reading that fits worse, kept so the two cannot quietly swap places. */
  test("and not maximum health, which the same material refuses six times over", () => {
    expect(getDisagreeing((reading) => reading.maximumHealth).length).toBeGreaterThan(
      getDisagreeing((reading) => reading.startingHealth).length,
    );
  });

  /**
   * The entry's conclusion, and the shape it now takes.
   *
   * Everything above is exact except the cap, and a cap that is wrong on one
   * combatant per cast is a healing figure too high — the one direction of error
   * this project refuses, because the panel cannot mark what it does not know it
   * got wrong. So **no figure is drawn from this key**, and that has not changed.
   *
   * What changed is that refusing the figure no longer means refusing the key.
   * The decoder reads it into `unaccounted-health`, which says the thing the old
   * "no meaning yet for healall_per" could not: healing happened, it reached a
   * whole side, and this meter cannot say whose it was.
   */
  test("yields no healing figure, and says the healing is missing rather than unknown", () => {
    expect(UNDERSTOOD_PROTOCOL_KEYS).toContain(TEAM_HEAL_KEY);

    const events = decodeFight([`1=100.00;1=100.00;tspell=Something;${TEAM_HEAL_KEY}=30`]);
    expect(events.map((event) => event.kind)).toEqual(["unaccounted-health", "skill-used"]);
    expect(events[0]).toEqual({
      kind: "unaccounted-health",
      source: TEAM_HEAL_KEY,
      combatantId: 1,
      declaredShare: 30,
    });

    const statistics = composeFightStatistics(events);
    expect(statistics.byCombatantId.get(1)?.healed).toBe(0);
    expect(statistics.unattributed.healed).toBe(0);
    expect(statistics.reading.unaccountedHealthBySource.get(TEAM_HEAL_KEY)).toBe(1);
  });

  /**
   * What keeps the twelve calls out of the witness's reach. Drop the health
   * claim and the witness stops skipping them, judges them against damage that
   * never accounts for this heal, and reports the shortfall as the decoder's
   * error rather than as ours.
   */
  test("and the register still declares it moves health, which is what skips its calls", () => {
    expect(getKeysWithHealthEffect("moves health")).toContain(TEAM_HEAL_KEY);
  });
});
