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
import { decodeFight, UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

const DESTRUCTION_KEYS = ["+abdest_per", "+abmdest_per"];
const DECLARATION_KEY = "active_absorbdest_per";
const SKILL_NAME_KEY = "tspell";

/**
 * The shares the skill announces, as the captures state them.
 *
 * ⚠️ **Two, not one.** This was `5` alone while every caster in the corpus
 * declared 5, and the group fights of 2026-08-12 field one who declares 8. The
 * share is a property of the **caster**, not of the skill: `skillId=86` carries
 * both, and no caster in the material ever declares two — which is the same
 * shape `healall_per` has, where grouping by skill would have read a
 * contradiction into figures that had none.
 */
const DECLARED_SHARE_PERCENTS = [5, 8];

/**
 * One unit of rounding slack. The protocol states whole points, so a destruction
 * of `0.05 × current` can land a point above the exact ratio without the share
 * being any larger — 6017 → 5717 is the closest observed and needs it.
 */
const ROUNDING_SLACK = 1;

type Report = {
  fight: string;
  call: number;
  targetId: number | null;
  actorId: number | null;
  value: number;
};

function getReports(key: string): Report[] {
  return CAPTURED_FIGHTS.flatMap((fight) =>
    fight.dump.calls.flatMap((call) =>
      call.protocolMessages.flatMap((message) => {
        const parsed = parseProtocolMessage(message);
        return parsed.parameters.flatMap((parameter) => {
          if (parameter.key !== key || parameter.value === null) return [];
          const value = getIntegerFromText(parameter.value);
          if (value === null) return [];
          return [
            {
              fight: fight.name,
              call: call.index,
              targetId: parsed.target?.combatantId ?? null,
              actorId: parsed.actor?.combatantId ?? null,
              value,
            },
          ];
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
      return [
        {
          fight: fight.name,
          keys: parameters.map((parameter) => parameter.key),
          value: declared.value,
          actorId: parseProtocolMessage(message).actor?.combatantId ?? null,
        },
      ];
    }),
  ),
);

/** Who announced the share, per fight — a combatant id means nothing across two. */
const DECLARING_CASTERS = new Set(
  DECLARATIONS.flatMap(({ fight, actorId }) => (actorId === null ? [] : [`${fight}/${actorId}`])),
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
   * has already shrunk. This is what ties `active_absorbdest_per` to figures the
   * protocol never labels.
   *
   * ⚠️ **Only reports from a caster who announced the share.** That restriction
   * is new, and the material forced it: one combatant in
   * `2026-08-12-tempest-grupa-vs-hildur-2` reports this key without ever
   * announcing a share, and reports a constant 59 on both members while the pool
   * beside it falls in the thousands. Whatever that is, it is not a reading of
   * the pool, and folding it into the sequence made the pool appear to rise. The
   * test below names it rather than leaving it quietly filtered out.
   */
  test("each report falls by at least the share the skill declares", () => {
    /**
     * The **smallest** share any skill declares, because the pool only has to
     * shrink by at least that much. Two shares are stated in the material and
     * the ceiling has to admit both — see the declaration tests below.
     */
    const ceiling = 1 - Math.min(...DECLARED_SHARE_PERCENTS) / 100;
    for (const key of DESTRUCTION_KEYS) {
      /**
       * ⚠️ **Keyed by fight as well as by target, and that is not tidying.** The
       * running value was carried across fight boundaries, so the same boss met
       * twice took its first fight's remaining absorption into its second — where
       * the pool has of course been refilled, and the figure rises. It read as
       * the rule being broken; it was the reading being wrong, and it only stayed
       * invisible while no combatant appeared in two captures.
       */
      const previousByTarget = new Map<string, number>();
      const growing: { key: string; call: number; previous: number; value: number }[] = [];

      for (const { fight, call, targetId, actorId, value } of getReports(key)) {
        if (targetId === null) continue;
        if (!DECLARING_CASTERS.has(`${fight}/${actorId}`)) continue;
        const within = `${fight}/${targetId}`;
        const previous = previousByTarget.get(within);
        if (previous !== undefined && value > previous * ceiling + ROUNDING_SLACK) {
          growing.push({ key, call, previous, value });
        }
        previousByTarget.set(within, value);
      }
      expect(growing).toEqual([]);
    }
  });

  // The pool runs out, and the protocol says so rather than stopping. A floor of
  // zero is the help's rule showing itself in our own material.
  /**
   * The reader the rule above excludes, stated rather than filtered away.
   *
   * Without this the restriction would be a silent narrowing: a caster could
   * stop announcing tomorrow and take its reports out of the check with it, and
   * nothing would say so. What the constant it reports counts is not settled
   * here — only that it is not the falling pool the rest of the family reports.
   */
  test("exactly one reader reports without ever announcing a share", () => {
    const silent = new Set(
      DESTRUCTION_KEYS.flatMap(getReports)
        .filter(({ fight, actorId }) => !DECLARING_CASTERS.has(`${fight}/${actorId}`))
        .map(({ fight, actorId }) => `${fight}/${actorId}`),
    );
    expect([...silent]).toEqual(["2026-08-12-tempest-grupa-vs-hildur-2/440859"]);

    const values = new Set(
      DESTRUCTION_KEYS.flatMap(getReports)
        .filter(({ fight, actorId }) => !DECLARING_CASTERS.has(`${fight}/${actorId}`))
        .map(({ value }) => value),
    );
    // One figure and the floor, on both members — never the thousands the pool
    // runs to, and never stepping between them. That is why it cannot be read as
    // a pool the way everything else in this family is.
    expect([...values].sort((one, other) => other - one)).toEqual([59, 0]);
  });

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

  test("states the shares the reports are consistent with", () => {
    const stated = [...new Set(DECLARATIONS.map(({ value }) => value))].sort();
    expect(stated).toEqual(DECLARED_SHARE_PERCENTS.map(String).sort());
  });

  /**
   * What makes the two shares a property of the caster rather than a
   * contradiction: nobody in the material ever announces both. Without this the
   * constant above would just be a wider net, and a skill that really did vary
   * its share from one cast to the next would slip through it.
   */
  test("no caster ever announces two different shares", () => {
    const sharesByActor = new Map<number, Set<string | null>>();
    for (const { actorId, value } of DECLARATIONS) {
      if (actorId === null) continue;
      const seen = sharesByActor.get(actorId) ?? new Set();
      seen.add(value);
      sharesByActor.set(actorId, seen);
    }

    expect(sharesByActor.size).toBeGreaterThan(1);
    const varying = [...sharesByActor].filter(([, seen]) => seen.size > 1);
    expect(varying).toEqual([]);
  });

  /**
   * Read as a declaration on the announcement it rides, and joined to no blow.
   *
   * The join is what the protocol never states, and that has not changed: the
   * share lands in `SkillUsedEvent.declared`, beside the skill that declared it,
   * and the reports of what was actually destroyed stay where they were — in
   * `destroyed`, on the blows, in points.
   */
  test("is read on its announcement, and attached to no blow", () => {
    expect(UNDERSTOOD_PROTOCOL_KEYS).toContain(DECLARATION_KEY);

    const events = decodeFight([`1=100.00;0;tspell=Something;${DECLARATION_KEY}=5`]);
    expect(events.map((event) => event.kind)).toEqual(["skill-used"]);
    expect(events[0]).toMatchObject({
      declared: [{ effect: DECLARATION_KEY, amount: 5 }],
    });
  });
});
