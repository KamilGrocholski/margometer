/**
 * The rule `docs/protocol-keys.md` states for `legbon_lastheal`, re-earned on
 * every run.
 *
 * It needs a file of its own because the health witness cannot reach it: the one
 * capture carrying this key has no snapshot taken before its messages — the whole
 * fight arrives in a single engine call — so the replay produces no comparison
 * for that fight at all, and a verdict resting on the witness would be resting on
 * nothing (AGENTS.md §7.5).
 *
 * What stands in for the snapshot is the protocol's own percentages, two
 * messages of them: the health a combatant is stated to hold before the blow, and
 * the health they are stated to hold after it. The figure this key announces is
 * exactly what closes the gap between them, and the help's trigger is checked on
 * the same arithmetic.
 */

import { describe, expect, test } from "bun:test";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS, composeRosterOfFight } from "@/tests/captured-fight-catalog.ts";

const LAST_HEAL_KEY = "legbon_lastheal";

/**
 * The share of the pool the help gives as the trigger: below it, and once per
 * fight, the holder is healed (article view,372 at the engine name `lastheal`,
 * read 2026-08-12).
 */
const TRIGGER_SHARE_OF_MAXIMUM = 0.18;

/** Percentages arrive rounded to two places, so a point of health is the floor. */
const TOLERANCE_IN_HEALTH_POINTS = 1;

type Occurrence = {
  fight: string;
  call: number;
  /** The healed combatant, resolved from the name the value carries. */
  combatantId: number;
  maximumHealth: number;
  /** What the protocol stated for them in the message before this one. */
  healthBefore: number;
  /** What it states for them on the message carrying the heal. */
  healthAfter: number;
  /** Everything the blow itself took off them, decoded. */
  damage: number;
  healing: number;
};

/**
 * Every occurrence, with the health either side of it read from the protocol.
 *
 * The percentage before comes from the **previous message that stated one** for
 * that combatant, which is the independent half: nothing about it is derived from
 * the figure under test, so the two can disagree.
 */
const OCCURRENCES: Occurrence[] = CAPTURED_FIGHTS.flatMap((fight) => {
  const roster = composeRosterOfFight(fight);
  const maximumHealth = fight.maximumHealthByCombatantId;

  return fight.dump.calls.flatMap((call) => {
    const found: Occurrence[] = [];
    const statedPercent = new Map<number, number>();

    for (const message of call.protocolMessages) {
      const parsed = parseProtocolMessage(message);
      const events = decodeFight([message], roster);
      const healing = events.filter((event) => event.kind === "healing-to-named-combatant");

      for (const event of healing) {
        const combatantId = event.targetId;
        const maximum = combatantId === null ? undefined : maximumHealth.get(combatantId);
        const before = combatantId === null ? undefined : statedPercent.get(combatantId);
        // Nothing is skipped quietly: an occurrence this cannot measure fails the
        // completeness test below instead of shrinking the material silently.
        if (combatantId === null || maximum === undefined || before === undefined) continue;
        if (event.targetHealthPercent === null) continue;

        found.push({
          fight: fight.name,
          call: call.index,
          combatantId,
          maximumHealth: maximum,
          healthBefore: (before / 100) * maximum,
          healthAfter: (event.targetHealthPercent / 100) * maximum,
          damage: events
            .filter((event) => event.kind === "attack")
            .flatMap((event) => event.taken)
            .reduce((total, one) => total + one.amount, 0),
          healing: event.amount,
        });
      }

      for (const side of [parsed.actor, parsed.target]) {
        if (side === null || side.healthPercent === null) continue;
        statedPercent.set(side.combatantId, side.healthPercent);
      }
    }

    return found;
  });
});

const CARRYING_MESSAGES = CAPTURED_FIGHTS.flatMap((fight) =>
  fight.dump.calls.flatMap((call) =>
    call.protocolMessages.filter((message) =>
      parseProtocolMessage(message).parameters.some(
        (parameter) => parameter.key === LAST_HEAL_KEY,
      ),
    ),
  ),
);

describe("healing stated against a name", () => {
  test("the captures carry it", () => {
    expect(CARRYING_MESSAGES.length).toBeGreaterThan(0);
  });

  // Every one of them, not merely the ones that happened to be measurable —
  // otherwise a reading that silently stopped resolving names would pass here.
  test("every occurrence is read, and every one is measurable", () => {
    expect(OCCURRENCES.length).toBe(CARRYING_MESSAGES.length);
  });

  test("closes the gap between the health stated before and after", () => {
    for (const one of OCCURRENCES) {
      const expected = one.healthBefore - one.damage + one.healing;
      expect(
        Math.abs(expected - one.healthAfter),
        `${one.fight} call ${one.call} combatant ${one.combatantId}`,
      ).toBeLessThanOrEqual(TOLERANCE_IN_HEALTH_POINTS);
    }
  });

  /**
   * The help's own trigger, on our material: the blow has to leave the holder
   * below 18% of the pool, and not dead. Both halves matter — a heal firing
   * above the threshold would mean the article describes something else.
   */
  test("fires only where the blow left the combatant under the documented share", () => {
    for (const one of OCCURRENCES) {
      const struck = one.healthBefore - one.damage;
      const label = `${one.fight} call ${one.call} combatant ${one.combatantId}`;
      expect(struck, label).toBeGreaterThan(0);
      expect(struck / one.maximumHealth, label).toBeLessThan(TRIGGER_SHARE_OF_MAXIMUM);
    }
  });

  /**
   * And what the aggregate does with it: the healing lands on the row of the
   * combatant the name resolves to, under the key that announced it, and nobody
   * is credited with giving it — the protocol names no healer and the help's
   * answer, that the bonus is the holder's own, is not something the protocol
   * states (`docs/protocol-keys.md`).
   */
  test("reaches the healed combatant's row, and no giver's", () => {
    for (const fight of CAPTURED_FIGHTS) {
      const carried = OCCURRENCES.filter((one) => one.fight === fight.name);
      if (carried.length === 0) continue;

      const statistics = composeFightStatistics(
        fight.dump.calls.flatMap((call) =>
          decodeFight(call.protocolMessages, composeRosterOfFight(fight)),
        ),
      );

      for (const one of carried) {
        const row = statistics.byCombatantId.get(one.combatantId);
        const own = carried
          .filter((other) => other.combatantId === one.combatantId)
          .reduce((total, other) => total + other.healing, 0);
        expect(row?.healedBySource.get(LAST_HEAL_KEY), fight.name).toBe(own);
        // And in the row's own total, not only in the breakdown beside it: a
        // reading that filed the source and forgot the sum would leave the panel
        // showing a figure its own parts do not add up to.
        expect(row).toBeDefined();
        expect(
          [...(row?.healedBySource.values() ?? [])].reduce((total, one) => total + one, 0),
          fight.name,
        ).toBe(row?.healed ?? -1);
      }

      const given = [...statistics.byCombatantId.values()].reduce(
        (total, row) => total + row.healingGiven,
        0,
      );
      const received = [...statistics.byCombatantId.values()].reduce(
        (total, row) => total + row.healed,
        0,
      );
      // The healing this key carries is received by somebody and given by
      // nobody, so it is exactly the gap between the two directions.
      expect(received - given, fight.name).toBeGreaterThanOrEqual(
        carried.reduce((total, one) => total + one.healing, 0),
      );
    }
  });
});
