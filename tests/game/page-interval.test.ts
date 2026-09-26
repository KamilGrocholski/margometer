/**
 * The page's timer, and the step it is handed. A throw out of the step would land in the browser's
 * timer, which drops it and fires again, so the step is guarded where it is handed over.
 */

import {
    assert,
    assertEquals,
    assertInstanceOf,
    AssertionError,
    assertNotInstanceOf,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { initPageInterval, type PageTimers } from "#/src/game/page-interval.ts";

interface Wound {
    timers: PageTimers;
    fire: () => void;
    started: number[];
    cleared: number[];
}

Deno.test("a step runs when the timer fires, and a cancel hands back the page's own handle", () => {
    const wound = composeTimers();
    let ran = 0;
    const started = initPageInterval(wound.timers).every(() => void (ran += 1), 250, () => {});
    assertNotInstanceOf(started, Error, "the timer took the step");
    assertEquals(wound.started, [250], "at the interval asked for");
    wound.fire();
    wound.fire();
    assertStrictEquals(ran, 2, "and it runs each time the timer fires");
    assertNotInstanceOf(started.cancel(), Error, "the cancel is answered");
    assertEquals(wound.cleared, [41], "with the handle the page gave");
});

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

Deno.test("a step that throws is handed over as a failure and never reaches the timer", () => {
    const wound = composeTimers();
    const failures: errors.Caught[] = [];
    const started = initPageInterval(wound.timers).every(
        () => {
            throw new RangeError("a step of ours");
        },
        250,
        (failure) => void failures.push(failure),
    );
    assertNotInstanceOf(started, Error, "the timer took the step");
    wound.fire();
    wound.fire();
    assertStrictEquals(failures.length, 2, "each failure is handed to the report");
    assertInstanceOf(failures[0], errors.Caught, "as one of ours");
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
    assertNotInstanceOf(started, Error, "the timer took the step");
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
    assertInstanceOf(refused, Error, "a page that will not start the timer answers");
    assertInstanceOf(refused, errors.Caught, "and says it was theirs");

    const stuck = initPageInterval({
        setInterval: () => 1,
        clearInterval: () => {
            throw new RangeError("will not let go");
        },
    });
    const started = stuck.every(() => {}, 250, () => {});
    assertNotInstanceOf(started, Error, "the timer took the step");
    const cancelled = started.cancel();
    assertInstanceOf(cancelled, Error, "a page that will not stop it answers");
    assertInstanceOf(cancelled, errors.Caught, "as its own failure");
});

Deno.test("a step repeats every whole millisecond, and one of none is the caller's bug", () => {
    const interval = initPageInterval(composeTimers().timers);
    assertNotInstanceOf(
        interval.every(() => {}, 1, () => {}),
        Error,
        "one millisecond is an interval",
    );
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
