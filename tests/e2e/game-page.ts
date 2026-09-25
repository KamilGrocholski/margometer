/**
 * The page a fight is looked at on: a game, the built file over it, and a fight replayed into it
 * through the game's own method. The browser suite drives it and `tools/preview-server.ts` serves
 * it, so the two cannot stand the add-on up on different games. It imports nothing, because Node
 * runs it under Playwright and Deno runs it under the preview.
 */

/** What the driver leaves behind, and the only thing a test reaches into the page for. */
export interface PanelProbe {
    saved: string[];
    fed: number;
    answers: unknown[];
    feed(count: number): number;
    remaining(): number;
    rewind(): void;
    /** Another fight in the same page, from its first call, which is how a preview picks one. */
    load(calls: readonly unknown[]): void;
    /** The call fed last, which the preview reads the reader's side off; null before any. */
    lastCall: unknown;
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
    /**
     * Where the game says the fight is. A map name is the game's own and nothing in `src/` bounds
     * it, so a test that needs a long one says so rather than the suite carrying one everywhere.
     */
    place: string;
    /**
     * The bundle's filename. `tools/build-userscript.ts` owns it, and a loader that cannot resolve
     * `jsr:` respells it (`build-once.ts`), so each side hands in its own.
     */
    userscriptName: string;
    /** What stands after the driver: nothing for a test, the stepping strip for `deno task preview`. */
    afterDriver?: string;
    /** What runs before the bundle does: the published page seeds where the windows stand. */
    beforeBundle?: string;
    /** The published page is read by players, in Polish (L2); a test's is read by nobody. */
    title?: string;
    language?: string;
    /** Where the scripts are asked for: the root when served, beside the page when published. */
    scriptDirectory?: string;
}

/**
 * How many rounds a flush takes before it gives up: a frame asks for no second frame of its own
 * (`src/runtime/margometer-runtime.ts`), so one round is all a flush should ever need.
 */
const FRAMES_FLUSHED_MAXIMUM = 4;
/** The host the add-on puts in the page, which every reading of it starts from. */
export const HOST_SELECTOR = "#MargoMeter-Panel";
/** What the page hangs its own machinery off, where a test reaches it. */
export const PROBE_NAME = "margometerE2e";
/** What the stub answers `updateData` with, so a test can watch the wrap hand it back. */
export const ENGINE_ANSWER = "e2e-engine";
/** The place the stub names, which no recording carries and every header states. */
export const PLACE_NAME = "E2E";
/** A build id in the shape `src/game/game-build.ts` reads, on a tag that loads nothing. */
export const GAME_BUILD = "1785244275300";
export const GAME_SCRIPT_NAME = `main.min${GAME_BUILD}.js`;
/** Where the settings the driver reads are parked, since a page cannot be handed an argument. */
const SETTINGS_ID = "e2e-settings";
/** Late enough to miss the first look and two polls of 250 ms, early enough not to slow a test. */
const ENGINE_LATE_MILLISECONDS = 700;

/**
 * The whole page, and the order of its tags is the mechanism: probe, game, decoy, bundle, settings,
 * driver. Nothing here touches storage — the browser's own is what the reload tests are about — and
 * only a caller's `beforeBundle` does, the published page seeding where its windows stand. The
 * empty icon keeps a browser from asking the host for one, whose miss is a line on the console.
 */
export function composePanelPage(options: PanelPageOptions): string {
    const settings = JSON.stringify({ calls: options.calls, fedThrough: options.fedThrough })
        .split("<").join("\\u003c");
    const game = options.engine === "none"
        ? ""
        : options.engine === "late"
        ? composeGameLate(options.place)
        : composeGame(options.place);
    const directory = options.scriptDirectory ?? "/";
    const bundle = `<script src="${directory}${options.userscriptName}"></script>\n`;
    const second = options.doesLoadTwice ? bundle : "";
    const before = options.beforeBundle ?? "";
    return `<!doctype html>
<html lang="${options.language ?? "en"}">
<head><meta charset="utf-8"><link rel="icon" href="data:,">
<title>${options.title ?? "MargoMeter end to end"}</title></head>
<body>
<script>${composeProbe()}</script>
<script>${game}</script>
<script src="${directory}${GAME_SCRIPT_NAME}"></script>
${before}${bundle}${second}<script id="${SETTINGS_ID}" type="application/json">${settings}</script>
<script>${composeDriver()}</script>
${options.afterDriver ?? ""}</body>
</html>
`;
}

/** The game arriving after the bundle has already looked for it once and missed. */
function composeGameLate(place: string): string {
    return `window.setTimeout(function standTheGameUp() {
${composeGame(place)}
}, ${ENGINE_LATE_MILLISECONDS});`;
}

/**
 * The game, stood up before the add-on looks for one: the first look is the one that finds it, and
 * a page standing it up afterwards draws nothing for as long as the poll takes
 * (`src/runtime/engine-search.ts`). Both roster names are needed — with only `w` every snapshot
 * read under `warriorsList` comes out empty (`src/game/engine-warrior.ts`).
 *
 * Each fighter carries a `$` of the client's own shape, so what `src/game/engine-tooltip.ts`
 * writes lands somewhere a test can read it back.
 */
function composeGame(place: string): string {
    return `window.MARGOMETER_TIPS = {};
// The client's registry of tooltips is one string per fighter, and these four are all the add-on
// asks of it (src/game/engine-tooltip.ts). \`told\` counts what an open tooltip was told.
window.MARGOMETER_TOLD = {};
var composeTipTarget = function (id) {
  var targets = {
    getTipData: function () { return window.MARGOMETER_TIPS[id]; },
    tip: function (content) { window.MARGOMETER_TIPS[id] = content; },
    concatTip: function (row) { window.MARGOMETER_TIPS[id] += "<br>" + row; },
    trigger: function () { window.MARGOMETER_TOLD[id] = (window.MARGOMETER_TOLD[id] || 0) + 1; }
  };
  return { find: function () { return targets; } };
};
window.Engine = {
  battle: {
    w: {},
    warriorsList: {},
    updateData: function handleCall(payload) {
      var roster = payload && payload.w;
      if (roster) {
        for (var id in roster) {
          // The client rebuilds a fighter's tooltip while updating them, so anything written
          // last payload is gone before this one writes.
          // Accumulated, not replaced, because the client's own record is one object it
          // mutates — a payload restates only what moved, so a fighter replaced by it loses the
          // name they were introduced under — and a warrior with no name is one
          // \`readLiveWarriors\` steps over.
          window.MARGOMETER_TIPS[id] = "game";
          var held = window.Engine.battle.w[id] || { $: composeTipTarget(id) };
          for (var field in roster[id]) held[field] = roster[id][field];
          window.Engine.battle.w[id] = held;
          window.Engine.battle.warriorsList[id] = held;
        }
      }
      return ${JSON.stringify(ENGINE_ANSWER)};
    }
  },
  map: { d: { name: ${JSON.stringify(place)} } },
  hero: { d: { x: 1, y: 1 } }
};`;
}

/**
 * What the page keeps for a test. `Blob` is wrapped because the panel hands a file over as an
 * object URL it clicks and revokes on the next macrotask (`initPageFile`, in `src/game/page-file.ts`) — the
 * text is kept here synchronously, where nothing can lose the race for it.
 */
function composeProbe(): string {
    return `window.${PROBE_NAME} = { saved: [], fed: 0 };
(function setFramesFlushable() {
  var request = window.requestAnimationFrame.bind(window);
  var cancel = window.cancelAnimationFrame.bind(window);
  var pending = [];
  var run = function (entry, at) {
    var standing = pending.indexOf(entry);
    if (standing !== -1) pending.splice(standing, 1);
    if (entry.done) return;
    entry.done = true;
    entry.step(at);
  };
  window.requestAnimationFrame = function (step) {
    var entry = { step: step, done: false, handle: 0 };
    entry.handle = request(function (at) { run(entry, at); });
    pending.push(entry);
    return entry.handle;
  };
  window.cancelAnimationFrame = function (handle) {
    pending.forEach(function (entry) { if (entry.handle === handle) entry.done = true; });
    cancel(handle);
  };
  window.${PROBE_NAME}.flushFrames = function () {
    for (var turn = 0; turn < ${FRAMES_FLUSHED_MAXIMUM}; turn += 1) {
      if (pending.length === 0) return;
      pending.slice().forEach(function (entry) { run(entry, performance.now()); });
    }
  };
})();
(function setSavedKept() {
  var Made = window.Blob;
  window.Blob = function (parts, options) {
    window.${PROBE_NAME}.saved.push(String(parts && parts[0]));
    return new Made(parts, options);
  };
})();`;
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
      probe.lastCall = settings.calls[probe.fed];
      probe.answers.push(window.Engine.battle.updateData(probe.lastCall));
      probe.fed += 1;
    }
    return probe.fed;
  };
  probe.remaining = function remaining() { return settings.calls.length - probe.fed; };
  probe.lastCall = null;
  probe.load = function load(calls) {
    settings.calls = calls;
    probe.fed = 0;
    probe.lastCall = null;
  };
  // The same fight delivered again, which the game answers with a second \`init\` — the only way
  // a page holding one recording can put a second fight in front of the panel.
  probe.rewind = function rewind() { probe.fed = 0; };
  if (window.Engine !== undefined) probe.feed(settings.fedThrough);
})();`;
}
