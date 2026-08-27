/**
 * The stylesheet reader, over sheets written for the question rather than over
 * the panel's.
 *
 * Its three callers all compare two sets and assert both are non-empty, so a
 * reader that quietly stopped finding rules fails them loudly. What none of them
 * can see is the shape of what it found: a comment left in a selector, a class
 * name cut one character short, a rule whose body ran into the next one. Those
 * are here.
 */

import { describe, expect, test } from "bun:test";
import {
  composeStyleWithoutComments,
  getClassNamesFromSelector,
  getDeclarations,
  getStyleRules,
} from "@/tests/style-rules.ts";

describe("the comments", () => {
  test("go, and take nothing beside them", () => {
    expect(composeStyleWithoutComments(".a { /* why */ color: red }")).toBe(
      ".a {  color: red }",
    );
  });

  /**
   * ⚠️ **A comment that never closes takes the rest of the sheet**, which is what
   * a browser's parser does with one and what the pattern this replaced did not:
   * it left the whole tail in place, so every rule after a comment somebody
   * forgot to close read as a selector.
   */
  test("an unterminated one runs to the end", () => {
    expect(composeStyleWithoutComments(".a { } /* .b { }")).toBe(".a { } ");
  });
});

describe("the rules", () => {
  test("are the selector and what is inside the braces", () => {
    expect(getStyleRules(".a { color: red } .b { color: blue }")).toEqual([
      { selector: ".a", body: " color: red " },
      { selector: ".b", body: " color: blue " },
    ]);
  });

  test("carry a selector with its whitespace off both ends", () => {
    expect(getStyleRules("\n  .a,\n  .b {\n  color: red;\n}\n")[0]?.selector).toBe(".a,\n  .b");
  });

  // Text with no brace after it is not a rule, and a brace with nothing closing
  // it is not either — both are how a half-written sheet reaches this.
  test.each(["", ".a", ".a {", "}"])("%p states none", (css) => {
    expect(getStyleRules(css)).toEqual([]);
  });
});

describe("the classes in a selector", () => {
  test("come back in the order the selector names them", () => {
    expect(getClassNamesFromSelector(".row.chosen")).toEqual(["row", "chosen"]);
    expect(getClassNamesFromSelector(".chosen.row")).toEqual(["chosen", "row"]);
  });

  test("carry the characters a class name is written with", () => {
    expect(getClassNamesFromSelector(".sides-region_2 .tab")).toEqual(["sides-region_2", "tab"]);
  });

  // A dot is not always a class: a decimal in a length and a pseudo-class both
  // carry one, and neither names anything the renderer assigns.
  test.each([".9a", "a:hover", "0.5rem", "", ".", ":root"])("%p names none", (selector) => {
    expect(getClassNamesFromSelector(selector)).toEqual([]);
  });
});

describe("what a rule declares", () => {
  test("is each property and the value it is given", () => {
    expect(getDeclarations(" color: red; margin: 4px 7px 0; ")).toEqual([
      { property: "color", value: "red" },
      { property: "margin", value: "4px 7px 0" },
    ]);
  });

  // A colon inside a value is the value's, not a second declaration's.
  test("keeps a value that carries a colon of its own", () => {
    expect(getDeclarations("background: url(data:image/png)")).toEqual([
      { property: "background", value: "url(data:image/png)" },
    ]);
  });

  test.each(["", "color", ";;", "  ", "* zoom: 1"])("%p declares nothing", (body) => {
    expect(getDeclarations(body)).toEqual([]);
  });
});
