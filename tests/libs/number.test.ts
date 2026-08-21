/**
 * Every rejection here is a value `Number()` would have accepted, and each one
 * would have arrived downstream as a figure nobody wrote. They are listed as
 * cases rather than described, because the point is the exact input.
 */

import { describe, expect, test } from "bun:test";
import { AssertionFailure } from "@/libs/assert.ts";
import {
  composeDecimalText,
  composeHexadecimalByteText,
  composeIntegerText,
  getDecimalFromText,
  getFiniteNumberFromValue,
  getIntegerFromHexadecimalText,
  getIntegerFromText,
  getIntegerFromValue,
  getNumberFromText,
} from "@/libs/number.ts";

describe("reading an integer from text", () => {
  test.each([
    ["0", 0],
    ["7", 7],
    ["-140", -140],
    ["1317", 1317],
    ["007", 7],
    ["9007199254740991", 9007199254740991],
  ])("%p reads as %p", (text, expected) => {
    expect(getIntegerFromText(text)).toBe(expected);
  });

  // The one that pays for this file. `Number("")` is `0`, and `0` is a perfectly
  // good damage figure, so an empty field would land as a measurement.
  test("an empty value is not zero", () => {
    expect(getIntegerFromText("")).toBeNull();
  });

  test.each([
    [" 5 ", "whitespace is not part of a number"],
    ["0x10", "a different base"],
    ["1e3", "scientific notation"],
    ["+5", "a leading sign the protocol writes on keys, never on values"],
    ["12abc", "a tail parseInt would have discarded"],
    ["1.5", "a decimal is not an integer"],
    ["Infinity", "a word that Number reads as a number"],
    ["NaN", "the same, and worse"],
    ["-", "a sign with nothing after it"],
  ])("%p is refused — %s", (text) => {
    expect(getIntegerFromText(text)).toBeNull();
  });

  // Past 2^53 the digits stop mapping one-to-one onto values. Reading such an id
  // would attribute damage to a combatant who does not exist.
  test("a number too large to survive the round trip is refused", () => {
    expect(getIntegerFromText("9007199254740993")).toBeNull();
    expect(getIntegerFromText("-9007199254740993")).toBeNull();
  });
});

describe("reading a decimal from text", () => {
  test.each([
    ["100.00", 100],
    ["71.86", 71.86],
    ["0.00", 0],
    ["-12.5", -12.5],
  ])("%p reads as %p", (text, expected) => {
    expect(getDecimalFromText(text)).toBe(expected);
  });

  test.each(["", "100", ".5", "5.", "1e3", " 1.5", "100.00%"])("%p is refused", (text) => {
    expect(getDecimalFromText(text)).toBeNull();
  });

  // A decimal long enough to overflow reads as Infinity, which would then be
  // written back as the text "Infinity".
  test("a decimal too large to hold is refused", () => {
    expect(getDecimalFromText(`${"9".repeat(400)}.0`)).toBeNull();
  });
});

describe("reading a number that arrived as a number", () => {
  test.each([0, 7, -140, 9007199254740991])("%p reads as itself", (value) => {
    expect(getIntegerFromValue(value)).toBe(value);
  });

  // The captured material states combatant ids the protocol also states, and the
  // protocol side refuses both of these. A dump read more loosely than the live
  // message would join against ids that cannot exist.
  test.each([1.5, 9007199254740993, Number.NaN, Number.POSITIVE_INFINITY])(
    "%p is not an integer we can use",
    (value) => {
      expect(getIntegerFromValue(value)).toBeNull();
    },
  );

  // A numeric string is the coercion this whole module exists to refuse; it must
  // not sneak back in through the value side.
  test.each([["7"], [null], [undefined], [true], [{}], [[]]])("%p is not a number", (value) => {
    expect(getIntegerFromValue(value)).toBeNull();
    expect(getFiniteNumberFromValue(value)).toBeNull();
  });

  test("a fraction is a finite number even though it is not an integer", () => {
    expect(getFiniteNumberFromValue(71.86)).toBe(71.86);
    expect(getIntegerFromValue(71.86)).toBeNull();
  });

  test.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "%p is not finite",
    (value) => {
      expect(getFiniteNumberFromValue(value)).toBeNull();
    },
  );
});

describe("writing a number back to text", () => {
  test.each([
    [0, "0"],
    [7, "7"],
    [-140, "-140"],
    [9007199254740991, "9007199254740991"],
  ])("%p writes as %p", (value, expected) => {
    expect(composeIntegerText(value)).toBe(expected);
  });

  test.each([
    [100, 2, "100.00"],
    [71.86, 2, "71.86"],
    [0, 2, "0.00"],
    [71.865, 0, "72"],
  ])("%p to %p places writes as %p", (value, places, expected) => {
    expect(composeDecimalText(value, places)).toBe(expected);
  });

  // `String(1e21)` is "1e+21" and `String(NaN)` is "NaN" — text that will not
  // read back. The input is a number we produced, so it is an invariant, not a
  // failure anyone could handle.
  test.each([1e21, Number.NaN, 1.5])("%p cannot be written as an integer", (value) => {
    expect(() => composeIntegerText(value)).toThrow(AssertionFailure);
  });

  test.each([Number.NaN, Number.POSITIVE_INFINITY])("%p cannot be written as a decimal", (value) => {
    expect(() => composeDecimalText(value, 2)).toThrow(AssertionFailure);
  });

  test("a digit count that is not a count of digits is refused", () => {
    expect(() => composeDecimalText(1, -1)).toThrow(AssertionFailure);
    expect(() => composeDecimalText(1, 1.5)).toThrow(AssertionFailure);
  });
});

/**
 * The two readers this file had never been asked a question of, found by
 * `docs/audits/2026-08-13-the-whole-tree-read-once.md` (F3). Hexadecimal had
 * **zero references anywhere** under `tests/` while being the reader the panel's
 * contrast arithmetic rests on, and §9.7 makes that an accessibility floor.
 *
 * Every case below is a value one of the spellings its docblock names would have
 * accepted, which is the whole argument for the reader existing.
 */
describe("reading an integer from hexadecimal text", () => {
  test.each([
    ["00", 0],
    ["ff", 255],
    ["FF", 255],
    ["0a", 10],
    ["7f3c9b", 8338587],
  ])("%p reads as %p", (text, expected) => {
    expect(getIntegerFromHexadecimalText(text)).toBe(expected);
  });

  /**
   * ⚠️ `parseInt("ffzz", 16)` is 255 — it reads as far as it can and keeps what
   * it got — and `parseInt("zz", 16)` is `NaN`. A colour channel read half-way is
   * a colour nobody chose, and it is the failure mode that looks like success.
   */
  test.each([
    ["ffzz", "read as far as it can and kept 255"],
    ["zz", "NaN"],
    ["", "zero, on some spellings"],
    ["0xff", "the prefix `Number` would want and this text may not carry"],
    [" ff", "whitespace, which trims silently"],
    ["ff ", "whitespace, which trims silently"],
    ["-ff", "a sign, which a byte does not carry"],
    ["1.5", "a fraction"],
  ])("%p is refused, where a lesser spelling gives %s", (text) => {
    expect(getIntegerFromHexadecimalText(text)).toBeNull();
  });
});

/**
 * The reader that answers "is this a number at all", either spelling. It was
 * exercised only incidentally from two tests in `tests/core/`, which is not the
 * same as being asked what it accepts.
 */
describe("reading a number that may or may not carry a fraction", () => {
  test.each([
    ["30", 30],
    ["22.5", 22.5],
    ["-7", -7],
    ["0", 0],
  ])("%p reads as %p", (text, expected) => {
    expect(getNumberFromText(text)).toBe(expected);
  });

  test.each(["", " ", "22.5.1", "1e3", ".5", "22px", "NaN", "Infinity"])(
    "%p is refused",
    (text) => {
      expect(getNumberFromText(text)).toBeNull();
    },
  );
});

/**
 * The other direction of the hexadecimal reader, which `libs/` did not own until
 * the same audit (F7): the panel wrote it inline as `.toString(16)`.
 */
describe("writing a byte back as hexadecimal", () => {
  test.each([
    [0, "00"],
    [10, "0a"],
    [255, "ff"],
    [128, "80"],
  ])("%p writes as %p", (value, expected) => {
    expect(composeHexadecimalByteText(value)).toBe(expected);
  });

  test("writes a round trip that reads back as itself", () => {
    for (const value of [0, 1, 15, 16, 200, 255]) {
      expect(getIntegerFromHexadecimalText(composeHexadecimalByteText(value))).toBe(value);
    }
  });

  /**
   * `(-1).toString(16)` is `"-1"` and `(1.5).toString(16)` is `"1.8"` — padded to
   * two digits, either is a colour channel that looks exactly like a colour
   * channel. The number is ours, so this is an invariant and not a failure
   * anyone could handle (§9.5).
   */
  test.each([-1, 256, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 1e21])(
    "%p cannot be written as a byte",
    (value) => {
      expect(() => composeHexadecimalByteText(value)).toThrow(AssertionFailure);
    },
  );
});
