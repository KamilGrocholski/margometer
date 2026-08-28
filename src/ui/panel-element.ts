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
import type { PanelMetric, PanelReading, PanelRow, ShelfRow } from "@/src/ui/panel-reading.ts";
import { getWordsForScreen, SCREEN_ORDER, SHELF_SCREEN } from "@/src/ui/panel-screen.ts";
import { composeCountedNoun, COUNTED_NOUNS, PANEL_WORDS } from "@/src/ui/panel-words.ts";

/** The whole of the document this asks for. A browser's own satisfies it. */
export interface PanelDocument {
    createElement(tag: string): PanelElement;
}

/** What a delegated listener is handed. The target is where the press landed, or nobody. */
export interface PanelEvent {
    target: { getAttribute(name: string): string | null } | null;
}

export interface PanelElement {
    className: string;
    textContent: string;
    append(child: PanelElement): void;
    /** One listener at the root, never one per row. */
    addEventListener(type: string, handle: (event: PanelEvent) => void): void;
    /** How a redrawn panel takes the place of the one before it, rather than stacking on it. */
    replaceWith(other: PanelElement): void;
    setAttribute(name: string, value: string): void;
    attachShadow(options: { mode: "open" }): PanelRoot;
}

export interface PanelRoot {
    append(child: PanelElement): void;
}

const HOST_NAME = "MargoMeter-Panel";
const TITLE_CLASS = "MargoMeter-titlebar";
const BODY_CLASS = "MargoMeter-body";
/**
 * The strip is one of the panel's own regions, so it is named as ours like the bar and the body.
 * What sits inside a region is not: the game's stylesheet cannot reach behind the root.
 */
const ROW_CLASS = "row";
const ROW_NAME_CLASS = "row-name";
const ROW_FIGURE_CLASS = "row-figure";
const TABS_CLASS = "MargoMeter-tabs";
const TAB_CLASS = "tab";
/** More than colour, because colour never carries meaning by itself. */
const TAB_CURRENT_CLASS = "tab tab-current";
const TAB_CURRENT_MARK = "• ";
const SCREEN_ATTRIBUTE = "data-screen";
/** What the panel listens for: a press, not a click, so a drag never counts as one. */
const PRESS_EVENT = "pointerdown";
const UNDRAWN_CLASS = "undrawn";
const EMPTY_CLASS = "empty";
const PINNED_CLASS = "pinned";
const SUSPECT_CLASS = "warning";
/** A fight holds twenty, and a screen draws a row for each. */
const MAXIMUM_ROWS = 20;

function composeElement(document: PanelDocument, tag: string, className: string): PanelElement {
    const element = document.createElement(tag);
    element.className = className;
    assert(element.className === className, "an element wears the class it was given");
    return element;
}

function composeRowElement(document: PanelDocument, row: PanelRow): PanelElement {
    assert(row.figure >= 0, "a row drawn states a figure that is not below nothing");
    const element = composeElement(document, "div", ROW_CLASS);
    const name = composeElement(document, "span", ROW_NAME_CLASS);
    name.textContent = row.name ?? PANEL_WORDS.unknown;
    const figure = composeElement(document, "span", ROW_FIGURE_CLASS);
    figure.textContent = `${row.figure}`;
    element.append(name);
    element.append(figure);
    assert(name.textContent.length > 0, "a row names somebody, or says it cannot");
    return element;
}

/** A figure that belongs to nobody is a row of its own, below the ranking and the same height. */
function composePinnedElement(
    document: PanelDocument,
    label: string,
    figure: number,
): PanelElement {
    const element = composeElement(document, "div", PINNED_CLASS);
    assert(element.textContent === "", "a row begins saying nothing and is filled in");
    const name = composeElement(document, "span", ROW_NAME_CLASS);
    name.textContent = label;
    const stated = composeElement(document, "span", ROW_FIGURE_CLASS);
    stated.textContent = `${figure}`;
    element.append(name);
    element.append(stated);
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

/** The fights already fought, newest first, each saying how many were in it. */
function composeShelfElement(document: PanelDocument, shelf: readonly ShelfRow[]): PanelElement {
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
        body.append(row);
    }
    assert(shelf.length > 0, "a shelf with something on it draws a row for each");
    return body;
}

function composeBodyElement(document: PanelDocument, reading: PanelReading): PanelElement {
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
    for (const row of reading.rows) body.append(composeRowElement(document, row));
    if (reading.withoutActor > 0) {
        body.append(composePinnedElement(document, PANEL_WORDS.withoutActor, reading.withoutActor));
    }
    if (reading.withoutTarget > 0) {
        body.append(
            composePinnedElement(document, PANEL_WORDS.withoutTarget, reading.withoutTarget),
        );
    }
    if (reading.isSuspect) {
        const mark = composeElement(document, "div", SUSPECT_CLASS);
        mark.textContent = PANEL_WORDS.suspect;
        body.append(mark);
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
}

/** The panel on the page, and the way to put a new view into the one that is already there. */
export interface PanelHandle {
    element: PanelElement;
    show(view: PanelView): void;
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
    handlePress: (screen: string) => void,
    handleFailure: (failure: unknown) => void,
): PanelHandle {
    const host = document.createElement("div");
    assert(HOST_NAME.startsWith("MargoMeter-"), "the host is named as ours before anything else");
    host.setAttribute("id", HOST_NAME);
    const root = host.attachShadow({ mode: "open" });
    const title = composeRegion(document, () => {
        const bar = composeElement(document, "div", TITLE_CLASS);
        bar.textContent = PANEL_WORDS.title;
        return bar;
    }, handleFailure);
    let tabs = composeElement(document, "div", TABS_CLASS);
    let body = composeElement(document, "div", BODY_CLASS);
    root.append(title);
    root.append(tabs);
    root.append(body);
    host.addEventListener(PRESS_EVENT, (event) => {
        const screen = event.target?.getAttribute(SCREEN_ATTRIBUTE) ?? null;
        if (screen === null) return;
        handlePress(screen);
    });
    assert(host.className === "", "the host wears no class of the game's making");
    return {
        element: host,
        show(view: PanelView): void {
            const nextTabs = composeRegion(
                document,
                () => composeTabsElement(document, view),
                handleFailure,
            );
            const nextBody = composeRegion(
                document,
                () =>
                    view.isOnShelf
                        ? composeShelfElement(document, view.shelf)
                        : composeBodyElement(document, view.reading),
                handleFailure,
            );
            tabs.replaceWith(nextTabs);
            body.replaceWith(nextBody);
            tabs = nextTabs;
            body = nextBody;
            assert(tabs !== body, "the two regions are two elements");
        },
    };
}
