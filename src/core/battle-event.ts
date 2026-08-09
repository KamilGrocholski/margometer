/**
 * What the decoder produces and everything downstream consumes.
 *
 * The union grows one variant at a time, alongside the decoder step that
 * produces it. A variant nothing produces is not a placeholder for future work
 * — it is dead weight that our own test data keeps alive, and
 * `tests/battle-event.test.ts` fails on it.
 */

export type FightOutcomeEvent = {
  kind: "fight-outcome";
  result: "won" | "lost";
  /**
   * Named by the protocol as text, not by id. Which of these is "us" is not
   * knowable from the message alone.
   */
  combatantNames: string[];
};

export type UnknownMessageEvent = {
  kind: "unknown-message";
  /** The message exactly as the protocol delivered it, so the panel can show it. */
  message: string;
  /** Why it was not understood: unreadable grammar, or keys with no meaning yet. */
  reason: string;
};

export type BattleEvent = FightOutcomeEvent | UnknownMessageEvent;

/**
 * Every variant the union currently holds. Kept as a value because the guard
 * has to iterate it at runtime; `satisfies` is what stops it drifting from the
 * type.
 */
export const BATTLE_EVENT_KINDS = ["fight-outcome", "unknown-message"] as const satisfies
  readonly BattleEvent["kind"][];
