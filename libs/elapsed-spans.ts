/**
 * How long named pieces of work took, counted rather than logged.
 *
 * §9.5 admits the clock on both halves of its criterion: "now" has more than one
 * spelling — `Date.now()`, `performance.now()`, `new Date().getTime()` — and the
 * three do not answer the same question. `Date.now()` is a wall clock a user can
 * move backwards mid-measurement and is whole milliseconds on some engines;
 * `performance.now()` is monotonic and fractional, which is what a duration
 * needs. So this file owns `performance.now()` and nothing else spells it.
 *
 * ⚠️ **Four numbers per name, and never a list of samples.** A recorder that kept
 * every duration would grow with the thing it is measuring — and the two places
 * this is used are a fight that can run for thousands of payloads and a tool that
 * replays every recording several times over. A count, a total and the worst one
 * answer both questions asked of them ("where does the time go" and "what is the
 * worst a player feels") in memory that does not move.
 *
 * It knows nothing of the game, the protocol or the panel — a name, a count and
 * two durations — which is what puts it in `libs/` rather than beside either
 * caller (§9.1). That is also what makes the phase names printed in a terminal
 * and the phase names drawn on screen the same names.
 */

import { getTextOrder } from "@/libs/text-order.ts";

export type ElapsedSpan = {
  name: string;
  calls: number;
  totalMs: number;
  worstMs: number;
};

/**
 * Where the tallies accumulate.
 *
 * A wrapper around the map rather than the map itself, so that what a caller
 * passes around is a recorder rather than somebody's totals — and so a second
 * tally can be added here without every holder's type changing.
 *
 * ⚠️ **It used to argue for itself by naming `resetSpans`, which nothing called.**
 * The reader was written against a `reset` no caller ever wanted, kept alive by
 * the one test that named it, and the wrapper's whole justification pointed at it
 * (`docs/audits/2026-08-21-the-code-read-for-its-smells.md`, F9). Both are gone.
 * A caller that needs to start again composes a recorder — which is what
 * `tools/payload-cost.ts` does per recording — and one that needs to empty this
 * one in place will bring the reader back with its caller.
 */
export type SpanRecorder = {
  spansByName: Map<string, ElapsedSpan>;
};

export function composeSpanRecorder(): SpanRecorder {
  return { spansByName: new Map() };
}

/**
 * Runs the work, hands back exactly what it returned, and records what it cost.
 *
 * ⚠️ **`finally`, so a throw is still measured.** The failure paths are the ones
 * worth timing — a decode that throws on every message of a payload is both slow
 * and broken — and a measurement that quietly skipped them would make the
 * expensive case the invisible one. Nothing is caught here: the caller's error
 * reaches the caller unchanged, because a timer is not a place to decide what a
 * failure means.
 */
export function getTimedResult<Result>(
  recorder: SpanRecorder,
  name: string,
  work: () => Result,
): Result {
  const from = performance.now();
  try {
    return work();
  } finally {
    const elapsedMs = performance.now() - from;
    const previous = recorder.spansByName.get(name);
    recorder.spansByName.set(name, {
      name,
      calls: (previous?.calls ?? 0) + 1,
      totalMs: (previous?.totalMs ?? 0) + elapsedMs,
      worstMs: Math.max(previous?.worstMs ?? 0, elapsedMs),
    });
  }
}

/**
 * The tallies, dearest first — which is the reading both callers draw.
 *
 * Ties break on the name through `getTextOrder` rather than on insertion order:
 * two phases that cost the same should print in the same order on the next run,
 * and a report whose rows move between runs cannot be diffed against the last one.
 */
export function composeSpanReport(recorder: SpanRecorder): readonly ElapsedSpan[] {
  return [...recorder.spansByName.values()].sort(
    (one, other) => other.totalMs - one.totalMs || getTextOrder(one.name, other.name),
  );
}
