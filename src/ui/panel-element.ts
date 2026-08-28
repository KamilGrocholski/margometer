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
import type { PanelReading, PanelRow } from "@/src/ui/panel-reading.ts";
import { PANEL_WORDS } from "@/src/ui/panel-words.ts";

/** The whole of the document this asks for. A browser's own satisfies it. */
export interface PanelDocument {
    createElement(tag: string): PanelElement;
}

export interface PanelElement {
    className: string;
    textContent: string;
    append(child: PanelElement): void;
    setAttribute(name: string, value: string): void;
    attachShadow(options: { mode: "open" }): PanelRoot;
}

export interface PanelRoot {
    append(child: PanelElement): void;
}

const HOST_NAME = "MargoMeter-Panel";
const TITLE_CLASS = "MargoMeter-titlebar";
const BODY_CLASS = "MargoMeter-body";
/** Inside the root, where the game's stylesheet cannot reach, so no prefix is needed. */
const ROW_CLASS = "row";
const ROW_NAME_CLASS = "row-name";
const ROW_FIGURE_CLASS = "row-figure";
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

/** The host, its shadow root, and the two regions inside it. Nothing is drawn twice. */
export function composePanelElement(
    document: PanelDocument,
    reading: PanelReading,
    handleFailure: (failure: unknown) => void,
): PanelElement {
    const host = document.createElement("div");
    assert(HOST_NAME.startsWith("MargoMeter-"), "the host is named as ours before anything else");
    host.setAttribute("id", HOST_NAME);
    const root = host.attachShadow({ mode: "open" });
    const title = composeRegion(document, () => {
        const bar = composeElement(document, "div", TITLE_CLASS);
        bar.textContent = PANEL_WORDS.title;
        return bar;
    }, handleFailure);
    const body = composeRegion(
        document,
        () => composeBodyElement(document, reading),
        handleFailure,
    );
    root.append(title);
    root.append(body);
    assert(host.className === "", "the host wears no class of the game's making");
    return host;
}
