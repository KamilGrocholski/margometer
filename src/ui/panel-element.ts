/**
 * The panel, drawn into a document it is handed. It never reaches for one, which is what keeps
 * the surface this asks of a browser declared rather than assumed.
 *
 * Beside it stands the detail window, which outlives every redraw: appended to the root once, the
 * way the one listener is, and filled from a register the drawn rows add to. A card it shows is
 * counted in lines, and the sheet multiplies: **nothing here measures anything**.
 */

import { formatDecimal } from "#/libs/number-text.ts";
import * as errors from "#/libs/errors.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import {
    PANEL_WINDOW,
    PANEL_WINDOWS,
    type PanelWindow,
    STORAGE_CHOICES,
    type StorageChoice,
    TYPE_STEP,
    TYPE_STEP_DEFAULT,
    TYPE_STEPS,
    type TypeStep,
    type WindowSizes,
} from "./panel-choice.ts";
import {
    EVENT_TYPE,
    type PanelDocument,
    type PanelElement,
    type PanelRoot,
    STYLE_ATTRIBUTE,
} from "./panel-document.ts";
import {
    type CardAcross,
    type CardWindowPlace,
    composeCardAcross,
    composeHelperPositionAfterTypeStep,
    GRIP_MARK_BY_WINDOW,
    initPanelDrag,
    type PanelDragHandle,
    type PanelPlacement,
    setGripMark,
    SIZE_GRIP_ATTRIBUTE,
    type WindowWidths,
} from "./panel-drag.ts";
import {
    LIVE_FIGHT_MARK,
    PANEL_INTENT,
    PANEL_MARK,
    type PanelIntent,
    PLAIN_MARK,
    readPanelIntent,
} from "./panel-intent.ts";
import { addGuardedListener } from "./panel-listener.ts";
import {
    CARD_VARIABLES,
    CLASS,
    composeOptionsStepClass,
    composeStyleSheet,
    getCardHeight,
    getCardHeightAvailable,
    ROWS_VARIABLE,
    TYPE_TOKENS,
} from "./panel-look.ts";
import { type Colour, formatColour, lookupColourForProfession, SIGNAL } from "./panel-palette.ts";
import {
    type ClosingRow,
    type CutPart,
    type ElementCut,
    type ElementRow,
    type FightCardContent,
    type FightMoment,
    formatRowSuspicions,
    getEndForPinned,
    getSideRelation,
    HALF_NAMED_OPENED,
    type HalfNamedRow,
    isRowSuspect,
    type OpenedLevelContent,
    type OpenedPart,
    type OtherEndRow,
    type PairLevelContent,
    type PanelUnnamedEnd,
    type PartLevelContent,
    type PersonRow,
    type PinnedRow,
    type PlainRow,
    type RankingRow,
    type ReachedBonus,
    type RowDetail,
    type ScreenContent,
    type ShelfRow,
    SIDE_RELATION,
    type SideRelation,
    type SkillRow,
    UNNAMED_END,
    type UnnamedCutLevelContent,
    type UnnamedLevelContent,
    type UnnamedRow,
} from "./panel-content.ts";
import {
    getDirectionForMetric,
    getNounForMetric,
    getWordsForKindCut,
    getWordsForMetric,
    getWordsForOpponentCut,
    OPENED_PART,
    OPTIONS_LIST_NAME,
    PANEL_DIRECTION,
    PANEL_METRIC,
    PANEL_NOUN,
    type PanelMetric,
    type PanelNoun,
    type PanelSideChoice,
    presentDirectionStrips,
    presentNounStrips,
    presentSideStrips,
    type ScreenStrip,
    SIDE_CHOICE,
} from "./panel-screen.ts";
import {
    type HelperAbsence,
    type HelperContent,
    type StandingChargedSkill,
} from "./panel-helper.ts";
import {
    CARD_WORDS,
    CAVEAT,
    type Caveat,
    CAVEAT_MARK,
    CAVEATS,
    DEFECT_MARK,
    FIGHT_CARD_WORDS,
    formatCardSubtitle,
    formatChargedSkillSubtitle,
    formatCounter,
    formatDefect,
    formatDestroyed,
    formatFigure,
    formatKeptUnread,
    formatShareRounded,
    formatShelfSize,
    formatShelfTime,
    formatSideCounts,
    formatTurnOrdinal,
    formatTurns,
    formatUndrawn,
    formatUses,
    formatWholeUngrouped,
    getCaveatForUnannounced,
    getNoteForCaveat,
    getNoteForUnnamedEnd,
    getSubWordsForBlowKey,
    getWordsForBlowKey,
    getWordsForCardMetric,
    getWordsForChargedSkill,
    getWordsForDamageKind,
    getWordsForDestroyed,
    getWordsForHealthSource,
    getWordsForHelperAbsence,
    getWordsForLegendaryBonus,
    getWordsForNothing,
    getWordsForOutcome,
    getWordsForPin,
    getWordsForPinnedScope,
    getWordsForPinnedStanding,
    getWordsForShelfOutcome,
    getWordsForStorage,
    getWordsForStorageMeaning,
    getWordsForTurnState,
    getWordsForTypeStep,
    getWordsForUnannounced,
    getWordsForWindow,
    HELPER_WORDS,
    NEITHER_END_WORDS,
    PANEL_DEFECT_KIND,
    PANEL_REGION,
    PANEL_WORDS,
    type PanelDefectKind,
    type PanelRegion,
    type PlaceWords,
    SUSPECT_MARK,
    type TranslateLabel,
    TURN_MARK,
} from "./panel-words.ts";
import {
    addViewFailureGuarded,
    GestureDropped,
    PANEL_LISTENER,
    RegionUndrawn,
    type RenderReport,
    type ViewFailure,
} from "./view-failure.ts";
import { getRankedOrder } from "./ranked-order.ts";
import {
    CRITICAL_PROC_KEYS,
    LEGENDARY_BONUS_SHOWING,
    lookupLegendaryBonus,
} from "#/src/core/protocol-key.ts";

/** Where a part's row stands, which its card's key begins with: one part stands at two levels. */
const CARD_KEY_PLACE = { skill: "skill", pair: "pair", pairKinds: "pair-kinds" } as const;
type CardKeyPlace = VocabularyWord<typeof CARD_KEY_PLACE>;

interface RowCard {
    register: CardRegister;
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
     * are read off this, so neither can be drawn without the other (`develop ADR 0089`).
     */
    caveat?: Caveat | null | undefined;
    /**
     * What that figure was made of, where the row stands over a cut somebody kept for it. Drawn
     * as a run of its own under a heading, the way a card draws one. `develop ADR 0041`.
     */
    cut?: RowCardCut | undefined;
    compose?: CardCompose | undefined;
}

/** A run of parts a row's card states, already worded and already stated. */
interface RowCardCut {
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

interface RowContent {
    name: string;
    figure: number;
    fill: number;
    shareText: string;
    colour: Colour;
    profession: string | null;
    rank: number | null;
    uses?: number | null | undefined;
    /** Whether this row's own figure is short of something. Only a person's row can be. */
    isSuspect?: boolean | undefined;
    /**
     * Which side this row stands on. `nobody` is every row with no person behind it and every
     * fight the client named no side of the reader's own on, and it draws no rule at all.
     */
    sideRelation?: SideRelation | undefined;
    /** Whether the game is numbering this combatant's turn. The ranking's answer and no other. */
    isTurnHolder?: boolean | undefined;
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
 * What a person's row can say beyond its own figure: which side it stands on, and whether the
 * game is numbering its turn. Read off the screen rather than off the row, because neither is a
 * fact about the figure — the same person draws differently on a fight with no seat to read from.
 */
interface PersonPlace {
    readerSide: number | null;
    /** Null off the ranking: a row inside an opened figure is a cut, not a place in the order. */
    turnHolderId: number | null;
}

/** A person as a row of the window beside the panel states them. */
interface HelperPerson {
    name: string;
    /**
     * The okrzyk this row is about, or null where no cast is. Drawn beside whoever cast it and
     * never on a row nested under them, where the row above already names it — the card says it
     * either way, because a card is read away from the row it came from.
     */
    skillName: string | null;
    colour: Colour;
    sideRelation: SideRelation;
    /** Null where the figure belongs to the row above rather than to this one. */
    turns: string | null;
    /**
     * What the figure above claims beyond itself, which is never nothing where one is drawn: a
     * length is counted on one person and the effect it dates stands on several
     * (`develop ADR 0101`).
     */
    turnsCaveat: Caveat | null;
    isNested: boolean;
}

/** What the panel could not do, as the runtime counted it: one line per kind, worded here. */
export interface PanelDefect {
    kind: PanelDefectKind;
    /** The region this row of the kind left undrawn, and null where the kind is none's. */
    region: PanelRegion | null;
    count: number;
}

/** A panel with no screen to draw, and which of the two reasons it has for standing there. */
export interface WaitingContent {
    isMeterCollapsed: boolean;
    defects: readonly PanelDefect[];
    /** A fight may be recorded and still not draw: a reading that would not compose leaves one. */
    hasFightToSave: boolean;
    /** A fight arrived and could not be turned into a screen. Never "there has been no fight". */
    isFightUnread: boolean;
    /** The kept fight the panel stands on, where it no longer reads: when and where it was. */
    keptUnread: KeptUnread | null;
    /** A reader may want the options before any fight has come, and they are drawn then too. */
    options: OptionsContent | null;
    typeStep: TypeStep;
    windowSizes: WindowSizes;
}

/** What the options draw: the reader's answers, and what the shelf said about the last one. */
export interface OptionsContent {
    storage: StorageChoice;
    answers: readonly string[];
}

export interface KeptUnread {
    at: FightMoment | null;
    place: string | null;
}

export interface ShownScreen {
    ranking: ScreenContent;
    /**
     * Which list this is — the place a reader stands in, named by `composeListName` in
     * `src/ui/panel-screen.ts`, which owns that fact. It decides nothing that is drawn: it says
     * whose position the region is put back to. `develop ADR 0050`.
     */
    listName: string;
    metric: PanelMetric;
    side: PanelSideChoice;
    /**
     * Which side the client marks as the reader's own, and null where it named none. It answers
     * two questions at once: whether the strips that narrow to a side are offered at all, and
     * which side each person's row stands on — `CONTEXT.md`, *Reader's side*.
     */
    readerSide: number | null;
    /**
     * Whose turn the game is numbering, or null — a fight already over numbers nobody's, and a
     * fight read from the shelf is somebody else's moment. The runtime decides; this layer draws.
     */
    turnHolderId: number | null;
    shelf: readonly ShelfRow[];
    /** Null while the options are away, which is every screen but the one cover. */
    options: OptionsContent | null;
    /** The size the type is drawn at, both windows at once. */
    typeStep: TypeStep;
    /** How big a reader made each window by its corner, which a frame hands to both. */
    windowSizes: WindowSizes;
    /** Whether the bar draws its save. False leaves no control rather than a dead one. */
    hasFightToSave: boolean;
    shelfAnswers: readonly string[];
    /**
     * What the panel could not do, as the ledger stood before this draw began, so a defect this
     * draw records is said at the next one and nothing a defect does can ask for a redraw.
     */
    defects: readonly PanelDefect[];
    isOnShelf: boolean;
    opened: OpenedLevelContent | null;
    pair: PairLevelContent | null;
    part: PartLevelContent | null;
    /** What stands under a pinned row a reader has opened. Never open beside `opened`. */
    unnamed: UnnamedLevelContent | null;
    /** A row under a pinned one, or beside `opened` the end that person's figure left out. */
    unnamedCut: UnnamedCutLevelContent | null;
    fightPlace: PlaceWords | null;
    /** What the fight's line opens, as a shelf row's opens the same (ADR 0014). */
    card: FightCardContent;
    isMeterCollapsed: boolean;
}

/** The panel on the page: the host the runtime puts there, and the three draws it asks for. */
export interface PanelView {
    element: PanelElement;
    render(shown: ShownScreen): RenderReport;
    /**
     * With no draw at all before the first payload, an add-on waiting for a fight and one that
     * died on the way to the page are the same picture.
     */
    renderWaiting(waiting: WaitingContent): RenderReport;
    /**
     * The window beside the panel, drawn on the same frame. An absence is why there is no live
     * reading, said in one sentence where the reading would stand.
     */
    renderHelper(helper: HelperContent | HelperAbsence, isCollapsed: boolean): RenderReport;
}

export interface PanelViewOptions {
    /** Which build drew the panel: a screenshot that does not say is a claim about no version. */
    addOnVersion: string;
    /** The size the first draw is made at, so a window opens where that size centres it. */
    typeStep: TypeStep;
    onIntent: (intent: PanelIntent) => void;
    /** What failed while no render was running: a gesture, a card, a window's opening place. */
    onFailure: (failure: ViewFailure) => void;
    /** Null is a window never made movable, which is every panel a test draws. */
    meterPlacement: PanelPlacement | null;
    /** The helper's own corner, kept apart from the panel's: two windows, two answers. */
    helperPlacement: PanelPlacement | null;
    /**
     * Null is the panel drawing its own words, which is what every test and every browser without
     * the game sees. Who asks the client, and how often, is the runtime's — `develop ADR 0024`.
     */
    translate: TranslateLabel | null;
}

/**
 * Where a region that would not draw is told: into the report of the render that was running,
 * or to the sink where none was — a card opened under the pointer draws between two frames.
 */
interface UndrawnReport {
    add(region: PanelRegion, cause: errors.Caught): void;
    collect(render: () => void): RenderReport;
}

interface PanelRegions {
    title: PanelElement;
    header: PanelElement;
    nouns: PanelElement;
    directions: PanelElement;
    crumb: PanelElement;
    options: PanelElement;
    list: PanelElement;
    pinnedActor: PanelElement;
    pinnedTarget: PanelElement;
    outside: PanelElement;
    sides: PanelElement;
    suspicions: PanelElement;
    defects: PanelElement;
}

/** What the fold and the settling after it are handed, by both of the panel's draws. */
interface PanelDrawing {
    document: PanelDocument;
    addOnVersion: string;
    sheet: PanelElement;
    getTypeStep(): TypeStep;
    setTypeStep(typeStep: TypeStep): void;
    regions: PanelRegions;
    frame: PanelElement;
    renderInPlace: PanelRedraw;
    report: UndrawnReport;
    drawing: ListDrawing;
    card: CardHandle;
    meterDrag: PanelDragHandle | null;
    helperDrag: PanelDragHandle | null;
}

type PanelRedraw = (
    previousRegion: PanelElement,
    region: PanelRegion,
    render: () => PanelElement,
) => PanelElement;

/**
 * The one region that scrolls, drawn for a named place so the reader's position follows it. The
 * three steps run in this order around a draw, and the order is the whole of what makes it work.
 */
interface ListDrawing {
    keep(): void;
    renderListRegion(name: string, render: () => PanelElement): void;
    settle(): void;
}

/**
 * What a card says, as a shape rather than a sentence: the panel draws a figure, a sub-line, a
 * heading and a note differently, and a renderer handed one string and a newline would hold that
 * decision where nothing can check it.
 */
export const CARD_LINE = { stat: "stat", sub: "sub", heading: "heading", note: "note" } as const;

/**
 * What a sentence at the foot of a card is about, which alone decides its ink. ⚠️ The glyph stays
 * inside the sentence's `text`: it counts in the card's height, and a node of its own would
 * shorten every note in that arithmetic while the drawn sentence stayed as long.
 */
export const CARD_NOTE_TONE = { plain: "plain", suspect: "suspect", caveat: "caveat" } as const;

export type CardNoteTone = VocabularyWord<typeof CARD_NOTE_TONE>;

type CardLine =
    | {
        kind: typeof CARD_LINE.stat;
        label: string;
        stated: string;
        isStrong: boolean;
        /** Required, so a figure joining the card is asked whether it names more than it counts. */
        caveat: Caveat | null;
    }
    | { kind: typeof CARD_LINE.sub; label: string; stated: string }
    | { kind: typeof CARD_LINE.heading; text: string }
    | { kind: typeof CARD_LINE.note; text: string; tone: CardNoteTone };

export interface CardGroup {
    lines: CardLine[];
}

export interface CardContent {
    name: string;
    subtitle: string | null;
    groups: CardGroup[];
}

/**
 * A **way to compose the card** rather than the card: a fight redraws every few seconds and
 * twenty rows are drawn each time, so composing every one would pay for nineteen nobody opens.
 */
type CardCompose = () => CardContent;

/**
 * What the pointer asks, and all it asks. Two windows fill two registers and the card is one, so
 * the handle is handed a reading rather than either register — `develop ADR 0086`.
 */
interface CardLookup {
    lookup(key: string): CardCompose | null;
}

/**
 * Filled by every draw and read by the pointer. The key is stated by the row rather than counted
 * off the draw order: a fight reorders its ranking between payloads, and a counted key would let
 * an open card go on describing whichever row now stands in that place.
 */
interface CardRegister extends CardLookup {
    add(key: string, compose: CardCompose): void;
    reset(): void;
}

interface CardSize {
    lines: number;
    groups: number;
}

type CardRedraw = (previousCard: PanelElement, compose: () => PanelElement) => PanelElement;

/**
 * How many characters of a card stand on one of its lines, as **floors** rather than a measurement
 * of any one text: counting low leaves the card standing higher up the screen than it had to, which
 * is the direction that keeps it on the screen.
 */
interface CharactersPerLine {
    /**
     * A note, and the line under the name too: it is drawn in the same face at the same size in
     * the same box, so what a sentence costs is what it costs.
     */
    note: number;
    /**
     * The name a card opens with, which is lower because the name is drawn bold and bold is wider.
     *
     * ⚠️ **A floor over characters cannot see where a line broke.** What it is short by is a name
     * whose last word is long, and the margin is what absorbs that; the one case measured past the
     * margin is an unbroken run of capitals — 60 of them draw four lines and count three. A real
     * name is not that, and the card carries the air to survive one line of it.
     */
    name: number;
}

interface CardHandle {
    element: PanelElement;
    onHover(key: string | null, clientY: number): void;
    renderOpen(): void;
}

interface CardSubject {
    name: string;
    profession: string | null;
    /** Which side they stand on, worded — the label the row's own rule is drawn against. */
    sideRelation: SideRelation;
    detail: RowDetail;
    metric: PanelMetric;
    doesOpen: boolean;
    /**
     * Whether the row the card stands over states a narrower figure than the card does. True
     * inside an opened row, where the row is a cut and the card is still the whole fight, and
     * `CARD_WORDS.scope` is what the card then owes the reader.
     */
    isRowNarrower: boolean;
    /** Asked only for a key this repository has no word for. Null on a page with no game on it. */
    translate: TranslateLabel | null;
}

interface CardFigure {
    metric: PanelMetric;
    figure: number;
    halfNamed: { label: string; figure: number } | null;
    /** The part a pool took rather than health, per pool, drawn under the figure it is part of. */
    absorbed: readonly CutPart[];
}

/**
 * Where a reader left the one region that scrolls, kept by which list was standing in it. A
 * redraw that replaces the region reads the position off the element about to go and writes it
 * onto whichever list stands next under the same name. `develop ADR 0050`.
 */
interface ScrollMemo {
    getTop(name: string): number;
    setTop(name: string, top: number): void;
}

const HOST_NAME = "MargoMeter-Panel";
/**
 * On the host where anything outside the root can read it: a screenshot of the panel is a report,
 * and one that does not say which build made it is a claim about no particular version.
 */
const VERSION_ATTRIBUTE = "data-margometer-version";
/** Four is every charge length the corpus states, and a clamp on a figure the game hands us. */
const CHARGED_PIPS_MAXIMUM = 8;
export const CARD_ATTRIBUTE = "data-card";
/**
 * The one card key no row states, so it can be a constant where every other is composed off what
 * the row stands for: one crumb is drawn at a time and its card says the same two things whatever
 * level it leaves.
 */
const CRUMB_CARD_KEY = "crumb:back";
/** The fight's line: one is drawn at a time, and its card is the fight on screen. */
const FIGHT_CARD_KEY = "fight";
const HELPER_CARD_PREFIX = "helper:";
/** The one person's row there is only ever one of, whoever is standing on it. */
const HELPER_NOW_CARD_KEY = `${HELPER_CARD_PREFIX}now`;
/**
 * The charge band's, keyed by whoever is making the blow ready: `core/charged-skill.ts` holds
 * one charge per combatant, so one row is one key. A second row under the same key would be
 * refused without a word and would wear its neighbour's card, which is why
 * `tests/ui/panel-helper.test.ts` counts the keys rather than trusting that. `develop ADR 0100`.
 */
const HELPER_CHARGE_CARD_PREFIX = `${HELPER_CARD_PREFIX}charge:`;
const HELPER_HOLDING_CARD_PREFIX = `${HELPER_CARD_PREFIX}holding:`;
const HELPER_HELD_CARD_PREFIX = `${HELPER_CARD_PREFIX}held:`;
const TITLE_ATTRIBUTE = "title";
/**
 * ⚠️ **No face in `system-ui, sans-serif` carries U+2B73 on this machine.** Chrome 152 draws it
 * anyway, from a font further down its own fallback, and `fc-list :charset=2b73` on 2026-08-30
 * named one — a coding face nobody installs on purpose. `↓` is the mark the UI sans itself
 * carries. A reader reporting a box here is reporting that, and the swap is one character.
 */
const SAVE_MARK = "⭳";
const SHELF_MARK = "☰";
/** Carried by the face ☰ is drawn in: `fc-list :charset=2699` on 2026-09-27 named DejaVu Sans. */
const OPTIONS_MARK = "⚙";
const FOLD_MARK = "—";
const UNFOLD_MARK = "+";
const BACK_MARK = "‹ ";
const GRIP_MARK = "⠿ ";
/** The button a press has to be to open anything. A press that states none is that button. */
const PRIMARY_BUTTON = 0;
/**
 * ⚠️ **One more than the shelf keeps, and the shelf list is the only list that draws it.** The
 * row for the fight still **running** is not a kept one — a fight goes on the shelf when it ends
 * — so a reader with a full shelf who starts a fight is handed one row past `KEPT_MAXIMUM` in
 * `src/runtime/shelf.ts`. Asserting the ranking's bound here took the whole list down at
 * exactly that moment, reported on 0.12.1 with a capture of a one-payload fight whose ranking
 * held three rows. `tests/ui/shelf-bound.test.ts` holds the two constants together, and is the
 * one place both layers may be read at once.
 */
export const SHELF_ROWS_MAXIMUM = 21;
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
 * Measured over `captures/` with `develop`'s `deno task panel:drill` on 2026-09-01: the widest
 * pinned row states four kinds, and 27 of the 28 state three or fewer. Six is headroom rather than
 * a bound anything meets — and a reachable one, because `takenWithNoTarget` folds the ten keys a
 * blow carries in with the seven a bare movement does.
 */
const CARD_CUT_PARTS_MAXIMUM = 6;
/** A bar is written to one place: a tenth of a 260-pixel row is a quarter of a pixel. */
const FILL_PLACES = 1;
const AS_PERCENT = 100;

/** Past every region one render redraws: the panel's body redraws fourteen, the helper two. */
const UNDRAWN_MAXIMUM = 32;

/** One line per kind at most, which is what the runtime's ledger holds. */
const DEFECTS_MAXIMUM = Object.values(PANEL_DEFECT_KIND).length;

/**
 * Counted off **an opened row**, the widest screen the panel has: its three sections, each with
 * an unnamed row and a heading, and the two pinned rows. Counted off the ranking it was 128,
 * which a drill reaches; counted with a skill section of names alone it was 384, and on the two
 * screen that section is names **and** the keys no announcement covered. A row past the
 * bound registers nothing, and `onHover` then hides the card rather than drawing one.
 * `tests/ui/share-bound.test.ts` is where the arithmetic is, against the panel's own constants.
 */
const CARDS_DRAWN_MAXIMUM = 512;
/**
 * One row per type step. The small one: notes at 242 pixels of type — the window less its padding —
 * in Chrome on 2026-08-29, where the longest note this panel composes ran 104 characters over three
 * lines and the shortest 31 over one; names in Chrome 152 on 2026-09-18 at 240 pixels of type, over
 * the 31 names `captures/` carries composed into the place shape a shelf row states (`Nazwa (x, y)`)
 * and read at every prefix length: 2,211 readings, and 27 is the **largest** floor that
 * under-counts none of them.
 *
 * **The other two steps keep the small one's floors**, because the card's bound grows with its
 * type. Measured in Chrome 154 on 2026-09-28 at each step's own bound, over every prefix of the 112
 * notes the ranking cards of `captures/` compose and of its 20 names in the place shape, drawn
 * bold as a name: the largest floor under-counting none is 36 for a name and 42 for a note at
 * all three, so no step reads a line as holding more than the small one does.
 */
const CHARACTERS_PER_LINE_BY_STEP: { readonly [Step in TypeStep]: CharactersPerLine } = {
    [TYPE_STEP.small]: { note: 32, name: 27 },
    [TYPE_STEP.medium]: { note: 32, name: 27 },
    [TYPE_STEP.large]: { note: 32, name: 27 },
};
/**
 * What the drawn mark opening a caveated note takes off that note's first line, as the characters
 * it stands in the room of: the ring and the air after it, against a body character's own width.
 */
const NOTE_MARK_CHARACTERS = 2;
/**
 * Past every card this panel composes: four figures and their parts, the counters, both runs — the
 * criticals, the defences, the procs and what a blow destroyed — and the notes. The tallest card
 * any recording composes is 31 lines and the median 23, over the 1,260 cards the ranking of
 * `captures/` opens on 2026-09-25 — `deno task panel:cards` is what measures it, and
 * this is headroom rather than a limit anything meets.
 */
const CARD_LINES_MAXIMUM = 64;
/**
 * What the edge a card is **not** measured from is released to. Both are always written together:
 * leaving one off would let the sheet's own fallback stand beside the offset just written, and the
 * card would be pinned by both edges at once — which is a width nobody chose (`develop ADR 0091`).
 */
const EDGE_RELEASED = "auto";
/** Past every card there is: four figures, the counters, both runs and the notes come to five. */
const CARD_GROUPS_MAXIMUM = 16;
/** Past the widest cut a card draws: fourteen worded procs, four destroyed, three defences. */
const CARD_PARTS_MAXIMUM = 64;
/** Counted in the line above it rather than beside it, so the card never says it twice. */
const OFFHAND_CRIT_KEY = "+of_crit";
/** Headroom rather than a bound anything meets: a reader comes back to a handful of places. */
const LISTS_KEPT_MAXIMUM = 32;
/** What a note's tone adds to its class, a space before it where it adds anything. */
const CARD_NOTE_TONE_CLASS: Record<CardNoteTone, string> = {
    [CARD_NOTE_TONE.plain]: "",
    [CARD_NOTE_TONE.suspect]: ` ${CLASS.cardSuspect}`,
    [CARD_NOTE_TONE.caveat]: ` ${CLASS.cardCaveatNote}`,
};

export function initPanelView(document: PanelDocument, options: PanelViewOptions): PanelView {
    let typeStep = options.typeStep;
    const host = document.createElement("div");
    let root: PanelRoot;
    let sheet: PanelElement;
    // Build the host, and the root everything else goes into.
    {
        // Both are built once and stay: only the regions inside are replaced, so the listener at
        // the root outlives every redraw and a press during one is not swallowed. The sheet is
        // written again only when the reader chooses another size of type — a region redrawn
        // under it keeps its look, and a browser re-parses nothing on a redraw.
        host.setAttribute("id", HOST_NAME);
        host.setAttribute(VERSION_ATTRIBUTE, options.addOnVersion);
        root = host.attachShadow({ mode: "open" });
        sheet = document.createElement("style");
        sheet.textContent = composeStyleSheet(typeStep);
        root.append(sheet);
    }
    const regions: PanelRegions = {
        title: renderElement(document, "div", CLASS.title),
        header: renderSlot(document),
        nouns: renderSlot(document),
        directions: renderSlot(document),
        crumb: renderSlot(document),
        options: renderSlot(document),
        list: renderSlot(document),
        pinnedActor: renderSlot(document),
        pinnedTarget: renderSlot(document),
        outside: renderSlot(document),
        sides: renderSlot(document),
        suspicions: renderSlot(document),
        defects: renderSlot(document),
    };
    const meterGrip = renderSizeGrip(document, PANEL_WINDOW.meter);
    const frame = renderElement(document, "div", CLASS.frame);
    // Put every region in the order it is drawn in, inside the frame the fold collapses.
    {
        const meter = renderElement(document, "div", CLASS.meter);
        for (const region of [regions.header, regions.nouns, regions.directions, regions.crumb]) {
            meter.append(region);
        }
        meter.append(regions.options);
        for (const region of [regions.list, regions.pinnedActor, regions.pinnedTarget]) {
            meter.append(region);
        }
        meter.append(regions.outside);
        meter.append(regions.sides);
        meter.append(regions.suspicions);
        meter.append(regions.defects);
        meter.append(meterGrip);
        frame.append(meter);
    }
    let report: UndrawnReport;
    // Tell a region that would not draw to the render running, or to the sink where none is.
    {
        let collected: RegionUndrawn[] | null = null;
        report = {
            add(region, cause) {
                const failure = new RegionUndrawn(region, cause);
                if (collected === null) {
                    addViewFailureGuarded(options.onFailure, failure);
                    return;
                }
                if (collected.length < UNDRAWN_MAXIMUM) collected.push(failure);
            },
            // ⚠️ Every step of a render stands under a guard of its own, so nothing leaves
            // `render` with the report still collecting. A step added unguarded would take the
            // sink with it.
            collect(render: () => void): RenderReport {
                const undrawn: RegionUndrawn[] = [];
                collected = undrawn;
                render();
                collected = null;
                return { undrawn };
            },
        };
    }
    const renderInPlace = (
        previousRegion: PanelElement,
        region: PanelRegion,
        render: () => PanelElement,
    ): PanelElement => {
        const renderedRegion = renderRegion(document, region, render, report);
        if (renderedRegion === null) return previousRegion;
        // The document's own call, and a region's to lose rather than the whole draw's: what
        // stands is the region as it was, which a reader has already read once.
        const replaced = errors.attempt(() => previousRegion.replaceWith(renderedRegion));
        if (!(replaced instanceof Error)) return renderedRegion;
        report.add(region, replaced);
        return previousRegion;
    };
    const meterRegister = createCardRegister();
    const helperRegister = createCardRegister();
    let drawing: ListDrawing;
    // Draw the one region that scrolls, keeping the reader's position under the place it is for.
    {
        const scrolls = createScrollMemo();
        // Which list is standing in the region, so a position read off it is kept under the place
        // it belongs to rather than under the place taking its turn.
        let shownName = WAITING_LIST_NAME;
        let isRegionKept = false;
        drawing = {
            // ⚠️ **Before any region is redrawn.** A region taken away grows the list under it,
            // and a browser answers a taller box by clamping the position on it — the reader's own
            // place, gone before anything read it. Measured on Chrome 152.0.7977.64, 2026-09-04:
            // going back from a level takes the crumb away, and 54 pixels became 34 as it went.
            keep: () => {
                const top = readTopOfList(regions.list);
                if (top !== null) scrolls.setTop(shownName, top);
            },
            renderListRegion: (name: string, render: () => PanelElement): void => {
                const renderedList = renderRegion(document, PANEL_REGION.list, render, report);
                if (renderedList === null) return;
                // The same list, drawn again: a payload landing is not a reason to take the region
                // the reader is turning away from them. Another list is the region replaced, so
                // the place kept under its own name is what they land on.
                isRegionKept = name === shownName && renderListRows(regions.list, renderedList);
                if (!isRegionKept) {
                    const replaced = errors.attempt(() => regions.list.replaceWith(renderedList));
                    if (replaced instanceof Error) report.add(PANEL_REGION.list, replaced);
                    else regions.list = renderedList;
                }
                shownName = name;
            },
            // And after every region is standing, for the same reason read the other way round. A
            // fold empties the region like any other and takes no name away, so what a reader
            // unfolds onto is the list they were reading, at the position they left it at.
            // Nothing to put back where the region itself stayed: the browser has the reader's
            // place already.
            settle: () => {
                if (isRegionKept) return;
                writeTopOfList(regions.list, scrolls.getTop(shownName));
            },
        };
    }
    let meterDrag: PanelDragHandle | null = null;
    let helperDrag: PanelDragHandle | null = null;
    const cardLookup = composeCardLookup(meterRegister, helperRegister);
    const getTypeStep = () => typeStep;
    let cardHandle: CardHandle;
    // Place the card against wherever its own window stands **now**, not where it was wired.
    {
        // Both the place and the room are asked of the windows as they are, because a drag moves
        // one and a window resize moves the other. **Which window a card opens beside is decided
        // off its key**, the one thing the handle holds that says where the row it names is
        // drawn: placed against the panel, a card from the second window opened straight over
        // that window's own lower rows (`develop ADR 0090`).
        const placement = options.meterPlacement;
        const composePlace = (handle: PanelDragHandle | null): CardWindowPlace | null => {
            const position = handle?.getPosition() ?? null;
            if (handle === null) return null;
            if (position === null) return null;
            return { position, widthPixels: handle.getWidthPixels() };
        };
        const composeAcross = (key: string): CardAcross | null => {
            // The sheet's own token and never a copy of it: the two spellings drifted on
            // 2026-09-15 and the card, drawn at one width and placed as if it were the other,
            // stood 43px over the rows it explains. It decides the **side** a card opens on and
            // nothing else (`develop ADR 0091`).
            const viewport = placement?.readViewport() ?? null;
            const tokens = TYPE_TOKENS[getTypeStep()];
            if (key.startsWith(HELPER_CARD_PREFIX)) {
                const helperPlace = composePlace(helperDrag);
                return composeCardAcross(helperPlace, viewport, tokens.cardWidthPixelsMaximum);
            }
            const meterPlace = composePlace(meterDrag);
            return composeCardAcross(meterPlace, viewport, tokens.cardWidthPixelsMaximum);
        };
        cardHandle = initCardHandle(
            document,
            cardLookup,
            // The card, which cannot degrade as a region does. A region's fallback is a sentence
            // standing where it was; the card is a child of the root and the only thing the sheet
            // places, so that sentence would be a block under the panel. A card that will not
            // render is no card: the one standing hides (**E12**).
            (previousCard, render) => {
                const rendered = errors.attempt(() => {
                    const renderedCard = render();
                    previousCard.replaceWith(renderedCard);
                    return renderedCard;
                });
                if (!(rendered instanceof Error)) return rendered;
                report.add(PANEL_REGION.card, rendered);
                setCardHidden(previousCard, true);
                return previousCard;
            },
            composeAcross,
            () => placement?.readViewport()?.height ?? null,
            getTypeStep,
        );
    }
    // The window beside the panel, as one element under the same root — `SECURITY.md`'s guest
    // rule puts everything a reader meets inside one shadow root under one name.
    const helperWindow = renderElement(document, "div", CLASS.helper);
    let helperBar = renderHelperBar(document, false);
    let helperBody = renderSlot(document);
    const helperGrip = renderSizeGrip(document, PANEL_WINDOW.helper);
    helperWindow.append(helperBar);
    helperWindow.append(helperBody);
    helperWindow.append(helperGrip);
    for (const child of [regions.title, frame, cardHandle.element, helperWindow]) {
        root.append(child);
    }
    // Listen at the root, and on no row.
    {
        // Two windows sit under that root — `develop ADR 0060` — so the second is asked whether it
        // holds a press.
        const onHover = cardHandle.onHover;
        // The press and never the click: a browser assembles a click out of two moments and
        // dispatches it only if both resolve to a node still in the tree, so a payload landing
        // between the press and the release would detach what was pressed and dispatch nothing.
        addGuardedListener(root, EVENT_TYPE.press, PANEL_LISTENER.press, (event) => {
            // The primary button alone: without this a right press would open a row and the
            // listener below would step straight back out of it, which is worse than either half.
            if ((event.button ?? PRIMARY_BUTTON) !== PRIMARY_BUTTON) return;
            const target = event.target;
            if (target === null) return;
            const intent = readPanelIntent(target);
            if (intent instanceof Error) {
                addViewFailureGuarded(
                    options.onFailure,
                    new GestureDropped(PANEL_LISTENER.press, intent),
                );
                return;
            }
            if (intent !== null) options.onIntent(intent);
        }, options.onFailure);
        // One gesture in, one gesture out, and the way out works from anywhere on the panel: a
        // back control alone would make the cheapest gesture the one that needs aiming. The window
        // beside the panel is not the panel, and a press landing in it moves nothing —
        // `develop ADR 0071`. The menu is stopped either way: the panel suppresses it under the
        // whole root.
        addGuardedListener(root, EVENT_TYPE.back, PANEL_LISTENER.back, (event) => {
            event.preventDefault?.();
            // A press stating no target is nobody's window, and keeps the panel's meaning.
            if (helperWindow.contains(event.target)) return;
            options.onIntent({ kind: PANEL_INTENT.close });
        }, options.onFailure);
        addGuardedListener(root, EVENT_TYPE.move, PANEL_LISTENER.hover, (event) => {
            const target = event.target;
            onHover(target === null ? null : target.getAttribute(CARD_ATTRIBUTE), event.clientY);
        }, options.onFailure);
        // What closes the card. `pointerleave` does not bubble and a shadow root is not on the
        // composed path of one dispatched to an element, so the one listener would never see it;
        // `pointerout` bubbles — and therefore fires on every crossing **inside** a row, whose
        // bar, rank, name and figure are four elements. What the pointer went *to* tells the two
        // apart: a crossing that lands on the same row's mark is not a leaving, and reading it
        // keeps the card from being thrown away and rebuilt four times on the way across the row.
        addGuardedListener(root, EVENT_TYPE.leave, PANEL_LISTENER.leave, (event) => {
            const went = event.relatedTarget ?? null;
            onHover(went === null ? null : went.getAttribute(CARD_ATTRIBUTE), event.clientY);
        }, options.onFailure);
    }
    // After the listeners that read a press, and on the same root: a drag is four more of them.
    const dragOptions = { view: options, getTypeStep };
    const meterDragOptions = { ...dragOptions, window: PANEL_WINDOW.meter, grip: meterGrip };
    meterDrag = initPanelDragIfPlaced(
        root,
        host,
        () => regions.title,
        options.meterPlacement,
        meterDragOptions,
    );
    const helperDragOptions = { ...dragOptions, window: PANEL_WINDOW.helper, grip: helperGrip };
    const helperBarNow = () => helperBar;
    const helperPlacement = options.helperPlacement;
    helperDrag = initPanelDragIfPlaced(
        root,
        helperWindow,
        helperBarNow,
        helperPlacement,
        helperDragOptions,
    );
    const panelDrawing: PanelDrawing = {
        document,
        addOnVersion: options.addOnVersion,
        sheet,
        getTypeStep,
        setTypeStep: (typeStepChosen: TypeStep) => typeStep = typeStepChosen,
        regions,
        frame,
        renderInPlace,
        report,
        drawing,
        card: cardHandle,
        meterDrag,
        helperDrag,
    };
    const renderScreen = (shown: ShownScreen): RenderReport =>
        report.collect(() => {
            executeRegionStep(report, PANEL_REGION.list, () => drawing.keep());
            meterRegister.reset();
            renderFold(panelDrawing, shown);
            if (shown.isMeterCollapsed) {
                renderPanelFolded(document, regions, renderInPlace);
            } else if (shown.options !== null) {
                renderPanelOptions(
                    document,
                    { regions, renderInPlace, drawing, register: meterRegister },
                    shown.options,
                    { typeStep: shown.typeStep, windowSizes: shown.windowSizes },
                );
                regions.defects = renderInPlace(
                    regions.defects,
                    PANEL_REGION.defects,
                    () => renderDefects(document, shown.defects),
                );
            } else {
                regions.header = renderInPlace(
                    regions.header,
                    PANEL_REGION.header,
                    () => renderHeaderRegion(document, meterRegister, shown),
                );
                regions.nouns = renderInPlace(
                    regions.nouns,
                    PANEL_REGION.strips,
                    () => renderNounStrips(document, shown),
                );
                regions.directions = renderInPlace(
                    regions.directions,
                    PANEL_REGION.strips,
                    () => renderDirectionStrips(document, shown),
                );
                regions.crumb = renderInPlace(
                    regions.crumb,
                    PANEL_REGION.crumb,
                    () => renderCrumbRegion(document, meterRegister, shown),
                );
                regions.options = renderInPlace(
                    regions.options,
                    PANEL_REGION.strips,
                    () => renderSlot(document),
                );
                drawing.renderListRegion(
                    shown.listName,
                    () => renderListLevel(document, meterRegister, shown, options.translate),
                );
                renderPinnedRows(document, regions, renderInPlace, meterRegister, shown);
                // Draw what stands under the list: past the ranking, the sides, warnings, defects.
                regions.outside = renderInPlace(
                    regions.outside,
                    PANEL_REGION.outside,
                    () => renderOutsideRegion(document, meterRegister, shown),
                );
                // Whether there is a summary to draw is asked **inside** the guard, not before it:
                // a reading that throws on being asked cost the whole panel where the question
                // stood outside.
                regions.sides = renderInPlace(
                    regions.sides,
                    PANEL_REGION.sides,
                    () => renderSidesRegion(document, shown),
                );
                regions.suspicions = renderInPlace(
                    regions.suspicions,
                    PANEL_REGION.suspicions,
                    () =>
                        renderSuspicions(
                            document,
                            shown.isOnShelf ? shown.shelfAnswers : shown.ranking.suspicions,
                        ),
                );
                // Last, and drawn on every screen: what the panel could not do is not about the
                // fight, so it does not go away when the reader switches to another one —
                // `DESIGN.md`.
                regions.defects = renderInPlace(
                    regions.defects,
                    PANEL_REGION.defects,
                    () => renderDefects(document, shown.defects),
                );
            }
            renderPanelSettled(panelDrawing);
        });
    const renderWaiting = (waiting: WaitingContent): RenderReport =>
        report.collect(() => {
            executeRegionStep(report, PANEL_REGION.list, () => drawing.keep());
            meterRegister.reset();
            renderFold(panelDrawing, waiting);
            renderPanelFolded(document, regions, renderInPlace);
            // A defect can arrive before a fight does — a reading that would not compose leaves
            // the panel waiting — so what could not be done is drawn here too.
            if (!waiting.isMeterCollapsed) {
                if (waiting.options !== null) {
                    renderPanelOptions(
                        document,
                        { regions, renderInPlace, drawing, register: meterRegister },
                        waiting.options,
                        { typeStep: waiting.typeStep, windowSizes: waiting.windowSizes },
                    );
                } else {
                    drawing.renderListRegion(
                        WAITING_LIST_NAME,
                        () => renderWaitingList(document, waiting),
                    );
                }
                regions.defects = renderInPlace(
                    regions.defects,
                    PANEL_REGION.defects,
                    () => renderDefects(document, waiting.defects),
                );
            }
            renderPanelSettled(panelDrawing);
        });
    const renderHelper = (
        helper: HelperContent | HelperAbsence,
        isCollapsed: boolean,
    ): RenderReport =>
        report.collect(() => {
            // The mark on the frame and the body rendered empty, both — as the panel's fold does.
            // The frame is what stays across a draw, so it is what can say the window is away.
            executeRegionStep(report, PANEL_REGION.helper, () => {
                helperWindow.className = isCollapsed
                    ? `${CLASS.helper} ${CLASS.helperFolded}`
                    : CLASS.helper;
            });
            helperBar = renderInPlace(
                helperBar,
                PANEL_REGION.helper,
                () => renderHelperBar(document, isCollapsed),
            );
            // ⚠️ The two windows keep two registers because they are drawn at two moments: this
            // one goes up first and the panel's own draw resets the panel's register under it,
            // which took every card this window had registered with it (`develop ADR 0086`).
            helperRegister.reset();
            helperBody = renderInPlace(
                helperBody,
                PANEL_REGION.helper,
                () => renderHelperBody(document, helperRegister, helper, isCollapsed),
            );
            helperDrag?.onDrawn();
        });
    return { element: host, render: renderScreen, renderWaiting, renderHelper };
}

/** Draw the list while no fight stands: kept unread, unread, or none yet. */
function renderWaitingList(document: PanelDocument, waiting: WaitingContent): PanelElement {
    const list = renderListContainer(document, ROWS_WAITING);
    list.className = `${CLASS.list} ${CLASS.listWaiting}`;
    const kept = waiting.keptUnread;
    if (kept !== null) {
        list.append(renderEmptyNote(document, PANEL_WORDS.keptUnread));
        const when = formatKeptUnread(kept.at, kept.place);
        if (when.length > 0) list.append(renderEmptyNote(document, when));
        return list;
    }
    const said = waiting.isFightUnread ? PANEL_WORDS.fightUnread : PANEL_WORDS.noFightYet;
    list.append(renderEmptyNote(document, said));
    return list;
}

/** Draw the helper's body: whose turn it is, the charges, and who holds whom. */
function renderHelperBody(
    document: PanelDocument,
    register: CardRegister,
    helper: HelperContent | HelperAbsence,
    isCollapsed: boolean,
): PanelElement {
    // Folded, the body is rendered empty rather than rendered and hidden — a fight
    // redraws every few seconds, and what is not drawn costs nothing to draw.
    if (isCollapsed) return renderSlot(document);
    const body = renderElement(document, "div", CLASS.helperBody);
    if (typeof helper === "string") {
        body.append(renderEmptyNote(document, getWordsForHelperAbsence(helper)));
        return body;
    }
    // What is true of one fighter is said on that fighter, in the game's own tooltip
    // (`develop ADR 0108`), so nothing below is drawn per combatant.
    // Say whose turn the game numbers, or why it numbers none — `develop ADR 0072`.
    {
        const said = helper.turnOrdinal === null ? "" : formatTurnOrdinal(helper.turnOrdinal);
        const section = renderElement(document, "div", CLASS.section);
        const words = renderText(document, "span", CLASS.sectionWords, HELPER_WORDS.now);
        const figure = renderText(document, "span", CLASS.figure, said);
        section.append(words);
        section.append(figure);
        body.append(section);
        const holder = helper.turnHolder;
        if (holder === null) {
            const empty = renderText(
                document,
                "div",
                CLASS.empty,
                getWordsForTurnState(helper.turnState),
            );
            body.append(empty);
        } else {
            body.append(
                renderHelperPerson(document, register, HELPER_NOW_CARD_KEY, {
                    name: holder.name,
                    skillName: null,
                    colour: holder.colour,
                    sideRelation: holder.sideRelation,
                    turns: null,
                    turnsCaveat: null,
                    isNested: false,
                }),
            );
        }
    }
    // Draw the charge band where a charge is: a heading, and a row per charge.
    if (helper.chargedSkills.length > 0) {
        const firstCharged = helper.chargedSkills[0];
        const section = renderElement(document, "div", CLASS.section);
        const words = renderText(document, "span", CLASS.sectionWords, HELPER_WORDS.chargedSkill);
        const state = renderText(
            document,
            "span",
            CLASS.figure,
            firstCharged === undefined ? "" : getWordsForChargedSkill(firstCharged.state),
        );
        section.append(words);
        section.append(state);
        body.append(section);
        // A row opens nothing, so it wears the leaf's cursor and carries the card that
        // hands back what its name cell cut — every row in this window does since
        // `develop ADR 0100`.
        for (const charged of helper.chargedSkills) {
            const row = renderElement(
                document,
                "div",
                `${CLASS.row} ${CLASS.rowLeaf}`,
            );
            const cap = renderElement(document, "div", CLASS.barCap);
            cap.setAttribute(
                STYLE_ATTRIBUTE,
                `background:${formatColour(charged.colour)}`,
            );
            const name = renderText(document, "span", CLASS.rowName, charged.skillName);
            const counter = renderText(
                document,
                "span",
                `${CLASS.rowValue} ${CLASS.figure}`,
                formatCounter(charged.turnsElapsed, charged.turnsStated),
            );
            const pips = renderElement(document, "div", CLASS.helperPips);
            const dots: PanelElement[] = [pips];
            // Draw one dot per turn of the charge, lit up to what has passed.
            {
                // ⚠️ **Every dot is a node a pointer may land on**, and a card is read
                // off the node under the hand, never walked up from: each goes on to be
                // marked with the row's key, or the widest thing on the row is a run of
                // holes the card closes in.
                pips.setAttribute(
                    STYLE_ATTRIBUTE,
                    `color:${formatColour(charged.colour)}`,
                );
                const stated = Math.min(
                    Math.max(charged.turnsStated, 0),
                    CHARGED_PIPS_MAXIMUM,
                );
                for (let turn = 0; turn < stated; turn += 1) {
                    const lit = turn < charged.turnsElapsed ? ` ${CLASS.helperPipLit}` : "";
                    const pip = renderElement(
                        document,
                        "div",
                        `${CLASS.helperPip}${lit}`,
                    );
                    pips.append(pip);
                    dots.push(pip);
                }
            }
            row.append(cap);
            row.append(name);
            row.append(pips);
            row.append(counter);
            const parts = [cap, name, ...dots, counter];
            for (const rule of renderSideRules(document, charged.sideRelation)) {
                row.append(rule);
                parts.push(rule);
            }
            const key = `${HELPER_CHARGE_CARD_PREFIX}${formatWholeUngrouped(charged.combatantId)}`;
            register.add(key, () => presentChargedSkillCard(charged));
            setRowMarks([row, ...parts], CARD_ATTRIBUTE, key);
            body.append(row);
        }
    }
    if (helper.provocations.length === 0) {
        if (helper.chargedSkills.length === 0) {
            const empty = renderText(document, "div", CLASS.empty, HELPER_WORDS.nothingHappens);
            body.append(empty);
        }
        return body;
    }
    // Draw one row per person holding, and under it one per person held.
    {
        // The turns stand on the rows under, because a shout runs on the turns of
        // whoever it holds (`develop ADR 0103`). The heading counts the characters
        // held, and never the casts holding them: `develop ADR 0062`'s heading counts
        // people.
        let counted = 0;
        for (const provocation of helper.provocations) counted += provocation.provoked.length;
        body.append(
            renderSection(document, HELPER_WORDS.provocation, counted),
        );
        for (const provocation of helper.provocations) {
            // The fold's own key, so a card is filed under the cast rather than under
            // the person: one caster shouting both okrzyki stands twice
            // (`develop ADR 0097`).
            const cast = `${formatWholeUngrouped(provocation.casterId)}/${
                formatWholeUngrouped(provocation.skillId)
            }`;
            body.append(renderHelperPerson(
                document,
                register,
                `${HELPER_HOLDING_CARD_PREFIX}${cast}`,
                {
                    name: provocation.casterName,
                    skillName: provocation.skillName,
                    colour: provocation.casterColour,
                    sideRelation: provocation.casterSideRelation,
                    // No length here: one cast holding two characters is two counts on
                    // two clocks, so the figure sits on the row of whoever is carrying
                    // it (`develop ADR 0103`).
                    turns: null,
                    turnsCaveat: null,
                    isNested: false,
                },
            ));
            for (const holding of provocation.provoked) {
                // The cast as well as whoever it holds, although
                // `core/aura-standing.ts` keys a provocation by that character and so
                // hands each one over once. A key that leans on somebody else's keying
                // fails silently the day it moves: the register refuses the second of
                // two rows without a word, and that row then wears its neighbour's
                // card.
                const key = `${HELPER_HELD_CARD_PREFIX}${cast}/${
                    formatWholeUngrouped(holding.provokedId)
                }`;
                body.append(renderHelperPerson(document, register, key, {
                    name: holding.name,
                    // Named on the card and never on the row: the row above draws it
                    // already, and what this row does state is a length of this
                    // character's own (`develop ADR 0103`).
                    skillName: provocation.skillName,
                    colour: holding.colour,
                    sideRelation: holding.sideRelation,
                    turns: formatCounter(
                        holding.turnsStated - holding.turnsElapsed,
                        holding.turnsStated,
                    ),
                    turnsCaveat: null,
                    isNested: true,
                }));
            }
        }
    }
    return body;
}

/** Draw the fight's line: the sides, how it ended and where, under the fight's card. */
function renderHeaderRegion(
    document: PanelDocument,
    register: CardRegister,
    shown: ShownScreen,
): PanelElement {
    if (shown.isOnShelf) return renderSlot(document);
    const header = renderElement(document, "div", CLASS.header);
    const line = renderElement(document, "div", CLASS.headerLine);
    const who = renderText(
        document,
        "span",
        "",
        formatSideCounts(shown.ranking.sizes, shown.ranking.unplaced),
    );
    line.append(who);
    // Every part carries the key, because a pointer lands on the innermost one.
    const marked = [line, who];
    // Absent rather than empty where the reading says nothing, and
    // `ui/panel-content.ts` says when it does and why the header may not fill the
    // silence in.
    const outcome = shown.ranking.outcome;
    if (outcome !== null) {
        const said = renderText(document, "span", CLASS.headerOutcome, getWordsForOutcome(outcome));
        line.append(said);
        marked.push(said);
    }
    if (shown.fightPlace !== null) {
        // The name gives way and the tile never does (ADR 0014). The tile carries
        // its own space, so the place reads as one text to anything that reads its
        // text, and the card states it whole.
        const place = shown.fightPlace;
        const where = renderElement(document, "span", CLASS.headerPlace);
        if (place.name !== null) {
            const name = renderText(document, "span", CLASS.headerPlaceName, place.name);
            where.append(name);
        }
        if (place.tile !== null) {
            const tile = renderText(
                document,
                "span",
                CLASS.headerPlaceTile,
                place.name === null ? place.tile : ` ${place.tile}`,
            );
            where.append(tile);
        }
        line.append(where);
        marked.push(where, ...Array.from(where.children));
    }
    header.append(line);
    register.add(FIGHT_CARD_KEY, () => presentFightCard(shown.card));
    setRowMarks(marked, CARD_ATTRIBUTE, FIGHT_CARD_KEY);
    return header;
}

/** Draw the strips that choose the screen's noun. */
function renderNounStrips(
    document: PanelDocument,
    shown: ShownScreen,
): PanelElement {
    if (shown.isOnShelf) return renderSlot(document);
    const strips = renderElement(document, "div", CLASS.strips);
    for (const strip of presentNounStrips(shown.metric)) {
        strips.append(
            renderStrip(document, PANEL_MARK.screen, getShownStrip(strip, shown)),
        );
    }
    return strips;
}

/** Draw the strips that choose the direction, and the side where one is named. */
function renderDirectionStrips(
    document: PanelDocument,
    shown: ShownScreen,
): PanelElement {
    if (shown.isOnShelf) return renderSlot(document);
    const strips = renderElement(document, "div", CLASS.strips);
    for (const strip of presentDirectionStrips(shown.metric)) {
        strips.append(
            renderStrip(document, PANEL_MARK.screen, getShownStrip(strip, shown)),
        );
    }
    if (shown.readerSide === null) return strips;
    strips.append(renderElement(document, "span", CLASS.stripsGap));
    for (const strip of presentSideStrips(shown.side)) {
        strips.append(
            renderStrip(document, PANEL_MARK.side, getShownStrip(strip, shown)),
        );
    }
    return strips;
}

/** Draw the way back from the level that is open, and nothing where none is. */
function renderCrumbRegion(
    document: PanelDocument,
    register: CardRegister,
    shown: ShownScreen,
): PanelElement {
    if (shown.isOnShelf) {
        return renderCrumb(document, register, {
            said: PANEL_WORDS.fights,
            from: PANEL_WORDS.backFromFights,
        });
    }
    if (shown.unnamedCut !== null) {
        const unnamed = getWordsForUnnamedRow(
            getEndForPinned(shown.unnamedCut.case),
        );
        // Under an opened person the level is their end left out, and the way back
        // is to them.
        if (shown.opened !== null) {
            return renderCrumb(document, register, {
                said: unnamed,
                from: shown.opened.name ?? PANEL_WORDS.unknown,
            });
        }
        return renderCrumb(document, register, {
            said: getCrumbWordsForUnnamedCut(shown.unnamedCut, shown.metric),
            from: unnamed,
        });
    }
    if (shown.unnamed !== null) {
        return renderCrumb(document, register, {
            said: getWordsForUnnamedRow(shown.unnamed.end),
            from: null,
        });
    }
    if (shown.opened === null) return renderSlot(document);
    const opened = shown.opened.name ?? PANEL_WORDS.unknown;
    if (shown.part !== null) {
        return renderCrumb(document, register, {
            said: getWordsForNamedPart(shown.part.part, shown.metric),
            from: opened,
        });
    }
    if (shown.pair === null) {
        return renderCrumb(document, register, { said: opened, from: null });
    }
    return renderCrumb(document, register, {
        said: shown.pair.otherName ?? PANEL_WORDS.unknown,
        from: opened,
    });
}

/** Draw the list: the shelf, a level opened over the ranking, or the ranking. */
function renderListLevel(
    document: PanelDocument,
    register: CardRegister,
    shown: ShownScreen,
    translate: TranslateLabel | null,
): PanelElement {
    if (shown.isOnShelf) {
        // The size stands before the place and not after it, so the one cell that
        // can be cut is the last one: written the other way round, a long map name
        // pushes the size off the row.
        const list = renderListContainer(document, ROWS_SHELF);
        if (shown.shelf.length === 0) {
            list.append(renderEmptyNote(document, PANEL_WORDS.shelfEmpty));
            return list;
        }
        for (const fight of shown.shelf) {
            const chosen = fight.isChosen ? ` ${CLASS.rowChosen}` : "";
            const row = renderElement(
                document,
                "div",
                `${CLASS.row} ${CLASS.rowDrillable}${chosen}`,
            );
            if (fight.isPinnable) {
                const set = fight.isPinned ? ` ${CLASS.rowPinSet}` : "";
                const pin = renderText(
                    document,
                    "span",
                    `${CLASS.rowPin}${set}`,
                    fight.isPinned ? PIN_MARK : UNPINNED_MARK,
                );
                pin.setAttribute(TITLE_ATTRIBUTE, getWordsForPin(fight.isPinned));
                // The moment and never the word a live row is pressed by: what a
                // pin acts on is a fight the shelf holds, and the one going on now
                // is on the shelf only while it is also kept.
                pin.setAttribute(PANEL_MARK.pin, `${fight.openedAt}`);
                row.append(pin);
            }
            const time = renderText(
                document,
                "span",
                CLASS.rowTime,
                formatShelfTime(fight.at, fight.isLive),
            );
            const size = renderText(document, "span", CLASS.rowSize, formatShelfSize(fight.sizes));
            const where = renderText(document, "span", CLASS.rowName, fight.place ?? "");
            const outcome = renderText(
                document,
                "span",
                CLASS.rowValue,
                getWordsForShelfOutcome(fight.outcome, fight.isLive),
            );
            for (const cell of [time, size, where, outcome]) row.append(cell);
            const parts = [row, time, size, where, outcome];
            register.add(
                `shelf:${fight.openedAt}`,
                () => presentFightCard(fight.card),
            );
            setRowMarks(parts, CARD_ATTRIBUTE, `shelf:${fight.openedAt}`);
            // A moment would have to be one no kept fight could carry, and there is
            // no such moment.
            setRowMarks(
                parts,
                PANEL_MARK.fight,
                fight.isLive ? LIVE_FIGHT_MARK : `${fight.openedAt}`,
            );
            list.append(row);
        }
        return list;
    }
    if (shown.part !== null) {
        // Draw whom one part of an opened figure reached, headed by the direction's
        // word: a level opened on a screen about what reached the reader is headed
        // by whom it came from.
        const partLevel = shown.part;
        const rows = partLevel.byOtherEnd.rows.length +
            (partLevel.byOtherEnd.halfNamed === null ? 0 : 1);
        const list = renderListContainer(
            document,
            Math.max(rows + 1, shown.ranking.rowsVisibleCount),
        );
        const figure = getWordsForMetric(shown.metric);
        const heading = getWordsForOpponentCut(shown.metric);
        list.append(renderSection(document, heading, partLevel.total));
        const share = PANEL_WORDS.shareOfFigure;
        // Nothing on this rung opens, so no card here promises a gesture
        // (`docs/drill-levels.md`).
        const cardContext: CardPlace = {
            metric: shown.metric,
            translate,
            isRowNarrower: true,
            readerSide: shown.readerSide,
        };
        const person = {
            register,
            keyPrefix: "reached",
            figure,
            share,
            card: cardContext,
            place: composeCutPlace(shown),
        };
        for (const [rowIndex, row] of partLevel.byOtherEnd.rows.entries()) {
            list.append(renderPersonRow(document, row, rowIndex + 1, person, false));
        }
        if (partLevel.byOtherEnd.halfNamed === null) return list;
        // The end the protocol left out of a blow this part carried: it is inside
        // the figure over the level, so the column comes to a hundred with it and
        // falls short without it.
        const end = getUnnamedEndForMetric(shown.metric);
        const card = {
            register,
            key: "reached:nobody",
            figure,
            share,
            notes: [getNoteForUnnamedEnd(end, getNounForMetric(shown.metric))],
        };
        const rowContent = presentUnnamedRow(
            partLevel.byOtherEnd.halfNamed,
            getWordsForUnnamedRow(end),
        );
        list.append(renderRow(document, rowContent, null, card));
        return list;
    }
    if (shown.pair !== null) {
        // Draw what passed between the two: the skills, then the kinds of damage.
        const pair = shown.pair;
        const list = renderListContainer(
            document,
            countRowsForPairLevel(pair, shown.ranking.rowsVisibleCount),
        );
        const figure = getWordsForMetric(shown.metric);
        const share = PANEL_WORDS.shareOfFigure;
        if (pair.parts.length > 0) {
            list.append(renderSection(document, PANEL_WORDS.skills, pair.total));
            for (const [rowIndex, row] of pair.parts.entries()) {
                const card = {
                    register,
                    figure,
                    share,
                    key: getKeyForNamedPart(CARD_KEY_PLACE.pair, row.part),
                    caveat: getCaveatForNamedPart(row.part, shown.metric),
                };
                const rowContent = {
                    name: getWordsForNamedPart(row.part, shown.metric),
                    figure: row.figure,
                    fill: row.fill,
                    shareText: row.shareText,
                    colour: lookupColourForProfession(null),
                    profession: null,
                    rank: rowIndex + 1,
                };
                list.append(renderRow(document, rowContent, null, card));
            }
        }
        const cut = pair.byElement;
        if (cut.rows.length > 0) {
            list.append(
                renderSection(document, PANEL_WORDS.damageKind, pair.total),
            );
            for (const [rowIndex, row] of cut.rows.entries()) {
                const openedPart = { kind: OPENED_PART.element, element: row.element };
                const card = {
                    register,
                    figure,
                    share,
                    key: getKeyForNamedPart(CARD_KEY_PLACE.pairKinds, openedPart),
                };
                list.append(
                    renderRow(
                        document,
                        presentElementRow(row, PANEL_NOUN.damage, rowIndex + 1),
                        null,
                        card,
                    ),
                );
            }
        }
        return list;
    }
    if (shown.unnamedCut !== null) {
        // Draw what stands under one row of that level: a person's own keys, or a
        // key's own people. The two are one fold read both ways round, so one
        // branch rather than two levels. Nothing here opens: it is the third level,
        // and the panel goes no deeper.
        const unnamedCut = shown.unnamedCut;
        const figure = getWordsForMetric(shown.metric);
        if (unnamedCut.opened === HALF_NAMED_OPENED.element) {
            const rows = unnamedCut.rows.length + (unnamedCut.neitherEnd === null ? 0 : 1);
            const list = renderListContainer(
                document,
                Math.max(rows + 1, shown.ranking.rowsVisibleCount),
            );
            const heading = getWordsForHalfNamedCut(unnamedCut.end);
            list.append(renderSection(document, heading, unnamedCut.total));
            renderHalfNamedRows(document, list, shown, {
                rows: unnamedCut.rows,
                neither: unnamedCut.neitherEnd,
                doesOpen: false,
                register,
                translate: null,
            });
            return list;
        }
        const kinds = countElementCutRows(unnamedCut.kinds);
        const list = renderListContainer(
            document,
            Math.max(kinds + 1, shown.ranking.rowsVisibleCount),
        );
        renderElementSection(document, list, unnamedCut.kinds, {
            metric: shown.metric,
            register,
            figure,
            total: unnamedCut.total,
        });
        return list;
    }
    if (shown.unnamed !== null) {
        // Draw what stands under a pinned row: the end the game did name, person by
        // person, and never a guess at the one it left out. Which end that is turns
        // on the row rather than on the screen, so `Otrzymane` heads its two rows
        // differently. `develop ADR 0038`.
        const unnamed = shown.unnamed;
        const named = unnamed.rows.length + (unnamed.neitherEnd === null ? 0 : 1);
        const kinds = countElementCutRows(unnamed.kinds);
        const needed = named + 1 + (kinds === 0 ? 0 : kinds + 1);
        const list = renderListContainer(
            document,
            Math.max(needed, shown.ranking.rowsVisibleCount),
        );
        const heading = getWordsForHalfNamedCut(unnamed.end);
        list.append(renderSection(document, heading, unnamed.total));
        renderHalfNamedRows(document, list, shown, {
            rows: unnamed.rows,
            neither: unnamed.neitherEnd,
            doesOpen: true,
            register,
            translate,
        });
        renderElementSection(document, list, unnamed.kinds, {
            metric: shown.metric,
            register,
            figure: getWordsForMetric(shown.metric),
            total: unnamed.total,
        });
        return list;
    }
    if (shown.opened !== null) {
        // Draw an opened person: neither cut opens any further, and a cut with
        // nothing in it draws no heading — a blow the protocol tied to nobody still
        // states what it was dealt with, so the kinds can stand alone.
        const opened = shown.opened;
        const list = renderListContainer(
            document,
            countRowsForOpenedLevel(opened, shown.ranking.rowsVisibleCount),
        );
        const figure = getWordsForMetric(shown.metric);
        const share = PANEL_WORDS.shareOfFigure;
        // Draw whom the figure reached, where the reading fills that cut.
        {
            // One screen fills it and the others are handed an empty cut:
            // `src/ui/panel-content.ts` says which screen that is and why.
            const cut = opened.byOtherEnd;
            const cardContext: CardPlace = {
                metric: shown.metric,
                translate,
                isRowNarrower: true,
                readerSide: shown.readerSide,
            };
            if (cut.rows.length + (cut.halfNamed === null ? 0 : 1) > 0) {
                const heading = getWordsForOpponentCut(shown.metric);
                list.append(renderSection(document, heading, opened.total));
            }
            const person = {
                register,
                keyPrefix: "to",
                figure,
                share,
                card: cardContext,
                place: composeCutPlace(shown),
            };
            for (const [rowIndex, row] of cut.rows.entries()) {
                const drawn = renderPersonRow(
                    document,
                    row,
                    rowIndex + 1,
                    person,
                    row.doesOpenPair,
                );
                list.append(drawn);
            }
            if (cut.halfNamed !== null) {
                const end = getUnnamedEndForMetric(shown.metric);
                const card = {
                    register,
                    key: "to:nobody",
                    figure,
                    share,
                    // What the game did not say, and only that: where this figure
                    // stands is answered by the heading over it — a cut of the one
                    // person's figure.
                    notes: [
                        getNoteForUnnamedEnd(end, getNounForMetric(shown.metric)),
                    ],
                };
                const rowContent = presentUnnamedRow(
                    cut.halfNamed,
                    getWordsForUnnamedRow(end),
                );
                const mark = cut.halfNamed.doesOpenPair
                    ? { attribute: PANEL_MARK.unnamed, stated: end }
                    : null;
                list.append(renderRow(document, rowContent, mark, card));
            }
        }
        // Draw the skills the figure was made of.
        {
            const cut = opened.bySkill;
            const stated = { metric: shown.metric, register, figure };
            if (cut.rows.length + (cut.closing === null ? 0 : 1) > 0) {
                list.append(
                    renderSection(document, PANEL_WORDS.skills, opened.total),
                );
                let drawn = 0;
                for (const row of cut.rows) {
                    drawn = renderClosingRowAtPlace(
                        document,
                        list,
                        cut.closing,
                        stated,
                        drawn,
                        false,
                    );
                    drawn += 1;
                    const card = {
                        register,
                        key: getKeyForNamedPart(CARD_KEY_PLACE.skill, row.part),
                        figure,
                        share,
                    };
                    const rowContent = presentSkillRow(row, shown.metric, drawn);
                    const mark = getMarkForNamedPart(row.part, row.doesOpenPart);
                    list.append(renderRow(document, rowContent, mark, card));
                }
                renderClosingRowAtPlace(
                    document,
                    list,
                    cut.closing,
                    stated,
                    drawn,
                    true,
                );
                renderRestRow(document, list, cut.rest, {
                    register,
                    figure,
                    key: "skill:rest",
                });
            }
        }
        renderElementSection(document, list, opened.byElement, {
            metric: shown.metric,
            register,
            figure,
            total: opened.total,
        });
        if (opened.total === 0) {
            list.append(renderEmptyNote(document, getWordsForNothing(shown.metric)));
        }
        return list;
    }
    // Draw the ranking, where every row opens its person.
    const ranking = shown.ranking;
    const metric = shown.metric;
    const personContext = {
        readerSide: shown.readerSide,
        turnHolderId: shown.turnHolderId,
    };
    const list = renderListContainer(document, ranking.rowsVisibleCount);
    if (ranking.rows.length === 0) {
        list.append(renderEmptyNote(document, PANEL_WORDS.nothingYet));
        return list;
    }
    const person = {
        register,
        keyPrefix: "row",
        figure: getWordsForMetric(metric),
        share: PANEL_WORDS.share,
        card: {
            metric,
            translate,
            isRowNarrower: false,
            readerSide: shown.readerSide,
        },
        place: personContext,
    };
    for (const [rowIndex, row] of ranking.rows.entries()) {
        list.append(renderPersonRow(document, row, rowIndex + 1, person, true));
    }
    return list;
}

/**
 * Draw the two pinned rows, each in a region of its own. A pinned row keeps a place of its own
 * whether or not there is one to draw, so a failure takes one row rather than both — and nothing
 * standing below them moves when one arrives.
 */
function renderPinnedRows(
    document: PanelDocument,
    regions: PanelRegions,
    renderInPlace: PanelRedraw,
    register: CardRegister,
    shown: ShownScreen,
): void {
    const stated = {
        metric: shown.metric,
        isSideChosen: shown.side !== SIDE_CHOICE.everyone,
        figure: getWordsForMetric(shown.metric),
    };
    const isOpen = isLevelOpen(shown);
    const pinned = !isOpen && !shown.isOnShelf ? shown.ranking.pinned : [];
    const ends = [
        [UNNAMED_END.actor, "pinnedActor"],
        [UNNAMED_END.target, "pinnedTarget"],
    ] as const;
    for (const [end, regionName] of ends) {
        const row = pinned.find((pinnedRow) => pinnedRow.end === end) ?? null;
        regions[regionName] = renderInPlace(
            regions[regionName],
            PANEL_REGION.pinned,
            () => {
                // Draw the row, or the slot that keeps its place.
                if (row === null) return renderSlot(document);
                const block = renderElement(document, "div", CLASS.pinned);
                const card = {
                    register,
                    key: `pinned:${row.end}`,
                    figure: stated.figure,
                    share: PANEL_WORDS.share,
                    notes: formatPinnedNotes(row, stated.metric, stated.isSideChosen),
                    cut: presentPinnedCutParts(row, stated.metric),
                };
                const rowContent = presentUnnamedRow(row, getWordsForUnnamedRow(row.end));
                const mark = { attribute: PANEL_MARK.unnamed, stated: row.end };
                block.append(renderRow(document, rowContent, mark, card));
                return block;
            },
        );
    }
}

function renderOutsideRegion(
    document: PanelDocument,
    register: CardRegister,
    shown: ShownScreen,
): PanelElement {
    if (shown.isOnShelf) return renderSlot(document);
    // What the screen's own count holds and no row of it does. **It is not the
    // suspicions in another shape**: a suspicion says a figure may be short and
    // never by how much, because nothing states one; this states a figure,
    // because two counts of the same screen came out different by exactly that
    // much.
    const outside = shown.ranking.outsideRanking;
    if (outside === null) return renderSlot(document);
    const block = renderElement(document, "div", CLASS.outside);
    block.append(
        renderSection(document, PANEL_WORDS.outsideRanking, outside.figure),
    );
    const rowContent = {
        name: PANEL_WORDS.outsideRow,
        figure: outside.figure,
        fill: outside.fill,
        shareText: outside.shareText,
        colour: lookupColourForProfession(null),
        profession: null,
        // No place, so the hatch: its figure is what reached no row rather than
        // what anybody did — `DESIGN.md`, and `develop ADR 0079`'s test for
        // which kind of row takes one.
        rank: null,
    };
    const card = {
        register,
        key: "outside",
        figure: getWordsForMetric(shown.metric),
        share: PANEL_WORDS.share,
        notes: [PANEL_WORDS.outsideNote],
    };
    block.append(renderRow(document, rowContent, null, card));
    return block;
}

function renderSidesRegion(
    document: PanelDocument,
    shown: ShownScreen,
): PanelElement {
    // Two sides nothing can tell apart are not two figures, and a strip of them
    // says nothing.
    const sides = shown.ranking.sides;
    if (sides === null) return renderSlot(document);
    if (shown.isOnShelf) return renderSlot(document);
    const block = renderElement(document, "div", CLASS.sides);
    const line = renderElement(document, "div", CLASS.sidesLine);
    const reader = renderText(
        document,
        "span",
        `${CLASS.sidesOurs} ${CLASS.figure}`,
        formatFigure(sides.reader),
    );
    const label = renderText(document, "span", CLASS.sidesLabel, formatSidesLabel(shown));
    const opposing = renderText(
        document,
        "span",
        `${CLASS.sidesTheirs} ${CLASS.figure}`,
        formatFigure(sides.opposing),
    );
    line.append(reader);
    line.append(label);
    line.append(opposing);
    block.append(line);
    // Draw the track the three figures share, a part for each that has any.
    {
        const whole = sides.reader + sides.opposing + sides.nobody;
        if (whole > 0) {
            const track = renderElement(document, "div", CLASS.sidesTrack);
            const parts: Array<[number, string]> = [
                [sides.reader / whole, CLASS.sidesOurs],
                [sides.opposing / whole, CLASS.sidesTheirs],
                [sides.nobody / whole, CLASS.sidesNobody],
            ];
            for (const [share, className] of parts) {
                if (share > 0) {
                    const sideSegment = renderElement(document, "span", className);
                    const width = formatDecimal(
                        Math.min(share, 1) * AS_PERCENT,
                        FILL_PLACES,
                    );
                    sideSegment.setAttribute(STYLE_ATTRIBUTE, `width:${width}%`);
                    track.append(sideSegment);
                }
            }
            block.append(track);
        }
    }
    if (sides.nobody > 0) {
        const spare = renderElement(
            document,
            "div",
            `${CLASS.sidesLine} ${CLASS.sidesSpare} ${CLASS.sidesNobody}`,
        );
        const words = renderText(document, "span", CLASS.sidesLabel, PANEL_WORDS.withoutSide);
        const stated = renderText(document, "span", CLASS.figure, formatFigure(sides.nobody));
        spare.append(words);
        spare.append(stated);
        block.append(spare);
    }
    return block;
}

function renderElement(document: PanelDocument, tag: string, className: string): PanelElement {
    const createdElement = document.createElement(tag);
    createdElement.className = className;
    return createdElement;
}

/** An element holding one text, which is what most of the panel's cells are. */
function renderText(
    document: PanelDocument,
    tag: string,
    className: string,
    text: string,
): PanelElement {
    const textElement = renderElement(document, tag, className);
    textElement.textContent = text;
    return textElement;
}

function renderSlot(document: PanelDocument): PanelElement {
    const slot = renderElement(document, "div", CLASS.slot);
    return slot;
}

/** The corner a window is sized by. Built once, as the frame is, and no redraw replaces it. */
function renderSizeGrip(document: PanelDocument, window: PanelWindow): PanelElement {
    const grip = renderElement(document, "div", CLASS.sizeGrip);
    grip.setAttribute(SIZE_GRIP_ATTRIBUTE, GRIP_MARK_BY_WINDOW[window]);
    grip.setAttribute(TITLE_ATTRIBUTE, PANEL_WORDS.resizeGrip);
    return grip;
}

/**
 * The region, or the sentence saying it was not drawn, or null where the document would not make
 * even that: the region standing is then what stays (`AGENTS.md` E12).
 */
function renderRegion(
    document: PanelDocument,
    region: PanelRegion,
    render: () => PanelElement,
    report: UndrawnReport,
): PanelElement | null {
    const rendered = errors.attempt(render);
    if (!(rendered instanceof Error)) return rendered;
    report.add(region, rendered);
    const undrawn = errors.attempt(() => {
        const mark = renderText(document, "div", CLASS.undrawn, formatUndrawn(region));
        return mark;
    });
    return undrawn instanceof Error ? null : undrawn;
}

/**
 * One card over two windows, so one reading over two registers. The panel's is asked first: it is
 * the one a fight refills every few seconds, and no key is stated by both.
 */
function composeCardLookup(meterRegister: CardRegister, helperRegister: CardRegister): CardLookup {
    return { lookup: (key: string) => meterRegister.lookup(key) ?? helperRegister.lookup(key) };
}

/** The window's own bar: its own grip, its own fold, and no control that would close it. */
function renderHelperBar(document: PanelDocument, isCollapsed: boolean): PanelElement {
    const bar = renderText(
        document,
        "div",
        CLASS.helperBar,
        `${GRIP_MARK}${HELPER_WORDS.title}`,
    );
    bar.setAttribute(TITLE_ATTRIBUTE, HELPER_WORDS.drag);
    setGripMark(bar, PANEL_WINDOW.helper);
    bar.append(renderBarControl(document, {
        className: CLASS.control,
        mark: isCollapsed ? UNFOLD_MARK : FOLD_MARK,
        attribute: PANEL_MARK.helperFold,
        words: isCollapsed ? HELPER_WORDS.expand : HELPER_WORDS.collapse,
    }));
    return bar;
}

function renderBarControl(
    document: PanelDocument,
    stated: { className: string; mark: string; attribute: string; words: string },
): PanelElement {
    const control = renderText(document, "span", stated.className, stated.mark);
    control.setAttribute(stated.attribute, "");
    control.setAttribute(TITLE_ATTRIBUTE, stated.words);
    return control;
}

/**
 * Null for good on a window never made movable, which is every panel a test draws.
 *
 * Both windows' listeners stand on the same root, so each set answers to its own grip by name.
 * Without the name on the mark both start on either bar: the panel moves by the wrong one.
 */
function initPanelDragIfPlaced(
    root: PanelRoot,
    host: PanelElement,
    getBar: () => PanelElement,
    placement: PanelPlacement | null,
    dragOptions: {
        window: PanelWindow;
        view: PanelViewOptions;
        getTypeStep: () => TypeStep;
        grip: PanelElement;
    },
): PanelDragHandle | null {
    if (placement === null) return null;
    const { window, view } = dragOptions;
    return initPanelDrag(root, host, getBar, placement, {
        window,
        getTypeTokens: () => TYPE_TOKENS[dragOptions.getTypeStep()],
        onIntent: view.onIntent,
        onFailure: view.onFailure,
        grip: dragOptions.grip,
    });
}

/** A step of a draw that is not a region's own, charged to the region it stands for. */
function executeRegionStep(report: UndrawnReport, region: PanelRegion, step: () => void): void {
    const ran = errors.attempt(step);
    if (ran instanceof Error) report.add(region, ran);
}

/**
 * The bar, which says what it will do, the frame it folds, and the type both windows are drawn
 * in. Drawn on every draw there is; the sheet is written only when the size of type moved.
 */
function renderFold(
    panelDrawing: PanelDrawing,
    drawn: {
        isMeterCollapsed: boolean;
        hasFightToSave: boolean;
        typeStep: TypeStep;
        windowSizes: WindowSizes;
    },
): void {
    const { isMeterCollapsed, hasFightToSave, typeStep } = drawn;
    if (typeStep !== panelDrawing.getTypeStep()) {
        const before = getWindowWidths(panelDrawing);
        executeRegionStep(panelDrawing.report, PANEL_REGION.header, () => {
            panelDrawing.sheet.textContent = composeStyleSheet(typeStep);
            panelDrawing.setTypeStep(typeStep);
        });
        // The window beside the panel keeps the side it stood on as both change size.
        executeRegionStep(panelDrawing.report, PANEL_REGION.helper, () => {
            const after = getWindowWidths(panelDrawing);
            const meterPosition = panelDrawing.meterDrag?.getPosition() ?? null;
            const helperPosition = panelDrawing.helperDrag?.getPosition() ?? null;
            if (meterPosition === null) return;
            if (helperPosition === null) return;
            const helperPositionAfter = composeHelperPositionAfterTypeStep(
                meterPosition,
                helperPosition,
                before,
                after,
            );
            if (helperPositionAfter !== null) {
                panelDrawing.helperDrag?.setPosition(helperPositionAfter);
            }
        });
    }
    executeRegionStep(panelDrawing.report, PANEL_REGION.header, () => {
        panelDrawing.meterDrag?.setSize(drawn.windowSizes.meter);
    });
    executeRegionStep(panelDrawing.report, PANEL_REGION.helper, () => {
        panelDrawing.helperDrag?.setSize(drawn.windowSizes.helper);
    });
    panelDrawing.regions.title = panelDrawing.renderInPlace(
        panelDrawing.regions.title,
        PANEL_REGION.header,
        () => {
            // The save is drawn only where there is a fight to hand over. A control that does
            // nothing is worse than one that is not there (`DESIGN.md`), and an envelope with no
            // call in it is a file that looks like a saved fight and is not. `develop ADR 0053`.
            const document = panelDrawing.document;
            const bar = renderElement(document, "div", CLASS.title);
            // Set before the controls are appended, not after: `textContent` replaces every child,
            // so the other order would wipe them.
            bar.textContent = `${GRIP_MARK}${PANEL_WORDS.title}`;
            bar.setAttribute(TITLE_ATTRIBUTE, PANEL_WORDS.drag);
            setGripMark(bar, PANEL_WINDOW.meter);
            const label = renderText(
                document,
                "span",
                CLASS.titleVersion,
                panelDrawing.addOnVersion,
            );
            // Marked as well as the bar under it. The bar wears `cursor:move` and every child
            // inherits it, so a label that starts no drag is an affordance that lies (`DESIGN.md`)
            // — and this one sits between the name and the controls, where a hand aiming for the
            // bar lands.
            setGripMark(label, PANEL_WINDOW.meter);
            bar.append(label);
            // First of the controls, so the three a reader already knew keep their places: the save
            // comes and goes, and a control standing after it would walk along the bar with it.
            bar.append(renderBarControl(document, {
                className: `${CLASS.control} ${CLASS.controlLead}`,
                mark: OPTIONS_MARK,
                attribute: PANEL_MARK.options,
                words: PANEL_WORDS.openOptions,
            }));
            bar.append(renderBarControl(document, {
                className: CLASS.control,
                mark: SHELF_MARK,
                attribute: PANEL_MARK.shelf,
                words: PANEL_WORDS.openFights,
            }));
            if (hasFightToSave) {
                bar.append(renderBarControl(document, {
                    className: CLASS.control,
                    mark: SAVE_MARK,
                    attribute: PANEL_MARK.save,
                    words: PANEL_WORDS.saveFight,
                }));
            }
            bar.append(renderBarControl(document, {
                className: CLASS.control,
                mark: isMeterCollapsed ? UNFOLD_MARK : FOLD_MARK,
                attribute: PANEL_MARK.fold,
                words: isMeterCollapsed ? PANEL_WORDS.expand : PANEL_WORDS.collapse,
            }));
            return bar;
        },
    );
    executeRegionStep(panelDrawing.report, PANEL_REGION.header, () => {
        panelDrawing.frame.className = isMeterCollapsed
            ? `${CLASS.frame} ${CLASS.folded}`
            : CLASS.frame;
    });
}

/** How wide each window stands now, which a change of type moves and a size may not. */
function getWindowWidths(panelDrawing: PanelDrawing): WindowWidths {
    const tokens = TYPE_TOKENS[panelDrawing.getTypeStep()];
    return {
        meter: panelDrawing.meterDrag?.getWidthPixels() ?? tokens.meterWidthPixels,
        helper: panelDrawing.helperDrag?.getWidthPixels() ?? tokens.helperWidthPixels,
    };
}

function renderPanelFolded(
    document: PanelDocument,
    regions: PanelRegions,
    renderInPlace: PanelRedraw,
): void {
    const renderEmptySlot = () => renderSlot(document);
    regions.header = renderInPlace(regions.header, PANEL_REGION.header, renderEmptySlot);
    regions.nouns = renderInPlace(regions.nouns, PANEL_REGION.strips, renderEmptySlot);
    regions.directions = renderInPlace(regions.directions, PANEL_REGION.strips, renderEmptySlot);
    regions.crumb = renderInPlace(regions.crumb, PANEL_REGION.crumb, renderEmptySlot);
    regions.options = renderInPlace(regions.options, PANEL_REGION.strips, renderEmptySlot);
    regions.list = renderInPlace(regions.list, PANEL_REGION.list, renderEmptySlot);
    regions.pinnedActor = renderInPlace(regions.pinnedActor, PANEL_REGION.pinned, renderEmptySlot);
    regions.pinnedTarget = renderInPlace(
        regions.pinnedTarget,
        PANEL_REGION.pinned,
        renderEmptySlot,
    );
    regions.outside = renderInPlace(regions.outside, PANEL_REGION.outside, renderEmptySlot);
    regions.sides = renderInPlace(regions.sides, PANEL_REGION.sides, renderEmptySlot);
    regions.suspicions = renderInPlace(
        regions.suspicions,
        PANEL_REGION.suspicions,
        renderEmptySlot,
    );
    regions.defects = renderInPlace(regions.defects, PANEL_REGION.defects, renderEmptySlot);
}

function renderStrip(
    document: PanelDocument,
    attribute: string,
    strip: ScreenStrip,
): PanelElement {
    const marked = strip.isCurrent ? ` ${CLASS.stripCurrent}` : "";
    const stripElement = renderElement(document, "div", `${CLASS.strip}${marked}`);
    stripElement.setAttribute(attribute, strip.name);
    stripElement.textContent = strip.words;
    return stripElement;
}

function getShownStrip(strip: ScreenStrip, shown: ShownScreen): ScreenStrip {
    if (!shown.isOnShelf) return strip;
    return { ...strip, isCurrent: false };
}

/**
 * The crumb carries the one card that is not a row's, and it carries it on the way back alone:
 * `getPressFromTarget` walks no ancestors, so the mark on that span reaches the pointer and the
 * name beside it stays uncovered. Drawn only where a level is open, which is what lets it name a
 * gesture a row's card may not — `develop ADR 0086`.
 */
function renderCrumb(
    document: PanelDocument,
    register: CardRegister,
    stated: { said: string; from: string | null },
): PanelElement {
    const crumb = renderElement(document, "div", CLASS.crumb);
    const back = renderElement(document, "span", CLASS.crumbBack);
    const leaving = stated.from ?? PANEL_WORDS.back;
    back.textContent = `${BACK_MARK}${leaving}`;
    back.setAttribute(PANEL_MARK.back, PANEL_WORDS.back);
    register.add(CRUMB_CARD_KEY, () => presentCrumbCard(leaving));
    back.setAttribute(CARD_ATTRIBUTE, CRUMB_CARD_KEY);
    const here = renderText(document, "span", CLASS.crumbHere, stated.said);
    here.setAttribute(TITLE_ATTRIBUTE, here.textContent);
    crumb.append(back);
    crumb.append(here);
    return crumb;
}

function presentCrumbCard(leaving: string): CardContent {
    return {
        name: leaving,
        subtitle: null,
        groups: [{
            lines: [
                { kind: CARD_LINE.note, text: CARD_WORDS.gestureBack, tone: CARD_NOTE_TONE.plain },
                {
                    kind: CARD_LINE.note,
                    text: CARD_WORDS.gestureBackAnywhere,
                    tone: CARD_NOTE_TONE.plain,
                },
            ],
        }],
    };
}

/** What the way back calls the row that is open, which is the row itself and not its level. */
function getCrumbWordsForUnnamedCut(
    unnamedCut: UnnamedCutLevelContent,
    metric: PanelMetric,
): string {
    if (unnamedCut.opened === HALF_NAMED_OPENED.person) {
        return unnamedCut.row.name ?? PANEL_WORDS.unknown;
    }
    return getWordsForKind(getNounForMetric(metric), unnamedCut.element);
}

/** A kind is a damage element or a healing source, worded from the table of its noun. */
function getWordsForKind(noun: PanelNoun, key: string): string {
    if (noun === PANEL_NOUN.damage) return getWordsForDamageKind(key);
    return getWordsForHealthSource(key);
}

function getWordsForUnnamedRow(end: PanelUnnamedEnd): string {
    return end === UNNAMED_END.actor ? PANEL_WORDS.withoutActor : PANEL_WORDS.withoutTarget;
}

/**
 * What a part is called where it stands, and a key is worded from the screen's own table: the game
 * states `heal` as a health gain and as a health loss both, and one label over the two would be two
 * quantities under one word.
 */
function getWordsForNamedPart(openedPart: OpenedPart, metric: PanelMetric): string {
    if (openedPart.kind === OPENED_PART.skill) return openedPart.name;
    if (openedPart.kind === OPENED_PART.plain) return getWordsForUnannounced(metric);
    const named = openedPart.kind === OPENED_PART.source ? openedPart.source : openedPart.element;
    return getWordsForKind(getNounForMetric(metric), named);
}

/**
 * The options, over every region the screens draw into: they cover the screens as the shelf does,
 * so nothing of the fight stands beside them to be mistaken for what they change.
 */
function renderPanelOptions(
    document: PanelDocument,
    drawn: {
        regions: PanelRegions;
        renderInPlace: PanelRedraw;
        drawing: ListDrawing;
        register: CardRegister;
    },
    options: OptionsContent,
    chosen: { typeStep: TypeStep; windowSizes: WindowSizes },
): void {
    const { regions, renderInPlace, drawing, register } = drawn;
    const renderEmptySlot = () => renderSlot(document);
    regions.header = renderInPlace(regions.header, PANEL_REGION.header, renderEmptySlot);
    regions.nouns = renderInPlace(regions.nouns, PANEL_REGION.strips, renderEmptySlot);
    regions.directions = renderInPlace(regions.directions, PANEL_REGION.strips, renderEmptySlot);
    regions.crumb = renderInPlace(
        regions.crumb,
        PANEL_REGION.crumb,
        () =>
            renderCrumb(document, register, {
                said: PANEL_WORDS.options,
                from: PANEL_WORDS.backFromOptions,
            }),
    );
    regions.options = renderInPlace(regions.options, PANEL_REGION.strips, () => {
        const region = renderElement(document, "div", "");
        // Ask the size of type: three steps side by side, each written in its size (ADR 0015).
        {
            const question = renderOptionsQuestion(document, PANEL_WORDS.typeSize);
            const steps = renderElement(document, "div", CLASS.optionsSteps);
            for (const step of TYPE_STEPS) {
                const marked = step === chosen.typeStep ? ` ${CLASS.stripCurrent}` : "";
                const className = `${CLASS.optionsStep} ${composeOptionsStepClass(step)}${marked}`;
                const answer = renderText(document, "div", className, getWordsForTypeStep(step));
                answer.setAttribute(PANEL_MARK.typeStep, step);
                steps.append(answer);
            }
            question.append(steps);
            region.append(question);
        }
        // Say of each window whether it keeps a size of the reader's.
        {
            // A way back on the window that keeps one and on no other: a control that does nothing
            // is worse than none (`DESIGN.md`).
            const question = renderOptionsQuestion(document, PANEL_WORDS.windowSize);
            for (const window of PANEL_WINDOWS) {
                const isSized = chosen.windowSizes[window] !== null;
                const line = renderElement(document, "div", CLASS.optionsWindow);
                const name = renderText(
                    document,
                    "span",
                    CLASS.optionsWindowName,
                    getWordsForWindow(window),
                );
                const own = isSized ? ` ${CLASS.optionsWindowOwn}` : "";
                const state = renderText(
                    document,
                    "span",
                    `${CLASS.optionsWindowState}${own}`,
                    isSized ? PANEL_WORDS.sizeOwn : PANEL_WORDS.sizeDefault,
                );
                line.append(name);
                line.append(state);
                if (isSized) {
                    const reset = renderText(
                        document,
                        "span",
                        CLASS.optionsReset,
                        PANEL_WORDS.sizeReset,
                    );
                    reset.setAttribute(PANEL_MARK.resetSize, window);
                    line.append(reset);
                }
                question.append(line);
            }
            const hint = renderText(document, "div", CLASS.optionsMeaning, PANEL_WORDS.resizeHint);
            question.append(hint);
            region.append(question);
        }
        // Ask where fights are kept: a row per answer, longest first, and what the one taken means.
        {
            const storageChosen = options.storage;
            const question = renderOptionsQuestion(document, PANEL_WORDS.storage);
            for (const choice of STORAGE_CHOICES) {
                const marked = choice === storageChosen ? ` ${CLASS.stripCurrent}` : "";
                const answer = renderText(
                    document,
                    "div",
                    `${CLASS.optionsAnswer}${marked}`,
                    getWordsForStorage(choice),
                );
                answer.setAttribute(PANEL_MARK.storage, choice);
                question.append(answer);
            }
            const meaning = renderText(
                document,
                "div",
                CLASS.optionsMeaning,
                getWordsForStorageMeaning(storageChosen),
            );
            question.append(meaning);
            region.append(question);
        }
        return region;
    });
    drawing.renderListRegion(OPTIONS_LIST_NAME, renderEmptySlot);
    regions.pinnedActor = renderInPlace(regions.pinnedActor, PANEL_REGION.pinned, renderEmptySlot);
    regions.pinnedTarget = renderInPlace(
        regions.pinnedTarget,
        PANEL_REGION.pinned,
        renderEmptySlot,
    );
    regions.outside = renderInPlace(regions.outside, PANEL_REGION.outside, renderEmptySlot);
    regions.sides = renderInPlace(regions.sides, PANEL_REGION.sides, renderEmptySlot);
    regions.suspicions = renderInPlace(
        regions.suspicions,
        PANEL_REGION.suspicions,
        () => renderSuspicions(document, options.answers),
    );
}

function renderOptionsQuestion(document: PanelDocument, said: string): PanelElement {
    const question = renderElement(document, "div", CLASS.optionsQuestion);
    const heading = renderText(document, "div", CLASS.optionsHeading, said);
    question.append(heading);
    return question;
}

function renderListContainer(document: PanelDocument, rowsVisibleCount: number): PanelElement {
    if (!Number.isSafeInteger(rowsVisibleCount)) rowsVisibleCount = ROWS_WAITING;
    if (rowsVisibleCount < 1) rowsVisibleCount = ROWS_WAITING;
    const list = renderElement(document, "div", CLASS.list);
    // ⚠️ Not `formatFigure`, which is what a reader reads: it groups thousands with a
    // no-break space, and `--MargoMeter-rows:1 000` stops the `calc` over it being a length.
    list.setAttribute(
        STYLE_ATTRIBUTE,
        `${ROWS_VARIABLE}:${formatWholeUngrouped(rowsVisibleCount)}`,
    );
    return list;
}

function renderEmptyNote(document: PanelDocument, words: string): PanelElement {
    const empty = renderText(document, "div", CLASS.empty, words);
    return empty;
}

/**
 * A pointer lands on the deepest element under it, so every part of a row wears the row's marks —
 * the same reason the press attribute is written on the spans and not on the row alone.
 */
function setRowMarks(parts: readonly PanelElement[], name: string, stated: string): void {
    for (const cell of parts) cell.setAttribute(name, stated);
}

function renderSection(
    document: PanelDocument,
    heading: string,
    total: number,
): PanelElement {
    const section = renderElement(document, "div", CLASS.section);
    const words = renderText(document, "span", CLASS.sectionWords, heading);
    const figure = renderText(document, "span", CLASS.figure, formatFigure(total));
    section.append(words);
    section.append(figure);
    return section;
}

/**
 * A person's row with the card their four figures make, keyed under the list it stands in. A row
 * that opens wears the mark a press is read by, and its card says so.
 */
function renderPersonRow(
    document: PanelDocument,
    row: RankingRow | OtherEndRow,
    rank: number,
    person: {
        register: CardRegister;
        keyPrefix: string;
        figure: string;
        share: string;
        card: CardPlace;
        place: PersonPlace;
    },
    doesOpen: boolean,
): PanelElement {
    const card = {
        register: person.register,
        key: `${person.keyPrefix}:${row.combatantId}`,
        figure: person.figure,
        share: person.share,
        compose: composePersonCard(row, person.card, doesOpen),
    };
    const rowContent = presentCombatantRow(row, rank, person.card.metric, person.place);
    const mark = doesOpen ? { attribute: PANEL_MARK.row, stated: `${row.combatantId}` } : null;
    return renderRow(document, rowContent, mark, card);
}

/**
 * The card a person's row opens, and **the same card at every level a person stands on** — the
 * ranking, the ends an opened figure reached, and whom one skill reached. A row with nobody
 * behind it has no card to compose: a skill, a kind and an end the protocol left out fall back
 * on `presentRowCard`. `DESIGN.md` owns the rule; `develop ADR 0032` owns why.
 */
function composePersonCard(
    row: RankingRow | OtherEndRow,
    cardContext: CardPlace,
    doesOpen: boolean,
): CardCompose {
    return () =>
        presentCard({
            name: row.name ?? PANEL_WORDS.unknown,
            profession: row.profession,
            sideRelation: getSideRelation(row.side, cardContext.readerSide),
            detail: row.detail,
            metric: cardContext.metric,
            doesOpen,
            isRowNarrower: cardContext.isRowNarrower,
            translate: cardContext.translate,
        });
}

function renderRow(
    document: PanelDocument,
    rowContent: RowContent,
    mark: RowMark | null,
    card: RowCard,
): PanelElement {
    const doesOpen = mark !== null;
    const kind = doesOpen ? CLASS.rowDrillable : CLASS.rowLeaf;
    // No place in the ranking is the whole of what the sheet needs, and the rank cell already
    // answers it: every other reading is handed its position, and only an unnamed one is handed
    // none.
    const apartClass = rowContent.rank === null ? ` ${CLASS.rowApart}` : "";
    const rowElement = renderElement(document, "div", `${CLASS.row} ${kind}${apartClass}`);
    const parts: PanelElement[] = [];
    // Draw the bar as wide as the row's fill, and its cap, both in the row's colour.
    {
        const width = formatDecimal(Math.min(rowContent.fill, 1) * AS_PERCENT, FILL_PLACES);
        const colour = formatColour(rowContent.colour);
        const bar = renderElement(document, "div", CLASS.bar);
        bar.setAttribute(STYLE_ATTRIBUTE, `width:${width}%;background:${colour}`);
        const cap = renderElement(document, "div", CLASS.barCap);
        cap.setAttribute(STYLE_ATTRIBUTE, `background:${colour}`);
        parts.push(bar, cap);
    }
    const rank = renderText(
        document,
        "span",
        CLASS.rowRank,
        rowContent.rank === null ? "" : `${formatFigure(rowContent.rank)}.`,
    );
    parts.push(rank);
    // Built only where there is one to build: this runs per row per redraw, and a node made to be
    // thrown away is a cost paid a fight's worth of times.
    if (rowContent.isSuspect === true) {
        const mark = renderText(document, "span", CLASS.rowSuspect, SUSPECT_MARK);
        parts.push(mark);
    }
    // Read off the card and never off the reading: the glyph here and the sentence the card says
    // are then one answer to one question, and a row cannot wear a mark nothing explains.
    if (card.caveat !== undefined) {
        if (card.caveat !== null) {
            const mark = renderText(document, "span", CLASS.rowCaveat, CAVEAT_MARK);
            parts.push(mark);
        }
    }
    if (rowContent.isTurnHolder === true) {
        const mark = renderText(document, "span", CLASS.rowTurn, TURN_MARK);
        parts.push(mark);
    }
    parts.push(...renderSideRules(document, rowContent.sideRelation ?? SIDE_RELATION.nobody));
    const name = renderText(document, "span", CLASS.rowName, rowContent.name);
    const figureCell = renderText(
        document,
        "span",
        `${CLASS.rowValue} ${CLASS.figure}`,
        formatFigure(rowContent.figure),
    );
    const share = renderElement(document, "span", CLASS.rowShare);
    const uses = rowContent.uses ?? null;
    const counted = uses === null ? "" : ` · ${formatUses(uses)}`;
    share.textContent = `(${rowContent.shareText}${counted})`;
    figureCell.append(share);
    parts.push(name, figureCell);
    for (const cell of parts) rowElement.append(cell);
    parts.push(share);
    const marked = [rowElement, ...parts];
    // Every span and not the row alone: a listener reads what was pressed off the node under the
    // hand, and a mark on the row only swallows a press that landed on the name or the figure.
    if (mark !== null) setRowMarks(marked, mark.attribute, mark.stated);
    card.register.add(card.key, card.compose ?? (() => presentRowCard(rowContent, card, doesOpen)));
    setRowMarks(marked, CARD_ATTRIBUTE, card.key);
    return rowElement;
}

/**
 * The rule on the row's right edge, or nothing. `nobody` is both a fight nothing could tell the
 * sides apart on and a row with no person behind it, and neither earns a grey rule: a panel that
 * cannot place somebody says nothing rather than drawing an answer. `develop ADR 0065`.
 */
function renderSideRules(
    document: PanelDocument,
    sideRelation: SideRelation,
): PanelElement[] {
    if (sideRelation === SIDE_RELATION.nobody) return [];
    const rule = renderElement(document, "div", CLASS.rowSide);
    const colour = sideRelation === SIDE_RELATION.reader ? SIGNAL.ours : SIGNAL.theirs;
    rule.setAttribute(STYLE_ATTRIBUTE, `color:${formatColour(colour)}`);
    return [rule];
}

/**
 * The card a row falls back on where nobody stands behind it, and the one instruction the panel
 * gives. A skill, a kind, an end the protocol left out and a fight on the shelf get this.
 *
 * ⚠️ **A row that opens says so, at every level and not only on the ranking.** Where the note is
 * the card's alone, the 1,576 rows inside an opened one that open (`captures/`, 2026-08-30)
 * are told apart from the 588 that do not by the cursor and by nothing else. Half a section being
 * pressable and silent about it teaches a reader that none of it is.
 */
function presentRowCard(rowContent: RowContent, card: RowCard, doesOpen: boolean): CardContent {
    // The row's own figure and nothing else: a share is a reading of the list rather than a claim
    // the protocol narrowed, so the glyph stands on the line above it (`develop ADR 0089`).
    const stated: CardLine[] = [{
        kind: CARD_LINE.stat,
        label: card.figure,
        stated: formatFigure(rowContent.figure),
        isStrong: false,
        caveat: card.caveat ?? null,
    }];
    if (card.share !== null) {
        stated.push({
            kind: CARD_LINE.stat,
            label: card.share,
            stated: rowContent.shareText,
            isStrong: false,
            caveat: null,
        });
    }
    const said: CardLine[] = [...presentCaveatNoteLines([{ lines: stated }])];
    for (const note of card.notes ?? []) {
        said.push({ kind: CARD_LINE.note, text: note, tone: CARD_NOTE_TONE.plain });
    }
    if (doesOpen) {
        said.push({ kind: CARD_LINE.note, text: CARD_WORDS.gesture, tone: CARD_NOTE_TONE.plain });
    }
    const cut = presentRowCardCutLines(card.cut);
    // One group where there is nothing to divide. A rule drawn between two lines and the two
    // sentences under them is a card cut in half for the sake of it, and every row but a pinned
    // one is exactly that card.
    if (cut.length === 0) {
        return { name: rowContent.name, subtitle: null, groups: [{ lines: [...stated, ...said] }] };
    }
    const groups: CardGroup[] = [{ lines: stated }, { lines: cut }];
    if (said.length > 0) groups.push({ lines: said });
    return { name: rowContent.name, subtitle: null, groups };
}

/** What the figure was made of, as the run of a card it is drawn as. Empty where none was kept. */
function presentRowCardCutLines(cut: RowCardCut | undefined): CardLine[] {
    if (cut === undefined) return [];
    if (cut.parts.length === 0) return [];
    const lines: CardLine[] = [{ kind: CARD_LINE.heading, text: cut.heading }];
    for (const cutPart of cut.parts) {
        lines.push({ kind: CARD_LINE.sub, label: cutPart.label, stated: cutPart.stated });
    }
    return lines;
}

function presentCombatantRow(
    row: PersonRow,
    rank: number | null,
    metric: PanelMetric,
    personContext: PersonPlace,
): RowContent {
    return {
        name: row.name ?? PANEL_WORDS.unknown,
        figure: row.figure,
        fill: row.fill,
        shareText: row.shareText,
        colour: lookupColourForProfession(row.profession),
        profession: row.profession,
        rank,
        isSuspect: isRowSuspect(row.detail, metric),
        sideRelation: getSideRelation(row.side, personContext.readerSide),
        isTurnHolder: row.combatantId === personContext.turnHolderId,
    };
}

function composeCutPlace(shown: ShownScreen): PersonPlace {
    return { readerSide: shown.readerSide, turnHolderId: null };
}

/**
 * Which end an opened figure's cut left out. It follows the **direction** and not the screen: a
 * given screen names no receiver, a received one names nobody who did it. One copy, because the
 * two levels that draw such a row were spelling the same rule two ways.
 */
function getUnnamedEndForMetric(metric: PanelMetric): PanelUnnamedEnd {
    return getDirectionForMetric(metric) === PANEL_DIRECTION.given
        ? UNNAMED_END.target
        : UNNAMED_END.actor;
}

function presentUnnamedRow(row: UnnamedRow | PinnedRow, name: string): RowContent {
    return {
        name,
        figure: row.figure,
        fill: row.fill,
        shareText: row.shareText,
        colour: lookupColourForProfession(null),
        profession: null,
        rank: null,
    };
}

function countRowsForPairLevel(pair: PairLevelContent, floor: number): number {
    const parts = pair.parts.length;
    const kinds = pair.byElement.rows.length;
    const needed = (parts === 0 ? 0 : parts + 1) + (kinds === 0 ? 0 : kinds + 1);
    return Math.max(needed, floor);
}

/**
 * One key per part and per section, so a card is never the one a row beside it registered. Every
 * caller names its own section here rather than spelling a key of its own: a second spelling
 * lands on somebody else's key silently — the register refuses a duplicate, and the row wears the
 * card of whichever section was drawn first.
 */
function getKeyForNamedPart(where: CardKeyPlace, openedPart: OpenedPart): string {
    if (openedPart.kind === OPENED_PART.skill) return `${where}-skill:${openedPart.name}`;
    if (openedPart.kind === OPENED_PART.plain) return `${where}-skill:plain`;
    if (openedPart.kind === OPENED_PART.element) return `${where}-kind:${openedPart.element}`;
    return `${where}-source:${openedPart.source}`;
}

/**
 * What a part row owes, asked wherever one is drawn: the same row stands on two levels, and a
 * caveat the deeper one drops leaves a reader at the bottom of the drill with no ring and no
 * sentence (`develop ADR 0089`). Every other kind of part names what it was, so none owes one.
 */
function getCaveatForNamedPart(openedPart: OpenedPart, metric: PanelMetric): Caveat | null {
    if (openedPart.kind !== OPENED_PART.plain) return null;
    return getCaveatForUnannounced(getNounForMetric(metric));
}

function presentElementRow(row: ElementRow, noun: PanelNoun, rank: number): RowContent {
    return {
        name: getWordsForKind(noun, row.element),
        figure: row.figure,
        fill: row.fill,
        shareText: row.shareText,
        colour: lookupColourForProfession(null),
        profession: null,
        rank,
    };
}

/** The end the game did name, as the heading that names it: whom it reached, or who did it. */
function getWordsForHalfNamedCut(end: PanelUnnamedEnd): string {
    return end === UNNAMED_END.actor ? PANEL_WORDS.dealtTo : PANEL_WORDS.takenFrom;
}

function renderHalfNamedRows(
    document: PanelDocument,
    list: PanelElement,
    shown: ShownScreen,
    stated: {
        rows: readonly HalfNamedRow[];
        neither: UnnamedRow | null;
        /** False on the third level: what stands under a person there is nobody, and nothing. */
        doesOpen: boolean;
        register: CardRegister;
        translate: TranslateLabel | null;
    },
): void {
    const { rows, neither, doesOpen, register, translate } = stated;
    const figure = getWordsForMetric(shown.metric);
    const share = PANEL_WORDS.shareOfFigure;
    // The card is the fight's four figures, as it is wherever a person's row stands, and this row
    // states a cut of them — so it owes the sentence saying so (`develop ADR 0032`).
    const cardContext: CardPlace = {
        metric: shown.metric,
        translate,
        isRowNarrower: true,
        readerSide: shown.readerSide,
    };
    const person = {
        register,
        keyPrefix: "named",
        figure,
        share,
        card: cardContext,
        place: composeCutPlace(shown),
    };
    for (const [rowIndex, row] of rows.entries()) {
        list.append(renderPersonRow(document, row, rowIndex + 1, person, doesOpen));
    }
    if (neither === null) return;
    const card = {
        register,
        key: "named:nobody",
        figure,
        share,
        notes: [NEITHER_END_WORDS.note],
    };
    const rowContent = presentUnnamedRow(neither, NEITHER_END_WORDS.label);
    list.append(renderRow(document, rowContent, null, card));
}

/** How many rows a cut by key costs a level: its keys, and each row that closes it. */
function countElementCutRows(cut: ElementCut): number {
    return cut.rows.length + (cut.rest === null ? 0 : 1) + (cut.noKind === null ? 0 : 1);
}

/** The cut and its figure rather than a reading holding them: two levels draw this section. */
function renderElementSection(
    document: PanelDocument,
    list: PanelElement,
    cut: ElementCut,
    stated: { metric: PanelMetric; register: CardRegister; figure: string; total: number },
): void {
    if (countElementCutRows(cut) === 0) return;
    list.append(renderSection(document, getWordsForKindCut(stated.metric), stated.total));
    const noun = getNounForMetric(stated.metric);
    const share = PANEL_WORDS.shareOfFigure;
    for (const [rowIndex, row] of cut.rows.entries()) {
        const card = {
            register: stated.register,
            key: `kind:${row.element}`,
            figure: stated.figure,
            share,
        };
        const openedPart = { kind: OPENED_PART.element, element: row.element };
        list.append(
            renderRow(
                document,
                presentElementRow(row, noun, rowIndex + 1),
                getMarkForNamedPart(openedPart, row.doesOpenPart),
                card,
            ),
        );
    }
    renderRestRow(document, list, cut.rest, {
        register: stated.register,
        figure: stated.figure,
        key: "kind:rest",
    });
    if (cut.noKind === null) return;
    const card = { register: stated.register, key: "kind:nobody", figure: stated.figure, share };
    const rowContent = presentUnnamedRow(cut.noKind, PANEL_WORDS.withoutKind);
    list.append(renderRow(document, rowContent, null, card));
}

/** The mark a part row wears, and null where the level under it holds nothing. */
function getMarkForNamedPart(openedPart: OpenedPart, doesOpen: boolean): RowMark | null {
    if (!doesOpen) return null;
    if (openedPart.kind === OPENED_PART.skill) {
        return { attribute: PANEL_MARK.skill, stated: openedPart.name };
    }
    if (openedPart.kind === OPENED_PART.source) {
        return { attribute: PANEL_MARK.source, stated: openedPart.source };
    }
    if (openedPart.kind === OPENED_PART.plain) {
        return { attribute: PANEL_MARK.plain, stated: PLAIN_MARK };
    }
    return { attribute: PANEL_MARK.kind, stated: openedPart.element };
}

/**
 * What a section could not give a row to, summed into one — above the row that closes the section
 * and never inside it. The two are different claims: this is what the game **did** name, and the
 * one below it is what it named nothing for. `develop ADR 0055`.
 *
 * It opens nothing: a sum of parts nobody can list is a level of no figure.
 */
function renderRestRow(
    document: PanelDocument,
    list: PanelElement,
    rest: PlainRow | UnnamedRow | null,
    stated: { register: CardRegister; figure: string; key: string },
): void {
    if (rest === null) return;
    const card = {
        register: stated.register,
        key: stated.key,
        figure: stated.figure,
        share: PANEL_WORDS.shareOfFigure,
        notes: [PANEL_WORDS.restNote],
    };
    const rowContent = presentUnnamedRow(rest, PANEL_WORDS.restOfKinds);
    list.append(renderRow(document, rowContent, null, card));
}

/**
 * A breakdown reached from a list of eleven must not shorten the window under the hand that
 * pressed it, and one longer than eleven must not be cut off in the middle of a section — the
 * ceiling on the host is what stops either from reaching past the bottom of the screen.
 */
function countRowsForOpenedLevel(opened: OpenedLevelContent, floor: number): number {
    const opponents = opened.byOtherEnd;
    let needed = 0;
    if (opponents.rows.length > 0 || opponents.halfNamed !== null) {
        needed += opponents.rows.length + (opponents.halfNamed === null ? 0 : 1) + 1;
    }
    if (countElementCutRows(opened.byElement) > 0) {
        needed += countElementCutRows(opened.byElement) + 1;
    }
    if (opened.bySkill.rows.length > 0 || opened.bySkill.closing !== null) {
        needed += opened.bySkill.rows.length + (opened.bySkill.rest === null ? 0 : 1) +
            (opened.bySkill.closing === null ? 0 : 1) + 1;
    }
    return Math.max(needed, floor);
}

/**
 * The closing row, drawn where its figure puts it rather than after the lot (`develop ADR 0079`).
 * It is asked before every row and once more after the last, so the place the reading composed is
 * the place it is drawn at whether that is the top of the section or the bottom of it.
 */
function renderClosingRowAtPlace(
    document: PanelDocument,
    list: PanelElement,
    closing: ClosingRow | null,
    stated: { metric: PanelMetric; register: CardRegister; figure: string },
    drawn: number,
    isLast: boolean,
): number {
    if (closing === null) return drawn;
    // ⚠️ **Asked once per row and once after the last, so a place past the rows still draws.** A
    // section answering a place it did not reach by drawing nothing would take a figure off the
    // column and leave the shares adding to ninety-something, which is the one thing
    // `DESIGN.md` says a reader must never be handed.
    if (closing.rank !== drawn + 1) {
        if (!isLast) return drawn;
        if (closing.rank <= drawn) return drawn;
    }
    const card = {
        register: stated.register,
        key: "skill:plain",
        figure: stated.figure,
        share: PANEL_WORDS.shareOfFigure,
        caveat: getCaveatForNamedPart({ kind: OPENED_PART.plain }, stated.metric),
    };
    const rowContent = {
        ...presentUnnamedRow(closing, getWordsForUnannounced(stated.metric)),
        rank: closing.rank,
        uses: closing.blows,
    };
    const mark = getMarkForNamedPart({ kind: OPENED_PART.plain }, closing.doesOpenPart);
    list.append(renderRow(document, rowContent, mark, card));
    return drawn + 1;
}

function presentSkillRow(row: SkillRow, metric: PanelMetric, rank: number): RowContent {
    const name = getWordsForNamedPart(row.part, metric);
    return {
        name,
        figure: row.figure,
        fill: row.fill,
        shareText: row.shareText,
        colour: lookupColourForProfession(null),
        profession: null,
        rank,
        uses: row.uses,
    };
}

/**
 * Whether a level stands over the screen's own list. Three fields and not five: a pair and a part
 * are reached through an opened row, so neither stands without `opened`. Asked in two places, and
 * spelled here once — the second spelling of it read `opened` alone and left the label over a
 * pinned row's level saying the strip and the list were the same thing.
 */
function isLevelOpen(shown: ShownScreen): boolean {
    if (shown.opened !== null) return true;
    if (shown.unnamed !== null) return true;
    return shown.unnamedCut !== null;
}

/**
 * What a pinned row says on demand: what the game did not state, where the figure stands against
 * the ranking, and — only where a side is showing — what the shown team is to it.
 *
 * The third is asked only then because under `Wszyscy` there is no scope to state. Every one of
 * them is `src/ui/panel-words.ts`', keyed by the case rather than by the screen: the same screen
 * pins two ends whose answers differ.
 */
function formatPinnedNotes(row: PinnedRow, metric: PanelMetric, isSideChosen: boolean): string[] {
    const notes = [
        getNoteForUnnamedEnd(row.end, getNounForMetric(metric)),
        getWordsForPinnedStanding(row.case),
    ];
    if (isSideChosen) notes.push(getWordsForPinnedScope(row.case));
    return notes;
}

/**
 * What a pinned figure was dealt with, stated on the card before anybody presses the row: the same
 * rows the level under it draws, in the same order, worded by the same table. `develop ADR 0041`.
 *
 * What will not fit is summed rather than dropped, so the run always comes to the figure over it.
 */
function presentPinnedCutParts(row: PinnedRow, metric: PanelMetric): RowCardCut {
    // Every key is written where the figure is, so a pinned figure's kinds come to the whole of it
    // and this run needs no row for a shortfall (`src/core/fight-statistics.ts`,
    // `develop ADR 0039`).
    const parts: Array<{ label: string; stated: string }> = [];
    let rest = 0;
    for (const [kindIndex, kindRow] of row.kinds.rows.entries()) {
        if (kindIndex < CARD_CUT_PARTS_MAXIMUM) {
            parts.push({
                label: getWordsForNamedPart(
                    { kind: OPENED_PART.element, element: kindRow.element },
                    metric,
                ),
                stated: `${formatFigure(kindRow.figure)} (${kindRow.shareText})`,
            });
            continue;
        }
        rest += kindRow.figure;
    }
    if (rest > 0) parts.push({ label: PANEL_WORDS.restOfKinds, stated: formatFigure(rest) });
    return { heading: getWordsForKindCut(metric), parts };
}

/**
 * The strip totals the whole fight whatever the list under it is showing, so the label says so
 * wherever the two differ — a narrowed side, or any level standing over the list.
 */
function formatSidesLabel(shown: ShownScreen): string {
    const sides = `${PANEL_WORDS.ourSide} / ${PANEL_WORDS.theirSide}`;
    if (shown.side === SIDE_CHOICE.everyone) {
        if (!isLevelOpen(shown)) return sides;
    }
    return `${PANEL_WORDS.wholeFight} · ${sides}`;
}

function renderSuspicions(document: PanelDocument, suspicions: readonly string[]): PanelElement {
    if (suspicions.length === 0) return renderSlot(document);
    const block = renderElement(document, "div", CLASS.suspicions);
    for (const suspicion of suspicions) {
        const line = renderText(document, "div", CLASS.suspicion, `${SUSPECT_MARK}${suspicion}`);
        block.append(line);
    }
    return block;
}

function renderDefects(document: PanelDocument, defects: readonly PanelDefect[]): PanelElement {
    if (defects.length === 0) return renderSlot(document);
    const block = renderElement(document, "div", CLASS.defects);
    for (const defect of defects.slice(0, DEFECTS_MAXIMUM)) {
        const line = renderElement(document, "div", CLASS.defect);
        const said = formatDefect(defect.kind, defect.region, defect.count);
        line.textContent = `${DEFECT_MARK}${said}`;
        block.append(line);
    }
    return block;
}

/** After every region stands: the reader's place, the grip on the bar, and the card open. */
function renderPanelSettled(panelDrawing: PanelDrawing): void {
    executeRegionStep(panelDrawing.report, PANEL_REGION.list, () => panelDrawing.drawing.settle());
    panelDrawing.meterDrag?.onDrawn();
    executeRegionStep(panelDrawing.report, PANEL_REGION.card, () => panelDrawing.card.renderOpen());
}

/**
 * One person in the window beside the panel, wherever they stand: whose turn it is, who cast a
 * skill, who is holding somebody, and whom. Their profession is the cap and their side the rule
 * on the edge (`develop ADR 0065`); a row nested under the one above wears the indent and no other
 * difference.
 *
 * ⚠️ **The cast rides this row and never a line of its own.** develop ADR 0067 deleted a wrapping
 * sentence under the holder and took a line back with it; what returns here is two spans on the
 * row that was already there, so the section costs what it cost. `develop ADR 0097`.
 *
 * Both of the cells it draws shorten, so it wears the leaf's cursor and carries the card that
 * hands them back — `develop ADR 0098`.
 */
function renderHelperPerson(
    document: PanelDocument,
    register: CardRegister,
    cardKey: string,
    person: HelperPerson,
): PanelElement {
    const nested = person.isNested ? ` ${CLASS.helperUnder}` : "";
    const castName = person.isNested ? null : person.skillName;
    const holding = castName === null ? "" : ` ${CLASS.helperHolding}`;
    const classes = `${CLASS.row} ${CLASS.rowLeaf}${nested}${holding}`;
    const row = renderElement(document, "div", classes);
    const cap = renderElement(document, "div", CLASS.barCap);
    cap.setAttribute(STYLE_ATTRIBUTE, `background:${formatColour(person.colour)}`);
    const name = renderText(document, "span", CLASS.rowName, person.name);
    row.append(cap);
    row.append(name);
    const parts = [cap, name];
    if (castName !== null) {
        const between = renderText(document, "span", CLASS.rowShare, HELPER_WORDS.castSeparator);
        const cast = renderText(document, "span", CLASS.helperCast, castName);
        row.append(between);
        row.append(cast);
        parts.push(between, cast);
    }
    if (person.turns !== null) {
        const turnsCell = renderText(
            document,
            "span",
            `${CLASS.rowValue} ${CLASS.figure}`,
            person.turns,
        );
        row.append(turnsCell);
        parts.push(turnsCell);
    }
    for (const rule of renderSideRules(document, person.sideRelation)) {
        row.append(rule);
        parts.push(rule);
    }
    register.add(cardKey, () => presentHelperPersonCard(person));
    // Every span and not the row alone, for `renderRow`'s own reason: a pointer lands on
    // the node under it, and `getAttribute` is never walked up.
    setRowMarks([row, ...parts], CARD_ATTRIBUTE, cardKey);
    return row;
}

/**
 * What a person's row had to cut, handed back whole: the name, the okrzyk the row is about under
 * it, and the turns wherever the row states them. **It is not the ranking's person card** — the
 * figures of the fight are the panel's and never reach this window, so what stands here is the
 * card a skill and a fight on the shelf already get. `develop ADR 0098`.
 */
function presentHelperPersonCard(person: HelperPerson): CardContent {
    if (person.turns === null) {
        return { name: person.name, subtitle: person.skillName, groups: [] };
    }
    const stated: CardLine = {
        kind: CARD_LINE.stat,
        label: HELPER_WORDS.turnsLeft,
        stated: person.turns,
        isStrong: false,
        caveat: person.turnsCaveat,
    };
    // Read off the figure rather than asked a second time, which is what keeps one glyph and one
    // sentence answering to each other wherever either is drawn (`develop ADR 0089`).
    const lines: CardLine[] = [stated, ...presentCaveatNoteLines([{ lines: [stated] }])];
    return { name: person.name, subtitle: person.skillName, groups: [{ lines }] };
}

/**
 * What a charge's row had to cut, handed back whole: the blow's name, whoever is making it ready
 * — which the row says in a hue and nowhere in words — and what became of it at either end. The
 * turns are the client's own pair, under the word a cast's card already states its own under.
 * `develop ADR 0100`.
 */
function presentChargedSkillCard(charged: StandingChargedSkill): CardContent {
    const stated: CardLine = {
        kind: CARD_LINE.stat,
        label: HELPER_WORDS.turnsPassed,
        stated: formatCounter(charged.turnsElapsed, charged.turnsStated),
        isStrong: false,
        caveat: null,
    };
    return {
        name: charged.skillName,
        subtitle: formatChargedSkillSubtitle(charged.name, charged.state),
        groups: [{ lines: [stated] }],
    };
}

/**
 * The sentences the figures above earned, and **read off those figures rather than asked a second
 * time**: a card that worked out for itself which ones to say could draw a glyph pointing at a
 * sentence it had not drawn, or a sentence no glyph pointed at. Each is said once however many of
 * its figures wear the mark, and the run is bounded by `CAVEATS`, which is closed (**S11**).
 *
 * A row's card composes its sentences here too (`develop:src/ui/panel-element.ts`), which is what
 * keeps one glyph and one sentence answering to each other wherever either is drawn.
 * `develop ADR 0089`.
 */
function presentCaveatNoteLines(groups: readonly CardGroup[]): CardLine[] {
    const said = new Set<Caveat>();
    for (const group of groups) {
        for (const line of group.lines) {
            if (line.kind !== CARD_LINE.stat) continue;
            if (line.caveat === null) continue;
            said.add(line.caveat);
        }
    }
    // The sentence alone: the mark opening it is drawn from the tone rather than spelled into the
    // text (`develop ADR 0092`), and `develop:src/ui/panel-card.ts` is where it goes on being
    // counted.
    return CAVEATS.filter((caveat) => said.has(caveat)).map((caveat): CardLine => ({
        kind: CARD_LINE.note,
        text: getNoteForCaveat(caveat),
        tone: CARD_NOTE_TONE.caveat,
    }));
}

/**
 * What pointing at a fight says, from the line over the ranking or from a row on the shelf: which
 * fight it was, when it opened, where in full, on which world, and as which character (ADR 0014).
 * A line with nothing to state is left off, so the card never says that something is unknown.
 *
 * ⚠️ **The place is the card's name and never one of its lines.** A name wraps and is counted at
 * the lines it takes, where a line's value neither shrinks nor wraps: a place a line could not hold
 * would be cut on the one card that exists to draw it whole (`develop ADR 0084`).
 */
function presentFightCard(fight: FightCardContent): CardContent {
    const counted = formatFightCardCounts(fight);
    const lines: CardLine[] = [];
    // A fight going on is dated by when it opened: the shelf's `teraz` is a row's word, not a date.
    addFightCardLine(lines, FIGHT_CARD_WORDS.when, formatShelfTime(fight.at, false));
    addFightCardLine(lines, FIGHT_CARD_WORDS.world, fight.world ?? "");
    addFightCardLine(lines, FIGHT_CARD_WORDS.character, fight.reader?.name ?? "");
    // A profession and a level beside a nickname of twenty-five characters (`develop ADR 0097`)
    // overrun the bound, so the two stand on a line of their own, as a person's card puts them
    // under the name.
    const said = fight.reader === null
        ? null
        : formatCardSubtitle(fight.reader.profession, fight.reader.level, SIDE_RELATION.nobody);
    addFightCardLine(lines, FIGHT_CARD_WORDS.profession, said ?? "");
    const groups = lines.length === 0 ? [] : [{ lines }];
    if (fight.place === null) return { name: counted, subtitle: null, groups };
    return { name: fight.place, subtitle: counted, groups };
}

/** The line over the ranking, in the words a shelf row uses for how it went. */
function formatFightCardCounts(fight: FightCardContent): string {
    const counted = formatSideCounts(fight.sizes, fight.unplaced);
    const outcome = getWordsForShelfOutcome(fight.outcome, fight.isLive);
    if (outcome.length === 0) return counted;
    return `${counted} · ${outcome}`;
}

function addFightCardLine(lines: CardLine[], label: string, stated: string): void {
    if (stated.length === 0) return;
    lines.push({ kind: CARD_LINE.stat, label, stated, isStrong: false, caveat: null });
}

export function createCardRegister(): CardRegister {
    const composeByKey = new Map<string, CardCompose>();
    return {
        // A row with no name, one already registered, or one past the bound is left without a
        // card. What that costs is detail on hover, and never the draw it arrived in (**E12**).
        add(key: string, compose: CardCompose): void {
            if (key.length === 0) return;
            if (composeByKey.has(key)) return;
            if (composeByKey.size >= CARDS_DRAWN_MAXIMUM) return;
            composeByKey.set(key, compose);
        },
        lookup(key: string): CardCompose | null {
            return composeByKey.get(key) ?? null;
        },
        reset(): void {
            composeByKey.clear();
        },
    };
}

export function tallyCardSize(card: CardContent | null, step: TypeStep): CardSize {
    if (card === null) return { lines: 1, groups: 0 };
    const floors = CHARACTERS_PER_LINE_BY_STEP[step];
    let lines = getCardLinesForCharacters(card.name.length, floors.name);
    if (card.subtitle !== null) {
        lines += getCardLinesForCharacters(card.subtitle.length, floors.note);
    }
    for (const group of card.groups) {
        for (const line of group.lines) {
            lines += getCardLineCost(line, floors);
        }
    }
    // The bound is on where the card is placed, never on what it holds: every line is drawn.
    if (lines > CARD_LINES_MAXIMUM) lines = CARD_LINES_MAXIMUM;
    return { lines, groups: card.groups.length };
}

/**
 * What a run of text costs the height, on the floor its face is counted at. A floor of nought
 * answers infinity, and a text of nothing stands on a line all the same.
 */
function getCardLinesForCharacters(characters: number, charactersPerLine: number): number {
    const wrapped = Math.ceil(characters / charactersPerLine);
    if (wrapped < 1) return 1;
    return wrapped;
}

/**
 * What one line of a run costs the height. A note wraps, so it costs the lines its text runs to;
 * every other kind is held to one by the stylesheet, which cuts a long label rather than folding
 * it. The name a card opens with is neither, and `tallyCardSize` counts it.
 *
 * ⚠️ **A caveated note's mark is counted although it is not in the text.** It is drawn from the
 * tone since `develop ADR 0092`, and a count reading `text` alone would shorten every one of those
 * notes by a mark the card still draws — which is the trap the glyph sat inside the sentence to
 * avoid while it was a codepoint.
 */
function getCardLineCost(line: CardLine, floors: CharactersPerLine): number {
    if (line.kind !== CARD_LINE.note) return 1;
    const marked = line.tone === CARD_NOTE_TONE.caveat ? NOTE_MARK_CHARACTERS : 0;
    return getCardLinesForCharacters(line.text.length + marked, floors.note);
}

export function renderCard(
    document: PanelDocument,
    card: CardContent | null,
): PanelElement {
    const drawnCard = document.createElement("div");
    drawnCard.className = card === null ? `${CLASS.card} ${CLASS.cardHidden}` : CLASS.card;
    if (card === null) return drawnCard;
    // A block rather than a span, because the name folds and an inline box would fold around
    // whatever stood beside it. What its lines cost is `tallyCardSize` above.
    const name = document.createElement("div");
    name.className = CLASS.cardName;
    name.textContent = card.name;
    drawnCard.append(name);
    if (card.subtitle !== null) {
        const subtitle = document.createElement("div");
        subtitle.className = CLASS.cardSubtitle;
        subtitle.textContent = card.subtitle;
        drawnCard.append(subtitle);
    }
    for (const group of card.groups) {
        // Render one group of the card's lines.
        const drawnGroup = document.createElement("div");
        drawnGroup.className = CLASS.cardGroup;
        for (const line of group.lines) {
            // Render one line of the group.
            if (line.kind === CARD_LINE.note) {
                // Render a sentence at the foot of the card, its caveat's ring before it.
                // The suspect and the defect marks stay inside their own text: both are
                // drawn by a codepoint that every face carries at a width its own height
                // (`develop ADR 0092` carries the measurement), and only the circled
                // letter had to be built.
                const note = document.createElement("div");
                const tone = CARD_NOTE_TONE_CLASS[line.tone];
                note.className = `${CLASS.cardNote}${tone}`;
                note.textContent = line.text;
                // ⚠️ **Appended after the sentence and stood before it by the sheet.**
                // `textContent` replaces every child, so a ring written first is wiped
                // by the line it belongs to — and wrapping the sentence in a span of its
                // own instead would leave this element's own `textContent` empty, which
                // is what every reader of a drawn note asks it for.
                if (line.tone === CARD_NOTE_TONE.caveat) {
                    note.append(renderCardCaveat(document));
                }
                drawnGroup.append(note);
            } else if (line.kind === CARD_LINE.heading) {
                // Render a heading over the lines below it.
                const heading = document.createElement("div");
                heading.className = CLASS.cardHeading;
                heading.textContent = line.text;
                drawnGroup.append(heading);
            } else {
                const drawnLine = document.createElement("div");
                drawnLine.className = composeCardLineClass(line);
                const label = document.createElement("span");
                label.className = CLASS.cardLabel;
                label.textContent = line.label;
                const stated = document.createElement("span");
                stated.className = CLASS.cardValue;
                stated.textContent = line.stated;
                drawnLine.append(label);
                // Before the value and never after it: the value column is right-aligned
                // in `tabular-nums`, and a glyph behind it would offset the figures of the
                // lines carrying one against those that do not. Before it, the column
                // stays aligned and the glyph still stands at the figure.
                if (line.kind === CARD_LINE.stat) {
                    if (line.caveat !== null) drawnLine.append(renderCardCaveat(document));
                }
                drawnLine.append(stated);
                drawnGroup.append(drawnLine);
            }
        }
        drawnCard.append(drawnGroup);
    }
    return drawnCard;
}

/**
 * The glyph a figure wears where its label names more than the figure counts. It takes its width
 * from the label beside it, which the sheet cuts rather than folds — `LABEL_CHARACTERS_MAXIMUM` in
 * `src/ui/panel-words.ts` is where that arithmetic is.
 */
function renderCardCaveat(document: PanelDocument): PanelElement {
    const caveatElement = document.createElement("span");
    caveatElement.className = CLASS.cardCaveat;
    caveatElement.textContent = CAVEAT_MARK;
    return caveatElement;
}

function composeCardLineClass(line: CardLine): string {
    if (line.kind === CARD_LINE.sub) return `${CLASS.cardLine} ${CLASS.cardSub}`;
    if (line.kind === CARD_LINE.stat) {
        if (line.isStrong) return `${CLASS.cardLine} ${CLASS.cardStrong}`;
    }
    return CLASS.cardLine;
}

export function setCardHidden(card: PanelElement, isHidden: boolean): void {
    card.className = isHidden ? `${CLASS.card} ${CLASS.cardHidden}` : CLASS.card;
}

/**
 * Where the card sits, and how tall it stands, as the properties the stylesheet clamps and
 * multiplies. Whole pixels down the screen, because `clientY` is fractional on a scaled display
 * and half a pixel is nothing anybody can see — while a declaration reading `292.33333333333px`
 * is something a reader of the page can.
 */
export function setCardPosition(
    card: PanelElement,
    clientY: number,
    across: CardAcross | null,
    size: CardSize,
    step: TypeStep,
): void {
    // A pointer that states no position puts the card at the top rather than nowhere: `Math.round`
    // of a figure that is not one is not one either, and a card placed at it is off the screen.
    const stated = Number.isFinite(clientY) ? clientY : 0;
    const top = Math.max(0, Math.round(stated));
    const sideways = composeCardAcrossStyle(across);
    // The height rather than the counts it came from: the trim and the sheet's clamp spend one
    // number. A height nothing could be read for leaves the property off (**E12**).
    const height = getCardHeight(size, TYPE_TOKENS[step]);
    const tall = height === null ? "" : `;${CARD_VARIABLES.height}:${height}px`;
    card.setAttribute(STYLE_ATTRIBUTE, `${CARD_VARIABLES.top}:${top}px${tall}${sideways}`);
}

/**
 * The pair of properties a placement across comes to, or nothing at all — a panel nobody has
 * moved keeps the corner the sheet states, and writing an offset for it would say the reader had
 * moved something.
 */
function composeCardAcrossStyle(across: CardAcross | null): string {
    if (across === null) return "";
    const edgeOffset = `${Math.max(0, Math.round(across.at))}px`;
    if (across.edge === "left") {
        return `;${CARD_VARIABLES.left}:${edgeOffset};${CARD_VARIABLES.right}:${EDGE_RELEASED}`;
    }
    return `;${CARD_VARIABLES.left}:${EDGE_RELEASED};${CARD_VARIABLES.right}:${edgeOffset}`;
}

/**
 * The card cut to the room there is, with a line saying so wherever anything was given up.
 *
 * ⚠️ **A card taller than the window is clipped and says nothing about it.** The box carries
 * `overflow:hidden` and takes no pointer: measured on Chrome 152, 2026-09-06, a 533 px card in a
 * 480 px window shows 464 of it and loses the rest without a mark. So what will not fit is given
 * up at a run's own edge and the card states it. Unchanged where the page states no height.
 */
export function composeCardWithin(
    card: CardContent,
    room: number | null,
    typeStep: TypeStep,
): CardContent {
    if (room === null) return card;
    if (!Number.isFinite(room)) return card;
    if (room <= 0) return card;
    if (isCardWithin(card, room, typeStep)) return card;
    let kept: readonly CardGroup[] = card.groups;
    for (let step = 0; step < CARD_GROUPS_MAXIMUM; step += 1) {
        const shorter = composeGroupsWithout(kept);
        if (shorter === null) break;
        kept = shorter;
        if (isCardWithin(composeCardTrimmed(card, kept), room, typeStep)) break;
    }
    return composeCardTrimmed(card, kept);
}

function isCardWithin(card: CardContent, room: number, step: TypeStep): boolean {
    const height = getCardHeight(tallyCardSize(card, step), TYPE_TOKENS[step]);
    if (height === null) return true;
    return height <= room;
}

/**
 * The card with its last sacrificeable run gone, or null where there is none left. The four
 * figures are what a card is for and the notes carry the suspicions — a claim that a figure above
 * may be wrong outranks how somebody fought — so what goes is between them, the last one first.
 */
function composeGroupsWithout(groups: readonly CardGroup[]): CardGroup[] | null {
    const lastIndex = groups.length - 1;
    if (lastIndex < 1) return null;
    const droppedIndex = isNoteGroup(groups[lastIndex] ?? { lines: [] })
        ? lastIndex - 1
        : lastIndex;
    if (droppedIndex < 1) return null;
    return [...groups.slice(0, droppedIndex), ...groups.slice(droppedIndex + 1)];
}

/** A run of nothing but notes, which is what a card puts last and what a trim never takes. */
function isNoteGroup(group: CardGroup): boolean {
    if (group.lines.length === 0) return false;
    return group.lines.every((line) => line.kind === CARD_LINE.note);
}

/** The card once something was given up: it says so, where a figure's qualifiers are read. */
function composeCardTrimmed(card: CardContent, kept: readonly CardGroup[]): CardContent {
    if (kept.length === card.groups.length) return card;
    const said: CardLine = {
        kind: CARD_LINE.note,
        text: CARD_WORDS.cut,
        tone: CARD_NOTE_TONE.plain,
    };
    const lastGroup = kept[kept.length - 1];
    if (lastGroup !== undefined) {
        if (isNoteGroup(lastGroup)) {
            const groups = [...kept.slice(0, -1), { lines: [...lastGroup.lines, said] }];
            return { ...card, groups };
        }
    }
    return { ...card, groups: [...kept, { lines: [said] }] };
}

/**
 * The card on the page, and the whole of what it remembers: which row it is open for, how tall its
 * card stands and where the pointer left it.
 *
 * A fight redraws every few seconds. A card that vanished under the cursor on every payload would
 * be worse than one that says nothing, so a redraw looks its own key up again and follows the
 * figure as it moves — and hides only where the row it names has stopped being drawn.
 */
export function initCardHandle(
    document: PanelDocument,
    cardLookup: CardLookup,
    redraw: CardRedraw,
    /** Asked with the key the card is open for: the two windows do not open on the same side. */
    getAcross: (key: string) => CardAcross | null = () => null,
    /** Asked as a card opens, never as the panel is built. Null is a page stating no height. */
    getViewportHeight: () => number | null = () => null,
    getTypeStep: () => TypeStep = () => TYPE_STEP_DEFAULT,
): CardHandle {
    let cardElement = renderCard(document, null);
    let openKey: string | null = null;
    let openTop = 0;
    let openSize: CardSize = tallyCardSize(null, getTypeStep());
    const renderCardFor = (key: string, cardComposed: CardContent): void => {
        // Cut here rather than where a card is composed: the one place that knows both it and the
        // window, and on the way in for a card opened and for one a redraw put up again.
        const card = composeCardWithin(
            cardComposed,
            getCardHeightAvailable(getViewportHeight()),
            getTypeStep(),
        );
        openSize = tallyCardSize(card, getTypeStep());
        cardElement = redraw(cardElement, () => renderCard(document, card));
        setCardPosition(cardElement, openTop, getAcross(key), openSize, getTypeStep());
    };
    const hideCard = (): void => {
        if (openKey === null) return;
        openKey = null;
        setCardHidden(cardElement, true);
    };
    return {
        element: cardElement,
        onHover(key: string | null, clientY: number): void {
            if (key === null) {
                hideCard();
                return;
            }
            const top = Math.max(0, Math.round(clientY));
            if (key === openKey) {
                // A card that would not compose is hidden where it stands
                // (`src/ui/panel-element.ts`) without this handle being told, so the key it was
                // open under still names it: without the class read here, a pointer moving inside
                // that row would only move a window nobody can see.
                if (!cardElement.className.includes(CLASS.cardHidden)) {
                    // A pointer reports far more moves than the window has places to stand in,
                    // and a move inside one pixel would rewrite the same declaration.
                    if (top === openTop) return;
                    openTop = top;
                    setCardPosition(cardElement, openTop, getAcross(key), openSize, getTypeStep());
                    return;
                }
            }
            const compose = cardLookup.lookup(key);
            if (compose === null) {
                hideCard();
                return;
            }
            openTop = top;
            openKey = key;
            renderCardFor(key, compose());
        },
        renderOpen(): void {
            const key = openKey;
            if (key === null) return;
            const compose = cardLookup.lookup(key);
            if (compose === null) {
                hideCard();
                return;
            }
            renderCardFor(key, compose());
        },
    };
}

/**
 * What a person's row says on demand, at whichever level it stands: every figure a combatant has
 * and not only the one the screen is showing, and both runs and not only the screen's.
 */
export function presentCard(subject: CardSubject): CardContent {
    const groups: CardGroup[] = [
        { lines: presentCardFigureLines(subject.detail, subject.metric, subject.translate) },
    ];
    const counters = presentCardCounterLines(subject.detail);
    if (counters.length > 0) groups.push({ lines: counters });
    groups.push(...presentCardRunGroups(subject.detail, subject.translate));
    const legendary = presentCardLegendaryLines(subject.detail.legendaryBonuses);
    if (legendary.length > 0) groups.push({ lines: legendary });
    const reached = presentCardReachedLines(subject.detail.legendaryBonusesReached);
    if (reached.length > 0) groups.push({ lines: reached });
    const notes = presentCardNoteLines(subject, groups);
    if (notes.length > 0) groups.push({ lines: notes });
    return {
        // A card with nobody behind it says so rather than standing with a blank where a name is.
        name: subject.name.length > 0 ? subject.name : PANEL_WORDS.unknown,
        subtitle: formatCardSubtitle(
            subject.profession,
            subject.detail.level,
            subject.sideRelation,
        ),
        groups,
    };
}

/**
 * The figures the whole fight is summed over, under the heading saying so.
 *
 * **The screen's own figure stands whatever it is, and the other three only above nought.** A
 * screen showing somebody at nothing has to say nothing — that is the answer to what was asked —
 * while the other three at nought are three lines answering nobody. Drawing all four
 * unconditionally printed 580 figures of nought over `captures/` on 2026-09-14, 0.49 to a
 * card; this leaves 145, each of them the one a reader pointed at.
 */
function presentCardFigureLines(
    detail: RowDetail,
    metric: PanelMetric,
    translate: TranslateLabel | null,
): CardLine[] {
    const lines: CardLine[] = [{ kind: CARD_LINE.heading, text: CARD_WORDS.wholeFight }];
    for (const cardFigure of presentCardFigures(detail)) {
        if (cardFigure.metric !== metric) {
            if (!Number.isFinite(cardFigure.figure)) continue;
            if (cardFigure.figure <= 0) continue;
        }
        lines.push({
            kind: CARD_LINE.stat,
            label: getWordsForCardMetric(cardFigure.metric),
            stated: formatFigure(cardFigure.figure),
            isStrong: cardFigure.metric === metric,
            caveat: null,
        });
        if (cardFigure.halfNamed !== null) {
            lines.push(
                ...presentCardSubLine(cardFigure.halfNamed.label, cardFigure.halfNamed.figure),
            );
        }
        for (const mergedPart of presentCardPartsMergedByWord(cardFigure.absorbed, translate)) {
            lines.push(...presentCardSubLine(mergedPart.label, mergedPart.figure));
        }
    }
    return lines;
}

/**
 * The four in the order the strip over the list puts them, written out rather than derived: a
 * table read out of `SCREEN_ORDER` could not say which end each one is missing. That the order is
 * the strip's is read back in words by `tests/ui/panel-card.test.ts`.
 */
function presentCardFigures(detail: RowDetail): CardFigure[] {
    const figures: CardFigure[] = [
        {
            metric: PANEL_METRIC.damageDealt,
            figure: detail.damageDealt,
            halfNamed: { label: PANEL_WORDS.withoutTarget, figure: detail.damageDealtToNobody },
            absorbed: detail.damageDealtAbsorbedByDefence,
        },
        {
            metric: PANEL_METRIC.damageTaken,
            figure: detail.damageTaken,
            halfNamed: { label: PANEL_WORDS.withoutActor, figure: detail.damageTakenFromNobody },
            absorbed: detail.damageTakenAbsorbedByDefence,
        },
        {
            metric: PANEL_METRIC.healthGiven,
            figure: detail.healthGiven,
            halfNamed: null,
            absorbed: [],
        },
        {
            metric: PANEL_METRIC.healthRestored,
            figure: detail.healthRestored,
            halfNamed: { label: PANEL_WORDS.withoutActor, figure: detail.healthRestoredByNobody },
            absorbed: [],
        },
    ];
    return figures;
}

function presentCardSubLine(label: string, figure: number): CardLine[] {
    if (label.length === 0) return [];
    if (!Number.isFinite(figure)) return [];
    if (figure <= 0) return [];
    return [{ kind: CARD_LINE.sub, label, stated: formatFigure(figure) }];
}

function presentCardCounterLines(detail: RowDetail): CardLine[] {
    const lines: CardLine[] = [];
    // First, because a turn is what the counts below happened inside of: the blows and the
    // announcements are what one was spent on (`docs/turns-taken.md`).
    if (detail.turnsTaken > 0) lines.push(presentCardTurnLine(detail));
    if (detail.blowsStruck > 0) {
        lines.push({
            kind: CARD_LINE.stat,
            label: CARD_WORDS.blows,
            stated: formatFigure(detail.blowsStruck),
            isStrong: false,
            caveat: null,
        });
        lines.push(
            ...presentCardSubLine(CARD_WORDS.blowsWithoutSkill, detail.blowsWithoutSkill),
        );
    }
    if (detail.skillUses > 0) {
        lines.push({
            kind: CARD_LINE.stat,
            label: CARD_WORDS.skillUses,
            stated: formatFigure(detail.skillUses),
            isStrong: false,
            caveat: null,
        });
    }
    return lines;
}

/**
 * The turns a combatant took, with the ones they lost beside them **wherever that reading was heard
 * at all**. Where the fight carries no lost turn on anybody, the second half is unread rather than
 * nought — the announcement is read by the shape of a sentence and a world wording it otherwise
 * yields nothing for everybody (`docs/turns-taken.md`) — so the line states the one figure
 * it has. `develop ADR 0110`.
 */
function presentCardTurnLine(detail: RowDetail): CardLine {
    if (!detail.wasTurnLostRead) {
        return {
            kind: CARD_LINE.stat,
            label: CARD_WORDS.turns,
            stated: formatFigure(detail.turnsTaken),
            isStrong: false,
            caveat: CAVEAT.turns,
        };
    }
    return {
        kind: CARD_LINE.stat,
        label: CARD_WORDS.turnsWithLost,
        stated: formatTurns(detail.turnsTaken, detail.turnsLost),
        isStrong: false,
        caveat: CAVEAT.turns,
    };
}

/**
 * The two runs, each under the heading naming its end, and a run that came to nothing is not
 * drawn at all. **Neither of them turns on the screen**: a reader asking what held has the same
 * card as one asking what landed, and the screen decides only which of the four figures is bold.
 * `DESIGN.md` owns the rest of the card's shape.
 */
function presentCardRunGroups(detail: RowDetail, translate: TranslateLabel | null): CardGroup[] {
    const runs = [
        { heading: CARD_WORDS.striking, lines: presentCardDealtLines(detail, translate) },
        { heading: CARD_WORDS.struck, lines: presentCardTakenLines(detail, translate) },
    ];
    const groups: CardGroup[] = [];
    for (const run of runs) {
        if (run.heading.length === 0) continue;
        if (run.lines.length === 0) continue;
        groups.push({ lines: [{ kind: CARD_LINE.heading, text: run.heading }, ...run.lines] });
    }
    return groups;
}

/**
 * How they struck: what the protocol stated before reduction, how much of it landed critically,
 * what else fired, and what their blows took off the other side. The share is of **blows** and
 * never of the turns the line above states: nothing on this card is divided by a turn
 * (`PRODUCT.md`, `develop ADR 0048`).
 */
function presentCardDealtLines(detail: RowDetail, translate: TranslateLabel | null): CardLine[] {
    const lines: CardLine[] = [...presentCardRawLine(detail.damageDealtRaw)];
    const critical = presentCardCriticalText(detail);
    if (critical !== null) {
        lines.push({
            kind: CARD_LINE.stat,
            label: CARD_WORDS.blowsCritical,
            stated: critical,
            isStrong: false,
            caveat: null,
        });
        const offhand = detail.procsWhenStriking.filter((cutPart) =>
            cutPart.key === OFFHAND_CRIT_KEY
        );
        lines.push(
            ...presentCardPartsMergedByWord(offhand, translate).map((mergedPart): CardLine => ({
                kind: CARD_LINE.sub,
                label: mergedPart.label,
                stated: formatUses(mergedPart.figure),
            })),
        );
    }
    lines.push(...presentCardProcLines(detail.procsWhenStriking, CRITICAL_PROC_KEYS, translate));
    lines.push(...presentCardDestroyedLines(detail.statisticsDestroyed));
    return lines;
}

/**
 * What the protocol stated before reduction, at whichever end the run it joins is about.
 *
 * **It stands in the run and never under the figure of the whole fight.** Drawn there it read as a
 * part of the figure over it, and it is a sum over a narrower set of messages: a blow states a
 * figure before reduction, while damage stated against a name arrives already reduced and health
 * moving outside a blow states no such figure at all (`src/core/fight-statistics.ts`). Over
 * `captures/` on 2026-09-14 it stood **below** the figure it hung under on 296 of 1,184
 * cards, and on 172 of them below one figure and above the other on the same card.
 * `develop ADR 0087`.
 */
function presentCardRawLine(raw: number): CardLine[] {
    if (!Number.isFinite(raw)) return [];
    if (raw <= 0) return [];
    return [{
        kind: CARD_LINE.stat,
        label: CARD_WORDS.raw,
        stated: formatFigure(raw),
        isStrong: false,
        caveat: CAVEAT.reduction,
    }];
}

/** Null where nothing was struck, because a rate of nothing is not zero — it is no rate. */
function presentCardCriticalText(detail: RowDetail): string | null {
    if (detail.blowsCritical <= 0) return null;
    if (detail.blowsStruck <= 0) return null;
    // More criticals than blows is a share above the hundred, which is a number that is wrong
    // looking like one that is right. The count is stated on its own instead (**E12**).
    if (detail.blowsCritical > detail.blowsStruck) return formatUses(detail.blowsCritical);
    const share = formatShareRounded(detail.blowsCritical / detail.blowsStruck);
    return `${formatFigure(detail.blowsCritical)} (${share})`;
}

/**
 * Parts sharing a word are one row, and the word is what decides it.
 *
 * `ui/panel-words.ts` is where several keys come to share one, and why. Drawn a key at a time
 * they made two lines reading that word against different counts, which a reader can only take
 * as a panel that cannot add: nothing on screen says which of them either line is.
 */
function presentCardPartsMergedByWord(
    parts: readonly CutPart[],
    translate: TranslateLabel | null,
): Array<{ label: string; figure: number }> {
    const byLabel = new Map<string, number>();
    for (const cutPart of parts.slice(0, CARD_PARTS_MAXIMUM)) {
        const label = getWordsForBlowKey(cutPart.key, translate);
        if (label.length === 0) continue;
        byLabel.set(label, (byLabel.get(label) ?? 0) + cutPart.figure);
    }
    const folded = [...byLabel].map(([label, figure]) => ({ label, figure }));
    folded.sort((leftPart, rightPart) =>
        getRankedOrder(leftPart.figure, rightPart.figure, leftPart.label, rightPart.label)
    );
    return folded;
}

/**
 * Everything but the keys the line above it already counted, which would otherwise read twice, and
 * the legendary bonuses, which stand in a run of their own (ADR 0029).
 *
 * **The count wears the sign, because it shares a column with damage.** A proc that fired thirteen
 * times printed `13` directly over `Największy cios 2 865`, in one right-aligned column of
 * `tabular-nums`, with nothing saying which of the two is a quantity of damage. `×13` is the
 * spelling `formatUses` already gives a count of announcements (`src/ui/panel-words.ts`).
 */
function presentCardProcLines(
    parts: readonly CutPart[],
    without: readonly string[],
    translate: TranslateLabel | null,
): CardLine[] {
    const kept = parts.filter((cutPart) => !without.includes(cutPart.key)).filter((cutPart) =>
        lookupLegendaryBonus(cutPart.key) === null
    );
    const narrowed = presentCardProcSubParts(kept, translate);
    const lines: CardLine[] = [];
    for (const mergedPart of presentCardPartsMergedByWord(kept, translate)) {
        lines.push({
            kind: CARD_LINE.stat,
            label: mergedPart.label,
            stated: formatUses(mergedPart.figure),
            isStrong: false,
            caveat: null,
        });
        for (const sub of narrowed.get(mergedPart.label) ?? []) {
            lines.push({
                kind: CARD_LINE.sub,
                label: sub.label,
                stated: formatUses(sub.figure),
            });
        }
    }
    return lines;
}

/**
 * The runs standing under a row, by the word that row wears — which keys draw one at all is
 * `src/ui/panel-words.ts`'s to say.
 *
 * **Sliced where `presentCardPartsMergedByWord` slices**, so the two walks see one list and no
 * sub-line can count a part the row above it dropped. Pushed inside that row's own turn rather than
 * sorted with the rest, because a sub-line is read through the line above it (`DESIGN.md`).
 */
function presentCardProcSubParts(
    parts: readonly CutPart[],
    translate: TranslateLabel | null,
): Map<string, Array<{ label: string; figure: number }>> {
    const byWords = new Map<string, Map<string, number>>();
    for (const cutPart of parts.slice(0, CARD_PARTS_MAXIMUM)) {
        const words = getSubWordsForBlowKey(cutPart.key);
        if (words.length === 0) continue;
        const label = getWordsForBlowKey(cutPart.key, translate);
        if (label.length === 0) continue;
        const figureBySubWord = byWords.get(label) ?? new Map<string, number>();
        figureBySubWord.set(words, (figureBySubWord.get(words) ?? 0) + cutPart.figure);
        byWords.set(label, figureBySubWord);
    }
    const folded = new Map<string, Array<{ label: string; figure: number }>>();
    for (const [label, figureBySubWord] of byWords) {
        const run = [...figureBySubWord].map(([words, figure]) => ({ label: words, figure }));
        run.sort((leftPart, rightPart) =>
            getRankedOrder(leftPart.figure, rightPart.figure, leftPart.label, rightPart.label)
        );
        folded.set(label, run);
    }
    return folded;
}

/**
 * The legendary bonuses, in a run of their own rather than among what fired at either end, so a
 * reader asking what their bonuses did reads one place (ADR 0029). Those fired are counted; those
 * held for the whole fight are named once, in a sentence, because a count of a bonus standing
 * throughout says something happened that many times, and nothing did.
 */
function presentCardLegendaryLines(parts: readonly CutPart[]): CardLine[] {
    const fired: CardLine[] = [];
    const held: string[] = [];
    for (const cutPart of parts.slice(0, CARD_PARTS_MAXIMUM)) {
        const bonus = lookupLegendaryBonus(cutPart.key);
        if (bonus === null) continue;
        const label = getWordsForLegendaryBonus(cutPart.key);
        if (bonus.showing === LEGENDARY_BONUS_SHOWING.held) held.push(label);
        else {
            fired.push({
                kind: CARD_LINE.stat,
                label,
                stated: formatUses(cutPart.figure),
                isStrong: false,
                caveat: null,
            });
        }
    }
    if (fired.length + held.length === 0) return [];
    const lines: CardLine[] = [{ kind: CARD_LINE.heading, text: CARD_WORDS.legendary }, ...fired];
    if (held.length > 0) {
        lines.push({
            kind: CARD_LINE.note,
            text: `${CARD_WORDS.legendaryHeld} ${held.join(", ")}.`,
            tone: CARD_NOTE_TONE.plain,
        });
    }
    return lines;
}

/**
 * Somebody else's legendary bonuses as they acted on this combatant: each by its count, and under
 * it whose it was, so a curse they threw and a curse thrown at them never share a line (ADR 0031).
 */
function presentCardReachedLines(bonuses: readonly ReachedBonus[]): CardLine[] {
    if (bonuses.length === 0) return [];
    const lines: CardLine[] = [{ kind: CARD_LINE.heading, text: CARD_WORDS.legendaryReached }];
    for (const bonus of bonuses.slice(0, CARD_PARTS_MAXIMUM)) {
        lines.push({
            kind: CARD_LINE.stat,
            label: getWordsForLegendaryBonus(bonus.key),
            stated: formatUses(bonus.figure),
            isStrong: false,
            caveat: null,
        });
        for (const giver of bonus.givers.slice(0, CARD_PARTS_MAXIMUM)) {
            lines.push({
                kind: CARD_LINE.sub,
                label: giver.name.length > 0 ? giver.name : PANEL_WORDS.unknown,
                stated: formatUses(giver.figure),
            });
        }
    }
    return lines;
}

/**
 * What their blows took off the other side, under a heading and **never under a sum**: the parts
 * are counted in different units and the figure carries which (`src/ui/panel-words.ts`).
 */
function presentCardDestroyedLines(parts: readonly CutPart[]): CardLine[] {
    if (parts.length === 0) return [];
    const lines: CardLine[] = [{ kind: CARD_LINE.heading, text: CARD_WORDS.destroyed }];
    for (const cutPart of parts.slice(0, CARD_PARTS_MAXIMUM)) {
        if (cutPart.figure <= 0) continue;
        lines.push({
            kind: CARD_LINE.sub,
            label: getWordsForDestroyed(cutPart.key),
            stated: formatDestroyed(cutPart.key, cutPart.figure),
        });
    }
    return lines;
}

/**
 * What held: the sum a counter states with the defences it is made of under it, then what fired
 * on their side of somebody else's blow.
 */
function presentCardTakenLines(detail: RowDetail, translate: TranslateLabel | null): CardLine[] {
    const lines: CardLine[] = [...presentCardRawLine(detail.damageTakenRaw)];
    if (detail.damagePrevented > 0) {
        lines.push({
            kind: CARD_LINE.stat,
            label: CARD_WORDS.prevented,
            stated: formatFigure(detail.damagePrevented),
            isStrong: false,
            caveat: CAVEAT.reduction,
        });
        lines.push(
            ...presentCardPartsMergedByWord(detail.damagePreventedByDefence, translate).map((
                mergedPart,
            ): CardLine => ({
                kind: CARD_LINE.sub,
                label: mergedPart.label,
                stated: formatFigure(mergedPart.figure),
            })),
        );
    }
    lines.push(...presentCardProcLines(detail.procsWhenStruck, [], translate));
    return lines;
}

function presentCardNoteLines(subject: CardSubject, groups: readonly CardGroup[]): CardLine[] {
    const lines: CardLine[] = [...presentCaveatNoteLines(groups)];
    // This person's own, and nobody else's: a gap naming nobody stays under the list, where it
    // qualifies every row at once (`develop:ARCHITECTURE.md`). `develop ADR 0069`.
    for (const suspicion of formatRowSuspicions(subject.detail, subject.metric)) {
        if (suspicion.length === 0) continue;
        lines.push({
            kind: CARD_LINE.note,
            text: `${SUSPECT_MARK}${suspicion}`,
            tone: CARD_NOTE_TONE.suspect,
        });
    }
    // Last of the sentences and before the instruction, because it answers for every figure above
    // it rather than for one of them.
    if (subject.isRowNarrower) {
        lines.push({ kind: CARD_LINE.note, text: CARD_WORDS.scope, tone: CARD_NOTE_TONE.plain });
    }
    if (subject.doesOpen) {
        lines.push({ kind: CARD_LINE.note, text: CARD_WORDS.gesture, tone: CARD_NOTE_TONE.plain });
    }
    return lines;
}

/** In memory: a position that outlived a reload would open on a fight the page no longer holds. */
export function createScrollMemo(): ScrollMemo {
    const topByName = new Map<string, number>();
    return {
        getTop(name: string): number {
            const kept = topByName.get(name);
            if (kept === undefined) return 0;
            if (!Number.isFinite(kept)) return 0;
            if (kept < 0) return 0;
            return kept;
        },
        // A name nobody can look up again, or a position no region could be put at, is refused
        // rather than kept: what a bad one costs is the place a reader was at (**E12**).
        setTop(name: string, top: number): void {
            if (name.length === 0) return;
            if (!Number.isFinite(top)) return;
            if (top < 0) return;
            topByName.set(name, top);
            if (topByName.size <= LISTS_KEPT_MAXIMUM) return;
            const oldest = topByName.keys().next();
            if (!oldest.done) topByName.delete(oldest.value);
        },
    };
}

/** Null where what stands in the region is a slot, which does not scroll and holds no position. */
export function readTopOfList(region: PanelElement): number | null {
    if (!isRegionList(region)) return null;
    const top = region.scrollTop;
    if (!Number.isFinite(top)) return null;
    if (top < 0) return null;
    return top;
}

function isRegionList(region: PanelElement): boolean {
    return region.className.includes(CLASS.list);
}

/**
 * ⚠️ **A wheel turn belongs to the element it is turning**, so the rows are swapped under the
 * reader rather than the region replaced — and the style with them, since a list's own height is
 * written there and one left behind froze (`tests/ui/panel-scroll.test.ts`). False where either
 * side is not a list. `develop ADR 0052`.
 */
export function renderListRows(region: PanelElement, renderedList: PanelElement): boolean {
    if (!isRegionList(region)) return false;
    if (!isRegionList(renderedList)) return false;
    region.className = renderedList.className;
    region.setAttribute(STYLE_ATTRIBUTE, renderedList.getAttribute(STYLE_ATTRIBUTE) ?? "");
    region.replaceChildren(...Array.from(renderedList.children));
    return true;
}

/**
 * ⚠️ **A slot is left alone**, so a fold does not write a zero over the place a reader was at.
 * Measured on Chrome 152.0.7977.64, 2026-09-04: written straight after `replaceWith` the position
 * sticks, onto a replacement of the same height and onto a taller one.
 */
export function writeTopOfList(region: PanelElement, top: number): void {
    if (!Number.isFinite(top)) return;
    if (top < 0) return;
    if (!isRegionList(region)) return;
    region.scrollTop = top;
}
