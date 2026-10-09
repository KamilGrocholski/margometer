/**
 * The frame asked directly, for what the runtime cannot reach through a page: a ranking whose two
 * counts of one figure disagree. Core checks the figures before the panel sees them, so only a
 * `presentScreen` that broke could draw one, and the frame is handed such a reading here instead.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertInstanceOf,
    assertStrictEquals,
} from "@std/assert";
import * as errors from "#/libs/errors.ts";
import type { StatedSkills } from "#/src/core/aura-standing.ts";
import { BATTLE_EVENT } from "#/src/core/battle-event.ts";
import { CHARGED_SKILL_STATE } from "#/src/core/charged-skill.ts";
import { createFightSession, SESSION_OPTIONS } from "#/src/core/fight-session.ts";
import { createFightCapture } from "#/src/ports/fight-capture.ts";
import { DEFECT_KIND, initDefectLedger } from "#/src/runtime/defect-ledger.ts";
import { type KeptFightState, replayKeptFight } from "#/src/runtime/fight-state.ts";
import {
    FIGURES_CUT,
    FiguresDisagreed,
    type FrameParts,
    renderFrame,
} from "#/src/runtime/panel-frame.ts";
import type { KeptFight } from "#/src/runtime/shelf.ts";
import { STORAGE_CHOICE } from "#/src/ui/panel-choice.ts";
import type { ShownScreen, WaitingContent } from "#/src/ui/panel-element.ts";
import { createScreenState, OPENED_PART, PANEL_METRIC } from "#/src/ui/panel-screen.ts";
import { HELPER_ABSENCE, type HelperAbsence, type HelperContent } from "#/src/ui/panel-helper.ts";
import {
    EVERY_SLOT_PINNED_ANSWER,
    formatJoinedInProgressSuspicion,
    MOVE_REFUSED_ANSWER,
    PIN_REFUSED_ANSWER,
    STORE_REFUSED_ANSWER,
} from "#/src/ui/panel-words.ts";
import { composeFakeDocument } from "#/tests/fake-document.ts";
import { lookupRecordedFight, replayRecordedFight } from "#/tests/recorded-fights.ts";
import { RUNTIME_TABLES } from "#/tests/runtime-world.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";

Deno.test("a ranking whose two counts disagree is drawn, and said as the screen's", () => {
    const fight: KeptFight = {
        openedAt: 1,
        payloads: lookupRecordedFight(HILDUR).updates,
        place: null,
        readerId: null,
        margonemClientBuild: null,
        isPinned: false,
    };
    const replayed = replayKeptFight(fight, RUNTIME_TABLES.decoder, SESSION_OPTIONS);
    assert(!(replayed instanceof Error), "the recording replays");
    assert(replayed !== null, "into a fight");
    const whole = composeFrameWorld(fight, replayed);
    renderFrame(whole.parts);
    assertStrictEquals(whole.shown.length, 1, "a fight whose counts agree is drawn");
    assertEquals(whole.readFiguresSaid(), [], "and says nothing of its figures");

    // The screen's own count taken to nothing, so the rows hold more than it: the one way a
    // drawn figure is wrong rather than short, which `presentScreen` owns.
    const { statistics } = replayed.figures;
    const broken = composeFrameWorld(fight, {
        ...replayed,
        figures: {
            ...replayed.figures,
            statistics: {
                ...statistics,
                totals: { ...statistics.totals, [PANEL_METRIC.damageDealt]: 0 },
                damageDealtByNobody: 0,
            },
        },
    });
    renderFrame(broken.parts);
    assertStrictEquals(
        broken.shown.length,
        1,
        "a fight whose counts disagree is drawn all the same",
    );
    assertEquals(
        broken.readFiguresSaid(),
        [FIGURES_CUT.screen],
        "and the disagreement is said, once, as the screen's",
    );
});

/** Every part of a frame over one kept fight standing, with a view that keeps what it is handed. */
function composeFrameWorld(fight: KeptFight, reading: KeptFightState | null) {
    const shown: ShownScreen[] = [];
    const waited: WaitingContent[] = [];
    const standings: (HelperContent | HelperAbsence)[] = [];
    const defects = initDefectLedger({ console: { writeBrandedLine: () => {} } });
    const parts: FrameParts = {
        screen: createScreenState(false),
        keeper: {
            getFights: () => [fight],
            getChoice: () => STORAGE_CHOICE.local,
            getAnswers: () => ({
                isEverySlotPinned: false,
                hasStoreRefused: false,
                hasStoreMadeRoom: false,
                hasChoiceRefused: false,
                hasMoveRefused: false,
                hasPinRefused: false,
            }),
            getKeptFightStates: () => new Map([[fight.openedAt, reading]]),
            keep: () => {},
            pin: () => {},
            moveShelf: () => {},
        },
        live: {
            session: createFightSession(SESSION_OPTIONS),
            capture: createFightCapture(),
            snapshotBefore: null,
            place: null,
            readerId: null,
            openedAt: 0,
            openedAtRefusal: null,
            payloadRefusal: null,
            margonemEngineBattle: null,
        },
        defects,
        view: {
            element: composeFakeDocument().createElement("div"),
            render: (screen) => {
                shown.push(screen);
                return { undrawn: [] };
            },
            renderWaiting: (waiting) => {
                waited.push(waiting);
                return { undrawn: [] };
            },
            renderHelper: (standing) => {
                standings.push(standing);
                return { undrawn: [] };
            },
        },
        clock: {
            readNowMilliseconds: () => 1,
            readMoment: () => null,
            readTimestampText: () => "",
        },
        tooltip: { writeRows: () => ({ written: 0, refused: 0 }) },
        tables: RUNTIME_TABLES.tooltip,
        translate: () => null,
        world: null,
    };
    /** The cut each disagreement was said as, or the class of anything else said under figures. */
    const readFiguresSaid = () =>
        defects.getCounts().filter((defectCount) => defectCount.kind === DEFECT_KIND.figures).map((
            defectCount,
        ) => defectCount.first instanceof FiguresDisagreed
            ? defectCount.first.cut
            : defectCount.first.name
        );
    return { parts, shown, waited, standings, defects, readFiguresSaid };
}

/** A broken invariant the reader's layer passes over is carried out, and the frame says it. */
Deno.test("a nameless charge and a part cut by no id are said as the helper's and the part's", () => {
    const fight: KeptFight = {
        openedAt: 1,
        payloads: lookupRecordedFight(HILDUR).updates,
        place: null,
        readerId: null,
        margonemClientBuild: null,
        isPinned: false,
    };
    const replayed = replayKeptFight(fight, RUNTIME_TABLES.decoder, SESSION_OPTIONS);
    assert(!(replayed instanceof Error), "the recording replays");
    const { statistics } = replayed.figures;
    const [combatantId, figures] =
        [...statistics.byCombatantId].find(([, held]) =>
            held.damageDealtWithoutSkillByOpponent.size > 0
        ) ?? [];
    assert(combatantId !== undefined, "somebody struck under no announcement");
    assert(figures !== undefined, "and is tallied");
    const world = composeFrameWorld(fight, {
        ...replayed,
        figures: {
            ...replayed.figures,
            statistics: {
                ...statistics,
                byCombatantId: new Map([...statistics.byCombatantId, [combatantId, {
                    ...figures,
                    damageDealtWithoutSkillByOpponent: new Map([
                        ...figures.damageDealtWithoutSkillByOpponent,
                        ["nobody", 1],
                    ]),
                }]]),
            },
        },
    });
    world.parts.screen.openedCombatantId = combatantId;
    world.parts.screen.openPart = { kind: OPENED_PART.plain };
    const live = replayRecordedFight(lookupRecordedFight(HILDUR));
    const state = live.state;
    assert(state !== null, "the live fight stands");
    live.state = {
        ...state,
        chargedSkills: [{
            combatantId,
            skillName: "",
            turnsElapsed: 0,
            turnsStated: 1,
            state: CHARGED_SKILL_STATE.charging,
            endedAtOrdinal: null,
        }],
    };
    world.parts.live.session = live;
    world.parts.screen.chosenFightOpenedAt = fight.openedAt;
    renderFrame(world.parts);
    // The ledger keeps one row a kind, so the two stand as its count and its first.
    const said = world.defects.getCounts().filter((row) => row.kind === DEFECT_KIND.figures);
    assertStrictEquals(said.length, 1, "one row for the figures");
    assertStrictEquals(said[0]?.count, 2, "holding both, the helper's and the part's");
    assertEquals(world.readFiguresSaid(), [FIGURES_CUT.helper], "the window's said first");
    assertStrictEquals(
        world.shown[0]?.part?.hasFiguresDisagreed,
        true,
        "and the part carries its own",
    );
});

Deno.test("the window beside the panel says which reason leaves it nothing live to read", () => {
    const fight: KeptFight = {
        openedAt: 1,
        payloads: lookupRecordedFight(HILDUR).updates,
        place: null,
        readerId: null,
        margonemClientBuild: null,
        isPinned: false,
    };
    const replayed = replayKeptFight(fight, RUNTIME_TABLES.decoder, SESSION_OPTIONS);
    assert(!(replayed instanceof Error), "the recording replays");
    assert(replayed !== null, "into a fight");
    const waiting = composeFrameWorld(fight, replayed);
    waiting.parts.keeper = { ...waiting.parts.keeper, getFights: () => [] };
    renderFrame(waiting.parts);
    assertEquals(
        waiting.standings,
        [HELPER_ABSENCE.noFightYet],
        "no payload over an empty shelf is no fight yet",
    );

    const between = composeFrameWorld(fight, replayed);
    renderFrame(between.parts);
    assertEquals(
        between.standings,
        [HELPER_ABSENCE.betweenFights],
        "and over a kept fight the panel draws, never no fight at all",
    );

    const broken = composeFrameWorld(fight, replayed);
    broken.parts.live.session = replayRecordedFight(lookupRecordedFight(HILDUR));
    broken.parts.tables = {
        ...RUNTIME_TABLES.tooltip,
        get statedSkills(): StatedSkills {
            throw new Error("a reading that will not compose");
        },
    };
    renderFrame(broken.parts);
    assertEquals(
        broken.standings,
        [HELPER_ABSENCE.fightUnread],
        "a fight that arrived and would not read is never said to be no fight",
    );
    const readings = broken.defects.getCounts().filter((defectCount) =>
        defectCount.kind === DEFECT_KIND.reading
    );
    assertStrictEquals(readings.length, 1, "and what would not compose is a defect");
});

Deno.test("a kept fight that reads has its save, and one that does not read has none", () => {
    const fight: KeptFight = {
        openedAt: 1,
        payloads: lookupRecordedFight(HILDUR).updates,
        place: null,
        readerId: null,
        margonemClientBuild: null,
        isPinned: false,
    };
    const replayed = replayKeptFight(fight, RUNTIME_TABLES.decoder, SESSION_OPTIONS);
    assert(!(replayed instanceof Error), "the recording replays");
    assert(replayed !== null, "into a fight");
    const legible = composeFrameWorld(fight, replayed);
    renderFrame(legible.parts);
    assertStrictEquals(
        legible.shown[0]?.hasFightToSave,
        true,
        "a file is written from its reading",
    );

    const illegible = composeFrameWorld(fight, null);
    renderFrame(illegible.parts);
    assertStrictEquals(illegible.shown.length, 0, "a fight that does not read is not drawn");
    assertStrictEquals(illegible.waited[0]?.hasFightToSave, false, "and has no file to hand over");
});

/**
 * A kept fight the reader chose is drawn whatever the live fight does: the live one is tallied for
 * its shelf row alone, under a guard of its own, so one that breaks an invariant costs that row.
 */
Deno.test("a live fight that will not tally costs its row, and not the kept fight chosen", () => {
    const fight: KeptFight = {
        openedAt: 1,
        payloads: lookupRecordedFight(HILDUR).updates,
        place: null,
        readerId: null,
        margonemClientBuild: null,
        isPinned: false,
    };
    const replayed = replayKeptFight(fight, RUNTIME_TABLES.decoder, SESSION_OPTIONS);
    assert(!(replayed instanceof Error), "the recording replays");
    assert(replayed !== null, "into a fight");
    const world = composeFrameWorld(fight, replayed);
    const live = replayRecordedFight(lookupRecordedFight(HILDUR));
    // Healing below nothing, which the figures assert never happens: the live fight alone broken.
    live.events.push({
        kind: BATTLE_EVENT.healingToNamedCombatant,
        targetName: "nobody",
        targetId: null,
        targetHealthPercent: null,
        amount: -1,
        source: "heal=-1",
    });
    world.parts.live.session = live;
    world.parts.live.openedAt = null;
    world.parts.screen.chosenFightOpenedAt = fight.openedAt;
    renderFrame(world.parts);
    assertStrictEquals(world.waited.length, 0, "the panel does not wait");
    const shown = world.shown[0];
    assertExists(shown, "it draws the kept fight chosen");
    assertEquals(
        shown.shelf.map((shelfRow) => [shelfRow.openedAt, shelfRow.isLive]),
        [[fight.openedAt, false]],
        "beside no row for the live fight that would not tally",
    );
    const reading = world.defects.getCounts().find((defectCount) =>
        defectCount.kind === DEFECT_KIND.reading
    );
    assertExists(reading, "and the live fight's failure is a reading defect");
    assertInstanceOf(reading.first, errors.Caught, "carrying what its tally threw");
});

/**
 * The live fight is a shelf row whether or not the clock gave it a moment. Given one that a kept
 * fight carries, the two are one row with a pin; given none, the live row states none and has
 * nothing to pin, and the kept fight stands beside it.
 */
Deno.test("the live row carries the moment it was given, and none where the clock gave none", () => {
    const fight: KeptFight = {
        openedAt: 1,
        payloads: lookupRecordedFight(HILDUR).updates,
        place: null,
        readerId: null,
        margonemClientBuild: null,
        isPinned: false,
    };
    const replayed = replayKeptFight(fight, RUNTIME_TABLES.decoder, SESSION_OPTIONS);
    assert(!(replayed instanceof Error), "the recording replays");
    assert(replayed !== null, "into a fight");
    const readShelf = (openedAt: number | null) => {
        const world = composeFrameWorld(fight, replayed);
        world.parts.live.session = replayRecordedFight(lookupRecordedFight(HILDUR));
        world.parts.live.openedAt = openedAt;
        renderFrame(world.parts);
        return (world.shown[0]?.shelf ?? []).map((shelfRow) => ({
            openedAt: shelfRow.openedAt,
            isLive: shelfRow.isLive,
            isPinnable: shelfRow.isPinnable,
        }));
    };
    assertEquals(
        readShelf(fight.openedAt),
        [{ openedAt: fight.openedAt, isLive: true, isPinnable: true }],
        "the live fight a kept one shares a moment with is one row, pinned by that moment",
    );
    assertEquals(
        readShelf(null),
        [
            { openedAt: null, isLive: true, isPinnable: false },
            { openedAt: fight.openedAt, isLive: false, isPinnable: true },
        ],
        "and one with no moment states none, has nothing to pin, and stands beside the kept one",
    );
});

/**
 * A kept fight its payloads no longer read is a row beside the live one rather than a gap in the
 * shelf (ADR 0046): when it was and its pin, and nothing a reading would have said.
 */
Deno.test("a kept fight that does not read stands on the shelf, saying only what was kept", () => {
    const fight: KeptFight = {
        openedAt: 1,
        payloads: lookupRecordedFight(HILDUR).updates,
        place: null,
        readerId: null,
        margonemClientBuild: null,
        isPinned: true,
    };
    const world = composeFrameWorld(fight, null);
    world.parts.live.session = replayRecordedFight(lookupRecordedFight(HILDUR));
    world.parts.live.openedAt = null;
    renderFrame(world.parts);
    const shelf = world.shown[0]?.shelf ?? [];
    assertEquals(
        shelf.map((shelfRow) => [shelfRow.isLive, shelfRow.card.isUnread]),
        [[true, false], [false, true]],
        "the live fight, read, and the kept one beside it, unread",
    );
    const unread = shelf[1];
    assertExists(unread, "the kept fight is a row");
    assertEquals(
        {
            openedAt: unread.openedAt,
            sizes: unread.sizes,
            outcome: unread.outcome,
            isPinned: unread.isPinned,
            isPinnable: unread.isPinnable,
            suspicions: unread.card.suspicions,
            reader: unread.card.reader,
        },
        {
            openedAt: fight.openedAt,
            sizes: [],
            outcome: null,
            isPinned: true,
            isPinnable: true,
            suspicions: [],
            reader: null,
        },
        "its moment and its pin, and no headcount, ending, suspicion or character",
    );
});

/**
 * Each row's card says what is short about its own fight (ADR 0046): the mark on a kept row is
 * read off the kept reading, never off the fight the panel stands on.
 */
Deno.test("a kept row and the live one each say what is short about their own fight", () => {
    const fight: KeptFight = {
        openedAt: 1,
        payloads: lookupRecordedFight(HILDUR).updates,
        place: null,
        readerId: null,
        margonemClientBuild: null,
        isPinned: false,
    };
    const replayed = replayKeptFight(fight, RUNTIME_TABLES.decoder, SESSION_OPTIONS);
    assert(!(replayed instanceof Error), "the recording replays");
    assert(replayed !== null, "into a fight");
    const joined = { ...replayed, view: { ...replayed.view, hasJoinedInProgress: true } };
    const world = composeFrameWorld(fight, joined);
    world.parts.live.session = replayRecordedFight(lookupRecordedFight(HILDUR));
    world.parts.live.openedAt = null;
    renderFrame(world.parts);
    assertEquals(
        (world.shown[0]?.shelf ?? []).map((
            shelfRow,
        ) => [shelfRow.isLive, shelfRow.card.suspicions]),
        [[true, []], [false, [formatJoinedInProgressSuspicion()]]],
        "the live fight read whole says nothing, and the kept one read from its middle says so",
    );
});

/** The bound on answers is the most that can stand together, and two answers to one move cannot. */
Deno.test("every shelf answer that can stand at once is drawn, and two answers to a move are not", () => {
    const fight: KeptFight = {
        openedAt: 1,
        payloads: lookupRecordedFight(HILDUR).updates,
        place: null,
        readerId: null,
        margonemClientBuild: null,
        isPinned: false,
    };
    const replayed = replayKeptFight(fight, RUNTIME_TABLES.decoder, SESSION_OPTIONS);
    assert(!(replayed instanceof Error), "the recording replays");
    assert(replayed !== null, "into a fight");
    const answered = {
        isEverySlotPinned: true,
        hasStoreRefused: true,
        hasStoreMadeRoom: false,
        hasChoiceRefused: false,
        hasMoveRefused: true,
        hasPinRefused: true,
    };
    const crowded = composeFrameWorld(fight, replayed);
    crowded.parts.keeper = { ...crowded.parts.keeper, getAnswers: () => answered };
    renderFrame(crowded.parts);
    assertEquals(
        crowded.shown[0]?.shelfAnswers,
        [EVERY_SLOT_PINNED_ANSWER, STORE_REFUSED_ANSWER, MOVE_REFUSED_ANSWER, PIN_REFUSED_ANSWER],
        "one of each kind, in the order the shelf says them",
    );
    const torn = composeFrameWorld(fight, replayed);
    const twice = { ...answered, isEverySlotPinned: false, hasChoiceRefused: true };
    assertStrictEquals(Object.values(twice).filter(Boolean).length, 4, "inside the bound");
    torn.parts.keeper = { ...torn.parts.keeper, getAnswers: () => twice };
    renderFrame(torn.parts);
    assertStrictEquals(torn.shown.length, 0, "a move refused and its choice refused is a bug");
});
