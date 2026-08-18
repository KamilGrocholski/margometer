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

import { composeIntegerText } from "@/libs/number.ts";
import type { AnnouncedSkill, BattleEvent } from "@/src/core/battle-event.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import { setPairRunningTotal, setRunningTotal } from "@/libs/running-total.ts";

/**
 * One skill this combatant announced, and what the game glued to it.
 *
 * Keyed by the game's own identifier where it stated one, because two skills can
 * share a name and only the id tells them apart. The name travels inside rather
 * than as the key: it is what the panel shows, and on
 * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`
 * 15 of its 197 announcements carry no id at all.
 */
export type SkillStatistics = {
  /** As the protocol states it — read at run time, never stored here. */
  skillName: string;
  /** How many times it was announced. One announcement is one use. */
  uses: number;
  /** What landed on the message the game glued to the announcement. */
  dealtApplied: number;
  dealtByTargetId: ReadonlyMap<number, number>;
  /**
   * Health restored by it, and to whom.
   *
   * ⚠️ **This is healing GIVEN and it does not compare to a row's `healed`,**
   * which is healing received. Measured on
   * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`:
   * two combatants gave 11 733 and 10 204 while receiving 6 426 and 3 651,
   * because they were healing somebody else. A panel putting the two in one section would invite
   * an addition that is not one.
   */
  healed: number;
  healedByCombatantId: ReadonlyMap<number, number>;
};

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
   * striker's and `+stun` is done to the target. The help has since settled whose
   * several more of them are, and the answer is why this name stays — they do not
   * fall the same way. `+legbon_verycrit` fires when its bearer attacks;
   * `-legbon_cleanse` fires when its bearer is hit, so it belongs to the
   * combatant who was struck, on a blow they did not throw. Which slot of the
   * message holds the bearer is not stated anywhere, so putting each effect on
   * the row it belongs to would be a join the protocol does not make (§5).
   * What is true of all of them is who swung.
   */
  procsOnBlowsStruck: ReadonlyMap<string, number>;
  skillsUsed: number;
  /**
   * How many blows this combatant struck, and the largest single one that landed.
   *
   * Blows rather than damage figures: one blow carries several elements and is
   * still one swing. `largestBlow` sums a blow's landed figures before comparing,
   * for the same reason.
   */
  blowsStruck: number;
  largestBlow: number;
  /**
   * Blows this combatant struck with no announcement over them.
   *
   * The other half of `blowsStruck`, and the one a player asks about: without it
   * the panel can say what a skill did and cannot say that somebody swung plain.
   * Measured on `tests/captured-fights/2026-08-04-tempest-lowca-vs-odyncze.json`,
   * 8 of 8, and on
   * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`,
   * 21 of 31 for one hunter — so this is most of what happens, not a corner.
   *
   * ⚠️ **Not the same claim as "used a plain attack".** A blow with nothing
   * announced over it is a plain attack *or* an extra swing the game granted and
   * does not mark as one; the protocol does not tell the two apart, so the count
   * is of blows nothing announced, and the panel says that rather than the other
   * thing.
   */
  blowsWithoutSkill: number;
  /** Who this combatant hit, and with what. The other end of `takenByActorId`. */
  dealtByTargetId: ReadonlyMap<number, ReadonlyMap<string, number>>;
  /**
   * Who hit this combatant, and with what.
   *
   * Held here rather than left for the reader to derive from everyone else's
   * `dealtByTargetId`: §9.1 says the panel computes no statistic, and a
   * derivation across every other row is a statistic.
   */
  takenByActorId: ReadonlyMap<number, ReadonlyMap<string, number>>;
  /**
   * Where health went when no blow moved it, by the key the game used.
   *
   * Two maps rather than one signed map: they answer different questions and the
   * panel shows them in different places.
   */
  healthLostBySource: ReadonlyMap<string, number>;
  healedBySource: ReadonlyMap<string, number>;
  /**
   * The part of `healedBySource` that no announcement gave a healer to.
   *
   * ⚠️ **Not a narrowing of `healedBySource` anybody can perform afterwards.**
   * That map holds every point restored, whoever was credited with it; the panel's
   * `Bez sprawcy` row holds only the points nobody was. A reader wanting to say
   * *what* that row is made of therefore has nothing to read: measured on
   * `tests/captured-fights/2026-08-12-tempest-grupa-vs-hildur-2.json`, healing with
   * no healer comes to 109 113 while `healedBySource` sums to 123 506, so the
   * second overstates the first by more than a tenth and there is no arithmetic
   * that recovers the split.
   *
   * Written in the same breath as `healedByHealerId` and exactly where that map is
   * **not** — one reading of one event, the reasoning `healingGiven` already
   * carries — so the two partition `healed` between them and cannot drift apart.
   */
  healedWithoutHealerBySource: ReadonlyMap<string, number>;
  /**
   * Who healed this combatant, where the game glued the heal to an announcement.
   *
   * Most healing has no entry here, and that is the reading rather than a gap:
   * measured on
   * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`,
   * 25 178 of 122 648 points restored carry an announcement. The rest is regeneration and self-healing that nothing
   * announces, and the panel says so rather than guessing a healer.
   */
  healedByHealerId: ReadonlyMap<number, number>;
  /**
   * Health this combatant restored to somebody, and to whom.
   *
   * The transpose of `healedByHealerId`, and held for the same reason it is —
   * a derivation across every other row is a statistic, and §9.1 says the panel
   * computes none. Healing is the one figure that reads in two directions, and
   * only one of them was ever kept.
   *
   * ⚠️ **Not the row's own `healed`, which is what it received.** The two are
   * different quantities that a shared word would merge: measured on
   * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`,
   * 25 178 points carry a healer against 122 648 restored. The gap is
   * healing nothing announced, and it belongs to nobody rather than to the
   * combatant it reached.
   */
  healingGiven: number;
  healingGivenByCombatantId: ReadonlyMap<number, number>;
  /** What this combatant announced, keyed by the game's own identifier. */
  skills: ReadonlyMap<string, SkillStatistics>;
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
  /**
   * Health the protocol says moved and no row could take, by the key that said
   * so, with how many times it happened.
   *
   * A **stronger claim** than anything above it: those say a total *may* be
   * short, this says healing *is*, by an amount nobody can state. The two are
   * kept apart because the panel has to say different things about them, and
   * because one of them may go to zero while the other does not.
   */
  unaccountedHealthBySource: ReadonlyMap<string, number>;
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
  /**
   * How the fight ended, as **two** lists of names — because the protocol states
   * two, one message naming the winners and another the losers, and every
   * capture carries exactly one of each (`tests/core/battle-event.test.ts`).
   *
   * ⚠️ **Keeping a single result made every fight a loss.** Whichever message
   * arrived last won the variable, `loser` comes second, and the panel then told
   * a player who had just killed three boars without losing a point of health
   * that they had lost. Which of these two lists is the watcher's own is not
   * decided here — that is the game layer's to say (§10, *side*).
   */
  outcome: {
    wonNames: readonly string[];
    lostNames: readonly string[];
    /**
     * The fight ended with nobody winning it. Stated on the winners' key and
     * naming no one (`fight-decoder.ts`), so it arrives beside two empty lists
     * rather than in them — and a reader asking who won gets the true answer,
     * which is nobody, instead of the answer a missing message would give.
     */
    isDrawn: boolean;
  } | null;
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
  blowsStruck: number;
  largestBlow: number;
  blowsWithoutSkill: number;
  dealtByTargetId: Map<number, Map<string, number>>;
  takenByActorId: Map<number, Map<string, number>>;
  healthLostBySource: Map<string, number>;
  healedBySource: Map<string, number>;
  healedWithoutHealerBySource: Map<string, number>;
  healedByHealerId: Map<number, number>;
  healingGiven: number;
  healingGivenByCombatantId: Map<number, number>;
  skills: Map<string, MutableSkill>;
};

/** Mutable twin of `SkillStatistics`, for the same reason as `Row`. */
type MutableSkill = {
  skillName: string;
  uses: number;
  dealtApplied: number;
  dealtByTargetId: Map<number, number>;
  healed: number;
  healedByCombatantId: Map<number, number>;
};

/**
 * A row of zeros, for somebody the aggregate never counted.
 *
 * The public face of `composeRow` below, and it exists because the same
 * twenty-three fields were being written out a third time: once as `Row`, once
 * here, and once as `EMPTY_ROW` in `src/ui/panel-reading.ts`, where a combatant
 * the protocol has not yet named is read from. §7.1's second consumer arrived
 * with the copied report, which needs the same thing for the same reason.
 *
 * ⚠️ **Zero is a measurement and this is one** (§9.6): it says the fight has
 * mentioned nobody's figure, not that the figure is unknown. What the caller
 * must not do is put it in `byCombatantId` — the aggregate is keyed on what the
 * protocol named, and `getCombatantIdsInFight` is how the other question is
 * asked without erasing the difference.
 */
export function composeEmptyCombatantStatistics(): CombatantStatistics {
  return composeRow();
}

/**
 * Everyone this fight holds, which is not the same list as everyone it counted.
 *
 * `byCombatantId` is keyed on the protocol: a row appears when somebody is
 * named. That is the right contract for a measurement and the wrong one for a
 * *roster*, and the panel wants both — a combatant who has not acted yet, and
 * whom nothing has hit, is still in the fight, and a missing row reads as
 * "there is no such person" rather than "they have not started". Measured on
 * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`: after the
 * first engine call the roster holds 11 and the aggregate 2, and somebody is
 * missing for the first 21 of its 102 calls.
 *
 * **The roster first, in its own order, then anyone counted the roster cannot
 * place.** Not the roster alone: a fight joined in progress states damage
 * against ids no roster fragment has arrived for, and dropping them would trade
 * one silence for another. The order is the game's own — `composeMergedCombatants`
 * keeps first-seen order — so the opening screen, where every figure is zero
 * and the whole list is one tie, reads in the order the client listed the
 * warriors.
 */
export function getCombatantIdsInFight(
  statistics: FightStatistics,
  roster: CombatantRoster | null,
): number[] {
  const ids = [...(roster?.byId.keys() ?? [])];
  const rostered = new Set(ids);
  for (const id of statistics.byCombatantId.keys()) {
    if (!rostered.has(id)) ids.push(id);
  }
  return ids;
}

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
    blowsStruck: 0,
    largestBlow: 0,
    blowsWithoutSkill: 0,
    dealtByTargetId: new Map(),
    takenByActorId: new Map(),
    healthLostBySource: new Map(),
    healedBySource: new Map(),
    healedWithoutHealerBySource: new Map(),
    healedByHealerId: new Map(),
    healingGiven: 0,
    healingGivenByCombatantId: new Map(),
    skills: new Map(),
  };
}


/** Merges one row's figures into another, token by token so no unit is crossed. */
function setTotalsFrom(into: Row, member: CombatantStatistics): void {
  into.dealtRaw += member.dealtRaw;
  into.dealtApplied += member.dealtApplied;
  into.blowsStruck += member.blowsStruck;
  into.blowsWithoutSkill += member.blowsWithoutSkill;
  into.largestBlow = Math.max(into.largestBlow, member.largestBlow);
  into.taken += member.taken;
  into.healed += member.healed;
  into.healingGiven += member.healingGiven;
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
  const unaccountedHealthBySource = new Map<string, number>();
  let unreadableMessages = 0;
  let outcome: FightStatistics["outcome"] = null;

  /**
   * The skill's slot on its announcer's row, created on first sight.
   *
   * Keyed by the game's identifier where there is one. Where there is not — and
   * the captures are full of it — the name is the key, which is the only thing
   * left and
   * is what the panel would show anyway. Two different skills sharing a name and
   * both lacking an id would merge; the material has never shown one, and the
   * alternative is a row nobody can label.
   */
  function getSkill(row: Row, announced: AnnouncedSkill): MutableSkill {
    const key =
      announced.skillId === null ? announced.skillName : composeIntegerText(announced.skillId);
    const existing = row.skills.get(key);
    if (existing !== undefined) return existing;
    const fresh: MutableSkill = {
      skillName: announced.skillName,
      uses: 0,
      dealtApplied: 0,
      dealtByTargetId: new Map(),
      healed: 0,
      healedByCombatantId: new Map(),
    };
    row.skills.set(key, fresh);
    return fresh;
  }

  /**
   * Adds to the announcing combatant’s skill, and does nothing at all when the
   * game glued nothing — which is most of a fight.
   *
   * The figure lands on the **announcer's** row even when the event belongs to
   * somebody else: a heal is the case that matters, and its own combatant is the
   * one healed.
   */
  function setSkillTotals(announced: AnnouncedSkill | null, add: (skill: MutableSkill) => void): void {
    if (announced === null || announced.actorId === null) return;
    add(getSkill(getRow(announced.actorId), announced));
  }

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

        // One swing, whatever it carried. Counted even when nothing landed: a
        // blow that was absorbed to nothing still happened, and a count that
        // skipped it would answer "how often did they connect" while being read
        // as "how often did they swing".
        actor.blowsStruck += 1;
        if (event.announced === null) actor.blowsWithoutSkill += 1;
        let landed = 0;

        // The same figures twice, deliberately: what the target lost is what the
        // actor landed. One blow, two rows, and no third number invented.
        for (const damage of event.taken) {
          landed += damage.amount;
          actor.dealtApplied += damage.amount;
          setRunningTotal(actor.dealtAppliedByElement, damage.damageType, damage.amount);
          target.taken += damage.amount;
          setRunningTotal(target.takenByElement, damage.damageType, damage.amount);
          if (event.targetId !== null) {
            setPairRunningTotal(actor.dealtByTargetId, event.targetId, damage.damageType, damage.amount);
          }
          if (event.actorId !== null) {
            setPairRunningTotal(target.takenByActorId, event.actorId, damage.damageType, damage.amount);
          }
        }
        actor.largestBlow = Math.max(actor.largestBlow, landed);
        setSkillTotals(event.announced, (skill) => {
          skill.dealtApplied += landed;
          if (event.targetId !== null && landed > 0) {
            skill.dealtByTargetId.set(
              event.targetId,
              (skill.dealtByTargetId.get(event.targetId) ?? 0) + landed,
            );
          }
        });

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
        if (event.targetId !== null) setPairRunningTotal(actor.dealtByTargetId, event.targetId, damageType, amount);
        if (event.actorId !== null) setPairRunningTotal(target.takenByActorId, event.actorId, damageType, amount);
        setSkillTotals(event.announced, (skill) => {
          skill.dealtApplied += amount;
          if (event.targetId !== null) {
            skill.dealtByTargetId.set(
              event.targetId,
              (skill.dealtByTargetId.get(event.targetId) ?? 0) + amount,
            );
          }
        });
        break;
      }

      case "healing-to-named-combatant": {
        // Received and nothing else: the event carries no healer, so the giving
        // direction stays empty rather than being credited to whoever swung.
        // An unresolved name lands on nobody, exactly as the damage one does.
        const subject = getRow(event.targetId);
        subject.healed += event.amount;
        setRunningTotal(subject.healedBySource, event.source, event.amount);
        // No healer to be had on this shape at all, so every point of it is the
        // pinned row's — stated here rather than left to be inferred from the
        // absence of an entry in `healedByHealerId`.
        setRunningTotal(subject.healedWithoutHealerBySource, event.source, event.amount);
        break;
      }

      case "health-change": {
        const subject = getRow(event.combatantId);
        if (event.amount >= 0) {
          subject.healed += event.amount;
          setRunningTotal(subject.healedBySource, event.source, event.amount);
          // The healer comes from the announcement and from nowhere else — the
          // key itself names only who was healed.
          const healer = event.announced?.actorId ?? null;
          // The condition is the one below, negated on purpose rather than
          // written afresh: the two maps partition `healed`, so a reader asking
          // what the un-credited part was made of must be answered on exactly the
          // points the credited one turned away.
          if (healer === null || event.combatantId === null) {
            setRunningTotal(subject.healedWithoutHealerBySource, event.source, event.amount);
          }
          if (healer !== null && event.combatantId !== null) {
            subject.healedByHealerId.set(
              healer,
              (subject.healedByHealerId.get(healer) ?? 0) + event.amount,
            );
            // Written here rather than derived later, so the two directions come
            // from one reading of one event and cannot drift apart.
            const giver = getRow(healer);
            giver.healingGiven += event.amount;
            giver.healingGivenByCombatantId.set(
              event.combatantId,
              (giver.healingGivenByCombatantId.get(event.combatantId) ?? 0) + event.amount,
            );
          }
          setSkillTotals(event.announced, (skill) => {
            skill.healed += event.amount;
            if (event.combatantId !== null) {
              skill.healedByCombatantId.set(
                event.combatantId,
                (skill.healedByCombatantId.get(event.combatantId) ?? 0) + event.amount,
              );
            }
          });
        } else {
          subject.healthLost += -event.amount;
          setRunningTotal(subject.healthLostBySource, event.source, -event.amount);
        }
        break;
      }

      case "skill-used": {
        const actor = getRow(event.actorId);
        actor.skillsUsed += 1;
        getSkill(actor, {
          skillName: event.skillName,
          skillId: event.skillId,
          actorId: event.actorId,
        }).uses += 1;
        break;
      }

      case "fight-outcome": {
        // Merged rather than replaced: see the field's own note.
        const stated: NonNullable<FightStatistics["outcome"]> = outcome ?? {
          wonNames: [],
          lostNames: [],
          isDrawn: false,
        };
        if (event.result === "drawn") outcome = { ...stated, isDrawn: true };
        else if (event.result === "won") {
          outcome = { ...stated, wonNames: [...stated.wonNames, ...event.combatantNames] };
        } else outcome = { ...stated, lostNames: [...stated.lostNames, ...event.combatantNames] };
        break;
      }

      case "unknown-message": {
        unreadableMessages += 1;
        setRunningTotal(messagesByReason, event.reason, 1);
        for (const key of event.unreadKeys) setRunningTotal(occurrencesByUnreadKey, key, 1);
        break;
      }

      case "unaccounted-health": {
        // Counted, never placed. The protocol names the caster and not the
        // healed, so a figure on any row would be a guess about whose (§5).
        setRunningTotal(unaccountedHealthBySource, event.source, 1);
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
    reading: {
      unreadableMessages,
      messagesByReason,
      occurrencesByUnreadKey,
      unaccountedHealthBySource,
    },
    outcome,
  };
}
