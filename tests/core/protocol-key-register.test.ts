/**
 * Holds `docs/protocol-keys.md` to the code and to the game.
 *
 * A register nobody checks is the artefact this project deleted 14,000 lines of.
 * These are the properties that keep it honest: it cannot claim to read a key
 * the decoder ignores, cannot omit one the decoder reads, and cannot describe a
 * key the game has never heard of.
 */

import { describe, expect, test } from "bun:test";
import { getIntegerFromText, getNumberFromText } from "@/libs/number.ts";
import { getMillisecondsFromIsoText } from "@/libs/timestamp.ts";
import {
  DAMAGE_TO_NAMED_KEY,
  SELF_SOURCED_HEALING_KEYS,
  WOUND_ANNOUNCEMENT_BY_TICK_KEY,
  SIDE_SHARE_HEALTH_KEYS,
  UNDERSTOOD_PROTOCOL_KEYS,
} from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import { FROZEN_HELP_PHRASES } from "@/tests/frozen-help-phrases.ts";
import { FROZEN_PROTOCOL_KEYS } from "@/tests/frozen-protocol-keys.ts";
import {
  getKeysInState,
  getKeysWithCause,
  getRequiredHelpPhrases,
  parseProtocolKeyRegister,
  PROTOCOL_KEY_CAUSES,
  PROTOCOL_KEY_HEALTH_EFFECTS,
  PROTOCOL_KEY_REGISTER,
  ProtocolKeyRegisterError,
} from "@/tests/protocol-key-register.ts";
import { hasDigitsAt, isDigitAt, isEveryCharacterIn } from "@/libs/text-runs.ts";

const NAMED_KEYS = new Set<string>(FROZEN_PROTOCOL_KEYS.keys);
const ENTRIES = PROTOCOL_KEY_REGISTER;
const COUNTS = new Map<string, number>(Object.entries(FROZEN_HELP_PHRASES.counts));

function isComputedKey(key: string): boolean {
  const { marker, markerAt, markerLength } = FROZEN_PROTOCOL_KEYS.computedFamily;
  return key.slice(markerAt, markerAt + markerLength) === marker;
}

const DIGITS = "0123456789";

/**
 * An engine name as the frozen table may carry it: the name itself, and at most
 * the brackets the help prints around one.
 *
 * What it refuses is a sentence — a space inside the name is what a phrase of the
 * operator's own prose would have, and NOTICE.md's promise is that none is here.
 */
const ENGINE_NAME_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_+-";

function isEngineName(phrase: string): boolean {
  let name = phrase.startsWith("(") ? phrase.slice(1) : phrase;
  if (name.startsWith(" ")) name = name.slice(1);
  if (name.endsWith(")")) name = name.slice(0, -1);
  if (name.endsWith(" ")) name = name.slice(0, -1);
  return isEveryCharacterIn(name, ENGINE_NAME_CHARACTERS);
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
  /** How the published help addresses an article, which is how an entry cites one. */
  const HELP_CITATION = "view,";

  const READ_OPENING = "(read ";

  const DATE_LENGTH = "yyyy-mm-dd".length;

  function hasHelpCitation(evidence: string): boolean {
    for (let at = evidence.indexOf(HELP_CITATION); at !== -1; at = evidence.indexOf(HELP_CITATION, at + 1)) {
      if (isDigitAt(evidence, at + HELP_CITATION.length)) return true;
    }
    return false;
  }

  /** The date in `(read …)`, by its shape alone — whether it is a day is asked below. */
  function getReadDate(evidence: string): string | null {
    for (let at = evidence.indexOf(READ_OPENING); at !== -1; at = evidence.indexOf(READ_OPENING, at + 1)) {
      const start = at + READ_OPENING.length;
      if (evidence[start + DATE_LENGTH] !== ")") continue;
      if (!hasDigitsAt(evidence, start, 4) || evidence[start + 4] !== "-") continue;
      if (!hasDigitsAt(evidence, start + 5, 2) || evidence[start + 7] !== "-") continue;
      if (!hasDigitsAt(evidence, start + 8, 2)) continue;
      return evidence.slice(start, start + DATE_LENGTH);
    }
    return null;
  }

  const citing = ENTRIES.filter((entry) => entry.evidence !== null && hasHelpCitation(entry.evidence));

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
      const read = getReadDate(entry.evidence ?? "");
      expect(read, entry.key).not.toBeNull();
      // Through the owner of `Date.parse` (§9.5): the shape above accepts
      // 2026-02-30, which is not a day anything was read on.
      expect(getMillisecondsFromIsoText(read ?? ""), entry.key).not.toBeNull();
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
    expect(isEveryCharacterIn(FROZEN_HELP_PHRASES.article, DIGITS)).toBe(true);
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
      expect(isEngineName(phrase), phrase).toBe(true);
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
    expect(() => parseProtocolKeyRegister(register)).toThrow("facade");
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

  /**
   * The suffix that says whom rather than what. `allies` occurs in the article on
   * every documented sibling, so obliging a silence claim to list it would refuse
   * the one true thing there is to say about `removedot-allies`.
   */
  test("asks for the head where the tail only says whom the effect reaches", () => {
    expect(getRequiredHelpPhrases("removedot-allies")).toEqual([
      "removedot-allies",
      "removedot",
    ]);
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

  /**
   * The two keys an announcement can be named by. `tcustom` is the second, and a
   * message carrying it is an announcement in the same sense: a name, and beside
   * it the effects the named thing performs.
   */
  const ANNOUNCEMENT_NAME_KEYS = ["tspell", "tcustom"];

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
    // Both spellings of the announcement, restated here rather than imported:
    // §9.3 keeps `tests/core/` spelling the protocol's keys itself, so that a
    // test asserting what the decoder reads never reads the decoder's own list.
    if (occurrences.every((of) => ANNOUNCEMENT_NAME_KEYS.some((key) => of.keys.includes(key)))) {
      return "on a skill announcement";
    }
    if (occurrences.every((of) => of.keys.some(isComputedKey))) return "on a blow";
    if (
      occurrences.every(
        (of) => of.keys.some(isComputedKey) || of.keys.includes(DAMAGE_TO_NAMED_KEY),
      )
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

/**
 * The `*Cause:*` line, re-earned rather than read back.
 *
 * ⚠️ **Only one of the four tokens closes in both directions, and the file says
 * so rather than implying four guards where there is one.** `the subject's own`
 * is a list the decoder keeps, so the register and the code can be held equal.
 * The other three are held one way each, against something that is itself
 * measured — which is weaker, and is the honest amount of holding available: the
 * decoder's remaining slot table is private, and exporting it to be compared with
 * prose would make the prose a copy of it rather than a claim about the game.
 */
describe("who a health figure is charged to", () => {
  const CHARGED = PROTOCOL_KEY_REGISTER.filter((entry) => entry.cause !== null);

  test("the register and the decoder name the same self-sourced keys", () => {
    expect(getKeysWithCause("the subject's own").sort()).toEqual(
      [...SELF_SOURCED_HEALING_KEYS].sort(),
    );
  });

  /**
   * The second token that closes both ways, and it has to: a key charged to
   * somebody an **earlier** message named is the widest reading in this file, so
   * the list the aggregate works from and the entries claiming it are held equal
   * rather than compared by eye (§9.6).
   */
  test("the register and the decoder name the same wound ticks", () => {
    expect(getKeysWithCause("the wound's attacker").sort()).toEqual(
      Object.keys(WOUND_ANNOUNCEMENT_BY_TICK_KEY).sort(),
    );
  });

  /**
   * And the announcement it is read off is a key this file has an entry for.
   * Without this the pairing could name a key nobody has looked into, and the
   * cause line would rest on a string.
   */
  test("every wound tick is announced by a key the register knows", () => {
    const known = new Set(PROTOCOL_KEY_REGISTER.map((entry) => entry.key));
    const missing = Object.values(WOUND_ANNOUNCEMENT_BY_TICK_KEY).filter(
      (announcement) => !known.has(announcement),
    );
    expect(missing).toEqual([]);
  });

  /**
   * A key charged to the announcement has to arrive **on** one, and the placement
   * it is compared against is re-measured from the captures a few tests above —
   * so this closes against the material rather than against another sentence.
   */
  test("a key charged to an announcement is one the captures find on an announcement", () => {
    const wrong = getKeysWithCause("the announcement's actor").filter((key) => {
      const entry = PROTOCOL_KEY_REGISTER.find((one) => one.key === key);
      return entry?.shape?.placement !== "on a skill announcement";
    });
    expect(wrong).toEqual([]);
  });

  /** Every key stating a share of a whole side reads its caster from the actor slot. */
  test("the keys stating a side's share are charged to the message actor", () => {
    const missing = SIDE_SHARE_HEALTH_KEYS.filter(
      (key) => !getKeysWithCause("the message actor").includes(key),
    );
    expect(missing).toEqual([]);
  });

  /**
   * And the split is real on both sides of it. A vocabulary where every entry
   * chose the same token would pass every test above while saying nothing, and
   * `nobody` is the token that has to keep existing: `poison` and `heal` are
   * written identically and part here (§9.6).
   */
  test("more than one token is in use, and nobody is one of them", () => {
    const used = new Set(CHARGED.map((entry) => entry.cause));
    expect(used.size).toBeGreaterThan(1);
    expect(getKeysWithCause("nobody").length).toBeGreaterThan(0);
    for (const cause of used) {
      expect(PROTOCOL_KEY_CAUSES as readonly (string | null)[]).toContain(cause);
    }
  });

  /**
   * ⚠️ **`poison` and `heal` are the pair this line exists for.** They arrive in
   * one shape and are charged differently, so a round that read the grammar
   * instead of the documentation would collapse them — and every other test here
   * would still pass.
   *
   * ⚠️ **"One shape" used to be read off the two register lines, and the material
   * moved out from under that.** The two placements were equal until
   * `tests/captured-fights/2026-08-27-luvia-grupa-vs-amaimon.json` brought a
   * poison tick carrying `-poison_lowdmg_per` beside it, which is a message with
   * two keys in it — `poison` is `anywhere` now and `heal` is still alone. The
   * shape that makes the pair a pair was never the neighbour count: it is that
   * both state a figure in the actor slot of a message naming nobody at the other
   * end, and that is measured here rather than compared between two sentences.
   */
  test("two keys of one shape are charged differently", () => {
    const isActorOnly = (key: string): boolean =>
      CAPTURED_FIGHTS.every((fight) =>
        fight.dump.calls.every((call) =>
          call.protocolMessages.every((message) => {
            const parsed = parseProtocolMessage(message);
            return parsed.parameters.every(
              (parameter) =>
                parameter.key !== key || (parsed.actor !== null && parsed.target === null),
            );
          }),
        ),
      );

    const heal = PROTOCOL_KEY_REGISTER.find((entry) => entry.key === "heal");
    const poison = PROTOCOL_KEY_REGISTER.find((entry) => entry.key === "poison");
    expect(isActorOnly("heal")).toBe(true);
    expect(isActorOnly("poison")).toBe(true);
    expect(heal?.cause).toBe("the subject's own");
    expect(poison?.cause).toBe("nobody");
  });

  /**
   * ⚠️ **`nobody` is a claim about the client's own key list, and this is where it
   * stops being prose.** A tick charged to nobody is one no earlier message can
   * name, and what would make it namable is an announcing key — which the client
   * spells as the tick's name behind its dealt sign, `+injure` beside `injure`.
   * Every gate re-earns that neither `poison` nor `fire` has one: the day the game
   * ships `+poison`, §9.6's fourth clause has a second candidate and this entry
   * would otherwise go on saying nothing announces it
   * (`docs/specs/2026-08-19-what-lets-a-tick-name-its-source.md`).
   *
   * ⚠️ **`wound` is why this asks for a figure and not merely for a name.** It read
   * `toEqual([])` while every tick in the corpus was announced by nothing, and
   * `2026-08-24-tempest-tropiciel-vs-centaur` brought a key the client announces as
   * `+wound` — which would have made this fail on an entry that is right. §9.6's
   * clause wants three things and the announcement is only the first: a figure on
   * it, so a tick can be told from another, and a documented rule making one
   * application the owner. The figure is the half a machine can hold, and it is
   * held over the captures rather than over the client, because a `%val%` hole is
   * not in the frozen key list and the material states what actually arrives.
   */
  test("a tick charged to nobody is announced by nothing carrying a figure", () => {
    const twins = getKeysWithCause("nobody")
      .map((key) => ({ key, twin: `${FROZEN_PROTOCOL_KEYS.computedFamily.dealtSign}${key}` }))
      .filter(({ twin }) => NAMED_KEYS.has(twin));

    for (const { key, twin } of twins) {
      const entry = PROTOCOL_KEY_REGISTER.find((one) => one.key === twin);
      // A twin the captures never carry states no shape, and then nothing here
      // knows whether it announces a figure — which is the case this must fail on
      // rather than wave through.
      expect(entry?.shape?.valueShape, `${key} is announced by ${twin}`).toBe("no value");
    }
    // The narrowing is exercised: were the corpus to lose every announced tick,
    // the loop above would pass by being empty and this would say so.
    expect(twins.map(({ key }) => key)).toEqual(["wound"]);
  });

  /**
   * And the composition above finds the one announcement there is, so the check
   * cannot pass by looking for a name the client never uses.
   */
  test("the joined tick's announcement is that same composition of its name", () => {
    const { dealtSign } = FROZEN_PROTOCOL_KEYS.computedFamily;
    for (const [tick, announcement] of Object.entries(WOUND_ANNOUNCEMENT_BY_TICK_KEY)) {
      expect(`${dealtSign}${tick}`).toBe(announcement);
      expect(NAMED_KEYS.has(announcement), announcement).toBe(true);
    }
  });

  /** Every entry that moves health answers, and no other entry does. */
  test("the line sits exactly where a health figure does", () => {
    for (const entry of PROTOCOL_KEY_REGISTER) {
      expect(entry.cause === null, entry.key).toBe(entry.healthEffect === null);
    }
    expect(CHARGED.length).toBeGreaterThan(0);
  });
});
