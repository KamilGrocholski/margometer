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
 * ⚠️ **Nothing holds these words to anything, and one document repeats them.**
 * Every reader imports the constant, so the compiler holds all three to the *same*
 * name and nothing holds any of them to being *right*: a sweep renames all eight
 * with the gate green
 * (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F13). That is
 * accepted — the words reach a terminal and a development overlay and nothing
 * else, so a test pinning them would have no consumer but itself. The one place
 * they are spelled again is
 * `docs/specs/2026-08-18-what-a-payload-costs.md`, which names all eight in prose;
 * a rename here has to go there too, and nothing will say so.
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

export const WHOLE_PHASES: readonly string[] = [PAYLOAD_PHASE, GESTURE_PHASE, DRAG_PHASE];
export const PART_PHASES: readonly string[] = [
  SESSION_PHASE,
  CAPTURE_PHASE,
  READING_PHASE,
  VIEW_PHASE,
  DOM_PHASE,
];
