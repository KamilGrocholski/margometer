/**
 * The decoder checked against something that is not the decoder.
 *
 * Two numbers meet here that nothing in this project reconciles: maximum and
 * current health, taken from the combatant snapshots around each engine call,
 * and the health percentage the protocol states inside each message. If the
 * damage we decode is right, the second follows from the first.
 *
 * Which keys make a call unjudgeable is not decided here any more — it is read
 * from `docs/protocol-keys.md`, where each verdict carries its evidence and a
 * guard below re-earns it on every run.
 */

import { describe, expect, test } from "bun:test";
import { composeDecimalText, getNumberFromText } from "@/libs/number.ts";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { decodeFight, isDamageKey, UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage, type ProtocolMessage } from "@/src/core/protocol-message.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterFromSnapshots,
  composeRosterOfFight,
  type CapturedFight,
} from "@/tests/captured-fight-catalog.ts";
import { getKeysWithHealthEffect } from "@/tests/protocol-key-register.ts";
import { setRunningTotal } from "@/libs/running-total.ts";

/** The protocol states percentages rounded to two places, so the comparison is too. */
const TOLERANCE_IN_PERCENTAGE_POINTS = 0.02;

/**
 * The health figures this replay adds up itself, and therefore does not have to
 * skip. Not a claim about the game — a description of the arithmetic below,
 * which is why it is derived from the decoder rather than listed here: the
 * replay consumes every event the decoder produces, so what it accounts for is
 * exactly what the decoder reads.
 *
 * Whether the replay can **add** this key's figure — which is not the same as
 * whether the decoder understands it, and the difference is load-bearing.
 *
 * ⚠️ `healall_per` is read now, and the replay still cannot account for it: it
 * heals a whole side and names only the caster. Written as `UNDERSTOOD` alone,
 * this predicate would stop skipping those twelve calls the moment the key was
 * read, and every one of them would disagree — for the good reason that the
 * health really did move. The decoder states which keys it reads without being
 * able to place them, and this reads that list rather than guessing.
 */
function isAccountedByTheReplay(key: string): boolean {
  return isDamageKey(key) || UNDERSTOOD_PROTOCOL_KEYS.includes(key);
}

/**
 * The team heal, restated rather than imported — deliberately, and this is the
 * one restatement in the file that carries the whole measurement.
 *
 * `composeSizedTeamHeals` cannot be called here even if we wanted to: it seeds
 * its running health from what the **fight** was entered with and walks forward
 * from there, while this replay re-seeds from the snapshot at the head of every
 * call. Those are two different bases, and the cap is taken against current
 * health, so handing this the module's own figures would be comparing the module
 * to itself against the wrong state.
 *
 * So the arithmetic is written out again, from the register's own words, and what
 * closes is the protocol's stated percentages — a different body of evidence from
 * the snapshot deltas `tests/core/combatant-health.test.ts` measures against
 * (§9.3 on a duplication that is the point of the test saying so).
 */
const TEAM_HEAL_KEY = "healall_per";

/** What one cast restores to one side-mate, or null where an input is missing. */
function getRestoredByTeamHeal(
  declaredShare: number,
  combatantId: number,
  fight: CapturedFight,
  currentHealth: number | undefined,
): number | null {
  const maximumHealth = fight.maximumHealthByCombatantId.get(combatantId);
  const entryHealth = fight.entryHealthByCombatantId.get(combatantId);
  if (maximumHealth === undefined || entryHealth === undefined || currentHealth === undefined) {
    return null;
  }
  if (currentHealth <= 0) return 0;
  return Math.min(
    Math.floor((declaredShare / 100) * maximumHealth),
    Math.max(0, entryHealth - currentHealth),
  );
}

/** The share a message states for the team heal, where it states one. */
function getDeclaredShare(parsed: ProtocolMessage): number | null {
  const stated = parsed.parameters.find((parameter) => parameter.key === TEAM_HEAL_KEY);
  if (stated === undefined || stated.value === null) return null;
  return getNumberFromText(stated.value);
}

type Comparison = {
  fight: string;
  call: number;
  combatantId: number;
  message: string;
  statedPercent: number;
  percentFromDecodedDamage: number;
};

/**
 * Replays each engine call, subtracting the damage we decoded from the health the
 * snapshot started with, and compares the running figure against what each message
 * states — for **both** sides, not only the target. The actor side carries a
 * percentage far more often than the target does, and every health-moving key
 * discovered so far reports its victim there.
 *
 * A call carrying a health figure the replay cannot add is skipped **whole**.
 * Dropping only the combatants such a message names is not enough: an
 * area-effect heal names nobody it heals, so the health moves somewhere the
 * message never mentions and every later comparison in that call is wrong.
 */
function getComparisons(fight: CapturedFight, keysMovingHealth: readonly string[]): Comparison[] {
  const comparisons: Comparison[] = [];

  for (const call of fight.dump.calls) {
    const messages = call.protocolMessages.map((message) => ({
      message,
      parsed: parseProtocolMessage(message),
    }));

    const unaccounted = messages.some(({ parsed }) =>
      parsed.parameters.some(
        ({ key }) => keysMovingHealth.includes(key) && !isAccountedByTheReplay(key),
      ),
    );
    if (unaccounted) continue;

    const runningHealth = new Map(call.combatantsBefore.map((c) => [c.id, c.health.current]));
    // The roster the decoder would have at run time, rebuilt from what the
    // engine call started with. Resolving names is the decoder's job now, so the
    // replay hands it the same material and reads the id off the event.
    const roster = composeRosterFromSnapshots(call.combatantsBefore);
    const sideById = new Map(call.combatantsBefore.map((c) => [c.id, c.team]));

    /**
     * A cast this replay cannot size costs the **whole call**, and it always did —
     * only the reason has changed. It used to be that nothing could size one at
     * all; now it is that this particular call lacks an input, and the health
     * still moved somewhere the messages never mention.
     */
    const unsizeable = messages.some(({ parsed }) => {
      const declaredShare = getDeclaredShare(parsed);
      if (declaredShare === null) return parsed.parameters.some((p) => p.key === TEAM_HEAL_KEY);
      const casterSide = sideById.get(parsed.actor?.combatantId ?? -1);
      if (casterSide === undefined) return true;
      const mates = call.combatantsBefore.filter((c) => c.team === casterSide);
      const hasStandingAlly = mates.some(
        (c) => c.id !== parsed.actor?.combatantId && c.health.current > 0,
      );
      if (!hasStandingAlly) return true;
      return mates.some(
        (c) => getRestoredByTeamHeal(declaredShare, c.id, fight, c.health.current) === null,
      );
    });
    if (unsizeable) continue;

    for (const { message, parsed } of messages) {
      const events = decodeFight([message], roster);

      const takenByTarget = events
        .filter((event) => event.kind === "attack")
        .flatMap((event) => event.taken)
        .reduce((total, damage) => total + damage.amount, 0);

      const target = parsed.target;
      if (target !== null && runningHealth.has(target.combatantId)) {
        setRunningTotal(runningHealth, target.combatantId, -takenByTarget);
      }

      for (const event of events) {
        if (event.kind !== "health-change") continue;
        if (event.combatantId === null || !runningHealth.has(event.combatantId)) continue;
        setRunningTotal(runningHealth, event.combatantId, event.amount);
      }

      for (const event of events) {
        if (event.kind !== "damage-to-named-combatant") continue;
        // An unresolved name would leave the running total short and the next
        // comparison would blame the game for it. That it never happens on this
        // material is not assumed here — it is asserted below, where a future
        // capture that breaks it says so plainly instead of arriving as a
        // mysterious disagreement.
        if (event.targetId === null) continue;
        if (runningHealth.has(event.targetId)) {
          setRunningTotal(runningHealth, event.targetId, -event.damage.amount);
        }
      }

      // The other direction of the same shape, and it moves health the same way
      // the keys above do. Kept beside them rather than left out because a
      // capture carrying it *and* an opening snapshot would otherwise disagree
      // by exactly the healing, and blame the game for it.
      for (const event of events) {
        if (event.kind !== "healing-to-named-combatant") continue;
        if (event.targetId === null) continue;
        if (runningHealth.has(event.targetId)) {
          setRunningTotal(runningHealth, event.targetId, event.amount);
        }
      }

      // The team heal, applied where the message states one. It reaches combatants
      // the message never names, which is why the whole call is skipped above when
      // it cannot be sized — dropping only the named ones would leave every later
      // comparison in the call short by somebody else's healing.
      const declaredShare = getDeclaredShare(parsed);
      const casterSide = sideById.get(parsed.actor?.combatantId ?? -1);
      if (declaredShare !== null && casterSide !== undefined) {
        for (const combatant of call.combatantsBefore) {
          if (combatant.team !== casterSide) continue;
          const restored = getRestoredByTeamHeal(
            declaredShare,
            combatant.id,
            fight,
            runningHealth.get(combatant.id),
          );
          if (restored !== null) setRunningTotal(runningHealth, combatant.id, restored);
        }
      }

      for (const side of [parsed.actor, parsed.target]) {
        if (side === null || side.healthPercent === null) continue;
        // A combatant that died clamps at zero, so the overkill is invisible and
        // the arithmetic cannot close. Measured: the blow that ended the group
        // fight dealt more than the boss had left.
        if (side.healthPercent <= 0) continue;

        const remaining = runningHealth.get(side.combatantId);
        const maximumHealth = fight.maximumHealthByCombatantId.get(side.combatantId);
        if (remaining === undefined || maximumHealth === undefined) continue;

        comparisons.push({
          fight: fight.name,
          call: call.index,
          combatantId: side.combatantId,
          message,
          statedPercent: side.healthPercent,
          percentFromDecodedDamage: (remaining / maximumHealth) * 100,
        });
      }
    }
  }

  return comparisons;
}

function getDisagreements(comparisons: readonly Comparison[]): Comparison[] {
  return comparisons.filter(
    (comparison) =>
      Math.abs(comparison.percentFromDecodedDamage - comparison.statedPercent) >
      TOLERANCE_IN_PERCENTAGE_POINTS,
  );
}

function composeReport(comparison: Comparison): string {
  return `${comparison.fight} call ${comparison.call} id ${comparison.combatantId}: protocol says ${comparison.statedPercent}, decoded damage gives ${composeDecimalText(comparison.percentFromDecodedDamage, 2)}`;
}

const KEYS_MOVING_HEALTH = getKeysWithHealthEffect("moves health");
const COMPARISONS = CAPTURED_FIGHTS.flatMap((fight) => getComparisons(fight, KEYS_MOVING_HEALTH));

/**
 * How much of each fight this witness actually reaches.
 *
 * ⚠️ **The floor here used to be one.** `expect(COMPARISONS.length)
 * .toBeGreaterThan(0)` was written against comparing nothing at all — the right
 * worry, and a bound so far below the real figure that coverage could have
 * collapsed from three and a half thousand comparisons to a single one with the
 * gate staying green. This is the strongest guard in the repository, and the
 * thing guarding *it* was the weakest statement that could be made.
 *
 * That is §7.5's rule about zero, pointed inward: a floor at zero holds one side
 * of a boundary, and the side it holds is the one nothing was ever going to
 * cross. Recorded per fight rather than as a total, because a total that fell by
 * 851 would not say which fight stopped being witnessed — and losing one whole
 * capture is exactly the shape this is meant to catch.
 *
 * A capture added or a skip rule changed will move these numbers, and the
 * numbers then have to be restated. That is the friction this exists for: how
 * much of the material the arithmetic actually closes over is a fact about the
 * project, not a detail.
 *
 * `2026-08-12-experimental-tancerz-vs-wojownik` is **0 on purpose** and is
 * listed rather than omitted: its whole fight arrives in one call with no
 * opening snapshot, so the replay cannot seed a running total. Written down so
 * that a fight falling to zero reads as a change and not as a fight that was
 * never there.
 *
 * ⚠️ **Thirteen of these rose when the team heal became a figure**, and that rise
 * is the point rather than a side effect: those calls used to be declined outright
 * because health moved by an amount nothing could size. They are judged now, and
 * they agree.
 *
 * `2026-08-15-…-draugr-1` is the one carrying the key that did not move, and the
 * reason is not the key: all three of its casts sit in an opening call of 297
 * messages with no snapshot beside it, so the replay could never seed a running
 * total there and produced no comparison for that call either way.
 */
const COMPARISONS_BY_FIGHT: Record<string, number> = {
  "2026-08-04-tempest-lowca-vs-odyncze": 20,
  "2026-08-06-tempest-grupa-vs-hildur": 945,
  "2026-08-11-tempest-tancerz-vs-wermont": 51,
  "2026-08-12-experimental-tancerz-vs-wojownik": 0,
  "2026-08-12-tempest-grupa-vs-draugr-1": 624,
  "2026-08-12-tempest-grupa-vs-draugr-2": 753,
  "2026-08-12-tempest-grupa-vs-hildur-1": 904,
  "2026-08-12-tempest-grupa-vs-hildur-2": 825,
  "2026-08-14-tempest-grupa-vs-draugr-1": 586,
  "2026-08-14-tempest-grupa-vs-draugr-2": 765,
  "2026-08-14-tempest-grupa-vs-hildur": 901,
  "2026-08-15-tempest-grupa-vs-draugr-1": 235,
  "2026-08-15-tempest-grupa-vs-draugr-2": 746,
  "2026-08-15-tempest-grupa-vs-hildur-1": 179,
  "2026-08-15-tempest-grupa-vs-hildur-2": 795,
  "2026-08-15-tempest-grupa-vs-hildur-3": 758,
  "2026-08-15-tempest-grupa-vs-hildur-4": 758,
};

describe("decoded damage against the health the protocol states", () => {
  test("reaches exactly as much of each fight as it is recorded to", () => {
    const counted = Object.fromEntries(CAPTURED_FIGHTS.map((fight) => [fight.name, 0]));
    for (const one of COMPARISONS) counted[one.fight] = (counted[one.fight] ?? 0) + 1;

    expect(counted).toEqual(COMPARISONS_BY_FIGHT);
  });

  test("every comparison agrees", () => {
    expect(getDisagreements(COMPARISONS).map(composeReport)).toEqual([]);
  });
});

/**
 * What this replay still declines, and the proof that it declines anything at all.
 *
 * ⚠️ **This block used to ask a different question, and its old subject no longer
 * exists.** It filtered the health-moving keys down to those the replay could not
 * add, and re-earned each one by admitting it and watching the arithmetic break.
 * That set is empty now: every key that moves health is a figure the replay can
 * account for, which is the whole of what this round did.
 *
 * The skipping has not gone anywhere, though — it moved from the **key** to the
 * **call**. A cast whose inputs this replay does not hold still costs its entire
 * call, because the health reached combatants the message never names. So what is
 * checked here is that the skip is still exercised and still finds something: a
 * probe that skips nothing is indistinguishable from one that stopped looking,
 * which is the failure the block has always existed to prevent.
 */
describe("what the replay still declines to judge", () => {
  /** Calls carrying a cast, and how many of them produced no comparison at all. */
  const CASTS_BY_FIGHT = CAPTURED_FIGHTS.map((fight) => {
    const judged = new Set(
      COMPARISONS.filter((one) => one.fight === fight.name).map((one) => one.call),
    );
    const carrying = fight.dump.calls.filter((call) =>
      call.protocolMessages.some((message) =>
        parseProtocolMessage(message).parameters.some(
          (parameter) => parameter.key === TEAM_HEAL_KEY,
        ),
      ),
    );
    return {
      name: fight.name,
      carrying: carrying.length,
      skipped: carrying.filter((call) => !judged.has(call.index)).length,
    };
  });

  test("the corpus carries casts, or there is nothing here to decline", () => {
    expect(CASTS_BY_FIGHT.reduce((total, of) => total + of.carrying, 0)).toBeGreaterThan(0);
  });

  /**
   * Both directions, and the second is the one that would fail quietly. Something
   * has to be judged, or the agreement above is measured on a corpus with every
   * interesting call removed; and something has to be declined, or the machinery
   * that declines is dead code passing by never running.
   */
  test("some calls carrying a cast are judged and some are declined", () => {
    const skipped = CASTS_BY_FIGHT.reduce((total, of) => total + of.skipped, 0);
    const judged = CASTS_BY_FIGHT.reduce((total, of) => total + of.carrying - of.skipped, 0);
    expect(judged).toBeGreaterThan(0);
    expect(skipped).toBeGreaterThan(0);
  });

  /**
   * And the reason a call goes unjudged is the recording's rather than the key's.
   *
   * ⚠️ **This asserted a different thing until every cast could be sized.** It
   * named the two fights whose entry health could not be recovered; both are
   * recovered now, and what is left unjudged is the opening call of a capture that
   * has no snapshot in front of it at all. The replay seeds its running total from
   * `combatantsBefore`, so a call without one produces no comparison whatever it
   * carries — that is a property of how the fight was recorded, and it costs the
   * casts in that call along with everything else in it.
   */
  test("and a call carrying a cast is judged wherever the recording gives it a snapshot", () => {
    const unjudged = CAPTURED_FIGHTS.flatMap((fight) => {
      const judged = new Set(
        COMPARISONS.filter((one) => one.fight === fight.name).map((one) => one.call),
      );
      return fight.dump.calls
        .filter(
          (call) =>
            call.combatantsBefore.length > 0 &&
            !judged.has(call.index) &&
            call.protocolMessages.some((message) =>
              parseProtocolMessage(message).parameters.some(
                (parameter) => parameter.key === TEAM_HEAL_KEY,
              ),
            ),
        )
        .map((call) => `${fight.name} call ${call.index}`);
    });
    expect(unjudged).toEqual([]);
  });

  /**
   * The register's own claim, still re-earned: every key it says moves health is
   * one this replay accounts for. Written as an equality rather than as "the
   * excluded set is empty", so the day a key arrives that cannot be added, this
   * says which one.
   */
  test("every key the register says moves health is one the replay can add", () => {
    expect(KEYS_MOVING_HEALTH.length).toBeGreaterThan(0);
    expect(KEYS_MOVING_HEALTH.filter((key) => !isAccountedByTheReplay(key))).toEqual([]);
  });
});

/**
 * The replay moves health stated against a name only because every such name in
 * this material resolves to exactly one combatant. That is a property of the
 * captures, not a law — two combatants sharing a name do occur here, just never
 * as the subject of these keys — so it is checked rather than relied on.
 *
 * ⚠️ **Over the calls the replay can use, which is not all of them.** A call
 * whose opening snapshot is empty gives the decoder no roster and the replay no
 * health to run down, so it produces no comparison and an unresolved name there
 * costs nothing. The duel capture is entirely of that kind: its whole fight
 * arrives in one call, and its six named figures are held by the guard below
 * instead — against the roster the live session accumulates, which is where
 * they do have to resolve.
 */
function isNamedSubject(event: BattleEvent): boolean {
  return event.kind === "damage-to-named-combatant" || event.kind === "healing-to-named-combatant";
}

function getNamedSubjectId(event: BattleEvent): number | null {
  return isNamedSubject(event) && "targetId" in event ? event.targetId : null;
}

describe("health stated against a name", () => {
  const replayed = CAPTURED_FIGHTS.flatMap((fight) =>
    fight.dump.calls
      .filter((call) => call.combatantsBefore.length > 0)
      .flatMap((call) =>
        decodeFight(
          call.protocolMessages,
          composeRosterFromSnapshots(call.combatantsBefore),
        ).filter(isNamedSubject),
      ),
  );

  /**
   * The same floor, and the same reason it is a figure rather than "more than
   * none": these are the health figures the protocol states against a **name**,
   * and every one of them has to find its combatant. A count that quietly fell
   * would take the claim below it with it — "every time" over three of them is
   * not the same promise as "every time" over all of them.
   */
  test("occurs as often as it is recorded to", () => {
    expect(replayed.length).toBe(552);
  });

  test("names a combatant the replay's own roster can identify, every time", () => {
    expect(replayed.filter((event) => getNamedSubjectId(event) === null)).toEqual([]);
  });

  /**
   * And the same over the whole corpus, against the roster a running fight
   * holds: the session merges what every payload states, so nothing there is
   * hostage to which call a figure happened to land in.
   */
  const live = CAPTURED_FIGHTS.flatMap((fight) =>
    fight.dump.calls.flatMap((call) =>
      decodeFight(call.protocolMessages, composeRosterOfFight(fight)).filter(isNamedSubject),
    ),
  );

  test("resolves against the roster of the whole fight, in every capture", () => {
    expect(live.length).toBeGreaterThan(replayed.length);
    expect(live.filter((event) => getNamedSubjectId(event) === null)).toEqual([]);
  });
});
