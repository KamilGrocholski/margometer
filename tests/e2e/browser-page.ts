/**
 * The page this suite drives: a probe, a game, the built file over it, and a fight replayed into
 * it. Deliberately **not** `tools/preview-page.ts`, which takes the browser's storage away and
 * appends its script after the bundle has run — so it can neither prove a place survives a reload
 * nor see a throw during boot. **ADR 0046.**
 */

import { assert, assertStringIncludes } from "@std/assert";
import { USERSCRIPT_NAME } from "@/tools/build-userscript.ts";

export const PROBE_NAME = "margometerE2e";
/** What the stub answers `updateData` with, so it answers the game something. */
const ENGINE_ANSWER = "e2e-engine";
/** The place the stub names, which no recording carries and every bar states. */
const PLACE_NAME = "E2E";
/** A build id in the shape `src/core/game-build.ts` reads, on a tag that loads nothing. */
const GAME_BUILD = "1785244275300";
export const GAME_SCRIPT_NAME = `main.min${GAME_BUILD}.js`;

export interface BrowserPageOptions {
    /** The whole recording, inlined: a page that fetches its fight has none at `load`. */
    calls: readonly unknown[];
    entryIndex: number;
    doesLoadTwice: boolean;
}

/**
 * What the page saw, installed **before** anything else runs. `console.error` is wrapped rather
 * than listened to because there is no event for it, and it is the one console the add-on holds.
 */
function composeProbe(): string {
    const probe = `window.${PROBE_NAME} = { failures: [], said: [], saved: [] };
(function setSavedKept() {
  // The file the panel hands over is a Blob it builds and an object URL it clicks
  // (\`saveRecording\`, \`src/userscript-entry.ts\`). Wrapping the constructor keeps the text
  // synchronously; reading it back off the URL would be a promise, and a page's replay is not.
  var Made = window.Blob;
  window.Blob = function (parts, options) {
    window.${PROBE_NAME}.saved.push(String(parts && parts[0]));
    return new Made(parts, options);
  };
})();
window.addEventListener("error", function handleError(event) {
  window.${PROBE_NAME}.failures.push(String(event.message));
});
window.addEventListener("unhandledrejection", function handleRejection(event) {
  window.${PROBE_NAME}.failures.push("rejection: " + String(event.reason));
});
(function setConsoleWatched() {
  var names = ["error", "warn"];
  for (var at = 0; at < names.length; at += 1) {
    (function watchOne(name) {
      var through = console[name].bind(console);
      console[name] = function () {
        window.${PROBE_NAME}.said.push(name + ": " + String(arguments[0]));
        through.apply(null, arguments);
      };
    })(names[at]);
  }
})();`;
    assertStringIncludes(probe, "unhandledrejection", "a promise nobody caught is a failure seen");
    assertStringIncludes(probe, "window.Blob", "and a file handed over is kept where a test reads");
    assertStringIncludes(probe, "console[name]", "and the one console the add-on holds is watched");
    return probe;
}

/**
 * The game, stood up before the add-on looks for one: the first look is the one that finds it,
 * and a page standing it up afterwards draws nothing for as long as the poll takes
 * (`src/game/engine-attachment.ts`). Both roster names are needed — with only `w` every snapshot
 * read under `warriorsList` comes out empty (`src/game/engine-warrior.ts`).
 *
 * The duplication with `tools/preview-page.ts` is deliberate, and `tests/AGENTS.md` asks for it
 * to say so here: two pages need a game and need different things around it.
 * `tests/repository/game-vocabulary.test.ts` holds the two to one spelling (**N13**).
 */
function composeGame(): string {
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
      return ${JSON.stringify(ENGINE_ANSWER)};
    }
  },
  map: { d: { name: ${JSON.stringify(PLACE_NAME)} } },
  hero: { d: { x: 1, y: 1 } }
};`;
    assertStringIncludes(stood, "updateData", "carrying the call the add-on puts its wrap on");
    assertStringIncludes(stood, "warriorsList", "and both names a snapshot is read under");
    return stood;
}

/**
 * The replay, synchronous and finished before `load` fires. Every payload goes through
 * `Engine.battle.updateData`, which by then is MargoMeter's wrapper, so the calls enter at the
 * production boundary rather than beside it.
 */
function composeDriver(): string {
    const driver = `(function setFightFed() {
  var settings = JSON.parse(document.getElementById("e2e-settings").textContent);
  for (var at = 0; at < settings.entryIndex; at += 1) {
    window.Engine.battle.updateData(settings.calls[at]);
  }
})();`;
    assertStringIncludes(driver, "Engine.battle.updateData", "fed through the wrap, not past it");
    assertStringIncludes(driver, "settings.entryIndex", "as far as the page was told to");
    return driver;
}

/**
 * The whole page, and the order of its tags is the mechanism: probe, game, decoy, bundle, calls,
 * driver. Nothing here touches storage — the browser's own is what two of these tests are about.
 */
export function composeBrowserPage(options: BrowserPageOptions): string {
    assert(options.calls.length > 0, "a page replays a fight that has something in it");
    assert(options.entryIndex <= options.calls.length, "and stops somewhere inside it");
    const settings = JSON.stringify({ calls: options.calls, entryIndex: options.entryIndex })
        .split("<").join("\\u003c");
    const second = options.doesLoadTwice ? `<script src="/${USERSCRIPT_NAME}"></script>\n` : "";
    return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>MargoMeter end to end</title></head>
<body>
<script>${composeProbe()}</script>
<script>${composeGame()}</script>
<script src="/${GAME_SCRIPT_NAME}"></script>
<script src="/${USERSCRIPT_NAME}"></script>
${second}<script id="e2e-settings" type="application/json">${settings}</script>
<script>${composeDriver()}</script>
</body>
</html>
`;
}
