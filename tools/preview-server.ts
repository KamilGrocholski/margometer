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
 * every run by `tests/tools/preview-page.test.ts` — a capture arriving without it
 * would make the rewind silently wrong. So a rewind costs a replay and not a
 * reload, and the panel keeps the tab the reader chose. It does not keep the
 * drill level: the payload it replays from carries `init`, which is a fight
 * opening, and the panel goes back to the top of the tab for one
 * (`src/ui/panel-screen.ts`).
 * ⚠️ **With one exception, and it is the boundary rather than a case:** replaying
 * reaches entry 1 at the lowest, so the panel before any payload is a page that
 * has never been fed. That step reloads, and `tools/preview-page.ts` says how the
 * ask survives it.
 *
 * **The page itself is `tools/preview-page.ts`.** It left here when it got a
 * second consumer (§7.1) — `tools/preview-site.ts` writes the same page down
 * rather than serving it — and what is left in this file is the half only a
 * server can answer: the routes, the watcher, and the reload stream below.
 */

import { watch, type FSWatcher } from "node:fs";

import { composeUserscriptFiles, BundleError, USERSCRIPT_FILENAME } from "@/build.ts";
import { assertDefined } from "@/libs/assert.ts";
import { getIntegerFromText } from "@/libs/number.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";
import { composePreviewPage, type PreviewWords } from "@/tools/preview-page.ts";
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
 * What the strip says here, in the language the rest of this repository is
 * written in.
 *
 * The reader of this page is whoever is editing `src/`, which is why these are
 * English while `tools/preview-site.ts` draws Polish over the same template: §3's
 * rule is about the text a **player** reads, and nobody plays the game through a
 * development server.
 */
const PREVIEW_WORDS: PreviewWords = {
  language: "en",
  title: "MargoMeter preview",
  start: "to start",
  backHint: "Replays the fight up to the previous entry",
  end: "to end",
  play: "play",
  pause: "pause",
  entry: "entry",
};

/**
 * The half of the driver only a server can answer.
 *
 * ⚠️ **Read as source like everything around it** — `tests/tools/source-layout.test.ts`
 * strips comments from this file and searches the rest, and a template literal is
 * not a hiding place: verbs on the function names, no block comment inside it.
 *
 * The build label and the log live here rather than in the page, and that is the
 * point of the split: a published page that says `build ok` in green is asserting
 * something about a build nobody ran.
 */
const RELOAD_SCRIPT = `
  var buildLabel = getElement("preview-build");
  var buildLog = getElement("preview-log");

  function renderBuild(text, isGood) {
    buildLabel.textContent = text;
    buildLabel.className = "preview-build " + (isGood ? "preview-ok" : "preview-bad");
  }

  function renderBuildLog(text) {
    buildLog.textContent = text;
    buildLog.setAttribute("data-shown", text === "" ? "no" : "yes");
  }

  function composeAddress(fightName, entryIndex) {
    return "/?fight=" + encodeURIComponent(fightName) + "&entry=" + entryIndex;
  }

  renderBuild("build ok", true);

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
`;

export type PreviewServerOptions = {
  port?: number | undefined;
  /**
   * Off in a test, so no watcher outlives it. On everywhere else — a preview
   * server that does not reload is the feature missing.
   */
  shouldWatch?: boolean | undefined;
  /**
   * Serve the development build instead, so the cost overlay is over the panel.
   *
   * ⚠️ **Off by default, and that default is the whole point of the flag.** A
   * preview built on settings nobody installs is a preview of something nobody
   * runs, which is the argument `build.ts` makes for `iife` and `minify: false`;
   * this is the one setting a person may deliberately step outside it for, and
   * they have to ask. `tools/preview-site.ts` never asks — what it publishes is
   * the installed file, and `tests/tools/preview-site.test.ts` holds that.
   */
  isDevelopment?: boolean | undefined;
  /**
   * What the page runs after its own driver, in place of hot reloading.
   *
   * `tools/panel-screenshots.ts` needs the same server — the bundle, the inlined
   * fight, the synchronous replay — and a different second half: clicks that put
   * the panel in the state being photographed. Handing it the hole keeps this
   * file ignorant of screenshots; passing `null` turns reloading off for a caller
   * that has no browser to reload.
   */
  appendedScript?: string | null | undefined;
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

/**
 * Where the picker goes, which is this server's own answer and not the page's.
 *
 * A capture is chosen here with a query on one path, because there is a process
 * to answer it. `tools/preview-site.ts` has no such thing and addresses a
 * filename instead, which is why the page is handed the address rather than
 * composing one (`tools/preview-page.ts`).
 */
function composeFightAddress(name: string): string {
  return `/?fight=${encodeURIComponent(name)}&entry=0`;
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

  const isDevelopment = options.isDevelopment ?? false;
  const appendedScript = options.appendedScript === undefined
    ? RELOAD_SCRIPT
    : options.appendedScript;

  async function getScript(): Promise<string> {
    if (script !== null) return script;
    const files = await composeUserscriptFiles(isDevelopment);
    script = files.script;
    return script;
  }

  function setRebuilt(): void {
    void composeUserscriptFiles(isDevelopment).then(
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

      if (path === `/${USERSCRIPT_FILENAME}`) {
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
            fights: CAPTURED_FIGHTS.map((candidate) => ({
              name: candidate.name,
              address: composeFightAddress(candidate.name),
            })),
            // Everything is answered from the root here, which is the one thing a
            // published copy of this page cannot say (`tools/preview-site.ts`).
            scriptDirectory: "/",
            words: PREVIEW_WORDS,
            // Nothing to introduce: whoever opened this started the server.
            introduction: null,
            appendedScript,
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

  const isDevelopment = argv.includes("--dev");

  const preview = setPreviewServer({ port, isDevelopment });
  const opening = fight === null ? preview.url : `${preview.url}/?fight=${encodeURIComponent(fight)}`;
  console.log(`preview  ${opening}`);
  console.log(`captures ${CAPTURED_FIGHTS.length}, watching ${WATCHED_PATHS.join(", ")}`);
  console.log(isDevelopment ? "serving the development build — the cost overlay is on" : "serving the build people install; --dev adds the cost overlay");
  console.log("a change under those rebuilds and reloads the page; a change here does not — restart");

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      preview.stop();
      process.exit(0);
    });
  }
}
