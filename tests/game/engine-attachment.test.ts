/**
 * Finding the game, on a page that may not have one yet and may never have one.
 *
 * The clock is handed in, so a minute of looking takes no time at all here and the timing is
 * something a test can state rather than wait for.
 */

import { assert, assertEquals } from "@std/assert";
import {
    type AttachmentReport,
    attachToGame,
    readEnginesFromPage,
    type Scheduler,
} from "@/src/game/engine-attachment.ts";

interface Told {
    payloads: unknown[];
    failures: unknown[];
    others: number;
    refusals: number;
    abandoned: number;
    /** How many times the wrap going on was reported, which is what puts a panel on the page. */
    attached: number;
}

function composeReport(): { report: AttachmentReport; told: Told } {
    const told: Told = {
        payloads: [],
        failures: [],
        others: 0,
        refusals: 0,
        abandoned: 0,
        attached: 0,
    };
    return {
        told,
        report: {
            handleAttached: () => told.attached += 1,
            handleBeforeCall: () => {},
            handlePayload: (payload: unknown) => told.payloads.push(payload),
            handleFailure: (failure) => told.failures.push(failure),
            handleAnotherReader: () => told.others += 1,
            handleRefusal: () => told.refusals += 1,
            handleSearchAbandoned: () => told.abandoned += 1,
        },
    };
}

/** A clock the test winds by hand: nothing runs until `tick` is called. */
function composeScheduler(): { schedule: Scheduler; tick: (times: number) => void } {
    let step: (() => void) | null = null;
    return {
        schedule: {
            every: (given) => {
                step = given;
                return 1;
            },
            cancel: () => step = null,
        },
        tick: (times) => {
            for (let turn = 0; turn < times; turn += 1) step?.();
        },
    };
}

Deno.test("the page is asked for a game in both spellings", () => {
    assertEquals(readEnginesFromPage({ Engine: "a" }), ["a"], "the field, where there is one");
    assertEquals(readEnginesFromPage({ getEngine: () => "b" }), [undefined, "b"], "and the call");
    assertEquals(readEnginesFromPage(null), [], "a page that is not one is asked nothing");
});

Deno.test("a game already on the page is wrapped at the first look", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { report, told } = composeReport();
    const { schedule } = composeScheduler();
    const original = battle.updateData;
    const attachment = attachToGame({ Engine: { battle } }, schedule, report);
    assert(attachment.isAttached(), "the wrap went on without waiting for a clock");
    // Said once and before any payload: it is what puts a panel on the page, so a reader can
    // tell an add-on waiting for a fight from one that died on the way here.
    assertEquals(told.attached, 1, "and the caller was told the reading had started");
    assertEquals(told.payloads, [], "before anything had been read");
    const wrapped = battle.updateData;
    assert(typeof wrapped === "function", "and left a function behind it");
    wrapped({ m: [] });
    assertEquals(told.payloads, [{ m: [] }], "and the payload reached the reader");
    attachment.detach();
    assertEquals(battle.updateData, original, "detaching puts back what the wrap replaced");
    assert(!attachment.isAttached(), "and says it is off");
});

Deno.test("a game that arrives late is waited for, and only until it plainly is not coming", () => {
    const page: Record<string, unknown> = {};
    const { report, told } = composeReport();
    const { schedule, tick } = composeScheduler();
    const attachment = attachToGame(page, schedule, report);
    assert(!attachment.isAttached(), "nothing to wrap at the first look");
    tick(3);
    assertEquals(told.abandoned, 0, "and the looking goes on");
    page.Engine = { battle: { updateData: () => 1 } };
    tick(1);
    assert(attachment.isAttached(), "the game arrives and is wrapped");
    tick(10);
    assertEquals(told.abandoned, 0, "and nothing is abandoned after that");
});

Deno.test("a page that never brings a game is given up on, once", () => {
    const { report, told } = composeReport();
    const { schedule, tick } = composeScheduler();
    const attachment = attachToGame({}, schedule, report);
    tick(1000);
    assertEquals(told.abandoned, 1, "the search ends, and says so exactly once");
    assert(!attachment.isAttached(), "with nothing wrapped");
});

Deno.test("a reader already on the game means this copy stands down", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const first = composeReport();
    attachToGame({ Engine: { battle } }, composeScheduler().schedule, first.report);
    const second = composeReport();
    const { schedule } = composeScheduler();
    const attachment = attachToGame({ Engine: { battle } }, schedule, second.report);
    assertEquals(second.told.others, 1, "the second copy is told, once");
    assert(!attachment.isAttached(), "and never wraps");
    assertEquals(second.told.payloads, [], "so it never counts a thing");
});

Deno.test("a game whose method is gone is refused, and said once", () => {
    const { report, told } = composeReport();
    const { schedule, tick } = composeScheduler();
    const attachment = attachToGame({ Engine: { battle: {} } }, schedule, report);
    tick(5);
    assertEquals(told.refusals, 1, "said once, not once a look");
    assert(!attachment.isAttached(), "and nothing was wrapped");
});
