/**
 * The base every failure that runs in a terminal wears, disjoint from the browser's so nothing in
 * the bundle can meet it, and abstract so no base is ever thrown (`AGENTS.md` E13).
 */

import type { VocabularyWord } from "#/libs/vocabulary.ts";

export const TOOL_ERROR_CODE = {
    userscriptBuild: "UserscriptBuild",
    declaredVersion: "DeclaredVersion",
    recordingRead: "RecordingRead",
    developReport: "DevelopReport",
    changelog: "Changelog",
    captureIntake: "CaptureIntake",
    gameSource: "GameSource",
    gameUnreachable: "GameUnreachable",
    protocolKeyTable: "ProtocolKeyTable",
    protocolKeyShape: "ProtocolKeyShape",
    buffBitTable: "BuffBitTable",
    skillTable: "SkillTable",
    helpArticle: "HelpArticle",
    panelShot: "PanelShot",
    previewServe: "PreviewServe",
    drillReport: "DrillReport",
    cardHeight: "CardHeight",
    givingWay: "GivingWay",
    turnCount: "TurnCount",
    turnReading: "TurnReading",
    fabricatedFight: "FabricatedFight",
} as const;
export type ToolErrorCode = VocabularyWord<typeof TOOL_ERROR_CODE>;

export abstract class MargoMeterToolError extends Error {
    readonly code: ToolErrorCode;

    protected constructor(code: ToolErrorCode, reason: string, options?: ErrorOptions) {
        super(reason, options);
        this.code = code;
        this.name = `MargoMeterTool/${code}`;
    }
}

/** The build refused: a bundler that would not run, a file saying nothing, or a way out. */
export class UserscriptBuildError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.userscriptBuild, reason, options);
    }
}

/** A configuration that declares no version to build at, or is no configuration. */
export class DeclaredVersionError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.declaredVersion, reason, options);
    }
}

/** A recording asked for that is not there, or that states no fight the add-on would read. */
export class RecordingReadError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.recordingRead, reason, options);
    }
}

/** `develop`'s tree that would not come out of git, or its report that would not run. */
export class DevelopReportError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.developReport, reason, options);
    }
}

/** A release with no section to say what it is, or a changelog that cannot be read. */
export class ChangelogError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.changelog, reason, options);
    }
}

/** A recording intake will not admit, or cannot redact with certainty. */
export class CaptureIntakeError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.captureIntake, reason, options);
    }
}

/** The client's page or bundle could not be read the way this tool expects, or its cache is broken. */
export class GameSourceError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.gameSource, reason, options);
    }
}

/** A world that did not answer. Its own class, because "the game moved on" and "nobody could ask" lead to different verdicts. */
export class GameUnreachableError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.gameUnreachable, reason, options);
    }
}

/** The client's key table could not be lifted out of its bundle. */
export class ProtocolKeyTableError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.protocolKeyTable, reason, options);
    }
}

/** A key stated in a shape no phrase says, or a register line this tool cannot read. */
export class ProtocolKeyShapeError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.protocolKeyShape, reason, options);
    }
}

/** The client's status bits could not be lifted out of its bundle. */
export class BuffBitTableError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.buffBitTable, reason, options);
    }
}

/** The published skill table could not be read, or no longer holds its shape. */
export class SkillTableError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.skillTable, reason, options);
    }
}

/** The published help could not be read, or a phrase it is asked for is not a phrase. */
export class HelpArticleError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.helpArticle, reason, options);
    }
}

/** A set of pictures that could not be taken honestly: a dirty tree, no browser, a panel astray. */
export class PanelShotError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.panelShot, reason, options);
    }
}

/** A preview that cannot start as asked: a flag it does not read, or a fight it cannot open. */
export class PreviewServeError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.previewServe, reason, options);
    }
}

/** A drill walk asked for something it cannot walk: a screen nobody draws, or no screen at all. */
export class DrillReportError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.drillReport, reason, options);
    }
}

/** A card measurement asked for past its bound, or handed a recording by number. */
export class CardHeightError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.cardHeight, reason, options);
    }
}

/** A panel that cannot be made to give way as asked: a region it lacks, or a guard it rewrote. */
export class GivingWayError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.givingWay, reason, options);
    }
}

/** A turn count asked for in a way it cannot read: a recording named by anything but a path. */
export class TurnCountError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.turnCount, reason, options);
    }
}

/** The same refusal, from the reading of each message. */
export class TurnReadingError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.turnReading, reason, options);
    }
}

/** A fabricated fight refused: a shape past a bound somebody else owns, or a path out of its place. */
export class FabricatedFightError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super(TOOL_ERROR_CODE.fabricatedFight, reason, options);
    }
}
