/**
 * The add-on stood up by its entry over a page of the test's own, through the page adapters a
 * browser meets: what a page must state, what it may leave out, and the one line a page it cannot
 * stand on gets. That a real browser stands it up is the end-to-end suite's to hold.
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import { FROZEN_AURA_TURNS } from "#/frozen/aura-turns.ts";
import { FROZEN_BLOWS_GRANTED } from "#/frozen/blows-granted.ts";
import { FROZEN_BUFF_BITS } from "#/frozen/buff-bits.ts";
import { STORE_KEY } from "#/src/game/browser-store.ts";
import { CLASS } from "#/src/ui/panel-look.ts";
import { ok } from "#/libs/result.ts";
import { STORAGE_CHOICE } from "#/src/ui/panel-choice.ts";
import {
    BOOT_FAILURE,
    composeRuntimeTables,
    readUserscriptWindow,
    startMargoMeter,
    WINDOW_PART,
    type WindowPart,
} from "#/src/userscript-entry.ts";
import { composeFakeDocument, type FakeElement, getElementsWithin } from "./fake-document.ts";
import { lookupRecordedFight } from "./recorded-fights.ts";

interface FakeWindow {
    page: Record<string, unknown>;
    /** Every console line, as the values it was written with. */
    lines: unknown[][];
    shown: FakeElement[];
    frames: (() => void)[];
    stored: Map<string, string>;
    session: Map<string, string>;
    /** Every anchor the page made, and what was done with it. */
    anchors: { download: string; href: string; className: string; calls: string[] }[];
    blobs: unknown[];
}

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
const BRANDED_STOOD_DOWN = `MargoMeter/Panel ${BOOT_FAILURE.windowUnusable}`;
/** The members a page lacking one part does not state, by the part the entry names. */
const MEMBERS_BY_PART: readonly (readonly [WindowPart, readonly string[]])[] = [
    [WINDOW_PART.document, ["document"]],
    [WINDOW_PART.timers, ["setInterval"]],
    [WINDOW_PART.timers, ["clearInterval"]],
    [WINDOW_PART.timers, ["setTimeout"]],
    [WINDOW_PART.frames, ["requestAnimationFrame"]],
    [WINDOW_PART.frames, ["cancelAnimationFrame"]],
    [WINDOW_PART.clock, ["Date"]],
    [WINDOW_PART.downloads, ["Blob"]],
    [WINDOW_PART.downloads, ["URL"]],
];
const FRAMES_MAXIMUM = 64;

Deno.test("a page stating what the add-on calls stands it up, and the panel goes up at a frame", () => {
    const window = composeFakeWindow();
    const runtime = startMargoMeter(window.page);
    assertExists(runtime, "the add-on stood up");
    assertEquals(window.shown, [], "nothing is drawn before the page gives a frame");
    flushFrames(window);
    assertStrictEquals(window.shown.length, 1, "one panel, put up at the first frame");
    assertEquals(window.lines, [], "and not a word of failure");
});

/** A page of the test's own, stating every member the entry reads and a game with a battle. */
function composeFakeWindow(): FakeWindow {
    const window: FakeWindow = {
        page: {},
        lines: [],
        shown: [],
        frames: [],
        stored: new Map(),
        session: new Map(),
        anchors: [],
        blobs: [],
    };
    const faked = composeFakeDocument();
    const createElement = faked.createElement.bind(faked);
    const document = Object.assign(faked, {
        createElement: (tag: string) => {
            if (tag !== "a") return createElement(tag);
            return composeFakeAnchor(window);
        },
        querySelectorAll: () => [{ src: "/js/main.min.53XkBRxF.js" }],
        body: { append: (node: FakeElement) => void window.shown.push(node) },
    });
    window.page = {
        document,
        console: { error: (...values: unknown[]) => void window.lines.push(values) },
        setInterval: () => 1,
        clearInterval: () => {},
        setTimeout: () => 1,
        requestAnimationFrame: (step: () => void) => window.frames.push(step),
        cancelAnimationFrame: () => void window.frames.splice(0, window.frames.length),
        Date,
        Blob: class {
            constructor(parts: unknown) {
                window.blobs.push(parts);
            }
        },
        URL: class {
            static createObjectURL = () => "blob:1";
            static revokeObjectURL = () => {};
        },
        localStorage: composeFakeStorage(window.stored),
        sessionStorage: composeFakeStorage(window.session),
        innerWidth: 1280,
        innerHeight: 900,
        location: { hostname: "tempest.margonem.pl" },
        navigator: { userAgent: "a browser that said so" },
        Engine: { battle: { updateData: () => 1 } },
    };
    return window;
}

function composeFakeAnchor(window: FakeWindow) {
    const anchor = { download: "", href: "", className: "", calls: [] as string[] };
    window.anchors.push(anchor);
    return Object.assign(anchor, {
        click: () => void anchor.calls.push("click"),
        remove: () => void anchor.calls.push("remove"),
    });
}

function composeFakeStorage(stored: Map<string, string>) {
    return {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => void stored.set(key, value),
        removeItem: (key: string) => void stored.delete(key),
    };
}

function flushFrames(window: FakeWindow): void {
    for (let fallen = 0; fallen < FRAMES_MAXIMUM; fallen += 1) {
        const step = window.frames.shift();
        if (step === undefined) return;
        step();
    }
    assert(false, "a frame asks for no second frame of its own");
}

Deno.test("a recording played through the page's own method reaches the panel and the store", () => {
    const window = composeFakeWindow();
    assertExists(startMargoMeter(window.page), "the add-on stood up");
    const engine = window.page.Engine as { battle: Record<string, unknown> };
    for (const payload of lookupRecordedFight(HILDUR).updates) {
        const updateData = engine.battle.updateData;
        assert(typeof updateData === "function", "the wrap stands where the method stood");
        Reflect.apply(updateData, engine.battle, [payload]);
        flushFrames(window);
    }
    const host = window.shown[0];
    assertExists(host, "a panel went up");
    const rows = getElementsWithin(host).filter((one) => one.className.startsWith(CLASS.row));
    assert(rows.length > 0, "and draws the fight");
    assert(window.stored.has(STORE_KEY.fights), "the fight that ended is kept in the page's store");
    assertEquals(window.lines, [], "with not a word of failure");
});

Deno.test("a page lacking a part the add-on calls stands it down, naming the part once", () => {
    for (const [part, members] of MEMBERS_BY_PART) {
        const window = composeFakeWindow();
        for (const member of members) delete window.page[member];
        assertStrictEquals(startMargoMeter(window.page), null, `${members}: no add-on`);
        assertEquals(window.lines, [[
            BRANDED_STOOD_DOWN,
            { kind: BOOT_FAILURE.windowUnusable, missing: part },
        ]], `${members}: one line, naming the ${part}`);
        assertEquals([window.frames, window.shown], [[], []], `${members}: and nothing drawn`);
    }
});

Deno.test("a page with no console stands the add-on down without a word, and throws nothing", () => {
    const window = composeFakeWindow();
    delete window.page.console;
    assertStrictEquals(startMargoMeter(window.page), null, "nothing stood up");
    assertEquals([window.frames, window.shown], [[], []], "and nothing was drawn");
    for (const page of [null, undefined, 42, "window", [], () => {}]) {
        assertStrictEquals(startMargoMeter(page), null, `${typeof page}: is no window`);
    }
});

Deno.test("a page that throws when a member is read stands the add-on down, with one line", () => {
    const window = composeFakeWindow();
    Object.defineProperty(window.page, "document", {
        get: () => {
            throw new TypeError("a page being torn down");
        },
    });
    assertStrictEquals(startMargoMeter(window.page), null, "nothing stood up");
    assertStrictEquals(window.lines.length, 1, "one line");
    assertStrictEquals(window.lines[0]?.[0], "MargoMeter/Panel foreign-threw", "saying it threw");
});

Deno.test("a store the browser forbids reading costs the store, and not the add-on", () => {
    const window = composeFakeWindow();
    Object.defineProperty(window.page, "localStorage", {
        get: () => {
            throw new DOMException("The operation is insecure.", "SecurityError");
        },
    });
    assertExists(startMargoMeter(window.page), "the add-on stood up");
    flushFrames(window);
    assertStrictEquals(window.shown.length, 1, "and its panel went up");
    delete window.page.localStorage;
    assertExists(startMargoMeter(window.page), "as it does on a page lending no store at all");
});

Deno.test("the tables the add-on runs on are the frozen readings, every one of them", () => {
    const tables = composeRuntimeTables();
    for (const skill of FROZEN_BLOWS_GRANTED.skills) {
        assertStrictEquals(
            tables.decoder.blowsGrantedBySkillId.get(skill.id),
            skill.blowsGrantedMinimum,
            `skill ${skill.id} grants what the table froze`,
        );
    }
    for (const skill of FROZEN_AURA_TURNS.skills) {
        const turns = tables.tooltip.statedSkills.turnsBySkillId.get(skill.id);
        assertStrictEquals(turns, skill.turns, `skill ${skill.id} runs what the table froze`);
    }
    for (const shout of FROZEN_AURA_TURNS.shouts) {
        const read = tables.tooltip.statedSkills.shoutsBySkillId.get(shout.id);
        assertExists(read, `shout ${shout.id} is read`);
    }
    assertStrictEquals(
        tables.tooltip.statusBits,
        FROZEN_BUFF_BITS.bits,
        "the mask is the client's",
    );
    for (const bit of tables.tooltip.witnessedKeyByBit.keys()) {
        assert(bit < FROZEN_BUFF_BITS.bits.length, `bit ${bit} is a position in the client's mask`);
    }
});

Deno.test("the shelf is kept where the reader chose: the page's store, the session's, or none", () => {
    const expected = [
        [STORAGE_CHOICE.local, true, false],
        [STORAGE_CHOICE.session, false, true],
        [STORAGE_CHOICE.memory, false, false],
    ] as const;
    for (const [choice, isLocal, isSession] of expected) {
        const window = composeFakeWindow();
        window.stored.set(STORE_KEY.storage, choice);
        assertExists(startMargoMeter(window.page), `${choice}: the add-on stood up`);
        playRecording(window, HILDUR);
        assertStrictEquals(window.stored.has(STORE_KEY.fights), isLocal, `${choice}: the page's`);
        assertStrictEquals(window.session.has(STORE_KEY.fights), isSession, `${choice}: session`);
    }
});

function playRecording(window: FakeWindow, path: string): void {
    const engine = window.page.Engine as { battle: Record<string, unknown> };
    for (const payload of lookupRecordedFight(path).updates) {
        const updateData = engine.battle.updateData;
        assert(typeof updateData === "function", "the wrap stands where the method stood");
        Reflect.apply(updateData, engine.battle, [payload]);
        flushFrames(window);
    }
}

Deno.test("the page's size is read whole or not at all, and nought is a size", () => {
    const sizes = [
        [1280, 900, { width: 1280, height: 900 }],
        [0, 0, { width: 0, height: 0 }],
        [-1, 900, null],
        [1280, -1, null],
        [Number.NaN, 900, null],
        [1280, undefined, null],
    ] as const;
    for (const [width, height, expected] of sizes) {
        const window = composeFakeWindow();
        Object.assign(window.page, { innerWidth: width, innerHeight: height });
        const read = readUserscriptWindow(window.page);
        assert(read.ok, "the page stands the add-on");
        assertEquals(read.value.readViewport(), expected, `${width} by ${height}`);
    }
});

Deno.test("the game's build is read off the page's own script, and nothing else is", () => {
    const window = composeFakeWindow();
    const read = readUserscriptWindow(window.page);
    assert(read.ok, "the page stands the add-on");
    assertEquals(read.value.build.readBuildId(), ok("53XkBRxF"), "the bundle's name states it");
    const document = window.page.document as Record<string, unknown>;
    document.querySelectorAll = () => [{ src: { toString: () => "/js/main.min.53XkBRxF.js" } }];
    assertStrictEquals(read.value.build.readBuildId().ok, false, "a source that is not text");
});

Deno.test("a file goes to the page's downloads through an anchor standing in its body", () => {
    const window = composeFakeWindow();
    const read = readUserscriptWindow(window.page);
    assert(read.ok, "the page stands the add-on");
    const written = read.value.file.writeFile("fight.json", "{}", () => {});
    assertEquals(written, ok(undefined), "the page took it");
    assertEquals(window.blobs, [["{}"]], "as one blob of the text");
    const anchor = window.anchors[0];
    assertExists(anchor, "through an anchor the page made");
    assertEquals([anchor.download, anchor.href], ["fight.json", "blob:1"], "named, at its address");
    assertEquals(anchor.calls, ["click", "remove"], "clicked, and taken off");
    assert(window.shown.some((one) => one === (anchor as unknown)), "standing in the body");
});
