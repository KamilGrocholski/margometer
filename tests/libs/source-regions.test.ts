/**
 * Where the comments, the literals and the patterns sit — the module every guard
 * in this repository stands on, and the one file in `libs/` that had no test.
 *
 * ⚠️ **Twelve of its twenty-five mutants survived**, which is what a module
 * exercised only through its callers looks like: `tests/tools/source-layout.test.ts`
 * asks it for source with the comments gone and `tools/mutation-sweep.ts` asks it
 * for the spans, and both go on passing while the spans move by a character. A
 * comment range that starts one character early takes the code before it with it;
 * one that ends early leaves prose where a guard reads code, and the guard then
 * flags a banned construct inside a sentence — or, in the direction that costs,
 * stops seeing one that is really there.
 *
 * Patterns and not a parser (the module says so), so what is held here is the
 * bargain rather than a grammar: the two shapes this repository actually writes,
 * the offsets, and the cases the module's own docblock says it gets wrong.
 */

import { describe, expect, test } from "bun:test";
import {
  composeSourceWithBlankedComments,
  composeSourceWithoutComments,
  getCommentRangesFromSource,
  getRegularExpressionRangesFromSource,
  getTextRangesFromSource,
} from "@/libs/source-regions.ts";

describe("where the comments are", () => {
  test("a block comment is the whole of it, markers included", () => {
    const source = "const a = 1;/* gone */const b = 2;";
    expect(getCommentRangesFromSource(source)).toEqual([{ start: 12, end: 22 }]);
    expect(source.slice(12, 22)).toBe("/* gone */");
  });

  /**
   * ⚠️ **The character that admits the comment is code and stays code.** The
   * pattern captures it — a slash pair opens a comment only at the start of a
   * line or after whitespace — so the range has to begin after it, or every
   * `const a = 1; // note` loses its semicolon's neighbour to the comment.
   */
  test("a line comment begins after the space that admits it", () => {
    const source = "const a = 1; // note";
    const [range] = getCommentRangesFromSource(source);

    expect(source.slice(range?.start, range?.end)).toBe("// note");
    expect(source.slice(0, range?.start)).toBe("const a = 1; ");
  });

  test("a line comment at the start of a line keeps its whole line", () => {
    const source = "// note\nconst a = 1;";
    expect(getCommentRangesFromSource(source)).toEqual([{ start: 0, end: 7 }]);
  });

  /** The bargain the module states: a slash pair inside a URL is not a comment. */
  test("a slash pair with a value before it is not a comment", () => {
    expect(getCommentRangesFromSource('const url = "https://margonem.pl";')).toEqual([]);
  });

  test("ranges come back in the order they were found", () => {
    const ranges = getCommentRangesFromSource("/* one */ const a = 1; // two\n/* three */");
    expect(ranges.map(({ start }) => start)).toEqual([...ranges.map(({ start }) => start)].sort(
      (left, right) => left - right,
    ));
    expect(ranges.length).toBe(3);
  });
});

describe("source with the comments taken out", () => {
  test("keeps the character that admitted a line comment", () => {
    expect(composeSourceWithoutComments("const a = 1; // note")).toBe("const a = 1; ");
  });

  test("takes a block comment out whole", () => {
    expect(composeSourceWithoutComments("a/* gone */b")).toBe("ab");
  });
});

describe("source with the comments blanked", () => {
  /**
   * The whole reason this reader exists beside the one above: a caller reading an
   * offset out of the blanked source is reading it into the original, so a
   * character may only become a space and never disappear.
   */
  test("is the same length, character for character", () => {
    const source = "const a = 1; // note\n/* two\nlines */\nconst b = 2;";
    expect(composeSourceWithBlankedComments(source).length).toBe(source.length);
  });

  test("keeps the newlines a comment spans", () => {
    const blanked = composeSourceWithBlankedComments("/* two\nlines */");
    expect(blanked).toBe("      \n        ");
    expect([...blanked].filter((one) => one === "\n").length).toBe(1);
  });

  test("leaves the code beside a comment alone", () => {
    expect(composeSourceWithBlankedComments("a = 1; // note")).toBe("a = 1;        ");
  });
});

describe("where the literals are", () => {
  test("reads a double-quoted, a single-quoted and a template alike", () => {
    const source = 'const a = "one", b = \'two\', c = `three`;';
    expect(getTextRangesFromSource(source).map(({ start, end }) => source.slice(start, end))).toEqual([
      '"one"',
      "'two'",
      "`three`",
    ]);
  });

  /**
   * Comments are blanked before the literals are read, and this is the case that
   * decides it: a lone apostrophe in prose would otherwise open a literal that
   * runs into the code below and swallows half a file.
   */
  test("a quotation mark inside a comment opens nothing", () => {
    const source = "// don't\nconst a = \"one\";";
    expect(getTextRangesFromSource(source).map(({ start, end }) => source.slice(start, end))).toEqual([
      '"one"',
    ]);
  });
});

describe("where the patterns are", () => {
  test("a slash after an operator opens one", () => {
    const source = "const pattern = /ab+c/g;";
    expect(
      getRegularExpressionRangesFromSource(source).map(({ start, end }) => source.slice(start, end)),
    ).toEqual(["/ab+c/g"]);
  });

  /** After a value a slash divides, and reading it as a pattern would swallow the line. */
  test("a slash after a value opens nothing", () => {
    expect(getRegularExpressionRangesFromSource("const half = total / 2;")).toEqual([]);
  });

  test("a pattern inside a comment is not one", () => {
    expect(getRegularExpressionRangesFromSource("// = /ab+c/g\nconst a = 1;")).toEqual([]);
  });
});
