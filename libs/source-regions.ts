/**
 * Where the comments and the text literals sit inside a piece of source.
 *
 * Two readers want the same fact in opposite shapes, which is what §7.1 calls a
 * module at its second consumer. `tests/tools/source-layout.test.ts` wants the
 * source with its comments gone, because every guard it runs is a text search
 * and a comment is the one place a banned construct legitimately appears.
 * `tools/mutation-sweep.ts` wants the spans themselves — a mutation inside a
 * comment survives every test that will ever be written, so it is noise in a
 * report whose whole value is its survivors.
 *
 * Patterns rather than a parser, and the same two this repository has read
 * source with since its first guard: a slash pair opens a comment only at the
 * start of a line or after whitespace, so a URL inside a string survives. The
 * cost is known and it is in the safe direction for both callers — a quotation
 * mark inside a comment can start a literal that is not one, which hides a span
 * rather than inventing one.
 */

import { assertDefined } from "@/libs/assert.ts";

/** Half-open, in code units, into the source it was read from. */
export type SourceRange = { start: number; end: number };

const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;
const LINE_COMMENT = /(^|\s)\/\/.*$/gm;

/**
 * A double- or single-quoted literal, or a template. Templates are matched
 * whole, interpolations included: a caller excluding a span wants the whole of
 * it, and a caller reading the text back gets what it would have read anyway.
 */
const TEXT_LITERAL = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`[^`]*`/g;

export function composeSourceWithoutComments(source: string): string {
  return source.replace(BLOCK_COMMENT, "").replace(LINE_COMMENT, "$1");
}

export function getCommentRangesFromSource(source: string): SourceRange[] {
  const ranges: SourceRange[] = [];

  for (const match of source.matchAll(BLOCK_COMMENT)) {
    const start = assertDefined(match.index, "matchAll states where it matched");
    ranges.push({ start, end: start + match[0].length });
  }

  for (const match of source.matchAll(LINE_COMMENT)) {
    const start = assertDefined(match.index, "matchAll states where it matched");
    // The pattern captures the whitespace that admits the comment, and that
    // character belongs to the code before it.
    const lead = match[1] ?? "";
    ranges.push({ start: start + lead.length, end: start + match[0].length });
  }

  return ranges.sort((left, right) => left.start - right.start);
}

/**
 * The same source with every comment turned to blanks, so an offset still means
 * what it meant. Newlines survive, because a pattern anchored to a line has to
 * keep finding the line.
 */
export function composeSourceWithBlankedComments(source: string): string {
  // `split("")` and not a spread: the spread iterates code points, so one
  // character outside the basic plane would shift every offset after it.
  const characters = source.split("");
  for (const { start, end } of getCommentRangesFromSource(source)) {
    for (let index = start; index < end; index += 1) {
      if (characters[index] !== "\n") characters[index] = " ";
    }
  }
  return characters.join("");
}

/**
 * Comments are blanked before the literals are read, not after: a lone
 * quotation mark in prose would otherwise open a literal that runs into the
 * code below it and swallow half a file.
 */
export function getTextRangesFromSource(source: string): SourceRange[] {
  const blanked = composeSourceWithBlankedComments(source);
  return [...blanked.matchAll(TEXT_LITERAL)].map((match) => {
    const start = assertDefined(match.index, "matchAll states where it matched");
    return { start, end: start + match[0].length };
  });
}
