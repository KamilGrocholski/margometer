/**
 * The panel, held to the promises §9.6 and §9.7 made before it was written.
 *
 * There is no DOM in the test runner, so the document is a small fake. That is
 * not a compromise: the properties worth checking here are about *structure and
 * restraint* — what survives a failure, what never happens at all — and a fake
 * that records what it was asked to build answers those exactly.
 *
 * What it cannot answer is whether the result looks right. Nothing here can;
 * that needs the game and a person.
 */

import { describe, expect, test } from "bun:test";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import type { FightReading } from "@/src/game/battle-session.ts";
import {
  composePanelStyleText,
  renderPanel,
  renderPanelInto,
  setPanelRoot,
  type PanelDocument,
  type PanelHost,
  type PanelNode,
} from "@/src/ui/panel-element.ts";
import { getDecimalFromText } from "@/libs/number.ts";
import {
  composeColourOver,
  getContrastRatio,
  PANEL_TOKENS,
  SERIES_COLOURS,
  UNKNOWN_COLOUR,
} from "@/src/ui/panel-tokens.ts";
import { composePanelView, PANEL_METRICS } from "@/src/ui/panel-view.ts";

type FakeNode = PanelNode & {
  tag: string;
  children: FakeNode[];
  listeners: Array<() => void>;
  properties: Record<string, string>;
};

function composeFakeDocument(onCreate?: (tag: string) => void): PanelDocument & {
  getCreatedCount: () => number;
} {
  let created = 0;
  const document: PanelDocument = {
    createElement(tag: string): FakeNode {
      created += 1;
      onCreate?.(tag);
      const node: FakeNode = {
        tag,
        className: "",
        textContent: "",
        children: [],
        listeners: [],
        properties: {},
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
        addEventListener(_type: string, listener: () => void): void {
          node.listeners.push(listener);
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

/** A fight with two sides, damage on both, and something unreadable in it. */
function composeReading(overrides: Partial<FightReading> = {}): {
  reading: FightReading;
  roster: ReturnType<typeof composeCombatantRoster>;
} {
  const roster = composeCombatantRoster([
    { id: 1, name: "a mage", side: 1, profession: "m" },
    { id: 2, name: "a hunter", side: 1, profession: "h" },
    { id: 3, name: "something large", side: 2, profession: null },
  ]);
  const statistics = composeFightStatistics(
    decodeFight(
      ["1=90.00;3=50.00;+dmg=500;-dmg=400", "2=90.00;3=40.00;+dmg=200;-dmg=100", "0;0;nonsense_key=1"],
      roster,
    ),
    roster,
  );
  return {
    reading: { statistics, roster, ourSide: 1, isFromFightStart: true, ...overrides },
    roster,
  };
}

describe("what the panel puts on screen", () => {
  test("a side becomes a section, and its rows are ranked", () => {
    const { reading } = composeReading();
    const view = composePanelView(reading, "dealt");

    expect(view.sections.length).toBeGreaterThan(1);
    const ours = view.sections[0]!;
    expect(ours.heading).toBe("Us");
    expect(ours.rows.map((row) => row.name)).toEqual(["a mage", "a hunter"]);
    expect(ours.rows[0]!.value).toBeGreaterThan(ours.rows[1]!.value);
  });

  // The colour says what somebody is, so somebody the game did not describe must
  // not borrow a profession's colour.
  test("a combatant with no stated profession gets no profession's colour", () => {
    const { reading } = composeReading();
    const view = composePanelView(reading, "dealt");
    const theirs = view.sections.find((section) => section.heading === "Them")!;

    expect(theirs.rows[0]!.colour).toBe(UNKNOWN_COLOUR);
  });

  test("every metric the strip offers can actually be ranked", () => {
    const { reading } = composeReading();
    for (const metric of PANEL_METRICS) {
      const view = composePanelView(reading, metric);
      expect(view.tabs.filter((tab) => tab.isSelected).map((tab) => tab.metric)).toEqual([metric]);
      expect(view.sections.length).toBeGreaterThan(0);
    }
  });

  // Silence is not a reason to guess which side is the player's.
  test("without `myteam` neither side is called ours", () => {
    const { reading } = composeReading({ ourSide: null });
    const view = composePanelView(reading, "dealt");

    expect(view.sections.map((section) => section.heading)).not.toContain("Us");
    expect(view.sections.map((section) => section.heading)).not.toContain("Them");
  });

  /**
   * §9.6, and the reason the aggregate carries `reading` at all: a total that
   * might be low has to be markable, and the two notices are different claims —
   * one says the numbers are not this fight, the other that they may be short.
   */
  test("what could not be read reaches the panel", () => {
    const { reading } = composeReading();
    const view = composePanelView(reading, "dealt");

    expect(reading.statistics.reading.unreadableMessages).toBeGreaterThan(0);
    expect(view.notices.join(" ")).toContain("not fully read");
  });

  test("joining late is said separately from being a little low", () => {
    const { reading } = composeReading({ isFromFightStart: false });
    const view = composePanelView(reading, "dealt");

    expect(view.notices.length).toBe(2);
    expect(view.notices[0]).toContain("Joined after");
  });

  // A zero total would make every share `NaN`, which draws a bar of no length
  // and a label reading "NaN%" — a number nobody wrote.
  test("a fight where nothing happened yields no impossible shares", () => {
    const roster = composeCombatantRoster([{ id: 1, name: "idle", side: 1, profession: "m" }]);
    const statistics = composeFightStatistics(decodeFight(["1=100.00;0;+crit"], roster), roster);
    const view = composePanelView({ statistics, roster, ourSide: 1, isFromFightStart: true }, "dealt");

    for (const row of view.sections.flatMap((section) => section.rows)) {
      expect(Number.isFinite(row.share)).toBe(true);
      expect(row.shareText).not.toContain("NaN");
    }
  });
});

describe("how the panel fails", () => {
  /**
   * §9.6's structural requirement: a section that throws takes only itself down.
   * Losing the whole panel because one row misbehaved is the worse outcome.
   */
  test("a section that cannot be drawn leaves its neighbours standing", () => {
    const { reading } = composeReading();
    const view = composePanelView(reading, "dealt");
    const failures: unknown[] = [];

    let seen = 0;
    const document = composeFakeDocument((tag) => {
      seen += 1;
      // Fail partway through the first section, not at its first element.
      if (tag === "span" && seen > 6 && failures.length === 0) {
        const broken = undefined as unknown as { fail: () => void };
        broken.fail();
      }
    });

    const panel = renderPanel(document, view, {
      onSectionFailure: (error) => failures.push(error),
    }) as FakeNode;

    expect(failures.length).toBe(1);
    const text = getEveryNode(panel).map((node) => node.textContent);
    expect(text.some((each) => each.includes("could not be drawn"))).toBe(true);
    // The sections after the broken one still drew.
    expect(text.some((each) => each.includes("Them"))).toBe(true);
  });

  test("a handler that throws does not escape into the page", () => {
    const { reading } = composeReading();
    const view = composePanelView(reading, "dealt");
    const failures: unknown[] = [];

    const panel = renderPanel(composeFakeDocument(), view, {
      onMetricChosen: () => {
        const broken = undefined as unknown as { choose: () => void };
        broken.choose();
      },
      onSectionFailure: (error) => failures.push(error),
    }) as FakeNode;

    const listeners = getEveryNode(panel).flatMap((node) => node.listeners);
    expect(listeners.length).toBe(PANEL_METRICS.length);
    for (const listener of listeners) expect(() => listener()).not.toThrow();
    expect(failures.length).toBe(PANEL_METRICS.length);
  });

  test("choosing a tab tells the caller which one", () => {
    const { reading } = composeReading();
    const view = composePanelView(reading, "dealt");
    const chosen: string[] = [];

    const panel = renderPanel(composeFakeDocument(), view, {
      onMetricChosen: (metric) => chosen.push(metric),
    }) as FakeNode;

    for (const listener of getEveryNode(panel).flatMap((node) => node.listeners)) listener();
    expect(chosen).toEqual([...PANEL_METRICS]);
  });

  test("the panel goes in a shadow root, cut off from the game's stylesheet", () => {
    const document = composeFakeDocument();
    let attachedWith = "";
    let root: FakeNode | null = null;
    const host = {
      ...document.createElement("div"),
      attachShadow(init: { mode: "open" }): PanelNode {
        attachedWith = init.mode;
        root = document.createElement("div") as FakeNode;
        return root;
      },
    } as unknown as PanelHost;

    setPanelRoot(document, host);
    expect(attachedWith).toBe("open");
    const styled = getEveryNode(root ?? ({} as FakeNode));
    expect(styled.some((node) => node.textContent.includes("all: initial"))).toBe(true);
  });

  /**
   * ⚠️ The bug this replaced. `attachShadow` throws on an element that already
   * hosts a root, so a panel that opened one per render worked once and failed
   * on every payload after — which in a fight is immediately.
   */
  test("redrawing does not open a second shadow root", () => {
    const { reading } = composeReading();
    const document = composeFakeDocument();
    let attachments = 0;
    const host = {
      ...document.createElement("div"),
      attachShadow(): PanelNode {
        attachments += 1;
        if (attachments > 1) {
          const broken = undefined as unknown as { twice: () => void };
          broken.twice();
        }
        return document.createElement("div");
      },
    } as unknown as PanelHost;

    const container = setPanelRoot(document, host);
    for (const metric of PANEL_METRICS) {
      renderPanelInto(document, container, composePanelView(reading, metric));
    }

    expect(attachments).toBe(1);
    // And each redraw replaces the last rather than stacking panels up.
    expect((container as FakeNode).children.length).toBe(1);
  });
});

/**
 * §9.7: text on a coloured bar clears WCAG contrast by measurement, not by eye.
 *
 * AA for normal text is 4.5:1. The figures sit on the panel surface rather than
 * on the bar, so what has to clear it there is the panel's own text; the bar
 * carries the row name, which is why both are checked.
 */
describe("the colours the panel is allowed to use", () => {
  /**
   * The bar is a tint, not a fill, and this is the measurement that decided it.
   * At full strength the green clears only 3.71:1 against dark ink and 4.01:1
   * against light — no single ink clears all nine colours. Tinted onto the row,
   * the panel's own text carries the row instead, and every colour clears AA.
   */
  test.each([...SERIES_COLOURS, UNKNOWN_COLOUR])("a row tinted %s stays readable", (colour) => {
    const tint = getDecimalFromText(PANEL_TOKENS.barTint);
    expect(tint).not.toBeNull();
    const behind = composeColourOver(colour, PANEL_TOKENS.surfaceRaised, tint ?? 1);
    expect(behind).not.toBeNull();
    expect(getContrastRatio(PANEL_TOKENS.text, behind ?? "") ?? 0).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * Why the tint exists at all, stated as the failure it prevents: at full
   * strength the green carries the panel's text at 4.01:1, under AA. The token
   * is therefore load-bearing and not a matter of taste.
   */
  test("a bar at full strength would fail, which is what the tint is for", () => {
    const solid = composeColourOver("#008300", PANEL_TOKENS.surfaceRaised, 1);
    expect(getContrastRatio(PANEL_TOKENS.text, solid ?? "") ?? 0).toBeLessThan(4.5);
  });

  test("the panel's own text clears AA on its surface", () => {
    expect(getContrastRatio(PANEL_TOKENS.text, PANEL_TOKENS.surface) ?? 0).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(PANEL_TOKENS.text, PANEL_TOKENS.surfaceRaised) ?? 0).toBeGreaterThanOrEqual(4.5);
  });

  // A quiet colour is still text. Held to the large-text floor of 3:1, which is
  // what it is used for — headings and secondary figures.
  test("the quiet text is not so quiet it stops being text", () => {
    expect(getContrastRatio(PANEL_TOKENS.textQuiet, PANEL_TOKENS.surface) ?? 0).toBeGreaterThanOrEqual(3);
  });

  test("no colour in the palette is unreadable as a value", () => {
    for (const colour of [...SERIES_COLOURS, UNKNOWN_COLOUR, PANEL_TOKENS.text]) {
      expect(getContrastRatio(colour, "#000000"), colour).not.toBeNull();
    }
  });

  // §9.7 again: the tokens are the only place a colour is written down.
  test("the stylesheet quotes no colour the tokens do not name", () => {
    const named = new Set(Object.values(PANEL_TOKENS));
    const inStyle = [...composePanelStyleText().matchAll(/#[0-9a-f]{3,8}\b/gi)].map(
      (match) => match[0],
    );
    expect(inStyle.filter((colour) => !named.has(colour as never))).toEqual([]);
  });
});
