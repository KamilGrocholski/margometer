/**
 * The counted half of what a reader hands over: the figures of one fight, written into the
 * recording beside the calls they were derived from.
 *
 * English keys, unlike the envelope around them: a key here is one somebody can grep for in
 * `src/core/fight-statistics.ts`, which a translation could not be (**L2**). What qualifies the
 * numbers stands in the envelope and is never repeated here. **ADR 0027.**
 */

import { assert } from "@std/assert/assert";
import { composeIntegerText } from "@/libs/number-text.ts";
import type {
    CombatantFigures,
    FightStatistics,
    SkillFigures,
} from "@/src/core/fight-statistics.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import type { FightPlace } from "@/src/game/engine-place.ts";

export interface ReportSubject {
    statistics: FightStatistics;
    roster: CombatantRoster;
    /** Where it was fought, as the client stated it rather than as the bar words it. */
    place: FightPlace | null;
    payloads: number;
    /** Messages a payload said it carried and the session did not read. Zero is the answer. */
    messagesLost: number;
    isOver: boolean;
}

/**
 * ⚠️ **Keyed off `CombatantFigures` rather than listed out**, which is what makes the compiler
 * hold this complete: a figure added to the aggregate stops the build here until somebody decides
 * how it is written down. A report is what a reader hands over when a number looks wrong, so a
 * figure added there and missed here would be absent in exactly the situation it exists for.
 */
interface ReportSkill {
    name: string;
    uses: number;
    dealt: number;
    dealtByOpponent: Record<string, number>;
    restored: number;
    restoredByOpponent: Record<string, number>;
}

type ReportRow = {
    [Key in keyof CombatantFigures]: CombatantFigures[Key] extends number ? number
        : CombatantFigures[Key] extends Map<string, number> ? Record<string, number>
        : CombatantFigures[Key] extends Map<string, Map<string, number>>
            ? Record<string, Record<string, number>>
        : Record<string, ReportSkill>;
};

export function composeReportFight(subject: ReportSubject): Record<string, unknown> {
    assert(subject.payloads > 0, "a fight written into a report was built from something");
    assert(subject.messagesLost >= 0, "and lost no fewer than none of what it was handed");
    return {
        payloads: subject.payloads,
        isOver: subject.isOver,
        place: subject.place,
        // Beside each other and never added together: one says what never reached the decoder,
        // the other what the decoder could not make sense of, and which of the two somebody has
        // to go and look at is the difference a single number would lose.
        messagesLost: subject.messagesLost,
        unreadMessages: subject.statistics.unreadMessages,
        castsUnplaced: subject.statistics.castsUnplaced,
        dealtByNobody: subject.statistics.dealtByNobody,
        takenByNobody: subject.statistics.takenByNobody,
        givenByNobody: subject.statistics.givenByNobody,
        roster: [...subject.roster.byId.values()],
        combatants: composeReportCombatants(subject.statistics),
        totals: composeReportRow(subject.statistics.totals),
    };
}

/**
 * The roster is written out beside this rather than folded into it: a report that merged them
 * would lose the combatant nothing has named yet — who is on the panel as a row of zeroes.
 */
function composeReportCombatants(statistics: FightStatistics): Record<string, ReportRow> {
    const written: Record<string, ReportRow> = {};
    for (const [id, figures] of statistics.byCombatantId) {
        assert(Number.isSafeInteger(id), "a row belongs to an id that was read");
        written[composeIntegerText(id)] = composeReportRow(figures);
    }
    assert(
        Object.keys(written).length === statistics.byCombatantId.size,
        "a report holds a row for each combatant the aggregate counted",
    );
    return written;
}

function composeReportRow(figures: CombatantFigures): ReportRow {
    assert(figures.damageDealtRaw >= 0, "a figure written into a report is never below nothing");
    assert(figures.healthRestored >= 0, "what was put back included");
    return {
        unreadMessages: figures.unreadMessages,
        castsUnplaced: figures.castsUnplaced,
        damageDealtRaw: figures.damageDealtRaw,
        damageDealtApplied: figures.damageDealtApplied,
        damageTakenRaw: figures.damageTakenRaw,
        damageTakenApplied: figures.damageTakenApplied,
        damagePrevented: figures.damagePrevented,
        healthRestored: figures.healthRestored,
        healthGiven: figures.healthGiven,
        damageTakenFromNobody: figures.damageTakenFromNobody,
        damageDealtToNobody: figures.damageDealtToNobody,
        healthRestoredByNobody: figures.healthRestoredByNobody,
        damageTakenFromNobodyByElement: composeReportCut(figures.damageTakenFromNobodyByElement),
        damageDealtToNobodyByElement: composeReportCut(figures.damageDealtToNobodyByElement),
        healthRestoredByNobodyBySource: composeReportCut(figures.healthRestoredByNobodyBySource),
        healthRestoredByGiver: composeReportCut(figures.healthRestoredByGiver),
        healthGivenByReceiver: composeReportCut(figures.healthGivenByReceiver),
        healthRestoredBySource: composeReportCut(figures.healthRestoredBySource),
        healthRestoredWithoutSkillBySource: composeReportCut(
            figures.healthRestoredWithoutSkillBySource,
        ),
        healthGivenWithoutSkillByReceiverAndSource: composeReportPairCut(
            figures.healthGivenWithoutSkillByReceiverAndSource,
        ),
        damageDealtByElement: composeReportCut(figures.damageDealtByElement),
        damageTakenByElement: composeReportCut(figures.damageTakenByElement),
        damageDealtByOpponent: composeReportCut(figures.damageDealtByOpponent),
        damageTakenByOpponent: composeReportCut(figures.damageTakenByOpponent),
        damageDealtByOpponentAndKind: composeReportPairCut(figures.damageDealtByOpponentAndKind),
        damageTakenByOpponentAndKind: composeReportPairCut(figures.damageTakenByOpponentAndKind),
        skills: composeReportSkills(figures.skills),
        blowsStruck: figures.blowsStruck,
        blowsWithoutSkill: figures.blowsWithoutSkill,
        turnsTaken: figures.turnsTaken,
        turnsLost: figures.turnsLost,
        blowsCritical: figures.blowsCritical,
        damageDealtBlowLargest: figures.damageDealtBlowLargest,
        damageTakenBlowLargest: figures.damageTakenBlowLargest,
        procsWhenStriking: composeReportCut(figures.procsWhenStriking),
        procsWhenStruck: composeReportCut(figures.procsWhenStruck),
        damagePreventedByDefence: composeReportCut(figures.damagePreventedByDefence),
        statisticsDestroyed: composeReportCut(figures.statisticsDestroyed),
    };
}

function composeReportSkills(
    skills: ReadonlyMap<string, SkillFigures>,
): Record<string, ReportSkill> {
    const written: Record<string, ReportSkill> = {};
    for (const [key, skill] of skills) {
        assert(key.length > 0, "a skill is kept under the name it was announced by");
        written[key] = {
            name: skill.name,
            uses: skill.uses,
            dealt: skill.dealt,
            dealtByOpponent: composeReportCut(skill.dealtByOpponent),
            restored: skill.restored,
            restoredByOpponent: composeReportCut(skill.restoredByOpponent),
        };
    }
    assert(Object.keys(written).length === skills.size, "and every one of them is written down");
    return written;
}

function composeReportPairCut(
    cut: ReadonlyMap<string, ReadonlyMap<string, number>>,
): Record<string, Record<string, number>> {
    const written: Record<string, Record<string, number>> = {};
    for (const [key, held] of cut) {
        assert(key.length > 0, "a cut of a cut is kept under a name");
        written[key] = composeReportCut(held);
    }
    assert(Object.keys(written).length === cut.size, "and every one of them is written down");
    return written;
}

/** A cut as an object, because JSON holds no map and a report is read as text. */
function composeReportCut(cut: ReadonlyMap<string, number>): Record<string, number> {
    const written: Record<string, number> = {};
    for (const [key, amount] of cut) {
        assert(key.length > 0, "a cut of a figure is kept under a name");
        written[key] = amount;
    }
    assert(Object.keys(written).length === cut.size, "and every one of them is written down");
    return written;
}
