/**
 * One call of the engine's `updateData`, read into the session's `PayloadRecord` (`docs/design.md`
 * §7). This runs in the game's stack: it is bounded by the message count, and it builds arrays and
 * records of its own, so nothing reads the game's object after it returns.
 *
 * Every bound on what the game sent is checked here, once, and refused as a `Result`; past this
 * file the same bounds are assertions (`AGENTS.md` E1).
 */

import { assert } from "@std/assert/assert";
import { parseInteger } from "#/libs/number-text.ts";
import { err, ok, type Result } from "#/libs/result.ts";
import {
    FIELD_FAILURE,
    type FieldFailure,
    type FieldKeys,
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

export const ENVELOPE_FAILURE = {
    payloadNotRecord: "payload-not-record",
    payloadFieldMalformed: "payload-field-malformed",
    payloadFieldTooLong: "payload-field-too-long",
    payloadCombatantRepeated: "payload-combatant-repeated",
} as const;

export type EnvelopeFailure =
    | { kind: typeof ENVELOPE_FAILURE.payloadNotRecord }
    | { kind: typeof ENVELOPE_FAILURE.payloadFieldMalformed; field: EnvelopeField }
    | {
        kind: typeof ENVELOPE_FAILURE.payloadFieldTooLong;
        field: EnvelopeField;
        count: number;
        maximum: number;
    }
    | { kind: typeof ENVELOPE_FAILURE.payloadCombatantRepeated; combatantId: number };

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

export function readPayloadEnvelope(payload: unknown): Result<PayloadRecord, EnvelopeFailure> {
    if (!isRecord(payload)) return err({ kind: ENVELOPE_FAILURE.payloadNotRecord });
    const messages = readPayloadEnvelopeMessages(payload);
    if (!messages.ok) return messages;
    const stated = getListField(payload, ENVELOPE_KEYS, "messagesStated", MESSAGES_MAXIMUM);
    if (!stated.ok) return err(readPayloadEnvelopeFailure(stated.error));
    const readerSide = readPayloadEnvelopeInteger(payload, "readerSide");
    if (!readerSide.ok) return readerSide;
    const auto = readPayloadEnvelopeInteger(payload, "isOnAuto");
    if (!auto.ok) return auto;
    const turnStatement = readPayloadEnvelopeTurn(payload);
    if (!turnStatement.ok) return turnStatement;
    const warriors = readPayloadEnvelopeWarriors(payload);
    if (!warriors.ok) return warriors;
    const reading = readWarriorEntries(warriors.value);
    const ids = new Set<number>();
    for (const combatant of reading.combatants) {
        if (ids.has(combatant.id)) {
            return err({
                kind: ENVELOPE_FAILURE.payloadCombatantRepeated,
                combatantId: combatant.id,
            });
        }
        ids.add(combatant.id);
    }
    return ok({
        isInit: Object.hasOwn(payload, ENVELOPE_KEYS.isInit),
        isEnd: Object.hasOwn(payload, ENVELOPE_KEYS.isEnd),
        messages: messages.value,
        messagesStated: stated.value === null ? null : stated.value.length,
        readerSide: readerSide.value,
        isOnAuto: auto.value === null ? null : auto.value !== 0,
        turnStatement: turnStatement.value,
        combatants: reading.combatants,
        statusMasksByCombatantId: reading.statusMasksByCombatantId,
        chargeStatements: reading.chargeStatements,
    });
}

/**
 * The messages, copied. An empty one is passed over and so counts as lost against `mi`, as
 * `develop` reads it; anything but text is a list this reader cannot place a message in.
 */
function readPayloadEnvelopeMessages(payload: UnknownRecord): Result<string[], EnvelopeFailure> {
    const listed = getListField(payload, ENVELOPE_KEYS, "messages", MESSAGES_MAXIMUM);
    if (!listed.ok) return err(readPayloadEnvelopeFailure(listed.error));
    const messages: string[] = [];
    for (const message of listed.value ?? []) {
        if (typeof message !== "string") {
            return err({ kind: ENVELOPE_FAILURE.payloadFieldMalformed, field: "messages" });
        }
        if (message.length > 0) messages.push(message);
    }
    assert(messages.length <= MESSAGES_MAXIMUM, "a payload's messages stay inside the bound");
    return ok(messages);
}

/** Our field, never their key: the failure a field reader returned, in the envelope's terms. */
function readPayloadEnvelopeFailure(failure: FieldFailure<EnvelopeField>): EnvelopeFailure {
    if (failure.kind === FIELD_FAILURE.wrongType) {
        return { kind: ENVELOPE_FAILURE.payloadFieldMalformed, field: failure.field };
    }
    const { field, count, maximum } = failure;
    assert(count > maximum, "a list refused for its length is past the bound");
    return { kind: ENVELOPE_FAILURE.payloadFieldTooLong, field, count, maximum };
}

/**
 * A whole number stated as a number or as its text: the recordings state `"1"`, and the client
 * compares loosely, so a stricter reading would stop finding it the day the game sends the other.
 */
function readPayloadEnvelopeInteger(
    payload: UnknownRecord,
    field: "readerSide" | "isOnAuto",
): Result<number | null, EnvelopeFailure> {
    const asNumber = getNumberField(payload, ENVELOPE_KEYS, field);
    if (asNumber.ok) return asNumber;
    const asText = getTextField(payload, ENVELOPE_KEYS, field);
    if (!asText.ok) return err({ kind: ENVELOPE_FAILURE.payloadFieldMalformed, field });
    assert(asText.value !== null, "a field of the wrong type for a number is present");
    const value = parseInteger(asText.value);
    if (value === null) return err({ kind: ENVELOPE_FAILURE.payloadFieldMalformed, field });
    return ok(value);
}

/**
 * The turn in progress: the queue's least ordinal, and whose it is. ⚠️ **Only its least entry is a
 * statement.** The rest are the client's forecast: over `captures/` (2026-09-08) the step
 * one ahead is wrong 11 times in 451, and the ninth 100 times in 277.
 */
function readPayloadEnvelopeTurn(
    payload: UnknownRecord,
): Result<TurnStatement | null, EnvelopeFailure> {
    const queue = getRecordField(payload, ENVELOPE_KEYS, "turnStatement");
    if (!queue.ok) return err(readPayloadEnvelopeFailure(queue.error));
    if (queue.value === null) return ok(null);
    const ordinals = Object.keys(queue.value);
    if (ordinals.length > QUEUE_ENTRIES_MAXIMUM) {
        const count = ordinals.length;
        const maximum = QUEUE_ENTRIES_MAXIMUM;
        return err({
            kind: ENVELOPE_FAILURE.payloadFieldTooLong,
            field: "turnStatement",
            count,
            maximum,
        });
    }
    let least: number | null = null;
    for (const stated of ordinals) {
        const ordinal = parseInteger(stated);
        if (ordinal === null) {
            return err({ kind: ENVELOPE_FAILURE.payloadFieldMalformed, field: "turnStatement" });
        }
        if (least === null) least = ordinal;
        else if (ordinal < least) least = ordinal;
    }
    if (least === null) return ok(null);
    const combatantId = queue.value[`${least}`];
    if (typeof combatantId !== "number") {
        return err({ kind: ENVELOPE_FAILURE.payloadFieldMalformed, field: "turnStatement" });
    }
    return ok({ ordinal: least, combatantId });
}

/**
 * The warrior entries, as a list. The client keys its warriors by id in every payload of
 * `captures/` carrying any; a list of them is the same people in order, and is read so.
 */
function readPayloadEnvelopeWarriors(payload: UnknownRecord): Result<unknown[], EnvelopeFailure> {
    const keyed = getRecordField(payload, ENVELOPE_KEYS, "combatants");
    let entries: unknown[] = [];
    if (keyed.ok) {
        if (keyed.value !== null) entries = Object.values(keyed.value);
    } else {
        const listed = getListField(payload, ENVELOPE_KEYS, "combatants", COMBATANTS_MAXIMUM);
        if (!listed.ok) return err(readPayloadEnvelopeFailure(listed.error));
        entries = [...(listed.value ?? [])];
    }
    if (entries.length > COMBATANTS_MAXIMUM) {
        const count = entries.length;
        const maximum = COMBATANTS_MAXIMUM;
        return err({
            kind: ENVELOPE_FAILURE.payloadFieldTooLong,
            field: "combatants",
            count,
            maximum,
        });
    }
    return ok(entries);
}
