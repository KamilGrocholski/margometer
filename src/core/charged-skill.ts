/**
 * The special blow a combatant is making ready, and what became of it.
 *
 * The game states the charge in the payload's envelope rather than in a message; what its ending
 * means is this file's. **A charge ends when the envelope stops stating it**, the client's own
 * rule: `super_cast` is cleared the moment the blow lands or is taken away (build `Cl9U89Zr`, read
 * 2026-09-09). Why it ended is in that payload's messages.
 */

import { assert } from "@std/assert/assert";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { BATTLE_EVENT, type BattleEvent } from "./battle-event.ts";
import { CHARGE_BROKEN_KEY } from "./protocol-key.ts";

/** Charging, or one of the two ends the protocol names. The other endings state nothing. */
export const CHARGED_SKILL_STATE = {
    charging: "charging",
    struck: "struck",
    broken: "broken",
} as const;
export type ChargedSkillState = VocabularyWord<typeof CHARGED_SKILL_STATE>;

/** One combatant as a payload's envelope states them, and the charge they carry or do not. */
export interface ChargedSkillStatement {
    combatantId: number;
    /** Null where the payload stated the combatant and no charge, which is how a charge ends. */
    charge: { skillName: string; turnsElapsed: number; turnsStated: number } | null;
}

export interface ChargedSkillStanding {
    combatantId: number;
    skillName: string;
    /** What has passed of what the game states, which is the client's own pair of figures. */
    turnsElapsed: number;
    turnsStated: number;
    state: ChargedSkillState;
    /** The turn the game numbered when it ended. Null while charging, and where it numbers none. */
    endedAtOrdinal: number | null;
}

/**
 * Past every charge the corpus has held at once, which is **one**, in every payload of every
 * recording, 2026-09-11. A clamp rather than a bound: a fight holding more draws the first of them.
 */
export const CHARGED_SKILLS_MAXIMUM = 4;

/**
 * What stands after this payload: every charge the envelope states, and every one that ended under
 * it for as long as the turn it ended on. ⚠️ **A payload states only what moved**: a combatant it
 * says nothing about is charging what they were charging.
 */
export function prepareChargedSkills(
    standings: readonly ChargedSkillStanding[],
    statements: readonly ChargedSkillStatement[],
    events: readonly BattleEvent[],
    ordinal: number | null,
): ChargedSkillStanding[] {
    assert(standings.length <= CHARGED_SKILLS_MAXIMUM, "what stood stays inside the bound");
    const announced = indexAnnouncedNamesByActor(events);
    const broken = indexBrokenIds(events);
    const statedById = new Map(statements.map((one) => [one.combatantId, one]));
    const next: ChargedSkillStanding[] = [];
    for (const held of standings) {
        const statement = statedById.get(held.combatantId);
        if (statement?.charge !== undefined) {
            if (statement.charge !== null) continue;
        }
        if (held.state !== CHARGED_SKILL_STATE.charging) {
            if (!isPastItsTurn(held, ordinal)) next.push(held);
            continue;
        }
        if (statement === undefined) {
            next.push(held);
            continue;
        }
        const state = lookupEndedState(held, announced, broken);
        if (state !== null) next.push({ ...held, state, endedAtOrdinal: ordinal });
    }
    for (const statement of statements) {
        const charging = prepareChargedSkillsCharging(statement);
        if (charging === null) continue;
        if (next.length >= CHARGED_SKILLS_MAXIMUM) break;
        next.push(charging);
    }
    assert(next.length <= CHARGED_SKILLS_MAXIMUM, "and what stands now stays inside it too");
    return next;
}

/**
 * Every skill one payload announced by name, by whoever announced it, which is what says a charge
 * was spent. By the announcer and not by the name alone: two combatants making the same blow ready
 * would otherwise both read as struck off one of them landing it.
 */
function indexAnnouncedNamesByActor(events: readonly BattleEvent[]): Map<number, Set<string>> {
    const namesByActor = new Map<number, Set<string>>();
    const add = (actorId: number | null, skillName: string): void => {
        assert(skillName.length > 0, "an announcement that was made is named");
        if (actorId === null) return;
        const names = namesByActor.get(actorId) ?? new Set<string>();
        names.add(skillName);
        namesByActor.set(actorId, names);
    };
    for (const event of events) {
        if (event.kind === BATTLE_EVENT.skillUsed) add(event.actorId, event.skillName);
        if (event.kind === BATTLE_EVENT.attack) {
            if (event.announced !== null) add(event.announced.actorId, event.announced.skillName);
        }
    }
    assert(namesByActor.size <= events.length, "no more announcers than events announcing");
    return namesByActor;
}

/** Whom a blow of this payload broke a charge on, which the message states as its target. */
function indexBrokenIds(events: readonly BattleEvent[]): Set<number> {
    const broken = new Set<number>();
    for (const event of events) {
        if (event.kind !== BATTLE_EVENT.attack) continue;
        if (event.targetId === null) continue;
        if (event.procs.includes(CHARGE_BROKEN_KEY)) broken.add(event.targetId);
    }
    assert(broken.size <= events.length, "no more broken than blows");
    return broken;
}

/**
 * ⚠️ **One turn is one payload**: over `develop:captures/` 2026-09-11 the game's own turn number
 * moves by one on the very next payload, 24 times out of 24. Where it numbers no turn at all, the
 * mark lasts the payload it was made on and no longer.
 */
function isPastItsTurn(standing: ChargedSkillStanding, ordinal: number | null): boolean {
    if (standing.endedAtOrdinal === null) return true;
    if (ordinal === null) return true;
    return ordinal > standing.endedAtOrdinal;
}

/**
 * Which of the two ends this charge came to, or null where the protocol names neither: the
 * combatant fell, or the charge went away under nothing this reader can see.
 */
function lookupEndedState(
    standing: ChargedSkillStanding,
    announced: ReadonlyMap<number, ReadonlySet<string>>,
    broken: ReadonlySet<number>,
): ChargedSkillState | null {
    assert(standing.skillName.length > 0, "a charge that stood names the blow being made ready");
    if (announced.get(standing.combatantId)?.has(standing.skillName) === true) {
        return CHARGED_SKILL_STATE.struck;
    }
    if (broken.has(standing.combatantId)) return CHARGED_SKILL_STATE.broken;
    return null;
}

function prepareChargedSkillsCharging(
    statement: ChargedSkillStatement,
): ChargedSkillStanding | null {
    const charge = statement.charge;
    if (charge === null) return null;
    assert(charge.skillName.length > 0, "a charge that was read names the blow being made ready");
    assert(charge.turnsElapsed >= 0, "and states a count of turns that have passed");
    assert(charge.turnsStated >= charge.turnsElapsed, "no more of them than the whole charge runs");
    return {
        combatantId: statement.combatantId,
        skillName: charge.skillName,
        turnsElapsed: charge.turnsElapsed,
        turnsStated: charge.turnsStated,
        state: CHARGED_SKILL_STATE.charging,
        endedAtOrdinal: null,
    };
}
