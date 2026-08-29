/**
 * The harness page, whole, as one string: a game stood up, the add-on over it, and a strip that
 * steps one recording through it.
 *
 * Every word a reader sees arrives as an option, so this file speaks neither language — a served
 * page is read by whoever is editing `src/`, a published one by a player (**L2**).
 * `tools/preview-server.ts` answers requests for this; `tools/preview-site.ts` writes it down.
 */

import { assert } from "@std/assert";
import { USERSCRIPT_NAME } from "@/tools/build-userscript.ts";

/**
 * A build id in the shape `src/core/game-build.ts` reads. The tag naming it loads nothing: only
 * the `src` attribute is ever read, which is how a recording saved here says where it came from.
 */
const PREVIEW_GAME_BUILD = "1785244275300";
/** The decoy's filename, spelled once so the two consumers cannot disagree about it. */
export const PREVIEW_GAME_SCRIPT_NAME = `main.min${PREVIEW_GAME_BUILD}.js`;

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
}

/** A recording the picker offers, and where choosing it goes. */
export interface PreviewFightLink {
    name: string;
    /** The caller's, because a server carries the choice in a query and a site in a filename. */
    address: string;
    /** Where its calls can be fetched, or null where no process answers. */
    callsAddress: string | null;
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
     * The driver's second half, or null. It runs after the replay and still synchronously —
     * a served page appends hot reloading, a photographed one appends its presses.
     */
    appendedScript: string | null;
}

export function composePreviewPage(options: PreviewPageOptions): string {
    assert(options.calls.length > 0, "a page draws a fight that has something in it");
    assert(options.entryIndex <= options.calls.length, "and stops somewhere inside that fight");
    assert(options.fights.length > 0, "with at least one recording to choose between");
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
${introduction}
${composePreviewStrip(options.words)}
<script>${composePreviewStore()}</script>
<script>${composePreviewGame(options.words)}</script>
<script src="${options.scriptDirectory}${PREVIEW_GAME_SCRIPT_NAME}"></script>
<script src="${options.scriptDirectory}${USERSCRIPT_NAME}"></script>
<script id="preview-settings" type="application/json">${settings}</script>
<script>
${composePreviewDriver()}
${composePreviewPicks()}
${options.appendedScript ?? ""}
</script>
</body>
</html>
`;
}

/** Somebody else's material, on its way into a tag it must not be able to close. */
function composeEscapedJson(value: unknown): string {
    const written = JSON.stringify(value);
    assert(typeof written === "string", "what a page carries is written out as text");
    assert(written.length > 0, "and says something once it is");
    return written.split("<").join("\\u003c");
}

/**
 * The strip's own layer sits under the panel's 9999 (`src/ui/panel-look.ts`) and in the corner
 * the panel does not start in: harness chrome covering the thing under test is worse than none.
 */
function composePreviewStyle(): string {
    const sheet = `html, body { margin: 0; height: 100%; background: #14171c; color: #c8cdd6;
  font: 13px/1.5 ui-sans-serif, system-ui, sans-serif; }
.preview-intro { margin: 0; padding: 18px 20px; max-width: 46em; color: #8f9bb0; }
.preview-intro a { color: #8fb8e8; }
.preview-strip { position: fixed; left: 12px; bottom: 12px; z-index: 9000;
  display: flex; flex-direction: column; gap: 6px; padding: 10px 12px;
  background: #1c2027; border: 1px solid #2c323c; border-radius: 8px;
  max-width: min(560px, calc(100vw - 24px)); }
.preview-line { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.preview-strip button, .preview-strip select {
  font: inherit; color: inherit; background: #262c35; border: 1px solid #39404b;
  border-radius: 5px; padding: 3px 9px; cursor: pointer; }
.preview-title { font-weight: 600; color: #8f9bb0; letter-spacing: .04em; }
.preview-count { font-variant-numeric: tabular-nums; color: #8f9bb0; }
.preview-build { margin-left: auto; }
.preview-ok { color: #7fd18a; }
.preview-bad { color: #e8836f; }
.preview-log { display: none; margin: 0; padding: 8px; overflow: auto;
  max-height: 30vh; white-space: pre-wrap; background: #12151a;
  border: 1px solid #43301f; border-radius: 5px; color: #e8b48b;
  font: 12px/1.45 ui-monospace, monospace; }
.preview-log[data-shown="yes"] { display: block; }`;
    // The game's own page colour, read off v0.10.1's `screenshots/panel-taken.png`: a panel
    // judged against a darker page is a panel whose border reads as a colour it is not.
    assert(sheet.includes("#14171c"), "the panel is judged against the colour the game draws");
    assert(sheet.includes("9000"), "and the strip stands under the panel, never over it");
    return sheet;
}

function composePreviewStrip(words: PreviewWords): string {
    assert(words.title.length > 0, "the strip says what it is");
    assert(words.entry.length > 0, "and what it is counting");
    return `<div class="preview-strip">
  <div class="preview-line">
    <span class="preview-title">${words.title}</span>
    <select id="preview-fight"></select>
    <span class="preview-build" id="preview-build"></span>
  </div>
  <div class="preview-line">
    <button id="preview-start">${words.start}</button>
    <button id="preview-back" title="${words.backHint}">&#9664;</button>
    <button id="preview-next">&#9654;</button>
    <button id="preview-play">${words.play}</button>
    <button id="preview-end">${words.end}</button>
    <span class="preview-count" id="preview-count"></span>
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
 */
function composePreviewStore(): string {
    const stood = `(function setNothingKept() {
  var composeForgettingStore = function () {
    var held = {};
    return {
      getItem: function (key) {
        return Object.prototype.hasOwnProperty.call(held, key) ? held[key] : null;
      },
      setItem: function (key, value) { held[key] = value; },
      removeItem: function (key) { delete held[key]; }
    };
  };
  var names = ["localStorage", "sessionStorage"];
  for (var at = 0; at < names.length; at += 1) {
    try {
      Object.defineProperty(window, names[at], {
        value: composeForgettingStore(),
        configurable: true
      });
    } catch (refusal) {
      void refusal;
    }
  }
})();`;
    assert(stood.includes("localStorage"), "the store a browser lends is taken away");
    assert(stood.includes("sessionStorage"), "and so is the other one the add-on may be sent to");
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
    assert(stood.includes("updateData"), "carrying the call the add-on puts its wrap on");
    assert(stood.includes("map"), "and a place, which no recording carries and every bar draws");
    return stood;
}

/**
 * Feeding the fight, one call at a time. Stepping **back** is replaying from the first call:
 * `src/game/battle-session.ts` accumulates and has no rewind, but it resets on the call a fight
 * opens with, and `tests/tools/recorded-fights.test.ts` measures that every recording carries one
 * first. So a step back costs a replay and not a reload, and the panel keeps the screen the
 * reader chose.
 */
function composePreviewDriver(): string {
    const driver =
        `var PREVIEW = JSON.parse(document.getElementById("preview-settings").textContent);
var START_HASH = "#start";
var fedCount = 0;
var playTimer = null;
var shownFight = null;

var getPreviewElement = function (id) {
  var found = document.getElementById(id);
  if (found === null) throw new ReferenceError("preview is missing " + id);
  return found;
};

var countLabel = getPreviewElement("preview-count");
var picker = getPreviewElement("preview-fight");

var renderCount = function () {
  countLabel.textContent = PREVIEW.words.entry + " " + fedCount + " / " + PREVIEW.entryCount;
};

var renderPicker = function () {
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
    assert(driver.includes("updateData"), "the calls reach whatever took the game's place");
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
function composePreviewPicks(): string {
    const picks = `var getFightByAddress = function (address) {
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
};

var setStartOpened = function () {
  if (shownFight !== null) {
    window.location.href = shownFight.address + START_HASH;
    return;
  }
  window.location.hash = START_HASH;
  window.location.reload();
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
  }, 220);
};

var handlePick = function () {
  var chosen = getFightByAddress(picker.value);
  if (chosen === null) return null;
  setPlayStopped();
  if (chosen.callsAddress === null) {
    window.location.href = chosen.address;
    return null;
  }
  return window.fetch(chosen.callsAddress).then(function handleAnswer(answer) {
    return answer.json();
  }).then(function handleCallsRead(calls) {
    setFightShown(chosen, calls);
  }, function handleCallsRefused() {
    window.location.href = chosen.address;
  });
};

getPreviewElement("preview-next").addEventListener("click", function handleNext() {
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
picker.addEventListener("change", handlePick);

renderPicker();
setFedTo(window.location.hash === START_HASH ? 0 : PREVIEW.entryIndex);`;
    assert(picks.includes("START_HASH"), "the state before the first call is reachable");
    assert(picks.includes("renderPicker()"), "and every recording is in the picker before it is");
    return picks;
}
