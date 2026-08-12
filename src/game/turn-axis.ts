/**
 * The fight's turn axis, read from the payload envelope.
 *
 * A turn-based fight has no seconds to divide by, so "per turn" is the only rate
 * that means anything here — and until this file existed the add-on did not read
 * the game's turn number at all. It counted its own, by watching `current` change
 * from one payload to the next, which counts **payloads that happened to arrive**.
 * Measured on `2026-08-06-tempest-grupa-vs-hildur`: that gives 98 where the game
 * numbered 299, so every rate was 3.05× too high, and per-combatant counts were a
 * sample of who was acting when a payload landed — one combatant credited 2 turns
 * against the ~22 the game scheduled, an 11× error on their own row.
 *
 * What the envelope actually carries, and the client's own name for it:
 * `turns_warriors` is the **turn prediction** — `updateTurnPredictions(turns)`,
 * read on production build 1786514810315 and development build 1781609507010 — a
 * map of turn ordinal to combatant id, ten wide. The client iterates it for order
 * and never reads a key, so what the keys *mean* comes from the material: across
 * all three captures the least key is the turn being taken, and it rises strictly,
 * 2 → 300 over 99 payloads with no step backwards.
 *
 * ⚠️ **It is a prediction, and predictions get revised.** 66 of 685 re-observations
 * disagreed with an earlier one, so the freshest statement wins. Checked against
 * the ordinals later seen as `current`: the entry for the very next turn was right
 * 45/45, and forecasts further out 84/96. That is the game's own statement about
 * who acts when — not a guess of ours — and it is why the turns nobody was named
 * for are carried separately rather than rounded away.
 *
 * `current` is not read here. It names the same combatant as the least ordinal and
 * so adds nothing to the reading — that agreement is a claim about the game, and
 * §7.5 puts a claim a machine can check in a guard rather than in a counter with
 * no consumer: `tests/game/turn-axis.test.ts` re-measures it on every capture,
 * every gate run.
 */

import { getIntegerFromText, getIntegerFromValue } from "@/libs/number.ts";

export type TurnAxis = {
  /**
   * The span of ordinals this fight has stated, or null before it has stated any.
   *
   * One nullable pair rather than two loose fields: they are set together and
   * meaningless apart, which is an invariant §9.5 puts in the type instead of
   * leaving to every caller to remember.
   */
  observed: { firstTurn: number; lastTurn: number } | null;
  /** Who the game says acts on each ordinal. The freshest statement wins. */
  actorByTurn: ReadonlyMap<number, number>;
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
   * Ordinals inside the span no prediction ever named.
   *
   * The prediction reaches ten turns ahead and payloads can be further apart than
   * that — measured, a gap of 13 from ordinal 235 to 248, leaving 245, 246 and 247
   * named by nothing. They are counted here and never added to a row: a turn
   * nobody was named for is not a turn somebody took.
   */
  turnsWithoutActor: number;
};

export function composeEmptyTurnAxis(): TurnAxis {
  return { observed: null, actorByTurn: new Map() };
}

/** The prediction this payload carries, ordinal by ordinal, or null where it carries none. */
function getTurnPrediction(payload: unknown): Map<number, number> | null {
  if (typeof payload !== "object" || payload === null) return null;
  const stated = (payload as Record<string, unknown>)["turns_warriors"];
  if (typeof stated !== "object" || stated === null) return null;

  const prediction = new Map<number, number>();
  for (const [key, value] of Object.entries(stated)) {
    const turn = getIntegerFromText(key);
    const combatantId = getIntegerFromValue(value);
    if (turn === null || combatantId === null) continue;
    prediction.set(turn, combatantId);
  }
  return prediction.size === 0 ? null : prediction;
}

/**
 * The axis after one more payload.
 *
 * ⚠️ **Hands back the identical object when the payload moves nothing.** The
 * caller redraws on identity (`battle-session.ts`), and the game calls the engine
 * far more often than a fight has turns — a step, a chat line, a window opening.
 * Three cases move nothing: no prediction at all, none of it readable, and one
 * that states only what is already recorded. Ten map lookups are cheaper than the
 * map they avoid building and far cheaper than the panel they avoid redrawing.
 */
export function composeNextTurnAxis(axis: TurnAxis, payload: unknown): TurnAxis {
  const prediction = getTurnPrediction(payload);
  if (prediction === null) return axis;

  const turn = Math.min(...prediction.keys());

  /**
   * An ordinal behind the span moves nothing at all.
   *
   * It can only mean a fight that opened without us seeing `init` — and `init` is
   * where a fight begins (`battle-session.ts`), so treating this as a second fight
   * boundary would put that decision in two places. Accepting it instead would be
   * worse: its ten entries would overwrite ordinals inside the current span with a
   * different fight's combatants. Never observed — the ordinals rise strictly
   * across all 99 payloads that state one — so it gets the handling that cannot be
   * wrong rather than the one that guesses.
   */
  if (axis.observed !== null && turn < axis.observed.lastTurn) return axis;

  const known = new Map(axis.actorByTurn);
  let moved = false;
  for (const [ordinal, combatantId] of prediction) {
    if (known.get(ordinal) === combatantId) continue;
    known.set(ordinal, combatantId);
    moved = true;
  }
  if (!moved && turn === axis.observed?.lastTurn) return axis;

  return {
    observed: { firstTurn: axis.observed?.firstTurn ?? turn, lastTurn: turn },
    // The old map where the prediction stated nothing new, so a payload that only
    // moved the span does not cost a copy of everything before it.
    actorByTurn: moved ? known : axis.actorByTurn,
  };
}

/**
 * What the axis comes to: the fight's turns, everyone's, and the ones nobody was
 * named for.
 *
 * Only ordinals inside the observed span are counted, and the count walks the
 * predictions rather than the span — the span is a number the game chose, and
 * §9.5's "shape inward, magnitude outward" says an ordinal past anything we expect
 * is the game's business, not a loop somebody is waiting on mid-fight.
 *
 * Past the last turn we saw the prediction is still a forecast, and those turns
 * may never be taken — the fight ends, a combatant dies — so counting them would
 * credit somebody with actions the game merely intended for them.
 */
export function composeTurnCounts(axis: TurnAxis): TurnCounts {
  const { observed } = axis;
  if (observed === null || observed.lastTurn === observed.firstTurn) {
    return { fightTurns: null, turnsByCombatantId: new Map(), turnsWithoutActor: 0 };
  }

  const turnsByCombatantId = new Map<number, number>();
  let named = 0;
  for (const [ordinal, combatantId] of axis.actorByTurn) {
    if (ordinal < observed.firstTurn || ordinal > observed.lastTurn) continue;
    turnsByCombatantId.set(combatantId, (turnsByCombatantId.get(combatantId) ?? 0) + 1);
    named += 1;
  }

  const fightTurns = observed.lastTurn - observed.firstTurn + 1;
  return { fightTurns, turnsByCombatantId, turnsWithoutActor: fightTurns - named };
}
