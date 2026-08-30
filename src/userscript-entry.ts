/**
 * Where the layers meet: the game is found, the payloads reach a session, and what the session
 * holds is drawn.
 *
 * Everything it touches is handed in — the page, the document, the clock, the place a panel goes
 * and the line a failure is written on. Nothing here reaches for a global, which is what keeps a
 * userscript's contact with its browser stated in one file and testable without one.
 */

import { assert } from "@std/assert";
import {
    type Combatant,
    type CombatantRoster,
    composeCombatantRoster,
} from "@/src/core/combatant-roster.ts";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics, type FightStatistics } from "@/src/core/fight-statistics.ts";
import { getIntegerFromText } from "@/libs/number-text.ts";
import { getNumberFromUnknown, getTextFromUnknown } from "@/libs/unknown-reading.ts";
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
import {
    type BrowserStore,
    composeBrowserStore,
    composeMemoryStore,
    type PageStorage,
} from "@/src/game/browser-store.ts";
import {
    type CaptureSurroundings,
    composeCaptureFileName,
    composeCaptureText,
    composeEmptyCapture,
    composeNextCapture,
    type FightCapture,
} from "@/src/game/fight-capture.ts";
import { type CapturedCombatant, composeSnapshotFromBattle } from "@/src/game/engine-warrior.ts";
import {
    composeKeptRotation,
    getIsEverySlotPinned,
    type KeptFight,
    readKeptFights,
    writeKeptFights,
} from "@/src/game/kept-fights.ts";
import { composeReportText } from "@/src/game/fight-report.ts";
import type { PanelDocument, PanelElement } from "@/src/ui/panel-element.ts";
import { composePanelHost, type PanelHandle, type PanelPress } from "@/src/ui/panel-element.ts";
import {
    composeDrillReading,
    composePairReading,
    composePanelReading,
    composeSkillReading,
    type DrillReading,
    getOutcomeForSeat,
    type PairReading,
    type PanelOutcome,
    type ShelfRow,
    type SkillReading,
} from "@/src/ui/panel-reading.ts";
import {
    composeScreenState,
    getScreenFromName,
    getSideFromName,
    getStorageFromName,
    type PanelStorageChoice,
    type ScreenState,
} from "@/src/ui/panel-screen.ts";
import {
    composeStoredTextFromPosition,
    getPositionFromStoredText,
    type PanelPlacement,
    type PanelPosition,
    type PanelViewport,
} from "@/src/ui/panel-drag.ts";
import {
    CHOICE_REFUSED_WARNING,
    composePlaceWords,
    EVERY_SLOT_PINNED_WARNING,
    STORE_REFUSED_WARNING,
} from "@/src/ui/panel-words.ts";

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
/** A side holds at most ten, so a fight holds twenty — the bound `core/` states for a cast. */
const MAXIMUM_COMBATANTS = 20;
const PLACE_KEY = "MargoMeter-place";
/**
 * Where the reader asked for the shelf to be kept, and it is kept beside the panel's own state
 * rather than in the store it names: a choice held where it points would be unreadable the moment
 * the reader picks the store that keeps nothing.
 */
const STORAGE_KEY = "MargoMeter-storage";
const STORAGE_DEFAULT: PanelStorageChoice = "local";

export interface PanelMount {
    show(panel: PanelElement): void;
}

export interface UserscriptEnvironment {
    page: unknown;
    readViewport(): PanelViewport | null;
    document: PanelDocument;
    schedule: Scheduler;
    mount: PanelMount;
    store: BrowserStore | null;
    /**
     * Where the shelf goes, by the reader's own answer. Never null: a browser that lends no store
     * is answered with one that forgets, so the panel is never handed nothing.
     */
    composeShelfStore(choice: PanelStorageChoice): BrowserStore;
    save: ((name: string, text: string) => void) | null;
    copy: ((text: string) => void) | null;
    readSurroundings(): CaptureSurroundings;
    now(): number;
    readClock(atMs: number): { hour: number; minute: number } | null;
    /** One branded line, and the failure itself, so a console shows whose it is first. */
    report(line: string, failure: unknown): void;
}

function getPlaceWords(place: FightPlace | null): string | null {
    if (place === null) return null;
    const words = composePlaceWords(place.mapName, place.x, place.y);
    assert(words === null || words.length > 0, "a place put into words says something");
    return words;
}

function composeShelfSizes(combatants: readonly Combatant[], readerSide: number | null): number[] {
    const countBySide = new Map<number, number>();
    assert(combatants.length <= MAXIMUM_COMBATANTS, "a fight stays inside its stated bound");
    for (const one of combatants) countBySide.set(one.side, (countBySide.get(one.side) ?? 0) + 1);
    const sides = [...countBySide].sort(([one], [other]) => {
        if (readerSide === one) return -1;
        if (readerSide === other) return 1;
        return one - other;
    });
    assert(sides.every(([, count]) => count > 0), "a side that is counted has somebody on it");
    return sides.map(([, count]) => count);
}

/**
 * The three sentences it can say are the three ways keeping a fight goes wrong, and each is a
 * different remedy: make room, unpin something, or nothing at all.
 */
interface ShelfKeeper {
    fights: KeptFight[];
    choice: PanelStorageChoice;
    hasStoreRefused: boolean;
    isEverySlotPinned: boolean;
    hasChoiceRefused: boolean;
    keep(fight: KeptFight): void;
    setPinned(openedAt: number): void;
    setChoice(choice: PanelStorageChoice): void;
}

function composeShelfWarnings(keeper: ShelfKeeper): string[] {
    const warnings: string[] = [];
    if (keeper.isEverySlotPinned) warnings.push(EVERY_SLOT_PINNED_WARNING);
    if (keeper.hasStoreRefused) warnings.push(STORE_REFUSED_WARNING);
    if (keeper.hasChoiceRefused) warnings.push(CHOICE_REFUSED_WARNING);
    assert(warnings.length <= 3, "a shelf says at most the three things that can go wrong");
    return warnings;
}

function composeShelfKeeper(environment: UserscriptEnvironment): ShelfKeeper {
    assert(STORAGE_KEY.startsWith("MargoMeter-"), "the reader's answer is kept under our name");
    const settings = environment.store;
    const answered = settings === null ? "" : settings.read(STORAGE_KEY) ?? "";
    const choice = getStorageFromName(answered) ?? STORAGE_DEFAULT;
    let store = environment.composeShelfStore(choice);
    const keeper: ShelfKeeper = {
        fights: readKeptFights(store, SHELF_KEY),
        choice,
        hasStoreRefused: false,
        isEverySlotPinned: false,
        hasChoiceRefused: false,
        keep(fight: KeptFight): void {
            assert(fight.openedAt >= 0, "a fight goes on the shelf under the moment it opened");
            // A fight kept a second time keeps the pin it was given: that is the reader's answer
            // and not something a later payload may revoke.
            const before = keeper.fights.find((one) => one.openedAt === fight.openedAt);
            const held = keeper.fights.filter((one) => one.openedAt !== fight.openedAt);
            const next = [...held, { ...fight, isPinned: before?.isPinned ?? fight.isPinned }];
            keeper.isEverySlotPinned = getIsEverySlotPinned(next);
            if (keeper.isEverySlotPinned) return;
            keeper.fights = composeKeptRotation(next);
            assert(keeper.fights.length > 0, "a shelf that took a fight holds one");
            keeper.hasStoreRefused = !writeKeptFights(store, SHELF_KEY, keeper.fights);
        },
        setPinned(openedAt: number): void {
            assert(Number.isSafeInteger(openedAt), "a fight is pinned by the moment it opened");
            keeper.fights = keeper.fights.map((one) =>
                one.openedAt === openedAt ? { ...one, isPinned: !one.isPinned } : one
            );
            keeper.hasStoreRefused = !writeKeptFights(store, SHELF_KEY, keeper.fights);
        },
        setChoice(next: PanelStorageChoice): void {
            assert(next.length > 0, "a shelf is moved to a place that is named");
            if (next === keeper.choice) return;
            // The answer is written down before anything is done about it: acting on a refused
            // one leaves the reader's fights, pinned ones included, in a place the next page
            // will never look in, under a panel drawing the choice as taken.
            const isWritten = settings !== null && settings.write(STORAGE_KEY, next);
            keeper.hasChoiceRefused = !isWritten;
            if (!isWritten) return;
            // What was kept moves, and the place it came from is emptied: a reader who asks for
            // the store that keeps nothing is saying they want nothing left behind, and the
            // fights themselves travel because they are the reader's.
            store.remove(SHELF_KEY);
            keeper.choice = next;
            store = environment.composeShelfStore(next);
            keeper.hasStoreRefused = !writeKeptFights(store, SHELF_KEY, keeper.fights);
        },
    };
    assert(keeper.fights.length >= 0, "a shelf read back holds the fights it holds");
    return keeper;
}

/**
 * The live one is always a row, because a shelf that hid it would answer *which fight am I
 * reading* with a list the answer is not on.
 */
function composeShelfRows(
    kept: readonly KeptFight[],
    live: {
        fight: FightReading;
        place: FightPlace | null;
        openedAt: number;
        outcome: PanelOutcome | null;
    } | null,
    chosenId: number | null,
    readClock: (atMs: number) => { hour: number; minute: number } | null,
): ShelfRow[] {
    assert(typeof readClock === "function", "a shelf row is timed by the reader's own clock");
    assert(kept.length >= 0, "and a shelf holds the fights it holds");
    const rows: ShelfRow[] = [];
    // One row for one fight: the one that has just ended is both the live one and a kept one
    // until the next begins. It keeps the live row's wording and the kept row's pin.
    const alsoKept = live === null ? undefined : kept.find((one) => one.openedAt === live.openedAt);
    if (live !== null) {
        rows.push({
            openedAt: live.openedAt,
            at: readClock(live.openedAt),
            sizes: composeShelfSizes([...live.fight.roster.byId.values()], live.fight.readerSide),
            place: getPlaceWords(live.place),
            outcome: live.outcome,
            isLive: true,
            isChosen: chosenId === null || chosenId === alsoKept?.openedAt,
            isPinned: alsoKept?.isPinned ?? false,
            // A fight nothing has written down yet is not in the store and the rotation has never
            // seen it, so a pin on it would be a control that does nothing.
            isPinnable: alsoKept !== undefined,
        });
    }
    for (const one of [...kept].sort((first, other) => other.openedAt - first.openedAt)) {
        if (one.openedAt === alsoKept?.openedAt) continue;
        rows.push({
            openedAt: one.openedAt,
            at: readClock(one.openedAt),
            sizes: composeShelfSizes(one.combatants, one.readerSide),
            place: getPlaceWords(one.place),
            outcome: getOutcomeForKept(one),
            isLive: false,
            isChosen: chosenId === one.openedAt,
            isPinned: one.isPinned,
            isPinnable: true,
        });
    }
    assert(rows.length >= kept.length, "a shelf draws a row for each fight it holds");
    assert(rows.every((one) => one.place !== ""), "and a row that says where was fought says it");
    return rows;
}

function getOutcomeForFigures(figures: FightFigures): PanelOutcome | null {
    assert(figures.roster.byId.size >= 0, "a fight is called against the cast that fought it");
    const outcome = figures.statistics.outcome;
    if (outcome === null) return null;
    return getOutcomeForSeat(outcome, figures.roster, figures.fight.readerSide);
}

function getOutcomeForKept(kept: KeptFight): PanelOutcome | null {
    assert(kept.openedAt >= 0, "a fight kept was kept at a moment");
    assert(kept.combatants.length >= 0, "and by a cast, however small");
    if (kept.outcome === null) return null;
    const roster = composeCombatantRoster(kept.combatants);
    return getOutcomeForSeat(kept.outcome, roster, kept.readerSide);
}

/**
 * Where a press leaves the panel. False for a press that moves nothing, so a stray attribute in
 * the game's own markup never costs a redraw, let alone puts the panel somewhere it cannot draw.
 */
function setFightChosen(screen: ScreenState, openedAt: number | null): void {
    assert(openedAt === null || Number.isSafeInteger(openedAt), "a fight is asked for by moment");
    screen.openFightId = openedAt;
    screen.isOnShelf = false;
    screen.openRowId = null;
    screen.openPairId = null;
    screen.openSkillName = null;
    assert(screen.openRowId === null, "and nothing of the last one stands over the new one");
}

function setShelfFromPress(shelf: ShelfKeeper, press: PanelPress): boolean {
    assert(press.kind.length > 0, "a press says what it asks for");
    if (press.kind === "pin") {
        const openedAt = getIntegerFromText(press.stated);
        if (openedAt === null) return false;
        shelf.setPinned(openedAt);
        return true;
    }
    if (press.kind !== "storage") return false;
    const choice = getStorageFromName(press.name);
    if (choice === null) return false;
    shelf.setChoice(choice);
    return true;
}

function handlePress(screen: ScreenState, press: PanelPress): boolean {
    assert(press.kind.length > 0, "a press says what it asks for");
    assert(screen.current.length > 0, "and lands on a panel that is on a screen");
    if (press.kind === "save") return false;
    if (press.kind === "copy") return false;
    if (press.kind === "pin") return false;
    if (press.kind === "storage") return false;
    if (press.kind === "fold") {
        screen.isCollapsed = !screen.isCollapsed;
        return true;
    }
    if (press.kind === "shelf") {
        screen.isOnShelf = !screen.isOnShelf;
        return true;
    }
    if (press.kind === "back") {
        if (screen.isOnShelf) screen.isOnShelf = false;
        else if (screen.openPairId !== null) screen.openPairId = null;
        else screen.openRowId = null;
        return true;
    }
    if (press.kind === "fight") {
        setFightChosen(screen, getIntegerFromText(press.stated));
        return true;
    }
    if (press.kind === "skill") {
        screen.openSkillName = press.name;
        return true;
    }
    if (press.kind === "row") {
        const opened = getIntegerFromText(press.stated);
        if (opened === null) return false;
        // Not a toggle, unlike the shelf's tab: an opened row covers the screen it was opened on,
        // so the row that would close it is not on the panel to be pressed a second time. A press
        // inside an opened row is the rung under it — the pair of the two of them.
        if (screen.openRowId === null) screen.openRowId = opened;
        else screen.openPairId = opened;
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
        screen.openPairId = null;
        return true;
    }
    const reached = getScreenFromName(press.screen);
    if (reached === null) return false;
    screen.current = reached;
    screen.isOnShelf = false;
    // The person stays and the pair does not: which end of a pair a figure belongs to is the
    // direction's, so carrying one across the flip would open a pair on the wrong side of it.
    screen.openPairId = null;
    // The opened row stays. A reader who went into somebody is reading **that somebody**, and the
    // strips are how they ask the next question about them: the combatant exists on every screen,
    // which is what makes this different from narrowing to a side they may not be on.
    return true;
}

interface FightFigures {
    fight: FightReading;
    roster: CombatantRoster;
    statistics: FightStatistics;
}

/**
 * A fight off the shelf, read from what was kept of it: the cast and the messages, decoded by the
 * code that is running rather than restored from an older version's arithmetic.
 */
function composeKeptFigures(kept: KeptFight): FightFigures {
    assert(kept.combatants.length <= MAXIMUM_COMBATANTS, "a fight kept stays inside the bound");
    const roster = composeCombatantRoster(kept.combatants);
    const events = kept.payloads.flatMap((one) => decodeFightMessages([...one], roster));
    assert(kept.payloads.length >= 0, "a fight kept was kept payload by payload");
    assert(events.length >= 0, "and decodes to a list, however short");
    return {
        fight: {
            roster,
            events,
            messagesByPayload: kept.payloads,
            // Kept rather than recounted: replaying what arrived cannot show what did not.
            messagesLost: kept.messagesLost,
            hasJoinedInProgress: kept.hasJoinedInProgress,
            isOver: true,
            payloads: kept.payloads.length,
            readerSide: kept.readerSide,
        },
        roster,
        statistics: composeFightStatistics(events, composeTeamHeals(events, roster)),
    };
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
    shelf: ShelfKeeper,
    place: FightPlace | null,
    readClock: (atMs: number) => { hour: number; minute: number } | null,
    openedAt: number,
): void {
    const live = composeFightFigures(session);
    if (live === null) return;
    const chosen = screen.openFightId === null
        ? null
        : shelf.fights.find((one) => one.openedAt === screen.openFightId) ?? null;
    const figures = chosen === null ? live : composeKeptFigures(chosen);
    const { fight, roster, statistics } = figures;
    const reading = composePanelReading(
        statistics,
        roster,
        screen.current,
        screen.side,
        fight.readerSide,
        { messagesLost: fight.messagesLost, hasJoinedInProgress: fight.hasJoinedInProgress },
    );
    assert(reading.rows.length >= 0, "a reading states its rows, however few");
    const { drill, pair, skill } = composeOpenedReadings(figures, screen);
    panel.show({
        reading,
        current: screen.current,
        side: screen.side,
        // A strip that cannot tell one side from the other is not drawn at all: the protocol
        // never states which side is the reader's own, and the client does not always either.
        hasReaderSide: fight.readerSide !== null,
        shelf: composeShelfRows(
            shelf.fights,
            {
                fight: live.fight,
                place,
                openedAt,
                outcome: getOutcomeForFigures(live),
            },
            screen.openFightId,
            readClock,
        ),
        storage: shelf.choice,
        shelfWarnings: composeShelfWarnings(shelf),
        isOnShelf: screen.isOnShelf,
        drill,
        pair,
        skill,
        place: getPlaceWords(chosen === null ? place : chosen.place),
        isCollapsed: screen.isCollapsed,
    });
}

interface OpenedReadings {
    drill: DrillReading | null;
    pair: PairReading | null;
    skill: SkillReading | null;
}

function composeOpenedReadings(figures: FightFigures, screen: ScreenState): OpenedReadings {
    const { roster, statistics } = figures;
    assert(screen.current.length > 0, "a rung is opened on a screen the panel is on");
    assert(
        screen.openPairId === null || screen.openRowId !== null,
        "a pair is opened from inside somebody, never on its own",
    );
    const drill = screen.openRowId === null
        ? null
        : composeDrillReading(statistics, roster, screen.current, screen.openRowId);
    // A row nobody in the fight is on opens nothing, and nothing under it stands either: the
    // rungs below a row that could not be read are rungs of no figure.
    if (drill === null) return { drill: null, pair: null, skill: null };
    assert(drill.total >= 0, "an opened figure is not below nothing");
    const pair = screen.openPairId === null ? null : composePairReading(
        statistics,
        roster,
        screen.current,
        drill.combatantId,
        screen.openPairId,
    );
    const skill = screen.openSkillName === null ? null : composeSkillReading(
        statistics,
        roster,
        screen.current,
        drill.combatantId,
        screen.openSkillName,
    );
    return { drill, pair, skill };
}

/**
 * The names a browser gives what this needs, and the whole of what it is asked for. A `Window`
 * states far more than this, which is why `userscript-boot.ts` casts once at that boundary.
 */
export interface UserscriptWindow {
    document: UserscriptDocument;
    innerWidth?: number | undefined;
    innerHeight?: number | undefined;
    setInterval(step: () => void, everyMs: number): number;
    clearInterval(handle: number): void;
    setTimeout(step: () => void, afterMs: number): number;
    console: { error(line: string, failure: unknown): void };
    /**
     * The two a browser lends, and both optional: a private window or a third-party-storage rule
     * is a page with neither, and that is a page this add-on still works on.
     */
    localStorage?: PageStorage | undefined;
    sessionStorage?: PageStorage | undefined;
    Date: {
        now(): number;
        new (atMs: number): {
            toISOString(): string;
            /** Absent on a document that lends no clock of its own, which answers no time. */
            getHours?(): number;
            getMinutes?(): number;
        };
    };
    location: { hostname?: string | undefined };
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
    querySelectorAll(selector: string): ArrayLike<{ src?: unknown }>;
}

export interface DownloadAnchor extends PanelElement {
    href: string;
    download: string;
    click(): void;
    remove(): void;
}

/** The one class a reader could meet outside the panel, so it is named as ours (`SECURITY.md`). */
const DOWNLOAD_ANCHOR_CLASS = "MargoMeter-download";
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
 * A moment on the reader's own clock, as the hour and the minute it fell on.
 *
 * Read through the page's own `Date`, which is the one clock a userscript has, and answered as
 * null where it will not read one: a row with no time says nothing rather than saying `00:00`,
 * which is a reading of nothing wearing the shape of one.
 */
function getClockFromPage(
    page: UserscriptWindow,
    atMs: number,
): { hour: number; minute: number } | null {
    assert(typeof page.Date === "function" || typeof page.Date === "object", "a page has a clock");
    if (!Number.isFinite(atMs)) return null;
    const held = new page.Date(atMs);
    const hour = getNumberFromUnknown(held.getHours?.());
    const minute = getNumberFromUnknown(held.getMinutes?.());
    if (hour === null || minute === null) return null;
    assert(hour >= 0, "an hour on a clock is not below nothing");
    assert(minute >= 0, "and neither is a minute");
    return { hour, minute };
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
 * The store the reader asked for, or the one that always works.
 *
 * Falling back to what forgets rather than to the other browser store: a reader who chose to keep
 * fights for good on a browser that lends no store is better served by a panel that forgets
 * between pages than by one that quietly keeps their fights somewhere they did not choose.
 *
 * Reaching the property is itself a read that can throw — a browser forbidding storage does not
 * hand back `undefined`, it throws on the access, before there is anything to call `getItem` on —
 * so the page is asked inside the `try` and not before it.
 */
function composeStoreForChoice(page: UserscriptWindow, choice: PanelStorageChoice): BrowserStore {
    assert(choice.length > 0, "a store is asked for by the name of a place");
    if (choice === "memory") return composeMemoryStore();
    try {
        const storage = choice === "local" ? page.localStorage : page.sessionStorage;
        if (storage === undefined) return composeMemoryStore();
        return composeBrowserStore(storage);
    } catch {
        // A browser that will not say whether it has a store has none, which is an answer.
        return composeMemoryStore();
    }
}

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
        store: composeStoreForChoice(page, STORAGE_DEFAULT),
        composeShelfStore: (choice) => composeStoreForChoice(page, choice),
        save: (name, text) => writeTextToFile(page, name, text),
        copy: (text) => writeTextToClipboard(page, text),
        readSurroundings: () => ({
            world: getWorldFromPage(page),
            gameBuild: getGameBuildFromPage(page),
            capturedAt: new page.Date(page.Date.now()).toISOString(),
            userAgent: page.navigator.userAgent ?? null,
        }),
        now: () => page.Date.now(),
        readClock: (atMs) => getClockFromPage(page, atMs),
    });
}

/**
 * Puts a finished fight on the shelf, once. What is kept is what the game said — the cast and the
 * messages — so a reading off the shelf is derived by the code that is running.
 */
function keepFight(
    session: BattleSession,
    shelf: ShelfKeeper,
    place: FightPlace | null,
    openedAt: number,
): void {
    const fight = getFightFromSession(session);
    if (fight === null) return;
    if (!fight.isOver) return;
    const combatants = [...fight.roster.byId.values()];
    assert(fight.isOver, "a fight is kept once it is over and not before");
    assert(openedAt >= 0, "a fight is kept under the moment it opened");
    shelf.keep({
        openedAt,
        combatants,
        payloads: fight.messagesByPayload,
        place,
        // What the client said and what the game said, kept as they were said: a row on the shelf
        // states how the fight went, and deriving that would mean decoding it again to draw it.
        readerSide: fight.readerSide,
        outcome: composeFightFigures(session)?.statistics.outcome ?? null,
        isPinned: false,
        messagesLost: fight.messagesLost,
        hasJoinedInProgress: fight.hasJoinedInProgress,
    });
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

export function startMargoMeter(environment: UserscriptEnvironment): GameAttachment {
    const session = composeBattleSession();
    const store = environment.store;
    const screen = composeScreenState(store !== null && store.read(FOLD_KEY) === FOLDED);
    const shelf = composeShelfKeeper(environment);
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
    // one, and a page with no game on it is left as it was found.
    let isMounted = false;
    // Read once, on the payload that opens a fight: the client's own state is where a place is,
    // the hero does not move while a fight is on, and reading it every payload would ask another
    // program's object graph a question whose answer cannot have changed.
    let place: FightPlace | null = null;
    let liveOpenedAt = 0;
    const mount = (): void => {
        if (isMounted) return;
        environment.mount.show(panel.element);
        isMounted = true;
    };
    const draw = (): void => {
        assert(screen.current.length > 0, "a draw is of a panel that is on a screen");
        assert(liveOpenedAt >= 0, "and of a fight that opened at a moment, or has not opened");
        showFight(session, screen, panel, shelf, place, environment.readClock, liveOpenedAt);
    };
    const showAndMount = (): void => {
        draw();
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
            const isShelfPress = setShelfFromPress(shelf, press);
            if (!isShelfPress && !handlePress(screen, press)) return;
            // A refusal to write is an answer: the panel folds either way, and only the next visit
            // is the poorer for it.
            if (press.kind === "fold") store?.write(FOLD_KEY, screen.isCollapsed ? FOLDED : "");
            if (getFightFromSession(session) === null) panel.showWaiting(screen.isCollapsed);
            else draw();
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
            if (fight !== null && fight.payloads === 1) {
                place = getPlaceFromPage(environment.page);
                liveOpenedAt = environment.now();
            }
            // Once, on the call that ends it: a fight put on the shelf twice is two fights.
            if (fight !== null && fight.isOver && !wasOver) {
                wasOver = true;
                keepFight(session, shelf, place, liveOpenedAt);
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
