/**
 * Getting onto the game, and off it again, without a browser.
 *
 * The clock is injected, so "the game finished initialising three ticks after we
 * did" is a thing this file can state rather than wait for. That is the only
 * reason these properties are checkable at all: the real version of this test
 * would be a person loading a userscript and watching.
 */

import { describe, expect, test } from "bun:test";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import type { FightReading } from "@/src/game/battle-session.ts";
import { getBattleFromWindow, setEngineAttachment } from "@/src/game/engine-attachment.ts";
import { composePanelMount, setMargoMeter, shouldStartHere } from "@/src/userscript-entry.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

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
      expect(readings.length).toBe(fight.dump.calls.length);

      meter.stop();
      expect(Object.prototype.hasOwnProperty.call(battle, "updateData")).toBe(false);
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
      { id: 1, name: "a mage", side: 1, profession: "m" },
      { id: 3, name: "something large", side: 2, profession: null },
    ]);
    return {
      statistics: composeFightStatistics(
        decodeFight(["1=90.00;3=50.00;+dmg=500;-dmg=400"], roster),
        roster,
      ),
      roster,
      ourSide: 1,
      isFromFightStart: true,
      fightsStarted,
    };
  }

  test("one entry per fight however many times the fight redraws", () => {
    const said: unknown[][] = [];
    const render = composePanelMount(composePageThatCannotDrawSpans(), (brand, detail) =>
      said.push([brand, detail]),
    );
    expect(render).not.toBeNull();

    const first = composeReadingOfFight(1);
    render?.(first);
    const afterOne = said.length;
    for (let redraws = 0; redraws < 20; redraws += 1) render?.(first);

    expect(afterOne).toBe(1);
    expect(said.length).toBe(1);
    expect(said[0]?.[0]).toBe("MargoMeter/PanelSection");
  });

  // Counted, not dropped: what the repeats came to is said once the fight they
  // belong to is over, and the next fight starts from nothing.
  test("the repeats are counted, and a later fight is heard from again", () => {
    const said: unknown[][] = [];
    const render = composePanelMount(composePageThatCannotDrawSpans(), (brand, detail) =>
      said.push([brand, detail]),
    );

    render?.(composeReadingOfFight(1));
    render?.(composeReadingOfFight(1));
    render?.(composeReadingOfFight(2));

    expect(said.length).toBe(3);
    expect(`${said[1]?.[1]}`).toContain("failures in that fight, 1 printed");
    expect(said[2]?.[0]).toBe("MargoMeter/PanelSection");
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
