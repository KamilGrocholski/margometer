import { describe, expect, test } from "bun:test";
import { BATTLE_EVENT_KINDS } from "@/src/core/battle-event.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

const DECODED_FIGHTS = CAPTURED_FIGHTS.map((fight) => ({
  name: fight.name,
  messages: fight.dump.calls.flatMap((call) => call.protocolMessages),
  events: decodeFight(fight.dump.calls.flatMap((call) => call.protocolMessages)),
}));

describe("the event contract", () => {
  // The rule this project keeps relearning: a variant nothing produces stays
  // alive on our own test data, drags a branch of every consumer along with it,
  // and nobody notices until someone counts. Counting is this test.
  test.each([...BATTLE_EVENT_KINDS])("%s is produced by the decoder on real material", (kind) => {
    const produced = DECODED_FIGHTS.flatMap((fight) => fight.events).filter(
      (event) => event.kind === kind,
    );
    expect(produced.length).toBeGreaterThan(0);
  });

  test("the decoder produces no kind the contract does not declare", () => {
    const kinds = new Set(DECODED_FIGHTS.flatMap((fight) => fight.events).map((e) => e.kind));
    expect([...kinds].sort()).toEqual([...BATTLE_EVENT_KINDS].sort());
  });
});

describe("over every captured fight", () => {
  // Nothing is dropped. Every message produces at least one event, whether or
  // not the decoder understood it — a message that yields nothing at all is
  // indistinguishable from a message that never arrived.
  test.each(DECODED_FIGHTS.map((fight) => [fight.name, fight] as const))(
    "%s: no message vanishes",
    (_name, fight) => {
      const silent = fight.messages.filter((message) => decodeFight([message]).length === 0);
      expect(silent).toEqual([]);
    },
  );

  test.each(DECODED_FIGHTS.map((f) => [f.name, f] as const))(
    "%s: every fight ends with a stated outcome",
    (_name, fight) => {
      const outcomes = fight.events.filter((event) => event.kind === "fight-outcome");
      expect(outcomes.map((event) => event.result).sort()).toEqual(["lost", "won"]);
      for (const outcome of outcomes) {
        expect(outcome.combatantNames.length).toBeGreaterThan(0);
        // Not merely non-empty: a name arriving with the separator's space still
        // attached would match every combatant against nothing later on.
        for (const name of outcome.combatantNames) {
          expect(name, outcome.result).toBe(name.trim());
          expect(name).not.toBe("");
        }
      }
    },
  );
});

describe("decoding a single message", () => {
  test("reads the winners of a fight", () => {
    expect(decodeFight(["0;0;winner=Gracz 1, Gracz 2"])).toEqual([
      { kind: "fight-outcome", result: "won", combatantNames: ["Gracz 1", "Gracz 2"] },
    ]);
  });

  test("reads the losers of a fight", () => {
    expect(decodeFight(["0;0;loser=Locha"])).toEqual([
      { kind: "fight-outcome", result: "lost", combatantNames: ["Locha"] },
    ]);
  });

  test("reports a key it has no meaning for, naming the key", () => {
    const [event] = decodeFight(["0;0;+exp=3973"]);
    expect(event).toEqual({
      kind: "unknown-message",
      message: "0;0;+exp=3973",
      reason: "no meaning yet for +exp",
    });
  });

  test("reports a message it cannot even read as a message", () => {
    const [event] = decodeFight(["winner;0;step"]);
    expect(event?.kind).toBe("unknown-message");
    expect((event as { reason: string }).reason).toMatch(/side segment/);
  });

  // Half understood is not understood. Without this, a message carrying one
  // known key beside three unknown ones would look fully read.
  test("reports the unread keys of a message it partly understood", () => {
    const events = decodeFight(["0;0;winner=Gracz 1;+exp=10"]);
    expect(events.map((event) => event.kind)).toEqual(["fight-outcome", "unknown-message"]);
  });
});
