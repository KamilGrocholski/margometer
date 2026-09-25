/**
 * The page both previews draw: the game page the browser suite drives (`tests/e2e/game-page.ts`),
 * with the harness around it — a bar that steps one recording and picks another, a column of what
 * landed in the game's tooltips, a store that forgets, and on the published page the band offering
 * the add-on. Every word a reader sees arrives as an option, so this file speaks neither language:
 * a served page is read by whoever is editing `src/`, a published one by a player (L2).
 * `tools/preview-server.ts` answers requests for it and `tools/preview-site.ts` writes it down.
 */

import { assert, assertStringIncludes } from "@std/assert";
import { ENVELOPE_KEYS } from "#/src/game/payload-envelope.ts";
import { WARRIOR_FIELDS } from "#/src/game/engine-warrior.ts";
import { PLACE, SHAPE, SPACE_PIXELS, STANDING, SURFACE, TEXT } from "#/src/ui/panel-look.ts";
import { formatColour, SIGNAL } from "#/src/ui/panel-palette.ts";
import { composePanelPage, PROBE_NAME } from "#/tests/e2e/game-page.ts";
import { USERSCRIPT_NAME } from "./build-userscript.ts";
import {
    composePreviewStateBare,
    composePreviewStateReading,
    composePreviewStateWriting,
} from "./preview-state.ts";

/** Every word the bar draws, so the language of a page is a value and never a branch. */
export interface PreviewWords {
    /** What `<html lang>` declares, which a browser's offer to translate reads. */
    language: string;
    title: string;
    /** The place the panel draws, which no recording carries and every bar states. */
    placeName: string;
    start: string;
    /** The ◀ button's tooltip, since an arrow says nothing about the replay behind it. */
    backHint: string;
    end: string;
    play: string;
    pause: string;
    entry: string;
    /** What the bar says while the replay runs unasked: figures moving with no word read wrong. */
    playing: string;
    tooltips: string;
}

/** A recording the picker offers, and where choosing it goes. */
export interface PreviewFightLink {
    name: string;
    address: string;
    /** Where its calls can be fetched, or null where no process answers. */
    callsAddress: string | null;
}

export interface PreviewInstallNeed {
    text: string;
    /** Whether its failure says nothing, which is the one the band marks. */
    isSilent: boolean;
}

/** The band a published page opens with, for a reader who arrived having installed nothing. */
export interface PreviewInstall {
    name: string;
    sentence: string;
    needsLine: string;
    /** Above the button: a reader who presses first installs, sees nothing, and reads why after. */
    needs: readonly PreviewInstallNeed[];
    offer: { label: string; address: string };
    versionLine: string;
    afterLine: string;
}

export interface PreviewPageOptions {
    fightName: string;
    /** Where the replay stops. The caller clamps it; nothing here reads text into a number. */
    entryIndex: number;
    /** The whole recording, carried in the page: a page that fetched its fight is empty at `load`. */
    calls: readonly unknown[];
    fights: readonly PreviewFightLink[];
    /** `/` while a server answers every path; `./` where a host serves a project under one. */
    scriptDirectory: string;
    words: PreviewWords;
    introduction: string | null;
    /** Whether the address carries the entry, the screen and the store (`tools/preview-state.ts`). */
    doesAddressCarryState: boolean;
    /**
     * What `from the start` reaches: the empty panel, which only a fresh document gives, or the
     * first call, which a replay does without the page blinking (the maintainer, 2026-09-19).
     */
    doesStartFromEmpty: boolean;
    install: PreviewInstall | null;
    /** Run after the driver, still synchronously: hot reloading, or the site's windows. */
    appendedScript: string | null;
}

/** The band's own tag, spelled once: the site asserts on it and so does its test. */
export const PREVIEW_INSTALL_OPENING = `<header class="preview-install">`;
export const PREVIEW_TIPS_WIDTH_PIXELS = 272;
export const PREVIEW_STRIP_SELECTOR = ".preview-strip";
export const PREVIEW_SPLIT_SELECTOR = ".preview-split";
export const PREVIEW_SAID_SELECTOR = ".preview-said";
/** What the two windows take across: inset, panel, the gap between, and the window beside it. */
export const WINDOWS_ACROSS_PIXELS = PLACE.insetPixels + PLACE.widthPixels + SPACE_PIXELS.small +
    STANDING.widthPixels;
/** Air past the windows, so the text never runs up against them. */
const COLUMN_AIR_PIXELS = 58;
/**
 * Where a column of text ends, so nothing runs under the windows the corner holds. Split, the text
 * keeps its half; one column, the windows' reserve binds; the lesser of both holds either layout.
 */
export const COLUMN_WIDTH_MAXIMUM = `min(46em, calc(100vw - ${
    WINDOWS_ACROSS_PIXELS + COLUMN_AIR_PIXELS
}px), calc(50vw - 64px))`;
/** Below this the page is one column: 1024 is the first standard width whose half clears the pair. */
export const SPLIT_FROM_PIXELS = 1024;
/** Below this height the left half tightens: a 1280×720 screen leaves Chrome about 577px of page. */
const SPLIT_SHORT_PIXELS = 780;
/** Past which nobody reads as far as the button (S11). */
const INSTALL_NEEDS_MAXIMUM = 4;
/** What a pressed replay runs for, whatever the recording holds; the step falls out of it. */
const PLAY_SECONDS = 12;
const PLAY_STEP_MINIMUM_MILLISECONDS = 90;
const PLAY_STEP_MAXIMUM_MILLISECONDS = 900;
/** The game's own page colour, read off v0.10.1's picture of the panel in the game: its ground. */
const GAME_PAGE_COLOUR = "#14171c";
/** Counted down from the panel's own layer, so the harness never covers the thing under test. */
const PREVIEW_STRIP_LAYER = Number(PLACE.layer) - 1;
const PREVIEW_TIPS_LAYER = PREVIEW_STRIP_LAYER - 1;
/** The mark on the need whose failure is silent, drawn rather than spelled: a glyph takes a face. */
const SILENT_MARK = '<svg class="preview-mark" viewBox="0 0 18 18" aria-hidden="true">' +
    '<path d="M9 2.4 16.2 15H1.8Z"></path><path d="M9 7v4"></path>' +
    '<path d="M9 13.2v.1"></path></svg>';

export function composePreviewPage(options: PreviewPageOptions): string {
    assert(options.calls.length > 0, "a page draws a fight that has something in it");
    assert(options.entryIndex <= options.calls.length, "and stops somewhere inside that fight");
    assert(options.scriptDirectory.endsWith("/"), "its scripts are asked for under a directory");
    const settings = composeEscapedJson({
        fightName: options.fightName,
        entryIndex: options.entryIndex,
        entryCount: options.calls.length,
        fights: options.fights,
        words: options.words,
    });
    const state = options.doesAddressCarryState
        ? composePreviewStateReading()
        : composePreviewStateBare();
    const script = [
        composePreviewDriver(),
        options.doesAddressCarryState ? composePreviewStateWriting() : "",
        composePreviewPicks(options.doesStartFromEmpty),
        options.appendedScript ?? "",
    ].join("\n");
    return composePanelPage({
        calls: options.calls,
        fedThrough: 0,
        engine: "before",
        doesLoadTwice: false,
        place: options.words.placeName,
        userscriptName: USERSCRIPT_NAME,
        scriptDirectory: options.scriptDirectory,
        title: `${options.words.title} — ${options.fightName}`,
        language: options.words.language,
        beforeBundle: `<script>${state}</script>\n<script>${composePreviewStore()}</script>\n`,
        afterDriver: `${composePreviewBody(options)}
<script id="preview-settings" type="application/json">${settings}</script>
<script>
${script}
</script>
`,
    });
}

/** Somebody else's material, on its way into a tag it must not be able to close. */
function composeEscapedJson(value: unknown): string {
    const written = JSON.stringify(value);
    assert(typeof written === "string", "what a page carries is written out as text");
    return written.split("<").join("\\u003c");
}

/**
 * What the page shows around the panel. The two halves are the published page's alone: a served
 * page carries no band, so the panel keeps the whole window it is judged in.
 */
function composePreviewBody(options: PreviewPageOptions): string {
    const introduction = options.introduction === null
        ? ""
        : `<p class="preview-intro">${options.introduction}</p>`;
    const band = options.install === null ? "" : composePreviewInstall(options.install);
    const tips = composePreviewTooltips(options.words);
    const tipsStyle = options.install === null
        ? composePreviewTooltipsStyle()
        : composePreviewTooltipsPlacedStyle();
    const said = options.install === null
        ? `${tips}${introduction}`
        : `<main class="preview-split"><div class="preview-said">${band}
${introduction}</div><div class="preview-stage"></div></main>
${tips}`;
    return `<style>
${composePreviewStyle()}
${composeSplitStyle()}
${tipsStyle}
</style>
${said}
${composePreviewStrip(options.words, options.fights.length > 0)}`;
}

function composePreviewInstall(install: PreviewInstall): string {
    assert(install.name.length > 0, "the band says what is on offer");
    assert(install.sentence.length > 0, "and what it does, to somebody who has not seen it");
    assert(install.versionLine.length > 0, "and which build the button hands over");
    // Absolute where every other address is relative: a reader saving or sending this one must
    // land on the same file, and `./` beside a page is whatever that host last deployed.
    assert(install.offer.address.startsWith("https://"), "and it hands over a file, not a path");
    const button = `<a class="preview-get" href="${install.offer.address}">` +
        `${install.offer.label}</a>`;
    return `${PREVIEW_INSTALL_OPENING}
  <h1>${install.name}</h1>
  <p class="preview-lede">${install.sentence}</p>
${composePreviewInstallNeeds(install)}
  <p class="preview-take">${button}
    <span class="preview-version">${install.versionLine}</span></p>
  <p class="preview-after">${install.afterLine}</p>
</header>`;
}

/** Numbered, with the step whose failure is silent marked where it stands (`develop ADR 0099`). */
function composePreviewInstallNeeds(install: PreviewInstall): string {
    assert(install.needs.length > 0, "there is at least one thing to have first");
    assert(install.needs.length <= INSTALL_NEEDS_MAXIMUM, "and not more than a reader walks");
    assert(install.needs.some((need) => need.isSilent), "the one that says nothing is among them");
    const items = install.needs.map((need) => {
        if (!need.isSilent) return `    <li>${need.text}</li>`;
        return `    <li class="preview-warn">${SILENT_MARK}${need.text}</li>`;
    }).join("\n");
    return `  <p class="preview-needs-line">${install.needsLine}</p>
  <ol class="preview-needs">
${items}
  </ol>`;
}

/**
 * Every colour but the page's own ground is the panel's, out of `src/ui/panel-look.ts`: measured
 * 2026-09-19, a sheet choosing its own spelled 21 colours and none the panel states.
 */
function composePreviewStyle(): string {
    const sheet = `html, body { margin: 0; height: 100%; background: ${GAME_PAGE_COLOUR};
  color: ${formatColour(TEXT.plain)}; font: 13px/1.5 ui-sans-serif, system-ui, sans-serif; }
.preview-intro { margin: 0; padding: 18px 20px; max-width: ${COLUMN_WIDTH_MAXIMUM};
  color: ${formatColour(TEXT.quiet)}; }
.preview-intro a, .preview-install a { color: ${formatColour(SIGNAL.caveat)}; }
.preview-install { padding: 20px 20px 0; max-width: ${COLUMN_WIDTH_MAXIMUM}; }
.preview-install h1 { margin: 0; font-size: 21px; color: ${formatColour(TEXT.plain)}; }
.preview-lede { margin: 4px 0 14px; }
.preview-take { margin: 0; }
/* Specificity, not order: \`.preview-install a\` would take the button's own ink with it. */
.preview-install a.preview-get { display: inline-block; padding: 13px 28px;
  border-radius: ${SHAPE.radiusPixels}px; background: ${formatColour(SIGNAL.ours)};
  border: 1px solid ${formatColour(SIGNAL.ours)}; color: ${formatColour(TEXT.inkDark)};
  font-size: 16px; font-weight: 600; text-decoration: none; white-space: nowrap; }
.preview-version { margin-left: 10px; color: ${formatColour(TEXT.quiet)}; }
.preview-needs-line { margin: 16px 0 8px; color: ${formatColour(TEXT.quiet)}; }
.preview-needs { margin: 0 0 16px; padding: 0 0 0 26px; display: flex; flex-direction: column;
  gap: 8px; }
.preview-needs li { padding: 9px 12px; border: 1px solid ${formatColour(SURFACE.border)};
  border-radius: ${SHAPE.radiusPixels}px; background: ${formatColour(SURFACE.raised)}; }
.preview-warn { border-color: ${formatColour(SIGNAL.suspect)};
  background: ${formatColour(SURFACE.track)}; }
.preview-warn strong { color: ${formatColour(SIGNAL.suspect)}; }
.preview-mark { width: 18px; height: 18px; margin: 0 6px -4px 0; fill: none;
  stroke: ${formatColour(SIGNAL.suspect)}; stroke-width: 1.4; stroke-linecap: round;
  stroke-linejoin: round; }
.preview-after { margin: 8px 0 0; color: ${formatColour(TEXT.quiet)}; }
.preview-install + .preview-intro { padding-top: 14px; }
.preview-said > :first-child { padding-top: 0; }
${composeStripStyle()}`;
    assertStringIncludes(sheet, GAME_PAGE_COLOUR, "the panel is judged against the game's page");
    assertStringIncludes(sheet, COLUMN_WIDTH_MAXIMUM, "a column ends where the windows begin");
    assertStringIncludes(sheet, ".preview-get", "and the offer is a button, not a word in a line");
    return sheet;
}

/** The bar along the top, under the panel's layer and over the page it drives. */
function composeStripStyle(): string {
    assert(PREVIEW_STRIP_LAYER < Number(PLACE.layer), "the bar stands under the panel, not over");
    const border = formatColour(SURFACE.border);
    return `.preview-strip { position: fixed; left: 0; right: 0; top: 0; z-index: ${PREVIEW_STRIP_LAYER};
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px; padding: 8px 16px;
  background: ${formatColour(SURFACE.raised)}; border-bottom: 1px solid ${border}; }
.preview-line { display: flex; gap: 10px; align-items: center; flex-wrap: nowrap; overflow: auto; }
.preview-strip button, .preview-strip select { font: inherit; color: inherit;
  background: ${formatColour(SURFACE.track)}; border: 1px solid ${border};
  border-radius: ${SHAPE.radiusSmallPixels}px; padding: 3px 9px; cursor: pointer; }
.preview-strip select { width: 26em; }
.preview-title { font-weight: 600; color: ${formatColour(TEXT.quiet)}; letter-spacing: .04em; }
.preview-count { font-variant-numeric: tabular-nums; color: ${formatColour(TEXT.quiet)}; }
.preview-opening:empty { display: none; }
.preview-opening { padding: 2px 9px; border-radius: ${SHAPE.radiusSmallPixels}px;
  background: ${formatColour(SURFACE.track)}; border: 1px solid ${formatColour(SIGNAL.ours)};
  color: ${formatColour(SIGNAL.ours)}; }
.preview-build { margin-left: auto; }
.preview-ok { color: ${formatColour(SIGNAL.ours)}; }
.preview-bad { color: ${formatColour(SIGNAL.theirs)}; }
.preview-log { display: none; flex-basis: 100%; margin: 0; padding: 8px; overflow: auto;
  max-height: 30vh; white-space: pre-wrap; background: ${formatColour(SURFACE.panel)};
  border: 1px solid ${formatColour(SIGNAL.suspect)}; border-radius: ${SHAPE.radiusSmallPixels}px;
  color: ${formatColour(SIGNAL.suspect)}; font: 12px/1.45 ui-monospace, monospace; }
.preview-log[data-shown="yes"] { display: block; }`;
}

/**
 * The page in two halves from `SPLIT_FROM_PIXELS` up: what is said on the left, on the panel's own
 * surface, and the thing said about on the right, on the game's ground. The bar goes over the half
 * it drives, since it changes the panel and nothing on the left.
 */
function composeSplitStyle(): string {
    const border = formatColour(SURFACE.border);
    return `.preview-split { display: block; }
.preview-stage { display: none; }
@media (min-width: ${SPLIT_FROM_PIXELS}px) {
  .preview-split { display: flex; align-items: stretch; min-height: 100vh; box-sizing: border-box; }
  .preview-said { width: 50vw; flex-shrink: 0; box-sizing: border-box; padding: 32px;
    background: ${formatColour(SURFACE.panel)}; border-right: 1px solid ${border};
    display: flex; flex-direction: column; align-items: center; overflow-y: auto; }
  .preview-stage { display: block; flex-grow: 1; background: ${GAME_PAGE_COLOUR}; }
  .preview-install { padding: 0; }
  .preview-install h1 { font-size: 38px; letter-spacing: -0.015em; }
  .preview-take { margin-top: 24px; text-align: center; }
  .preview-version { display: block; margin: 10px 0 0; }
  .preview-lede { margin: 10px 0 22px; font-size: 15px; color: ${formatColour(TEXT.plain)}; }
  .preview-intro { padding-left: 0; padding-right: 0; }
  .preview-install h1, .preview-lede, .preview-needs-line, .preview-after,
  .preview-intro { text-align: center; }
  .preview-strip { left: 50vw; right: 0; border-left: 1px solid ${border}; }
  .preview-strip select { width: auto; flex: 1 1 14em; min-width: 0; }
  .preview-title { display: none; }
}
@media (min-width: ${SPLIT_FROM_PIXELS}px) and (max-height: ${SPLIT_SHORT_PIXELS}px) {
  .preview-install h1 { font-size: 30px; }
  .preview-lede { margin: 8px 0 16px; }
  .preview-needs { margin-bottom: 12px; }
  .preview-take { margin-top: 16px; }
}`;
}

/** The served page keeps the column down its left edge; the panel opens at the right. */
function composePreviewTooltipsStyle(): string {
    return `${composePreviewTipsCardStyle()}
.preview-tips { left: 0; top: 44px; bottom: 0; width: ${PREVIEW_TIPS_WIDTH_PIXELS}px;
  border-width: 0 1px 0 0; }`;
}

/** The published page's column, hidden until its script stands it beside the panel. */
function composePreviewTooltipsPlacedStyle(): string {
    return `${composePreviewTipsCardStyle()}
.preview-tips { visibility: hidden; border-radius: ${SHAPE.radiusPixels}px; }`;
}

/**
 * ⚠️ The top padding is the heading's, not the column's: a sticky box stops at the scroller's
 * padding edge, and 10px there held the scrolled heading 10px down (Chrome, 2026-09-23).
 */
function composePreviewTipsCardStyle(): string {
    assert(PREVIEW_TIPS_LAYER > 0, "the column stands on the page, not behind its ground");
    assert(PREVIEW_TIPS_LAYER < PREVIEW_STRIP_LAYER, "and under the bar, so under the panel too");
    const panel = formatColour(SURFACE.panel);
    const border = formatColour(SURFACE.border);
    return `.preview-tips { position: fixed; z-index: ${PREVIEW_TIPS_LAYER}; padding: 0 12px 10px;
  overflow-y: auto; box-sizing: border-box; scrollbar-width: thin;
  scrollbar-color: ${formatColour(TEXT.quiet)} transparent; border: 1px solid ${border};
  background: ${panel}; }
.preview-tips h2 { position: sticky; top: 0; z-index: 1; margin: 0 -12px 8px;
  padding: 10px 12px 6px; background: ${panel}; border-bottom: 1px solid ${border};
  font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
  color: ${formatColour(TEXT.quiet)}; }
.preview-tip { margin: 0 0 8px; padding: 6px 8px; border: 1px solid ${border};
  border-radius: ${SHAPE.radiusSmallPixels}px; background: ${formatColour(SURFACE.raised)};
  display: flex; flex-direction: column; font-size: 11px; line-height: 15px; }
.preview-tip b { color: ${formatColour(TEXT.plain)}; }
.preview-tip span { color: ${formatColour(SIGNAL.ours)}; }`;
}

/**
 * What the add-on wrote into the game's own tooltips, one block per fighter. It is the real path:
 * the stub's fighters carry a `$` of the client's shape, so `src/game/engine-tooltip.ts` writes
 * through the registry's own methods, and a renamed method shows here as an empty block.
 */
function composePreviewTooltips(words: PreviewWords): string {
    assert(words.tooltips.length > 0, "the column says what it is showing");
    return `<aside class="preview-tips" id="preview-tips">` +
        `<h2>${words.tooltips}</h2><div id="preview-tips-list"></div></aside>\n`;
}

function composePreviewStrip(words: PreviewWords, doesOfferFights: boolean): string {
    assert(words.title.length > 0, "the bar says what it is");
    assert(words.entry.length > 0, "and what it is counting");
    return `<div class="preview-strip">
  <div class="preview-line">
    <span class="preview-title">${words.title}</span>
    ${doesOfferFights ? `<select id="preview-fight"></select>` : ""}
    <span class="preview-build" id="preview-build"></span>
  </div>
  <div class="preview-line">
    <button id="preview-start">${words.start}</button>
    <button id="preview-back" title="${words.backHint}">&#9664;</button>
    <button id="preview-next">&#9654;</button>
    <button id="preview-play">${words.play}</button>
    <button id="preview-end">${words.end}</button>
    <span class="preview-count" id="preview-count"></span>
    <span class="preview-opening" id="preview-opening"></span>
  </div>
  <pre class="preview-log" id="preview-log"></pre>
</div>`;
}

/**
 * Feeding the fight through the page's probe, one call at a time. A step back is a replay from the
 * first call: the add-on resets on the call a fight opens with, so the panel keeps its screen.
 */
function composePreviewDriver(): string {
    const driver = `${composePreviewTipsDriver()}
var PREVIEW = JSON.parse(document.getElementById("preview-settings").textContent);
var probe = window.${PROBE_NAME};
var playTimer = null;
var shownFight = null;

var getPreviewElement = function (id) {
  var found = document.getElementById(id);
  if (found === null) throw new ReferenceError("preview is missing " + id);
  return found;
};

var countLabel = getPreviewElement("preview-count");
var picker = document.getElementById("preview-fight");

var renderCount = function () {
  countLabel.textContent = PREVIEW.words.entry + " " + probe.fed + " / " + PREVIEW.entryCount;
};

var renderPicker = function () {
  if (picker === null) return;
  for (var at = 0; at < PREVIEW.fights.length; at += 1) {
    var option = document.createElement("option");
    option.value = PREVIEW.fights[at].address;
    option.textContent = PREVIEW.fights[at].name;
    option.selected = PREVIEW.fights[at].name === PREVIEW.fightName;
    picker.append(option);
  }
};

// The add-on writes the tooltips on its own frame, so the frames the page holds run first.
var renderFed = function () {
  probe.flushFrames();
  renderCount();
  renderTips();
};

var setNextFed = function () {
  if (probe.remaining() === 0) return false;
  probe.feed(1);
  setReaderSideRead();
  renderFed();
  return true;
};

var setFedTo = function (target) {
  if (target < probe.fed) probe.rewind();
  for (var step = 0; step < PREVIEW.entryCount; step += 1) {
    if (probe.fed >= target) break;
    if (probe.remaining() === 0) break;
    probe.feed(1);
    setReaderSideRead();
  }
  renderFed();
};`;
    assertStringIncludes(driver, "probe.feed(1)", "the calls go in through the page's own probe");
    assertStringIncludes(driver, "probe.rewind()", "and a step back replays from the first");
    return driver;
}

/** The half of the driver that draws what landed in the tooltips, the opposing side first. */
function composePreviewTipsDriver(): string {
    const side = JSON.stringify(WARRIOR_FIELDS.side);
    const name = JSON.stringify(WARRIOR_FIELDS.name);
    const readerSide = JSON.stringify(ENVELOPE_KEYS.readerSide);
    const driver = `var tipsList = document.getElementById("preview-tips-list");
var shownReaderSide = null;

var setReaderSideRead = function () {
  var call = window.${PROBE_NAME}.lastCall;
  // Kept as text: the recordings state it as text and the client compares loosely.
  if (call && call[${readerSide}] != null) shownReaderSide = String(call[${readerSide}]);
};

var appendTip = function (said, id) {
  var rows = String(window.MARGOMETER_TIPS[id] || "").split("<br>").slice(1);
  if (rows.length === 0) return;
  var block = document.createElement("div");
  block.className = "preview-tip";
  var who = document.createElement("b");
  who.textContent = window.Engine.battle.w[id][${name}] || id;
  block.append(who);
  for (var at = 0; at < rows.length; at += 1) {
    var row = document.createElement("span");
    row.textContent = rows[at];
    block.append(row);
  }
  said.append(block);
};

var renderTips = function () {
  if (tipsList === null) return;
  var said = document.createDocumentFragment();
  var roster = window.Engine.battle.w;
  var passes = shownReaderSide === null ? 1 : 2;
  for (var pass = 0; pass < passes; pass += 1) {
    for (var id in roster) {
      var isReaders = String(roster[id][${side}]) === shownReaderSide;
      if (shownReaderSide === null || isReaders === (pass === 1)) appendTip(said, id);
    }
  }
  tipsList.replaceChildren(said);
};`;
    assertStringIncludes(driver, "MARGOMETER_TIPS", "it reads what the add-on's writer landed");
    assertStringIncludes(
        driver,
        side,
        "and sorts fighters by the side the client files them under",
    );
    return driver;
}

/**
 * Choosing a recording, playing, and reaching the start. A pick replays into the page already open
 * where the caller says the calls are, so the panel keeps its screen and settings; the stub merges
 * every roster and never clears, so the fight left behind is cleared first. A caller offering no
 * address navigates instead.
 */
function composePreviewPicks(doesStartFromEmpty: boolean): string {
    const picks = [
        composePreviewPicksShown(doesStartFromEmpty),
        composePreviewPicksHandlers(),
        composePreviewPicksBindings(),
    ].join("\n\n");
    assert(
        picks.includes(doesStartFromEmpty ? "composePreviewStateHashAt(0)" : "setFedTo(1)"),
        "the button that goes back to the start arrives somewhere",
    );
    assertStringIncludes(picks, "renderPicker()", "and every recording is in the picker first");
    return picks;
}

function composePreviewPicksShown(doesStartFromEmpty: boolean): string {
    const start = doesStartFromEmpty
        ? `var setStartOpened = function () {
  var opened = composePreviewStateHashAt(0);
  if (shownFight !== null) {
    window.location.href = shownFight.address + opened;
    return;
  }
  if (opened.length > 0) window.location.hash = opened;
  window.location.reload();
};`
        : `var setStartOpened = function () {
  setFedTo(1);
};`;
    return `var getFightByAddress = function (address) {
  for (var at = 0; at < PREVIEW.fights.length; at += 1) {
    if (PREVIEW.fights[at].address === address) return PREVIEW.fights[at];
  }
  return null;
};

var setPlayStopped = function () {
  if (playTimer === null) return;
  window.clearInterval(playTimer);
  playTimer = null;
  getPreviewElement("preview-play").textContent = PREVIEW.words.play;
};

var setFightShown = function (fight, calls) {
  window.Engine.battle.w = {};
  window.Engine.battle.warriorsList = {};
  window.MARGOMETER_TIPS = {};
  shownReaderSide = null;
  shownFight = fight;
  PREVIEW.fightName = fight.name;
  PREVIEW.entryCount = calls.length;
  probe.load(calls);
  document.title = PREVIEW.words.title + " \\u2014 " + fight.name;
  setFedTo(calls.length);
  setPreviewStateWritten();
};

${start}`;
}

/**
 * Playing runs for a stated time and the step falls out of it: a fixed tick ran 0,22s on the
 * shortest recording and 24,4s on the longest (`captures/`, 2026-09-18).
 */
function composePreviewPicksHandlers(): string {
    const least = PLAY_STEP_MINIMUM_MILLISECONDS;
    const most = PLAY_STEP_MAXIMUM_MILLISECONDS;
    assert(least < most, "a step has room between its bounds");
    return `var getPlayStep = function () {
  var entries = PREVIEW.entryCount;
  if (entries < 1) return ${most};
  var even = Math.round(${PLAY_SECONDS * 1000} / entries);
  return Math.min(${most}, Math.max(${least}, even));
};

var handlePlay = function () {
  if (playTimer !== null) {
    setPlayStopped();
    return;
  }
  getPreviewElement("preview-play").textContent = PREVIEW.words.pause;
  playTimer = window.setInterval(function handleTick() {
    if (setNextFed()) return;
    setPlayStopped();
  }, getPlayStep());
};

var handlePick = function () {
  if (picker === null) return null;
  var chosen = getFightByAddress(picker.value);
  if (chosen === null) return null;
  setPlayStopped();
  if (chosen.callsAddress === null) {
    window.location.href = chosen.address + composePreviewStateHash();
    return null;
  }
  return window.fetch(chosen.callsAddress).then(function handleAnswer(answer) {
    return answer.json();
  }).then(function handleCallsRead(calls) {
    setFightShown(chosen, calls);
  }, function handleCallsRefused() {
    window.location.href = chosen.address + composePreviewStateHash();
  });
};`;
}

/** The controls wired to what they do, and the entry the page opens on. */
function composePreviewPicksBindings(): string {
    const bindings =
        `getPreviewElement("preview-next").addEventListener("click", function handleNext() {
  setNextFed();
});
getPreviewElement("preview-end").addEventListener("click", function handleEnd() {
  setFedTo(PREVIEW.entryCount);
});
getPreviewElement("preview-back").addEventListener("click", function handleBack() {
  if (probe.fed <= 1) {
    setStartOpened();
    return;
  }
  setFedTo(probe.fed - 1);
});
getPreviewElement("preview-play").addEventListener("click", handlePlay);
getPreviewElement("preview-start").addEventListener("click", setStartOpened);
if (picker !== null) picker.addEventListener("change", handlePick);

renderPicker();
setFedTo(PREVIEW_STATE.entry === null ? PREVIEW.entryIndex : PREVIEW_STATE.entry);`;
    assertStringIncludes(bindings, "PREVIEW_STATE.entry", "the page opens where the address said");
    return bindings;
}

/**
 * The page keeps nothing: the store is taken away before the bundle runs, since the add-on here is
 * the one people install, shelf and all, and a visitor would otherwise be left holding a demo
 * fight. An engine refusing to give the property up leaves its own store in place. It starts with
 * what the address carried, and one store answers to both names.
 */
export function composePreviewStore(): string {
    const stood = `var PREVIEW_STORE = (function composeForgettingStore() {
  var held = PREVIEW_STATE.store;
  return {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(held, key) ? held[key] : null;
    },
    setItem: function (key, value) { held[key] = String(value); },
    removeItem: function (key) { delete held[key]; },
    readAll: function () {
      var copy = {};
      var names = Object.keys(held);
      for (var at = 0; at < names.length; at += 1) copy[names[at]] = held[names[at]];
      return copy;
    }
  };
})();
(function setNothingKept() {
  var names = ["localStorage", "sessionStorage"];
  for (var at = 0; at < names.length; at += 1) {
    try {
      Object.defineProperty(window, names[at], { value: PREVIEW_STORE, configurable: true });
    } catch (refusal) {
      void refusal;
    }
  }
})();`;
    assertStringIncludes(stood, "localStorage", "the store a browser lends is taken away");
    assertStringIncludes(stood, "sessionStorage", "and so is the other one the add-on may use");
    assertStringIncludes(stood, "PREVIEW_STATE.store", "and it starts with what the address held");
    return stood;
}
