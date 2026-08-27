/**
 * Reading a line out of a document this repository writes.
 *
 * Three guards ask the same two questions of `docs/` — is this exact line here,
 * and what does the line beginning with this label say — and each had written
 * its own anchored pattern. §7.1 puts a module at the second consumer; this
 * arrived at the third.
 *
 * Line-oriented on purpose. A shape stated as "a line that is exactly this" is
 * one a person can look for in the file with their eyes, which is not true of
 * the same claim spelled with anchors and a multi-line flag.
 */

const LINE_SEPARATOR = "\n";

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
