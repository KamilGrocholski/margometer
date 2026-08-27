/**
 * Reading a moment out of text.
 *
 * `Date.parse` is the same trap as `Number`: it answers `NaN` rather than
 * refusing, and `NaN` compares false against everything, so a check written as
 * `parsed > limit` passes an unreadable date instead of catching it. It also
 * accepts far more than it looks like it does — `Date.parse("2026")` is a valid
 * year, and `new Date("whatever")` is an Invalid Date object that only says so
 * when printed.
 *
 * One shape is accepted here, the one this project writes: a calendar date,
 * optionally with a time in UTC.
 */

import { getEndOfDigits, hasDigitsAt } from "@/libs/text-runs.ts";

const CALENDAR_DATE_END = 10;
const SECONDS_END = 19;
const MOST_FRACTION_DIGITS = 3;

/**
 * `YYYY-MM-DD`, optionally `THH:MM:SS` with up to three fractional digits and a
 * `Z`. Walked rather than matched, and the walk is total the way a pattern
 * anchored at both ends was: every field states the separator that follows it,
 * and the last check is against the length, so nothing trails unread.
 */
function isIsoText(text: string): boolean {
  if (!hasDigitsAt(text, 0, 4) || text[4] !== "-") return false;
  if (!hasDigitsAt(text, 5, 2) || text[7] !== "-") return false;
  if (!hasDigitsAt(text, 8, 2)) return false;
  if (text.length === CALENDAR_DATE_END) return true;

  if (text[CALENDAR_DATE_END] !== "T") return false;
  if (!hasDigitsAt(text, 11, 2) || text[13] !== ":") return false;
  if (!hasDigitsAt(text, 14, 2) || text[16] !== ":") return false;
  if (!hasDigitsAt(text, 17, 2)) return false;

  let index = SECONDS_END;
  if (text[index] === ".") {
    const start = index + 1;
    const end = getEndOfDigits(text, start);
    if (end === start || end - start > MOST_FRACTION_DIGITS) return false;
    index = end;
  }
  return text[index] === "Z" && index + 1 === text.length;
}

/**
 * Milliseconds since the epoch, or null. Null covers both a shape we do not
 * accept and a date that does not exist — `2026-02-30` matches the pattern and
 * is still refused.
 */
export function getMillisecondsFromIsoText(text: string): number | null {
  if (!isIsoText(text)) return null;
  const milliseconds = Date.parse(text);
  if (Number.isNaN(milliseconds)) return null;
  // `Date.parse` rolls a day past the end of its month over into the next one,
  // so the round trip is what catches it: 2026-02-30 comes back as 03-02.
  return new Date(milliseconds).toISOString().startsWith(text.slice(0, 10)) ? milliseconds : null;
}
