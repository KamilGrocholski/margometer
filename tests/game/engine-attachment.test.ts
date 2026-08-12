/**
 * Getting onto the game, and off it again, without a browser.
 *
 * The clock is injected, so "the game finished initialising three ticks after we
 * did" is a thing this file can state rather than wait for. That is the only
 * reason these properties are checkable at all: the real version of this test
 * would be a person loading a userscript and watching.
 */

import { describe, expect, test } from "bun:test";
import { assertDefined } from "@/libs/assert.ts";
import { getValueFromJsonText } from "@/libs/json.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics, type CombatantStatistics } from "@/src/core/fight-statistics.ts";
import type { FightReading } from "@/src/game/battle-session.ts";
import { getBattleFromWindow, setEngineAttachment } from "@/src/game/engine-attachment.ts";
import { composeCaptureText, composeEmptyCapture } from "@/src/game/fight-capture.ts";
import { PANEL_PIXELS } from "@/src/ui/panel-tokens.ts";
import {
  composeDefaultState,
  composePanelView,
  PANEL_METRICS,
} from "@/src/ui/panel-view.ts";
import {
  composePanelMount,
  composeReportText,
  composeStateAfterTeam,
  composeStateFromRow,
  setMargoMeter,
  shouldStartHere,
  writeCaptureToPage,
} from "@/src/userscript-entry.ts";
import { composeIntegerText, getFiniteNumberFromValue } from "@/libs/number.ts";
import { parseFightDump, type CombatantSnapshot } from "@/tools/fight-dump-parser.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterOfFight,
  composeTurnCountsOfFight,
} from "@/tests/captured-fight-catalog.ts";

/** A clock the test winds by hand. */
function composeClock() {
  const steps: Array<() => void> = [];
  let cancelled = 0;
  return {
    schedule: (step: () => void) => {
      steps.push(step);
      return steps.length;
    },
    cancel: () => {
      cancelled += 1;
    },
    tick: () => {
      for (const step of [...steps]) step();
    },
    getCancelCount: () => cancelled,
  };
}

function composeBattle(): Record<string, unknown> {
  const prototype = {
    updateData(): string {
      return "the original's answer";
    },
  };
  return Object.create(prototype) as Record<string, unknown>;
}

describe("finding the game", () => {
  test.each([
    ["nothing at all", {}],
    ["an engine with no battle yet", { Engine: {} }],
    ["a battle that is not an object", { Engine: { battle: 7 } }],
  ])("reads no battle out of %s", (_name, page) => {
    expect(getBattleFromWindow(page)).toBeNull();
  });

  test("reads it through either spelling the page uses", () => {
    const battle = composeBattle();
    expect(getBattleFromWindow({ Engine: { battle } })).toBe(battle);
    expect(getBattleFromWindow({ getEngine: () => ({ battle }) })).toBe(battle);
  });

  // Reaching into another program's object graph can throw when the page tears a
  // context down, and this runs from a timer with nobody above it to catch.
  test("a page that throws on being read yields nothing, not an exception", () => {
    const page = {
      // A real fault, not a thrown Error: this is what reading a torn-down page
      // context actually does, and it keeps the file clear of unbranded throws.
      get Engine(): { battle?: unknown } | undefined {
        return (undefined as unknown as { Engine: { battle?: unknown } }).Engine;
      },
    };
    expect(() => getBattleFromWindow(page)).not.toThrow();
    expect(getBattleFromWindow(page)).toBeNull();
  });
});

describe("attaching", () => {
  test("wraps immediately when the game is already there, and sets no timer", () => {
    const clock = composeClock();
    const battle = composeBattle();
    let attached = 0;

    setEngineAttachment({ Engine: { battle } }, () => {}, {
      schedule: clock.schedule,
      cancel: clock.cancel,
      onAttached: () => (attached += 1),
    });

    expect(attached).toBe(1);
    // A timer scheduled only to be cancelled on its first tick is a timer that
    // exists to be read about rather than to run.
    expect(clock.getCancelCount()).toBe(0);
  });

  /**
   * The case the timer exists for: a userscript at `document-idle` can arrive
   * before the game builds its battle object.
   */
  test("keeps looking until the game appears, then stops", () => {
    const clock = composeClock();
    const page: { Engine?: { battle?: unknown } } = {};
    let attached = 0;

    setEngineAttachment(page, () => {}, {
      schedule: clock.schedule,
      cancel: clock.cancel,
      onAttached: () => (attached += 1),
    });
    expect(attached).toBe(0);

    clock.tick();
    expect(attached).toBe(0);

    page.Engine = { battle: composeBattle() };
    clock.tick();
    expect(attached).toBe(1);

    // Nothing to watch afterwards: the game does not replace the object.
    clock.tick();
    expect(attached).toBe(1);
    expect(clock.getCancelCount()).toBe(1);
  });

  /**
   * ⚠️ **The search used to have no end.** On a page that matches but never
   * builds an engine it ran ten times a second for the life of the tab, and said
   * nothing — a timer that never finds anything is indistinguishable from one
   * with nothing to do.
   *
   * Driven on an injected clock rather than a real one, so the bound is checked
   * without waiting a minute for it.
   */
  test("gives up eventually, says so once, and stops looking", () => {
    const clock = composeClock();
    let abandoned = 0;
    let attached = 0;

    setEngineAttachment({}, () => {}, {
      schedule: clock.schedule,
      cancel: clock.cancel,
      onAttached: () => (attached += 1),
      onSearchAbandoned: () => (abandoned += 1),
    });

    // A minute of looking at a tenth of a second each, and one more for luck.
    for (let looks = 0; looks < 601; looks += 1) clock.tick();

    expect(abandoned).toBe(1);
    expect(attached).toBe(0);
    expect(clock.getCancelCount()).toBe(1);
  });

  // Giving up is for a page with no game in it, not for a game that is slow.
  test("a game that arrives late is still found", () => {
    const clock = composeClock();
    const page: { Engine?: { battle?: unknown } } = {};
    let abandoned = 0;
    let attached = 0;

    setEngineAttachment(page, () => {}, {
      schedule: clock.schedule,
      cancel: clock.cancel,
      onAttached: () => (attached += 1),
      onSearchAbandoned: () => (abandoned += 1),
    });

    for (let looks = 0; looks < 500; looks += 1) clock.tick();
    page.Engine = { battle: composeBattle() };
    clock.tick();

    expect(attached).toBe(1);
    expect(abandoned).toBe(0);
  });

  test("messages reach the caller once attached", () => {
    const battle = composeBattle();
    const seen: string[] = [];
    setEngineAttachment({ Engine: { battle } }, (messages) => seen.push(...messages));

    (battle["updateData"] as (payload: unknown) => unknown)({ m: ["one", "two"] });
    expect(seen).toEqual(["one", "two"]);
  });

  test("detaching leaves the game as it was found", () => {
    const battle = composeBattle();
    const before = battle["updateData"];
    const stop = setEngineAttachment({ Engine: { battle } }, () => {});

    stop();
    expect(Object.prototype.hasOwnProperty.call(battle, "updateData")).toBe(false);
    expect(battle["updateData"]).toBe(before);
  });

  // The search may still be running when a user disables the add-on, and the
  // caller cannot know which state it is in.
  test("detaching before the game ever appeared is harmless", () => {
    const clock = composeClock();
    const stop = setEngineAttachment({}, () => {}, {
      schedule: clock.schedule,
      cancel: clock.cancel,
    });

    expect(() => stop()).not.toThrow();
    expect(clock.getCancelCount()).toBe(1);
  });
});

/**
 * The whole add-on, end to end, on real material.
 *
 * A captured fight is pushed through the actual entry point — the same function
 * the userscript runs — and the numbers that come out are compared against what
 * the offline tools report. Everything between the game's call and a panel's
 * input is exercised here.
 */
describe("the add-on driven by a captured fight", () => {
  test.each(CAPTURED_FIGHTS.map((fight) => [fight.name, fight] as const))(
    "%s reads through the entry point",
    (_name, fight) => {
      const battle = composeBattle();
      const readings: number[] = [];
      const meter = setMargoMeter(
        { Engine: { battle } },
        { onReading: (reading) => readings.push(reading.statistics.byCombatantId.size) },
      );

      expect(meter.getReading()).toBeNull();

      const updateData = battle["updateData"] as (payload: unknown) => unknown;
      for (const call of fight.dump.calls) updateData(call.payload);

      const reading = meter.getReading();
      expect(reading).not.toBeNull();
      expect(reading?.isFromFightStart).toBe(true);
      expect(reading?.ourSide).not.toBeNull();
      expect(reading?.statistics.bySide.size).toBeGreaterThan(1);
      expect(reading?.statistics.combatantIdsWithoutSide).toEqual([]);
      /**
       * A reading per payload that carried something, not per payload.
       *
       * ⚠️ **This assertion used to say `calls.length`, and the change is a
       * decision rather than a fix.** The game calls the engine far more often
       * than a fight has turns, and a payload that brings no message, no roster
       * fragment and no turn cannot change a single figure on screen — redrawing
       * for it is work done in front of somebody who is playing. Both captures
       * carry two such payloads, which is why the count is short by exactly two.
       */
      const carrying = fight.dump.calls.filter((call) => call.protocolMessages.length > 0).length;
      expect(readings.length).toBeGreaterThanOrEqual(carrying);
      expect(readings.length).toBeLessThan(fight.dump.calls.length);

      /**
       * ⚠️ **The turn axis, end to end through the code the userscript runs.**
       *
       * This is where the bug lived and where nothing could see it: the group
       * fight came out at 98 turns against the 299 the game numbered, so every
       * rate the panel drew was 3.05× too high.
       *
       * Held against the axis replayed offline rather than against a number
       * chosen per capture name. Two drivers reach the same material by different
       * routes — the entry point through the wrap and the session, the helper
       * straight down the payloads — so a divergence between them is the thing
       * worth catching here. What the number itself has to be is settled in
       * `tests/game/turn-axis.test.ts`, against the payloads, where 299 is still
       * named outright.
       */
      expect(reading?.fightTurns).toBe(composeTurnCountsOfFight(fight).fightTurns);

      meter.stop();
      expect(Object.prototype.hasOwnProperty.call(battle, "updateData")).toBe(false);
    },
  );
});

/**
 * The loop no other file can close: material out, and material back in.
 *
 * `src/game/fight-capture.ts` writes what `tools/fight-dump-parser.ts` reads, and
 * each of them is checked on its own elsewhere. Neither of those checks would
 * notice the two drifting apart — a writer and a reader that agree because both
 * made the same wrong assumption prove nothing separately, and everything
 * together.
 *
 * So a captured fight is replayed through the entry point the userscript runs,
 * the recording the add-on would hand over is composed from it, and that text is
 * read back by the offline parser and decoded. What comes out has to be the same
 * fight.
 */
describe("a recording the add-on makes, read back as material", () => {
  const ENVIRONMENT = {
    getWorld: (): string => "tempest",
    getGameBuild: (): string => "1786441768914",
    getCapturedAt: (): string => "2026-08-11T12:00:00.000Z",
  };

  /**
   * The fight's own combatants, in the shape the client keeps them — which is the
   * shape of the payload's `w`, because that is where the client copies them from.
   */
  function setWarriorsList(
    battle: Record<string, unknown>,
    combatants: readonly CombatantSnapshot[],
  ): void {
    battle["warriorsList"] = Object.fromEntries(
      combatants.map((one) => [
        composeIntegerText(one.id),
        {
          id: one.id,
          name: one.name,
          team: one.team,
          prof: one.profession,
          lvl: one.level,
          hp: { max: one.health.maximum, cur: one.health.current, hpp: one.health.percent },
        },
      ]),
    );
  }

  test.each(CAPTURED_FIGHTS.map((fight) => [fight.name, fight] as const))(
    "%s comes back out of the parser as the same fight",
    (_name, fight) => {
      let index = 0;
      const battle = Object.create({
        // The game moves the fight on and *then* the payload describes what moved,
        // which is the order the before-hook exists for. Modelled, so a recording
        // made here is one a real fight could have produced.
        updateData(): string {
          setWarriorsList(battle, fight.dump.calls[index]?.combatantsAfter ?? []);
          return "the original's answer";
        },
      }) as Record<string, unknown>;

      const meter = setMargoMeter({ Engine: { battle } });
      const updateData = battle["updateData"] as (payload: unknown) => unknown;
      for (const call of fight.dump.calls) {
        index = call.index;
        setWarriorsList(battle, call.combatantsBefore);
        updateData(call.payload);
      }

      const written = composeCaptureText(meter.getCapture(), ENVIRONMENT);
      const read = parseFightDump(written);

      // Every message, in order: the thinning drops calls, never their contents.
      const getMessagesOf = (calls: readonly { protocolMessages: readonly string[] }[]): string[] =>
        calls.flatMap((call) => [...call.protocolMessages]);
      expect(getMessagesOf(read.calls)).toEqual(getMessagesOf(fight.dump.calls));

      // And the same fight when read as meaning, not as text.
      const roster = composeRosterOfFight(fight);
      expect(decodeFight(getMessagesOf(read.calls), roster)).toEqual(
        decodeFight(getMessagesOf(fight.dump.calls), roster),
      );

      // The health the witness stands on survived the round trip on both sides.
      const withCombatants = read.calls.filter((call) => call.combatantsAfter.length > 0);
      expect(withCombatants.length).toBeGreaterThan(0);
      for (const call of read.calls) {
        const original = assertDefined(
          fight.dump.calls.find((one) => one.index === call.index),
          "a recorded call is one of the fight's own",
        );
        expect(call.combatantsAfter).toEqual(original.combatantsAfter);
        expect(call.combatantsBefore).toEqual(original.combatantsBefore);
      }

      meter.stop();
    },
  );
});

/**
 * What the panel is allowed to say on a console it shares with the game.
 *
 * §9.6 asks for one branded entry per failure rather than one per render, and
 * for warnings scoped to the fight that produced them. Both are properties of
 * the mount rather than of the panel, so they are checked where they live — with
 * the sink injected, because the rule is about how often it is called.
 */
describe("what a failing panel puts on the console", () => {
  /** A page whose every `span` refuses to be created, so sections cannot draw. */
  function composePageThatCannotDrawSpans(): {
    document: { createElement: (tag: string) => unknown; body: { append: () => void } };
  } {
    const composeNode = (): Record<string, unknown> => {
      const node: Record<string, unknown> = {
        className: "",
        textContent: "",
        title: "",
        style: { setProperty: (): void => {} },
        append: (): void => {},
        replaceChildren: (): void => {},
        addEventListener: (): void => {},
        attachShadow: (): unknown => composeNode(),
      };
      return node;
    };
    return {
      document: {
        createElement: (tag: string): unknown => {
          if (tag === "span") throw new TypeError("no spans today");
          return composeNode();
        },
        body: { append: (): void => {} },
      },
    };
  }

  function composeReadingOfFight(fightsStarted: number): FightReading {
    const roster = composeCombatantRoster([
      { id: 1, name: "a mage", side: 1, profession: "m", level: null },
      { id: 3, name: "something large", side: 2, profession: null, level: null },
    ]);
    return {
      statistics: composeFightStatistics(
        decodeFight(["1=90.00;3=50.00;+dmg=500;-dmg=400"], roster),
        roster,
      ),
      roster,
      turnsByCombatantId: new Map([[1, 3]]),
      fightTurns: 3,
      turnsWithoutActor: 0,
      ourSide: 1,
      isFromFightStart: true,
      fightsStarted,
    };
  }

  /**
   * ⚠️ **The mount speaks once too, and that is not the rule being broken.**
   *
   * This document refuses to make a span, and the title bar builds one for the
   * version — so the failure happens before a fight is ever drawn. It is
   * reported once, by the bar rather than by a section, and everything after it
   * is the per-fight rule this test is actually about.
   */
  test("one entry per fight however many times the fight redraws", () => {
    const said: unknown[][] = [];
    const render = composePanelMount(composePageThatCannotDrawSpans(), (brand, detail) =>
      said.push([brand, detail]),
    );
    expect(render).not.toBeNull();
    expect(said.map(([brand]) => brand)).toEqual(["MargoMeter/PanelCapture"]);
    const fromTheMount = said.length;

    const first = composeReadingOfFight(1);
    render?.(first);
    const afterOne = said.length;
    for (let redraws = 0; redraws < 20; redraws += 1) render?.(first);

    expect(afterOne - fromTheMount).toBe(1);
    expect(said.length - fromTheMount).toBe(1);
    expect(said[fromTheMount]?.[0]).toBe("MargoMeter/PanelSection");
  });

  // Counted, not dropped: what the repeats came to is said once the fight they
  // belong to is over, and the next fight starts from nothing.
  test("the repeats are counted, and a later fight is heard from again", () => {
    const said: unknown[][] = [];
    const render = composePanelMount(composePageThatCannotDrawSpans(), (brand, detail) =>
      said.push([brand, detail]),
    );

    // The first entry is the mount's, for the reason the test above states.
    const fromTheMount = said.length;
    render?.(composeReadingOfFight(1));
    render?.(composeReadingOfFight(1));
    render?.(composeReadingOfFight(2));

    expect(said.length - fromTheMount).toBe(3);
    expect(`${said[fromTheMount + 1]?.[1]}`).toContain("failures in that fight, 1 printed");
    expect(said[fromTheMount + 2]?.[0]).toBe("MargoMeter/PanelSection");
  });

  test("a fight that draws cleanly says nothing at all", () => {
    const said: unknown[][] = [];
    const composeNode = (): Record<string, unknown> => ({
      className: "",
      textContent: "",
      title: "",
      style: { setProperty: (): void => {} },
      append: (): void => {},
      replaceChildren: (): void => {},
      addEventListener: (): void => {},
      attachShadow: (): unknown => composeNode(),
    });
    const render = composePanelMount(
      { document: { createElement: (): unknown => composeNode(), body: { append: (): void => {} } } },
      (brand, detail) => said.push([brand, detail]),
    );

    render?.(composeReadingOfFight(1));
    render?.(composeReadingOfFight(2));
    expect(said).toEqual([]);
  });
});

/**
 * Where the panel was left, across a reload.
 *
 * This is the only thing the add-on remembers, and it is remembered here rather
 * than in `src/ui/` because reaching a global is this file's job alone (§8). What
 * a stored value has to prove to be believed is checked next door in
 * `tests/ui/panel-placement.test.ts`; what is checked here is that the mount asks
 * at all, and that a page which refuses storage still gets a panel.
 */
describe("remembering where the panel was put", () => {
  const POSITION_KEY = "margometer.panel-position";

  type StorageNode = Record<string, unknown> & {
    className: string;
    properties: Record<string, string>;
    listeners: Array<{ type: string; listener: (event: Record<string, unknown>) => void }>;
  };

  /**
   * A page with enough of a document to drive a drag through the whole mount.
   *
   * Poorer than the one in `tests/ui/panel.test.ts` — it records only what these
   * tests read — but real enough for the one thing that file cannot reach: what
   * the mount does with the position once the panel reports it.
   */
  function composePageWithStorage(storage: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
  }): {
    page: Parameters<typeof composePanelMount>[0];
    getHostProperties: () => Record<string, string>;
    getRoot: () => StorageNode | null;
  } {
    let hostProperties: Record<string, string> = {};
    let isHost = true;
    let root: StorageNode | null = null;
    const composeNode = (): StorageNode => {
      const properties: Record<string, string> = {};
      // The first element the mount creates is the host, and it is the only one
      // whose inline styles say anything about where the panel is.
      if (isHost) {
        isHost = false;
        hostProperties = properties;
      }
      const node: StorageNode = {
        className: "",
        textContent: "",
        title: "",
        properties,
        listeners: [],
        children: [] as StorageNode[],
        style: {
          setProperty: (name: string, value: string): void => void (properties[name] = value),
        },
        append: (...nodes: StorageNode[]): void =>
          void (node["children"] as StorageNode[]).push(...nodes),
        replaceChildren: (): void => {},
        addEventListener: (
          type: string,
          listener: (event: Record<string, unknown>) => void,
        ): void => void node.listeners.push({ type, listener }),
        setPointerCapture: (): void => {},
        releasePointerCapture: (): void => {},
        attachShadow: (): unknown => {
          root = composeNode();
          return root;
        },
      };
      return node;
    };
    return {
      page: {
        document: { createElement: (): unknown => composeNode(), body: { append: (): void => {} } },
        innerWidth: 1600,
        innerHeight: 900,
        localStorage: storage,
      },
      getHostProperties: () => hostProperties,
      getRoot: () => root,
    };
  }

  /** Grabs the title bar at the root and drags it, the way the panel's own tests do. */
  function setDragThrough(
    root: StorageNode,
    from: { left: number; top: number },
    to: { left: number; top: number },
  ): void {
    const getEveryNode = (node: StorageNode): StorageNode[] => [
      node,
      ...(node["children"] as StorageNode[]).flatMap(getEveryNode),
    ];
    const titleBar = assertDefined(
      getEveryNode(root).filter((node) => node.className === "titlebar")[0],
      "mounting the panel draws a title bar",
    );

    const setEventAt = (type: string, event: Record<string, unknown>): void => {
      for (const bound of root.listeners) if (bound.type === type) bound.listener(event);
    };
    setEventAt("pointerdown", {
      target: titleBar,
      clientX: from.left,
      clientY: from.top,
      pointerId: 3,
    });
    setEventAt("pointermove", { target: titleBar, clientX: to.left, clientY: to.top });
    setEventAt("pointerup", { target: titleBar, pointerId: 3 });
  }

  test("a position that was stored is where the panel opens", () => {
    const { page, getHostProperties } = composePageWithStorage({
      getItem: () => '{"left":120,"top":240}',
      setItem: () => {},
    });

    expect(composePanelMount(page)).not.toBeNull();
    expect(getHostProperties()["left"]).toBe("120px");
    expect(getHostProperties()["top"]).toBe("240px");
  });

  test("a position from a wider screen than this one comes back on screen", () => {
    const { page, getHostProperties } = composePageWithStorage({
      getItem: () => '{"left":3400,"top":50}',
      setItem: () => {},
    });

    composePanelMount(page);
    expect(getHostProperties()["left"]).toBe("1536px");
  });

  test.each([
    ["nothing stored", null],
    ["something that is not a position", '{"left":"far right"}'],
    ["something that is not JSON", "left 12"],
  ])("%s leaves the corner to the stylesheet", (_reason, stored) => {
    const { page, getHostProperties } = composePageWithStorage({
      getItem: () => stored,
      setItem: () => {},
    });

    composePanelMount(page);
    expect(getHostProperties()["left"]).toBeUndefined();
  });

  /**
   * A browser can refuse storage outright — a private window, a third-party
   * rule, a quota — and it does so by throwing. Losing the panel over where it
   * would have been drawn is a far worse outcome than opening in the corner.
   */
  test("a page that refuses storage still gets a panel", () => {
    const { page } = composePageWithStorage({
      getItem: () => {
        throw new TypeError("no storage here");
      },
      setItem: () => {
        throw new TypeError("no storage here");
      },
    });

    expect(() => composePanelMount(page)).not.toThrow();
    expect(composePanelMount(page)).not.toBeNull();
  });

  test("a page with no storage at all still gets a panel", () => {
    const composeNode = (): Record<string, unknown> => ({
      className: "",
      textContent: "",
      title: "",
      style: { setProperty: (): void => {} },
      append: (): void => {},
      replaceChildren: (): void => {},
      addEventListener: (): void => {},
      attachShadow: (): unknown => composeNode(),
    });

    expect(
      composePanelMount({
        document: { createElement: (): unknown => composeNode(), body: { append: (): void => {} } },
      }),
    ).not.toBeNull();
  });

  /** The whole loop the feature is: drag it, and the next page finds it there. */
  test("what a drag settles on is what the next page reads back", () => {
    const written: Array<[string, string]> = [];
    const { page, getRoot } = composePageWithStorage({
      getItem: () => '{"left":100,"top":100}',
      setItem: (key, value) => void written.push([key, value]),
    });

    composePanelMount(page);
    const root = getRoot();
    expect(root).not.toBeNull();
    setDragThrough(root as StorageNode, { left: 400, top: 400 }, { left: 450, top: 380 });

    expect(written).toEqual([[POSITION_KEY, '{"left":150,"top":80}']]);

    // And the page that opens next puts it there, which is the point of writing it.
    const reopened = composePageWithStorage({
      getItem: () => written[0]?.[1] ?? null,
      setItem: () => {},
    });
    composePanelMount(reopened.page);
    expect(reopened.getHostProperties()["left"]).toBe("150px");
    expect(reopened.getHostProperties()["top"]).toBe("80px");
  });

  test("a storage that refuses the write loses the position and nothing else", () => {
    const { page, getRoot, getHostProperties } = composePageWithStorage({
      getItem: () => null,
      setItem: () => {
        throw new TypeError("quota");
      },
    });

    composePanelMount(page);
    const root = getRoot();
    expect(() =>
      setDragThrough(root as StorageNode, { left: 400, top: 400 }, { left: 300, top: 300 }),
    ).not.toThrow();
    // The panel still moved; only the remembering failed. The number follows the
    // width token rather than being chosen: a narrower panel may sit further
    // right before the clamp catches it.
    expect(getHostProperties()["left"]).toBe(
      `${1492 - PANEL_PIXELS.width}px`,
    );
  });

  test("the key the position is stored under is namespaced to this add-on", () => {
    const asked: string[] = [];
    const { page } = composePageWithStorage({
      getItem: (key) => {
        asked.push(key);
        return null;
      },
      setItem: () => {},
    });

    composePanelMount(page);
    expect(asked).toEqual([POSITION_KEY]);
  });
});

/**
 * The condition on starting at all, which was wrong once and cost nothing to be
 * wrong: every test passed while the add-on did nothing in a real browser.
 */
describe("whether to start on this page", () => {
  test("a page is somewhere to start, even before the game exists", () => {
    expect(shouldStartHere({ document: {} })).toBe(true);
  });

  // The regression. Asking for the engine here meant a userscript that ran
  // before the game finished initialising never started, and so never scheduled
  // the search that exists for exactly that case.
  test("does not wait for the engine, because the search does that", () => {
    const page: { document: unknown; Engine?: unknown } = { document: {} };
    expect(shouldStartHere(page)).toBe(true);
    expect(page.Engine).toBeUndefined();
  });

  // Which is also what keeps importing this module from attaching to anything.
  test("a test runner is not a page", () => {
    expect(shouldStartHere({})).toBe(false);
  });
});

/**
 * Where a recording says it came from.
 *
 * The one thing here the panel never shows and a reader always needs: a capture
 * without a world is not comparable material (§7.6), and the file's own name is
 * where that answer is first read.
 */
describe("the world a saved recording names", () => {
  /** A page that keeps whatever the anchor was told, instead of downloading it. */
  function composePageAt(location: { hostname?: string | undefined } | undefined): {
    page: Parameters<typeof writeCaptureToPage>[0];
    getNames: () => string[];
  } {
    const names: string[] = [];
    const page = {
      location,
      document: {
        createElement: (): unknown => ({
          href: "",
          set download(name: string) {
            names.push(name);
          },
          click: (): void => {},
          remove: (): void => {},
        }),
        body: { append: (): void => {} },
      },
    } as unknown as Parameters<typeof writeCaptureToPage>[0];
    return { page, getNames: () => names };
  }

  const meter = {
    getReading: () => null,
    getCapture: () => composeEmptyCapture(),
    stop: (): void => {},
  };

  test("a world page is named by its world", () => {
    const { page, getNames } = composePageAt({ hostname: "tempest.margonem.pl" });
    writeCaptureToPage(page, meter);
    expect(getNames()[0]).toMatch(/^margometer-tempest-/);
  });

  /**
   * ⚠️ **The gap `?? "unknown"` left.** An empty hostname is not nullish, so the
   * fallback never fired and the file came out `margometer--2026-…json` — a name
   * with a hole in it rather than a name saying it does not know. Both spellings
   * of "the page did not say" have to reach the same word.
   */
  test("a page that does not say says so, rather than saying nothing", () => {
    for (const location of [{ hostname: "" }, {}, undefined]) {
      const { page, getNames } = composePageAt(location);
      writeCaptureToPage(page, meter);
      expect(getNames()[0], JSON.stringify(location)).toMatch(/^margometer-unknown-/);
    }
  });
});

/**
 * The property the drill exists for: a row opens the figures it showed, under
 * the name it showed.
 *
 * `panel-view.test.ts` holds "every section totals the row above it" one level
 * up. This is the level below, and it needs the entry point rather than `ui`
 * alone, because what a click *means* is decided here — the row key is composed
 * in one file and read in another, and nothing until now checked that the two
 * agree.
 */
describe("what a click does to the drill", () => {
  function composeReadingOfCapture(fight: (typeof CAPTURED_FIGHTS)[number]): FightReading {
    const roster = composeRosterOfFight(fight);
    const messages = fight.dump.calls.flatMap((call) => call.protocolMessages);
    return {
      statistics: composeFightStatistics(decodeFight(messages, roster), roster),
      roster,
      turnsByCombatantId: new Map(),
      fightTurns: null,
      turnsWithoutActor: 0,
      ourSide: null,
      isFromFightStart: true,
      fightsStarted: 1,
    };
  }

  /**
   * Every drillable row of every breakdown, in every metric — which is the only
   * way a collision between two combatants' rows shows up at all. Two healers
   * announcing the same skill produced two rows the panel could not tell apart,
   * and a sweep of one combatant would never have met the second one.
   */
  test.each(CAPTURED_FIGHTS)("$name opens what each row promised", (fight) => {
    const reading = composeReadingOfCapture(fight);
    let drilled = 0;

    for (const metric of PANEL_METRICS) {
      for (const focusCombatantId of reading.statistics.byCombatantId.keys()) {
        const state = { ...composeDefaultState(), metric, focusCombatantId };
        const view = composePanelView(reading, state);

        for (const list of view.lists) {
          for (const row of list.rows) {
            if (!row.canDrill) continue;
            drilled += 1;
            const deep = composePanelView(reading, {
              ...state,
              ...composeStateFromRow(state, row.key),
            });

            const where = `${metric} ${composeIntegerText(focusCombatantId)} ${row.key}`;
            expect(deep.lists[0]?.totalText, where).toBe(row.valueText);
            expect(deep.crumb?.hereLabel, where).toBe(row.label);
          }
        }
      }
    }

    expect(drilled).toBeGreaterThan(0);
  });

  /**
   * ⚠️ A key we did not compose leads nowhere, rather than somewhere wrong.
   *
   * `skill:78` carries no owner, and slicing it as though it did turns `78` into
   * the owner id `7` — a row silently opening a combatant nobody clicked, which
   * is the shape of the defect this key was widened to end.
   */
  test("a skill key with no owner in it opens nothing", () => {
    const state = { ...composeDefaultState(), focusCombatantId: 445202, metric: "healed" as const };

    expect(composeStateFromRow(state, "skill:78")).toEqual({});
    expect(composeStateFromRow(state, "skill:nonsense")).toEqual({});
    // The owner has to read as a number, the same rule the other two kinds use.
    expect(composeStateFromRow(state, "skill:abc:78")).toEqual({});
  });

  /**
   * The complaint in one test: the tab looked chosen and the screen did not move.
   *
   * A breakdown is a level below the list, and a side filter chooses who is on
   * the list — so it closes the breakdown rather than filtering one. Asserted by
   * what a reader sees, not by the returned object, or it would only restate the
   * function.
   */
  test("choosing a side goes back to the list that side filters", () => {
    const fight = assertDefined(CAPTURED_FIGHTS[0], "there is a capture to read");
    const base = composeReadingOfCapture(fight);
    const focusCombatantId = assertDefined(
      [...base.statistics.byCombatantId.keys()][0],
      "the capture has a combatant",
    );
    // A side of our own, or both filters are empty and the assertion below would
    // pass on a panel showing nothing.
    const ourSide = assertDefined(
      base.roster.byId.get(focusCombatantId)?.side,
      "the roster puts that combatant on a side",
    );
    const reading = { ...base, ourSide };
    const drilled = { ...composeDefaultState(), focusCombatantId, focusTargetId: 3 };

    const view = composePanelView(reading, { ...drilled, ...composeStateAfterTeam("enemy") });

    expect(view.crumb).toBeNull();
    expect(view.teamTabs.find((tab) => tab.isSelected)?.team).toBe("enemy");
    // A ranking again, and one holding somebody — not the breakdown it was in.
    expect(view.lists[0]?.heading).toBeNull();
    expect(view.lists[0]?.rows.length).toBeGreaterThan(0);
  });
});

/**
 * The copied report, against the figures it claims to carry.
 *
 * A report is what a person attaches to a bug they are reporting, so a figure
 * missing from it is a question nobody can answer afterwards. The map below is
 * checked *both* ways: every Polish name carries its field's number, and the
 * fields it covers are exactly the row's own — so a counter added to
 * `CombatantStatistics` and forgotten here fails the gate rather than showing up
 * as a hole in somebody's report months later.
 */
describe("the report a reader copies", () => {
  /** Every plain number a row holds, and the name the report gives it. */
  const FIGURE_KEYS: Record<string, keyof CombatantStatistics> = {
    zadane_surowe: "dealtRaw",
    zadane: "dealtApplied",
    otrzymane: "taken",
    utracone_poza_ciosem: "healthLost",
    leczenie: "healed",
    ciosy: "blowsStruck",
    ciosy_bez_umiejetnosci: "blowsWithoutSkill",
    maks_cios: "largestBlow",
    uzycia_umiejetnosci: "skillsUsed",
  };

  function composeReadingOf(fight: (typeof CAPTURED_FIGHTS)[number]): FightReading {
    const roster = composeRosterOfFight(fight);
    const messages = fight.dump.calls.flatMap((call) => call.protocolMessages);
    return {
      statistics: composeFightStatistics(decodeFight(messages, roster), roster),
      roster,
      turnsByCombatantId: new Map(),
      fightTurns: null,
      turnsWithoutActor: 0,
      ourSide: null,
      isFromFightStart: true,
      fightsStarted: 1,
    };
  }

  function getReport(reading: FightReading): Record<string, unknown> {
    const reading_ = getValueFromJsonText(composeReportText({} as never, reading));
    expect(reading_.syntaxError).toBeNull();
    return reading_.value as Record<string, unknown>;
  }

  /**
   * Discovered from the object rather than listed, which is the half of this a
   * hand-written list cannot do: a new field shows up here without anybody
   * remembering to add it.
   */
  test("names every plain number a row holds, and invents none", () => {
    const fight = assertDefined(CAPTURED_FIGHTS[0], "there is a capture to read");
    const row = assertDefined(
      [...composeReadingOf(fight).statistics.byCombatantId.values()][0],
      "the capture has a combatant",
    );
    const numeric = Object.entries(row)
      .filter(([, value]) => getFiniteNumberFromValue(value) !== null)
      .map(([field]) => field);

    const covered: string[] = Object.values(FIGURE_KEYS);
    expect(covered.sort()).toEqual(numeric.sort());
  });

  test.each(CAPTURED_FIGHTS)("$name carries the same figures the row does", (fight) => {
    const reading = composeReadingOf(fight);
    const walka = assertDefined(
      (getReport(reading) as { walka?: { postacie?: Record<string, unknown> } }).walka,
      "a reading composes a fight",
    );
    const postacie = assertDefined(walka.postacie, "the report lists the combatants");

    for (const [id, row] of reading.statistics.byCombatantId) {
      const reported = assertDefined(
        postacie[composeIntegerText(id)],
        `the report holds ${composeIntegerText(id)}`,
      ) as Record<string, unknown>;

      for (const [name, field] of Object.entries(FIGURE_KEYS)) {
        expect(
          getFiniteNumberFromValue(reported[name]),
          `${name} of ${composeIntegerText(id)}`,
        ).toBe(getFiniteNumberFromValue(row[field]));
      }
    }
  });
});
