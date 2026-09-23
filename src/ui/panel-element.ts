/**
 * The panel, drawn into a document it is handed. It never reaches for one, which is what keeps
 * the surface this asks of a browser declared rather than assumed.
 */

import { BUILD_VERSION } from "@/src/build-version.ts";
import { type StandingChargedSkill, type StandingReading } from "@/src/ui/panel-standing.ts";
import { composeDecimalText, composeIntegerText, getIntegerFromText } from "@/libs/number-text.ts";
import { setGuardedListener } from "@/src/ui/panel-listener.ts";
import type {
    DrillReading,
    ElementCut,
    ElementRow,
    HalfNamedDrillReading,
    HalfNamedReading,
    HalfNamedRow,
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
import {
    type ClosingRow,
    getEndForPinned,
    getPartOfSide,
    getRowIsSuspect,
    type OpenedPart,
} from "@/src/ui/panel-reading.ts";
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
    TIP,
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
    type Caveat,
    CAVEAT_MARK,
    composeChargedSkillSubtitle,
    composeCounterText,
    composeFigureText,
    composeShelfSizeText,
    composeSideCountsText,
    composeTurnOrdinalText,
    composeUndrawnText,
    composeUsesText,
    DEFECT_MARK,
    getCaveatForUnannounced,
    getWordsForChargedSkill,
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
    getWordsForTurnState,
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
    composeTipAcross,
    PANEL_WINDOW,
    type PanelDragHandle,
    type PanelPlacement,
    type PanelPosition,
    type PanelWindowName,
    setGripMark,
    setPanelDrag,
    STANDING_WINDOW,
    type TipAcross,
    type TipWindowPlace,
} from "@/src/ui/panel-drag.ts";
import {
    composeTipHandle,
    composeTipRegister,
    setTipHidden,
    type TipCompose,
    type TipGroup,
    type TipHandle,
    type TipLine,
    type TipLookup,
    type TipReading,
    type TipRegister,
} from "@/src/ui/panel-tip.ts";
import { composeCardReading, composeCaveatNoteLines } from "@/src/ui/panel-card.ts";

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
/**
 * The row closing a damage section, which opens onto whoever stood at the other end of those
 * blows. **ADR 0081.**
 */
const PLAIN_ATTRIBUTE = "data-plain";
/** It names nothing, so the mark states the same word every time and the press reads the key. */
const PLAIN_MARK = "closing";
const SOURCE_ATTRIBUTE = "data-source";
const KIND_ATTRIBUTE = "data-kind";
const FIGHT_ATTRIBUTE = "data-fight";
const PIN_ATTRIBUTE = "data-pin";
/** Which end a pinned row leaves out, which is the whole of what opening it asks for. */
const UNNAMED_ATTRIBUTE = "data-unnamed";
const STORAGE_ATTRIBUTE = "data-storage";
/** Four is every charge length the corpus states, and a clamp on a figure the game hands us. */
const MAXIMUM_CHARGED_PIPS = 8;
/**
 * The window's own fold, which is not the panel's: one mark over both would put away the window a
 * reader was watching along with the one they folded.
 */
const STANDING_FOLD_ATTRIBUTE = "data-standing-fold";
const LIVE_FIGHT = "live";
const TIP_ATTRIBUTE = "data-tip";
/**
 * The one card key no row states, so it can be a constant where every other is composed off what
 * the row stands for: one crumb is drawn at a time and its card says the same two things whatever
 * level it leaves.
 */
const CRUMB_TIP_KEY = "crumb:back";
const STANDING_TIP_PREFIX = "standing:";
/** The one person's row there is only ever one of, whoever is standing on it. */
const STANDING_NOW_TIP_KEY = `${STANDING_TIP_PREFIX}now`;
/**
 * The charge band's, keyed by whoever is making the blow ready: `core/charged-skill.ts` holds
 * one charge per combatant, so one row is one key. A second row under the same key would be
 * refused without a word and would wear its neighbour's card, which is why
 * `tests/ui/panel-standing.test.ts` counts the keys rather than trusting that. **ADR 0100.**
 */
const STANDING_CHARGE_TIP_PREFIX = `${STANDING_TIP_PREFIX}charge:`;
const STANDING_HOLDING_TIP_PREFIX = `${STANDING_TIP_PREFIX}holding:`;
const STANDING_HELD_TIP_PREFIX = `${STANDING_TIP_PREFIX}held:`;
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
/**
 * The widest a card may stand, as a number. `TIP.widthMaximum` is where that bound is chosen, and
 * this reads it rather than restating it: the two spellings drifted on 2026-09-15 and the failure
 * was silent — the card drew at one width and was placed as if it were the other, standing 43px
 * over the rows it explains. What the card is actually drawn at is the sheet's to decide now
 * (**ADR 0091**); this is what the **side** it opens on is decided by, and nothing else. A bound
 * nothing could be read from leaves the card where the sheet puts it.
 */
const MAXIMUM_TIP_WIDTH = getIntegerFromText(TIP.widthMaximum.slice(0, -2)) ?? 0;
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
     * Which sentence this row's own figure owes, where its label names more than the figure
     * counts. **One field and not two**: the glyph the row wears and the sentence its card says
     * are read off this, so neither can be drawn without the other (**ADR 0089**).
     */
    caveat?: Caveat | null | undefined;
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
    rule.setAttribute(STYLE_ATTRIBUTE, `color:${part === "reader" ? SIGNAL.ours : SIGNAL.theirs}`);
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
 * ⚠️ **A row that opens says so, at every level and not only on the ranking.** Where the note is
 * the card's alone, the 1,576 rows inside an opened one that open (`captures/`, 2026-08-30) are
 * told apart from the 588 that do not by the cursor and by nothing else. Half a section being
 * pressable and silent about it teaches a reader that none of it is.
 */
function composeRowTipReading(reading: RowReading, tip: RowTip, doesOpen: boolean): TipReading {
    // The row's own figure and nothing else: a share is a reading of the list rather than a claim
    // the protocol narrowed, so the glyph stands on the line above it (**ADR 0089**).
    const stated: TipLine[] = [{
        kind: "stat",
        label: tip.figure,
        stated: composeFigureText(reading.figure),
        isStrong: false,
        caveat: tip.caveat ?? null,
    }];
    if (tip.share !== null) {
        stated.push({
            kind: "stat",
            label: tip.share,
            stated: reading.shareText,
            isStrong: false,
            caveat: null,
        });
    }
    const said: TipLine[] = [...composeCaveatNoteLines([{ lines: stated }])];
    for (const note of tip.notes ?? []) {
        said.push({ kind: "note", text: note, tone: "plain" });
    }
    if (doesOpen) said.push({ kind: "note", text: CARD_WORDS.gesture, tone: "plain" });
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
    const doesOpen = mark !== null;
    const kind = doesOpen ? CLASS.rowDrillable : CLASS.rowLeaf;
    // No place in the ranking is the whole of what the sheet needs, and the rank cell already
    // answers it: every other reading is handed its position, and only an unnamed one is handed
    // none.
    const place = reading.rank === null ? ` ${CLASS.rowApart}` : "";
    const element = composeElement(document, "div", `${CLASS.row} ${kind}${place}`);
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
    // Read off the tip and never off the reading: the glyph here and the sentence the card says
    // are then one answer to one question, and a row cannot wear a mark nothing explains.
    if (tip.caveat !== undefined) {
        if (tip.caveat !== null) {
            const mark = composeElement(document, "span", CLASS.rowCaveat);
            mark.textContent = CAVEAT_MARK;
            parts.push(mark);
        }
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
 * than one that is not there (`DESIGN.md`), and an envelope with no call in it is a file that
 * looks like a saved fight and is not. **ADR 0053.**
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
    bar.append(composeBarControl(document, {
        className: CLASS.control,
        mark: isCollapsed ? UNFOLD_MARK : FOLD_MARK,
        attribute: FOLD_ATTRIBUTE,
        words: isCollapsed ? PANEL_WORDS.expand : PANEL_WORDS.collapse,
    }));
    return bar;
}

/** The window's own bar: its own grip, its own fold, and no control that would close it. */
function composeStandingBar(document: PanelDocument, isCollapsed: boolean): PanelElement {
    const bar = composeElement(document, "div", CLASS.standingBar);
    bar.textContent = `${GRIP_MARK}${STANDING_WORDS.title}`;
    bar.setAttribute(TITLE_ATTRIBUTE, STANDING_WORDS.drag);
    setGripMark(bar, STANDING_WINDOW);
    bar.append(composeBarControl(document, {
        className: CLASS.control,
        mark: isCollapsed ? UNFOLD_MARK : FOLD_MARK,
        attribute: STANDING_FOLD_ATTRIBUTE,
        words: isCollapsed ? STANDING_WORDS.expand : STANDING_WORDS.collapse,
    }));
    return bar;
}

/** Whose turn the game numbers, or the sentence naming why it numbers none — **ADR 0072**. */
function composeStandingNow(
    document: PanelDocument,
    reading: StandingReading,
    register: TipRegister,
): PanelElement[] {
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
        empty.textContent = getWordsForTurnState(reading.turnState);
        return [section, empty];
    }
    const row = composeStandingPersonElement(document, register, STANDING_NOW_TIP_KEY, {
        name: holder.name,
        skillName: null,
        colour: holder.colour,
        sidePart: holder.sidePart,
        turns: null,
        turnsCaveat: null,
        isUnder: false,
    });
    return [section, row];
}

/**
 * The dots a charge draws, and **every one of them as a node a pointer may land on**. A card is
 * read off the node under the hand and never walked up from (`composeStandingPersonElement`), so
 * each dot goes back to the caller to be marked with the row's own key: unmarked, the widest
 * thing on the row is a run of holes the card closes in. `StandingCount` below is the same shape
 * for the same reason.
 */
interface ChargedSkillPips {
    element: PanelElement;
    parts: PanelElement[];
}

/**
 * One dot per turn of the charge, lit up to what has passed. The game's own bar is cut the same
 * way and nothing else in this panel is round, so the shape says this and only this.
 */
function composeChargedSkillPips(
    document: PanelDocument,
    charged: StandingChargedSkill,
): ChargedSkillPips {
    const element = composeElement(document, "div", CLASS.standingPips);
    element.setAttribute(STYLE_ATTRIBUTE, `color:${charged.colour}`);
    const stated = Math.min(Math.max(charged.turnsStated, 0), MAXIMUM_CHARGED_PIPS);
    const parts: PanelElement[] = [element];
    for (let turn = 0; turn < stated; turn += 1) {
        const lit = turn < charged.turnsElapsed ? ` ${CLASS.standingPipLit}` : "";
        const pip = composeElement(document, "div", `${CLASS.standingPip}${lit}`);
        element.append(pip);
        parts.push(pip);
    }
    return { element, parts };
}

/**
 * What a charge's row had to cut, handed back whole: the blow's name, whoever is making it ready
 * — which the row says in a hue and nowhere in words — and what became of it at either end. The
 * turns are the client's own pair, under the word a cast's card already states its own under.
 * **ADR 0100.**
 */
function composeChargedSkillTipReading(charged: StandingChargedSkill): TipReading {
    const stated: TipLine = {
        kind: "stat",
        label: STANDING_WORDS.turnsPassed,
        stated: composeCounterText(charged.turnsElapsed, charged.turnsStated),
        isStrong: false,
        caveat: null,
    };
    return {
        name: charged.skillName,
        subtitle: composeChargedSkillSubtitle(charged.name, charged.state),
        groups: [{ lines: [stated] }],
    };
}

/**
 * One charge, as a row. It opens nothing, so it wears the leaf's cursor and carries the card that
 * hands back what its name cell cut — every row in this window does since **ADR 0100**.
 */
function composeChargedSkillRow(
    document: PanelDocument,
    register: TipRegister,
    charged: StandingChargedSkill,
): PanelElement {
    const row = composeElement(document, "div", `${CLASS.row} ${CLASS.rowLeaf}`);
    const cap = composeElement(document, "div", CLASS.barCap);
    cap.setAttribute(STYLE_ATTRIBUTE, `background:${charged.colour}`);
    const name = composeElement(document, "span", CLASS.rowName);
    name.textContent = charged.skillName;
    const value = composeElement(document, "span", `${CLASS.rowValue} ${CLASS.figure}`);
    value.textContent = composeCounterText(charged.turnsElapsed, charged.turnsStated);
    const pips = composeChargedSkillPips(document, charged);
    row.append(cap);
    row.append(name);
    row.append(pips.element);
    row.append(value);
    const parts = [cap, name, ...pips.parts, value];
    for (const rule of composeSideRuleElements(document, charged.sidePart)) {
        row.append(rule);
        parts.push(rule);
    }
    const key = `${STANDING_CHARGE_TIP_PREFIX}${composeIntegerText(charged.combatantId)}`;
    register.add(key, () => composeChargedSkillTipReading(charged));
    setRowMarks([row, ...parts], TIP_ATTRIBUTE, key);
    return row;
}

/**
 * The band itself: a heading whose right-hand side says what became of the charge, and one row
 * per charge. Drawn only where there is one — a fight where nothing is being made ready looks
 * exactly as it did before this band existed.
 */
function composeChargedSkillElements(
    document: PanelDocument,
    reading: StandingReading,
    register: TipRegister,
): PanelElement[] {
    if (reading.chargedSkills.length === 0) return [];
    const first = reading.chargedSkills[0];
    const section = composeElement(document, "div", CLASS.section);
    const words = composeElement(document, "span", CLASS.sectionWords);
    words.textContent = STANDING_WORDS.chargedSkill;
    const state = composeElement(document, "span", CLASS.figure);
    state.textContent = first === undefined ? "" : getWordsForChargedSkill(first.state);
    section.append(words);
    section.append(state);
    const drawn: PanelElement[] = [section];
    for (const charged of reading.chargedSkills) {
        drawn.push(composeChargedSkillRow(document, register, charged));
    }
    return drawn;
}

/**
 * One row per person, at both levels: whoever is holding, and under them whom. The turns stand on
 * the rows under it, because a shout runs on the turns of whoever it holds. **ADR 0103.**
 */
function composeProvokedElements(
    document: PanelDocument,
    reading: StandingReading,
    register: TipRegister,
): PanelElement[] {
    if (reading.provoked.length === 0) return [];
    // The characters held, and never the casts holding them: **ADR 0062**'s heading counts people.
    let counted = 0;
    for (const one of reading.provoked) counted += one.provoked.length;
    const drawn: PanelElement[] = [
        composeSectionElement(document, STANDING_WORDS.provocation, counted),
    ];
    for (const provocation of reading.provoked) {
        // The fold's own key, so a card is filed under the cast rather than under the person: one
        // caster shouting both okrzyki stands twice (**ADR 0097**).
        const cast = `${composeIntegerText(provocation.casterId)}/${
            composeIntegerText(provocation.skillId)
        }`;
        drawn.push(composeStandingPersonElement(
            document,
            register,
            `${STANDING_HOLDING_TIP_PREFIX}${cast}`,
            {
                name: provocation.casterName,
                skillName: provocation.skillName,
                colour: provocation.casterColour,
                sidePart: provocation.casterSidePart,
                // No length here: one cast holding two characters is two counts on two clocks,
                // so the figure sits on the row of whoever is carrying it (**ADR 0103**).
                turns: null,
                turnsCaveat: null,
                isUnder: false,
            },
        ));
        for (const held of provocation.provoked) {
            // The cast as well as whoever it holds, although `core/aura-standing.ts` keys a
            // provocation by that character and so hands each one over once. A key that leans on
            // somebody else's keying fails silently the day it moves: the register refuses the
            // second of two rows without a word, and that row then wears its neighbour's card.
            const key = `${STANDING_HELD_TIP_PREFIX}${cast}/${composeIntegerText(held.provokedId)}`;
            drawn.push(composeStandingPersonElement(document, register, key, {
                name: held.name,
                // Named on the card and never on the row: the row above draws it already, and
                // what this row does state is a length of this character's own (**ADR 0103**).
                skillName: provocation.skillName,
                colour: held.colour,
                sidePart: held.sidePart,
                turns: composeCounterText(
                    held.turnsStated - held.turnsElapsed,
                    held.turnsStated,
                ),
                turnsCaveat: null,
                isUnder: true,
            }));
        }
    }
    return drawn;
}

/** A person as a row of the window beside the panel states them. */
interface StandingPerson {
    name: string;
    /**
     * The okrzyk this row is about, or null where no cast is. Drawn beside whoever cast it and
     * never on a row nested under them, where the row above already names it — the card says it
     * either way, because a card is read away from the row it came from.
     */
    skillName: string | null;
    colour: string;
    sidePart: PanelSidePart;
    /** Null where the figure belongs to the row above rather than to this one. */
    turns: string | null;
    /**
     * What the figure above claims beyond itself, which is never nothing where one is drawn: a
     * length is counted on one person and the effect it dates stands on several (**ADR 0101**).
     */
    turnsCaveat: Caveat | null;
    isUnder: boolean;
}

/**
 * What a person's row had to cut, handed back whole: the name, the okrzyk the row is about under
 * it, and the turns wherever the row states them. **It is not the ranking's person card** — the
 * figures of the fight are the panel's and never reach this window, so what stands here is the
 * card a skill and a fight on the shelf already get. **ADR 0098.**
 */
function composeStandingPersonTipReading(person: StandingPerson): TipReading {
    if (person.turns === null) {
        return { name: person.name, subtitle: person.skillName, groups: [] };
    }
    const stated: TipLine = {
        kind: "stat",
        label: STANDING_WORDS.turnsLeft,
        stated: person.turns,
        isStrong: false,
        caveat: person.turnsCaveat,
    };
    // Read off the figure rather than asked a second time, which is what keeps one glyph and one
    // sentence answering to each other wherever either is drawn (**ADR 0089**).
    const lines: TipLine[] = [stated, ...composeCaveatNoteLines([{ lines: [stated] }])];
    return { name: person.name, subtitle: person.skillName, groups: [{ lines }] };
}

/**
 * One person in the window beside the panel, wherever they stand: whose turn it is, who cast a
 * skill, who is holding somebody, and whom. Their profession is the cap and their side the rule
 * on the edge (**ADR 0065**); a row nested under the one above wears the indent and no other
 * difference.
 *
 * ⚠️ **The cast rides this row and never a line of its own.** ADR 0067 deleted a wrapping
 * sentence under the holder and took a line back with it; what returns here is two spans on the
 * row that was already there, so the section costs what it cost. **ADR 0097.**
 *
 * Both of the cells it draws shorten, so it wears the leaf's cursor and carries the card that
 * hands them back — **ADR 0098**.
 */
function composeStandingPersonElement(
    document: PanelDocument,
    register: TipRegister,
    tipKey: string,
    person: StandingPerson,
): PanelElement {
    const nested = person.isUnder ? ` ${CLASS.standingUnder}` : "";
    const castName = person.isUnder ? null : person.skillName;
    const holding = castName === null ? "" : ` ${CLASS.standingHolding}`;
    const classes = `${CLASS.row} ${CLASS.rowLeaf}${nested}${holding}`;
    const row = composeElement(document, "div", classes);
    const cap = composeElement(document, "div", CLASS.barCap);
    cap.setAttribute(STYLE_ATTRIBUTE, `background:${person.colour}`);
    const name = composeElement(document, "span", CLASS.rowName);
    name.textContent = person.name;
    row.append(cap);
    row.append(name);
    const parts = [cap, name];
    if (castName !== null) {
        const between = composeElement(document, "span", CLASS.rowShare);
        between.textContent = STANDING_WORDS.castSeparator;
        const cast = composeElement(document, "span", CLASS.standingCast);
        cast.textContent = castName;
        row.append(between);
        row.append(cast);
        parts.push(between, cast);
    }
    if (person.turns !== null) {
        const value = composeElement(document, "span", `${CLASS.rowValue} ${CLASS.figure}`);
        value.textContent = person.turns;
        row.append(value);
        parts.push(value);
    }
    for (const rule of composeSideRuleElements(document, person.sidePart)) {
        row.append(rule);
        parts.push(rule);
    }
    register.add(tipKey, () => composeStandingPersonTipReading(person));
    // Every span and not the row alone, for `composeRowElement`'s own reason: a pointer lands on
    // the node under it, and `getAttribute` is never walked up.
    setRowMarks([row, ...parts], TIP_ATTRIBUTE, tipKey);
    return row;
}

/**
 * What the window says about the **fight**: whose turn it is, what is being made ready, and who is
 * holding whom. What is true of one fighter is said on that fighter, in the game's own tooltip
 * (**ADR 0108**), so nothing here is drawn per combatant.
 */
function composeStandingBody(
    document: PanelDocument,
    reading: StandingReading,
    register: TipRegister,
): PanelElement {
    const body = composeElement(document, "div", CLASS.standingBody);
    for (const element of composeStandingNow(document, reading, register)) body.append(element);
    for (const element of composeChargedSkillElements(document, reading, register)) {
        body.append(element);
    }
    if (reading.chargedSkills.length === 0) {
        if (reading.provoked.length === 0) {
            const empty = composeElement(document, "div", CLASS.empty);
            empty.textContent = STANDING_WORDS.nothingHappens;
            body.append(empty);
            return body;
        }
    }
    for (const element of composeProvokedElements(document, reading, register)) {
        body.append(element);
    }
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

function composeCrumbRegion(
    document: PanelDocument,
    shown: ShownScreen,
    register: TipRegister,
): PanelElement {
    if (shown.isOnShelf) {
        return composeCrumbElement(document, register, {
            said: PANEL_WORDS.fights,
            from: PANEL_WORDS.backFromFights,
        });
    }
    if (shown.halfNamedDrill !== null) {
        return composeCrumbElement(document, register, {
            said: getWordsForHalfNamedDrill(shown.halfNamedDrill, shown.current),
            from: getWordsForUnnamedRow(getEndForPinned(shown.halfNamedDrill.case)),
        });
    }
    if (shown.halfNamed !== null) {
        return composeCrumbElement(document, register, {
            said: getWordsForUnnamedRow(shown.halfNamed.end),
            from: null,
        });
    }
    if (shown.drill === null) return composeSlotElement(document);
    const opened = shown.drill.name ?? PANEL_WORDS.unknown;
    if (shown.part !== null) {
        return composeCrumbElement(document, register, {
            said: getWordsForNamedPart(shown.part.part, shown.current),
            from: opened,
        });
    }
    if (shown.pair === null) {
        return composeCrumbElement(document, register, { said: opened, from: null });
    }
    return composeCrumbElement(document, register, {
        said: shown.pair.otherName ?? PANEL_WORDS.unknown,
        from: opened,
    });
}

/**
 * The crumb carries the one card that is not a row's, and it carries it on the way back alone:
 * `getPressFromTarget` walks no ancestors, so the mark on that span reaches the pointer and the
 * name beside it stays uncovered. Drawn only where a level is open, which is what lets it name a
 * gesture a row's card may not — **ADR 0086**.
 */
function composeCrumbElement(
    document: PanelDocument,
    register: TipRegister,
    stated: { said: string; from: string | null },
): PanelElement {
    const crumb = composeElement(document, "div", CLASS.crumb);
    const back = composeElement(document, "span", CLASS.crumbBack);
    const leaving = stated.from ?? PANEL_WORDS.back;
    back.textContent = `${BACK_MARK}${leaving}`;
    back.setAttribute(BACK_ATTRIBUTE, PANEL_WORDS.back);
    register.add(CRUMB_TIP_KEY, () => composeCrumbTipReading(leaving));
    back.setAttribute(TIP_ATTRIBUTE, CRUMB_TIP_KEY);
    const here = composeElement(document, "span", CLASS.crumbHere);
    here.textContent = stated.said;
    here.setAttribute(TITLE_ATTRIBUTE, here.textContent);
    crumb.append(back);
    crumb.append(here);
    return crumb;
}

function composeCrumbTipReading(leaving: string): TipReading {
    return {
        name: leaving,
        subtitle: null,
        groups: [{
            lines: [
                { kind: "note", text: CARD_WORDS.gestureBack, tone: "plain" },
                { kind: "note", text: CARD_WORDS.gestureBackAnywhere, tone: "plain" },
            ],
        }],
    };
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

/**
 * Drawn on the one screen the reading fills it for; on the others it is handed an empty cut,
 * and `src/ui/panel-reading.ts` says which screen that is and why.
 */
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
 * What a part is called where it stands, and a key is worded from the screen's own table: the game
 * states `heal` as a health gain and as a health loss both, and one label over the two would be two
 * quantities under one word.
 */
function getWordsForNamedPart(part: OpenedPart, metric: PanelMetric): string {
    if (part.kind === "skill") return part.name;
    if (part.kind === "plain") return getWordsForUnannounced(metric);
    const named = part.kind === "source" ? part.source : part.element;
    return getNounForMetric(metric) === "damage"
        ? getWordsForDamageKind(named)
        : getWordsForHealthSource(named);
}

/** The mark a part row wears, and null where the level under it holds nothing. */
function getMarkForNamedPart(part: OpenedPart, doesOpen: boolean): RowMark | null {
    if (!doesOpen) return null;
    if (part.kind === "skill") return { attribute: SKILL_ATTRIBUTE, stated: part.name };
    if (part.kind === "source") return { attribute: SOURCE_ATTRIBUTE, stated: part.source };
    if (part.kind === "plain") return { attribute: PLAIN_ATTRIBUTE, stated: PLAIN_MARK };
    return { attribute: KIND_ATTRIBUTE, stated: part.element };
}

/**
 * What a part row owes, asked wherever one is drawn: the same row stands on two levels, and a
 * caveat the deeper one drops leaves a reader at the bottom of the drill with no ring and no
 * sentence (**ADR 0089**). Every other kind of part names what it was, so none owes one.
 */
function getCaveatForNamedPart(part: OpenedPart, metric: PanelMetric): Caveat | null {
    if (part.kind !== "plain") return null;
    return getCaveatForUnannounced(getNounForMetric(metric));
}

/**
 * One key per part and per section, so a tip is never the one a row beside it registered. Every
 * caller names its own section here rather than spelling a key of its own: a second spelling
 * lands on somebody else's key silently — the register refuses a duplicate, and the row wears the
 * card of whichever section was drawn first.
 */
function getKeyForNamedPart(where: string, part: OpenedPart): string {
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
    let drawn = 0;
    for (const row of cut.rows) {
        drawn = composeSkillSectionPlain(document, list, cut.plain, stated, drawn, false);
        drawn += 1;
        const tip = {
            register: stated.register,
            key: getKeyForNamedPart("skill", row.part),
            figure: stated.figure,
            share,
        };
        const reading = composeSkillRowReading(row, stated.metric, drawn);
        const mark = getMarkForNamedPart(row.part, row.doesOpenPart);
        list.append(composeRowElement(document, reading, mark, tip));
    }
    composeSkillSectionPlain(document, list, cut.plain, stated, drawn, true);
    composeRestRow(document, list, cut.rest, {
        register: stated.register,
        figure: stated.figure,
        key: "skill:rest",
    });
}

/**
 * The closing row, drawn where its figure puts it rather than after the lot (**ADR 0079**). It is
 * asked before every row and once more after the last, so the place the reading composed is the
 * place it is drawn at whether that is the top of the section or the bottom of it.
 */
function composeSkillSectionPlain(
    document: PanelDocument,
    list: PanelElement,
    plain: ClosingRow | null,
    stated: { metric: PanelMetric; register: TipRegister; figure: string },
    drawn: number,
    isLast: boolean,
): number {
    if (plain === null) return drawn;
    // ⚠️ **Asked once per row and once after the last, so a place past the rows still draws.** A
    // section answering a place it did not reach by drawing nothing would take a figure off the
    // column and leave the shares adding to ninety-something, which is the one thing `DESIGN.md`
    // says a reader must never be handed.
    if (plain.place !== drawn + 1) {
        if (!isLast) return drawn;
        if (plain.place <= drawn) return drawn;
    }
    const tip = {
        register: stated.register,
        key: "skill:plain",
        figure: stated.figure,
        share: PANEL_WORDS.shareOfFigure,
        caveat: getCaveatForNamedPart({ kind: "plain" }, stated.metric),
    };
    const reading = {
        ...composeUnnamedReading(plain, getWordsForUnannounced(stated.metric)),
        rank: plain.place,
        uses: plain.blows,
    };
    const mark = getMarkForNamedPart({ kind: "plain" }, plain.doesOpenPart);
    list.append(composeRowElement(document, reading, mark, tip));
    return drawn + 1;
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
        needed += opponents.rows.length + (opponents.unnamed === null ? 0 : 1) + 1;
    }
    if (getElementCutRows(drill.byElement) > 0) needed += getElementCutRows(drill.byElement) + 1;
    if (drill.bySkill.rows.length > 0 || drill.bySkill.plain !== null) {
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
    part.setAttribute(STYLE_ATTRIBUTE, `width:${width}%`);
    return part;
}

/**
 * The section under the list: what the screen's own count holds and no row of it does.
 *
 * **It is not the suspicions in another shape.** A suspicion says a figure may be short and never
 * by how much, because nothing states one; this states a figure, because two counts of the same
 * screen came out different by exactly that much. The two stand under one heading so a reader has
 * one place for what the panel could not put anywhere, and they are different claims inside it.
 */
function composeOutsideElement(
    document: PanelDocument,
    shown: ShownScreen,
    register: TipRegister,
): PanelElement {
    const outside = shown.reading.outsideRanking;
    if (outside === null) return composeSlotElement(document);
    const block = composeElement(document, "div", CLASS.outside);
    block.append(composeSectionElement(document, PANEL_WORDS.outsideRanking, outside.figure));
    const reading = {
        name: PANEL_WORDS.outsideRow,
        figure: outside.figure,
        fill: outside.fill,
        shareText: outside.shareText,
        colour: getColourForProfession(null),
        profession: null,
        // No place, so the hatch: its figure is what reached no row rather than what anybody did
        // — `DESIGN.md`, and **ADR 0079**'s test for which kind of row takes one.
        rank: null,
    };
    const tip = {
        register,
        key: "outside",
        figure: getWordsForMetric(shown.current),
        share: PANEL_WORDS.share,
        notes: [PANEL_WORDS.outsideNote],
    };
    block.append(composeRowElement(document, reading, null, tip));
    return block;
}

function composeSidesElement(document: PanelDocument, shown: ShownScreen): PanelElement {
    const sides = shown.reading.sides;
    // Two sides nothing can tell apart are not two figures, and a strip of them says nothing:
    // `setPanelBody` asks the same question, and this answers it rather than trusting it.
    if (sides === null) return composeSlotElement(document);
    const block = composeElement(document, "div", CLASS.sides);
    const line = composeElement(document, "div", CLASS.sidesLine);
    const reader = composeElement(document, "span", `${CLASS.sidesOurs} ${CLASS.figure}`);
    reader.textContent = composeFigureText(sides.reader);
    const label = composeElement(document, "span", CLASS.sidesLabel);
    label.textContent = composeSidesLabel(shown);
    const opposing = composeElement(document, "span", `${CLASS.sidesTheirs} ${CLASS.figure}`);
    opposing.textContent = composeFigureText(sides.opposing);
    line.append(reader);
    line.append(label);
    line.append(opposing);
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
    const whole = sides.reader + sides.opposing + sides.nobody;
    if (whole <= 0) return;
    const track = composeElement(document, "div", CLASS.sidesTrack);
    const parts: Array<[number, string]> = [
        [sides.reader / whole, CLASS.sidesOurs],
        [sides.opposing / whole, CLASS.sidesTheirs],
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
    | { kind: "part"; part: OpenedPart }
    | { kind: "fight"; stated: string }
    | { kind: "pin"; stated: string }
    | { kind: "storage"; name: string }
    | { kind: "back" }
    | { kind: "fold" }
    | { kind: "save" }
    | { kind: "shelf" }
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
        const tip = {
            ...stated,
            key: getKeyForNamedPart("pair", row.part),
            caveat: getCaveatForNamedPart(row.part, stated.metric),
        };
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
    // The one part carrying no name of its own, so the mark states a constant and the press reads
    // the attribute rather than its value.
    if (target.getAttribute(PLAIN_ATTRIBUTE) !== null) {
        return { kind: "part", part: { kind: "plain" } };
    }
    const element = target.getAttribute(KIND_ATTRIBUTE);
    if (element !== null) return { kind: "part", part: { kind: "element", element } };
    const fight = target.getAttribute(FIGHT_ATTRIBUTE);
    if (fight !== null) return { kind: "fight", stated: fight };
    const pinned = target.getAttribute(PIN_ATTRIBUTE);
    if (pinned !== null) return { kind: "pin", stated: pinned };
    const storage = target.getAttribute(STORAGE_ATTRIBUTE);
    if (storage !== null) return { kind: "storage", name: storage };
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
    outside: PanelElement;
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
        outside: composeSlotElement(document),
        sides: composeSlotElement(document),
        suspicions: composeSlotElement(document),
        defects: composeSlotElement(document),
    };
    return regions;
}

/**
 * The host, and the root everything else goes into. Both are built once and stay: only the
 * regions inside are replaced, so the listener at the root outlives every redraw and a press
 * during one is not swallowed, and the sheet is put in once — a region redrawn under it keeps
 * its look, and a browser re-parses nothing on a redraw.
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
    panel.append(regions.outside);
    panel.append(regions.sides);
    panel.append(regions.suspicions);
    panel.append(regions.defects);
    frame.append(panel);
    return frame;
}

/** The two windows a card may open beside, each asked for where it stands **now**. */
interface TipWindows {
    getPanel(): PanelPosition | null;
    getStanding(): PanelPosition | null;
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
 * Null for good on a window never made movable, which is every panel a test draws.
 *
 * Both windows' listeners stand on the same root, so each set answers to its own grip by name.
 * Without the name on the mark both start on either bar: the panel moves by the wrong one and
 * writes its stored place doing it.
 */
function setDragOrNothing(
    root: PanelRoot,
    host: PanelElement,
    getBar: () => PanelElement,
    placement: PanelPlacement | null,
    handleGesture: (failure: unknown) => void,
    windowName: PanelWindowName = PANEL_WINDOW,
): PanelDragHandle | null {
    if (placement === null) return null;
    return setPanelDrag(root, host, getBar, placement, handleGesture, windowName);
}

/**
 * ⚠️ **The three below stand because `composePanelHost` sits at S4's page**, not because a reader
 * gains a name: measured 2026-09-20, inlining all three put that function at 79 lines. Each is
 * one statement, and each is called once.
 */
function setPanelRootChildren(root: PanelRoot, children: readonly PanelElement[]): void {
    for (const child of children) root.append(child);
}

/**
 * One card over two windows, so one reading over two registers. The panel's is asked first: it is
 * the one a fight refills every few seconds, and no key is stated by both.
 */
function composeTipLookup(panel: TipRegister, standing: TipRegister): TipLookup {
    return { get: (key: string) => panel.get(key) ?? standing.get(key) };
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
    register: TipRegister,
): PanelElement {
    if (reading === null) return redraw(standing, "standing", () => composeSlotElement(document));
    if (isCollapsed) return redraw(standing, "standing", () => composeSlotElement(document));
    return redraw(standing, "standing", () => composeStandingBody(document, reading, register));
}

/**
 * The card, placed against wherever its own window is **now** rather than where it was wired —
 * both the place and the room are asked of the windows as they are, because a drag moves one and
 * a window resize moves the other. A panel never made movable is handed neither, which is every
 * panel a test draws and no page a reader is on.
 *
 * **Which window a card opens beside is decided off its key**, the one thing the handle holds that
 * says where the row it names is drawn. Placed against the panel, a card from the second window
 * opened straight over that window's own lower rows: both are put a gap to the panel's left, and
 * the card is the wider of the two (**ADR 0090**). Each window answers for its own card and reads
 * nothing of the other's place.
 */
function composeTipBeside(
    document: PanelDocument,
    register: TipLookup,
    placement: PanelPlacement | null,
    handleFailure: HandlePanelFailure,
    windows: TipWindows,
): TipHandle {
    const composePlace = (
        position: PanelPosition | null,
        windowName: PanelWindowName,
    ): TipWindowPlace | null => {
        if (position === null) return null;
        return { position, windowName };
    };
    const composeAcross = (key: string): TipAcross | null => {
        const viewport = placement?.getViewport() ?? null;
        if (key.startsWith(STANDING_TIP_PREFIX)) {
            const standing = composePlace(windows.getStanding(), STANDING_WINDOW);
            return composeTipAcross(standing, viewport, MAXIMUM_TIP_WIDTH);
        }
        const panel = composePlace(windows.getPanel(), PANEL_WINDOW);
        return composeTipAcross(panel, viewport, MAXIMUM_TIP_WIDTH);
    };
    return composeTipHandle(
        document,
        register,
        (standing, compose) => composeTipInPlace(standing, compose, handleFailure),
        composeAcross,
        () => getTipRoom(placement?.getViewport()?.height ?? null),
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
    const standingRegister = composeTipRegister();
    const drawing = composeListDrawing(document, regions, handleFailure);
    let drag: PanelDragHandle | null = null;
    let standingDrag: PanelDragHandle | null = null;
    const cards = composeTipLookup(register, standingRegister);
    const tip = composeTipBeside(document, cards, placement, handleFailure, {
        getPanel: () => drag?.getPosition() ?? null,
        getStanding: () => standingDrag?.getPosition() ?? null,
    });
    const standing = composeStandingWindow(document);
    let standingBar = standing.bar;
    let standingBody = standing.body;
    setPanelRootChildren(root, [regions.title, frame, tip.element, standing.element]);
    setPanelRootListeners(root, handlePress, tip.show, handleGesture, standing.element);
    // After the listeners that read a press, and on the same root: a drag is four more of them.
    drag = setDragOrNothing(root, host, () => regions.title, placement, handleGesture);
    standingDrag = setDragOrNothing(
        root,
        standing.element,
        () => standingBar,
        standingPlacement,
        handleGesture,
        STANDING_WINDOW,
    );
    return composePanelDrawing({
        host,
        document,
        regions,
        frame,
        redraw,
        register,
        standingRegister,
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
    standingRegister: TipRegister;
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
                redraw(
                    held.getStandingBar(),
                    "standing",
                    () => composeStandingBar(document, isCollapsed),
                ),
            );
            // ⚠️ The two windows keep two registers because they are drawn at two moments: this
            // one goes up first and the panel's own draw resets the panel's register under it,
            // which took every card this window had registered with it (**ADR 0086**).
            held.standingRegister.reset();
            held.setStandingBody(
                setStandingBodyDrawn(
                    document,
                    held.getStandingBody(),
                    reading,
                    isCollapsed,
                    redraw,
                    held.standingRegister,
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
    regions.crumb = redraw(
        regions.crumb,
        "crumb",
        () => composeCrumbRegion(document, shown, register),
    );
    regions.storage = redraw(
        regions.storage,
        "strips",
        () => isFight ? composeSlotElement(document) : composeStorageStripElement(document, shown),
    );
    drawing.draw(shown.listName, () => composeShownList(document, shown, register, translate));
    setPinnedRegions(document, regions, shown, register, redraw);
    regions.outside = redraw(
        regions.outside,
        "outside",
        () =>
            shown.isOnShelf
                ? composeSlotElement(document)
                : composeOutsideElement(document, shown, register),
    );
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
