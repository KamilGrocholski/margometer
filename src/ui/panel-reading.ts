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
    type FightOutcome,
    type FightStatistics,
    type FigureCut,
    initCombatantFigures,
    type SkillFigures,
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
    formatChargedRows,
    formatGrammarRefusedSuspicion,
    formatJoinedInProgressSuspicion,
    formatLostMessageSuspicion,
    formatNoParameterRowSuspicion,
    formatNoParameterSuspicion,
    formatShare,
    formatShares,
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
 * Raw stands beside applied and is never taken from it: their difference is not what a defence
 * stopped, and the protocol reports neither armour nor resistance
 * (`src/core/fight-statistics.ts`).
 */
export interface RowDetail {
    level: number | null;
    damageDealtApplied: number;
    damageTakenApplied: number;
    /**
     * **The raw of the blows, and never the raw of the figure beside it.** The protocol states a
     * figure before reduction on a blow and nowhere else, while an applied figure grows from
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
     * (`develop:docs/turns-taken.md`), and a nought drawn there would be **E10**'s substitute for a
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
    statisticsDestroyed: readonly CutPart[];
    /**
     * This person's own share of the fight's two suspicions, which is what puts a mark on their row
     * rather than under the whole list (`src/core/fight-statistics.ts` says why neither sums to
     * the fight's own count).
     */
    unreadMessagesUnknownKey: number;
    unreadMessagesNoParameter: number;
    castsUnplaced: number;
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
export const PINNED_STANDING = { apart: "apart", cut: "cut" } as const;
export type PinnedStanding = VocabularyWord<typeof PINNED_STANDING>;

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

/** And the same figure cut by the key it was stated under, which is what it was dealt with. */
const HALF_NAMED_KIND_FIELD = {
    damageTakenFromNobodyByElement: "damageTakenFromNobodyByElement",
    damageDealtToNobodyByElement: "damageDealtToNobodyByElement",
    healthRestoredByNobodyBySource: "healthRestoredByNobodyBySource",
} as const;
type HalfNamedKindField = VocabularyWord<typeof HALF_NAMED_KIND_FIELD>;

interface PinnedShape {
    metric: PanelMetric;
    end: PanelUnnamedEnd;
    standing: PinnedStanding;
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
    standing: PinnedStanding;
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
 * Nothing on it opens. A pair between somebody and nobody is not a pair, and a kind under it
 * would be a cut of a cut the statistics do not keep.
 */
export interface HalfNamedReading {
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
    neither: UnnamedRow | null;
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
export type HalfNamedDrillReading =
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
        neither: UnnamedRow | null;
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

export interface ShelfRow {
    openedAt: number;
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
}

export interface ScreenReading {
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
    visibleRows: number;
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
    part: PanelSidePart | null;
}

/** Null without a seat: two sides nothing can tell apart are not two figures. */
export interface PanelSides {
    reader: number;
    opposing: number;
    nobody: number;
}

/** Which part of the bar a figure belongs to. `nobody` is a refusal, never a third side. */
export const SIDE_PART = { reader: "reader", opposing: "opposing", nobody: "nobody" } as const;
export type PanelSidePart = VocabularyWord<typeof SIDE_PART>;

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
    place: number;
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
    plain: ClosingRow | null;
}

/**
 * The card stands over this row too, so the row carries what the card states — the same figures
 * the ranking's own row holds, because the card is about the person and not about the cut.
 */
export interface OpponentRow extends PersonRow {
    doesOpenPair: boolean;
}

export interface OpponentCut {
    rows: OpponentRow[];
    unnamed: UnnamedRow | null;
}

export interface ElementCut {
    rows: ElementRow[];
    /**
     * What a fold could not give a key of its own to, summed — never the row below it, which
     * is what the protocol stated no kind of at all. `develop ADR 0055`.
     */
    rest: UnnamedRow | null;
    unnamed: UnnamedRow | null;
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
export interface PairReading {
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
export interface PartReading {
    part: OpenedPart;
    total: number;
    byOpponent: OpponentCut;
}

export interface DrillReading {
    combatantId: number;
    name: string | null;
    profession: string | null;
    byOpponent: OpponentCut;
    /**
     * What the figure was done with, on the screen the protocol states it for. Empty on the
     * others: what hit you is named and what the other side chose never is.
     */
    bySkill: SkillCut;
    byElement: ElementCut;
    total: number;
    /** The answer `SkillCut` states, where the level that holds it is the one a reader opened. */
    hasFiguresDisagreed: boolean;
}

interface MetricCuts {
    byOpponent: FigureCut;
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

/**
 * A row for everybody a fight holds, counted off the roster rather than typed beside it: the
 * twenty was already in this file under its own name, two lines below, and one of the two would
 * have moved without the other.
 */
const ROWS_MAXIMUM = COMBATANTS_MAXIMUM;
/** As many parts as the widest cut a card draws: the kinds, the defences, the procs. */
export const CUT_PARTS_MAXIMUM = 64;
/**
 * What one combatant's own skills are kept inside: 81 names over `captures/`, 2026-08-29.
 */
export const SKILLS_MAXIMUM = 256;
/**
 * The ranking's height, in bars. Ten is the most one side fields and eleven the most a whole fight
 * does, measured over `captures/`, where a group fight is ten of ours against one. A bigger
 * fight scrolls rather than growing the window: a ranking is watched while a fight is on, and a
 * height that changed as combatants joined would move it under the reader's hand.
 */
const RANKING_ROWS = 11;
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
        metric: PANEL_METRIC.damageDealtApplied,
        end: UNNAMED_END.actor,
        standing: PINNED_STANDING.apart,
        field: HALF_NAMED_FIELD.damageTakenFromNobody,
        kinds: HALF_NAMED_KIND_FIELD.damageTakenFromNobodyByElement,
    },
    givenWithNoActor: {
        metric: PANEL_METRIC.healthGiven,
        end: UNNAMED_END.actor,
        standing: PINNED_STANDING.apart,
        field: HALF_NAMED_FIELD.healthRestoredByNobody,
        kinds: HALF_NAMED_KIND_FIELD.healthRestoredByNobodyBySource,
    },
    takenWithNoActor: {
        metric: PANEL_METRIC.damageTakenApplied,
        end: UNNAMED_END.actor,
        standing: PINNED_STANDING.cut,
        field: HALF_NAMED_FIELD.damageTakenFromNobody,
        kinds: HALF_NAMED_KIND_FIELD.damageTakenFromNobodyByElement,
    },
    takenWithNoTarget: {
        metric: PANEL_METRIC.damageTakenApplied,
        end: UNNAMED_END.target,
        standing: PINNED_STANDING.apart,
        field: HALF_NAMED_FIELD.damageDealtToNobody,
        kinds: HALF_NAMED_KIND_FIELD.damageDealtToNobodyByElement,
    },
    restoredWithNoActor: {
        metric: PANEL_METRIC.healthRestored,
        end: UNNAMED_END.actor,
        standing: PINNED_STANDING.cut,
        field: HALF_NAMED_FIELD.healthRestoredByNobody,
        kinds: HALF_NAMED_KIND_FIELD.healthRestoredByNobodyBySource,
    },
};

/** In the order the screens pin them, which is the order a screen's two are drawn in. */
export const PINNED_CASES = Object.values(PINNED_CASE);

export const NOTHING_SUSPECT: FightSuspicions = {
    messagesLost: 0,
    hasJoinedInProgress: false,
    messagesRead: 0,
};

/** The list below is the bound, not anything a fight can do. */
const WARNINGS_MAXIMUM = 6;
/** And a row carries the three of the six that can be charged to one person. */
const ROW_WARNINGS = 3;

export function getEndForPinned(kase: PinnedCase): PanelUnnamedEnd {
    return PINNED_SHAPES[kase].end;
}

export function getMetricForPinned(kase: PinnedCase): PanelMetric {
    return PINNED_SHAPES[kase].metric;
}

/**
 * Which of the five a screen and an end come to, or nothing where that screen pins no such end.
 * Null is the answer a press deserves: a mark left over from another screen names no figure here,
 * and opening the screen's other end instead would be a level about something else.
 */
export function lookupPinnedCase(metric: PanelMetric, end: PanelUnnamedEnd): PinnedCase | null {
    const found = PINNED_CASES.filter((kase) => {
        const shape = PINNED_SHAPES[kase];
        if (shape.metric !== metric) return false;
        return shape.end === end;
    });
    return found[0] ?? null;
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
        said.push(formatUnplacedHealRowSuspicion(detail.castsUnplaced));
    }
    return said.filter((one) => one.length > 0).slice(0, ROW_WARNINGS);
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
    return detail.castsUnplaced > 0;
}

export function presentHalfNamed(
    statistics: FightStatistics,
    roster: CombatantRoster,
    kase: PinnedCase,
    choice: PanelSideChoice,
    readerSide: number | null,
): HalfNamedReading | null {
    const { parts, part } = composeHalfNamedListing(statistics, roster, kase, choice, readerSide);
    const total = getPinnedFigure(statistics, kase, parts, part);
    if (total <= 0) return null;
    const neither = getNeitherEndForPinned(statistics, kase, part);
    const largest = getLargestFigure([...parts.map((one) => one.figure), neither]);
    const shares = formatShares([...parts.map((one) => one.figure), neither], total);
    return {
        case: kase,
        end: getEndForPinned(kase),
        total,
        rows: composeHalfNamedRows(statistics, roster, parts, shares, largest),
        kinds: composeHalfNamedKinds(statistics, kase, parts, neither, total),
        neither: neither <= 0 ? null : {
            figure: neither,
            fill: getFill(neither, largest),
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
    kase: PinnedCase,
    choice: PanelSideChoice,
    readerSide: number | null,
): HalfNamedListing {
    const metric = getMetricForPinned(kase);
    const listed = composeUnsharedRows(statistics, roster, metric).filter((row) =>
        getIsRowListed(row.side, choice, readerSide)
    );
    const part = getPartListed(choice, readerSide);
    return {
        parts: composeHalfNamedParts(statistics, roster, kase, listed, part, readerSide),
        part,
    };
}

function composeUnsharedRows(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
): UnsharedRow[] {
    const rows: UnsharedRow[] = [];
    const seen = new Set<number>();
    for (const [combatantId, figures] of statistics.byCombatantId) {
        seen.add(combatantId);
        const held = roster.byId.get(combatantId);
        rows.push({
            combatantId,
            name: held?.name ?? null,
            side: held?.side ?? null,
            profession: held?.profession ?? null,
            figure: getFigure(figures, metric),
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

function getFigure(figures: CombatantFigures, metric: PanelMetric): number {
    const figure = figures[metric];
    return figure;
}

/**
 * A combatant with no side belongs to neither, so a one-side list leaves them out rather than
 * putting them on the side that happens to be showing; they are drawn under everybody, where
 * saying nothing about their side costs nothing. With no seat to read from, every list is
 * everybody: a filter that cannot tell the two apart is a filter that would guess.
 */
function getIsRowListed(
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
 * seat to read from, every list is everybody: `getIsRowListed` answers that way and this has to
 * answer the same, or a figure would be charged to a side no row was filtered by.
 */
function getPartListed(choice: PanelSideChoice, readerSide: number | null): PanelSidePart | null {
    if (choice === SIDE_CHOICE.everyone) return null;
    if (readerSide === null) return null;
    if (choice === SIDE_CHOICE.reader) return SIDE_PART.reader;
    return SIDE_PART.opposing;
}

/**
 * The end the game **did** name, person by person — **one walk, read by both the pinned row and
 * the level under it**, so a figure and what stands beneath it cannot disagree. Which field is
 * walked is `PINNED_SHAPES`', and which people are kept turns on the standing:
 *
 * - `cut` — the rows the list is showing, because on those screens the listed row **is** the named
 *   end. No inference is involved.
 * - `apart` under one side — whoever the strip charges that side with, which is develop ADR 0013's
 *   rule read through `getPartCharged`. There is one copy of it, and the strip reads the same one.
 * - `apart` under everybody — everyone the statistics hold.
 *
 * What names **neither** end is on nobody's row and is added by the caller, never here.
 */
function composeHalfNamedParts(
    statistics: FightStatistics,
    roster: CombatantRoster,
    kase: PinnedCase,
    rows: readonly UnsharedRow[],
    part: PanelSidePart | null,
    readerSide: number | null,
): HalfNamedPart[] {
    const shape = PINNED_SHAPES[kase];
    const listed = new Set(rows.map((one) => one.combatantId));
    const found: HalfNamedPart[] = [];
    for (const [combatantId, figures] of statistics.byCombatantId) {
        const figure = figures[shape.field];
        if (figure <= 0) continue;
        const held = getPartOfSide(roster.byId.get(combatantId)?.side ?? null, readerSide);
        if (!getIsHalfNamedKept(shape, held, listed.has(combatantId), part)) continue;
        found.push({ combatantId, figure });
    }
    return found;
}

/** The three rules the paragraph above states, as the one condition each of them is. */
function getIsHalfNamedKept(
    shape: PinnedShape,
    held: PanelSidePart,
    isListed: boolean,
    part: PanelSidePart | null,
): boolean {
    if (shape.standing === PINNED_STANDING.cut) return isListed;
    if (part === null) return true;
    return getPartCharged(held, shape.metric) === part;
}

/**
 * Which side is charged with a figure the protocol left half-named — **the one inference this
 * panel draws, and the only place it draws one. develop ADR 0013.**
 *
 * The known end is a side: the roster places the row the message did name. The unknown end is
 * derived from it, and the derivation is the noun's — damage crosses, healing does not. What is
 * never derived is a **name**: the pinned rows go on saying which end the game left out.
 */
function getPartCharged(part: PanelSidePart, metric: PanelMetric): PanelSidePart {
    if (part === SIDE_PART.nobody) return part;
    if (metric === PANEL_METRIC.healthGiven) return part;
    if (metric === PANEL_METRIC.healthRestored) return part;
    return part === SIDE_PART.reader ? SIDE_PART.opposing : SIDE_PART.reader;
}

/**
 * What the pinned figure comes to: the sum of the level under it, and what named neither end where
 * that is inside the same count.
 *
 * Only damage can name neither end, and only a figure standing `apart` holds it: a `cut` is summed
 * over rows the list already draws, and nobody's row is not one of them. Under one side it drops
 * out too — `getPartCharged` charges from a row, and there is no row to charge from.
 */
function getPinnedFigure(
    statistics: FightStatistics,
    kase: PinnedCase,
    parts: readonly HalfNamedPart[],
    part: PanelSidePart | null,
): number {
    let total = 0;
    for (const one of parts) total += one.figure;
    total += getNeitherEndForPinned(statistics, kase, part);
    return total;
}

function getNeitherEndForPinned(
    statistics: FightStatistics,
    kase: PinnedCase,
    part: PanelSidePart | null,
): number {
    const shape = PINNED_SHAPES[kase];
    if (part !== null) return 0;
    if (shape.standing === PINNED_STANDING.cut) return 0;
    if (getNounForMetric(shape.metric) === PANEL_NOUN.healing) return 0;
    return statistics.byNeitherEnd;
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
    const rows = parts.map((one, at): HalfNamedRow => {
        const held = roster.byId.get(one.combatantId);
        return {
            combatantId: one.combatantId,
            name: held?.name ?? null,
            side: held?.side ?? null,
            profession: held?.profession ?? null,
            figure: one.figure,
            fill: getFill(one.figure, largest),
            shareText: shares[at] ?? "",
            detail: composeRowDetailFor(statistics, roster, one.combatantId),
        };
    });
    rows.sort((one, other) =>
        getRankedOrder(one.figure, other.figure, one.name ?? "", other.name ?? "")
    );
    // No bound of its own: a level is cut out of the list above it, which `presentScreen`
    // has already held to `ROWS_MAXIMUM`. One here is a second guard on one hazard, and nothing
    // can reach it — **W4**.
    return rows;
}

function getFill(figure: number, largest: number): number {
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
        statistics.byCombatantId.get(combatantId) ?? initCombatantFigures(),
        roster.byId.get(combatantId)?.level ?? null,
        getWasTurnLostRead(statistics),
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
): RowDetail {
    return {
        level,
        damageDealtApplied: figures.damageDealtApplied,
        damageTakenApplied: figures.damageTakenApplied,
        damageDealtRaw: figures.damageDealtRaw,
        damageTakenRaw: figures.damageTakenRaw,
        healthGiven: figures.healthGiven,
        healthRestored: figures.healthRestored,
        damagePrevented: figures.damagePrevented,
        blowsStruck: figures.blowsStruck,
        blowsWithoutSkill: figures.blowsWithoutSkill,
        skillUses: getSkillUses(figures),
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
        statisticsDestroyed: composeCutParts(figures.statisticsDestroyed),
        unreadMessagesUnknownKey: figures.unreadMessagesUnknownKey,
        unreadMessagesNoParameter: figures.unreadMessagesNoParameter,
        castsUnplaced: figures.castsUnplaced,
    };
}

function getSkillUses(figures: CombatantFigures): number {
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
        // The panel's own bound and not `core/`'s (**S11**): nothing here may lean on an
        // assertion a layer below it makes, and that layer's own cut is narrower, so a card
        // drawn over any recording loses nothing to this.
        if (parts.length >= CUT_PARTS_MAXIMUM) break;
    }
    parts.sort((one, other) => getRankedOrder(one.figure, other.figure, one.key, other.key));
    return parts;
}

/**
 * Whether this reading heard a lost turn at all, which one combatant's nought cannot say.
 *
 * ⚠️ **The bound is the panel's own and it stops the walk short rather than asserting** (**S11**,
 * **A11**, the rule `composeCutParts` above keeps). Stopping short can only answer *not heard*
 * where one was, which draws the taken count alone — the side that claims less.
 */
function getWasTurnLostRead(statistics: FightStatistics): boolean {
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
    kase: PinnedCase,
    parts: readonly HalfNamedPart[],
    neither: number,
    total: number,
): ElementCut {
    const shape = PINNED_SHAPES[kase];
    const folded = new Map<string, number>();
    let rest = 0;
    for (const one of parts) {
        const figures = statistics.byCombatantId.get(one.combatantId);
        if (figures === undefined) continue;
        rest += addFoldedCut(folded, figures[shape.kinds]);
    }
    if (neither > 0) rest += addFoldedCut(folded, statistics.byNeitherEndByElement);
    // A key standing only for what named neither end has nobody's row to open onto, and a level
    // holding one refusal says nothing the row above it did not.
    return composeElementCut(folded, total, (element) => {
        return getHalfNamedByKind(statistics, shape.kinds, parts, element).length > 0;
    }, rest);
}

/**
 * One person's own cut into the fold, under the key the protocol wrote it with — and the figure it
 * could not give a key of its own to, which the caller owes a row (`develop ADR 0055`).
 */
function addFoldedCut(folded: Map<string, number>, held: FigureCut): number {
    let rest = 0;
    for (const [key, figure] of held) {
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
 * breath — a blow's elements beside its applied damage, a bare movement's key beside the health it
 * took, a restoring key beside what it put back — so a kind cut comes to the figure it is a cut
 * of. Measured over `captures/` on 2026-08-30: 0 of 1,060 combatant-and-screen readings.
 *
 * It stays as a row rather than becoming a check of any kind: this is four call sites agreeing,
 * and a fifth that forgot the cut should leave a reader a row saying so.
 */
function composeElementCut(
    cut: FigureCut,
    total: number,
    doesOpen: (element: string) => boolean,
    /** What a fold gave no key of its own to. Held, because the protocol did state it. */
    rest = 0,
): ElementCut {
    const stated: Array<{ element: string; figure: number }> = [];
    let held = rest;
    for (const [element, figure] of cut) {
        held += figure;
        // A part that came to nothing is not a part of the figure: it takes a row and adds none
        // of it. The combatant at zero on a ranking is the other case and is still drawn — that
        // is a person who did nothing, and this is a nothing that has no person.
        if (figure > 0) stated.push({ element, figure });
    }
    stated.sort(compareElementRows);
    const unnamed = total - held;
    const figures = stated.map((one) => one.figure);
    if (rest > 0) figures.push(rest);
    if (unnamed > 0) figures.push(unnamed);
    const shares = formatShares(figures, total);
    const largest = getLargestFigure(figures);
    const closing = stated.length + (rest > 0 ? 1 : 0);
    return {
        rows: stated.map((one, at) => ({
            ...one,
            doesOpenPart: doesOpen(one.element),
            fill: getFill(one.figure, largest),
            shareText: shares[at] ?? "",
        })),
        rest: rest > 0
            ? {
                figure: rest,
                fill: getFill(rest, largest),
                shareText: shares[stated.length] ?? "",
            }
            : null,
        unnamed: unnamed > 0
            ? {
                figure: unnamed,
                fill: getFill(unnamed, largest),
                shareText: shares[closing] ?? "",
            }
            : null,
    };
}

/** By figure, then by the token, so a cut redrawn without changing states the same order. */
function compareElementRows(one: { element: string; figure: number }, other: {
    element: string;
    figure: number;
}): number {
    if (one.figure !== other.figure) return other.figure - one.figure;
    return one.element < other.element ? -1 : 1;
}

/** Whoever carries one key of a half-named figure, with the part of it their row holds. */
function getHalfNamedByKind(
    statistics: FightStatistics,
    kinds: HalfNamedKindField,
    parts: readonly HalfNamedPart[],
    element: string,
): HalfNamedPart[] {
    const found: HalfNamedPart[] = [];
    for (const one of parts) {
        const figures = statistics.byCombatantId.get(one.combatantId);
        if (figures === undefined) continue;
        const figure = figures[kinds].get(element) ?? 0;
        if (figure <= 0) continue;
        found.push({ combatantId: one.combatantId, figure });
    }
    return found;
}

/**
 * What stands under one row of a pinned level, composed only when a reader asks for it. Null where
 * the row pressed is not on that level — a mark left over from another screen, or a person the
 * narrowing has since dropped — because a level of somebody else's figure is worse than none.
 *
 * Both shapes are read off the listing the level above was drawn from, so a figure here is a part
 * of the figure there by construction. Nothing on this level opens: it is the third.
 */
export function presentHalfNamedDrill(
    statistics: FightStatistics,
    roster: CombatantRoster,
    kase: PinnedCase,
    choice: PanelSideChoice,
    readerSide: number | null,
    opened: HalfNamedOpened,
): HalfNamedDrillReading | null {
    const { parts, part } = composeHalfNamedListing(statistics, roster, kase, choice, readerSide);
    if (opened.kind === HALF_NAMED_OPENED.person) {
        return composeHalfNamedForPerson(statistics, roster, kase, parts, opened.combatantId);
    }
    return composeHalfNamedForKind(statistics, roster, kase, { parts, part }, opened);
}

/** One person's share of a half-named figure, cut by what the protocol says it was dealt with. */
function composeHalfNamedForPerson(
    statistics: FightStatistics,
    roster: CombatantRoster,
    kase: PinnedCase,
    parts: readonly HalfNamedPart[],
    combatantId: number,
): HalfNamedDrillReading | null {
    const held = parts.find((one) => one.combatantId === combatantId);
    if (held === undefined) return null;
    const figures = statistics.byCombatantId.get(combatantId);
    if (figures === undefined) return null;
    const [row] = composeHalfNamedRows(statistics, roster, [held], ["100%"], held.figure);
    if (row === undefined) return null;
    return {
        opened: HALF_NAMED_OPENED.person,
        case: kase,
        row,
        total: held.figure,
        kinds: composeElementCut(figures[PINNED_SHAPES[kase].kinds], held.figure, () => false),
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
    kase: PinnedCase,
    listing: HalfNamedListing,
    opened: { kind: typeof HALF_NAMED_OPENED.element; element: string },
): HalfNamedDrillReading | null {
    const shape = PINNED_SHAPES[kase];
    const found = getHalfNamedByKind(statistics, shape.kinds, listing.parts, opened.element);
    if (found.length === 0) return null;
    const apart = getNeitherEndForPinned(statistics, kase, listing.part);
    const neither = apart <= 0 ? 0 : statistics.byNeitherEndByElement.get(opened.element) ?? 0;
    let total = neither;
    for (const one of found) total += one.figure;
    if (total <= 0) return null;
    const figures = [...found.map((one) => one.figure), neither];
    const shares = formatShares(figures, total);
    const largest = getLargestFigure(figures);
    return {
        opened: HALF_NAMED_OPENED.element,
        case: kase,
        element: opened.element,
        end: shape.end,
        total,
        rows: composeHalfNamedRows(statistics, roster, found, shares, largest),
        neither: neither <= 0 ? null : {
            figure: neither,
            fill: getFill(neither, largest),
            shareText: shares[found.length] ?? "",
        },
    };
}

export function getOutcomeForSeat(
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
    if (getIsOurSideNamed(roster, readerSide, outcome.wonNames)) return OUTCOME_RESULT.won;
    if (getIsOurSideNamed(roster, readerSide, outcome.lostNames)) return OUTCOME_RESULT.lost;
    return null;
}

function getIsOurSideNamed(
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
): ScreenReading {
    const found = composeUnsharedRows(statistics, roster, metric).filter((row) =>
        getIsRowListed(row.side, choice, readerSide)
    );
    found.sort(compareRows);
    // **S11, and it is where the bound has to be**: after the sort, so a cast past it costs the
    // smallest figures rather than whichever rows the fold reached last, and before every figure
    // derived from the list, so the column a reader adds up is the column that was drawn. The
    // strip under the list is composed off the statistics and still totals everybody.
    const listed = found.slice(0, ROWS_MAXIMUM);
    const total = getListedTotal(statistics, listed, metric, choice);
    const pinned = composePinnedFigures(statistics, roster, listed, metric, choice, readerSide);
    const sides = composePanelSides(statistics, roster, metric, readerSide);
    const part = getPartListed(choice, readerSide);
    // Only a figure standing apart joins the whole: one standing as a cut is already inside the
    // rows, so paying it out of the hundred would take a point off a row that owns one.
    const apart = pinned.filter((one) => one.standing === PINNED_STANDING.apart);
    const placed = apart.reduce((sum, one) => sum + one.figure, total);
    // ⚠️ **The second count, and the whole reason there are two.** Everything above is composed
    // from the rows; this is composed from the statistics and never looks at them, so the
    // difference is what the screen holds and no row does. Not the rows' own total: a whole
    // derived from the figures being shared makes the column read a hundred whatever went missing
    // on the way to it.
    const counted = getCountedTotal(statistics, sides, metric, part);
    const outside = Math.max(counted - placed, 0);
    const whole = placed + outside;
    const shared = [...listed.map((row) => row.figure), ...apart.map((one) => one.figure)];
    if (outside > 0) shared.push(outside);
    const shares = formatShares(shared, whole);
    const largest = getLargestFigure([...shared, ...pinned.map((one) => one.figure)]);
    const rows = listed.map((row, at) => ({
        ...row,
        fill: getFill(row.figure, largest),
        shareText: shares[at] ?? "",
        detail: composeRowDetailFor(statistics, roster, row.combatantId),
    }));
    return {
        rows,
        // The rows holding **more** than the screen's own count is the other side of `unplaced`,
        // and the one that says a drawn figure is wrong rather than short.
        hasFiguresDisagreed: counted < placed || getWholeDisagreesWithSide(whole, sides, part) ||
            pinned.some((one) => getPinnedDisagrees(statistics, one.case, one.figure, part)),
        outcome: getOutcomeForReader(statistics, roster, readerSide),
        ...composeHeadcount(statistics, roster, readerSide),
        total,
        pinned: composePinnedRows(pinned, shares.slice(listed.length), whole, largest),
        outsideRanking: outside > 0
            ? {
                figure: outside,
                fill: getFill(outside, largest),
                shareText: shares[shared.length - 1] ?? "",
            }
            : null,
        suspicions: composeSuspicions(statistics, roster, metric, suspicions),
        sides,
        // Read off what the list is, and never off what was pressed: with no seat to read from
        // every list is everybody, whatever the strip last answered, and a shorter window would
        // be the height of a side nothing narrowed to.
        visibleRows: part === null ? RANKING_ROWS : SIDE_ROWS,
    };
}

/** By figure, then by id — a tie broken by something that does not move between draws. */
function compareRows(one: UnsharedRow, other: UnsharedRow): number {
    if (one.figure !== other.figure) return other.figure - one.figure;
    return one.combatantId - other.combatantId;
}

/**
 * What the shares on this list are measured against: the fight's own total under everybody, and
 * the listed side's under either of the other two. A one-side list whose shares came to a fifth
 * of a percent would be answering a question nobody on that list asked.
 */
function getListedTotal(
    statistics: FightStatistics,
    rows: readonly UnsharedRow[],
    metric: PanelMetric,
    choice: PanelSideChoice,
): number {
    if (choice === SIDE_CHOICE.everyone) return getFigure(statistics.totals, metric);
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
    const part = getPartListed(choice, readerSide);
    const found: Array<Omit<PinnedRow, "fill" | "shareText">> = [];
    const pinned = PINNED_CASES.filter((kase) => PINNED_SHAPES[kase].metric === metric);
    for (const kase of pinned) {
        const parts = composeHalfNamedParts(statistics, roster, kase, rows, part, readerSide);
        const figure = getPinnedFigure(statistics, kase, parts, part);
        // A figure of nothing is not pinned, and its cut is a cut of nothing: the fold below
        // states a figure there is some of, so it is asked only where the row will be drawn.
        if (figure <= 0) continue;
        const shape = PINNED_SHAPES[kase];
        const neither = getNeitherEndForPinned(statistics, kase, part);
        found.push({
            case: kase,
            end: shape.end,
            standing: shape.standing,
            figure,
            kinds: composeHalfNamedKinds(statistics, kase, parts, neither, figure),
        });
    }
    return found;
}

function composePanelSides(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    readerSide: number | null,
): PanelSides | null {
    if (readerSide === null) return null;
    const totals: Record<PanelSidePart, number> = { reader: 0, opposing: 0, nobody: 0 };
    for (const [combatantId, figures] of statistics.byCombatantId) {
        const part = getPartOfSide(roster.byId.get(combatantId)?.side ?? null, readerSide);
        totals[part] += getFigure(figures, metric);
        totals[getPartCharged(part, metric)] += getHalfNamed(figures, metric);
    }
    totals.nobody += getWithNeitherEnd(statistics, metric);
    return totals;
}

function getHalfNamed(figures: CombatantFigures, metric: PanelMetric): number {
    if (metric === PANEL_METRIC.damageDealtApplied) return figures.damageTakenFromNobody;
    if (metric === PANEL_METRIC.damageTakenApplied) return figures.damageDealtToNobody;
    if (metric === PANEL_METRIC.healthGiven) return figures.healthRestoredByNobody;
    return 0;
}

/** What names neither end, which belongs to no side at all and is only ever damage. */
function getWithNeitherEnd(statistics: FightStatistics, metric: PanelMetric): number {
    if (metric === PANEL_METRIC.damageDealtApplied) return statistics.byNeitherEnd;
    if (metric === PANEL_METRIC.damageTakenApplied) return statistics.byNeitherEnd;
    return 0;
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
    part: PanelSidePart | null,
): number {
    if (part === null) {
        return getFigure(statistics.totals, metric) + getNobodyForMetric(statistics, metric);
    }
    if (sides === null) return 0;
    if (part === SIDE_PART.reader) return sides.reader;
    if (part === SIDE_PART.opposing) return sides.opposing;
    return sides.nobody;
}

/**
 * The one fight-wide figure each screen keeps off every combatant's row. Three of them already
 * reach a pinned row standing apart, so under everybody they are inside the count twice over —
 * once here and once as that row — and the two are held to each other by `getPinnedDisagrees`.
 * The fourth reaches no row at all, which is what the section under the list is for.
 */
function getNobodyForMetric(statistics: FightStatistics, metric: PanelMetric): number {
    if (metric === PANEL_METRIC.damageDealtApplied) return statistics.dealtByNobody;
    if (metric === PANEL_METRIC.damageTakenApplied) return statistics.takenByNobody;
    if (metric === PANEL_METRIC.healthGiven) return statistics.givenByNobody;
    return statistics.restoredToNobody;
}

/**
 * What a one-side list divides its shares by is the figure the strip states for that side, and
 * the two are read apart: the list off each row's own figure, the strip off the row the game did
 * name. A charge that stopped agreeing with the list it stands over is a broken invariant, not a
 * figure that quietly moved. `develop ADR 0036`.
 */
function getWholeDisagreesWithSide(
    whole: number,
    sides: PanelSides | null,
    part: PanelSidePart | null,
): boolean {
    if (part === null) return false;
    if (sides === null) return false;
    return whole !== (part === SIDE_PART.reader ? sides.reader : sides.opposing);
}

/**
 * Under everybody a figure standing apart **is** the fight's own count, and this asks whether it
 * still is. `getHalfNamedBalance` in `src/core/fight-statistics.ts` is what makes it hold — the
 * count is the sum of one field across the rows plus what named neither end, and nothing else.
 *
 * It is a reading rather than an assertion (`develop ADR 0051`), and what it holds is worth more
 * than the panel an assertion here would cost: two independent counts disagreeing is the one thing
 * that says a drawn figure is wrong rather than short, so the reading carries the answer.
 */
function getPinnedDisagrees(
    statistics: FightStatistics,
    kase: PinnedCase,
    total: number,
    part: PanelSidePart | null,
): boolean {
    if (part !== null) return false;
    if (PINNED_SHAPES[kase].standing === PINNED_STANDING.cut) return false;
    if (kase === PINNED_CASE.dealtWithNoActor) return total !== statistics.dealtByNobody;
    if (kase === PINNED_CASE.takenWithNoTarget) return total !== statistics.takenByNobody;
    if (kase === PINNED_CASE.givenWithNoActor) return total !== statistics.givenByNobody;
    return false;
}

/**
 * How the fight went **from the reader's seat**, or nothing at all.
 *
 * The protocol names both sides and says nothing about which is the reader's, so the answer is
 * composed here. Without a seat, or where no name resolves, the header says nothing: a fight the
 * panel cannot place is not a fight it may call a loss. Two answers need no seat, because the
 * game states each by naming nobody: a draw, and a fight an escape broke off.
 */
function getOutcomeForReader(
    statistics: FightStatistics,
    roster: CombatantRoster,
    readerSide: number | null,
): OutcomeResult | null {
    if (statistics.outcome === null) return null;
    return getOutcomeForSeat(statistics.outcome, roster, readerSide);
}

/**
 * The fight as a headcount, and it counts the people the list draws rather than the ones the
 * statistics measured: the two are the same list only once everybody has acted, so a header
 * reading off the other set says `2 vs 1` over eleven rows for the opening payloads of a group
 * fight. Sides in the order the panel puts them in everywhere: the reader's own first.
 */
function composeHeadcount(
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
    const sides = [...countBySide].sort(([one], [other]) => {
        if (readerSide === one) return -1;
        if (readerSide === other) return 1;
        return one - other;
    });
    const sizes = sides.map(([, count]) => count);
    // No relation to the rows is held here: a ranking is filtered by the side strip and the
    // headcount never is, so a fight of ten against one draws one row beside two sizes.
    return { sizes, unplaced };
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
    return pinned.map((one) => {
        const shareText = one.standing === PINNED_STANDING.apart
            ? apartShares[taken++] ?? ""
            : formatShare(whole === 0 ? 0 : one.figure / whole);
        return { ...one, fill: getFill(one.figure, largest), shareText };
    });
}

/**
 * Widening to narrowing. The first four qualify every screen; a cast nobody could place puts back
 * health, so saying it on a damage screen would put a suspicion on a figure that cannot carry it.
 * Each of the three unread causes is its own sentence, because each is its own thing to be short of
 * (`develop ADR 0070`), and a fight is short of one of them at a time in every case anybody has
 * seen.
 */
function composeSuspicions(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
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
        formatCharged(statistics, roster, (one) => one.unreadMessagesUnknownKey),
    ));
    said.push(formatNoParameterSuspicion(
        statistics.unreadMessagesNoParameter,
        messagesRead,
        formatCharged(statistics, roster, (one) => one.unreadMessagesNoParameter),
    ));
    said.push(
        formatGrammarRefusedSuspicion(statistics.unreadMessagesGrammarRefused, messagesRead),
    );
    if (getNounForMetric(metric) === PANEL_NOUN.healing) {
        said.push(formatUnplacedHealSuspicion(
            statistics.castsUnplaced,
            statistics.castsStated,
            formatCharged(statistics, roster, (one) => one.castsUnplaced),
        ));
    }
    return said.filter((one) => one.length > 0).slice(0, WARNINGS_MAXIMUM);
}

/**
 * Whom one gap reaches, worded, off a single walk of the rows. The names stop at what a sentence
 * can carry and the count does not, because past that the count is what the sentence says instead
 * of a list. A row the roster cannot name is counted and never guessed at, which is what leaves
 * the two figures apart.
 */
function formatCharged(
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
        const held = roster.byId.get(combatantId);
        if (held === undefined) continue;
        if (names.length >= NAMED_ROWS_MAXIMUM) continue;
        names.push(held.name);
    }
    return formatChargedRows(names, charged);
}

export function getPartOfSide(side: number | null, readerSide: number | null): PanelSidePart {
    if (side === null) return SIDE_PART.nobody;
    if (readerSide === null) return SIDE_PART.nobody;
    return side === readerSide ? SIDE_PART.reader : SIDE_PART.opposing;
}

/** The text a part is ordered by where two of them come to the same figure. */
export function getTextForNamedPart(part: OpenedPart): string {
    if (part.kind === OPENED_PART.skill) return part.name;
    if (part.kind === OPENED_PART.source) return part.source;
    if (part.kind === OPENED_PART.element) return part.element;
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
export function presentPart(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    combatantId: number,
    part: OpenedPart,
): PartReading | null {
    const figures = statistics.byCombatantId.get(combatantId);
    if (figures === undefined) return null;
    const cut = composePartCut(statistics, figures, metric, combatantId, part);
    if (cut === null) return null;
    const total = getPartTotal(figures, metric, part, cut);
    return {
        part,
        total,
        byOpponent: composeOpponentCut(cut, statistics, roster, total, () => false),
    };
}

/**
 * The people one part of a figure reached, and null where the statistics keep no such cut. Null
 * is the whole of the register's `never`: a key on the screen about what reached you names no
 * giver, and neither does a kind of it.
 */
function composePartCut(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    combatantId: number,
    part: OpenedPart,
): FigureCut | null {
    if (part.kind === OPENED_PART.skill) {
        return composePartCutForSkill(statistics, figures, metric, combatantId, part.name);
    }
    if (part.kind === OPENED_PART.plain) {
        // Kept on this combatant's own record, both ways round, so the walk every other part of a
        // received figure makes over everybody's skills is one nobody has to make here.
        if (getNounForMetric(metric) !== PANEL_NOUN.damage) return null;
        const cut = getDirectionForMetric(metric) === PANEL_DIRECTION.given
            ? figures.damageDealtWithoutSkillByOpponent
            : figures.damageTakenWithoutSkillByOpponent;
        return composePartCutStated(cut);
    }
    if (part.kind === OPENED_PART.source) {
        // Only the giving side keeps a key per person: a key names whoever received the health,
        // so a received row has no second end to be cut by.
        if (metric !== PANEL_METRIC.healthGiven) return null;
        return composePartCutFromPairs(
            figures.healthGivenWithoutSkillByReceiverAndSource,
            part.source,
        );
    }
    if (metric === PANEL_METRIC.damageDealtApplied) {
        return composePartCutFromPairs(figures.damageDealtByOpponentAndKind, part.element);
    }
    if (metric === PANEL_METRIC.damageTakenApplied) {
        return composePartCutFromPairs(figures.damageTakenByOpponentAndKind, part.element);
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
function composePartCutForSkill(
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
        return composePartCutStated(isDamage ? skill.dealtByOpponent : skill.restoredByOpponent);
    }
    const reached = new Map<string, number>();
    for (const [otherId, held] of statistics.byCombatantId) {
        for (const skill of held.skills.values()) {
            if (skill.name !== name) continue;
            const cut = isDamage ? skill.dealtByOpponent : skill.restoredByOpponent;
            const figure = cut.get(`${combatantId}`) ?? 0;
            if (figure > 0) reached.set(`${otherId}`, (reached.get(`${otherId}`) ?? 0) + figure);
        }
    }
    return reached.size === 0 ? null : reached;
}

/** A reading of the cut and never the cut itself, and a part that came to nothing is no part. */
function composePartCutStated(cut: FigureCut): FigureCut | null {
    const stated = new Map<string, number>();
    for (const [other, figure] of cut) {
        if (figure > 0) stated.set(other, figure);
    }
    return stated.size === 0 ? null : stated;
}

/** A cut of a cut, read the other way round: the part is named, and the people are the rows. */
function composePartCutFromPairs(
    pairs: ReadonlyMap<string, FigureCut>,
    named: string,
): FigureCut | null {
    const reached = new Map<string, number>();
    for (const [other, cut] of pairs) {
        const figure = cut.get(named) ?? 0;
        if (figure > 0) reached.set(other, figure);
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
    part: OpenedPart,
    cut: FigureCut,
): number {
    if (part.kind === OPENED_PART.element) {
        return getCutsForMetric(figures, metric).byElement?.get(part.element) ??
            getTotalFromCut(cut);
    }
    if (part.kind === OPENED_PART.skill) {
        if (getDirectionForMetric(metric) === PANEL_DIRECTION.given) {
            const skill = figures.skills.get(part.name);
            if (skill === undefined) return getTotalFromCut(cut);
            return getNounForMetric(metric) === PANEL_NOUN.damage ? skill.dealt : skill.restored;
        }
    }
    // What was received under a name, and what a key gave, are read by folding the same cut the
    // level is: the section above states no second figure for either.
    return getTotalFromCut(cut);
}

/** Healing given has no cut by key, and the empty map says so outright — whose those keys are
 * is `core/fight-statistics.ts`'s to state, and it does. */
function getCutsForMetric(figures: CombatantFigures, metric: PanelMetric): MetricCuts {
    if (metric === PANEL_METRIC.damageDealtApplied) {
        return {
            byOpponent: figures.damageDealtByOpponent,
            byElement: figures.damageDealtByElement,
        };
    }
    if (metric === PANEL_METRIC.damageTakenApplied) {
        return {
            byOpponent: figures.damageTakenByOpponent,
            byElement: figures.damageTakenByElement,
        };
    }
    if (metric === PANEL_METRIC.healthGiven) {
        return { byOpponent: figures.healthGivenByReceiver, byElement: null };
    }
    return {
        byOpponent: figures.healthRestoredByGiver,
        byElement: figures.healthRestoredBySource,
    };
}

function getTotalFromCut(cut: FigureCut): number {
    let total = 0;
    for (const figure of cut.values()) total += figure;
    return total;
}

/**
 * The remainder is a figure whose other end the protocol never named: health that moved down
 * outside a blow carries the movement and no attacker, so there is nobody to charge it to. Over
 * `captures/` on 2026-08-30 that is 45 of 1,060 combatant-and-screen readings, in 28 of the
 * recordings, and every one of them on damage taken — which is where the protocol states a bare
 * movement and the dealing side never is.
 */
function composeOpponentCut(
    cut: FigureCut,
    statistics: FightStatistics,
    roster: CombatantRoster,
    total: number,
    doesOpen: (otherId: number) => boolean,
): OpponentCut {
    const stated: UnsharedRow[] = [];
    let held = 0;
    for (const [named, figure] of cut) {
        const other = parseInteger(named);
        if (other === null) continue;
        held += figure;
        const combatant = roster.byId.get(other);
        stated.push({
            combatantId: other,
            name: combatant?.name ?? null,
            side: combatant?.side ?? null,
            profession: combatant?.profession ?? null,
            figure,
        });
    }
    stated.sort(compareRows);
    const unnamed = total - held;
    const figures = stated.map((one) => one.figure);
    if (unnamed > 0) figures.push(unnamed);
    const shares = formatShares(figures, total);
    const largest = getLargestFigure(figures);
    return {
        rows: stated.map((row, at) => ({
            ...row,
            fill: getFill(row.figure, largest),
            shareText: shares[at] ?? "",
            doesOpenPair: doesOpen(row.combatantId),
            detail: composeRowDetailFor(statistics, roster, row.combatantId),
        })),
        unnamed: unnamed > 0
            ? {
                figure: unnamed,
                fill: getFill(unnamed, largest),
                shareText: shares[stated.length] ?? "",
            }
            : null,
    };
}

/**
 * Null where the pair states nothing: a combatant the fight does not hold, or two the screen's own
 * figure never passed between.
 */
export function presentPair(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    combatantId: number,
    otherId: number,
): PairReading | null {
    const figures = statistics.byCombatantId.get(combatantId);
    if (figures === undefined) return null;
    const total = getPairTotal(figures, metric, otherId);
    if (total === null) return null;
    const kinds = getPairKinds(figures, metric, otherId);
    const held = roster.byId.get(otherId);
    const parts = composePairParts(statistics, metric, combatantId, otherId, total);
    return {
        combatantId,
        otherId,
        otherName: held?.name ?? null,
        otherProfession: held?.profession ?? null,
        total,
        parts: parts.rows,
        hasFiguresDisagreed: parts.hasFiguresDisagreed,
        // Nothing on the last rung opens: the protocol states no further cut of a pair.
        byElement: kinds === null
            ? { rows: [], rest: null, unnamed: null }
            : composeElementCut(kinds, total, () => false),
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
        return kinds === null ? null : getTotalFromCut(kinds);
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
    if (metric === PANEL_METRIC.damageDealtApplied) {
        return figures.damageDealtByOpponentAndKind.get(`${otherId}`) ?? null;
    }
    if (metric === PANEL_METRIC.damageTakenApplied) {
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
    stated.sort((one, other) =>
        getRankedOrder(
            one.figure,
            other.figure,
            getTextForNamedPart(one.part),
            getTextForNamedPart(other.part),
        )
    );
    const held = getTotalFromParts(stated);
    const plain = total - held;
    // Clamped as the section a skill row closes is (`composeSkillCut`), and the clamp carried
    // out: a remainder below nothing is the parts coming to more than the figure over them, which
    // is a drawn figure being wrong rather than short, and a bar cannot be drawn below nothing.
    const drawn = Math.max(plain, 0);
    const figures = stated.map((one) => one.figure);
    if (plain !== 0) figures.push(drawn);
    const shares = formatShares(figures, total);
    const largest = getLargestFigure(figures);
    const rows: PairPartRow[] = stated.map((one, at) => ({
        part: one.part,
        figure: one.figure,
        fill: getFill(one.figure, largest),
        shareText: shares[at] ?? "",
    }));
    if (plain === 0) return { rows, hasFiguresDisagreed: false };
    // Where its figure puts it, and not after the lot — the warning above is about a key larger
    // than every skill sitting at the bottom of a column, and the closing row is the one that most
    // often is (`develop ADR 0079`). Its share is read by the index it was composed under, so the
    // figure it carries is unmoved by where it is drawn.
    rows.splice(getPlaceForPlain(stated, drawn) - 1, 0, {
        part: { kind: OPENED_PART.plain },
        figure: drawn,
        fill: getFill(drawn, largest),
        shareText: shares[stated.length] ?? "",
    });
    return { rows, hasFiguresDisagreed: plain < 0 };
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
            ? skill.dealtByOpponent.get(end.subject) ?? 0
            : skill.restoredByOpponent.get(end.subject) ?? 0;
        if (figure > 0) {
            stated.push({ part: { kind: OPENED_PART.skill, name: skill.name }, figure });
        }
    }
    if (isDamage) {
        // The dealing end's own cut, on both screens: `getPairGivingEnd` hands over whoever struck,
        // which is why the skills above read `dealtByOpponent` off it as well.
        const cut = end.figures.damageDealtWithoutSkillByOpponentAndSource.get(end.subject);
        if (cut === undefined) return stated;
        for (const [source, figure] of cut) {
            if (figure <= 0) continue;
            stated.push({ part: { kind: OPENED_PART.source, source }, figure });
        }
        return stated;
    }
    const cut = end.figures.healthGivenWithoutSkillByReceiverAndSource.get(end.subject);
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

function getTotalFromParts(parts: readonly UnsharedPairPart[]): number {
    let total = 0;
    for (const one of parts) {
        total += one.figure;
    }
    return total;
}

/**
 * The closing row is the remainder rather than a second reading, and **every cut that is drawn
 * carries one**: a section whose rows came to less than the figure over them would be a column of
 * shares adding to ninety-something, which is a panel a reader cannot check.
 *
 * Only the dealing screen counts what stands in it. There the remainder is swings the game
 * announced nothing before, and the count is what a figure alone cannot say; on the healing
 * screens it is health that moved under a key naming no skill, which is not a number of
 * anything.
 */
/**
 * Where the closing row stands among the rows that take a place. Its figure decides, as every
 * other row's does — and on a tie it goes first, because `getTextForNamedPart` answers the empty
 * text for it and the order's tie-break is lexical (`develop ADR 0079`).
 */
function getPlaceForPlain(stated: readonly { figure: number }[], figure: number): number {
    let bigger = 0;
    for (const row of stated) {
        if (row.figure <= figure) continue;
        bigger += 1;
    }
    return bigger + 1;
}

export function presentDrill(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    combatantId: number,
): DrillReading | null {
    const held = roster.byId.get(combatantId);
    // Every row of a ranking opens, including a combatant nothing has named yet: they are on the
    // list at zero, and a row that drew nothing when it was pressed would leave the panel saying
    // the press did not land. What they open onto is the sentence saying they did nothing.
    const figures = statistics.byCombatantId.get(combatantId) ??
        (held === undefined ? undefined : initCombatantFigures());
    if (figures === undefined) return null;
    const cuts = getCutsForMetric(figures, metric);
    const total = getFigure(figures, metric);
    const byOpponent = composeOpponentCut(
        cuts.byOpponent,
        statistics,
        roster,
        total,
        (otherId) => getPairTotal(figures, metric, otherId) !== null,
    );
    const byElement = cuts.byElement === null
        ? { rows: [], rest: null, unnamed: null }
        : composeElementCut(
            cuts.byElement,
            total,
            (element) =>
                composePartCut(statistics, figures, metric, combatantId, {
                    kind: OPENED_PART.element,
                    element,
                }) !== null,
        );
    const bySkill = composeSkillCut(statistics, figures, metric, total, combatantId);
    return {
        combatantId,
        name: held?.name ?? null,
        profession: held?.profession ?? null,
        byOpponent,
        bySkill,
        byElement,
        total,
        hasFiguresDisagreed: bySkill.hasFiguresDisagreed,
    };
}

function composeSkillCut(
    statistics: FightStatistics,
    figures: CombatantFigures,
    metric: PanelMetric,
    total: number,
    combatantId: number,
): SkillCut {
    const folded = composeSkillRows(statistics, figures, metric, combatantId);
    const stated = folded.rows;
    stated.sort(compareSkillRows);
    // What the bound would not give a row to counts as held, because the game **did** name it:
    // left out of this sum it would land in `plain`, which says nothing announced the blow.
    const held = stated.reduce((sum, one) => sum + one.figure, folded.rest);
    // Drawn even where it landed nothing: three blows that were all blocked are three blows, and
    // a section that skipped them would say the combatant never swung.
    const plain = total - held;
    // ⚠️ **On the healing screens this is nought by construction**, and it is not asserted
    // (`develop ADR 0051`): one condition in `src/core/fight-statistics.ts` sends a movement to a
    // skill's row or to the key cut, never to both and never to neither. It is not carried out
    // as a defect like the two `presentScreen` answers for, because those two are invisible
    // — a share divided by the wrong whole — and this one is not: a remainder draws a row of its
    // own, with the figure on it, where a reader can see it and add it up.
    const isCounted = metric === PANEL_METRIC.damageDealtApplied;
    const hasPlain = plain > 0 || (isCounted && figures.blowsWithoutSkill > 0);
    const hasRest = folded.rest > 0;
    // ⚠️ **The shares are composed from the clamped figure, never from the bare remainder.** A
    // row drawn at nought beside a share worked out from a figure below nothing prints
    // *Nie wiadomo* where the panel has just drawn a number, which is a row saying two things at
    // once. What the clamp hides is carried out of here instead.
    const drawn = Math.max(plain, 0);
    const figuresOnScreen = stated.map((one) => one.figure);
    if (hasRest) figuresOnScreen.push(folded.rest);
    if (hasPlain) figuresOnScreen.push(drawn);
    const shares = formatShares(figuresOnScreen, total);
    const largest = getLargestFigure(figuresOnScreen);
    return {
        rows: stated.map((one, at) => ({
            ...one,
            fill: getFill(one.figure, largest),
            shareText: shares[at] ?? "",
        })),
        // ⚠️ **Last, because it is the only row of the section left holding no place.** What a
        // bound would not draw is never folded into the row below it (`develop ADR 0055`).
        rest: hasRest ? composeRestRow(folded.rest, largest, shares[stated.length] ?? "") : null,
        plain: hasPlain
            ? composeClosingRow({
                blows: isCounted ? figures.blowsWithoutSkill : null,
                doesOpenPart: composePartCut(statistics, figures, metric, combatantId, {
                    kind: OPENED_PART.plain,
                }) !==
                    null,
                figure: drawn,
                largest,
                stated,
                shareText: shares[stated.length + (hasRest ? 1 : 0)] ?? "",
            })
            : null,
        hasFiguresDisagreed: plain < 0,
    };
}

/**
 * ⚠️ **A section is a cut of the figure over it, so a skill stands in it by what it did and never
 * by having been announced.** An announcement alone let auras, shouts and heals stand under
 * `Zadane` at nothing: 285 of the 685 skill rows over `captures/` on 2026-08-30, and 28 of
 * the 81 skills the corpus announces never deal anything at all.
 *
 * A swing that landed nothing still stands, which is what `blows` is for — cast eight times and
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
    const rows = stated.parts.map((one) => ({
        ...one,
        doesOpenPart: composePartCut(statistics, figures, metric, combatantId, one.part) !== null,
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
            (o) => o.restoredByOpponent,
        );
        return composeFoldedTogether(
            named,
            composeSourceRows(figures.healthRestoredWithoutSkillBySource),
        );
    }
    // ⚠️ **The keys stand here and the elements do not, and the two are not the same list.** What
    // a blow was made of is a section of its own, so `dmgd` beside a skill would draw one figure
    // twice; what moved health **outside** a blow reached no skill at all, and leaving it out
    // closed it into a row named for a swing. `src/ui/panel-words.ts` keeps the two vocabularies
    // apart for the same reason. `develop ADR 0080`.
    if (metric === PANEL_METRIC.damageTakenApplied) {
        const named = composeSkillRowsReceived(
            statistics,
            combatantId,
            (one) => one.dealtByOpponent,
        );
        return composeFoldedTogether(
            named,
            composeSourceRows(figures.damageTakenWithoutSkillBySource),
        );
    }
    const own = [...figures.skills.values()];
    if (metric === PANEL_METRIC.healthGiven) {
        const given = getGivenSourceCut(figures);
        return composeFoldedTogether({
            parts: own.filter((one) => one.restored > 0).map((one) => ({
                part: { kind: OPENED_PART.skill, name: one.name },
                uses: one.uses,
                figure: one.restored,
            })),
            // What the fold could not key travels with the section it was folded for, so the two
            // bounds on one path come to one row rather than to a shortfall nobody drew.
            rest: given.rest,
        }, composeSourceRows(given.cut));
    }
    return composeFoldedTogether({
        parts: own.filter((one) => one.dealt > 0 || one.blows > 0).map((one) => ({
            part: { kind: OPENED_PART.skill, name: one.name },
            uses: one.uses,
            figure: one.dealt,
        })),
        rest: 0,
    }, composeSourceRows(figures.damageDealtWithoutSkillBySource));
}

/**
 * What reached this combatant, under the name it was announced by and never under whose it was:
 * two healers both announcing `Leczenie ran` put health in under one name, and this screen has no
 * column that could tell the two apart. A combatant's own casts count — health somebody put into
 * themselves is health they received.
 *
 * The announcement is kept on the record of whoever made it, so a received figure is cut by
 * walking everybody rather than by reading one row. Which cut of theirs answers is the caller's:
 * `restoredByOpponent` where health arrived, `dealtByOpponent` where a blow did.
 */
function composeSkillRowsReceived(
    statistics: FightStatistics,
    combatantId: number,
    getCut: (skill: SkillFigures) => FigureCut,
): FoldedParts {
    const byName = new Map<string, number>();
    let rest = 0;
    for (const held of statistics.byCombatantId.values()) {
        for (const skill of held.skills.values()) {
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
function composeFoldedTogether(one: FoldedParts, other: FoldedParts): FoldedParts {
    return { parts: [...one.parts, ...other.parts], rest: one.rest + other.rest };
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
    for (const cut of figures.healthGivenWithoutSkillByReceiverAndSource.values()) {
        // The fold runs over every receiver, so its own bound is the panel's (**S11**): what
        // `core/` holds is one receiver's cut and not the union of twenty. What it will not hold
        // travels out with it, because the section below owes it a row (`develop ADR 0055`).
        rest += addFoldedCut(folded, cut);
    }
    return { cut: folded, rest };
}

/** Largest first, and a tie broken by the text a part is named with — `ranked-order.ts` owns it. */
function compareSkillRows(one: UnsharedSkill, other: UnsharedSkill): number {
    return getRankedOrder(
        one.figure,
        other.figure,
        getTextForNamedPart(one.part),
        getTextForNamedPart(other.part),
    );
}

/**
 * What a bound would not give a row to, summed. It holds no place, which is `develop ADR 0079`'s
 * test: its figure grows with how many we could not fit rather than with what any one of them did.
 */
function composeRestRow(figure: number, largest: number, shareText: string): PlainRow {
    return { blows: null, figure, fill: getFill(figure, largest), shareText };
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
        place: getPlaceForPlain(said.stated, said.figure),
        doesOpenPart: said.doesOpenPart,
        figure: said.figure,
        fill: getFill(said.figure, said.largest),
        shareText: said.shareText,
    };
}
