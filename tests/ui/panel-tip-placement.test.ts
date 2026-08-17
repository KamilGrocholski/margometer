/**
 * Where the detail window opens, held without a document.
 *
 * The promise every test here is about: **the whole of it is on the screen**.
 * That is one sentence and four ways to break it, because a window has four
 * edges — and the arithmetic sees none of them, only numbers that have to come
 * out inside the pair it was handed.
 *
 * §7.5's rule about boundaries is why each edge is asked from both sides: the
 * detail is the same detail wherever it opens, so an edge off by one is invisible
 * until somebody drags the panel to a corner and loses the thing they hovered
 * for.
 */

import { describe, expect, test } from "bun:test";
import { getNumberFromText } from "@/libs/number.ts";
import { composeTipDeclarations, type PanelTipBox } from "@/src/ui/panel-tip-placement.ts";
import { composePanelStyleText } from "@/src/ui/panel-stylesheet.ts";
import { PANEL_PIXELS } from "@/src/ui/panel-tokens.ts";

const SCREEN = { width: 1200, height: 800 };
const TIP: PanelTipBox = { width: PANEL_PIXELS.tipWidth, height: 200 };
/** The right-hand corner the panel starts in, where every default hover happens. */
const CORNER = { left: SCREEN.width - PANEL_PIXELS.width - PANEL_PIXELS.space, top: 8 };

/**
 * Back to the screen, which is where the promise is made. The declarations are
 * written against the panel because that is what the detail hangs off, so every
 * test here undoes that the way a browser does.
 */
function getScreenBox(
  declarations: Array<[string, string]>,
  panel: { left: number; top: number },
  tip: PanelTipBox,
) {
  const getLength = (property: string): number => {
    const written = declarations.find(([name]) => name === property)?.[1] ?? "";
    // NaN rather than a zero where nothing was written: a length this test cannot
    // read must fail the comparison rather than pass it as the top left corner.
    return getNumberFromText(written.replace("px", "")) ?? Number.NaN;
  };
  const left = panel.left + getLength("left");
  const top = panel.top + getLength("top");
  return { left, top, right: left + tip.width, bottom: top + tip.height };
}

function expectOnScreen(box: { left: number; top: number; right: number; bottom: number }): void {
  expect(box.left).toBeGreaterThanOrEqual(0);
  expect(box.top).toBeGreaterThanOrEqual(0);
  expect(box.right).toBeLessThanOrEqual(SCREEN.width);
  expect(box.bottom).toBeLessThanOrEqual(SCREEN.height);
}

describe("the whole of the detail is on the screen", () => {
  /**
   * The four corners a panel can be dragged into, and both ends of the window for
   * the pointer — swept rather than reasoned about, because the promise is one
   * sentence and the cases that break it are the ones nobody thought to name.
   *
   * The panel positions include what the drag clamp allows at its most extreme:
   * `src/ui/panel-placement.ts` keeps 64px of panel on screen and no more, so a
   * panel whose own right edge is off the window is a real position and not a
   * contrived one.
   */
  const PANELS = [
    { left: 0, top: 0 },
    { left: 0, top: SCREEN.height - 64 },
    { left: CORNER.left, top: CORNER.top },
    { left: SCREEN.width - 64, top: SCREEN.height - 64 },
    { left: 300, top: 300 },
  ];
  const POINTERS = [0, 1, 8, 400, SCREEN.height - 1, SCREEN.height];
  const TIPS: PanelTipBox[] = [
    { width: 250, height: 1 },
    { width: 250, height: 200 },
    { width: 250, height: 700 },
    { width: 250, height: SCREEN.height - 2 * PANEL_PIXELS.space },
  ];

  for (const panel of PANELS) {
    for (const pointerTop of POINTERS) {
      for (const tip of TIPS) {
        test(`panel ${panel.left},${panel.top} · pointer ${pointerTop} · tip ${tip.height} tall`, () => {
          expectOnScreen(
            getScreenBox(composeTipDeclarations(pointerTop, tip, panel, SCREEN), panel, tip),
          );
        });
      }
    }
  }
});

describe("which side the detail opens on", () => {
  /**
   * The corner the panel starts in, and the same rule read from the other end:
   * there is no room on the panel's right at all — it is against the edge — so
   * the detail is on its left, which is where the whole window is.
   */
  test("the panel's own left, which is where the room is", () => {
    const box = getScreenBox(composeTipDeclarations(400, TIP, CORNER, SCREEN), CORNER, TIP);

    expect(box.right).toBe(CORNER.left - PANEL_PIXELS.spaceSmall);
    expect(CORNER.left + PANEL_PIXELS.width + PANEL_PIXELS.spaceSmall + TIP.width).toBeGreaterThan(
      SCREEN.width,
    );
  });

  /**
   * One pixel short of the margin is a detail hard against the edge of the
   * screen, which is where the flip belongs: the left slot has run out.
   */
  test("the panel's right, where its left has run out", () => {
    const panel = { left: PANEL_PIXELS.tipWidth + PANEL_PIXELS.spaceSmall - 1, top: 8 };
    const box = getScreenBox(composeTipDeclarations(400, TIP, panel, SCREEN), panel, TIP);

    expect(box.left).toBe(panel.left + PANEL_PIXELS.width + PANEL_PIXELS.spaceSmall);
  });

  test("and its left again as soon as the margin fits", () => {
    const panel = { left: PANEL_PIXELS.tipWidth + PANEL_PIXELS.spaceSmall + PANEL_PIXELS.space, top: 8 };
    const box = getScreenBox(composeTipDeclarations(400, TIP, panel, SCREEN), panel, TIP);

    expect(box.right).toBe(panel.left - PANEL_PIXELS.spaceSmall);
  });

  /**
   * ⚠️ The case the first attempt at this got wrong. Near the right-hand edge
   * both candidates are off the screen — and the answer is not to pick the less
   * bad one and leave it there, it is to put the detail where it fits. It
   * overlaps the panel, which is the thing the docked side exists to avoid, and
   * that is the right trade: a window over the row it describes can still be
   * read.
   */
  test("wherever it fits, when neither side of the panel does", () => {
    // Narrow on purpose: a window has to be under about 520px before the panel
    // has room for the detail on neither side of it. It then overlaps the panel,
    // which is the thing the docked side exists to avoid — and the right trade,
    // because a window over the row it describes can still be read.
    const narrow = { width: 500, height: 800 };
    const panel = { left: 100, top: 300 };
    const box = getScreenBox(composeTipDeclarations(400, TIP, panel, narrow), panel, TIP);

    expect(box.left).toBe(PANEL_PIXELS.space);
    expect(box.right).toBeLessThanOrEqual(narrow.width);
  });

  test("a window narrower than the detail leaves it at the near edge", () => {
    const narrow = { width: 100, height: 800 };
    const declarations = composeTipDeclarations(400, TIP, { left: 0, top: 0 }, narrow);

    expect(declarations).toContainEqual(["left", `${PANEL_PIXELS.space}px`]);
  });
});

describe("how far down the detail sits", () => {
  test("it begins at the pointer, which is what ties it to the row it opened from", () => {
    const box = getScreenBox(composeTipDeclarations(300, TIP, CORNER, SCREEN), CORNER, TIP);

    expect(box.top).toBe(300);
  });

  /**
   * ⚠️ **The pointer stays on an edge of the window, and the window turns over.**
   * Sliding it up until it fits would also be on the screen, and it would leave
   * the pointer somewhere in the middle of a detail — against a row it is not
   * describing. This is the same rule as the side above, on the other axis.
   */
  test("and ends at it instead, where there is not room below", () => {
    const box = getScreenBox(composeTipDeclarations(780, TIP, CORNER, SCREEN), CORNER, TIP);

    expect(box.bottom).toBe(780);
    expect(box.top).toBe(780 - TIP.height);
  });

  test("the last height that still opens downward, and the first that turns over", () => {
    const fits = SCREEN.height - PANEL_PIXELS.space - TIP.height;
    expect(getScreenBox(composeTipDeclarations(fits, TIP, CORNER, SCREEN), CORNER, TIP).top).toBe(fits);
    expect(getScreenBox(composeTipDeclarations(fits + 1, TIP, CORNER, SCREEN), CORNER, TIP).bottom).toBe(
      fits + 1,
    );
  });

  test("pushed down where the pointer is above the margin", () => {
    const box = getScreenBox(composeTipDeclarations(0, TIP, CORNER, SCREEN), CORNER, TIP);

    expect(box.top).toBe(PANEL_PIXELS.space);
  });

  /**
   * Neither side of the pointer has room, so the rule that applies is the last
   * one: on the screen, from the edge the design keeps.
   */
  test("neither above nor below, where the detail is nearly the whole window", () => {
    const tall = { width: 250, height: SCREEN.height - 2 * PANEL_PIXELS.space };
    const box = getScreenBox(composeTipDeclarations(400, tall, CORNER, SCREEN), CORNER, tall);

    expect(box.top).toBe(PANEL_PIXELS.space);
    expect(box.bottom).toBe(SCREEN.height - PANEL_PIXELS.space);
  });

  /**
   * ⚠️ **A detail taller than the room has no top that satisfies both edges**, and
   * the one to keep is the top: a window hanging off the bottom still shows what
   * it says first, while one pushed off the top shows nothing but its last line.
   * The stylesheet's own ceiling is what keeps this to the pathological case.
   */
  test("a detail taller than the window keeps its top rather than its bottom", () => {
    const tall = { width: 250, height: 2000 };
    const box = getScreenBox(composeTipDeclarations(400, tall, CORNER, SCREEN), CORNER, tall);

    expect(box.top).toBe(PANEL_PIXELS.space);
  });
});

describe("what is not placed at all", () => {
  /**
   * §9.3: unknown is loud, never zero. Each of these is a page that would not say
   * something, and the answer is the stylesheet's own corner rather than a
   * position computed from a nought — which is what a detail pinned to the top
   * left of the game would be.
   */
  const NOTHING: Array<[string, string]> = [
    ["left", ""],
    ["right", ""],
    ["top", ""],
  ];

  test("a window that never said how big it is", () => {
    expect(composeTipDeclarations(400, TIP, CORNER, null)).toEqual(NOTHING);
  });

  test("a panel whose own corner nothing states", () => {
    expect(composeTipDeclarations(400, TIP, null, SCREEN)).toEqual(NOTHING);
  });

  test("a detail that measured as nothing, which is a document with no layout", () => {
    expect(composeTipDeclarations(400, { width: 0, height: 0 }, CORNER, SCREEN)).toEqual(NOTHING);
  });

  test("and one that measured as nothing on one axis only", () => {
    expect(composeTipDeclarations(400, { width: 250, height: 0 }, CORNER, SCREEN)).toEqual(NOTHING);
    expect(composeTipDeclarations(400, { width: 0, height: 200 }, CORNER, SCREEN)).toEqual(NOTHING);
  });
});

/**
 * ⚠️ **The width is arithmetic, so the drawn box has to be the measured one.**
 * `all: initial` leaves the detail at `content-box`, under which its padding and
 * border sit outside the stated width: it was drawn 268px wide while its
 * placement worked in 250. Measured in Firefox, on the four corners of a 1280x900
 * window.
 *
 * The ceiling is here for the reason above it: without one, a detail longer than
 * the screen is a position the clamp cannot satisfy, and what it gives up is the
 * bottom of the window.
 */
test("the detail is drawn as the box its placement measures", () => {
  const style = composePanelStyleText();
  const start = style.indexOf(".MargoMeter-tip {");
  const rule = style.slice(start, style.indexOf("}", start));

  expect(start).toBeGreaterThanOrEqual(0);
  expect(rule).toContain("box-sizing: border-box");
  expect(rule).toContain(`width: ${PANEL_PIXELS.tipWidth}px`);
  expect(rule).toContain(`max-height: calc(100vh - ${PANEL_PIXELS.space}px - ${PANEL_PIXELS.space}px)`);
});
