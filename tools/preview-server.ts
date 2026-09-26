/**
 * The panel in a browser over a recording, rebuilt and reloaded while you edit it: `deno task
 * check` cannot see a panel, and the gate can be green while the thing a player looks at is broken.
 * It serves `tools/preview-page.ts` over the landing fight with a picker for the rest, carries the
 * entry, the screen and the store through a reload (`tools/preview-state.ts`), and says a failed
 * build where the panel is. Nothing here ships, and `SECURITY.md`'s rule against the network binds
 * `src/`, not this. `--from` opens a recording at any path beside the rest, and `--fabricated`
 * every fight `tools/fabricated-fight.ts` wrote.
 *
 *     deno task preview [--port N] [--fight NAME] [--from PATH]… [--fabricated]
 *     deno task preview:fabricated
 */

import { assert, assertStrictEquals } from "@std/assert";
import { parseJson } from "#/libs/json-text.ts";
import { clamp } from "#/libs/number-range.ts";
import { parseInteger } from "#/libs/number-text.ts";
import * as errors from "#/libs/errors.ts";
import { GAME_SCRIPT_NAME } from "#/tests/e2e/game-page.ts";
import {
    lookupRecordedFight,
    readRecordedFight,
    readRecordedFights,
    type RecordedFight,
} from "#/tests/recorded-fights.ts";
import {
    readDevelopmentVersion,
    readUserscriptFiles,
    USERSCRIPT_NAME,
} from "./build-userscript.ts";
import { FABRICATED_DIRECTORY } from "./fabricated-fight.ts";
import { PreviewServeError, UserscriptBuildError } from "./margometer-tool-error.ts";
import { composePreviewPage, type PreviewFightLink, type PreviewWords } from "./preview-page.ts";
import { LANDING_RECORDING } from "./preview-site.ts";
import { formatRecordingName } from "./recorded-material.ts";

/** A fight the server offers, under the name the picker and the address carry. */
export interface ServedFight {
    name: string;
    calls: readonly unknown[];
}

export interface PreviewServerOptions {
    port?: number;
    /** Off in a test, so no watcher outlives it. */
    shouldWatch?: boolean;
    /** Injected in a test, so holding the routes costs no bundler run. */
    readBundle?: () => Promise<string>;
    /** What the page runs after its own driver. Null turns reloading off. */
    appendedScript?: string | null;
    /** Fights opened at a path, beside the recordings; a name the recordings carry is refused. */
    fromPaths?: readonly string[];
}

export interface PreviewServer {
    url: string;
    port: number;
    stop(): Promise<void>;
}

/** A reload stream still open, and the way to say something into it. */
export interface ReloadListener {
    send(event: string, data: string): void;
    close(): void;
}

/** Everything one running server holds, so no helper below closes over a variable of its own. */
export interface PreviewState {
    fights: readonly ServedFight[];
    listeners: Set<ReloadListener>;
    /** The last bundle that built, so a failed rebuild costs nothing on screen. */
    script: string | null;
    readBundle(): Promise<string>;
    appendedScript: string | null;
}

const PREVIEW_HOSTNAME = "127.0.0.1";
const DEFAULT_PORT = 4173;
/** A preview is watched by the pages one person has open; this is far past that (S11). */
export const LISTENERS_MAXIMUM = 64;
/** What a build reads. `tools/` is not here: this process imported it, so a rebuild cannot. */
const WATCHED_DIRECTORIES = ["src", "libs", "frozen"];
/** Collapses the pair of events one save fires, and a format-on-save touching several files. */
const REBUILD_QUIET_MILLISECONDS = 60;
/** So a proxy between the browser and this process cannot close an idle stream on its own. */
const KEEP_ALIVE_EVERY_MILLISECONDS = 15000;
const FAILURE_LINE = "MargoMeterTool/Preview";
const FLAG_PORT = "--port";
const FLAG_FIGHT = "--fight";
const FLAG_FROM = "--from";
const FLAG_FABRICATED = "--fabricated";
const RECORDING_SUFFIX = ".json";
/** Past every shape a person makes to look at one (S11). */
const FROM_PATHS_MAXIMUM = 64;
const TEXT_ENCODER = new TextEncoder();
const HTML_TYPE = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" };
const SCRIPT_TYPE = {
    "content-type": "text/javascript; charset=utf-8",
    "cache-control": "no-store",
};

/** English, where the published page draws Polish over the same page: nobody plays through this. */
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
    playing: "playing",
    tooltips: "tooltips",
};

/**
 * The half of the driver only a server can answer, so a published page never says `build ok` about
 * a build nobody ran. A rebuild that fails does not reload — the page would go blank mid-keystroke
 * — and says so with the whole log; one that succeeds reloads onto the address the page composed.
 */
export const RELOAD_SCRIPT = `var buildLabel = getPreviewElement("preview-build");
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
// An address differing only in its fragment is a navigation inside the document, which reloads
// nothing: the second rebuild of a page already at its own address would never arrive.
reloads.addEventListener("rebuilt", function handleRebuilt() {
  var name = shownFight === null ? PREVIEW.fightName : shownFight.name;
  var next = "/?fight=" + encodeURIComponent(name) + composePreviewStateHash();
  var here = window.location.pathname + window.location.search + window.location.hash;
  if (next === here) window.location.reload();
  else window.location.href = next;
});
reloads.addEventListener("failed", function handleFailed(event) {
  renderBuild("build failed", false);
  renderBuildLog(event.data);
});`;

/** Serves the panel and reloads it, and hands back the way to stop both. */
export function initPreviewServer(options: PreviewServerOptions = {}): PreviewServer {
    const state: PreviewState = {
        fights: composeServedFights(options.fromPaths ?? []),
        listeners: new Set<ReloadListener>(),
        script: null,
        readBundle: options.readBundle ?? readPreviewBundle,
        appendedScript: options.appendedScript === undefined
            ? RELOAD_SCRIPT
            : options.appendedScript,
    };
    const server = Deno.serve(
        { hostname: PREVIEW_HOSTNAME, port: options.port ?? DEFAULT_PORT, onListen: () => {} },
        (request) => answerPreviewRequest(state, new URL(request.url)),
    );
    const watcher = (options.shouldWatch ?? true) ? Deno.watchFs(WATCHED_DIRECTORIES) : null;
    // The drain answers a promise nobody awaits, so its rejection needs a reader (E11).
    if (watcher !== null) {
        readFileEvents(watcher, state).then(() => {}, (failure: unknown) => {
            console.error(FAILURE_LINE, failure);
        });
    }
    const keepAlive = watcher === null ? null : setInterval(
        () => tellPreviewListeners(state.listeners, "ping", ""),
        KEEP_ALIVE_EVERY_MILLISECONDS,
    );
    const port = server.addr.port;
    assert(port > 0, "a server that started is one a browser can be pointed at");
    return {
        url: `http://${PREVIEW_HOSTNAME}:${port}`,
        port,
        stop: async () => {
            watcher?.close();
            if (keepAlive !== null) clearInterval(keepAlive);
            for (const listener of state.listeners) errors.attempt(() => listener.close());
            state.listeners.clear();
            await server.shutdown();
        },
    };
}

/** The recordings, and whatever `--from` named after them. */
function composeServedFights(fromPaths: readonly string[]): ServedFight[] {
    assert(fromPaths.length <= FROM_PATHS_MAXIMUM, "a preview opens no more than the bound");
    const fights = readRecordedFights().map(composeServedFight);
    for (const path of fromPaths) {
        const opened = composeServedFight(readFromPath(path));
        if (fights.some((fight) => fight.name === opened.name)) {
            throw new PreviewServeError(`${opened.name} is a name the recordings already carry`);
        }
        fights.push(opened);
    }
    assert(fights.length > 0, "a server draws at least one fight");
    return fights;
}

function composeServedFight(fight: RecordedFight): ServedFight {
    assert(fight.updates.length > 0, "a fight served has something to play");
    return { name: formatRecordingName(fight.path), calls: fight.updates };
}

function readFromPath(path: string): RecordedFight {
    const parsed = parseJson(Deno.readTextFileSync(path));
    if (parsed instanceof Error) {
        throw new PreviewServeError(`${path} is not a recording: ${parsed.name}`, {
            cause: parsed,
        });
    }
    return readRecordedFight(path, parsed);
}

function readPreviewBundle(): Promise<string> {
    return readUserscriptFiles(readDevelopmentVersion()).then((files) => files.script);
}

/** Drains the watcher until it is closed, which is what `stop` does to end this. */
async function readFileEvents(watcher: Deno.FsWatcher, state: PreviewState): Promise<void> {
    let pending: ReturnType<typeof setTimeout> | null = null;
    for await (const event of watcher) {
        if (event.kind === "access") continue;
        if (pending !== null) clearTimeout(pending);
        pending = setTimeout(() => {
            pending = null;
            readRebuilt(state).then(() => {}, (failure: unknown) => {
                console.error(FAILURE_LINE, failure);
            });
        }, REBUILD_QUIET_MILLISECONDS);
    }
    if (pending !== null) clearTimeout(pending);
}

async function readRebuilt(state: PreviewState): Promise<void> {
    try {
        state.script = await state.readBundle();
        console.log(`rebuilt, ${state.listeners.size} page(s) told to reload`);
        tellPreviewListeners(state.listeners, "rebuilt", "ok");
    } catch (failure) {
        if (!(failure instanceof UserscriptBuildError)) throw failure;
        console.log(`the tree does not build: ${failure.message.split("\n")[0]}`);
        tellPreviewListeners(state.listeners, "failed", failure.message);
    }
}

/** Every request; the event stream holds its connection open and is the server's own. */
export function answerPreviewRequest(
    state: PreviewState,
    url: URL,
): Promise<Response> | Response {
    assert(url.pathname.startsWith("/"), "a request names a path");
    if (url.pathname === "/reload") return openPreviewEvents(state.listeners);
    if (url.pathname === `/${USERSCRIPT_NAME}`) return answerScript(state);
    if (url.pathname === "/calls") return answerCalls(state, url);
    if (url.pathname === "/") return answerPage(state, url);
    // An empty script and never a miss: only the tag's `src` is ever read, for the build id.
    if (url.pathname === `/${GAME_SCRIPT_NAME}`) return new Response("", { headers: SCRIPT_TYPE });
    return new Response("not here", { status: 404 });
}

/** The bundle, built on first asking; a tree that does not build answers 500 and the log. */
async function answerScript(state: PreviewState): Promise<Response> {
    try {
        if (state.script === null) state.script = await state.readBundle();
        return new Response(state.script, { headers: SCRIPT_TYPE });
    } catch (failure) {
        if (!(failure instanceof UserscriptBuildError)) throw failure;
        return new Response(failure.message, { status: 500 });
    }
}

/** A name is required, where the page route reads a missing one as the fight to open on. */
function answerCalls(state: PreviewState, url: URL): Response {
    const asked = url.searchParams.get("fight");
    const fight = asked === null ? null : lookupServedFight(state.fights, asked);
    if (fight === null) return new Response("no such recording", { status: 404 });
    return new Response(JSON.stringify(fight.calls), {
        headers: { "content-type": "application/json; charset=utf-8" },
    });
}

/** The landing fight where the address names none. */
function lookupServedFight(
    fights: readonly ServedFight[],
    name: string | null,
): ServedFight | null {
    const wanted = name ?? formatRecordingName(lookupRecordedFight(LANDING_RECORDING).path);
    return fights.find((fight) => fight.name === wanted) ?? null;
}

/**
 * The finished fight where nothing says otherwise, as the published page opens: the empty panel is
 * worth reaching and `to start` reaches it, but it is not what somebody starting this came to see.
 */
function answerPage(state: PreviewState, url: URL): Response {
    const fight = lookupServedFight(state.fights, url.searchParams.get("fight"));
    if (fight === null) return new Response("no such recording", { status: 404 });
    const stated = url.searchParams.get("entry");
    const asked = stated === null ? fight.calls.length : parseInteger(stated);
    if (asked === null) return new Response("entry is not a number", { status: 400 });
    const entryIndex = clamp(asked, 0, fight.calls.length);
    const page = composePreviewPage({
        fightName: fight.name,
        entryIndex,
        calls: fight.calls,
        fights: composeFightLinks(state.fights),
        scriptDirectory: "/",
        words: PREVIEW_WORDS,
        introduction: null,
        doesAddressCarryState: true,
        doesStartFromEmpty: true,
        install: null,
        appendedScript: state.appendedScript,
    });
    return new Response(page, { headers: HTML_TYPE });
}

/** Every fight offered once; having a process is why each can be fetched rather than navigated to. */
function composeFightLinks(fights: readonly ServedFight[]): PreviewFightLink[] {
    const links = fights.map((fight) => ({
        name: fight.name,
        address: `/?fight=${encodeURIComponent(fight.name)}`,
        callsAddress: `/calls?fight=${encodeURIComponent(fight.name)}`,
    }));
    assertStrictEquals(links.length, fights.length, "every fight is offered once");
    return links;
}

/** A stream the page listens on for a rebuild; refused past the bound rather than held. */
export function openPreviewEvents(listeners: Set<ReloadListener>): Response {
    if (listeners.size >= LISTENERS_MAXIMUM) return new Response("too many", { status: 503 });
    let held: ReloadListener | null = null;
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            held = {
                // One `data:` line per line: a bare newline ends the event, and a log is many.
                send: (event, data) => {
                    const lines = data.split("\n").map((line) => `data: ${line}`).join("\n");
                    controller.enqueue(TEXT_ENCODER.encode(`event: ${event}\n${lines}\n\n`));
                },
                close: () => controller.close(),
            };
            listeners.add(held);
            controller.enqueue(TEXT_ENCODER.encode("retry: 500\n\n"));
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

/** One event to every page listening; a page gone since is dropped rather than written to. */
export function tellPreviewListeners(
    listeners: Set<ReloadListener>,
    event: string,
    data: string,
): void {
    assert(event.length > 0, "a page is told something");
    for (const listener of [...listeners]) {
        const told = errors.attempt(() => listener.send(event, data));
        if (told instanceof Error) listeners.delete(listener);
    }
    assert(listeners.size <= LISTENERS_MAXIMUM, "the listeners stay inside their bound");
}

/**
 * The flags, walked: `--port N`, `--fight NAME`, `--from PATH` as often as it is given, and
 * `--fabricated`, the one taking no value.
 */
export function readPreviewFlags(args: readonly string[]): {
    port: number;
    fight: string | null;
    fromPaths: string[];
    shouldOpenFabricated: boolean;
} {
    let port = DEFAULT_PORT;
    let fight: string | null = null;
    let shouldOpenFabricated = false;
    const fromPaths: string[] = [];
    for (let at = 0; at < args.length; at += 1) {
        if (args[at] === FLAG_FABRICATED) {
            shouldOpenFabricated = true;
            continue;
        }
        const value = args[at + 1];
        if (value === undefined) throw new PreviewServeError(`${args[at]} takes a value`);
        if (args[at] === FLAG_PORT) port = parseInteger(value) ?? DEFAULT_PORT;
        else if (args[at] === FLAG_FIGHT) fight = value;
        else if (args[at] === FLAG_FROM) fromPaths.push(value);
        else throw new PreviewServeError(`${args[at]} is not a flag this reads`);
        at += 1;
    }
    assert(fromPaths.length <= args.length, "no more paths than were given");
    return { port, fight, fromPaths, shouldOpenFabricated };
}

/**
 * Every fight a directory of fabricated ones holds, which is what `--fabricated` opens beside the
 * recordings. ⚠️ **The directory is ignored by version control**, so it is absent on every machine
 * that has not made one. That is not an empty answer to fall through on: a preview asked for these
 * and handed the recordings alone would look like it had them, so the refusal is loud and names
 * what writes one.
 */
export function readFabricatedPaths(directory: string): string[] {
    assert(directory.length > 0, "fabricated fights are read from somewhere");
    const listed = errors.attempt(() => [...Deno.readDirSync(directory)]);
    if (listed instanceof Error) {
        const isAbsent = listed.cause instanceof Deno.errors.NotFound;
        const reason = isAbsent ? "is not here" : "cannot be read";
        throw new PreviewServeError(
            `${directory}/ ${reason}: \`deno task fight:fabricate\` writes one`,
            { cause: listed },
        );
    }
    const paths = listed
        .filter((entry) => entry.isFile)
        .filter((entry) => entry.name.endsWith(RECORDING_SUFFIX))
        .map((entry) => `${directory}/${entry.name}`)
        .sort();
    if (paths.length === 0) {
        throw new PreviewServeError(
            `${directory}/ holds no fight: \`deno task fight:fabricate\` writes one`,
        );
    }
    if (paths.length > FROM_PATHS_MAXIMUM) {
        throw new PreviewServeError(`${directory}/ holds more fights than ${FROM_PATHS_MAXIMUM}`);
    }
    return paths;
}

if (import.meta.main) {
    const flags = readPreviewFlags(Deno.args);
    const fromPaths = flags.shouldOpenFabricated
        ? [...flags.fromPaths, ...readFabricatedPaths(FABRICATED_DIRECTORY)]
        : flags.fromPaths;
    const preview = initPreviewServer({ port: flags.port, fromPaths });
    const opening = flags.fight === null
        ? preview.url
        : `${preview.url}/?fight=${encodeURIComponent(flags.fight)}`;
    console.log(`preview  ${opening}`);
    console.log(`watching ${WATCHED_DIRECTORIES.join(", ")}: a change there rebuilds and reloads`);
    console.log("a change in tools/ does not, because this process already imported it: restart");
    for (const signal of ["SIGINT", "SIGTERM"] as const) {
        Deno.addSignalListener(signal, () => {
            preview.stop().then(() => Deno.exit(0), (failure: unknown) => {
                console.error(FAILURE_LINE, failure);
                Deno.exit(1);
            });
        });
    }
}
