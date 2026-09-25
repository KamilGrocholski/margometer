/**
 * What each combatant is carrying right now, and for how many of **their own** turns.
 *
 * The one channel that answers per combatant, and the only one that witnesses an end: a cast is
 * announced once and never mentioned again (`develop ADR 0059`), while a mask says what somebody
 * holds in every payload. Nothing here joins a status to the cast that lit it; the game states
 * neither (`develop ADR 0061`, `0104`).
 */

import { assert } from "@std/assert/assert";
import { BATTLE_EVENT, type BattleEvent } from "./battle-event.ts";
import {
    composeTurnStanding,
    lookupTurnOpener,
    NO_TURN_STANDING,
    type TurnStanding,
} from "./turn-clock.ts";

/** One status one combatant is holding, with what has passed of it on their own clock. */
export interface CarriedStatus {
    combatantId: number;
    /** The position in the client's own registration order, which is what the bit means. */
    bit: number;
    /** Their own turns, taken and lost both, since the payload the status first stood in. */
    turnsElapsed: number;
}

/** What the walk carries between payloads: the clock, and each held bit's turn at lighting. */
export interface CarriedStatusWalk {
    readonly standing: TurnStanding;
    readonly turnsByCombatantId: ReadonlyMap<number, number>;
    /** Keyed by combatant, then by bit, so a status gone is a key removed and never a zero. */
    readonly heldByCombatantId: ReadonlyMap<number, ReadonlyMap<number, number>>;
}

/** A mask arrives as one integer, so a bit past the thirty-second is not one this reader holds. */
export const STATUS_BITS_MAXIMUM = 32;
/** Past the combatants any fight puts on a board: a mask may name a warrior the cast does not. */
const CARRIERS_MAXIMUM = 64;

export const NO_CARRIED_STATUS_WALK: CarriedStatusWalk = {
    standing: NO_TURN_STANDING,
    turnsByCombatantId: new Map(),
    heldByCombatantId: new Map(),
};

/**
 * A payload: the events it carried, then the masks it restated. In that order, because a status
 * lighting on the turn a combatant just took belongs to that turn and not to the one before it.
 * The walk handed in is left as it was.
 *
 * ⚠️ **A combatant the payload says nothing about keeps what they were holding.** A payload stating
 * only what moved states no mask for anybody else.
 */
export function prepareCarriedStatuses(
    walk: CarriedStatusWalk,
    events: readonly BattleEvent[],
    masksByCombatantId: ReadonlyMap<number, number>,
): CarriedStatusWalk {
    const turnsByCombatantId = new Map(walk.turnsByCombatantId);
    let standing = walk.standing;
    for (const event of events) {
        addTurn(turnsByCombatantId, lookupTurnOpener(event, standing));
        if (event.kind === BATTLE_EVENT.turnLost) addTurn(turnsByCombatantId, event.combatantId);
        standing = composeTurnStanding(event, standing);
    }
    const heldByCombatantId = new Map(walk.heldByCombatantId);
    for (const [combatantId, mask] of masksByCombatantId) {
        assert(Number.isSafeInteger(mask), "a mask handed to the walk is a whole count of bits");
        assert(mask >= 0, "and never a sign");
        const clock = turnsByCombatantId.get(combatantId) ?? 0;
        const held = prepareCarriedStatusesHeld(heldByCombatantId.get(combatantId), mask, clock);
        if (held.size === 0) heldByCombatantId.delete(combatantId);
        else heldByCombatantId.set(combatantId, held);
    }
    assert(heldByCombatantId.size <= CARRIERS_MAXIMUM, "no more carriers than a board holds");
    return { standing, turnsByCombatantId, heldByCombatantId };
}

function addTurn(turnsByCombatantId: Map<number, number>, combatantId: number | null): void {
    if (combatantId === null) return;
    const taken = (turnsByCombatantId.get(combatantId) ?? 0) + 1;
    assert(taken > 0, "a turn that was counted was counted at least once");
    turnsByCombatantId.set(combatantId, taken);
}

/**
 * One combatant's mask against what they were holding a payload ago. A bit already lit keeps the
 * turn it lit on: a status the game never let go of is one standing, however many casts refreshed
 * it, and re-reading its start would draw a length nobody carried.
 */
function prepareCarriedStatusesHeld(
    before: ReadonlyMap<number, number> | undefined,
    mask: number,
    clock: number,
): Map<number, number> {
    assert(clock >= 0, "a clock counts turns from none");
    const held = new Map<number, number>();
    for (let bit = 0; bit < STATUS_BITS_MAXIMUM; bit += 1) {
        if ((mask >> bit & 1) !== 1) continue;
        held.set(bit, before?.get(bit) ?? clock);
    }
    assert(held.size <= STATUS_BITS_MAXIMUM, "a combatant holds no more statuses than a mask has");
    return held;
}

/** What is being carried, one row per status per combatant, by combatant and then by bit. */
export function composeCarriedStatuses(walk: CarriedStatusWalk): CarriedStatus[] {
    const found: CarriedStatus[] = [];
    for (const [combatantId, held] of walk.heldByCombatantId) {
        const clock = walk.turnsByCombatantId.get(combatantId) ?? 0;
        for (const [bit, turnsAtLighting] of held) {
            const turnsElapsed = clock - turnsAtLighting;
            assert(turnsElapsed >= 0, "a clock never runs behind the turn a status lit on");
            found.push({ combatantId, bit, turnsElapsed });
        }
    }
    assert(found.length <= CARRIERS_MAXIMUM * STATUS_BITS_MAXIMUM, "no more rows than bits");
    return found.sort((one, other) => one.combatantId - other.combatantId || one.bit - other.bit);
}
