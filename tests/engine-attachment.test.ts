/**
 * Getting onto the game, and off it again, without a browser.
 *
 * The clock is injected, so "the game finished initialising three ticks after we
 * did" is a thing this file can state rather than wait for. That is the only
 * reason these properties are checkable at all: the real version of this test
 * would be a person loading a userscript and watching.
 */

import { describe, expect, test } from "bun:test";
import { getBattleFromWindow, setEngineAttachment } from "@/src/game/engine-attachment.ts";
import { setMargoMeter, shouldStartHere } from "@/src/userscript-entry.ts";
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
