/**
 * Where the layers meet (`docs/design.md` §8, §10): the settings and the shelf are opened, the
 * engine is looked for and wrapped, each call is read into the live fight, each intent changes
 * state at once, and drawing waits for one frame. Everything it touches is a port handed in, so a
 * userscript's contact with its browser is stated in the entry and this is testable without one.
 */

import { assert } from "@std/assert/assert";
import { type ForeignFailure, ok, type Result } from "#/libs/result.ts";
import type { DecoderTables } from "#/src/core/fight-decoder.ts";
import type { SessionOptions } from "#/src/core/fight-session.ts";
import type { KeyValueStore } from "#/src/game/browser-store.ts";
import {
    ENGINE_FAILURE,
    type EngineFailure,
    type EnginePort,
    type WrapHandle,
} from "#/src/game/engine-battle.ts";
import type { PlacePort } from "#/src/game/engine-place.ts";
import { ROWS_WRITTEN_MAXIMUM, type TooltipPort } from "#/src/game/engine-tooltip.ts";
import type { DictionaryPort } from "#/src/game/game-dictionary.ts";
import type { BuildPort } from "#/src/game/game-build.ts";
import type { Clock } from "#/src/game/page-clock.ts";
import type { ConsolePort } from "#/src/game/page-console.ts";
import type { FileSink } from "#/src/game/page-file.ts";
import type { FrameHandle, FrameScheduler } from "#/src/game/page-frame.ts";
import type { IntervalScheduler } from "#/src/game/page-interval.ts";
import type { SurroundingsPort } from "#/src/game/page-surroundings.ts";
import type { TooltipTables } from "./carried-tooltip.ts";
import { DEFECT_KIND, type DefectLedger, initDefectLedger } from "./defect-ledger.ts";
import { type EngineSearch, startEngineSearch } from "./engine-search.ts";
import { executeRuntimeIntent, type IntentParts } from "./runtime-intent.ts";
import { initLiveFight, type LiveFight } from "./live-fight.ts";
import { renderFrame } from "./panel-frame.ts";
import { resetScreenOnOpening } from "./screen-intent.ts";
import {
    readStorageChoice,
    readWindowFold,
    readWindowPosition,
    type SettingFailure,
    STORAGE_DEFAULT,
} from "./settings.ts";
import { initShelfKeeper, type ShelfKeeper } from "./shelf-keeper.ts";
import { KEPT_MAXIMUM } from "./shelf.ts";
import { PANEL_WINDOW, type PanelWindow, type StorageChoice } from "#/src/ui/panel-choice.ts";
import type { PanelDocument, PanelElement } from "#/src/ui/panel-document.ts";
import type { PanelPlacement, PanelViewport } from "#/src/ui/panel-drag.ts";
import { initPanelView, type PanelView } from "#/src/ui/panel-element.ts";
import type { PanelIntent } from "#/src/ui/panel-intent.ts";
import { createScreenState, type ScreenState } from "#/src/ui/panel-screen.ts";
import { ROWS_BESIDE_THE_STATUSES, type TranslateLabel } from "#/src/ui/panel-words.ts";
import { VIEW_FAILURE, type ViewFailure } from "#/src/ui/view-failure.ts";

export interface RuntimePorts {
    clock: Clock;
    frames: FrameScheduler;
    interval: IntervalScheduler;
    engine: EnginePort;
    place: PlacePort;
    dictionary: DictionaryPort;
    build: BuildPort;
    surroundings: SurroundingsPort;
    tooltip: TooltipPort;
    /** Where the panel's own choices are kept, which is never the store the shelf is moved to. */
    settings: KeyValueStore;
    /** Never refusing: a browser that lends no store is answered with one that forgets. */
    initShelfStore: (choice: StorageChoice) => KeyValueStore;
    file: FileSink;
    console: ConsolePort;
    document: PanelDocument;
    mountPanel: (panel: PanelElement) => Result<void, ForeignFailure>;
    readViewport: () => PanelViewport | null;
}

/** The frozen readings, handed in by whoever holds them: `core/` imports none. */
export interface RuntimeTables {
    decoder: DecoderTables;
    tooltip: TooltipTables;
}

export interface RuntimeOptions {
    /** Which build drew the panel and wrote a file. */
    version: string;
    tables: RuntimeTables;
    sessionOptions: SessionOptions;
}

export interface Runtime {
    onIntent(intent: PanelIntent): void;
    /** Stops looking, takes the wrap off and cancels the frame asked for. */
    deinit(): Result<void, EngineFailure>;
}

interface RuntimeState {
    ports: RuntimePorts;
    options: RuntimeOptions;
    defects: DefectLedger;
    screen: ScreenState;
    keeper: ShelfKeeper;
    live: LiveFight;
    view: PanelView;
    translate: TranslateLabel;
    search: EngineSearch | null;
    wrap: WrapHandle | null;
    frame: FrameHandle | null;
    isStale: boolean;
    hasFrameRefused: boolean;
    isMounted: boolean;
    isStoodDown: boolean;
}

interface RuntimeParts {
    defects: DefectLedger;
    keeper: ShelfKeeper;
    screen: ScreenState;
    translate: TranslateLabel;
}

export function initRuntime(ports: RuntimePorts, options: RuntimeOptions): Runtime {
    assert(options.version.length > 0, "a runtime names the build it runs");
    const statusBits = options.tables.tooltip.statusBits.length;
    // One bound in two layers, which is the one place both are in reach (`docs/design.md` §4).
    assert(
        statusBits + ROWS_BESIDE_THE_STATUSES <= ROWS_WRITTEN_MAXIMUM,
        "every row a fighter can be given fits the block the tooltip writer takes",
    );
    const defects = initDefectLedger(ports.console);
    const choice = readRuntimeSetting(defects, readStorageChoice(ports.settings), STORAGE_DEFAULT);
    const keeper = initShelfKeeper({
        settings: ports.settings,
        initShelfStore: ports.initShelfStore,
        choice,
        tables: options.tables.decoder,
        sessionOptions: options.sessionOptions,
        defects,
    });
    const screen = createScreenState(
        readRuntimeFold(ports, defects, PANEL_WINDOW.panel),
        readRuntimeFold(ports, defects, PANEL_WINDOW.helper),
    );
    // The raw key is the mark where the client cannot be asked (`develop ADR 0024`).
    const translate: TranslateLabel = (id, category) => {
        assert(id.length > 0, "a label is asked for by an id the panel named");
        const read = ports.dictionary.readLabel(id, category);
        if (!read.ok) return null;
        assert(read.value.length > 0, "a label the client answered says something");
        return read.value;
    };
    const state = initRuntimeState(ports, options, { defects, keeper, screen, translate });
    return {
        onIntent: (intent) => onRuntimeIntent(state, intent),
        deinit: () => deinitRuntimeState(state),
    };
}

/** A value the reader stored that does not read back costs that value, and says so. */
function readRuntimeSetting<Value>(
    defects: DefectLedger,
    read: Result<Value, SettingFailure>,
    fallback: Value,
): Value {
    if (read.ok) return read.value;
    defects.add({ kind: DEFECT_KIND.kept, region: null, failure: read.error });
    return fallback;
}

function readRuntimeFold(ports: RuntimePorts, defects: DefectLedger, window: PanelWindow): boolean {
    return readRuntimeSetting(defects, readWindowFold(ports.settings, window), false);
}

function initRuntimeState(
    ports: RuntimePorts,
    options: RuntimeOptions,
    parts: RuntimeParts,
): RuntimeState {
    const { defects, keeper, screen } = parts;
    // The closures below are called by the game and the reader, never while this function runs.
    const { live, listener } = initLiveFight({
        engine: ports.engine,
        clock: ports.clock,
        place: ports.place,
        build: ports.build,
        tables: options.tables.decoder,
        sessionOptions: options.sessionOptions,
        defects,
        keepFight: (fight) => keeper.keep(fight),
        onFightOpened: () => resetScreenOnOpening(screen),
        markStale: () => markStale(state),
    });
    const view = initPanelView(ports.document, {
        version: options.version,
        onIntent: (intent) => onRuntimeIntent(state, intent),
        onFailure: (failure) => addViewFailure(defects, failure),
        placement: readRuntimePlacement(ports, defects, PANEL_WINDOW.panel),
        standingPlacement: readRuntimePlacement(ports, defects, PANEL_WINDOW.helper),
        translate: parts.translate,
    });
    assert(keeper.getFights().length <= KEPT_MAXIMUM, "the shelf opened stays inside its bound");
    const state: RuntimeState = {
        ports,
        options,
        ...parts,
        live,
        view,
        search: null,
        wrap: null,
        frame: null,
        isStale: false,
        hasFrameRefused: false,
        isMounted: false,
        isStoodDown: false,
    };
    state.search = startEngineSearch(ports.engine, ports.interval, listener, {
        onAttached: (wrap) => {
            state.wrap = wrap;
            showRuntimePanel(state);
        },
        onStoodDown: (failure) => {
            state.isStoodDown = true;
            ports.console.writeBrandedLine(failure.kind, failure);
        },
        onRefused: (failure) => failRuntimeSearch(state, failure),
        onAbandoned: (failure) => failRuntimeSearch(state, failure),
        onLookFailed: (failure) => ports.console.writeBrandedLine(failure.kind, failure),
    });
    return state;
}

/**
 * The first mark asks for a frame; later marks before it arrives do nothing. A page that lends no
 * frame is drawn at once, as `develop` draws, and says so once.
 */
function markStale(state: RuntimeState): void {
    if (state.isStoodDown) return;
    if (state.isStale) return;
    state.isStale = true;
    const requested = state.ports.frames.requestFrame(
        () => onRuntimeFrame(state),
        (failure) => state.defects.add({ kind: DEFECT_KIND.region, region: null, failure }),
    );
    if (requested.ok) {
        state.frame = requested.value;
        return;
    }
    if (!state.hasFrameRefused) {
        state.hasFrameRefused = true;
        state.defects.add({ kind: DEFECT_KIND.region, region: null, failure: requested.error });
    }
    assert(state.frame === null, "a draw without a frame holds none it asked for");
    onRuntimeFrame(state);
}

/**
 * The only drawing, and the panel goes up at the first one: no frame is asked for before the wrap
 * is on or the game is given up on. A panel the page will not take is tried again at the next.
 */
function onRuntimeFrame(state: RuntimeState): void {
    assert(state.isStale, "a frame falls only where one was asked for");
    state.isStale = false;
    state.frame = null;
    renderFrame({
        screen: state.screen,
        keeper: state.keeper,
        live: state.live,
        defects: state.defects,
        view: state.view,
        clock: state.ports.clock,
        tooltip: state.ports.tooltip,
        tables: state.options.tables.tooltip,
        translate: state.translate,
    });
    if (state.isMounted) return;
    const mounted = state.ports.mountPanel(state.view.element);
    if (mounted.ok) state.isMounted = true;
    else state.defects.add({ kind: DEFECT_KIND.mount, region: null, failure: mounted.error });
    assert(!state.isStale, "a frame asks for no second frame of its own");
}

function onRuntimeIntent(state: RuntimeState, intent: PanelIntent): void {
    // A panel left on the page by a copy that was stopped answers no press.
    if (state.isStoodDown) return;
    const parts: IntentParts = {
        ports: state.ports,
        version: state.options.version,
        screen: state.screen,
        keeper: state.keeper,
        live: state.live,
        defects: state.defects,
    };
    if (executeRuntimeIntent(parts, intent)) markStale(state);
}

function addViewFailure(defects: DefectLedger, failure: ViewFailure): void {
    switch (failure.kind) {
        case VIEW_FAILURE.regionUndrawn:
            defects.add({ kind: DEFECT_KIND.region, region: failure.region, failure });
            return;
        case VIEW_FAILURE.gestureDropped:
            defects.add({ kind: DEFECT_KIND.gesture, region: null, failure });
            return;
        case VIEW_FAILURE.windowUnplaced:
            defects.add({ kind: DEFECT_KIND.mount, region: null, failure });
            return;
    }
}

function readRuntimePlacement(
    ports: RuntimePorts,
    defects: DefectLedger,
    window: PanelWindow,
): PanelPlacement {
    const position = readRuntimeSetting(defects, readWindowPosition(ports.settings, window), null);
    if (position !== null) {
        assert(Number.isSafeInteger(position.left), "a window is put back at a whole column");
        assert(Number.isSafeInteger(position.top), "and a whole row");
    }
    return { position, readViewport: ports.readViewport };
}

function showRuntimePanel(state: RuntimeState): void {
    assert(!state.isStoodDown, "a copy that stood down puts no panel up");
    markStale(state);
}

function failRuntimeSearch(state: RuntimeState, failure: EngineFailure): void {
    assert(failure.kind !== ENGINE_FAILURE.anotherReader, "a copy that stands down shows nothing");
    assert(state.wrap === null, "and one holding the game is not looking for it");
    state.defects.add({ kind: DEFECT_KIND.engine, region: null, failure });
    showRuntimePanel(state);
}

function deinitRuntimeState(state: RuntimeState): Result<void, EngineFailure> {
    state.search?.stop();
    state.frame?.cancel();
    state.frame = null;
    state.isStoodDown = true;
    if (state.search !== null) assert(state.search.isDone(), "a stopped add-on looks no further");
    const wrap = state.wrap;
    state.wrap = null;
    if (wrap === null) return ok(undefined);
    return wrap.detach();
}
