/**
 * The fight's turn axis: the ordinals the game numbers, and who took each.
 *
 * A turn-based fight has no seconds to divide by, so "per turn" is the only rate
 * that means anything here — and the add-on used to count its own turns, by
 * watching the acting combatant change from one payload to the next, which counts
 * **payloads that happened to arrive**. Measured on
 * `2026-08-06-tempest-grupa-vs-hildur`: 98 where the game numbered 299, so every
 * rate was 3.05× too high.
 *
 * **Two questions, two sources, and neither of them is a forecast.**
 *
 * *How many turns?* The envelope's `turns_warriors` is the client's own turn
 * prediction — `updateTurnPredictions(turns)`, production build 1786514810315 and
 * development build 1781609507010 — a map of ordinal to combatant id, ten wide.
 * Only its **least entry** is read here, and that entry is a statement rather than
 * a forecast: it is the turn being taken, it equals the envelope's `current` in
 * 374 of 374 payloads, and it rises strictly, never once stepping back across all
 * 367 transitions in the material. The other nine entries are a forecast of turns
 * not yet taken and are **never read** — a turn that may never happen cannot count
 * for anybody.
 *
 * *Who took them?* The messages, in `message-run.ts`. That is the half this file
 * used to take from the forecast, and taking it from the material instead is what
 * makes a per-combatant turn a measurement. Measured: 1202 of the corpus's 1228
 * ordinals are attributed this way, and three of the seven captures reach every
 * ordinal they state.
 *
 * ⚠️ **What is left over is carried, never rounded away.** An ordinal no run
 * filled reaches nobody's row, and somebody who acted where no ordinal counts it
 * reaches no total at all. Both are visible in `tools/fight-report.ts`.
 */

import { getIntegerFromText, getIntegerFromValue } from "@/libs/number.ts";
import {
  composeRunActorIds,
  composeRunTurns,
  type TurnStatement,
} from "@/src/core/message-run.ts";

export type TurnAxis = {
  /**
   * The span of ordinals this fight has stated, or null before it has stated any.
   *
   * One nullable pair rather than two loose fields: they are set together and
   * meaningless apart, which is an invariant §9.5 puts in the type instead of
   * leaving to every caller to remember.
   */
  observed: { firstTurn: number; lastTurn: number } | null;
  /** Who the messages show acting on each ordinal. */
  actorByTurn: ReadonlyMap<number, number>;
  /** Runs no ordinal numbered — somebody acted, nothing counts the turn. */
  turnsPastTheNumbering: number;
  /** Payloads whose runs would not reconcile with the ordinal they state. */
  unclosedPayloads: number;
};

export type TurnCounts = {
  /**
   * How many turns the fight ran, as the span of ordinals actually stated.
   *
   * **Null where the game never numbered more than one**, which both solo captures
   * do — they deliver the whole fight in a single payload. Null travels rather
   * than becoming 1, because a rate over one turn equals its own total and would
   * read as a measurement (§9.5).
   */
  fightTurns: number | null;
  /** Empty whenever `fightTurns` is null: one turn is not a count of anybody's. */
  turnsByCombatantId: ReadonlyMap<number, number>;
  /**
   * Ordinals inside the span that no run filled.
   *
   * Three things land here and the panel cannot tell them apart: a gap between
   * payloads wider than the turns they narrate, a turn forfeited with nothing said
   * about it, and a payload whose runs refused to reconcile. Measured, 26 across
   * the whole corpus. They are counted here and never added to a row: a turn
   * nobody was seen taking is not a turn somebody took.
   */
  turnsWithoutActor: number;
};

export function composeEmptyTurnAxis(): TurnAxis {
  return {
    observed: null,
    actorByTurn: new Map(),
    turnsPastTheNumbering: 0,
    unclosedPayloads: 0,
  };
}

/**
 * The turn this payload states, and who it says is taking it.
 *
 * The least ordinal only. Reading the rest would be reading the forecast, which
 * is the whole thing this file stopped doing.
 */
function getStatedTurn(payload: unknown): TurnStatement | null {
  if (typeof payload !== "object" || payload === null) return null;
  const stated = (payload as Record<string, unknown>)["turns_warriors"];
  if (typeof stated !== "object" || stated === null) return null;

  let statement: TurnStatement | null = null;
  for (const [key, value] of Object.entries(stated)) {
    const turn = getIntegerFromText(key);
    const actorId = getIntegerFromValue(value);
    if (turn === null || actorId === null) continue;
    if (statement === null || turn < statement.turn) statement = { turn, actorId };
  }
  return statement;
}

/**
 * The axis after one more payload and the messages it brought.
 *
 * ⚠️ **Hands back the identical object when the payload moves nothing.** The
 * caller redraws on identity (`battle-session.ts`), and the game calls the engine
 * far more often than a fight has turns — a step, a chat line, a window opening.
 * A payload with no messages that states the ordinal already recorded moves
 * nothing, and that is most of them.
 */
export function composeNextTurnAxis(
  axis: TurnAxis,
  payload: unknown,
  messages: readonly string[],
): TurnAxis {
  const stated = getStatedTurn(payload);

  /**
   * An ordinal behind the span moves nothing at all.
   *
   * It can only mean a fight that opened without us seeing `init` — and `init` is
   * where a fight begins (`battle-session.ts`), so treating this as a second fight
   * boundary would put that decision in two places. Accepting it instead would be
   * worse: another fight's combatants would be written over ordinals inside this
   * span. Never observed across the material, so it gets the handling that cannot
   * be wrong rather than the one that guesses.
   */
  if (stated !== null && axis.observed !== null && stated.turn < axis.observed.lastTurn) {
    return axis;
  }

  // The ordinal the previous payload stated: what this payload's first messages
  // are still narrating (`message-run.ts`).
  const turnInProgress = axis.observed?.lastTurn ?? null;
  const numbering = composeRunTurns(composeRunActorIds(messages), turnInProgress, stated);

  const known = new Map(axis.actorByTurn);
  let moved = false;
  for (const [turn, actorId] of numbering.actorByTurn) {
    if (known.get(turn) === actorId) continue;
    known.set(turn, actorId);
    moved = true;
  }

  const turnsPastTheNumbering = axis.turnsPastTheNumbering + numbering.runsPastTheNumbering;
  const unclosedPayloads = axis.unclosedPayloads + (numbering.isClosed ? 0 : 1);
  const spanMoved = stated !== null && stated.turn !== axis.observed?.lastTurn;
  if (
    !moved &&
    !spanMoved &&
    turnsPastTheNumbering === axis.turnsPastTheNumbering &&
    unclosedPayloads === axis.unclosedPayloads
  ) {
    return axis;
  }

  return {
    observed:
      stated === null
        ? axis.observed
        : { firstTurn: axis.observed?.firstTurn ?? stated.turn, lastTurn: stated.turn },
    // The old map where nothing was new, so a payload that only moved the span
    // does not cost a copy of everything before it.
    actorByTurn: moved ? known : axis.actorByTurn,
    turnsPastTheNumbering,
    unclosedPayloads,
  };
}

/**
 * What the axis comes to: the fight's turns, everyone's, and the ones nobody was
 * seen taking.
 *
 * Only ordinals inside the observed span are counted, and the count walks what was
 * attributed rather than the span — the span is a number the game chose, and
 * §9.5's "shape inward, magnitude outward" says an ordinal past anything we expect
 * is the game's business, not a loop somebody is waiting on mid-fight.
 */
export function composeTurnCounts(axis: TurnAxis): TurnCounts {
  const { observed } = axis;
  if (observed === null || observed.lastTurn === observed.firstTurn) {
    return { fightTurns: null, turnsByCombatantId: new Map(), turnsWithoutActor: 0 };
  }

  const turnsByCombatantId = new Map<number, number>();
  let attributed = 0;
  for (const [turn, combatantId] of axis.actorByTurn) {
    if (turn < observed.firstTurn || turn > observed.lastTurn) continue;
    turnsByCombatantId.set(combatantId, (turnsByCombatantId.get(combatantId) ?? 0) + 1);
    attributed += 1;
  }

  const fightTurns = observed.lastTurn - observed.firstTurn + 1;
  return { fightTurns, turnsByCombatantId, turnsWithoutActor: fightTurns - attributed };
}
