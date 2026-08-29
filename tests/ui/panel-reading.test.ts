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
/** Every screen there is, so a claim about one of them is checked against the other three. */
const SCREENS: PanelMetric[] = [
    "damageDealtApplied",
    "damageTakenApplied",
    "damagePrevented",
    "healthGiven",
    "healthRestored",
];
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
    const reading = composePanelReading(statistics, roster, "damageDealtApplied", "everyone", null);
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
    const reading = composePanelReading(statistics, roster, "damageDealtApplied", "everyone", null);
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
    const reading = composePanelReading(statistics, roster, "damagePrevented", "everyone", null);
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
        "everyone",
        null,
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
    const dealt = composePanelReading(statistics, roster, "damageDealtApplied", "everyone", null);
    assertEquals(dealt.withoutActor, statistics.dealtByNobody, "the dealing side says so");
    assertEquals(dealt.withoutTarget, 0, "and the other is not that screen's to show");
    const taken = composePanelReading(statistics, roster, "damageTakenApplied", "everyone", null);
    assertEquals(taken.withoutTarget, statistics.takenByNobody, "the taking side says so");
    assert(dealt.withoutActor > 0, "and in this fight there is something nobody can be charged");
});

Deno.test("a fight with an unread key says every figure on it may be short", () => {
    const whole = readFight(HILDUR);
    const readable = composePanelReading(
        whole.statistics,
        whole.roster,
        "damageDealtApplied",
        "everyone",
        null,
    );
    assertEquals(whole.statistics.unreadMessages, 0, "every key this fight carries is read");
    assert(!readable.isSuspect, "so nothing on the screen is marked as short");

    // A probe, because no recording carries an unread key any more: the next protocol change is
    // what this mark exists for.
    const events = decodeFightMessages(["1=100.00;0;whatever_per=30"], whole.roster);
    const short = composePanelReading(
        composeFightStatistics(events, new Map()),
        whole.roster,
        "healthRestored",
        "everyone",
        null,
    );
    assert(short.isSuspect, "a key nobody has read leaves every figure beside it suspect");
    for (const metric of SCREENS) {
        const any = composePanelReading(
            composeFightStatistics(events, new Map()),
            whole.roster,
            metric,
            "everyone",
            null,
        );
        assert(any.isSuspect, `${metric}: an unread key could have carried anything`);
    }
});

Deno.test("a cast nobody could place shortens the healing, and says so only there", () => {
    const { roster, statistics } = readFight(HILDUR);
    // The same fight with none of its casts sized, which is how a cast nobody could place reaches
    // the figures: the event is there and the map has no answer for it.
    const unplaced = composeFightStatistics(
        getRecordedPayloads(HILDUR).flatMap((one) => decodeFightMessages(one, roster)),
        new Map(),
    );
    assertEquals(
        unplaced.unreadMessages,
        0,
        "nothing here is unread, so the casts are the whole of it",
    );
    assert(unplaced.castsUnplaced > 0, "and a cast went unplaced");
    for (const metric of SCREENS) {
        const reading = composePanelReading(unplaced, roster, metric, "everyone", null);
        if (metric === "healthRestored" || metric === "healthGiven") {
            assert(
                reading.isSuspect,
                "what a cast puts back is health, so both halves of it may be short",
            );
            continue;
        }
        assert(!reading.isSuspect, `${metric}: a cast cannot shorten a figure it never fed`);
    }
    assertEquals(
        composePanelReading(statistics, roster, "healthRestored", "everyone", null).isSuspect,
        false,
        "and a fight whose casts all placed says nothing",
    );
});

Deno.test("every recording composes every screen without inventing a row", () => {
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        for (const metric of SCREENS) {
            const reading = composePanelReading(statistics, roster, metric, "everyone", null);
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
    const reading = composePanelReading(statistics, roster, "damageDealtApplied", "everyone", null);
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
    const reading = composePanelReading(statistics, roster, "damageDealtApplied", "everyone", null);
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

/**
 * The side strip, held against a real fight rather than against a shape invented for it. The
 * reader's own side is what the client says and the protocol never does, so it is handed in.
 */
Deno.test("a side lists that side alone, and the two sides together are everybody", () => {
    const { roster, statistics } = readFight(HILDUR);
    const sides = new Set([...roster.byId.values()].map((one) => one.side));
    assert(sides.size > 1, "this fight is fought between two sides");
    const [readerSide] = [...sides];
    assert(readerSide !== undefined, "one of which is the reader's own");
    const everyone = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        readerSide,
    );
    const ours = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "reader",
        readerSide,
    );
    const theirs = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "opposing",
        readerSide,
    );
    assert(ours.rows.length > 0, "somebody is on the reader's side");
    assert(theirs.rows.length > 0, "and somebody is opposite them");
    assertEquals(ours.rows.length + theirs.rows.length, everyone.rows.length, "and nobody is lost");
    for (const row of ours.rows) assertEquals(row.side, readerSide, "a listed row is on that side");
    for (const row of theirs.rows) assert(row.side !== readerSide, "and the other list is not");
});

Deno.test("a share on one side's list is a share of that side, and the shares come to one", () => {
    const { roster, statistics } = readFight(HILDUR);
    const [readerSide] = [...new Set([...roster.byId.values()].map((one) => one.side))];
    assert(readerSide !== undefined, "the fight states a side");
    const ours = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "reader",
        readerSide,
    );
    let figure = 0;
    let share = 0;
    for (const row of ours.rows) {
        figure += row.figure;
        share += row.share;
    }
    assertEquals(ours.total, figure, "the total is the list's own, not the fight's");
    assert(ours.total < statistics.totals.damageDealtApplied, "which is less than the whole fight");
    assert(Math.abs(share - 1) < 0.0001, "and every row together is that side, once");
});

/**
 * Zero at the boundary, from both sides: a side that dealt nothing is still a list of people who
 * dealt nothing, and never a list scaled against a total of zero into shares nobody can read.
 */
Deno.test("a side that did nothing on this screen is drawn, at nothing", () => {
    const { roster, statistics } = readFight(HILDUR);
    const empty = composePanelReading(
        composeFightStatistics([], new Map()),
        roster,
        "damageDealtApplied",
        "reader",
        [...roster.byId.values()][0]?.side ?? 0,
    );
    assert(empty.rows.length > 0, "the people are still on the list");
    assertEquals(empty.total, 0, "and the list totals nothing");
    for (const row of empty.rows) assertEquals(row.share, 0, "with no share of a total of none");
    assert(
        statistics.totals.damageDealtApplied > 0,
        "while the fight this roster came from has one",
    );
});

Deno.test("a reader whose own side nobody stated is shown everybody, whatever was pressed", () => {
    const { roster, statistics } = readFight(HILDUR);
    const everyone = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
    );
    for (const choice of ["reader", "opposing"] as const) {
        const reading = composePanelReading(statistics, roster, "damageDealtApplied", choice, null);
        assertEquals(
            reading.rows.length,
            everyone.rows.length,
            `${choice}: nobody is filtered out`,
        );
        assertEquals(reading.total, everyone.total, "and the total stays the fight's own");
    }
});

/**
 * What belongs to nobody belongs to no side either. Putting it inside one side's total would be
 * claiming a side the log never stated, so it is shown only where everybody is.
 */
Deno.test("a figure nobody can be charged with is shown under everybody and nowhere else", () => {
    const { roster, statistics } = readFight(HILDUR);
    const [readerSide] = [...new Set([...roster.byId.values()].map((one) => one.side))];
    assert(readerSide !== undefined, "the fight states a side");
    const everyone = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        readerSide,
    );
    assert(everyone.withoutActor > 0, "this fight has damage tied to no attacker");
    for (const choice of ["reader", "opposing"] as const) {
        const narrowed = composePanelReading(
            statistics,
            roster,
            "damageDealtApplied",
            choice,
            readerSide,
        );
        assertEquals(
            narrowed.withoutActor,
            0,
            `${choice}: nothing is charged to a side by default`,
        );
    }
});

/** The screen that did not exist while healing was a noun with no direction. */
Deno.test("healing given is a screen of its own, and the two halves come to one figure", () => {
    const { roster, statistics } = readFight(HILDUR);
    const given = composePanelReading(statistics, roster, "healthGiven", "everyone", null);
    const received = composePanelReading(statistics, roster, "healthRestored", "everyone", null);
    assert(given.total > 0, "somebody in this fight put health back");
    assertEquals(
        given.total + given.withoutActor,
        received.total,
        "and every point given is a point somebody received",
    );
    assertEquals(given.withoutTarget, 0, "the giving side names no missing target");
    assertEquals(received.withoutActor, 0, "and the receiving side names no missing giver");
});

Deno.test("healing given and received come to one figure in every recording", () => {
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        const given = composePanelReading(statistics, roster, "healthGiven", "everyone", null);
        const received = composePanelReading(
            statistics,
            roster,
            "healthRestored",
            "everyone",
            null,
        );
        assertEquals(
            given.total + given.withoutActor,
            received.total,
            `${path}: a point put back is counted once at each end`,
        );
    }
});
