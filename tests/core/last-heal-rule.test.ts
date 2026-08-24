/**
 * The rule `docs/protocol-keys.md` states for `legbon_lastheal`, re-earned on
 * every run.
 *
 * It needs a file of its own because the health witness cannot reach it: the
 * capture that carried this key first has no snapshot taken before its messages —
 * the whole fight arrives in a single engine call — so the replay produces no
 * comparison for that fight at all, and a verdict resting on the witness would be
 * resting on nothing (AGENTS.md §7.5).
 *
 * What stands in for the snapshot is the protocol's own percentages: the health a
 * combatant is stated to hold before the blow, and the health stated for them on
 * the message carrying the heal.
 *
 * ⚠️ **The trigger and the arithmetic are two separate readings, and only one of
 * them needs a history.** The share the help documents is checkable from the
 * heal's own segment alone — what the combatant held after, less what was
 * restored, is what the blow left them on — so it holds for every occurrence.
 * The gap between two stated healths does need the messages in between, and the
 * team heal is where that breaks: `healall_per` moves health the protocol states
 * nowhere else (`docs/protocol-keys.md`), so an occurrence with one of those
 * between its two statements is not measurable and says so rather than failing.
 *
 * Both distinctions arrived with the six group fights of 2026-08-15, which took
 * this key from one occurrence to five. Written for a single blow against a
 * single target, this file read the whole message's damage and a percentage from
 * whichever message last mentioned the combatant — and a group blow breaks both:
 * the damage is nine combatants' worth, and the percentage beside a name inside
 * `+oth_dmg` was never being recorded at all.
 */

import { describe, expect, test } from "bun:test";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS, composeRosterOfFight } from "@/tests/captured-fight-catalog.ts";

// Restated rather than imported: this file asserts what the decoder reads, and a
// test that reads the decoder's own list agrees with it by construction (§9.3).
const LAST_HEAL_KEY = "legbon_lastheal";

/**
 * The share of the pool the help gives as the trigger: below it, and once per
 * fight, the holder is healed (article view,372 at the engine name `lastheal`,
 * read 2026-08-12).
 */
const TRIGGER_SHARE_OF_MAXIMUM = 0.18;

/**
 * What two stated percentages can be out by, as a share of the pool.
 *
 * Derived rather than fixed. Percentages arrive rounded to two places, so each
 * one is worth up to half of 0.01% of the pool and the gap holds two of them —
 * 0.01% of maximum, which is under two points on a 19 000 pool and over three on
 * a 32 000 one. A flat point was the old floor and it was right for the first
 * capture's pool and wrong for the group fights': the widest true gap here is
 * 1.7 points, and it is on the largest pool in the material.
 */
const TOLERANCE_SHARE_OF_MAXIMUM = 0.0001;

type Occurrence = {
  fight: string;
  call: number;
  /** The healed combatant, resolved from the name the value carries. */
  combatantId: number;
  maximumHealth: number;
  /** What the protocol states for them on the message carrying the heal. */
  healthAfter: number;
  healing: number;
  /**
   * What the protocol last stated for them before this message, from the call's
   * opening snapshot or from any segment since. Null where the call opened with
   * no snapshot and nothing had stated one yet.
   */
  healthBefore: number | null;
  /** What this message took off **this** combatant, and nobody else. */
  damage: number;
  /**
   * Whether a heal the protocol does not size moved health since that statement.
   * The arithmetic cannot close across one, and that is a fact about the team
   * heal rather than about this key.
   */
  isCloudedByUnsizedHealing: boolean;
};

/**
 * What this message took off **this** combatant before the heal fired, and
 * nobody else.
 *
 * ⚠️ **The heal's own percentage is the anchor, and it is stated by more than one
 * segment.** The game emits the bonus *before* the blow that triggered it and
 * gives both the resulting percentage, so a segment carrying the heal's own
 * figure belongs to the same instant however far down the message it sits. What
 * comes after states a different one and happened later.
 *
 * ⚠️ **This read the whole message's damage and closed on every occurrence for
 * three releases.** It could only ever be wrong where a group blow struck the
 * healed combatant *again* after the bonus fired, and no recording carried one
 * until `2026-08-23-tempest-grupa-vs-hildur-auto`: there combatant 466747 takes
 * 2 798, is healed 7 987 alongside a 2 416 hit stating the same 40.00%, and is
 * then struck for 2 971 more. Charging that last hit to the gap put the reading
 * 2 971 out on a pool of 29 823, where the whole tolerance is under three points.
 */
function getDamageUpToTheHeal(
  events: readonly BattleEvent[],
  combatantId: number,
  healedPercent: number,
): number {
  const about = events.flatMap((event, at) => {
    if (event.kind === "damage-to-named-combatant" && event.targetId === combatantId) {
      return [{ at, percent: event.targetHealthPercent, amount: event.damage.amount }];
    }
    if (event.kind === "attack" && event.targetId === combatantId) {
      const taken = event.taken.reduce((sum, hit) => sum + hit.amount, 0);
      return [{ at, percent: event.targetHealthPercent, amount: taken }];
    }
    // The heal itself, at nothing: it takes no health off, and it is here so its
    // own segment can be what anchors the group below.
    if (event.kind === "healing-to-named-combatant" && event.targetId === combatantId) {
      return [{ at, percent: event.targetHealthPercent, amount: 0 }];
    }
    return [];
  });

  // The last segment about this combatant that still states the heal's own
  // figure. Everything past it is a later moment; tests keep `!` (§9.5).
  const sharing = about.filter((one) => one.percent === healedPercent);
  const last = sharing.length === 0 ? null : sharing[sharing.length - 1]!.at;
  if (last === null) return 0;
  return about
    .filter((one) => one.at <= last)
    .reduce((total, one) => total + one.amount, 0);
}

const OCCURRENCES: Occurrence[] = CAPTURED_FIGHTS.flatMap((fight) => {
  const roster = composeRosterOfFight(fight);
  const maximumHealth = fight.maximumHealthByCombatantId;

  return fight.dump.calls.flatMap((call) => {
    const found: Occurrence[] = [];
    // Seeded from the snapshot the call opened with, which is the same source
    // the health witness replays from. Without it the first heal in a call has
    // no independent "before" at all, and two occurrences did not — a count of
    // the corpus is deliberately not written beside it, because that one moves
    // with the next recording and this one does not (§5).
    const statedPercent = new Map(
      call.combatantsBefore.map((combatant) => [combatant.id, combatant.health.percent]),
    );
    const clouded = new Set<number>();

    for (const message of call.protocolMessages) {
      const parsed = parseProtocolMessage(message);
      const events = decodeFight([message], roster);

      for (const event of events) {
        if (event.kind !== "healing-to-named-combatant") continue;
        const combatantId = event.targetId;
        const maximum = combatantId === null ? undefined : maximumHealth.get(combatantId);
        // Nothing is skipped quietly: an occurrence this cannot resolve fails the
        // completeness test below instead of shrinking the material silently.
        if (combatantId === null || maximum === undefined) continue;
        if (event.targetHealthPercent === null) continue;

        const before = statedPercent.get(combatantId);
        found.push({
          fight: fight.name,
          call: call.index,
          combatantId,
          maximumHealth: maximum,
          healthAfter: (event.targetHealthPercent / 100) * maximum,
          healing: event.amount,
          healthBefore: before === undefined ? null : (before / 100) * maximum,
          damage: getDamageUpToTheHeal(events, combatantId, event.targetHealthPercent),
          isCloudedByUnsizedHealing: clouded.has(combatantId),
        });
      }

      // A heal that reaches a whole side while the message names only its caster
      // clouds everybody, and only a fresh statement clears it.
      if (events.some((event) => event.kind === "unaccounted-health")) {
        for (const id of maximumHealth.keys()) clouded.add(id);
      }
      for (const side of [parsed.actor, parsed.target]) {
        if (side === null || side.healthPercent === null) continue;
        statedPercent.set(side.combatantId, side.healthPercent);
        clouded.delete(side.combatantId);
      }
      // And the percentages stated beside a **name**, which a group blow puts
      // inside its own segments and the two side slots never carry.
      for (const event of events) {
        if (event.kind !== "damage-to-named-combatant" && event.kind !== "healing-to-named-combatant") {
          continue;
        }
        if (event.targetId === null || event.targetHealthPercent === null) continue;
        statedPercent.set(event.targetId, event.targetHealthPercent);
        clouded.delete(event.targetId);
      }
    }

    return found;
  });
});

/**
 * Every segment stating the key, not every message carrying one.
 *
 * ⚠️ **One message can state it twice, and this counted messages until one did.**
 * A group blow drops two holders below the threshold at once and the client puts
 * both bonuses in the same message — `2026-08-23-tempest-grupa-vs-hildur-auto`
 * carries the first, healing 466476 and 447544 together. Counting messages made
 * the completeness test below read "one occurrence per message", which is a
 * different and false claim, and the second heal would have gone missing while
 * the test said everything was read.
 */
const CARRYING_SEGMENTS = CAPTURED_FIGHTS.flatMap((fight) =>
  fight.dump.calls.flatMap((call) =>
    call.protocolMessages.flatMap((message) =>
      parseProtocolMessage(message).parameters.filter(
        (parameter) => parameter.key === LAST_HEAL_KEY,
      ),
    ),
  ),
);

describe("healing stated against a name", () => {
  test("the captures carry it", () => {
    expect(CARRYING_SEGMENTS.length).toBeGreaterThan(0);
  });

  // Every one of them, not merely the ones that happened to be measurable —
  // otherwise a reading that silently stopped resolving names would pass here.
  test("every occurrence is read, and every one resolves to a combatant", () => {
    expect(OCCURRENCES.length).toBe(CARRYING_SEGMENTS.length);
  });

  /**
   * The help's own trigger, on our material: the blow has to leave the holder
   * below 18% of the pool, and not dead. Both halves matter — a heal firing
   * above the threshold would mean the article describes something else.
   *
   * Read from the heal's own segment and nothing else, so it holds for every
   * occurrence including the one the team heal clouds. The two closest sit at
   * 0.1714 and 0.1675 of the pool, which is what makes 18% a threshold this
   * material can actually see rather than a bound nothing approaches.
   */
  test("fires only where the blow left the combatant under the documented share", () => {
    for (const one of OCCURRENCES) {
      const struck = one.healthAfter - one.healing;
      const label = `${one.fight} call ${one.call} combatant ${one.combatantId}`;
      expect(struck, label).toBeGreaterThan(0);
      expect(struck / one.maximumHealth, label).toBeLessThan(TRIGGER_SHARE_OF_MAXIMUM);
    }
  });

  /**
   * How many of them the arithmetic can close over, recorded rather than left to
   * whatever the material happens to allow.
   *
   * §7.5's rule about floors: "the ones that worked" is a set that can shrink to
   * one without anything going red, and the whole of this file's evidence is in
   * that set.
   */
  test("closes over as much of the material as it is recorded to", () => {
    const measurable = OCCURRENCES.filter(
      (one) => one.healthBefore !== null && !one.isCloudedByUnsizedHealing,
    );
    expect(measurable.length).toBe(12);
    expect(OCCURRENCES.length - measurable.length).toBe(1);
  });

  test("closes the gap between the health stated before and after", () => {
    for (const one of OCCURRENCES) {
      if (one.healthBefore === null || one.isCloudedByUnsizedHealing) continue;
      const expected = one.healthBefore - one.damage + one.healing;
      expect(
        Math.abs(expected - one.healthAfter),
        `${one.fight} call ${one.call} combatant ${one.combatantId}`,
      ).toBeLessThanOrEqual(one.maximumHealth * TOLERANCE_SHARE_OF_MAXIMUM);
    }
  });

  /**
   * And what the aggregate does with it: the healing lands on the row of the
   * combatant the name resolves to, under the key that announced it, and nobody
   * is credited with giving it — the protocol names no healer and the help's
   * answer, that the bonus is the holder's own, is not something the protocol
   * states (`docs/protocol-keys.md`).
   */
  test("reaches the healed combatant's row, at both ends of it", () => {
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

      // The bonus is the holder's own, so the combatant the value names is both
      // ends of it: the healing is theirs to have received *and* theirs to have
      // given (§9.6, article view,372 at engine name `lastheal`, read
      // 2026-08-19). Read from both directions, because the two are written in
      // different places and a reading that filed one would leave the panel
      // showing a giver its receiver's breakdown does not know about.
      for (const one of carried) {
        const own = carried
          .filter((other) => other.combatantId === one.combatantId)
          .reduce((total, other) => total + other.healing, 0);
        const row = statistics.byCombatantId.get(one.combatantId);
        expect(row?.healedByHealerId.get(one.combatantId), fight.name).toBeGreaterThanOrEqual(own);
        expect(
          row?.healingGivenByCombatantId.get(one.combatantId),
          fight.name,
        ).toBeGreaterThanOrEqual(own);
      }

      // ⚠️ **The attacker is never the giver, and a combatant the value never
      // names carries none of it.** The message's actor is whoever struck the
      // blow, and four of the five occurrences ride a group blow whose target is a
      // third party — so a reader that took either slot would credit an attacker
      // with healing their own victim. Walked over every row rather than over the
      // occurrences, because what is being asserted is an absence.
      for (const [combatantId, row] of statistics.byCombatantId) {
        const owed = carried
          .filter((one) => one.combatantId === combatantId)
          .reduce((total, one) => total + one.healing, 0);
        expect(row.healedWithoutHealerBySource.get(LAST_HEAL_KEY), fight.name).toBeUndefined();
        expect(row.healedBySource.get(LAST_HEAL_KEY) ?? 0, `${fight.name}: ${combatantId}`).toBe(
          owed,
        );
      }
    }
  });
});
