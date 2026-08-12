/**
 * The turn axis, against the captures it was read from.
 *
 * Every claim here is a claim about somebody else's protocol, so each one is
 * re-measured on the material rather than asserted from a fixture. Two failures
 * this file exists to catch, both paid for: the add-on once divided by 98 where
 * the game had numbered 299, and before that it read a run of messages as one turn
 * and halved everybody's count.
 */

import { describe, expect, test } from "bun:test";
import { getIntegerFromText, getIntegerFromValue } from "@/libs/number.ts";
import { composeRunActorIds, composeRunTurns } from "@/src/core/message-run.ts";
import {
  composeEmptyTurnAxis,
  composeNextTurnAxis,
  composeTurnCounts,
} from "@/src/game/turn-axis.ts";
import { CAPTURED_FIGHTS, type CapturedFight } from "@/tests/captured-fight-catalog.ts";

function composeAxisOfFight(fight: CapturedFight) {
  let axis = composeEmptyTurnAxis();
  for (const call of fight.dump.calls) {
    axis = composeNextTurnAxis(axis, call.payload, call.protocolMessages);
  }
  return axis;
}

/** The whole prediction a payload carries — read here only to prove nine tenths of it are ignored. */
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
 * The reading this file replaced: every entry of the forecast, freshest winning.
 *
 * Built here and nowhere else, because production code no longer contains one —
 * it exists so the two independent readings can be held against each other.
 */
function composeForecastActorByTurn(fight: CapturedFight): Map<number, number> {
  const actorByTurn = new Map<number, number>();
  let lastTurn: number | null = null;
  for (const call of fight.dump.calls) {
    const prediction = getPrediction(call.payload);
    if (prediction === null) continue;
    const least = Math.min(...prediction.keys());
    if (lastTurn !== null && least < lastTurn) continue;
    for (const [turn, actorId] of prediction) actorByTurn.set(turn, actorId);
    lastTurn = least;
  }
  return actorByTurn;
}

/** One message, in the grammar the protocol writes it in. */
const composeMessage = (actorId: number) => `${actorId}=100.00;0;step`;
const NOBODY = "0;0;txt=a line";

function getAttributed(counts: { turnsByCombatantId: ReadonlyMap<number, number> }): number {
  return [...counts.turnsByCombatantId.values()].reduce((sum, one) => sum + one, 0);
}

/**
 * The claim that lets `current` go unread, and it now carries more than it did.
 *
 * The axis takes the turn from the prediction's least ordinal and never looks at
 * `current`, which is only safe while the two name the same combatant — and the
 * closure check in `message-run.ts` compares the last run's actor against that
 * same entry, so a disagreement would stop numbering turns rather than merely
 * mislabel one. §7.5 makes a claim about the game a guard rather than a sentence.
 */
describe("the least ordinal and `current` are the same statement", () => {
  test("across every payload of every capture that states both", () => {
    let checked = 0;
    for (const fight of CAPTURED_FIGHTS) {
      for (const call of fight.dump.calls) {
        const prediction = getPrediction(call.payload);
        if (prediction === null) continue;
        const stated = getIntegerFromValue((call.payload as Record<string, unknown>)["current"]);
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
    "%p states no turn and brings no messages, so the axis is the same object",
    (payload) => {
      const axis = composeNextTurnAxis(composeEmptyTurnAxis(), first, []);
      expect(composeNextTurnAxis(axis, payload, [])).toBe(axis);
    },
  );

  test("a payload restating the turn already recorded gives back the same axis", () => {
    const axis = composeNextTurnAxis(composeEmptyTurnAxis(), first, []);
    expect(composeNextTurnAxis(axis, { turns_warriors: { "5": 11, "6": 22 } }, [])).toBe(axis);
  });

  test("a payload that moves the turn on does not", () => {
    const axis = composeNextTurnAxis(composeEmptyTurnAxis(), first, []);
    const moved = composeNextTurnAxis(axis, { turns_warriors: { "6": 22, "7": 11 } }, []);

    expect(moved).not.toBe(axis);
    expect(moved.observed).toEqual({ firstTurn: 5, lastTurn: 6 });
  });

  /**
   * ⚠️ **The guard for the whole change.** Nine of the prediction's ten entries
   * are a forecast of turns not yet taken, and this file used to credit combatants
   * from them. Nothing may reach a row without a message showing it happened, so a
   * payload whose look-ahead names three combatants must attribute none of them.
   */
  test("the nine ordinals the prediction forecasts reach nobody", () => {
    const axis = composeNextTurnAxis(
      composeEmptyTurnAxis(),
      { turns_warriors: { "5": 11, "6": 22, "7": 33, "8": 44 } },
      [],
    );

    expect([...axis.actorByTurn]).toEqual([]);
  });

  /**
   * An ordinal behind the span can only be a fight that opened without `init`, and
   * `init` is where a fight begins. Accepting it would let another fight's
   * combatants overwrite ordinals inside this span.
   */
  test("an ordinal behind the span moves nothing", () => {
    const axis = composeNextTurnAxis(
      composeEmptyTurnAxis(),
      { turns_warriors: { "40": 11, "41": 22 } },
      [],
    );
    const back = composeNextTurnAxis(axis, { turns_warriors: { "1": 99, "2": 99 } }, [composeMessage(99)]);

    expect(back).toBe(axis);
    expect(back.actorByTurn.get(1)).toBeUndefined();
  });
});

describe("what the messages number", () => {
  /** The axis after a first payload that states an ordinal and narrates nothing. */
  const composeOpened = (turn: number, actorId: number) =>
    composeNextTurnAxis(composeEmptyTurnAxis(), { turns_warriors: { [turn]: actorId } }, []);

  test("a run belongs to the turn that was in progress, not to the one now stated", () => {
    const axis = composeNextTurnAxis(composeOpened(5, 11), { turns_warriors: { "6": 22 } }, [
      composeMessage(11),
    ]);
    const counts = composeTurnCounts(axis);

    expect([...axis.actorByTurn]).toEqual([[5, 11]]);
    expect(counts.fightTurns).toBe(2);
    // Ordinal 6 has been stated but not yet narrated: it is nobody's until it is.
    expect(counts.turnsWithoutActor).toBe(1);
  });

  test("a turn split across two payloads is one turn, counted once", () => {
    let axis = composeOpened(5, 11);
    axis = composeNextTurnAxis(axis, { turns_warriors: { "6": 22 } }, [composeMessage(11), composeMessage(22)]);
    axis = composeNextTurnAxis(axis, { turns_warriors: { "7": 33 } }, [composeMessage(22), composeMessage(33)]);
    const counts = composeTurnCounts(axis);

    expect(counts.fightTurns).toBe(3);
    expect(getAttributed(counts)).toBe(3);
    expect([...counts.turnsByCombatantId].sort()).toEqual([
      [11, 1],
      [22, 1],
      [33, 1],
    ]);
  });

  test("a message naming nobody continues the run it follows rather than opening a turn", () => {
    const axis = composeNextTurnAxis(composeOpened(5, 11), { turns_warriors: { "6": 22 } }, [
      composeMessage(11),
      NOBODY,
      composeMessage(22),
    ]);

    expect([...axis.actorByTurn]).toEqual([
      [5, 11],
      [6, 22],
    ]);
  });

  /**
   * Runs and ordinals disagreeing is a finding, not something to average out. Only
   * the opening run keeps its number — the previous payload vouched for that one —
   * and the rest of the span stays nobody's.
   */
  test("a payload whose runs will not reconcile numbers only its opening run", () => {
    const axis = composeNextTurnAxis(composeOpened(5, 11), { turns_warriors: { "9": 22 } }, [
      composeMessage(11),
    ]);
    const counts = composeTurnCounts(axis);

    expect(axis.unclosedPayloads).toBe(1);
    expect([...axis.actorByTurn]).toEqual([[5, 11]]);
    expect(counts.fightTurns).toBe(5);
    expect(counts.turnsWithoutActor).toBe(4);
  });

  test("messages before any ordinal is stated are counted past the numbering", () => {
    const axis = composeNextTurnAxis(composeEmptyTurnAxis(), {}, [composeMessage(11), composeMessage(22)]);

    expect(axis.turnsPastTheNumbering).toBe(2);
    expect([...axis.actorByTurn]).toEqual([]);
  });

  test("a payload stating no ordinal carries the turn in progress and no more", () => {
    const axis = composeNextTurnAxis(composeOpened(5, 11), { endBattle: 1 }, [
      composeMessage(11),
      composeMessage(22),
      composeMessage(33),
    ]);

    expect([...axis.actorByTurn]).toEqual([[5, 11]]);
    expect(axis.turnsPastTheNumbering).toBe(2);
  });

  /**
   * One ordinal is a fight we watched for an instant, not a fight of one turn.
   * Returning 1 would make every rate equal its own total.
   */
  test("one observed ordinal is no divisor at all", () => {
    const counts = composeTurnCounts(composeOpened(1, 11));

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
    expect(getAttributed(counts) + counts.turnsWithoutActor).toBe(counts.fightTurns);
  });

  /**
   * ⚠️ **The number the bug was.** Counting a turn whenever the acting combatant
   * changed from one payload to the next gave 98 here; the game numbered 299, so
   * every rate over the fight's turns was 3.05× too high.
   *
   * Kept through the move off the forecast, and the one figure that moved is the
   * point of the move: the turns nobody can be seen taking went 3 → 12, because a
   * forecast names somebody for a turn nothing shows happening. Twelve of them are
   * one gap between payloads wider than the prediction reaches.
   */
  test("the group fight ran 299 turns and twelve of them show nobody", () => {
    // Matched whole, not by `includes`: later captures are named after the same
    // boss, and a substring would have handed this assertion whichever of them
    // sorted first. It passed on luck for exactly as long as there was one.
    const fight = CAPTURED_FIGHTS.find((one) => one.name === "2026-08-06-tempest-grupa-vs-hildur");
    expect(fight).toBeDefined();
    const counts = composeTurnCounts(composeAxisOfFight(fight!));

    expect(counts.fightTurns).toBe(299);
    expect(counts.turnsWithoutActor).toBe(12);
    // Eleven combatants over 299 turns: the shape of a queue, not of a sample.
    expect(counts.turnsByCombatantId.size).toBe(11);
    expect(Math.min(...counts.turnsByCombatantId.values())).toBeGreaterThan(20);
  });

  test.each(CAPTURED_FIGHTS)("$name attributes nothing outside its own span", (fight) => {
    const axis = composeAxisOfFight(fight);
    const { observed } = axis;
    for (const turn of axis.actorByTurn.keys()) {
      expect(turn).toBeGreaterThanOrEqual(observed?.firstTurn ?? turn);
      expect(turn).toBeLessThanOrEqual(observed?.lastTurn ?? turn);
    }
  });

  /**
   * Recomputed payload by payload rather than read off the axis, because the axis
   * merges silently: a turn narrated across a payload boundary is written twice,
   * and if the two halves ever named different combatants the map would keep the
   * second without saying so. Measured, that happens 139 times and never disagrees.
   */
  test.each(CAPTURED_FIGHTS)("$name never gives one ordinal two owners", (fight) => {
    const owners = new Map<number, number>();
    let rewritten = 0;
    let turnInProgress: number | null = null;

    for (const call of fight.dump.calls) {
      const prediction = getPrediction(call.payload);
      const least = prediction === null ? null : Math.min(...prediction.keys());
      const stated =
        least === null ? null : { turn: least, actorId: prediction!.get(least)! };
      const numbering = composeRunTurns(
        composeRunActorIds(call.protocolMessages),
        turnInProgress,
        stated,
      );
      for (const [turn, actorId] of numbering.actorByTurn) {
        const held = owners.get(turn);
        if (held !== undefined) {
          expect(held).toBe(actorId);
          rewritten += 1;
        }
        owners.set(turn, actorId);
      }
      if (least !== null) turnInProgress = least;
    }

    expect(rewritten).toBeGreaterThanOrEqual(0);
  });
});

/**
 * How much of what the game numbered the messages actually account for.
 *
 * ⚠️ **Corpus-wide rather than per capture, and deliberately.** A table of
 * per-fight numbers makes every new recording a fixture edit, and a wrong entry in
 * it looks exactly like a right one. A threshold over the whole material moves
 * only when the reading changes.
 *
 * Both numbers are measured, and both go red under the two mutations that matter:
 * letting a message which names nobody open its own run gives 83.5% and 37
 * unreconciled payloads, and dropping the actor comparison from the closure check
 * gives 74.9% and 140.
 */
describe("the corpus", () => {
  const totals = CAPTURED_FIGHTS.reduce(
    (sum, fight) => {
      const axis = composeAxisOfFight(fight);
      const counts = composeTurnCounts(axis);
      return {
        span: sum.span + (counts.fightTurns ?? 0),
        attributed: sum.attributed + getAttributed(counts),
        unclosed: sum.unclosed + axis.unclosedPayloads,
      };
    },
    { span: 0, attributed: 0, unclosed: 0 },
  );

  test("the messages account for nearly every turn the game numbered", () => {
    expect(totals.span).toBeGreaterThan(0);
    // Measured 1202 of 1228.
    expect(totals.attributed / totals.span).toBeGreaterThan(0.95);
  });

  test("almost no payload fails to reconcile with the ordinal it states", () => {
    // Measured 3.
    expect(totals.unclosed).toBeLessThanOrEqual(5);
  });

  /**
   * ⚠️ **The two readings held against each other**, because neither has ground
   * truth on a turn that went by between two payloads and this is the only check
   * available there. It catches a drift in either direction: a segmentation that
   * starts naming the wrong combatant, or the forecast quietly coming back.
   *
   * Where the game *does* state the truth — the 374 ordinals it names through
   * `current` — both readings are right every time and never disagree, so the
   * disagreement counted here is entirely about turns nobody can check. It sits at
   * 8.8%, and it concentrates where the forecast has expired: 3.2% across payloads
   * covering six turns or fewer, 18% across wider ones, while the forecast
   * contradicts *itself* 21–28% that far ahead. That is why the threshold is a
   * cross-check and not a claim that either side is the standard.
   */
  test("the two independent readings mostly name the same combatant", () => {
    let agreed = 0;
    let disagreed = 0;
    for (const fight of CAPTURED_FIGHTS) {
      const axis = composeAxisOfFight(fight);
      const forecast = composeForecastActorByTurn(fight);
      for (const [turn, actorId] of axis.actorByTurn) {
        const predicted = forecast.get(turn);
        if (predicted === undefined) continue;
        if (predicted === actorId) agreed += 1;
        else disagreed += 1;
      }
    }

    expect(agreed + disagreed).toBeGreaterThan(0);
    // Measured 91.2%.
    expect(agreed / (agreed + disagreed)).toBeGreaterThan(0.88);
  });
});

/**
 * What every capture's turn count has to be, computed from the payloads by the
 * plainest reading there is: the game numbers the turn being taken, so the fight
 * ran from the first ordinal it named to the last, and a fight it numbered only
 * once has no span at all.
 *
 * ⚠️ **This replaced a test that pinned the answer to a capture's name** — every
 * fight but `grupa-vs-hildur` was asserted to have no rate. That was true while
 * the other two captures were solo fights delivered in a single payload, and it
 * stopped being true the moment a second group fight arrived under another name.
 * A name is not a property of the material, and the test would have failed for
 * the one reason a test must not: the file was called something else.
 */
describe.each(CAPTURED_FIGHTS)("$name", (fight) => {
  const statedTurns = fight.dump.calls
    .map((call) => getPrediction(call.payload))
    .filter((prediction): prediction is Map<number, number> => prediction !== null)
    .map((prediction) => Math.min(...prediction.keys()));

  /**
   * The claim `composeNextTurnAxis` rests on when it refuses an ordinal behind the
   * span, and the one `message-run.ts` rests on when it numbers a payload's runs
   * forward from the turn in progress: the game never renumbers backwards.
   */
  test("numbers its turns without ever stepping back", () => {
    expect(statedTurns.length).toBeGreaterThan(0);
    expect([...statedTurns].sort((one, other) => one - other)).toEqual(statedTurns);
  });

  test("runs from the first ordinal the game named to the last", () => {
    const first = statedTurns[0]!;
    const last = statedTurns[statedTurns.length - 1]!;

    expect(composeTurnCounts(composeAxisOfFight(fight)).fightTurns).toBe(
      first === last ? null : last - first + 1,
    );
  });
});
