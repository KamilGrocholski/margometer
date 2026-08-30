/** Where the panel sits, and how a reader moves it. Nothing here measures the document. */

import { assert } from "@std/assert";
import { composeIntegerText, getIntegerFromText } from "@/libs/number-text.ts";
import { getJsonReading } from "@/libs/json-text.ts";
import { getNumberFromUnknown, isRecord } from "@/libs/unknown-reading.ts";
import type { PanelElement, PanelEvent, PanelRoot } from "@/src/ui/panel-element.ts";
import { PLACE, SPACE } from "@/src/ui/panel-look.ts";

export interface PanelPosition {
    left: number;
    top: number;
}

export interface PanelViewport {
    width: number;
    height: number;
}

interface PanelGrab {
    pointerLeft: number;
    pointerTop: number;
    panelLeft: number;
    panelTop: number;
}

/**
 * A panel dragged off the edge cannot be dragged back, because the grab area goes with it.
 * A title bar's worth stays on screen each way.
 */
const MINIMUM_VISIBLE = 64;
const TOP_VARIABLE = "--MargoMeter-panel-top";
const STYLE_ATTRIBUTE = "style";
const GRIP_ATTRIBUTE = "data-grip";

/** Zero wins a viewport narrower than the margin: a limit below zero puts the panel off-screen. */
function getValueWithin(value: number, limit: number): number {
    assert(Number.isFinite(value), "a position being clamped is a number");
    assert(Number.isFinite(limit), "and is clamped against one");
    return Math.round(Math.max(0, Math.min(value, Math.max(0, limit))));
}

/** A null viewport clamps nothing: a width read as zero would look exactly like one that works. */
export function composeClampedPosition(
    position: PanelPosition,
    viewport: PanelViewport | null,
): PanelPosition {
    assert(Number.isFinite(position.left), "a position is two numbers");
    assert(Number.isFinite(position.top), "and both of them are stated");
    if (viewport === null) {
        return { left: Math.round(position.left), top: Math.round(position.top) };
    }
    return {
        left: getValueWithin(position.left, viewport.width - MINIMUM_VISIBLE),
        top: getValueWithin(position.top, viewport.height - MINIMUM_VISIBLE),
    };
}

/**
 * Where the sheet has already put the panel. The corner is stated as `top` and `right`, so no
 * `left` can be read off the host until something writes one: the first grab derives it from the
 * two numbers the sheet was built from, and answers null where the page states no width — a drag
 * from a guessed origin snatches the panel out from under the hand.
 */
export function composeDefaultPosition(viewport: PanelViewport | null): PanelPosition | null {
    if (viewport === null) return null;
    const width = getIntegerFromText(PLACE.width.slice(0, -2));
    const inset = getIntegerFromText(PLACE.inset.slice(0, -2));
    assert(width !== null, "the panel is as wide as the sheet says, in whole pixels");
    assert(inset !== null, "and sits as far from the corner as it says, in whole pixels");
    return composeClampedPosition({ left: viewport.width - width - inset, top: inset }, viewport);
}

function composeDraggedPosition(
    grab: PanelGrab,
    pointer: PanelPosition,
    viewport: PanelViewport | null,
): PanelPosition {
    assert(Number.isFinite(grab.panelLeft), "a drag moves a panel that was somewhere");
    assert(Number.isFinite(pointer.left), "and follows a pointer that is somewhere");
    return composeClampedPosition({
        left: grab.panelLeft + (pointer.left - grab.pointerLeft),
        top: grab.panelTop + (pointer.top - grab.pointerTop),
    }, viewport);
}

/**
 * A stored position, or null for anything that is not one: it comes back from text a person can
 * edit and a browser can truncate, so a fraction, a number written as text and a whole other
 * shape all read the same, which is *no position*.
 */
export function getPositionFromStoredText(text: string): PanelPosition | null {
    assert(text.length >= 0, "a stored position is read back as text, however little of it");
    const reading = getJsonReading(text);
    if (!reading.isOk) return null;
    if (!isRecord(reading.value)) return null;
    const left = getNumberFromUnknown(reading.value["left"]);
    const top = getNumberFromUnknown(reading.value["top"]);
    if (left === null || top === null) return null;
    if (!Number.isSafeInteger(left)) return null;
    if (!Number.isSafeInteger(top)) return null;
    assert(Number.isSafeInteger(left), "a position read back is two whole numbers");
    return { left, top };
}

/** By hand rather than through a stringifier, which turns a `NaN` into `null` without saying so. */
export function composeStoredTextFromPosition(position: PanelPosition): string {
    const left = composeIntegerText(position.left);
    const top = composeIntegerText(position.top);
    assert(left.length > 0, "a position written down states where it is across");
    assert(top.length > 0, "and where it is down");
    return `{"left":${left},"top":${top}}`;
}

/**
 * `right: auto` is what releases the default corner: the sheet anchors the host to the top right,
 * and a `left` alone would leave both edges pinned and stretch the host across the page. The top
 * is written twice on purpose — the ceiling that keeps the panel above the bottom of the screen
 * is the window's height less where its top edge is, and CSS cannot read a `top` back out of an
 * inline style.
 */
export function composePositionStyle(position: PanelPosition): string {
    const left = composeIntegerText(position.left);
    const top = composeIntegerText(position.top);
    const style = `left:${left}px;top:${top}px;${TOP_VARIABLE}:${top}px;right:auto`;
    assert(style.includes(TOP_VARIABLE), "the ceiling is told where the panel's top edge is");
    assert(style.endsWith("right:auto"), "and the corner the sheet anchored to is released");
    return style;
}

export function composeTipLeft(
    position: PanelPosition | null,
    viewport: PanelViewport | null,
    tipWidth: number,
): number | null {
    assert(tipWidth > 0, "a detail window is as wide as it was told");
    if (position === null) return null;
    if (viewport === null) return null;
    const width = getIntegerFromText(PLACE.width.slice(0, -2)) ?? 0;
    const gap = getIntegerFromText(SPACE.small.slice(0, -2)) ?? 0;
    const beside = position.left - tipWidth - gap;
    if (beside >= 0) return beside;
    const other = position.left + width + gap;
    assert(other > beside, "the other side of a panel is further along than the first");
    return Math.min(other, Math.max(0, viewport.width - tipWidth));
}

export interface PanelPlacement {
    position: PanelPosition | null;
    getViewport(): PanelViewport | null;
    /** Where they let go, once per drag: a move reported per event is a write per frame. */
    handleMoved(position: PanelPosition): void;
}

export function setGripMark(bar: PanelElement): void {
    assert(GRIP_ATTRIBUTE.startsWith("data-"), "what starts a drag is marked by an attribute");
    bar.setAttribute(GRIP_ATTRIBUTE, "");
    assert(bar.className.length > 0, "and the bar is a region before it is a handle");
}

function getPointerFromEvent(event: PanelEvent): PanelPosition | null {
    assert(typeof event === "object", "a pointer states where it is on an event of its own");
    const left = getNumberFromUnknown(event.clientX);
    const top = getNumberFromUnknown(event.clientY);
    if (left === null || top === null) return null;
    assert(Number.isFinite(left), "and states it as a number this arithmetic can use");
    return { left, top };
}

/**
 * The drag, as four listeners at the root and one style attribute on the host.
 *
 * Every one of them catches its own: an add-on that breaks the game's own scripts has done more
 * damage than one that shows a wrong number, and a pointer handler is the one place a throw of
 * ours would reach a page that listens for the same event.
 */
export function setPanelDrag(
    root: PanelRoot,
    host: PanelElement,
    /**
     * The bar as it stands now, rather than the one standing when the drag was wired: the bar is
     * a region like any other and is replaced on every payload, so a captured pointer would be
     * asked of a node that has left the tree.
     */
    getBar: () => PanelElement,
    placement: PanelPlacement,
    handleFailure: (failure: unknown) => void,
): () => PanelPosition | null {
    assert(typeof placement.getViewport === "function", "a drag is clamped against something");
    assert(typeof getBar === "function", "and starts from the bar as it stands now");
    let position = placement.position;
    let grab: PanelGrab | null = null;
    const setHostPosition = (next: PanelPosition): void => {
        assert(Number.isSafeInteger(next.left), "a panel is put at a whole pixel across");
        assert(Number.isSafeInteger(next.top), "and at a whole one down");
        position = next;
        host.setAttribute(STYLE_ATTRIBUTE, composePositionStyle(next));
    };
    if (position !== null) {
        setHostPosition(composeClampedPosition(position, placement.getViewport()));
    }
    const setGuarded = (type: string, handle: (event: PanelEvent) => void): void => {
        assert(type.startsWith("pointer"), "a drag listens for the pointer and nothing else");
        assert(typeof handle === "function", "and each of its four does something");
        root.addEventListener(type, (event) => {
            try {
                handle(event);
            } catch (failure) {
                grab = null;
                handleFailure(failure);
            }
        });
    };
    setGuarded("pointerdown", (event) => {
        if (event.target?.getAttribute(GRIP_ATTRIBUTE) === null) return;
        const pointer = getPointerFromEvent(event);
        if (pointer === null) return;
        // Null means the page did not say how wide it is, and a drag from a guessed origin
        // would jump under the hand.
        const from = position ?? composeDefaultPosition(placement.getViewport());
        if (from === null) return;
        // Without this the browser starts its own text or image drag from the bar.
        event.preventDefault?.();
        grab = {
            pointerLeft: pointer.left,
            pointerTop: pointer.top,
            panelLeft: from.left,
            panelTop: from.top,
        };
        setPointerHeld(getBar(), true, event.pointerId, handleFailure);
    });
    setGuarded("pointermove", (event) => {
        const held = grab;
        if (held === null) return;
        const pointer = getPointerFromEvent(event);
        if (pointer === null) return;
        setHostPosition(composeDraggedPosition(held, pointer, placement.getViewport()));
    });
    const handleDragEnd = (event: PanelEvent): void => {
        assert(typeof placement.handleMoved === "function", "where a drag ends is reported once");
        if (grab === null) return;
        grab = null;
        setPointerHeld(getBar(), false, event.pointerId, handleFailure);
        if (position !== null) placement.handleMoved(position);
    };
    setGuarded("pointerup", handleDragEnd);
    setGuarded("pointercancel", handleDragEnd);
    // A getter rather than the value: a drag outlives this call, and whoever draws beside the
    // panel needs where it is **now** rather than where it was when the listeners went on.
    return () => position;
}

/**
 * Capture is the forgiving part of a drag rather than the drag: a document offering neither method
 * still moves the panel, and what it loses is a hand that outruns it. It is caught apart from the
 * drag because it throws where the drag does not — a pointer a browser no longer considers active
 * is refused, and one refusal inside the drag's own guard would clear the grab and move nothing.
 */
function setPointerHeld(
    bar: PanelElement,
    isHeld: boolean,
    pointerId: number | undefined,
    handleFailure: (failure: unknown) => void,
): void {
    assert(typeof handleFailure === "function", "a refusal to hold a pointer is reported");
    if (pointerId === undefined) return;
    try {
        if (isHeld) bar.setPointerCapture?.(pointerId);
        else bar.releasePointerCapture?.(pointerId);
    } catch (failure) {
        handleFailure(failure);
    }
}
