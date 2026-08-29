/**
 * The harness page, read back: the order of its scripts, what it says to a browser about a fight,
 * and the one thing in it that could break out of a tag.
 *
 * A page that loads the add-on before there is a game to find still draws, eventually, which is a
 * slower answer than a reader of this file would expect — so the order is held, not assumed.
 */

import { assert, assertEquals } from "@std/assert";
import {
    composePreviewPage,
    PREVIEW_GAME_SCRIPT_NAME,
    type PreviewFightLink,
    type PreviewPageOptions,
    type PreviewWords,
} from "@/tools/preview-page.ts";

const WORDS: PreviewWords = {
    language: "en",
    title: "MargoMeter preview",
    placeName: "Preview",
    start: "to start",
    backHint: "Replays the fight up to the previous entry",
    end: "to end",
    play: "play",
    pause: "pause",
    entry: "entry",
};

const FIGHTS: PreviewFightLink[] = [
    { name: "first", address: "/?fight=first&entry=0", callsAddress: "/calls?fight=first" },
    { name: "second", address: "/?fight=second&entry=0", callsAddress: "/calls?fight=second" },
];

function composeOptions(calls: readonly unknown[]): PreviewPageOptions {
    assert(calls.length > 0, "a page under test draws a fight with something in it");
    assert(FIGHTS.length > 1, "and offers more than one to choose between");
    return {
        fightName: "first",
        entryIndex: 0,
        calls,
        fights: FIGHTS,
        scriptDirectory: "/",
        words: WORDS,
        introduction: null,
        appendedScript: null,
    };
}

const CALLS: unknown[] = [["0;1=100.00;+dmg=5;-dmg=5"]];

Deno.test("a game stands up before the add-on looks for one, and is fed after it", () => {
    const page = composePreviewPage(composeOptions(CALLS));
    const store = page.indexOf("setNothingKept");
    const game = page.indexOf("window.Engine =");
    const addon = page.indexOf(`src="/margometer.user.js"`);
    const driver = page.indexOf("var PREVIEW =");
    assert(store > 0, "the store is taken away first of all");
    assert(game > store, "then a game is stood up");
    assert(addon > game, "the add-on loads after it, so its first look is the one that finds");
    assert(driver > addon, "and nothing is fed until the add-on has put its wrap on");
});

Deno.test("every recording reaches the picker, and the fight itself reaches the page", () => {
    const page = composePreviewPage(composeOptions(CALLS));
    for (const fight of FIGHTS) {
        assert(page.includes(fight.name), `${fight.name} is a fight the page can draw`);
        assert(page.includes(fight.address), "under the address its caller chose");
    }
    assert(page.includes('id="preview-fight"'), "there is a picker to choose one with");
    assert(page.includes("renderPicker()"), "and it is filled before anything is fed");
});

Deno.test("the game the page stands up carries a place and both roster names", () => {
    const page = composePreviewPage(composeOptions(CALLS));
    assert(page.includes("map:"), "the client's own map field is there to be read");
    assert(page.includes("hero:"), "and the hero's, which is where the tile is read from");
    assert(
        page.includes(`"${WORDS.placeName}"`),
        "under the name the caller gave, never a fight's",
    );
    assert(page.includes("warriorsList"), "a saved recording's snapshots are read from this one");
    assert(page.includes("battle.w["), "and the roster the panel is drawn from, from the other");
});

Deno.test("a recording's calls reach the page without opening a tag", () => {
    const page = composePreviewPage(composeOptions(["</script><b>"]));
    assertEquals(page.split("<b>").length - 1, 0, "no call reaches the page as markup");
    assert(page.includes("\\u003c/script>"), "the opening bracket is written as an escape");
    assert(page.includes(`id="preview-settings"`), "and it arrives as data, not as program");
});

Deno.test("the page is opened where the caller said, and the empty panel stays reachable", () => {
    const opened = composePreviewPage({ ...composeOptions(CALLS), entryIndex: 1 });
    assert(opened.includes(`"entryIndex":1`), "the entry the caller clamped is the one carried");
    assert(opened.includes(`"entryCount":1`), "beside the length it was clamped against");
    assert(opened.includes("#start"), "and the state before the first call has an address");
    assert(opened.includes("location.reload()"), "reached by opening the page again, not a replay");
});

Deno.test("the second half of the driver is the caller's, and so is the sentence over it", () => {
    const bare = composePreviewPage(composeOptions(CALLS));
    assert(!bare.includes("EventSource"), "a page nobody rebuilds opens no stream");
    assert(
        !bare.includes('<p class="preview-intro">'),
        "and says nothing to a reader who started it themselves",
    );
    const dressed = composePreviewPage({
        ...composeOptions(CALLS),
        appendedScript: "window.__appended = 1;",
        introduction: "what this is",
    });
    assert(dressed.includes("window.__appended = 1;"), "what the caller appended is appended");
    assert(dressed.indexOf("window.__appended") > dressed.indexOf("setFedTo(window.location"));
    assert(dressed.includes("what this is"), "and the sentence stands over the page");
});

Deno.test("the scripts are asked for under the directory the caller answers on", () => {
    const published = composePreviewPage({ ...composeOptions(CALLS), scriptDirectory: "./" });
    assert(published.includes(`src="./${PREVIEW_GAME_SCRIPT_NAME}"`), "the decoy, relatively");
    assert(published.includes(`src="./margometer.user.js"`), "and the bundle beside it");
    assert(!published.includes(`src="/`), "nothing asks a domain root for a project's own file");
});

Deno.test("nothing the harness draws is named as the add-on's", () => {
    const page = composePreviewPage(composeOptions(CALLS));
    assertEquals(page.split("MargoMeter-").length - 1, 0, "`MargoMeter-` still means the add-on's");
    assert(page.includes("preview-strip"), "the harness names its own chrome for itself");
});

Deno.test("the page module speaks neither language, because every word is a value", () => {
    const source = Deno.readTextFileSync("tools/preview-page.ts");
    const polish = "ąćęłńóśźżĄĆĘŁŃÓŚŹŻ";
    const found: string[] = [];
    for (const letter of polish) {
        if (source.includes(letter)) found.push(letter);
    }
    assertEquals(found, [], "L2: the language of a page is the caller's to choose");
    assert(source.includes("PreviewWords"), "which is what the words being a type is for");
});
