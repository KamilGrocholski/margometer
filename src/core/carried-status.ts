/**
 * What each combatant is carrying right now, and for how many of **their own** turns.
 *
 * The one channel that answers per combatant, and the only one that witnesses an end: a cast is
 * announced once and never mentioned again (**ADR 0059**), while a mask says what somebody holds
 * in every payload. Nothing here joins a status to the cast that lit it — the game states neither,
 * and **ADR 0061** is why the panel does not guess. **ADR 0104.**
 */

import { assert } from "@std/assert/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
    composeTurnStanding,
    getTurnOpener,
    NO_TURN_STANDING,
    type TurnStanding,
} from "@/src/core/fight-statistics.ts";

/** A mask arrives as one integer, so a bit past the thirty-second is not one this reader holds. */
export const MAXIMUM_STATUS_BITS = 32;
/** Past the combatants any fight puts on a board, which `core/combatant-roster.ts` also bounds. */
const MAXIMUM_CARRIERS = 64;

/**
 * How long a status runs for, by the name the client registers the bit under, where the published
 * help states a length for it at all. **The help dates these two and no other bit here.**
 *
 * Trucizna, at the weapon attributes `poison1, of_poison1`: _Są aplikowane na 5 tur po trafieniu
 * przeciwnika obrażeniami o niezerowej wartości_, and _Wyzwalają się przed turą przeciwnika, na
 * którego zostały zaaplikowane_ — so the length is counted on the bearer's own clock, which is
 * the clock this file already counts on. Głęboka rana, at `wound1, of_wound1`, states the same
 * five and caps its own extension at them: _przedłuża efekt obrażeń od głębokich ran o 2 tury
 * (maksymalnie do 5 tur)_. Article `view,372`, read 2026-09-22.
 *
 * ⚠️ **`wound` is Głęboka rana and `deep_wound` is not.** `docs/protocol-keys.md`'s `wound` entry
 * is what joins the bit to the weapon attribute the help dates; no reading joins `deep_wound` to
 * anything the help gives a length, so it carries none here.
 *
 * The corpus agrees rather than merely not disagreeing: `deno task fight:life` on 2026-09-22 puts
 * the length most runs come to at five for `poisoned` and three for `wound`, neither above the
 * ceiling.
 */
export const TURNS_STATED_BY_STATUS_NAME: Record<string, number> = {
    poisoned: 5,
    wound: 5,
};

/** One status one combatant is holding, with what has passed of it on their own clock. */
export interface CarriedStatus {
    combatantId: number;
    /** The position in the client's own registration order, which is what the bit means. */
    bit: number;
    /** Their own turns, taken and lost both, since the payload the status first stood in. */
    turnsElapsed: number;
}

interface HeldBit {
    turnsAtLighting: number;
}

/** What the walk carries between payloads. Nothing here is read by anybody but the walk. */
export interface CarriedStatusWalk {
    standing: TurnStanding;
    turnsByCombatantId: Map<number, number>;
    /** Keyed by combatant, then by bit, so a status gone is a key removed and never a zero. */
    heldByCombatantId: Map<number, Map<number, HeldBit>>;
}

export function composeCarriedStatusWalk(): CarriedStatusWalk {
    return {
        standing: NO_TURN_STANDING,
        turnsByCombatantId: new Map(),
        heldByCombatantId: new Map(),
    };
}

function addTurnToWalk(walk: CarriedStatusWalk, combatantId: number | null): void {
    if (combatantId === null) return;
    const taken = (walk.turnsByCombatantId.get(combatantId) ?? 0) + 1;
    assert(taken > 0, "a turn that was counted was counted at least once");
    walk.turnsByCombatantId.set(combatantId, taken);
}

/**
 * The turns a payload's own events opened, counted the way a cast's length is — taken and lost
 * both, because a turn granted and spent on nothing still passed for whoever had it.
 */
function addEventsToWalk(walk: CarriedStatusWalk, events: readonly BattleEvent[]): void {
    for (const event of events) {
        addTurnToWalk(walk, getTurnOpener(event, walk.standing));
        if (event.kind === "turn-lost") addTurnToWalk(walk, event.combatantId);
        walk.standing = composeTurnStanding(event, walk.standing);
    }
}

function isBitSet(mask: number, bit: number): boolean {
    assert(bit >= 0, "a bit is looked for at a position");
    assert(bit < MAXIMUM_STATUS_BITS, "and inside the integer a mask arrives as");
    return (mask >> bit & 1) === 1;
}

/**
 * One combatant's mask against what they were holding a payload ago. A bit already lit keeps the
 * turn it lit on: a status the game never let go of is one standing, however many casts refreshed
 * it, and re-reading its start would draw a length nobody carried.
 */
function setHeldFromMask(walk: CarriedStatusWalk, combatantId: number, mask: number): void {
    const clock = walk.turnsByCombatantId.get(combatantId) ?? 0;
    const before = walk.heldByCombatantId.get(combatantId) ?? new Map<number, HeldBit>();
    const held = new Map<number, HeldBit>();
    for (let bit = 0; bit < MAXIMUM_STATUS_BITS; bit += 1) {
        if (!isBitSet(mask, bit)) continue;
        held.set(bit, before.get(bit) ?? { turnsAtLighting: clock });
    }
    assert(held.size <= MAXIMUM_STATUS_BITS, "a combatant holds no more statuses than a mask has");
    if (held.size === 0) {
        walk.heldByCombatantId.delete(combatantId);
        return;
    }
    walk.heldByCombatantId.set(combatantId, held);
}

/**
 * A payload: the events it carried, then the masks it restated. In that order, because a status
 * lighting on the turn a combatant just took belongs to that turn and not to the one before it.
 *
 * ⚠️ **A combatant the payload says nothing about keeps what they were holding.** A payload
 * stating only what moved states no mask for anybody else, and clearing them on that silence
 * would take a status away every time the game sent a short payload.
 */
export function addPayloadToCarriedStatuses(
    walk: CarriedStatusWalk,
    events: readonly BattleEvent[],
    masksByCombatantId: ReadonlyMap<number, number>,
): void {
    addEventsToWalk(walk, events);
    for (const [combatantId, mask] of masksByCombatantId) {
        assert(mask >= 0, "a mask handed to the walk is a count of bits and never a sign");
        setHeldFromMask(walk, combatantId, mask);
    }
    assert(
        walk.heldByCombatantId.size <= MAXIMUM_CARRIERS,
        "no more combatants carry something than a fight puts on a board",
    );
}

/** What is being carried, one row per status per combatant, in a stated order. */
export function composeCarriedStatuses(walk: CarriedStatusWalk): CarriedStatus[] {
    const found: CarriedStatus[] = [];
    for (const [combatantId, held] of walk.heldByCombatantId) {
        const clock = walk.turnsByCombatantId.get(combatantId) ?? 0;
        for (const [bit, one] of held) {
            const turnsElapsed = clock - one.turnsAtLighting;
            assert(turnsElapsed >= 0, "a clock never runs behind the turn a status lit on");
            found.push({ combatantId, bit, turnsElapsed });
        }
    }
    assert(found.length <= MAXIMUM_CARRIERS * MAXIMUM_STATUS_BITS, "and no more rows than that");
    return found.sort((one, other) => one.combatantId - other.combatantId || one.bit - other.bit);
}
