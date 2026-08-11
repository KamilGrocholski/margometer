import { describe, expect, test } from "bun:test";
import { UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import { FROZEN_PROTOCOL_KEYS } from "@/tests/frozen-protocol-keys.ts";
import {
  getComputedKeyFamily,
  getProtocolKeys,
  ProtocolKeyTableError,
} from "@/tools/protocol-key-table.ts";

const { keys, computedFamily } = FROZEN_PROTOCOL_KEYS;
const NAMED_KEYS = new Set<string>(keys);

/** The client's own rule: a key of this shape is damage, and the sign says whose. */
function isComputedKey(key: string): boolean {
  const { marker, markerAt, markerLength } = computedFamily;
  return key.slice(markerAt, markerAt + markerLength) === marker;
}

const KEYS_IN_CAPTURED_FIGHTS = [
  ...new Set(
    CAPTURED_FIGHTS.flatMap((fight) =>
      fight.dump.calls.flatMap((call) =>
        call.protocolMessages.flatMap((message) =>
          parseProtocolMessage(message).parameters.map((parameter) => parameter.key),
        ),
      ),
    ),
  ),
].sort();

describe("the frozen key table", () => {
  test("is not empty and says which build it came from", () => {
    expect(keys.length).toBeGreaterThan(0);
    expect(FROZEN_PROTOCOL_KEYS.gameBuild).toMatch(/^\d{10,}$/);
  });

  test("carries the family the client recognises by shape rather than by name", () => {
    expect(computedFamily.marker).not.toBe("");
    expect(computedFamily.dealtSign).not.toBe("");
    expect(computedFamily.markerLength).toBeGreaterThan(0);
  });

  test("holds no duplicates and stays sorted, so re-freezing shows real change only", () => {
    expect(new Set(keys).size).toBe(keys.length);
    expect([...keys]).toEqual([...keys].sort());
  });
});

describe("the material against the table", () => {
  test("there are keys in the captured fights to check", () => {
    expect(KEYS_IN_CAPTURED_FIGHTS.length).toBeGreaterThan(0);
  });

  // Two independent sources: keys lifted from the client's switch, and keys the
  // server actually sent during real fights. Nothing reconciles them, so a key
  // in the material that the client does not know would mean one of the two is
  // being read wrongly.
  test("every key seen in a real fight is one the client knows", () => {
    const unrecognised = KEYS_IN_CAPTURED_FIGHTS.filter(
      (key) => !NAMED_KEYS.has(key) && !isComputedKey(key),
    );
    expect(unrecognised).toEqual([]);
  });

  // Guards against the family rule quietly becoming decoration: if every key in
  // the material happened to be a named one, the check above would pass without
  // the family ever being exercised.
  test("the computed family is exercised by the material, not just declared", () => {
    const computed = KEYS_IN_CAPTURED_FIGHTS.filter(isComputedKey);
    expect(computed.length).toBeGreaterThan(0);
    expect(computed.every((key) => !NAMED_KEYS.has(key))).toBe(true);
  });
});

describe("the decoder against the table", () => {
  // The other direction. A key we claim to understand that the client has never
  // heard of means we invented a meaning rather than read one.
  test("every key the decoder understands is one the client knows", () => {
    const invented = UNDERSTOOD_PROTOCOL_KEYS.filter(
      (key) => !NAMED_KEYS.has(key) && !isComputedKey(key),
    );
    expect(invented).toEqual([]);
  });

  test("the decoder understands at least something, so the check is not vacuous", () => {
    expect(UNDERSTOOD_PROTOCOL_KEYS.length).toBeGreaterThan(0);
  });
});

describe("extracting the table", () => {
  test("refuses a bundle without the switch it expects", () => {
    expect(() => getProtocolKeys("nothing resembling the game client")).toThrow(
      ProtocolKeyTableError,
    );
  });

  test("refuses a bundle where the family rule is gone", () => {
    expect(() => getComputedKeyFamily("nothing resembling the game client")).toThrow(
      /the client changed how it routes keys/,
    );
  });

  test("reads case labels out of a switch shaped like the client's", () => {
    const bundle = `x.manageBattleEffects(a,b);switch(q,O[0]){case"beta":x();case"alpha":y()}`;
    expect(getProtocolKeys(bundle)).toEqual(["alpha", "beta"]);
  });

  /**
   * ⚠️ **The regression, and the reason this test names three variables.**
   *
   * The tool searched for the literal `O[0]){` — the name the minifier gave that
   * variable in build `1785244275300`. Build `1786441768914` calls it `y`, and
   * the tool refused the whole bundle, reporting that the client had been
   * restructured when nothing structural had changed. The test that should have
   * caught it used `O` as well, so the guard agreed with the bug by construction.
   *
   * A minifier renames every local on every build. The name is therefore never
   * the thing to match, and this holds the extraction to saying so.
   */
  test.each(["O", "y", "$", "_zz"])(
    "reads the same keys whatever the minifier called the segment (%s)",
    (name) => {
      const bundle = `x.manageBattleEffects(${name}[0],${name}[1],c),${name}[0]){case"beta":x();case"alpha":y()}`;
      expect(getProtocolKeys(bundle)).toEqual(["alpha", "beta"]);
    },
  );

  /**
   * And the reason the search starts at the anchor rather than at the bundle:
   * `x[0]){` is an ordinary shape, and the first one in two megabytes belongs to
   * whatever happens to be earliest. Here an earlier switch offers keys that are
   * not battle keys at all — the trap §7.5 records, in its other direction.
   */
  test("takes the switch after the anchor, not the first one in the file", () => {
    const bundle = `switch(w[0]){case"not_a_battle_key":q()};x.manageBattleEffects(y[0],c),y[0]){case"alpha":y()}`;
    expect(getProtocolKeys(bundle)).toEqual(["alpha"]);
  });
});
