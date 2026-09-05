/**
 * The detail window, and the register the drawn rows fill for it.
 *
 * It outlives every redraw: appended to the root once, and no region's redraw replaces it, the way
 * the one listener is put there. **Nothing here measures anything** — a card is counted in lines
 * and the sheet multiplies.
 */

import type { PanelDocument, PanelElement } from "@/src/ui/panel-element.ts";
import { CLASS } from "@/src/ui/panel-look.ts";

/**
 * One line of a card. A shape rather than a sentence, because the panel draws the three of them
 * differently — a figure lines up in a column, a note runs to the width of the window — and a
 * renderer handed one string and a newline would hold that decision where nothing can check it.
 */
export type TipLine =
    | { kind: "stat"; label: string; stated: string; isStrong: boolean }
    | { kind: "sub"; label: string; stated: string }
    | { kind: "heading"; text: string }
    | { kind: "note"; text: string; isWarning: boolean };

export interface TipGroup {
    lines: TipLine[];
}

export interface TipReading {
    name: string;
    subtitle: string | null;
    groups: TipGroup[];
}

/**
 * What a row leaves behind for the pointer, and it is a **way to compose the card** rather than
 * the card: a fight redraws every few seconds and twenty rows are drawn each time, so composing
 * every card would be paying for nineteen nobody opens.
 */
export type TipCompose = () => TipReading;

/**
 * Filled by every draw and read by the pointer. The key is stated by the row rather than counted
 * off the draw order: a fight reorders its ranking between payloads, and a counted key would let
 * an open tip go on describing the row that used to stand there.
 */
export interface TipRegister {
    add(key: string, compose: TipCompose): void;
    get(key: string): TipCompose | null;
    reset(): void;
}

export interface TipSize {
    lines: number;
    groups: number;
}

/**
 * More than any screen can draw and far less than unbounded: twenty combatants, sixty-four kinds,
 * the pinned rows and a shelf of twenty. A key added past it is a screen that has stopped being
 * one of the screens this panel has.
 */
const MAXIMUM_TIPS = 128;
/**
 * How many characters of a note stand on one line of the card, and it is a **floor** rather than
 * a measurement of any one sentence. At 242 pixels of type — the window less its padding — in
 * Chrome on 2026-08-29, the longest note this panel composes ran 104 characters over three lines
 * and the shortest 31 over one. Counting low leaves the window standing higher up the screen than
 * it had to, which is the direction that keeps a card on it.
 */
const NOTE_CHARACTERS_PER_LINE = 32;
/**
 * Past every card this panel composes: four figures and their parts, the counters, both runs —
 * the criticals, the defences, the procs and what a blow destroyed — and the notes. The tallest
 * card any recording composes is 33 lines, measured over every combatant, screen and place a
 * card stands in over `captures/` on 2026-08-31 — headroom, rather than a limit anything meets.
 */
const MAXIMUM_TIP_LINES = 64;
/** A custom property, which is the one kind `src/ui/panel-look.ts`'s reset leaves standing. */
const TOP_VARIABLE = "--MargoMeter-tip-top";
const LEFT_VARIABLE = "--MargoMeter-tip-left";
const LINES_VARIABLE = "--MargoMeter-tip-lines";
const GROUPS_VARIABLE = "--MargoMeter-tip-groups";
const STYLE_ATTRIBUTE = "style";

export function composeTipRegister(): TipRegister {
    const held = new Map<string, TipCompose>();
    return {
        // A row with no name, one already registered, or one past the bound is left without a
        // card. What that costs is detail on hover, and never the draw it arrived in (**E14**).
        add(key: string, compose: TipCompose): void {
            if (key.length === 0) return;
            if (held.has(key)) return;
            if (held.size >= MAXIMUM_TIPS) return;
            held.set(key, compose);
        },
        get(key: string): TipCompose | null {
            return held.get(key) ?? null;
        },
        reset(): void {
            held.clear();
        },
    };
}

/**
 * What one line costs the height. A note wraps, so it costs the lines its text runs to; every
 * other kind is held to one by the stylesheet, which cuts a long label rather than folding it.
 */
function getTipLineCost(line: TipLine): number {
    if (line.kind !== "note") return 1;
    const wrapped = Math.ceil(line.text.length / NOTE_CHARACTERS_PER_LINE);
    if (wrapped < 1) return 1;
    return wrapped;
}

export function getTipSize(reading: TipReading | null): TipSize {
    if (reading === null) return { lines: 1, groups: 0 };
    let lines = reading.subtitle === null ? 1 : 2;
    for (const group of reading.groups) {
        for (const line of group.lines) {
            lines += getTipLineCost(line);
        }
    }
    // The height the card is drawn at, so a card taller than the bound is placed at the bound
    // rather than off the bottom of the screen. What is drawn is still every line it holds.
    if (lines > MAXIMUM_TIP_LINES) lines = MAXIMUM_TIP_LINES;
    return { lines, groups: reading.groups.length };
}

function composeTipHeadingElement(
    document: PanelDocument,
    line: Extract<TipLine, { kind: "heading" }>,
): PanelElement {
    const element = document.createElement("div");
    element.className = CLASS.tipHeading;
    element.textContent = line.text;
    return element;
}

function composeTipLineClass(line: TipLine): string {
    if (line.kind === "sub") return `${CLASS.tipLine} ${CLASS.tipSub}`;
    if (line.kind === "stat") {
        if (line.isStrong) return `${CLASS.tipLine} ${CLASS.tipStrong}`;
    }
    return CLASS.tipLine;
}

function composeTipNoteElement(
    document: PanelDocument,
    line: Extract<TipLine, { kind: "note" }>,
): PanelElement {
    const element = document.createElement("div");
    element.className = line.isWarning ? `${CLASS.tipNote} ${CLASS.tipWarning}` : CLASS.tipNote;
    element.textContent = line.text;
    return element;
}

function composeTipLineElement(document: PanelDocument, line: TipLine): PanelElement {
    if (line.kind === "note") return composeTipNoteElement(document, line);
    if (line.kind === "heading") return composeTipHeadingElement(document, line);
    const element = document.createElement("div");
    element.className = composeTipLineClass(line);
    const label = document.createElement("span");
    label.className = CLASS.tipLabel;
    label.textContent = line.label;
    const value = document.createElement("span");
    value.className = CLASS.tipValue;
    value.textContent = line.stated;
    element.append(label);
    element.append(value);
    return element;
}

function composeTipGroupElement(document: PanelDocument, group: TipGroup): PanelElement {
    const element = document.createElement("div");
    element.className = CLASS.tipGroup;
    for (const line of group.lines) element.append(composeTipLineElement(document, line));
    return element;
}

export function composeTipElement(
    document: PanelDocument,
    reading: TipReading | null,
): PanelElement {
    const tip = document.createElement("div");
    tip.className = reading === null ? `${CLASS.tip} ${CLASS.tipHidden}` : CLASS.tip;
    if (reading === null) return tip;
    // A block rather than a span: `text-overflow` reads nothing on an inline box, so a name too
    // long for the window would be cut off flat instead of ending in the ellipsis the row uses.
    const name = document.createElement("div");
    name.className = CLASS.tipName;
    name.textContent = reading.name;
    tip.append(name);
    if (reading.subtitle !== null) {
        const subtitle = document.createElement("div");
        subtitle.className = CLASS.tipSubtitle;
        subtitle.textContent = reading.subtitle;
        tip.append(subtitle);
    }
    for (const group of reading.groups) tip.append(composeTipGroupElement(document, group));
    return tip;
}

export function setTipHidden(tip: PanelElement, isHidden: boolean): void {
    tip.className = isHidden ? `${CLASS.tip} ${CLASS.tipHidden}` : CLASS.tip;
}

/**
 * Where the tip sits, and how tall it stands, as the properties the stylesheet clamps and
 * multiplies. Whole pixels down the screen, because `clientY` is fractional on a scaled display
 * and half a pixel is nothing anybody can see — while a declaration reading `292.33333333333px`
 * is something a reader of the page can.
 */
export function setTipPlace(
    tip: PanelElement,
    clientY: number,
    left: number | null,
    size: TipSize,
): void {
    // A pointer that states no position puts the card at the top rather than nowhere: `Math.round`
    // of a figure that is not one is not one either, and a card placed at it is off the screen.
    const stated = Number.isFinite(clientY) ? clientY : 0;
    const top = Math.max(0, Math.round(stated));
    const across = left === null ? "" : `;${LEFT_VARIABLE}:${Math.max(0, Math.round(left))}px`;
    tip.setAttribute(
        STYLE_ATTRIBUTE,
        `${TOP_VARIABLE}:${top}px;${LINES_VARIABLE}:${size.lines};` +
            `${GROUPS_VARIABLE}:${size.groups}${across}`,
    );
}

export type TipRedraw = (standing: PanelElement, compose: () => PanelElement) => PanelElement;

export interface TipHandle {
    element: PanelElement;
    show(key: string | null, clientY: number): void;
    refresh(): void;
}

/**
 * The tip on the page, and the whole of what it remembers: which row it is open for, how tall its
 * card stands and where the pointer left it.
 *
 * A fight redraws every few seconds. A tip that vanished under the cursor on every payload would
 * be worse than one that says nothing, so a redraw looks its own key up again and follows the
 * figure as it moves — and hides only where the row it names has stopped being drawn.
 */
export function composeTipHandle(
    document: PanelDocument,
    register: TipRegister,
    redraw: TipRedraw,
    getLeft: () => number | null = () => null,
): TipHandle {
    let standing = composeTipElement(document, null);
    let openKey: string | null = null;
    let openTop = 0;
    let openSize: TipSize = getTipSize(null);
    const setTo = (reading: TipReading): void => {
        openSize = getTipSize(reading);
        standing = redraw(standing, () => composeTipElement(document, reading));
        setTipPlace(standing, openTop, getLeft(), openSize);
    };
    const hide = (): void => {
        if (openKey === null) return;
        openKey = null;
        setTipHidden(standing, true);
    };
    return {
        element: standing,
        show(key: string | null, clientY: number): void {
            if (key === null) {
                hide();
                return;
            }
            const top = Math.max(0, Math.round(clientY));
            if (key === openKey) {
                // A pointer reports far more moves than the window has places to stand in, and a
                // move inside one pixel would rewrite the same declaration.
                if (top === openTop) return;
                openTop = top;
                setTipPlace(standing, openTop, getLeft(), openSize);
                return;
            }
            const compose = register.get(key);
            if (compose === null) {
                hide();
                return;
            }
            openTop = top;
            openKey = key;
            setTo(compose());
        },
        refresh(): void {
            if (openKey === null) return;
            const compose = register.get(openKey);
            if (compose === null) {
                hide();
                return;
            }
            setTo(compose());
        },
    };
}
