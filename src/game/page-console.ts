/**
 * The page's console, where a failure the reader is also shown gets one branded line, once per
 * kind and never per render (`AGENTS.md` E9). The kind is the runtime's word, handed in as text,
 * because this layer imports nothing above it.
 */

import { callForeign } from "@/libs/result.ts";

export interface ConsolePort {
    writeBrandedLine(kind: string, detail: unknown): void;
}

/** The whole of what this asks a page for. A browser's `console` satisfies it. */
export interface PageConsole {
    error(...values: unknown[]): void;
}

/** A brand a console shows first, so a line of ours is never read as the game's. */
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
