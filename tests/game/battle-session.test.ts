/**
 * How a fight is put together out of the pieces the game hands over.
 *
 * Each rule below was measured on the captures before it was written, and the
 * measurements are what make them worth guarding: the payload's shape is not
 * documented anywhere, so every one of these is a claim about the game that
 * could quietly stop being true.
 */

import { describe, expect, test } from "bun:test";
import {
  composeEmptySession,
  composeFightReading,
  composeNextSession,
  isFightStart,
} from "@/src/game/battle-session.ts";
import { CAPTURED_FIGHTS, type CapturedFight } from "@/tests/captured-fight-catalog.ts";

/** The payload the engine call carried, as the capture recorded it. */
function getPayloads(fight: CapturedFight): unknown[] {
  return fight.dump.calls.map((call) => call.payload);
}

describe("where one fight ends and the next begins", () => {
  // The client compares with `==`, and the captures state a string. Reading only
  // one of the two would stop noticing fight starts the day the game sends the
  // other.
  test.each([["1"], [1]])("a payload stating init %p opens a fight", (init) => {
    expect(isFightStart({ init })).toBe(true);
  });

  test.each([[{}], [{ init: "0" }], [{ init: 0 }], [null], ["not a payload"]])(
    "%p does not",
    (payload) => {
      expect(isFightStart(payload)).toBe(false);
    },
  );

  /**
   * Order inside a single payload, which is the reason `composeNextSession` is
   * one function and not three: the opening payload carries the fight's roster
   * and — in the group capture — three of its messages. Resetting after taking
   * them would throw away the beginning of the fight it just started.
   */
  test("an opening payload keeps what it arrived with", () => {
    const stale = composeNextSession(composeEmptySession(), {}, ["from an older fight"]);
    const fresh = composeNextSession(
      stale,
      { init: "1", myteam: 1, w: { "7": { id: 7, name: "a", team: 1, prof: "m" } } },
      ["the new fight's first message"],
    );

    expect(fresh.messages).toEqual(["the new fight's first message"]);
    expect(fresh.combatants).toEqual([{ id: 7, name: "a", side: 1, profession: "m" }]);
    expect(fresh.ourSide).toBe(1);
    expect(fresh.isFromFightStart).toBe(true);
  });
});

describe("the roster as it arrives in pieces", () => {
  /**
   * Measured: `w` rides nearly every call but holds between 1 and 11 of 11
   * warriors. It is a delta, so a later fragment must not be read as the whole
   * roster — every name resolution in the fight depends on this.
   */
  test("a fragment adds and never takes away", () => {
    let session = composeNextSession(composeEmptySession(), {
      init: "1",
      w: { "1": { id: 1, name: "one", team: 1, prof: "m" }, "2": { id: 2, name: "two", team: 2, prof: "m" } },
    }, []);
    session = composeNextSession(session, { w: { "3": { id: 3, name: "three", team: 2, prof: "m" } } }, []);

    expect(session.combatants.map((combatant) => combatant.id)).toEqual([1, 2, 3]);
  });

  test("a payload mentioning nobody leaves the roster standing", () => {
    let session = composeNextSession(composeEmptySession(), {
      init: "1",
      w: { "1": { id: 1, name: "one", team: 1, prof: "m" } },
    }, []);
    session = composeNextSession(session, { m: ["a message and no warriors"] }, ["x"]);

    expect(session.combatants.map((combatant) => combatant.id)).toEqual([1]);
  });

  // First-seen order survives, so a later update does not reshuffle the fight.
  test("a fragment updates in place rather than moving anyone", () => {
    let session = composeNextSession(composeEmptySession(), {
      init: "1",
      w: { "1": { id: 1, name: "one", team: 1, prof: "m" }, "2": { id: 2, name: "two", team: 2, prof: "m" } },
    }, []);
    session = composeNextSession(session, { w: { "1": { id: 1, name: "renamed", team: 1, prof: "m" } } }, []);

    expect(session.combatants.map((combatant) => combatant.name)).toEqual(["renamed", "two"]);
  });
});

describe("which side is the player's", () => {
  /**
   * Measured: `myteam` rides the opening payload and no other. If a later
   * fragment could clear it, the panel would lose its labels partway through
   * every fight.
   */
  test("is remembered once stated", () => {
    let session = composeNextSession(composeEmptySession(), { init: "1", myteam: 2 }, []);
    session = composeNextSession(session, { w: {} }, []);

    expect(session.ourSide).toBe(2);
  });

  // Attaching mid-fight never sees the opening payload. Null is the truth, and
  // guessing would put every row under the wrong heading.
  test("is unknown when the fight was joined late", () => {
    const session = composeNextSession(composeEmptySession(), { w: {} }, ["a message"]);

    expect(session.ourSide).toBeNull();
    expect(session.isFromFightStart).toBe(false);
  });
});

/**
 * The session against the offline path.
 *
 * The captures are replayed payload by payload, exactly as the game delivered
 * them, and the fight that comes out must be the one the tools have been
 * reporting all along. This is what makes the wiring believable: nothing about
 * accumulating in fragments changes the answer.
 */
describe("a captured fight accumulated payload by payload", () => {
  test.each(CAPTURED_FIGHTS.map((fight) => [fight.name, fight] as const))(
    "%s reads as one fight",
    (_name, fight) => {
      let session = composeEmptySession();
      for (const [at, payload] of getPayloads(fight).entries()) {
        session = composeNextSession(session, payload, fight.dump.calls[at]!.protocolMessages);
      }

      const reading = composeFightReading(session);
      expect(session.messages).toEqual(fight.dump.calls.flatMap((call) => call.protocolMessages));
      expect(reading.isFromFightStart).toBe(true);
      expect(reading.ourSide).not.toBeNull();

      // The roster rebuilt from fragments places everyone, which is the whole
      // point of merging: unplaced combatants would mean lost names.
      expect(reading.statistics.combatantIdsWithoutSide).toEqual([]);
      expect(reading.statistics.bySide.size).toBeGreaterThan(1);

      const landed = [...reading.statistics.bySide.values()].reduce(
        (total, side) => total + side.totals.dealtApplied,
        0,
      );
      expect(landed).toBeGreaterThan(0);
    },
  );
});
