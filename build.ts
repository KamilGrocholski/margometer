import manifest from "@/package.json";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";

class BundleError extends MargoMeterToolError {
  constructor(reason: string) {
    super("Bundle", reason);
  }
}

const OUTPUT_DIRECTORY = "./dist";
const USERSCRIPT_FILENAME = "margometer.user.js";
const BUNDLE_ENTRY_POINT = "./src/userscript-entry.ts";

/** Game worlds live on per-world subdomains; these are the site, not a world. */
const NON_GAME_HOSTS = ["www", "forum", "commons", "pomoc"];
const GAME_TOP_LEVEL_DOMAINS = ["pl", "com"];

/**
 * The same hosts as `@match` sees them, and the empty one is the point.
 *
 * ⚠️ **`*.margonem.pl` matches the bare `margonem.pl` as well as its
 * subdomains.** Match patterns: `*.` followed by part of the hostname matches
 * "the given host (and port) and any of its subdomains" — `*://*.mozilla.org/*`
 * is listed there as matching `https://mozilla.org/`
 * (developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns,
 * read 2026-08-11).
 *
 * So excluding `www` and leaving the bare domain out left the add-on loading on
 * the operator's own site, which is exactly what this list exists to prevent.
 */
const NON_GAME_HOST_PREFIXES = [...NON_GAME_HOSTS.map((host) => `${host}.`), ""];

/** A metadata directive: the key Tampermonkey reads, and its value. */
type UserscriptDirective = readonly [key: string, value: string];

export function composeUserscriptBanner(version: string, description: string, homepage: string): string {
  const directives: UserscriptDirective[] = [
    ["name", "MargoMeter"],
    ["namespace", homepage],
    ["version", version],
    ["description", description],
    ["author", manifest.author],
    ["homepageURL", homepage],
    /**
     * Where an installed copy looks for its next version.
     *
     * `releases/latest/download/<asset>` is GitHub's own stable redirect to the
     * newest release's asset, so nothing here carries a version number that
     * would have to be edited on every release — which is the mistake that makes
     * an add-on offer an update to the version it is already running.
     *
     * Both keys, not one: Tampermonkey reads `@updateURL` for the metadata block
     * it polls and `@downloadURL` for the file it then installs, and a copy with
     * only the first checks for updates it cannot fetch.
     *
     * ⚠️ **This points at a release asset, so the release has to carry one.**
     * `.github/workflows/release.yml` builds and attaches it on a tag; a release
     * published by hand without the file leaves every installed copy polling a
     * 404 — quietly, because that is what a failed update check does.
     */
    ["downloadURL", `${homepage}/releases/latest/download/${USERSCRIPT_FILENAME}`],
    ["updateURL", `${homepage}/releases/latest/download/${USERSCRIPT_FILENAME}`],
    // The trailing `/*` matters: @match compares the whole path, so a pattern
    // without it never fires on a world that carries a query string.
    ...GAME_TOP_LEVEL_DOMAINS.map(
      (tld) => ["match", `https://*.margonem.${tld}/*`] as UserscriptDirective,
    ),
    ...NON_GAME_HOST_PREFIXES.flatMap((host) =>
      GAME_TOP_LEVEL_DOMAINS.map(
        (tld) => ["exclude", `https://${host}margonem.${tld}/*`] as UserscriptDirective,
      ),
    ),
    ["noframes", ""],
    ["grant", "none"],
    // The pasted file is the only copy of the licence a user receives.
    ["license", "MIT"],
    ["run-at", "document-idle"],
  ];

  const body = directives
    .map(([key, value]) => `// @${key.padEnd(12)} ${value}`.trimEnd())
    .join("\n");

  return `// ==UserScript==\n${body}\n// ==/UserScript==\n`;
}

async function buildUserscript(): Promise<void> {
  const result = await Bun.build({
    entrypoints: [BUNDLE_ENTRY_POINT],
    target: "browser",
    // Tampermonkey does not load ES modules, and the file is meant to stay
    // readable for whoever installs it — so IIFE, and no minification.
    format: "iife",
    minify: false,
    /**
     * The add-on's own version, substituted at build time.
     *
     * ⚠️ **One source, and it is `package.json`.** A constant in `src/` would be a
     * second one, and the two would part company at the first release nobody
     * remembered to edit twice — while the panel went on telling people a version
     * that was never shipped. Reports arrive as screenshots at least as often as
     * they arrive as files, which is the whole reason the number is on screen.
     */
    define: { __MARGOMETER_VERSION__: JSON.stringify(manifest.version) },
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new BundleError("bundle failed");
  }

  const [artifact] = result.outputs;
  if (!artifact) throw new BundleError("bundle produced no output");

  const banner = composeUserscriptBanner(manifest.version, manifest.description, manifest.homepage);
  const outputPath = `${OUTPUT_DIRECTORY}/${USERSCRIPT_FILENAME}`;
  await Bun.write(outputPath, banner + (await artifact.text()));
  console.log(`built ${outputPath}`);
}

if (import.meta.main) await buildUserscript();
