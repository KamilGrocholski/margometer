/**
 * The page's own timer, for a step that repeats until it is cancelled (`docs/design.md` §10.1).
 *
 * The step is ours and the browser calls it, so it is guarded where it is handed over (`AGENTS.md`
 * E10): a throw out of it would land in the browser's timer, which drops it and fires again.
 */

import { assert } from "@std/assert/assert";
import * as errors from "#/libs/errors.ts";

export interface IntervalHandle {
    cancel(): void | errors.Caught;
}

export interface IntervalScheduler {
    every(
        step: () => void,
        everyMilliseconds: number,
        onStepFailure: (failure: errors.Caught) => void,
    ): IntervalHandle | errors.Caught;
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
                const ran = errors.attempt(step);
                if (!(ran instanceof Error)) return;
                // ⚠️ The report is the mark (E9). One that throws has nowhere further to go, and
                // the browser's timer is not a place for it, so its own failure is discarded here.
                void errors.attempt(() => onStepFailure(ran));
            };
            const handle = errors.attempt(() => timers.setInterval(guarded, everyMilliseconds));
            if (handle instanceof Error) return handle;
            return {
                cancel: () => errors.attempt(() => timers.clearInterval(handle)),
            };
        },
    };
}
