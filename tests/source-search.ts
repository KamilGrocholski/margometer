/**
 * The two questions the guards ask of a source file: what does it import, and
 * where does it call this name.
 *
 * Both are text searches over source with its comments already gone — which is
 * what `tests/tools/source-layout.test.ts` has always been, and what
 * `tests/tools/named-exports.test.ts` and the layering guards each spelled again
 * for themselves. §7.1 puts a module at the second consumer.
 *
 * ⚠️ **A search, not a parser, and the guards depend on it staying one.** A name
 * inside a text literal is found here as readily as a call — which is why the
 * callers hand in source with the comments stripped and why the register in §9.5
 * is written to be searched for rather than parsed. What this adds over
 * `indexOf` is the two boundaries a pattern's `\b` carried: a call is a whole
 * name, and an import is what stands in the quotes after `from`.
 */

import { getEndOfWhitespace, getWordOccurrences } from "@/libs/text-runs.ts";

const IMPORT_KEYWORD = "from";

const QUOTE = '"';

/**
 * Every module specifier the source imports from, in the order it names them.
 *
 * `from` has to stand alone — a name ending in it is not the keyword — and the
 * specifier is what the quotes hold. A quote that never closes ends the reading:
 * there is no import after it that a reader could trust.
 */
export function getImportSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  for (const at of getWordOccurrences(source, IMPORT_KEYWORD)) {
    const opening = getEndOfWhitespace(source, at + IMPORT_KEYWORD.length);
    if (source[opening] !== QUOTE) continue;
    const closing = source.indexOf(QUOTE, opening + 1);
    if (closing === -1) return specifiers;
    specifiers.push(source.slice(opening + 1, closing));
  }
  return specifiers;
}

/**
 * Every index at which `name` is called — the name standing alone, then a
 * bracket, with whatever whitespace somebody wrote between them.
 *
 * A name opening with something no word carries, `.toFixed` among them, asks no
 * boundary in front of it: that is `libs/text-runs.ts`'s rule, and it is what
 * lets a member and a bare function be asked for the same way.
 */
export function getCallSites(source: string, name: string): number[] {
  return getWordOccurrences(source, name).filter(
    (at) => source[getEndOfWhitespace(source, at + name.length)] === "(",
  );
}

/** Whether the source calls it at all. */
export function hasCall(source: string, name: string): boolean {
  return getCallSites(source, name).length > 0;
}
