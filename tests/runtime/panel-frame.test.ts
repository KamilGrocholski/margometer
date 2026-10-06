/**
 * The frame asked directly, for what the runtime cannot reach through a page: a ranking whose two
 * counts of one figure disagree. Core checks the figures before the panel sees them, so only a
 * `presentScreen` that broke could draw one, and the frame is handed such a reading here instead.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import type { StatedSkills } from "#/src/core/aura-standing.ts";
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
import { createScreenState, PANEL_METRIC } from "#/src/ui/panel-screen.ts";
import { HELPER_ABSENCE, type HelperAbsence, type HelperContent } from "#/src/ui/panel-helper.ts";
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
    const defects = initDefectLedger({ writeBrandedLine: () => {} });
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
