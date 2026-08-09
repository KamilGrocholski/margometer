import manifest from "@/package.json";

const OUTPUT_DIRECTORY = "./dist";
const USERSCRIPT_FILENAME = "margometer.user.js";
const BUNDLE_ENTRY_POINT = "./src/userscript-entry.ts";

/** Game worlds live on per-world subdomains; these are the site, not a world. */
const NON_GAME_HOSTS = ["www", "forum", "commons", "pomoc"];
const GAME_TOP_LEVEL_DOMAINS = ["pl", "com"];

export function userscriptBanner(version: string, description: string, homepage: string): string {
  const directives = [
    ["name", "MargoMeter"],
    ["namespace", homepage],
    ["version", version],
    ["description", description],
    ["author", manifest.author],
    ["homepageURL", homepage],
    // The trailing `/*` matters: @match compares the whole path, so a pattern
    // without it never fires on a world that carries a query string.
    ...GAME_TOP_LEVEL_DOMAINS.map((tld) => ["match", `https://*.margonem.${tld}/*`]),
    ...NON_GAME_HOSTS.flatMap((host) =>
      GAME_TOP_LEVEL_DOMAINS.map((tld) => ["exclude", `https://${host}.margonem.${tld}/*`]),
    ),
    ["noframes", ""],
    ["grant", "none"],
    ["run-at", "document-idle"],
  ];

  const body = directives
    .map(([key, value]) => `// @${key!.padEnd(12)} ${value}`.trimEnd())
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
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("bundle failed");
  }

  const [artifact] = result.outputs;
  if (!artifact) throw new Error("bundle produced no output");

  const banner = userscriptBanner(manifest.version, manifest.description, manifest.homepage);
  const outputPath = `${OUTPUT_DIRECTORY}/${USERSCRIPT_FILENAME}`;
  await Bun.write(outputPath, banner + (await artifact.text()));
  console.log(`built ${outputPath}`);
}

if (import.meta.main) await buildUserscript();
