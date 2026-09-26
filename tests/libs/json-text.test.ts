/**
 * Both directions of JSON, over the answers `null` stands apart from.
 *
 * `null` is a value JSON carries and `undefined` has no JSON text at all, so each pair below
 * states the case that works beside the case that does not, which one answer for both would hide.
 */

import {
    assertEquals,
    assertInstanceOf,
    assertNotInstanceOf,
    assertStrictEquals,
} from "@std/assert";
import * as errors from "#/libs/errors.ts";
import {
    encodeJson,
    JsonNothing,
    JsonUnreadable,
    JsonUnwritable,
    parseJson,
} from "#/libs/json-text.ts";

Deno.test("text that carried null read, and text that would not read, are told apart", () => {
    const carried = parseJson("null");
    assertNotInstanceOf(carried, Error, "text stating null is text that read");
    assertStrictEquals(carried, null, "and what it carried is null");

    const refused = parseJson("{oops");
    assertInstanceOf(refused, JsonUnreadable, "text that is not JSON did not read, and says so");
    assertInstanceOf(refused.cause, errors.Caught, "carrying what the reader threw");
    assertInstanceOf(refused.cause.cause, SyntaxError, "carrying what the reader threw");

    const empty = parseJson("");
    assertInstanceOf(empty, JsonUnreadable, "text saying nothing is not JSON either");
});

Deno.test("a reading answers the value it read, zero and false included", () => {
    assertStrictEquals(parseJson("0"), 0, "text stating zero read, and zero is a value");
    assertStrictEquals(parseJson("false"), false, "false is a value and not a refusal");
    assertStrictEquals(parseJson("1"), 1, "the neighbour of zero reads the same way");
});

Deno.test("a value with no JSON text and a writer that threw are told apart", () => {
    const nothing = encodeJson(undefined, 0);
    assertInstanceOf(nothing, JsonNothing, "a value with no JSON text says which of the two");

    const behaviour = encodeJson(() => 1, 0);
    assertInstanceOf(behaviour, JsonNothing, "a function has no JSON text either");

    assertStrictEquals(encodeJson(null, 0), "null", "while null is a value that writes");

    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    const refused = encodeJson(cycle, 0);
    assertInstanceOf(refused, JsonUnwritable, "a structure that closes on itself was refused");
    assertInstanceOf(refused.cause, errors.Caught, "carrying what the writer threw");
    assertInstanceOf(refused.cause.cause, TypeError, "carrying what the writer threw");

    const wide = encodeJson(1n, 0);
    assertInstanceOf(wide, JsonUnwritable, "a big integer has no JSON spelling: a refusal too");
});

Deno.test("a writing answers the text it wrote, empty text included", () => {
    assertStrictEquals(encodeJson("", 0), '""', "text saying nothing writes as two marks");
    assertStrictEquals(encodeJson(0, 0), "0", "and zero is a measurement, not a refusal");
});

Deno.test("indentation is written where a person will read it and not where nobody will", () => {
    const flat = encodeJson({ a: 1 }, 0);
    assertStrictEquals(flat, '{"a":1}', "on one line where only a reader will take it back");

    const spaced = encodeJson({ a: 1 }, 2);
    assertStrictEquals(spaced, '{\n  "a": 1\n}', "indented where a person will read it");

    const read = parseJson(spaced);
    assertNotInstanceOf(read, Error, "and what was written reads back");
    assertEquals(read, { a: 1 }, "as the value it was written from");
});
