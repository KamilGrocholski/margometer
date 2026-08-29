/**
 * The file a reader installs: the bundle, with the metadata block a script manager reads.
 *
 * Two checks stand over the result rather than over the sources, because what ships is the file
 * and not the tree: the bundle must carry no way of leaving the browser, and it must say whose it
 * is. Both are held here because this is where a built file exists.
 */

import { assert } from "@std/assert";
import { BUILD_VERSION } from "@/src/build-version.ts";
import { UserscriptBuildError } from "@/tools/margometer-tool-error.ts";

const BUNDLE_ENTRY = "src/userscript-boot.ts";
/** What the built file is called wherever it is served from, and not only under `dist/`. */
export const USERSCRIPT_NAME = "margometer.user.js";
const USERSCRIPT_FILE = `dist/${USERSCRIPT_NAME}`;
/** What the metadata file is called wherever it is served from, and not only under `dist/`. */
export const METADATA_NAME = "margometer.meta.js";
const METADATA_FILE = `dist/${METADATA_NAME}`;
const HOMEPAGE = "https://github.com/KamilGrocholski/margometer";

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
        throw new UserscriptBuildError("a build states the version it is");
    }
    const directives = composeDirectives(version);
    assert(directives.length > 0, "a banner states something");
    const lines = directives.map(([key, value]) => `// @${key.padEnd(12)} ${value}`.trimEnd());
    return `// ==UserScript==\n${lines.join("\n")}\n// ==/UserScript==\n`;
}

export function getOutboundCallsInText(text: string): string[] {
    assert(OUTBOUND_CALLS.length > 0, "there is something to look for");
    const found: string[] = [];
    for (const call of OUTBOUND_CALLS) {
        if (text.includes(call)) found.push(call);
    }
    assert(found.length <= OUTBOUND_CALLS.length, "each is reported once");
    return found;
}

/**
 * The version, written into the built text. This is the whole of what **S8** allows a build to
 * generate, and it throws rather than passing the text through: a constant that stopped being
 * found would ship every release with the panel claiming `0.0.0-dev`, which nothing else here
 * would notice.
 */
export function setVersionInBundle(bundle: string, version: string): string {
    assert(version.length > 0, "a build states the version it is");
    assert(BUILD_VERSION.length > 0, "and the constant it writes over is spelled");
    const parts = bundle.split(BUILD_VERSION);
    if (parts.length < 2) {
        throw new UserscriptBuildError(`the bundle states no version to write over: ${version}`);
    }
    return parts.join(version);
}

async function bundleUserscript(outputPath: string): Promise<string> {
    assert(outputPath.length > 0, "a bundler is told where to write");
    const bundling = new Deno.Command(Deno.execPath(), {
        args: [
            "bundle",
            "--platform=browser",
            "--config",
            "deno.json",
            "-o",
            outputPath,
            BUNDLE_ENTRY,
        ],
    }).output();
    const finished = await bundling;
    if (!finished.success) {
        const said = new TextDecoder().decode(finished.stderr);
        throw new UserscriptBuildError(`the bundler refused: ${said}`);
    }
    return await Deno.readTextFile(outputPath);
}

/** The two texts a build produces. Both from one call: two banners can disagree. */
export interface UserscriptFiles {
    /** The banner and the bundle under it, which is the file a reader installs. */
    script: string;
    /** The banner alone, which an installed copy polls for its next version. */
    metadata: string;
}

/**
 * The built text. The bundler has to be given somewhere to put its output, and a caller that
 * does not care is given a temporary file: the preview rebuilds on every save, and doing that
 * into `dist/` would churn what a release attaches and race the gate over it. Everything that
 * decides what the file **is** stays here, since a preview built on other settings is a preview
 * of something nobody installs.
 */
export async function composeUserscriptFiles(
    version: string,
    outputPath?: string,
): Promise<UserscriptFiles> {
    const metadata = composeUserscriptBanner(version);
    const written = outputPath ??
        await Deno.makeTempFile({ prefix: "margometer-", suffix: ".js" });
    const bundle = await bundleUserscript(written);
    if (outputPath === undefined) await Deno.remove(written);
    if (bundle.length === 0) {
        throw new UserscriptBuildError("the bundler wrote nothing");
    }
    const stamped = setVersionInBundle(bundle, version);
    const outbound = getOutboundCallsInText(stamped);
    if (outbound.length > 0) {
        throw new UserscriptBuildError(`the file could leave: ${outbound}`);
    }
    assert(metadata.length > 0, "a built file says whose it is");
    assert(stamped.length > 0, "and carries the program under it");
    return { script: `${metadata}${stamped}`, metadata };
}

export async function buildUserscript(version: string): Promise<string> {
    const files = await composeUserscriptFiles(version, USERSCRIPT_FILE);
    assert(files.script.startsWith(files.metadata), "the banner stands over the bundle");
    await Deno.writeTextFile(USERSCRIPT_FILE, files.script);
    await Deno.writeTextFile(METADATA_FILE, files.metadata);
    return USERSCRIPT_FILE;
}

if (import.meta.main) {
    const version = Deno.args[0] ?? BUILD_VERSION;
    const written = await buildUserscript(version);
    console.log(`${written} at ${version}`);
}
