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
import { replayAuraStandings } from "#/src/core/aura-standing.ts";
import type { OutcomeResult } from "#/src/core/battle-event.ts";
import { composeFightView, type FightView } from "#/src/core/fight-session.ts";
import type { MargonemEngineTooltipPort } from "#/src/ports/margonem-engine-tooltip.ts";
import type { FightPlace } from "#/src/ports/fight-place.ts";
import type { BrowserClock } from "#/src/ports/browser-time.ts";
import { type TooltipTables, writeCarriedTooltips } from "./carried-tooltip.ts";
import { DEFECT_KIND, type DefectLedger } from "./defect-ledger.ts";
import {
    type FightState,
    lookupShownFight,
    lookupShownKeptFight,
    type ShownFight,
    tallyFightState,
} from "./fight-state.ts";
import type { LiveFight } from "./live-fight.ts";
import type { RuntimeFailure } from "./failure-fate.ts";
import { SHELF_ANSWERS_MAXIMUM, type ShelfAnswers, type ShelfKeeper } from "./shelf-keeper.ts";
import { KEPT_MAXIMUM, type KeptFight } from "./shelf.ts";
import type {
    OptionsContent,
    PanelDefect,
    PanelView,
    ShownScreen,
} from "#/src/ui/panel-element.ts";
import type { RenderReport } from "#/src/ui/view-failure.ts";
import {
    composeHeadcount,
    type FightCardContent,
    type FightReader,
    type FightSuspicions,
    formatFightSuspicions,
    getEndForPinned,
    getOutcomeForReaderSide,
    HALF_NAMED_OPENED,
    type HalfNamedOpened,
    lookupPinnedCase,
    type OpenedLevelContent,
    type PairLevelContent,
    type PartLevelContent,
    presentOpenedLevel,
    presentPairLevel,
    presentPartLevel,
    presentScreen,
    presentUnnamedCutLevel,
    presentUnnamedLevel,
    presentUnnamedPairLevel,
    type ShelfRow,
    type UnnamedCutLevelContent,
    type UnnamedLevelContent,
} from "#/src/ui/panel-content.ts";
import { composeListName, OPENED_PART, type ScreenState } from "#/src/ui/panel-screen.ts";
import {
    HELPER_ABSENCE,
    type HelperAbsence,
    type HelperContent,
    presentHelper,
} from "#/src/ui/panel-helper.ts";
import {
    CHOICE_REFUSED_ANSWER,
    EVERY_SLOT_PINNED_ANSWER,
    formatPlace,
    formatPlaceWords,
    MOVE_REFUSED_ANSWER,
    PIN_REFUSED_ANSWER,
    type PlaceWords,
    STORE_MADE_ROOM_ANSWER,
    STORE_REFUSED_ANSWER,
    type TranslateLabel,
} from "#/src/ui/panel-words.ts";

/** Which level of the panel two counts of one figure came out different on. */
export const FIGURES_CUT = {
    screen: "screen",
    drill: "drill",
    pair: "pair",
    part: "part",
    helper: "helper",
} as const;
export type FiguresCut = VocabularyWord<typeof FIGURES_CUT>;

export class FiguresDisagreed extends Error {
    override readonly name = "FiguresDisagreed";
    readonly cut: FiguresCut;

    constructor(cut: FiguresCut) {
        super();
        this.cut = cut;
    }
}

/** Drawn fighters whose tooltip the client would not let a block onto: a method gone or renamed. */
export class MargonemEngineTooltipRefused extends Error {
    override readonly name = "MargonemEngineTooltipRefused";
    readonly refused: number;

    constructor(refused: number) {
        super();
        this.refused = refused;
    }
}

export interface FrameParts {
    screen: ScreenState;
    keeper: ShelfKeeper;
    live: LiveFight;
    defects: DefectLedger;
    view: PanelView;
    clock: BrowserClock;
    tooltip: MargonemEngineTooltipPort;
    tables: TooltipTables;
    translate: TranslateLabel;
    /**
     * The world the page is on, which is every kept fight's: a world is read off the page's host
     * (`src/ports/browser-surroundings.ts`), and a browser keeps a store for each origin apart.
     */
    world: string | null;
}

export interface OpenedLevels {
    opened: OpenedLevelContent | null;
    pair: PairLevelContent | null;
    part: PartLevelContent | null;
    unnamed: UnnamedLevelContent | null;
    unnamedCut: UnnamedCutLevelContent | null;
}

interface LiveRow {
    fightState: FightState;
    place: FightPlace | null;
    readerId: number | null;
    openedAt: number | null;
}

/** What a fight's card is read from, whichever of the live fight or a kept one it is. */
interface FightCardSource {
    sizes: readonly number[];
    unplaced: number;
    outcome: OutcomeResult | null;
    isLive: boolean;
    openedAt: number | null;
    place: FightPlace | null;
    readerId: number | null;
    roster: CombatantRoster;
    suspicions: string[];
}

export function renderFrame(parts: FrameParts): void {
    assert(
        parts.keeper.getFights().length <= KEPT_MAXIMUM,
        "a frame draws a shelf inside its bound",
    );
    // Write the carried tooltips, after the engine's own call, where a frame falls: the game
    // rebuilt its tooltips there.
    const tooltips = errors.attempt(() => {
        const view = composeFightView(parts.live.session);
        if (view === null) return;
        const written = writeCarriedTooltips(view, parts.tables, parts.translate, parts.tooltip);
        if (written instanceof Error) addRegionDefect(parts, written);
        else if (written.refused > 0) {
            addRegionDefect(parts, new MargonemEngineTooltipRefused(written.refused));
        } else assert(written.refused === 0, "a frame whose blocks all landed marks nothing");
    });
    if (tooltips instanceof Error) addRegionDefect(parts, tooltips);
    // Draw the window beside the panel, before the panel.
    {
        // A fight the panel cannot read is not a fight the window has nothing to say about. A
        // reading that will not compose is said as a fight that would not read, and never as no
        // fight.
        const isShelfEmpty = parts.keeper.getFights().length === 0;
        const helperRead = errors.attempt(() =>
            presentHelperForFrame(parts.live, parts.tables, isShelfEmpty)
        );
        let helper: HelperContent | HelperAbsence;
        if (helperRead instanceof Error) {
            parts.defects.add({ kind: DEFECT_KIND.reading, region: null, failure: helperRead });
            helper = HELPER_ABSENCE.fightUnread;
        } else {
            helper = helperRead;
            if (isHelperFiguresDisagreed(helperRead)) {
                parts.defects.add({
                    kind: DEFECT_KIND.figures,
                    region: null,
                    failure: new FiguresDisagreed(FIGURES_CUT.helper),
                });
            }
        }
        addUndrawnDefects(
            parts.defects,
            parts.view.renderHelper(helper, parts.screen.isHelperCollapsed),
        );
    }
    const defects = getPanelDefects(parts.defects);
    // Draw the panel, or waiting where there is nothing to stand on — no fight and an empty shelf —
    // because a panel of zeroes over a game that has not started is a claim.
    const rendered = errors.attempt(() => {
        const { screen, keeper, live: liveFight } = parts;
        const view = composeFightView(liveFight.session);
        const liveFightState = view === null ? null : tallyFightState(view);
        const shownFight = lookupShownFight(
            liveFightState,
            screen.chosenFightOpenedAt,
            keeper.getFights(),
            keeper.getKeptFightStates(),
        );
        if (shownFight === null) {
            // A kept fight chosen and still none shown is a fight that no longer reads, and the
            // reader is told which one rather than that there has been none.
            const unreadKeptFight = lookupShownKeptFight(
                liveFightState,
                screen.chosenFightOpenedAt,
                keeper.getFights(),
            );
            const keptUnread = unreadKeptFight === undefined ? null : {
                at: parts.clock.readMoment(unreadKeptFight.openedAt),
                place: formatFightPlace(unreadKeptFight.place),
            };
            // A file is written from a fight's reading, so one that does not read has none.
            const waiting = {
                isMeterCollapsed: screen.isMeterCollapsed,
                defects,
                hasFightToSave: false,
            };
            const renderedWaiting = parts.view.renderWaiting({
                ...waiting,
                isFightUnread: false,
                keptUnread,
                options: presentOptions(parts),
                typeStep: screen.typeStep,
                windowSizes: screen.windowSizes,
            });
            addUndrawnDefects(parts.defects, renderedWaiting);
            return;
        }
        assert(
            shownFight.fightState.view.payloadsApplied > 0,
            "a fight stood on was read from something",
        );
        const shownScreen = presentFrameScreen(
            parts,
            shownFight,
            liveFightState,
            defects,
        );
        // Say where two counts of one figure came out different.
        {
            // The one thing the panel can say about a drawn figure being wrong rather than short,
            // and a defect rather than an assertion (`develop ADR 0051`).
            const ledger = parts.defects;
            const addFiguresDisagreed = (cut: FiguresCut): void => {
                ledger.add({
                    kind: DEFECT_KIND.figures,
                    region: null,
                    failure: new FiguresDisagreed(cut),
                });
            };
            if (shownScreen.ranking.hasFiguresDisagreed) addFiguresDisagreed(FIGURES_CUT.screen);
            if (shownScreen.opened?.hasFiguresDisagreed === true) {
                addFiguresDisagreed(FIGURES_CUT.drill);
            }
            if (shownScreen.pair?.hasFiguresDisagreed === true) {
                addFiguresDisagreed(FIGURES_CUT.pair);
            }
            if (shownScreen.part?.hasFiguresDisagreed === true) {
                addFiguresDisagreed(FIGURES_CUT.part);
            }
        }
        addUndrawnDefects(parts.defects, parts.view.render(shownScreen));
    });
    if (!(rendered instanceof Error)) return;
    parts.defects.add({ kind: DEFECT_KIND.reading, region: null, failure: rendered });
    // A panel that threw while drawn may stand on a fight that reads, and the file is how it is
    // handed over: asked without decoding anything again.
    const hasFightToSave = parts.live.capture.calls.length > 0 ||
        parts.keeper.getFights().length > 0;
    const waiting = {
        isMeterCollapsed: parts.screen.isMeterCollapsed,
        defects: getPanelDefects(parts.defects),
        hasFightToSave,
        isFightUnread: true,
        keptUnread: null,
        options: presentOptions(parts),
        typeStep: parts.screen.typeStep,
        windowSizes: parts.screen.windowSizes,
    };
    assert(waiting.defects.length > 0, "a panel that could not be drawn says why");
    addUndrawnDefects(parts.defects, parts.view.renderWaiting(waiting));
}

function addRegionDefect(parts: FrameParts, failure: RuntimeFailure): void {
    parts.defects.add({ kind: DEFECT_KIND.region, region: null, failure });
}

/**
 * An absence where no payload has arrived: a fight nobody has seen has nothing standing on it, and
 * where the shelf keeps one the panel draws it, so "no fight yet" is said only over an empty shelf.
 */
function presentHelperForFrame(
    liveFight: LiveFight,
    tables: TooltipTables,
    isShelfEmpty: boolean,
): HelperContent | HelperAbsence {
    const view = composeFightView(liveFight.session);
    if (view === null) {
        return isShelfEmpty ? HELPER_ABSENCE.noFightYet : HELPER_ABSENCE.betweenFights;
    }
    const standings = replayAuraStandings(view, tables.statedSkills);
    assert(
        standings.provocations.length <= COMBATANTS_MAXIMUM,
        "a shout holds people of this fight",
    );
    const turn = { statement: view.turnStatement, isOver: view.isOver, isOnAuto: view.isOnAuto };
    return presentHelper(
        standings.provocations,
        view.chargedSkills,
        view.roster,
        view.readerSide,
        turn,
    );
}

/** Whether the window's reading carried out a broken invariant; a window with no fight carries none. */
function isHelperFiguresDisagreed(helper: HelperContent | HelperAbsence): boolean {
    if (typeof helper === "string") return false;
    return helper.hasFiguresDisagreed;
}

function addUndrawnDefects(defects: DefectLedger, report: RenderReport): void {
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
    shownFight: ShownFight,
    liveFightState: FightState | null,
    defects: readonly PanelDefect[],
): ShownScreen {
    const { screen, keeper, live: liveFight } = parts;
    const { view, figures } = shownFight.fightState;
    const ranking = presentScreen(
        figures.statistics,
        view.roster,
        screen.metric,
        screen.side,
        view.readerSide,
        getFightSuspicions(view),
    );
    const openedLevels = presentOpenedLevels(shownFight.fightState, screen);
    // The row the panel is drawing: the kept one wherever there is no live fight to mark instead.
    const chosenFightOpenedAt = screen.chosenFightOpenedAt ?? shownFight.keptFight?.openedAt ??
        null;
    if (shownFight.keptFight !== null) {
        assert(chosenFightOpenedAt !== null, "a kept fight on screen is one named");
    }
    assert(ranking.rows.length <= COMBATANTS_MAXIMUM, "a ranking holds the fight's cast at most");
    const liveRow = liveFightState === null ? null : {
        fightState: liveFightState,
        place: liveFight.place,
        readerId: liveFight.readerId,
        openedAt: liveFight.openedAt,
    };
    return {
        ranking,
        listName: composeListName(screen, chosenFightOpenedAt ?? liveFight.openedAt),
        metric: screen.metric,
        side: screen.side,
        readerSide: view.readerSide,
        // A fight already over numbers nobody's turn, and one read off the shelf has passed.
        turnHolderId: view.isOver ? null : view.turnStatement?.combatantId ?? null,
        shelf: presentShelfRows(parts, liveRow, chosenFightOpenedAt),
        options: presentOptions(parts),
        typeStep: screen.typeStep,
        windowSizes: screen.windowSizes,
        hasFightToSave: true,
        shelfAnswers: presentShelfAnswers(keeper.getAnswers()),
        defects,
        isOnShelf: screen.isOnShelf,
        ...openedLevels,
        fightPlace: formatFightPlaceWords(
            shownFight.keptFight === null ? liveFight.place : shownFight.keptFight.place,
        ),
        card: presentFightCardContent(parts, {
            sizes: ranking.sizes,
            unplaced: ranking.unplaced,
            outcome: ranking.outcome,
            isLive: shownFight.keptFight === null,
            openedAt: shownFight.keptFight?.openedAt ?? liveFight.openedAt,
            place: shownFight.keptFight === null ? liveFight.place : shownFight.keptFight.place,
            readerId: shownFight.keptFight === null
                ? liveFight.readerId
                : shownFight.keptFight.readerId,
            roster: view.roster,
            suspicions: composeSuspicionsOfReading(shownFight.fightState),
        }),
        isMeterCollapsed: screen.isMeterCollapsed,
    };
}

function formatFightPlaceWords(place: FightPlace | null): PlaceWords | null {
    if (place === null) return null;
    return formatPlaceWords(place.mapName, place.x, place.y);
}

/** The card a fight's line or its shelf row opens (ADR 0014). */
function presentFightCardContent(parts: FrameParts, source: FightCardSource): FightCardContent {
    assert(source.unplaced >= 0, "a card counts nobody fewer than none unplaced");
    return {
        sizes: source.sizes,
        unplaced: source.unplaced,
        outcome: source.outcome,
        isLive: source.isLive,
        at: source.openedAt === null ? null : parts.clock.readMoment(source.openedAt),
        place: formatFightPlace(source.place),
        world: parts.world,
        reader: lookupFightReader(source.roster, source.readerId),
        suspicions: source.suspicions,
        isUnread: false,
    };
}

/**
 * The combatant the client keys by its hero's id, and nobody where the id matches nobody: a
 * reader watching somebody else's fight is in none of its sides.
 */
function lookupFightReader(roster: CombatantRoster, readerId: number | null): FightReader | null {
    if (readerId === null) return null;
    const combatant = roster.byId.get(readerId);
    if (combatant === undefined) return null;
    assert(combatant.id === readerId, "a combatant found by an id is the one it names");
    return { name: combatant.name, profession: combatant.profession, level: combatant.level };
}

/** What a card says is short about a whole fight, read off the fight a row or the line stands on. */
function composeSuspicionsOfReading(fightState: FightState): string[] {
    const { view, figures } = fightState;
    return formatFightSuspicions(figures.statistics, view.roster, getFightSuspicions(view));
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
    liveRow: LiveRow | null,
    chosenFightOpenedAt: number | null,
): ShelfRow[] {
    const keptFights = parts.keeper.getFights();
    const keptFightStatesByOpenedAt = parts.keeper.getKeptFightStates();
    const rows: ShelfRow[] = [];
    const alsoKept = liveRow === null
        ? undefined
        : keptFights.find((keptFight) => keptFight.openedAt === liveRow.openedAt);
    if (liveRow !== null) {
        const { sizes, unplaced } = presentShelfHeadcount(liveRow.fightState);
        const outcome = getOutcomeOfReading(liveRow.fightState);
        const liveOpenedAt = liveRow.openedAt;
        rows.push({
            openedAt: liveOpenedAt,
            at: liveOpenedAt === null ? null : parts.clock.readMoment(liveOpenedAt),
            sizes,
            place: formatFightPlace(liveRow.place),
            outcome,
            isLive: true,
            // Nothing chosen is the live fight: a kept row's moment is never the live one's.
            isChosen: chosenFightOpenedAt === null,
            isPinned: alsoKept?.isPinned ?? false,
            isPinnable: alsoKept !== undefined,
            card: presentFightCardContent(parts, {
                sizes,
                unplaced,
                outcome,
                isLive: true,
                openedAt: liveRow.openedAt,
                place: liveRow.place,
                readerId: liveRow.readerId,
                roster: liveRow.fightState.view.roster,
                suspicions: composeSuspicionsOfReading(liveRow.fightState),
            }),
        });
    }
    const keptFightsNewestFirst = [...keptFights].sort((leftFight, rightFight) =>
        rightFight.openedAt - leftFight.openedAt
    );
    for (const keptFight of keptFightsNewestFirst) {
        if (keptFight.openedAt === alsoKept?.openedAt) continue;
        const fightState = keptFightStatesByOpenedAt.get(keptFight.openedAt);
        assert(fightState !== undefined, "a kept fight's reading is held while it is kept");
        // A fight nothing can be read out of keeps its row, since a shelf it quietly left would
        // hold a pin nobody can take back, but states no headcount it does not have (ADR 0046).
        if (fightState === null) {
            rows.push(presentUnreadShelfRow(parts, keptFight, chosenFightOpenedAt));
        } else {
            rows.push(presentKeptShelfRow(parts, keptFight, fightState, chosenFightOpenedAt));
        }
    }
    assert(rows.length <= KEPT_MAXIMUM + 1, "a row per kept fight, and one for the live one");
    assert(rows.filter((shelfRow) => shelfRow.isLive).length <= 1, "and one live fight at most");
    return rows;
}

/** Counted as the fight's line counts it, so a row's card says what the line's card says. */
function presentShelfHeadcount(fightState: FightState): { sizes: number[]; unplaced: number } {
    const { roster, readerSide } = fightState.view;
    const headcount = composeHeadcount(fightState.figures.statistics, roster, readerSide);
    const counted = headcount.sizes.reduce((sum, count) => sum + count, 0);
    assert(headcount.sizes.every((count) => count > 0), "a side on the shelf holds somebody");
    assert(counted === roster.byId.size, "everybody the roster seats, once");
    return headcount;
}

function presentUnreadShelfRow(
    parts: FrameParts,
    fight: KeptFight,
    chosenFightOpenedAt: number | null,
): ShelfRow {
    assert(fight.payloads.length > 0, "a kept row was kept from something, read or not");
    const moment = parts.clock.readMoment(fight.openedAt);
    const place = formatFightPlace(fight.place);
    return {
        openedAt: fight.openedAt,
        at: moment,
        sizes: [],
        place,
        outcome: null,
        isLive: false,
        isChosen: chosenFightOpenedAt === fight.openedAt,
        isPinned: fight.isPinned,
        isPinnable: true,
        card: {
            sizes: [],
            unplaced: 0,
            outcome: null,
            isLive: false,
            at: moment,
            place,
            world: parts.world,
            reader: null,
            suspicions: [],
            isUnread: true,
        },
    };
}

function getOutcomeOfReading(fightState: FightState): OutcomeResult | null {
    const outcome = fightState.figures.statistics.outcome;
    if (outcome === null) return null;
    return getOutcomeForReaderSide(outcome, fightState.view.roster, fightState.view.readerSide);
}

function presentKeptShelfRow(
    parts: FrameParts,
    fight: KeptFight,
    fightState: FightState,
    chosenFightOpenedAt: number | null,
): ShelfRow {
    assert(fightState.view.payloadsApplied > 0, "a kept row states a fight read from something");
    assert(fight.payloads.length > 0, "and kept from something");
    const { sizes, unplaced } = presentShelfHeadcount(fightState);
    const outcome = getOutcomeOfReading(fightState);
    return {
        openedAt: fight.openedAt,
        at: parts.clock.readMoment(fight.openedAt),
        sizes,
        place: formatFightPlace(fight.place),
        outcome,
        isLive: false,
        isChosen: chosenFightOpenedAt === fight.openedAt,
        isPinned: fight.isPinned,
        isPinnable: true,
        card: presentFightCardContent(parts, {
            sizes,
            unplaced,
            outcome,
            isLive: false,
            openedAt: fight.openedAt,
            place: fight.place,
            readerId: fight.readerId,
            roster: fightState.view.roster,
            suspicions: composeSuspicionsOfReading(fightState),
        }),
    };
}

/** The options where the reader has them open, and null on every other screen. */
function presentOptions(parts: FrameParts): OptionsContent | null {
    if (!parts.screen.isOnOptions) return null;
    return {
        storage: parts.keeper.getChoice(),
        answers: presentShelfAnswers(parts.keeper.getAnswers()),
    };
}

/** A refusal is an answer, and the figures it stands beside are whole. */
function presentShelfAnswers(shelfAnswers: ShelfAnswers): string[] {
    const answers: string[] = [];
    if (shelfAnswers.isEverySlotPinned) answers.push(EVERY_SLOT_PINNED_ANSWER);
    if (shelfAnswers.hasStoreRefused) answers.push(STORE_REFUSED_ANSWER);
    if (shelfAnswers.hasStoreMadeRoom) answers.push(STORE_MADE_ROOM_ANSWER);
    if (shelfAnswers.hasChoiceRefused) answers.push(CHOICE_REFUSED_ANSWER);
    if (shelfAnswers.hasMoveRefused) answers.push(MOVE_REFUSED_ANSWER);
    if (shelfAnswers.hasPinRefused) answers.push(PIN_REFUSED_ANSWER);
    // A refusal and room made are answers to one write, so the two never stand together.
    if (shelfAnswers.hasStoreRefused) {
        assert(!shelfAnswers.hasStoreMadeRoom, "a store refused, or made room");
    }
    if (shelfAnswers.hasMoveRefused) {
        assert(!shelfAnswers.hasChoiceRefused, "a move is refused, or its choice is");
    }
    assert(
        answers.length <= SHELF_ANSWERS_MAXIMUM,
        "a shelf states only answers that hold together",
    );
    return answers;
}

function getPanelDefects(defects: DefectLedger): PanelDefect[] {
    return defects.getCounts().map(({ kind, region, count }) => ({ kind, region, count }));
}

/**
 * What stands under the rows a reader opened (`docs/design.md` §9): a person's figure, the pair of
 * two people, the part a figure was made of, and what nobody was named for, under a pinned row or
 * under the person whose figure left it out. A mark that names no figure on this screen opens
 * nothing, which is the answer a mark left over from another screen deserves.
 */
export function presentOpenedLevels(fightState: FightState, screen: ScreenState): OpenedLevels {
    const statistics = fightState.figures.statistics;
    const roster = fightState.view.roster;
    if (screen.openedCombatantId === null) {
        const unnamed = lookupUnnamedLevel(fightState, screen);
        const unnamedCut = lookupUnnamedCutLevel(fightState, screen);
        return { opened: null, pair: null, part: null, unnamed, unnamedCut };
    }
    const opened = presentOpenedLevel(statistics, roster, screen.metric, screen.openedCombatantId);
    // A row nobody in the fight is on opens nothing, and nothing under it stands either.
    if (opened === null) {
        return { opened: null, pair: null, part: null, unnamed: null, unnamedCut: null };
    }
    assert(opened.combatantId === screen.openedCombatantId, "the row drawn open is the row opened");
    const pair = screen.pairCombatantId === null ? null : presentPairLevel(
        statistics,
        roster,
        screen.metric,
        opened.combatantId,
        screen.pairCombatantId,
    );
    const partLevel = screen.openPart === null
        ? null
        : presentPartLevel(statistics, roster, screen.metric, opened.combatantId, screen.openPart);
    const unnamedCut = lookupUnnamedPairLevel(fightState, screen, opened);
    return { opened, pair, part: partLevel, unnamed: null, unnamedCut };
}

/**
 * The end the opened figure left out, where that row opens: the reading composes the level only
 * behind a row that says it opens, so a mark left over from another screen draws nothing.
 */
function lookupUnnamedPairLevel(
    fightState: FightState,
    screen: ScreenState,
    drill: OpenedLevelContent,
): UnnamedCutLevelContent | null {
    assert(screen.openedCombatantId === drill.combatantId, "the rung is under the row drawn open");
    if (screen.openUnnamedEnd === null) return null;
    const unnamed = drill.byOtherEnd.halfNamed;
    if (unnamed === null) return null;
    if (!unnamed.doesOpenPair) return null;
    const { statistics } = fightState.figures;
    const { roster } = fightState.view;
    const unnamedPair = presentUnnamedPairLevel(
        statistics,
        roster,
        screen.metric,
        drill.combatantId,
    );
    if (unnamedPair === null) return null;
    return getEndForPinned(unnamedPair.case) === screen.openUnnamedEnd ? unnamedPair : null;
}

function lookupUnnamedLevel(
    fightState: FightState,
    screen: ScreenState,
): UnnamedLevelContent | null {
    if (screen.openUnnamedEnd === null) return null;
    const pinnedCase = lookupPinnedCase(screen.metric, screen.openUnnamedEnd);
    if (pinnedCase === null) return null;
    const { statistics } = fightState.figures;
    const { roster, readerSide } = fightState.view;
    return presentUnnamedLevel(statistics, roster, pinnedCase, screen.side, readerSide);
}

function lookupUnnamedCutLevel(
    fightState: FightState,
    screen: ScreenState,
): UnnamedCutLevelContent | null {
    if (screen.openUnnamedEnd === null) return null;
    const pinnedCase = lookupPinnedCase(screen.metric, screen.openUnnamedEnd);
    if (pinnedCase === null) return null;
    const halfNamedOpened = lookupUnnamedCutPress(screen);
    if (halfNamedOpened === null) return null;
    const { statistics } = fightState.figures;
    const { roster, readerSide } = fightState.view;
    return presentUnnamedCutLevel(
        statistics,
        roster,
        pinnedCase,
        screen.side,
        readerSide,
        halfNamedOpened,
    );
}

/** A person or a key, and never both: the way back closes the key first, so one of them is null. */
function lookupUnnamedCutPress(screen: ScreenState): HalfNamedOpened | null {
    assert(screen.openUnnamedEnd !== null, "a pinned row's rung is asked of an open pinned row");
    assert(
        screen.openedCombatantId === null,
        "a person's row and a pinned row are never open at once",
    );
    if (screen.openPart !== null) {
        if (screen.openPart.kind !== OPENED_PART.element) return null;
        return { kind: HALF_NAMED_OPENED.element, element: screen.openPart.element };
    }
    if (screen.pairCombatantId === null) return null;
    return { kind: HALF_NAMED_OPENED.person, combatantId: screen.pairCombatantId };
}
