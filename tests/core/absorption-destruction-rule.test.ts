/**
 * The rule `docs/protocol-keys.md` states for the absorption-destruction family,
 * re-earned on every run.
 *
 * The claim worth guarding is not that the decoder reads these keys — the
 * register already holds that — but *what the figures are*. Their names end in
 * `_per` and they are not shares: the skill announcement carries the share, and
 * the blow reports what it removed, in points. Reading the suffix instead of the
 * material would put a percentage into a slot holding quantities, where nothing
 * downstream could tell the two apart again.
 */

import { describe, expect, test } from "bun:test";
import { getIntegerFromText } from "@/libs/number.ts";
import { UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

const DESTRUCTION_KEYS = ["+abdest_per", "+abmdest_per"];
const DECLARATION_KEY = "active_absorbdest_per";
const SKILL_NAME_KEY = "tspell";

/** The share the skill announces, as the captures state it. */
const DECLARED_SHARE_PERCENT = 5;

/**
 * One unit of rounding slack. The protocol states whole points, so a destruction
 * of `0.05 × current` can land a point above the exact ratio without the share
 * being any larger — 6017 → 5717 is the closest observed and needs it.
 */
const ROUNDING_SLACK = 1;

type Report = { call: number; targetId: number | null; value: number };

function getReports(key: string): Report[] {
  return CAPTURED_FIGHTS.flatMap((fight) =>
    fight.dump.calls.flatMap((call) =>
      call.protocolMessages.flatMap((message) => {
        const parsed = parseProtocolMessage(message);
        return parsed.parameters.flatMap((parameter) => {
          if (parameter.key !== key || parameter.value === null) return [];
          const value = getIntegerFromText(parameter.value);
          if (value === null) return [];
          return [{ call: call.index, targetId: parsed.target?.combatantId ?? null, value }];
        });
      }),
    ),
  );
}

const DECLARATIONS = CAPTURED_FIGHTS.flatMap((fight) =>
  fight.dump.calls.flatMap((call) =>
    call.protocolMessages.flatMap((message) => {
      const { parameters } = parseProtocolMessage(message);
      const declared = parameters.find((parameter) => parameter.key === DECLARATION_KEY);
      if (declared === undefined) return [];
      return [{ keys: parameters.map((parameter) => parameter.key), value: declared.value }];
    }),
  ),
);

describe("what the absorption-destruction family reports", () => {
  test("the captures carry reports to check", () => {
    for (const key of DESTRUCTION_KEYS) expect(getReports(key).length).toBeGreaterThan(0);
  });

  /**
   * The reading the suffix invites, and the one the material refuses. A share
   * cannot exceed a hundred; these run into the thousands, so whatever they
   * count, it is not percent.
   */
  test("reports quantities, not the percentage its name suggests", () => {
    const asPercentage = DESTRUCTION_KEYS.flatMap(getReports).filter(({ value }) => value <= 100);
    expect(asPercentage.length).toBeLessThan(DESTRUCTION_KEYS.flatMap(getReports).length);
    expect(Math.max(...DESTRUCTION_KEYS.flatMap(getReports).map(({ value }) => value))).toBeGreaterThan(100);
  });

  /**
   * The join between the two halves of the family: the skill announces a share
   * of *current* absorption, so each report against a target can only be smaller
   * than the one before it by at least that share — the pool it is taken from
   * has already shrunk. This is what ties `active_absorbdest_per=5` to figures
   * the protocol never labels.
   */
  test("each report falls by at least the share the skill declares", () => {
    const ceiling = 1 - DECLARED_SHARE_PERCENT / 100;
    for (const key of DESTRUCTION_KEYS) {
      const previousByTarget = new Map<number, number>();
      const growing: { key: string; call: number; previous: number; value: number }[] = [];

      for (const { call, targetId, value } of getReports(key)) {
        if (targetId === null) continue;
        const previous = previousByTarget.get(targetId);
        if (previous !== undefined && value > previous * ceiling + ROUNDING_SLACK) {
          growing.push({ key, call, previous, value });
        }
        previousByTarget.set(targetId, value);
      }
      expect(growing).toEqual([]);
    }
  });

  // The pool runs out, and the protocol says so rather than stopping. A floor of
  // zero is the help's rule showing itself in our own material.
  test("never reports a negative figure, and does reach zero", () => {
    const values = DESTRUCTION_KEYS.flatMap(getReports).map(({ value }) => value);
    expect(values.filter((value) => value < 0)).toEqual([]);
    expect(values).toContain(0);
  });

  test("both reports are read as destruction", () => {
    for (const key of DESTRUCTION_KEYS) expect(UNDERSTOOD_PROTOCOL_KEYS).toContain(key);
  });
});

describe("the declaration that carries the share", () => {
  test("the captures carry declarations to check", () => {
    expect(DECLARATIONS.length).toBeGreaterThan(0);
  });

  // Where it rides is the whole reason it is not read: a skill announcement
  // carries no damage and no target statistic, so there is no blow to attach the
  // share to without inventing the join the protocol never states.
  test("rides a skill announcement, never a blow", () => {
    const notOnAnAnnouncement = DECLARATIONS.filter(({ keys }) => !keys.includes(SKILL_NAME_KEY));
    expect(notOnAnAnnouncement).toEqual([]);
  });

  test("states the share the reports are consistent with", () => {
    const stated = [...new Set(DECLARATIONS.map(({ value }) => value))];
    expect(stated).toEqual([String(DECLARED_SHARE_PERCENT)]);
  });

  test("stays unread, because attaching it to a blow is not something the protocol states", () => {
    expect(UNDERSTOOD_PROTOCOL_KEYS).not.toContain(DECLARATION_KEY);
  });
});
