/**
 * The recording as it is collected: which calls it keeps, what it copies, and where it stops.
 *
 * The file the recording becomes is the runtime's; what is proved here is the thinning, which runs
 * in the game's stack and decides what any file can carry.
 */

import { assert, assertEquals, assertFalse, assertStrictEquals } from "@std/assert";
import { isRecord } from "#/libs/unknown-value.ts";
import {
    CALLS_MAXIMUM,
    type CaptureStanding,
    type EngineCall,
    NO_CAPTURE,
    prepareCapture,
} from "#/src/game/fight-capture.ts";
import type { CapturedCombatant } from "#/src/game/warrior-snapshot.ts";

const NOBODY = { combatantsBefore: [], combatantsAfter: [] };

const SOMEBODY: CapturedCombatant = {
    id: 1,
    name: "somebody",
    team: 1,
    prof: "w",
    lvl: 60,
    hp: { max: 100, value: 90 },
    mana: null,
    energy: null,
    ac: null,
};

Deno.test("every call carrying messages is kept, and a call saying nothing new is dropped", () => {
    const opening = capture(NO_CAPTURE, { payload: { init: "1" } }, true);
    assertEquals(opening.calls.length, 1, "the call that opens a fight is a shape nobody has seen");
    assertEquals(opening.droppedCalls, 0, "so nothing is dropped for it");

    const again = capture(opening, { payload: { init: "1" } }, true);
    assertEquals(again.calls.length, 1, "a second opening starts the recording over, not adds");

    const said = capture(again, { payload: { m: ["x"] }, messages: ["x"] });
    assertEquals(said.calls.length, 2, "a call carrying a message is kept whatever else it says");
    const repeated = capture(said, { payload: { m: ["x"] } });
    assertEquals(repeated.calls.length, 2, "and one repeating a shape with nothing to say is not");
    assertEquals(repeated.droppedCalls, 1, "it is counted instead, where the file will state it");
    const repeatedSaid = capture(repeated, { payload: { m: ["x"] }, messages: ["y"] });
    assertEquals(repeatedSaid.calls.length, 3, "while a repeat that carries a message is kept");
});

function capture(standing: CaptureStanding, call: Partial<EngineCall>, isOpening = false) {
    return prepareCapture(standing, { payload: {}, messages: [], ...NOBODY, ...call }, isOpening);
}

Deno.test("a shape nobody has seen is kept even where the call says nothing", () => {
    const opened = capture(NO_CAPTURE, { payload: { poll: 1 } });
    const other = capture(opened, { payload: { poll: 1, auto: "1" } });
    assertEquals(other.calls.length, 2, "a payload carrying a key not seen before is kept");
    const reordered = capture(other, { payload: { auto: "1", poll: 1 } });
    assertEquals(reordered.droppedCalls, 1, "and the same keys in another order are no new shape");
});

Deno.test("a state nobody has seen is kept even where the payload says nothing", () => {
    const opened = capture(NO_CAPTURE, { payload: { poll: 1 } });
    const moved = capture(opened, { payload: { poll: 1 }, combatantsAfter: [SOMEBODY] });
    assertEquals(moved.calls.length, 2, "health that moved is kept though the payload repeats");
    assertEquals(moved.droppedCalls, 0, "and nothing is dropped for it");
    const same = capture(moved, { payload: { poll: 1 }, combatantsAfter: [SOMEBODY] });
    assertEquals(same.droppedCalls, 1, "a state already seen is no reason to keep a call");
});

Deno.test("the standing handed in is left as it was", () => {
    const opened = capture(NO_CAPTURE, { payload: { poll: 1 } });
    const shapes = [...opened.shapesSeen];
    const next = capture(opened, { payload: { other: 1 }, messages: ["x"] });
    assertEquals(opened.calls.length, 1, "the recording handed in keeps its calls");
    assertEquals([...opened.shapesSeen], shapes, "and the shapes it had seen");
    assertEquals(next.calls.length, 2, "while the one handed back holds the new call");
    assertEquals(NO_CAPTURE.calls.length, 0, "and the empty recording stays empty");
});

Deno.test("a recording stops at its ceiling rather than dropping its start", () => {
    let standing = NO_CAPTURE;
    for (let at = 0; at < CALLS_MAXIMUM; at += 1) {
        standing = capture(standing, { payload: { at }, messages: [`${at}`] });
    }
    assertEquals(standing.calls.length, CALLS_MAXIMUM, "every call up to the ceiling is kept");
    assertFalse(standing.isTruncated, "and a recording at its ceiling has lost nothing yet");
    const past = capture(standing, { payload: { past: 1 }, messages: ["past"] });
    assertEquals(past.calls.length, CALLS_MAXIMUM, "the call past it is not kept");
    assertEquals(past.calls[0]?.messages, ["0"], "and the first call is still the first");
    assert(past.isTruncated, "the recording says its tail is missing");
    assertEquals(past.droppedCalls, 1, "and counts what it did not keep");
    const reopened = capture(past, { payload: { init: 1 } }, true);
    assertEquals(reopened.calls.length, 1, "a fight that opens starts over under the ceiling");
    assertFalse(reopened.isTruncated, "and says nothing of the tail of the fight before it");
});

Deno.test("what the game goes on changing is copied, not held by reference", () => {
    const payload: Record<string, unknown> = { init: "1", w: { 1: { name: "before" } } };
    const messages = ["0;0;txt=a"];
    const kept = capture(NO_CAPTURE, { payload, messages, combatantsAfter: [SOMEBODY] }, true);
    payload.w = { 1: { name: "after" } };
    messages.push("0;0;txt=b");
    const call = kept.calls[0];
    assert(call !== undefined, "the call was kept");
    assert(isRecord(call.payload), "and kept a payload");
    assertEquals(call.payload.w, { 1: { name: "before" } }, "the payload as it arrived");
    assertEquals(call.messages, ["0;0;txt=a"], "and the messages as they arrived");
});

Deno.test("a payload the round trip cannot carry is kept as null, with its call", () => {
    const cycle: Record<string, unknown> = { init: 1 };
    cycle.self = cycle;
    const kept = capture(NO_CAPTURE, { payload: cycle, messages: ["0;0;txt=a"] }, true);
    assertEquals(kept.calls.length, 1, "the call is kept, because its messages were read");
    assertStrictEquals(kept.calls[0]?.payload, null, "and its payload is null, not a reference");
});

Deno.test("a snapshot nobody took is null, and one of nobody is empty", () => {
    const unread = capture(NO_CAPTURE, { combatantsBefore: null, combatantsAfter: null }, true);
    assertStrictEquals(unread.calls[0]?.combatantsBefore, null, "not read is null");
    assertStrictEquals(unread.calls[0]?.combatantsAfter, null, "on either side of the call");
    const empty = capture(NO_CAPTURE, { payload: { init: 1 } }, true);
    assertEquals(empty.calls[0]?.combatantsAfter, [], "while a fight holding nobody is empty");
    const held = capture(NO_CAPTURE, { combatantsAfter: [SOMEBODY] }, true);
    assertEquals(held.calls[0]?.combatantsAfter, [SOMEBODY], "and one holding somebody holds them");
});
