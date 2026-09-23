/**
 * The two legendary bonuses a fighter's own tooltip can be honest about: the one that is still
 * running, and the one that has been spent.
 *
 * Neither rides a `skillId`, so the published skill table dates neither and `core/aura-standing.ts`
 * has no row for them. The first is counted by its own heals, each of which the payload carries;
 * the second is dated by nothing and does not need to be, because it fires once. **ADR 0113.**
 */

import { assert } from "@std/assert/assert";
import type { AttackEvent, BattleEvent } from "@/src/core/battle-event.ts";

/**
 * The declaration that lights the effect, and the key that heals under it. The declaration rides
 * the **holder's own** blow: _Zdarzenie może zajść wyłącznie podczas wykonania ataku przez
 * posiadacza bonusu_ (article `view,372`, read 2026-09-21).
 */
const HOLYTOUCH_DECLARATION = "+legbon_holytouch";
const HOLYTOUCH_HEAL = "legbon_holytouch_heal";
/** The bonus that heals once a fight, read off the value and never off a slot. */
const LASTHEAL_SOURCE = "legbon_lastheal";

/**
 * How many heals one lighting gives. The published help: _Postać aplikuje na siebie efekt
 * rozłożony na **3 tury**, którego każde wyzwolenie leczy Postaci 6% puli punktów zdrowia_
 * (article `view,372`, read 2026-09-21). Over `captures/` on 2026-09-23 no lighting ran more than
 * three heals. ⚠️ **Counted in heals and never in the holder's turns**, which the heals do not
 * keep to — **ADR 0113**.
 */
export const HOLYTOUCH_HEALS_STATED = 3;

/** As many holders as a board has combatants, which `core/combatant-roster.ts` bounds lower. */
const MAXIMUM_HOLDERS = 64;

/** What one fight's bonuses have come to so far, carried payload to payload. */
export interface LegendaryWalk {
    /** The heals the holder's current run has given them so far. */
    holytouchHealsByHolder: Map<number, number>;
    spentLastheal: Set<number>;
}

export function composeLegendaryWalk(): LegendaryWalk {
    return { holytouchHealsByHolder: new Map(), spentLastheal: new Set() };
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
 * One payload's events onto the walk, in the order the payload carries them: a heal in the same
 * payload as its lighting belongs to the run that lighting opened.
 *
 * ⚠️ **A second declaration restarts the run.** Re-applying while the effect stands is the game
 * doing it again, so the count a reader sees is of the run they are in and not of the pair — over
 * `captures/` on 2026-09-23, nine runs were cut short this way after one or two heals.
 */
export function addPayloadToLegendaryStandings(
    walk: LegendaryWalk,
    events: readonly BattleEvent[],
): void {
    assert(walk.holytouchHealsByHolder.size <= MAXIMUM_HOLDERS, "a board holds a bounded cast");
    assert(walk.spentLastheal.size <= MAXIMUM_HOLDERS, "and so does what has been spent on it");
    for (const event of events) {
        if (isHolytouchDeclared(event)) {
            const holder = event.actorId;
            if (holder !== null) walk.holytouchHealsByHolder.set(holder, 0);
        }
        addHolytouchHealToWalk(walk, event);
        if (event.kind !== "healing-to-named-combatant") continue;
        if (event.source !== LASTHEAL_SOURCE) continue;
        if (event.targetId === null) continue;
        walk.spentLastheal.add(event.targetId);
    }
}

/**
 * A heal with no run open is dropped rather than opening one: nothing dates where it began, and
 * over `captures/` on 2026-09-23 none of the 171 heals arrived without its lighting before it.
 */
function addHolytouchHealToWalk(walk: LegendaryWalk, event: BattleEvent): void {
    if (event.kind !== "health-change") return;
    if (event.source !== HOLYTOUCH_HEAL) return;
    if (event.combatantId === null) return;
    const heals = walk.holytouchHealsByHolder.get(event.combatantId);
    if (heals === undefined) return;
    walk.holytouchHealsByHolder.set(event.combatantId, heals + 1);
}

/** One combatant, and what the two bonuses say about them now. */
export interface LegendaryStanding {
    combatantId: number;
    /** The heals their current run has given them, or null where it is not standing on them. */
    holytouchHealsGiven: number | null;
    hasSpentLastheal: boolean;
}

/**
 * What stands now, one row per combatant either bonus has anything to say about. A run that has
 * given its stated heals leaves on the payload that carried the last of them.
 *
 * ⚠️ **A run the game stops short stands until the fight ends**, and no turn bound backs it: no
 * run over `captures/` outlived its heals, so the bound would be a guess (**ADR 0113**).
 */
export function composeLegendaryStandings(walk: LegendaryWalk): LegendaryStanding[] {
    const found = new Map<number, LegendaryStanding>();
    for (const [combatantId, heals] of walk.holytouchHealsByHolder) {
        assert(heals >= 0, "a run has given no fewer heals than none");
        if (heals >= HOLYTOUCH_HEALS_STATED) continue;
        found.set(combatantId, {
            combatantId,
            holytouchHealsGiven: heals,
            hasSpentLastheal: walk.spentLastheal.has(combatantId),
        });
    }
    for (const combatantId of walk.spentLastheal) {
        if (found.has(combatantId)) continue;
        found.set(combatantId, {
            combatantId,
            holytouchHealsGiven: null,
            hasSpentLastheal: true,
        });
    }
    assert(found.size <= MAXIMUM_HOLDERS * 2, "no more rows than the two bonuses can put up");
    return [...found.values()].sort((one, other) => one.combatantId - other.combatantId);
}
