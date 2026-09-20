/**
 * The two windows put where a page wants them, as script that page runs.
 *
 * Each opens in the middle of the one it is drawn over and neither follows the other, so a page
 * needing them elsewhere moves both. By their own bars, never by a style written onto the host: a
 * card opens on whichever side of the panel has room and reads the position the panel keeps.
 */

import { assert } from "@std/assert";
import { getIntegerFromText } from "@/libs/number-text.ts";
import { PANEL_WINDOW, STANDING_WINDOW } from "@/src/ui/panel-drag.ts";
import { CLASS, PLACE, SPACE } from "@/src/ui/panel-look.ts";
import { PreviewBuildError } from "@/tools/margometer-tool-error.ts";

/** A length the sheet states, as the whole pixels it states it in. */
export function getSheetPixels(stated: string): number {
    assert(stated.endsWith("px"), "a length read off the sheet is stated in pixels");
    const read = getIntegerFromText(stated.slice(0, -2));
    if (read === null) throw new PreviewBuildError(`the sheet states no whole pixels in ${stated}`);
    assert(read > 0, "and a length a page is laid out from is a length");
    return read;
}

/** `DESIGN.md`'s `panelInset`, read off the sheet that states it. */
export const PANEL_INSET = getSheetPixels(PLACE.inset);
/** What the sheet leaves between the panel and the window beside it. */
export const PANEL_GAP = getSheetPixels(SPACE.small);

const STANDING_SELECTOR = `.${CLASS.standing}`;
/** How a window says which grip drags it, and what the host is called: both are the add-on's. */
const GRIP_SELECTOR = "data-grip";
const HOST_NAME = "MargoMeter-Panel";

/**
 * ⚠️ **A pointer this dispatches is not one the browser has**, so a caller takes
 * `setPointerCapture` and its release away around the drag. Measured on Chrome 152.0.7977.64,
 * 2026-09-05: both throw `NotFoundError: No active pointer with the given id is found`, earning
 * two gesture defects the panel then stated in every picture of a set. `src/ui/panel-drag.ts`
 * calls the method through `?.`, so a document offering none is a case it already answers.
 */
export function composeWindowDragging(): string {
    return `var getPanelHost = function () {
  var host = document.getElementById("${HOST_NAME}");
  if (host === null) throw new ReferenceError("there is no panel on this page");
  return host;
};

var getStandingWindow = function () {
  var beside = getPanelHost().shadowRoot.querySelector("${STANDING_SELECTOR}");
  if (beside === null) throw new ReferenceError("there is no window beside the panel");
  return beside;
};

var setWindowDragged = function (name, acrossBy, downBy) {
  var says = '[${GRIP_SELECTOR}="' + name + '"]';
  var bar = getPanelHost().shadowRoot.querySelector(says);
  if (bar === null) throw new ReferenceError(name + " has no bar to take hold of");
  var box = bar.getBoundingClientRect();
  // \`buttons\` and not only \`button\`: a move stating none is a hand that has let go, and a
  // window ends its drag on one (\`src/ui/panel-drag.ts\`). A constructed PointerEvent states 0
  // unless it is asked to, so a move without this leaves the window where it opened — which is a
  // set photographed off centre with nothing about the run looking wrong.
  var setPointer = function (type, left, top) {
    bar.dispatchEvent(new PointerEvent(type, {
      bubbles: true, composed: true, button: 0, buttons: 1, clientX: left, clientY: top
    }));
  };
  setPointer("pointerdown", box.left, box.top);
  setPointer("pointermove", box.left + acrossBy, box.top + downBy);
  setPointer("pointerup", box.left + acrossBy, box.top + downBy);
};`;
}

/**
 * The panel taken to its corner, and the window beside it put where the sheet would have it for a
 * panel in one: on the side the panel leaves, tops level. The second is dragged apart from the
 * first (**ADR 0060**), so a panel cornered alone otherwise leaves it over the middle. Both edges
 * are expressions because the callers measure different things — a picture is taken at a frame the
 * browser may not have opened at, a published page in the window a visitor has, and that page
 * carries a bar along its top that the windows have to start below.
 */
export function composeWindowsCornered(acrossWidth: string, downFrom: string): string {
    assert(acrossWidth.length > 0, "a corner is measured from an edge somebody states");
    assert(downFrom.length > 0, "and from a top edge somebody states as well");
    assert(PANEL_INSET > 0, "and stands off it by what the sheet leaves");
    return `var setPanelInCorner = function () {
  var host = getPanelHost();
  var box = host.getBoundingClientRect();
  var across = ${acrossWidth};
  var down = ${downFrom};
  setWindowDragged("${PANEL_WINDOW}",
    across - ${PANEL_INSET} - box.width - box.left, down - box.top);
};

var setStandingBeside = function () {
  var host = getPanelHost();
  var beside = getStandingWindow();
  var box = beside.getBoundingClientRect();
  var panel = host.getBoundingClientRect();
  setWindowDragged("${STANDING_WINDOW}",
    panel.left - ${PANEL_GAP} - box.width - box.left, panel.top - box.top);
};`;
}
