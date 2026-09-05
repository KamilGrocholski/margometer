/** Where the panel sits, and how a reader moves it. Nothing here measures the document. */

/** A position is two numbers written as JSON; text longer than this is not one. */
const MAXIMUM_STORED = 4096;
import { composeIntegerText, getIntegerFromText } from "@/libs/number-text.ts";
import { getJsonReading } from "@/libs/json-text.ts";
import { getValueWithin } from "@/libs/number-range.ts";
import { getNumberFromUnknown, isRecord } from "@/libs/unknown-reading.ts";
import type { PanelElement, PanelEvent, PanelRoot } from "@/src/ui/panel-element.ts";
import { setGuardedListener } from "@/src/ui/panel-listener.ts";
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

/**
 * A whole pixel, on the screen, and a number a style can be written from. `getValueWithin` refuses
 * anything else, so what is not one is answered before it is handed over (**E14**).
 */
function getPositionWithin(value: number, limit: number): number {
    if (!Number.isFinite(value)) return 0;
    if (!Number.isFinite(limit)) return Math.round(value);
    const held = Math.round(getValueWithin(value, 0, limit));
    if (!Number.isSafeInteger(held)) return 0;
    return held;
}

/**
 * **Every position downstream of this is whole, finite and safe to write into a style.** A null
 * viewport clamps nothing: a width read as zero would look exactly like one that works.
 */
export function composeClampedPosition(
    position: PanelPosition,
    viewport: PanelViewport | null,
): PanelPosition {
    if (viewport === null) {
        return {
            left: getPositionWithin(position.left, Number.POSITIVE_INFINITY),
            top: getPositionWithin(position.top, Number.POSITIVE_INFINITY),
        };
    }
    return {
        left: getPositionWithin(position.left, viewport.width - MINIMUM_VISIBLE),
        top: getPositionWithin(position.top, viewport.height - MINIMUM_VISIBLE),
    };
}

/**
 * The middle of the window, where a panel nobody has moved opens (`DESIGN.md`). It is centred on
 * the **tallest** body the sheet allows rather than the one it has: a panel centred on its waiting
 * bar walks down the screen as rows arrive, and this one stands still.
 *
 * Null where the page states no size, because a position derived from a guess snatches the panel
 * out from under the hand — the sheet's own corner then stands, which is a place and not a guess.
 */
export function composeDefaultPosition(viewport: PanelViewport | null): PanelPosition | null {
    if (viewport === null) return null;
    const width = getIntegerFromText(PLACE.width.slice(0, -2));
    const share = getIntegerFromText(SPACE.heightShareMaximum.slice(0, -2));
    // A token that stopped reading as pixels leaves the sheet's own corner standing, which the
    // docblock above says is a place and not a guess (**E14**).
    if (width === null) return null;
    if (share === null) return null;
    const height = viewport.height * share / 100;
    return composeClampedPosition({
        left: (viewport.width - width) / 2,
        top: (viewport.height - height) / 2,
    }, viewport);
}

function composeDraggedPosition(
    grab: PanelGrab,
    pointer: PanelPosition,
    viewport: PanelViewport | null,
): PanelPosition {
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
    if (text.length > MAXIMUM_STORED) return null;
    const reading = getJsonReading(text);
    if (!reading.isOk) return null;
    if (!isRecord(reading.value)) return null;
    const left = getNumberFromUnknown(reading.value["left"]);
    const top = getNumberFromUnknown(reading.value["top"]);
    if (left === null || top === null) return null;
    if (!Number.isSafeInteger(left)) return null;
    if (!Number.isSafeInteger(top)) return null;
    return { left, top };
}

/**
 * By hand rather than through a stringifier, which turns a `NaN` into `null` without saying so.
 * Null where there is no position to write, so the reader keeps the place they last left.
 */
export function composeStoredTextFromPosition(position: PanelPosition): string | null {
    if (!Number.isSafeInteger(position.left)) return null;
    if (!Number.isSafeInteger(position.top)) return null;
    const left = composeIntegerText(position.left);
    const top = composeIntegerText(position.top);
    return `{"left":${left},"top":${top}}`;
}

/**
 * `right: auto` is what releases the default corner: the sheet anchors the host to the top right,
 * and a `left` alone would leave both edges pinned and stretch the host across the page. The top
 * is written twice on purpose — the ceiling that keeps the panel above the bottom of the screen
 * is the window's height less where its top edge is, and CSS cannot read a `top` back out of an
 * inline style.
 */
export function composePositionStyle(position: PanelPosition): string | null {
    if (!Number.isSafeInteger(position.left)) return null;
    if (!Number.isSafeInteger(position.top)) return null;
    const left = composeIntegerText(position.left);
    const top = composeIntegerText(position.top);
    return `left:${left}px;top:${top}px;${TOP_VARIABLE}:${top}px;right:auto`;
}

export function composeTipLeft(
    position: PanelPosition | null,
    viewport: PanelViewport | null,
    tipWidth: number,
): number | null {
    if (!Number.isFinite(tipWidth)) return null;
    if (tipWidth <= 0) return null;
    if (position === null) return null;
    if (viewport === null) return null;
    // Both are this panel's own tokens, so a reading that fails is a token that changed shape
    // rather than anything a page did — zero would place the window against the wrong edge.
    const width = getIntegerFromText(PLACE.width.slice(0, -2));
    const gap = getIntegerFromText(SPACE.small.slice(0, -2));
    if (width === null) return null;
    if (gap === null) return null;
    const beside = position.left - tipWidth - gap;
    if (beside >= 0) return beside;
    const other = position.left + width + gap;
    return Math.min(other, Math.max(0, viewport.width - tipWidth));
}

export interface PanelPlacement {
    position: PanelPosition | null;
    getViewport(): PanelViewport | null;
    /** Where they let go, once per drag: a move reported per event is a write per frame. */
    handleMoved(position: PanelPosition): void;
}

export function setGripMark(bar: PanelElement): void {
    bar.setAttribute(GRIP_ATTRIBUTE, "");
}

function getPointerFromEvent(event: PanelEvent): PanelPosition | null {
    const left = getNumberFromUnknown(event.clientX);
    const top = getNumberFromUnknown(event.clientY);
    if (left === null || top === null) return null;
    return { left, top };
}

/**
 * The drag, as four listeners at the root and one style attribute on the host.
 *
 * Every one of them catches its own: an add-on that breaks the game's own scripts has done more
 * damage than one that shows a wrong number, and a pointer handler is the one place a throw of
 * ours would reach a page that listens for the same event.
 */
/**
 * What a press on the bar starts, or null where it starts nothing: a press somewhere else, a
 * pointer the event does not state, or a page that has not said how wide it is — a drag from a
 * guessed origin jumps under the hand.
 */
function composePanelDragGrab(
    event: PanelEvent,
    position: PanelPosition | null,
    placement: PanelPlacement,
): PanelGrab | null {
    if (event.target?.getAttribute(GRIP_ATTRIBUTE) === null) return null;
    const pointer = getPointerFromEvent(event);
    if (pointer === null) return null;
    const from = position ?? composeDefaultPosition(placement.getViewport());
    if (from === null) return null;
    // Without this the browser starts its own text or image drag from the bar.
    event.preventDefault?.();
    return {
        pointerLeft: pointer.left,
        pointerTop: pointer.top,
        panelLeft: from.left,
        panelTop: from.top,
    };
}

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
    // The reader's place, or the middle of the window: a position from the first frame is what
    // lets the detail window and the card answer the side the panel is on (**ADR 0019**), where a
    // panel left on the sheet's corner has no `left` for either of them to read.
    let position = placement.position ?? composeDefaultPosition(placement.getViewport());
    let grab: PanelGrab | null = null;
    // A position that writes no style leaves the host on the sheet's own corner, which is a place
    // — and the panel is still there to be grabbed (**E14**).
    const setHostPosition = (next: PanelPosition): void => {
        const style = composePositionStyle(next);
        if (style === null) return;
        position = next;
        host.setAttribute(STYLE_ATTRIBUTE, style);
    };
    if (position !== null) {
        setHostPosition(composeClampedPosition(position, placement.getViewport()));
    }
    const setGuarded = (type: string, handle: (event: PanelEvent) => void): void => {
        setGuardedListener(root, type, handle, (failure) => {
            // A grab left standing after a failure moves the panel under the next pointer that
            // crosses it, with nobody having pressed the bar.
            grab = null;
            handleFailure(failure);
        });
    };
    setGuarded("pointerdown", (event) => {
        const started = composePanelDragGrab(event, position, placement);
        if (started === null) return;
        grab = started;
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
    if (pointerId === undefined) return;
    try {
        if (isHeld) bar.setPointerCapture?.(pointerId);
        else bar.releasePointerCapture?.(pointerId);
    } catch (failure) {
        handleFailure(failure);
    }
}
