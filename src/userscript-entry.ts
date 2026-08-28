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
import {
    addPayloadToSession,
    type BattleSession,
    composeBattleSession,
    getFightFromSession,
} from "@/src/game/battle-session.ts";
import { attachToGame, type GameAttachment, type Scheduler } from "@/src/game/engine-attachment.ts";
import {
    type FightStore,
    type KeptFight,
    readKeptFights,
    writeKeptFights,
} from "@/src/game/kept-fights.ts";
import {
    composePanelHost,
    type PanelDocument,
    type PanelElement,
    type PanelHandle,
} from "@/src/ui/panel-element.ts";
import { composePanelReading, type ShelfRow } from "@/src/ui/panel-reading.ts";
import {
    composeScreenState,
    getScreenFromName,
    type ScreenState,
    SHELF_SCREEN,
} from "@/src/ui/panel-screen.ts";

/** Where a failure of ours is written, so the reader sees whose it is at a glance. */
const FAILURE_LINE = "MargoMeter/Panel";
/** The one key this add-on writes, named as ours like everything else a reader could meet. */
const SHELF_KEY = "MargoMeter-fights";

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
    store: FightStore | null;
    /** The clock, handed in like everything else, so nothing here reaches for one. */
    now(): number;
    /** One branded line, and the failure itself, so a console shows whose it is first. */
    report(line: string, failure: unknown): void;
}

/**
 * Puts what the session holds into the panel that is already on the page. A fight nobody has seen
 * draws nothing, because a panel of zeroes over a game that has not started is a claim.
 */
function composeShelfRows(kept: readonly KeptFight[]): ShelfRow[] {
    const rows = kept.map((one) => ({ openedAt: one.openedAt, combatants: one.combatants.length }));
    assert(rows.length === kept.length, "a shelf draws a row for each fight it holds");
    assert(rows.every((one) => one.combatants >= 0), "and none of them has fewer than nobody");
    return rows;
}

function showFight(
    session: BattleSession,
    screen: ScreenState,
    panel: PanelHandle,
    kept: readonly KeptFight[],
): void {
    const fight = getFightFromSession(session);
    if (fight === null) return;
    assert(fight.payloads > 0, "a fight that is drawn was built from something");
    const roster = composeCombatantRoster([...fight.roster.byId.values()]);
    const statistics = composeFightStatistics(fight.events, composeTeamHeals(fight.events, roster));
    const reading = composePanelReading(statistics, roster, screen.current);
    assert(reading.rows.length >= 0, "a reading states its rows, however few");
    panel.show({
        reading,
        current: screen.current,
        shelf: composeShelfRows(kept),
        isOnShelf: screen.isOnShelf,
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
 * The browser's own store, wrapped so a refusal is an answer. Reading one can throw for no
 * reason of ours — a browser set to forbid it does — and writing can throw for quota, so both
 * are wrapped here rather than at every caller.
 */
function composeBrowserStore(page: UserscriptWindow): FightStore {
    assert(typeof page.localStorage === "object", "a page states the store this asks for");
    return {
        read: (key) => {
            try {
                return page.localStorage.getItem(key);
            } catch {
                // A store that will not be read is a shelf with nothing on it.
                return null;
            }
        },
        write: (key, value) => {
            try {
                page.localStorage.setItem(key, value);
                return true;
            } catch {
                // No quota is ever assumed: a refusal comes back as one.
                return false;
            }
        },
    };
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
        store: composeBrowserStore(page),
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
): void {
    const fight = getFightFromSession(session);
    if (fight === null) return;
    if (!fight.isOver) return;
    const combatants = [...fight.roster.byId.values()];
    assert(fight.isOver, "a fight is kept once it is over and not before");
    kept.push({ openedAt: environment.now(), combatants, payloads: fight.messagesByPayload });
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
    const screen = composeScreenState();
    const kept = environment.store === null ? [] : readKeptFights(environment.store, SHELF_KEY);
    assert(SHELF_KEY.startsWith("MargoMeter-"), "the one key this add-on writes is named as ours");
    let wasOver = false;
    assert(getFightFromSession(session) === null, "a session starts holding no fight");
    assert(FAILURE_LINE.startsWith("MargoMeter/"), "a failure of ours says whose it is first");
    // The panel goes up on the first payload and not before: a copy that stood down never gets
    // one, and a page with no game on it is left as it was found.
    let isMounted = false;
    const showAndMount = (): void => {
        showFight(session, screen, panel, kept);
        if (isMounted) return;
        environment.mount.show(panel.element);
        isMounted = true;
    };
    const panel = composePanelHost(environment.document, (pressed) => {
        // The shelf's tab toggles: pressing it a second time goes back to the figures rather
        // than leaving a reader somewhere they have to find their way out of.
        if (pressed === SHELF_SCREEN) screen.isOnShelf = !screen.isOnShelf;
        else {
            // A press on anything that is not a screen moves nothing, so a stray attribute in
            // the game's own markup can never put the panel somewhere it cannot draw.
            const reached = getScreenFromName(pressed);
            if (reached === null) return;
            screen.current = reached;
            screen.isOnShelf = false;
        }
        showFight(session, screen, panel, kept);
    }, (failure) => environment.report(FAILURE_LINE, failure));
    assert(!isMounted, "nothing is on the page until a payload arrives");
    return attachToGame(environment.page, environment.schedule, {
        handlePayload: (payload) => {
            addPayloadToSession(session, payload);
            const fight = getFightFromSession(session);
            // Once, on the call that ends it: a fight put on the shelf twice is two fights.
            if (fight !== null && fight.isOver && !wasOver) {
                wasOver = true;
                keepFight(environment, session, kept);
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
