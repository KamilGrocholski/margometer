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
import { decodeFight, UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
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

  /**
   * The entry's conclusion, in the form the contract can now hold.
   *
   * The damage beside it is already net, so this share is subtracted from
   * nothing and totalled with nothing — it is a **declaration**. Reading it as
   * points would invent a unit; reading it as a reduction would take it twice.
   * Until `AttackEvent` had a slot for a stated input, refusing to read it at all
   * was the only way to say that; the claim held here is the stronger one.
   */
  test("is read as a declaration, and reduces nothing a second time", () => {
    expect(UNDERSTOOD_PROTOCOL_KEYS).toContain(REDUCTION_KEY);

    const statistics = composeFightStatistics(
      decodeFight(["1=90.00;2=50.00;+dmg=500;-dmg=400;-poison_lowdmg_per=10"]),
    );
    expect(statistics.byCombatantId.get(2)?.taken).toBe(400);
    expect(statistics.byCombatantId.get(1)?.dealtRaw).toBe(500);
    expect(statistics.reading.unreadableMessages).toBe(0);
  });

  /**
   * The five messages in the group fight whose damage is **all** aimed at names.
   *
   * They carry no `+dmg`/`-dmg` of their own, so before this key was read they
   * produced no attack event at all — now they produce one carrying nothing but
   * the declaration. That is the honest reading of an area blow, and it must stay
   * empty: the damage itself belongs to the named combatants and is counted
   * exactly once, through `damage-to-named-combatant`.
   */
  test("an area blow reported entirely against names counts once, not twice", () => {
    const events = decodeFight([
      "1=90.00;2=50.00;-poison_lowdmg_per=10;+oth_dmg=300,g,Gracz 1(80.00%)",
    ]);
    const attack = events.find((event) => event.kind === "attack");

    expect(attack).toMatchObject({
      dealt: [],
      taken: [],
      prevented: [],
      destroyed: [],
      procs: [],
      declared: [{ effect: REDUCTION_KEY, amount: 10 }],
    });
    expect(events.some((event) => event.kind === "damage-to-named-combatant")).toBe(true);
    expect(events.some((event) => event.kind === "unknown-message")).toBe(false);
  });

  /**
   * What keeps the evidence above from going vacuous. "Already net" is earned
   * by `tests/core/health-witness.test.ts` agreeing on the calls that carry this
   * key — and it only reaches them while the register makes no health claim
   * here. File one, and every such call is skipped whole and the verdict
   * quietly stops being checked by anything.
   */
  test("makes no call unjudgeable, which is what leaves the witness to earn it", () => {
    expect(getKeysWithHealthEffect("moves health")).not.toContain(REDUCTION_KEY);
  });
});
