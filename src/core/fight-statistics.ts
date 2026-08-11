/**
 * Events for one fight, added up per combatant — the numbers a panel draws.
 *
 * The panel renders what it is handed and computes nothing itself (§9.1), so
 * everything it could want to show has to be decided here, including the parts
 * that are *not* numbers: what could not be read, and what could not be put on
 * anyone's row.
 *
 * Three rules shape the type more than convenience does:
 *
 *   1. **Nothing is totalled across units.** Armour is points, resistance is
 *      percentage points, a block is damage. Each stays keyed by the token the
 *      protocol used, and there is deliberately no field summing them.
 *   2. **Raw and applied are different numbers.** The protocol states both for a
 *      blow and only the second for damage against a name, so they are separate
 *      fields rather than one that quietly means whichever was available.
 *   3. **Unattributed is shown, never guessed** (§5). A figure the log will not
 *      tie to anyone goes to its own bucket, not onto the nearest row and not
 *      into the bin.
 */

import type { BattleEvent } from "@/src/core/battle-event.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";

/**
 * One combatant's figures, and the same shape used for everything that belongs
 * to nobody.
 *
 * `dealtRaw` is absent for damage the protocol states against a name — there is
 * no second figure for it — which is exactly why it does not share a field with
 * `dealtApplied`. Adding them together would total a roll with a result.
 */
export type CombatantStatistics = {
  /** What the protocol says was put out, before reduction. Blows only. */
  dealtRaw: number;
  /** What landed, from blows this combatant struck. Comparable to `taken`. */
  dealtApplied: number;
  dealtAppliedByElement: ReadonlyMap<string, number>;
  /** What landed on this combatant. */
  taken: number;
  takenByElement: ReadonlyMap<string, number>;
  healed: number;
  /** Health lost outside a blow, as a positive figure. */
  healthLost: number;
  /** By the token the protocol used. No total — the members are different things. */
  prevented: ReadonlyMap<string, number>;
  /** By statistic token, in whatever unit that statistic uses. No total. */
  destroyed: ReadonlyMap<string, number>;
  /**
   * Flags that fired on blows this combatant **struck**, counted by token.
   *
   * Named for the blow rather than for the effect on purpose: `+crit` is the
   * striker's and `+stun` is done to the target, and the register settles whose
   * each figure is from the help rather than from the sign — which it has not
   * done for most of this family. What is true of all of them is who swung.
   */
  procsOnBlowsStruck: ReadonlyMap<string, number>;
  skillsUsed: number;
};

/**
 * What the decoder could not read, carried to the panel rather than stopping
 * here (§9.6). A total that might be too low must be markable as such, and that
 * is impossible if the aggregate forgets there was anything it could not read.
 *
 * Counted twice over, because the two answer different questions. The reason is
 * what happened to the message; the key is what a reader can act on — look up in
 * `docs/protocol-keys.md`, or quote to us in a report. A message with two unread
 * keys is one message and two occurrences, so the two totals do not agree, and
 * they are not meant to.
 */
export type ReadingGaps = {
  /** Messages that produced an unknown event — wholly or partly unread. */
  unreadableMessages: number;
  /** The decoder's own reason, with how often it arose. */
  messagesByReason: ReadonlyMap<string, number>;
  /**
   * Each key with no meaning yet, and how many times it turned up.
   *
   * Empty while every unknown message failed on its grammar rather than on a
   * key — which is a different fault and stays visible in `messagesByReason`.
   */
  occurrencesByUnreadKey: ReadonlyMap<string, number>;
};

/**
 * One side's members and their figures added together.
 *
 * Summing across a side is safe in a way summing across units is not: every
 * member's `taken` is health points, and every member's `destroyed` is added
 * per token, so nothing here totals two different things. The side is identified
 * by the bare team number — which of them is the watcher's own is not decided
 * here, and is not in the material (`combatant-roster.ts`).
 */
export type SideStatistics = {
  combatantIds: readonly number[];
  totals: CombatantStatistics;
};

export type FightStatistics = {
  byCombatantId: ReadonlyMap<number, CombatantStatistics>;
  /** Empty without a roster: sides come from the roster, never from the events. */
  bySide: ReadonlyMap<number, SideStatistics>;
  /**
   * Combatants no roster could place, kept apart rather than dropped or put on a
   * side that would then be wrong. Everyone lands here when there is no roster
   * at all — a fight joined in progress still shows its rows, ungrouped.
   */
  combatantIdsWithoutSide: readonly number[];
  /** Figures the log ties to nobody. Same shape, never folded into a row. */
  unattributed: CombatantStatistics;
  reading: ReadingGaps;
  outcome: { result: "won" | "lost"; combatantNames: string[] } | null;
};

/** Mutable twin of the public type, so the public one can stay read-only. */
type Row = {
  dealtRaw: number;
  dealtApplied: number;
  dealtAppliedByElement: Map<string, number>;
  taken: number;
  takenByElement: Map<string, number>;
  healed: number;
  healthLost: number;
  prevented: Map<string, number>;
  destroyed: Map<string, number>;
  procsOnBlowsStruck: Map<string, number>;
  skillsUsed: number;
};

function composeRow(): Row {
  return {
    dealtRaw: 0,
    dealtApplied: 0,
    dealtAppliedByElement: new Map(),
    taken: 0,
    takenByElement: new Map(),
    healed: 0,
    healthLost: 0,
    prevented: new Map(),
    destroyed: new Map(),
    procsOnBlowsStruck: new Map(),
    skillsUsed: 0,
  };
}

/** Adds to the running total this token already carries, starting one at zero. */
function setRunningTotal(totals: Map<string, number>, token: string, amount: number): void {
  totals.set(token, (totals.get(token) ?? 0) + amount);
}

/** Merges one row's figures into another, token by token so no unit is crossed. */
function setTotalsFrom(into: Row, member: CombatantStatistics): void {
  into.dealtRaw += member.dealtRaw;
  into.dealtApplied += member.dealtApplied;
  into.taken += member.taken;
  into.healed += member.healed;
  into.healthLost += member.healthLost;
  into.skillsUsed += member.skillsUsed;

  const keyed: Array<[Map<string, number>, ReadonlyMap<string, number>]> = [
    [into.dealtAppliedByElement, member.dealtAppliedByElement],
    [into.takenByElement, member.takenByElement],
    [into.prevented, member.prevented],
    [into.destroyed, member.destroyed],
    [into.procsOnBlowsStruck, member.procsOnBlowsStruck],
  ];
  for (const [totals, from] of keyed) {
    for (const [token, amount] of from) setRunningTotal(totals, token, amount);
  }
}

/**
 * The roster is optional and its absence is not an error: a fight can be joined
 * in progress, and rows must still be produced. What is lost is the grouping,
 * and that loss is stated rather than hidden — every combatant turns up in
 * `combatantIdsWithoutSide`.
 */
export function composeFightStatistics(
  events: readonly BattleEvent[],
  roster: CombatantRoster | null = null,
): FightStatistics {
  const rows = new Map<number, Row>();
  const unattributed = composeRow();
  const messagesByReason = new Map<string, number>();
  const occurrencesByUnreadKey = new Map<string, number>();
  let unreadableMessages = 0;
  let outcome: FightStatistics["outcome"] = null;

  // A row appears for anyone the protocol names, so a combatant who only ever
  // took damage still has one. Null goes to the bucket rather than to a row
  // keyed by a made-up id.
  function getRow(combatantId: number | null): Row {
    if (combatantId === null) return unattributed;
    const existing = rows.get(combatantId);
    if (existing !== undefined) return existing;
    const fresh = composeRow();
    rows.set(combatantId, fresh);
    return fresh;
  }

  for (const event of events) {
    switch (event.kind) {
      case "attack": {
        const actor = getRow(event.actorId);
        const target = getRow(event.targetId);

        for (const damage of event.dealt) actor.dealtRaw += damage.amount;

        // The same figures twice, deliberately: what the target lost is what the
        // actor landed. One blow, two rows, and no third number invented.
        for (const damage of event.taken) {
          actor.dealtApplied += damage.amount;
          setRunningTotal(actor.dealtAppliedByElement, damage.damageType, damage.amount);
          target.taken += damage.amount;
          setRunningTotal(target.takenByElement, damage.damageType, damage.amount);
        }

        // Both belong to the target — `battle-event.ts` says so, and the help
        // rather than the sign is what settled it.
        for (const stopped of event.prevented) {
          setRunningTotal(target.prevented, stopped.prevention, stopped.amount);
        }
        for (const destruction of event.destroyed) {
          setRunningTotal(target.destroyed, destruction.statistic, destruction.amount);
        }

        for (const proc of event.procs) setRunningTotal(actor.procsOnBlowsStruck, proc, 1);
        break;
      }

      case "damage-to-named-combatant": {
        // Already reduced, and with no raw figure beside it, so it can only join
        // the applied totals. An unresolved name lands on nobody.
        const { amount, damageType } = event.damage;
        const actor = getRow(event.actorId);
        const target = getRow(event.targetId);

        actor.dealtApplied += amount;
        setRunningTotal(actor.dealtAppliedByElement, damageType, amount);
        target.taken += amount;
        setRunningTotal(target.takenByElement, damageType, amount);
        break;
      }

      case "health-change": {
        const subject = getRow(event.combatantId);
        if (event.amount >= 0) subject.healed += event.amount;
        else subject.healthLost += -event.amount;
        break;
      }

      case "skill-used": {
        getRow(event.actorId).skillsUsed += 1;
        break;
      }

      case "fight-outcome": {
        outcome = { result: event.result, combatantNames: event.combatantNames };
        break;
      }

      case "unknown-message": {
        unreadableMessages += 1;
        setRunningTotal(messagesByReason, event.reason, 1);
        for (const key of event.unreadKeys) setRunningTotal(occurrencesByUnreadKey, key, 1);
        break;
      }

      case "declaration": {
        // Deliberately nothing. A declaration is a figure no total here counts
        // (`battle-event.ts`), and an empty case is the difference between
        // deciding that and forgetting it.
        break;
      }

      default: {
        /**
         * The compiler's own exhaustiveness check, and it is load-bearing: §4
         * makes the contract `[ASK]` because a variant added to `BattleEvent`
         * and forgotten here produces totals that quietly shrink. Without this
         * the switch simply falls through and says nothing. Unreachable at run
         * time by construction, which is why it computes rather than throws — an
         * exception here would reach the game engine.
         */
        const unhandled: never = event;
        void unhandled;
        break;
      }
    }
  }

  // Grouped after the fact rather than during the loop: a figure lands on two
  // rows whose sides differ, so accumulating sides inline would mean deciding
  // twice per figure which side each half belongs to. Summing finished rows
  // cannot get that wrong.
  const bySide = new Map<number, { combatantIds: number[]; totals: Row }>();
  const combatantIdsWithoutSide: number[] = [];

  for (const [combatantId, row] of rows) {
    const side = roster?.byId.get(combatantId)?.side;
    if (side === undefined) {
      combatantIdsWithoutSide.push(combatantId);
      continue;
    }
    const group = bySide.get(side) ?? { combatantIds: [], totals: composeRow() };
    group.combatantIds.push(combatantId);
    setTotalsFrom(group.totals, row);
    bySide.set(side, group);
  }

  return {
    byCombatantId: rows,
    bySide,
    combatantIdsWithoutSide,
    unattributed,
    reading: { unreadableMessages, messagesByReason, occurrencesByUnreadKey },
    outcome,
  };
}
