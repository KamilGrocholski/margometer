/**
 * The fight as a file a reader hands over: the calls the game made, and the figures they came to
 * (`docs/design.md` §8, §11). The format is `develop`'s version 4, carried over unchanged, and this
 * file is the one place its field names are spelled.
 *
 * ⚠️ **Nothing is redacted here, and that is the design.** The file carries real nicknames and the
 * game's own prose, and never enters git: intake deals with both, once (`SECURITY.md`).
 */

import { assert } from "@std/assert/assert";
import { encodeJson, type JsonNothing, type JsonUnwritable } from "#/libs/json-text.ts";
import { formatInteger } from "#/libs/number-text.ts";
import type { CombatantRoster } from "#/src/core/combatant-roster.ts";
import type {
    CombatantFigures,
    FightStatistics,
    SkillFigures,
} from "#/src/core/fight-statistics.ts";
import type { CapturedCall } from "#/src/game/fight-capture.ts";
import type { FightPlace } from "#/src/game/fight-place.ts";

/** What a recording states, however it was come by. Null is what nobody measured. */
export interface FileCalls {
    calls: readonly CapturedCall[];
    droppedCalls: number | null;
    isTruncated: boolean | null;
}

/** What a file's figures are written from, whichever fight the panel is standing on. */
export interface FileSubject {
    statistics: FightStatistics;
    roster: CombatantRoster;
    /** Where it was fought, as the client stated it rather than as the bar words it. */
    place: FightPlace | null;
    payloads: number;
    messagesLost: number;
    isOver: boolean;
}

/** What a recording needs from outside the fight, handed in so none of this reaches a page. */
export interface FileSurroundings {
    world: string;
    /** Null where the page did not say: a recording without it is not comparable with others. */
    gameBuild: string | null;
    capturedAt: string;
    /** Null where the browser did not say, never `""`. */
    userAgent: string | null;
    /** Which build of ours wrote it: the add-on's own version, not the format's. */
    addOnVersion: string;
}

export interface FightFile {
    name: string;
    text: string;
}

export class FileUnserializable extends Error {
    override readonly name = "FileUnserializable";

    constructor(cause: JsonNothing | JsonUnwritable) {
        super(undefined, { cause });
    }
}

type ReportSkill = {
    [Key in keyof SkillFigures]: SkillFigures[Key] extends number ? number
        : SkillFigures[Key] extends string ? string
        : Record<string, number>;
};

/**
 * Keyed off `CombatantFigures` rather than listed out, so the compiler holds it complete: a figure
 * added to the aggregate stops the build here until somebody decides how it is written down.
 */
type ReportRow = {
    [Key in keyof CombatantFigures]: CombatantFigures[Key] extends number ? number
        : CombatantFigures[Key] extends ReadonlyMap<string, number> ? Record<string, number>
        : CombatantFigures[Key] extends ReadonlyMap<string, ReadonlyMap<string, number>>
            ? Record<string, Record<string, number>>
        : Record<string, ReportSkill>;
};

/**
 * 4 states what it could not read as `null`; 3 was the envelope in English, 2 Polish and carrying
 * `raport`, 1 Polish without it. Intake takes every one of them (`develop ADR 0030`, `0053`).
 */
const FILE_FORMAT_VERSION = 4;

/** The file's own field names, read back by whatever reads a recording (N13). */
export const FILE_FIELD = {
    formatVersion: "formatVersion",
    addOnVersion: "addOnVersion",
    capturedAt: "capturedAt",
    world: "world",
    gameBuild: "gameBuild",
    userAgent: "userAgent",
    report: "report",
    droppedCalls: "droppedCalls",
    isTruncated: "isTruncated",
    calls: "calls",
    index: "index",
    payload: "payload",
    messages: "messages",
    combatantsBefore: "combatantsBefore",
    combatantsAfter: "combatantsAfter",
} as const;

/** So a difference between two recordings is something a person can read. */
const INDENT_SPACES = 2;
/** In a name, where a sentence would write `none stated`. */
export const NOTHING_STATED = "none";

/**
 * The recording as the file on disk. Two fields are about the reader rather than the fight, and
 * are here because the file arrives in a report: `addOnVersion` and `userAgent`
 * (`develop ADR 0027`).
 */
export function encodeFightFile(
    calls: FileCalls,
    subject: FileSubject | null,
    surroundings: FileSurroundings,
): FightFile | FileUnserializable {
    assert(surroundings.world.length > 0, "a recording names the world it was taken on");
    assert(surroundings.capturedAt.length > 0, "and the moment it was taken at");
    assert(surroundings.gameBuild !== "", "a build it could not read is absent, never empty");
    assert(surroundings.userAgent !== "", "and so is a browser that said nothing of itself");
    if (calls.droppedCalls !== null) assert(calls.droppedCalls >= 0, "none dropped, or more");
    const written = encodeJson({
        [FILE_FIELD.formatVersion]: FILE_FORMAT_VERSION,
        [FILE_FIELD.addOnVersion]: surroundings.addOnVersion,
        [FILE_FIELD.capturedAt]: surroundings.capturedAt,
        [FILE_FIELD.world]: surroundings.world,
        [FILE_FIELD.gameBuild]: surroundings.gameBuild,
        [FILE_FIELD.userAgent]: surroundings.userAgent,
        // Above the calls, which run to hundreds of kilobytes.
        [FILE_FIELD.report]: subject === null ? null : encodeFightReport(subject),
        [FILE_FIELD.droppedCalls]: calls.droppedCalls,
        [FILE_FIELD.isTruncated]: calls.isTruncated,
        [FILE_FIELD.calls]: calls.calls.map((call) => ({
            [FILE_FIELD.index]: call.index,
            [FILE_FIELD.payload]: call.payload,
            [FILE_FIELD.messages]: call.messages,
            [FILE_FIELD.combatantsBefore]: call.combatantsBefore,
            [FILE_FIELD.combatantsAfter]: call.combatantsAfter,
        })),
    }, INDENT_SPACES);
    if (written instanceof Error) return new FileUnserializable(written);
    return { name: encodeFightFileName(surroundings), text: written };
}

/**
 * Names the world, both versions and the moment: which build a recording came off and which wrote
 * it are what is asked of an attachment, and the moment keeps two from colliding.
 */
function encodeFightFileName(surroundings: FileSurroundings): string {
    assert(surroundings.addOnVersion.length > 0, "a file is named for the build that wrote it");
    const at = surroundings.capturedAt.split(":").join("-").split(".").join("-");
    assert(!at.includes(":"), "and for a moment no file system objects to");
    assert(!at.includes("."), "nor one a file's own extension could be read out of");
    const build = surroundings.gameBuild ?? NOTHING_STATED;
    return `margometer-${surroundings.world}-${build}-${surroundings.addOnVersion}-${at}.json`;
}

/**
 * The counted half of what a reader hands over. English keys, unlike the game's payload beside
 * them: a key here is one somebody can grep for in `src/core/fight-statistics.ts`.
 */
export function encodeFightReport(subject: FileSubject): Record<string, unknown> {
    assert(subject.payloads > 0, "a fight written into a report was built from something");
    assert(subject.messagesLost >= 0, "and lost no fewer than none of what it was handed");
    const statistics = subject.statistics;
    return {
        payloads: subject.payloads,
        isOver: subject.isOver,
        place: subject.place,
        messagesLost: subject.messagesLost,
        unreadMessagesUnknownKey: statistics.unreadMessagesUnknownKey,
        unreadMessagesNoParameter: statistics.unreadMessagesNoParameter,
        unreadMessagesGrammarRefused: statistics.unreadMessagesGrammarRefused,
        castsUnplaced: statistics.castsUnplaced,
        castsStated: statistics.castsStated,
        dealtByNobody: statistics.dealtByNobody,
        takenByNobody: statistics.takenByNobody,
        givenByNobody: statistics.givenByNobody,
        restoredToNobody: statistics.restoredToNobody,
        byNeitherEnd: statistics.byNeitherEnd,
        roster: [...subject.roster.byId.values()],
        combatants: encodeReportCombatants(statistics),
        totals: encodeReportRow(statistics.totals),
    };
}

/** The roster beside this rather than folded into it: a merge would lose the unnamed combatant. */
function encodeReportCombatants(statistics: FightStatistics): Record<string, ReportRow> {
    const written: Record<string, ReportRow> = {};
    for (const [id, figures] of statistics.byCombatantId) {
        written[formatInteger(id)] = encodeReportRow(figures);
    }
    assert(Object.keys(written).length === statistics.byCombatantId.size, "a row per combatant");
    return written;
}

function encodeReportRow(figures: CombatantFigures): ReportRow {
    assert(figures.damageDealtRaw >= 0, "a figure written into a report is never below nothing");
    const cut = encodeReportCut;
    const pair = encodeReportPairCut;
    return {
        unreadMessagesUnknownKey: figures.unreadMessagesUnknownKey,
        unreadMessagesNoParameter: figures.unreadMessagesNoParameter,
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
        damageTakenFromNobodyByElement: cut(figures.damageTakenFromNobodyByElement),
        damageDealtToNobodyByElement: cut(figures.damageDealtToNobodyByElement),
        healthRestoredByNobodyBySource: cut(figures.healthRestoredByNobodyBySource),
        healthRestoredByGiver: cut(figures.healthRestoredByGiver),
        healthGivenByReceiver: cut(figures.healthGivenByReceiver),
        healthRestoredBySource: cut(figures.healthRestoredBySource),
        healthRestoredWithoutSkillBySource: cut(figures.healthRestoredWithoutSkillBySource),
        damageTakenWithoutSkillBySource: cut(figures.damageTakenWithoutSkillBySource),
        damageDealtWithoutSkillBySource: cut(figures.damageDealtWithoutSkillBySource),
        damageDealtWithoutSkillByOpponentAndSource: pair(
            figures.damageDealtWithoutSkillByOpponentAndSource,
        ),
        damageDealtWithoutSkillByOpponent: cut(figures.damageDealtWithoutSkillByOpponent),
        damageTakenWithoutSkillByOpponent: cut(figures.damageTakenWithoutSkillByOpponent),
        healthGivenWithoutSkillByReceiverAndSource: pair(
            figures.healthGivenWithoutSkillByReceiverAndSource,
        ),
        damageDealtByElement: cut(figures.damageDealtByElement),
        damageTakenByElement: cut(figures.damageTakenByElement),
        damageDealtByOpponent: cut(figures.damageDealtByOpponent),
        damageTakenByOpponent: cut(figures.damageTakenByOpponent),
        damageDealtByOpponentAndKind: pair(figures.damageDealtByOpponentAndKind),
        damageTakenByOpponentAndKind: pair(figures.damageTakenByOpponentAndKind),
        skills: encodeReportSkills(figures.skills),
        blowsStruck: figures.blowsStruck,
        blowsWithoutSkill: figures.blowsWithoutSkill,
        turnsTaken: figures.turnsTaken,
        turnsLost: figures.turnsLost,
        blowsCritical: figures.blowsCritical,
        damageDealtBlowLargest: figures.damageDealtBlowLargest,
        damageTakenBlowLargest: figures.damageTakenBlowLargest,
        procsWhenStriking: cut(figures.procsWhenStriking),
        procsWhenStruck: cut(figures.procsWhenStruck),
        damagePreventedByDefence: cut(figures.damagePreventedByDefence),
        statisticsDestroyed: cut(figures.statisticsDestroyed),
    };
}

/** A cut as an object, because JSON holds no map and a report is read as text. */
function encodeReportCut(cut: ReadonlyMap<string, number>): Record<string, number> {
    const written: Record<string, number> = {};
    for (const [key, amount] of cut) written[key] = amount;
    assert(Object.keys(written).length === cut.size, "every cut is written down");
    return written;
}

function encodeReportPairCut(
    cut: ReadonlyMap<string, ReadonlyMap<string, number>>,
): Record<string, Record<string, number>> {
    const written: Record<string, Record<string, number>> = {};
    for (const [key, held] of cut) written[key] = encodeReportCut(held);
    assert(Object.keys(written).length === cut.size, "every cut of a cut is written down");
    return written;
}

function encodeReportSkills(
    skills: ReadonlyMap<string, SkillFigures>,
): Record<string, ReportSkill> {
    const written: Record<string, ReportSkill> = {};
    for (const [key, skill] of skills) {
        assert(key.length > 0, "a skill is kept under the name it was announced by");
        written[key] = {
            name: skill.name,
            uses: skill.uses,
            dealt: skill.dealt,
            blows: skill.blows,
            dealtByOpponent: encodeReportCut(skill.dealtByOpponent),
            restored: skill.restored,
            restoredByOpponent: encodeReportCut(skill.restoredByOpponent),
        };
    }
    assert(Object.keys(written).length === skills.size, "and every one of them is written down");
    return written;
}
