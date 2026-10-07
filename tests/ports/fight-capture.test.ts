/**
 * The recording as it is collected: which calls it keeps, what it copies, and where it stops.
 *
 * The file the recording becomes is the runtime's; what is proved here is the thinning, which runs
 * in the game's stack and decides what any file can carry.
 */

import {
    assert,
    assertEquals,
    assertFalse,
    AssertionError,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import { isRecord } from "#/libs/unknown-value.ts";
import {
    CALLS_MAXIMUM,
    commitCapture,
    createFightCapture,
    type FightCapture,
    type MargonemEngineCall,
    prepareCapture,
    SHAPE_KEYS_MAXIMUM,
} from "#/src/ports/fight-capture.ts";
import type { CapturedCombatant } from "#/src/ports/margonem-engine-warriors.ts";

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
    const recording = createFightCapture();
    capture(recording, { payload: { init: "1" } }, true);
    assertStrictEquals(
        recording.calls.length,
        1,
        "the call opening a fight is a shape nobody has seen",
    );
    assertStrictEquals(recording.droppedCalls, 0, "so nothing is dropped for it");

    capture(recording, { payload: { init: "1" } }, true);
    assertStrictEquals(
        recording.calls.length,
        1,
        "a second opening starts the recording over, not adds",
    );

    capture(recording, { payload: { m: ["x"] }, messages: ["x"] });
    assertStrictEquals(
        recording.calls.length,
        2,
        "a call carrying a message is kept whatever it says",
    );
    capture(recording, { payload: { m: ["x"] } });
    assertStrictEquals(
        recording.calls.length,
        2,
        "and one repeating a shape with nothing to say is not",
    );
    assertStrictEquals(
        recording.droppedCalls,
        1,
        "it is counted instead, where the file will state it",
    );
    capture(recording, { payload: { m: ["x"] }, messages: ["y"] });
    assertStrictEquals(recording.calls.length, 3, "while a repeat that carries a message is kept");
});

function capture(
    recording: FightCapture,
    call: Partial<MargonemEngineCall>,
    isOpening = false,
): void {
    const whole = { payload: {}, messages: [], ...NOBODY, ...call };
    commitCapture(recording, prepareCapture(recording, whole, isOpening));
}

Deno.test("a shape nobody has seen is kept even where the call says nothing", () => {
    const recording = createFightCapture();
    capture(recording, { payload: { poll: 1 } });
    capture(recording, { payload: { poll: 1, auto: "1" } });
    assertStrictEquals(
        recording.calls.length,
        2,
        "a payload carrying a key not seen before is kept",
    );
    capture(recording, { payload: { auto: "1", poll: 1 } });
    assertStrictEquals(
        recording.droppedCalls,
        1,
        "and the same keys in another order are no new shape",
    );
});

Deno.test("a state nobody has seen is kept even where the payload says nothing", () => {
    const recording = createFightCapture();
    capture(recording, { payload: { poll: 1 } });
    capture(recording, { payload: { poll: 1 }, combatantsAfter: [SOMEBODY] });
    assertStrictEquals(
        recording.calls.length,
        2,
        "health that moved is kept though the payload repeats",
    );
    assertStrictEquals(recording.droppedCalls, 0, "and nothing is dropped for it");
    capture(recording, { payload: { poll: 1 }, combatantsAfter: [SOMEBODY] });
    assertStrictEquals(
        recording.droppedCalls,
        1,
        "a state already seen is no reason to keep a call",
    );
});

Deno.test("a call prepared leaves the recording as it was, and only its commit keeps it", () => {
    const recording = createFightCapture();
    capture(recording, { payload: { poll: 1 } });
    const shapes = [...recording.shapesSeen];
    const call = { payload: { other: 1 }, messages: ["x"], ...NOBODY };
    const prepared = prepareCapture(recording, call, false);
    assertStrictEquals(recording.calls.length, 1, "the recording prepared against keeps its calls");
    assertEquals([...recording.shapesSeen], shapes, "and the shapes it had seen");
    commitCapture(recording, prepared);
    assertStrictEquals(recording.calls.length, 2, "while the commit holds the new call");
    assertStrictEquals(createFightCapture().calls.length, 0, "and a new recording is empty");
});

Deno.test("a call prepared against one recording lands on no other", () => {
    const recording = createFightCapture();
    capture(recording, { payload: { poll: 1 } });
    const call = { payload: { other: 1 }, messages: ["x"], ...NOBODY };
    const prepared = prepareCapture(recording, call, false);
    capture(recording, { payload: { more: 1 }, messages: ["y"] });
    assertThrows(() => commitCapture(recording, prepared), AssertionError, "read against");
    const opening = prepareCapture(recording, call, true);
    capture(recording, { payload: { most: 1 }, messages: ["z"] });
    commitCapture(recording, opening);
    assertStrictEquals(
        recording.calls.length,
        1,
        "while an opening starts over, whatever came before",
    );
});

Deno.test("a recording stops at its ceiling rather than dropping its start", () => {
    const recording = createFightCapture();
    for (let callIndex = 0; callIndex < CALLS_MAXIMUM; callIndex += 1) {
        capture(recording, { payload: { at: callIndex }, messages: [`${callIndex}`] });
    }
    assertStrictEquals(
        recording.calls.length,
        CALLS_MAXIMUM,
        "every call up to the ceiling is kept",
    );
    assertFalse(recording.isTruncated, "and a recording at its ceiling has lost nothing yet");
    capture(recording, { payload: { past: 1 }, messages: ["past"] });
    assertStrictEquals(recording.calls.length, CALLS_MAXIMUM, "the call past it is not kept");
    assertEquals(recording.calls[0]?.messages, ["0"], "and the first call is still the first");
    assert(recording.isTruncated, "the recording says its tail is missing");
    assertStrictEquals(recording.droppedCalls, 1, "and counts what it did not keep");
    capture(recording, { payload: { init: 1 } }, true);
    assertStrictEquals(
        recording.calls.length,
        1,
        "a fight that opens starts over under the ceiling",
    );
    assertFalse(recording.isTruncated, "and says nothing of the tail of the fight before it");
    assertStrictEquals(recording.droppedCalls, 0, "nor counts what that fight dropped");
});

/** The game polls long after a fight ends: a poll past the ceiling loses nothing worth keeping. */
Deno.test("a call past the ceiling cuts the tail only where it would have been kept", () => {
    const recording = createFightCapture();
    for (let callIndex = 0; callIndex < CALLS_MAXIMUM; callIndex += 1) {
        capture(recording, { payload: { at: callIndex }, messages: [`${callIndex}`] });
    }
    capture(recording, { payload: { at: 0 }, messages: [] });
    assertFalse(recording.isTruncated, "a poll saying nothing new loses nothing");
    assertStrictEquals(recording.droppedCalls, 1, "and is counted as dropped all the same");
    capture(recording, { payload: { at: 0 }, messages: ["said"] });
    assert(recording.isTruncated, "a call with messages past it is a tail lost");
    capture(recording, { payload: { at: 0 }, messages: [] });
    assert(recording.isTruncated, "and a poll after it does not take that back");
});

Deno.test("a call kept past the ceiling is a call nobody prepared", () => {
    const recording = createFightCapture();
    for (let callIndex = 0; callIndex < CALLS_MAXIMUM; callIndex += 1) {
        capture(recording, { payload: { at: callIndex }, messages: [`${callIndex}`] });
    }
    const call = recording.calls[0];
    assert(call !== undefined, "the recording holds a call to forge from");
    const forged = {
        callIndex: CALLS_MAXIMUM,
        isOpening: false,
        isPastCeiling: false,
        kept: { call, shape: "forged", state: "forged" },
    };
    assertThrows(() => commitCapture(recording, forged), AssertionError, "under the ceiling");
});

Deno.test("a fight that opens has seen no shape and no state of the fight before it", () => {
    const recording = createFightCapture();
    capture(recording, { payload: { init: 1 } }, true);
    capture(recording, { payload: { poll: 1 }, messages: ["x"] });
    capture(recording, { payload: { init: 1 }, combatantsAfter: [SOMEBODY] });
    assertStrictEquals(
        recording.calls.length,
        3,
        "the fight before saw a poll and somebody standing",
    );
    capture(recording, { payload: { init: 1 } }, true);
    capture(recording, { payload: { poll: 1 } });
    assertStrictEquals(
        recording.calls.length,
        2,
        "a shape seen only before the opening is new again",
    );
    capture(recording, { payload: { init: 1 }, combatantsAfter: [SOMEBODY] });
    assertStrictEquals(recording.calls.length, 3, "and so is a state seen only before it");
    assertStrictEquals(recording.droppedCalls, 0, "so neither is dropped");
});

Deno.test("what the game goes on changing is copied, not held by reference", () => {
    const payload: Record<string, unknown> = { init: "1", w: { 1: { name: "before" } } };
    const messages = ["0;0;txt=a"];
    const recording = createFightCapture();
    capture(recording, { payload, messages, combatantsAfter: [SOMEBODY] }, true);
    payload.w = { 1: { name: "after" } };
    messages.push("0;0;txt=b");
    const call = recording.calls[0];
    assert(call !== undefined, "the call was kept");
    assert(isRecord(call.payload), "and kept a payload");
    assertEquals(call.payload.w, { 1: { name: "before" } }, "the payload as it arrived");
    assertEquals(call.messages, ["0;0;txt=a"], "and the messages as they arrived");
});

Deno.test("a payload the round trip cannot carry is kept as null, with its call", () => {
    const cycle: Record<string, unknown> = { init: 1 };
    cycle.self = cycle;
    const recording = createFightCapture();
    capture(recording, { payload: cycle, messages: ["0;0;txt=a"] }, true);
    assertStrictEquals(
        recording.calls.length,
        1,
        "the call is kept, because its messages were read",
    );
    assertStrictEquals(
        recording.calls[0]?.payload,
        null,
        "and its payload is null, not a reference",
    );
});

Deno.test("a snapshot nobody took is null, and one of nobody is empty", () => {
    const unread = createFightCapture();
    capture(unread, { combatantsBefore: null, combatantsAfter: null }, true);
    assertStrictEquals(unread.calls[0]?.combatantsBefore, null, "not read is null");
    assertStrictEquals(unread.calls[0]?.combatantsAfter, null, "on either side of the call");
    const empty = createFightCapture();
    capture(empty, { payload: { init: 1 } }, true);
    assertEquals(empty.calls[0]?.combatantsAfter, [], "while a fight holding nobody is empty");
    const held = createFightCapture();
    capture(held, { combatantsAfter: [SOMEBODY] }, true);
    assertEquals(held.calls[0]?.combatantsAfter, [SOMEBODY], "and one holding somebody holds them");
});

Deno.test("a payload past the bound on its keys is kept, shaped by the keys the bound reads", () => {
    const recording = createFightCapture();
    capture(recording, { payload: composeKeyedPayload(SHAPE_KEYS_MAXIMUM) });
    assertStrictEquals(
        recording.calls.length,
        1,
        "a payload at the bound is a shape like any other",
    );
    capture(recording, { payload: composeKeyedPayload(SHAPE_KEYS_MAXIMUM + 1) });
    assertStrictEquals(
        recording.calls.length,
        2,
        "one key past it is kept, and is no other's shape",
    );
    capture(recording, { payload: composeKeyedPayload(SHAPE_KEYS_MAXIMUM + 2) });
    assertStrictEquals(
        recording.droppedCalls,
        1,
        "while past it, only the keys the bound reads count",
    );
});

/** Keys that sort as they are numbered, so the first of them are the ones the bound reads. */
function composeKeyedPayload(keyCount: number): Record<string, number> {
    const payload: Record<string, number> = {};
    for (let keyIndex = 0; keyIndex < keyCount; keyIndex += 1) {
        payload[`key${String(keyIndex).padStart(4, "0")}`] = keyIndex;
    }
    return payload;
}
