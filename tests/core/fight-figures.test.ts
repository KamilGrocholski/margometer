/**
 * The figures of a fight, tallied from what the session holds.
 *
 * The seam is the point: the statistics are tested on events handed to them, and the session on
 * records handed to it, so only a fight run through both shows that the view hands the tally what
 * the tally was tested on. The records carry what a recording states of its own: the messages of
 * each call, and the cast off its snapshots on the first.
 */

import {
    assert,
    assertEquals,
    AssertionError,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import { indexTeamHeals } from "@/src/core/combatant-health.ts";
import { indexCombatantRoster } from "@/src/core/combatant-roster.ts";
import { tallyFightFigures, verifyFightFigures } from "@/src/core/fight-figures.ts";
import {
    commitPayload,
    type FightView,
    getFightView,
    initFightSession,
    type PayloadRecord,
    preparePayload,
    SESSION_OPTIONS,
} from "@/src/core/fight-session.ts";
import { tallyFightStatistics } from "@/src/core/fight-statistics.ts";
import {
    BLOWS_GRANTED,
    decodeRecordedFight,
    readRecordedFights,
    type RecordedFight,
} from "@/tests/recorded-fights.ts";

const NOTHING: PayloadRecord = {
    isInit: false,
    isEnd: false,
    messages: [],
    messagesStated: null,
    readerSide: null,
    isOnAuto: null,
    turnStatement: null,
    combatants: [],
    statusMasksByCombatantId: new Map(),
    chargeStatements: [],
};

function replayRecordedFight(fight: RecordedFight): FightView {
    const session = initFightSession(SESSION_OPTIONS);
    fight.payloads.forEach((messages, index) => {
        const isInit = index === 0;
        const combatants = isInit ? fight.combatants : [];
        const record = { ...NOTHING, isInit, messages, combatants };
        const prepared = preparePayload(session, record, BLOWS_GRANTED);
        assert(prepared.ok, `${fight.path}: a recorded call is inside every bound`);
        commitPayload(session, prepared.value);
    });
    const view = getFightView(session);
    assert(view !== null, `${fight.path}: the replay produced a fight`);
    return view;
}

Deno.test("a fight run through the session tallies what its events tally, everywhere", () => {
    let fights = 0;
    let sized = 0;
    for (const fight of readRecordedFights()) {
        const figures = tallyFightFigures(replayRecordedFight(fight));
        verifyFightFigures(figures);
        const events = decodeRecordedFight(fight).events;
        const roster = indexCombatantRoster(fight.combatants);
        const alone = tallyFightStatistics(events, indexTeamHeals(events, roster));
        assertEquals(figures.statistics, alone, `${fight.path}: the view hands over the fight`);
        assertStrictEquals(figures.payloadsApplied, fight.payloads.length, fight.path);
        fights += 1;
        sized += figures.heals.size;
    }
    assert(fights > 0, "the recordings were there to run");
    assert(sized > 0, "and some of them carry a cast sized onto a side");
});

Deno.test("figures are tallied from a fight that exists, and say what they stand on", () => {
    const session = initFightSession(SESSION_OPTIONS);
    const opened = preparePayload(session, { ...NOTHING, isInit: true }, BLOWS_GRANTED);
    assert(opened.ok, "a fight opens on nothing");
    commitPayload(session, opened.value);
    const view = getFightView(session);
    assert(view !== null, "and stands");
    const figures = tallyFightFigures(view);
    verifyFightFigures(figures);
    assertStrictEquals(figures.payloadsApplied, 1, "on its one payload");
    assertEquals(figures.statistics.byCombatantId.size, 0, "holding nobody's figures");
    assertThrows(
        () => tallyFightFigures({ ...view, payloadsApplied: 0 }),
        AssertionError,
        "figures are tallied from a fight that exists",
    );
});

Deno.test("figures one point off their own balance are refused where they are verified", () => {
    const fight = readRecordedFights().find((one) => one.combatants.length > 0);
    assert(fight !== undefined, "a recording with a cast");
    const figures = tallyFightFigures(replayRecordedFight(fight));
    verifyFightFigures(figures);
    const [id, row] = [...figures.statistics.byCombatantId][0] ?? [];
    assert(id !== undefined, "a fight with a row to move");
    assert(row !== undefined, "and the row itself");
    const moved = new Map(figures.statistics.byCombatantId);
    moved.set(id, { ...row, damageTakenApplied: row.damageTakenApplied + 1 });
    const skewed = { ...figures, statistics: { ...figures.statistics, byCombatantId: moved } };
    assertThrows(() => verifyFightFigures(skewed), AssertionError, "counted once at each end");
});
