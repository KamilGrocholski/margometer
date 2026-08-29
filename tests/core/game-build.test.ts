/**
 * The build id, over both shapes the client has served and the things that are not one.
 *
 * The floor is eight characters because the two forms have that much in common; a reader that
 * knew only the older, longer form refused what the client actually stated, and three recordings
 * from 2026-08-25 carry `build: null` for good because of it.
 */

import { assertEquals } from "@std/assert";
import { getGameBuildFromScriptName } from "@/src/core/game-build.ts";

Deno.test("both names the client has served give up their build", () => {
    assertEquals(
        getGameBuildFromScriptName("https://tempest.margonem.pl/js/main.min1786514810315.js"),
        "1786514810315",
        "the older name, whose id is a millisecond timestamp",
    );
    assertEquals(
        getGameBuildFromScriptName("https://luvia.margonem.pl/js/main.min.53XkBRxF.js"),
        "53XkBRxF",
        "and the newer, whose id is eight characters with a dot in front of it",
    );
});

Deno.test("a name that is not the bundle's yields nothing at all", () => {
    assertEquals(getGameBuildFromScriptName(""), null, "nothing states no build");
    assertEquals(getGameBuildFromScriptName("/js/main.min.js"), null, "and neither does no id");
    assertEquals(getGameBuildFromScriptName("/js/main.min.7short.js"), null, "nor a short one");
    assertEquals(getGameBuildFromScriptName("/js/other.min.53XkBRxF.js"), null, "nor another file");
    assertEquals(
        getGameBuildFromScriptName("/js/main.min.53XkBRxF.css"),
        null,
        "nor the same id under a tail this reader does not answer to",
    );
});

Deno.test("the search goes past a name whose tail does not hold", () => {
    // A page states this name more than once, and only one of them need be the bundle: a reader
    // that stopped at the first `main.min` would answer null for a page that states the answer.
    assertEquals(
        getGameBuildFromScriptName("main.min.js and then main.min.53XkBRxF.js"),
        "53XkBRxF",
        "the second one answers where the first could not",
    );
});
