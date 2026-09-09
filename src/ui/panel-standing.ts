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
import { getColourForProfession } from "@/src/ui/panel-look.ts";
import { getPartOfSide, type PanelSidePart } from "@/src/ui/panel-reading.ts";
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
    /** Which side they cast from. `nobody` where the client named no side of the reader's own. */
    sidePart: PanelSidePart;
    turnsElapsed: number;
    turnsStated: number;
}

/** One character a shout is holding. A person, so drawn as one — hue and side, like any row. */
export interface StandingProvoked {
    provokedId: number;
    name: string;
    colour: string;
    sidePart: PanelSidePart;
}

/**
 * Whoever is holding somebody, and whom. The turns are the **cast's** and stand here once: over
 * `captures/` 2026-09-09, 11 casts held two characters and all 11 stated one figure. **ADR 0067.**
 */
export interface StandingProvocation {
    casterId: number;
    casterName: string;
    casterColour: string;
    casterSidePart: PanelSidePart;
    turnsElapsed: number;
    turnsStated: number;
    provoked: StandingProvoked[];
}

export interface StandingRow {
    skillId: number;
    skillName: string;
    /** Null where the client never said which side is the reader's own. */
    ours: number | null;
    theirs: number | null;
    casters: StandingCaster[];
}

/** Whoever the game is numbering a turn for: a person, so drawn as one wherever they stand. */
export interface StandingHolder {
    name: string;
    colour: string;
    sidePart: PanelSidePart;
}

export interface StandingReading {
    turnOrdinal: number | null;
    /** Null where the payload numbered a turn for nobody the roster holds. */
    holder: StandingHolder | null;
    rows: StandingRow[];
    /** Whom a shout is holding. Its own section: one row per cast, the held under it. */
    provoked: StandingProvocation[];
    /** Which row is open, or null. One at a time, as a drill level is. */
    openSkillId: number | null;
}

function composeStandingCaster(
    standing: AuraStanding,
    roster: CombatantRoster,
    readerSide: number | null,
): StandingCaster {
    const combatant = roster.byId.get(standing.casterId);
    return {
        casterId: standing.casterId,
        name: combatant?.name ?? PANEL_WORDS.withoutActor,
        colour: getColourForProfession(combatant?.profession ?? null),
        sidePart: getPartOfSide(combatant?.side ?? null, readerSide),
        turnsElapsed: standing.turnsElapsed,
        turnsStated: standing.turnsStated,
    };
}

/** A provoked character is a person, so their row wears their own profession's hue. */
function composeStandingProvoked(
    standing: ProvocationStanding,
    roster: CombatantRoster,
    readerSide: number | null,
): StandingProvoked {
    const provoked = roster.byId.get(standing.provokedId);
    return {
        provokedId: standing.provokedId,
        name: provoked?.name ?? PANEL_WORDS.withoutTarget,
        colour: getColourForProfession(provoked?.profession ?? null),
        sidePart: getPartOfSide(provoked?.side ?? null, readerSide),
    };
}

/**
 * The held folded under whoever is holding them, in the order the fight named them — so a group
 * does not move under the hand as the next cast lands.
 *
 * ⚠️ **The fold is the panel's and the keying stays the core's.** `core/aura-standing.ts` keys a
 * provocation by the character it holds, so every entry handed here is an already-settled pair and
 * a character cannot arrive twice. That is what keeps this clear of the alternative **ADR 0062**
 * rejected. **ADR 0067.**
 */
function composeStandingProvocations(
    provocations: readonly ProvocationStanding[],
    roster: CombatantRoster,
    readerSide: number | null,
): StandingProvocation[] {
    const byCasterId = new Map<number, StandingProvocation>();
    for (const standing of provocations) {
        const caster = roster.byId.get(standing.casterId);
        const held = byCasterId.get(standing.casterId) ?? {
            casterId: standing.casterId,
            casterName: caster?.name ?? PANEL_WORDS.withoutActor,
            casterColour: getColourForProfession(caster?.profession ?? null),
            casterSidePart: getPartOfSide(caster?.side ?? null, readerSide),
            turnsElapsed: standing.turnsElapsed,
            turnsStated: standing.turnsStated,
            provoked: [],
        };
        held.provoked.push(composeStandingProvoked(standing, roster, readerSide));
        byCasterId.set(standing.casterId, held);
    }
    return [...byCasterId.values()];
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
            held.casters.push(composeStandingCaster(standing, roster, readerSide));
        }
        const isOurs = getIsOurs(standing, roster, readerSide);
        if (isOurs === true) held.ours = (held.ours ?? 0) + 1;
        if (isOurs === false) held.theirs = (held.theirs ?? 0) + 1;
        rowBySkillId.set(standing.skillId, held);
    }
    return [...rowBySkillId.values()];
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
    // Clamped before the fold, so the whole section stays inside the one stated bound and the
    // groups are bounded by what is left of it (**S11**).
    const held = provocations.slice(0, MAXIMUM_PROVOKED);
    const provoked = composeStandingProvocations(held, roster, readerSide);
    const holder = turn === null ? undefined : roster.byId.get(turn.combatantId);
    const isOpen = rows.some((row) => row.skillId === openSkillId);
    return {
        turnOrdinal: turn?.ordinal ?? null,
        holder: holder === undefined ? null : {
            name: holder.name,
            colour: getColourForProfession(holder.profession),
            sidePart: getPartOfSide(holder.side, readerSide),
        },
        rows,
        provoked,
        openSkillId: isOpen ? openSkillId : null,
    };
}
