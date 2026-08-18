import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { composeSourceWithoutComments } from "@/libs/source-regions.ts";
import {
  WARRIOR_ID_FIELD,
  WARRIOR_LEVEL_FIELD,
  WARRIOR_NAME_FIELD,
  WARRIOR_PROFESSION_FIELD,
  WARRIOR_SIDE_FIELD,
} from "@/src/game/engine-warrior.ts";

/**
 * `src/game/engine-warrior.ts` is the only place in `src/game/` that spells a
 * field of the game's combatant object.
 *
 * The module exists because two files were spelling the same five names and one
 * of them was spelling four of them twice within itself
 * (`docs/specs/2026-08-18-a-name-we-did-not-choose.md`). A module that removes a
 * duplication and is then held by nothing would stay green returning something
 * else entirely, so it lands with this rather than with coverage through its
 * callers.
 *
 * ⚠️ **`src/game/` and not the whole tree, and the boundary is load-bearing.**
 * `tools/fight-dump-parser.ts` reads the same five names and looks like a third
 * consumer. What binds it is the format of a **recording**, which the material in
 * `tests/captured-fights/` has already frozen: if the game renamed a field, this
 * module would follow it and every capture on disk would still carry the old
 * name. Holding the parser to this owner would make it reinterpret evidence
 * (§9.2), so it is out of scope on purpose rather than by oversight.
 */

const GAME_DIRECTORY = new URL("../../src/game/", import.meta.url).pathname;
const OWNER = "engine-warrior.ts";

const FIELDS = [
  WARRIOR_ID_FIELD,
  WARRIOR_NAME_FIELD,
  WARRIOR_SIDE_FIELD,
  WARRIOR_PROFESSION_FIELD,
  WARRIOR_LEVEL_FIELD,
];

const OTHER_FILES = readdirSync(GAME_DIRECTORY).filter(
  (file) => file.endsWith(".ts") && file !== OWNER,
);

function getSourceWithoutComments(file: string): string {
  return composeSourceWithoutComments(readFileSync(GAME_DIRECTORY + file, "utf8"));
}

/**
 * A bracketed read — `warrior["prof"]` — and derived from the values above rather
 * than typed out, so a sixth field added to the module is guarded the moment it
 * lands. The bracket is what keeps this off `prof:` in an object being built:
 * `src/game/fight-capture.ts` writes these same words as the keys of a snapshot,
 * and those belong to the file format rather than to the engine.
 */
const READ_OF_A_FIELD = new RegExp(`\\[\\s*"(${FIELDS.join("|")})"\\s*\\]`, "g");

describe("the game's own field names", () => {
  test("there are fields, and files to check them against", () => {
    expect(FIELDS.length).toBeGreaterThan(0);
    expect(new Set(FIELDS).size).toBe(FIELDS.length);
    expect(OTHER_FILES.length).toBeGreaterThan(0);
  });

  /**
   * Without this the rule below could be satisfied by a module that had stopped
   * naming anything at all — every file would pass, and nothing would be reading
   * a combatant.
   *
   * ⚠️ **It proves the spelling is here, never that it is right.** Derived from
   * the module's own values, so changing `prof` to `profession` passes this and
   * every other test in the file. That is the division on purpose: what a field
   * is *called* is the game's to decide and the recordings are what hold us to
   * it — the same mutation turns 21 tests red across `tests/game/` and
   * `tests/tools/`, all of them reading real material. This guard holds the one
   * thing material cannot: that there is a single spelling (§7.5).
   */
  test("the owner declares every one of them", () => {
    const source = getSourceWithoutComments(OWNER);
    for (const field of FIELDS) expect(source, field).toContain(`= "${field}"`);
  });

  test.each(OTHER_FILES)("%s reads a combatant through the owner", (file) => {
    const spelled = [...getSourceWithoutComments(file).matchAll(READ_OF_A_FIELD)].map(
      (match) => match[0],
    );
    expect(spelled, file).toEqual([]);
  });
});
