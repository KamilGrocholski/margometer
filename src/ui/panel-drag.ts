/**
 * Where a window sits, and how a reader moves it. Nothing here measures the document.
 *
 * **Two windows share this root, and a grip says which.** `develop ADR 0060`.
 */

import { clamp } from "#/libs/number-range.ts";
import * as errors from "#/libs/errors.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import {
    PANEL_WINDOW,
    type PanelPosition,
    type PanelWindow,
    type WindowSize,
} from "./panel-choice.ts";
import {
    EVENT_TYPE,
    type PanelElement,
    type PanelEvent,
    type PanelRoot,
    STYLE_ATTRIBUTE,
} from "./panel-document.ts";
import { PANEL_INTENT, type PanelIntent } from "./panel-intent.ts";
import { addGuardedListener } from "./panel-listener.ts";
import {
    composeSizedPanelStyle,
    getBarHeight,
    PANEL_HEIGHT_VIEWPORT_PERCENT_MAXIMUM,
    PLACE,
    SIZE_GRIP,
    SIZE_VARIABLES,
    SPACE_PIXELS,
    TOP_VARIABLES,
    type TypeTokens,
} from "./panel-look.ts";
import { formatWhole } from "./panel-words.ts";
import {
    addViewFailureGuarded,
    GestureDropped,
    PANEL_LISTENER,
    type PanelListener,
    type ViewFailure,
    WindowUnplaced,
} from "./view-failure.ts";

export interface PanelViewport {
    width: number;
    height: number;
}

/** A bar moves a window and a corner sizes it, on the same four listeners. */
const GRAB_KIND = { move: "move", size: "size" } as const;
type GrabKind = VocabularyWord<typeof GRAB_KIND>;

interface PanelGrab {
    kind: GrabKind;
    pointerLeft: number;
    pointerTop: number;
    /** Where the window stood, for a move; how big it stood, for a size. */
    fromLeft: number;
    fromTop: number;
    /** The pointer taken hold of, so the hold and the release are asked of the same one. */
    pointerId: number | undefined;
}

/** How wide the two windows stand, which a change of type moves unless a reader sized them. */
export interface WindowWidths {
    panel: number;
    standing: number;
}

/** The least and the most a window may be made, for the type it is drawn in and where it stands. */
export interface SizeBounds {
    widthMinimum: number;
    widthMaximum: number;
    heightMinimum: number;
    heightMaximum: number;
}

/** What a drag holds between its listeners: where the window is, how big, and what is held. */
interface PanelDragState {
    position: PanelPosition | null;
    /** The size the reader chose, before the window and the type bound it. */
    size: WindowSize | null;
    grab: PanelGrab | null;
    /** The style last written, so a frame that changes nothing writes nothing. */
    written: string | null;
}

/** A window a card stands beside: where its left edge is, and how wide it stands. */
export interface TipWindowPlace {
    position: PanelPosition;
    widthPixels: number;
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
    /** Stand the window here as a drag would leave it, and tell whoever a drag tells. */
    setPosition(next: PanelPosition): void;
    /** How wide the window stands now: its size where it has one, its type's where it has none. */
    getWidthPixels(): number;
    /** The size a frame hands in. A frame landing while the corner is held is not the hand's. */
    setSize(next: WindowSize | null): void;
}

export interface PanelPlacement {
    position: PanelPosition | null;
    size: WindowSize | null;
    /** The page's size, asked as it is needed: a window resize moves the edges. */
    readViewport(): PanelViewport | null;
}

/** Who the drag tells. Where they let go is told once per drag: a write per frame is too many. */
export interface PanelDragOptions {
    window: PanelWindow;
    /** The type a reader chose decides how wide each window stands, and it can change. */
    getTypeTokens: () => TypeTokens;
    /** Told a move or a resize once, on release. */
    onIntent: (intent: PanelIntent) => void;
    onFailure: (failure: ViewFailure) => void;
    /** The corner the window is sized by. It is built once and stays, unlike the bar. */
    grip: PanelElement;
}

/**
 * A panel dragged off the edge cannot be dragged back, because the grab area goes with it.
 * A title bar's worth stays on screen each way.
 */
const VISIBLE_MINIMUM = 64;
export const GRIP_ATTRIBUTE = "data-grip";
/** The corner's mark, stating the window the way `GRIP_ATTRIBUTE` does. */
export const SIZE_GRIP_ATTRIBUTE = "data-size-grip";
/** How much wider than its type a window may be made: twice, past any name a row has to cut. */
const WIDTH_TIMES_TYPE_MAXIMUM = 2;
/**
 * The fewest rows' height a sized window keeps: the panel its header, its strips and a few rows,
 * which the list then scrolls; the window beside it a heading and the row under it.
 */
const ROWS_BY_WINDOW_MINIMUM: { readonly [Window in PanelWindow]: number } = {
    [PANEL_WINDOW.panel]: 6,
    [PANEL_WINDOW.helper]: 3,
};
/** What a grip states. The helper's is `develop`'s word for it, which the drawn panel keeps. */
export const GRIP_MARK_BY_WINDOW: { readonly [Window in PanelWindow]: string } = {
    [PANEL_WINDOW.panel]: "panel",
    [PANEL_WINDOW.helper]: "standing",
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
export function composeDefaultPosition(
    viewport: PanelViewport | null,
    panelWidthPixels: number,
): PanelPosition | null {
    if (viewport === null) return null;
    const height = viewport.height * PANEL_HEIGHT_VIEWPORT_PERCENT_MAXIMUM / 100;
    return clampPosition({
        left: (viewport.width - panelWidthPixels) / 2,
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
    windowName: PanelWindow,
): string | null {
    if (!Number.isSafeInteger(position.left)) return null;
    if (!Number.isSafeInteger(position.top)) return null;
    const left = formatWhole(position.left);
    const top = formatWhole(position.top);
    return `left:${left}px;top:${top}px;${TOP_VARIABLES[windowName]}:${top}px;right:auto`;
}

/**
 * The window's style: where it stands, and how big where it was made so. Null where neither can be
 * written, which leaves it on the sheet's own corner at its type's size.
 */
export function composeHostStyle(
    position: PanelPosition | null,
    size: WindowSize | null,
    windowName: PanelWindow,
): string | null {
    const placed = position === null ? null : composePositionStyle(position, windowName);
    if (size === null) return placed;
    if (!Number.isSafeInteger(size.width)) return placed;
    if (!Number.isSafeInteger(size.height)) return placed;
    const variables = SIZE_VARIABLES[windowName];
    const width = formatWhole(size.width);
    const height = formatWhole(size.height);
    const both = `${variables.width}:${width}px;${variables.height}:${height}px`;
    const sized = windowName === PANEL_WINDOW.panel ? `${both};${composeSizedPanelStyle()}` : both;
    return placed === null ? sized : `${placed};${sized}`;
}

/**
 * The narrowest is the type's own width, because the bar holds its controls at that width and not
 * a pixel less; the widest is twice it and on the screen. The shortest keeps a few rows; the
 * tallest reaches the bottom of the screen. A screen too small for the least is given the least.
 */
export function composeSizeBounds(
    windowName: PanelWindow,
    tokens: TypeTokens,
    position: PanelPosition | null,
    viewport: PanelViewport | null,
): SizeBounds {
    const widthMinimum = getWindowWidthPixels(windowName, tokens);
    const rowCost = tokens.rowHeightPixels + SPACE_PIXELS.half;
    const heightMinimum = ROWS_BY_WINDOW_MINIMUM[windowName] * rowCost;
    let widthMaximum = widthMinimum * WIDTH_TIMES_TYPE_MAXIMUM;
    let heightMaximum = Number.POSITIVE_INFINITY;
    if (viewport !== null) {
        if (position !== null) {
            widthMaximum = Math.min(
                widthMaximum,
                viewport.width - position.left - PLACE.insetPixels,
            );
            heightMaximum = viewport.height - position.top - getBarHeight(tokens) -
                PLACE.insetPixels;
        }
    }
    return {
        widthMinimum,
        widthMaximum: Math.max(widthMinimum, widthMaximum),
        heightMinimum,
        heightMaximum: Math.max(heightMinimum, heightMaximum),
    };
}

/** How wide a window stands at its type, which is also the narrowest it may be made. */
function getWindowWidthPixels(windowName: PanelWindow, tokens: TypeTokens): number {
    if (windowName === PANEL_WINDOW.helper) return tokens.standingWidthPixels;
    return tokens.panelWidthPixels;
}

/** **Every size downstream of this is whole and inside its bounds**, and one not stated is the least. */
export function clampSize(size: WindowSize, bounds: SizeBounds): WindowSize {
    const width = Number.isFinite(size.width) ? size.width : bounds.widthMinimum;
    const height = Number.isFinite(size.height) ? size.height : bounds.heightMinimum;
    return {
        width: Math.round(clamp(width, bounds.widthMinimum, bounds.widthMaximum)),
        height: Math.round(clamp(height, bounds.heightMinimum, bounds.heightMaximum)),
    };
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
    return place.position.left + place.widthPixels;
}

export function setGripMark(grip: PanelElement, window: PanelWindow): void {
    grip.setAttribute(GRIP_ATTRIBUTE, GRIP_MARK_BY_WINDOW[window]);
}

/**
 * Where the window beside the panel stands once the type both are drawn in has changed size, or
 * null where it should stay. **Both windows grow rightwards from where they stand**, so a window
 * beside the panel keeps its side by moving: one standing to the left keeps its right edge, one to
 * the right keeps its distance from the panel's. One standing over or under the panel is not beside
 * it, and stays. Without this, a larger step stood the window over the panel's own ranks.
 */
export function composeStandingAfterStep(
    panel: PanelPosition,
    standing: PanelPosition,
    before: WindowWidths,
    after: WindowWidths,
): PanelPosition | null {
    const standingRight = standing.left + before.standing;
    if (standingRight <= panel.left) {
        return { left: standing.left - (after.standing - before.standing), top: standing.top };
    }
    if (standing.left >= panel.left + before.panel) {
        return { left: standing.left + (after.panel - before.panel), top: standing.top };
    }
    return null;
}

/**
 * The drag, as four listeners at the root and one style attribute on the host. `getBar` answers
 * with the bar **as it stands now**: a bar is replaced on every payload, so a captured pointer
 * would be asked of a node that has left the tree. The corner that sizes the window is held on the
 * same listeners, and its grab is a second kind of the same thing.
 */
export function initPanelDrag(
    root: PanelRoot,
    host: PanelElement,
    getBar: () => PanelElement,
    placement: PanelPlacement,
    options: PanelDragOptions,
): PanelDragHandle {
    let position: PanelPosition | null;
    // Open the window at the reader's place, or the middle of the screen.
    {
        // A position from the first frame is what lets the detail window and the card answer the
        // side they stand on (`develop ADR 0090`), where a panel left on the sheet's corner has no
        // `left` for either of them to read.
        //
        // ⚠️ **This runs on the stack the add-on stands up on**, under no region: a place that will
        // not be read or written leaves the panel on the sheet's corner and the drag still wired
        // (**E12**).
        const opened = errors.attempt(() => {
            const opening = placement.position ??
                composeOpeningPosition(
                    options.window,
                    placement.readViewport(),
                    options.getTypeTokens(),
                );
            if (opening === null) return null;
            const clamped = clampPosition(opening, placement.readViewport());
            const style = composePositionStyle(clamped, options.window);
            if (style === null) return opening;
            host.setAttribute(STYLE_ATTRIBUTE, style);
            return clamped;
        });
        if (opened instanceof Error) {
            addViewFailureGuarded(options.onFailure, new WindowUnplaced(options.window, opened));
            position = null;
        } else position = opened;
    }
    const state: PanelDragState = {
        position,
        size: placement.size,
        grab: null,
        written: null,
    };
    const write = () => {
        // Write the style the window stands in now.
        // A position that writes no style leaves the host on the sheet's own corner, which is a
        // place — and the window is still there to be grabbed (**E12**).
        const applied = getPanelDragSize(state, placement, options);
        const style = composeHostStyle(state.position, applied, options.window);
        if (style === null) return;
        if (style === state.written) return;
        state.written = style;
        host.setAttribute(STYLE_ATTRIBUTE, style);
    };
    write();
    // Listen for the grab, the drag and the release.
    {
        const add = (
            type: string,
            listener: PanelListener,
            handle: (event: PanelEvent) => void,
        ) => {
            addGuardedListener(root, type, listener, handle, (failure) => {
                // A grab left standing after a failure moves the window under the next pointer that
                // crosses it, with nobody having pressed the bar.
                state.grab = null;
                addViewFailureGuarded(options.onFailure, failure);
            });
        };
        const getHeld = (grab: PanelGrab): PanelElement => {
            if (grab.kind === GRAB_KIND.size) return options.grip;
            return getBar();
        };
        add(EVENT_TYPE.press, PANEL_LISTENER.grab, (event) => {
            const started = composePanelDragGrab(event, state, placement, options);
            if (started === null) return;
            state.grab = started;
            setPointerHeld(getHeld(started), true, event.pointerId, options);
        });
        const onDragEnd = (): void => {
            const grab = state.grab;
            if (grab === null) return;
            state.grab = null;
            setPointerHeld(getHeld(grab), false, grab.pointerId, options);
            const window = options.window;
            if (grab.kind === GRAB_KIND.size) {
                const size = state.size;
                if (size !== null) options.onIntent({ kind: PANEL_INTENT.resize, window, size });
            } else {
                const position = state.position;
                if (position !== null) {
                    options.onIntent({ kind: PANEL_INTENT.move, window, position });
                }
            }
        };
        add(EVENT_TYPE.move, PANEL_LISTENER.drag, (event) => {
            const grab = state.grab;
            if (grab === null) return;
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
            const viewport = placement.readViewport();
            if (grab.kind === GRAB_KIND.move) {
                writePanelDragPosition(
                    state,
                    composeDraggedPosition(grab, pointer, viewport),
                    write,
                );
                return;
            }
            state.size = composeDraggedSize(grab, pointer, state, placement, options);
            write();
        });
        add(EVENT_TYPE.release, PANEL_LISTENER.release, onDragEnd);
        add(EVENT_TYPE.cancel, PANEL_LISTENER.cancel, onDragEnd);
    }
    return {
        getPosition: () => state.position,
        onDrawn: () => {
            if (state.grab?.kind === GRAB_KIND.move) {
                // Hold the pointer again, on the bar a draw put in place of the held one.
                // Every draw replaces the bar, and a browser drops the capture with the node it
                // was on. What is missed then is the release: the drag would go on armed, and
                // the panel follow the next pointer to cross it with nobody holding it.
                const grab = state.grab;
                setPointerHeld(getBar(), true, grab.pointerId, options);
            }
        },
        setPosition: (next: PanelPosition) => {
            writePanelDragPosition(state, clampPosition(next, placement.readViewport()), write);
            const position = state.position;
            if (position !== null) {
                options.onIntent({ kind: PANEL_INTENT.move, window: options.window, position });
            }
        },
        getWidthPixels: () => {
            const applied = getPanelDragSize(state, placement, options);
            return applied?.width ?? getWindowWidthPixels(options.window, options.getTypeTokens());
        },
        setSize: (next: WindowSize | null) => {
            if (state.grab?.kind === GRAB_KIND.size) return;
            state.size = next;
            write();
        },
    };
}

/** The size the reader chose, bound by the type the window is drawn in and where it stands now. */
function getPanelDragSize(
    state: PanelDragState,
    placement: PanelPlacement,
    options: PanelDragOptions,
): WindowSize | null {
    if (state.size === null) return null;
    const viewport = placement.readViewport();
    const tokens = options.getTypeTokens();
    return clampSize(
        state.size,
        composeSizeBounds(options.window, tokens, state.position, viewport),
    );
}

function writePanelDragPosition(
    state: PanelDragState,
    next: PanelPosition,
    write: () => void,
): void {
    if (!Number.isSafeInteger(next.left)) return;
    if (!Number.isSafeInteger(next.top)) return;
    state.position = next;
    write();
}

/** Where a window nobody has moved opens, which is not the same place for both of them. */
function composeOpeningPosition(
    windowName: PanelWindow,
    viewport: PanelViewport | null,
    tokens: TypeTokens,
): PanelPosition | null {
    if (windowName === PANEL_WINDOW.helper) return composeStandingPosition(viewport, tokens);
    return composeDefaultPosition(viewport, tokens.panelWidthPixels);
}

/**
 * Where the second window opens: **beside** the panel and level with it, never centred.
 * `composeDefaultPosition` centres what it is given, so centring both puts this one exactly under
 * the panel — where the panel paints over it and a reader sees nothing at all. `develop ADR 0060`.
 */
function composeStandingPosition(
    viewport: PanelViewport | null,
    tokens: TypeTokens,
): PanelPosition | null {
    const panel = composeDefaultPosition(viewport, tokens.panelWidthPixels);
    if (panel === null) return null;
    const gap = SPACE_PIXELS.small;
    const beside = panel.left - tokens.standingWidthPixels - gap;
    if (beside >= 0) return clampPosition({ left: beside, top: panel.top }, viewport);
    // No room on the left, so the other side — the same answer the card gives (`develop ADR 0090`).
    const other = { left: panel.left + tokens.panelWidthPixels + gap, top: panel.top };
    return clampPosition(other, viewport);
}

/**
 * What a press starts, or null where it starts nothing: a press somewhere else, a pointer the
 * event does not state, or a page that has not said how wide it is — a drag from a guessed origin
 * jumps under the hand.
 */
function composePanelDragGrab(
    event: PanelEvent,
    state: PanelDragState,
    placement: PanelPlacement,
    options: PanelDragOptions,
): PanelGrab | null {
    // `undefined` is not `null`: as one comparison, a press stating no target fell through and
    // started a drag from wherever the pointer was.
    const grip = event.target?.getAttribute(GRIP_ATTRIBUTE) ?? null;
    const corner = event.target?.getAttribute(SIZE_GRIP_ATTRIBUTE) ?? null;
    // Both listener sets see every press, so the other window's bar reaches here too.
    const mark = GRIP_MARK_BY_WINDOW[options.window];
    const kind = grip === mark ? GRAB_KIND.move : corner === mark ? GRAB_KIND.size : null;
    if (kind === null) return null;
    const pointer = readPointerFromEvent(event);
    if (pointer === null) return null;
    const tokens = options.getTypeTokens();
    const from = state.position ??
        composeDefaultPosition(placement.readViewport(), tokens.panelWidthPixels);
    if (from === null) return null;
    // Without this the browser starts its own text or image drag from the bar.
    event.preventDefault?.();
    const grab = {
        kind,
        pointerLeft: pointer.left,
        pointerTop: pointer.top,
        pointerId: event.pointerId,
    };
    if (kind === GRAB_KIND.move) return { ...grab, fromLeft: from.left, fromTop: from.top };
    // Nothing on the page is measured: the window's corner is the grip's, where the press landed on
    // the grip carried to its edge.
    const inside = SIZE_GRIP.sizePixels;
    const right = pointer.left + inside - readOffset(event.offsetX, inside);
    const bottom = pointer.top + inside - readOffset(event.offsetY, inside);
    return {
        ...grab,
        fromLeft: right - from.left,
        fromTop: bottom - from.top - getBarHeight(tokens),
    };
}

/** Where on the grip a press landed, and the corner itself where the event does not say. */
function readOffset(value: number | undefined, corner: number): number {
    const read = readCoordinate(value);
    return read === null ? corner : read;
}

function composeDraggedSize(
    grab: PanelGrab,
    pointer: PanelPosition,
    state: PanelDragState,
    placement: PanelPlacement,
    options: PanelDragOptions,
): WindowSize {
    const size = {
        width: grab.fromLeft + (pointer.left - grab.pointerLeft),
        height: grab.fromTop + (pointer.top - grab.pointerTop),
    };
    const tokens = options.getTypeTokens();
    const bounds = composeSizeBounds(
        options.window,
        tokens,
        state.position,
        placement.readViewport(),
    );
    return clampSize(size, bounds);
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
    const held = errors.attempt(() => {
        if (isHeld) bar.setPointerCapture?.(pointerId);
        else bar.releasePointerCapture?.(pointerId);
    });
    if (!(held instanceof Error)) return;
    addViewFailureGuarded(options.onFailure, new GestureDropped(PANEL_LISTENER.capture, held));
}

function composeDraggedPosition(
    grab: PanelGrab,
    pointer: PanelPosition,
    viewport: PanelViewport | null,
): PanelPosition {
    return clampPosition({
        left: grab.fromLeft + (pointer.left - grab.pointerLeft),
        top: grab.fromTop + (pointer.top - grab.pointerTop),
    }, viewport);
}
