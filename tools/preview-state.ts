/**
 * What the harness carries from one page to the next: the entry the replay stopped at, the screen
 * the panel was on, and whatever the add-on left in the store it was lent.
 *
 * It travels in the address and nowhere else, so a published page still leaves nothing behind
 * (**ADR 0017**) and a rebuild still finds the panel where the reader put it. Nothing here spells
 * a name the add-on owns: the store is carried as data, and the panel is found by its shadow root.
 */

import { assert } from "@std/assert";

/** One value that travels. Past this lies the shelf, which is a fight rather than a setting. */
export const STATE_VALUE_MAXIMUM = 200;
/** The whole hash. A browser takes far more; an address somebody has to look at does not. */
export const STATE_TEXT_MAXIMUM = 2000;
/** How long the panel is waited for, in tries of `STATE_WAIT_EVERY_MS`. */
export const STATE_WAIT_TRIES = 40;
const STATE_WAIT_EVERY_MS = 25;

export const STATE_ENTRY_NAME = "e";
export const STATE_SCREEN_NAME = "s";
export const STATE_STORE_NAME = "k";
/** The panel's own mark for a tab, which `tools/panel-screenshots.ts` presses by the same name. */
export const SCREEN_ATTRIBUTE = "data-screen";

/**
 * The address, read before the bundle runs, so the store below can be handed what it held last.
 *
 * A hash is text a person can edit and a browser can truncate: everything that is not the shape
 * this wrote reads as *no state*, which is the state a first visit is in anyway.
 */
export function composePreviewStateReading(): string {
    const reading = `var getPreviewWholeFromText = function (text) {
  if (text.length === 0) return null;
  var value = Number(text);
  if (!isFinite(value)) return null;
  if (Math.floor(value) !== value) return null;
  if (value < 0) return null;
  return value;
};

var getPreviewStoreFromText = function (text) {
  var held = {};
  var read = JSON.parse(text);
  if (read === null) return held;
  if (typeof read !== "object") return held;
  var names = Object.keys(read);
  for (var at = 0; at < names.length; at += 1) {
    var value = read[names[at]];
    if (typeof value === "string") {
      if (value.length <= ${STATE_VALUE_MAXIMUM}) held[names[at]] = value;
    }
  }
  return held;
};

${composePreviewStateParser()}

var PREVIEW_STATE = getPreviewStateFromHash(window.location.hash);`;
    assert(
        reading.includes("PREVIEW_STATE"),
        "the state a page opens with is read before anything",
    );
    assert(reading.includes("JSON.parse"), "and what the address carried is data, not program");
    return reading;
}

/** Walked rather than matched: **C7** binds the browser half of this tool as it binds the rest. */
function composePreviewStateParser(): string {
    const parser = `var getPreviewStateFromHash = function (hash) {
  var state = { entry: null, screen: null, store: {} };
  var text = hash.charAt(0) === "#" ? hash.slice(1) : hash;
  if (text.length === 0) return state;
  if (text.length > ${STATE_TEXT_MAXIMUM}) return state;
  var parts = text.split("&");
  try {
    for (var at = 0; at < parts.length; at += 1) {
      var mark = parts[at].indexOf("=");
      if (mark > 0) {
        var name = parts[at].slice(0, mark);
        var value = decodeURIComponent(parts[at].slice(mark + 1));
        if (name === ${
        JSON.stringify(STATE_ENTRY_NAME)
    }) state.entry = getPreviewWholeFromText(value);
        if (name === ${JSON.stringify(STATE_SCREEN_NAME)}) state.screen = value;
        if (name === ${
        JSON.stringify(STATE_STORE_NAME)
    }) state.store = getPreviewStoreFromText(value);
      }
    }
  } catch (refusal) {
    void refusal;
    return { entry: null, screen: null, store: {} };
  }
  return state;
};`;
    assert(parser.includes('split("&")'), "an address is read by walking it");
    assert(parser.includes("catch"), "and anything that is not what this wrote reads as no state");
    return parser;
}

/**
 * The address, written after the bundle has drawn: the store as it stands, the entry the strip is
 * on, and the tab that was last pressed. The panel is found as the one shadow root on the page,
 * which is how this stays ignorant of every name the add-on chose.
 */
export function composePreviewStateWriting(): string {
    const writing = [
        composePreviewStatePanel(),
        composePreviewStateHash(),
        composePreviewStateWatch(),
    ].join("\n\n");
    assert(writing.includes("composePreviewStateHash"), "an address is composed of what is shown");
    assert(writing.includes("shadowRoot"), "and the panel is found without being named");
    return writing;
}

/** Reaching the panel, remembering the tab that was pressed, and pressing one back. */
function composePreviewStatePanel(): string {
    const panel = `var shownScreen = PREVIEW_STATE.screen;

var getPreviewPanelRoot = function () {
  var nodes = document.body.children;
  for (var at = 0; at < nodes.length; at += 1) {
    if (nodes[at].shadowRoot) return nodes[at].shadowRoot;
  }
  return null;
};

var setPreviewScreenWatched = function (root) {
  root.addEventListener("pointerdown", function handleScreenPressed(event) {
    var target = event.target;
    if (!target) return;
    if (!target.getAttribute) return;
    var pressed = target.getAttribute(${JSON.stringify(SCREEN_ATTRIBUTE)});
    if (pressed !== null) shownScreen = pressed;
  });
};

var setPreviewScreenRestored = function (root) {
  if (shownScreen === null) return;
  var found = root.querySelectorAll("[${SCREEN_ATTRIBUTE}]");
  for (var at = 0; at < found.length; at += 1) {
    if (found[at].getAttribute(${JSON.stringify(SCREEN_ATTRIBUTE)}) === shownScreen) {
      found[at].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
      return;
    }
  }
};`;
    assert(panel.includes("querySelectorAll"), "the tab that was read is pressed back");
    assert(panel.includes("pointerdown"), "and pressed as the panel listens, never clicked");
    return panel;
}

/** What the address ends up saying, and the one part of it that is allowed to be dropped. */
function composePreviewStateHash(): string {
    const hash = `var composePreviewStateHashAt = function (entry) {
  var parts = [${JSON.stringify(STATE_ENTRY_NAME)} + "=" + entry];
  if (shownScreen !== null) {
    parts.push(${JSON.stringify(STATE_SCREEN_NAME)} + "=" + encodeURIComponent(shownScreen));
  }
  var held = PREVIEW_STORE.readAll();
  var kept = {};
  var names = Object.keys(held);
  for (var at = 0; at < names.length; at += 1) {
    if (held[names[at]].length <= ${STATE_VALUE_MAXIMUM}) kept[names[at]] = held[names[at]];
  }
  parts.push(${JSON.stringify(STATE_STORE_NAME)} + "=" + encodeURIComponent(JSON.stringify(kept)));
  var whole = "#" + parts.join("&");
  if (whole.length <= ${STATE_TEXT_MAXIMUM}) return whole;
  parts.pop();
  return "#" + parts.join("&");
};

var composePreviewStateHash = function () {
  return composePreviewStateHashAt(fedCount);
};

var setPreviewStateWritten = function () {
  window.history.replaceState(null, "", composePreviewStateHash());
};`;
    assert(hash.includes("parts.pop()"), "a store too big for an address is the part that goes");
    assert(hash.includes("composePreviewStateHashAt(fedCount)"), "and the strip's own entry is");
    assert(hash.includes("replaceState"), "and the address is replaced rather than added to");
    return hash;
}

/**
 * The panel arrives when the add-on finds the game, which is not on this script's timetable — so
 * it is waited for a bounded number of tries and then given up on, panel or no panel (**S2**).
 */
function composePreviewStateWatch(): string {
    const watch = `document.addEventListener("pointerup", setPreviewStateWritten);

var panelTries = 0;
var panelTimer = window.setInterval(function handlePanelWaited() {
  panelTries += 1;
  var root = getPreviewPanelRoot();
  if (root !== null) {
    setPreviewScreenWatched(root);
    setPreviewScreenRestored(root);
    setPreviewStateWritten();
    window.clearInterval(panelTimer);
    return;
  }
  if (panelTries >= ${STATE_WAIT_TRIES}) window.clearInterval(panelTimer);
}, ${STATE_WAIT_EVERY_MS});`;
    assert(watch.includes("clearInterval"), "a panel that arrived stops being waited for");
    assert(watch.includes(`>= ${STATE_WAIT_TRIES}`), "and one that never does is given up on");
    return watch;
}
