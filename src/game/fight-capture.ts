/**
 * The fight as it happened, kept so a reader can write it to a file (`docs/design.md` §7, §11).
 *
 * Thinned as it is collected, in the game's stack: every call carrying messages is kept, and so is
 * every call introducing a payload shape or a combatant state not seen before. On the first real
 * recording that dropped 565 of 569 calls, because the game polls `updateData` long after a fight
 * is over, without losing anything a kept call does not carry.
 */

import { assert } from "@std/assert/assert";
import { encodeJson, parseJson } from "#/libs/json-text.ts";
import { isRecord } from "#/libs/unknown-value.ts";
import type { WarriorSnapshot } from "./warrior-snapshot.ts";

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

/** The recording being collected, changed by `commitCapture` alone. */
export interface FightCapture {
    calls: CapturedCall[];
    droppedCalls: number;
    /** Whether the ceiling was reached, so the file says its tail is missing. */
    isTruncated: boolean;
    shapesSeen: Set<string>;
    statesSeen: Set<string>;
}

export interface PreparedCapture {
    /** How many calls the recording it was prepared against held; a fight that opens holds none. */
    readonly callIndex: number;
    readonly isOpening: boolean;
    readonly isPastCeiling: boolean;
    /** Null where the call says nothing new or comes past the ceiling: it is counted, not kept. */
    readonly kept: CaptureKept | null;
}

interface CaptureKept {
    readonly call: CapturedCall;
    readonly shape: string;
    readonly state: string;
}

/**
 * Where collecting stops. It **stops** rather than dropping the oldest: a recording without the
 * start of the fight is useless, one without the end still carries material.
 */
export const CALLS_MAXIMUM = 2000;
const SHAPE_KEYS_MAXIMUM = 256;

export function createFightCapture(): FightCapture {
    return {
        calls: [],
        droppedCalls: 0,
        isTruncated: false,
        shapesSeen: new Set(),
        statesSeen: new Set(),
    };
}

/** Phase one: whether one more call is kept, and its copy, the recording untouched. */
export function prepareCapture(
    capture: FightCapture,
    call: EngineCall,
    isOpening: boolean,
): PreparedCapture {
    const callIndex = isOpening ? 0 : capture.calls.length;
    assert(callIndex <= CALLS_MAXIMUM, "a recording stays inside its stated bound");
    if (callIndex >= CALLS_MAXIMUM) {
        return { callIndex, isOpening, isPastCeiling: true, kept: null };
    }
    const shape = encodeCaptureShape(call.payload);
    const state = encodeCaptureState(call.combatantsAfter);
    let isKept: boolean;
    if (isOpening) isKept = true;
    else if (call.messages.length > 0) isKept = true;
    else if (!capture.shapesSeen.has(shape)) isKept = true;
    else isKept = !capture.statesSeen.has(state);
    if (!isKept) return { callIndex, isOpening, isPastCeiling: false, kept: null };
    const kept: CapturedCall = {
        index: callIndex,
        payload: prepareCaptureCopy(call.payload),
        messages: [...call.messages],
        combatantsBefore: call.combatantsBefore === null ? null : [...call.combatantsBefore],
        combatantsAfter: call.combatantsAfter === null ? null : [...call.combatantsAfter],
    };
    return { callIndex, isOpening, isPastCeiling: false, kept: { call: kept, shape, state } };
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
    if (written instanceof Error) return "";
    assert(written.length > 0, "a key that was written says something");
    return written;
}

/**
 * A copy that survives the game mutating what it handed over. Through the JSON round trip rather
 * than `structuredClone`: what is recorded is written as JSON anyway, so anything the round trip
 * cannot carry is dropped now rather than silently at the end.
 */
function prepareCaptureCopy(value: unknown): unknown {
    const written = encodeJson(value, 0);
    if (written instanceof Error) return null;
    const read = parseJson(written);
    assert(!(read instanceof Error), "text this writer produced is text this reader takes back");
    return read;
}

/** Phase two: the call kept or counted into the recording. It cannot fail. */
export function commitCapture(capture: FightCapture, prepared: PreparedCapture): void {
    if (prepared.isOpening) {
        // Start over: a fight that opens is a recording of its own.
        capture.calls = [];
        capture.droppedCalls = 0;
        capture.shapesSeen = new Set();
        capture.statesSeen = new Set();
    } else {
        const callIndex = capture.calls.length;
        assert(
            callIndex === prepared.callIndex,
            "a call lands on the recording it was read against",
        );
    }
    capture.isTruncated = prepared.isPastCeiling;
    const kept = prepared.kept;
    if (kept === null) {
        capture.droppedCalls += 1;
        return;
    }
    assert(capture.calls.length < CALLS_MAXIMUM, "a call is kept only under the ceiling");
    capture.calls.push(kept.call);
    capture.shapesSeen.add(kept.shape);
    capture.statesSeen.add(kept.state);
}
