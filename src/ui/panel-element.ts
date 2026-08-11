/**
 * The panel, drawn.
 *
 * Everything decided is in `panel-view.ts`; this puts it on screen and does as
 * little thinking as it can. The document arrives as an argument for the same
 * reason the engine does in `src/game/` — there is no DOM in the test runner, and
 * the properties §9.6 demands are exactly the ones worth checking.
 *
 * Three of those properties are structural rather than incidental, and each is
 * visible in the shape of the code below:
 *
 *   - a section that throws takes only itself down;
 *   - a handler that throws does not escape into the page;
 *   - nothing here can interrupt — no dialog, no focus taken, nothing that moves
 *     unless a hand is moving it.
 */

import { getFiniteNumberFromValue } from "@/libs/number.ts";
import type { PanelGrab, PanelPosition, PanelViewport } from "@/src/ui/panel-placement.ts";
import {
  composeClampedPosition,
  composeDefaultPosition,
  composeDraggedPosition,
  composePositionDeclarations,
} from "@/src/ui/panel-placement.ts";
import { PANEL_TOKENS } from "@/src/ui/panel-tokens.ts";
import type {
  PanelHeader,
  PanelMark,
  PanelMetric,
  PanelSection,
  PanelView,
} from "@/src/ui/panel-view.ts";

/**
 * What an event hands us. The target is what a click needs, and that is the whole
 * point: one listener at the root can serve every control on the panel if it can
 * tell which one was hit (§9.6).
 *
 * The rest is what a drag needs, and all of it is optional because a click
 * carries none of it — a pointer event that arrives without coordinates moves
 * nothing rather than moving somewhere nobody asked for.
 */
export type PanelEvent = {
  target: unknown;
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
   * The detail behind a mark, shown on hover.
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
};

export type PanelHost = PanelNode & {
  attachShadow(init: { mode: "open" }): PanelNode;
};

export type PanelDocument = {
  createElement(tag: string): PanelNode;
};

export type PanelHandlers = {
  onMetricChosen?: ((metric: PanelMetric) => void) | undefined;
  /** Told once per failure, so the caller can log it exactly once (§9.6). */
  onSectionFailure?: ((error: unknown) => void) | undefined;
};

/**
 * What the title bar offers besides being something to drag by.
 *
 * Separate from `PanelHandlers` because these belong to the bar, which is built
 * once with the shadow root, while those belong to a render — and separate from
 * `PanelPlacement` because a panel that cannot be moved should still be able to
 * hand over the fight.
 */
export type PanelTitleBarActions = {
  /**
   * Told when the reader asked for the fight to be written out. What that means —
   * a file, a name, a place — is the caller's: `ui` knows only that it was asked.
   * Absent means no button is drawn at all, rather than one that does nothing.
   */
  onCaptureRequested?: (() => void) | undefined;
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
};

/**
 * `all: initial` on the host, because the game's stylesheet is not ours to
 * inherit and a panel that changes shape when the game restyles itself is a
 * panel nobody can trust to be readable.
 *
 * The placement that never changes is here rather than written onto the host in
 * script: the corner is where the panel starts, and a page where nothing was ever
 * dragged should need no JavaScript to put it there. `display` is restated
 * because `all: initial` resets it to `inline`, on which a fixed width means
 * nothing — the panel had been laid out that way since it was written.
 */
export function composePanelStyleText(): string {
  const t = PANEL_TOKENS;
  return `
:host {
  all: initial;
  display: block;
  position: fixed;
  top: ${t.space};
  right: ${t.space};
  z-index: ${t.layer};
}
.titlebar {
  display: flex;
  align-items: center;
  gap: ${t.spaceSmall};
  padding: ${t.spaceSmall} ${t.space};
  font: 11px/1.2 system-ui, sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${t.textQuiet};
  background: ${t.surfaceRaised};
  border: 1px solid ${t.border};
  border-bottom: none;
  border-radius: ${t.radius} ${t.radius} 0 0;
  box-sizing: border-box;
  width: ${t.width};
  /* The affordance is the cursor and the grip; nothing animates to advertise it. */
  cursor: move;
  user-select: none;
  touch-action: none;
}
.panel {
  font: 12px/1.45 system-ui, sans-serif;
  width: ${t.width};
  color: ${t.text};
  background: ${t.surface};
  border: 1px solid ${t.border};
  /* Square at the top: the title bar above it carries those two corners. */
  border-radius: 0 0 ${t.radius} ${t.radius};
  padding: ${t.space};
  box-sizing: border-box;
}
/*
 * Pushed to the far end, so the bar's own text keeps the near end and the two
 * never fight over the middle. The pointer cursor is here to override the move
 * cursor the bar sets: inheriting it would promise a drag from the one place in
 * the bar that does not drag.
 */
.titlebar-save {
  margin-left: auto;
  padding: 0 ${t.spaceSmall};
  border: 1px solid ${t.border};
  border-radius: ${t.radius};
  color: ${t.textQuiet};
  background: ${t.surface};
  cursor: pointer;
}
.titlebar-save:hover { color: ${t.text}; }
.tabs { display: flex; gap: ${t.spaceSmall}; margin-bottom: ${t.space}; }
.tab {
  padding: ${t.spaceSmall} ${t.space};
  border-radius: ${t.radius};
  color: ${t.textQuiet};
  background: transparent;
  cursor: pointer;
  user-select: none;
}
.tab.selected { color: ${t.text}; background: ${t.surfaceRaised}; }
.section { margin-top: ${t.spaceLarge}; }
.section-heading {
  display: flex;
  justify-content: space-between;
  color: ${t.textQuiet};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 10px;
  margin-bottom: ${t.spaceSmall};
}
.row {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px ${t.spaceSmall};
  margin-bottom: 2px;
  border-radius: 3px;
  background: ${t.surfaceRaised};
  overflow: hidden;
}
.bar { position: absolute; left: 0; top: 0; bottom: 0; opacity: ${t.barTint}; }
.row-name, .row-value { position: relative; }
.row-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row-value { font-variant-numeric: tabular-nums; padding-left: ${t.space}; }
.row-share { color: ${t.textQuiet}; padding-left: ${t.spaceSmall}; }
.header { display: flex; justify-content: space-between; align-items: baseline; }
.header-outcome { color: ${t.textQuiet}; text-transform: uppercase; font-size: 10px; }
/* Static, and never the only thing carrying the meaning — the detail is on it. */
.mark { color: ${t.suspect}; padding-left: ${t.spaceSmall}; cursor: help; }
.undrawn { color: ${t.textQuiet}; font-style: italic; }
`.trim();
}

/** A mark, or nothing at all. The detail rides on it rather than beside it. */
function renderMark(document: PanelDocument, mark: PanelMark | null): PanelNode[] {
  if (mark === null) return [];
  const node = document.createElement("span");
  node.className = "mark";
  node.textContent = mark.text;
  node.title = mark.detail;
  return [node];
}

function renderHeader(document: PanelDocument, header: PanelHeader): PanelNode {
  const block = document.createElement("div");
  block.className = "header";

  const who = document.createElement("span");
  who.textContent = header.title;
  for (const mark of header.marks) who.append(...renderMark(document, mark));

  const outcome = document.createElement("span");
  outcome.className = "header-outcome";
  outcome.textContent = header.outcomeText ?? "";

  block.append(who, outcome);
  return block;
}

function renderRows(document: PanelDocument, section: PanelSection): PanelNode[] {
  return section.rows.map((row) => {
    const line = document.createElement("div");
    line.className = "row";

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.setProperty("width", `${row.share * 100}%`);
    bar.style.setProperty("background", row.colour);

    const name = document.createElement("span");
    name.className = "row-name";
    name.textContent = row.name;

    const value = document.createElement("span");
    value.className = "row-value";
    value.textContent = row.valueText;

    const share = document.createElement("span");
    share.className = "row-share";
    share.textContent = row.shareText;

    value.append(share);
    line.append(bar, name, value);
    return line;
  });
}

function renderSection(document: PanelDocument, section: PanelSection): PanelNode {
  const block = document.createElement("div");
  block.className = "section";

  const heading = document.createElement("div");
  heading.className = "section-heading";
  const what = document.createElement("span");
  what.textContent = section.heading;
  const total = document.createElement("span");
  total.textContent = section.totalText;
  // The warning goes where the consequence is: beside the figure it qualifies,
  // not in a banner at the foot of the panel (§9.6).
  total.append(...renderMark(document, section.totalMark));
  heading.append(what, total);

  block.append(heading, ...renderRows(document, section));
  return block;
}

/**
 * A section that could not be drawn, replaced in place.
 *
 * §9.6: losing the whole panel because one row misbehaved is a worse outcome
 * than the misbehaving row, so the failure is the size of the thing that failed.
 */
function renderUndrawnSection(document: PanelDocument, heading: string): PanelNode {
  const block = document.createElement("div");
  block.className = "section undrawn";
  block.textContent = `${heading} — could not be drawn`;
  return block;
}

export function renderPanel(
  document: PanelDocument,
  view: PanelView,
  handlers: PanelHandlers = {},
): PanelNode {
  const panel = document.createElement("div");
  panel.className = "panel";

  /**
   * One listener, on the panel root, for however many controls the view holds.
   *
   * §9.6 asks for delegation rather than a binding per element, and identity is
   * what the map is keyed by: a `data-` attribute would mean the panel deciding
   * twice what a tab is — once when drawing it and once when reading it back.
   */
  const metricByTab = new Map<unknown, PanelMetric>();
  panel.addEventListener("click", (event) => {
    const metric = metricByTab.get(event.target);
    if (metric === undefined) return;
    // The handler catches its own. An add-on that breaks the game's scripts has
    // done more damage than one that shows a wrong number (§9.6).
    try {
      handlers.onMetricChosen?.(metric);
    } catch (error) {
      handlers.onSectionFailure?.(error);
    }
  });

  renderRegionInto(document, panel, handlers, "tabs", () => {
    const tabs = document.createElement("div");
    tabs.className = "tabs";
    for (const tab of view.tabs) {
      const button = document.createElement("div");
      // ⚠️ A class, because the two halves of this have to be spelled the same
      // and once were not: the rule above selected `[data-selected="true"]`
      // while this set a custom property `--selected` that nothing read. Neither
      // side was wrong on its own, so the compiler had nothing to say and a fake
      // document has no stylesheet — the panel simply drew three identical tabs
      // and never showed which metric was on screen.
      button.className = tab.isSelected ? "tab selected" : "tab";
      button.textContent = tab.label;
      metricByTab.set(button, tab.metric);
      tabs.append(button);
    }
    return tabs;
  });

  renderRegionInto(document, panel, handlers, "header", () =>
    renderHeader(document, view.header),
  );

  for (const section of view.sections) {
    renderRegionInto(document, panel, handlers, section.heading, () =>
      renderSection(document, section),
    );
  }

  return panel;
}

/**
 * Appends one region, or a marker the size of the region that failed.
 *
 * A function rather than a `try` per region because §9.6 makes the isolation
 * structural: written out four times it is four places for the next region to be
 * added without one.
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
    panel.append(renderUndrawnSection(document, heading));
  }
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
 */
export function setPanelRoot(
  document: PanelDocument,
  host: PanelHost,
  placement?: PanelPlacement,
  actions?: PanelTitleBarActions,
): PanelNode {
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = composePanelStyleText();

  const titleBar = document.createElement("div");
  titleBar.className = "titlebar";
  // Set before the button is appended, not after: `textContent` replaces every
  // child, so the other order would wipe the button the line below adds. The text
  // stays a bare text node, which is not an event target — so the drag's identity
  // check on the bar keeps working wherever in the text it is grabbed.
  titleBar.textContent = "⠿ MargoMeter";
  titleBar.title = "Drag to move";
  if (actions?.onCaptureRequested !== undefined) {
    titleBar.append(setCaptureButton(document, root, actions));
  }

  const container = document.createElement("div");
  root.append(style, titleBar, container);
  if (placement !== undefined) setPanelDrag(root, host, titleBar, placement);
  return container;
}

/**
 * The one control that is not about the fight being drawn: it hands the fight
 * over.
 *
 * Built with the bar rather than with the render, for the reason above it — and
 * listened for at the **root**, keyed by node identity, which is the same shape
 * the tab strip and the drag both use (§9.6). Its own `try`: a handler that
 * throws must not reach a page the game is also listening on.
 */
function setCaptureButton(
  document: PanelDocument,
  root: PanelNode,
  actions: PanelTitleBarActions,
): PanelNode {
  const button = document.createElement("div");
  button.className = "titlebar-save";
  button.textContent = "save";
  button.title = "Write this fight to a file";

  root.addEventListener("click", (event) => {
    if (event.target !== button) return;
    try {
      actions.onCaptureRequested?.();
    } catch (error) {
      actions.onSectionFailure?.(error);
    }
  });
  return button;
}

/**
 * The drag, delegated at the shadow root.
 *
 * §9.6 asks for one place that handles events rather than a binding per element,
 * and identity is what says which element was hit — the same shape the tab strip
 * uses. Here it also buys the property above: the root and the title bar both
 * outlive every redraw, so a drag survives a payload landing in the middle of it.
 *
 * Pointer capture is what keeps a fast drag: without it the pointer outruns a
 * 310px bar and the moves stop arriving. It is optional on the node so that a
 * document which does not offer it still drags, just less forgivingly.
 */
function setPanelDrag(
  root: PanelNode,
  host: PanelHost,
  titleBar: PanelNode,
  placement: PanelPlacement,
): void {
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
  const setPointerHeld = (held: boolean, pointerId: number | undefined): void => {
    if (pointerId === undefined) return;
    try {
      if (held) titleBar.setPointerCapture?.(pointerId);
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
    const pointer = getPointerFromEvent(event);
    if (pointer === null) return;
    setHostPosition(composeDraggedPosition(grab, pointer, placement.getViewport()));
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

/** Draws the panel into the container, replacing whatever was there. */
export function renderPanelInto(
  document: PanelDocument,
  container: PanelNode,
  view: PanelView,
  handlers: PanelHandlers = {},
): void {
  container.replaceChildren(renderPanel(document, view, handlers));
}
