import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { FROZEN_PROTOCOL_KEYS } from "@/tests/frozen-protocol-keys.ts";

/**
 * Holds `docs/protocol-keys.md` to the code and to the game.
 *
 * A register nobody checks is the artefact this project deleted 14,000 lines of.
 * These are the properties that keep it honest: it cannot claim to read a key
 * the decoder ignores, cannot omit one the decoder reads, and cannot describe a
 * key the game has never heard of.
 */

const REGISTER = readFileSync(new URL("../docs/protocol-keys.md", import.meta.url).pathname, "utf8");

const ENTRY = /^### `([^`]+)` — (.+)$/gm;
const NAMED_KEYS = new Set<string>(FROZEN_PROTOCOL_KEYS.keys);

type Entry = { key: string; state: string };
const ENTRIES: Entry[] = [...REGISTER.matchAll(ENTRY)].map((match) => ({
  key: match[1] as string,
  state: match[2] as string,
}));

function getKeysInState(state: string): string[] {
  return ENTRIES.filter((entry) => entry.state === state).map((entry) => entry.key);
}

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
