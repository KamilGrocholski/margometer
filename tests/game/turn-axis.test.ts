/**
 * The turn axis, against the captures it was read from.
 *
 * Every claim here is a claim about somebody else's protocol, so each one is
 * re-measured on the material rather than asserted from a fixture. The one that
 * matters most is the count: before this file existed the add-on divided by 98
 * where the game had numbered 299, and nothing in the suite could tell.
 */

import { describe, expect, test } from "bun:test";
import { getIntegerFromText, getIntegerFromValue } from "@/libs/number.ts";
import {
  composeEmptyTurnAxis,
  composeNextTurnAxis,
  composeTurnCounts,
} from "@/src/game/turn-axis.ts";
import { CAPTURED_FIGHTS, type CapturedFight } from "@/tests/captured-fight-catalog.ts";

function composeAxisOfFight(fight: CapturedFight) {
  let axis = composeEmptyTurnAxis();
  for (const call of fight.dump.calls) axis = composeNextTurnAxis(axis, call.payload);
  return axis;
}

/** The prediction a payload carries, read the way the axis reads it. */
function getPrediction(payload: unknown): Map<number, number> | null {
  if (typeof payload !== "object" || payload === null) return null;
  const stated = (payload as Record<string, unknown>)["turns_warriors"];
  if (typeof stated !== "object" || stated === null) return null;
  const prediction = new Map<number, number>();
  for (const [key, value] of Object.entries(stated)) {
    const turn = getIntegerFromText(key);
    const combatantId = getIntegerFromValue(value);
    if (turn !== null && combatantId !== null) prediction.set(turn, combatantId);
  }
  return prediction.size === 0 ? null : prediction;
}

/**
 * The claim that lets `current` go unread.
 *
 * `turn-axis.ts` takes the turn from the prediction's least ordinal and never
 * looks at `current`, which is only safe while the two name the same combatant.
 * That is a claim about the game, so §7.5 makes it a guard rather than a sentence:
 * the day the game stops agreeing with itself, this fails instead of the numbers
 * quietly drifting.
 */
describe("the least ordinal and `current` are the same statement", () => {
  test("across every payload of every capture that states both", () => {
    let checked = 0;
    for (const fight of CAPTURED_FIGHTS) {
      for (const call of fight.dump.calls) {
        const prediction = getPrediction(call.payload);
        if (prediction === null) continue;
        const stated = getIntegerFromValue(
          (call.payload as Record<string, unknown>)["current"],
        );
        if (stated === null) continue;
        expect(prediction.get(Math.min(...prediction.keys()))).toBe(stated);
        checked += 1;
      }
    }
    // A loop over nothing is green and proves nothing (§9.2).
    expect(checked).toBeGreaterThan(0);
  });
});

describe("what a payload does to the axis", () => {
  const first = { turns_warriors: { "5": 11, "6": 22, "7": 11 }, current: 11 };

  test.each([[{}], [null], ["not a payload"], [{ current: 11 }], [{ turns_warriors: {} }]])(
    "%p states no turn and gives back the same axis",
    (payload) => {
      const axis = composeNextTurnAxis(composeEmptyTurnAxis(), first);
      expect(composeNextTurnAxis(axis, payload)).toBe(axis);
    },
  );

  test("a prediction that repeats what is already known gives back the same axis", () => {
    const axis = composeNextTurnAxis(composeEmptyTurnAxis(), first);
    expect(composeNextTurnAxis(axis, { turns_warriors: { "5": 11, "6": 22 } })).toBe(axis);
  });

  test("a prediction that moves the turn on does not", () => {
    const axis = composeNextTurnAxis(composeEmptyTurnAxis(), first);
    const moved = composeNextTurnAxis(axis, { turns_warriors: { "6": 22, "7": 11 } });

    expect(moved).not.toBe(axis);
    expect(moved.observed).toEqual({ firstTurn: 5, lastTurn: 6 });
  });

  /**
   * The freshest statement wins, which is the whole reason the ordinals between
   * two payloads can be filled in at all. Measured: 66 of 685 re-observations
   * revised an earlier one, so keeping the first would be keeping the stale one.
   */
  test("a later prediction overrules an earlier one about the same ordinal", () => {
    let axis = composeNextTurnAxis(composeEmptyTurnAxis(), first);
    axis = composeNextTurnAxis(axis, { turns_warriors: { "6": 22, "7": 33 } });

    expect(axis.actorByTurn.get(7)).toBe(33);
  });

  /**
   * An ordinal behind the span can only be a fight that opened without `init`, and
   * `init` is where a fight begins. Accepting it would let another fight's
   * combatants overwrite ordinals inside this span.
   */
  test("an ordinal behind the span moves nothing", () => {
    const axis = composeNextTurnAxis(composeEmptyTurnAxis(), {
      turns_warriors: { "40": 11, "41": 22 },
    });
    const back = composeNextTurnAxis(axis, { turns_warriors: { "1": 99, "2": 99 } });

    expect(back).toBe(axis);
    expect(back.actorByTurn.get(1)).toBeUndefined();
  });
});

describe("what the axis counts", () => {
  test("only the ordinals inside the span, never the forecast past it", () => {
    // The prediction reaches to 14; the fight was last seen at 6, and turns nobody
    // took are not turns anybody spent.
    let axis = composeNextTurnAxis(composeEmptyTurnAxis(), {
      turns_warriors: { "5": 11, "6": 22, "7": 11, "8": 22 },
    });
    axis = composeNextTurnAxis(axis, { turns_warriors: { "6": 22, "7": 11 } });
    const counts = composeTurnCounts(axis);

    expect(counts.fightTurns).toBe(2);
    expect([...counts.turnsByCombatantId]).toEqual([
      [11, 1],
      [22, 1],
    ]);
  });

  test("an ordinal nobody was named for is counted apart, not put on a row", () => {
    let axis = composeNextTurnAxis(composeEmptyTurnAxis(), { turns_warriors: { "1": 11 } });
    axis = composeNextTurnAxis(axis, { turns_warriors: { "4": 22 } });
    const counts = composeTurnCounts(axis);

    expect(counts.fightTurns).toBe(4);
    expect(counts.turnsWithoutActor).toBe(2);
    expect([...counts.turnsByCombatantId.values()].reduce((sum, one) => sum + one, 0)).toBe(2);
  });

  /**
   * One ordinal is a fight we watched for an instant, not a fight of one turn.
   * Returning 1 would make every rate equal its own total, which is the reading
   * this whole file replaced.
   */
  test("one observed ordinal is no divisor at all", () => {
    const axis = composeNextTurnAxis(composeEmptyTurnAxis(), { turns_warriors: { "1": 11 } });
    const counts = composeTurnCounts(axis);

    expect(counts.fightTurns).toBeNull();
    expect(counts.turnsByCombatantId.size).toBe(0);
    expect(counts.turnsWithoutActor).toBe(0);
  });

  test("nothing observed is no divisor either", () => {
    expect(composeTurnCounts(composeEmptyTurnAxis()).fightTurns).toBeNull();
  });
});

describe("the captures", () => {
  test.each(CAPTURED_FIGHTS)("$name adds up to its own span", (fight) => {
    const counts = composeTurnCounts(composeAxisOfFight(fight));
    if (counts.fightTurns === null) {
      expect(counts.turnsByCombatantId.size).toBe(0);
      return;
    }
    const named = [...counts.turnsByCombatantId.values()].reduce((sum, one) => sum + one, 0);
    expect(named + counts.turnsWithoutActor).toBe(counts.fightTurns);
  });

  /**
   * ⚠️ **The number the bug was.** Counting a turn whenever `current` named
   * somebody new gave 98 here; the game numbered 299, so every rate over the
   * fight's turns was 3.05× too high and the per-combatant counts — 2 for one
   * combatant the game gave 22 — made the ranking under the rate arbitrary.
   */
  test("the group fight ran 299 turns and three of them named nobody", () => {
    const fight = CAPTURED_FIGHTS.find((one) => one.name.includes("grupa-vs-hildur"));
    expect(fight).toBeDefined();
    const counts = composeTurnCounts(composeAxisOfFight(fight!));

    expect(counts.fightTurns).toBe(299);
    expect(counts.turnsWithoutActor).toBe(3);
    // Eleven combatants over 299 turns: the shape of a queue, not of a sample.
    expect(counts.turnsByCombatantId.size).toBe(11);
    expect(Math.min(...counts.turnsByCombatantId.values())).toBeGreaterThan(20);
  });

  /**
   * Both solo captures deliver the whole fight in one payload, so the game states
   * one ordinal and never another. The honest reading is that the turns are
   * unknown — which is what the panel then says instead of drawing a rate.
   */
  test.each(CAPTURED_FIGHTS.filter((one) => !one.name.includes("grupa-vs-hildur")))(
    "$name states one ordinal, so it has no rate",
    (fight) => {
      expect(composeTurnCounts(composeAxisOfFight(fight)).fightTurns).toBeNull();
    },
  );
});
