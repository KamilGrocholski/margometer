/**
 * The page's timer, and the step it is handed. A throw out of the step would land in the browser's
 * timer, which drops it and fires again, so the step is guarded where it is handed over.
 */

import {
    assert,
    assertEquals,
    AssertionError,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import { type BrokenInvariant, RESULT_FAILURE } from "@/libs/result.ts";
import { initPageInterval, type PageTimers } from "@/src/game/page-interval.ts";

interface Wound {
    timers: PageTimers;
    fire: () => void;
    started: number[];
    cleared: number[];
}

/** A clock the test winds by hand: the step it holds runs only when `fire` is called. */
function composeTimers(): Wound {
    let held: (() => void) | null = null;
    const started: number[] = [];
    const cleared: number[] = [];
    return {
        started,
        cleared,
        fire: () => held?.(),
        timers: {
            setInterval: (step, everyMilliseconds) => {
                held = step;
                started.push(everyMilliseconds);
                return 41;
            },
            clearInterval: (handle) => {
                held = null;
                cleared.push(handle);
            },
        },
    };
}

Deno.test("a step runs when the timer fires, and a cancel hands back the page's own handle", () => {
    const wound = composeTimers();
    let ran = 0;
    const started = initPageInterval(wound.timers).every(() => void (ran += 1), 250, () => {});
    assert(started.ok, "the timer took the step");
    assertEquals(wound.started, [250], "at the interval asked for");
    wound.fire();
    wound.fire();
    assertStrictEquals(ran, 2, "and it runs each time the timer fires");
    assert(started.value.cancel().ok, "the cancel is answered");
    assertEquals(wound.cleared, [41], "with the handle the page gave");
});

Deno.test("a step that throws is handed over as a failure and never reaches the timer", () => {
    const wound = composeTimers();
    const failures: BrokenInvariant[] = [];
    const started = initPageInterval(wound.timers).every(
        () => {
            throw new RangeError("a step of ours");
        },
        250,
        (failure) => void failures.push(failure),
    );
    assert(started.ok, "the timer took the step");
    wound.fire();
    wound.fire();
    assertStrictEquals(failures.length, 2, "each failure is handed to the report");
    assertStrictEquals(failures[0]?.kind, RESULT_FAILURE.invariantBroken, "as one of ours");
    assert(failures[0]?.cause instanceof RangeError, "with what the step threw");
});

Deno.test("a report that throws is discarded, and the timer still sees nothing", () => {
    const wound = composeTimers();
    let reports = 0;
    const started = initPageInterval(wound.timers).every(
        () => {
            throw new RangeError("a step of ours");
        },
        250,
        () => {
            reports += 1;
            throw new TypeError("and a report of ours");
        },
    );
    assert(started.ok, "the timer took the step");
    wound.fire();
    assertStrictEquals(reports, 1, "the report was tried, and what it threw stayed here");
});

Deno.test("a page that refuses to start or stop a timer answers a failure of its own", () => {
    const refusing = initPageInterval({
        setInterval: () => {
            throw new RangeError("no timers here");
        },
        clearInterval: () => {},
    });
    const refused = refusing.every(() => {}, 250, () => {});
    assert(!refused.ok, "a page that will not start the timer answers");
    assertStrictEquals(refused.error.kind, RESULT_FAILURE.foreignThrew, "and says it was theirs");

    const stuck = initPageInterval({
        setInterval: () => 1,
        clearInterval: () => {
            throw new RangeError("will not let go");
        },
    });
    const started = stuck.every(() => {}, 250, () => {});
    assert(started.ok, "the timer took the step");
    const cancelled = started.value.cancel();
    assert(!cancelled.ok, "a page that will not stop it answers");
    assertStrictEquals(cancelled.error.kind, RESULT_FAILURE.foreignThrew, "as its own failure");
});

Deno.test("a step repeats every whole millisecond, and one of none is the caller's bug", () => {
    const interval = initPageInterval(composeTimers().timers);
    assert(interval.every(() => {}, 1, () => {}).ok, "one millisecond is an interval");
    assertThrows(
        () => interval.every(() => {}, 0, () => {}),
        AssertionError,
        "some time passes between",
    );
    assertThrows(
        () => interval.every(() => {}, 2.5, () => {}),
        AssertionError,
        "every whole millisecond",
    );
});
