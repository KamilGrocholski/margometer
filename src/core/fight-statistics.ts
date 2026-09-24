/**
 * The figures a panel draws, and nothing a panel could compute for itself (`docs/design.md` §6.5).
 *
 * Raw and applied are kept apart: their difference is not what a defence stopped, and adding one
 * to the other would total a blow twice. What the log ties to nobody is kept apart too, so a reader
 * can see the size of what could not be placed instead of finding it folded into a row.
 */

import { assert } from "@std/assert/assert";
import {
    type AnnouncedSkill,
    type AttackEvent,
    BATTLE_EVENT,
    type BattleEvent,
    type DamageFigure,
    type HealthChangeEvent,
    OUTCOME_RESULT,
    type UnknownMessageEvent,
    UNREAD_CAUSE,
} from "@/src/core/battle-event.ts";
import type { TeamHeal } from "@/src/core/combatant-health.ts";
import { COMBATANTS_MAXIMUM } from "@/src/core/combatant-roster.ts";
import {
    CRITICAL_PROC_KEYS,
    getKeyReading,
    KEY_FAMILY,
    PROC_END,
    SELF_SOURCED_HEALING_KEYS,
    WOUND_ANNOUNCEMENT_KEY,
    WOUND_TICK_KEY,
} from "@/src/core/protocol-key.ts";
import {
    composeTurnStanding,
    lookupTurnOpener,
    NO_TURN_STANDING,
    type TurnStanding,
} from "@/src/core/turn-clock.ts";

/** A figure cut by something the protocol named: an element, or the other end of the blow. */
export type FigureCut = ReadonlyMap<string, number>;

/**
 * The count is the announcement's own: only a `skill-used` message states one, and a blow that
 * carries the announcement is that same use rather than a second.
 */
export interface SkillFigures {
    /** As the announcement wrote it. The key is the name, because an id is not always stated. */
    name: string;
    uses: number;
    dealt: number;
    /** Swings that went out under this announcement, counted the way `blowsStruck` is. */
    blows: number;
    dealtByOpponent: ReadonlyMap<string, number>;
    restored: number;
    restoredByOpponent: ReadonlyMap<string, number>;
}

export interface CombatantFigures {
    damageDealtRaw: number;
    damageDealtApplied: number;
    damageTakenRaw: number;
    damageTakenApplied: number;
    damagePrevented: number;
    healthRestored: number;
    /** Health this combatant put back, into anybody, themselves included. */
    healthGiven: number;
    /** This row's share of what the fight-wide half-named counts hold. */
    damageTakenFromNobody: number;
    damageDealtToNobody: number;
    healthRestoredByNobody: number;
    damageTakenFromNobodyByElement: ReadonlyMap<string, number>;
    damageDealtToNobodyByElement: ReadonlyMap<string, number>;
    healthRestoredByNobodyBySource: ReadonlyMap<string, number>;
    /**
     * There is no flat cut of what a combatant **gave** by key: the keys the protocol names belong
     * to whoever received the health.
     */
    healthRestoredByGiver: ReadonlyMap<string, number>;
    healthGivenByReceiver: ReadonlyMap<string, number>;
    healthRestoredBySource: ReadonlyMap<string, number>;
    /** The part of `healthRestoredBySource` no announcement covered: not in the skills. */
    healthRestoredWithoutSkillBySource: ReadonlyMap<string, number>;
    /** Health lost **outside a blow**, by key (`develop ADR 0080`). */
    damageTakenWithoutSkillBySource: ReadonlyMap<string, number>;
    /** Only a wound reaches it: a tick is charged to who left the wound (`develop ADR 0022`). */
    damageDealtWithoutSkillBySource: ReadonlyMap<string, number>;
    damageDealtWithoutSkillByOpponentAndSource: ReadonlyMap<string, ReadonlyMap<string, number>>;
    /** The blows standing under no announcement, by the other end (`develop ADR 0081`). */
    damageDealtWithoutSkillByOpponent: ReadonlyMap<string, number>;
    damageTakenWithoutSkillByOpponent: ReadonlyMap<string, number>;
    healthGivenWithoutSkillByReceiverAndSource: ReadonlyMap<string, ReadonlyMap<string, number>>;
    damageDealtByElement: ReadonlyMap<string, number>;
    damageTakenByElement: ReadonlyMap<string, number>;
    damageDealtByOpponent: ReadonlyMap<string, number>;
    damageTakenByOpponent: ReadonlyMap<string, number>;
    /** A cut of a cut is what an opened pair is; neither flat cut can be folded into it. */
    damageDealtByOpponentAndKind: ReadonlyMap<string, ReadonlyMap<string, number>>;
    damageTakenByOpponentAndKind: ReadonlyMap<string, ReadonlyMap<string, number>>;
    skills: ReadonlyMap<string, SkillFigures>;
    blowsStruck: number;
    blowsWithoutSkill: number;
    /** Graded against the game's numbering: `develop:docs/turns-taken.md`, `develop ADR 0048`. */
    turnsTaken: number;
    /** Turns granted and spent on nothing, which the game announces itself (`develop ADR 0049`). */
    turnsLost: number;
    /**
     * Blows, not keys: 20 of the 955 critical blows over `develop:captures/` state both keys,
     * 2026-08-30, so a count of keys would overstate the rate.
     */
    blowsCritical: number;
    /**
     * ⚠️ **Not scoped to blows, and no panel draws it**: damage stated against a name raises it too
     * (`develop ADR 0087`, `0088`). The fight file reads it.
     */
    damageDealtBlowLargest: number;
    damageTakenBlowLargest: number;
    /** A key whose end is `unsettled` reaches neither map. */
    procsWhenStriking: ReadonlyMap<string, number>;
    procsWhenStruck: ReadonlyMap<string, number>;
    damagePreventedByDefence: ReadonlyMap<string, number>;
    /** **Never totalled**: points and percentage points, `src/core/battle-event.ts`. */
    statisticsDestroyed: ReadonlyMap<string, number>;
    /**
     * ⚠️ **None of these sums to the count of the same name on `FightStatistics`**: one unread
     * message may name both ends, so it stands on two rows and is one message.
     */
    unreadMessagesUnknownKey: number;
    unreadMessagesNoParameter: number;
    castsUnplaced: number;
}

/** How the fight ended: the two sides by name, and the draw it states by naming nobody. */
export interface FightOutcome {
    wonNames: string[];
    lostNames: string[];
    isDrawn: boolean;
    isFled: boolean;
}

/** Messages the decoder could not read, under each cause (`develop ADR 0070`). */
export interface UnreadMessageCounts {
    unreadMessagesUnknownKey: number;
    unreadMessagesNoParameter: number;
    unreadMessagesGrammarRefused: number;
}

export interface FightStatistics extends UnreadMessageCounts {
    byCombatantId: ReadonlyMap<number, CombatantFigures>;
    /** The fight's own sums, here because a total across combatants is never the panel's. */
    totals: CombatantFigures;
    dealtByNobody: number;
    takenByNobody: number;
    givenByNobody: number;
    /** Restored health whose **receiver** the game did not name (`develop ADR 0082`). */
    restoredToNobody: number;
    /** What the protocol named **neither** end of: in both counts above, and on nobody's row. */
    byNeitherEnd: number;
    byNeitherEndByElement: ReadonlyMap<string, number>;
    castsUnplaced: number;
    /** Every cast stated about a side, sized or not: what the count above is out of. */
    castsStated: number;
    /** Null until the game says the fight is over, which it may never do on a fight left early. */
    outcome: FightOutcome | null;
}

/**
 * The same figures while they are being tallied, derived from the shape a reader is handed and
 * never spelled a second time: two lists of forty fields drift.
 */
type Tallying<Held> = Held extends ReadonlyMap<infer Key, infer Value> ? Map<Key, Tallying<Value>>
    : Held extends number ? number
    : { [Field in keyof Held]: Tallying<Held[Field]> };

type TallyingFigures = Tallying<CombatantFigures>;
type TallyingSkillFigures = Tallying<SkillFigures>;

/** The wound standing against a victim: the freshest overwrites it, so one entry per victim. */
interface WoundStanding {
    attackerId: number;
    amount: number;
}

interface StatisticsBuild extends UnreadMessageCounts {
    byCombatantId: Map<number, TallyingFigures>;
    woundByVictimId: Map<number, WoundStanding>;
    castsUnplaced: number;
    castsStated: number;
    dealtByNobody: number;
    takenByNobody: number;
    givenByNobody: number;
    restoredToNobody: number;
    byNeitherEnd: number;
    byNeitherEndByElement: Map<string, number>;
    turnStanding: TurnStanding;
    outcome: FightOutcome | null;
}

/** The largest cut in `develop:captures/` holds ten elements against twenty people, 2026-08-28. */
const CUT_MAXIMUM = 64;
/** The most one blow fires in `develop:captures/` is 3, 2026-08-30. */
const PROCS_MAXIMUM = 32;
/** 81 skills are named across `develop:captures/`, 2026-08-29. */
const SKILLS_MAXIMUM = 256;

export function countUnreadMessages(counted: UnreadMessageCounts): number {
    const unread = counted.unreadMessagesUnknownKey + counted.unreadMessagesNoParameter +
        counted.unreadMessagesGrammarRefused;
    assert(Number.isSafeInteger(unread), "a count of messages stays inside what a number holds");
    assert(unread >= 0, "and never falls below none");
    return unread;
}

export function initCombatantFigures(): TallyingFigures {
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
        damageTakenFromNobodyByElement: new Map(),
        damageDealtToNobodyByElement: new Map(),
        healthRestoredByNobodyBySource: new Map(),
        healthRestoredByGiver: new Map(),
        healthGivenByReceiver: new Map(),
        healthRestoredBySource: new Map(),
        healthRestoredWithoutSkillBySource: new Map(),
        damageTakenWithoutSkillBySource: new Map(),
        damageDealtWithoutSkillBySource: new Map(),
        damageDealtWithoutSkillByOpponentAndSource: new Map(),
        damageDealtWithoutSkillByOpponent: new Map(),
        damageTakenWithoutSkillByOpponent: new Map(),
        healthGivenWithoutSkillByReceiverAndSource: new Map(),
        damageDealtByElement: new Map(),
        damageTakenByElement: new Map(),
        damageDealtByOpponent: new Map(),
        damageTakenByOpponent: new Map(),
        damageDealtByOpponentAndKind: new Map(),
        damageTakenByOpponentAndKind: new Map(),
        skills: new Map(),
        blowsStruck: 0,
        blowsWithoutSkill: 0,
        turnsTaken: 0,
        turnsLost: 0,
        blowsCritical: 0,
        damageDealtBlowLargest: 0,
        damageTakenBlowLargest: 0,
        procsWhenStriking: new Map(),
        procsWhenStruck: new Map(),
        damagePreventedByDefence: new Map(),
        statisticsDestroyed: new Map(),
        unreadMessagesUnknownKey: 0,
        unreadMessagesNoParameter: 0,
        castsUnplaced: 0,
    };
}

/**
 * The figures, and what a share stated about a side came to once it was sized. The sizing is
 * `combatant-health.ts`'s; the totalling is this file's; the balances are
 * `verifyFightStatistics`'s.
 */
export function tallyFightStatistics(
    events: readonly BattleEvent[],
    heals: ReadonlyMap<BattleEvent, TeamHeal>,
): FightStatistics {
    const build: StatisticsBuild = {
        byCombatantId: new Map(),
        woundByVictimId: new Map(),
        dealtByNobody: 0,
        takenByNobody: 0,
        givenByNobody: 0,
        restoredToNobody: 0,
        byNeitherEnd: 0,
        byNeitherEndByElement: new Map(),
        unreadMessagesUnknownKey: 0,
        unreadMessagesNoParameter: 0,
        unreadMessagesGrammarRefused: 0,
        castsUnplaced: 0,
        castsStated: 0,
        turnStanding: NO_TURN_STANDING,
        outcome: null,
    };
    for (const event of events) {
        if (event.kind === BATTLE_EVENT.unknownMessage) addUnreadMessage(build, event);
        if (event.kind === BATTLE_EVENT.unaccountedHealth) {
            addTeamHeal(build, event.combatantId, event.announced, heals.get(event));
        }
        addAttackEvent(build, event);
        addNamedDamageEvent(build, event);
        // Before the tick it is charged to: a wound announced by the message a tick arrives on is
        // still the freshest one against that victim.
        addWoundAnnouncement(build, event);
        addHealthChangeEvent(build, event);
        addNamedHealingEvent(build, event);
        addFightOutcome(build, event);
        addSkillUse(build, event);
        addTurnTaken(build, event);
        addTurnLost(build, event);
    }
    assert(build.byCombatantId.size <= COMBATANTS_MAXIMUM, "a fight stays inside its bound");
    assert(countUnreadMessages(build) <= events.length, "a message is counted unread once");
    return {
        byCombatantId: build.byCombatantId,
        totals: tallyTotals(build.byCombatantId),
        dealtByNobody: build.dealtByNobody,
        takenByNobody: build.takenByNobody,
        givenByNobody: build.givenByNobody,
        restoredToNobody: build.restoredToNobody,
        byNeitherEnd: build.byNeitherEnd,
        byNeitherEndByElement: build.byNeitherEndByElement,
        unreadMessagesUnknownKey: build.unreadMessagesUnknownKey,
        unreadMessagesNoParameter: build.unreadMessagesNoParameter,
        unreadMessagesGrammarRefused: build.unreadMessagesGrammarRefused,
        castsUnplaced: build.castsUnplaced,
        castsStated: build.castsStated,
        outcome: build.outcome,
    };
}

/** The balances in one place: assertions only. */
export function verifyFightStatistics(statistics: FightStatistics): void {
    assert(
        tallyAppliedBalance(statistics) === 0,
        "every point applied is counted once at each end",
    );
    assert(
        tallyRestoredBalance(statistics) === 0,
        "and every point restored once at each of its own",
    );
    assert(
        tallyHalfNamedBalance(statistics) === 0,
        "and every half-named point is on the row it named",
    );
    assert(tallyHalfNamedKindBalance(statistics) === 0, "and under the key it was stated with");
    assert(
        tallyPreventedBalance(statistics) === 0,
        "and what the defences stopped is stopped by one of them",
    );
}

function addKindsToCut(cut: Map<string, number>, kinds: readonly DamageFigure[]): void {
    assert(kinds.length <= CUT_MAXIMUM, "a blow carries its kinds inside the stated bound");
    for (const kind of kinds) {
        assert(kind.amount >= 0, "a kind of a blow lands no less than nothing");
        addToCut(cut, kind.element, kind.amount);
    }
}

function addToCut(cut: Map<string, number>, key: string, amount: number): void {
    assert(key.length > 0, "a cut is kept under a name");
    assert(cut.size <= CUT_MAXIMUM, "a cut stays inside its stated bound");
    cut.set(key, (cut.get(key) ?? 0) + amount);
}

function getPairCut(cut: Map<string, Map<string, number>>, other: string): Map<string, number> {
    assert(other.length > 0, "the other end of a movement is named before it is cut by");
    assert(cut.size <= COMBATANTS_MAXIMUM, "a fight cuts by the people who are in it");
    const held = cut.get(other) ?? new Map<string, number>();
    cut.set(other, held);
    return held;
}

function addToPairCut(
    cut: Map<string, Map<string, number>>,
    other: string,
    figures: readonly DamageFigure[],
): void {
    const held = getPairCut(cut, other);
    for (const figure of figures) addToCut(held, figure.element, figure.amount);
}

/**
 * A skill is kept under its **name** rather than its id: 346 of the 3,349 announcements over
 * `develop:captures/` on 2026-08-29 carry no id, and a row keyed by nothing merges two skills.
 */
function getSkillFigures(
    skills: Map<string, TallyingSkillFigures>,
    name: string,
): TallyingSkillFigures {
    assert(name.length > 0, "a skill is kept under the name it was announced by");
    const held = skills.get(name) ?? {
        name,
        uses: 0,
        dealt: 0,
        blows: 0,
        dealtByOpponent: new Map(),
        restored: 0,
        restoredByOpponent: new Map(),
    };
    skills.set(name, held);
    assert(skills.size <= SKILLS_MAXIMUM, "a fight states no more skills than it is bounded to");
    return held;
}

function addSkillDealt(
    skills: Map<string, TallyingSkillFigures>,
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

/** The swing itself, counted where the blow is: a figure stated against a name is not one. */
function addSkillBlow(skills: Map<string, TallyingSkillFigures>, announced: AnnouncedSkill): void {
    assert(announced.skillName.length > 0, "a swing is counted under the announcement named");
    const held = getSkillFigures(skills, announced.skillName);
    held.blows += 1;
    assert(held.blows > 0, "a swing that was counted was counted at least once");
}

/**
 * Whose skill row a restored figure is charged to. Read twice, here and where the same figure is
 * cut by key instead, because a movement lands on exactly one of the two.
 */
function getSkillOwnerId(announced: AnnouncedSkill | null): number | null {
    if (announced === null) return null;
    assert(announced.skillName.length > 0, "an announcement that was made is named");
    return announced.actorId;
}

function addSkillRestored(
    build: StatisticsBuild,
    announced: AnnouncedSkill,
    amount: number,
    healedId: number | null,
): void {
    assert(amount >= 0, "restored health is never below nothing");
    assert(announced.skillName.length > 0, "and the announcement behind it is named");
    const ownerId = getSkillOwnerId(announced);
    if (ownerId === null) return;
    const skills = getFiguresForCombatant(build.byCombatantId, ownerId).skills;
    const held = getSkillFigures(skills, announced.skillName);
    held.restored += amount;
    if (healedId !== null) addToCut(held.restoredByOpponent, `${healedId}`, amount);
}

/** The count an announcement states, which a blow carrying that announcement does not repeat. */
function addSkillUse(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== BATTLE_EVENT.skillUsed) return;
    if (event.actorId === null) return;
    assert(event.skillName.length > 0, "an announcement names the skill it announces");
    const skills = getFiguresForCombatant(build.byCombatantId, event.actorId).skills;
    const held = getSkillFigures(skills, event.skillName);
    held.uses += 1;
    assert(held.uses > 0, "an announcement that was counted was counted at least once");
}

/** A turn the protocol named no actor for reaches no row, as `blowsStruck` does. */
function addTurnTaken(build: StatisticsBuild, event: BattleEvent): void {
    const openerId = lookupTurnOpener(event, build.turnStanding);
    build.turnStanding = composeTurnStanding(event, build.turnStanding);
    if (openerId === null) return;
    assert(Number.isSafeInteger(openerId), "a turn is charged to an id that was read");
    const figures = getFiguresForCombatant(build.byCombatantId, openerId);
    figures.turnsTaken += 1;
    assert(figures.turnsTaken > 0, "a turn that was counted was counted at least once");
}

function addTurnLost(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== BATTLE_EVENT.turnLost) return;
    if (event.combatantId === null) return;
    assert(Number.isSafeInteger(event.combatantId), "a turn is lost by an id that was read");
    const figures = getFiguresForCombatant(build.byCombatantId, event.combatantId);
    figures.turnsLost += 1;
    assert(figures.turnsLost > 0, "a turn that was lost was lost at least once");
}

function tallyFigures(figures: readonly DamageFigure[]): number {
    let total = 0;
    for (const figure of figures) {
        assert(Number.isSafeInteger(figure.amount), "a figure totalled is a whole number");
        total += figure.amount;
    }
    assert(Number.isSafeInteger(total), "a total stays inside what a number holds exactly");
    return total;
}

function getFiguresForCombatant(
    byCombatantId: Map<number, TallyingFigures>,
    combatantId: number,
): TallyingFigures {
    assert(Number.isSafeInteger(combatantId), "a row belongs to an id that was read");
    const held = byCombatantId.get(combatantId);
    if (held !== undefined) return held;
    assert(byCombatantId.size < COMBATANTS_MAXIMUM, "a fight stays inside its stated bound");
    const figures = initCombatantFigures();
    byCombatantId.set(combatantId, figures);
    return figures;
}

/**
 * One message names the winners and another the losers, a draw is the winners' key naming nobody,
 * and an escape is a key of its own. A later statement replaces an earlier one on its own side.
 */
function addFightOutcome(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== BATTLE_EVENT.fightOutcome) return;
    const held = build.outcome ?? { wonNames: [], lostNames: [], isDrawn: false, isFled: false };
    assert(event.combatantNames.every((one) => one.length > 0), "a side named is named in full");
    if (event.result === OUTCOME_RESULT.drawn) build.outcome = { ...held, isDrawn: true };
    if (event.result === OUTCOME_RESULT.fled) build.outcome = { ...held, isFled: true };
    if (event.result === OUTCOME_RESULT.won) {
        build.outcome = { ...held, wonNames: [...event.combatantNames] };
    }
    if (event.result === OUTCOME_RESULT.lost) {
        build.outcome = { ...held, lostNames: [...event.combatantNames] };
    }
    assert(build.outcome !== null, "a fight that stated its end holds one");
}

/** The other end of a blow as a cut is keyed, or null where the protocol named nobody. */
function getOtherEndKey(targetId: number | null): string | null {
    if (targetId === null) return null;
    assert(Number.isSafeInteger(targetId), "an end the protocol named is named by a number");
    return `${targetId}`;
}

/**
 * What fired beside the blow, on the row of whoever it belongs to. A key whose end is `unsettled`
 * reaches neither row: a row charged with one would be this file guessing.
 */
function addBlowProcs(
    striker: TallyingFigures | null,
    struck: TallyingFigures | null,
    procs: readonly string[],
): void {
    assert(procs.length <= PROCS_MAXIMUM, "a blow fires no more procs than it is bounded to");
    for (const key of procs) {
        const reading = getKeyReading(key);
        assert(reading !== null, "a proc the decoder stated is a key the table reads");
        assert(reading.kind === KEY_FAMILY.proc, "and one it places as a proc");
        if (reading.end === PROC_END.actor) {
            if (striker !== null) addToCut(striker.procsWhenStriking, key, 1);
        }
        if (reading.end === PROC_END.target) {
            if (struck !== null) addToCut(struck.procsWhenStruck, key, 1);
        }
    }
}

function isBlowCritical(procs: readonly string[]): boolean {
    assert(procs.length <= PROCS_MAXIMUM, "a blow fires no more procs than it is bounded to");
    return procs.some((key) => CRITICAL_PROC_KEYS.includes(key));
}

/** Two blows of five thousand and one of nine total the same and are not the same fight. */
function getLargerBlow(standing: number, applied: number): number {
    assert(standing >= 0, "the hardest blow so far landed no less than nothing");
    assert(applied >= 0, "and neither did the one being weighed against it");
    return Math.max(standing, applied);
}

/** Everything a blow says about who **struck** it, beyond the damage itself. */
function addBlowStruck(striker: TallyingFigures, event: AttackEvent, applied: number): void {
    assert(applied >= 0, "a blow lands no less than nothing");
    assert(event.destroyed.length <= CUT_MAXIMUM, "and destroys inside its stated bound");
    striker.damageDealtBlowLargest = getLargerBlow(striker.damageDealtBlowLargest, applied);
    if (isBlowCritical(event.procs)) striker.blowsCritical += 1;
    for (const destroyed of event.destroyed) {
        addToCut(striker.statisticsDestroyed, destroyed.statistic, destroyed.amount);
    }
}

/** The same for who **took** it: the sum a counter states and the cut a card draws, together. */
function addBlowTaken(struck: TallyingFigures, event: AttackEvent, applied: number): void {
    assert(applied >= 0, "a blow lands no less than nothing");
    assert(event.prevented.length <= CUT_MAXIMUM, "and is stopped inside its stated bound");
    struck.damageTakenBlowLargest = getLargerBlow(struck.damageTakenBlowLargest, applied);
    for (const stopped of event.prevented) {
        struck.damagePrevented += stopped.amount;
        addToCut(struck.damagePreventedByDefence, stopped.defence, stopped.amount);
    }
}

function addAttackEvent(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== BATTLE_EVENT.attack) return;
    const raw = tallyFigures(event.raw);
    const applied = tallyFigures(event.applied);
    assert(raw >= 0, "a blow puts out no less than nothing");
    assert(applied >= 0, "and lands no less than nothing");
    if (event.actorId === null) build.dealtByNobody += applied;
    else {
        const dealer = getFiguresForCombatant(build.byCombatantId, event.actorId);
        addAttackDealt(dealer, event, raw, applied);
    }
    const striker = getStrikerFigures(build, event.actorId);
    if (event.targetId === null) {
        addBlowProcs(striker, null, event.procs);
        addBlowWithNoTarget(build, event.actorId, applied, event.applied);
        return;
    }
    const target = getFiguresForCombatant(build.byCombatantId, event.targetId);
    if (event.actorId === null) {
        target.damageTakenFromNobody += applied;
        addKindsToCut(target.damageTakenFromNobodyByElement, event.applied);
    }
    target.damageTakenRaw += raw;
    target.damageTakenApplied += applied;
    for (const figure of event.applied) {
        addToCut(target.damageTakenByElement, figure.element, figure.amount);
    }
    if (event.actorId !== null) {
        addToCut(target.damageTakenByOpponent, `${event.actorId}`, applied);
        addToPairCut(target.damageTakenByOpponentAndKind, `${event.actorId}`, event.applied);
        if (event.announced === null) {
            addToCut(target.damageTakenWithoutSkillByOpponent, `${event.actorId}`, applied);
        }
    }
    addBlowTaken(target, event, applied);
    addBlowProcs(striker, target, event.procs);
    assert(target.damageTakenApplied >= 0, "a total of applied damage never falls below nothing");
}

/** The dealing half of a blow, on the row of whoever struck it. */
function addAttackDealt(
    dealer: TallyingFigures,
    event: AttackEvent,
    raw: number,
    applied: number,
): void {
    assert(raw >= 0, "a blow puts out no less than nothing");
    assert(applied >= 0, "and lands no less than nothing");
    dealer.damageDealtRaw += raw;
    dealer.damageDealtApplied += applied;
    dealer.blowsStruck += 1;
    if (event.announced === null) {
        dealer.blowsWithoutSkill += 1;
        if (event.targetId !== null) {
            addToCut(dealer.damageDealtWithoutSkillByOpponent, `${event.targetId}`, applied);
        }
    } else {
        addSkillDealt(dealer.skills, event.announced, applied, getOtherEndKey(event.targetId));
        addSkillBlow(dealer.skills, event.announced);
    }
    for (const figure of event.applied) {
        addToCut(dealer.damageDealtByElement, figure.element, figure.amount);
    }
    if (event.targetId !== null) {
        addToCut(dealer.damageDealtByOpponent, `${event.targetId}`, applied);
        addToPairCut(dealer.damageDealtByOpponentAndKind, `${event.targetId}`, event.applied);
    }
    addBlowStruck(dealer, event, applied);
}

/** The row the blow was struck from, or nothing where the protocol named nobody at that end. */
function getStrikerFigures(
    build: StatisticsBuild,
    actorId: number | null,
): TallyingFigures | null {
    if (actorId === null) return null;
    assert(Number.isSafeInteger(actorId), "an end the protocol named is named by a number");
    return getFiguresForCombatant(build.byCombatantId, actorId);
}

/**
 * Already reduced where it is stated, so it has no raw half. It weighs into the hardest blow at
 * both ends and into no count of blows: of the 249 rows that took damage over `develop:captures/`
 * on 2026-08-30, 149 are named by nothing else. ⚠️ **Where nothing announced the blow it rode, it
 * reaches the closing row's cut as well** (`develop ADR 0081`); 0 of 1,175 such figures stand
 * under no announcement there, 2026-09-13.
 */
function addNamedDamageEvent(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== BATTLE_EVENT.damageToNamedCombatant) return;
    const amount = event.damage.amount;
    assert(Number.isSafeInteger(amount), "a figure totalled is a whole number");
    assert(amount >= 0, "damage stated against a name is never below nothing");
    if (event.actorId === null) build.dealtByNobody += amount;
    else {
        const dealer = getFiguresForCombatant(build.byCombatantId, event.actorId);
        dealer.damageDealtApplied += amount;
        dealer.damageDealtBlowLargest = getLargerBlow(dealer.damageDealtBlowLargest, amount);
        addToCut(dealer.damageDealtByElement, event.damage.element, amount);
        // The announcement is spent and the count of blows is not: a swing is a swing.
        if (event.announced !== null) {
            addSkillDealt(dealer.skills, event.announced, amount, getOtherEndKey(event.targetId));
        }
        if (event.targetId !== null) {
            addToCut(dealer.damageDealtByOpponent, `${event.targetId}`, amount);
            addToPairCut(dealer.damageDealtByOpponentAndKind, `${event.targetId}`, [event.damage]);
            if (event.announced === null) {
                addToCut(dealer.damageDealtWithoutSkillByOpponent, `${event.targetId}`, amount);
            }
        }
    }
    if (event.targetId === null) {
        addBlowWithNoTarget(build, event.actorId, amount, [event.damage]);
        return;
    }
    const target = getFiguresForCombatant(build.byCombatantId, event.targetId);
    if (event.actorId === null) {
        target.damageTakenFromNobody += amount;
        addToCut(target.damageTakenFromNobodyByElement, event.damage.element, amount);
    }
    target.damageTakenApplied += amount;
    target.damageTakenBlowLargest = getLargerBlow(target.damageTakenBlowLargest, amount);
    addToCut(target.damageTakenByElement, event.damage.element, amount);
    if (event.actorId !== null) {
        addToCut(target.damageTakenByOpponent, `${event.actorId}`, amount);
        addToPairCut(target.damageTakenByOpponentAndKind, `${event.actorId}`, [event.damage]);
        if (event.announced === null) {
            addToCut(target.damageTakenWithoutSkillByOpponent, `${event.actorId}`, amount);
        }
    }
}

/**
 * Who put the health back: whoever announced it, or the one healed where the key is theirs on the
 * published help's word. No point of the 3,755,729 restored across `develop:captures/` on
 * 2026-08-30 is left without a giver.
 */
function lookupGiverId(
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
 * The giving half of one movement, kept beside the receiving half so the two cannot drift. Where no
 * giver can be read the receiver's row keeps the amount as well, because that is the end the
 * protocol **did** name.
 */
function addGivenHealth(
    build: StatisticsBuild,
    giverId: number | null,
    amount: number,
    healedId: number | null,
    stated: { source: string; announced: AnnouncedSkill | null },
): void {
    assert(amount >= 0, "restored health is never below nothing");
    assert(stated.source.length > 0, "and comes under a key the protocol named");
    if (healedId !== null) {
        if (giverId !== null) {
            const healed = getFiguresForCombatant(build.byCombatantId, healedId);
            addToCut(healed.healthRestoredByGiver, `${giverId}`, amount);
        }
    }
    if (giverId === null) {
        build.givenByNobody += amount;
        if (healedId === null) return;
        const healed = getFiguresForCombatant(build.byCombatantId, healedId);
        healed.healthRestoredByNobody += amount;
        addToCut(healed.healthRestoredByNobodyBySource, stated.source, amount);
        return;
    }
    const giver = getFiguresForCombatant(build.byCombatantId, giverId);
    giver.healthGiven += amount;
    if (healedId === null) return;
    addToCut(giver.healthGivenByReceiver, `${healedId}`, amount);
    if (getSkillOwnerId(stated.announced) !== null) return;
    const cut = getPairCut(giver.healthGivenWithoutSkillByReceiverAndSource, `${healedId}`);
    addToCut(cut, stated.source, amount);
}

/**
 * The key, as the protocol wrote it, once for the whole of it and again for the part standing
 * behind no announcement. `getSkillOwnerId` is the one condition for both, as for the skill rows.
 */
function addRestoredSource(
    build: StatisticsBuild,
    healedId: number | null,
    source: string,
    amount: number,
    announced: AnnouncedSkill | null,
): void {
    assert(amount >= 0, "restored health is never below nothing");
    assert(source.length > 0, "and comes under a key the protocol named");
    if (healedId === null) return;
    const healed = getFiguresForCombatant(build.byCombatantId, healedId);
    addToCut(healed.healthRestoredBySource, source, amount);
    if (getSkillOwnerId(announced) !== null) return;
    addToCut(healed.healthRestoredWithoutSkillBySource, source, amount);
}

/**
 * A blow the protocol found no target for. Where it names no actor either, nobody's row holds it
 * and no side can be charged with it: it is counted apart rather than folded into either count.
 */
function addBlowWithNoTarget(
    build: StatisticsBuild,
    actorId: number | null,
    amount: number,
    kinds: readonly DamageFigure[],
): void {
    assert(amount >= 0, "a blow lands no less than nothing");
    build.takenByNobody += amount;
    if (actorId === null) {
        build.byNeitherEnd += amount;
        addKindsToCut(build.byNeitherEndByElement, kinds);
        return;
    }
    const striker = getFiguresForCombatant(build.byCombatantId, actorId);
    striker.damageDealtToNobody += amount;
    addKindsToCut(striker.damageDealtToNobodyByElement, kinds);
}

/**
 * The wound a blow announced, kept against whoever carries it. Only a blow naming both ends and a
 * figure is kept: all 84 in `develop:captures/` do, 2026-09-11 (`develop ADR 0022`).
 */
function addWoundAnnouncement(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== BATTLE_EVENT.attack) return;
    assert(build.woundByVictimId.size <= COMBATANTS_MAXIMUM, "a fight stays inside its bound");
    if (event.actorId === null) return;
    if (event.targetId === null) return;
    for (const declared of event.declared) {
        if (declared.effect !== WOUND_ANNOUNCEMENT_KEY) continue;
        if (declared.amount === null) continue;
        // The figure is the game's: a wound announcing nothing is skipped, never asserted against.
        if (declared.amount <= 0) continue;
        const standing = { attackerId: event.actorId, amount: declared.amount };
        build.woundByVictimId.set(event.targetId, standing);
    }
}

/**
 * Whose wound a tick belongs to, or nobody. The freshest wound against that victim is the one
 * ticking, and a tick states exactly the figure that wound announced (`develop ADR 0022`).
 */
function lookupWoundAttackerId(build: StatisticsBuild, event: HealthChangeEvent): number | null {
    if (event.source !== WOUND_TICK_KEY) return null;
    if (event.combatantId === null) return null;
    const standing = build.woundByVictimId.get(event.combatantId);
    if (standing === undefined) return null;
    if (standing.amount !== -event.amount) return null;
    assert(Number.isSafeInteger(standing.attackerId), "a wound was left by somebody named");
    return standing.attackerId;
}

/** A tick on both rows, into the cuts a blow reaches, and into neither count of blows. */
function addWoundTick(
    build: StatisticsBuild,
    victimId: number,
    attackerId: number,
    amount: number,
): void {
    assert(amount > 0, "a wound ticking takes health off");
    assert(Number.isSafeInteger(amount), "a figure totalled is a whole number");
    const kind: DamageFigure[] = [{ element: WOUND_TICK_KEY, amount }];
    const attacker = getFiguresForCombatant(build.byCombatantId, attackerId);
    attacker.damageDealtApplied += amount;
    addToCut(attacker.damageDealtByElement, WOUND_TICK_KEY, amount);
    addToCut(attacker.damageDealtWithoutSkillBySource, WOUND_TICK_KEY, amount);
    addToCut(
        getPairCut(attacker.damageDealtWithoutSkillByOpponentAndSource, `${victimId}`),
        WOUND_TICK_KEY,
        amount,
    );
    addToCut(attacker.damageDealtByOpponent, `${victimId}`, amount);
    addToPairCut(attacker.damageDealtByOpponentAndKind, `${victimId}`, kind);
    const victim = getFiguresForCombatant(build.byCombatantId, victimId);
    addToCut(victim.damageTakenByOpponent, `${attackerId}`, amount);
    addToPairCut(victim.damageTakenByOpponentAndKind, `${attackerId}`, kind);
}

/** Health moving outside a blow. What restored it is the key, and the key says who gave it. */
function addHealthChangeEvent(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== BATTLE_EVENT.healthChange) return;
    assert(Number.isSafeInteger(event.amount), "a movement totalled is a whole number");
    const lost = -event.amount;
    if (event.combatantId === null) {
        if (event.amount >= 0) return addRestoredToNobody(build, event.amount);
        build.takenByNobody += lost;
        build.dealtByNobody += lost;
        build.byNeitherEnd += lost;
        addToCut(build.byNeitherEndByElement, event.source, lost);
        return;
    }
    const figures = getFiguresForCombatant(build.byCombatantId, event.combatantId);
    if (event.amount >= 0) {
        figures.healthRestored += event.amount;
        addRestoredSource(build, event.combatantId, event.source, event.amount, event.announced);
        if (event.announced !== null) {
            addSkillRestored(build, event.announced, event.amount, event.combatantId);
        }
        const giverId = lookupGiverId(event.source, event.combatantId, event.announced);
        const stated = { source: event.source, announced: event.announced };
        addGivenHealth(build, giverId, event.amount, event.combatantId, stated);
        return;
    }
    figures.damageTakenApplied += lost;
    // The key joins the element cut, because a tick of poison is a kind of damage taken; and the
    // cut the skills section closes against, which is a different question.
    addToCut(figures.damageTakenByElement, event.source, lost);
    addToCut(figures.damageTakenWithoutSkillBySource, event.source, lost);
    const attackerId = lookupWoundAttackerId(build, event);
    if (attackerId === null) {
        figures.damageTakenFromNobody += lost;
        addToCut(figures.damageTakenFromNobodyByElement, event.source, lost);
        build.dealtByNobody += lost;
    } else {
        addWoundTick(build, event.combatantId, attackerId, lost);
    }
    assert(figures.healthRestored >= 0, "a total of health restored never falls below nothing");
}

/**
 * Health the protocol says came back, to nobody it named. **Counted rather than dropped**, and
 * charged to no side, because the end that would decide one is the end that is missing
 * (`develop ADR 0082`).
 */
function addRestoredToNobody(build: StatisticsBuild, amount: number): void {
    assert(amount >= 0, "health that came back never came back below nothing");
    build.restoredToNobody += amount;
    assert(build.restoredToNobody >= amount, "a total only grows by what it was handed");
}

function addNamedHealingEvent(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== BATTLE_EVENT.healingToNamedCombatant) return;
    assert(event.amount >= 0, "healing restored is never below nothing");
    if (event.targetId === null) return addRestoredToNobody(build, event.amount);
    const figures = getFiguresForCombatant(build.byCombatantId, event.targetId);
    figures.healthRestored += event.amount;
    addRestoredSource(build, event.targetId, event.source, event.amount, null);
    // No announcement to ask: this figure rides a blow struck at somebody else, so the message's
    // own actor is the attacker rather than the healer.
    const giverId = lookupGiverId(event.source, event.targetId, null);
    const stated = { source: event.source, announced: null };
    addGivenHealth(build, giverId, event.amount, event.targetId, stated);
    assert(figures.healthRestored >= event.amount, "a total only grows by what it was handed");
}

/**
 * A message left unread, counted for the fight under its cause, and charged once to every end its
 * grammar named: nobody at all where the grammar itself is what failed.
 */
function addUnreadMessage(build: StatisticsBuild, event: UnknownMessageEvent): void {
    const { unreadCause, combatantIds } = event;
    if (unreadCause === UNREAD_CAUSE.unknownKey) build.unreadMessagesUnknownKey += 1;
    if (unreadCause === UNREAD_CAUSE.noParameter) build.unreadMessagesNoParameter += 1;
    if (unreadCause === UNREAD_CAUSE.grammarRefused) build.unreadMessagesGrammarRefused += 1;
    assert(combatantIds.length <= COMBATANTS_MAXIMUM, "a message names ends inside the bound");
    if (unreadCause === UNREAD_CAUSE.grammarRefused) {
        assert(combatantIds.length === 0, "a grammar nobody could read named nobody either");
        return;
    }
    const charged = new Set<number>();
    for (const combatantId of combatantIds) {
        if (charged.has(combatantId)) continue;
        charged.add(combatantId);
        const figures = getFiguresForCombatant(build.byCombatantId, combatantId);
        if (unreadCause === UNREAD_CAUSE.unknownKey) figures.unreadMessagesUnknownKey += 1;
        else figures.unreadMessagesNoParameter += 1;
    }
    assert(charged.size <= combatantIds.length, "a row is charged for it once, or not at all");
}

/** A cast nobody could size, charged to whoever cast it. Nowhere, where nobody named them. */
function addUnplacedCast(build: StatisticsBuild, casterId: number | null): void {
    if (casterId === null) return;
    assert(Number.isSafeInteger(casterId), "a cast is charged to somebody the protocol named");
    const figures = getFiguresForCombatant(build.byCombatantId, casterId);
    figures.castsUnplaced += 1;
    assert(figures.castsUnplaced > 0, "a suspicion charged to a row is one the row now carries");
}

/**
 * What a cast put back, per member. A cast nobody could size, or one sized for only part of its
 * side, is counted as unplaced as well: a partial answer is never read as a whole one.
 */
function addTeamHeal(
    build: StatisticsBuild,
    casterId: number | null,
    announced: AnnouncedSkill | null,
    heal: TeamHeal | undefined,
): void {
    build.castsStated += 1;
    if (casterId !== null) assert(Number.isSafeInteger(casterId), "a caster named is an id read");
    if (heal === undefined) {
        build.castsUnplaced += 1;
        // The actor slot; the announcement stands in only where the message named no actor.
        addUnplacedCast(build, casterId ?? announced?.actorId ?? null);
        return;
    }
    if (!heal.isWhole) {
        build.castsUnplaced += 1;
        addUnplacedCast(build, heal.casterId);
    }
    for (const [combatantId, amount] of heal.restoredByCombatantId) {
        assert(amount >= 0, "a cast puts back no less than nothing");
        getFiguresForCombatant(build.byCombatantId, combatantId).healthRestored += amount;
        addRestoredSource(build, combatantId, heal.source, amount, announced);
        // The one healing shape whose giver the protocol states outright: the caster.
        const stated = { source: heal.source, announced };
        addGivenHealth(build, heal.casterId, amount, combatantId, stated);
        if (announced === null) continue;
        assert(announced.actorId === heal.casterId, "one combatant cast it and one announced it");
        addSkillRestored(build, announced, amount, combatantId);
    }
    assert(build.castsUnplaced >= 0, "a count of casts never falls below nothing");
    assert(build.castsUnplaced <= build.castsStated, "and no more of them than were stated");
}

function tallyTotals(byCombatantId: ReadonlyMap<number, TallyingFigures>): TallyingFigures {
    const totals = initCombatantFigures();
    for (const figures of byCombatantId.values()) {
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
 * Applied damage is stated once and lands twice, on whoever dealt it and on whoever took it, so
 * the two sides must come out equal, with what the log tied to nobody standing in on either.
 */
function tallyAppliedBalance(statistics: FightStatistics): number {
    let dealt = statistics.dealtByNobody;
    let taken = statistics.takenByNobody;
    for (const figures of statistics.byCombatantId.values()) {
        dealt += figures.damageDealtApplied;
        taken += figures.damageTakenApplied;
    }
    assert(Number.isSafeInteger(dealt), "a total stays inside what a number holds exactly");
    assert(Number.isSafeInteger(taken), "a total stays inside what a number holds exactly");
    return dealt - taken;
}

/** The same equation on health put back: once stated, landing on giver and receiver. */
function tallyRestoredBalance(statistics: FightStatistics): number {
    let restored = 0;
    let given = statistics.givenByNobody;
    for (const figures of statistics.byCombatantId.values()) {
        restored += figures.healthRestored;
        given += figures.healthGiven;
    }
    assert(Number.isSafeInteger(restored), "a total stays inside what a number holds exactly");
    assert(Number.isSafeInteger(given), "a total stays inside what a number holds exactly");
    return restored - given;
}

/** What the defences stopped, against the one number a counter states for the lot. */
function tallyPreventedBalance(statistics: FightStatistics): number {
    let apart = 0;
    for (const figures of statistics.byCombatantId.values()) {
        apart += tallyCutApart(figures.damagePrevented, figures.damagePreventedByDefence);
    }
    assert(apart >= 0, "a difference counted as a distance is never below nothing");
    return apart;
}

function tallyCutApart(figure: number, cut: ReadonlyMap<string, number>): number {
    assert(figure >= 0, "a figure being cut is never below nothing");
    assert(cut.size <= CUT_MAXIMUM, "and is cut inside the stated bound");
    let held = 0;
    for (const amount of cut.values()) held += amount;
    assert(Number.isSafeInteger(held), "a total stays inside what a number holds exactly");
    return Math.abs(figure - held);
}

/** What each half-named figure was made of, against the figure itself. */
function tallyHalfNamedKindBalance(statistics: FightStatistics): number {
    let apart = tallyCutApart(statistics.byNeitherEnd, statistics.byNeitherEndByElement);
    for (const figures of statistics.byCombatantId.values()) {
        const takenCut = figures.damageTakenFromNobodyByElement;
        const dealtCut = figures.damageDealtToNobodyByElement;
        const restoredCut = figures.healthRestoredByNobodyBySource;
        apart += tallyCutApart(figures.damageTakenFromNobody, takenCut);
        apart += tallyCutApart(figures.damageDealtToNobody, dealtCut);
        apart += tallyCutApart(figures.healthRestoredByNobody, restoredCut);
    }
    assert(apart >= 0, "a difference counted as a distance is never below nothing");
    return apart;
}

/**
 * What the fight-wide counts hold, against what the rows they were read off hold: each is the sum
 * of one field across the rows plus what named neither end, and nothing else.
 */
function tallyHalfNamedBalance(statistics: FightStatistics): number {
    let takenFromNobody = 0;
    let dealtToNobody = 0;
    let restoredByNobody = 0;
    for (const figures of statistics.byCombatantId.values()) {
        takenFromNobody += figures.damageTakenFromNobody;
        dealtToNobody += figures.damageDealtToNobody;
        restoredByNobody += figures.healthRestoredByNobody;
    }
    assert(statistics.byNeitherEnd >= 0, "what names neither end is never below nothing");
    const dealt = statistics.dealtByNobody - takenFromNobody - statistics.byNeitherEnd;
    const taken = statistics.takenByNobody - dealtToNobody - statistics.byNeitherEnd;
    const given = statistics.givenByNobody - restoredByNobody;
    return Math.abs(dealt) + Math.abs(taken) + Math.abs(given);
}
