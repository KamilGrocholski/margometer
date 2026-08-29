/**
 * The page a maintainer opens to look at the panel, built and then read back.
 *
 * What matters here is the order of the three scripts and the one thing that could break out of
 * a tag. A page that loads the add-on before there is a game to find still draws, eventually,
 * which is a slower answer than a reader of this file would expect.
 */

import { assert, assertEquals } from "@std/assert";
import { composePreviewPage, type Recording } from "@/tools/build-preview.ts";

const RECORDINGS: Recording[] = [
    { name: "first.json", calls: [["0;1=100.00;+dmg=5;-dmg=5"]] },
    { name: "second.json", calls: [["0;2=100.00;+dmgf=9;-dmgf=9"]] },
];

Deno.test("the page stands a game up before the add-on looks for one", () => {
    const page = composePreviewPage("window.__addon = 1;", RECORDINGS);
    const game = page.indexOf("window.Engine =");
    const addon = page.indexOf("window.__addon = 1;");
    const driver = page.indexOf("window.Engine.battle.updateData(call)");
    assert(game > 0, "a game is stood up");
    assert(addon > game, "and the add-on loads after it, so its first look is the one that finds");
    assert(driver > addon, "and nothing is fed until the add-on has put its wrap on");
});

Deno.test("every recording reaches the page, and the picker is filled from them", () => {
    const page = composePreviewPage("const a = 1;", RECORDINGS);
    for (const one of RECORDINGS) {
        assert(page.includes(one.name), `${one.name} is a fight the page can draw`);
    }
    assert(page.includes('id="recording"'), "there is a picker to choose one with");
    assert(page.includes("location.reload()"), "and changing it starts the next fight clean");
});

Deno.test("the game the page stands up carries a place, since no recording does", () => {
    const page = composePreviewPage("const a = 1;", RECORDINGS);
    // The bar and every shelf row draw where a fight was fought, and a recording carries the
    // world and the build and no map or tile — so without this the one thing they draw is blank.
    assert(page.includes("map:"), "the client's own map field is there to be read");
    assert(page.includes("hero:"), "and the hero's, which is where the tile is read from");
    assert(page.includes("Podgl"), "under a name of the tool's, never one a recording states");
});

Deno.test("nothing in the page can close a tag it was written inside", () => {
    // A bundle that carried this text verbatim would end its own script tag and put the rest of
    // itself on the page as markup. The one place it can occur is inside a string literal.
    const page = composePreviewPage('const said = "</script>";', RECORDINGS);
    assertEquals(page.split("</script>").length - 1, 4, "each of the four tags closes once");
    assert(page.includes("<\\/script>"), "and the one in the bundle is spelled so it cannot");
});

Deno.test("a recording's calls reach the page without opening a tag either", () => {
    const sneaky: Recording[] = [{ name: "one.json", calls: ["</script><b>"] }];
    const page = composePreviewPage("const a = 1;", sneaky);
    assertEquals(page.split("<b>").length - 1, 0, "no call reaches the page as markup");
    assert(page.includes("\\u003c/script>"), "the opening bracket is written as an escape");
});
