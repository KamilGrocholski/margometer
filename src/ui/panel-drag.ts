/**
 * Where a window sits, and how a reader moves it. Nothing here measures the document.
 *
 * **Two windows share this root, and a grip says which.** `develop ADR 0060`.
 */

import { clamp } from "#/libs/number-range.ts";
import { callForeign, runGuarded } from "#/libs/result.ts";
import { PANEL_WINDOW, type PanelPosition, type PanelWindow } from "./panel-choice.ts";
import {
    EVENT_TYPE,
    type PanelElement,
    type PanelEvent,
    type PanelRoot,
    STYLE_ATTRIBUTE,
} from "./panel-document.ts";
import { addGuardedListener } from "./panel-listener.ts";
import {
    PANEL_HEIGHT_VIEWPORT_PERCENT_MAXIMUM,
    PLACE,
    SPACE_PIXELS,
    STANDING,
} from "./panel-look.ts";
import { formatWhole } from "./panel-words.ts";
import {
    PANEL_LISTENER,
    type PanelListener,
    reportViewFailure,
    VIEW_FAILURE,
    type ViewFailure,
} from "./view-failure.ts";

export interface PanelViewport {
    width: number;
    height: number;
}

interface PanelGrab {
    pointerLeft: number;
    pointerTop: number;
    panelLeft: number;
    panelTop: number;
    /** The pointer taken hold of, so the hold and the release are asked of the same one. */
    pointerId: number | undefined;
}

/** A window a card stands beside: where its left edge is, and which one it is. */
export interface TipWindowPlace {
    position: PanelPosition;
    windowName: PanelWindow;
}

/**
 * Which edge of the screen a card is measured from, and how far. **Never a left offset for a card
 * standing left of its window**: the card is as wide as what it says (`develop ADR 0091`), so a
 * left offset worked out from the bound would leave a card of two words floating the difference
 * away from the window it belongs to. The edge facing the window is the one that is pinned.
 */
export interface TipAcross {
    edge: "left" | "right";
    at: number;
}

/** What the panel keeps of a drag once the listeners are on. */
export interface PanelDragHandle {
    /**
     * A getter rather than the value: a drag outlives the call that wired it, and whoever draws
     * beside the panel needs where it is **now** rather than where it was then.
     */
    getPosition(): PanelPosition | null;
    /** The bar has been drawn again; take hold of the one standing. */
    onDrawn(): void;
}

export interface PanelPlacement {
    position: PanelPosition | null;
    /** The page's size, asked as it is needed: a window resize moves the edges. */
    readViewport(): PanelViewport | null;
}

/** Who the drag tells. Where they let go is told once per drag: a write per frame is too many. */
export interface PanelDragOptions {
    window: PanelWindow;
    onMoved: (position: PanelPosition) => void;
    onFailure: (failure: ViewFailure) => void;
}

/**
 * A panel dragged off the edge cannot be dragged back, because the grab area goes with it.
 * A title bar's worth stays on screen each way.
 */
const VISIBLE_MINIMUM = 64;
export const GRIP_ATTRIBUTE = "data-grip";
/** What a grip states. The helper's is `develop`'s word for it, which the drawn panel keeps. */
export const GRIP_MARK_BY_WINDOW: { readonly [Window in PanelWindow]: string } = {
    [PANEL_WINDOW.panel]: "panel",
    [PANEL_WINDOW.helper]: "standing",
};

/** One per window: sharing the panel's had the second rewriting the first one's ceiling. */
const TOP_VARIABLES: { readonly [Window in PanelWindow]: string } = {
    [PANEL_WINDOW.panel]: "--MargoMeter-panel-top",
    [PANEL_WINDOW.helper]: "--MargoMeter-standing-top",
};

/** How wide each window stands, which is what a card opening beside one has to step over. */
const WINDOW_WIDTHS_PIXELS: { readonly [Window in PanelWindow]: number } = {
    [PANEL_WINDOW.panel]: PLACE.widthPixels,
    [PANEL_WINDOW.helper]: STANDING.widthPixels,
};

/**
 * **Every position downstream of this is whole, finite and safe to write into a style.** A null
 * viewport clamps nothing: a width read as zero would look exactly like one that works.
 */
export function clampPosition(
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
        left: getPositionWithin(position.left, viewport.width - VISIBLE_MINIMUM),
        top: getPositionWithin(position.top, viewport.height - VISIBLE_MINIMUM),
    };
}

/**
 * A whole pixel, on the screen, and a number a style can be written from. `clamp` refuses
 * anything else, so what is not one is answered before it is handed over (**E12**).
 */
function getPositionWithin(value: number, limit: number): number {
    if (!Number.isFinite(value)) return 0;
    if (!Number.isFinite(limit)) return Math.round(value);
    const held = Math.round(clamp(value, 0, limit));
    if (!Number.isSafeInteger(held)) return 0;
    return held;
}

/**
 * The middle of the window, where a panel nobody has moved opens (`DESIGN.md`). It is
 * centred on the **tallest** body the sheet allows rather than the one it has: a panel centred on
 * its waiting bar walks down the screen as rows arrive, and this one stands still.
 *
 * Null where the page states no size, because a position derived from a guess snatches the panel
 * out from under the hand — the sheet's own corner then stands, which is a place and not a guess.
 */
export function composeDefaultPosition(viewport: PanelViewport | null): PanelPosition | null {
    if (viewport === null) return null;
    const height = viewport.height * PANEL_HEIGHT_VIEWPORT_PERCENT_MAXIMUM / 100;
    return clampPosition({
        left: (viewport.width - PLACE.widthPixels) / 2,
        top: (viewport.height - height) / 2,
    }, viewport);
}

/**
 * `right: auto` is what releases the default corner: the sheet anchors the host to the top right,
 * and a `left` alone would leave both edges pinned and stretch the host across the page. The top
 * is written twice on purpose — the ceiling that keeps the panel above the bottom of the screen
 * is the window's height less where its top edge is, and CSS cannot read a `top` back out of an
 * inline style.
 */
export function composePositionStyle(
    position: PanelPosition,
    windowName: PanelWindow = PANEL_WINDOW.panel,
): string | null {
    if (!Number.isSafeInteger(position.left)) return null;
    if (!Number.isSafeInteger(position.top)) return null;
    const left = formatWhole(position.left);
    const top = formatWhole(position.top);
    return `left:${left}px;top:${top}px;${TOP_VARIABLES[windowName]}:${top}px;right:auto`;
}

/**
 * Where a card opens: beside **the window whose row it names**, and that window alone. The other
 * one under this root is not consulted — a card that stepped past it as well left the window it
 * came from and stood where the reader was not pointing (`develop ADR 0090`). `DESIGN.md`
 * owns the rule.
 *
 * ⚠️ **The side is decided by the widest a card may be, never by the width of this one.** A card
 * is drawn at `max-content` and a short one would find room on the left where the card before it
 * found none — so the side a card opens on would change with what it happens to say, and a reader
 * crossing two rows would watch it jump the window. The bound is what every card was placed by
 * before `develop ADR 0091`, so this half of the answer does not move.
 */
export function composeTipAcross(
    anchor: TipWindowPlace | null,
    viewport: PanelViewport | null,
    tipWidthMaximum: number,
): TipAcross | null {
    if (!Number.isFinite(tipWidthMaximum)) return null;
    if (tipWidthMaximum <= 0) return null;
    if (anchor === null) return null;
    if (viewport === null) return null;
    const gap = SPACE_PIXELS.small;
    if (anchor.position.left - tipWidthMaximum - gap >= 0) {
        return { edge: "right", at: viewport.width - anchor.position.left + gap };
    }
    const right = composeWindowRight(anchor);
    // The clamp is the screen and it is spent on the bound, because what the card draws at is not
    // known here. A card narrower than the bound near the right edge therefore stands a little
    // further left than it had to — on the screen, which is what this line is for.
    return {
        edge: "left",
        at: Math.min(right + gap, Math.max(0, viewport.width - tipWidthMaximum)),
    };
}

function composeWindowRight(place: TipWindowPlace): number {
    return place.position.left + WINDOW_WIDTHS_PIXELS[place.windowName];
}

export function setGripMark(grip: PanelElement, window: PanelWindow): void {
    grip.setAttribute(GRIP_ATTRIBUTE, GRIP_MARK_BY_WINDOW[window]);
}

/**
 * The drag, as four listeners at the root and one style attribute on the host. `getBar` answers
 * with the bar **as it stands now**: a bar is replaced on every payload, so a captured pointer
 * would be asked of a node that has left the tree.
 */
export function initPanelDrag(
    root: PanelRoot,
    host: PanelElement,
    getBar: () => PanelElement,
    placement: PanelPlacement,
    options: PanelDragOptions,
): PanelDragHandle {
    const windowName = options.window;
    let position = initPanelDragOpening(host, placement, options);
    let grab: PanelGrab | null = null;
    // A position that writes no style leaves the host on the sheet's own corner, which is a place
    // — and the panel is still there to be grabbed (**E12**).
    const setHostPosition = (next: PanelPosition): void => {
        const style = composePositionStyle(next, windowName);
        if (style === null) return;
        position = next;
        host.setAttribute(STYLE_ATTRIBUTE, style);
    };
    const addDragListener = (
        type: string,
        listener: PanelListener,
        handle: (event: PanelEvent) => void,
    ): void => {
        addGuardedListener(root, type, listener, handle, (failure) => {
            // A grab left standing after a failure moves the panel under the next pointer that
            // crosses it, with nobody having pressed the bar.
            grab = null;
            reportViewFailure(options.onFailure, failure);
        });
    };
    addDragListener(EVENT_TYPE.press, PANEL_LISTENER.grab, (event) => {
        const started = composePanelDragGrab(event, position, placement, windowName);
        if (started === null) return;
        grab = started;
        setPointerHeld(getBar(), true, event.pointerId, options);
    });
    const onDragEnd = (): void => {
        const held = grab;
        if (held === null) return;
        grab = null;
        setPointerHeld(getBar(), false, held.pointerId, options);
        if (position !== null) options.onMoved(position);
    };
    addDragListener(EVENT_TYPE.move, PANEL_LISTENER.drag, (event) => {
        const held = grab;
        if (held === null) return;
        // A release the root never saw. Without capture — the forgiving part of a drag,
        // `setPointerHeld` — a hand letting go outside the panel reports its `pointerup`
        // elsewhere, and the grab left standing follows the next pointer to cross the panel.
        // No buttons stated is a document reporting none, not a hand that let go, and it is
        // not `0` either.
        if (event.buttons === 0) {
            onDragEnd();
            return;
        }
        const pointer = readPointerFromEvent(event);
        if (pointer === null) return;
        setHostPosition(composeDraggedPosition(held, pointer, placement.readViewport()));
    });
    addDragListener(EVENT_TYPE.release, PANEL_LISTENER.release, onDragEnd);
    addDragListener(EVENT_TYPE.cancel, PANEL_LISTENER.cancel, onDragEnd);
    return {
        getPosition: () => position,
        onDrawn: () => setPointerHeldAgain(grab, getBar(), options),
    };
}

/**
 * The reader's place, or the middle of the window: a position from the first frame is what lets
 * the detail window and the card answer the side they stand on (`develop ADR 0090`), where a
 * panel left on the sheet's corner has no `left` for either of them to read.
 *
 * ⚠️ **This runs on the stack the add-on stands up on**, under no region: a place that will not
 * be read or written leaves the panel on the sheet's corner and the drag still wired (**E12**).
 */
function initPanelDragOpening(
    host: PanelElement,
    placement: PanelPlacement,
    options: PanelDragOptions,
): PanelPosition | null {
    const opened = runGuarded(() => {
        const opening = placement.position ??
            composeOpeningPosition(options.window, placement.readViewport());
        if (opening === null) return null;
        const clamped = clampPosition(opening, placement.readViewport());
        const style = composePositionStyle(clamped, options.window);
        if (style === null) return opening;
        host.setAttribute(STYLE_ATTRIBUTE, style);
        return clamped;
    });
    if (opened.ok) return opened.value;
    reportViewFailure(options.onFailure, {
        kind: VIEW_FAILURE.windowUnplaced,
        window: options.window,
        cause: opened.error.cause,
    });
    return null;
}

/** Where a window nobody has moved opens, which is not the same place for both of them. */
function composeOpeningPosition(
    windowName: PanelWindow,
    viewport: PanelViewport | null,
): PanelPosition | null {
    if (windowName === PANEL_WINDOW.helper) return composeStandingPosition(viewport);
    return composeDefaultPosition(viewport);
}

/**
 * Where the second window opens: **beside** the panel and level with it, never centred.
 * `composeDefaultPosition` centres what it is given, so centring both puts this one exactly under
 * the panel — where the panel paints over it and a reader sees nothing at all. `develop ADR 0060`.
 */
function composeStandingPosition(viewport: PanelViewport | null): PanelPosition | null {
    const panel = composeDefaultPosition(viewport);
    if (panel === null) return null;
    const gap = SPACE_PIXELS.small;
    const beside = panel.left - STANDING.widthPixels - gap;
    if (beside >= 0) return clampPosition({ left: beside, top: panel.top }, viewport);
    // No room on the left, so the other side — the same answer the card gives (`develop ADR 0090`).
    const other = { left: panel.left + PLACE.widthPixels + gap, top: panel.top };
    return clampPosition(other, viewport);
}

/**
 * What a press on the bar starts, or null where it starts nothing: a press somewhere else, a
 * pointer the event does not state, or a page that has not said how wide it is — a drag from a
 * guessed origin jumps under the hand.
 */
function composePanelDragGrab(
    event: PanelEvent,
    position: PanelPosition | null,
    placement: PanelPlacement,
    windowName: PanelWindow,
): PanelGrab | null {
    // `undefined` is not `null`: as one comparison, a press stating no target fell through and
    // started a drag from wherever the pointer was.
    const grip = event.target?.getAttribute(GRIP_ATTRIBUTE) ?? null;
    if (grip === null) return null;
    // Both listener sets see every press, so the other window's bar reaches here too.
    if (grip !== GRIP_MARK_BY_WINDOW[windowName]) return null;
    const pointer = readPointerFromEvent(event);
    if (pointer === null) return null;
    const from = position ?? composeDefaultPosition(placement.readViewport());
    if (from === null) return null;
    // Without this the browser starts its own text or image drag from the bar.
    event.preventDefault?.();
    return {
        pointerLeft: pointer.left,
        pointerTop: pointer.top,
        panelLeft: from.left,
        panelTop: from.top,
        pointerId: event.pointerId,
    };
}

function readPointerFromEvent(event: PanelEvent): PanelPosition | null {
    const left = readCoordinate(event.clientX);
    const top = readCoordinate(event.clientY);
    if (left === null) return null;
    if (top === null) return null;
    return { left, top };
}

/** A browser states a coordinate, and a document standing in for one may state anything. */
function readCoordinate(value: unknown): number | null {
    if (typeof value !== "number") return null;
    if (!Number.isFinite(value)) return null;
    return value;
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
    options: PanelDragOptions,
): void {
    if (pointerId === undefined) return;
    const held = callForeign(() => {
        if (isHeld) bar.setPointerCapture?.(pointerId);
        else bar.releasePointerCapture?.(pointerId);
    });
    if (held.ok) return;
    reportViewFailure(options.onFailure, {
        kind: VIEW_FAILURE.gestureDropped,
        listener: PANEL_LISTENER.capture,
        cause: held.error.cause,
    });
}

function composeDraggedPosition(
    grab: PanelGrab,
    pointer: PanelPosition,
    viewport: PanelViewport | null,
): PanelPosition {
    return clampPosition({
        left: grab.panelLeft + (pointer.left - grab.pointerLeft),
        top: grab.panelTop + (pointer.top - grab.pointerTop),
    }, viewport);
}

/**
 * Every draw replaces the bar, and a browser drops the capture with the node it was on. What is
 * missed then is the release: the drag would go on armed, and the panel follow the next pointer to
 * cross it with nobody holding it.
 */
function setPointerHeldAgain(
    grab: PanelGrab | null,
    bar: PanelElement,
    options: PanelDragOptions,
): void {
    if (grab === null) return;
    setPointerHeld(bar, true, grab.pointerId, options);
}
