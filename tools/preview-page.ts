/**
 * The harness page, whole, as one string: a game stood up, the add-on over it, and a strip that
 * steps one recording through it.
 *
 * Every word a reader sees arrives as an option, so this file speaks neither language — a served
 * page is read by whoever is editing `src/`, a published one by a player (**L2**).
 * `tools/preview-server.ts` answers requests for this; `tools/preview-site.ts` writes it down.
 */

import { assert, assertStringIncludes } from "@std/assert";
import { SHAPE, SIGNAL, SURFACE, TEXT } from "@/src/ui/panel-look.ts";
import { USERSCRIPT_NAME } from "@/tools/build-userscript.ts";
import {
    composePreviewStateBare,
    composePreviewStateReading,
    composePreviewStateWriting,
} from "@/tools/preview-state.ts";

/**
 * A build id in the shape `src/core/game-build.ts` reads. The tag naming it loads nothing: only
 * the `src` attribute is ever read, which is how a recording saved here says where it came from.
 */
const PREVIEW_GAME_BUILD = "1785244275300";
/** The decoy's filename, spelled once so the two consumers cannot disagree about it. */
export const PREVIEW_GAME_SCRIPT_NAME = `main.min${PREVIEW_GAME_BUILD}.js`;
/**
 * The band's own tag, spelled once: the site tool asserts on it and so does its guard. The tag
 * rather than the class, because the class also stands in the stylesheet of every page ever
 * composed — a guard reading for that could not go red if the band vanished.
 */
export const PREVIEW_INSTALL_OPENING = `<header class="preview-install">`;
/** Past which nobody reads as far as the button — **S11**. */
/**
 * What must be true before the button, and no more than a person reads standing up. The band
 * exists because somebody will not read a README, so a band long enough to need reading is the
 * failure it was written against.
 */
const MAXIMUM_INSTALL_NEEDS = 4;

/**
 * The mark on the need whose failure is silent, **drawn rather than spelled** — **ADR 0092** does
 * the same to the panel's caveat and for the same reason: a glyph out of a set takes a face the
 * page never asked for, and renders as a box where that face is missing. This band is the one
 * thing on the page that has to be read.
 */
const SILENT_MARK = '<svg class="preview-mark" viewBox="0 0 18 18" aria-hidden="true">' +
    '<path d="M9 2.4 16.2 15H1.8Z"></path><path d="M9 7v4"></path>' +
    '<path d="M9 13.2v.1"></path></svg>';

/**
 * Where a column of text ends, so nothing the page writes runs under the two windows the corner
 * holds. Spelled once because the band carried it and the paragraph under it did not: measured on
 * the built page, 2026-09-18, the paragraph ran 96px under them at a 1024px window and 320px at
 * 800px, while the band above it was already narrowing. 540 is the 8px inset, the panel's 260, the
 * 4px between and the 210px window beside it, with air (`tools/preview-windows.ts`).
 *
 * **Three terms because the page lays itself out two ways and one bound has to hold both.** Wide
 * enough for the split (`SPLIT_FROM` up), the text keeps its own half and the windows the other,
 * so `50vw` less the halves' padding is what binds; narrower, the page is one column with the
 * windows cornered over it, and the `540px` reserve is. Taking the lesser of the two everywhere
 * costs 22px of measure at 1280 and means the guard over this still reads one value.
 */
export const MAXIMUM_COLUMN_WIDTH = "min(46em, calc(100vw - 540px), calc(50vw - 64px))";

/**
 * Below this the page is one column again. The two windows take 482px of it — inset, panel, gap
 * and the window beside it — so a half narrower than that would have them standing in the text's
 * half instead of their own. 1024 is the first standard width whose half clears it, with 30px to
 * spare, and it is a width a desktop Chrome really opens at.
 */
export const SPLIT_FROM_PIXELS = 1024;
const SPLIT_FROM = `${SPLIT_FROM_PIXELS}px`;
/**
 * The height below which the left half tightens. A 1366×768 screen gives Chrome about 625px of
 * page and a 1280×720 one about 577; measured 2026-09-19, the column ran 18px past the fold at
 * the second. What gives is the heading and the air around it, never a card or the button.
 */
const SPLIT_SHORT = "780px";

/** What a pressed replay runs for, whatever the recording holds. */
const PLAY_SECONDS = 12;
/** Under this a step reads as a flicker; over it, a short recording stalls on one entry. */
const PLAY_STEP_LEAST = 90;
const PLAY_STEP_MOST = 900;

/**
 * The one colour on this page the panel does not state, and it is evidence rather than a choice:
 * the game's own page colour, read off v0.10.1's `screenshots/panel-taken.png`. A panel judged
 * against a darker page is a panel whose border reads as a colour it is not — and judging the
 * panel against the ground it really stands on is the whole of what this page is for.
 */
const GAME_PAGE_COLOUR = "#14171c";

/**
 * How a page names the two regions its own script has to find. Spelled here and read in
 * `tools/preview-site.ts`, so the sheet and the script cannot drift onto two names.
 */
export const PREVIEW_STRIP_SELECTOR = ".preview-strip";
export const PREVIEW_SPLIT_SELECTOR = ".preview-split";
export const PREVIEW_SAID_SELECTOR = ".preview-said";

/** Every word the strip draws, so the language of a page is a value and never a branch. */
export interface PreviewWords {
    /** What `<html lang>` declares, which a browser's offer to translate reads. */
    language: string;
    title: string;
    /** The place the panel draws, which no recording carries and every bar states. */
    placeName: string;
    /** Back to before the first call, which is the one state a replay cannot reach. */
    start: string;
    /** The ◀ button's tooltip, since an arrow says nothing about the replay behind it. */
    backHint: string;
    end: string;
    play: string;
    pause: string;
    /** Drawn before the two numbers — `entry 12 / 102`. */
    entry: string;
    /**
     * What the bar says while the replay is running without being asked, and nothing while it is
     * not. A page whose figures move with no word for it reads as a page doing something unasked.
     */
    playing: string;
}

/** A recording the picker offers, and where choosing it goes. */
export interface PreviewFightLink {
    name: string;
    /** The caller's, because a server carries the choice in a query and a site in a filename. */
    address: string;
    /** Where its calls can be fetched, or null where no process answers. */
    callsAddress: string | null;
}

/** Where a reader can take the file, and what the button on it says. */
export interface PreviewInstallOffer {
    label: string;
    /** The file itself, so pressing it hands a manager something to install. */
    address: string;
}

/** One thing that must be true before the button, and whether its failure says nothing. */
export interface PreviewInstallNeed {
    text: string;
    isSilent: boolean;
}

/**
 * The band a page opens with, for a reader who arrived having installed nothing. It stands down
 * the left of the page, which is free only because the page puts both windows in the corner
 * (`tools/preview-windows.ts`): a panel opens **centred** in the window it is drawn over, over
 * the middle of everything said here.
 */
export interface PreviewInstall {
    name: string;
    /** One sentence of what it is, for somebody who has never seen the panel. */
    sentence: string;
    needsLine: string;
    /**
     * Stated **above** the offer, which is the whole of what this ordering is for: a reader who
     * presses first installs, sees nothing, and only then reaches the line that would have told
     * them why. Measured on the band as it stood on 2026-09-18: the one whose failure is silent
     * was the longest of four at 199 characters, second in the list, and under the button.
     */
    needs: readonly PreviewInstallNeed[];
    offer: PreviewInstallOffer;
    /** What the button hands over, so a reader sees which build they are taking. */
    versionLine: string;
    /** What happens once it is pressed, which is the only thing left to say afterwards. */
    afterLine: string;
}

export interface PreviewPageOptions {
    fightName: string;
    /** Where the replay stops. The caller clamps it; nothing here reads text into a number. */
    entryIndex: number;
    /**
     * The whole recording, carried in the page rather than fetched: a screenshot is taken at
     * `load` and nothing after it, so a page that fetched its fight photographs itself empty.
     */
    calls: readonly unknown[];
    fights: readonly PreviewFightLink[];
    /** `/` while a server answers every path; `./` where a host serves a project under one. */
    scriptDirectory: string;
    words: PreviewWords;
    /** A sentence for a reader who did not start the page, or null where they did. */
    introduction: string | null;
    /**
     * Whether a link to this page may carry the moment inside it — the entry, the screen and what
     * the panel kept. The served page does, because whoever is reading a change in `src/ui/`
     * reloads onto the state they were looking at. A published page does not: it is one page over
     * one recording, and a link to it is a link to the page (`tools/preview-site.ts`).
     */
    doesAddressCarryState: boolean;
    /**
     * What `from the start` reaches. The served page reaches the state **before the first call**
     * — an empty panel, which is worth looking at while `src/ui/` is being changed and which only
     * a fresh document can give, because the stub engine merges every roster and never clears. A
     * published page reaches the **first call** instead: a visitor pressing this wants the fight
     * to start over, and a reload gives them the page blinking at them (2026-09-19).
     */
    doesStartFromEmpty: boolean;
    /** The band over that sentence, or null where the reader built the page themselves. */
    install: PreviewInstall | null;
    /**
     * The driver's second half, or null. It runs after the replay and still synchronously —
     * a served page appends hot reloading, a photographed one appends its presses.
     */
    appendedScript: string | null;
}

export function composePreviewPage(options: PreviewPageOptions): string {
    assert(options.calls.length > 0, "a page draws a fight that has something in it");
    assert(options.entryIndex <= options.calls.length, "and stops somewhere inside that fight");
    // No assertion on `fights`: a published page offers none, and an empty picker is the way it
    // says so. What must hold is that a page offering a choice can act on it, which the picker's
    // own composer states.
    assert(options.scriptDirectory.endsWith("/"), "its scripts are asked for under a directory");
    const settings = composeEscapedJson({
        fightName: options.fightName,
        entryIndex: options.entryIndex,
        entryCount: options.calls.length,
        fights: options.fights,
        words: options.words,
        calls: options.calls,
    });
    const introduction = options.introduction === null
        ? ""
        : `<p class="preview-intro">${options.introduction}</p>`;
    const band = options.install === null ? "" : composePreviewInstall(options.install);
    // The two halves are the published page's, and only its: a served page carries no band, so
    // there is nothing to put on the left and the panel keeps the whole window it is judged in.
    const said = options.install === null
        ? `${band}
${introduction}`
        : `<main class="preview-split"><div class="preview-said">${band}
${introduction}</div><div class="preview-stage"></div></main>`;
    return `<!doctype html>
<html lang="${options.words.language}">
<head>
<meta charset="utf-8">
<title>${options.words.title} — ${options.fightName}</title>
<style>
${composePreviewStyle()}
</style>
</head>
<body>
${said}
${composePreviewStrip(options.words, options.fights.length > 0)}
<script>${
        options.doesAddressCarryState ? composePreviewStateReading() : composePreviewStateBare()
    }</script>
<script>${composePreviewStore()}</script>
<script>${composePreviewGame(options.words)}</script>
<script src="${options.scriptDirectory}${PREVIEW_GAME_SCRIPT_NAME}"></script>
<script src="${options.scriptDirectory}${USERSCRIPT_NAME}"></script>
<script id="preview-settings" type="application/json">${settings}</script>
<script>
${composePreviewDriver()}
${options.doesAddressCarryState ? composePreviewStateWriting() : ""}
${composePreviewPicks(options.doesStartFromEmpty)}
${options.appendedScript ?? ""}
</script>
</body>
</html>
`;
}

function composePreviewInstall(install: PreviewInstall): string {
    assert(install.name.length > 0, "the band says what is on offer");
    assert(install.sentence.length > 0, "and what it does, to somebody who has not seen it");
    assert(install.versionLine.length > 0, "and which build the button hands over");
    assert(install.offer.label.length > 0, "there is something to press");
    // Absolute on purpose, where every other address on the page is relative: a reader saving or
    // sending this one must land on the same file, and `./` beside a page is whatever that host
    // last deployed.
    assert(install.offer.address.startsWith("https://"), "and it hands over a file, not a path");
    assert(install.afterLine.length > 0, "and what happens once it is pressed");
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

/**
 * The step whose failure is silent is marked where it stands, in its own order: a reader walking
 * a numbered list does not go looking for a warning beside it, and that step is the one whose
 * omission leaves a clean page, no panel, and nothing said about either.
 */
function composePreviewInstallNeeds(install: PreviewInstall): string {
    assert(install.needsLine.length > 0, "the needs say what they are for");
    assert(install.needs.length > 0, "and there is at least one of them");
    assert(install.needs.length <= MAXIMUM_INSTALL_NEEDS, "and not more than a reader walks");
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

/** Somebody else's material, on its way into a tag it must not be able to close. */
function composeEscapedJson(value: unknown): string {
    const written = JSON.stringify(value);
    assert(typeof written === "string", "what a page carries is written out as text");
    assert(written.length > 0, "and says something once it is");
    return written.split("<").join("\\u003c");
}

/**
 * The page in two halves: what is said on the left, the thing being said about on the right.
 *
 * Only from `SPLIT_FROM` up: a half narrower than the 482px the windows take would put them in
 * the text's half. Below it the page is one column with both windows cornered over it.
 *
 * Both halves start on the same line, under the bar. Centred down its half instead, the text
 * stood 750px below the panel on a 4K screen.
 *
 * The right half keeps `GAME_PAGE_COLOUR`, the ground the panel is judged against; the left is
 * the only surface on the page that is not it, with one border out of the panel's own tokens.
 *
 * **The bar goes over the half it drives.** It carries the picker and the replay, which change
 * the panel and nothing on the left, so spanning the page would sit it over an install band it
 * has no say in.
 */
function composeSplitStyle(): string {
    return `.preview-split { display: block; }
.preview-stage { display: none; }
@media (min-width: ${SPLIT_FROM}) {
  .preview-split { display: flex; align-items: stretch; min-height: 100vh;
    box-sizing: border-box; }
  .preview-said { width: 50vw; flex-shrink: 0; box-sizing: border-box;
    padding: 32px; background: ${SURFACE.panel};
    border-right: 1px solid ${SURFACE.border};
    display: flex; flex-direction: column; align-items: flex-end;
    overflow-y: auto; }
  .preview-stage { display: block; flex-grow: 1; background: ${GAME_PAGE_COLOUR}; }
  .preview-install { padding: 0; }
  .preview-install h1 { font-size: 38px; letter-spacing: -0.015em; }
  .preview-take { margin-top: 24px; text-align: center; }
  .preview-version { display: block; margin: 10px 0 0; }
  .preview-lede { margin: 10px 0 22px; font-size: 15px; color: ${TEXT.plain}; }
  .preview-intro { padding-left: 0; padding-right: 0; }
  .preview-strip { left: 50vw; right: 0; border-left: 1px solid ${SURFACE.border}; }
  .preview-strip select { width: auto; flex: 1 1 14em; min-width: 0; }
  /* The band beside it already says MargoMeter in 38px; the bar repeating it costs a row. */
  .preview-title { display: none; }
}
@media (min-width: ${SPLIT_FROM}) and (max-height: ${SPLIT_SHORT}) {
  .preview-install h1 { font-size: 30px; }
  .preview-lede { margin: 8px 0 16px; }
  .preview-needs { margin-bottom: 12px; }
  .preview-take { margin-top: 16px; }
}`;
}

/**
 * The strip's own layer sits under the panel's 9999 (`src/ui/panel-look.ts`) and in the corner
 * the panel does not start in: harness chrome covering the thing under test is worse than none.
 *
 * ⚠️ **Every colour here but the page's own ground is the panel's**, out of `src/ui/panel-look.ts`
 * rather than chosen again. Measured 2026-09-19 over the built page: the sheet spelled 21 colours
 * and **none of them was a colour the panel states**, so the thing the page exists to show sat on
 * a surface it shared no value with. `DESIGN.md` is about the panel and says nothing about this
 * page, which is how that happened; `design/strona/` carries the reading.
 */
function composePreviewStyle(): string {
    const sheet = `html, body { margin: 0; height: 100%; background: ${GAME_PAGE_COLOUR};
  color: ${TEXT.plain};
  font: 13px/1.5 ui-sans-serif, system-ui, sans-serif; }
.preview-intro { margin: 0; padding: 18px 20px; max-width: ${MAXIMUM_COLUMN_WIDTH};
  color: ${TEXT.quiet}; }
.preview-intro a { color: ${SIGNAL.caveat}; }
.preview-install { padding: 20px 20px 0; max-width: ${MAXIMUM_COLUMN_WIDTH}; }
.preview-install h1 { margin: 0; font-size: 21px; color: ${TEXT.plain}; }
.preview-lede { margin: 4px 0 14px; }
.preview-take { margin: 0; }
/* Specificity, not order: \`.preview-install a\` colours every link in the band and would take
   the button's own ink with it — a green fill under link blue. */
.preview-install a.preview-get { display: inline-block; padding: 13px 28px;
  border-radius: ${SHAPE.radius};
  background: ${SIGNAL.ours}; border: 1px solid ${SIGNAL.ours}; color: ${TEXT.inkDark};
  font-size: 16px; font-weight: 600; text-decoration: none; white-space: nowrap; }
.preview-version { margin-left: 10px; color: ${TEXT.quiet}; }
.preview-install a { color: ${SIGNAL.caveat}; }
.preview-needs-line { margin: 16px 0 8px; color: ${TEXT.quiet}; }
.preview-needs { margin: 0 0 16px; padding: 0 0 0 26px; display: flex;
  flex-direction: column; gap: 8px; }
.preview-needs li { padding: 9px 12px; border: 1px solid ${SURFACE.border};
  border-radius: ${SHAPE.radius}; background: ${SURFACE.raised}; }
.preview-warn { border-color: ${SIGNAL.suspect}; background: ${SURFACE.track}; }
.preview-warn strong { color: ${SIGNAL.suspect}; }
.preview-mark { width: 18px; height: 18px; margin: 0 6px -4px 0; fill: none;
  stroke: ${SIGNAL.suspect}; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.preview-after { margin: 8px 0 0; color: ${TEXT.quiet}; }
.preview-install + .preview-intro { padding-top: 14px; }
.preview-said > :first-child { padding-top: 0; }
.preview-strip { position: fixed; left: 0; right: 0; top: 0; z-index: 9000;
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px;
  padding: 8px 16px;
  background: ${SURFACE.raised}; border-bottom: 1px solid ${SURFACE.border}; }
.preview-line { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.preview-strip button, .preview-strip select {
  font: inherit; color: inherit; background: ${SURFACE.track};
  border: 1px solid ${SURFACE.border};
  border-radius: ${SHAPE.radiusSmall}; padding: 3px 9px; cursor: pointer; }
.preview-strip select { width: 26em; }
.preview-line { flex-wrap: nowrap; overflow: auto; }
.preview-title { font-weight: 600; color: ${TEXT.quiet}; letter-spacing: .04em; }
.preview-count { font-variant-numeric: tabular-nums; color: ${TEXT.quiet}; }
.preview-opening:empty { display: none; }
.preview-opening { padding: 2px 9px; border-radius: ${SHAPE.radiusSmall};
  background: ${SURFACE.track}; border: 1px solid ${SIGNAL.ours}; color: ${SIGNAL.ours}; }
.preview-build { margin-left: auto; }
.preview-ok { color: ${SIGNAL.ours}; }
.preview-bad { color: ${SIGNAL.theirs}; }
.preview-log { display: none; flex-basis: 100%; margin: 0; padding: 8px; overflow: auto;
  max-height: 30vh; white-space: pre-wrap; background: ${SURFACE.panel};
  border: 1px solid ${SIGNAL.suspect}; border-radius: ${SHAPE.radiusSmall};
  color: ${SIGNAL.suspect};
  font: 12px/1.45 ui-monospace, monospace; }
.preview-log[data-shown="yes"] { display: block; }
${composeSplitStyle()}`;
    assertStringIncludes(
        sheet,
        GAME_PAGE_COLOUR,
        "the panel is judged against the game's own page",
    );
    assertStringIncludes(sheet, SURFACE.border, "and everything else takes the panel's own token");
    assertStringIncludes(sheet, "9000", "and the strip stands under the panel, never over it");
    // Which rules take it, and which may not, is `tests/tools/preview-site.test.ts`'s to hold:
    // one occurrence here passed while the paragraph under the band carried none.
    assertStringIncludes(sheet, MAXIMUM_COLUMN_WIDTH, "a column ends where the windows begin");
    assertStringIncludes(sheet, ".preview-get", "and the offer is a button, not a word in a line");
    return sheet;
}

function composePreviewStrip(words: PreviewWords, doesOfferFights: boolean): string {
    assert(words.title.length > 0, "the strip says what it is");
    assert(words.entry.length > 0, "and what it is counting");
    assert(words.playing.length > 0, "and what it is doing when it does it unasked");
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
 * The page keeps nothing, and it takes the store away before the bundle runs. The add-on here is
 * the one people install, shelf and all (`src/game/kept-fights.ts`), so without this a visitor to
 * a published preview is left holding somebody's demo fight — and a second visit opens onto it.
 * An engine that will not give the property up leaves its own store in place, which is no worse
 * than the page was before, and never a reason to stop drawing.
 *
 * What it starts holding is what the address carried (`tools/preview-state.ts`), and one store
 * answers to both names: the add-on writes to whichever it was sent to, and the harness has one
 * place to read rather than a choice to follow.
 */
function composePreviewStore(): string {
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
      for (var at = 0; at < names.length; at += 1) {
        copy[names[at]] = held[names[at]];
      }
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
    assertStringIncludes(
        stood,
        "sessionStorage",
        "and so is the other one the add-on may be sent to",
    );
    assertStringIncludes(
        stood,
        "PREVIEW_STATE.store",
        "and it starts holding what the address carried",
    );
    return stood;
}

/**
 * The game, as much of it as the add-on touches, stood up before the add-on looks for one: the
 * first look is the one that finds it, and a page that stands it up afterwards draws nothing for
 * as long as the poll takes (`src/game/engine-attachment.ts`). Both roster names are needed —
 * `warriorsList` is where a saved recording's snapshots are read from
 * (`src/game/engine-warrior.ts`), and with only `w` every snapshot comes out empty.
 */
function composePreviewGame(words: PreviewWords): string {
    assert(words.placeName.length > 0, "the place a bar draws is named by the tool, not a fight");
    const stood = `window.Engine = {
  battle: {
    w: {},
    warriorsList: {},
    updateData: function handleCall(payload) {
      var roster = payload && payload.w;
      if (roster) {
        for (var id in roster) {
          window.Engine.battle.w[id] = roster[id];
          window.Engine.battle.warriorsList[id] = roster[id];
        }
      }
      return "preview-engine";
    }
  },
  map: { d: { name: ${JSON.stringify(words.placeName)} } },
  hero: { d: { x: 1, y: 1 } }
};`;
    assertStringIncludes(stood, "updateData", "carrying the call the add-on puts its wrap on");
    assertStringIncludes(
        stood,
        "map",
        "and a place, which no recording carries and every bar draws",
    );
    return stood;
}

/**
 * Feeding the fight, one call at a time. Stepping **back** is replaying from the first call:
 * `src/game/fight-underway.ts` accumulates and has no rewind, but it resets on the call a fight
 * opens with, and `tests/tools/recorded-fights.test.ts` measures that every recording carries one
 * first. So a step back costs a replay and not a reload, and the panel keeps the screen the
 * reader chose.
 */
function composePreviewDriver(): string {
    const driver =
        `var PREVIEW = JSON.parse(document.getElementById("preview-settings").textContent);
var fedCount = 0;
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
  countLabel.textContent = PREVIEW.words.entry + " " + fedCount + " / " + PREVIEW.entryCount;
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

var setNextFed = function () {
  if (fedCount >= PREVIEW.calls.length) return false;
  window.Engine.battle.updateData(PREVIEW.calls[fedCount]);
  fedCount += 1;
  renderCount();
  return true;
};

var setFedTo = function (target) {
  if (target < fedCount) fedCount = 0;
  for (var step = 0; step < PREVIEW.calls.length; step += 1) {
    if (fedCount >= target) break;
    if (!setNextFed()) break;
  }
  renderCount();
};`;
    assertStringIncludes(driver, "updateData", "the calls reach whatever took the game's place");
    assert(
        driver.includes("fedCount = 0"),
        "and a step back is the fight, fed again from its first",
    );
    return driver;
}

/**
 * Choosing a recording, and reaching the state before the first call.
 *
 * A pick replays into the page already open wherever the caller said the calls are, so the panel
 * keeps its screen, its position and the settings — none of which a fresh document keeps, because
 * the store installed above outlives nothing. The stub engine merges every roster it is handed
 * and never clears, so the fight being left behind would otherwise stand in the roster of the one
 * arriving. A caller that offered no address navigates instead.
 */
function composePreviewPicks(doesStartFromEmpty: boolean): string {
    const picks = [
        composePreviewPicksReaders(doesStartFromEmpty),
        composePreviewPicksHandlers(),
        composePreviewPicksBindings(),
    ].join("\n\n");
    // Which state `from the start` reaches is the caller's (`doesStartFromEmpty`), so what is
    // asserted is that it reaches one: the empty panel a fresh document gives, or the first call
    // a replay does. A button that reaches neither would be a button doing nothing.
    assert(
        picks.includes(doesStartFromEmpty ? "composePreviewStateHashAt(0)" : "setFedTo(1)"),
        "the button that goes back to the start arrives somewhere",
    );
    assertStringIncludes(
        picks,
        "renderPicker()",
        "and every recording is in the picker before it is",
    );
    return picks;
}

/** Reading a recording out of the page's own list, and standing the page in front of one. */
/**
 * What the `from the start` button does, which is the one control that means two things.
 *
 * Reaching the empty panel costs a fresh document; reaching the first call costs a replay. Which
 * is wanted is the caller's, and `PreviewPageOptions` says why each one wants what it does.
 */
function composePreviewStart(doesStartFromEmpty: boolean): string {
    if (!doesStartFromEmpty) {
        return `var setStartOpened = function () {
  setFedTo(1);
};`;
    }
    return `var setStartOpened = function () {
  var opened = composePreviewStateHashAt(0);
  if (shownFight !== null) {
    window.location.href = shownFight.address + opened;
    return;
  }
  // Empty where the address carries no state, and an empty assignment still leaves a hash.
  if (opened.length > 0) window.location.hash = opened;
  window.location.reload();
};`;
}

function composePreviewPicksReaders(doesStartFromEmpty: boolean): string {
    const readers = `var getFightByAddress = function (address) {
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
  shownFight = fight;
  PREVIEW.fightName = fight.name;
  PREVIEW.calls = calls;
  PREVIEW.entryCount = calls.length;
  fedCount = 0;
  document.title = PREVIEW.words.title + " \\u2014 " + fight.name;
  setFedTo(calls.length);
  setPreviewStateWritten();
};

${composePreviewStart(doesStartFromEmpty)}`;
    assertStringIncludes(
        readers,
        "getFightByAddress",
        "a recording is found by the address it wears",
    );
    assertStringIncludes(
        readers,
        "setFightShown",
        "and the roster it is fed into is cleared first",
    );
    return readers;
}

/**
 * How long one entry of a pressed replay rests on screen: **the whole runs for a stated time, and
 * the step is what falls out of it.**
 *
 * A fixed 220ms tick made the control mean a different thing on every recording. Measured over
 * `captures/` on 2026-09-18: pressing play ran **0,22s on the shortest fight and 24,4s on the
 * longest** — the same press, a hundredfold apart, and a visitor has no way of telling which they
 * are about to get. A stated duration divided by the entries gives 800ms a step on a fight of 15
 * and 108ms on one of 111, and both are over when the visitor expects them to be.
 *
 * The bounds are what keep the arithmetic honest at the ends: a recording of one entry has nothing
 * to spread over ${PLAY_SECONDS} seconds, and one long enough to drive the step under the floor
 * would flicker rather than replay.
 *
 * This is the tempo of a replay somebody asked for. It is **not** the published page playing by
 * itself, which `design/instalacja/` drew, measured and did not get taken up: the page still opens
 * on the finished fight (**ADR 0028**) and still moves for nothing but a hand.
 */
function composePlayStep(): string {
    assert(PLAY_STEP_LEAST < PLAY_STEP_MOST, "a step has room between its bounds");
    return `var getPlayStep = function () {
  var entries = PREVIEW.entryCount;
  if (entries < 1) return ${PLAY_STEP_MOST};
  var even = Math.round(${PLAY_SECONDS * 1000} / entries);
  return Math.min(${PLAY_STEP_MOST}, Math.max(${PLAY_STEP_LEAST}, even));
};`;
}

/** The two controls that answer a reader: playing the calls, and choosing another recording. */
function composePreviewPicksHandlers(): string {
    const handlers = `${composePlayStep()}

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
    assertStringIncludes(handlers, "handlePlay", "playing is one control, and it stops itself");
    assertStringIncludes(handlers, "handlePick", "choosing is the other, and a refusal navigates");
    return handlers;
}

/** The controls wired to what they do, and the state the page opens on. */
function composePreviewPicksBindings(): string {
    const bindings =
        `getPreviewElement("preview-next").addEventListener("click", function handleNext() {
  setNextFed();
});
getPreviewElement("preview-end").addEventListener("click", function handleEnd() {
  setFedTo(PREVIEW.calls.length);
});
getPreviewElement("preview-back").addEventListener("click", function handleBack() {
  if (fedCount <= 1) {
    setStartOpened();
    return;
  }
  setFedTo(fedCount - 1);
});
getPreviewElement("preview-play").addEventListener("click", handlePlay);
getPreviewElement("preview-start").addEventListener("click", setStartOpened);
if (picker !== null) picker.addEventListener("change", handlePick);

renderPicker();
setFedTo(PREVIEW_STATE.entry === null ? PREVIEW.entryIndex : PREVIEW_STATE.entry);`;
    assertStringIncludes(bindings, "addEventListener", "every control reaches what it does");
    assertStringIncludes(
        bindings,
        "PREVIEW_STATE.entry",
        "and opens on the entry the address carried",
    );
    return bindings;
}
