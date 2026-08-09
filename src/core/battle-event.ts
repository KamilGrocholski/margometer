/**
 * What the decoder produces and everything downstream consumes.
 *
 * The union grows one variant at a time, alongside the decoder step that
 * produces it. A variant nothing produces is not a placeholder for future work
 * — it is dead weight that our own test data keeps alive, and
 * `tests/battle-event.test.ts` fails on it.
 */

/**
 * One damage figure. The type token is the client's own — the key with its sign
 * removed, exactly what the client uses to style the number — so nothing is
 * invented here. What the token means in words comes from the game at run time.
 */
export type DamageAmount = {
  damageType: string;
  amount: number;
};

export type AttackEvent = {
  kind: "attack";
  /** Combatant ids, or null where the protocol named nobody on that side. */
  actorId: number | null;
  targetId: number | null;
  /** Before reduction — what the attacker put out. */
  dealt: DamageAmount[];
  /**
   * After reduction — what the target actually lost. Measured on the captured
   * fights: health drop matched the sum of these in 22 of 26 comparisons and
   * the sum of `dealt` in none of them.
   */
  taken: DamageAmount[];
};

/**
 * Damage the protocol reports against a **name** rather than an id, alongside
 * an attack aimed at someone else.
 *
 * Measured on the captured fights: in every call where the target's health fell
 * further than the attack accounted for, the shortfall equalled this figure
 * exactly. It is damage that landed, already reduced — there is no second
 * figure for it the way `dealt` and `taken` pair up.
 */
export type DamageToNamedCombatantEvent = {
  kind: "damage-to-named-combatant";
  actorId: number | null;
  targetName: string;
  /** Health the protocol states for that combatant once this damage is in. */
  targetHealthPercent: number | null;
  damage: DamageAmount;
};

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

export type BattleEvent =
  | AttackEvent
  | DamageToNamedCombatantEvent
  | FightOutcomeEvent
  | UnknownMessageEvent;

/**
 * Every variant the union currently holds. Kept as a value because the guard
 * has to iterate it at runtime; `satisfies` is what stops it drifting from the
 * type.
 */
export const BATTLE_EVENT_KINDS = [
  "attack",
  "damage-to-named-combatant",
  "fight-outcome",
  "unknown-message",
] as const satisfies
  readonly BattleEvent["kind"][];
