/**
 * The published page, composed and read back without writing a file. What matters is everything a
 * page cannot ask a process for: its addresses are relative, it keeps nothing, and nothing in it
 * reconnects to a route that is not there. Each is silent when it is wrong — a page that loads
 * cleanly and shows nothing. That it draws a panel in Chrome is checked by driving it.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertStrictEquals,
    assertStringIncludes,
} from "@std/assert";
import { STORE_KEY } from "#/src/game/browser-store.ts";
import {
    encodeUserscriptBanner,
    parseDeclaredVersion,
    USERSCRIPT_DOWNLOAD_ADDRESS,
    USERSCRIPT_NAME,
} from "#/tools/build-userscript.ts";
import { COLUMN_WIDTH_MAXIMUM, PREVIEW_INSTALL_OPENING } from "#/tools/preview-page.ts";
import {
    composePreviewSiteFiles,
    composeSitePage,
    LANDING_RECORDING,
    readSiteVersion,
} from "#/tools/preview-site.ts";
import { formatRecordingName } from "#/tools/recorded-material.ts";
import { lookupRecordedFight } from "#/tests/recorded-fights.ts";

/** Unmistakable on a page, so a test meaning the stated version cannot pass on a real one. */
const VERSION = "1.2.3";
const BAND_CLOSING = "</header>";
const WIDTH_DECLARATION = "max-width: ";
/** The bar bounds itself: it spans the half it drives, and the windows stand under it. */
const BOUNDED_BY_ITSELF = ".preview-strip";
const LINK_OPENING = "<link ";
/** An address inside the document, which loads nothing from anywhere. */
const LINK_INLINE = `href="data:`;
/** Every spelling by which a page fetches something of its own accord, but a link. */
const LOADED_FROM_ELSEWHERE = [`src="http`, "url(http", "@import"];
const POLISH_LETTERS = "ąćęłńóśźż";

Deno.test("every column of text on the page ends before the windows do", () => {
    const widths = composeWidthsBySelector(composeLandingPage());
    assert(widths.size > 1, "the sheet states more than one width, or this reads nothing");
    const unbounded: string[] = [];
    for (const [selector, width] of widths) {
        if (selector === BOUNDED_BY_ITSELF) continue;
        if (width === COLUMN_WIDTH_MAXIMUM) continue;
        unbounded.push(`${selector}: ${width}`);
    }
    assertEquals(unbounded, [], "a column not bounded by the corner runs under the windows");
});

function composeLandingPage(): string {
    return composeSitePage(lookupRecordedFight(LANDING_RECORDING), VERSION);
}

/** Every selector whose rule states a width, with the width it states. */
function composeWidthsBySelector(sheet: string): Map<string, string> {
    const widths = new Map<string, string>();
    let selector = "";
    for (const line of sheet.split("\n")) {
        const opened = line.indexOf(" {");
        if (opened > 0) selector = line.slice(0, opened).trim();
        const stated = line.indexOf(WIDTH_DECLARATION);
        if (stated < 0) continue;
        const rest = line.slice(stated + WIDTH_DECLARATION.length);
        const closed = rest.indexOf(";");
        widths.set(selector, closed < 0 ? rest.trim() : rest.slice(0, closed).trim());
    }
    return widths;
}

Deno.test("the reader of widths finds a capped rule and an uncapped one alike", () => {
    const widths = composeWidthsBySelector(
        `.one { margin: 0; max-width: ${COLUMN_WIDTH_MAXIMUM}; }\n.other { max-width: 46em; }`,
    );
    assertEquals(widths.get(".one"), COLUMN_WIDTH_MAXIMUM, "the capped rule is read as capped");
    assertEquals(widths.get(".other"), "46em", "and the uncapped one is not read as capped");
});

Deno.test("the page a visitor lands on is the landing fight, finished, with no picker", () => {
    const page = composeLandingPage();
    const fight = lookupRecordedFight(LANDING_RECORDING);
    const name = formatRecordingName(fight.path);
    assertStringIncludes(page, `"fightName":"${name}"`, "the named fight is the one");
    assertStringIncludes(page, `"entryIndex":${fight.updates.length}`, "opened at its end");
    assertStringIncludes(page, `"fights":[]`, "and no other recording is offered");
    assert(!page.includes(`id="preview-fight"`), "so there is no picker to choose one with");
});

Deno.test("a published page keeps nothing, in its address or in the browser", () => {
    const page = composeLandingPage();
    assertStringIncludes(page, "var PREVIEW_STATE = { entry: null", "the state is stated bare");
    assert(!page.includes("replaceState"), "nothing writes the address as it goes");
    assert(!page.includes("getPreviewStateFromHash"), "and nothing reads one on the way in");
    assertStringIncludes(page, "setNothingKept", "and the browser's store is taken away");
    assert(
        page.indexOf("setNothingKept") < page.indexOf(`src="./${USERSCRIPT_NAME}"`),
        "before the add-on that would keep a fight in it",
    );
});

Deno.test("nothing on a published page asks a domain root, or a process, for anything", () => {
    const page = composeLandingPage();
    assert(!page.includes(`src="/`), "an absolute address asks for a file of no project");
    assert(!page.includes("EventSource"), "a page nobody rebuilds reconnects to nothing");
    assert(!page.includes("build ok"), "and says nothing about a build nobody ran");
    assertEquals(readLoadedMarks(page), [], "no font, no picture and no counter arrives");
});

/** What a page would go and get. An `<a href>` is a navigation somebody presses, and stays legal. */
function readLoadedMarks(text: string): string[] {
    const found = LOADED_FROM_ELSEWHERE.filter((mark) => text.includes(mark));
    let at = text.indexOf(LINK_OPENING);
    for (let tried = 0; at !== -1; tried += 1) {
        assert(tried <= text.length, "the walk stays inside the text");
        const tag = text.slice(at, text.indexOf(">", at));
        if (!tag.includes(LINK_INLINE)) found.push(tag);
        at = text.indexOf(LINK_OPENING, at + LINK_OPENING.length);
    }
    return found;
}

Deno.test("the reader over what a page loads flags a stylesheet, and not a link or an icon", () => {
    const sheet = `<link rel="stylesheet" href="https://x/y.css">`;
    assertEquals(readLoadedMarks(sheet), [`<link rel="stylesheet" href="https://x/y.css"`]);
    assertEquals(
        readLoadedMarks(`<link rel="icon" href="data:,">`),
        [],
        "an inline icon loads nothing",
    );
    assertEquals(
        readLoadedMarks(`<a href="https://x/y.user.js">take</a>`),
        [],
        "a button is pressed",
    );
});

Deno.test("a published page speaks to a player, in the language a player reads", () => {
    const page = composeLandingPage();
    assertStringIncludes(page, `lang="pl"`, "the document says which language it is in");
    assertStringIncludes(page, "od początku", "and the bar is written in it");
    const lede = readTextInClassName(page, "preview-lede");
    assertExists(lede, "the band opens with a sentence for a reader who arrived");
    assert(isWrittenInPolish(lede), "and that sentence is in Polish, whatever it says");
});

/** What one element of a class says, between its opening tag and the first close after it. */
function readTextInClassName(text: string, name: string): string | null {
    const opened = text.indexOf(`class="${name}"`);
    if (opened < 0) return null;
    const began = text.indexOf(">", opened);
    if (began < 0) return null;
    const closed = text.indexOf("<", began);
    if (closed < 0) return null;
    return text.slice(began + 1, closed);
}

function isWrittenInPolish(text: string): boolean {
    for (const letter of POLISH_LETTERS) {
        if (text.includes(letter)) return true;
    }
    return false;
}

Deno.test("the reader of a language flags a Polish sentence and not an English one", () => {
    assertEquals(isWrittenInPolish("ile każdy zadał"), true, "a Polish sentence is read as one");
    assertEquals(isWrittenInPolish("a damage meter"), false, "and one in ours is not");
    assertEquals(
        readTextInClassName(`<p class="preview-lede">co się stało</p>`, "preview-lede"),
        "co się stało",
        "and the sentence is taken from the element that carries it",
    );
    assertEquals(readTextInClassName("<p>no class</p>", "preview-lede"), null, "or nothing");
});

Deno.test("the button hands over the file an installed copy polls for its next version", () => {
    // Spelled out rather than taken from the constant: both sides would move together, and a typo
    // in the one address every installed copy polls strands all of them, silently.
    const asset = "https://github.com/KamilGrocholski/margometer" +
        "/releases/latest/download/margometer.user.js";
    assertEquals(USERSCRIPT_DOWNLOAD_ADDRESS, asset, "the release's own asset, at its address");
    assertStringIncludes(composeLandingPage(), `href="${asset}"`, "which the button offers");
    assertStringIncludes(encodeUserscriptBanner(VERSION), asset, "and the file it hands polls");
});

Deno.test("the band states the version behind its button", () => {
    const band = readInstallBand(composeLandingPage());
    assertExists(band, "the page opens with the band");
    assertStringIncludes(band, `wersja ${VERSION}`, "a reader sees which build they take");
    assert(!band.includes("0.0.0"), "and never the constant a build writes over");
});

/** The band as it stands on the page, or null where the page carries none. */
function readInstallBand(text: string): string | null {
    const opened = text.indexOf(PREVIEW_INSTALL_OPENING);
    if (opened < 0) return null;
    const closed = text.indexOf(BAND_CLOSING, opened);
    if (closed < 0) return null;
    return text.slice(opened, closed + BAND_CLOSING.length);
}

Deno.test("the need whose failure is silent is on the page, and it is marked", () => {
    const band = readInstallBand(composeLandingPage());
    assertExists(band, "the page opens with the band");
    assertStringIncludes(band, "chrome://extensions", "the switch is named where it is thrown");
    assertStringIncludes(band, "nic o tym nie powie", "and what happens to who misses it");
    const marked = band.indexOf(`<li class="preview-warn">`);
    assert(marked > 0, "it is marked where it stands, among the needs");
    assert(marked < band.indexOf("chrome://extensions"), "and that is the need so marked");
});

Deno.test("the published band states both needs before it offers the file", () => {
    const band = readInstallBand(composeLandingPage());
    assertExists(band, "the page opens with the band");
    const managerAt = band.indexOf("tampermonkey.net");
    const switchAt = band.indexOf("chrome://extensions");
    const offerAt = band.indexOf(`<a class="preview-get"`);
    assert(managerAt > 0, "the manager is one of them");
    assert(switchAt > 0, "the switch nobody is told about is the other");
    assert(managerAt < offerAt, "the manager is read before the button");
    assert(switchAt < offerAt, "and so is the switch");
});

Deno.test("a published page puts both windows in the corner, and again on every resize", () => {
    const page = composeLandingPage();
    assertStringIncludes(page, "setPanelInCorner", "the panel is taken to the corner");
    assertStringIncludes(page, "setStandingBeside", "and the window beside it follows");
    assertStringIncludes(
        page,
        "setStandingBeside();\n    setTipsPlaced();",
        "and the column of tooltips is placed straight after the windows it stands by",
    );
    assertStringIncludes(page, `addEventListener("resize", setWindowsPlaced)`, "and on a resize");
    assertStringIncludes(
        page,
        "flushFrames();",
        "once the panel the add-on draws on a frame stands",
    );
    assertStringIncludes(page, "buttons: 1", "by a drag stating a held button");
    assert(!page.includes(STORE_KEY.panelPlace), "and never through the store behind its back");
});

Deno.test("the page plays the fight once on arriving, and only the bar stops it", () => {
    const page = composeLandingPage();
    assertStringIncludes(page, "setOpeningHeld();", "the finished fight is held, then replayed");
    assertStringIncludes(page, "setFedTo(1);", "from the first call, so nothing blinks");
    assertStringIncludes(page, "if (PREVIEW_STATE.entry === null)", "unless it arrived elsewhere");
    assertStringIncludes(page, `bar.addEventListener("pointerdown", handleVisitorMoved`, "the bar");
});

Deno.test("a release run states the declared number, and any other run marks it", () => {
    const declared = parseDeclaredVersion(Deno.readTextFileSync("deno.json"));
    assertStrictEquals(readSiteVersion(["--release"]), declared);
    assertStrictEquals(readSiteVersion([]), `${declared}-dev`);
});

Deno.test("the site is one page and the two scripts it names", async () => {
    const files = await composePreviewSiteFiles(VERSION);
    assertEquals(files.map((file) => file.name), [
        "index.html",
        USERSCRIPT_NAME,
        "main.min1785244275300.js",
    ]);
    assertStringIncludes(
        files[1]!.text,
        `// @version      ${VERSION}`,
        "the bundle at that version",
    );
});
