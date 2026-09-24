/**
 * What one skill put on more than one combatant, who cast it, and how far through it is; and whom
 * a shout is holding (`docs/design.md` §6.6).
 *
 * The protocol announces the cast and never mentions it again: no confirmation, no refresh and no
 * expiry anywhere in `develop:captures/`. So the length a cast runs for is the published table's
 * word and never a reading, and the table is handed in by whoever holds it.
 */

import { assert } from "@std/assert/assert";
import type { VocabularyWord } from "@/libs/vocabulary.ts";
import { BATTLE_EVENT, type BattleEvent, type DeclaredEffect } from "@/src/core/battle-event.ts";
import { type CombatantRoster, lookupCombatantIdByName } from "@/src/core/combatant-roster.ts";
import type { FightView } from "@/src/core/fight-session.ts";
import {
    isTeamWideKey,
    KEY_REACH,
    lookupKeyReach,
    NAME_SEPARATOR,
    PROVOCATION_KEY,
} from "@/src/core/protocol-key.ts";
import { composeTurnStanding, lookupTurnOpener, NO_TURN_STANDING } from "@/src/core/turn-clock.ts";

/** A cast reaches what its keys reach, and both sides where its keys disagree. */
export const AURA_REACH = { ...KEY_REACH, bothSides: "both-sides" } as const;
export type AuraReach = VocabularyWord<typeof AURA_REACH>;

/** Past every cast the corpus holds in one fight, so the walk carries a stated maximum. */
export const STANDINGS_MAXIMUM = 256;

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
 * the caster: a shout forces the affected to attack whoever cast it, so a character forced at two
 * people at once is not a state the game has (`develop ADR 0062`).
 */
export interface ProvocationStanding {
    provokedId: number;
    skillId: number;
    skillName: string;
    casterId: number;
    turnsElapsed: number;
    turnsStated: number;
}

export interface AuraStanding {
    skillId: number;
    /** The game's own spelling, kept as it arrived (L2). */
    skillName: string;
    casterId: number;
    /** Counted, in the caster's own turns, from the turn the cast stood on. */
    turnsElapsed: number;
    /** Stated by the published table, and the same at every level for every one of them. */
    turnsStated: number;
    /** Which side it reaches, or null where nothing settles it. Never a guess. */
    reach: AuraReach | null;
    /**
     * Whom the caster's own side was pointed at. Read from the target slot **only** beside a shout:
     * on any other cast that slot names one end and not the bearer (`develop ADR 0010`).
     */
    chosenTargetId: number | null;
    /** What the announcement stated each key at, carried and never totalled here. */
    amountByKey: ReadonlyMap<string, number>;
    /** Everybody's own turn count as the cast stood, so a bearer can be dated on their own. */
    turnsAtCastByCombatantId: ReadonlyMap<number, number>;
}

/** What one walk of a fight answers, which is two things and not one. */
export interface FightStandings {
    standings: AuraStanding[];
    provocations: ProvocationStanding[];
}

/**
 * A cast the table dates, held until the turns it was given have passed. ⚠️ **An okrzyk is two
 * dated halves on one announcement, and the table gives them different lengths**: `Wyzywający
 * okrzyk` shouts for three turns and debuffs for five (`develop ADR 0097`).
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
    shout: { turns: number; names: readonly string[] } | null;
    amountByKey: ReadonlyMap<string, number>;
    turnsAtCastByCombatantId: ReadonlyMap<number, number>;
}

/**
 * A shout as it stands on one character: the cast, and **that character's own clock at it**. The
 * length runs on their turns and not the caster's (`develop ADR 0103`).
 */
interface HeldByShout {
    cast: AuraCast;
    turnsAtShout: number;
}

interface AuraWalk {
    /** A cast reaching a side, keyed by who cast what: a second cast of theirs refreshes it. */
    bySkill: Map<string, AuraCast>;
    /** A shout, keyed by each character it holds. A later shout on them replaces it. */
    byProvoked: Map<number, HeldByShout>;
    turnsByCombatantId: Map<number, number>;
}

/**
 * What the keys on one cast say it reaches. ⚠️ **Keys that disagree are a skill reaching both
 * sides, not a reading that failed**: `Wyzywający okrzyk` does both in one announcement.
 */
export function lookupReachOfEffects(effects: readonly { effect: string }[]): AuraReach | null {
    assert(effects.length <= STANDINGS_MAXIMUM, "a cast states a bounded list of effects");
    let found: AuraReach | null = null;
    for (const one of effects) {
        const reach = lookupKeyReach(one.effect);
        if (reach === null) continue;
        if (found === null) found = reach;
        else if (found !== reach) found = AURA_REACH.bothSides;
    }
    return found;
}

/** The aura table, keyed by skill, handed over by whoever holds the frozen reading. */
export function indexAuraTurnsBySkillId(
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
export function indexShoutsBySkillId(
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

/**
 * Both answers off one walk of the fight: what stands on a side, and whom a shout is holding.
 * Either length is counted in turns, taken and lost both, from the turn the cast stood on.
 * ⚠️ **An okrzyk lands in both maps**: its two halves are dated apart, and folding them into one
 * row stated the shorter of two lengths for both.
 */
export function replayFightStandings(view: FightView, stated: StatedSkills): FightStandings {
    const walk: AuraWalk = {
        bySkill: new Map(),
        byProvoked: new Map(),
        turnsByCombatantId: new Map(),
    };
    let standing = NO_TURN_STANDING;
    for (const event of view.events) {
        addTurn(walk.turnsByCombatantId, lookupTurnOpener(event, standing));
        if (event.kind === BATTLE_EVENT.turnLost) {
            addTurn(walk.turnsByCombatantId, event.combatantId);
        }
        standing = composeTurnStanding(event, standing);
        const cast = lookupAuraCast(event, stated, walk.turnsByCombatantId);
        if (cast === null) continue;
        assert(walk.bySkill.size <= STANDINGS_MAXIMUM, "a fight stays inside its stated bound");
        assert(walk.byProvoked.size <= STANDINGS_MAXIMUM, "and so does what it holds people by");
        if (cast.turnsStated !== null) walk.bySkill.set(`${cast.casterId}/${cast.skillId}`, cast);
        for (const provokedId of lookupProvokedIds(cast, view.roster)) {
            const turnsAtShout = walk.turnsByCombatantId.get(provokedId) ?? 0;
            walk.byProvoked.set(provokedId, { cast, turnsAtShout });
        }
    }
    return {
        standings: replayFightStandingsOnSides(walk),
        provocations: replayFightStandingsProvoked(walk),
    };
}

function addTurn(turnsByCombatantId: Map<number, number>, combatantId: number | null): void {
    if (combatantId === null) return;
    const taken = turnsByCombatantId.get(combatantId) ?? 0;
    assert(taken >= 0, "a count of turns is never below nothing");
    turnsByCombatantId.set(combatantId, taken + 1);
}

/**
 * The cast this event is, or null where it is not one: a skill reaching one combatant is not an
 * aura. Whether either half is dated is the walk's answer, not this one. ⚠️ **A shout is dated by
 * its own row and never by the skill's longest** (`develop ADR 0063`).
 */
function lookupAuraCast(
    event: BattleEvent,
    stated: StatedSkills,
    turnsByCombatantId: ReadonlyMap<number, number>,
): AuraCast | null {
    if (event.kind !== BATTLE_EVENT.skillUsed) return null;
    if (event.actorId === null) return null;
    if (event.skillId === null) return null;
    if (!event.declared.some((one) => isTeamWideKey(one.effect))) return null;
    const turnsAtCast = turnsByCombatantId.get(event.actorId) ?? 0;
    const isPointed = event.declared.some((one) => one.effect === PROVOCATION_KEY);
    const shouted = isPointed ? stated.shoutsBySkillId.get(event.skillId) : undefined;
    const shout = shouted === undefined
        ? null
        : { turns: shouted.turns, names: lookupAuraCastNames(event.declared) };
    const turnsStated = stated.turnsBySkillId.get(event.skillId) ?? null;
    if (turnsStated !== null) assert(turnsStated > 0, "a half that is dated runs for stated turns");
    if (shout !== null) assert(shout.turns > 0, "and so does the other one");
    assert(turnsAtCast > 0, "the cast stands on a turn its caster has taken");
    return {
        skillId: event.skillId,
        skillName: event.skillName,
        casterId: event.actorId,
        turnsAtCast,
        turnsStated,
        reach: lookupReachOfEffects(event.declared),
        chosenTargetId: isPointed ? event.targetId : null,
        shout,
        amountByKey: indexAmountByKey(event.declared),
        // Copied rather than held: the walk goes on counting, and a cast dated by a map that keeps
        // moving would be dated by wherever the fight ended (S9).
        turnsAtCastByCombatantId: new Map(turnsByCombatantId),
    };
}

/** The characters a shout named, off the value the announcement carried. */
function lookupAuraCastNames(declared: readonly DeclaredEffect[]): string[] {
    const found: string[] = [];
    for (const one of declared) {
        if (one.effect !== PROVOCATION_KEY) continue;
        if (one.text === null) continue;
        for (const name of one.text.split(NAME_SEPARATOR)) {
            if (name.length > 0) found.push(name);
        }
    }
    assert(found.length <= STANDINGS_MAXIMUM, "a shout names no more than the stated bound");
    return found;
}

/** What the announcement stated each of its keys at. Read here and totalled nowhere. */
function indexAmountByKey(declared: readonly DeclaredEffect[]): Map<string, number> {
    const found = new Map<string, number>();
    for (const one of declared) {
        if (one.amount !== null) found.set(one.effect, one.amount);
    }
    assert(found.size <= declared.length, "no key states more figures than it was declared with");
    return found;
}

/**
 * Whom one shout is holding: every character its value named, resolved through the roster. A name
 * the roster cannot place, or places on more than one combatant, is dropped rather than guessed at
 * (`develop ADR 0064`).
 */
function lookupProvokedIds(cast: AuraCast, roster: CombatantRoster): number[] {
    if (cast.shout === null) return [];
    const found: number[] = [];
    for (const name of cast.shout.names) {
        const combatantId = lookupCombatantIdByName(roster, name);
        if (combatantId === null) continue;
        if (!found.includes(combatantId)) found.push(combatantId);
    }
    assert(found.length <= cast.shout.names.length, "no more are held than the value named");
    assert(found.every((one) => roster.byId.has(one)), "and each of them is in the roster");
    return found;
}

/** Elapsed against stated, and a cast whose turns have run out is no longer standing. */
function replayFightStandingsOnSides(walk: AuraWalk): AuraStanding[] {
    const found: AuraStanding[] = [];
    for (const cast of walk.bySkill.values()) {
        const turnsStated = cast.turnsStated;
        assert(turnsStated !== null, "a cast standing on a side is one the table dates");
        const taken = walk.turnsByCombatantId.get(cast.casterId) ?? cast.turnsAtCast;
        const turnsElapsed = taken - cast.turnsAtCast;
        assert(turnsElapsed >= 0, "a caster never takes fewer turns than they had at the cast");
        if (turnsElapsed >= turnsStated) continue;
        found.push({
            skillId: cast.skillId,
            skillName: cast.skillName,
            casterId: cast.casterId,
            turnsElapsed,
            turnsStated,
            reach: cast.reach,
            chosenTargetId: cast.chosenTargetId,
            amountByKey: cast.amountByKey,
            turnsAtCastByCombatantId: cast.turnsAtCastByCombatantId,
        });
    }
    assert(found.length <= walk.bySkill.size, "no more stands than was cast");
    return found;
}

/**
 * Whom a shout is holding, one row per character, and only the shout that holds them now. **Counted
 * on the held character's own turns**: over `develop:captures/` the provoked strike whoever shouted
 * on their first three turns and fall back on the fourth (`develop:docs/auras-standing.md`).
 */
function replayFightStandingsProvoked(walk: AuraWalk): ProvocationStanding[] {
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
