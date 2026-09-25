/**
 * The surface the panel asks of a browser, declared rather than assumed: the panel never reaches
 * for a document of its own, and is handed one that answers exactly this.
 */

export interface PanelDocument {
    createElement(tag: string): PanelElement;
}

/**
 * The node under the pointer, as a listener may ask it. Three places state it — what was pressed,
 * where the pointer went, and which window holds it — and a shape spelled three times drifts.
 */
export interface PanelTarget {
    getAttribute(name: string): string | null;
}

export interface PanelEvent {
    target: PanelTarget | null;
    /** Where the pointer went, on the event that says it left: null where it left the page. */
    relatedTarget?: PanelTarget | null | undefined;
    clientY: number;
    clientX?: number | undefined;
    pointerId?: number | undefined;
    button?: number | undefined;
    /** Which buttons are down now, on a move. Zero is a hand that let go; absent is not zero. */
    buttons?: number | undefined;
    /** The game's own menu, on the gesture that goes back. Absent where nothing can be stopped. */
    preventDefault?: (() => void) | undefined;
}

export interface PanelElement {
    className: string;
    textContent: string;
    /** Where the list is scrolled to, which `src/ui/panel-scroll.ts` reads and writes. */
    scrollTop: number;
    append(child: PanelElement): void;
    replaceWith(other: PanelElement): void;
    /** How the list swaps its rows without being replaced; `src/ui/panel-scroll.ts` says why. */
    children: ArrayLike<PanelElement>;
    replaceChildren(...children: PanelElement[]): void;
    setAttribute(name: string, value: string): void;
    /** Read off an element about to go, so a list that stays takes what the new one carries. */
    getAttribute(name: string): string | null;
    /** Which of the two windows a press landed in, for the way back (`develop ADR 0071`). */
    contains(other: PanelTarget | null): boolean;
    attachShadow(options: { mode: "open" }): PanelRoot;
    /** A drag keeping the pointer it has. Optional: a document offering neither still drags. */
    setPointerCapture?(pointerId: number): void;
    releasePointerCapture?(pointerId: number): void;
}

/**
 * ⚠️ **The listeners go on the root, never on the host.** A press inside a shadow root is
 * retargeted to the host for any listener outside it, so one there reads null off every mark and
 * the panel draws and does nothing. The element above carries no `addEventListener` for that.
 */
export interface PanelRoot {
    append(child: PanelElement): void;
    addEventListener(type: string, handle: (event: PanelEvent) => void): void;
}

export const STYLE_ATTRIBUTE = "style";

/** The browser's names for the events the panel listens to, spelled here and nowhere else. */
export const EVENT_TYPE = {
    press: "pointerdown",
    back: "contextmenu",
    move: "pointermove",
    leave: "pointerout",
    release: "pointerup",
    cancel: "pointercancel",
} as const;
