/**
 * The reader every panel guard takes a figure apart with.
 *
 * ⚠️ **Its callers cannot hold it.** `tests/ui/panel-view.test.ts` asks whether
 * a raw token of the game's stands alone in a sentence the panel drew, and the
 * answer over every capture is no — so loosening one side of the word boundary
 * changes nothing there and the mutant lives. A negative assertion holds its
 * subject only where the answer is sometimes yes, which is what this file is
 * for.
 */

import { describe, expect, test } from "bun:test";
import {
  composeWithoutBrackets,
  composeWithoutWhitespace,
  hasTokenAsWord,
} from "@/tests/drawn-text.ts";

describe("the spacing off a number", () => {
  test.each([
    ["107 952", "107952"],
    ["1 234 567", "1234567"],
    ["-1 234", "-1234"],
    ["12", "12"],
    ["", ""],
  ])("%p reads as %p", (drawn, bare) => {
    expect(composeWithoutWhitespace(drawn)).toBe(bare);
  });

  // The panel spaces with a non-breaking space in places, which is whitespace to
  // a reader and not the character anybody types.
  test("every kind of space goes, not only the one on the keyboard", () => {
    expect(composeWithoutWhitespace("1 2 3\t4\n5")).toBe("12345");
  });
});

describe("the brackets off a share", () => {
  test.each([
    ["(66%)", "66"],
    ["(<1%)", "<1"],
    ["(12% · 3%)", "12 · 3"],
    ["66", "66"],
  ])("%p reads as %p", (drawn, bare) => {
    expect(composeWithoutBrackets(drawn)).toBe(bare);
  });
});

describe("a token standing alone", () => {
  test.each([
    ["blok", "blok"],
    ["Zadane blok razem", "blok"],
    ["blok, razem", "blok"],
    ["(blok)", "blok"],
  ])("%p carries %p on its own", (text, token) => {
    expect(hasTokenAsWord(text, token)).toBe(true);
  });

  /**
   * The case the whole thing exists for: `blok` is the root of the Polish
   * `zablokowane`, and finding it there is the translation working rather than
   * failing. Both sides of the boundary are here, because a check that only
   * looked at one of them would call `zablokowane` a hit from the right.
   */
  test.each([
    ["zablokowane", "blok"],
    ["blokada", "blok"],
    ["zablokowanobloką", "blok"],
    ["", "blok"],
    ["blok", ""],
  ])("%p does not carry %p on its own", (text, token) => {
    expect(hasTokenAsWord(text, token)).toBe(false);
  });

  test("a Polish letter is a letter on either side", () => {
    expect(hasTokenAsWord("ąblok", "blok")).toBe(false);
    expect(hasTokenAsWord("bloką", "blok")).toBe(false);
    expect(hasTokenAsWord("1blok2", "blok")).toBe(true);
  });
});
