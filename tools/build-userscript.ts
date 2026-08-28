/**
 * The file a reader installs: the bundle, with the metadata block a script manager reads.
 *
 * Two checks stand over the result rather than over the sources, because what ships is the file
 * and not the tree: the bundle must carry no way of leaving the browser, and it must say whose it
 * is. Both are held here because this is where a built file exists.
 */

import { assert } from "@std/assert";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";

const BUNDLE_ENTRY = "src/userscript-boot.ts";
const USERSCRIPT_FILE = "dist/margometer.user.js";
const METADATA_FILE = "dist/margometer.meta.js";
const HOMEPAGE = "https://github.com/KamilGrocholski/margometer";
/** The version a release passes in. A build nobody released says so rather than claim a number. */
const DEVELOPMENT_VERSION = "0.0.0-dev";

/** Worlds live on per-world subdomains; these are the operator's own site, not a world. */
const NON_GAME_HOSTS = ["www", "forum", "commons", "pomoc"];
const GAME_DOMAINS = ["pl", "com"];
/**
 * `*.margonem.pl` matches the bare `margonem.pl` as well as its subdomains, so the empty prefix
 * is what keeps the add-on off the operator's own site rather than only off its `www`.
 */
const NON_GAME_PREFIXES = [...NON_GAME_HOSTS.map((host) => `${host}.`), ""];
/** Anything by which a built file could leave the browser. `SECURITY.md` owns the rule. */
const OUTBOUND_CALLS = ["fetch(", "XMLHttpRequest", "sendBeacon", "new WebSocket", "EventSource"];

function composeDirectives(version: string): [string, string][] {
    assert(version.length > 0, "a build states the version it is");
    const directives: [string, string][] = [
        ["name", "MargoMeter"],
        ["namespace", HOMEPAGE],
        ["version", version],
        ["description", "Czyta przebieg walki i pokazuje, na co się złożyła"],
        ["homepageURL", HOMEPAGE],
        // GitHub's own redirect to the newest release's asset, so no version is written into a
        // URL that would then have to be edited on every release.
        ["downloadURL", `${HOMEPAGE}/releases/latest/download/margometer.user.js`],
        ["updateURL", `${HOMEPAGE}/releases/latest/download/margometer.meta.js`],
    ];
    for (const domain of GAME_DOMAINS) {
        // The trailing `/*` matters: a pattern without it never fires on a world carrying a query.
        directives.push(["match", `https://*.margonem.${domain}/*`]);
    }
    for (const prefix of NON_GAME_PREFIXES) {
        for (const domain of GAME_DOMAINS) {
            directives.push(["exclude", `https://${prefix}margonem.${domain}/*`]);
        }
    }
    directives.push(["noframes", ""], ["grant", "none"], ["license", "MIT"]);
    directives.push(["run-at", "document-idle"]);
    assert(directives.some(([key]) => key === "grant"), "a script asks the page for nothing");
    return directives;
}

export function composeUserscriptBanner(version: string): string {
    assert(typeof version === "string", "a version is stated as text");
    if (version.length === 0) {
        throw new MargoMeterToolError("UserscriptBuild", "a build states the version it is");
    }
    const directives = composeDirectives(version);
    assert(directives.length > 0, "a banner states something");
    const lines = directives.map(([key, value]) => `// @${key.padEnd(12)} ${value}`.trimEnd());
    return `// ==UserScript==\n${lines.join("\n")}\n// ==/UserScript==\n`;
}

/** What a built file must not carry, whatever the sources looked like. */
export function getOutboundCallsInText(text: string): string[] {
    assert(OUTBOUND_CALLS.length > 0, "there is something to look for");
    const found: string[] = [];
    for (const call of OUTBOUND_CALLS) {
        if (text.includes(call)) found.push(call);
    }
    assert(found.length <= OUTBOUND_CALLS.length, "each is reported once");
    return found;
}

async function bundleUserscript(): Promise<string> {
    const bundling = new Deno.Command(Deno.execPath(), {
        args: [
            "bundle",
            "--platform=browser",
            "--config",
            "deno.json",
            "-o",
            USERSCRIPT_FILE,
            BUNDLE_ENTRY,
        ],
    }).output();
    const finished = await bundling;
    if (!finished.success) {
        const said = new TextDecoder().decode(finished.stderr);
        throw new MargoMeterToolError("UserscriptBuild", `the bundler refused: ${said}`);
    }
    return await Deno.readTextFile(USERSCRIPT_FILE);
}

export async function buildUserscript(version: string): Promise<string> {
    const banner = composeUserscriptBanner(version);
    const bundle = await bundleUserscript();
    if (bundle.length === 0) {
        throw new MargoMeterToolError("UserscriptBuild", "the bundler wrote nothing");
    }
    const outbound = getOutboundCallsInText(bundle);
    if (outbound.length > 0) {
        throw new MargoMeterToolError("UserscriptBuild", `the file could leave: ${outbound}`);
    }
    await Deno.writeTextFile(USERSCRIPT_FILE, `${banner}${bundle}`);
    await Deno.writeTextFile(METADATA_FILE, banner);
    return USERSCRIPT_FILE;
}

if (import.meta.main) {
    const version = Deno.args[0] ?? DEVELOPMENT_VERSION;
    const written = await buildUserscript(version);
    console.log(`${written} at ${version}`);
}
