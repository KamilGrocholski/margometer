/**
 * The file a reader installs, built and then read back.
 *
 * The checks that matter here are over the built text rather than over the sources, because what
 * ships is the file: a bundle that could leave the browser is a bundle nobody may publish, however
 * the tree it came from looked.
 */

import { assert, assertEquals, assertStringIncludes, assertThrows } from "@std/assert";
import { BUILD_VERSION } from "@/src/build-version.ts";
import {
    buildUserscript,
    composeUserscriptBanner,
    getOutboundCallsInText,
    setVersionInBundle,
} from "@/tools/build-userscript.ts";
import { UserscriptBuildError } from "@/tools/margometer-tool-error.ts";

Deno.test("the banner says what a script manager reads, and refuses to say nothing", () => {
    const banner = composeUserscriptBanner("1.2.3");
    assert(banner.startsWith("// ==UserScript==\n"), "it opens the way a manager expects");
    assert(banner.trimEnd().endsWith("// ==/UserScript=="), "and closes the same way");
    assertStringIncludes(banner, "// @version      1.2.3", "carrying the version it was handed");
    assertStringIncludes(banner, "// @grant        none", "and asking the page for nothing");
    assertThrows(() => composeUserscriptBanner(""), UserscriptBuildError, "the version");
});

Deno.test("the add-on stays off the operator's own site, bare domain included", () => {
    const banner = composeUserscriptBanner("1.2.3");
    // `*.margonem.pl` matches the bare domain as well as its subdomains, so the exclusion has to
    // name it too or the add-on loads on the site rather than only on a world.
    assertStringIncludes(
        banner,
        "@exclude      https://margonem.pl/*",
        "the bare domain is excluded",
    );
    assertStringIncludes(
        banner,
        "@exclude      https://forum.margonem.pl/*",
        "and so is the forum",
    );
    assert(
        banner.includes("@match        https://*.margonem.pl/*"),
        "while the worlds are matched",
    );
});

Deno.test("a reader of the built text flags what would leave the browser", () => {
    assertEquals(getOutboundCallsInText("const a = 1;"), [], "ordinary code carries none");
    assertEquals(getOutboundCallsInText("await fetch(url)"), ["fetch("], "a request is one");
    assertEquals(getOutboundCallsInText("new WebSocket(url)"), ["new WebSocket"], "and so is this");
});

Deno.test("a build writes its version over the constant, and refuses a text without one", () => {
    const said = `const version = "${BUILD_VERSION}"; console.log("${BUILD_VERSION}");`;
    const written = setVersionInBundle(said, "1.2.3");
    assertEquals(
        written,
        'const version = "1.2.3"; console.log("1.2.3");',
        "every place the bundler inlined it is written over, not the first",
    );
    assertEquals(
        setVersionInBundle(said, BUILD_VERSION),
        said,
        "and writing the constant over itself leaves the text as it was",
    );
    assertThrows(
        () => setVersionInBundle("const version = 1;", "1.2.3"),
        UserscriptBuildError,
        "1.2.3",
    );
});

Deno.test("the file that would be installed carries the banner and no way out", async () => {
    const written = await buildUserscript("1.2.3");
    const built = await Deno.readTextFile(written);
    assert(built.startsWith("// ==UserScript==\n"), "the banner is first, where a manager looks");
    assertStringIncludes(built, "// @version      1.2.3", "at the version it was built for");
    assert(
        !built.includes(BUILD_VERSION),
        "and the panel below says that version, not the dev one",
    );
    assertEquals(getOutboundCallsInText(built), [], "and nothing in it can leave the browser");
    assert(built.length > 1000, "the bundle is in there beneath it");

    const metadata = await Deno.readTextFile("dist/margometer.meta.js");
    assertEquals(metadata, composeUserscriptBanner("1.2.3"), "the metadata file is the banner");
    assert(
        built.startsWith(metadata),
        "which is what an installed copy polls for its next version",
    );
});
