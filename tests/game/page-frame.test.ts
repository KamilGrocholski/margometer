/**
 * The page's animation frame, and the step it is handed. A throw out of the step would land in the
 * browser's frame loop, which drops it silently, so the step is guarded where it is handed over.
 */

import { assert, assertEquals, AssertionError, assertStrictEquals } from "@std/assert";
import { type BrokenInvariant, RESULT_FAILURE } from "@/libs/result.ts";
import { initPageFrames, type PageFrames } from "@/src/game/page-frame.ts";

/** Frames the test lets fall by hand: the step each holds runs only when `fall` is called. */
function composeFrames() {
    const held: (() => void)[] = [];
    const cancelled: number[] = [];
    const frames: PageFrames = {
        requestAnimationFrame: (step) => held.push(step) + 40,
        cancelAnimationFrame: (handle) => void cancelled.push(handle),
    };
    return { frames, cancelled, fall: () => held.shift()?.() };
}

Deno.test("a step runs when its frame falls, and a cancel hands back the page's own handle", () => {
    const wound = composeFrames();
    let ran = 0;
    const requested = initPageFrames(wound.frames).requestFrame(() => void (ran += 1), () => {});
    assert(requested.ok, "the page took the step");
    assertStrictEquals(ran, 0, "and ran nothing before the frame fell");
    wound.fall();
    assertStrictEquals(ran, 1, "then once");
    requested.value.cancel();
    assertEquals(wound.cancelled, [41], "with the handle the page gave");
});

Deno.test("a step that breaks is handed over as a failure and never reaches the frame loop", () => {
    const wound = composeFrames();
    const failures: BrokenInvariant[] = [];
    const requested = initPageFrames(wound.frames).requestFrame(() => {
        throw new AssertionError("a frame of ours broke");
    }, (failure) => failures.push(failure));
    assert(requested.ok, "the page took the step");
    wound.fall();
    assertStrictEquals(failures.length, 1, "the failure was handed to the sink");
    assertStrictEquals(failures[0]?.kind, RESULT_FAILURE.invariantBroken, "as a broken invariant");
});

Deno.test("a sink that throws in its turn has nobody left to tell, and reaches nobody", () => {
    const wound = composeFrames();
    initPageFrames(wound.frames).requestFrame(() => {
        throw new AssertionError("a frame of ours broke");
    }, () => {
        throw new AssertionError("and so did whoever it was told to");
    });
    wound.fall();
});

Deno.test("a page that will not give a frame says so, and one that won't cancel is let be", () => {
    const refusing: PageFrames = {
        requestAnimationFrame: () => {
            throw new TypeError("a page with no frames to give");
        },
        cancelAnimationFrame: () => {},
    };
    const requested = initPageFrames(refusing).requestFrame(() => {}, () => {});
    assertStrictEquals(requested.ok, false, "a refusal is answered, never thrown");
    if (!requested.ok) assertStrictEquals(requested.error.kind, RESULT_FAILURE.foreignThrew);
    const stubborn: PageFrames = {
        requestAnimationFrame: () => 1,
        cancelAnimationFrame: () => {
            throw new TypeError("a page being torn down");
        },
    };
    const held = initPageFrames(stubborn).requestFrame(() => {}, () => {});
    assert(held.ok, "the frame was given");
    held.value.cancel();
});
