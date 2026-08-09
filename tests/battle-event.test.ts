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

  test("reads damage dealt and damage taken as separate figures", () => {
    expect(decodeFight(["482845=100.00;-161518=70.07;+dmgd=466;-dmgd=223"])).toEqual([
      {
        kind: "attack",
        actorId: 482845,
        targetId: -161518,
        dealt: [{ damageType: "dmgd", amount: 466 }],
        taken: [{ damageType: "dmgd", amount: 223 }],
      },
    ]);
  });

  // The client recognises damage by shape, not from a list, so a kind it has
  // never sent before still decodes. Mirroring that is the point.
  test("reads a damage kind it has never seen before", () => {
    const [event] = decodeFight(["1=100.00;2=50.00;+dmgz=7"]);
    expect(event).toMatchObject({ dealt: [{ damageType: "dmgz", amount: 7 }] });
  });

  test("keeps each damage kind apart rather than summing them", () => {
    const [event] = decodeFight(["1=100.00;2=50.00;+dmgf=10;+dmgc=20"]);
    expect(event).toMatchObject({
      dealt: [
        { damageType: "dmgf", amount: 10 },
        { damageType: "dmgc", amount: 20 },
      ],
    });
  });

  // A damage key whose value will not read as a number is worse than an unknown
  // key: it looks like a figure and is not one.
  test("reports a damage key whose value is not a number instead of counting it", () => {
    const events = decodeFight(["1=100.00;2=50.00;+dmgf=lots"]);
    expect(events.map((event) => event.kind)).toEqual(["unknown-message"]);
  });

  // Found by mutation testing: this used to trip an assertion and take the
  // panel down. A message with no parameters is odd but possible, so it is
  // reported like anything else the decoder cannot read.
  test("reports a message that carries no parameters at all", () => {
    expect(decodeFight(["0;0"])).toEqual([
      { kind: "unknown-message", message: "0;0", reason: "carries no parameters" },
    ]);
  });

  // A bare `catch` would turn every failure into "the game changed its format",
  // including our own bugs. Here the parser fails for a reason that is not a
  // format problem at all, and it has to travel rather than be relabelled.
  test("lets a failure that is not a format problem travel instead of relabelling it", () => {
    const notAMessage = null as unknown as string;
    expect(() => decodeFight([notAMessage])).toThrow(TypeError);
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
