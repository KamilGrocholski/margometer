/**
 * The detail window, and the register the drawn rows fill for it.
 *
 * A row is 260 pixels wide and cuts its name with an ellipsis, so the one thing every row can lose
 * is who it is about. That is what this is for, and the share it prints beside it is the number no
 * row states — the bar draws it and nothing spells it.
 *
 * It outlives every redraw: it is appended to the root once and no region's redraw replaces it,
 * the way the one listener is put there. Nothing here measures anything.
 */

import { assert } from "@std/assert";
import type { PanelDocument, PanelElement } from "@/src/ui/panel-element.ts";
import { CLASS } from "@/src/ui/panel-look.ts";
import { composeShareText } from "@/src/ui/panel-words.ts";

/** One row's detail. A line with nothing to say is absent rather than blank. */
export interface TipReading {
    /** The full name, which the row itself may have cut with an ellipsis. */
    name: string;
    /** Null on a row whose subject is not a figure. The caption says what the figure is of. */
    figure: { caption: string; value: number } | null;
    /** Null where the row carries no share. The caption names what it is a share **of**. */
    share: { caption: string; value: number } | null;
}

/**
 * Filled by every draw and read by the pointer. The key is stated by the row rather than counted
 * off the draw order: a fight reorders its ranking between payloads, and a counted key would let
 * an open tip go on describing the row that used to stand there.
 */
export interface TipRegister {
    add(key: string, reading: TipReading): void;
    get(key: string): TipReading | null;
    reset(): void;
}

/**
 * More than any screen can draw and far less than unbounded: twenty combatants, sixty-four kinds,
 * the pinned rows and a shelf of twenty. A key added past it is a screen that has stopped being
 * one of the screens this panel has.
 */
const MAXIMUM_TIPS = 128;
/** Ours, because `all: initial` resets every property a page can set except a custom one. */
const TOP_VARIABLE = "--MargoMeter-tip-top";
const STYLE_ATTRIBUTE = "style";

export function composeTipRegister(): TipRegister {
    const held = new Map<string, TipReading>();
    return {
        add(key: string, reading: TipReading): void {
            assert(key.length > 0, "a row that carries a tip is asked for by name");
            assert(!held.has(key), "and no two rows in one draw answer to the same name");
            assert(held.size < MAXIMUM_TIPS, "a draw stays inside the tips it is bounded to");
            held.set(key, reading);
        },
        get(key: string): TipReading | null {
            assert(key.length >= 0, "a key looked up is text");
            assert(held.size <= MAXIMUM_TIPS, "a register read stays inside its stated bound");
            return held.get(key) ?? null;
        },
        reset(): void {
            held.clear();
            assert(held.size === 0, "a redraw starts with nothing said about any row");
        },
    };
}

function composeTipLine(
    document: PanelDocument,
    caption: string,
    stated: string,
): PanelElement {
    assert(caption.length > 0, "a line of the detail says what its figure is");
    assert(stated.length > 0, "and states it");
    const line = document.createElement("div");
    line.className = CLASS.tipLine;
    const label = document.createElement("span");
    label.className = CLASS.tipLabel;
    label.textContent = caption;
    const value = document.createElement("span");
    value.className = CLASS.tipValue;
    value.textContent = stated;
    line.append(label);
    line.append(value);
    return line;
}

/** Null draws an empty window and hides it, which is what the panel starts with and hides to. */
export function composeTipElement(
    document: PanelDocument,
    reading: TipReading | null,
): PanelElement {
    const tip = document.createElement("div");
    tip.className = reading === null ? `${CLASS.tip} ${CLASS.tipHidden}` : CLASS.tip;
    assert(tip.className.startsWith(CLASS.tip), "the detail is ours by name before it says a word");
    if (reading === null) return tip;
    assert(reading.name.length > 0, "a detail names somebody, or says it cannot");
    const name = document.createElement("span");
    name.className = CLASS.tipName;
    name.textContent = reading.name;
    tip.append(name);
    if (reading.figure !== null) {
        assert(reading.figure.value >= 0, "a figure in the detail is never below nothing");
        const stated = `${reading.figure.value}`;
        tip.append(composeTipLine(document, reading.figure.caption, stated));
    }
    if (reading.share !== null) {
        assert(reading.share.value <= 1, "a share in the detail is never more than the whole");
        tip.append(composeTipLine(
            document,
            reading.share.caption,
            composeShareText(reading.share.value),
        ));
    }
    return tip;
}

export function setTipHidden(tip: PanelElement, isHidden: boolean): void {
    assert(tip.className.length > 0, "the detail wears a class before it is hidden or shown");
    tip.className = isHidden ? `${CLASS.tip} ${CLASS.tipHidden}` : CLASS.tip;
    assert(tip.className.includes(CLASS.tipHidden) === isHidden, "and wears what it was told to");
}

/**
 * Where the tip sits down the screen, as the one property the stylesheet clamps. Whole pixels,
 * because `clientY` is fractional on a scaled display and half a pixel is nothing anybody can see
 * — while a declaration reading `292.33333333333px` is something a reader of the page can.
 */
export function setTipTop(tip: PanelElement, clientY: number): void {
    assert(Number.isFinite(clientY), "a pointer states where it is");
    const top = Math.max(0, Math.round(clientY));
    assert(top >= 0, "and never above the top of the screen");
    tip.setAttribute(STYLE_ATTRIBUTE, `${TOP_VARIABLE}:${top}px`);
}

/** How the tip takes the place of the one standing, which is how every region of the panel does. */
export type TipRedraw = (standing: PanelElement, compose: () => PanelElement) => PanelElement;

export interface TipHandle {
    /**
     * Appended to the root once. What stands there afterwards is swapped in place, as a region is.
     */
    element: PanelElement;
    /** What the pointer is over, or nobody: null hides it. */
    show(key: string | null, clientY: number): void;
    /** After a redraw: the same row's detail again, or hidden where that row is no longer drawn. */
    refresh(): void;
}

/**
 * The tip on the page, and the whole of what it remembers: which row it is open for and where the
 * pointer left it.
 *
 * A fight redraws every few seconds. A tip that vanished under the cursor on every payload would
 * be worse than one that says nothing, so a redraw looks its own key up again and follows the
 * figure as it moves — and hides only where the row it names has stopped being drawn.
 */
export function composeTipHandle(
    document: PanelDocument,
    register: TipRegister,
    redraw: TipRedraw,
): TipHandle {
    let standing = composeTipElement(document, null);
    let openKey: string | null = null;
    let openTop = 0;
    const setTo = (reading: TipReading): void => {
        assert(reading.name.length > 0, "what the detail is put to names somebody");
        standing = redraw(standing, () => composeTipElement(document, reading));
        assert(standing.className.length > 0, "and what now stands there is a region of its own");
        setTipTop(standing, openTop);
    };
    const hide = (): void => {
        assert(openTop >= 0, "the pointer was somewhere before it left");
        if (openKey === null) return;
        openKey = null;
        setTipHidden(standing, true);
        assert(openKey === null, "and the detail is open for nobody once it is hidden");
    };
    return {
        element: standing,
        show(key: string | null, clientY: number): void {
            assert(Number.isFinite(clientY), "a press or a move states where the pointer is");
            if (key === null) {
                hide();
                return;
            }
            openTop = clientY;
            if (key === openKey) {
                setTipTop(standing, openTop);
                return;
            }
            const reading = register.get(key);
            if (reading === null) {
                hide();
                return;
            }
            openKey = key;
            setTo(reading);
        },
        refresh(): void {
            assert(openTop >= 0 || openKey === null, "an open tip was opened somewhere");
            if (openKey === null) return;
            const reading = register.get(openKey);
            if (reading === null) {
                hide();
                return;
            }
            setTo(reading);
        },
    };
}
