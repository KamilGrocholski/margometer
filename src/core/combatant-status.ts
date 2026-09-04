/**
 * What the payload's own status mask says stands on a combatant: one integer, read bit by bit.
 * This file owns what a bit means, as `core/fight-decoder.ts` owns what a message key means.
 */

import { assert } from "@std/assert/assert";

/**
 * The nine the client tips, in bit order — `updateWarriorBuffs` and `buffNames` on development
 * build `1781609507010`. `swow_down` is the game's own spelling and nobody here's to correct.
 */
export const STATUS_KEYS = [
    "deep_wound",
    "wound",
    "critical_deep_wound",
    "poisoned",
    "fire",
    "swow_down",
    "speed_up",
    "frostbite",
    "shock",
] as const;

export type StatusKey = typeof STATUS_KEYS[number];

/**
 * ⚠️ **The mask is wider than the client reads.** Measured over `captures/` 2026-09-03: bit 10 is
 * set 12 times and the client's loop stops at 8, so the walk runs to the last bit below the sign.
 */
export const MAXIMUM_STATUS_BIT = 30;

/** Every bit the walk reaches, set. A mask above it is refused rather than quietly truncated. */
const MAXIMUM_STATUS_MASK = 2147483647;

export interface CombatantStatus {
    bit: number;
    /** Null where the game sets a bit it words for nobody. */
    key: StatusKey | null;
}

export function getStatusKeyForBit(bit: number): StatusKey | null {
    assert(Number.isSafeInteger(bit), "a bit of the mask is a whole number");
    assert(bit >= 0, "and is not below the first one");
    return STATUS_KEYS[bit] ?? null;
}

export function decodeStatusesFromMask(mask: number): CombatantStatus[] {
    assert(Number.isSafeInteger(mask), "a mask that is decoded is a whole number");
    assert(mask >= 0, "and is not below nothing");
    assert(mask <= MAXIMUM_STATUS_MASK, "and sets no bit past the ones this walk reaches");
    const standing: CombatantStatus[] = [];
    for (let bit = 0; bit <= MAXIMUM_STATUS_BIT; bit += 1) {
        if ((mask >> bit & 1) === 0) continue;
        standing.push({ bit, key: getStatusKeyForBit(bit) });
    }
    assert(standing.length <= MAXIMUM_STATUS_BIT + 1, "no more standing than there are bits");
    assert(standing.every((one) => one.bit >= 0), "and each of them names the bit it stood at");
    return standing;
}

/** Indices into the fight's own events. **ADR 0022** puts the count in the statistics, not here. */
export interface CombatantStatusEpisode {
    combatantId: number;
    bit: number;
    fromEventIndex: number;
    /** Null while it is still standing. */
    toEventIndex: number | null;
    /** The game had already set the bit when this reader first saw the combatant. */
    wasStandingAtFirstSight: boolean;
}

/** `turns` is what has passed and never what is left — **ADR 0050**. */
export interface StatusStanding {
    bit: number;
    key: StatusKey | null;
    turns: number;
    wasStandingAtFirstSight: boolean;
}

/** One episode of the fight, closed or still standing, with the turns it ran for. */
export interface StatusRun extends StatusStanding {
    combatantId: number;
    isStanding: boolean;
}
