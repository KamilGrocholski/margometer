/**
 * `npc_heal` read as the **actor's** health, on a message that names two people.
 *
 * The arithmetic is `tests/core/health-witness.test.ts`'s and is not repeated
 * here: the replay reaches every occurrence of this key and closes, and moving
 * the figure to the target slot breaks it. What that replay cannot see is the two
 * things below.
 *
 * **The zero.** One of the three occurrences states `0`, and zero is the neutral
 * element of every sum here (§7.5) — so a reading that dropped this key entirely
 * and a reading that kept it produce the same total on that message, and the
 * witness closes either way. A zero that reaches the panel says the game reported
 * a restoration of nothing; a zero that never arrives says nothing happened. Those
 * are different claims and §9.6 keeps them apart on screen, which is only possible
 * while the event exists.
 *
 * **The two ends.** This key is the one place in the health family where a message
 * naming *two* combatants charges its figure to the first. `heal_target` names two
 * and charges the second — production build `1786514810315` composes the same
 * sentence for both, `msg_heal_target %target% %val%`, from `d.name` for that key
 * and from `c.name` for this one, where `c` is the slot `heal` above them is
 * already read in. Get it backwards and a monster's own recovery is credited to
 * the player it was attacking, on a row that looks perfectly ordinary.
 *
 * The help documents neither the key nor the mechanic — searched on article
 * `view,372` for `npc_heal` and for the mechanic by name, 2026-08-25, no
 * occurrence. So the slot rests on the client and on the witness, and this file
 * holds what neither of them states (`docs/protocol-keys.md`).
 */

import { describe, expect, test } from "bun:test";
import { getIntegerFromText } from "@/libs/number.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS, getMessagesOfFight } from "@/tests/captured-fight-catalog.ts";

// Restated rather than imported: this file asserts what the decoder reads, and a
// test reading the decoder's own list agrees with it by construction (§9.3).
const HEAL_KEY = "npc_heal";

type Occurrence = {
  message: string;
  actorId: number | null;
  targetId: number | null;
  amount: number | null;
};

const OCCURRENCES: Occurrence[] = CAPTURED_FIGHTS.flatMap((fight) =>
  fight.dump.calls.flatMap((call) =>
    call.protocolMessages.flatMap((message) => {
      const parsed = parseProtocolMessage(message);
      const stated = parsed.parameters.find((parameter) => parameter.key === HEAL_KEY);
      if (stated === undefined) return [];
      return [
        {
          message,
          actorId: parsed.actor?.combatantId ?? null,
          targetId: parsed.target?.combatantId ?? null,
          amount: stated.value === null ? null : getIntegerFromText(stated.value),
        },
      ];
    }),
  ),
);

/** Every health movement the decoder produces under this key, in order. */
const DECODED = CAPTURED_FIGHTS.flatMap((fight) =>
  decodeFight(getMessagesOfFight(fight), null).flatMap((event) =>
    event.kind === "health-change" && event.source === HEAL_KEY ? [event] : [],
  ),
);

describe("a monster restoring its own health", () => {
  // A walk over nothing is green and proves nothing.
  test("the captures carry occurrences to check", () => {
    expect(OCCURRENCES.length).toBeGreaterThan(0);
  });

  test("every occurrence names both ends", () => {
    const halfNamed = OCCURRENCES.filter(
      (one) => one.actorId === null || one.targetId === null,
    );
    expect(halfNamed.map((one) => one.message)).toEqual([]);
  });

  test("every occurrence states a whole number", () => {
    expect(OCCURRENCES.filter((one) => one.amount === null).map((one) => one.message)).toEqual([]);
  });

  /**
   * The boundary from both sides. A key read only where its figure is non-zero
   * would pass every arithmetic check in the repository and still lose a
   * restoration the game reported, so the two are counted apart here rather than
   * summed.
   */
  test("the material holds the zero and something above it", () => {
    const amounts = OCCURRENCES.map((one) => one.amount);
    expect(amounts.filter((amount) => amount === 0).length).toBeGreaterThan(0);
    expect(amounts.filter((amount) => amount !== null && amount > 0).length).toBeGreaterThan(0);
  });

  test("the zero reaches the decoder rather than being dropped on its way", () => {
    expect(DECODED.length).toBe(OCCURRENCES.length);
    expect(DECODED.filter((event) => event.amount === 0).length).toBe(
      OCCURRENCES.filter((one) => one.amount === 0).length,
    );
  });

  /**
   * And the figure lands on the combatant the message names first — the one the
   * client builds its sentence from. Compared position by position, because a
   * count that matched while the pairing was shuffled would say nothing.
   */
  test("the health moves on the actor and never on the other combatant named", () => {
    expect(DECODED.map((event) => event.combatantId)).toEqual(
      OCCURRENCES.map((one) => one.actorId),
    );
    expect(DECODED.map((event): number | null => event.amount)).toEqual(
      OCCURRENCES.map((one) => one.amount),
    );
  });
});
