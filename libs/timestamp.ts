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

const ISO_TEXT = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/;

/**
 * Milliseconds since the epoch, or null. Null covers both a shape we do not
 * accept and a date that does not exist — `2026-02-30` matches the pattern and
 * is still refused.
 */
export function getMillisecondsFromIsoText(text: string): number | null {
  if (!ISO_TEXT.test(text)) return null;
  const milliseconds = Date.parse(text);
  if (Number.isNaN(milliseconds)) return null;
  // `Date.parse` rolls a day past the end of its month over into the next one,
  // so the round trip is what catches it: 2026-02-30 comes back as 03-02.
  return new Date(milliseconds).toISOString().startsWith(text.slice(0, 10)) ? milliseconds : null;
}
