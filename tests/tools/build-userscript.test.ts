/**
 * The file a reader installs, built and then read back. The checks that matter here stand over
 * the built text rather than over the sources, because what ships is the file.
 */

import {
    assert,
    assertEquals,
    assertRejects,
    assertStringIncludes,
    assertThrows,
} from "@std/assert";
import { BUILD_VERSION } from "#/src/build-version.ts";
import {
    encodeUserscriptBanner,
    lookupAmbientWaysOut,
    lookupOutboundCalls,
    METADATA_NAME,
    parseDeclaredVersion,
    readUserscriptFiles,
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
    assertThrows(() => encodeUserscriptBanner(""), UserscriptBuildError, "the version");
});

Deno.test("the add-on stays off the operator's own site, bare domain included", () => {
    const banner = encodeUserscriptBanner("1.2.3");
    assertStringIncludes(banner, "@exclude      https://margonem.pl/*", "the bare domain");
    assertStringIncludes(banner, "@exclude      https://forum.margonem.pl/*", "the forum");
    assertStringIncludes(banner, "@match        https://*.margonem.pl/*", "while worlds match");
});

Deno.test("a reader of the built text flags what would leave the browser", () => {
    assertEquals(lookupOutboundCalls("const a = 1;"), [], "ordinary code carries none");
    assertEquals(lookupOutboundCalls("await fetch(url)"), ["fetch("], "a request is one");
    assertEquals(lookupOutboundCalls("new WebSocket(url)"), ["new WebSocket"], "so is this");
    assertEquals(requireBundleInBrowser("const a = 1;"), "const a = 1;", "a bundle staying passes");
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

Deno.test("a build writes its version over the constant, and refuses a text without one", () => {
    const said = `const version = "${BUILD_VERSION}"; console.log("${BUILD_VERSION}");`;
    assertEquals(
        stampBundleVersion(said, "1.2.3"),
        'const version = "1.2.3"; console.log("1.2.3");',
        "every place the bundler inlined it is written over, not the first",
    );
    assertEquals(stampBundleVersion(said, BUILD_VERSION), said, "and itself over itself is itself");
    assertThrows(() => stampBundleVersion("const v = 1;", "1.2.3"), UserscriptBuildError, "1.2.3");
});

Deno.test("the version a build takes by default is the one the configuration declares", () => {
    assertEquals(parseDeclaredVersion('{ // ours\n "version": "0.19.0" }'), "0.19.0", "a comment");
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
    assertEquals(metadata, encodeUserscriptBanner("1.2.3"), "the metadata file is the banner");
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
