/**
 * What counts as a shape worth reading, over the values `typeof` cannot tell apart.
 *
 * `typeof` answers `"object"` for a list and for nothing at all, and both would otherwise pass
 * for the keyed object every reader above this one expects.
 */

import { assertEquals } from "@std/assert";
import {
    getNumberFromUnknown,
    getStatedTextFromUnknown,
    getTextFromUnknown,
    isRecord,
} from "@/libs/unknown-reading.ts";

Deno.test("a record is keyed, so nothing and a list are not records", () => {
    assertEquals(isRecord({ m: [] }), true, "a keyed object is one");
    assertEquals(isRecord({}), true, "and so is a keyed object stating nothing");
    assertEquals(isRecord([]), false, "a list is read by its order, not by its names");
    assertEquals(isRecord(["0;0;txt=a"]), false, "however much it looks like a payload's cargo");
    assertEquals(isRecord(null), false, "and `typeof null` says object where nothing is there");
    assertEquals(isRecord("m"), false, "text is not a record either");
});

Deno.test("a number is read only where a number was stated", () => {
    assertEquals(getNumberFromUnknown(0), 0, "zero is a reading like any other");
    assertEquals(getNumberFromUnknown(-161518), -161518, "and so is an id below nothing");
    assertEquals(getNumberFromUnknown("745"), null, "text that looks like one is not one");
    assertEquals(getNumberFromUnknown(Number.NaN), null, "and neither is what is not a number");
    assertEquals(getNumberFromUnknown(Number.POSITIVE_INFINITY), null, "nor what has no end");
});

Deno.test("text is read wherever text was stated, saying something or not", () => {
    assertEquals(getTextFromUnknown("Gracz 1"), "Gracz 1", "text is text");
    assertEquals(getTextFromUnknown(""), "", "and text saying nothing is text saying nothing");
    assertEquals(getTextFromUnknown(745), null, "while a number is not text at all");
    assertEquals(getTextFromUnknown(null), null, "and neither is nothing");
});

Deno.test("whether text states anything is a second question, asked separately", () => {
    assertEquals(getStatedTextFromUnknown("Gracz 1"), "Gracz 1", "text that says something");
    assertEquals(getStatedTextFromUnknown(""), null, "text saying nothing states nothing");
    assertEquals(getStatedTextFromUnknown(" "), " ", "though a space is something said");
    assertEquals(getStatedTextFromUnknown(745), null, "and a number states no text");
});
