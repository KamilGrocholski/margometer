/**
 * `bandage` read as health returning to the combatant the message names first.
 *
 * The client settles the slot and the help settles the effect; what neither
 * states is that the figure is health at all, in this protocol's units, on this
 * material. That is what this file measures, and it is the same shape
 * `tests/core/anguish-rule.test.ts` measures for a tick: the stated percentage
 * has to move by what the figure comes to against the combatant's pool.
 *
 * ⚠️ **One occurrence, and the arithmetic is the whole of the evidence.** The
 * message names the same combatant at both ends, so no slot could be got wrong on
 * this recording alone — a later one where somebody bandages somebody else would
 * be the first to tell the two apart, and the second test below is what would
 * notice it arriving.
 *
 * The percentage this compares against is the last one the same combatant stated
 * earlier in the fight, not a snapshot: the only occurrence sits in an engine call
 * carrying 627 messages, where the witness seeds nothing to judge it with
 * (`tests/core/health-witness.test.ts`).
 */

import { describe, expect, test } from "bun:test";
import { getIntegerFromText } from "@/libs/number.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS, getMessagesOfFight } from "@/tests/captured-fight-catalog.ts";

// Restated rather than imported: this file asserts what the decoder reads, and a
// test reading the decoder's own list agrees with it by construction (§9.3).
const BANDAGE_KEY = "bandage";

/**
 * What the game's two decimals allow on either side of the comparison. The stated
 * percentage is rounded and so is the one computed from the figure, so half a
 * hundredth each way is the floor a true reading can be held to; anything looser
 * would admit a figure that is not this pool's.
 */
const ROUNDING_ALLOWANCE = 0.02;

type Occurrence = {
  fight: string;
  message: string;
  actorId: number | null;
  targetId: number | null;
  amount: number | null;
  /** What the message states for its actor, and what that combatant stated before it. */
  statedPercent: number | null;
  previousPercent: number | null;
  maximumHealth: number | null;
};

const OCCURRENCES: Occurrence[] = CAPTURED_FIGHTS.flatMap((fight) => {
  const percentByCombatantId = new Map<number, number>();
  const found: Occurrence[] = [];

  for (const message of getMessagesOfFight(fight)) {
    const parsed = parseProtocolMessage(message);
    const stated = parsed.parameters.find((parameter) => parameter.key === BANDAGE_KEY);
    if (stated !== undefined) {
      const actorId = parsed.actor?.combatantId ?? null;
      found.push({
        fight: fight.name,
        message,
        actorId,
        targetId: parsed.target?.combatantId ?? null,
        amount: stated.value === null ? null : getIntegerFromText(stated.value),
        statedPercent: parsed.actor?.healthPercent ?? null,
        previousPercent: actorId === null ? null : (percentByCombatantId.get(actorId) ?? null),
        maximumHealth:
          actorId === null ? null : (fight.maximumHealthByCombatantId.get(actorId) ?? null),
      });
    }

    // After the reading, never before it: the message states where its subject
    // ended up, and what this walk is carrying forward is where they started.
    for (const side of [parsed.actor, parsed.target]) {
      if (side !== null && side.healthPercent !== null) {
        percentByCombatantId.set(side.combatantId, side.healthPercent);
      }
    }
  }

  return found;
});

/** Every health movement the decoder produces under this key, in order. */
const DECODED = CAPTURED_FIGHTS.flatMap((fight) =>
  decodeFight(getMessagesOfFight(fight), null).flatMap((event) =>
    event.kind === "health-change" && event.source === BANDAGE_KEY ? [event] : [],
  ),
);

describe("a combatant bandaging their own wounds", () => {
  // A walk over nothing is green and proves nothing.
  test("the captures carry occurrences to check", () => {
    expect(OCCURRENCES.length).toBeGreaterThan(0);
  });

  test("every occurrence names both ends, and they are one combatant", () => {
    const otherwise = OCCURRENCES.filter(
      (one) => one.actorId === null || one.targetId === null || one.actorId !== one.targetId,
    );
    expect(otherwise.map((one) => one.message)).toEqual([]);
  });

  test("every occurrence states a whole number, and states it above zero", () => {
    expect(OCCURRENCES.filter((one) => one.amount === null).map((one) => one.message)).toEqual([]);
    expect(
      OCCURRENCES.filter((one) => one.amount !== null && one.amount <= 0).map((one) => one.message),
    ).toEqual([]);
  });

  /**
   * The measurement. Health going the other way would put the stated percentage
   * below where the combatant stood, and a figure that is not of this pool would
   * miss the move by more than the game's own rounding.
   */
  test("the stated percentage rises by what the figure comes to against the pool", () => {
    const disagreeing: (Occurrence & { moved: number | null; expected: number | null })[] = [];
    for (const one of OCCURRENCES) {
      if (
        one.amount === null ||
        one.statedPercent === null ||
        one.previousPercent === null ||
        one.maximumHealth === null ||
        one.maximumHealth === 0
      ) {
        // An input missing is a disagreement in its own right: the claim is that
        // the arithmetic closes, and it cannot close over a figure nobody has.
        disagreeing.push({ ...one, moved: null, expected: null });
        continue;
      }
      const moved = one.statedPercent - one.previousPercent;
      const expected = (one.amount / one.maximumHealth) * 100;
      if (Math.abs(moved - expected) > ROUNDING_ALLOWANCE) {
        disagreeing.push({ ...one, moved, expected });
      }
    }
    expect(disagreeing).toEqual([]);
  });

  test("the decoder produces one restoration per occurrence, on the actor", () => {
    expect(DECODED.map((event) => event.combatantId)).toEqual(
      OCCURRENCES.map((one) => one.actorId),
    );
    expect(DECODED.map((event): number | null => event.amount)).toEqual(
      OCCURRENCES.map((one) => one.amount),
    );
  });
});
