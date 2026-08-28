/**
 * The base every failure that runs in a terminal wears. Disjoint from the one that ships to the
 * browser on purpose, so a `catch` in the add-on cannot swallow a tool's error as its own.
 */

export type MargoMeterToolErrorCode = "UserscriptBuild";

export class MargoMeterToolError extends Error {
    readonly code: MargoMeterToolErrorCode;

    constructor(code: MargoMeterToolErrorCode, reason: string, options?: ErrorOptions) {
        super(reason, options);
        this.code = code;
        this.name = `MargoMeterTool/${code}`;
    }
}
