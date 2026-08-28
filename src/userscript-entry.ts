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
    composePanelHost,
    type PanelDocument,
    type PanelElement,
    type PanelHandle,
} from "@/src/ui/panel-element.ts";
import { composePanelReading } from "@/src/ui/panel-reading.ts";
import { composeScreenState, getScreenFromName, type ScreenState } from "@/src/ui/panel-screen.ts";

/** Where a failure of ours is written, so the reader sees whose it is at a glance. */
const FAILURE_LINE = "MargoMeter/Panel";

export interface PanelMount {
    /** Puts this panel where the last one was. Replacing is the caller's, mounting is ours. */
    show(panel: PanelElement): void;
}

export interface UserscriptEnvironment {
    page: unknown;
    document: PanelDocument;
    schedule: Scheduler;
    mount: PanelMount;
    /** One branded line, and the failure itself, so a console shows whose it is first. */
    report(line: string, failure: unknown): void;
}

/**
 * Puts what the session holds into the panel that is already on the page. A fight nobody has seen
 * draws nothing, because a panel of zeroes over a game that has not started is a claim.
 */
function showFight(session: BattleSession, screen: ScreenState, panel: PanelHandle): void {
    const fight = getFightFromSession(session);
    if (fight === null) return;
    assert(fight.payloads > 0, "a fight that is drawn was built from something");
    const roster = composeCombatantRoster([...fight.roster.byId.values()]);
    const statistics = composeFightStatistics(fight.events, composeTeamHeals(fight.events, roster));
    const reading = composePanelReading(statistics, roster, screen.current);
    assert(reading.rows.length >= 0, "a reading states its rows, however few");
    panel.show(reading, screen.current);
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
    });
}

/**
 * Starts reading, and hands back the way to stop. A second copy of the add-on stands down inside
 * the attachment, so nothing here has to know it was second.
 */
export function startMargoMeter(environment: UserscriptEnvironment): GameAttachment {
    const session = composeBattleSession();
    const screen = composeScreenState();
    assert(getFightFromSession(session) === null, "a session starts holding no fight");
    assert(FAILURE_LINE.startsWith("MargoMeter/"), "a failure of ours says whose it is first");
    // The panel goes up on the first payload and not before: a copy that stood down never gets
    // one, and a page with no game on it is left as it was found.
    let isMounted = false;
    const showAndMount = (): void => {
        showFight(session, screen, panel);
        if (isMounted) return;
        environment.mount.show(panel.element);
        isMounted = true;
    };
    const panel = composePanelHost(environment.document, (pressed) => {
        // A press on anything that is not a screen moves nothing, so a stray attribute in the
        // game's own markup can never put the panel somewhere it cannot draw.
        const reached = getScreenFromName(pressed);
        if (reached === null) return;
        screen.current = reached;
        showFight(session, screen, panel);
    }, (failure) => environment.report(FAILURE_LINE, failure));
    assert(!isMounted, "nothing is on the page until a payload arrives");
    return attachToGame(environment.page, environment.schedule, {
        handlePayload: (payload) => {
            addPayloadToSession(session, payload);
            showAndMount();
        },
        handleFailure: (failure) => environment.report(FAILURE_LINE, failure),
        handleAnotherReader: () =>
            environment.report(FAILURE_LINE, "another reader holds the game"),
        handleRefusal: () => environment.report(FAILURE_LINE, "the game states no method to read"),
        handleSearchAbandoned: () => environment.report(FAILURE_LINE, "no game on this page"),
    });
}
