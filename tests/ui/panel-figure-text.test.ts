/**
 * A number as the panel writes it, in both spellings.
 *
 * The figure had one test through the view — that a five-digit total is spaced —
 * and the share had none, in the file whose whole reason for existing is that the
 * two used to be spelled differently in two places and printed `39362,0/t` beside
 * `354 258` on one row.
 */

import { describe, expect, test } from "bun:test";
import { composeFigureText, composeShareText } from "@/src/ui/panel-figure-text.ts";

describe("a figure", () => {
  test("is spaced every three digits from the right", () => {
    expect(composeFigureText(354258)).toBe("354 258");
    expect(composeFigureText(1000)).toBe("1 000");
    expect(composeFigureText(1234567)).toBe("1 234 567");
  });

  // Both sides of where the spacing starts: three digits are not spaced and four
  // are, so the rule cannot be reading the wrong end of the number.
  test("is left alone below a thousand", () => {
    expect(composeFigureText(999)).toBe("999");
    expect(composeFigureText(1)).toBe("1");
    expect(composeFigureText(0)).toBe("0");
  });

  // A figure is whole on screen because a fraction of a point is not a reading the
  // protocol ever states — but the arithmetic that reaches here divides.
  test("is rounded, never truncated", () => {
    expect(composeFigureText(1.4)).toBe("1");
    expect(composeFigureText(1.5)).toBe("2");
    expect(composeFigureText(999.6)).toBe("1 000");
  });
});

describe("a share", () => {
  test("is a whole percentage", () => {
    expect(composeShareText(0.5)).toBe("50%");
    expect(composeShareText(1)).toBe("100%");
    expect(composeShareText(0.067)).toBe("7%");
  });

  /**
   * Zero is a reading and says so. A bracket reading `(0%)` beside a real figure is
   * the fault §9.6 forbids twice over — but that is the caller's decision to draw
   * one at all, and this must not quietly turn a zero into anything else.
   */
  test("says zero where the share is zero", () => {
    expect(composeShareText(0)).toBe("0%");
  });

  /**
   * And says *small* where the share is small, which is neither of the two.
   *
   * ⚠️ **Both sides of the boundary, and zero is the boundary** (§7.5). A share
   * that rounds down to nothing printed `0%` beside a real figure — eleven ranked
   * rows over the captures as they stand, 1 741 dealt on
   * `tests/captured-fights/2026-08-15-tempest-grupa-vs-draugr-1.json` among them.
   * The first assertion below is what zero must keep saying, the last is where
   * rounding takes over again.
   */
  test("says below a point where the share rounds to nothing but is not nothing", () => {
    expect(composeShareText(0)).toBe("0%");
    expect(composeShareText(0.000001)).toBe("<1%");
    expect(composeShareText(0.004)).toBe("<1%");
    expect(composeShareText(0.005)).toBe("1%");
  });

  // Above one is possible arithmetic and was once printed: 320% under a filtered
  // received screen. It is written as it is, so a wrong denominator shows.
  test("is not clamped", () => {
    expect(composeShareText(3.2)).toBe("320%");
  });
});
