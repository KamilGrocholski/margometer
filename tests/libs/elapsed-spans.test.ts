/**
 * The recorder both halves of the cost measurement share.
 *
 * Timed against a clock nobody can hold still, so nothing here asserts a
 * duration: what is checkable is the arithmetic over whatever the clock said —
 * a total that is the sum, a worst that is the maximum, a count that is the
 * count — plus the two promises a caller relies on, that the work's own value
 * comes back and that a throw is still measured.
 */

import { describe, expect, test } from "bun:test";
import { composeSpanRecorder, composeSpanReport, getTimedResult } from "@/libs/elapsed-spans.ts";

describe("recording what a piece of work cost", () => {
  test("reports nothing before anything has been timed", () => {
    expect(composeSpanReport(composeSpanRecorder())).toEqual([]);
  });

  // Zero and the one beside it (§7.5). One run is the case where the total and
  // the worst are the same number, so a reader that confused the two would pass
  // here and only part company on the second call.
  test("reports one run as one call whose worst is its whole total", () => {
    const recorder = composeSpanRecorder();
    getTimedResult(recorder, "decode", () => null);

    const [span] = composeSpanReport(recorder);
    expect(span?.name).toBe("decode");
    expect(span?.calls).toBe(1);
    expect(span?.worstMs).toBe(span?.totalMs);
  });

  /**
   * The worst is the largest run and not the latest one, and the clock is no
   * help in saying so — every real call here is fractions of a millisecond, so
   * whichever of the two the code meant, the numbers look alike. Seeding a
   * tally no real call can beat is what makes the difference visible: mutating
   * `Math.max` to the elapsed value lit nothing at all until this existed.
   */
  test("keeps the largest run as the worst, not the most recent", () => {
    const recorder = composeSpanRecorder();
    const seeded = { name: "decode", calls: 1, totalMs: 1_000_000, worstMs: 1_000_000 };
    recorder.spansByName.set("decode", seeded);

    getTimedResult(recorder, "decode", () => null);

    expect(composeSpanReport(recorder)[0]?.worstMs).toBe(seeded.worstMs);
  });

  test("hands back exactly what the work returned", () => {
    const wanted = { rows: 3 };
    const given = getTimedResult(composeSpanRecorder(), "view", () => wanted);

    expect(given).toBe(wanted);
  });

  test("accumulates calls and keeps the total at least the worst of them", () => {
    const recorder = composeSpanRecorder();
    for (let run = 0; run < 3; run += 1) getTimedResult(recorder, "decode", () => null);

    const [span] = composeSpanReport(recorder);
    expect(span?.calls).toBe(3);
    expect(span?.totalMs).toBeGreaterThanOrEqual(span?.worstMs ?? 0);
  });

  // The expensive paths are the failing ones, so a recorder that measured only
  // the returns would hide exactly the case worth finding. The error is the
  // caller's and reaches them unchanged.
  test("measures work that throws, and lets the failure through", () => {
    const recorder = composeSpanRecorder();
    const failure = new RangeError("no");

    expect(() =>
      getTimedResult(recorder, "decode", () => {
        throw failure;
      }),
    ).toThrow(failure);
    expect(composeSpanReport(recorder)[0]?.calls).toBe(1);
  });

  test("keeps one tally per name", () => {
    const recorder = composeSpanRecorder();
    getTimedResult(recorder, "decode", () => null);
    getTimedResult(recorder, "view", () => null);

    expect(composeSpanReport(recorder).map((span) => span.name).sort()).toEqual(["decode", "view"]);
  });

  // A report whose rows moved between runs could not be diffed against the last
  // one, and two phases costing the same is the case where insertion order would
  // decide it.
  test("orders by cost, and breaks a tie on the name", () => {
    const recorder = composeSpanRecorder();
    recorder.spansByName.set("view", { name: "view", calls: 1, totalMs: 1, worstMs: 1 });
    recorder.spansByName.set("dom", { name: "dom", calls: 1, totalMs: 1, worstMs: 1 });
    recorder.spansByName.set("decode", { name: "decode", calls: 1, totalMs: 9, worstMs: 9 });

    expect(composeSpanReport(recorder).map((span) => span.name)).toEqual(["decode", "dom", "view"]);
  });
});
