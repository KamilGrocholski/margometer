/**
 * The file a reader installs, built and then read back. The checks that matter here stand over
 * the built text rather than over the sources, because what ships is the file.
 */

import {
    assert,
    assertEquals,
    assertRejects,
    assertStrictEquals,
    assertStringIncludes,
    assertThrows,
} from "@std/assert";
import { BUILD_VERSION } from "#/src/build-version.ts";
import {
    encodeUserscriptBanner,
    formatDatedDevelopmentVersion,
    lookupAmbientWaysOut,
    lookupOutboundCalls,
    lookupStyleFetches,
    METADATA_NAME,
    parseDeclaredVersion,
    readUserscriptFiles,
    RELEASE_EDITION,
    requireBundleInBrowser,
    stampBundleVersion,
    USERSCRIPT_DOWNLOAD_ADDRESS,
    writeUserscript,
} from "#/tools/build-userscript.ts";
import { DeclaredVersionError, UserscriptBuildError } from "#/tools/margometer-tool-error.ts";

/**
 * What a host that forbids minifying takes, in the same rule that forbids it: a file past it has
 * lost the channel, and that is learnt at the gate. `develop ADR 0099`.
 */
const PUBLISHED_BYTES_MAXIMUM = 2_000_000;

Deno.test("the banner says what a script manager reads, and refuses to say nothing", () => {
    const banner = encodeUserscriptBanner("1.2.3");
    assert(banner.startsWith("// ==UserScript==\n"), "it opens the way a manager expects");
    assert(banner.trimEnd().endsWith("// ==/UserScript=="), "and closes the same way");
    assertStringIncludes(banner, "// @version      1.2.3", "carrying the version it was handed");
    assertStringIncludes(banner, "// @grant        none", "and asking the page for nothing");
    assertStringIncludes(
        banner,
        "// @supportURL   https://github.com/KamilGrocholski/margometer/issues",
        "and saying where a failure goes",
    );
    assertStringIncludes(
        banner,
        `// @downloadURL  ${USERSCRIPT_DOWNLOAD_ADDRESS}`,
        "the address an installed copy polls is one address",
    );
    assertStringIncludes(banner, "// @name         MargoMeter\n", "under the release's name");
    assertThrows(() => encodeUserscriptBanner(""), UserscriptBuildError, "the version");
});

Deno.test("an edition of its own is a script of its own, polled where it was installed", () => {
    const edition = {
        name: "MargoMeter Dev",
        scriptAddress: "http://127.0.0.1:4173/margometer-dev.user.js",
        metadataAddress: "http://127.0.0.1:4173/margometer-dev.meta.js",
    };
    const banner = encodeUserscriptBanner("1.2.3-dev.202610081432", edition);
    assertStringIncludes(banner, "// @name         MargoMeter Dev\n", "a name the release lacks");
    assertStringIncludes(
        banner,
        "// @namespace    https://github.com/KamilGrocholski/margometer\n",
        "in the release's namespace",
    );
    assertStringIncludes(banner, `// @downloadURL  ${edition.scriptAddress}\n`, "fetched here");
    assertStringIncludes(banner, `// @updateURL    ${edition.metadataAddress}\n`, "polled here");
    assert(!banner.includes("releases/latest"), "and never offered the release over itself");
    assertStrictEquals(
        encodeUserscriptBanner("1.2.3", RELEASE_EDITION),
        encodeUserscriptBanner("1.2.3"),
        "an edition unnamed is the release",
    );
});

Deno.test("a dated build names its minute in UTC, at one width, and only on a development one", () => {
    const formatBuiltAt = (iso: string) =>
        formatDatedDevelopmentVersion("1.2.3-dev", new Date(iso));
    assertStrictEquals(
        formatBuiltAt("2026-01-02T03:04:05Z"),
        "1.2.3-dev.202601020304",
        "padded with noughts",
    );
    assertStrictEquals(
        formatBuiltAt("2026-10-08T14:32:59.999Z"),
        "1.2.3-dev.202610081432",
        "to the minute",
    );
    assertStrictEquals(
        formatBuiltAt("2026-10-08T23:30:00+02:00"),
        "1.2.3-dev.202610082130",
        "in UTC",
    );
    assertStrictEquals(
        formatBuiltAt("2026-12-31T23:59:00Z"),
        "1.2.3-dev.202612312359",
        "the last minute",
    );
    assertStrictEquals(
        formatBuiltAt("2027-01-01T00:00:00Z"),
        "1.2.3-dev.202701010000",
        "and the first",
    );
    assert(
        formatBuiltAt("2027-01-01T00:00:00Z") > formatBuiltAt("2026-12-31T23:59:00Z"),
        "a later build sorts higher",
    );
    assertThrows(() => formatDatedDevelopmentVersion("1.2.3", new Date()), Error, "development");
});

Deno.test("the add-on stays off the operator's own site, bare domain included", () => {
    const banner = encodeUserscriptBanner("1.2.3");
    assertStringIncludes(banner, "@exclude      https://margonem.pl/*", "the bare domain");
    assertStringIncludes(banner, "@exclude      https://forum.margonem.pl/*", "the forum");
    assertStringIncludes(banner, "@match        https://*.margonem.pl/*", "while worlds match");
});

/** `SECURITY.md`: no image or stylesheet request of ours. The sheet is a string the code builds. */
Deno.test("a stylesheet naming anything but inline data is flagged, and inline data is not", () => {
    const inline = 'const sheet = ".a{mask:url(\\"data:image/svg+xml,%3Csvg%3E\\")}";';
    assertEquals(lookupStyleFetches(inline), [], "an escaped quote and inline data");
    assertEquals(lookupStyleFetches("b{mask:url(data:x)}"), [], "and inline data bare");
    assertEquals(
        lookupStyleFetches('b{mask:url("https://host/x.svg")}'),
        ['url("https'],
        "a host is a request",
    );
    assertEquals(lookupStyleFetches("b{mask:url(x.svg)}"), ["url(x.svg"], "and so is a path");
    assertEquals(lookupStyleFetches('@import "x.css";'), ["@import"], "and an import");
    assertThrows(
        () => requireBundleInBrowser('const sheet = "b{mask:url(https://host/x.svg)}";'),
        UserscriptBuildError,
        "url(",
        "and the build refuses it",
    );
});

Deno.test("a reader of the built text flags what would leave the browser", () => {
    assertEquals(lookupOutboundCalls("const a = 1;"), [], "ordinary code carries none");
    assertEquals(lookupOutboundCalls("await fetch(url)"), ["fetch("], "a request is one");
    assertEquals(lookupOutboundCalls("new WebSocket(url)"), ["new WebSocket"], "so is this");
    assertStrictEquals(
        requireBundleInBrowser("const a = 1;"),
        "const a = 1;",
        "a bundle staying passes",
    );
    assertThrows(
        () => requireBundleInBrowser("navigator.sendBeacon(url)"),
        UserscriptBuildError,
        "sendBeacon",
        "and one that could leave is refused, naming how",
    );
});

Deno.test("a way out reached through an object is read as a name in code, and nowhere else", () => {
    assertEquals(lookupAmbientWaysOut("location.href = to;"), ["location"], "a redirect");
    assertEquals(lookupAmbientWaysOut("navigator.sendBeacon(to);"), ["navigator"], "a beacon");
    assertEquals(
        lookupAmbientWaysOut('document.createElement("img");'),
        ["<img>"],
        "a fetching tag",
    );
    assertEquals(lookupAmbientWaysOut("const to = `${location.href}`;"), ["location"], "a hole");
    assertEquals(lookupAmbientWaysOut("const held = new Image();"), ["Image"], "a constructor");
    const staying = [
        "const world = page.location.hostname;",
        'const LOCATION_FIELD = "location";',
        "// the ambient navigator is somebody else's",
        "/* location */ const relocation = 1;",
        'document.createElement("div"); document.createElement(tag);',
        "const said = `the location ${{ count }.count} times`;",
        "const quoted = 'a \\' location';",
    ];
    for (const code of staying) assertEquals(lookupAmbientWaysOut(code), [], code);
    assertThrows(
        () => lookupAmbientWaysOut('const open = "location;'),
        UserscriptBuildError,
        "never",
    );
    assertThrows(
        () => requireBundleInBrowser("location.assign(to);"),
        UserscriptBuildError,
        "could leave the browser: location",
        "and a bundle reaching for one is refused, naming it",
    );
});

Deno.test("a tag that fetches is flagged wherever a literal spells it, and not where compared", () => {
    assertEquals(
        lookupAmbientWaysOut('renderElement(document, "img", null);'),
        ["<img>"],
        "handed to the panel's own maker",
    );
    assertEquals(
        lookupAmbientWaysOut("renderText(document, 'SCRIPT', said);"),
        ["<script>"],
        "in either case",
    );
    assertEquals(lookupAmbientWaysOut("const tag = `iframe`;"), ["<iframe>"], "held for later");
    assertEquals(lookupAmbientWaysOut("const held = new Audio(to);"), ["Audio"], "a sound");
    assertEquals(lookupAmbientWaysOut("new FontFace(name, to);"), ["FontFace"], "and a font");
    const staying = [
        'if (typeof held !== "object") return;',
        'const isRecord = "object" === typeof held;',
        'const said = "an img here";',
        '// renderElement(document, "img")',
        'const OPENED = { source: "source", track: "track" };',
        "const said = `${count} img`;",
        'renderElement(document, "div", null);',
    ];
    for (const code of staying) assertEquals(lookupAmbientWaysOut(code), [], code);
    assertThrows(
        () => requireBundleInBrowser('renderElement(document, "video", null);'),
        UserscriptBuildError,
        "could leave the browser: <video>",
        "and a bundle spelling one is refused, naming it",
    );
});

Deno.test("a build writes its version over the constant, and refuses a text without one", () => {
    const said = `const version = "${BUILD_VERSION}"; console.log("${BUILD_VERSION}");`;
    assertStrictEquals(
        stampBundleVersion(said, "1.2.3"),
        'const version = "1.2.3"; console.log("1.2.3");',
        "every place the bundler inlined it is written over, not the first",
    );
    assertStrictEquals(
        stampBundleVersion(said, BUILD_VERSION),
        said,
        "and itself over itself is itself",
    );
    assertThrows(() => stampBundleVersion("const v = 1;", "1.2.3"), UserscriptBuildError, "1.2.3");
});

Deno.test("the version a build takes by default is the one the configuration declares", () => {
    assertStrictEquals(
        parseDeclaredVersion('{ // ours\n "version": "0.19.0" }'),
        "0.19.0",
        "a comment",
    );
    assertThrows(() => parseDeclaredVersion("{"), DeclaredVersionError, "not JSON with comments");
    assertThrows(() => parseDeclaredVersion("[]"), DeclaredVersionError, "not a configuration");
    assertThrows(() => parseDeclaredVersion("{}"), DeclaredVersionError, "no version");
    assertThrows(() => parseDeclaredVersion('{"version":""}'), DeclaredVersionError, "empty");
    assertThrows(
        () => parseDeclaredVersion('{"version":"0.19.0-dev"}'),
        DeclaredVersionError,
        "no release",
    );
});

Deno.test("the file that would be installed carries the banner and no way out", async () => {
    const written = await writeUserscript("1.2.3");
    const built = await Deno.readTextFile(written);
    assert(built.startsWith("// ==UserScript==\n"), "the banner is first, where a manager looks");
    assertStringIncludes(built, "// @version      1.2.3", "at the version it was built for");
    assert(!built.includes(BUILD_VERSION), "and the panel below says it, not the development one");
    assertEquals(lookupOutboundCalls(built), [], "and nothing in it can leave the browser");
    assertEquals(lookupAmbientWaysOut(built), [], "not even through an object the page carries");
    assertStringIncludes(built, "startMargoMeter", "the entry is in there beneath it");
    assert(
        built.length < PUBLISHED_BYTES_MAXIMUM,
        "inside what a host that forbids minifying takes",
    );
    const metadata = await Deno.readTextFile(`dist/${METADATA_NAME}`);
    assertStrictEquals(
        metadata,
        encodeUserscriptBanner("1.2.3"),
        "the metadata file is the banner",
    );
    assert(built.startsWith(metadata), "which is what an installed copy polls");
});

Deno.test("a bundle that could leave the browser is refused before it is written", async () => {
    const directory = Deno.makeTempDirSync({ prefix: "margometer-leaving-" });
    const entryPath = `${directory}/leaving.ts`;
    const version = new URL("../../src/build-version.ts", import.meta.url).href;
    Deno.writeTextFileSync(
        entryPath,
        `import { BUILD_VERSION } from "${version}";\nawait fetch(BUILD_VERSION);\n`,
    );
    await assertRejects(
        () => readUserscriptFiles("1.2.3", entryPath),
        UserscriptBuildError,
        "could leave the browser: fetch(",
    );
    Deno.removeSync(directory, { recursive: true });
});
