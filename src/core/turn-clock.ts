/**
 * Whose turn an event opens, and what is still running when the next one is read. The figures, the
 * carried statuses and the standings all count turns on this one clock.
 *
 * Four things open a turn, two of them the game's own default actions; the two that look like a
 * turn and are not are measured exceptions. `develop:docs/turns-taken.md` names all six.
 */

import { assert } from "@std/assert/assert";
import { BATTLE_EVENT, type BattleEvent, type DeclarationEvent } from "./battle-event.ts";
import { PREPARE_KEY, STEP_KEY } from "./protocol-key.ts";

/**
 * The extra attacks of one skill are all one turn (published help, article 372 §2.1 and the
 * `add_attacks` effect, read 2026-09-02), and a preparation stated beside its own combatant's
 * action rides it.
 */
export interface TurnStanding {
    strikingId: number | null;
    actingId: number | null;
}

/** Where a fight starts: nobody mid-blow and nobody having acted. */
export const NO_TURN_STANDING: TurnStanding = { strikingId: null, actingId: null };

/** Whose turn this event opens, or null where it opens none. */
export function lookupTurnOpener(event: BattleEvent, standing: TurnStanding): number | null {
    if (event.kind === BATTLE_EVENT.skillUsed) return event.actorId;
    if (event.kind === BATTLE_EVENT.attack) {
        if (event.announced !== null) return null;
        if (standing.strikingId === event.actorId) return null;
        return event.actorId;
    }
    if (event.kind !== BATTLE_EVENT.declaration) return null;
    if (hasDeclaredEffect(event, STEP_KEY)) return event.combatantId;
    if (!hasDeclaredEffect(event, PREPARE_KEY)) return null;
    if (standing.actingId === event.combatantId) return null;
    return event.combatantId;
}

function hasDeclaredEffect(event: DeclarationEvent, effect: string): boolean {
    assert(effect.length > 0, "a declaration is looked up under a key");
    assert(event.declared.length > 0, "a declaration states something");
    return event.declared.some((declared) => declared.effect === effect);
}

/**
 * The same standing, one event on. A blow keeps the announcement going only while it is that
 * announcement's own; anything else ends it, and an event that is nobody's action ends both
 * halves. Damage stated by name is its actor's action as much as a blow is.
 */
export function composeTurnStanding(event: BattleEvent, standing: TurnStanding): TurnStanding {
    if (standing.strikingId !== null) {
        assert(standing.strikingId === standing.actingId, "whoever is mid-blow acted last");
    }
    if (event.kind === BATTLE_EVENT.attack) {
        let isStriking = event.announced !== null;
        if (!isStriking) isStriking = standing.strikingId === event.actorId;
        return { strikingId: isStriking ? event.actorId : null, actingId: event.actorId };
    }
    if (event.kind === BATTLE_EVENT.skillUsed) return { strikingId: null, actingId: event.actorId };
    if (event.kind === BATTLE_EVENT.damageToNamedCombatant) {
        return { strikingId: null, actingId: event.actorId };
    }
    if (event.kind === BATTLE_EVENT.declaration) {
        return { strikingId: null, actingId: standing.actingId };
    }
    return NO_TURN_STANDING;
}
