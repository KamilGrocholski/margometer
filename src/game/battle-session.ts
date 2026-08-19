/**
 * One fight, accumulated payload by payload.
 *
 * The game does not hand over a fight; it hands over pieces of one, and what
 * each piece contains was measured on the captures rather than assumed:
 *
 *   - **`init` marks the start, exactly once.** Every capture carries it on call
 *     0 and never again, so it is the fight boundary.
 *   - **The roster arrives in fragments.** `w` is on nearly every call but holds
 *     between 1 and 11 of the 11 a group fight fields — measured over every
 *     recording on 2026-08-19 — so it is a delta, not a snapshot. It merges, and
 *     a fragment that mentions nobody takes nobody away.
 *   - **`myteam` arrives once, on that same first call.** So the side the player
 *     is on is knowable only if we were there when the fight began. Attach in the
 *     middle and it stays null, which is the truth and not a defect.
 *
 * Pure on purpose: every function here takes a state and returns the next one,
 * so the fight logic is checkable without an engine, a browser or a clock. The
 * mutable variable lives in whoever drives this.
 */

import { getIntegerFromText, getIntegerFromValue } from "@/libs/number.ts";
import { getRecordOrArrayFromValue } from "@/libs/record.ts";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { setRunningTotal } from "@/libs/running-total.ts";
import type { CombatantRoster, RosteredCombatant } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics, type FightStatistics } from "@/src/core/fight-statistics.ts";
import type { PayloadFault, PayloadReading } from "@/src/game/engine-battle-wrap.ts";
import {
  composeBattleRoster,
  composeMergedCombatants,
  composeRosterFragmentFromBattle,
  composeStatedHealthByCombatantId,
  getOurSideFromBattle,
} from "@/src/game/engine-roster.ts";
import {
  composeEntryHealthByCombatantId,
  NO_ENTRY_HEALTH,
  type FightEntryHealth,
} from "@/src/core/combatant-health.ts";

export type BattleSession = {
  /** Every message of this fight, in arrival order. */
  messages: readonly string[];
  combatants: readonly RosteredCombatant[];
  ourSide: number | null;
  /**
   * Whether we were watching when this fight began.
   *
   * False means the numbers are not the fight — measured, the boar capture
   * delivers all 18 of its messages in one payload, so a fight can be missed
   * entirely rather than partly. The panel says so instead of showing a total
   * that happens to be low (§9.6).
   */
  isFromFightStart: boolean;
  /**
   * How many fights this session has watched open.
   *
   * §9.6 scopes a warning to the fight that produced it and clears it when a
   * later fight decodes cleanly, and that needs a way to tell one fight from the
   * next. `init` is the only boundary the protocol gives, so this counts it —
   * nothing here compares fights, it only has to change when one does.
   */
  fightsStarted: number;
  /**
   * The fight decoded, kept rather than redone.
   *
   * ⚠️ **Measured, and the reason the panel felt heavy in a long fight.** Reading
   * every message again on every payload costs time that grows with the fight:
   * 603 messages → 4 ms on the worst payload, 3 618 → 18 ms, 6 030 → **39 ms**,
   * and 13.7 s of it across that one fight. A turn-based game gives us a payload
   * every few seconds, so the work is not wasted twice over — it is wasted in
   * front of somebody who is playing.
   *
   * Kept **with the roster it was read against**, because that is the one thing
   * that can make an old reading wrong: the roster arrives in fragments, and
   * damage stated against a name resolves to nobody until the fragment naming
   * them lands. When it changes, everything is read again; while it does not,
   * only what is new is.
   *
   * ⚠️ **By identity, and it used to be by size.** A fragment can correct a
   * combatant's *name* without changing how many there are — and then the
   * append path ran, so every event already decoded kept the resolution it got
   * under the old name. Measured: damage of 500 stated against a name the
   * roster learnt one payload later reached nobody at all, permanently, while
   * the roster on screen showed the corrected name. `composeMergedCombatants`
   * returns the very list it was given when a fragment says nothing new
   * (`engine-roster.ts`), so identity is exactly "did the roster change", and
   * that contract is held there by a `toBe`. This is the same failure that
   * function's own docblock records, surviving one level up.
   */
  events: readonly BattleEvent[];
  decodedCombatants: readonly RosteredCombatant[];
  /**
   * Payloads of this fight we no longer recognise, counted by what was wrong.
   *
   * Scoped to the fight for free: `composeEmptySession` is what a fight start
   * resets to, so §9.6's "a warning belongs to the fight that produced it" falls
   * out of the structure rather than being remembered somewhere. Read from
   * `previous` and never from `session`, which is what makes that true —
   * `fightsStarted` is the one field that deliberately survives a reset.
   */
  unreadablePayloadsByFault: ReadonlyMap<PayloadFault, number>;
  /**
   * Messages this fight stated and we could not read.
   *
   * Only what could be counted. A payload that lost an unknown number is in the
   * map above and contributes nothing here, because a zero would say "nothing was
   * lost" about the one case where something certainly was.
   */
  lostMessages: number;
  /**
   * Entries of this fight that named a combatant we could not read.
   *
   * Its consequence is already on screen in two places and neither says why: a
   * combatant nobody could place shows as an id and lands in the `+N` beside the
   * fight's size, and damage stated against their name reaches nobody and swells
   * the row for what cannot be charged to anyone. This is the reading that turns
   * both into something a person can act on.
   */
  unreadableCombatants: number;
  /**
   * The last message already decoded.
   *
   * The glue reaches exactly one message forward (`AnnouncedSkill`), so a message
   * arriving now may belong to the skill announced by the one before it — which
   * is in the previous payload. It is re-read with the new batch and its events
   * thrown away, because they are already here.
   */
  lastMessage: string | null;
  /**
   * What each combatant entered this fight holding.
   *
   * ⚠️ **Taken once, on the payload that opens the fight, and never touched
   * again.** The warriors that payload states are the state *after* its own
   * messages, so the figure is unwound back through them
   * (`src/core/combatant-health.ts`) rather than read off the snapshot — reading
   * it off the snapshot is wrong for every combatant in a fight that opens with
   * an attack, which is most group fights.
   *
   * Empty where the fight was joined in progress, and that needs no separate
   * check: `composeEmptySession` is what a fight start resets to, so a session
   * that never saw one never fills this in. Everything downstream then degrades to
   * counting the healing it cannot size, which is what it did before this existed.
   */
  entryHealthByCombatantId: FightEntryHealth;
};

export function composeEmptySession(): BattleSession {
  return {
    messages: [],
    combatants: [],
    ourSide: null,
    isFromFightStart: false,
    fightsStarted: 0,
    events: [],
    decodedCombatants: [],
    unreadablePayloadsByFault: new Map(),
    lostMessages: 0,
    unreadableCombatants: 0,
    lastMessage: null,
    entryHealthByCombatantId: NO_ENTRY_HEALTH,
  };
}

/** The fault counts after one more payload, and the same map where it was clean. */
function composeNextFaults(
  previous: BattleSession,
  reading: PayloadReading,
): Pick<BattleSession, "unreadablePayloadsByFault" | "lostMessages"> {
  if (reading.fault === null) {
    return {
      unreadablePayloadsByFault: previous.unreadablePayloadsByFault,
      lostMessages: previous.lostMessages,
    };
  }

  const byFault = new Map(previous.unreadablePayloadsByFault);
  setRunningTotal(byFault, reading.fault, 1);
  return {
    unreadablePayloadsByFault: byFault,
    lostMessages: previous.lostMessages + (reading.lostMessages ?? 0),
  };
}

/**
 * The fight's events after this payload — every message read exactly once, or
 * every message read again where the roster has learnt a name since.
 *
 * The carry is what makes appending safe rather than merely fast: without it a
 * blow that follows an announcement across a payload boundary would lose the
 * skill it belongs to, which is a wrong number rather than a slow one.
 */
function composeNextEvents(
  session: BattleSession,
  messages: readonly string[],
  combatants: readonly RosteredCombatant[],
): readonly BattleEvent[] {
  const { roster } = composeBattleRoster(combatants, session.ourSide);
  if (combatants !== session.decodedCombatants) {
    return decodeFight([...session.messages, ...messages], roster);
  }
  if (messages.length === 0) return session.events;

  const carry = session.lastMessage;
  if (carry === null) return [...session.events, ...decodeFight(messages, roster)];

  const withCarry = decodeFight([carry, ...messages], roster);
  const alone = decodeFight([carry], roster).length;
  return [...session.events, ...withCarry.slice(alone)];
}

/**
 * Whether this payload opens a fight.
 *
 * Read from text and from number both, because the captures state `"1"` and the
 * client compares with `==`. Mirroring its looseness here is deliberate: a
 * stricter reading would silently stop noticing fight starts the day the game
 * sends the other one.
 */
export function isFightStart(payload: unknown): boolean {
  const stated = getRecordOrArrayFromValue(payload)?.["init"];
  const asNumber =
    typeof stated === "string" ? getIntegerFromText(stated) : getIntegerFromValue(stated);
  return asNumber === 1;
}

/**
 * The session after one more payload.
 *
 * Order matters and is the reason this is one function rather than three: a
 * payload that opens a fight also carries that fight's roster and, in the group
 * capture, three of its messages. Reset first, then take everything the same
 * payload brought, or the fight starts by throwing away its own beginning.
 */
export function composeNextSession(
  session: BattleSession,
  reading: PayloadReading,
): BattleSession {
  const { payload, messages } = reading;
  const starting = isFightStart(payload);
  const previous = starting ? composeEmptySession() : session;

  const stated = getOurSideFromBattle(payload);
  const fragment = composeRosterFragmentFromBattle(payload);
  const combatants = composeMergedCombatants(previous.combatants, fragment.combatants);

  /**
   * A payload that changed nothing gives back the session it was handed.
   *
   * ⚠️ **Identity is the signal**, and it is the whole point: the caller redraws
   * when the session is a new object, so returning the same one costs the
   * aggregate and the render as well as this function. The game calls the engine
   * far more often than a fight has turns — a step, a chat line, a window opening
   * — and every one of those was rebuilding a panel that says exactly what it
   * said before.
   *
   * Every part of it is by identity, and every part of it is exact: the merge
   * hands back the list it was given when a fragment said nothing new
   * (`composeMergedCombatants`).
   *
   * ⚠️ **A faulty payload changes something even when it carries nothing.** It is
   * the one clause here that is not about the fight: without it, a payload we
   * could not read would be counted into a session the caller never looks at,
   * because the caller redraws on identity — so the count would be right and
   * invisible, which is the same as absent. This is the single easiest place for
   * the whole of this round to be quietly undone, and it has its own test.
   */
  const changedNothing =
    !starting &&
    reading.fault === null &&
    fragment.unreadableEntries === 0 &&
    messages.length === 0 &&
    combatants === previous.combatants &&
    (stated ?? previous.ourSide) === previous.ourSide;
  if (changedNothing) return previous;

  const events = composeNextEvents(previous, messages, combatants);

  return {
    messages: [...previous.messages, ...messages],
    combatants,
    events,
    decodedCombatants: combatants,
    /**
     * Read on the opening payload and carried untouched from then on, the way
     * `ourSide` is — and for a sharper reason: this is a fact about one moment,
     * and every later payload states a health that moment has already passed.
     *
     * It needs `events`, which is why it sits here rather than beside the roster
     * above: the unwind subtracts this payload's own messages back off the health
     * it states, and those messages are exactly what was just decoded.
     */
    entryHealthByCombatantId: starting
      ? composeEntryHealthByCombatantId(
          composeStatedHealthByCombatantId(payload),
          new Map(
            combatants.flatMap((combatant) =>
              combatant.maximumHealth === null ? [] : [[combatant.id, combatant.maximumHealth]],
            ),
          ),
          events,
        )
      : previous.entryHealthByCombatantId,
    ...composeNextFaults(previous, reading),
    unreadableCombatants: previous.unreadableCombatants + fragment.unreadableEntries,
    lastMessage: messages[messages.length - 1] ?? previous.lastMessage,
    // Kept once seen: it arrives on the opening payload only, so a later
    // fragment saying nothing about it must not erase it.
    ourSide: stated ?? previous.ourSide,
    isFromFightStart: starting || previous.isFromFightStart,
    // Counted from `session` and not from `previous`: this is the one thing that
    // must survive the reset, because telling the fights apart is its whole job.
    fightsStarted: session.fightsStarted + (starting ? 1 : 0),
  };
}

/** What a panel is handed: the numbers, and everything qualifying them. */
export type FightReading = {
  statistics: FightStatistics;
  /**
   * The roster the statistics were built against.
   *
   * Carried rather than left for the reader to rebuild: the aggregate works in
   * ids, and a panel that had to compose its own roster to turn those back into
   * names would be a second place deciding who is who.
   */
  roster: CombatantRoster;
  ourSide: number | null;
  isFromFightStart: boolean;
  /** Changes when a new fight opens, so a warning can be scoped to one (§9.6). */
  fightsStarted: number;
  /**
   * What never reached the decoder, as against what the decoder could not read.
   *
   * ⚠️ **Two different sentences, and the panel has to say both.** `statistics.
   * reading` holds messages that arrived and carried a key we have no meaning
   * for. This holds messages and combatants that never arrived at all, because
   * the shape they travel in stopped being one we recognise. A total can be too
   * low for either reason and the fixes are not the same.
   *
   * Required rather than optional: this is where the producer is, and an optional
   * field is the shape the last two silences had — something declared, never
   * passed, and indistinguishable from something deliberately left out.
   */
  engineReading: EngineReadingGaps;
};

/** What the game handed over that this layer could not turn into a fight. */
export type EngineReadingGaps = {
  unreadablePayloadsByFault: ReadonlyMap<PayloadFault, number>;
  lostMessages: number;
  unreadableCombatants: number;
};

/**
 * The fight's numbers built again from all of its events, not an increment.
 *
 * ⚠️ **The decoding beside it is incremental and this is not**, which reads like
 * an oversight and is a decision. Appending events earned itself: reading every
 * message again was measured, and it grew with the fight (`events` above). The
 * fold over those events has never been measured, so the saving here is
 * hypothetical while the price is not — an incremental aggregate has to be right
 * about every partial state of a fight rather than about the finished one, and
 * every statistic added to `fight-statistics.ts` afterwards inherits that
 * obligation.
 *
 * So measure before changing it. Every payload that changes anything pays for
 * this fold, and what it comes to is the one number this file does not have.
 */
export function composeFightReading(session: BattleSession): FightReading {
  const { roster } = composeBattleRoster(session.combatants, session.ourSide);
  return {
    statistics: composeFightStatistics(session.events, roster, session.entryHealthByCombatantId),
    roster,
    ourSide: session.ourSide,
    isFromFightStart: session.isFromFightStart,
    fightsStarted: session.fightsStarted,
    engineReading: {
      unreadablePayloadsByFault: session.unreadablePayloadsByFault,
      lostMessages: session.lostMessages,
      unreadableCombatants: session.unreadableCombatants,
    },
  };
}
