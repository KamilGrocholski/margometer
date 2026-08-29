/**
 * The panel, drawn into a document it is handed. It never reaches for one, which is what keeps
 * the surface this asks of a browser declared rather than assumed.
 *
 * One shadow root, and every name a reader meets before the panel's contents carries the
 * `MargoMeter-` prefix; names inside sit behind the root where the game's stylesheet cannot see
 * them. Nothing here throws: a region that cannot be drawn is replaced by a marker at its own
 * size, and the rest of the panel stands.
 */

import { assert } from "@std/assert";
import type {
    DrillReading,
    ElementRow,
    PanelMetric,
    PanelReading,
    PanelRow,
    ShelfRow,
} from "@/src/ui/panel-reading.ts";
import {
    getWordsForOpponentCut,
    getWordsForScreen,
    SCREEN_ORDER,
    SHELF_SCREEN,
} from "@/src/ui/panel-screen.ts";
import {
    CLASS,
    composeBarColour,
    composeShareBackground,
    composeStyleSheet,
    getColourForElement,
    getColourForProfession,
} from "@/src/ui/panel-look.ts";
import {
    composeCountedNoun,
    COUNTED_NOUNS,
    getWordsForElement,
    PANEL_WORDS,
} from "@/src/ui/panel-words.ts";
import {
    composeTipHandle,
    composeTipRegister,
    type TipHandle,
    type TipRegister,
} from "@/src/ui/panel-tip.ts";

/** The whole of the document this asks for. A browser's own satisfies it. */
export interface PanelDocument {
    createElement(tag: string): PanelElement;
}

/** What a delegated listener is handed. The target is where the pointer landed, or nobody. */
export interface PanelEvent {
    target: { getAttribute(name: string): string | null } | null;
    /** How far down the screen the pointer is. The detail follows it and nothing else. */
    clientY: number;
}

export interface PanelElement {
    className: string;
    textContent: string;
    append(child: PanelElement): void;
    /** How a redrawn panel takes the place of the one before it, rather than stacking on it. */
    replaceWith(other: PanelElement): void;
    setAttribute(name: string, value: string): void;
    attachShadow(options: { mode: "open" }): PanelRoot;
}

/**
 * The root, which is where the one listener goes — and the reason it is stated here rather than
 * left to the host.
 *
 * A press inside a shadow root is **retargeted** for any listener outside it, and the host is
 * outside it: a listener there is handed the host as the target, whatever was actually pressed.
 * Reading an attribute off that answers null for every row, tab and crumb, so a panel listening
 * on its host draws correctly and does nothing at all. The element interface above carries no
 * `addEventListener` for that reason — the wrong place to put it is not reachable from here.
 */
export interface PanelRoot {
    append(child: PanelElement): void;
    /** One listener at the root, never one per row. */
    addEventListener(type: string, handle: (event: PanelEvent) => void): void;
}

const HOST_NAME = "MargoMeter-Panel";
const TITLE_CLASS = CLASS.title;
const TITLE_NAME_CLASS = CLASS.titleName;
const PLACE_CLASS = CLASS.place;
const BODY_CLASS = CLASS.body;
const ROW_CLASS = CLASS.row;
const ROW_NAME_CLASS = CLASS.rowName;
const ROW_FIGURE_CLASS = CLASS.rowFigure;
const TABS_CLASS = CLASS.tabs;
const TAB_CLASS = CLASS.tab;
/** More than colour, because colour never carries meaning by itself. */
const TAB_CURRENT_CLASS = `${CLASS.tab} ${CLASS.tabCurrent}`;
const TAB_CURRENT_MARK = "• ";
const SCREEN_ATTRIBUTE = "data-screen";
/** A row says which combatant it is, and the crumb above an opened row says only that it is one. */
const ROW_ATTRIBUTE = "data-row";
const BACK_ATTRIBUTE = "data-back";
/** Which row's detail the pointer is over, looked up in the register the draw filled. */
const TIP_ATTRIBUTE = "data-tip";
const CRUMB_CLASS = CLASS.crumb;
const DRILL_HEAD_CLASS = CLASS.drillHead;
/** A heading over one cut, so two lists under one opened row do not read as one list. */
const SECTION_CLASS = CLASS.section;
const BACK_MARK = "\u2039 ";
/** What the panel listens for: a press, not a click, so a drag never counts as one. */
const PRESS_EVENT = "pointerdown";
/** What opens the detail, and what moves it. One event does both: it fires on either. */
const MOVE_EVENT = "pointermove";
/**
 * What closes it. `pointerleave` does not bubble and a shadow root is not on the composed path of
 * one dispatched to an element, so the one listener would never see it; `pointerout` bubbles.
 * Crossing from one part of a row to another therefore hides and shows inside a single task,
 * before a paint.
 */
const LEAVE_EVENT = "pointerout";
const SUMMARY_CLASS = CLASS.summary;
const SUMMARY_NAME_CLASS = CLASS.summaryName;
const SUMMARY_FIGURE_CLASS = CLASS.summaryFigure;
/** More than colour, because colour never carries meaning by itself. */
const SUSPECT_MARK = "\u25b3 ";
const UNDRAWN_CLASS = CLASS.undrawn;
const EMPTY_CLASS = CLASS.empty;
const PINNED_CLASS = CLASS.pinned;
const SUSPECT_CLASS = CLASS.warning;
/** What a row's bar is written on, since a share is data rather than a token. */
const STYLE_ATTRIBUTE = "style";
/** A fight holds twenty, and a screen draws a row for each. */
const MAXIMUM_ROWS = 20;
/** What the statistics keep a cut inside. `captures/` states ten kinds in all, 2026-08-28. */
const MAXIMUM_KINDS = 64;

function composeElement(document: PanelDocument, tag: string, className: string): PanelElement {
    const element = document.createElement(tag);
    element.className = className;
    assert(element.className === className, "an element wears the class it was given");
    return element;
}

/**
 * What a row hands the register beside the figures it is already drawing. The key is stated by the
 * row rather than counted off the draw order, because a ranking reorders itself between payloads.
 */
interface RowTip {
    register: TipRegister;
    key: string;
    /** What the figure is, in the reader's words. */
    figure: string;
    /** What the share is a share **of**, or null on a row that carries no share at all. */
    share: string | null;
}

/**
 * A pointer lands on the deepest element under it, so every part of a row wears the row's marks —
 * the same reason the press attribute is written on the spans and not on the row alone.
 */
function setTipKeyOnRow(parts: readonly PanelElement[], key: string): void {
    assert(key.length > 0, "a row that carries a detail is named");
    assert(parts.length > 0, "and the pointer can land on some part of it");
    for (const part of parts) part.setAttribute(TIP_ATTRIBUTE, key);
}

/**
 * A press lands on the deepest element under the pointer, so every part of an openable row wears
 * the mark. Null leaves the row closed: the rows inside an opened one have nothing further to open.
 */
function composeRowElement(
    document: PanelDocument,
    row: PanelRow,
    opens: string | null,
    tip: RowTip,
): PanelElement {
    assert(row.figure >= 0, "a row drawn states a figure that is not below nothing");
    const element = composeElement(document, "div", ROW_CLASS);
    // The bar says what somebody is and the name beside it says who, so the colour is never the
    // only thing carrying anything. A combatant the game named no profession for takes the
    // colourless one, which is the absence of a category rather than a category of its own.
    const hue = getColourForProfession(row.profession);
    const bar = composeShareBackground(composeBarColour(hue), row.share);
    element.setAttribute(STYLE_ATTRIBUTE, `background-image:${bar}`);
    const name = composeElement(document, "span", ROW_NAME_CLASS);
    name.textContent = row.name ?? PANEL_WORDS.unknown;
    const figure = composeElement(document, "span", ROW_FIGURE_CLASS);
    figure.textContent = `${row.figure}`;
    element.append(name);
    element.append(figure);
    const parts = [element, name, figure];
    if (opens !== null) {
        for (const part of parts) part.setAttribute(ROW_ATTRIBUTE, opens);
    }
    // The name here is the whole of it: the row's own is cut with an ellipsis at 260 pixels, and
    // the share is the number the bar draws and no row spells.
    tip.register.add(tip.key, {
        name: name.textContent,
        figure: { caption: tip.figure, value: row.figure },
        share: tip.share === null ? null : { caption: tip.share, value: row.share },
    });
    setTipKeyOnRow(parts, tip.key);
    assert(name.textContent.length > 0, "a row names somebody, or says it cannot");
    return element;
}

/** A figure that belongs to nobody is a row of its own, below the ranking and the same height. */
function composePinnedElement(
    document: PanelDocument,
    label: string,
    figure: number,
    tip: RowTip,
): PanelElement {
    const element = composeElement(document, "div", PINNED_CLASS);
    assert(element.textContent === "", "a row begins saying nothing and is filled in");
    const name = composeElement(document, "span", ROW_NAME_CLASS);
    name.textContent = label;
    const stated = composeElement(document, "span", ROW_FIGURE_CLASS);
    stated.textContent = `${figure}`;
    element.append(name);
    element.append(stated);
    // No share: a figure that belongs to nobody is not a part of any row standing over it.
    tip.register.add(tip.key, {
        name: label,
        figure: { caption: tip.figure, value: figure },
        share: null,
    });
    setTipKeyOnRow([element, name, stated], tip.key);
    assert(figure >= 0, "a figure nobody can be charged with is never below nothing");
    assert(label.length > 0, "and the row saying so is labelled");
    return element;
}

function composeTabElement(
    document: PanelDocument,
    screen: string,
    words: string,
    isCurrent: boolean,
): PanelElement {
    const tab = composeElement(document, "div", isCurrent ? TAB_CURRENT_CLASS : TAB_CLASS);
    tab.setAttribute(SCREEN_ATTRIBUTE, screen);
    tab.textContent = `${isCurrent ? TAB_CURRENT_MARK : ""}${words}`;
    assert(tab.textContent.length > 0, "a tab a reader could press says where it goes");
    assert(screen.length > 0, "and names the screen it would reach");
    return tab;
}

/** One tab per screen there is, the shelf last, and the current one marked as well as tinted. */
function composeTabsElement(document: PanelDocument, view: PanelView): PanelElement {
    const strip = composeElement(document, "div", TABS_CLASS);
    assert(SCREEN_ORDER.length > 0, "there is a screen to reach for");
    for (const screen of SCREEN_ORDER) {
        const isCurrent = !view.isOnShelf && screen === view.current;
        strip.append(composeTabElement(document, screen, getWordsForScreen(screen), isCurrent));
    }
    strip.append(composeTabElement(document, SHELF_SCREEN, PANEL_WORDS.fights, view.isOnShelf));
    assert(SCREEN_ORDER.includes(view.current), "the panel is on a screen the strip draws");
    return strip;
}

/** The panel's own name, and where the fight being read is being fought, where that is known. */
function composeTitleElement(document: PanelDocument, place: string | null): PanelElement {
    const bar = composeElement(document, "div", TITLE_CLASS);
    const name = composeElement(document, "span", TITLE_NAME_CLASS);
    name.textContent = PANEL_WORDS.title;
    bar.append(name);
    assert(name.textContent.length > 0, "the panel says whose it is before anything else");
    if (place === null) return bar;
    assert(place.length > 0, "a place that is drawn says something");
    const where = composeElement(document, "span", PLACE_CLASS);
    where.textContent = place;
    bar.append(where);
    return bar;
}

/** The fights already fought, newest first, each saying how many were in it. */
function composeShelfElement(
    document: PanelDocument,
    shelf: readonly ShelfRow[],
    register: TipRegister,
): PanelElement {
    const body = composeElement(document, "div", BODY_CLASS);
    assert(body.textContent === "", "a shelf begins saying nothing and is filled in");
    if (shelf.length === 0) {
        const empty = composeElement(document, "div", EMPTY_CLASS);
        empty.textContent = PANEL_WORDS.shelfEmpty;
        body.append(empty);
        return body;
    }
    assert(shelf.length >= 0, "a shelf holds what it holds");
    for (const fight of [...shelf].sort((one, other) => other.openedAt - one.openedAt)) {
        const row = composeElement(document, "div", ROW_CLASS);
        const name = composeElement(document, "span", ROW_NAME_CLASS);
        name.textContent = composeCountedNoun(fight.combatants, COUNTED_NOUNS.combatants);
        row.append(name);
        const parts = [row, name];
        if (fight.place !== null) {
            const where = composeElement(document, "span", PLACE_CLASS);
            where.textContent = fight.place;
            row.append(where);
            parts.push(where);
        }
        // The place is the elastic cell here, so it is the half a shelf row loses first.
        register.add(`shelf:${fight.openedAt}`, {
            name: fight.place ?? PANEL_WORDS.unknown,
            figure: { caption: PANEL_WORDS.combatants, value: fight.combatants },
            share: null,
        });
        setTipKeyOnRow(parts, `shelf:${fight.openedAt}`);
        body.append(row);
    }
    assert(shelf.length > 0, "a shelf with something on it draws a row for each");
    return body;
}

function composeBodyElement(
    document: PanelDocument,
    reading: PanelReading,
    metric: PanelMetric,
    register: TipRegister,
): PanelElement {
    const body = composeElement(document, "div", BODY_CLASS);
    assert(body.className === BODY_CLASS, "the body is the region it says it is");
    assert(reading.rows.length <= MAXIMUM_ROWS, "a screen stays inside the fight's stated bound");
    if (reading.rows.length === 0) {
        const empty = composeElement(document, "div", EMPTY_CLASS);
        empty.textContent = PANEL_WORDS.nothingYet;
        body.append(empty);
        return body;
    }
    assert(reading.total >= 0, "a fight's total is never below nothing");
    const figure = getWordsForScreen(metric);
    for (const row of reading.rows) {
        const key = `row:${row.combatantId}`;
        const tip = { register, key, figure, share: PANEL_WORDS.shareOfFight };
        body.append(composeRowElement(document, row, `${row.combatantId}`, tip));
    }
    if (reading.withoutActor > 0) {
        body.append(composePinnedElement(document, PANEL_WORDS.withoutActor, reading.withoutActor, {
            register,
            key: "pinned:actor",
            figure,
            share: null,
        }));
    }
    if (reading.withoutTarget > 0) {
        body.append(
            composePinnedElement(document, PANEL_WORDS.withoutTarget, reading.withoutTarget, {
                register,
                key: "pinned:target",
                figure,
                share: null,
            }),
        );
    }
    return body;
}

/** One kind of damage. It opens nothing: a cut of a cut is a figure the protocol never states. */
function composeElementRowElement(
    document: PanelDocument,
    row: ElementRow,
    tip: RowTip,
): PanelElement {
    assert(row.figure >= 0, "a kind drawn states a figure that is not below nothing");
    const element = composeElement(document, "div", ROW_CLASS);
    const bar = composeShareBackground(
        composeBarColour(getColourForElement(row.element)),
        row.share,
    );
    element.setAttribute(STYLE_ATTRIBUTE, `background-image:${bar}`);
    const name = composeElement(document, "span", ROW_NAME_CLASS);
    name.textContent = getWordsForElement(row.element);
    const figure = composeElement(document, "span", ROW_FIGURE_CLASS);
    figure.textContent = `${row.figure}`;
    element.append(name);
    element.append(figure);
    tip.register.add(tip.key, {
        name: name.textContent,
        figure: { caption: tip.figure, value: row.figure },
        share: tip.share === null ? null : { caption: tip.share, value: row.share },
    });
    setTipKeyOnRow([element, name, figure], tip.key);
    assert(name.textContent.length > 0, "a kind is drawn in words, or under the game's own token");
    return element;
}

function composeSectionElement(document: PanelDocument, heading: string): PanelElement {
    assert(heading.length > 0, "a cut that is drawn says what it is cut by");
    const element = composeElement(document, "div", SECTION_CLASS);
    element.textContent = heading;
    return element;
}

/**
 * The fight's own strip, and the one region that always draws.
 *
 * It is a summary rather than a banner, and the distinction is that it shows whether or not
 * anything went wrong: a strip that appears only on a bad reading is a banner, however it is
 * worded. A doubt that names nobody is said here, because no row can carry it — and it is said
 * only on a screen whose figure the doubt could actually shorten.
 */
function composeSummaryElement(document: PanelDocument, view: PanelView): PanelElement {
    const reading = view.reading;
    const strip = composeElement(document, "div", SUMMARY_CLASS);
    const name = composeElement(document, "span", SUMMARY_NAME_CLASS);
    const total = composeElement(document, "span", SUMMARY_FIGURE_CLASS);
    // The strip summarises whatever stands above it, and on the shelf that is the shelf. Saying
    // the live fight's total there states a figure under a heading the reader is not looking at.
    name.textContent = view.isOnShelf ? PANEL_WORDS.fights : getWordsForScreen(view.current);
    total.textContent = view.isOnShelf ? `${view.shelf.length}` : `${reading.total}`;
    strip.append(name);
    strip.append(total);
    assert(reading.total >= 0, "a fight's total is never below nothing");
    assert(name.textContent.length > 0, "and the strip says which figure it is the total of");
    if (view.isOnShelf) return strip;
    if (!reading.isSuspect) return strip;
    const mark = composeElement(document, "div", SUSPECT_CLASS);
    mark.textContent = `${SUSPECT_MARK}${PANEL_WORDS.suspect}`;
    strip.append(mark);
    return strip;
}

/** The way back, and whose row stands open over the screen. */
function composeDrillHeadElement(
    document: PanelDocument,
    drill: DrillReading,
    tip: RowTip,
): PanelElement {
    const head = composeElement(document, "div", DRILL_HEAD_CLASS);
    const name = composeElement(document, "span", ROW_NAME_CLASS);
    name.textContent = drill.name ?? PANEL_WORDS.unknown;
    const total = composeElement(document, "span", ROW_FIGURE_CLASS);
    total.textContent = `${drill.total}`;
    head.append(name);
    head.append(total);
    // No share: the figure standing open is what every share under it is measured against.
    tip.register.add(tip.key, {
        name: name.textContent,
        figure: { caption: tip.figure, value: drill.total },
        share: null,
    });
    setTipKeyOnRow([head, name, total], tip.key);
    assert(drill.total >= 0, "a figure opened is never below nothing");
    return head;
}

/**
 * One row opened: the way back, whose row it is, and the same figure cut twice — by the other end
 * of each blow, and by the kind of damage it carried. Neither cut is opened any further.
 *
 * A cut with nothing in it draws no heading. The two fail apart rather than together: a blow the
 * protocol tied to nobody still states what it was dealt with, so the kinds can stand alone.
 *
 * What no kind was stated for is pinned below the kinds, the way a figure belonging to nobody is
 * pinned below a ranking. It is never spread over the kinds that were stated.
 */
function composeDrillElement(
    document: PanelDocument,
    drill: DrillReading,
    metric: PanelMetric,
    register: TipRegister,
): PanelElement {
    const body = composeElement(document, "div", BODY_CLASS);
    const crumb = composeElement(document, "div", CRUMB_CLASS);
    crumb.textContent = `${BACK_MARK}${PANEL_WORDS.everyone}`;
    crumb.setAttribute(BACK_ATTRIBUTE, PANEL_WORDS.everyone);
    body.append(crumb);
    // Every share under an opened row is a share of that row's own figure, never of the fight's.
    const figure = getWordsForScreen(metric);
    const share = PANEL_WORDS.shareOfFigure;
    body.append(composeDrillHeadElement(document, drill, {
        register,
        key: `head:${drill.combatantId}`,
        figure,
        share: null,
    }));
    assert(drill.byOpponent.length <= MAXIMUM_ROWS, "an opened row stays inside the fight's bound");
    assert(drill.byElement.length <= MAXIMUM_KINDS, "and inside the bound a cut is kept to");
    const hasKinds = drill.byElement.length > 0 || drill.withoutElement > 0;
    if (drill.byOpponent.length === 0) {
        if (!hasKinds) {
            const empty = composeElement(document, "div", EMPTY_CLASS);
            empty.textContent = PANEL_WORDS.nothingYet;
            body.append(empty);
            return body;
        }
    }
    const opponents = getWordsForOpponentCut(metric);
    if (drill.byOpponent.length > 0) {
        if (opponents !== null) body.append(composeSectionElement(document, opponents));
        for (const row of drill.byOpponent) {
            const tip = { register, key: `row:${row.combatantId}`, figure, share };
            body.append(composeRowElement(document, row, null, tip));
        }
    }
    if (hasKinds) {
        body.append(composeSectionElement(document, PANEL_WORDS.damageKind));
        for (const row of drill.byElement) {
            const tip = { register, key: `kind:${row.element}`, figure, share };
            body.append(composeElementRowElement(document, row, tip));
        }
        if (drill.withoutElement > 0) {
            body.append(
                composePinnedElement(document, PANEL_WORDS.withoutKind, drill.withoutElement, {
                    register,
                    key: "pinned:kind",
                    figure,
                    share: null,
                }),
            );
        }
    }
    return body;
}

/**
 * A region that cannot be drawn is replaced by a marker at its own size, and the panel keeps its
 * shape. This is one of the four boundaries, and the only broad catch in this file.
 */
function composeRegion(
    document: PanelDocument,
    compose: () => PanelElement,
    handleFailure: (failure: unknown) => void,
): PanelElement {
    assert(typeof compose === "function", "a region is drawn by something");
    try {
        return compose();
    } catch (failure) {
        handleFailure(failure);
        const undrawn = composeElement(document, "div", UNDRAWN_CLASS);
        undrawn.textContent = PANEL_WORDS.undrawn;
        return undrawn;
    }
}

/** Everything one drawing of the panel is: the figures, the screen, and the fights behind it. */
export interface PanelView {
    reading: PanelReading;
    current: PanelMetric;
    shelf: readonly ShelfRow[];
    isOnShelf: boolean;
    /** The row standing open over the screen, or nobody's. */
    drill: DrillReading | null;
    /** Where the fight is being fought, already in words. Null where the client would not say. */
    place: string | null;
}

/** What a press asked for, read off the pressed element's own attribute. */
export type PanelPress =
    | { kind: "screen"; screen: string }
    | { kind: "row"; stated: string }
    | { kind: "back" };

/** The shelf stands over an opened row, and an opened row over the screen it was opened on. */
function composeViewBody(
    document: PanelDocument,
    view: PanelView,
    register: TipRegister,
): PanelElement {
    assert(SCREEN_ORDER.includes(view.current), "a view is on a screen the strip draws");
    assert(view.shelf.length >= 0, "and carries the fights behind it, however few");
    if (view.isOnShelf) return composeShelfElement(document, view.shelf, register);
    if (view.drill !== null) {
        return composeDrillElement(document, view.drill, view.current, register);
    }
    return composeBodyElement(document, view.reading, view.current, register);
}

/**
 * The three listeners, all of them at the root and none of them on a row.
 *
 * A press inside a shadow root is retargeted for anybody listening outside it, so the host is the
 * wrong place for any of these — and what a listener is handed is the deepest element under the
 * pointer, which is why every part of a row wears the row's own marks.
 */
function setPanelHostListeners(
    root: PanelRoot,
    handlePress: (press: PanelPress) => void,
    handleHover: (key: string | null, clientY: number) => void,
): void {
    root.addEventListener(PRESS_EVENT, (event) => {
        const target = event.target;
        if (target === null) return;
        const screen = target.getAttribute(SCREEN_ATTRIBUTE);
        if (screen !== null) {
            handlePress({ kind: "screen", screen });
            return;
        }
        const stated = target.getAttribute(ROW_ATTRIBUTE);
        if (stated !== null) {
            handlePress({ kind: "row", stated });
            return;
        }
        if (target.getAttribute(BACK_ATTRIBUTE) !== null) handlePress({ kind: "back" });
    });
    root.addEventListener(MOVE_EVENT, (event) => {
        const target = event.target;
        handleHover(target === null ? null : target.getAttribute(TIP_ATTRIBUTE), event.clientY);
    });
    root.addEventListener(LEAVE_EVENT, (event) => handleHover(null, event.clientY));
}

/** The panel on the page, and the way to put a new view into the one that is already there. */
export interface PanelHandle {
    element: PanelElement;
    show(view: PanelView): void;
}

/** One region redrawn in place, handing back what now stands where the old one did. */
function composeRegionInPlace(
    document: PanelDocument,
    standing: PanelElement,
    compose: () => PanelElement,
    handleFailure: (failure: unknown) => void,
): PanelElement {
    const next = composeRegion(document, compose, handleFailure);
    standing.replaceWith(next);
    assert(next.className.length > 0, "a region that took another's place is a region of its own");
    return next;
}

/**
 * The host is built once and stays. Only the regions inside it are replaced, so the listener at
 * the root outlives every redraw and a press during one is not swallowed.
 *
 * The press is read off the pressed element's own attribute, which is what makes one listener
 * enough: no row and no tab ever carries a handler of its own.
 */
export function composePanelHost(
    document: PanelDocument,
    handlePress: (press: PanelPress) => void,
    handleFailure: (failure: unknown) => void,
): PanelHandle {
    const host = document.createElement("div");
    assert(HOST_NAME.startsWith("MargoMeter-"), "the host is named as ours before anything else");
    host.setAttribute("id", HOST_NAME);
    const root = host.attachShadow({ mode: "open" });
    // The sheet is put in once and never replaced: a region redrawn under it keeps its look, and
    // a browser re-parses nothing on a redraw.
    const sheet = document.createElement("style");
    sheet.textContent = composeStyleSheet();
    root.append(sheet);
    assert(sheet.textContent.length > 0, "the panel is handed its look before it draws anything");
    let title = composeElement(document, "div", TITLE_CLASS);
    let tabs = composeElement(document, "div", TABS_CLASS);
    let body = composeElement(document, "div", BODY_CLASS);
    let summary = composeElement(document, "div", SUMMARY_CLASS);
    const redraw = (standing: PanelElement, compose: () => PanelElement) => {
        return composeRegionInPlace(document, standing, compose, handleFailure);
    };
    // The detail is a region like the four above it, and the last of them, so it stands over what
    // it describes. It is put in once and never replaced by a redraw of any other.
    const register = composeTipRegister();
    const tip: TipHandle = composeTipHandle(document, register, redraw);
    root.append(title);
    root.append(tabs);
    root.append(body);
    root.append(summary);
    root.append(tip.element);
    setPanelHostListeners(root, handlePress, (key, clientY) => tip.show(key, clientY));
    assert(host.className === "", "the host wears no class of the game's making");
    return {
        element: host,
        show(view: PanelView): void {
            register.reset();
            title = redraw(title, () => composeTitleElement(document, view.place));
            tabs = redraw(tabs, () => composeTabsElement(document, view));
            body = redraw(body, () => composeViewBody(document, view, register));
            summary = redraw(summary, () => composeSummaryElement(document, view));
            // The detail outlives the redraw and follows the figure it names as that figure moves.
            // A row that has stopped being drawn takes its detail with it.
            tip.refresh();
            assert(tabs !== body, "the regions are that many elements");
            assert(title !== tabs, "and none of them stands in for another");
            assert(summary !== body, "the strip is its own region, drawn whatever the body says");
        },
    };
}
