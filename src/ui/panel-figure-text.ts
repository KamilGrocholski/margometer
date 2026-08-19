/**
 * A number as the panel writes it, and the only place either spelling is decided.
 *
 * Out of `panel-view.ts` with the split that broke that file up: three of the
 * modules the split produced write figures, and a second spelling of "spaced
 * every three digits" is exactly the drift §7.1's second consumer exists to
 * prevent — one of them printed `39362,0/t` beside `354 258` for a release.
 */

import { composeDecimalText, composeIntegerText } from "@/libs/number.ts";

/** Thousands spaced, as the game itself writes them. */
export function composeFigureText(value: number): string {
  return composeSpacedThousands(composeIntegerText(Math.round(value)));
}

/**
 * A share, and the one case where rounding it would print a lie.
 *
 * ⚠️ **A figure that is there must not read as a figure that is not** (§9.6). A
 * share under half a point rounds to `0%`, which on a panel that keeps *zero* and
 * *could not be read* apart is the third thing neither of them means: something
 * happened, and it was too small to round to. Measured over every recording on
 * 2026-08-19, across the four metrics and the three side tabs: 45 ranked rows
 * print this floor, and without it every one of them would read `0%` beside a
 * figure — 1 741 dealt on
 * `tests/captured-fights/2026-08-15-tempest-grupa-vs-draugr-1.json`, 966 taken on
 * `2026-08-15-tempest-grupa-vs-hildur-2.json` — and the pinned row joined them
 * the moment its figure narrowed to one side.
 *
 * A floor rather than a second decimal place: the reader is being told the figure
 * is small, and `0,2%` down a column of whole numbers is a precision the rest of
 * the panel does not claim. Zero itself still prints `0%`, because there it is the
 * measurement.
 */
export function composeShareText(share: number): string {
  if (share > 0 && share * 100 < 0.5) return "<1%";
  return `${composeDecimalText(share * 100, 0)}%`;
}

/**
 * A run of digits, spaced every three from the right.
 *
 * One function because two kinds of number need it and only one had it: a rate
 * read `39362,0/t` beside a total reading `354 258`, which is the same figure
 * written two ways on one row.
 */
function composeSpacedThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
