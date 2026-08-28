/**
 * The grammar of one message: structure, and nothing about what a key means.
 *
 *     actor;target;key=value;key
 *
 * Both ends come first, each an integer combatant id optionally carrying a health percentage,
 * and `0` where the protocol named nobody. Anything the grammar does not cover throws: the
 * decoder is the layer that survives a surprise, and it does so by turning a refusal here into
 * a loud unknown rather than by reading half a message as if it were understood.
 */

import { assert } from "@std/assert";
import { MargoMeterError } from "@/src/core/margometer-error.ts";
import {
    composeHealthPercentText,
    composeIntegerText,
    getHealthPercentFromText,
    getIntegerFromText,
    isIntegerText,
} from "@/src/core/protocol-number.ts";

/**
 * Named because the decoder catches exactly this and turns it into a message it could not read.
 * A catch on the base would swallow every other failure `core/` could raise as an unread message.
 */
export class ProtocolMessageFormatError extends MargoMeterError {
    constructor(reason: string) {
        super("ProtocolMessageFormat", reason);
    }
}

export interface MessageSide {
    combatantId: number;
    /** The health the protocol states for this combatant, or null where it states none. */
    healthPercent: number | null;
}

export interface MessageParameter {
    key: string;
    /** Null for a segment with no `=`. An empty value is `""`, which is a different thing. */
    value: string | null;
}

export interface ProtocolMessage {
    actor: MessageSide | null;
    target: MessageSide | null;
    parameters: MessageParameter[];
}

const SEGMENT_SEPARATOR = ";";
const VALUE_SEPARATOR = "=";
const NO_COMBATANT = "0";
/** The two ends a message states before it states a single key. */
const SIDE_SEGMENTS = 2;
/** The longest message in `captures/` carries 42 segments, 2026-08-28. */
const MAXIMUM_SEGMENTS = 512;

/**
 * Shape and magnitude are two refusals, and the split is load-bearing: the protocol could
 * state an id past 2^53, and reading it as its nearest neighbour would charge damage to a
 * combatant who does not exist.
 */
function parseMessageSide(segment: string, whole: string): MessageSide | null {
    if (segment === NO_COMBATANT) return null;
    const separator = segment.indexOf(VALUE_SEPARATOR);
    const idText = separator === -1 ? segment : segment.slice(0, separator);
    if (!isIntegerText(idText)) {
        throw new ProtocolMessageFormatError(`side "${segment}" in "${whole}"`);
    }
    const combatantId = getIntegerFromText(idText);
    if (combatantId === null) {
        throw new ProtocolMessageFormatError(`id "${idText}" in "${whole}"`);
    }
    if (separator === -1) return { combatantId, healthPercent: null };
    const healthPercent = getHealthPercentFromText(segment.slice(separator + 1));
    if (healthPercent === null) {
        throw new ProtocolMessageFormatError(`health "${segment}" in "${whole}"`);
    }
    assert(healthPercent >= 0, "a percentage the grammar accepted is never below nothing");
    return { combatantId, healthPercent };
}

function parseMessageParameter(segment: string): MessageParameter {
    const separator = segment.indexOf(VALUE_SEPARATOR);
    assert(separator < segment.length, "a separator sits inside the segment it was found in");
    if (separator === -1) return { key: segment, value: null };
    const key = segment.slice(0, separator);
    const value = segment.slice(separator + 1);
    assert(key.length + value.length + 1 === segment.length, "a segment splits into two parts");
    return { key, value };
}

export function parseProtocolMessage(message: string): ProtocolMessage {
    const segments = message.split(SEGMENT_SEPARATOR);
    if (segments.length < SIDE_SEGMENTS) {
        throw new ProtocolMessageFormatError(`one segment in "${message}"`);
    }
    assert(segments.length <= MAXIMUM_SEGMENTS, "a message stays inside its stated bound");
    const [actorSegment, targetSegment] = segments;
    assert(actorSegment !== undefined, "a message split in two has a first segment");
    assert(targetSegment !== undefined, "a message split in two has a second segment");
    const parameters = segments.slice(SIDE_SEGMENTS).map(parseMessageParameter);
    assert(
        parameters.length === segments.length - SIDE_SEGMENTS,
        "every segment past the ends is a parameter",
    );
    return {
        actor: parseMessageSide(actorSegment, message),
        target: parseMessageSide(targetSegment, message),
        parameters,
    };
}

function composeMessageSide(side: MessageSide | null): string {
    if (side === null) return NO_COMBATANT;
    const idText = composeIntegerText(side.combatantId);
    assert(idText.length > 0, "an id is written as at least one character");
    if (side.healthPercent === null) return idText;
    const percentText = composeHealthPercentText(side.healthPercent);
    assert(percentText.includes("."), "a percentage is written with its places");
    return `${idText}${VALUE_SEPARATOR}${percentText}`;
}

/**
 * Writing the wire text back is what makes "the parser loses nothing" a claim a machine can
 * settle over every recording. A field quietly dropped while parsing is exactly the fault that
 * reaches a reader as a figure that is too low and says so nowhere.
 */
export function composeProtocolMessage(parsed: ProtocolMessage): string {
    assert(parsed.parameters.length <= MAXIMUM_SEGMENTS, "a message stays inside its bound");
    const segments = [composeMessageSide(parsed.actor), composeMessageSide(parsed.target)];
    for (const parameter of parsed.parameters) {
        const value = parameter.value;
        segments.push(value === null ? parameter.key : `${parameter.key}=${value}`);
    }
    assert(
        segments.length === parsed.parameters.length + SIDE_SEGMENTS,
        "both ends are written once",
    );
    return segments.join(SEGMENT_SEPARATOR);
}
