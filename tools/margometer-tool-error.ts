/**
 * The base every failure that runs in a terminal wears, disjoint from the browser's so a `catch`
 * there cannot swallow it, and abstract so no base is ever thrown. **ADR 0009.**
 */

export type MargoMeterToolErrorCode = "UserscriptBuild" | "PreviewBuild" | "CaptureIntake";

export abstract class MargoMeterToolError extends Error {
    readonly code: MargoMeterToolErrorCode;

    protected constructor(code: MargoMeterToolErrorCode, reason: string, options?: ErrorOptions) {
        super(reason, options);
        this.code = code;
        this.name = `MargoMeterTool/${code}`;
    }
}

/** The build refused: a bundler that would not run, a file saying nothing, or a way out. */
export class UserscriptBuildError extends MargoMeterToolError {
    constructor(reason: string) {
        super("UserscriptBuild", reason);
    }
}

/** The preview refused: no recording, or a bundle it could not put into a page. */
export class PreviewBuildError extends MargoMeterToolError {
    constructor(reason: string) {
        super("PreviewBuild", reason);
    }
}

/**
 * Intake refused: a recording it will not redact confidently. Both ways of being wrong are
 * permanent — a nickname in a history nobody rewrites, or corrupted evidence.
 */
export class CaptureIntakeError extends MargoMeterToolError {
    constructor(reason: string) {
        super("CaptureIntake", reason);
    }
}
