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
import {
  composeSizedTeamHeals,
  NO_ENTRY_HEALTH,
  type FightEntryHealth,
} from "@/src/core/combatant-health.ts";
import {
  SELF_SOURCED_HEALING_KEYS,
  WOUND_ANNOUNCEMENT_BY_TICK_KEY,
} from "@/src/core/fight-decoder.ts";
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
   * announced over it is a plain attack *or* an attack the game handed out, and
   * the two do not come apart. Asked of the source rather than assumed: the
   * published help grants an unbidden attack under `contra` and `pcontra` — a
   * riposte, arriving as an ordinary blow message with nothing on it — and under
   * `of-thirdatt`, which the protocol *does* mark and marks on the message of the
   * blow it came with, so it was never counted here either (article `view,372`,
   * read 2026-08-21;
   * `docs/specs/2026-08-21-an-extra-blow-the-game-grants.md`).
   *
   * So the count is of blows nothing announced, and the panel says that rather
   * than the other thing.
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
  /**
   * The part of `healthLostBySource` somebody **is** charged with, by whom and
   * under which key — the health-loss twin of `takenByActorId`, and read the same
   * way: what the row holds, less what it can put a name to, is what nobody is
   * charged with.
   *
   * Written only for a wound whose announcement is unambiguous (§9.6, and
   * `WOUND_ANNOUNCEMENT_BY_TICK_KEY`). Every other loss — poison, fire, a wound
   * whose figure disagrees with the one announced — leaves it empty, which is
   * what keeps `Nieznany sprawca` an honest row rather than a residue.
   */
  healthLostByActorId: ReadonlyMap<number, ReadonlyMap<string, number>>;
  /**
   * Health this combatant took off somebody outside a blow, and off whom.
   *
   * The other end of `healthLostByActorId`, held rather than derived for the
   * reason `takenByActorId` gives: a derivation across every other row is a
   * statistic, and §9.1 says the panel computes none.
   *
   * ⚠️ **Kept apart from `dealtApplied`, which is blows.** The panel adds the two
   * for the figure it ranks by — the mirror of `taken + healthLost`, which it has
   * always added — but the aggregate keeps them apart, because a wound tick is a
   * separate instance of damage rather than a swing: it lands on no `blowsStruck`,
   * carries no damage element, and totalling it into a blow figure would make
   * `dealtApplied` stop meaning what its own line says.
   */
  healthLostCaused: number;
  healthLostCausedByTargetId: ReadonlyMap<number, ReadonlyMap<string, number>>;
  healedBySource: ReadonlyMap<string, number>;
  /**
   * The part of `healedBySource` that no announcement gave a healer to.
   *
   * ⚠️ **Not a narrowing of `healedBySource` anybody can perform afterwards.**
   * That map holds every point restored, whoever was credited with it; the panel's
   * pinned row holds only the points nobody was. A reader wanting to say *what*
   * that row is made of therefore has nothing to read, and no arithmetic recovers
   * the split.
   *
   * ⚠️ **Empty on every recording, and kept anyway.** It held 109 113 points on
   * `tests/captured-fights/2026-08-12-tempest-grupa-vs-hildur-2.json` until the
   * three keys the help calls the healed combatant's own started saying so
   * (`docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`). What can still
   * land here is an unannounced `heal_target` — the protocol can send one and the
   * corpus has never carried one — and, more to the point, any healing key nobody
   * has read yet. A field that goes quiet because the readings improved is not a
   * field that stopped being the honest answer, and emptying it into `healed`
   * would make the panel unable to say *nobody gave this* the next time that is
   * true.
   *
   * Written in the same breath as `healedByHealerId` and exactly where that map is
   * **not** — one reading of one event, the reasoning `healingGiven` already
   * carries — so the two partition `healed` between them and cannot drift apart.
   */
  healedWithoutHealerBySource: ReadonlyMap<string, number>;
  /**
   * Who healed this combatant — the announcer, or the combatant themselves where
   * the key is one the help calls their own effect (§9.6).
   *
   * ⚠️ **It used to hold a minority of the healing and now holds all of it.**
   * Measured on `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`:
   * 248 814 of 346 284 points restored are announced by a skill, and the other
   * 97 470 are regeneration and the two legendary bonuses — which nothing
   * announces and which the help says belong to the combatant they heal
   * (`docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`). Both reach a
   * healer, by different routes, so this map now sums to `healed` on every
   * recording. That equality is asserted rather than assumed
   * (`tests/core/fight-statistics.test.ts`): a capture that broke it would be a
   * healing key nobody has read.
   */
  healedByHealerId: ReadonlyMap<number, number>;
  /**
   * The part of the same healing that **no announcement covered**, by healer and
   * by the key the game stated it under.
   *
   * ⚠️ **No arithmetic over the maps beside it recovers this**, which is the whole
   * of why it is a field. `healedByHealerId` drops the key, `healedBySource` drops
   * the announcement, and a `SkillStatistics` carries no key at all — so the split
   * between health a skill announced and health only a key names exists nowhere
   * the panel could fold it out of. Without it the breakdown under `Leczenie`
   * closed against a row reading *nie wiadomo, czym* over 16 527 points on
   * `tests/captured-fights/2026-08-17-tempest-grupa-vs-hildur.json` that
   * `legbon_lastheal` and `heal` had already named.
   *
   * Keyed by the healer as well as by the key, so the pair level can be asked the
   * same question as the fight-wide one and answer from one map rather than two.
   *
   * Written in the same breath as `healedByHealerId`, for that field's reason:
   * one reading of one event, so the two directions cannot drift apart.
   */
  healedWithoutSkillByHealerId: ReadonlyMap<number, ReadonlyMap<string, number>>;
  /**
   * Health this combatant restored to somebody, and to whom.
   *
   * The transpose of `healedByHealerId`, and held for the same reason it is —
   * a derivation across every other row is a statistic, and §9.1 says the panel
   * computes none. Healing is the one figure that reads in two directions, and
   * only one of them was ever kept.
   *
   * ⚠️ **Not the row's own `healed`, which is what it received.** The two are
   * different quantities that a shared word would merge, and they part hardest on
   * a combatant who heals only themselves: measured on
   * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`, 97 470 of the
   * 346 284 points restored are a combatant's own effect, so they sit in both
   * fields of one row and in nobody else's. A reader taking either for the other
   * would double that combatant and lose every heal that crossed between two.
   */
  healingGiven: number;
  healingGivenByCombatantId: ReadonlyMap<number, number>;
  /**
   * The transpose of `healedWithoutSkillByHealerId`, held rather than derived for
   * the reason the field above it is held: a derivation across every other row is
   * a statistic, and §9.1 says the panel computes none.
   *
   * ⚠️ **The only place the giving side carries a key at all.** Every other
   * healing map on this row is keyed by a person, so what a combatant restored to
   * themselves reached `Leczenie dane` as a figure with no shape — 16 527 points of
   * one row on the recording named above, under a heading saying nothing was known
   * about them.
   *
   * ⚠️ **And "what they restored to themselves" is not one thing, which is the
   * whole point of keying it.** Of those 16 527, 5 450 are `heal` and 11 077 are
   * `legbon_lastheal` — a statistic of the character and a legendary bonus, two
   * different mechanics the register describes separately (`docs/protocol-keys.md`).
   * `SELF_SOURCED_HEALING_KEYS` groups them on the help's word that each is the
   * healed combatant's **own** effect, and that grouping answers *who* and never
   * *what*: a reader taking it for a kind would call the larger half regeneration,
   * which it is not.
   */
  healingGivenWithoutSkillByCombatantId: ReadonlyMap<number, ReadonlyMap<string, number>>;
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
  healthLostByActorId: Map<number, Map<string, number>>;
  healthLostCaused: number;
  healthLostCausedByTargetId: Map<number, Map<string, number>>;
  healedBySource: Map<string, number>;
  healedWithoutHealerBySource: Map<string, number>;
  healedByHealerId: Map<number, number>;
  healedWithoutSkillByHealerId: Map<number, Map<string, number>>;
  healingGiven: number;
  healingGivenByCombatantId: Map<number, number>;
  healingGivenWithoutSkillByCombatantId: Map<number, Map<string, number>>;
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
    healthLostByActorId: new Map(),
    healthLostCaused: 0,
    healthLostCausedByTargetId: new Map(),
    healedBySource: new Map(),
    healedWithoutHealerBySource: new Map(),
    healedByHealerId: new Map(),
    healedWithoutSkillByHealerId: new Map(),
    healingGiven: 0,
    healingGivenByCombatantId: new Map(),
    healingGivenWithoutSkillByCombatantId: new Map(),
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
  into.healthLostCaused += member.healthLostCaused;
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
 * The wound a victim is carrying: which key will tick, what it will state, and who
 * applied it.
 *
 * `attackerId` is nullable and the wound is still kept, which is the half that is
 * easy to leave out: the game overwrites a wound whoever landed it, so an
 * application whose actor did not resolve has to displace the one before it. Drop
 * it instead and a stale wound goes on claiming ticks that are somebody else's.
 */
type RunningWound = { attackerId: number | null; amount: number; source: string };

/**
 * The announcement keys, pointing back at the tick they announce.
 *
 * Derived rather than written down a second time — the pairing is
 * `WOUND_ANNOUNCEMENT_BY_TICK_KEY`'s and this is only the direction a blow needs
 * to read it in.
 */
const TICK_KEY_BY_WOUND_ANNOUNCEMENT = new Map(
  Object.entries(WOUND_ANNOUNCEMENT_BY_TICK_KEY).map(([tick, announcement]) => [
    announcement,
    tick,
  ]),
);

/**
 * Who gave a heal that nothing announced — the healed combatant, or nobody.
 *
 * The whole of §9.6's third clause in one expression: an end the protocol omits is
 * filled **only** with a combatant the message already names, and only for a key
 * the published help says is that combatant's own effect
 * (`SELF_SOURCED_HEALING_KEYS`). Where the message named nobody — `0;0;heal=40`,
 * or a name this fight's roster cannot place — `combatantId` is null and null is
 * what comes back: there is no name to fill either end with, and inventing one is
 * still §5's flat no.
 */
function getSelfSourcedHealerId(source: string, combatantId: number | null): number | null {
  return SELF_SOURCED_HEALING_KEYS.includes(source) ? combatantId : null;
}

/**
 * Whether an announcement can carry a figure: there is one, and its actor resolved.
 *
 * One spelling for two readers, and they are complements — `setSkillTotals` writes
 * the skill's own totals under it, `setHealingTotals` files what it does **not**
 * cover by the key that does. Asked twice, the two answers would drift and a heal
 * would land in both halves or in neither, which is a figure that looks right
 * (§9.3).
 */
function hasAnnouncer(announced: AnnouncedSkill | null): announced is AnnouncedSkill {
  return announced !== null && announced.actorId !== null;
}

/**
 * The roster is optional and its absence is not an error: a fight can be joined
 * in progress, and rows must still be produced. What is lost is the grouping,
 * and that loss is stated rather than hidden — every combatant turns up in
 * `combatantIdsWithoutSide`.
 */
export function composeFightStatistics(
  unsizedEvents: readonly BattleEvent[],
  roster: CombatantRoster | null = null,
  entryHealthByCombatantId: FightEntryHealth = NO_ENTRY_HEALTH,
): FightStatistics {
  /**
   * Sizing happens here rather than in the decoder, and that is a decision.
   *
   * `src/game/battle-session.ts` decodes **incrementally** — it appends the events
   * of new messages and freezes them — so a decoder carrying running health would
   * answer differently depending on how the game happened to split its payloads,
   * permanently. This fold is rebuilt from every event on every payload, so it is
   * the one place where the health a cast is capped against is both complete and
   * the same every time it is computed.
   */
  const events = composeSizedTeamHeals(unsizedEvents, roster, entryHealthByCombatantId);

  const rows = new Map<number, Row>();
  const unattributed = composeRow();
  /**
   * The wound each victim is carrying, replaced by the freshest application.
   *
   * ⚠️ **This is why the reading is here and not in the decoder.**
   * `src/game/battle-session.ts` decodes incrementally, carrying exactly one
   * message forward, so a wound held inside `decodeFight` would reach only the
   * ticks that happen to share an engine call with their announcement — measured
   * over the captures as the set stood 2026-08-19, 36 of 151 — and would answer
   * differently depending on how the game split its payloads. This fold is rebuilt
   * from every event on every payload, which is the same reason sizing lives here.
   */
  const woundByVictimId = new Map<number, RunningWound>();
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
    if (!hasAnnouncer(announced)) return;
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

  /**
   * One heal written into every total it belongs to, from one reading of it.
   *
   * Extracted when the sized team heal arrived as a second caller: seven maps and
   * two directions have to move together, and the failure mode of writing them
   * twice is not a crash but a panel where the giving side and the receiving side
   * quietly disagree. The one thing that differs between the callers is where the
   * healer comes from — an announcement for a stated heal, the caster for a cast —
   * so the healer is an argument and nothing else is.
   */
  function setHealingTotals(
    recipientId: number | null,
    amount: number,
    source: string,
    healerId: number | null,
    announced: AnnouncedSkill | null,
  ): void {
    const subject = getRow(recipientId);
    subject.healed += amount;
    setRunningTotal(subject.healedBySource, source, amount);

    /**
     * What the announcement does not cover, the key does — and the panel needs to
     * be told which is which before it can name the second half.
     *
     * ⚠️ **A null healer is already an unannounced heal, and is filed elsewhere.**
     * `healerId` is the announcement's actor where there is one, so where it is
     * null nothing announced this — which is why the two `WithoutSkill` maps below
     * live in the other branch and `healedWithoutHealerBySource` needs no such
     * condition. A reader folding the three together gets every point back exactly
     * once.
     */
    const isAnnounced = hasAnnouncer(announced);

    if (healerId === null) {
      setRunningTotal(subject.healedWithoutHealerBySource, source, amount);
    } else {
      setRunningTotal(subject.healedByHealerId, healerId, amount);
      if (!isAnnounced) {
        setPairRunningTotal(subject.healedWithoutSkillByHealerId, healerId, source, amount);
      }
      // Written here rather than derived later, so the two directions come from
      // one reading of one event and cannot drift apart.
      const giver = getRow(healerId);
      giver.healingGiven += amount;
      // Keyed by the recipient, so only where there is one to key it by. The
      // giver's own breakdown is short by the rest, and the panel names the
      // shortfall rather than hiding it (`src/ui/panel-drill.ts`).
      if (recipientId !== null) {
        setRunningTotal(giver.healingGivenByCombatantId, recipientId, amount);
        if (!isAnnounced) {
          setPairRunningTotal(
            giver.healingGivenWithoutSkillByCombatantId,
            recipientId,
            source,
            amount,
          );
        }
      }
    }

    setSkillTotals(announced, (skill) => {
      skill.healed += amount;
      if (recipientId !== null) setRunningTotal(skill.healedByCombatantId, recipientId, amount);
    });
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
            setRunningTotal(skill.dealtByTargetId, event.targetId, landed);
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

        // A blow may state that it applied a wound. Nothing is counted here — the
        // announcement is a declaration and stays one (`docs/protocol-keys.md`) —
        // and what is kept is only the name the tick will need.
        if (event.targetId !== null) {
          for (const declared of event.declared) {
            const source = TICK_KEY_BY_WOUND_ANNOUNCEMENT.get(declared.effect);
            if (source === undefined || declared.amount === null) continue;
            woundByVictimId.set(event.targetId, {
              attackerId: event.actorId,
              amount: declared.amount,
              source,
            });
          }
        }
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
            setRunningTotal(skill.dealtByTargetId, event.targetId, amount);
          }
        });
        break;
      }

      case "healing-to-named-combatant": {
        /**
         * The healer is the healed, and the message actor is nobody's healer.
         *
         * `legbon_lastheal` is the holder's own legendary bonus (§9.6, article
         * view,372 at engine name `lastheal`, read 2026-08-19), so the combatant
         * the value names is both ends of it. The message's **actor** is whoever
         * struck the blow that triggered it, and four of the five occurrences ride
         * a group blow where the message's target is a third party — so the slot
         * is never read here, and passing it would credit an attacker with healing
         * their own victim.
         *
         * An unresolved name still lands on nobody, exactly as the damage one
         * does: `targetId` is null and there is no name to fill either end with.
         *
         * Asked of `SELF_SOURCED_HEALING_KEYS` rather than filled in here, even
         * though `legbon_lastheal` is the only key that reaches this branch: the
         * list is what `docs/protocol-keys.md` is held against, and a second
         * spelling of the same fact is what §9.3 says fails silently.
         */
        setHealingTotals(
          event.targetId,
          event.amount,
          event.source,
          getSelfSourcedHealerId(event.source, event.targetId),
          null,
        );
        break;
      }

      case "health-change": {
        if (event.amount >= 0) {
          /**
           * ⚠️ **The healer is credited whether or not the recipient resolved, and
           * for one release neither was.**
           *
           * The condition used to demand both ends, so an announced heal reaching
           * a name this fight could not place was filed as healing *nobody gave*.
           * The announcement had named the giver, so that was a claim about the
           * game that is false (§3): the panel said "nic nie zapowiedziało tego
           * leczenia" about points something had announced, and the giver's own
           * total was short by them with nothing on their row saying so.
           *
           * **The announcement wins where there is one, and the key answers where
           * there is not.** An announcement names a giver the protocol actually
           * stated, which beats anything derived; where nothing announced the
           * heal, a key on `SELF_SOURCED_HEALING_KEYS` says the giver is the one
           * healed, on the help's word and not on a guess (§9.6).
           */
          setHealingTotals(
            event.combatantId,
            event.amount,
            event.source,
            event.announced?.actorId ?? getSelfSourcedHealerId(event.source, event.combatantId),
            event.announced,
          );
        } else {
          const lost = -event.amount;
          const subject = getRow(event.combatantId);
          subject.healthLost += lost;
          setRunningTotal(subject.healthLostBySource, event.source, lost);

          /**
           * §9.6's fourth clause, in the one expression that exercises it: an end
           * the protocol left out, filled from an **earlier message of the same
           * fight** where the help states the link and the figure says which
           * application it is.
           *
           * ⚠️ **Three declines, and each is a figure staying on the pinned row
           * rather than reaching somebody's.** No wound on this victim — a fight
           * joined after the blow that applied it. A figure that is not the one
           * announced — then this is not the wound we are holding, and a tick we
           * cannot identify is one we cannot place. An announcement whose own
           * attacker did not resolve — there is no name to fill the end with, and
           * inventing one is §5's flat no.
           */
          const wound = event.combatantId === null ? undefined : woundByVictimId.get(event.combatantId);
          if (
            wound !== undefined &&
            wound.attackerId !== null &&
            wound.source === event.source &&
            wound.amount === lost
          ) {
            const attacker = getRow(wound.attackerId);
            attacker.healthLostCaused += lost;
            // Both directions from one reading of one event, for the reason
            // `setHealingTotals` gives: written twice, they drift.
            setPairRunningTotal(subject.healthLostByActorId, wound.attackerId, event.source, lost);
            if (event.combatantId !== null) {
              setPairRunningTotal(
                attacker.healthLostCausedByTargetId,
                event.combatantId,
                event.source,
                lost,
              );
            }
          }
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

      case "team-heal": {
        /**
         * The caster is credited because the protocol named them as the message's
         * actor, not because anything was inferred — this is the one healing shape
         * where the *giver* is the end the game states and the recipients are the
         * end it leaves to the arithmetic (§9.6).
         */
        for (const [combatantId, restored] of event.restoredByCombatantId) {
          setHealingTotals(
            combatantId,
            restored,
            event.source,
            event.casterId,
            event.announced,
          );
        }
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
