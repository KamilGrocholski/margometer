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
 * Counted by reason rather than by key: the decoder states its reason as prose
 * and does not carry the unread keys as data. Breaking them out per key means
 * widening `UnknownMessageEvent`, which is the decoder/aggregator contract and
 * `[ASK]` under §4 — so it is not done here.
 */
export type ReadingGaps = {
  /** Messages that produced an unknown event — wholly or partly unread. */
  unreadableMessages: number;
  /** The decoder's own reason, with how often it arose. */
  messagesByReason: ReadonlyMap<string, number>;
};

export type FightStatistics = {
  byCombatantId: ReadonlyMap<number, CombatantStatistics>;
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

export function composeFightStatistics(events: readonly BattleEvent[]): FightStatistics {
  const rows = new Map<number, Row>();
  const unattributed = composeRow();
  const messagesByReason = new Map<string, number>();
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
        break;
      }
    }
  }

  return {
    byCombatantId: rows,
    unattributed,
    reading: { unreadableMessages, messagesByReason },
    outcome,
  };
}
