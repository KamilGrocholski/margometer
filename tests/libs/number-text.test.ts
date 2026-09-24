/**
 * Numbers read out of text, over the text that looks like a number and is not one.
 *
 * `Number` answers something for nearly anything, so every case below is a spelling it would have
 * admitted: a sign it did not write, an exponent, a space, a width nothing holds exactly.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { formatDecimal, formatInteger, parseDecimal, parseInteger } from "@/libs/number-text.ts";

Deno.test("an integer is read where digits were written, and nowhere else", () => {
    assertStrictEquals(parseInteger("0"), 0, "zero is a reading like any other");
    assertStrictEquals(parseInteger("1"), 1, "and so is its neighbour");
    assertStrictEquals(parseInteger("-161518"), -161518, "an id below nothing is read whole");
    assertStrictEquals(parseInteger("007"), 7, "leading nothing is still the number behind it");

    assertStrictEquals(parseInteger(""), null, "text saying nothing states no number");
    assertStrictEquals(parseInteger("-"), null, "a sign on its own states none either");
    assertStrictEquals(parseInteger("--1"), null, "nor does a number signed twice");
    assertStrictEquals(parseInteger("+1"), null, "a sign the protocol does not write is not read");
    assertStrictEquals(parseInteger(" 1"), null, "nor is a number with a space in front of it");
    assertStrictEquals(parseInteger("1 "), null, "nor one with a space behind it");
    assertStrictEquals(parseInteger("1e3"), null, "an exponent is a spelling, not a reading");
    assertStrictEquals(parseInteger("1.0"), null, "and a fraction is not a whole number");
});

Deno.test("a number no reading holds exactly is refused rather than neighboured", () => {
    assertStrictEquals(parseInteger("9007199254740991"), 9007199254740991, "the last one held");
    assertStrictEquals(parseInteger("9007199254740992"), null, "and the first one that is not");
    assertStrictEquals(parseInteger("-9007199254740991"), -9007199254740991, "the lowest held");
    assertStrictEquals(parseInteger("-9007199254740992"), null, "and the one below it");
});

Deno.test("what was read writes back as the text it was read from", () => {
    assertStrictEquals(formatInteger(0), "0", "zero writes as one character");
    assertStrictEquals(formatInteger(-0), "0", "and so does the zero with a sign on it");
    assertStrictEquals(formatInteger(-161518), "-161518", "an id below nothing keeps its sign");
    assertEquals(parseInteger("-0"), -0, "which is the zero that was read");
});

Deno.test("a decimal is read with a fraction or without one", () => {
    assertStrictEquals(parseDecimal("30"), 30, "a whole share is a share");
    assertStrictEquals(parseDecimal("22.5"), 22.5, "and so is one written with a fraction");
    assertStrictEquals(parseDecimal("0"), 0, "zero is a share like any other");
    assertStrictEquals(parseDecimal("0.00"), 0, "however it was spelled");
    assertStrictEquals(parseDecimal("1"), 1, "and so is its neighbour");

    assertStrictEquals(parseDecimal(""), null, "text saying nothing states no number");
    assertStrictEquals(parseDecimal("."), null, "a point alone states no number");
    assertStrictEquals(parseDecimal("1."), null, "nor does a point with nothing behind it");
    assertStrictEquals(parseDecimal(".5"), null, "nor one with nothing in front of it");
    assertStrictEquals(parseDecimal("-1"), null, "a share below nothing is nobody's reading");
    assertStrictEquals(parseDecimal("1.2.3"), null, "and two points state no number at all");
});

Deno.test("a decimal is written to the places it was asked for", () => {
    assertStrictEquals(formatDecimal(10 / 3, 2), "3.33", "a number is written to the width asked");
    assertStrictEquals(formatDecimal(0, 0), "0", "nothing is written to no places at all");
    assertStrictEquals(formatDecimal(0, 1), "0.0", "and to one place");
    assertStrictEquals(formatDecimal(0, 2), "0.00", "and zero fills the width it was given");
    assertStrictEquals(formatDecimal(10.000000000000002, 1), "10.0", "a tenth stays a tenth");
});
