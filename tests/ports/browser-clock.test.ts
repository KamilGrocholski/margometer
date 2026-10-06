/**
 * The page's own clock. A page is somebody else's program, so a `Date` answering a day no calendar
 * carries is refused rather than drawn: a shelf of twenty fights spans days, and a wrong one reads
 * as a fight that happened.
 */

import { assertEquals, assertInstanceOf, assertStrictEquals, assertThrows } from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { type BrowserDate, initBrowserClock } from "#/src/ports/browser-time.ts";

const SEPTEMBER = { day: 13, month: 8, hour: 21, minute: 5 };

Deno.test("a moment is read as the reader's own day and time, the month counted from one", () => {
    const clock = initBrowserClock(composeDate(SEPTEMBER));
    assertEquals(clock.readMoment(0), { day: 13, month: 9, hour: 21, minute: 5 }, "as a person");
    assertStrictEquals(clock.readNowMilliseconds(), 1234, "and now is the page's own now");
    assertEquals(clock.readTimestampText(0), "2026-09-13T21:05:00.000Z", "a file's moment");
});

/** A page clock answering whatever the test says, for every moment asked about. */
function composeDate(
    parts: Record<string, number | undefined>,
    now: unknown = 1234,
    timestampText: unknown = "2026-09-13T21:05:00.000Z",
): BrowserDate {
    return class {
        getDate = parts.day === undefined ? undefined : () => parts.day;
        getMonth = parts.month === undefined ? undefined : () => parts.month;
        getHours = parts.hour === undefined ? undefined : () => parts.hour;
        getMinutes = parts.minute === undefined ? undefined : () => parts.minute;
        toISOString(): unknown {
            return timestampText;
        }
        static now(): unknown {
            return now;
        }
    } as unknown as BrowserDate;
}

Deno.test("a now that is no whole millisecond past nought is the page's failure, not a moment", () => {
    const readNowWith = (now: unknown) =>
        initBrowserClock(composeDate(SEPTEMBER, now)).readNowMilliseconds();
    assertInstanceOf(readNowWith(1.5), errors.Caught, "a fraction of one");
    assertInstanceOf(readNowWith(Number.NaN), errors.Caught, "no number at all");
    assertInstanceOf(readNowWith("1234"), errors.Caught, "and a number written as text");
    assertInstanceOf(readNowWith(-1), errors.Caught, "a moment before the clock's nought");
    assertStrictEquals(readNowWith(0), 0, "and the nought itself, which is a moment");
    assertStrictEquals(readNowWith(1), 1, "as the one after it is");
});

Deno.test("a moment written down as no text is the page's failure, not a file's moment", () => {
    const clock = initBrowserClock(composeDate(SEPTEMBER, 1234, 20260913));
    assertInstanceOf(clock.readTimestampText(0), errors.Caught, "a number where text was asked");
});

Deno.test("a clock answering a day outside the calendar answers no moment at all", () => {
    const readMomentWith = (parts: Record<string, number | undefined>) =>
        initBrowserClock(composeDate({ ...SEPTEMBER, ...parts })).readMoment(0);
    assertEquals(readMomentWith({ day: 99 }), null, "a day past the calendar");
    assertEquals(readMomentWith({ day: 0 }), null, "and one before it");
    assertEquals(
        readMomentWith({ day: 31 }),
        { day: 31, month: 9, hour: 21, minute: 5 },
        "its last day",
    );
    assertEquals(
        readMomentWith({ day: 1 }),
        { day: 1, month: 9, hour: 21, minute: 5 },
        "and its first",
    );
    assertEquals(readMomentWith({ month: 12 }), null, "a thirteenth month");
    assertEquals(
        readMomentWith({ month: 11 }),
        { day: 13, month: 12, hour: 21, minute: 5 },
        "December",
    );
    assertEquals(readMomentWith({ hour: -1 }), null, "an hour before midnight's");
    assertEquals(readMomentWith({ hour: 24 }), null, "and one past the day's last");
    assertEquals(readMomentWith({ minute: 60 }), null, "a minute past the hour's last");
    assertEquals(
        readMomentWith({ minute: 0 }),
        { day: 13, month: 9, hour: 21, minute: 0 },
        "and its first",
    );
    assertEquals(readMomentWith({ hour: 21.5 }), null, "and a fraction of one");
    assertEquals(readMomentWith({ minute: undefined }), null, "and a document that lends no clock");
});

Deno.test("a moment off every clock is never asked about, and a clock that throws says none", () => {
    const clock = initBrowserClock(composeDate(SEPTEMBER));
    assertThrows(() => clock.readMoment(Number.NaN), Error, "a clock stated");
    assertThrows(() => clock.readMoment(0.5), Error, "a clock stated");
    const throwing = class {
        constructor() {
            throw new RangeError("a clock torn down");
        }
        static now(): number {
            throw new RangeError("a clock torn down");
        }
    } as unknown as BrowserDate;
    const torn = initBrowserClock(throwing);
    assertEquals(torn.readMoment(0), null, "a clock that throws answers no moment");
    assertInstanceOf(
        torn.readNowMilliseconds(),
        errors.Caught,
        "and no now, as the page's failure",
    );
    const text = torn.readTimestampText(0);
    assertInstanceOf(text, Error, "and no file's moment either");
    assertInstanceOf(text, errors.Caught, "as the page's failure");
});

Deno.test("a moment past the calendar's reach is written as the page's refusal, not thrown", () => {
    const text = initBrowserClock(Date).readTimestampText(8.64e15 + 1);
    assertInstanceOf(
        text,
        errors.Caught,
        "a real clock throws on it, and it comes back as an answer",
    );
    assertEquals(initBrowserClock(Date).readTimestampText(0), "1970-01-01T00:00:00.000Z", "zero");
});
