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
import { assertDefined } from "@/libs/assert.ts";
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
function getTabsOf(node: FakeNode): FakeNode[] {
  return getEveryNode(node).filter((each) => each.className.split(" ").includes("tab"));
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

  /**
   * ⚠️ Asserted over the captures until 2026-08-11, when the last unread key in
   * them was read. What the material can still show is the other half: whatever
   * the aggregate does hold, the panel names. Today that is the team heal in one
   * fight and nothing at all in the other, and both are checked.
   */
  test.each(CAPTURED_FIGHTS)("$name: whatever it could not account for is named", (fight) => {
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
    const missing = [...statistics.reading.unaccountedHealthBySource.keys()];
    expect(unread).toEqual([]);

    for (const key of [...unread, ...missing]) expect(detail, key).toContain(key);
    if (missing.length === 0) expect(detail).toBeUndefined();
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

  /**
   * ⚠️ **Found by a mutation that lit nothing.** Removing the healing gap from
   * the mark's condition broke no test, because both captures also carry
   * unreadable messages — so the mark happened to be there for the other reason.
   * A fight with a team heal and nothing else unread is the case the whole
   * `unaccounted-health` event exists for, and it was the one case unguarded.
   *
   * The claim it makes is the certain one: healing *is* low, not may be.
   */
  test("a team heal marks the total even when everything was read", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "a mage", side: 1, profession: "m" },
      { id: 3, name: "something large", side: 2, profession: null },
    ]);
    const statistics = composeFightStatistics(
      decodeFight(
        ["1=90.00;3=50.00;+dmg=500;-dmg=400", "1=100.00;1=100.00;tspell=Something;healall_per=30"],
        roster,
      ),
      roster,
    );
    const view = composePanelView(
      { statistics, roster, ourSide: 1, isFromFightStart: true },
      "healed",
    );

    expect(statistics.reading.unreadableMessages).toBe(0);
    expect(statistics.reading.unaccountedHealthBySource.size).toBe(1);
    for (const section of view.sections) {
      expect(section.totalMark, section.heading).not.toBeNull();
      expect(section.totalMark?.detail).toContain("counted for nobody");
    }
  });

  // Ranked ahead of anything merely suspected, because it is the one line that
  // is not a maybe.
  test("the certain warning is said before the suspected one", () => {
    const roster = composeCombatantRoster([{ id: 1, name: "a mage", side: 1, profession: "m" }]);
    const statistics = composeFightStatistics(
      decodeFight(
        ["1=100.00;1=100.00;tspell=Something;healall_per=30", "0;0;nonsense_key=1"],
        roster,
      ),
      roster,
    );
    const detail =
      composePanelView({ statistics, roster, ourSide: 1, isFromFightStart: true }, "healed")
        .sections[0]?.totalMark?.detail ?? "";

    expect(detail).toContain("nonsense_key");
    expect(detail.indexOf("counted for nobody")).toBeLessThan(detail.indexOf("nonsense_key"));
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

  /**
   * ⚠️ **The header called every finished fight a loss.** The protocol states
   * both sides — one message names the winners, another the losers — and the
   * aggregate kept whichever came last, which is always `loser`. The test above
   * agreed with the bug because its fight states only a winner; a real one never
   * does. So this one states both, from the seat of somebody on the winning
   * side, which is the case the panel actually draws.
   */
  test("the header answers from the watcher's own side, not from the last message", () => {
    const roster = composeCombatantRoster([
      { id: 1, name: "a mage", side: 1, profession: "m" },
      { id: 2, name: "a boar", side: 2, profession: null },
    ]);
    const statistics = composeFightStatistics(
      decodeFight(["0;0;winner=a mage", "0;0;loser=a boar"], roster),
      roster,
    );
    const compose = (ourSide: number | null): string | null =>
      composePanelView({ statistics, roster, ourSide, isFromFightStart: true }, "dealt")
        .header.outcomeText;

    expect(compose(1)).toBe("won");
    expect(compose(2)).toBe("lost");
    // A side the game never named, and a side nobody in the fight is on: the
    // header says nothing rather than picking one of the two words (§9.6).
    expect(compose(null)).toBeNull();
    expect(compose(3)).toBeNull();
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

    const tabs = getTabsOf(panel);
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

    for (const tab of getTabsOf(panel)) {
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

  /**
   * ⚠️ **Both halves of this were written and they did not meet.** The render
   * set a custom property `--selected` on the chosen tab; the stylesheet
   * selected `.tab[data-selected="true"]`. Neither is wrong on its own, nothing
   * in the type system joins them, and a fake document has no stylesheet — so
   * every test passed while the panel drew three identical tabs and never said
   * which metric was on screen. Found by looking at a screenshot.
   *
   * What is held here is the join itself: whatever mark the render puts on the
   * selected tab, the stylesheet has to be a document that mentions it.
   */
  test("the chosen tab is marked, and the stylesheet knows the mark", () => {
    const { reading } = composeReading();
    const document = composeFakeDocument();
    const roots: FakeNode[] = [];
    const host = {
      ...document.createElement("div"),
      attachShadow(): PanelNode {
        const root = document.createElement("div") as FakeNode;
        roots.push(root);
        return root;
      },
    } as unknown as PanelHost;

    const container = setPanelRoot(document, host);
    const styleText = getEveryNode(assertDefined(roots[0], "the shadow root was opened"))
      .map((node) => node.textContent)
      .join("\n");

    for (const metric of PANEL_METRICS) {
      renderPanelInto(document, container, composePanelView(reading, metric));
      const tabs = getTabsOf(container as FakeNode);
      expect(tabs.length).toBe(PANEL_METRICS.length);

      const marked = tabs.filter((node) => node.className !== "tab");
      expect(marked.length, metric).toBe(1);
      expect(marked[0]!.textContent.toLowerCase(), metric).toBe(metric);

      for (const name of marked[0]!.className.split(" ")) {
        expect(styleText, `${metric}: nothing styles .${name}`).toContain(`.${name}`);
      }
    }
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
 * Moving the panel out of the way.
 *
 * The game draws things in the corner the panel was nailed to, so it has to be
 * movable. What is checked here is everything about that a fake document can
 * answer: where the styles end up, what survives a redraw, what is reported, and
 * that none of it can escape into the page. Whether it feels right under a hand
 * needs the game and a person.
 */
describe("moving the panel", () => {
  const SCREEN = { width: 1000, height: 800 };

  function composeMountedPanel(
    placement: Partial<Parameters<typeof setPanelRoot>[2]> = {},
  ): {
    document: PanelDocument;
    host: FakeNode;
    root: FakeNode;
    container: PanelNode;
    titleBar: FakeNode;
    moved: Array<{ left: number; top: number }>;
    failures: unknown[];
  } {
    const document = composeFakeDocument();
    const hostNode = document.createElement("div") as FakeNode;
    let root: FakeNode | null = null;
    const host = {
      ...hostNode,
      attachShadow(): PanelNode {
        root = document.createElement("div") as FakeNode;
        return root;
      },
    } as unknown as PanelHost;

    const moved: Array<{ left: number; top: number }> = [];
    const failures: unknown[] = [];
    const container = setPanelRoot(document, host, {
      position: placement.position ?? null,
      getViewport: placement.getViewport ?? ((): typeof SCREEN | null => SCREEN),
      onMoved: placement.onMoved ?? ((position): void => void moved.push(position)),
      onSectionFailure: placement.onSectionFailure ?? ((error): void => void failures.push(error)),
    });

    const opened = root as unknown as FakeNode;
    const titleBar = assertDefined(
      getEveryNode(opened).filter((node) => node.className === "titlebar")[0],
      "mounting the panel draws a title bar",
    );
    // The spread above copies the methods, and `style.setProperty` still writes
    // to the node it closed over — so the styles land on `hostNode`, not on the
    // literal. Asserting on the wrong one would pass whatever the code did.
    return { document, host: hostNode, root: opened, container, titleBar, moved, failures };
  }

  function setDragTo(
    root: FakeNode,
    titleBar: FakeNode,
    from: { left: number; top: number },
    to: { left: number; top: number },
  ): void {
    setEventOn(root, "pointerdown", {
      target: titleBar,
      clientX: from.left,
      clientY: from.top,
      pointerId: 7,
    });
    setEventOn(root, "pointermove", { target: titleBar, clientX: to.left, clientY: to.top });
    setEventOn(root, "pointerup", { target: titleBar, pointerId: 7 });
  }

  test("dragging the title bar puts the panel where it was dragged", () => {
    const { host, root, titleBar } = composeMountedPanel({ position: { left: 100, top: 100 } });

    setDragTo(root, titleBar, { left: 500, top: 500 }, { left: 460, top: 530 });

    expect(host.properties["left"]).toBe("60px");
    expect(host.properties["top"]).toBe("130px");
    // Both edges pinned would stretch the host across the page.
    expect(host.properties["right"]).toBe("auto");
  });

  /**
   * ⚠️ **The reason the title bar is built in `setPanelRoot` and not in
   * `renderPanel`.** A fight delivers a payload every few seconds and each one
   * replaces the container's children wholesale — a grab handle built inside the
   * render would be destroyed under the pointer at exactly the moment someone is
   * dragging the panel off whatever they are trying to read.
   */
  test("a drag still works after the fight has redrawn the panel twenty times", () => {
    const { reading } = composeReading();
    const { document, host, root, container, titleBar } = composeMountedPanel({
      position: { left: 100, top: 100 },
    });

    for (let redraws = 0; redraws < 20; redraws += 1) {
      renderPanelInto(document, container, composePanelView(reading, "dealt"));
    }
    setDragTo(root, titleBar, { left: 500, top: 500 }, { left: 520, top: 540 });

    expect(host.properties["left"]).toBe("120px");
    expect(host.properties["top"]).toBe("140px");
  });

  test("the panel keeps moving while the pointer does", () => {
    const { host, root, titleBar } = composeMountedPanel({ position: { left: 0, top: 0 } });

    setEventOn(root, "pointerdown", { target: titleBar, clientX: 0, clientY: 0, pointerId: 1 });
    for (const step of [10, 20, 30]) {
      setEventOn(root, "pointermove", { target: titleBar, clientX: step, clientY: step });
      expect(host.properties["left"]).toBe(`${composeIntegerText(step)}px`);
    }
  });

  // What a user settled on is where they stopped, not every position they passed
  // through — and the caller of this is writing to storage.
  test("the caller hears once, at the end of the drag", () => {
    const { root, titleBar, moved } = composeMountedPanel({ position: { left: 0, top: 0 } });

    setEventOn(root, "pointerdown", { target: titleBar, clientX: 0, clientY: 0, pointerId: 1 });
    for (const step of [10, 20, 30]) {
      setEventOn(root, "pointermove", { target: titleBar, clientX: step, clientY: step });
    }
    expect(moved).toEqual([]);

    setEventOn(root, "pointerup", { target: titleBar, pointerId: 1 });
    expect(moved).toEqual([{ left: 30, top: 30 }]);
  });

  test("a pointer let go of outside the panel ends the drag rather than wedging it", () => {
    const { host, root, titleBar, moved } = composeMountedPanel({ position: { left: 0, top: 0 } });

    setEventOn(root, "pointerdown", { target: titleBar, clientX: 0, clientY: 0, pointerId: 1 });
    setEventOn(root, "pointercancel", { target: titleBar, pointerId: 1 });
    setEventOn(root, "pointermove", { target: titleBar, clientX: 300, clientY: 300 });

    expect(moved).toEqual([{ left: 0, top: 0 }]);
    expect(host.properties["left"]).toBe("0px");
  });

  test("the pointer is captured for the drag and let go of after it", () => {
    const { root, titleBar } = composeMountedPanel({ position: { left: 0, top: 0 } });

    setDragTo(root, titleBar, { left: 0, top: 0 }, { left: 10, top: 10 });

    expect(titleBar.captured).toEqual([7]);
    expect(titleBar.released).toEqual([7]);
  });

  test("pressing anywhere but the title bar moves nothing", () => {
    const { reading } = composeReading();
    const { document, host, root, container } = composeMountedPanel({
      position: { left: 40, top: 40 },
    });
    renderPanelInto(document, container, composePanelView(reading, "dealt"));
    const rows = getEveryNode(container as FakeNode).filter((node) => node.className === "row");
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      setEventOn(root, "pointerdown", { target: row, clientX: 0, clientY: 0, pointerId: 1 });
      setEventOn(root, "pointermove", { target: row, clientX: 900, clientY: 900 });
    }

    expect(host.properties["left"]).toBe("40px");
    expect(host.properties["top"]).toBe("40px");
  });

  test("a remembered position too far right for this screen comes back on screen", () => {
    const { host } = composeMountedPanel({ position: { left: 5000, top: 4000 } });

    expect(host.properties["left"]).toBe("936px");
    expect(host.properties["top"]).toBe("736px");
  });

  test("nothing remembered leaves the corner to the stylesheet", () => {
    const { host } = composeMountedPanel();

    expect(host.properties["left"]).toBeUndefined();
    expect(host.properties["right"]).toBeUndefined();
  });

  // The first grab has to work out where a right-anchored panel already is, and
  // a page that will not say how wide it is cannot be guessed at.
  test("a first drag on a page of unknown size moves nothing rather than jumping", () => {
    const { host, root, titleBar } = composeMountedPanel({ getViewport: () => null });

    setDragTo(root, titleBar, { left: 500, top: 500 }, { left: 400, top: 400 });

    expect(host.properties["left"]).toBeUndefined();
  });

  test("a pointer event carrying no coordinates moves nothing", () => {
    const { host, root, titleBar } = composeMountedPanel({ position: { left: 40, top: 40 } });

    setEventOn(root, "pointerdown", { target: titleBar });
    setEventOn(root, "pointermove", { target: titleBar, clientX: 900, clientY: 900 });

    expect(host.properties["left"]).toBe("40px");
  });

  /**
   * §9.6: an add-on that breaks the game's own scripts has done far more damage
   * than one that shows a wrong number — and a pointer event is one the page
   * listens for too.
   */
  test("a drag handler that throws does not escape into the page", () => {
    const failures: unknown[] = [];
    const { root, titleBar } = composeMountedPanel({
      position: { left: 0, top: 0 },
      onMoved: () => {
        const broken = undefined as unknown as { save: () => void };
        broken.save();
      },
      onSectionFailure: (error) => void failures.push(error),
    });

    expect(() => setDragTo(root, titleBar, { left: 0, top: 0 }, { left: 5, top: 5 })).not.toThrow();
    expect(failures.length).toBe(1);
  });

  test("a viewport that throws mid-drag leaves nothing held down", () => {
    const failures: unknown[] = [];
    let asked = 0;
    const { root, titleBar, moved } = composeMountedPanel({
      position: { left: 0, top: 0 },
      getViewport: () => {
        asked += 1;
        if (asked > 1) throw new TypeError("no viewport today");
        return SCREEN;
      },
      onSectionFailure: (error) => void failures.push(error),
    });

    expect(() => setDragTo(root, titleBar, { left: 0, top: 0 }, { left: 5, top: 5 })).not.toThrow();
    expect(failures.length).toBe(1);
    // The failed move dropped the grab, so the pointerup after it reports nothing.
    expect(moved).toEqual([]);
  });
});

/**
 * The one control that hands the fight over rather than describing it.
 *
 * It lives in the title bar for the same reason the title bar itself does: a
 * redraw replaces the container's children wholesale, and a fight redraws every
 * few seconds. Everything below is about it surviving that, and about it not
 * costing the drag it sits inside.
 */
describe("asking for the fight to be written out", () => {
  function composeMountedPanel(actions: Parameters<typeof setPanelRoot>[3] = {}): {
    document: PanelDocument;
    root: FakeNode;
    container: PanelNode;
    titleBar: FakeNode;
  } {
    const document = composeFakeDocument();
    let root: FakeNode | null = null;
    const host = {
      ...(document.createElement("div") as FakeNode),
      attachShadow(): PanelNode {
        root = document.createElement("div") as FakeNode;
        return root;
      },
    } as unknown as PanelHost;

    const container = setPanelRoot(
      document,
      host,
      { position: null, getViewport: (): { width: number; height: number } => SCREEN_SIZE },
      actions,
    );
    const opened = root as unknown as FakeNode;
    const titleBar = assertDefined(
      getEveryNode(opened).filter((node) => node.className === "titlebar")[0],
      "mounting the panel draws a title bar",
    );
    return { document, root: opened, container, titleBar };
  }

  const SCREEN_SIZE = { width: 1000, height: 800 };

  function getCaptureButton(root: FakeNode): FakeNode | undefined {
    return getEveryNode(root).filter((node) => node.className === "titlebar-save")[0];
  }

  // A control nobody wired would be a promise the panel cannot keep, so it is not
  // drawn at all rather than drawn dead.
  test("no button is drawn when nobody is listening for it", () => {
    const { root } = composeMountedPanel({});

    expect(getCaptureButton(root)).toBeUndefined();
  });

  test("pressing it asks exactly once", () => {
    const asked: number[] = [];
    const { root } = composeMountedPanel({ onCaptureRequested: () => asked.push(1) });
    const button = assertDefined(getCaptureButton(root), "the button is drawn");

    setEventOn(root, "click", { target: button });

    expect(asked.length).toBe(1);
  });

  /**
   * ⚠️ **The property the whole design exists for.** Built inside `renderPanel`
   * the button would be destroyed under the pointer by the next payload — which
   * is exactly when someone has decided the fight was worth keeping.
   */
  test("it still works after twenty redraws", () => {
    const asked: number[] = [];
    const { document, root, container } = composeMountedPanel({
      onCaptureRequested: () => asked.push(1),
    });
    const button = assertDefined(getCaptureButton(root), "the button is drawn");

    for (let redraw = 0; redraw < 20; redraw += 1) {
      renderPanelInto(document, container, composePanelView(composeReading().reading, "dealt"), {});
    }
    setEventOn(root, "click", { target: button });

    expect(asked.length).toBe(1);
    expect(getCaptureButton(root)).toBe(button);
  });

  // §9.6: an add-on that breaks the game's own scripts has done far more damage
  // than one that shows a wrong number.
  test("a handler that throws does not escape into the page", () => {
    const failures: unknown[] = [];
    const bug = undefined as unknown as { save: () => void };
    const { root } = composeMountedPanel({
      onCaptureRequested: () => bug.save(),
      onSectionFailure: (error) => failures.push(error),
    });
    const button = assertDefined(getCaptureButton(root), "the button is drawn");

    expect(() => setEventOn(root, "click", { target: button })).not.toThrow();
    expect(failures.length).toBe(1);
  });

  /**
   * The bar is what the panel is dragged by, and the button sits inside it. A
   * press on the button must not begin a drag, and a press on the bar's own text
   * must still begin one — which is why the label stays a bare text node rather
   * than becoming an element of its own.
   */
  test("pressing the button moves nothing, while the bar still drags", () => {
    const { root, titleBar } = composeMountedPanel({ onCaptureRequested: () => {} });
    const button = assertDefined(getCaptureButton(root), "the button is drawn");
    const host = getEveryNode(root)[0];

    setEventOn(root, "pointerdown", { target: button, clientX: 500, clientY: 500, pointerId: 7 });
    setEventOn(root, "pointermove", { target: button, clientX: 400, clientY: 400 });
    expect(host?.properties["left"]).toBeUndefined();

    setEventOn(root, "pointerdown", {
      target: titleBar,
      clientX: 500,
      clientY: 500,
      pointerId: 7,
    });
    expect(() => setEventOn(root, "pointermove", { target: titleBar, clientX: 400, clientY: 400 })).not.toThrow();
  });

  test("the button says what it does, in words as well as in place", () => {
    const { root } = composeMountedPanel({ onCaptureRequested: () => {} });
    const button = assertDefined(getCaptureButton(root), "the button is drawn");

    expect(button.textContent).not.toBe("");
    expect(button.title).not.toBe("");
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
