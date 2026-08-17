/**
 * The panel, in a browser, changing while you edit it.
 *
 * `bun run check` cannot see a panel, and the add-on's real surface is a page.
 * What stood in for that until now was a recipe in `.claude/skills/verify/SKILL.md`
 * telling whoever read it to hand-write an HTML page, stub the engine, embed a
 * capture and point Firefox at `file://` — a recipe two audits record was never
 * actually run. This is that recipe as a thing that exists.
 *
 * It serves the built userscript over a captured fight, watches what a build
 * reads, and reloads the page when any of it changes. Nothing here ships: §5's
 * promise not to talk to the network binds `src/`, and this is `tools/`.
 *
 * **The replay is the point, and it is stepped.** A fight arrives as a list of
 * engine payloads, so the page can stop part-way through one — which is the only
 * way to look at the panel before any data has arrived, or at a roster mid-fight.
 * Going forward is feeding the next payload. Going backward is feeding the fight
 * again from its first: `src/game/battle-session.ts` accumulates and has no
 * rewind, but it *resets* on a payload carrying `init`, and every capture in
 * `tests/captured-fights/` carries that exactly once and on its first payload.
 * That is measured on every recording rather than assumed, and re-measured on
 * every run by `tests/tools/preview-server.test.ts` — a capture arriving without
 * it would make the rewind silently wrong. So a rewind costs a replay and not a
 * reload, and the panel keeps the screen and the drill level the reader opened.
 */

import { watch, type FSWatcher } from "node:fs";

import { composeUserscriptFiles, BundleError } from "@/build.ts";
import { assertDefined } from "@/libs/assert.ts";
import { composeJsonText } from "@/libs/json.ts";
import { getIntegerFromText } from "@/libs/number.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

export class PreviewServerError extends MargoMeterToolError {
  constructor(reason: string, options?: ErrorOptions) {
    super("PreviewServer", reason, options);
  }
}

const DEFAULT_PORT = 4173;

/**
 * What a rebuild watches.
 *
 * `package.json` is in it because the version is substituted from there at build
 * time (`build.ts`), so a bump changes the bundle without touching a line of
 * `src/`.
 *
 * ⚠️ **`tools/` and `build.ts` are deliberately absent.** This process has
 * already imported both, so a rebuild cannot pick up a change to either and
 * watching them would promise a reload that carries nothing new. Editing the
 * server is `bun --watch tools/preview-server.ts`, which restarts the process —
 * at the cost of the last-good-bundle behaviour below, so it is for working on
 * the server rather than on the panel.
 */
const WATCHED_PATHS = ["src", "libs", "package.json"];

/**
 * How long to wait after a file event before rebuilding.
 *
 * Measured on Bun 1.3.14 / Linux: a save on an existing file fires one `change`,
 * a create fires `rename` **and** `change`, and nothing was dropped over repeated
 * saves. So this is not covering for missed events — it collapses that pair and a
 * format-on-save that touches several files, and 60 ms is below what anybody
 * notices while being well clear of both.
 */
const REBUILD_AFTER_QUIET_MS = 60;

/**
 * How often the reload stream says something into the silence.
 *
 * ⚠️ **`Bun.serve` closes an idle request after 10 seconds by default**, and it
 * does it to the reload stream, so hot reloading worked for ten seconds after the
 * page opened and then stopped — with nothing on screen saying why. `idleTimeout`
 * below is what fixes it here; this is what keeps a proxy between the two from
 * doing the same thing on its own schedule.
 */
const KEEP_ALIVE_EVERY_MS = 15_000;

/**
 * A build id in the shape `src/core/game-build.ts` recognises.
 *
 * The page carries a script tag naming it so a recording saved from the preview
 * says which build it came from. It is served as a 404 on purpose: only the `src`
 * attribute is ever read.
 */
const PREVIEW_GAME_BUILD = "1785244275300";

export type PreviewPageOptions = {
  /** Which capture the page replays. */
  fightName: string;
  /** How many of its payloads to feed before handing over to the controls. */
  entryIndex: number;
  /**
   * Every payload of the fight, carried in the page rather than fetched.
   *
   * ⚠️ **The replay has to finish before `load` does.** Firefox's `--screenshot`
   * waits for `load` and nothing after it, so a page that fetched its capture
   * photographed itself empty with the strip still saying `loading` — which looks
   * exactly like a panel that failed to draw. Embedding them makes the whole
   * replay synchronous, which is what the recipe in `.claude/skills/verify/SKILL.md`
   * had been doing all along and for this reason.
   */
  payloads: readonly unknown[];
  /** Every capture, so the picker is the directory rather than a list somebody typed. */
  fightNames: readonly string[];
};

/**
 * The harness page, whole, as one string.
 *
 * ⚠️ **Everything below is read by `tests/tools/source-layout.test.ts` as
 * source.** The guards strip comments and leave string literals alone, so the
 * browser JavaScript in here is held to the same rules as the TypeScript around
 * it — verbs on function names, prefixes on booleans, and none of the value
 * readers `libs/` owns. That last one is why **the server does the converting**:
 * the entry index arrives already a number, and nothing in the page turns text
 * into one.
 *
 * ⚠️ **Nothing of the harness is named `MargoMeter-`.** Two tests read a page and
 * ask whether everything named that way says whose it is; a preview page has to
 * keep that question answerable, so the harness calls its own things `preview-`
 * and every `MargoMeter-` node in the document is still the add-on's.
 *
 * ⚠️ **No block comment goes inside the template.** The guards strip comments
 * from the whole file before reading it, so a `/* … *` + `/` in here blinds them
 * to whatever it spans — and an unclosed one would pair with the next docblock's
 * end and blank the code between. The strip's own layer is the one thing that
 * would have wanted a note: it sits bottom-left below `z-index: 9999`, because
 * the panel starts in the top-right corner and may be dragged anywhere, and
 * harness chrome that covered the thing under test would be worse than useless.
 */
export function composePreviewPage(options: PreviewPageOptions): string {
  /**
   * ⚠️ **`</` is escaped, or the payloads end the script tag.** An HTML parser
   * looks for the closing tag as text and knows nothing about the JavaScript
   * string it is inside, so one `</` in a recorded message would end the block
   * early and leave the rest of the fight on the page as markup.
   */
  const settings = composeJsonText({
    fightName: options.fightName,
    entryIndex: options.entryIndex,
    entryCount: options.payloads.length,
    fightNames: options.fightNames,
    payloads: options.payloads,
  }).replaceAll("</", "<\\/");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>MargoMeter preview — ${options.fightName}</title>
<style>
  html, body { margin: 0; height: 100%; background: #14171c; color: #c8cdd6;
    font: 13px/1.5 ui-sans-serif, system-ui, sans-serif; }
  .preview-strip { position: fixed; left: 12px; bottom: 12px; z-index: 9000;
    display: flex; flex-direction: column; gap: 6px; padding: 10px 12px;
    background: #1c2027; border: 1px solid #2c323c; border-radius: 8px;
    box-shadow: 0 6px 24px rgba(0,0,0,.5); max-width: min(560px, calc(100vw - 24px)); }
  .preview-line { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .preview-strip button, .preview-strip select {
    font: inherit; color: inherit; background: #262c35; border: 1px solid #39404b;
    border-radius: 5px; padding: 3px 9px; cursor: pointer; }
  .preview-strip button:hover { background: #2f3742; }
  .preview-title { font-weight: 600; color: #8f9bb0; letter-spacing: .04em; }
  .preview-count { font-variant-numeric: tabular-nums; color: #8f9bb0; }
  .preview-build { margin-left: auto; }
  .preview-ok { color: #7fd18a; }
  .preview-bad { color: #e8836f; }
  .preview-log { display: none; margin: 0; padding: 8px; overflow: auto;
    max-height: 30vh; white-space: pre-wrap; background: #12151a;
    border: 1px solid #43301f; border-radius: 5px; color: #e8b48b;
    font: 12px/1.45 ui-monospace, monospace; }
  .preview-log[data-shown="yes"] { display: block; }
</style>
</head>
<body>

<div class="preview-strip">
  <div class="preview-line">
    <span class="preview-title">MargoMeter preview</span>
    <select id="preview-fight"></select>
    <span class="preview-build" id="preview-build"></span>
  </div>
  <div class="preview-line">
    <button id="preview-back" title="Replays the fight up to the previous entry">&#9664;</button>
    <button id="preview-next">&#9654;</button>
    <button id="preview-play">play</button>
    <button id="preview-end">to end</button>
    <span class="preview-count" id="preview-count"></span>
  </div>
  <pre class="preview-log" id="preview-log"></pre>
</div>

<script>
  // The game, as much of it as the add-on touches. Both names are needed:
  // src/game/engine-roster.ts reads "w", src/game/fight-capture.ts reads
  // "warriorsList", and with only the first every combatant snapshot in a saved
  // recording comes out empty with nothing saying why.
  window.Engine = {
    battle: {
      w: {},
      warriorsList: {},
      myteam: null,
      updateData: function handlePayload(payload) {
        var roster = payload && payload.w;
        if (roster) {
          for (var id in roster) {
            window.Engine.battle.w[id] = roster[id];
            window.Engine.battle.warriorsList[id] = roster[id];
          }
        }
        return "preview-engine";
      },
    },
  };
</script>

<script src="/main.min${PREVIEW_GAME_BUILD}.js"></script>
<script src="/margometer.user.js"></script>

<script>
  var PREVIEW = ${settings};

  function getElement(id) {
    var found = document.getElementById(id);
    if (found === null) throw new ReferenceError("preview is missing " + id);
    return found;
  }

  var countLabel = getElement("preview-count");
  var buildLabel = getElement("preview-build");
  var buildLog = getElement("preview-log");
  var picker = getElement("preview-fight");

  var fedCount = 0;
  var isPlaying = false;

  function composeAddress(fightName, entryIndex) {
    return "/?fight=" + encodeURIComponent(fightName) + "&entry=" + entryIndex;
  }

  function renderCount() {
    countLabel.textContent = "entry " + fedCount + " / " + PREVIEW.entryCount;
  }

  function renderBuild(text, isGood) {
    buildLabel.textContent = text;
    buildLabel.className = "preview-build " + (isGood ? "preview-ok" : "preview-bad");
  }

  function renderBuildLog(text) {
    buildLog.textContent = text;
    buildLog.setAttribute("data-shown", text === "" ? "no" : "yes");
  }

  function renderPicker() {
    for (var i = 0; i < PREVIEW.fightNames.length; i += 1) {
      var option = document.createElement("option");
      option.value = PREVIEW.fightNames[i];
      option.textContent = PREVIEW.fightNames[i];
      option.selected = PREVIEW.fightNames[i] === PREVIEW.fightName;
      picker.append(option);
    }
  }

  // One payload into the game's own method, which the add-on has already wrapped:
  // the wrap goes on synchronously while the bundle's script tag runs, so by the
  // time this file executes there is nothing to wait for.
  function setNextFed() {
    if (fedCount >= PREVIEW.payloads.length) return false;
    window.Engine.battle.updateData(PREVIEW.payloads[fedCount]);
    fedCount += 1;
    renderCount();
    return true;
  }

  function handlePlay() {
    isPlaying = !isPlaying;
    getElement("preview-play").textContent = isPlaying ? "pause" : "play";
    function handleTick() {
      if (!isPlaying) return;
      if (!setNextFed()) {
        isPlaying = false;
        getElement("preview-play").textContent = "play";
        return;
      }
      window.setTimeout(handleTick, 220);
    }
    handleTick();
  }

  // Rewinding is replaying. The first payload of every capture carries "init",
  // which resets the session, so feeding the fight again from zero lands on any
  // earlier entry — and the panel keeps the screen and drill level it was on,
  // which a reload would throw away.
  function setFedTo(target) {
    if (target < fedCount) fedCount = 0;
    while (fedCount < target && setNextFed()) { /* forward to where we were asked */ }
    renderCount();
  }

  getElement("preview-next").addEventListener("click", function handleNext() {
    setNextFed();
  });
  getElement("preview-end").addEventListener("click", function handleEnd() {
    setFedTo(PREVIEW.payloads.length);
  });
  getElement("preview-play").addEventListener("click", handlePlay);
  getElement("preview-back").addEventListener("click", function handleBack() {
    setFedTo(fedCount - 1 < 0 ? 0 : fedCount - 1);
  });
  picker.addEventListener("change", function handlePick() {
    window.location.href = composeAddress(picker.value, 0);
  });

  renderPicker();
  renderBuild("build ok", true);
  // Synchronously, before load fires: a screenshot is taken at load and nothing
  // after it, so a replay that waited would photograph an empty panel.
  setFedTo(PREVIEW.entryIndex);

  // A rebuild that FAILS must not reload: the page would go blank over a syntax
  // error mid-keystroke, and the panel you were looking at is the thing you were
  // looking at. It says so and keeps the last good bundle on screen instead.
  var reloads = new EventSource("/reload");
  reloads.addEventListener("rebuilt", function handleRebuilt() {
    window.location.href = composeAddress(PREVIEW.fightName, fedCount);
  });
  reloads.addEventListener("failed", function handleFailed(event) {
    renderBuild("build failed", false);
    renderBuildLog(event.data);
  });
</script>

</body>
</html>
`;
}

export type PreviewServerOptions = {
  port?: number | undefined;
  /**
   * Off in a test, so no watcher outlives it. On everywhere else — a preview
   * server that does not reload is the feature missing.
   */
  shouldWatch?: boolean | undefined;
};

export type PreviewServer = {
  url: string;
  port: number;
  stop: () => void;
};

/** A reload stream that is still open, and the way to say something into it. */
type ReloadListener = {
  send: (event: string, data: string) => void;
  close: () => void;
};

/**
 * Says one thing to every page still listening, and forgets the ones that are not.
 *
 * ⚠️ **Writing to a stream whose reader has gone throws**, with a `TypeError`
 * saying the controller is already closed — and a closed tab between a save and
 * the rebuild it triggered is ordinary, not a fault. `cancel` prunes the set for
 * a disconnect the runtime notices; this covers the race it does not, so one
 * stale listener cannot stop every live page from reloading. The catch is wider
 * than §9.5 likes for the reason `src/userscript-entry.ts` gives about storage:
 * the failure arrives as a bare `TypeError` and there is nothing narrower that
 * catches all of it.
 */
function setListenersTold(
  listeners: Set<ReloadListener>,
  event: string,
  data: string,
): void {
  for (const listener of [...listeners]) {
    try {
      listener.send(event, data);
    } catch {
      listeners.delete(listener);
    }
  }
}

function getFightByName(name: string | null): (typeof CAPTURED_FIGHTS)[number] | null {
  if (name === null) return CAPTURED_FIGHTS[0] ?? null;
  return CAPTURED_FIGHTS.find((fight) => fight.name === name) ?? null;
}

/**
 * Serves the panel and reloads it, and hands back the way to stop both.
 *
 * Named `set…` rather than `serve…` for the reason `setEngineAttachment` and
 * `setBattleWrap` are: it puts something in place and returns the undo. The
 * caller cannot know whether a build has happened yet, so `stop` is safe either
 * way.
 */
export function setPreviewServer(options: PreviewServerOptions = {}): PreviewServer {
  if (CAPTURED_FIGHTS.length === 0) {
    throw new PreviewServerError("no captured fights to preview");
  }

  const listeners = new Set<ReloadListener>();
  let watchers: FSWatcher[] = [];
  let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  /** The last bundle that built. Kept so a failed rebuild costs nothing on screen. */
  let script: string | null = null;

  async function getScript(): Promise<string> {
    if (script !== null) return script;
    const files = await composeUserscriptFiles();
    script = files.script;
    return script;
  }

  function setRebuilt(): void {
    void composeUserscriptFiles().then(
      (files) => {
        script = files.script;
        setListenersTold(listeners, "rebuilt", "ok");
      },
      (failure: unknown) => {
        // Narrowly (§9.5): a bundle that refuses is the expected failure and is
        // reported to the page. Anything else is a bug in this tool and must not
        // be dressed up as one.
        if (!(failure instanceof BundleError)) throw failure;
        setListenersTold(listeners, "failed", failure.message);
      },
    );
  }

  function handleFileEvent(): void {
    if (rebuildTimer !== null) clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(setRebuilt, REBUILD_AFTER_QUIET_MS);
  }

  function composeReloadResponse(): Response {
    let listener: ReloadListener | null = null;
    const stream = new ReadableStream<string>({
      start(controller) {
        listener = {
          send: (event, data) => {
            // One `data:` line per line of the payload, because a bare newline
            // inside one ends the event and the build log is many lines.
            const body = data.split("\n").map((line) => `data: ${line}`).join("\n");
            controller.enqueue(`event: ${event}\n${body}\n\n`);
          },
          close: () => controller.close(),
        };
        listeners.add(listener);
        controller.enqueue("retry: 500\n\n");
      },
      cancel() {
        if (listener !== null) listeners.delete(listener);
      },
    });

    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
    });
  }

  const server = Bun.serve({
    port: options.port ?? DEFAULT_PORT,
    /**
     * ⚠️ **Zero, or the reload stream dies after ten seconds.** That is
     * `Bun.serve`'s default idle timeout, and it applies to a response that is
     * deliberately never finished — so hot reloading worked until you paused to
     * think and then silently did not.
     */
    idleTimeout: 0,
    async fetch(request) {
      const address = new URL(request.url);
      const path = address.pathname;

      if (path === "/reload") return composeReloadResponse();

      if (path === "/margometer.user.js") {
        try {
          return new Response(await getScript(), {
            headers: { "content-type": "text/javascript; charset=utf-8" },
          });
        } catch (failure) {
          if (!(failure instanceof BundleError)) throw failure;
          // 500 and the log, rather than a page whose panel merely never appears.
          return new Response(failure.message, { status: 500 });
        }
      }

      if (path === "/") {
        const fight = getFightByName(address.searchParams.get("fight"));
        if (fight === null) return new Response("no such capture", { status: 404 });
        const asked = getIntegerFromText(address.searchParams.get("entry") ?? "0") ?? 0;
        const entryCount = fight.dump.calls.length;
        return new Response(
          composePreviewPage({
            fightName: fight.name,
            entryIndex: Math.max(0, Math.min(asked, entryCount)),
            payloads: fight.dump.calls.map((call) => call.payload),
            fightNames: CAPTURED_FIGHTS.map((candidate) => candidate.name),
          }),
          { headers: { "content-type": "text/html; charset=utf-8" } },
        );
      }

      // Everything else, the decoy build script included. Its 404 is expected:
      // only the `src` attribute is ever read.
      return new Response("not here", { status: 404 });
    },
  });

  if (options.shouldWatch ?? true) {
    watchers = WATCHED_PATHS.map((directory) =>
      watch(directory, { recursive: true }, handleFileEvent),
    );
    keepAliveTimer = setInterval(
      () => setListenersTold(listeners, "ping", ""),
      KEEP_ALIVE_EVERY_MS,
    );
  }

  // Undefined only for a server listening on a unix socket, which this never asks
  // for. Nobody could handle it if it happened, so it is an assertion (§9.5).
  const port = assertDefined(server.port, "a TCP server states the port it listened on");

  return {
    url: `http://localhost:${port}`,
    port,
    stop: () => {
      for (const watcher of watchers) watcher.close();
      watchers = [];
      if (rebuildTimer !== null) clearTimeout(rebuildTimer);
      if (keepAliveTimer !== null) clearInterval(keepAliveTimer);
      // Closing a stream whose reader has already gone throws, the same way
      // writing to one does — and this runs from a test's `finally` and from a
      // signal handler, where a throw costs more than the tidying is worth.
      for (const listener of listeners) {
        try {
          listener.close();
        } catch {
          // Already gone, which is the outcome this was asking for.
        }
      }
      listeners.clear();
      // `true`, or an open reload stream holds this open until it times out —
      // twelve seconds, measured, and a test that leaks one is a suite that hangs.
      void server.stop(true);
    },
  };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const portAt = argv.indexOf("--port");
  const fightAt = argv.indexOf("--fight");
  const port = portAt === -1 ? DEFAULT_PORT : (getIntegerFromText(argv[portAt + 1] ?? "") ?? DEFAULT_PORT);
  const fight = fightAt === -1 ? null : (argv[fightAt + 1] ?? null);

  const preview = setPreviewServer({ port });
  const opening = fight === null ? preview.url : `${preview.url}/?fight=${encodeURIComponent(fight)}`;
  console.log(`preview  ${opening}`);
  console.log(`captures ${CAPTURED_FIGHTS.length}, watching ${WATCHED_PATHS.join(", ")}`);
  console.log("a change under those rebuilds and reloads the page; a change here does not — restart");

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      preview.stop();
      process.exit(0);
    });
  }
}
