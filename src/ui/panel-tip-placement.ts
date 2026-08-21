import { composeDecimalText } from "@/libs/number.ts";
import type { PanelPosition, PanelViewport } from "@/src/ui/panel-placement.ts";
import { PANEL_PIXELS } from "@/src/ui/panel-look.ts";

/**
 * Where the detail window opens, as a value.
 *
 * Its own file rather than an addition to `src/ui/panel-placement.ts`: that one
 * owns where the *panel* sits — the corner it starts in, where a drag lands, what
 * a remembered position has to prove — and all of it outlives a fight. This owns
 * one hover, has no memory and reaches no storage.
 *
 * ⚠️ **The detail's own size is an argument, and it has to be a measured one.**
 * This was built once without it, keeping the window inside the screen by
 * flipping it above the pointer and capping its height, and it shipped and was
 * wrong: a cap does not move a window, it *cuts* it, and rows that are not drawn
 * are no more readable than rows off the edge — less, because nothing says they
 * are missing. The first incarnation of this add-on measured for the same reason
 * and wrote down why: a detail's height rises with the number of rows in it, so
 * there is no constant to put here.
 *
 * What is different from that one, and deliberately: the panel is the anchor
 * rather than the row, the pointer's own height is what the window opens at, and
 * the side it prefers is the panel's left — the panel lives in the right-hand
 * corner, so that is where the room is.
 */

/** What the detail came out as, measured after it was filled. */
export type PanelTipBox = { width: number; height: number };

/**
 * The style declarations that put the detail there, in the host's own
 * coordinates — the detail is positioned against the panel, and the panel is
 * what placement already knows the screen position of.
 *
 * **A null viewport or an unmeasurable detail places nothing**: both declarations
 * come back empty, which returns the window to where the stylesheet puts it. That
 * is §9.3's rule and `composeClampedPosition`'s — a page that would not say how
 * big it is must not be read as a page with no room in it.
 */
export function composeTipDeclarations(
  pointerTop: number,
  tip: PanelTipBox,
  panel: PanelPosition | null,
  viewport: PanelViewport | null,
): Array<[string, string]> {
  if (panel === null || viewport === null || tip.height <= 0 || tip.width <= 0) {
    return [
      ["left", ""],
      ["right", ""],
      ["top", ""],
    ];
  }

  const gap = PANEL_PIXELS.spaceSmall;
  const margin = PANEL_PIXELS.space;

  /**
   * Across: the panel's left while it fits there, its right when it does not.
   *
   * The left is the side the design chose and the side the room is on — the panel
   * starts in the right-hand corner. The rule is symmetric all the same, because
   * the panel is draggable and either side can be the one that has run out.
   */
  const left = getValueWithin(
    getStart(panel.left - tip.width - gap, panel.left + PANEL_PIXELS.width + gap, tip.width, viewport.width, margin),
    margin,
    viewport.width - tip.width - margin,
  );

  /**
   * Down: the detail begins at the pointer while there is room below it, and
   * **ends** at the pointer when there is not. The cursor is on one edge of the
   * window either way, which is what ties it to the row it was opened from —
   * sliding it up until it fits instead would leave the pointer somewhere in its
   * middle, against a row it is not describing.
   */
  const top = getValueWithin(
    getStart(pointerTop, pointerTop - tip.height, tip.height, viewport.height, margin),
    margin,
    viewport.height - tip.height - margin,
  );

  return [
    // Written against the panel, because that is what the detail is a child of.
    // Both edges would otherwise be pinned — the stylesheet anchors it by `right`,
    // and a `left` beside that one is a box stretched between the two.
    ["left", composePixelText(left - panel.left)],
    ["right", "auto"],
    ["top", composePixelText(top - panel.top)],
  ];
}

/**
 * One edge of the detail, on whichever side of the pointer or the panel it fits.
 *
 * The same function on both axes, because it is the same rule: the side the
 * design prefers while there is room for it there, the opposite side when there
 * is not. Where **neither** fits — a window narrower than panel and detail
 * together, a detail longer than the screen — it hands back the preferred side
 * and leaves the clamp to decide, which is the one answer that is still on the
 * screen.
 */
function getStart(
  preferred: number,
  opposite: number,
  size: number,
  limit: number,
  margin: number,
): number {
  if (getIsWithin(preferred, size, limit, margin)) return preferred;
  if (getIsWithin(opposite, size, limit, margin)) return opposite;
  return preferred;
}

function getIsWithin(start: number, size: number, limit: number, margin: number): boolean {
  return start >= margin && start + size <= limit - margin;
}

/**
 * ⚠️ **The low edge wins where the two cross.** A detail taller than the room can
 * be given no top that satisfies both, and the one to keep is the top: a window
 * hanging off the bottom of the screen still shows what it says first, while one
 * pushed off the top shows nothing but its last line.
 */
function getValueWithin(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), Math.max(low, high));
}

/**
 * Whole pixels: `clientY` is fractional on a scaled display, and a detail half a
 * pixel higher is not a thing anybody can see — a declaration reading
 * `292.33333333333px` is
 * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F17).
 */
function composePixelText(value: number): string {
  return `${composeDecimalText(value, 0)}px`;
}
