/**
 * One screen of a real fight, from the recordings through every layer that stands under it.
 *
 * The reading is where a figure meets a name, so the fights it is built from here are the ones
 * the decoder and the statistics were held to, rather than a shape invented for a screen.
 */

import { assert, assertEquals } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import type { PanelMetric } from "@/src/ui/panel-reading.ts";
import {
    composeDrillReading,
    composePairReading,
    composePanelReading,
    composeSkillReading,
    getTextForNamedPart,
    NOTHING_MISSED,
} from "@/src/ui/panel-reading.ts";
import { getWordsForDamageKind, HEALTH_LOSS_WORDS } from "@/src/ui/panel-words.ts";
import {
    getRecordedCombatants,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
/** Every screen there is, so a claim about one of them is checked against the other three. */
const SCREENS: PanelMetric[] = [
    "damageDealtApplied",
    "damageTakenApplied",
    "healthGiven",
    "healthRestored",
];
/**
 * A fight where a pair says more than the row above it **and** one where it says exactly that. On
 * `HILDUR` every pair opens: the boss both strikes and wounds each member, so a wound's ticks put
 * a second kind under every opponent (`src/core/fight-statistics.ts`, ADR 0022).
 */
const BOTH_KINDS_OF_PAIR = "captures/2026-08-15-tempest-grupa-vs-hildur-3-1786514810315-none.json";
/** The one recording where health goes down on a key of its own, and nowhere near a blow. */
const POISONED = "captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json";
const POISONED_ID = -255967;
const POISON = "-255967=19.27;0;poison=140,14";
/**
 * `2026-08-12-experimental-tancerz-vs-wojownik-1781609507010-none.json`: an announcement and the
 * swing under it,
 * which a block stopped in full.
 */
const BLOCKED = [
    "114881=95.35;195782=96.83;tspell=Błyskawiczny cios;skillId=209",
    "114881=95.35;195782=96.83;+dmg=1259;+dmgo=839;+acdmg=17;-blok=378;-dmg=0",
];

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
    const reading = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
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
    const reading = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
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
    const reading = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
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
        NOTHING_MISSED,
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
    const dealt = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    assertEquals(dealt.pinned.length, 1, "the dealing side pins the end the protocol left out");
    assertEquals(dealt.pinned[0]?.end, "actor", "which on that screen is the actor");
    assertEquals(dealt.pinned[0]?.figure, statistics.dealtByNobody, "at the figure it holds");
    assert((dealt.pinned[0]?.figure ?? 0) > 0, "and in this fight there is such a figure");
    const taken = composePanelReading(
        statistics,
        roster,
        "damageTakenApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
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
        NOTHING_MISSED,
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
        NOTHING_MISSED,
    );
    assertEquals(short.warnings.length, 1, "a key nobody read qualifies the figure beside it");
    for (const metric of SCREENS) {
        const any = composePanelReading(
            composeFightStatistics(events, new Map()),
            whole.roster,
            metric,
            "everyone",
            null,
            NOTHING_MISSED,
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
        const reading = composePanelReading(
            unplaced,
            roster,
            metric,
            "everyone",
            null,
            NOTHING_MISSED,
        );
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
        composePanelReading(statistics, roster, "healthRestored", "everyone", null, NOTHING_MISSED)
            .warnings,
        [],
        "and a fight whose casts all placed says nothing",
    );
});

Deno.test("every recording composes every screen without inventing a row", () => {
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        for (const metric of SCREENS) {
            const reading = composePanelReading(
                statistics,
                roster,
                metric,
                "everyone",
                null,
                NOTHING_MISSED,
            );
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
    const reading = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
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
    const reading = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
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
        assert(getWordsForDamageKind(kind) !== kind, `${kind} reaches a reader as a bare token`);
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

    // Every row of a ranking opens, including a combatant nothing has named yet: they stand on
    // the list at zero, and a press that drew nothing would read as a press that did not land —
    // which is the state every fight is in for its first payloads. Over `captures/` on
    // 2026-08-29 every recording names everybody before it ends, so the fight is stood up here.
    const opening = composeFightStatistics([], new Map());
    assertEquals(opening.byCombatantId.size, 0, "a fight nothing has happened in names nobody");
    const opened = composeDrillReading(opening, roster, "damageDealtApplied", held);
    assert(opened !== null, "and a row of it still opens");
    assertEquals(opened.total, 0, "onto a figure of nothing");
    assertEquals(opened.byOpponent.rows, [], "with no cut of it at all");
    assertEquals(
        composeDrillReading(opening, roster, "damageDealtApplied", 0),
        null,
        "while a row belonging to nobody in the fight still opens nothing",
    );
    assertEquals(
        composeDrillReading(statistics, roster, "damageDealtApplied", 0),
        null,
        "and a row belonging to nobody in the fight opens nothing at all",
    );
});

Deno.test("health that went down outside a blow is a kind of its own, named by its key", () => {
    const { roster } = readFight(POISONED);
    // A movement the protocol states on its own: no blow carried it and nobody is named for it,
    // but the key says what it was, so the cut by kind can hold what the cut by whom cannot.
    const events = decodeFightMessages([POISON], roster);
    const alone = composeFightStatistics(events, new Map());
    const drill = composeDrillReading(alone, roster, "damageTakenApplied", POISONED_ID);
    assert(drill !== null, "the row opens");
    assertEquals(drill.byElement.rows.length, 1, "with one kind under it");
    assertEquals(drill.byElement.rows[0]?.element, "poison", "the key the protocol stated");
    assertEquals(drill.byElement.rows[0]?.figure, 140, "at what went out under it");
    assertEquals(drill.byElement.unnamed, null, "and nothing left over for no kind at all");
    assertEquals(drill.byOpponent.unnamed?.figure, 140, "while nobody is named for doing it");
});

Deno.test("every point of damage taken states what it was made of, on every recording", () => {
    let byKey = 0;
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
            for (const row of taken.byElement.rows) {
                stated += row.figure;
                if (HEALTH_LOSS_WORDS[row.element] !== undefined) byKey += row.figure;
            }
            assertEquals(stated, taken.total, `${path}: the kinds come to the whole figure`);
            assertEquals(taken.byElement.unnamed, null, `${path}: with nothing carrying no kind`);
        }
    }
    // What a blow never carried, and what the cut would have had to call unknown before the key
    // it moved under was read as a kind: 637,599 over `captures/`, measured 2026-08-29.
    assertEquals(byKey, 637599, "and the health that moved outside a blow is named by its key");
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
        NOTHING_MISSED,
    );
    const ours = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "reader",
        readerSide,
        NOTHING_MISSED,
    );
    const theirs = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "opposing",
        readerSide,
        NOTHING_MISSED,
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
        NOTHING_MISSED,
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
        NOTHING_MISSED,
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
        NOTHING_MISSED,
    );
    for (const choice of ["reader", "opposing"] as const) {
        const reading = composePanelReading(
            statistics,
            roster,
            "damageDealtApplied",
            choice,
            null,
            NOTHING_MISSED,
        );
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
        NOTHING_MISSED,
    );
    assert(everyone.pinned.length > 0, "this fight has damage tied to no attacker");
    for (const choice of ["reader", "opposing"] as const) {
        const narrowed = composePanelReading(
            statistics,
            roster,
            "damageDealtApplied",
            choice,
            readerSide,
            NOTHING_MISSED,
        );
        assertEquals(narrowed.pinned, [], `${choice}: nothing is charged to a side by default`);
    }
});

/** The screen that did not exist while healing was a noun with no direction. */
Deno.test("healing given is a screen of its own, and the two halves come to one figure", () => {
    const { roster, statistics } = readFight(HILDUR);
    const given = composePanelReading(
        statistics,
        roster,
        "healthGiven",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    const received = composePanelReading(
        statistics,
        roster,
        "healthRestored",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    assert(given.total > 0, "somebody in this fight put health back");
    assertEquals(
        given.total + (given.pinned[0]?.figure ?? 0),
        received.total,
        "and every point given is a point somebody received",
    );
    // Nothing pinned on either side: every point this fight put back has a giver the reading can
    // name, so the rows hold the whole of it. What no giver can be read for is the test below,
    // which builds the figure rather than looking for one in material that no longer states it.
    assertEquals(given.pinned, [], "the giving side names a giver for all of it");
    assertEquals(received.pinned, [], "and so the receiving side has nothing to say it is short");
});

/**
 * The rule the fight above no longer states, kept alive on a figure built for it: a restoring key
 * nothing announced reaches somebody all the same, and the two screens say so differently — apart
 * on the giving side, where no row holds it, and as a cut on the receiving side, where they do.
 */
Deno.test("healing no giver can be read for is apart on one screen and a cut on the other", () => {
    const { roster } = readFight(HILDUR);
    const [healed] = [...roster.byId.keys()];
    assert(healed !== undefined, "the fight holds somebody to heal");
    const statistics = composeFightStatistics([{
        kind: "health-change",
        combatantId: healed,
        amount: 400,
        healthPercent: null,
        source: "bandage",
        declared: [],
        announced: null,
    }], new Map());
    const read = (metric: PanelMetric) =>
        composePanelReading(statistics, roster, metric, "everyone", null, NOTHING_MISSED);
    const given = read("healthGiven");
    assertEquals(given.pinned.map((one) => one.standing), ["apart"], "no row above it holds it");
    assertEquals(given.pinned[0]?.end, "actor", "and the end it could not name is the giver");
    assertEquals(given.pinned[0]?.figure, 400, "at the whole of the figure");
    const received = read("healthRestored");
    assertEquals(received.pinned.map((one) => one.standing), ["cut"], "the rows there hold it");
    assertEquals(received.pinned[0]?.figure, 400, "at the same figure, said once");
});

/**
 * `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json` carries two healers announcing
 * `Leczenie ran`, which
 * is what makes the merge legible: the received screen has no column for whose cast it was, so
 * two rows under one name would be two figures a reader cannot tell apart.
 */
Deno.test("what reached somebody is cut by the skill's name, whoever announced it", () => {
    const { roster, statistics } = readFight(HILDUR);
    const received = composePanelReading(
        statistics,
        roster,
        "healthRestored",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    const first = received.rows[0];
    assert(first !== undefined, "somebody in this fight was healed");
    const drill = composeDrillReading(statistics, roster, "healthRestored", first.combatantId);
    assert(drill !== null, "and their row opens");
    const names = drill.bySkill.rows.map((one) => getTextForNamedPart(one.part));
    assertEquals(names.length, new Set(names).size, "no name is drawn twice");
    assert(names.includes("Leczenie ran"), "the skill both healers announced is one row");
    const held = drill.bySkill.rows.reduce((sum, one) => sum + one.figure, 0);
    assert(held <= drill.total, "and the rows hold no more than the figure they cut");
});

/**
 * ⚠️ **A section is a cut of the figure over it, so a skill stands in it by what it did.** An
 * announcement on its own once put every aura, shout and heal under `Zadane` at nothing — 285 of
 * the 685 skill rows over `captures/` on 2026-08-30 — and a reader could not tell a skill that
 * dealt nothing from one that was never going to deal anything.
 */
Deno.test("a skill under damage dealt states damage, or a swing that landed none", () => {
    let drawn = 0;
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        for (const combatantId of roster.byId.keys()) {
            const drill = composeDrillReading(
                statistics,
                roster,
                "damageDealtApplied",
                combatantId,
            );
            if (drill === null) continue;
            for (const row of drill.bySkill.rows) {
                drawn += 1;
                if (row.part.kind !== "skill") continue;
                const held = statistics.byCombatantId.get(combatantId)?.skills.get(row.part.name);
                assert(held !== undefined, `${path}: a row under a name nothing announced`);
                if (held.dealt > 0) continue;
                assert(held.blows > 0, `${path}: ${row.part.name} deals nothing and never swung`);
            }
        }
    }
    assert(drawn > 0, "the material draws rows on this screen at all, or the walk found none");
});

/**
 * The other side of the same rule, and the material carries no fight where a skill's every swing
 * was stopped — so the sample is the two messages that shape one. `deno task drill` over
 * `captures/` on 2026-08-30: 53 of the 81 skills announced deal something, and none of the other
 * 28 ever swung.
 */
Deno.test("a skill whose swings all landed nothing still stands, at nothing", () => {
    const roster = composeCombatantRoster([
        { id: 114881, name: "Gracz 1", side: 1, profession: "t", level: 100, healthMaximum: 5000 },
        { id: 195782, name: "Gracz 2", side: 2, profession: "w", level: 100, healthMaximum: 5000 },
    ]);
    const events = decodeFightMessages(BLOCKED, roster);
    const statistics = composeFightStatistics(events, new Map());
    const drill = composeDrillReading(statistics, roster, "damageDealtApplied", 114881);
    assert(drill !== null, "the combatant who swung has a row that opens");
    const names = drill.bySkill.rows.map((one) => getTextForNamedPart(one.part));
    assertEquals(names, ["Błyskawiczny cios"], "the skill that swung is the one row drawn");
    assertEquals(drill.bySkill.rows[0]?.figure, 0, "standing at what the block left of it");
    assertEquals(drill.bySkill.rows[0]?.uses, 1, "and saying it was announced once");
});

Deno.test("healing given and received come to one figure in every recording", () => {
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        const given = composePanelReading(
            statistics,
            roster,
            "healthGiven",
            "everyone",
            null,
            NOTHING_MISSED,
        );
        const received = composePanelReading(
            statistics,
            roster,
            "healthRestored",
            "everyone",
            null,
            NOTHING_MISSED,
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
        composePanelReading(
            statistics,
            roster,
            "damageDealtApplied",
            "everyone",
            side,
            NOTHING_MISSED,
        ).outcome
    );
    assertEquals([...said].sort(), ["lost", "won"], "one seat won it and the other lost it");
    const seatless = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
        NOTHING_MISSED,
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
                NOTHING_MISSED,
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
    const taken = composePanelReading(
        statistics,
        roster,
        "damageTakenApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
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

    const dealt = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    const apart = dealt.pinned.find((one) => one.standing === "apart");
    assert(apart !== undefined, "the dealing side holds a figure no row above it does");
    const dealtRows = dealt.rows.map((one) => Number(one.shareText.slice(0, -1)));
    const dealtTogether = dealtRows.reduce((sum, one) => sum + one, 0);
    const pinnedShare = Number(apart.shareText.slice(0, -1));
    assertEquals(dealtTogether + pinnedShare, 100, "and there it is one of the parts of the whole");
});

/** The last rung: what passed between two of them, and what the protocol says about it. */
Deno.test("a pair states what passed between the two, and nothing that did not", () => {
    const { roster, statistics } = readFight(HILDUR);
    const reading = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    const first = reading.rows[0];
    assert(first !== undefined, "there is a row to open");
    const drill = composeDrillReading(statistics, roster, "damageDealtApplied", first.combatantId);
    assert(drill !== null, "and it opens");
    const other = drill.byOpponent.rows.find((one) => one.opensPair);
    assert(other !== undefined, "onto somebody the level under says something about");

    const pair = composePairReading(
        statistics,
        roster,
        "damageDealtApplied",
        first.combatantId,
        other.combatantId,
    );
    assert(pair !== null, "the pair opens");
    assertEquals(pair.total, other.figure, "at the figure the row that opened it stated");
    assertEquals(pair.otherName, other.name, "and about the combatant that row named");
    const kinds = pair.byElement.rows.reduce((sum, one) => sum + one.figure, 0);
    assertEquals(kinds, pair.total, "the kinds between them come to what passed between them");
    const parts = pair.parts.reduce((sum, one) => sum + one.figure, 0);
    assertEquals(
        parts,
        pair.total,
        "and so do the skills announced for it and the blows nothing stood in front of",
    );
    assert(
        pair.parts.some((one) => one.part.kind === "plain"),
        "the row closing the section is one of them here",
    );
    // No key rows on a damage screen: what a blow was made of stands in the section beside this
    // one, and drawing it here as well would draw it twice.
    assert(
        pair.parts.every((one) => one.part.kind !== "source"),
        "and none of them is a key the game named",
    );

    // And the skills reach the pair at all: a cut whose every skill came to nothing would still
    // add up, because the row that closes it is the remainder.
    let named = 0;
    for (const row of drill.byOpponent.rows) {
        const held = composePairReading(
            statistics,
            roster,
            "damageDealtApplied",
            first.combatantId,
            row.combatantId,
        );
        for (const one of held?.parts ?? []) {
            if (one.part.kind === "skill") named += one.figure;
        }
    }
    assert(named > 0, "and what this combatant announced reaches the pairs it was announced on");
});

/**
 * `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, the combatant at 475890: twenty
 * blows, every one of
 * them announced, and damage stated against a name beside them. The closing row is the remainder
 * of the figure rather than a second reading of it, so a cut that spent the announcement on the
 * blows alone left this combatant a row counting nought blows with a third of their damage in it.
 */
Deno.test("what a skill dealt holds the figures stated against a name, not only the blows", () => {
    const { roster, statistics } = readFight(HILDUR);
    const combatantId = 475890;
    const drill = composeDrillReading(statistics, roster, "damageDealtApplied", combatantId);
    assert(drill !== null, "the row opens");
    const held = drill.bySkill.rows.reduce((sum, one) => sum + one.figure, 0);
    assertEquals(held, drill.total, "the skills hold the whole of what this combatant dealt");
    assertEquals(drill.bySkill.plain, null, "so no row for a blow nothing announced is drawn");
    const figures = statistics.byCombatantId.get(combatantId);
    assertEquals(figures?.blowsWithoutSkill, 0, "which is the count that row would have stated");
    assert((figures?.blowsStruck ?? 0) > 0, "and the blows themselves were struck all the same");
});

Deno.test("a pair that would only repeat the row above it does not open", () => {
    const { roster, statistics } = readFight(BOTH_KINDS_OF_PAIR);
    const reading = composePanelReading(
        statistics,
        roster,
        "damageTakenApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    let closed = 0;
    let opened = 0;
    for (const row of reading.rows) {
        const drill = composeDrillReading(
            statistics,
            roster,
            "damageTakenApplied",
            row.combatantId,
        );
        assert(drill !== null, "a row on this screen opens");
        for (const other of drill.byOpponent.rows) {
            const pair = composePairReading(
                statistics,
                roster,
                "damageTakenApplied",
                row.combatantId,
                other.combatantId,
            );
            assert(pair !== null, "and every row of its cut names a pair");
            // The level under a pair says something where it holds more than one row. Where it
            // does not, it is the figure just pressed under another heading.
            const rows = pair.byElement.rows.length + pair.parts.length;
            if (other.opensPair) opened += 1;
            else closed += 1;
            assertEquals(other.opensPair, rows > 1, "which is what decides whether it opens");
        }
    }
    // Both answers occur on this fight, so neither branch of the rule is being read on faith.
    assert(opened > 0, "some pairs on this recording say more than the row above them");
    assert(closed > 0, "and some say exactly it");
});

/**
 * A level closes against the row that opened it, one rung deeper than the columns do.
 *
 * Health somebody put into themselves is health they gave, and it is inside the figure on the skill
 * row — so a level that left the caster out stated a smaller number than the row just pressed and
 * said nothing about the difference. Over `captures/` on 2026-08-30 that was 31 of the 74 levels a
 * reader can reach, 143,888 points, the largest single drop 13,167.
 */
Deno.test("a skill opened states the figure of the row that opened it, self-casts included", () => {
    let levels = 0;
    let withSelf = 0;
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        for (const combatantId of statistics.byCombatantId.keys()) {
            const drill = composeDrillReading(statistics, roster, "healthGiven", combatantId);
            if (drill === null) continue;
            for (const row of drill.bySkill.rows) {
                if (!row.opensSkill) continue;
                if (row.part.kind !== "skill") continue;
                const skill = composeSkillReading(
                    statistics,
                    roster,
                    "healthGiven",
                    combatantId,
                    row.part.name,
                );
                assert(skill !== null, `${path}: a skill marked as opening opens`);
                levels += 1;
                assertEquals(
                    skill.total,
                    row.figure,
                    `${path}: ${row.part.name} states the figure of the row it was opened from`,
                );
                const held = skill.byOpponent.rows.reduce((sum, one) => sum + one.figure, 0);
                assertEquals(
                    held + (skill.byOpponent.unnamed?.figure ?? 0),
                    skill.total,
                    `${path}: and the people under it come to the whole of it`,
                );
                const own = skill.byOpponent.rows.find((one) => one.combatantId === combatantId);
                if (own !== undefined) withSelf += 1;
            }
        }
    }
    assert(levels > 0, "the corpus holds skills a reader can open");
    assert(withSelf > 0, "and some of them put health into whoever announced them");
});

/**
 * What no announcement covered is named by the key the game stated it under, so a healing section
 * has nothing left to close against.
 *
 * The row that used to stand there said the game had not told us. The game had: over `captures/`
 * on 2026-08-30 the whole of it is `heal`, `legbon_lastheal` and `legbon_holytouch_heal`, and the
 * help calls the first of those an effect that fires in a turn the combatant stands below the
 * health they started with (article `view,372`, read 2026-08-26) — a regeneration, not a silence.
 */
Deno.test("a healing section names the keys the game stated, and closes against nothing", () => {
    let sections = 0;
    let announced = 0;
    let stated = 0;
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        for (const metric of ["healthGiven", "healthRestored"] as const) {
            for (const combatantId of statistics.byCombatantId.keys()) {
                const drill = composeDrillReading(statistics, roster, metric, combatantId);
                if (drill === null) continue;
                const cut = drill.bySkill;
                if (cut.rows.length === 0) continue;
                sections += 1;
                assertEquals(cut.plain, null, `${path}: a healing section closes against nothing`);
                const held = cut.rows.reduce((sum, one) => sum + one.figure, 0);
                assertEquals(held, drill.total, `${path}: and holds the whole of the figure`);
                for (const row of cut.rows) {
                    if (row.part.kind === "skill") announced += 1;
                    else stated += 1;
                    // A key opens nothing: the protocol states no second cut of one, and no count.
                    if (row.part.kind !== "source") continue;
                    assertEquals(row.uses, null, `${path}: a key counts nothing`);
                    assertEquals(row.opensSkill, false, `${path}: and opens nothing`);
                }
            }
        }
    }
    assert(sections > 0, "the corpus draws healing sections");
    assert(announced > 0, "some of their rows are announcements");
    assert(stated > 0, "and some are keys the game named with nothing announced in front");
});

/**
 * `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`: five healers, four announced skills
 * between them,
 * and health moving under `heal` with nothing announced in front of it.
 *
 * The pair is read off the giving end whichever way round the screen asks, so the two screens see
 * the same section — which is what the transpose here holds. What one gave the other is one fact.
 */
Deno.test("a healing pair says what passed between the two, and says it from both ends", () => {
    const { roster, statistics } = readFight(HILDUR);
    let announced = 0;
    let stated = 0;
    let pairs = 0;
    for (const metric of ["healthGiven", "healthRestored"] as const) {
        const reading = composePanelReading(
            statistics,
            roster,
            metric,
            "everyone",
            null,
            NOTHING_MISSED,
        );
        for (const row of reading.rows) {
            const drill = composeDrillReading(statistics, roster, metric, row.combatantId);
            assert(drill !== null, "a row on a healing screen opens");
            for (const other of drill.byOpponent.rows) {
                const pair = composePairReading(
                    statistics,
                    roster,
                    metric,
                    row.combatantId,
                    other.combatantId,
                );
                assert(pair !== null, "and every row of its cut names a pair");
                pairs += 1;
                assertEquals(pair.total, other.figure, "at the figure the row that opened it said");
                const held = pair.parts.reduce((sum, one) => sum + one.figure, 0);
                assertEquals(held, pair.total, "and its parts come to the whole of that figure");
                // No closing row on a healing screen: what no announcement covered is named by
                // the key the game stated it under, so nothing is left over to close against.
                assert(
                    pair.parts.every((one) => one.part.kind !== "plain"),
                    "with nothing standing in for what the game did not say",
                );
                for (const one of pair.parts) {
                    if (one.part.kind === "skill") announced += 1;
                    if (one.part.kind === "source") stated += 1;
                }
            }
        }
    }
    assert(pairs > 0, "the recording holds healing pairs to read");
    assert(announced > 0, "some of what passed between two of them was announced");
    assert(stated > 0, "and some of it the game named without announcing");

    const given = composePairReading(statistics, roster, "healthGiven", 469657, 445202);
    const received = composePairReading(statistics, roster, "healthRestored", 445202, 469657);
    assert(given !== null, "the healer's own screen states the pair");
    assert(received !== null, "and so does the healed combatant's");
    assertEquals(given.total, received.total, "at one figure, whichever end asks");
    assertEquals(given.parts, received.parts, "made of the same parts, in the same order");
});

/**
 * A single row is a repetition only where it adds no name. An announcement names the skill, which
 * the person row above it does not — and on the screen about what reached this combatant nothing
 * else says which of them cast which. A key adds no such name, and every single-key pair in the
 * corpus is somebody and themselves, whose keys `OD CZEGO` one rung up already lists.
 */
Deno.test("a healing pair that would only repeat the row above it does not open", () => {
    let closed = 0;
    let opened = 0;
    let named = 0;
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        for (const metric of ["healthGiven", "healthRestored"] as const) {
            for (const combatantId of statistics.byCombatantId.keys()) {
                const drill = composeDrillReading(statistics, roster, metric, combatantId);
                if (drill === null) continue;
                for (const other of drill.byOpponent.rows) {
                    const pair = composePairReading(
                        statistics,
                        roster,
                        metric,
                        combatantId,
                        other.combatantId,
                    );
                    assert(pair !== null, "a row of the cut names a pair");
                    if (other.opensPair) opened += 1;
                    else closed += 1;
                    const holds = pair.parts.length > 1 ||
                        pair.parts.some((one) => one.part.kind === "skill");
                    if (other.opensPair && pair.parts.length === 1) named += 1;
                    assertEquals(
                        other.opensPair,
                        holds,
                        `${path}: which is what decides whether it opens`,
                    );
                    // A row that opens on its own is an announcement and never a key: the key
                    // would be the figure just pressed under a word already on the screen above.
                    if (pair.parts.length !== 1) continue;
                    assertEquals(
                        other.opensPair,
                        pair.parts[0]?.part.kind === "skill",
                        `${path}: a lone row opens where it names a skill and not otherwise`,
                    );
                }
            }
        }
    }
    assert(opened > 0, "some healing pairs in the corpus say more than the row above them");
    assert(closed > 0, "and some say exactly it");
    assert(named > 0, "and some open on one row, because that row names the skill");
});

/**
 * A shape the recordings do not carry, held by a fight built by hand.
 *
 * Measured over `captures/` on 2026-08-29: one announced heal restores anything at all, and it
 * restores it to the combatant who announced it — a self-cast, which is the one case this level
 * refuses to open. So the announcement reaching somebody else is written out here rather than
 * waiting for a recording of it.
 */
/** The movement an announcement put behind it, aimed wherever the case being written needs it. */
function composeAnnouncedHeal(
    announced: { skillName: string; skillId: number; actorId: number },
    combatantId: number,
): BattleEvent {
    return {
        kind: "health-change",
        combatantId,
        amount: 500,
        healthPercent: null,
        source: "heal_target",
        declared: [],
        announced,
    };
}

Deno.test("a skill that reached somebody else opens onto whom, and a self-cast does not", () => {
    const { roster } = readFight(HILDUR);
    const [healer, healed] = [...roster.byId.keys()];
    assert(healer !== undefined && healed !== undefined, "the fight holds two people");
    const announced = { skillName: "Dotyk anioła", skillId: 77, actorId: healer };
    const statistics = composeFightStatistics([
        {
            kind: "skill-used",
            actorId: healer,
            targetId: healed,
            actorHealthPercent: null,
            targetHealthPercent: null,
            skillName: announced.skillName,
            skillId: announced.skillId,
            declared: [],
        },
        composeAnnouncedHeal(announced, healed),
    ], new Map());

    const drill = composeDrillReading(statistics, roster, "healthGiven", healer);
    assert(drill !== null, "the healer's row opens");
    const row = drill.bySkill.rows.find((one) =>
        one.part.kind === "skill" && one.part.name === announced.skillName
    );
    assert(row !== undefined, "onto the skill they announced");
    assertEquals(row.figure, 500, "at what it put back");
    assertEquals(row.uses, 1, "and how many times it was announced");
    assert(row.opensSkill, "and it opens, because it reached somebody other than them");

    const skill = composeSkillReading(
        statistics,
        roster,
        "healthGiven",
        healer,
        announced.skillName,
    );
    assert(skill !== null, "the skill opens");
    assertEquals(skill.total, 500, "at the figure the row that opened it stated");
    assertEquals(skill.byOpponent.rows.length, 1, "onto the one person it reached");
    assertEquals(skill.byOpponent.rows[0]?.combatantId, healed, "who is that person");
    assert(!(skill.byOpponent.rows[0]?.opensPair ?? true), "and nothing on this rung opens");

    // The same skill cast on nobody but the one who announced it: the level under it would name
    // the reader back to themselves, so there is nothing to open.
    const alone = composeFightStatistics([composeAnnouncedHeal(announced, healer)], new Map());
    const own = composeDrillReading(alone, roster, "healthGiven", healer);
    assert(own !== null, "a self-cast still opens the healer's own row");
    assert(!(own.bySkill.rows[0]?.opensSkill ?? true), "and the skill on it opens nothing");
    assertEquals(
        composeSkillReading(alone, roster, "healthGiven", healer, announced.skillName),
        null,
        "which is what asking for that level answers",
    );
});

Deno.test("a reading short of its own start or of a message says so, on every screen", () => {
    const { roster, statistics } = readFight(HILDUR);
    for (const metric of SCREENS) {
        const joined = composePanelReading(statistics, roster, metric, "everyone", null, {
            messagesLost: 0,
            hasJoinedInProgress: true,
        });
        assertEquals(joined.warnings.length, 1, `${metric}: a start nobody saw shortens it`);

        const lost = composePanelReading(statistics, roster, metric, "everyone", null, {
            messagesLost: 3,
            hasJoinedInProgress: false,
        });
        assertEquals(lost.warnings.length, 1, `${metric}: and so does a message that never came`);

        const whole = composePanelReading(statistics, roster, metric, "everyone", null, {
            messagesLost: 0,
            hasJoinedInProgress: false,
        });
        assertEquals(whole.warnings, [], `${metric}: a reading missing neither says nothing`);
    }
});

/** Widening to narrowing, and the healing screen is the only one that can say all four. */
Deno.test("what shortens a reading is said before what shortens one figure on it", () => {
    const { roster } = readFight(HILDUR);
    const events = decodeFightMessages(["1=100.00;0;whatever_per=30"], roster);
    const reading = composePanelReading(
        composeFightStatistics(events, composeTeamHeals(events, roster)),
        roster,
        "healthRestored",
        "everyone",
        null,
        { messagesLost: 2, hasJoinedInProgress: true },
    );
    assertEquals(
        reading.warnings.length,
        3,
        "three of the four, the fourth needing an unsized cast",
    );
    assert(reading.warnings[0]?.includes("w trakcie"), "the start nobody saw comes first");
    assert(reading.warnings[1]?.includes("nie dotarła"), "then what never arrived");
    assert(reading.warnings[2]?.includes("odczytać"), "then what arrived and could not be read");
});

/**
 * No recording carries a draw, so the one the panel draws is built by hand. A draw needs no seat:
 * the outcome is the same from either side, which is what separates it from the two above.
 */
Deno.test("a drawn fight reads the same from every seat, and from none", () => {
    const { roster } = readFight(HILDUR);
    const events = decodeFightMessages(["0;0;winner=?"], roster);
    const drawn = composeFightStatistics(events, new Map());
    assertEquals(drawn.outcome?.isDrawn, true, "the fight the decoder read is a draw");
    const sides = [...new Set([...roster.byId.values()].map((one) => one.side))];
    assert(sides.length > 1, "the fight has two seats to read it from");
    for (const side of [...sides, null]) {
        const reading = composePanelReading(
            drawn,
            roster,
            "damageDealtApplied",
            "everyone",
            side,
            NOTHING_MISSED,
        );
        assertEquals(reading.outcome, "drawn", `seat ${side}: a draw is nobody's win`);
    }
});
