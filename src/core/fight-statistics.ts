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
    type DamageToNamedCombatantEvent,
    type HealthChangeEvent,
    OUTCOME_RESULT,
    type PreventedDamage,
    UNREAD_CAUSE,
} from "./battle-event.ts";
import { PERCENT_WHOLE, type SideHeal } from "./combatant-health.ts";
import { COMBATANTS_MAXIMUM } from "./combatant-roster.ts";
import { MESSAGE_PARTS_MAXIMUM } from "./fight-decoder.ts";
import { type LegendaryBonusTally, tallyLegendaryBonuses } from "./legendary-standing.ts";
import {
    CRITICAL_PROC_KEYS,
    DEFENCE_MECHANISM,
    getDefenceMechanism,
    KEY_FAMILY,
    lookupKeyMeaning,
    PROC_END,
    SELF_SOURCED_HEALING_KEYS,
    WOUND_ANNOUNCEMENT_KEY,
    WOUND_TICK_KEY,
} from "./protocol-key.ts";
import {
    composeTurnStanding,
    lookupTurnOpener,
    NO_TURN_STANDING,
    type TurnStanding,
} from "./turn-clock.ts";

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
    damageDealt: number;
    /** Blows that went out under this announcement, counted the way `blowsStruck` is. */
    blows: number;
    damageDealtByOpponent: ReadonlyMap<string, number>;
    healthGiven: number;
    healthGivenByReceiver: ReadonlyMap<string, number>;
}

export interface CombatantFigures {
    /** Applied and absorbed: the damage a panel draws, and what every cut of it sums to. */
    damageDealt: number;
    damageTaken: number;
    damageDealtRaw: number;
    /** Health alone: the figure the protocol's own percentages witness. */
    damageDealtApplied: number;
    damageTakenRaw: number;
    damageTakenApplied: number;
    /** Drained from a pool the target began the fight with (ADR 0012). */
    damageDealtAbsorbed: number;
    damageTakenAbsorbed: number;
    /** Stopped by a defence that drains nothing: a block. */
    damagePrevented: number;
    healthRestored: number;
    /** Health this combatant put back, into anybody, themselves included. */
    healthGiven: number;
    /** This row's share of what the fight-wide half-named counts hold. */
    damageTakenFromNobody: number;
    damageDealtToNobody: number;
    healthRestoredByNobody: number;
    damageTakenFromNobodyByKind: ReadonlyMap<string, number>;
    damageDealtToNobodyByKind: ReadonlyMap<string, number>;
    healthRestoredByNobodyByKey: ReadonlyMap<string, number>;
    /**
     * There is no flat cut of what a combatant **gave** by key: the keys the protocol names belong
     * to whoever received the health.
     */
    healthRestoredByGiver: ReadonlyMap<string, number>;
    healthGivenByReceiver: ReadonlyMap<string, number>;
    healthRestoredByKey: ReadonlyMap<string, number>;
    /** The part of `healthRestoredByKey` no announcement covered: not in the skills. */
    healthRestoredWithoutSkillByKey: ReadonlyMap<string, number>;
    /** Health lost **outside a blow**, by key (`develop ADR 0080`). */
    damageTakenWithoutSkillByKey: ReadonlyMap<string, number>;
    /** Only a wound reaches it: a tick is charged to who left the wound (`develop ADR 0022`). */
    damageDealtWithoutSkillByKey: ReadonlyMap<string, number>;
    damageDealtWithoutSkillByOpponentAndKey: ReadonlyMap<string, ReadonlyMap<string, number>>;
    /** The blows standing under no announcement, by the other end (`develop ADR 0081`). */
    damageDealtWithoutSkillByOpponent: ReadonlyMap<string, number>;
    damageTakenWithoutSkillByOpponent: ReadonlyMap<string, number>;
    healthGivenWithoutSkillByReceiverAndKey: ReadonlyMap<string, ReadonlyMap<string, number>>;
    damageDealtByKind: ReadonlyMap<string, number>;
    damageTakenByKind: ReadonlyMap<string, number>;
    damageDealtByOpponent: ReadonlyMap<string, number>;
    damageTakenByOpponent: ReadonlyMap<string, number>;
    /** A cut of a cut is what an opened pair is; neither flat cut can be folded into it. */
    damageDealtByOpponentAndKind: ReadonlyMap<string, ReadonlyMap<string, number>>;
    damageTakenByOpponentAndKind: ReadonlyMap<string, ReadonlyMap<string, number>>;
    skills: ReadonlyMap<string, SkillFigures>;
    blowsStruck: number;
    blowsWithoutSkill: number;
    /** Graded against the game's numbering: `docs/turns-taken.md`, `develop ADR 0048`. */
    turnsTaken: number;
    /** Turns granted and spent on nothing, which the game announces itself (`develop ADR 0049`). */
    turnsLost: number;
    /**
     * Blows, not keys: 20 of the 955 critical blows over `captures/` state both keys,
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
    damageDealtAbsorbedByDefence: ReadonlyMap<string, number>;
    damageTakenAbsorbedByDefence: ReadonlyMap<string, number>;
    /** **Never totalled**: points and percentage points, `src/core/battle-event.ts`. */
    statisticsDestroyed: ReadonlyMap<string, number>;
    /**
     * ⚠️ **None of these sums to the count of the same name on `FightStatistics`**: one unread
     * message may name both ends, so it stands on two rows and is one message.
     */
    unreadMessagesUnknownKey: number;
    unreadMessagesNoParameter: number;
    sideHealsUnsized: number;
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

/** What a fight's totals sum. */
const TOTALLED_FIELDS = [
    "damageDealt",
    "damageTaken",
    "damageDealtRaw",
    "damageDealtApplied",
    "damageTakenRaw",
    "damageTakenApplied",
    "damageDealtAbsorbed",
    "damageTakenAbsorbed",
    "damagePrevented",
    "healthRestored",
    "healthGiven",
] as const satisfies readonly (keyof CombatantFigures)[];

/**
 * The figures a sum across combatants means anything for. A count, a cut or a largest blow is a
 * combatant's, and the same field summed over a fight would be a nought nobody measured.
 */
export type FightTotals = Pick<CombatantFigures, typeof TOTALLED_FIELDS[number]>;

export interface FightStatistics extends UnreadMessageCounts {
    byCombatantId: ReadonlyMap<number, CombatantFigures>;
    /** The fight's own sums, here because a total across combatants is never the panel's. */
    totals: FightTotals;
    damageDealtByNobody: number;
    damageTakenByNobody: number;
    healthGivenByNobody: number;
    /** Restored health whose **receiver** the game did not name (`develop ADR 0082`). */
    healthRestoredToNobody: number;
    /** What the protocol named **neither** end of: in both counts above, and on nobody's row. */
    damageByNeitherEnd: number;
    damageByNeitherEndByKind: ReadonlyMap<string, number>;
    sideHealsUnsized: number;
    /** Every cast stated about a side, sized or not: what the count above is out of. */
    sideHealsStated: number;
    /** Null until the game says the fight is over, which it may never do on a fight left early. */
    outcome: FightOutcome | null;
    /**
     * Beside the rows and never on them: a row is what a fight file writes down, and these are
     * not in its format.
     */
    legendaryBonuses: LegendaryBonusTally;
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

/** A blow's figures, read once: what it put out, what reached health, and what a pool took. */
interface BlowFigures {
    raw: number;
    applied: number;
    absorbed: number;
    /** Applied and absorbed together: what the blow spent on its target. */
    amount: number;
    /** The elements it landed in and each pool that took part of it, as members of one cut. */
    kinds: DamageFigure[];
    absorbedParts: PreventedDamage[];
    preventedParts: PreventedDamage[];
}

/** The wound standing against a victim: the freshest overwrites it, so one entry per victim. */
interface WoundStanding {
    actorId: number;
    amount: number;
}

interface TallyingStatistics extends UnreadMessageCounts {
    byCombatantId: Map<number, TallyingFigures>;
    woundByWoundedId: Map<number, WoundStanding>;
    sideHealsUnsized: number;
    sideHealsStated: number;
    damageDealtByNobody: number;
    damageTakenByNobody: number;
    healthGivenByNobody: number;
    healthRestoredToNobody: number;
    damageByNeitherEnd: number;
    damageByNeitherEndByKind: Map<string, number>;
    turnStanding: TurnStanding;
    outcome: FightOutcome | null;
}

/** The largest cut in `captures/` holds ten elements against twenty people, 2026-08-28. */
export const CUT_MAXIMUM = 64;
/** 81 skills are named across `captures/`, 2026-08-29. */
const SKILLS_MAXIMUM = 256;

export function countUnreadMessages(counted: UnreadMessageCounts): number {
    const unread = counted.unreadMessagesUnknownKey + counted.unreadMessagesNoParameter +
        counted.unreadMessagesGrammarRefused;
    assert(Number.isSafeInteger(unread), "a count of messages stays inside what a number holds");
    assert(unread >= 0, "and never falls below none");
    return unread;
}

export function createCombatantFigures(): TallyingFigures {
    return {
        damageDealt: 0,
        damageTaken: 0,
        damageDealtRaw: 0,
        damageDealtApplied: 0,
        damageTakenRaw: 0,
        damageTakenApplied: 0,
        damageDealtAbsorbed: 0,
        damageTakenAbsorbed: 0,
        damagePrevented: 0,
        healthRestored: 0,
        healthGiven: 0,
        damageTakenFromNobody: 0,
        damageDealtToNobody: 0,
        healthRestoredByNobody: 0,
        damageTakenFromNobodyByKind: new Map(),
        damageDealtToNobodyByKind: new Map(),
        healthRestoredByNobodyByKey: new Map(),
        healthRestoredByGiver: new Map(),
        healthGivenByReceiver: new Map(),
        healthRestoredByKey: new Map(),
        healthRestoredWithoutSkillByKey: new Map(),
        damageTakenWithoutSkillByKey: new Map(),
        damageDealtWithoutSkillByKey: new Map(),
        damageDealtWithoutSkillByOpponentAndKey: new Map(),
        damageDealtWithoutSkillByOpponent: new Map(),
        damageTakenWithoutSkillByOpponent: new Map(),
        healthGivenWithoutSkillByReceiverAndKey: new Map(),
        damageDealtByKind: new Map(),
        damageTakenByKind: new Map(),
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
        damageDealtAbsorbedByDefence: new Map(),
        damageTakenAbsorbedByDefence: new Map(),
        statisticsDestroyed: new Map(),
        unreadMessagesUnknownKey: 0,
        unreadMessagesNoParameter: 0,
        sideHealsUnsized: 0,
    };
}

/**
 * The figures, and what a share stated about a side came to once it was sized. The sizing is
 * `combatant-health.ts`'s; the totalling is this file's; the balances are
 * `verifyFightStatistics`'s.
 */
export function tallyFightStatistics(
    events: readonly BattleEvent[],
    sideHealByEvent: ReadonlyMap<BattleEvent, SideHeal>,
): FightStatistics {
    const tallying: TallyingStatistics = {
        byCombatantId: new Map(),
        woundByWoundedId: new Map(),
        damageDealtByNobody: 0,
        damageTakenByNobody: 0,
        healthGivenByNobody: 0,
        healthRestoredToNobody: 0,
        damageByNeitherEnd: 0,
        damageByNeitherEndByKind: new Map(),
        unreadMessagesUnknownKey: 0,
        unreadMessagesNoParameter: 0,
        unreadMessagesGrammarRefused: 0,
        sideHealsUnsized: 0,
        sideHealsStated: 0,
        turnStanding: NO_TURN_STANDING,
        outcome: null,
    };
    for (const event of events) {
        if (event.kind === BATTLE_EVENT.unknownMessage) {
            // Count the unread message under its cause, and charge it to each end it named.
            const { unreadCause, combatantIds } = event;
            if (unreadCause === UNREAD_CAUSE.unknownKey) {
                tallying.unreadMessagesUnknownKey += 1;
            }
            if (unreadCause === UNREAD_CAUSE.noParameter) {
                tallying.unreadMessagesNoParameter += 1;
            }
            if (unreadCause === UNREAD_CAUSE.grammarRefused) {
                tallying.unreadMessagesGrammarRefused += 1;
            }
            assert(
                combatantIds.length <= COMBATANTS_MAXIMUM,
                "a message names ends inside the bound",
            );
            if (unreadCause === UNREAD_CAUSE.grammarRefused) {
                assert(
                    combatantIds.length === 0,
                    "a grammar nobody could read named nobody either",
                );
            }
            for (const combatantId of new Set(combatantIds)) {
                const figures = addCombatantFigures(tallying.byCombatantId, combatantId);
                if (unreadCause === UNREAD_CAUSE.unknownKey) {
                    figures.unreadMessagesUnknownKey += 1;
                } else figures.unreadMessagesNoParameter += 1;
            }
        }
        if (event.kind === BATTLE_EVENT.unaccountedHealth) {
            // Add what a cast put back, per member.
            // A cast nobody could size, or one sized for only part of its side, is counted as
            // unplaced as well: a partial answer is never read as a whole one.
            const casterId = event.combatantId;
            const announced = event.announced;
            const heal = sideHealByEvent.get(event);
            tallying.sideHealsStated += 1;
            if (casterId !== null) {
                assert(Number.isSafeInteger(casterId), "a caster named is an id read");
            }
            if (heal === undefined) {
                tallying.sideHealsUnsized += 1;
                // The actor slot; the announcement stands in only where the message named no
                // actor.
                addUnplacedCast(tallying, casterId ?? announced?.actorId ?? null);
            } else {
                if (!heal.isWhole) {
                    tallying.sideHealsUnsized += 1;
                    addUnplacedCast(tallying, heal.casterId);
                }
                for (const [combatantId, amount] of heal.restoredByCombatantId) {
                    assert(amount >= 0, "a cast puts back no less than nothing");
                    addCombatantFigures(tallying.byCombatantId, combatantId)
                        .healthRestored += amount;
                    addHealthRestoredBySource(
                        tallying,
                        combatantId,
                        heal.source,
                        amount,
                        announced,
                    );
                    // The one healing shape whose giver the protocol states outright: the
                    // caster.
                    const stated = { source: heal.source, announced };
                    addHealthGiven(tallying, heal.casterId, amount, combatantId, stated);
                    if (announced === null) continue;
                    assert(
                        announced.actorId === heal.casterId,
                        "one combatant cast it and one announced it",
                    );
                    addSkillRestored(tallying, announced, amount, combatantId);
                }
                assert(
                    tallying.sideHealsUnsized >= 0,
                    "a count of casts never falls below nothing",
                );
                assert(
                    tallying.sideHealsUnsized <= tallying.sideHealsStated,
                    "and no more of them than were stated",
                );
            }
        }
        if (event.kind === BATTLE_EVENT.attack) {
            // Add the blow to the row that struck it and the row it struck.
            const blow = tallyBlowFigures(event);
            const dealer = event.actorId === null
                ? null
                : addCombatantFigures(tallying.byCombatantId, event.actorId);
            if (dealer === null) tallying.damageDealtByNobody += blow.amount;
            else addBlowDealt(dealer, event, blow);
            if (event.targetId === null) {
                addBlowProcs(dealer, null, event.procs);
                addBlowWithNoTarget(tallying, event.actorId, blow.amount, blow.kinds);
            } else {
                const target = addCombatantFigures(tallying.byCombatantId, event.targetId);
                addBlowTaken(target, event, blow);
                addBlowProcs(dealer, target, event.procs);
            }
            // Keep the wound a blow announced against whoever carries it: a tick arriving on the
            // same message is a later event, and finds it the freshest against that victim.
            const wound = lookupAnnouncedWound(event);
            if (wound !== null) tallying.woundByWoundedId.set(wound.woundedId, wound.standing);
            assert(
                tallying.woundByWoundedId.size <= COMBATANTS_MAXIMUM,
                "a fight stays inside its bound",
            );
        }
        if (event.kind === BATTLE_EVENT.damageToNamedCombatant) {
            // Add damage stated against a name to both its ends.
            // Already reduced where it is stated, so it has no raw half. It weighs into the
            // hardest blow at both ends and into no count of blows: of the 249 rows that took
            // damage over `captures/` on 2026-08-30, 149 are named by nothing else. ⚠️ **Where
            // nothing announced the blow it rode, it reaches the closing row's cut as well**
            // (`develop ADR 0081`); 0 of 1,175 such figures stand under no announcement there,
            // 2026-09-13.
            const amount = event.damage.amount;
            assert(
                Number.isSafeInteger(amount),
                "a figure totalled is a whole number",
            );
            assert(
                amount >= 0,
                "damage stated against a name is never below nothing",
            );
            if (event.actorId === null) tallying.damageDealtByNobody += amount;
            else {
                const dealer = addCombatantFigures(tallying.byCombatantId, event.actorId);
                addDamageDealtApplied(dealer, amount);
                dealer.damageDealtBlowLargest = composeBlowLargest(
                    dealer.damageDealtBlowLargest,
                    amount,
                );
                addToCut(dealer.damageDealtByKind, event.damage.element, amount);
                // The announcement is spent and the count of blows is not: a blow is a blow.
                if (event.announced !== null) {
                    const otherEndKey = getOtherEndKey(event.targetId);
                    addSkillDealt(dealer.skills, event.announced, amount, otherEndKey);
                } else if (event.targetId !== null) {
                    addToCut(
                        dealer.damageDealtWithoutSkillByOpponent,
                        `${event.targetId}`,
                        amount,
                    );
                }
                if (event.targetId !== null) {
                    addToCut(dealer.damageDealtByOpponent, `${event.targetId}`, amount);
                    addDamageFiguresToOtherEndCut(
                        dealer.damageDealtByOpponentAndKind,
                        `${event.targetId}`,
                        [event.damage],
                    );
                }
            }
            if (event.targetId === null) {
                addBlowWithNoTarget(tallying, event.actorId, amount, [event.damage]);
            } else {
                const target = addCombatantFigures(tallying.byCombatantId, event.targetId);
                addNamedDamageTaken(target, event, amount);
            }
        }
        if (event.kind === BATTLE_EVENT.healthChange) {
            // Add health moving outside a blow: the key says what restored it, and who gave it.
            assert(
                Number.isSafeInteger(event.amount),
                "a movement totalled is a whole number",
            );
            const lost = -event.amount;
            if (event.combatantId === null) {
                if (event.amount >= 0) addRestoredToNobody(tallying, event.amount);
                else {
                    tallying.damageTakenByNobody += lost;
                    tallying.damageDealtByNobody += lost;
                    tallying.damageByNeitherEnd += lost;
                    addToCut(tallying.damageByNeitherEndByKind, event.source, lost);
                }
            } else {
                const figures = addCombatantFigures(
                    tallying.byCombatantId,
                    event.combatantId,
                );
                const combatantId = event.combatantId;
                if (event.amount >= 0) addHealthRestored(tallying, figures, event, combatantId);
                else addHealthLost(tallying, figures, event, combatantId);
            }
        }
        if (event.kind === BATTLE_EVENT.healingToNamedCombatant) {
            // Add healing stated against a name to the one it names.
            assert(event.amount >= 0, "healing restored is never below nothing");
            if (event.targetId === null) addRestoredToNobody(tallying, event.amount);
            else {
                const figures = addCombatantFigures(
                    tallying.byCombatantId,
                    event.targetId,
                );
                figures.healthRestored += event.amount;
                addHealthRestoredBySource(
                    tallying,
                    event.targetId,
                    event.source,
                    event.amount,
                    null,
                );
                // No announcement to ask: this figure rides a blow struck at somebody else, so
                // the message's own actor is the attacker rather than the healer.
                const giverId = lookupGiverId(event.source, event.targetId, null);
                const stated = { source: event.source, announced: null };
                addHealthGiven(tallying, giverId, event.amount, event.targetId, stated);
                assert(
                    Number.isSafeInteger(figures.healthRestored),
                    "a total stays inside what a number holds exactly",
                );
            }
        }
        if (event.kind === BATTLE_EVENT.fightOutcome) {
            // Hold the fight's end: a later statement replaces an earlier one on its own side.
            // One message names the winners and another the losers, a draw is the winners' key
            // naming nobody, and an escape is a key of its own.
            const outcomeSoFar = tallying.outcome ??
                { wonNames: [], lostNames: [], isDrawn: false, isFled: false };
            assert(
                event.combatantNames.every((combatantName) => combatantName.length > 0),
                "a side named is named in full",
            );
            if (event.result === OUTCOME_RESULT.drawn) {
                tallying.outcome = { ...outcomeSoFar, isDrawn: true };
            }
            if (event.result === OUTCOME_RESULT.fled) {
                tallying.outcome = { ...outcomeSoFar, isFled: true };
            }
            if (event.result === OUTCOME_RESULT.won) {
                tallying.outcome = { ...outcomeSoFar, wonNames: [...event.combatantNames] };
            }
            if (event.result === OUTCOME_RESULT.lost) {
                tallying.outcome = { ...outcomeSoFar, lostNames: [...event.combatantNames] };
            }
            assert(tallying.outcome !== null, "a fight that stated its end holds one");
        }
        if (event.kind === BATTLE_EVENT.skillUsed) {
            // Count the use an announcement states, which a blow carrying it does not repeat.
            if (event.actorId !== null) {
                assert(
                    event.skillName.length > 0,
                    "an announcement names the skill it announces",
                );
                const skills = addCombatantFigures(tallying.byCombatantId, event.actorId).skills;
                const skillFigures = addSkillFigures(skills, event.skillName);
                skillFigures.uses += 1;
            }
        }
        // Count the turn the event opens: one with no actor named reaches no row, as blows do.
        {
            const openerId = lookupTurnOpener(event, tallying.turnStanding);
            tallying.turnStanding = composeTurnStanding(event, tallying.turnStanding);
            if (openerId !== null) {
                assert(
                    Number.isSafeInteger(openerId),
                    "a turn is charged to an id that was read",
                );
                const figures = addCombatantFigures(tallying.byCombatantId, openerId);
                figures.turnsTaken += 1;
            }
        }
        if (event.kind === BATTLE_EVENT.turnLost) {
            // Count the turn a combatant lost.
            if (event.combatantId !== null) {
                assert(
                    Number.isSafeInteger(event.combatantId),
                    "a turn is lost by an id that was read",
                );
                const figures = addCombatantFigures(
                    tallying.byCombatantId,
                    event.combatantId,
                );
                figures.turnsLost += 1;
            }
        }
    }
    assert(tallying.byCombatantId.size <= COMBATANTS_MAXIMUM, "a fight stays inside its bound");
    assert(countUnreadMessages(tallying) <= events.length, "a message is counted unread once");
    return {
        byCombatantId: tallying.byCombatantId,
        totals: tallyTotals(tallying.byCombatantId),
        damageDealtByNobody: tallying.damageDealtByNobody,
        damageTakenByNobody: tallying.damageTakenByNobody,
        healthGivenByNobody: tallying.healthGivenByNobody,
        healthRestoredToNobody: tallying.healthRestoredToNobody,
        damageByNeitherEnd: tallying.damageByNeitherEnd,
        damageByNeitherEndByKind: tallying.damageByNeitherEndByKind,
        unreadMessagesUnknownKey: tallying.unreadMessagesUnknownKey,
        unreadMessagesNoParameter: tallying.unreadMessagesNoParameter,
        unreadMessagesGrammarRefused: tallying.unreadMessagesGrammarRefused,
        sideHealsUnsized: tallying.sideHealsUnsized,
        sideHealsStated: tallying.sideHealsStated,
        outcome: tallying.outcome,
        legendaryBonuses: tallyLegendaryBonuses(events),
    };
}

/** Add the taking half of damage stated against a name, on the row it names. */
function addNamedDamageTaken(
    target: TallyingFigures,
    event: Readonly<DamageToNamedCombatantEvent>,
    amount: number,
): void {
    addDamageTakenApplied(target, amount);
    target.damageTakenBlowLargest = composeBlowLargest(
        target.damageTakenBlowLargest,
        amount,
    );
    addToCut(target.damageTakenByKind, event.damage.element, amount);
    if (event.actorId === null) {
        target.damageTakenFromNobody += amount;
        addToCut(
            target.damageTakenFromNobodyByKind,
            event.damage.element,
            amount,
        );
    } else {
        addToCut(target.damageTakenByOpponent, `${event.actorId}`, amount);
        addDamageFiguresToOtherEndCut(
            target.damageTakenByOpponentAndKind,
            `${event.actorId}`,
            [event.damage],
        );
        if (event.announced === null) {
            addToCut(
                target.damageTakenWithoutSkillByOpponent,
                `${event.actorId}`,
                amount,
            );
        }
    }
}

/** Add health a key restored to the row it names, and to whoever the key says gave it. */
function addHealthRestored(
    tallying: TallyingStatistics,
    figures: TallyingFigures,
    event: Readonly<HealthChangeEvent>,
    combatantId: number,
): void {
    figures.healthRestored += event.amount;
    addHealthRestoredBySource(
        tallying,
        combatantId,
        event.source,
        event.amount,
        event.announced,
    );
    if (event.announced !== null) {
        addSkillRestored(
            tallying,
            event.announced,
            event.amount,
            combatantId,
        );
    }
    const giverId = lookupGiverId(
        event.source,
        combatantId,
        event.announced,
    );
    const stated = { source: event.source, announced: event.announced };
    addHealthGiven(
        tallying,
        giverId,
        event.amount,
        combatantId,
        stated,
    );
}

/** Add health a key took off the row it names, and to whoever's wound it ticks for. */
function addHealthLost(
    tallying: TallyingStatistics,
    figures: TallyingFigures,
    event: Readonly<HealthChangeEvent>,
    combatantId: number,
): void {
    const lost = -event.amount;
    addDamageTakenApplied(figures, lost);
    // The key joins the kind cut, because a tick of poison is a kind of damage taken; and the cut
    // the skills section closes against, which is a different question.
    addToCut(figures.damageTakenByKind, event.source, lost);
    addToCut(figures.damageTakenWithoutSkillByKey, event.source, lost);
    const actorId = lookupWoundActorId(tallying, event);
    if (actorId === null) {
        figures.damageTakenFromNobody += lost;
        addToCut(figures.damageTakenFromNobodyByKind, event.source, lost);
        tallying.damageDealtByNobody += lost;
    } else {
        // Add the tick to both rows and a blow's cuts, not to a count of blows.
        const woundedId = combatantId;
        assert(lost > 0, "a wound ticking takes health off");
        assert(
            Number.isSafeInteger(lost),
            "a figure totalled is a whole number",
        );
        const tickFigures: DamageFigure[] = [{
            element: WOUND_TICK_KEY,
            amount: lost,
        }];
        const dealer = addCombatantFigures(
            tallying.byCombatantId,
            actorId,
        );
        addDamageDealtApplied(dealer, lost);
        addToCut(dealer.damageDealtByKind, WOUND_TICK_KEY, lost);
        addToCut(
            dealer.damageDealtWithoutSkillByKey,
            WOUND_TICK_KEY,
            lost,
        );
        addToCut(
            addCutForOtherEnd(
                dealer.damageDealtWithoutSkillByOpponentAndKey,
                `${woundedId}`,
            ),
            WOUND_TICK_KEY,
            lost,
        );
        addToCut(dealer.damageDealtByOpponent, `${woundedId}`, lost);
        addDamageFiguresToOtherEndCut(
            dealer.damageDealtByOpponentAndKind,
            `${woundedId}`,
            tickFigures,
        );
        const wounded = addCombatantFigures(tallying.byCombatantId, woundedId);
        addToCut(wounded.damageTakenByOpponent, `${actorId}`, lost);
        addDamageFiguresToOtherEndCut(
            wounded.damageTakenByOpponentAndKind,
            `${actorId}`,
            tickFigures,
        );
    }
    assert(
        figures.healthRestored >= 0,
        "a total of health restored never falls below nothing",
    );
}

/** Add the dealing half of the blow, on the row of whoever struck it. */
function addBlowDealt(dealer: TallyingFigures, event: AttackEvent, blow: BlowFigures): void {
    assert(
        blow.amount >= blow.applied,
        "a pool adds to what landed and never takes from it",
    );
    dealer.damageDealtRaw += blow.raw;
    dealer.damageDealtApplied += blow.applied;
    dealer.damageDealtAbsorbed += blow.absorbed;
    dealer.damageDealt += blow.amount;
    dealer.blowsStruck += 1;
    if (event.announced === null) {
        dealer.blowsWithoutSkill += 1;
        if (event.targetId !== null) {
            addToCut(
                dealer.damageDealtWithoutSkillByOpponent,
                `${event.targetId}`,
                blow.amount,
            );
        }
    } else {
        const otherEndKey = getOtherEndKey(event.targetId);
        addSkillDealt(dealer.skills, event.announced, blow.amount, otherEndKey);
        // Count the blow: a figure stated against a name is not one.
        {
            assert(
                event.announced.skillName.length > 0,
                "a blow is counted under the announcement named",
            );
            const skillFigures = addSkillFigures(
                dealer.skills,
                event.announced.skillName,
            );
            skillFigures.blows += 1;
        }
    }
    addDamageFiguresToCut(dealer.damageDealtByKind, blow.kinds);
    for (const absorbedPart of blow.absorbedParts) {
        addToCut(
            dealer.damageDealtAbsorbedByDefence,
            absorbedPart.defence,
            absorbedPart.amount,
        );
    }
    if (event.targetId !== null) {
        addToCut(
            dealer.damageDealtByOpponent,
            `${event.targetId}`,
            blow.amount,
        );
        addDamageFiguresToOtherEndCut(
            dealer.damageDealtByOpponentAndKind,
            `${event.targetId}`,
            blow.kinds,
        );
    }
    // Add what the blow says about who struck it, beyond the damage.
    {
        assert(blow.amount >= 0, "a blow lands no less than nothing");
        assert(
            event.destroyed.length <= MESSAGE_PARTS_MAXIMUM,
            "and destroys no more than one message is read to state",
        );
        dealer.damageDealtBlowLargest = composeBlowLargest(
            dealer.damageDealtBlowLargest,
            blow.amount,
        );
        if (isBlowCritical(event.procs)) dealer.blowsCritical += 1;
        for (const destroyed of event.destroyed) {
            addToCut(
                dealer.statisticsDestroyed,
                destroyed.statistic,
                destroyed.amount,
            );
        }
    }
}

/** Add the taking half of the blow, on the row of whoever it struck. */
function addBlowTaken(target: TallyingFigures, event: AttackEvent, blow: BlowFigures): void {
    assert(
        blow.amount >= blow.applied,
        "a pool adds to what landed and never takes from it",
    );
    target.damageTakenRaw += blow.raw;
    target.damageTakenApplied += blow.applied;
    target.damageTaken += blow.amount;
    addDamageFiguresToCut(target.damageTakenByKind, blow.kinds);
    if (event.actorId === null) {
        target.damageTakenFromNobody += blow.amount;
        addDamageFiguresToCut(target.damageTakenFromNobodyByKind, blow.kinds);
    } else {
        addToCut(
            target.damageTakenByOpponent,
            `${event.actorId}`,
            blow.amount,
        );
        addDamageFiguresToOtherEndCut(
            target.damageTakenByOpponentAndKind,
            `${event.actorId}`,
            blow.kinds,
        );
        if (event.announced === null) {
            addToCut(
                target.damageTakenWithoutSkillByOpponent,
                `${event.actorId}`,
                blow.amount,
            );
        }
    }
    // Add the sum a counter states and the cut a card draws, together.
    {
        assert(blow.amount >= 0, "a blow lands no less than nothing");
        target.damageTakenBlowLargest = composeBlowLargest(
            target.damageTakenBlowLargest,
            blow.amount,
        );
        for (const absorbedPart of blow.absorbedParts) {
            target.damageTakenAbsorbed += absorbedPart.amount;
            addToCut(
                target.damageTakenAbsorbedByDefence,
                absorbedPart.defence,
                absorbedPart.amount,
            );
        }
        for (const preventedPart of blow.preventedParts) {
            target.damagePrevented += preventedPart.amount;
            addToCut(
                target.damagePreventedByDefence,
                preventedPart.defence,
                preventedPart.amount,
            );
        }
    }
    assert(
        target.damageTaken >= 0,
        "a total of damage taken never falls below nothing",
    );
}

/**
 * The wound a blow announced against whoever carries it, the last one stated standing. Only a blow
 * naming both ends and a figure is kept: all 84 in `captures/` do, 2026-09-11 (`develop ADR 0022`).
 */
function lookupAnnouncedWound(
    event: Readonly<AttackEvent>,
): { woundedId: number; standing: WoundStanding } | null {
    const actorId = event.actorId;
    const woundedId = event.targetId;
    if (actorId === null) return null;
    if (woundedId === null) return null;
    let announcedWound: { woundedId: number; standing: WoundStanding } | null = null;
    for (const declared of event.declared) {
        if (declared.effect !== WOUND_ANNOUNCEMENT_KEY) continue;
        if (declared.amount === null) continue;
        // The figure is the game's: a wound announcing nothing is skipped, never asserted against.
        if (declared.amount <= 0) continue;
        announcedWound = { woundedId, standing: { actorId, amount: declared.amount } };
    }
    return announcedWound;
}

function addCombatantFigures(
    byCombatantId: Map<number, TallyingFigures>,
    combatantId: number,
): TallyingFigures {
    assert(Number.isSafeInteger(combatantId), "a row belongs to an id that was read");
    const existing = byCombatantId.get(combatantId);
    if (existing !== undefined) return existing;
    assert(byCombatantId.size < COMBATANTS_MAXIMUM, "a fight stays inside its stated bound");
    const figures = createCombatantFigures();
    byCombatantId.set(combatantId, figures);
    return figures;
}

/** A cast nobody could size, charged to whoever cast it. Nowhere, where nobody named them. */
function addUnplacedCast(tallying: TallyingStatistics, casterId: number | null): void {
    if (casterId === null) return;
    assert(Number.isSafeInteger(casterId), "a cast is charged to somebody the protocol named");
    const figures = addCombatantFigures(tallying.byCombatantId, casterId);
    figures.sideHealsUnsized += 1;
}

/**
 * The key, as the protocol wrote it, once for the whole of it and again for the part standing
 * behind no announcement. `getSkillOwnerId` is the one condition for both, as for the skill rows.
 */
function addHealthRestoredBySource(
    tallying: TallyingStatistics,
    healedId: number,
    source: string,
    amount: number,
    announced: AnnouncedSkill | null,
): void {
    assert(amount >= 0, "restored health is never below nothing");
    assert(source.length > 0, "and comes under a key the protocol named");
    const healed = addCombatantFigures(tallying.byCombatantId, healedId);
    addToCut(healed.healthRestoredByKey, source, amount);
    if (getSkillOwnerId(announced) !== null) return;
    addToCut(healed.healthRestoredWithoutSkillByKey, source, amount);
}

function addToCut(cut: Map<string, number>, key: string, amount: number): void {
    assert(key.length > 0, "a cut is kept under a name");
    cut.set(key, (cut.get(key) ?? 0) + amount);
    assert(cut.size <= CUT_MAXIMUM, "a cut stays inside its stated bound");
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

/**
 * The giving half of one movement, kept beside the receiving half so the two cannot drift. Where no
 * giver can be read the receiver's row keeps the amount as well, because that is the end the
 * protocol **did** name.
 */
function addHealthGiven(
    tallying: TallyingStatistics,
    giverId: number | null,
    amount: number,
    healedId: number,
    stated: { source: string; announced: AnnouncedSkill | null },
): void {
    assert(amount >= 0, "restored health is never below nothing");
    assert(stated.source.length > 0, "and comes under a key the protocol named");
    const healed = addCombatantFigures(tallying.byCombatantId, healedId);
    if (giverId === null) {
        tallying.healthGivenByNobody += amount;
        healed.healthRestoredByNobody += amount;
        addToCut(healed.healthRestoredByNobodyByKey, stated.source, amount);
        return;
    }
    addToCut(healed.healthRestoredByGiver, `${giverId}`, amount);
    const giver = addCombatantFigures(tallying.byCombatantId, giverId);
    giver.healthGiven += amount;
    addToCut(giver.healthGivenByReceiver, `${healedId}`, amount);
    if (getSkillOwnerId(stated.announced) !== null) return;
    const cut = addCutForOtherEnd(giver.healthGivenWithoutSkillByReceiverAndKey, `${healedId}`);
    addToCut(cut, stated.source, amount);
}

function addCutForOtherEnd(
    cut: Map<string, Map<string, number>>,
    otherEndKey: string,
): Map<string, number> {
    assert(otherEndKey.length > 0, "the other end of a movement is named before it is cut by");
    const cutForOtherEnd = cut.get(otherEndKey) ?? new Map<string, number>();
    cut.set(otherEndKey, cutForOtherEnd);
    assert(cut.size <= COMBATANTS_MAXIMUM, "a fight cuts by the people who are in it");
    return cutForOtherEnd;
}

function addSkillRestored(
    tallying: TallyingStatistics,
    announced: AnnouncedSkill,
    amount: number,
    healedId: number,
): void {
    assert(amount >= 0, "restored health is never below nothing");
    assert(announced.skillName.length > 0, "and the announcement behind it is named");
    const ownerId = getSkillOwnerId(announced);
    if (ownerId === null) return;
    const skills = addCombatantFigures(tallying.byCombatantId, ownerId).skills;
    const skillFigures = addSkillFigures(skills, announced.skillName);
    skillFigures.healthGiven += amount;
    addToCut(skillFigures.healthGivenByReceiver, `${healedId}`, amount);
}

/**
 * A skill is kept under its **name** rather than its id: 346 of the 3,349 announcements over
 * `captures/` on 2026-08-29 carry no id, and a row keyed by nothing merges two skills.
 */
function addSkillFigures(
    skills: Map<string, TallyingSkillFigures>,
    name: string,
): TallyingSkillFigures {
    assert(name.length > 0, "a skill is kept under the name it was announced by");
    const skillFigures = skills.get(name) ?? {
        name,
        uses: 0,
        damageDealt: 0,
        blows: 0,
        damageDealtByOpponent: new Map(),
        healthGiven: 0,
        healthGivenByReceiver: new Map(),
    };
    skills.set(name, skillFigures);
    assert(skills.size <= SKILLS_MAXIMUM, "a fight states no more skills than it is bounded to");
    return skillFigures;
}

/**
 * A pool's part joins the kind cut under the defence's own name, beside the elements: one blow
 * lands in several elements and the protocol states one figure per pool, so no element is ever
 * credited with any of it (ADR 0012).
 */
function tallyBlowFigures(event: AttackEvent): BlowFigures {
    const raw = tallyDamageAmounts(event.raw);
    const applied = tallyDamageAmounts(event.applied);
    assert(raw >= 0, "a blow puts out no less than nothing");
    assert(applied >= 0, "and lands no less than nothing");
    assert(event.prevented.length <= MESSAGE_PARTS_MAXIMUM, "and is stopped as far as it is read");
    const kinds = [...event.applied];
    const absorbedParts: PreventedDamage[] = [];
    const preventedParts: PreventedDamage[] = [];
    let absorbed = 0;
    for (const stopped of event.prevented) {
        if (getDefenceMechanism(stopped.defence) === DEFENCE_MECHANISM.pool) {
            absorbedParts.push(stopped);
            kinds.push({ element: stopped.defence, amount: stopped.amount });
            absorbed += stopped.amount;
        } else preventedParts.push(stopped);
    }
    assert(Number.isSafeInteger(absorbed), "a total stays inside what a number holds exactly");
    assert(
        absorbedParts.length + preventedParts.length === event.prevented.length,
        "every defence either drained a pool or drained nothing",
    );
    const amount = applied + absorbed;
    return { raw, applied, absorbed, amount, kinds, absorbedParts, preventedParts };
}

function tallyDamageAmounts(figures: readonly DamageFigure[]): number {
    let total = 0;
    for (const figure of figures) {
        assert(Number.isSafeInteger(figure.amount), "a figure totalled is a whole number");
        total += figure.amount;
    }
    assert(Number.isSafeInteger(total), "a total stays inside what a number holds exactly");
    return total;
}

function addSkillDealt(
    skills: Map<string, TallyingSkillFigures>,
    announced: AnnouncedSkill,
    amount: number,
    otherEndKey: string | null,
): void {
    assert(amount >= 0, "what a blow lands is never below nothing");
    assert(announced.skillName.length > 0, "and the announcement in front of it is named");
    const skillFigures = addSkillFigures(skills, announced.skillName);
    skillFigures.damageDealt += amount;
    if (otherEndKey !== null) addToCut(skillFigures.damageDealtByOpponent, otherEndKey, amount);
}

/** The other end of a blow as a cut is keyed, or null where the protocol named nobody. */
function getOtherEndKey(targetId: number | null): string | null {
    if (targetId === null) return null;
    assert(Number.isSafeInteger(targetId), "an end the protocol named is named by a number");
    return `${targetId}`;
}

function addDamageFiguresToOtherEndCut(
    cut: Map<string, Map<string, number>>,
    otherEndKey: string,
    figures: readonly DamageFigure[],
): void {
    const cutForOtherEnd = addCutForOtherEnd(cut, otherEndKey);
    for (const figure of figures) addToCut(cutForOtherEnd, figure.element, figure.amount);
}

/** Two blows of five thousand and one of nine total the same and are not the same fight. */
function composeBlowLargest(largestSoFar: number, amount: number): number {
    assert(largestSoFar >= 0, "the hardest blow so far landed no less than nothing");
    assert(amount >= 0, "and neither did the one being weighed against it");
    return Math.max(largestSoFar, amount);
}

function isBlowCritical(procs: readonly string[]): boolean {
    assert(procs.length <= MESSAGE_PARTS_MAXIMUM, "a blow fires no more procs than it is read to");
    return procs.some((key) => CRITICAL_PROC_KEYS.includes(key));
}

/**
 * What fired beside the blow, on the row of whoever it belongs to. A key whose end is `unsettled`
 * reaches neither row: a row charged with one would be this file guessing.
 */
function addBlowProcs(
    dealer: TallyingFigures | null,
    target: TallyingFigures | null,
    procs: readonly string[],
): void {
    assert(procs.length <= MESSAGE_PARTS_MAXIMUM, "a blow fires no more procs than it is read to");
    for (const key of procs) {
        const keyMeaning = lookupKeyMeaning(key);
        assert(keyMeaning !== null, "a proc the decoder stated is a key the table reads");
        assert(keyMeaning.kind === KEY_FAMILY.proc, "and one it places as a proc");
        if (keyMeaning.end === PROC_END.actor) {
            if (dealer !== null) addToCut(dealer.procsWhenStriking, key, 1);
        }
        if (keyMeaning.end === PROC_END.target) {
            if (target !== null) addToCut(target.procsWhenStruck, key, 1);
        }
    }
}

/**
 * A blow the protocol found no target for. Where it names no actor either, nobody's row holds it
 * and no side can be charged with it: it is counted apart rather than folded into either count.
 */
function addBlowWithNoTarget(
    tallying: TallyingStatistics,
    actorId: number | null,
    amount: number,
    kinds: readonly DamageFigure[],
): void {
    assert(amount >= 0, "a blow lands no less than nothing");
    tallying.damageTakenByNobody += amount;
    if (actorId === null) {
        tallying.damageByNeitherEnd += amount;
        addDamageFiguresToCut(tallying.damageByNeitherEndByKind, kinds);
        return;
    }
    const dealer = addCombatantFigures(tallying.byCombatantId, actorId);
    dealer.damageDealtToNobody += amount;
    addDamageFiguresToCut(dealer.damageDealtToNobodyByKind, kinds);
}

function addDamageFiguresToCut(cut: Map<string, number>, kinds: readonly DamageFigure[]): void {
    // A blow's kinds are what it applied and what drained a pool, each bounded where it was read.
    assert(kinds.length <= MESSAGE_PARTS_MAXIMUM * 2, "a blow carries its kinds inside the bound");
    for (const kind of kinds) {
        assert(kind.amount >= 0, "a kind of a blow lands no less than nothing");
        addToCut(cut, kind.element, kind.amount);
    }
}

/** Health taken off outside a pool: into the figure drawn and the one the percentages witness. */
function addDamageDealtApplied(dealer: TallyingFigures, amount: number): void {
    assert(amount >= 0, "health taken off is never below nothing");
    dealer.damageDealtApplied += amount;
    dealer.damageDealt += amount;
    assert(dealer.damageDealt >= dealer.damageDealtApplied, "health is a part of what was dealt");
}

function addDamageTakenApplied(target: TallyingFigures, amount: number): void {
    assert(amount >= 0, "health taken off is never below nothing");
    target.damageTakenApplied += amount;
    target.damageTaken += amount;
    assert(target.damageTaken >= target.damageTakenApplied, "health is a part of what was taken");
}

/**
 * Health the protocol says came back, to nobody it named. **Counted rather than dropped**, and
 * charged to no side, because the end that would decide one is the end that is missing
 * (`develop ADR 0082`).
 */
function addRestoredToNobody(tallying: TallyingStatistics, amount: number): void {
    assert(amount >= 0, "health that came back never came back below nothing");
    tallying.healthRestoredToNobody += amount;
    assert(
        Number.isSafeInteger(tallying.healthRestoredToNobody),
        "a total stays inside what a number holds exactly",
    );
}

/**
 * Who put the health back: whoever announced it, or the one healed where the key is theirs on the
 * published help's word. No point of the 3,755,729 restored across `captures/` on
 * 2026-08-30 is left without a giver.
 */
function lookupGiverId(
    source: string,
    healedId: number,
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
 * Whose wound a tick belongs to, or nobody. The freshest wound against that victim is the one
 * ticking, and a tick states the figure that wound announced (`develop ADR 0022`) — or that figure
 * weakened by the percentage it states beside it, rounded up.
 */
function lookupWoundActorId(tallying: TallyingStatistics, event: HealthChangeEvent): number | null {
    if (event.source !== WOUND_TICK_KEY) return null;
    if (event.combatantId === null) return null;
    const wound = tallying.woundByWoundedId.get(event.combatantId);
    if (wound === undefined) return null;
    assert(wound.amount > 0, "a wound kept announced a figure");
    let woundTicking: number;
    if (event.declared.length > 0) {
        // One weakening at most: the client splits the value into two members and no more.
        if (event.declared.length > 1) return null;
        const weakeningPercent = event.declared[0]?.amount ?? null;
        if (weakeningPercent === null) return null;
        if (weakeningPercent < 0) return null;
        // Weakened by all of it, a tick would state nothing, and none does.
        if (weakeningPercent >= PERCENT_WHOLE) return null;
        // Rounded up: all 23 ticks weakened by 10 in `captures/` are, and 737 → 664 rules out
        // rounding to nearest (`2026-10-04-tempest-grupa-vs-umibozu`, 2026-10-04).
        woundTicking = Math.ceil(
            (wound.amount * (PERCENT_WHOLE - weakeningPercent)) / PERCENT_WHOLE,
        );
    } else {
        woundTicking = wound.amount;
    }
    assert(woundTicking > 0, "a wound ticks for something, weakened or whole");
    if (woundTicking !== -event.amount) return null;
    assert(Number.isSafeInteger(wound.actorId), "a wound was left by somebody named");
    return wound.actorId;
}

function tallyTotals(byCombatantId: ReadonlyMap<number, TallyingFigures>): FightTotals {
    const totals: FightTotals = {
        damageDealt: 0,
        damageTaken: 0,
        damageDealtRaw: 0,
        damageDealtApplied: 0,
        damageTakenRaw: 0,
        damageTakenApplied: 0,
        damageDealtAbsorbed: 0,
        damageTakenAbsorbed: 0,
        damagePrevented: 0,
        healthRestored: 0,
        healthGiven: 0,
    };
    for (const figures of byCombatantId.values()) {
        for (const field of TOTALLED_FIELDS) totals[field] += figures[field];
    }
    assert(totals.damageDealt >= totals.damageDealtApplied, "health is a part of what was dealt");
    assert(totals.healthRestored >= 0, "a total of health restored never runs below nought");
    return totals;
}

/** The balances in one place: assertions only. */
export function verifyFightStatistics(statistics: FightStatistics): void {
    assert(
        tallyDealtTakenImbalance(statistics) === 0,
        "every point dealt is counted once at each end",
    );
    assert(
        tallyDamagePartsImbalance(statistics) === 0,
        "and every point dealt or taken reached health or drained a pool",
    );
    assert(
        tallyRestoredGivenImbalance(statistics) === 0,
        "and every point restored once at each of its own",
    );
    assert(
        tallyHalfNamedRowsImbalance(statistics) === 0,
        "and every half-named point is on the row it named",
    );
    assert(tallyHalfNamedCutsImbalance(statistics) === 0, "and under the key it was stated with");
    assert(
        tallyDefenceCutsImbalance(statistics) === 0,
        "and what the defences stopped is stopped by one of them",
    );
    for (const figures of statistics.byCombatantId.values()) verifyDefenceMechanisms(figures);
}

/** The negative space of the defence cuts: a pool is never prevented, a chance never absorbed. */
function verifyDefenceMechanisms(figures: CombatantFigures): void {
    for (const defence of figures.damagePreventedByDefence.keys()) {
        const mechanism = getDefenceMechanism(defence);
        assert(mechanism === DEFENCE_MECHANISM.chance, "what was prevented drained no pool");
    }
    for (const defence of figures.damageDealtAbsorbedByDefence.keys()) {
        const mechanism = getDefenceMechanism(defence);
        assert(mechanism === DEFENCE_MECHANISM.pool, "what was absorbed drained a pool");
    }
    for (const defence of figures.damageTakenAbsorbedByDefence.keys()) {
        const mechanism = getDefenceMechanism(defence);
        assert(mechanism === DEFENCE_MECHANISM.pool, "what was absorbed drained a pool");
    }
}

/**
 * Damage is stated once and lands twice, on whoever dealt it and on whoever took it, so the two
 * sides must come out equal, with what the log tied to nobody standing in on either.
 */
function tallyDealtTakenImbalance(statistics: FightStatistics): number {
    let dealt = statistics.damageDealtByNobody;
    let taken = statistics.damageTakenByNobody;
    for (const figures of statistics.byCombatantId.values()) {
        dealt += figures.damageDealt;
        taken += figures.damageTaken;
    }
    assert(Number.isSafeInteger(dealt), "a total stays inside what a number holds exactly");
    assert(Number.isSafeInteger(taken), "a total stays inside what a number holds exactly");
    return dealt - taken;
}

/** Each row's damage against the two things it is made of: health, and what a pool took. */
function tallyDamagePartsImbalance(statistics: FightStatistics): number {
    let imbalance = 0;
    for (const figures of statistics.byCombatantId.values()) {
        const dealt = figures.damageDealtApplied + figures.damageDealtAbsorbed;
        const taken = figures.damageTakenApplied + figures.damageTakenAbsorbed;
        imbalance += Math.abs(figures.damageDealt - dealt) + Math.abs(figures.damageTaken - taken);
    }
    assert(Number.isSafeInteger(imbalance), "a total stays inside what a number holds exactly");
    return imbalance;
}

/** The same equation on health put back: once stated, landing on giver and receiver. */
function tallyRestoredGivenImbalance(statistics: FightStatistics): number {
    let restored = 0;
    let given = statistics.healthGivenByNobody;
    for (const figures of statistics.byCombatantId.values()) {
        restored += figures.healthRestored;
        given += figures.healthGiven;
    }
    assert(Number.isSafeInteger(restored), "a total stays inside what a number holds exactly");
    assert(Number.isSafeInteger(given), "a total stays inside what a number holds exactly");
    return restored - given;
}

/**
 * What the fight-wide counts hold, against what the rows they were read off hold: each is the sum
 * of one field across the rows plus what named neither end, and nothing else.
 */
function tallyHalfNamedRowsImbalance(statistics: FightStatistics): number {
    let takenFromNobody = 0;
    let dealtToNobody = 0;
    let restoredByNobody = 0;
    for (const figures of statistics.byCombatantId.values()) {
        takenFromNobody += figures.damageTakenFromNobody;
        dealtToNobody += figures.damageDealtToNobody;
        restoredByNobody += figures.healthRestoredByNobody;
    }
    assert(statistics.damageByNeitherEnd >= 0, "what names neither end is never below nothing");
    const dealt = statistics.damageDealtByNobody - takenFromNobody - statistics.damageByNeitherEnd;
    const taken = statistics.damageTakenByNobody - dealtToNobody - statistics.damageByNeitherEnd;
    const given = statistics.healthGivenByNobody - restoredByNobody;
    return Math.abs(dealt) + Math.abs(taken) + Math.abs(given);
}

/** What each half-named figure was made of, against the figure itself. */
function tallyHalfNamedCutsImbalance(statistics: FightStatistics): number {
    let imbalance = tallyCutImbalance(
        statistics.damageByNeitherEnd,
        statistics.damageByNeitherEndByKind,
    );
    for (const figures of statistics.byCombatantId.values()) {
        const takenCut = figures.damageTakenFromNobodyByKind;
        const dealtCut = figures.damageDealtToNobodyByKind;
        const restoredCut = figures.healthRestoredByNobodyByKey;
        imbalance += tallyCutImbalance(figures.damageTakenFromNobody, takenCut);
        imbalance += tallyCutImbalance(figures.damageDealtToNobody, dealtCut);
        imbalance += tallyCutImbalance(figures.healthRestoredByNobody, restoredCut);
    }
    assert(imbalance >= 0, "a difference counted as a distance is never below nothing");
    return imbalance;
}

function tallyCutImbalance(figure: number, cut: ReadonlyMap<string, number>): number {
    assert(figure >= 0, "a figure being cut is never below nothing");
    assert(cut.size <= CUT_MAXIMUM, "and is cut inside the stated bound");
    let cutTotal = 0;
    for (const amount of cut.values()) cutTotal += amount;
    assert(Number.isSafeInteger(cutTotal), "a total stays inside what a number holds exactly");
    return Math.abs(figure - cutTotal);
}

/** What the defences stopped, against the one number a counter states for each kind of them. */
function tallyDefenceCutsImbalance(statistics: FightStatistics): number {
    let imbalance = 0;
    for (const figures of statistics.byCombatantId.values()) {
        imbalance += tallyCutImbalance(figures.damagePrevented, figures.damagePreventedByDefence);
        imbalance += tallyCutImbalance(
            figures.damageDealtAbsorbed,
            figures.damageDealtAbsorbedByDefence,
        );
        imbalance += tallyCutImbalance(
            figures.damageTakenAbsorbed,
            figures.damageTakenAbsorbedByDefence,
        );
    }
    assert(imbalance >= 0, "a difference counted as a distance is never below nothing");
    return imbalance;
}
