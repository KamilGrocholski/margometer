/**
 * A release's body, cut out of a changelog written here. The tool is held on samples, so a case
 * the tree's own `CHANGELOG.md` does not carry is held as well.
 */

import { assertEquals, assertStrictEquals, assertStringIncludes, assertThrows } from "@std/assert";
import {
    CHANGELOG_LINES_MAXIMUM,
    composeReleaseNotes,
    lookupChangelogSection,
} from "#/tools/changelog.ts";
import { ChangelogError } from "#/tools/margometer-tool-error.ts";

const CHANGELOG = [
    "# Changelog",
    "",
    "## [0.20.0] - 2026-09-30",
    "",
    "- Rewritten, and 0.19.0's figures drawn again on every recording.",
    "",
    "## [0.19.0] - 2026-09-20",
    "",
    "- A tab withdrawn from the 0.20.0 notes stays withdrawn.",
    "",
    "## [0.1.0] - 2026-07-01",
    "",
    "- First.",
].join("\n");

Deno.test("a section is found by its heading, and stops where the next one opens", () => {
    assertStrictEquals(
        lookupChangelogSection(CHANGELOG, "0.20.0"),
        "- Rewritten, and 0.19.0's figures drawn again on every recording.",
    );
    assertStrictEquals(
        lookupChangelogSection(CHANGELOG, "0.19.0"),
        "- A tab withdrawn from the 0.20.0 notes stays withdrawn.",
        "a version named inside another's entry is not its heading",
    );
    assertStrictEquals(lookupChangelogSection(CHANGELOG, "0.1.0"), "- First.", "the last runs out");
    assertStrictEquals(lookupChangelogSection(CHANGELOG, "0.2.0"), null);
    assertStrictEquals(lookupChangelogSection(CHANGELOG, "0.1"), null, "a prefix is no heading");
});

Deno.test("the notes are the section and how to install, and a missing one is refused", () => {
    const notes = composeReleaseNotes(CHANGELOG, "0.1.0");
    assertStringIncludes(notes, "- First.\n\n---\n");
    assertStringIncludes(notes, "kliknij **`margometer.user.js`**");
    assertStringIncludes(notes, "`margometer.meta.js` to plik służbowy");
    const error = assertThrows(() => composeReleaseNotes(CHANGELOG, "9.9.9"), ChangelogError);
    assertEquals(error.name, "MargoMeterTool/Changelog");
    assertThrows(
        () => composeReleaseNotes("## [1.0.0]\n\n## [0.9.0]\n", "1.0.0"),
        ChangelogError,
        "says nothing",
    );
});

Deno.test("a changelog past its bound on lines is refused, and one at the bound is read", () => {
    const atBound = `${CHANGELOG}${
        "\n".repeat(CHANGELOG_LINES_MAXIMUM - CHANGELOG.split("\n").length)
    }`;
    assertStrictEquals(
        atBound.split("\n").length,
        CHANGELOG_LINES_MAXIMUM,
        "the sample sits on it",
    );
    assertStringIncludes(lookupChangelogSection(atBound, "0.20.0") ?? "", "Rewritten");
    assertThrows(() => lookupChangelogSection(`${atBound}\n`, "0.20.0"), ChangelogError, "past");
});
