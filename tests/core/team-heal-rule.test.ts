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
import {
  CAPTURED_FIGHTS,
  type CapturedFight,
  composeRosterOfFight,
} from "@/tests/captured-fight-catalog.ts";
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

/**
 * Whose health had already moved when the fight's first snapshot was taken.
 *
 * ⚠️ **The cap below is measured against a figure the capture may not hold.**
 * `startingHealthByCombatantId` reads the health a combatant was *first seen*
 * holding, and that is the health they began the fight with only while nothing
 * has reached them yet. Where something has, the recorded figure is too low by
 * whatever it was, and a cap taken from it binds where the game's did not.
 *
 * Decided from the messages alone — who a health-moving event named before the
 * first snapshot — so it is a fact about the recording and not about the heals
 * under test. Anything else would be circular: the obvious tell, a combatant
 * later standing above their recorded start, is only a tell if healing cannot
 * exceed the entry health, which is the claim.
 *
 * ⚠️ **This is not a corner.** `2026-08-14-tempest-grupa-vs-hildur` opens with
 * the boss casting `Śpiew zagłady` — one message carrying ten `+oth_dmg`
 * figures, one per side-mate — before any snapshot exists, so every combatant in
 * that fight has an entry health the capture does not hold. It is also the
 * answer to the exception this file used to name: `445202` of 2026-08-06 was hit
 * before that fight's first snapshot too. One cause, and the rule beneath it has
 * no exception left.
 */
const UNKNOWN_ENTRY_HEALTH: Map<string, Set<number>> = new Map(
  CAPTURED_FIGHTS.map((fight) => {
    const opening: string[] = [];
    for (const call of fight.dump.calls) {
      if (call.combatantsBefore.length > 0) break;
      opening.push(...call.protocolMessages);
    }

    const moved = new Set<number>();
    for (const event of decodeFight(opening, composeRosterOfFight(fight))) {
      const subject =
        event.kind === "attack" ||
        event.kind === "damage-to-named-combatant" ||
        event.kind === "healing-to-named-combatant"
          ? event.targetId
          : event.kind === "health-change"
            ? event.combatantId
            : null;
      if (subject !== null) moved.add(subject);
    }
    return [fight.name, moved];
  }),
);

function hasKnownEntryHealth(reading: Reading): boolean {
  return !(UNKNOWN_ENTRY_HEALTH.get(reading.fight)?.has(reading.combatantId) ?? false);
}

const CASTS: Cast[] = CAPTURED_FIGHTS.flatMap(getCasts);
const READINGS: Reading[] = CAPTURED_FIGHTS.flatMap(getReadings);
/**
 * Everyone on the caster's side who was **standing** when the cast landed.
 *
 * ⚠️ **The dead are excluded, and the test below is why that is a rule rather
 * than a convenience.** The group fights of 2026-08-12 are the first material
 * where a cast reaches a combatant at zero health, and it restores nothing to
 * them — so a reading that expects the share to land on everyone reports healing
 * that did not happen. Two such side-mates exist across every cast in the
 * corpus, and neither was raised above zero.
 */
const SIDE_MATES: Reading[] = READINGS.filter(
  (reading) => reading.isSideMate && reading.currentHealth > 0,
);

const DEAD_SIDE_MATES: Reading[] = READINGS.filter(
  (reading) => reading.isSideMate && reading.currentHealth === 0,
);

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
  return SIDE_MATES.filter(hasKnownEntryHealth)
    .filter(
      (reading) =>
        Math.abs(getRestored(reading, ceiling(reading)) - reading.gained) >
        TOLERANCE_IN_HEALTH_POINTS,
    )
    .map(composeReport);
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
    /**
     * ⚠️ **Keyed by fight as well as by caster.** The weakening runs down within
     * one fight and starts again at the base in the next, so a combatant met in
     * two captures had both sequences concatenated into one and the second looked
     * like a share that grew. Three of ten casters broke on that reading, and
     * none of the thirteen does on this one — the rule was right and the grouping
     * was wrong, which is exactly what a combatant id shared across fights buys.
     */
    const byCaster = new Map<string, number[]>();
    for (const cast of CASTS) {
      const within = `${cast.fight}/${cast.casterId}`;
      byCaster.set(within, [...(byCaster.get(within) ?? []), cast.percent]);
    }

    const disagreeing = [...byCaster].filter(([, shares]) =>
      shares.some((share, use) => {
        const base = shares[0] ?? 0;
        return Math.abs(share - base * (1 - WEAKENING_PER_USE * use)) > Number.EPSILON;
      }),
    );
    expect(disagreeing).toEqual([]);
  });

  /**
   * What the exclusion above claims, stated so it cannot become a silent filter.
   * A team heal reaches the standing only: the dead are named by the side the
   * same way everyone else is, and gain nothing.
   */
  test("a side-mate at zero health is reached and restored nothing", () => {
    expect(DEAD_SIDE_MATES.length).toBeGreaterThan(0);
    expect(DEAD_SIDE_MATES.filter((reading) => reading.gained !== 0).map(composeReport)).toEqual(
      [],
    );
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
   * The cap, on every reading whose entry health the capture actually holds.
   *
   * The help says the effect cannot restore a combatant past the health it began
   * the fight with, and that now reproduces every such reading without exception.
   * It did not always: this test named one refusal, `445202` of 2026-08-06, and
   * `2026-08-14-tempest-grupa-vs-hildur` arrived with sixteen more. Every one of
   * the seventeen is a combatant whose health had already moved when the first
   * snapshot was taken, so the figure they were measured against was never their
   * entry health — see `UNKNOWN_ENTRY_HEALTH`. A rule with one exception invites
   * a second reading; this one has none, and what looked like an exception was a
   * missing input.
   */
  test("the cap is the health the fight began with, wherever that is known", () => {
    expect(getDisagreeing((reading) => reading.startingHealth)).toEqual([]);
  });

  /** The reading that fits worse, kept so the two cannot quietly swap places. */
  test("and not maximum health, which the same material refuses", () => {
    expect(getDisagreeing((reading) => reading.maximumHealth).length).toBeGreaterThan(
      getDisagreeing((reading) => reading.startingHealth).length,
    );
  });

  /**
   * The exclusion above, stated so it cannot become a silent filter — the shape
   * this file already holds `DEAD_SIDE_MATES` to.
   *
   * Both halves matter. Something has to be excluded, or the guard is arithmetic
   * about nothing; and something has to survive, or the cap is confirmed against
   * an empty set. The second is the one that would fail quietly: sixteen of the
   * twenty readings in the fight that forced this rule are excluded by it.
   */
  test("readings are excluded for a missing entry health, and not all of them are", () => {
    const withoutEntryHealth = SIDE_MATES.filter((reading) => !hasKnownEntryHealth(reading));
    expect(withoutEntryHealth.length).toBeGreaterThan(0);
    expect(SIDE_MATES.filter(hasKnownEntryHealth).length).toBeGreaterThan(0);
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
