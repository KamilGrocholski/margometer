/**
 * Where a window sits, and how a reader moves it. Nothing here measures the document.
 *
 * **Two windows share this root, and a grip says which.** `develop ADR 0060`.
 */

import { clampNumber } from "#/libs/number-range.ts";
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
    METER_HEIGHT_VIEWPORT_PERCENT_MAXIMUM,
    PLACE,
    SIZE_GRIP,
    SIZE_VARIABLES,
    SPACE_PIXELS,
    TOP_VARIABLES,
    type TypeTokens,
} from "./panel-look.ts";
import { formatWholeUngrouped } from "./panel-words.ts";
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
    meter: number;
    helper: number;
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
export interface CardWindowPlace {
    position: PanelPosition;
    widthPixels: number;
}

/** The edge of the screen a card is measured from. */
export const CARD_EDGE = { left: "left", right: "right" } as const;
export type CardEdge = VocabularyWord<typeof CARD_EDGE>;

/**
 * Which edge of the screen a card is measured from, and how far. **Never a left offset for a card
 * standing left of its window**: the card is as wide as what it says (`develop ADR 0091`), so a
 * left offset worked out from the bound would leave a card of two words floating the difference
 * away from the window it belongs to. The edge facing the window is the one that is pinned.
 */
export interface CardAcross {
    edge: CardEdge;
    offsetPixels: number;
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
    setPosition(position: PanelPosition): void;
    /** How wide the window stands now: its size where it has one, its type's where it has none. */
    getWidthPixels(): number;
    /** The size a frame hands in. A frame landing while the corner is held is not the hand's. */
    setSize(size: WindowSize | null): void;
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
const VISIBLE_PIXELS_MINIMUM = 64;
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
    [PANEL_WINDOW.meter]: 6,
    [PANEL_WINDOW.helper]: 3,
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
        left: getPositionWithin(position.left, viewport.width - VISIBLE_PIXELS_MINIMUM),
        top: getPositionWithin(position.top, viewport.height - VISIBLE_PIXELS_MINIMUM),
    };
}

/**
 * A whole pixel, on the screen, and a number a style can be written from. `clampNumber` refuses
 * anything else, so what is not one is answered before it is handed over (**E12**).
 */
function getPositionWithin(coordinate: number, limit: number): number {
    if (!Number.isFinite(coordinate)) return 0;
    let clamped: number;
    if (Number.isFinite(limit)) clamped = clampNumber(coordinate, 0, limit);
    else clamped = coordinate;
    const rounded = Math.round(clamped);
    if (!Number.isSafeInteger(rounded)) return 0;
    return rounded;
}

/**
 * Where a panel nobody has moved opens, centred as `DESIGN.md` states. Null where the page states
 * no size: a position derived from a guess snatches the panel out from under the hand.
 */
export function composeDefaultPosition(
    viewport: PanelViewport | null,
    meterWidthPixels: number,
): PanelPosition | null {
    if (viewport === null) return null;
    const height = viewport.height * METER_HEIGHT_VIEWPORT_PERCENT_MAXIMUM / 100;
    return clampPosition({
        left: (viewport.width - meterWidthPixels) / 2,
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
    panelWindow: PanelWindow,
): string | null {
    if (!Number.isSafeInteger(position.left)) return null;
    if (!Number.isSafeInteger(position.top)) return null;
    const left = formatWholeUngrouped(position.left);
    const top = formatWholeUngrouped(position.top);
    return `left:${left}px;top:${top}px;${TOP_VARIABLES[panelWindow]}:${top}px;right:auto`;
}

/**
 * The window's style: where it stands, and how big where it was made so. Null where neither can be
 * written, which leaves it on the sheet's own corner at its type's size.
 */
export function composeHostStyle(
    position: PanelPosition | null,
    size: WindowSize | null,
    panelWindow: PanelWindow,
): string | null {
    const placed = position === null ? null : composePositionStyle(position, panelWindow);
    if (size === null) return placed;
    if (!Number.isSafeInteger(size.width)) return placed;
    if (!Number.isSafeInteger(size.height)) return placed;
    const variables = SIZE_VARIABLES[panelWindow];
    const width = formatWholeUngrouped(size.width);
    const height = formatWholeUngrouped(size.height);
    const both = `${variables.width}:${width}px;${variables.height}:${height}px`;
    const sized = panelWindow === PANEL_WINDOW.meter ? `${both};${composeSizedPanelStyle()}` : both;
    return placed === null ? sized : `${placed};${sized}`;
}

/**
 * The narrowest is the type's own width, because the bar holds its controls at that width and not
 * a pixel less; the widest is twice it and on the screen. The shortest keeps a few rows; the
 * tallest reaches the bottom of the screen. A screen too small for the least is given the least.
 */
export function composeSizeBounds(
    panelWindow: PanelWindow,
    tokens: TypeTokens,
    position: PanelPosition | null,
    viewport: PanelViewport | null,
): SizeBounds {
    const widthMinimum = getWindowWidthPixels(panelWindow, tokens);
    const rowCost = tokens.rowHeightPixels + SPACE_PIXELS.half;
    const heightMinimum = ROWS_BY_WINDOW_MINIMUM[panelWindow] * rowCost;
    const widthTypeMaximum = widthMinimum * WIDTH_TIMES_TYPE_MAXIMUM;
    let widthMaximum: number;
    let heightMaximum: number;
    if (viewport !== null) {
        if (position !== null) {
            widthMaximum = Math.min(
                widthTypeMaximum,
                viewport.width - position.left - PLACE.insetPixels,
            );
            heightMaximum = viewport.height - position.top - getBarHeight(tokens) -
                PLACE.insetPixels;
        } else {
            widthMaximum = widthTypeMaximum;
            heightMaximum = Number.POSITIVE_INFINITY;
        }
    } else {
        widthMaximum = widthTypeMaximum;
        heightMaximum = Number.POSITIVE_INFINITY;
    }
    return {
        widthMinimum,
        widthMaximum: Math.max(widthMinimum, widthMaximum),
        heightMinimum,
        heightMaximum: Math.max(heightMinimum, heightMaximum),
    };
}

/** How wide a window stands at its type, which is also the narrowest it may be made. */
function getWindowWidthPixels(panelWindow: PanelWindow, tokens: TypeTokens): number {
    if (panelWindow === PANEL_WINDOW.helper) return tokens.helperWidthPixels;
    return tokens.meterWidthPixels;
}

/**
 * **Every size downstream of this is whole and inside its bounds**, and one not stated is the
 * least.
 */
export function clampSize(size: WindowSize, bounds: SizeBounds): WindowSize {
    const width = Number.isFinite(size.width) ? size.width : bounds.widthMinimum;
    const height = Number.isFinite(size.height) ? size.height : bounds.heightMinimum;
    // ⚠️ A window with no screen or no place has no tallest, and `clampNumber` takes no endless
    // top: held to it, a stored size on such a page threw where the add-on stands up.
    const heightHeld = Number.isFinite(bounds.heightMaximum)
        ? clampNumber(height, bounds.heightMinimum, bounds.heightMaximum)
        : Math.max(height, bounds.heightMinimum);
    return {
        width: Math.round(clampNumber(width, bounds.widthMinimum, bounds.widthMaximum)),
        height: Math.round(heightHeld),
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
export function composeCardAcross(
    anchor: CardWindowPlace | null,
    viewport: PanelViewport | null,
    cardWidthMaximum: number,
): CardAcross | null {
    if (!Number.isFinite(cardWidthMaximum)) return null;
    if (cardWidthMaximum <= 0) return null;
    if (anchor === null) return null;
    if (viewport === null) return null;
    const gap = SPACE_PIXELS.small;
    if (anchor.position.left - cardWidthMaximum - gap >= 0) {
        return { edge: CARD_EDGE.right, offsetPixels: viewport.width - anchor.position.left + gap };
    }
    const right = composeWindowRight(anchor);
    // The clamp is the screen and it is spent on the bound, because what the card draws at is not
    // known here. A card narrower than the bound near the right edge therefore stands a little
    // further left than it had to — on the screen, which is what this line is for.
    return {
        edge: CARD_EDGE.left,
        offsetPixels: Math.min(right + gap, Math.max(0, viewport.width - cardWidthMaximum)),
    };
}

function composeWindowRight(place: CardWindowPlace): number {
    return place.position.left + place.widthPixels;
}

export function setGripMark(grip: PanelElement, window: PanelWindow): void {
    grip.setAttribute(GRIP_ATTRIBUTE, window);
}

/**
 * Where the window beside the panel stands once the type both are drawn in has changed size, or
 * null where it should stay. **Both windows grow rightwards from where they stand**, so a window
 * beside the panel keeps its side by moving: one standing to the left keeps its right edge, one to
 * the right keeps its distance from the panel's. One standing over or under the panel is not beside
 * it, and stays. Without this, a larger step stood the window over the panel's own ranks.
 */
export function composeHelperPositionAfterTypeStep(
    meter: PanelPosition,
    helper: PanelPosition,
    before: WindowWidths,
    after: WindowWidths,
): PanelPosition | null {
    const helperRight = helper.left + before.helper;
    if (helperRight <= meter.left) {
        return { left: helper.left - (after.helper - before.helper), top: helper.top };
    }
    if (helper.left >= meter.left + before.meter) {
        return { left: helper.left + (after.meter - before.meter), top: helper.top };
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
        // A position from the first frame is what lets the helper and the card answer the
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
            if (style === null) return null;
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
    const writeHostStyle = () => {
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
    writeHostStyle();
    // Listen for the grab, the drag and the release.
    {
        const addRootListener = (
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
        const getGrabbedElement = (grab: PanelGrab): PanelElement => {
            if (grab.kind === GRAB_KIND.size) return options.grip;
            return getBar();
        };
        addRootListener(EVENT_TYPE.press, PANEL_LISTENER.grab, (event) => {
            const started = composePanelDragGrab(event, state, placement, options);
            if (started === null) return;
            // Without this the browser starts its own text or image drag from the bar.
            event.preventDefault?.();
            state.grab = started;
            writePointerCapture(getGrabbedElement(started), true, event.pointerId, options);
        });
        const onDragEnd = (): void => {
            const grab = state.grab;
            if (grab === null) return;
            state.grab = null;
            writePointerCapture(getGrabbedElement(grab), false, grab.pointerId, options);
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
        addRootListener(EVENT_TYPE.move, PANEL_LISTENER.drag, (event) => {
            const grab = state.grab;
            if (grab === null) return;
            // A release the root never saw. Without capture — the forgiving part of a drag,
            // `writePointerCapture` — a hand letting go outside the panel reports its `pointerup`
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
                    writeHostStyle,
                );
                return;
            }
            state.size = composeDraggedSize(grab, pointer, state, placement, options);
            writeHostStyle();
        });
        addRootListener(EVENT_TYPE.release, PANEL_LISTENER.release, onDragEnd);
        addRootListener(EVENT_TYPE.cancel, PANEL_LISTENER.cancel, onDragEnd);
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
                writePointerCapture(getBar(), true, grab.pointerId, options);
            }
        },
        setPosition: (positionRequested: PanelPosition) => {
            writePanelDragPosition(
                state,
                clampPosition(positionRequested, placement.readViewport()),
                writeHostStyle,
            );
            const position = state.position;
            if (position !== null) {
                options.onIntent({ kind: PANEL_INTENT.move, window: options.window, position });
            }
        },
        getWidthPixels: () => {
            const applied = getPanelDragSize(state, placement, options);
            return applied?.width ?? getWindowWidthPixels(options.window, options.getTypeTokens());
        },
        setSize: (size: WindowSize | null) => {
            if (state.grab?.kind === GRAB_KIND.size) return;
            state.size = size;
            writeHostStyle();
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
    position: PanelPosition,
    writeHostStyle: () => void,
): void {
    if (!Number.isSafeInteger(position.left)) return;
    if (!Number.isSafeInteger(position.top)) return;
    state.position = position;
    writeHostStyle();
}

/** Where a window nobody has moved opens, which is not the same place for both of them. */
function composeOpeningPosition(
    panelWindow: PanelWindow,
    viewport: PanelViewport | null,
    tokens: TypeTokens,
): PanelPosition | null {
    if (panelWindow === PANEL_WINDOW.helper) return composeHelperOpeningPosition(viewport, tokens);
    return composeDefaultPosition(viewport, tokens.meterWidthPixels);
}

/**
 * Where the second window opens: **beside** the panel and level with it, never centred.
 * `composeDefaultPosition` centres what it is given, so centring both puts this one exactly under
 * the panel — where the panel paints over it and a reader sees nothing at all. `develop ADR 0060`.
 */
function composeHelperOpeningPosition(
    viewport: PanelViewport | null,
    tokens: TypeTokens,
): PanelPosition | null {
    const meter = composeDefaultPosition(viewport, tokens.meterWidthPixels);
    if (meter === null) return null;
    const gap = SPACE_PIXELS.small;
    const beside = meter.left - tokens.helperWidthPixels - gap;
    if (beside >= 0) return clampPosition({ left: beside, top: meter.top }, viewport);
    // No room on the left, so the other side — the same answer the card gives (`develop ADR 0090`).
    const rightOfMeter = { left: meter.left + tokens.meterWidthPixels + gap, top: meter.top };
    return clampPosition(rightOfMeter, viewport);
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
    const mark = options.window;
    const kind = grip === mark ? GRAB_KIND.move : corner === mark ? GRAB_KIND.size : null;
    if (kind === null) return null;
    const pointer = readPointerFromEvent(event);
    if (pointer === null) return null;
    const tokens = options.getTypeTokens();
    const from = state.position ??
        composeOpeningPosition(options.window, placement.readViewport(), tokens);
    if (from === null) return null;
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
    const right = pointer.left + inside - readGripPressOffset(event.offsetX, inside);
    const bottom = pointer.top + inside - readGripPressOffset(event.offsetY, inside);
    return {
        ...grab,
        fromLeft: right - from.left,
        fromTop: bottom - from.top - getBarHeight(tokens),
    };
}

/** Where on the grip a press landed, and the corner itself where the event does not say. */
function readGripPressOffset(offset: number | undefined, corner: number): number {
    const offsetRead = readCoordinate(offset);
    return offsetRead === null ? corner : offsetRead;
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
function readCoordinate(coordinate: unknown): number | null {
    if (typeof coordinate !== "number") return null;
    if (!Number.isFinite(coordinate)) return null;
    return coordinate;
}

/**
 * Capture is the forgiving part of a drag rather than the drag: a document offering neither method
 * still moves the panel, and what it loses is a hand that outruns it. It is caught apart from the
 * drag because it throws where the drag does not — a pointer a browser no longer considers active
 * is refused, and one refusal inside the drag's own guard would clear the grab and move nothing.
 */
function writePointerCapture(
    bar: PanelElement,
    isHeld: boolean,
    pointerId: number | undefined,
    options: PanelDragOptions,
): void {
    if (pointerId === undefined) return;
    const captured = errors.attempt(() => {
        if (isHeld) bar.setPointerCapture?.(pointerId);
        else bar.releasePointerCapture?.(pointerId);
    });
    if (!(captured instanceof Error)) return;
    addViewFailureGuarded(options.onFailure, new GestureDropped(PANEL_LISTENER.capture, captured));
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
