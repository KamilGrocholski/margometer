/**
 * What one payload costs, and where the time goes.
 *
 * The panel used to be slow and nobody could say where, so the figures that
 * settled it were taken by hand, once, and written into a docblock in
 * `src/game/battle-session.ts` — where they became the only record of a
 * measurement nothing could take again. That docblock also says, in as many
 * words, that the fold beside it has never been measured at all. This is both of
 * those as a thing that runs.
 *
 * ⚠️ **It measures everything a browser is not needed for, and that is not
 * everything.** Building the DOM, the game's own dictionary and the hand on the
 * mouse exist only in a page; what is here is the arithmetic under them —
 * accumulating the session, which decodes; aggregating the fight; composing the
 * view. A total from this tool is a floor on what a player waits for and never
 * the whole of it. The development build carries the rest (§6.2).
 *
 * Numbers are printed and never written into prose: every one of them moves with
 * the material, the machine and the day (§5).
 */

import { composeDecimalText, composeIntegerText, getIntegerFromText } from "@/libs/number.ts";
import {
  composeSpanRecorder,
  composeSpanReport,
  getTimedResult,
  type ElapsedSpan,
  type SpanRecorder,
} from "@/libs/elapsed-spans.ts";
import { getTextOrder } from "@/libs/text-order.ts";
import {
  PAYLOAD_PHASE,
  READING_PHASE,
  SESSION_PHASE,
  VIEW_PHASE,
} from "@/src/cost-phases.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import {
  composeEmptySession,
  composeFightReading,
  composeNextSession,
  type BattleSession,
} from "@/src/game/battle-session.ts";
import { getPayloadReading } from "@/src/game/engine-battle-wrap.ts";
import { composeBattleRoster } from "@/src/game/engine-roster.ts";
import { composeDefaultState } from "@/src/ui/panel-screen.ts";
import { composePanelView } from "@/src/ui/panel-view.ts";
import {
  CAPTURED_FIGHTS,
  getMessagesOfFight,
  type CapturedFight,
} from "@/tests/captured-fight-catalog.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";

export class PayloadCostError extends MargoMeterToolError {
  constructor(reason: string) {
    super("PayloadCost", reason);
  }
}

const NAME_COLUMN = 22;
const NUMBER_COLUMN = 10;
const BAR_COLUMN = 20;
const DEFAULT_RUNS = 5;

const DECODE_PASS = "decode, whole fight";
const AGGREGATE_PASS = "aggregate, whole fight";

export type FightCost = {
  name: string;
  payloads: number;
  /** Of those, the ones that changed the session and so cost a reading and a view. */
  redraws: number;
  messages: number;
  /** The whole of one engine call. Its `worstMs` is what a player waits for at the worst moment. */
  wholePayload: ElapsedSpan;
  /** `session`, `reading`, `view` — the parts of the row above, which do not overlap. */
  parts: readonly ElapsedSpan[];
  /**
   * One decode and one fold over the finished fight, each measured on its own.
   *
   * Not part of the replay and not added to it: this is what re-reading a whole
   * fight would cost on the last payload, which is the trade the append path in
   * `src/game/battle-session.ts` was made to avoid and the one the fold there
   * still makes on every payload.
   */
  wholeFightPasses: readonly ElapsedSpan[];
  /**
   * What the finished session is still holding, counted rather than weighed.
   *
   * ⚠️ **The heap was the first answer here and it was not one.** Forcing a
   * collection and taking the difference in `heapUsed` reported 0 KiB on the
   * short recordings and −375 KiB on `2026-08-06-tempest-grupa-vs-hildur` in the
   * same run: the session is smaller than the noise of the method, and a zero
   * printed from it would be §9.3's substitution exactly — a figure nobody
   * measured standing where the answer is "below what this can see".
   *
   * These three are exact and they are what actually grows: the session appends
   * every message and every decoded event of a fight, and copies both lists
   * whole on every payload.
   */
  keptMessages: number;
  keptEvents: number;
  /** Characters across every message the session is holding — UTF-16 code units. */
  keptMessageCharacters: number;
};

export type PayloadCost = {
  runs: number;
  fights: readonly FightCost[];
};

/**
 * The middle measurement, and never the average of two.
 *
 * An even number of runs has no middle sample, and the mean of the two either
 * side is a duration nothing ever took — the kind of number §9.3 keeps out of a
 * reading. The lower of the two is a run that happened.
 */
function getMedian(values: readonly number[]): number {
  const sorted = [...values].sort((one, other) => one - other);
  return sorted[Math.floor((sorted.length - 1) / 2)] ?? 0;
}

/** One tally per name, each figure the median of what the runs said. */
function composeMedianSpans(runs: readonly (readonly ElapsedSpan[])[]): readonly ElapsedSpan[] {
  const names = [...new Set(runs.flatMap((run) => run.map((span) => span.name)))];
  return names
    .map((name) => {
      const seen = runs.flatMap((run) => run.filter((span) => span.name === name));
      return {
        name,
        calls: getMedian(seen.map((span) => span.calls)),
        totalMs: getMedian(seen.map((span) => span.totalMs)),
        worstMs: getMedian(seen.map((span) => span.worstMs)),
      };
    })
    .sort((one, other) => other.totalMs - one.totalMs || getTextOrder(one.name, other.name));
}

/**
 * One replay of a recording, call by call, in the order the wrap sees them.
 *
 * The identity gate is replayed too — `composeNextSession` hands back the
 * session it was given when a payload carried no fight, and the caller redraws
 * on identity — so the `reading` and `view` counts here are the redraws a player
 * would have paid for and not the calls the game made.
 */
function composeReplayedSession(fight: CapturedFight, recorder: SpanRecorder): BattleSession {
  let session = composeEmptySession();
  for (const call of fight.dump.calls) {
    session = getTimedResult(recorder, PAYLOAD_PHASE, () => {
      const before = session;
      const next = getTimedResult(recorder, SESSION_PHASE, () =>
        composeNextSession(before, getPayloadReading(call.payload)),
      );
      if (next === before) return next;
      const reading = getTimedResult(recorder, READING_PHASE, () => composeFightReading(next));
      getTimedResult(recorder, VIEW_PHASE, () => composePanelView(reading, composeDefaultState()));
      return next;
    });
  }
  return session;
}

/** What re-reading and re-folding the finished fight would cost, each on its own. */
function composeWholeFightPasses(fight: CapturedFight, session: BattleSession): readonly ElapsedSpan[] {
  const recorder = composeSpanRecorder();
  const { roster } = composeBattleRoster(session.combatants, session.ourSide);
  const messages = getMessagesOfFight(fight);
  const events = getTimedResult(recorder, DECODE_PASS, () => decodeFight(messages, roster));
  getTimedResult(recorder, AGGREGATE_PASS, () => composeFightStatistics(events, roster));
  return composeSpanReport(recorder);
}

export function getPayloadCost(fights: readonly CapturedFight[], runs: number): PayloadCost {
  if (fights.length === 0) throw new PayloadCostError("no captured fights to measure");
  if (!Number.isSafeInteger(runs) || runs < 1) {
    throw new PayloadCostError("a run count is a whole number of runs, at least one");
  }

  return {
    runs,
    fights: fights.map((fight) => {
      // Thrown away on purpose: the first replay of a fight measures a compiler
      // warming up as much as it measures the code, and it is the run every
      // figure here would otherwise be dragged towards.
      composeReplayedSession(fight, composeSpanRecorder());

      const perRun: (readonly ElapsedSpan[])[] = [];
      let session = composeEmptySession();
      for (let run = 0; run < runs; run += 1) {
        const recorder = composeSpanRecorder();
        session = composeReplayedSession(fight, recorder);
        perRun.push(composeSpanReport(recorder));
      }

      const spans = composeMedianSpans(perRun);
      const wholePayload = spans.find((span) => span.name === PAYLOAD_PHASE) ?? {
        name: PAYLOAD_PHASE,
        calls: 0,
        totalMs: 0,
        worstMs: 0,
      };
      return {
        name: fight.name,
        payloads: fight.dump.calls.length,
        redraws: spans.find((span) => span.name === READING_PHASE)?.calls ?? 0,
        messages: session.messages.length,
        wholePayload,
        parts: spans.filter((span) => span.name !== PAYLOAD_PHASE),
        wholeFightPasses: composeWholeFightPasses(fight, session),
        keptMessages: session.messages.length,
        keptEvents: session.events.length,
        keptMessageCharacters: session.messages.reduce((sum, message) => sum + message.length, 0),
      };
    }),
  };
}

/** A duration as the report writes it: enough places that a fast phase is not a zero. */
function composeMillisecondText(value: number): string {
  return composeDecimalText(value, 2);
}

function composeBarText(share: number): string {
  const filled = Math.max(0, Math.min(BAR_COLUMN, Math.round(share * BAR_COLUMN)));
  return "#".repeat(filled).padEnd(BAR_COLUMN);
}

function writeSpanRow(span: ElapsedSpan, wholeMs: number): void {
  const share = wholeMs === 0 ? 0 : span.totalMs / wholeMs;
  console.log(
    `  ${span.name.padEnd(NAME_COLUMN)}` +
      `${composeIntegerText(Math.round(span.calls)).padStart(NUMBER_COLUMN)}` +
      `${composeMillisecondText(span.totalMs).padStart(NUMBER_COLUMN)}` +
      `${composeMillisecondText(span.worstMs).padStart(NUMBER_COLUMN)}` +
      `  ${composeBarText(share)}`,
  );
}

function writeHeadingRow(): void {
  console.log(
    `  ${"phase".padEnd(NAME_COLUMN)}` +
      `${"calls".padStart(NUMBER_COLUMN)}` +
      `${"total ms".padStart(NUMBER_COLUMN)}` +
      `${"worst ms".padStart(NUMBER_COLUMN)}` +
      `  share of a payload`,
  );
}

function writeFightCost(cost: FightCost): void {
  console.log(`\n=== ${cost.name}`);
  console.log(
    `  ${composeIntegerText(cost.payloads)} payloads, ` +
      `${composeIntegerText(Math.round(cost.redraws))} of them redrawing, ` +
      `${composeIntegerText(cost.messages)} messages`,
  );
  console.log(
    `  whole fight ${composeMillisecondText(cost.wholePayload.totalMs)} ms, ` +
      `worst payload ${composeMillisecondText(cost.wholePayload.worstMs)} ms`,
  );
  console.log(
    `  session holds ${composeIntegerText(cost.keptMessages)} messages ` +
      `(${composeIntegerText(cost.keptMessageCharacters)} characters) ` +
      `and ${composeIntegerText(cost.keptEvents)} events`,
  );
  writeHeadingRow();
  for (const span of cost.parts) writeSpanRow(span, cost.wholePayload.totalMs);
  console.log("  one pass over the finished fight, measured alone:");
  for (const span of cost.wholeFightPasses) writeSpanRow(span, cost.wholePayload.totalMs);
}

function writePayloadCostReport(cost: PayloadCost): void {
  console.log(
    `payload cost over ${composeIntegerText(cost.fights.length)} recordings, ` +
      `median of ${composeIntegerText(cost.runs)} runs after a discarded warm-up.`,
  );
  console.log("no DOM here — this is the arithmetic under the panel, not the drawing of it.");
  for (const fight of cost.fights) writeFightCost(fight);
}

if (import.meta.main) {
  const [asked] = process.argv.slice(2);
  const runs = asked === undefined ? DEFAULT_RUNS : getIntegerFromText(asked);
  if (runs === null) throw new PayloadCostError(`not a run count: ${asked ?? ""}`);
  writePayloadCostReport(getPayloadCost(CAPTURED_FIGHTS, runs));
}
