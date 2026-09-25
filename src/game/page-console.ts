/**
 * The page's console: one branded line per kind of failure, never per render (`AGENTS.md` E9).
 * The kind arrives as text, because this layer imports nothing above it.
 */

import { callForeign } from "#/libs/result.ts";

export interface ConsolePort {
    writeBrandedLine(kind: string, detail: unknown): void;
}

export interface PageConsole {
    error(...values: unknown[]): void;
}

/** Shown first, so a line of ours is never read as the game's. */
const BRAND = "MargoMeter/Panel";

export function initPageConsole(console: PageConsole): ConsolePort {
    return {
        writeBrandedLine(kind, detail) {
            // ⚠️ The line is the mark. A console that refuses it has nowhere further to send it,
            // and the defect it stands for is counted by the ledger either way.
            void callForeign(() => console.error(`${BRAND} ${kind}`, detail));
        },
    };
}
