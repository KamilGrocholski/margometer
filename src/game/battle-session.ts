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
};

export function composeEmptySession(): BattleSession {
  return {
    messages: [],
    combatants: [],
    ourSide: null,
    isFromFightStart: false,
    fightsStarted: 0,
  };
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
  return {
    messages: [...previous.messages, ...messages],
    combatants: composeMergedCombatants(previous.combatants, composeCombatantsFromBattle(payload)),
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
    statistics: composeFightStatistics(decodeFight(session.messages, roster), roster),
    roster,
    ourSide: session.ourSide,
    isFromFightStart: session.isFromFightStart,
    fightsStarted: session.fightsStarted,
  };
}
