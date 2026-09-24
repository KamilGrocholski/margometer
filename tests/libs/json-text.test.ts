/**
 * Both directions of JSON, over the answers `null` stands apart from.
 *
 * `null` is a value JSON carries and `undefined` has no JSON text at all, so each pair below
 * states the case that works beside the case that does not, which one answer for both would hide.
 */

import { assert, assertEquals, assertInstanceOf, assertStrictEquals } from "@std/assert";
import { encodeJson, JSON_FAILURE, parseJson } from "@/libs/json-text.ts";

Deno.test("text that carried null read, and text that would not read, are told apart", () => {
    const carried = parseJson("null");
    assert(carried.ok, "text stating null is text that read");
    assertStrictEquals(carried.value, null, "and what it carried is null");

    const refused = parseJson("{oops");
    assert(!refused.ok, "text that is not JSON did not read");
    assertStrictEquals(refused.error.kind, JSON_FAILURE.unreadable, "and says so, not null");
    if (refused.error.kind !== JSON_FAILURE.unreadable) return;
    assertInstanceOf(refused.error.cause, SyntaxError, "carrying what the reader threw");

    const empty = parseJson("");
    assert(!empty.ok, "text saying nothing is not JSON either");
    assertStrictEquals(empty.error.kind, JSON_FAILURE.unreadable, "and is refused the same way");
});

Deno.test("a reading answers the value it read, zero and false included", () => {
    const zero = parseJson("0");
    assert(zero.ok, "text stating zero read");
    assertStrictEquals(zero.value, 0, "and zero is a value like any other");

    const no = parseJson("false");
    assert(no.ok, "and so did text stating false");
    assertStrictEquals(no.value, false, "which is a value and not a refusal");

    const one = parseJson("1");
    assert(one.ok, "the neighbour of zero reads the same way");
    assertStrictEquals(one.value, 1, "and states itself");
});

Deno.test("a value with no JSON text and a writer that threw are told apart", () => {
    const nothing = encodeJson(undefined, 0);
    assert(!nothing.ok, "a value with no JSON text of its own was not written");
    assertEquals(nothing.error, { kind: JSON_FAILURE.nothing }, "and says which of the two");

    const behaviour = encodeJson(() => 1, 0);
    assert(!behaviour.ok, "a function has no JSON text either");
    assertEquals(behaviour.error, { kind: JSON_FAILURE.nothing }, "and is the same answer");

    const written = encodeJson(null, 0);
    assert(written.ok, "while null is a value that writes");
    assertStrictEquals(written.value, "null", "as the text JSON spells it with");

    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    const refused = encodeJson(cycle, 0);
    assert(!refused.ok, "a structure that closes on itself was refused");
    assertStrictEquals(refused.error.kind, JSON_FAILURE.unwritable, "not the same as no text");
    if (refused.error.kind !== JSON_FAILURE.unwritable) return;
    assertInstanceOf(refused.error.cause, TypeError, "carrying what the writer threw");

    const wide = encodeJson(1n, 0);
    assert(!wide.ok, "a big integer has no JSON spelling and the writer throws on it");
    assertStrictEquals(wide.error.kind, JSON_FAILURE.unwritable, "which is a refusal too");
});

Deno.test("a writing answers the text it wrote, empty text included", () => {
    const empty = encodeJson("", 0);
    assert(empty.ok, "text saying nothing is a value that writes");
    assertStrictEquals(empty.value, '""', "as the two marks that carry it");

    const zero = encodeJson(0, 0);
    assert(zero.ok, "and so is zero");
    assertStrictEquals(zero.value, "0", "which is a measurement, not a refusal");
});

Deno.test("indentation is written where a person will read it and not where nobody will", () => {
    const flat = encodeJson({ a: 1 }, 0);
    assert(flat.ok, "a record writes");
    assertStrictEquals(flat.value, '{"a":1}', "on one line where only a reader will take it back");

    const spaced = encodeJson({ a: 1 }, 2);
    assert(spaced.ok, "and writes again");
    assertStrictEquals(spaced.value, '{\n  "a": 1\n}', "indented where a person will read it");

    const read = parseJson(spaced.value);
    assert(read.ok, "and what was written reads back");
    assertEquals(read.value, { a: 1 }, "as the value it was written from");
});
