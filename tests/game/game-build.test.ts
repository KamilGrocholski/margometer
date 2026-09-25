/**
 * The build id, over both shapes the client has served and the things that are not one.
 *
 * The floor is eight characters because the two forms have that much in common; a reader that
 * knew only the older, longer form refused what the client actually stated, and three recordings
 * from 2026-08-25 carry `build: null` for good because of it.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { err, ok, RESULT_FAILURE } from "#/libs/result.ts";
import { initPageBuild, parseGameBuild, parseGameBundleName } from "#/src/game/game-build.ts";
import { PAGE_READ_FAILURE, PAGE_READING } from "#/src/game/page-reading.ts";

Deno.test("both names the client has served give up their build", () => {
    assertEquals(
        parseGameBuild("https://tempest.margonem.pl/js/main.min1786514810315.js"),
        "1786514810315",
        "the older name, whose id is a millisecond timestamp",
    );
    assertEquals(
        parseGameBuild("https://luvia.margonem.pl/js/main.min.53XkBRxF.js"),
        "53XkBRxF",
        "and the newer, whose id is eight characters with a dot in front of it",
    );
});

Deno.test("a name that is not the bundle's yields nothing at all", () => {
    assertStrictEquals(parseGameBuild(""), null, "nothing states no build");
    assertStrictEquals(parseGameBuild("/js/main.min.js"), null, "and neither does no id");
    assertStrictEquals(parseGameBuild("/js/main.min.7short.js"), null, "nor a short one");
    assertStrictEquals(parseGameBuild("/js/other.min.53XkBRxF.js"), null, "nor another file");
    assertStrictEquals(
        parseGameBuild("/js/main.min.53XkBRxF.css"),
        null,
        "nor the same id under a tail this reader does not answer to",
    );
});

/** W5: the floor is eight, so seven is refused and eight read, in both shapes. */
Deno.test("an id of eight characters is one, and of seven is not", () => {
    assertStrictEquals(parseGameBuild("/js/main.min.53XkBRx.js"), null, "seven after the dot");
    assertStrictEquals(parseGameBuild("/js/main.min.53XkBRxF.js"), "53XkBRxF", "eight after it");
    assertStrictEquals(parseGameBuild("/js/main.min1786514.js"), null, "seven with no dot");
    assertStrictEquals(parseGameBuild("/js/main.min17865148.js"), "17865148", "eight with none");
});

Deno.test("the search goes past a name whose tail does not hold", () => {
    // A page states this name more than once, and only one of them need be the bundle: a reader
    // that stopped at the first `main.min` would answer null for a page that states the answer.
    assertEquals(
        parseGameBuild("main.min.js and then main.min.53XkBRxF.js"),
        "53XkBRxF",
        "the second one answers where the first could not",
    );
});

Deno.test("the first script naming a build is the page's build", () => {
    const sources = ["/js/jquery.js", "/js/main.min.53XkBRxF.js", "/js/main.min.Bb28FQty.js"];
    const build = initPageBuild({ readScriptSources: () => sources }).readBuildId();
    assertEquals(build, ok("53XkBRxF"), "the first that names one, and not a later one");
});

Deno.test("a page naming no build says so, and a source that is not text is passed over", () => {
    const none = initPageBuild({ readScriptSources: () => ["/js/jquery.js"] }).readBuildId();
    const absent = err({ kind: PAGE_READ_FAILURE.absent, reading: PAGE_READING.build });
    assertEquals(none, absent, "no build is absent, never a guess");
    const empty = initPageBuild({ readScriptSources: () => [] }).readBuildId();
    assertEquals(empty, absent, "and a page with no scripts names none either");
    const mixed = [null, 7, { src: "x" }, "/js/main.min.53XkBRxF.js"];
    const passed = initPageBuild({ readScriptSources: () => mixed }).readBuildId();
    assertEquals(passed, ok("53XkBRxF"), "what is not text is passed over, not refused");
});

Deno.test("a page whose scripts will not be read is a failure of theirs", () => {
    const thrown = new TypeError("the document is gone");
    const scripts = {
        readScriptSources: (): readonly unknown[] => {
            throw thrown;
        },
    };
    const read = initPageBuild(scripts).readBuildId();
    assertEquals(read, err({ kind: RESULT_FAILURE.foreignThrew, cause: thrown }), "with its cause");
});

/** Probe: an id long enough under a tail that does not hold is passed, and the search goes on. */
Deno.test("a name of full length whose tail does not hold is passed for the next one", () => {
    assertEquals(
        parseGameBuild("main.min.53XkBRxF.css then main.min.Bb28FQty.js"),
        "Bb28FQty",
        "the second one answers where the first had the wrong tail",
    );
});

Deno.test("the bundle's whole name is read where the id is, in both shapes the client served", () => {
    const page = '<script src="/js/main.min.53XkBRxF.js"></script>';
    assertStrictEquals(parseGameBundleName(page), "main.min.53XkBRxF.js");
    assertStrictEquals(
        parseGameBundleName("/js/main.min1786514810315.js"),
        "main.min1786514810315.js",
    );
    assertStrictEquals(parseGameBundleName("main.min.short.js"), null, "an id too short is none");
    assertStrictEquals(
        parseGameBundleName("main.min.53XkBRxF.css"),
        null,
        "and so is another file",
    );
});
