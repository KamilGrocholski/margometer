/**
 * Numbers read out of text, over the text that looks like a number and is not one.
 *
 * `Number` answers something for nearly anything, so every case below is a spelling it would
 * have admitted: a sign it did not write, an exponent, a space, a width nothing holds exactly.
 */

import { assertEquals } from "@std/assert";
import {
    composeDecimalText,
    composeIntegerText,
    getDecimalFromText,
    getIntegerFromText,
    isIntegerText,
} from "@/libs/number-text.ts";

Deno.test("an integer is read where digits were written, and nowhere else", () => {
    assertEquals(getIntegerFromText("0"), 0, "zero is a reading like any other");
    assertEquals(getIntegerFromText("1"), 1, "and so is its neighbour");
    assertEquals(getIntegerFromText("-161518"), -161518, "an id below nothing is read whole");
    assertEquals(getIntegerFromText("007"), 7, "leading nothing is still the number behind it");

    assertEquals(getIntegerFromText(""), null, "text saying nothing states no number");
    assertEquals(getIntegerFromText("-"), null, "a sign on its own states none either");
    assertEquals(getIntegerFromText("+1"), null, "a sign the protocol does not write is not read");
    assertEquals(getIntegerFromText(" 1"), null, "nor is a number with a space in front of it");
    assertEquals(getIntegerFromText("1 "), null, "nor one with a space behind it");
    assertEquals(getIntegerFromText("1e3"), null, "an exponent is a spelling, not a reading");
    assertEquals(getIntegerFromText("1.0"), null, "and a fraction is not a whole number");
});

Deno.test("a number no reading holds exactly is refused rather than neighboured", () => {
    assertEquals(getIntegerFromText("9007199254740991"), 9007199254740991, "the last one held");
    assertEquals(getIntegerFromText("9007199254740993"), null, "and the first one that is not");
    assertEquals(isIntegerText("9007199254740993"), true, "though it is written as an integer");
});

Deno.test("the shape of an integer is asked separately from the number behind it", () => {
    assertEquals(isIntegerText("0"), true, "zero is written as an integer");
    assertEquals(isIntegerText("-161518"), true, "and so is a number below nothing");
    assertEquals(isIntegerText(""), false, "text saying nothing is not");
    assertEquals(isIntegerText("-"), false, "nor is a sign with no digits behind it");
    assertEquals(isIntegerText("--1"), false, "nor one signed twice");
    assertEquals(isIntegerText("1.0"), false, "and a fraction is another shape entirely");
});

Deno.test("what was read writes back as the text it was read from", () => {
    assertEquals(composeIntegerText(0), "0", "zero writes as one character");
    assertEquals(composeIntegerText(-0), "0", "and so does the zero with a sign on it");
    assertEquals(composeIntegerText(-161518), "-161518", "an id below nothing keeps its sign");
    assertEquals(getIntegerFromText("-0"), 0, "which is the zero that was read");
});

Deno.test("a decimal is read with a fraction or without one", () => {
    assertEquals(getDecimalFromText("30"), 30, "a whole share is a share");
    assertEquals(getDecimalFromText("22.5"), 22.5, "and so is one written with a fraction");
    assertEquals(getDecimalFromText("0"), 0, "zero is a share like any other");
    assertEquals(getDecimalFromText("0.00"), 0, "however it was spelled");

    assertEquals(getDecimalFromText("."), null, "a point alone states no number");
    assertEquals(getDecimalFromText("1."), null, "nor does a point with nothing behind it");
    assertEquals(getDecimalFromText(".5"), null, "nor one with nothing in front of it");
    assertEquals(getDecimalFromText("-1"), null, "a share below nothing is nobody's reading");
    assertEquals(getDecimalFromText("1.2.3"), null, "and two points state no number at all");
});

Deno.test("a decimal is written to the places it was asked for", () => {
    assertEquals(composeDecimalText(10 / 3, 2), "3.33", "a number is written to the width asked");
    assertEquals(composeDecimalText(0, 0), "0", "nothing is written to no places at all");
    assertEquals(composeDecimalText(0, 2), "0.00", "and zero fills the width it was given");
    assertEquals(composeDecimalText(10.000000000000002, 1), "10.0", "a tenth stays a tenth");
});
