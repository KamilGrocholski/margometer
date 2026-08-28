/**
 * The arithmetic §9.7 turns on, held directly.
 *
 * `tests/ui/panel-element.test.ts` already measures every bar against WCAG AA in the
 * role it is actually drawn in, which is the check that matters to a reader. What it
 * cannot reach is what happens when a colour **cannot be measured at all**, because it
 * only ever hands this module colours that can be — and that is where the defect was:
 * `getProfessionInk` read `getContrastRatio(…) ?? 0` on both sides, so two unmeasurable
 * colours became `0` and `0`, `0 >= 0` chose dark ink, and a badge nobody had measured
 * shipped as confidently as one that had been.
 *
 * §9.3 puts it in one line — unknown is loud, never zero — and §9.5's last table row
 * names the substitution as the failure this project exists to prevent. It was in the
 * one function that decides whether a label can be read.
 *
 * This file is also the first test `src/ui/panel-look.ts` has had of its own, which the
 * same audit raises separately as F11. That finding names five modules and this closes
 * none of it: what is here is the surface F5 turns on.
 */

import { describe, expect, test } from "bun:test";
import { AssertionFailure } from "@/libs/assert.ts";
import { getPartsSeparatedByWhitespace } from "@/libs/text-runs.ts";
import { getClassNamesFromSelector, getDeclarations, getStyleRules } from "@/tests/style-rules.ts";
import { MargoMeterError } from "@/src/core/margometer-error.ts";
import {
  composePanelStyleText,
  getContrastRatio,
  getProfessionColour,
  getProfessionInk,
  PANEL_TOKENS,
  PROFESSION_COLOURS,
  UNKNOWN_COLOUR,
} from "@/src/ui/panel-look.ts";

/** Every colour the panel can actually hand the ink chooser. */
const DRAWN_COLOURS = [...Object.values(PROFESSION_COLOURS), UNKNOWN_COLOUR];

describe("choosing the ink for a badge", () => {
  test("there are colours to choose against", () => {
    expect(DRAWN_COLOURS.length).toBeGreaterThan(1);
  });

  /**
   * The choice, restated as the measurement rather than as the answer: whichever
   * ink measures higher on that colour is the one that comes back. Written this
   * way so it cannot agree with a bug the way a tabulated expectation would —
   * the point of computing the ink at all is that a table drifts.
   */
  test("picks whichever ink measures better on that colour", () => {
    for (const colour of DRAWN_COLOURS) {
      const dark = getContrastRatio(PANEL_TOKENS.badgeInkDark, colour);
      const light = getContrastRatio(PANEL_TOKENS.badgeInkLight, colour);
      expect(dark, colour).not.toBeNull();
      expect(light, colour).not.toBeNull();
      const better = (dark ?? 0) >= (light ?? 0) ? PANEL_TOKENS.badgeInkDark : PANEL_TOKENS.badgeInkLight;
      expect(getProfessionInk(colour), colour).toBe(better);
    }
  });

  /**
   * Both inks are used, which is what makes the computation load-bearing rather
   * than an elaborate way of always answering the same thing. §9.7's floor is
   * what costs it: at one profession's colour even pure black falls short of
   * what the other ink reaches, so no single ink works for all six.
   */
  test("and both of them come out somewhere", () => {
    const chosen = new Set(DRAWN_COLOURS.map(getProfessionInk));
    expect([...chosen].sort()).toEqual(
      [PANEL_TOKENS.badgeInkDark, PANEL_TOKENS.badgeInkLight].sort(),
    );
  });

  /**
   * The one the `?? 0` swallowed. A colour that cannot be measured is not a
   * colour that scores zero, and the two must not share an answer.
   */
  test("refuses a colour it cannot measure rather than inking it anyway", () => {
    for (const unreadable of ["", "red", "#fff", "#12345g", "rgb(1,2,3)"]) {
      expect(() => getProfessionInk(unreadable), unreadable).toThrow(AssertionFailure);
    }
  });

  /**
   * ⚠️ **An assertion and not a domain error, on purpose** (§9.5). Every colour
   * that reaches this function is one of ours — `getProfessionColour` answers
   * out of `PROFESSION_COLOURS` or `UNKNOWN_COLOUR`, both declared beside it — so
   * a colour that cannot be read means a token in that file is malformed. Nobody
   * can handle that, so it gets no `code`, and a `catch` testing for a domain
   * failure must not swallow it.
   */
  test("throws the kind of failure nobody is meant to handle", () => {
    let thrown: unknown = null;
    try {
      getProfessionInk("not a colour");
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(AssertionFailure);
    expect(thrown).not.toBeInstanceOf(MargoMeterError);
    expect((thrown as AssertionFailure).name).toBe("MargoMeter/Assertion");
  });

  // The join the panel actually makes: what the view puts on a row is what this
  // is asked about, so an unnamed profession has to survive the round trip.
  test("every colour the view can produce is one it can measure", () => {
    for (const profession of [...Object.keys(PROFESSION_COLOURS), null, "no such profession"]) {
      expect(() => getProfessionInk(getProfessionColour(profession)), String(profession)).not.toThrow();
    }
  });
});

/**
 * The pin's box, held apart from the glyph inside it.
 *
 * ⚠️ **The bug this exists for is a row that moves when you press it.** The mark
 * is ★ pinned and ☆ not, and how wide either comes out is the platform's answer
 * rather than ours — `system-ui` is a different font on every one of them. So the
 * box states its own size and the pinned rule is allowed to change ink and
 * nothing else. Neither half is visible to a fake document, which has no layout
 * at all; what a machine can hold is the stylesheet, and this holds it.
 */
describe("the pin on a kept fight's row", () => {
  /**
   * One rule's declarations, by its selector, off the one string the panel styles
   * with.
   *
   * The first rule whose selector **ends** with what was asked: a rule may be
   * reached through an ancestor, and `.row-pin` is not `.row-pin.pinned`.
   */
  function getDeclarationsOf(selector: string): string[] {
    const rule = getStyleRules(composePanelStyleText()).find((one) =>
      one.selector.endsWith(selector),
    );
    expect(rule, selector).toBeDefined();
    return getDeclarations(rule?.body ?? "").map(
      (declaration) => `${declaration.property}: ${declaration.value}`,
    );
  }

  test("states a size of its own rather than taking the glyph's", () => {
    const declarations = getDeclarationsOf(".row-pin");
    expect(declarations).toContain(`width: ${PANEL_TOKENS.rowHeight}`);
    expect(declarations).toContain("flex: none");
    expect(declarations).toContain("align-self: stretch");
  });

  test("says it is pinned in ink, and moves no edge doing it", () => {
    expect(getDeclarationsOf(".row-pin.pinned")).toEqual([`color: ${PANEL_TOKENS.text}`]);
  });
});

/**
 * ⚠️ **What the rule above could not see, and what actually moved the row.**
 *
 * The pin's state class was `pinned`, and so was the class on the block a pinned
 * row stands in under the ranking. Two constructs, one word: `.row-pin.pinned`
 * declared a colour and nothing else, and the pin still jumped seven pixels right
 * and lost four of its height the moment it was pressed, because `.pinned`
 * carried `margin: 4px 7px 0` and `padding: 4px 0 7px` for somebody else. Measured
 * in Firefox on 2026-08-26: `left=604 w=18 h=18` unpinned, `left=611 w=18 h=14`
 * pinned, on a row that never moved.
 *
 * Neither a reader of the stylesheet nor `tests/class-names.ts` could see it —
 * that one asks whether every class styled is assigned and every class assigned
 * is styled, and both were, twice over. What tells the two apart is the *shape*
 * of the selector: a word that modifies something (`.row.chosen`, `.tab.selected`)
 * is a state, and a word that stands alone (`.list`, `.sides-region`) is a thing.
 * A word doing both is one construct silently inheriting another's box.
 *
 * The region was renamed rather than the state, because `sides-region` sits
 * directly beside it and was already spelling the convention.
 */
describe("a word the stylesheet uses for a state", () => {
  test("is never also a thing with a box of its own", () => {
    const style = composePanelStyleText();
    const lone = new Set<string>();
    const modifiers = new Map<string, string>();

    for (const rule of getStyleRules(style)) {
      for (const one of rule.selector.split(",")) {
        for (const part of getPartsSeparatedByWhitespace(one)) {
          const classes = getClassNamesFromSelector(part);
          if (classes.length === 1) lone.add(classes[0] ?? "");
          // The tail is the modifier: `.row.chosen` styles a row that is chosen.
          if (classes.length > 1) modifiers.set(classes[classes.length - 1] ?? "", part);
        }
      }
    }

    // Both halves are worth stating: a run that found no compound selector at all
    // would pass this saying nothing, which is the shape of a guard that has
    // stopped guarding (§7.5).
    expect(modifiers.size).toBeGreaterThan(1);
    expect([...modifiers].filter(([name]) => lone.has(name))).toEqual([]);
  });
});
