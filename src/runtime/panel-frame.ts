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
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import { replayFightStandings } from "#/src/core/aura-standing.ts";
import type { OutcomeResult } from "#/src/core/battle-event.ts";
import { type FightView, getFightView } from "#/src/core/fight-session.ts";
import type { TooltipPort } from "#/src/game/engine-tooltip.ts";
import type { FightPlace } from "#/src/game/fight-place.ts";
import type { Clock } from "#/src/game/page-clock.ts";
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
import type { PanelDefect, PanelView, ShownScreen } from "#/src/ui/panel-element.ts";
import type { RenderReport } from "#/src/ui/view-failure.ts";
import {
    type FightSuspicions,
    getOutcomeForSeat,
    presentScreen,
    type ScreenReading,
    type ShelfRow,
} from "#/src/ui/panel-reading.ts";
import { composeListName, type ScreenState } from "#/src/ui/panel-screen.ts";
import { presentStanding, type StandingReading } from "#/src/ui/panel-standing.ts";
import {
    CHOICE_REFUSED_ANSWER,
    EVERY_SLOT_PINNED_ANSWER,
    formatPlace,
    STORE_MADE_ROOM_ANSWER,
    STORE_REFUSED_ANSWER,
    type TranslateLabel,
} from "#/src/ui/panel-words.ts";
import { type OpenedReadings, presentOpenedReadings } from "./opened-reading.ts";

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
}

interface LiveRow {
    reading: FightReading;
    place: FightPlace | null;
    openedAt: number;
}

/** The four answers a shelf can give, of which at most three ever hold at once. */
const SHELF_ANSWERS_MAXIMUM = 3;

export function renderFrame(parts: FrameParts): void {
    assert(
        parts.keeper.getFights().length <= KEPT_MAXIMUM,
        "a frame draws a shelf inside its bound",
    );
    const tooltips = errors.attempt(() => renderFrameTooltips(parts));
    if (tooltips instanceof Error) addRegionDefect(parts, tooltips);
    renderFrameStanding(parts);
    const said = getPanelDefects(parts.defects);
    // Asked without decoding anything: a fight that will not read is still worth handing over.
    const hasFightToSave = parts.live.capture.calls.length > 0 ||
        parts.keeper.getFights().length > 0;
    const drawn = errors.attempt(() => renderFramePanel(parts, said, hasFightToSave));
    if (!(drawn instanceof Error)) return;
    parts.defects.add({ kind: DEFECT_KIND.reading, region: null, failure: drawn });
    const waiting = {
        isCollapsed: parts.screen.isCollapsed,
        defects: getPanelDefects(parts.defects),
        hasFightToSave,
        isFightUnread: true,
        keptUnread: null,
    };
    assert(waiting.defects.length > 0, "a panel that could not be drawn says why");
    addUndrawn(parts.defects, parts.view.renderWaiting(waiting));
}

/** After the engine's own call, where a frame falls: the game rebuilt its tooltips there. */
function renderFrameTooltips(parts: FrameParts): void {
    const view = getFightView(parts.live.session);
    if (view === null) return;
    const written = writeCarriedTooltips(view, parts.tables, parts.translate, parts.tooltip);
    if (written instanceof Error) addRegionDefect(parts, written);
    else assert(written.written <= written.asked, "no block lands that was not composed");
}

function addRegionDefect(parts: FrameParts, failure: RuntimeFailure): void {
    parts.defects.add({ kind: DEFECT_KIND.region, region: null, failure });
}

/**
 * The window beside the panel, before the panel: a fight the panel cannot read is not a fight the
 * window has nothing to say about. A reading that will not compose costs the window its body.
 */
function renderFrameStanding(parts: FrameParts): void {
    const read = errors.attempt(() => presentFrameStanding(parts.live, parts.tables));
    if (read instanceof Error) {
        parts.defects.add({ kind: DEFECT_KIND.reading, region: null, failure: read });
    }
    const reading = read instanceof Error ? null : read;
    addUndrawn(parts.defects, parts.view.renderStanding(reading, parts.screen.isStandingCollapsed));
}

/** Null where no payload has arrived: a fight nobody has seen has nothing standing on it. */
function presentFrameStanding(live: LiveFight, tables: TooltipTables): StandingReading | null {
    const view = getFightView(live.session);
    if (view === null) return null;
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

/**
 * Waiting where there is nothing to stand on — no fight and an empty shelf — because a panel of
 * zeroes over a game that has not started is a claim.
 */
function renderFramePanel(
    parts: FrameParts,
    said: readonly PanelDefect[],
    hasFightToSave: boolean,
): void {
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
        const drawn = parts.view.renderWaiting({ ...waiting, isFightUnread: false, keptUnread });
        addUndrawn(parts.defects, drawn);
        return;
    }
    assert(standing.reading.view.payloadsApplied > 0, "a fight stood on was read from something");
    const shown = presentFrameScreen(parts, standing, liveReading, said, hasFightToSave);
    addUndrawn(parts.defects, parts.view.render(shown));
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
    addFiguresDisagreed(parts.defects, reading, opened);
    // The row the panel is drawing: the kept one wherever there is no live fight to mark instead.
    const chosenFight = screen.openFightId ?? standing.kept?.openedAt ?? null;
    if (standing.kept !== null) assert(chosenFight !== null, "a kept fight on screen is one named");
    assert(reading.rows.length <= COMBATANTS_MAXIMUM, "a ranking holds the fight's cast at most");
    const liveRow = liveReading === null
        ? null
        : { reading: liveReading, place: live.place, openedAt: live.openedAt };
    return {
        reading,
        listName: composeListName(screen, chosenFight ?? live.openedAt),
        current: screen.current,
        side: screen.side,
        readerSide: view.readerSide,
        // A fight already over numbers nobody's turn, and one read off the shelf has passed.
        turnHolderId: view.isOver ? null : view.turnStatement?.combatantId ?? null,
        shelf: presentShelfRows(parts, liveRow, chosenFight),
        storage: keeper.getChoice(),
        hasFightToSave,
        shelfAnswers: presentShelfAnswers(keeper.getAnswers()),
        defects: said,
        isOnShelf: screen.isOnShelf,
        ...opened,
        place: formatFightPlace(standing.kept === null ? live.place : standing.kept.place),
        isCollapsed: screen.isCollapsed,
    };
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
 * Two counts of one figure came out different: the one thing the panel can say about a drawn
 * figure being wrong rather than short, and a defect rather than an assertion (`develop ADR 0051`).
 */
function addFiguresDisagreed(
    defects: DefectLedger,
    reading: ScreenReading,
    opened: OpenedReadings,
): void {
    const add = (cut: FiguresCut): void => {
        defects.add({
            kind: DEFECT_KIND.figures,
            region: null,
            failure: new FiguresDisagreed(cut),
        });
    };
    if (reading.hasFiguresDisagreed) add(FIGURES_CUT.screen);
    if (opened.drill?.hasFiguresDisagreed === true) add(FIGURES_CUT.drill);
    if (opened.pair?.hasFiguresDisagreed === true) add(FIGURES_CUT.pair);
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
        rows.push({
            openedAt: live.openedAt,
            at: parts.clock.readMoment(live.openedAt),
            sizes: presentShelfSizes(live.reading.view),
            place: formatFightPlace(live.place),
            outcome: presentOutcome(live.reading),
            isLive: true,
            // Nothing chosen is the live fight: a kept row's moment is never the live one's.
            isChosen: chosenId === null,
            isPinned: alsoKept?.isPinned ?? false,
            isPinnable: alsoKept !== undefined,
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

/** The reader's side first, then the rest in the game's own order. */
function presentShelfSizes(view: FightView): number[] {
    const countBySide = new Map<number, number>();
    const combatants = [...view.roster.byId.values()].slice(0, COMBATANTS_MAXIMUM);
    for (const one of combatants) countBySide.set(one.side, (countBySide.get(one.side) ?? 0) + 1);
    const readerSide = view.readerSide;
    const sides = [...countBySide].sort(([one], [other]) => {
        if (readerSide === one) return -1;
        if (readerSide === other) return 1;
        return one - other;
    });
    const sizes = sides.map(([, count]) => count);
    assert(sizes.every((count) => count > 0), "a side on the shelf holds somebody");
    assert(sizes.reduce((sum, count) => sum + count, 0) === combatants.length, "everybody, once");
    return sizes;
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
    return {
        openedAt: fight.openedAt,
        at: parts.clock.readMoment(fight.openedAt),
        sizes: presentShelfSizes(reading.view),
        place: formatFightPlace(fight.place),
        outcome: presentOutcome(reading),
        isLive: false,
        isChosen: chosenId === fight.openedAt,
        isPinned: fight.isPinned,
        isPinnable: true,
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
