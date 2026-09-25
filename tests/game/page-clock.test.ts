/**
 * The page's own clock. A page is somebody else's program, so a `Date` answering a day no calendar
 * carries is refused rather than drawn: a shelf of twenty fights spans days, and a wrong one reads
 * as a fight that happened.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { ok, RESULT_FAILURE } from "@/libs/result.ts";
import { initPageClock, type PageDate } from "@/src/game/page-clock.ts";

/** A page clock answering whatever the test says, for every moment asked about. */
function composeDate(parts: Record<string, number | undefined>): PageDate {
    return class {
        getDate = parts.day === undefined ? undefined : () => parts.day;
        getMonth = parts.month === undefined ? undefined : () => parts.month;
        getHours = parts.hour === undefined ? undefined : () => parts.hour;
        getMinutes = parts.minute === undefined ? undefined : () => parts.minute;
        toISOString(): string {
            return "2026-09-13T21:05:00.000Z";
        }
        static now(): number {
            return 1234;
        }
    } as unknown as PageDate;
}

const SEPTEMBER = { day: 13, month: 8, hour: 21, minute: 5 };

Deno.test("a moment is read as the reader's own day and time, the month counted from one", () => {
    const clock = initPageClock(composeDate(SEPTEMBER));
    assertEquals(clock.readMoment(0), { day: 13, month: 9, hour: 21, minute: 5 }, "as a person");
    assertStrictEquals(clock.readNowMilliseconds(), 1234, "and now is the page's own now");
    assertEquals(clock.readTimestampText(0), ok("2026-09-13T21:05:00.000Z"), "a file's moment");
});

Deno.test("a clock answering a day outside the calendar answers no moment at all", () => {
    const read = (parts: Record<string, number | undefined>) =>
        initPageClock(composeDate({ ...SEPTEMBER, ...parts })).readMoment(0);
    assertEquals(read({ day: 99 }), null, "a day past the calendar");
    assertEquals(read({ day: 0 }), null, "and one before it");
    assertEquals(read({ day: 31 }), { day: 31, month: 9, hour: 21, minute: 5 }, "its last day");
    assertEquals(read({ day: 1 }), { day: 1, month: 9, hour: 21, minute: 5 }, "and its first");
    assertEquals(read({ month: 12 }), null, "a thirteenth month");
    assertEquals(read({ month: 11 }), { day: 13, month: 12, hour: 21, minute: 5 }, "December");
    assertEquals(read({ hour: -1 }), null, "an hour before midnight's");
    assertEquals(read({ hour: 24 }), null, "and one past the day's last");
    assertEquals(read({ minute: 60 }), null, "a minute past the hour's last");
    assertEquals(read({ minute: 0 }), { day: 13, month: 9, hour: 21, minute: 0 }, "and its first");
    assertEquals(read({ hour: 21.5 }), null, "and a fraction of one");
    assertEquals(read({ minute: undefined }), null, "and a document that lends no clock");
});

Deno.test("a moment off every clock is no moment, and one that throws is none either", () => {
    const clock = initPageClock(composeDate(SEPTEMBER));
    assertEquals(clock.readMoment(Number.NaN), null, "a moment that is no number");
    const throwing = class {
        constructor() {
            throw new RangeError("a clock torn down");
        }
        static now(): number {
            return 0;
        }
    } as unknown as PageDate;
    const torn = initPageClock(throwing);
    assertEquals(torn.readMoment(0), null, "a clock that throws answers no moment");
    const text = torn.readTimestampText(0);
    assertStrictEquals(text.ok, false, "and no file's moment either");
    if (!text.ok) assertStrictEquals(text.error.kind, RESULT_FAILURE.foreignThrew);
});

Deno.test("a moment past the calendar's reach is written as the page's refusal, not thrown", () => {
    const text = initPageClock(Date).readTimestampText(8.64e15 + 1);
    assertStrictEquals(text.ok, false, "a real clock throws on it, and it comes back as an answer");
    assertEquals(initPageClock(Date).readTimestampText(0), ok("1970-01-01T00:00:00.000Z"), "zero");
});
