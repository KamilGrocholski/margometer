/**
 * The panel, drawn into a document it is handed. It never reaches for one, which is what keeps
 * the surface this asks of a browser declared rather than assumed.
 */

import { BUILD_VERSION } from "@/src/build-version.ts";
import { type StandingReading, type StandingRow } from "@/src/ui/panel-standing.ts";
import { composeDecimalText, composeIntegerText } from "@/libs/number-text.ts";
import { setGuardedListener } from "@/src/ui/panel-listener.ts";
import type {
    DrillReading,
    ElementCut,
    ElementRow,
    HalfNamedDrillReading,
    HalfNamedReading,
    HalfNamedRow,
    NamedPart,
    OpponentRow,
    PairReading,
    PanelMetric,
    PanelReading,
    PanelSidePart,
    PanelSides,
    PanelUnnamedEnd,
    PartReading,
    PersonRow,
    PinnedRow,
    PlainRow,
    RankingRow,
    ShelfRow,
    SkillRow,
    UnnamedRow,
} from "@/src/ui/panel-reading.ts";
import { getEndForPinned, getPartOfSide, getRowIsSuspect } from "@/src/ui/panel-reading.ts";
import {
    composeDirectionStrips,
    composeNounStrips,
    composeSideStrips,
    getDirectionForMetric,
    getNounForMetric,
    getWordsForKindCut,
    getWordsForMetric,
    getWordsForOpponentCut,
    type PanelNoun,
    type PanelSideChoice,
    type PanelStorageChoice,
    type ScreenStrip,
    STORAGE_CHOICES,
} from "@/src/ui/panel-screen.ts";
import {
    CLASS,
    composeStyleSheet,
    getColourForProfession,
    getTipRoom,
    SIGNAL,
} from "@/src/ui/panel-look.ts";
import type { HandlePanelFailure } from "@/src/ui/panel-defect.ts";
import {
    composeKeptScrollMemo,
    getTopOfList,
    setListRowsDrawn,
    setTopOfList,
} from "@/src/ui/panel-scroll.ts";
import {
    CARD_WORDS,
    composeFigureText,
    composeShelfSizeText,
    composeSideCountsText,
    composeStandingCountText,
    composeStandingTurnsText,
    composeTurnOrdinalText,
    composeUndrawnText,
    composeUsesText,
    DEFECT_MARK,
    getWordsForDamageKind,
    getWordsForHealthSource,
    getWordsForNothing,
    getWordsForOutcome,
    getWordsForPin,
    getWordsForPinnedScope,
    getWordsForPinnedStanding,
    getWordsForShelfOutcome,
    getWordsForShelfTime,
    getWordsForStorage,
    getWordsForUnannounced,
    getWordsForUnnamedEnd,
    NEITHER_END_WORDS,
    PANEL_WORDS,
    type PanelRegion,
    STANDING_WORDS,
    SUSPECT_MARK,
    type TranslateLabel,
    TURN_MARK,
} from "@/src/ui/panel-words.ts";
import {
    composeTipLeft,
    PANEL_WINDOW,
    type PanelDragHandle,
    type PanelPlacement,
    type PanelPosition,
    setGripMark,
    setPanelDrag,
    STANDING_WINDOW,
} from "@/src/ui/panel-drag.ts";
import {
    composeTipHandle,
    composeTipRegister,
    setTipHidden,
    type TipCompose,
    type TipGroup,
    type TipHandle,
    type TipLine,
    type TipReading,
    type TipRegister,
} from "@/src/ui/panel-tip.ts";
import { composeCardReading } from "@/src/ui/panel-card.ts";

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
    /**
     * Where the pointer went, on the event that says it left somewhere. Absent on every other,
     * and null where it left the page.
     */
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
    /**
     * Where a region that scrolls is standing, which only the list ever is. Read off the element
     * about to be replaced and written onto the one taking its place — `src/ui/panel-scroll.ts`
     * owns both halves, and `docs/browser-support.md` carries the row for it.
     */
    scrollTop: number;
    append(child: PanelElement): void;
    replaceWith(other: PanelElement): void;
    /**
     * What stands inside a region, and the one way to swap it without replacing the region
     * itself. Only the list is drawn that way, and `src/ui/panel-scroll.ts` says why.
     */
    children: ArrayLike<PanelElement>;
    replaceChildren(...children: PanelElement[]): void;
    setAttribute(name: string, value: string): void;
    /**
     * Read back off the element about to go, so a region that **stays** takes what the one drawn
     * for it was carrying. `src/ui/panel-scroll.ts` owns the one attribute that travels that way
     * and says which. A third name on this surface, after the two **ADR 0052** added: it earns no
     * row in `docs/browser-support.md` either, being older than every floor stated there.
     */
    getAttribute(name: string): string | null;
    /**
     * Which of the two windows under this root a press landed in. Asked at one place — the back
     * listener, which reads the node under the hand and walks no ancestors, so nothing else can
     * tell a caster row of the window beside the panel from a row of the panel's own list.
     * **ADR 0071**, and `docs/browser-support.md` carries its row.
     */
    contains(other: PanelTarget | null): boolean;
    attachShadow(options: { mode: "open" }): PanelRoot;
    /** A drag keeping the pointer it has. Optional: a document offering neither still drags. */
    setPointerCapture?(pointerId: number): void;
    releasePointerCapture?(pointerId: number): void;
}

/**
 * The root, which is where the one listener goes — and the reason it is stated here rather than
 * left to the host.
 *
 * A press inside a shadow root is **retargeted** for any listener outside it, and the host is
 * outside it: a listener there is handed the host as the target, whatever was actually pressed.
 * Reading an attribute off that answers null for every row, strip and crumb, so a panel listening
 * on its host draws correctly and does nothing at all. The element interface above carries no
 * `addEventListener` for that reason — the wrong place to put it is not reachable from here.
 */
export interface PanelRoot {
    append(child: PanelElement): void;
    addEventListener(type: string, handle: (event: PanelEvent) => void): void;
}

const HOST_NAME = "MargoMeter-Panel";
/**
 * On the host where anything outside the root can read it: a screenshot of the panel is a report,
 * and one that does not say which build made it is a claim about no particular version.
 */
const VERSION_ATTRIBUTE = "data-margometer-version";
/** What a control asks for. One attribute per control, so the listener never reads a class. */
const FOLD_ATTRIBUTE = "data-fold";
const SAVE_ATTRIBUTE = "data-save";
const SHELF_ATTRIBUTE = "data-shelf";
const SCREEN_ATTRIBUTE = "data-screen";
const SIDE_ATTRIBUTE = "data-side";
const ROW_ATTRIBUTE = "data-row";
const BACK_ATTRIBUTE = "data-back";
/** One per kind of part, so what a row opens is read off an attribute rather than parsed. */
const SKILL_ATTRIBUTE = "data-skill";
const SOURCE_ATTRIBUTE = "data-source";
const KIND_ATTRIBUTE = "data-kind";
const FIGHT_ATTRIBUTE = "data-fight";
const PIN_ATTRIBUTE = "data-pin";
/** Which end a pinned row leaves out, which is the whole of what opening it asks for. */
const UNNAMED_ATTRIBUTE = "data-unnamed";
const STORAGE_ATTRIBUTE = "data-storage";
/**
 * The window beside the panel, and its own two controls. Its fold is not the panel's: one mark
 * over both would put away the window a reader was watching along with the one they folded.
 */
const STANDING_ATTRIBUTE = "data-standing";
const STANDING_FOLD_ATTRIBUTE = "data-standing-fold";
const LIVE_FIGHT = "live";
const TIP_ATTRIBUTE = "data-tip";
const TITLE_ATTRIBUTE = "title";
/** What a row's bar is written on, since a length and a hue are data rather than tokens. */
const STYLE_ATTRIBUTE = "style";
const ROWS_VARIABLE = "--MargoMeter-rows";
/**
 * ⚠️ **No face in `system-ui, sans-serif` carries U+2B73 on this machine.** Chrome 152 draws it
 * anyway, from a font further down its own fallback, and `fc-list :charset=2b73` on 2026-08-30
 * named one — a coding face nobody installs on purpose. `↓` is the mark the UI sans itself
 * carries. A reader reporting a box here is reporting that, and the swap is one character.
 */
const SAVE_MARK = "⭳";
const SHELF_MARK = "☰";
const FOLD_MARK = "—";
const UNFOLD_MARK = "+";
const BACK_MARK = "‹ ";
const GRIP_MARK = "⠿ ";
const PRESS_EVENT = "pointerdown";
const BACK_EVENT = "contextmenu";
const MOVE_EVENT = "pointermove";
/**
 * What closes it. `pointerleave` does not bubble and a shadow root is not on the composed path of
 * one dispatched to an element, so the one listener would never see it; `pointerout` bubbles —
 * and therefore fires on every crossing **inside** a row, whose bar, rank, name and figure are
 * four elements. What the pointer went *to* is what tells the two apart: a crossing that lands on
 * the same row's mark is not a leaving, and reading it is what keeps the card from being thrown
 * away and rebuilt four times on the way across the row it describes.
 */
const LEAVE_EVENT = "pointerout";
/** The button a press has to be to open anything. A press that states none is that button. */
const PRIMARY_BUTTON = 0;
/**
 * ⚠️ **One more than the shelf keeps, and the shelf list is the only list that draws it.** The
 * row for the fight still **running** is not a kept one — a fight goes on the shelf when it ends
 * — so a reader with a full shelf who starts a fight is handed one row past `MAXIMUM_KEPT` in
 * `src/game/kept-fights.ts`. Asserting the ranking's bound here took the whole list down at
 * exactly that moment, reported on 0.12.1 with a capture of a one-payload fight whose ranking
 * held three rows. `tests/ui/shelf-bound.test.ts` holds the two constants together, and is the
 * one place both layers may be read at once.
 */
export const MAXIMUM_SHELF_ROWS = 21;
const PIN_MARK = "★";
const UNPINNED_MARK = "☆";
const ROWS_WAITING = 11;
/**
 * How tall the shelf stands, which is its own answer and never the ranking's: no side narrows a
 * shelf and the strip that narrows one is not drawn over it, so a shelf reading the ranking's
 * count shortened by a row whenever a reader had last chosen a side.
 */
const ROWS_SHELF = 11;
/** The place a panel with no fight stands in. Nothing to scroll, and nobody's position. */
const WAITING_LIST_NAME = "waiting";
/**
 * How many kinds a pinned row's card states before what is left of them is summed into one line.
 * Measured over `captures/` with `deno task panel:drill` on 2026-09-01: the widest pinned row
 * states four kinds, and 27 of the 28 state three or fewer. Six is headroom rather than a bound
 * anything meets — and a reachable one, because `takenWithNoTarget` folds the ten keys a blow
 * carries in with the seven a bare movement does.
 */
const MAXIMUM_TIP_CUT_PARTS = 6;
const TIP_WIDTH = 250;
/** A bar is written to one place: a tenth of a 260-pixel row is a quarter of a pixel. */
const FILL_PLACES = 1;
const AS_PERCENT = 100;

function composeElement(document: PanelDocument, tag: string, className: string): PanelElement {
    const element = document.createElement(tag);
    element.className = className;
    return element;
}

function composeSlotElement(document: PanelDocument): PanelElement {
    const slot = composeElement(document, "div", CLASS.slot);
    return slot;
}

interface RowTip {
    register: TipRegister;
    key: string;
    figure: string;
    share: string | null;
    /**
     * What a row with nobody behind it owes beyond its own figure: what the game did not say, and
     * where the figure stands against the list. `src/ui/panel-words.ts` writes them.
     */
    notes?: readonly string[] | undefined;
    /**
     * What that figure was made of, where the row stands over a cut somebody kept for it. Drawn
     * as a run of its own under a heading, the way a card draws one. **ADR 0041.**
     */
    cut?: RowTipCut | undefined;
    compose?: TipCompose | undefined;
}

/** A run of parts a row's card states, already worded and already stated. */
interface RowTipCut {
    heading: string;
    parts: ReadonlyArray<{ label: string; stated: string }>;
}

/**
 * What a row is pressed by: the attribute the listener reads it off, and what it says. A row that
 * opens nothing wears none, and that one answer decides the cursor, the note on the card and
 * whether a press lands — spelling them apart is how a section came to have half its rows
 * pressable and nothing saying which.
 */
interface RowMark {
    attribute: string;
    stated: string;
}

interface RowReading {
    name: string;
    figure: number;
    fill: number;
    shareText: string;
    colour: string;
    profession: string | null;
    rank: number | null;
    uses?: number | null | undefined;
    /** Whether this row's own figure is short of something. Only a person's row can be. */
    isSuspect?: boolean | undefined;
    /**
     * Which side this row stands on. `nobody` is every row with no person behind it and every
     * fight the client named no side of the reader's own on, and it draws no rule at all.
     */
    sidePart?: PanelSidePart | undefined;
    /** Whether the game is numbering this combatant's turn. The ranking's answer and no other. */
    isTurnHolder?: boolean | undefined;
}

/**
 * A pointer lands on the deepest element under it, so every part of a row wears the row's marks —
 * the same reason the press attribute is written on the spans and not on the row alone.
 */
function setRowMarks(parts: readonly PanelElement[], name: string, value: string): void {
    for (const part of parts) part.setAttribute(name, value);
}

/**
 * The rule on the row's right edge, or nothing. `nobody` is both a fight nothing could tell the
 * sides apart on and a row with no person behind it, and neither earns a grey rule: a panel that
 * cannot place somebody says nothing rather than drawing an answer. **ADR 0065.**
 */
function composeSideRuleElements(
    document: PanelDocument,
    part: PanelSidePart,
): PanelElement[] {
    if (part === "nobody") return [];
    const rule = composeElement(document, "div", CLASS.rowSide);
    rule.setAttribute(STYLE_ATTRIBUTE, `color:${part === "ours" ? SIGNAL.ours : SIGNAL.theirs}`);
    return [rule];
}

function composeBarElements(document: PanelDocument, reading: RowReading): PanelElement[] {
    const width = composeDecimalText(Math.min(reading.fill, 1) * AS_PERCENT, FILL_PLACES);
    const bar = composeElement(document, "div", CLASS.bar);
    bar.setAttribute(STYLE_ATTRIBUTE, `width:${width}%;background:${reading.colour}`);
    const cap = composeElement(document, "div", CLASS.barCap);
    cap.setAttribute(STYLE_ATTRIBUTE, `background:${reading.colour}`);
    return [bar, cap];
}

/**
 * Where the card is standing, which decides two of its lines and nothing else about it. The
 * figures are the fight's at every level, so a card over a row stating a cut of one says so.
 */
interface CardPlace {
    metric: PanelMetric;
    translate: TranslateLabel | null;
    isRowNarrower: boolean;
    /** Null where the client named no side of its own, and the card then names none either. */
    readerSide: number | null;
}

/**
 * The card a person's row opens, and **the same card at every level a person stands on** — the
 * ranking, the ends an opened figure reached, and whom one skill reached. A row with nobody
 * behind it has no card to compose: a skill, a kind and an end the protocol left out fall back
 * on `composeRowTipReading`. `DESIGN.md` owns the rule; **ADR 0032** owns why.
 */
function composePersonCard(
    row: RankingRow | OpponentRow,
    place: CardPlace,
    doesOpen: boolean,
): TipCompose {
    return () =>
        composeCardReading({
            name: row.name ?? PANEL_WORDS.unknown,
            profession: row.profession,
            sidePart: getPartOfSide(row.side, place.readerSide),
            detail: row.detail,
            metric: place.metric,
            doesOpen,
            isRowNarrower: place.isRowNarrower,
            translate: place.translate,
        });
}

/**
 * The tip a row falls back on where nobody stands behind it, and the one instruction the panel
 * gives. A skill, a kind, an end the protocol left out and a fight on the shelf get this.
 *
 * ⚠️ **A row that opens says so, at every level and not only on the ranking.** The note used to be
 * the card's alone, and of the rows a reader meets inside an opened one, the 1,576 that open
 * (`captures/`, 2026-08-30) were told apart from the 588 that do not by the cursor and by nothing
 * else. Half a section being pressable and silent about it teaches a reader that none of it is.
 */
function composeRowTipReading(reading: RowReading, tip: RowTip, doesOpen: boolean): TipReading {
    const stated: TipLine[] = [{
        kind: "stat",
        label: tip.figure,
        stated: composeFigureText(reading.figure),
        isStrong: false,
    }];
    if (tip.share !== null) {
        stated.push({ kind: "stat", label: tip.share, stated: reading.shareText, isStrong: false });
    }
    const said: TipLine[] = [];
    for (const note of tip.notes ?? []) {
        said.push({ kind: "note", text: note, isSuspect: false });
    }
    if (doesOpen) said.push({ kind: "note", text: CARD_WORDS.gesture, isSuspect: false });
    const cut = composeRowTipCutLines(tip.cut);
    // One group where there is nothing to divide. A rule drawn between two lines and the two
    // sentences under them is a card cut in half for the sake of it, and every row but a pinned
    // one is exactly that card.
    if (cut.length === 0) {
        return { name: reading.name, subtitle: null, groups: [{ lines: [...stated, ...said] }] };
    }
    const groups: TipGroup[] = [{ lines: stated }, { lines: cut }];
    if (said.length > 0) groups.push({ lines: said });
    return { name: reading.name, subtitle: null, groups };
}

/** What the figure was made of, as the run of a card it is drawn as. Empty where none was kept. */
function composeRowTipCutLines(cut: RowTipCut | undefined): TipLine[] {
    if (cut === undefined) return [];
    if (cut.parts.length === 0) return [];
    const lines: TipLine[] = [{ kind: "heading", text: cut.heading }];
    for (const part of cut.parts) {
        lines.push({ kind: "sub", label: part.label, stated: part.stated });
    }
    return lines;
}

function composeRowElement(
    document: PanelDocument,
    reading: RowReading,
    mark: RowMark | null,
    tip: RowTip,
): PanelElement {
    // The mark it wears is the whole answer: the cursor, the note the card carries and what a
    // press resolves to are one question asked once.
    const doesOpen = mark !== null;
    const kind = doesOpen ? CLASS.rowDrillable : CLASS.rowLeaf;
    const element = composeElement(document, "div", `${CLASS.row} ${kind}`);
    const parts = composeBarElements(document, reading);
    const rank = composeElement(document, "span", CLASS.rowRank);
    rank.textContent = reading.rank === null ? "" : `${composeFigureText(reading.rank)}.`;
    parts.push(rank);
    // Built only where there is one to build: this runs per row per redraw, and a node made to be
    // thrown away is a cost paid a fight's worth of times.
    if (reading.isSuspect === true) {
        const mark = composeElement(document, "span", CLASS.rowSuspect);
        mark.textContent = SUSPECT_MARK;
        parts.push(mark);
    }
    if (reading.isTurnHolder === true) {
        const mark = composeElement(document, "span", CLASS.rowTurn);
        mark.textContent = TURN_MARK;
        parts.push(mark);
    }
    parts.push(...composeSideRuleElements(document, reading.sidePart ?? "nobody"));
    const name = composeElement(document, "span", CLASS.rowName);
    name.textContent = reading.name;
    const value = composeElement(document, "span", `${CLASS.rowValue} ${CLASS.figure}`);
    value.textContent = composeFigureText(reading.figure);
    const share = composeElement(document, "span", CLASS.rowShare);
    const uses = reading.uses ?? null;
    const counted = uses === null ? "" : ` · ${composeUsesText(uses)}`;
    share.textContent = `(${reading.shareText}${counted})`;
    value.append(share);
    parts.push(name, value);
    for (const part of parts) element.append(part);
    parts.push(share);
    const marked = [element, ...parts];
    // Every span and not the row alone: a listener reads what was pressed off the node under the
    // hand, and a mark on the row only swallows a press that landed on the name or the figure.
    if (mark !== null) setRowMarks(marked, mark.attribute, mark.stated);
    tip.register.add(tip.key, tip.compose ?? (() => composeRowTipReading(reading, tip, doesOpen)));
    setRowMarks(marked, TIP_ATTRIBUTE, tip.key);
    return element;
}

function composeCombatantReading(
    row: PersonRow,
    rank: number | null,
    metric: PanelMetric,
    place: PersonPlace,
): RowReading {
    return {
        name: row.name ?? PANEL_WORDS.unknown,
        figure: row.figure,
        fill: row.fill,
        shareText: row.shareText,
        colour: getColourForProfession(row.profession),
        profession: row.profession,
        rank,
        isSuspect: getRowIsSuspect(row.detail, metric),
        sidePart: getPartOfSide(row.side, place.readerSide),
        isTurnHolder: row.combatantId === place.turnHolderId,
    };
}

/**
 * What a person's row can say beyond its own figure: which side it stands on, and whether the
 * game is numbering its turn. Read off the screen rather than off the row, because neither is a
 * fact about the figure — the same person draws differently on a fight with no seat to read from.
 */
interface PersonPlace {
    readerSide: number | null;
    /** Null off the ranking: a row inside an opened figure is a cut, not a place in the order. */
    turnHolderId: number | null;
}

function composeCutPlace(shown: ShownScreen): PersonPlace {
    return { readerSide: shown.readerSide, turnHolderId: null };
}

function composeElementReading(row: ElementRow, noun: PanelNoun, rank: number): RowReading {
    return {
        name: noun === "damage"
            ? getWordsForDamageKind(row.element)
            : getWordsForHealthSource(row.element),
        figure: row.figure,
        fill: row.fill,
        shareText: row.shareText,
        colour: getColourForProfession(null),
        profession: null,
        rank,
    };
}

/**
 * Which end an opened figure's cut left out. It follows the **direction** and not the screen: a
 * given screen names no receiver, a received one names nobody who did it. One copy, because the
 * two levels that draw such a row were spelling the same rule two ways.
 */
function getUnnamedEndForMetric(metric: PanelMetric): PanelUnnamedEnd {
    return getDirectionForMetric(metric) === "given" ? "target" : "actor";
}

function getWordsForUnnamedRow(end: PanelUnnamedEnd): string {
    return end === "actor" ? PANEL_WORDS.withoutActor : PANEL_WORDS.withoutTarget;
}

function composeUnnamedReading(row: UnnamedRow | PinnedRow, name: string): RowReading {
    return {
        name,
        figure: row.figure,
        fill: row.fill,
        shareText: row.shareText,
        colour: getColourForProfession(null),
        profession: null,
        rank: null,
    };
}

function composeStripElement(
    document: PanelDocument,
    attribute: string,
    strip: ScreenStrip,
): PanelElement {
    const marked = strip.isCurrent ? ` ${CLASS.stripCurrent}` : "";
    const element = composeElement(document, "div", `${CLASS.strip}${marked}`);
    element.setAttribute(attribute, strip.name);
    element.textContent = strip.words;
    return element;
}

function composeNounStripElement(document: PanelDocument, shown: ShownScreen): PanelElement {
    const strips = composeElement(document, "div", CLASS.strips);
    for (const one of composeNounStrips(shown.current)) {
        strips.append(composeStripElement(document, SCREEN_ATTRIBUTE, getShownStrip(one, shown)));
    }
    return strips;
}

function composeDirectionStripElement(document: PanelDocument, shown: ShownScreen): PanelElement {
    const strips = composeElement(document, "div", CLASS.strips);
    for (const one of composeDirectionStrips(shown.current)) {
        strips.append(composeStripElement(document, SCREEN_ATTRIBUTE, getShownStrip(one, shown)));
    }
    if (shown.readerSide === null) return strips;
    strips.append(composeElement(document, "span", CLASS.stripsGap));
    for (const one of composeSideStrips(shown.side)) {
        strips.append(composeStripElement(document, SIDE_ATTRIBUTE, getShownStrip(one, shown)));
    }
    return strips;
}

function getShownStrip(strip: ScreenStrip, shown: ShownScreen): ScreenStrip {
    if (!shown.isOnShelf) return strip;
    return { ...strip, isCurrent: false };
}

function composeFoldControl(document: PanelDocument, isCollapsed: boolean): PanelElement {
    const control = composeElement(document, "span", CLASS.control);
    control.textContent = isCollapsed ? UNFOLD_MARK : FOLD_MARK;
    control.setAttribute(FOLD_ATTRIBUTE, "");
    control.setAttribute(TITLE_ATTRIBUTE, isCollapsed ? PANEL_WORDS.expand : PANEL_WORDS.collapse);
    return control;
}

function composeBarControl(
    document: PanelDocument,
    stated: { className: string; mark: string; attribute: string; words: string },
): PanelElement {
    const control = composeElement(document, "span", stated.className);
    control.textContent = stated.mark;
    control.setAttribute(stated.attribute, "");
    control.setAttribute(TITLE_ATTRIBUTE, stated.words);
    return control;
}

/**
 * The save is drawn only where there is a fight to hand over. A control that does nothing is worse
 * than one that is not there (`DESIGN.md`), and this one used to hand over an envelope with no
 * call in it — a file that looked like a saved fight and was not. **ADR 0053.**
 */
function composeTitleElement(
    document: PanelDocument,
    isCollapsed: boolean,
    hasFightToSave: boolean,
): PanelElement {
    const bar = composeElement(document, "div", CLASS.title);
    // Set before the controls are appended, not after: `textContent` replaces every child, so
    // the other order would wipe them.
    bar.textContent = `${GRIP_MARK}${PANEL_WORDS.title}`;
    bar.setAttribute(TITLE_ATTRIBUTE, PANEL_WORDS.drag);
    setGripMark(bar, PANEL_WINDOW);
    const version = composeElement(document, "span", CLASS.titleVersion);
    version.textContent = BUILD_VERSION;
    // Marked as well as the bar under it. The bar wears `cursor:move` and every child inherits
    // it, so a label that starts no drag is an affordance that lies (`DESIGN.md`) — and this one
    // sits between the name and the controls, where a hand aiming for the bar lands.
    setGripMark(version, PANEL_WINDOW);
    bar.append(version);
    bar.append(composeBarControl(document, {
        className: `${CLASS.control} ${CLASS.controlFights}`,
        mark: SHELF_MARK,
        attribute: SHELF_ATTRIBUTE,
        words: PANEL_WORDS.openFights,
    }));
    if (hasFightToSave) {
        bar.append(composeBarControl(document, {
            className: CLASS.control,
            mark: SAVE_MARK,
            attribute: SAVE_ATTRIBUTE,
            words: PANEL_WORDS.saveFight,
        }));
    }
    bar.append(composeFoldControl(document, isCollapsed));
    return bar;
}

/** The window's own bar: its own grip, its own fold, and no control that would close it. */
function composeStandingBar(document: PanelDocument, isCollapsed: boolean): PanelElement {
    const bar = composeElement(document, "div", CLASS.standingBar);
    bar.textContent = `${GRIP_MARK}${STANDING_WORDS.title}`;
    bar.setAttribute(TITLE_ATTRIBUTE, STANDING_WORDS.drag);
    setGripMark(bar, STANDING_WINDOW);
    const control = composeElement(document, "span", CLASS.control);
    control.textContent = isCollapsed ? UNFOLD_MARK : FOLD_MARK;
    control.setAttribute(STANDING_FOLD_ATTRIBUTE, "");
    control.setAttribute(
        TITLE_ATTRIBUTE,
        isCollapsed ? STANDING_WORDS.expand : STANDING_WORDS.collapse,
    );
    bar.append(control);
    return bar;
}

/** Whose turn it is, as the game numbers it. A payload stating no queue says that instead. */
function composeStandingNow(document: PanelDocument, reading: StandingReading): PanelElement[] {
    const said = reading.turnOrdinal === null ? "" : composeTurnOrdinalText(reading.turnOrdinal);
    const section = composeElement(document, "div", CLASS.section);
    const words = composeElement(document, "span", CLASS.sectionWords);
    words.textContent = STANDING_WORDS.now;
    const figure = composeElement(document, "span", CLASS.figure);
    figure.textContent = said;
    section.append(words);
    section.append(figure);
    const holder = reading.holder;
    if (holder === null) {
        const empty = composeElement(document, "div", CLASS.empty);
        empty.textContent = STANDING_WORDS.turnUnread;
        return [section, empty];
    }
    const row = composeStandingPersonElement(document, {
        name: holder.name,
        colour: holder.colour,
        sidePart: holder.sidePart,
        turns: null,
        isUnder: false,
    });
    return [section, row];
}

/**
 * One row per person, at both levels: whoever is holding, and under them whom. The turns stand on
 * the holder's row alone, because they are the cast's and not the held character's. **ADR 0067.**
 */
function composeProvokedElements(
    document: PanelDocument,
    reading: StandingReading,
): PanelElement[] {
    if (reading.provoked.length === 0) return [];
    // The characters held, and never the casts holding them: **ADR 0062**'s heading counts people.
    let counted = 0;
    for (const one of reading.provoked) counted += one.provoked.length;
    const drawn: PanelElement[] = [
        composeSectionElement(document, STANDING_WORDS.provocation, counted),
    ];
    for (const provocation of reading.provoked) {
        drawn.push(composeStandingPersonElement(document, {
            name: provocation.casterName,
            colour: provocation.casterColour,
            sidePart: provocation.casterSidePart,
            turns: composeStandingTurnsText(provocation.turnsElapsed, provocation.turnsStated),
            isUnder: false,
        }));
        for (const held of provocation.provoked) {
            drawn.push(composeStandingPersonElement(document, {
                name: held.name,
                colour: held.colour,
                sidePart: held.sidePart,
                turns: null,
                isUnder: true,
            }));
        }
    }
    return drawn;
}

/**
 * One person in the window beside the panel, wherever they stand: whose turn it is, who cast a
 * skill, who is holding somebody, and whom. Their profession is the cap and their side the rule
 * on the edge (**ADR 0065**); a row nested under the one above wears the indent and no other
 * difference.
 */
function composeStandingPersonElement(
    document: PanelDocument,
    person: {
        name: string;
        colour: string;
        sidePart: PanelSidePart;
        /** Null where the figure belongs to the row above rather than to this one. */
        turns: string | null;
        isUnder: boolean;
    },
): PanelElement {
    const nested = person.isUnder ? ` ${CLASS.standingUnder}` : "";
    const row = composeElement(document, "div", `${CLASS.row}${nested}`);
    const cap = composeElement(document, "div", CLASS.barCap);
    cap.setAttribute(STYLE_ATTRIBUTE, `background:${person.colour}`);
    const name = composeElement(document, "span", CLASS.rowName);
    name.textContent = person.name;
    row.append(cap);
    row.append(name);
    if (person.turns !== null) {
        const value = composeElement(document, "span", `${CLASS.rowValue} ${CLASS.figure}`);
        value.textContent = person.turns;
        row.append(value);
    }
    for (const rule of composeSideRuleElements(document, person.sidePart)) row.append(rule);
    return row;
}

/**
 * The two sides' counts, as the strip under the ranking states them: **two figures the colour
 * tells apart**, not one figure with a mark in it. The separator divides nothing and is drawn in
 * the quiet ink to say so — `DESIGN.md`'s Colour Never Alone Rule is met by the numbers it stands
 * between, and a fight the client named no side on gets one plain count instead.
 */
function composeStandingCountElement(
    document: PanelDocument,
    row: StandingRow,
): PanelElement {
    const value = composeElement(document, "span", `${CLASS.rowValue} ${CLASS.figure}`);
    if (row.ours === null || row.theirs === null) {
        value.textContent = composeStandingCountText(row);
        return value;
    }
    const ours = composeElement(document, "span", CLASS.standingOurs);
    ours.textContent = composeIntegerText(row.ours);
    const between = composeElement(document, "span", CLASS.rowShare);
    between.textContent = STANDING_WORDS.sideSeparator;
    const theirs = composeElement(document, "span", CLASS.standingTheirs);
    theirs.textContent = composeIntegerText(row.theirs);
    value.append(ours);
    value.append(between);
    value.append(theirs);
    return value;
}

/** One counted row per skill, and the casters under whichever one is open. */
function composeStandingRowElements(
    document: PanelDocument,
    reading: StandingReading,
): PanelElement[] {
    const drawn: PanelElement[] = [];
    for (const row of reading.rows) {
        const element = composeElement(document, "div", `${CLASS.row} ${CLASS.rowDrillable}`);
        const name = composeElement(document, "span", CLASS.rowName);
        name.textContent = row.skillName;
        const value = composeStandingCountElement(document, row);
        element.append(name);
        element.append(value);
        setRowMarks([element, name, value], STANDING_ATTRIBUTE, composeIntegerText(row.skillId));
        drawn.push(element);
        if (row.skillId !== reading.openSkillId) continue;
        for (const caster of row.casters) {
            drawn.push(composeStandingPersonElement(document, {
                name: caster.name,
                colour: caster.colour,
                sidePart: caster.sidePart,
                turns: composeStandingTurnsText(caster.turnsElapsed, caster.turnsStated),
                isUnder: true,
            }));
        }
    }
    return drawn;
}

function composeStandingBody(
    document: PanelDocument,
    reading: StandingReading,
): PanelElement {
    const body = composeElement(document, "div", CLASS.standingBody);
    for (const element of composeStandingNow(document, reading)) body.append(element);
    body.append(composeSectionElement(document, STANDING_WORDS.standing, reading.rows.length));
    if (reading.rows.length === 0) {
        if (reading.provoked.length === 0) {
            const empty = composeElement(document, "div", CLASS.empty);
            empty.textContent = STANDING_WORDS.nothingStands;
            body.append(empty);
            return body;
        }
        for (const element of composeProvokedElements(document, reading)) body.append(element);
        return body;
    }
    for (const element of composeStandingRowElements(document, reading)) body.append(element);
    for (const element of composeProvokedElements(document, reading)) body.append(element);
    return body;
}

function composeHeaderElement(document: PanelDocument, shown: ShownScreen): PanelElement {
    const header = composeElement(document, "div", CLASS.header);
    const line = composeElement(document, "div", CLASS.headerLine);
    const who = composeElement(document, "span", "");
    who.textContent = composeSideCountsText(shown.reading.sizes, shown.reading.unplaced);
    line.append(who);
    // Absent rather than empty where the reading says nothing, and `ui/panel-reading.ts` says
    // when it does and why the header may not fill the silence in.
    const outcome = shown.reading.outcome;
    if (outcome !== null) {
        const said = composeElement(document, "span", CLASS.headerOutcome);
        said.textContent = getWordsForOutcome(outcome);
        line.append(said);
    }
    header.append(line);
    if (shown.place === null) return header;
    const place = composeElement(document, "div", CLASS.headerPlace);
    place.textContent = shown.place;
    place.setAttribute(TITLE_ATTRIBUTE, shown.place);
    header.append(place);
    return header;
}

function composeCrumbRegion(document: PanelDocument, shown: ShownScreen): PanelElement {
    if (shown.isOnShelf) {
        return composeCrumbElement(document, PANEL_WORDS.fights, PANEL_WORDS.backFromFights);
    }
    if (shown.halfNamedDrill !== null) {
        return composeCrumbElement(
            document,
            getWordsForHalfNamedDrill(shown.halfNamedDrill, shown.current),
            getWordsForUnnamedRow(getEndForPinned(shown.halfNamedDrill.case)),
        );
    }
    if (shown.halfNamed !== null) {
        return composeCrumbElement(document, getWordsForUnnamedRow(shown.halfNamed.end));
    }
    if (shown.drill === null) return composeSlotElement(document);
    const opened = shown.drill.name ?? PANEL_WORDS.unknown;
    if (shown.part !== null) {
        return composeCrumbElement(
            document,
            getWordsForNamedPart(shown.part.part, shown.current),
            opened,
        );
    }
    if (shown.pair === null) return composeCrumbElement(document, opened);
    return composeCrumbElement(document, shown.pair.otherName ?? PANEL_WORDS.unknown, opened);
}

function composeCrumbElement(
    document: PanelDocument,
    said: string,
    from: string | null = null,
): PanelElement {
    const crumb = composeElement(document, "div", CLASS.crumb);
    const back = composeElement(document, "span", CLASS.crumbBack);
    back.textContent = `${BACK_MARK}${from ?? PANEL_WORDS.back}`;
    back.setAttribute(BACK_ATTRIBUTE, PANEL_WORDS.back);
    const here = composeElement(document, "span", CLASS.crumbHere);
    here.textContent = said;
    here.setAttribute(TITLE_ATTRIBUTE, here.textContent);
    crumb.append(back);
    crumb.append(here);
    return crumb;
}

function composeSectionElement(
    document: PanelDocument,
    heading: string,
    total: number,
): PanelElement {
    const section = composeElement(document, "div", CLASS.section);
    const words = composeElement(document, "span", CLASS.sectionWords);
    words.textContent = heading;
    const figure = composeElement(document, "span", CLASS.figure);
    figure.textContent = composeFigureText(total);
    section.append(words);
    section.append(figure);
    return section;
}

function composeEmptyElement(document: PanelDocument, words: string): PanelElement {
    const empty = composeElement(document, "div", CLASS.empty);
    empty.textContent = words;
    return empty;
}

function composeWaitingElement(document: PanelDocument, isFightUnread: boolean): PanelElement {
    const list = composeListElement(document, ROWS_WAITING);
    list.className = `${CLASS.list} ${CLASS.listWaiting}`;
    const said = isFightUnread ? PANEL_WORDS.fightUnread : PANEL_WORDS.noFightYet;
    list.append(composeEmptyElement(document, said));
    return list;
}

function composeListElement(document: PanelDocument, visibleRows: number): PanelElement {
    if (!Number.isSafeInteger(visibleRows)) visibleRows = ROWS_WAITING;
    if (visibleRows < 1) visibleRows = ROWS_WAITING;
    const list = composeElement(document, "div", CLASS.list);
    // ⚠️ Not `composeFigureText`, which is what a reader reads: it groups thousands with a
    // no-break space, and `--MargoMeter-rows:1 000` stops the `calc` over it being a length.
    list.setAttribute(STYLE_ATTRIBUTE, `${ROWS_VARIABLE}:${composeIntegerText(visibleRows)}`);
    return list;
}

function composeRankingElement(
    document: PanelDocument,
    shown: ShownScreen,
    register: TipRegister,
    translate: TranslateLabel | null,
): PanelElement {
    const reading = shown.reading;
    const metric = shown.current;
    const place = { readerSide: shown.readerSide, turnHolderId: shown.turnHolderId };
    const list = composeListElement(document, reading.visibleRows);
    if (reading.rows.length === 0) {
        list.append(composeEmptyElement(document, PANEL_WORDS.nothingYet));
        return list;
    }
    const figure = getWordsForMetric(metric);
    for (const [at, row] of reading.rows.entries()) {
        const reader = composeCombatantReading(row, at + 1, metric, place);
        const tip = {
            register,
            key: `row:${row.combatantId}`,
            figure,
            share: PANEL_WORDS.share,
            compose: composePersonCard(
                row,
                {
                    metric,
                    translate,
                    isRowNarrower: false,
                    readerSide: shown.readerSide,
                },
                true,
            ),
        };
        list.append(composeRowElement(document, reader, {
            attribute: ROW_ATTRIBUTE,
            stated: `${row.combatantId}`,
        }, tip));
    }
    return list;
}

/**
 * The size stands before the place and not after it, so the one cell that can be cut is the last
 * one: written the other way round, a long map name pushes the size off the end of the row.
 */
function composeShelfElement(
    document: PanelDocument,
    shown: ShownScreen,
    register: TipRegister,
): PanelElement {
    const list = composeListElement(document, ROWS_SHELF);
    if (shown.shelf.length === 0) {
        list.append(composeEmptyElement(document, PANEL_WORDS.shelfEmpty));
        return list;
    }
    for (const fight of shown.shelf) list.append(composeShelfRow(document, fight, register));
    return list;
}

function composeShelfRow(
    document: PanelDocument,
    fight: ShelfRow,
    register: TipRegister,
): PanelElement {
    const chosen = fight.isChosen ? ` ${CLASS.rowChosen}` : "";
    const row = composeElement(document, "div", `${CLASS.row} ${CLASS.rowDrillable}${chosen}`);
    if (fight.isPinnable) row.append(composePinElement(document, fight));
    const time = composeElement(document, "span", CLASS.rowTime);
    time.textContent = getWordsForShelfTime(fight.at, fight.isLive);
    const size = composeElement(document, "span", CLASS.rowSize);
    size.textContent = composeShelfSizeText(fight.sizes);
    const where = composeElement(document, "span", CLASS.rowName);
    where.textContent = fight.place ?? "";
    const outcome = composeElement(document, "span", CLASS.rowValue);
    outcome.textContent = getWordsForShelfOutcome(fight.outcome, fight.isLive);
    for (const part of [time, size, where, outcome]) row.append(part);
    const parts = [row, time, size, where, outcome];
    register.add(`shelf:${fight.openedAt}`, () => ({
        name: fight.place ?? PANEL_WORDS.unknown,
        subtitle: null,
        groups: [],
    }));
    setRowMarks(parts, TIP_ATTRIBUTE, `shelf:${fight.openedAt}`);
    // A moment would have to be one no kept fight could carry, and there is no such moment.
    setRowMarks(parts, FIGHT_ATTRIBUTE, fight.isLive ? LIVE_FIGHT : `${fight.openedAt}`);
    return row;
}

function composePinElement(document: PanelDocument, fight: ShelfRow): PanelElement {
    const set = fight.isPinned ? ` ${CLASS.rowPinSet}` : "";
    const pin = composeElement(document, "span", `${CLASS.rowPin}${set}`);
    pin.textContent = fight.isPinned ? PIN_MARK : UNPINNED_MARK;
    pin.setAttribute(TITLE_ATTRIBUTE, getWordsForPin(fight.isPinned));
    // The moment and never the word a live row is pressed by: what a pin acts on is a fight the
    // shelf holds, and the one going on now is on the shelf only while it is also kept.
    pin.setAttribute(PIN_ATTRIBUTE, `${fight.openedAt}`);
    return pin;
}

function composeStorageStripElement(document: PanelDocument, shown: ShownScreen): PanelElement {
    const strips = composeElement(document, "div", CLASS.strips);
    const label = composeElement(document, "span", CLASS.stripsLabel);
    label.textContent = PANEL_WORDS.storage;
    strips.append(label);
    for (const choice of STORAGE_CHOICES) {
        const marked = choice === shown.storage ? ` ${CLASS.stripCurrent}` : "";
        const one = composeElement(document, "div", `${CLASS.strip}${marked}`);
        one.textContent = getWordsForStorage(choice);
        one.setAttribute(STORAGE_ATTRIBUTE, choice);
        strips.append(one);
    }
    return strips;
}

function composeOpponentSection(
    document: PanelDocument,
    list: PanelElement,
    drill: DrillReading,
    stated: {
        metric: PanelMetric;
        register: TipRegister;
        figure: string;
        place: CardPlace;
        person: PersonPlace;
    },
): void {
    const cut = drill.byOpponent;
    if (cut.rows.length === 0 && cut.unnamed === null) return;
    const heading = getWordsForOpponentCut(stated.metric);
    list.append(composeSectionElement(document, heading, drill.total));
    const share = PANEL_WORDS.shareOfFigure;
    for (const [at, row] of cut.rows.entries()) {
        const tip = {
            register: stated.register,
            key: `to:${row.combatantId}`,
            ...{
                figure: stated.figure,
                share,
                compose: composePersonCard(row, stated.place, row.doesOpenPair),
            },
        };
        const mark = row.doesOpenPair
            ? { attribute: ROW_ATTRIBUTE, stated: `${row.combatantId}` }
            : null;
        list.append(
            composeRowElement(
                document,
                composeCombatantReading(row, at + 1, stated.metric, stated.person),
                mark,
                tip,
            ),
        );
    }
    if (cut.unnamed === null) return;
    const end = getUnnamedEndForMetric(stated.metric);
    const tip = {
        register: stated.register,
        key: "to:nobody",
        figure: stated.figure,
        share,
        // What the game did not say, and only that: where this figure stands is answered by the
        // heading over it — it is a cut of the one person's figure the level is about.
        notes: [getWordsForUnnamedEnd(end, getNounForMetric(stated.metric))],
    };
    const reading = composeUnnamedReading(cut.unnamed, getWordsForUnnamedRow(end));
    list.append(composeRowElement(document, reading, null, tip));
}

/**
 * Drawn on the one screen the reading fills it for; on the others it is handed an empty cut,
 * and `src/ui/panel-reading.ts` says which screen that is and why.
 */
/**
 * What a part is called where it stands, and a key is worded from the screen's own table: the game
 * states `heal` as a health gain and as a health loss both, and one label over the two would be two
 * quantities under one word.
 */
function getWordsForNamedPart(part: NamedPart | { kind: "plain" }, metric: PanelMetric): string {
    if (part.kind === "skill") return part.name;
    if (part.kind === "plain") return getWordsForUnannounced(metric);
    const named = part.kind === "source" ? part.source : part.element;
    return getNounForMetric(metric) === "damage"
        ? getWordsForDamageKind(named)
        : getWordsForHealthSource(named);
}

/** The mark a part row wears, and null where the level under it holds nothing. */
function getMarkForNamedPart(part: NamedPart, doesOpen: boolean): RowMark | null {
    if (!doesOpen) return null;
    if (part.kind === "skill") return { attribute: SKILL_ATTRIBUTE, stated: part.name };
    if (part.kind === "source") return { attribute: SOURCE_ATTRIBUTE, stated: part.source };
    return { attribute: KIND_ATTRIBUTE, stated: part.element };
}

/**
 * One key per part and per section, so a tip is never the one a row beside it registered. Every
 * caller names its own section here rather than spelling a key of its own: a second spelling
 * lands on somebody else's key silently — the register refuses a duplicate, and the row wears the
 * card of whichever section was drawn first.
 */
function getKeyForNamedPart(where: string, part: NamedPart | { kind: "plain" }): string {
    if (part.kind === "skill") return `${where}-skill:${part.name}`;
    if (part.kind === "plain") return `${where}-skill:plain`;
    if (part.kind === "element") return `${where}-kind:${part.element}`;
    return `${where}-source:${part.source}`;
}

function composeSkillSection(
    document: PanelDocument,
    list: PanelElement,
    drill: DrillReading,
    stated: { metric: PanelMetric; register: TipRegister; figure: string },
): void {
    const cut = drill.bySkill;
    if (cut.rows.length === 0 && cut.plain === null) return;
    list.append(composeSectionElement(document, PANEL_WORDS.skills, drill.total));
    const share = PANEL_WORDS.shareOfFigure;
    for (const [at, row] of cut.rows.entries()) {
        const tip = {
            register: stated.register,
            key: getKeyForNamedPart("skill", row.part),
            figure: stated.figure,
            share,
        };
        const reading = composeSkillRowReading(row, stated.metric, at + 1);
        const mark = getMarkForNamedPart(row.part, row.doesOpenPart);
        list.append(composeRowElement(document, reading, mark, tip));
    }
    composeRestRow(document, list, cut.rest, {
        register: stated.register,
        figure: stated.figure,
        key: "skill:rest",
    });
    if (cut.plain === null) return;
    const tip = { register: stated.register, key: "skill:plain", figure: stated.figure, share };
    const reading = {
        ...composeUnnamedReading(cut.plain, getWordsForUnannounced(stated.metric)),
        uses: cut.plain.blows,
    };
    list.append(composeRowElement(document, reading, null, tip));
}

/**
 * What a section could not give a row to, summed into one — above the row that closes the section
 * and never inside it. The two are different claims: this is what the game **did** name, and the
 * one below it is what it named nothing for. **ADR 0055.**
 *
 * It opens nothing: a sum of parts nobody can list is a level of no figure.
 */
function composeRestRow(
    document: PanelDocument,
    list: PanelElement,
    rest: PlainRow | UnnamedRow | null,
    stated: { register: TipRegister; figure: string; key: string },
): void {
    if (rest === null) return;
    const tip = {
        register: stated.register,
        key: stated.key,
        figure: stated.figure,
        share: PANEL_WORDS.shareOfFigure,
        notes: [PANEL_WORDS.restNote],
    };
    const reading = composeUnnamedReading(rest, PANEL_WORDS.restOfKinds);
    list.append(composeRowElement(document, reading, null, tip));
}

/** How many rows a cut by key costs a level: its keys, and each row that closes it. */
function getElementCutRows(cut: ElementCut): number {
    return cut.rows.length + (cut.rest === null ? 0 : 1) + (cut.unnamed === null ? 0 : 1);
}

function composeSkillRowReading(row: SkillRow, metric: PanelMetric, rank: number): RowReading {
    const name = getWordsForNamedPart(row.part, metric);
    return {
        name,
        figure: row.figure,
        fill: row.fill,
        shareText: row.shareText,
        colour: getColourForProfession(null),
        profession: null,
        rank,
        uses: row.uses,
    };
}

/** The cut and its figure rather than a reading holding them: two levels draw this section. */
function composeElementSection(
    document: PanelDocument,
    list: PanelElement,
    cut: ElementCut,
    stated: { metric: PanelMetric; register: TipRegister; figure: string; total: number },
): void {
    if (getElementCutRows(cut) === 0) return;
    list.append(composeSectionElement(document, getWordsForKindCut(stated.metric), stated.total));
    const noun = getNounForMetric(stated.metric);
    const share = PANEL_WORDS.shareOfFigure;
    for (const [at, row] of cut.rows.entries()) {
        const tip = {
            register: stated.register,
            key: `kind:${row.element}`,
            figure: stated.figure,
            share,
        };
        const part = { kind: "element" as const, element: row.element };
        list.append(
            composeRowElement(
                document,
                composeElementReading(row, noun, at + 1),
                getMarkForNamedPart(part, row.doesOpenPart),
                tip,
            ),
        );
    }
    composeRestRow(document, list, cut.rest, {
        register: stated.register,
        figure: stated.figure,
        key: "kind:rest",
    });
    if (cut.unnamed === null) return;
    const tip = { register: stated.register, key: "kind:nobody", figure: stated.figure, share };
    const reading = composeUnnamedReading(cut.unnamed, PANEL_WORDS.withoutKind);
    list.append(composeRowElement(document, reading, null, tip));
}

/**
 * A breakdown reached from a list of eleven must not shorten the window under the hand that
 * pressed it, and one longer than eleven must not be cut off in the middle of a section — the
 * ceiling on the host is what stops either from reaching past the bottom of the screen.
 */
function getRowsForDrill(drill: DrillReading, floor: number): number {
    const opponents = drill.byOpponent;
    let needed = 0;
    if (opponents.rows.length > 0 || opponents.unnamed !== null) {
        // A section costs its rows, the part named for nobody, and the heading standing over them.
        needed += opponents.rows.length + (opponents.unnamed === null ? 0 : 1) + 1;
    }
    if (getElementCutRows(drill.byElement) > 0) needed += getElementCutRows(drill.byElement) + 1;
    if (drill.bySkill.rows.length > 0 || drill.bySkill.plain !== null) {
        // Three rows can close this one: what the bound would not draw, what no announcement
        // covered, and the heading over the lot.
        needed += drill.bySkill.rows.length + (drill.bySkill.rest === null ? 0 : 1) +
            (drill.bySkill.plain === null ? 0 : 1) + 1;
    }
    return Math.max(needed, floor);
}

/**
 * Neither cut is opened any further, and a cut with nothing in it draws no heading: a blow the
 * protocol tied to nobody still states what it was dealt with, so the kinds can stand alone.
 */
function composeDrillElement(
    document: PanelDocument,
    shown: ShownScreen,
    drill: DrillReading,
    register: TipRegister,
    translate: TranslateLabel | null,
): PanelElement {
    const list = composeListElement(document, getRowsForDrill(drill, shown.reading.visibleRows));
    const figure = getWordsForMetric(shown.current);
    const place: CardPlace = {
        metric: shown.current,
        translate,
        isRowNarrower: true,
        readerSide: shown.readerSide,
    };
    composeOpponentSection(document, list, drill, {
        metric: shown.current,
        register,
        figure,
        place,
        person: composeCutPlace(shown),
    });
    composeSkillSection(document, list, drill, { metric: shown.current, register, figure });
    composeElementSection(document, list, drill.byElement, {
        metric: shown.current,
        register,
        figure,
        total: drill.total,
    });
    if (drill.total === 0) {
        list.append(composeEmptyElement(document, getWordsForNothing(shown.current)));
    }
    return list;
}

function composeSidesPart(
    document: PanelDocument,
    share: number,
    className: string,
): PanelElement | null {
    if (share <= 0) return null;
    const part = composeElement(document, "span", className);
    const width = composeDecimalText(Math.min(share, 1) * AS_PERCENT, FILL_PLACES);
    // The length is data and the colour is not: the segment paints itself in its own ink.
    part.setAttribute(STYLE_ATTRIBUTE, `width:${width}%`);
    return part;
}

function composeSidesElement(document: PanelDocument, shown: ShownScreen): PanelElement {
    const sides = shown.reading.sides;
    // Two sides nothing can tell apart are not two figures, and a strip of them says nothing:
    // `setPanelBody` asks the same question, and this answers it rather than trusting it.
    if (sides === null) return composeSlotElement(document);
    const block = composeElement(document, "div", CLASS.sides);
    const line = composeElement(document, "div", CLASS.sidesLine);
    const ours = composeElement(document, "span", `${CLASS.sidesOurs} ${CLASS.figure}`);
    ours.textContent = composeFigureText(sides.ours);
    const label = composeElement(document, "span", CLASS.sidesLabel);
    label.textContent = composeSidesLabel(shown);
    const theirs = composeElement(document, "span", `${CLASS.sidesTheirs} ${CLASS.figure}`);
    theirs.textContent = composeFigureText(sides.theirs);
    line.append(ours);
    line.append(label);
    line.append(theirs);
    block.append(line);
    composeSidesTrack(document, block, sides);
    if (sides.nobody > 0) block.append(composeSidesSpare(document, sides.nobody));
    return block;
}

function composeSidesTrack(
    document: PanelDocument,
    block: PanelElement,
    sides: PanelSides,
): void {
    const whole = sides.ours + sides.theirs + sides.nobody;
    if (whole <= 0) return;
    const track = composeElement(document, "div", CLASS.sidesTrack);
    const parts: Array<[number, string]> = [
        [sides.ours / whole, CLASS.sidesOurs],
        [sides.theirs / whole, CLASS.sidesTheirs],
        [sides.nobody / whole, CLASS.sidesNobody],
    ];
    for (const [share, className] of parts) {
        const part = composeSidesPart(document, share, className);
        if (part !== null) track.append(part);
    }
    block.append(track);
}

function composeSidesSpare(document: PanelDocument, figure: number): PanelElement {
    const spare = composeElement(
        document,
        "div",
        `${CLASS.sidesLine} ${CLASS.sidesSpare} ${CLASS.sidesNobody}`,
    );
    const label = composeElement(document, "span", CLASS.sidesLabel);
    label.textContent = PANEL_WORDS.withoutSide;
    const stated = composeElement(document, "span", CLASS.figure);
    stated.textContent = composeFigureText(figure);
    spare.append(label);
    spare.append(stated);
    return spare;
}

/**
 * The strip totals the whole fight whatever the list under it is showing, so the label says so
 * wherever the two differ — a narrowed side, or any level standing over the list.
 */
function composeSidesLabel(shown: ShownScreen): string {
    const sides = `${PANEL_WORDS.ourSide} / ${PANEL_WORDS.theirSide}`;
    if (shown.side === "everyone") {
        if (!getIsLevelOpen(shown)) return sides;
    }
    return `${PANEL_WORDS.wholeFight} · ${sides}`;
}

/**
 * Whether a level stands over the screen's own list. Three fields and not five: a pair and a part
 * are reached through an opened row, so neither stands without `drill`. Asked in two places, and
 * spelled here once — the second spelling of it read `drill` alone and left the label over a
 * pinned row's level saying the strip and the list were the same thing.
 */
function getIsLevelOpen(shown: ShownScreen): boolean {
    if (shown.drill !== null) return true;
    if (shown.halfNamed !== null) return true;
    return shown.halfNamedDrill !== null;
}

function composeRegion(
    document: PanelDocument,
    region: PanelRegion,
    compose: () => PanelElement,
    handleFailure: HandlePanelFailure,
): PanelElement {
    try {
        return compose();
    } catch (failure) {
        handleFailure({ kind: "region", region, failure });
        const undrawn = composeElement(document, "div", CLASS.undrawn);
        undrawn.textContent = composeUndrawnText(region);
        return undrawn;
    }
}

/** A panel with no screen to draw, and which of the two reasons it has for standing there. */
export interface WaitingReading {
    defects: readonly string[];
    /** A fight may be recorded and still not draw: a reading that would not compose leaves one. */
    hasFightToSave: boolean;
    /** A fight arrived and could not be turned into a screen. Never "there has been no fight". */
    isFightUnread: boolean;
}

export interface ShownScreen {
    reading: PanelReading;
    /**
     * Which list this is — the place a reader stands in, named by `composeListName` in
     * `src/ui/panel-screen.ts`, which owns that fact. It decides nothing that is drawn: it says
     * whose position the region is put back to. **ADR 0050.**
     */
    listName: string;
    current: PanelMetric;
    side: PanelSideChoice;
    /**
     * Which side the client marks as the reader's own, and null where it named none. It answers
     * two questions at once: whether the strips that narrow to a side are offered at all, and
     * which side each person's row stands on — `CONTEXT.md`, *Reader's side*.
     */
    readerSide: number | null;
    /**
     * Whose turn the game is numbering, or null — a fight already over numbers nobody's, and a
     * fight read from the shelf is somebody else's moment. The entry decides; this layer draws.
     */
    turnHolderId: number | null;
    shelf: readonly ShelfRow[];
    storage: PanelStorageChoice;
    /** Whether the bar draws its save. False leaves no control rather than a dead one. */
    hasFightToSave: boolean;
    shelfAnswers: readonly string[];
    /**
     * What the panel could not do, said once per kind — `src/ui/panel-defect.ts` owns the tally.
     * Read off the keeper before a draw begins, so a defect this draw records is said at the next
     * one and nothing a defect does can ask for a redraw.
     */
    defects: readonly string[];
    isOnShelf: boolean;
    drill: DrillReading | null;
    pair: PairReading | null;
    part: PartReading | null;
    /** What stands under a pinned row, where a reader has opened one. Never open beside `drill`. */
    halfNamed: HalfNamedReading | null;
    halfNamedDrill: HalfNamedDrillReading | null;
    place: string | null;
    isCollapsed: boolean;
}

export type PanelPress =
    | { kind: "screen"; screen: string }
    | { kind: "side"; side: string }
    | { kind: "row"; stated: string }
    | { kind: "unnamed"; end: PanelUnnamedEnd }
    | { kind: "part"; part: NamedPart }
    | { kind: "fight"; stated: string }
    | { kind: "pin"; stated: string }
    | { kind: "storage"; name: string }
    | { kind: "back" }
    | { kind: "fold" }
    | { kind: "save" }
    | { kind: "shelf" }
    | { kind: "standing"; stated: string }
    | { kind: "standing-fold" };

function composeShownList(
    document: PanelDocument,
    shown: ShownScreen,
    register: TipRegister,
    translate: TranslateLabel | null,
): PanelElement {
    if (shown.isOnShelf) return composeShelfElement(document, shown, register);
    if (shown.part !== null) {
        return composePartElement(document, shown, shown.part, register, translate);
    }
    if (shown.pair !== null) return composePairElement(document, shown, shown.pair, register);
    if (shown.halfNamedDrill !== null) {
        return composeHalfNamedDrillElement(document, shown, shown.halfNamedDrill, register);
    }
    if (shown.halfNamed !== null) {
        return composeHalfNamedElement(document, shown, shown.halfNamed, register, translate);
    }
    if (shown.drill !== null) {
        return composeDrillElement(document, shown, shown.drill, register, translate);
    }
    return composeRankingElement(document, shown, register, translate);
}

/**
 * What stands under one row of that level: a person's own keys, or a key's own people. The two are
 * one fold read both ways round, so this is one function with one branch rather than two levels.
 *
 * Nothing here opens. It is the third level, and the panel goes no deeper.
 */
function composeHalfNamedDrillElement(
    document: PanelDocument,
    shown: ShownScreen,
    drill: HalfNamedDrillReading,
    register: TipRegister,
): PanelElement {
    const figure = getWordsForMetric(shown.current);
    if (drill.opened === "element") {
        const rows = drill.rows.length + (drill.neither === null ? 0 : 1);
        const list = composeListElement(document, Math.max(rows + 1, shown.reading.visibleRows));
        const heading = getWordsForHalfNamedCut(drill.end);
        list.append(composeSectionElement(document, heading, drill.total));
        composeHalfNamedRows(document, list, shown, {
            rows: drill.rows,
            neither: drill.neither,
            doesOpen: false,
            register,
            translate: null,
        });
        return list;
    }
    const kinds = getElementCutRows(drill.kinds);
    const list = composeListElement(document, Math.max(kinds + 1, shown.reading.visibleRows));
    composeElementSection(document, list, drill.kinds, {
        metric: shown.current,
        register,
        figure,
        total: drill.total,
    });
    return list;
}

/** What the way back calls the row that is open, which is the row itself and not its level. */
function getWordsForHalfNamedDrill(drill: HalfNamedDrillReading, metric: PanelMetric): string {
    if (drill.opened === "person") return drill.row.name ?? PANEL_WORDS.unknown;
    return getNounForMetric(metric) === "damage"
        ? getWordsForDamageKind(drill.element)
        : getWordsForHealthSource(drill.element);
}

/**
 * What stands under a pinned row: **the end the game did name**, person by person, and never a
 * guess at the one it left out. Which end that is turns on the row rather than on the screen — a
 * figure with no actor was still taken by somebody, one with no target was still struck by
 * somebody — so `Otrzymane` heads its two rows differently. **ADR 0038.**
 *
 * Nothing on this level opens: a pair between somebody and nobody is not a pair.
 */
function composeHalfNamedElement(
    document: PanelDocument,
    shown: ShownScreen,
    halfNamed: HalfNamedReading,
    register: TipRegister,
    translate: TranslateLabel | null,
): PanelElement {
    const named = halfNamed.rows.length + (halfNamed.neither === null ? 0 : 1);
    const kinds = getElementCutRows(halfNamed.kinds);
    const needed = named + 1 + (kinds === 0 ? 0 : kinds + 1);
    const list = composeListElement(document, Math.max(needed, shown.reading.visibleRows));
    const heading = getWordsForHalfNamedCut(halfNamed.end);
    list.append(composeSectionElement(document, heading, halfNamed.total));
    composeHalfNamedRows(document, list, shown, {
        rows: halfNamed.rows,
        neither: halfNamed.neither,
        doesOpen: true,
        register,
        translate,
    });
    composeElementSection(document, list, halfNamed.kinds, {
        metric: shown.current,
        register,
        figure: getWordsForMetric(shown.current),
        total: halfNamed.total,
    });
    return list;
}

/** The end the game did name, as the heading that names it: whom it reached, or who did it. */
function getWordsForHalfNamedCut(end: PanelUnnamedEnd): string {
    return end === "actor" ? PANEL_WORDS.dealtTo : PANEL_WORDS.takenFrom;
}

function composeHalfNamedRows(
    document: PanelDocument,
    list: PanelElement,
    shown: ShownScreen,
    stated: {
        rows: readonly HalfNamedRow[];
        neither: UnnamedRow | null;
        /** False on the third level: what stands under a person there is nobody, and nothing. */
        doesOpen: boolean;
        register: TipRegister;
        translate: TranslateLabel | null;
    },
): void {
    const { rows, neither, doesOpen, register, translate } = stated;
    const figure = getWordsForMetric(shown.current);
    const share = PANEL_WORDS.shareOfFigure;
    // The card is the fight's four figures, as it is wherever a person's row stands, and this row
    // states a cut of them — so it owes the sentence saying so (**ADR 0032**).
    const place: CardPlace = {
        metric: shown.current,
        translate,
        isRowNarrower: true,
        readerSide: shown.readerSide,
    };
    for (const [at, row] of rows.entries()) {
        const tip = {
            register,
            key: `named:${row.combatantId}`,
            figure,
            share,
            compose: composePersonCard(row, place, doesOpen),
        };
        const reading = composeCombatantReading(row, at + 1, shown.current, composeCutPlace(shown));
        const mark = doesOpen ? { attribute: ROW_ATTRIBUTE, stated: `${row.combatantId}` } : null;
        list.append(composeRowElement(document, reading, mark, tip));
    }
    if (neither === null) return;
    const tip = {
        register,
        key: "named:nobody",
        figure,
        share,
        notes: [NEITHER_END_WORDS.note],
    };
    const reading = composeUnnamedReading(neither, NEITHER_END_WORDS.label);
    list.append(composeRowElement(document, reading, null, tip));
}

/**
 * Whom one part of an opened figure reached. The heading is the direction's, so a level opened on
 * a screen about what reached the reader is headed by whom it came from.
 */
function composePartElement(
    document: PanelDocument,
    shown: ShownScreen,
    part: PartReading,
    register: TipRegister,
    translate: TranslateLabel | null,
): PanelElement {
    const rows = part.byOpponent.rows.length + (part.byOpponent.unnamed === null ? 0 : 1);
    const list = composeListElement(document, Math.max(rows + 1, shown.reading.visibleRows));
    const figure = getWordsForMetric(shown.current);
    const heading = getWordsForOpponentCut(shown.current);
    list.append(composeSectionElement(document, heading, part.total));
    const share = PANEL_WORDS.shareOfFigure;
    // Nothing on this rung opens, so no card here promises a gesture (`docs/drill-levels.md`).
    const place: CardPlace = {
        metric: shown.current,
        translate,
        isRowNarrower: true,
        readerSide: shown.readerSide,
    };
    for (const [at, row] of part.byOpponent.rows.entries()) {
        const tip = {
            register,
            key: `reached:${row.combatantId}`,
            figure,
            share,
            compose: composePersonCard(row, place, false),
        };
        list.append(
            composeRowElement(
                document,
                composeCombatantReading(row, at + 1, shown.current, composeCutPlace(shown)),
                null,
                tip,
            ),
        );
    }
    if (part.byOpponent.unnamed === null) return list;
    // The end the protocol left out of a blow this part carried: it is inside the figure over the
    // level, so the column comes to a hundred with it and falls short without it.
    const end = getUnnamedEndForMetric(shown.current);
    const tip = {
        register,
        key: "reached:nobody",
        figure,
        share,
        notes: [getWordsForUnnamedEnd(end, getNounForMetric(shown.current))],
    };
    const reading = composeUnnamedReading(part.byOpponent.unnamed, getWordsForUnnamedRow(end));
    list.append(composeRowElement(document, reading, null, tip));
    return list;
}

function composePairElement(
    document: PanelDocument,
    shown: ShownScreen,
    pair: PairReading,
    register: TipRegister,
): PanelElement {
    const list = composeListElement(document, getRowsForPair(pair, shown.reading.visibleRows));
    const figure = getWordsForMetric(shown.current);
    const share = PANEL_WORDS.shareOfFigure;
    composePairParts(document, list, pair, { metric: shown.current, register, figure, share });
    composePairKinds(document, list, pair, { register, figure, share });
    return list;
}

function composePairParts(
    document: PanelDocument,
    list: PanelElement,
    pair: PairReading,
    stated: { metric: PanelMetric; register: TipRegister; figure: string; share: string },
): void {
    if (pair.parts.length === 0) return;
    list.append(composeSectionElement(document, PANEL_WORDS.skills, pair.total));
    for (const [at, row] of pair.parts.entries()) {
        const tip = { ...stated, key: getKeyForNamedPart("pair", row.part) };
        const reading = {
            name: getWordsForNamedPart(row.part, stated.metric),
            figure: row.figure,
            fill: row.fill,
            shareText: row.shareText,
            colour: getColourForProfession(null),
            profession: null,
            rank: at + 1,
        };
        list.append(composeRowElement(document, reading, null, tip));
    }
}

function composePairKinds(
    document: PanelDocument,
    list: PanelElement,
    pair: PairReading,
    stated: { register: TipRegister; figure: string; share: string },
): void {
    const cut = pair.byElement;
    if (cut.rows.length === 0) return;
    list.append(composeSectionElement(document, PANEL_WORDS.damageKind, pair.total));
    for (const [at, row] of cut.rows.entries()) {
        const part = { kind: "element" as const, element: row.element };
        const tip = { ...stated, key: getKeyForNamedPart("pair-kinds", part) };
        list.append(
            composeRowElement(document, composeElementReading(row, "damage", at + 1), null, tip),
        );
    }
}

function getRowsForPair(pair: PairReading, floor: number): number {
    const parts = pair.parts.length;
    const kinds = pair.byElement.rows.length;
    const needed = (parts === 0 ? 0 : parts + 1) + (kinds === 0 ? 0 : kinds + 1);
    return Math.max(needed, floor);
}

/**
 * What a pinned row says on demand: what the game did not state, where the figure stands against
 * the ranking, and — only where a side is showing — what the shown team is to it.
 *
 * The third is asked only then because under `Wszyscy` there is no scope to state. Every one of
 * them is `src/ui/panel-words.ts`', keyed by the case rather than by the screen: the same screen
 * pins two ends whose answers differ.
 */
function composePinnedNotes(row: PinnedRow, metric: PanelMetric, isSideChosen: boolean): string[] {
    const notes = [
        getWordsForUnnamedEnd(row.end, getNounForMetric(metric)),
        getWordsForPinnedStanding(row.case),
    ];
    if (isSideChosen) notes.push(getWordsForPinnedScope(row.case));
    return notes;
}

/**
 * What a pinned figure was dealt with, stated on the card before anybody presses the row: the same
 * rows the level under it draws, in the same order, worded by the same table. **ADR 0041.**
 *
 * What will not fit is summed rather than dropped, so the run always comes to the figure over it.
 */
function composePinnedCutParts(row: PinnedRow, metric: PanelMetric): RowTipCut {
    // Every key is written where the figure is, so a pinned figure's kinds come to the whole of
    // it and this run needs no row for a shortfall (`src/core/fight-statistics.ts`, **ADR 0039**).
    const parts: Array<{ label: string; stated: string }> = [];
    let rest = 0;
    for (const [at, one] of row.kinds.rows.entries()) {
        if (at < MAXIMUM_TIP_CUT_PARTS) {
            parts.push({
                label: getWordsForNamedPart({ kind: "element", element: one.element }, metric),
                stated: `${composeFigureText(one.figure)} (${one.shareText})`,
            });
            continue;
        }
        rest += one.figure;
    }
    if (rest > 0) parts.push({ label: PANEL_WORDS.restOfKinds, stated: composeFigureText(rest) });
    return { heading: getWordsForKindCut(metric), parts };
}

function composePinnedElement(
    document: PanelDocument,
    row: PinnedRow,
    register: TipRegister,
    stated: { metric: PanelMetric; isSideChosen: boolean; figure: string },
): PanelElement {
    const block = composeElement(document, "div", CLASS.pinned);
    const tip = {
        register,
        key: `pinned:${row.end}`,
        figure: stated.figure,
        share: PANEL_WORDS.share,
        notes: composePinnedNotes(row, stated.metric, stated.isSideChosen),
        cut: composePinnedCutParts(row, stated.metric),
    };
    const reading = composeUnnamedReading(row, getWordsForUnnamedRow(row.end));
    const mark = { attribute: UNNAMED_ATTRIBUTE, stated: row.end };
    block.append(composeRowElement(document, reading, mark, tip));
    return block;
}

function getPressFromTarget(target: PanelTarget): PanelPress | null {
    if (typeof target.getAttribute !== "function") return null;
    const screen = target.getAttribute(SCREEN_ATTRIBUTE);
    if (screen !== null) return { kind: "screen", screen };
    const side = target.getAttribute(SIDE_ATTRIBUTE);
    if (side !== null) return { kind: "side", side };
    const stated = target.getAttribute(ROW_ATTRIBUTE);
    if (stated !== null) return { kind: "row", stated };
    const unnamed = target.getAttribute(UNNAMED_ATTRIBUTE);
    if (unnamed !== null) {
        // The attribute is written by this file and read by it, so a value outside the two is a
        // stray mark rather than a press: it opens nothing rather than opening the first end.
        if (unnamed === "actor") return { kind: "unnamed", end: "actor" };
        if (unnamed === "target") return { kind: "unnamed", end: "target" };
        return null;
    }
    const name = target.getAttribute(SKILL_ATTRIBUTE);
    if (name !== null) return { kind: "part", part: { kind: "skill", name } };
    const source = target.getAttribute(SOURCE_ATTRIBUTE);
    if (source !== null) return { kind: "part", part: { kind: "source", source } };
    const element = target.getAttribute(KIND_ATTRIBUTE);
    if (element !== null) return { kind: "part", part: { kind: "element", element } };
    const fight = target.getAttribute(FIGHT_ATTRIBUTE);
    if (fight !== null) return { kind: "fight", stated: fight };
    const pinned = target.getAttribute(PIN_ATTRIBUTE);
    if (pinned !== null) return { kind: "pin", stated: pinned };
    const storage = target.getAttribute(STORAGE_ATTRIBUTE);
    if (storage !== null) return { kind: "storage", name: storage };
    const standing = target.getAttribute(STANDING_ATTRIBUTE);
    if (standing !== null) return { kind: "standing", stated: standing };
    if (target.getAttribute(STANDING_FOLD_ATTRIBUTE) !== null) return { kind: "standing-fold" };
    if (target.getAttribute(SAVE_ATTRIBUTE) !== null) return { kind: "save" };
    if (target.getAttribute(SHELF_ATTRIBUTE) !== null) return { kind: "shelf" };
    if (target.getAttribute(FOLD_ATTRIBUTE) !== null) return { kind: "fold" };
    if (target.getAttribute(BACK_ATTRIBUTE) !== null) return { kind: "back" };
    return null;
}

/**
 * The four listeners, all of them at the root and none of them on a row. Two windows sit under
 * that root — **ADR 0060** — so the second is handed in, to be asked which holds a press.
 *
 * The press and never the click: a browser assembles a click out of two moments and dispatches it
 * only if both resolve to a node still in the tree, so a payload landing between the press and
 * the release would detach what was pressed and dispatch nothing at all.
 */
function setPanelRootListeners(
    root: PanelRoot,
    handlePress: (press: PanelPress) => void,
    handleHover: (key: string | null, clientY: number) => void,
    handleFailure: (failure: unknown) => void,
    standing: PanelElement,
): void {
    setGuardedListener(root, PRESS_EVENT, (event) => {
        // The primary button alone: without this a right press would open a row and the listener
        // below would step straight back out of it, which is worse than either half.
        if ((event.button ?? PRIMARY_BUTTON) !== PRIMARY_BUTTON) return;
        const target = event.target;
        if (target === null) return;
        const press = getPressFromTarget(target);
        if (press !== null) handlePress(press);
    }, handleFailure);
    // One gesture in, one gesture out, and the way out works from anywhere on the panel: a back
    // control alone would make the cheapest gesture the one that needs aiming. The window beside
    // the panel is not the panel, and a press landing in it moves nothing — **ADR 0071**. The
    // menu is stopped either way: the panel suppresses it under the whole root.
    setGuardedListener(root, BACK_EVENT, (event) => {
        event.preventDefault?.();
        // A press stating no target is nobody's window, and keeps the panel's meaning.
        if (standing.contains(event.target)) return;
        handlePress({ kind: "back" });
    }, handleFailure);
    setGuardedListener(root, MOVE_EVENT, (event) => {
        const target = event.target;
        handleHover(target === null ? null : target.getAttribute(TIP_ATTRIBUTE), event.clientY);
    }, handleFailure);
    setGuardedListener(root, LEAVE_EVENT, (event) => {
        const went = event.relatedTarget ?? null;
        handleHover(went === null ? null : went.getAttribute(TIP_ATTRIBUTE), event.clientY);
    }, handleFailure);
}

export interface PanelHandle {
    element: PanelElement;
    show(shown: ShownScreen): void;
    /**
     * With no draw at all before the first payload, an add-on waiting for a fight and one that
     * died on the way to the page are the same picture.
     */
    showWaiting(isCollapsed: boolean, waiting: WaitingReading): void;
    /**
     * The window beside the panel, drawn on the same call. Null is a fight with nothing standing
     * and no turn stated, which is a reading and not a failure.
     */
    showStanding(reading: StandingReading | null, isCollapsed: boolean): void;
}

function composeRegionInPlace(
    document: PanelDocument,
    standing: PanelElement,
    region: PanelRegion,
    compose: () => PanelElement,
    handleFailure: HandlePanelFailure,
): PanelElement {
    const next = composeRegion(document, region, compose, handleFailure);
    standing.replaceWith(next);
    return next;
}

/**
 * The card, which cannot degrade as a region does. A region's fallback is a sentence standing
 * where it was; the card is a child of the root and the only thing the sheet places, so that
 * sentence would be a block under the panel — under a defect naming the list, which was fine.
 * A card that will not compose is no card: the one standing hides (**E14**).
 */
function composeTipInPlace(
    standing: PanelElement,
    compose: () => PanelElement,
    handleFailure: HandlePanelFailure,
): PanelElement {
    try {
        const next = compose();
        standing.replaceWith(next);
        return next;
    } catch (failure) {
        handleFailure({ kind: "region", region: "tip", failure });
        setTipHidden(standing, true);
        return standing;
    }
}

interface PanelRegions {
    title: PanelElement;
    header: PanelElement;
    nouns: PanelElement;
    directions: PanelElement;
    crumb: PanelElement;
    storage: PanelElement;
    list: PanelElement;
    pinnedActor: PanelElement;
    pinnedTarget: PanelElement;
    sides: PanelElement;
    suspicions: PanelElement;
    defects: PanelElement;
}

function composePanelRegions(document: PanelDocument): PanelRegions {
    const regions = {
        title: composeElement(document, "div", CLASS.title),
        header: composeSlotElement(document),
        nouns: composeSlotElement(document),
        directions: composeSlotElement(document),
        crumb: composeSlotElement(document),
        storage: composeSlotElement(document),
        list: composeSlotElement(document),
        pinnedActor: composeSlotElement(document),
        pinnedTarget: composeSlotElement(document),
        sides: composeSlotElement(document),
        suspicions: composeSlotElement(document),
        defects: composeSlotElement(document),
    };
    return regions;
}

/**
 * The host is built once and stays. Only the regions inside it are replaced, so the listener at
 * the root outlives every redraw and a press during one is not swallowed.
 */
/**
 * The host, and the root everything else goes into. The sheet is put in once and never replaced:
 * a region redrawn under it keeps its look, and a browser re-parses nothing on a redraw.
 */
function composePanelShadow(document: PanelDocument): { host: PanelElement; root: PanelRoot } {
    const host = document.createElement("div");
    host.setAttribute("id", HOST_NAME);
    host.setAttribute(VERSION_ATTRIBUTE, BUILD_VERSION);
    const root = host.attachShadow({ mode: "open" });
    const sheet = document.createElement("style");
    sheet.textContent = composeStyleSheet();
    root.append(sheet);
    return { host, root };
}

/** Every region in the order it is drawn in, inside the frame the fold collapses. */
function composePanelFrame(document: PanelDocument, regions: PanelRegions): PanelElement {
    const frame = composeElement(document, "div", CLASS.frame);
    const panel = composeElement(document, "div", CLASS.panel);
    for (const region of [regions.header, regions.nouns, regions.directions, regions.crumb]) {
        panel.append(region);
    }
    panel.append(regions.storage);
    for (const region of [regions.list, regions.pinnedActor, regions.pinnedTarget]) {
        panel.append(region);
    }
    panel.append(regions.sides);
    panel.append(regions.suspicions);
    panel.append(regions.defects);
    frame.append(panel);
    return frame;
}

/**
 * Where the card may stand, and how much of the window it has to stand in — both asked of the
 * panel as it is now rather than as it was when the tip was wired, because a drag moves one and a
 * window resize moves the other. A panel never made movable is handed neither, which is every
 * panel a test draws and no page a reader is on.
 */
function composeTipPlace(
    placement: PanelPlacement | null,
    getPosition: () => PanelPosition | null,
): { getLeft: () => number | null; getRoom: () => number | null } {
    return {
        getLeft: () => composeTipLeft(getPosition(), placement?.getViewport() ?? null, TIP_WIDTH),
        getRoom: () => getTipRoom(placement?.getViewport()?.height ?? null),
    };
}

/**
 * The window beside the panel, as one element under the same root — `SECURITY.md`'s guest rule
 * puts everything a reader meets inside one shadow root under one name, so a second host is out.
 */
function composeStandingWindow(
    document: PanelDocument,
): { element: PanelElement; bar: PanelElement; body: PanelElement } {
    const element = composeElement(document, "div", CLASS.standing);
    const bar = composeStandingBar(document, false);
    const body = composeSlotElement(document);
    element.append(bar);
    element.append(body);
    return { element, bar, body };
}

/**
 * The window's own four listeners, on the same root and answering to its own grip. Without a name
 * on the mark both sets start on either bar: the panel moves by the wrong one and writes its
 * stored place doing it.
 */
function setStandingDrag(
    root: PanelRoot,
    element: PanelElement,
    getBar: () => PanelElement,
    placement: PanelPlacement | null,
    handleGesture: (failure: unknown) => void,
): PanelDragHandle | null {
    if (placement === null) return null;
    return setPanelDrag(root, element, getBar, placement, handleGesture, STANDING_WINDOW);
}

function setStandingBarDrawn(
    document: PanelDocument,
    standing: PanelElement,
    isCollapsed: boolean,
    redraw: PanelRedraw,
): PanelElement {
    return redraw(standing, "standing", () => composeStandingBar(document, isCollapsed));
}

/**
 * Folded, the body is composed empty rather than composed and hidden — a fight redraws every few
 * seconds, and what is not drawn costs nothing to draw.
 */
function setStandingBodyDrawn(
    document: PanelDocument,
    standing: PanelElement,
    reading: StandingReading | null,
    isCollapsed: boolean,
    redraw: PanelRedraw,
): PanelElement {
    if (reading === null) return redraw(standing, "standing", () => composeSlotElement(document));
    if (isCollapsed) return redraw(standing, "standing", () => composeSlotElement(document));
    return redraw(standing, "standing", () => composeStandingBody(document, reading));
}

/** The bar, the frame, the card and the window beside it — in the order they are drawn over. */
function setPanelRootChildren(root: PanelRoot, children: readonly PanelElement[]): void {
    for (const child of children) root.append(child);
}

/** The card, placed against wherever the panel is **now** rather than where it was wired. */
function composeTipBeside(
    document: PanelDocument,
    register: TipRegister,
    placement: PanelPlacement | null,
    handleFailure: HandlePanelFailure,
    getDrag: () => PanelDragHandle | null,
): TipHandle {
    const place = composeTipPlace(placement, () => getDrag()?.getPosition() ?? null);
    return composeTipHandle(
        document,
        register,
        (standing, compose) => composeTipInPlace(standing, compose, handleFailure),
        place.getLeft,
        place.getRoom,
    );
}

export function composePanelHost(
    document: PanelDocument,
    handlePress: (press: PanelPress) => void,
    handleFailure: HandlePanelFailure,
    placement: PanelPlacement | null = null,
    // Null is the panel drawing its own words, which is what every test and every browser
    // without the game sees. Who asks the client, and how often, is the entry's — ADR 0024.
    translate: TranslateLabel | null = null,
    /** The second window's own corner, kept apart from the panel's: two windows, two answers. */
    standingPlacement: PanelPlacement | null = null,
): PanelHandle {
    const { host, root } = composePanelShadow(document);
    const regions = composePanelRegions(document);
    const frame = composePanelFrame(document, regions);
    const redraw = (standing: PanelElement, region: PanelRegion, compose: () => PanelElement) => {
        return composeRegionInPlace(document, standing, region, compose, handleFailure);
    };
    // A listener and a drag both cost the reader the same thing — the gesture — so the kind is
    // added here rather than threaded through two modules that have no word for it.
    const handleGesture = (failure: unknown): void => {
        handleFailure({ kind: "gesture", region: null, failure });
    };
    const register = composeTipRegister();
    const drawing = composeListDrawing(document, regions, handleFailure);
    // Null for good on a panel never made movable, which is every panel a test draws.
    let drag: PanelDragHandle | null = null;
    const tip = composeTipBeside(document, register, placement, handleFailure, () => drag);
    const standing = composeStandingWindow(document);
    let standingBar = standing.bar;
    let standingBody = standing.body;
    setPanelRootChildren(root, [regions.title, frame, tip.element, standing.element]);
    const showTip = (key: string | null, clientY: number) => tip.show(key, clientY);
    setPanelRootListeners(root, handlePress, showTip, handleGesture, standing.element);
    // After the listeners that read a press, and on the same root: a drag is four more of them.
    if (placement !== null) {
        drag = setPanelDrag(
            root,
            host,
            () => regions.title,
            placement,
            handleGesture,
        );
    }
    const standingDrag = setStandingDrag(
        root,
        standing.element,
        () => standingBar,
        standingPlacement,
        handleGesture,
    );
    return composePanelDrawing({
        host,
        document,
        regions,
        frame,
        redraw,
        register,
        drawing,
        translate,
        tip,
        getDrag: () => drag,
        standingWindow: standing.element,
        standingDrag,
        getStandingBar: () => standingBar,
        setStandingBar: (next: PanelElement) => standingBar = next,
        getStandingBody: () => standingBody,
        setStandingBody: (next: PanelElement) => standingBody = next,
    });
}

/** What a draw is handed. Gathered rather than closed over, so the entry point stays a page. */
interface PanelDrawing {
    host: PanelElement;
    document: PanelDocument;
    regions: PanelRegions;
    frame: PanelElement;
    redraw: PanelRedraw;
    register: TipRegister;
    drawing: ListDrawing;
    translate: TranslateLabel | null;
    tip: TipHandle;
    getDrag(): PanelDragHandle | null;
    standingWindow: PanelElement;
    standingDrag: PanelDragHandle | null;
    getStandingBar(): PanelElement;
    setStandingBar(next: PanelElement): void;
    getStandingBody(): PanelElement;
    setStandingBody(next: PanelElement): void;
}

function composePanelDrawing(held: PanelDrawing): PanelHandle {
    const { document, regions, frame, redraw, register, drawing, tip } = held;
    return {
        element: held.host,
        show(shown: ShownScreen): void {
            drawing.keep();
            register.reset();
            setFoldDrawn(document, regions, frame, redraw, shown.isCollapsed, shown.hasFightToSave);
            if (shown.isCollapsed) setPanelFolded(document, regions, redraw);
            else setPanelBody(document, regions, shown, register, held.translate, redraw, drawing);
            drawing.settle();
            held.getDrag()?.handleDrawn();
            tip.refresh();
        },
        showWaiting(isCollapsed: boolean, waiting: WaitingReading): void {
            drawing.keep();
            register.reset();
            setFoldDrawn(document, regions, frame, redraw, isCollapsed, waiting.hasFightToSave);
            setPanelWaiting(document, regions, isCollapsed, waiting, redraw, drawing);
            drawing.settle();
            held.getDrag()?.handleDrawn();
            tip.refresh();
        },
        showStanding(reading: StandingReading | null, isCollapsed: boolean): void {
            // The mark on the frame and the body composed empty, both — as the panel's fold does.
            // The frame is what stays across a draw, so it is what can say the window is away.
            held.standingWindow.className = isCollapsed
                ? `${CLASS.standing} ${CLASS.standingFolded}`
                : CLASS.standing;
            held.setStandingBar(
                setStandingBarDrawn(document, held.getStandingBar(), isCollapsed, redraw),
            );
            held.setStandingBody(
                setStandingBodyDrawn(
                    document,
                    held.getStandingBody(),
                    reading,
                    isCollapsed,
                    redraw,
                ),
            );
            held.standingDrag?.handleDrawn();
        },
    };
}

/**
 * A panel with no fight to draw. A defect can arrive before one does — a reading that would not
 * compose leaves the panel waiting — so what could not be done is drawn here too, and not only
 * over a fight.
 */
function setPanelWaiting(
    document: PanelDocument,
    regions: PanelRegions,
    isCollapsed: boolean,
    waiting: WaitingReading,
    redraw: PanelRedraw,
    drawing: ListDrawing,
): void {
    setPanelFolded(document, regions, redraw);
    if (isCollapsed) return;
    drawing.draw(
        WAITING_LIST_NAME,
        () => composeWaitingElement(document, waiting.isFightUnread),
    );
    regions.defects = redraw(
        regions.defects,
        "defects",
        () => composeDefectsElement(document, waiting.defects),
    );
}

type PanelRedraw = (
    standing: PanelElement,
    region: PanelRegion,
    compose: () => PanelElement,
) => PanelElement;

/**
 * The one region that scrolls, drawn for a named place so the reader's position follows it. The
 * three steps run in this order around a draw, and the order is the whole of what makes it work.
 */
interface ListDrawing {
    keep(): void;
    draw(name: string, compose: () => PanelElement): void;
    settle(): void;
}

function composeListDrawing(
    document: PanelDocument,
    regions: PanelRegions,
    handleFailure: HandlePanelFailure,
): ListDrawing {
    const keptScrolls = composeKeptScrollMemo();
    // Which list is standing in the region, so a position read off it is kept under the place it
    // belongs to rather than under the place taking its turn.
    let shownName = WAITING_LIST_NAME;
    // The region the reader is scrolling stayed, so the browser holds their place and their turn.
    let isRegionKept = false;
    const draw = (name: string, compose: () => PanelElement): void => {
        const next = composeRegion(document, "list", compose, handleFailure);
        // The same list, drawn again: a payload landing is not a reason to take the region the
        // reader is turning away from them. Another list is the region replaced, as before, so
        // the place kept under its own name is what they land on.
        isRegionKept = name === shownName && setListRowsDrawn(regions.list, next);
        if (!isRegionKept) {
            regions.list.replaceWith(next);
            regions.list = next;
        }
        shownName = name;
    };
    return {
        // ⚠️ **Before any region is redrawn.** A region taken away grows the list under it, and a
        // browser answers a taller box by clamping the position on it — the reader's own place,
        // gone before anything read it. Measured on Chrome 152.0.7977.64, 2026-09-04: going back
        // from a level takes the crumb away, and 54 pixels became 34 as the crumb went.
        keep: () => {
            const top = getTopOfList(regions.list);
            if (top !== null) keptScrolls.setTop(shownName, top);
        },
        draw,
        // And after every region is standing, for the same reason read the other way round. A
        // fold empties the region like any other and takes no name away, so what a reader unfolds
        // onto is the list they were reading, at the position they left it at.
        // Nothing to put back where the region itself stayed: the browser has the reader's place
        // already, and writing one over it is what takes a wheel turn away (`panel-scroll.ts`).
        settle: () => {
            if (isRegionKept) return;
            setTopOfList(regions.list, keptScrolls.getTop(shownName));
        },
    };
}

/** The bar, which says what it will do, and the frame it folds. Drawn on every draw there is. */
function setFoldDrawn(
    document: PanelDocument,
    regions: PanelRegions,
    frame: PanelElement,
    redraw: PanelRedraw,
    isCollapsed: boolean,
    hasFightToSave: boolean,
): void {
    regions.title = redraw(
        regions.title,
        "header",
        () => composeTitleElement(document, isCollapsed, hasFightToSave),
    );
    frame.className = isCollapsed ? `${CLASS.frame} ${CLASS.folded}` : CLASS.frame;
}

function setPanelFolded(
    document: PanelDocument,
    regions: PanelRegions,
    redraw: PanelRedraw,
): void {
    regions.header = redraw(regions.header, "header", () => composeSlotElement(document));
    regions.nouns = redraw(regions.nouns, "strips", () => composeSlotElement(document));
    regions.directions = redraw(regions.directions, "strips", () => composeSlotElement(document));
    regions.crumb = redraw(regions.crumb, "crumb", () => composeSlotElement(document));
    regions.storage = redraw(regions.storage, "strips", () => composeSlotElement(document));
    regions.list = redraw(regions.list, "list", () => composeSlotElement(document));
    regions.pinnedActor = redraw(regions.pinnedActor, "pinned", () => composeSlotElement(document));
    regions.pinnedTarget = redraw(
        regions.pinnedTarget,
        "pinned",
        () => composeSlotElement(document),
    );
    regions.sides = redraw(regions.sides, "sides", () => composeSlotElement(document));
    regions.suspicions = redraw(
        regions.suspicions,
        "suspicions",
        () => composeSlotElement(document),
    );
    regions.defects = redraw(regions.defects, "defects", () => composeSlotElement(document));
}

function setPanelBody(
    document: PanelDocument,
    regions: PanelRegions,
    shown: ShownScreen,
    register: TipRegister,
    translate: TranslateLabel | null,
    redraw: PanelRedraw,
    drawing: ListDrawing,
): void {
    const isFight = !shown.isOnShelf;
    regions.header = redraw(
        regions.header,
        "header",
        () => isFight ? composeHeaderElement(document, shown) : composeSlotElement(document),
    );
    regions.nouns = redraw(
        regions.nouns,
        "strips",
        () => isFight ? composeNounStripElement(document, shown) : composeSlotElement(document),
    );
    regions.directions = redraw(
        regions.directions,
        "strips",
        () =>
            isFight ? composeDirectionStripElement(document, shown) : composeSlotElement(document),
    );
    regions.crumb = redraw(regions.crumb, "crumb", () => composeCrumbRegion(document, shown));
    regions.storage = redraw(
        regions.storage,
        "strips",
        () => isFight ? composeSlotElement(document) : composeStorageStripElement(document, shown),
    );
    drawing.draw(shown.listName, () => composeShownList(document, shown, register, translate));
    setPinnedRegions(document, regions, shown, register, redraw);
    // Whether there is a summary to draw is asked **inside** the guard, not before it: a reading
    // that throws on being asked cost the whole panel where the question stood outside (**E5**).
    regions.sides = redraw(regions.sides, "sides", () => {
        const hasSides = shown.reading.sides !== null && !shown.isOnShelf;
        if (!hasSides) return composeSlotElement(document);
        return composeSidesElement(document, shown);
    });
    regions.suspicions = redraw(
        regions.suspicions,
        "suspicions",
        () =>
            composeSuspicionsElement(
                document,
                shown.isOnShelf ? shown.shelfAnswers : shown.reading.suspicions,
            ),
    );
    // Last, and drawn on every screen: what the panel could not do is not about the fight, so it
    // does not go away when the reader switches to another one — `DESIGN.md`, Defect list.
    regions.defects = redraw(
        regions.defects,
        "defects",
        () => composeDefectsElement(document, shown.defects),
    );
}

/**
 * A pinned row keeps a place of its own whether or not there is one to draw, so a failure takes
 * one row rather than both — and nothing standing below them moves when one arrives.
 */
function setPinnedRegions(
    document: PanelDocument,
    regions: PanelRegions,
    shown: ShownScreen,
    register: TipRegister,
    redraw: PanelRedraw,
): void {
    const stated = {
        metric: shown.current,
        isSideChosen: shown.side !== "everyone",
        figure: getWordsForMetric(shown.current),
    };
    const isOpen = getIsLevelOpen(shown);
    const pinned = !isOpen && !shown.isOnShelf ? shown.reading.pinned : [];
    for (const [end, standing] of [["actor", "pinnedActor"], ["target", "pinnedTarget"]] as const) {
        const row = pinned.find((one) => one.end === end) ?? null;
        regions[standing] = redraw(
            regions[standing],
            "pinned",
            () =>
                row === null
                    ? composeSlotElement(document)
                    : composePinnedElement(document, row, register, stated),
        );
    }
}

function composeDefectsElement(
    document: PanelDocument,
    defects: readonly string[],
): PanelElement {
    if (defects.length === 0) return composeSlotElement(document);
    const block = composeElement(document, "div", CLASS.defects);
    for (const said of defects) {
        if (said.length === 0) continue;
        const line = composeElement(document, "div", CLASS.defect);
        line.textContent = `${DEFECT_MARK}${said}`;
        block.append(line);
    }
    return block;
}

function composeSuspicionsElement(
    document: PanelDocument,
    suspicions: readonly string[],
): PanelElement {
    if (suspicions.length === 0) return composeSlotElement(document);
    const block = composeElement(document, "div", CLASS.suspicions);
    for (const suspicion of suspicions) {
        const line = composeElement(document, "div", CLASS.suspicion);
        line.textContent = `${SUSPECT_MARK}${suspicion}`;
        block.append(line);
    }
    return block;
}
