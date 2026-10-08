/**
 * Both directions of JSON, over the answers `null` stands apart from.
 *
 * `null` is a value JSON carries and `undefined` has no JSON text at all, so each pair below
 * states the case that works beside the case that does not, which one answer for both would hide.
 */

import {
    assertEquals,
    assertInstanceOf,
    AssertionError,
    assertNotInstanceOf,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { encodeJson, JsonUnreadable, JsonUnwritable, parseJson } from "#/libs/json-text.ts";

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

Deno.test("a value with no JSON text and a writer that threw are both refusals", () => {
    const nothing = encodeJson(undefined, 0);
    assertInstanceOf(nothing, JsonUnwritable, "a value with no JSON text is not written");
    assertStrictEquals(nothing.cause, null, "and nothing was thrown for it");

    const behaviour = encodeJson(() => 1, 0);
    assertInstanceOf(behaviour, JsonUnwritable, "a function has no JSON text either");
    assertStrictEquals(behaviour.cause, null, "nor was anything thrown for it");

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
    assertThrows(() => encodeJson({ a: 1 }, -1), AssertionError, "of none or more");

    const spaced = encodeJson({ a: 1 }, 2);
    assertStrictEquals(spaced, '{\n  "a": 1\n}', "indented where a person will read it");

    const parsed = parseJson(spaced);
    assertNotInstanceOf(parsed, Error, "and what was written reads back");
    assertEquals(parsed, { a: 1 }, "as the value it was written from");
});

Deno.test("text is indented as far as the platform indents it, and no further", () => {
    assertStrictEquals(encodeJson([1], 10), `[\n${" ".repeat(10)}1\n]`, "ten spaces are written");
    assertThrows(() => encodeJson([1], 11), AssertionError, "and no more than the platform writes");
});
