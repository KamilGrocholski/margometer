/**
 * Where the comments, the text literals and the patterns sit inside a piece of
 * source.
 *
 * Two readers want the same fact in opposite shapes, which is what §7.1 calls a
 * module at its second consumer. `tests/tools/source-layout.test.ts` wants the
 * source with its comments gone, because every guard it runs is a text search
 * and a comment is the one place a banned construct legitimately appears.
 * `tools/mutation-sweep.ts` wants the spans themselves — a mutation inside a
 * comment survives every test that will ever be written, so it is noise in a
 * report whose whole value is its survivors.
 *
 * ⚠️ **A scanner, and still not a parser.** It was five patterns until
 * 2026-08-27, and the rules it reads by are the ones those patterns stated,
 * unchanged: a slash pair opens a comment only at the start of a line or after
 * whitespace, so a URL inside a string survives; a slash after a value divides
 * and after anything else opens a pattern. The cost is the same and is in the
 * safe direction for both callers — a quotation mark inside a comment can start
 * a literal that is not one, which hides a span rather than inventing one.
 *
 * What the scanner does **not** inherit is backtracking, and it does not need
 * to: at every position exactly one of the alternatives can begin, because they
 * begin with different characters. That is why a walk can answer identically
 * rather than approximately, and it was measured that way over every tracked
 * `.ts` file in this repository before the patterns went.
 */

import { isAlphanumericAt, isWhitespaceAt } from "@/libs/text-runs.ts";

/** Half-open, in code units, into the source it was read from. */
export type SourceRange = { start: number; end: number };

const BLOCK_COMMENT_OPEN = "/*";
const BLOCK_COMMENT_CLOSE = "*/";
const LINE_COMMENT_OPEN = "//";
const SLASH = "/";
const BACKSLASH = "\\";
const TEMPLATE_QUOTE = "`";
const CLASS_OPEN = "[";
const CLASS_CLOSE = "]";
const PATTERN_FLAGS = "dgimsuvy";
const QUOTES = "\"'`";

/**
 * What ends a line to a pattern: `.` matches none of these and `$` sits before
 * each of them under `m`. Two of them are not the newline anybody types, and
 * leaving them out would make a comment run past the end of its line in a file
 * that used one.
 */
const LINE_TERMINATORS = "\n\r  ";

function isLineTerminatorAt(text: string, index: number): boolean {
  const character = text[index];
  return character !== undefined && LINE_TERMINATORS.includes(character);
}

/** Where the line holding `from` ends, or the end of the text. */
function getEndOfLine(text: string, from: number): number {
  let index = from;
  while (index < text.length && !isLineTerminatorAt(text, index)) index += 1;
  return index;
}

/**
 * Past an escape, or null where there is nothing to escape.
 *
 * A backslash at the end of a line is the null: the patterns spelled an escape
 * `\\.`, and `.` matches no line terminator, so a literal broken across lines
 * that way was never a literal to them either.
 */
function getEndOfEscape(text: string, index: number): number | null {
  if (text[index + 1] === undefined || isLineTerminatorAt(text, index + 1)) return null;
  return index + 2;
}

function getBlockCommentRanges(source: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  let from = 0;
  for (;;) {
    const open = source.indexOf(BLOCK_COMMENT_OPEN, from);
    if (open === -1) return ranges;
    const close = source.indexOf(BLOCK_COMMENT_CLOSE, open + BLOCK_COMMENT_OPEN.length);
    // An unterminated comment is not a comment. The pattern said the same by
    // failing to match, which is worth keeping: a file ending mid-comment is a
    // file that will not compile, and inventing a span to the end of it would
    // hide whatever follows from every guard at once.
    if (close === -1) return ranges;
    const end = close + BLOCK_COMMENT_CLOSE.length;
    ranges.push({ start: open, end });
    from = end;
  }
}

/**
 * Line comments, admitted only at the start of a line or after whitespace.
 *
 * The range starts at the slashes and not at the whitespace before them: that
 * character belongs to the code, which is why the pattern captured it and put it
 * back.
 */
function getLineCommentRanges(source: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  let from = 0;
  for (;;) {
    const open = source.indexOf(LINE_COMMENT_OPEN, from);
    if (open === -1) return ranges;
    if (open !== 0 && !isWhitespaceAt(source, open - 1)) {
      from = open + 1;
      continue;
    }
    const end = getEndOfLine(source, open);
    ranges.push({ start: open, end });
    from = end;
  }
}

/** The source with `ranges` cut out of it. Ranges are ordered and disjoint. */
function composeSourceWithoutRanges(source: string, ranges: SourceRange[]): string {
  let kept = "";
  let from = 0;
  for (const { start, end } of ranges) {
    kept += source.slice(from, start);
    from = end;
  }
  return kept + source.slice(from);
}

export function composeSourceWithoutComments(source: string): string {
  // Block comments first and line comments over the result, which is the order
  // the two `replace` calls here ran in: a `//` inside a block comment is gone
  // with the block, and a `/*` inside a line comment never opens one.
  const withoutBlocks = composeSourceWithoutRanges(source, getBlockCommentRanges(source));
  return composeSourceWithoutRanges(withoutBlocks, getLineCommentRanges(withoutBlocks));
}

export function getCommentRangesFromSource(source: string): SourceRange[] {
  return [...getBlockCommentRanges(source), ...getLineCommentRanges(source)].sort(
    (left, right) => left.start - right.start,
  );
}

/**
 * The same source with every comment turned to blanks, so an offset still means
 * what it meant. Newlines survive, because a reader anchored to a line has to
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
 * Where a text literal opening at `open` ends, or null if it does not.
 *
 * A template is closed by the first backtick and nothing else — no escape is
 * honoured inside one, and interpolations are swallowed whole. That is what the
 * pattern said, and it is right for both callers: one excludes the span and
 * wants all of it, the other reads the text back and would have read the same.
 */
function getTextLiteralEnd(source: string, open: number): number | null {
  const quote = source[open];
  if (quote === TEMPLATE_QUOTE) {
    const close = source.indexOf(TEMPLATE_QUOTE, open + 1);
    return close === -1 ? null : close + 1;
  }

  let index = open + 1;
  for (;;) {
    const character = source[index];
    if (character === undefined) return null;
    if (character === quote) return index + 1;
    // A raw newline ends the attempt. `\r` does not, which is the class the
    // pattern spelled and is deliberately kept.
    if (character === "\n") return null;
    if (character === BACKSLASH) {
      const past = getEndOfEscape(source, index);
      if (past === null) return null;
      index = past;
      continue;
    }
    index += 1;
  }
}

/** The first quote of any kind at or after `from`, or -1. */
function getNextQuote(source: string, from: number): number {
  for (let index = from; index < source.length; index += 1) {
    const character = source[index];
    if (character !== undefined && QUOTES.includes(character)) return index;
  }
  return -1;
}

/**
 * Comments are blanked before the literals are read, not after: a lone
 * quotation mark in prose would otherwise open a literal that runs into the
 * code below it and swallow half a file.
 */
export function getTextRangesFromSource(source: string): SourceRange[] {
  const blanked = composeSourceWithBlankedComments(source);
  const ranges: SourceRange[] = [];
  let from = 0;
  for (;;) {
    const open = getNextQuote(blanked, from);
    if (open === -1) return ranges;
    const end = getTextLiteralEnd(blanked, open);
    // A quote that never closes is not a literal, and the search resumes one
    // character past it rather than at its imagined end.
    if (end === null) {
      from = open + 1;
      continue;
    }
    ranges.push({ start: open, end });
    from = end;
  }
}

/**
 * Whether the text before `start` ends in something a slash could divide.
 *
 * The ambiguity is the whole difficulty and it is settled the way every reader
 * settles it: by what comes before. After a value — a name, a number, a closing
 * bracket — a slash is division; after an operator, a comma, an opening bracket
 * or the start of a statement, it opens a pattern.
 *
 * Added at one caller rather than two, which §9.5 admits for a function inside a
 * module that already exists: `tests/tools/mutation-sweep.test.ts` asks whether
 * the tree spells its operators the way the sweep reads them, and the sweep's
 * own rule table spells `===` and `&&` **inside patterns**, where they are data.
 * Without this the guard reported the file that defines the convention as the
 * one file breaking it.
 */
function hasValueBeforeSlash(source: string, start: number): boolean {
  let index = start;
  while (index > 0 && isWhitespaceAt(source, index - 1)) index -= 1;
  if (index === 0) return false;

  const before = source[index - 1];
  if (before === undefined) return false;
  return (
    isAlphanumericAt(source, index - 1) ||
    before === "_" ||
    before === "$" ||
    before === ")" ||
    before === CLASS_CLOSE
  );
}

/** Where a character class opening at `open` ends, or null if it does not. */
function getCharacterClassEnd(source: string, open: number): number | null {
  let index = open + 1;
  for (;;) {
    const character = source[index];
    if (character === undefined) return null;
    if (character === CLASS_CLOSE) return index + 1;
    if (character === "\n") return null;
    if (character === BACKSLASH) {
      const past = getEndOfEscape(source, index);
      if (past === null) return null;
      index = past;
      continue;
    }
    index += 1;
  }
}

/**
 * Where a pattern opening at `open` ends, flags included, or null.
 *
 * At least one element is required, which is what keeps `//` a comment rather
 * than an empty pattern. Nothing here backtracks, and nothing needs to: a
 * slash ends it, a backslash opens an escape, a bracket opens a class, and
 * everything else is one character — four cases that cannot both apply.
 */
function getPatternEnd(source: string, open: number): number | null {
  let index = open + 1;
  let elements = 0;
  for (;;) {
    const character = source[index];
    if (character === undefined) return null;

    if (character === SLASH) {
      if (elements === 0) return null;
      let end = index + 1;
      while (end < source.length) {
        const flag = source[end];
        if (flag === undefined || !PATTERN_FLAGS.includes(flag)) break;
        end += 1;
      }
      return end;
    }

    if (character === "\n") return null;

    if (character === BACKSLASH) {
      const past = getEndOfEscape(source, index);
      if (past === null) return null;
      index = past;
    } else if (character === CLASS_OPEN) {
      const past = getCharacterClassEnd(source, index);
      if (past === null) return null;
      index = past;
    } else {
      index += 1;
    }
    elements += 1;
  }
}

export function getRegularExpressionRangesFromSource(source: string): SourceRange[] {
  const blanked = composeSourceWithBlankedComments(source);
  const ranges: SourceRange[] = [];
  let from = 0;
  for (;;) {
    const open = blanked.indexOf(SLASH, from);
    if (open === -1) return ranges;

    const end = getPatternEnd(blanked, open);
    if (end === null) {
      from = open + 1;
      continue;
    }

    // ⚠️ **Consumed whether or not it is kept.** A division that read as a
    // pattern still spans what it spans, and resuming inside it would find a
    // second, shorter pattern in its tail. The `g` flag did this by advancing
    // past every match including the ones the check below threw away; saying it
    // outright is the whole of what replaces that.
    from = end;
    if (hasValueBeforeSlash(blanked, open)) continue;
    ranges.push({ start: open, end });
  }
}
