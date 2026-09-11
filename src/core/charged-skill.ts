/**
 * The special blow a combatant is making ready, and what became of it.
 *
 * The game states this in the payload's own envelope rather than in a message, so it arrives
 * beside the events rather than out of them: the charge itself is `src/game/engine-warrior.ts`'s
 * to read, and what its ending means is this file's. Three states and two of them are terminal.
 *
 * **A charge ends when the envelope stops stating it**, which is the client's own rule and not a
 * reading of ours — `super_cast` is cleared the moment the blow lands or is taken away, build
 * `Cl9U89Zr`, read 2026-09-09. Why it ended is in that payload's messages: the blow's own
 * announcement says it struck, and a dispel aimed at the charging combatant says it was broken.
 */

import { assert } from "@std/assert/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";

/**
 * What the client announces alongside the blow that broke a charge. The published help names four
 * effects able to break one — Ogłuszenie/Zamrożenie, Klątwa, Oślepienie, Wytrącenie z równowagi
 * (article `view,372`, read 2026-09-11) — and this is the key the game states when one lands:
 * measured over `captures/` 2026-09-11, all 43 of them ride one of those effects, and the 24
 * aimed at a standing charge end it every time. `docs/protocol-keys.md` owns what the key means.
 */
export const CHARGE_BROKEN_KEY = "+superspell-dispel";
/**
 * Past every charge the corpus has ever held at once, which is **one**, in every payload of all
 * 31 recordings, 2026-09-11. A clamp rather than a bound: a fight holding more draws the first
 * of them and goes on being drawn.
 */
export const MAXIMUM_CHARGED_SKILLS = 4;

/** Charging, or one of the two ends the protocol names. The other endings state nothing. */
export type ChargedSkillState = "charging" | "struck" | "broken";

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

/** Every skill one payload announced by name, which is what says a charge was spent. */
function readAnnouncedNames(events: readonly BattleEvent[]): Set<string> {
    const names = new Set<string>();
    for (const event of events) {
        if (event.kind === "skill-used") names.add(event.skillName);
        if (event.kind === "attack" && event.announced !== null) {
            names.add(event.announced.skillName);
        }
    }
    return names;
}

/** Whom a blow of this payload broke a charge on, which the message states as its target. */
function readBrokenIds(events: readonly BattleEvent[]): Set<number> {
    const broken = new Set<number>();
    for (const event of events) {
        if (event.kind !== "attack") continue;
        if (event.targetId === null) continue;
        if (!event.procs.includes(CHARGE_BROKEN_KEY)) continue;
        broken.add(event.targetId);
    }
    return broken;
}

/**
 * Which of the two ends this charge came to, or null where the protocol names neither — the
 * combatant fell, or the charge went away under nothing this reader can see. Silence is the
 * answer there: a word for it would be ours rather than the game's.
 */
function getEndedState(
    standing: ChargedSkillStanding,
    announced: ReadonlySet<string>,
    broken: ReadonlySet<number>,
): ChargedSkillState | null {
    if (announced.has(standing.skillName)) return "struck";
    if (broken.has(standing.combatantId)) return "broken";
    return null;
}

/**
 * Whether an ended charge has outlived the turn it was meant to stand for.
 *
 * ⚠️ **One turn is one payload.** Measured over `captures/` 2026-09-11: the game's own turn
 * number moves by one on the very next payload, 24 times out of 24. Where it numbers no turn at
 * all — a fight it is running itself (**ADR 0072**) — there is nothing to count, so the mark
 * lasts the payload it was made on and no longer.
 */
function isPastItsTurn(standing: ChargedSkillStanding, ordinal: number | null): boolean {
    if (standing.endedAtOrdinal === null) return true;
    if (ordinal === null) return true;
    return ordinal > standing.endedAtOrdinal;
}

function composeCharging(statement: ChargedSkillStatement): ChargedSkillStanding | null {
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
        state: "charging",
        endedAtOrdinal: null,
    };
}

/**
 * What stands after this payload: every charge the envelope states, and every one that ended
 * under it for as long as the turn it ended on.
 *
 * ⚠️ **A payload states only what moved.** A combatant it says nothing about is charging what
 * they were charging — only a statement carrying no charge ends one, which is why the statements
 * carry the combatants as well as their charges.
 */
export function composeChargedSkills(
    standings: readonly ChargedSkillStanding[],
    statements: readonly ChargedSkillStatement[],
    events: readonly BattleEvent[],
    ordinal: number | null,
): ChargedSkillStanding[] {
    assert(standings.length <= MAXIMUM_CHARGED_SKILLS, "what stood stays inside the bound");
    const announced = readAnnouncedNames(events);
    const broken = readBrokenIds(events);
    const statedById = new Map(statements.map((one) => [one.combatantId, one]));
    const next: ChargedSkillStanding[] = [];
    for (const held of standings) {
        const statement = statedById.get(held.combatantId);
        if (statement !== undefined && statement.charge !== null) continue;
        if (held.state !== "charging") {
            if (isPastItsTurn(held, ordinal)) continue;
            next.push(held);
            continue;
        }
        if (statement === undefined) {
            next.push(held);
            continue;
        }
        const state = getEndedState(held, announced, broken);
        if (state === null) continue;
        next.push({ ...held, state, endedAtOrdinal: ordinal });
    }
    for (const statement of statements) {
        const charging = composeCharging(statement);
        if (charging === null) continue;
        if (next.length >= MAXIMUM_CHARGED_SKILLS) break;
        next.push(charging);
    }
    assert(next.length <= MAXIMUM_CHARGED_SKILLS, "and what stands now stays inside it too");
    return next;
}
