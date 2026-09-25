/**
 * A browser's `window` of the tests' own, stating every member the entry reads, over maps a test
 * can look into. Every call the add-on makes into it can be refused first by a hook the test hands
 * in, which is how the simulator throws where a real page could.
 */

import { assert } from "@std/assert";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { composeFakeDocument, type FakeElement } from "./fake-document.ts";

/** The calls into the page a hook is asked about, by what they reach. */
export const PAGE_CALL = {
    storeRead: "store-read",
    storeWrite: "store-write",
    console: "console",
    frame: "frame",
    timer: "timer",
    mount: "mount",
    scripts: "scripts",
    downloads: "downloads",
    tooltip: "tooltip",
    dictionary: "dictionary",
} as const;
export type PageCall = VocabularyWord<typeof PAGE_CALL>;

export interface FakeWindow {
    page: Record<string, unknown>;
    /** Every console line, as the values it was written with. */
    lines: unknown[][];
    /** Every node the body took, in order. */
    shown: FakeElement[];
    /** Every node offered to the body, whether it took it or not. */
    offered: FakeElement[];
    frames: (() => void)[];
    stored: Map<string, string>;
    session: Map<string, string>;
    /** Every anchor the page made, and what was done with it. */
    anchors: { download: string; href: string; className: string; calls: string[] }[];
    blobs: unknown[];
}

export interface FakeWindowOptions {
    /** Members of the game's own, stated over the page: `Engine`, `_t`. */
    game?: Record<string, unknown>;
    /** Asked before each call reaches the page; a throw is the page's own. */
    onPageCall?: (call: PageCall) => void;
}

const FRAMES_MAXIMUM = 64;

/** A page of the test's own, stating every member the entry reads and a game with a battle. */
export function composeFakeWindow(options: FakeWindowOptions = {}): FakeWindow {
    const window: FakeWindow = {
        page: {},
        lines: [],
        shown: [],
        offered: [],
        frames: [],
        stored: new Map(),
        session: new Map(),
        anchors: [],
        blobs: [],
    };
    const call = (reached: PageCall): void => options.onPageCall?.(reached);
    window.page = {
        document: composeFakeWindowDocument(window, call),
        console: {
            error: (...values: unknown[]) => {
                call(PAGE_CALL.console);
                window.lines.push(values);
            },
        },
        ...composeFakeWindowClocks(window, call),
        Blob: class {
            constructor(parts: unknown) {
                call(PAGE_CALL.downloads);
                window.blobs.push(parts);
            }
        },
        URL: class {
            static createObjectURL = () => "blob:1";
            static revokeObjectURL = () => {};
        },
        localStorage: composeFakeWindowStorage(window.stored, call),
        sessionStorage: composeFakeWindowStorage(window.session, call),
        innerWidth: 1280,
        innerHeight: 900,
        location: { hostname: "tempest.margonem.pl" },
        navigator: { userAgent: "a browser that said so" },
        Engine: { battle: { updateData: () => 1 } },
        ...options.game,
    };
    return window;
}

function composeFakeWindowDocument(window: FakeWindow, call: (reached: PageCall) => void) {
    const faked = composeFakeDocument();
    const createElement = faked.createElement.bind(faked);
    return Object.assign(faked, {
        createElement: (tag: string) => {
            if (tag !== "a") return createElement(tag);
            return composeFakeWindowAnchor(window);
        },
        querySelectorAll: () => {
            call(PAGE_CALL.scripts);
            return [{ src: "/js/main.min.53XkBRxF.js" }];
        },
        body: {
            append: (node: FakeElement) => {
                window.offered.push(node);
                call(PAGE_CALL.mount);
                window.shown.push(node);
            },
        },
    });
}

function composeFakeWindowAnchor(window: FakeWindow) {
    const anchor = { download: "", href: "", className: "", calls: [] as string[] };
    window.anchors.push(anchor);
    return Object.assign(anchor, {
        click: () => void anchor.calls.push("click"),
        remove: () => void anchor.calls.push("remove"),
    });
}

/** The page's timers answer nothing on their own: a test falls a frame by `flushFakeFrames`. */
function composeFakeWindowClocks(window: FakeWindow, call: (reached: PageCall) => void) {
    return {
        setInterval: () => {
            call(PAGE_CALL.timer);
            return 1;
        },
        clearInterval: () => call(PAGE_CALL.timer),
        setTimeout: () => {
            call(PAGE_CALL.timer);
            return 1;
        },
        requestAnimationFrame: (step: () => void) => {
            call(PAGE_CALL.frame);
            return window.frames.push(step);
        },
        cancelAnimationFrame: () => void window.frames.splice(0, window.frames.length),
        Date,
    };
}

function composeFakeWindowStorage(stored: Map<string, string>, call: (reached: PageCall) => void) {
    return {
        getItem: (key: string) => {
            call(PAGE_CALL.storeRead);
            return stored.get(key) ?? null;
        },
        setItem: (key: string, value: string) => {
            call(PAGE_CALL.storeWrite);
            stored.set(key, value);
        },
        removeItem: (key: string) => {
            call(PAGE_CALL.storeWrite);
            stored.delete(key);
        },
    };
}

/** Every frame the page was asked for, fallen in order; a frame asks for no second of its own. */
export function flushFakeFrames(window: FakeWindow): void {
    for (let fallen = 0; fallen < FRAMES_MAXIMUM; fallen += 1) {
        const step = window.frames.shift();
        if (step === undefined) return;
        step();
    }
    assert(false, "a frame asks for no second frame of its own");
}
