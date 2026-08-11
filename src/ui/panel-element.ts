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
 *   - nothing here can interrupt — no dialog, no focus taken, nothing that moves.
 */

import { PANEL_TOKENS } from "@/src/ui/panel-tokens.ts";
import type {
  PanelHeader,
  PanelMark,
  PanelMetric,
  PanelSection,
  PanelView,
} from "@/src/ui/panel-view.ts";

/**
 * What a click hands us. Only the target is used, and that is the whole point:
 * one listener at the root can serve every control on the panel if it can tell
 * which one was hit (§9.6).
 */
export type PanelEvent = { target: unknown };

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
 * `all: initial` on the host, because the game's stylesheet is not ours to
 * inherit and a panel that changes shape when the game restyles itself is a
 * panel nobody can trust to be readable.
 */
export function composePanelStyleText(): string {
  const t = PANEL_TOKENS;
  return `
:host { all: initial; }
.panel {
  font: 12px/1.45 system-ui, sans-serif;
  width: ${t.width};
  color: ${t.text};
  background: ${t.surface};
  border: 1px solid ${t.border};
  border-radius: ${t.radius};
  padding: ${t.space};
  box-sizing: border-box;
}
.tabs { display: flex; gap: ${t.spaceSmall}; margin-bottom: ${t.space}; }
.tab {
  padding: ${t.spaceSmall} ${t.space};
  border-radius: ${t.radius};
  color: ${t.textQuiet};
  background: transparent;
  cursor: pointer;
  user-select: none;
}
.tab[data-selected="true"] { color: ${t.text}; background: ${t.surfaceRaised}; }
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
      button.className = "tab";
      button.textContent = tab.label;
      button.style.setProperty("--selected", tab.isSelected ? "1" : "0");
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
 */
export function setPanelRoot(document: PanelDocument, host: PanelHost): PanelNode {
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = composePanelStyleText();

  const container = document.createElement("div");
  root.append(style, container);
  return container;
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
