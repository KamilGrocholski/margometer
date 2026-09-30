/**
 * Where an intent leaves the panel's screen (`docs/design.md` §10.3): which list, which side,
 * which row and which rung under it. Pure moves over the screen state; the shelf, the settings and
 * the file are the runtime's. False for an intent that moves nothing, so it costs no frame.
 */

import { assert } from "@std/assert/assert";
import { PANEL_WINDOW } from "#/src/ui/panel-choice.ts";
import { PANEL_INTENT, type PanelIntent } from "#/src/ui/panel-intent.ts";
import type { PanelUnnamedEnd } from "#/src/ui/panel-reading.ts";
import type { ScreenState } from "#/src/ui/panel-screen.ts";

export function executeScreenIntent(screen: ScreenState, intent: PanelIntent): boolean {
    const hasMoved = executeScreenIntentOnce(screen, intent);
    verifyScreenState(screen);
    return hasMoved;
}

function executeScreenIntentOnce(screen: ScreenState, intent: PanelIntent): boolean {
    switch (intent.kind) {
        case PANEL_INTENT.metric:
            return setScreenMetric(screen, intent.metric);
        case PANEL_INTENT.side:
            return setScreenSide(screen, intent.side);
        case PANEL_INTENT.openRow:
            return setScreenRow(screen, intent.combatantId);
        case PANEL_INTENT.openUnnamed:
            return setScreenUnnamed(screen, intent.end);
        case PANEL_INTENT.openPart:
            screen.openPart = intent.part;
            return true;
        // One rung at a time. False where there was none to leave: the gesture is the whole panel's,
        // so a press on the ranking would otherwise redraw it for nothing.
        case PANEL_INTENT.close:
            if (screen.isOnOptions) {
                screen.isOnOptions = false;
                return true;
            }
            if (screen.isOnShelf) {
                screen.isOnShelf = false;
                return true;
            }
            if (screen.openPart !== null) {
                screen.openPart = null;
                return true;
            }
            if (screen.openPairId !== null) {
                screen.openPairId = null;
                return true;
            }
            // The end a person left out is the rung under their figure, so it closes before they do.
            if (screen.openRowId !== null) {
                if (screen.openUnnamedEnd !== null) screen.openUnnamedEnd = null;
                else screen.openRowId = null;
                return true;
            }
            if (screen.openUnnamedEnd === null) return false;
            screen.openUnnamedEnd = null;
            return true;
        case PANEL_INTENT.fold:
            if (intent.window === PANEL_WINDOW.panel) screen.isCollapsed = !screen.isCollapsed;
            else screen.isStandingCollapsed = !screen.isStandingCollapsed;
            return true;
        case PANEL_INTENT.shelf:
            screen.isOnShelf = !screen.isOnShelf;
            screen.isOnOptions = false;
            return true;
        case PANEL_INTENT.options:
            screen.isOnOptions = !screen.isOnOptions;
            screen.isOnShelf = false;
            return true;
        case PANEL_INTENT.showKept:
            setScreenFight(screen, intent.openedAt);
            return true;
        case PANEL_INTENT.showLive:
            setScreenFight(screen, null);
            return true;
        // A save moves nothing, and asks for a frame all the same: the defect it can leave is said
        // on the panel, and the shelf between fights has no payload coming to draw it.
        case PANEL_INTENT.saveFile:
            return true;
        // The same size asked for again moves nothing, and a frame for it would redraw nothing.
        case PANEL_INTENT.typeStep:
            if (screen.typeStep === intent.step) return false;
            screen.typeStep = intent.step;
            return true;
        // Kept for the frames to come, and no frame now unless the options stand open: the window
        // already stands that size, and the options are the one place that says which is sized.
        case PANEL_INTENT.resize:
            screen.windowSizes = { ...screen.windowSizes, [intent.window]: intent.size };
            return screen.isOnOptions;
        case PANEL_INTENT.resetSize:
            if (screen.windowSizes[intent.window] === null) return false;
            screen.windowSizes = { ...screen.windowSizes, [intent.window]: null };
            return true;
        case PANEL_INTENT.move:
        case PANEL_INTENT.storage:
        case PANEL_INTENT.pin:
            return false;
    }
}

/**
 * The two covers never stand open together: each one's control closes the other. An end left out
 * beside an opened person is a rung of its own, so neither a pair nor a part stands beside it.
 */
function verifyScreenState(screen: ScreenState): void {
    if (screen.isOnOptions) assert(!screen.isOnShelf, "the options and the shelf are one cover");
    if (screen.openRowId === null) return;
    if (screen.openUnnamedEnd === null) return;
    assert(screen.openPairId === null, "a person's end left out is not a pair with somebody");
    assert(screen.openPart === null, "and no part of their figure is open under it");
}

/**
 * The person stays, since they exist on every screen; the pair, the part and a pinned row go, since
 * each names a figure of one direction or one noun that the next screen does not draw.
 */
function setScreenMetric(screen: ScreenState, metric: ScreenState["current"]): boolean {
    screen.current = metric;
    screen.isOnShelf = false;
    screen.isOnOptions = false;
    screen.openPairId = null;
    screen.openPart = null;
    screen.openUnnamedEnd = null;
    return true;
}

/** A side decides who is on the list, so whatever was opened before may not be on it any more. */
function setScreenSide(screen: ScreenState, side: ScreenState["side"]): boolean {
    screen.side = side;
    screen.isOnShelf = false;
    screen.isOnOptions = false;
    screen.openRowId = null;
    screen.openUnnamedEnd = null;
    screen.openPairId = null;
    screen.openPart = null;
    return true;
}

/**
 * Not a toggle: an opened row covers the screen it was opened on, so a press inside it is the rung
 * under it — the pair of the two of them inside somebody's figure, and that person's share of what
 * nobody was named for under a pinned row.
 */
function setScreenRow(screen: ScreenState, combatantId: number): boolean {
    assert(Number.isSafeInteger(combatantId), "a row is opened by the game's own id");
    if (screen.openRowId !== null) screen.openPairId = combatantId;
    else if (screen.openUnnamedEnd !== null) screen.openPairId = combatantId;
    else screen.openRowId = combatantId;
    return true;
}

/**
 * Under an opened person it is the rung under their figure, as a pair is; on the ranking it is the
 * pinned row. Either way it is pressed from a level with no pair and no part open under it.
 */
function setScreenUnnamed(screen: ScreenState, end: PanelUnnamedEnd): boolean {
    assert(screen.openPairId === null, "an end left out is pressed from the level over it");
    assert(screen.openPart === null, "and never from a part's level");
    screen.openUnnamedEnd = end;
    return true;
}

function setScreenFight(screen: ScreenState, openedAt: number | null): void {
    if (openedAt !== null) assert(Number.isSafeInteger(openedAt), "a fight is chosen by a moment");
    screen.openFightId = openedAt;
    screen.isOnShelf = false;
    screen.isOnOptions = false;
    screen.openRowId = null;
    screen.openUnnamedEnd = null;
    screen.openPairId = null;
    screen.openPart = null;
}

/**
 * A fight that opens puts the panel back on its ranking, and only for a reader on the live fight.
 * ⚠️ **A row left open would find somebody in the next fight**: a party keeps its ids from one
 * fight to the next, ten of them shared between `captures/2026-08-15-tempest-grupa-vs-
 * hildur-1` and `-2`, read 2026-08-31.
 */
export function resetScreenOnOpening(screen: ScreenState): void {
    if (screen.openFightId !== null) return;
    screen.openRowId = null;
    screen.openUnnamedEnd = null;
    screen.openPairId = null;
    screen.openPart = null;
}
