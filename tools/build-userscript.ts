/**
 * The file a reader installs: the bundle under the metadata block a script manager reads
 * (`docs/design.md` §12, step 7). Two checks stand over the built text rather than over the tree,
 * because what ships is the file: it names the version it was built at, and it carries no way of
 * leaving the browser (`SECURITY.md` owns that rule).
 *
 *     deno task build            # the version deno.json declares, marked -dev
 *     deno task build 1.2.3      # a release
 */

import { assert, assertNotStrictEquals, assertStrictEquals } from "@std/assert";
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

export const BUNDLE_ENTRY = "src/userscript-boot.ts";
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
const NON_WORLD_HOSTS = ["www", "forum", "commons", "pomoc"];
const MARGONEM_DOMAINS = ["pl", "com"];
/** Anything by which a built file could leave the browser, wherever its text spells it. */
const OUTBOUND_CALLS = ["fetch(", "XMLHttpRequest", "sendBeacon", "new WebSocket", "EventSource"];
/**
 * The same ways out read as names in code. A redirect goes through the ambient `location` and a
 * beacon through the ambient `navigator`, so the object is what is looked for; one behind a dot is
 * a property of the page the entry was handed, which is how the add-on knows its world
 * (`SECURITY.md`).
 */
const AMBIENT_WAYS_OUT = [
    "location",
    "navigator",
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "sendBeacon",
    "importScripts",
    "Worker",
    "SharedWorker",
    "Image",
    "Request",
];
/** The tags this add-on builds. One that fetches when it is appended is not among them. */
const TAGS_BUILT = ["a", "div", "span", "style"];
const TAG_CALL = "createElement(";
const QUOTES = ['"', "'", "`"];
const TEMPLATE_QUOTE = "`";
const TEMPLATE_HOLE = "${";
const LINE_COMMENT = "//";
const BLOCK_COMMENT_OPEN = "/*";
const BLOCK_COMMENT_CLOSE = "*/";
const ESCAPE = "\\";
const WORD_CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$";
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
 * add-on's unless a caller hands another, which only a test does, to watch a refusal happen; the
 * tree is this one unless a caller hands a copy, which only `tools/panel-giving-way.ts` does.
 */
export async function readUserscriptFiles(
    version: string,
    entryPath = BUNDLE_ENTRY,
    root = ".",
): Promise<UserscriptFiles> {
    const metadata = encodeUserscriptBanner(version);
    let bundle: string;
    // Read what the bundler wrote off a file of its own, so no build churns `dist/` half-way.
    {
        assert(entryPath.length > 0, "a bundler is told what to read");
        assert(root.length > 0, "and which tree to read it in");
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
                entryPath,
            ],
            // ⚠️ Both the configuration and the entry are read in the tree handed, so a copy's `#/`
            // resolves into the copy: read from here, it would build this tree's panel unedited.
            cwd: root,
            stdout: "piped",
            stderr: "piped",
        });
        const finished = await bundling.output();
        if (!finished.success) {
            await Deno.remove(output);
            const said = new TextDecoder().decode(finished.stderr);
            throw new UserscriptBuildError(`the bundler refused: ${said}`);
        }
        bundle = await Deno.readTextFile(output);
        await Deno.remove(output);
        if (bundle.length === 0) throw new UserscriptBuildError("the bundler wrote nothing");
    }
    const stamped = requireBundleInBrowser(stampBundleVersion(bundle, version));
    const script = `${metadata}${stamped}`;
    assert(script.startsWith(metadata), "the banner stands over the bundle");
    return { script, metadata };
}

export function encodeUserscriptBanner(version: string): string {
    if (version.length === 0) {
        throw new UserscriptBuildError("a build states the version it is");
    }
    const directives = encodeUserscriptBannerDirectives(version);
    assert(directives.length > 0, "a banner states something");
    const lines = directives.map(([key, setting]) => {
        return `// @${key.padEnd(DIRECTIVE_KEY_WIDTH)} ${setting}`.trimEnd();
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
    for (const domain of MARGONEM_DOMAINS) {
        // A pattern without the trailing `/*` never fires on a world carrying a query.
        directives.push(["match", `https://*.margonem.${domain}/*`]);
    }
    // ⚠️ `*.margonem.pl` matches the bare domain too, so the bare one is excluded by name.
    for (const prefix of [...NON_WORLD_HOSTS.map((host) => `${host}.`), ""]) {
        for (const domain of MARGONEM_DOMAINS) {
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
    const outbound = [...lookupOutboundCalls(bundle), ...lookupAmbientWaysOut(bundle)];
    if (outbound.length > 0) {
        throw new UserscriptBuildError(`the file could leave the browser: ${outbound.join(", ")}`);
    }
    return bundle;
}

export function lookupOutboundCalls(text: string): string[] {
    const outbound = OUTBOUND_CALLS.filter((call) => text.includes(call));
    assert(outbound.length <= OUTBOUND_CALLS.length, "each is named once");
    return outbound;
}

/** Every ambient way out the code reaches for, and every tag it builds past the four, as `<img>`. */
export function lookupAmbientWaysOut(text: string): string[] {
    const code = composeCodeOutsideStrings(text);
    assertStrictEquals(code.length, text.length, "blanking keeps every offset");
    const reached = AMBIENT_WAYS_OUT.filter((name) => hasAmbientName(code, name));
    for (const tag of lookupTagsCreated(text, code)) {
        if (!TAGS_BUILT.includes(tag)) reached.push(`<${tag}>`);
    }
    return reached;
}

/**
 * The text with every string body and comment blanked, quotes and offsets kept, so a name read in
 * it is code. ⚠️ **A regular expression literal is read as code**: none is bundled (C7), and one
 * holding a quote would turn the walk inside out, which the refusal at its end is there to catch.
 */
function composeCodeOutsideStrings(text: string): string {
    const characters: string[] = [];
    // The brace depth each open `${` stands at, so the brace closing it returns to the template.
    const templateDepths: number[] = [];
    let quote = "";
    let depth = 0;
    let index = 0;
    for (let look = 0; index < text.length; look += 1) {
        assert(look < text.length, "every step of the walk moves it on");
        const character = text.charAt(index);
        const pair = text.slice(index, index + 2);
        if (quote === "") {
            if (pair === LINE_COMMENT) {
                const lineEnd = text.indexOf("\n", index);
                const end = lineEnd === -1 ? text.length : lineEnd;
                characters.push(" ".repeat(end - index));
                index = end;
                continue;
            }
            if (pair === BLOCK_COMMENT_OPEN) {
                const close = text.indexOf(BLOCK_COMMENT_CLOSE, index + pair.length);
                if (close === -1) throw new UserscriptBuildError("a comment never closes");
                const end = close + BLOCK_COMMENT_CLOSE.length;
                characters.push(" ".repeat(end - index));
                index = end;
                continue;
            }
            if (character === "{") depth += 1;
            else if (character === "}") {
                if (templateDepths.at(-1) === depth) {
                    templateDepths.pop();
                    quote = TEMPLATE_QUOTE;
                } else depth -= 1;
            } else if (QUOTES.includes(character)) quote = character;
            characters.push(character);
            index += 1;
            continue;
        }
        if (character === ESCAPE) {
            characters.push(" ".repeat(pair.length));
            index += pair.length;
            continue;
        }
        if (character === quote) {
            quote = "";
            characters.push(character);
            index += 1;
            continue;
        }
        if (quote === TEMPLATE_QUOTE) {
            if (pair === TEMPLATE_HOLE) {
                templateDepths.push(depth);
                quote = "";
                characters.push(pair);
                index += pair.length;
                continue;
            }
        }
        characters.push(" ");
        index += 1;
    }
    if (quote !== "") throw new UserscriptBuildError("a string never closes");
    if (templateDepths.length > 0) throw new UserscriptBuildError("a template never closes");
    return characters.join("");
}

/** ⚠️ **A name behind a dot is a property, not the ambient one**, and a longer word is not it. */
function hasAmbientName(code: string, name: string): boolean {
    assert(name.length > 0, "an empty name stands everywhere");
    let from = 0;
    for (let look = 0; look <= code.length; look += 1) {
        const nameAt = code.indexOf(name, from);
        if (nameAt === -1) return false;
        from = nameAt + 1;
        const before = code.charAt(nameAt - 1);
        if (before === ".") continue;
        if (isWordCharacter(before)) continue;
        if (isWordCharacter(code.charAt(nameAt + name.length))) continue;
        return true;
    }
    throw new UserscriptBuildError(`the walk for ${name} ran past the text it walks`);
}

/** `charAt` past either end answers "", which every string includes, so it is asked first. */
function isWordCharacter(character: string): boolean {
    if (character.length === 0) return false;
    return WORD_CHARACTERS.includes(character);
}

/** A tag named by a literal, read off the text where the code holds its quotes. */
function lookupTagsCreated(text: string, code: string): string[] {
    const tags: string[] = [];
    let from = 0;
    for (let look = 0; look <= code.length; look += 1) {
        const callAt = code.indexOf(TAG_CALL, from);
        if (callAt === -1) return tags;
        from = callAt + TAG_CALL.length;
        const quote = code.charAt(from);
        if (!QUOTES.includes(quote)) continue;
        const closes = code.indexOf(quote, from + 1);
        assertNotStrictEquals(closes, -1, "a string the walk opened, it closed");
        tags.push(text.slice(from + 1, closes));
    }
    throw new UserscriptBuildError("the walk for tags ran past the text it walks");
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
    const parsed: unknown = parseJsonc(configuration);
    if (!isRecord(parsed)) {
        throw new DeclaredVersionError(`${CONFIGURATION_FILE} is not a configuration`);
    }
    const declared = parsed.version;
    if (typeof declared !== "string") {
        throw new DeclaredVersionError(`${CONFIGURATION_FILE} declares no version to build at`);
    }
    if (declared.length === 0) {
        throw new DeclaredVersionError(`${CONFIGURATION_FILE} declares an empty version`);
    }
    if (declared.endsWith(DEVELOPMENT_SUFFIX)) {
        throw new DeclaredVersionError(
            `${CONFIGURATION_FILE} declares ${declared}, which is no release to build from`,
        );
    }
    return declared;
}

if (import.meta.main) {
    const version = Deno.args[0] ?? readDevelopmentVersion();
    const written = await writeUserscript(version);
    console.log(`${written} at ${version}`);
}
