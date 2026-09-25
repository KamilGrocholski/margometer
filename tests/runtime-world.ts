/**
 * The add-on stood up over a page of a test's own, the way a browser stands it up: every port the
 * runtime is handed, over maps a test can look into, and a frame that falls when the test says so.
 * The engine, the place, the dictionary and the tooltip are the page adapters themselves, over the
 * page handed in, so a recording played through the wrap reaches every layer the game's would.
 */

import { assert, assertExists } from "@std/assert";
import { ok, type Result } from "#/libs/result.ts";
import { SESSION_OPTIONS } from "#/src/core/fight-session.ts";
import { initPageStore, type KeyValueStore } from "#/src/game/browser-store.ts";
import { initPageEngine } from "#/src/game/engine-battle.ts";
import { initPagePlace } from "#/src/game/engine-place.ts";
import { initPageTooltip } from "#/src/game/engine-tooltip.ts";
import { initPageDictionary } from "#/src/game/game-dictionary.ts";
import {
    initRuntime,
    type Runtime,
    type RuntimePorts,
    type RuntimeTables,
} from "#/src/runtime/margometer-runtime.ts";
import { type KeptFight, openShelf } from "#/src/runtime/shelf.ts";
import { composeRuntimeTables } from "#/src/userscript-entry.ts";
import type { PanelElement } from "#/src/ui/panel-document.ts";
import { composeFakeDocument, type FakeElement, pressElement } from "./fake-document.ts";
import { TEST_VERSION } from "./panel-view.ts";

export interface RuntimeWorld {
    runtime: Runtime;
    ports: RuntimePorts;
    /** Every panel put on the page, in the order it went up. */
    shown: FakeElement[];
    /** Every branded console line, by the kind it was written under. */
    lines: string[];
    /** The store the panel's own choices are kept in. */
    held: Map<string, string>;
    getShelf(choice: string): Map<string, string>;
    saved: { name: string; text: string }[];
    /** One call through the wrap the game's method wears, and the frame after it. */
    update(payload: unknown): unknown;
    press(target: FakeElement, type?: string): void;
    flush(): void;
    getHost(): FakeElement;
}

export const RUNTIME_TABLES: RuntimeTables = composeRuntimeTables();

/** The moment every file a test is handed was taken at. */
export const CAPTURED_AT = "2026-08-29T10:00:00.000Z";
export const WORLD = "tempest";
export const GAME_BUILD = "53XkBRxF";

/** A store over a map somebody else holds, so a test can look in the place it wrote to. */
export function initHeldStore(held: Map<string, string>): KeyValueStore {
    return initPageStore({
        getItem: (key) => held.get(key) ?? null,
        setItem: (key, value) => void held.set(key, value),
        removeItem: (key) => void held.delete(key),
    });
}

/** A browser out of room: it reads, and refuses every write. */
export function initRefusingStore(): KeyValueStore {
    return initPageStore({
        getItem: () => null,
        setItem: () => {
            throw new RangeError("a browser out of room");
        },
        removeItem: () => {},
    });
}

export function readKeptFights(held: Map<string, string>): readonly KeptFight[] {
    const opened = openShelf(initHeldStore(held));
    assert(opened.ok, "a shelf the add-on wrote reads back");
    return opened.value.fights;
}

/** Stood up and handed its first frame, which is what a browser gives it next. */
export function initRuntimeWorld(
    page: Record<string, unknown>,
    overrides: (world: RuntimeWorld, base: RuntimePorts) => Partial<RuntimePorts> = () => ({}),
    tables: RuntimeTables = RUNTIME_TABLES,
): RuntimeWorld {
    const frames: (() => void)[] = [];
    const shelves = new Map<string, Map<string, string>>();
    const getShelf = (choice: string): Map<string, string> => {
        const standing = shelves.get(choice) ?? new Map<string, string>();
        shelves.set(choice, standing);
        return standing;
    };
    const world = composeRuntimeWorld(page, frames, getShelf);
    const base = world.ports;
    world.ports = { ...base, ...overrides(world, base) };
    world.runtime = initRuntime(world.ports, {
        version: TEST_VERSION,
        tables,
        sessionOptions: SESSION_OPTIONS,
    });
    world.flush();
    return world;
}

function composeRuntimeWorld(
    page: Record<string, unknown>,
    frames: (() => void)[],
    getShelf: (choice: string) => Map<string, string>,
): RuntimeWorld {
    const world: RuntimeWorld = {
        runtime: { onIntent: () => {}, deinit: () => ok(undefined) },
        shown: [],
        lines: [],
        held: new Map(),
        getShelf,
        saved: [],
        ports: {} as RuntimePorts,
        update: (payload) => {
            const battle = readTestBattle(page);
            const updateData = battle.updateData;
            assert(typeof updateData === "function", "the wrap stands where the method stood");
            const answered = Reflect.apply(updateData, battle, [payload]);
            world.flush();
            return answered;
        },
        press: (target, type = "pointerdown") => {
            pressElement(world.getHost(), type, target);
            world.flush();
        },
        flush: () => {
            for (let fallen = 0; fallen < 64; fallen += 1) {
                const step = frames.shift();
                if (step === undefined) return;
                step();
            }
            assert(false, "a frame asks for no second frame of its own");
        },
        getHost: () => {
            const host = world.shown[0];
            assertExists(host, "a panel went up");
            return host;
        },
    };
    world.ports = composeRuntimePorts(world, page, frames);
    return world;
}

function readTestBattle(page: Record<string, unknown>): Record<string, unknown> {
    const engine = page.Engine as Record<string, unknown> | undefined;
    assertExists(engine, "the page holds a game");
    const battle = engine.battle as Record<string, unknown> | undefined;
    assertExists(battle, "and the game a battle");
    return battle;
}

/** Every port over the page and the world's own maps, which is what a test looks into. */
function composeRuntimePorts(
    world: RuntimeWorld,
    page: Record<string, unknown>,
    frames: (() => void)[],
): RuntimePorts {
    // Past any moment a test writes onto a shelf, so no fight a test plays is kept under one.
    let ticks = 1_000_000;
    return {
        clock: {
            readNowMilliseconds: () => {
                ticks += 1;
                return ticks;
            },
            // A clock that answers the same moment every time, so a row's time is a fact of a test.
            readMoment: () => ({ day: 13, month: 9, hour: 21, minute: 5 }),
            readTimestampText: () => ok(CAPTURED_AT),
        },
        frames: {
            requestFrame: (step) => {
                frames.push(step);
                return ok({ cancel: () => void frames.splice(0, frames.length) });
            },
        },
        interval: { every: () => ok({ cancel: () => ok(undefined) }) },
        engine: initPageEngine(page),
        place: initPagePlace(page),
        dictionary: initPageDictionary(page),
        build: { readBuildId: () => ok(GAME_BUILD) },
        surroundings: { readWorld: () => WORLD, readUserAgent: () => "a browser that said so" },
        tooltip: initPageTooltip(page),
        settings: initHeldStore(world.held),
        initShelfStore: (choice) => initHeldStore(world.getShelf(choice)),
        file: {
            writeFile: (name, text) => {
                world.saved.push({ name, text });
                return ok(undefined);
            },
        },
        console: { writeBrandedLine: (kind) => void world.lines.push(kind) },
        document: composeFakeDocument(),
        mountPanel: (panel: PanelElement): Result<void, never> => {
            world.shown.push(panel as FakeElement);
            return ok(undefined);
        },
        readViewport: () => ({ width: 1280, height: 900 }),
    };
}
