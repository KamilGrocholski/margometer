/**
 * The detail window, and the register the drawn rows fill for it.
 *
 * It outlives every redraw: appended to the root once, and no region's redraw replaces it, the way
 * the one listener is put there. **Nothing here measures anything** — a card is counted in lines
 * and the sheet multiplies.
 */

import type { PanelDocument, PanelElement } from "@/src/ui/panel-element.ts";
import type { TipAcross } from "@/src/ui/panel-drag.ts";
import { CLASS, getTipHeight, getTipRoom } from "@/src/ui/panel-look.ts";
import { CARD_WORDS, type Caveat, CAVEAT_MARK } from "@/src/ui/panel-words.ts";

/**
 * One line of a card. A shape rather than a sentence: the panel draws the three differently, and
 * a renderer handed one string and a newline would hold that decision where nothing can check it.
 */
export type TipLine =
    | {
        kind: "stat";
        label: string;
        stated: string;
        isStrong: boolean;
        /**
         * Which sentence at the foot of the card the glyph beside this figure points at, and
         * null where the figure claims nothing beyond itself. **Required rather than optional**,
         * so a figure joining the card is asked whether its label names more than it counts.
         */
        caveat: Caveat | null;
    }
    | { kind: "sub"; label: string; stated: string }
    | { kind: "heading"; text: string }
    | { kind: "note"; text: string; tone: TipNoteTone };

/**
 * What a sentence at the foot of a card is about, which is the only thing that decides its ink.
 * One field and not a flag each: a sentence is a suspicion or a caveat and never both, and two
 * booleans would let a caller spell the pair nothing composes.
 *
 * ⚠️ **The glyph stays inside the sentence's own `text`.** It is counted in what that note costs
 * the card's height (`composeTipNoteLines`), and hoisting it into a node of its own would shorten
 * every note by the glyph in that arithmetic while the drawn sentence stayed the same length.
 */
export type TipNoteTone = "plain" | "suspect" | "caveat";

export interface TipGroup {
    lines: TipLine[];
}

export interface TipReading {
    name: string;
    subtitle: string | null;
    groups: TipGroup[];
}

/**
 * A **way to compose the card** rather than the card: a fight redraws every few seconds and
 * twenty rows are drawn each time, so composing every one would pay for nineteen nobody opens.
 */
export type TipCompose = () => TipReading;

/**
 * What the pointer asks, and all it asks. Two windows fill two registers and the card is one, so
 * the handle is handed a reading rather than either register — **ADR 0086**.
 */
export interface TipLookup {
    get(key: string): TipCompose | null;
}

/**
 * Filled by every draw and read by the pointer. The key is stated by the row rather than counted
 * off the draw order: a fight reorders its ranking between payloads, and a counted key would let
 * an open tip go on describing whichever row now stands in that place.
 */
export interface TipRegister extends TipLookup {
    add(key: string, compose: TipCompose): void;
    reset(): void;
}

export interface TipSize {
    lines: number;
    groups: number;
}

/**
 * Counted off **an opened row**, the widest screen the panel has: its three sections, each with
 * an unnamed row and a heading, and the two pinned rows. Counted off the ranking it was 128,
 * which a drill reaches; counted with a skill section of names alone it was 384, and on the two
 * screen that section is names **and** the keys no announcement covered. A row past the
 * bound registers nothing, and `show` then hides the card rather than drawing one.
 * `tests/ui/share-bound.test.ts` is where the arithmetic is, against the panel's own constants.
 */
export const MAXIMUM_TIPS = 512;
/**
 * How many characters of a note stand on one line of the card, and it is a **floor** rather than
 * a measurement of any one sentence. At 242 pixels of type — the window less its padding — in
 * Chrome on 2026-08-29, the longest note this panel composes ran 104 characters over three lines
 * and the shortest 31 over one. Counting low leaves the window standing higher up the screen than
 * it had to, which is the direction that keeps a card on it.
 *
 * **The line under the name is counted on this floor too**, and not on the name's: it is drawn in
 * the same face at the same size in the same box, so what a sentence costs is what it costs.
 */
const NOTE_CHARACTERS_PER_LINE = 32;
/**
 * What the drawn mark opening a caveated note takes off that note's first line, as the characters
 * it stands in the room of: the ring and the air after it, against a body character's own width.
 */
const NOTE_MARK_CHARACTERS = 2;
/**
 * The same floor for the name a card opens with, which is lower because the name is the one thing
 * on a card drawn bold and bold is wider. Measured in Chrome 152 on 2026-09-18 at **240 pixels**
 * of type — the 250px bound less the card's padding and its border — over the 31 names `captures/`
 * carries, composed into the place shape a shelf row states (`Nazwa (x, y)`) and read at every
 * prefix length: 2,211 readings, and 27 is the **largest** floor that under-counts none of them.
 * Twenty-eight under-counts four.
 *
 * ⚠️ **A floor over characters cannot see where a line broke.** What it is short by is a name whose
 * last word is long, and the margin is what absorbs that; the one case measured past the margin is
 * an unbroken run of capitals — 60 of them draw four lines and count three. A real name is not
 * that, and the card carries the air to survive one line of it.
 */
const NAME_CHARACTERS_PER_LINE = 27;
/**
 * Past every card this panel composes: four figures and their parts, the counters, both runs —
 * the criticals, the defences, the procs and what a blow destroyed — and the notes. The tallest
 * card any recording composes is 31 lines and the median 24, over the 1,208 cards the ranking of
 * `captures/` opens on 2026-09-18 — `deno task panel:cards` is what measures it, and this is
 * headroom rather than a limit anything meets.
 */
const MAXIMUM_TIP_LINES = 64;
/** A custom property, which is the one kind `src/ui/panel-look.ts`'s reset leaves standing. */
const TOP_VARIABLE = "--MargoMeter-tip-top";
const LEFT_VARIABLE = "--MargoMeter-tip-left";
const RIGHT_VARIABLE = "--MargoMeter-tip-right";
/**
 * What the edge a card is **not** measured from is released to. Both are always written together:
 * leaving one off would let the sheet's own fallback stand beside the offset just written, and
 * the card would be pinned by both edges at once — which is a width nobody chose (**ADR 0091**).
 */
const EDGE_RELEASED = "auto";
const HEIGHT_VARIABLE = "--MargoMeter-tip-height";
const STYLE_ATTRIBUTE = "style";
/** Past every card there is: four figures, the counters, both runs and the notes come to five. */
const MAXIMUM_TIP_GROUPS = 16;

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
 * What a run of text costs the height, on the floor its face is counted at. A floor of nought
 * answers infinity, and a text of nothing stands on a line all the same.
 */
function getTipLinesForCharacters(characters: number, charactersPerLine: number): number {
    const wrapped = Math.ceil(characters / charactersPerLine);
    if (wrapped < 1) return 1;
    return wrapped;
}

/**
 * What one line of a run costs the height. A note wraps, so it costs the lines its text runs to;
 * every other kind is held to one by the stylesheet, which cuts a long label rather than folding
 * it. The name a card opens with is neither, and `getTipSize` counts it.
 *
 * ⚠️ **A caveated note's mark is counted although it is not in the text.** It is drawn from the
 * tone since **ADR 0092**, and a count reading `text` alone would shorten every one of those
 * notes by a mark the card still draws — which is the trap the glyph sat inside the sentence to
 * avoid while it was a codepoint.
 */
function getTipLineCost(line: TipLine): number {
    if (line.kind !== "note") return 1;
    const marked = line.tone === "caveat" ? NOTE_MARK_CHARACTERS : 0;
    return getTipLinesForCharacters(line.text.length + marked, NOTE_CHARACTERS_PER_LINE);
}

export function getTipSize(reading: TipReading | null): TipSize {
    if (reading === null) return { lines: 1, groups: 0 };
    let lines = getTipLinesForCharacters(reading.name.length, NAME_CHARACTERS_PER_LINE);
    if (reading.subtitle !== null) {
        lines += getTipLinesForCharacters(reading.subtitle.length, NOTE_CHARACTERS_PER_LINE);
    }
    for (const group of reading.groups) {
        for (const line of group.lines) {
            lines += getTipLineCost(line);
        }
    }
    // The bound is on where the card is placed, never on what it holds: every line is drawn.
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

/**
 * A sentence at the foot of a card, with the caveat's ring standing before it where it wears one.
 * The suspect and the defect marks stay inside their own text: both are drawn by a codepoint that
 * every face carries at a width its own height (**ADR 0092** carries the measurement), and only
 * the circled letter had to be built.
 */
function composeTipNoteElement(
    document: PanelDocument,
    line: Extract<TipLine, { kind: "note" }>,
): PanelElement {
    const element = document.createElement("div");
    element.className = `${CLASS.tipNote}${composeTipNoteToneClass(line.tone)}`;
    element.textContent = line.text;
    // ⚠️ **Appended after the sentence and stood before it by the sheet.** `textContent` replaces
    // every child, so a ring written first is wiped by the line it belongs to — and wrapping the
    // sentence in a span of its own instead would leave this element's own `textContent` empty,
    // which is what every reader of a drawn note asks it for.
    if (line.tone === "caveat") element.append(composeTipCaveatElement(document));
    return element;
}

function composeTipNoteToneClass(tone: TipNoteTone): string {
    if (tone === "suspect") return ` ${CLASS.tipSuspect}`;
    if (tone === "caveat") return ` ${CLASS.tipCaveatNote}`;
    return "";
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
    // Before the value and never after it: the value column is right-aligned in `tabular-nums`,
    // and a glyph behind it would offset the figures of the lines carrying one against those that
    // do not. Before it, the column stays aligned and the glyph still stands at the figure.
    if (line.kind === "stat") {
        if (line.caveat !== null) element.append(composeTipCaveatElement(document));
    }
    element.append(value);
    return element;
}

/**
 * The glyph a figure wears where its label names more than the figure counts. It takes its width
 * from the label beside it, which the sheet cuts rather than folds — `MAXIMUM_LABEL_CHARACTERS` in
 * `src/ui/panel-words.ts` is where that arithmetic is.
 */
function composeTipCaveatElement(document: PanelDocument): PanelElement {
    const element = document.createElement("span");
    element.className = CLASS.tipCaveat;
    element.textContent = CAVEAT_MARK;
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
    // A block rather than a span, because the name folds and an inline box would fold around
    // whatever stood beside it. What its lines cost is `getTipSize` above.
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
    across: TipAcross | null,
    size: TipSize,
): void {
    // A pointer that states no position puts the card at the top rather than nowhere: `Math.round`
    // of a figure that is not one is not one either, and a card placed at it is off the screen.
    const stated = Number.isFinite(clientY) ? clientY : 0;
    const top = Math.max(0, Math.round(stated));
    const sideways = composeTipAcrossStyle(across);
    // The height rather than the counts it came from: the trim and the sheet's clamp spend one
    // number. A height nothing could be read for leaves the property off (**E14**).
    const height = getTipHeight(size);
    const tall = height === null ? "" : `;${HEIGHT_VARIABLE}:${height}px`;
    tip.setAttribute(STYLE_ATTRIBUTE, `${TOP_VARIABLE}:${top}px${tall}${sideways}`);
}

/**
 * The pair of properties a placement across comes to, or nothing at all — a panel nobody has
 * moved keeps the corner the sheet states, and writing an offset for it would say the reader had
 * moved something.
 */
function composeTipAcrossStyle(across: TipAcross | null): string {
    if (across === null) return "";
    const at = `${Math.max(0, Math.round(across.at))}px`;
    if (across.edge === "left") {
        return `;${LEFT_VARIABLE}:${at};${RIGHT_VARIABLE}:${EDGE_RELEASED}`;
    }
    return `;${LEFT_VARIABLE}:${EDGE_RELEASED};${RIGHT_VARIABLE}:${at}`;
}

/** A run of nothing but notes, which is what a card puts last and what a trim never takes. */
function getIsNoteGroup(group: TipGroup): boolean {
    if (group.lines.length === 0) return false;
    return group.lines.every((one) => one.kind === "note");
}

function getIsTipWithin(reading: TipReading, room: number): boolean {
    const height = getTipHeight(getTipSize(reading));
    if (height === null) return true;
    return height <= room;
}

/**
 * The card with its last sacrificeable run gone, or null where there is none left. The four
 * figures are what a card is for and the notes carry the suspicions — a claim that a figure above
 * may be wrong outranks how somebody fought — so what goes is between them, the last one first.
 */
function composeGroupsWithout(groups: readonly TipGroup[]): TipGroup[] | null {
    const last = groups.length - 1;
    if (last < 1) return null;
    const at = getIsNoteGroup(groups[last] ?? { lines: [] }) ? last - 1 : last;
    if (at < 1) return null;
    return [...groups.slice(0, at), ...groups.slice(at + 1)];
}

/** The card once something was given up: it says so, where a figure's qualifiers are read. */
function composeTipCut(reading: TipReading, kept: readonly TipGroup[]): TipReading {
    if (kept.length === reading.groups.length) return reading;
    const said: TipLine = { kind: "note", text: CARD_WORDS.cut, tone: "plain" };
    const last = kept[kept.length - 1];
    if (last !== undefined) {
        if (getIsNoteGroup(last)) {
            const groups = [...kept.slice(0, -1), { lines: [...last.lines, said] }];
            return { ...reading, groups };
        }
    }
    return { ...reading, groups: [...kept, { lines: [said] }] };
}

/**
 * The card cut to the room there is, with a line saying so wherever anything was given up.
 *
 * ⚠️ **A card taller than the window is clipped and says nothing about it.** The box carries
 * `overflow:hidden` and takes no pointer: measured on Chrome 152, 2026-09-06, a 533 px card in a
 * 480 px window shows 464 of it and loses the rest without a mark. So what will not fit is given
 * up at a run's own edge and the card states it. Unchanged where the page states no height.
 */
export function composeTipWithin(reading: TipReading, room: number | null): TipReading {
    if (room === null) return reading;
    if (!Number.isFinite(room)) return reading;
    if (room <= 0) return reading;
    if (getIsTipWithin(reading, room)) return reading;
    let kept: readonly TipGroup[] = reading.groups;
    for (let step = 0; step < MAXIMUM_TIP_GROUPS; step += 1) {
        const shorter = composeGroupsWithout(kept);
        if (shorter === null) break;
        kept = shorter;
        if (getIsTipWithin(composeTipCut(reading, kept), room)) break;
    }
    return composeTipCut(reading, kept);
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
    register: TipLookup,
    redraw: TipRedraw,
    /** Asked with the key the card is open for: the two windows do not open on the same side. */
    getAcross: (key: string) => TipAcross | null = () => null,
    /** Asked as a card opens, never as the panel is built. Null is a page stating no height. */
    getViewportHeight: () => number | null = () => null,
): TipHandle {
    let standing = composeTipElement(document, null);
    let openKey: string | null = null;
    let openTop = 0;
    let openSize: TipSize = getTipSize(null);
    const setTo = (key: string, reading: TipReading): void => {
        // Cut here rather than where a card is composed: the one place that knows both it and the
        // window, and on the way in for a card opened and for one a redraw put up again.
        const shown = composeTipWithin(reading, getTipRoom(getViewportHeight()));
        openSize = getTipSize(shown);
        standing = redraw(standing, () => composeTipElement(document, shown));
        setTipPlace(standing, openTop, getAcross(key), openSize);
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
                // A card that would not compose is hidden where it stands
                // (`src/ui/panel-element.ts`) without this handle being told, so the key it was
                // open under still names it: without the class read here, a pointer moving inside
                // that row would only move a window nobody can see.
                if (!standing.className.includes(CLASS.tipHidden)) {
                    // A pointer reports far more moves than the window has places to stand in,
                    // and a move inside one pixel would rewrite the same declaration.
                    if (top === openTop) return;
                    openTop = top;
                    setTipPlace(standing, openTop, getAcross(key), openSize);
                    return;
                }
            }
            const compose = register.get(key);
            if (compose === null) {
                hide();
                return;
            }
            openTop = top;
            openKey = key;
            setTo(key, compose());
        },
        refresh(): void {
            const key = openKey;
            if (key === null) return;
            const compose = register.get(key);
            if (compose === null) {
                hide();
                return;
            }
            setTo(key, compose());
        },
    };
}
