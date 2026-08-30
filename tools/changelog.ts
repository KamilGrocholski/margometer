/**
 * The version this tree declares, and what `CHANGELOG.md` says about it — which is the body of a
 * release. **ADR 0018.**
 *
 * A function with a test rather than a line of shell inside a workflow: a line that runs only
 * when a tag is pushed is a line whose typo surfaces at the most expensive moment.
 */

import { assert } from "@std/assert";
import { METADATA_NAME, USERSCRIPT_NAME } from "@/tools/build-userscript.ts";
import { ChangelogError } from "@/tools/margometer-tool-error.ts";
import { CHANGELOG_FILE, CONFIGURATION_FILE } from "@/project/repository-layout.ts";

const VERSION_KEY = '"version":';
const QUOTE = '"';
const VERSION_HEADING_OPENER = "## [";
const SECTION_OPENER = "## ";
const USAGE = "usage: deno run -A tools/changelog.ts version | notes <version>";

/**
 * The version this tree declares, read by walking rather than parsed: `deno.json` carries
 * comments, so `JSON.parse` refuses the file and a reader of JSON with comments would be a
 * dependency this repository has no other use for. The first `"version":` is the tree's own — a
 * later one would belong to something nested inside it.
 */
export function getDeclaredVersion(configuration: string): string {
    assert(configuration.length > 0, "a configuration that was read says something");
    for (const line of configuration.split("\n")) {
        const stated = line.trim();
        if (!stated.startsWith(VERSION_KEY)) continue;
        const opening = stated.indexOf(QUOTE, VERSION_KEY.length);
        if (opening === -1) break;
        const closing = stated.indexOf(QUOTE, opening + 1);
        if (closing === -1) break;
        const declared = stated.slice(opening + 1, closing);
        assert(declared.length > 0, "a version that is declared is spelled out");
        return declared;
    }
    throw new ChangelogError(`${CONFIGURATION_FILE} declares no version to release`);
}

/**
 * The body of a version's section, without its heading, or `null` where the file has none.
 *
 * ⚠️ **Found by the heading, never by the number.** Version numbers stand inside entries too —
 * one section says a tab was withdrawn from the `0.1.0` release notes — so a search for the bare
 * number lands in the middle of a neighbour's section, and the release announces its tail.
 */
export function getChangelogSection(changelog: string, version: string): string | null {
    assert(version.length > 0, "a section is asked for by the version it is about");
    const lines = changelog.split("\n");
    const opener = `${VERSION_HEADING_OPENER}${version}]`;
    const start = lines.findIndex((line) => line.startsWith(opener));
    if (start === -1) return null;
    const rest = lines.slice(start + 1);
    const end = rest.findIndex((line) => line.startsWith(SECTION_OPENER));
    const section = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
    assert(!section.startsWith(SECTION_OPENER), "a section stops where the next one opens");
    return section;
}

/**
 * A release attaches four files: both of ours, and the two source archives GitHub adds and will
 * not let anybody remove. `margometer.meta.js` then reads as a second script to install, and
 * whoever installs it gets a metadata block with no code — an add-on that appears to install and
 * does nothing at all.
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

export function composeReleaseNotes(changelog: string, version: string): string {
    assert(version.length > 0, "a release is composed for a version that is named");
    const section = getChangelogSection(changelog, version);
    if (section === null) {
        throw new ChangelogError(
            `${CHANGELOG_FILE} has no section for ${version} — a release saying nothing about ` +
                "itself is worse than one delayed by the minute it takes to write a section",
        );
    }
    assert(section.length > 0, "and a section that exists says something");
    return `${section}\n\n${RELEASE_INSTALL_NOTE}\n`;
}

function printUsageAndStop(): never {
    assert(USAGE.length > 0, "a tool refusing a command says how it is called");
    console.error(USAGE);
    Deno.exit(1);
}

if (import.meta.main) {
    const [command, version] = Deno.args;
    if (command === "version") {
        console.log(getDeclaredVersion(Deno.readTextFileSync(CONFIGURATION_FILE)));
    } else if (command === "notes") {
        if (version === undefined) printUsageAndStop();
        console.log(composeReleaseNotes(Deno.readTextFileSync(CHANGELOG_FILE), version));
    } else {
        printUsageAndStop();
    }
}
