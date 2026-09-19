/**
 * The published site, composed and read back without writing a file.
 *
 * What matters here is everything a page cannot ask a process for: its addresses are relative,
 * its picker navigates rather than fetches, and nothing in it reconnects to a route that is not
 * there. Each of those is silent when it is wrong — a page that loads cleanly and shows nothing.
 */

import { assert, assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import { composeUserscriptBanner, USERSCRIPT_DOWNLOAD_ADDRESS } from "@/tools/build-userscript.ts";
import { MAXIMUM_COLUMN_WIDTH, PREVIEW_INSTALL_OPENING } from "@/tools/preview-page.ts";
import { composePreviewSitePages } from "@/tools/preview-site.ts";
import { getPreviewRecordedFight, getRecordedFights } from "@/tools/recorded-fights.ts";

/** Unmistakable on a page, so a test that means the stated version cannot pass on a real one. */
const VERSION = "1.2.3";

const BAND_CLOSING = "</header>";

/** The band as it stands on one page, or null where that page carries none. */
function getInstallBandInText(text: string): string | null {
    const opened = text.indexOf(PREVIEW_INSTALL_OPENING);
    if (opened < 0) return null;
    const closed = text.indexOf(BAND_CLOSING, opened);
    if (closed < 0) return null;
    return text.slice(opened, closed + BAND_CLOSING.length);
}

/** Every spelling by which a page fetches something of its own accord. */
const LOADED_FROM_ELSEWHERE = [`src="http`, "<link ", "url(http", "@import"];

/**
 * What a page would go and get. An `<a href>` is a navigation somebody presses and stays legal,
 * which is why this reads the spellings that load rather than every address on the page.
 */
function getLoadedAddressesInText(text: string): string[] {
    const found: string[] = [];
    for (const mark of LOADED_FROM_ELSEWHERE) {
        if (text.includes(mark)) found.push(mark);
    }
    return found;
}

const WIDTH_DECLARATION = "max-width: ";
/**
 * The one rule that bounds itself rather than the corner: the strip is anchored bottom-left, the
 * windows sit top-right, and `tools/panel-screenshots.ts` hides it before it measures anything.
 */
const BOUNDED_BY_ITSELF = ".preview-strip";

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

Deno.test("every column of text on the page ends before the windows do", () => {
    const [page] = composePreviewSitePages(VERSION);
    assertExists(page, "there is a page to read the sheet off");
    const widths = composeWidthsBySelector(page.text);
    assert(widths.size > 1, "the sheet states more than one width, or this reads nothing");

    const unbounded: string[] = [];
    for (const [selector, width] of widths) {
        if (selector === BOUNDED_BY_ITSELF) continue;
        if (width === MAXIMUM_COLUMN_WIDTH) continue;
        unbounded.push(`${selector}: ${width}`);
    }
    // The paragraph under the band held `46em` and no corner at all until 2026-09-18, and the
    // band's own assertion passed on the band alone. A width that runs under the panel is silent.
    assertEquals(unbounded, [], "a column not bounded by the corner runs under the windows");
});

Deno.test("the reader of widths finds a capped rule and an uncapped one alike", () => {
    const widths = composeWidthsBySelector(
        `.one { margin: 0; max-width: ${MAXIMUM_COLUMN_WIDTH}; }\n.other { max-width: 46em; }`,
    );
    assertEquals(widths.get(".one"), MAXIMUM_COLUMN_WIDTH, "the capped rule is read as capped");
    assertEquals(widths.get(".other"), "46em", "and the uncapped one is not read as capped");
});

Deno.test("the site is one page, over the one recording every preview opens on", () => {
    const pages = composePreviewSitePages(VERSION);
    assertEquals(pages.map((page) => page.name), ["index.html"], "one page, and it is the landing");
    // A published page offers no choice of recording — there is nowhere else to go and nothing
    // saying there is. The picker stays on the served page, which is read while `src/` changes.
    const [page] = pages;
    assertExists(page, "there is a page to read");
    assert(!page.text.includes(`id="preview-fight"`), "and no picker to choose another fight with");
});

Deno.test("the page a visitor lands on is the fight every preview opens on, finished", () => {
    const [page] = composePreviewSitePages(VERSION);
    assertExists(page, "there is a page to read");
    const opened = getPreviewRecordedFight(getRecordedFights());
    assertStringIncludes(page.text, `"fightName":"${opened.name}"`, "the named fight is the one");
    assertStringIncludes(
        page.text,
        `"entryIndex":${opened.calls.length}`,
        "and it is opened at its end, so the whole ranking stands before anything moves",
    );
});

Deno.test("a published page keeps no moment in its address", () => {
    const [page] = composePreviewSitePages(VERSION);
    assertExists(page, "there is a page to read");
    // One page over one recording: a link to it is a link to the page and never to a state
    // inside it, so nothing here reads a hash or writes one back.
    assertStringIncludes(
        page.text,
        "var PREVIEW_STATE = { entry: null",
        "the state is stated bare",
    );
    assert(!page.text.includes("replaceState"), "and nothing writes the address as it goes");
    assert(!page.text.includes("getPreviewStateFromHash"), "and nothing reads one on the way in");
});

Deno.test("nothing on a published page asks a domain root, or a process, for anything", () => {
    const pages = composePreviewSitePages(VERSION);
    assert(pages.length > 0, "there is a page to read");
    const rooted: string[] = [];
    const streaming: string[] = [];
    const fetching: string[] = [];
    for (const page of pages) {
        if (page.text.includes(`src="/`)) rooted.push(page.name);
        if (page.text.includes("EventSource")) streaming.push(page.name);
        if (!page.text.includes(`"fights":[]`)) fetching.push(page.name);
    }
    assertEquals(rooted, [], "an absolute address asks for a file belonging to no project");
    assertEquals(streaming, [], "a page nobody rebuilds reconnects to nothing, twice a second");
    // No links at all, so there is nothing to fetch a recording's calls from and no address
    // for a pick to navigate to: the published site is one page over one recording.
    assertEquals(fetching, [], "and no page here offers another recording to go to");
});

/** The letters that are in no English sentence, which is what makes this decidable. */
const POLISH_LETTERS = "ąćęłńóśźż";

function getIsWrittenInPolish(text: string): boolean {
    for (const letter of POLISH_LETTERS) {
        if (text.includes(letter)) return true;
    }
    return false;
}

/** What one element of a class says, between its opening tag and the first close after it. */
function getTextInClassName(text: string, name: string): string | null {
    const opened = text.indexOf(`class="${name}"`);
    if (opened < 0) return null;
    const began = text.indexOf(">", opened);
    if (began < 0) return null;
    const closed = text.indexOf("<", began);
    if (closed < 0) return null;
    return text.slice(began + 1, closed);
}

Deno.test("a published page speaks to a player, in the language a player reads", () => {
    const pages = composePreviewSitePages(VERSION);
    const landing = pages[0];
    assertExists(landing, "there is a page to read");
    assertStringIncludes(landing.text, `lang="pl"`, "the document says which language it is in");
    assertStringIncludes(landing.text, "od początku", "and the strip is written in it");
    // The sentence and not its wording. This held the literal `Licznik obrażeń` until 2026-09-19,
    // so rewriting the one sentence a stranger reads first reddened a guard that meant to ask
    // whether the band speaks Polish at all.
    const lede = getTextInClassName(landing.text, "preview-lede");
    assertExists(lede, "the band opens with a sentence for a reader who arrived");
    assert(getIsWrittenInPolish(lede), "and that sentence is in Polish, whatever it says");
    assert(!landing.text.includes("build ok"), "and no claim about a build nobody ran");
});

Deno.test("the reader of a language flags a Polish sentence and not an English one", () => {
    assertEquals(getIsWrittenInPolish("ile każdy zadał"), true, "a Polish sentence is read as one");
    assertEquals(getIsWrittenInPolish("a damage meter"), false, "and one in ours is not");
    assertEquals(
        getTextInClassName(`<p class="preview-lede">co się stało</p>`, "preview-lede"),
        "co się stało",
        "and the sentence is taken from the element that carries it",
    );
    assertEquals(getTextInClassName("<p>no class here</p>", "preview-lede"), null, "or nothing");
});

Deno.test("every published page opens with the band, and it says the same on each", () => {
    const pages = composePreviewSitePages(VERSION);
    assert(pages.length > 0, "there is a page to read");
    const bandless: string[] = [];
    const bands = new Set<string>();
    for (const page of pages) {
        const band = getInstallBandInText(page.text);
        if (band === null) {
            bandless.push(page.name);
            continue;
        }
        bands.add(band);
    }
    assertEquals(bandless, [], "a page reached by a pick offers the file like any other");
    assertEquals(bands.size, 1, "and none of them says which fight is underneath it");
});

Deno.test("the button hands over the file an installed copy polls for its next version", () => {
    const pages = composePreviewSitePages(VERSION);
    const landing = pages.find((page) => page.name === "index.html");
    assertExists(landing, "there is a landing page");
    // Spelled out rather than taken from the constant: both sides would move together, and a
    // typo in the one address every installed copy polls strands all of them, silently.
    const asset = "https://github.com/KamilGrocholski/margometer" +
        "/releases/latest/download/margometer.user.js";
    assertEquals(USERSCRIPT_DOWNLOAD_ADDRESS, asset, "the release's own asset, at its own address");
    assertStringIncludes(landing.text, `href="${asset}"`, "which is what the button offers");
    assertStringIncludes(
        composeUserscriptBanner(VERSION),
        asset,
        "and what the file it hands over polls, so the two cannot drift apart",
    );
});

Deno.test("the band states the version behind its button", () => {
    const landing = composePreviewSitePages(VERSION)[0];
    assertExists(landing, "there is a page to read");
    const band = getInstallBandInText(landing.text);
    assertExists(band, "which opens with the band");
    assertStringIncludes(band, VERSION, "a reader sees which build they are about to take");
    assert(!band.includes("0.0.0"), "and never the constant a build writes over");
});

Deno.test("the need whose failure is silent is on the page, and it is marked", () => {
    const landing = composePreviewSitePages(VERSION)[0];
    assertExists(landing, "there is a page to read");
    const band = getInstallBandInText(landing.text);
    assertExists(band, "which opens with the band");
    assertStringIncludes(band, "chrome://extensions", "the switch is named where it is thrown");
    assertStringIncludes(band, "nic o tym nie powie", "and what happens to somebody who misses it");
    const marked = band.indexOf(`<li class="preview-warn">`);
    assert(marked > 0, "it is marked where it stands, among the needs rather than beside them");
    assert(marked < band.indexOf("chrome://extensions"), "and that is the need so marked");
});

Deno.test("the published band states both needs before it offers the file", () => {
    const landing = composePreviewSitePages(VERSION)[0];
    assertExists(landing, "there is a page to read");
    const band = getInstallBandInText(landing.text);
    assertExists(band, "which opens with the band");
    const switchAt = band.indexOf("chrome://extensions");
    const managerAt = band.indexOf("tampermonkey.net");
    const offerAt = band.indexOf(`<a class="preview-get"`);
    assert(managerAt > 0, "the manager is one of them");
    assert(switchAt > 0, "the switch nobody is told about is the other");
    // Both are preconditions, so a reader meeting the button first has already been told what
    // it will not do on its own. The switch was the second of four items under it until
    // 2026-09-18, and the longest of them.
    assert(managerAt < offerAt, "the manager is read before the button");
    assert(switchAt < offerAt, "and so is the switch");
});

Deno.test("the reader over what a page loads flags a stylesheet and not a link", () => {
    assertEquals(
        getLoadedAddressesInText(`<link rel="stylesheet" href="https://x/y.css">`),
        ["<link "],
        "a page that fetches a sheet is a page that made a request",
    );
    assertEquals(
        getLoadedAddressesInText(`<a href="https://x/y.user.js">take it</a>`),
        [],
        "and the band's own button is a navigation somebody presses",
    );
});

Deno.test("a published page fetches nothing of its own accord, band and all", () => {
    const pages = composePreviewSitePages(VERSION);
    assert(pages.length > 0, "there is a page to read");
    const loading: string[] = [];
    for (const page of pages) {
        for (const mark of getLoadedAddressesInText(page.text)) {
            loading.push(`${page.name}: ${mark}`);
        }
    }
    assertEquals(loading, [], "no font, no picture and no counter arrives with the offer");
});

Deno.test("a published page puts both windows in the corner the band needs", () => {
    const pages = composePreviewSitePages(VERSION);
    assert(pages.length > 0, "there is a page to read");
    const unplaced: string[] = [];
    for (const page of pages) {
        if (!page.text.includes("setWindowsPlaced()")) unplaced.push(page.name);
    }
    assertEquals(unplaced, [], "a panel left where it opens stands over what the band says");
    const landing = pages[0];
    assertExists(landing, "there is a page to read");
    assertStringIncludes(landing.text, "setPanelInCorner", "the panel is taken to the corner");
    assertStringIncludes(landing.text, "setStandingBeside", "and the window beside it follows");
    assertStringIncludes(
        landing.text,
        "buttons: 1",
        "by a drag stating a held button, which is the one a window does not read as letting go",
    );
});
