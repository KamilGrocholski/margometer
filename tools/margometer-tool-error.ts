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
