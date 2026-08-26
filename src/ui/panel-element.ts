/**
 * The panel, drawn.
 *
 * Everything decided is in `panel-view.ts`; this puts it on screen and does as
 * little thinking as it can. The document arrives as an argument for the same
 * reason the engine does in `src/game/` — there is no DOM in the test runner, and
 * the properties §9.6 demands are exactly the ones worth checking.
 *
 * Four of those properties are structural rather than incidental, and each is
 * visible in the shape of the code below:
 *
 *   - a region that throws takes only itself down;
 *   - a handler that throws does not escape into the page;
 *   - every control on the panel is served by listeners at one root, keyed by
 *     node identity, so a redraw cannot lose one — and every control the render
 *     draws answers to a *press*, so a redraw cannot lose the gesture either;
 *   - nothing here can interrupt — no dialog, no focus taken, nothing that moves
 *     unless a hand is moving it.
 *
 * ⚠️ **The first section below touches no document at all, and that is not an
 * accident of layout.** Where the panel sits and where a detail window opens are
 * values — a corner, a clamp, a drag, a remembered position that has to prove
 * itself, a tip kept inside a screen it is handed the size of. They were their
 * own two files so they could be checked without a DOM; they still can be, since
 * nothing here reaches for a document and every function that needs one takes it
 * as an argument (§9.9). What the split cost was a reader having to hold three
 * files to answer where the panel is.
 */

import { getValueFromJsonText } from "@/libs/json.ts";
import { getRecordFromValue } from "@/libs/record.ts";
import {
  composeDecimalText,
  composeIntegerText,
  getFiniteNumberFromValue,
  getIntegerFromValue,
} from "@/libs/number.ts";
import {
  composePanelStyleText,
  getProfessionInk,
  PANEL_PIXELS,
  PANEL_TOKENS,
  UNKNOWN_COLOUR,
} from "@/src/ui/panel-look.ts";

import {
  BACK_ROW_KEY,
  type PanelDetailLine,
  type PanelList,
  type PanelMetric,
  type PanelRow,
  type PanelTeam,
  type PanelView,
  type PanelWaiting,
} from "@/src/ui/panel-screen.ts";
import { ROW_WARNING_MARK } from "@/src/ui/panel-words.ts";
import { USERSCRIPT_VERSION } from "@/src/userscript-version.ts";

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
  const left = getValueBetween(
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
  const top = getValueBetween(
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
 *
 * ⚠️ **Not `getValueWithin` above, and the two were one name until they met in
 * one file.** That one clamps a panel corner into `[0, limit]` and rounds; this
 * one clamps a tip edge into `[low, high]` and does not. Both were private to
 * their own module and both were right there; folding the modules made the
 * collision visible, and the compiler refused it rather than picking one.
 */
function getValueBetween(value: number, low: number, high: number): number {
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

/**
 * What an event hands us. The target is what a gesture needs, and that is the
 * whole point: listeners at one root can serve every control on the panel if they
 * can tell which one was hit (§9.6).
 *
 * The rest is what a drag needs, and all of it is optional because a press
 * carries none of it — a pointer event that arrives without coordinates moves
 * nothing rather than moving somewhere nobody asked for.
 */
export type PanelEvent = {
  target: unknown;
  /**
   * What the pointer is arriving at, where `target` is what it is leaving.
   *
   * `unknown` for the reason `target` is: this file compares node identity and
   * never reaches into a node it was handed by an event.
   *
   * Optional like the rest, and the one that is absent says something — a pointer
   * leaving the window names nothing it went to, and neither does an event a
   * browser composes without it. Both read as a node no map holds, which is the
   * safe direction here: the detail closes.
   */
  relatedTarget?: unknown;
  /**
   * Which button is down, where `0` is the primary one.
   *
   * Optional for the reason the coordinates are: an event that does not say is
   * not a reason to refuse the gesture, so a missing button reads as the primary
   * one. It is here because the controls answer to a press (see the listener in
   * `renderPanel`), and a press arrives for the right button too — which is the
   * one this panel already spends on going back.
   */
  button?: number | undefined;
  clientX?: number | undefined;
  clientY?: number | undefined;
  pointerId?: number | undefined;
  preventDefault?: (() => void) | undefined;
};

/** The slice of the DOM this file uses, so a test can supply the whole of it. */
export type PanelNode = {
  className: string;
  textContent: string;
  /**
   * The detail behind a figure, shown on hover.
   *
   * The browser's own tooltip rather than one of ours: it needs no script, it
   * cannot cover the game until the reader asks for it, and nothing of ours
   * moves or animates to produce it (§9.6).
   */
  title: string;
  style: { setProperty(name: string, value: string): void };
  append(...nodes: PanelNode[]): void;
  replaceChildren(...nodes: PanelNode[]): void;
  addEventListener(type: string, listener: (event: PanelEvent) => void): void;
  /**
   * Optional, because a drag works without it while the pointer stays over the
   * panel — capture is what keeps a fast one from being dropped the moment the
   * cursor outruns the title bar. A fake document that does not offer it still
   * drags.
   */
  setPointerCapture?: ((pointerId: number) => void) | undefined;
  releasePointerCapture?: ((pointerId: number) => void) | undefined;
  /**
   * Where the reader scrolled to.
   *
   * ⚠️ **Not a layout read at all**, which is what separates it from the one
   * below: this is a value the *reader* put there with their own hand, read back
   * so it can be handed to them again after a redraw. Nothing about the shape of
   * anything is being asked.
   *
   * Optional like the pointer capture above: a fake document has no layout and
   * nothing to scroll, and giving a position back to a node that never had one
   * costs nothing.
   */
  scrollTop?: number | undefined;
  /**
   * How big a node came out, and the one place this file reads layout on purpose.
   *
   * ⚠️ **It is asked of exactly one node — the detail window, of its own size,
   * immediately after being filled — and the answer is used before anything can
   * change it.** That is a different thing from measuring the *panel* to decide
   * the panel, which `docs/specs/2026-08-12-the-height-a-fight-needs.md` turned
   * down and which stands: the panel's height changes with every payload, so a
   * figure taken from it is stale before the next one. The detail is rebuilt on
   * every hover and placed in the same breath, so there is no interval in which
   * its height can go stale.
   *
   * It is here because the alternative was tried and shipped and did not work. A
   * window placed without its own height can be kept inside the screen only by
   * capping it, and a capped window is one whose bottom rows are simply not
   * there — which is the same complaint as a window off the edge, in a place
   * nobody can scroll to.
   *
   * Optional, like the two above, and a node that cannot answer reads as a size
   * of nothing — which leaves the detail where the stylesheet already puts it
   * rather than somewhere computed from a zero.
   */
  getBoundingClientRect?: (() => { width: number; height: number }) | undefined;
};

export type PanelHost = PanelNode & {
  attachShadow(init: { mode: "open" }): PanelNode;
};

export type PanelDocument = {
  createElement(tag: string): PanelNode;
};

/**
 * What a render can be asked for.
 *
 * Every one of them is a *choice the reader made*, never a figure: the panel
 * reports the gesture and the caller decides what it means for the state. That
 * split is what keeps this file free of the view's arithmetic.
 */
export type PanelHandlers = {
  onMetricChosen?: ((metric: PanelMetric) => void) | undefined;
  onTeamChosen?: ((team: PanelTeam) => void) | undefined;
  /** A row was clicked. The key is the view's own — see `PanelRow`. */
  onRowChosen?: ((key: string) => void) | undefined;
  /** One level back, from anywhere in the panel. */
  onBack?: (() => void) | undefined;
  /** Told once per failure, so the caller can log it exactly once (§9.6). */
  onSectionFailure?: ((error: unknown) => void) | undefined;
};

/**
 * What the title bar offers besides being something to drag by.
 *
 * Separate from `PanelHandlers` because these belong to the bar, which is built
 * once with the shadow root, while those belong to a render — and separate from
 * `PanelPlacement` because a panel that cannot be moved should still be able to
 * hand the fight over.
 */
export type PanelTitleBarActions = {
  /**
   * Told when the reader asked for the fight's report. What that means — the
   * clipboard, a file, a name — is the caller's: `ui` knows only that it was
   * asked. Absent means no button is drawn at all, rather than one that does
   * nothing.
   */
  onCopyRequested?: (() => void) | undefined;
  /** The same for the raw material, which is for us rather than for the player. */
  onCaptureRequested?: (() => void) | undefined;
  onCollapseToggled?: (() => void) | undefined;
  onSectionFailure?: ((error: unknown) => void) | undefined;
};

/**
 * Where the panel sits, and who is told when that changes.
 *
 * The whole of placement is `ui`'s: this file writes the styles, and the caller
 * only supplies the position it remembered and takes back the one the user
 * settled on. Splitting it — the caller applying styles while this reported
 * deltas — would put the position in two files and make a payload landing
 * mid-drag something both of them have to be right about.
 */
export type PanelPlacement = {
  /** What was remembered, already validated. Null keeps the default corner. */
  position: PanelPosition | null;
  /** Asked on every move, because a window can be resized during a drag. */
  getViewport: () => PanelViewport | null;
  /** Told when the drag ends, not while it runs — a caller may be writing to storage. */
  onMoved?: ((position: PanelPosition) => void) | undefined;
  onSectionFailure?: ((error: unknown) => void) | undefined;
  /**
   * Wraps one move of a drag, so a development build can say what it cost.
   *
   * Injected rather than imported, which is the whole reason it can be here at
   * all: `src/ui/` may not reach for the entry point's seam or for the names it
   * measures under (§9.1), and a parameter is not a dependency. It takes no name
   * either — the caller arrives with one already bound, so this file knows
   * neither what a phase is called nor that a clock exists. Absent, and in the
   * file people install, it is the identity.
   *
   * The drag and not the render: a move draws no panel, it moves the one already
   * drawn, and it is the phase that runs tens of times a second.
   */
  getTimedResult?: (<Result>(work: () => Result) => Result) | undefined;
};

/** One row, bar and all. The bar is behind the text rather than beside it. */
function renderRow(
  document: PanelDocument,
  row: PanelRow,
  rows: Map<unknown, string>,
  details: Map<unknown, PanelDetailLine[]>,
): PanelNode {
  const line = document.createElement("div");
  line.className = row.isDrillable ? "row drillable" : row.detail.length === 0 ? "row" : "row leaf";

  const bar = document.createElement("div");
  bar.className = "bar";
  // Through the writer, not through `${}`: a fill of one tenth interpolates as
  // `10.000000000000002%`, and a value that is not a number at all reaches the
  // declaration as `NaN` with nothing marked
  // (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F17).
  bar.style.setProperty("width", `${composeDecimalText(row.fill * 100, 1)}%`);
  bar.style.setProperty("background", row.colour);

  const cap = document.createElement("div");
  cap.className = "bar-cap";
  cap.style.setProperty("background", row.colour);

  const name = document.createElement("span");
  name.className = "row-name";
  name.textContent = row.label;

  // Built only where there is one to build: this runs per row per payload, and a
  // node created to be thrown away is the kind of cost `bun run cost` cannot see
  // one of and can see a fight's worth of.
  const badge = row.profession === null ? null : document.createElement("span");
  if (badge !== null && row.profession !== null) {
    badge.className = "row-badge";
    badge.textContent = row.profession.toUpperCase();
    badge.style.setProperty("background", row.colour);
    badge.style.setProperty("color", getProfessionInk(row.colour));
  }

  const value = document.createElement("span");
  value.className = "row-value";
  value.textContent = row.valueText;

  // Unconditional, because every row is now inside a whole and states its share
  // of it. It was conditional for as long as a figure could be scoped differently
  // from the list it stood under, and an empty bracket would have read as a share
  // of zero (§9.6).
  const share = document.createElement("span");
  share.className = "row-share";
  share.textContent = row.bracketText;
  value.append(share);

  // Built only where there is one, like the badge above and for the same reason.
  const mark = row.warnings.length === 0 ? null : document.createElement("span");
  if (mark !== null) {
    mark.className = "row-warning";
    mark.textContent = ROW_WARNING_MARK;
  }

  const parts = [bar, cap];
  if (row.rank !== null) {
    const rank = document.createElement("span");
    rank.className = "row-rank";
    rank.textContent = `${row.rank}.`;
    parts.push(rank);
  }
  if (badge !== null) parts.push(badge);
  if (mark !== null) parts.push(mark);
  parts.push(name, value);
  line.append(...parts);
  // Appended to the figure rather than to the line, but it still answers for the
  // row, so it joins `parts` only after the line has been assembled.
  parts.push(share);

  /**
   * ⚠️ **Every piece of the row answers for the row, not just the row itself.**
   *
   * Identity is what the listeners are keyed by — a `data-` value would mean this
   * file deciding twice what a row is, once drawing it and once reading it back —
   * and an event names the *deepest* node under the pointer, which is the name,
   * the figure or the bar. Registering only the line meant a click on a bar did
   * nothing and the detail vanished the moment the pointer crossed onto a word:
   * the two bugs had one cause.
   */
  for (const part of [line, ...parts]) {
    if (row.isDrillable) rows.set(part, row.key);
    if (row.detail.length > 0) details.set(part, row.detail);
  }
  return line;
}

function renderList(
  document: PanelDocument,
  list: PanelList,
  rows: Map<unknown, string>,
  details: Map<unknown, PanelDetailLine[]>,
): PanelNode {
  const block = document.createElement("div");

  if (list.heading !== null) {
    const heading = document.createElement("div");
    heading.className = "section-heading";
    const what = document.createElement("span");
    what.textContent = list.heading;
    const total = document.createElement("span");
    total.textContent = list.totalText ?? "";
    heading.append(what, total);
    block.append(heading);
  }

  for (const row of list.rows) block.append(renderRow(document, row, rows, details));
  return block;
}

/**
 * A region that could not be drawn, replaced in place.
 *
 * §9.6: losing the whole panel because one row misbehaved is a worse outcome
 * than the misbehaving row, so the failure is the size of the thing that failed.
 */
function renderUndrawnRegion(document: PanelDocument, heading: string): PanelNode {
  const block = document.createElement("div");
  block.className = "undrawn";
  block.textContent = `${heading} — nie dało się narysować`;
  return block;
}

/**
 * Appends one region, or a marker the size of the region that failed.
 *
 * A function rather than a `try` per region because §9.6 makes the isolation
 * structural: written out region by region it is one more place for the next one
 * to be added without it.
 */
function renderRegionInto(
  document: PanelDocument,
  panel: PanelNode,
  handlers: PanelHandlers,
  heading: string,
  render: () => PanelNode,
): void {
  try {
    panel.append(render());
  } catch (error) {
    handlers.onSectionFailure?.(error);
    panel.append(renderUndrawnRegion(document, heading));
  }
}

export function renderPanel(
  document: PanelDocument,
  view: PanelView,
  handlers: PanelHandlers = {},
  /**
   * Where a row's detail goes so the tooltip can find it.
   *
   * Handed in rather than kept here, because the tooltip outlives the render and
   * this function does not: a redraw builds new rows, and the map has to be the
   * one the hovering listener already holds.
   */
  details: Map<unknown, PanelDetailLine[]> = new Map(),
  /**
   * Where the list it draws is reported, so the reader's place in it can be given
   * back. Handed in for the same reason `details` is, and left alone by a render
   * that draws no list — a collapsed panel, or a region that failed.
   */
  scroll?: PanelScroll,
): PanelNode {
  const panel = document.createElement("div");
  panel.className = "panel";
  details.clear();

  /**
   * One listener for however many controls the view holds, keyed by identity.
   *
   * §9.6 asks for delegation rather than a binding per element. Four maps rather
   * than one because what a press *means* differs, and a single map of thunks
   * would put the four handlers' error handling in four places again.
   */
  const metricByTab = new Map<unknown, PanelMetric>();
  const teamByTab = new Map<unknown, PanelTeam>();
  const rowsByNode = new Map<unknown, string>();

  // The handler catches its own. An add-on that breaks the game's scripts has
  // done more damage than one that shows a wrong number (§9.6).
  const handleGuarded = (run: () => void): void => {
    try {
      run();
    } catch (error) {
      handlers.onSectionFailure?.(error);
    }
  };

  /**
   * ⚠️ **The press, and never the click — that is the whole of the defect this
   * replaces.** A browser assembles `click` out of two moments and dispatches it
   * only if both resolve to a node still in the tree. Every node below is built
   * by this function, and `renderPanelInto` replaces the lot on every payload —
   * so a payload landing between the press and the release detached what was
   * pressed and **no click was dispatched at all**. The panel looked like it had
   * ignored the reader, who pressed again, during a fight, repeatedly.
   *
   * The listeners were never the thing at risk: they are delegated and keyed by
   * identity, so a redraw cannot lose one. What a redraw could lose is the
   * *gesture*, and a `pointerdown` is one event with nothing inside it for a
   * redraw to land in the middle of. That holds whatever the payload rate and
   * whatever a render costs — which is why it was preferred to holding the redraw
   * back while a hand is down (`docs/specs/2026-08-18-a-gesture-a-redraw-cannot-split.md`).
   *
   * The title bar's buttons stay on `click` and are not an inconsistency: they
   * are built once with the shadow root and outlive every render, so nothing can
   * take them out from under a hand.
   */
  panel.addEventListener("pointerdown", (event) => {
    /*
     * The primary button alone. Without this a right-press would open the row and
     * the `contextmenu` listener below would then step straight back out of it,
     * which is worse than either half. A missing button is the primary one — see
     * `PanelEvent`.
     */
    if ((event.button ?? 0) !== 0) return;

    const metric = metricByTab.get(event.target);
    if (metric !== undefined) return handleGuarded(() => handlers.onMetricChosen?.(metric));

    const team = teamByTab.get(event.target);
    if (team !== undefined) return handleGuarded(() => handlers.onTeamChosen?.(team));

    // A tab the view disabled was never put in the map, so it falls through to
    // the rows and fires nothing — no branch here, and nothing to forget.

    const key = rowsByNode.get(event.target);
    if (key !== undefined) return handleGuarded(() => handlers.onRowChosen?.(key));
  });

  /**
   * One gesture in, one gesture out — and the way out works from anywhere in the
   * panel, including the empty space below a short list. A back button alone
   * would make the cheapest gesture the one that needs aiming.
   */
  panel.addEventListener("contextmenu", (event) => {
    event.preventDefault?.();
    handleGuarded(() => handlers.onBack?.());
  });

  renderRegionInto(document, panel, handlers, "nagłówek", () => {
    const block = document.createElement("div");
    block.className = "header";
    const who = document.createElement("span");
    who.textContent = view.title;
    const outcome = document.createElement("span");
    outcome.className = "header-outcome";
    outcome.textContent = view.outcomeText ?? "";
    block.append(who, outcome);
    return block;
  });

  const renderMetricTab = (tab: {
    metric: PanelMetric;
    label: string;
    isSelected: boolean;
  }): PanelNode => {
    const button = document.createElement("div");
    // ⚠️ A class, because the two halves of this have to be spelled the same
    // and once were not: the stylesheet selected one thing and the render set
    // another, so the panel drew three identical tabs and never showed which
    // metric was on screen.
    button.className = tab.isSelected ? "tab selected" : "tab";
    button.textContent = tab.label;
    metricByTab.set(button, tab.metric);
    return button;
  };

  renderRegionInto(document, panel, handlers, "zakładki", () => {
    const tabs = document.createElement("div");
    tabs.className = "tabs";
    for (const tab of view.nounTabs) tabs.append(renderMetricTab(tab));
    return tabs;
  });

  /**
   * One region for two controls, and the cost is stated: a throw here takes both
   * strips rather than one. They share a row because the vertical budget is the
   * list's — every strip is twenty pixels the ranking does not get — and a
   * direction on its own line would spend a row to say one word.
   */
  renderRegionInto(document, panel, handlers, "kierunek i strony", () => {
    const tabs = document.createElement("div");
    tabs.className = "tabs sides-of";
    for (const tab of view.directionTabs) tabs.append(renderMetricTab(tab));
    // Pushes the side filter to the right edge, so the two controls read as two
    // controls. Absent with the direction, which is why it is a node and not a
    // margin on the first team tab.
    if (view.directionTabs.length > 0) {
      const gap = document.createElement("span");
      gap.className = "tabs-gap";
      tabs.append(gap);
    }
    for (const tab of view.teamTabs) {
      const button = document.createElement("div");
      button.className = tab.isSelected ? "tab selected" : "tab";
      button.textContent = tab.label;
      teamByTab.set(button, tab.team);
      tabs.append(button);
    }
    return tabs;
  });

  if (view.crumb !== null) {
    const crumb = view.crumb;
    renderRegionInto(document, panel, handlers, "ścieżka", () => {
      const block = document.createElement("div");
      block.className = "crumb";
      const back = document.createElement("span");
      back.className = "crumb-back";
      back.textContent = crumb.backLabel;
      // The same action as the right button, for a hand that would rather click
      // something than remember a gesture.
      rowsByNode.set(back, BACK_ROW_KEY);
      const here = document.createElement("span");
      here.className = "crumb-here";
      here.textContent = crumb.hereLabel;
      block.append(back, here);
      return block;
    });
  }

  renderRegionInto(document, panel, handlers, "lista", () => {
    const list = document.createElement("div");
    list.className = "list";
    // `composeIntegerText` asserts on the two values that would make this
    // declaration invalid without a mark: `1e21` interpolates as `"1e+21"` and
    // `NaN` as `"NaN"`, and either leaves the list the wrong height (F17).
    list.style.setProperty("--MargoMeter-rows", composeIntegerText(view.visibleRows));
    if (scroll !== undefined) scroll.list = list;

    if (view.emptyText !== null) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = view.emptyText;
      if (view.emptyLimitText !== null) {
        const limit = document.createElement("span");
        limit.className = "empty-limit";
        limit.textContent = view.emptyLimitText;
        empty.append(limit);
      }
      list.append(empty);
    }

    for (const one of view.lists) list.append(renderList(document, one, rowsByNode, details));
    return list;
  });

  // A region per row rather than one holding both: §9.6 asks that a failure be
  // its own size, and these two say different things about different figures.
  for (const pinned of view.pinnedRows) {
    renderRegionInto(document, panel, handlers, `wiersz ${pinned.key}`, () => {
      const block = document.createElement("div");
      block.className = "pinned";
      block.append(renderRow(document, pinned, rowsByNode, details));
      return block;
    });
  }

  if (view.sides !== null) {
    const sides = view.sides;
    renderRegionInto(document, panel, handlers, "strony razem", () => {
      const block = document.createElement("div");
      block.className = "sides-region";
      const line = document.createElement("div");
      line.className = "sides";
      const mine = document.createElement("span");
      mine.textContent = sides.mineText;
      mine.style.setProperty("color", PANEL_TOKENS.ours);
      const label = document.createElement("span");
      label.className = "sides-label";
      label.textContent = sides.label;
      const enemy = document.createElement("span");
      enemy.textContent = sides.enemyText;
      enemy.style.setProperty("color", PANEL_TOKENS.theirs);
      line.append(mine, label, enemy);
      block.append(line);

      if (sides.shares !== null) {
        const shares = sides.shares;
        const track = document.createElement("div");
        track.className = "sides-track";
        // Three segments and not two, because two of them used to be drawn as the
        // whole bar while the row above stated the third.
        for (const [share, colour] of [
          [shares.mine, PANEL_TOKENS.ours],
          [shares.enemy, PANEL_TOKENS.theirs],
          [shares.nobody, UNKNOWN_COLOUR],
        ] as const) {
          if (share <= 0) continue;
          const part = document.createElement("span");
          part.style.setProperty("width", `${composeDecimalText(share * 100, 1)}%`);
          part.style.setProperty("background", colour);
          track.append(part);
        }
        block.append(track);
      }

      // Below the track rather than beside the two figures: the line above is a
      // confrontation and reads as one, and this is not a third contestant.
      if (sides.nobody !== null) {
        const nobody = sides.nobody;
        const spare = document.createElement("div");
        spare.className = "sides sides-spare";
        const name = document.createElement("span");
        name.className = "sides-label";
        name.textContent = nobody.label;
        const value = document.createElement("span");
        value.textContent = nobody.text;
        spare.append(name, value);
        spare.style.setProperty("color", UNKNOWN_COLOUR);
        block.append(spare);
      }

      return block;
    });
  }

  // Warnings last and never as a banner: they qualify the whole reading rather
  // than one figure, and there is nowhere else for a claim about the reading to
  // sit (§9.6). Nothing is drawn when the reading was clean.
  for (const warning of view.warnings) {
    renderRegionInto(document, panel, handlers, "ostrzeżenie", () => {
      const line = document.createElement("div");
      line.className = "warning";
      line.textContent = `⚠ ${warning}`;
      return line;
    });
  }

  return panel;
}

/**
 * The panel before a fight has reached it: one region, one sentence, no controls.
 *
 * ⚠️ **The body is drawn at the height it will be**, from the ranking's own floor
 * (`PANEL_WAITING`), rather than at the height of one line. A panel whose body
 * appears as a strip under its own title bar is the shape a *collapsed* panel has,
 * which is the whole reason this exists: for the life of the project there was no
 * render at all before the first payload, so the two states were the same picture
 * and a player could not tell an add-on waiting from one that had died.
 *
 * Nothing here is a control, and none of the four maps `renderPanel` keeps has
 * anything to hold: there is no row to open, no tab to choose and nowhere to go
 * back to, so a listener would be a promise to act on a click that cannot happen.
 * The region wrapper stays, because a region that throws must still be the size of
 * the thing that threw (§9.6) — the sentence is one `textContent` away from being
 * the only thing on screen.
 */
function renderWaiting(
  document: PanelDocument,
  waiting: PanelWaiting,
  handlers: PanelHandlers,
): PanelNode {
  const panel = document.createElement("div");
  panel.className = "panel";

  renderRegionInto(document, panel, handlers, "lista", () => {
    const list = document.createElement("div");
    // The same node the ranking's rows sit in, so the height is the same
    // arithmetic and not a second one. `composeIntegerText` asserts for the reason
    // it does there: `NaN` interpolates as `"NaN"` and leaves the box unmeasured.
    list.className = "list list-waiting";
    list.style.setProperty("--MargoMeter-rows", composeIntegerText(waiting.visibleRows));

    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = waiting.text;
    list.append(empty);
    return list;
  });

  return panel;
}

/**
 * Opens the shadow root once and returns what to draw into.
 *
 * ⚠️ **Once is not a preference.** `attachShadow` throws on an element that
 * already hosts a root, so calling it per render would work exactly once and
 * then fail on every payload after — which, in a fight, is immediately. The
 * stylesheet is placed here for the same reason: it does not change, so it is
 * not something a redraw should keep rebuilding.
 *
 * ⚠️ **The title bar is here, and not in `renderPanel`, for a third reason that
 * costs a drag if it is forgotten.** A redraw replaces the container's children
 * wholesale, and a fight redraws every few seconds — a grab handle built inside
 * the render would be destroyed under the pointer by the next payload, which is
 * exactly when someone is most likely to be moving the panel out of the way.
 * The buttons ride the bar for the same reason.
 */
export function setPanelRoot(
  document: PanelDocument,
  host: PanelHost,
  placement?: PanelPlacement,
  actions?: PanelTitleBarActions,
  /** Filled by every render, read by the tooltip. One map, both sides. */
  details: Map<unknown, PanelDetailLine[]> = new Map(),
): PanelNode {
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = composePanelStyleText();

  const titleBar = document.createElement("div");
  titleBar.className = "MargoMeter-titlebar";
  // Set before the buttons are appended, not after: `textContent` replaces every
  // child, so the other order would wipe them. The text stays a bare text node,
  // which is not an event target — so the drag's identity check on the bar keeps
  // working wherever in the text it is grabbed.
  titleBar.textContent = "⠿ MargoMeter";
  titleBar.title = "Przeciągnij, żeby przesunąć";

  /**
   * The version, quietly, beside the name.
   *
   * It is here because reports arrive as screenshots: without it the sender has
   * no way of knowing what they are running, and the add-on updates itself. A
   * node of its own rather than part of the title text, so the drag keeps
   * working wherever in the bar it is grabbed.
   *
   * ⚠️ **Guarded, the way every region of the render is** — and it had to be,
   * which is worth saying: this is the first thing built outside `renderPanel`,
   * and a document that failed on it took the whole mount down rather than one
   * label. A panel without its version is still a panel; no panel at all is a
   * report nobody can send.
   */
  try {
    const version = document.createElement("span");
    version.className = "titlebar-version";
    version.textContent = USERSCRIPT_VERSION;
    titleBar.append(version);
  } catch (error) {
    actions?.onSectionFailure?.(error);
  }

  if (actions?.onCopyRequested !== undefined) {
    titleBar.append(
      setTitleBarButton(document, root, actions, {
        className: "titlebar-button titlebar-copy",
        text: "⧉",
        title: "Kopiuj pełny raport z tej walki",
        run: actions.onCopyRequested,
      }),
    );
  }
  if (actions?.onCaptureRequested !== undefined) {
    titleBar.append(
      setTitleBarButton(document, root, actions, {
        className: "titlebar-button titlebar-raw",
        text: "{ }",
        title: "Do zgłoszeń: zapisz surowe dane walki prosto z gry",
        run: actions.onCaptureRequested,
      }),
    );
  }
  if (actions?.onCollapseToggled !== undefined) {
    titleBar.append(
      setTitleBarButton(document, root, actions, {
        className: "titlebar-button",
        text: "—",
        title: "Zwiń albo rozwiń okno",
        run: actions.onCollapseToggled,
      }),
    );
  }

  const container = document.createElement("div");
  // Named so the stylesheet can reach it: it is a link in the chain the panel's
  // ceiling travels down to the list, and a node with no class is one it cannot
  // pass through.
  container.className = "MargoMeter-body";
  const tip = document.createElement("div");
  // Named by `setTipHidden` and not here: it writes the class on every call, so an
  // assignment on this line is one nothing can read — found by a mutation that
  // changed it and lit nothing (§7.5).
  setTipHidden(tip, true);

  root.append(style, titleBar, container, tip);
  const getDraggedPosition =
    placement === undefined ? () => null : setPanelDrag(root, host, titleBar, placement);

  /**
   * Where the panel's corner is right now, and null where nothing says.
   *
   * ⚠️ **From the drag, and never from what the caller handed in.** The two agree
   * exactly until somebody moves the panel, and then the field is the corner the
   * page opened at while the drag holds the corner the panel is drawn in — so a
   * panel dragged to the left edge went on having its detail placed against the
   * right-hand corner, 254px off the screen, which is the one thing this
   * arithmetic exists to prevent. It is also why the drag hands its position back
   * rather than being asked for it: one owner, and the position the host was
   * written with is the position everything reads.
   *
   * The default corner covers the page where nothing has been dragged yet, and
   * null travels on rather than becoming a corner nobody chose — it is what the
   * detail's placement reads as *place nothing*.
   */
  const getPanelPosition = (): PanelPosition | null =>
    getDraggedPosition() ?? composeDefaultPosition(placement?.getViewport() ?? null);

  // The viewport is the placement's, and without it the detail has nothing to fit
  // into: it ran off the left edge of the page whenever the panel was dragged
  // there, and off the bottom of it on every row near the floor.
  setPanelTip(document, root, tip, details, getPanelPosition, () => placement?.getViewport() ?? null);
  return container;
}

/**
 * Hidden where it stands, rather than by leaving the tree.
 *
 * A node that comes and goes cannot be the one the listeners were given, and the
 * whole design here is that the tooltip outlives every redraw — the same reason
 * the title bar is built with the root.
 *
 * ⚠️ **`display` is the whole mechanism.** This also hung a `hidden` class on the
 * node and this docblock called it "an attribute the stylesheet reads". It was a
 * class, not an attribute, and no rule in `src/ui/panel-look.ts` ever
 * matched it — so it hid nothing, and the sentence sent whoever read it next
 * looking for a rule that was never there
 * (`docs/specs/2026-08-18-a-name-we-did-not-choose.md`).
 */
function setTipHidden(tip: PanelNode, isHidden: boolean): void {
  tip.className = "MargoMeter-tip";
  tip.style.setProperty("display", isHidden ? "none" : "block");
}

/**
 * The detail, shown where the pointer is and taken away when it leaves.
 *
 * ⚠️ **The order of these three steps is the whole of what makes the placement
 * possible.** Fill, show, *then* measure: a node still carrying `display: none`
 * measures as nothing, and a node measured before it is filled measures as the
 * last row's detail rather than this one's. The measurement goes to
 * `composeTipDeclarations` at the top of this file, which decides against a
 * document it never touches, and this writes down what it decided — a split that
 * used to be a module boundary and is now the first section of one file.
 *
 * A pointer that arrives without coordinates leaves the detail where it was
 * rather than putting it somewhere nobody asked for.
 */
function setPanelTip(
  document: PanelDocument,
  root: PanelNode,
  tip: PanelNode,
  details: Map<unknown, PanelDetailLine[]>,
  /** Where the panel's own corner is, which is what the detail is placed against. */
  getPanelPosition: () => PanelPosition | null = () => null,
  getViewport: () => PanelViewport | null = () => null,
): void {
  root.addEventListener("pointerover", (event) => {
    const lines = details.get(event.target);
    if (lines === undefined || lines.length === 0) {
      setTipHidden(tip, true);
      return;
    }

    tip.replaceChildren(...lines.map((line) => renderDetailLine(document, line)));
    setTipHidden(tip, false);

    const pointerTop = getFiniteNumberFromValue(event.clientY);
    if (pointerTop === null) return;
    const box = tip.getBoundingClientRect?.() ?? { width: 0, height: 0 };
    const placed = composeTipDeclarations(pointerTop, box, getPanelPosition(), getViewport());
    for (const [property, value] of placed) tip.style.setProperty(property, value);
  });

  /**
   * The detail belongs to whatever is under the pointer, so it goes the moment
   * the pointer arrives somewhere that has none — the game underneath, the
   * panel's own chrome, or nothing at all.
   *
   * ⚠️ **What decides is the node being entered, and asking about the node being
   * left is the bug this replaces.** `pointerout` names what the pointer is
   * leaving; every piece of a row is registered, so a pointer going from a row
   * straight out of the panel named a node the map holds and the detail was left
   * standing over the game. It looked intermittent because a redraw clears the
   * map — during a fight the hovered node stops being a key and the detail closes
   * correctly, and on an idle panel it stays.
   *
   * Moving between two pieces of one row is answered by the same question rather
   * than in spite of it: the whole row is registered, so the piece being entered
   * carries the same detail and nothing is taken out from under the reader.
   */
  root.addEventListener("pointerout", (event) => {
    if (!details.has(event.relatedTarget)) setTipHidden(tip, true);
  });
}

function renderDetailLine(document: PanelDocument, line: PanelDetailLine): PanelNode {
  if (line.kind === "stat") {
    const row = document.createElement("div");
    row.className = line.isStrong ? "tip-stat strong" : "tip-stat";
    const label = document.createElement("span");
    label.textContent = line.label;
    const value = document.createElement("span");
    value.className = "tip-stat-value";
    value.textContent = line.value;
    row.append(label, value);
    return row;
  }

  const node = document.createElement("div");
  node.className = line.kind === "title" ? "tip-title" : line.kind === "heading" ? "tip-heading" : "tip-note";
  node.textContent = line.text;
  return node;
}

/**
 * One control on the title bar.
 *
 * Listened for at the **root**, keyed by node identity, which is the same shape
 * the tab strip and the drag both use (§9.6). Its own `try`: a handler that
 * throws must not reach a page the game is also listening on.
 */
function setTitleBarButton(
  document: PanelDocument,
  root: PanelNode,
  actions: PanelTitleBarActions,
  button: { className: string; text: string; title: string; run: () => void },
): PanelNode {
  const node = document.createElement("div");
  node.className = button.className;
  node.textContent = button.text;
  node.title = button.title;

  root.addEventListener("click", (event) => {
    if (event.target !== node) return;
    try {
      button.run();
    } catch (error) {
      actions.onSectionFailure?.(error);
    }
  });
  return node;
}

/**
 * The drag, delegated at the shadow root.
 *
 * §9.6 asks for one place that handles events rather than a binding per element,
 * and identity is what says which element was hit — the same shape the tab strip
 * uses. Here it also buys the property above: the root and the title bar both
 * outlive every redraw, so a drag survives a payload landing in the middle of it.
 *
 * Pointer capture is what keeps a fast drag: without it the pointer outruns the
 * bar and the moves stop arriving. It is optional on the node so that a document
 * which does not offer it still drags, just less forgivingly.
 */
function setPanelDrag(
  root: PanelNode,
  host: PanelHost,
  titleBar: PanelNode,
  placement: PanelPlacement,
): () => PanelPosition | null {
  let position = placement.position;
  let grab: PanelGrab | null = null;

  const setHostPosition = (next: PanelPosition): void => {
    position = next;
    for (const [name, value] of composePositionDeclarations(next)) {
      host.style.setProperty(name, value);
    }
  };

  if (position !== null) setHostPosition(composeClampedPosition(position, placement.getViewport()));

  /**
   * Every one of these catches its own. An add-on that breaks the game's own
   * scripts has done far more damage than one that shows a wrong number (§9.6),
   * and a pointer handler is the one place a thrown error would reach the page on
   * an event the page also listens for.
   */
  const setGuarded = (type: string, handle: (event: PanelEvent) => void): void => {
    root.addEventListener(type, (event) => {
      try {
        handle(event);
      } catch (error) {
        grab = null;
        placement.onSectionFailure?.(error);
      }
    });
  };

  /**
   * Takes the pointer, or gives it back, without ever costing the drag.
   *
   * ⚠️ **Capture is the forgiving part of a drag, not the drag.** The note above
   * says a document that does not offer it still drags, and that was true of the
   * method being *absent* and false of it *throwing*: `setPointerCapture` rejects
   * a pointer it does not consider active with `InvalidPointerId`, and one throw
   * inside `setGuarded` clears the grab — so the panel did not move at all, and
   * the only trace was a single line in a console shared with the game. Failing
   * on the way out is worse still: the release sits after the grab is cleared and
   * ahead of `onMoved`, so a drag would land and then not be remembered.
   *
   * The catch is wide for the reason the storage one in `userscript-entry.ts` is:
   * this arrives as a `DOMException` under more than one name and there is
   * nothing narrower that would catch them all. It is still reported — a drag
   * that stops following a fast hand is worth knowing about (§9.6).
   */
  const setPointerHeld = (isHeld: boolean, pointerId: number | undefined): void => {
    if (pointerId === undefined) return;
    try {
      if (isHeld) titleBar.setPointerCapture?.(pointerId);
      else titleBar.releasePointerCapture?.(pointerId);
    } catch (error) {
      placement.onSectionFailure?.(error);
    }
  };

  setGuarded("pointerdown", (event) => {
    if (event.target !== titleBar) return;
    const pointer = getPointerFromEvent(event);
    if (pointer === null) return;

    // Nothing has written a `left` yet on the first grab, so where the panel
    // already is has to be derived. A null here means the page did not say how
    // wide it is, and a drag from a guessed origin would jump under the hand.
    const from = position ?? composeDefaultPosition(placement.getViewport());
    if (from === null) return;

    // Without this the browser starts its own text or image drag from the bar.
    event.preventDefault?.();
    grab = {
      pointerLeft: pointer.left,
      pointerTop: pointer.top,
      panelLeft: from.left,
      panelTop: from.top,
    };
    // Last, and inside its own catch, because it is the only line here that can
    // throw and it is not the drag.
    setPointerHeld(true, event.pointerId);
  });

  setGuarded("pointermove", (event) => {
    if (grab === null) return;
    const held = grab;
    const pointer = getPointerFromEvent(event);
    if (pointer === null) return;
    const timed = placement.getTimedResult ?? (<Result>(work: () => Result) => work());
    timed(() => setHostPosition(composeDraggedPosition(held, pointer, placement.getViewport())));
  });

  /**
   * The caller hears once, at the end. A move reported per event would be a
   * storage write per frame, and what a user settled on is the position they
   * stopped at rather than every one they passed through.
   */
  const handleDragEnd = (event: PanelEvent): void => {
    if (grab === null) return;
    grab = null;
    setPointerHeld(false, event.pointerId);
    if (position !== null) placement.onMoved?.(position);
  };

  setGuarded("pointerup", handleDragEnd);
  setGuarded("pointercancel", handleDragEnd);

  // The position this wrote onto the host, for whoever has to draw beside it. A
  // getter rather than the value, because a drag outlives this call — and the
  // caller reading the field it handed in is the bug that made this a return.
  return () => position;
}

/**
 * Coordinates, or nothing at all.
 *
 * Read through `libs/number.ts` rather than trusted: they arrive from the page,
 * and §9.5 puts every reading of an outside number in one place. A pointer event
 * without them is not a reason to move the panel somewhere nobody asked for.
 */
function getPointerFromEvent(event: PanelEvent): { left: number; top: number } | null {
  const left = getFiniteNumberFromValue(event.clientX);
  const top = getFiniteNumberFromValue(event.clientY);
  if (left === null || top === null) return null;
  return { left, top };
}

/**
 * Where the reader left the list, and which screen that was.
 *
 * Held by the caller rather than in this module, for the reason `details` is: a
 * redraw builds a new list, so the position has to come off the old node before it
 * is replaced and go onto the new one afterwards — and the node type here exposes
 * no children, so the node itself is what has to be remembered rather than found
 * again. The screen travels with it because the answer differs: a reader who
 * navigated starts at the top, a reader who stood still stays where they were.
 */
export type PanelScroll = { list: PanelNode | null; levelKey: string | null };

/**
 * Draws the panel into the container, replacing whatever was there.
 *
 * A collapsed panel draws nothing at all rather than a panel with its body
 * hidden: the title bar is a separate node that outlives the render, so there is
 * always something left to grab and to expand from.
 *
 * ⚠️ **A fight redraws every few seconds, and every redraw is a new list.** Without
 * the two lines below the reader is put back at the top of it on every payload,
 * which in a fight big enough to scroll means scrolling again and again. The order
 * they run in is the whole of the trick: read before the old node leaves the tree,
 * write after the new one is in it — a node with no scroll height clamps whatever
 * it is given to zero.
 */
export function renderPanelInto(
  document: PanelDocument,
  container: PanelNode,
  view: PanelView,
  handlers: PanelHandlers = {},
  isCollapsed = false,
  details: Map<unknown, PanelDetailLine[]> = new Map(),
  scroll: PanelScroll = { list: null, levelKey: null },
): void {
  const kept = scroll.levelKey === view.levelKey ? (scroll.list?.scrollTop ?? 0) : 0;
  scroll.levelKey = view.levelKey;

  if (isCollapsed) {
    container.replaceChildren();
    details.clear();
    return;
  }
  container.replaceChildren(renderPanel(document, view, handlers, details, scroll));

  // Whatever the render drew, which is the previous list where the list region
  // itself failed — a node out of the tree, so writing to it changes nothing and
  // needs no case of its own.
  if (kept > 0 && scroll.list !== null) scroll.list.scrollTop = kept;
}

/**
 * Draws the waiting body into the container, replacing whatever was there.
 *
 * A sibling of `renderPanelInto` rather than a branch inside it, and the two share
 * exactly one line — the collapse. Folding them together would mean a tag on
 * `PanelView` for the compiler to discriminate on, which every screen and every
 * test that builds one would then carry so that a state none of them can be could
 * be told apart from them.
 *
 * ⚠️ **Neither `details` nor `scroll` is taken, and neither is an omission.**
 * There is no row to describe and nothing that can be scrolled, and the state is
 * one-way: `latest` in `src/userscript-entry.ts` is set on the first reading and
 * never set back, so this is only ever what the panel drew *before* a fight and
 * never what it returns to after one. There is nothing stale for it to leave
 * behind.
 */
export function renderWaitingInto(
  document: PanelDocument,
  container: PanelNode,
  waiting: PanelWaiting,
  handlers: PanelHandlers = {},
  isCollapsed = false,
): void {
  if (isCollapsed) {
    container.replaceChildren();
    return;
  }
  container.replaceChildren(renderWaiting(document, waiting, handlers));
}
