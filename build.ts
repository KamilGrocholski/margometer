import pkg from "./package.json";

const OUT_DIR = "./dist";
export const USERSCRIPT_FILE = "margometer.user.js";

/** Game worlds live on per-world subdomains; these are the site, not a world. */
const NON_GAME_HOSTS = ["www", "forum", "commons", "pomoc"];
const TLDS = ["pl", "com"];

export function banner(version: string, description: string, homepage: string): string {
  const lines = [
    ["name", "MargoMeter"],
    ["namespace", homepage],
    ["version", version],
    ["description", description],
    ["author", pkg.author],
    ["homepageURL", homepage],
    // The trailing `/*` matters: @match compares the whole path, so a pattern
    // without it never fires on a world that carries a query string.
    ...TLDS.map((tld) => ["match", `https://*.margonem.${tld}/*`]),
    ...NON_GAME_HOSTS.flatMap((host) =>
      TLDS.map((tld) => ["exclude", `https://${host}.margonem.${tld}/*`]),
    ),
    ["noframes", ""],
    ["grant", "none"],
    ["run-at", "document-idle"],
  ];

  const body = lines
    .map(([key, value]) => `// @${key!.padEnd(12)} ${value}`.trimEnd())
    .join("\n");

  return `// ==UserScript==\n${body}\n// ==/UserScript==\n`;
}

async function build(): Promise<void> {
  const result = await Bun.build({
    entrypoints: ["./src/userscript.ts"],
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

  const head = banner(pkg.version, pkg.description, pkg.homepage);
  const path = `${OUT_DIR}/${USERSCRIPT_FILE}`;
  await Bun.write(path, head + (await artifact.text()));
  console.log(`built ${path}`);
}

if (import.meta.main) await build();
