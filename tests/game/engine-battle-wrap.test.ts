/**
 * The promises `src/game/engine-battle-wrap.ts` makes to the game, re-earned on
 * every run.
 *
 * This is the only code in the repository that changes a running game, so the
 * tests are about *restraint* rather than about output: the original still runs,
 * still returns what it returned, and nothing of ours escapes into its call
 * stack. A wrong number is this project's usual failure; breaking someone's game
 * is a worse one, and these are the guards against it.
 *
 * The engine is a plain object here. That is the whole benefit of taking it as an
 * argument — the promises are checkable without a browser.
 */

import { describe, expect, test } from "bun:test";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import {
  EngineBattleWrapError,
  getMessagesFromPayload,
  removeBattleWrap,
  setBattleWrap,
  type EngineBattle,
} from "@/src/game/engine-battle-wrap.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

/**
 * A battle object shaped like the game's: the method lives on the prototype,
 * because that is where the client keeps it and it is what makes detaching
 * subtle.
 */
function composeBattle(onCall?: (payload: unknown) => unknown): EngineBattle {
  const prototype = {
    // `call`, not a plain invocation: the fake has to forward `this` as faithfully
    // as the game's own method would, or the test below proves nothing.
    updateData(this: unknown, payload: unknown): unknown {
      return onCall?.call(this, payload) ?? "the original's answer";
    },
  };
  return Object.create(prototype) as EngineBattle;
}

/** The method as it now stands on the object, wrapper or original. */
function getBattleMethod(battle: EngineBattle): (...args: unknown[]) => unknown {
  const method = battle["updateData"];
  if (typeof method !== "function") {
    throw new EngineBattleWrapError("the fake battle lost its method");
  }
  return method as (...args: unknown[]) => unknown;
}

describe("what the wrap promises the game", () => {
  test("the original runs first, and its value comes back untouched", () => {
    const order: string[] = [];
    const battle = composeBattle(() => {
      order.push("game");
      return { theGames: "own object" };
    });

    setBattleWrap(battle, () => order.push("ours"));
    const returned = getBattleMethod(battle)({ m: [] });

    expect(order).toEqual(["game", "ours"]);
    expect(returned).toEqual({ theGames: "own object" });
  });

  test("the original is called with what the game passed, and with `this`", () => {
    const seen: unknown[] = [];
    const battle = composeBattle(function (this: unknown, payload: unknown) {
      seen.push(this, payload);
      return null;
    });

    setBattleWrap(battle, () => {});
    getBattleMethod(battle).call(battle, { m: ["x"] }, 7);

    expect(seen[0]).toBe(battle);
    expect(seen[1]).toEqual({ m: ["x"] });
  });

  /**
   * The one that matters most. Our reading is where a decoder bug would surface,
   * and it must not become the game's problem — §9.6 puts an add-on that breaks
   * the game's own scripts below one that shows nothing.
   */
  test("an exception of ours never reaches the caller", () => {
    const battle = composeBattle();
    const failures: unknown[] = [];
    const bug = undefined as unknown as { read: () => void };
    setBattleWrap(battle, () => bug.read(), {
      onReadingFailure: (error) => failures.push(error),
    });

    expect(() => getBattleMethod(battle)({ m: [] })).not.toThrow();
    expect(failures.length).toBe(1);
  });

  // A reporter that throws is still not the game's problem.
  test("a failing failure reporter is swallowed too", () => {
    const battle = composeBattle();
    const bug = undefined as unknown as { read: () => void };
    setBattleWrap(battle, () => bug.read(), {
      onReadingFailure: () => bug.read(),
    });

    expect(() => getBattleMethod(battle)({ m: [] })).not.toThrow();
  });

  test("wrapping twice leaves one layer, not two", () => {
    const battle = composeBattle();
    const batches: number[] = [];

    setBattleWrap(battle, (messages) => batches.push(messages.length));
    setBattleWrap(battle, (messages) => batches.push(messages.length));
    getBattleMethod(battle)({ m: ["a", "b"] });

    expect(batches).toEqual([2]);
  });

  /**
   * The method reaches the object through its prototype, so putting the original
   * back by assignment would leave an own property shadowing the class for as
   * long as the page lives — on an object belonging to the game, after our
   * add-on has been removed.
   */
  test("detaching leaves the object as it was found, prototype and all", () => {
    const battle = composeBattle();
    const before = battle["updateData"];

    const remove = setBattleWrap(battle, () => {});
    expect(Object.prototype.hasOwnProperty.call(battle, "updateData")).toBe(true);

    remove();
    expect(Object.prototype.hasOwnProperty.call(battle, "updateData")).toBe(false);
    expect(battle["updateData"]).toBe(before);
  });

  test("detaching restores an own property when the object had one", () => {
    const battle = composeBattle();
    const getOwnedAnswer = function getOwnedAnswer(): string {
      return "owned";
    };
    battle["updateData"] = getOwnedAnswer;

    const remove = setBattleWrap(battle, () => {});
    remove();

    expect(Object.prototype.hasOwnProperty.call(battle, "updateData")).toBe(true);
    expect(battle["updateData"]).toBe(getOwnedAnswer);
  });

  /**
   * Somebody else's add-on wrapped after us. Tearing their layer out would be
   * exactly what we would least like done to ours, so nothing happens and the
   * caller is told nothing happened.
   */
  test("another add-on's layer on top is left alone", () => {
    const battle = composeBattle();
    setBattleWrap(battle, () => {});

    const ours = battle["updateData"];
    const getAnotherAddonsAnswer = function getAnotherAddonsAnswer(): string {
      return "someone else";
    };
    battle["updateData"] = getAnotherAddonsAnswer;

    expect(removeBattleWrap(battle)).toBe(false);
    expect(battle["updateData"]).toBe(getAnotherAddonsAnswer);
    expect(battle["updateData"]).not.toBe(ours);
  });

  test("refuses an object whose method the client has renamed", () => {
    expect(() => setBattleWrap({}, () => {})).toThrow(EngineBattleWrapError);
  });
});

describe("what is read out of a payload", () => {
  // The payload is the game's. Anything unexpected yields no messages rather
  // than a guess — an empty batch is a state the panel already handles.
  test.each([[undefined], [null], [42], [{}], [{ m: "not a list" }], [{ m: [1, 2] }]])(
    "reads nothing out of %p",
    (payload) => {
      expect(getMessagesFromPayload(payload)).toEqual([]);
    },
  );

  test("keeps the strings and drops what is not one", () => {
    expect(getMessagesFromPayload({ m: ["a", 3, "b", null] })).toEqual(["a", "b"]);
  });
});

/**
 * The live path against the offline one.
 *
 * Everything this project has verified was verified by reading files. This is
 * the only test that runs the material through the wrap the way the game would
 * — payload by payload, in order — and it exists because the two paths agreeing
 * is not obvious: the offline path sees one list of messages, the live path sees
 * a hundred separate calls and has to accumulate.
 */
describe("a captured fight replayed through the wrap", () => {
  test.each(CAPTURED_FIGHTS.map((fight) => [fight.name, fight] as const))(
    "%s decodes the same either way",
    (_name, fight) => {
      const battle = composeBattle();
      const collected: string[] = [];
      setBattleWrap(battle, (messages) => collected.push(...messages));

      const updateData = getBattleMethod(battle);
      for (const call of fight.dump.calls) updateData({ m: call.protocolMessages });

      const offline = fight.dump.calls.flatMap((call) => call.protocolMessages);
      expect(collected).toEqual(offline);
      expect(decodeFight(collected)).toEqual(decodeFight(offline));
      expect(collected.length).toBeGreaterThan(0);
    },
  );
});
