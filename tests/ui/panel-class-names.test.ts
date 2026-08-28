/**
 * The panel's class names, held to one vocabulary across the two files that spell
 * them.
 *
 * Every class is written twice — as a selector in `src/ui/panel-look.ts`,
 * as a `className` in `src/ui/panel-element.ts` — and until this guard nothing
 * held the two together. Neither file is the owner, which is why this is a
 * cross-check rather than a shared constant: the selectors are the one readable
 * CSS in the tree, and interpolating a constant into every one of them would cost
 * more than the duplication does
 * (`docs/specs/2026-08-18-a-name-we-did-not-choose.md`).
 *
 * ⚠️ **A disagreement here fails silently everywhere else.** A class with no rule
 * draws an unstyled node; a rule with no class styles nothing. The panel still
 * renders, the gate still passes, and the only symptom is something looking
 * slightly wrong to somebody who has the old version to compare against. Both
 * directions were live when this was written: `hidden` was hung on the tooltip
 * under a docblock claiming the stylesheet read it, and the hiding was an inline
 * `display` all along.
 */

import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { composeSourceWithoutComments } from "@/tests/source-regions.ts";
import { composePanelStyleText } from "@/src/ui/panel-look.ts";
import { getAssignedClassNames, getStyledClassNames } from "@/tests/class-names.ts";

/**
 * The stylesheet as it **ships**, and every class the renderer puts on a node.
 *
 * Read from the source rather than from a render: a render only exercises the
 * states it is driven through, and half of these sit on a branch — an empty list,
 * a selected tab, a row that cannot be drilled. Both readers are
 * `tests/class-names.ts`'s, which is where they went when the preview harness
 * turned out to have the same split.
 */
const STYLED = getStyledClassNames(composePanelStyleText());
const ASSIGNED = getAssignedClassNames(
  composeSourceWithoutComments(
    readFileSync(new URL("../../src/ui/panel-element.ts", import.meta.url).pathname, "utf8"),
  ),
);

/**
 * Classes that exist to be found, not to be styled.
 *
 * `sides-of` is how `tests/ui/panel-element.test.ts` picks the side strip out of
 * two strips built by the same code. The stylesheet says in a comment why it has
 * no rule — a sibling selector replaced it, so the name "did not have to become a
 * name for something it is not" — and that reasoning is exactly what leaves a
 * class with a reader and no rule.
 *
 * The list is here rather than in a suppression because the count going up is
 * what somebody should notice: a second unstyled marker is a sign the renderer
 * has grown a structure the tests can only reach by name.
 */
const NAMED_FOR_IDENTIFICATION = ["sides-of"];

describe("the panel's class names", () => {
  /**
   * Both directions, and each is the other's insurance: if either reader above
   * silently stopped matching, its set would empty and the opposite test would
   * fail with every name in it. A guard over two sets cannot be satisfied by
   * finding nothing (§7.5).
   */
  test("there are class names on both sides to compare", () => {
    expect(STYLED.size).toBeGreaterThan(0);
    expect(ASSIGNED.size).toBeGreaterThan(0);
  });

  test("every class the renderer assigns has a rule, or is named for identification", () => {
    const unstyled = [...ASSIGNED]
      .filter((name) => !STYLED.has(name) && !NAMED_FOR_IDENTIFICATION.includes(name))
      .sort();
    expect(unstyled).toEqual([]);
  });

  test("every class the stylesheet styles is assigned", () => {
    const unassigned = [...STYLED].filter((name) => !ASSIGNED.has(name)).sort();
    expect(unassigned).toEqual([]);
  });

  // Otherwise the list above outlives the reason for it: a marker that acquires a
  // rule is no longer a marker, and nobody would ever go back and take it out.
  test("nothing named for identification has quietly acquired a rule", () => {
    expect(NAMED_FOR_IDENTIFICATION.filter((name) => STYLED.has(name))).toEqual([]);
    expect(NAMED_FOR_IDENTIFICATION.filter((name) => !ASSIGNED.has(name))).toEqual([]);
  });
});
