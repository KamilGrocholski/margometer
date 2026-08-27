/**
 * `wound` read as a health figure, measured where the health witness cannot look.
 *
 * `tests/core/health-witness.test.ts` is the one route by which a key that moves
 * health is admitted here, and it is not available for this one. Its only material
 * (`tests/captured-fights/2026-08-24-tempest-tropiciel-vs-centaur.json`) is a
 * single engine call with no opening snapshot, so that replay seeds no running
 * total and produces no comparison for the fight either way — reading the key or
 * leaving it unread changes nothing it reports.
 *
 * So the same evidence is chained differently. The witness starts from a snapshot
 * and walks the messages; this starts from a percentage the protocol itself stated
 * one message earlier and walks exactly one step. Both compare a figure of the
 * game's against percentages of the game's, and neither asks the decoder what it
 * thinks — which is the property that makes either of them a witness rather than a
 * restatement.
 *
 * ⚠️ **One step, and the step is the narrowing.** A tick is measured only where the
 * message immediately before it states the same combatant's percentage, because
 * anything in between could have moved that health too and the comparison would
 * blame this key for it. On this material every tick has one, which is recorded
 * below rather than assumed.
 *
 * The open alternative, deliberately not taken in the round that wrote this: teach
 * the witness to seed from the first percentage a call states where the snapshot is
 * empty. That would judge this fight in full and two others that report `0` today,
 * and it is a change to the guard the whole register leans on rather than to one
 * key's evidence.
 */

import { describe, expect, test } from "bun:test";
import { getIntegerFromText } from "@/libs/number.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

// Restated rather than imported: this file asserts what the decoder reads, and a
// test reading the decoder's own list agrees with it by construction (§9.3).
const TICK_KEY = "wound";
const ANNOUNCEMENT_KEY = "+wound";

/** The protocol states percentages rounded to two places, as the witness has it. */
const TOLERANCE_IN_PERCENTAGE_POINTS = 0.02;

type Tick = {
  fight: string;
  message: string;
  combatantId: number;
  amount: number;
  maximumHealth: number;
  /** The percentage this message states about the combatant it names. */
  statedPercent: number;
  /** What the message before it stated about that same combatant, where it did. */
  previousPercent: number | null;
  /** Whether the message names anybody at the other end. */
  hasTarget: boolean;
};

const TICKS: Tick[] = CAPTURED_FIGHTS.flatMap((fight) =>
  fight.dump.calls.flatMap((call) => {
    const parsed = call.protocolMessages.map((message) => ({
      message,
      parsed: parseProtocolMessage(message),
    }));

    return parsed.flatMap(({ message, parsed: one }, index) => {
      const stated = one.parameters.find((parameter) => parameter.key === TICK_KEY);
      if (stated === undefined || stated.value === null) return [];
      const amount = getIntegerFromText(stated.value);
      const actor = one.actor;
      if (amount === null || actor === null || actor.healthPercent === null) return [];
      const maximumHealth = fight.maximumHealthByCombatantId.get(actor.combatantId);
      if (maximumHealth === undefined) return [];

      const before = parsed[index - 1]?.parsed.actor ?? null;
      return [
        {
          fight: fight.name,
          message,
          combatantId: actor.combatantId,
          amount,
          maximumHealth,
          statedPercent: actor.healthPercent,
          previousPercent:
            before !== null && before.combatantId === actor.combatantId
              ? before.healthPercent
              : null,
          hasTarget: one.target !== null,
        },
      ];
    });
  }),
);

/**
 * Every value the key carries, taken before anything filters on shape — so a tick
 * this file could not read is visible here rather than missing from both lists.
 */
const TICK_VALUES = CAPTURED_FIGHTS.flatMap((fight) =>
  fight.dump.calls.flatMap((call) =>
    call.protocolMessages.flatMap((message) =>
      parseProtocolMessage(message)
        .parameters.filter((parameter) => parameter.key === TICK_KEY)
        .map((parameter) => ({ message, value: parameter.value })),
    ),
  ),
);

const ANNOUNCEMENTS = CAPTURED_FIGHTS.flatMap((fight) =>
  fight.dump.calls.flatMap((call) =>
    call.protocolMessages.flatMap((message) => {
      const found = parseProtocolMessage(message).parameters.filter(
        (parameter) => parameter.key === ANNOUNCEMENT_KEY,
      );
      return found.map((parameter) => ({ fight: fight.name, message, value: parameter.value }));
    }),
  ),
);

describe("the deep wound a weapon applies", () => {
  /**
   * How much of the material the comparison below actually closes over. A capture
   * added, or a tick arriving without a statement before it, moves this number and
   * the number then has to be restated — the friction is the point, because a
   * measurement that quietly stops covering anything reads exactly like one that
   * passes.
   */
  test("closes over as much of the material as it is recorded to", () => {
    expect(TICKS.length).toBe(20);
    expect(TICKS.filter((tick) => tick.previousPercent !== null).length).toBe(20);
    expect(ANNOUNCEMENTS.length).toBe(8);
  });

  test("names its victim in the actor slot and nobody at the other end", () => {
    for (const tick of TICKS) expect(tick.hasTarget, tick.message).toBe(false);
  });

  /**
   * The measurement the reading rests on: the figure the tick states is the health
   * it removed, in the game's own percentages.
   */
  test("removes exactly the health it states, against the percentage before it", () => {
    const clamped: Tick[] = [];

    for (const tick of TICKS) {
      const previousPercent = tick.previousPercent;
      if (previousPercent === null) continue;
      const expected = previousPercent - (tick.amount / tick.maximumHealth) * 100;
      // Health does not go below zero, and the last tick of a fight the victim
      // loses states more than they were holding. That one is checked as what it
      // is rather than excused by a wider tolerance.
      if (expected < 0) {
        clamped.push(tick);
        expect(tick.statedPercent, tick.message).toBe(0);
        continue;
      }
      expect(Math.abs(expected - tick.statedPercent), tick.message).toBeLessThanOrEqual(
        TOLERANCE_IN_PERCENTAGE_POINTS,
      );
    }

    // Both sides of the boundary are in the material, so neither branch above is
    // dead code somebody could delete without a test noticing (§7.5).
    expect(clamped.length).toBe(1);
    expect(TICKS.length - clamped.length).toBeGreaterThan(0);
  });

  test("reaches the decoder as that combatant losing that much", () => {
    for (const tick of TICKS) {
      const events = decodeFight([tick.message]);
      const change = events.find((event) => event.kind === "health-change");
      expect(change?.combatantId, tick.message).toBe(tick.combatantId);
      expect(change?.amount, tick.message).toBe(-tick.amount);
    }
  });

  /**
   * ⚠️ **Why the tick is charged to nobody although an announcement exists.**
   * §9.6's fourth clause needs three things, and this key has one: `+wound` is in
   * the protocol, it states **no figure**, and the help has this damage type
   * accumulate rather than be overwritten. The middle one is what this re-earns —
   * the day an announcement arrives carrying a figure, the register's `nobody` is
   * a claim somebody has to argue again rather than inherit.
   */
  test("its announcement states nothing that could identify a tick", () => {
    expect(ANNOUNCEMENTS.length).toBeGreaterThan(0);
    for (const one of ANNOUNCEMENTS) expect(one.value, one.message).toBeNull();
  });

  /**
   * ⚠️ **Every occurrence reaches the comparison above, and this is what says so.**
   * `TICKS` drops anything whose value will not read as a whole number, so a tick
   * carrying the comma pair `msg_wound_multi` composes would vanish from this file
   * altogether and every assertion would still pass. The shape is asserted where
   * nothing has filtered on it yet.
   */
  test("every occurrence states one whole figure and never the pair the client can send", () => {
    expect(TICK_VALUES.length).toBe(TICKS.length);
    for (const one of TICK_VALUES) {
      expect(one.value, one.message).not.toBeNull();
      expect(one.value?.includes(","), one.message).toBe(false);
      expect(getIntegerFromText(one.value ?? ""), one.message).not.toBeNull();
    }
  });
});
