import { describe, expect, test } from "bun:test";
import { getMillisecondsFromIsoText } from "@/libs/timestamp.ts";

describe("reading a moment from text", () => {
  test.each([
    ["1970-01-01", 0],
    ["2026-08-04", 1785801600000],
    ["2026-08-04T12:28:13.631Z", 1785846493631],
    ["2026-08-06T11:55:13Z", 1786017313000],
  ])("%p reads as %p", (text, expected) => {
    expect(getMillisecondsFromIsoText(text)).toBe(expected);
  });

  test.each([
    ["", "nothing"],
    ["2026", "a bare year, which Date.parse reads as the first of January"],
    ["04-08-2026", "the other way round"],
    ["2026-08-04 12:28:13", "a space where the T belongs"],
    ["2026-08-04T12:28:13", "a local time, which means a different moment per reader"],
    ["yesterday", "a word"],
  ])("%p is refused — %s", (text) => {
    expect(getMillisecondsFromIsoText(text)).toBeNull();
  });

  // `Date.parse` rolls these over instead of refusing: 2026-02-30 comes back as
  // the second of March, which is a real moment nobody wrote.
  test.each(["2026-02-30", "2026-04-31", "2025-02-29"])("%p is a day that does not exist", (text) => {
    expect(getMillisecondsFromIsoText(text)).toBeNull();
  });

  test("a month that does not exist is refused", () => {
    expect(getMillisecondsFromIsoText("2026-13-01")).toBeNull();
  });
});
