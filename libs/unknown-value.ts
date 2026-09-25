/**
 * Reading a value nobody typed, one field at a time (`docs/design.md` §3). The keys are somebody
 * else's and the fields are ours: a failure names our field, never their key (N13).
 *
 * An absent field is `ok(null)`, which is a fact. A field of the wrong type is `err`. Only own
 * properties are read, so `constructor` or `toString` off the prototype is never an answer.
 */

import { assert } from "@std/assert/assert";
import { err, ok, type Result } from "./result.ts";
import type { VocabularyWord } from "./vocabulary.ts";

/** Read-only: a write into somebody else's object through this type does not compile. */
export interface UnknownRecord {
    readonly [key: string]: unknown;
}

/** Keys are theirs, fields are ours. */
export type FieldKeys<Field extends string> = { readonly [Name in Field]: string };

export const FIELD_TYPE = {
    number: "number",
    text: "text",
    statedText: "stated-text",
    record: "record",
    list: "list",
} as const;
export type FieldType = VocabularyWord<typeof FIELD_TYPE>;

export const FIELD_FAILURE = { wrongType: "field-wrong-type", tooLong: "field-too-long" } as const;
export type FieldFailure<Field extends string> =
    | { kind: typeof FIELD_FAILURE.wrongType; field: Field; expected: FieldType }
    | { kind: typeof FIELD_FAILURE.tooLong; field: Field; count: number; maximum: number };

/** `typeof` alone admits `null` and arrays here, and the answer must be read-only. */
export function isRecord(value: unknown): value is UnknownRecord {
    if (typeof value !== "object") return false;
    if (value === null) return false;
    return !Array.isArray(value);
}

/** A finite number. `typeof` first, because `Number.isFinite` does not narrow `unknown`. */
export function getNumberField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): Result<number | null, FieldFailure<Field>> {
    const value = getOwnValue(record, keys[field]);
    if (value === undefined) return ok(null);
    if (typeof value !== "number") {
        return err({ kind: FIELD_FAILURE.wrongType, field, expected: FIELD_TYPE.number });
    }
    if (!Number.isFinite(value)) {
        return err({ kind: FIELD_FAILURE.wrongType, field, expected: FIELD_TYPE.number });
    }
    return ok(value);
}

/** Text, empty text included: text saying nothing is text. */
export function getTextField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): Result<string | null, FieldFailure<Field>> {
    const value = getOwnValue(record, keys[field]);
    if (value === undefined) return ok(null);
    if (typeof value !== "string") {
        return err({ kind: FIELD_FAILURE.wrongType, field, expected: FIELD_TYPE.text });
    }
    return ok(value);
}

/** Text that says something. Empty text is the wrong type here, and is asked for by name. */
export function getStatedTextField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): Result<string | null, FieldFailure<Field>> {
    const text = getTextField(record, keys, field);
    if (!text.ok) {
        return err({ kind: FIELD_FAILURE.wrongType, field, expected: FIELD_TYPE.statedText });
    }
    if (text.value === null) return text;
    if (text.value.length === 0) {
        return err({ kind: FIELD_FAILURE.wrongType, field, expected: FIELD_TYPE.statedText });
    }
    return text;
}

export function getRecordField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): Result<UnknownRecord | null, FieldFailure<Field>> {
    const value = getOwnValue(record, keys[field]);
    if (value === undefined) return ok(null);
    if (!isRecord(value)) {
        return err({ kind: FIELD_FAILURE.wrongType, field, expected: FIELD_TYPE.record });
    }
    return ok(value);
}

/** A longer list is a failure, never a truncation. */
export function getListField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
    maximum: number,
): Result<readonly unknown[] | null, FieldFailure<Field>> {
    assert(Number.isSafeInteger(maximum), "a list is bounded by a whole count");
    assert(maximum >= 0, "of none or more");
    const value = getOwnValue(record, keys[field]);
    if (value === undefined) return ok(null);
    if (!Array.isArray(value)) {
        return err({ kind: FIELD_FAILURE.wrongType, field, expected: FIELD_TYPE.list });
    }
    if (value.length > maximum) {
        return err({ kind: FIELD_FAILURE.tooLong, field, count: value.length, maximum });
    }
    return ok(value);
}

/** `undefined` where the record does not hold the key itself, whatever its prototype holds. */
function getOwnValue(record: UnknownRecord, key: string): unknown {
    assert(key.length > 0, "a key read is a key somebody spelled");
    if (!Object.hasOwn(record, key)) return undefined;
    return record[key];
}
