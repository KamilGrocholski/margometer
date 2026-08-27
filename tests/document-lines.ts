/**
 * Reading a line out of a document this repository writes.
 *
 * The guards over what this repository writes ask the same few questions — is
 * this exact line here, what does the line beginning with this label say, and
 * how deep is this heading — and each had written its own anchored pattern.
 * §7.1 puts a module at the second consumer; every question here arrived with
 * at least two asking it.
 *
 * Line-oriented on purpose. A shape stated as "a line that is exactly this" is
 * one a person can look for in the file with their eyes, which is not true of
 * the same claim spelled with anchors and a multi-line flag.
 */

import { getEndOfWhitespace, isWhitespaceAt } from "@/libs/text-runs.ts";

const LINE_SEPARATOR = "\n";

const HEADING_MARK = "#";

const MOST_HEADING_DEPTH = 6;

/**
 * How deep a heading is — 1 for `#`, and null where the line is not one.
 *
 * A heading is the marks, one space, and something after it: `#hashtag` is not a
 * heading and neither is a line of hashes on its own, which is how a document
 * draws a rule.
 */
export function getHeadingDepth(line: string): number | null {
  let depth = 0;
  while (depth < line.length && line[depth] === HEADING_MARK) depth += 1;
  if (depth === 0 || depth > MOST_HEADING_DEPTH) return null;
  if (line[depth] !== " ") return null;
  return isWhitespaceAt(line, depth + 1) || line.length === depth + 1 ? null : depth;
}

/**
 * A wrapped comment or paragraph flattened onto one line: every line break, the
 * indentation after it and the star a docblock draws down its left edge become
 * one space.
 *
 * Prose here wraps, so a claim and the figure that scopes it routinely sit on
 * different lines — and a reader taking a line at a time sees neither half
 * beside the other.
 */
export function composeUnwrappedProse(text: string): string {
  let flattened = "";
  let index = 0;
  while (index < text.length) {
    if (text[index] !== LINE_SEPARATOR) {
      flattened += text[index];
      index += 1;
      continue;
    }
    let after = getEndOfWhitespace(text, index + 1);
    if (text[after] === "*") after += 1;
    if (isWhitespaceAt(text, after)) after += 1;
    flattened += " ";
    index = after;
  }
  return flattened;
}

const TICK = "`";

/**
 * What `text` writes in code ticks, in the order it writes them.
 *
 * How this repository's documents name a thing — a key, a construct, a file — so
 * a guard reading a claim about one reads the ticks rather than the sentence
 * around them. An empty pair names nothing and is skipped; an opening tick with
 * no closing one ends the reading, because what follows it is prose nobody
 * fenced.
 */
export function getTickedNames(text: string): string[] {
  const names: string[] = [];
  let index = 0;
  for (;;) {
    const opening = text.indexOf(TICK, index);
    if (opening === -1) return names;
    const closing = text.indexOf(TICK, opening + 1);
    if (closing === -1) return names;
    if (closing > opening + 1) names.push(text.slice(opening + 1, closing));
    index = closing + 1;
  }
}

/** Whether any line of `text` is exactly `line`. */
export function hasLine(text: string, line: string): boolean {
  return text.split(LINE_SEPARATOR).includes(line);
}

/**
 * What every line beginning with `label` says after it.
 *
 * A line that is the label and nothing else is left out: a `*Where:*` with no
 * path after it points at nothing, and a caller asking what a label states wants
 * the states, not the labels.
 */
export function getLabelledLines(text: string, label: string): string[] {
  const stated: string[] = [];
  for (const line of text.split(LINE_SEPARATOR)) {
    if (!line.startsWith(label)) continue;
    const rest = line.slice(label.length);
    if (rest !== "") stated.push(rest);
  }
  return stated;
}

/** The first of those, or null where there is none. */
export function getLabelledLine(text: string, label: string): string | null {
  return getLabelledLines(text, label)[0] ?? null;
}
