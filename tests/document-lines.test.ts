/**
 * The heading reader, over lines written for the question.
 *
 * The other two readers here are held by their callers: an audit's guard asserts
 * a `Status:` line is found and reads what it says, so one that stopped finding
 * it fails loudly. The heading reader is the one that can be wrong quietly — its
 * callers compare one document's headings against another's, and two empty runs
 * are equal. Only the cases where the answer is a number, or is deliberately
 * nothing, hold it.
 */

import { describe, expect, test } from "bun:test";
import { getHeadingDepth } from "@/tests/document-lines.ts";

describe("how deep a heading is", () => {
  test.each([
    ["# one", 1],
    ["## one", 2],
    ["###### one", 6],
    ["## one two", 2],
    ["## `code`", 2],
  ])("%p is %p deep", (line, depth) => {
    expect(getHeadingDepth(line)).toBe(depth);
  });

  /**
   * Seven marks is past what Markdown has, a mark with no space is a hashtag, a
   * line of marks alone is how a document draws a rule, and an indented one is
   * inside something else — a list item or a fenced block.
   */
  test.each(["", "#", "####### one", "#one", "## ", "##  one", " ## one", "text"])(
    "%p is not a heading",
    (line) => {
      expect(getHeadingDepth(line)).toBeNull();
    },
  );
});
