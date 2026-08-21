import { getValueFromJsonText } from "@/libs/json.ts";
import { getRecordFromValue } from "@/libs/record.ts";
import { composeIntegerText, getIntegerFromValue } from "@/libs/number.ts";
import { PANEL_PIXELS } from "@/src/ui/panel-look.ts";

/**
 * Where the panel sits, as a value.
 *
 * Split from `src/ui/panel-element.ts` for the same reason `src/ui/panel-view.ts`
 * is: none of this needs a document, so all of it can be checked without one. The
 * drawing half only ever writes what this half decided.
 */

export type PanelPosition = { left: number; top: number };

/** What the panel is being clamped against. Null where the page did not say. */
export type PanelViewport = { width: number; height: number };

/** Where the pointer and the panel each were when the drag began. */
export type PanelGrab = {
  pointerLeft: number;
  pointerTop: number;
  panelLeft: number;
  panelTop: number;
};

/**
 * How much of the panel stays on screen, whatever the drag asks for.
 *
 * ⚠️ **A panel dragged off the edge cannot be dragged back.** The grab area goes
 * with it, so the only remedy left is clearing storage — which means knowing this
 * add-on stores anything. The number is a title bar's worth of width and a title
 * bar's worth of height, so what remains reachable is the thing you grab.
 */
const MINIMUM_VISIBLE = 64;

/**
 * A position the viewport can actually show.
 *
 * A null viewport clamps nothing. §9.3: unknown is loud, never zero — a missing
 * `innerWidth` read as `0` would pin the panel to the corner and look exactly
 * like a panel that works.
 */
export function composeClampedPosition(
  position: PanelPosition,
  viewport: PanelViewport | null,
): PanelPosition {
  if (viewport === null) {
    return { left: Math.round(position.left), top: Math.round(position.top) };
  }
  return {
    left: getValueWithin(position.left, viewport.width - MINIMUM_VISIBLE),
    top: getValueWithin(position.top, viewport.height - MINIMUM_VISIBLE),
  };
}

/**
 * Zero and `limit` both included, and zero wins a viewport smaller than the
 * margin — a limit below zero would otherwise put the panel off the top left.
 */
function getValueWithin(value: number, limit: number): number {
  return Math.round(Math.max(0, Math.min(value, Math.max(0, limit))));
}

/**
 * Where the stylesheet has already put the panel, as a position.
 *
 * The corner is expressed as `top` and `right`, so nothing can read a `left` off
 * the host until something writes one — the first grab has to derive it, from the
 * same two numbers the stylesheet was built from (`PANEL_PIXELS`). Null where the
 * page did not say how wide it is: a drag that started from a guess would snatch
 * the panel out from under the hand, and not moving is the better of the two.
 */
export function composeDefaultPosition(viewport: PanelViewport | null): PanelPosition | null {
  if (viewport === null) return null;
  return composeClampedPosition(
    { left: viewport.width - PANEL_PIXELS.width - PANEL_PIXELS.space, top: PANEL_PIXELS.space },
    viewport,
  );
}

/** Where the panel lands, given where it was grabbed and where the pointer is now. */
export function composeDraggedPosition(
  grab: PanelGrab,
  pointer: { left: number; top: number },
  viewport: PanelViewport | null,
): PanelPosition {
  return composeClampedPosition(
    {
      left: grab.panelLeft + (pointer.left - grab.pointerLeft),
      top: grab.panelTop + (pointer.top - grab.pointerTop),
    },
    viewport,
  );
}

/**
 * A stored position, or null for anything that is not one.
 *
 * §9.6: state that survives a reload is validated on read. Everything here comes
 * back from text a person can edit and a browser can truncate, so nothing is
 * trusted — an absent field, a fraction, a number as a string and a whole other
 * shape all read the same, which is *no position*, which is the default corner.
 */
export function getPositionFromStoredText(text: string): PanelPosition | null {
  const reading = getValueFromJsonText(text);
  if (reading.syntaxError !== null) return null;

  const fields = getRecordFromValue(reading.value);
  if (fields === null) return null;

  const left = getIntegerFromValue(fields["left"]);
  const top = getIntegerFromValue(fields["top"]);
  if (left === null || top === null) return null;
  return { left, top };
}

/**
 * Written by hand rather than with `JSON.stringify`, which turns a `NaN` into
 * `null` without saying so — and a position that quietly stops round-tripping is
 * the silent failure this project is built against. `composeIntegerText` asserts
 * instead (§9.5: reading returns null, writing asserts).
 */
export function composeStoredTextFromPosition(position: PanelPosition): string {
  return `{"left":${composeIntegerText(position.left)},"top":${composeIntegerText(position.top)}}`;
}

/**
 * The style declarations that put the panel there.
 *
 * `right: auto` is what releases the default corner: the stylesheet anchors the
 * host top-right, and a `left` alone would leave both edges pinned and stretch
 * the host across the page.
 *
 * ⚠️ **`--MargoMeter-panel-top` is the same number as `top`, written twice on
 * purpose.** The ceiling that keeps the panel above the bottom of the screen is
 * the window's height less where the panel's top edge is, and CSS cannot read a
 * `top` back out of an inline style. Composed here from one variable so the two
 * cannot drift, and `top` stays a declaration of its own because an inline style
 * is the one thing the game's stylesheet cannot outrank — a custom property alone
 * would put the panel's own position within reach of the page.
 *
 * The prefix is not decoration: this is the one custom property of ours written
 * onto a node in the game's own document, so it is the one that has to say whose
 * it is (§9.6).
 */
export function composePositionDeclarations(position: PanelPosition): Array<[string, string]> {
  const top = `${composeIntegerText(position.top)}px`;
  return [
    ["left", `${composeIntegerText(position.left)}px`],
    ["top", top],
    ["--MargoMeter-panel-top", top],
    ["right", "auto"],
  ];
}
