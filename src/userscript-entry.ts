/**
 * Where the layers meet: the game is found, the payloads reach a session, and what the session
 * holds is drawn.
 *
 * Everything it touches is handed in — the page, the document, the clock, the place a panel goes
 * and the line a failure is written on. Nothing here reaches for a global, which is what keeps a
 * userscript's contact with its browser stated in one file and testable without one.
 */

import { assert } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { getIntegerFromText } from "@/src/core/protocol-number.ts";
import {
    addPayloadToSession,
    type BattleSession,
    composeBattleSession,
    getFightFromSession,
} from "@/src/game/battle-session.ts";
import { attachToGame, type GameAttachment, type Scheduler } from "@/src/game/engine-attachment.ts";
import { type FightPlace, getPlaceFromPage } from "@/src/game/engine-place.ts";
import { type BrowserStore, composeBrowserStore } from "@/src/game/browser-store.ts";
import { type KeptFight, readKeptFights, writeKeptFights } from "@/src/game/kept-fights.ts";
import {
    composePanelHost,
    type PanelDocument,
    type PanelElement,
    type PanelHandle,
    type PanelPress,
} from "@/src/ui/panel-element.ts";
import { composeDrillReading, composePanelReading, type ShelfRow } from "@/src/ui/panel-reading.ts";
import {
    composeScreenState,
    getScreenFromName,
    type ScreenState,
    SHELF_SCREEN,
} from "@/src/ui/panel-screen.ts";
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

export interface PanelMount {
    /** Puts this panel where the last one was. Replacing is the caller's, mounting is ours. */
    show(panel: PanelElement): void;
}

export interface UserscriptEnvironment {
    page: unknown;
    document: PanelDocument;
    schedule: Scheduler;
    mount: PanelMount;
    /** Null where the browser will not have one read, which is an answer and not a failure. */
    store: BrowserStore | null;
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
    if (press.kind === "fold") {
        screen.isCollapsed = !screen.isCollapsed;
        return true;
    }
    if (press.kind === "back") {
        screen.openRowId = null;
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
    if (press.screen === SHELF_SCREEN) {
        screen.isOnShelf = !screen.isOnShelf;
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
    const fight = getFightFromSession(session);
    if (fight === null) return;
    assert(fight.payloads > 0, "a fight that is drawn was built from something");
    const roster = composeCombatantRoster([...fight.roster.byId.values()]);
    const statistics = composeFightStatistics(fight.events, composeTeamHeals(fight.events, roster));
    const reading = composePanelReading(statistics, roster, screen.current);
    assert(reading.rows.length >= 0, "a reading states its rows, however few");
    // Null where the screen has no cut to open, so a row opened on one screen never stands over
    // another that cannot state the same figure.
    const drill = screen.openRowId === null
        ? null
        : composeDrillReading(statistics, roster, screen.current, screen.openRowId);
    panel.show({
        reading,
        current: screen.current,
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
    document: PanelDocument & { body: { append(child: PanelElement): void } };
    setInterval(step: () => void, everyMs: number): number;
    clearInterval(handle: number): void;
    console: { error(line: string, failure: unknown): void };
    localStorage: {
        getItem(key: string): string | null;
        setItem(key: string, value: string): void;
    };
    Date: { now(): number };
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
        report: (line, failure) => page.console.error(line, failure),
        store: composeBrowserStore(page.localStorage),
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
    let wasOver = false;
    assert(getFightFromSession(session) === null, "a session starts holding no fight");
    assert(FAILURE_LINE.startsWith("MargoMeter/"), "a failure of ours says whose it is first");
    // The panel goes up on the first payload and not before: a copy that stood down never gets
    // one, and a page with no game on it is left as it was found.
    let isMounted = false;
    // Read once, on the payload that opens a fight: the client's own state is where a place is,
    // the hero does not move while a fight is on, and reading it every payload would ask another
    // program's object graph a question whose answer cannot have changed.
    let place: FightPlace | null = null;
    const showAndMount = (): void => {
        showFight(session, screen, panel, kept, place);
        if (isMounted) return;
        environment.mount.show(panel.element);
        isMounted = true;
    };
    const panel = composePanelHost(environment.document, (press) => {
        if (!handlePress(screen, press)) return;
        // A refusal to write is an answer: the panel folds either way, and only the next visit
        // is the poorer for it.
        if (press.kind === "fold") store?.write(FOLD_KEY, screen.isCollapsed ? FOLDED : "");
        showFight(session, screen, panel, kept, place);
    }, (failure) => environment.report(FAILURE_LINE, failure));
    assert(!isMounted, "nothing is on the page until a payload arrives");
    return attachToGame(environment.page, environment.schedule, {
        handlePayload: (payload) => {
            addPayloadToSession(session, payload);
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
