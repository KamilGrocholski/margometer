/**
 * One release's section of `CHANGELOG.md`, which is what a GitHub release says.
 *
 * A pure function with a test rather than `sed` inside a YAML step, for the
 * reason `build.ts` exports its banner composer: a line that only ever runs when
 * a tag is pushed is a line whose typo surfaces at the most expensive moment.
 *
 * ⚠️ **The file it reads is the one document here written in Polish for
 * players** (AGENTS.md §3). This module's own words stay English, and it never
 * looks inside an entry — the boundary is the heading.
 *
 *     bun tools/changelog.ts notes 0.6.0
 */

import { readFileSync } from "node:fs";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";
import { METADATA_FILENAME, USERSCRIPT_FILENAME } from "@/build.ts";

export class ChangelogError extends MargoMeterToolError {
  constructor(reason: string, options?: ErrorOptions) {
    super("Changelog", reason, options);
  }
}

export const CHANGELOG_PATH = new URL("../CHANGELOG.md", import.meta.url).pathname;

/**
 * The body of a version's section, without its heading. `null` where there is
 * none — which is a reason to stop a release, not to publish an empty one.
 *
 * ⚠️ **Found by the heading, never by the number.** Version numbers appear
 * inside entries too — one section says a tab was withdrawn from the 0.1.0
 * release notes — and searching for the bare number lands in the middle of
 * somebody else's section, so a release would announce the tail of another one.
 */
export function getChangelogSection(changelog: string, version: string): string | null {
  const lines = changelog.split("\n");
  const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
  if (start === -1) return null;

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
}

/**
 * What every release says under its own entries: which file to click.
 *
 * A release lists four things — both of ours plus the source archives GitHub
 * attaches and will not let anyone remove. `margometer.meta.js` then reads as a
 * second script to install, and whoever installs it gets a metadata block with
 * no code: the add-on appears to install and does nothing at all.
 */
export const RELEASE_INSTALL_NOTE = [
  "---",
  "",
  `**Instalacja:** kliknij **\`${USERSCRIPT_FILENAME}\`** poniżej — Tampermonkey`,
  "rozpozna plik i zaproponuje instalację. Zainstalowana kopia sama sprawdza,",
  "czy jest nowsza wersja.",
  "",
  `\`${METADATA_FILENAME}\` to plik służbowy dla Tampermonkey, nie do klikania:`,
  "niesie sam nagłówek, bez ani jednej linii kodu.",
].join("\n");

export function composeReleaseNotes(changelog: string, version: string): string {
  const section = getChangelogSection(changelog, version);
  if (section === null) {
    throw new ChangelogError(
      `CHANGELOG.md has no section for ${version} — a release with nothing said about it ` +
        "is worse than a release delayed by the minute it takes to write one",
    );
  }
  return `${section}\n\n${RELEASE_INSTALL_NOTE}\n`;
}

if (import.meta.main) {
  const [command, version] = process.argv.slice(2);
  if (command === "notes" && version !== undefined) {
    console.log(composeReleaseNotes(readFileSync(CHANGELOG_PATH, "utf8"), version));
  } else {
    console.log("usage: bun tools/changelog.ts notes <version>");
  }
}
