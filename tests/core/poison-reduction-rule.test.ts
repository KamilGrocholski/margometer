/**
 * The rule `docs/protocol-keys.md` states for `-poison_lowdmg_per`, re-earned on
 * every run.
 *
 * The entry's conclusion — that a key carrying a plain figure must stay unread —
 * is the kind that reads as an oversight to whoever meets it next, so the reason
 * is held here rather than only in prose (AGENTS.md §7.5). What makes it right is
 * that the figure is a *share already applied*: the damage beside it is reported
 * net, so reading it as anything the panel adds up would count a reduction that
 * has already happened.
 */

import { describe, expect, test } from "bun:test";
import { getIntegerFromText } from "@/libs/number.ts";
import { UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import { getKeysWithHealthEffect } from "@/tests/protocol-key-register.ts";

const REDUCTION_KEY = "-poison_lowdmg_per";
const DAMAGE_TO_NAMED_KEY = "+oth_dmg";

/** The dealt half of the damage family, by the same shape rule the decoder uses. */
function isDealtDamageKey(key: string): boolean {
  return key.startsWith("+") && key.slice(1, 4) === "dmg";
}

type Occurrence = {
  values: (string | null)[];
  /** The message's own target if the blow damaged it, plus every combatant it names. */
  combatantsDamaged: number;
  /** One per element, so a blow of cold and fire counts twice. */
  damageElements: number;
};

const OCCURRENCES: Occurrence[] = CAPTURED_FIGHTS.flatMap((fight) =>
  fight.dump.calls.flatMap((call) =>
    call.protocolMessages.flatMap((message) => {
      const { parameters } = parseProtocolMessage(message);

      const values = parameters
        .filter((parameter) => parameter.key === REDUCTION_KEY)
        .map((parameter) => parameter.value);
      if (values.length === 0) return [];

      const keys = parameters.map((parameter) => parameter.key);
      const named = keys.filter((key) => key === DAMAGE_TO_NAMED_KEY).length;
      const elements = keys.filter(isDealtDamageKey).length;

      return [
        {
          values,
          combatantsDamaged: named + (elements > 0 ? 1 : 0),
          damageElements: named + elements,
        },
      ];
    }),
  ),
);

describe("what `-poison_lowdmg_per` reports", () => {
  test("the captures carry occurrences to check", () => {
    expect(OCCURRENCES.length).toBeGreaterThan(0);
  });

  test("arrives once per combatant the message reports damage against", () => {
    const disagreeing = OCCURRENCES.filter(
      ({ values, combatantsDamaged }) => values.length !== combatantsDamaged,
    );
    expect(disagreeing).toEqual([]);
  });

  /**
   * The reading the same material rejects, kept as a test so the distinction
   * cannot quietly collapse back. A blow of two elements is one reduction, not
   * two — counting elements holds for only part of the captures, and a rule that
   * holds for part of the evidence is the one that produces a number too high.
   */
  test("and not once per damage element, which the same material rules out", () => {
    const byElement = OCCURRENCES.filter(
      ({ values, damageElements }) => values.length === damageElements,
    );
    expect(byElement.length).toBeLessThan(OCCURRENCES.length);
  });

  // What separates it from `+crit` and `+pierce`, which the decoder reads as bare
  // flags: those carry nothing, and a figure dropped beside one sends it back to
  // unread. This key always carries one, so that family was never open to it.
  test("always carries a figure, unlike the flags an attack also reports", () => {
    const withoutFigure = OCCURRENCES.flatMap(({ values }) => values).filter(
      (value) => value === null || getIntegerFromText(value) === null,
    );
    expect(withoutFigure).toEqual([]);
  });

  // The entry's conclusion. Nothing here reads a share, and the damage beside it
  // is already net — so reading this key would either double the reduction or
  // need a slot that means something no other key means.
  test("stays unread, because the damage beside it is already reported net", () => {
    expect(UNDERSTOOD_PROTOCOL_KEYS).not.toContain(REDUCTION_KEY);
  });

  /**
   * What keeps the evidence above from going vacuous. "Already net" is earned by
   * `tests/health-witness.test.ts` agreeing on the calls that carry this key —
   * and it only reaches them while the register makes no health claim here. File
   * one, and every such call is skipped whole and the verdict quietly stops
   * being checked by anything.
   */
  test("makes no call unjudgeable, which is what leaves the witness to earn it", () => {
    expect(getKeysWithHealthEffect("moves health")).not.toContain(REDUCTION_KEY);
  });
});
