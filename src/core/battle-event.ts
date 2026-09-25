/**
 * What the decoder produces and everything above it reads: the data contract `docs/design.md` §1
 * carries over from `develop`, where `develop ADR 0008` records it. What each key means is
 * `develop:docs/protocol-keys.md`.
 */

import type { VocabularyWord } from "#/libs/vocabulary.ts";

export const BATTLE_EVENT = {
    attack: "attack",
    damageToNamedCombatant: "damage-to-named-combatant",
    declaration: "declaration",
    fightOutcome: "fight-outcome",
    healingToNamedCombatant: "healing-to-named-combatant",
    healthChange: "health-change",
    skillUsed: "skill-used",
    turnLost: "turn-lost",
    unaccountedHealth: "unaccounted-health",
    unknownMessage: "unknown-message",
} as const;

/** `drawn` is a fight nobody won; `fled` is one an escape broke off. Neither names a side. */
export const OUTCOME_RESULT = { won: "won", lost: "lost", drawn: "drawn", fled: "fled" } as const;
export type OutcomeResult = VocabularyWord<typeof OUTCOME_RESULT>;

/** Why a message went unread. `grammar-refused` names nobody, so two of the three reach a row. */
export const UNREAD_CAUSE = {
    unknownKey: "unknown-key",
    noParameter: "no-parameter",
    grammarRefused: "grammar-refused",
} as const;
export type UnreadCause = VocabularyWord<typeof UNREAD_CAUSE>;

export interface DamageFigure {
    element: string;
    amount: number;
}

/** Never the difference between raw and applied: armour and resistance reduce unreported. */
export interface PreventedDamage {
    defence: string;
    amount: number;
}

/** Not damage, and never totalled with it: points and percentage points, unit unstated. */
export interface DestroyedStatistic {
    statistic: string;
    amount: number;
}

/**
 * The client renders an announcement and what follows it as one action. That they name one actor
 * is our condition, and how many messages it reaches is `develop ADR 0078`'s.
 */
export interface AnnouncedSkill {
    skillName: string;
    skillId: number | null;
    /** Carried, because the message it rides may be about somebody else. */
    actorId: number | null;
}

export interface SkillUsedEvent {
    kind: typeof BATTLE_EVENT.skillUsed;
    actorId: number | null;
    targetId: number | null;
    actorHealthPercent: number | null;
    targetHealthPercent: number | null;
    skillName: string;
    /** Null where the announcement carried none, which is why the name is what this is built on. */
    skillId: number | null;
    declared: DeclaredEffect[];
}

export interface AttackEvent {
    kind: typeof BATTLE_EVENT.attack;
    actorId: number | null;
    targetId: number | null;
    /** Where each end stands once the blow is in: the one reading that can contradict a total. */
    actorHealthPercent: number | null;
    targetHealthPercent: number | null;
    /** Before reduction, and after it. */
    raw: DamageFigure[];
    applied: DamageFigure[];
    prevented: PreventedDamage[];
    destroyed: DestroyedStatistic[];
    /** Fired alongside the blow, stating no figure at all. Nothing totals them. */
    procs: string[];
    declared: DeclaredEffect[];
    announced: AnnouncedSkill | null;
}

/**
 * Stated beside a figure and counted by no total here: an input, another unit, or outside the
 * fight. Read, never totalled.
 */
export interface DeclaredEffect {
    effect: string;
    amount: number | null;
    text: string | null;
}

/** Health that moved outside a blow. Who caused it is not in the message, only the key is. */
export interface HealthChangeEvent {
    kind: typeof BATTLE_EVENT.healthChange;
    combatantId: number | null;
    /** Signed: health restored is positive, health lost is negative. */
    amount: number;
    healthPercent: number | null;
    /** The protocol key as written, which is the whole of what the message says about a cause. */
    source: string;
    declared: DeclaredEffect[];
    /** The only place a giver can come from: the key states who was healed, never who did it. */
    announced: AnnouncedSkill | null;
}

/**
 * Damage the protocol reports against a **name**, beside an attack aimed at somebody else. It has
 * already been reduced: there is no second figure the way raw and applied pair up.
 */
export interface DamageToNamedCombatantEvent {
    kind: typeof BATTLE_EVENT.damageToNamedCombatant;
    actorId: number | null;
    targetName: string;
    /** Whom that name belongs to, once a roster could say. Null on every way it could not. */
    targetId: number | null;
    targetHealthPercent: number | null;
    damage: DamageFigure;
    announced: AnnouncedSkill | null;
}

/**
 * A message stating something and reporting nothing that happened to anybody: a step, a skill
 * being prepared, a line for the client's own log. It carries no figure any statistic touches.
 */
export interface DeclarationEvent {
    kind: typeof BATTLE_EVENT.declaration;
    combatantId: number | null;
    healthPercent: number | null;
    declared: DeclaredEffect[];
}

/**
 * Healing the protocol reports against a **name**, on a message whose two ends are somebody else's
 * fight. Neither slot is the healed, so the value is read and no slot is.
 */
export interface HealingToNamedCombatantEvent {
    kind: typeof BATTLE_EVENT.healingToNamedCombatant;
    targetName: string;
    targetId: number | null;
    targetHealthPercent: number | null;
    amount: number;
    source: string;
}

/**
 * How the fight ended, about the fight rather than about anybody in it. The protocol names the
 * sides as text, and which of them is the reader's own is not knowable from the message.
 */
export interface FightOutcomeEvent {
    kind: typeof BATTLE_EVENT.fightOutcome;
    result: OutcomeResult;
    /** Empty for `drawn` and `fled`, where the protocol names nobody. */
    combatantNames: string[];
}

/** A share stated about a whole side, recipients unstated. Never a figure of health on its own. */
export interface UnaccountedHealthEvent {
    kind: typeof BATTLE_EVENT.unaccountedHealth;
    source: string;
    /** The caster, off the actor slot: 8 of the 115 in `captures/` name another target. */
    combatantId: number | null;
    declaredShare: number | null;
    announced: AnnouncedSkill | null;
}

/** A turn granted and spent on nothing, read off the game's own sentence. `develop ADR 0049`. */
export interface TurnLostEvent {
    kind: typeof BATTLE_EVENT.turnLost;
    /** The decoder resolves the name, and none of that sentence travels with it. */
    combatantId: number | null;
}

/** A message left unread, carrying what it was so nothing about it is invented. */
export interface UnknownMessageEvent {
    kind: typeof BATTLE_EVENT.unknownMessage;
    message: string;
    unreadCause: UnreadCause;
    /** One per occurrence. Empty where the grammar failed, never "nothing went unread". */
    unreadKeys: readonly string[];
    /** The ends the message named, read off the grammar and nowhere else. */
    combatantIds: readonly number[];
}

export type BattleEvent =
    | AttackEvent
    | DamageToNamedCombatantEvent
    | DeclarationEvent
    | FightOutcomeEvent
    | HealingToNamedCombatantEvent
    | HealthChangeEvent
    | SkillUsedEvent
    | TurnLostEvent
    | UnaccountedHealthEvent
    | UnknownMessageEvent;
