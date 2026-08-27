/**
 * The character classes, stated rather than compared.
 *
 * These functions replaced patterns, and the obvious test would put each one
 * against the pattern it replaced. That test was written and run during the
 * migration and is not kept: a class asserted against `\d` is a claim about
 * JavaScript, and the thing worth holding is the claim about *this* class —
 * which characters are in it. The migration's own comparison is in the commit
 * that made it.
 *
 * §7.5's boundary rule decides the cases: every range is asserted from both
 * sides, on the character just inside and the one just outside it, because a
 * class that has crept by one still reads every input anybody types.
 */

import { describe, expect, test } from "bun:test";
import {
  getEndOfAlphanumerics,
  getEndOfDigits,
  getEndOfWhitespace,
  getEndOfWordCharacters,
  getPartsSeparatedByWhitespace,
  getWordOccurrences,
  hasAnyCharacterIn,
  hasDigitsAt,
  isAlphanumericAt,
  isDigitAt,
  isHexadecimalDigitAt,
  isKebabCaseText,
  isWhitespaceAt,
  isWordCharacterAt,
  isWordStart,
} from "@/libs/text-runs.ts";

describe("a digit", () => {
  test.each(["0", "5", "9"])("%s is one", (character) => {
    expect(isDigitAt(character, 0)).toBe(true);
  });

  // The two neighbours of the range in code-unit order, and a digit of another
  // script — `\d` never matched that one and neither does this.
  test.each(["/", ":", "a", "٥", "１", "-", ".", " "])("%s is not", (character) => {
    expect(isDigitAt(character, 0)).toBe(false);
  });

  test("nothing is a digit past either end", () => {
    expect(isDigitAt("5", 1)).toBe(false);
    expect(isDigitAt("5", -1)).toBe(false);
    expect(isDigitAt("", 0)).toBe(false);
  });
});

describe("a hexadecimal digit", () => {
  test.each(["0", "9", "a", "f", "A", "F"])("%s is one", (character) => {
    expect(isHexadecimalDigitAt(character, 0)).toBe(true);
  });

  test.each(["/", ":", "`", "g", "@", "G", "x"])("%s is not", (character) => {
    expect(isHexadecimalDigitAt(character, 0)).toBe(false);
  });
});

describe("a letter or digit", () => {
  test.each(["0", "9", "a", "z", "A", "Z"])("%s is one", (character) => {
    expect(isAlphanumericAt(character, 0)).toBe(true);
  });

  // `_` is the one that matters: a word character in a pattern, and deliberately
  // not one here, because the only caller reads a build id and an underscore has
  // never appeared in one.
  test.each(["/", ":", "@", "[", "`", "{", "_", "-", " "])("%s is not", (character) => {
    expect(isAlphanumericAt(character, 0)).toBe(false);
  });
});

describe("whitespace", () => {
  test.each([" ", "\t", "\n", "\r", "\v", "\f", " ", " ", "　", "﻿"])(
    "%p is whitespace",
    (character) => {
      expect(isWhitespaceAt(character, 0)).toBe(true);
    },
  );

  // A zero-width space is not whitespace to a pattern either, and it is the one
  // a reader would most expect to be.
  test.each(["a", "​", "-", "0"])("%p is not", (character) => {
    expect(isWhitespaceAt(character, 0)).toBe(false);
  });
});

describe("where a run stops", () => {
  test("it stops at the start when there is no run", () => {
    expect(getEndOfDigits("abc", 0)).toBe(0);
    expect(getEndOfAlphanumerics("...", 0)).toBe(0);
    expect(getEndOfWhitespace("abc", 0)).toBe(0);
  });

  test("it stops where the class stops", () => {
    expect(getEndOfDigits("12ab", 0)).toBe(2);
    expect(getEndOfAlphanumerics("ab12.", 0)).toBe(4);
    expect(getEndOfWhitespace("  \tx", 0)).toBe(3);
  });

  test("it reads from where it is asked, not from the beginning", () => {
    expect(getEndOfDigits("ab12", 2)).toBe(4);
    expect(getEndOfDigits("ab12", 0)).toBe(0);
  });

  test("a start past the end is where it stops", () => {
    expect(getEndOfDigits("12", 9)).toBe(9);
    expect(getEndOfDigits("", 0)).toBe(0);
  });
});

describe("a run of a stated length", () => {
  test("exactly that many is enough", () => {
    expect(hasDigitsAt("2026", 0, 4)).toBe(true);
  });

  test("one short is not", () => {
    expect(hasDigitsAt("202", 0, 4)).toBe(false);
    expect(hasDigitsAt("", 0, 1)).toBe(false);
  });

  // Deliberate, and the docblock argues it: only the caller knows whether a
  // fifth digit is a fault or the next field, so it is the caller that states
  // what follows.
  test("one longer is not refused here", () => {
    expect(hasDigitsAt("20261", 0, 4)).toBe(true);
  });
});

/**
 * A word character is a letter, a digit or an underscore — the class a pattern
 * spelled `\w`, and one wider than the letters and digits above it. The
 * underscore is the whole of the difference and is why both classes exist.
 */
describe("a word character", () => {
  test.each(["a", "Z", "0", "9", "_"])("%p is one", (character) => {
    expect(isWordCharacterAt(character, 0)).toBe(true);
  });

  test.each(["$", "-", ".", " ", "["])("%p is not", (character) => {
    expect(isWordCharacterAt(character, 0)).toBe(false);
  });

  test("a run stops where the class does", () => {
    expect(getEndOfWordCharacters("a_1$", 0)).toBe(3);
    expect(getEndOfWordCharacters("$a", 0)).toBe(0);
    expect(getEndOfWordCharacters("", 0)).toBe(0);
  });
});

describe("where a word begins", () => {
  test("the start of the text begins one", () => {
    expect(isWordStart("version", 0)).toBe(true);
  });

  test.each([" ", "{", ",", "-", "."])("%p before it begins one", (before) => {
    expect(isWordStart(`${before}version`, 1)).toBe(true);
  });

  // `api` is the case this exists for, and `_` is the one a class of letters and
  // digits alone would have got wrong.
  test.each(["i", "9", "_"])("%p before it does not", (before) => {
    expect(isWordStart(`${before}version`, 1)).toBe(false);
  });
});

describe("the pieces between the whitespace", () => {
  test("a run of separators is one separator", () => {
    expect(getPartsSeparatedByWhitespace("a  b\tc\n\nd")).toEqual(["a", "b", "c", "d"]);
  });

  test("whitespace at either end is not a piece", () => {
    expect(getPartsSeparatedByWhitespace("  a b  ")).toEqual(["a", "b"]);
  });

  // The case `split` answers differently: it hands back one empty string, so a
  // caller reading the first piece reads `""` where there is no piece at all.
  test.each(["", " ", "\n \t"])("%p has no pieces", (text) => {
    expect(getPartsSeparatedByWhitespace(text)).toEqual([]);
  });
});

describe("kebab case", () => {
  test.each(["panel", "panel-view", "a-1", "2026-08-27-a-fight"])("%p is", (text) => {
    expect(isKebabCaseText(text)).toBe(true);
  });

  // A hyphen at either end and a doubled one in the middle are the three that
  // compose a name with a hole where a field should be; the rest are characters
  // the class does not hold.
  test.each(["", "-", "-panel", "panel-", "panel--view", "Panel", "panel_view", "panel view"])(
    "%p is not",
    (text) => {
      expect(isKebabCaseText(text)).toBe(false);
    },
  );
});

describe("a character from a set", () => {
  test("is found wherever it stands", () => {
    expect(hasAnyCharacterIn("abc", "c")).toBe(true);
    expect(hasAnyCharacterIn("abc", "a")).toBe(true);
  });

  test.each(["", "abc"])("%p carries none of them", (text) => {
    expect(hasAnyCharacterIn(text, "xyz")).toBe(false);
  });

  // The pair is not each other's negation, and this is the case that says so.
  test("is not the same question as every character", () => {
    expect(hasAnyCharacterIn("a1", "0123456789")).toBe(true);
  });
});

describe("a word standing alone", () => {
  test("is found wherever it stands and nowhere else", () => {
    expect(getWordOccurrences("Total(x) + myTotal + Totals", "Total")).toEqual([0]);
  });

  test("is found more than once", () => {
    expect(getWordOccurrences("get(); get()", "get")).toEqual([0, 7]);
  });

  // The half a boundary at both ends would get wrong: nothing can precede a full
  // stop that would make a method's name part of a longer word, and every caller
  // writes one after a value.
  test("opening with something no word carries asks no boundary in front", () => {
    expect(getWordOccurrences("x.slice(2)", ".slice")).toEqual([1]);
    expect(getWordOccurrences("x.sliceLater(2)", ".slice")).toEqual([]);
  });

  test("an empty word is nowhere", () => {
    expect(getWordOccurrences("anything", "")).toEqual([]);
  });
});
