/**
 * What `deno task preview` carries from one page to the next: the entry the replay stopped at, the
 * screen the panel was on, and what the add-on left in the store it was lent. It travels in the
 * address and nowhere else, so a rebuild finds the panel where the reader put it. The published
 * page carries none of it (`tools/preview-site.ts`), and this spells no name the add-on owns but
 * the strip's mark: the panel is found as the one shadow root on the page.
 */

import { assert, assertStringIncludes } from "@std/assert";
import { PANEL_MARK } from "#/src/ui/panel-intent.ts";
import { PROBE_NAME } from "#/tests/e2e/game-page.ts";

/** One value that travels. Past this lies the shelf, which is a fight rather than a setting. */
export const STATE_VALUE_MAXIMUM = 200;
/** The whole hash. A browser takes far more; an address somebody has to look at does not. */
export const STATE_TEXT_MAXIMUM = 2000;
/** How long the panel is waited for, in tries of `STATE_WAIT_EVERY_MILLISECONDS`. */
export const STATE_WAIT_TRIES = 40;
const STATE_WAIT_EVERY_MILLISECONDS = 25;
export const STATE_ENTRY_NAME = "e";
export const STATE_SCREEN_NAME = "s";
export const STATE_STORE_NAME = "k";

/**
 * The address, read before the bundle runs, so the store can be handed what it held last. A hash
 * is text a person can edit and a browser can truncate: anything not in the shape this wrote reads
 * as no state, which is the state a first visit is in anyway.
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
    assertStringIncludes(reading, "PREVIEW_STATE", "the state a page opens with is read first");
    assertStringIncludes(
        reading,
        "JSON.parse",
        "and what the address carried is data, not program",
    );
    return reading;
}

/** Walked rather than matched: C7 binds the browser half of this tool as it binds the rest. */
function composePreviewStateParser(): string {
    const entry = JSON.stringify(STATE_ENTRY_NAME);
    const screen = JSON.stringify(STATE_SCREEN_NAME);
    const store = JSON.stringify(STATE_STORE_NAME);
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
        if (name === ${entry}) state.entry = getPreviewWholeFromText(value);
        if (name === ${screen}) state.screen = value;
        if (name === ${store}) state.store = getPreviewStoreFromText(value);
      }
    }
  } catch (refusal) {
    void refusal;
    return { entry: null, screen: null, store: {} };
  }
  return state;
};`;
    assertStringIncludes(parser, 'split("&")', "an address is read by walking it");
    assertStringIncludes(parser, "catch", "and what this did not write reads as no state");
    return parser;
}

/**
 * The address, written after the bundle has drawn: the store as it stands, the entry the strip is
 * on, and the strip that was last pressed.
 */
export function composePreviewStateWriting(): string {
    const writing = [
        composePreviewStatePanel(),
        composePreviewStateHash(),
        composePreviewStateWatch(),
    ].join("\n\n");
    assertStringIncludes(writing, "composePreviewStateHash", "an address is composed of the page");
    assertStringIncludes(writing, "shadowRoot", "and the panel is found without being named");
    return writing;
}

/** Reaching the panel, remembering the strip that was pressed, and pressing one back. */
function composePreviewStatePanel(): string {
    const mark = JSON.stringify(PANEL_MARK.screen);
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
    var pressed = target.getAttribute(${mark});
    if (pressed !== null) shownScreen = pressed;
  });
};

var setPreviewScreenRestored = function (root) {
  if (shownScreen === null) return;
  var found = root.querySelectorAll("[${PANEL_MARK.screen}]");
  for (var at = 0; at < found.length; at += 1) {
    if (found[at].getAttribute(${mark}) === shownScreen) {
      found[at].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
      return;
    }
  }
};`;
    assertStringIncludes(panel, "querySelectorAll", "the strip that was read is pressed back");
    assertStringIncludes(panel, "pointerdown", "and pressed as the panel listens, never clicked");
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
  return composePreviewStateHashAt(window.${PROBE_NAME}.fed);
};

var setPreviewStateWritten = function () {
  window.history.replaceState(null, "", composePreviewStateHash());
};`;
    assertStringIncludes(hash, "parts.pop()", "a store too big for an address is what goes");
    assertStringIncludes(hash, ".fed)", "and the strip's own entry is what stays");
    assertStringIncludes(hash, "replaceState", "and the address is replaced, not added to");
    return hash;
}

/**
 * The panel arrives when the add-on finds the game, which is not on this script's timetable, so it
 * is waited for a bounded number of tries and then given up on (S2).
 */
function composePreviewStateWatch(): string {
    assert(STATE_WAIT_TRIES > 0, "a panel is waited for at least once");
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
}, ${STATE_WAIT_EVERY_MILLISECONDS});`;
    assertStringIncludes(watch, "clearInterval", "a panel that arrived stops being waited for");
    return watch;
}

/**
 * The same names, saying nothing was carried and nothing will be written: the published page keeps
 * no state in its address, and the driver still reads `PREVIEW_STATE` and calls the writer.
 */
export function composePreviewStateBare(): string {
    const bare = `var PREVIEW_STATE = { entry: null, screen: null, store: {} };

var composePreviewStateHashAt = function () {
  return "";
};

var composePreviewStateHash = function () {
  return "";
};

var setPreviewStateWritten = function () {};`;
    assertStringIncludes(bare, "PREVIEW_STATE", "the driver finds the state it reads");
    assertStringIncludes(bare, "setPreviewStateWritten", "and the writer it calls after a feed");
    return bare;
}
