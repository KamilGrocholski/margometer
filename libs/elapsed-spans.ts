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
 * A wrapper around the map rather than the map itself, so a caller holding a
 * recorder cannot quietly become a caller holding somebody's totals: `resetSpans`
 * empties it in place, and everything that was handed the recorder keeps writing
 * to the same one afterwards.
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

/** Empties the recorder in place, so everything already holding it keeps writing here. */
export function resetSpans(recorder: SpanRecorder): void {
  recorder.spansByName.clear();
}
