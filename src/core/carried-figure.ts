/**
 * What a status a combatant is carrying comes to, where anything may be said of it at all.
 *
 * The mask says **on whom** and never how much; an announcement says **how much** and never on
 * whom (**ADR 0061**). This file is the one place the two are put together, and it is deliberately
 * mean about it: a figure stands only where a cast of the key the status is moved by reaches the
 * side the bearer is on. Everything else is silence, which is what the row already says.
 */

import { assert } from "@std/assert/assert";
import { type AuraStanding, getReachFromEffects } from "@/src/core/aura-standing.ts";
import type { CarriedStatus } from "@/src/core/carried-status.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";

/**
 * How many sources one effect adds up from. The published help: _Efekt ulega kumulacji do
 * maksymalnie dwóch źródeł od różnych Graczy_, and `taken_dmg_per-all` states it sharper —
 * _kumuluje się do dwóch najwyższych źródeł_. `docs/auras-standing.md` owns the reading.
 *
 * ⚠️ **The two highest, not the two latest.** Measured over `captures/` 2026-09-21: where three
 * or more stood at once the two sets differ in 258 moments of 755 for `speed_up` and 13 of 94 for
 * `swow_down`, so taking the pair by arrival would draw a figure the game does not have.
 */
const SOURCES_COUNTED = 2;

/** Past the casts of one key that ever stood over one bearer, which the corpus puts at four. */
const MAXIMUM_SOURCES = 32;

/**
 * The keys whose published help gives the caster a different amount from everybody else —
 * `aura-sa_per`: _Na Postać rzucającą efekt, wartość przyspieszenia jest o połowę niższa._ What
 * the half rounds to is not stated anywhere, so the caster's own row carries **no figure** rather
 * than one this repository invented (`CONTEXT.md`, and **ADR 0024**'s way with an answer it
 * cannot use).
 */
const HALVED_FOR_THE_CASTER = ["aura-sa_per"];

/**
 * Which key moves which status, by the name the client registers the bit under.
 * `docs/auras-standing.md` measures both and no other bit has a key that states a figure for it:
 * after a `Szadź` the opposing side carries `swow_down` in 77 casts of 77, and `speed_up` lands
 * on `aura-sa_per`'s published figure, counted on the bearer's own clock.
 */
const KEY_BY_BIT_NAME: Record<string, string> = {
    swow_down: "allslow_per",
    speed_up: "aura-sa_per",
};

/**
 * The two bits above at the positions the client registered them, handed the frozen table by
 * whoever holds one: `core` reads no frozen reading of its own (`ARCHITECTURE.md`).
 */
export function composeWitnessedKeyByBit(bits: readonly string[]): Map<number, string> {
    assert(bits.length <= MAXIMUM_SOURCES, "the client registers a short list of statuses");
    const found = new Map<number, string>();
    for (let bit = 0; bit < bits.length; bit += 1) {
        const named = bits[bit] ?? "";
        const key = KEY_BY_BIT_NAME[named];
        if (key === undefined) continue;
        found.set(bit, key);
    }
    assert(found.size <= bits.length, "and no more of them are witnessed than were registered");
    return found;
}

/**
 * How far through an effect is **on this bearer**: their own turns since the cast stood, against
 * the turns the published table gives it.
 *
 * ⚠️ **Not the count off the mask, and the two disagree.** A bit lights when a payload first
 * restates the bearer carrying it, which can be turns after the cast, and it keeps burning
 * through a re-cast — measured over `captures/` 2026-09-21, the mask's count and the cast's
 * agree in 369 moments of 1 584, running behind in 215 and ahead in 1 000. The bearer's own
 * turns since the cast is the clause the published help dates this family by.
 */
export interface CarriedLength {
    turnsElapsed: number;
    turnsStated: number;
}

/** One status, with what the announcements standing over its bearer come to. */
export interface CarriedFigure {
    combatantId: number;
    bit: number;
    /** A share of what the bearer has, or null where no cast over them may be read as theirs. */
    percent: number | null;
    /** How far through it is on them, or null where no cast over them dates it. */
    length: CarriedLength | null;
}

/**
 * True where a cast by somebody on `casterSide` reaches a bearer on `bearerSide`. The reach is
 * the key's own and never the skill's: one announcement may carry keys reaching both ways.
 */
function getReachCoversBearer(key: string, casterSide: number, bearerSide: number): boolean {
    assert(key.length > 0, "a reach is asked of a key");
    assert(Number.isSafeInteger(casterSide), "and between two sides the roster states");
    const reach = getReachFromEffects([{ effect: key }]);
    if (reach === null) return false;
    if (reach === "both-sides") return true;
    if (reach === "casters-side") return casterSide === bearerSide;
    return casterSide !== bearerSide;
}

/**
 * The casts of one key still standing **over this bearer**: reaching their side, and inside the
 * turns the table gives them, counted on the bearer's own clock.
 *
 * ⚠️ **A standing is dropped on the caster's turns** (**ADR 0101**), so one whose caster has
 * stopped taking them outlives its own length for everybody else. Asked on the bearer's clock it
 * goes when it should, and the figure and the length then answer for the same cast rather than
 * one trusting what the other refuses.
 */
function composeCastsOverBearer(
    standings: readonly AuraStanding[],
    roster: CombatantRoster,
    bearer: { combatantId: number; side: number; turnsTaken: number },
    key: string,
): AuraStanding[] {
    assert(standings.length <= MAXIMUM_SOURCES * MAXIMUM_SOURCES, "a walk over casts is bounded");
    assert(bearer.turnsTaken >= 0, "and a count of turns never runs backwards");
    const found: AuraStanding[] = [];
    for (const standing of standings) {
        if (found.length >= MAXIMUM_SOURCES) break;
        if (standing.amountByKey.get(key) === undefined) continue;
        const caster = roster.byId.get(standing.casterId);
        if (caster === undefined) continue;
        if (!getReachCoversBearer(key, caster.side, bearer.side)) continue;
        const was = standing.turnsAtCastByCombatantId.get(bearer.combatantId);
        if (was === undefined) continue;
        const turnsElapsed = bearer.turnsTaken - was;
        if (turnsElapsed < 0) continue;
        if (turnsElapsed >= standing.turnsStated) continue;
        found.push(standing);
    }
    return found;
}

/**
 * How far through the freshest cast over this bearer is, on the bearer's own clock. **The
 * freshest**, because where two stand it is the later one that says how long the status keeps
 * standing at all — the earlier one only ever takes figure away when it goes.
 *
 * The casts are the ones `composeCastsOverBearer` already held to this bearer's clock, so a
 * length taken here never runs past what the table gives it.
 */
function getLengthForBearer(
    casts: readonly AuraStanding[],
    combatantId: number,
    turnsTaken: number,
): CarriedLength | null {
    assert(casts.length <= MAXIMUM_SOURCES, "a length is taken over the casts a walk bounded");
    assert(turnsTaken >= 0, "and a count of turns never runs backwards");
    let found: CarriedLength | null = null;
    for (const cast of casts) {
        const was = cast.turnsAtCastByCombatantId.get(combatantId);
        if (was === undefined) continue;
        const turnsElapsed = turnsTaken - was;
        if (found !== null && found.turnsElapsed <= turnsElapsed) continue;
        found = { turnsElapsed, turnsStated: cast.turnsStated };
    }
    return found;
}

/** True where this bearer is one of the casters a key hands a different amount to. */
function getBearerIsCaster(
    standings: readonly AuraStanding[],
    combatantId: number,
    key: string,
): boolean {
    assert(Number.isSafeInteger(combatantId), "a bearer is asked about by identity");
    assert(key.length > 0, "and against the key said to move their status");
    if (!HALVED_FOR_THE_CASTER.includes(key)) return false;
    return standings.some((one) => {
        if (one.casterId !== combatantId) return false;
        return one.amountByKey.get(key) !== undefined;
    });
}

/**
 * What one status comes to on one bearer, or null. ⚠️ **Null is the common answer**: over
 * `captures/` 2026-09-21 a combatant carrying `swow_down` had no cast of `allslow_per` standing
 * over them in 2 211 moments of 3 308 — an item's own bonus adds to the same total and is
 * announced nowhere, so the figure a reader would see is a part passing itself off as the whole.
 */
function getPercentForBearer(
    standings: readonly AuraStanding[],
    casts: readonly AuraStanding[],
    bearer: { combatantId: number; side: number },
    key: string,
): number | null {
    assert(key.length > 0, "a figure is asked of a key");
    assert(casts.length <= MAXIMUM_SOURCES, "and over the casts the walk above bounded");
    if (getBearerIsCaster(standings, bearer.combatantId, key)) return null;
    if (casts.length === 0) return null;
    const figures = casts.map((one) => one.amountByKey.get(key) ?? 0).sort((one, other) =>
        other - one
    );
    let summed = 0;
    for (let at = 0; at < SOURCES_COUNTED; at += 1) {
        summed += figures[at] ?? 0;
    }
    return summed;
}

/** What a reading of the fight hands over, so this file reads no walk of its own. */
export interface CarriedFigureReading {
    statuses: readonly CarriedStatus[];
    standings: readonly AuraStanding[];
    roster: CombatantRoster;
    /** Turns taken per combatant, which is the clock a length is counted on. */
    turnsByCombatantId: ReadonlyMap<number, number>;
    /**
     * Which key moves which bit, handed over rather than imported: `core` reads no frozen table,
     * so whoever holds one hands it in (`ARCHITECTURE.md`), and which key that is belongs to
     * `docs/auras-standing.md`.
     */
    witnessed: ReadonlyMap<number, string>;
}

/** One row per status a figure or a length can be said of, and none for the rest. */
export function composeCarriedFigures(reading: CarriedFigureReading): CarriedFigure[] {
    assert(
        reading.witnessed.size <= MAXIMUM_SOURCES,
        "the bits a figure is witnessed on are a short list",
    );
    const found: CarriedFigure[] = [];
    for (const status of reading.statuses) {
        const key = reading.witnessed.get(status.bit);
        if (key === undefined) continue;
        const bearer = reading.roster.byId.get(status.combatantId);
        if (bearer === undefined) continue;
        const turnsTaken = reading.turnsByCombatantId.get(status.combatantId) ?? 0;
        const casts = composeCastsOverBearer(reading.standings, reading.roster, {
            combatantId: status.combatantId,
            side: bearer.side,
            turnsTaken,
        }, key);
        found.push({
            combatantId: status.combatantId,
            bit: status.bit,
            percent: getPercentForBearer(reading.standings, casts, {
                combatantId: status.combatantId,
                side: bearer.side,
            }, key),
            length: getLengthForBearer(casts, status.combatantId, turnsTaken),
        });
    }
    assert(found.length <= reading.statuses.length, "and no more rows than statuses handed in");
    return found;
}
