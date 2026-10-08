/**
 * The file a reader installs: the bundle under the metadata block a script manager reads
 * (`docs/design.md` §12, step 7). Two checks stand over the built text rather than over the tree,
 * because what ships is the file: it names the version it was built at, and it carries no way of
 * leaving the browser (`SECURITY.md` owns that rule).
 *
 *     deno task build            # the version deno.json declares, marked -dev
 *     deno task build 1.2.3      # a release
 *
 * The development edition, which installs beside the release, is served by `deno task preview`.
 */

import { assert, assertNotStrictEquals, assertStrictEquals } from "@std/assert";
import { parse as parseJsonc } from "@std/jsonc";
import * as errors from "#/libs/errors.ts";
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

/**
 * What a script manager keys an installed copy by and polls it at: two editions under one
 * namespace are two scripts, so a development build installed beside the release replaces nothing.
 */
export interface UserscriptEdition {
    name: string;
    scriptAddress: string;
    metadataAddress: string;
}

export const BUNDLE_ENTRY = "src/userscript-boot.ts";
export const CONFIGURATION_FILE = "deno.json";
const OUTPUT_DIRECTORY = "dist";
/** The name the built file is served under anywhere, `dist/` included. */
export const USERSCRIPT_NAME = "margometer.user.js";
export const METADATA_NAME = "margometer.meta.js";
const HOMEPAGE = "https://github.com/KamilGrocholski/margometer";
/** GitHub's redirect to the newest release's asset, so no release edits an address. */
export const USERSCRIPT_DOWNLOAD_ADDRESS =
    `${HOMEPAGE}/releases/latest/download/${USERSCRIPT_NAME}`;
const METADATA_DOWNLOAD_ADDRESS = `${HOMEPAGE}/releases/latest/download/${METADATA_NAME}`;
export const RELEASE_EDITION: UserscriptEdition = {
    name: "MargoMeter",
    scriptAddress: USERSCRIPT_DOWNLOAD_ADDRESS,
    metadataAddress: METADATA_DOWNLOAD_ADDRESS,
};
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
    "Audio",
    "FontFace",
    "Request",
];
/**
 * A stylesheet fetches what it names, wherever in the text it is spelled: the panel's own sheet is
 * a string, which the names above are not read in. Only inline data is fetched from nowhere.
 */
const STYLE_URL_OPEN = "url(";
const STYLE_IMPORT = "@import";
const INLINE_SCHEME = "data:";
/** The tags this add-on builds. One that fetches when it is appended is not among them. */
const TAGS_BUILT = ["a", "div", "span", "style"];
/**
 * The tags the HTML Standard's index of attributes (read 2026-10-08) gives a URL fetched unasked —
 * `src`, `data`, `poster`, `srcset`, `link`'s `href` — with `meta`'s refresh and the obsolete
 * `frame`. `source` and `track` fetch only for an `audio`, `video` or `img` around them, which are
 * here, and both are words the bundle spells, so they are left out.
 */
const FETCHING_TAGS = [
    "audio",
    "embed",
    "frame",
    "iframe",
    "img",
    "input",
    "link",
    "meta",
    "object",
    "script",
    "video",
];
/** What a compared literal stands beside: the tail of `===` and `!==` is the whole of `==`, `!=`. */
const COMPARISONS = ["==", "!="];
const COMPARISON_LENGTH = 2;
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
/** `YYYYMMDDHHMM`, so a later build sorts higher as a number and as text alike. */
const DATED_MINUTE_LENGTH = 12;
const ISO_MINUTE_LENGTH = "YYYY-MM-DDTHH:MM".length;
const DIGITS = "0123456789";

/** The file, written where a release picks it up. Answers the path of the script it wrote. */
export async function writeUserscript(version: string): Promise<string> {
    assert(version.length > 0, "a build states the version it is");
    const files = await readUserscriptFiles(version);
    const script = `${OUTPUT_DIRECTORY}/${USERSCRIPT_NAME}`;
    const metadata = `${OUTPUT_DIRECTORY}/${METADATA_NAME}`;
    const made = errors.attempt(() => Deno.mkdirSync(OUTPUT_DIRECTORY, { recursive: true }));
    if (made instanceof errors.Caught) {
        throw new UserscriptBuildError(`${OUTPUT_DIRECTORY} cannot be made`, { cause: made });
    }
    const scriptWritten = errors.attempt(() => Deno.writeTextFileSync(script, files.script));
    if (scriptWritten instanceof errors.Caught) {
        throw new UserscriptBuildError(`${script} cannot be written`, { cause: scriptWritten });
    }
    const metadataWritten = errors.attempt(() => Deno.writeTextFileSync(metadata, files.metadata));
    if (metadataWritten instanceof errors.Caught) {
        throw new UserscriptBuildError(`${metadata} cannot be written`, {
            cause: metadataWritten,
        });
    }
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
    edition = RELEASE_EDITION,
): Promise<UserscriptFiles> {
    const metadata = encodeUserscriptBanner(version, edition);
    let bundle: string;
    // Read what the bundler wrote off a file of its own, so no build churns `dist/` half-way.
    {
        assert(entryPath.length > 0, "a bundler is told what to read");
        assert(root.length > 0, "and which tree to read it in");
        const output = errors.attempt(() =>
            Deno.makeTempFileSync({ prefix: "margometer-", suffix: ".js" })
        );
        if (output instanceof errors.Caught) {
            throw new UserscriptBuildError("no file for the bundler to write", { cause: output });
        }
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
        // A subprocess is a boundary of a tool's (E5), and only an awaited `try` holds a rejection.
        let finished: Deno.CommandOutput;
        try {
            finished = await bundling.output();
        } catch (failure) {
            throw new UserscriptBuildError("the bundler would not start", { cause: failure });
        }
        const bundled = finished.success
            ? errors.attempt(() => Deno.readTextFileSync(output))
            : null;
        const removed = errors.attempt(() => Deno.removeSync(output));
        if (removed instanceof errors.Caught) {
            throw new UserscriptBuildError(`${output} cannot be removed`, { cause: removed });
        }
        if (bundled === null) {
            const said = new TextDecoder().decode(finished.stderr);
            throw new UserscriptBuildError(`the bundler refused: ${said}`);
        }
        if (bundled instanceof errors.Caught) {
            throw new UserscriptBuildError(`${output} cannot be read`, { cause: bundled });
        }
        bundle = bundled;
        if (bundle.length === 0) throw new UserscriptBuildError("the bundler wrote nothing");
    }
    const stamped = requireBundleInBrowser(stampBundleVersion(bundle, version));
    const script = `${metadata}${stamped}`;
    assert(script.startsWith(metadata), "the banner stands over the bundle");
    return { script, metadata };
}

export function encodeUserscriptBanner(
    version: string,
    edition: Readonly<UserscriptEdition> = RELEASE_EDITION,
): string {
    if (version.length === 0) {
        throw new UserscriptBuildError("a build states the version it is");
    }
    const directives = encodeUserscriptBannerDirectives(version, edition);
    assert(directives.length > 0, "a banner states something");
    const lines = directives.map(([key, setting]) => {
        return `// @${key.padEnd(DIRECTIVE_KEY_WIDTH)} ${setting}`.trimEnd();
    });
    return `// ==UserScript==\n${lines.join("\n")}\n// ==/UserScript==\n`;
}

function encodeUserscriptBannerDirectives(
    version: string,
    edition: Readonly<UserscriptEdition>,
): [string, string][] {
    assert(version.length > 0, "a banner states the version it is");
    assert(edition.name.length > 0, "a manager keys a script by its name");
    const directives: [string, string][] = [
        ["name", edition.name],
        ["namespace", HOMEPAGE],
        ["version", version],
        ["description", "Czyta przebieg walki i pokazuje, na co się złożyła"],
        ["homepageURL", HOMEPAGE],
        // On a second host the file travels with no README, so the banner is the way back.
        ["supportURL", `${HOMEPAGE}/issues`],
        ["downloadURL", edition.scriptAddress],
        ["updateURL", edition.metadataAddress],
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
    const outbound = [
        ...lookupOutboundCalls(bundle),
        ...lookupAmbientWaysOut(bundle),
        ...lookupStyleFetches(bundle),
    ];
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

/** Every `url(` naming something other than inline data, and every `@import`, as written. */
export function lookupStyleFetches(text: string): string[] {
    const fetched: string[] = text.includes(STYLE_IMPORT) ? [STYLE_IMPORT] : [];
    let urlAt = text.indexOf(STYLE_URL_OPEN);
    for (let look = 0; look < text.length; look += 1) {
        if (urlAt === -1) break;
        // Past the quote that may open the target, and the escape a string puts before it.
        let targetAt = urlAt + STYLE_URL_OPEN.length;
        if (text.startsWith(ESCAPE, targetAt)) targetAt += ESCAPE.length;
        if (QUOTES.includes(text.charAt(targetAt))) targetAt += 1;
        if (!text.startsWith(INLINE_SCHEME, targetAt)) {
            fetched.push(text.slice(urlAt, targetAt + INLINE_SCHEME.length));
        }
        urlAt = text.indexOf(STYLE_URL_OPEN, urlAt + STYLE_URL_OPEN.length);
    }
    assert(urlAt === -1, "every reference was walked, which is what the bound is for");
    return fetched;
}

/**
 * Every ambient way out the code reaches for, every tag it builds past the four, and every tag that
 * fetches spelled anywhere in it, each tag as `<img>`.
 */
export function lookupAmbientWaysOut(text: string): string[] {
    const code = composeCodeOutsideStrings(text);
    assertStrictEquals(code.length, text.length, "blanking keeps every offset");
    const reached = AMBIENT_WAYS_OUT.filter((name) => hasAmbientName(code, name));
    for (const tag of lookupTagsCreated(text, code)) {
        if (!TAGS_BUILT.includes(tag)) reached.push(`<${tag}>`);
    }
    for (const tag of lookupFetchingTagLiterals(text, code)) {
        if (!reached.includes(tag)) reached.push(tag);
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

/**
 * Every string literal that is a tag fetching when it is appended, wherever the code spells it: the
 * panel hands its tag to `renderElement` and `renderText`, which call `createElement` with a name,
 * so the call a tag is spelled at is not the one that makes it. A literal compared is not one made
 * (`typeof held !== "object"`). ⚠️ **A template holding a hole is not read**, so `` `im${"g"}` ``
 * passes: the panel assembles no tag.
 */
function lookupFetchingTagLiterals(text: string, code: string): string[] {
    assertStrictEquals(code.length, text.length, "the code is read at the text's offsets");
    assert(
        FETCHING_TAGS.every((tag) => !TAGS_BUILT.includes(tag)),
        "no tag the add-on builds is one that fetches",
    );
    const tags: string[] = [];
    for (let opensAt = 0; opensAt < code.length; opensAt += 1) {
        const quote = code.charAt(opensAt);
        if (!QUOTES.includes(quote)) continue;
        for (const tag of FETCHING_TAGS) {
            // Two quotes the walk kept a tag apart hold one literal: no valid code spells a tag
            // between a quote closing and the next opening.
            const closesAt = opensAt + 1 + tag.length;
            if (code.charAt(closesAt) !== quote) continue;
            if (text.slice(opensAt + 1, closesAt).toLowerCase() !== tag) continue;
            if (isComparedLiteral(code, opensAt, closesAt)) continue;
            tags.push(`<${tag}>`);
        }
    }
    return tags;
}

/** Whether the literal between two quotes stands beside `==`, `===`, `!=` or `!==`. */
function isComparedLiteral(code: string, opensAt: number, closesAt: number): boolean {
    assert(opensAt < closesAt, "a literal opens before it closes");
    const before = code.slice(0, opensAt).trimEnd().slice(-COMPARISON_LENGTH);
    if (COMPARISONS.includes(before)) return true;
    const after = code.slice(closesAt + 1).trimStart().slice(0, COMPARISON_LENGTH);
    return COMPARISONS.includes(after);
}

/** The version `deno.json` declares, marked as no release of it. */
export function readDevelopmentVersion(): string {
    const configuration = errors.attempt(() => Deno.readTextFileSync(CONFIGURATION_FILE));
    if (configuration instanceof errors.Caught) {
        throw new DeclaredVersionError(`${CONFIGURATION_FILE} cannot be read`, {
            cause: configuration,
        });
    }
    const declared = parseDeclaredVersion(configuration);
    const version = `${declared}${DEVELOPMENT_SUFFIX}`;
    assert(version.startsWith(declared), "a development build names the work it is built from");
    return version;
}

/**
 * A development build's version with the minute it was built after it, in UTC, as one number: a
 * separate `.HHMM` would begin with a nought before ten o'clock, which semantic versioning refuses
 * in a numeric identifier, and a manager compares versions in its own way.
 */
export function formatDatedDevelopmentVersion(developmentVersion: string, moment: Date): string {
    assert(developmentVersion.endsWith(DEVELOPMENT_SUFFIX), "a dated build is a development one");
    assert(Number.isFinite(moment.getTime()), "a build was made at a moment");
    // `toISOString` writes UTC whatever zone the machine is in.
    const minute = [...moment.toISOString().slice(0, ISO_MINUTE_LENGTH)]
        .filter((character) => DIGITS.includes(character))
        .join("");
    assertStrictEquals(minute.length, DATED_MINUTE_LENGTH, "a minute is written at one width");
    return `${developmentVersion}.${minute}`;
}

/** `deno.json` carries comments, which `JSON.parse` refuses and `@std/jsonc` reads. */
export function parseDeclaredVersion(configuration: string): string {
    assert(configuration.length > 0, "a configuration that was read says something");
    const parsed = errors.attempt(() => parseJsonc(configuration));
    if (parsed instanceof errors.Caught) {
        throw new DeclaredVersionError(`${CONFIGURATION_FILE} is not JSON with comments`, {
            cause: parsed,
        });
    }
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
    if (version.length === 0) throw new UserscriptBuildError("a build is asked for at no version");
    const written = await writeUserscript(version);
    console.log(`${written} at ${version}`);
}
