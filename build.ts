import manifest from "@/package.json";
import { composeJsonText } from "@/libs/json.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";

export class BundleError extends MargoMeterToolError {
  constructor(reason: string) {
    super("Bundle", reason);
  }
}

const OUTPUT_DIRECTORY = "./dist";
export const USERSCRIPT_FILENAME = "margometer.user.js";
/**
 * The metadata block on its own, and it exists for one reason: **0.5.0 polls
 * for it.**
 *
 * That release's `@updateURL` is
 * `releases/latest/download/margometer.meta.js`, so a release attaching only the
 * script leaves every copy installed from it checking a 404 — and a failed
 * update check says nothing to the person running it. They would simply stay on
 * 0.5.0 for good.
 *
 * It is also the cheaper poll for copies installed from here on: Tampermonkey
 * fetches this file to compare versions and the whole bundle only when there is
 * something to install.
 */
export const METADATA_FILENAME = "margometer.meta.js";
/**
 * The development build, which is a **different file with a different name** and
 * not a variant of the one above.
 *
 * Tampermonkey tells scripts apart by `@name`, so a development copy sharing the
 * release's would replace it on install and be replaced back by the next update
 * check — while the person running it watched their instrumented build turn into
 * the ordinary one for no reason they could see. It carries no `@updateURL` and
 * no `@downloadURL` for the same reason: nothing on a release page is this file,
 * and a poll for its next version would find somebody else's.
 */
export const DEVELOPMENT_USERSCRIPT_FILENAME = "margometer.dev.user.js";
export const DEVELOPMENT_NAME = "MargoMeter (dev)";
const BUNDLE_ENTRY_POINT = "./src/userscript-entry.ts";
/**
 * The seam the development build swaps, and where it swaps it to.
 *
 * ⚠️ **A `define` was tried first and does not work.** Bun substitutes the
 * constant and leaves the branch: measured on `1.3.14` with `minify: false`, a
 * flag defined as `false` arrives as `var flag = false`, the `if (flag)` under it
 * survives, and so does every module the branch imports. The recorder, the
 * overlay and `performance.now` would all have shipped inside the file people
 * install, switched off. Resolving one specifier elsewhere means the production
 * bundle never reaches them at all — which is a claim
 * `tests/tools/userscript-development.test.ts` checks against the built text.
 */
const INSTRUMENT_SPECIFIER = "@/src/userscript-instrument.ts";
const DEVELOPMENT_INSTRUMENT_PATH = "./src/userscript-instrument-development.ts";

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

export function composeUserscriptBanner(
  version: string,
  description: string,
  homepage: string,
  isDevelopment = false,
): string {
  const directives: UserscriptDirective[] = [
    ["name", isDevelopment ? DEVELOPMENT_NAME : "MargoMeter"],
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
     * ⚠️ **These point at release assets, so the release has to carry both.**
     * `.github/workflows/release.yml` builds and attaches them on a tag; a
     * release published by hand without them leaves every installed copy polling
     * a 404 — quietly, because that is what a failed update check does.
     *
     * The poll goes to the metadata file and the install to the script, which is
     * also the pair 0.5.0 was published with — so a copy installed from that
     * release keeps updating rather than stopping where it is.
     */
    ...(isDevelopment
      ? []
      : ([
          ["downloadURL", `${homepage}/releases/latest/download/${USERSCRIPT_FILENAME}`],
          ["updateURL", `${homepage}/releases/latest/download/${METADATA_FILENAME}`],
        ] as UserscriptDirective[])),
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

/** The two files a build produces, as text, before anything writes them down. */
export type UserscriptFiles = {
  /** Banner + bundle — what `dist/margometer.user.js` holds. */
  script: string;
  /** The banner alone — what `dist/margometer.meta.js` holds. */
  metadata: string;
};

/**
 * The bundle and its banner, composed in memory.
 *
 * Split out of the writer at its second consumer (§7.1): `tools/preview-server.ts`
 * serves the same text over HTTP instead of writing it to disk. What must not be
 * spelled twice is everything below — `iife` because Tampermonkey does not load
 * modules, `minify: false` because the file is meant to stay readable, and the
 * version substituted from `package.json` — since a preview built on different
 * settings is a preview of something nobody installs.
 *
 * ⚠️ **Both files come back from one call**, for the reason the writer used to
 * give: two compositions of the banner can disagree, and then an update check
 * compares against a version nobody shipped.
 */
export async function composeUserscriptFiles(isDevelopment = false): Promise<UserscriptFiles> {
  const result = await Bun.build({
    entrypoints: [BUNDLE_ENTRY_POINT],
    /**
     * One specifier resolved elsewhere, and only for the development build.
     *
     * The importer is checked so the swap cannot reach the file it swaps to: the
     * seam's own module graph is off limits to it. Nothing else about the two
     * builds differs, which is the point — a development build measuring a
     * bundle assembled under other settings would be measuring something nobody
     * runs.
     */
    plugins: isDevelopment
      ? [
          {
            name: "margometer-development-instrument",
            setup(builder) {
              builder.onResolve({ filter: /userscript-instrument\.ts$/ }, (arrival) => {
                if (arrival.path !== INSTRUMENT_SPECIFIER) return null;
                return { path: Bun.fileURLToPath(new URL(DEVELOPMENT_INSTRUMENT_PATH, import.meta.url)) };
              });
            },
          },
        ]
      : [],
    target: "browser",
    // Tampermonkey does not load ES modules, and the file is meant to stay
    // readable for whoever installs it — so IIFE, and no minification.
    format: "iife",
    minify: false,
    /**
     * ⚠️ **Without this `Bun.build` throws an `AggregateError` and never returns
     * a failed result**, so the check below was dead for the failure it was
     * written for: measured by appending a syntax error to a module under
     * `src/ui/`, where the default rejects with `Bundle failed` while
     * `throw: false` comes back with `success: false` and four logs naming the
     * line.
     *
     * It matters twice. A build here reported somebody else's error class instead
     * of ours, and `tools/preview-server.ts` catches `BundleError` narrowly to
     * show a failed rebuild in the browser — which it would never have caught.
     */
    throw: false,
    /**
     * The add-on's own version, substituted at build time.
     *
     * ⚠️ **One source, and it is `package.json`.** A constant in `src/` would be a
     * second one, and the two would part company at the first release nobody
     * remembered to edit twice — while the panel went on telling people a version
     * that was never shipped. Reports arrive as screenshots at least as often as
     * they arrive as files, which is the whole reason the number is on screen.
     */
    define: { __MARGOMETER_VERSION__: composeJsonText(manifest.version) },
  });

  /**
   * ⚠️ **The logs travel in the message, not to the console.** The preview server
   * shows a failed rebuild in a browser, where nobody is reading this terminal —
   * and a rebuild that fails silently leaves a stale panel on screen looking
   * exactly like a fresh one (§9.6).
   */
  if (!result.success) {
    throw new BundleError(`bundle failed\n${result.logs.map((log) => `${log}`).join("\n")}`);
  }

  const [artifact] = result.outputs;
  if (!artifact) throw new BundleError("bundle produced no output");

  const metadata = composeUserscriptBanner(
    manifest.version,
    manifest.description,
    manifest.homepage,
    isDevelopment,
  );
  return { script: metadata + (await artifact.text()), metadata };
}

/** Named for what it does now that the composing has left: it writes the two files. */
async function writeUserscriptFiles(): Promise<void> {
  const files = await composeUserscriptFiles();

  const outputPath = `${OUTPUT_DIRECTORY}/${USERSCRIPT_FILENAME}`;
  await Bun.write(outputPath, files.script);
  console.log(`built ${outputPath}`);

  const metadataPath = `${OUTPUT_DIRECTORY}/${METADATA_FILENAME}`;
  await Bun.write(metadataPath, files.metadata);
  console.log(`built ${metadataPath}`);
}

/**
 * The development build: one file, and deliberately no metadata beside it.
 *
 * Nothing polls this copy — it has no `@updateURL` — so a metadata file for it
 * would be a file with no reader, which is the thing §7.1 says does not get to
 * exist.
 */
async function writeDevelopmentUserscript(): Promise<void> {
  const files = await composeUserscriptFiles(true);

  const outputPath = `${OUTPUT_DIRECTORY}/${DEVELOPMENT_USERSCRIPT_FILENAME}`;
  await Bun.write(outputPath, files.script);
  console.log(`built ${outputPath}`);
}

if (import.meta.main) {
  if (process.argv.includes("--dev")) await writeDevelopmentUserscript();
  else await writeUserscriptFiles();
}
