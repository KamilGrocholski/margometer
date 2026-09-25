/**
 * The page's own timer, for a step that repeats until it is cancelled (`docs/design.md` §10.1).
 *
 * The step is ours and the browser calls it, so it is guarded where it is handed over (`AGENTS.md`
 * E10): a throw out of it would land in the browser's timer, which drops it and fires again.
 */

import { assert } from "@std/assert/assert";
import {
    type BrokenInvariant,
    callForeign,
    err,
    type ForeignFailure,
    ok,
    type Result,
    runGuarded,
} from "#/libs/result.ts";

export interface IntervalHandle {
    cancel(): Result<void, ForeignFailure>;
}

export interface IntervalScheduler {
    every(
        step: () => void,
        everyMilliseconds: number,
        onStepFailure: (failure: BrokenInvariant) => void,
    ): Result<IntervalHandle, ForeignFailure>;
}

/** The whole of what this asks a page for. A browser's `window` satisfies it. */
export interface PageTimers {
    setInterval(step: () => void, everyMilliseconds: number): number;
    clearInterval(handle: number): void;
}

export function initPageInterval(timers: PageTimers): IntervalScheduler {
    return {
        every(step, everyMilliseconds, onStepFailure) {
            assert(
                Number.isSafeInteger(everyMilliseconds),
                "a step repeats every whole millisecond",
            );
            assert(everyMilliseconds > 0, "and some time passes between two of them");
            const guarded = (): void => {
                const ran = runGuarded(step);
                if (ran.ok) return;
                // ⚠️ The report is the mark (E9). One that throws has nowhere further to go, and
                // the browser's timer is not a place for it, so its own failure is discarded here.
                void runGuarded(() => onStepFailure(ran.error));
            };
            const started = callForeign(() => timers.setInterval(guarded, everyMilliseconds));
            if (!started.ok) return started;
            const handle = started.value;
            return ok({
                cancel() {
                    const cancelled = callForeign(() => timers.clearInterval(handle));
                    if (!cancelled.ok) return err(cancelled.error);
                    return ok(undefined);
                },
            });
        },
    };
}
