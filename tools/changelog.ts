/**
 * What `CHANGELOG.md` says about a version, as the body of its release, and the version this tree
 * declares, for a workflow to compare with the tag. A function with a test rather than a line of
 * shell in a workflow: a line that runs only when a tag is pushed has its typo found at the most
 * expensive moment (`develop ADR 0018`). The declaration is read by `tools/build-userscript.ts`.
 *
 *     deno task release:notes version
 *     deno task release:notes notes <version>
 */

import { assert } from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { METADATA_NAME, parseDeclaredVersion, USERSCRIPT_NAME } from "./build-userscript.ts";
import { ChangelogError } from "./margometer-tool-error.ts";

const CHANGELOG_FILE = "CHANGELOG.md";
const CONFIGURATION_FILE = "deno.json";
const VERSION_HEADING_OPENER = "## [";
const SECTION_OPENER = "## ";
/** Far past any changelog a person keeps; a file longer than this is not one. */
const CHANGELOG_LINES_MAXIMUM = 100_000;
const USAGE = "usage: deno task release:notes version | notes <version>";
/**
 * A release attaches both of our files and the two source archives GitHub adds and will not let
 * anybody remove. `margometer.meta.js` then reads as a second script to install, and installing it
 * gives a header with no code: an add-on that appears to install and does nothing.
 */
const RELEASE_INSTALL_NOTE = [
    "---",
    "",
    `**Instalacja:** kliknij **\`${USERSCRIPT_NAME}\`** poniżej — Tampermonkey rozpozna plik`,
    "i zaproponuje instalację. Zainstalowana kopia sama sprawdza, czy jest nowsza wersja.",
    "",
    `\`${METADATA_NAME}\` to plik służbowy dla Tampermonkey, nie do klikania: niesie sam`,
    "nagłówek, bez ani jednej linii kodu.",
].join("\n");

/** The section's body, or a refusal: a release saying nothing about itself is worse than a late one. */
export function composeReleaseNotes(changelog: string, version: string): string {
    assert(version.length > 0, "a release is composed for a version that is named");
    const section = lookupChangelogSection(changelog, version);
    if (section === null) {
        throw new ChangelogError(`${CHANGELOG_FILE} has no section for ${version}`);
    }
    if (section.length === 0) {
        throw new ChangelogError(`${CHANGELOG_FILE}'s section for ${version} says nothing`);
    }
    return `${section}\n\n${RELEASE_INSTALL_NOTE}\n`;
}

/**
 * The body under a version's heading, without it, or null where the file has none.
 *
 * ⚠️ **Found by the heading, never by the number.** A version stands inside entries too, so a
 * search for the bare number lands in a neighbour's section and the release announces its tail.
 */
export function lookupChangelogSection(changelog: string, version: string): string | null {
    assert(version.length > 0, "a section is asked for by the version it is about");
    const lines = changelog.split("\n");
    assert(lines.length <= CHANGELOG_LINES_MAXIMUM, "a changelog stays inside its bound");
    const opener = `${VERSION_HEADING_OPENER}${version}]`;
    const start = lines.findIndex((line) => line.startsWith(opener));
    if (start === -1) return null;
    const rest = lines.slice(start + 1);
    const end = rest.findIndex((line) => line.startsWith(SECTION_OPENER));
    const section = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
    assert(!section.includes(`\n${SECTION_OPENER}`), "a section stops where the next one opens");
    return section;
}

/** A file this tool reads, or a refusal naming it: a missing changelog is a release unwritten. */
function readReleaseFile(path: string): string {
    assert(path.length > 0, "a file is read from somewhere");
    const read = errors.attempt(() => Deno.readTextFileSync(path));
    if (read instanceof Error) throw new ChangelogError(`${path} cannot be read`, { cause: read });
    return read;
}

if (import.meta.main) {
    const [command, version] = Deno.args;
    if (command === "version") {
        console.log(parseDeclaredVersion(readReleaseFile(CONFIGURATION_FILE)));
    } else if (command === "notes") {
        if (version === undefined) throw new ChangelogError(USAGE);
        console.log(composeReleaseNotes(readReleaseFile(CHANGELOG_FILE), version));
    } else {
        throw new ChangelogError(USAGE);
    }
}
