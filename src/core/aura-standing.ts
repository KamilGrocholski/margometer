/**
 * What one skill put on more than one combatant, who cast it, and how far through it is.
 *
 * The protocol announces the cast and never mentions it again — no confirmation, no refresh and
 * no expiry anywhere in `captures/` — so the length a cast runs for is the published table's word
 * and never a reading. This file owns which keys reach more than one combatant.
 */

import { assert } from "@std/assert/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import type { DeclaredEffect } from "@/src/core/battle-event.ts";
import { type CombatantRoster, getCombatantIdByName } from "@/src/core/combatant-roster.ts";
import { NAME_SEPARATOR } from "@/src/core/fight-decoder.ts";
import { getOwnFromRecord } from "@/libs/unknown-reading.ts";
import {
    composeTurnStanding,
    getTurnOpener,
    NO_TURN_STANDING,
} from "@/src/core/fight-statistics.ts";

const TEAM_WIDE_OPENING = "aura-";
const TEAM_WIDE_ENDINGS = ["-all", "-allies", "-enemies"];
/** The key an announcement carries when it provokes: its value on the wire is one character. */
export const PROVOCATION_KEY = "shout";
/**
 * Team-wide by meaning, carrying neither shape above. A reader without them loses all three:
 * `healall_per` is not here because it is health rather than a standing, and reaches a row of
 * its own (`docs/protocol-keys.md`).
 */
const TEAM_WIDE_NAMES = ["shout", "allslow_per", "alllowdmg"];
/** Past every cast the corpus holds in one fight, so the walk carries a stated maximum. */
export const MAXIMUM_STANDINGS = 256;

/**
 * Which side a cast reaches. Not which side is the reader's — that is the panel's to say — but
 * whose relative to the caster, which is what the game documents and this file may state.
 */
export type AuraReach = "casters-side" | "other-side" | "both-sides";

/**
 * What each key reaches. The evidence is `docs/auras-standing.md`'s, which cites the register,
 * which cites the published help (**V1**). A key absent from here reaches **nothing stated**.
 */
const REACH_BY_KEY: Record<string, AuraReach> = {
    // The `all` in the name says everybody and not which side — `allslow_per` below needed a
    // measurement for the same reason. The register settles this one: _a reduction to the damage
    // dealt by everyone on the opposing side_ (`docs/protocol-keys.md`).
    "alllowdmg": "other-side",
    "+spell-taken_dmg-all": "other-side",
    "lowheal_per-enemies": "other-side",
    "active_decblock_per-enemies": "other-side",
    "poison_lowdmg_per-enemies": "other-side",
    // ⚠️ The one the register does not settle. Measured over `captures/` 2026-09-09 instead: after
    // a `Szadź` the opposing combatant carries `swow_down` in 77 casts of 77.
    "allslow_per": "other-side",
    "aura-adddmg2_per-meele": "casters-side",
    "aura-ac_per": "casters-side",
    "aura-resall": "casters-side",
    "aura-sa_per": "casters-side",
    "critval-allies": "casters-side",
    "critmval-allies": "casters-side",
    "removedot-allies": "casters-side",
    "removeslow-allies": "casters-side",
    "removestun-allies": "casters-side",
    // ⚠️ **The one entry that had neither a suffix nor a citation, and it was the wrong way
    // round.** The help's effect table: the affected are forced to attack _Postaci, która użyła
    // umiejętności_ — you do not force an ally to strike you. Measured over `captures/`
    // 2026-09-22: of 168 characters named across 166 announcements, **168 stand opposite the
    // caster and none on their own side**.
    [PROVOCATION_KEY]: "other-side",
};

export interface SkillEffectTurns {
    key: string;
    turns: readonly number[];
}

/** What the table states about one shout: its wire value is a name, its table value a count. */
export interface ShoutStated {
    turns: number;
    /** The fewest it covers at any skill level, which is what holds whatever the caster's is. */
    coverageMinimum: number;
}

/** What the table states about the skills the window draws, handed over rather than imported. */
export interface StatedSkills {
    turnsBySkillId: ReadonlyMap<number, number>;
    shoutsBySkillId: ReadonlyMap<number, ShoutStated>;
}

/**
 * One character a shout is holding, and who is holding them. Keyed by the provoked rather than by
 * the caster: the published help gives a shout as forcing the affected to attack whoever cast it,
 * so a character forced at two people at once is not a state the game has. **ADR 0062.**
 */
export interface ProvocationStanding {
    provokedId: number;
    skillId: number;
    skillName: string;
    casterId: number;
    turnsElapsed: number;
    turnsStated: number;
}

/** What one walk of a fight answers, which is two things and not one. */
export interface FightStandings {
    standings: AuraStanding[];
    provocations: ProvocationStanding[];
}

export interface AuraStanding {
    skillId: number;
    /** The game's own spelling, kept as it arrived (**L2**). */
    skillName: string;
    casterId: number;
    /** Counted, in the caster's own turns, from the turn the cast stood on. */
    turnsElapsed: number;
    /** Stated by the published table, and the same at every level for every one of them. */
    turnsStated: number;
    /** Which side it reaches, or null where nothing settles it. Never a guess. */
    reach: AuraReach | null;
    /**
     * Whom the caster's own side was pointed at, where the announcement said so. Read from the
     * target slot **only** beside `shout`: on any other cast reaching a side that slot names one
     * end and not the bearer, and reading it would credit the wrong combatant (**ADR 0010**).
     */
    chosenTargetId: number | null;
    /**
     * What the announcement stated each key at, carried and never totalled here. It is a figure
     * about the **cast**; whether it may be said of a combatant is `core/carried-figure.ts`'s.
     */
    amountByKey: ReadonlyMap<string, number>;
    /**
     * Everybody's own turn count as the cast stood. It is what lets a length be counted on the
     * **bearer's** turns, which is the clock the published help dates four of these keys to
     * (`docs/auras-standing.md`) and the one `turnsElapsed` above is not.
     */
    turnsAtCastByCombatantId: ReadonlyMap<number, number>;
}

/**
 * What the keys on one cast say it reaches. ⚠️ **Keys that disagree are a skill reaching both
 * sides, not a reading that failed** — `Wyzywający okrzyk` does both in one announcement.
 *
 * Exported so `tests/core/aura-standing.test.ts` asks one key list at a time, which no caller in
 * `src/` hands it.
 */
export function getReachFromEffects(effects: readonly { effect: string }[]): AuraReach | null {
    let found: AuraReach | null = null;
    for (const one of effects) {
        const reach = getOwnFromRecord(REACH_BY_KEY, one.effect);
        if (reach === undefined) continue;
        if (found === null) found = reach;
        else if (found !== reach) found = "both-sides";
    }
    assert(found === null || found.length > 0, "and is one of the three, or nothing");
    return found;
}

export function isTeamWideKey(key: string): boolean {
    assert(key.length > 0, "a key that is asked about is named");
    if (key.startsWith(TEAM_WIDE_OPENING)) return true;
    for (const ending of TEAM_WIDE_ENDINGS) {
        if (key.endsWith(ending)) return true;
    }
    return TEAM_WIDE_NAMES.some((name) => name === key);
}

/**
 * ⚠️ **The longest of them, where a skill states several.** A skill running one effect for three
 * turns and two for five is not over at three: the shortest would call it over while part of it
 * is still standing.
 */
export function getStatedTurnsFromEffects(effects: readonly SkillEffectTurns[]): number | null {
    assert(effects.every((one) => one.key.length > 0), "an effect the table dates is named");
    let longest = 0;
    for (const effect of effects) {
        // The shout half is dated by its own row (`composeShoutsBySkillId`) and takes no part in
        // dating the side-wide half: skill 25 shouts for 3 turns and stands on its side for 2
        // (`frozen/skill-durations.ts`, read 2026-09-21), and the longest over both stood the
        // aura a turn past the table.
        if (effect.key === PROVOCATION_KEY) continue;
        if (!isTeamWideKey(effect.key)) continue;
        for (const turns of effect.turns) {
            if (turns > longest) longest = turns;
        }
    }
    assert(longest >= 0, "a duration that was read is not below nothing");
    if (longest === 0) return null;
    return longest;
}

/**
 * Composed here and never imported here: `core` reads nothing but itself, `libs` and the standard
 * library (`ARCHITECTURE.md`), so whoever holds the frozen reading hands it over.
 */
export function composeAuraTurnsBySkillId(
    stated: readonly { id: number; turns: number }[],
): Map<number, number> {
    const found = new Map<number, number>();
    for (const skill of stated) {
        assert(skill.turns > 0, "a skill in the table runs for a stated number of turns");
        found.set(skill.id, skill.turns);
    }
    assert(found.size === stated.length, "and each of them is named once");
    return found;
}

/** The shouts the table dates, keyed as the aura turns are, and handed over the same way. */
export function composeShoutsBySkillId(
    stated: readonly { id: number; turns: number; coverageMinimum: number }[],
): Map<number, ShoutStated> {
    const found = new Map<number, ShoutStated>();
    for (const skill of stated) {
        assert(skill.turns > 0, "a shout in the table holds for a stated number of turns");
        assert(skill.coverageMinimum > 0, "and covers at least one character");
        found.set(skill.id, { turns: skill.turns, coverageMinimum: skill.coverageMinimum });
    }
    assert(found.size === stated.length, "and each of them is named once");
    return found;
}

/** What one okrzyk's shout half comes to: whom it named, and how long the table gives it. */
interface CastShout {
    turns: number;
    names: readonly string[];
}

/**
 * A cast the table dates, held until the turns it was given have passed.
 *
 * ⚠️ **An okrzyk is two dated halves on one announcement, and the table gives them different
 * lengths** — `Wyzywający okrzyk` shouts for three turns and debuffs for five. So each half
 * carries its own figure and either may be absent: a cast the aura table does not date still
 * shouts, and a cast that never shouted still stands. **ADR 0097.**
 */
interface AuraCast {
    skillId: number;
    skillName: string;
    casterId: number;
    turnsAtCast: number;
    /** The side-wide half's own turns, or null where the aura table dates this skill nowhere. */
    turnsStated: number | null;
    reach: AuraReach | null;
    chosenTargetId: number | null;
    /** The shout half, or null where the cast is not a shout. */
    shout: CastShout | null;
    amountByKey: ReadonlyMap<string, number>;
    /** Everybody's own turn count as the cast stood, so a bearer can be dated on their own. */
    turnsAtCastByCombatantId: ReadonlyMap<number, number>;
}

/**
 * What the announcement stated each of its keys at. Read here and totalled nowhere: what one
 * figure comes to on one combatant is `core/carried-figure.ts`'s, which is the only reader that
 * knows whom the mask says it is standing on.
 */
function composeAmountByKey(declared: readonly DeclaredEffect[]): Map<string, number> {
    const found = new Map<string, number>();
    for (const one of declared) {
        if (one.amount === null) continue;
        found.set(one.effect, one.amount);
    }
    assert(found.size <= declared.length, "no key states more figures than it was declared with");
    return found;
}

/**
 * The characters a shout named, off the value the announcement carried.
 *
 * The value is a list in the grammar `winner` and `loser` use — a comma and a space between names
 * (`docs/protocol-keys.md`). Spelled here rather than imported: `fight-decoder.ts` owns the
 * separator and this file reads what the decoder handed over.
 */
function readProvokedNames(declared: readonly DeclaredEffect[]): string[] {
    const found: string[] = [];
    for (const one of declared) {
        if (one.effect !== PROVOCATION_KEY) continue;
        if (one.text === null) continue;
        for (const name of one.text.split(NAME_SEPARATOR)) {
            if (name.length === 0) continue;
            found.push(name);
        }
    }
    assert(found.length <= MAXIMUM_STANDINGS, "a shout names no more than the stated bound");
    assert(found.every((one) => one.length > 0), "and every name it listed says something");
    return found;
}

/**
 * The cast this event is, or null where it is not one. A skill reaching one combatant is not an
 * aura.
 *
 * **Whether either half is dated is the walk's answer and not this one.** A cast the table dates
 * nowhere is returned with both halves empty and reaches neither map, so refusing it here as well
 * stated the same rule twice — and the copy here was the one nothing could observe: deleting it
 * left the tree green, because a cast with no dated half is dropped either way (**W4**,
 * 2026-09-18).
 *
 * ⚠️ **A shout is dated by its own row and never by the skill's longest** — **ADR 0063**.
 */
function getAuraCastFromEvent(
    event: BattleEvent,
    stated: StatedSkills,
    turnsByCombatantId: ReadonlyMap<number, number>,
): AuraCast | null {
    if (event.kind !== "skill-used") return null;
    if (event.actorId === null) return null;
    if (event.skillId === null) return null;
    if (!event.declared.some((one) => isTeamWideKey(one.effect))) return null;
    const turnsTaken = turnsByCombatantId.get(event.actorId) ?? 0;
    const isPointed = event.declared.some((one) => one.effect === PROVOCATION_KEY);
    const shouted = isPointed ? stated.shoutsBySkillId.get(event.skillId) : undefined;
    const turnsStated = stated.turnsBySkillId.get(event.skillId) ?? null;
    const shout = shouted === undefined
        ? null
        : { turns: shouted.turns, names: readProvokedNames(event.declared) };
    assert(turnsStated === null || turnsStated > 0, "a half that is dated runs for stated turns");
    assert(shout === null || shout.turns > 0, "and so does the other one");
    assert(turnsTaken > 0, "and the cast stands on a turn its caster has taken");
    return {
        skillId: event.skillId,
        skillName: event.skillName,
        casterId: event.actorId,
        turnsAtCast: turnsTaken,
        turnsStated,
        reach: getReachFromEffects(event.declared),
        chosenTargetId: isPointed ? event.targetId : null,
        shout,
        amountByKey: composeAmountByKey(event.declared),
        // Copied rather than held: the walk goes on counting, and a cast dated by a map that
        // keeps moving would be dated by wherever the fight ended (**S9**).
        turnsAtCastByCombatantId: new Map(turnsByCombatantId),
    };
}

/** One turn onto whoever took it. A turn nobody was named for reaches nobody. */
function addAuraTurnTaken(
    turnsByCombatantId: Map<number, number>,
    combatantId: number | null,
): void {
    if (combatantId === null) return;
    const taken = turnsByCombatantId.get(combatantId) ?? 0;
    assert(taken >= 0, "a count of turns is never below nothing");
    turnsByCombatantId.set(combatantId, taken + 1);
}

/** What one walk of a fight leaves: the casts still held, and the turns each combatant took. */
/**
 * A shout as it stands on one character: the cast, and **that character's own clock at it**. The
 * length runs on their turns and not the caster's, so the moment it landed has to be read on the
 * clock it will be measured against. **ADR 0103.**
 */
interface HeldByShout {
    cast: AuraCast;
    turnsAtShout: number;
}

interface AuraWalk {
    /** A cast reaching a side, keyed by who cast what — a second cast of theirs refreshes it. */
    bySkill: Map<string, AuraCast>;
    /**
     * A shout, keyed by **each character it holds**. A later shout on the same character replaces
     * whatever held them, from any caster and either skill — the whole of the overwrite rule.
     */
    byProvoked: Map<number, HeldByShout>;
    turnsByCombatantId: Map<number, number>;
}

/**
 * Whom one shout is holding: **every character its value named**, resolved through the roster.
 *
 * A name the roster cannot place, or places on more than one combatant, is dropped rather than
 * guessed at — `getCombatantIdByName` answers null for both. **ADR 0064.**
 */
function composeProvokedByCast(cast: AuraCast, roster: CombatantRoster): number[] {
    if (cast.shout === null) return [];
    const found: number[] = [];
    for (const name of cast.shout.names) {
        const combatantId = getCombatantIdByName(roster, name);
        if (combatantId === null) continue;
        if (found.includes(combatantId)) continue;
        found.push(combatantId);
    }
    assert(found.length <= MAXIMUM_STANDINGS, "a shout holds no more than the stated bound");
    assert(found.length <= cast.shout.names.length, "no more are held than the value named");
    assert(found.every((one) => roster.byId.has(one)), "and each of them is in the roster");
    return found;
}

/**
 * The fight walked once, because both answers are read off the same turn count.
 *
 * ⚠️ **An okrzyk lands in both maps, and that is one cast standing as the two things it is.**
 * Its shout and its side-wide half ride one announcement and the published table dates them
 * apart, so folding them into one row stated the shorter of two lengths for both. **ADR 0097.**
 */
function composeAuraWalk(
    events: readonly BattleEvent[],
    stated: StatedSkills,
    roster: CombatantRoster,
): AuraWalk {
    const walk: AuraWalk = {
        bySkill: new Map(),
        byProvoked: new Map(),
        turnsByCombatantId: new Map(),
    };
    let standing = NO_TURN_STANDING;
    for (const event of events) {
        addAuraTurnTaken(walk.turnsByCombatantId, getTurnOpener(event, standing));
        if (event.kind === "turn-lost") {
            addAuraTurnTaken(walk.turnsByCombatantId, event.combatantId);
        }
        standing = composeTurnStanding(event, standing);
        const cast = getAuraCastFromEvent(event, stated, walk.turnsByCombatantId);
        if (cast === null) continue;
        assert(walk.bySkill.size <= MAXIMUM_STANDINGS, "a fight stays inside its stated bound");
        assert(walk.byProvoked.size <= MAXIMUM_STANDINGS, "and so does what it holds people by");
        if (cast.turnsStated !== null) {
            walk.bySkill.set(`${cast.casterId}/${cast.skillId}`, cast);
        }
        if (cast.shout === null) continue;
        for (const provokedId of composeProvokedByCast(cast, roster)) {
            const turnsAtShout = walk.turnsByCombatantId.get(provokedId) ?? 0;
            walk.byProvoked.set(provokedId, { cast, turnsAtShout });
        }
    }
    return walk;
}

/**
 * Whom a shout is holding, one row per character, and only the shout that holds them now.
 *
 * **Counted on the held character's own turns**, which is where the evidence is: over `captures/`
 * the provoked strike whoever shouted on their first three turns and fall to what they did before
 * the shout on the fourth, while the caster's clock shows no such edge (`docs/auras-standing.md`).
 * So a shout covers the next three turns **they** take, and the row goes when a fourth opens.
 */
function composeProvocationsFromWalk(walk: AuraWalk): ProvocationStanding[] {
    const found: ProvocationStanding[] = [];
    for (const [provokedId, held] of walk.byProvoked) {
        const cast = held.cast;
        assert(cast.shout !== null, "a cast holding somebody shouted");
        const taken = walk.turnsByCombatantId.get(provokedId) ?? held.turnsAtShout;
        const turnsElapsed = taken - held.turnsAtShout;
        assert(turnsElapsed >= 0, "a character never takes fewer turns than they had at the shout");
        if (turnsElapsed > cast.shout.turns) continue;
        found.push({
            provokedId,
            skillId: cast.skillId,
            skillName: cast.skillName,
            casterId: cast.casterId,
            turnsElapsed,
            turnsStated: cast.shout.turns,
        });
    }
    assert(found.length <= walk.byProvoked.size, "no more are held than were shouted at");
    return found;
}

/**
 * Both answers off one walk: what stands on a side, and whom a shout is holding.
 *
 * Either length is counted in the **caster's own turns**, from the turn the cast stood on — a turn
 * granted and spent on nothing still passed for whoever is carrying it, so both halves count. A
 * second cast by the same caster of the same skill refreshes rather than adding a row.
 */
export function composeFightStandings(
    events: readonly BattleEvent[],
    stated: StatedSkills,
    roster: CombatantRoster,
): FightStandings {
    const walk = composeAuraWalk(events, stated, roster);
    return {
        standings: composeStandingsFromCasts(walk.bySkill, walk.turnsByCombatantId),
        provocations: composeProvocationsFromWalk(walk),
    };
}

/** Elapsed against stated, and a cast whose turns have run out is no longer standing. */
function composeStandingsFromCasts(
    castByKey: ReadonlyMap<string, AuraCast>,
    turnsByCombatantId: ReadonlyMap<number, number>,
): AuraStanding[] {
    const found: AuraStanding[] = [];
    for (const cast of castByKey.values()) {
        assert(cast.turnsStated !== null, "a cast standing on a side is one the table dates");
        const taken = turnsByCombatantId.get(cast.casterId) ?? cast.turnsAtCast;
        const turnsElapsed = taken - cast.turnsAtCast;
        assert(turnsElapsed >= 0, "a caster never takes fewer turns than they had at the cast");
        if (turnsElapsed >= cast.turnsStated) continue;
        found.push({
            skillId: cast.skillId,
            skillName: cast.skillName,
            casterId: cast.casterId,
            turnsElapsed,
            turnsStated: cast.turnsStated,
            reach: cast.reach,
            chosenTargetId: cast.chosenTargetId,
            amountByKey: cast.amountByKey,
            turnsAtCastByCombatantId: cast.turnsAtCastByCombatantId,
        });
    }
    assert(found.length <= castByKey.size, "no more stands than was cast");
    return found;
}
