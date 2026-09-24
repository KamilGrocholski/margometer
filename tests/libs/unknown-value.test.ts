/**
 * What counts as a shape worth reading, and one field of it read at a time.
 *
 * `typeof` answers `"object"` for a list and for nothing at all, and both would otherwise pass for
 * the keyed object every reader above this one expects. A field that is absent is a fact; a field
 * of the wrong type is a failure that names our field and the type it was read as.
 */

import { assertEquals } from "@std/assert";
import { err, ok } from "@/libs/result.ts";
import {
    FIELD_FAILURE,
    getListField,
    getNumberField,
    getRecordField,
    getStatedTextField,
    getTextField,
    isRecord,
} from "@/libs/unknown-value.ts";

const KEYS = {
    figure: "f",
    named: "n",
    nested: "r",
    listed: "l",
    inherited: "constructor",
    method: "toString",
} as const;

Deno.test("a record is keyed, so nothing and a list are not records", () => {
    assertEquals(isRecord({ m: [] }), true, "a keyed object is one");
    assertEquals(isRecord({}), true, "and so is a keyed object stating nothing");
    assertEquals(isRecord([]), false, "a list is read by its order, not by its names");
    assertEquals(isRecord(["0;0;txt=a"]), false, "however much it looks like a payload's cargo");
    assertEquals(isRecord(null), false, "and `typeof null` says object where nothing is there");
    assertEquals(isRecord("m"), false, "text is not a record either");
});

Deno.test("a number is read only where a number was stated", () => {
    const wrong = err(
        { kind: FIELD_FAILURE.wrongType, field: "figure", expected: "number" } as const,
    );
    assertEquals(getNumberField({ f: 0 }, KEYS, "figure"), ok(0), "zero is a reading");
    assertEquals(getNumberField({ f: -161518 }, KEYS, "figure"), ok(-161518), "and below it");
    assertEquals(getNumberField({}, KEYS, "figure"), ok(null), "absent is a fact, not a failure");
    assertEquals(getNumberField({ f: "745" }, KEYS, "figure"), wrong, "text is not a number");
    assertEquals(getNumberField({ f: Number.NaN }, KEYS, "figure"), wrong, "nor is NaN");
    const endless = { f: Number.POSITIVE_INFINITY };
    assertEquals(getNumberField(endless, KEYS, "figure"), wrong, "nor what has no end");
});

Deno.test("text is read wherever text was stated, saying something or not", () => {
    const wrong = err({ kind: FIELD_FAILURE.wrongType, field: "named", expected: "text" } as const);
    assertEquals(getTextField({ n: "Gracz 1" }, KEYS, "named"), ok("Gracz 1"), "text is text");
    assertEquals(getTextField({ n: "" }, KEYS, "named"), ok(""), "and empty text is text");
    assertEquals(getTextField({}, KEYS, "named"), ok(null), "absent is a fact");
    assertEquals(getTextField({ n: 745 }, KEYS, "named"), wrong, "a number is not text at all");
    assertEquals(getTextField({ n: null }, KEYS, "named"), wrong, "and neither is null");
});

Deno.test("whether text states anything is a second question, asked separately", () => {
    const wrong = err(
        { kind: FIELD_FAILURE.wrongType, field: "named", expected: "stated-text" } as const,
    );
    assertEquals(getStatedTextField({ n: "Gracz 1" }, KEYS, "named"), ok("Gracz 1"), "says it");
    assertEquals(getStatedTextField({ n: "" }, KEYS, "named"), wrong, "empty text states nothing");
    assertEquals(getStatedTextField({ n: " " }, KEYS, "named"), ok(" "), "a space is something");
    assertEquals(getStatedTextField({ n: 745 }, KEYS, "named"), wrong, "a number states no text");
    assertEquals(getStatedTextField({}, KEYS, "named"), ok(null), "and absent is a fact");
});

Deno.test("a record field is a record, and a list or nothing is not one", () => {
    const wrong = err(
        { kind: FIELD_FAILURE.wrongType, field: "nested", expected: "record" } as const,
    );
    assertEquals(getRecordField({ r: { a: 1 } }, KEYS, "nested"), ok({ a: 1 }), "a record");
    assertEquals(getRecordField({}, KEYS, "nested"), ok(null), "absent is a fact");
    assertEquals(getRecordField({ r: [] }, KEYS, "nested"), wrong, "a list is not a record");
    assertEquals(getRecordField({ r: null }, KEYS, "nested"), wrong, "nor is null");
});

Deno.test("a list is read up to its bound, and past it is too long rather than cut", () => {
    const wrong = err(
        { kind: FIELD_FAILURE.wrongType, field: "listed", expected: "list" } as const,
    );
    assertEquals(getListField({ l: [] }, KEYS, "listed", 0), ok([]), "an empty list at none");
    assertEquals(getListField({ l: [1] }, KEYS, "listed", 1), ok([1]), "one at a bound of one");
    const past = err(
        { kind: FIELD_FAILURE.tooLong, field: "listed", count: 1, maximum: 0 } as const,
    );
    assertEquals(getListField({ l: [1] }, KEYS, "listed", 0), past, "one past a bound of none");
    const twoPast = err(
        { kind: FIELD_FAILURE.tooLong, field: "listed", count: 2, maximum: 1 } as const,
    );
    assertEquals(getListField({ l: [1, 2] }, KEYS, "listed", 1), twoPast, "and one past one");
    assertEquals(getListField({}, KEYS, "listed", 1), ok(null), "absent is a fact");
    assertEquals(getListField({ l: { 0: 1 } }, KEYS, "listed", 1), wrong, "a record is no list");
});

Deno.test("a field answers only what the record itself holds, however a key is spelled", () => {
    assertEquals(getRecordField({}, KEYS, "inherited"), ok(null), "not the language's constructor");
    assertEquals(getRecordField({}, KEYS, "method"), ok(null), "nor its method");
    assertEquals(getNumberField({}, KEYS, "method"), ok(null), "whichever reader asks");
    const own = { constructor: 5 };
    assertEquals(getNumberField(own, KEYS, "inherited"), ok(5), "and an own one is read");
});
