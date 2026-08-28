/**
 * The figures a panel draws, and nothing a panel could compute for itself.
 *
 * Raw and applied are kept apart: their difference is not what a defence stopped, and adding one
 * to the other would total a blow twice. What the log ties to nobody is kept apart too, so a
 * reader can see the size of what could not be placed instead of finding it folded into a row.
 */

import { assert } from "@std/assert";
import type { BattleEvent, DamageFigure } from "@/src/core/battle-event.ts";
import type { TeamHeal } from "@/src/core/combatant-health.ts";

/** A side holds at most ten, so a fight holds twenty. The largest in `captures/` is 11. */
const MAXIMUM_COMBATANTS = 20;

/** A figure cut by something the protocol named: an element, or the other end of the blow. */
export type FigureCut = ReadonlyMap<string, number>;

export interface CombatantFigures {
    damageDealtRaw: number;
    damageDealtApplied: number;
    damageTakenRaw: number;
    damageTakenApplied: number;
    damagePrevented: number;
    /** Health restored to this combatant. Who gave it is not read here. */
    healthRestored: number;
    /**
     * The same applied damage, cut by what it was dealt with and by whom it was dealt to. A cut
     * is the panel's to fold and never to compute: adding one row's figure to another's is a
     * statistic across combatants, and these are one combatant's own.
     */
    damageDealtByElement: Map<string, number>;
    damageTakenByElement: Map<string, number>;
    damageDealtByOpponent: Map<string, number>;
    damageTakenByOpponent: Map<string, number>;
}

export interface FightStatistics {
    byCombatantId: ReadonlyMap<number, CombatantFigures>;
    /**
     * The fight's own sums. Here rather than left to a panel, because adding one row's figure to
     * another's is a statistic across combatants and the panel draws rather than aggregates.
     */
    totals: CombatantFigures;
    /** Applied damage the protocol tied to no actor, and to no target. */
    dealtByNobody: number;
    takenByNobody: number;
    /** Messages the decoder could not read, which is what makes a total suspect. */
    unreadMessages: number;
    /** Casts stated about a side that nobody could size onto its members, whole or in part. */
    castsUnplaced: number;
}

function composeCombatantFigures(): CombatantFigures {
    // A row starts at nothing, and nothing is a reading rather than an absence.
    return {
        damageDealtRaw: 0,
        damageDealtApplied: 0,
        damageTakenRaw: 0,
        damageTakenApplied: 0,
        damagePrevented: 0,
        healthRestored: 0,
        damageDealtByElement: new Map(),
        damageTakenByElement: new Map(),
        damageDealtByOpponent: new Map(),
        damageTakenByOpponent: new Map(),
    };
}

/** The largest cut in `captures/` holds ten elements against twenty combatants, 2026-08-28. */
const MAXIMUM_CUT = 64;

function addToCut(cut: Map<string, number>, key: string, amount: number): void {
    assert(key.length > 0, "a cut is kept under a name");
    assert(cut.size <= MAXIMUM_CUT, "a cut stays inside its stated bound");
    cut.set(key, (cut.get(key) ?? 0) + amount);
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
    unreadMessages: number;
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
        for (const figure of event.applied) {
            addToCut(dealer.damageDealtByElement, figure.element, figure.amount);
        }
        if (event.targetId !== null) {
            addToCut(dealer.damageDealtByOpponent, `${event.targetId}`, applied);
        }
    }
    if (event.targetId === null) {
        build.takenByNobody += applied;
        return;
    }
    const target = getFiguresForCombatant(build.byCombatantId, event.targetId);
    target.damageTakenRaw += raw;
    target.damageTakenApplied += applied;
    for (const figure of event.applied) {
        addToCut(target.damageTakenByElement, figure.element, figure.amount);
    }
    if (event.actorId !== null) addToCut(target.damageTakenByOpponent, `${event.actorId}`, applied);
    for (const stopped of event.prevented) target.damagePrevented += stopped.amount;
    assert(target.damageTakenApplied >= 0, "a total of applied damage never falls below nothing");
}

/** Already reduced where it is stated, so it has no raw half to keep apart from. */
function addNamedDamageEvent(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== "damage-to-named-combatant") return;
    const amount = event.damage.amount;
    assert(Number.isSafeInteger(amount), "a figure totalled is a whole number");
    assert(amount >= 0, "damage stated against a name is never below nothing");
    if (event.actorId === null) build.dealtByNobody += amount;
    else {
        const dealer = getFiguresForCombatant(build.byCombatantId, event.actorId);
        dealer.damageDealtApplied += amount;
        addToCut(dealer.damageDealtByElement, event.damage.element, amount);
        if (event.targetId !== null) {
            addToCut(dealer.damageDealtByOpponent, `${event.targetId}`, amount);
        }
    }
    if (event.targetId === null) {
        build.takenByNobody += amount;
        return;
    }
    const target = getFiguresForCombatant(build.byCombatantId, event.targetId);
    target.damageTakenApplied += amount;
    addToCut(target.damageTakenByElement, event.damage.element, amount);
    if (event.actorId !== null) addToCut(target.damageTakenByOpponent, `${event.actorId}`, amount);
}

/**
 * Health moving outside a blow. What restored it is the key, and who did is not in the message,
 * so nothing is credited with giving it here.
 */
function addHealthChangeEvent(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== "health-change") return;
    assert(Number.isSafeInteger(event.amount), "a movement totalled is a whole number");
    if (event.combatantId === null) {
        if (event.amount >= 0) return;
        build.takenByNobody += -event.amount;
        build.dealtByNobody += -event.amount;
        return;
    }
    const figures = getFiguresForCombatant(build.byCombatantId, event.combatantId);
    if (event.amount >= 0) {
        figures.healthRestored += event.amount;
        return;
    }
    figures.damageTakenApplied += -event.amount;
    build.dealtByNobody += -event.amount;
    assert(figures.healthRestored >= 0, "a total of health restored never falls below nothing");
}

function addNamedHealingEvent(build: StatisticsBuild, event: BattleEvent): void {
    if (event.kind !== "healing-to-named-combatant") return;
    assert(event.amount >= 0, "healing restored is never below nothing");
    if (event.targetId === null) return;
    const figures = getFiguresForCombatant(build.byCombatantId, event.targetId);
    figures.healthRestored += event.amount;
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
        unreadMessages: 0,
        castsUnplaced: 0,
    };
    assert(events.length >= 0, "a fight decodes to a list");
    for (const event of events) {
        if (event.kind === "unknown-message") build.unreadMessages += 1;
        if (event.kind === "unaccounted-health") addTeamHeal(build, heals.get(event));
        addAttackEvent(build, event);
        addNamedDamageEvent(build, event);
        addHealthChangeEvent(build, event);
        addNamedHealingEvent(build, event);
    }
    assert(build.byCombatantId.size <= MAXIMUM_COMBATANTS, "a fight stays inside its bound");
    assert(build.unreadMessages <= events.length, "a message is counted unread once");
    assert(getAppliedBalance(build) === 0, "every point applied is counted once at each end");
    return {
        byCombatantId: build.byCombatantId,
        totals: composeTotals(build),
        dealtByNobody: build.dealtByNobody,
        takenByNobody: build.takenByNobody,
        unreadMessages: build.unreadMessages,
        castsUnplaced: build.castsUnplaced,
    };
}
