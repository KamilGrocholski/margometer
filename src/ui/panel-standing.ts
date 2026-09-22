/**
 * What the window beside the panel says: whose turn it is, and what is standing on the fight.
 *
 * The reading only — what it looks like is `panel-look.ts`'s and what draws it is
 * `panel-element.ts`'s. Nothing here asserts and nothing throws (**A11**, **E14**): a bound
 * clamps, a name nobody stated falls back, and a row that cannot be shaped is left out.
 */

import type { AuraStanding, ProvocationStanding } from "@/src/core/aura-standing.ts";
import type { ChargedSkillStanding, ChargedSkillState } from "@/src/core/charged-skill.ts";
import { type CombatantRoster, MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import type { TurnStatement } from "@/src/game/fight-underway.ts";
import { getColourForProfession, SIGNAL } from "@/src/ui/panel-look.ts";
import type { CarriedStatus } from "@/src/core/carried-status.ts";
import { getPartOfSide, type PanelSidePart } from "@/src/ui/panel-reading.ts";
import { PANEL_WORDS } from "@/src/ui/panel-words.ts";
import { FROZEN_AURA_TURNS } from "@/frozen/aura-turns.ts";
import { FROZEN_BUFF_BITS } from "@/frozen/buff-bits.ts";

/**
 * One row per skill the published table dates, which is every row this section can ever hold: a
 * row is keyed by `skillId`, and **only a cast the table dates ever stands** — the walk keeps no
 * other (`core/aura-standing.ts`). So the table is the ceiling, and a skill added to it moves
 * this by itself. A clamp rather than a bound, like the rest here (**A11**, **ADR 0051**).
 */
export const MAXIMUM_STANDING_ROWS = FROZEN_AURA_TURNS.skills.length;
/**
 * Everybody on the board, because **one skill can be cast from both sides at once**: the same
 * professions field on either, and a row is keyed by the caster, so the most that can stand under
 * one skill is one caster each. The corpus reaches four and a fabricated ten-a-side reaches four
 * as well, so neither shows what this is for — it is counted off the roster and not off them.
 */
export const MAXIMUM_CASTERS = MAXIMUM_COMBATANTS;
/**
 * Every character on the board, because **both sides may be shouting and nobody is held twice**:
 * a later shout replaces whatever held somebody (**ADR 0062**), so the most that can stand at
 * once is one row each. The corpus cannot show it — every recording in it is ten against one and
 * two is the most it ever held — and a fabricated ten-a-side stands 20 at once, which the bound
 * this replaced clamped to 12.
 */
export const MAXIMUM_PROVOKED = MAXIMUM_COMBATANTS;
/** Everybody on the board, since the mask goes out per combatant — **A11**, **ADR 0051**. */
export const MAXIMUM_CARRIERS = MAXIMUM_COMBATANTS;
/**
 * One row per status the client registers, counted off the frozen table rather than guessed above
 * it: a tenth status the client adds moves this by itself, where a number typed here would go on
 * clamping to nine of it.
 */
export const MAXIMUM_CARRIED_STATUSES = FROZEN_BUFF_BITS.bits.length;
/**
 * Past every charge the corpus has ever held at once, which is one — and past the bound
 * `core/charged-skill.ts` already clamps to, so this one only ever repeats that answer.
 *
 * Exported because every row this window draws carries a card, so the band joins the arithmetic
 * `tests/ui/share-bound.test.ts` holds the register to (**ADR 0100**).
 */
export const MAXIMUM_CHARGED_ROWS = 4;

export interface StandingCaster {
    casterId: number;
    name: string;
    colour: string;
    /** Which side they cast from. `nobody` where the client named no side of the reader's own. */
    sidePart: PanelSidePart;
    turnsElapsed: number;
    turnsStated: number;
}

/**
 * One character a shout is holding. A person, so drawn as one — hue and side, like any row — and
 * **with a length of their own**, because a shout runs on the turns of whoever it holds and two
 * characters held by one cast are not the same number of turns in. **ADR 0103.**
 */
export interface StandingProvoked {
    provokedId: number;
    name: string;
    colour: string;
    sidePart: PanelSidePart;
    turnsElapsed: number;
    turnsStated: number;
}

/**
 * Whoever is holding somebody, and whom. **It states no length of its own**: one cast holding two
 * characters is two counts, on two clocks, so the figure sits on the row of whoever is carrying it
 * — **ADR 0103**, superseding **ADR 0067** on the half that put it here.
 *
 * The okrzyk is named here because the two of them are not one state: the table dates their
 * side-wide halves apart, so which one holds somebody is something a reader acts on. **ADR 0097.**
 */
export interface StandingProvocation {
    casterId: number;
    casterName: string;
    skillId: number;
    skillName: string;
    casterColour: string;
    casterSidePart: PanelSidePart;
    provoked: StandingProvoked[];
}

/**
 * One special blow being made ready, or the mark one left behind. A charge wears the hue of
 * whoever is making it; a charge that is over wears none, because it is no longer anybody doing
 * something — the word beside it is what says which of the two ends it came to.
 */
export interface StandingChargedSkill {
    combatantId: number;
    /**
     * Whoever is making it ready. The row says it in a hue alone, so the card is where it is said
     * in words — which is the whole of what the row left out (**ADR 0100**).
     */
    name: string;
    skillName: string;
    turnsElapsed: number;
    turnsStated: number;
    state: ChargedSkillState;
    colour: string;
    sidePart: PanelSidePart;
}

export interface StandingRow {
    skillId: number;
    skillName: string;
    /** Null where the client never said which side is the reader's own. */
    reader: number | null;
    opposing: number | null;
    casters: StandingCaster[];
}

/**
 * What the window may say under `Teraz`: the turn the game is numbering, or which of the three
 * states leaves it with none to say. **ADR 0072.**
 */
export type StandingTurnState = "held" | "unread" | "afterFight" | "onAuto";

/** What the fight says about the turn in hand, which is more than the statement itself. */
export interface StandingTurn {
    statement: TurnStatement | null;
    isOver: boolean;
    isOnAuto: boolean;
}

/** Whoever the game is numbering a turn for: a person, so drawn as one wherever they stand. */
export interface StandingHolder {
    name: string;
    colour: string;
    sidePart: PanelSidePart;
}

/** One status one combatant is carrying, as a row of the window states it. */
export interface StandingCarriedStatus {
    bit: number;
    turnsElapsed: number;
}

/**
 * One combatant and what the game says they are holding. **It names no caster and no total**: a
 * mask says what somebody carries and never whose cast put it there, so this section answers
 * `on whom` and the section above it answers `what was cast` — **ADR 0104**, and **ADR 0061** is
 * why neither answers the other.
 */
export interface StandingCarrier {
    combatantId: number;
    name: string;
    colour: string;
    sidePart: PanelSidePart;
    statuses: StandingCarriedStatus[];
}

export interface StandingReading {
    turnState: StandingTurnState;
    turnOrdinal: number | null;
    /** Null where the payload numbered a turn for nobody the roster holds. */
    holder: StandingHolder | null;
    rows: StandingRow[];
    /** Whom a shout is holding. Its own section: one row per cast, the held under it. */
    provoked: StandingProvocation[];
    /** What is being made ready, and what became of it. Empty draws no section at all. */
    chargedSkills: StandingChargedSkill[];
    /** What each combatant is carrying, read off the game's own mask. Empty draws no section. */
    carriers: StandingCarrier[];
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
        turnsElapsed: standing.turnsElapsed,
        turnsStated: standing.turnsStated,
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
 *
 * ⚠️ **The fold takes the cast and not the caster**, because the group is drawn under the okrzyk's
 * name: one caster shouting both of them would otherwise be one group under one name, and the
 * name would be wrong for half of it. No moment in `captures/` shows that, so what this holds is
 * the label rather than a reading anything has seen go wrong. **ADR 0097.**
 */
function composeStandingProvocations(
    provocations: readonly ProvocationStanding[],
    roster: CombatantRoster,
    readerSide: number | null,
): StandingProvocation[] {
    const byCast = new Map<string, StandingProvocation>();
    for (const standing of provocations) {
        const caster = roster.byId.get(standing.casterId);
        const key = `${standing.casterId}/${standing.skillId}`;
        const held = byCast.get(key) ?? {
            casterId: standing.casterId,
            casterName: caster?.name ?? PANEL_WORDS.withoutActor,
            skillId: standing.skillId,
            skillName: standing.skillName,
            casterColour: getColourForProfession(caster?.profession ?? null),
            casterSidePart: getPartOfSide(caster?.side ?? null, readerSide),
            provoked: [],
        };
        held.provoked.push(composeStandingProvoked(standing, roster, readerSide));
        byCast.set(key, held);
    }
    return [...byCast.values()];
}

/**
 * The hue a charge is drawn in. Only one that is still running wears a profession: the two ends
 * are drawn quiet, so the row reads as something that has stopped happening without the colour
 * having to carry that by itself (**The Colour Never Alone Rule**).
 */
function getColourForCharge(state: ChargedSkillState, profession: string | null): string {
    if (state !== "charging") return SIGNAL.unknown;
    return getColourForProfession(profession);
}

function composeStandingChargedSkill(
    standing: ChargedSkillStanding,
    roster: CombatantRoster,
    readerSide: number | null,
): StandingChargedSkill {
    const combatant = roster.byId.get(standing.combatantId);
    return {
        combatantId: standing.combatantId,
        name: combatant?.name ?? PANEL_WORDS.withoutActor,
        skillName: standing.skillName,
        turnsElapsed: standing.turnsElapsed,
        turnsStated: standing.turnsStated,
        state: standing.state,
        colour: getColourForCharge(standing.state, combatant?.profession ?? null),
        sidePart: getPartOfSide(combatant?.side ?? null, readerSide),
    };
}

function composeStandingChargedSkills(
    standings: readonly ChargedSkillStanding[],
    roster: CombatantRoster,
    readerSide: number | null,
): StandingChargedSkill[] {
    const composed: StandingChargedSkill[] = [];
    for (const standing of standings) {
        if (composed.length >= MAXIMUM_CHARGED_ROWS) break;
        if (standing.skillName.length === 0) continue;
        composed.push(composeStandingChargedSkill(standing, roster, readerSide));
    }
    return composed;
}

/** Whose side a cast is on, or null where the client named no side of the reader's own. */
function getIsOnReaderSide(
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
            reader: readerSide === null ? null : 0,
            opposing: readerSide === null ? null : 0,
            casters: [],
        };
        if (held.casters.length < MAXIMUM_CASTERS) {
            held.casters.push(composeStandingCaster(standing, roster, readerSide));
        }
        const isReaders = getIsOnReaderSide(standing, roster, readerSide);
        if (isReaders === true) held.reader = (held.reader ?? 0) + 1;
        if (isReaders === false) held.opposing = (held.opposing ?? 0) + 1;
        rowBySkillId.set(standing.skillId, held);
    }
    return [...rowBySkillId.values()];
}

/**
 * The turn the game is numbering **now**, which is none once it has stopped numbering: a fight
 * that is over numbers nobody's (**ADR 0066**) and neither does one the game is running itself,
 * where the statement standing is one from before it started (**ADR 0072**).
 */
function getStandingTurnNow(turn: StandingTurn): TurnStatement | null {
    if (turn.isOnAuto) return null;
    if (turn.isOver) return null;
    return turn.statement;
}

/**
 * Which sentence the window has to say. A fight the game is running itself outranks one that has
 * ended, because both are true of every fight fought on the auto key and only the first says why
 * there is no turn to draw. **ADR 0072.**
 */
function getStandingTurnState(turn: StandingTurn, hasHolder: boolean): StandingTurnState {
    if (turn.isOnAuto) return "onAuto";
    if (turn.isOver) return "afterFight";
    if (hasHolder) return "held";
    return "unread";
}

/**
 * What each combatant is carrying, gathered onto them. Sorted by side and then by name so the
 * section reads like the ranking does, and clamped at both levels: a mask the game grew would
 * otherwise lengthen the window without anything saying so (**S11**).
 */
function composeStandingCarriers(
    carried: readonly CarriedStatus[],
    roster: CombatantRoster,
    readerSide: number | null,
): StandingCarrier[] {
    const byCombatantId = new Map<number, StandingCarrier>();
    for (const one of carried) {
        const combatant = roster.byId.get(one.combatantId);
        if (combatant === undefined) continue;
        const carrier = byCombatantId.get(one.combatantId) ?? {
            combatantId: one.combatantId,
            name: combatant.name,
            colour: getColourForProfession(combatant.profession),
            sidePart: getPartOfSide(combatant.side, readerSide),
            statuses: [],
        };
        if (carrier.statuses.length < MAXIMUM_CARRIED_STATUSES) {
            carrier.statuses.push({ bit: one.bit, turnsElapsed: one.turnsElapsed });
        }
        byCombatantId.set(one.combatantId, carrier);
        if (byCombatantId.size >= MAXIMUM_CARRIERS) break;
    }
    return [...byCombatantId.values()];
}

export function composeStandingReading(
    standings: readonly AuraStanding[],
    provocations: readonly ProvocationStanding[],
    chargedSkills: readonly ChargedSkillStanding[],
    carried: readonly CarriedStatus[],
    roster: CombatantRoster,
    readerSide: number | null,
    turn: StandingTurn,
    openSkillId: number | null,
): StandingReading {
    const rows = composeStandingRows(standings, roster, readerSide);
    // Clamped before the fold, so the whole section stays inside the one stated bound and the
    // groups are bounded by what is left of it (**S11**).
    const held = provocations.slice(0, MAXIMUM_PROVOKED);
    const provoked = composeStandingProvocations(held, roster, readerSide);
    const now = getStandingTurnNow(turn);
    const holder = now === null ? undefined : roster.byId.get(now.combatantId);
    const isOpen = rows.some((row) => row.skillId === openSkillId);
    return {
        turnState: getStandingTurnState(turn, holder !== undefined),
        turnOrdinal: now?.ordinal ?? null,
        holder: holder === undefined ? null : {
            name: holder.name,
            colour: getColourForProfession(holder.profession),
            sidePart: getPartOfSide(holder.side, readerSide),
        },
        rows,
        provoked,
        chargedSkills: composeStandingChargedSkills(chargedSkills, roster, readerSide),
        carriers: composeStandingCarriers(carried, roster, readerSide),
        openSkillId: isOpen ? openSkillId : null,
    };
}
