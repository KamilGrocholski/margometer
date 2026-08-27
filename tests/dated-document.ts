/**
 * The one thing `docs/specs/` and `docs/audits/` genuinely share: a filename
 * that is a date, and a date that has happened.
 *
 * ⚠️ **Sharing this was rejected once, and the decision is re-read rather than
 * inherited.** `tests/tools/audit-status.test.ts` argued that a module holding a
 * single regex makes each guard readable only with the other one open, which is a
 * worse trade than the duplication it removes. That was true when the two agreed
 * on **one regex**. They came to agree on a regex *and* a five-line check —
 * filename matches, date parses, date is not in the future — and that is a
 * different trade, which is what the finding asks to be looked at again
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F20).
 *
 * What is here is exactly the part that is one question, and nothing else. The
 * two guards still disagree about the status vocabulary, the required sections
 * and everything below the heading, and none of that moved — so neither file
 * needs the other open to be read.
 */

import { expect } from "bun:test";
import { isKebabCaseText } from "@/libs/text-runs.ts";
import { getMillisecondsFromIsoText } from "@/libs/timestamp.ts";

const DOCUMENT_EXTENSION = ".md";

const DATE_LENGTH = "yyyy-mm-dd".length;

/**
 * `yyyy-mm-dd-` and then kebab-case.
 *
 * The date is what makes the name sortable and the directory an index; the tail
 * is what a person calls it. Both documents are named this way and neither has a
 * front matter field saying when — git holds that, and the filename is what a
 * reader sees in a listing.
 *
 * The date's own shape is not read here twice: `getMillisecondsFromIsoText`
 * accepts a calendar date and nothing shorter or longer, so the assertion below
 * refuses `20-26-08-a.md` as surely as an anchored pattern did.
 */
function hasDatedName(file: string): boolean {
  if (!file.endsWith(DOCUMENT_EXTENSION)) return false;
  const name = file.slice(0, file.length - DOCUMENT_EXTENSION.length);
  if (name[DATE_LENGTH] !== "-") return false;
  return isKebabCaseText(name.slice(DATE_LENGTH + 1));
}

/**
 * Asserts the filename carries a date, that the date is a date, and that it is
 * not in the future.
 *
 * The last is the one worth having: a name is easy to typo into `2062` and a
 * document dated after today is one nobody can place against the tree.
 */
export function expectDatedName(file: string): void {
  expect(hasDatedName(file), file).toBe(true);
  const written = getMillisecondsFromIsoText(file.slice(0, DATE_LENGTH));
  expect(written, file).not.toBeNull();
  expect(written, file).toBeLessThanOrEqual(Date.now());
}
