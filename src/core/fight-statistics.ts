/**
 * The figures a panel draws, and nothing a panel could compute for itself.
 *
 * Raw and applied are kept apart: their difference is not what a defence stopped, and adding one
 * to the other would total a blow twice. What the log ties to nobody is kept apart too, so a
 * reader can see the size of what could not be placed instead of finding it folded into a row.
 */

import { assert } from "@std/assert";
import type {
    AnnouncedSkill,
    AttackEvent,
    BattleEvent,
    DamageFigure,
} from "@/src/core/battle-event.ts";
import type { TeamHeal } from "@/src/core/combatant-health.ts";
import {
    CRITICAL_PROC_KEYS,
    getProcEnd,
    SELF_SOURCED_HEALING_KEYS,
} from "@/src/core/fight-decoder.ts";

/** A side holds at most ten, so a fight holds twenty. The largest in `captures/` is 11. */
const MAXIMUM_COMBATANTS = 20;

/** A figure cut by something the protocol named: an element, or the other end of the blow. */
export type FigureCut = ReadonlyMap<string, number>;

/**
 * The count is the announcement's own: only a `skill-used` message states one, and a blow that
 * carries the announcement is that same use rather than a second. Nothing counts a blow nobody
 * announced as a use of anything.
 */
export interface SkillFigures {
    /** As the announcement wrote it. The key is the name, because an id is not always stated. */
    name: string;
    uses: number;
    dealt: number;
    dealtByOpponent: Map<string, number>;
    /** What it put back, and into whom: one announcement can do both, and each is counted once. */
    restored: number;
    restoredByOpponent: Map<string, number>;
}

export interface CombatantFigures {
    damageDealtRaw: number;
    damageDealtApplied: number;
    damageTakenRaw: number;
    damageTakenApplied: number;
    damagePrevented: number;
    healthRestored: number;
    /**
     * Health this combatant put back, into anybody — themselves included, because a key the help
     * calls the subject's own is healing that combatant gave and there is nobody else to charge.
     */
    healthGiven: number;
    /**
     * The same applied damage, cut by what it was dealt with and by whom it was dealt to. A cut
     * is the panel's to fold and never to compute: adding one row's figure to another's is a
     * statistic across combatants, and these are one combatant's own.
     */
    /**
     * The same figures, kept apart by which end the protocol left out. A figure charged to a side
     * is charged by the end the game **did** name, so the panel needs to know whose row holds it:
     * these are that row's own share of what the fight-wide counts below hold.
     */
    damageTakenFromNobody: number;
    damageDealtToNobody: number;
    healthRestoredByNobody: number;
    /**
     * Health moving, cut by the other end and by the key it moved under. There is no cut of what
     * a combatant **gave** by key: the keys the protocol names belong to whoever received the
     * health, so charging one to the giver would be wording their row with somebody else's cause.
     */
    healthRestoredByGiver: Map<string, number>;
    healthGivenByReceiver: Map<string, number>;
    healthRestoredBySource: Map<string, number>;
    damageDealtByElement: Map<string, number>;
    damageTakenByElement: Map<string, number>;
    damageDealtByOpponent: Map<string, number>;
    damageTakenByOpponent: Map<string, number>;
    /**
     * The same figures again, cut twice over: by the other end **and** by what the blows carried.
     * A cut of a cut is what an opened pair is, and neither of the two flat cuts above can be
     * folded into it — a panel that multiplied them would be inventing a figure.
     */
    damageDealtByOpponentAndKind: Map<string, Map<string, number>>;
    damageTakenByOpponentAndKind: Map<string, Map<string, number>>;
    /**
     * What this combatant announced, and what came of it. One record per skill rather than one
     * per screen: an announcement is a single event, so a count kept twice would be counted twice.
     */
    skills: Map<string, SkillFigures>;
    /**
     * How many blows they struck, and how many stood behind no announcement. The second is the
     * count the closing row of a skills section states — a figure alone cannot say it.
     */
    blowsStruck: number;
    blowsWithoutSkill: number;
    /**
     * Blows that landed critically, and it counts **blows** rather than the keys they carried: a
     * blow may state `+crit` and `+of_crit` both, and 20 of the 955 critical blows over
     * `captures/` on 2026-08-30 do — so a count of keys would read 975 and overstate the rate a
     * panel divides by `blowsStruck`.
     */
    blowsCritical: number;
    /**
     * The largest single blow at each end, which no sum can be read back out of: two blows of
     * 5,000 and one of 9,000 total the same. The largest in `captures/` is 19,209, 2026-08-30.
     */
    damageDealtBlowLargest: number;
    damageTakenBlowLargest: number;
    /**
     * What fired beside a blow, kept apart by which end of it this combatant stood at — striking,
     * or struck. Which end a key belongs to is `docs/protocol-keys.md`'s to say and the decoder's
     * to state (`PROC_ENDS`); a key that document refuses an end reaches neither map.
     */
    procsWhenStriking: Map<string, number>;
    procsWhenStruck: Map<string, number>;
    /**
     * The same `damagePrevented`, cut by the defence that stopped it. The scalar stays: the cut
     * is what a card draws and the sum is what a counter states, and an assertion holds the two
     * together rather than leaving a reader to add the rows up and hope.
     */
    damagePreventedByDefence: Map<string, number>;
    /**
     * What their blows destroyed on whoever took them. **Never totalled**, in this file or above
     * it: `+acdmg` counts points of armour and `+resdmg` percentage points of resistance, and one
     * number over both would be two quantities under one word (`src/core/battle-event.ts`).
     */
    statisticsDestroyed: Map<string, number>;
}

/**
 * How the fight ended, as the protocol states it: the two sides by name, and the draw it states
 * by naming nobody. Both lists rather than one, because which of them holds the reader is what
 * decides the word — and a fight naming one side says nothing about who was on the other.
 */
export interface FightOutcome {
    wonNames: string[];
    lostNames: string[];
    isDrawn: boolean;
}

export interface FightStatistics {
    byCombatantId: ReadonlyMap<number, CombatantFigures>;
    /**
     * The fight's own sums. Here rather than left to a panel, because adding one row's figure to
     * another's is a statistic across combatants and the panel draws rather than aggregates.
     */
    totals: CombatantFigures;
    dealtByNobody: number;
    takenByNobody: number;
    /** Restored health no giver could be read for: 9.4% of it over `captures/`, 2026-08-29. */
    givenByNobody: number;
    /**
     * What the protocol named **neither** end of, which is the one figure no side can be charged
     * with: it is inside `dealtByNobody` and `takenByNobody` both, and on nobody's row.
     */
    byNeitherEnd: number;
    /** Messages the decoder could not read, which is what makes a total suspect. */
    unreadMessages: number;
    /** Casts stated about a side that nobody could size onto its members, whole or in part. */
    castsUnplaced: number;
    /** Null until the game says the fight is over, which it may never do on a fight left early. */
    outcome: FightOutcome | null;
}

export function composeCombatantFigures(): CombatantFigures {
    return {
        damageDealtRaw: 0,
        damageDealtApplied: 0,
        damageTakenRaw: 0,
        damageTakenApplied: 0,
        damagePrevented: 0,
        healthRestored: 0,
        healthGiven: 0,
        damageTakenFromNobody: 0,
        damageDealtToNobody: 0,
        healthRestoredByNobody: 0,
        healthRestoredByGiver: new Map(),
        healthGivenByReceiver: new Map(),
        healthRestoredBySource: new Map(),
        damageDealtByElement: new Map(),
        damageTakenByElement: new Map(),
        damageDealtByOpponent: new Map(),
        damageTakenByOpponent: new Map(),
        damageDealtByOpponentAndKind: new Map(),
        damageTakenByOpponentAndKind: new Map(),
        skills: new Map(),
        blowsStruck: 0,
        blowsWithoutSkill: 0,
        blowsCritical: 0,
        damageDealtBlowLargest: 0,
        damageTakenBlowLargest: 0,
        procsWhenStriking: new Map(),
        procsWhenStruck: new Map(),
        damagePreventedByDefence: new Map(),
        statisticsDestroyed: new Map(),
    };
}

/** The largest cut in `captures/` holds ten elements against twenty combatants, 2026-08-28. */
const MAXIMUM_CUT = 64;
/** Past every key `PROC_ENDS` holds; the most one blow fires in `captures/` is 3, 2026-08-30. */
const MAXIMUM_PROCS = 32;
/** 81 skills are named across `captures/`, 2026-08-29, and one fight states a fraction of them. */
const MAXIMUM_SKILLS = 256;

function addToCut(cut: Map<string, number>, key: string, amount: number): void {
    assert(key.length > 0, "a cut is kept under a name");
    assert(cut.size <= MAXIMUM_CUT, "a cut stays inside its stated bound");
    cut.set(key, (cut.get(key) ?? 0) + amount);
}

function addToPairCut(
    cut: Map<string, Map<string, number>>,
    other: string,
    figures: readonly DamageFigure[],
): void {
    assert(other.length > 0, "the other end of a blow is named before it is cut by");
    assert(cut.size <= MAXIMUM_COMBATANTS, "a fight cuts by the people who are in it");
    const held = cut.get(other) ?? new Map<string, number>();
    for (const figure of figures) addToCut(held, figure.element, figure.amount);
    cut.set(other, held);
}

/**
 * A skill is kept under its **name** rather than its id: 346 of the 3,349 announcements over
 * `captures/` on 2026-08-29 carry no id at all, and a row keyed by nothing is a row that would
 * merge two skills the game tells apart.
 */
function getSkillFigures(skills: Map<string, SkillFigures>, name: string): SkillFigures {
    assert(name.length > 0, "a skill is kept under the name it was announced by");
    const held = skills.get(name) ?? {
        name,
        uses: 0,
        dealt: 0,
        dealtByOpponent: new Map(),
        restored: 0,
        restoredByOpponent: new Map(),
    };
    skills.set(name, held);
    assert(skills.size <= MAXIMUM_SKILLS, "a fight states no more skills than it is bounded to");
    return held;
}

function addSkillDealt(
    skills: Map<string, SkillFigures>,
    announced: AnnouncedSkill,
    amount: number,
    other: string | null,
): void {
    assert(amount >= 0, "what a blow lands is never below nothing");
    assert(announced.skillName.length > 0, "and the announcement in front of it is named");
    const held = getSkillFigures(skills, announced.skillName);
    held.dealt += amount;
    if (other !== null) addToCut(held.dealtByOpponent, other, amount);
}

function addSkillRestored(
    build: StatisticsBuild,
    announced: AnnouncedSkill,
    amount: number,
    healedId: number | null,
): void {
    assert(amount >= 0, "restored health is never below nothing");
    assert(announced.skillName.length > 0, "and the announcement behind it is named");
    if (announced.actorId === null) return;
    const skills = getFiguresForCombatant(build.byCombatantId, announced.actorId).skills;
    const held = getSkillFigures(skills, announced.skillName);
    held.restored += amount;
    if (healedId !== null) addToCut(held.restoredByOpponent, `${healedId}`, amount);
}

/** The count an announcement states, which a blow carrying that announcement does not repeat. */
function addSkillUse(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== "skill-used") return;
    if (event.actorId === null) return;
    assert(event.skillName.length > 0, "an announcement names the skill it announces");
    const skills = getFiguresForCombatant(build.byCombatantId, event.actorId).skills;
    const held = getSkillFigures(skills, event.skillName);
    held.uses += 1;
    assert(held.uses > 0, "an announcement that was counted was counted at least once");
}

function getTotalFromFigures(figures: readonly DamageFigure[]): number {
    let total = 0;
    for (const figure of figures) {
        assert(Number.isSafeInteger(figure.amount), "a figure totalled is a whole number");
        total += figure.amount;
    }
    assert(Number.isSafeInteger(total), "a total stays inside what a number holds exactly");
    return total;
}

function getFiguresForCombatant(
    byCombatantId: Map<number, CombatantFigures>,
    combatantId: number,
): CombatantFigures {
    assert(Number.isSafeInteger(combatantId), "a row belongs to an id that was read");
    const held = byCombatantId.get(combatantId);
    if (held !== undefined) return held;
    assert(byCombatantId.size < MAXIMUM_COMBATANTS, "a fight stays inside its stated bound");
    const figures = composeCombatantFigures();
    byCombatantId.set(combatantId, figures);
    return figures;
}

interface StatisticsBuild {
    byCombatantId: Map<number, CombatantFigures>;
    castsUnplaced: number;
    dealtByNobody: number;
    takenByNobody: number;
    givenByNobody: number;
    byNeitherEnd: number;
    unreadMessages: number;
    outcome: FightOutcome | null;
}

/**
 * How the fight ended, as it arrives: one message names the winners and another the losers, and a
 * draw is the winners' key naming nobody. A later statement replaces an earlier one on its own
 * side and leaves the other standing, because the two are separate claims about one fight.
 */
function addFightOutcome(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== "fight-outcome") return;
    const held = build.outcome ?? { wonNames: [], lostNames: [], isDrawn: false };
    assert(event.combatantNames.every((one) => one.length > 0), "a side named is named in full");
    if (event.result === "drawn") build.outcome = { ...held, isDrawn: true };
    if (event.result === "won") build.outcome = { ...held, wonNames: [...event.combatantNames] };
    if (event.result === "lost") build.outcome = { ...held, lostNames: [...event.combatantNames] };
    assert(build.outcome !== null, "a fight that stated its end holds one");
}

/** The other end of a blow as a cut is keyed, or null where the protocol named nobody. */
function getOtherEndKey(targetId: number | null): string | null {
    if (targetId === null) return null;
    assert(Number.isSafeInteger(targetId), "an end the protocol named is named by a number");
    assert(`${targetId}`.length > 0, "and a cut is kept under it as text");
    return `${targetId}`;
}

/**
 * What fired beside the blow, on the row of whoever it belongs to. A key `PROC_ENDS` calls
 * `unsettled` reaches neither row: whose it is has not been established, and a row charged with one
 * would be this file guessing (`docs/protocol-keys.md`).
 */
function addBlowProcs(
    striker: CombatantFigures | null,
    struck: CombatantFigures | null,
    procs: readonly string[],
): void {
    assert(procs.length <= MAXIMUM_PROCS, "a blow fires no more procs than it is bounded to");
    for (const key of procs) {
        const end = getProcEnd(key);
        assert(end !== null, "a proc the decoder stated is a proc this table places");
        if (end === "actor") {
            if (striker !== null) addToCut(striker.procsWhenStriking, key, 1);
        }
        if (end === "target") {
            if (struck !== null) addToCut(struck.procsWhenStruck, key, 1);
        }
    }
}

/** Blows, not keys: 20 of the 955 critical blows over `captures/` state both keys, 2026-08-30. */
function getIsBlowCritical(procs: readonly string[]): boolean {
    assert(procs.length <= MAXIMUM_PROCS, "a blow fires no more procs than it is bounded to");
    for (const key of procs) {
        if (CRITICAL_PROC_KEYS.includes(key)) return true;
    }
    return false;
}

/**
 * What the blow put out at its hardest, which is the one reading a total cannot be read back to:
 * two blows of five thousand and one of nine total the same and are not the same fight.
 */
function getLargerBlow(standing: number, applied: number): number {
    assert(standing >= 0, "the hardest blow so far landed no less than nothing");
    assert(applied >= 0, "and neither did the one being weighed against it");
    if (applied > standing) return applied;
    return standing;
}

/**
 * Everything a blow says about the combatant who **struck** it, beyond the damage itself.
 * `+acdmg` counts points and `+resdmg` percentage points, so the cut is kept and never totalled.
 */
function addBlowStruck(striker: CombatantFigures, event: AttackEvent, applied: number): void {
    assert(applied >= 0, "a blow lands no less than nothing");
    assert(event.destroyed.length <= MAXIMUM_CUT, "and destroys inside its stated bound");
    striker.damageDealtBlowLargest = getLargerBlow(striker.damageDealtBlowLargest, applied);
    if (getIsBlowCritical(event.procs)) striker.blowsCritical += 1;
    for (const destroyed of event.destroyed) {
        addToCut(striker.statisticsDestroyed, destroyed.statistic, destroyed.amount);
    }
}

/**
 * The same for the combatant who **took** it: what stopped part of the blow, kept both as the sum
 * a counter states and as the cut a card draws, so neither can drift from the other.
 */
function addBlowTaken(struck: CombatantFigures, event: AttackEvent, applied: number): void {
    assert(applied >= 0, "a blow lands no less than nothing");
    assert(event.prevented.length <= MAXIMUM_CUT, "and is stopped inside its stated bound");
    struck.damageTakenBlowLargest = getLargerBlow(struck.damageTakenBlowLargest, applied);
    for (const stopped of event.prevented) {
        struck.damagePrevented += stopped.amount;
        addToCut(struck.damagePreventedByDefence, stopped.defence, stopped.amount);
    }
}

function addAttackEvent(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== "attack") return;
    const raw = getTotalFromFigures(event.raw);
    const applied = getTotalFromFigures(event.applied);
    assert(raw >= 0, "a blow puts out no less than nothing");
    assert(applied >= 0, "and lands no less than nothing");
    if (event.actorId === null) build.dealtByNobody += applied;
    else {
        const dealer = getFiguresForCombatant(build.byCombatantId, event.actorId);
        dealer.damageDealtRaw += raw;
        dealer.damageDealtApplied += applied;
        dealer.blowsStruck += 1;
        if (event.announced === null) dealer.blowsWithoutSkill += 1;
        else addSkillDealt(dealer.skills, event.announced, applied, getOtherEndKey(event.targetId));
        for (const figure of event.applied) {
            addToCut(dealer.damageDealtByElement, figure.element, figure.amount);
        }
        if (event.targetId !== null) {
            addToCut(dealer.damageDealtByOpponent, `${event.targetId}`, applied);
            addToPairCut(dealer.damageDealtByOpponentAndKind, `${event.targetId}`, event.applied);
        }
        addBlowStruck(dealer, event, applied);
    }
    if (event.targetId === null) {
        addBlowProcs(getStrikerFigures(build, event.actorId), null, event.procs);
        addBlowWithNoTarget(build, event.actorId, applied);
        return;
    }
    const target = getFiguresForCombatant(build.byCombatantId, event.targetId);
    if (event.actorId === null) target.damageTakenFromNobody += applied;
    target.damageTakenRaw += raw;
    target.damageTakenApplied += applied;
    for (const figure of event.applied) {
        addToCut(target.damageTakenByElement, figure.element, figure.amount);
    }
    if (event.actorId !== null) {
        addToCut(target.damageTakenByOpponent, `${event.actorId}`, applied);
        addToPairCut(target.damageTakenByOpponentAndKind, `${event.actorId}`, event.applied);
    }
    addBlowTaken(target, event, applied);
    addBlowProcs(getStrikerFigures(build, event.actorId), target, event.procs);
    assert(target.damageTakenApplied >= 0, "a total of applied damage never falls below nothing");
}

/** The row the blow was struck from, or nothing where the protocol named nobody at that end. */
function getStrikerFigures(
    build: StatisticsBuild,
    actorId: number | null,
): CombatantFigures | null {
    if (actorId === null) return null;
    assert(Number.isSafeInteger(actorId), "an end the protocol named is named by a number");
    assert(build.byCombatantId.size <= MAXIMUM_COMBATANTS, "a fight stays inside its stated bound");
    return getFiguresForCombatant(build.byCombatantId, actorId);
}

/**
 * Already reduced where it is stated, so it has no raw half to keep apart from.
 *
 * It weighs into the hardest blow at both ends and into no count of blows at either. A figure
 * stated against a name is a landing, and for a party fighting a boss with an area attack it is
 * the **only** landing anybody records: of the 249 rows that took damage over `captures/` on
 * 2026-08-30, 149 are named by nothing else, and a card reading off blows alone would leave the
 * whole party's hardest hit blank. What it is not is a swing — `blowsStruck` counts what the
 * protocol calls a blow, and this is damage riding one aimed at somebody else.
 */
function addNamedDamageEvent(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== "damage-to-named-combatant") return;
    const amount = event.damage.amount;
    assert(Number.isSafeInteger(amount), "a figure totalled is a whole number");
    assert(amount >= 0, "damage stated against a name is never below nothing");
    if (event.actorId === null) build.dealtByNobody += amount;
    else {
        const dealer = getFiguresForCombatant(build.byCombatantId, event.actorId);
        dealer.damageDealtApplied += amount;
        dealer.damageDealtBlowLargest = getLargerBlow(dealer.damageDealtBlowLargest, amount);
        addToCut(dealer.damageDealtByElement, event.damage.element, amount);
        if (event.targetId !== null) {
            addToCut(dealer.damageDealtByOpponent, `${event.targetId}`, amount);
            addToPairCut(dealer.damageDealtByOpponentAndKind, `${event.targetId}`, [event.damage]);
        }
    }
    if (event.targetId === null) {
        addBlowWithNoTarget(build, event.actorId, amount);
        return;
    }
    const target = getFiguresForCombatant(build.byCombatantId, event.targetId);
    if (event.actorId === null) target.damageTakenFromNobody += amount;
    target.damageTakenApplied += amount;
    target.damageTakenBlowLargest = getLargerBlow(target.damageTakenBlowLargest, amount);
    addToCut(target.damageTakenByElement, event.damage.element, amount);
    if (event.actorId !== null) {
        addToCut(target.damageTakenByOpponent, `${event.actorId}`, amount);
        addToPairCut(target.damageTakenByOpponentAndKind, `${event.actorId}`, [event.damage]);
    }
}

/**
 * Who put the health back: whoever announced it, or the one healed where the key is theirs on the
 * published help's word. Null everywhere else — 353,990 of the 3,755,729 points restored across
 * `captures/` on 2026-08-29, all of it `heal_target` and `bandage` that nothing announced, and the
 * reason the panel draws a row for what no giver can be read for.
 */
function getGiverId(
    source: string,
    healedId: number | null,
    announced: AnnouncedSkill | null,
): number | null {
    assert(source.length > 0, "restored health names the key it was stated on");
    if (announced !== null) {
        if (announced.actorId !== null) return announced.actorId;
    }
    if (!SELF_SOURCED_HEALING_KEYS.includes(source)) return null;
    return healedId;
}

/**
 * The giving half of one movement, kept beside the receiving half so the two cannot drift. Where
 * no giver can be read the receiver's own row keeps the amount as well, because that row is the
 * end the protocol **did** name — and the end it named is the only thing a side may be read from.
 */
function addGivenHealth(
    build: StatisticsBuild,
    giverId: number | null,
    amount: number,
    healedId: number | null,
): void {
    assert(amount >= 0, "restored health is never below nothing");
    if (healedId !== null && giverId !== null) {
        const healed = getFiguresForCombatant(build.byCombatantId, healedId);
        addToCut(healed.healthRestoredByGiver, `${giverId}`, amount);
    }
    if (giverId === null) {
        build.givenByNobody += amount;
        assert(build.givenByNobody >= amount, "a total only grows by what it was handed");
        if (healedId === null) return;
        getFiguresForCombatant(build.byCombatantId, healedId).healthRestoredByNobody += amount;
        return;
    }
    const giver = getFiguresForCombatant(build.byCombatantId, giverId);
    giver.healthGiven += amount;
    if (healedId !== null) addToCut(giver.healthGivenByReceiver, `${healedId}`, amount);
}

/** What put the health back, on the row it was put back on: the key, as the protocol wrote it. */
function addRestoredSource(
    build: StatisticsBuild,
    healedId: number | null,
    source: string,
    amount: number,
): void {
    assert(amount >= 0, "restored health is never below nothing");
    assert(source.length > 0, "and comes under a key the protocol named");
    if (healedId === null) return;
    const healed = getFiguresForCombatant(build.byCombatantId, healedId);
    addToCut(healed.healthRestoredBySource, source, amount);
}

/**
 * A blow the protocol found no target for. Where it names no actor either, nobody's row holds it
 * and no side can be charged with it: it is counted apart rather than folded into either count.
 */
function addBlowWithNoTarget(build: StatisticsBuild, actorId: number | null, amount: number): void {
    assert(amount >= 0, "a blow lands no less than nothing");
    build.takenByNobody += amount;
    if (actorId === null) {
        build.byNeitherEnd += amount;
        return;
    }
    getFiguresForCombatant(build.byCombatantId, actorId).damageDealtToNobody += amount;
}

/** Health moving outside a blow. What restored it is the key, and the key says who gave it. */
function addHealthChangeEvent(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== "health-change") return;
    assert(Number.isSafeInteger(event.amount), "a movement totalled is a whole number");
    if (event.combatantId === null) {
        if (event.amount >= 0) return;
        build.takenByNobody += -event.amount;
        build.dealtByNobody += -event.amount;
        build.byNeitherEnd += -event.amount;
        return;
    }
    const figures = getFiguresForCombatant(build.byCombatantId, event.combatantId);
    if (event.amount >= 0) {
        figures.healthRestored += event.amount;
        addRestoredSource(build, event.combatantId, event.source, event.amount);
        if (event.announced !== null) {
            addSkillRestored(build, event.announced, event.amount, event.combatantId);
        }
        addGivenHealth(
            build,
            getGiverId(event.source, event.combatantId, event.announced),
            event.amount,
            event.combatantId,
        );
        return;
    }
    figures.damageTakenApplied += -event.amount;
    figures.damageTakenFromNobody += -event.amount;
    // The key is what this movement was made of, so it joins the cut a blow's element joins: a
    // tick of poison is a kind of damage taken, and leaving it out states a figure the cut under
    // it cannot account for.
    addToCut(figures.damageTakenByElement, event.source, -event.amount);
    build.dealtByNobody += -event.amount;
    assert(figures.healthRestored >= 0, "a total of health restored never falls below nothing");
}

function addNamedHealingEvent(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== "healing-to-named-combatant") return;
    assert(event.amount >= 0, "healing restored is never below nothing");
    if (event.targetId === null) return;
    const figures = getFiguresForCombatant(build.byCombatantId, event.targetId);
    figures.healthRestored += event.amount;
    addRestoredSource(build, event.targetId, event.source, event.amount);
    // No announcement to ask: this figure rides a blow struck at somebody else, so the message's
    // own actor is the attacker rather than the healer.
    addGivenHealth(
        build,
        getGiverId(event.source, event.targetId, null),
        event.amount,
        event.targetId,
    );
    assert(figures.healthRestored >= event.amount, "a total only grows by what it was handed");
}

/**
 * What a cast put back, per member. A cast nobody could size, or one sized for only part of its
 * side, is counted as unplaced as well — a partial answer is never read as a whole one.
 */
function addTeamHeal(build: StatisticsBuild, heal: TeamHeal | undefined): void {
    if (heal === undefined) {
        build.castsUnplaced += 1;
        return;
    }
    if (!heal.isWhole) build.castsUnplaced += 1;
    for (const [combatantId, amount] of heal.restoredByCombatantId) {
        assert(amount >= 0, "a cast puts back no less than nothing");
        getFiguresForCombatant(build.byCombatantId, combatantId).healthRestored += amount;
        addRestoredSource(build, combatantId, heal.source, amount);
        // The one healing shape whose giver the protocol states outright: the caster stands in
        // the message's actor slot, and the recipients are what the sizing worked out.
        addGivenHealth(build, heal.casterId, amount, combatantId);
    }
    assert(build.castsUnplaced >= 0, "a count of casts never falls below nothing");
}

function composeTotals(build: StatisticsBuild): CombatantFigures {
    const totals = composeCombatantFigures();
    for (const figures of build.byCombatantId.values()) {
        totals.damageDealtRaw += figures.damageDealtRaw;
        totals.damageDealtApplied += figures.damageDealtApplied;
        totals.damageTakenRaw += figures.damageTakenRaw;
        totals.damageTakenApplied += figures.damageTakenApplied;
        totals.damagePrevented += figures.damagePrevented;
        totals.healthRestored += figures.healthRestored;
        totals.healthGiven += figures.healthGiven;
    }
    assert(totals.damageDealtApplied >= 0, "a total of applied damage never falls below nothing");
    assert(totals.healthRestored >= 0, "and neither does a total of health restored");
    return totals;
}

/**
 * Applied damage is stated once and lands twice — on whoever dealt it and on whoever took it —
 * so the two sides must come out equal, with what the log tied to nobody standing in on either.
 */
function getAppliedBalance(build: StatisticsBuild): number {
    let dealt = build.dealtByNobody;
    let taken = build.takenByNobody;
    for (const figures of build.byCombatantId.values()) {
        dealt += figures.damageDealtApplied;
        taken += figures.damageTakenApplied;
    }
    assert(Number.isSafeInteger(dealt), "a total stays inside what a number holds exactly");
    assert(Number.isSafeInteger(taken), "a total stays inside what a number holds exactly");
    return dealt - taken;
}

/**
 * The same equation on the other quantity: health put back is stated once and lands twice, on
 * whoever gave it and on whoever received it, with what no key names a giver for standing in.
 */
function getRestoredBalance(build: StatisticsBuild): number {
    let restored = 0;
    let given = build.givenByNobody;
    for (const figures of build.byCombatantId.values()) {
        restored += figures.healthRestored;
        given += figures.healthGiven;
    }
    assert(Number.isSafeInteger(restored), "a total stays inside what a number holds exactly");
    assert(Number.isSafeInteger(given), "a total stays inside what a number holds exactly");
    return restored - given;
}

/**
 * What the defences stopped, against the one number a counter states for the lot. The cut and the
 * sum are written on the same blow and read in two different places, so nothing but this holds them
 * to each other — and a card whose rows added to something else would be a card nobody can check.
 */
function getPreventedBalance(build: StatisticsBuild): number {
    let apart = 0;
    for (const figures of build.byCombatantId.values()) {
        let cut = 0;
        for (const amount of figures.damagePreventedByDefence.values()) cut += amount;
        assert(Number.isSafeInteger(cut), "a total stays inside what a number holds exactly");
        apart += Math.abs(figures.damagePrevented - cut);
    }
    assert(apart >= 0, "a difference counted as a distance is never below nothing");
    return apart;
}

/**
 * What the fight-wide counts hold, against what the rows they were read off hold.
 *
 * Each of the three is the sum of one field across the rows plus what named neither end, and
 * nothing else — which is what lets a side be charged from the row rather than from the count.
 * A figure reaching one and not the other would be a figure charged to nobody or to everybody.
 */
function getHalfNamedBalance(build: StatisticsBuild): number {
    let takenFromNobody = 0;
    let dealtToNobody = 0;
    let restoredByNobody = 0;
    for (const figures of build.byCombatantId.values()) {
        takenFromNobody += figures.damageTakenFromNobody;
        dealtToNobody += figures.damageDealtToNobody;
        restoredByNobody += figures.healthRestoredByNobody;
    }
    assert(build.byNeitherEnd >= 0, "what names neither end is never below nothing");
    const dealt = build.dealtByNobody - takenFromNobody - build.byNeitherEnd;
    const taken = build.takenByNobody - dealtToNobody - build.byNeitherEnd;
    return Math.abs(dealt) + Math.abs(taken) + Math.abs(build.givenByNobody - restoredByNobody);
}

/**
 * The figures, and what a share stated about a side came to once it was sized. The sizing is
 * `combatant-health.ts`'s, because it needs three figures the protocol never states; totalling it
 * is this file's, because a total across combatants is never the panel's.
 */
export function composeFightStatistics(
    events: readonly BattleEvent[],
    heals: ReadonlyMap<BattleEvent, TeamHeal>,
): FightStatistics {
    const build: StatisticsBuild = {
        byCombatantId: new Map(),
        dealtByNobody: 0,
        takenByNobody: 0,
        givenByNobody: 0,
        byNeitherEnd: 0,
        unreadMessages: 0,
        castsUnplaced: 0,
        outcome: null,
    };
    assert(events.length >= 0, "a fight decodes to a list");
    for (const event of events) {
        if (event.kind === "unknown-message") build.unreadMessages += 1;
        if (event.kind === "unaccounted-health") addTeamHeal(build, heals.get(event));
        addAttackEvent(build, event);
        addNamedDamageEvent(build, event);
        addHealthChangeEvent(build, event);
        addNamedHealingEvent(build, event);
        addFightOutcome(build, event);
        addSkillUse(build, event);
    }
    assert(build.byCombatantId.size <= MAXIMUM_COMBATANTS, "a fight stays inside its bound");
    assert(build.unreadMessages <= events.length, "a message is counted unread once");
    assert(getAppliedBalance(build) === 0, "every point applied is counted once at each end");
    assert(getRestoredBalance(build) === 0, "and every point restored once at each of its own");
    assert(getHalfNamedBalance(build) === 0, "and every half-named point is on the row it named");
    assert(
        getPreventedBalance(build) === 0,
        "and what the defences stopped is stopped by one of them",
    );
    return {
        byCombatantId: build.byCombatantId,
        totals: composeTotals(build),
        dealtByNobody: build.dealtByNobody,
        takenByNobody: build.takenByNobody,
        givenByNobody: build.givenByNobody,
        byNeitherEnd: build.byNeitherEnd,
        unreadMessages: build.unreadMessages,
        castsUnplaced: build.castsUnplaced,
        outcome: build.outcome,
    };
}
