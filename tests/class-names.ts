/**
 * The one question two guards ask: which class names does this stylesheet style,
 * and which does this source assign?
 *
 * `tests/ui/panel-class-names.test.ts` asks it of the panel — a stylesheet in one
 * file and a renderer in another — and `tests/tools/preview-class-names.test.ts`
 * asks it of the preview harness, where the rules sit in `tools/preview-page.ts`
 * and the build status is written from `tools/preview-server.ts`. Both exist
 * because a class on one side and no class on the other fails silently: an
 * unstyled node draws, and a rule nothing wears styles nothing
 * (`docs/specs/2026-08-18-a-name-we-did-not-choose.md`).
 *
 * ⚠️ **Only the part that is genuinely one question is here**, which is the same
 * line `tests/dated-document.ts` draws. The two guards still disagree about what
 * counts as a consumer — the preview reads its own markup and a second source
 * file, the panel does not — and none of that moved, so neither needs the other
 * open to be read.
 */

import { getEndOfWhitespace, getPartsSeparatedByWhitespace, isWordStart } from "@/libs/text-runs.ts";
import { getClassNamesFromSelector, getStyleRules } from "@/tests/style-rules.ts";

/** The property a class is written to, in either shape. */
const CLASS_PROPERTY = "className";

const QUOTE = '"';

/**
 * The classes a stylesheet styles.
 *
 * Takes CSS rather than the file that composes it: the sources here interpolate
 * design tokens (`${t.radius}`) and cite neighbouring modules in prose, and a
 * `.name` pattern is happy to call both of those a selector (§7.5 — extract
 * structure with structure). What comes back from a composer is CSS, so the only
 * thing left to strip is CSS's own comments.
 */
export function getStyledClassNames(css: string): Set<string> {
  const styled = new Set<string>();
  for (const rule of getStyleRules(css)) {
    for (const name of getClassNamesFromSelector(rule.selector)) styled.add(name);
  }
  return styled;
}

/**
 * The classes a TypeScript source assigns to a node.
 *
 * Comparison operands go first. `className` is assigned out of a ternary on
 * `line.kind === "title"` and the like, and without this the words being compared
 * arrive as though they were class names.
 *
 * The caller strips its own comments — what counts as one is the caller's
 * business, and `libs/source-regions.ts` already owns the answer.
 */
export function getAssignedClassNames(sourceWithoutComments: string): Set<string> {
  const assigned = new Set<string>();
  for (const value of getAssignedValues(sourceWithoutComments)) {
    for (const text of getQuotedTextsOutsideComparisons(value)) {
      for (const name of getPartsSeparatedByWhitespace(text)) assigned.add(name);
    }
  }
  return assigned;
}

/**
 * What each `className` is handed, as far as the end of the expression.
 *
 * A class can arrive as an object property rather than an assignment — the
 * panel's title-bar buttons carry theirs that way — so both `=` and `:` open a
 * value. A doubled `=` opens nothing: `className === "title"` is a comparison,
 * and reading it as an assignment would call the word being compared a class.
 * The value ends at the `;` or `,` that ends the expression, which is where the
 * pattern's `[^;,]+` ended it.
 */
function getAssignedValues(source: string): string[] {
  const values: string[] = [];
  for (let at = source.indexOf(CLASS_PROPERTY); at !== -1; at = source.indexOf(CLASS_PROPERTY, at + 1)) {
    if (!isWordStart(source, at)) continue;
    let index = getEndOfWhitespace(source, at + CLASS_PROPERTY.length);
    const opening = source[index];
    if (opening === "=" ? source[index + 1] === "=" : opening !== ":") continue;
    index = getEndOfWhitespace(source, index + 1);
    let end = index;
    while (end < source.length && source[end] !== ";" && source[end] !== ",") end += 1;
    if (end > index) values.push(source.slice(index, end));
  }
  return values;
}

/**
 * Every quoted text in an expression, minus the ones being compared against.
 *
 * `className` is assigned out of a ternary on `line.kind === "title"` and the
 * like, and without this the words on the right of a comparison arrive as though
 * they were class names.
 */
function getQuotedTextsOutsideComparisons(value: string): string[] {
  const texts: string[] = [];
  let index = 0;
  while (index < value.length) {
    const character = value[index];
    if (character === "!" || character === "=") {
      let after = index + 1;
      while (value[after] === "=") after += 1;
      const isComparison = after > index + 1;
      index = isComparison ? getEndOfWhitespace(value, after) : after;
      if (isComparison && value[index] === QUOTE) index = getEndOfQuotedText(value, index);
      continue;
    }
    if (character === QUOTE) {
      const end = getEndOfQuotedText(value, index);
      texts.push(value.slice(index + 1, end - 1));
      index = end;
      continue;
    }
    index += 1;
  }
  return texts;
}

/**
 * One past the closing quote of the text opening at `start`.
 *
 * An unterminated one ends at the end of the value, which is the only answer
 * that terminates: a caller advancing by what this returns cannot then read the
 * same quote again.
 */
function getEndOfQuotedText(value: string, start: number): number {
  const closing = value.indexOf(QUOTE, start + 1);
  return closing === -1 ? value.length : closing + 1;
}
