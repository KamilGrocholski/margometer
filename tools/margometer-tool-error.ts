/**
 * The base every failure that runs in a terminal wears, disjoint from the browser's so a `catch`
 * there cannot swallow it, and abstract so no base is ever thrown. **ADR 0009.**
 */

export type MargoMeterToolErrorCode =
    | "UserscriptBuild"
    | "PreviewBuild"
    | "CaptureIntake"
    | "RecordingRead"
    | "PanelShot"
    | "InstalledBrowser"
    | "GameSource"
    | "ProtocolKeyTable"
    | "HelpArticle"
    | "DeclaredVersion"
    | "Changelog"
    | "DrillReport"
    | "ActionCount";

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
    constructor(reason: string, options?: ErrorOptions) {
        super("PreviewBuild", reason, options);
    }
}

/**
 * Intake refused: a recording it will not redact confidently. Both ways of being wrong are
 * permanent — a nickname in a history nobody rewrites, or corrupted evidence.
 */
export class CaptureIntakeError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super("CaptureIntake", reason, options);
    }
}

/**
 * A recording refused: a path that is not there, a file that is not JSON, or one carrying no call
 * the add-on would have seen. The reader's own rather than each caller's — every tool that opens a
 * recording fails the same way, and **E2** asks for a class per failure, not a class per caller.
 */
export class RecordingReadError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super("RecordingRead", reason, options);
    }
}

/**
 * A photograph refused: no browser to take it with, a tree whose `src/` is not in a commit, or a
 * run that produced fewer pictures than the set names. `DESIGN.md` owns the first two.
 */
export class PanelShotError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super("PanelShot", reason, options);
    }
}

/**
 * No browser on this machine to drive. Its own class and not the photographer's: a picture and a
 * test both ask this question, and **E2** asks for a class per failure rather than per caller.
 */
export class InstalledBrowserError extends MargoMeterToolError {
    constructor(reason: string) {
        super("InstalledBrowser", reason);
    }
}

/** The client refused: a page naming no build, a bundle unserved, or a manifest with no date. */
export class GameSourceError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super("GameSource", reason, options);
    }
}

/** The key table refused: a bundle the walks no longer recognise as the client's own switch. */
export class ProtocolKeyTableError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super("ProtocolKeyTable", reason, options);
    }
}

/** The help refused: an article id that is not one, an unfetched dump, or an undated manifest. */
export class HelpArticleError extends MargoMeterToolError {
    constructor(reason: string, options?: ErrorOptions) {
        super("HelpArticle", reason, options);
    }
}

/** The tree declares no version: nothing to build at, and nothing to release. */
export class DeclaredVersionError extends MargoMeterToolError {
    constructor(reason: string) {
        super("DeclaredVersion", reason);
    }
}

/** The release notes refused: a version the changelog says nothing about. */
export class ChangelogError extends MargoMeterToolError {
    constructor(reason: string) {
        super("Changelog", reason);
    }
}

/** The drill report refused: a screen named on the command line that the panel does not draw. */
export class DrillReportError extends MargoMeterToolError {
    constructor(reason: string) {
        super("DrillReport", reason);
    }
}

/** The action count refused: an argument that is not a path to a recording. */
export class ActionCountError extends MargoMeterToolError {
    constructor(reason: string) {
        super("ActionCount", reason);
    }
}
