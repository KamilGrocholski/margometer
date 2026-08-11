import { describe, expect, test } from "bun:test";
import { getIntegerFromText, getNumberFromText } from "@/libs/number.ts";
import { getMillisecondsFromIsoText } from "@/libs/timestamp.ts";
import { UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import { FROZEN_HELP_PHRASES } from "@/tests/frozen-help-phrases.ts";
import { FROZEN_PROTOCOL_KEYS } from "@/tests/frozen-protocol-keys.ts";
import {
  getKeysInState,
  getRequiredHelpPhrases,
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
const COUNTS = new Map<string, number>(Object.entries(FROZEN_HELP_PHRASES.counts));

function isComputedKey(key: string): boolean {
  const { marker, markerAt, markerLength } = FROZEN_PROTOCOL_KEYS.computedFamily;
  return key.slice(markerAt, markerAt + markerLength) === marker;
}

describe("the protocol key register", () => {
  test("has entries at all", () => {
    expect(ENTRIES.length).toBeGreaterThan(0);
  });

  /**
   * ⚠️ Written as an exact set until 2026-08-11, which made it two assertions in
   * one: that no unknown state is used, and that all three are in use. The second
   * stopped being true the day the last `investigated` entry was read — a
   * milestone, and not a reason for this guard to fail. `investigated` stays a
   * legal state because the next key the game adds will need it.
   */
  const KNOWN_STATES = ["decoded", "investigated", "not a battle key"];

  test("uses only states the guard knows how to check", () => {
    const states = [...new Set(ENTRIES.map((entry) => entry.state))].sort();
    expect(states.filter((state) => !KNOWN_STATES.includes(state))).toEqual([]);
    expect(states).toContain("decoded");
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

  /**
   * The obligation, and it is the half a count cannot supply.
   *
   * An entry that cites the help states a claim about someone else's document.
   * Prose is where such a claim goes to stop being checked — four keys of the
   * `legbon` family sat filed as undocumented while the help described all four
   * — so citing the help means stating, on one line, the phrases the claim was
   * measured on.
   */
  test("every entry citing the help states a *Help:* line", () => {
    const silent = citing.filter((entry) => entry.help === null).map((entry) => entry.key);
    expect(silent).toEqual([]);
  });

  test("both directions are exercised, so neither check passes on an empty set", () => {
    const spoken = ENTRIES.map((entry) => entry.help).filter((claim) => claim !== null);
    expect(spoken.filter((claim) => claim.direction === "names").length).toBeGreaterThan(0);
    expect(spoken.filter((claim) => claim.direction === "names nothing of").length).toBeGreaterThan(0);
  });

  // Re-freezing is the fix, and the message says so: a phrase nobody counted is
  // a claim nobody checked, which is the state this whole block exists to end.
  test("every phrase the register names was counted into the frozen table", () => {
    const uncounted = ENTRIES.flatMap((entry) =>
      (entry.help?.phrases ?? []).filter((phrase) => !(phrase in FROZEN_HELP_PHRASES.counts)),
    );
    expect(uncounted).toEqual([]);
  });

  test("a phrase an entry says the help names occurs in the article", () => {
    const absent = ENTRIES.flatMap((entry) =>
      entry.help?.direction === "names"
        ? entry.help.phrases
            .filter((phrase) => (COUNTS.get(phrase) ?? 0) === 0)
            .map((phrase) => `${entry.key} names ${phrase}`)
        : [],
    );
    expect(absent).toEqual([]);
  });

  // The direction that decays quietly. A positive claim fails the moment someone
  // looks it up; a negative just sits there being believed.
  test("a phrase an entry says the help names nothing of occurs nowhere in it", () => {
    const present = ENTRIES.flatMap((entry) =>
      entry.help?.direction === "names nothing of"
        ? entry.help.phrases
            .filter((phrase) => (COUNTS.get(phrase) ?? 0) > 0)
            .map((phrase) => `${entry.key} names nothing of ${phrase}, but the article carries it`)
        : [],
    );
    expect(present).toEqual([]);
  });

  test("the frozen table says which article and which dump it counted", () => {
    expect(FROZEN_HELP_PHRASES.article).toMatch(/^\d+$/);
    expect(getMillisecondsFromIsoText(FROZEN_HELP_PHRASES.fetchedAt)).not.toBeNull();
    expect(Object.keys(FROZEN_HELP_PHRASES.counts).length).toBeGreaterThan(0);
  });

  /**
   * NOTICE.md's promise, made checkable on the one file that touches the
   * operator's writing: the table carries engine names and figures we measured,
   * never a phrase of the article's own prose.
   */
  test("the frozen table holds engine names and no prose", () => {
    for (const phrase of Object.keys(FROZEN_HELP_PHRASES.counts)) {
      expect(phrase, phrase).toMatch(/^\(? ?[A-Za-z0-9_+-]+ ?\)?$/);
    }
  });
});

describe("what a *Help:* line is allowed to say", () => {
  test("refuses a direction nothing knows how to check", () => {
    const register = "### `txt` — decoded\n\n*Help:* maybe documented `txt`\n";
    expect(() => parseProtocolKeyRegister(register)).toThrow(ProtocolKeyRegisterError);
  });

  test("refuses a claim naming no phrase at all", () => {
    const register = "### `txt` — decoded\n\n*Help:* names nothing of it\n";
    expect(() => parseProtocolKeyRegister(register)).toThrow(ProtocolKeyRegisterError);
  });

  /**
   * The historical bug, as an executable test.
   *
   * This is the line `-legbon_facade` actually carried, and every phrase in it
   * counts zero — so a guard that re-measured only what was listed would have
   * agreed with it. What refuses it is the obligation to have tried the stem,
   * which is the name the help prints.
   */
  test("refuses a claim of silence that never tried the stem", () => {
    const register =
      "### `-legbon_facade` — decoded\n\n*Help:* names nothing of `legbon_facade`, `legbon`\n";
    expect(() => parseProtocolKeyRegister(register)).toThrow(/facade/);
  });

  // The positive control: without it the rule above is satisfied by a check that
  // throws on everything, which would pass while binding nothing.
  test("accepts the same claim once the stem is among the phrases", () => {
    const register =
      "### `-legbon_facade` — decoded\n\n*Help:* names nothing of `legbon_facade`, `facade`\n";
    const [entry] = parseProtocolKeyRegister(register);
    expect(entry?.help?.phrases).toContain("facade");
  });

  test("asks nothing of a claim that the help does name the key", () => {
    const register = "### `-legbon_facade` — decoded\n\n*Help:* names `facade`\n";
    expect(parseProtocolKeyRegister(register)[0]?.help?.direction).toBe("names");
  });

  test("reads an entry with no help line as making no claim", () => {
    const [entry] = parseProtocolKeyRegister("### `txt` — decoded\n\nNo verdict.\n");
    expect(entry?.help).toBeNull();
  });

  // A compound name is where the stem rule bites; a simple one must not be asked
  // for a second phrase that does not exist.
  test("asks for the tail of a compound name and nothing more of a simple one", () => {
    expect(getRequiredHelpPhrases("+legbon_holytouch")).toEqual([
      "legbon_holytouch",
      "holytouch",
    ]);
    expect(getRequiredHelpPhrases("-tenacity")).toEqual(["tenacity"]);
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

  /**
   * Every occurrence of every key, in the two forms the `*Shape:*` line states.
   *
   * Computed here rather than trusted from the entry, so the register's own
   * numbers are the thing under test. A phrase has to hold for **all** of a
   * key's occurrences; where more than one does, the weakest is the honest one,
   * which is why the order below is widest-last.
   */
  type Occurrence = { keys: string[]; value: string | null };

  const OCCURRENCES_BY_KEY = new Map<string, Occurrence[]>();
  for (const fight of CAPTURED_FIGHTS) {
    for (const call of fight.dump.calls) {
      for (const message of call.protocolMessages) {
        const { parameters } = parseProtocolMessage(message);
        const keys = parameters.map((parameter) => parameter.key);
        for (const parameter of parameters) {
          const carried = OCCURRENCES_BY_KEY.get(parameter.key) ?? [];
          carried.push({ keys, value: parameter.value });
          OCCURRENCES_BY_KEY.set(parameter.key, carried);
        }
      }
    }
  }

  function getPlacement(occurrences: Occurrence[]): string {
    if (occurrences.every((of) => of.keys.length === 1)) return "alone in its message";
    if (occurrences.every((of) => of.keys.includes("tspell"))) return "on a skill announcement";
    if (occurrences.every((of) => of.keys.some(isComputedKey))) return "on a blow";
    if (
      occurrences.every((of) => of.keys.some(isComputedKey) || of.keys.includes("+oth_dmg"))
    ) {
      return "on a message reporting damage";
    }
    return "anywhere";
  }

  function getValueShape(occurrences: Occurrence[]): string {
    if (occurrences.every((of) => of.value === null)) return "no value";
    if (occurrences.every((of) => of.value !== null && getIntegerFromText(of.value) !== null)) {
      return "a whole number";
    }
    // Either reader, because they split on the decimal point rather than on
    // "is this a number": `healall_per` states 30 and 22.5 in the same fight,
    // and asking only the decimal reader files that key as text.
    if (
      occurrences.every(
        (of) =>
          of.value !== null &&
          getNumberFromText(of.value) !== null,
      )
    ) {
      return "a number";
    }
    if (occurrences.every((of) => of.value !== null)) return "text";
    return "mixed";
  }

  test("some entry states a shape at all", () => {
    expect(ENTRIES.filter((entry) => entry.shape !== null).length).toBeGreaterThan(0);
  });

  test("every shape an entry states is the one the captures show", () => {
    const disagreeing = ENTRIES.flatMap((entry) => {
      if (entry.shape === null) return [];
      const occurrences = OCCURRENCES_BY_KEY.get(entry.key) ?? [];
      const measured = {
        occurrences: occurrences.length,
        placement: getPlacement(occurrences),
        valueShape: getValueShape(occurrences),
      };
      const stated = {
        occurrences: entry.shape.occurrences,
        placement: entry.shape.placement as string,
        valueShape: entry.shape.valueShape as string,
      };
      const agrees =
        measured.occurrences === stated.occurrences &&
        measured.placement === stated.placement &&
        measured.valueShape === stated.valueShape;
      return agrees ? [] : [{ key: entry.key, stated, measured }];
    });
    expect(disagreeing).toEqual([]);
  });

  /**
   * The other direction. Without it an entry could drop its shape line and lose
   * nothing — the check above would simply skip it, which is how a guarded claim
   * quietly becomes prose again.
   */
  test("every entry for a key the captures carry states one", () => {
    const silent = ENTRIES.filter(
      (entry) => entry.shape === null && OCCURRENCES_BY_KEY.has(entry.key),
    ).map((entry) => entry.key);
    expect(silent).toEqual([]);
  });
});
