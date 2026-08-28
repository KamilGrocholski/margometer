/**
 * The names a measured phase goes by — the one place they are written down.
 *
 * Three readers spell them: the entry point, which names a phase where it wraps
 * one; `src/userscript-instrument-development.ts`, which sorts them for the
 * overlay; and `tools/payload-cost.ts`, which prints them. A name written twice
 * is two names that eventually disagree, and a phase whose terminal row and
 * screen row have drifted apart is worse than no row at all.
 *
 * Its own module rather than a corner of the seam beside it, because that seam is
 * the file `build.ts` swaps: a development build resolving its own import of the
 * production one would resolve straight back to itself.
 *
 * ⚠️ **Nothing holds these words to anything.** Every reader imports the
 * constant, so the compiler holds all three to the *same* name and nothing holds
 * any of them to being *right* — a sweep renames all eight with the gate green.
 * Accepted: the words reach a terminal and a development overlay and nothing
 * else, so a test pinning them would have no consumer but itself.
 *
 * ⚠️ **Two groups, and they may not be added together.** A whole contains its
 * parts — `payload` is `session` plus `capture` plus `reading` plus the drawing
 * that follows it — so a table mixing the two would put a payload past a hundred
 * per cent of itself. Everything that reads these keeps them apart.
 */

/** The whole of one engine call, from the wrap returning to the panel being drawn. */
export const PAYLOAD_PHASE = "payload";
/** The whole of one thing a reader did: a tab, a row, a step back, a collapse. */
export const GESTURE_PHASE = "gesture";
/** One move of a panel being dragged. Draws nothing — it moves what is drawn. */
export const DRAG_PHASE = "drag";

/** Accumulating the fight, which is where the decoding happens. */
export const SESSION_PHASE = "session";
/** Keeping the payload so it can be written to a file. A developer's convenience. */
export const CAPTURE_PHASE = "capture";
/** Aggregating the fight — the fold, from scratch, on every payload that changed. */
export const READING_PHASE = "reading";
/** Composing what the panel shows, as data. */
export const VIEW_PHASE = "view";
/** Building the nodes. The one phase no offline measurement can take. */
export const DOM_PHASE = "dom";

/**
 * What the two readings call the columns they print.
 *
 * ⚠️ **The same table is drawn twice, and its headings were decided twice.**
 * `src/ui/cost-overlay.ts` draws it beside the panel in a development build and
 * `tools/payload-cost.ts` prints it in a terminal; both spelled `phase`, `calls`,
 * `total ms` and `worst ms` themselves. That is the same argument this file already
 * makes for the phase names, one row up from them, and the same failure: two tables
 * that drift and both go on printing.
 *
 * The widths stay with each reader. They are not vocabulary — a terminal has room a
 * corner of a game window does not — and that difference is the reason the two readings
 * exist at all.
 */
export const COST_COLUMNS = {
  name: "phase",
  calls: "calls",
  total: "total ms",
  worst: "worst ms",
} as const;

export const WHOLE_PHASES: readonly string[] = [PAYLOAD_PHASE, GESTURE_PHASE, DRAG_PHASE];
export const PART_PHASES: readonly string[] = [
  SESSION_PHASE,
  CAPTURE_PHASE,
  READING_PHASE,
  VIEW_PHASE,
  DOM_PHASE,
];
