import { describe, expect, test } from "bun:test";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS, type CapturedFight } from "@/tests/captured-fight-catalog.ts";

/**
 * The decoder checked against something that is not the decoder.
 *
 * Two numbers meet here that nothing in this project reconciles: maximum and
 * current health, taken from the combatant snapshots around each engine call,
 * and the health percentage the protocol states inside each message. If the
 * damage we decode is right, the second follows from the first.
 *
 * Coverage grows as the decoder learns more keys, because a combatant is only
 * comparable while every message touching it has been fully read.
 */

/** The protocol states percentages rounded to two places, so the comparison is too. */
const TOLERANCE_IN_PERCENTAGE_POINTS = 0.02;

/**
 * Keys seen beside damage that carry no health change of their own.
 *
 * An assumption held by this test, not one the decoder relies on: if any of
 * them did move health, these comparisons would stop matching, which is the
 * right way to find out.
 */
const KEYS_WITH_NO_HEALTH_EFFECT = [
  "tspell",
  "skillId",
  "combo-max",
  "step",
  "+crit",
  "+pierce",
  "+acdmg",
  "+resdmg",
];

function isDamageKey(key: string): boolean {
  return key.slice(1, 4) === "dmg";
}

type Comparison = {
  fight: string;
  call: number;
  combatantId: number;
  statedPercent: number;
  percentFromDecodedDamage: number;
};

/**
 * Walks a call message by message, subtracting the damage we decoded from the
 * health the snapshot started with, and compares the running figure against
 * what each message states.
 *
 * A combatant touched by a message the decoder could not fully read is dropped
 * for the rest of that call: from then on the running figure is missing
 * something, and comparing it would report our own ignorance as the game's
 * error.
 */
function getComparisons(fight: CapturedFight): Comparison[] {
  const comparisons: Comparison[] = [];

  for (const call of fight.dump.calls) {
    const runningHealth = new Map(call.combatantsBefore.map((c) => [c.id, c.health.current]));
    const unaccountedFor = new Set<number>();

    for (const message of call.protocolMessages) {
      const parsed = parseProtocolMessage(message);
      const target = parsed.target;
      const decoded = decodeFight([message]);

      const readable = !parsed.parameters.some(
        ({ key }) => !isDamageKey(key) && !KEYS_WITH_NO_HEALTH_EFFECT.includes(key),
      );
      if (!readable) {
        for (const id of [parsed.actor?.combatantId, parsed.target?.combatantId]) {
          if (id !== undefined) unaccountedFor.add(id);
        }
        continue;
      }

      const takenByTarget = decoded
        .filter((event) => event.kind === "attack")
        .flatMap((event) => event.taken)
        .reduce((total, damage) => total + damage.amount, 0);

      if (target !== null && runningHealth.has(target.combatantId)) {
        runningHealth.set(
          target.combatantId,
          (runningHealth.get(target.combatantId) ?? 0) - takenByTarget,
        );
      }
      const remaining = target === null ? undefined : runningHealth.get(target.combatantId);
      const maximumHealth =
        target === null ? undefined : fight.maximumHealthByCombatantId.get(target.combatantId);
      const landed = takenByTarget > 0;

      if (
        target !== null &&
        target.healthPercent !== null &&
        // A combatant that died clamps at zero, so the overkill is invisible and
        // the arithmetic cannot close. Measured: the blow that ended the group
        // fight dealt more than the boss had left.
        target.healthPercent > 0 &&
        remaining !== undefined &&
        maximumHealth !== undefined &&
        landed &&
        !unaccountedFor.has(target.combatantId)
      ) {
        comparisons.push({
          fight: fight.name,
          call: call.index,
          combatantId: target.combatantId,
          statedPercent: target.healthPercent,
          percentFromDecodedDamage: (remaining / maximumHealth) * 100,
        });
      }
    }
  }

  return comparisons;
}

const COMPARISONS = CAPTURED_FIGHTS.flatMap(getComparisons);

describe("decoded damage against the health the protocol states", () => {
  // Without this the suite would stay green while comparing nothing at all —
  // the failure mode this project keeps naming.
  test("there is something to compare", () => {
    expect(COMPARISONS.length).toBeGreaterThan(0);
  });

  test("every comparison agrees", () => {
    const disagreements = COMPARISONS.filter(
      (comparison) =>
        Math.abs(comparison.percentFromDecodedDamage - comparison.statedPercent) >
        TOLERANCE_IN_PERCENTAGE_POINTS,
    ).map(
      (c) =>
        `${c.fight} call ${c.call} id ${c.combatantId}: protocol says ${c.statedPercent}, decoded damage gives ${c.percentFromDecodedDamage.toFixed(2)}`,
    );
    expect(disagreements).toEqual([]);
  });
});
