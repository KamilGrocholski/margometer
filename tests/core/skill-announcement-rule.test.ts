/**
 * What a skill announcement carries, and what `combo-max` is doing on it.
 *
 * This file exists because the register was wrong. It said an announcement
 * carries no damage at all and that whatever the skill does arrives in a later
 * message — true of the damage family, which is what had been measured, and
 * false of the protocol: damage aimed at a **name** rides the announcement
 * itself, and so does healing. The claim and its correction are both held here,
 * because the wrong version was the kind that reads as settled.
 */

import { describe, expect, test } from "bun:test";
import { getIntegerFromText } from "@/libs/number.ts";
import { UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import { getKeysWithHealthEffect } from "@/tests/protocol-key-register.ts";

const SKILL_NAME_KEY = "tspell";
const COMBO_LIMIT_KEY = "combo-max";
const DAMAGE_TO_NAMED_KEY = "+oth_dmg";

/** The decoder's own shape rule, so "damage key" means here what it means there. */
function isShapeDamageKey(key: string): boolean {
  return key.slice(1, 4) === "dmg";
}

/**
 * A count of combination points, not a quantity of anything. Far below what the
 * protocol's figures look like — absorption destruction runs into the thousands
 * — which is the property that keeps the two families apart by inspection.
 */
const MOST_POINTS_A_SKILL_CAN_SPEND = 100;

/** Every value the message states for the limit, so a repeat cannot hide behind the first. */
type Message = { keys: string[]; comboLimits: (string | null)[] };

const MESSAGES: Message[] = CAPTURED_FIGHTS.flatMap((fight) =>
  fight.dump.calls.flatMap((call) =>
    call.protocolMessages.map((message) => {
      const { parameters } = parseProtocolMessage(message);
      return {
        keys: parameters.map((parameter) => parameter.key),
        comboLimits: parameters
          .filter((parameter) => parameter.key === COMBO_LIMIT_KEY)
          .map((parameter) => parameter.value),
      };
    }),
  ),
);

const ANNOUNCEMENTS = MESSAGES.filter(({ keys }) => keys.includes(SKILL_NAME_KEY));

describe("what a skill announcement carries", () => {
  test("the captures carry announcements to check", () => {
    expect(ANNOUNCEMENTS.length).toBeGreaterThan(0);
  });

  // The half of the old claim that survived measuring it again.
  test("never carries a key from the damage family", () => {
    const withDamage = ANNOUNCEMENTS.filter(({ keys }) => keys.some(isShapeDamageKey));
    expect(withDamage).toEqual([]);
  });

  /**
   * The half that did not. `+oth_dmg` is damage — the register lists it as moving
   * health — and it rides the announcement, in the same message, not a later one.
   * Asserted as a presence rather than a count so the file does not go stale on
   * new material; asserted at all so nobody restores the flat denial.
   */
  test("does carry damage aimed at a name, in the same message", () => {
    const withNamedDamage = ANNOUNCEMENTS.filter(({ keys }) =>
      keys.includes(DAMAGE_TO_NAMED_KEY),
    );
    expect(withNamedDamage.length).toBeGreaterThan(0);
  });

  test("and carries keys the register says move health", () => {
    const movingHealth = getKeysWithHealthEffect("moves health");
    const withHealth = ANNOUNCEMENTS.filter(({ keys }) =>
      keys.some((key) => key !== DAMAGE_TO_NAMED_KEY && movingHealth.includes(key)),
    );
    expect(withHealth.length).toBeGreaterThan(0);
  });
});

describe("`combo-max` on that announcement", () => {
  const carrying = MESSAGES.filter(({ comboLimits }) => comboLimits.length > 0);

  test("the captures carry it at all", () => {
    expect(carrying.length).toBeGreaterThan(0);
  });

  // Where it rides is the reason it is not read: it qualifies the skill being
  // announced, and there is no blow in the message to attach it to.
  test("rides only a skill announcement", () => {
    const elsewhere = carrying.filter(({ keys }) => !keys.includes(SKILL_NAME_KEY));
    expect(elsewhere).toEqual([]);
  });

  test("states a small whole count, not a quantity", () => {
    for (const stated of carrying.flatMap(({ comboLimits }) => comboLimits)) {
      const points = stated === null ? null : getIntegerFromText(stated);
      expect(points).not.toBeNull();
      expect(points).toBeGreaterThan(0);
      expect(points).toBeLessThan(MOST_POINTS_A_SKILL_CAN_SPEND);
    }
  });

  test("stays unread, because it qualifies a skill and not a figure", () => {
    expect(UNDERSTOOD_PROTOCOL_KEYS).not.toContain(COMBO_LIMIT_KEY);
  });
});
