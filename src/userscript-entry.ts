/**
 * Where the layers meet: the game is found, the payloads reach a session, and what the session
 * holds is drawn.
 *
 * Everything it touches is handed in — the page, the document, the clock, the place a panel goes
 * and the line a failure is written on. Nothing here reaches for a global, which is what keeps a
 * userscript's contact with its browser stated in one file and testable without one.
 */

import {
    type Combatant,
    type CombatantRoster,
    composeCombatantRoster,
} from "@/src/core/combatant-roster.ts";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import { composeFightStatistics, type FightStatistics } from "@/src/core/fight-statistics.ts";
import { getIntegerFromText } from "@/libs/number-text.ts";
import { getNumberFromUnknown, getTextFromUnknown, isRecord } from "@/libs/unknown-reading.ts";
import { MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import {
    addPayloadToSession,
    type BattleSession,
    composeBattleSession,
    type FightReading,
    getFightFromSession,
} from "@/src/game/battle-session.ts";
import { attachToGame, type GameAttachment, type Scheduler } from "@/src/game/engine-attachment.ts";
import type { EngineBattle } from "@/src/game/engine-battle-wrap.ts";
import { type FightPlace, readPlaceFromPage } from "@/src/game/engine-place.ts";
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
    MAXIMUM_KEPT,
    readKeptFights,
    type ShelfWriting,
    writeKeptFights,
} from "@/src/game/kept-fights.ts";
import type { ReportSubject } from "@/src/game/fight-report.ts";
import { readDictionaryFromPage } from "@/src/game/game-dictionary.ts";
import type { PanelDocument, PanelElement } from "@/src/ui/panel-element.ts";
import { composeDefectKeeper, type KeptDefects } from "@/src/ui/panel-defect.ts";
import { composePanelHost, type PanelHandle, type PanelPress } from "@/src/ui/panel-element.ts";
import {
    composeDrillReading,
    composeHalfNamedDrillReading,
    composeHalfNamedReading,
    composePairReading,
    composePanelReading,
    composePartReading,
    type DrillReading,
    getOutcomeForSeat,
    getPinnedCase,
    type HalfNamedDrillReading,
    type HalfNamedOpened,
    type HalfNamedReading,
    type PairReading,
    type PanelOutcome,
    type PanelReading,
    type PartReading,
    type ShelfRow,
} from "@/src/ui/panel-reading.ts";
import {
    composeListName,
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
    STORE_MADE_ROOM_WARNING,
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
    readSurroundings(): CaptureSurroundings;
    now(): number;
    readClock(atMilliseconds: number): { hour: number; minute: number } | null;
    /** One branded line, and the failure itself, so a console shows whose it is first. */
    report(line: string, failure: unknown): void;
}

function getPlaceWords(place: FightPlace | null): string | null {
    if (place === null) return null;
    const words = composePlaceWords(place.mapName, place.x, place.y);
    return words;
}

function composeShelfSizes(combatants: readonly Combatant[], readerSide: number | null): number[] {
    const countBySide = new Map<number, number>();
    combatants = combatants.slice(0, MAXIMUM_COMBATANTS);
    for (const one of combatants) countBySide.set(one.side, (countBySide.get(one.side) ?? 0) + 1);
    const sides = [...countBySide].sort(([one], [other]) => {
        if (readerSide === one) return -1;
        if (readerSide === other) return 1;
        return one - other;
    });
    return sides.map(([, count]) => count);
}

interface FightFigures {
    fight: FightReading;
    roster: CombatantRoster;
    statistics: FightStatistics;
}

interface KeptFigures {
    read(fight: KeptFight): FightFigures | null;
    forget(openedAt: number): void;
    keepOnly(fights: readonly KeptFight[]): void;
}

/**
 * The figures of a fight on the shelf, derived once and held for as long as the tab is.
 *
 * A row states an outcome and the sizes of the sides, and `draw()` runs on every payload the game
 * delivers — 117 per fight over `captures/`, 2026-08-30. Twenty rows derived cost 34.5 ms there,
 * so a shelf drawn without this is four seconds of decoding per fight. In memory and never in the
 * store: a figure that survives a reload is a figure an older version computed. **ADR 0026.**
 */
function composeKeptFigureMemo(): KeptFigures {
    const held = new Map<number, FightFigures>();
    return {
        read(fight: KeptFight): FightFigures | null {
            const before = held.get(fight.openedAt);
            if (before !== undefined) return before;
            const figures = composeKeptFigures(fight);
            if (figures === null) return null;
            if (held.size < MAXIMUM_KEPT) held.set(fight.openedAt, figures);
            return figures;
        },
        forget(openedAt: number): void {
            held.delete(openedAt);
        },
        keepOnly(fights: readonly KeptFight[]): void {
            for (const openedAt of [...held.keys()]) {
                if (fights.some((one) => one.openedAt === openedAt)) continue;
                held.delete(openedAt);
            }
        },
    };
}

/**
 * The sentences it can say are the ways keeping a fight goes wrong, and each is a different
 * remedy: unpin something, pin what is worth keeping, or nothing at all. A store that took the
 * fight and asked for room is not the same answer as one that took nothing.
 */
interface ShelfKeeper {
    fights: KeptFight[];
    choice: PanelStorageChoice;
    hasStoreRefused: boolean;
    hasStoreMadeRoom: boolean;
    isEverySlotPinned: boolean;
    hasChoiceRefused: boolean;
    /** Derived through the live chain and memoised, never read out of the store. */
    /** Null for a fight the payloads no longer read, which is a fight to stand on no longer. */
    readFigures(fight: KeptFight): FightFigures | null;
    keep(fight: KeptFight): void;
    setPinned(openedAt: number): void;
    setChoice(choice: PanelStorageChoice): void;
}

/** The four things that can go wrong with a shelf, of which at most three ever hold at once. */
const MAXIMUM_SHELF_WARNINGS = 3;

function composeShelfWarnings(keeper: ShelfKeeper): string[] {
    const warnings: string[] = [];
    if (keeper.isEverySlotPinned) warnings.push(EVERY_SLOT_PINNED_WARNING);
    if (keeper.hasStoreRefused) warnings.push(STORE_REFUSED_WARNING);
    if (keeper.hasStoreMadeRoom) warnings.push(STORE_MADE_ROOM_WARNING);
    if (keeper.hasChoiceRefused) warnings.push(CHOICE_REFUSED_WARNING);
    return warnings.slice(0, MAXIMUM_SHELF_WARNINGS);
}

function composeShelfKeeper(environment: UserscriptEnvironment): ShelfKeeper {
    const settings = environment.store;
    const answered = settings === null ? "" : settings.read(STORAGE_KEY) ?? "";
    const choice = getStorageFromName(answered) ?? STORAGE_DEFAULT;
    let store = environment.composeShelfStore(choice);
    const figures = composeKeptFigureMemo();
    const setWritten = (writing: ShelfWriting, offered: number): void => {
        keeper.hasStoreRefused = !writing.isOk;
        // What went down is what is drawn: a store that asked for less leaves the panel showing
        // the shelf a reload will find, not the one it was handed.
        keeper.hasStoreMadeRoom = writing.isOk && writing.fights.length < offered;
        if (writing.isOk) keeper.fights = writing.fights;
        figures.keepOnly(keeper.fights);
    };
    const keeper: ShelfKeeper = {
        fights: readKeptFights(store, SHELF_KEY),
        choice,
        hasStoreRefused: false,
        hasStoreMadeRoom: false,
        isEverySlotPinned: false,
        hasChoiceRefused: false,
        readFigures: (fight: KeptFight) => figures.read(fight),
        keep(fight: KeptFight): void {
            // A fight kept a second time keeps the pin it was given: that is the reader's answer
            // and not something a later payload may revoke.
            const before = keeper.fights.find((one) => one.openedAt === fight.openedAt);
            const held = keeper.fights.filter((one) => one.openedAt !== fight.openedAt);
            const next = [...held, { ...fight, isPinned: before?.isPinned ?? fight.isPinned }];
            keeper.isEverySlotPinned = getIsEverySlotPinned(next);
            if (keeper.isEverySlotPinned) return;
            keeper.fights = composeKeptRotation(next);
            // Unreachable while `now()` is monotonic, and kept because keeping the pin above
            // defends the reader against that very case: two fights under one moment.
            figures.forget(fight.openedAt);
            const offered = keeper.fights.length;
            setWritten(writeKeptFights(store, SHELF_KEY, keeper.fights), offered);
        },
        setPinned(openedAt: number): void {
            if (!Number.isSafeInteger(openedAt)) return;
            keeper.fights = keeper.fights.map((one) =>
                one.openedAt === openedAt ? { ...one, isPinned: !one.isPinned } : one
            );
            const offered = keeper.fights.length;
            setWritten(writeKeptFights(store, SHELF_KEY, keeper.fights), offered);
        },
        setChoice(next: PanelStorageChoice): void {
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
            const offered = keeper.fights.length;
            setWritten(writeKeptFights(store, SHELF_KEY, keeper.fights), offered);
        },
    };
    keeper.fights = keeper.fights.slice(0, MAXIMUM_KEPT);
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
    readClock: (atMilliseconds: number) => { hour: number; minute: number } | null,
    readFigures: (fight: KeptFight) => FightFigures | null,
): ShelfRow[] {
    kept = kept.slice(0, MAXIMUM_KEPT);
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
            // Whether a fight can be pinned at all is `ui/panel-reading.ts`'s to say, and why.
            isPinnable: alsoKept !== undefined,
        });
    }
    for (const one of [...kept].sort((first, other) => other.openedAt - first.openedAt)) {
        if (one.openedAt === alsoKept?.openedAt) continue;
        const figures = readFigures(one);
        // A row for a fight nothing can be read out of would state a headcount and an outcome it
        // does not have. The shelf is one row shorter instead (**E14**).
        if (figures === null) continue;
        rows.push({
            openedAt: one.openedAt,
            at: readClock(one.openedAt),
            sizes: composeShelfSizes(
                [...figures.roster.byId.values()],
                figures.fight.readerSide,
            ),
            place: getPlaceWords(one.place),
            outcome: getOutcomeForFigures(figures),
            isLive: false,
            isChosen: chosenId === one.openedAt,
            isPinned: one.isPinned,
            isPinnable: true,
        });
    }
    return rows;
}

function getOutcomeForFigures(figures: FightFigures): PanelOutcome | null {
    const outcome = figures.statistics.outcome;
    if (outcome === null) return null;
    return getOutcomeForSeat(outcome, figures.roster, figures.fight.readerSide);
}

/**
 * Where a press leaves the panel. False for a press that moves nothing, so a stray attribute in
 * the game's own markup never costs a redraw, let alone puts the panel somewhere it cannot draw.
 */
function setFightChosen(screen: ScreenState, openedAt: number | null): void {
    screen.openFightId = openedAt;
    screen.isOnShelf = false;
    screen.openRowId = null;
    screen.openUnnamedEnd = null;
    screen.openPairId = null;
    screen.openPart = null;
}

function setShelfFromPress(shelf: ShelfKeeper, press: PanelPress): boolean {
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
    if (press.kind === "save") return false;
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
        handlePressBack(screen);
        return true;
    }
    if (press.kind === "fight") {
        setFightChosen(screen, getIntegerFromText(press.stated));
        return true;
    }
    if (press.kind === "part") {
        screen.openPart = press.part;
        return true;
    }
    if (press.kind === "unnamed") {
        screen.openUnnamedEnd = press.end;
        return true;
    }
    if (press.kind === "row") {
        const opened = getIntegerFromText(press.stated);
        if (opened === null) return false;
        // Not a toggle, unlike the shelf's tab: an opened row covers the screen it was opened on,
        // so the row that would close it is not on the panel to be pressed a second time. A press
        // inside an opened row is the rung under it — the pair of the two of them.
        // Three places a person's row stands, and the rung under it is the same field in two of
        // them: inside somebody's figure it is the pair, under a pinned row it is that person's
        // own share of what nobody was named for.
        if (screen.openRowId !== null) screen.openPairId = opened;
        else if (screen.openUnnamedEnd !== null) screen.openPairId = opened;
        else screen.openRowId = opened;
        return true;
    }
    if (press.kind === "side") return handlePressSide(screen, press.side);
    return handlePressScreen(screen, press.screen);
}

/**
 * One rung at a time, and the part before the pair: the two are both a press away from the opened
 * row, so a way back that skipped the part left the reader on the ranking while the crumb beside
 * it named the person they had opened.
 */
function handlePressBack(screen: ScreenState): void {
    if (screen.isOnShelf) {
        screen.isOnShelf = false;
        return;
    }
    if (screen.openPart !== null) {
        screen.openPart = null;
        return;
    }
    if (screen.openPairId !== null) {
        screen.openPairId = null;
        return;
    }
    // The two cannot both be open — a pinned row is drawn under the ranking, so a reader inside
    // somebody's figure has none to press — and closing both says so once.
    screen.openRowId = null;
    screen.openUnnamedEnd = null;
}

function handlePressSide(screen: ScreenState, said: string): boolean {
    const chosen = getSideFromName(said);
    if (chosen === null) return false;
    screen.side = chosen;
    screen.isOnShelf = false;
    // A side decides who is on the list, so a row opened before it was narrowed may not be on
    // the list any more — and a cut standing over a list nobody is on says nothing.
    screen.openRowId = null;
    screen.openUnnamedEnd = null;
    screen.openPairId = null;
    screen.openPart = null;
    return true;
}

function handlePressScreen(screen: ScreenState, said: string): boolean {
    const reached = getScreenFromName(said);
    if (reached === null) return false;
    screen.current = reached;
    screen.isOnShelf = false;
    // The person stays and the pair does not: which end of a pair a figure belongs to is the
    // direction's, so carrying one across the flip would open a pair on the wrong side of it.
    // A part of a cut goes with it, and for more than that reason: a kind stands on no healing
    // screen and a key on no damage one, so a mark carried across the flip names a row the
    // screen it landed on does not draw.
    screen.openPairId = null;
    screen.openPart = null;
    // And so does a pinned row, for the sharper form of the same reason: the four screens pin
    // five different figures, so `Nieznany sprawca` on one screen is not the row of that name on
    // the next, and carrying the mark across would answer a question nobody asked.
    screen.openUnnamedEnd = null;
    // The opened row stays. A reader who went into somebody is reading **that somebody**, and the
    // strips are how they ask the next question about them: the combatant exists on every screen,
    // which is what makes this different from narrowing to a side they may not be on.
    return true;
}

/**
 * A fight off the shelf, through the chain the live one goes through: the payloads were kept, so
 * the figures are this version's rather than the version that watched the fight. **ADR 0026.**
 */
function composeKeptFigures(kept: KeptFight): FightFigures | null {
    const session = composeBattleSession();
    for (const payload of kept.payloads) addPayloadToSession(session, payload);
    return composeFightFigures(session);
}

/**
 * The figures, derived rather than kept: what a session holds is what the game said, so the two
 * readers of it are never looking at arithmetic one of them did earlier.
 */
function composeFightFigures(session: BattleSession): FightFigures | null {
    const fight = getFightFromSession(session);
    if (fight === null) return null;
    const roster = composeCombatantRoster([...fight.roster.byId.values()]);
    const statistics = composeFightStatistics(fight.events, composeTeamHeals(fight.events, roster));
    return { fight, roster, statistics };
}

/** The newest fight on the shelf, or nothing where it holds none. */
function getNewestKeptFight(fights: readonly KeptFight[]): KeptFight | null {
    let newest: KeptFight | null = null;
    for (const one of fights) {
        if (newest === null) newest = one;
        else if (one.openedAt > newest.openedAt) newest = one;
    }
    return newest;
}

/**
 * The fight the panel draws, and the kept one it was read off where that is what it is.
 *
 * A page between fights has no live reading and the shelf is what it has instead, which is the
 * whole of why the newest kept one is an answer here. **ADR 0033.**
 */
function getStandingFight(
    live: FightFigures | null,
    screen: ScreenState,
    shelf: ShelfKeeper,
): { figures: FightFigures; kept: KeptFight | null } | null {
    const chosen = screen.openFightId === null
        ? null
        : shelf.fights.find((one) => one.openedAt === screen.openFightId) ?? null;
    const kept = chosen ?? (live === null ? getNewestKeptFight(shelf.fights) : null);
    if (kept !== null) {
        const figures = shelf.readFigures(kept);
        // A fight the payloads no longer read is no fight to stand on, and the panel waits rather
        // than drawing a shelf row's worth of nothing (**E14**).
        if (figures === null) return null;
        return { figures, kept };
    }
    if (live === null) return null;
    return { figures: live, kept: null };
}

/**
 * Composing a screen out of a fight, guarded. Everything under here reaches `core/`, which throws
 * (**E7**), and the nearest catch was the engine wrap's — so a reading that would not compose
 * stopped the panel updating for the rest of the fight rather than costing it one region, and one
 * console line was all anybody got. **E5**'s render region, applied to composing what it draws.
 * **ADR 0051.**
 *
 * The tally is read again in the `catch`, because the defect this draw just recorded is the one
 * the reader needs now rather than at the next payload. Nothing here asks for a redraw.
 */
function drawFight(
    session: BattleSession,
    screen: ScreenState,
    panel: PanelHandle,
    shelf: ShelfKeeper,
    liveFight: LiveFight,
    readClock: (atMilliseconds: number) => { hour: number; minute: number } | null,
    defects: KeptDefects,
): void {
    const said = defects.getSaid();
    try {
        if (showFight(session, screen, panel, shelf, liveFight, readClock, said, defects)) return;
        panel.showWaiting(screen.isCollapsed, { defects: said, isFightUnread: false });
        return;
    } catch (failure) {
        defects.add("reading", null, failure);
    }
    showFightUnread(panel, screen.isCollapsed, defects);
}

/**
 * The panel standing on a fight it could not read. A failure here has nowhere left to degrade to,
 * so its mark is the console entry the keeper writes and not a line anybody sees — **ADR 0025**.
 */
function showFightUnread(panel: PanelHandle, isCollapsed: boolean, defects: KeptDefects): void {
    try {
        panel.showWaiting(isCollapsed, { defects: defects.getSaid(), isFightUnread: true });
    } catch (failure) {
        defects.add("reading", null, failure);
    }
}

/**
 * Puts what the session holds into the panel that is already on the page. False where there is
 * nothing to put there — no fight and an empty shelf — because a panel of zeroes over a game that
 * has not started is a claim.
 */
function showFight(
    session: BattleSession,
    screen: ScreenState,
    panel: PanelHandle,
    shelf: ShelfKeeper,
    liveFight: LiveFight,
    readClock: (atMilliseconds: number) => { hour: number; minute: number } | null,
    defects: readonly string[],
    keeper: KeptDefects,
): boolean {
    const { place, openedAt } = liveFight;
    const live = composeFightFigures(session);
    const standing = getStandingFight(live, screen, shelf);
    if (standing === null) return false;
    const { figures, kept } = standing;
    const { fight, roster, statistics } = figures;
    const reading = composePanelReading(
        statistics,
        roster,
        screen.current,
        screen.side,
        fight.readerSide,
        { messagesLost: fight.messagesLost, hasJoinedInProgress: fight.hasJoinedInProgress },
    );
    addFiguresDisagreed(keeper, reading);
    const { drill, pair, part, halfNamed, halfNamedDrill } = composeOpenedReadings(
        figures,
        screen,
    );
    // The row the panel is actually drawing, which is the kept one wherever there is no live
    // fight for the shelf to mark instead. The live fight has no row of its own to name, so the
    // place a reader stands in is named by the moment that fight opened.
    const chosenFight = screen.openFightId ?? kept?.openedAt ?? null;
    panel.show({
        listName: composeListName(screen, chosenFight ?? openedAt),
        reading,
        current: screen.current,
        side: screen.side,
        // A strip that cannot tell one side from the other is not drawn at all: the protocol
        // never states which side is the reader's own, and the client does not always either.
        hasReaderSide: fight.readerSide !== null,
        shelf: composeShelfRows(
            shelf.fights,
            live === null ? null : {
                fight: live.fight,
                place,
                openedAt,
                outcome: getOutcomeForFigures(live),
            },
            chosenFight,
            readClock,
            (one) => shelf.readFigures(one),
        ),
        storage: shelf.choice,
        shelfWarnings: composeShelfWarnings(shelf),
        defects,
        isOnShelf: screen.isOnShelf,
        drill,
        pair,
        part,
        halfNamed,
        halfNamedDrill,
        place: getPlaceWords(kept === null ? place : kept.place),
        isCollapsed: screen.isCollapsed,
    });
    return true;
}

/**
 * Two counts of one figure came out different, which is the one thing this panel can say about a
 * drawn figure being wrong rather than short. `src/ui/panel-reading.ts` answers it; it was an
 * assertion there until **ADR 0051**, and stopping the panel is what it used to cost.
 */
function addFiguresDisagreed(keeper: KeptDefects, reading: PanelReading): void {
    if (!reading.hasFiguresDisagreed) return;
    keeper.add("figures", null, "two counts of one figure came out different");
}

interface OpenedReadings {
    drill: DrillReading | null;
    pair: PairReading | null;
    part: PartReading | null;
    halfNamed: HalfNamedReading | null;
    halfNamedDrill: HalfNamedDrillReading | null;
}

function composeOpenedReadings(figures: FightFigures, screen: ScreenState): OpenedReadings {
    const { roster, statistics } = figures;
    const halfNamed = composeOpenedHalfNamed(figures, screen);
    const halfNamedDrill = composeOpenedHalfNamedDrill(figures, screen);
    const drill = screen.openRowId === null
        ? null
        : composeDrillReading(statistics, roster, screen.current, screen.openRowId);
    // A row nobody in the fight is on opens nothing, and nothing under it stands either: the
    // rungs below a row that could not be read are rungs of no figure.
    if (drill === null) {
        return { drill: null, pair: null, part: null, halfNamed, halfNamedDrill };
    }

    const pair = screen.openPairId === null ? null : composePairReading(
        statistics,
        roster,
        screen.current,
        drill.combatantId,
        screen.openPairId,
    );
    const part = screen.openPart === null ? null : composePartReading(
        statistics,
        roster,
        screen.current,
        drill.combatantId,
        screen.openPart,
    );
    return { drill, pair, part, halfNamed, halfNamedDrill };
}

/**
 * And what stands under one row of that level. Null unless a pinned row is open and a row of it
 * was pressed — the marks are the ranking's and the kind cut's own, so a stale one names nothing
 * here and gets the refusal it deserves.
 */
function composeOpenedHalfNamedDrill(
    figures: FightFigures,
    screen: ScreenState,
): HalfNamedDrillReading | null {
    const { roster, statistics, fight } = figures;
    if (screen.openUnnamedEnd === null) return null;
    const kase = getPinnedCase(screen.current, screen.openUnnamedEnd);
    if (kase === null) return null;
    const opened = getHalfNamedOpened(screen);
    if (opened === null) return null;
    return composeHalfNamedDrillReading(
        statistics,
        roster,
        kase,
        screen.side,
        fight.readerSide,
        opened,
    );
}

/** A person or a key, and never both: the way back closes the key first, so one of them is null. */
function getHalfNamedOpened(screen: ScreenState): HalfNamedOpened | null {
    if (screen.openUnnamedEnd === null) return null;
    if (screen.openRowId !== null) return null;
    if (screen.openPart !== null) {
        if (screen.openPart.kind !== "element") return null;
        return { kind: "element", element: screen.openPart.element };
    }
    if (screen.openPairId === null) return null;
    return { kind: "person", combatantId: screen.openPairId };
}

/**
 * What stands under a pinned row the reader opened. Null where the mark names no figure on this
 * screen, which is the answer a mark left over from another one deserves.
 */
function composeOpenedHalfNamed(
    figures: FightFigures,
    screen: ScreenState,
): HalfNamedReading | null {
    const { roster, statistics, fight } = figures;
    if (screen.openUnnamedEnd === null) return null;
    const kase = getPinnedCase(screen.current, screen.openUnnamedEnd);
    if (kase === null) return null;
    return composeHalfNamedReading(statistics, roster, kase, screen.side, fight.readerSide);
}

/**
 * The names a browser gives what this needs, and the whole of what it is asked for. A `Window`
 * states far more than this, which is why `userscript-boot.ts` casts once at that boundary.
 */
export interface UserscriptWindow {
    document: UserscriptDocument;
    innerWidth?: number | undefined;
    innerHeight?: number | undefined;
    setInterval(step: () => void, everyMilliseconds: number): number;
    clearInterval(handle: number): void;
    setTimeout(step: () => void, afterMilliseconds: number): number;
    console: { error(line: string, failure: unknown): void };
    /**
     * The two a browser lends, and both optional: a private window or a third-party-storage rule
     * is a page with neither, and that is a page this add-on still works on.
     */
    localStorage?: PageStorage | undefined;
    sessionStorage?: PageStorage | undefined;
    Date: {
        now(): number;
        new (atMilliseconds: number): {
            toISOString(): string;
            /** Absent on a document that lends no clock of its own, which answers no time. */
            getHours?(): number;
            getMinutes?(): number;
        };
    };
    location: { hostname?: string | undefined };
    navigator: { userAgent?: string | undefined };
    URL: { createObjectURL(part: unknown): string; revokeObjectURL(url: string): void };
    Blob: new (parts: readonly string[], options: { type: string }) => unknown;
}

/**
 * The document as this file asks for it, which is wider than the panel's own — the panel is
 * handed one and states its own surface.
 *
 * `createElement` answers an anchor for every tag, which is a shape only an anchor really has.
 * Nothing here reads those members off anything but an `a`.
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
/** A page states a handful; this is far past any page the add-on is installed on. */
const MAXIMUM_SCRIPTS = 4096;
const SCRIPT_WITH_SOURCE = "script[src]";

/**
 * Which world a recording came from, or the word saying nobody knows.
 *
 * ⚠️ **`?? "unknown"` does not cover the case that happens.** A page with no hostname gives `""`,
 * and `"".split(".")[0]` is `""` — not nullish, so a recording carried a world of nothing and the
 * file was named `margometer--2026-…json`, with a hole where the answer goes. A value nobody
 * wrote must never read as an answer. Seen on a `file://` page, in v1.
 */
function readWorldFromPage(page: UserscriptWindow): string {
    const stated = page.location.hostname ?? "";
    const world = stated.split(".")[0] ?? "";
    if (world.length === 0) return "unknown";
    return world;
}

function readGameBuildFromPage(page: UserscriptWindow): string | null {
    const scripts = page.document.querySelectorAll(SCRIPT_WITH_SOURCE);
    const walked = Math.min(scripts.length, MAXIMUM_SCRIPTS);
    for (let at = 0; at < walked; at += 1) {
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
function writeTextToFile(
    page: UserscriptWindow,
    name: string,
    text: string,
    handleFailure: (failure: unknown) => void,
): void {
    if (name.length === 0) return;
    if (text.length === 0) return;
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
        // The clock is the browser's, so a revoke that throws unwinds into the timer and reaches
        // nobody (**E12**). A URL nobody released is memory this page keeps until it is left.
        page.setTimeout(() => {
            try {
                page.URL.revokeObjectURL(url);
            } catch (failure) {
                handleFailure(failure);
            }
        }, 0);
    }
}

/**
 * A moment on the reader's own clock, as the hour and the minute it fell on.
 *
 * Read through the page's own `Date`, which is the one clock a userscript has, and answered as
 * null where it will not read one: a row with no time says nothing rather than saying `00:00`,
 * which is a reading of nothing wearing the shape of one.
 */
function readClockFromPage(
    page: UserscriptWindow,
    atMilliseconds: number,
): { hour: number; minute: number } | null {
    if (!Number.isFinite(atMilliseconds)) return null;
    const held = new page.Date(atMilliseconds);
    const hour = getNumberFromUnknown(held.getHours?.());
    const minute = getNumberFromUnknown(held.getMinutes?.());
    if (hour === null || minute === null) return null;
    if (hour < 0) return null;
    if (minute < 0) return null;
    return { hour, minute };
}

/**
 * How big the window is, or nothing at all. A page that states one and not the other states no
 * viewport: half a size clamps a panel against a number nobody wrote.
 */
function readViewportFromPage(page: UserscriptWindow): PanelViewport | null {
    const width = getNumberFromUnknown(page.innerWidth);
    const height = getNumberFromUnknown(page.innerHeight);
    if (width === null || height === null) return null;
    if (width < 0) return null;
    if (height < 0) return null;
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

/**
 * Whether the page states the members this add-on **calls**, asked before one of them is reached.
 * It stands where a cast in `userscript-boot.ts` used to. **That a member is there and callable
 * is all it says** — a signature is not `typeof`'s to give, and a function of the wrong shape is
 * answered for by every boundary below. What this closes is the start, which has none.
 */
function isUserscriptWindow(value: unknown): value is UserscriptWindow {
    if (!isRecord(value)) return false;
    if (typeof value.setInterval !== "function") return false;
    if (typeof value.clearInterval !== "function") return false;
    if (typeof value.setTimeout !== "function") return false;
    if (typeof value.Date !== "function") return false;
    if (typeof value.Blob !== "function") return false;
    if (typeof value.URL !== "function") return false;
    if (!isCallableOn(value.console, "error")) return false;
    if (!isRecord(value.location)) return false;
    if (!isRecord(value.navigator)) return false;
    return isDocumentOfAPage(value.document);
}

function isDocumentOfAPage(value: unknown): boolean {
    if (!isRecord(value)) return false;
    if (typeof value.createElement !== "function") return false;
    if (typeof value.querySelectorAll !== "function") return false;
    return isCallableOn(value.body, "append");
}

/**
 * ⚠️ **A class is not a record.** `typeof` answers `function` of `URL`, `Blob` and `Date`, so
 * `isRecord` refuses all three: they are asked for above by `typeof`, and their members not at
 * all — a missing `URL.createObjectURL` costs the file, which `saveRecording` answers for.
 */
function isCallableOn(held: unknown, name: string): boolean {
    if (!isRecord(held)) return false;
    return typeof held[name] === "function";
}

/** Nothing is done to it, console line included: the console is one of the things that may
 * not be there. `isAttached` says no, which is what a second copy of the add-on also answers. */
function composeStoodDown(): GameAttachment {
    return { detach: () => {}, isAttached: () => false };
}

export function startFromWindow(page: unknown): GameAttachment {
    if (!isUserscriptWindow(page)) return composeStoodDown();
    return startFromUserscriptWindow(page);
}

function startFromUserscriptWindow(page: UserscriptWindow): GameAttachment {
    let shown: PanelElement | null = null;
    const report = (line: string, failure: unknown): void => page.console.error(line, failure);
    return startMargoMeter({
        page,
        document: page.document,
        schedule: {
            every: (step, everyMilliseconds) => page.setInterval(step, everyMilliseconds),
            cancel: (handle) => page.clearInterval(handle),
        },
        mount: {
            show: (panel) => {
                if (panel === shown) return;
                shown?.replaceWith(panel);
                if (shown === null) page.document.body.append(panel);
                shown = panel;
            },
        },
        readViewport: () => readViewportFromPage(page),
        report,
        store: composeStoreForChoice(page, STORAGE_DEFAULT),
        composeShelfStore: (choice) => composeStoreForChoice(page, choice),
        save: (name, text) =>
            writeTextToFile(page, name, text, (failure) => report(FAILURE_LINE, failure)),
        readSurroundings: () => ({
            world: readWorldFromPage(page),
            gameBuild: readGameBuildFromPage(page),
            capturedAt: new page.Date(page.Date.now()).toISOString(),
            userAgent: page.navigator.userAgent ?? null,
        }),
        now: () => page.Date.now(),
        readClock: (atMilliseconds) => readClockFromPage(page, atMilliseconds),
    });
}

/**
 * Puts a finished fight on the shelf, once. What is kept is what the game delivered — the
 * recording's own calls, thinned by the one rule that thins them — so every figure a row states is
 * derived by the code that is running. **ADR 0026.**
 */
function keepFight(
    session: BattleSession,
    shelf: ShelfKeeper,
    live: LiveFight,
    gameBuild: string | null,
): void {
    const fight = getFightFromSession(session);
    if (fight === null) return;
    if (!fight.isOver) return;
    shelf.keep({
        openedAt: live.openedAt,
        payloads: live.capture.calls.map((call) => call.payload),
        place: live.place,
        gameBuild,
        isPinned: false,
    });
}

/**
 * What the figures of the live fight are written from, or nothing where none has been read. Null
 * is a true statement the file carries: the add-on was attached and the game said nothing.
 */
function composeReportSubject(session: BattleSession, live: LiveFight): ReportSubject | null {
    const figures = composeFightFigures(session);
    if (figures === null) return null;
    return {
        statistics: figures.statistics,
        roster: figures.roster,
        place: live.place,
        payloads: figures.fight.payloads,
        messagesLost: figures.fight.messagesLost,
        isOver: figures.fight.isOver,
    };
}

/**
 * The fight, handed to the browser as a file — the calls the game made and the figures they came
 * to, unredacted by design, which `game/fight-capture.ts` states along with what deals with that
 * and where.
 *
 * The figures are composed here rather than read off the panel: what a reader hands over is of the
 * fight going on, and the panel may be standing on one off the shelf. A refusal to write leaves a
 * mark rather than an empty file.
 */
function saveRecording(
    environment: UserscriptEnvironment,
    live: LiveFight,
    session: BattleSession,
    defects: KeptDefects,
): void {
    const save = environment.save;
    if (save === null) return;
    const surroundings = environment.readSurroundings();
    const subject = composeReportSubject(session, live);
    const text = composeCaptureText(live.capture, surroundings, subject);
    if (text === null) {
        defects.add("file", null, "a recording that would not be written as text");
        return;
    }

    // The browser's own `click()` is in here and throws where a page is being torn down, and it
    // was reaching the press that called it rather than the reader (**E14**).
    try {
        save(composeCaptureFileName(surroundings), text);
    } catch (failure) {
        defects.add("file", null, failure);
    }
}

/**
 * What is true of the fight going on now, and nothing that outlives it.
 *
 * These were five loose bindings the entry closed over, which is what made a payload's bookkeeping
 * a part of the entry rather than a thing of its own — and what put `startMargoMeter` past **S4**
 * where the reader could not see it.
 */
interface LiveFight {
    /** The recording, and the state each call is entered with: the same fight, so held together. */
    capture: FightCapture;
    combatantsBefore: CapturedCombatant[];
    /**
     * Read once, on the payload that opens a fight: the client's own state is where a place is,
     * the hero does not move while a fight is on, and reading it every payload would ask another
     * program's object graph a question whose answer cannot have changed.
     */
    place: FightPlace | null;
    openedAt: number;
    wasOver: boolean;
}

function composeLiveFight(): LiveFight {
    return {
        capture: composeEmptyCapture(),
        combatantsBefore: [],
        place: null,
        openedAt: 0,
        wasOver: false,
    };
}

/** Where the reader put the panel, and where a drag is allowed to put it. */
function composePanelPlacement(
    environment: UserscriptEnvironment,
    store: BrowserStore | null,
): PanelPlacement {
    return {
        position: store === null ? null : getPositionFromStoredText(store.read(PLACE_KEY) ?? ""),
        getViewport: () => environment.readViewport(),
        // Once per drag rather than once per frame. A refusal to write is an answer here as
        // wherever this panel writes: the reader's choice stands, and only the next visit is the
        // poorer for it.
        handleMoved: (position: PanelPosition) => {
            const written = composeStoredTextFromPosition(position);
            if (written === null) return;
            store?.write(PLACE_KEY, written);
        },
    };
}

/**
 * A fight that opens puts the panel back on its ranking, and only for a reader on the live fight.
 *
 * ⚠️ **A row left open would find somebody in the next fight.** A row is opened by the game's own
 * combatant id and a party keeps its ids from one fight to the next — ten of them shared between
 * `captures/2026-08-15-tempest-grupa-vs-hildur-1` and `-2`, read 2026-08-31 — so the next fight
 * drew itself opened on a rung nobody asked for. A reader who is on a fight off the shelf is left
 * where they are: what they are reading did not change.
 */
function setLiveFightOpened(screen: ScreenState): void {
    if (screen.openFightId !== null) return;
    screen.openRowId = null;
    screen.openUnnamedEnd = null;
    screen.openPairId = null;
    screen.openPart = null;
}

/**
 * One payload, into the fight it belongs to and into the recording beside it. True where the
 * payload is the one that opened a fight.
 */
function readPayloadIntoLive(
    live: LiveFight,
    session: BattleSession,
    shelf: ShelfKeeper,
    environment: UserscriptEnvironment,
    stated: { payload: unknown; battle: EngineBattle },
): boolean {
    addPayloadToSession(session, stated.payload);
    live.capture = composeNextCapture(live.capture, {
        payload: stated.payload,
        messages: session.messagesByPayload.at(-1) ?? [],
        combatantsBefore: live.combatantsBefore,
        combatantsAfter: composeSnapshotFromBattle(stated.battle),
    });
    const fight = getFightFromSession(session);
    const isOpening = fight !== null && fight.payloads === 1;
    if (isOpening) {
        live.place = readPlaceFromPage(environment.page);
        live.openedAt = environment.now();
    }
    // Once, on the call that ends it: a fight put on the shelf twice is two fights.
    if (fight !== null && fight.isOver && !live.wasOver) {
        live.wasOver = true;
        keepFight(session, shelf, live, environment.readSurroundings().gameBuild);
    }
    if (fight !== null && !fight.isOver) live.wasOver = false;
    return isOpening;
}

/**
 * Every way the attachment can fail, said once each, under the one branded line. These four are
 * conditions rather than defects: three of them mean no panel goes up at all, so there is nothing
 * standing for a defect to be drawn on. Every guard the panel itself holds ends at the keeper
 * `startMargoMeter` makes, which writes the console line the first time a kind arrives and counts
 * the rest — the once **E11** asks for. **ADR 0051.**
 */
function composeGameReports(environment: UserscriptEnvironment) {
    return {
        handleFailure: (failure: unknown) => environment.report(FAILURE_LINE, failure),
        handleAnotherReader: () =>
            environment.report(FAILURE_LINE, "another reader holds the game"),
        handleRefusal: () => environment.report(FAILURE_LINE, "the game states no method to read"),
        handleSearchAbandoned: () => environment.report(FAILURE_LINE, "no game on this page"),
    };
}

export function startMargoMeter(environment: UserscriptEnvironment): GameAttachment {
    const session = composeBattleSession();
    const defects = composeDefectKeeper((failure) => environment.report(FAILURE_LINE, failure));
    const store = environment.store;
    const screen = composeScreenState(store !== null && store.read(FOLD_KEY) === FOLDED);
    const shelf = composeShelfKeeper(environment);
    const placement = composePanelPlacement(environment, store);
    const live = composeLiveFight();
    // The panel goes up when the wrap goes on, and not before: a copy that stood down never gets
    // one, and a page with no game on it is left as it was found.
    let isMounted = false;
    // A refusal leaves `isMounted` false, so the next payload tries again, and the defect is
    // read once the panel does stand (**E14**).
    const mount = (): void => {
        if (isMounted) return;
        try {
            environment.mount.show(panel.element);
        } catch (failure) {
            defects.add("mount", null, failure);
            return;
        }
        isMounted = true;
    };
    const draw = (): void => {
        drawFight(session, screen, panel, shelf, live, environment.readClock, defects);
    };
    const showAndMount = (): void => {
        draw();
        mount();
    };
    const panel = composePanelHost(
        environment.document,
        (press) => {
            if (press.kind === "save") saveRecording(environment, live, session, defects);
            const isShelfPress = setShelfFromPress(shelf, press);
            if (!isShelfPress && !handlePress(screen, press)) return;
            if (press.kind === "fold") store?.write(FOLD_KEY, screen.isCollapsed ? FOLDED : "");
            draw();
        },
        (mark) => defects.add(mark.kind, mark.region, mark.failure),
        placement,
        // Once per mount: the dictionary is built with the page and not with the fight, and a page
        // without one never grows one. Null is the panel drawing its own words (ADR 0024).
        readDictionaryFromPage(environment.page),
    );

    return attachToGame(environment.page, environment.schedule, {
        handleAttached: showAndMount,
        handleBeforeCall: (battle) => {
            live.combatantsBefore = composeSnapshotFromBattle(battle);
        },
        handlePayload: (payload, battle) => {
            const isOpening = readPayloadIntoLive(live, session, shelf, environment, {
                payload,
                battle,
            });
            if (isOpening) setLiveFightOpened(screen);
            showAndMount();
        },
        ...composeGameReports(environment),
    });
}
