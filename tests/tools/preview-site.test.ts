/**
 * The published page, composed without a browser: what it offers, what it runs, and where its
 * scripts are asked for, which on GitHub Pages is beside the page and never the host's root. That
 * it draws a panel is the browser suite's, over the same `tests/e2e/game-page.ts`.
 */

import { assert, assertEquals, assertStrictEquals, assertStringIncludes } from "@std/assert";
import { STORE_KEY } from "#/src/game/browser-store.ts";
import {
    parseDeclaredVersion,
    USERSCRIPT_DOWNLOAD_ADDRESS,
    USERSCRIPT_NAME,
} from "#/tools/build-userscript.ts";
import {
    composePreviewSiteFiles,
    composeSitePage,
    LANDING_RECORDING,
    readSiteVersion,
} from "#/tools/preview-site.ts";
import { lookupRecordedFight } from "#/tests/recorded-fights.ts";

Deno.test("the page offers the file, states its version, and asks for its scripts beside it", () => {
    const page = composeSitePage(lookupRecordedFight(LANDING_RECORDING), "1.2.3");
    assertStringIncludes(page, `<html lang="pl">`, "a player reads it, in Polish");
    assertStringIncludes(
        page,
        `href="${USERSCRIPT_DOWNLOAD_ADDRESS}"`,
        "the button hands the file",
    );
    assertStringIncludes(page, "wersja 1.2.3", "and says which build it is");
    assertStringIncludes(page, `<script src="./${USERSCRIPT_NAME}">`, "beside the page");
    assert(!page.includes(`<script src="/`), "and nothing from the host's root");
    assertStringIncludes(page, `"fedThrough":0}`, "the band's script feeds, so a reload is nought");
});

Deno.test("both windows are seeded where the add-on reads a drag, before it reads it", () => {
    const page = composeSitePage(lookupRecordedFight(LANDING_RECORDING), "1.2.3");
    const seeded = page.indexOf(JSON.stringify(STORE_KEY.panelPlace));
    const bundle = page.indexOf(`<script src="./${USERSCRIPT_NAME}">`);
    assert(seeded > 0, "the panel's place is written");
    assert(page.includes(JSON.stringify(STORE_KEY.helperPlace)), "and the helper's");
    assert(seeded < bundle, "before the bundle runs and reads them");
});

Deno.test("a release run states the declared number, and any other run marks it", () => {
    const declared = parseDeclaredVersion(Deno.readTextFileSync("deno.json"));
    assertStrictEquals(readSiteVersion(["--release"]), declared);
    assertStrictEquals(readSiteVersion([]), `${declared}-dev`);
});

Deno.test("the site is one page and the two scripts it names", async () => {
    const files = await composePreviewSiteFiles("1.2.3");
    assertEquals(files.map((file) => file.name), [
        "index.html",
        USERSCRIPT_NAME,
        "main.min1785244275300.js",
    ]);
    assertStringIncludes(files[1]!.text, "// @version      1.2.3", "the bundle at that version");
});
