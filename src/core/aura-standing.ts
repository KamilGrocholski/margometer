/**
 * What one skill put on more than one combatant, who cast it, and how far through it is; and whom
 * a shout is holding (`docs/design.md` §6.6).
 *
 * The protocol announces the cast and never mentions it again (`docs/auras-standing.md`,
 * `develop ADR 0059`). So the length a cast runs for is the published table's word and never a
 * reading, and the table is handed in by whoever holds it.
 */

import { assert } from "@std/assert/assert";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { BATTLE_EVENT, type BattleEvent, type DeclaredEffect } from "./battle-event.ts";
import {
    type CombatantRoster,
    COMBATANTS_MAXIMUM,
    lookupCombatantIdByName,
} from "./combatant-roster.ts";
import { MESSAGE_PARTS_MAXIMUM } from "./fight-decoder.ts";
import type { FightView } from "./fight-session.ts";
import {
    isSideWideKey,
    KEY_REACH,
    lookupKeyReach,
    NAME_SEPARATOR,
    PROVOCATION_KEY,
} from "./protocol-key.ts";
import { addEventTurns, NO_TURN_STANDING } from "./turn-clock.ts";

/** A cast reaches what its keys reach, and both sides where its keys disagree. */
export const AURA_REACH = { ...KEY_REACH, bothSides: "both-sides" } as const;
export type AuraReach = VocabularyWord<typeof AURA_REACH>;

/** What the table states about one shout: its wire value is a name, its table value a count. */
export interface ShoutStated {
    turns: number;
    /** The fewest it covers at any skill level, which is what holds whatever the caster's is. */
    coverageMinimum: number;
}

/** One effect of a skill as the published table dates it, level by level. */
export interface SkillEffectTurns {
    key: string;
    turns: readonly number[];
}

/** What the table states about the skills the window draws, handed over rather than imported. */
export interface StatedSkills {
    auraTurnsBySkillId: ReadonlyMap<number, number>;
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
    shoutTargetId: number | null;
    /** What the announcement stated each key at, carried and never totalled here. */
    amountByKey: ReadonlyMap<string, number>;
    /** Everybody's own turn count as the cast stood, so a bearer can be dated on their own. */
    turnsAtCastByCombatantId: ReadonlyMap<number, number>;
}

/** What one walk of a fight answers, which is two things and not one. */
export interface FightStandings {
    auras: AuraStanding[];
    provocations: ProvocationStanding[];
}

/**
 * A cast the table dates, held until the turns it was given have passed. ⚠️ **A shout is two
 * dated halves on one announcement, and the table gives them different lengths**: `Wyzywający
 * okrzyk` holds whom it names for three turns and stands as an aura for five (`develop ADR 0097`).
 */
interface AuraCast {
    skillId: number;
    skillName: string;
    casterId: number;
    turnsAtCast: number;
    /** The side-wide half's own turns, or null where the aura table dates this skill nowhere. */
    turnsStated: number | null;
    reach: AuraReach | null;
    shoutTargetId: number | null;
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
    castByCasterAndSkill: Map<string, AuraCast>;
    /** A shout, keyed by each character it holds. A later shout on them replaces it. */
    shoutByProvokedId: Map<number, HeldByShout>;
    turnsByCombatantId: Map<number, number>;
}

/**
 * Past the pairs of caster and skill one fight announces: 38 at the most over the 37 recordings in
 * `captures/` on 2026-10-06.
 */
export const STANDINGS_MAXIMUM = 256;
/** Past the 8 effects the longest skill states in `frozen/skill-durations.ts` of 2026-10-02. */
export const SKILL_EFFECTS_MAXIMUM = 32;

/**
 * Both answers off one walk of the fight: what stands on a side, and whom a shout is holding.
 * Either length is counted in turns, taken and lost both, from the turn the cast stood on.
 * ⚠️ **A shout lands in both maps**: its two halves are dated apart, and folding them into one
 * row stated the shorter of two lengths for both.
 */
export function replayAuraStandings(view: FightView, statedSkills: StatedSkills): FightStandings {
    const walk: AuraWalk = {
        castByCasterAndSkill: new Map(),
        shoutByProvokedId: new Map(),
        turnsByCombatantId: new Map(),
    };
    let turnStanding = NO_TURN_STANDING;
    for (const event of view.events) {
        turnStanding = addEventTurns(walk.turnsByCombatantId, event, turnStanding);
        const cast = lookupAuraCast(event, statedSkills, walk.turnsByCombatantId);
        if (cast === null) continue;
        if (cast.turnsStated !== null) {
            walk.castByCasterAndSkill.set(`${cast.casterId}/${cast.skillId}`, cast);
        }
        for (const provokedId of lookupProvokedIds(cast, view.roster)) {
            const turnsAtShout = walk.turnsByCombatantId.get(provokedId) ?? 0;
            walk.shoutByProvokedId.set(provokedId, { cast, turnsAtShout });
        }
        assert(
            walk.castByCasterAndSkill.size <= STANDINGS_MAXIMUM,
            "a fight stays inside its stated bound",
        );
        assert(
            walk.shoutByProvokedId.size <= COMBATANTS_MAXIMUM,
            "and holds nobody the cast does not",
        );
    }
    return {
        auras: composeAuraStandings(walk),
        provocations: composeProvocationStandings(walk),
    };
}

/**
 * The cast this event is, or null where it is not one: a skill reaching one combatant is not an
 * aura. Whether either half is dated is the walk's answer, not this one. ⚠️ **A shout is dated by
 * its own row and never by the skill's longest** (`develop ADR 0063`).
 */
function lookupAuraCast(
    event: BattleEvent,
    statedSkills: StatedSkills,
    turnsByCombatantId: ReadonlyMap<number, number>,
): AuraCast | null {
    if (event.kind !== BATTLE_EVENT.skillUsed) return null;
    if (event.actorId === null) return null;
    if (event.skillId === null) return null;
    if (!event.declared.some((declaredEffect) => isSideWideKey(declaredEffect.effect))) return null;
    const turnsAtCast = turnsByCombatantId.get(event.actorId) ?? 0;
    const isShout = event.declared.some((declaredEffect) =>
        declaredEffect.effect === PROVOCATION_KEY
    );
    const shoutStated = isShout ? statedSkills.shoutsBySkillId.get(event.skillId) : undefined;
    const shout = shoutStated === undefined
        ? null
        : { turns: shoutStated.turns, names: parseShoutNames(event.declared) };
    const turnsStated = statedSkills.auraTurnsBySkillId.get(event.skillId) ?? null;
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
        shoutTargetId: isShout ? event.targetId : null,
        shout,
        amountByKey: indexAmountByKey(event.declared),
        // Copied rather than held: the walk goes on counting, and a cast dated by a map that keeps
        // moving would be dated by wherever the fight ended (S9).
        turnsAtCastByCombatantId: new Map(turnsByCombatantId),
    };
}

/** The characters a shout named, off the value the announcement carried. */
function parseShoutNames(declared: readonly DeclaredEffect[]): string[] {
    const shoutNames: string[] = [];
    for (const declaredEffect of declared) {
        if (declaredEffect.effect !== PROVOCATION_KEY) continue;
        if (declaredEffect.text === null) continue;
        for (const name of declaredEffect.text.split(NAME_SEPARATOR)) {
            if (name.length > 0) shoutNames.push(name);
        }
    }
    assert(shoutNames.length <= COMBATANTS_MAXIMUM, "a shout names no more than a fight holds");
    return shoutNames;
}

/** What the announcement stated each of its keys at. Read here and totalled nowhere. */
function indexAmountByKey(declared: readonly DeclaredEffect[]): Map<string, number> {
    const amountByKey = new Map<string, number>();
    for (const declaredEffect of declared) {
        if (declaredEffect.amount !== null) {
            amountByKey.set(declaredEffect.effect, declaredEffect.amount);
        }
    }
    assert(
        amountByKey.size <= declared.length,
        "no key states more figures than it was declared with",
    );
    return amountByKey;
}

/**
 * Whom one shout is holding: every character its value named, resolved through the roster. A name
 * the roster cannot place, or places on more than one combatant, is dropped rather than guessed at
 * (`develop ADR 0064`).
 */
function lookupProvokedIds(cast: AuraCast, roster: CombatantRoster): number[] {
    if (cast.shout === null) return [];
    const provokedIds: number[] = [];
    for (const name of cast.shout.names) {
        const combatantId = lookupCombatantIdByName(roster, name);
        if (combatantId === null) continue;
        if (!provokedIds.includes(combatantId)) provokedIds.push(combatantId);
    }
    assert(provokedIds.length <= cast.shout.names.length, "no more are held than the value named");
    assert(
        provokedIds.every((heldId) => roster.byId.has(heldId)),
        "and each of them is in the roster",
    );
    return provokedIds;
}

/** Elapsed against stated, and a cast whose turns have run out is no longer standing. */
function composeAuraStandings(walk: AuraWalk): AuraStanding[] {
    const auraStandings: AuraStanding[] = [];
    for (const cast of walk.castByCasterAndSkill.values()) {
        const turnsStated = cast.turnsStated;
        assert(turnsStated !== null, "a cast standing on a side is one the table dates");
        const turnsTakenNow = walk.turnsByCombatantId.get(cast.casterId) ?? cast.turnsAtCast;
        const turnsElapsed = turnsTakenNow - cast.turnsAtCast;
        assert(turnsElapsed >= 0, "a caster never takes fewer turns than they had at the cast");
        if (turnsElapsed >= turnsStated) continue;
        auraStandings.push({
            skillId: cast.skillId,
            skillName: cast.skillName,
            casterId: cast.casterId,
            turnsElapsed,
            turnsStated,
            reach: cast.reach,
            shoutTargetId: cast.shoutTargetId,
            amountByKey: cast.amountByKey,
            turnsAtCastByCombatantId: cast.turnsAtCastByCombatantId,
        });
    }
    assert(auraStandings.length <= walk.castByCasterAndSkill.size, "no more stands than was cast");
    return auraStandings;
}

/**
 * Whom a shout is holding, one row per character, and only the shout that holds them now. **Counted
 * on the held character's own turns**: over `captures/` the provoked strike whoever shouted
 * on their first three turns and fall back on the fourth (`docs/auras-standing.md`).
 */
function composeProvocationStandings(walk: AuraWalk): ProvocationStanding[] {
    const provocationStandings: ProvocationStanding[] = [];
    for (const [provokedId, provocation] of walk.shoutByProvokedId) {
        const cast = provocation.cast;
        assert(cast.shout !== null, "a cast holding somebody shouted");
        const turnsTakenNow = walk.turnsByCombatantId.get(provokedId) ?? provocation.turnsAtShout;
        const turnsElapsed = turnsTakenNow - provocation.turnsAtShout;
        assert(turnsElapsed >= 0, "a character never takes fewer turns than they had at the shout");
        if (turnsElapsed > cast.shout.turns) continue;
        provocationStandings.push({
            provokedId,
            skillId: cast.skillId,
            skillName: cast.skillName,
            casterId: cast.casterId,
            turnsElapsed,
            turnsStated: cast.shout.turns,
        });
    }
    assert(
        provocationStandings.length <= walk.shoutByProvokedId.size,
        "no more are held than were shouted at",
    );
    return provocationStandings;
}

/**
 * What the keys on one cast say it reaches. ⚠️ **Keys that disagree are a skill reaching both
 * sides, not a reading that failed**: `Wyzywający okrzyk` does both in one announcement.
 */
export function lookupReachOfEffects(effects: readonly { effect: string }[]): AuraReach | null {
    assert(
        effects.length <= MESSAGE_PARTS_MAXIMUM,
        "a cast states no more than a message is read to",
    );
    let castReach: AuraReach | null = null;
    for (const declaredEffect of effects) {
        const reach = lookupKeyReach(declaredEffect.effect);
        if (reach === null) continue;
        if (castReach === null) castReach = reach;
        else if (castReach !== reach) castReach = AURA_REACH.bothSides;
    }
    return castReach;
}

/** The aura table, keyed by skill, handed over by whoever holds the frozen reading. */
export function indexAuraTurnsBySkillId(
    skills: readonly { id: number; turns: number }[],
): Map<number, number> {
    const auraTurnsBySkillId = new Map<number, number>();
    for (const skill of skills) {
        assert(skill.turns > 0, "a skill in the table runs for a stated number of turns");
        auraTurnsBySkillId.set(skill.id, skill.turns);
    }
    assert(auraTurnsBySkillId.size === skills.length, "and each of them is named once");
    return auraTurnsBySkillId;
}

/** The shouts the table dates, keyed as the aura turns are, and handed over the same way. */
export function indexShoutsBySkillId(
    skills: readonly { id: number; turns: number; coverageMinimum: number }[],
): Map<number, ShoutStated> {
    const shoutsBySkillId = new Map<number, ShoutStated>();
    for (const skill of skills) {
        assert(skill.turns > 0, "a shout in the table holds for a stated number of turns");
        assert(skill.coverageMinimum > 0, "and covers at least one character");
        shoutsBySkillId.set(skill.id, {
            turns: skill.turns,
            coverageMinimum: skill.coverageMinimum,
        });
    }
    assert(shoutsBySkillId.size === skills.length, "and each of them is named once");
    return shoutsBySkillId;
}

/**
 * How long the published table says a skill stands on a side: ⚠️ **the longest of its side-wide
 * effects**, since a skill running one for three turns and another for five is not over at three.
 * The shout half is dated by its own row and takes no part: skill 25 shouts for 3 turns and stands
 * on its side for 2 (`frozen/skill-durations.ts`, read 2026-09-21), and the longest over both stood
 * the aura a turn past the table. Null where no effect reaches a side. `tools/skill-table.ts`
 * freezes the aura table by this, so the rule and the table cannot be two readings.
 */
export function lookupAuraTurnsStated(effects: readonly SkillEffectTurns[]): number | null {
    assert(effects.length <= SKILL_EFFECTS_MAXIMUM, "a skill states a bounded list of effects");
    let longest = 0;
    for (const effect of effects) {
        if (effect.key === PROVOCATION_KEY) continue;
        if (!isSideWideKey(effect.key)) continue;
        for (const turns of effect.turns) {
            if (turns > longest) longest = turns;
        }
    }
    assert(longest >= 0, "a duration that was read is not below nothing");
    return longest === 0 ? null : longest;
}
