/**
 * The add-on standing up (`docs/design.md` §4, §10.1): the page's `window` read into the ports the
 * runtime is handed, the frozen readings composed into its tables, and the runtime started. It is
 * the first boundary of `AGENTS.md` E5, so it asserts nothing (A11) and all of it runs under one
 * `errors.attempt`. A page it cannot stand on gets one console line and no panel.
 */

import { FROZEN_AURA_TURNS } from "#/frozen/aura-turns.ts";
import { FROZEN_BLOWS_GRANTED } from "#/frozen/blows-granted.ts";
import { FROZEN_BUFF_BITS } from "#/frozen/buff-bits.ts";
import * as errors from "#/libs/errors.ts";
import { isRecord, type UnknownRecord } from "#/libs/unknown-value.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { indexAuraTurnsBySkillId, indexShoutsBySkillId } from "#/src/core/aura-standing.ts";
import { indexKeyByStatusBit } from "#/src/core/carried-figure.ts";
import { indexBlowsGrantedBySkillId } from "#/src/core/fight-decoder.ts";
import { SESSION_OPTIONS } from "#/src/core/fight-session.ts";
import {
    type BrowserStorage,
    initBrowserStore,
    initMemoryStore,
} from "#/src/game/browser-store.ts";
import { initMargonemEngineBattle } from "#/src/game/margonem-engine-battle.ts";
import { initMargonemEngineHero } from "#/src/game/margonem-engine-hero.ts";
import { initMargonemEnginePlace } from "#/src/game/margonem-engine-place.ts";
import { initMargonemEngineTooltip } from "#/src/game/margonem-engine-tooltip.ts";
import { initMargonemClientBuild, SCRIPTS_MAXIMUM } from "#/src/game/margonem-client-build.ts";
import { initMargonemClientDictionary } from "#/src/game/margonem-client-dictionary.ts";
import {
    type BrowserDate,
    type BrowserFrames,
    type BrowserTimers,
    initBrowserClock,
    initBrowserFrames,
    initBrowserInterval,
} from "#/src/game/browser-time.ts";
import { type BrowserConsole, initBrowserConsole } from "#/src/game/browser-console.ts";
import { type DownloadAnchor, initBrowserFile } from "#/src/game/browser-file.ts";
import { initBrowserSurroundings } from "#/src/game/browser-surroundings.ts";
import {
    initRuntime,
    type Runtime,
    type RuntimePorts,
    type RuntimeTables,
} from "#/src/runtime/margometer-runtime.ts";
import { STORAGE_CHOICE, type StorageChoice } from "#/src/ui/panel-choice.ts";
import type { PanelDocument, PanelElement } from "#/src/ui/panel-document.ts";
import { BUILD_VERSION } from "./build-version.ts";

/** The part of a page the add-on could not find, named in our words (`AGENTS.md` N13). */
export const BROWSER_WINDOW_PART = {
    window: "window",
    document: "document",
    console: "console",
    timers: "timers",
    frames: "frames",
    clock: "clock",
    downloads: "downloads",
} as const;
export type WindowPart = VocabularyWord<typeof BROWSER_WINDOW_PART>;

export class BrowserWindowUnusable extends Error {
    override readonly name = "BrowserWindowUnusable";
    readonly missing: WindowPart;

    constructor(missing: WindowPart) {
        super();
        this.missing = missing;
    }
}

/** What stops the add-on before it stands: the page, or a throw while it stood up. */
export type BootFailure = BrowserWindowUnusable | errors.Caught;

/**
 * The names a browser gives what this needs, and the whole of what it is asked for. That each is
 * there and callable is all `isUserscriptWindow` says: a signature is not `typeof`'s to give, and
 * a member of the wrong shape is answered for by the boundary that calls it (`develop ADR 0051`).
 */
export interface BrowserWindow extends BrowserTimers, BrowserFrames {
    document: UserscriptDocument;
    console: BrowserConsole;
    Date: BrowserDate;
    URL: { createObjectURL(blob: unknown): string; revokeObjectURL(url: string): void };
    Blob: new (parts: readonly string[], options: { type: string }) => unknown;
    setTimeout(step: () => void, afterMilliseconds: number): number;
    /** Both optional: a private window or a third-party-storage rule is a page with neither. */
    localStorage?: BrowserStorage | undefined;
    sessionStorage?: BrowserStorage | undefined;
    innerWidth?: number | undefined;
    innerHeight?: number | undefined;
}

export interface UserscriptDocument extends PanelDocument {
    createElement(tag: string): PanelElement & DownloadAnchor;
    querySelectorAll(selector: string): ArrayLike<{ src?: unknown }>;
    body: { append(node: PanelElement | DownloadAnchor): void };
}

const SCRIPT_WITH_SOURCE = "script[src]";
const ANCHOR_TAG = "a";

/** Starts the add-on on the page, or leaves one console line where it cannot. Never throws. */
export function startMargoMeter(browserWindow: unknown): Runtime | null {
    // Read the page's window into ports, and start the runtime on them.
    const started = errors.attempt((): Runtime | null => {
        const ports = errors.attempt(() => readRuntimePorts(browserWindow));
        if (ports instanceof Error) {
            writeStoodDownLine(browserWindow, ports);
            return null;
        }
        return initRuntime(ports, {
            addOnVersion: BUILD_VERSION,
            tables: composeRuntimeTables(),
            sessionOptions: SESSION_OPTIONS,
        });
    });
    if (!(started instanceof Error)) return started;
    writeStoodDownLine(browserWindow, started);
    return null;
}

/**
 * The one mark a page that will not stand the add-on gets. A page with no console of its own has
 * nowhere to carry it, and the add-on stands down silently there, because nothing is left to say.
 */
function writeStoodDownLine(browserWindow: unknown, failure: BootFailure): void {
    // Read the page's own console, or null where it has none.
    const errorConsole = errors.attempt((): BrowserConsole | null => {
        if (!isRecord(browserWindow)) return null;
        const browserConsole = browserWindow.console;
        if (!isRecord(browserConsole)) return null;
        const error = browserConsole.error;
        if (typeof error !== "function") return null;
        return { error: (...values) => void error.apply(browserConsole, values) };
    });
    if (errorConsole instanceof Error) return;
    if (errorConsole === null) return;
    initBrowserConsole(errorConsole).writeBrandedLine(failure.name, failure);
}

/**
 * The page as the ports the runtime is handed. Reading a member of a page is a call into it, since
 * a getter is the page's own code, so the caller holds this under `errors.attempt`.
 */
export function readRuntimePorts(browserWindow: unknown): RuntimePorts | BrowserWindowUnusable {
    if (!isRecord(browserWindow)) return new BrowserWindowUnusable(BROWSER_WINDOW_PART.window);
    if (!isUserscriptWindow(browserWindow)) {
        return new BrowserWindowUnusable(
            lookupWindowPartMissing(browserWindow) ?? BROWSER_WINDOW_PART.window,
        );
    }
    return {
        clock: initBrowserClock(browserWindow.Date),
        frames: initBrowserFrames(browserWindow),
        interval: initBrowserInterval(browserWindow),
        battle: initMargonemEngineBattle(browserWindow),
        place: initMargonemEnginePlace(browserWindow),
        hero: initMargonemEngineHero(browserWindow),
        dictionary: initMargonemClientDictionary(browserWindow),
        build: initMargonemClientBuild({
            // Read every script's source the page states, up to the bound the build's reader walks.
            readScriptSources: () => {
                const scripts = browserWindow.document.querySelectorAll(SCRIPT_WITH_SOURCE);
                const walked = Math.min(scripts.length, SCRIPTS_MAXIMUM);
                const sources: unknown[] = [];
                for (let at = 0; at < walked; at += 1) sources.push(scripts[at]?.src);
                return sources;
            },
        }),
        surroundings: initBrowserSurroundings(browserWindow),
        tooltip: initMargonemEngineTooltip(browserWindow),
        settings: initBrowserStore(readBrowserStorage(browserWindow, STORAGE_CHOICE.local)),
        // The store the reader asked for, or the one that forgets: a reader who chose to keep
        // fights on a browser that lends no store is better served by a panel that forgets between
        // pages than by one that keeps their fights somewhere they did not choose.
        initShelfStore: (storageChoice) => {
            if (storageChoice === STORAGE_CHOICE.memory) return initMemoryStore();
            const storage = readBrowserStorage(browserWindow, storageChoice);
            if (storage === null) return initMemoryStore();
            return initBrowserStore(storage);
        },
        file: initBrowserFile({
            createObjectURL: (blob) => browserWindow.URL.createObjectURL(blob),
            revokeObjectURL: (url) => browserWindow.URL.revokeObjectURL(url),
            createBlob: (text, type) => new browserWindow.Blob([text], { type }),
            createAnchor: () => browserWindow.document.createElement(ANCHOR_TAG),
            appendAnchor: (anchor) => browserWindow.document.body.append(anchor),
            setTimeout: (step, afterMilliseconds) =>
                void browserWindow.setTimeout(step, afterMilliseconds),
        }),
        console: initBrowserConsole(browserWindow.console),
        document: browserWindow.document,
        mountPanel: (panel) => errors.attempt(() => browserWindow.document.body.append(panel)),
        // Read the viewport: a page stating one size and not the other states none, as does one
        // stating nonsense.
        readViewport: () => {
            const width = browserWindow.innerWidth;
            const height = browserWindow.innerHeight;
            if (typeof width !== "number") return null;
            if (typeof height !== "number") return null;
            if (!Number.isFinite(width)) return null;
            if (!Number.isFinite(height)) return null;
            if (width < 0) return null;
            if (height < 0) return null;
            return { width, height };
        },
    };
}

function isUserscriptWindow(
    browserWindow: UnknownRecord,
): browserWindow is UnknownRecord & BrowserWindow {
    return lookupWindowPartMissing(browserWindow) === null;
}

/** The first part a page lacks, or null where it states every one the add-on calls. */
function lookupWindowPartMissing(browserWindow: UnknownRecord): WindowPart | null {
    if (!isUserscriptDocument(browserWindow.document)) return BROWSER_WINDOW_PART.document;
    if (!isCallableOn(browserWindow.console, "error")) return BROWSER_WINDOW_PART.console;
    if (typeof browserWindow.setInterval !== "function") return BROWSER_WINDOW_PART.timers;
    if (typeof browserWindow.clearInterval !== "function") return BROWSER_WINDOW_PART.timers;
    if (typeof browserWindow.setTimeout !== "function") return BROWSER_WINDOW_PART.timers;
    if (typeof browserWindow.requestAnimationFrame !== "function") {
        return BROWSER_WINDOW_PART.frames;
    }
    if (typeof browserWindow.cancelAnimationFrame !== "function") return BROWSER_WINDOW_PART.frames;
    if (typeof browserWindow.Date !== "function") return BROWSER_WINDOW_PART.clock;
    if (typeof browserWindow.Blob !== "function") return BROWSER_WINDOW_PART.downloads;
    if (typeof browserWindow.URL !== "function") return BROWSER_WINDOW_PART.downloads;
    return null;
}

function isUserscriptDocument(value: unknown): boolean {
    if (!isRecord(value)) return false;
    if (typeof value.createElement !== "function") return false;
    if (typeof value.querySelectorAll !== "function") return false;
    return isCallableOn(value.body, "append");
}

/**
 * ⚠️ **A class is not a record.** `typeof` answers `function` of `URL`, `Blob` and `Date`, so
 * `isRecord` refuses all three: they are asked for by `typeof`, and their members not at all. A
 * missing `URL.createObjectURL` costs the file, which `initBrowserFile` answers for.
 */
function isCallableOn(owner: unknown, name: string): boolean {
    if (!isRecord(owner)) return false;
    return typeof owner[name] === "function";
}

/**
 * The store a browser lends under that name, or null. Reaching the property is itself a read that
 * can throw: a browser forbidding storage throws on the access, before there is a `getItem`.
 */
function readBrowserStorage(
    browserWindow: BrowserWindow,
    storageChoice: StorageChoice,
): BrowserStorage | null {
    const storage = errors.attempt(() => {
        if (storageChoice === STORAGE_CHOICE.session) return browserWindow.sessionStorage;
        return browserWindow.localStorage;
    });
    if (storage instanceof Error) return null;
    return storage ?? null;
}

/**
 * The frozen readings in the shape the runtime reads. Composed here, under the start's guard, and
 * never while the bundle loads: the indexers assert over the tables, and a module's own initialiser
 * runs before any boundary this add-on has.
 */
export function composeRuntimeTables(): RuntimeTables {
    return {
        decoder: {
            blowsGrantedBySkillId: indexBlowsGrantedBySkillId(FROZEN_BLOWS_GRANTED.skills),
        },
        tooltip: {
            statedSkills: {
                auraTurnsBySkillId: indexAuraTurnsBySkillId(FROZEN_AURA_TURNS.skills),
                shoutsBySkillId: indexShoutsBySkillId(FROZEN_AURA_TURNS.shouts),
            },
            keyByStatusBit: indexKeyByStatusBit(FROZEN_BUFF_BITS.bits),
            statusBits: FROZEN_BUFF_BITS.bits,
        },
    };
}
