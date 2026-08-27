/**
 * The page reader, over markup written for the question.
 *
 * Its callers count what they found — one introduction, two scripts, a class
 * name on both sides — so a reader that stopped finding anything fails them. The
 * cases here are the ones where it finds something and the something is wrong:
 * a tag whose name only starts the same, an attribute another attribute's name
 * ends with, an element nothing closes.
 */

import { describe, expect, test } from "bun:test";
import { getAttributeValues, getElements } from "@/tests/markup-parts.ts";

describe("an element", () => {
  test("carries what is inside its tags", () => {
    expect(getElements("<p>one</p><p>two</p>", "p")).toEqual([
      { attributes: "", text: "one" },
      { attributes: "", text: "two" },
    ]);
  });

  test("carries what stands in its opening tag", () => {
    expect(getElements(`<p class="intro" id="x">one</p>`, "p")).toEqual([
      { attributes: `class="intro" id="x"`, text: "one" },
    ]);
  });

  test("keeps the markup inside it", () => {
    expect(getElements("<p>one <b>two</b></p>", "p")[0]?.text).toBe("one <b>two</b>");
  });

  // The case a prefix match gets wrong: `<script>` and `<scriptx>` are two
  // elements, and a driver handed the wrong one runs somebody else's code.
  test("is not the one whose name only begins the same", () => {
    expect(getElements("<scriptx>one</scriptx><script>two</script>", "script")).toEqual([
      { attributes: "", text: "two" },
    ]);
  });

  test.each(["", "<p>one", "<p", "one</p>"])("%p states none", (markup) => {
    expect(getElements(markup, "p")).toEqual([]);
  });
});

describe("an attribute", () => {
  test("is read wherever it is worn", () => {
    expect(getAttributeValues(`<p class="a"><b class="b c">`, "class")).toEqual(["a", "b c"]);
  });

  test("is a whole word, not the tail of another one", () => {
    expect(getAttributeValues(`<p data-class="a" class="b">`, "class")).toEqual(["b"]);
  });

  test("with nothing closing its value is not read", () => {
    expect(getAttributeValues(`<p class="a`, "class")).toEqual([]);
  });

  test("that is not there answers with nothing", () => {
    expect(getAttributeValues(`<p id="a">`, "class")).toEqual([]);
  });
});
