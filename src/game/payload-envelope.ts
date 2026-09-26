/**
 * One call of the engine's `updateData`, read into the session's `PayloadRecord` (`docs/design.md`
 * §7). This runs in the game's stack: it is bounded by the message count, and it builds arrays and
 * records of its own, so nothing reads the game's object after it returns.
 *
 * Every bound on what the game sent is checked here, once, and refused as a failure; past this
 * file the same bounds are assertions (`AGENTS.md` E1).
 */

import { assert } from "@std/assert/assert";
import { parseInteger } from "#/libs/number-text.ts";
import {
    type FieldFailure,
    type FieldKeys,
    FieldWrongType,
    getListField,
    getNumberField,
    getRecordField,
    getTextField,
    isRecord,
    type UnknownRecord,
} from "#/libs/unknown-value.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import { MESSAGES_MAXIMUM } from "#/src/core/fight-decoder.ts";
import type { PayloadRecord, TurnStatement } from "#/src/core/fight-session.ts";
import { readWarriorEntries } from "./engine-warrior.ts";

/** Record fields read straight off one envelope key; `Pick` admits no name outside the record. */
export type EnvelopeField = keyof Pick<
    PayloadRecord,
    | "isInit"
    | "isEnd"
    | "messages"
    | "messagesStated"
    | "readerSide"
    | "isOnAuto"
    | "turnStatement"
    | "combatants"
>;

export class PayloadNotRecord extends Error {
    override readonly name = "PayloadNotRecord";
}

export class PayloadFieldMalformed extends Error {
    override readonly name = "PayloadFieldMalformed";
    readonly field: EnvelopeField;

    constructor(field: EnvelopeField, options?: ErrorOptions) {
        super(undefined, options);
        this.field = field;
    }
}

export class PayloadFieldTooLong extends Error {
    override readonly name = "PayloadFieldTooLong";
    readonly field: EnvelopeField;
    readonly count: number;
    readonly maximum: number;

    constructor(field: EnvelopeField, count: number, maximum: number, options?: ErrorOptions) {
        super(undefined, options);
        this.field = field;
        this.count = count;
        this.maximum = maximum;
    }
}

export class PayloadCombatantRepeated extends Error {
    override readonly name = "PayloadCombatantRepeated";
    readonly combatantId: number;

    constructor(combatantId: number) {
        super();
        this.combatantId = combatantId;
    }
}

export type EnvelopeFailure =
    | PayloadNotRecord
    | PayloadFieldMalformed
    | PayloadFieldTooLong
    | PayloadCombatantRepeated;

/** The only place the game's envelope keys are spelled; the compiler holds it complete. */
export const ENVELOPE_KEYS: FieldKeys<EnvelopeField> = {
    isInit: "init",
    isEnd: "endBattle",
    messages: "m",
    messagesStated: "mi",
    readerSide: "myteam",
    isOnAuto: "auto",
    turnStatement: "turns_warriors",
    combatants: "w",
};

/** Ten entries wide in all 1022 payloads of `captures/` stating a queue, 2026-09-02. */
const QUEUE_ENTRIES_MAXIMUM = 1024;

export function readPayloadEnvelope(payload: unknown): PayloadRecord | EnvelopeFailure {
    if (!isRecord(payload)) return new PayloadNotRecord();
    const messages = readPayloadEnvelopeMessages(payload);
    if (messages instanceof Error) return messages;
    const stated = getListField(payload, ENVELOPE_KEYS, "messagesStated", MESSAGES_MAXIMUM);
    if (stated instanceof Error) return readPayloadEnvelopeFailure(stated);
    const readerSide = readPayloadEnvelopeInteger(payload, "readerSide");
    if (readerSide instanceof Error) return readerSide;
    const auto = readPayloadEnvelopeInteger(payload, "isOnAuto");
    if (auto instanceof Error) return auto;
    const turnStatement = readPayloadEnvelopeTurn(payload);
    if (turnStatement instanceof Error) return turnStatement;
    const warriors = readPayloadEnvelopeWarriors(payload);
    if (warriors instanceof Error) return warriors;
    const reading = readWarriorEntries(warriors);
    const ids = new Set<number>();
    for (const combatant of reading.combatants) {
        if (ids.has(combatant.id)) return new PayloadCombatantRepeated(combatant.id);
        ids.add(combatant.id);
    }
    return {
        isInit: Object.hasOwn(payload, ENVELOPE_KEYS.isInit),
        isEnd: Object.hasOwn(payload, ENVELOPE_KEYS.isEnd),
        messages,
        messagesStated: stated === null ? null : stated.length,
        readerSide,
        isOnAuto: auto === null ? null : auto !== 0,
        turnStatement,
        combatants: reading.combatants,
        statusMasksByCombatantId: reading.statusMasksByCombatantId,
        chargeStatements: reading.chargeStatements,
    };
}

/**
 * The messages, copied. An empty one is passed over and so counts as lost against `mi`, as
 * `develop` reads it; anything but text is a list this reader cannot place a message in.
 */
function readPayloadEnvelopeMessages(payload: UnknownRecord): string[] | EnvelopeFailure {
    const listed = getListField(payload, ENVELOPE_KEYS, "messages", MESSAGES_MAXIMUM);
    if (listed instanceof Error) return readPayloadEnvelopeFailure(listed);
    const messages: string[] = [];
    for (const message of listed ?? []) {
        if (typeof message !== "string") return new PayloadFieldMalformed("messages");
        if (message.length > 0) messages.push(message);
    }
    assert(messages.length <= MESSAGES_MAXIMUM, "a payload's messages stay inside the bound");
    return messages;
}

/** Our field, never their key: the failure a field reader returned, in the envelope's terms. */
function readPayloadEnvelopeFailure(failure: FieldFailure<EnvelopeField>): EnvelopeFailure {
    if (failure instanceof FieldWrongType) {
        return new PayloadFieldMalformed(failure.field, { cause: failure });
    }
    const { field, count, maximum } = failure;
    assert(count > maximum, "a list refused for its length is past the bound");
    return new PayloadFieldTooLong(field, count, maximum, { cause: failure });
}

/**
 * A whole number stated as a number or as its text: the recordings state `"1"`, and the client
 * compares loosely, so a stricter reading would stop finding it the day the game sends the other.
 */
function readPayloadEnvelopeInteger(
    payload: UnknownRecord,
    field: "readerSide" | "isOnAuto",
): number | null | PayloadFieldMalformed {
    const asNumber = getNumberField(payload, ENVELOPE_KEYS, field);
    if (!(asNumber instanceof Error)) return asNumber;
    const asText = getTextField(payload, ENVELOPE_KEYS, field);
    if (asText instanceof Error) return new PayloadFieldMalformed(field, { cause: asText });
    assert(asText !== null, "a field of the wrong type for a number is present");
    const value = parseInteger(asText);
    if (value === null) return new PayloadFieldMalformed(field, { cause: asNumber });
    return value;
}

/**
 * The turn in progress: the queue's least ordinal, and whose it is. ⚠️ **Only its least entry is a
 * statement.** The rest are the client's forecast: over `captures/` (2026-09-08) the step
 * one ahead is wrong 11 times in 451, and the ninth 100 times in 277.
 */
function readPayloadEnvelopeTurn(payload: UnknownRecord): TurnStatement | null | EnvelopeFailure {
    const queue = getRecordField(payload, ENVELOPE_KEYS, "turnStatement");
    if (queue instanceof Error) return readPayloadEnvelopeFailure(queue);
    if (queue === null) return null;
    const ordinals = Object.keys(queue);
    if (ordinals.length > QUEUE_ENTRIES_MAXIMUM) {
        return new PayloadFieldTooLong("turnStatement", ordinals.length, QUEUE_ENTRIES_MAXIMUM);
    }
    let least: number | null = null;
    for (const stated of ordinals) {
        const ordinal = parseInteger(stated);
        if (ordinal === null) return new PayloadFieldMalformed("turnStatement");
        if (least === null) least = ordinal;
        else if (ordinal < least) least = ordinal;
    }
    if (least === null) return null;
    const combatantId = queue[`${least}`];
    if (typeof combatantId !== "number") return new PayloadFieldMalformed("turnStatement");
    return { ordinal: least, combatantId };
}

/**
 * The warrior entries, as a list. The client keys its warriors by id in every payload of
 * `captures/` carrying any; a list of them is the same people in order, and is read so.
 */
function readPayloadEnvelopeWarriors(payload: UnknownRecord): unknown[] | EnvelopeFailure {
    const keyed = getRecordField(payload, ENVELOPE_KEYS, "combatants");
    let entries: unknown[] = [];
    if (keyed instanceof Error) {
        const listed = getListField(payload, ENVELOPE_KEYS, "combatants", COMBATANTS_MAXIMUM);
        if (listed instanceof Error) return readPayloadEnvelopeFailure(listed);
        entries = [...(listed ?? [])];
    } else if (keyed !== null) {
        entries = Object.values(keyed);
    }
    if (entries.length > COMBATANTS_MAXIMUM) {
        return new PayloadFieldTooLong("combatants", entries.length, COMBATANTS_MAXIMUM);
    }
    return entries;
}
