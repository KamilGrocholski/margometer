/**
 * The replay the cost report is taken on, held to the path it claims to measure.
 *
 * No duration is asserted — a clock is not a thing a gate can pin down. What is
 * checkable is that the replay is the live path: one timed payload per engine
 * call, a reading and a view only where the session changed, and the parts of a
 * payload adding up to no more than the payload they sit inside.
 */

import { describe, expect, test } from "bun:test";
import { getPayloadCost, PayloadCostError } from "@/tools/payload-cost.ts";
import {
  PAYLOAD_PHASE,
  READING_PHASE,
  SESSION_PHASE,
  VIEW_PHASE,
} from "@/src/cost-phases.ts";
import { CAPTURED_FIGHTS, type CapturedFight } from "@/tests/captured-fight-catalog.ts";
import { composeEmptySession, composeNextSession } from "@/src/game/battle-session.ts";
import { getPayloadReading } from "@/src/game/engine-battle-wrap.ts";

const COST = getPayloadCost(CAPTURED_FIGHTS, 1);

/**
 * How many payloads of this recording change the session, worked out here.
 *
 * ⚠️ **It used to read the tool's own answer, and that proved nothing.** The
 * report derives its redraw count from the `reading` tally, so a test comparing
 * the two compared a number with itself: removing the identity gate — the single
 * decision this replay exists to honour — lit not one assertion. Counted from
 * the material instead, by the same two functions the wrap calls.
 */
function getChangingPayloads(fight: CapturedFight): number {
  let session = composeEmptySession();
  let changing = 0;
  for (const call of fight.dump.calls) {
    const next = composeNextSession(session, getPayloadReading(call.payload));
    if (next !== session) changing += 1;
    session = next;
  }
  return changing;
}

describe("what a payload costs", () => {
  test("reads every recording the directory holds", () => {
    expect(COST.fights.map((fight) => fight.name)).toEqual(CAPTURED_FIGHTS.map((fight) => fight.name));
  });

  test("refuses material it has none of", () => {
    expect(() => getPayloadCost([], 1)).toThrow(PayloadCostError);
  });

  // Both sides of the boundary: one run is a measurement, none is not.
  test("refuses a run count below one, and accepts one", () => {
    expect(() => getPayloadCost(CAPTURED_FIGHTS, 0)).toThrow(PayloadCostError);
    expect(() => getPayloadCost(CAPTURED_FIGHTS, 1.5)).toThrow(PayloadCostError);
    expect(COST.runs).toBe(1);
  });

  test.each(COST.fights.map((fight) => [fight.name, fight] as const))(
    "%s times one payload per engine call",
    (_name, fight) => {
      expect(fight.wholePayload.name).toBe(PAYLOAD_PHASE);
      expect(fight.wholePayload.calls).toBe(fight.payloads);
    },
  );

  /**
   * The identity gate, which is the whole of the round that put it there: a
   * payload carrying no fight gives back the session it was handed, and the
   * caller redraws on identity. So a replay that read and drew on every call
   * would be measuring a panel nobody ships.
   */
  test.each(COST.fights.map((fight) => [fight.name, fight] as const))(
    "%s reads and draws only where the session changed",
    (_name, fight) => {
      const getCalls = (name: string) =>
        fight.parts.find((span) => span.name === name)?.calls ?? 0;

      const changing = getChangingPayloads(
        CAPTURED_FIGHTS.find((captured) => captured.name === fight.name)!,
      );

      expect(getCalls(SESSION_PHASE)).toBe(fight.payloads);
      expect(getCalls(READING_PHASE)).toBe(changing);
      expect(getCalls(VIEW_PHASE)).toBe(changing);
      expect(fight.redraws).toBe(changing);
      expect(changing).toBeLessThan(fight.payloads);
    },
  );

  // The parts sit inside the whole, so they may not add up to more than it. A
  // row that contained another would put a payload past a hundred per cent, and
  // that is the mistake the two tables exist to keep apart.
  test.each(COST.fights.map((fight) => [fight.name, fight] as const))(
    "%s keeps the parts of a payload inside it",
    (_name, fight) => {
      const parts = fight.parts.reduce((sum, span) => sum + span.totalMs, 0);

      expect(fight.parts.map((span) => span.name)).not.toContain(PAYLOAD_PHASE);
      expect(parts).toBeLessThanOrEqual(fight.wholePayload.totalMs);
    },
  );

  test.each(COST.fights.map((fight) => [fight.name, fight] as const))(
    "%s measures one decode and one fold over the finished fight",
    (_name, fight) => {
      expect(fight.wholeFightPasses).toHaveLength(2);
      expect(fight.wholeFightPasses.every((span) => span.calls === 1)).toBe(true);
    },
  );

  // The session copies both lists whole on every payload, so what it holds at
  // the end is what the last copy cost. Counted rather than weighed, because a
  // heap reading of something this size is noise (`tools/payload-cost.ts`).
  test.each(COST.fights.map((fight) => [fight.name, fight] as const))(
    "%s counts what the finished session still holds",
    (_name, fight) => {
      expect(fight.keptMessages).toBe(fight.messages);
      expect(fight.keptEvents).toBeGreaterThan(0);
      expect(fight.keptMessageCharacters).toBeGreaterThan(fight.keptMessages);
    },
  );
});
