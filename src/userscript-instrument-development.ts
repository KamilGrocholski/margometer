/**
 * The same seam as `src/userscript-instrument.ts`, with a clock behind it.
 *
 * ⚠️ **Nothing imports this file by name.** `build.ts` resolves the production
 * seam's specifier here for the development build, which is what keeps the
 * recorder, the overlay and `performance.now` out of the file people install.
 * So the two files have to keep the same exported shape, and nothing but a test
 * can notice when they stop: a development build whose seam had drifted would
 * not fail, it would quietly stop measuring.
 *
 * One recorder for the page, never reset: the worst payload of a session is the
 * question being asked, and a tally cleared at a fight boundary would answer a
 * smaller one. It holds four numbers per phase name, so it does not grow with
 * the fight it is measuring.
 */

import {
  composeSpanRecorder,
  composeSpanReport,
  getTimedResult as getTimedResultInto,
} from "@/libs/elapsed-spans.ts";
import { getFiniteNumberFromValue } from "@/libs/number.ts";
import { getRecordFromValue } from "@/libs/record.ts";
import { PART_PHASES, WHOLE_PHASES } from "@/src/cost-phases.ts";
import { setCostOverlayDrawn, type CostOverlayDocument } from "@/src/ui/cost-overlay.ts";
import type { InstrumentPage } from "@/src/userscript-instrument.ts";

const RECORDER = composeSpanRecorder();

/**
 * What the browser will say about its own heap, or nothing.
 *
 * `performance.memory` is Chrome's and is not a standard, so it is read the way
 * every value from outside is read — narrowed, never cast, and `null` where
 * there is no answer rather than a zero standing in for one (§9.5). Firefox is
 * what `.claude/skills/verify/SKILL.md` drives, and Firefox has nothing to say
 * here, so the absent case is the usual one.
 */
function getHeapBytes(): number | null {
  const timing = getRecordFromValue(performance);
  const memory = getRecordFromValue(timing?.["memory"]);
  return memory === null ? null : getFiniteNumberFromValue(memory["usedJSHeapSize"]);
}

export function getTimedResult<Result>(name: string, work: () => Result): Result {
  return getTimedResultInto(RECORDER, name, work);
}

export function setCostDrawn(page: InstrumentPage): void {
  /**
   * The same narrowing `composePanelMount` makes one line into its own mount, and
   * for the same reason: what a browser hands back from `createElement` is
   * `unknown` to everything here, and a shape has to be named somewhere before a
   * node can be written to. Named where the overlay is, so the production seam
   * never has to mention it.
   */
  const document = page.document as CostOverlayDocument | undefined;
  if (document === undefined) return;

  const spans = composeSpanReport(RECORDER);
  setCostOverlayDrawn(document, {
    wholes: spans.filter((span) => WHOLE_PHASES.includes(span.name)),
    parts: spans.filter((span) => PART_PHASES.includes(span.name)),
    heapBytes: getHeapBytes(),
  });
}
