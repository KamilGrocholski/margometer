/**
 * `CHANGELOG.md` against the version being released.
 *
 * This is the release gate moved into the tests: the tag comes from
 * `package.json` and the release body comes from this file, so a number bumped
 * without a section published a release that said nothing about itself. The old
 * tree learned that; the guard is what carries the lesson rather than the memory
 * of it (AGENTS.md §7.5).
 */

import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import manifest from "@/package.json";
import {
  CHANGELOG_PATH,
  ChangelogError,
  composeReleaseNotes,
  getChangelogSection,
} from "@/tools/changelog.ts";

const CHANGELOG = readFileSync(CHANGELOG_PATH, "utf8");
/** The three words a release's notes are written in, each drawn in bold. */
const ENTRY_TYPES = ["Nowość", "Zmiana", "Poprawka"].map((word) => `**${word}**`);
/** What opens a version's own heading, and so what its section must stop before. */
const VERSION_HEADING = "## [";

describe("the changelog against the version being released", () => {
  test("the version in package.json has a section, and it says something", () => {
    const section = getChangelogSection(CHANGELOG, manifest.version);
    expect(section, manifest.version).not.toBeNull();
    expect(ENTRY_TYPES.some((entry) => (section ?? "").includes(entry))).toBe(true);
  });

  test("its section stops before the previous one", () => {
    const section = getChangelogSection(CHANGELOG, manifest.version) ?? "";
    const headings = section.split("\n").filter((line) => line.startsWith(VERSION_HEADING));
    expect(headings).toEqual([]);
  });

  /**
   * A released section is frozen — somebody already has that release — so it is
   * the safe place to check that the boundaries run where they should. 0.4.0
   * carries both a **Nowość** and a **Poprawka**, and the section after it is
   * 0.3.0.
   */
  test("a released section covers its own version and no neighbour", () => {
    const released = getChangelogSection(CHANGELOG, "0.4.0");
    expect(released).toContain("**Nowość**");
    expect(released).toContain("**Poprawka**");
    expect(released).not.toContain("## [0.3.0]");
    expect(released).not.toContain("Instalacja jednym kliknięciem");
  });

  /**
   * ⚠️ **A number inside an entry is not a heading.** The 0.2.0 section says a
   * tab was withdrawn from the 0.1.0 release notes, so a search for the bare
   * number lands inside somebody else's section and the release for 0.1.0 would
   * announce the tail of 0.2.0.
   */
  test("a version number in the middle of an entry is not mistaken for its heading", () => {
    const first = getChangelogSection(CHANGELOG, "0.1.0");
    expect(first).not.toContain("wycofana z opisu wydania");
    expect(first).toContain("Nakładka z licznikiem obrażeń");
  });

  test("a version with no section is null rather than empty text", () => {
    expect(getChangelogSection(CHANGELOG, "9.9.9")).toBeNull();
  });

  // Empty notes are the outcome the release must not have, so the refusal is
  // loud and branded rather than a blank body nobody notices until it is public.
  test("composing notes for a version with no section refuses", () => {
    expect(() => composeReleaseNotes(CHANGELOG, "9.9.9")).toThrow(ChangelogError);
  });

  test("the notes carry the section and say which file to click", () => {
    const notes = composeReleaseNotes(CHANGELOG, manifest.version);
    expect(notes).toContain(getChangelogSection(CHANGELOG, manifest.version) ?? "");
    expect(notes).toContain("margometer.user.js");
    expect(notes).toContain("margometer.meta.js");
  });

  /**
   * Every entry in the file, typed. The rule at the top of the changelog says
   * each one opens with what kind of change it is, and a reader skimming for
   * **Zmiana** before updating is the reason it exists.
   */
  test("every entry in the file opens with its kind", () => {
    const untyped = CHANGELOG.split("\n")
      .filter((line) => line.startsWith("- "))
      .filter((line) => !ENTRY_TYPES.some((entry) => line.includes(entry)));

    expect(untyped).toEqual([]);
  });
});
