/**
 * One call of the engine's `updateData`, read into the session's `PayloadRecord` (`docs/design.md`
 * §7). This runs in the game's stack: it is bounded by the message count, and it builds arrays and
 * records of its own, so nothing reads the game's object after it returns.
 *
 * Every bound one payload can show is checked here, once, and refused as a failure; the bound on
 * everybody a fight names is the session's, which alone sees every payload. Past those two the same
 * bounds are assertions (`AGENTS.md` E1).
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
    getStatedTextField,
    getTextField,
    isRecord,
    type UnknownRecord,
} from "#/libs/unknown-value.ts";
import type { ChargedSkillStatement } from "#/src/core/charged-skill.ts";
import { type Combatant, COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import { MESSAGES_MAXIMUM } from "#/src/core/fight-decoder.ts";
import type { PayloadRecord, TurnStatement } from "#/src/core/fight-session.ts";

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

type PayloadWarriorField =
    | "id"
    | "name"
    | "side"
    | "profession"
    | "level"
    | "health"
    | "statuses"
    | "charge";

type HealthField = "maximum" | "now";

type ChargeField = "name" | "turnsElapsed" | "turnsStated";

export interface PayloadWarriorEntries {
    combatants: Combatant[];
    statusMasksByCombatantId: Map<number, number>;
    chargeStatements: ChargedSkillStatement[];
}

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
/** The client's own keys for one warrior entry, spelled here and nowhere else (N13). */
export const WARRIOR_FIELDS: FieldKeys<PayloadWarriorField> = {
    id: "id",
    name: "name",
    side: "team",
    profession: "prof",
    level: "lvl",
    health: "hp",
    statuses: "buffs",
    charge: "super_cast",
};
export const HEALTH_FIELDS: FieldKeys<HealthField> = { maximum: "max", now: "cur" };
export const CHARGE_FIELDS: FieldKeys<ChargeField> = {
    name: "name",
    turnsElapsed: "turn",
    turnsStated: "total_turns",
};

/** The mask a fallen combatant is read at, which clears whatever they were holding. */
const NOTHING_CARRIED = 0;

export function readPayloadEnvelope(payload: unknown): PayloadRecord | EnvelopeFailure {
    if (!isRecord(payload)) return new PayloadNotRecord();
    const messages: string[] = [];
    // Copy the messages: an empty one is passed over, and so counts as lost against `mi`.
    {
        // `develop` reads it so, and anything but text is a list no message can be placed in.
        const listed = getListField(payload, ENVELOPE_KEYS, "messages", MESSAGES_MAXIMUM);
        if (listed instanceof Error) return createEnvelopeFailure(listed);
        for (const message of listed ?? []) {
            if (typeof message !== "string") return new PayloadFieldMalformed("messages");
            if (message.length > 0) messages.push(message);
        }
        assert(messages.length <= MESSAGES_MAXIMUM, "a payload's messages stay inside the bound");
    }
    const messagesStated = getListField(payload, ENVELOPE_KEYS, "messagesStated", MESSAGES_MAXIMUM);
    if (messagesStated instanceof Error) return createEnvelopeFailure(messagesStated);
    const readerSide = readPayloadEnvelopeInteger(payload, "readerSide");
    if (readerSide instanceof Error) return readerSide;
    const onAutoStated = readPayloadEnvelopeInteger(payload, "isOnAuto");
    if (onAutoStated instanceof Error) return onAutoStated;
    let turnStatement: TurnStatement | null;
    // Read the turn in progress: the queue's least ordinal, and whose it is.
    readTurn: {
        // ⚠️ **Only its least entry is a statement.** The rest are the client's forecast: over
        // `captures/` (2026-09-08) the step one ahead is wrong 11 times in 451, and the ninth 100
        // times in 277.
        const queue = getRecordField(payload, ENVELOPE_KEYS, "turnStatement");
        if (queue instanceof Error) return createEnvelopeFailure(queue);
        if (queue === null) {
            turnStatement = null;
            break readTurn;
        }
        const ordinals = Object.keys(queue);
        if (ordinals.length > QUEUE_ENTRIES_MAXIMUM) {
            return new PayloadFieldTooLong("turnStatement", ordinals.length, QUEUE_ENTRIES_MAXIMUM);
        }
        // The least ordinal is looked up under the key it was read from: `07` reads as 7, and
        // the queue holds it as `07`.
        let least: { ordinal: number; key: string } | null = null;
        for (const ordinalText of ordinals) {
            const ordinal = parseInteger(ordinalText);
            if (ordinal === null) return new PayloadFieldMalformed("turnStatement");
            if (least === null) least = { ordinal, key: ordinalText };
            else if (ordinal < least.ordinal) least = { ordinal, key: ordinalText };
        }
        if (least === null) {
            turnStatement = null;
            break readTurn;
        }
        const combatantId = queue[least.key];
        if (typeof combatantId !== "number") return new PayloadFieldMalformed("turnStatement");
        if (!Number.isSafeInteger(combatantId)) return new PayloadFieldMalformed("turnStatement");
        turnStatement = { ordinal: least.ordinal, combatantId };
    }
    let warriors: unknown[];
    // Read the warrior entries, as a list.
    {
        // The client keys its warriors by id in every payload of `captures/` carrying any, 1422
        // over 37 recordings on 2026-10-06; a list of them is the same people in order, and is
        // read so.
        const keyed = getRecordField(payload, ENVELOPE_KEYS, "combatants");
        if (keyed instanceof Error) {
            const listed = getListField(payload, ENVELOPE_KEYS, "combatants", COMBATANTS_MAXIMUM);
            if (listed instanceof Error) return createEnvelopeFailure(listed);
            warriors = [...(listed ?? [])];
        } else if (keyed !== null) {
            warriors = Object.values(keyed);
        } else {
            warriors = [];
        }
        if (warriors.length > COMBATANTS_MAXIMUM) {
            return new PayloadFieldTooLong("combatants", warriors.length, COMBATANTS_MAXIMUM);
        }
    }
    const warriorEntries = readPayloadWarriorEntries(warriors);
    const ids = new Set<number>();
    for (const combatant of warriorEntries.combatants) {
        if (ids.has(combatant.id)) return new PayloadCombatantRepeated(combatant.id);
        ids.add(combatant.id);
    }
    return {
        isInit: isPayloadOpening(payload),
        isEnd: Object.hasOwn(payload, ENVELOPE_KEYS.isEnd),
        messages,
        messagesStated: messagesStated === null ? null : messagesStated.length,
        readerSide,
        isOnAuto: onAutoStated === null ? null : onAutoStated !== 0,
        turnStatement,
        combatants: warriorEntries.combatants,
        statusMasksByCombatantId: warriorEntries.statusMasksByCombatantId,
        chargeStatements: warriorEntries.chargeStatements,
    };
}

/** Our field, never their key: the failure a field reader returned, in the envelope's terms. */
function createEnvelopeFailure(failure: FieldFailure<EnvelopeField>): EnvelopeFailure {
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
 * A number with a fraction is neither.
 */
function readPayloadEnvelopeInteger(
    payload: UnknownRecord,
    field: "readerSide" | "isOnAuto",
): number | null | PayloadFieldMalformed {
    const asNumber = getNumberField(payload, ENVELOPE_KEYS, field);
    if (!(asNumber instanceof Error)) {
        if (asNumber === null) return null;
        if (!Number.isSafeInteger(asNumber)) return new PayloadFieldMalformed(field);
        return asNumber;
    }
    const asText = getTextField(payload, ENVELOPE_KEYS, field);
    if (asText instanceof Error) return new PayloadFieldMalformed(field, { cause: asText });
    assert(asText !== null, "a field of the wrong type for a number is present");
    const integer = parseInteger(asText);
    if (integer === null) return new PayloadFieldMalformed(field, { cause: asNumber });
    return integer;
}

/**
 * The entries of one payload, read once each, into the roster's shape with the mask and the charge
 * each carries. A payload restates only what moved, so an entry is often partial: one missing what
 * the roster needs is passed over, never refused, because that is how the game writes.
 */
export function readPayloadWarriorEntries(entries: readonly unknown[]): PayloadWarriorEntries {
    assert(
        entries.length <= COMBATANTS_MAXIMUM,
        "a payload's warriors are bounded by the envelope",
    );
    const warriorEntries: PayloadWarriorEntries = {
        combatants: [],
        statusMasksByCombatantId: new Map(),
        chargeStatements: [],
    };
    for (const warriorEntry of entries) {
        if (!isRecord(warriorEntry)) continue;
        const id = getNumberField(warriorEntry, WARRIOR_FIELDS, "id");
        if (id instanceof Error) continue;
        if (id === null) continue;
        // An id with a fraction names nobody: past here every id is held as a whole one.
        if (!Number.isSafeInteger(id)) continue;
        let combatant: Combatant | null;
        // Read a combatant stated in full: an id, a name and a side. The rest may be absent.
        readCombatant: {
            const name = getStatedTextField(warriorEntry, WARRIOR_FIELDS, "name");
            if (name instanceof Error) {
                combatant = null;
                break readCombatant;
            }
            if (name === null) {
                combatant = null;
                break readCombatant;
            }
            const side = getNumberField(warriorEntry, WARRIOR_FIELDS, "side");
            if (side instanceof Error) {
                combatant = null;
                break readCombatant;
            }
            if (side === null) {
                combatant = null;
                break readCombatant;
            }
            if (!Number.isSafeInteger(side)) {
                combatant = null;
                break readCombatant;
            }
            const profession = getStatedTextField(warriorEntry, WARRIOR_FIELDS, "profession");
            const level = getNumberField(warriorEntry, WARRIOR_FIELDS, "level");
            combatant = {
                id,
                name,
                side,
                profession: profession instanceof Error ? null : profession,
                level: level instanceof Error ? null : level,
                healthMaximum: readPayloadWarriorHealth(warriorEntry, "maximum"),
            };
            assert(combatant.name.length > 0, "a name that was read says something");
        }
        if (combatant !== null) warriorEntries.combatants.push(combatant);
        let mask: number | null;
        // Read the one integer the payload restates for a combatant every time, by bit position.
        readMask: {
            // An entry stating no mask is absent rather than clear. ⚠️ **A combatant who has fallen
            // carries nothing, whatever their mask still says**: 44 entries of 113 at zero health
            // carry a lit mask over `captures/` (2026-09-22), and the client removes a fighter's
            // status icons at exactly that point, once their health reads zero (production build
            // `Bb28FQty`).
            const now = readPayloadWarriorHealth(warriorEntry, "now");
            if (now !== null) {
                if (now <= 0) {
                    mask = NOTHING_CARRIED;
                    break readMask;
                }
            }
            const stated = getNumberField(warriorEntry, WARRIOR_FIELDS, "statuses");
            if (stated instanceof Error) {
                mask = null;
                break readMask;
            }
            if (stated === null) {
                mask = null;
                break readMask;
            }
            if (stated < 0) {
                mask = null;
                break readMask;
            }
            if (!Number.isSafeInteger(stated)) {
                mask = null;
                break readMask;
            }
            mask = stated;
        }
        if (mask !== null) warriorEntries.statusMasksByCombatantId.set(id, mask);
        let charge: ChargedSkillStatement["charge"];
        // Read the charge the entry carries, or null where it states none.
        readCharge: {
            // None is how the game says one has ended (`super_cast` is cleared the moment the blow
            // lands or is taken away, build `Cl9U89Zr`). Half of the pair of figures is nothing
            // worth drawing, so a partial charge reads as none.
            const stated = getRecordField(warriorEntry, WARRIOR_FIELDS, "charge");
            if (stated instanceof Error) {
                charge = null;
                break readCharge;
            }
            if (stated === null) {
                charge = null;
                break readCharge;
            }
            const skillName = getStatedTextField(stated, CHARGE_FIELDS, "name");
            const turnsElapsed = getNumberField(stated, CHARGE_FIELDS, "turnsElapsed");
            const turnsStated = getNumberField(stated, CHARGE_FIELDS, "turnsStated");
            if (skillName instanceof Error) {
                charge = null;
                break readCharge;
            }
            if (turnsElapsed instanceof Error) {
                charge = null;
                break readCharge;
            }
            if (turnsStated instanceof Error) {
                charge = null;
                break readCharge;
            }
            if (skillName === null) {
                charge = null;
                break readCharge;
            }
            if (turnsElapsed === null) {
                charge = null;
                break readCharge;
            }
            if (turnsStated === null) {
                charge = null;
                break readCharge;
            }
            if (turnsElapsed < 0) {
                charge = null;
                break readCharge;
            }
            if (turnsStated < turnsElapsed) {
                charge = null;
                break readCharge;
            }
            charge = { skillName, turnsElapsed, turnsStated };
        }
        warriorEntries.chargeStatements.push({ combatantId: id, charge });
    }
    assert(warriorEntries.combatants.length <= entries.length, "a combatant is one entry");
    return warriorEntries;
}

/**
 * A figure of the entry's health, or null where it says nothing about it. A pool of nothing, below
 * it or with a fraction is one no share can be read against: the same null a pool nobody stated is.
 */
function readPayloadWarriorHealth(warriorEntry: UnknownRecord, field: HealthField): number | null {
    const health = getRecordField(warriorEntry, WARRIOR_FIELDS, "health");
    if (health instanceof Error) return null;
    if (health === null) return null;
    const figure = getNumberField(health, HEALTH_FIELDS, field);
    if (figure instanceof Error) return null;
    if (figure === null) return null;
    if (field === "maximum") {
        if (figure <= 0) return null;
        if (!Number.isSafeInteger(figure)) return null;
    }
    return figure;
}

/**
 * Whether the game opened a fight with this call, read on its own: a call the envelope refuses still
 * ends the fight before it.
 */
export function isPayloadOpening(payload: unknown): boolean {
    if (!isRecord(payload)) return false;
    return Object.hasOwn(payload, ENVELOPE_KEYS.isInit);
}
