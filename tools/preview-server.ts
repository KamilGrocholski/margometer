/**
 * The panel, in a browser, changing while you edit it.
 *
 * `deno task check` cannot see a panel: the gate can be green while the thing a player looks at
 * is broken. This serves the built add-on over a recording, watches what a build reads, and
 * reloads the page at the entry the reader was on. Nothing here ships — `SECURITY.md`'s promise
 * not to talk to the network binds `src/`, and this is `tools/`. The page itself is
 * `tools/preview-page.ts`, which `tools/preview-site.ts` writes down instead of serving.
 */

import { getValueWithin } from "@/libs/number-range.ts";
import { assert } from "@std/assert";
import { debounce } from "@std/async";
import { parseArgs } from "@std/cli";

/** A preview is watched by the pages one person has open; this is far past that — **S11**. */
const MAXIMUM_LISTENERS = 64;
import { getDevelopmentVersion } from "@/tools/declared-version.ts";
import { getIntegerFromText } from "@/libs/number-text.ts";
import { composeUserscriptFiles, USERSCRIPT_NAME } from "@/tools/build-userscript.ts";
import { UserscriptBuildError } from "@/tools/margometer-tool-error.ts";
import {
    composePreviewPage,
    type PreviewFightLink,
    type PreviewWords,
} from "@/tools/preview-page.ts";
import {
    getPreviewRecordedFight,
    getRecordedFights,
    type RecordedFight,
} from "@/tools/recorded-fights.ts";

const DEFAULT_PORT = 4173;
/** Collapses the pair of events one save fires, and a format-on-save touching several files. */
const REBUILD_AFTER_QUIET_MS = 60;
/** So a proxy between the browser and this process cannot close an idle stream on its own. */
const KEEP_ALIVE_EVERY_MS = 15000;
/**
 * `tools/` is deliberately absent: this process has already imported it, so a rebuild could not
 * pick a change up and watching it would promise a reload carrying nothing new.
 */
const WATCHED_PATHS = ["src"];

/**
 * English, where `tools/preview-site.ts` draws Polish over the same page: **L2** is about the
 * text a player reads, and nobody plays the game through a development server.
 */
const PREVIEW_WORDS: PreviewWords = {
    language: "en",
    title: "MargoMeter preview",
    placeName: "Preview",
    start: "to start",
    backHint: "Replays the fight up to the previous entry",
    end: "to end",
    play: "play",
    pause: "pause",
    entry: "entry",
};

/**
 * The half of the driver only a server can answer. The build label lives here rather than in the
 * page: a published page saying `build ok` in green asserts something about a build nobody ran.
 * A rebuild that **fails** must not reload — the page would go blank over a syntax error
 * mid-keystroke, and the panel you were looking at is the thing you were looking at.
 *
 * A rebuild that succeeds reloads carrying the address the harness composed, so the panel comes
 * back where it stood, folded as it stood, on the screen it was on (`tools/preview-state.ts`).
 */
const RELOAD_SCRIPT = `var buildLabel = getPreviewElement("preview-build");
var buildLog = getPreviewElement("preview-log");

var renderBuild = function (text, isGood) {
  buildLabel.textContent = text;
  buildLabel.className = "preview-build " + (isGood ? "preview-ok" : "preview-bad");
};

var renderBuildLog = function (text) {
  buildLog.textContent = text;
  buildLog.setAttribute("data-shown", text === "" ? "no" : "yes");
};

renderBuild("build ok", true);

var reloads = new EventSource("/reload");
reloads.addEventListener("rebuilt", function handleRebuilt() {
  var name = shownFight === null ? PREVIEW.fightName : shownFight.name;
  window.location.href = "/?fight=" + encodeURIComponent(name) + composePreviewStateHash();
});
reloads.addEventListener("failed", function handleFailed(event) {
  renderBuild("build failed", false);
  renderBuildLog(event.data);
});`;

export interface PreviewServerOptions {
    port?: number | undefined;
    /** Off in a test, so no watcher outlives it. On everywhere else. */
    shouldWatch?: boolean | undefined;
    /** Injected in a test, so holding the routes costs no bundler run. */
    readBundle?: (() => Promise<string>) | undefined;
    /** What the page runs after its own driver. Null turns reloading off. */
    appendedScript?: string | null | undefined;
}

export interface PreviewServer {
    url: string;
    port: number;
    stop(): Promise<void>;
}

/** The bundle as the browser gets it, built where nothing else is looking for a file. */
function readBuiltUserscript(): Promise<string> {
    const version = getDevelopmentVersion();
    assert(version.length > 0, "a preview states the version it was built at");
    assert(USERSCRIPT_NAME.length > 0, "and serves it under the name a page asks for");
    return composeUserscriptFiles(version).then((files) => files.script);
}

/** A reload stream still open, and the way to say something into it. */
interface ReloadListener {
    send(event: string, data: string): void;
    close(): void;
}

/** Everything one running server holds, so no helper below closes over a variable of its own. */
interface PreviewState {
    fights: RecordedFight[];
    listeners: Set<ReloadListener>;
    /** The last bundle that built, so a failed rebuild costs nothing on screen. */
    script: string | null;
    readBundle(): Promise<string>;
    appendedScript: string | null;
}

/** No entry stated, which is the whole fight: an address is shorter than the state it opens on. */
function composeFightAddress(name: string): string {
    assert(name.length > 0, "a fight is addressed by name");
    return `/?fight=${encodeURIComponent(name)}`;
}

/**
 * Where a recording's calls are, with no page in front of them. Having a process is the whole of
 * why only this caller offers one: picking a fight is then a replay and not a navigation.
 */
function composeCallsAddress(name: string): string {
    assert(name.length > 0, "and its calls are asked for by the same name");
    return `/calls?fight=${encodeURIComponent(name)}`;
}

function getFightByName(
    fights: readonly RecordedFight[],
    name: string | null,
): RecordedFight | null {
    assert(fights.length > 0, "a server with no recording never started");
    assert(name === null || name.length > 0, "and a fight is asked for by a name or not at all");
    if (name === null) return getPreviewRecordedFight(fights);
    return fights.find((fight) => fight.name === name) ?? null;
}

function composeFightLinks(fights: readonly RecordedFight[]): PreviewFightLink[] {
    assert(fights.length > 0, "there is something to offer");
    const links = fights.map((fight) => ({
        name: fight.name,
        address: composeFightAddress(fight.name),
        callsAddress: composeCallsAddress(fight.name),
    }));
    assert(links.length === fights.length, "every recording is offered once");
    return links;
}

/**
 * Says one thing to every page still listening, and forgets the ones that are not. Writing to a
 * stream whose reader has gone throws a bare `TypeError`, and a closed tab between a save and the
 * rebuild it triggered is ordinary rather than a fault — so the listener is dropped, which is the
 * outcome the write was asking about (**E5**, the outbound boundary).
 */
function setListenersTold(listeners: Set<ReloadListener>, event: string, data: string): void {
    assert(event.length > 0, "something is being said");
    assert(listeners.size <= MAXIMUM_LISTENERS, "to no more of them than the server holds");
    for (const listener of [...listeners]) {
        try {
            listener.send(event, data);
        } catch {
            listeners.delete(listener);
        }
    }
}

function composeReloadResponse(listeners: Set<ReloadListener>): Response {
    let listener: ReloadListener | null = null;
    const stream = new ReadableStream<string>({
        start(controller) {
            listener = {
                // One `data:` line per line of the payload: a bare newline inside one ends the
                // event, and a build log is many lines.
                send: (event, data) => {
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
    assert(listeners.size <= MAXIMUM_LISTENERS, "a set told about a stream stays inside its bound");
    return new Response(stream.pipeThrough(new TextEncoderStream()), {
        headers: { "content-type": "text/event-stream", "cache-control": "no-cache" },
    });
}

async function composeScriptResponse(state: PreviewState): Promise<Response> {
    assert(USERSCRIPT_NAME.endsWith(".js"), "what a browser is handed is a script");
    try {
        if (state.script === null) state.script = await state.readBundle();
        return new Response(state.script, {
            headers: { "content-type": "text/javascript; charset=utf-8" },
        });
    } catch (failure) {
        // Narrowly (**E4**): a bundle that refuses is the expected failure and the browser is
        // told. Anything else is a bug in this tool and must not be dressed up as one.
        if (!(failure instanceof UserscriptBuildError)) throw failure;
        // 500 and the log, rather than a page whose panel merely never appears.
        return new Response(failure.message, { status: 500 });
    }
}

function composePageResponse(state: PreviewState, address: URL): Response {
    const fight = getFightByName(state.fights, address.searchParams.get("fight"));
    if (fight === null) return new Response("no such recording", { status: 404 });
    const stated = address.searchParams.get("entry");
    // The finished fight where nothing says otherwise, as the published pages open
    // (`tools/preview-site.ts`): the empty panel is a state worth reaching and `to start` reaches
    // it, but it is not the one somebody starting this server came to look at.
    const asked = stated === null ? fight.calls.length : getIntegerFromText(stated);
    if (asked === null) return new Response("entry is not a number", { status: 400 });
    const entryIndex = getValueWithin(asked, 0, fight.calls.length);
    assert(entryIndex >= 0, "a replay stops at or after the first call");
    assert(entryIndex <= fight.calls.length, "and at or before the last");
    return new Response(
        composePreviewPage({
            fightName: fight.name,
            entryIndex,
            calls: fight.calls,
            fights: composeFightLinks(state.fights),
            // Everything is answered from the root here, which is the one thing a published
            // copy of this page cannot say (`tools/preview-site.ts`).
            scriptDirectory: "/",
            words: PREVIEW_WORDS,
            // Nothing to introduce: whoever opened this started the server.
            introduction: null,
            appendedScript: state.appendedScript,
        }),
        { headers: { "content-type": "text/html; charset=utf-8" } },
    );
}

/** A name is required where the page route reads a missing one as *the fight to open on*. */
function composeCallsResponse(state: PreviewState, address: URL): Response {
    const asked = address.searchParams.get("fight");
    const fight = asked === null ? null : getFightByName(state.fights, asked);
    if (fight === null) return new Response("no such recording", { status: 404 });
    assert(fight.calls.length > 0, "a recording that is handed over has something to play");
    return new Response(JSON.stringify(fight.calls), {
        headers: { "content-type": "application/json; charset=utf-8" },
    });
}

function setRebuilt(state: PreviewState): void {
    assert(state.listeners.size <= MAXIMUM_LISTENERS, "a rebuild is announced inside that bound");
    void state.readBundle().then(
        (script) => {
            assert(script.length > 0, "a build that succeeded produced something");
            state.script = script;
            setListenersTold(state.listeners, "rebuilt", "ok");
        },
        (failure: unknown) => {
            // Narrowly (**E4**): the bundler refusing is the failure this exists for, and it is
            // shown in the browser. Anything else is a bug here and is left to be loud (**E7**).
            if (!(failure instanceof UserscriptBuildError)) throw failure;
            setListenersTold(state.listeners, "failed", failure.message);
        },
    );
}

/** Drains the watcher until it is closed, which is what `stop` below does to end this. */
async function readFileEvents(watcher: Deno.FsWatcher, state: PreviewState): Promise<void> {
    assert(WATCHED_PATHS.length > 0, "there is something to watch");
    const rebuild = debounce(() => setRebuilt(state), REBUILD_AFTER_QUIET_MS);
    for await (const event of watcher) {
        if (event.kind === "access") continue;
        rebuild();
    }
    rebuild.clear();
    assert(rebuild.pending === false, "a watcher that closed leaves no rebuild pending");
}

function getPortFromServer(server: Deno.HttpServer<Deno.NetAddr>): number {
    const port = server.addr.port;
    assert(Number.isSafeInteger(port), "a TCP server states the port it listened on");
    assert(port > 0, "and it is a port something can be asked for on");
    return port;
}

function handleRequest(state: PreviewState, request: Request): Promise<Response> | Response {
    const address = new URL(request.url);
    assert(address.pathname.startsWith("/"), "a request names a path");
    assert(state.fights.length > 0, "and there is material to answer it with");
    if (address.pathname === "/reload") return composeReloadResponse(state.listeners);
    if (address.pathname === `/${USERSCRIPT_NAME}`) return composeScriptResponse(state);
    if (address.pathname === "/calls") return composeCallsResponse(state, address);
    if (address.pathname === "/") return composePageResponse(state, address);
    // Everything else, the decoy build script included: only its `src` attribute is ever read,
    // so its 404 here is expected and costs a console line nobody has to act on.
    return new Response("not here", { status: 404 });
}

/**
 * Serves the panel and reloads it, and hands back the way to stop both. Named `set…` for the
 * reason `setEngineAttachment` is: it puts something in place and returns the undo.
 */
export function setPreviewServer(options: PreviewServerOptions = {}): PreviewServer {
    const state: PreviewState = {
        fights: getRecordedFights(),
        listeners: new Set<ReloadListener>(),
        script: null,
        readBundle: options.readBundle ?? readBuiltUserscript,
        appendedScript: options.appendedScript === undefined
            ? RELOAD_SCRIPT
            : options.appendedScript,
    };
    assert(state.fights.length > 0, "a server draws at least one recording");
    const server = Deno.serve(
        { port: options.port ?? DEFAULT_PORT, onListen: () => {} },
        (request) => handleRequest(state, request),
    );
    const watcher = (options.shouldWatch ?? true)
        ? Deno.watchFs(WATCHED_PATHS, { recursive: true })
        : null;
    if (watcher !== null) void readFileEvents(watcher, state);
    const keepAlive = watcher === null
        ? null
        : setInterval(() => setListenersTold(state.listeners, "ping", ""), KEEP_ALIVE_EVERY_MS);
    const port = getPortFromServer(server);
    assert(port > 0, "a server that started is one a browser can be pointed at");
    return {
        url: `http://localhost:${port}`,
        port,
        stop: async () => {
            watcher?.close();
            if (keepAlive !== null) clearInterval(keepAlive);
            for (const listener of state.listeners) {
                try {
                    listener.close();
                } catch {
                    // Already gone, which is the outcome this was asking for.
                }
            }
            state.listeners.clear();
            await server.shutdown();
        },
    };
}

if (import.meta.main) {
    const parsed = parseArgs(Deno.args, { string: ["port", "fight"] });
    const asked = parsed.port === undefined ? null : getIntegerFromText(parsed.port);
    const fight = parsed.fight ?? null;
    const preview = setPreviewServer({ port: asked ?? DEFAULT_PORT });
    const opening = fight === null ? preview.url : `${preview.url}${composeFightAddress(fight)}`;
    console.log(`preview  ${opening}`);
    console.log(`watching ${WATCHED_PATHS.join(", ")} — a change there rebuilds and reloads`);
    console.log("a change in tools/ does not, because this process already imported it: restart");
    for (const signal of ["SIGINT", "SIGTERM"] as const) {
        Deno.addSignalListener(signal, () => {
            void preview.stop().then(() => Deno.exit(0));
        });
    }
}
