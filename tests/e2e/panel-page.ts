/**
 * The page this suite drives: a game, the built file over it, and a fight replayed into it.
 *
 * Deliberately **not** `tools/preview-page.ts`, which takes the browser's storage away and appends
 * its script after the bundle has run — so it can neither prove a place survives a reload nor see
 * a throw during boot. **ADR 0047.**
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect } from "@playwright/test";
import { USERSCRIPT_NAME } from "@/tests/e2e/build-once.ts";

/** What the page hangs its own machinery off, where a test reaches it. */
export const PROBE_NAME = "margometerE2e";
/** What the stub answers `updateData` with, so a test can watch the wrap hand it back. */
export const ENGINE_ANSWER = "e2e-engine";
/** The place the stub names, which no recording carries and every header states. */
export const PLACE_NAME = "E2E";
/** A build id in the shape `src/core/game-build.ts` reads, on a tag that loads nothing. */
export const GAME_BUILD = "1785244275300";
export const GAME_SCRIPT_NAME = `main.min${GAME_BUILD}.js`;
/** Where the suite serves: the userscript's own `@match`, and a real origin, so storage works. */
export const PAGE_ORIGIN = "https://tempest.margonem.pl";
/** What `readWorldFromPage` takes off that hostname, and what the saved file then states. */
export const PAGE_WORLD = "tempest";
/** Where the settings the driver reads are parked, since a page cannot be handed an argument. */
const SETTINGS_ID = "e2e-settings";
/** Late enough to miss the first look and two polls of 250 ms, early enough not to slow a test. */
const ENGINE_LATE_MILLISECONDS = 700;

/** What the driver leaves behind, and the only thing a test reaches into the page for. */
export interface PanelProbe {
    saved: string[];
    fed: number;
    answers: unknown[];
    feed(count: number): number;
    remaining(): number;
    rewind(): void;
}

declare global {
    // The page's own global, declared where the page composes it. `var` is what reaches
    // `typeof globalThis`; an `interface Window` does not, because under `deno check` the global
    // object is Deno's and not a `Window`.
    var margometerE2e: PanelProbe;
}

/** When the game stands up, relative to the bundle looking for one. */
export type EnginePresence = "before" | "late" | "none";

export interface PanelPageOptions {
    calls: readonly unknown[];
    /** How many payloads the page replays before `load`. The rest are `feed`'s to deliver. */
    fedThrough: number;
    engine: EnginePresence;
    doesLoadTwice: boolean;
}

/** The payloads of a recording, in order, as the game delivered them. */
export function readRecordedCalls(rootDirectory: string, name: string): unknown[] {
    const text = readFileSync(join(rootDirectory, name), "utf8");
    const read = JSON.parse(text) as { calls?: { payload?: unknown }[] };
    const calls = read.calls ?? [];
    expect(calls.length, `${name} carries calls to replay`).toBeGreaterThan(0);
    return calls.map((call) => call.payload);
}

/**
 * What the page keeps for a test. `Blob` is wrapped because the panel hands a file over as an
 * object URL it clicks and revokes on the next macrotask (`saveRecording`, in the entry) — the
 * text is kept here synchronously, where nothing can lose the race for it.
 */
function composeProbe(): string {
    return `window.${PROBE_NAME} = { saved: [], fed: 0 };
(function setSavedKept() {
  var Made = window.Blob;
  window.Blob = function (parts, options) {
    window.${PROBE_NAME}.saved.push(String(parts && parts[0]));
    return new Made(parts, options);
  };
})();`;
}

/**
 * The game, stood up before the add-on looks for one: the first look is the one that finds it, and
 * a page standing it up afterwards draws nothing for as long as the poll takes
 * (`src/game/engine-attachment.ts`). Both roster names are needed — with only `w` every snapshot
 * read under `warriorsList` comes out empty (`src/game/engine-warrior.ts`).
 */
function composeGame(): string {
    return `window.Engine = {
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
}

/** The game arriving after the bundle has already looked for it once and missed. */
function composeGameLate(): string {
    return `window.setTimeout(function standTheGameUp() {
${composeGame()}
}, ${ENGINE_LATE_MILLISECONDS});`;
}

/**
 * The replay. Every payload goes through `Engine.battle.updateData`, which by then is MargoMeter's
 * wrapper, so the calls enter at the production boundary rather than beside it. What the driver
 * leaves behind is `feed`, so a test can walk a fight forward and read the panel during it.
 */
function composeDriver(): string {
    return `(function setFightFed() {
  var settings = JSON.parse(document.getElementById(${JSON.stringify(SETTINGS_ID)}).textContent);
  var probe = window.${PROBE_NAME};
  probe.answers = [];
  probe.feed = function feed(count) {
    for (var step = 0; step < count; step += 1) {
      if (probe.fed >= settings.calls.length) return probe.fed;
      probe.answers.push(window.Engine.battle.updateData(settings.calls[probe.fed]));
      probe.fed += 1;
    }
    return probe.fed;
  };
  probe.remaining = function remaining() { return settings.calls.length - probe.fed; };
  // The same fight delivered again, which the game answers with a second \`init\` — the only way
  // a page holding one recording can put a second fight in front of the panel.
  probe.rewind = function rewind() { probe.fed = 0; };
  if (window.Engine !== undefined) probe.feed(settings.fedThrough);
})();`;
}

/**
 * The whole page, and the order of its tags is the mechanism: probe, game, decoy, bundle, settings,
 * driver. Nothing here touches storage — the browser's own is what the reload tests are about.
 */
export function composePanelPage(options: PanelPageOptions): string {
    expect(options.calls.length, "a page replays a fight there is something of").toBeGreaterThan(0);
    expect(options.fedThrough, "and stops somewhere inside it").toBeLessThanOrEqual(
        options.calls.length,
    );
    const settings = JSON.stringify({ calls: options.calls, fedThrough: options.fedThrough })
        .split("<").join("\\u003c");
    const game = options.engine === "none"
        ? ""
        : options.engine === "late"
        ? composeGameLate()
        : composeGame();
    const second = options.doesLoadTwice ? `<script src="/${USERSCRIPT_NAME}"></script>\n` : "";
    return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>MargoMeter end to end</title></head>
<body>
<script>${composeProbe()}</script>
<script>${game}</script>
<script src="/${GAME_SCRIPT_NAME}"></script>
<script src="/${USERSCRIPT_NAME}"></script>
${second}<script id="${SETTINGS_ID}" type="application/json">${settings}</script>
<script>${composeDriver()}</script>
</body>
</html>
`;
}
