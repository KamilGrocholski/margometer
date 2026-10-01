/**
 * The one drawing, once per frame (`docs/design.md` §10.4): the game's tooltips, the window beside
 * the panel, then the panel, each step under its own guard, so a step that breaks costs that step
 * and a defect, and the rest of the frame goes on (`develop ADR 0051`).
 *
 * The defects a panel states are the ledger as it stood before the panel was drawn: a defect the
 * drawing itself records is said at the next frame, and nothing a defect does asks for one.
 */

import { assert } from "@std/assert/assert";
import * as errors from "#/libs/errors.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { type CombatantRoster, COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import { replayFightStandings } from "#/src/core/aura-standing.ts";
import type { OutcomeResult } from "#/src/core/battle-event.ts";
import { type FightView, getFightView } from "#/src/core/fight-session.ts";
import type { TooltipPort } from "#/src/game/engine-tooltip.ts";
import type { FightPlace } from "#/src/game/fight-place.ts";
import type { Clock } from "#/src/game/page-time.ts";
import { type TooltipTables, writeCarriedTooltips } from "./carried-tooltip.ts";
import { DEFECT_KIND, type DefectLedger } from "./defect-ledger.ts";
import {
    type FightReading,
    lookupStandingFight,
    lookupStandingKept,
    type StandingFight,
    tallyFightReading,
} from "./fight-reading.ts";
import type { LiveFight } from "./live-fight.ts";
import type { RuntimeFailure } from "./failure-fate.ts";
import type { ShelfAnswers, ShelfKeeper } from "./shelf-keeper.ts";
import { KEPT_MAXIMUM, type KeptFight } from "./shelf.ts";
import type {
    OptionsReading,
    PanelDefect,
    PanelView,
    ShownScreen,
} from "#/src/ui/panel-element.ts";
import type { RenderReport } from "#/src/ui/view-failure.ts";
import {
    composeHeadcount,
    type DrillReading,
    type FightCardReading,
    type FightReader,
    type FightSuspicions,
    getEndForPinned,
    getOutcomeForSeat,
    HALF_NAMED_OPENED,
    type HalfNamedDrillReading,
    type HalfNamedOpened,
    type HalfNamedReading,
    lookupPinnedCase,
    type PairReading,
    type PartReading,
    presentDrill,
    presentHalfNamed,
    presentHalfNamedDrill,
    presentOpenedUnnamed,
    presentPair,
    presentPart,
    presentScreen,
    type ShelfRow,
} from "#/src/ui/panel-reading.ts";
import { composeListName, OPENED_PART, type ScreenState } from "#/src/ui/panel-screen.ts";
import {
    presentStanding,
    STANDING_ABSENCE,
    type StandingAbsence,
    type StandingReading,
} from "#/src/ui/panel-standing.ts";
import {
    CHOICE_REFUSED_ANSWER,
    EVERY_SLOT_PINNED_ANSWER,
    formatPlace,
    formatPlaceWords,
    type PlaceWords,
    STORE_MADE_ROOM_ANSWER,
    STORE_REFUSED_ANSWER,
    type TranslateLabel,
} from "#/src/ui/panel-words.ts";

/** Which level of the panel two counts of one figure came out different on. */
export const FIGURES_CUT = { screen: "screen", drill: "drill", pair: "pair" } as const;
export type FiguresCut = VocabularyWord<typeof FIGURES_CUT>;

export class FiguresDisagreed extends Error {
    override readonly name = "FiguresDisagreed";
    readonly cut: FiguresCut;

    constructor(cut: FiguresCut) {
        super();
        this.cut = cut;
    }
}

export interface FrameParts {
    screen: ScreenState;
    keeper: ShelfKeeper;
    live: LiveFight;
    defects: DefectLedger;
    view: PanelView;
    clock: Clock;
    tooltip: TooltipPort;
    tables: TooltipTables;
    translate: TranslateLabel;
    /** The world the page is on, which is every kept fight's: a shelf is one origin's store. */
    world: string | null;
}

export interface OpenedReadings {
    drill: DrillReading | null;
    pair: PairReading | null;
    part: PartReading | null;
    halfNamed: HalfNamedReading | null;
    halfNamedDrill: HalfNamedDrillReading | null;
}

interface LiveRow {
    reading: FightReading;
    place: FightPlace | null;
    readerId: number | null;
    openedAt: number;
}

/** What a fight's card is read from, whichever of the live fight or a kept one it is. */
interface FightCardSource {
    sizes: readonly number[];
    unplaced: number;
    outcome: OutcomeResult | null;
    isLive: boolean;
    openedAt: number;
    place: FightPlace | null;
    readerId: number | null;
    roster: CombatantRoster;
}

/** The four answers a shelf can give, of which at most three ever hold at once. */
const SHELF_ANSWERS_MAXIMUM = 3;

export function renderFrame(parts: FrameParts): void {
    assert(
        parts.keeper.getFights().length <= KEPT_MAXIMUM,
        "a frame draws a shelf inside its bound",
    );
    // Write the carried tooltips, after the engine's own call, where a frame falls: the game
    // rebuilt its tooltips there.
    const tooltips = errors.attempt(() => {
        const view = getFightView(parts.live.session);
        if (view === null) return;
        const written = writeCarriedTooltips(view, parts.tables, parts.translate, parts.tooltip);
        if (written instanceof Error) addRegionDefect(parts, written);
        else assert(written.written <= written.asked, "no block lands that was not composed");
    });
    if (tooltips instanceof Error) addRegionDefect(parts, tooltips);
    // Draw the window beside the panel, before the panel.
    {
        // A fight the panel cannot read is not a fight the window has nothing to say about. A
        // reading that will not compose is said as a fight that would not read, and never as no
        // fight.
        const isShelfEmpty = parts.keeper.getFights().length === 0;
        const read = errors.attempt(() =>
            presentFrameStanding(parts.live, parts.tables, isShelfEmpty)
        );
        if (read instanceof Error) {
            parts.defects.add({ kind: DEFECT_KIND.reading, region: null, failure: read });
        }
        const reading = read instanceof Error ? STANDING_ABSENCE.fightUnread : read;
        addUndrawn(
            parts.defects,
            parts.view.renderStanding(reading, parts.screen.isStandingCollapsed),
        );
    }
    const said = getPanelDefects(parts.defects);
    // Asked without decoding anything: a fight that will not read is still worth handing over.
    const hasFightToSave = parts.live.capture.calls.length > 0 ||
        parts.keeper.getFights().length > 0;
    // Draw the panel, or waiting where there is nothing to stand on — no fight and an empty shelf —
    // because a panel of zeroes over a game that has not started is a claim.
    const drawn = errors.attempt(() => {
        const { screen, keeper, live } = parts;
        const view = getFightView(live.session);
        const liveReading = view === null ? null : tallyFightReading(view);
        const standing = lookupStandingFight(
            liveReading,
            screen.openFightId,
            keeper.getFights(),
            keeper.lookupReading,
        );
        if (standing === null) {
            // A kept fight chosen and still no standing is a fight that no longer reads, and the
            // reader is told which one rather than that there has been none.
            const unread = lookupStandingKept(liveReading, screen.openFightId, keeper.getFights());
            const keptUnread = unread === undefined ? null : {
                at: parts.clock.readMoment(unread.openedAt),
                place: formatFightPlace(unread.place),
            };
            const waiting = { isCollapsed: screen.isCollapsed, defects: said, hasFightToSave };
            const drawnWaiting = parts.view.renderWaiting({
                ...waiting,
                isFightUnread: false,
                keptUnread,
                options: presentOptions(parts),
                typeStep: screen.typeStep,
                windowSizes: screen.windowSizes,
            });
            addUndrawn(parts.defects, drawnWaiting);
            return;
        }
        assert(
            standing.reading.view.payloadsApplied > 0,
            "a fight stood on was read from something",
        );
        const shown = presentFrameScreen(parts, standing, liveReading, said, hasFightToSave);
        // Say where two counts of one figure came out different.
        {
            // The one thing the panel can say about a drawn figure being wrong rather than short,
            // and a defect rather than an assertion (`develop ADR 0051`).
            const defects = parts.defects;
            const add = (cut: FiguresCut): void => {
                defects.add({
                    kind: DEFECT_KIND.figures,
                    region: null,
                    failure: new FiguresDisagreed(cut),
                });
            };
            if (shown.reading.hasFiguresDisagreed) add(FIGURES_CUT.screen);
            if (shown.drill?.hasFiguresDisagreed === true) add(FIGURES_CUT.drill);
            if (shown.pair?.hasFiguresDisagreed === true) add(FIGURES_CUT.pair);
        }
        addUndrawn(parts.defects, parts.view.render(shown));
    });
    if (!(drawn instanceof Error)) return;
    parts.defects.add({ kind: DEFECT_KIND.reading, region: null, failure: drawn });
    const waiting = {
        isCollapsed: parts.screen.isCollapsed,
        defects: getPanelDefects(parts.defects),
        hasFightToSave,
        isFightUnread: true,
        keptUnread: null,
        options: presentOptions(parts),
        typeStep: parts.screen.typeStep,
        windowSizes: parts.screen.windowSizes,
    };
    assert(waiting.defects.length > 0, "a panel that could not be drawn says why");
    addUndrawn(parts.defects, parts.view.renderWaiting(waiting));
}

function addRegionDefect(parts: FrameParts, failure: RuntimeFailure): void {
    parts.defects.add({ kind: DEFECT_KIND.region, region: null, failure });
}

/**
 * An absence where no payload has arrived: a fight nobody has seen has nothing standing on it, and
 * where the shelf keeps one the panel draws it, so "no fight yet" is said only over an empty shelf.
 */
function presentFrameStanding(
    live: LiveFight,
    tables: TooltipTables,
    isShelfEmpty: boolean,
): StandingReading | StandingAbsence {
    const view = getFightView(live.session);
    if (view === null) {
        return isShelfEmpty ? STANDING_ABSENCE.noFightYet : STANDING_ABSENCE.betweenFights;
    }
    const held = replayFightStandings(view, tables.statedSkills);
    assert(held.provocations.length <= COMBATANTS_MAXIMUM, "a shout holds people of this fight");
    const turn = { statement: view.turnStatement, isOver: view.isOver, isOnAuto: view.isOnAuto };
    return presentStanding(
        held.provocations,
        view.chargedSkills,
        view.roster,
        view.readerSide,
        turn,
    );
}

function addUndrawn(defects: DefectLedger, report: RenderReport): void {
    for (const failure of report.undrawn) {
        defects.add({ kind: DEFECT_KIND.region, region: failure.region, failure });
    }
}

function formatFightPlace(place: FightPlace | null): string | null {
    if (place === null) return null;
    return formatPlace(place.mapName, place.x, place.y);
}

function presentFrameScreen(
    parts: FrameParts,
    standing: StandingFight,
    liveReading: FightReading | null,
    said: readonly PanelDefect[],
    hasFightToSave: boolean,
): ShownScreen {
    const { screen, keeper, live } = parts;
    const { view, figures } = standing.reading;
    const reading = presentScreen(
        figures.statistics,
        view.roster,
        screen.current,
        screen.side,
        view.readerSide,
        getFightSuspicions(view),
    );
    const opened = presentOpenedReadings(standing.reading, screen);
    // The row the panel is drawing: the kept one wherever there is no live fight to mark instead.
    const chosenFight = screen.openFightId ?? standing.kept?.openedAt ?? null;
    if (standing.kept !== null) assert(chosenFight !== null, "a kept fight on screen is one named");
    assert(reading.rows.length <= COMBATANTS_MAXIMUM, "a ranking holds the fight's cast at most");
    const liveRow = liveReading === null ? null : {
        reading: liveReading,
        place: live.place,
        readerId: live.readerId,
        openedAt: live.openedAt,
    };
    return {
        reading,
        listName: composeListName(screen, chosenFight ?? live.openedAt),
        current: screen.current,
        side: screen.side,
        readerSide: view.readerSide,
        // A fight already over numbers nobody's turn, and one read off the shelf has passed.
        turnHolderId: view.isOver ? null : view.turnStatement?.combatantId ?? null,
        shelf: presentShelfRows(parts, liveRow, chosenFight),
        options: presentOptions(parts),
        typeStep: screen.typeStep,
        windowSizes: screen.windowSizes,
        hasFightToSave,
        shelfAnswers: presentShelfAnswers(keeper.getAnswers()),
        defects: said,
        isOnShelf: screen.isOnShelf,
        ...opened,
        place: formatFightPlaceWords(standing.kept === null ? live.place : standing.kept.place),
        card: presentFightCardReading(parts, {
            sizes: reading.sizes,
            unplaced: reading.unplaced,
            outcome: reading.outcome,
            isLive: standing.kept === null,
            openedAt: standing.kept?.openedAt ?? live.openedAt,
            place: standing.kept === null ? live.place : standing.kept.place,
            readerId: standing.kept === null ? live.readerId : standing.kept.readerId,
            roster: view.roster,
        }),
        isCollapsed: screen.isCollapsed,
    };
}

function formatFightPlaceWords(place: FightPlace | null): PlaceWords | null {
    if (place === null) return null;
    return formatPlaceWords(place.mapName, place.x, place.y);
}

/** The card a fight's line or its shelf row opens (ADR 0014). */
function presentFightCardReading(parts: FrameParts, source: FightCardSource): FightCardReading {
    assert(source.unplaced >= 0, "a card counts nobody fewer than none unplaced");
    return {
        sizes: source.sizes,
        unplaced: source.unplaced,
        outcome: source.outcome,
        isLive: source.isLive,
        at: parts.clock.readMoment(source.openedAt),
        place: formatFightPlace(source.place),
        world: parts.world,
        reader: lookupFightReader(source.roster, source.readerId),
    };
}

/**
 * The combatant the client keys by its hero's id, and nobody where the id matches nobody: a
 * reader watching somebody else's fight is in none of its sides.
 */
function lookupFightReader(roster: CombatantRoster, readerId: number | null): FightReader | null {
    if (readerId === null) return null;
    const found = roster.byId.get(readerId);
    if (found === undefined) return null;
    assert(found.id === readerId, "a combatant found by an id is the one it names");
    return { name: found.name, profession: found.profession, level: found.level };
}

/** What is short about the reading itself, which the session states and the figures cannot. */
function getFightSuspicions(view: FightView): FightSuspicions {
    assert(view.messagesLost >= 0, "a reading lost no fewer than none of what it was handed");
    assert(view.messagesRead >= 0, "and read no fewer than none");
    return {
        messagesLost: view.messagesLost,
        hasJoinedInProgress: view.hasJoinedInProgress,
        messagesRead: view.messagesRead,
    };
}

/**
 * The live fight is always a row, because a shelf that hid it would answer *which fight am I
 * reading* with a list the answer is not on. The fight that has just ended is both until the next
 * begins: one row, with the live row's wording and the kept row's pin.
 */
function presentShelfRows(
    parts: FrameParts,
    live: LiveRow | null,
    chosenId: number | null,
): ShelfRow[] {
    const kept = parts.keeper.getFights().slice(0, KEPT_MAXIMUM);
    const rows: ShelfRow[] = [];
    const alsoKept = live === null ? undefined : kept.find((one) => one.openedAt === live.openedAt);
    if (live !== null) {
        const { sizes, unplaced } = presentShelfHeadcount(live.reading);
        const outcome = presentOutcome(live.reading);
        rows.push({
            openedAt: live.openedAt,
            at: parts.clock.readMoment(live.openedAt),
            sizes,
            place: formatFightPlace(live.place),
            outcome,
            isLive: true,
            // Nothing chosen is the live fight: a kept row's moment is never the live one's.
            isChosen: chosenId === null,
            isPinned: alsoKept?.isPinned ?? false,
            isPinnable: alsoKept !== undefined,
            card: presentFightCardReading(parts, {
                sizes,
                unplaced,
                outcome,
                isLive: true,
                openedAt: live.openedAt,
                place: live.place,
                readerId: live.readerId,
                roster: live.reading.view.roster,
            }),
        });
    }
    for (const one of [...kept].sort((first, other) => other.openedAt - first.openedAt)) {
        if (one.openedAt === alsoKept?.openedAt) continue;
        const reading = parts.keeper.lookupReading(one);
        // A row for a fight nothing can be read out of would state a headcount it does not have.
        if (reading === null) continue;
        rows.push(presentKeptShelfRow(parts, one, reading, chosenId));
    }
    assert(rows.length <= KEPT_MAXIMUM + 1, "a row per kept fight, and one for the live one");
    assert(rows.filter((one) => one.isLive).length <= 1, "and one live fight at most");
    return rows;
}

/** Counted as the fight's line counts it, so a row's card says what the line's card says. */
function presentShelfHeadcount(reading: FightReading): { sizes: number[]; unplaced: number } {
    const { roster, readerSide } = reading.view;
    const headcount = composeHeadcount(reading.figures.statistics, roster, readerSide);
    const counted = headcount.sizes.reduce((sum, count) => sum + count, 0);
    assert(headcount.sizes.every((count) => count > 0), "a side on the shelf holds somebody");
    assert(counted === roster.byId.size, "everybody the roster seats, once");
    return headcount;
}

function presentOutcome(reading: FightReading): OutcomeResult | null {
    const outcome = reading.figures.statistics.outcome;
    if (outcome === null) return null;
    return getOutcomeForSeat(outcome, reading.view.roster, reading.view.readerSide);
}

function presentKeptShelfRow(
    parts: FrameParts,
    fight: KeptFight,
    reading: FightReading,
    chosenId: number | null,
): ShelfRow {
    assert(reading.view.payloadsApplied > 0, "a kept row states a fight read from something");
    assert(fight.payloads.length > 0, "and kept from something");
    const { sizes, unplaced } = presentShelfHeadcount(reading);
    const outcome = presentOutcome(reading);
    return {
        openedAt: fight.openedAt,
        at: parts.clock.readMoment(fight.openedAt),
        sizes,
        place: formatFightPlace(fight.place),
        outcome,
        isLive: false,
        isChosen: chosenId === fight.openedAt,
        isPinned: fight.isPinned,
        isPinnable: true,
        card: presentFightCardReading(parts, {
            sizes,
            unplaced,
            outcome,
            isLive: false,
            openedAt: fight.openedAt,
            place: fight.place,
            readerId: fight.readerId,
            roster: reading.view.roster,
        }),
    };
}

/** The options where the reader has them open, and null on every other screen. */
function presentOptions(parts: FrameParts): OptionsReading | null {
    if (!parts.screen.isOnOptions) return null;
    return {
        storage: parts.keeper.getChoice(),
        answers: presentShelfAnswers(parts.keeper.getAnswers()),
    };
}

/** A refusal is an answer, and the figures it stands beside are whole. */
function presentShelfAnswers(answers: ShelfAnswers): string[] {
    const said: string[] = [];
    if (answers.isEverySlotPinned) said.push(EVERY_SLOT_PINNED_ANSWER);
    if (answers.hasStoreRefused) said.push(STORE_REFUSED_ANSWER);
    if (answers.hasStoreMadeRoom) said.push(STORE_MADE_ROOM_ANSWER);
    if (answers.hasChoiceRefused) said.push(CHOICE_REFUSED_ANSWER);
    // A refusal and room made are answers to one write, so the two never stand together.
    if (answers.hasStoreRefused) assert(!answers.hasStoreMadeRoom, "a store refused, or made room");
    assert(said.length <= SHELF_ANSWERS_MAXIMUM, "at most three of the four ever hold at once");
    return said;
}

export function getPanelDefects(defects: DefectLedger): PanelDefect[] {
    return defects.getCounts().map(({ kind, region, count }) => ({ kind, region, count }));
}

/**
 * What stands under the rows a reader opened (`docs/design.md` §9): a person's figure, the pair of
 * two people, the part a figure was made of, and what nobody was named for, under a pinned row or
 * under the person whose figure left it out. A mark that names no figure on this screen opens
 * nothing, which is the answer a mark left over from another screen deserves.
 */
export function presentOpenedReadings(reading: FightReading, screen: ScreenState): OpenedReadings {
    const statistics = reading.figures.statistics;
    const roster = reading.view.roster;
    if (screen.openRowId === null) {
        const halfNamed = presentOpenedHalfNamed(reading, screen);
        const halfNamedDrill = presentOpenedHalfNamedDrill(reading, screen);
        return { drill: null, pair: null, part: null, halfNamed, halfNamedDrill };
    }
    const drill = presentDrill(statistics, roster, screen.current, screen.openRowId);
    // A row nobody in the fight is on opens nothing, and nothing under it stands either.
    if (drill === null) {
        return { drill: null, pair: null, part: null, halfNamed: null, halfNamedDrill: null };
    }
    assert(drill.combatantId === screen.openRowId, "the row drawn open is the row opened");
    const pair = screen.openPairId === null
        ? null
        : presentPair(statistics, roster, screen.current, drill.combatantId, screen.openPairId);
    const part = screen.openPart === null
        ? null
        : presentPart(statistics, roster, screen.current, drill.combatantId, screen.openPart);
    const halfNamedDrill = presentOpenedUnnamedOfRow(reading, screen, drill);
    return { drill, pair, part, halfNamed: null, halfNamedDrill };
}

/**
 * The end the opened figure left out, where that row opens: the reading composes the level only
 * behind a row that says it opens, so a mark left over from another screen draws nothing.
 */
function presentOpenedUnnamedOfRow(
    reading: FightReading,
    screen: ScreenState,
    drill: DrillReading,
): HalfNamedDrillReading | null {
    assert(screen.openRowId === drill.combatantId, "the rung is under the row drawn open");
    if (screen.openUnnamedEnd === null) return null;
    const unnamed = drill.byOpponent.unnamed;
    if (unnamed === null) return null;
    if (!unnamed.doesOpenPair) return null;
    const { statistics } = reading.figures;
    const { roster } = reading.view;
    const held = presentOpenedUnnamed(statistics, roster, screen.current, drill.combatantId);
    if (held === null) return null;
    return getEndForPinned(held.case) === screen.openUnnamedEnd ? held : null;
}

function presentOpenedHalfNamed(
    reading: FightReading,
    screen: ScreenState,
): HalfNamedReading | null {
    if (screen.openUnnamedEnd === null) return null;
    const kase = lookupPinnedCase(screen.current, screen.openUnnamedEnd);
    if (kase === null) return null;
    const { statistics } = reading.figures;
    const { roster, readerSide } = reading.view;
    return presentHalfNamed(statistics, roster, kase, screen.side, readerSide);
}

function presentOpenedHalfNamedDrill(
    reading: FightReading,
    screen: ScreenState,
): HalfNamedDrillReading | null {
    if (screen.openUnnamedEnd === null) return null;
    const kase = lookupPinnedCase(screen.current, screen.openUnnamedEnd);
    if (kase === null) return null;
    const opened = lookupHalfNamedOpened(screen);
    if (opened === null) return null;
    const { statistics } = reading.figures;
    const { roster, readerSide } = reading.view;
    return presentHalfNamedDrill(statistics, roster, kase, screen.side, readerSide, opened);
}

/** A person or a key, and never both: the way back closes the key first, so one of them is null. */
function lookupHalfNamedOpened(screen: ScreenState): HalfNamedOpened | null {
    assert(screen.openUnnamedEnd !== null, "a pinned row's rung is asked of an open pinned row");
    assert(screen.openRowId === null, "a person's row and a pinned row are never open at once");
    if (screen.openPart !== null) {
        if (screen.openPart.kind !== OPENED_PART.element) return null;
        return { kind: HALF_NAMED_OPENED.element, element: screen.openPart.element };
    }
    if (screen.openPairId === null) return null;
    return { kind: HALF_NAMED_OPENED.person, combatantId: screen.openPairId };
}
