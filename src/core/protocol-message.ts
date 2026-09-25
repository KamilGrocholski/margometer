/**
 * The grammar of one message: structure, and nothing about what a key means.
 *
 *     actor;target;key=value;key
 *
 * Both ends come first, each an integer combatant id optionally carrying a health percentage, and
 * `0` where the protocol named nobody. What the grammar does not cover is refused as data
 * (`docs/design.md` §6.1): the decoder turns a refusal into a message it could not read.
 */

import { assert } from "@std/assert/assert";
import { err, ok, type Result } from "#/libs/result.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { formatInteger, parseInteger } from "#/libs/number-text.ts";
import { encodeHealthPercent, parseHealthPercent } from "./protocol-number.ts";

export interface MessageSide {
    readonly combatantId: number;
    readonly healthPercent: number | null;
}

export interface MessageParameter {
    readonly key: string;
    /** `null` for a segment with no `=`. An empty value is `""`, which is a different thing. */
    readonly value: string | null;
}

export interface ProtocolMessage {
    readonly actor: MessageSide | null;
    readonly target: MessageSide | null;
    readonly parameters: readonly MessageParameter[];
}

export const MESSAGE_END = { actor: "actor", target: "target" } as const;
export type MessageEnd = VocabularyWord<typeof MESSAGE_END>;

export const GRAMMAR_REFUSAL = {
    segmentsExceeded: "segments-exceeded",
    sideUnreadable: "side-unreadable",
    parameterKeyEmpty: "parameter-key-empty",
} as const;

export type GrammarRefusal =
    | { kind: typeof GRAMMAR_REFUSAL.segmentsExceeded; segments: number; maximum: number }
    | { kind: typeof GRAMMAR_REFUSAL.sideUnreadable; end: MessageEnd }
    | { kind: typeof GRAMMAR_REFUSAL.parameterKeyEmpty; index: number };

/** The longest message in `develop:captures/` carries 42 segments, 2026-08-28. */
export const SEGMENTS_MAXIMUM = 512;

const SEGMENT_SEPARATOR = ";";
const VALUE_SEPARATOR = "=";
const NO_COMBATANT = "0";
const SIDE_SEGMENTS = 2;

export function parseProtocolMessage(text: string): Result<ProtocolMessage, GrammarRefusal> {
    const segments = parseProtocolMessageSegments(text);
    if (!segments.ok) return segments;
    const [actorSegment, targetSegment] = segments.value;
    assert(actorSegment !== undefined, "text always splits into at least one segment");
    const actor = parseProtocolMessageSide(actorSegment, MESSAGE_END.actor);
    if (!actor.ok) return actor;
    if (targetSegment === undefined) {
        return err({ kind: GRAMMAR_REFUSAL.sideUnreadable, end: MESSAGE_END.target });
    }
    const target = parseProtocolMessageSide(targetSegment, MESSAGE_END.target);
    if (!target.ok) return target;

    const parameters: MessageParameter[] = [];
    for (const segment of segments.value.slice(SIDE_SEGMENTS)) {
        const separator = segment.indexOf(VALUE_SEPARATOR);
        const key = separator === -1 ? segment : segment.slice(0, separator);
        if (key.length === 0) {
            return err({ kind: GRAMMAR_REFUSAL.parameterKeyEmpty, index: parameters.length });
        }
        const value = separator === -1 ? null : segment.slice(separator + 1);
        parameters.push({ key, value });
    }
    assert(parameters.length + SIDE_SEGMENTS === segments.value.length, "no segment is dropped");
    return ok({ actor: actor.value, target: target.value, parameters });
}

/** Walked rather than `split`, so a message past the bound is refused before it is allocated. */
function parseProtocolMessageSegments(text: string): Result<string[], GrammarRefusal> {
    const segments: string[] = [];
    let from = 0;
    for (let look = 0; look < SEGMENTS_MAXIMUM; look += 1) {
        const separator = text.indexOf(SEGMENT_SEPARATOR, from);
        if (separator === -1) {
            segments.push(text.slice(from));
            assert(segments.length <= SEGMENTS_MAXIMUM, "a message kept is one inside the bound");
            return ok(segments);
        }
        segments.push(text.slice(from, separator));
        from = separator + SEGMENT_SEPARATOR.length;
    }
    const count = parseProtocolMessageSegmentsCount(text, from);
    assert(count > SEGMENTS_MAXIMUM, "a message refused for its length is past the bound");
    return err({
        kind: GRAMMAR_REFUSAL.segmentsExceeded,
        segments: count,
        maximum: SEGMENTS_MAXIMUM,
    });
}

/** Counts without allocating: the walk is bounded by the text, one separator per step. */
function parseProtocolMessageSegmentsCount(text: string, from: number): number {
    assert(from <= text.length, "the count resumes inside the text");
    let count = SEGMENTS_MAXIMUM + 1;
    let at = text.indexOf(SEGMENT_SEPARATOR, from);
    for (let look = 0; look < text.length; look += 1) {
        if (at === -1) break;
        count += 1;
        at = text.indexOf(SEGMENT_SEPARATOR, at + SEGMENT_SEPARATOR.length);
    }
    assert(at === -1, "every separator in the text was counted");
    return count;
}

/**
 * Shape and magnitude are one refusal: an id past 2^53 read as its nearest neighbour would charge
 * damage to a combatant who does not exist.
 */
function parseProtocolMessageSide(
    segment: string,
    end: MessageEnd,
): Result<MessageSide | null, GrammarRefusal> {
    if (segment === NO_COMBATANT) return ok(null);
    const separator = segment.indexOf(VALUE_SEPARATOR);
    const idText = separator === -1 ? segment : segment.slice(0, separator);
    const combatantId = parseInteger(idText);
    if (combatantId === null) return err({ kind: GRAMMAR_REFUSAL.sideUnreadable, end });
    assert(Number.isSafeInteger(combatantId), "an id read is one held exactly");
    if (separator === -1) return ok({ combatantId, healthPercent: null });
    const healthPercent = parseHealthPercent(segment.slice(separator + 1));
    if (healthPercent === null) return err({ kind: GRAMMAR_REFUSAL.sideUnreadable, end });
    assert(healthPercent >= 0, "a percentage the grammar accepted is never below nothing");
    return ok({ combatantId, healthPercent });
}

/**
 * The wire text written back, so that "the parser loses nothing" is a claim a machine settles over
 * every recording. A field quietly dropped while parsing reaches a reader as a figure too low.
 */
export function encodeProtocolMessage(message: ProtocolMessage): string {
    assert(
        message.parameters.length + SIDE_SEGMENTS <= SEGMENTS_MAXIMUM,
        "a message written is one the grammar would read",
    );
    const segments = [
        encodeProtocolMessageSide(message.actor),
        encodeProtocolMessageSide(message.target),
    ];
    for (const parameter of message.parameters) {
        assert(parameter.key.length > 0, "every parameter written names its key");
        const value = parameter.value;
        segments.push(
            value === null ? parameter.key : `${parameter.key}${VALUE_SEPARATOR}${value}`,
        );
    }
    return segments.join(SEGMENT_SEPARATOR);
}

function encodeProtocolMessageSide(side: MessageSide | null): string {
    if (side === null) return NO_COMBATANT;
    const idText = formatInteger(side.combatantId);
    if (side.healthPercent === null) {
        assert(idText !== NO_COMBATANT, "a side written bare is somebody, or it reads as nobody");
        return idText;
    }
    const percentText = encodeHealthPercent(side.healthPercent);
    assert(!percentText.includes(SEGMENT_SEPARATOR), "a percentage never ends its segment");
    return `${idText}${VALUE_SEPARATOR}${percentText}`;
}
