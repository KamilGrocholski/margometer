/**
 * Where the layers meet: the game is found, the payloads reach a session, and what the session
 * holds is drawn.
 *
 * Everything it touches is handed in — the page, the document, the clock, the place a panel goes
 * and the line a failure is written on. Nothing here reaches for a global, which is what keeps a
 * userscript's contact with its browser stated in one file and testable without one.
 */

import { assert } from "@std/assert";
import { type CombatantRoster, composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import { composeFightStatistics, type FightStatistics } from "@/src/core/fight-statistics.ts";
import { getIntegerFromText } from "@/src/core/protocol-number.ts";
import { getNumberFromUnknown, getTextFromUnknown } from "@/src/core/unknown-reading.ts";
import {
    addPayloadToSession,
    type BattleSession,
    composeBattleSession,
    type FightReading,
    getFightFromSession,
} from "@/src/game/battle-session.ts";
import { attachToGame, type GameAttachment, type Scheduler } from "@/src/game/engine-attachment.ts";
import { type FightPlace, getPlaceFromPage } from "@/src/game/engine-place.ts";
import { getGameBuildFromScriptName } from "@/src/core/game-build.ts";
import { type BrowserStore, composeBrowserStore } from "@/src/game/browser-store.ts";
import {
    type CaptureSurroundings,
    composeCaptureFileName,
    composeCaptureText,
    composeEmptyCapture,
    composeNextCapture,
    type FightCapture,
} from "@/src/game/fight-capture.ts";
import { type CapturedCombatant, composeSnapshotFromBattle } from "@/src/game/engine-warrior.ts";
import { type KeptFight, readKeptFights, writeKeptFights } from "@/src/game/kept-fights.ts";
import { composeReportText } from "@/src/game/fight-report.ts";
import type { PanelDocument, PanelElement } from "@/src/ui/panel-element.ts";
import { composePanelHost, type PanelHandle, type PanelPress } from "@/src/ui/panel-element.ts";
import { composeDrillReading, composePanelReading, type ShelfRow } from "@/src/ui/panel-reading.ts";
import {
    composeScreenState,
    getScreenFromName,
    getSideFromName,
    type ScreenState,
} from "@/src/ui/panel-screen.ts";
import {
    composeStoredTextFromPosition,
    getPositionFromStoredText,
    type PanelPlacement,
    type PanelPosition,
    type PanelViewport,
} from "@/src/ui/panel-drag.ts";
import { composePlaceWords } from "@/src/ui/panel-words.ts";

/** Where a failure of ours is written, so the reader sees whose it is at a glance. */
const FAILURE_LINE = "MargoMeter/Panel";
/** The one key this add-on writes, named as ours like everything else a reader could meet. */
const SHELF_KEY = "MargoMeter-fights";
/**
 * The fold, stored beside the shelf and never inside it: a shelf that reads back broken is
 * dropped whole, and a reader who folded the panel away should not have that undone by it.
 */
const FOLD_KEY = "MargoMeter-folded";
/** Anything else reads as unfolded, which is the state a reader who stored nothing is in. */
const FOLDED = "1";
/** Where the reader dragged the panel to, kept beside the fold and dropped as readily. */
const PLACE_KEY = "MargoMeter-place";

export interface PanelMount {
    /** Puts this panel where the last one was. Replacing is the caller's, mounting is ours. */
    show(panel: PanelElement): void;
}

export interface UserscriptEnvironment {
    page: unknown;
    /** How big the window is, or null where the page would not say. Nothing is measured. */
    readViewport(): PanelViewport | null;
    document: PanelDocument;
    schedule: Scheduler;
    mount: PanelMount;
    /** Null where the browser will not have one read, which is an answer and not a failure. */
    store: BrowserStore | null;
    /** Where a recording goes when the reader asks for one. Null where the page offers no way. */
    save: ((name: string, text: string) => void) | null;
    /** Where a report goes when the reader asks for one. Null where the browser lends none. */
    copy: ((text: string) => void) | null;
    /** What a recording says about where it came from, read at the moment one is asked for. */
    readSurroundings(): CaptureSurroundings;
    /** The clock, handed in like everything else, so nothing here reaches for one. */
    now(): number;
    /** One branded line, and the failure itself, so a console shows whose it is first. */
    report(line: string, failure: unknown): void;
}

/** Null where nothing about the place was known, which a row leaves blank rather than filling. */
function getPlaceWords(place: FightPlace | null): string | null {
    if (place === null) return null;
    const words = composePlaceWords(place.mapName, place.x, place.y);
    assert(words === null || words.length > 0, "a place put into words says something");
    return words;
}

function composeShelfRows(kept: readonly KeptFight[]): ShelfRow[] {
    const rows = kept.map((one) => ({
        openedAt: one.openedAt,
        place: getPlaceWords(one.place),
        combatants: one.combatants.length,
    }));
    assert(rows.length === kept.length, "a shelf draws a row for each fight it holds");
    assert(rows.every((one) => one.combatants >= 0), "and none of them has fewer than nobody");
    assert(rows.every((one) => one.place !== ""), "and a row that says where was fought says it");
    return rows;
}

/**
 * Where a press leaves the panel. False for a press that moves nothing, so a stray attribute in
 * the game's own markup never costs a redraw, let alone puts the panel somewhere it cannot draw.
 */
function handlePress(screen: ScreenState, press: PanelPress): boolean {
    assert(press.kind.length > 0, "a press says what it asks for");
    assert(screen.current.length > 0, "and lands on a panel that is on a screen");
    // Nothing on screen moves for either of these: the fight is handed to the browser, as a file
    // or as text, and the panel goes on drawing what it was drawing.
    if (press.kind === "save") return false;
    if (press.kind === "copy") return false;
    if (press.kind === "fold") {
        screen.isCollapsed = !screen.isCollapsed;
        return true;
    }
    if (press.kind === "shelf") {
        // A toggle, unlike a screen: the shelf covers what the reader was reading, and the same
        // press takes it off again rather than sending them to the top of a tab.
        screen.isOnShelf = !screen.isOnShelf;
        return true;
    }
    if (press.kind === "back") {
        // The shelf stands over an opened row, so the way back takes the topmost thing off first.
        if (screen.isOnShelf) screen.isOnShelf = false;
        else screen.openRowId = null;
        return true;
    }
    if (press.kind === "row") {
        const opened = getIntegerFromText(press.stated);
        if (opened === null) return false;
        // Not a toggle, unlike the shelf's tab: an opened row covers the screen it was opened on,
        // so the row that would close it is not on the panel to be pressed a second time.
        screen.openRowId = opened;
        return true;
    }
    if (press.kind === "side") {
        const chosen = getSideFromName(press.side);
        if (chosen === null) return false;
        screen.side = chosen;
        screen.isOnShelf = false;
        // A side decides who is on the list, so a row opened before it was narrowed may not be
        // on the list any more — and a cut standing over a list nobody is on says nothing.
        screen.openRowId = null;
        return true;
    }
    const reached = getScreenFromName(press.screen);
    if (reached === null) return false;
    screen.current = reached;
    screen.isOnShelf = false;
    // A cut belongs to the screen it was opened on: the same combatant on the next screen is
    // another figure, and leaving it open would state one figure under another's heading.
    screen.openRowId = null;
    return true;
}

/** What the session holds, read into figures. The panel draws these and a report writes them. */
interface FightFigures {
    fight: FightReading;
    roster: CombatantRoster;
    statistics: FightStatistics;
}

/**
 * The figures, derived rather than kept: what a session holds is what the game said, so the two
 * readers of it are never looking at arithmetic one of them did earlier.
 */
function composeFightFigures(session: BattleSession): FightFigures | null {
    const fight = getFightFromSession(session);
    if (fight === null) return null;
    assert(fight.payloads > 0, "a fight that is read was built from something");
    const roster = composeCombatantRoster([...fight.roster.byId.values()]);
    const statistics = composeFightStatistics(fight.events, composeTeamHeals(fight.events, roster));
    assert(statistics.unreadMessages >= 0, "a reading states what it could not read, even as none");
    return { fight, roster, statistics };
}

/**
 * Puts what the session holds into the panel that is already on the page. A fight nobody has seen
 * draws nothing, because a panel of zeroes over a game that has not started is a claim.
 */
function showFight(
    session: BattleSession,
    screen: ScreenState,
    panel: PanelHandle,
    kept: readonly KeptFight[],
    place: FightPlace | null,
): void {
    const figures = composeFightFigures(session);
    if (figures === null) return;
    const { fight, roster, statistics } = figures;
    const reading = composePanelReading(
        statistics,
        roster,
        screen.current,
        screen.side,
        fight.readerSide,
    );
    assert(reading.rows.length >= 0, "a reading states its rows, however few");
    // Null where the screen has no cut to open, so a row opened on one screen never stands over
    // another that cannot state the same figure.
    const drill = screen.openRowId === null
        ? null
        : composeDrillReading(statistics, roster, screen.current, screen.openRowId);
    panel.show({
        reading,
        current: screen.current,
        side: screen.side,
        // A strip that cannot tell one side from the other is not drawn at all: the protocol
        // never states which side is the reader's own, and the client does not always either.
        hasReaderSide: fight.readerSide !== null,
        shelf: composeShelfRows(kept),
        isOnShelf: screen.isOnShelf,
        drill,
        place: getPlaceWords(place),
        isCollapsed: screen.isCollapsed,
    });
}

/**
 * The names a browser gives what this needs, and the whole of what it is asked for. A `Window`
 * states far more than this, which is why `userscript-boot.ts` casts once at that boundary.
 */
export interface UserscriptWindow {
    document: UserscriptDocument;
    /** How big the window is. Absent on a page that states neither, which clamps nothing. */
    innerWidth?: number | undefined;
    innerHeight?: number | undefined;
    setInterval(step: () => void, everyMs: number): number;
    clearInterval(handle: number): void;
    setTimeout(step: () => void, afterMs: number): number;
    console: { error(line: string, failure: unknown): void };
    localStorage: {
        getItem(key: string): string | null;
        setItem(key: string, value: string): void;
    };
    /** The moment as a number and as a word. A recording states the second of them. */
    Date: { now(): number; new (atMs: number): { toISOString(): string } };
    location: { hostname?: string | undefined };
    /** The clipboard is absent on a browser that lends none, which is an answer and not a fault. */
    navigator: {
        userAgent?: string | undefined;
        clipboard?: { writeText(text: string): Promise<void> } | undefined;
    };
    URL: { createObjectURL(part: unknown): string; revokeObjectURL(url: string): void };
    Blob: new (parts: readonly string[], options: { type: string }) => unknown;
}

/**
 * The document as this file asks for it, which is wider than the panel's own — the panel is
 * handed one and states its own surface.
 *
 * `createElement` answers an anchor for every tag, which is a shape only an anchor really has.
 * Nothing here reads those members off anything but an `a`, and the boundary that asserts it is
 * the one cast in `userscript-boot.ts`.
 */
export interface UserscriptDocument {
    createElement(tag: string): DownloadAnchor;
    body: { append(child: PanelElement): void };
    /** Where the client's own bundle name is, which is where the build id is. */
    querySelectorAll(selector: string): ArrayLike<{ src?: unknown }>;
}

/** What a browser is handed to save a file, and nothing wider. */
export interface DownloadAnchor extends PanelElement {
    href: string;
    download: string;
    click(): void;
    remove(): void;
}

/** The one class a reader could meet outside the panel, so it is named as ours (`SECURITY.md`). */
const DOWNLOAD_ANCHOR_CLASS = "MargoMeter-download";
/** What the game's own bundle is served as, which is the only script whose name carries a build. */
const SCRIPT_WITH_SOURCE = "script[src]";

/**
 * Which world a recording came from, or the word saying nobody knows.
 *
 * ⚠️ **`?? "unknown"` does not cover the case that happens.** A page with no hostname gives `""`,
 * and `"".split(".")[0]` is `""` — not nullish, so a recording carried a world of nothing and the
 * file was named `margometer--2026-…json`, with a hole where the answer goes. A value nobody
 * wrote must never read as an answer. Seen on a `file://` page, in v1.
 */
function getWorldFromPage(page: UserscriptWindow): string {
    const stated = page.location.hostname ?? "";
    const world = stated.split(".")[0] ?? "";
    assert(world.length >= 0, "a world read off a page is text");
    if (world.length === 0) return "unknown";
    return world;
}

function getGameBuildFromPage(page: UserscriptWindow): string | null {
    const scripts = page.document.querySelectorAll(SCRIPT_WITH_SOURCE);
    assert(scripts.length >= 0, "a page states the scripts it states, however few");
    for (let at = 0; at < scripts.length; at += 1) {
        const source = getTextFromUnknown(scripts[at]?.src) ?? "";
        const build = getGameBuildFromScriptName(source);
        if (build !== null) return build;
    }
    return null;
}

/**
 * Hands a file to the browser, which puts it wherever the reader's downloads go.
 *
 * A file rather than the clipboard: a recording runs to hundreds of kilobytes. `@grant none` is
 * no obstacle — a blob and an object URL are ordinary page APIs, not privileges, and nothing
 * leaves the browser.
 *
 * ⚠️ **The anchor goes into the document, and the URL is released on the next tick.** Clicking a
 * detached node and revoking synchronously is tolerated by Chromium and can abort the download in
 * Firefox, which reads the blob after the click returns. That failure is the worst kind available
 * here: nothing throws, the panel looks like it saved, and no file arrives. A fake document
 * exercises none of it — `click()` there does nothing — so it is checked in a browser.
 */
function writeTextToFile(page: UserscriptWindow, name: string, text: string): void {
    assert(name.length > 0, "a file handed to a browser is handed a name");
    assert(text.length > 0, "and something to put in it");
    const url = page.URL.createObjectURL(new page.Blob([text], { type: "application/json" }));
    const anchor = page.document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.className = DOWNLOAD_ANCHOR_CLASS;
    page.document.body.append(anchor);
    try {
        anchor.click();
    } finally {
        anchor.remove();
        page.setTimeout(() => page.URL.revokeObjectURL(url), 0);
    }
}

/**
 * Hands the report to the clipboard. Nothing leaves the browser: the reading boundary forbids the
 * network and says nothing about handing a person their own numbers back (`SECURITY.md`).
 *
 * The clipboard rather than a file, unlike a recording: a report is a few kilobytes and is pasted
 * into a message, where a recording runs to hundreds and is attached to one.
 *
 * ⚠️ **A refusal arrives as a rejected promise, never as a throw**, so the boundary sits on the
 * promise rather than around the call — a `try` here would catch nothing at all. What a reader
 * would get instead is the browser's own unhandled-rejection line, unbranded, in a console this
 * add-on shares with the game and with other add-ons (**E11**). **ADR 0013.**
 */
function writeTextToClipboard(page: UserscriptWindow, text: string): void {
    assert(text.length > 0, "text handed to a clipboard says something");
    const clipboard = page.navigator.clipboard;
    if (clipboard === undefined) {
        page.console.error(FAILURE_LINE, "this browser lends no clipboard");
        return;
    }
    assert(typeof clipboard.writeText === "function", "a clipboard states the way to write to it");
    clipboard.writeText(text).catch((failure: unknown) => {
        page.console.error(FAILURE_LINE, failure);
    });
}

/**
 * How big the window is, or nothing at all. A page that states one and not the other states no
 * viewport: half a size clamps a panel against a number nobody wrote.
 */
function getViewportFromPage(page: UserscriptWindow): PanelViewport | null {
    const width = getNumberFromUnknown(page.innerWidth);
    const height = getNumberFromUnknown(page.innerHeight);
    if (width === null || height === null) return null;
    assert(width >= 0, "a window is never narrower than nothing");
    assert(height >= 0, "and never shorter than nothing");
    return { width, height };
}

/**
 * Reads the globals a userscript is given and starts on them. The panel replaces the one before
 * it, so a fight redrawn leaves one panel on the page rather than a stack of them.
 */
export function startFromWindow(page: UserscriptWindow): GameAttachment {
    assert(typeof page.setInterval === "function", "a page states the clock this asks for");
    let shown: PanelElement | null = null;
    return startMargoMeter({
        page,
        document: page.document,
        schedule: {
            every: (step, everyMs) => page.setInterval(step, everyMs),
            cancel: (handle) => page.clearInterval(handle),
        },
        mount: {
            show: (panel) => {
                assert(panel !== shown, "a panel never replaces itself");
                shown?.replaceWith(panel);
                if (shown === null) page.document.body.append(panel);
                shown = panel;
            },
        },
        readViewport: () => getViewportFromPage(page),
        report: (line, failure) => page.console.error(line, failure),
        store: composeBrowserStore(page.localStorage),
        save: (name, text) => writeTextToFile(page, name, text),
        copy: (text) => writeTextToClipboard(page, text),
        readSurroundings: () => ({
            world: getWorldFromPage(page),
            gameBuild: getGameBuildFromPage(page),
            capturedAt: new page.Date(page.Date.now()).toISOString(),
            userAgent: page.navigator.userAgent ?? null,
        }),
        now: () => page.Date.now(),
    });
}

/**
 * Puts a finished fight on the shelf, once. What is kept is what the game said — the cast and the
 * messages — so a reading off the shelf is derived by the code that is running.
 */
function keepFight(
    environment: UserscriptEnvironment,
    session: BattleSession,
    kept: KeptFight[],
    place: FightPlace | null,
): void {
    const fight = getFightFromSession(session);
    if (fight === null) return;
    if (!fight.isOver) return;
    const combatants = [...fight.roster.byId.values()];
    assert(fight.isOver, "a fight is kept once it is over and not before");
    kept.push({
        openedAt: environment.now(),
        combatants,
        payloads: fight.messagesByPayload,
        place,
    });
    if (environment.store === null) return;
    // A refusal to write is an answer: the fight stays in the session and the panel keeps drawing.
    writeKeptFights(environment.store, SHELF_KEY, kept);
}

/**
 * The recording, handed to the browser as a file.
 *
 * Nothing here is redacted, and that is the design: the file carries real nicknames and the
 * game's own prose, it never enters git, and intake is where both are dealt with once
 * (`SECURITY.md`). A refusal to write leaves a mark rather than an empty file.
 */
function saveRecording(environment: UserscriptEnvironment, capture: FightCapture): void {
    const save = environment.save;
    if (save === null) return;
    const surroundings = environment.readSurroundings();
    const text = composeCaptureText(capture, surroundings);
    if (text === null) {
        environment.report(FAILURE_LINE, "a recording that would not be written as text");
        return;
    }
    assert(text.length > 0, "a recording written as text says something");
    save(composeCaptureFileName(surroundings), text);
}

/**
 * The report, handed to the clipboard.
 *
 * Handed over even where nothing has been read: a report saying there is no fight is a true
 * statement and a useful one — it says the add-on is attached and reading nothing, which is
 * otherwise the thing whoever receives it has to guess at.
 */
function copyReport(
    environment: UserscriptEnvironment,
    session: BattleSession,
    place: FightPlace | null,
): void {
    const copy = environment.copy;
    if (copy === null) return;
    const figures = composeFightFigures(session);
    const text = composeReportText(
        figures === null ? null : {
            statistics: figures.statistics,
            roster: figures.roster,
            place,
            payloads: figures.fight.payloads,
            messagesLost: figures.fight.messagesLost,
            isOver: figures.fight.isOver,
        },
        environment.readSurroundings(),
    );
    if (text === null) {
        environment.report(FAILURE_LINE, "a report that would not be written as text");
        return;
    }
    assert(text.length > 0, "a report written as text says something");
    copy(text);
}

/**
 * Starts reading, and hands back the way to stop. A second copy of the add-on stands down inside
 * the attachment, so nothing here has to know it was second.
 */
export function startMargoMeter(environment: UserscriptEnvironment): GameAttachment {
    const session = composeBattleSession();
    const store = environment.store;
    const screen = composeScreenState(store !== null && store.read(FOLD_KEY) === FOLDED);
    const kept = store === null ? [] : readKeptFights(store, SHELF_KEY);
    assert(SHELF_KEY.startsWith("MargoMeter-"), "every key this add-on writes is named as ours");
    assert(FOLD_KEY.startsWith("MargoMeter-"), "the fold included");
    const placement: PanelPlacement = {
        position: store === null ? null : getPositionFromStoredText(store.read(PLACE_KEY) ?? ""),
        getViewport: () => environment.readViewport(),
        // Once per drag rather than once per frame, and a refusal to write is an answer: the
        // panel stays where it was put and only the next visit is the poorer for it.
        handleMoved: (position: PanelPosition) => {
            store?.write(PLACE_KEY, composeStoredTextFromPosition(position));
        },
    };
    assert(PLACE_KEY.startsWith("MargoMeter-"), "and the place the reader dragged it to");
    let wasOver = false;
    assert(getFightFromSession(session) === null, "a session starts holding no fight");
    assert(FAILURE_LINE.startsWith("MargoMeter/"), "a failure of ours says whose it is first");
    // The panel goes up when the wrap goes on, and not before: a copy that stood down never gets
    // one, and a page with no game on it is left as it was found. Between that moment and the
    // first payload it says there has been no fight — a panel that draws nothing until one
    // arrives looks exactly like an add-on that died on the way to the page.
    let isMounted = false;
    // Read once, on the payload that opens a fight: the client's own state is where a place is,
    // the hero does not move while a fight is on, and reading it every payload would ask another
    // program's object graph a question whose answer cannot have changed.
    let place: FightPlace | null = null;
    const mount = (): void => {
        if (isMounted) return;
        environment.mount.show(panel.element);
        isMounted = true;
    };
    const showAndMount = (): void => {
        showFight(session, screen, panel, kept, place);
        mount();
    };
    // The recording, and the state each call is entered with. Held beside the session because it
    // is the same fight: `composeNextCapture` clears on the key `addPayloadToSession` clears on.
    let capture = composeEmptyCapture();
    let combatantsBefore: CapturedCombatant[] = [];
    const panel = composePanelHost(
        environment.document,
        (press) => {
            if (press.kind === "save") saveRecording(environment, capture);
            if (press.kind === "copy") copyReport(environment, session, place);
            if (!handlePress(screen, press)) return;
            // A refusal to write is an answer: the panel folds either way, and only the next visit
            // is the poorer for it.
            if (press.kind === "fold") store?.write(FOLD_KEY, screen.isCollapsed ? FOLDED : "");
            // A panel with no fight in it still folds, and still says what it is waiting for.
            if (getFightFromSession(session) === null) panel.showWaiting(screen.isCollapsed);
            else showFight(session, screen, panel, kept, place);
        },
        (failure) => environment.report(FAILURE_LINE, failure),
        placement,
    );
    assert(!isMounted, "nothing is on the page until a payload arrives");
    return attachToGame(environment.page, environment.schedule, {
        handleAttached: () => {
            panel.showWaiting(screen.isCollapsed);
            mount();
        },
        // The one place code of ours stands ahead of the game's own, and it reads and nothing
        // else: the state a payload is about to change is only readable before it runs.
        handleBeforeCall: (battle) => {
            combatantsBefore = composeSnapshotFromBattle(battle);
        },
        handlePayload: (payload, battle) => {
            addPayloadToSession(session, payload);
            capture = composeNextCapture(capture, {
                payload,
                messages: session.messagesByPayload.at(-1) ?? [],
                combatantsBefore,
                combatantsAfter: composeSnapshotFromBattle(battle),
            });
            const fight = getFightFromSession(session);
            if (fight !== null && fight.payloads === 1) place = getPlaceFromPage(environment.page);
            // Once, on the call that ends it: a fight put on the shelf twice is two fights.
            if (fight !== null && fight.isOver && !wasOver) {
                wasOver = true;
                keepFight(environment, session, kept, place);
            }
            if (fight !== null && !fight.isOver) wasOver = false;
            showAndMount();
        },
        handleFailure: (failure) => environment.report(FAILURE_LINE, failure),
        handleAnotherReader: () =>
            environment.report(FAILURE_LINE, "another reader holds the game"),
        handleRefusal: () => environment.report(FAILURE_LINE, "the game states no method to read"),
        handleSearchAbandoned: () => environment.report(FAILURE_LINE, "no game on this page"),
    });
}
