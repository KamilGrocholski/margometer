/**
 * The panel in a browser over a recording, rebuilt and reloaded when a file the bundle reads
 * changes: `deno task check` cannot see a panel, and the gate can be green while the thing a player
 * looks at is broken. The page is `tests/e2e/game-page.ts`, the one the browser suite drives, with
 * a strip under it that steps the fight; the bundle is `tools/build-userscript.ts`'s. Nothing here
 * ships, and `develop:SECURITY.md`'s rule against the network binds `src/`, not this.
 *
 *     deno task preview        # then open http://127.0.0.1:8000/
 */

import { assert, assertStrictEquals } from "@std/assert";
import { parseInteger } from "#/libs/number-text.ts";
import { callForeign } from "#/libs/result.ts";
import { composePanelPage, GAME_SCRIPT_NAME, PLACE_NAME } from "#/tests/e2e/game-page.ts";
import { readRecordedFights, type RecordedFight } from "#/tests/recorded-fights.ts";
import {
    readDevelopmentVersion,
    readUserscriptFiles,
    USERSCRIPT_NAME,
} from "./build-userscript.ts";
import { UserscriptBuildError } from "./margometer-tool-error.ts";
import { formatRecordingName } from "./recorded-material.ts";

/** What the server answers from: the last bundle that built, and why the newest did not. */
export interface PreviewState {
    script: string;
    /** The first line of what the bundler said, while the tree does not build; null once it does. */
    failure: string | null;
    fights: readonly RecordedFight[];
}

/** Each page open on the preview holds one stream. */
export type PreviewListeners = Set<ReadableStreamDefaultController<Uint8Array>>;

const PREVIEW_HOSTNAME = "127.0.0.1";
const PREVIEW_PORT = 8000;
/** A preview is watched by the pages one person has open; this is far past that (S11). */
export const LISTENERS_MAXIMUM = 64;
/** What a build reads. A change anywhere else leaves the bundle as it was. */
const WATCHED_DIRECTORIES = ["src", "libs", "frozen"];
/** An editor saves in bursts; one rebuild answers the burst rather than each file in it. */
const REBUILD_QUIET_MILLISECONDS = 150;
const FIGHT_PREFIX = "/fight/";
const EVENTS_PATH = "/events";
const FAVICON_PATH = "/favicon.ico";
const THROUGH_PARAMETER = "through";
const RELOAD_SAID = "reload";
const TEXT_ENCODER = new TextEncoder();
const HTML_TYPE = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" };
const SCRIPT_TYPE = { "content-type": "text/javascript", "cache-control": "no-store" };

/** Every request but the event stream, which holds a connection open and is the server's own. */
export function answerPreviewRequest(url: URL, state: PreviewState): Response {
    assert(url.pathname.length > 0, "a request names a path");
    if (url.pathname === "/") {
        return new Response(composePreviewIndex(state.fights), { headers: HTML_TYPE });
    }
    if (url.pathname === `/${USERSCRIPT_NAME}`) {
        return new Response(state.script, { headers: SCRIPT_TYPE });
    }
    // An empty script and never a miss: only the tag's `src` is ever read, for the build id.
    if (url.pathname === `/${GAME_SCRIPT_NAME}`) return new Response("", { headers: SCRIPT_TYPE });
    // Asked for by every browser on its own, and a miss is a line on the console a reader checks.
    if (url.pathname === FAVICON_PATH) return new Response(null, { status: 204 });
    if (url.pathname.startsWith(FIGHT_PREFIX)) {
        const name = decodeURIComponent(url.pathname.slice(FIGHT_PREFIX.length));
        const fight = state.fights.find((one) => formatRecordingName(one.path) === name);
        if (fight !== undefined) {
            const through = readPreviewThrough(url, fight.updates.length);
            return new Response(composePreviewPage(fight, through), { headers: HTML_TYPE });
        }
    }
    return new Response("not here", { status: 404 });
}

/**
 * How far into the fight the page opens: the address's count where it states one inside the fight,
 * the whole fight otherwise. The strip writes it back as it steps, so a rebuild reopens there.
 */
function readPreviewThrough(url: URL, calls: number): number {
    assert(calls > 0, "a recording replays at least one call");
    const stated = url.searchParams.get(THROUGH_PARAMETER);
    const through = stated === null ? null : parseInteger(stated);
    if (through === null) return calls;
    if (through < 0) return calls;
    return Math.min(through, calls);
}

/** Every recording, linked, with how many calls each one replays. */
export function composePreviewIndex(fights: readonly RecordedFight[]): string {
    const items = fights.map((fight) => {
        const name = formatRecordingName(fight.path);
        const calls = fight.updates.length;
        return `<li><a href="${FIGHT_PREFIX}${
            encodeURIComponent(name)
        }">${name}</a> (${calls})</li>`;
    });
    assertStrictEquals(items.length, fights.length, "every recording is linked");
    return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>MargoMeter preview</title></head>
<body style="font: 14px system-ui; margin: 24px">
<h1 style="font-size: 18px">Recordings at the revision the tests read</h1>
<ul>
${items.join("\n")}
</ul>
</body>
</html>
`;
}

/** The game page the browser suite drives, over one recording, with the strip after its driver. */
export function composePreviewPage(fight: RecordedFight, through: number): string {
    assert(through >= 0, "a page opens somewhere inside the fight");
    assert(through <= fight.updates.length, "and never past its end");
    return composePanelPage({
        calls: fight.updates,
        fedThrough: through,
        engine: "before",
        doesLoadTwice: false,
        place: PLACE_NAME,
        userscriptName: USERSCRIPT_NAME,
        afterDriver: composePreviewStrip(formatRecordingName(fight.path)),
    });
}

/**
 * The strip that steps the fight, written for whoever is editing `src/` and so in English (L2).
 * It reads and feeds through the page's probe, which is how the browser suite feeds it too.
 */
function composePreviewStrip(name: string): string {
    assert(name.length > 0, "a strip names the recording it steps");
    return `<div id="preview-strip" style="position: fixed; left: 8px; bottom: 8px; z-index: 2147483647;
  display: flex; gap: 6px; align-items: center; padding: 6px 8px; border-radius: 4px;
  font: 12px system-ui; background: #222; color: #eee">
<a href="/" style="color: #9cf">recordings</a>
<span>${name}</span>
<span id="preview-fed"></span>
<button data-step="1">+1</button>
<button data-step="10">+10</button>
<button data-step="all">all</button>
<button data-restart="">restart</button>
<span id="preview-said" style="color: #f96"></span>
</div>
<script>
(function setPreviewStrip() {
  var probe = window.margometerE2e;
  var fed = document.getElementById("preview-fed");
  var said = document.getElementById("preview-said");
  var show = function () {
    fed.textContent = probe.fed + " / " + (probe.fed + probe.remaining());
    var address = new URL(location.href);
    address.searchParams.set(${JSON.stringify(THROUGH_PARAMETER)}, String(probe.fed));
    history.replaceState(null, "", address);
  };
  document.getElementById("preview-strip").addEventListener("click", function (event) {
    var pressed = event.target;
    if (pressed.hasAttribute("data-restart")) {
      location.search = "?" + ${JSON.stringify(THROUGH_PARAMETER)} + "=0";
      return;
    }
    var step = pressed.getAttribute("data-step");
    if (step === null) return;
    probe.feed(step === "all" ? probe.remaining() : Number(step));
    show();
  });
  show();
  var events = new EventSource(${JSON.stringify(EVENTS_PATH)});
  events.onmessage = function (event) {
    if (event.data === ${JSON.stringify(RELOAD_SAID)}) location.reload();
    else said.textContent = event.data;
  };
})();
</script>
`;
}

/** A stream the page listens on for a rebuild; refused past the bound rather than held. */
export function openPreviewEvents(listeners: PreviewListeners): Response {
    if (listeners.size >= LISTENERS_MAXIMUM) return new Response("too many", { status: 503 });
    let held: ReadableStreamDefaultController<Uint8Array> | null = null;
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            held = controller;
            listeners.add(controller);
            controller.enqueue(TEXT_ENCODER.encode(": open\n\n"));
        },
        cancel() {
            if (held !== null) listeners.delete(held);
        },
    });
    assert(listeners.size <= LISTENERS_MAXIMUM, "the listeners stay inside their bound");
    return new Response(body, {
        headers: { "content-type": "text/event-stream", "cache-control": "no-store" },
    });
}

/** One line to every page listening; a page gone since is dropped rather than written to. */
export function tellPreviewListeners(listeners: PreviewListeners, said: string): void {
    assert(said.length > 0, "a page is told something");
    assert(!said.includes("\n"), "on one line, which is what an event's data carries");
    const chunk = TEXT_ENCODER.encode(`data: ${said}\n\n`);
    for (const listener of [...listeners]) {
        const told = callForeign(() => listener.enqueue(chunk));
        if (!told.ok) listeners.delete(listener);
    }
    assert(listeners.size <= LISTENERS_MAXIMUM, "the listeners stay inside their bound");
}

async function servePreview(): Promise<void> {
    const built = await readPreviewScript();
    if (!("script" in built)) throw new UserscriptBuildError(built.failure);
    const state: PreviewState = {
        script: built.script,
        failure: null,
        fights: readRecordedFights(),
    };
    const listeners: PreviewListeners = new Set();
    Deno.serve({ hostname: PREVIEW_HOSTNAME, port: PREVIEW_PORT }, (request) => {
        const url = new URL(request.url);
        if (url.pathname === EVENTS_PATH) return openPreviewEvents(listeners);
        return answerPreviewRequest(url, state);
    });
    let pending: ReturnType<typeof setTimeout> | null = null;
    const rebuild = async () => {
        pending = null;
        const rebuilt = await readPreviewScript();
        if ("script" in rebuilt) {
            state.script = rebuilt.script;
            state.failure = null;
            console.log(`rebuilt, ${listeners.size} page(s) told to reload`);
            tellPreviewListeners(listeners, RELOAD_SAID);
        } else {
            state.failure = rebuilt.failure;
            console.log(`the tree does not build: ${rebuilt.failure}`);
            tellPreviewListeners(listeners, `build failed: ${rebuilt.failure}`);
        }
    };
    for await (const _event of Deno.watchFs(WATCHED_DIRECTORIES)) {
        if (pending !== null) clearTimeout(pending);
        pending = setTimeout(() => {
            rebuild().catch((failure) => console.error(failure));
        }, REBUILD_QUIET_MILLISECONDS);
    }
}

/** The bundle, or the bundler's first line where the tree does not build. */
async function readPreviewScript(): Promise<{ script: string } | { failure: string }> {
    try {
        const files = await readUserscriptFiles(readDevelopmentVersion());
        return { script: files.script };
    } catch (failure) {
        if (!(failure instanceof UserscriptBuildError)) throw failure;
        const first = failure.message.split("\n").find((line) => line.trim().length > 0);
        return { failure: first ?? failure.message };
    }
}

if (import.meta.main) {
    await servePreview();
}
