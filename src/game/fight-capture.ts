/**
 * The fight as it happened, kept so a reader can write it to a file (`docs/design.md` §7, §11).
 *
 * Thinned as it is collected, in the game's stack: every call carrying messages is kept, and so is
 * every call introducing a payload shape or a combatant state not seen before. On the first real
 * recording that dropped 565 of 569 calls, because the game polls `updateData` long after a fight
 * is over, without losing anything a kept call does not carry.
 */

import { assert } from "@std/assert/assert";
import { encodeJson, parseJson } from "@/libs/json-text.ts";
import { isRecord } from "@/libs/unknown-value.ts";
import type { WarriorSnapshot } from "@/src/game/warrior-snapshot.ts";

/**
 * Where collecting stops. It **stops** rather than dropping the oldest: a recording without the
 * start of the fight is useless, one without the end still carries material.
 */
export const CALLS_MAXIMUM = 2000;
const SHAPE_KEYS_MAXIMUM = 256;

export interface CapturedCall {
    index: number;
    payload: unknown;
    messages: readonly string[];
    /** Null where nobody read the engine, never `[]`: the two are different claims. */
    combatantsBefore: WarriorSnapshot | null;
    combatantsAfter: WarriorSnapshot | null;
}

/** One call as the engine handed it over, beside the snapshots taken either side of it. */
export interface EngineCall {
    payload: unknown;
    messages: readonly string[];
    combatantsBefore: WarriorSnapshot | null;
    combatantsAfter: WarriorSnapshot | null;
}

export interface CaptureStanding {
    readonly calls: readonly CapturedCall[];
    readonly droppedCalls: number;
    /** Whether the ceiling was reached, so the file says its tail is missing. */
    readonly isTruncated: boolean;
    readonly shapesSeen: ReadonlySet<string>;
    readonly statesSeen: ReadonlySet<string>;
}

export const NO_CAPTURE: CaptureStanding = {
    calls: [],
    droppedCalls: 0,
    isTruncated: false,
    shapesSeen: new Set(),
    statesSeen: new Set(),
};

/**
 * The recording after one more call, as a new standing: the one handed in is left as it was. A
 * fight that opens starts the recording over.
 */
export function prepareCapture(
    standing: CaptureStanding,
    call: EngineCall,
    isOpening: boolean,
): CaptureStanding {
    const previous = isOpening ? NO_CAPTURE : standing;
    assert(previous.calls.length <= CALLS_MAXIMUM, "a recording stays inside its stated bound");
    if (previous.calls.length >= CALLS_MAXIMUM) {
        return { ...previous, isTruncated: true, droppedCalls: previous.droppedCalls + 1 };
    }
    const shape = encodeCaptureShape(call.payload);
    const state = encodeCaptureState(call.combatantsAfter);
    let isKept = call.messages.length > 0;
    if (!isKept) isKept = !previous.shapesSeen.has(shape);
    if (!isKept) isKept = !previous.statesSeen.has(state);
    if (!isKept) return { ...previous, droppedCalls: previous.droppedCalls + 1 };
    const kept: CapturedCall = {
        index: previous.calls.length,
        payload: prepareCaptureCopy(call.payload),
        messages: [...call.messages],
        combatantsBefore: call.combatantsBefore === null ? null : [...call.combatantsBefore],
        combatantsAfter: call.combatantsAfter === null ? null : [...call.combatantsAfter],
    };
    return {
        calls: [...previous.calls, kept],
        droppedCalls: previous.droppedCalls,
        isTruncated: false,
        shapesSeen: new Set([...previous.shapesSeen, shape]),
        statesSeen: new Set([...previous.statesSeen, state]),
    };
}

/** Which keys the payload carried, so a call introducing one nobody has seen is kept. */
function encodeCaptureShape(payload: unknown): string {
    if (!isRecord(payload)) return "";
    const keys = Object.keys(payload).sort();
    assert(keys.length <= SHAPE_KEYS_MAXIMUM, "a shape is read off a payload inside its bound");
    return keys.join(",");
}

/** A cast that would not be written is no key at all, and every such state then keys the same. */
function encodeCaptureState(combatants: WarriorSnapshot | null): string {
    const written = encodeJson(combatants ?? [], 0);
    if (!written.ok) return "";
    assert(written.value.length > 0, "a key that was written says something");
    return written.value;
}

/**
 * A copy that survives the game mutating what it handed over. Through the JSON round trip rather
 * than `structuredClone`: what is recorded is written as JSON anyway, so anything the round trip
 * cannot carry is dropped now rather than silently at the end.
 */
function prepareCaptureCopy(value: unknown): unknown {
    const written = encodeJson(value, 0);
    if (!written.ok) return null;
    const read = parseJson(written.value);
    assert(read.ok, "text this writer produced is text this reader takes back");
    return read.value;
}
