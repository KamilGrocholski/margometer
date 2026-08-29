/**
 * The panel, drawn into a document it is handed. It never reaches for one, which is what keeps
 * the surface this asks of a browser declared rather than assumed.
 *
 * One shadow root, and every name a reader meets before the panel's contents carries the
 * `MargoMeter-` prefix; names inside sit behind the root where the game's stylesheet cannot see
 * them. Nothing here throws: a region that cannot be drawn is replaced by a marker at its own
 * size, and the rest of the panel stands.
 */

import { assert } from "@std/assert";
import { BUILD_VERSION } from "@/src/build-version.ts";
import { composeDecimalText } from "@/src/core/protocol-number.ts";
import type {
    DrillReading,
    ElementRow,
    PairReading,
    PanelMetric,
    PanelReading,
    PanelRow,
    PanelSides,
    PinnedRow,
    ShelfRow,
    SkillReading,
    SkillRow,
    UnnamedRow,
} from "@/src/ui/panel-reading.ts";
import {
    composeDirectionTabs,
    composeNounTabs,
    composeSideTabs,
    getNounForScreen,
    getWordsForKindCut,
    getWordsForOpponentCut,
    getWordsForScreen,
    type PanelNoun,
    type PanelSideChoice,
    SCREEN_ORDER,
    type ScreenTab,
} from "@/src/ui/panel-screen.ts";
import {
    CLASS,
    composeStyleSheet,
    getColourForProfession,
    getInkForColour,
} from "@/src/ui/panel-look.ts";
import {
    composeFigureText,
    composeShelfSizeText,
    composeSideCountsText,
    composeUndrawnText,
    composeUsesText,
    getWordsForDamageKind,
    getWordsForHealthSource,
    getWordsForNothing,
    getWordsForOutcome,
    getWordsForShelfOutcome,
    getWordsForShelfTime,
    PANEL_WORDS,
    type PanelRegion,
} from "@/src/ui/panel-words.ts";
import {
    composeTipLeft,
    type PanelPlacement,
    type PanelPosition,
    setGripMark,
    setPanelDrag,
} from "@/src/ui/panel-drag.ts";
import {
    composeTipHandle,
    composeTipRegister,
    type TipHandle,
    type TipRegister,
} from "@/src/ui/panel-tip.ts";

/** A browser's own document satisfies this, and nothing wider is asked for. */
export interface PanelDocument {
    createElement(tag: string): PanelElement;
}

/** What a delegated listener is handed. The target is where the pointer landed, or nobody. */
export interface PanelEvent {
    target: { getAttribute(name: string): string | null } | null;
    /** Where the pointer is: the detail follows the one, and a drag follows both. */
    clientY: number;
    clientX?: number | undefined;
    /** Which pointer, so a drag can ask to keep it, and which button, where there is one. */
    pointerId?: number | undefined;
    button?: number | undefined;
    /** The game's own menu, on the gesture that goes back. Absent where nothing can be stopped. */
    preventDefault?: (() => void) | undefined;
}

export interface PanelElement {
    className: string;
    textContent: string;
    append(child: PanelElement): void;
    /** How a redrawn panel takes the place of the one before it, rather than stacking on it. */
    replaceWith(other: PanelElement): void;
    setAttribute(name: string, value: string): void;
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
 * Reading an attribute off that answers null for every row, tab and crumb, so a panel listening
 * on its host draws correctly and does nothing at all. The element interface above carries no
 * `addEventListener` for that reason — the wrong place to put it is not reachable from here.
 */
export interface PanelRoot {
    append(child: PanelElement): void;
    /** One listener at the root, never one per row. */
    addEventListener(type: string, handle: (event: PanelEvent) => void): void;
}

const HOST_NAME = "MargoMeter-Panel";
/**
 * Which build drew this, on the host where anything outside the root can read it — a screenshot
 * of the panel is a report, and a report that does not say which build made it is a claim about
 * no particular version of the add-on.
 */
const VERSION_ATTRIBUTE = "data-margometer-version";
/** What a control asks for. One attribute per control, so the listener never reads a class. */
const FOLD_ATTRIBUTE = "data-fold";
const SAVE_ATTRIBUTE = "data-save";
const COPY_ATTRIBUTE = "data-copy";
const SHELF_ATTRIBUTE = "data-shelf";
const SCREEN_ATTRIBUTE = "data-screen";
/** Its own attribute, because a side is not a screen and one listener reads them apart. */
const SIDE_ATTRIBUTE = "data-side";
/** A row says which combatant it is, and the crumb above an opened row says only that it is one. */
const ROW_ATTRIBUTE = "data-row";
const BACK_ATTRIBUTE = "data-back";
/** Its own attribute, because a skill is named rather than numbered and one listener reads both. */
const SKILL_ATTRIBUTE = "data-skill";
/** And its own again for a fight on the shelf, which is a moment rather than a name. */
const FIGHT_ATTRIBUTE = "data-fight";
/** What the fight going on now is asked for by, which is no moment at all. */
const LIVE_FIGHT = "live";
/** Which row's detail the pointer is over, looked up in the register the draw filled. */
const TIP_ATTRIBUTE = "data-tip";
const TITLE_ATTRIBUTE = "title";
/** What a row's bar and a badge are written on, since a length and a hue are data, not tokens. */
const STYLE_ATTRIBUTE = "style";
/** How many bars the list stands at, written by the draw and spent by the sheet. */
const ROWS_VARIABLE = "--MargoMeter-rows";
/** Braces, because what it saves is the protocol as the game stated it and not a reading of it. */
const SAVE_MARK = "{ }";
/** Two sheets, one behind the other: what it hands over is a second copy of what is on screen. */
const COPY_MARK = "⧉";
/** A stack of lines, which is what a shelf of fights already fought looks like. */
const SHELF_MARK = "☰";
/** Said the way a press would leave it: a folded panel offers to unfold, not to fold again. */
const FOLD_MARK = "—";
const UNFOLD_MARK = "+";
const BACK_MARK = "‹ ";
/** The grip, which is what says the bar can be taken hold of before anybody tries. */
const GRIP_MARK = "⠿ ";
/** More than colour, because colour never carries meaning by itself. */
const WARNING_MARK = "⚠ ";
/** What the panel listens for: a press, not a click, so a drag never counts as one. */
const PRESS_EVENT = "pointerdown";
/** One gesture in, one gesture out: the way back works from anywhere on the panel. */
const BACK_EVENT = "contextmenu";
/** What opens the detail, and what moves it. One event does both: it fires on either. */
const MOVE_EVENT = "pointermove";
/**
 * What closes it. `pointerleave` does not bubble and a shadow root is not on the composed path of
 * one dispatched to an element, so the one listener would never see it; `pointerout` bubbles.
 * Crossing from one part of a row to another therefore hides and shows inside a single task,
 * before a paint.
 */
const LEAVE_EVENT = "pointerout";
/** The button a press has to be to open anything. A press that states none is that button. */
const PRIMARY_BUTTON = 0;
/** A fight holds twenty, and a screen draws a row for each. */
const MAXIMUM_ROWS = 20;
/** What a panel with no fight in it stands at, which is the ranking's own floor. */
const ROWS_WAITING = 11;
/** What the statistics keep a cut inside. `captures/` states ten kinds in all, 2026-08-28. */
const MAXIMUM_KINDS = 64;
/** And what one combatant's own skills are kept inside: 81 names over `captures/`, 2026-08-29. */
const MAXIMUM_SKILLS = 256;
/** As wide as the sheet draws the detail window, which is what decides the side it opens on. */
const TIP_WIDTH = 250;
/** A bar is written to one place: a tenth of a 260-pixel row is a quarter of a pixel. */
const FILL_PLACES = 1;
const AS_PERCENT = 100;

function composeElement(document: PanelDocument, tag: string, className: string): PanelElement {
    assert(tag.length > 0, "an element is made under a tag the document knows");
    const element = document.createElement(tag);
    element.className = className;
    assert(element.className === className, "an element wears the class it was given");
    return element;
}

/** A slot standing where a region would, drawing nothing, so the regions keep their order. */
function composeSlotElement(document: PanelDocument): PanelElement {
    const slot = composeElement(document, "div", CLASS.slot);
    assert(slot.textContent === "", "a slot that draws nothing says nothing");
    assert(slot.className === CLASS.slot, "and is the slot it says it is");
    return slot;
}

/** What a row hands the register beside the figures it is already drawing. */
interface RowTip {
    register: TipRegister;
    key: string;
    /** What the figure is, in the reader's words. */
    figure: string;
    /** What the share is a share **of**, or null on a row that carries no share at all. */
    share: string | null;
}

/** What one row draws, whoever or whatever it is about. */
interface RowReading {
    /** The whole name, which the row itself may cut with an ellipsis. */
    name: string;
    figure: number;
    fill: number;
    shareText: string;
    /** The hue the bar, its cap and the badge are drawn in. */
    colour: string;
    /** The game's own letter, or null where it named no profession and no badge is drawn. */
    profession: string | null;
    /** Where it stands in the ranking, or null on a row that is a cut rather than a place. */
    rank: number | null;
    /** How many times, where a row states a count. Null everywhere a figure is the whole of it. */
    uses?: number | null | undefined;
}

/**
 * A pointer lands on the deepest element under it, so every part of a row wears the row's marks —
 * the same reason the press attribute is written on the spans and not on the row alone.
 */
function setRowMarks(parts: readonly PanelElement[], name: string, value: string): void {
    assert(name.startsWith("data-"), "a row is marked by an attribute of ours");
    assert(parts.length > 0, "and the pointer can land on some part of it");
    for (const part of parts) part.setAttribute(name, value);
}

function composeBarElements(document: PanelDocument, reading: RowReading): PanelElement[] {
    assert(reading.fill >= 0, "a bar is drawn for a share that is not below nothing");
    assert(reading.colour.length > 0, "and in a colour that was chosen");
    const width = composeDecimalText(Math.min(reading.fill, 1) * AS_PERCENT, FILL_PLACES);
    const bar = composeElement(document, "div", CLASS.bar);
    bar.setAttribute(STYLE_ATTRIBUTE, `width:${width}%;background:${reading.colour}`);
    // The colour at full strength on the edge the bar starts from: the bar itself is tinted so
    // the figures printed over it stay readable, which costs the hue the palette was chosen at.
    const cap = composeElement(document, "div", CLASS.barCap);
    cap.setAttribute(STYLE_ATTRIBUTE, `background:${reading.colour}`);
    return [bar, cap];
}

/** The profession as a letter, which is the channel that survives colour blindness. */
function composeBadgeElement(
    document: PanelDocument,
    profession: string,
    colour: string,
): PanelElement {
    const badge = composeElement(document, "span", CLASS.rowBadge);
    badge.textContent = profession.toUpperCase();
    badge.setAttribute(STYLE_ATTRIBUTE, `background:${colour};color:${getInkForColour(colour)}`);
    assert(badge.textContent.length > 0, "a badge that is drawn wears the game's own letter");
    assert(colour.length > 0, "and the colour that profession is drawn in");
    return badge;
}

/**
 * A press lands on the deepest element under the pointer, so every part of an openable row wears
 * the mark. Null leaves the row closed: the rows inside an opened one have nothing further to open.
 */
function composeRowElement(
    document: PanelDocument,
    reading: RowReading,
    opens: string | null,
    tip: RowTip,
): PanelElement {
    assert(reading.figure >= 0, "a row drawn states a figure that is not below nothing");
    const kind = opens === null ? CLASS.rowLeaf : CLASS.rowDrillable;
    const element = composeElement(document, "div", `${CLASS.row} ${kind}`);
    const parts = composeBarElements(document, reading);
    if (reading.rank !== null) {
        const rank = composeElement(document, "span", CLASS.rowRank);
        rank.textContent = `${composeFigureText(reading.rank)}.`;
        parts.push(rank);
    }
    if (reading.profession !== null) {
        parts.push(composeBadgeElement(document, reading.profession, reading.colour));
    }
    const name = composeElement(document, "span", CLASS.rowName);
    name.textContent = reading.name;
    const value = composeElement(document, "span", CLASS.rowValue);
    value.textContent = composeFigureText(reading.figure);
    const share = composeElement(document, "span", CLASS.rowShare);
    // The count rides the same brackets as the share: they answer one question between them —
    // how much of the figure, and how many times it was announced.
    const uses = reading.uses ?? null;
    const counted = uses === null ? "" : ` · ${composeUsesText(uses)}`;
    share.textContent = `(${reading.shareText}${counted})`;
    value.append(share);
    parts.push(name, value);
    for (const part of parts) element.append(part);
    // Appended to the figure rather than to the row, but it answers for the row like every other
    // part of it, so it joins the marks once the row has been assembled.
    parts.push(share);
    const marked = [element, ...parts];
    if (opens !== null) setRowMarks(marked, ROW_ATTRIBUTE, opens);
    tip.register.add(tip.key, {
        name: reading.name,
        figure: { caption: tip.figure, value: reading.figure },
        share: tip.share === null ? null : { caption: tip.share, text: reading.shareText },
    });
    setRowMarks(marked, TIP_ATTRIBUTE, tip.key);
    assert(name.textContent.length > 0, "a row names somebody, or says it cannot");
    return element;
}

/** What a combatant's row is, before it is drawn: the figures, and the colour their kind wears. */
function composeCombatantReading(row: PanelRow, rank: number | null): RowReading {
    assert(row.figure >= 0, "a combatant's figure is never below nothing");
    assert(row.shareText.length > 0, "and their row states a share of the screen");
    return {
        name: row.name ?? PANEL_WORDS.unknown,
        figure: row.figure,
        fill: row.fill,
        shareText: row.shareText,
        // The bar says what somebody is and the name beside it says who, so the colour is never
        // the only thing carrying anything. A combatant the game named no profession for takes
        // the colourless one, which is the absence of a category rather than a category of its own.
        colour: getColourForProfession(row.profession),
        profession: row.profession,
        rank,
    };
}

/**
 * What the second cut of a figure is drawn as. Damage is cut by the kind a blow carried and
 * healing by the key it moved under, so the words and the colour come from the noun rather than
 * from one table asked about both.
 */
function composeElementReading(row: ElementRow, noun: PanelNoun): RowReading {
    assert(row.element.length > 0, "a part of a figure is one the protocol named");
    assert(row.figure >= 0, "and states a figure that is not below nothing");
    return {
        name: noun === "damage"
            ? getWordsForDamageKind(row.element)
            : getWordsForHealthSource(row.element),
        figure: row.figure,
        fill: row.fill,
        shareText: row.shareText,
        // Colourless, like every row that names no combatant: a hue on this panel says **who**
        // somebody is, and a kind of damage is not somebody. The row is worded outright, so
        // nothing is lost by the bar saying nothing.
        colour: getColourForProfession(null),
        profession: null,
        rank: null,
    };
}

/** A figure the protocol left an end off is drawn in the colourless one: unknown is no category. */
function composeUnnamedReading(row: UnnamedRow | PinnedRow, name: string): RowReading {
    assert(row.figure >= 0, "a figure nobody can be charged with is never below nothing");
    assert(name.length > 0, "and the row saying so is labelled");
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

function composeTabElement(
    document: PanelDocument,
    attribute: string,
    tab: ScreenTab,
): PanelElement {
    const marked = tab.isCurrent ? ` ${CLASS.tabCurrent}` : "";
    const element = composeElement(document, "div", `${CLASS.tab}${marked}`);
    element.setAttribute(attribute, tab.name);
    element.textContent = tab.words;
    assert(element.textContent.length > 0, "a tab a reader could press says where it goes");
    assert(tab.name.length > 0, "and names what it would reach");
    return element;
}

/**
 * The upper strip: which quantity. Nothing on a strip is marked while the shelf is up — the shelf
 * covers the screen rather than being one of them, and a strip claiming the reader is on a screen
 * they cannot see is a claim.
 */
function composeNounStripElement(document: PanelDocument, view: PanelView): PanelElement {
    const strip = composeElement(document, "div", CLASS.tabs);
    assert(SCREEN_ORDER.includes(view.current), "the panel is on a screen the strips draw");
    assert(strip.textContent === "", "and the region begins saying nothing of its own");
    for (const tab of composeNounTabs(view.current)) {
        strip.append(composeTabElement(document, SCREEN_ATTRIBUTE, getShownTab(tab, view)));
    }
    return strip;
}

/**
 * The lower strip, which is two controls in one row: which way round, and whose rows.
 *
 * They share a row because the vertical budget is the list's — every strip is a row of the
 * ranking that the reader does not get — and a direction on its own line spends one to say one
 * word. The gap between them is a node rather than a margin, because it is absent with the
 * direction it follows.
 */
function composeDirectionStripElement(document: PanelDocument, view: PanelView): PanelElement {
    const strip = composeElement(document, "div", CLASS.tabs);
    assert(SCREEN_ORDER.includes(view.current), "the panel is on a screen the strips draw");
    for (const tab of composeDirectionTabs(view.current)) {
        strip.append(composeTabElement(document, SCREEN_ATTRIBUTE, getShownTab(tab, view)));
    }
    // The third strip is drawn only where the client said which side is the reader's own: the
    // protocol never does, and a strip offering to narrow to a side nothing can tell apart is
    // three controls that would all list the same people.
    if (!view.hasReaderSide) return strip;
    assert(view.side.length > 0, "a side strip is drawn for a choice the reader has made");
    strip.append(composeElement(document, "span", CLASS.tabsGap));
    for (const tab of composeSideTabs(view.side)) {
        strip.append(composeTabElement(document, SIDE_ATTRIBUTE, getShownTab(tab, view)));
    }
    return strip;
}

function getShownTab(tab: ScreenTab, view: PanelView): ScreenTab {
    assert(tab.words.length > 0, "a tab that is drawn says where it goes");
    assert(typeof view.isOnShelf === "boolean", "and knows whether the shelf covers the screen");
    if (!view.isOnShelf) return tab;
    return { ...tab, isCurrent: false };
}

/**
 * The bar's one control that says what a press would **do** rather than what the panel is, which
 * is why the mark and the sentence both change with the state.
 */
function composeFoldControl(document: PanelDocument, isCollapsed: boolean): PanelElement {
    const control = composeElement(document, "span", CLASS.control);
    control.textContent = isCollapsed ? UNFOLD_MARK : FOLD_MARK;
    control.setAttribute(FOLD_ATTRIBUTE, "");
    control.setAttribute(TITLE_ATTRIBUTE, isCollapsed ? PANEL_WORDS.expand : PANEL_WORDS.collapse);
    assert(control.textContent.length > 0, "a control a reader could press wears a mark");
    assert(control.className === CLASS.control, "and is a control by name before it is pressed");
    return control;
}

/** The three controls that say nothing about the state: they do the same on every screen. */
function composeBarControl(
    document: PanelDocument,
    stated: { className: string; mark: string; attribute: string; words: string },
): PanelElement {
    const control = composeElement(document, "span", stated.className);
    control.textContent = stated.mark;
    control.setAttribute(stated.attribute, "");
    control.setAttribute(TITLE_ATTRIBUTE, stated.words);
    assert(control.textContent.length > 0, "a control a reader could press wears a mark");
    assert(stated.attribute.startsWith("data-"), "and asks for what it does by an attribute");
    return control;
}

function composeTitleElement(document: PanelDocument, isCollapsed: boolean): PanelElement {
    const bar = composeElement(document, "div", CLASS.title);
    // Set before the controls are appended, not after: `textContent` replaces every child, so
    // the other order would wipe them.
    bar.textContent = `${GRIP_MARK}${PANEL_WORDS.title}`;
    bar.setAttribute(TITLE_ATTRIBUTE, PANEL_WORDS.drag);
    setGripMark(bar);
    assert(bar.textContent.length > 0, "the panel says whose it is before anything else");
    const version = composeElement(document, "span", CLASS.titleVersion);
    version.textContent = BUILD_VERSION;
    bar.append(version);
    assert(version.textContent.length > 0, "and which build of it a reader is looking at");
    bar.append(composeBarControl(document, {
        className: `${CLASS.control} ${CLASS.controlFights}`,
        mark: SHELF_MARK,
        attribute: SHELF_ATTRIBUTE,
        words: PANEL_WORDS.openFights,
    }));
    bar.append(composeBarControl(document, {
        className: `${CLASS.control} ${CLASS.controlCopy}`,
        mark: COPY_MARK,
        attribute: COPY_ATTRIBUTE,
        words: PANEL_WORDS.copyReport,
    }));
    bar.append(composeBarControl(document, {
        className: `${CLASS.control} ${CLASS.controlRaw}`,
        mark: SAVE_MARK,
        attribute: SAVE_ATTRIBUTE,
        words: PANEL_WORDS.saveRecording,
    }));
    bar.append(composeFoldControl(document, isCollapsed));
    return bar;
}

/** The fight as a headcount, and where it is being fought on a line of its own. */
function composeHeaderElement(document: PanelDocument, view: PanelView): PanelElement {
    const header = composeElement(document, "div", CLASS.header);
    const line = composeElement(document, "div", CLASS.headerLine);
    const who = composeElement(document, "span", "");
    who.textContent = composeSideCountsText(view.reading.sizes, view.reading.unplaced);
    line.append(who);
    // Absent rather than empty where the game has not said, or has said nothing this seat can be
    // read into: a fight the panel cannot place is not a fight it may call a loss.
    const outcome = view.reading.outcome;
    if (outcome !== null) {
        const said = composeElement(document, "span", CLASS.headerOutcome);
        said.textContent = getWordsForOutcome(outcome);
        line.append(said);
    }
    header.append(line);
    assert(who.textContent.length > 0, "a header says what the fight is, even where it is nothing");
    if (view.place === null) return header;
    assert(view.place.length > 0, "a place that is drawn says something");
    // A line of its own, and only where there is something to put on it: beside the headcount a
    // map's name plus a tile is the one thing on the header that would be cut.
    const place = composeElement(document, "div", CLASS.headerPlace);
    place.textContent = view.place;
    place.setAttribute(TITLE_ATTRIBUTE, view.place);
    header.append(place);
    return header;
}

/**
 * The way back, and what stands over the screen: whose row was opened, or the shelf. The shelf is
 * not one of the fight's screens, so what it says is the shelf's own name rather than a figure.
 */
function composeCrumbRegion(document: PanelDocument, view: PanelView): PanelElement {
    assert(typeof view.isOnShelf === "boolean", "a crumb is drawn for a panel that is somewhere");
    assert(SCREEN_ORDER.includes(view.current), "and on a screen the strips draw");
    // The way off the shelf goes back to the fight, which is not a place on the shelf.
    if (view.isOnShelf) {
        return composeCrumbElement(document, PANEL_WORDS.fights, PANEL_WORDS.backFromFights);
    }
    if (view.drill === null) return composeSlotElement(document);
    // One rung at a time: the way back off a pair goes to the person it was opened from, and the
    // way back off that goes to the roster.
    const opened = view.drill.name ?? PANEL_WORDS.unknown;
    if (view.skill !== null) return composeCrumbElement(document, view.skill.name, opened);
    if (view.pair === null) return composeCrumbElement(document, opened);
    return composeCrumbElement(document, view.pair.otherName ?? PANEL_WORDS.unknown, opened);
}

function composeCrumbElement(
    document: PanelDocument,
    said: string,
    /** Where the way back leads, where that is a person rather than the roster. */
    from: string | null = null,
): PanelElement {
    assert(said.length > 0, "what stands over the screen is named before the way back is drawn");
    const crumb = composeElement(document, "div", CLASS.crumb);
    const back = composeElement(document, "span", CLASS.crumbBack);
    back.textContent = `${BACK_MARK}${from ?? PANEL_WORDS.back}`;
    back.setAttribute(BACK_ATTRIBUTE, PANEL_WORDS.back);
    const here = composeElement(document, "span", CLASS.crumbHere);
    here.textContent = said;
    // It cuts the way a row does, and it names whatever was opened — so it is the one place a
    // reader can no longer see what they pressed.
    here.setAttribute(TITLE_ATTRIBUTE, here.textContent);
    crumb.append(back);
    crumb.append(here);
    assert(back.textContent.startsWith(BACK_MARK), "the way back is marked as the way back");
    assert(here.textContent.length > 0, "the row standing open names somebody, or says it cannot");
    return crumb;
}

/**
 * Whether a cut says anything the figure above it does not.
 *
 * One row carrying the whole of a figure is that figure again under another heading, and three
 * such sections in a row read as a panel that has run out of things to say. The list a level is
 * **about** is always drawn; only the cross-sections beside it answer to this.
 */
function getIsRepetition(
    rows: readonly { figure: number }[],
    extra: { figure: number } | null,
    total: number,
): boolean {
    assert(total >= 0, "a figure a cut stands under is never below nothing");
    assert(rows.length >= 0, "and a cut holds the rows it holds, however few");
    if (extra !== null) return rows.length === 0 && extra.figure === total;
    return rows.length === 1 && (rows[0]?.figure ?? 0) === total;
}

/** A heading over one cut, with the total it stands over, so two lists never read as one. */
function composeSectionElement(
    document: PanelDocument,
    heading: string,
    total: number,
): PanelElement {
    assert(heading.length > 0, "a cut that is drawn says what it is cut by");
    assert(total >= 0, "and states the figure it stands over");
    const section = composeElement(document, "div", CLASS.section);
    const words = composeElement(document, "span", "");
    words.textContent = heading;
    const figure = composeElement(document, "span", "");
    figure.textContent = composeFigureText(total);
    section.append(words);
    section.append(figure);
    return section;
}

function composeEmptyElement(document: PanelDocument, words: string): PanelElement {
    assert(words.length > 0, "a list with nothing on it says so in words");
    const empty = composeElement(document, "div", CLASS.empty);
    empty.textContent = words;
    assert(empty.textContent === words, "and says exactly that");
    return empty;
}

/** The one list with nothing above the sentence, so the sentence is what the box is for. */
function composeWaitingElement(document: PanelDocument): PanelElement {
    const list = composeListElement(document, ROWS_WAITING);
    list.className = `${CLASS.list} ${CLASS.listWaiting}`;
    list.append(composeEmptyElement(document, PANEL_WORDS.noFightYet));
    assert(list.className.includes(CLASS.list), "a panel waiting is a panel at the list's height");
    assert(ROWS_WAITING > 0, "which is a height of at least one row");
    return list;
}

/** The list, which is the one region that scrolls and the one that gives way to the ceiling. */
function composeListElement(document: PanelDocument, visibleRows: number): PanelElement {
    assert(visibleRows > 0, "a list stands at a height of at least one row");
    assert(Number.isSafeInteger(visibleRows), "and at a whole number of them");
    const list = composeElement(document, "div", CLASS.list);
    list.setAttribute(STYLE_ATTRIBUTE, `${ROWS_VARIABLE}:${composeFigureText(visibleRows)}`);
    return list;
}

function composeRankingElement(
    document: PanelDocument,
    reading: PanelReading,
    metric: PanelMetric,
    register: TipRegister,
): PanelElement {
    const list = composeListElement(document, reading.visibleRows);
    assert(reading.rows.length <= MAXIMUM_ROWS, "a screen stays inside the fight's stated bound");
    if (reading.rows.length === 0) {
        list.append(composeEmptyElement(document, PANEL_WORDS.nothingYet));
        return list;
    }
    const figure = getWordsForScreen(metric);
    assert(figure.length > 0, "a row states what its figure is a figure of");
    for (const [at, row] of reading.rows.entries()) {
        const tip = { register, key: `row:${row.combatantId}`, figure, share: PANEL_WORDS.share };
        const reader = composeCombatantReading(row, at + 1);
        list.append(composeRowElement(document, reader, `${row.combatantId}`, tip));
    }
    return list;
}

/**
 * The fights on the shelf, newest first: when, how big, where, and how it went.
 *
 * The size stands before the place and not after it, so the one cell that can be cut is the last
 * one. Written the other way round the size sits in the elastic cell, and a long map name pushes
 * it off the end of the row.
 */
function composeShelfElement(
    document: PanelDocument,
    view: PanelView,
    register: TipRegister,
): PanelElement {
    const list = composeListElement(document, view.reading.visibleRows);
    assert(view.shelf.length >= 0, "a shelf holds what it holds");
    assert(view.isOnShelf, "and is drawn where the reader asked for it");
    if (view.shelf.length === 0) {
        list.append(composeEmptyElement(document, PANEL_WORDS.shelfEmpty));
        return list;
    }
    for (const fight of view.shelf) list.append(composeShelfRow(document, fight, register));
    return list;
}

function composeShelfRow(
    document: PanelDocument,
    fight: ShelfRow,
    register: TipRegister,
): PanelElement {
    assert(fight.openedAt >= 0, "a fight on the shelf was kept at a moment");
    assert(fight.sizes.every((one) => one > 0), "and a side of it that is counted has somebody");
    const chosen = fight.isChosen ? ` ${CLASS.rowChosen}` : "";
    const row = composeElement(document, "div", `${CLASS.row} ${CLASS.rowDrillable}${chosen}`);
    const time = composeElement(document, "span", CLASS.rowRank);
    time.textContent = getWordsForShelfTime(fight.at, fight.isLive);
    const size = composeElement(document, "span", CLASS.rowSize);
    size.textContent = composeShelfSizeText(fight.sizes);
    const where = composeElement(document, "span", CLASS.rowName);
    where.textContent = fight.place ?? "";
    const outcome = composeElement(document, "span", CLASS.rowValue);
    outcome.textContent = getWordsForShelfOutcome(fight.outcome, fight.isLive);
    for (const part of [time, size, where, outcome]) row.append(part);
    const parts = [row, time, size, where, outcome];
    // The place is the elastic cell, so the tile it loses to an ellipsis is what the detail gives
    // back: a coordinate cut in half reads as a coordinate and is not one.
    register.add(`shelf:${fight.openedAt}`, {
        name: fight.place ?? PANEL_WORDS.unknown,
        figure: null,
        share: null,
    });
    setRowMarks(parts, TIP_ATTRIBUTE, `shelf:${fight.openedAt}`);
    // The one going on now is asked for by a word rather than by a moment: a moment would have
    // to be one no kept fight could carry, and there is no such moment.
    setRowMarks(parts, FIGHT_ATTRIBUTE, fight.isLive ? LIVE_FIGHT : `${fight.openedAt}`);
    assert(row.className.includes(CLASS.row), "a fight on the shelf is a row like any other");
    return row;
}

/** One cut of an opened figure: its heading, its rows, and what the protocol named nobody for. */
function composeOpponentSection(
    document: PanelDocument,
    list: PanelElement,
    drill: DrillReading,
    stated: { metric: PanelMetric; register: TipRegister; figure: string },
): void {
    const cut = drill.byOpponent;
    assert(cut.rows.length <= MAXIMUM_ROWS, "an opened row stays inside the fight's bound");
    if (cut.rows.length === 0 && cut.unnamed === null) return;
    const heading = getWordsForOpponentCut(stated.metric);
    assert(heading.length > 0, "a cut says what it is cut by");
    assert(drill.total >= 0, "and stands under a figure that is not below nothing");
    list.append(composeSectionElement(document, heading, drill.total));
    const share = PANEL_WORDS.shareOfFigure;
    for (const row of cut.rows) {
        const tip = {
            register: stated.register,
            key: `to:${row.combatantId}`,
            ...{
                figure: stated.figure,
                share,
            },
        };
        // A row opens where the level under it would say something this one does not — the rest
        // are leaves, and a press on one of them is a press on nothing.
        const opens = row.opensPair ? `${row.combatantId}` : null;
        list.append(composeRowElement(document, composeCombatantReading(row, null), opens, tip));
    }
    if (cut.unnamed === null) return;
    // Which end is missing is the direction's: a given screen names no receiver, a received one
    // names nobody who did it.
    const words = stated.metric === "damageDealtApplied" || stated.metric === "healthGiven"
        ? PANEL_WORDS.withoutTarget
        : PANEL_WORDS.withoutActor;
    const tip = { register: stated.register, key: "to:nobody", figure: stated.figure, share };
    list.append(
        composeRowElement(document, composeUnnamedReading(cut.unnamed, words), null, tip),
    );
}

/**
 * What a figure was done with: the skills an announcement named, and the row that closes them.
 *
 * Drawn on the one screen the protocol states it for. What hit you is named and what the other
 * side chose never is, so a received screen has no such section — and the reading hands over an
 * empty cut rather than this being said twice.
 */
function composeSkillSection(
    document: PanelDocument,
    list: PanelElement,
    drill: DrillReading,
    stated: { register: TipRegister; figure: string },
): void {
    const cut = drill.bySkill;
    assert(cut.rows.length <= MAXIMUM_SKILLS, "a cut stays inside the bound it is kept to");
    if (cut.rows.length === 0 && cut.plain === null) return;
    // Unless the one row counts something. `Zwykły cios 2 644 (100% · ×8)` says eight blows where
    // the figure above says none, and how many times is the whole question a plain attack raises.
    const counts = cut.plain !== null && cut.plain.blows > 0;
    if (!counts && getIsRepetition(cut.rows, cut.plain, drill.total)) return;
    list.append(composeSectionElement(document, PANEL_WORDS.skills, drill.total));
    const share = PANEL_WORDS.shareOfFigure;
    for (const row of cut.rows) {
        const tip = {
            register: stated.register,
            key: `skill:${row.name}`,
            figure: stated.figure,
            share,
        };
        const element = composeRowElement(document, composeSkillRowReading(row), null, tip);
        // A skill opens onto who it reached, where that is anybody but the row it was opened
        // from — every other skill row is a leaf.
        if (row.opensSkill) setRowMarks([element], SKILL_ATTRIBUTE, row.name);
        list.append(element);
    }
    if (cut.plain === null) return;
    const tip = { register: stated.register, key: "skill:plain", figure: stated.figure, share };
    const reading = {
        ...composeUnnamedReading(cut.plain, PANEL_WORDS.plainBlow),
        uses: cut.plain.blows,
    };
    list.append(composeRowElement(document, reading, null, tip));
}

/** A skill wears no hue either: what it is is said in the name the announcement carried. */
function composeSkillRowReading(row: SkillRow): RowReading {
    assert(row.name.length > 0, "a skill drawn is one an announcement named");
    assert(row.figure >= 0, "and states a figure that is not below nothing");
    return {
        name: row.name,
        figure: row.figure,
        fill: row.fill,
        shareText: row.shareText,
        colour: getColourForProfession(null),
        profession: null,
        rank: null,
        uses: row.uses,
    };
}

function composeElementSection(
    document: PanelDocument,
    list: PanelElement,
    drill: DrillReading,
    stated: { metric: PanelMetric; register: TipRegister; figure: string },
): void {
    const cut = drill.byElement;
    assert(cut.rows.length <= MAXIMUM_KINDS, "a cut stays inside the bound it is kept to");
    assert(drill.total >= 0, "a cut stands under a figure that is not below nothing");
    // The reading is what says whether there is a cut at all: a screen without one hands over an
    // empty one rather than being named here a second time.
    if (cut.rows.length === 0 && cut.unnamed === null) return;
    if (getIsRepetition(cut.rows, cut.unnamed, drill.total)) return;
    list.append(composeSectionElement(document, getWordsForKindCut(stated.metric), drill.total));
    const noun = getNounForScreen(stated.metric);
    const share = PANEL_WORDS.shareOfFigure;
    for (const row of cut.rows) {
        const tip = {
            register: stated.register,
            key: `kind:${row.element}`,
            figure: stated.figure,
            share,
        };
        list.append(composeRowElement(document, composeElementReading(row, noun), null, tip));
    }
    if (cut.unnamed === null) return;
    const tip = { register: stated.register, key: "kind:nobody", figure: stated.figure, share };
    const reading = composeUnnamedReading(cut.unnamed, PANEL_WORDS.withoutKind);
    list.append(composeRowElement(document, reading, null, tip));
}

/**
 * How tall the list stands with a row open: what the cuts need, and never less than the ranking
 * it was opened from.
 *
 * A breakdown reached from a list of eleven must not shorten the window under the hand that
 * pressed it, and a breakdown longer than eleven must not be cut off in the middle of a section —
 * the ceiling on the host is what stops either from reaching past the bottom of the screen.
 */
function getRowsForDrill(drill: DrillReading, floor: number): number {
    assert(floor > 0, "a list stands at a height of at least one row");
    const sections = [drill.byOpponent, drill.byElement];
    let needed = 0;
    for (const cut of sections) {
        if (cut.rows.length === 0 && cut.unnamed === null) continue;
        // A section costs its rows, the part named for nobody, and the heading standing over them.
        needed += cut.rows.length + (cut.unnamed === null ? 0 : 1) + 1;
    }
    if (drill.bySkill.rows.length > 0 || drill.bySkill.plain !== null) {
        needed += drill.bySkill.rows.length + (drill.bySkill.plain === null ? 0 : 1) + 1;
    }
    assert(needed >= 0, "a cut costs no less than nothing");
    return Math.max(needed, floor);
}

/**
 * One row opened: the same figure cut twice — by the other end of each blow, and by the kind of
 * damage it carried. Neither cut is opened any further, and a cut with nothing in it draws no
 * heading: a blow the protocol tied to nobody still states what it was dealt with, so the kinds
 * can stand alone.
 */
function composeDrillElement(
    document: PanelDocument,
    view: PanelView,
    drill: DrillReading,
    register: TipRegister,
): PanelElement {
    const list = composeListElement(document, getRowsForDrill(drill, view.reading.visibleRows));
    const figure = getWordsForScreen(view.current);
    assert(figure.length > 0, "an opened row states what its figure is a figure of");
    composeOpponentSection(document, list, drill, { metric: view.current, register, figure });
    composeSkillSection(document, list, drill, { register, figure });
    composeElementSection(document, list, drill, { metric: view.current, register, figure });
    assert(drill.total >= 0, "a figure opened is never below nothing");
    // A person the reader is still reading, on a screen they did nothing on: the strips carry
    // them from screen to screen, so this is one press away and is said in words rather than
    // left as an empty box.
    if (drill.total === 0) {
        list.append(composeEmptyElement(document, getWordsForNothing(view.current)));
    }
    return list;
}

/** One part of the track, or nothing where that part of the fight is nothing. */
function composeSidesPart(
    document: PanelDocument,
    share: number,
    className: string,
): PanelElement | null {
    assert(share >= 0, "a part of the track is never below nothing");
    assert(className.length > 0, "and says whose part of it that is");
    if (share <= 0) return null;
    const part = composeElement(document, "span", className);
    const width = composeDecimalText(Math.min(share, 1) * AS_PERCENT, FILL_PLACES);
    // The length is data and the colour is not: the segment paints itself in its own ink.
    part.setAttribute(STYLE_ATTRIBUTE, `width:${width}%`);
    return part;
}

/**
 * The fight in two figures and a track, and the one region that always draws where the client
 * said which side is the reader's own.
 *
 * **Fight-scope even under a side tab and inside an opened row**: what it answers is how the
 * fight is going, and that does not change when the ranking narrows — only the label does. The
 * two colours are not good and bad: they are two sides, and each stands beside a figure and a
 * label, so no meaning rides on the hue alone.
 */
function composeSidesElement(document: PanelDocument, view: PanelView): PanelElement {
    const sides = view.reading.sides;
    assert(sides !== null, "a strip of two sides is drawn where there are two to tell apart");
    const block = composeElement(document, "div", CLASS.sides);
    assert(sides.ours >= 0, "a side's own figure is never below nothing");
    assert(sides.theirs >= 0, "and neither is the other's");
    const line = composeElement(document, "div", CLASS.sidesLine);
    const ours = composeElement(document, "span", CLASS.sidesOurs);
    ours.textContent = composeFigureText(sides.ours);
    const label = composeElement(document, "span", CLASS.sidesLabel);
    label.textContent = composeSidesLabel(view);
    const theirs = composeElement(document, "span", CLASS.sidesTheirs);
    theirs.textContent = composeFigureText(sides.theirs);
    line.append(ours);
    line.append(label);
    line.append(theirs);
    block.append(line);
    composeSidesTrack(document, block, sides);
    if (sides.nobody > 0) block.append(composeSidesSpare(document, sides.nobody));
    return block;
}

/** Three parts and not two: what belongs to neither side is drawn rather than left out. */
function composeSidesTrack(
    document: PanelDocument,
    block: PanelElement,
    sides: PanelSides,
): void {
    const whole = sides.ours + sides.theirs + sides.nobody;
    assert(whole >= 0, "a fight totals no less than nothing");
    if (whole <= 0) return;
    assert(sides.nobody >= 0, "and neither is what belongs to neither of them");
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

/** Below the track rather than beside the two figures: it is not a third contestant. */
function composeSidesSpare(document: PanelDocument, figure: number): PanelElement {
    assert(figure > 0, "what belongs to no side is drawn because there is some of it");
    const spare = composeElement(
        document,
        "div",
        `${CLASS.sidesLine} ${CLASS.sidesSpare} ${CLASS.sidesNobody}`,
    );
    const label = composeElement(document, "span", CLASS.sidesLabel);
    label.textContent = PANEL_WORDS.withoutSide;
    const stated = composeElement(document, "span", "");
    stated.textContent = composeFigureText(figure);
    spare.append(label);
    spare.append(stated);
    assert(label.textContent.length > 0, "what belongs to no side says so before it says how much");
    return spare;
}

/** The strip totals the fight; the label says so wherever the list above it shows less. */
function composeSidesLabel(view: PanelView): string {
    const sides = `${PANEL_WORDS.ourSide} / ${PANEL_WORDS.theirSide}`;
    assert(sides.length > 0, "the two sides are named before they are totalled");
    assert(SCREEN_ORDER.includes(view.current), "and totalled on a screen the strips draw");
    if (view.side === "everyone" && view.drill === null) return sides;
    return `${PANEL_WORDS.wholeFight} · ${sides}`;
}

/**
 * A region that cannot be drawn is replaced by a marker at its own size, and the panel keeps its
 * shape. This is one of the four boundaries, and the only broad catch in this file.
 */
function composeRegion(
    document: PanelDocument,
    region: PanelRegion,
    compose: () => PanelElement,
    handleFailure: (failure: unknown) => void,
): PanelElement {
    assert(typeof compose === "function", "a region is drawn by something");
    assert(typeof handleFailure === "function", "and a failure of one is reported to somebody");
    try {
        return compose();
    } catch (failure) {
        handleFailure(failure);
        const undrawn = composeElement(document, "div", CLASS.undrawn);
        undrawn.textContent = composeUndrawnText(region);
        return undrawn;
    }
}

/** Everything one drawing of the panel is: the figures, the screen, and the fights behind it. */
export interface PanelView {
    reading: PanelReading;
    current: PanelMetric;
    /** Whose rows the ranking lists, and whether the client said enough for the strip to draw. */
    side: PanelSideChoice;
    hasReaderSide: boolean;
    shelf: readonly ShelfRow[];
    isOnShelf: boolean;
    /** The row standing open over the screen, or nobody's. */
    drill: DrillReading | null;
    /** The pair standing open over that, which is the last rung and opens nothing further. */
    pair: PairReading | null;
    /** Or the skill standing open over it, which is the other last rung and opens nothing. */
    skill: SkillReading | null;
    /** Where the fight is being fought, already in words. Null where the client would not say. */
    place: string | null;
    /** Folded to the title bar. What is under it is composed empty, never drawn and hidden. */
    isCollapsed: boolean;
}

/** What a press asked for, read off the pressed element's own attribute. */
export type PanelPress =
    | { kind: "screen"; screen: string }
    | { kind: "side"; side: string }
    | { kind: "row"; stated: string }
    | { kind: "skill"; name: string }
    | { kind: "fight"; stated: string }
    | { kind: "back" }
    | { kind: "fold" }
    | { kind: "save" }
    | { kind: "copy" }
    | { kind: "shelf" };

/** The shelf stands over an opened row, an opened row over the screen, and a pair over that. */
function composeViewList(
    document: PanelDocument,
    view: PanelView,
    register: TipRegister,
): PanelElement {
    assert(SCREEN_ORDER.includes(view.current), "a view is on a screen the strip draws");
    assert(view.shelf.length >= 0, "and carries the fights behind it, however few");
    if (view.isOnShelf) return composeShelfElement(document, view, register);
    if (view.skill !== null) return composeSkillElement(document, view, view.skill, register);
    if (view.pair !== null) return composePairElement(document, view, view.pair, register);
    if (view.drill !== null) {
        return composeDrillElement(document, view, view.drill, register);
    }
    return composeRankingElement(document, view.reading, view.current, register);
}

/** One skill opened: who it reached. The other last rung, and nothing on it opens either. */
function composeSkillElement(
    document: PanelDocument,
    view: PanelView,
    skill: SkillReading,
    register: TipRegister,
): PanelElement {
    const rows = skill.byOpponent.rows.length + (skill.byOpponent.unnamed === null ? 0 : 1);
    assert(rows > 0, "a skill that opens reached somebody");
    const list = composeListElement(document, Math.max(rows + 1, view.reading.visibleRows));
    const figure = getWordsForScreen(view.current);
    assert(skill.total >= 0, "a skill opened states a figure that is not below nothing");
    assert(skill.name.length > 0, "and the name it was announced under");
    const heading = `${PANEL_WORDS.dealtTo} — ${skill.name}`;
    list.append(composeSectionElement(document, heading, skill.total));
    const share = PANEL_WORDS.shareOfFigure;
    for (const row of skill.byOpponent.rows) {
        const tip = { register, key: `reached:${row.combatantId}`, figure, share };
        list.append(composeRowElement(document, composeCombatantReading(row, null), null, tip));
    }
    return list;
}

/**
 * One pair opened: what one of them did to the other, cut by the skills announced for it and by
 * what those blows carried. The last rung — nothing here opens any further.
 */
function composePairElement(
    document: PanelDocument,
    view: PanelView,
    pair: PairReading,
    register: TipRegister,
): PanelElement {
    const list = composeListElement(document, getRowsForPair(pair, view.reading.visibleRows));
    const figure = getWordsForScreen(view.current);
    assert(figure.length > 0, "a pair states what its figure is a figure of");
    assert(pair.total >= 0, "and a figure that is not below nothing");
    const share = PANEL_WORDS.shareOfFigure;
    composePairSkills(document, list, pair, { register, figure, share });
    composePairKinds(document, list, pair, { register, figure, share });
    return list;
}

/** The skills one of them announced against the other, and what stood behind none. */
function composePairSkills(
    document: PanelDocument,
    list: PanelElement,
    pair: PairReading,
    stated: { register: TipRegister; figure: string; share: string },
): void {
    const cut = pair.bySkill;
    assert(cut.rows.length <= MAXIMUM_SKILLS, "a cut stays inside the bound it is kept to");
    if (cut.rows.length === 0 && cut.plain === null) return;
    const named = pair.otherName ?? PANEL_WORDS.unknown;
    list.append(composeSectionElement(
        document,
        `${PANEL_WORDS.skillsAgainst} — ${named}`,
        pair.total,
    ));
    for (const row of cut.rows) {
        const tip = { ...stated, key: `pair-skill:${row.name}` };
        const element = composeRowElement(document, composeSkillRowReading(row), null, tip);
        // A skill opens onto who it reached, where that is anybody but the row it was opened
        // from — every other skill row is a leaf.
        if (row.opensSkill) setRowMarks([element], SKILL_ATTRIBUTE, row.name);
        list.append(element);
    }
    if (cut.plain === null) return;
    const tip = { ...stated, key: "pair-skill:plain" };
    const reading = composeUnnamedReading(cut.plain, PANEL_WORDS.plainBlow);
    list.append(composeRowElement(document, reading, null, tip));
}

/** What the blows between the two carried, under the heading every damage cut wears. */
function composePairKinds(
    document: PanelDocument,
    list: PanelElement,
    pair: PairReading,
    stated: { register: TipRegister; figure: string; share: string },
): void {
    const cut = pair.byElement;
    assert(cut.rows.length <= MAXIMUM_KINDS, "a cut stays inside the bound it is kept to");
    if (cut.rows.length === 0) return;
    if (getIsRepetition(cut.rows, cut.unnamed, pair.total)) return;
    list.append(composeSectionElement(document, PANEL_WORDS.damageKind, pair.total));
    for (const row of cut.rows) {
        const tip = { ...stated, key: `pair-kind:${row.element}` };
        list.append(composeRowElement(document, composeElementReading(row, "damage"), null, tip));
    }
}

/** The same arithmetic the level above uses: what the cuts need, never below the ranking's own. */
function getRowsForPair(pair: PairReading, floor: number): number {
    assert(floor > 0, "a list stands at a height of at least one row");
    assert(pair.total >= 0, "and holds a figure that is not below nothing");
    const skills = pair.bySkill.rows.length + (pair.bySkill.plain === null ? 0 : 1);
    const kinds = pair.byElement.rows.length;
    const needed = (skills === 0 ? 0 : skills + 1) + (kinds === 0 ? 0 : kinds + 1);
    return Math.max(needed, floor);
}

/** One pinned figure, in a block of its own, so a failure is the size of one row. */
function composePinnedElement(
    document: PanelDocument,
    row: PinnedRow,
    register: TipRegister,
    figure: string,
): PanelElement {
    const block = composeElement(document, "div", CLASS.pinned);
    const words = row.end === "actor" ? PANEL_WORDS.withoutActor : PANEL_WORDS.withoutTarget;
    const tip = { register, key: `pinned:${row.end}`, figure, share: PANEL_WORDS.share };
    block.append(composeRowElement(document, composeUnnamedReading(row, words), null, tip));
    assert(row.figure > 0, "a figure is pinned because there is one to pin");
    assert(block.className === CLASS.pinned, "and the block saying so is one of its own");
    return block;
}

/** What a press means, read off the pressed element rather than off a handler bound to it. */
function getPressFromTarget(
    target: { getAttribute(name: string): string | null },
): PanelPress | null {
    assert(typeof target.getAttribute === "function", "a press landed on something readable");
    assert(SCREEN_ATTRIBUTE.startsWith("data-"), "and what it asks for is read off an attribute");
    const screen = target.getAttribute(SCREEN_ATTRIBUTE);
    if (screen !== null) return { kind: "screen", screen };
    const side = target.getAttribute(SIDE_ATTRIBUTE);
    if (side !== null) return { kind: "side", side };
    const stated = target.getAttribute(ROW_ATTRIBUTE);
    if (stated !== null) return { kind: "row", stated };
    const name = target.getAttribute(SKILL_ATTRIBUTE);
    if (name !== null) return { kind: "skill", name };
    const fight = target.getAttribute(FIGHT_ATTRIBUTE);
    if (fight !== null) return { kind: "fight", stated: fight };
    if (target.getAttribute(SAVE_ATTRIBUTE) !== null) return { kind: "save" };
    if (target.getAttribute(COPY_ATTRIBUTE) !== null) return { kind: "copy" };
    if (target.getAttribute(SHELF_ATTRIBUTE) !== null) return { kind: "shelf" };
    if (target.getAttribute(FOLD_ATTRIBUTE) !== null) return { kind: "fold" };
    if (target.getAttribute(BACK_ATTRIBUTE) !== null) return { kind: "back" };
    return null;
}

/**
 * The four listeners, all of them at the root and none of them on a row.
 *
 * A press inside a shadow root is retargeted for anybody listening outside it, so the host is the
 * wrong place for any of these — and what a listener is handed is the deepest element under the
 * pointer, which is why every part of a row wears the row's own marks.
 *
 * The press and never the click: a browser assembles a click out of two moments and dispatches it
 * only if both resolve to a node still in the tree, so a payload landing between the press and
 * the release would detach what was pressed and dispatch nothing at all.
 */
function setPanelRootListeners(
    root: PanelRoot,
    handlePress: (press: PanelPress) => void,
    handleHover: (key: string | null, clientY: number) => void,
): void {
    assert(typeof handlePress === "function", "a press reaches somebody who can act on it");
    assert(typeof handleHover === "function", "and so does the pointer that opens the detail");
    root.addEventListener(PRESS_EVENT, (event) => {
        // The primary button alone: without this a right press would open a row and the listener
        // below would step straight back out of it, which is worse than either half.
        if ((event.button ?? PRIMARY_BUTTON) !== PRIMARY_BUTTON) return;
        const target = event.target;
        if (target === null) return;
        const press = getPressFromTarget(target);
        if (press !== null) handlePress(press);
    });
    // One gesture in, one gesture out, and the way out works from anywhere on the panel: a back
    // control alone would make the cheapest gesture the one that needs aiming.
    root.addEventListener(BACK_EVENT, (event) => {
        event.preventDefault?.();
        handlePress({ kind: "back" });
    });
    root.addEventListener(MOVE_EVENT, (event) => {
        const target = event.target;
        handleHover(target === null ? null : target.getAttribute(TIP_ATTRIBUTE), event.clientY);
    });
    root.addEventListener(LEAVE_EVENT, (event) => handleHover(null, event.clientY));
}

/** The panel on the page, and the way to put a new view into the one that is already there. */
export interface PanelHandle {
    element: PanelElement;
    show(view: PanelView): void;
    /**
     * What the panel says before a fight has reached it, drawn at the height a ranking stands at.
     *
     * A body appearing as a strip under its own bar is the shape a folded panel has, which is the
     * whole reason this exists: with no draw at all before the first payload, an add-on waiting
     * for a fight and one that died on the way to the page are the same picture.
     */
    showWaiting(isCollapsed: boolean): void;
}

/** One region redrawn in place, handing back what now stands where the old one did. */
function composeRegionInPlace(
    document: PanelDocument,
    standing: PanelElement,
    region: PanelRegion,
    compose: () => PanelElement,
    handleFailure: (failure: unknown) => void,
): PanelElement {
    assert(standing.className.length > 0, "a region gives way to another, never to nothing");
    const next = composeRegion(document, region, compose, handleFailure);
    standing.replaceWith(next);
    assert(next.className.length > 0, "a region that took another's place is a region of its own");
    return next;
}

/** Every region the panel keeps a place for, in the order a reader meets them. */
interface PanelRegions {
    title: PanelElement;
    header: PanelElement;
    nouns: PanelElement;
    directions: PanelElement;
    crumb: PanelElement;
    list: PanelElement;
    pinnedActor: PanelElement;
    pinnedTarget: PanelElement;
    sides: PanelElement;
    warnings: PanelElement;
}

function composePanelRegions(document: PanelDocument): PanelRegions {
    const regions = {
        title: composeElement(document, "div", CLASS.title),
        header: composeSlotElement(document),
        nouns: composeSlotElement(document),
        directions: composeSlotElement(document),
        crumb: composeSlotElement(document),
        list: composeSlotElement(document),
        pinnedActor: composeSlotElement(document),
        pinnedTarget: composeSlotElement(document),
        sides: composeSlotElement(document),
        warnings: composeSlotElement(document),
    };
    assert(regions.title.className === CLASS.title, "the bar is the bar before anything is drawn");
    assert(regions.warnings.className === CLASS.slot, "and every other begins as a slot");
    return regions;
}

/**
 * The host is built once and stays. Only the regions inside it are replaced, so the listener at
 * the root outlives every redraw and a press during one is not swallowed.
 *
 * The press is read off the pressed element's own attribute, which is what makes one listener
 * enough: no row and no tab ever carries a handler of its own.
 */
export function composePanelHost(
    document: PanelDocument,
    handlePress: (press: PanelPress) => void,
    handleFailure: (failure: unknown) => void,
    /** Where the panel sits, and where a reader may move it to. Null leaves it in its corner. */
    placement: PanelPlacement | null = null,
): PanelHandle {
    const host = document.createElement("div");
    assert(HOST_NAME.startsWith("MargoMeter-"), "the host is named as ours before anything else");
    host.setAttribute("id", HOST_NAME);
    host.setAttribute(VERSION_ATTRIBUTE, BUILD_VERSION);
    const root = host.attachShadow({ mode: "open" });
    // The sheet is put in once and never replaced: a region redrawn under it keeps its look, and
    // a browser re-parses nothing on a redraw.
    const sheet = document.createElement("style");
    sheet.textContent = composeStyleSheet();
    root.append(sheet);
    assert(sheet.textContent.length > 0, "the panel is handed its look before it draws anything");
    const regions = composePanelRegions(document);
    const frame = composeElement(document, "div", CLASS.frame);
    const panel = composeElement(document, "div", CLASS.panel);
    for (const region of [regions.header, regions.nouns, regions.directions, regions.crumb]) {
        panel.append(region);
    }
    for (const region of [regions.list, regions.pinnedActor, regions.pinnedTarget]) {
        panel.append(region);
    }
    panel.append(regions.sides);
    panel.append(regions.warnings);
    frame.append(panel);
    const redraw = (standing: PanelElement, region: PanelRegion, compose: () => PanelElement) => {
        return composeRegionInPlace(document, standing, region, compose, handleFailure);
    };
    // The detail is a region like the others and the last of them, so it stands over what it
    // describes. It is put in once and never replaced by a redraw of any other.
    const register = composeTipRegister();
    // Where the panel is right now, which is what the detail is placed beside. Null until a drag
    // writes one, and null for good on a panel that was never made movable.
    let getPosition: () => PanelPosition | null = () => null;
    const tip: TipHandle = composeTipHandle(
        document,
        register,
        (standing, compose) => redraw(standing, "list", compose),
        () => composeTipLeft(getPosition(), placement?.getViewport() ?? null, TIP_WIDTH),
    );
    root.append(regions.title);
    root.append(frame);
    root.append(tip.element);
    setPanelRootListeners(root, handlePress, (key, clientY) => tip.show(key, clientY));
    // After the listeners that read a press, and on the same root: a drag is four more of them,
    // and the bar is the only thing on the panel that starts one.
    if (placement !== null) {
        assert(typeof placement.getViewport === "function", "a panel is moved inside something");
        getPosition = setPanelDrag(root, host, () => regions.title, placement, handleFailure);
    }
    assert(host.className === "", "the host wears no class of the game's making");
    return {
        element: host,
        show(view: PanelView): void {
            register.reset();
            regions.title = redraw(
                regions.title,
                "header",
                () => composeTitleElement(document, view.isCollapsed),
            );
            // Composed empty rather than composed and then hidden, because a fight redraws every
            // few seconds and a folded panel that went on ranking twenty combatants would be
            // paying for a screen nobody is looking at.
            frame.className = view.isCollapsed ? `${CLASS.frame} ${CLASS.folded}` : CLASS.frame;
            if (view.isCollapsed) setPanelFolded(document, regions, redraw);
            else setPanelBody(document, regions, view, register, redraw);
            tip.refresh();
            assert(regions.list !== regions.sides, "the regions are that many elements");
            assert(regions.title !== regions.header, "and none of them stands in for another");
        },
        showWaiting(isCollapsed: boolean): void {
            register.reset();
            regions.title = redraw(
                regions.title,
                "header",
                () => composeTitleElement(document, isCollapsed),
            );
            frame.className = isCollapsed ? `${CLASS.frame} ${CLASS.folded}` : CLASS.frame;
            setPanelFolded(document, regions, redraw);
            // Nothing else is drawn: there is no screen to pick, no row to open and nothing to
            // total, so a strip or a strip of tabs would be a control over a fight that is not on.
            if (!isCollapsed) {
                regions.list = redraw(regions.list, "list", () => composeWaitingElement(document));
            }
            tip.refresh();
            assert(regions.sides.className === CLASS.slot, "with nothing standing under it");
            assert(regions.nouns.className === CLASS.slot, "and no strip of tabs over it");
        },
    };
}

/** How a region takes the place of the one standing there, which is how every region is drawn. */
type PanelRedraw = (
    standing: PanelElement,
    region: PanelRegion,
    compose: () => PanelElement,
) => PanelElement;

/**
 * What stands under the bar while the panel is folded: nothing, and nothing composed either.
 *
 * The regions are emptied rather than left standing behind a hidden frame, because a fight
 * redraws every few seconds and a folded panel that went on ranking twenty combatants would be
 * paying for a screen nobody is looking at.
 */
function setPanelFolded(
    document: PanelDocument,
    regions: PanelRegions,
    redraw: PanelRedraw,
): void {
    assert(regions.list.className.length > 0, "a region emptied is a region that was standing");
    regions.header = redraw(regions.header, "header", () => composeSlotElement(document));
    regions.nouns = redraw(regions.nouns, "tabs", () => composeSlotElement(document));
    regions.directions = redraw(regions.directions, "tabs", () => composeSlotElement(document));
    regions.crumb = redraw(regions.crumb, "crumb", () => composeSlotElement(document));
    regions.list = redraw(regions.list, "list", () => composeSlotElement(document));
    regions.pinnedActor = redraw(regions.pinnedActor, "pinned", () => composeSlotElement(document));
    regions.pinnedTarget = redraw(
        regions.pinnedTarget,
        "pinned",
        () => composeSlotElement(document),
    );
    regions.sides = redraw(regions.sides, "sides", () => composeSlotElement(document));
    regions.warnings = redraw(regions.warnings, "warnings", () => composeSlotElement(document));
    assert(regions.warnings.className === CLASS.slot, "and every one of them is a slot after it");
}

/** What stands under the bar: the header, the strips, the crumb, the list, what is pinned. */
function setPanelBody(
    document: PanelDocument,
    regions: PanelRegions,
    view: PanelView,
    register: TipRegister,
    redraw: PanelRedraw,
): void {
    assert(SCREEN_ORDER.includes(view.current), "a body is drawn for a screen the strips draw");
    // The shelf is a screen of its own and not one of the fight's: what stands over it is the
    // way back, and a header saying how **this** fight went over a list of other fights would be
    // answering a question nobody asked of that list.
    const isFight = !view.isOnShelf;
    regions.header = redraw(
        regions.header,
        "header",
        () => isFight ? composeHeaderElement(document, view) : composeSlotElement(document),
    );
    regions.nouns = redraw(
        regions.nouns,
        "tabs",
        () => isFight ? composeNounStripElement(document, view) : composeSlotElement(document),
    );
    regions.directions = redraw(
        regions.directions,
        "tabs",
        () => isFight ? composeDirectionStripElement(document, view) : composeSlotElement(document),
    );
    regions.crumb = redraw(regions.crumb, "crumb", () => composeCrumbRegion(document, view));
    regions.list = redraw(regions.list, "list", () => composeViewList(document, view, register));
    const figure = getWordsForScreen(view.current);
    // A pinned row keeps a place of its own whether or not there is one to draw, so a failure
    // takes one row rather than both — and nothing standing below them moves when one arrives.
    const pinned = view.drill === null && !view.isOnShelf ? view.reading.pinned : [];
    assert(pinned.length <= 2, "a screen pins the two ends the protocol can leave out, at most");
    for (const [end, standing] of [["actor", "pinnedActor"], ["target", "pinnedTarget"]] as const) {
        const row = pinned.find((one) => one.end === end) ?? null;
        regions[standing] = redraw(
            regions[standing],
            "pinned",
            () =>
                row === null
                    ? composeSlotElement(document)
                    : composePinnedElement(document, row, register, figure),
        );
    }
    // Drawn only where the client said which side is the reader's own — two sides nothing can
    // tell apart are not two figures — and never over the shelf, which is a list of fights
    // rather than a screen of one.
    const hasSides = view.reading.sides !== null && !view.isOnShelf;
    regions.sides = redraw(
        regions.sides,
        "sides",
        () => hasSides ? composeSidesElement(document, view) : composeSlotElement(document),
    );
    // Last and never a banner: a warning qualifies the whole reading rather than one figure, and
    // there is nowhere else for a claim about the reading to sit. Nothing is drawn where the
    // reading was clean, which is what keeps it from reading as furniture.
    regions.warnings = redraw(
        regions.warnings,
        "warnings",
        () =>
            view.isOnShelf
                ? composeSlotElement(document)
                : composeWarningsElement(document, view.reading.warnings),
    );
}

/** Every sentence the reading carries, each in a line of its own under the strip. */
function composeWarningsElement(
    document: PanelDocument,
    warnings: readonly string[],
): PanelElement {
    assert(warnings.every((one) => one.length > 0), "a warning that is drawn says something");
    if (warnings.length === 0) return composeSlotElement(document);
    const block = composeElement(document, "div", CLASS.warnings);
    for (const warning of warnings) {
        const line = composeElement(document, "div", CLASS.warning);
        line.textContent = `${WARNING_MARK}${warning}`;
        block.append(line);
    }
    assert(block.className === CLASS.warnings, "the block is the one thing there is always one of");
    return block;
}
