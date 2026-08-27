/**
 * The source reader, over source written for the question.
 *
 * ⚠️ **Its callers cannot hold it, and that is the whole reason this file
 * exists.** Every guard reading it asserts that what it found is an empty
 * list — no relative import, no call of a construct somebody else owns — so a
 * reader that quietly found nothing at all would leave the gate green while the
 * rules it stands for stopped being checked. §7.5 states the shape: a negative
 * assertion holds its subject only where the answer is sometimes yes.
 */

import { describe, expect, test } from "bun:test";
import { getCallSites, getImportSpecifiers, hasCall } from "@/tests/source-search.ts";

/**
 * ⚠️ Assembled rather than written, for the reason `tests/tools/cited-paths.test.ts`
 * assembles a path that is gone: a relative specifier spelled whole in this file
 * is one `tests/tools/source-layout.test.ts` reads as this file importing it.
 */
const RELATIVE = [".", "/sibling.ts"].join("");

describe("what a source imports", () => {
  test("is every specifier, in the order they are written", () => {
    const source = [
      `import { a } from "@/libs/number.ts";`,
      `import b from "node:fs";`,
      `export { c } from "${RELATIVE}";`,
    ].join("\n");

    expect(getImportSpecifiers(source)).toEqual(["@/libs/number.ts", "node:fs", RELATIVE]);
  });

  // The keyword has to stand alone. This is a text search rather than a parser
  // (`tests/source-search.ts` says so), so the boundary is the whole of what
  // tells the keyword from a word ending in it — and a word ending in it is what
  // would otherwise put a specifier nobody wrote into the list.
  test.each([`const wherefrom "x";`, `const said = "x";`, ``])("%p imports nothing", (source) => {
    expect(getImportSpecifiers(source)).toEqual([]);
  });

  test("stops where a quote is never closed", () => {
    expect(getImportSpecifiers(`import { a } from "@/libs/number.ts`)).toEqual([]);
  });
});

describe("where a name is called", () => {
  test("is every site, whatever whitespace was written", () => {
    expect(getCallSites(`Total(1); Total (2);`, "Total")).toEqual([0, 10]);
  });

  // A name a longer word carries is not the name, and a name with no bracket
  // after it is a mention rather than a call.
  test.each([`myTotal(1)`, `Totals(1)`, `Total;`, `Total`, ``])("%p calls it nowhere", (source) => {
    expect(hasCall(source, "Total")).toBe(false);
  });

  test("a member is found after the value it hangs off", () => {
    expect(hasCall(`x.write(1)`, ".write")).toBe(true);
    expect(hasCall(`x.writeLater(1)`, ".write")).toBe(false);
  });
});
