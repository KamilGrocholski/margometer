/**
 * The client's own JavaScript, asked for and dated.
 *
 * The readers run over invented markup: the game's page is somebody else's work and none of it
 * is stored here. The last test is the one that matters most — it asks **git** whether the cache
 * is ignored, because the promise that no bundle enters this repository is two spellings in two
 * files with nothing between them.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import {
    CACHE_ROOT,
    getBuildFromPage,
    getBundleUrlFromPage,
    getChannelFromArgument,
    requireCachedClientSource,
} from "@/tools/game-client-source.ts";
import { GameSourceError } from "@/tools/margometer-tool-error.ts";

const OLDER_PAGE =
    `<script src="https://tempest.margonem.pl/js/main.min1786514810315.js"></script>`;
const NEWER_PAGE = `<script src="/js/main.min.53XkBRxF.js"></script>`;

Deno.test("both names the client has served give up their build and their file", () => {
    assertEquals(getBuildFromPage(OLDER_PAGE), "1786514810315", "the older name's id");
    assertEquals(getBuildFromPage(NEWER_PAGE), "53XkBRxF", "and the newer one's");
    assertEquals(
        getBundleUrlFromPage(NEWER_PAGE, "https://tempest.margonem.pl"),
        "https://tempest.margonem.pl/js/main.min.53XkBRxF.js",
        "the file is asked for under the name the page states, dot and all",
    );
});

Deno.test("a page that names no client is a page this refuses", () => {
    assertThrows(() => getBuildFromPage("<html><body>nothing here</body></html>"), GameSourceError);
    assertThrows(
        () => getBundleUrlFromPage("<script src=/js/main.min.js></script>", "https://x.example"),
        GameSourceError,
    );
});

Deno.test("a channel is one of the two, and nothing off a prototype", () => {
    assertEquals(getChannelFromArgument("production"), "production", "the one that decides");
    assertEquals(getChannelFromArgument("development"), "development", "the one for reading");
    // `in` walks the prototype chain, so it accepted `toString` and sent a fetch at a function.
    assertThrows(() => getChannelFromArgument("toString"), GameSourceError);
    assertThrows(() => getChannelFromArgument("constructor"), GameSourceError);
});

Deno.test("a manifest missing a field is provenance nobody can date", () => {
    const whole = {
        channel: "production",
        build: "53XkBRxF",
        host: "https://tempest.margonem.pl",
        fetchedAt: "2026-08-25T21:29:23.840Z",
        bundlePath: ".cache/game-client/production/main.js",
    };
    assertEquals(requireCachedClientSource(whole, "production").build, "53XkBRxF", "a whole one");

    const { fetchedAt: _dropped, ...truncated } = whole;
    assertThrows(() => requireCachedClientSource(truncated, "production"), GameSourceError);
    assertThrows(
        () => requireCachedClientSource({ ...whole, channel: "development" }, "production"),
        GameSourceError,
    );
    assertThrows(() => requireCachedClientSource("not an object", "production"), GameSourceError);
});

Deno.test("git is asked whether the cache is ignored, rather than a comment claiming it", () => {
    const asked = new Deno.Command("git", { args: ["check-ignore", CACHE_ROOT] }).outputSync();
    assert(CACHE_ROOT.startsWith(".cache/"), "the cache sits where the ignore rule names");
    assertEquals(asked.success, true, `git does not ignore ${CACHE_ROOT}`);
});
