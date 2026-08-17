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

export function composeShareText(share: number): string {
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
