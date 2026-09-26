/**
 * The page's animation frame, the one moment the panel draws (`docs/design.md` §5, §10.4). A hidden
 * tab gets no frames, and nobody is looking at it.
 *
 * The step is ours and the browser calls it, so it is guarded where it is handed over (`AGENTS.md`
 * E10): a throw out of it would land in the browser's frame loop, which drops it silently.
 */

import * as errors from "#/libs/errors.ts";

export interface FrameScheduler {
    requestFrame(
        step: () => void,
        onStepFailure: (failure: errors.Caught) => void,
    ): FrameHandle | errors.Caught;
}

export interface FrameHandle {
    /** A cancel the page refuses leaves a frame that finds nothing to do; it is not reported. */
    cancel(): void;
}

/** The whole of what this asks a page for. A browser's `window` satisfies it. */
export interface PageFrames {
    requestAnimationFrame(step: () => void): number;
    cancelAnimationFrame(handle: number): void;
}

export function initPageFrames(frames: PageFrames): FrameScheduler {
    return {
        requestFrame(step, onStepFailure) {
            const guarded = (): void => {
                const ran = errors.attempt(step);
                if (!(ran instanceof Error)) return;
                // ⚠️ The report is the mark (E9). One that throws has nowhere further to go.
                void errors.attempt(() => onStepFailure(ran));
            };
            const handle = errors.attempt(() => frames.requestAnimationFrame(guarded));
            if (handle instanceof Error) return handle;
            return {
                cancel() {
                    void errors.attempt(() => frames.cancelAnimationFrame(handle));
                },
            };
        },
    };
}
