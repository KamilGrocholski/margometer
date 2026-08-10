import { describe, expect, test } from "bun:test";
import { getMillisecondsFromIsoText } from "@/libs/timestamp.ts";
import { UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import { FROZEN_PROTOCOL_KEYS } from "@/tests/frozen-protocol-keys.ts";
import {
  getKeysInState,
  parseProtocolKeyRegister,
  PROTOCOL_KEY_HEALTH_EFFECTS,
  PROTOCOL_KEY_REGISTER,
  ProtocolKeyRegisterError,
} from "@/tests/protocol-key-register.ts";

/**
 * Holds `docs/protocol-keys.md` to the code and to the game.
 *
 * A register nobody checks is the artefact this project deleted 14,000 lines of.
 * These are the properties that keep it honest: it cannot claim to read a key
 * the decoder ignores, cannot omit one the decoder reads, and cannot describe a
 * key the game has never heard of.
 */

const NAMED_KEYS = new Set<string>(FROZEN_PROTOCOL_KEYS.keys);
const ENTRIES = PROTOCOL_KEY_REGISTER;

function isComputedKey(key: string): boolean {
  const { marker, markerAt, markerLength } = FROZEN_PROTOCOL_KEYS.computedFamily;
  return key.slice(markerAt, markerAt + markerLength) === marker;
}

describe("the protocol key register", () => {
  test("has entries at all", () => {
    expect(ENTRIES.length).toBeGreaterThan(0);
  });

  test("uses only states the guard knows how to check", () => {
    const states = new Set(ENTRIES.map((entry) => entry.state));
    expect([...states].sort()).toEqual([
      "decoded",
      "investigated",
      "not a battle key",
    ]);
  });

  test("names no key twice", () => {
    const keys = ENTRIES.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  // A health verdict misspelled would parse as no verdict at all: the witness
  // would quietly stop skipping that key, coverage would shrink, and every guard
  // here would still pass. Refusing the word outright is what keeps a typo from
  // becoming a number that is too low.
  test("refuses a health effect nothing knows how to check", () => {
    const register = "### `heal` — investigated\n\n*Health:* moves helth\n";
    expect(() => parseProtocolKeyRegister(register)).toThrow(ProtocolKeyRegisterError);
  });

  // Silence is a position, not an omission, so it has to survive parsing intact.
  test("reads an entry with no health line as making no claim", () => {
    const [entry] = parseProtocolKeyRegister("### `txt` — investigated\n\nNo verdict.\n");
    expect(entry?.healthEffect).toBeNull();
  });

  test("states a health effect only in words the register defines", () => {
    const spoken = ENTRIES.map((entry) => entry.healthEffect).filter((effect) => effect !== null);
    expect(spoken.length).toBeGreaterThan(0);
    for (const effect of spoken) expect(PROTOCOL_KEY_HEALTH_EFFECTS).toContain(effect);
  });
});

describe("a citation of the game's published help", () => {
  const HELP_CITATION = /view,\d+/;
  const READ_DATE = /\(read (\d{4}-\d{2}-\d{2})\)/;

  const citing = ENTRIES.filter((entry) => entry.evidence !== null && HELP_CITATION.test(entry.evidence));

  // Without this the rule below passes on an empty set, which is what a guard
  // over a channel nobody uses looks like right up until someone uses it wrong.
  test("is present in the register at all", () => {
    expect(citing.length).toBeGreaterThan(0);
  });

  // The help carries no build id, so the read date is the only thing dating a
  // claim from it. Without one the claim is dated to the day someone pasted it,
  // and the game rewrites its own documentation — §7.6.
  test("carries the date it was read, and a date that exists", () => {
    for (const entry of citing) {
      const read = READ_DATE.exec(entry.evidence ?? "");
      expect(read, entry.key).not.toBeNull();
      // Through the owner of `Date.parse` (§9.5): the shape above accepts
      // 2026-02-30, which is not a day anything was read on.
      expect(getMillisecondsFromIsoText(read?.[1] ?? ""), entry.key).not.toBeNull();
    }
  });
});

describe("the register against the decoder", () => {
  // Both directions. Falling behind hides what the decoder does; getting ahead
  // describes behaviour that does not exist, which is worse.
  test("every key the decoder reads has an entry saying so", () => {
    const decoded = getKeysInState("decoded");
    const missing = UNDERSTOOD_PROTOCOL_KEYS.filter((key) => !decoded.includes(key));
    expect(missing).toEqual([]);
  });

  test("every entry marked decoded is one the decoder actually reads", () => {
    const overclaimed = getKeysInState("decoded").filter(
      (key) => !UNDERSTOOD_PROTOCOL_KEYS.includes(key) && !isComputedKey(key.replace("?", "+")),
    );
    expect(overclaimed).toEqual([]);
  });

  test("nothing is filed as merely investigated while the decoder reads it", () => {
    const contradicted = getKeysInState("investigated").filter((key) =>
      UNDERSTOOD_PROTOCOL_KEYS.includes(key),
    );
    expect(contradicted).toEqual([]);
  });
});

describe("the register against the game", () => {
  test("every key it describes is one the client knows", () => {
    const unknownToTheGame = ENTRIES.filter((entry) => entry.state !== "not a battle key")
      .map((entry) => entry.key)
      .filter((key) => !NAMED_KEYS.has(key) && !isComputedKey(key.replace("?", "+")));
    expect(unknownToTheGame).toEqual([]);
  });

  // The inverse claim, checked rather than asserted in prose: an entry saying
  // "this is not a battle key" is wrong the moment the client gains a case for
  // it, and that is precisely when someone would go looking here again.
  test("anything filed as not a battle key is absent from the client's switch", () => {
    const actuallyKeys = getKeysInState("not a battle key").filter((key) => NAMED_KEYS.has(key));
    expect(actuallyKeys).toEqual([]);
  });
});

/**
 * The register against the material, which is the direction nothing held before.
 *
 * The two guards above keep it level with the decoder and with the client; both
 * are satisfied by a register that has simply never heard of a key. What is left
 * out then is exactly what the captures do contain and nobody has looked at —
 * the state this file exists to make impossible.
 *
 * A key arriving in new material is therefore a failing test rather than a line
 * further down the `decoding-status` output, where it can sit unread for as long
 * as nobody runs the tool.
 */
describe("the register against the captured material", () => {
  const CARRIED_KEYS = [
    ...new Set(
      CAPTURED_FIGHTS.flatMap((fight) =>
        fight.dump.calls.flatMap((call) =>
          call.protocolMessages.flatMap((message) =>
            parseProtocolMessage(message).parameters.map((parameter) => parameter.key),
          ),
        ),
      ),
    ),
  ];

  test("the captures carry keys to check", () => {
    expect(CARRIED_KEYS.length).toBeGreaterThan(0);
  });

  test("every key the captures carry is read, computed by shape, or has an entry", () => {
    const described = new Set(ENTRIES.map((entry) => entry.key));
    const unaccounted = CARRIED_KEYS.filter(
      (key) =>
        !described.has(key) &&
        !UNDERSTOOD_PROTOCOL_KEYS.includes(key) &&
        !isComputedKey(key.replace("?", "+")),
    );
    expect(unaccounted).toEqual([]);
  });

});
