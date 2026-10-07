/**
 * What a status a combatant is carrying comes to, where anything may be said of it at all.
 *
 * The mask says **on whom** and never how much; an announcement says **how much** and never on
 * whom (`develop ADR 0061`). This file is the one place the two are put together, and it is
 * deliberately mean about it: a figure stands only where a cast of the key the status is moved by
 * reaches the side the bearer is on. Everything else is silence, which the row already says.
 */

import { assert } from "@std/assert/assert";
import { type AuraStanding, STANDINGS_MAXIMUM } from "./aura-standing.ts";
import { type CarriedStatus, STATUS_BITS_MAXIMUM } from "./carried-status.ts";
import type { CombatantRoster } from "./combatant-roster.ts";
import { HASTE_AURA_KEY, KEY_REACH, lookupKeyReach, SLOW_ALL_KEY } from "./protocol-key.ts";

/** One status, with what the announcements standing over its bearer come to. */
export interface CarriedFigure {
    combatantId: number;
    bit: number;
    /** A share of what the bearer has, or null where no cast over them may be read as theirs. */
    percent: number | null;
}

/** What a reading of the fight hands over, so this file reads no walk of its own. */
export interface CarriedFigureInputs {
    statuses: readonly CarriedStatus[];
    /** Every dated cast, cut here on the bearer's clock and never on the caster's. */
    casts: readonly AuraStanding[];
    roster: CombatantRoster;
    /** Turns taken per combatant, the clock a cast is held to while it stands on a bearer. */
    turnsByCombatantId: ReadonlyMap<number, number>;
    /** Which key moves which bit, handed over by whoever holds the frozen list of bits. */
    keyByStatusBit: ReadonlyMap<number, string>;
}

interface Bearer {
    combatantId: number;
    side: number;
    turnsTaken: number;
}

/**
 * How many sources one effect adds up from: the help stacks it from at most two sources belonging
 * to different characters, and `taken_dmg_per-all` says the two highest (`docs/auras-standing.md`).
 * ⚠️ **The two highest, not the two latest**: where three or more stood at once over `captures/`
 * (2026-09-21) the two sets differ in 258 moments of 755 for `speed_up`, 13 of 94 for `swow_down`.
 */
const SOURCES_COUNTED = 2;

/**
 * The keys whose published help gives the caster a different amount from everybody else: half the
 * speed-up for whoever cast it (`docs/auras-standing.md`). What the half rounds to is stated
 * nowhere, so the caster's own row carries **no figure** rather than an invented one.
 */
const HALVED_FOR_THE_CASTER = [HASTE_AURA_KEY];

/** The client's own spelling, `swow_down` included (N4, N13). */
export const SLOW_BIT_NAME = "swow_down";
export const HASTE_BIT_NAME = "speed_up";

/**
 * Which key moves which status, by the name the client registers the bit under. No other bit has a
 * key that states a figure for it (`docs/auras-standing.md`).
 */
const KEY_BY_BIT_NAME: ReadonlyMap<string, string> = new Map([
    [SLOW_BIT_NAME, SLOW_ALL_KEY],
    [HASTE_BIT_NAME, HASTE_AURA_KEY],
]);

/** The two bits above at the positions the client registered them. */
export function indexKeyByStatusBit(bits: readonly string[]): Map<number, string> {
    assert(bits.length <= STATUS_BITS_MAXIMUM, "the client registers a short list of statuses");
    const keyByStatusBit = new Map<number, string>();
    for (let bit = 0; bit < bits.length; bit += 1) {
        const key = KEY_BY_BIT_NAME.get(bits[bit] ?? "");
        if (key !== undefined) keyByStatusBit.set(bit, key);
    }
    assert(keyByStatusBit.size <= KEY_BY_BIT_NAME.size, "no more are witnessed than have a key");
    return keyByStatusBit;
}

/** One row per status a figure can be said of, and none for the rest. */
export function tallyCarriedFigures(inputs: CarriedFigureInputs): CarriedFigure[] {
    assert(
        inputs.keyByStatusBit.size <= STATUS_BITS_MAXIMUM,
        "the bits witnessed are a short list",
    );
    const carriedFigures: CarriedFigure[] = [];
    for (const status of inputs.statuses) {
        const key = inputs.keyByStatusBit.get(status.bit);
        if (key === undefined) continue;
        const combatant = inputs.roster.byId.get(status.combatantId);
        if (combatant === undefined) continue;
        const turnsTaken = inputs.turnsByCombatantId.get(status.combatantId) ?? 0;
        const bearer = { combatantId: status.combatantId, side: combatant.side, turnsTaken };
        const casts = lookupCastsOverBearer(inputs.casts, inputs.roster, bearer, key);
        const percent = tallyPercentForBearer(casts, bearer, key);
        carriedFigures.push({ combatantId: status.combatantId, bit: status.bit, percent });
    }
    assert(carriedFigures.length <= inputs.statuses.length, "no more rows than statuses handed in");
    return carriedFigures;
}

/**
 * The casts of one key still standing **over this bearer**: reaching their side, and inside the
 * turns the table gives them, counted on the bearer's own clock from the cast. ⚠️ **Never on the
 * caster's** (`docs/auras-standing.md`): a caster who outruns the bearer would end a cast the bearer
 * still carries, and one who stops taking turns would stand it past its own length. A bearer the
 * cast's count leaves out was seated after it, and it never reached them.
 */
function lookupCastsOverBearer(
    casts: readonly AuraStanding[],
    roster: CombatantRoster,
    bearer: Bearer,
    key: string,
): AuraStanding[] {
    assert(casts.length <= STANDINGS_MAXIMUM, "a walk over casts is bounded as the casts are");
    assert(bearer.turnsTaken >= 0, "and a count of turns never runs backwards");
    const castsOverBearer: AuraStanding[] = [];
    for (const cast of casts) {
        if (cast.amountByKey.get(key) === undefined) continue;
        const caster = roster.byId.get(cast.casterId);
        if (caster === undefined) continue;
        if (!doesKeyReachBearer(key, caster.side, bearer.side)) continue;
        const turnsAtCast = cast.turnsAtCastByCombatantId.get(bearer.combatantId);
        if (turnsAtCast === undefined) continue;
        const turnsElapsed = bearer.turnsTaken - turnsAtCast;
        if (turnsElapsed < 0) continue;
        if (turnsElapsed < cast.turnsStated) castsOverBearer.push(cast);
    }
    assert(
        castsOverBearer.length <= casts.length,
        "a bearer is reached by some of the casts walked",
    );
    return castsOverBearer;
}

/**
 * The reach is the key's own and never the skill's: one announcement may reach both ways. A key
 * reaches one side, so both sides is the cast's answer and never this one's.
 */
function doesKeyReachBearer(key: string, casterSide: number, bearerSide: number): boolean {
    assert(key.length > 0, "a reach is asked of a key");
    assert(Number.isSafeInteger(casterSide), "and between two sides the roster states");
    const reach = lookupKeyReach(key);
    if (reach === null) return false;
    if (reach === KEY_REACH.castersSide) return casterSide === bearerSide;
    return casterSide !== bearerSide;
}

/**
 * What one status comes to on one bearer, or null. ⚠️ **Null is the common answer**: over
 * `captures/` 2026-09-21 a combatant carrying `swow_down` had no cast of `allslow_per`
 * standing over them in 2211 moments of 3308. An item's own bonus adds to the same total and is
 * announced nowhere, so the figure would be a part passing itself off as the whole.
 */
function tallyPercentForBearer(
    casts: readonly AuraStanding[],
    bearer: Bearer,
    key: string,
): number | null {
    assert(key.length > 0, "a figure is asked of a key");
    assert(casts.length <= STANDINGS_MAXIMUM, "and over the casts the walk above bounded");
    if (isCasterHalved(casts, bearer.combatantId, key)) return null;
    if (casts.length === 0) return null;
    // A source is a caster, at their highest cast (`docs/auras-standing.md`).
    const highestByCasterId = new Map<number, number>();
    for (const cast of casts) {
        const amount = cast.amountByKey.get(key);
        assert(amount !== undefined, "a cast over the bearer states the key it was walked for");
        const highest = highestByCasterId.get(cast.casterId) ?? amount;
        highestByCasterId.set(cast.casterId, Math.max(highest, amount));
    }
    assert(highestByCasterId.size <= casts.length, "no more sources than casts");
    const amountsDescending = [...highestByCasterId.values()].sort((leftAmount, rightAmount) =>
        rightAmount - leftAmount
    );
    let summed = 0;
    for (let amountIndex = 0; amountIndex < SOURCES_COUNTED; amountIndex += 1) {
        summed += amountsDescending[amountIndex] ?? 0;
    }
    return summed;
}

/**
 * True where one of the casts over this bearer is their own, of a key that hands its caster a
 * different amount. Their own cast is dated on their own clock, which is the caster's as well.
 */
function isCasterHalved(
    casts: readonly AuraStanding[],
    combatantId: number,
    key: string,
): boolean {
    assert(Number.isSafeInteger(combatantId), "a bearer is asked about by identity");
    if (!HALVED_FOR_THE_CASTER.includes(key)) return false;
    return casts.some((cast) => {
        if (cast.casterId !== combatantId) return false;
        return cast.amountByKey.get(key) !== undefined;
    });
}
