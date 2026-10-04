/**
 * The fight as a file a reader hands over: the calls the game made, and the figures they came to
 * (`docs/design.md` §8, §11). The format is `develop`'s version 4, carried over unchanged, and this
 * file is the one place its field names are spelled.
 *
 * ⚠️ **Nothing is redacted here, and that is the design.** The file carries real nicknames and the
 * game's own prose, and never enters git: intake deals with both, once (`SECURITY.md`).
 */

import { assert } from "@std/assert/assert";
import { encodeJson, type JsonUnwritable } from "#/libs/json-text.ts";
import { formatInteger } from "#/libs/number-text.ts";
import type { CombatantRoster } from "#/src/core/combatant-roster.ts";
import type {
    CombatantFigures,
    FightStatistics,
    FightTotals,
    SkillFigures,
} from "#/src/core/fight-statistics.ts";
import type { CapturedCall } from "#/src/ports/fight-capture.ts";
import type { FightPlace } from "#/src/ports/fight-place.ts";

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
    payloadsApplied: number;
    messagesLost: number;
    isOver: boolean;
}

/** What a recording needs from outside the fight, handed in so none of this reaches a page. */
export interface FileSurroundings {
    world: string;
    /** Null where the page did not say: a recording without it is not comparable with others. */
    margonemClientBuild: string | null;
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

    constructor(cause: JsonUnwritable) {
        super(undefined, { cause });
    }
}

/**
 * The key a figure is written under where its name here has moved on from `develop`'s: the format
 * is version 4, carried over unchanged, so a renamed figure keeps the key the files already hold.
 */
export const REPORT_KEY_BY_ROW_FIELD = {
    sideHealsUnsized: "castsUnplaced",
    healthRestoredByNobodyByKey: "healthRestoredByNobodyBySource",
    healthRestoredByKey: "healthRestoredBySource",
    healthRestoredWithoutSkillByKey: "healthRestoredWithoutSkillBySource",
    damageTakenWithoutSkillByKey: "damageTakenWithoutSkillBySource",
    damageDealtWithoutSkillByKey: "damageDealtWithoutSkillBySource",
    damageDealtWithoutSkillByOpponentAndKey: "damageDealtWithoutSkillByOpponentAndSource",
    healthGivenWithoutSkillByReceiverAndKey: "healthGivenWithoutSkillByReceiverAndSource",
} as const;
export const REPORT_KEY_BY_SKILL_FIELD = {
    damageDealt: "dealt",
    damageDealtByOpponent: "dealtByOpponent",
    healthGiven: "restored",
    healthGivenByReceiver: "restoredByOpponent",
} as const;
type ReportKey<Field, Renamed> = Field extends keyof Renamed ? Renamed[Field] : Field;

type ReportSkill = {
    [Key in keyof SkillFigures as ReportKey<Key, typeof REPORT_KEY_BY_SKILL_FIELD>]:
        SkillFigures[Key] extends number ? number
            : SkillFigures[Key] extends string ? string
            : Record<string, number>;
};

/**
 * Keyed off `CombatantFigures` rather than listed out, so the compiler holds it complete: a figure
 * added to the aggregate stops the build here until somebody decides how it is written down.
 */
type ReportRow = {
    [Key in keyof CombatantFigures as ReportKey<Key, typeof REPORT_KEY_BY_ROW_FIELD>]:
        CombatantFigures[Key] extends number ? number
            : CombatantFigures[Key] extends ReadonlyMap<string, number> ? Record<string, number>
            : CombatantFigures[Key] extends ReadonlyMap<string, ReadonlyMap<string, number>>
                ? Record<string, Record<string, number>>
            : Record<string, ReportSkill>;
};

/** The same for the figures the aggregate holds beside its rows. */
export const REPORT_KEY_BY_FIGHT_FIELD = {
    damageDealtByNobody: "dealtByNobody",
    damageTakenByNobody: "takenByNobody",
    healthGivenByNobody: "givenByNobody",
    healthRestoredToNobody: "restoredToNobody",
    damageByNeitherEnd: "byNeitherEnd",
    sideHealsUnsized: "castsUnplaced",
    sideHealsStated: "castsStated",
} as const;

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
    margonemClientBuild: "gameBuild",
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
    assert(
        surroundings.margonemClientBuild !== "",
        "a build it could not read is absent, never empty",
    );
    assert(surroundings.userAgent !== "", "and so is a browser that said nothing of itself");
    if (calls.droppedCalls !== null) assert(calls.droppedCalls >= 0, "none dropped, or more");
    const written = encodeJson({
        [FILE_FIELD.formatVersion]: FILE_FORMAT_VERSION,
        [FILE_FIELD.addOnVersion]: surroundings.addOnVersion,
        [FILE_FIELD.capturedAt]: surroundings.capturedAt,
        [FILE_FIELD.world]: surroundings.world,
        [FILE_FIELD.margonemClientBuild]: surroundings.margonemClientBuild,
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
    const momentForName = surroundings.capturedAt.split(":").join("-").split(".").join("-");
    assert(!momentForName.includes(":"), "and for a moment no file system objects to");
    assert(!momentForName.includes("."), "nor one a file's own extension could be read out of");
    const build = surroundings.margonemClientBuild ?? NOTHING_STATED;
    const { world, addOnVersion } = surroundings;
    return `margometer-${world}-${build}-${addOnVersion}-${momentForName}.json`;
}

/**
 * The counted half of what a reader hands over. English keys, unlike the game's payload beside
 * them: a key here is one somebody can grep for in `src/core/fight-statistics.ts`.
 */
export function encodeFightReport(subject: FileSubject): Record<string, unknown> {
    assert(subject.payloadsApplied > 0, "a fight written into a report was built from something");
    assert(subject.messagesLost >= 0, "and lost no fewer than none of what it was handed");
    const statistics = subject.statistics;
    return {
        payloads: subject.payloadsApplied,
        isOver: subject.isOver,
        place: subject.place,
        messagesLost: subject.messagesLost,
        unreadMessagesUnknownKey: statistics.unreadMessagesUnknownKey,
        unreadMessagesNoParameter: statistics.unreadMessagesNoParameter,
        unreadMessagesGrammarRefused: statistics.unreadMessagesGrammarRefused,
        [REPORT_KEY_BY_FIGHT_FIELD.sideHealsUnsized]: statistics.sideHealsUnsized,
        [REPORT_KEY_BY_FIGHT_FIELD.sideHealsStated]: statistics.sideHealsStated,
        [REPORT_KEY_BY_FIGHT_FIELD.damageDealtByNobody]: statistics.damageDealtByNobody,
        [REPORT_KEY_BY_FIGHT_FIELD.damageTakenByNobody]: statistics.damageTakenByNobody,
        [REPORT_KEY_BY_FIGHT_FIELD.healthGivenByNobody]: statistics.healthGivenByNobody,
        [REPORT_KEY_BY_FIGHT_FIELD.healthRestoredToNobody]: statistics.healthRestoredToNobody,
        [REPORT_KEY_BY_FIGHT_FIELD.damageByNeitherEnd]: statistics.damageByNeitherEnd,
        roster: [...subject.roster.byId.values()],
        combatants: encodeReportCombatants(statistics),
        totals: encodeReportTotals(statistics.totals),
    };
}

/** Only what is summed: a count or a cut across a whole fight would be a nought nobody measured. */
function encodeReportTotals(totals: FightTotals): Record<keyof FightTotals, number> {
    assert(totals.damageDealtRaw >= 0, "a total written into a report is never below nothing");
    return {
        damageDealt: totals.damageDealt,
        damageTaken: totals.damageTaken,
        damageDealtRaw: totals.damageDealtRaw,
        damageDealtApplied: totals.damageDealtApplied,
        damageTakenRaw: totals.damageTakenRaw,
        damageTakenApplied: totals.damageTakenApplied,
        damageDealtAbsorbed: totals.damageDealtAbsorbed,
        damageTakenAbsorbed: totals.damageTakenAbsorbed,
        damagePrevented: totals.damagePrevented,
        healthRestored: totals.healthRestored,
        healthGiven: totals.healthGiven,
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
        [REPORT_KEY_BY_ROW_FIELD.sideHealsUnsized]: figures.sideHealsUnsized,
        damageDealt: figures.damageDealt,
        damageTaken: figures.damageTaken,
        damageDealtRaw: figures.damageDealtRaw,
        damageDealtApplied: figures.damageDealtApplied,
        damageTakenRaw: figures.damageTakenRaw,
        damageTakenApplied: figures.damageTakenApplied,
        damageDealtAbsorbed: figures.damageDealtAbsorbed,
        damageTakenAbsorbed: figures.damageTakenAbsorbed,
        damagePrevented: figures.damagePrevented,
        healthRestored: figures.healthRestored,
        healthGiven: figures.healthGiven,
        damageTakenFromNobody: figures.damageTakenFromNobody,
        damageDealtToNobody: figures.damageDealtToNobody,
        healthRestoredByNobody: figures.healthRestoredByNobody,
        damageTakenFromNobodyByKind: cut(figures.damageTakenFromNobodyByKind),
        damageDealtToNobodyByKind: cut(figures.damageDealtToNobodyByKind),
        [REPORT_KEY_BY_ROW_FIELD.healthRestoredByNobodyByKey]: cut(
            figures.healthRestoredByNobodyByKey,
        ),
        healthRestoredByGiver: cut(figures.healthRestoredByGiver),
        healthGivenByReceiver: cut(figures.healthGivenByReceiver),
        [REPORT_KEY_BY_ROW_FIELD.healthRestoredByKey]: cut(figures.healthRestoredByKey),
        [REPORT_KEY_BY_ROW_FIELD.healthRestoredWithoutSkillByKey]: cut(
            figures.healthRestoredWithoutSkillByKey,
        ),
        [REPORT_KEY_BY_ROW_FIELD.damageTakenWithoutSkillByKey]: cut(
            figures.damageTakenWithoutSkillByKey,
        ),
        [REPORT_KEY_BY_ROW_FIELD.damageDealtWithoutSkillByKey]: cut(
            figures.damageDealtWithoutSkillByKey,
        ),
        [REPORT_KEY_BY_ROW_FIELD.damageDealtWithoutSkillByOpponentAndKey]: pair(
            figures.damageDealtWithoutSkillByOpponentAndKey,
        ),
        damageDealtWithoutSkillByOpponent: cut(figures.damageDealtWithoutSkillByOpponent),
        damageTakenWithoutSkillByOpponent: cut(figures.damageTakenWithoutSkillByOpponent),
        [REPORT_KEY_BY_ROW_FIELD.healthGivenWithoutSkillByReceiverAndKey]: pair(
            figures.healthGivenWithoutSkillByReceiverAndKey,
        ),
        damageDealtByKind: cut(figures.damageDealtByKind),
        damageTakenByKind: cut(figures.damageTakenByKind),
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
        damageDealtAbsorbedByDefence: cut(figures.damageDealtAbsorbedByDefence),
        damageTakenAbsorbedByDefence: cut(figures.damageTakenAbsorbedByDefence),
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
    for (const [key, innerCut] of cut) written[key] = encodeReportCut(innerCut);
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
            [REPORT_KEY_BY_SKILL_FIELD.damageDealt]: skill.damageDealt,
            blows: skill.blows,
            [REPORT_KEY_BY_SKILL_FIELD.damageDealtByOpponent]: encodeReportCut(
                skill.damageDealtByOpponent,
            ),
            [REPORT_KEY_BY_SKILL_FIELD.healthGiven]: skill.healthGiven,
            [REPORT_KEY_BY_SKILL_FIELD.healthGivenByReceiver]: encodeReportCut(
                skill.healthGivenByReceiver,
            ),
        };
    }
    assert(Object.keys(written).length === skills.size, "and every one of them is written down");
    return written;
}
