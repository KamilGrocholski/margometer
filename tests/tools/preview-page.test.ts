/**
 * The page both previews draw, read back: the order of its scripts, what it says to a browser
 * about a fight, the harness around the panel, and the one thing in it that could break out of a
 * tag. A page loading the add-on before there is a game still draws, eventually, so the order is
 * held rather than assumed.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { WARRIOR_FIELDS } from "#/src/game/engine-warrior.ts";
import { ENVELOPE_KEYS } from "#/src/game/payload-envelope.ts";
import { GAME_SCRIPT_NAME } from "#/tests/e2e/game-page.ts";
import { USERSCRIPT_NAME } from "#/tools/build-userscript.ts";
import {
    composePreviewPage,
    composePreviewStore,
    PREVIEW_INSTALL_OPENING,
    type PreviewFightLink,
    type PreviewInstall,
    type PreviewPageOptions,
    type PreviewWords,
} from "#/tools/preview-page.ts";

const INSTALL: PreviewInstall = {
    name: "MargoMeter",
    sentence: "what it counts",
    offer: { label: "take it", address: "https://example.test/margometer.user.js" },
    versionLine: "version 1.2.3",
    needsLine: "what has to be true",
    needs: [
        { text: "a manager first", isSilent: false },
        { text: "the switch nothing tells you about", isSilent: true },
    ],
    afterLine: "then a fight",
};
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
    playing: "playing",
    tooltips: "tooltips",
};
const FIGHTS: PreviewFightLink[] = [
    { name: "first", address: "/?fight=first", callsAddress: "/calls?fight=first" },
    { name: "second", address: "/?fight=second", callsAddress: "/calls?fight=second" },
];
const CALLS: unknown[] = [["0;1=100.00;+dmg=5;-dmg=5"]];
/** The rule that pins the column down a served page's left edge, and nowhere else. */
const TIPS_PINNED_LEFT = "left: 0; top: 44px";

Deno.test("a game stands up before the add-on looks for one, and is fed after it", () => {
    const page = composePreviewPage(composeOptions(CALLS));
    const game = page.indexOf("window.Engine =");
    const store = page.indexOf("setNothingKept");
    const addon = page.indexOf(`src="/${USERSCRIPT_NAME}"`);
    const driver = page.indexOf("var PREVIEW =");
    assert(game > 0, "a game is stood up");
    assert(store > 0, "and the store is taken away");
    assert(
        addon > game,
        "the add-on loads after the game, so its first look is the one that finds",
    );
    assert(addon > store, "and after the store it would otherwise keep a fight in");
    assert(driver > addon, "and nothing is fed until the add-on has put its wrap on");
});

function composeOptions(calls: readonly unknown[]): PreviewPageOptions {
    assert(calls.length > 0, "a page under test draws a fight with something in it");
    return {
        fightName: "first",
        entryIndex: 0,
        calls,
        fights: FIGHTS,
        scriptDirectory: "/",
        doesAddressCarryState: true,
        doesStartFromEmpty: true,
        words: WORDS,
        introduction: null,
        install: null,
        appendedScript: null,
    };
}

Deno.test("every recording reaches the picker, and the fight itself reaches the page", () => {
    const page = composePreviewPage(composeOptions(CALLS));
    for (const fight of FIGHTS) {
        assertStringIncludes(page, fight.name, `${fight.name} is a fight the page can draw`);
        assertStringIncludes(page, fight.address, "under the address its caller chose");
    }
    assertStringIncludes(page, 'id="preview-fight"', "there is a picker to choose one with");
    assertStringIncludes(page, "renderPicker()", "and it is filled before anything is fed");
});

Deno.test("a recording's calls reach the page without opening a tag", () => {
    const page = composePreviewPage(composeOptions(["</script><b>"]));
    assertEquals(page.split("<b>").length - 1, 0, "no call reaches the page as markup");
    assertStringIncludes(page, "\\u003c/script>", "the opening bracket is written as an escape");
    assertStringIncludes(page, `id="preview-settings"`, "and the harness's own settings are data");
});

Deno.test("the page is opened where the caller said, and the empty panel stays reachable", () => {
    const opened = composePreviewPage({ ...composeOptions(CALLS), entryIndex: 1 });
    assertStringIncludes(opened, `"entryIndex":1`, "the entry the caller clamped is carried");
    assertStringIncludes(opened, `"entryCount":1`, "beside the length it was clamped against");
    assertStringIncludes(opened, `"fedThrough":0`, "and the game page feeds nothing on its own");
    assertStringIncludes(opened, "composePreviewStateHashAt(0)", "the state before the first call");
    assertStringIncludes(opened, "location.reload()", "is reached by a fresh document");
    assertStringIncludes(
        opened,
        "PREVIEW_STATE.entry === null ? PREVIEW.entryIndex",
        "and an entry the address carried is the one that wins",
    );
});

Deno.test("a published page starts over at the first call, without a reload", () => {
    const page = composePreviewPage({
        ...composeOptions(CALLS),
        doesAddressCarryState: false,
        doesStartFromEmpty: false,
    });
    assertStringIncludes(page, "setFedTo(1);", "the start is the first call, replayed");
    assert(!page.includes("location.reload()"), "and the page never blinks for it");
    assert(!page.includes("replaceState"), "nor writes where it is into the address");
});

Deno.test("the store the add-on is lent starts holding what the address carried", () => {
    const page = composePreviewPage(composeOptions(CALLS));
    const state = page.indexOf("PREVIEW_STATE =");
    const store = page.indexOf("PREVIEW_STORE =");
    const bundle = page.indexOf(`src="/${USERSCRIPT_NAME}"`);
    assert(state > 0, "the address is read");
    assert(state < store, "before the store is stood up");
    assert(store < bundle, "and both stand before the add-on that reads the store");
    assertStringIncludes(page, "PREVIEW_STATE.store", "what the address carried is what it holds");
    assertStringIncludes(page, "history.replaceState", "and what is shown is written back to it");
});

Deno.test("the store is taken away, and what the add-on keeps lives only in the page", () => {
    const held: Record<string, string> = { carried: "1" };
    const window: Record<string, unknown> = { localStorage: "the browser's own" };
    const stand = new Function(
        "window",
        "PREVIEW_STATE",
        `${composePreviewStore()}\nreturn PREVIEW_STORE;`,
    );
    const store = stand(window, { store: held }) as {
        getItem(key: string): string | null;
        setItem(key: string, value: string): void;
    };
    assert(window["localStorage"] === store, "the browser's store is replaced by the page's");
    assert(window["sessionStorage"] === store, "and so is the other one, by the same");
    assertEquals(store.getItem("carried"), "1", "which starts with what the address carried");
    store.setItem("kept", "2");
    assertEquals(
        held["kept"],
        "2",
        "and keeps what the add-on writes in the page, not the browser",
    );
    assertEquals(store.getItem("absent"), null, "and answers nothing for what nobody wrote");
});

Deno.test("the second half of the driver is the caller's, and so is the sentence over it", () => {
    const bare = composePreviewPage(composeOptions(CALLS));
    assert(!bare.includes("EventSource"), "a page nobody rebuilds opens no stream");
    assert(!bare.includes('<p class="preview-intro">'), "and says nothing to who started it");
    const dressed = composePreviewPage({
        ...composeOptions(CALLS),
        appendedScript: "window.appendedHere = 1;",
        introduction: "what this is",
    });
    assertStringIncludes(dressed, "window.appendedHere = 1;", "what the caller appended is there");
    assert(
        dressed.indexOf("window.appendedHere") > dressed.indexOf("setFedTo(PREVIEW_STATE.entry"),
        "after the page has been fed to where it opens",
    );
    assertStringIncludes(dressed, "what this is", "and the sentence stands over the page");
});

Deno.test("the band over the page is the caller's, and a served page carries none", () => {
    const bare = composePreviewPage(composeOptions(CALLS));
    assert(!bare.includes(PREVIEW_INSTALL_OPENING), "who started the server has the file");
    const dressed = composePreviewPage({ ...composeOptions(CALLS), install: INSTALL });
    assertStringIncludes(dressed, "<h1>MargoMeter</h1>", "the band says what is on offer");
    assertStringIncludes(dressed, INSTALL.offer.address, "and hands over a file when pressed");
    assertStringIncludes(dressed, INSTALL.versionLine, "stating which build that is");
    assertStringIncludes(dressed, "the switch nothing tells you about</li>", "and the silent need");
    assertStringIncludes(dressed, INSTALL.afterLine, "and what follows once it is pressed");
    assert(
        dressed.indexOf(PREVIEW_INSTALL_OPENING) < dressed.indexOf(`<div class="preview-strip">`),
        "the band stands before the replay, which is the whole of why it is a band",
    );
});

Deno.test("both pages carry what landed in the tooltips, and a served one pins it left", () => {
    const bare = composePreviewPage(composeOptions(CALLS));
    assertStringIncludes(bare, `id="preview-tips-list"`, "a served page draws the column");
    assertStringIncludes(bare, TIPS_PINNED_LEFT, "down its left edge, away from the windows");
    const dressed = composePreviewPage({ ...composeOptions(CALLS), install: INSTALL });
    assertStringIncludes(dressed, `id="preview-tips-list"`, "a published page draws it as well");
    assert(!dressed.includes(TIPS_PINNED_LEFT), "and never over the band down its left");
    assertStringIncludes(dressed, "visibility: hidden", "but hidden until its script places it");
    assert(
        dressed.indexOf(`id="preview-tips"`) > dressed.indexOf(`class="preview-stage"`),
        "after the two halves, so it stands in neither of their flows",
    );
});

Deno.test("the column's heading stays while its cards scroll, on both pages", () => {
    const bare = composePreviewPage(composeOptions(CALLS));
    const dressed = composePreviewPage({ ...composeOptions(CALLS), install: INSTALL });
    for (const page of [bare, dressed]) {
        const heading = readTipsHeadingRule(page);
        assertStringIncludes(heading, "position: sticky", "the heading sticks");
        assertStringIncludes(heading, "top: 0", "to the top of the column");
        assertStringIncludes(heading, "background:", "over the cards, not through them");
    }
});

/** The rule the column's heading wears, cut out of a page so a property is read where it stands. */
function readTipsHeadingRule(page: string): string {
    const opened = page.indexOf(".preview-tips h2 {");
    assert(opened > 0, "the page styles the column's heading");
    const closed = page.indexOf("}", opened);
    assert(closed > opened, "and closes the rule it opened");
    return page.slice(opened, closed);
}

Deno.test("the column is drawn after the frames run, opposing side first", () => {
    const page = composePreviewPage(composeOptions(CALLS));
    assertStringIncludes(
        page,
        `call[${JSON.stringify(ENVELOPE_KEYS.readerSide)}]`,
        "the reader's side is read off the call as the game states it",
    );
    assertStringIncludes(
        page,
        `roster[id][${JSON.stringify(WARRIOR_FIELDS.side)}]`,
        "and each fighter's under the name the client files it by",
    );
    assertStringIncludes(page, "isReaders === (pass === 1)", "the reader's own come second");
    const flushed = page.indexOf("probe.flushFrames();");
    assert(flushed > 0, "the frames the page holds are run");
    assert(
        flushed < page.indexOf("  renderTips();"),
        "so the add-on's frame writes the tooltips before the column reads them",
    );
});

Deno.test("a published page stands its band in the middle of its half, heading and all", () => {
    const dressed = composePreviewPage({ ...composeOptions(CALLS), install: INSTALL });
    const opened = dressed.indexOf(".preview-said { width: 50vw;");
    assert(opened > 0, "the half the band stands in is styled once the page splits");
    const said = dressed.slice(opened, dressed.indexOf("}", opened));
    assertStringIncludes(said, "align-items: center", "the band stands in the middle of the half");
    const centred = dressed.indexOf("{ text-align: center; }");
    assert(centred > 0, "the lines of the band are centred");
    assertStringIncludes(
        dressed.slice(dressed.lastIndexOf("}", centred) + 1, centred),
        ".preview-install h1",
        "the heading among them",
    );
});

Deno.test("what has to be true stands above the offer, numbered, and what follows below", () => {
    const dressed = composePreviewPage({ ...composeOptions(CALLS), install: INSTALL });
    const needs = dressed.indexOf(`<ol class="preview-needs">`);
    const offer = dressed.indexOf(`<a class="preview-get"`);
    const after = dressed.indexOf(`<p class="preview-after">`);
    assert(needs > 0, "the needs are a numbered list");
    assert(offer > 0, "and the offer is drawn");
    assert(needs < offer, "what has to be true is read before the button, not after it");
    assert(offer < after, "and what happens next is read after it");
});

Deno.test("the mark on the silent need is drawn rather than spelled", () => {
    const dressed = composePreviewPage({ ...composeOptions(CALLS), install: INSTALL });
    const marked = dressed.indexOf(`<li class="preview-warn">`);
    assert(marked > 0, "the silent need is the marked one");
    assertStringIncludes(dressed.slice(marked, marked + 120), "<svg", "and the mark is drawn");
    assertStringIncludes(dressed, "<li>a manager first</li>", "while the other one is plain");
});

Deno.test("the scripts are asked for under the directory the caller answers on", () => {
    const published = composePreviewPage({ ...composeOptions(CALLS), scriptDirectory: "./" });
    assertStringIncludes(published, `src="./${GAME_SCRIPT_NAME}"`, "the decoy, relatively");
    assertStringIncludes(published, `src="./${USERSCRIPT_NAME}"`, "and the bundle beside it");
    assert(!published.includes(`src="/`), "nothing asks a domain root for a project's own file");
});

Deno.test("nothing the harness draws is named as the add-on's", () => {
    const page = composePreviewPage(composeOptions(CALLS));
    assertEquals(page.split("MargoMeter-").length - 1, 0, "`MargoMeter-` still means the add-on's");
    assertStringIncludes(page, "preview-strip", "the harness names its own chrome for itself");
});

Deno.test("the page module speaks neither language, because every word is a value", () => {
    const source = Deno.readTextFileSync("tools/preview-page.ts");
    const found: string[] = [];
    for (const letter of "ąćęłńóśźżĄĆĘŁŃÓŚŹŻ") {
        if (source.includes(letter)) found.push(letter);
    }
    assertEquals(found, [], "L2: the language of a page is the caller's to choose");
    assertStringIncludes(source, "PreviewWords", "which is what the words being a type is for");
});
