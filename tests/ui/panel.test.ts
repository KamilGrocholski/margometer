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

import { describe, expect, test } from "bun:test";
import { assertDefined } from "@/libs/assert.ts";
import { getDecimalFromText } from "@/libs/number.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import {
  composePanelStyleText,
  renderPanel,
  renderPanelInto,
  setPanelRoot,
  type PanelDocument,
  type PanelEvent,
  type PanelHost,
  type PanelNode,
} from "@/src/ui/panel-element.ts";
import { composeColourOver, getContrastRatio, PANEL_TOKENS, SERIES_COLOURS } from "@/src/ui/panel-tokens.ts";
import {
  composeDefaultState,
  composePanelView,
  type PanelDetailLine,
  type PanelReading,
  type PanelState,
} from "@/src/ui/panel-view.ts";

type FakeListener = { type: string; listener: (event: PanelEvent) => void };

type FakeNode = PanelNode & {
  tag: string;
  children: FakeNode[];
  listeners: FakeListener[];
  properties: Record<string, string>;
  captured: number[];
  released: number[];
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
        captured: [],
        released: [],
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
    { id: 1, name: "mag", side: 1, profession: "m", level: 105 },
    { id: 2, name: "łowca", side: 1, profession: "h", level: 93 },
    { id: 3, name: "coś dużego", side: 2, profession: null, level: null },
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

/** The whole window: shadow root, title bar, tooltip and the container to draw into. */
function composeMountedPanel(actions = {}) {
  const document = composeFakeDocument();
  const host = document.createElement("div") as FakeNode & PanelHost;
  host.attachShadow = (): PanelNode => {
    const root = document.createElement("root") as FakeNode;
    host.children.push(root);
    return root;
  };
  const details = new Map<unknown, PanelDetailLine[]>();
  const container = setPanelRoot(document, host, undefined, actions, details) as FakeNode;
  const root = assertDefined(host.children[0], "the shadow root was opened") as FakeNode;
  return { document, host, root, container, details };
}

function renderInto(state: PanelState = composeDefaultState(), handlers = {}) {
  const document = composeFakeDocument();
  const panel = renderPanel(document, composePanelView(composeReading(), state), handlers) as FakeNode;
  return { document, panel };
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
   * The detail is a window of ours, and it is shown by hovering rather than
   * carried on the row as the browser own tooltip: a native one cannot be
   * styled, arrives after a wait nobody chose, and would put a second kind of
   * panel over the game.
   */
  test("hovering a row opens the detail beside the panel, at that row", () => {
    const { document, root, container, details } = composeMountedPanel();
    renderPanelInto(document, container, composePanelView(composeReading(), composeDefaultState()), {}, false, details);
    const tip = assertDefined(getByClass(root, "tip")[0], "the tooltip was built");
    const row = assertDefined(getByClass(container, "row")[0], "a row was drawn");

    expect(tip.properties["display"]).toBe("none");

    setEventOn(root, "pointerover", { target: row, clientX: 400, clientY: 300 });

    expect(tip.properties["display"]).toBe("block");
    // Which side it opens on is the stylesheet’s; the height is the row’s own
    // distance below the panel’s top edge, which placement already knows.
    expect(tip.properties["top"]).toBe("292px");
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

    const tip = assertDefined(getByClass(root, "tip")[0], "the tooltip was built");
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

  test("the list says how many rows it shows before it scrolls", () => {
    const { panel } = renderInto();
    const list = assertDefined(getByClass(panel, "list")[0], "the list was drawn");

    expect(list.properties["--rows"]).toBe("11");
  });
});

describe("one gesture in, one gesture out", () => {
  test("a click on a row asks for that row and nothing else", () => {
    const chosen: string[] = [];
    const { panel } = renderInto(composeDefaultState(), { onRowChosen: (key: string) => chosen.push(key) });
    const row = assertDefined(getByClass(panel, "row")[0], "a row was drawn");

    setClickOn(panel, row);
    expect(chosen).toEqual(["combatant:1"]);
  });

  /**
   * The noun carries the direction across with it. From `Obrażenia · zadane`,
   * `Leczenie` is healing **given** — turning the figure round under the hand of
   * somebody who only asked to change the subject is the thing this prevents.
   */
  test("a click on a noun keeps the direction it was read in", () => {
    const metrics: string[] = [];
    const { panel } = renderInto(composeDefaultState(), {
      onMetricChosen: (metric: string) => metrics.push(metric),
    });

    setClickOn(panel, getTabByLabel(panel, "Leczenie"));

    expect(metrics).toEqual(["healingGiven"]);
  });

  test("and from the other direction it keeps that one instead", () => {
    const metrics: string[] = [];
    const { panel } = renderInto(
      { ...composeDefaultState(), metric: "taken" },
      { onMetricChosen: (metric: string) => metrics.push(metric) },
    );

    setClickOn(panel, getTabByLabel(panel, "Leczenie"));

    expect(metrics).toEqual(["healed"]);
  });

  /**
   * Both strips report the same kind of choice — which figure — so the drawing
   * needs no second handler and no second map, however many axes the panel grows.
   */
  test("a click on a direction asks for that metric", () => {
    const metrics: string[] = [];
    const { panel } = renderInto(composeDefaultState(), {
      onMetricChosen: (metric: string) => metrics.push(metric),
    });

    setClickOn(panel, getTabByLabel(panel, "otrzymane"));

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

    setClickOn(panel, getTabByLabel(sides, "My"));
    expect(teams).toEqual(["mine"]);
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

    expect(() => setClickOn(panel, row)).not.toThrow();
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

  test("a collapsed panel draws nothing, and the bar it is collapsed by survives", () => {
    const { document, root, container } = composeMountedPanel({ onCollapseToggled: () => undefined });
    const view = composePanelView(composeReading(), composeDefaultState());

    renderPanelInto(document, container, view, {}, true);
    expect(container.children.length).toBe(0);
    expect(getByClass(root, "titlebar").length).toBe(1);

    renderPanelInto(document, container, view, {}, false);
    expect(container.children.length).toBe(1);
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
    const titleBar = assertDefined(getByClass(root, "titlebar")[0], "the title bar was built");

    const view = composePanelView(composeReading(), composeDefaultState());
    for (let redraws = 0; redraws < 20; redraws += 1) {
      renderPanelInto(document, container, view, {});
    }

    setEventOn(root, "pointerdown", { target: titleBar, clientX: 150, clientY: 150, pointerId: 1 });
    setEventOn(root, "pointermove", { target: titleBar, clientX: 160, clientY: 170, pointerId: 1 });
    setEventOn(root, "pointerup", { target: titleBar, clientX: 160, clientY: 170, pointerId: 1 });

    expect(moved).toEqual([{ left: 110, top: 120 }]);
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
    for (const colour of [PANEL_TOKENS.ours, PANEL_TOKENS.theirs]) {
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
});

describe("clicking the part of a row somebody actually aims at", () => {
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

    for (const part of getEveryNode(row)) setClickOn(panel, part);

    // Every node of the row, the row included, and all of them the same row.
    expect(chosen.length).toBe(getEveryNode(row).length);
    expect(new Set(chosen)).toEqual(new Set(["combatant:1"]));
  });
});
