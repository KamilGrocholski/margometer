/**
 * What the reader asked for, read off the element they pressed (`docs/design.md` §9), before
 * anything is done about it. `develop` calls it `PanelPress`. The marks a press is read off are
 * spelled here once, for the file that writes them and for the listener that reads them: one
 * attribute per control, so the listener never reads a class.
 */

import { parseInteger } from "@/libs/number-text.ts";
import { err, ok, type Result } from "@/libs/result.ts";
import { isOneOf, type VocabularyWord } from "@/libs/vocabulary.ts";
import {
    PANEL_WINDOW,
    type PanelPosition,
    type PanelWindow,
    STORAGE_CHOICES,
    type StorageChoice,
} from "@/src/ui/panel-choice.ts";
import type { PanelTarget } from "@/src/ui/panel-document.ts";
import { type OpenedPart, type PanelUnnamedEnd, UNNAMED_END } from "@/src/ui/panel-reading.ts";
import {
    OPENED_PART,
    type PanelMetric,
    type PanelSideChoice,
    SCREEN_ORDER,
    SIDE_CHOICES,
} from "@/src/ui/panel-screen.ts";

export const PANEL_MARK = {
    fold: "data-fold",
    save: "data-save",
    shelf: "data-shelf",
    screen: "data-screen",
    side: "data-side",
    row: "data-row",
    back: "data-back",
    /** One per kind of part, so what a row opens is read off an attribute rather than parsed. */
    skill: "data-skill",
    source: "data-source",
    kind: "data-kind",
    /** The row closing a damage section, which opens onto the other end of those blows. */
    plain: "data-plain",
    fight: "data-fight",
    pin: "data-pin",
    /** Which end a pinned row leaves out, which is the whole of what opening it asks for. */
    unnamed: "data-unnamed",
    storage: "data-storage",
    /** The helper's own fold: one mark over both would put away the window being watched. */
    helperFold: "data-standing-fold",
} as const;
export type PanelMark = VocabularyWord<typeof PANEL_MARK>;

/** The plain row names nothing, so its mark states the same word and the press reads the key. */
export const PLAIN_MARK = "closing";
/** The shelf's row for the fight going on, which no moment of opening names yet. */
export const LIVE_FIGHT_MARK = "live";

export const PANEL_INTENT = {
    metric: "metric",
    side: "side",
    openRow: "open-row",
    openUnnamed: "open-unnamed",
    openPart: "open-part",
    close: "close",
    fold: "fold",
    move: "move",
    saveFile: "save-file",
    storage: "storage",
    shelf: "shelf",
    showKept: "show-kept",
    showLive: "show-live",
    pin: "pin",
} as const;

export type PanelIntent =
    | { kind: typeof PANEL_INTENT.metric; metric: PanelMetric }
    | { kind: typeof PANEL_INTENT.side; side: PanelSideChoice }
    | { kind: typeof PANEL_INTENT.openRow; combatantId: number }
    | { kind: typeof PANEL_INTENT.openUnnamed; end: PanelUnnamedEnd }
    | { kind: typeof PANEL_INTENT.openPart; part: OpenedPart }
    | { kind: typeof PANEL_INTENT.close }
    | { kind: typeof PANEL_INTENT.fold; window: PanelWindow }
    | { kind: typeof PANEL_INTENT.move; window: PanelWindow; position: PanelPosition }
    | { kind: typeof PANEL_INTENT.saveFile }
    | { kind: typeof PANEL_INTENT.storage; choice: StorageChoice }
    | { kind: typeof PANEL_INTENT.shelf }
    | { kind: typeof PANEL_INTENT.showKept; openedAt: number }
    | { kind: typeof PANEL_INTENT.showLive }
    | { kind: typeof PANEL_INTENT.pin; openedAt: number };

export const INTENT_FAILURE = { markUnknown: "mark-unknown" } as const;

/** A mark of ours stating a value nothing of ours writes: a stray, and never the first choice. */
export type IntentFailure = { kind: typeof INTENT_FAILURE.markUnknown; mark: PanelMark };

type IntentReading = Result<PanelIntent | null, IntentFailure>;

const UNNAMED_ENDS = Object.values(UNNAMED_END);

/**
 * The intent a press on `target` states, null where it states none, and a failure where one of
 * our marks states a value we never write. The marks are asked in `develop`'s order.
 */
export function readPanelIntent(target: PanelTarget): IntentReading {
    // A text node or the root itself: nothing to read a mark off, and nothing asked for.
    if (typeof target.getAttribute !== "function") return ok(null);
    const screen = readPanelIntentOfScreen(target);
    if (!screen.ok) return screen;
    if (screen.value !== null) return screen;
    const part = readPanelIntentOfPart(target);
    if (part !== null) return ok(part);
    const shelf = readPanelIntentOfShelf(target);
    if (!shelf.ok) return shelf;
    if (shelf.value !== null) return shelf;
    return ok(readPanelIntentOfControl(target));
}

function readPanelIntentOfScreen(target: PanelTarget): IntentReading {
    const metric = target.getAttribute(PANEL_MARK.screen);
    if (metric !== null) {
        if (!isOneOf(SCREEN_ORDER, metric)) return failMark(PANEL_MARK.screen);
        return ok({ kind: PANEL_INTENT.metric, metric });
    }
    const side = target.getAttribute(PANEL_MARK.side);
    if (side !== null) {
        if (!isOneOf(SIDE_CHOICES, side)) return failMark(PANEL_MARK.side);
        return ok({ kind: PANEL_INTENT.side, side });
    }
    const row = target.getAttribute(PANEL_MARK.row);
    if (row !== null) {
        const combatantId = parseInteger(row);
        if (combatantId === null) return failMark(PANEL_MARK.row);
        return ok({ kind: PANEL_INTENT.openRow, combatantId });
    }
    const end = target.getAttribute(PANEL_MARK.unnamed);
    if (end !== null) {
        if (!isOneOf(UNNAMED_ENDS, end)) return failMark(PANEL_MARK.unnamed);
        return ok({ kind: PANEL_INTENT.openUnnamed, end });
    }
    return ok(null);
}

/** A part names itself, whatever it names: the game's own keys and names are open sets. */
function readPanelIntentOfPart(target: PanelTarget): PanelIntent | null {
    const name = target.getAttribute(PANEL_MARK.skill);
    if (name !== null) return openPart({ kind: OPENED_PART.skill, name });
    const source = target.getAttribute(PANEL_MARK.source);
    if (source !== null) return openPart({ kind: OPENED_PART.source, source });
    if (target.getAttribute(PANEL_MARK.plain) !== null) {
        return openPart({ kind: OPENED_PART.plain });
    }
    const element = target.getAttribute(PANEL_MARK.kind);
    if (element !== null) return openPart({ kind: OPENED_PART.element, element });
    return null;
}

function openPart(part: OpenedPart): PanelIntent {
    return { kind: PANEL_INTENT.openPart, part };
}

function readPanelIntentOfShelf(target: PanelTarget): IntentReading {
    const fight = target.getAttribute(PANEL_MARK.fight);
    if (fight !== null) {
        if (fight === LIVE_FIGHT_MARK) return ok({ kind: PANEL_INTENT.showLive });
        const openedAt = parseInteger(fight);
        if (openedAt === null) return failMark(PANEL_MARK.fight);
        return ok({ kind: PANEL_INTENT.showKept, openedAt });
    }
    const pinned = target.getAttribute(PANEL_MARK.pin);
    if (pinned !== null) {
        const openedAt = parseInteger(pinned);
        if (openedAt === null) return failMark(PANEL_MARK.pin);
        return ok({ kind: PANEL_INTENT.pin, openedAt });
    }
    const choice = target.getAttribute(PANEL_MARK.storage);
    if (choice !== null) {
        if (!isOneOf(STORAGE_CHOICES, choice)) return failMark(PANEL_MARK.storage);
        return ok({ kind: PANEL_INTENT.storage, choice });
    }
    return ok(null);
}

/** The controls whose mark states nothing: that it stands is the whole of what it says. */
function readPanelIntentOfControl(target: PanelTarget): PanelIntent | null {
    if (target.getAttribute(PANEL_MARK.helperFold) !== null) {
        return { kind: PANEL_INTENT.fold, window: PANEL_WINDOW.helper };
    }
    if (target.getAttribute(PANEL_MARK.save) !== null) return { kind: PANEL_INTENT.saveFile };
    if (target.getAttribute(PANEL_MARK.shelf) !== null) return { kind: PANEL_INTENT.shelf };
    if (target.getAttribute(PANEL_MARK.fold) !== null) {
        return { kind: PANEL_INTENT.fold, window: PANEL_WINDOW.panel };
    }
    if (target.getAttribute(PANEL_MARK.back) !== null) return { kind: PANEL_INTENT.close };
    return null;
}

function failMark(mark: PanelMark): IntentReading {
    return err({ kind: INTENT_FAILURE.markUnknown, mark });
}
