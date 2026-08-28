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
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import {
    addPayloadToSession,
    type BattleSession,
    composeBattleSession,
    getFightFromSession,
} from "@/src/game/battle-session.ts";
import { attachToGame, type GameAttachment, type Scheduler } from "@/src/game/engine-attachment.ts";
import {
    composePanelElement,
    type PanelDocument,
    type PanelElement,
} from "@/src/ui/panel-element.ts";
import { composePanelReading } from "@/src/ui/panel-reading.ts";
import { composeScreenState } from "@/src/ui/panel-screen.ts";

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
 * Draws what the session holds. A fight nobody has seen draws nothing at all, because a panel of
 * zeroes over a game that has not started is a claim rather than a reading.
 */
function showFight(environment: UserscriptEnvironment, session: BattleSession): void {
    const screen = composeScreenState();
    const fight = getFightFromSession(session);
    if (fight === null) return;
    assert(fight.payloads > 0, "a fight that is drawn was built from something");
    const statistics = composeFightStatistics(fight.events);
    const roster = composeCombatantRoster([...fight.roster.byId.values()]);
    const reading = composePanelReading(statistics, roster, screen.current);
    assert(reading.rows.length >= 0, "a reading states its rows, however few");
    const panel = composePanelElement(environment.document, reading, screen.current, (failure) => {
        environment.report(FAILURE_LINE, failure);
    });
    environment.mount.show(panel);
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
    assert(getFightFromSession(session) === null, "a session starts holding no fight");
    assert(FAILURE_LINE.startsWith("MargoMeter/"), "a failure of ours says whose it is first");
    return attachToGame(environment.page, environment.schedule, {
        handlePayload: (payload) => {
            addPayloadToSession(session, payload);
            showFight(environment, session);
        },
        handleFailure: (failure) => environment.report(FAILURE_LINE, failure),
        handleAnotherReader: () =>
            environment.report(FAILURE_LINE, "another reader holds the game"),
        handleRefusal: () => environment.report(FAILURE_LINE, "the game states no method to read"),
        handleSearchAbandoned: () => environment.report(FAILURE_LINE, "no game on this page"),
    });
}
