/**
 * Reading a value nobody typed, one field at a time (`docs/design.md` §3). The keys are somebody
 * else's and the fields are ours: a failure names our field, never their key (N13).
 *
 * An absent field is `null`, which is a fact. A field of the wrong type is a failure. Only own
 * properties are read, so `constructor` or `toString` off the prototype is never an answer.
 */

import { assert } from "@std/assert/assert";
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

export class FieldWrongType<Field extends string> extends Error {
    override readonly name = "FieldWrongType";
    readonly field: Field;
    readonly expected: FieldType;

    constructor(field: Field, expected: FieldType) {
        super();
        this.field = field;
        this.expected = expected;
    }
}

export class FieldTooLong<Field extends string> extends Error {
    override readonly name = "FieldTooLong";
    readonly field: Field;
    readonly count: number;
    readonly maximum: number;

    constructor(field: Field, count: number, maximum: number) {
        super();
        this.field = field;
        this.count = count;
        this.maximum = maximum;
    }
}

export type FieldFailure<Field extends string> = FieldWrongType<Field> | FieldTooLong<Field>;

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
): number | null | FieldWrongType<Field> {
    const value = getOwnValue(record, keys[field]);
    if (value === undefined) return null;
    if (typeof value !== "number") {
        return new FieldWrongType(field, FIELD_TYPE.number);
    }
    if (!Number.isFinite(value)) {
        return new FieldWrongType(field, FIELD_TYPE.number);
    }
    return value;
}

/** `undefined` where the record does not hold the key itself, whatever its prototype holds. */
function getOwnValue(record: UnknownRecord, key: string): unknown {
    assert(key.length > 0, "a key read is a key somebody spelled");
    if (!Object.hasOwn(record, key)) return undefined;
    return record[key];
}

/** Text, empty text included: text saying nothing is text. */
export function getTextField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): string | null | FieldWrongType<Field> {
    const value = getOwnValue(record, keys[field]);
    if (value === undefined) return null;
    if (typeof value !== "string") {
        return new FieldWrongType(field, FIELD_TYPE.text);
    }
    return value;
}

/** Text that says something. Empty text is the wrong type here, and is asked for by name. */
export function getStatedTextField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): string | null | FieldWrongType<Field> {
    const text = getTextField(record, keys, field);
    if (text instanceof Error) return new FieldWrongType(field, FIELD_TYPE.statedText);
    if (text === null) return text;
    if (text.length === 0) {
        return new FieldWrongType(field, FIELD_TYPE.statedText);
    }
    return text;
}

export function getRecordField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): UnknownRecord | null | FieldWrongType<Field> {
    const value = getOwnValue(record, keys[field]);
    if (value === undefined) return null;
    if (!isRecord(value)) {
        return new FieldWrongType(field, FIELD_TYPE.record);
    }
    return value;
}

/** A longer list is a failure, never a truncation. */
export function getListField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
    maximum: number,
): readonly unknown[] | null | FieldFailure<Field> {
    assert(Number.isSafeInteger(maximum), "a list is bounded by a whole count");
    assert(maximum >= 0, "of none or more");
    const value = getOwnValue(record, keys[field]);
    if (value === undefined) return null;
    if (!Array.isArray(value)) {
        return new FieldWrongType(field, FIELD_TYPE.list);
    }
    if (value.length > maximum) {
        return new FieldTooLong(field, value.length, maximum);
    }
    return value;
}
