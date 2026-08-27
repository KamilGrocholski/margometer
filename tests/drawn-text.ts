/**
 * Taking apart a figure the panel drew, so a test can do arithmetic on it.
 *
 * Two shapes and nothing else: a number the panel spaces every three digits, and
 * a share it wraps in brackets with a per-cent sign. Both are read back the way
 * a person reads them — by removing what was added — and **never** by asking
 * `src/ui/panel-words.ts` to say it again. §7.5 is explicit about that: a test
 * that reads a string back from the module that writes it holds the two to be
 * the same and neither to be right.
 *
 * Here rather than in each test because seventeen call sites had written the
 * same removal, which is the drift §7.1 puts a shared module at the second
 * consumer to stop.
 */

import { isWhitespaceAt } from "@/libs/text-runs.ts";

/** What a bracketed share is wrapped in. */
const BRACKETS = "()%";

/** Every whitespace character out. The panel spaces its thousands. */
export function composeWithoutWhitespace(text: string): string {
  let kept = "";
  for (let index = 0; index < text.length; index += 1) {
    if (!isWhitespaceAt(text, index)) kept += text[index];
  }
  return kept;
}

/** The brackets and the per-cent sign out. Whatever is between them is left alone. */
export function composeWithoutBrackets(text: string): string {
  let kept = "";
  for (const character of text) {
    if (!BRACKETS.includes(character)) kept += character;
  }
  return kept;
}

/**
 * Whether `token` stands alone in `text`, rather than inside a longer word.
 *
 * The reason it is a word and not a substring: `blok` is the root of the Polish
 * `zablokowane`, and finding it there is the translation working. What must not
 * appear is the token standing on its own.
 *
 * A letter is one that has a case. That is what the `\p{L}` here stood in for,
 * and it is exact for both alphabets in play — Polish, and the game's ASCII
 * keys. An uncased script would read as not-a-letter, and the panel has never
 * drawn one. The other half of what this replaces is gone rather than rewritten:
 * a token had to be escaped before it could be put into a pattern, and a token
 * compared as text does not.
 */
export function hasTokenAsWord(text: string, token: string): boolean {
  // ⚠️ **This one stops a hang, not a wrong answer.** An empty token is found at
  // every position and advances the scan by none of them, so the loop below
  // never ends. Measured by removing this line: the run does not fail, it stops
  // reporting.
  if (token === "") return false;
  for (let at = text.indexOf(token); at !== -1; at = text.indexOf(token, at + 1)) {
    if (isLetterAt(text, at - 1) || isLetterAt(text, at + token.length)) continue;
    return true;
  }
  return false;
}

function isLetterAt(text: string, index: number): boolean {
  const character = text[index];
  if (character === undefined) return false;
  return character.toLowerCase() !== character.toUpperCase();
}
