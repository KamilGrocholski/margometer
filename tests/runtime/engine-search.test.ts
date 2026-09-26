/**
 * Finding the game, on a page that may not have one yet and may never have one
 * (`develop:tests/game/engine-attachment.test.ts`).
 *
 * The clock is handed in, so a minute of looking takes no time at all here and the timing is
 * something a test can state rather than wait for.
 */

import { assert, assertEquals, assertInstanceOf, assertStrictEquals } from "@std/assert";
import { initPageEngine, SearchAbandoned, type WrapHandle } from "#/src/game/engine-battle.ts";
import { initPageInterval, type PageTimers } from "#/src/game/page-interval.ts";
import {
    type EngineSearch,
    LOOKS_MAXIMUM,
    type SearchReport,
    startEngineSearch,
} from "#/src/runtime/engine-search.ts";

interface Told {
    payloads: unknown[];
    failures: unknown[];
    others: number;
    refusals: number;
    abandoned: unknown[];
    wraps: WrapHandle[];
}

interface Clock {
    timers: PageTimers;
    tick: (times: number) => void;
    starts: () => number;
    cancels: () => number;
}

/**
 * Four looks a second for a minute, as `docs/design.md` §10.1 states it: restated here on purpose,
 * because every other case reads the bound off the module and would pass whatever it said.
 */
const LOOKS_STATED = 240;

Deno.test("a game already on the page is wrapped at the first look, with no clock started", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { report, told } = composeReport();
    const clock = composeClock();
    const seen: unknown[] = [];
    const search = start({ Engine: { battle } }, clock, report, seen);
    assert(search.isDone(), "the search is over at the first look");
    assertStrictEquals(told.wraps.length, 1, "the caller was told the reading had started");
    assertStrictEquals(clock.starts(), 0, "and no timer was ever asked for");
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap left a function behind it");
    update({ m: [] });
    assertEquals(seen, [{ m: [] }], "and the payload reached the reader");
});

function composeReport(): { report: SearchReport; told: Told } {
    const told: Told = {
        payloads: [],
        failures: [],
        others: 0,
        refusals: 0,
        abandoned: [],
        wraps: [],
    };
    return {
        told,
        report: {
            onAttached: (wrap) => void told.wraps.push(wrap),
            onStoodDown: () => void (told.others += 1),
            onRefused: () => void (told.refusals += 1),
            onAbandoned: (failure) => void told.abandoned.push(failure),
            onLookFailed: (failure) => void told.failures.push(failure),
        },
    };
}

/** A clock the test winds by hand: nothing runs until `tick` is called. */
function composeClock(): Clock {
    let step: (() => void) | null = null;
    let starts = 0;
    let cancels = 0;
    return {
        timers: {
            setInterval: (given) => {
                step = given;
                starts += 1;
                return 1;
            },
            clearInterval: () => {
                step = null;
                cancels += 1;
            },
        },
        tick: (times) => {
            for (let turn = 0; turn < times; turn += 1) step?.();
        },
        starts: () => starts,
        cancels: () => cancels,
    };
}

function start(
    page: unknown,
    clock: Clock,
    report: SearchReport,
    seen: unknown[] = [],
): EngineSearch {
    const listener = { onBeforeCall: () => {}, onPayload: (one: unknown) => void seen.push(one) };
    return startEngineSearch(
        initPageEngine(page),
        initPageInterval(clock.timers),
        listener,
        report,
    );
}

Deno.test("a game that arrives late is waited for, and the timer stops when it is found", () => {
    const page: Record<string, unknown> = {};
    const { report, told } = composeReport();
    const clock = composeClock();
    const search = start(page, clock, report);
    assert(!search.isDone(), "nothing to wrap at the first look");
    clock.tick(3);
    assertEquals(told.abandoned, [], "and the looking goes on");
    page.Engine = { battle: { updateData: () => 1 } };
    clock.tick(1);
    assertStrictEquals(told.wraps.length, 1, "the game arrives and is wrapped");
    assertStrictEquals(clock.cancels(), 1, "and the timer is let go of");
    clock.tick(10);
    assertEquals(told.abandoned, [], "and nothing is abandoned after that");
});

Deno.test("a page that never brings a game is given up on at the bound, once", () => {
    const { report, told } = composeReport();
    const clock = composeClock();
    start({}, clock, report);
    clock.tick(LOOKS_MAXIMUM - 2);
    assertEquals(told.abandoned, [], "a look short of the bound is still a look");
    clock.tick(1);
    const [abandoned] = told.abandoned;
    assertInstanceOf(abandoned, SearchAbandoned, "and the last look ends it");
    assertStrictEquals(abandoned.looks, LOOKS_MAXIMUM, "saying how many it took");
    assertStrictEquals(abandoned.maximum, LOOKS_MAXIMUM, "against the bound it stops at");
    clock.tick(1000);
    assertStrictEquals(told.abandoned.length, 1, "exactly once");
    assertStrictEquals(clock.cancels(), 1, "and the timer is let go of");
});

Deno.test("a game that arrives on the last look is wrapped, and one past it is not", () => {
    const onTime = composeReport();
    const onTimePage: Record<string, unknown> = {};
    const onTimeClock = composeClock();
    start(onTimePage, onTimeClock, onTime.report);
    onTimeClock.tick(LOOKS_MAXIMUM - 2);
    onTimePage.Engine = { battle: { updateData: () => 1 } };
    onTimeClock.tick(1);
    assertStrictEquals(onTime.told.wraps.length, 1, "the last look finds it");
    assertEquals(onTime.told.abandoned, [], "and abandons nothing");

    const late = composeReport();
    const latePage: Record<string, unknown> = {};
    const lateClock = composeClock();
    start(latePage, lateClock, late.report);
    lateClock.tick(LOOKS_MAXIMUM - 1);
    latePage.Engine = { battle: { updateData: () => 1 } };
    lateClock.tick(10);
    assertStrictEquals(late.told.wraps.length, 0, "a game one look late is never looked at");
});

Deno.test("a reader already on the game means this copy stands down", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    start({ Engine: { battle } }, composeClock(), composeReport().report);
    const second = composeReport();
    const seen: unknown[] = [];
    const search = start({ Engine: { battle } }, composeClock(), second.report, seen);
    assertStrictEquals(second.told.others, 1, "the second copy is told, once");
    assertStrictEquals(second.told.wraps.length, 0, "and never wraps");
    assert(search.isDone(), "and stops looking");
    const update = battle.updateData;
    assert(typeof update === "function", "the first copy's wrap stands");
    update({});
    assertEquals(seen, [], "so the second never counts a thing");
});

Deno.test("a game whose method is gone is refused, said once, and left alone at the bound", () => {
    const { report, told } = composeReport();
    const clock = composeClock();
    const search = start({ Engine: { battle: {} } }, clock, report);
    clock.tick(5);
    assertStrictEquals(told.refusals, 1, "said once, not once a look");
    clock.tick(300);
    assertStrictEquals(told.refusals, 1, "the refusal was said once");
    assertEquals(told.failures, [], "and no look past the bound was reported as a failure");
    assertEquals(told.abandoned, [], "nor as a page with no game on it, which this page has");
    assert(search.isDone(), "and the looking ended at the bound");
    assertStrictEquals(clock.cancels(), 1, "letting the timer go");
});

Deno.test("a method that arrives after a refusal is wrapped on the next look", () => {
    const { report, told } = composeReport();
    const clock = composeClock();
    const battle: Record<string, unknown> = {};
    start({ Engine: { battle } }, clock, report);
    clock.tick(3);
    battle.updateData = () => 1;
    clock.tick(1);
    assertStrictEquals(told.refusals, 1, "the refusal was said once");
    assertStrictEquals(told.wraps.length, 1, "and the method is wrapped once it is there");
});

Deno.test("a look that throws is marked once, and the search runs out where it would have", () => {
    const { report, told } = composeReport();
    const clock = composeClock();
    start(composeThrowingPage(), clock, report);
    assertStrictEquals(told.failures.length, 1, "the first look that threw was reported");
    clock.tick(300);
    assertStrictEquals(told.failures.length, 1, "and none of the looks after it were");
    assertStrictEquals(told.abandoned.length, 1, "the search ended at its bound, and said so once");
    assertStrictEquals(told.wraps.length, 0, "and nothing was wrapped");
});

/** A page tearing down throws out of its own `getEngine`, and it does so on every look. */
function composeThrowingPage(): Record<string, unknown> {
    return {
        getEngine: (): unknown => {
            throw new RangeError("a page being torn down");
        },
    };
}

Deno.test("a look of ours that throws is marked once, and the timer never sees it", () => {
    const { report, told } = composeReport();
    const clock = composeClock();
    const failing: SearchReport = {
        ...report,
        onRefused: () => {
            throw new RangeError("a refusal that would not be said");
        },
    };
    start({ Engine: { battle: {} } }, clock, failing);
    clock.tick(300);
    assertStrictEquals(told.failures.length, 1, "the look that threw was reported, once");
    assertStrictEquals(clock.cancels(), 1, "and the search still ended at its bound");
});

Deno.test("a clock that will not let go leaves a search that is done", () => {
    const { report, told } = composeReport();
    const clock = composeClock();
    let cancels = 0;
    const refusing: PageTimers = {
        setInterval: clock.timers.setInterval,
        clearInterval: (handle) => {
            cancels += 1;
            clock.timers.clearInterval(handle);
            throw new RangeError("a clock that will not let go");
        },
    };
    const search = startEngineSearch(
        initPageEngine({}),
        initPageInterval(refusing),
        { onBeforeCall: () => {}, onPayload: () => {} },
        report,
    );
    clock.tick(300);
    assertStrictEquals(cancels, 1, "the search stopped once, though the clock refused it");
    assert(search.isDone(), "and says it is done");
    assertStrictEquals(told.abandoned.length, 1, "having said so once");
});

Deno.test("a search stopped from outside stops its timer, and looks no more", () => {
    const { report, told } = composeReport();
    const clock = composeClock();
    const page: Record<string, unknown> = {};
    const search = start(page, clock, report);
    search.stop();
    assert(search.isDone(), "the search is done");
    assertStrictEquals(clock.cancels(), 1, "and its timer let go of");
    page.Engine = { battle: { updateData: () => 1 } };
    clock.tick(5);
    assertStrictEquals(told.wraps.length, 0, "so a game arriving later is not wrapped");
});

Deno.test("the search gives up on the two hundred and fortieth look, as the design states", () => {
    const { report, told } = composeReport();
    const clock = composeClock();
    let looks = 0;
    const page = {
        getEngine: () => {
            looks += 1;
            return {};
        },
    };
    start(page, clock, report);
    clock.tick(1000);
    assertStrictEquals(looks, LOOKS_STATED, "the page was asked this many times, and no more");
    assertStrictEquals(told.abandoned.length, 1, "and then the search was given up on");
    assertStrictEquals(LOOKS_MAXIMUM, LOOKS_STATED, "which is the bound the module states");
});

Deno.test("a search that is done looks no more, though the page's timer will not stop", () => {
    const { report, told } = composeReport();
    let step: (() => void) | null = null;
    const stuck: PageTimers = {
        setInterval: (given) => {
            step = given;
            return 1;
        },
        clearInterval: () => {
            throw new RangeError("a clock that will not let go");
        },
    };
    let looks = 0;
    const page = {
        getEngine: () => {
            looks += 1;
            return {};
        },
    };
    startEngineSearch(
        initPageEngine(page),
        initPageInterval(stuck),
        { onBeforeCall: () => {}, onPayload: () => {} },
        report,
    );
    for (let turn = 0; turn < 300; turn += 1) (step as (() => void) | null)?.();
    assertStrictEquals(looks, LOOKS_MAXIMUM, "the timer went on firing, and nothing looked");
    assertEquals(told.failures, [], "and no look past the end failed");
    assertStrictEquals(told.abandoned.length, 1, "the search ended once");
});

Deno.test("a page that will not start the timer is marked, once, as a look that failed", () => {
    const { report, told } = composeReport();
    const refusing: PageTimers = {
        setInterval: () => {
            throw new RangeError("no timers here");
        },
        clearInterval: () => {},
    };
    startEngineSearch(
        initPageEngine({}),
        initPageInterval(refusing),
        { onBeforeCall: () => {}, onPayload: () => {} },
        report,
    );
    assertStrictEquals(told.failures.length, 1, "the refusal is marked");
    assertEquals(told.abandoned, [], "and the one look that ran was not the last");
});

/**
 * A timer the page will not start is reported on the stack that started the add-on, outside any
 * look's guard, so a report that breaks there must not leave `startEngineSearch` either.
 */
Deno.test("a report that breaks on the starting stack does not leave the start", () => {
    const refusing: PageTimers = {
        setInterval: () => {
            throw new Error("a page with no timers");
        },
        clearInterval: () => {},
    };
    const report: SearchReport = {
        onAttached: () => {},
        onStoodDown: () => {},
        onRefused: () => {},
        onAbandoned: () => {},
        onLookFailed: () => {
            throw new Error("a report that will not write");
        },
    };
    const listener = { onBeforeCall: () => {}, onPayload: () => {} };
    const search = startEngineSearch(
        initPageEngine({}),
        initPageInterval(refusing),
        listener,
        report,
    );
    assertStrictEquals(search.isDone(), false, "the search stood up, with nothing escaping it");
});
