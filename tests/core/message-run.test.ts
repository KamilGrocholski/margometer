/**
 * How messages fall into runs, and what numbers a run.
 *
 * The arithmetic lives here; whether it holds against real fights is
 * `tests/game/turn-axis.test.ts`, which measures it on the captures. Both are
 * needed: this file says what the rule is, that one says the rule is true of the
 * game.
 */

import { describe, expect, test } from "bun:test";
import {
  composeRunActorIds,
  composeRunTurns,
  type TurnStatement,
} from "@/src/core/message-run.ts";

const composeMessage = (actorId: number) => `${actorId}=100.00;0;step`;
const NOBODY = "0;0;txt=a line";
const UNREADABLE = "not a message at all";

describe("which messages are one run", () => {
  test("consecutive messages of one combatant are one run", () => {
    expect(composeRunActorIds([composeMessage(11), composeMessage(11), composeMessage(11)])).toEqual([11]);
  });

  test("the actor changing opens the next run", () => {
    expect(composeRunActorIds([composeMessage(11), composeMessage(22), composeMessage(11)])).toEqual([11, 22, 11]);
  });

  /**
   * Measured across the corpus: giving this its own run attributes 1025 of 1228
   * ordinals and leaves 37 payloads unreconciled, against 1202 and 3 for
   * continuing. It marks the turn that just happened rather than a turn of its own.
   */
  test("a message naming nobody continues the run it follows", () => {
    expect(composeRunActorIds([composeMessage(11), NOBODY, composeMessage(22)])).toEqual([11, 22]);
    expect(composeRunActorIds([composeMessage(11), NOBODY, composeMessage(11)])).toEqual([11]);
  });

  /**
   * A message we cannot read is a reading failure, not a turn. Opening a run on it
   * would add a turn to the divisor and lower every rate, which looks exactly like
   * a measurement.
   */
  test("a message whose grammar fails does the same", () => {
    expect(composeRunActorIds([composeMessage(11), UNREADABLE, composeMessage(11)])).toEqual([11]);
  });

  test("a run that opens on a message naming nobody has no actor", () => {
    expect(composeRunActorIds([NOBODY, composeMessage(11)])).toEqual([null, 11]);
  });

  test("no messages are no runs", () => {
    expect(composeRunActorIds([])).toEqual([]);
  });
});

describe("what numbers a run", () => {
  const inProgress = 5;
  const composeStatement = (turn: number, actorId: number): TurnStatement => ({ turn, actorId });

  /**
   * The turn in progress is the ordinal the **previous** payload stated, and that
   * is not an off-by-one: measured 367/367, a payload's first message is spoken by
   * the combatant the previous payload named as acting.
   */
  test("runs number forward from the turn in progress", () => {
    const numbering = composeRunTurns([11, 22, 33], inProgress, composeStatement(7, 33));

    expect(numbering.isClosed).toBe(true);
    expect([...numbering.actorByTurn]).toEqual([
      [5, 11],
      [6, 22],
      [7, 33],
    ]);
  });

  test("the last run belongs to the turn before the stated one when somebody else acts next", () => {
    const numbering = composeRunTurns([11, 22], inProgress, composeStatement(7, 44));

    expect(numbering.isClosed).toBe(true);
    expect([...numbering.actorByTurn]).toEqual([
      [5, 11],
      [6, 22],
    ]);
  });

  /**
   * The trailing run and the next payload's opening run are the same turn seen
   * twice, so both take one ordinal and it counts once. Dropping the trailing run
   * instead spells the same fact and loses the check that catches a disagreement.
   */
  test("a turn narrated across two payloads takes one ordinal from each side", () => {
    const first = composeRunTurns([11, 22], inProgress, composeStatement(6, 22));
    const second = composeRunTurns([22, 33], 6, composeStatement(7, 33));

    expect(first.actorByTurn.get(6)).toBe(22);
    expect(second.actorByTurn.get(6)).toBe(22);
  });

  test("a run naming nobody takes no ordinal", () => {
    const numbering = composeRunTurns([null, 11], inProgress, composeStatement(6, 11));

    expect([...numbering.actorByTurn]).toEqual([[6, 11]]);
  });

  /**
   * Runs and ordinals disagreeing about how many turns went by is a finding. Only
   * the opening run keeps its number, because the previous payload vouched for
   * that one and nothing vouches for the rest.
   */
  test("runs that will not reconcile number only the opening one", () => {
    const numbering = composeRunTurns([11], inProgress, composeStatement(9, 22));

    expect(numbering.isClosed).toBe(false);
    expect([...numbering.actorByTurn]).toEqual([[5, 11]]);
  });

  test("nothing is numbered before an ordinal has been stated", () => {
    const numbering = composeRunTurns([11, 22], null, composeStatement(6, 22));

    expect([...numbering.actorByTurn]).toEqual([]);
    expect(numbering.runsPastTheNumbering).toBe(2);
  });

  /**
   * A payload stating no ordinal accounts for no turn but the one already in
   * progress. Both solo captures deliver their whole fight this way, which is why
   * the rest is carried rather than numbered.
   */
  test("a payload stating no ordinal carries the turn in progress and no more", () => {
    const numbering = composeRunTurns([11, 22, 33], inProgress, null);

    expect([...numbering.actorByTurn]).toEqual([[5, 11]]);
    expect(numbering.runsPastTheNumbering).toBe(2);
  });

  test("no runs number nothing and leave nothing over", () => {
    const numbering = composeRunTurns([], inProgress, composeStatement(6, 22));

    expect([...numbering.actorByTurn]).toEqual([]);
    expect(numbering.runsPastTheNumbering).toBe(0);
    expect(numbering.isClosed).toBe(true);
  });
});
