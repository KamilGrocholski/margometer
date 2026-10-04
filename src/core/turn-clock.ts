/**
 * Whose turn an event opens, and what is still running when the next one is read. The figures, the
 * carried statuses and the standings all count turns on this one clock.
 *
 * Four things open a turn, two of them the game's own default actions; the two that look like a
 * turn and are not are measured exceptions. `docs/turns-taken.md` names all six.
 */

import { assert } from "@std/assert/assert";
import { BATTLE_EVENT, type BattleEvent, type DeclarationEvent } from "./battle-event.ts";
import { COMBATANTS_MAXIMUM } from "./combatant-roster.ts";
import { PREPARE_KEY, STEP_KEY } from "./protocol-key.ts";

/**
 * The extra attacks of one skill are all one turn (published help, article 372 §2.1 and the
 * `add_attacks` effect, read 2026-09-02), and a preparation stated beside its own combatant's
 * action rides it.
 */
export interface TurnStanding {
    announcedStrikerId: number | null;
    lastActorId: number | null;
}

/** Where a fight starts: nobody mid-blow and nobody having acted. */
export const NO_TURN_STANDING: TurnStanding = { announcedStrikerId: null, lastActorId: null };

/** Whose turn this event opens, or null where it opens none. */
export function lookupTurnOpener(event: BattleEvent, turnStanding: TurnStanding): number | null {
    if (event.kind === BATTLE_EVENT.skillUsed) return event.actorId;
    if (event.kind === BATTLE_EVENT.attack) {
        if (event.announced !== null) return null;
        if (turnStanding.announcedStrikerId === event.actorId) return null;
        return event.actorId;
    }
    if (event.kind !== BATTLE_EVENT.declaration) return null;
    const key = lookupDeclarationOpenerKey(event);
    if (key === STEP_KEY) return event.combatantId;
    if (key === null) return null;
    if (turnStanding.lastActorId === event.combatantId) return null;
    return event.combatantId;
}

/**
 * The key a declaration would open its turn on: a step before a preparation, since a step is a
 * turn whoever acted before it. Null where it states neither. `tools/turn-reading.ts` names a
 * turn's opener by this, so the report and the clock cannot read one declaration two ways.
 */
export function lookupDeclarationOpenerKey(event: DeclarationEvent): string | null {
    if (hasDeclaredEffect(event, STEP_KEY)) return STEP_KEY;
    if (hasDeclaredEffect(event, PREPARE_KEY)) return PREPARE_KEY;
    return null;
}

function hasDeclaredEffect(event: DeclarationEvent, effect: string): boolean {
    assert(effect.length > 0, "a declaration is looked up under a key");
    assert(event.declared.length > 0, "a declaration states something");
    return event.declared.some((declared) => declared.effect === effect);
}

/**
 * One event on every combatant's own clock, answering the standing the next event is read on. A
 * turn lost passes the clock as a turn taken does: granted and spent on nothing, it still passed.
 */
export function addEventTurns(
    turnsByCombatantId: Map<number, number>,
    event: BattleEvent,
    turnStanding: TurnStanding,
): TurnStanding {
    addTurn(turnsByCombatantId, lookupTurnOpener(event, turnStanding));
    if (event.kind === BATTLE_EVENT.turnLost) addTurn(turnsByCombatantId, event.combatantId);
    return composeTurnStanding(event, turnStanding);
}

function addTurn(turnsByCombatantId: Map<number, number>, combatantId: number | null): void {
    if (combatantId === null) return;
    const turnsTaken = turnsByCombatantId.get(combatantId) ?? 0;
    assert(turnsTaken >= 0, "a count of turns is never below nothing");
    turnsByCombatantId.set(combatantId, turnsTaken + 1);
    // The ids a fight's messages name are its rows', held to the same bound.
    assert(turnsByCombatantId.size <= COMBATANTS_MAXIMUM, "a clock runs for no more than a fight");
}

/**
 * The same standing, one event on. A blow keeps the announcement going only while it is that
 * announcement's own; anything else ends it, and an event that is nobody's action ends both
 * halves. Damage stated by name is its actor's action as much as a blow is.
 */
export function composeTurnStanding(event: BattleEvent, turnStanding: TurnStanding): TurnStanding {
    if (turnStanding.announcedStrikerId !== null) {
        assert(
            turnStanding.announcedStrikerId === turnStanding.lastActorId,
            "whoever is mid-blow acted last",
        );
    }
    if (event.kind === BATTLE_EVENT.attack) {
        let isStriking: boolean;
        if (event.announced !== null) isStriking = true;
        else isStriking = turnStanding.announcedStrikerId === event.actorId;
        return {
            announcedStrikerId: isStriking ? event.actorId : null,
            lastActorId: event.actorId,
        };
    }
    if (event.kind === BATTLE_EVENT.skillUsed) {
        return { announcedStrikerId: null, lastActorId: event.actorId };
    }
    if (event.kind === BATTLE_EVENT.damageToNamedCombatant) {
        return { announcedStrikerId: null, lastActorId: event.actorId };
    }
    if (event.kind === BATTLE_EVENT.declaration) {
        return { announcedStrikerId: null, lastActorId: turnStanding.lastActorId };
    }
    return NO_TURN_STANDING;
}
