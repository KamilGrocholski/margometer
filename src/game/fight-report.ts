/**
 * The fight as something a reader can paste into a report, beside the screenshot it arrived with.
 *
 * English keys, unlike the recording beside it: a key here is one somebody can grep for in
 * `src/core/fight-statistics.ts`, which a translation could not be (**L2**). Everything
 * qualifying the numbers travels with them — a figure without its build, its world and what could
 * not be read is a figure nobody can act on.
 */

import { assert } from "@std/assert";
import { composeJsonText } from "@/src/core/unknown-reading.ts";
import { BUILD_VERSION } from "@/src/build-version.ts";
import type { CombatantFigures, FightStatistics } from "@/src/core/fight-statistics.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import type { FightPlace } from "@/src/game/engine-place.ts";
import type { CaptureSurroundings } from "@/src/game/fight-capture.ts";

/** So a difference between two pasted reports is something a person can read. */
const INDENT_SPACES = 2;
const ADD_ON_NAME = "MargoMeter";

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
 * how it is written down. A report is what a reader pastes when a number looks wrong, so a figure
 * added there and missed here would be absent in exactly the situation the report exists for.
 */
type ReportRow = {
    [Key in keyof CombatantFigures]: CombatantFigures[Key] extends number ? number
        : Record<string, number>;
};

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

function composeReportRow(figures: CombatantFigures): ReportRow {
    assert(figures.damageDealtRaw >= 0, "a figure written into a report is never below nothing");
    assert(figures.healthRestored >= 0, "what was put back included");
    return {
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
        damageDealtByElement: composeReportCut(figures.damageDealtByElement),
        damageTakenByElement: composeReportCut(figures.damageTakenByElement),
        damageDealtByOpponent: composeReportCut(figures.damageDealtByOpponent),
        damageTakenByOpponent: composeReportCut(figures.damageTakenByOpponent),
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
        written[String(id)] = composeReportRow(figures);
    }
    assert(
        Object.keys(written).length === statistics.byCombatantId.size,
        "a report holds a row for each combatant the aggregate counted",
    );
    return written;
}

function composeReportFight(subject: ReportSubject): Record<string, unknown> {
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
 * Null where it would not be written, which the caller marks rather than passing off as empty.
 *
 * Written even where there is no fight: `fight: null` is a true statement and a useful one — it
 * says the add-on is attached and reading nothing, which is otherwise a guess.
 */
export function composeReportText(
    subject: ReportSubject | null,
    surroundings: CaptureSurroundings,
): string | null {
    assert(surroundings.world.length > 0, "a report names the world it was taken on");
    assert(surroundings.capturedAt.length > 0, "and the moment it was taken at");
    assert(surroundings.gameBuild !== "", "a build it could not read is absent, never empty");
    assert(surroundings.userAgent !== "", "and so is a browser that said nothing of itself");
    return composeJsonText({
        addOn: { name: ADD_ON_NAME, version: BUILD_VERSION },
        game: { world: surroundings.world, build: surroundings.gameBuild },
        // The same fact a recording carries as `przegladarka`, so the two artefacts a reader can
        // hand over cannot disagree about what was known.
        browser: surroundings.userAgent,
        capturedAt: surroundings.capturedAt,
        fight: subject === null ? null : composeReportFight(subject),
    }, INDENT_SPACES);
}
