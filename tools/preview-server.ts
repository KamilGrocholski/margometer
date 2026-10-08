/**
 * The panel in a browser over a recording, rebuilt and reloaded while you edit it: `deno task
 * check` cannot see a panel, and the gate can be green while the thing a player looks at is broken.
 * It serves `tools/preview-page.ts` over the landing fight with a picker for the rest, carries the
 * entry, the screen and the store through a reload (`tools/preview-state.ts`), and says a failed
 * build where the panel is. Nothing here ships, and `SECURITY.md`'s rule against the network binds
 * `src/`, not this. `--from` opens a recording at any path beside the rest, and `--fabricated`
 * every fight `tools/fabricated-fight.ts` wrote. The same build installs as `MargoMeter Dev` from
 * the address it prints, and polls that address, port included, for the next.
 *
 *     deno task preview [--port N] [--fight NAME] [--from PATH]… [--fabricated]
 *     deno task preview:fabricated
 */

import { assert, assertStrictEquals } from "@std/assert";
import { debounce } from "@std/async/debounce";
import { parseArgs } from "@std/cli";
import { clampNumber } from "#/libs/number-range.ts";
import { parseInteger } from "#/libs/number-text.ts";
import * as errors from "#/libs/errors.ts";
import { MARGONEM_CLIENT_SCRIPT_NAME } from "#/tests/e2e/margonem-page.ts";
import {
    lookupRecordedFight,
    readRecordedFights,
    type RecordedFight,
} from "#/tests/recorded-fights.ts";
import {
    BUNDLE_ENTRY,
    formatDatedDevelopmentVersion,
    readDevelopmentVersion,
    readUserscriptFiles,
    USERSCRIPT_NAME,
    type UserscriptEdition,
    type UserscriptFiles,
} from "./build-userscript.ts";
import { FABRICATED_DIRECTORY } from "./fabricated-fight.ts";
import { PreviewServeError, UserscriptBuildError } from "./margometer-tool-error.ts";
import { composePreviewPage, type PreviewFightLink, type PreviewWords } from "./preview-page.ts";
import { LANDING_RECORDING } from "./preview-site.ts";
import { formatRecordingName, readRecordingFile, RECORDING_SUFFIX } from "./recorded-material.ts";

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
    readBundle?: (edition: Readonly<UserscriptEdition>) => Promise<UserscriptFiles>;
    /** What the page runs after its own driver. Null turns reloading off. */
    appendedScript?: string | null;
    /** Fights opened at a path, beside the recordings; a name the recordings carry is refused. */
    fromPaths?: readonly string[];
    /** Off where the build is not one to install: no button, and the install routes are a miss. */
    shouldOfferInstall?: boolean;
}

export interface PreviewServer {
    url: string;
    port: number;
    /** The name of every fight it serves, which is what `--fight` may ask for. */
    fightNames: readonly string[];
    stop(): Promise<void>;
}

/** A reload stream still open, and the way to say something into it. */
export interface ReloadListener {
    send(event: string, text: string): void;
    close(): void;
}

/** Everything one running server holds, so no helper below closes over a variable of its own. */
export interface PreviewState {
    fights: readonly ServedFight[];
    listeners: Set<ReloadListener>;
    /** The last bundle that built, so a failed rebuild costs nothing on screen. */
    files: UserscriptFiles | null;
    /** Addressed at the port listened on, which is known once the server stands. */
    edition: UserscriptEdition | null;
    readBundle(edition: Readonly<UserscriptEdition>): Promise<UserscriptFiles>;
    appendedScript: string | null;
    isInstallOffered: boolean;
}

const PREVIEW_HOSTNAME = "127.0.0.1";
const DEVELOPMENT_USERSCRIPT_NAME = "margometer-dev.user.js";
const DEVELOPMENT_METADATA_NAME = "margometer-dev.meta.js";
const PORT_DEFAULT = 4173;
/** A preview is watched by the pages one person has open; this is far past that (S11). */
export const LISTENERS_MAXIMUM = 64;
/**
 * Everything the bundle entry reaches, and the lock its imports resolve by: what a rebuild reads.
 * `tools/` is not here: this process imported it, so a rebuild cannot.
 */
export const BUNDLE_SOURCE_PATHS = ["src", "libs", "frozen", "deno.json", "deno.lock"];
/** Collapses the pair of events one save fires, and a format-on-save touching several files. */
const REBUILD_QUIET_MILLISECONDS = 60;
/** So a proxy between the browser and this process cannot close an idle stream on its own. */
const KEEP_ALIVE_EVERY_MILLISECONDS = 15000;
const FAILURE_LINE = "MargoMeterTool/Preview";
const FLAG_PORT = "port";
const FLAG_FIGHT = "fight";
const FLAG_FROM = "from";
const FLAG_FABRICATED = "fabricated";
/** Past every shape a person makes to look at one (S11). */
export const FROM_PATHS_MAXIMUM = 64;
/** The last port TCP numbers; nought asks the system for any free one. */
export const PORT_MAXIMUM = 65_535;
const TEXT_ENCODER = new TextEncoder();
const HTML_TYPE = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" };
const PAGE_FILE_PATHS = [`/${USERSCRIPT_NAME}`];
const SERVED_FILE_PATHS = [
    ...PAGE_FILE_PATHS,
    `/${DEVELOPMENT_USERSCRIPT_NAME}`,
    `/${DEVELOPMENT_METADATA_NAME}`,
];
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
        files: null,
        edition: null,
        readBundle: options.readBundle ?? readPreviewBundle,
        appendedScript: options.appendedScript === undefined
            ? RELOAD_SCRIPT
            : options.appendedScript,
        isInstallOffered: options.shouldOfferInstall ?? true,
    };
    const server = Deno.serve(
        { hostname: PREVIEW_HOSTNAME, port: options.port ?? PORT_DEFAULT, onListen: () => {} },
        (request) => answerPreviewRequest(state, new URL(request.url)),
    );
    const watcher = (options.shouldWatch ?? true) ? Deno.watchFs(BUNDLE_SOURCE_PATHS) : null;
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
    const url = `http://${PREVIEW_HOSTNAME}:${port}`;
    state.edition = {
        name: "MargoMeter Dev",
        scriptAddress: `${url}/${DEVELOPMENT_USERSCRIPT_NAME}`,
        metadataAddress: `${url}/${DEVELOPMENT_METADATA_NAME}`,
    };
    return {
        url,
        port,
        fightNames: state.fights.map((fight) => fight.name),
        stop: async () => {
            watcher?.close();
            if (keepAlive !== null) clearInterval(keepAlive);
            // A stream the page already closed has nothing left to be told.
            for (const listener of state.listeners) void errors.attempt(() => listener.close());
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
        const opened = composeServedFight(readRecordingFile(path));
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

/**
 * Asynchronous throughout, so a version that cannot be read rejects rather than throws. Dated at
 * the build, so a manager polling between two rebuilds is offered nothing.
 */
async function readPreviewBundle(edition: Readonly<UserscriptEdition>): Promise<UserscriptFiles> {
    const version = formatDatedDevelopmentVersion(readDevelopmentVersion(), new Date());
    return await readUserscriptFiles(version, BUNDLE_ENTRY, ".", edition);
}

/** Drains the watcher until it is closed, which is what `stop` does to end this. */
async function readFileEvents(watcher: Deno.FsWatcher, state: PreviewState): Promise<void> {
    // Read the bundle rebuilt once the events go quiet, and tell every page listening how it went.
    const rebuild = debounce(() => {
        readServedFiles(state).then((files) => {
            state.files = files;
            console.log(`rebuilt, ${state.listeners.size} page(s) told to reload`);
            tellPreviewListeners(state.listeners, "rebuilt", "ok");
        }, (failure: unknown) => {
            if (!(failure instanceof UserscriptBuildError)) throw failure;
            console.log(`the tree does not build: ${failure.message.split("\n")[0]}`);
            tellPreviewListeners(state.listeners, "failed", failure.message);
        }).then(() => {}, (failure: unknown) => {
            console.error(FAILURE_LINE, failure);
        });
    }, REBUILD_QUIET_MILLISECONDS);
    for await (const event of watcher) {
        if (event.kind === "access") continue;
        rebuild();
    }
    rebuild.clear();
}

/** The bundle at the edition this server installs, which stands before any request arrives. */
function readServedFiles(state: PreviewState): Promise<UserscriptFiles> {
    assert(state.edition !== null, "a server is asked for its bundle only once it listens");
    return state.readBundle(state.edition);
}

/** Every request; the event stream holds its connection open and is the server's own. */
async function answerPreviewRequest(state: PreviewState, url: URL): Promise<Response> {
    assert(url.pathname.startsWith("/"), "a request names a path");
    if (url.pathname === "/reload") return answerPreviewEvents(state.listeners);
    // A server offering no install serves the page its bundle alone, and the install is a miss.
    const servedPaths = state.isInstallOffered ? SERVED_FILE_PATHS : PAGE_FILE_PATHS;
    if (servedPaths.includes(url.pathname)) {
        // Answer the bundle or its banner, built on first asking: a tree that does not build
        // answers 500. The page and an install are handed one build.
        try {
            if (state.files === null) state.files = await readServedFiles(state);
            const isBanner = url.pathname === `/${DEVELOPMENT_METADATA_NAME}`;
            const text = isBanner ? state.files.metadata : state.files.script;
            return new Response(text, { headers: SCRIPT_TYPE });
        } catch (failure) {
            if (!(failure instanceof UserscriptBuildError)) throw failure;
            return new Response(failure.message, { status: 500 });
        }
    }
    if (url.pathname === "/calls") {
        // Answer a fight's calls: a name is required, where the page route reads none as landing.
        const asked = url.searchParams.get("fight");
        const fight = asked === null ? null : lookupServedFight(state.fights, asked);
        if (fight === null) return new Response("no such recording", { status: 404 });
        return new Response(JSON.stringify(fight.calls), {
            headers: { "content-type": "application/json; charset=utf-8" },
        });
    }
    if (url.pathname === "/") {
        // Answer the page, over the finished fight where nothing says otherwise.
        // As the published page opens: the empty panel is worth reaching and `to start` reaches
        // it, but it is not what somebody starting this came to see.
        const fight = lookupServedFight(state.fights, url.searchParams.get("fight"));
        if (fight === null) return new Response("no such recording", { status: 404 });
        const stated = url.searchParams.get("entry");
        const asked = stated === null ? fight.calls.length : parseInteger(stated);
        if (asked === null) return new Response("entry is not a number", { status: 400 });
        const entryIndex = clampNumber(asked, 0, fight.calls.length);
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
            developmentInstall: state.isInstallOffered
                ? { label: "install MargoMeter Dev", address: `/${DEVELOPMENT_USERSCRIPT_NAME}` }
                : null,
            appendedScript: state.appendedScript,
        });
        return new Response(page, { headers: HTML_TYPE });
    }
    // An empty script and never a miss: only the tag's `src` is ever read, for the build id.
    if (url.pathname === `/${MARGONEM_CLIENT_SCRIPT_NAME}`) {
        return new Response("", { headers: SCRIPT_TYPE });
    }
    return new Response("not here", { status: 404 });
}

/** The landing fight where the address names none. */
function lookupServedFight(
    fights: readonly ServedFight[],
    name: string | null,
): ServedFight | null {
    const wanted = name ?? formatRecordingName(lookupRecordedFight(LANDING_RECORDING).path);
    return fights.find((fight) => fight.name === wanted) ?? null;
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
export function answerPreviewEvents(listeners: Set<ReloadListener>): Response {
    if (listeners.size >= LISTENERS_MAXIMUM) return new Response("too many", { status: 503 });
    let held: ReloadListener | null = null;
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            held = {
                // One `data:` line per line: a bare newline ends the event, and a log is many.
                send: (event, text) => {
                    const lines = text.split("\n").map((line) => `data: ${line}`).join("\n");
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
    text: string,
): void {
    assert(event.length > 0, "a page is told something");
    for (const listener of [...listeners]) {
        const told = errors.attempt(() => listener.send(event, text));
        if (told instanceof Error) listeners.delete(listener);
    }
    assert(listeners.size <= LISTENERS_MAXIMUM, "the listeners stay inside their bound");
}

/**
 * The flags: `--port N`, `--fight NAME`, `--from PATH` as often as it is given, and `--fabricated`,
 * the one taking no value.
 */
export function readPreviewFlags(args: readonly string[]): {
    port: number;
    fight: string | null;
    fromPaths: string[];
    shouldOpenFabricated: boolean;
} {
    const parsed = parseArgs([...args], {
        string: [FLAG_PORT, FLAG_FIGHT, FLAG_FROM],
        boolean: [FLAG_FABRICATED],
        collect: [FLAG_FROM],
        unknown: (argument, flag) => {
            // A flag misspelt would be kept as a key nobody reads, and the preview would open on
            // what it was not asked for.
            if (flag === undefined) return true;
            throw new PreviewServeError(`${argument} is not a flag this reads`);
        },
    });
    if (parsed._.length > 0) {
        throw new PreviewServeError(`${parsed._.join(" ")} is not a flag this reads`);
    }
    let port = PORT_DEFAULT;
    if (parsed.port !== undefined) {
        const asked = parseInteger(parsed.port);
        if (asked === null) throw new PreviewServeError(`--${FLAG_PORT} ${parsed.port} is no port`);
        if (!isPortInRange(asked)) {
            throw new PreviewServeError(
                `--${FLAG_PORT} ${parsed.port} is outside 0 to ${PORT_MAXIMUM}`,
            );
        }
        port = asked;
    }
    if (parsed.from.length > FROM_PATHS_MAXIMUM) {
        throw new PreviewServeError(`no more than ${FROM_PATHS_MAXIMUM} --${FLAG_FROM} at once`);
    }
    return {
        port,
        fight: parsed.fight ?? null,
        fromPaths: parsed.from,
        shouldOpenFabricated: parsed.fabricated,
    };
}

/** Whether a number is one a server can listen on. */
export function isPortInRange(port: number): boolean {
    assert(Number.isSafeInteger(port), "a port is asked about as a whole number");
    if (port < 0) return false;
    return port <= PORT_MAXIMUM;
}

/**
 * The paths a preview opens: those `--from` named and the fabricated fights after them, refused
 * together past the bound, since each list may stand inside it on its own.
 */
export function composeOpenedPaths(
    fromPaths: readonly string[],
    fabricatedPaths: readonly string[],
): string[] {
    const opened = [...fromPaths, ...fabricatedPaths];
    if (opened.length > FROM_PATHS_MAXIMUM) {
        throw new PreviewServeError(
            `more than ${FROM_PATHS_MAXIMUM} fights opened beside the rest`,
        );
    }
    assertStrictEquals(opened.length, fromPaths.length + fabricatedPaths.length, "every path once");
    return opened;
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
        .filter((directoryEntry) => directoryEntry.isFile)
        .filter((directoryEntry) => directoryEntry.name.endsWith(RECORDING_SUFFIX))
        .map((directoryEntry) => `${directory}/${directoryEntry.name}`)
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
    const fromPaths = composeOpenedPaths(
        flags.fromPaths,
        flags.shouldOpenFabricated ? readFabricatedPaths(FABRICATED_DIRECTORY) : [],
    );
    const preview = initPreviewServer({ port: flags.port, fromPaths });
    if (flags.fight !== null) {
        if (!preview.fightNames.includes(flags.fight)) {
            await preview.stop();
            throw new PreviewServeError(`--fight ${flags.fight} names no fight this serves`);
        }
    }
    const opening = flags.fight === null
        ? preview.url
        : `${preview.url}/?fight=${encodeURIComponent(flags.fight)}`;
    console.log(`preview  ${opening}`);
    console.log(`install  ${preview.url}/${DEVELOPMENT_USERSCRIPT_NAME}  as MargoMeter Dev`);
    console.log(`watching ${BUNDLE_SOURCE_PATHS.join(", ")}: a change there rebuilds and reloads`);
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
