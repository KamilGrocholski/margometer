/**
 * What the decoder produces and everything above it reads. **ADR 0008**, and what each key
 * means is `docs/protocol-keys.md`.
 */

export interface DamageFigure {
    element: string;
    amount: number;
}

/** Never the difference between raw and applied — armour and resistance reduce unreported. */
export interface PreventedDamage {
    defence: string;
    amount: number;
}

/** Not damage, and never totalled with it: points and percentage points, unit unstated. */
export interface DestroyedStatistic {
    statistic: string;
    amount: number;
}

/** The client renders the pair as one action; that both name one actor is our condition. */
export interface AnnouncedSkill {
    skillName: string;
    skillId: number | null;
    /** Carried, because the message it rides may be about somebody else. */
    actorId: number | null;
}

export interface SkillUsedEvent {
    kind: "skill-used";
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
    kind: "attack";
    actorId: number | null;
    targetId: number | null;
    /** Where each end stands once the blow is in — the one reading that can contradict a total. */
    actorHealthPercent: number | null;
    targetHealthPercent: number | null;
    /** Before reduction, and after it. Measured over `captures/`: never one without the other. */
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
    kind: "health-change";
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
 * Damage the protocol reports against a **name**, beside an attack aimed at somebody else. It
 * has already been reduced: there is no second figure the way raw and applied pair up.
 */
export interface DamageToNamedCombatantEvent {
    kind: "damage-to-named-combatant";
    actorId: number | null;
    targetName: string;
    /** Whom that name belongs to, once a roster could say — null on every way it could not. */
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
    kind: "declaration";
    combatantId: number | null;
    healthPercent: number | null;
    declared: DeclaredEffect[];
}

/**
 * Healing the protocol reports against a **name**, on a message whose two ends are somebody
 * else's fight. Neither slot is the healed, so the value is read and no slot is.
 */
export interface HealingToNamedCombatantEvent {
    kind: "healing-to-named-combatant";
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
    kind: "fight-outcome";
    /** `drawn` is a fight nobody won, which the protocol states on the winners' own key. */
    result: "won" | "lost" | "drawn";
    /** Empty for `drawn`, where the protocol names nobody — never a side that went unread. */
    combatantNames: string[];
}

/** A share stated about a whole side, recipients unstated. Never a figure of health on its own. */
export interface UnaccountedHealthEvent {
    kind: "unaccounted-health";
    source: string;
    /** The caster, read off the actor slot. Eight of the 115 in `captures/` name another target. */
    combatantId: number | null;
    declaredShare: number | null;
    announced: AnnouncedSkill | null;
}

/** A turn granted and spent on nothing, read off the game's own sentence. **ADR 0049.** */
export interface TurnLostEvent {
    kind: "turn-lost";
    /** The decoder resolves the name and none of that sentence travels with it. */
    combatantId: number | null;
}

/** A message left unread, carrying what it was so nothing about it is invented. */
export interface UnknownMessageEvent {
    kind: "unknown-message";
    message: string;
    reason: string;
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

/** Kept as a value because a guard iterates it; `satisfies` is what stops it drifting. */
export const BATTLE_EVENT_KINDS = [
    "attack",
    "damage-to-named-combatant",
    "declaration",
    "fight-outcome",
    "healing-to-named-combatant",
    "health-change",
    "skill-used",
    "turn-lost",
    "unaccounted-health",
    "unknown-message",
] as const satisfies readonly BattleEvent["kind"][];
