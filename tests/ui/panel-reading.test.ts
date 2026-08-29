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
import type { PanelMetric } from "@/src/ui/panel-reading.ts";
import { composeDrillReading, composePanelReading } from "@/src/ui/panel-reading.ts";
import { ELEMENT_WORDS } from "@/src/ui/panel-words.ts";
import {
    getRecordedCombatants,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur.json";
/** The one recording where health goes down on a key of its own, and nowhere near a blow. */
const POISONED = "captures/2026-08-04-tempest-lowca-vs-odyncze.json";
const POISONED_ID = -255967;
const POISON = "-255967=19.27;0;poison=140,14";

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
    for (const row of drill.byOpponent) dealt += row.figure;
    assert(dealt > 0, "in this fight the blows reached somebody");
    assert(dealt <= drill.total, "and the parts never come to more than the whole");
    for (const [at, row] of drill.byOpponent.entries()) {
        if (at === 0) continue;
        const above = drill.byOpponent[at - 1];
        assert(above !== undefined, "a row below the first has one above it");
        assert(above.figure >= row.figure, "the larger part is drawn first");
    }
});

Deno.test("the same figure is cut a second time, by the kind of damage each blow carried", () => {
    const { roster, statistics } = readFight(HILDUR);
    const reading = composePanelReading(statistics, roster, "damageDealtApplied");
    const first = reading.rows[0];
    assert(first !== undefined, "there is a row to open");
    const drill = composeDrillReading(statistics, roster, "damageDealtApplied", first.combatantId);
    assert(drill !== null, "a screen with a cut opens");
    let dealt = 0;
    for (const row of drill.byElement) dealt += row.figure;
    // Unlike the cut by whom, this one accounts for the whole figure: a blow the protocol tied to
    // nobody still states what it was dealt with, and what no blow carried is stated as its own.
    assertEquals(
        dealt + drill.withoutElement,
        drill.total,
        "every point of the figure is in one kind or in none of them",
    );
    assertEquals(drill.withoutElement, 0, "and in this fight this row lost nothing outside a blow");
    assert(drill.byElement.length > 1, "and in this fight the blows carried more than one kind");
    for (const [at, row] of drill.byElement.entries()) {
        assert(row.element.length > 0, "a kind is the token the protocol stated");
        assert(row.share > 0, "and states a share of the row it was cut out of");
        if (at === 0) continue;
        const above = drill.byElement[at - 1];
        assert(above !== undefined, "a kind below the first has one above it");
        assert(above.figure >= row.figure, "the larger kind is drawn first");
    }
});

Deno.test("every kind every recording states is one the panel has a word for", () => {
    const kinds = new Set<string>();
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        for (const metric of ["damageDealtApplied", "damageTakenApplied"] as const) {
            for (const combatantId of statistics.byCombatantId.keys()) {
                const drill = composeDrillReading(statistics, roster, metric, combatantId);
                assert(drill !== null, `${path}: a damage screen cuts further`);
                for (const row of drill.byElement) kinds.add(row.element);
            }
        }
    }
    assert(kinds.size > 0, "the recordings state kinds of damage");
    for (const kind of kinds) {
        assert(ELEMENT_WORDS[kind] !== undefined, `${kind} reaches a reader as a bare token`);
    }
});

Deno.test("a screen that cuts by nobody still cuts by what the blows carried", () => {
    const { roster } = readFight(HILDUR);
    // A blow the protocol tied to no actor: the target's own cut by whom cannot hold it, and its
    // cut by kind can, which is the pair failing apart rather than together.
    const events = decodeFightMessages(["0;-10000249=99.69;+dmgf=100;-dmgf=40"], roster);
    const alone = composeFightStatistics(events, new Map());
    const drill = composeDrillReading(alone, roster, "damageTakenApplied", -10000249);
    assert(drill !== null, "the row opens");
    assertEquals(drill.byOpponent, [], "with nobody at the other end of the blow");
    assertEquals(drill.byElement.length, 1, "and one kind of damage all the same");
    assertEquals(drill.byElement[0]?.element, "dmgf", "the one the protocol stated");
    assertEquals(drill.byElement[0]?.figure, 40, "at what landed, never at what was put out");
    assertEquals(drill.byElement[0]?.share, 1, "which is the whole of this row's figure");
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

Deno.test("health that went down outside a blow is a part of the figure carrying no kind", () => {
    const { roster } = readFight(POISONED);
    // A movement the protocol states on its own: it carries the figure and no kind of damage, so
    // there is nothing to charge it to. Over `captures/` on 2026-08-29 this happens on 45 of 530
    // combatant-and-screen pairs, in 28 recordings, and on damage taken every time.
    const events = decodeFightMessages([POISON], roster);
    const alone = composeFightStatistics(events, new Map());
    const drill = composeDrillReading(alone, roster, "damageTakenApplied", POISONED_ID);
    assert(drill !== null, "the row opens");
    assertEquals(drill.byElement, [], "with no kind of damage under it");
    assertEquals(drill.withoutElement, 140, "and the whole of the figure stated as carrying none");
    assertEquals(drill.withoutElement, drill.total, "which is all this row's figure came to");
});

Deno.test("a part carrying no kind is only ever a part of what a fighter took", () => {
    let withoutElement = 0;
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        for (const combatantId of statistics.byCombatantId.keys()) {
            const open = (metric: PanelMetric) => {
                return composeDrillReading(statistics, roster, metric, combatantId);
            };
            const dealt = open("damageDealtApplied");
            assert(dealt !== null, `${path}: a damage screen cuts further`);
            assertEquals(dealt.withoutElement, 0, `${path}: every blow dealt states its kind`);
            const taken = open("damageTakenApplied");
            assert(taken !== null, `${path}: the other damage screen cuts further too`);
            let stated = 0;
            for (const row of taken.byElement) stated += row.figure;
            assertEquals(
                stated + taken.withoutElement,
                taken.total,
                `${path}: the kinds and what carries none come to the figure`,
            );
            withoutElement += taken.withoutElement;
        }
    }
    assert(withoutElement > 0, "and the recordings hold health that moved outside a blow");
});
