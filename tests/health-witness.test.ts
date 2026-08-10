import { describe, expect, test } from "bun:test";
import { composeDecimalText } from "@/libs/number.ts";
import { decodeFight, UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterFromSnapshots,
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
function isAccountedByTheReplay(key: string): boolean {
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

describe("decoded damage against the health the protocol states", () => {
  // Without this the suite would stay green while comparing nothing at all —
  // the failure mode this project keeps naming.
  test("there is something to compare", () => {
    expect(COMPARISONS.length).toBeGreaterThan(0);
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
 * The replay subtracts damage stated against a name only because every such name
 * in this material resolves to exactly one combatant. That is a property of the
 * captures, not a law — two combatants sharing a name do occur here, just never
 * as the victim of this key — so it is checked rather than relied on.
 */
describe("damage stated against a name", () => {
  const named = CAPTURED_FIGHTS.flatMap((fight) =>
    fight.dump.calls.flatMap((call) =>
      decodeFight(call.protocolMessages, composeRosterFromSnapshots(call.combatantsBefore)).filter(
        (event) => event.kind === "damage-to-named-combatant",
      ),
    ),
  );

  test("occurs at all", () => {
    expect(named.length).toBeGreaterThan(0);
  });

  test("names a combatant the roster can identify, every time", () => {
    const unresolved = named.filter((event) => event.targetId === null).map((e) => e.targetName);
    expect(unresolved).toEqual([]);
  });
});
