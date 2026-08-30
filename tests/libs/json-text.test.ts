/**
 * Both directions of JSON, over the answers `null` used to stand for.
 *
 * `null` is a value JSON carries and `undefined` has no JSON text at all, so each pair below
 * states the case that works beside the case that does not, which is what one answer hid.
 */

import { assert, assertEquals } from "@std/assert";
import { composeJsonWriting, getJsonReading } from "@/libs/json-text.ts";

Deno.test("text that carried null read, and text that would not read, are told apart", () => {
    const carried = getJsonReading("null");
    assert(carried.isOk, "text stating null is text that read");
    assertEquals(carried.value, null, "and what it carried is null");

    const refused = getJsonReading("{oops");
    assert(!refused.isOk, "text that is not JSON did not read");
    assertEquals(refused.error, "unreadable", "and says so rather than answering null");
    assert(refused.cause instanceof Error, "carrying what the reader threw");

    const empty = getJsonReading("");
    assert(!empty.isOk, "text saying nothing is not JSON either");
});

Deno.test("a reading answers the value it read, zero and false included", () => {
    const zero = getJsonReading("0");
    assert(zero.isOk, "text stating zero read");
    assertEquals(zero.value, 0, "and zero is a value like any other");

    const no = getJsonReading("false");
    assert(no.isOk, "and so did text stating false");
    assertEquals(no.value, false, "which is a value and not a refusal");

    const one = getJsonReading("1");
    assert(one.isOk, "the neighbour of zero reads the same way");
    assertEquals(one.value, 1, "and states itself");
});

Deno.test("a value with no JSON text and a writer that threw are told apart", () => {
    const nothing = composeJsonWriting(undefined);
    assert(!nothing.isOk, "a value with no JSON text of its own was not written");
    assertEquals(nothing.error, "nothing", "and says which of the two it was");
    assertEquals(nothing.cause, null, "with no cause, because nothing threw");

    const written = composeJsonWriting(null);
    assert(written.isOk, "while null is a value that writes");
    assertEquals(written.text, "null", "as the text JSON spells it with");

    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    const refused = composeJsonWriting(cycle);
    assert(!refused.isOk, "a structure that closes on itself was refused");
    assertEquals(refused.error, "unwritable", "which is not the same as having no text");
    assert(refused.cause instanceof Error, "carrying what the writer threw");
});

Deno.test("a writing answers the text it wrote, empty text included", () => {
    const empty = composeJsonWriting("");
    assert(empty.isOk, "text saying nothing is a value that writes");
    assertEquals(empty.text, '""', "as the two marks that carry it");

    const zero = composeJsonWriting(0);
    assert(zero.isOk, "and so is zero");
    assertEquals(zero.text, "0", "which is a measurement, not a refusal");
});

Deno.test("indentation is written where a person will read it and not where nobody will", () => {
    const flat = composeJsonWriting({ a: 1 });
    assert(flat.isOk, "a record writes");
    assertEquals(flat.text, '{"a":1}', "on one line where only a reader will take it back");

    const spaced = composeJsonWriting({ a: 1 }, 2);
    assert(spaced.isOk, "and writes again");
    assertEquals(spaced.text, '{\n  "a": 1\n}', "indented where a person will read it");
});
