/**
 * The file a reader installs: the bundle under the metadata block a script manager reads
 * (`docs/design.md` §12, step 7). Two checks stand over the built text rather than over the tree,
 * because what ships is the file: it names the version it was built at, and it carries no way of
 * leaving the browser (`develop:SECURITY.md` owns that rule).
 *
 *     deno task build            # the version deno.json declares, marked -dev
 *     deno task build 1.2.3      # a release
 */

import { assert, assertStrictEquals } from "@std/assert";
import { parse as parseJsonc } from "@std/jsonc";
import { isRecord } from "#/libs/unknown-value.ts";
import { BUILD_VERSION } from "#/src/build-version.ts";
import { DeclaredVersionError, UserscriptBuildError } from "./margometer-tool-error.ts";

/** The two texts a build writes, from one call so the two banners cannot disagree. */
export interface UserscriptFiles {
    /** The banner and the bundle under it, which is the file a reader installs. */
    script: string;
    /** The banner alone, which an installed copy polls for its next version. */
    metadata: string;
}

const BUNDLE_ENTRY = "src/userscript-boot.ts";
const CONFIGURATION_FILE = "deno.json";
const OUTPUT_DIRECTORY = "dist";
/** The name the built file is served under anywhere, `dist/` included. */
export const USERSCRIPT_NAME = "margometer.user.js";
export const METADATA_NAME = "margometer.meta.js";
const HOMEPAGE = "https://github.com/KamilGrocholski/margometer";
/** GitHub's redirect to the newest release's asset, so no release edits an address. */
export const USERSCRIPT_DOWNLOAD_ADDRESS =
    `${HOMEPAGE}/releases/latest/download/${USERSCRIPT_NAME}`;
const METADATA_DOWNLOAD_ADDRESS = `${HOMEPAGE}/releases/latest/download/${METADATA_NAME}`;
/** Worlds live on subdomains of their own; these are the operator's site, not a world. */
const NON_GAME_HOSTS = ["www", "forum", "commons", "pomoc"];
const GAME_DOMAINS = ["pl", "com"];
/** Anything by which a built file could leave the browser. */
const OUTBOUND_CALLS = ["fetch(", "XMLHttpRequest", "sendBeacon", "new WebSocket", "EventSource"];
/** Sorts below the release of that number, so a copy built here is offered the release. */
const DEVELOPMENT_SUFFIX = "-dev";
const DIRECTIVE_KEY_WIDTH = 12;

/** The file, written where a release picks it up. Answers the path of the script it wrote. */
export async function writeUserscript(version: string): Promise<string> {
    assert(version.length > 0, "a build states the version it is");
    const files = await readUserscriptFiles(version);
    const script = `${OUTPUT_DIRECTORY}/${USERSCRIPT_NAME}`;
    await Deno.mkdir(OUTPUT_DIRECTORY, { recursive: true });
    await Deno.writeTextFile(script, files.script);
    await Deno.writeTextFile(`${OUTPUT_DIRECTORY}/${METADATA_NAME}`, files.metadata);
    return script;
}

/**
 * The built text, refused where it names no version or could leave the browser. The entry is the
 * add-on's unless a caller hands another, which only a test does, to watch a refusal happen.
 */
export async function readUserscriptFiles(
    version: string,
    entry = BUNDLE_ENTRY,
): Promise<UserscriptFiles> {
    const metadata = encodeUserscriptBanner(version);
    const stamped = requireBundleInBrowser(stampBundleVersion(await readBundle(entry), version));
    const script = `${metadata}${stamped}`;
    assert(script.startsWith(metadata), "the banner stands over the bundle");
    return { script, metadata };
}

/** What the bundler wrote, read off a file of its own so no build churns `dist/` half-way. */
async function readBundle(entry: string): Promise<string> {
    assert(entry.length > 0, "a bundler is told what to read");
    const output = await Deno.makeTempFile({ prefix: "margometer-", suffix: ".js" });
    assert(output.length > 0, "a bundler is told where to write");
    const bundling = new Deno.Command(Deno.execPath(), {
        args: [
            "bundle",
            "--platform=browser",
            "--config",
            CONFIGURATION_FILE,
            "-o",
            output,
            entry,
        ],
        stdout: "piped",
        stderr: "piped",
    });
    const finished = await bundling.output();
    if (!finished.success) {
        await Deno.remove(output);
        const said = new TextDecoder().decode(finished.stderr);
        throw new UserscriptBuildError(`the bundler refused: ${said}`);
    }
    const bundle = await Deno.readTextFile(output);
    await Deno.remove(output);
    if (bundle.length === 0) throw new UserscriptBuildError("the bundler wrote nothing");
    return bundle;
}

export function encodeUserscriptBanner(version: string): string {
    if (version.length === 0) {
        throw new UserscriptBuildError("a build states the version it is");
    }
    const directives = encodeUserscriptBannerDirectives(version);
    assert(directives.length > 0, "a banner states something");
    const lines = directives.map(([key, value]) => {
        return `// @${key.padEnd(DIRECTIVE_KEY_WIDTH)} ${value}`.trimEnd();
    });
    return `// ==UserScript==\n${lines.join("\n")}\n// ==/UserScript==\n`;
}

function encodeUserscriptBannerDirectives(version: string): [string, string][] {
    assert(version.length > 0, "a banner states the version it is");
    const directives: [string, string][] = [
        ["name", "MargoMeter"],
        ["namespace", HOMEPAGE],
        ["version", version],
        ["description", "Czyta przebieg walki i pokazuje, na co się złożyła"],
        ["homepageURL", HOMEPAGE],
        // On a second host the file travels with no README, so the banner is the way back.
        ["supportURL", `${HOMEPAGE}/issues`],
        ["downloadURL", USERSCRIPT_DOWNLOAD_ADDRESS],
        ["updateURL", METADATA_DOWNLOAD_ADDRESS],
    ];
    for (const domain of GAME_DOMAINS) {
        // A pattern without the trailing `/*` never fires on a world carrying a query.
        directives.push(["match", `https://*.margonem.${domain}/*`]);
    }
    // ⚠️ `*.margonem.pl` matches the bare domain too, so the bare one is excluded by name.
    for (const prefix of [...NON_GAME_HOSTS.map((host) => `${host}.`), ""]) {
        for (const domain of GAME_DOMAINS) {
            directives.push(["exclude", `https://${prefix}margonem.${domain}/*`]);
        }
    }
    directives.push(["noframes", ""], ["grant", "none"], ["license", "MIT"]);
    directives.push(["run-at", "document-idle"]);
    return directives;
}

/**
 * The version written over the constant, everywhere the bundler inlined it: the whole of what S8
 * lets a build generate. A text naming no constant is refused, because a constant that stopped
 * being found would ship every release claiming `0.0.0-dev`, and nothing else would notice.
 */
export function stampBundleVersion(bundle: string, version: string): string {
    assert(version.length > 0, "a build states the version it is");
    assert(BUILD_VERSION.length > 0, "and the constant it writes over is spelled");
    const parts = bundle.split(BUILD_VERSION);
    if (parts.length < 2) {
        throw new UserscriptBuildError(`the bundle states no version to write over: ${version}`);
    }
    return parts.join(version);
}

/** The bundle, or a refusal naming every way it could leave the browser. */
export function requireBundleInBrowser(bundle: string): string {
    assert(bundle.length > 0, "a bundle that is checked says something");
    const outbound = lookupOutboundCalls(bundle);
    if (outbound.length > 0) {
        throw new UserscriptBuildError(`the file could leave the browser: ${outbound.join(", ")}`);
    }
    return bundle;
}

export function lookupOutboundCalls(text: string): string[] {
    const found = OUTBOUND_CALLS.filter((call) => text.includes(call));
    assert(found.length <= OUTBOUND_CALLS.length, "each is named once");
    return found;
}

/** The version `deno.json` declares, marked as no release of it. */
export function readDevelopmentVersion(): string {
    const declared = parseDeclaredVersion(Deno.readTextFileSync(CONFIGURATION_FILE));
    const version = `${declared}${DEVELOPMENT_SUFFIX}`;
    assert(version.startsWith(declared), "a development build names the work it is built from");
    return version;
}

/** `deno.json` carries comments, which `JSON.parse` refuses and `@std/jsonc` reads. */
export function parseDeclaredVersion(configuration: string): string {
    assert(configuration.length > 0, "a configuration that was read says something");
    const read: unknown = parseJsonc(configuration);
    if (!isRecord(read)) {
        throw new DeclaredVersionError(`${CONFIGURATION_FILE} is not a configuration`);
    }
    const declared = read.version;
    if (typeof declared !== "string") {
        throw new DeclaredVersionError(`${CONFIGURATION_FILE} declares no version to build at`);
    }
    if (declared.length === 0) {
        throw new DeclaredVersionError(`${CONFIGURATION_FILE} declares an empty version`);
    }
    assertStrictEquals(declared.endsWith(DEVELOPMENT_SUFFIX), false, "a declaration is a release");
    return declared;
}

if (import.meta.main) {
    const version = Deno.args[0] ?? readDevelopmentVersion();
    const written = await writeUserscript(version);
    console.log(`${written} at ${version}`);
}
