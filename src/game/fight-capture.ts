/**
 * The fight as it happened, kept so a reader can write it to a file.
 *
 * **The shape is a contract, not an invention:** what this composes is what every recording in
 * `captures/` already is (`captures/AGENTS.md`), plus the `report` intake takes back off it. The
 * envelope is ours and English; what is inside `payload` is the game's. **ADR 0030.**
 *
 * ⚠️ **Nothing is redacted here, and that is the design.** The file carries real nicknames and
 * the game's own prose, and never enters git — intake deals with both, once (`SECURITY.md`).
 */

import { assert } from "@std/assert";
import { composeJsonWriting, getJsonReading } from "@/libs/json-text.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import { BUILD_VERSION } from "@/src/build-version.ts";
import type { CapturedCombatant } from "@/src/game/engine-warrior.ts";
import { composeReportFight, type ReportSubject } from "@/src/game/fight-report.ts";
import { isFightStart } from "@/src/game/battle-session.ts";

/**
 * 3 is the envelope in English; 2 was Polish and carried `raport`, 1 Polish without it. The number
 * says which writer wrote a file — `tools/capture-intake.ts` still takes 1 and 2. **ADR 0030.**
 */
const CAPTURE_FORMAT_VERSION = 3;
/**
 * The envelope's own field names, spelled here and read by whatever reads a recording back —
 * **N13**, which is why they are a constant rather than a string literal in each of two files.
 */
export const CAPTURE_FIELDS = {
    formatVersion: "formatVersion",
    addOnVersion: "addOnVersion",
    capturedAt: "capturedAt",
    world: "world",
    gameBuild: "gameBuild",
    userAgent: "userAgent",
    report: "report",
    droppedCalls: "droppedCalls",
    isTruncated: "isTruncated",
    calls: "calls",
    index: "index",
    payload: "payload",
    messages: "messages",
    combatantsBefore: "combatantsBefore",
    combatantsAfter: "combatantsAfter",
} as const;
/**
 * Where collecting stops. It **stops** rather than dropping the oldest: a recording without the
 * start of the fight is useless, one without the end still carries material.
 */
export const MAXIMUM_CALLS = 2000;
/** So a difference between two recordings is something a person can read. */
const INDENT_SPACES = 2;
/** In a name, where the register writes `none stated` in a sentence (`docs/captured-fights.md`). */
export const NOTHING_STATED = "none";

export interface CapturedCall {
    index: number;
    payload: unknown;
    messages: readonly string[];
    combatantsBefore: readonly CapturedCombatant[];
    combatantsAfter: readonly CapturedCombatant[];
}

export interface FightCapture {
    calls: readonly CapturedCall[];
    droppedCalls: number;
    /** Whether the ceiling was reached, so the file says its tail is missing. */
    isTruncated: boolean;
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
        isTruncated: false,
        shapesSeen: new Set(),
        statesSeen: new Set(),
    };
    assert(capture.calls.length === 0, "a recording starts holding no call");
    assert(!capture.isTruncated, "and with room for every one that arrives");
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
    const writing = composeJsonWriting(combatants);
    // A cast that would not be written is no key at all, and every state then keys the same.
    if (!writing.isOk) return "";
    assert(writing.text.length > 0, "and a key that was written says something");
    return writing.text;
}

/**
 * A copy that survives the game mutating what it handed over. Through the JSON round trip rather
 * than `structuredClone`: what is recorded is written as JSON anyway, so anything the round trip
 * cannot carry is dropped now rather than silently at the end.
 */
function composeCopiedValue(value: unknown): unknown {
    const writing = composeJsonWriting(value);
    // A field the client left out has no JSON text of its own, and copies as nothing.
    if (!writing.isOk) return null;
    assert(writing.text.length > 0, "a copy written as text says something");
    const reading = getJsonReading(writing.text);
    assert(reading.isOk, "and text this writer produced is text this reader takes back");
    return reading.value;
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
        return { ...previous, isTruncated: true, droppedCalls: previous.droppedCalls + 1 };
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
        isTruncated: false,
        shapesSeen: new Set([...previous.shapesSeen, shape]),
        statesSeen: new Set([...previous.statesSeen, state]),
    };
}

/**
 * The recording as the file on disk.
 *
 * **Two fields are about the reader rather than the fight**, and they are here because the file
 * arrives in a report: `addOnVersion` is which build of ours wrote it, `userAgent` what the browser
 * said of itself. `report` is the one derived thing here, travelling with the calls it came from so
 * a figure that looks wrong is read beside its material. **ADR 0027.**
 */
export function composeCaptureText(
    capture: FightCapture,
    surroundings: CaptureSurroundings,
    subject: ReportSubject | null,
): string | null {
    assert(surroundings.world.length > 0, "a recording names the world it was taken on");
    assert(surroundings.capturedAt.length > 0, "and the moment it was taken at");
    assert(surroundings.gameBuild !== "", "a build it could not read is absent, never empty");
    assert(surroundings.userAgent !== "", "and so is a browser that said nothing of itself");
    assert(capture.droppedCalls >= 0, "and what was dropped is never fewer than none");
    const writing = composeJsonWriting({
        [CAPTURE_FIELDS.formatVersion]: CAPTURE_FORMAT_VERSION,
        // Not the format's number: this is the add-on's own, and the two move for different
        // reasons.
        [CAPTURE_FIELDS.addOnVersion]: BUILD_VERSION,
        [CAPTURE_FIELDS.capturedAt]: surroundings.capturedAt,
        [CAPTURE_FIELDS.world]: surroundings.world,
        [CAPTURE_FIELDS.gameBuild]: surroundings.gameBuild,
        [CAPTURE_FIELDS.userAgent]: surroundings.userAgent,
        // Above the calls, which run to hundreds of kilobytes. Null says no fight was read.
        [CAPTURE_FIELDS.report]: subject === null ? null : composeReportFight(subject),
        [CAPTURE_FIELDS.droppedCalls]: capture.droppedCalls,
        [CAPTURE_FIELDS.isTruncated]: capture.isTruncated,
        [CAPTURE_FIELDS.calls]: capture.calls.map((call) => ({
            [CAPTURE_FIELDS.index]: call.index,
            [CAPTURE_FIELDS.payload]: call.payload,
            [CAPTURE_FIELDS.messages]: call.messages,
            [CAPTURE_FIELDS.combatantsBefore]: call.combatantsBefore,
            [CAPTURE_FIELDS.combatantsAfter]: call.combatantsAfter,
        })),
    }, INDENT_SPACES);
    if (!writing.isOk) return null;
    assert(writing.text.length > 0, "a recording written as text says something");
    return writing.text;
}

/**
 * Names the world, both versions and the moment: which build a recording came off and which wrote
 * it are what is asked of an attachment, and the moment keeps two from colliding. **ADR 0030.**
 */
export function composeCaptureFileName(surroundings: CaptureSurroundings): string {
    assert(surroundings.world.length > 0, "a file is named for the world it came from");
    assert(BUILD_VERSION.length > 0, "and for the build of ours that wrote it");
    const at = surroundings.capturedAt.split(":").join("-").split(".").join("-");
    assert(!at.includes(":"), "and for a moment no file system objects to");
    assert(!at.includes("."), "nor one a file's own extension could be read out of");
    assert(at.length > 0, "and a moment that says something");
    const build = surroundings.gameBuild ?? NOTHING_STATED;
    return `margometer-${surroundings.world}-${build}-${BUILD_VERSION}-${at}.json`;
}
