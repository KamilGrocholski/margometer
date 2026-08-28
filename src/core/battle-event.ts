/**
 * What the decoder produces and everything above it reads. **ADR 0008**, and what each key
 * means is `docs/protocol-keys.md`.
 */

/** The element is the client's own token: the key with its sign taken off. */
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
}

/** A message this decoder did not read, so a panel can say which total may be short. */
export interface UnknownMessageEvent {
    kind: "unknown-message";
    message: string;
    reason: string;
    /** One per occurrence. Empty where the grammar failed, never "nothing went unread". */
    unreadKeys: readonly string[];
    /** The ends the message named, read off the grammar and nowhere else. */
    combatantIds: readonly number[];
}

export type BattleEvent = AttackEvent | UnknownMessageEvent;

/** Kept as a value because a guard iterates it; `satisfies` is what stops it drifting. */
export const BATTLE_EVENT_KINDS = [
    "attack",
    "unknown-message",
] as const satisfies readonly BattleEvent["kind"][];
