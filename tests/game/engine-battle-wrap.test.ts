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
  getPayloadReading,
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

  /**
   * The before-hook exists so a collector can read the fight in the state the
   * payload is about to replace. Ordering is the whole of what it buys: run it
   * after the original and it reads the state *after*, which is the same thing
   * the reading already sees.
   */
  test("the before-hook runs ahead of the original, on the battle object", () => {
    const order: string[] = [];
    const seen: unknown[] = [];
    const battle = composeBattle(() => {
      order.push("game");
      return null;
    });

    setBattleWrap(battle, () => order.push("ours"), {
      onBeforeOriginal: (given) => {
        order.push("before");
        seen.push(given);
      },
    });
    getBattleMethod(battle)({ m: [] });

    expect(order).toEqual(["before", "game", "ours"]);
    expect(seen).toEqual([battle]);
  });

  /**
   * ⚠️ **The reason the two guards are separate, and the mutation that proves
   * it.** Put both in one `try` and this test goes red: a throwing collector
   * jumps past `onMessages`, so a developer's tool for gathering material would
   * silently stop the meter counting — the one failure such a tool must not
   * have.
   */
  test("a throwing before-hook stops neither the game nor the reading", () => {
    const order: string[] = [];
    const failures: unknown[] = [];
    const battle = composeBattle(() => {
      order.push("game");
      return "the original's answer";
    });
    const bug = undefined as unknown as { read: () => void };

    setBattleWrap(battle, () => order.push("ours"), {
      onBeforeOriginal: () => bug.read(),
      onReadingFailure: (error) => failures.push(error),
    });

    let returned: unknown = null;
    expect(() => {
      returned = getBattleMethod(battle)({ m: ["a"] });
    }).not.toThrow();

    expect(order).toEqual(["game", "ours"]);
    expect(returned).toBe("the original's answer");
    expect(failures.length).toBe(1);
  });

  test("wrapping twice leaves one layer, not two", () => {
    const battle = composeBattle();
    const batches: number[] = [];

    setBattleWrap(battle, (reading) => batches.push(reading.messages.length));
    setBattleWrap(battle, (reading) => batches.push(reading.messages.length));
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

    const { remove } = setBattleWrap(battle, () => {});
    expect(Object.prototype.hasOwnProperty.call(battle, "updateData")).toBe(true);

    remove();
    expect(Object.prototype.hasOwnProperty.call(battle, "updateData")).toBe(false);
    expect(battle["updateData"]).toBe(before);
  });

  /**
   * ⚠️ **Only the refusals were ever asserted.** Three tests state that
   * `removeBattleWrap` answers `false` where it must not act, and none stated
   * that it answers `true` where it did — so a removal that worked and reported
   * failure was invisible. That is the direction that matters: the caller uses
   * the answer to decide whether the add-on is still on the page.
   */
  test("and says it removed something, not only when it did not", () => {
    const battle = composeBattle();
    setBattleWrap(battle, () => {});

    expect(removeBattleWrap(battle)).toBe(true);
    // And not twice: the record is gone, so there is nothing left to take off.
    expect(removeBattleWrap(battle)).toBe(false);
  });

  test("detaching restores an own property when the object had one", () => {
    const battle = composeBattle();
    const getOwnedAnswer = function getOwnedAnswer(): string {
      return "owned";
    };
    battle["updateData"] = getOwnedAnswer;

    const { remove } = setBattleWrap(battle, () => {});
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

/**
 * Two copies of the add-on on one page.
 *
 * ⚠️ **The failure this prevents doubles every figure in the panel, and it had
 * not gone off yet.** The "already wrapped" guard used to ask whether the marker
 * equalled *our* version, so a wrapper of ours from another build failed the
 * test, the guard did not fire, and a second layer went on top. Both then read
 * the same payload. `WRAP_VERSION` has been `1` in every shipped build, so the
 * day it becomes `2` is the day anyone running both copies counts everything
 * twice — in the release nobody would think to look at.
 */
describe("a second copy of the add-on", () => {
  /** A wrapper of ours from a build that is not this one. */
  function composeOlderWrapper(battle: EngineBattle, onCall: () => void): void {
    const original = getBattleMethod(battle);
    const older = function (this: unknown, ...args: unknown[]): unknown {
      onCall();
      return original.apply(this, args);
    };
    (older as unknown as Record<string, unknown>)["__margometerBattleWrap"] = 99;
    battle["updateData"] = older;
  }

  test("does not wrap over a MargoMeter of another vintage", () => {
    const battle = composeBattle();
    composeOlderWrapper(battle, () => {});
    const older = battle["updateData"];

    const attachment = setBattleWrap(battle, () => {});

    expect(battle["updateData"]).toBe(older);
    expect(attachment.hasAnotherReader).toBe(true);
  });

  test("so the fight is counted once and not twice", () => {
    const battle = composeBattle();
    const counted: string[] = [];
    composeOlderWrapper(battle, () => counted.push("older"));

    setBattleWrap(battle, () => counted.push("ours"));
    getBattleMethod(battle)({ m: ["a"], mi: [1] });

    expect(counted).toEqual(["older"]);
  });

  test("and a marker whose value is not a version at all still counts as one", () => {
    const battle = composeBattle();
    const other = function (): string {
      return "someone";
    };
    (other as unknown as Record<string, unknown>)["__margometerBattleWrap"] = "who knows";
    battle["updateData"] = other;

    expect(setBattleWrap(battle, () => {}).hasAnotherReader).toBe(true);
    expect(battle["updateData"]).toBe(other);
  });

  /**
   * ⚠️ **Removal by identity, not by the marker.** Two copies of the *same*
   * build carry the same marker and the same version, so a removal that trusted
   * the marker would tear out the other copy's layer and leave the game calling
   * a function nobody owns.
   */
  test("cannot remove a layer it did not install, even one of ours", () => {
    const battle = composeBattle();
    composeOlderWrapper(battle, () => {});
    const older = battle["updateData"];

    setBattleWrap(battle, () => {});

    expect(removeBattleWrap(battle)).toBe(false);
    expect(battle["updateData"]).toBe(older);
  });

  /**
   * ⚠️ **The case the identity check exists for, and the only one that reaches
   * it.** In the test above this copy never wrapped, so removal stops at "I have
   * no record of this object". Here it does have one — ours went on first, and
   * another MargoMeter wrapped over the top afterwards. A removal that trusted
   * the marker would find one, believe the top layer was ours, and restore the
   * original *over* the other copy's wrapper: their layer gone, the game calling
   * a function nobody owns, and no error anywhere.
   */
  test("and not when ours is underneath somebody else's MargoMeter", () => {
    const battle = composeBattle();
    setBattleWrap(battle, () => {});
    const ours = battle["updateData"];

    // The other copy wraps over us. Its wrapper carries the marker, exactly as
    // ours does — two copies of one build agree on the version as well.
    composeOlderWrapper(battle, () => {});
    const theirs = battle["updateData"];

    expect(theirs).not.toBe(ours);
    expect(removeBattleWrap(battle)).toBe(false);
    expect(battle["updateData"]).toBe(theirs);
  });

  test("wrapping the same object twice from one copy still leaves one layer", () => {
    const battle = composeBattle();
    const batches: number[] = [];

    const first = setBattleWrap(battle, (reading) => batches.push(reading.messages.length));
    const second = setBattleWrap(battle, (reading) => batches.push(reading.messages.length));
    getBattleMethod(battle)({ m: ["a", "b"], mi: [1, 2] });

    expect(batches).toEqual([2]);
    // Ours, not a stranger's — so this copy still owns what it put on.
    expect(first.hasAnotherReader).toBe(false);
    expect(second.hasAnotherReader).toBe(false);
  });
});

/**
 * ⚠️ **This block used to assert the silence.** Its rule was "anything
 * unexpected yields no messages rather than a guess — an empty batch is a state
 * the panel already handles", and that is true of a payload which opens a fight
 * and false of one whose shape we no longer recognise. Both produced the same
 * empty list, so the day the game renames `m` every fight reads as zero messages
 * and the panel draws the zeroes as though they were the count. A guess is not
 * the only way to be wrong about somebody else's data; agreeing with yourself
 * about it is the other.
 */
describe("what is read out of a payload", () => {
  test("a payload that mentions no messages is not a payload we failed to read", () => {
    // 20 of the 400 captured engine calls look like this, every one of them a
    // fight opening or closing. An alarm here is an alarm nobody reads.
    for (const payload of [{}, { init: 1 }, { w: {} }]) {
      expect(getPayloadReading(payload)).toEqual({
        payload,
        messages: [],
        fault: null,
        lostMessages: 0,
      });
    }
  });

  test("a payload carrying an empty list of messages is also clean", () => {
    expect(getPayloadReading({ m: [], mi: [] }).fault).toBeNull();
  });

  test.each([[undefined], [null], [42], ["not a payload"]])(
    "%p is not a payload at all, and says so",
    (payload) => {
      const reading = getPayloadReading(payload);
      expect(reading.fault).toBe("payload-not-a-record");
      expect(reading.messages).toEqual([]);
      // Not zero: something was lost and nothing said how much. A zero here
      // would state that nothing was, which is the opposite of what is known.
      expect(reading.lostMessages).toBeNull();
    },
  );

  test("messages that did not arrive as a list are a fault, not an empty fight", () => {
    expect(getPayloadReading({ m: "not a list" }).fault).toBe("messages-not-a-list");
    expect(getPayloadReading({ m: "not a list" }).lostMessages).toBeNull();
    // The companion list still says how many there were, so here the number is
    // knowable even though the messages are not.
    expect(getPayloadReading({ m: {}, mi: [1, 2, 3] }).lostMessages).toBe(3);
  });

  /**
   * The case this whole round exists for: the messages arrive under a name we do
   * not know, and `mi` is what still says they arrived at all.
   */
  test("messages under a name we do not know are counted as lost", () => {
    const reading = getPayloadReading({ mm: ["a", "b", "c"], mi: [1, 2, 3] });

    expect(reading.fault).toBe("messages-lost");
    expect(reading.lostMessages).toBe(3);
    expect(reading.messages).toEqual([]);
  });

  test("an entry that is not text is counted, not dropped in silence", () => {
    const reading = getPayloadReading({ m: ["a", 3, "b", null], mi: [1, 2, 3, 4] });

    expect(reading.messages).toEqual(["a", "b"]);
    expect(reading.fault).toBe("messages-lost");
    expect(reading.lostMessages).toBe(2);
  });

  test("a short list is loud even where nothing counted it", () => {
    // `m`'s own length is the second witness, so losing `mi` to a rename costs
    // this case its count but not its alarm.
    const reading = getPayloadReading({ m: ["a", 3] });

    expect(reading.fault).toBe("messages-lost");
    expect(reading.lostMessages).toBe(1);
  });

  /**
   * ⚠️ **The one case `m` alone cannot see, and the whole reason `mi` is read.**
   * Every other loss shows up as a gap between `m`'s length and the strings in
   * it. A list that simply arrived shorter than the payload says it is has no
   * such gap — `m` is internally consistent and wrong. Written because dropping
   * the `mi` comparison from the reader broke nothing: the mutation survived, so
   * the witness was being carried without being held (§7.5).
   */
  test("a list that arrived shorter than the payload counted is loud", () => {
    const reading = getPayloadReading({ m: ["a"], mi: [1, 2, 3] });

    expect(reading.messages).toEqual(["a"]);
    expect(reading.fault).toBe("messages-lost");
    expect(reading.lostMessages).toBe(2);
  });

  /**
   * The three that `bun tools/mutation-sweep.ts` found nothing holding, all of
   * them a count that is present and says **nothing was lost**.
   *
   * Zero is the awkward number here: it is a real answer from the companion list
   * and the neutral element of the arithmetic, so every off-by-one at the
   * boundary reads as "a message went missing" when nothing did. A reader that
   * cries loss on a fight where none happened is the warning people learn to
   * ignore, which costs more than the warning was ever worth.
   */
  test("a count that is present and says zero is not a loss", () => {
    // Kills `statedCount > 0` → `>= 0`: with the mutation this announces a fault
    // carrying a loss of nought.
    expect(getPayloadReading({ mi: [] })).toEqual({
      payload: { mi: [] },
      messages: [],
      fault: null,
      lostMessages: 0,
    });
  });

  test("an empty list of messages with nothing counting it is not a loss either", () => {
    // Kills `statedCount ?? 0` → `?? 1`: with the mutation an empty list is one
    // message short of a count nobody stated.
    expect(getPayloadReading({ m: [] })).toEqual({
      payload: { m: [] },
      messages: [],
      fault: null,
      lostMessages: 0,
    });
  });

  test("and a payload that arrived whole reports nothing lost", () => {
    // Kills `lostMessages: 0` → `1` on the return every ordinary payload takes.
    // Every other clean case in this block goes out through the earlier return,
    // so this line was the one nothing looked at.
    expect(getPayloadReading({ m: ["a", "b"], mi: [1, 2] })).toEqual({
      payload: { m: ["a", "b"], mi: [1, 2] },
      messages: ["a", "b"],
      fault: null,
      lostMessages: 0,
    });
  });

  test("the payload is carried through untouched", () => {
    // Deciding its shape is this layer's job and nobody else's, so what the
    // session and the recording receive is the argument the game passed.
    const payload = { m: ["a"], mi: [1], anything: { else: true } };

    expect(getPayloadReading(payload).payload).toBe(payload);
  });
});

/**
 * The reader against every payload the game has actually sent us.
 *
 * This is the half that keeps the classifier honest. A fault that never fires is
 * useless and a fault that fires on real material is worse than useless — it is
 * the warning people learn to scroll past. Both are checked here at once.
 */
describe("the captured payloads, read as the wrap reads them", () => {
  const READINGS = CAPTURED_FIGHTS.flatMap((fight) =>
    fight.dump.calls.map((call) => ({
      fight: fight.name,
      call: call.index,
      stated: call.protocolMessages,
      reading: getPayloadReading(call.payload),
    })),
  );

  test("there are payloads to read", () => {
    expect(READINGS.length).toBeGreaterThan(0);
  });

  test("every one of them reads clean", () => {
    const faulty = READINGS.filter(({ reading }) => reading.fault !== null).map(
      ({ fight, call, reading }) => `${fight} call ${call}: ${reading.fault}`,
    );

    expect(faulty).toEqual([]);
  });

  test("and gives back exactly the messages the capture recorded", () => {
    const wrong = READINGS.filter(
      ({ stated, reading }) => reading.messages.join(" ") !== stated.join(" "),
    ).map(({ fight, call }) => `${fight} call ${call}`);

    expect(wrong).toEqual([]);
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
      setBattleWrap(battle, (reading) => collected.push(...reading.messages));

      const updateData = getBattleMethod(battle);
      for (const call of fight.dump.calls) updateData({ m: call.protocolMessages });

      const offline = fight.dump.calls.flatMap((call) => call.protocolMessages);
      expect(collected).toEqual(offline);
      expect(decodeFight(collected)).toEqual(decodeFight(offline));
      expect(collected.length).toBeGreaterThan(0);
    },
  );
});
