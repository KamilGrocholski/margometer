/**
 * Which turn a stretch of messages narrates.
 *
 * The protocol has no turn boundary in it. Measured across all seven captures —
 * 2631 messages, 81 distinct keys, against the 236 the client knows — no key
 * names a turn, a round, an end or a next: `step`, the only key shaped like one,
 * occurs 64 times against 1228 turns, 23 of them in a fight the game numbers over
 * 283, and `2026-08-11-tempest-tancerz-vs-wermont` runs start to finish without a
 * single one. So a turn cannot be recognised by what a message says.
 *
 * What does mark one is **who is speaking**: the consecutive messages one
 * combatant is the actor of are one turn's narration — a **run**. A message
 * naming nobody continues the run it follows rather than opening one, which is a
 * measurement and not a convenience: giving it a run of its own attributes 1025
 * of 1228 ordinals and leaves 37 payloads unreconciled, continuing the run
 * attributes 1202 and leaves 3. The mechanism is a mass stun in
 * `2026-08-12-tempest-grupa-vs-draugr-2` call 37 — regeneration tick, `0;0` line,
 * next combatant's tick, `0;0` line, thirteen times over — where the line marks
 * the turn that just happened rather than a turn of its own.
 *
 * ⚠️ **Runs are numbered, never counted.** A run count is not a turn count and
 * this was paid for: a combatant may take two turns in a row, which is one run,
 * and the previous incarnation of this project counted runs as turns and read
 * eight attacks as four turns — every rate exactly doubled. The ordinals the game
 * states are what number these, and where they refuse to reconcile the turns go
 * unnumbered rather than merged.
 */

import {
  parseProtocolMessage,
  ProtocolMessageFormatError,
} from "@/src/core/protocol-message.ts";

/** An ordinal the game stated, and who it says acts on it. */
export type TurnStatement = {
  turn: number;
  actorId: number;
};

export type RunNumbering = {
  /** Who acted on each ordinal these runs narrate. */
  actorByTurn: ReadonlyMap<number, number>;
  /**
   * Whether the runs reconciled with the ordinal the payload states.
   *
   * False is a finding rather than an error: somebody acted more or fewer times
   * than the ordinals account for, so only the run the previous payload vouched
   * for keeps a number. Measured, 3 payloads of 379 carrying messages.
   */
  isClosed: boolean;
  /**
   * Runs no ordinal numbers — somebody acted where nothing counts the turn.
   *
   * Kept apart from every total rather than folded in, the way the glossary keeps
   * `unattributed` and `unaccounted` apart: a turn with nobody in it and somebody
   * with no turn are two different gaps and only one of them is a divisor.
   */
  runsPastTheNumbering: number;
};

/**
 * The actor of each message, or null where the grammar failed.
 *
 * A message that will not parse is not a turn boundary — it is a message we
 * cannot read, and the decoder reports it as one. Treating it as a boundary would
 * turn a reading failure into an extra turn, which lowers every rate that divides
 * by turns while looking exactly like a measurement.
 */
function getActorId(message: string): number | null {
  try {
    return parseProtocolMessage(message).actor?.combatantId ?? null;
  } catch (error) {
    if (error instanceof ProtocolMessageFormatError) return null;
    throw error;
  }
}

/**
 * The runs these messages fall into, as the actor of each — null for a run that
 * opens on a message naming nobody, which can only happen when there is no run
 * for it to continue.
 */
export function composeRunActorIds(messages: readonly string[]): readonly (number | null)[] {
  const runs: (number | null)[] = [];
  for (const message of messages) {
    const actorId = getActorId(message);
    if (actorId === null) {
      if (runs.length > 0) continue;
      runs.push(null);
      continue;
    }
    if (runs[runs.length - 1] !== actorId) runs.push(actorId);
  }
  return runs;
}

/**
 * The runs numbered against the ordinals a payload accounts for.
 *
 * `turnInProgress` is the ordinal the **previous** payload stated, and that is
 * not an off-by-one: measured 367/367, the first message of a payload is spoken
 * by the combatant the previous payload named as acting. So a payload narrates
 * the turns from the one that was in progress up to the one it now states.
 *
 * The closure check is what breaks the tie the runs cannot break on their own.
 * The last run either belongs to the turn the payload states — its actor is the
 * one that ordinal names, the turn having only begun — or to the turn before it.
 * Either way the arithmetic has exactly one right answer, and when it does not
 * come out, the runs and the ordinals disagree about how many turns went by.
 */
export function composeRunTurns(
  runActorIds: readonly (number | null)[],
  turnInProgress: number | null,
  stated: TurnStatement | null,
): RunNumbering {
  if (runActorIds.length === 0) {
    return { actorByTurn: new Map(), isClosed: true, runsPastTheNumbering: 0 };
  }
  // Nothing has stated an ordinal yet, so there is no axis to hang these on.
  if (turnInProgress === null) {
    return { actorByTurn: new Map(), isClosed: true, runsPastTheNumbering: runActorIds.length };
  }

  const firstActorId = runActorIds[0] ?? null;
  const composeOpeningTurn = (): ReadonlyMap<number, number> =>
    firstActorId === null ? new Map() : new Map([[turnInProgress, firstActorId]]);

  // A payload stating no ordinal accounts for no turn but the one already in
  // progress: the fight ended, or it was never numbered. Both solo captures
  // deliver their whole fight this way.
  if (stated === null) {
    const actorByTurn = composeOpeningTurn();
    return {
      actorByTurn,
      isClosed: true,
      runsPastTheNumbering: runActorIds.length - actorByTurn.size,
    };
  }

  const lastActorId = runActorIds[runActorIds.length - 1] ?? null;
  const lastOrdinal = turnInProgress + runActorIds.length - 1;
  const expected = lastActorId === stated.actorId ? stated.turn : stated.turn - 1;
  if (lastOrdinal !== expected) {
    // Only the opening run keeps its number: the previous payload stated who acts
    // on that ordinal, so it is the one thing here the runs did not have to prove.
    return { actorByTurn: composeOpeningTurn(), isClosed: false, runsPastTheNumbering: 0 };
  }

  const actorByTurn = new Map<number, number>();
  runActorIds.forEach((actorId, index) => {
    if (actorId !== null) actorByTurn.set(turnInProgress + index, actorId);
  });
  return { actorByTurn, isClosed: true, runsPastTheNumbering: 0 };
}
