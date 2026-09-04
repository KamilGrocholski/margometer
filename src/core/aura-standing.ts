/**
 * What one skill put on more than one combatant, and how long the game says it runs. The protocol
 * announces the cast and never mentions it again, so the length is the published table's and never
 * a reading. This file owns which keys name more than one person.
 */

import { assert } from "@std/assert/assert";

const TEAM_WIDE_OPENING = "aura-";
const TEAM_WIDE_ENDINGS = ["-all", "-allies", "-enemies"];
/** Team-wide by meaning, carrying neither shape above. A reader without them loses all four. */
const TEAM_WIDE_NAMES = ["shout", "allslow_per", "alllowdmg", "healall_per"];

export interface SkillEffectTurns {
    key: string;
    turns: readonly number[];
}

export interface AuraStanding {
    skillId: number;
    skillName: string;
    casterId: number;
    /** Counted, in the caster's own turns, from the turn the cast stood on. */
    turnsElapsed: number;
    /** Stated by the table, and the same at every level for every one of them. */
    turnsStated: number;
}

export function isTeamWideKey(key: string): boolean {
    assert(key.length > 0, "a key that is asked about is named");
    assert(TEAM_WIDE_ENDINGS.length > 0, "and there are shapes to try it against");
    if (key.startsWith(TEAM_WIDE_OPENING)) return true;
    for (const ending of TEAM_WIDE_ENDINGS) {
        if (key.endsWith(ending)) return true;
    }
    return TEAM_WIDE_NAMES.some((name) => name === key);
}

/**
 * ⚠️ **The longest of them, where a skill states several.** `Wyzywający okrzyk` runs one for three
 * turns and two for five, so the shortest would call the skill over while part of it still runs.
 */
export function getStatedTurnsFromEffects(effects: readonly SkillEffectTurns[]): number | null {
    let longest = 0;
    for (const effect of effects) {
        if (!isTeamWideKey(effect.key)) continue;
        for (const turns of effect.turns) {
            if (turns > longest) longest = turns;
        }
    }
    assert(longest >= 0, "a duration that was read is not below nothing");
    assert(effects.length >= 0, "and was read off the effects a skill states");
    if (longest === 0) return null;
    return longest;
}

/**
 * Composed here and never imported here: `core` reads nothing outside itself, `libs` and the
 * standard library (`ARCHITECTURE.md`), so whoever holds the reading hands it over.
 */
export function composeAuraTurnsBySkillId(
    stated: readonly { id: number; turns: number }[],
): Map<number, number> {
    const found = new Map<number, number>();
    for (const skill of stated) {
        assert(skill.turns > 0, "a skill in the table runs for a stated number of turns");
        found.set(skill.id, skill.turns);
    }
    assert(found.size <= stated.length, "and each of them is named once");
    return found;
}
