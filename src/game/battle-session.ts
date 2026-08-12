/**
 * One fight, accumulated payload by payload.
 *
 * The game does not hand over a fight; it hands over pieces of one, and what
 * each piece contains was measured on the captures rather than assumed:
 *
 *   - **`init` marks the start, exactly once.** Both captures carry it on call 0
 *     and never again, so it is the fight boundary.
 *   - **The roster arrives in fragments.** `w` is on nearly every call but holds
 *     between 1 and 11 of 11 warriors — a delta, not a snapshot. It merges, and
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
import type { BattleEvent } from "@/src/core/battle-event.ts";
import type { CombatantRoster, RosteredCombatant } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics, type FightStatistics } from "@/src/core/fight-statistics.ts";
import {
  composeBattleRoster,
  composeCombatantsFromBattle,
  composeMergedCombatants,
  getOurSideFromBattle,
} from "@/src/game/engine-roster.ts";

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
   * Kept **with the size of the roster it was read against**, because that is the
   * one thing that can make an old reading wrong: the roster arrives in fragments,
   * and damage stated against a name resolves to nobody until the fragment naming
   * them lands. When it grows, everything is read again; while it does not, only
   * what is new is.
   */
  events: readonly BattleEvent[];
  decodedWithCombatants: number;
  /**
   * The last message already decoded.
   *
   * The glue reaches exactly one message forward (`AnnouncedSkill`), so a message
   * arriving now may belong to the skill announced by the one before it — which
   * is in the previous payload. It is re-read with the new batch and its events
   * thrown away, because they are already here.
   */
  lastMessage: string | null;
};

export function composeEmptySession(): BattleSession {
  return {
    messages: [],
    combatants: [],
    ourSide: null,
    isFromFightStart: false,
    fightsStarted: 0,
    events: [],
    decodedWithCombatants: 0,
    lastMessage: null,
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
  if (combatants.length !== session.decodedWithCombatants) {
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
  if (typeof payload !== "object" || payload === null) return false;
  const stated = (payload as Record<string, unknown>)["init"];
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
  payload: unknown,
  messages: readonly string[],
): BattleSession {
  const starting = isFightStart(payload);
  const previous = starting ? composeEmptySession() : session;

  const stated = getOurSideFromBattle(payload);
  const combatants = composeMergedCombatants(
    previous.combatants,
    composeCombatantsFromBattle(payload),
  );

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
   */
  const changedNothing =
    !starting &&
    messages.length === 0 &&
    combatants === previous.combatants &&
    (stated ?? previous.ourSide) === previous.ourSide;
  if (changedNothing) return previous;

  return {
    messages: [...previous.messages, ...messages],
    combatants,
    events: composeNextEvents(previous, messages, combatants),
    decodedWithCombatants: combatants.length,
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
};

/**
 * The whole fight decoded again from its messages, not an increment.
 *
 * Deliberately not incremental. Decoding is cheap against a fight's worth of
 * messages, and an incremental aggregate would have to be right about every
 * partial state rather than about the finished one — which is a much larger
 * claim for a saving nobody has measured a need for.
 */
export function composeFightReading(session: BattleSession): FightReading {
  const { roster } = composeBattleRoster(session.combatants, session.ourSide);
  return {
    statistics: composeFightStatistics(session.events, roster),
    roster,
    ourSide: session.ourSide,
    isFromFightStart: session.isFromFightStart,
    fightsStarted: session.fightsStarted,
  };
}
