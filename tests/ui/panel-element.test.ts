import { describe, expect, test } from "bun:test";
import {
  composeClampedPosition,
  composeDefaultPosition,
  composeDraggedPosition,
  composePositionDeclarations,
  composeStoredTextFromPosition,
  composeTipDeclarations,
  getPositionFromStoredText,
  type PanelDocument,
  type PanelEvent,
  type PanelHost,
  type PanelNode,
  type PanelPlacement,
  type PanelScroll,
  type PanelTipBox,
  renderPanel,
  renderPanelInto,
  renderWaitingInto,
  setPanelRoot,
} from "@/src/ui/panel-element.ts";
import {
  composeColourOver,
  composePanelStyleText,
  getContrastRatio,
  PANEL_PIXELS,
  PANEL_TOKENS,
  SERIES_COLOURS,
  UNKNOWN_COLOUR,
} from "@/src/ui/panel-look.ts";
import { getNumberFromText } from "@/libs/number.ts";
/**
 * The panel, drawn, held to the promises §9.6 made before it was written.
 *
 * There is no DOM in the test runner, so the document is a small fake. That is
 * not a compromise: the properties worth checking here are about *structure and
 * restraint* — what survives a failure, what never happens at all, what still
 * works after twenty redraws — and a fake that records what it was asked to
 * build answers those exactly.
 *
 * What it cannot answer is whether the result looks right. Nothing here can;
 * that needs the game and a person. What the panel *decides* is checked without
 * a document at all, in `tests/ui/panel-view.test.ts`.
 */

import { assertDefined } from "@/libs/assert.ts";
import { getDecimalFromText } from "@/libs/number.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import type { PanelReading } from "@/src/ui/panel-reading.ts";
import {
  composeDefaultState,
  type PanelDetailLine,
  type PanelState,
} from "@/src/ui/panel-screen.ts";
import { composePanelView, PANEL_WAITING } from "@/src/ui/panel-view.ts";

type FakeListener = { type: string; listener: (event: PanelEvent) => void };

type FakeNode = PanelNode & {
  tag: string;
  children: FakeNode[];
  listeners: FakeListener[];
  properties: Record<string, string>;
  captured: number[];
  released: number[];
  /**
   * What the node measures as, which a fake has to be *told* — there is no layout
   * here and inventing one would be a test agreeing with itself.
   *
   * Nothing has a size until a test gives it one, and that zero is a real answer
   * rather than a stand-in: it is what a document with no layout engine reports,
   * and the placement is written to leave the detail where the stylesheet put it
   * when it hears one.
   */
  size: { width: number; height: number };
};

/**
 * Dispatches the way a browser would: at the root, naming what was hit.
 *
 * Two things here are modelled rather than assumed, and each was found by a
 * mutation the fake did not notice:
 *
 *   - **The type is honoured.** A fake that runs every listener whatever
 *     happened cannot tell a `pointerup` from a `pointerdown`, and would report
 *     a drag working while the panel stood still.
 *   - **A node no longer in the tree gets nothing.** A redraw detaches whatever
 *     it replaced, and a detached node stops receiving pointer events — so a
 *     grab handle built inside the render is dead after the first payload. With
 *     the target waved through, moving the title bar into the render passed
 *     every test here: the listener is keyed on identity, and an object survives
 *     being removed from a tree even though an element does not.
 */
function setEventOn(root: FakeNode, type: string, event: PanelEvent): void {
  if (!getEveryNode(root).some((node) => node === event.target)) return;
  for (const bound of root.listeners) if (bound.type === type) bound.listener(event);
}

function setClickOn(root: FakeNode, target: FakeNode): void {
  setEventOn(root, "click", { target });
}

/**
 * The gesture every control the render draws answers to.
 *
 * Beside `setClickOn` rather than in place of it: the title bar's buttons are
 * built once with the shadow root and outlive every render, so nothing can take
 * them out from under a hand and they stay on a click. Everything below the bar
 * is rebuilt on every payload, and a press is the one gesture a rebuild cannot
 * land in the middle of.
 */
function setPressOn(root: FakeNode, target: FakeNode, button?: number): void {
  setEventOn(root, "pointerdown", { target, button });
}

function composeFakeDocument(onCreate?: (tag: string) => void): PanelDocument & {
  getCreatedCount: () => number;
} {
  let created = 0;
  const document: PanelDocument = {
    createElement(tag: string): FakeNode {
      created += 1;
      onCreate?.(tag);
      let text = "";
      const node: FakeNode = {
        tag,
        className: "",
        /**
         * **Assigning it replaces every child**, which is what a real DOM does
         * and what a plain property here would not.
         *
         * Modelled because a mutation went unnoticed without it: building the
         * title bar's button and *then* setting the bar's text drops the button
         * on the floor in a browser, while a fake holding a plain string reports
         * a working panel. Same class of blind spot as the two above.
         */
        get textContent(): string {
          return text;
        },
        set textContent(next: string) {
          text = next;
          node.children = [];
        },
        title: "",
        children: [],
        listeners: [],
        properties: {},
        /**
         * ⚠️ **A browser clamps this and the fake does not**, which is the edge of
         * what the two tests below can say. They prove the number is taken off the
         * old list and put back on the new one, in that order; that a real list
         * then shows the same rows is the browser's own arithmetic, and it is
         * `.claude/skills/verify` that looks at it.
         */
        scrollTop: 0,
        captured: [],
        released: [],
        size: { width: 0, height: 0 },
        getBoundingClientRect: (): { width: number; height: number } => node.size,
        style: {
          setProperty(name: string, value: string): void {
            node.properties[name] = value;
          },
        },
        append(...nodes: PanelNode[]): void {
          node.children.push(...(nodes as FakeNode[]));
        },
        replaceChildren(...nodes: PanelNode[]): void {
          node.children = nodes as FakeNode[];
        },
        addEventListener(type: string, listener: (event: PanelEvent) => void): void {
          node.listeners.push({ type, listener });
        },
        setPointerCapture(pointerId: number): void {
          node.captured.push(pointerId);
        },
        releasePointerCapture(pointerId: number): void {
          node.released.push(pointerId);
        },
      };
      return node;
    },
  };
  return { ...document, getCreatedCount: () => created };
}

function getEveryNode(node: FakeNode): FakeNode[] {
  return [node, ...node.children.flatMap(getEveryNode)];
}

/**
 * By class list rather than by the whole string, which is what three callers
 * were doing until the selected tab started carrying a second class and two of
 * them quietly stopped finding it.
 */
function getByClass(node: FakeNode, className: string): FakeNode[] {
  return getEveryNode(node).filter((each) => each.className.split(" ").includes(className));
}

/**
 * A control addressed by what it says, never by where it sits.
 *
 * ⚠️ **Twice now an index has moved under a test that kept passing.** First a flat
 * index across every strip, when the rate control left the metric row; then an
 * index *within* the side strip, when the direction control joined it and
 * `tab[1]` stopped being `My`. A label is the one handle that does not slide:
 * if it changes, the test fails for the reason it should.
 */
function getTabByLabel(node: FakeNode, label: string): FakeNode {
  const found = getByClass(node, "tab").filter((tab) => tab.textContent === label);
  return assertDefined(found[0], `a tab labelled ${label}`);
}

/** A fight with two sides, damage on both, and something unreadable in it. */
function composeReading(): PanelReading {
  const roster = composeCombatantRoster([
    { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
    { id: 2, name: "łowca", side: 1, profession: "h", level: 93, maximumHealth: null },
    { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
  ]);
  const statistics = composeFightStatistics(
    decodeFight(
      [
        "1=90.00;3=50.00;+dmg=500;-dmg=400",
        "2=90.00;3=40.00;+dmg=200;-dmg=100",
        // A tick of poison: real damage with nobody to charge it to.
        "3=40.00;0;poison=60",
        "0;0;nonsense_key=1",
      ],
      roster,
    ),
    roster,
  );

  return {
    statistics,
    roster,
    ourSide: 1,
    isFromFightStart: true,
  };
}

/** A window to be clamped against, where a test needs the panel to know of one. */
const SCREEN = { width: 1200, height: 800 };

/** The whole window: shadow root, title bar, tooltip and the container to draw into. */
function composeMountedPanel(actions = {}, placement?: PanelPlacement) {
  const document = composeFakeDocument();
  const host = document.createElement("div") as FakeNode & PanelHost;
  host.attachShadow = (): PanelNode => {
    const root = document.createElement("root") as FakeNode;
    host.children.push(root);
    return root;
  };
  const details = new Map<unknown, PanelDetailLine[]>();
  const container = setPanelRoot(document, host, placement, actions, details) as FakeNode;
  const root = assertDefined(host.children[0], "the shadow root was opened") as FakeNode;
  return { document, host, root, container, details };
}

/**
 * A mounted panel that keeps one scroll memory across renders, the way the mount
 * does — the whole point being that the list is a different node every time.
 */
function composeRedrawnPanel() {
  const { document, container } = composeMountedPanel();
  const scroll: PanelScroll = { list: null, levelKey: null };
  const renderScreen = (state: PanelState): FakeNode => {
    renderPanelInto(
      document,
      container,
      composePanelView(composeReading(), state),
      {},
      false,
      new Map(),
      scroll,
    );
    return assertDefined(getByClass(container, "list")[0], "the list was drawn");
  };
  return { container, renderScreen };
}

function renderInto(
  state: PanelState = composeDefaultState(),
  handlers = {},
  reading: PanelReading = composeReading(),
) {
  const document = composeFakeDocument();
  const panel = renderPanel(document, composePanelView(reading, state), handlers) as FakeNode;
  return { document, panel };
}

/**
 * A fight where a blow names **neither** end: nobody swung it and it landed on a
 * name this roster has nobody to match.
 *
 * Beside the fixture rather than inside it, because it is the one shape the
 * summary's third part still stands for and no capture contains it — every name
 * in all seventeen resolves, so a bar that had simply dropped the part would draw
 * identically on every one of them.
 */
function composeReadingWithNeitherEnd(): PanelReading {
  const roster = composeCombatantRoster([
    { id: 1, name: "mag", side: 1, profession: "m", level: 105, maximumHealth: null },
    { id: 3, name: "coś dużego", side: 2, profession: null, level: null, maximumHealth: null },
  ]);
  const statistics = composeFightStatistics(
    decodeFight(["1=90.00;3=50.00;+dmg=500;-dmg=400", "0;0;+dmg=90;-dmg=70"], roster),
    roster,
  );
  return { statistics, roster, ourSide: 1, isFromFightStart: true };
}

describe("what reaches the screen", () => {
  test("draws a row for everyone, numbered, with a bar and a figure", () => {
    const { panel } = renderInto();
    const rows = getByClass(panel, "row");

    // Three combatants, and the pinned row for what nobody can be charged with —
    // which is a row on screen and deliberately not one of the ranked ones.
    expect(rows.length).toBe(4);
    expect(getByClass(panel, "row-rank").map((node) => node.textContent)).toEqual(["1.", "2.", "3."]);
    expect(getByClass(panel, "bar").length).toBe(4);
  });

  /**
   * The bar's length is the meaning, so it has to be written as well as drawn
   * (§9.7) — and the figure beside it is what a person reads out loud.
   */
  test("writes the share beside the bar rather than only drawing it", () => {
    const { panel } = renderInto();

    for (const share of getByClass(panel, "row-share")) {
      expect(share.textContent).toMatch(/^\(\d+%/);
    }
  });

  /**
   * ⚠️ **Every row states a share, and for one release four screens had one that
   * did not.**
   *
   * `Zadane · Oni` is the screen it was worst on: the pinned figure was the whole
   * fight's while the rows were one side's, so no whole on that screen contained
   * it and the composing handed over a null bracket
   * (`docs/specs/2026-08-18-a-figure-with-no-actor-has-no-side.md`). The figure is
   * the shown team's now — derived from the end the game did name — so it is
   * inside the whole and says so
   * (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`).
   *
   * Counted rather than sampled: one `.row-share` per `.row`, and none of them
   * empty. An empty one would read as a share of zero, which §9.6 keeps apart
   * from a share that was not stated.
   */
  test("draws a share beside every row it draws", () => {
    const { panel } = renderInto({ ...composeDefaultState(), metric: "dealt", team: "enemy" });
    const rows = getByClass(panel, "row");
    const shares = getByClass(panel, "row-share");

    expect(rows.length).toBeGreaterThan(0);
    expect(shares.length).toBe(rows.length);
    for (const share of shares) expect(share.textContent).not.toBe("");
  });

  /**
   * The detail is a window of ours, and it is shown by hovering rather than
   * carried on the row as the browser own tooltip: a native one cannot be
   * styled, arrives after a wait nobody chose, and would put a second kind of
   * panel over the game.
   */
  test("hovering a row opens the detail beside the panel, at that row", () => {
    const { document, root, container, details } = composeMountedPanel();
    renderPanelInto(document, container, composePanelView(composeReading(), composeDefaultState()), {}, false, details);
    const tip = assertDefined(getByClass(root, "MargoMeter-tip")[0], "the tooltip was built");
    const row = assertDefined(getByClass(container, "row")[0], "a row was drawn");

    expect(tip.properties["display"]).toBe("none");

    setEventOn(root, "pointerover", { target: row, clientX: 400, clientY: 300 });

    expect(tip.properties["display"]).toBe("block");
    // A document with no layout measures the detail as nothing, and nothing is
    // not a size to place a window by: it stays where the stylesheet put it.
    expect(tip.properties["top"]).toBe("");
    const text = getEveryNode(tip).map((node) => node.textContent);
    expect(text).toContain("Zadane");
    expect(text.some((line) => line.startsWith("ciosy"))).toBe(true);

    /**
     * ⚠️ Moving from the bar onto the name is still inside the row, and the
     * detail has to survive it: this is the bug that made the tooltip look
     * broken — it vanished the moment the pointer crossed onto a word.
     */
    const name = assertDefined(getByClass(container, "row-name")[0], "the name was drawn");
    setEventOn(root, "pointerout", { target: row });
    setEventOn(root, "pointerover", { target: name, clientY: 300 });
    expect(tip.properties["display"]).toBe("block");

    // Leaving the row for something that is not one takes it away.
    setEventOn(root, "pointerout", { target: container });
    expect(tip.properties["display"]).toBe("none");
  });

  /**
   * ⚠️ **The measurement is only right in one order**, and this is the loop no
   * other file can close: the detail is filled, shown and *then* measured, so what
   * the placement is handed is this row's detail at the size it will be drawn at.
   * Measured before the fill it is the previous row's, and measured while hidden
   * it is nothing at all — and nothing reads here as a document with no layout,
   * which leaves the window in the corner for every hover of a real session.
   *
   * The arithmetic is the tip-placement suite's. What this holds is
   * that the panel hands it a real size, the position it keeps and the window the
   * page stated.
   */
  test("the detail is measured after it is filled and shown, and placed from that", () => {
    const { document, root, container, details } = composeMountedPanel(
      {},
      { position: { left: 0, top: 8 }, getViewport: () => SCREEN },
    );
    renderPanelInto(document, container, composePanelView(composeReading(), composeDefaultState()), {}, false, details);
    const tip = assertDefined(getByClass(root, "MargoMeter-tip")[0], "the tooltip was built");
    const row = assertDefined(getByClass(container, "row")[0], "a row was drawn");
    let measuredWhileHidden: string | undefined;
    let measuredChildren = 0;
    tip.getBoundingClientRect = (): { width: number; height: number } => {
      measuredWhileHidden = tip.properties["display"];
      measuredChildren = tip.children.length;
      return { width: 250, height: 200 };
    };

    setEventOn(root, "pointerover", { target: row, clientY: 300 });

    expect(measuredWhileHidden).toBe("block");
    expect(measuredChildren).toBeGreaterThan(0);
    // The panel is at the left edge, so the detail opens on its other side: 260
    // of panel and the gap, in the panel's own coordinates.
    expect(tip.properties["left"]).toBe("264px");
    expect(tip.properties["top"]).toBe("292px");
    expect(tip.properties["right"]).toBe("auto");
  });

  /**
   * The promise, at the surface a reader meets rather than in the arithmetic: a
   * detail near the bottom of the window turns over and **ends** at the pointer
   * instead of beginning there, so all of it is on the screen and the cursor is
   * still on one of its edges.
   */
  test("a row at the bottom of the window opens a detail that ends at the pointer", () => {
    const { document, root, container, details } = composeMountedPanel(
      {},
      { position: { left: 900, top: 600 }, getViewport: () => SCREEN },
    );
    renderPanelInto(document, container, composePanelView(composeReading(), composeDefaultState()), {}, false, details);
    const tip = assertDefined(getByClass(root, "MargoMeter-tip")[0], "the tooltip was built");
    const row = assertDefined(getByClass(container, "row")[0], "a row was drawn");
    tip.getBoundingClientRect = (): { width: number; height: number } => ({ width: 250, height: 300 });

    setEventOn(root, "pointerover", { target: row, clientY: 780 });

    // The pointer at 780, less 300 of detail, less the panel's own top of 600 —
    // above the panel's corner, which is a negative offset from it.
    expect(tip.properties["top"]).toBe("-120px");
  });

  /**
   * ⚠️ **The panel the detail is placed against is the panel that is on the
   * screen, not the one that was there when the page loaded.** The drag keeps the
   * position it writes onto the host; the placement was reading the one the
   * caller handed in at mount, which stops being true the first time anybody
   * moves the panel — so a panel dragged to the left edge went on being placed
   * against the right-hand corner, and the detail went off the screen exactly
   * where it was asked not to.
   *
   * Two sources for one position, which is the fault
   * `src/ui/panel-element.ts` says out loud it will not have.
   */
  test("the detail follows the panel that was dragged, not the one it was mounted at", () => {
    const { document, host, root, container, details } = composeMountedPanel(
      {},
      { position: { left: 900, top: 100 }, getViewport: () => SCREEN },
    );
    renderPanelInto(document, container, composePanelView(composeReading(), composeDefaultState()), {}, false, details);
    const tip = assertDefined(getByClass(root, "MargoMeter-tip")[0], "the tooltip was built");
    const row = assertDefined(getByClass(container, "row")[0], "a row was drawn");
    const titleBar = assertDefined(getByClass(root, "MargoMeter-titlebar")[0], "the title bar was built");
    tip.getBoundingClientRect = (): { width: number; height: number } => ({ width: 250, height: 200 });

    // All the way to the left edge, where the detail has to change sides.
    setEventOn(root, "pointerdown", { target: titleBar, clientX: 950, clientY: 150, pointerId: 1 });
    setEventOn(root, "pointermove", { target: titleBar, clientX: 50, clientY: 150, pointerId: 1 });
    setEventOn(root, "pointerup", { target: titleBar, clientX: 50, clientY: 150, pointerId: 1 });
    setEventOn(root, "pointerover", { target: row, clientY: 300 });

    // The panel is at 0 now, so the detail is on its other side: 260 of panel and
    // the gap, in the panel's own coordinates.
    expect(host.properties["left"]).toBe("0px");
    expect(tip.properties["left"]).toBe("264px");
  });

  /**
   * A pointer that arrives without coordinates leaves the detail where it was.
   * Nothing is recomputed, because there is nothing to recompute it from — and a
   * position written from a missing coordinate is a window somewhere nobody
   * pointed at.
   */
  test("a pointer with no coordinates leaves the detail where the last one put it", () => {
    const { document, root, container, details } = composeMountedPanel(
      {},
      { position: { left: 0, top: 8 }, getViewport: () => SCREEN },
    );
    renderPanelInto(document, container, composePanelView(composeReading(), composeDefaultState()), {}, false, details);
    const tip = assertDefined(getByClass(root, "MargoMeter-tip")[0], "the tooltip was built");
    const row = assertDefined(getByClass(container, "row")[0], "a row was drawn");
    const name = assertDefined(getByClass(container, "row-name")[0], "the name was drawn");
    tip.getBoundingClientRect = (): { width: number; height: number } => ({ width: 250, height: 200 });

    setEventOn(root, "pointerover", { target: row, clientY: 300 });
    setEventOn(root, "pointerover", { target: name });

    expect(tip.properties["display"]).toBe("block");
    expect(tip.properties["top"]).toBe("292px");
  });

  /**
   * The tooltip outlives the render for the same reason the title bar does: a
   * fight redraws every few seconds, and a window rebuilt under the pointer
   * would blink out of existence exactly while being read.
   */
  test("the detail still opens after twenty redraws", () => {
    const { document, root, container, details } = composeMountedPanel();
    const view = composePanelView(composeReading(), composeDefaultState());
    for (let redraws = 0; redraws < 20; redraws += 1) {
      renderPanelInto(document, container, view, {}, false, details);
    }

    const tip = assertDefined(getByClass(root, "MargoMeter-tip")[0], "the tooltip was built");
    const row = assertDefined(getByClass(container, "row")[0], "a row was drawn");
    setEventOn(root, "pointerover", { target: row, clientX: 100, clientY: 100 });

    expect(tip.properties["display"]).toBe("block");
  });

  test("a warning is a line of its own, never a banner over the game", () => {
    const { panel } = renderInto();
    const warnings = getByClass(panel, "warning");

    expect(warnings.length).toBeGreaterThan(0);
    expect(assertDefined(warnings[0], "a warning was drawn").textContent).toContain("⚠");
  });

  /**
   * The one row that says something is missing sits outside the list, so it
   * cannot scroll away from the reader who most needs to see it.
   */
  test("the figure nobody can be charged with is pinned outside the list", () => {
    const { panel } = renderInto();
    const pinned = getByClass(panel, "pinned");
    const list = assertDefined(getByClass(panel, "list")[0], "the list was drawn");

    expect(pinned.length).toBe(1);
    expect(getEveryNode(list)).not.toContain(assertDefined(pinned[0], "pinned row"));
  });

  /**
   * ⚠️ **This region was drawn in every test in this file and asserted in none.**
   *
   * It divided the fight in two while a third of it belonged to neither side, and
   * nothing here could see that, because nothing here looked. The bar closes: as
   * many segments as there are parts with a figure, and every point of the fight
   * inside one of them.
   *
   * The fixture is 500 applied by our two and 60 of poison ticking on the enemy.
   * That 60 is the whole test — nobody swung it, so it used to stand beneath the
   * bar labelled `Bez strony`, and the roster gives the combatant it ticked on a
   * side (`docs/specs/2026-08-18-a-tick-nobody-swung-still-has-a-side.md`). It is
   * inside `My` now, which is why the figure is read here rather than the segment
   * count alone: a bar of one full-width segment says nothing about what went
   * into it.
   */
  test("the summary under the list divides the whole fight, not part of it", () => {
    const { panel } = renderInto();
    const region = assertDefined(getByClass(panel, "sides-region")[0], "the summary");
    const track = assertDefined(getByClass(region, "sides-track")[0], "the split bar");

    const widths = track.children.map((part) =>
      assertDefined(
        getDecimalFromText((part.properties["width"] ?? "").replace("%", "")),
        "a segment carries a width",
      ),
    );
    expect(widths.length).toBe(1);
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 6);
    expect(getEveryNode(region).map((node) => node.textContent)).toContain("560");
    // Nothing is left over to name, so nothing is named: the line is absent
    // rather than drawn at zero.
    expect(getByClass(region, "sides-spare").length).toBe(0);
  });

  /**
   * And the part that survives, on the one fight shape it stands for.
   *
   * A blow naming neither end has no side to be charged to at either end, so it
   * is beneath the bar rather than inside it — named, counted, and in the colour
   * that carries no side. Without this the part could be deleted and every test
   * here would still pass, because no capture reaches the shape.
   */
  test("what has no side at either end is named beneath the bar", () => {
    const { panel } = renderInto(composeDefaultState(), {}, composeReadingWithNeitherEnd());
    const region = assertDefined(getByClass(panel, "sides-region")[0], "the summary");
    const track = assertDefined(getByClass(region, "sides-track")[0], "the split bar");
    const spare = assertDefined(getByClass(region, "sides-spare")[0], "what has no side");

    expect(getEveryNode(spare).map((node) => node.textContent)).toEqual(
      expect.arrayContaining(["Bez strony", "70"]),
    );
    expect(spare.properties["color"]).toBe(UNKNOWN_COLOUR);
    expect(
      assertDefined(track.children.at(-1), "the segment with no side").properties["background"],
    ).toBe(UNKNOWN_COLOUR);
  });

  /**
   * A share of nothing is not a half-and-half split, and it used to draw one:
   * `mineShare` fell back to `0.5`, so a fight with no healing at all showed the
   * two sides evenly matched at it. Nothing measured is nothing drawn (§9.6).
   */
  test("draws no split bar where there is nothing to divide", () => {
    const { panel } = renderInto({ ...composeDefaultState(), metric: "healingGiven" });
    const region = assertDefined(getByClass(panel, "sides-region")[0], "the summary");

    expect(getByClass(region, "sides-track").length).toBe(0);
  });

  /**
   * The two figures are the fight's, whatever the list below them shows — so on a
   * breakdown, where the list is one combatant, the label has to say whose they
   * are. Without it they read as that combatant's, at ten times the scale.
   */
  test("says the summary is the whole fight once the list stops being one", () => {
    const ranking = renderInto().panel;
    const breakdown = renderInto({ ...composeDefaultState(), focusCombatantId: 1 }).panel;
    const getSummaryLabel = (panel: FakeNode): string =>
      assertDefined(getByClass(panel, "sides-label")[0], "the summary label").textContent;

    expect(getSummaryLabel(ranking)).toBe("My / Oni");
    expect(getSummaryLabel(breakdown)).toContain("Cała walka");
  });

  /**
   * Both numbers, because only one of them was ever checked here: a render that
   * ignored the view and wrote eleven into the stylesheet passed this test for as
   * long as it asked one question.
   */
  test("the list says how many rows it shows before it scrolls", () => {
    const { panel } = renderInto();
    const list = assertDefined(getByClass(panel, "list")[0], "the list was drawn");
    const filtered = renderInto({ ...composeDefaultState(), team: "mine" }).panel;

    expect(list.properties["--MargoMeter-rows"]).toBe("11");
    expect(
      assertDefined(getByClass(filtered, "list")[0], "the filtered list was drawn").properties[
        "--MargoMeter-rows"
      ],
    ).toBe("10");
  });
});

describe("one gesture in, one gesture out", () => {
  test("a press on a row asks for that row and nothing else", () => {
    const chosen: string[] = [];
    const { panel } = renderInto(composeDefaultState(), { onRowChosen: (key: string) => chosen.push(key) });
    const row = assertDefined(getByClass(panel, "row")[0], "a row was drawn");

    setPressOn(panel, row);
    expect(chosen).toEqual(["combatant:1"]);
  });

  /**
   * The noun carries the direction across with it. From `Obrażenia · zadane`,
   * `Leczenie` is healing **given** — turning the figure round under the hand of
   * somebody who only asked to change the subject is the thing this prevents.
   */
  test("a press on a noun keeps the direction it was read in", () => {
    const metrics: string[] = [];
    const { panel } = renderInto(composeDefaultState(), {
      onMetricChosen: (metric: string) => metrics.push(metric),
    });

    setPressOn(panel, getTabByLabel(panel, "Leczenie"));

    expect(metrics).toEqual(["healingGiven"]);
  });

  test("and from the other direction it keeps that one instead", () => {
    const metrics: string[] = [];
    const { panel } = renderInto(
      { ...composeDefaultState(), metric: "taken" },
      { onMetricChosen: (metric: string) => metrics.push(metric) },
    );

    setPressOn(panel, getTabByLabel(panel, "Leczenie"));

    expect(metrics).toEqual(["healed"]);
  });

  /**
   * Both strips report the same kind of choice — which figure — so the drawing
   * needs no second handler and no second map, however many axes the panel grows.
   */
  test("a press on a direction asks for that metric", () => {
    const metrics: string[] = [];
    const { panel } = renderInto(composeDefaultState(), {
      onMetricChosen: (metric: string) => metrics.push(metric),
    });

    setPressOn(panel, getTabByLabel(panel, "otrzymane"));

    expect(metrics).toEqual(["taken"]);
  });

  /**
   * Selected from its own strip rather than by counting from the first.
   *
   * ⚠️ **A flat index across every tab is a test that keeps passing while it
   * checks something else.** This one read `tabs[5]` and meant the side strip's
   * second tab; moving the rate control out of the metric row slid `tabs[5]` onto
   * a different button, and the assertion went green against the wrong one.
   */


  test("a side tab asks for that side", () => {
    const teams: string[] = [];
    const { panel } = renderInto(composeDefaultState(), { onTeamChosen: (team: string) => teams.push(team) });
    const sides = assertDefined(getByClass(panel, "sides-of")[0], "the side strip");

    setPressOn(panel, getTabByLabel(sides, "My"));
    expect(teams).toEqual(["mine"]);
  });

  /**
   * ⚠️ **The defect this replaces cannot be dispatched into a fake; the property
   * that closes it can.** A browser assembles `click` out of a press and a
   * release and drops it when what sat between them has left the tree — and every
   * node here leaves the tree on every payload, because `renderPanelInto`
   * replaces the lot. So the reader pressed a tab during a fight, a payload
   * landed, and nothing happened.
   *
   * What is checkable without a browser is that no control needs two events:
   * a press alone drives every one of them, and nothing the render draws is
   * waiting for a click. The second half is what would go red if a click path
   * were ever added back beside this one.
   */
  test("every control answers to a press alone, and nothing waits for a click", () => {
    const chosen: string[] = [];
    const metrics: string[] = [];
    const teams: string[] = [];
    const { panel } = renderInto(composeDefaultState(), {
      onRowChosen: (key: string) => chosen.push(key),
      onMetricChosen: (metric: string) => metrics.push(metric),
      onTeamChosen: (team: string) => teams.push(team),
    });
    const row = assertDefined(getByClass(panel, "row")[0], "a row was drawn");
    const sides = assertDefined(getByClass(panel, "sides-of")[0], "the side strip");

    setPressOn(panel, row);
    setPressOn(panel, getTabByLabel(panel, "Leczenie"));
    setPressOn(panel, getTabByLabel(sides, "My"));

    expect([chosen.length, metrics.length, teams.length]).toEqual([1, 1, 1]);
    expect(
      getEveryNode(panel)
        .flatMap((node) => node.listeners)
        .filter((bound) => bound.type === "click"),
    ).toEqual([]);
  });

  /**
   * The other half of the gesture below, and it has to be tested with it: a
   * right-press arrives as a `pointerdown` *before* the menu event, so a panel
   * acting on every press would open the row and then step straight back out of
   * it — one gesture spending itself twice.
   */
  test("a press that is not the primary button opens nothing, and going back still works", () => {
    const chosen: string[] = [];
    let back = 0;
    const { panel } = renderInto(composeDefaultState(), {
      onRowChosen: (key: string) => chosen.push(key),
      onBack: () => {
        back += 1;
      },
    });
    const row = assertDefined(getByClass(panel, "row")[0], "a row was drawn");

    setPressOn(panel, row, 2);
    setEventOn(panel, "contextmenu", { target: row, preventDefault: (): void => {} });

    expect(chosen).toEqual([]);
    expect(back).toBe(1);
  });

  /**
   * The way out works from anywhere in the panel, including the empty space
   * under a short list. A back button alone would make the cheapest gesture the
   * one that needs aiming.
   */
  test("the right button goes back from anywhere, and the page never sees it", () => {
    let back = 0;
    let defaultsPrevented = 0;
    const { panel } = renderInto(composeDefaultState(), {
      onBack: () => {
        back += 1;
      },
    });

    setEventOn(panel, "contextmenu", {
      target: panel,
      preventDefault: () => {
        defaultsPrevented += 1;
      },
    });

    expect(back).toBe(1);
    expect(defaultsPrevented).toBe(1);
  });

  /**
   * §9.6: an add-on that breaks the game's own scripts has done far more damage
   * than one that shows a wrong number. Every handler catches its own.
   */
  test("a handler that throws is reported rather than escaping into the page", () => {
    const failures: unknown[] = [];
    const { panel } = renderInto(composeDefaultState(), {
      onRowChosen: () => {
        // Broken the way a handler really breaks — reaching into nothing — rather
        // than by throwing something this repository would never throw (§9.5).
        const broken = undefined as unknown as { choose: () => void };
        broken.choose();
      },
      onSectionFailure: (error: unknown) => failures.push(error),
    });
    const row = assertDefined(getByClass(panel, "row")[0], "a row was drawn");

    expect(() => setPressOn(panel, row)).not.toThrow();
    expect(failures.length).toBe(1);
  });
});

describe("failure is the size of the thing that failed", () => {
  /**
   * §9.6 forbids vanishing: whatever can still be drawn is drawn, and only the
   * part that failed is replaced in place.
   */
  test("a region that throws leaves its neighbours on screen", () => {
    const document = composeFakeDocument();
    const view = composePanelView(composeReading(), composeDefaultState());
    // A list that throws when read is the closest thing to a section going wrong
    // that a fake can produce without reaching into the renderer.
    Object.defineProperty(view, "lists", {
      get() {
        const broken = undefined as unknown as { read: () => void };
        broken.read();
      },
    });

    const failures: unknown[] = [];
    const panel = renderPanel(document, view, {
      onSectionFailure: (error) => failures.push(error),
    }) as FakeNode;

    expect(failures.length).toBe(1);
    expect(getByClass(panel, "undrawn").length).toBe(1);
    // The header and the tabs were drawn before it and survive it.
    expect(getByClass(panel, "tab").length).toBeGreaterThan(0);
  });
});

describe("the window itself", () => {
  test("the title bar carries one copy, one developer copy and one collapse", () => {
    const asked: string[] = [];
    const { root } = composeMountedPanel({
      onCopyRequested: () => asked.push("copy"),
      onCaptureRequested: () => asked.push("raw"),
      onCollapseToggled: () => asked.push("collapse"),
    });
    const buttons = getByClass(root, "titlebar-button");

    expect(buttons.length).toBe(3);
    for (const button of buttons) setClickOn(root, button);
    expect(asked).toEqual(["copy", "raw", "collapse"]);
  });

  /**
   * A control that does nothing is worse than one that is not there: the panel is
   * mounted in places with no fight to hand over.
   */
  test("a button nobody offered is not drawn", () => {
    const { root } = composeMountedPanel({});

    expect(getByClass(root, "titlebar-button").length).toBe(0);
  });

  /**
   * §9.6, at the one level of the shadow tree an inspector opens onto.
   *
   * The host says whose it is — `tests/game/engine-attachment.test.ts` holds that,
   * because `ui` has no page to append it to. What this file can reach is the rung
   * below: expand the shadow root and the three nodes under it say the same thing.
   * Everything deeper stays unprefixed on purpose, and the rule says why — the
   * shadow root is the isolation, so a prefix on `.row` would buy noise.
   *
   * ⚠️ **Over every child rather than over the three we know about.** Naming them
   * individually is a test that passes forever while a fourth arrives unnamed
   * beside them, which is how the host itself went anonymous for the life of the
   * project. `<style>` is exempt because it draws nothing and carries no class.
   */
  test("everything at the top of the shadow tree says whose it is", () => {
    const { root } = composeMountedPanel({
      onCopyRequested: () => undefined,
      onCaptureRequested: () => undefined,
      onCollapseToggled: () => undefined,
    });

    const drawn = root.children.filter((child) => child.tag !== "style");
    // A loop over nothing is green and proves nothing.
    expect(drawn.length).toBeGreaterThan(0);
    for (const child of drawn) {
      const [first] = child.className.split(" ");
      expect(first, `a node at the top of the shadow tree with no name of ours`).toStartWith(
        "MargoMeter-",
      );
    }
  });

  test("a collapsed panel draws nothing, and the bar it is collapsed by survives", () => {
    const { document, root, container } = composeMountedPanel({ onCollapseToggled: () => undefined });
    const view = composePanelView(composeReading(), composeDefaultState());

    renderPanelInto(document, container, view, {}, true);
    expect(container.children.length).toBe(0);
    expect(getByClass(root, "MargoMeter-titlebar").length).toBe(1);

    renderPanelInto(document, container, view, {}, false);
    expect(container.children.length).toBe(1);
  });

  /**
   * ⚠️ **The state the test above describes used to be reachable two ways**, and
   * only one of them was a collapse. Before the first payload the mount drew
   * nothing at all, so a panel waiting for a fight and a panel folded away were
   * the same picture — a bar and no body — and neither said which it was.
   */
  describe("the panel before a fight has reached it", () => {
    test("the body says so, rather than being empty", () => {
      const { document, container } = composeMountedPanel();

      renderWaitingInto(document, container, PANEL_WAITING);

      const panel = assertDefined(container.children[0], "the waiting body was drawn");
      const sentences = getByClass(panel, "empty").map((node) => node.textContent);
      expect(sentences).toEqual([PANEL_WAITING.text]);
    });

    /**
     * The one number the two states have to agree on. A body one line tall under a
     * title bar is the shape of a collapsed panel again, so the height is the
     * ranking's own — read off a real view rather than written down here, which is
     * what makes the two impossible to drift apart.
     */
    test("it reserves the height the ranking will have", () => {
      const { document, container } = composeMountedPanel();
      const ranking = composePanelView(composeReading(), composeDefaultState());

      renderWaitingInto(document, container, PANEL_WAITING);
      const waiting = assertDefined(container.children[0], "the waiting body was drawn");
      const box = assertDefined(getByClass(waiting, "list")[0], "the waiting body has a list");

      expect(box.properties["--MargoMeter-rows"]).toBe(String(ranking.visibleRows));
    });

    test("it collapses and comes back, like the panel it precedes", () => {
      const { document, root, container } = composeMountedPanel({
        onCollapseToggled: () => undefined,
      });

      renderWaitingInto(document, container, PANEL_WAITING, {}, true);
      expect(container.children.length).toBe(0);
      expect(getByClass(root, "MargoMeter-titlebar").length).toBe(1);

      renderWaitingInto(document, container, PANEL_WAITING, {}, false);
      expect(container.children.length).toBe(1);
    });

    /** §9.6 forbids vanishing here too, and it is the only region there is. */
    test("a region that throws leaves a marker rather than a blank body", () => {
      const { document, container } = composeMountedPanel();
      const waiting = { ...PANEL_WAITING };
      Object.defineProperty(waiting, "visibleRows", {
        get() {
          const broken = undefined as unknown as { read: () => void };
          broken.read();
        },
      });

      const failures: unknown[] = [];
      renderWaitingInto(document, container, waiting, {
        onSectionFailure: (error) => failures.push(error),
      });

      const panel = assertDefined(container.children[0], "the waiting body was drawn");
      expect(failures.length).toBe(1);
      expect(getByClass(panel, "undrawn").length).toBe(1);
    });
  });

  /**
   * ⚠️ **A fight redraws every few seconds, and every redraw is a new list.**
   * Without this the reader is put back at the top of it on every payload, so a
   * fight big enough to scroll has to be scrolled again, and again, and again.
   *
   * The container is named too: the panel's ceiling reaches the list through it,
   * and a node with no class is one the stylesheet cannot pass through.
   */
  test("the reader's place in the list survives a redraw of the same screen", () => {
    const { container, renderScreen } = composeRedrawnPanel();
    const state = composeDefaultState();

    expect(container.className).toBe("MargoMeter-body");

    renderScreen(state).scrollTop = 60;
    expect(renderScreen(state).scrollTop).toBe(60);
  });

  test("and starts at the top of a screen they moved to", () => {
    const { renderScreen } = composeRedrawnPanel();

    renderScreen(composeDefaultState()).scrollTop = 60;

    // Into a combatant: a different list, so the old offset means nothing in it.
    expect(renderScreen({ ...composeDefaultState(), focusCombatantId: 1 }).scrollTop).toBe(0);
  });

  /**
   * ⚠️ **The property the title bar's whole design exists for.** A fight redraws
   * every few seconds, and a grab handle built inside the render would be
   * destroyed under the pointer exactly when somebody is moving the panel out of
   * the way.
   */
  test("the panel still drags after twenty redraws", () => {
    const document = composeFakeDocument();
    const host = document.createElement("div") as FakeNode & PanelHost;
    host.attachShadow = (): PanelNode => {
      const root = document.createElement("root") as FakeNode;
      host.children.push(root);
      return root;
    };

    const moved: Array<{ left: number; top: number }> = [];
    const container = setPanelRoot(document, host, {
      position: { left: 100, top: 100 },
      getViewport: () => ({ width: 1200, height: 800 }),
      onMoved: (position) => moved.push(position),
    }) as FakeNode;
    const root = assertDefined(host.children[0], "the shadow root was opened") as FakeNode;
    const titleBar = assertDefined(getByClass(root, "MargoMeter-titlebar")[0], "the title bar was built");

    const view = composePanelView(composeReading(), composeDefaultState());
    for (let redraws = 0; redraws < 20; redraws += 1) {
      renderPanelInto(document, container, view, {});
    }

    setEventOn(root, "pointerdown", { target: titleBar, clientX: 150, clientY: 150, pointerId: 1 });
    setEventOn(root, "pointermove", { target: titleBar, clientX: 160, clientY: 170, pointerId: 1 });
    setEventOn(root, "pointerup", { target: titleBar, clientX: 160, clientY: 170, pointerId: 1 });

    expect(moved).toEqual([{ left: 110, top: 120 }]);
  });

  /**
   * A host whose shadow root can be opened, which is what a drag needs and what
   * `composeFakeDocument` alone does not give.
   */
  const composeDraggableHost = (): { document: PanelDocument; host: FakeNode & PanelHost } => {
    const document = composeFakeDocument();
    const host = document.createElement("div") as FakeNode & PanelHost;
    host.attachShadow = (): PanelNode => {
      const root = document.createElement("root") as FakeNode;
      host.children.push(root);
      return root;
    };
    return { document, host };
  };

  /**
   * The one phase of the cost measurement that runs inside `ui`, and it arrives
   * as a function with its name already bound — this layer may read neither the
   * seam nor the vocabulary it measures under (§9.1). Wrapping the move rather
   * than the drag: a move is what happens tens of times a second.
   */
  test("lets the caller time a move, and moves the panel exactly once either way", () => {
    const { document, host } = composeDraggableHost();
    const timed: number[] = [];
    setPanelRoot(document, host, {
      position: { left: 100, top: 100 },
      getViewport: () => ({ width: 1200, height: 800 }),
      getTimedResult: (work) => {
        timed.push(1);
        return work();
      },
    });
    const root = assertDefined(host.children[0], "the shadow root was opened") as FakeNode;
    const titleBar = assertDefined(getByClass(root, "MargoMeter-titlebar")[0], "the title bar was built");

    setEventOn(root, "pointerdown", { target: titleBar, clientX: 150, clientY: 150, pointerId: 1 });
    setEventOn(root, "pointermove", { target: titleBar, clientX: 160, clientY: 170, pointerId: 1 });

    expect(timed).toHaveLength(1);
    expect(host.properties["left"]).toBe("110px");
  });

  // Absent, which is what the file people install passes, the drag is the same
  // drag: the seam defaults to running the work and nothing else.
  test("drags the same with nobody timing it", () => {
    const { document, host } = composeDraggableHost();
    setPanelRoot(document, host, {
      position: { left: 100, top: 100 },
      getViewport: () => ({ width: 1200, height: 800 }),
    });
    const root = assertDefined(host.children[0], "the shadow root was opened") as FakeNode;
    const titleBar = assertDefined(getByClass(root, "MargoMeter-titlebar")[0], "the title bar was built");

    setEventOn(root, "pointerdown", { target: titleBar, clientX: 150, clientY: 150, pointerId: 1 });
    setEventOn(root, "pointermove", { target: titleBar, clientX: 160, clientY: 170, pointerId: 1 });

    expect(host.properties["left"]).toBe("110px");
  });
});

describe("what the panel never does", () => {
  /**
   * §9.7: text on a coloured bar clears WCAG AA by measurement rather than by
   * eye. The bar is tinted rather than solid precisely so this can hold for every
   * colour in the palette.
   */
  test("every bar colour keeps its row readable", () => {
    const tint = assertDefined(
      getDecimalFromText(PANEL_TOKENS.barTint),
      "the bar tint is a decimal",
    );

    for (const colour of SERIES_COLOURS) {
      const over = assertDefined(
        composeColourOver(colour, PANEL_TOKENS.surfaceRaised, tint),
        `${colour} composes over the row`,
      );
      const ratio = assertDefined(
        getContrastRatio(PANEL_TOKENS.text, over),
        `${colour} has a contrast ratio`,
      );
      expect(ratio, colour).toBeGreaterThanOrEqual(4.5);
    }
  });

  /**
   * The two side colours are checked in their own role, and the distinction is
   * not pedantry: they are never drawn *behind* text — the summary writes its
   * figures IN them, and the split bar under it carries no text at all. Held to
   * the bar rule they fail at 4.15, and changing the palette to satisfy a
   * question nobody asks would be the wrong fix.
   */
  test("a side's own figure is readable in the colour it is written in", () => {
    // The third one joined them when the summary stopped dividing the fight in
    // two: it is written as text under the bar, so it answers the same question.
    for (const colour of [PANEL_TOKENS.ours, PANEL_TOKENS.theirs, UNKNOWN_COLOUR]) {
      const ratio = assertDefined(
        getContrastRatio(colour, PANEL_TOKENS.surface),
        `${colour} has a contrast ratio`,
      );
      expect(ratio, colour).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("the stylesheet cuts the panel off from the game's own", () => {
    expect(composePanelStyleText()).toContain("all: initial");
  });

  /**
   * ⚠️ **The panel is a guest, and a guest does not cover the room.** Two limits,
   * and the test holds both because they answer different failures: without the
   * first, a breakdown opened on a panel dragged low runs off the bottom of the
   * screen and takes its own figures with it; without the second, a tall monitor
   * lets it cover the fight somebody is trying to watch.
   *
   * Checked as text, which is all a test without a browser can do here — the
   * arrangement it describes is `.claude/skills/verify`'s to look at (§8: the gate
   * cannot see a panel).
   */
  test("the panel is capped by the window, and the list is the only thing that gives way", () => {
    const style = composePanelStyleText();

    expect(style).toContain(
      `max-height: min(calc(100vh - var(--MargoMeter-panel-top) - ${PANEL_TOKENS.space}), ${PANEL_TOKENS.maxHeightShare})`,
    );
    // The chain the cap travels down, and the one region told to absorb it.
    expect(style).toContain(".MargoMeter-body { display: flex; flex-direction: column; min-height: 0; }");
    expect(style).toContain(".panel > * { flex: none; }");
    expect(style).toContain(".panel > .list { flex: 0 1 auto; }");
  });

  /**
   * ⚠️ **Measured in a browser, because the gate cannot see this one.** A scroll
   * container's padding is inside its clip, so a heading pinned at `top: 0` leaves
   * the list's own five pixels above itself and the row that just scrolled away
   * shows through them — half a bar hanging over the heading. The pull cancels the
   * inset exactly, which is the whole reason the inset has a name of its own: two
   * literals here would part company the first time the panel's spacing changed.
   */
  test("a sticky heading is pulled up by exactly the inset it has to cancel", () => {
    expect(composePanelStyleText()).toContain(`top: -${PANEL_TOKENS.spaceRegionDown};`);
    expect(PANEL_TOKENS.spaceRegion.startsWith(`${PANEL_TOKENS.spaceRegionDown} `)).toBe(true);
  });

  /**
   * ⚠️ **Seen in the panel: the one row that says something is missing was the
   * one row whose marking did not fill it.** The dashed rule sat on the row and
   * bought the air under itself by making that row 5px taller and pushing
   * `.bar` and `.bar-cap` down 4px — a 19px marking inside a 23px track, so a
   * strip of bare background showed above the hatch and the cap, and the bar
   * stood at a height no ranked row has.
   *
   * The rule moved to the block. What holds it there is stated as the property
   * rather than as the fix: `.pinned` may say how the row is *coloured* — the
   * hatch, the two opacities — and may say nothing about where its box begins
   * or how tall it is. `.row` is the only thing that decides that, for every
   * row, and a bar inset to `top: 0; bottom: 0` then fills exactly what it sits
   * on. Checked as text, because the gate cannot see a panel (§8).
   */
  test("the pinned row states no geometry of its own, so its bar fills it", () => {
    const rules = getStyleRules(composePanelStyleText()).filter((rule) => rule.selector.startsWith(".pinned"));

    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      const properties = rule.body.split(";").map((one) => one.split(":")[0]!.trim());

      expect(properties, rule.selector).not.toContain("height");
      expect(properties, rule.selector).not.toContain("top");
      expect(properties, rule.selector).not.toContain("bottom");
    }

    // The separation the row gave up, on the block that took it over: the rule
    // is the block's top edge, and the air under it is the block's padding.
    const block = assertDefined(
      rules.find((rule) => rule.selector === ".pinned"),
      "the pinned block has a rule of its own",
    );

    expect(block.body).toContain(`border-top: 1px dashed ${PANEL_TOKENS.border}`);
    expect(block.body).toContain(`padding: ${PANEL_TOKENS.spaceSmall} 0 ${PANEL_TOKENS.spaceRegionAcross}`);
  });
});

/**
 * The stylesheet cut into selector and declarations, which is all a claim about
 * one rule needs. Comments go first: they ship inside the sheet, so a selector
 * read without dropping them is the prose above it.
 */
function getStyleRules(style: string): { selector: string; body: string }[] {
  return style
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("}")
    .filter((chunk) => chunk.includes("{"))
    .map((chunk) => {
      const cut = chunk.indexOf("{");

      return { selector: chunk.slice(0, cut).trim(), body: chunk.slice(cut + 1) };
    });
}

describe("pressing the part of a row somebody actually aims at", () => {
  /**
   * ⚠️ **The bug this exists for.** An event names the deepest node under the
   * pointer, so a click lands on the bar, the name or the figure — never on the
   * row itself unless the pointer happens to be over its padding. With only the
   * row registered, clicking a bar did nothing at all, which is what a player
   * does most of the time.
   */
  test("every piece of a row leads where the row leads", () => {
    const chosen: string[] = [];
    const { panel } = renderInto(composeDefaultState(), {
      onRowChosen: (key: string) => chosen.push(key),
    });
    const row = assertDefined(getByClass(panel, "row")[0], "a row was drawn");

    for (const part of getEveryNode(row)) setPressOn(panel, part);

    // Every node of the row, the row included, and all of them the same row.
    expect(chosen.length).toBe(getEveryNode(row).length);
    expect(new Set(chosen)).toEqual(new Set(["combatant:1"]));
  });
});

/**
 * Where the panel is allowed to be, and what a stored position has to prove.
 *
 * No document here at all — that is the point of the split. The arithmetic that
 * decides whether the panel can be dragged off the screen is the part with a
 * wrong answer, and it is checkable on its own.
 */


const PLACEMENT_SCREEN = { width: 1920, height: 1080 };

describe("moving the panel", () => {
  test("a drag translates the panel by what the pointer travelled", () => {
    const grab = { pointerLeft: 500, pointerTop: 300, panelLeft: 1602, panelTop: 8 };
    const moved = composeDraggedPosition(grab, { left: 520, top: 340 }, PLACEMENT_SCREEN);

    expect(moved).toEqual({ left: 1622, top: 48 });
  });

  test("a drag backwards past the top left stops at the corner", () => {
    const grab = { pointerLeft: 100, pointerTop: 100, panelLeft: 40, panelTop: 20 };
    const moved = composeDraggedPosition(grab, { left: 0, top: 0 }, PLACEMENT_SCREEN);

    expect(moved).toEqual({ left: 0, top: 0 });
  });

  /**
   * ⚠️ The reason the clamp exists. A panel dragged off the right edge takes its
   * own grab area with it, and the only way back is knowing that this add-on
   * stores a position at all.
   */
  test("a drag off the edge leaves enough panel to grab it back by", () => {
    const grab = { pointerLeft: 900, pointerTop: 500, panelLeft: 900, panelTop: 500 };
    const moved = composeDraggedPosition(grab, { left: 9000, top: 9000 }, PLACEMENT_SCREEN);

    expect(moved.left).toBeLessThan(PLACEMENT_SCREEN.width);
    expect(moved.top).toBeLessThan(PLACEMENT_SCREEN.height);
    expect(PLACEMENT_SCREEN.width - moved.left).toBeGreaterThanOrEqual(64);
    expect(PLACEMENT_SCREEN.height - moved.top).toBeGreaterThanOrEqual(64);
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
    const moved = composeDraggedPosition(grab, { left: 20.25, top: 30.75 }, PLACEMENT_SCREEN);

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
    expect(composeDefaultPosition(PLACEMENT_SCREEN)).toEqual({
      left: PLACEMENT_SCREEN.width - PANEL_PIXELS.width - PANEL_PIXELS.space,
      top: PANEL_PIXELS.space,
    });
  });

  test("without a viewport there is no telling where a right-anchored panel is", () => {
    expect(composeDefaultPosition(null)).toBeNull();
  });

  /**
   * The fourth pair is what keeps the panel above the bottom of the screen: the
   * ceiling in the stylesheet is the window's height less the top edge, and CSS
   * cannot read a `top` back out of an inline style. So the same number is written
   * twice, and the test holds the two to being the same number — a `--MargoMeter-panel-top`
   * that drifted from `top` would cap the panel against a place it is not.
   */
  test("a position releases the corner it was anchored to, and carries the ceiling with it", () => {
    expect(composePositionDeclarations({ left: 12, top: 34 })).toEqual([
      ["left", "12px"],
      ["top", "34px"],
      ["--MargoMeter-panel-top", "34px"],
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


const TIP_SCREEN = { width: 1200, height: 800 };
const TIP: PanelTipBox = { width: PANEL_PIXELS.tipWidth, height: 200 };
/** The right-hand corner the panel starts in, where every default hover happens. */
const CORNER = { left: TIP_SCREEN.width - PANEL_PIXELS.width - PANEL_PIXELS.space, top: 8 };

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
  expect(box.right).toBeLessThanOrEqual(TIP_SCREEN.width);
  expect(box.bottom).toBeLessThanOrEqual(TIP_SCREEN.height);
}

describe("the whole of the detail is on the screen", () => {
  /**
   * The four corners a panel can be dragged into, and both ends of the window for
   * the pointer — swept rather than reasoned about, because the promise is one
   * sentence and the cases that break it are the ones nobody thought to name.
   *
   * The panel positions include what the drag clamp allows at its most extreme:
   * `src/ui/panel-element.ts` keeps 64px of panel on screen and no more, so a
   * panel whose own right edge is off the window is a real position and not a
   * contrived one.
   */
  const PANELS = [
    { left: 0, top: 0 },
    { left: 0, top: TIP_SCREEN.height - 64 },
    { left: CORNER.left, top: CORNER.top },
    { left: TIP_SCREEN.width - 64, top: TIP_SCREEN.height - 64 },
    { left: 300, top: 300 },
  ];
  const POINTERS = [0, 1, 8, 400, TIP_SCREEN.height - 1, TIP_SCREEN.height];
  const TIPS: PanelTipBox[] = [
    { width: 250, height: 1 },
    { width: 250, height: 200 },
    { width: 250, height: 700 },
    { width: 250, height: TIP_SCREEN.height - 2 * PANEL_PIXELS.space },
  ];

  for (const panel of PANELS) {
    for (const pointerTop of POINTERS) {
      for (const tip of TIPS) {
        test(`panel ${panel.left},${panel.top} · pointer ${pointerTop} · tip ${tip.height} tall`, () => {
          expectOnScreen(
            getScreenBox(composeTipDeclarations(pointerTop, tip, panel, TIP_SCREEN), panel, tip),
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
    const box = getScreenBox(composeTipDeclarations(400, TIP, CORNER, TIP_SCREEN), CORNER, TIP);

    expect(box.right).toBe(CORNER.left - PANEL_PIXELS.spaceSmall);
    expect(CORNER.left + PANEL_PIXELS.width + PANEL_PIXELS.spaceSmall + TIP.width).toBeGreaterThan(
      TIP_SCREEN.width,
    );
  });

  /**
   * One pixel short of the margin is a detail hard against the edge of the
   * screen, which is where the flip belongs: the left slot has run out.
   */
  test("the panel's right, where its left has run out", () => {
    const panel = { left: PANEL_PIXELS.tipWidth + PANEL_PIXELS.spaceSmall - 1, top: 8 };
    const box = getScreenBox(composeTipDeclarations(400, TIP, panel, TIP_SCREEN), panel, TIP);

    expect(box.left).toBe(panel.left + PANEL_PIXELS.width + PANEL_PIXELS.spaceSmall);
  });

  test("and its left again as soon as the margin fits", () => {
    const panel = { left: PANEL_PIXELS.tipWidth + PANEL_PIXELS.spaceSmall + PANEL_PIXELS.space, top: 8 };
    const box = getScreenBox(composeTipDeclarations(400, TIP, panel, TIP_SCREEN), panel, TIP);

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
    const box = getScreenBox(composeTipDeclarations(300, TIP, CORNER, TIP_SCREEN), CORNER, TIP);

    expect(box.top).toBe(300);
  });

  /**
   * ⚠️ **The pointer stays on an edge of the window, and the window turns over.**
   * Sliding it up until it fits would also be on the screen, and it would leave
   * the pointer somewhere in the middle of a detail — against a row it is not
   * describing. This is the same rule as the side above, on the other axis.
   */
  test("and ends at it instead, where there is not room below", () => {
    const box = getScreenBox(composeTipDeclarations(780, TIP, CORNER, TIP_SCREEN), CORNER, TIP);

    expect(box.bottom).toBe(780);
    expect(box.top).toBe(780 - TIP.height);
  });

  test("the last height that still opens downward, and the first that turns over", () => {
    const fits = TIP_SCREEN.height - PANEL_PIXELS.space - TIP.height;
    expect(getScreenBox(composeTipDeclarations(fits, TIP, CORNER, TIP_SCREEN), CORNER, TIP).top).toBe(fits);
    expect(getScreenBox(composeTipDeclarations(fits + 1, TIP, CORNER, TIP_SCREEN), CORNER, TIP).bottom).toBe(
      fits + 1,
    );
  });

  test("pushed down where the pointer is above the margin", () => {
    const box = getScreenBox(composeTipDeclarations(0, TIP, CORNER, TIP_SCREEN), CORNER, TIP);

    expect(box.top).toBe(PANEL_PIXELS.space);
  });

  /**
   * Neither side of the pointer has room, so the rule that applies is the last
   * one: on the screen, from the edge the design keeps.
   */
  test("neither above nor below, where the detail is nearly the whole window", () => {
    const tall = { width: 250, height: TIP_SCREEN.height - 2 * PANEL_PIXELS.space };
    const box = getScreenBox(composeTipDeclarations(400, tall, CORNER, TIP_SCREEN), CORNER, tall);

    expect(box.top).toBe(PANEL_PIXELS.space);
    expect(box.bottom).toBe(TIP_SCREEN.height - PANEL_PIXELS.space);
  });

  /**
   * ⚠️ **A detail taller than the room has no top that satisfies both edges**, and
   * the one to keep is the top: a window hanging off the bottom still shows what
   * it says first, while one pushed off the top shows nothing but its last line.
   * The stylesheet's own ceiling is what keeps this to the pathological case.
   */
  test("a detail taller than the window keeps its top rather than its bottom", () => {
    const tall = { width: 250, height: 2000 };
    const box = getScreenBox(composeTipDeclarations(400, tall, CORNER, TIP_SCREEN), CORNER, tall);

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
    expect(composeTipDeclarations(400, TIP, null, TIP_SCREEN)).toEqual(NOTHING);
  });

  test("a detail that measured as nothing, which is a document with no layout", () => {
    expect(composeTipDeclarations(400, { width: 0, height: 0 }, CORNER, TIP_SCREEN)).toEqual(NOTHING);
  });

  test("and one that measured as nothing on one axis only", () => {
    expect(composeTipDeclarations(400, { width: 250, height: 0 }, CORNER, TIP_SCREEN)).toEqual(NOTHING);
    expect(composeTipDeclarations(400, { width: 0, height: 200 }, CORNER, TIP_SCREEN)).toEqual(NOTHING);
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
