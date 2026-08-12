import { describe, expect, test } from "bun:test";
import {
  composeProtocolMessage,
  parseProtocolMessage,
  ProtocolMessageFormatError,
} from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

const ALL_MESSAGES = CAPTURED_FIGHTS.flatMap((fight) =>
  fight.dump.calls.flatMap((call) =>
    call.protocolMessages.map((message) => ({ fight: fight.name, call: call.index, message })),
  ),
);

test("there are captured messages to parse", () => {
  expect(ALL_MESSAGES.length).toBeGreaterThan(0);
});

describe("over every captured message", () => {
  // Totality. The grammar throws on anything it does not cover, so this failing
  // means real material exists that we cannot read at all.
  test("every message parses", () => {
    const rejected: string[] = [];
    for (const { fight, call, message } of ALL_MESSAGES) {
      try {
        parseProtocolMessage(message);
      } catch (error) {
        rejected.push(`${fight} call ${call}: ${(error as Error).message}`);
      }
    }
    expect(rejected).toEqual([]);
  });

  // Reversibility. The cheapest witness available at this layer: a field the
  // parser silently drops shows up immediately, on real material, without
  // anyone having to know what the field means.
  test("parsing then composing gives back the original, byte for byte", () => {
    const changed: string[] = [];
    for (const { fight, call, message } of ALL_MESSAGES) {
      const rebuilt = composeProtocolMessage(parseProtocolMessage(message));
      if (rebuilt !== message) changed.push(`${fight} call ${call}:\n  ${message}\n  ${rebuilt}`);
    }
    expect(changed).toEqual([]);
  });

  // Most messages are about a combatant. The ones that name nobody turn out to
  // be about the fight itself — its outcome, the experience it paid out, and
  // free-text notices. Keeping the list closed makes a new kind of sideless
  // message fail here instead of being silently ignored by the decoder.
  // `+ph` joined them with the first duel between two players: what the winner
  // is paid is a fact about the fight and about neither combatant's row.
  const FIGHT_LEVEL_KEYS = ["winner", "loser", "+exp", "txt", "+ph"];

  test("a message that names no side carries only fight-level keys", () => {
    const unexpected: string[] = [];
    for (const { message } of ALL_MESSAGES) {
      const parsed = parseProtocolMessage(message);
      if (parsed.actor !== null || parsed.target !== null) continue;
      for (const { key } of parsed.parameters) {
        if (!FIGHT_LEVEL_KEYS.includes(key)) unexpected.push(`${key} in ${message}`);
      }
    }
    expect(unexpected).toEqual([]);
  });

  test("fight-level messages exist in the material, so the rule above is not vacuous", () => {
    const sideless = ALL_MESSAGES.map(({ message }) => parseProtocolMessage(message)).filter(
      (parsed) => parsed.actor === null && parsed.target === null,
    );
    expect(sideless.length).toBeGreaterThan(0);
  });
});

describe("sides", () => {
  test("reads an id with a health percentage", () => {
    expect(parseProtocolMessage("482845=100.00;-161518=70.07;step").actor).toEqual({
      combatantId: 482845,
      healthPercent: 100,
    });
  });

  test("reads a negative id — monsters carry them", () => {
    expect(parseProtocolMessage("-161518=70.07;0;step").actor).toEqual({
      combatantId: -161518,
      healthPercent: 70.07,
    });
  });

  test("reads an id stated without a percentage", () => {
    expect(parseProtocolMessage("-10000249;0;tspell=Aura").actor).toEqual({
      combatantId: -10000249,
      healthPercent: null,
    });
  });

  // `0` is not combatant zero — no combatant carries that id — it is the
  // protocol saying there is nobody on this side.
  test("reads `0` as nobody rather than as an id", () => {
    expect(parseProtocolMessage("482845=100.00;0;step").target).toBeNull();
  });

  test("refuses a side that is not an id", () => {
    expect(() => parseProtocolMessage("winner;0;step")).toThrow(ProtocolMessageFormatError);
  });

  test("refuses a message with nowhere for the sides to be", () => {
    expect(() => parseProtocolMessage("0")).toThrow(/fewer than two side segments/);
  });
});

describe("parameters", () => {
  test("splits a value at the first `=` only", () => {
    const parsed = parseProtocolMessage("0;0;txt=Locha: zdobyto Skora=x");
    expect(parsed.parameters).toEqual([{ key: "txt", value: "Locha: zdobyto Skora=x" }]);
  });

  // A flag and an empty value are different things, and a decoder that
  // conflates them will read one as the other.
  test("tells a flag apart from an empty value", () => {
    expect(parseProtocolMessage("0;0;step").parameters).toEqual([{ key: "step", value: null }]);
    expect(parseProtocolMessage("0;0;step=").parameters).toEqual([{ key: "step", value: "" }]);
  });

  test("keeps values as written, including commas and spaces", () => {
    expect(parseProtocolMessage("0;0;loser=Odyniec, Locha").parameters).toEqual([
      { key: "loser", value: "Odyniec, Locha" },
    ]);
  });

  test("keeps parameters in protocol order", () => {
    const parsed = parseProtocolMessage("0;0;+dmgd=466;+acdmg=5;-dmgd=223");
    expect(parsed.parameters.map((parameter) => parameter.key)).toEqual([
      "+dmgd",
      "+acdmg",
      "-dmgd",
    ]);
  });

  test("accepts a message carrying no parameters at all", () => {
    expect(parseProtocolMessage("482845=100.00;0").parameters).toEqual([]);
  });
});
