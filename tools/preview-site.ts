/**
 * The panel as one page somebody without this repository can open: the preview GitHub Pages
 * publishes. It is `tools/preview-page.ts` over one recording, with the band offering the add-on
 * and the windows taken to the corner, in Polish because a player reads it (L2). It keeps nothing
 * in its address or the browser's store, opens on the finished fight and plays it once
 * (`develop ADR 0028`, `0099`). The output goes under `dist/preview/`, which git does not carry.
 *
 *     deno task preview:site [--release]
 */

import { assert, assertStrictEquals } from "@std/assert";
import { CLASS, PLACE, SPACE_PIXELS } from "#/src/ui/panel-look.ts";
import { PANEL_WINDOW } from "#/src/ui/panel-choice.ts";
import { GRIP_ATTRIBUTE, GRIP_MARK_BY_WINDOW } from "#/src/ui/panel-drag.ts";
import { GAME_SCRIPT_NAME, HOST_SELECTOR, PROBE_NAME } from "#/tests/e2e/game-page.ts";
import { lookupRecordedFight, type RecordedFight } from "#/tests/recorded-fights.ts";
import {
    parseDeclaredVersion,
    readDevelopmentVersion,
    readUserscriptFiles,
    USERSCRIPT_DOWNLOAD_ADDRESS,
    USERSCRIPT_NAME,
} from "./build-userscript.ts";
import {
    composePreviewPage,
    PREVIEW_INSTALL_OPENING,
    PREVIEW_SAID_SELECTOR,
    PREVIEW_SPLIT_SELECTOR,
    PREVIEW_STRIP_SELECTOR,
    PREVIEW_TIPS_WIDTH_PIXELS,
    type PreviewInstall,
    type PreviewWords,
    SPLIT_FROM_PIXELS,
    WINDOWS_ACROSS_PIXELS,
} from "./preview-page.ts";
import { formatRecordingName } from "./recorded-material.ts";

/** What a browser is handed, before anything writes it down. */
export interface PreviewSiteFile {
    name: string;
    text: string;
}

/** The fight the published page opens on, so the page a visitor knows stays the page. */
export const LANDING_RECORDING = "captures/2026-09-11-luvia-grupa-vs-amaimon-Cl9U89Zr-0.15.0.json";
const OUTPUT_DIRECTORY = "dist/preview";
const LANDING_PAGE = "index.html";
const HOMEPAGE = "https://github.com/KamilGrocholski/margometer";
const RELEASE_FLAG = "--release";
const CONFIGURATION_FILE = "deno.json";
/** What the pair stands off the seam by, level with the padding the half beside it carries. */
const SEAM_GUTTER_PIXELS = 32;
/** Three rows of one fighter under the heading; less than that reads as a column cut off. */
const TIPS_TALL_MINIMUM_PIXELS = 140;
/**
 * The add-on draws on an animation frame, so the panel may not stand yet when the page places it:
 * the page flushes the frames it holds, and past that waits a bounded number of tries (S2).
 */
const WINDOWS_WAIT_TRIES = 40;
const WINDOWS_WAIT_EVERY_MILLISECONDS = 25;
/** How long the finished fight stands before the opening replay: long enough to read a ranking. */
const OPENING_HOLD_MILLISECONDS = 2600;
/** Slower than a pressed replay: a visitor who pressed nothing is watching, not waiting. */
const OPENING_STEP_MILLISECONDS = 300;

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

/** That this is a recording, that the panel answers a pointer, and what the right half shows. */
const PREVIEW_SITE_INTRODUCTION = [
    "Obok nagrana walka: zobaczysz panel oraz dymki postaci, zmienione przez dodatek." +
    " Kliknij wiersz albo najedź na postać.",
    `<a href="${HOMEPAGE}">kod źródłowy</a>`,
].join(" ");

/** Every file of the site: the page, the bundle it runs, and the decoy it takes a build id off. */
export async function composePreviewSiteFiles(version: string): Promise<PreviewSiteFile[]> {
    assert(version.length > 0, "a published page states the build it draws");
    const bundle = await readUserscriptFiles(version);
    const files = [
        {
            name: LANDING_PAGE,
            text: composeSitePage(lookupRecordedFight(LANDING_RECORDING), version),
        },
        { name: USERSCRIPT_NAME, text: bundle.script },
        // A real file where a server answers a miss: a host answering one with its own HTML turns
        // the tag into a syntax error in every visitor's console.
        {
            name: GAME_SCRIPT_NAME,
            text: "// Nothing reads this file; its name carries a build id.\n",
        },
    ];
    assertStrictEquals(files.length, 3, "one page and the two scripts it names");
    return files;
}

/** The landing recording, finished, under the band; no picker, and nothing kept. */
export function composeSitePage(fight: RecordedFight, version: string): string {
    assert(fight.updates.length > 0, "a page is written for a fight there is something to play");
    const page = composePreviewPage({
        fightName: formatRecordingName(fight.path),
        entryIndex: fight.updates.length,
        calls: fight.updates,
        fights: [],
        scriptDirectory: "./",
        words: PREVIEW_SITE_WORDS,
        introduction: PREVIEW_SITE_INTRODUCTION,
        doesAddressCarryState: false,
        doesStartFromEmpty: false,
        install: composeSiteInstall(version),
        appendedScript: [
            composeSiteWindows(),
            composeOpeningWatched(),
            composeOpeningReplay(),
        ].join("\n\n"),
    });
    assert(page.includes(PREVIEW_INSTALL_OPENING), "the page offers the file it is a preview of");
    return page;
}

/**
 * `chrome://extensions` stays plain text: a browser refuses that navigation from a page, so a link
 * there does nothing and reads as broken. Every figure the sentence promises is one the panel
 * draws, which is the whole test of it.
 */
function composeSiteInstall(version: string): PreviewInstall {
    assert(version.length > 0, "the band states the build behind its button");
    return {
        name: "MargoMeter",
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
        // `obok`: the page takes both windows to the corner, so the panel stands right of this.
        afterLine: "Potem zacznij walkę — panel pojawi się sam, jak ten obok.",
    };
}

/**
 * Both windows taken to the corner, because the band needs the left of the page and a panel opens
 * centred. By their own bars, never through the store: a card reads the position the panel keeps,
 * which a place written behind its back does not move (`develop ADR 0099`). Again on every resize,
 * since a narrower window leaves the panel at what was a corner in the old one. A page that finds
 * no panel is still a page, so a failure is one console line.
 */
function composeSiteWindows(): string {
    return `${composeWindowDragging()}

${composeWindowsCornered()}

${composeStripAtTop()}

${composeTipsPlaced()}

var setWindowsPlaced = function () {
  var taken = Element.prototype.setPointerCapture;
  var given = Element.prototype.releasePointerCapture;
  delete Element.prototype.setPointerCapture;
  delete Element.prototype.releasePointerCapture;
  try {
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

var windowsTries = 0;
var setWindowsPlacedOnceDrawn = function () {
  windowsTries += 1;
  if (document.querySelector(${JSON.stringify(HOST_SELECTOR)}) === null) {
    if (windowsTries < ${WINDOWS_WAIT_TRIES}) window.setTimeout(setWindowsPlacedOnceDrawn, ${WINDOWS_WAIT_EVERY_MILLISECONDS});
    return;
  }
  setWindowsPlaced();
  setTipsWatched();
};

window.${PROBE_NAME}.flushFrames();
setWindowsPlacedOnceDrawn();
window.addEventListener("resize", setWindowsPlaced);`;
}

/**
 * ⚠️ A pointer dispatched here is not one the browser has, so the caller takes `setPointerCapture`
 * away around the drag: on Chrome 152, 2026-09-05, both throw `NotFoundError` and the panel states
 * two gesture defects. `buttons: 1`, because a move stating none is a hand that has let go.
 */
function composeWindowDragging(): string {
    const standing = `.${CLASS.standing}`;
    return `var getPanelHost = function () {
  var host = document.querySelector(${JSON.stringify(HOST_SELECTOR)});
  if (host === null) throw new ReferenceError("there is no panel on this page");
  return host;
};

var getStandingWindow = function () {
  var beside = getPanelHost().shadowRoot.querySelector(${JSON.stringify(standing)});
  if (beside === null) throw new ReferenceError("there is no window beside the panel");
  return beside;
};

var setWindowDragged = function (mark, acrossBy, downBy) {
  var bar = getPanelHost().shadowRoot.querySelector('[${GRIP_ATTRIBUTE}="' + mark + '"]');
  if (bar === null) throw new ReferenceError(mark + " has no bar to take hold of");
  var box = bar.getBoundingClientRect();
  var setPointer = function (type, left, top) {
    bar.dispatchEvent(new PointerEvent(type, {
      bubbles: true, composed: true, button: 0, buttons: 1, clientX: left, clientY: top
    }));
  };
  setPointer("pointerdown", box.left, box.top);
  setPointer("pointermove", box.left + acrossBy, box.top + downBy);
  setPointer("pointerup", box.left + acrossBy, box.top + downBy);
};`;
}

/**
 * The panel against the edge the page gives it, and the window beside it on the side the panel
 * leaves, tops level. The edge is the window's right while the page is one column, and a line past
 * the seam once it is two: against the window's own edge the pair left 274px of empty half at
 * 1512, and centred in the half a 4K screen put 723px of nothing either side of it.
 */
function composeWindowsCornered(): string {
    assert(PLACE.insetPixels > 0, "a corner stands off the edge by what the sheet leaves");
    const across = `(window.innerWidth < ${SPLIT_FROM_PIXELS} ? window.innerWidth` +
        ` : Math.min(window.innerWidth, window.innerWidth / 2 + ${
            WINDOWS_ACROSS_PIXELS + SEAM_GUTTER_PIXELS
        }))`;
    return `var setPanelInCorner = function () {
  var box = getPanelHost().getBoundingClientRect();
  var across = ${across};
  var down = getStripBelow();
  setWindowDragged(${JSON.stringify(GRIP_MARK_BY_WINDOW[PANEL_WINDOW.panel])},
    across - ${PLACE.insetPixels} - box.width - box.left, down - box.top);
};

var setStandingBeside = function () {
  var box = getStandingWindow().getBoundingClientRect();
  var panel = getPanelHost().getBoundingClientRect();
  setWindowDragged(${JSON.stringify(GRIP_MARK_BY_WINDOW[PANEL_WINDOW.helper])},
    panel.left - ${SPACE_PIXELS.small} - box.width - box.left, panel.top - box.top);
};`;
}

/**
 * What the bar along the top comes to, and the page pushed down under it. ⚠️ Its height is measured
 * and never assumed: the bar wraps at a narrow window and again inside its half once the page
 * splits. Never docked off the panel's bottom edge, which grows when a row opens and covers it.
 */
function composeStripAtTop(): string {
    return `var getStripBelow = function () {
  var strip = document.querySelector("${PREVIEW_STRIP_SELECTOR}");
  if (strip === null) return ${PLACE.insetPixels};
  return Math.round(strip.getBoundingClientRect().height) + ${PLACE.insetPixels};
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
 * The column of tooltips beside the panel where the half has room, and under both windows where it
 * has not, read off the panel as it stands. ⚠️ The panel grows when a row opens, so a change in
 * either window's size places the column again; one left too short to say anything is hidden.
 */
function composeTipsPlaced(): string {
    assert(TIPS_TALL_MINIMUM_PIXELS > 0, "a column shorter than something is not worth drawing");
    return `var setTipsPlaced = function () {
  var tips = document.getElementById("preview-tips");
  if (tips === null) return;
  var panel = getPanelHost().getBoundingClientRect();
  var beside = getStandingWindow().getBoundingClientRect();
  var room = window.innerWidth - panel.right - ${SEAM_GUTTER_PIXELS};
  var isBeside = room >= ${PREVIEW_TIPS_WIDTH_PIXELS};
  var top = isBeside ? panel.top : Math.max(panel.bottom, beside.bottom) + ${
        SEAM_GUTTER_PIXELS / 2
    };
  var left = isBeside ? panel.right + ${SEAM_GUTTER_PIXELS} : beside.left;
  var width = isBeside ? ${PREVIEW_TIPS_WIDTH_PIXELS} : panel.right - beside.left;
  var tall = window.innerHeight - ${PLACE.insetPixels} - top;
  tips.style.left = Math.round(left) + "px";
  tips.style.top = Math.round(top) + "px";
  tips.style.width = Math.round(width) + "px";
  tips.style.height = Math.round(tall) + "px";
  tips.style.visibility = tall < ${TIPS_TALL_MINIMUM_PIXELS} ? "hidden" : "visible";
};

// Guarded at the handover (E10): a throw out of an observer's callback unwinds into a loop.
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
 * What stops the opening replay, and what the bar says while it runs. Only the bar stops it — a
 * press in the panel or a scroll leaves it running (the maintainer, 2026-09-19) — so the bar
 * carries the word. The press on play is a pause and nothing else: `pointerdown` stops the replay
 * before the button's own `click`, which would otherwise start a fresh one in the same breath.
 */
function composeOpeningWatched(): string {
    return `var handleVisitorMoved = function () {
  try {
    setOpeningStopped();
  } catch (reason) {
    console.warn("MargoMeter/Preview", reason);
  }
};

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

/**
 * The fight played through once on arriving, from the first call, and then left alone on the
 * ranking: a page replaying for as long as a tab is open is motion beside a band that has to be
 * read. ⚠️ Entry 0 needs a fresh document, so the run starts at the first call and never blinks.
 */
function composeOpeningReplay(): string {
    assert(OPENING_HOLD_MILLISECONDS > 0, "the finished fight is held long enough to be read");
    assert(OPENING_STEP_MILLISECONDS > 0, "and each step of the replay rests on screen");
    return `var openingTimer = null;
var openingIsDone = false;
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

/** The release number where the run says it stands on the release tree, marked `-dev` otherwise. */
export function readSiteVersion(args: readonly string[]): string {
    if (!args.includes(RELEASE_FLAG)) return readDevelopmentVersion();
    return parseDeclaredVersion(Deno.readTextFileSync(CONFIGURATION_FILE));
}

if (import.meta.main) {
    const files = await composePreviewSiteFiles(readSiteVersion(Deno.args));
    await Deno.mkdir(OUTPUT_DIRECTORY, { recursive: true });
    for (const file of files) {
        await Deno.writeTextFile(`${OUTPUT_DIRECTORY}/${file.name}`, file.text);
    }
    console.log(`${OUTPUT_DIRECTORY}: ${files.map((file) => file.name).join(", ")}`);
}
