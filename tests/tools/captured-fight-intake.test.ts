/**
 * The gate material passes on its way into the repository.
 *
 * Two of these tests are about what the tool *refuses*, and that is the point of
 * it: a recording it cannot redact confidently must stop, because both ways of
 * being wrong are permanent. Guessing that a combatant is a monster corrupts
 * evidence; guessing they are a player is not the risk — guessing they are a
 * monster when they are a person puts a nickname into a public git history that
 * this repository does not rewrite.
 *
 * The last two hold the tool against the material already here, from both sides:
 * the redaction is a fixed point on it, and the shape it depends on is the shape
 * those files actually have.
 */

import { describe, expect, test } from "bun:test";
import { composeJsonText, getValueFromJsonText } from "@/libs/json.ts";
import {
  CapturedFightIntakeError,
  composeIntakePath,
  composeIntakeText,
  composePseudonymisedDump,
  removeSkillDescriptions,
  REMOVED_DESCRIPTION,
} from "@/tools/captured-fight-intake.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

/** The directory the catalog discovers, named once for the reads below. */
const CAPTURED_FIGHTS_DIRECTORY = new URL("../captured-fights/", import.meta.url).pathname;
import { readFileSync } from "node:fs";

/** A recording in the shape the add-on writes, with whoever is asked for in it. */
function composeRecording(
  combatants: Record<string, unknown>,
  overrides: Record<string, unknown> = {},
): unknown {
  return {
    wersja: 1,
    przy: "2026-08-11T12:00:00.000Z",
    swiat: "tempest",
    build: "1786441768914",
    wpisy: [
      {
        nr: 0,
        ladunek: { w: combatants, ...overrides },
        komunikaty: [],
        wojownicyPrzed: [],
        wojownicyPo: [],
      },
    ],
  };
}

describe("who is a person, and who only looks like one", () => {
  test("a player becomes a numbered label, everywhere the name appears", () => {
    const recording = composeRecording({
      "5": { id: 5, npc: 0, name: "SomeNickname" },
      "-9": { id: -9, npc: 1, name: "Locha" },
    });
    const dump = recording as { wpisy: Array<{ komunikaty: string[] }> };
    dump.wpisy[0]!.komunikaty = ["winner=SomeNickname;loser=Locha"];

    const { dump: redacted, changed, substitutions } = composePseudonymisedDump(recording);

    expect(substitutions.get("SomeNickname")).toBe("Gracz 1");
    expect(substitutions.has("Locha")).toBe(false);
    expect(changed).toBe(2);
    expect(composeJsonText(redacted)).not.toContain("SomeNickname");
    // Monsters are not people, and their names are what the recording is about.
    expect(composeJsonText(redacted)).toContain("Locha");
  });

  /**
   * ⚠️ **The refusal that matters.** `npc` rides only in `ladunek.w`, so a
   * combatant seen only in a snapshot cannot be placed. The tempting shortcut —
   * a negative id is a monster — is an unmeasured claim about the game, and
   * getting it wrong in one direction is irreversible.
   */
  test("a combatant nobody can place stops the write", () => {
    const recording = composeRecording({ "5": { id: 5, npc: 0, name: "SomeNickname" } }) as {
      wpisy: Array<{ wojownicyPo: unknown[] }>;
    };
    recording.wpisy[0]!.wojownicyPo = [{ id: 404, name: "AStranger" }];

    expect(() => composePseudonymisedDump(recording)).toThrow(CapturedFightIntakeError);
    expect(() => composePseudonymisedDump(recording)).toThrow("404");
  });

  // `w` separates two players by id; a message carries only the text, so there is
  // no way to say which of them a name in it meant.
  test("two players under one name stop the write", () => {
    const recording = composeRecording({
      "5": { id: 5, npc: 0, name: "Twin" },
      "6": { id: 6, npc: 0, name: "Twin" },
    });

    expect(() => composePseudonymisedDump(recording)).toThrow("share the name");
  });

  /**
   * Keeping one name per id instead of every name lets a nickname from an earlier
   * snapshot of the same combatant through, and nothing downstream notices.
   */
  test("a name seen only in an earlier snapshot is still substituted", () => {
    const recording = composeRecording({ "5": { id: 5, npc: 0, name: "LaterName" } }) as {
      wpisy: Array<{ wojownicyPrzed: unknown[] }>;
    };
    recording.wpisy[0]!.wojownicyPrzed = [{ id: 5, name: "EarlierName" }];

    const { dump: redacted } = composePseudonymisedDump(recording);

    expect(composeJsonText(redacted)).not.toContain("EarlierName");
    expect(composeJsonText(redacted)).not.toContain("LaterName");
  });

  // Ids are numbers, and the default sort is by spelling: `-9` before `-161518`
  // reads fine as text and numbers the labels wrongly.
  test("labels are numbered by id, as a number", () => {
    const recording = composeRecording({
      "-161518": { id: -161518, npc: 0, name: "Second" },
      "-9": { id: -9, npc: 0, name: "Third" },
      "-500000": { id: -500000, npc: 0, name: "First" },
    });

    const { substitutions } = composePseudonymisedDump(recording);

    expect(substitutions.get("First")).toBe("Gracz 1");
    expect(substitutions.get("Second")).toBe("Gracz 2");
    expect(substitutions.get("Third")).toBe("Gracz 3");
  });
});

describe("the sentences the game's authors wrote", () => {
  const ABILITY = [
    "17",
    // Ours, not the game's: what this proves is that a functional name survives
    // the redaction, and an invented one proves it exactly as well. The game's
    // own ability names stay in the recordings and nowhere else (NOTICE.md).
    "Skill One",
    "1",
    "2",
    "3",
    "A whole sentence the game's authors wrote about this ability.",
    "reqp=h;lvl=25",
    "1/10",
    "red-sa=16;cooldown=5",
    "",
  ];

  test("come out, while the ability's own name stays", () => {
    const recording = composeRecording({}, { skills: [...ABILITY] });

    const { dump: stripped, removed } = removeSkillDescriptions(recording);

    expect(removed).toBe(1);
    const written = composeJsonText(stripped);
    expect(written).not.toContain("A whole sentence");
    expect(written).toContain(REMOVED_DESCRIPTION);
    // Functional names stay: the protocol carries the ability's name anyway.
    expect(written).toContain("Skill One");
    expect(written).toContain("red-sa=16;cooldown=5");
  });

  /**
   * Groups of ten is a claim about the game measured on one build. An array that
   * does not divide by it is a layout this tool has not seen, and cutting field 5
   * out of an unknown one removes the wrong thing — on evidence.
   */
  test("an unfamiliar layout stops the write rather than being guessed at", () => {
    const recording = composeRecording({}, { skills: [...ABILITY, "one field too many"] });

    expect(() => removeSkillDescriptions(recording)).toThrow(CapturedFightIntakeError);
  });
});

describe("the file that comes out", () => {
  test("says how much it redacted, and adds to what was already said", () => {
    const recording = composeRecording(
      { "5": { id: 5, npc: 0, name: "SomeNickname" } },
      { skills: [...Array(10)].map((_, field) => (field === 5 ? "A sentence." : "x")) },
    );

    const intake = composeIntakeText(recording);
    const written = getValueFromJsonText(intake.text).value as Record<string, unknown>;

    expect(written["pseudonimow"]).toBe(intake.changed);
    expect(written["opisow"]).toBe(1);
    expect(intake.changed).toBeGreaterThan(0);
  });

  /**
   * Absent and unreadable, which are not the same reading and one of them is not
   * zero.
   *
   * A first intake has no such count and zero is right. A count the reader
   * refuses means an earlier redaction did something this tool cannot size — and
   * it used to read as zero and be written back into the file, stating that
   * nothing had been substituted. §9.2 makes this the one place a wrong number is
   * written **onto the evidence**
   * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F19).
   */
  test("counts from nothing where a recording has never been redacted", () => {
    const intake = composeIntakeText(
      composeRecording({ "5": { id: 5, npc: 0, name: "SomeNickname" } }),
    );
    const written = getValueFromJsonText(intake.text).value as Record<string, unknown>;

    expect(written["pseudonimow"]).toBe(intake.changed);
    expect(written["opisow"]).toBe(0);
  });

  test("adds to a count already there rather than starting again", () => {
    const recording = composeRecording({ "5": { id: 5, npc: 0, name: "SomeNickname" } });
    (recording as Record<string, unknown>)["pseudonimow"] = 7;

    const intake = composeIntakeText(recording);
    const written = getValueFromJsonText(intake.text).value as Record<string, unknown>;

    expect(written["pseudonimow"]).toBe(7 + intake.changed);
  });

  test("refuses a count it cannot read rather than writing zero over it", () => {
    for (const unreadable of ["7", 7.5, -1, null, {}, []]) {
      const recording = composeRecording({ "5": { id: 5, npc: 0, name: "SomeNickname" } });
      (recording as Record<string, unknown>)["pseudonimow"] = unreadable;

      expect(() => composeIntakeText(recording), String(unreadable)).toThrow(
        CapturedFightIntakeError,
      );
    }
  });

  test("is named for the day, the world and what a person called it", () => {
    const path = composeIntakePath(composeRecording({}), "pvp-poison");

    // Split, so this test does not name a capture that does not exist —
    // `tests/tools/cited-paths.test.ts` holds every path in the repository's own
    // text to pointing at a real file, and an example is text like any other.
    expect(path.startsWith("tests/captured-fights/")).toBe(true);
    expect(path.slice("tests/captured-fights/".length)).toBe(
      "2026-08-11-tempest-pvp-poison.json",
    );
  });

  test("refuses a recording that says nothing about when or where", () => {
    expect(() => composeIntakePath({ swiat: "tempest" }, "x")).toThrow("przy");
    expect(() => composeIntakePath({ przy: "2026-08-11T12:00:00.000Z" }, "x")).toThrow("swiat");
  });

  test("refuses a name that would not read as a file name", () => {
    expect(() => composeIntakePath(composeRecording({}), "Not A Slug")).toThrow("kebab-case");
  });

  /**
   * Both ends of the hyphen rule, and the trailing one is why this is here: it
   * composes a filename with a double hyphen in it, which reads as a field that
   * went missing rather than as a name somebody typed wrong. Found by mutating
   * the reader on 2026-08-27 and watching every test stay green.
   */
  test.each(["-lowca", "lowca-", "lowca--vs", "-", "", "Lowca", "lowca_vs"])(
    "refuses %p",
    (slug) => {
      expect(() => composeIntakePath(composeRecording({}), slug)).toThrow("kebab-case");
    },
  );

  test.each(["lowca", "lowca-vs-odyncze", "a1", "2026-08-27-x"])("accepts %p", (slug) => {
    expect(composeIntakePath(composeRecording({}), slug)).toContain(slug);
  });
});

/**
 * The tool against the material, rather than against examples written to suit it.
 *
 * A fixed point is the strongest statement available here: every file in the
 * directory has already been through this redaction, so running it again must
 * find nothing left to do. It fails if the tool stops recognising a player, and
 * it fails if the tool starts substituting something it should not.
 */
describe("the captures already in the repository", () => {
  test("there are captures to check", () => {
    expect(CAPTURED_FIGHTS.length).toBeGreaterThan(0);
  });

  test.each(CAPTURED_FIGHTS.map((fight) => [fight.name] as const))(
    "%s is a fixed point of the redaction",
    (name) => {
      const source = readFileSync(`${CAPTURED_FIGHTS_DIRECTORY}${name}.json`, "utf8");
      const recording = getValueFromJsonText(source).value;

      const named = composePseudonymisedDump(recording);
      expect(named.changed).toBe(0);
      expect(removeSkillDescriptions(named.dump).removed).toBe(0);
    },
  );

  // The fixed point above would also hold if the tool found no players at all —
  // which is exactly how a redaction stops working without anything going red.
  test.each(CAPTURED_FIGHTS.map((fight) => [fight.name] as const))(
    "%s has players the redaction actually recognised",
    (name) => {
      const source = readFileSync(`${CAPTURED_FIGHTS_DIRECTORY}${name}.json`, "utf8");
      const { substitutions } = composePseudonymisedDump(getValueFromJsonText(source).value);

      expect(substitutions.size).toBeGreaterThan(0);
      for (const [, label] of substitutions) expect(label).toMatch(/^Gracz \d+$/);
    },
  );
});
