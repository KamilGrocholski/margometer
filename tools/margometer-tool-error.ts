/**
 * The base every failure that runs in a terminal wears, disjoint from the browser's so a `catch`
 * there cannot swallow it, and abstract so no base is ever thrown. **ADR 0009.**
 */

export type MargoMeterToolErrorCode = "UserscriptBuild" | "PreviewBuild";

export abstract class MargoMeterToolError extends Error {
    readonly code: MargoMeterToolErrorCode;

    protected constructor(code: MargoMeterToolErrorCode, reason: string, options?: ErrorOptions) {
        super(reason, options);
        this.code = code;
        this.name = `MargoMeterTool/${code}`;
    }
}

/** The build refused: a bundler that would not run, a file saying nothing, or a way out of it. */
export class UserscriptBuildError extends MargoMeterToolError {
    constructor(reason: string) {
        super("UserscriptBuild", reason);
    }
}

/** The preview refused: no recording to draw, or a bundle it could not put into a page. */
export class PreviewBuildError extends MargoMeterToolError {
    constructor(reason: string) {
        super("PreviewBuild", reason);
    }
}
