import { describe, expect, test } from "bun:test";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS, type CapturedFight } from "@/tests/captured-fight-catalog.ts";

/**
 * The decoder checked against something that is not the decoder.
 *
 * Two numbers meet here that nothing in this project reconciles: maximum and
 * current health, which come from the combatant snapshots taken around each
 * engine call, and the health percentage the protocol states inside the message
 * itself. If the damage we decode is right, the second follows from the first.
 *
 * Coverage grows as the decoder learns more keys. Today it is small, and the
 * "there is something to compare" test below is what stops that from passing
 * silently as zero.
 */

/** The protocol states percentages rounded to two places, so the comparison is too. */
const TOLERANCE_IN_PERCENTAGE_POINTS = 0.02;

/**
 * Keys observed alongside damage that carry no health change of their own.
 *
 * This is an assumption held by this test, not a claim the decoder relies on:
 * if one of them did move health, the comparisons below would stop matching,
 * which is the correct way to find out.
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
  return key.slice(1, 4) === "dmg" && key !== "+oth_dmg";
}

type Comparison = {
  fight: string;
  call: number;
  combatantId: number;
  statedPercent: number;
  percentFromDecodedDamage: number;
};

/**
 * Compares only the first message in a call to mention a combatant. After that
 * the running health depends on every earlier message, including ones carrying
 * keys the decoder cannot read yet.
 */
function getComparisons(fight: CapturedFight): Comparison[] {
  const comparisons: Comparison[] = [];

  for (const call of fight.dump.calls) {
    const healthBefore = new Map(call.combatantsBefore.map((c) => [c.id, c.health.current]));
    const alreadyMentioned = new Set<number>();

    for (const message of call.protocolMessages) {
      const parsed = parseProtocolMessage(message);
      const target = parsed.target;
      const mentioned = [parsed.actor?.combatantId, parsed.target?.combatantId];

      const unaccounted = parsed.parameters.some(
        ({ key }) => !isDamageKey(key) && !KEYS_WITH_NO_HEALTH_EFFECT.includes(key),
      );
      const startingHealth = target === null ? undefined : healthBefore.get(target.combatantId);
      const maximumHealth =
        target === null ? undefined : fight.maximumHealthByCombatantId.get(target.combatantId);

      if (
        target !== null &&
        target.healthPercent !== null &&
        !alreadyMentioned.has(target.combatantId) &&
        startingHealth !== undefined &&
        maximumHealth !== undefined &&
        !unaccounted
      ) {
        const taken = decodeFight([message])
          .filter((event) => event.kind === "attack")
          .flatMap((event) => event.taken)
          .reduce((total, damage) => total + damage.amount, 0);

        if (taken > 0) {
          comparisons.push({
            fight: fight.name,
            call: call.index,
            combatantId: target.combatantId,
            statedPercent: target.healthPercent,
            percentFromDecodedDamage: ((startingHealth - taken) / maximumHealth) * 100,
          });
        }
      }

      for (const id of mentioned) if (id !== undefined) alreadyMentioned.add(id);
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
