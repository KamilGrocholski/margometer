/**
 * The panel, drawn into a document it is handed. It never reaches for one, which is what keeps
 * the surface this asks of a browser declared rather than assumed.
 */

import { assert } from "@std/assert/assert";
import { BUILD_VERSION } from "@/src/build-version.ts";
import { composeDecimalText } from "@/libs/number-text.ts";
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
    PanelSides,
    PanelUnnamedEnd,
    PartReading,
    PersonRow,
    PinnedRow,
    RankingRow,
    ShelfRow,
    SkillRow,
    UnnamedRow,
} from "@/src/ui/panel-reading.ts";
import { getEndForPinned, getRowHasDoubt } from "@/src/ui/panel-reading.ts";
import {
    composeDirectionTabs,
    composeNounTabs,
    composeSideTabs,
    getDirectionForScreen,
    getNounForScreen,
    getWordsForKindCut,
    getWordsForOpponentCut,
    getWordsForScreen,
    type PanelNoun,
    type PanelSideChoice,
    type PanelStorageChoice,
    SCREEN_ORDER,
    type ScreenTab,
    STORAGE_CHOICES,
} from "@/src/ui/panel-screen.ts";
import { CLASS, composeStyleSheet, getColourForProfession } from "@/src/ui/panel-look.ts";
import {
    CARD_WORDS,
    composeFigureText,
    composeShelfSizeText,
    composeSideCountsText,
    composeUndrawnText,
    composeUsesText,
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
    type TranslateLabel,
    WARNING_MARK,
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

export interface PanelEvent {
    target: { getAttribute(name: string): string | null } | null;
    /**
     * Where the pointer went, on the event that says it left somewhere. Absent on every other,
     * and null where it left the page.
     */
    relatedTarget?: { getAttribute(name: string): string | null } | null | undefined;
    clientY: number;
    clientX?: number | undefined;
    pointerId?: number | undefined;
    button?: number | undefined;
    /** The game's own menu, on the gesture that goes back. Absent where nothing can be stopped. */
    preventDefault?: (() => void) | undefined;
}

export interface PanelElement {
    className: string;
    textContent: string;
    append(child: PanelElement): void;
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
const MAXIMUM_ROWS = 20;
const PIN_MARK = "★";
const UNPINNED_MARK = "☆";
const ROWS_WAITING = 11;
/** What the statistics keep a cut inside. `captures/` states ten kinds in all, 2026-08-28. */
const MAXIMUM_KINDS = 64;
/** And the bound on a combatant's own skills, measured in `src/ui/panel-reading.ts`. */
const MAXIMUM_SKILLS = 256;
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
    assert(tag.length > 0, "an element is made under a tag the document knows");
    const element = document.createElement(tag);
    element.className = className;
    assert(element.className === className, "an element wears the class it was given");
    return element;
}

function composeSlotElement(document: PanelDocument): PanelElement {
    const slot = composeElement(document, "div", CLASS.slot);
    assert(slot.textContent === "", "a slot that draws nothing says nothing");
    assert(slot.className === CLASS.slot, "and is the slot it says it is");
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
    hasDoubt?: boolean | undefined;
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
    warnings: readonly string[];
    translate: TranslateLabel | null;
    isRowNarrower: boolean;
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
    opens: boolean,
): TipCompose {
    assert(SCREEN_ORDER.includes(place.metric), "a card stands on a screen the strips draw");
    assert(Number.isSafeInteger(row.combatantId), "and over a row the panel can name somebody by");
    return () =>
        composeCardReading({
            name: row.name ?? PANEL_WORDS.unknown,
            profession: row.profession,
            detail: row.detail,
            metric: place.metric,
            warnings: place.warnings,
            opens,
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
function composeRowTipReading(reading: RowReading, tip: RowTip, opens: boolean): TipReading {
    assert(reading.name.length > 0, "a row that says nothing else at least names itself");
    assert(tip.figure.length > 0, "and says what the figure beside the name is a figure of");
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
        assert(note.length > 0, "a sentence a row carries says something");
        said.push({ kind: "note", text: note, isWarning: false });
    }
    if (opens) said.push({ kind: "note", text: CARD_WORDS.gesture, isWarning: false });
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
    assert(cut.heading.length > 0, "a run of parts on a card stands under a heading");
    const lines: TipLine[] = [{ kind: "heading", text: cut.heading }];
    for (const part of cut.parts) {
        assert(part.label.length > 0, "a part of a figure says what part it is");
        assert(part.stated.length > 0, "and states how much of it there is");
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
    assert(reading.figure >= 0, "a row drawn states a figure that is not below nothing");
    // The mark it wears is the whole answer: the cursor, the note the card carries and what a
    // press resolves to are one question asked once.
    const opens = mark !== null;
    const kind = opens ? CLASS.rowDrillable : CLASS.rowLeaf;
    const element = composeElement(document, "div", `${CLASS.row} ${kind}`);
    const parts = composeBarElements(document, reading);
    const rank = composeElement(document, "span", CLASS.rowRank);
    rank.textContent = reading.rank === null ? "" : `${composeFigureText(reading.rank)}.`;
    parts.push(rank);
    // Built only where there is one to build: this runs per row per redraw, and a node made to be
    // thrown away is a cost paid a fight's worth of times.
    if (reading.hasDoubt === true) {
        const mark = composeElement(document, "span", CLASS.rowWarning);
        mark.textContent = WARNING_MARK;
        parts.push(mark);
    }
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
    tip.register.add(tip.key, tip.compose ?? (() => composeRowTipReading(reading, tip, opens)));
    setRowMarks(marked, TIP_ATTRIBUTE, tip.key);
    assert(name.textContent.length > 0, "a row names somebody, or says it cannot");
    return element;
}

function composeCombatantReading(
    row: PersonRow,
    rank: number | null,
    metric: PanelMetric,
): RowReading {
    assert(row.figure >= 0, "a combatant's figure is never below nothing");
    assert(row.shareText.length > 0, "and their row states a share of the screen");
    return {
        name: row.name ?? PANEL_WORDS.unknown,
        figure: row.figure,
        fill: row.fill,
        shareText: row.shareText,
        colour: getColourForProfession(row.profession),
        profession: row.profession,
        rank,
        hasDoubt: getRowHasDoubt(row.detail, metric),
    };
}

function composeElementReading(row: ElementRow, noun: PanelNoun, rank: number): RowReading {
    assert(row.element.length > 0, "a part of a figure is one the protocol named");
    assert(row.figure >= 0, "and states a figure that is not below nothing");
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
function getUnnamedEndForScreen(metric: PanelMetric): PanelUnnamedEnd {
    assert(SCREEN_ORDER.includes(metric), "an end is left out on a screen the strips draw");
    return getDirectionForScreen(metric) === "given" ? "target" : "actor";
}

function getWordsForUnnamedRow(end: PanelUnnamedEnd): string {
    assert(end.length > 0, "an end the game left out is asked about by name");
    return end === "actor" ? PANEL_WORDS.withoutActor : PANEL_WORDS.withoutTarget;
}

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

function composeNounStripElement(document: PanelDocument, view: PanelView): PanelElement {
    const strip = composeElement(document, "div", CLASS.tabs);
    assert(SCREEN_ORDER.includes(view.current), "the panel is on a screen the strips draw");
    assert(strip.textContent === "", "and the region begins saying nothing of its own");
    for (const tab of composeNounTabs(view.current)) {
        strip.append(composeTabElement(document, SCREEN_ATTRIBUTE, getShownTab(tab, view)));
    }
    return strip;
}

function composeDirectionStripElement(document: PanelDocument, view: PanelView): PanelElement {
    const strip = composeElement(document, "div", CLASS.tabs);
    assert(SCREEN_ORDER.includes(view.current), "the panel is on a screen the strips draw");
    for (const tab of composeDirectionTabs(view.current)) {
        strip.append(composeTabElement(document, SCREEN_ATTRIBUTE, getShownTab(tab, view)));
    }
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

function composeFoldControl(document: PanelDocument, isCollapsed: boolean): PanelElement {
    const control = composeElement(document, "span", CLASS.control);
    control.textContent = isCollapsed ? UNFOLD_MARK : FOLD_MARK;
    control.setAttribute(FOLD_ATTRIBUTE, "");
    control.setAttribute(TITLE_ATTRIBUTE, isCollapsed ? PANEL_WORDS.expand : PANEL_WORDS.collapse);
    assert(control.textContent.length > 0, "a control a reader could press wears a mark");
    assert(control.className === CLASS.control, "and is a control by name before it is pressed");
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
        className: CLASS.control,
        mark: SAVE_MARK,
        attribute: SAVE_ATTRIBUTE,
        words: PANEL_WORDS.saveFight,
    }));
    bar.append(composeFoldControl(document, isCollapsed));
    return bar;
}

function composeHeaderElement(document: PanelDocument, view: PanelView): PanelElement {
    const header = composeElement(document, "div", CLASS.header);
    const line = composeElement(document, "div", CLASS.headerLine);
    const who = composeElement(document, "span", "");
    who.textContent = composeSideCountsText(view.reading.sizes, view.reading.unplaced);
    line.append(who);
    // Absent rather than empty where the reading says nothing, and `ui/panel-reading.ts` says
    // when it does and why the header may not fill the silence in.
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
    const place = composeElement(document, "div", CLASS.headerPlace);
    place.textContent = view.place;
    place.setAttribute(TITLE_ATTRIBUTE, view.place);
    header.append(place);
    return header;
}

function composeCrumbRegion(document: PanelDocument, view: PanelView): PanelElement {
    assert(typeof view.isOnShelf === "boolean", "a crumb is drawn for a panel that is somewhere");
    assert(SCREEN_ORDER.includes(view.current), "and on a screen the strips draw");
    if (view.isOnShelf) {
        return composeCrumbElement(document, PANEL_WORDS.fights, PANEL_WORDS.backFromFights);
    }
    if (view.halfNamedDrill !== null) {
        return composeCrumbElement(
            document,
            getWordsForHalfNamedDrill(view.halfNamedDrill, view.current),
            getWordsForUnnamedRow(getEndForPinned(view.halfNamedDrill.case)),
        );
    }
    if (view.halfNamed !== null) {
        return composeCrumbElement(document, getWordsForUnnamedRow(view.halfNamed.end));
    }
    if (view.drill === null) return composeSlotElement(document);
    const opened = view.drill.name ?? PANEL_WORDS.unknown;
    if (view.part !== null) {
        return composeCrumbElement(
            document,
            getWordsForNamedPart(view.part.part, view.current),
            opened,
        );
    }
    if (view.pair === null) return composeCrumbElement(document, opened);
    return composeCrumbElement(document, view.pair.otherName ?? PANEL_WORDS.unknown, opened);
}

function composeCrumbElement(
    document: PanelDocument,
    said: string,
    from: string | null = null,
): PanelElement {
    assert(said.length > 0, "what stands over the screen is named before the way back is drawn");
    const crumb = composeElement(document, "div", CLASS.crumb);
    const back = composeElement(document, "span", CLASS.crumbBack);
    back.textContent = `${BACK_MARK}${from ?? PANEL_WORDS.back}`;
    back.setAttribute(BACK_ATTRIBUTE, PANEL_WORDS.back);
    const here = composeElement(document, "span", CLASS.crumbHere);
    here.textContent = said;
    here.setAttribute(TITLE_ATTRIBUTE, here.textContent);
    crumb.append(back);
    crumb.append(here);
    assert(back.textContent.startsWith(BACK_MARK), "the way back is marked as the way back");
    assert(here.textContent.length > 0, "the row standing open names somebody, or says it cannot");
    return crumb;
}

function composeSectionElement(
    document: PanelDocument,
    heading: string,
    total: number,
): PanelElement {
    assert(heading.length > 0, "a cut that is drawn says what it is cut by");
    assert(total >= 0, "and states the figure it stands over");
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
    assert(words.length > 0, "a list with nothing on it says so in words");
    const empty = composeElement(document, "div", CLASS.empty);
    empty.textContent = words;
    assert(empty.textContent === words, "and says exactly that");
    return empty;
}

function composeWaitingElement(document: PanelDocument): PanelElement {
    const list = composeListElement(document, ROWS_WAITING);
    list.className = `${CLASS.list} ${CLASS.listWaiting}`;
    list.append(composeEmptyElement(document, PANEL_WORDS.noFightYet));
    assert(list.className.includes(CLASS.list), "a panel waiting is a panel at the list's height");
    assert(ROWS_WAITING > 0, "which is a height of at least one row");
    return list;
}

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
    translate: TranslateLabel | null,
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
        const reader = composeCombatantReading(row, at + 1, metric);
        const tip = {
            register,
            key: `row:${row.combatantId}`,
            figure,
            share: PANEL_WORDS.share,
            compose: composePersonCard(
                row,
                { metric, warnings: reading.warnings, translate, isRowNarrower: false },
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
    view: PanelView,
    register: TipRegister,
): PanelElement {
    const list = composeListElement(document, view.reading.visibleRows);
    assert(view.shelf.length <= MAXIMUM_ROWS, "a shelf draws no more rows than a list holds");
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
    assert(row.className.includes(CLASS.row), "a fight on the shelf is a row like any other");
    return row;
}

function composePinElement(document: PanelDocument, fight: ShelfRow): PanelElement {
    assert(fight.isPinnable, "a pin is drawn where there is something to pin");
    const set = fight.isPinned ? ` ${CLASS.rowPinSet}` : "";
    const pin = composeElement(document, "span", `${CLASS.rowPin}${set}`);
    pin.textContent = fight.isPinned ? PIN_MARK : UNPINNED_MARK;
    pin.setAttribute(TITLE_ATTRIBUTE, getWordsForPin(fight.isPinned));
    // The moment and never the word a live row is pressed by: what a pin acts on is a fight the
    // shelf holds, and the one going on now is on the shelf only while it is also kept.
    pin.setAttribute(PIN_ATTRIBUTE, `${fight.openedAt}`);
    assert(pin.textContent.length > 0, "and says which of the two states it is in");
    return pin;
}

function composeStorageStripElement(document: PanelDocument, view: PanelView): PanelElement {
    const strip = composeElement(document, "div", CLASS.tabs);
    assert(view.isOnShelf, "the question about keeping fights is asked over the fights");
    const label = composeElement(document, "span", CLASS.tabsLabel);
    label.textContent = PANEL_WORDS.storage;
    strip.append(label);
    for (const choice of STORAGE_CHOICES) {
        const marked = choice === view.storage ? ` ${CLASS.tabCurrent}` : "";
        const tab = composeElement(document, "div", `${CLASS.tab}${marked}`);
        tab.textContent = getWordsForStorage(choice);
        tab.setAttribute(STORAGE_ATTRIBUTE, choice);
        strip.append(tab);
    }
    assert(label.textContent.length > 0, "and the strip says what its three words answer");
    return strip;
}

function composeOpponentSection(
    document: PanelDocument,
    list: PanelElement,
    drill: DrillReading,
    stated: { metric: PanelMetric; register: TipRegister; figure: string; place: CardPlace },
): void {
    const cut = drill.byOpponent;
    assert(cut.rows.length <= MAXIMUM_ROWS, "an opened row stays inside the fight's bound");
    if (cut.rows.length === 0 && cut.unnamed === null) return;
    const heading = getWordsForOpponentCut(stated.metric);
    assert(heading.length > 0, "a cut says what it is cut by");
    assert(drill.total >= 0, "and stands under a figure that is not below nothing");
    list.append(composeSectionElement(document, heading, drill.total));
    const share = PANEL_WORDS.shareOfFigure;
    for (const [at, row] of cut.rows.entries()) {
        const tip = {
            register: stated.register,
            key: `to:${row.combatantId}`,
            ...{
                figure: stated.figure,
                share,
                compose: composePersonCard(row, stated.place, row.opensPair),
            },
        };
        const mark = row.opensPair
            ? { attribute: ROW_ATTRIBUTE, stated: `${row.combatantId}` }
            : null;
        list.append(
            composeRowElement(
                document,
                composeCombatantReading(row, at + 1, stated.metric),
                mark,
                tip,
            ),
        );
    }
    if (cut.unnamed === null) return;
    const end = getUnnamedEndForScreen(stated.metric);
    const tip = {
        register: stated.register,
        key: "to:nobody",
        figure: stated.figure,
        share,
        // What the game did not say, and only that: where this figure stands is answered by the
        // heading over it — it is a cut of the one person's figure the level is about.
        notes: [getWordsForUnnamedEnd(end, getNounForScreen(stated.metric))],
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
    return getNounForScreen(metric) === "damage"
        ? getWordsForDamageKind(named)
        : getWordsForHealthSource(named);
}

/** The mark a part row wears, and null where the level under it holds nothing. */
function getMarkForNamedPart(part: NamedPart, opens: boolean): RowMark | null {
    if (!opens) return null;
    if (part.kind === "skill") return { attribute: SKILL_ATTRIBUTE, stated: part.name };
    if (part.kind === "source") return { attribute: SOURCE_ATTRIBUTE, stated: part.source };
    return { attribute: KIND_ATTRIBUTE, stated: part.element };
}

/** One key per part and per section, so a tip is never the one a row beside it registered. */
function getKeyForNamedPart(where: string, part: NamedPart | { kind: "plain" }): string {
    assert(where.length > 0, "a tip is registered under the section it was drawn in");
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
    assert(cut.rows.length <= MAXIMUM_SKILLS, "a cut stays inside the bound it is kept to");
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
        const mark = getMarkForNamedPart(row.part, row.opensPart);
        list.append(composeRowElement(document, reading, mark, tip));
    }
    if (cut.plain === null) return;
    const tip = { register: stated.register, key: "skill:plain", figure: stated.figure, share };
    const reading = {
        ...composeUnnamedReading(cut.plain, getWordsForUnannounced(stated.metric)),
        uses: cut.plain.blows,
    };
    list.append(composeRowElement(document, reading, null, tip));
}

function composeSkillRowReading(row: SkillRow, metric: PanelMetric, rank: number): RowReading {
    const name = getWordsForNamedPart(row.part, metric);
    assert(name.length > 0, "a row of the section is drawn under a name");
    assert(row.figure >= 0, "and states a figure that is not below nothing");
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
    assert(cut.rows.length <= MAXIMUM_KINDS, "a cut stays inside the bound it is kept to");
    assert(stated.total >= 0, "a cut stands under a figure that is not below nothing");
    if (cut.rows.length === 0 && cut.unnamed === null) return;
    list.append(composeSectionElement(document, getWordsForKindCut(stated.metric), stated.total));
    const noun = getNounForScreen(stated.metric);
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
                getMarkForNamedPart(part, row.opensPart),
                tip,
            ),
        );
    }
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
 * Neither cut is opened any further, and a cut with nothing in it draws no heading: a blow the
 * protocol tied to nobody still states what it was dealt with, so the kinds can stand alone.
 */
function composeDrillElement(
    document: PanelDocument,
    view: PanelView,
    drill: DrillReading,
    register: TipRegister,
    translate: TranslateLabel | null,
): PanelElement {
    const list = composeListElement(document, getRowsForDrill(drill, view.reading.visibleRows));
    const figure = getWordsForScreen(view.current);
    assert(figure.length > 0, "an opened row states what its figure is a figure of");
    const place: CardPlace = {
        metric: view.current,
        warnings: view.reading.warnings,
        translate,
        isRowNarrower: true,
    };
    composeOpponentSection(document, list, drill, {
        metric: view.current,
        register,
        figure,
        place,
    });
    composeSkillSection(document, list, drill, { metric: view.current, register, figure });
    composeElementSection(document, list, drill.byElement, {
        metric: view.current,
        register,
        figure,
        total: drill.total,
    });
    assert(drill.total >= 0, "a figure opened is never below nothing");
    if (drill.total === 0) {
        list.append(composeEmptyElement(document, getWordsForNothing(view.current)));
    }
    return list;
}

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

function composeSidesElement(document: PanelDocument, view: PanelView): PanelElement {
    const sides = view.reading.sides;
    assert(sides !== null, "a strip of two sides is drawn where there are two to tell apart");
    const block = composeElement(document, "div", CLASS.sides);
    assert(sides.ours >= 0, "a side's own figure is never below nothing");
    assert(sides.theirs >= 0, "and neither is the other's");
    const line = composeElement(document, "div", CLASS.sidesLine);
    const ours = composeElement(document, "span", `${CLASS.sidesOurs} ${CLASS.figure}`);
    ours.textContent = composeFigureText(sides.ours);
    const label = composeElement(document, "span", CLASS.sidesLabel);
    label.textContent = composeSidesLabel(view);
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

function composeSidesSpare(document: PanelDocument, figure: number): PanelElement {
    assert(figure > 0, "what belongs to no side is drawn because there is some of it");
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
    assert(label.textContent.length > 0, "what belongs to no side says so before it says how much");
    return spare;
}

function composeSidesLabel(view: PanelView): string {
    const sides = `${PANEL_WORDS.ourSide} / ${PANEL_WORDS.theirSide}`;
    assert(sides.length > 0, "the two sides are named before they are totalled");
    assert(SCREEN_ORDER.includes(view.current), "and totalled on a screen the strips draw");
    if (view.side === "everyone" && view.drill === null) return sides;
    return `${PANEL_WORDS.wholeFight} · ${sides}`;
}

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

export interface PanelView {
    reading: PanelReading;
    current: PanelMetric;
    side: PanelSideChoice;
    hasReaderSide: boolean;
    shelf: readonly ShelfRow[];
    storage: PanelStorageChoice;
    shelfWarnings: readonly string[];
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
    | { kind: "shelf" };

function composeViewList(
    document: PanelDocument,
    view: PanelView,
    register: TipRegister,
    translate: TranslateLabel | null,
): PanelElement {
    assert(SCREEN_ORDER.includes(view.current), "a view is on a screen the strip draws");
    assert(view.shelf.length <= MAXIMUM_ROWS, "and carries no more of them than a list draws");
    if (view.isOnShelf) return composeShelfElement(document, view, register);
    if (view.part !== null) {
        return composePartElement(document, view, view.part, register, translate);
    }
    if (view.pair !== null) return composePairElement(document, view, view.pair, register);
    if (view.halfNamedDrill !== null) {
        return composeHalfNamedDrillElement(document, view, view.halfNamedDrill, register);
    }
    if (view.halfNamed !== null) {
        return composeHalfNamedElement(document, view, view.halfNamed, register, translate);
    }
    if (view.drill !== null) {
        return composeDrillElement(document, view, view.drill, register, translate);
    }
    return composeRankingElement(document, view.reading, view.current, register, translate);
}

/**
 * What stands under one row of that level: a person's own keys, or a key's own people. The two are
 * one fold read both ways round, so this is one function with one branch rather than two levels.
 *
 * Nothing here opens. It is the third level, and the panel goes no deeper.
 */
function composeHalfNamedDrillElement(
    document: PanelDocument,
    view: PanelView,
    drill: HalfNamedDrillReading,
    register: TipRegister,
): PanelElement {
    assert(drill.total > 0, "a level stands under a figure there is something of");
    assert(SCREEN_ORDER.includes(view.current), "and on a screen the strips draw");
    const figure = getWordsForScreen(view.current);
    if (drill.opened === "element") {
        assert(drill.rows.length > 0, "a key that opened has somebody's row carrying it");
        const rows = drill.rows.length + (drill.neither === null ? 0 : 1);
        const list = composeListElement(document, Math.max(rows + 1, view.reading.visibleRows));
        const heading = getWordsForHalfNamedCut(drill.end);
        list.append(composeSectionElement(document, heading, drill.total));
        composeHalfNamedRows(document, list, view, {
            rows: drill.rows,
            neither: drill.neither,
            opens: false,
            register,
            translate: null,
        });
        return list;
    }
    const kinds = drill.kinds.rows.length + (drill.kinds.unnamed === null ? 0 : 1);
    const list = composeListElement(document, Math.max(kinds + 1, view.reading.visibleRows));
    composeElementSection(document, list, drill.kinds, {
        metric: view.current,
        register,
        figure,
        total: drill.total,
    });
    return list;
}

/** What the way back calls the row that is open, which is the row itself and not its level. */
function getWordsForHalfNamedDrill(drill: HalfNamedDrillReading, metric: PanelMetric): string {
    assert(SCREEN_ORDER.includes(metric), "a way back is drawn on a screen the strips draw");
    if (drill.opened === "person") return drill.row.name ?? PANEL_WORDS.unknown;
    assert(drill.element.length > 0, "and a key is named by what the protocol wrote");
    return getNounForScreen(metric) === "damage"
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
    view: PanelView,
    halfNamed: HalfNamedReading,
    register: TipRegister,
    translate: TranslateLabel | null,
): PanelElement {
    const named = halfNamed.rows.length + (halfNamed.neither === null ? 0 : 1);
    const kinds = halfNamed.kinds.rows.length + (halfNamed.kinds.unnamed === null ? 0 : 1);
    assert(named > 0, "a pinned row that opens has somebody under it, or says it has nobody");
    assert(halfNamed.total > 0, "and a figure that is there to be cut");
    const needed = named + 1 + (kinds === 0 ? 0 : kinds + 1);
    const list = composeListElement(document, Math.max(needed, view.reading.visibleRows));
    const heading = getWordsForHalfNamedCut(halfNamed.end);
    list.append(composeSectionElement(document, heading, halfNamed.total));
    composeHalfNamedRows(document, list, view, {
        rows: halfNamed.rows,
        neither: halfNamed.neither,
        opens: true,
        register,
        translate,
    });
    composeElementSection(document, list, halfNamed.kinds, {
        metric: view.current,
        register,
        figure: getWordsForScreen(view.current),
        total: halfNamed.total,
    });
    return list;
}

/** The end the game did name, as the heading that names it: whom it reached, or who did it. */
function getWordsForHalfNamedCut(end: PanelUnnamedEnd): string {
    assert(end.length > 0, "an end the game named is asked about by name");
    return end === "actor" ? PANEL_WORDS.dealtTo : PANEL_WORDS.takenFrom;
}

function composeHalfNamedRows(
    document: PanelDocument,
    list: PanelElement,
    view: PanelView,
    stated: {
        rows: readonly HalfNamedRow[];
        neither: UnnamedRow | null;
        /** False on the third level: what stands under a person there is nobody, and nothing. */
        opens: boolean;
        register: TipRegister;
        translate: TranslateLabel | null;
    },
): void {
    const { rows, neither, opens, register, translate } = stated;
    const figure = getWordsForScreen(view.current);
    const share = PANEL_WORDS.shareOfFigure;
    // The card is the fight's four figures, as it is wherever a person's row stands, and this row
    // states a cut of them — so it owes the sentence saying so (**ADR 0032**).
    const place: CardPlace = {
        metric: view.current,
        warnings: view.reading.warnings,
        translate,
        isRowNarrower: true,
    };
    for (const [at, row] of rows.entries()) {
        const tip = {
            register,
            key: `named:${row.combatantId}`,
            figure,
            share,
            compose: composePersonCard(row, place, opens),
        };
        const reading = composeCombatantReading(row, at + 1, view.current);
        const mark = opens ? { attribute: ROW_ATTRIBUTE, stated: `${row.combatantId}` } : null;
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
    view: PanelView,
    part: PartReading,
    register: TipRegister,
    translate: TranslateLabel | null,
): PanelElement {
    const rows = part.byOpponent.rows.length + (part.byOpponent.unnamed === null ? 0 : 1);
    assert(rows > 0, "a part that opens reached somebody");
    const list = composeListElement(document, Math.max(rows + 1, view.reading.visibleRows));
    const figure = getWordsForScreen(view.current);
    assert(part.total >= 0, "a part opened states a figure that is not below nothing");
    const heading = getWordsForOpponentCut(view.current);
    assert(heading.length > 0, "and says what the people under it are cut by");
    list.append(composeSectionElement(document, heading, part.total));
    const share = PANEL_WORDS.shareOfFigure;
    // Nothing on this rung opens, so no card here promises a gesture (`docs/drill-levels.md`).
    const place: CardPlace = {
        metric: view.current,
        warnings: view.reading.warnings,
        translate,
        isRowNarrower: true,
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
                composeCombatantReading(row, at + 1, view.current),
                null,
                tip,
            ),
        );
    }
    if (part.byOpponent.unnamed === null) return list;
    // The end the protocol left out of a blow this part carried: it is inside the figure over the
    // level, so the column comes to a hundred with it and falls short without it.
    const end = getUnnamedEndForScreen(view.current);
    const tip = {
        register,
        key: "reached:nobody",
        figure,
        share,
        notes: [getWordsForUnnamedEnd(end, getNounForScreen(view.current))],
    };
    const reading = composeUnnamedReading(part.byOpponent.unnamed, getWordsForUnnamedRow(end));
    list.append(composeRowElement(document, reading, null, tip));
    return list;
}

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
    composePairParts(document, list, pair, { metric: view.current, register, figure, share });
    composePairKinds(document, list, pair, { register, figure, share });
    return list;
}

function composePairParts(
    document: PanelDocument,
    list: PanelElement,
    pair: PairReading,
    stated: { metric: PanelMetric; register: TipRegister; figure: string; share: string },
): void {
    assert(pair.parts.length <= MAXIMUM_SKILLS, "a cut stays inside the bound it is kept to");
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
        assert(reading.name.length > 0, "a part of a pair is drawn under a name");
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
    assert(cut.rows.length <= MAXIMUM_KINDS, "a cut stays inside the bound it is kept to");
    if (cut.rows.length === 0) return;
    list.append(composeSectionElement(document, PANEL_WORDS.damageKind, pair.total));
    for (const [at, row] of cut.rows.entries()) {
        const tip = { ...stated, key: `pair-kind:${row.element}` };
        list.append(
            composeRowElement(document, composeElementReading(row, "damage", at + 1), null, tip),
        );
    }
}

function getRowsForPair(pair: PairReading, floor: number): number {
    assert(floor > 0, "a list stands at a height of at least one row");
    assert(pair.total >= 0, "and holds a figure that is not below nothing");
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
    assert(SCREEN_ORDER.includes(metric), "a figure is pinned on a screen the strips draw");
    const notes = [
        getWordsForUnnamedEnd(row.end, getNounForScreen(metric)),
        getWordsForPinnedStanding(row.case),
    ];
    if (isSideChosen) notes.push(getWordsForPinnedScope(row.case));
    assert(notes.length <= 3, "and says it in three sentences at the most");
    return notes;
}

/**
 * What a pinned figure was dealt with, stated on the card before anybody presses the row: the same
 * rows the level under it draws, in the same order, worded by the same table. **ADR 0041.**
 *
 * What will not fit is summed rather than dropped, so the run always comes to the figure over it.
 */
function composePinnedCutParts(row: PinnedRow, metric: PanelMetric): RowTipCut {
    assert(SCREEN_ORDER.includes(metric), "a cut is stated on a screen the strips draw");
    assert(row.kinds.rows.length <= MAXIMUM_KINDS, "and stays inside the bound a cut is kept to");
    // Every key is written where the figure is, so a pinned figure's kinds come to the whole of
    // it and this run needs no row for a shortfall (`src/core/fight-statistics.ts`, **ADR 0039**).
    assert(row.kinds.unnamed === null, "a pinned figure states a kind for every point of itself");
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
    assert(row.figure > 0, "a figure is pinned because there is one to pin");
    assert(block.className === CLASS.pinned, "and the block saying so is one of its own");
    return block;
}

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
    if (target.getAttribute(SAVE_ATTRIBUTE) !== null) return { kind: "save" };
    if (target.getAttribute(SHELF_ATTRIBUTE) !== null) return { kind: "shelf" };
    if (target.getAttribute(FOLD_ATTRIBUTE) !== null) return { kind: "fold" };
    if (target.getAttribute(BACK_ATTRIBUTE) !== null) return { kind: "back" };
    return null;
}

/**
 * The four listeners, all of them at the root and none of them on a row.
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
): void {
    assert(typeof handlePress === "function", "a press reaches somebody who can act on it");
    assert(typeof handleHover === "function", "and so does the pointer that opens the detail");
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
    // control alone would make the cheapest gesture the one that needs aiming.
    setGuardedListener(root, BACK_EVENT, (event) => {
        event.preventDefault?.();
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
    show(view: PanelView): void;
    /**
     * With no draw at all before the first payload, an add-on waiting for a fight and one that
     * died on the way to the page are the same picture.
     */
    showWaiting(isCollapsed: boolean): void;
}

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
    warnings: PanelElement;
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
        warnings: composeSlotElement(document),
    };
    assert(regions.title.className === CLASS.title, "the bar is the bar before anything is drawn");
    assert(regions.warnings.className === CLASS.slot, "and every other begins as a slot");
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
    assert(HOST_NAME.startsWith("MargoMeter-"), "the host is named as ours before anything else");
    host.setAttribute("id", HOST_NAME);
    host.setAttribute(VERSION_ATTRIBUTE, BUILD_VERSION);
    const root = host.attachShadow({ mode: "open" });
    const sheet = document.createElement("style");
    sheet.textContent = composeStyleSheet();
    root.append(sheet);
    assert(sheet.textContent.length > 0, "the panel is handed its look before it draws anything");
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
    panel.append(regions.warnings);
    frame.append(panel);
    assert(panel !== frame, "the panel is a box of its own inside the frame");
    return frame;
}

export function composePanelHost(
    document: PanelDocument,
    handlePress: (press: PanelPress) => void,
    handleFailure: (failure: unknown) => void,
    placement: PanelPlacement | null = null,
    // Null is the panel drawing its own words, which is what every test and every browser
    // without the game sees. Who asks the client, and how often, is the entry's — ADR 0024.
    translate: TranslateLabel | null = null,
): PanelHandle {
    const { host, root } = composePanelShadow(document);
    const regions = composePanelRegions(document);
    const frame = composePanelFrame(document, regions);
    const redraw = (standing: PanelElement, region: PanelRegion, compose: () => PanelElement) => {
        return composeRegionInPlace(document, standing, region, compose, handleFailure);
    };
    const register = composeTipRegister();
    const setFoldDrawn = (isCollapsed: boolean): void => {
        regions.title = redraw(
            regions.title,
            "header",
            () => composeTitleElement(document, isCollapsed),
        );
        frame.className = isCollapsed ? `${CLASS.frame} ${CLASS.folded}` : CLASS.frame;
    };
    // Null until a drag writes one, and null for good on a panel never made movable.
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
    const showTip = (key: string | null, clientY: number): void => tip.show(key, clientY);
    setPanelRootListeners(root, handlePress, showTip, handleFailure);
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
            setFoldDrawn(view.isCollapsed);
            if (view.isCollapsed) setPanelFolded(document, regions, redraw);
            else setPanelBody(document, regions, view, register, translate, redraw);
            tip.refresh();
            assert(regions.list !== regions.sides, "the regions are that many elements");
            assert(regions.title !== regions.header, "and none of them stands in for another");
        },
        showWaiting(isCollapsed: boolean): void {
            register.reset();
            setFoldDrawn(isCollapsed);
            setPanelFolded(document, regions, redraw);
            if (!isCollapsed) {
                regions.list = redraw(regions.list, "list", () => composeWaitingElement(document));
            }
            tip.refresh();
            assert(regions.sides.className === CLASS.slot, "with nothing standing under it");
            assert(regions.nouns.className === CLASS.slot, "and no strip of tabs over it");
        },
    };
}

type PanelRedraw = (
    standing: PanelElement,
    region: PanelRegion,
    compose: () => PanelElement,
) => PanelElement;

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
    regions.storage = redraw(regions.storage, "tabs", () => composeSlotElement(document));
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

function setPanelBody(
    document: PanelDocument,
    regions: PanelRegions,
    view: PanelView,
    register: TipRegister,
    translate: TranslateLabel | null,
    redraw: PanelRedraw,
): void {
    assert(SCREEN_ORDER.includes(view.current), "a body is drawn for a screen the strips draw");
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
    regions.storage = redraw(
        regions.storage,
        "tabs",
        () => isFight ? composeSlotElement(document) : composeStorageStripElement(document, view),
    );
    regions.list = redraw(
        regions.list,
        "list",
        () => composeViewList(document, view, register, translate),
    );
    setPinnedRegions(document, regions, view, register, redraw);
    const hasSides = view.reading.sides !== null && !view.isOnShelf;
    regions.sides = redraw(
        regions.sides,
        "sides",
        () => hasSides ? composeSidesElement(document, view) : composeSlotElement(document),
    );
    regions.warnings = redraw(
        regions.warnings,
        "warnings",
        () =>
            composeWarningsElement(
                document,
                view.isOnShelf ? view.shelfWarnings : view.reading.warnings,
            ),
    );
}

/**
 * A pinned row keeps a place of its own whether or not there is one to draw, so a failure takes
 * one row rather than both — and nothing standing below them moves when one arrives.
 */
function setPinnedRegions(
    document: PanelDocument,
    regions: PanelRegions,
    view: PanelView,
    register: TipRegister,
    redraw: PanelRedraw,
): void {
    const stated = {
        metric: view.current,
        isSideChosen: view.side !== "everyone",
        figure: getWordsForScreen(view.current),
    };
    const isOpen = view.drill !== null || view.halfNamed !== null ||
        view.halfNamedDrill !== null;
    const pinned = !isOpen && !view.isOnShelf ? view.reading.pinned : [];
    assert(pinned.length <= 2, "a screen pins the two ends the protocol can leave out, at most");
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
