/**
 * The page's clock, which owns every moment the runtime states (`docs/design.md` §5). Read through
 * the page's own `Date`, which is the one clock a userscript has, and answered as null where it
 * will not read one: a row with no time says nothing rather than saying `00:00`.
 */

import { assert } from "@std/assert/assert";
import { callForeign, type ForeignFailure, ok, type Result } from "@/libs/result.ts";

/** A moment on the reader's own clock. The month counts from one, as a person counts them. */
export interface PageMoment {
    day: number;
    month: number;
    hour: number;
    minute: number;
}

export interface Clock {
    readNowMilliseconds(): number;
    readMoment(atMilliseconds: number): PageMoment | null;
    /** The moment as a file states it, in the page's own ISO 8601. */
    readTimestampText(atMilliseconds: number): Result<string, ForeignFailure>;
}

/** The whole of what this asks a page for. A browser's `Date` satisfies it. */
export interface PageDate {
    now(): number;
    new (atMilliseconds: number): PageDateValue;
}

/** Each optional: a document that lends no clock of its own answers no time. */
export interface PageDateValue {
    toISOString(): string;
    getDate?(): number;
    getMonth?(): number;
    getHours?(): number;
    getMinutes?(): number;
}

/** The widest a calendar goes, which is what a day and a month read off a clock are held to. */
const DAY_MAXIMUM = 31;
const MONTH_MAXIMUM = 12;
/** `getMonth` counts from zero and the rest of this program counts months the way a person does. */
const FIRST_MONTH_OFFSET = 1;
const HOUR_MAXIMUM = 23;
const MINUTE_MAXIMUM = 59;

export function initPageClock(date: PageDate): Clock {
    return {
        readNowMilliseconds: () => date.now(),
        readMoment(atMilliseconds) {
            if (!Number.isFinite(atMilliseconds)) return null;
            const read = callForeign(() => readPageMoment(new date(atMilliseconds)));
            if (!read.ok) return null;
            return read.value;
        },
        readTimestampText(atMilliseconds) {
            assert(Number.isFinite(atMilliseconds), "a moment written down is one on the clock");
            const read = callForeign(() => new date(atMilliseconds).toISOString());
            if (!read.ok) return read;
            return ok(String(read.value));
        },
    };
}

/**
 * ⚠️ **The day is held to the same refusal as the time**: a shelf of twenty fights spans days, and
 * a wrong one reads as a fight that happened.
 */
function readPageMoment(held: PageDateValue): PageMoment | null {
    const day = readWhole(held.getDate?.(), 1, DAY_MAXIMUM);
    const monthFromZero = readWhole(held.getMonth?.(), 0, MONTH_MAXIMUM - FIRST_MONTH_OFFSET);
    const hour = readWhole(held.getHours?.(), 0, HOUR_MAXIMUM);
    const minute = readWhole(held.getMinutes?.(), 0, MINUTE_MAXIMUM);
    if (day === null) return null;
    if (monthFromZero === null) return null;
    if (hour === null) return null;
    if (minute === null) return null;
    return { day, month: monthFromZero + FIRST_MONTH_OFFSET, hour, minute };
}

function readWhole(value: unknown, minimum: number, maximum: number): number | null {
    assert(minimum <= maximum, "a range is read low to high");
    if (typeof value !== "number") return null;
    if (!Number.isSafeInteger(value)) return null;
    if (value < minimum) return null;
    if (value <= maximum) return value;
    return null;
}
