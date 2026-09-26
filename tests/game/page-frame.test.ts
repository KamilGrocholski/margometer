/**
 * The page's animation frame, and the step it is handed. A throw out of the step would land in the
 * browser's frame loop, which drops it silently, so the step is guarded where it is handed over.
 */

import {
    assertEquals,
    assertInstanceOf,
    AssertionError,
    assertNotInstanceOf,
    assertStrictEquals,
} from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { initPageFrames, type PageFrames } from "#/src/game/page-frame.ts";

Deno.test("a step runs when its frame falls, and a cancel hands back the page's own handle", () => {
    const wound = composeFrames();
    let ran = 0;
    const requested = initPageFrames(wound.frames).requestFrame(() => void (ran += 1), () => {});
    assertNotInstanceOf(requested, Error, "the page took the step");
    assertStrictEquals(ran, 0, "and ran nothing before the frame fell");
    wound.fall();
    assertStrictEquals(ran, 1, "then once");
    requested.cancel();
    assertEquals(wound.cancelled, [41], "with the handle the page gave");
});

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

Deno.test("a step that breaks is handed over as a failure and never reaches the frame loop", () => {
    const wound = composeFrames();
    const failures: errors.Caught[] = [];
    const requested = initPageFrames(wound.frames).requestFrame(() => {
        throw new AssertionError("a frame of ours broke");
    }, (failure) => failures.push(failure));
    assertNotInstanceOf(requested, Error, "the page took the step");
    wound.fall();
    assertStrictEquals(failures.length, 1, "the failure was handed to the sink");
    assertInstanceOf(failures[0], errors.Caught, "as a broken invariant");
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
    assertInstanceOf(requested, Error, "a refusal is answered, never thrown");
    assertInstanceOf(requested, errors.Caught, "as the page's failure");
    const stubborn: PageFrames = {
        requestAnimationFrame: () => 1,
        cancelAnimationFrame: () => {
            throw new TypeError("a page being torn down");
        },
    };
    const held = initPageFrames(stubborn).requestFrame(() => {}, () => {});
    assertNotInstanceOf(held, Error, "the frame was given");
    held.cancel();
});
