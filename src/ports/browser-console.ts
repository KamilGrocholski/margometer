/**
 * The page's console: a branded line for each failure it is handed. Once per kind, never per render
 * (`AGENTS.md` E9), is the defect ledger's to hold. The kind arrives as text, because this layer
 * imports nothing above it.
 */

import * as errors from "#/libs/errors.ts";

export interface BrowserConsolePort {
    writeBrandedLine(kind: string, detail: unknown): void;
}

export interface BrowserConsole {
    error(...values: unknown[]): void;
}

/** Shown first, so a line of ours is never read as the game's. */
const BRAND = "MargoMeter/Panel";

export function initBrowserConsole(browserConsole: BrowserConsole): BrowserConsolePort {
    return {
        writeBrandedLine(kind, detail) {
            // ⚠️ The line is the mark. A console that refuses it has nowhere further to send it,
            // and the defect it stands for is counted by the ledger either way.
            void errors.attempt(() => browserConsole.error(`${BRAND} ${kind}`, detail));
        },
    };
}
