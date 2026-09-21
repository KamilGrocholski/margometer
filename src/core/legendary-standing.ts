/**
 * The two legendary bonuses a fighter's own tooltip can be honest about: the one that is still
 * running, and the one that has been spent.
 *
 * Neither rides a `skillId`, so the published skill table dates neither and `core/aura-standing.ts`
 * has no row for them. What dates the first is the published help, and the corpus agrees with it;
 * the second is dated by nothing and does not need to be, because it fires once.
 */

import { assert } from "@std/assert/assert";
import type { AttackEvent, BattleEvent } from "@/src/core/battle-event.ts";

/**
 * The declaration that lights the effect, and the key that heals under it. The declaration rides
 * the **holder's own** blow: _Zdarzenie może zajść wyłącznie podczas wykonania ataku przez
 * posiadacza bonusu_ (article `view,372`, read 2026-09-21).
 */
const HOLYTOUCH_DECLARATION = "+legbon_holytouch";
/** The bonus that heals once a fight, read off the value and never off a slot. */
const LASTHEAL_SOURCE = "legbon_lastheal";

/**
 * How long the effect runs, and the one length outside a charge this panel writes as a fraction.
 *
 * The published help: _Postać aplikuje na siebie efekt rozłożony na **3 tury**, którego każde
 * wyzwolenie leczy Postaci 6% puli punktów zdrowia_ (article `view,372`, read 2026-09-21). The
 * corpus never exceeds it — every lighting it holds ran three triggers at most
 * (`design/dziesiec/measured.json`, and `design/dymek/` measured it first) — so the denominator
 * is witnessed rather than merely published.
 */
export const HOLYTOUCH_TURNS_STATED = 3;

/** As many holders as a board has combatants, which `core/combatant-roster.ts` bounds lower. */
const MAXIMUM_HOLDERS = 64;

/** What one fight's bonuses have come to so far, carried payload to payload. */
export interface LegendaryWalk {
    /** The holder's own turn count when the effect last lit on them. */
    holytouchAtTurns: Map<number, number>;
    spentLastheal: Set<number>;
}

export function composeLegendaryWalk(): LegendaryWalk {
    return { holytouchAtTurns: new Map(), spentLastheal: new Set() };
}

/**
 * True where this blow declared the effect, which is the only statement that it was applied. A
 * predicate rather than a question, so the blow's own actor narrows with it (**C13**).
 */
function isHolytouchDeclared(event: BattleEvent): event is AttackEvent {
    assert(event.kind.length > 0, "an event asked about states its kind");
    if (event.kind !== "attack") return false;
    return event.declared.some((one) => one.effect === HOLYTOUCH_DECLARATION);
}

/**
 * One payload's events onto the walk, **after the clock has taken them**: the turn a run lit on
 * is the count its holder stood at once that payload was read, which is the granularity a
 * tooltip is written at anyway — one append per payload.
 *
 * ⚠️ **A second declaration restarts the run.** Re-applying while the effect stands is the game
 * doing it again, so the length a reader sees is of the run they are in and not of the pair.
 */
export function addPayloadToLegendaryStandings(
    walk: LegendaryWalk,
    events: readonly BattleEvent[],
    turnsByCombatantId: ReadonlyMap<number, number>,
): void {
    assert(walk.holytouchAtTurns.size <= MAXIMUM_HOLDERS, "a board holds a bounded cast");
    assert(walk.spentLastheal.size <= MAXIMUM_HOLDERS, "and so does what has been spent on it");
    for (const event of events) {
        if (isHolytouchDeclared(event)) {
            const holder = event.actorId;
            if (holder !== null) {
                walk.holytouchAtTurns.set(holder, turnsByCombatantId.get(holder) ?? 0);
            }
        }
        if (event.kind !== "healing-to-named-combatant") continue;
        if (event.source !== LASTHEAL_SOURCE) continue;
        if (event.targetId === null) continue;
        walk.spentLastheal.add(event.targetId);
    }
}

/** One combatant, and what the two bonuses say about them now. */
export interface LegendaryStanding {
    combatantId: number;
    /** Their own turns since it lit, or null where it is not standing on them. */
    holytouchTurnsElapsed: number | null;
    hasSpentLastheal: boolean;
}

/**
 * What stands now, one row per combatant either bonus has anything to say about. A run whose
 * stated turns have passed leaves, the way a cast leaves `core/aura-standing.ts`.
 */
export function composeLegendaryStandings(
    walk: LegendaryWalk,
    turnsByCombatantId: ReadonlyMap<number, number>,
): LegendaryStanding[] {
    const found = new Map<number, LegendaryStanding>();
    for (const [combatantId, turnsAtLighting] of walk.holytouchAtTurns) {
        const taken = turnsByCombatantId.get(combatantId) ?? turnsAtLighting;
        const turnsElapsed = taken - turnsAtLighting;
        assert(turnsElapsed >= 0, "a clock never runs behind the turn a bonus lit on");
        if (turnsElapsed >= HOLYTOUCH_TURNS_STATED) continue;
        found.set(combatantId, {
            combatantId,
            holytouchTurnsElapsed: turnsElapsed,
            hasSpentLastheal: walk.spentLastheal.has(combatantId),
        });
    }
    for (const combatantId of walk.spentLastheal) {
        if (found.has(combatantId)) continue;
        found.set(combatantId, {
            combatantId,
            holytouchTurnsElapsed: null,
            hasSpentLastheal: true,
        });
    }
    assert(found.size <= MAXIMUM_HOLDERS * 2, "no more rows than the two bonuses can put up");
    return [...found.values()].sort((one, other) => one.combatantId - other.combatantId);
}
