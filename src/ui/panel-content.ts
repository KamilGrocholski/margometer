/**
 * One screen's worth of a fight: the rows, in the order they are drawn.
 *
 * A row's figure is the one the statistics already hold, and no figure here is ever recomputed
 * from the events. What this file does sum is what turns on who is on which side: the listed
 * side's total, and that side's share of what the protocol half-named. The statistics cannot hold
 * either, because nothing under `ui/` tells them the seat — and without them a share on a
 * one-side list would be measured against a whole the list does not show.
 */

import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { OUTCOME_RESULT, type OutcomeResult } from "#/src/core/battle-event.ts";
import { getRankedOrder } from "./ranked-order.ts";
import {
    type CombatantRoster,
    COMBATANTS_MAXIMUM,
    lookupCombatantIdByName,
} from "#/src/core/combatant-roster.ts";
import {
    type CombatantFigures,
    createCombatantFigures,
    CUT_MAXIMUM,
    type FightOutcome,
    type FightStatistics,
    type FightTotals,
    type FigureCut,
    type SkillFigures,
    SKILLS_MAXIMUM as SKILLS_KEPT_MAXIMUM,
} from "#/src/core/fight-statistics.ts";
import { parseInteger } from "#/libs/number-text.ts";
import {
    getDirectionForMetric,
    getNounForMetric,
    OPENED_PART,
    PANEL_DIRECTION,
    PANEL_METRIC,
    PANEL_NOUN,
    type PanelMetric,
    type PanelSideChoice,
    SIDE_CHOICE,
} from "./panel-screen.ts";
import {
    formatGrammarRefusedSuspicion,
    formatJoinedInProgressSuspicion,
    formatLostMessageSuspicion,
    formatNamesReachedByGap,
    formatNoParameterRowSuspicion,
    formatNoParameterSuspicion,
    formatShareRounded,
    formatSharesApportioned,
    formatUnknownKeyRowSuspicion,
    formatUnknownKeySuspicion,
    formatUnplacedHealRowSuspicion,
    formatUnplacedHealSuspicion,
    NAMED_ROWS_MAXIMUM,
} from "./panel-words.ts";

export interface PanelRow {
    combatantId: number;
    name: string | null;
    side: number | null;
    profession: string | null;
    figure: number;
    fill: number;
    shareText: string;
}

/**
 * **Numbers, and not one word.** A card is composed when a pointer opens it, so a fight redrawing
 * every few seconds pays for the twenty it draws rather than for twenty cards nobody looks at.
 *
 * Raw stands beside what was dealt and taken and is never taken from it: their difference is not
 * what a defence stopped, and the protocol reports neither armour nor resistance
 * (`src/core/fight-statistics.ts`).
 */
export interface RowDetail {
    level: number | null;
    damageDealt: number;
    damageTaken: number;
    /**
     * **The raw of the blows, and never the raw of the figure beside it.** The protocol states a
     * figure before reduction on a blow and nowhere else, while the figure beside it grows from
     * blows, from damage named against somebody and from health moving outside one. What the card
     * owes for drawing these is the label saying what they are a sum of (`src/ui/panel-words.ts`).
     */
    damageDealtRaw: number;
    damageTakenRaw: number;
    healthGiven: number;
    healthRestored: number;
    damagePrevented: number;
    blowsStruck: number;
    blowsWithoutSkill: number;
    /** What their announcements came to, which is a count of announcements and not of blows. */
    skillUses: number;
    /** The turns they took, which no figure on the card is divided by (`develop ADR 0048`). */
    turnsTaken: number;
    /**
     * The turns they were granted and spent on nothing, which the game states (`develop ADR 0049`).
     */
    turnsLost: number;
    /**
     * Whether a lost turn was heard **anywhere in this fight**, which is what says the figure above
     * is a measurement rather than a reading that found nothing. The announcement is read by the
     * shape of a sentence, so a world wording it otherwise yields nought for everybody
     * (`docs/turns-taken.md`), and a nought drawn there would be **E6**'s substitute for a
     * read that never worked. A combatant of their own lost turn carries it true.
     * `develop ADR 0110`.
     */
    wasTurnLostRead: boolean;
    damageDealtToNobody: number;
    damageTakenFromNobody: number;
    healthRestoredByNobody: number;
    /** Blows that landed critically, against `blowsStruck`, which is what a rate is taken of. */
    blowsCritical: number;
    /**
     * The four cuts a card draws, each already in the order it is drawn in. **Readings rather than
     * the maps they were read off**: a card handed the statistics' own map could write into the
     * figures it is drawing.
     */
    procsWhenStriking: readonly CutPart[];
    procsWhenStruck: readonly CutPart[];
    damagePreventedByDefence: readonly CutPart[];
    /** The part of `damageDealt` and `damageTaken` a pool took rather than health (ADR 0012). */
    damageDealtAbsorbedByDefence: readonly CutPart[];
    damageTakenAbsorbedByDefence: readonly CutPart[];
    statisticsDestroyed: readonly CutPart[];
    /** Every legendary bonus that showed itself on them, fired and held alike, under its key. */
    legendaryBonuses: readonly CutPart[];
    /** Somebody else's bonuses that acted on them, under the key, how many times (ADR 0032). */
    legendaryBonusesReached: readonly CutPart[];
    /**
     * This person's own share of the fight's two suspicions, which is what puts a mark on their row
     * rather than under the whole list (`src/core/fight-statistics.ts` says why neither sums to
     * the fight's own count).
     */
    unreadMessagesUnknownKey: number;
    unreadMessagesNoParameter: number;
    sideHealsUnsized: number;
}

/**
 * One part of a cut, under the protocol's own key. What a reader is shown for that key is the
 * panel's to say and never this file's, the way an element's token reaches `ElementRow`.
 */
export interface CutPart {
    key: string;
    figure: number;
}

/** A row with somebody behind it, wherever it stands: the ranking, an end, or an opened skill. */
export interface PersonRow extends PanelRow {
    detail: RowDetail;
}

export type RankingRow = PersonRow;

export const UNNAMED_END = { actor: "actor", target: "target" } as const;
export type PanelUnnamedEnd = VocabularyWord<typeof UNNAMED_END>;

/**
 * Where a figure the protocol half-named stands against the ranking above it, and there are two
 * answers because there are two situations:
 *
 * - `apart` — no ranked row holds these points, so the figure joins the whole the screen divides
 *   by and takes a share of it like any row.
 * - `cut` — the rows hold the points already but cannot say this about them. The figure is a
 *   slice of what is on screen, so it states a share and adds nothing to the whole.
 */
export const PINNED_PLACING = { apart: "apart", cut: "cut" } as const;
export type PinnedPlacing = VocabularyWord<typeof PINNED_PLACING>;

/**
 * The five figures the protocol can leave half-named, one name each — and the name is the key
 * every table about these rows is written on.
 *
 * **Five and not eight.** A screen states a figure for one end, so `healthGiven` has no target to
 * leave out and `healthRestored` no second end at all. Keyed by the screen and the end instead,
 * three of the eight cells would be sentences nobody can reach, and a table with holes in it is
 * one nobody can reuse.
 */
export const PINNED_CASE = {
    dealtWithNoActor: "dealtWithNoActor",
    givenWithNoActor: "givenWithNoActor",
    takenWithNoActor: "takenWithNoActor",
    takenWithNoTarget: "takenWithNoTarget",
    restoredWithNoActor: "restoredWithNoActor",
} as const;
export type PinnedCase = VocabularyWord<typeof PINNED_CASE>;

/** The end the game **did** name, as the per-combatant figure that end carries. */
const HALF_NAMED_FIELD = {
    damageTakenFromNobody: "damageTakenFromNobody",
    damageDealtToNobody: "damageDealtToNobody",
    healthRestoredByNobody: "healthRestoredByNobody",
} as const;
type HalfNamedField = VocabularyWord<typeof HALF_NAMED_FIELD>;

/** The fight-wide figure a screen keeps off every combatant's row, as the statistics hold it. */
const HALF_NAMED_TOTAL_FIELD = {
    damageDealtByNobody: "damageDealtByNobody",
    damageTakenByNobody: "damageTakenByNobody",
    healthGivenByNobody: "healthGivenByNobody",
    healthRestoredToNobody: "healthRestoredToNobody",
} as const;
type HalfNamedTotalField = VocabularyWord<typeof HALF_NAMED_TOTAL_FIELD>;

/** And the same figure cut by the key it was stated under, which is what it was dealt with. */
const HALF_NAMED_KIND_FIELD = {
    damageTakenFromNobodyByKind: "damageTakenFromNobodyByKind",
    damageDealtToNobodyByKind: "damageDealtToNobodyByKind",
    healthRestoredByNobodyByKey: "healthRestoredByNobodyByKey",
} as const;
type HalfNamedKindField = VocabularyWord<typeof HALF_NAMED_KIND_FIELD>;

interface PinnedShape {
    metric: PanelMetric;
    end: PanelUnnamedEnd;
    placing: PinnedPlacing;
    field: HalfNamedField;
    kinds: HalfNamedKindField;
}

/**
 * The part of a screen's figure that reached no row at all. It takes no place in the ranking and
 * wears the hatch every such row wears (`DESIGN.md`), and it has no card of its own to
 * open: what it is made of is the one thing nobody can state, which is what makes it this row.
 */
export interface OutsideRankingRow {
    figure: number;
    fill: number;
    shareText: string;
}

export interface PinnedRow {
    case: PinnedCase;
    end: PanelUnnamedEnd;
    placing: PinnedPlacing;
    figure: number;
    fill: number;
    shareText: string;
    /**
     * What the figure was dealt with, as the card over the row states it before anybody presses
     * it. The same cut the level under the row draws, from the same walk, so the two cannot
     * disagree. `develop ADR 0041`.
     */
    kinds: ElementCut;
}

/** One person under a pinned row: the end the game named, and what it carries of that figure. */
export type HalfNamedRow = PersonRow;

/**
 * What stands under a pinned row — the end the game **did** name, person by person, and the part
 * of the figure naming neither end where there is one.
 *
 * Every row on it opens onto the other cut of the same fold, and what opens is
 * `docs/drill-levels.md`'s to state.
 */
export interface UnnamedLevelContent {
    case: PinnedCase;
    end: PanelUnnamedEnd;
    total: number;
    rows: HalfNamedRow[];
    /**
     * What the figure was dealt with — the one question a row naming nobody can still answer, and
     * the reason it is worth opening at all where the level above lists a single person.
     */
    kinds: ElementCut;
    /**
     * The part of the figure that named **neither** end — inside the count above it and on nobody's
     * row, so a section without it falls short of what it is a cut of.
     */
    neitherEnd: UnnamedRow | null;
}

/** Which row of a pinned level a reader pressed. The two shapes that level draws, and no third. */
export const HALF_NAMED_OPENED = { person: "person", element: "element" } as const;

export type HalfNamedOpened =
    | { kind: typeof HALF_NAMED_OPENED.person; combatantId: number }
    | { kind: typeof HALF_NAMED_OPENED.element; element: string };

/**
 * What stands under one row of a pinned level: a person's own keys, or a key's own people. The two
 * are the same fold read the two ways round, which is why neither opens any further.
 */
export type UnnamedCutLevelContent =
    | {
        opened: typeof HALF_NAMED_OPENED.person;
        case: PinnedCase;
        row: HalfNamedRow;
        total: number;
        kinds: ElementCut;
    }
    | {
        opened: typeof HALF_NAMED_OPENED.element;
        case: PinnedCase;
        element: string;
        end: PanelUnnamedEnd;
        total: number;
        rows: HalfNamedRow[];
        /** A key may carry part of what named neither end, and that part is on nobody's row. */
        neitherEnd: UnnamedRow | null;
    };

/**
 * When a fight was, on the reader's own clock. The month is stated the way a person counts them,
 * from one, because the word for it is looked up by what it is called and not by an offset.
 */
export interface FightMoment {
    day: number;
    month: number;
    hour: number;
    minute: number;
}

/** The reader's own character, as the fight's combatant keyed by the hero's id states it. */
export interface FightReader {
    name: string;
    profession: string | null;
    level: number | null;
}

/**
 * What pointing at a fight says, over the ranking or on a shelf row (ADR 0014): the runtime reads
 * it once for both, and a field it could not read is null rather than a word saying so.
 */
export interface FightCardContent {
    sizes: readonly number[];
    unplaced: number;
    outcome: OutcomeResult | null;
    isLive: boolean;
    at: FightMoment | null;
    place: string | null;
    world: string | null;
    reader: FightReader | null;
    /** What is short about the whole fight, said on the card in the sentences under a ranking. */
    suspicions: string[];
    /**
     * A kept fight its payloads no longer read: when it was, where and its pin, and nothing a
     * reading would have said. Its row opens nothing — the screen a fight that will not read
     * stands on draws no shelf to come back by (ADR 0046).
     */
    isUnread: boolean;
}

export interface ShelfRow {
    /** Null on the live row alone, where the clock gave its fight no moment: nothing kept it. */
    openedAt: number | null;
    at: FightMoment | null;
    sizes: number[];
    place: string | null;
    outcome: OutcomeResult | null;
    isLive: boolean;
    isChosen: boolean;
    isPinned: boolean;
    /**
     * Whether there is anything to pin. A fight nothing has written down yet is not in the store
     * and the rotation has never seen it, so a pin on it would be a control that does nothing —
     * which is worse than one that is not there. It is not the same as *not live*: a fight is
     * both for as long as the gap between it ending and the next one starting.
     */
    isPinnable: boolean;
    /** Its `suspicions` put a mark on the row, and its `isUnread` leaves the row opening nothing. */
    card: FightCardContent;
}

export interface ScreenContent {
    rows: RankingRow[];
    outcome: OutcomeResult | null;
    sizes: number[];
    unplaced: number;
    total: number;
    pinned: PinnedRow[];
    /**
     * What the screen's own count holds that no row of it does. Null where there is none, which is
     * every reading `captures/` produces — it is drawn by a probe and by nothing else
     * today.
     */
    outsideRanking: OutsideRankingRow | null;
    suspicions: string[];
    /**
     * Whether two counts of one figure came out different — a drawn figure that is wrong rather
     * than short, which nothing else here can say. The entry turns it into a defect.
     * `develop ADR 0051`.
     */
    hasFiguresDisagreed: boolean;
    sides: PanelSides | null;
    rowsVisibleCount: number;
}

/** What is short about the reading rather than about a figure on it. The session states both. */
export interface FightSuspicions {
    messagesLost: number;
    hasJoinedInProgress: boolean;
    /**
     * How many messages the reading did take, which is what the two counts above are out of.
     * The lost ones are not among them, so what the payloads stated is the two added up.
     */
    messagesRead: number;
}

interface UnsharedRow {
    combatantId: number;
    name: string | null;
    side: number | null;
    profession: string | null;
    figure: number;
}

/** One person under a pinned figure, before anything has been said about how they are drawn. */
interface HalfNamedPart {
    combatantId: number;
    figure: number;
}

/**
 * What stands under a pinned row, composed only when a reader asks for it. Null where that row is
 * not on the screen at all — a figure of nothing is not pinned, so there is nothing to open.
 *
 * The rows are the same walk the pinned figure was summed from, so the section totals the figure
 * over it by construction rather than by a second count agreeing with the first.
 */
interface HalfNamedListing {
    parts: HalfNamedPart[];
    sideListed: SideRelation | null;
}

/** Null without a seat: two sides nothing can tell apart are not two figures. */
export interface PanelSides {
    reader: number;
    opposing: number;
    nobody: number;
}

/** Which part of the bar a figure belongs to. `nobody` is a refusal, never a third side. */
export const SIDE_RELATION = { reader: "reader", opposing: "opposing", nobody: "nobody" } as const;
export type SideRelation = VocabularyWord<typeof SIDE_RELATION>;

export interface ElementRow {
    /** The client's own token. What a reader is shown for it is the panel's, not the reading's. */
    element: string;
    doesOpenPart: boolean;
    figure: number;
    fill: number;
    shareText: string;
}

export interface UnnamedRow {
    figure: number;
    fill: number;
    shareText: string;
}

/**
 * What a row of a cut stands for: what an announcement called it, the key the protocol wrote it
 * under, or the kind the blows carried. A discriminant rather than a name that may be any of the
 * three, because they are worded from different tables — `heal` is in the gain table and the loss
 * table both, and named from the wrong one it reads as a kind of damage.
 */
export type NamedPart =
    | { kind: typeof OPENED_PART.skill; name: string }
    | { kind: typeof OPENED_PART.source; source: string }
    | { kind: typeof OPENED_PART.element; element: string };

/**
 * A part a reader can open, which is the named ones and the row closing a damage section. Kept as a
 * union rather than a fourth member of `NamedPart`: what that type is for is a part the **game**
 * named, and the closing row is the one that stands for what it named nothing about.
 * `develop ADR 0081`.
 */
export type OpenedPart = NamedPart | { kind: typeof OPENED_PART.plain };

export interface SkillRow {
    part: NamedPart;
    doesOpenPart: boolean;
    /**
     * How many times it was announced, and null where a count would be a claim the protocol
     * never makes — the section below says under which heading that happens.
     */
    uses: number | null;
    figure: number;
    fill: number;
    shareText: string;
}

/**
 * It carries a count where the rows above it carry one, because that is the question a plain
 * attack raises and the figure alone cannot answer it.
 */
export interface PlainRow {
    /** Null where nothing is counted: only a blow is counted, and health moving is not one. */
    blows: number | null;
    figure: number;
    fill: number;
    shareText: string;
}

/**
 * The row a section closes against, which takes a place among the rows above it — and the reason
 * it is a type of its own is that the row summing a bound must not. A shared shape with a nullable
 * place left the null on the wrong row unreadable and the wrong number on it unwritable only by
 * agreement; here the compiler holds both. `develop ADR 0079`.
 */
export interface ClosingRow extends PlainRow {
    /** Where its figure puts it among the rows that take one. */
    rank: number;
    /** Whether pressing it opens the cut of whoever stood at the other end (`develop ADR 0081`). */
    doesOpenPart: boolean;
}

export interface SkillCut {
    rows: SkillRow[];
    /**
     * Whether the rows above came to **more** than the figure they are a cut of, which is the one
     * thing a section can say about a drawn figure being wrong rather than short. The row closing
     * it is a remainder, so an over-count arrives as a remainder below nothing — and a bar cannot
     * be drawn at less than nothing, so the figure is clamped and this carries what the clamp
     * hid. `develop ADR 0051` is why it is a defect rather than an assertion.
     */
    hasFiguresDisagreed: boolean;
    /**
     * ⚠️ **What would not fit, summed — and never folded into the row below it.** A section is
     * bounded because it is drawn (**S11**), and a part past that bound is one the game **did**
     * name. Left out of the rows it landed in `plain`, which says the game announced nothing: a
     * figure moved from a true claim to a false one by a display bound. `develop ADR 0055`.
     */
    rest: PlainRow | null;
    closing: ClosingRow | null;
}

/**
 * The card stands over this row too, so the row carries what the card states — the same figures
 * the ranking's own row holds, because the card is about the person and not about the cut.
 */
export interface OtherEndRow extends PersonRow {
    doesOpenPair: boolean;
}

export interface OtherEndCut {
    rows: OtherEndRow[];
    halfNamed: OpponentUnnamedRow | null;
    /**
     * A cut keyed by something that is no id, which core never writes and which is passed over
     * rather than named, or one whose rows hold more than the figure over them. Carried out so the
     * entry turns it into a defect (**E12**).
     */
    hasFiguresDisagreed: boolean;
}

/** The end the protocol left out of an opened figure, which opens onto that person's own keys. */
export interface OpponentUnnamedRow extends UnnamedRow {
    doesOpenPair: boolean;
    /**
     * What the figure was dealt with, and null wherever the level under the row is not kept: the
     * card states it only as that level seen early (ADR 0034).
     */
    kinds: ElementCut | null;
}

export interface ElementCut {
    rows: ElementRow[];
    /**
     * What a fold could not give a key of its own to, summed — never the row below it, which
     * is what the protocol stated no kind of at all. `develop ADR 0055`.
     */
    rest: UnnamedRow | null;
    noKind: UnnamedRow | null;
}

/** The same, plus the row that closes a section against the figure over it. */
export type PairPart = NamedPart | { kind: typeof OPENED_PART.plain };

/** No count, whichever kind it is, and the section below says why one would be wrong. */
export interface PairPartRow {
    part: PairPart;
    figure: number;
    fill: number;
    shareText: string;
}

/**
 * The last rung. Nothing on it opens, in any screen: the protocol states no further cut of a pair
 * than what one of them announced, the key it moved under, and the kinds those blows carried.
 *
 * The parts are **one** list because they are drawn as one section, and a section accounts for the
 * whole of the figure over it. Two lists would be two columns of shares each coming to some part
 * of a hundred, and sorted apart they would put a large row under a small one.
 */
export interface PairLevelContent {
    combatantId: number;
    otherId: number;
    otherName: string | null;
    otherProfession: string | null;
    total: number;
    parts: PairPartRow[];
    byElement: ElementCut;
    /** The answer `SkillCut` states, for the section the parts are: clamped, and carried out. */
    hasFiguresDisagreed: boolean;
}

/**
 * The other last rung, and every kind of row in a cut reaches it: whom one skill, one key or one
 * kind of a figure reached, person by person. It is the column the section it was opened from
 * does not have — a name folds every caster's announcement into one row, and this says which of
 * them it came from.
 */
export interface PartLevelContent {
    part: OpenedPart;
    total: number;
    byOtherEnd: OtherEndCut;
    /** The answer its cut states, where the part is the level a reader opened. */
    hasFiguresDisagreed: boolean;
}

export interface OpenedLevelContent {
    combatantId: number;
    name: string | null;
    profession: string | null;
    byOtherEnd: OtherEndCut;
    /**
     * What the figure was done with: the skill announced ahead of it, on every screen whose
     * movement an announcement can ride.
     */
    bySkill: SkillCut;
    byElement: ElementCut;
    total: number;
    /** The answer `SkillCut` states, where the level that holds it is the one a reader opened. */
    hasFiguresDisagreed: boolean;
}

interface MetricCuts {
    byOtherEnd: FigureCut;
    /** Null on the one screen whose second cut would word a figure with somebody else's cause. */
    byElement: FigureCut | null;
}

/**
 * A fold that may meet its bound: the parts it kept a row for, and the figure of everything past
 * it. The rest is carried rather than dropped, so what is drawn still comes to the figure over it.
 */
interface FoldedParts {
    parts: UnsharedPart[];
    rest: number;
}

interface UnsharedPart {
    part: NamedPart;
    /**
     * How many times it was announced, and null where a count would be a claim the protocol
     * never makes — `SkillRow` says under which heading that happens.
     */
    uses: number | null;
    figure: number;
}

/** The same row once the level under it has been composed and counted. */
interface UnsharedSkill extends UnsharedPart {
    doesOpenPart: boolean;
}

interface UnsharedPairPart {
    part: PairPart;
    figure: number;
}

/** A row for everybody a fight holds, counted off the roster rather than typed beside it. */
const ROWS_MAXIMUM = COMBATANTS_MAXIMUM;
/**
 * As many parts as the widest cut a card draws — the kinds, the defences, the procs — which is
 * the cut `src/core/fight-statistics.ts` keeps. A fold over several people's cuts is held to it
 * too, and sums what it will not give a row to.
 */
export const CUT_PARTS_MAXIMUM = CUT_MAXIMUM;
/**
 * The names a fold of the skills that reached one receiver gives rows to, past which the figure
 * is summed into one row (`develop ADR 0055`): the skills a fight keeps, which is
 * `src/core/fight-statistics.ts`'s bound.
 */
export const SKILLS_MAXIMUM = SKILLS_KEPT_MAXIMUM;
/**
 * The ranking's height, in bars. Ten is the most one side fields and eleven the most a whole fight
 * does, measured over the 37 recordings of `captures/` on 2026-10-06. A bigger
 * fight scrolls rather than growing the window: a ranking is watched while a fight is on, and a
 * height that changed as combatants joined would move it under the reader's hand.
 */
export const RANKING_ROWS = 11;
const SIDE_ROWS = 10;

/**
 * What each of the five is. **The one place the four answers are decided together**, so a screen
 * cannot acquire an end it states no figure for, and a standing cannot drift from the end it was
 * chosen for.
 *
 * `field` is what both the figure and the level under it are read off, and `kinds` is the same
 * figure cut by the key it was stated under. `src/core/fight-statistics.ts` asserts the three
 * fields total the fight's own counts and each cut totals its own field — which is what lets a
 * pinned row be summed from what stands under it rather than beside it, twice over.
 */
const PINNED_SHAPES: Record<PinnedCase, PinnedShape> = {
    dealtWithNoActor: {
        metric: PANEL_METRIC.damageDealt,
        end: UNNAMED_END.actor,
        placing: PINNED_PLACING.apart,
        field: HALF_NAMED_FIELD.damageTakenFromNobody,
        kinds: HALF_NAMED_KIND_FIELD.damageTakenFromNobodyByKind,
    },
    givenWithNoActor: {
        metric: PANEL_METRIC.healthGiven,
        end: UNNAMED_END.actor,
        placing: PINNED_PLACING.apart,
        field: HALF_NAMED_FIELD.healthRestoredByNobody,
        kinds: HALF_NAMED_KIND_FIELD.healthRestoredByNobodyByKey,
    },
    takenWithNoActor: {
        metric: PANEL_METRIC.damageTaken,
        end: UNNAMED_END.actor,
        placing: PINNED_PLACING.cut,
        field: HALF_NAMED_FIELD.damageTakenFromNobody,
        kinds: HALF_NAMED_KIND_FIELD.damageTakenFromNobodyByKind,
    },
    takenWithNoTarget: {
        metric: PANEL_METRIC.damageTaken,
        end: UNNAMED_END.target,
        placing: PINNED_PLACING.apart,
        field: HALF_NAMED_FIELD.damageDealtToNobody,
        kinds: HALF_NAMED_KIND_FIELD.damageDealtToNobodyByKind,
    },
    restoredWithNoActor: {
        metric: PANEL_METRIC.healthRestored,
        end: UNNAMED_END.actor,
        placing: PINNED_PLACING.cut,
        field: HALF_NAMED_FIELD.healthRestoredByNobody,
        kinds: HALF_NAMED_KIND_FIELD.healthRestoredByNobodyByKey,
    },
};

/** In the order the screens pin them, which is the order a screen's two are drawn in. */
export const PINNED_CASES = Object.values(PINNED_CASE);

/**
 * The one fight-wide figure each screen keeps off every combatant's row. Three of them already
 * reach a pinned row standing apart, so under everybody they are inside the count twice over —
 * once here and once as that row — and the two are held to each other by `hasPinnedTotalDisagreed`.
 * The fourth reaches no row at all, which is what the section under the list is for.
 */
const HALF_NAMED_TOTAL_FIELD_BY_METRIC: Record<PanelMetric, HalfNamedTotalField> = {
    damageDealt: HALF_NAMED_TOTAL_FIELD.damageDealtByNobody,
    damageTaken: HALF_NAMED_TOTAL_FIELD.damageTakenByNobody,
    healthGiven: HALF_NAMED_TOTAL_FIELD.healthGivenByNobody,
    healthRestored: HALF_NAMED_TOTAL_FIELD.healthRestoredToNobody,
};

/**
 * Which of the five an opened row's own end-left-out is a part of: the figure stands on that
 * person's row, cut by key, whichever screen pins it. Healing given keeps no health given to
 * nobody, so its row stays shut.
 */
const OPENED_UNNAMED_CASES: Record<PanelMetric, PinnedCase | null> = {
    damageDealt: PINNED_CASE.takenWithNoTarget,
    damageTaken: PINNED_CASE.takenWithNoActor,
    healthGiven: null,
    healthRestored: PINNED_CASE.restoredWithNoActor,
};

export const NOTHING_SUSPECT: FightSuspicions = {
    messagesLost: 0,
    hasJoinedInProgress: false,
    messagesRead: 0,
};

/** The list below is the bound, not anything a fight can do. */
const WARNINGS_MAXIMUM = 6;
/** And a row carries the three of the six that can be charged to one person. */
const ROW_WARNINGS_MAXIMUM = 3;

export function getEndForPinned(pinnedCase: PinnedCase): PanelUnnamedEnd {
    return PINNED_SHAPES[pinnedCase].end;
}

export function getMetricForPinned(pinnedCase: PinnedCase): PanelMetric {
    return PINNED_SHAPES[pinnedCase].metric;
}

/**
 * Which of the five a screen and an end come to, or nothing where that screen pins no such end.
 * Null is the answer a press deserves: a mark left over from another screen names no figure here,
 * and opening the screen's other end instead would be a level about something else.
 */
export function lookupPinnedCase(metric: PanelMetric, end: PanelUnnamedEnd): PinnedCase | null {
    const pinnedCases = PINNED_CASES.filter((pinnedCase) => {
        const shape = PINNED_SHAPES[pinnedCase];
        if (shape.metric !== metric) return false;
        return shape.end === end;
    });
    return pinnedCases[0] ?? null;
}

/**
 * What this row's own figure is short of, as sentences a reader can act on.
 *
 * The screen decides which of the three are owed for the same reason it decides the fight's own:
 * a cast nobody could place puts back health, so saying it beside a damage figure would be a
 * suspicion over a figure that cannot carry it. Composed on demand, like a card's other words.
 * A message the grammar refused named nobody, so no row is ever short of one.
 */
export function formatRowSuspicions(detail: RowDetail, metric: PanelMetric): string[] {
    const said = [
        formatUnknownKeyRowSuspicion(detail.unreadMessagesUnknownKey),
        formatNoParameterRowSuspicion(detail.unreadMessagesNoParameter),
    ];
    if (getNounForMetric(metric) === PANEL_NOUN.healing) {
        said.push(formatUnplacedHealRowSuspicion(detail.sideHealsUnsized));
    }
    return said.filter((sentence) => sentence.length > 0).slice(0, ROW_WARNINGS_MAXIMUM);
}

/**
 * Whether the row wears the mark, which is the same question `formatRowSuspicions` answers and
 * asked without composing a sentence: this runs per row per redraw and that runs when a pointer
 * stops on one.
 */
export function isRowSuspect(detail: RowDetail, metric: PanelMetric): boolean {
    if (detail.unreadMessagesUnknownKey > 0) return true;
    if (detail.unreadMessagesNoParameter > 0) return true;
    if (getNounForMetric(metric) !== PANEL_NOUN.healing) return false;
    return detail.sideHealsUnsized > 0;
}

export function presentUnnamedLevel(
    statistics: FightStatistics,
    roster: CombatantRoster,
    pinnedCase: PinnedCase,
    choice: PanelSideChoice,
    readerSide: number | null,
): UnnamedLevelContent | null {
    const { parts, sideListed } = composeHalfNamedListing(
        statistics,
        roster,
        pinnedCase,
        choice,
        readerSide,
    );
    const total = tallyPinnedFigure(statistics, pinnedCase, parts, sideListed);
    if (total <= 0) return null;
    const neither = getNeitherEndForPinned(statistics, pinnedCase, sideListed);
    const largest = getLargestFigure([
        ...parts.map((halfNamedPart) => halfNamedPart.figure),
        neither,
    ]);
    const shares = formatSharesApportioned([
        ...parts.map((halfNamedPart) => halfNamedPart.figure),
        neither,
    ], total);
    return {
        case: pinnedCase,
        end: getEndForPinned(pinnedCase),
        total,
        rows: composeHalfNamedRows(statistics, roster, parts, shares, largest),
        kinds: composeHalfNamedKinds(statistics, pinnedCase, parts, neither, total),
        neitherEnd: neither <= 0 ? null : {
            figure: neither,
            fill: getBarFill(neither, largest),
            shareText: shares[parts.length] ?? "",
        },
    };
}

/**
 * Who stands under a pinned row on the list as it is narrowed — read once here, so the row, the
 * level and the level under **that** are three drawings of one walk rather than three walks.
 */
function composeHalfNamedListing(
    statistics: FightStatistics,
    roster: CombatantRoster,
    pinnedCase: PinnedCase,
    choice: PanelSideChoice,
    readerSide: number | null,
): HalfNamedListing {
    const metric = getMetricForPinned(pinnedCase);
    const listed = composeRowsBeforeShares(statistics, roster, metric).filter((row) =>
        isSideListed(row.side, choice, readerSide)
    );
    const sideListed = getSideRelationListed(choice, readerSide);
    return {
        parts: composeHalfNamedParts(
            statistics,
            roster,
            pinnedCase,
            listed,
            sideListed,
            readerSide,
        ),
        sideListed,
    };
}

function composeRowsBeforeShares(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
): UnsharedRow[] {
    const rows: UnsharedRow[] = [];
    const seen = new Set<number>();
    for (const [combatantId, figures] of statistics.byCombatantId) {
        seen.add(combatantId);
        const combatant = roster.byId.get(combatantId);
        rows.push({
            combatantId,
            name: combatant?.name ?? null,
            side: combatant?.side ?? null,
            profession: combatant?.profession ?? null,
            figure: getFigureForMetric(figures, metric),
        });
    }
    for (const combatant of roster.byId.values()) {
        if (seen.has(combatant.id)) continue;
        rows.push({
            combatantId: combatant.id,
            name: combatant.name,
            side: combatant.side,
            profession: combatant.profession,
            figure: 0,
        });
    }
    return rows;
}

function getFigureForMetric(figures: FightTotals, metric: PanelMetric): number {
    const figure = figures[metric];
    return figure;
}

/**
 * A combatant with no side belongs to neither, so a one-side list leaves them out rather than
 * putting them on the side that happens to be showing; they are drawn under everybody, where
 * saying nothing about their side costs nothing. With no seat to read from, every list is
 * everybody: a filter that cannot tell the two apart is a filter that would guess.
 */
function isSideListed(
    side: number | null,
    choice: PanelSideChoice,
    readerSide: number | null,
): boolean {
    if (choice === SIDE_CHOICE.everyone) return true;
    if (readerSide === null) return true;
    if (side === null) return false;
    if (choice === SIDE_CHOICE.reader) return side === readerSide;
    return side !== readerSide;
}

/**
 * Which part of the strip a list is showing, or nothing where it is showing everybody. With no
 * seat to read from, every list is everybody: `isSideListed` answers that way and this has to
 * answer the same, or a figure would be charged to a side no row was filtered by.
 */
function getSideRelationListed(
    choice: PanelSideChoice,
    readerSide: number | null,
): SideRelation | null {
    if (choice === SIDE_CHOICE.everyone) return null;
    if (readerSide === null) return null;
    if (choice === SIDE_CHOICE.reader) return SIDE_RELATION.reader;
    return SIDE_RELATION.opposing;
}

/**
 * The end the game **did** name, person by person — **one walk, read by both the pinned row and
 * the level under it**, so a figure and what stands beneath it cannot disagree. Which field is
 * walked is `PINNED_SHAPES`', and which people are kept turns on the standing:
 *
 * - `cut` — the rows the list is showing, because on those screens the listed row **is** the named
 *   end. No inference is involved.
 * - `apart` under one side — whoever the strip charges that side with, which is develop ADR 0013's
 *   rule read through `getSideRelationCharged`. There is one copy of it, and the strip reads the
 *   same one.
 * - `apart` under everybody — everyone the statistics hold.
 *
 * What names **neither** end is on nobody's row and is added by the caller, never here.
 */
function composeHalfNamedParts(
    statistics: FightStatistics,
    roster: CombatantRoster,
    pinnedCase: PinnedCase,
    rows: readonly UnsharedRow[],
    sideListed: SideRelation | null,
    readerSide: number | null,
): HalfNamedPart[] {
    const shape = PINNED_SHAPES[pinnedCase];
    const listed = new Set(rows.map((unsharedRow) => unsharedRow.combatantId));
    const halfNamedParts: HalfNamedPart[] = [];
    for (const [combatantId, figures] of statistics.byCombatantId) {
        const figure = figures[shape.field];
        if (figure <= 0) continue;
        const sideRelation = getSideRelation(
            roster.byId.get(combatantId)?.side ?? null,
            readerSide,
        );
        if (!isPinnedPersonKept(shape, sideRelation, listed.has(combatantId), sideListed)) continue;
        halfNamedParts.push({ combatantId, figure });
    }
    return halfNamedParts;
}

/** The three rules the paragraph above states, as the one condition each of them is. */
function isPinnedPersonKept(
    shape: PinnedShape,
    sideRelation: SideRelation,
    isListed: boolean,
    sideListed: SideRelation | null,
): boolean {
    if (shape.placing === PINNED_PLACING.cut) return isListed;
    if (sideListed === null) return true;
    return getSideRelationCharged(sideRelation, shape.metric) === sideListed;
}

/**
 * Which side is charged with a figure the protocol left half-named — **the one inference this
 * panel draws, and the only place it draws one. develop ADR 0013.**
 *
 * The known end is a side: the roster places the row the message did name. The unknown end is
 * derived from it, and the derivation is the noun's — damage crosses, healing does not. What is
 * never derived is a **name**: the pinned rows go on saying which end the game left out.
 */
function getSideRelationCharged(sideRelation: SideRelation, metric: PanelMetric): SideRelation {
    if (sideRelation === SIDE_RELATION.nobody) return sideRelation;
    if (metric === PANEL_METRIC.healthGiven) return sideRelation;
    if (metric === PANEL_METRIC.healthRestored) return sideRelation;
    return sideRelation === SIDE_RELATION.reader ? SIDE_RELATION.opposing : SIDE_RELATION.reader;
}

/**
 * What the pinned figure comes to: the sum of the level under it, and what named neither end where
 * that is inside the same count.
 *
 * Only damage can name neither end, and only a figure standing `apart` holds it: a `cut` is summed
 * over rows the list already draws, and nobody's row is not one of them. Under one side it drops
 * out too — `getSideRelationCharged` charges from a row, and there is no row to charge from.
 */
function tallyPinnedFigure(
    statistics: FightStatistics,
    pinnedCase: PinnedCase,
    parts: readonly HalfNamedPart[],
    sideListed: SideRelation | null,
): number {
    let total = 0;
    for (const halfNamedPart of parts) total += halfNamedPart.figure;
    total += getNeitherEndForPinned(statistics, pinnedCase, sideListed);
    return total;
}

function getNeitherEndForPinned(
    statistics: FightStatistics,
    pinnedCase: PinnedCase,
    sideListed: SideRelation | null,
): number {
    const shape = PINNED_SHAPES[pinnedCase];
    if (sideListed !== null) return 0;
    if (shape.placing === PINNED_PLACING.cut) return 0;
    if (getNounForMetric(shape.metric) === PANEL_NOUN.healing) return 0;
    return statistics.damageByNeitherEnd;
}

function getLargestFigure(figures: readonly number[]): number {
    let largest = 0;
    for (const figure of figures) {
        if (figure > largest) largest = figure;
    }
    return largest;
}

/** Ranked the way every list here is: by the figure, then by the name beside it. */
function composeHalfNamedRows(
    statistics: FightStatistics,
    roster: CombatantRoster,
    parts: readonly HalfNamedPart[],
    shares: readonly string[],
    largest: number,
): HalfNamedRow[] {
    const rows = parts.map((halfNamedPart, partIndex): HalfNamedRow => {
        const combatant = roster.byId.get(halfNamedPart.combatantId);
        return {
            combatantId: halfNamedPart.combatantId,
            name: combatant?.name ?? null,
            side: combatant?.side ?? null,
            profession: combatant?.profession ?? null,
            figure: halfNamedPart.figure,
            fill: getBarFill(halfNamedPart.figure, largest),
            shareText: shares[partIndex] ?? "",
            detail: composeRowDetailFor(statistics, roster, halfNamedPart.combatantId),
        };
    });
    rows.sort((leftRow, rightRow) =>
        getRankedOrder(
            leftRow.figure,
            rightRow.figure,
            leftRow.name ?? "",
            rightRow.name ?? "",
        )
    );
    // No bound of its own: a part is one combatant's row, and `core/fight-statistics.ts` holds a
    // fight's rows inside `COMBATANTS_MAXIMUM`.
    return rows;
}

function getBarFill(figure: number, largest: number): number {
    if (largest <= 0) return 0;
    return figure / largest;
}

/**
 * The card's figures for one combatant, wherever their row stands. Somebody the statistics never
 * saw is handed an empty set rather than nothing: they are on the roster and did nothing, which is
 * a reading.
 */
function composeRowDetailFor(
    statistics: FightStatistics,
    roster: CombatantRoster,
    combatantId: number,
): RowDetail {
    return composeRowDetail(
        statistics.byCombatantId.get(combatantId) ?? createCombatantFigures(),
        roster.byId.get(combatantId)?.level ?? null,
        wasAnyTurnLost(statistics),
        statistics.legendaryBonuses.byHolderId.get(combatantId) ?? new Map(),
        statistics.legendaryBonuses.byReachedId.get(combatantId) ?? new Map(),
    );
}

/**
 * Everything a row can say on demand, off the figures it already holds. A combatant the
 * statistics never saw is handed an empty set rather than a set of nulls: they did nothing, and
 * nothing is a reading.
 */
function composeRowDetail(
    figures: CombatantFigures,
    level: number | null,
    wasTurnLostRead: boolean,
    legendaryBonuses: FigureCut,
    legendaryBonusesReached: FigureCut,
): RowDetail {
    return {
        level,
        damageDealt: figures.damageDealt,
        damageTaken: figures.damageTaken,
        damageDealtRaw: figures.damageDealtRaw,
        damageTakenRaw: figures.damageTakenRaw,
        healthGiven: figures.healthGiven,
        healthRestored: figures.healthRestored,
        damagePrevented: figures.damagePrevented,
        blowsStruck: figures.blowsStruck,
        blowsWithoutSkill: figures.blowsWithoutSkill,
        skillUses: tallySkillUses(figures),
        turnsTaken: figures.turnsTaken,
        turnsLost: figures.turnsLost,
        wasTurnLostRead,
        damageDealtToNobody: figures.damageDealtToNobody,
        damageTakenFromNobody: figures.damageTakenFromNobody,
        healthRestoredByNobody: figures.healthRestoredByNobody,
        blowsCritical: figures.blowsCritical,
        procsWhenStriking: composeCutParts(figures.procsWhenStriking),
        procsWhenStruck: composeCutParts(figures.procsWhenStruck),
        damagePreventedByDefence: composeCutParts(figures.damagePreventedByDefence),
        damageDealtAbsorbedByDefence: composeCutParts(figures.damageDealtAbsorbedByDefence),
        damageTakenAbsorbedByDefence: composeCutParts(figures.damageTakenAbsorbedByDefence),
        statisticsDestroyed: composeCutParts(figures.statisticsDestroyed),
        legendaryBonuses: composeCutParts(legendaryBonuses),
        legendaryBonusesReached: composeCutParts(legendaryBonusesReached),
        unreadMessagesUnknownKey: figures.unreadMessagesUnknownKey,
        unreadMessagesNoParameter: figures.unreadMessagesNoParameter,
        sideHealsUnsized: figures.sideHealsUnsized,
    };
}

function tallySkillUses(figures: CombatantFigures): number {
    let uses = 0;
    for (const skill of figures.skills.values()) {
        uses += skill.uses;
    }
    return uses;
}

/**
 * A cut as the card draws it: biggest first, then by the key, so a fight redrawn without changing
 * states the same order. A part that came to nothing takes a row and adds none of it, so it is
 * left out — the same rule `composeElementCut` keeps.
 */
function composeCutParts(cut: FigureCut): CutPart[] {
    const parts: CutPart[] = [];
    for (const [key, figure] of cut) {
        if (figure > 0) parts.push({ key, figure });
    }
    parts.sort((leftPart, rightPart) =>
        getRankedOrder(leftPart.figure, rightPart.figure, leftPart.key, rightPart.key)
    );
    // The panel's own bound (**S11**), cut after the order so what it leaves out is the smallest.
    // It is the same number `core/` keeps a cut inside, so a card loses nothing to it.
    return parts.slice(0, CUT_PARTS_MAXIMUM);
}

/**
 * Whether this reading heard a lost turn at all, which one combatant's nought cannot say.
 *
 * ⚠️ **The bound is the panel's own and it stops the walk short rather than asserting** (**S11**,
 * **A11**, the rule `composeCutParts` above keeps). Stopping short can only answer *not heard*
 * where one was, which draws the taken count alone — the side that claims less.
 */
function wasAnyTurnLost(statistics: FightStatistics): boolean {
    let walked = 0;
    for (const figures of statistics.byCombatantId.values()) {
        if (figures.turnsLost > 0) return true;
        walked += 1;
        if (walked >= ROWS_MAXIMUM) break;
    }
    return false;
}

/**
 * What the figure was dealt with, folded from the **same** people it was summed from — so the two
 * sections under one pinned row are two cuts of one number rather than two numbers.
 *
 * The fold is the panel's because the set of people is: a reader narrowing to one side narrows
 * what is folded, and `src/core/fight-statistics.ts` cannot know what they narrowed it to. What
 * that file does hold is each person's own cut against each person's own figure, which is what
 * makes this sum the figure over it.
 */
function composeHalfNamedKinds(
    statistics: FightStatistics,
    pinnedCase: PinnedCase,
    parts: readonly HalfNamedPart[],
    neither: number,
    total: number,
): ElementCut {
    const shape = PINNED_SHAPES[pinnedCase];
    const folded = new Map<string, number>();
    let rest = 0;
    for (const halfNamedPart of parts) {
        const figures = statistics.byCombatantId.get(halfNamedPart.combatantId);
        if (figures === undefined) continue;
        rest += addFoldedCut(folded, figures[shape.kinds]);
    }
    if (neither > 0) rest += addFoldedCut(folded, statistics.damageByNeitherEndByKind);
    // A key standing only for what named neither end has nobody's row to open onto, and a level
    // holding one refusal says nothing the row above it did not.
    return composeElementCut(folded, total, rest, (element) => {
        return getHalfNamedByKind(statistics, shape.kinds, parts, element).length > 0;
    });
}

/**
 * One person's own cut into the fold, under the key the protocol wrote it with — and the figure it
 * could not give a key of its own to, which the caller owes a row (`develop ADR 0055`).
 */
function addFoldedCut(folded: Map<string, number>, cut: FigureCut): number {
    let rest = 0;
    for (const [key, figure] of cut) {
        if (folded.has(key)) {
            folded.set(key, (folded.get(key) ?? 0) + figure);
            continue;
        }
        if (folded.size >= CUT_PARTS_MAXIMUM) {
            rest += figure;
            continue;
        }
        folded.set(key, figure);
    }
    return rest;
}

/**
 * ⚠️ **The remainder here is nothing, on every screen, and the row for it is unreached.** Each
 * writer of a figure in `src/core/fight-statistics.ts` writes the kind it moved under in the same
 * breath — a blow's elements and pools beside what it dealt, a bare movement's key beside the
 * health it took, a restoring key beside what it put back — so a kind cut comes to the figure it
 * is a cut of. Measured over `captures/` on 2026-08-30: 0 of 1,060 combatant-and-screen readings.
 *
 * It stays as a row rather than becoming a check of any kind: this is four call sites agreeing,
 * and a fifth that forgot the cut should leave a reader a row saying so.
 */
function composeElementCut(
    cut: FigureCut,
    total: number,
    /** What a fold gave no key of its own to. Held, because the protocol did state it. */
    rest: number,
    doesOpen: (element: string) => boolean,
): ElementCut {
    const stated: Array<{ element: string; figure: number }> = [];
    let partsTotal = rest;
    for (const [element, figure] of cut) {
        partsTotal += figure;
        // A part that came to nothing is not a part of the figure: it takes a row and adds none
        // of it. The combatant at zero on a ranking is the other case and is still drawn — that
        // is a person who did nothing, and this is a nothing that has no person.
        if (figure > 0) stated.push({ element, figure });
    }
    stated.sort((leftRow, rightRow) =>
        getRankedOrder(leftRow.figure, rightRow.figure, leftRow.element, rightRow.element)
    );
    const unnamed = total - partsTotal;
    const figures = stated.map((elementRow) => elementRow.figure);
    if (rest > 0) figures.push(rest);
    if (unnamed > 0) figures.push(unnamed);
    const shares = formatSharesApportioned(figures, total);
    const largest = getLargestFigure(figures);
    const closing = stated.length + (rest > 0 ? 1 : 0);
    return {
        rows: stated.map((elementRow, rowIndex) => ({
            ...elementRow,
            doesOpenPart: doesOpen(elementRow.element),
            fill: getBarFill(elementRow.figure, largest),
            shareText: shares[rowIndex] ?? "",
        })),
        rest: rest > 0
            ? {
                figure: rest,
                fill: getBarFill(rest, largest),
                shareText: shares[stated.length] ?? "",
            }
            : null,
        noKind: unnamed > 0
            ? {
                figure: unnamed,
                fill: getBarFill(unnamed, largest),
                shareText: shares[closing] ?? "",
            }
            : null,
    };
}

/** Whoever carries one key of a half-named figure, with the part of it their row holds. */
function getHalfNamedByKind(
    statistics: FightStatistics,
    kinds: HalfNamedKindField,
    parts: readonly HalfNamedPart[],
    element: string,
): HalfNamedPart[] {
    const halfNamedParts: HalfNamedPart[] = [];
    for (const halfNamedPart of parts) {
        const figures = statistics.byCombatantId.get(halfNamedPart.combatantId);
        if (figures === undefined) continue;
        const figure = figures[kinds].get(element) ?? 0;
        if (figure <= 0) continue;
        halfNamedParts.push({ combatantId: halfNamedPart.combatantId, figure });
    }
    return halfNamedParts;
}

/**
 * What stands under one row of a pinned level, composed only when a reader asks for it. Null where
 * the row pressed is not on that level — a mark left over from another screen, or a person the
 * narrowing has since dropped — because a level of somebody else's figure is worse than none.
 *
 * Both shapes are read off the listing the level above was drawn from, so a figure here is a part
 * of the figure there by construction. Nothing on this level opens: it is the third.
 */
export function presentUnnamedCutLevel(
    statistics: FightStatistics,
    roster: CombatantRoster,
    pinnedCase: PinnedCase,
    choice: PanelSideChoice,
    readerSide: number | null,
    opened: HalfNamedOpened,
): UnnamedCutLevelContent | null {
    const { parts, sideListed } = composeHalfNamedListing(
        statistics,
        roster,
        pinnedCase,
        choice,
        readerSide,
    );
    if (opened.kind === HALF_NAMED_OPENED.person) {
        return composeHalfNamedForPerson(statistics, roster, pinnedCase, parts, opened.combatantId);
    }
    return composeHalfNamedForKind(statistics, roster, pinnedCase, { parts, sideListed }, opened);
}

/** One person's share of a half-named figure, cut by what the protocol says it was dealt with. */
function composeHalfNamedForPerson(
    statistics: FightStatistics,
    roster: CombatantRoster,
    pinnedCase: PinnedCase,
    parts: readonly HalfNamedPart[],
    combatantId: number,
): UnnamedCutLevelContent | null {
    const personPart = parts.find((halfNamedPart) => halfNamedPart.combatantId === combatantId);
    if (personPart === undefined) return null;
    const figures = statistics.byCombatantId.get(combatantId);
    if (figures === undefined) return null;
    const [row] = composeHalfNamedRows(
        statistics,
        roster,
        [personPart],
        [formatShareRounded(1)],
        personPart.figure,
    );
    if (row === undefined) return null;
    return {
        opened: HALF_NAMED_OPENED.person,
        case: pinnedCase,
        row,
        total: personPart.figure,
        kinds: composeElementCut(
            figures[PINNED_SHAPES[pinnedCase].kinds],
            personPart.figure,
            0,
            () => false,
        ),
    };
}

/**
 * And the same fold the other way round: whoever carries one key of that figure. The part of the
 * key that named neither end comes with it, because the level above counted it into the key's own
 * figure — a level short of the row over it states a figure a reader cannot check.
 */
function composeHalfNamedForKind(
    statistics: FightStatistics,
    roster: CombatantRoster,
    pinnedCase: PinnedCase,
    listing: HalfNamedListing,
    opened: { kind: typeof HALF_NAMED_OPENED.element; element: string },
): UnnamedCutLevelContent | null {
    const shape = PINNED_SHAPES[pinnedCase];
    const carriers = getHalfNamedByKind(statistics, shape.kinds, listing.parts, opened.element);
    if (carriers.length === 0) return null;
    const neitherEndPinned = getNeitherEndForPinned(statistics, pinnedCase, listing.sideListed);
    const neither = neitherEndPinned <= 0
        ? 0
        : statistics.damageByNeitherEndByKind.get(opened.element) ?? 0;
    let total = neither;
    for (const carrier of carriers) total += carrier.figure;
    if (total <= 0) return null;
    const figures = [...carriers.map((carrier) => carrier.figure), neither];
    const shares = formatSharesApportioned(figures, total);
    const largest = getLargestFigure(figures);
    return {
        opened: HALF_NAMED_OPENED.element,
        case: pinnedCase,
        element: opened.element,
        end: shape.end,
        total,
        rows: composeHalfNamedRows(statistics, roster, carriers, shares, largest),
        neitherEnd: neither <= 0 ? null : {
            figure: neither,
            fill: getBarFill(neither, largest),
            shareText: shares[carriers.length] ?? "",
        },
    };
}

/**
 * What stands under the end an opened figure left out: that person's own part of a half-named
 * figure, cut by the key it was stated under — the level a pinned row reaches through the same
 * person. Null where nothing of it is kept, which leaves the row shut.
 */
export function presentUnnamedPairLevel(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    combatantId: number,
): Extract<UnnamedCutLevelContent, { opened: typeof HALF_NAMED_OPENED.person }> | null {
    const pinnedCase = OPENED_UNNAMED_CASES[metric];
    if (pinnedCase === null) return null;
    const figures = statistics.byCombatantId.get(combatantId);
    if (figures === undefined) return null;
    const shape = PINNED_SHAPES[pinnedCase];
    const figure = figures[shape.field];
    if (figure <= 0) return null;
    const [row] = composeHalfNamedRows(
        statistics,
        roster,
        [{ combatantId, figure }],
        [formatShareRounded(1)],
        figure,
    );
    if (row === undefined) return null;
    return {
        opened: HALF_NAMED_OPENED.person,
        case: pinnedCase,
        row,
        total: figure,
        kinds: composeElementCut(figures[shape.kinds], figure, 0, () => false),
    };
}

export function getOutcomeForReaderSide(
    outcome: FightOutcome,
    roster: CombatantRoster,
    readerSide: number | null,
): OutcomeResult | null {
    // An escape ends the fight for everybody with health and position kept, so nobody won it —
    // the published help, article 372, read 2026-09-06. It is read before a side the protocol
    // named: no recording carries the two together, and until one does the interruption is what
    // the fight came to.
    if (outcome.isFled) return OUTCOME_RESULT.fled;
    if (outcome.isDrawn) return OUTCOME_RESULT.drawn;
    if (readerSide === null) return null;
    if (isReaderSideNamed(roster, readerSide, outcome.wonNames)) return OUTCOME_RESULT.won;
    if (isReaderSideNamed(roster, readerSide, outcome.lostNames)) return OUTCOME_RESULT.lost;
    return null;
}

function isReaderSideNamed(
    roster: CombatantRoster,
    readerSide: number,
    names: readonly string[],
): boolean {
    for (const name of names) {
        const combatantId = lookupCombatantIdByName(roster, name);
        if (combatantId === null) continue;
        if (roster.byId.get(combatantId)?.side === readerSide) return true;
    }
    return false;
}

export function presentScreen(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    choice: PanelSideChoice,
    readerSide: number | null,
    suspicions: FightSuspicions,
): ScreenContent {
    const sideRows = composeRowsBeforeShares(statistics, roster, metric).filter((row) =>
        isSideListed(row.side, choice, readerSide)
    );
    sideRows.sort(getRowOrderByFigureThenId);
    // **S11, and it is where the bound has to be**: after the sort, so a cast past it costs the
    // smallest figures rather than whichever rows the fold reached last, and before every figure
    // derived from the list, so the column a reader adds up is the column that was drawn. The
    // strip under the list is composed off the statistics and still totals everybody.
    const listed = sideRows.slice(0, ROWS_MAXIMUM);
    const total = tallyListedTotal(statistics, listed, metric, choice);
    const pinned = composePinnedFigures(statistics, roster, listed, metric, choice, readerSide);
    const sides = composePanelSides(statistics, roster, metric, readerSide);
    const sideListed = getSideRelationListed(choice, readerSide);
    // Only a figure standing apart joins the whole: one standing as a cut is already inside the
    // rows, so paying it out of the hundred would take a point off a row that owns one.
    const pinnedApart = pinned.filter((pinnedFigure) =>
        pinnedFigure.placing === PINNED_PLACING.apart
    );
    const figurePlaced = pinnedApart.reduce(
        (sum, pinnedFigure) => sum + pinnedFigure.figure,
        total,
    );
    // ⚠️ **The second count, and the whole reason there are two.** Everything above is composed
    // from the rows; this is composed from the statistics and never looks at them, so the
    // difference is what the screen holds and no row does. Not the rows' own total: a whole
    // derived from the figures being shared makes the column read a hundred whatever went missing
    // on the way to it.
    const screenTotal = getCountedTotal(statistics, sides, metric, sideListed);
    const outside = Math.max(screenTotal - figurePlaced, 0);
    const whole = figurePlaced + outside;
    const shared = [
        ...listed.map((row) => row.figure),
        ...pinnedApart.map((pinnedFigure) => pinnedFigure.figure),
    ];
    if (outside > 0) shared.push(outside);
    const shares = formatSharesApportioned(shared, whole);
    const largest = getLargestFigure([
        ...shared,
        ...pinned.map((pinnedFigure) => pinnedFigure.figure),
    ]);
    const rows = listed.map((row, rowIndex) => ({
        ...row,
        fill: getBarFill(row.figure, largest),
        shareText: shares[rowIndex] ?? "",
        detail: composeRowDetailFor(statistics, roster, row.combatantId),
    }));
    let hasFiguresDisagreed: boolean;
    // The rows holding **more** than the screen's own count is the other side of `unplaced`,
    // and the one that says a drawn figure is wrong rather than short. ⚠️ No check of the whole
    // against the strip follows it: under a side the screen's count **is** the strip's figure,
    // so past this branch the whole equals it by construction and such a check is never true.
    if (screenTotal < figurePlaced) {
        hasFiguresDisagreed = true;
    } else {
        hasFiguresDisagreed = pinned.some((pinnedFigure) =>
            hasPinnedTotalDisagreed(statistics, pinnedFigure.case, pinnedFigure.figure, sideListed)
        );
    }
    return {
        rows,
        hasFiguresDisagreed,
        outcome: getFightOutcomeForReaderSide(statistics, roster, readerSide),
        ...composeHeadcount(statistics, roster, readerSide),
        total,
        pinned: composePinnedRows(pinned, shares.slice(listed.length), whole, largest),
        outsideRanking: outside > 0
            ? {
                figure: outside,
                fill: getBarFill(outside, largest),
                shareText: shares[shared.length - 1] ?? "",
            }
            : null,
        suspicions: formatScreenSuspicions(statistics, roster, metric, suspicions),
        sides,
        // Read off what the list is, and never off what was pressed: with no seat to read from
        // every list is everybody, whatever the strip last answered, and a shorter window would
        // be the height of a side nothing narrowed to.
        rowsVisibleCount: sideListed === null ? RANKING_ROWS : SIDE_ROWS,
    };
}

/** By figure, then by id — a tie broken by something that does not move between draws. */
function getRowOrderByFigureThenId(leftRow: UnsharedRow, rightRow: UnsharedRow): number {
    if (leftRow.figure !== rightRow.figure) return rightRow.figure - leftRow.figure;
    return leftRow.combatantId - rightRow.combatantId;
}

/**
 * What the shares on this list are measured against: the fight's own total under everybody, and
 * the listed side's under either of the other two. A one-side list whose shares came to a fifth
 * of a percent would be answering a question nobody on that list asked.
 */
function tallyListedTotal(
    statistics: FightStatistics,
    rows: readonly UnsharedRow[],
    metric: PanelMetric,
    choice: PanelSideChoice,
): number {
    if (choice === SIDE_CHOICE.everyone) return getFigureForMetric(statistics.totals, metric);
    let total = 0;
    for (const row of rows) total += row.figure;
    return total;
}

/**
 * The ends the protocol can leave out, as figures standing under the list that is showing.
 *
 * Each is summed from the level under it rather than read off a count beside it, which is what
 * keeps the row and that level one answer. `develop ADR 0036` charges a one-side list the way the
 * strip charges it; `develop ADR 0034` is why the level is there at all.
 */
function composePinnedFigures(
    statistics: FightStatistics,
    roster: CombatantRoster,
    rows: readonly UnsharedRow[],
    metric: PanelMetric,
    choice: PanelSideChoice,
    readerSide: number | null,
): Array<Omit<PinnedRow, "fill" | "shareText">> {
    const sideListed = getSideRelationListed(choice, readerSide);
    const pinnedFigures: Array<Omit<PinnedRow, "fill" | "shareText">> = [];
    const pinned = PINNED_CASES.filter((pinnedCase) => PINNED_SHAPES[pinnedCase].metric === metric);
    for (const pinnedCase of pinned) {
        const parts = composeHalfNamedParts(
            statistics,
            roster,
            pinnedCase,
            rows,
            sideListed,
            readerSide,
        );
        const figure = tallyPinnedFigure(statistics, pinnedCase, parts, sideListed);
        // A figure of nothing is not pinned, and its cut is a cut of nothing: the fold below
        // states a figure there is some of, so it is asked only where the row will be drawn.
        if (figure <= 0) continue;
        const shape = PINNED_SHAPES[pinnedCase];
        const neither = getNeitherEndForPinned(statistics, pinnedCase, sideListed);
        pinnedFigures.push({
            case: pinnedCase,
            end: shape.end,
            placing: shape.placing,
            figure,
            kinds: composeHalfNamedKinds(statistics, pinnedCase, parts, neither, figure),
        });
    }
    return pinnedFigures;
}

function composePanelSides(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    readerSide: number | null,
): PanelSides | null {
    if (readerSide === null) return null;
    const totals: Record<SideRelation, number> = { reader: 0, opposing: 0, nobody: 0 };
    // The half-named figure a side is charged with is the pinned row standing apart on this
    // screen, read off `PINNED_SHAPES`; a screen pinning nothing apart charges nothing.
    const apartCase = lookupApartCase(metric);
    const apartField = apartCase === null ? null : PINNED_SHAPES[apartCase].field;
    for (const [combatantId, figures] of statistics.byCombatantId) {
        const sideRelation = getSideRelation(
            roster.byId.get(combatantId)?.side ?? null,
            readerSide,
        );
        totals[sideRelation] += getFigureForMetric(figures, metric);
        if (apartField !== null) {
            totals[getSideRelationCharged(sideRelation, metric)] += figures[apartField];
        }
    }
    // What names neither end belongs to no side at all.
    if (apartCase !== null) totals.nobody += getNeitherEndForPinned(statistics, apartCase, null);
    return totals;
}

/** The pinned row a screen stands apart from its list, or null where it pins none apart. */
function lookupApartCase(metric: PanelMetric): PinnedCase | null {
    const apartCases = PINNED_CASES.filter((pinnedCase) => {
        const shape = PINNED_SHAPES[pinnedCase];
        if (shape.metric !== metric) return false;
        return shape.placing === PINNED_PLACING.apart;
    });
    return apartCases[0] ?? null;
}

/**
 * **The screen's own count, composed from the statistics and from nothing a row holds.** This is
 * the denominator the shares are divided by, and the point of taking it a second way is that the
 * first way cannot fail: a whole summed out of the very rows being shared comes to a hundred
 * whatever fell out on the road to it — a bound that cut a row, a person the roster refused, a
 * figure in the statistics nothing draws.
 *
 * Under one side it is the strip's own figure, which `develop ADR 0036` already holds the list to.
 * Under everybody it is the fight's own total plus the one bucket that is on nobody's row, and a
 * figure naming nobody has no side — so under a side there is nothing here to add
 * (`develop ADR 0038`).
 */
function getCountedTotal(
    statistics: FightStatistics,
    sides: PanelSides | null,
    metric: PanelMetric,
    sideListed: SideRelation | null,
): number {
    if (sideListed === null) {
        return getFigureForMetric(statistics.totals, metric) +
            statistics[HALF_NAMED_TOTAL_FIELD_BY_METRIC[metric]];
    }
    if (sides === null) return 0;
    if (sideListed === SIDE_RELATION.reader) return sides.reader;
    if (sideListed === SIDE_RELATION.opposing) return sides.opposing;
    return sides.nobody;
}

/**
 * Under everybody a figure standing apart **is** the fight's own count, and this asks whether it
 * still is. `verifyFightStatistics` in `src/core/fight-statistics.ts` is what makes it hold — the
 * count is the sum of one field across the rows plus what named neither end, and nothing else.
 *
 * It is a reading rather than an assertion (`develop ADR 0051`), and what it holds is worth more
 * than the panel an assertion here would cost: two independent counts disagreeing is the one thing
 * that says a drawn figure is wrong rather than short, so the reading carries the answer.
 */
function hasPinnedTotalDisagreed(
    statistics: FightStatistics,
    pinnedCase: PinnedCase,
    total: number,
    sideListed: SideRelation | null,
): boolean {
    if (sideListed !== null) return false;
    const shape = PINNED_SHAPES[pinnedCase];
    if (shape.placing === PINNED_PLACING.cut) return false;
    return total !== statistics[HALF_NAMED_TOTAL_FIELD_BY_METRIC[shape.metric]];
}

/**
 * How the fight went **from the reader's seat**, or nothing at all.
 *
 * The protocol names both sides and says nothing about which is the reader's, so the answer is
 * composed here. Without a seat, or where no name resolves, the header says nothing: a fight the
 * panel cannot place is not a fight it may call a loss. Two answers need no seat, because the
 * game states each by naming nobody: a draw, and a fight an escape broke off.
 */
function getFightOutcomeForReaderSide(
    statistics: FightStatistics,
    roster: CombatantRoster,
    readerSide: number | null,
): OutcomeResult | null {
    if (statistics.outcome === null) return null;
    return getOutcomeForReaderSide(statistics.outcome, roster, readerSide);
}

/**
 * The pinned rows, each with the share its standing gives it: one apportioned with the ranking,
 * one rounded on its own, because a cut and the rows it is a cut of overlap on purpose.
 */
function composePinnedRows(
    pinned: ReadonlyArray<Omit<PinnedRow, "fill" | "shareText">>,
    apartShares: readonly string[],
    whole: number,
    largest: number,
): PinnedRow[] {
    let taken = 0;
    return pinned.map((pinnedFigure) => {
        const shareText = pinnedFigure.placing === PINNED_PLACING.apart
            ? apartShares[taken++] ?? ""
            : formatShareRounded(whole === 0 ? 0 : pinnedFigure.figure / whole);
        return { ...pinnedFigure, fill: getBarFill(pinnedFigure.figure, largest), shareText };
    });
}

/**
 * Widening to narrowing. The first four qualify every screen; a cast nobody could place puts back
 * health, so saying it on a damage screen would put a suspicion on a figure that cannot carry it.
 * Each of the three unread causes is its own sentence, because each is its own thing to be short of
 * (`develop ADR 0070`). Over the 37 recordings of `captures/` on 2026-10-06 none is short of any of
 * them, so the order two would stand in is one no recording has drawn.
 */
function formatScreenSuspicions(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    suspicions: FightSuspicions,
): string[] {
    const said = formatFightSuspicions(statistics, roster, suspicions);
    if (getNounForMetric(metric) === PANEL_NOUN.healing) {
        said.push(formatUnplacedHealSuspicion(
            statistics.sideHealsUnsized,
            statistics.sideHealsStated,
            formatRowsReachedByGap(statistics, roster, (figures) => figures.sideHealsUnsized),
        ));
    }
    return said.filter((sentence) => sentence.length > 0).slice(0, WARNINGS_MAXIMUM);
}

/**
 * Whom one gap reaches, worded, off a single walk of the rows. The names stop at what a sentence
 * can carry and the count does not, because past that the count is what the sentence says instead
 * of a list. A row the roster cannot name is counted and never guessed at, which is what leaves
 * the two figures apart.
 */
function formatRowsReachedByGap(
    statistics: FightStatistics,
    roster: CombatantRoster,
    getCount: (figures: CombatantFigures) => number,
): string {
    const names: string[] = [];
    let charged = 0;
    for (const [combatantId, figures] of statistics.byCombatantId) {
        if (charged >= COMBATANTS_MAXIMUM) break;
        if (getCount(figures) <= 0) continue;
        charged += 1;
        const combatant = roster.byId.get(combatantId);
        if (combatant === undefined) continue;
        if (names.length >= NAMED_ROWS_MAXIMUM) continue;
        names.push(combatant.name);
    }
    return formatNamesReachedByGap(names, charged);
}

/**
 * What is short about a whole fight, whichever figure a screen stands on: the sentences under a
 * ranking but the one only a healing screen can carry, and what a shelf row's mark opens onto
 * (ADR 0046).
 */
export function formatFightSuspicions(
    statistics: FightStatistics,
    roster: CombatantRoster,
    suspicions: FightSuspicions,
): string[] {
    const { messagesRead, messagesLost } = suspicions;
    const said: string[] = [];
    if (suspicions.hasJoinedInProgress) said.push(formatJoinedInProgressSuspicion());
    // What never arrived is not among what was read, so the two added up are what was stated.
    said.push(formatLostMessageSuspicion(messagesLost, messagesRead + messagesLost));
    said.push(formatUnknownKeySuspicion(
        statistics.unreadMessagesUnknownKey,
        messagesRead,
        formatRowsReachedByGap(statistics, roster, (figures) => figures.unreadMessagesUnknownKey),
    ));
    said.push(formatNoParameterSuspicion(
        statistics.unreadMessagesNoParameter,
        messagesRead,
        formatRowsReachedByGap(statistics, roster, (figures) => figures.unreadMessagesNoParameter),
    ));
    said.push(
        formatGrammarRefusedSuspicion(statistics.unreadMessagesGrammarRefused, messagesRead),
    );
    return said.filter((sentence) => sentence.length > 0);
}

/**
 * The fight as a headcount, and it counts the people the list draws rather than the ones the
 * statistics measured: the two are the same list only once everybody has acted, so a header
 * reading off the other set says `2 vs 1` over eleven rows for the opening payloads of a group
 * fight. Sides in the order the panel puts them in everywhere: the reader's own first.
 */
export function composeHeadcount(
    statistics: FightStatistics,
    roster: CombatantRoster,
    readerSide: number | null,
): { sizes: number[]; unplaced: number } {
    const countBySide = new Map<number, number>();
    let unplaced = 0;
    const everybody = new Set<number>([...statistics.byCombatantId.keys(), ...roster.byId.keys()]);
    for (const combatantId of everybody) {
        const side = roster.byId.get(combatantId)?.side ?? null;
        if (side === null) unplaced += 1;
        else countBySide.set(side, (countBySide.get(side) ?? 0) + 1);
    }
    const sides = [...countBySide].sort(([leftSide], [rightSide]) => {
        if (readerSide === leftSide) return -1;
        if (readerSide === rightSide) return 1;
        return leftSide - rightSide;
    });
    const sizes = sides.map(([, count]) => count);
    // No relation to the rows is held here: a ranking is filtered by the side strip and the
    // headcount never is, so a fight of ten against one draws one row beside two sizes.
    return { sizes, unplaced };
}

export function getSideRelation(side: number | null, readerSide: number | null): SideRelation {
    if (side === null) return SIDE_RELATION.nobody;
    if (readerSide === null) return SIDE_RELATION.nobody;
    return side === readerSide ? SIDE_RELATION.reader : SIDE_RELATION.opposing;
}

/** The text a part is ordered by where two of them come to the same figure. */
export function getTextForNamedPart(openedPart: OpenedPart): string {
    if (openedPart.kind === OPENED_PART.skill) return openedPart.name;
    if (openedPart.kind === OPENED_PART.source) return openedPart.source;
    if (openedPart.kind === OPENED_PART.element) return openedPart.element;
    return "";
}

/**
 * Whom one part of an opened figure reached, person by person — the level a skill row, a key row
 * or a kind row opens onto, and the same shape whichever of the three it was.
 *
 * ⚠️ **It lists everybody, the one it was opened from included.** Health somebody put into
 * themselves is health they gave, and it stands inside the figure on the row that was pressed: a
 * level narrowed against the caster closed against a smaller number and said nothing about the
 * difference — 31 of the 74 levels a reader could then reach, 143,888 points, the largest single
 * drop 13,167, over `captures/` on 2026-08-30.
 */
export function presentPartLevel(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    combatantId: number,
    openedPart: OpenedPart,
): PartLevelContent | null {
    const figures = statistics.byCombatantId.get(combatantId);
    if (figures === undefined) return null;
    const cut = composePeopleForPart(statistics, figures, metric, combatantId, openedPart);
    if (cut === null) return null;
    const total = getPartTotal(figures, metric, openedPart, cut);
    const byOtherEnd = composeOpponentCut(
        cut,
        statistics,
        roster,
        { figure: total, unnamedOpened: null },
        () => false,
    );
    return {
        part: openedPart,
        total,
        byOtherEnd,
        hasFiguresDisagreed: byOtherEnd.hasFiguresDisagreed,
    };
}

/**
 * The people one part of a figure reached, and null where the statistics keep no such cut. Null
 * is the whole of the register's `never`: a key on the screen about what reached you names no
 * giver, and neither does a kind of it.
 */
function composePeopleForPart(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    combatantId: number,
    openedPart: OpenedPart,
): FigureCut | null {
    if (openedPart.kind === OPENED_PART.skill) {
        return composePeopleForSkill(statistics, figures, metric, combatantId, openedPart.name);
    }
    if (openedPart.kind === OPENED_PART.plain) {
        // Kept on this combatant's own record, both ways round, so the walk every other part of a
        // received figure makes over everybody's skills is one nobody has to make here.
        if (getNounForMetric(metric) !== PANEL_NOUN.damage) return null;
        const cut = getDirectionForMetric(metric) === PANEL_DIRECTION.given
            ? figures.damageDealtWithoutSkillByOpponent
            : figures.damageTakenWithoutSkillByOpponent;
        return composeCutWithoutZeros(cut);
    }
    if (openedPart.kind === OPENED_PART.source) {
        // Only the giving side keeps a key per person: a key names whoever received the health,
        // so a received row has no second end to be cut by.
        if (metric !== PANEL_METRIC.healthGiven) return null;
        return composePeopleForKey(
            figures.healthGivenWithoutSkillByReceiverAndKey,
            openedPart.source,
        );
    }
    if (metric === PANEL_METRIC.damageDealt) {
        return composePeopleForKey(figures.damageDealtByOpponentAndKind, openedPart.element);
    }
    if (metric === PANEL_METRIC.damageTaken) {
        return composePeopleForKey(figures.damageTakenByOpponentAndKind, openedPart.element);
    }
    // A key the health moved under is the receiver's, and the giver is not kept beside it.
    return null;
}

/**
 * An announcement is kept on the record of whoever **made** it, so a skill is read off this row
 * where the direction is giving and off everybody's where it is receiving. The receiving side is
 * the level worth the most: the section above folds every caster under one name, and this is the
 * column that says which of them it came from.
 */
function composePeopleForSkill(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    combatantId: number,
    name: string,
): FigureCut | null {
    const isDamage = getNounForMetric(metric) === PANEL_NOUN.damage;
    if (getDirectionForMetric(metric) === PANEL_DIRECTION.given) {
        const skill = figures.skills.get(name);
        if (skill === undefined) return null;
        return composeCutWithoutZeros(
            isDamage ? skill.damageDealtByOpponent : skill.healthGivenByReceiver,
        );
    }
    const reached = new Map<string, number>();
    for (const [otherId, otherFigures] of statistics.byCombatantId) {
        for (const skill of otherFigures.skills.values()) {
            if (skill.name !== name) continue;
            const cut = isDamage ? skill.damageDealtByOpponent : skill.healthGivenByReceiver;
            const figure = cut.get(`${combatantId}`) ?? 0;
            if (figure > 0) reached.set(`${otherId}`, (reached.get(`${otherId}`) ?? 0) + figure);
        }
    }
    return reached.size === 0 ? null : reached;
}

/** A reading of the cut and never the cut itself, and a part that came to nothing is no part. */
function composeCutWithoutZeros(cut: FigureCut): FigureCut | null {
    const stated = new Map<string, number>();
    for (const [otherEnd, figure] of cut) {
        if (figure > 0) stated.set(otherEnd, figure);
    }
    return stated.size === 0 ? null : stated;
}

/** A cut of a cut, read the other way round: the part is named, and the people are the rows. */
function composePeopleForKey(
    pairs: ReadonlyMap<string, FigureCut>,
    named: string,
): FigureCut | null {
    const reached = new Map<string, number>();
    for (const [otherEnd, cut] of pairs) {
        const figure = cut.get(named) ?? 0;
        if (figure > 0) reached.set(otherEnd, figure);
    }
    return reached.size === 0 ? null : reached;
}

/**
 * The figure the row that was pressed states, and never the sum of the level under it: a blow the
 * protocol tied to nobody is inside what a skill dealt and outside every row of whom it reached,
 * and the difference is the row `composeOpponentCut` draws for nobody. Read off the same field
 * the section read, so a level cannot open under a figure the reader never saw.
 */
function getPartTotal(
    figures: CombatantFigures,
    metric: PanelMetric,
    openedPart: OpenedPart,
    cut: FigureCut,
): number {
    if (openedPart.kind === OPENED_PART.element) {
        return getCutsForMetric(figures, metric).byElement?.get(openedPart.element) ??
            tallyCut(cut);
    }
    if (openedPart.kind === OPENED_PART.skill) {
        if (getDirectionForMetric(metric) === PANEL_DIRECTION.given) {
            const skill = figures.skills.get(openedPart.name);
            if (skill === undefined) return tallyCut(cut);
            return getNounForMetric(metric) === PANEL_NOUN.damage
                ? skill.damageDealt
                : skill.healthGiven;
        }
    }
    // What was received under a name, and what a key gave, are read by folding the same cut the
    // level is: the section above states no second figure for either.
    return tallyCut(cut);
}

/** Healing given has no cut by key, so it answers none, and its caller draws an empty cut — whose
 * those keys are is `core/fight-statistics.ts`'s to state, and it does. */
function getCutsForMetric(figures: CombatantFigures, metric: PanelMetric): MetricCuts {
    if (metric === PANEL_METRIC.damageDealt) {
        return {
            byOtherEnd: figures.damageDealtByOpponent,
            byElement: figures.damageDealtByKind,
        };
    }
    if (metric === PANEL_METRIC.damageTaken) {
        return {
            byOtherEnd: figures.damageTakenByOpponent,
            byElement: figures.damageTakenByKind,
        };
    }
    if (metric === PANEL_METRIC.healthGiven) {
        return { byOtherEnd: figures.healthGivenByReceiver, byElement: null };
    }
    return {
        byOtherEnd: figures.healthRestoredByGiver,
        byElement: figures.healthRestoredByKey,
    };
}

function tallyCut(cut: FigureCut): number {
    let total = 0;
    for (const figure of cut.values()) total += figure;
    return total;
}

/**
 * The remainder is a figure whose other end the protocol never named: health that moved down
 * outside a blow carries the movement and no actor, so there is nobody to charge it to. Over
 * `captures/` on 2026-08-30 that is 45 of 1,060 combatant-and-screen readings, in 28 of the
 * recordings, and every one of them on damage taken — which is where the protocol states a bare
 * movement and the dealing side never is.
 *
 * That row opens where the level under it, `unnamedOpened`, totals it and nowhere else: the
 * statistics assert the half-named balance over a fight and not per person. Over `captures/` on
 * 2026-09-29 it did in 64 rows of 64. Its card states that level's kinds on the same condition.
 */
function composeOpponentCut(
    cut: FigureCut,
    statistics: FightStatistics,
    roster: CombatantRoster,
    totals: { figure: number; unnamedOpened: { total: number; kinds: ElementCut } | null },
    doesOpen: (otherId: number) => boolean,
): OtherEndCut {
    const total = totals.figure;
    const stated: UnsharedRow[] = [];
    let partsTotal = 0;
    let hasKeyUnparsed = false;
    for (const [named, figure] of cut) {
        const otherId = parseInteger(named);
        if (otherId === null) {
            hasKeyUnparsed = true;
            continue;
        }
        partsTotal += figure;
        const combatant = roster.byId.get(otherId);
        stated.push({
            combatantId: otherId,
            name: combatant?.name ?? null,
            side: combatant?.side ?? null,
            profession: combatant?.profession ?? null,
            figure,
        });
    }
    stated.sort(getRowOrderByFigureThenId);
    const unnamed = total - partsTotal;
    let hasFiguresDisagreed: boolean;
    // The rows holding **more** than the figure over them: no half-named row stands, and the
    // column adds past a hundred.
    if (unnamed < 0) {
        hasFiguresDisagreed = true;
    } else {
        hasFiguresDisagreed = hasKeyUnparsed;
    }
    const figures = stated.map((unsharedRow) => unsharedRow.figure);
    if (unnamed > 0) figures.push(unnamed);
    const shares = formatSharesApportioned(figures, total);
    const largest = getLargestFigure(figures);
    const keptKinds = totals.unnamedOpened?.total === unnamed ? totals.unnamedOpened.kinds : null;
    return {
        rows: stated.map((row, rowIndex) => ({
            ...row,
            fill: getBarFill(row.figure, largest),
            shareText: shares[rowIndex] ?? "",
            doesOpenPair: doesOpen(row.combatantId),
            detail: composeRowDetailFor(statistics, roster, row.combatantId),
        })),
        halfNamed: unnamed > 0
            ? {
                figure: unnamed,
                fill: getBarFill(unnamed, largest),
                shareText: shares[stated.length] ?? "",
                doesOpenPair: keptKinds !== null,
                kinds: keptKinds,
            }
            : null,
        hasFiguresDisagreed,
    };
}

/**
 * Null where the pair states nothing: a combatant the fight does not hold, or two the screen's own
 * figure never passed between.
 */
export function presentPairLevel(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    combatantId: number,
    otherId: number,
): PairLevelContent | null {
    const figures = statistics.byCombatantId.get(combatantId);
    if (figures === undefined) return null;
    const total = getPairTotal(figures, metric, otherId);
    if (total === null) return null;
    const kinds = getPairKinds(figures, metric, otherId);
    const otherCombatant = roster.byId.get(otherId);
    const parts = composePairParts(statistics, metric, combatantId, otherId, total);
    return {
        combatantId,
        otherId,
        otherName: otherCombatant?.name ?? null,
        otherProfession: otherCombatant?.profession ?? null,
        total,
        parts: parts.rows,
        hasFiguresDisagreed: parts.hasFiguresDisagreed,
        // Nothing on the last rung opens: the protocol states no further cut of a pair.
        byElement: kinds === null
            ? { rows: [], rest: null, noKind: null }
            : composeElementCut(kinds, total, 0, () => false),
    };
}

/**
 * What passed between the two, on the screen being read — and null where nothing did, which is a
 * pair that does not exist rather than one standing at nothing.
 *
 * On healing it is read off the flat cut the opponent row above it was drawn from, so an opened
 * pair states the figure that was pressed rather than a sum of the rows under it. A cut of the
 * skills would close against a figure nobody pressed: a pair no announcement covered would come to
 * nothing and open onto an empty level.
 *
 * One branch per screen rather than a fall-through past the kinds: a damage screen whose cut of a
 * cut was missing an opponent the flat cut holds would answer with a figure off the healing maps,
 * and a figure under the wrong noun is the one thing a drill must never state.
 */
function getPairTotal(
    figures: CombatantFigures,
    metric: PanelMetric,
    otherId: number,
): number | null {
    if (getNounForMetric(metric) === PANEL_NOUN.damage) {
        const kinds = getPairKinds(figures, metric, otherId);
        return kinds === null ? null : tallyCut(kinds);
    }
    if (metric === PANEL_METRIC.healthGiven) {
        return figures.healthGivenByReceiver.get(`${otherId}`) ?? null;
    }
    return figures.healthRestoredByGiver.get(`${otherId}`) ?? null;
}

function getPairKinds(
    figures: CombatantFigures,
    metric: PanelMetric,
    otherId: number,
): FigureCut | null {
    if (metric === PANEL_METRIC.damageDealt) {
        return figures.damageDealtByOpponentAndKind.get(`${otherId}`) ?? null;
    }
    if (metric === PANEL_METRIC.damageTaken) {
        return figures.damageTakenByOpponentAndKind.get(`${otherId}`) ?? null;
    }
    return null;
}

/**
 * The section an opened pair is, sorted once over the whole of it.
 *
 * ⚠️ **Sorted here rather than where each kind of part was gathered.** Appending the keys after an
 * ordered list of skills puts a key larger than every skill at the bottom of the column, which is
 * the one thing a list of bars says without being read.
 *
 * The closing row carries no count: an announcement is counted where it was made, and the protocol
 * states no number of anything against one opponent rather than another.
 */
function composePairParts(
    statistics: FightStatistics,
    metric: PanelMetric,
    combatantId: number,
    otherId: number,
    total: number,
): { rows: PairPartRow[]; hasFiguresDisagreed: boolean } {
    const stated = composePairPartFigures(statistics, metric, combatantId, otherId);
    stated.sort((leftPart, rightPart) =>
        getRankedOrder(
            leftPart.figure,
            rightPart.figure,
            getTextForNamedPart(leftPart.part),
            getTextForNamedPart(rightPart.part),
        )
    );
    const partsTotal = tallyUnsharedPairParts(stated);
    const closingFigure = total - partsTotal;
    // Clamped as the section a skill row closes is (`composeSkillCut`), and the clamp carried
    // out: a remainder below nothing is the parts coming to more than the figure over them, which
    // is a drawn figure being wrong rather than short, and a bar cannot be drawn below nothing.
    const closingFigureClamped = Math.max(closingFigure, 0);
    const statedFigures = stated.map((pairPart) => pairPart.figure);
    const figures = closingFigure === 0 ? statedFigures : [...statedFigures, closingFigureClamped];
    const shares = formatSharesApportioned(figures, total);
    const largest = getLargestFigure(figures);
    const rows: PairPartRow[] = stated.map((pairPart, partIndex) => ({
        part: pairPart.part,
        figure: pairPart.figure,
        fill: getBarFill(pairPart.figure, largest),
        shareText: shares[partIndex] ?? "",
    }));
    if (closingFigure === 0) return { rows, hasFiguresDisagreed: false };
    // Where its figure puts it, and not after the lot — the warning above is about a key larger
    // than every skill sitting at the bottom of a column, and the closing row is the one that most
    // often is (`develop ADR 0079`). Its share is read by the index it was composed under, so the
    // figure it carries is unmoved by where it is drawn.
    rows.splice(getPlaceForClosing(stated, closingFigureClamped) - 1, 0, {
        part: { kind: OPENED_PART.plain },
        figure: closingFigureClamped,
        fill: getBarFill(closingFigureClamped, largest),
        shareText: shares[stated.length] ?? "",
    });
    return { rows, hasFiguresDisagreed: closingFigure < 0 };
}

/**
 * What an announcement put behind this one pair, and what the game named for it with nothing
 * announced in front. Both on the same list because they make up one section: the keys hold what
 * the announcements do not, and a reader adding the column gets the figure they pressed.
 *
 * ⚠️ **A key stands here on every screen, and what a blow was made of stands here on none.** The
 * elements are a section of their own beside this one, so drawing them here would draw one figure
 * twice; a key health went out under reached no announcement at all, and leaving it out of a pair
 * while the level above names it is one program saying two things about one figure
 * (`develop ADR 0080`). Only a wound reaches a pair on the damage screens — every other loss
 * outside a blow names no opponent, so there is no pair for it to stand in.
 */
function composePairPartFigures(
    statistics: FightStatistics,
    metric: PanelMetric,
    combatantId: number,
    otherId: number,
): UnsharedPairPart[] {
    const end = getPairGivingEnd(statistics, metric, combatantId, otherId);
    if (end.figures === undefined) return [];
    const isDamage = getNounForMetric(metric) === PANEL_NOUN.damage;
    const stated: UnsharedPairPart[] = [];
    for (const skill of end.figures.skills.values()) {
        const figure = isDamage
            ? skill.damageDealtByOpponent.get(end.subject) ?? 0
            : skill.healthGivenByReceiver.get(end.subject) ?? 0;
        if (figure > 0) {
            stated.push({ part: { kind: OPENED_PART.skill, name: skill.name }, figure });
        }
    }
    if (isDamage) {
        // The dealing end's own cut, on both screens: `getPairGivingEnd` hands over whoever struck,
        // which is why the skills above read `damageDealtByOpponent` off it as well.
        const cut = end.figures.damageDealtWithoutSkillByOpponentAndKey.get(end.subject);
        if (cut === undefined) return stated;
        for (const [source, figure] of cut) {
            if (figure <= 0) continue;
            stated.push({ part: { kind: OPENED_PART.source, source }, figure });
        }
        return stated;
    }
    const cut = end.figures.healthGivenWithoutSkillByReceiverAndKey.get(end.subject);
    if (cut === undefined) return stated;
    for (const [source, figure] of cut) {
        if (figure > 0) stated.push({ part: { kind: OPENED_PART.source, source }, figure });
    }
    return stated;
}

/**
 * Whose row a pair's parts are read off, and how the cuts on it are keyed.
 *
 * It turns on the **direction** rather than on the quantity: mine where I gave it, theirs where I
 * received it. Written as a test for damage it would read as a fact about damage and be a fact
 * about giving, which is what kept healing off this rung.
 */
function getPairGivingEnd(
    statistics: FightStatistics,
    metric: PanelMetric,
    combatantId: number,
    otherId: number,
): { figures: CombatantFigures | undefined; subject: string } {
    if (getDirectionForMetric(metric) === PANEL_DIRECTION.received) {
        return { figures: statistics.byCombatantId.get(otherId), subject: `${combatantId}` };
    }
    return { figures: statistics.byCombatantId.get(combatantId), subject: `${otherId}` };
}

function tallyUnsharedPairParts(parts: readonly UnsharedPairPart[]): number {
    let total = 0;
    for (const pairPart of parts) {
        total += pairPart.figure;
    }
    return total;
}

/**
 * Where the closing row stands among the rows that take a place. Its figure decides, as every
 * other row's does — and on a tie it goes first, because `getTextForNamedPart` answers the empty
 * text for it and the order's tie-break is lexical (`develop ADR 0079`).
 */
function getPlaceForClosing(stated: readonly { figure: number }[], figure: number): number {
    let bigger = 0;
    for (const row of stated) {
        if (row.figure <= figure) continue;
        bigger += 1;
    }
    return bigger + 1;
}

export function presentOpenedLevel(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    combatantId: number,
): OpenedLevelContent | null {
    const combatant = roster.byId.get(combatantId);
    // Every row of a ranking opens, including a combatant nothing has named yet: they are on the
    // list at zero, and a row that drew nothing when it was pressed would leave the panel saying
    // the press did not land. What they open onto is the sentence saying they did nothing.
    const figures = statistics.byCombatantId.get(combatantId) ??
        (combatant === undefined ? undefined : createCombatantFigures());
    if (figures === undefined) return null;
    const cuts = getCutsForMetric(figures, metric);
    const total = getFigureForMetric(figures, metric);
    const unnamedOpened = presentUnnamedPairLevel(statistics, roster, metric, combatantId);
    const byOtherEnd = composeOpponentCut(
        cuts.byOtherEnd,
        statistics,
        roster,
        { figure: total, unnamedOpened },
        (otherId) => getPairTotal(figures, metric, otherId) !== null,
    );
    const byElement = cuts.byElement === null
        ? { rows: [], rest: null, noKind: null }
        : composeElementCut(
            cuts.byElement,
            total,
            0,
            (element) =>
                composePeopleForPart(statistics, figures, metric, combatantId, {
                    kind: OPENED_PART.element,
                    element,
                }) !== null,
        );
    const bySkill = composeSkillCut(statistics, figures, metric, total, combatantId);
    return {
        combatantId,
        name: combatant?.name ?? null,
        profession: combatant?.profession ?? null,
        byOtherEnd,
        bySkill,
        byElement,
        total,
        hasFiguresDisagreed: bySkill.hasFiguresDisagreed || byOtherEnd.hasFiguresDisagreed,
    };
}

/**
 * The closing row is the remainder rather than a second reading, and **every cut that is drawn
 * carries one**: a section whose rows came to less than the figure over them would be a column of
 * shares adding to ninety-something, which is a panel a reader cannot check.
 *
 * Only the dealing screen counts what stands in it. There the remainder is blows the game
 * announced nothing before, and the count is what a figure alone cannot say; on the healing
 * screens it is health that moved under a key naming no skill, which is not a number of
 * anything.
 */
function composeSkillCut(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    total: number,
    combatantId: number,
): SkillCut {
    const folded = composeSkillRows(statistics, figures, metric, combatantId);
    const stated = folded.rows;
    stated.sort(getSkillRowOrder);
    // What the bound would not give a row to counts as held, because the game **did** name it:
    // left out of this sum it would land in `closingFigure`, which says nothing announced the blow.
    const partsTotal = stated.reduce((sum, skillRow) => sum + skillRow.figure, folded.rest);
    // Drawn even where it landed nothing: three blows that were all blocked are three blows, and
    // a section that skipped them would say the combatant never struck.
    const closingFigure = total - partsTotal;
    // ⚠️ **On the healing screens this is nought by construction**, and it is not asserted
    // (`develop ADR 0051`): one condition in `src/core/fight-statistics.ts` sends a movement to a
    // skill's row or to the key cut, never to both and never to neither. It is not carried out
    // as a defect like the two `presentScreen` answers for, because those two are invisible
    // — a share divided by the wrong whole — and this one is not: a remainder draws a row of its
    // own, with the figure on it, where a reader can see it and add it up.
    const isCounted = metric === PANEL_METRIC.damageDealt;
    let hasClosing: boolean;
    if (closingFigure > 0) {
        hasClosing = true;
    } else if (isCounted) {
        hasClosing = figures.blowsWithoutSkill > 0;
    } else {
        hasClosing = false;
    }
    const hasRest = folded.rest > 0;
    // ⚠️ **The shares are composed from the clamped figure, never from the bare remainder.** A
    // row drawn at nought beside a share worked out from a figure below nothing prints
    // *Nie wiadomo* where the panel has just drawn a number, which is a row saying two things at
    // once. What the clamp hides is carried out of here instead.
    const closingFigureClamped = Math.max(closingFigure, 0);
    const figuresOnScreen = stated.map((skillRow) => skillRow.figure);
    if (hasRest) figuresOnScreen.push(folded.rest);
    if (hasClosing) figuresOnScreen.push(closingFigureClamped);
    const shares = formatSharesApportioned(figuresOnScreen, total);
    const largest = getLargestFigure(figuresOnScreen);
    return {
        rows: stated.map((skillRow, rowIndex) => ({
            ...skillRow,
            fill: getBarFill(skillRow.figure, largest),
            shareText: shares[rowIndex] ?? "",
        })),
        // ⚠️ **Last, because it is the only row of the section left holding no place.** What a
        // bound would not draw is never folded into the row below it (`develop ADR 0055`).
        rest: hasRest ? composeRestRow(folded.rest, largest, shares[stated.length] ?? "") : null,
        closing: hasClosing
            ? composeClosingRow({
                blows: isCounted ? figures.blowsWithoutSkill : null,
                doesOpenPart: composePeopleForPart(statistics, figures, metric, combatantId, {
                    kind: OPENED_PART.plain,
                }) !==
                    null,
                figure: closingFigureClamped,
                largest,
                stated,
                shareText: shares[stated.length + (hasRest ? 1 : 0)] ?? "",
            })
            : null,
        hasFiguresDisagreed: closingFigure < 0,
    };
}

/**
 * ⚠️ **A section is a cut of the figure over it, so a skill stands in it by what it did and never
 * by having been announced.** An announcement alone let auras, shouts and heals stand under
 * `Zadane` at nothing: 285 of the 685 skill rows over `captures/` on 2026-08-30, and 28 of
 * the 81 skills the corpus announces never deal anything at all.
 *
 * A blow that landed nothing still stands, which is what `blows` is for — cast eight times and
 * blocked eight times is a thing the reader did with damage in mind. Not one of those 28 ever
 * struck a blow or stated a figure against a name, so the two claims come apart cleanly.
 */
function composeSkillRows(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    combatantId: number,
): { rows: UnsharedSkill[]; rest: number } {
    const stated = composeSkillRowsStated(statistics, figures, metric, combatantId);
    // Asked by composing the level and counting it, rather than by a rule written beside the
    // composer: two spellings of one question disagree silently, and the reader meets the
    // disagreement as an arrow leading nowhere.
    const rows = stated.parts.map((unsharedPart) => ({
        ...unsharedPart,
        doesOpenPart:
            composePeopleForPart(statistics, figures, metric, combatantId, unsharedPart.part) !==
                null,
    }));
    return { rows, rest: stated.rest };
}

function composeSkillRowsStated(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    combatantId: number,
): FoldedParts {
    if (metric === PANEL_METRIC.healthRestored) {
        const named = composeSkillRowsReceived(
            statistics,
            combatantId,
            (skill) => skill.healthGivenByReceiver,
        );
        return composeFoldsJoined(
            named,
            composeSourceRows(figures.healthRestoredWithoutSkillByKey),
        );
    }
    // ⚠️ **The keys stand here and the elements do not, and the two are not the same list.** What
    // a blow was made of is a section of its own, so `dmgd` beside a skill would draw one figure
    // twice; what moved health **outside** a blow reached no skill at all, and leaving it out
    // closed it into a row named for a blow. `src/ui/panel-words.ts` keeps the two vocabularies
    // apart for the same reason. `develop ADR 0080`.
    if (metric === PANEL_METRIC.damageTaken) {
        const named = composeSkillRowsReceived(
            statistics,
            combatantId,
            (skill) => skill.damageDealtByOpponent,
        );
        return composeFoldsJoined(
            named,
            composeSourceRows(figures.damageTakenWithoutSkillByKey),
        );
    }
    const own = [...figures.skills.values()];
    if (metric === PANEL_METRIC.healthGiven) {
        const given = getGivenSourceCut(figures);
        return composeFoldsJoined({
            parts: own.filter((skill) => skill.healthGiven > 0).map((skill) => ({
                part: { kind: OPENED_PART.skill, name: skill.name },
                uses: skill.uses,
                figure: skill.healthGiven,
            })),
            // What the fold could not key travels with the section it was folded for, so the two
            // bounds on one path come to one row rather than to a shortfall nobody drew.
            rest: given.rest,
        }, composeSourceRows(given.cut));
    }
    return composeFoldsJoined({
        parts: own.filter((skill) => {
            if (skill.damageDealt > 0) return true;
            return skill.blows > 0;
        }).map((skill) => ({
            part: { kind: OPENED_PART.skill, name: skill.name },
            uses: skill.uses,
            figure: skill.damageDealt,
        })),
        rest: 0,
    }, composeSourceRows(figures.damageDealtWithoutSkillByKey));
}

/**
 * What reached this combatant, under the name it was announced by and never under whose it was:
 * two healers both announcing `Leczenie ran` put health in under one name, and this screen has no
 * column that could tell the two apart. A combatant's own casts count — health somebody put into
 * themselves is health they received.
 *
 * The announcement is kept on the record of whoever made it, so a received figure is cut by
 * walking everybody rather than by reading one row. Which cut of theirs answers is the caller's:
 * `healthGivenByReceiver` where health arrived, `damageDealtByOpponent` where a blow did.
 */
function composeSkillRowsReceived(
    statistics: FightStatistics,
    combatantId: number,
    getCut: (skill: SkillFigures) => FigureCut,
): FoldedParts {
    const byName = new Map<string, number>();
    let rest = 0;
    for (const combatantFigures of statistics.byCombatantId.values()) {
        for (const skill of combatantFigures.skills.values()) {
            const figure = getCut(skill).get(`${combatantId}`) ?? 0;
            if (figure <= 0) continue;
            if (byName.has(skill.name)) {
                byName.set(skill.name, (byName.get(skill.name) ?? 0) + figure);
                continue;
            }
            // S11: the bound holds the fold rather than an assertion standing beside it — and
            // what it will not give a row to is summed, never dropped (`develop ADR 0055`).
            if (byName.size >= SKILLS_MAXIMUM) {
                rest += figure;
                continue;
            }
            byName.set(skill.name, figure);
        }
    }
    // No count: the announcement was somebody else's, and how many times it was made says
    // nothing about how much of what came of it reached this row.
    const parts = [...byName].map(([name, figure]) => ({
        part: { kind: OPENED_PART.skill, name },
        uses: null,
        figure,
    }));
    return { parts, rest };
}

/** Two folds drawn as one section, so what neither could fit is one row rather than two. */
function composeFoldsJoined(skillFold: FoldedParts, sourceFold: FoldedParts): FoldedParts {
    return {
        parts: [...skillFold.parts, ...sourceFold.parts],
        rest: skillFold.rest + sourceFold.rest,
    };
}

/**
 * What the game named and no announcement did, as rows of its own rather than as a row saying the
 * game had not told us — because it had.
 *
 * The help calls `heal` an effect spread over time, fired in a turn the combatant stands below the
 * health they started the fight with and weakening by a twentieth of its opening value each time
 * (article `view,372`, read 2026-08-26): what is missing over it is an **announcement**, not a
 * name, and a player reads a row saying otherwise as the panel having lost the figure. Over
 * `captures/` on 2026-08-30 the whole of it is three keys — `heal` 89.1%, `legbon_lastheal`
 * 7.9% and `legbon_holytouch_heal` 3.0%, of 1,429,693 points — and the last two are legendary
 * bonuses rather than a regeneration, which is why the section names each and not the lot.
 */
function composeSourceRows(cut: FigureCut): FoldedParts {
    const stated: UnsharedPart[] = [];
    let rest = 0;
    for (const [source, figure] of cut) {
        if (figure <= 0) continue;
        // No count: the protocol states no number of applications of a key.
        if (stated.length < CUT_PARTS_MAXIMUM) {
            stated.push({ part: { kind: OPENED_PART.source, source }, uses: null, figure });
            continue;
        }
        rest += figure;
    }
    return { parts: stated, rest };
}

/**
 * The keys behind what this combatant **gave**, folded out of the cut that keeps them per pair.
 *
 * Folded rather than kept flat, and that is the whole of why the flat cut does not exist: a key
 * belongs to whoever received the health, so it may stand on a giver's row only where the row
 * above names the receiver. Here the section is a cut of the giver's own figure and the pairs it
 * is made of are one rung down, so folding is a reading of their own figure and not a claim about
 * somebody else's cause.
 */
function getGivenSourceCut(figures: CombatantFigures): { cut: FigureCut; rest: number } {
    const folded = new Map<string, number>();
    let rest = 0;
    for (const cut of figures.healthGivenWithoutSkillByReceiverAndKey.values()) {
        // The fold runs over every receiver, so its own bound is the panel's (**S11**): what
        // `core/` holds is one receiver's cut and not the union of twenty. What it will not hold
        // travels out with it, because the section below owes it a row (`develop ADR 0055`).
        rest += addFoldedCut(folded, cut);
    }
    return { cut: folded, rest };
}

/** Largest first, and a tie broken by the text a part is named with — `ranked-order.ts` owns it. */
function getSkillRowOrder(leftSkill: UnsharedSkill, rightSkill: UnsharedSkill): number {
    return getRankedOrder(
        leftSkill.figure,
        rightSkill.figure,
        getTextForNamedPart(leftSkill.part),
        getTextForNamedPart(rightSkill.part),
    );
}

/**
 * What a bound would not give a row to, summed. It holds no place, which is `develop ADR 0079`'s
 * test: its figure grows with how many we could not fit rather than with what any one of them did.
 */
function composeRestRow(figure: number, largest: number, shareText: string): PlainRow {
    return { blows: null, figure, fill: getBarFill(figure, largest), shareText };
}

/** The row a section closes against, and the place its own figure earns it (`develop ADR 0079`). */
function composeClosingRow(
    said: {
        blows: number | null;
        doesOpenPart: boolean;
        figure: number;
        largest: number;
        stated: readonly { figure: number }[];
        shareText: string;
    },
): ClosingRow {
    return {
        blows: said.blows,
        rank: getPlaceForClosing(said.stated, said.figure),
        doesOpenPart: said.doesOpenPart,
        figure: said.figure,
        fill: getBarFill(said.figure, said.largest),
        shareText: said.shareText,
    };
}
