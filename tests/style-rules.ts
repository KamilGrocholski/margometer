/**
 * A stylesheet cut into rules: what each one selects, and what it declares.
 *
 * Three guards had written this walk — `tests/class-names.ts` to collect the
 * classes a sheet styles, `tests/ui/panel-element.test.ts` to compare two rules'
 * insets, `tests/ui/panel-look.test.ts` to tell a state's word from a thing's —
 * and each had spelled the comment stripping for itself. §7.1 puts a shared
 * module at the second consumer; this arrived at the third.
 *
 * ⚠️ **Flat by construction, and that is a claim about these sheets rather than
 * about CSS.** Nothing here writes `@media`, `@supports` or `@keyframes`, so a
 * brace opens a rule and the next one closes it. A nested sheet read this way
 * would answer with the at-rule's own text as a selector — which is why the
 * reader is here, beside the guards it serves, rather than presented as a reader
 * of CSS in general.
 */

import { isEveryCharacterIn } from "@/libs/text-runs.ts";

const COMMENT_OPENING = "/*";
const COMMENT_CLOSING = "*/";

/** What a rule selects, and everything between its braces. */
export type StyleRule = { selector: string; body: string };

/**
 * The comments out.
 *
 * They ship inside the sheet, so a selector read without dropping them is the
 * prose above it. An unterminated comment takes the rest of the sheet with it,
 * the way a browser's parser does.
 */
export function composeStyleWithoutComments(css: string): string {
  let kept = "";
  let index = 0;
  for (;;) {
    const opening = css.indexOf(COMMENT_OPENING, index);
    if (opening === -1) return kept + css.slice(index);
    kept += css.slice(index, opening);
    const closing = css.indexOf(COMMENT_CLOSING, opening + COMMENT_OPENING.length);
    if (closing === -1) return kept;
    index = closing + COMMENT_CLOSING.length;
  }
}

/**
 * Every rule in the sheet, comments already gone.
 *
 * A selector is whatever stands between the previous rule and the brace, with
 * its whitespace trimmed off both ends. Text after the last rule is not a rule
 * and is dropped, which is what a sheet ending in a newline is.
 */
export function getStyleRules(css: string): StyleRule[] {
  const rules: StyleRule[] = [];
  const text = composeStyleWithoutComments(css);
  let index = 0;
  for (;;) {
    const opening = text.indexOf("{", index);
    if (opening === -1) return rules;
    const closing = text.indexOf("}", opening + 1);
    if (closing === -1) return rules;
    rules.push({
      selector: text.slice(index, opening).trim(),
      body: text.slice(opening + 1, closing),
    });
    index = closing + 1;
  }
}

/** What a property is written with, which is narrower than CSS allows. */
const PROPERTY_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

/**
 * What a rule body declares: each property, and the value it is given.
 *
 * A declaration ends at the semicolon and a value begins at the first colon, so
 * a value carrying a colon of its own stays whole. A name written with anything
 * a property is not written with is no declaration and is left out rather than
 * guessed at.
 */
export function getDeclarations(body: string): { property: string; value: string }[] {
  const declared: { property: string; value: string }[] = [];
  for (const piece of body.split(";")) {
    const cut = piece.indexOf(":");
    if (cut === -1) continue;
    const property = piece.slice(0, cut).trim();
    if (property === "" || !isEveryCharacterIn(property, PROPERTY_CHARACTERS)) continue;
    declared.push({ property, value: piece.slice(cut + 1).trim() });
  }
  return declared;
}

/**
 * The class names a selector names, in the order it names them.
 *
 * A class is a dot, a letter, and then the characters a class name may carry —
 * which is narrower than CSS allows and exactly what these sheets write. The
 * order is what tells `.row.chosen` apart from `.chosen.row`, and the tail is
 * the modifier.
 */
export function getClassNamesFromSelector(selector: string): string[] {
  const names: string[] = [];
  for (let index = 0; index < selector.length; index += 1) {
    if (selector[index] !== ".") continue;
    const start = index + 1;
    if (!isClassStartAt(selector, start)) continue;
    let end = start;
    while (end < selector.length && isClassCharacterAt(selector, end)) end += 1;
    names.push(selector.slice(start, end));
    index = end - 1;
  }
  return names;
}

function isClassStartAt(selector: string, index: number): boolean {
  const character = selector[index];
  if (character === undefined) return false;
  return (character >= "a" && character <= "z") || (character >= "A" && character <= "Z");
}

function isClassCharacterAt(selector: string, index: number): boolean {
  const character = selector[index];
  if (character === undefined) return false;
  return (
    (character >= "a" && character <= "z") ||
    (character >= "A" && character <= "Z") ||
    (character >= "0" && character <= "9") ||
    character === "-" ||
    character === "_"
  );
}
