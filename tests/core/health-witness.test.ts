import { describe, expect, test } from "bun:test";
import { composeDecimalText } from "@/libs/number.ts";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
  decodeFight,
  UNATTRIBUTABLE_HEALTH_KEYS,
  UNDERSTOOD_PROTOCOL_KEYS,
} from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterFromSnapshots,
  composeRosterOfFight,
  type CapturedFight,
} from "@/tests/captured-fight-catalog.ts";
import { getKeysWithHealthEffect } from "@/tests/protocol-key-register.ts";

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

/** The protocol states percentages rounded to two places, so the comparison is too. */
const TOLERANCE_IN_PERCENTAGE_POINTS = 0.02;

function isDamageKey(key: string): boolean {
  return key.slice(1, 4) === "dmg";
}

/**
 * The health figures this replay adds up itself, and therefore does not have to
 * skip. Not a claim about the game — a description of the arithmetic below,
 * which is why it is derived from the decoder rather than listed here: the
 * replay consumes every event the decoder produces, so what it accounts for is
 * exactly what the decoder reads.
 */
/**
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
  if (UNATTRIBUTABLE_HEALTH_KEYS.includes(key)) return false;
  return isDamageKey(key) || UNDERSTOOD_PROTOCOL_KEYS.includes(key);
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

    for (const { message, parsed } of messages) {
      const events = decodeFight([message], roster);

      const takenByTarget = events
        .filter((event) => event.kind === "attack")
        .flatMap((event) => event.taken)
        .reduce((total, damage) => total + damage.amount, 0);

      const target = parsed.target;
      if (target !== null && runningHealth.has(target.combatantId)) {
        runningHealth.set(
          target.combatantId,
          (runningHealth.get(target.combatantId) ?? 0) - takenByTarget,
        );
      }

      for (const event of events) {
        if (event.kind !== "health-change") continue;
        if (event.combatantId === null || !runningHealth.has(event.combatantId)) continue;
        runningHealth.set(
          event.combatantId,
          (runningHealth.get(event.combatantId) ?? 0) + event.amount,
        );
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
          runningHealth.set(
            event.targetId,
            (runningHealth.get(event.targetId) ?? 0) - event.damage.amount,
          );
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
          runningHealth.set(
            event.targetId,
            (runningHealth.get(event.targetId) ?? 0) + event.amount,
          );
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
 */
const COMPARISONS_BY_FIGHT: Record<string, number> = {
  "2026-08-04-tempest-lowca-vs-odyncze": 20,
  "2026-08-06-tempest-grupa-vs-hildur": 790,
  "2026-08-11-tempest-tancerz-vs-wermont": 51,
  "2026-08-12-experimental-tancerz-vs-wojownik": 0,
  "2026-08-12-tempest-grupa-vs-draugr-1": 392,
  "2026-08-12-tempest-grupa-vs-draugr-2": 748,
  "2026-08-12-tempest-grupa-vs-hildur-1": 851,
  "2026-08-12-tempest-grupa-vs-hildur-2": 679,
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
 * The register is an input to the replay above, so "every key it excludes is
 * excluded" is a tautology and would light nothing. What can be checked is
 * whether the material still says what the verdict claims.
 */
describe("every health verdict in the register is one the captures still refuse", () => {
  const refutable = KEYS_MOVING_HEALTH.filter((key) => !isAccountedByTheReplay(key));

  test("there are verdicts to re-earn", () => {
    expect(refutable.length).toBeGreaterThan(0);
  });

  // The attribution clause is the load-bearing part. Admitting a key drags its
  // neighbours' calls in too, so most of the disagreements that appear belong to
  // other keys; a guard satisfied by those would keep passing long after this key
  // stopped mattering.
  test.each(refutable)("admitting `%s` disagrees on a message carrying it", (key) => {
    const admitted = KEYS_MOVING_HEALTH.filter((other) => other !== key);
    const carryingKey = getDisagreements(
      CAPTURED_FIGHTS.flatMap((fight) => getComparisons(fight, admitted)),
    ).filter((disagreement) =>
      parseProtocolMessage(disagreement.message).parameters.some(
        (parameter) => parameter.key === key,
      ),
    );

    expect(carryingKey.map(composeReport).slice(0, 1)).not.toEqual([]);
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
    expect(replayed.length).toBe(237);
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
