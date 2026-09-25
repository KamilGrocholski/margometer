/**
 * The add-on standing up (`docs/design.md` §4, §10.1): the page's `window` read into the ports the
 * runtime is handed, the frozen readings composed into its tables, and the runtime started. It is
 * the first boundary of `AGENTS.md` E5, so it asserts nothing (A11) and all of it runs under one
 * `runGuarded`. A page it cannot stand on gets one console line and no panel.
 */

import { FROZEN_AURA_TURNS } from "#/frozen/aura-turns.ts";
import { FROZEN_BLOWS_GRANTED } from "#/frozen/blows-granted.ts";
import { FROZEN_BUFF_BITS } from "#/frozen/buff-bits.ts";
import {
    type BrokenInvariant,
    callForeign,
    err,
    type ForeignFailure,
    ok,
    type Result,
    runGuarded,
} from "#/libs/result.ts";
import { isRecord, type UnknownRecord } from "#/libs/unknown-value.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { indexAuraTurnsBySkillId, indexShoutsBySkillId } from "#/src/core/aura-standing.ts";
import { indexWitnessedKeyByBit } from "#/src/core/carried-figure.ts";
import { indexBlowsGrantedBySkillId } from "#/src/core/fight-decoder.ts";
import { SESSION_OPTIONS } from "#/src/core/fight-session.ts";
import {
    initMemoryStore,
    initPageStore,
    type KeyValueStore,
    type PageStorage,
} from "#/src/game/browser-store.ts";
import { initPageEngine } from "#/src/game/engine-battle.ts";
import { initPagePlace } from "#/src/game/engine-place.ts";
import { initPageTooltip } from "#/src/game/engine-tooltip.ts";
import { initPageBuild, SCRIPTS_MAXIMUM } from "#/src/game/game-build.ts";
import { initPageDictionary } from "#/src/game/game-dictionary.ts";
import { initPageClock, type PageDate } from "#/src/game/page-clock.ts";
import { initPageConsole, type PageConsole } from "#/src/game/page-console.ts";
import { type DownloadAnchor, initPageFile } from "#/src/game/page-file.ts";
import { initPageFrames, type PageFrames } from "#/src/game/page-frame.ts";
import { initPageInterval, type PageTimers } from "#/src/game/page-interval.ts";
import { initPageSurroundings } from "#/src/game/page-surroundings.ts";
import {
    initRuntime,
    type Runtime,
    type RuntimePorts,
    type RuntimeTables,
} from "#/src/runtime/margometer-runtime.ts";
import { STORAGE_CHOICE, type StorageChoice } from "#/src/ui/panel-choice.ts";
import type { PanelDocument, PanelElement } from "#/src/ui/panel-document.ts";
import type { PanelViewport } from "#/src/ui/panel-drag.ts";
import { BUILD_VERSION } from "./build-version.ts";

/** The part of a page the add-on could not find, named in our words (`AGENTS.md` N13). */
export const WINDOW_PART = {
    window: "window",
    document: "document",
    console: "console",
    timers: "timers",
    frames: "frames",
    clock: "clock",
    downloads: "downloads",
} as const;
export type WindowPart = VocabularyWord<typeof WINDOW_PART>;

export const BOOT_FAILURE = { windowUnusable: "window-unusable" } as const;
/** What stops the add-on before it stands: the page, or a broken invariant while it stood up. */
export type BootFailure =
    | { kind: typeof BOOT_FAILURE.windowUnusable; missing: WindowPart }
    | ForeignFailure
    | BrokenInvariant;

/**
 * The names a browser gives what this needs, and the whole of what it is asked for. That each is
 * there and callable is all `isUserscriptWindow` says: a signature is not `typeof`'s to give, and
 * a member of the wrong shape is answered for by the boundary that calls it (`develop ADR 0051`).
 */
export interface UserscriptWindow extends PageTimers, PageFrames {
    document: UserscriptDocument;
    console: PageConsole;
    Date: PageDate;
    URL: { createObjectURL(blob: unknown): string; revokeObjectURL(url: string): void };
    Blob: new (parts: readonly string[], options: { type: string }) => unknown;
    setTimeout(step: () => void, afterMilliseconds: number): number;
    /** Both optional: a private window or a third-party-storage rule is a page with neither. */
    localStorage?: PageStorage | undefined;
    sessionStorage?: PageStorage | undefined;
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
export function startMargoMeter(page: unknown): Runtime | null {
    const started = runGuarded(() => startMargoMeterOnPage(page));
    if (started.ok) return started.value;
    writeStoodDownLine(page, started.error);
    return null;
}

function startMargoMeterOnPage(page: unknown): Runtime | null {
    const read = callForeign(() => readUserscriptWindow(page));
    if (!read.ok) {
        writeStoodDownLine(page, read.error);
        return null;
    }
    if (!read.value.ok) {
        writeStoodDownLine(page, read.value.error);
        return null;
    }
    return initRuntime(read.value.value, {
        version: BUILD_VERSION,
        tables: composeRuntimeTables(),
        sessionOptions: SESSION_OPTIONS,
    });
}

/**
 * The one mark a page that will not stand the add-on gets. A page with no console of its own has
 * nowhere to carry it, and the add-on stands down silently there, because nothing is left to say.
 */
function writeStoodDownLine(page: unknown, failure: BootFailure): void {
    const console = callForeign(() => readPageConsole(page));
    if (!console.ok) return;
    if (console.value === null) return;
    initPageConsole(console.value).writeBrandedLine(failure.kind, failure);
}

function readPageConsole(page: unknown): PageConsole | null {
    if (!isRecord(page)) return null;
    const console = page.console;
    if (!isRecord(console)) return null;
    const error = console.error;
    if (typeof error !== "function") return null;
    return { error: (...values) => void error.apply(console, values) };
}

/**
 * The page as the ports the runtime is handed. Reading a member of a page is a call into it, since
 * a getter is the page's own code, so the caller holds this under `callForeign`.
 */
export function readUserscriptWindow(page: unknown): Result<RuntimePorts, BootFailure> {
    if (!isRecord(page)) return err(composeWindowUnusable(WINDOW_PART.window));
    if (!isUserscriptWindow(page)) {
        const missing = lookupWindowPartMissing(page) ?? WINDOW_PART.window;
        return err(composeWindowUnusable(missing));
    }
    return ok(composeRuntimePorts(page));
}

function composeWindowUnusable(missing: WindowPart): BootFailure {
    return { kind: BOOT_FAILURE.windowUnusable, missing };
}

function isUserscriptWindow(page: UnknownRecord): page is UnknownRecord & UserscriptWindow {
    return lookupWindowPartMissing(page) === null;
}

/** The first part a page lacks, or null where it states every one the add-on calls. */
function lookupWindowPartMissing(page: UnknownRecord): WindowPart | null {
    if (!isDocumentOfAPage(page.document)) return WINDOW_PART.document;
    if (!isCallableOn(page.console, "error")) return WINDOW_PART.console;
    if (typeof page.setInterval !== "function") return WINDOW_PART.timers;
    if (typeof page.clearInterval !== "function") return WINDOW_PART.timers;
    if (typeof page.setTimeout !== "function") return WINDOW_PART.timers;
    if (typeof page.requestAnimationFrame !== "function") return WINDOW_PART.frames;
    if (typeof page.cancelAnimationFrame !== "function") return WINDOW_PART.frames;
    if (typeof page.Date !== "function") return WINDOW_PART.clock;
    if (typeof page.Blob !== "function") return WINDOW_PART.downloads;
    if (typeof page.URL !== "function") return WINDOW_PART.downloads;
    return null;
}

function isDocumentOfAPage(value: unknown): boolean {
    if (!isRecord(value)) return false;
    if (typeof value.createElement !== "function") return false;
    if (typeof value.querySelectorAll !== "function") return false;
    return isCallableOn(value.body, "append");
}

/**
 * ⚠️ **A class is not a record.** `typeof` answers `function` of `URL`, `Blob` and `Date`, so
 * `isRecord` refuses all three: they are asked for by `typeof`, and their members not at all. A
 * missing `URL.createObjectURL` costs the file, which `initPageFile` answers for.
 */
function isCallableOn(held: unknown, name: string): boolean {
    if (!isRecord(held)) return false;
    return typeof held[name] === "function";
}

function composeRuntimePorts(page: UserscriptWindow): RuntimePorts {
    return {
        clock: initPageClock(page.Date),
        frames: initPageFrames(page),
        interval: initPageInterval(page),
        engine: initPageEngine(page),
        place: initPagePlace(page),
        dictionary: initPageDictionary(page),
        build: initPageBuild({ readScriptSources: () => readPageScriptSources(page) }),
        surroundings: initPageSurroundings(page),
        tooltip: initPageTooltip(page),
        settings: initPageStore(readPageStorage(page, STORAGE_CHOICE.local)),
        initShelfStore: (choice) => initShelfStoreOnPage(page, choice),
        file: initPageFile({
            createObjectURL: (blob) => page.URL.createObjectURL(blob),
            revokeObjectURL: (url) => page.URL.revokeObjectURL(url),
            createBlob: (text, type) => new page.Blob([text], { type }),
            createAnchor: () => page.document.createElement(ANCHOR_TAG),
            appendAnchor: (anchor) => page.document.body.append(anchor),
            setTimeout: (step, afterMilliseconds) => void page.setTimeout(step, afterMilliseconds),
        }),
        console: initPageConsole(page.console),
        document: page.document,
        mountPanel: (panel) => callForeign(() => page.document.body.append(panel)),
        readViewport: () => readPageViewport(page),
    };
}

/** Every script's source the page states, up to the bound the build's reader walks. */
function readPageScriptSources(page: UserscriptWindow): unknown[] {
    const scripts = page.document.querySelectorAll(SCRIPT_WITH_SOURCE);
    const walked = Math.min(scripts.length, SCRIPTS_MAXIMUM);
    const sources: unknown[] = [];
    for (let at = 0; at < walked; at += 1) sources.push(scripts[at]?.src);
    return sources;
}

/**
 * The store a browser lends under that name, or null. Reaching the property is itself a read that
 * can throw: a browser forbidding storage throws on the access, before there is a `getItem`.
 */
function readPageStorage(page: UserscriptWindow, choice: StorageChoice): PageStorage | null {
    const read = callForeign(() => {
        if (choice === STORAGE_CHOICE.session) return page.sessionStorage;
        return page.localStorage;
    });
    if (!read.ok) return null;
    return read.value ?? null;
}

/**
 * The store the reader asked for, or the one that forgets: a reader who chose to keep fights on a
 * browser that lends no store is better served by a panel that forgets between pages than by one
 * that keeps their fights somewhere they did not choose.
 */
function initShelfStoreOnPage(page: UserscriptWindow, choice: StorageChoice): KeyValueStore {
    if (choice === STORAGE_CHOICE.memory) return initMemoryStore();
    const storage = readPageStorage(page, choice);
    if (storage === null) return initMemoryStore();
    return initPageStore(storage);
}

/** A page stating one size and not the other states no viewport, as does one stating nonsense. */
function readPageViewport(page: UserscriptWindow): PanelViewport | null {
    const width = page.innerWidth;
    const height = page.innerHeight;
    if (typeof width !== "number") return null;
    if (typeof height !== "number") return null;
    if (!Number.isFinite(width)) return null;
    if (!Number.isFinite(height)) return null;
    if (width < 0) return null;
    if (height < 0) return null;
    return { width, height };
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
                turnsBySkillId: indexAuraTurnsBySkillId(FROZEN_AURA_TURNS.skills),
                shoutsBySkillId: indexShoutsBySkillId(FROZEN_AURA_TURNS.shouts),
            },
            witnessedKeyByBit: indexWitnessedKeyByBit(FROZEN_BUFF_BITS.bits),
            statusBits: FROZEN_BUFF_BITS.bits,
        },
    };
}
