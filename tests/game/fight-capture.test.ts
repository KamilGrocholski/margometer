/**
 * What a recording keeps, and what it refuses to keep.
 *
 * The material this produces is meant to stand beside `tests/captured-fights/`,
 * so the tests are about *fidelity*: what the game handed over is what reaches
 * the file, a later mutation of the game's own object cannot reach back into it,
 * and the thinning drops only calls that carry nothing a kept call does not.
 *
 * The loop closing this path — a real capture replayed through the add-on and the
 * recording read back by `tools/fight-dump-parser.ts` — is in
 * `tests/game/engine-attachment.test.ts`, where the whole add-on is driven.
 */

import { describe, expect, test } from "bun:test";
import { getValueFromJsonText } from "@/libs/json.ts";
import {
  composeCaptureFileName,
  composeCaptureText,
  composeEmptyCapture,
  composeNextCapture,
  composeSnapshotFromBattle,
  type CaptureEnvironment,
  type FightCapture,
} from "@/src/game/fight-capture.ts";

const ENVIRONMENT: CaptureEnvironment = {
  getWorld: () => "tempest",
  getGameBuild: () => "1786441768914",
  getCapturedAt: () => "2026-08-11T12:00:00.000Z",
};

/** One call through the collector, with nothing in it worth arguing about. */
function composeCaptureAfter(
  capture: FightCapture,
  payload: unknown,
  messages: readonly string[] = [],
): FightCapture {
  return composeNextCapture(capture, payload, messages, [], []);
}

describe("the combatants a running fight is holding", () => {
  const combatant = {
    id: 482845,
    name: "Someone",
    team: 1,
    prof: "h",
    lvl: 40,
    hp: { max: 5815, cur: 4000, hpp: 68.79 },
    mana: 0,
    energy: 112,
    ac: { cur: 239, bonus: 0 },
    // Only the fields the captures carry leave the game; this one must not.
    $: { aDomNode: true },
  };

  test("are read from the list the client keeps them in", () => {
    const snapshot = composeSnapshotFromBattle({ warriorsList: { "482845": combatant } });

    expect(snapshot).toEqual([
      {
        id: 482845,
        name: "Someone",
        team: 1,
        prof: "h",
        lvl: 40,
        hp: { max: 5815, cur: 4000, hpp: 68.79 },
        mana: 0,
        energy: 112,
        ac: { cur: 239, bonus: 0 },
      },
    ]);
  });

  test("come from `warriors` when the first list has nobody named", () => {
    const snapshot = composeSnapshotFromBattle({
      warriorsList: { "1": { name: "" } },
      warriors: { "482845": combatant },
    });

    expect(snapshot.map((one) => one.id)).toEqual([482845]);
  });

  test("are nobody at all when the battle object carries neither", () => {
    expect(composeSnapshotFromBattle({})).toEqual([]);
  });

  /**
   * ⚠️ **The one that costs a wrong number if it is missed.** `hp` is a live
   * object the game goes on mutating, so a snapshot holding the reference would
   * show the state *after* the call as the state before it — and the whole point
   * of a before-snapshot is that it is the state before.
   */
  test("hold copies of the health the game keeps mutating", () => {
    const live = { max: 100, cur: 100, hpp: 100 };
    const snapshot = composeSnapshotFromBattle({
      warriorsList: { "7": { id: 7, name: "Someone", hp: live } },
    });

    live.cur = 40;
    live.hpp = 40;

    expect(snapshot[0]?.hp).toEqual({ max: 100, cur: 100, hpp: 100 });
  });
});

describe("what a recording keeps", () => {
  test("a fight starting clears whatever stood before it", () => {
    const first = composeCaptureAfter(composeEmptyCapture(), { m: [] }, ["a message"]);
    expect(first.calls.length).toBe(1);

    const second = composeCaptureAfter(first, { init: "1" });
    expect(second.calls.length).toBe(1);
    expect(second.droppedCalls).toBe(0);
  });

  // Evidence, without exception: a call carrying messages is never thinned away,
  // however often its shape and its state have been seen.
  test("every call carrying messages, however familiar it looks", () => {
    let capture = composeCaptureAfter(composeEmptyCapture(), { m: [] }, ["one"]);
    capture = composeCaptureAfter(capture, { m: [] }, ["two"]);
    capture = composeCaptureAfter(capture, { m: [] }, ["three"]);

    expect(capture.calls.map((call) => call.messages)).toEqual([["one"], ["two"], ["three"]]);
    expect(capture.droppedCalls).toBe(0);
  });

  test("a call whose shape and state were both seen before is dropped", () => {
    let capture = composeCaptureAfter(composeEmptyCapture(), { move: -1, endBattle: 1 });
    capture = composeCaptureAfter(capture, { move: -1, endBattle: 1 });
    capture = composeCaptureAfter(capture, { move: -1, endBattle: 1 });

    expect(capture.calls.length).toBe(1);
    expect(capture.droppedCalls).toBe(2);
  });

  // The shape is the set of keys, so a payload carrying `endBattle` for the only
  // time in a fight survives even with nothing else to say for itself.
  test("a call introducing a key nobody has seen is kept", () => {
    let capture = composeCaptureAfter(composeEmptyCapture(), { move: -1 });
    capture = composeCaptureAfter(capture, { move: -1, endBattle: 1 });

    expect(capture.calls.length).toBe(2);
  });

  test("a call showing health nobody has seen is kept", () => {
    const empty = composeEmptyCapture();
    const first = composeNextCapture(empty, { move: -1 }, [], [], [composeCombatantAt(100)]);
    const second = composeNextCapture(first, { move: -1 }, [], [], [composeCombatantAt(40)]);

    expect(second.calls.length).toBe(2);
  });

  /**
   * ⚠️ **The game mutates the object it handed us after we return.** Holding the
   * reference would mean a recording where every call shows the last call's
   * payload — material that looks like evidence and is not.
   */
  test("the payload is copied, not held by reference", () => {
    const payload: Record<string, unknown> = { m: ["a message"], move: 1 };
    const capture = composeNextCapture(composeEmptyCapture(), payload, ["a message"], [], []);

    payload["move"] = 99;
    payload["endBattle"] = 1;

    expect(capture.calls[0]?.payload).toEqual({ m: ["a message"], move: 1 });
  });

  /**
   * Stopping, not dropping the oldest, and the order is the decision: a recording
   * without the start of the fight is useless, one without the end still carries
   * material.
   */
  test("the ceiling stops collecting rather than losing the beginning", () => {
    let capture = composeEmptyCapture();
    for (let call = 0; call < 2100; call += 1) {
      capture = composeCaptureAfter(capture, { m: [] }, [`message ${call}`]);
    }

    expect(capture.isFull).toBe(true);
    expect(capture.calls.length).toBe(2000);
    expect(capture.calls[0]?.messages).toEqual(["message 0"]);
    expect(capture.droppedCalls).toBe(100);
  });
});

function composeCombatantAt(current: number): {
  id: number;
  name: string;
  team: number;
  prof: string;
  lvl: number;
  hp: { max: number; cur: number; hpp: number };
  mana: null;
  energy: null;
  ac: null;
} {
  return {
    id: 7,
    name: "Someone",
    team: 1,
    prof: "h",
    lvl: 40,
    hp: { max: 100, cur: current, hpp: current },
    mana: null,
    energy: null,
    ac: null,
  };
}

describe("the recording as a file", () => {
  test("carries the field names the parser reads, and the build it came from", () => {
    const capture = composeCaptureAfter(composeEmptyCapture(), { m: ["a message"] }, ["a message"]);
    const written = composeCaptureText(capture, ENVIRONMENT);

    expect(getValueFromJsonText(written).value).toEqual({
      wersja: 1,
      przy: "2026-08-11T12:00:00.000Z",
      swiat: "tempest",
      build: "1786441768914",
      pominietych: 0,
      urwany: false,
      wpisy: [
        {
          nr: 0,
          ladunek: { m: ["a message"] },
          komunikaty: ["a message"],
          wojownicyPrzed: [],
          wojownicyPo: [],
        },
      ],
    });
  });

  /**
   * The sentences the client composed are not collected at all. `NOTICE.md` names
   * the 38 in the older capture as an exception surviving only because cutting
   * them would mean editing evidence; material that never carried them needs no
   * exception.
   */
  test("carries no field for the sentences the game writes", () => {
    const capture = composeCaptureAfter(composeEmptyCapture(), { m: [] }, ["a message"]);

    expect(composeCaptureText(capture, ENVIRONMENT)).not.toContain("render");
  });

  // Null rather than a stand-in reading like a build: material from the game
  // without the client's version is not comparable, and the intake tool says so.
  test("states a missing build as nothing, not as a plausible number", () => {
    const written = composeCaptureText(composeEmptyCapture(), {
      ...ENVIRONMENT,
      getGameBuild: () => null,
    });

    const read = getValueFromJsonText(written).value as { build: unknown };
    expect(read.build).toBe(null);
  });

  test("is named so that two recordings never collide", () => {
    expect(composeCaptureFileName(ENVIRONMENT)).toBe(
      "margometer-tempest-2026-08-11T12-00-00-000Z.json",
    );
  });
});
