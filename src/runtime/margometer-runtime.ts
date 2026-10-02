/**
 * Where the layers meet (`docs/design.md` §8, §10): the settings and the shelf are opened, the
 * engine is looked for and wrapped, each call is read into the live fight, each intent changes
 * state at once, and drawing waits for one frame. Everything it touches is a port handed in, so a
 * userscript's contact with its browser is stated in the entry and this is testable without one.
 */

import { assert } from "@std/assert/assert";
import * as errors from "#/libs/errors.ts";
import type { DecoderTables } from "#/src/core/fight-decoder.ts";
import { composeFightView, type SessionOptions } from "#/src/core/fight-session.ts";
import type { KeyValueStore } from "#/src/ports/browser-store.ts";
import {
    MargonemEngineAlreadyWrapped,
    type MargonemEngineBattlePort,
    type MargonemEngineFailure,
    type PayloadListener,
    SearchAbandoned,
    type WrapHandle,
} from "#/src/ports/margonem-engine-battle.ts";
import type { MargonemEngineHeroPort } from "#/src/ports/margonem-engine-hero.ts";
import type { MargonemEnginePlacePort } from "#/src/ports/margonem-engine-place.ts";
import {
    type MargonemEngineTooltipPort,
    ROWS_WRITTEN_MAXIMUM,
} from "#/src/ports/margonem-engine-tooltip.ts";
import type { MargonemClientDictionaryPort } from "#/src/ports/margonem-client-dictionary.ts";
import type { MargonemClientBuildPort } from "#/src/ports/margonem-client-build.ts";
import type {
    BrowserClock,
    BrowserFrameScheduler,
    BrowserIntervalScheduler,
    FrameHandle,
    IntervalHandle,
} from "#/src/ports/browser-time.ts";
import type { BrowserConsolePort } from "#/src/ports/browser-console.ts";
import type { BrowserFileSink } from "#/src/ports/browser-file.ts";
import { type BrowserSurroundingsPort, WORLD_UNKNOWN } from "#/src/ports/browser-surroundings.ts";
import type { TooltipTables } from "./carried-tooltip.ts";
import { DEFECT_KIND, type DefectLedger, initDefectLedger } from "./defect-ledger.ts";
import type { RuntimeFailure } from "./failure-fate.ts";
import { writeShownFightFile } from "./fight-handover.ts";
import { lookupShownFight, tallyFightState } from "./fight-state.ts";
import { initLiveFight, type LiveFight } from "./live-fight.ts";
import { renderFrame } from "./panel-frame.ts";
import {
    deleteWindowSize,
    readStorageChoice,
    readTypeStep,
    readWindowCollapsed,
    readWindowPosition,
    readWindowSize,
    type SettingFailure,
    STORAGE_DEFAULT,
    writeTypeStep,
    writeWindowCollapsed,
    writeWindowPosition,
    writeWindowSize,
} from "./settings.ts";
import { initShelfKeeper, type ShelfKeeper } from "./shelf-keeper.ts";
import { KEPT_MAXIMUM } from "./shelf.ts";
import {
    PANEL_WINDOW,
    type PanelWindow,
    type StorageChoice,
    TYPE_STEP_DEFAULT,
    type WindowSize,
} from "#/src/ui/panel-choice.ts";
import type { PanelDocument, PanelElement } from "#/src/ui/panel-document.ts";
import type { PanelPlacement, PanelViewport } from "#/src/ui/panel-drag.ts";
import { initPanelView, type PanelView } from "#/src/ui/panel-element.ts";
import { PANEL_INTENT, type PanelIntent } from "#/src/ui/panel-intent.ts";
import { createScreenState, type ScreenState } from "#/src/ui/panel-screen.ts";
import { ROWS_BESIDE_THE_STATUSES, type TranslateLabel } from "#/src/ui/panel-words.ts";
import { GestureDropped, RegionUndrawn } from "#/src/ui/view-failure.ts";

export interface RuntimePorts {
    clock: BrowserClock;
    frames: BrowserFrameScheduler;
    interval: BrowserIntervalScheduler;
    battle: MargonemEngineBattlePort;
    place: MargonemEnginePlacePort;
    hero: MargonemEngineHeroPort;
    dictionary: MargonemClientDictionaryPort;
    build: MargonemClientBuildPort;
    surroundings: BrowserSurroundingsPort;
    tooltip: MargonemEngineTooltipPort;
    /** Where the panel's own choices are kept, which is never the store the shelf is moved to. */
    settings: KeyValueStore;
    /** Never refusing: a browser that lends no store is answered with one that forgets. */
    initShelfStore: (choice: StorageChoice) => KeyValueStore;
    file: BrowserFileSink;
    console: BrowserConsolePort;
    document: PanelDocument;
    mountPanel: (panel: PanelElement) => void | errors.Caught;
    readViewport: () => PanelViewport | null;
}

/** The frozen readings, handed in by whoever holds them: `core/` imports none. */
export interface RuntimeTables {
    decoder: DecoderTables;
    tooltip: TooltipTables;
}

export interface RuntimeOptions {
    /** Which build drew the panel and wrote a file. */
    addOnVersion: string;
    tables: RuntimeTables;
    sessionOptions: SessionOptions;
}

export interface Runtime {
    onIntent(intent: PanelIntent): void;
    /** Stops looking, takes the wrap off and cancels the frame asked for. */
    deinit(): undefined | MargonemEngineFailure;
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
    search: MargonemEngineSearch | null;
    wrap: WrapHandle | null;
    frame: FrameHandle | null;
    isStale: boolean;
    hasFrameRefused: boolean;
    isMounted: boolean;
    isStoodDown: boolean;
}

/** How a search ends, and the one thing it says on the way. Each is said once. */
export interface SearchReport {
    onAttached(wrap: WrapHandle): void;
    /** A MargoMeter already holds the game, so this copy stands down and never counts. */
    onStoodDown(failure: MargonemEngineFailure): void;
    /** The game is here, and the method it is read by is not: said once, the looking goes on. */
    onRefused(failure: MargonemEngineFailure): void;
    onAbandoned(failure: MargonemEngineFailure): void;
    /** A look that failed, the first time one does. The looking goes on to its bound. */
    onLookFailed(failure: errors.Caught): void;
}

export interface MargonemEngineSearch {
    /** Stops looking. A wrap already on stays on: taking it off is the wrap's own `detach`. */
    stop(): void;
    isDone(): boolean;
}

interface Search {
    looks: number;
    isDone: boolean;
    hasRefused: boolean;
    hasFailed: boolean;
    handle: IntervalHandle | null;
}

const LOOK_EVERY_MILLISECONDS = 250;
/** Four looks a second for a minute. A game that has not arrived by then is not arriving. */
export const LOOKS_MAXIMUM = 240;

export function initRuntime(ports: RuntimePorts, options: RuntimeOptions): Runtime {
    assert(options.addOnVersion.length > 0, "a runtime names the build it runs");
    const statusBitsCount = options.tables.tooltip.statusBits.length;
    // One bound in two layers, which is the one place both are in reach (`docs/design.md` §4).
    assert(
        statusBitsCount + ROWS_BESIDE_THE_STATUSES <= ROWS_WRITTEN_MAXIMUM,
        "every row a fighter can be given fits the block the tooltip writer takes",
    );
    const defects = initDefectLedger(ports.console);
    const storageChoice = readSettingOrFallback(
        defects,
        readStorageChoice(ports.settings),
        STORAGE_DEFAULT,
    );
    const keeper = initShelfKeeper({
        settings: ports.settings,
        initShelfStore: ports.initShelfStore,
        choice: storageChoice,
        tables: options.tables.decoder,
        sessionOptions: options.sessionOptions,
        defects,
    });
    const screen = createScreenState(
        readFoldSetting(ports, defects, PANEL_WINDOW.meter),
        readFoldSetting(ports, defects, PANEL_WINDOW.helper),
        readSettingOrFallback(defects, readTypeStep(ports.settings), TYPE_STEP_DEFAULT),
        {
            meter: readSizeSetting(ports, defects, PANEL_WINDOW.meter),
            helper: readSizeSetting(ports, defects, PANEL_WINDOW.helper),
        },
    );
    // The raw key is the mark where the client cannot be asked (`develop ADR 0024`).
    const translate: TranslateLabel = (id, category) => {
        assert(id.length > 0, "a label is asked for by an id the panel named");
        const label = ports.dictionary.readLabel(id, category);
        if (label instanceof Error) return null;
        assert(label.length > 0, "a label the client answered says something");
        return label;
    };
    let state: RuntimeState;
    // Build the state, and start looking for the engine.
    {
        // The closures below are called by the game and the reader, never while this block runs.
        const { live: liveFight, listener } = initLiveFight({
            battle: ports.battle,
            clock: ports.clock,
            place: ports.place,
            hero: ports.hero,
            build: ports.build,
            tables: options.tables.decoder,
            sessionOptions: options.sessionOptions,
            defects,
            keeper,
            // ⚠️ **A row left open would find somebody in the next fight**: a party keeps its ids
            // from one fight to the next, ten of them shared between
            // `captures/2026-08-15-tempest-grupa-vs-hildur-1` and `-2`, read 2026-08-31.
            onFightOpened: () => {
                // Put the panel back on its ranking, for a reader on the live fight alone.
                if (screen.chosenFightOpenedAt !== null) return;
                resetScreenOpened(screen);
            },
            markStale: () => markStale(state),
        });
        // The view reports a window it cannot place while it is being built, before `state` exists.
        let builtState: RuntimeState | null = null;
        const view = initPanelView(ports.document, {
            addOnVersion: options.addOnVersion,
            typeStep: screen.typeStep,
            onIntent: (intent) => onRuntimeIntent(state, intent),
            // Count the failure the view met. One met outside a frame — a gesture dropped, a card
            // that would not draw under a pointer — asks for the frame that says it, or a reader
            // who only hovers never sees the line.
            onFailure: (failure) => {
                if (failure instanceof RegionUndrawn) {
                    defects.add({ kind: DEFECT_KIND.region, region: failure.region, failure });
                } else if (failure instanceof GestureDropped) {
                    defects.add({ kind: DEFECT_KIND.gesture, region: null, failure });
                } else {
                    defects.add({ kind: DEFECT_KIND.mount, region: null, failure });
                }
                // Met while the runtime is still being stood up: the first frame says it. Inside a
                // frame the view's report collects instead, so nothing arrives here while one is
                // drawing.
                if (builtState === null) return;
                markStale(builtState);
            },
            meterPlacement: readPlacementSetting(ports, defects, PANEL_WINDOW.meter, screen),
            helperPlacement: readPlacementSetting(ports, defects, PANEL_WINDOW.helper, screen),
            translate,
        });
        assert(
            keeper.getFights().length <= KEPT_MAXIMUM,
            "the shelf opened stays inside its bound",
        );
        state = {
            ports,
            options,
            defects,
            keeper,
            screen,
            translate,
            live: liveFight,
            view,
            search: null,
            wrap: null,
            frame: null,
            isStale: false,
            hasFrameRefused: false,
            isMounted: false,
            isStoodDown: false,
        };
        builtState = state;
        state.search = initMargonemEngineSearch(ports.battle, ports.interval, listener, {
            onAttached: (wrap) => {
                state.wrap = wrap;
                markPanelDue(state);
            },
            onStoodDown: (failure) => {
                state.isStoodDown = true;
                ports.console.writeBrandedLine(failure.name, failure);
            },
            onRefused: (failure) => onMargonemEngineSearchFailed(state, failure),
            onAbandoned: (failure) => onMargonemEngineSearchFailed(state, failure),
            onLookFailed: (failure) => ports.console.writeBrandedLine(failure.name, failure),
        });
    }
    return {
        onIntent: (intent) => onRuntimeIntent(state, intent),
        // Stop looking, take the wrap off, and cancel the frame asked for.
        deinit: () => {
            state.search?.stop();
            state.frame?.cancel();
            state.frame = null;
            state.isStoodDown = true;
            if (state.search !== null) {
                assert(state.search.isDone(), "a stopped add-on looks no further");
            }
            const wrap = state.wrap;
            state.wrap = null;
            if (wrap === null) return undefined;
            return wrap.detach();
        },
    };
}

/** Nothing open on the screen: no row, no end left out, no pair and no part of a figure. */
function resetScreenOpened(screen: ScreenState): void {
    screen.openedCombatantId = null;
    screen.openUnnamedEnd = null;
    screen.pairCombatantId = null;
    screen.openPart = null;
}

/** A value the reader stored that does not read back costs that value, and says so. */
function readSettingOrFallback<Value>(
    defects: DefectLedger,
    read: Value | SettingFailure,
    fallback: Value,
): Value {
    if (!(read instanceof Error)) return read;
    defects.add({ kind: DEFECT_KIND.kept, region: null, failure: read });
    return fallback;
}

function readFoldSetting(
    ports: RuntimePorts,
    defects: DefectLedger,
    panelWindow: PanelWindow,
): boolean {
    return readSettingOrFallback(defects, readWindowCollapsed(ports.settings, panelWindow), false);
}

function readSizeSetting(
    ports: RuntimePorts,
    defects: DefectLedger,
    panelWindow: PanelWindow,
): WindowSize | null {
    const size = readSettingOrFallback(defects, readWindowSize(ports.settings, panelWindow), null);
    if (size !== null) {
        assert(size.width > 0, "a window is put back at a width it can stand at");
        assert(size.height > 0, "and a height");
    }
    return size;
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
        () => onFrame(state),
        (failure) => state.defects.add({ kind: DEFECT_KIND.region, region: null, failure }),
    );
    if (!(requested instanceof Error)) {
        state.frame = requested;
        return;
    }
    if (!state.hasFrameRefused) {
        state.hasFrameRefused = true;
        state.defects.add({ kind: DEFECT_KIND.region, region: null, failure: requested });
    }
    assert(state.frame === null, "a draw without a frame holds none it asked for");
    onFrame(state);
}

/**
 * The only drawing, and the panel goes up at the first one: no frame is asked for before the wrap
 * is on or the game is given up on. A panel the page will not take is tried again at the next.
 */
function onFrame(state: RuntimeState): void {
    assert(state.isStale, "a frame falls only where one was asked for");
    state.isStale = false;
    state.frame = null;
    let world: string | null;
    // Read the page's world, or nothing where the page named none: the card leaves the line off.
    {
        const read = state.ports.surroundings.readWorld();
        if (read === WORLD_UNKNOWN) world = null;
        else world = read;
    }
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
        world,
    });
    if (state.isMounted) return;
    const mounted = state.ports.mountPanel(state.view.element);
    if (mounted instanceof Error) {
        state.defects.add({ kind: DEFECT_KIND.mount, region: null, failure: mounted });
    } else state.isMounted = true;
    assert(!state.isStale, "a frame asks for no second frame of its own");
}

function onRuntimeIntent(state: RuntimeState, intent: PanelIntent): void {
    // A panel left on the page by a copy that was stopped answers no press.
    if (state.isStoodDown) return;
    let shouldDraw: boolean;
    // Execute the intent as one operation (`docs/design.md` §10.3), marking a failure where met.
    switch (intent.kind) {
        case PANEL_INTENT.saveFile: {
            // Everything under a file reaches `core/`, whose assertion costs the file alone.
            const saved = errors.attempt(() => {
                // The release of the file lands on the browser's clock after this has
                // returned, so its failure is handed the same mark by the sink.
                const { screen, keeper, live: liveFight, defects } = state;
                const view = composeFightView(liveFight.session);
                const liveFightState = view === null ? null : tallyFightState(view);
                const shownFight = lookupShownFight(
                    liveFightState,
                    screen.chosenFightOpenedAt,
                    keeper.getFights(),
                    keeper.lookupKeptFightState,
                );
                if (shownFight !== null) {
                    const applied = shownFight.fightState.view.payloadsApplied;
                    assert(applied > 0, "a fight handed over was read from something");
                }
                const ports = { ...state.ports, addOnVersion: state.options.addOnVersion };
                const written = writeShownFightFile(shownFight, liveFight, ports, (failure) => {
                    addFileDefect(defects, failure);
                });
                if (written instanceof Error) addFileDefect(defects, written);
            });
            if (saved instanceof Error) addFileDefect(state.defects, saved);
            shouldDraw = executeScreenIntent(state.screen, intent);
            break;
        }
        case PANEL_INTENT.pin:
            state.keeper.pin(intent.openedAt);
            shouldDraw = true;
            break;
        case PANEL_INTENT.storage:
            state.keeper.moveShelf(intent.choice);
            shouldDraw = true;
            break;
        // Once per drag rather than once per frame, and no frame: the panel already stands
        // there. A refusal is an answer: the reader's choice stands, and only the next visit
        // is the poorer for it, as `develop` has it.
        case PANEL_INTENT.move:
            void writeWindowPosition(state.ports.settings, intent.window, intent.position);
            shouldDraw = false;
            break;
        // Once per release, as a move is, and for the same reason no frame, but where the
        // options stand open: they say which window is sized, and would otherwise say it wrong.
        case PANEL_INTENT.resize: {
            const hasMoved = executeScreenIntent(state.screen, intent);
            void writeWindowSize(state.ports.settings, intent.window, intent.size);
            assert(
                state.screen.windowSizes[intent.window] === intent.size,
                "a window sized is the size the frames to come draw it",
            );
            shouldDraw = hasMoved;
            break;
        }
        case PANEL_INTENT.resetSize: {
            const hasMoved = executeScreenIntent(state.screen, intent);
            if (hasMoved) void deleteWindowSize(state.ports.settings, intent.window);
            shouldDraw = hasMoved;
            break;
        }
        case PANEL_INTENT.typeStep: {
            const hasMoved = executeScreenIntent(state.screen, intent);
            if (hasMoved) void writeTypeStep(state.ports.settings, state.screen.typeStep);
            shouldDraw = hasMoved;
            break;
        }
        case PANEL_INTENT.fold: {
            const hasMoved = executeScreenIntent(state.screen, intent);
            const isCollapsed = intent.window === PANEL_WINDOW.meter
                ? state.screen.isMeterCollapsed
                : state.screen.isHelperCollapsed;
            void writeWindowCollapsed(state.ports.settings, intent.window, isCollapsed);
            assert(hasMoved, "a fold always moves the window it names");
            shouldDraw = hasMoved;
            break;
        }
        default:
            shouldDraw = executeScreenIntent(state.screen, intent);
            break;
    }
    if (shouldDraw) markStale(state);
}

function addFileDefect(defects: DefectLedger, failure: RuntimeFailure): void {
    defects.add({ kind: DEFECT_KIND.file, region: null, failure });
}

function readPlacementSetting(
    ports: RuntimePorts,
    defects: DefectLedger,
    panelWindow: PanelWindow,
    screen: ScreenState,
): PanelPlacement {
    const position = readSettingOrFallback(
        defects,
        readWindowPosition(ports.settings, panelWindow),
        null,
    );
    if (position !== null) {
        assert(Number.isSafeInteger(position.left), "a window is put back at a whole column");
        assert(Number.isSafeInteger(position.top), "and a whole row");
    }
    return { position, size: screen.windowSizes[panelWindow], readViewport: ports.readViewport };
}

function markPanelDue(state: RuntimeState): void {
    assert(!state.isStoodDown, "a copy that stood down puts no panel up");
    markStale(state);
}

function onMargonemEngineSearchFailed(state: RuntimeState, failure: MargonemEngineFailure): void {
    assert(
        !(failure instanceof MargonemEngineAlreadyWrapped),
        "a copy that stands down shows nothing",
    );
    assert(state.wrap === null, "and one holding the game is not looking for it");
    state.defects.add({ kind: DEFECT_KIND.engine, region: null, failure });
    markPanelDue(state);
}

/**
 * Getting the wrap onto the game (§10.1). The game builds its battle once, while its engine starts,
 * and a userscript may arrive on either side of that: so this looks, keeps looking, and stops when
 * it finds one or when the game plainly is not coming. A search with no end is something the page
 * pays for forever.
 */
export function initMargonemEngineSearch(
    battlePort: MargonemEngineBattlePort,
    interval: BrowserIntervalScheduler,
    listener: PayloadListener,
    report: SearchReport,
): MargonemEngineSearch {
    const search: Search = {
        looks: 0,
        isDone: false,
        hasRefused: false,
        hasFailed: false,
        handle: null,
    };
    // ⚠️ The report is ours and may break, and two of its calls stand on the stack that started
    // the add-on, outside any look's guard. One guard here covers all of them: a report that
    // breaks has nowhere further to go, and the search has already counted the look it failed on.
    const onLookFailure = (failure: errors.Caught): void => {
        void errors.attempt(() => executeLookFailed(search, report, failure));
    };
    // ⚠️ The first look runs on the stack that started the add-on, where only the game's own page
    // stands above it; every look after it runs in the browser's timer. One guard for both.
    const first = errors.attempt(() => executeSearchLook(search, battlePort, listener, report));
    if (first instanceof Error) onLookFailure(first);
    if (!search.isDone) {
        const started = interval.every(
            () => executeSearchLook(search, battlePort, listener, report),
            LOOK_EVERY_MILLISECONDS,
            onLookFailure,
        );
        if (started instanceof Error) onLookFailure(started);
        else search.handle = started;
    }
    return {
        stop: () => deinitSearchTimer(search),
        isDone: () => search.isDone,
    };
}

/** A look that failed is still a look, so the search runs out where one finding nothing does. */
function executeLookFailed(
    search: Search,
    report: SearchReport,
    failure: errors.Caught,
): void {
    if (!search.hasFailed) {
        search.hasFailed = true;
        report.onLookFailed(failure);
    }
    executeSearchBound(search, report);
}

function executeSearchBound(search: Search, report: SearchReport): void {
    if (search.looks < LOOKS_MAXIMUM) return;
    if (search.isDone) return;
    deinitSearchTimer(search);
    report.onAbandoned(new SearchAbandoned(search.looks, LOOKS_MAXIMUM));
}

/**
 * ⚠️ The clock is the page's, and a cancel it refuses leaves a search that is done and a timer that
 * finds it done at every tick, which is the one thing the refusal can cost; so it is not reported.
 */
function deinitSearchTimer(search: Search): void {
    search.isDone = true;
    const handle = search.handle;
    search.handle = null;
    if (handle === null) return;
    void handle.cancel();
}

function executeSearchLook(
    search: Search,
    battlePort: MargonemEngineBattlePort,
    listener: PayloadListener,
    report: SearchReport,
): void {
    if (search.isDone) return;
    search.looks += 1;
    assert(search.looks <= LOOKS_MAXIMUM, "the search stays inside its stated bound");
    const battle = battlePort.readBattle();
    if (battle instanceof Error) {
        if (battle instanceof errors.Caught) executeLookFailed(search, report, battle);
        else executeSearchBound(search, report);
        return;
    }
    const wrapped = battle.wrap(listener);
    if (!(wrapped instanceof Error)) {
        deinitSearchTimer(search);
        report.onAttached(wrapped);
        return;
    }
    if (wrapped instanceof MargonemEngineAlreadyWrapped) {
        deinitSearchTimer(search);
        report.onStoodDown(wrapped);
        return;
    }
    // The game is here and its method is gone. Said once; the looking ends where a search
    // finding nothing ends, and says nothing then: the game was there, so it was not abandoned.
    if (search.looks >= LOOKS_MAXIMUM) deinitSearchTimer(search);
    if (search.hasRefused) return;
    search.hasRefused = true;
    report.onRefused(wrapped);
}

/**
 * Where an intent leaves the panel's screen (`docs/design.md` §10.3): which list, which side, which
 * row and which rung under it. Pure moves over the screen state; the shelf, the settings and the
 * file are the runtime's. False for an intent that moves nothing, so it costs no frame.
 */
export function executeScreenIntent(screen: ScreenState, intent: PanelIntent): boolean {
    let hasMoved: boolean;
    // Move the screen by the intent, one step.
    {
        switch (intent.kind) {
            case PANEL_INTENT.metric:
                // Keep the person, on every screen, and close what names one direction or noun.
                {
                    const metric = intent.metric;
                    screen.metric = metric;
                    screen.isOnShelf = false;
                    screen.isOnOptions = false;
                    screen.pairCombatantId = null;
                    screen.openPart = null;
                    screen.openUnnamedEnd = null;
                    hasMoved = true;
                }
                break;
            case PANEL_INTENT.side:
                // Close everything opened, since a side decides who is on the list.
                {
                    const side = intent.side;
                    screen.side = side;
                    screen.isOnShelf = false;
                    screen.isOnOptions = false;
                    resetScreenOpened(screen);
                    hasMoved = true;
                }
                break;
            case PANEL_INTENT.openRow:
                // Open the row, or under an opened one the rung under it: never a toggle.
                {
                    const combatantId = intent.combatantId;
                    assert(
                        Number.isSafeInteger(combatantId),
                        "a row is opened by the game's own id",
                    );
                    // An opened row covers the screen it was opened on, so a press inside it is a
                    // pair, or that person's share of what nobody was named for under a pinned row.
                    if (screen.openedCombatantId !== null) screen.pairCombatantId = combatantId;
                    else if (screen.openUnnamedEnd !== null) screen.pairCombatantId = combatantId;
                    else screen.openedCombatantId = combatantId;
                    hasMoved = true;
                }
                break;
            case PANEL_INTENT.openUnnamed:
                // Open the end left out: the rung under an opened person, or the pinned row.
                {
                    const end = intent.end;
                    assert(
                        screen.pairCombatantId === null,
                        "an end left out is pressed from the level over it",
                    );
                    assert(screen.openPart === null, "and never from a part's level");
                    screen.openUnnamedEnd = end;
                    hasMoved = true;
                }
                break;
            case PANEL_INTENT.openPart:
                screen.openPart = intent.part;
                hasMoved = true;
                break;
            // One rung at a time. False where there was none to leave: the gesture is the whole
            // panel's, so a press on the ranking would otherwise redraw it for nothing.
            case PANEL_INTENT.close:
                if (screen.isOnOptions) {
                    screen.isOnOptions = false;
                    hasMoved = true;
                    break;
                }
                if (screen.isOnShelf) {
                    screen.isOnShelf = false;
                    hasMoved = true;
                    break;
                }
                if (screen.openPart !== null) {
                    screen.openPart = null;
                    hasMoved = true;
                    break;
                }
                if (screen.pairCombatantId !== null) {
                    screen.pairCombatantId = null;
                    hasMoved = true;
                    break;
                }
                // The end a person left out is the rung under their figure, so it closes before
                // they do.
                if (screen.openedCombatantId !== null) {
                    if (screen.openUnnamedEnd !== null) screen.openUnnamedEnd = null;
                    else screen.openedCombatantId = null;
                    hasMoved = true;
                    break;
                }
                if (screen.openUnnamedEnd === null) {
                    hasMoved = false;
                    break;
                }
                screen.openUnnamedEnd = null;
                hasMoved = true;
                break;
            case PANEL_INTENT.fold:
                if (intent.window === PANEL_WINDOW.meter) {
                    screen.isMeterCollapsed = !screen.isMeterCollapsed;
                } else screen.isHelperCollapsed = !screen.isHelperCollapsed;
                hasMoved = true;
                break;
            case PANEL_INTENT.shelf:
                screen.isOnShelf = !screen.isOnShelf;
                screen.isOnOptions = false;
                hasMoved = true;
                break;
            case PANEL_INTENT.options:
                screen.isOnOptions = !screen.isOnOptions;
                screen.isOnShelf = false;
                hasMoved = true;
                break;
            case PANEL_INTENT.showKept:
                setScreenFight(screen, intent.openedAt);
                hasMoved = true;
                break;
            case PANEL_INTENT.showLive:
                setScreenFight(screen, null);
                hasMoved = true;
                break;
            // A save moves nothing, and asks for a frame all the same: the defect it can leave is
            // said on the panel, and the shelf between fights has no payload coming to draw it.
            case PANEL_INTENT.saveFile:
                hasMoved = true;
                break;
            // The same size asked for again moves nothing, and a frame for it would redraw nothing.
            case PANEL_INTENT.typeStep:
                if (screen.typeStep === intent.step) {
                    hasMoved = false;
                    break;
                }
                screen.typeStep = intent.step;
                hasMoved = true;
                break;
            // Kept for the frames to come, and no frame now unless the options stand open: the
            // window already stands that size, and the options are the one place that says which is
            // sized.
            case PANEL_INTENT.resize:
                screen.windowSizes = { ...screen.windowSizes, [intent.window]: intent.size };
                hasMoved = screen.isOnOptions;
                break;
            case PANEL_INTENT.resetSize:
                if (screen.windowSizes[intent.window] === null) {
                    hasMoved = false;
                    break;
                }
                screen.windowSizes = { ...screen.windowSizes, [intent.window]: null };
                hasMoved = true;
                break;
            case PANEL_INTENT.move:
            case PANEL_INTENT.storage:
            case PANEL_INTENT.pin:
                hasMoved = false;
                break;
        }
    }
    verifyScreenState(screen);
    return hasMoved;
}

/**
 * The two covers never stand open together: each one's control closes the other. An end left out
 * beside an opened person is a rung of its own, so neither a pair nor a part stands beside it.
 */
function verifyScreenState(screen: ScreenState): void {
    if (screen.isOnOptions) assert(!screen.isOnShelf, "the options and the shelf are one cover");
    if (screen.openedCombatantId === null) return;
    if (screen.openUnnamedEnd === null) return;
    assert(screen.pairCombatantId === null, "a person's end left out is not a pair with somebody");
    assert(screen.openPart === null, "and no part of their figure is open under it");
}

function setScreenFight(screen: ScreenState, openedAt: number | null): void {
    if (openedAt !== null) assert(Number.isSafeInteger(openedAt), "a fight is chosen by a moment");
    screen.chosenFightOpenedAt = openedAt;
    screen.isOnShelf = false;
    screen.isOnOptions = false;
    resetScreenOpened(screen);
}
