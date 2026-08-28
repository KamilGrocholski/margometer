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
/** Every percentage in `captures/` is written to two places, 18215 of them, 2026-08-28. */
const HEALTH_PERCENT_PLACES = 2;
/** The longest message in `captures/` carries 42 segments, 2026-08-28. */
const MAXIMUM_SEGMENTS = 512;

function isDigitRun(text: string): boolean {
    if (text.length === 0) return false;
    for (const character of text) {
        if (character < "0") return false;
        if (character > "9") return false;
    }
    assert(text.length > 0, "a digit run holds at least one digit");
    return true;
}

function isIntegerText(text: string): boolean {
    const digits = text.startsWith("-") ? text.slice(1) : text;
    assert(digits.length <= text.length, "dropping a sign never grows the text");
    assert(!digits.startsWith("-"), "a sign is dropped once");
    return isDigitRun(digits);
}

/** `70.07` — a whole part, a point, and exactly the two places the protocol writes. */
function isHealthPercentText(text: string): boolean {
    const point = text.indexOf(".");
    if (point === -1) return false;
    const fraction = text.slice(point + 1);
    if (fraction.length !== HEALTH_PERCENT_PLACES) return false;
    if (!isDigitRun(text.slice(0, point))) return false;
    assert(point < text.length, "a point sits inside the text it was found in");
    assert(fraction.length === HEALTH_PERCENT_PLACES, "the fraction is the stated width");
    return isDigitRun(fraction);
}

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
        throw new MargoMeterError("ProtocolMessageFormat", `side "${segment}" in "${whole}"`);
    }
    const combatantId = Number(idText);
    if (!Number.isSafeInteger(combatantId)) {
        throw new MargoMeterError("ProtocolMessageFormat", `id "${idText}" in "${whole}"`);
    }
    assert(Number.isFinite(combatantId), "an id read from digits is a number");
    if (separator === -1) return { combatantId, healthPercent: null };
    const percentText = segment.slice(separator + 1);
    if (!isHealthPercentText(percentText)) {
        throw new MargoMeterError("ProtocolMessageFormat", `health "${segment}" in "${whole}"`);
    }
    const healthPercent = Number(percentText);
    assert(Number.isFinite(healthPercent), "a percentage read from digits is a number");
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
    if (segments.length < 2) {
        throw new MargoMeterError("ProtocolMessageFormat", `one segment in "${message}"`);
    }
    assert(segments.length <= MAXIMUM_SEGMENTS, "a message stays inside its stated bound");
    const [actorSegment, targetSegment] = segments;
    assert(actorSegment !== undefined, "a message split in two has a first segment");
    assert(targetSegment !== undefined, "a message split in two has a second segment");
    const parameters = segments.slice(2).map(parseMessageParameter);
    assert(parameters.length === segments.length - 2, "every segment past the ends is a parameter");
    return {
        actor: parseMessageSide(actorSegment, message),
        target: parseMessageSide(targetSegment, message),
        parameters,
    };
}

function composeMessageSide(side: MessageSide | null): string {
    if (side === null) return NO_COMBATANT;
    assert(Number.isSafeInteger(side.combatantId), "an id written back is an id that was read");
    const idText = String(side.combatantId);
    if (side.healthPercent === null) return idText;
    assert(side.healthPercent >= 0, "a health percentage is never below nothing");
    return `${idText}${VALUE_SEPARATOR}${side.healthPercent.toFixed(HEALTH_PERCENT_PLACES)}`;
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
    assert(segments.length === parsed.parameters.length + 2, "both ends are written once");
    return segments.join(SEGMENT_SEPARATOR);
}
