/**
 * What the window beside the panel says: whose turn it is, and what is standing on the fight.
 *
 * The reading only — what it looks like is `panel-look.ts`'s and what draws it is
 * `panel-element.ts`'s. Nothing here asserts and nothing throws (**A11**, **E14**): a bound
 * clamps, a name nobody stated falls back, and a row that cannot be shaped is left out.
 */

import type { AuraStanding, ProvocationStanding } from "@/src/core/aura-standing.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import type { TurnStatement } from "@/src/game/fight-underway.ts";
import { getColourForProfession, SIGNAL } from "@/src/ui/panel-look.ts";
import { PANEL_WORDS } from "@/src/ui/panel-words.ts";

/** Past every skill the corpus casts at a side in one fight, and a clamp rather than a bound. */
export const MAXIMUM_STANDING_ROWS = 24;
/** Past the most casters one skill has ever stood on at once. */
export const MAXIMUM_CASTERS = 12;
/**
 * Past every character a shout could hold at once: the game's own party limit is smaller, and the
 * corpus has never held more than one, because every recording in it is ten against one.
 */
export const MAXIMUM_PROVOKED = 12;

export interface StandingCaster {
    casterId: number;
    name: string;
    colour: string;
    turnsElapsed: number;
    turnsStated: number;
}

/** One character a shout is holding, and who is holding them with what. */
export interface StandingProvoked {
    provokedId: number;
    name: string;
    colour: string;
    casterName: string;
    /** The holder's own profession, drawn as a cap: a player is a player wherever they stand. */
    casterColour: string;
    skillName: string;
    turnsElapsed: number;
    turnsStated: number;
}

export interface StandingRow {
    skillId: number;
    skillName: string;
    /** Null where the client never said which side is the reader's own. */
    ours: number | null;
    theirs: number | null;
    casters: StandingCaster[];
}

export interface StandingReading {
    turnOrdinal: number | null;
    turnHolderName: string | null;
    rows: StandingRow[];
    /** Whom a shout is holding. Its own section: one row per person, never per cast. */
    provoked: StandingProvoked[];
    /** Which row is open, or null. One at a time, as a drill level is. */
    openSkillId: number | null;
}

function composeStandingCaster(standing: AuraStanding, roster: CombatantRoster): StandingCaster {
    const combatant = roster.byId.get(standing.casterId);
    return {
        casterId: standing.casterId,
        name: combatant?.name ?? PANEL_WORDS.withoutActor,
        colour: getColourForProfession(combatant?.profession ?? null),
        turnsElapsed: standing.turnsElapsed,
        turnsStated: standing.turnsStated,
    };
}

/** A provoked character is a person, so their row wears their own profession's hue. */
function composeStandingProvoked(
    standing: ProvocationStanding,
    roster: CombatantRoster,
): StandingProvoked {
    const provoked = roster.byId.get(standing.provokedId);
    const caster = roster.byId.get(standing.casterId);
    return {
        provokedId: standing.provokedId,
        name: provoked?.name ?? PANEL_WORDS.withoutTarget,
        colour: getColourForProfession(provoked?.profession ?? null),
        casterName: caster?.name ?? PANEL_WORDS.withoutActor,
        casterColour: getColourForProfession(caster?.profession ?? null),
        skillName: standing.skillName,
        turnsElapsed: standing.turnsElapsed,
        turnsStated: standing.turnsStated,
    };
}

/** Whose side a cast is on, or null where the client named no side of the reader's own. */
function getIsOurs(
    standing: AuraStanding,
    roster: CombatantRoster,
    readerSide: number | null,
): boolean | null {
    if (readerSide === null) return null;
    const combatant = roster.byId.get(standing.casterId);
    if (combatant === undefined) return null;
    return combatant.side === readerSide;
}

/**
 * One row per skill, the casters under it. The order is the fight's own: a skill first cast
 * earlier stands higher, so a row does not move under the hand as the next one is cast.
 */
function composeStandingRows(
    standings: readonly AuraStanding[],
    roster: CombatantRoster,
    readerSide: number | null,
): StandingRow[] {
    const rowBySkillId = new Map<number, StandingRow>();
    for (const standing of standings) {
        if (rowBySkillId.size >= MAXIMUM_STANDING_ROWS) break;
        const held = rowBySkillId.get(standing.skillId) ?? {
            skillId: standing.skillId,
            skillName: standing.skillName,
            ours: readerSide === null ? null : 0,
            theirs: readerSide === null ? null : 0,
            casters: [],
        };
        if (held.casters.length < MAXIMUM_CASTERS) {
            held.casters.push(composeStandingCaster(standing, roster));
        }
        const isOurs = getIsOurs(standing, roster, readerSide);
        if (isOurs === true) held.ours = (held.ours ?? 0) + 1;
        if (isOurs === false) held.theirs = (held.theirs ?? 0) + 1;
        rowBySkillId.set(standing.skillId, held);
    }
    return [...rowBySkillId.values()];
}

/**
 * The colour a caster's row wears. Where the client named the reader's side the row says which
 * side cast it and nothing else; where it named none, every row wears its caster's profession —
 * a panel that cannot tell the sides apart lists everybody rather than guessing (`CONTEXT.md`).
 */
export function getColourForRow(row: StandingRow, caster: StandingCaster): string {
    if (row.ours === null) return caster.colour;
    if (row.theirs === null) return caster.colour;
    const ours = row.casters.slice(0, row.ours).some((one) => one.casterId === caster.casterId);
    return ours ? SIGNAL.ours : SIGNAL.theirs;
}

export function composeStandingReading(
    standings: readonly AuraStanding[],
    provocations: readonly ProvocationStanding[],
    roster: CombatantRoster,
    readerSide: number | null,
    turn: TurnStatement | null,
    openSkillId: number | null,
): StandingReading {
    const rows = composeStandingRows(standings, roster, readerSide);
    const provoked = provocations
        .slice(0, MAXIMUM_PROVOKED)
        .map((one) => composeStandingProvoked(one, roster));
    const holder = turn === null ? undefined : roster.byId.get(turn.combatantId);
    const isOpen = rows.some((row) => row.skillId === openSkillId);
    return {
        turnOrdinal: turn?.ordinal ?? null,
        turnHolderName: holder?.name ?? null,
        rows,
        provoked,
        openSkillId: isOpen ? openSkillId : null,
    };
}
