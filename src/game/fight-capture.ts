/**
 * The fight as it happened, kept so a reader can write it to a file.
 *
 * **The shape is a contract, not an invention:** what this composes is what every recording in
 * `captures/` already is, Polish field names and all, because that is the only way new material
 * can be set beside what is admitted (`captures/AGENTS.md`).
 *
 * ⚠️ **Nothing is redacted here, and that is the design.** The file carries real nicknames and
 * the game's own prose, and it never enters git — intake is where both are dealt with, once and
 * checkably (`SECURITY.md`).
 */

import { assert } from "@std/assert";
import { composeJsonText, getValueFromJsonText, isRecord } from "@/src/core/unknown-reading.ts";
import { BUILD_VERSION } from "@/src/build-version.ts";
import type { CapturedCombatant } from "@/src/game/engine-warrior.ts";
import { isFightStart } from "@/src/game/battle-session.ts";

/** Measured over `captures/` 2026-08-29: all 28 recordings state 1. */
const CAPTURE_FORMAT_VERSION = 1;
/**
 * The envelope's own field names, spelled here and read by whatever reads a recording back —
 * **N13**, which is why they are a constant rather than nine string literals in two files.
 */
export const CAPTURE_FIELDS = {
    formatVersion: "wersja",
    addOnVersion: "dodatek",
    capturedAt: "przy",
    world: "swiat",
    gameBuild: "build",
    userAgent: "przegladarka",
    droppedCalls: "pominietych",
    isFull: "urwany",
    calls: "wpisy",
    index: "nr",
    payload: "ladunek",
    messages: "komunikaty",
    combatantsBefore: "wojownicyPrzed",
    combatantsAfter: "wojownicyPo",
} as const;
/**
 * Where collecting stops. It **stops** rather than dropping the oldest: a recording without the
 * start of the fight is useless, one without the end still carries material.
 */
const MAXIMUM_CALLS = 2000;
/** So a difference between two recordings is something a person can read. */
const INDENT_SPACES = 2;

export interface CapturedCall {
    index: number;
    payload: unknown;
    messages: readonly string[];
    combatantsBefore: readonly CapturedCombatant[];
    combatantsAfter: readonly CapturedCombatant[];
}

export interface FightCapture {
    calls: readonly CapturedCall[];
    /** Calls the thinning decided carried nothing new. Written to the file. */
    droppedCalls: number;
    /** Whether the ceiling was reached, so the file says its tail is missing. */
    isFull: boolean;
    shapesSeen: ReadonlySet<string>;
    statesSeen: ReadonlySet<string>;
}

/** What a recording needs from outside the fight, handed in so none of this reaches a page. */
export interface CaptureSurroundings {
    world: string;
    /** Null where the page did not say: a recording without it is not comparable with others. */
    gameBuild: string | null;
    capturedAt: string;
    /** Null where the browser did not say, never `""`. Unknown is not a value nobody wrote. */
    userAgent: string | null;
}

export function composeEmptyCapture(): FightCapture {
    const capture: FightCapture = {
        calls: [],
        droppedCalls: 0,
        isFull: false,
        shapesSeen: new Set(),
        statesSeen: new Set(),
    };
    assert(capture.calls.length === 0, "a recording starts holding no call");
    assert(!capture.isFull, "and with room for every one that arrives");
    return capture;
}

/** Which keys the payload carried, so a call introducing one nobody has seen is kept. */
function composeShapeKey(payload: unknown): string {
    if (!isRecord(payload)) return "";
    const keys = Object.keys(payload).sort();
    assert(keys.length >= 0, "a payload states the keys it states, however few");
    assert(keys.length === Object.keys(payload).length, "and each of them once");
    return keys.join(",");
}

function composeStateKey(combatants: readonly CapturedCombatant[]): string {
    assert(combatants.length >= 0, "a state is keyed off the cast, however small");
    const written = composeJsonText(combatants) ?? "";
    assert(written.length >= 0, "and a key that would not be written is no key at all");
    return written;
}

/**
 * A copy that survives the game mutating what it handed over. Through the JSON round trip rather
 * than `structuredClone`: what is recorded is written as JSON anyway, so anything the round trip
 * cannot carry is dropped now rather than silently at the end.
 */
function composeCopiedValue(value: unknown): unknown {
    // `?? null` because a field the client left out happens, and the writer refuses `undefined`.
    const written = composeJsonText(value ?? null);
    assert(written === null || written.length > 0, "a copy written as text says something");
    if (written === null) return null;
    return getValueFromJsonText(written);
}

/**
 * The recording after one more call, rebuilt rather than mutated.
 *
 * **Thinned as it is collected**, by the rule v1 measured: every call carrying messages is kept,
 * and so is every call introducing a payload shape or a combatant state not seen before. On the
 * first real recording that dropped 565 of 569 calls — the game polls `updateData` long after a
 * fight is over — without losing anything a kept call does not carry.
 */
export function composeNextCapture(
    capture: FightCapture,
    call: Omit<CapturedCall, "index">,
): FightCapture {
    const previous = isFightStart(call.payload) ? composeEmptyCapture() : capture;
    assert(previous.calls.length <= MAXIMUM_CALLS, "a recording stays inside its stated bound");
    if (previous.calls.length >= MAXIMUM_CALLS) {
        return { ...previous, isFull: true, droppedCalls: previous.droppedCalls + 1 };
    }
    const shape = composeShapeKey(call.payload);
    const state = composeStateKey(call.combatantsAfter);
    const isWorthKeeping = call.messages.length > 0 ||
        !previous.shapesSeen.has(shape) ||
        !previous.statesSeen.has(state);
    if (!isWorthKeeping) {
        return { ...previous, droppedCalls: previous.droppedCalls + 1 };
    }
    const kept: CapturedCall = {
        index: previous.calls.length,
        payload: composeCopiedValue(call.payload),
        messages: [...call.messages],
        combatantsBefore: [...call.combatantsBefore],
        combatantsAfter: [...call.combatantsAfter],
    };
    return {
        calls: [...previous.calls, kept],
        droppedCalls: previous.droppedCalls,
        isFull: false,
        shapesSeen: new Set([...previous.shapesSeen, shape]),
        statesSeen: new Set([...previous.statesSeen, state]),
    };
}

/**
 * The recording as the file on disk. The field names are the game's own Polish, because they are
 * the format the recordings are in.
 *
 * **Two fields are about the reader rather than the fight**, and they are here because the file
 * arrives in a report: `dodatek` is which build wrote it, `przegladarka` what the browser said of
 * itself. Nothing here is derived from the fight — a computed number belongs in a report.
 */
export function composeCaptureText(
    capture: FightCapture,
    surroundings: CaptureSurroundings,
): string | null {
    assert(surroundings.world.length > 0, "a recording names the world it was taken on");
    assert(surroundings.capturedAt.length > 0, "and the moment it was taken at");
    assert(surroundings.gameBuild !== "", "a build it could not read is absent, never empty");
    assert(surroundings.userAgent !== "", "and so is a browser that said nothing of itself");
    assert(capture.droppedCalls >= 0, "and what was dropped is never fewer than none");
    return composeJsonText({
        [CAPTURE_FIELDS.formatVersion]: CAPTURE_FORMAT_VERSION,
        // Not the format's number: this is the add-on's own, and the two move for different
        // reasons.
        [CAPTURE_FIELDS.addOnVersion]: BUILD_VERSION,
        [CAPTURE_FIELDS.capturedAt]: surroundings.capturedAt,
        [CAPTURE_FIELDS.world]: surroundings.world,
        [CAPTURE_FIELDS.gameBuild]: surroundings.gameBuild,
        [CAPTURE_FIELDS.userAgent]: surroundings.userAgent,
        [CAPTURE_FIELDS.droppedCalls]: capture.droppedCalls,
        [CAPTURE_FIELDS.isFull]: capture.isFull,
        [CAPTURE_FIELDS.calls]: capture.calls.map((call) => ({
            [CAPTURE_FIELDS.index]: call.index,
            [CAPTURE_FIELDS.payload]: call.payload,
            [CAPTURE_FIELDS.messages]: call.messages,
            [CAPTURE_FIELDS.combatantsBefore]: call.combatantsBefore,
            [CAPTURE_FIELDS.combatantsAfter]: call.combatantsAfter,
        })),
    }, INDENT_SPACES);
}

/** Names the world and the moment, so two recordings never collide in one folder. */
export function composeCaptureFileName(surroundings: CaptureSurroundings): string {
    assert(surroundings.world.length > 0, "a file is named for the world it came from");
    const at = surroundings.capturedAt.split(":").join("-").split(".").join("-");
    assert(!at.includes(":"), "and for a moment no file system objects to");
    assert(!at.includes("."), "nor one a file's own extension could be read out of");
    assert(at.length > 0, "and a moment that says something");
    return `margometer-${surroundings.world}-${at}.json`;
}
