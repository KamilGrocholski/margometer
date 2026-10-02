/**
 * The page's time (`docs/design.md` §5): its clock, which owns every moment the runtime states; its
 * animation frame, the one moment the panel draws; its own timer, for a step that repeats until it
 * is cancelled (§10.1). The clock reads the page's own `Date` and answers null where it will not
 * read one: a row with no time says nothing rather than saying `00:00`. A hidden tab gets no
 * frames, and nobody is looking at it. A step is ours and the browser calls it, so it is guarded
 * where it is handed over (`AGENTS.md` E10): a throw out of it lands in a loop that drops it.
 */

import { assert } from "@std/assert/assert";
import * as errors from "#/libs/errors.ts";

/** A moment on the reader's own clock. The month counts from one, as a person counts them. */
export interface BrowserMoment {
    day: number;
    month: number;
    hour: number;
    minute: number;
}

export interface BrowserClock {
    readNowMilliseconds(): number;
    readMoment(atMilliseconds: number): BrowserMoment | null;
    /** The moment as a file states it, in the page's own ISO 8601. */
    readTimestampText(atMilliseconds: number): string | errors.Caught;
}

/** The whole of what this asks a page for. A browser's `Date` satisfies it. */
export interface BrowserDate {
    now(): number;
    new (atMilliseconds: number): BrowserDateValue;
}

/** Each optional: a document that lends no clock of its own answers no time. */
export interface BrowserDateValue {
    toISOString(): string;
    getDate?(): number;
    getMonth?(): number;
    getHours?(): number;
    getMinutes?(): number;
}

export interface BrowserFrameScheduler {
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
export interface BrowserFrames {
    requestAnimationFrame(step: () => void): number;
    cancelAnimationFrame(handle: number): void;
}

export interface IntervalHandle {
    cancel(): void | errors.Caught;
}

export interface BrowserIntervalScheduler {
    every(
        step: () => void,
        everyMilliseconds: number,
        onStepFailure: (failure: errors.Caught) => void,
    ): IntervalHandle | errors.Caught;
}

/** The whole of what this asks a page for. A browser's `window` satisfies it. */
export interface BrowserTimers {
    setInterval(step: () => void, everyMilliseconds: number): number;
    clearInterval(handle: number): void;
}

/** The widest a calendar goes, which is what a day and a month read off a clock are held to. */
const DAY_MAXIMUM = 31;
const MONTH_MAXIMUM = 12;
/** `getMonth` counts from zero and the rest of this program counts months the way a person does. */
const FIRST_MONTH_OFFSET = 1;
const HOUR_MAXIMUM = 23;
const MINUTE_MAXIMUM = 59;

export function initBrowserClock(date: BrowserDate): BrowserClock {
    return {
        readNowMilliseconds: () => date.now(),
        readMoment(atMilliseconds) {
            if (!Number.isFinite(atMilliseconds)) return null;
            // Read the moment: a day, a month, an hour and a minute, or null for any one refused.
            const read = errors.attempt((): BrowserMoment | null => {
                // ⚠️ **The day is held to the same refusal as the time**: a shelf of twenty fights
                // spans days, and a wrong one reads as a fight that happened.
                const held: BrowserDateValue = new date(atMilliseconds);
                const day = readMomentPart(held.getDate?.(), 1, DAY_MAXIMUM);
                const monthFromZero = readMomentPart(
                    held.getMonth?.(),
                    0,
                    MONTH_MAXIMUM - FIRST_MONTH_OFFSET,
                );
                const hour = readMomentPart(held.getHours?.(), 0, HOUR_MAXIMUM);
                const minute = readMomentPart(held.getMinutes?.(), 0, MINUTE_MAXIMUM);
                if (day === null) return null;
                if (monthFromZero === null) return null;
                if (hour === null) return null;
                if (minute === null) return null;
                return { day, month: monthFromZero + FIRST_MONTH_OFFSET, hour, minute };
            });
            if (read instanceof Error) return null;
            return read;
        },
        readTimestampText(atMilliseconds) {
            assert(Number.isFinite(atMilliseconds), "a moment written down is one on the clock");
            const read = errors.attempt(() => new date(atMilliseconds).toISOString());
            if (read instanceof Error) return read;
            return String(read);
        },
    };
}

function readMomentPart(value: unknown, minimum: number, maximum: number): number | null {
    assert(minimum <= maximum, "a range is read low to high");
    if (typeof value !== "number") return null;
    if (!Number.isSafeInteger(value)) return null;
    if (value < minimum) return null;
    if (value <= maximum) return value;
    return null;
}

export function initBrowserFrames(frames: BrowserFrames): BrowserFrameScheduler {
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

export function initBrowserInterval(timers: BrowserTimers): BrowserIntervalScheduler {
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
