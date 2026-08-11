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
import { composeIntegerText, getDecimalFromText } from "@/libs/number.ts";
import {
  composeColourOver,
  getContrastRatio,
  PANEL_TOKENS,
  SERIES_COLOURS,
  UNKNOWN_COLOUR,
} from "@/src/ui/panel-tokens.ts";
import {
  composePanelView,
  PANEL_METRICS,
  type PanelReading,
  type PanelView,
} from "@/src/ui/panel-view.ts";
import { CAPTURED_FIGHTS, composeRosterOfFight } from "@/tests/captured-fight-catalog.ts";

type FakeNode = PanelNode & {
  tag: string;
  children: FakeNode[];
  listeners: Array<(event: PanelEvent) => void>;
  properties: Record<string, string>;
};

/** Clicks a node the way a browser would: at the root, naming what was hit. */
function setClickOn(root: FakeNode, target: FakeNode): void {
  for (const listener of root.listeners) listener({ target });
}

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
        title: "",
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
        addEventListener(_type: string, listener: (event: PanelEvent) => void): void {
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
function composeReading(overrides: Partial<PanelReading> = {}): {
  reading: PanelReading;
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

/**
 * Everyone the aggregate counted, as the panel would name them.
 *
 * The fallback repeats `panel-view.ts`'s on purpose: a combatant no roster
 * describes is still somebody, and the id is the only name available.
 */
function getCountedNames(reading: PanelReading): string[] {
  return [...reading.statistics.byCombatantId.keys()].map((combatantId) => {
    const combatant = reading.roster.byId.get(combatantId);
    return combatant?.name ?? `#${composeIntegerText(combatantId)}`;
  });
}

function getDrawnNames(view: PanelView): string[] {
  return view.sections.flatMap((section) => section.rows.map((row) => row.name));
}

/**
 * Everyone counted is drawn exactly once, whatever bucket they landed in.
 *
 * ⚠️ **Written because it was false.** `combatantIdsWithoutSide` has been in the
 * aggregate since sides were grouped, and no section ever read it: a combatant the
 * roster could not place was counted and then dropped from the screen. A test
 * naming that one bucket would go green again the day a third one is added and
 * forgotten, so this counts rows against the aggregate instead. The only row that
 * is not a combatant is the unattributed bucket, which is why it is added back
 * rather than searched for by heading.
 */
function assertEveryoneCountedIsDrawn(reading: PanelReading): void {
  const view = composePanelView(reading, "dealt");
  const counted = getCountedNames(reading);
  const drawn = getDrawnNames(view);
  const bucket = reading.statistics.unattributed.dealtApplied > 0 ? 1 : 0;

  expect(drawn.length).toBe(counted.length + bucket);
  for (const name of counted) expect(drawn).toContain(name);
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

  /**
   * A combatant the roster cannot place still fought, and their figures are still
   * this fight's. Everyone lands in that bucket when a fight is joined with no
   * roster at all, so it is not an exotic path.
   */
  test("a combatant no roster could place is still on screen", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "a mage", side: 1, profession: "m" },
      { id: 3, name: "something large", side: 2, profession: null },
    ]);
    const statistics = composeFightStatistics(
      decodeFight(["4=90.00;3=50.00;+dmg=500;-dmg=400"], roster),
      roster,
    );
    const reading: PanelReading = { statistics, roster, ourSide: 1, isFromFightStart: true };

    expect(statistics.combatantIdsWithoutSide).toEqual([4]);
    const view = composePanelView(reading, "dealt");
    expect(view.sections.map((section) => section.heading)).toContain("Side not stated");
    expect(getDrawnNames(view)).toContain("#4");
    assertEveryoneCountedIsDrawn(reading);
  });

  test.each(CAPTURED_FIGHTS)("$name: everyone it counted reaches the screen", (fight) => {
    const roster = composeRosterOfFight(fight);
    const statistics = composeFightStatistics(
      decodeFight(
        fight.dump.calls.flatMap((call) => call.protocolMessages),
        roster,
      ),
      roster,
    );

    expect(statistics.byCombatantId.size).toBeGreaterThan(0);
    assertEveryoneCountedIsDrawn({ statistics, roster, ourSide: null, isFromFightStart: true });
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
   * might be low has to be markable.
   *
   * ⚠️ The mark is **at the total**, not in a banner at the foot of the panel.
   * The question a reader has is *can I trust this number*, so the answer belongs
   * beside that number — the banner is what `docs/specs/2026-08-10-panel-and-tabs.md`
   * lists under its rejected alternatives, and it is what this replaced.
   */
  test("a total that may be low is marked at the total", () => {
    const { reading } = composeReading();
    const view = composePanelView(reading, "dealt");

    expect(reading.statistics.reading.unreadableMessages).toBeGreaterThan(0);
    for (const section of view.sections) {
      expect(section.totalMark, section.heading).not.toBeNull();
      expect(section.totalMark?.detail).toContain("not fully read");
    }
  });

  /**
   * Quiet by default, detail on demand — and the detail names **keys**.
   *
   * This is the test §9.6 asked for when the panel was still a design, and it
   * could not be written until the decoder carried the keys rather than a
   * sentence about them. A key is what a reader can act on: look it up in
   * `docs/protocol-keys.md`, count it, or quote it to us exactly.
   */
  test("the mark is short, and names the keys when asked", () => {
    const { reading } = composeReading();
    const mark = composePanelView(reading, "dealt").sections[0]?.totalMark;

    expect(reading.statistics.reading.occurrencesByUnreadKey.get("nonsense_key")).toBe(1);
    expect(mark?.text.length).toBeLessThanOrEqual(2);
    expect(mark?.detail).toContain("nonsense_key");
  });

  // Every key the captures leave unread reaches the screen, not a chosen few.
  test.each(CAPTURED_FIGHTS)("$name: every key it could not read is named", (fight) => {
    const roster = composeRosterOfFight(fight);
    const statistics = composeFightStatistics(
      decodeFight(
        fight.dump.calls.flatMap((call) => call.protocolMessages),
        roster,
      ),
      roster,
    );
    const detail = composePanelView(
      { statistics, roster, ourSide: null, isFromFightStart: true },
      "dealt",
    ).sections[0]?.totalMark?.detail;

    const unread = [...statistics.reading.occurrencesByUnreadKey.keys()];
    expect(unread.length).toBeGreaterThan(0);
    for (const key of unread) expect(detail, key).toContain(key);
  });

  /**
   * A message whose grammar failed carries no key, and the panel still has to say
   * something. The prose is the fallback, and it is only ever a fallback.
   */
  test("a message with no key to name falls back to the reason", () => {
    const statistics = composeFightStatistics(decodeFight(["not a message at all"]));
    const view = composePanelView(
      { statistics, roster: composeCombatantRoster([]), ourSide: null, isFromFightStart: true },
      "dealt",
    );

    expect(statistics.reading.occurrencesByUnreadKey.size).toBe(0);
    expect(statistics.reading.unreadableMessages).toBe(1);
    // Nothing decoded means no section to hang it on, so the header carries it.
    expect(view.sections).toEqual([]);
    expect(view.header.marks.map((mark) => mark.detail).join(" ")).toContain("not fully read");
  });

  test("nothing unread means nothing marked", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "a mage", side: 1, profession: "m" },
      { id: 3, name: "something large", side: 2, profession: null },
    ]);
    const statistics = composeFightStatistics(
      decodeFight(["1=90.00;3=50.00;+dmg=500;-dmg=400"], roster),
      roster,
    );
    const view = composePanelView(
      { statistics, roster, ourSide: 1, isFromFightStart: true },
      "dealt",
    );

    expect(statistics.reading.unreadableMessages).toBe(0);
    for (const section of view.sections) expect(section.totalMark).toBeNull();
  });

  /**
   * Joining late is a different claim from a total being short, and it is made in
   * a different place: it qualifies every figure on the panel, so it sits in the
   * header rather than on one total.
   */
  test("joining late is said in the header, not on a total", () => {
    const { reading } = composeReading({ isFromFightStart: false });
    const view = composePanelView(reading, "dealt");

    expect(view.header.marks[0]?.detail).toContain("Joined after");
    expect(composePanelView(composeReading().reading, "dealt").header.marks).toEqual([]);
  });

  // Computed since the aggregate had it and drawn nowhere until the header
  // existed: a fight that has ended says so.
  test("the header says who is fighting whom, and how it ended", () => {
    const { reading } = composeReading();
    const ongoing = composePanelView(reading, "dealt");

    expect(ongoing.header.title).toBe("2 v 1");
    expect(ongoing.header.outcomeText).toBeNull();

    const roster = composeCombatantRoster([
      { id: 1, name: "a mage", side: 1, profession: "m" },
    ]);
    const statistics = composeFightStatistics(
      decodeFight(["0;0;winner=a mage"], roster),
      roster,
    );
    const decided = composePanelView(
      { statistics, roster, ourSide: 1, isFromFightStart: true },
      "dealt",
    );
    expect(decided.header.outcomeText).toBe("won");
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

  /**
   * §9.6: event handling is delegated at the root, not bound per element.
   *
   * Counted rather than described, and counted over the whole tree: the previous
   * shape bound one listener per tab inside the render loop, and the test that
   * covered it asserted exactly that count — a guard holding the panel to the
   * thing the rule forbids.
   */
  test("the whole panel carries one listener, wherever the controls are", () => {
    const { reading } = composeReading();
    const panel = renderPanel(composeFakeDocument(), composePanelView(reading, "dealt")) as FakeNode;

    const listeners = getEveryNode(panel).flatMap((node) => node.listeners);
    expect(listeners.length).toBe(1);
    expect(panel.listeners.length).toBe(1);
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

    const tabs = getEveryNode(panel).filter((node) => node.className === "tab");
    expect(tabs.length).toBe(PANEL_METRICS.length);
    for (const tab of tabs) expect(() => setClickOn(panel, tab)).not.toThrow();
    expect(failures.length).toBe(PANEL_METRICS.length);
  });

  test("choosing a tab tells the caller which one", () => {
    const { reading } = composeReading();
    const view = composePanelView(reading, "dealt");
    const chosen: string[] = [];

    const panel = renderPanel(composeFakeDocument(), view, {
      onMetricChosen: (metric) => chosen.push(metric),
    }) as FakeNode;

    for (const tab of getEveryNode(panel).filter((node) => node.className === "tab")) {
      setClickOn(panel, tab);
    }
    expect(chosen).toEqual([...PANEL_METRICS]);
  });

  // A click on anything that is not a control is not a control being chosen.
  test("a click on a row does nothing at all", () => {
    const { reading } = composeReading();
    const chosen: string[] = [];

    const panel = renderPanel(composeFakeDocument(), composePanelView(reading, "dealt"), {
      onMetricChosen: (metric) => chosen.push(metric),
    }) as FakeNode;

    for (const row of getEveryNode(panel).filter((node) => node.className === "row")) {
      setClickOn(panel, row);
    }
    expect(chosen).toEqual([]);
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
