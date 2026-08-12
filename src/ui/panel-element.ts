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
 *     node identity, so a redraw cannot lose one;
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
import { getProfessionInk, PANEL_PIXELS, PANEL_TOKENS } from "@/src/ui/panel-tokens.ts";
import { USERSCRIPT_VERSION } from "@/src/userscript-version.ts";
import type {
  PanelDetailLine,
  PanelList,
  PanelMetric,
  PanelRow,
  PanelTeam,
  PanelView,
} from "@/src/ui/panel-view.ts";

/**
 * What an event hands us. The target is what a click needs, and that is the whole
 * point: listeners at one root can serve every control on the panel if they can
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
 * nothing.
 *
 * ⚠️ **The list's height is arithmetic, not a number typed in.** The spec
 * promises eleven bars under `Wszyscy` and ten under a filter; both are computed
 * from the row height so that changing the type size cannot quietly break the
 * promise, and the count arrives as a custom property the render sets.
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
.titlebar-button {
  padding: 0 ${t.spaceSmall};
  border: 1px solid ${t.border};
  border-radius: ${t.radius};
  color: ${t.textQuiet};
  background: ${t.surface};
  /* Overrides the move cursor the bar sets: inheriting it would promise a drag
     from the one place in the bar that does not drag. */
  cursor: pointer;
}
.titlebar-button:hover { color: ${t.text}; }
.titlebar-version { color: ${t.textQuiet}; opacity: 0.7; font-size: 10px; }
.titlebar-copy { margin-left: auto; }
/* Dimmed because it is not for the player: it hands over the raw material. */
.titlebar-raw { opacity: 0.55; }
.titlebar-raw:hover { opacity: 1; }
/*
 * No padding of its own: every region below is inset by the same step instead,
 * which is what lets the list run the full width of the panel and the rules
 * between regions reach both edges.
 */
.panel {
  font: 11px/1.35 system-ui, sans-serif;
  width: ${t.width};
  color: ${t.text};
  background: ${t.surface};
  border: 1px solid ${t.border};
  /* Square at the top: the title bar above it carries those two corners. */
  border-radius: 0 0 ${t.radius} ${t.radius};
  box-sizing: border-box;
}
.tabs { display: flex; gap: ${t.spaceHalf}; padding: ${t.spaceRegion}; padding-bottom: 0; }
/* Every strip after the first sits closer to it: they are one control, in rows.
   A sibling selector rather than a class, so a third strip needed no new rule and
   sides-of did not have to become a name for something it is not. */
.tabs + .tabs { padding-top: 3px; }
.tab {
  padding: 1px ${t.spaceSmall};
  border-radius: 3px;
  color: ${t.textQuiet};
  background: transparent;
  cursor: pointer;
  user-select: none;
}
.tab.selected { color: ${t.text}; background: ${t.surfaceRaised}; }
/* Holds the side filter against the right edge, so the row reads as the two
   controls it is rather than one strip of five words. */
.tabs-gap { flex: 1; }
.crumb { display: flex; gap: ${t.space}; align-items: baseline; padding: ${t.spaceRegion}; padding-bottom: 0; }
.crumb-back { cursor: pointer; color: ${t.textQuiet}; }
.crumb-back:hover { color: ${t.text}; }
.crumb-here { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/*
 * The list is the only thing that scrolls, and its height is fixed so the window
 * does not move under the hand when a combatant joins the fight or a breakdown
 * opens.
 */
.list {
  padding: ${t.spaceRegion};
  padding-bottom: 7px;
  height: calc(var(--rows, 11) * (${t.rowHeight} + ${t.spaceHalf}) + 12px);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
}
/*
 * Not uppercased by the stylesheet, which is what it did until a heading started
 * carrying a name: CZYM — GRACZ 4 shouts somebody name at them. The fixed
 * headings are written in capitals where they are composed, so a name keeps the
 * case the game gave it.
 */
.section-heading {
  display: flex;
  justify-content: space-between;
  color: ${t.textQuiet};
  letter-spacing: 0.08em;
  font-size: 10px;
  opacity: 0.85;
  padding: ${t.spaceSmall} ${t.spaceHalf} ${t.spaceHalf};
}
.row {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: ${t.rowHeight};
  padding: 0 ${t.spaceSmall};
  margin-bottom: ${t.spaceHalf};
  border-radius: 3px;
  background: ${t.track};
  overflow: hidden;
}
.row.can-drill { cursor: pointer; }
.row.leaf { cursor: help; }
.bar { position: absolute; left: 0; top: 0; bottom: 0; opacity: ${t.barTint}; }
/*
 * The colour at full strength, on the edge the bar starts from.
 *
 * The bar itself is tinted so the text on it stays readable — see the tint
 * token — which costs the hue the palette was validated at; the cap gives it
 * back somewhere no text sits. It says whose, while the length says how much.
 */
.bar-cap { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; border-radius: 3px 0 0 3px; }
.row-rank, .row-name, .row-value { position: relative; }
.row-rank { color: ${t.textQuiet}; font-variant-numeric: tabular-nums; padding-right: ${t.spaceSmall}; }
/*
 * The profession, as a letter. It is the channel that survives colour blindness,
 * which is the whole reason the palette can stay as it is — so it is not
 * decoration and it is not optional where the game stated a profession.
 */
.row-badge {
  position: relative;
  flex: none;
  width: 13px;
  height: 13px;
  margin-right: ${t.spaceSmall};
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  line-height: 13px;
  text-align: center;
}
.row-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.row-value { font-variant-numeric: tabular-nums; padding-left: ${t.space}; font-weight: 600; }
.row-share { color: ${t.textQuiet}; padding-left: ${t.spaceSmall}; font-weight: 400; }
/*
 * The one row that says something is missing, and so the one row that never
 * scrolls away: it sits outside the list, above the side summary.
 */
/*
 * The row for what nobody can be charged with, and it is drawn as what it is.
 *
 * A dashed rule cuts it off the ranking above, and the bar is hatched rather
 * than solid — it is not a combatant, so it must not look like one at a glance.
 * The colour is the one for "we cannot say", which is the same thing the hatch
 * says in another channel (§9.7: never colour alone).
 */
.pinned { padding: 0 7px 7px; }
.pinned .row { margin-top: ${t.spaceSmall}; border-top: 1px dashed ${t.border}; height: calc(${t.rowHeight} + 5px); }
.pinned .bar, .pinned .bar-cap { top: 4px; }
.pinned .bar {
  opacity: 0.4;
  mask-image: repeating-linear-gradient(-45deg, #000 0 4px, transparent 4px 8px);
}
.pinned .bar-cap { opacity: 0.7; }
.header { display: flex; justify-content: space-between; align-items: baseline; padding: ${t.spaceRegion}; padding-bottom: 0; }
.header-outcome { color: ${t.textQuiet}; text-transform: uppercase; font-size: 10px; }
.empty { color: ${t.textQuiet}; padding: ${t.space} ${t.spaceHalf}; }
/* The limit on what can be known reads quieter than the fact above it. */
.empty-limit { display: block; margin-top: ${t.spaceSmall}; font-size: 10px; opacity: 0.85; }
.sides-region { padding: ${t.spaceRegion}; padding-bottom: 7px; border-top: 1px solid ${t.border}; }
.sides {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.sides-label { color: ${t.textQuiet}; font-weight: 400; opacity: 0.8; }
.sides-track { display: flex; height: 4px; margin-top: ${t.spaceSmall}; border-radius: 3px; overflow: hidden; background: ${t.track}; }
.warning { color: ${t.suspect}; padding: 0 7px 5px; }
.warning:first-of-type { padding-top: 5px; border-top: 1px solid ${t.border}; }
/*
 * The detail, as a window of ours rather than the browser's own tooltip.
 *
 * Positioned against the viewport and placed from the pointer own coordinates,
 * which arrive with the event: measuring the row would mean reading layout back
 * out of a document this file knows almost nothing about. It never takes the
 * pointer, so it cannot cover the row that summoned it and flicker.
 */
.tip {
  /*
   * Absolute against the host, which is itself fixed — so the panel's own left
   * edge is the anchor and no layout has to be read to find it. Docked rather
   * than following the pointer: the panel lives in the right-hand corner, so a
   * tooltip trailing the cursor lands on the rows it is describing.
   */
  position: absolute;
  right: calc(100% + ${t.spaceSmall});
  width: ${t.tipWidth};
  padding: ${t.spaceSmall} ${t.space};
  font: 11px/1.4 system-ui, sans-serif;
  color: ${t.text};
  background: ${t.surface};
  border: 1px solid ${t.border};
  border-radius: ${t.radius};
  box-shadow: 0 6px 20px rgb(0 0 0 / 55%);
  pointer-events: none;
  z-index: ${t.layer};
}
.tip[hidden] { display: none; }
.tip-title { font-weight: 600; margin-bottom: 2px; }
.tip-heading {
  margin-top: ${t.spaceSmall};
  padding-top: ${t.spaceSmall};
  border-top: 1px solid ${t.border};
  color: ${t.textQuiet};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 10px;
}
.tip-stat { display: flex; justify-content: space-between; gap: ${t.space}; }
.tip-stat.strong { font-weight: 600; }
.tip-stat-value { font-variant-numeric: tabular-nums; }
.tip-note { color: ${t.textQuiet}; margin-top: 2px; }
.undrawn { color: ${t.textQuiet}; font-style: italic; }
`.trim();
}

/** One row, bar and all. The bar is behind the text rather than beside it. */
function renderRow(
  document: PanelDocument,
  row: PanelRow,
  rows: Map<unknown, string>,
  details: Map<unknown, PanelDetailLine[]>,
): PanelNode {
  const line = document.createElement("div");
  line.className = row.canDrill ? "row can-drill" : row.detail.length === 0 ? "row" : "row leaf";

  const bar = document.createElement("div");
  bar.className = "bar";
  bar.style.setProperty("width", `${row.fill * 100}%`);
  bar.style.setProperty("background", row.colour);

  const cap = document.createElement("div");
  cap.className = "bar-cap";
  cap.style.setProperty("background", row.colour);

  const name = document.createElement("span");
  name.className = "row-name";
  name.textContent = row.label;

  const badge = document.createElement("span");
  if (row.profession !== null) {
    badge.className = "row-badge";
    badge.textContent = row.profession.toUpperCase();
    badge.style.setProperty("background", row.colour);
    badge.style.setProperty("color", getProfessionInk(row.colour));
  }

  const value = document.createElement("span");
  value.className = "row-value";
  value.textContent = row.valueText;

  const share = document.createElement("span");
  share.className = "row-share";
  share.textContent = row.bracketText;
  value.append(share);

  const parts = [bar, cap];
  if (row.rank !== null) {
    const rank = document.createElement("span");
    rank.className = "row-rank";
    rank.textContent = `${row.rank}.`;
    parts.push(rank);
  }
  if (row.profession !== null) parts.push(badge);
  parts.push(name, value, share);
  line.append(...parts.filter((part) => part !== share));

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
    if (row.canDrill) rows.set(part, row.key);
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
): PanelNode {
  const panel = document.createElement("div");
  panel.className = "panel";
  details.clear();

  /**
   * One listener for however many controls the view holds, keyed by identity.
   *
   * §9.6 asks for delegation rather than a binding per element. Four maps rather
   * than one because what a click *means* differs, and a single map of thunks
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

  panel.addEventListener("click", (event) => {
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
      rowsByNode.set(back, "back");
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
    list.style.setProperty("--rows", `${view.visibleRows}`);

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

  if (view.pinnedRow !== null) {
    const pinned = view.pinnedRow;
    renderRegionInto(document, panel, handlers, "bez sprawcy", () => {
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

      const track = document.createElement("div");
      track.className = "sides-track";
      const ours = document.createElement("span");
      ours.style.setProperty("width", `${sides.mineShare * 100}%`);
      ours.style.setProperty("background", PANEL_TOKENS.ours);
      const theirs = document.createElement("span");
      theirs.style.setProperty("width", `${(1 - sides.mineShare) * 100}%`);
      theirs.style.setProperty("background", PANEL_TOKENS.theirs);
      track.append(ours, theirs);

      block.append(line, track);
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
  titleBar.className = "titlebar";
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

  /**
   * Where the panel's top edge is right now.
   *
   * Read from the same position the drag keeps, and from the default corner
   * before anything was dragged — the two places that already decide it. Asking
   * the document instead would be the measurement this file refuses to take.
   */
  const getPanelTop = (): number => {
    const dragged = placement?.position ?? null;
    if (dragged !== null) return dragged.top;
    return composeDefaultPosition(placement?.getViewport() ?? null)?.top ?? PANEL_PIXELS.space;
  };

  const container = document.createElement("div");
  const tip = document.createElement("div");
  tip.className = "tip";
  setTipHidden(tip, true);

  root.append(style, titleBar, container, tip);
  if (placement !== undefined) setPanelDrag(root, host, titleBar, placement);
  // The viewport is the placement is, and without it the tooltip has nothing to
  // flip against: it ran off the right edge of the page, which is exactly where
  // the panel lives.
  setPanelTip(document, root, tip, details, getPanelTop);
  return container;
}

/**
 * Hidden by an attribute the stylesheet reads, rather than by leaving the tree.
 *
 * A node that comes and goes cannot be the one the listeners were given, and the
 * whole design here is that the tooltip outlives every redraw — the same reason
 * the title bar is built with the root.
 */
function setTipHidden(tip: PanelNode, hidden: boolean): void {
  tip.className = hidden ? "tip hidden" : "tip";
  tip.style.setProperty("display", hidden ? "none" : "block");
}

/**
 * The detail, shown where the pointer is and taken away when it leaves.
 *
 * ⚠️ **Everything here is driven by the event's own coordinates.** The panel
 * reads no layout — no rectangle, no offset — because the one measurement it
 * ever wanted was rejected for the same reason (the panel's height changes with
 * every payload, so anything measured is stale before the next move). A pointer
 * that arrives without coordinates leaves the tooltip where it was rather than
 * putting it somewhere nobody asked for.
 *
 * It flips to the other side of the pointer near the right edge, which is the
 * one case where a fixed offset would push it off screen. The width it flips by
 * is the token the stylesheet uses, so the two cannot disagree.
 */
function setPanelTip(
  document: PanelDocument,
  root: PanelNode,
  tip: PanelNode,
  details: Map<unknown, PanelDetailLine[]>,
  /** Where the panel's own top edge is, so a row can be found without measuring. */
  getPanelTop: () => number = () => 0,
): void {
  root.addEventListener("pointerover", (event) => {
    const lines = details.get(event.target);
    if (lines === undefined || lines.length === 0) {
      setTipHidden(tip, true);
      return;
    }

    tip.replaceChildren(...lines.map((line) => renderDetailLine(document, line)));
    setTipHidden(tip, false);

    /**
     * The side is the stylesheet's; only the height is decided here, and it is
     * the row's own — the pointer's distance below the panel's top edge. Both
     * numbers come from the event and from what placement already knows, so the
     * panel still reads no layout.
     */
    const top = getFiniteNumberFromValue(event.clientY);
    if (top === null) return;
    tip.style.setProperty("top", `${Math.max(top - getPanelTop(), 0)}px`);
  });

  /**
   * Leaving the panel takes it away; moving between rows replaces it on the way
   * in, so nothing has to be undone between two rows.
   *
   * The node being left has to be **outside** every row for this to fire, which
   * is why the whole row is registered: a `pointerout` naming a piece of the row
   * the pointer is still inside would put the detail out from under the reader.
   */
  root.addEventListener("pointerout", (event) => {
    if (!details.has(event.target)) setTipHidden(tip, true);
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

/**
 * Draws the panel into the container, replacing whatever was there.
 *
 * A collapsed panel draws nothing at all rather than a panel with its body
 * hidden: the title bar is a separate node that outlives the render, so there is
 * always something left to grab and to expand from.
 */
export function renderPanelInto(
  document: PanelDocument,
  container: PanelNode,
  view: PanelView,
  handlers: PanelHandlers = {},
  isCollapsed = false,
  details: Map<unknown, PanelDetailLine[]> = new Map(),
): void {
  if (isCollapsed) {
    container.replaceChildren();
    details.clear();
    return;
  }
  container.replaceChildren(renderPanel(document, view, handlers, details));
}
