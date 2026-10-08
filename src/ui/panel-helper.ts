/**
 * What the window beside the panel says about the fight: whose turn it is, what is being made
 * ready, and who is holding whom.
 *
 * The reading only: nothing here draws. Nothing here asserts and nothing throws (**A11**,
 * **E12**): a bound clamps, a name nobody stated falls back, and a row that cannot be shaped is
 * left out.
 */

import type { VocabularyWord } from "#/libs/vocabulary.ts";
import type { ProvocationStanding } from "#/src/core/aura-standing.ts";
import {
    CHARGED_SKILL_STATE,
    CHARGED_SKILLS_MAXIMUM,
    type ChargedSkillStanding,
    type ChargedSkillState,
} from "#/src/core/charged-skill.ts";
import { type CombatantRoster, COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import type { TurnStatement } from "#/src/core/fight-session.ts";
import { type Colour, lookupColourForProfession, SIGNAL } from "./panel-palette.ts";
import { getSideRelation, type SideRelation } from "./panel-content.ts";
import { PANEL_WORDS } from "./panel-words.ts";

/**
 * One character a shout is holding. A person, so drawn as one — hue and side, like any row — and
 * **with a length of their own**, because a shout runs on the turns of whoever it holds and two
 * characters held by one cast are not the same number of turns in. `develop ADR 0103`.
 */
export interface StandingProvoked {
    provokedId: number;
    name: string;
    colour: Colour;
    sideRelation: SideRelation;
    turnsElapsed: number;
    turnsStated: number;
}

/**
 * Whoever is holding somebody, and whom. **It states no length of its own**: one cast holding two
 * characters is two counts, on two clocks, so the figure sits on the row of whoever is carrying it
 * — `develop ADR 0103`, superseding `develop ADR 0067` on the half that put it here.
 *
 * The shout is named here because the two of them are not one state: the table dates their
 * side-wide halves apart, so which one holds somebody is something a reader acts on.
 * `develop ADR 0097`.
 */
export interface StandingProvocation {
    casterId: number;
    casterName: string;
    skillId: number;
    skillName: string;
    casterColour: Colour;
    casterSideRelation: SideRelation;
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
     * in words — which is the whole of what the row left out (`develop ADR 0100`).
     */
    name: string;
    skillName: string;
    turnsElapsed: number;
    turnsStated: number;
    state: ChargedSkillState;
    colour: Colour;
    sideRelation: SideRelation;
}

/**
 * What the window may say under `Teraz`: the turn the game is numbering, or which of the three
 * states leaves it with none to say. `develop ADR 0072`.
 */
export const STANDING_TURN_STATE = {
    held: "held",
    unread: "unread",
    afterFight: "afterFight",
    onAuto: "onAuto",
} as const;
export type StandingTurnState = VocabularyWord<typeof STANDING_TURN_STATE>;

/**
 * Why the window has no live reading to draw: no fight has arrived, a kept fight stands on the
 * panel but none is going on, or one arrived and its reading would not compose. Never "no fight
 * yet" for the last two, which the panel beside it would contradict.
 */
export const HELPER_ABSENCE = {
    noFightYet: "noFightYet",
    betweenFights: "betweenFights",
    fightUnread: "fightUnread",
} as const;
export type HelperAbsence = VocabularyWord<typeof HELPER_ABSENCE>;

/** What the fight says about the turn in hand, which is more than the statement itself. */
export interface StandingTurn {
    statement: TurnStatement | null;
    isOver: boolean;
    isOnAuto: boolean;
}

/** Whoever the game is numbering a turn for: a person, so drawn as one wherever they stand. */
export interface StandingHolder {
    name: string;
    colour: Colour;
    sideRelation: SideRelation;
}

export interface HelperContent {
    turnState: StandingTurnState;
    turnOrdinal: number | null;
    /** Null where the payload numbered a turn for nobody the roster holds. */
    turnHolder: StandingHolder | null;
    /** Whom a shout is holding. Its own section: one row per cast, the held under it. */
    provocations: StandingProvocation[];
    /** What is being made ready, and what became of it. Empty draws no section at all. */
    chargedSkills: StandingChargedSkill[];
    /**
     * A charge the band cannot draw as the game states it, carried out so the entry turns it into a
     * defect (**E12**): `isChargedSkillUndrawable` says which.
     */
    hasFiguresDisagreed: boolean;
}

/**
 * Every character on the board, because **both sides may be shouting and nobody is held twice**:
 * a later shout replaces whatever held somebody (`develop ADR 0062`), so the most that can stand at
 * once is one row each. The corpus cannot show it, and a fabricated ten-a-side stands 20 at once.
 */
export const PROVOKED_MAXIMUM = COMBATANTS_MAXIMUM;
/**
 * The bound `core/charged-skill.ts` asserts: one charge a combatant.
 *
 * Every row this window draws carries a card, so the band joins the arithmetic
 * `tests/ui/share-bound.test.ts` holds the card register to (`develop ADR 0100`).
 */
export const CHARGED_ROWS_MAXIMUM = CHARGED_SKILLS_MAXIMUM;
/**
 * A clamp on a figure the game hands us: the dots a charge's row draws, one a turn. Measured over
 * `captures/` through `readPayloadEnvelope` on 2026-10-06: its 37 recordings state 380 charges,
 * running one to four turns, and eight is twice the longest. A charge past it draws eight dots,
 * and an ended one has no counter beside them to state it whole, so the clamp binding is a defect
 * (**S11**).
 */
export const CHARGED_PIPS_MAXIMUM = 8;

export function presentHelper(
    provocations: readonly ProvocationStanding[],
    chargedSkills: readonly ChargedSkillStanding[],
    roster: CombatantRoster,
    readerSide: number | null,
    turn: StandingTurn,
): HelperContent {
    // Clamped before the fold, so the whole section stays inside the one stated bound and the
    // groups are bounded by what is left of it (**S11**).
    const provocationsBounded = provocations.slice(0, PROVOKED_MAXIMUM);
    const now = getStandingTurnNow(turn);
    const holder = now === null ? undefined : roster.byId.get(now.combatantId);
    return {
        turnState: getStandingTurnState(turn, holder !== undefined),
        turnOrdinal: now?.ordinal ?? null,
        turnHolder: holder === undefined ? null : {
            name: holder.name,
            colour: lookupColourForProfession(holder.profession),
            sideRelation: getSideRelation(holder.side, readerSide),
        },
        provocations: presentStandingProvocations(provocationsBounded, roster, readerSide),
        chargedSkills: presentStandingChargedSkills(chargedSkills, roster, readerSide),
        hasFiguresDisagreed: chargedSkills.some((standing) => isChargedSkillUndrawable(standing)),
    };
}

/**
 * A charge with no name, which core never hands over and the band passes over rather than drawing
 * as a blank row; or one stating more turns than the dots its row draws.
 */
function isChargedSkillUndrawable(standing: Readonly<ChargedSkillStanding>): boolean {
    if (standing.skillName.length === 0) return true;
    return standing.turnsStated > CHARGED_PIPS_MAXIMUM;
}

/**
 * The turn the game is numbering **now**, which is none once it has stopped numbering: a fight that
 * is over numbers nobody's (`develop ADR 0066`) and neither does one the game is running itself,
 * where the statement standing is one from before it started (`develop ADR 0072`).
 */
function getStandingTurnNow(turn: StandingTurn): TurnStatement | null {
    if (turn.isOnAuto) return null;
    if (turn.isOver) return null;
    return turn.statement;
}

/**
 * Which sentence the window has to say. A fight the game is running itself outranks one that has
 * ended, because both are true of every fight fought on the auto key and only the first says why
 * there is no turn to draw. `develop ADR 0072`.
 */
function getStandingTurnState(turn: StandingTurn, hasHolder: boolean): StandingTurnState {
    if (turn.isOnAuto) return STANDING_TURN_STATE.onAuto;
    if (turn.isOver) return STANDING_TURN_STATE.afterFight;
    if (hasHolder) return STANDING_TURN_STATE.held;
    return STANDING_TURN_STATE.unread;
}

/**
 * The held folded under whoever is holding them, in the order the fight named them — so a group
 * does not move under the hand as the next cast lands.
 *
 * ⚠️ **The fold is the panel's and the keying stays the core's.** `core/aura-standing.ts` keys a
 * provocation by the character it holds, so every entry handed here is an already-settled pair and
 * a character cannot arrive twice. That is what keeps this clear of the alternative
 * `develop ADR 0062` rejected. `develop ADR 0067`.
 *
 * ⚠️ **The fold takes the cast and not the caster**, because the group is drawn under the shout's
 * name: one caster shouting both of them would otherwise be one group under one name, and the name
 * would be wrong for half of it. No moment in `captures/` shows that, so what this holds is
 * the label rather than a reading anything has seen go wrong. `develop ADR 0097`.
 */
function presentStandingProvocations(
    provocations: readonly ProvocationStanding[],
    roster: CombatantRoster,
    readerSide: number | null,
): StandingProvocation[] {
    const byCast = new Map<string, StandingProvocation>();
    for (const standing of provocations) {
        const caster = roster.byId.get(standing.casterId);
        const key = `${standing.casterId}/${standing.skillId}`;
        const group = byCast.get(key) ?? {
            casterId: standing.casterId,
            casterName: caster?.name ?? PANEL_WORDS.withoutActor,
            skillId: standing.skillId,
            skillName: standing.skillName,
            casterColour: lookupColourForProfession(caster?.profession ?? null),
            casterSideRelation: getSideRelation(caster?.side ?? null, readerSide),
            provoked: [],
        };
        group.provoked.push(presentStandingProvoked(standing, roster, readerSide));
        byCast.set(key, group);
    }
    return [...byCast.values()];
}

/** A provoked character is a person, so their row wears their own profession's hue. */
function presentStandingProvoked(
    standing: ProvocationStanding,
    roster: CombatantRoster,
    readerSide: number | null,
): StandingProvoked {
    const provoked = roster.byId.get(standing.provokedId);
    return {
        provokedId: standing.provokedId,
        name: provoked?.name ?? PANEL_WORDS.withoutTarget,
        colour: lookupColourForProfession(provoked?.profession ?? null),
        sideRelation: getSideRelation(provoked?.side ?? null, readerSide),
        turnsElapsed: standing.turnsElapsed,
        turnsStated: standing.turnsStated,
    };
}

function presentStandingChargedSkills(
    standings: readonly ChargedSkillStanding[],
    roster: CombatantRoster,
    readerSide: number | null,
): StandingChargedSkill[] {
    const composed: StandingChargedSkill[] = [];
    for (const standing of standings) {
        if (composed.length >= CHARGED_ROWS_MAXIMUM) break;
        if (standing.skillName.length === 0) continue;
        composed.push(presentStandingChargedSkill(standing, roster, readerSide));
    }
    return composed;
}

function presentStandingChargedSkill(
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
        sideRelation: getSideRelation(combatant?.side ?? null, readerSide),
    };
}

/**
 * The hue a charge is drawn in. Only one that is still running wears a profession: the two ends
 * are drawn quiet, so the row reads as something that has stopped happening without the colour
 * having to carry that by itself (**The Colour Never Alone Rule**).
 */
function getColourForCharge(state: ChargedSkillState, profession: string | null): Colour {
    if (state !== CHARGED_SKILL_STATE.charging) return SIGNAL.unknown;
    return lookupColourForProfession(profession);
}
