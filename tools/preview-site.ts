/**
 * The panel, as a directory of files somebody else can open.
 *
 * `deno task preview` answers the same question for whoever has this repository checked out; this
 * answers it for whoever has not, so the panel can be looked at without installing a userscript
 * into a game that has not authorised one. Nothing written here is ever committed: the pages carry
 * a recording's calls inlined, which is how the replay stays synchronous, and the output goes
 * under `dist/`, which git does not carry. `NOTICE.md` says what a published page holds.
 */

import { assert, assertStrictEquals } from "@std/assert";
import { getVersionForRun } from "@/tools/declared-version.ts";
import {
    composeUserscriptFiles,
    USERSCRIPT_DOWNLOAD_ADDRESS,
    USERSCRIPT_NAME,
} from "@/tools/build-userscript.ts";
import {
    composePreviewPage,
    PREVIEW_GAME_SCRIPT_NAME,
    PREVIEW_INSTALL_OPENING,
    PREVIEW_SAID_SELECTOR,
    PREVIEW_SPLIT_SELECTOR,
    PREVIEW_STRIP_SELECTOR,
    PREVIEW_TIPS_WIDTH_PIXELS,
    type PreviewInstall,
    type PreviewWords,
    SPLIT_FROM_PIXELS,
} from "@/tools/preview-page.ts";
import {
    composeWindowDragging,
    composeWindowsCornered,
    getSheetPixels,
    PANEL_GAP,
    PANEL_INSET,
} from "@/tools/preview-windows.ts";
import { PLACE, STANDING } from "@/src/ui/panel-look.ts";
import {
    getPreviewRecordedFight,
    getRecordedFights,
    type RecordedFight,
} from "@/tools/recorded-fights.ts";

/** What the two windows take across, inset and all — the same sum the sheet reserves for them. */
const TAKEN_ACROSS = PANEL_INSET + getSheetPixels(PLACE.width) + PANEL_GAP +
    getSheetPixels(STANDING.width);

/** What the pair stands off the seam by, level with the padding the half beside it carries. */
const SEAM_GUTTER = 32;

/** Three rows of one fighter under the heading; less than that reads as a column cut off. */
const LEAST_TIPS_TALL = 140;

/**
 * How long the finished fight stands before the opening replay starts it over. Long enough to read
 * a ranking of eleven rows, which is what the page is showing it for.
 */
const OPENING_HOLD_MILLISECONDS = 2600;
/**
 * How long one entry of the opening replay rests on screen. Slower than a pressed one on purpose:
 * a visitor pressing play is waiting for it to be over, and one who pressed nothing is watching.
 * The landing recording carries 99 calls, so the opening runs about half a minute and the figures
 * climb rather than jump.
 */
const OPENING_STEP_MILLISECONDS = 300;

const LANDING_PAGE = "index.html";
const OUTPUT_DIRECTORY = "dist/preview";
const HOMEPAGE = "https://github.com/KamilGrocholski/margometer";

/**
 * Polish here, English in `tools/preview-server.ts`, over the same page: **L2** puts the text a
 * player reads in Polish, and a published page is read by players.
 */
const PREVIEW_SITE_WORDS: PreviewWords = {
    language: "pl",
    title: "MargoMeter — podgląd",
    placeName: "Podgląd",
    start: "od początku",
    backHint: "Odtwarza walkę do poprzedniego wpisu",
    end: "do końca",
    play: "odtwórz",
    pause: "pauza",
    entry: "wpis",
    playing: "odtwarzanie",
    tooltips: "Dymki postaci",
};

/**
 * Two things. That this is a recording rather than a live game — a visitor who does not know it
 * reads the panel as a live connection to somebody's account, which is the one misunderstanding
 * this page could cause. And **that the panel answers a pointer**, which nothing else on the page
 * says: the strongest thing here is a row opening onto what a figure was dealt with, and a
 * visitor who never presses one sees a picture. What the add-on is, and where to get it, the band
 * above this says; that nothing leaves the page is one clause, since the page makes no request.
 */
const PREVIEW_SITE_INTRODUCTION = [
    "Obok nagrana walka — kliknij wiersz albo najedź na postać. Nic stąd nie wychodzi.",
    `<a href="${HOMEPAGE}">kod źródłowy</a>`,
].join(" ");

/**
 * The band the published page opens with — **ADR 0099**. `chrome://extensions` is plain text and
 * never a link: a browser refuses that navigation from a page, so an anchor there does nothing
 * when it is pressed and reads as broken. Nothing here names the fight below it, because
 * `index.html` is a copy of one recording's own page and the two are held equal.
 *
 * The two needs stand above the button and what follows it is one sentence; why that order is
 * `PreviewInstall`'s to say, and `design/instalacja/` measured it.
 */
function composeSiteInstall(version: string): PreviewInstall {
    assert(version.length > 0, "the band states the build behind its button");
    assert(USERSCRIPT_DOWNLOAD_ADDRESS.length > 0, "and the file that button hands over");
    return {
        name: "MargoMeter",
        // Every figure this promises is one the panel draws, and that is the whole test of it:
        // the ranking, what a row opens onto, and the person at the other end of it. A sentence
        // promising a figure the panel has not got is the one way this line can be wrong.
        sentence: "Licznik obrażeń do Margonem: kto ile zadał, kto ile oberwał i czym.",
        needsLine: "Zanim zainstalujesz:",
        needs: [
            {
                text:
                    'Menedżer skryptów: <a href="https://www.tampermonkey.net/">Tampermonkey</a> ' +
                    'albo <a href="https://violentmonkey.github.io/">Violentmonkey</a>.',
                isSilent: false,
            },
            {
                text: "<strong>W Chrome i Edge włącz obsługę skryptów użytkownika</strong> " +
                    "w chrome://extensions. Bez tego nic się nie uruchomi i nic o tym nie powie.",
                isSilent: true,
            },
        ],
        offer: { label: "Zainstaluj MargoMeter", address: USERSCRIPT_DOWNLOAD_ADDRESS },
        versionLine: `wersja ${version}`,
        // `obok` and not `niżej`: the page takes both windows to the corner it is drawn in
        // (**ADR 0099**), so the panel stands to the right of this sentence and never under it.
        afterLine: "Potem zacznij walkę — panel pojawi się sam, jak ten obok.",
    };
}

/**
 * Both windows taken to the corner they stand in on every picture in the READMEs, because the
 * band needs the left of the page: a panel opens centred (`src/ui/panel-drag.ts`) and covers what
 * it says. The capture is given back straight after, since the next drag is a visitor's own hand
 * and a hand captures fine — `tools/preview-windows.ts` says why it goes at all.
 *
 * A page that finds no panel is still a page: the band and the replay are drawn either way, so
 * the failure is one console line and never a reason to stop.
 */
function composeSiteWindows(): string {
    return `${composeWindowDragging()}

${composeWindowsCornered(composeCorneredFrom(), "getStripBelow()")}

${composeStripAtTop()}

${composeTipsPlaced()}

var setWindowsPlaced = function () {
  var taken = Element.prototype.setPointerCapture;
  var given = Element.prototype.releasePointerCapture;
  delete Element.prototype.setPointerCapture;
  delete Element.prototype.releasePointerCapture;
  try {
    // The page moves first: the windows are cornered against a layout that has settled.
    setPageBelowStrip();
    setPanelInCorner();
    setStandingBeside();
    setTipsPlaced();
  } catch (reason) {
    console.warn("MargoMeter/Preview", reason);
  } finally {
    Element.prototype.setPointerCapture = taken;
    Element.prototype.releasePointerCapture = given;
  }
};

setWindowsPlaced();
// A window made narrower leaves the panel at an offset that was a corner in the old one.
window.addEventListener("resize", setWindowsPlaced);
setTipsWatched();`;
}

/**
 * The column of what landed in the tooltips, beside the panel where the half has room for it and
 * under both windows where it has not. The room is read off the panel as it stands rather than
 * off a width, because the pair is placed by expression and a width written here would be a
 * second copy of it.
 *
 * ⚠️ **The panel grows when a row opens**, and at layer 9999 it covers a column under it, so a
 * change in either window's size places the column again. A column left less than
 * `LEAST_TIPS_TALL` of the screen is hidden instead: a heading over a sliver says nothing.
 */
function composeTipsPlaced(): string {
    assert(PREVIEW_TIPS_WIDTH_PIXELS > 0, "the column beside the panel is some width across");
    assert(LEAST_TIPS_TALL > 0, "and a column shorter than something is not worth drawing");
    return `var setTipsPlaced = function () {
  var tips = document.getElementById("preview-tips");
  if (tips === null) return;
  var panel = getPanelHost().getBoundingClientRect();
  var beside = getStandingWindow().getBoundingClientRect();
  var room = window.innerWidth - panel.right - ${SEAM_GUTTER};
  var isBeside = room >= ${PREVIEW_TIPS_WIDTH_PIXELS};
  var top = isBeside ? panel.top : Math.max(panel.bottom, beside.bottom) + ${SEAM_GUTTER / 2};
  var left = isBeside ? panel.right + ${SEAM_GUTTER} : beside.left;
  var width = isBeside ? ${PREVIEW_TIPS_WIDTH_PIXELS} : panel.right - beside.left;
  var tall = window.innerHeight - ${PANEL_INSET} - top;
  tips.style.left = Math.round(left) + "px";
  tips.style.top = Math.round(top) + "px";
  tips.style.width = Math.round(width) + "px";
  tips.style.height = Math.round(tall) + "px";
  tips.style.visibility = tall < ${LEAST_TIPS_TALL} ? "hidden" : "visible";
};

// Guarded at the handover, as a listener is (**E12**): a throw out of an observer's callback
// unwinds into a loop that drops it.
var handleWindowsResized = function () {
  try {
    setTipsPlaced();
  } catch (reason) {
    console.warn("MargoMeter/Preview", reason);
  }
};

var setTipsWatched = function () {
  if (typeof ResizeObserver !== "function") return;
  try {
    var watcher = new ResizeObserver(handleWindowsResized);
    watcher.observe(getPanelHost());
    watcher.observe(getStandingWindow());
  } catch (reason) {
    console.warn("MargoMeter/Preview", reason);
  }
};`;
}

/**
 * The edge the two windows inset from: the right of the window while the page is one column, and
 * a line just past the seam once it is two.
 *
 * Cornered against the window's own right edge, the pair sat hard against it and left 274px of
 * empty half beside the text — measured at 1512. Centred in the half instead, a 4K screen put
 * 723px of nothing on each side of it. Against the seam, what grows with the screen is the field
 * either side of the page rather than the gap between the two things the page is about.
 */
function composeCorneredFrom(): string {
    assert(SEAM_GUTTER > 0, "the pair stands off the seam rather than on it");
    // Against the seam and not in the middle of the half: the half runs the whole way to the edge
    // of the screen, so its middle walks off with the screen and the pair goes with it. Clamped to
    // the window, because at the narrowest split the half holds the pair and nothing else.
    return `(window.innerWidth < ${SPLIT_FROM_PIXELS} ? window.innerWidth` +
        ` : Math.min(window.innerWidth,` +
        ` window.innerWidth / 2 + ${TAKEN_ACROSS + SEAM_GUTTER}))`;
}

/**
 * What the bar along the top comes to, and the page pushed down under it.
 *
 * The bar carries the picker and the replay, so it stands over what it changes. Measured
 * 2026-09-19 on the page as it stood before: the strip sat bottom-left against a panel top-right,
 * **1 640px** apart at 1920, and the run grew with every pixel of screen.
 *
 * ⚠️ **Its height is measured and never assumed.** The bar wraps — at a narrow window, and again
 * inside its own half once the page splits — so a number written here is right at one width and
 * wrong at the next. Read once per placing, on load and on every resize.
 *
 * ⚠️ **Never docked off the panel's own bottom edge.** The panel grows when a row opens, 402px to
 * 602px at 1920×900, and draws at layer 9999 against the strip's 9000, so a bar under it is a bar
 * the panel covers.
 */
function composeStripAtTop(): string {
    assert(PANEL_INSET > 0, "the page starts below the bar by what the sheet leaves");
    return `var getStripBelow = function () {
  var strip = document.querySelector("${PREVIEW_STRIP_SELECTOR}");
  if (strip === null) return ${PANEL_INSET};
  return Math.round(strip.getBoundingClientRect().height) + ${PANEL_INSET};
};

var setPageBelowStrip = function () {
  var split = document.querySelector("${PREVIEW_SPLIT_SELECTOR}");
  if (split === null) return;
  var said = document.querySelector("${PREVIEW_SAID_SELECTOR}");
  var narrow = window.innerWidth < ${SPLIT_FROM_PIXELS};
  split.style.paddingTop = narrow ? getStripBelow() + "px" : "";
  if (said !== null) said.style.paddingTop = narrow ? "" : getStripBelow() + "px";
};`;
}

/**
 * The fight played through once, on arriving, and then left alone.
 *
 * The published page opens on the finished fight and holds it (**ADR 0028**), then runs once to
 * the end, where the ranking stands again. **It does not repeat**: a page replaying for as long
 * as a tab is open is motion beside a band that has to be read.
 *
 * ⚠️ **Entry 0 is not reachable without a fresh document**, which is why the run starts at the
 * first call and never at nothing: reaching the empty panel costs a reload, and a replay built on
 * one would blink the whole page. `setFedTo(1)` is the same path the ◀ button already takes.
 *
 * A visitor who arrived with an entry in the address is left alone: the address said which state
 * they came for, and this would take it away from them.
 *
 * What stops it early, and what the bar says while it goes, is `composeOpeningWatched`'s. This is
 * the site's own and never the served page's: whoever is reading a change in `src/ui/` gets a
 * panel that stands still.
 */
function composeOpeningReplay(): string {
    assert(OPENING_HOLD_MILLISECONDS > 0, "the finished fight is held long enough to be read");
    return `var openingTimer = null;
var openingIsDone = false;
// Whether the press that stops the replay was the one on the play button: that press means pause
// and nothing else, so the button's own handler must not go on to start a replay after it.
var openingTookThePress = false;

var setOpeningSaid = function (said, playLabel) {
  var mark = document.getElementById("preview-opening");
  if (mark !== null) mark.textContent = said;
  var play = document.getElementById("preview-play");
  if (play !== null) play.textContent = playLabel;
};

var setOpeningStopped = function () {
  if (!openingIsDone) openingTookThePress = true;
  openingIsDone = true;
  if (openingTimer !== null) {
    window.clearTimeout(openingTimer);
    window.clearInterval(openingTimer);
    openingTimer = null;
  }
  setOpeningSaid("", PREVIEW.words.play);
};

var setOpeningRun = function () {
  if (openingIsDone) return;
  setOpeningSaid(PREVIEW.words.playing, PREVIEW.words.pause);
  setFedTo(1);
  openingTimer = window.setInterval(function handleOpeningStep() {
    if (openingIsDone) return;
    if (setNextFed()) return;
    window.clearInterval(openingTimer);
    openingTimer = null;
    setOpeningStopped();
  }, ${OPENING_STEP_MILLISECONDS});
};

var setOpeningHeld = function () {
  if (openingIsDone) return;
  setOpeningSaid(PREVIEW.words.playing, PREVIEW.words.pause);
  openingTimer = window.setTimeout(setOpeningRun, ${OPENING_HOLD_MILLISECONDS});
};

if (PREVIEW_STATE.entry === null) {
  setOpeningWatched();
  setOpeningHeld();
}`;
}

/**
 * What stops the loop, and what the bar says while it runs.
 *
 * **Only the bar stops it** — the one control on the page, where a recording is chosen and a
 * replay is driven. A press inside the panel, on the page behind it, or a scroll all leave it
 * running: the maintainer's decision of 2026-09-19. The cost falls where it is visible, so the
 * bar carries the word: a page whose figures move with no word for it reads as a page doing
 * something unasked, and a visitor who wants to read a row presses pause first.
 *
 * The press on the play button is a **pause and nothing else**. `pointerdown` stops the replay
 * before the button's own `click` handler runs, so without this the same press would stop the
 * loop and start a fresh replay in the same breath — the button would refuse to pause.
 */
function composeOpeningWatched(): string {
    return `// Guarded at the handover: a throw out of a listener unwinds into a dispatch loop that
// drops it, and the page would go on replaying with nothing able to stop it (**E12**).
var handleVisitorMoved = function () {
  try {
    setOpeningStopped();
  } catch (reason) {
    console.warn("MargoMeter/Preview", reason);
  }
};

// Capture on the bar, so this runs before the button's own handler and can keep it from firing.
var handlePlayPressed = function (event) {
  if (!openingTookThePress) return;
  openingTookThePress = false;
  var play = document.getElementById("preview-play");
  if (play === null) return;
  if (event.target !== play && !play.contains(event.target)) return;
  event.stopPropagation();
};

var setOpeningWatched = function () {
  var bar = document.querySelector("${PREVIEW_STRIP_SELECTOR}");
  if (bar === null) return;
  var taking = { capture: true, passive: true };
  bar.addEventListener("pointerdown", handleVisitorMoved, taking);
  bar.addEventListener("keydown", handleVisitorMoved, taking);
  bar.addEventListener("change", handleVisitorMoved, taking);
  bar.addEventListener("click", handlePlayPressed, true);
};`;
}

/** What a browser is handed, before anything writes it down. */
export interface PreviewSiteFile {
    name: string;
    text: string;
}

function composePageOfFight(fight: RecordedFight, install: PreviewInstall): string {
    assert(fight.calls.length > 0, "a page is written for a fight there is something to play");
    assert(install.name.length > 0, "and the band over it offers the file it is a preview of");
    return composePreviewPage({
        fightName: fight.name,
        // The finished fight, where a server opens on nothing: a visitor's first sight should be
        // the thing the add-on is for. The empty panel is a state worth looking at and
        // `od początku` reaches it, which is why that button exists.
        entryIndex: fight.calls.length,
        calls: fight.calls,
        // None: a published page offers no choice of recording, so its bar carries no picker
        // and nothing on it leads to another fight.
        fights: [],
        scriptDirectory: "./",
        words: PREVIEW_SITE_WORDS,
        introduction: PREVIEW_SITE_INTRODUCTION,
        doesAddressCarryState: false,
        doesStartFromEmpty: false,
        install,
        // No process behind these pages, so nothing to listen to — only the windows to place.
        appendedScript:
            `${composeSiteWindows()}\n\n${composeOpeningWatched()}\n\n${composeOpeningReplay()}`,
    });
}

/**
 * Every page of the site, which needs no bundle and therefore touches nothing. The version is
 * required rather than defaulted: a default would let the published page lose the number it
 * states without a single test noticing, which is the shape of failure this file is about.
 */
export function composePreviewSitePages(version: string): PreviewSiteFile[] {
    assert(version.length > 0, "every page states which build drew it");
    const fights = getRecordedFights();
    const landing = getPreviewRecordedFight(fights);
    const install = composeSiteInstall(version);
    const pages: PreviewSiteFile[] = [
        { name: LANDING_PAGE, text: composePageOfFight(landing, install) },
    ];
    assertStrictEquals(pages.length, 1, "the site is one page over one recording");
    assert(
        pages.every((page) => page.text.includes(PREVIEW_INSTALL_OPENING)),
        "and it offers the file it is a preview of",
    );
    return pages;
}

/**
 * The pages, plus the two scripts they name. The decoy is a real file here where a server answers
 * it with a 404: only its `src` attribute is ever read, but a host that answers a miss with its
 * own HTML turns the tag into a syntax error in every visitor's console — on a page whose whole
 * purpose is to look like nothing is wrong.
 */
async function composePreviewSiteFiles(version: string): Promise<PreviewSiteFile[]> {
    assert(version.length > 0, "a published page states the version it draws");
    const bundle = await composeUserscriptFiles(
        version,
        `${OUTPUT_DIRECTORY}/${USERSCRIPT_NAME}`,
    );
    assert(bundle.script.length > 0, "the pages carry the add-on they are a preview of");
    const files = [
        ...composePreviewSitePages(version),
        { name: USERSCRIPT_NAME, text: bundle.script },
        {
            name: PREVIEW_GAME_SCRIPT_NAME,
            text: "// Nothing reads this file. Its name carries the build id the page states.\n",
        },
    ];
    assert(files.length > 2, "and the two scripts every page names");
    return files;
}

async function writePreviewSiteFiles(version: string): Promise<string> {
    const files = await composePreviewSiteFiles(version);
    await Deno.mkdir(OUTPUT_DIRECTORY, { recursive: true });
    for (const file of files) {
        await Deno.writeTextFile(`${OUTPUT_DIRECTORY}/${file.name}`, file.text);
    }
    assert(files.length > 0, "a site that was written has something in it");
    console.log(`${OUTPUT_DIRECTORY}, ${files.length} files`);
    return OUTPUT_DIRECTORY;
}

if (import.meta.main) {
    const written = await writePreviewSiteFiles(getVersionForRun(Deno.args));
    console.log(`serve that directory, or let .github/workflows/pages.yml publish it`);
    console.log(`opened from disk it works too: ${written}/index.html`);
}
