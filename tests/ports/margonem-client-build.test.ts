/**
 * The build id, over both shapes the client has served and the things that are not one.
 *
 * The floor is eight characters because the two forms have that much in common; a reader that
 * knew only the older, longer form refused what the client actually stated, and three recordings
 * from 2026-08-25 carry `build: null` for good because of it.
 */

import { assertInstanceOf, assertStrictEquals } from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { RUN_CHARACTERS_MAXIMUM } from "#/libs/text-walk.ts";
import {
    initMargonemClientBuild,
    parseMargonemClientBuildId,
    parseMargonemClientBundleName,
    SCRIPT_NAME_LOOKS_MAXIMUM,
    SCRIPTS_MAXIMUM,
} from "#/src/ports/margonem-client-build.ts";
import { MARGONEM_VALUE, MargonemValueAbsent } from "#/src/ports/margonem-value.ts";

Deno.test("both names the client has served give up their build", () => {
    assertStrictEquals(
        parseMargonemClientBuildId("https://tempest.margonem.pl/js/main.min1786514810315.js"),
        "1786514810315",
        "the older name, whose id is a millisecond timestamp",
    );
    assertStrictEquals(
        parseMargonemClientBuildId("https://luvia.margonem.pl/js/main.min.53XkBRxF.js"),
        "53XkBRxF",
        "and the newer, whose id is eight characters with a dot in front of it",
    );
});

/** A transcript: the bundle's script tag as `experimental.margonem.pl` served it, 2026-10-02. */
Deno.test("an id carrying a dash is read whole", () => {
    assertStrictEquals(
        parseMargonemClientBuildId('<script src="/js/main.min.COv-iBFt.js"></script>'),
        "COv-iBFt",
        "the dash is part of the id, not where it ends",
    );
    assertStrictEquals(
        parseMargonemClientBundleName('<script src="/js/main.min.COv-iBFt.js"></script>'),
        "main.min.COv-iBFt.js",
        "and of the bundle's name",
    );
});

/**
 * The id is the vendor chunk's from production `DHSqC3Uh` (fetched 2026-10-06), put under the
 * bundle's name: no bundle served has carried an underscore yet, and its siblings already do.
 */
Deno.test("an id carrying an underscore is read whole", () => {
    assertStrictEquals(
        parseMargonemClientBuildId('<script src="/js/main.min.8bk8V_m0.js"></script>'),
        "8bk8V_m0",
        "the underscore is part of the id, not where it ends",
    );
    assertStrictEquals(
        parseMargonemClientBundleName('<script src="/js/main.min.8bk8V_m0.js"></script>'),
        "main.min.8bk8V_m0.js",
        "and of the bundle's name",
    );
});

Deno.test("a name that is not the bundle's yields nothing at all", () => {
    assertStrictEquals(parseMargonemClientBuildId(""), null, "nothing states no build");
    assertStrictEquals(
        parseMargonemClientBuildId("/js/main.min.js"),
        null,
        "and neither does no id",
    );
    assertStrictEquals(
        parseMargonemClientBuildId("/js/main.min.7short.js"),
        null,
        "nor a short one",
    );
    assertStrictEquals(
        parseMargonemClientBuildId("/js/other.min.53XkBRxF.js"),
        null,
        "nor another file",
    );
    assertStrictEquals(
        parseMargonemClientBuildId("/js/main.min.53XkBRxF.css"),
        null,
        "nor the same id under a tail this reader does not answer to",
    );
});

/** W5: the floor is eight, so seven is refused and eight read, in both shapes. */
Deno.test("an id of eight characters is one, and of seven is not", () => {
    assertStrictEquals(
        parseMargonemClientBuildId("/js/main.min.53XkBRx.js"),
        null,
        "seven after the dot",
    );
    assertStrictEquals(
        parseMargonemClientBuildId("/js/main.min.53XkBRxF.js"),
        "53XkBRxF",
        "eight after it",
    );
    assertStrictEquals(
        parseMargonemClientBuildId("/js/main.min1786514.js"),
        null,
        "seven with no dot",
    );
    assertStrictEquals(
        parseMargonemClientBuildId("/js/main.min17865148.js"),
        "17865148",
        "eight with none",
    );
});

Deno.test("the search goes past a name whose tail does not hold", () => {
    // A page states this name more than once, and only one of them need be the bundle: a reader
    // that stopped at the first `main.min` would answer null for a page that states the answer.
    assertStrictEquals(
        parseMargonemClientBuildId("main.min.js and then main.min.53XkBRxF.js"),
        "53XkBRxF",
        "the second one answers where the first could not",
    );
});

Deno.test("the first script naming a build is the page's build", () => {
    const sources = ["/js/jquery.js", "/js/main.min.53XkBRxF.js", "/js/main.min.Bb28FQty.js"];
    const build = initMargonemClientBuild(() => sources).readBuildId();
    assertStrictEquals(build, "53XkBRxF", "the first that names one, and not a later one");
});

Deno.test("a page naming no build says so, and a source that is not text is passed over", () => {
    const none = initMargonemClientBuild(() => ["/js/jquery.js"]).readBuildId();
    assertInstanceOf(none, MargonemValueAbsent, "no build is absent, never a guess");
    assertStrictEquals(none.reading, MARGONEM_VALUE.build, "and names the reading");
    const empty = initMargonemClientBuild(() => []).readBuildId();
    assertInstanceOf(empty, MargonemValueAbsent, "and a page with no scripts names none either");
    const mixed = [null, 7, { src: "x" }, "/js/main.min.53XkBRxF.js"];
    const passed = initMargonemClientBuild(() => mixed).readBuildId();
    assertStrictEquals(passed, "53XkBRxF", "what is not text is passed over, not refused");
});

Deno.test("a page whose scripts will not be read is a failure of theirs", () => {
    const thrown = new TypeError("the document is gone");
    const answer = initMargonemClientBuild((): readonly unknown[] => {
        throw thrown;
    }).readBuildId();
    assertInstanceOf(answer, errors.Caught, "a failure of theirs");
    assertStrictEquals(answer.cause, thrown, "with its cause");
});

/** Probe: an id long enough under a tail that does not hold is passed, and the search goes on. */
Deno.test("a name of full length whose tail does not hold is passed for the next one", () => {
    assertStrictEquals(
        parseMargonemClientBuildId("main.min.53XkBRxF.css then main.min.Bb28FQty.js"),
        "Bb28FQty",
        "the second one answers where the first had the wrong tail",
    );
});

Deno.test("the bundle's whole name is read where the id is, in both shapes the client served", () => {
    const page = '<script src="/js/main.min.53XkBRxF.js"></script>';
    assertStrictEquals(parseMargonemClientBundleName(page), "main.min.53XkBRxF.js");
    assertStrictEquals(
        parseMargonemClientBundleName("/js/main.min1786514810315.js"),
        "main.min1786514810315.js",
    );
    assertStrictEquals(
        parseMargonemClientBundleName("main.min.short.js"),
        null,
        "an id too short is none",
    );
    assertStrictEquals(
        parseMargonemClientBundleName("main.min.53XkBRxF.css"),
        null,
        "and so is another file",
    );
});

Deno.test("the scripts are walked up to their bound, and one past it is not read", () => {
    const decoys = (count: number) => Array.from({ length: count }, () => "/js/jquery.js");
    const atBound = [...decoys(SCRIPTS_MAXIMUM - 1), "/js/main.min.53XkBRxF.js"];
    assertStrictEquals(initMargonemClientBuild(() => atBound).readBuildId(), "53XkBRxF");
    const pastBound = [...decoys(SCRIPTS_MAXIMUM), "/js/main.min.53XkBRxF.js"];
    assertInstanceOf(
        initMargonemClientBuild(() => pastBound).readBuildId(),
        MargonemValueAbsent,
        "a script past the bound names nothing",
    );
});

Deno.test("a source is searched up to its bound on looks, and a name past it is not found", () => {
    const named = (decoys: number) => `${"main.min.x ".repeat(decoys)}main.min.53XkBRxF.js`;
    assertStrictEquals(
        parseMargonemClientBuildId(named(SCRIPT_NAME_LOOKS_MAXIMUM - 1)),
        "53XkBRxF",
    );
    assertStrictEquals(
        parseMargonemClientBuildId(named(SCRIPT_NAME_LOOKS_MAXIMUM)),
        null,
        "one look too many",
    );
});

Deno.test("an id is read up to the bound on a run, and one reaching it is no id", () => {
    const longest = "a".repeat(RUN_CHARACTERS_MAXIMUM - 1);
    assertStrictEquals(parseMargonemClientBuildId(`main.min.${longest}.js`), longest, "under it");
    const reaching = "a".repeat(RUN_CHARACTERS_MAXIMUM);
    assertStrictEquals(parseMargonemClientBuildId(`main.min.${reaching}.js`), null, "at it");
    assertStrictEquals(
        parseMargonemClientBuildId(`main.min.${reaching}.js main.min.53XkBRxF.js`),
        "53XkBRxF",
        "and the search goes on past it",
    );
    const page = initMargonemClientBuild(() => [`/js/main.min.${reaching}.js`]).readBuildId();
    assertInstanceOf(page, MargonemValueAbsent, "a page naming one names no build");
});
