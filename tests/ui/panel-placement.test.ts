/**
 * Where the panel is allowed to be, and what a stored position has to prove.
 *
 * No document here at all — that is the point of the split. The arithmetic that
 * decides whether the panel can be dragged off the screen is the part with a
 * wrong answer, and it is checkable on its own.
 */

import { describe, expect, test } from "bun:test";
import {
  composeClampedPosition,
  composeDefaultPosition,
  composeDraggedPosition,
  composePositionDeclarations,
  composeStoredTextFromPosition,
  getPositionFromStoredText,
} from "@/src/ui/panel-placement.ts";
import { PANEL_PIXELS } from "@/src/ui/panel-tokens.ts";

const SCREEN = { width: 1920, height: 1080 };

describe("moving the panel", () => {
  test("a drag translates the panel by what the pointer travelled", () => {
    const grab = { pointerLeft: 500, pointerTop: 300, panelLeft: 1602, panelTop: 8 };
    const moved = composeDraggedPosition(grab, { left: 520, top: 340 }, SCREEN);

    expect(moved).toEqual({ left: 1622, top: 48 });
  });

  test("a drag backwards past the top left stops at the corner", () => {
    const grab = { pointerLeft: 100, pointerTop: 100, panelLeft: 40, panelTop: 20 };
    const moved = composeDraggedPosition(grab, { left: 0, top: 0 }, SCREEN);

    expect(moved).toEqual({ left: 0, top: 0 });
  });

  /**
   * ⚠️ The reason the clamp exists. A panel dragged off the right edge takes its
   * own grab area with it, and the only way back is knowing that this add-on
   * stores a position at all.
   */
  test("a drag off the edge leaves enough panel to grab it back by", () => {
    const grab = { pointerLeft: 900, pointerTop: 500, panelLeft: 900, panelTop: 500 };
    const moved = composeDraggedPosition(grab, { left: 9000, top: 9000 }, SCREEN);

    expect(moved.left).toBeLessThan(SCREEN.width);
    expect(moved.top).toBeLessThan(SCREEN.height);
    expect(SCREEN.width - moved.left).toBeGreaterThanOrEqual(64);
    expect(SCREEN.height - moved.top).toBeGreaterThanOrEqual(64);
  });

  // §9.3: unknown is loud, never zero. A viewport read as 0 would pin the panel
  // to the corner and look exactly like a panel that works.
  test("a page that did not say how big it is clamps nothing", () => {
    const grab = { pointerLeft: 0, pointerTop: 0, panelLeft: 0, panelTop: 0 };
    const moved = composeDraggedPosition(grab, { left: 9000, top: 9000 }, null);

    expect(moved).toEqual({ left: 9000, top: 9000 });
  });

  // Browser zoom hands out fractional coordinates, and a fraction cannot be
  // written back: `composeIntegerText` asserts rather than rounding quietly.
  test("a fractional pointer still yields a position that can be stored", () => {
    const grab = { pointerLeft: 10.5, pointerTop: 10.5, panelLeft: 100, panelTop: 100 };
    const moved = composeDraggedPosition(grab, { left: 20.25, top: 30.75 }, SCREEN);

    expect(Number.isSafeInteger(moved.left)).toBe(true);
    expect(Number.isSafeInteger(moved.top)).toBe(true);
    expect(() => composeStoredTextFromPosition(moved)).not.toThrow();
  });

  test("a viewport narrower than the margin puts the panel at the corner rather than off it", () => {
    expect(composeClampedPosition({ left: 500, top: 500 }, { width: 30, height: 20 })).toEqual({
      left: 0,
      top: 0,
    });
  });

  test("the corner the stylesheet draws is the corner the first drag starts from", () => {
    expect(composeDefaultPosition(SCREEN)).toEqual({
      left: SCREEN.width - PANEL_PIXELS.width - PANEL_PIXELS.space,
      top: PANEL_PIXELS.space,
    });
  });

  test("without a viewport there is no telling where a right-anchored panel is", () => {
    expect(composeDefaultPosition(null)).toBeNull();
  });

  test("a position releases the corner it was anchored to", () => {
    expect(composePositionDeclarations({ left: 12, top: 34 })).toEqual([
      ["left", "12px"],
      ["top", "34px"],
      ["right", "auto"],
    ]);
  });
});

/**
 * §9.6: state that survives a reload is validated on read, never trusted raw.
 * Everything below is text a person can edit and a browser can truncate.
 */
describe("what a stored position has to be", () => {
  test("what was written reads back", () => {
    const position = { left: 640, top: 12 };
    const text = composeStoredTextFromPosition(position);

    expect(getPositionFromStoredText(text)).toEqual(position);
  });

  test.each([
    ["not JSON at all", "left=10"],
    ["truncated", '{"left":10,"to'],
    ["a fraction", '{"left":10.5,"top":10}'],
    ["a number as text", '{"left":"10","top":10}'],
    ["missing a field", '{"left":10}'],
    ["null", "null"],
    ["an array", "[10,20]"],
    ["a bare number", "12"],
    ["past what a number holds exactly", '{"left":90071992547409911,"top":10}'],
  ])("%s is no position at all", (_reason, text) => {
    expect(getPositionFromStoredText(text)).toBeNull();
  });

  // A field nobody asked for is not a reason to throw away a position that is
  // otherwise readable — the two we need are both there and both integers.
  test("a field we do not know is ignored rather than fatal", () => {
    expect(getPositionFromStoredText('{"left":10,"top":20,"width":999}')).toEqual({
      left: 10,
      top: 20,
    });
  });

  test("a number that cannot be written back is refused rather than mangled", () => {
    expect(() => composeStoredTextFromPosition({ left: 0.5, top: 0 })).toThrow();
  });
});
