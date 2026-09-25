/**
 * What a status a combatant is carrying comes to, where anything may be said of it at all.
 *
 * The mask says **on whom** and never how much; an announcement says **how much** and never on
 * whom (`develop ADR 0061`). This file is the one place the two are put together, and it is
 * deliberately mean about it: a figure stands only where a cast of the key the status is moved by
 * reaches the side the bearer is on. Everything else is silence, which the row already says.
 */

import { assert } from "@std/assert/assert";
import type { AuraStanding } from "./aura-standing.ts";
import type { CarriedStatus } from "./carried-status.ts";
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
export interface CarriedFigureReading {
    statuses: readonly CarriedStatus[];
    standings: readonly AuraStanding[];
    roster: CombatantRoster;
    /** Turns taken per combatant, the clock a cast is held to while it stands on a bearer. */
    turnsByCombatantId: ReadonlyMap<number, number>;
    /** Which key moves which bit, handed over by whoever holds the frozen list of bits. */
    witnessed: ReadonlyMap<number, string>;
}

interface Bearer {
    combatantId: number;
    side: number;
    turnsTaken: number;
}

/**
 * How many sources one effect adds up from: _Efekt ulega kumulacji do maksymalnie dwóch źródeł od
 * różnych Graczy_, and `taken_dmg_per-all` sharper, _do dwóch najwyższych źródeł_. ⚠️ **The two
 * highest, not the two latest**: where three or more stood at once over `captures/`
 * (2026-09-21) the two sets differ in 258 moments of 755 for `speed_up`, 13 of 94 for `swow_down`.
 */
const SOURCES_COUNTED = 2;

/** Past the casts of one key that ever stood over one bearer, which the corpus puts at four. */
const SOURCES_MAXIMUM = 32;

/**
 * The keys whose published help gives the caster a different amount from everybody else:
 * _Na Postać rzucającą efekt, wartość przyspieszenia jest o połowę niższa._ What the half rounds to
 * is stated nowhere, so the caster's own row carries **no figure** rather than an invented one.
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
export function indexWitnessedKeyByBit(bits: readonly string[]): Map<number, string> {
    assert(bits.length <= SOURCES_MAXIMUM, "the client registers a short list of statuses");
    const found = new Map<number, string>();
    for (let bit = 0; bit < bits.length; bit += 1) {
        const key = KEY_BY_BIT_NAME.get(bits[bit] ?? "");
        if (key !== undefined) found.set(bit, key);
    }
    assert(found.size <= KEY_BY_BIT_NAME.size, "no more are witnessed than have a key");
    return found;
}

/** One row per status a figure can be said of, and none for the rest. */
export function tallyCarriedFigures(reading: CarriedFigureReading): CarriedFigure[] {
    assert(reading.witnessed.size <= SOURCES_MAXIMUM, "the bits witnessed are a short list");
    const found: CarriedFigure[] = [];
    for (const status of reading.statuses) {
        const key = reading.witnessed.get(status.bit);
        if (key === undefined) continue;
        const combatant = reading.roster.byId.get(status.combatantId);
        if (combatant === undefined) continue;
        const turnsTaken = reading.turnsByCombatantId.get(status.combatantId) ?? 0;
        const bearer = { combatantId: status.combatantId, side: combatant.side, turnsTaken };
        const casts = lookupCastsOverBearer(reading.standings, reading.roster, bearer, key);
        const percent = tallyPercentForBearer(reading.standings, casts, bearer, key);
        found.push({ combatantId: status.combatantId, bit: status.bit, percent });
    }
    assert(found.length <= reading.statuses.length, "no more rows than statuses handed in");
    return found;
}

/**
 * The casts of one key still standing **over this bearer**: reaching their side, and inside the
 * turns the table gives them, counted on the bearer's own clock. ⚠️ **A standing is dropped on the
 * caster's turns** (`develop ADR 0101`), so one whose caster has stopped taking them outlives its
 * own length for everybody else; asked on the bearer's clock it goes when it should.
 */
function lookupCastsOverBearer(
    standings: readonly AuraStanding[],
    roster: CombatantRoster,
    bearer: Bearer,
    key: string,
): AuraStanding[] {
    assert(standings.length <= SOURCES_MAXIMUM * SOURCES_MAXIMUM, "a walk over casts is bounded");
    assert(bearer.turnsTaken >= 0, "and a count of turns never runs backwards");
    const found: AuraStanding[] = [];
    for (const standing of standings) {
        if (found.length >= SOURCES_MAXIMUM) break;
        if (standing.amountByKey.get(key) === undefined) continue;
        const caster = roster.byId.get(standing.casterId);
        if (caster === undefined) continue;
        if (!doesReachCoverBearer(key, caster.side, bearer.side)) continue;
        const was = standing.turnsAtCastByCombatantId.get(bearer.combatantId);
        if (was === undefined) continue;
        const turnsElapsed = bearer.turnsTaken - was;
        if (turnsElapsed < 0) continue;
        if (turnsElapsed < standing.turnsStated) found.push(standing);
    }
    return found;
}

/**
 * The reach is the key's own and never the skill's: one announcement may reach both ways. A key
 * reaches one side, so both sides is the cast's answer and never this one's.
 */
function doesReachCoverBearer(key: string, casterSide: number, bearerSide: number): boolean {
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
    standings: readonly AuraStanding[],
    casts: readonly AuraStanding[],
    bearer: Bearer,
    key: string,
): number | null {
    assert(key.length > 0, "a figure is asked of a key");
    assert(casts.length <= SOURCES_MAXIMUM, "and over the casts the walk above bounded");
    if (isCasterHalved(standings, bearer.combatantId, key)) return null;
    if (casts.length === 0) return null;
    const figures = casts.map((one) => one.amountByKey.get(key) ?? 0).sort((a, b) => b - a);
    let summed = 0;
    for (let at = 0; at < SOURCES_COUNTED; at += 1) summed += figures[at] ?? 0;
    return summed;
}

/** True where this bearer is one of the casters a key hands a different amount to. */
function isCasterHalved(
    standings: readonly AuraStanding[],
    combatantId: number,
    key: string,
): boolean {
    assert(Number.isSafeInteger(combatantId), "a bearer is asked about by identity");
    if (!HALVED_FOR_THE_CASTER.includes(key)) return false;
    return standings.some((one) => {
        if (one.casterId !== combatantId) return false;
        return one.amountByKey.get(key) !== undefined;
    });
}
