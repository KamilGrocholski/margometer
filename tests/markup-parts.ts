/**
 * The parts of a page: an element's attributes and what is written inside it,
 * and the value of one attribute wherever it is worn.
 *
 * The preview harness is the only markup this repository composes, and three
 * guards read it — the class names it wears, the words a published page says,
 * and the scripts a driver runs. Each had spelled its own pattern for the same
 * two questions, which is what §7.1 puts a shared module at the second consumer
 * to stop.
 *
 * ⚠️ **A reader of this markup, not of HTML.** The pages here nest no element of
 * the same name inside itself, so an element ends at the first closing tag; an
 * attribute value is quoted with `"`, because that is what the composer writes.
 * Somebody else's HTML fed through this would be read wrongly rather than
 * refused, which is why it sits beside the guards it serves.
 */

import { isWhitespaceAt } from "@/libs/text-runs.ts";

/** What stands inside the opening tag, and what stands between the tags. */
export type MarkupElement = { attributes: string; text: string };

/**
 * Every `tag` element in `markup`.
 *
 * The name has to end where the tag says it does: `<script>` and `<scriptx>` are
 * different elements, and a reader that matched a prefix would hand the caller
 * the wrong one without saying so.
 */
export function getElements(markup: string, tag: string): MarkupElement[] {
  const elements: MarkupElement[] = [];
  const opening = `<${tag}`;
  const closing = `</${tag}>`;
  for (let at = markup.indexOf(opening); at !== -1; at = markup.indexOf(opening, at + 1)) {
    const afterName = at + opening.length;
    if (markup[afterName] !== ">" && !isWhitespaceAt(markup, afterName)) continue;
    const openingEnd = markup.indexOf(">", afterName);
    if (openingEnd === -1) continue;
    const end = markup.indexOf(closing, openingEnd + 1);
    if (end === -1) continue;
    elements.push({
      attributes: markup.slice(afterName, openingEnd).trim(),
      text: markup.slice(openingEnd + 1, end),
    });
  }
  return elements;
}

/**
 * What `attribute` is set to, everywhere it is worn.
 *
 * The name is read as a whole word — `class` and `data-class` are two
 * attributes, and only whitespace or the tag's own name separates one from what
 * precedes it.
 */
export function getAttributeValues(markup: string, attribute: string): string[] {
  const values: string[] = [];
  const opening = `${attribute}="`;
  for (let at = markup.indexOf(opening); at !== -1; at = markup.indexOf(opening, at + 1)) {
    if (at > 0 && !isWhitespaceAt(markup, at - 1)) continue;
    const start = at + opening.length;
    const end = markup.indexOf(`"`, start);
    if (end === -1) continue;
    values.push(markup.slice(start, end));
  }
  return values;
}
