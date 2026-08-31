/**
 * The changelog against the version being released, which is the release gate moved into the
 * tests: a version bumped without a section would publish a release saying nothing about itself.
 * The declaration it is asked about is `tests/tools/declared-version.test.ts`'s.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { CHANGELOG_FILE, CONFIGURATION_FILE } from "@/project/repository-layout.ts";
import { composeReleaseNotes, getChangelogSection } from "@/tools/changelog.ts";
import { getDeclaredVersion } from "@/tools/declared-version.ts";
import { ChangelogError } from "@/tools/margometer-tool-error.ts";

const CHANGELOG = Deno.readTextFileSync(CHANGELOG_FILE);
const DECLARED = getDeclaredVersion(Deno.readTextFileSync(CONFIGURATION_FILE));
/** The three words an entry may open with, each drawn in bold. */
const ENTRY_KINDS = ["**Nowość**", "**Zmiana**", "**Poprawka**"];
/** What opens a version's own heading, and so what a section must stop before. */
const VERSION_HEADING = "## [";

Deno.test("the declared version has a section, and it says something", () => {
    const section = getChangelogSection(CHANGELOG, DECLARED);
    assert(section !== null, `${CHANGELOG_FILE} says nothing about ${DECLARED}`);
    assert(
        ENTRY_KINDS.some((kind) => section.includes(kind)),
        "a section carries at least one entry, opened with its kind",
    );
});

Deno.test("a section stops where the next one opens", () => {
    const section = getChangelogSection(CHANGELOG, DECLARED) ?? "";
    const headings = section.split("\n").filter((line) => line.startsWith(VERSION_HEADING));
    assertEquals(headings, [], "a section that runs on announces its neighbour as its own");
    const sample = "## [1.0.0]\n\n- one\n\n## [0.9.0]\n\n- other\n";
    assertEquals(getChangelogSection(sample, "1.0.0"), "- one", "the reader stops on its sample");
    assertEquals(getChangelogSection(sample, "0.9.0"), "- other", "and reads the last one whole");
});

/**
 * A released section is frozen — somebody already has that release — so it is the safe place to
 * check that the boundaries run where they should. `0.4.0` carries entries of two kinds, and the
 * section under it is `0.3.0`.
 */
Deno.test("a released section covers its own version and no neighbour", () => {
    const released = getChangelogSection(CHANGELOG, "0.4.0") ?? "";
    assert(released.includes("**Nowość**"), "0.4.0 opens with what it added");
    assert(released.includes("**Zmiana**"), "and states what it changed");
    assert(!released.includes("## [0.3.0]"), "the heading below it is not part of it");
    assert(!released.includes("da się pobrać"), "and neither is what that section says");
});

/**
 * ⚠️ **A number inside an entry is not a heading.** The `0.2.0` section says a tab was withdrawn
 * from the `0.1.0` release notes, so a search for the bare number lands inside a neighbour's
 * section and the release for `0.1.0` would announce the tail of `0.2.0`.
 */
Deno.test("a version number in the middle of an entry is not mistaken for its heading", () => {
    const first = getChangelogSection(CHANGELOG, "0.1.0") ?? "";
    assert(first.includes("Nakładka z licznikiem obrażeń"), "0.1.0 is read from its own heading");
    assert(!first.includes("wycofana z opisu wydania"), "and never from a mention of its number");
});

Deno.test("a version with no section is null rather than empty text", () => {
    assertEquals(getChangelogSection(CHANGELOG, "9.9.9"), null, "nothing is said about it");
    assertThrows(
        () => composeReleaseNotes(CHANGELOG, "9.9.9"),
        ChangelogError,
        "9.9.9",
    );
});

Deno.test("the notes carry the section and say which file to click", () => {
    const notes = composeReleaseNotes(CHANGELOG, DECLARED);
    assert(notes.includes(getChangelogSection(CHANGELOG, DECLARED) ?? ""), "the section is in it");
    assert(notes.includes("**Instalacja:** kliknij"), "and a player is told what to press");
    assert(notes.includes("margometer.user.js"), "the file they install is named");
    assert(notes.includes("margometer.meta.js"), "and so is the one they must not");
});

/**
 * Every entry in the file, typed. A reader skimming for **Zmiana** before updating is why the
 * rule at the top of the file exists, and an untyped entry is invisible to them.
 */
Deno.test("every entry in the file opens with its kind", () => {
    const untyped = CHANGELOG.split("\n")
        .filter((line) => line.startsWith("- "))
        .filter((line) => !ENTRY_KINDS.some((kind) => line.includes(kind)));
    assertEquals(untyped, [], "an entry nobody can skim");
});
