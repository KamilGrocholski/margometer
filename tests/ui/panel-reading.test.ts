/**
 * One screen of a real fight, from the recordings through every layer that stands under it.
 *
 * The reading is where a figure meets a name, so the fights it is built from here are the ones
 * the decoder and the statistics were held to, rather than a shape invented for a screen.
 */

import { assert, assertEquals } from "@std/assert";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { composeDrillReading, composePanelReading } from "@/src/ui/panel-reading.ts";
import {
    getRecordedCombatants,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur.json";

function readFight(path: string) {
    const combatants = getRecordedCombatants(path);
    const roster = composeCombatantRoster(combatants);
    const events = getRecordedPayloads(path).flatMap((one) => decodeFightMessages(one, roster));
    // With the casts sized, as the add-on does it: without them the fight reads as suspect,
    // because a share nobody placed is exactly what that mark is for.
    return { roster, statistics: composeFightStatistics(events, composeTeamHeals(events, roster)) };
}

Deno.test("a screen shows every combatant, in the order the figures put them", () => {
    const { roster, statistics } = readFight(HILDUR);
    const reading = composePanelReading(statistics, roster, "damageDealtApplied");
    assert(reading.rows.length >= roster.byId.size, "nobody in the fight is left off the screen");
    for (const [at, row] of reading.rows.entries()) {
        if (at === 0) continue;
        const above = reading.rows[at - 1];
        assert(above !== undefined, "a row below the first has one above it");
        assert(above.figure >= row.figure, "the larger figure is drawn first");
    }
    assert(reading.rows[0] !== undefined, "there is a first row");
    assert(reading.rows[0].figure > 0, "and in this fight somebody dealt damage");
});

Deno.test("a share is the row against the fight, and the shares come to one", () => {
    const { roster, statistics } = readFight(HILDUR);
    const reading = composePanelReading(statistics, roster, "damageDealtApplied");
    let share = 0;
    for (const row of reading.rows) {
        assert(row.share >= 0, "a share is never below nothing");
        assert(row.share <= 1, "and never more than the whole");
        share += row.share;
    }
    assert(Math.abs(share - 1) < 0.0001, "every row together is the fight, once");
    assertEquals(reading.total, statistics.totals.damageDealtApplied, "the total is the fight's");
});

Deno.test("a combatant who did nothing is drawn at nothing, not left out", () => {
    const { roster, statistics } = readFight(HILDUR);
    // Not the healing screen: with the casts sized, every member of a side is healed by one, so
    // the zero this test is about lives on a screen not everybody appears on.
    const reading = composePanelReading(statistics, roster, "damagePrevented");
    const idle = reading.rows.filter((one) => one.figure === 0);
    assert(idle.length > 0, "in this fight somebody's defence stopped nothing at all");
    for (const row of idle) assertEquals(row.share, 0, "and their share is nothing, not unknown");
    assertEquals(
        reading.rows.length,
        new Set(reading.rows.map((one) => one.combatantId)).size,
        "1",
    );
});

Deno.test("a fight that has just opened draws its whole cast at nothing", () => {
    // The state no recording exercises whole: the roster is known from the opening payload and
    // nobody has acted yet, so every row exists and every figure is a zero that happened.
    const roster = composeCombatantRoster(getRecordedCombatants(HILDUR));
    const reading = composePanelReading(
        composeFightStatistics([], new Map()),
        roster,
        "damageDealtApplied",
    );
    assertEquals(reading.rows.length, roster.byId.size, "everybody in the fight is on the screen");
    assertEquals(reading.total, 0, "and nothing has happened yet");
    for (const row of reading.rows) {
        assertEquals(row.figure, 0, "each of them at nothing");
        assertEquals(row.share, 0, "with no share of a fight that has none");
        assert(row.name !== null, "and named, because the roster knew them before they acted");
    }
});

Deno.test("a figure nobody can be charged with stands apart from the rows", () => {
    const { roster, statistics } = readFight(HILDUR);
    const dealt = composePanelReading(statistics, roster, "damageDealtApplied");
    assertEquals(dealt.withoutActor, statistics.dealtByNobody, "the dealing side says so");
    assertEquals(dealt.withoutTarget, 0, "and the other is not that screen's to show");
    const taken = composePanelReading(statistics, roster, "damageTakenApplied");
    assertEquals(taken.withoutTarget, statistics.takenByNobody, "the taking side says so");
    assert(dealt.withoutActor > 0, "and in this fight there is something nobody can be charged");
});

Deno.test("a fight with an unread key says every figure on it may be short", () => {
    const whole = readFight(HILDUR);
    const readable = composePanelReading(whole.statistics, whole.roster, "damageDealtApplied");
    assertEquals(whole.statistics.unreadMessages, 0, "every key this fight carries is read");
    assert(!readable.isSuspect, "so nothing on the screen is marked as short");

    // A probe, because no recording carries an unread key any more: the next protocol change is
    // what this mark exists for.
    const events = decodeFightMessages(["1=100.00;0;whatever_per=30"], whole.roster);
    const short = composePanelReading(
        composeFightStatistics(events, new Map()),
        whole.roster,
        "healthRestored",
    );
    assert(short.isSuspect, "a key nobody has read leaves every figure beside it suspect");
});

Deno.test("every recording composes every screen without inventing a row", () => {
    const metrics = [
        "damageDealtApplied",
        "damageTakenApplied",
        "damagePrevented",
        "healthRestored",
    ] as const;
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        for (const metric of metrics) {
            const reading = composePanelReading(statistics, roster, metric);
            const ids = new Set(reading.rows.map((one) => one.combatantId));
            assertEquals(ids.size, reading.rows.length, `${path}: a combatant drawn twice`);
            for (const row of reading.rows) {
                assert(row.figure >= 0, `${path}: a figure below nothing`);
                if (row.name === null) continue;
                assertEquals(row.name, roster.byId.get(row.combatantId)?.name, `${path}: a name`);
            }
        }
    }
});

Deno.test("an opened row states the same figure, cut by whom each blow reached", () => {
    const { roster, statistics } = readFight(HILDUR);
    const reading = composePanelReading(statistics, roster, "damageDealtApplied");
    const first = reading.rows[0];
    assert(first !== undefined, "there is a row to open");
    const drill = composeDrillReading(statistics, roster, "damageDealtApplied", first.combatantId);
    assert(drill !== null, "a screen with a cut opens");
    assertEquals(drill.total, first.figure, "an opened row states the figure its row stated");
    assertEquals(drill.name, first.name, "and belongs to the same combatant");
    let dealt = 0;
    for (const row of drill.rows) dealt += row.figure;
    assert(dealt > 0, "in this fight the blows reached somebody");
    assert(dealt <= drill.total, "and the parts never come to more than the whole");
    for (const [at, row] of drill.rows.entries()) {
        if (at === 0) continue;
        const above = drill.rows[at - 1];
        assert(above !== undefined, "a row below the first has one above it");
        assert(above.figure >= row.figure, "the larger part is drawn first");
    }
});

Deno.test("a screen with no cut opens nothing, and neither does a row nobody holds", () => {
    const { roster, statistics } = readFight(HILDUR);
    const held = [...statistics.byCombatantId.keys()][0];
    assert(held !== undefined, "the fight holds somebody");
    assertEquals(
        composeDrillReading(statistics, roster, "healthRestored", held),
        null,
        "a screen the statistics cut no further stays closed",
    );
    assertEquals(
        composeDrillReading(statistics, roster, "damageDealtApplied", 0),
        null,
        "and so does a row belonging to nobody in the fight",
    );
});
