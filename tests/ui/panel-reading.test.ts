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
    let fill = 0;
    for (const row of reading.rows) {
        assert(row.fill >= 0, "a bar is never below nothing");
        assert(row.fill <= 1, "and never longer than the row it is drawn in");
        assert(row.shareText.endsWith("%"), "and every row states its share of the whole");
        fill = Math.max(fill, row.fill);
    }
    assertEquals(fill, 1, "the biggest figure on the screen fills its row");
    assertEquals(reading.total, statistics.totals.damageDealtApplied, "the total is the fight's");
});

Deno.test("a combatant who did nothing is drawn at nothing, not left out", () => {
    const { roster, statistics } = readFight(HILDUR);
    // Not a received screen: everybody in this fight is struck and everybody is healed, so the
    // zero this test is about lives on one of the two the fight leaves somebody off.
    const reading = composePanelReading(statistics, roster, "damageDealtApplied", "everyone", null);
    const idle = reading.rows.filter((one) => one.figure === 0);
    assert(idle.length > 0, "in this fight somebody dealt no damage at all");
    for (const row of idle) assertEquals(row.shareText, "0%", "nothing measured, not unknown");
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
        assertEquals(row.shareText, "0%", "with no share of a fight that has none");
        assertEquals(row.fill, 0, "and no bar drawn for a figure nobody has yet");
        assert(row.name !== null, "and named, because the roster knew them before they acted");
    }
});

Deno.test("a figure nobody can be charged with stands apart from the rows", () => {
    const { roster, statistics } = readFight(HILDUR);
    const dealt = composePanelReading(statistics, roster, "damageDealtApplied", "everyone", null);
    assertEquals(dealt.pinned.length, 1, "the dealing side pins the end the protocol left out");
    assertEquals(dealt.pinned[0]?.end, "actor", "which on that screen is the actor");
    assertEquals(dealt.pinned[0]?.figure, statistics.dealtByNobody, "at the figure it holds");
    assert((dealt.pinned[0]?.figure ?? 0) > 0, "and in this fight there is such a figure");
    const taken = composePanelReading(statistics, roster, "damageTakenApplied", "everyone", null);
    // Zero on this recording, which is the boundary the other side of the same rule: a figure of
    // nothing is not pinned at all, because a row saying nothing was lost states a loss.
    assertEquals(statistics.takenByNobody, 0, "every blow in this fight found somebody");
    assertEquals(
        taken.pinned.map((one) => one.standing),
        ["cut"],
        "so the taking side pins only what its own rows already hold",
    );
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
    assertEquals(readable.warnings, [], "so nothing on the screen is qualified");

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
    assertEquals(short.warnings.length, 1, "a key nobody read qualifies the figure beside it");
    for (const metric of SCREENS) {
        const any = composePanelReading(
            composeFightStatistics(events, new Map()),
            whole.roster,
            metric,
            "everyone",
            null,
        );
        assertEquals(any.warnings.length, 1, `${metric}: an unread key could carry anything`);
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
            assertEquals(
                reading.warnings.length,
                1,
                "what a cast puts back is health, so both halves of it may be short",
            );
            continue;
        }
        assertEquals(reading.warnings, [], `${metric}: a cast never shortens what it never fed`);
    }
    assertEquals(
        composePanelReading(statistics, roster, "healthRestored", "everyone", null).warnings,
        [],
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
    for (const row of drill.byOpponent.rows) dealt += row.figure;
    assert(dealt > 0, "in this fight the blows reached somebody");
    assert(dealt <= drill.total, "and the parts never come to more than the whole");
    for (const [at, row] of drill.byOpponent.rows.entries()) {
        if (at === 0) continue;
        const above = drill.byOpponent.rows[at - 1];
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
    for (const row of drill.byElement.rows) dealt += row.figure;
    // Unlike the cut by whom, this one accounts for the whole figure: a blow the protocol tied to
    // nobody still states what it was dealt with, and what no blow carried is stated as its own.
    assertEquals(
        dealt + (drill.byElement.unnamed?.figure ?? 0),
        drill.total,
        "every point of the figure is in one kind or in none of them",
    );
    assertEquals(drill.byElement.unnamed, null, "in this fight nothing was lost outside a blow");
    assert(drill.byElement.rows.length > 1, "and the blows carried more than one kind");
    for (const [at, row] of drill.byElement.rows.entries()) {
        assert(row.element.length > 0, "a kind is the token the protocol stated");
        assert(row.shareText.length > 0, "and states a share of the row it was cut out of");
        if (at === 0) continue;
        const above = drill.byElement.rows[at - 1];
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
                for (const row of drill.byElement.rows) kinds.add(row.element);
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
    assertEquals(drill.byOpponent.rows, [], "with nobody at the other end of the blow");
    assertEquals(drill.byOpponent.unnamed?.figure, 40, "which the cut says outright");
    assertEquals(drill.byElement.rows.length, 1, "and one kind of damage all the same");
    assertEquals(drill.byElement.rows[0]?.element, "dmgf", "the one the protocol stated");
    assertEquals(drill.byElement.rows[0]?.figure, 40, "at what landed, never what was put out");
    assertEquals(drill.byElement.rows[0]?.shareText, "100%", "the whole of this row's figure");
});

Deno.test("every screen opens, and a row belonging to nobody in the fight opens nothing", () => {
    const { roster, statistics } = readFight(HILDUR);
    const held = [...statistics.byCombatantId.keys()][0];
    assert(held !== undefined, "the fight holds somebody");
    for (const screen of SCREENS) {
        const drill = composeDrillReading(statistics, roster, screen, held);
        assert(drill !== null, `${screen}: a row on every screen opens onto its own figure`);
        assertEquals(
            drill.total,
            drill.byOpponent.rows.reduce(
                (sum, one) => sum + one.figure,
                drill.byOpponent.unnamed?.figure ?? 0,
            ),
            `${screen}: and the cut by the other end comes to the figure it was cut from`,
        );
        // Not only that it adds up: a cut whose every figure was zero adds up too, with the whole
        // of it falling into the part the protocol named nobody for.
        assert(drill.byOpponent.rows.length > 0, `${screen}: and it names somebody`);
        const named = drill.byOpponent.rows.reduce((sum, one) => sum + one.figure, 0);
        assert(named > 0, `${screen}: for more than nothing`);
    }
    // The one screen with no second cut: the keys the protocol names belong to whoever received
    // the health, so a giver's row is cut by whom and by nothing else.
    const given = composeDrillReading(statistics, roster, "healthGiven", held);
    assertEquals(given?.byElement, { rows: [], unnamed: null }, "healing given is cut once");
    assertEquals(
        composeDrillReading(statistics, roster, "damageDealtApplied", 0),
        null,
        "and a row belonging to nobody in the fight opens nothing at all",
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
    assertEquals(drill.byElement.rows, [], "with no kind of damage under it");
    assertEquals(drill.byElement.unnamed?.figure, 140, "the whole of it carrying no kind");
    assertEquals(drill.byElement.unnamed?.figure, drill.total, "which is all this row came to");
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
            assertEquals(dealt.byElement.unnamed, null, `${path}: every blow dealt states a kind`);
            const taken = open("damageTakenApplied");
            assert(taken !== null, `${path}: the other damage screen cuts further too`);
            let stated = 0;
            for (const row of taken.byElement.rows) stated += row.figure;
            assertEquals(
                stated + (taken.byElement.unnamed?.figure ?? 0),
                taken.total,
                `${path}: the kinds and what carries none come to the figure`,
            );
            withoutElement += taken.byElement.unnamed?.figure ?? 0;
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
    for (const row of ours.rows) figure += row.figure;
    assertEquals(ours.total, figure, "the total is the list's own, not the fight's");
    assert(ours.total < statistics.totals.damageDealtApplied, "which is less than the whole fight");
    const shares = ours.rows.map((row) => Number(row.shareText.slice(0, -1)));
    const together = shares.reduce((sum, one) => sum + one, 0);
    assertEquals(together, 100, "and every row together is that side, once");
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
    for (const row of empty.rows) assertEquals(row.shareText, "0%", "no share of a nothing");
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
    assert(everyone.pinned.length > 0, "this fight has damage tied to no attacker");
    for (const choice of ["reader", "opposing"] as const) {
        const narrowed = composePanelReading(
            statistics,
            roster,
            "damageDealtApplied",
            choice,
            readerSide,
        );
        assertEquals(narrowed.pinned, [], `${choice}: nothing is charged to a side by default`);
    }
});

/** The screen that did not exist while healing was a noun with no direction. */
Deno.test("healing given is a screen of its own, and the two halves come to one figure", () => {
    const { roster, statistics } = readFight(HILDUR);
    const given = composePanelReading(statistics, roster, "healthGiven", "everyone", null);
    const received = composePanelReading(statistics, roster, "healthRestored", "everyone", null);
    assert(given.total > 0, "somebody in this fight put health back");
    assertEquals(
        given.total + (given.pinned[0]?.figure ?? 0),
        received.total,
        "and every point given is a point somebody received",
    );
    assertEquals(given.pinned[0]?.end, "actor", "the giving side names the giver it could not");
    assertEquals(given.pinned[0]?.standing, "apart", "as a figure no row above it holds");
    // The same points from the other end: the rows there hold them, so the row saying so is a cut
    // of the ranking rather than another part of it.
    assertEquals(received.pinned.map((one) => one.standing), ["cut"], "and the receiving side");
    assertEquals(received.pinned[0]?.figure, given.pinned[0]?.figure, "at the same figure");
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
            given.total + (given.pinned[0]?.figure ?? 0),
            received.total,
            `${path}: a point put back is counted once at each end`,
        );
    }
});

/**
 * How a fight went is the one reading composed from the client's own word about the seat rather
 * than from the protocol, which names both sides and says nothing about which is the reader's.
 */
Deno.test("a fight that ended says so from a seat, and says nothing without one", () => {
    const { roster, statistics } = readFight(HILDUR);
    const outcome = statistics.outcome;
    assert(outcome !== null, "this fight states how it ended");
    assert(outcome.wonNames.length > 0, "naming the side that won");
    assert(outcome.lostNames.length > 0, "and the side that lost");
    const sides = [...new Set([...roster.byId.values()].map((one) => one.side))];
    const said = sides.map((side) =>
        composePanelReading(statistics, roster, "damageDealtApplied", "everyone", side).outcome
    );
    assertEquals([...said].sort(), ["lost", "won"], "one seat won it and the other lost it");
    const seatless = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
    );
    // Not a loss and not a win: a fight the panel cannot place is not a fight it may call either.
    assertEquals(seatless.outcome, null, "a reader whose seat nobody stated is told nothing");
});

Deno.test("every recording states how it ended, and every seat in it reads a word", () => {
    let stated = 0;
    let seats = 0;
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        if (statistics.outcome !== null) stated += 1;
        for (const side of new Set([...roster.byId.values()].map((one) => one.side))) {
            const reading = composePanelReading(
                statistics,
                roster,
                "healthGiven",
                "everyone",
                side,
            );
            assert(reading.outcome !== null, `${path}: a seat this fight named reads no word`);
            seats += 1;
        }
    }
    // 28 recordings, one of which carries no roster at all and so has no seat to read from.
    assertEquals(stated, getRecordingPaths().length, "every recording carries an outcome");
    assertEquals(seats, 54, "and 27 of them state two sides apiece");
});

/**
 * The two ways a figure the protocol half-named can stand against the ranking, and the arithmetic
 * that tells them apart: a cut is already inside the rows, so it takes no part of the hundred.
 */
Deno.test("a figure the rows already hold is a cut of them, not another part of the whole", () => {
    const { roster, statistics } = readFight(HILDUR);
    const taken = composePanelReading(statistics, roster, "damageTakenApplied", "everyone", null);
    const cut = taken.pinned.find((one) => one.standing === "cut");
    assert(cut !== undefined, "in this fight somebody was struck by nobody the game named");
    assertEquals(cut.end, "actor", "and what it says is missing is who struck");
    const rows = taken.rows.map((one) => Number(one.shareText.slice(0, -1)));
    const together = rows.reduce((sum, one) => sum + one, 0);
    // The rows come to the whole on their own: the cut states a share of the same whole and adds
    // nothing to it, which is the overlap being drawn rather than hidden.
    assertEquals(together, 100, "the ranked rows are the whole screen by themselves");
    assert(cut.figure > 0, "while the cut still states a figure of its own");
    assertEquals(taken.total, statistics.totals.damageTakenApplied, "and the total is the fight's");

    const dealt = composePanelReading(statistics, roster, "damageDealtApplied", "everyone", null);
    const apart = dealt.pinned.find((one) => one.standing === "apart");
    assert(apart !== undefined, "the dealing side holds a figure no row above it does");
    const dealtRows = dealt.rows.map((one) => Number(one.shareText.slice(0, -1)));
    const dealtTogether = dealtRows.reduce((sum, one) => sum + one, 0);
    const pinnedShare = Number(apart.shareText.slice(0, -1));
    assertEquals(dealtTogether + pinnedShare, 100, "and there it is one of the parts of the whole");
});
