/**
 * One screen of a real fight, from the recordings through every layer that stands under it.
 *
 * The reading is where a figure meets a name, so the fights it is built from here are the ones
 * the decoder and the statistics were held to, rather than a shape invented for a screen.
 */

import {
    assert,
    assertArrayIncludes,
    assertEquals,
    assertExists,
    assertNotStrictEquals,
    assertStrictEquals,
} from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import type { FightStatistics } from "@/src/core/fight-statistics.ts";
import type { PanelSideChoice } from "@/src/ui/panel-screen.ts";
import type {
    ElementRow,
    HalfNamedOpened,
    HalfNamedReading,
    NamedPart,
    OpponentRow,
    PanelMetric,
} from "@/src/ui/panel-reading.ts";
import {
    composeDrillReading,
    composeHalfNamedDrillReading,
    composeHalfNamedReading,
    composePairReading,
    composePanelReading,
    composePartReading,
    composeRowWarnings,
    getPinnedCase,
    getRowHasDoubt,
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
 * A fight where a pair says more than the row above it **and** one where it says exactly that.
 * Most recordings hold only the first: a boss that both strikes and wounds puts a second kind
 * under every opponent (`src/core/fight-statistics.ts`, ADR 0022), and an announcement opens a
 * pair that has only one. Over `captures/` on 2026-08-31 this recording is the widest of the four
 * that hold both, at 18 pairs that open against 1 that does not.
 */
const BOTH_KINDS_OF_PAIR = "captures/2026-08-12-tempest-grupa-vs-hildur-1-1786514810315-none.json";
/** The one recording where health goes down on a key of its own, and nowhere near a blow. */
const POISONED = "captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json";
/** The widest spread of keys behind a half-named figure in the corpus: four of them. */
const FOUR_KINDS = "captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json";
const POISONED_ID = -255967;
const POISON = "-255967=19.27;0;poison=140,14";
/** A blow the protocol gives no striker and no target: `0` is the segment that names nobody. */
const NEITHER_END = "0;0;+dmg=700;-dmg=700";
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
        assertExists(above, "a row below the first has one above it");
        assert(above.figure >= row.figure, "the larger figure is drawn first");
    }
    assertExists(reading.rows[0], "there is a first row");
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
        assertExists(row.name, "and named, because the roster knew them before they acted");
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
    assertExists(first, "there is a row to open");
    const drill = composeDrillReading(statistics, roster, "damageDealtApplied", first.combatantId);
    assertExists(drill, "a screen with a cut opens");
    assertEquals(drill.total, first.figure, "an opened row states the figure its row stated");
    assertEquals(drill.name, first.name, "and belongs to the same combatant");
    let dealt = 0;
    for (const row of drill.byOpponent.rows) dealt += row.figure;
    assert(dealt > 0, "in this fight the blows reached somebody");
    assert(dealt <= drill.total, "and the parts never come to more than the whole");
    for (const [at, row] of drill.byOpponent.rows.entries()) {
        if (at === 0) continue;
        const above: OpponentRow | undefined = drill.byOpponent.rows[at - 1];
        assertExists(above, "a row below the first has one above it");
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
    assertExists(first, "there is a row to open");
    const drill = composeDrillReading(statistics, roster, "damageDealtApplied", first.combatantId);
    assertExists(drill, "a screen with a cut opens");
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
        const above: ElementRow | undefined = drill.byElement.rows[at - 1];
        assertExists(above, "a kind below the first has one above it");
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
                assertExists(drill, `${path}: a damage screen cuts further`);
                for (const row of drill.byElement.rows) kinds.add(row.element);
            }
        }
    }
    assert(kinds.size > 0, "the recordings state kinds of damage");
    for (const kind of kinds) {
        assertNotStrictEquals(
            getWordsForDamageKind(kind),
            kind,
            `${kind} reaches a reader as a bare token`,
        );
    }
});

Deno.test("a screen that cuts by nobody still cuts by what the blows carried", () => {
    const { roster } = readFight(HILDUR);
    // A blow the protocol tied to no actor: the target's own cut by whom cannot hold it, and its
    // cut by kind can, which is the pair failing apart rather than together.
    const events = decodeFightMessages(["0;-10000249=99.69;+dmgf=100;-dmgf=40"], roster);
    const alone = composeFightStatistics(events, new Map());
    const drill = composeDrillReading(alone, roster, "damageTakenApplied", -10000249);
    assertExists(drill, "the row opens");
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
    assertExists(held, "the fight holds somebody");
    for (const screen of SCREENS) {
        const drill = composeDrillReading(statistics, roster, screen, held);
        assertExists(drill, `${screen}: a row on every screen opens onto its own figure`);
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
    assertExists(opened, "and a row of it still opens");
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
    assertExists(drill, "the row opens");
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
            assertExists(dealt, `${path}: a damage screen cuts further`);
            assertEquals(dealt.byElement.unnamed, null, `${path}: every blow dealt states a kind`);
            const taken = open("damageTakenApplied");
            assertExists(taken, `${path}: the other damage screen cuts further too`);
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
    assertExists(readerSide, "one of which is the reader's own");
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
    assertExists(readerSide, "the fight states a side");
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
    const apart = ours.pinned.filter((one) => one.standing === "apart");
    // The pinned figure is a part of this side like any row, so the hundred is theirs together.
    const pinned = apart.map((one) => Number(one.shareText.slice(0, -1)));
    const together = [...shares, ...pinned].reduce((sum, one) => sum + one, 0);
    assertEquals(together, 100, "and every part of it together is that side, once");
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
 * What names **neither** end is the one figure no side can be charged with, and no recording holds
 * any of it — `byNeitherEnd` is zero on all of `captures/`, 2026-08-31 — so the fight is built by
 * hand. A blow whose striker and target are both nobody is inside `dealtByNobody` and on no row,
 * which is what makes it a refusal rather than a third side.
 */
Deno.test("a figure nobody can be charged with is shown under everybody and nowhere else", () => {
    const { roster } = readFight(HILDUR);
    const [readerSide] = [...new Set([...roster.byId.values()].map((one) => one.side))];
    assertExists(readerSide, "the fight states a side");
    const events = decodeFightMessages([NEITHER_END], roster);
    const statistics = composeFightStatistics(events, new Map());
    assertEquals(statistics.byNeitherEnd, 700, "the fight is one blow naming neither end");
    assertEquals(statistics.byCombatantId.size, 0, "and it stands on nobody's row");
    const everyone = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        readerSide,
        NOTHING_MISSED,
    );
    assertEquals(everyone.pinned.map((one) => one.figure), [700], "under everybody it is drawn");
    for (const choice of ["reader", "opposing"] as const) {
        const narrowed = composePanelReading(
            statistics,
            roster,
            "damageDealtApplied",
            choice,
            readerSide,
            NOTHING_MISSED,
        );
        assertEquals(narrowed.pinned, [], `${choice}: no side is charged with it`);
    }
});

/**
 * The invariant the level exists to keep: a pinned row is the sum of what stands under it — **of
 * each of its two sections separately**, which is what makes them two cuts of one number rather
 * than two numbers. The people and the kinds are folded from one walk in `src/ui/panel-reading.ts`,
 * so this holds that walk to the figure the row draws beside it, over every recording, every screen
 * and every choice of side. **ADR 0038**, **ADR 0039**.
 */
/**
 * And the level under each row of it. Both shapes come off one fold, so what is checked here is
 * that neither reading of it loses a point: a person's keys total their own figure, a key's people
 * total the key's — the part naming neither end among them, because the row above counted it in.
 */
function assertHalfNamedCutTotals(
    statistics: FightStatistics,
    roster: CombatantRoster,
    held: HalfNamedReading,
    choice: PanelSideChoice,
    readerSide: number | null,
): void {
    const open = (opened: HalfNamedOpened) =>
        composeHalfNamedDrillReading(statistics, roster, held.case, choice, readerSide, opened);
    for (const person of held.rows) {
        const under = open({ kind: "person", combatantId: person.combatantId });
        assertExists(under, `${held.case}: a person on the level opens`);
        assertStrictEquals(under.opened, "person", "onto what their own share was dealt with");
        assertEquals(under.total, person.figure, "at their own figure and no other");
        const dealt = under.kinds.rows.reduce((sum, one) => sum + one.figure, 0);
        assertEquals(dealt, person.figure, "which its keys come to exactly");
        assertEquals(under.kinds.unnamed, null, "with nothing of it outside a key");
    }
    for (const kind of held.kinds.rows) {
        const under = open({ kind: "element", element: kind.element });
        assertEquals(under !== null, kind.opensPart, `${kind.element}: opens where a row holds it`);
        if (under === null) continue;
        assertStrictEquals(under.opened, "element", "a key opens onto whoever carries it");
        assertEquals(under.total, kind.figure, "at the key's own figure");
        const carried = under.rows.reduce((sum, one) => sum + one.figure, 0) +
            (under.neither?.figure ?? 0);
        assertEquals(carried, kind.figure, "which its people come to exactly");
    }
}

Deno.test("a pinned row is the whole of what stands under it, on every list", () => {
    let opened = 0;
    let people = 0;
    let kinds = 0;
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        const sides = [...new Set([...roster.byId.values()].map((one) => one.side))];
        for (const readerSide of [...sides, null]) {
            for (const metric of SCREENS) {
                for (const choice of ["everyone", "reader", "opposing"] as const) {
                    const reading = composePanelReading(
                        statistics,
                        roster,
                        metric,
                        choice,
                        readerSide,
                        NOTHING_MISSED,
                    );
                    for (const pinned of reading.pinned) {
                        const held = composeHalfNamedReading(
                            statistics,
                            roster,
                            pinned.case,
                            choice,
                            readerSide,
                        );
                        assert(
                            held !== null,
                            `${metric} ${choice}: a drawn row opens onto a level`,
                        );
                        assertEquals(held.total, pinned.figure, `${metric} ${choice}: same figure`);
                        const under = held.rows.reduce((sum, one) => sum + one.figure, 0) +
                            (held.neither?.figure ?? 0);
                        assertEquals(under, pinned.figure, `${metric} ${choice}: the level totals`);
                        const dealt = held.kinds.rows.reduce((sum, one) => sum + one.figure, 0);
                        assertEquals(dealt, pinned.figure, `${metric} ${choice}: the kinds total`);
                        assertEquals(
                            held.kinds.unnamed,
                            null,
                            `${metric} ${choice}: nothing of it falls outside a key`,
                        );
                        assertHalfNamedCutTotals(statistics, roster, held, choice, readerSide);
                        opened += 1;
                        people += held.rows.length;
                        kinds += held.kinds.rows.length;
                    }
                }
            }
        }
    }
    assert(opened > 0, "the corpus pins figures to open");
    assert(people > 0, "and somebody stands under them");
    assert(kinds > 0, "and the material says what each was dealt with");
});

/**
 * The end the game did name, and it is the **other** end from the one the row is named for: a
 * figure with no striker was still taken by somebody. Read on one recording rather than over the
 * corpus, because what is checked here is which people, not that the arithmetic closes.
 */
Deno.test("a pinned row opens onto the end the game did name, and never onto a guess", () => {
    const { roster, statistics } = readFight(HILDUR);
    const kase = getPinnedCase("damageDealtApplied", "actor");
    assertExists(kase, "damage dealt pins the striker the game left out");
    const held = composeHalfNamedReading(statistics, roster, kase, "everyone", null);
    assertExists(held, "and this fight has such a figure");
    assertEquals(held.end, "actor", "the row goes on saying which end was left out");
    assert(held.rows.length > 0, "and the level under it names the other one");
    for (const row of held.rows) {
        const figures = statistics.byCombatantId.get(row.combatantId);
        assertExists(figures, "a row on the level is somebody the statistics hold");
        assertEquals(
            row.figure,
            figures.damageTakenFromNobody,
            "and carries what they took from nobody, not a share of anything",
        );
    }
    const ranked = held.rows.map((one) => one.figure);
    assertEquals([...ranked].sort((one, other) => other - one), ranked, "ranked by the figure");
});

/**
 * Zero is a boundary, and it is the one that decides whether the row is there at all: a figure of
 * nothing is not pinned, so there is nothing to open. One point is.
 */
Deno.test("a half-named point opens a level, and none at all opens nothing", () => {
    const { roster } = readFight(HILDUR);
    const kase = getPinnedCase("damageDealtApplied", "actor");
    assertExists(kase, "damage dealt pins the striker the game left out");
    const struck = [...roster.byId.values()][0];
    assertExists(struck, "the fight has somebody to strike");
    const nothing = composeFightStatistics(decodeFightMessages([], roster), new Map());
    assertEquals(
        composeHalfNamedReading(nothing, roster, kase, "everyone", null),
        null,
        "a fight with no such figure opens nothing",
    );
    const one = `0;${struck.id}=50.00;+dmg=1;-dmg=1`;
    const events = decodeFightMessages([one], roster);
    const statistics = composeFightStatistics(events, new Map());
    const held = composeHalfNamedReading(statistics, roster, kase, "everyone", null);
    assertExists(held, "and one point of it opens a level");
    assertEquals(held.total, 1, "of that one point");
    assertEquals(held.rows.map((row) => row.combatantId), [struck.id], "under whoever took it");
    assertEquals(
        held.kinds.rows.map((row) => [row.element, row.figure]),
        [["dmg", 1]],
        "and under the key the protocol stated it with",
    );
});

/**
 * What a row naming nobody can still answer, and the reason it is worth opening where the level
 * above it lists one person. Read on the recording with the widest spread, so a cut that had
 * collapsed to a single key would show — and against the keys the protocol wrote, never a word of
 * ours. **ADR 0039.**
 */
Deno.test("a pinned row says what its figure was dealt with, key by key", () => {
    const { roster, statistics } = readFight(FOUR_KINDS);
    const kase = getPinnedCase("damageDealtApplied", "actor");
    assertExists(kase, "damage dealt pins the striker the game left out");
    const held = composeHalfNamedReading(statistics, roster, kase, "everyone", null);
    assertExists(held, "and this fight has such a figure");
    assertEquals(
        held.kinds.rows.map((one) => [one.element, one.figure]),
        [["poison", 7195], ["fire", 4104], ["wound", 1700], ["light", 428]],
        "the keys the protocol stated it under, ranked by the figure",
    );
    const dealt = held.kinds.rows.reduce((sum, one) => sum + one.figure, 0);
    assertEquals(dealt, held.total, "and they are the whole of it");
    const reached = held.rows.reduce((sum, one) => sum + one.figure, 0);
    assertEquals(
        reached,
        held.total,
        "as are the people, which is what makes them two cuts of one",
    );
    assertEquals(
        held.kinds.rows.every((one) => one.opensPart),
        true,
        "and each opens, because somebody's row carries it",
    );
});

/**
 * The row and the level under it are one walk, which is what lets the card over the row state that
 * level's own rows rather than a second count of them. Read over every recording and both screens
 * that pin a figure: a cut folded from a different set of people would show here and nowhere
 * else, because on screen the two stand a press apart. **ADR 0041.**
 */
Deno.test("a pinned row carries the cut the level under it draws, on every recording", () => {
    let read = 0;
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        for (const metric of ["damageDealtApplied", "damageTakenApplied"] as const) {
            const reading = composePanelReading(
                statistics,
                roster,
                metric,
                "everyone",
                null,
                NOTHING_MISSED,
            );
            for (const row of reading.pinned) {
                const held = composeHalfNamedReading(
                    statistics,
                    roster,
                    row.case,
                    "everyone",
                    null,
                );
                assertExists(held, `${path} ${row.case}: the pinned row opens`);
                assertEquals(
                    row.kinds.rows.map((one) => [one.element, one.figure, one.shareText]),
                    held.kinds.rows.map((one) => [one.element, one.figure, one.shareText]),
                    `${path} ${row.case}: the row states the level's own rows`,
                );
                assertEquals(row.kinds.unnamed, null, `${path} ${row.case}: and nothing besides`);
                const kinds = row.kinds.rows.reduce((sum, one) => sum + one.figure, 0);
                assertEquals(kinds, row.figure, `${path} ${row.case}: coming to the figure itself`);
                read += 1;
            }
        }
    }
    assert(read > 0, "the corpus pins figures for this to be read off at all");
});

/**
 * A key carrying both — somebody's row and the part that named neither end. No recording holds it,
 * because `byNeitherEnd` is zero over the corpus, and it is the one shape where the level under a
 * key would silently come to less than the key above it.
 */
Deno.test("a key opened carries the part of it nobody's row holds", () => {
    const { roster } = readFight(HILDUR);
    const struck = [...roster.byId.values()][0];
    assertExists(struck, "the fight has somebody to strike");
    const events = decodeFightMessages([`0;${struck.id}=50.00;+dmg=1;-dmg=1`, NEITHER_END], roster);
    const statistics = composeFightStatistics(events, new Map());
    const kase = getPinnedCase("damageDealtApplied", "actor");
    assertExists(kase, "damage dealt pins the striker the game left out");
    const held = composeHalfNamedReading(statistics, roster, kase, "everyone", null);
    assertExists(held, "the figure is pinned, so it opens");
    assertEquals(held.total, 701, "one point on a row, seven hundred on nobody's");
    assertEquals(
        held.kinds.rows.map((one) => [one.element, one.figure]),
        [["dmg", 701]],
        "and both stand under the one key the protocol wrote them with",
    );
    const under = composeHalfNamedDrillReading(statistics, roster, kase, "everyone", null, {
        kind: "element",
        element: "dmg",
    });
    assertExists(under, "which opens, because somebody's row carries part of it");
    assertStrictEquals(under.opened, "element", "onto whoever carries it");
    assertEquals(under.rows.map((one) => one.figure), [1], "the point that is on a row");
    assertEquals(under.neither?.figure, 700, "and the seven hundred that is on none");
    assertEquals(under.total, 701, "which is the figure the key above it states");
});

/**
 * The one pinned case whose level lists the people who **struck**, and the only one on any screen
 * whose end is `target`. No recording carries a blow the protocol gives a striker and no target —
 * `takenByNobody` is zero over the corpus — so the fight is built here.
 */
Deno.test("a blow with nobody at the far end opens onto whoever struck it", () => {
    const { roster } = readFight(HILDUR);
    const [striker] = [...roster.byId.values()];
    assertExists(striker, "the fight holds somebody to swing");
    const events = decodeFightMessages([`${striker.id}=90.00;0;+dmg=500;-dmg=500`], roster);
    const statistics = composeFightStatistics(events, new Map());
    assertEquals(statistics.takenByNobody, 500, "the blow found nobody");
    assertEquals(statistics.byNeitherEnd, 0, "but it was struck by somebody the game named");
    const kase = getPinnedCase("damageTakenApplied", "target");
    assertExists(kase, "damage taken pins the target the game left out");
    const held = composeHalfNamedReading(statistics, roster, kase, "everyone", striker.side);
    assertExists(held, "the figure is pinned, so it opens");
    assertEquals(held.end, "target", "the row goes on saying the target was the end left out");
    assertEquals(held.rows.map((one) => one.combatantId), [striker.id], "and names who swung");
    assertEquals(held.rows[0]?.figure, 500, "at the whole of the figure");
    assertEquals(held.neither, null, "with nothing left over, because one end was named");
    assertEquals(
        held.kinds.rows.map((one) => [one.element, one.figure]),
        [["dmg", 500]],
        "and says what it was dealt with, on the one case no recording carries",
    );
});

/**
 * What named neither end is inside the count and on nobody's row, so the level closes against it
 * or falls short of the figure over it. `byNeitherEnd` is zero over every recording, so the fight
 * is built here — `docs/drill-levels.md` says as much under what the recordings do not carry.
 */
Deno.test("what named neither end closes the level it is inside", () => {
    const { roster } = readFight(HILDUR);
    const [readerSide] = [...new Set([...roster.byId.values()].map((one) => one.side))];
    assertExists(readerSide, "the fight states a side");
    const events = decodeFightMessages([NEITHER_END], roster);
    const statistics = composeFightStatistics(events, new Map());
    const kase = getPinnedCase("damageDealtApplied", "actor");
    assertExists(kase, "damage dealt pins the striker the game left out");
    const held = composeHalfNamedReading(statistics, roster, kase, "everyone", readerSide);
    assertExists(held, "the figure is pinned, so it opens");
    assertEquals(held.rows, [], "and nobody stands under it, because nobody was named");
    assertEquals(held.neither?.figure, 700, "the whole of it closes against what named no end");
    assertEquals(held.total, 700, "which is the figure the row states");
    assertEquals(
        held.kinds.rows.map((one) => [one.element, one.figure]),
        [["dmg", 700]],
        "and it still says what it was dealt with: a key is stated against the movement itself",
    );
    for (const choice of ["reader", "opposing"] as const) {
        assertEquals(
            composeHalfNamedReading(statistics, roster, kase, choice, readerSide),
            null,
            `${choice}: no side is charged with it, so no side opens it`,
        );
    }
});

/**
 * The charge ADR 0013 states for the strip, read on the ranking standing under it: a list a
 * reader narrowed to one side divides its shares by that side's own figure, pinned rows included.
 * The two arms reach it through different fields — the rows off each combatant's own figure, the
 * pinned row off whoever the game did name at the other end — so a charge that stopped agreeing
 * with the strip lights this up rather than quietly shortening a list. **ADR 0036.**
 */
Deno.test("a one-side list divides by the figure the strip states for that side", () => {
    let checked = 0;
    let charged = 0;
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        for (const side of new Set([...roster.byId.values()].map((one) => one.side))) {
            if (side === null) continue;
            for (const metric of SCREENS) {
                for (const choice of ["reader", "opposing"] as const) {
                    const reading = composePanelReading(
                        statistics,
                        roster,
                        metric,
                        choice,
                        side,
                        NOTHING_MISSED,
                    );
                    const sides = reading.sides;
                    assertExists(sides, `${path}: a seat states two figures`);
                    const apart = reading.pinned
                        .filter((one) => one.standing === "apart")
                        .reduce((sum, one) => sum + one.figure, 0);
                    assertEquals(
                        reading.total + apart,
                        choice === "reader" ? sides.ours : sides.theirs,
                        `${path}: ${metric} under ${choice} is that side's own figure`,
                    );
                    checked += 1;
                    if (apart > 0) charged += 1;
                }
            }
        }
    }
    assertEquals(checked, 432, "every seat of the corpus, on every screen, both ways round");
    assertEquals(charged, 76, "and this many of them stand over a figure charged to that side");
});

/**
 * The mirror ADR 0013 pays for the strip with, read off the ranking instead: a blow the protocol
 * gave no striker stands apart on the side it is charged to and as a cut of the rows on the side
 * that took it, at one figure. The two are summed from different fields of the statistics, so a
 * crossing rule that stopped crossing breaks the equality rather than moving a figure.
 */
Deno.test("what one side dealt with no striker named is what the other took from nobody", () => {
    let seats = 0;
    let together = 0;
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        for (const side of new Set([...roster.byId.values()].map((one) => one.side))) {
            if (side === null) continue;
            const dealt = composePanelReading(
                statistics,
                roster,
                "damageDealtApplied",
                "reader",
                side,
                NOTHING_MISSED,
            );
            const taken = composePanelReading(
                statistics,
                roster,
                "damageTakenApplied",
                "opposing",
                side,
                NOTHING_MISSED,
            );
            const apart = dealt.pinned.find((one) => one.standing === "apart");
            const cut = taken.pinned.find((one) => one.standing === "cut");
            assertEquals(
                apart?.figure ?? 0,
                cut?.figure ?? 0,
                `${path}: what we dealt with no striker is what they took from nobody`,
            );
            seats += 1;
            together += apart?.figure ?? 0;
        }
    }
    assertEquals(seats, 54, "every seat of the corpus reads the mirror");
    assertEquals(together, 607970, "and this is what it comes to over all of them");
});

/** Two people, one apiece, so a side can be charged with something or with nothing. */
const TWO_SIDES = composeCombatantRoster([
    { id: 1, name: "Gracz 1", side: 1, profession: "t", level: 100, healthMaximum: 5000 },
    { id: 2, name: "Gracz 2", side: 2, profession: "w", level: 100, healthMaximum: 5000 },
]);

/**
 * Zero at the boundary, and one beside it: a side charged with a single point says so, and the
 * side charged with none of it draws no row at all rather than a row reading nothing. The blow
 * lands on the other side, so the charge is the crossing one — which is the point of the sample.
 */
Deno.test("a side charged with a point states it, one charged with none draws nothing", () => {
    const struck = composeFightStatistics(
        decodeFightMessages(["0;2=90.00;+dmg=1;-dmg=1"], TWO_SIDES),
        new Map(),
    );
    const read = (statistics: typeof struck, choice: "reader" | "opposing") =>
        composePanelReading(statistics, TWO_SIDES, "damageDealtApplied", choice, 1, NOTHING_MISSED);
    assertEquals(read(struck, "reader").pinned.map((one) => one.figure), [1], "one point, stated");
    assertEquals(read(struck, "opposing").pinned, [], "and the side it is not charged to has none");
    const quiet = composeFightStatistics([], new Map());
    assertEquals(read(quiet, "reader").pinned, [], "a fight with no such blow pins nothing");
    assertEquals(read(quiet, "opposing").pinned, [], "on either side of it");
});

/**
 * Healing does not cross, so the giver a message left out is charged to the side of whoever it
 * reached — and both screens of one side say the same figure, one apart and one as a cut. No
 * recording states restored health with no giver (`givenByNobody` is zero over `captures/`,
 * 2026-08-31), so the figure is built rather than looked for.
 */
Deno.test("a giver the protocol left out is charged to the side the health reached", () => {
    const statistics = composeFightStatistics([{
        kind: "health-change",
        combatantId: 1,
        amount: 500,
        healthPercent: null,
        source: "bandage",
        declared: [],
        announced: null,
    }], new Map());
    const read = (metric: PanelMetric, choice: "reader" | "opposing") =>
        composePanelReading(statistics, TWO_SIDES, metric, choice, 1, NOTHING_MISSED);
    const given = read("healthGiven", "reader");
    assertEquals(given.pinned.map((one) => one.standing), ["apart"], "no row of ours holds it");
    assertEquals(given.pinned[0]?.figure, 500, "at the whole of the figure");
    const restored = read("healthRestored", "reader");
    assertEquals(restored.pinned.map((one) => one.standing), ["cut"], "the row that got it does");
    assertEquals(restored.pinned[0]?.figure, 500, "at the same figure, said once");
    assertEquals(read("healthGiven", "opposing").pinned, [], "and the other side gave none of it");
    assertEquals(read("healthRestored", "opposing").pinned, [], "nor received any");
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
    assertExists(healed, "the fight holds somebody to heal");
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
    // Both open onto the same person, because on both screens the end the game named is whoever
    // the health reached. No recording pins either, so this is where the two cases are held.
    for (const kase of ["givenWithNoActor", "restoredWithNoActor"] as const) {
        const held = composeHalfNamedReading(statistics, roster, kase, "everyone", null);
        assertExists(held, `${kase}: the pinned row opens`);
        assertEquals(held.end, "actor", `${kase}: onto the end the game did name`);
        assertEquals(held.total, 400, `${kase}: at the figure the row states`);
        assertEquals(held.rows.map((one) => one.figure), [400], `${kase}: on one person's row`);
        assertEquals(held.rows[0]?.combatantId, healed, `${kase}: whoever the health reached`);
        assertEquals(held.neither, null, `${kase}: healing never names neither end`);
        assertEquals(
            held.kinds.rows.map((one) => [one.element, one.figure]),
            [["bandage", 400]],
            `${kase}: and the key it moved under, which on this screen is what restored it`,
        );
    }
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
    assertExists(first, "somebody in this fight was healed");
    const drill = composeDrillReading(statistics, roster, "healthRestored", first.combatantId);
    assertExists(drill, "and their row opens");
    const names = drill.bySkill.rows.map((one) => getTextForNamedPart(one.part));
    assertEquals(names.length, new Set(names).size, "no name is drawn twice");
    assertArrayIncludes(names, ["Leczenie ran"], "the skill both healers announced is one row");
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
                assertExists(held, `${path}: a row under a name nothing announced`);
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
    assertExists(drill, "the combatant who swung has a row that opens");
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
    assertExists(outcome, "this fight states how it ended");
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
            assertExists(reading.outcome, `${path}: a seat this fight named reads no word`);
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
    assertExists(cut, "in this fight somebody was struck by nobody the game named");
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
    assertExists(apart, "the dealing side holds a figure no row above it does");
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
    assertExists(first, "there is a row to open");
    const drill = composeDrillReading(statistics, roster, "damageDealtApplied", first.combatantId);
    assertExists(drill, "and it opens");
    const other = drill.byOpponent.rows.find((one) => one.opensPair);
    assertExists(other, "onto somebody the level under says something about");

    const pair = composePairReading(
        statistics,
        roster,
        "damageDealtApplied",
        first.combatantId,
        other.combatantId,
    );
    assertExists(pair, "the pair opens");
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
    assertExists(drill, "the row opens");
    const held = drill.bySkill.rows.reduce((sum, one) => sum + one.figure, 0);
    assertEquals(held, drill.total, "the skills hold the whole of what this combatant dealt");
    assertEquals(drill.bySkill.plain, null, "so no row for a blow nothing announced is drawn");
    const figures = statistics.byCombatantId.get(combatantId);
    assertEquals(figures?.blowsWithoutSkill, 0, "which is the count that row would have stated");
    assert((figures?.blowsStruck ?? 0) > 0, "and the blows themselves were struck all the same");
});

/**
 * A level that repeats the figure over it still says which pair it was read for, and a row that
 * cannot be pressed says nothing at all. Both shapes stand in this recording, which is why the
 * count of each is kept: a sweep meeting only the many-part pairs would agree with a rule that
 * had never been lifted.
 */
Deno.test("every person row inside an opened row opens onto the pair under it", () => {
    const { roster, statistics } = readFight(BOTH_KINDS_OF_PAIR);
    const reading = composePanelReading(
        statistics,
        roster,
        "damageTakenApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    let repeats = 0;
    let says = 0;
    for (const row of reading.rows) {
        const drill = composeDrillReading(
            statistics,
            roster,
            "damageTakenApplied",
            row.combatantId,
        );
        assertExists(drill, "a row on this screen opens");
        for (const other of drill.byOpponent.rows) {
            const pair = composePairReading(
                statistics,
                roster,
                "damageTakenApplied",
                row.combatantId,
                other.combatantId,
            );
            assertExists(pair, "and every row of its cut names a pair");
            assert(other.opensPair, "which is what the row above it is marked with");
            assertEquals(pair.total, other.figure, "at the figure that was pressed");
            const named = pair.parts.filter((one) => one.part.kind === "skill");
            if (pair.byElement.rows.length > 1 || named.length > 0) says += 1;
            else repeats += 1;
        }
    }
    // Both shapes occur on this fight, so the rule is read on the one it was lifted for as well.
    assert(says > 0, "some pairs on this recording say more than the row above them");
    assert(repeats > 0, "and some repeat it, and open all the same");
});

/**
 * A level closes against the row that opened it, one rung deeper than the columns do.
 *
 * Health somebody put into themselves is health they gave, and it is inside the figure on the
 * skill row — so a level that left the caster out stated a smaller number than the row just
 * pressed and said nothing about the difference. Over `captures/` on 2026-08-30 that was 31 of the
 * 74 levels a reader could then reach, 143,888 points, the largest single drop 13,167.
 *
 * Asked of every kind of part and every screen: a skill, a key and a kind open onto the same shape
 * of level, and each is read off a different cut of the statistics.
 */
Deno.test("a part opened states the figure of the row that opened it, self-casts included", () => {
    const levels = new Map<string, number>();
    let withSelf = 0;
    for (const path of getRecordingPaths()) {
        const { roster, statistics } = readFight(path);
        for (const metric of SCREENS) {
            for (const combatantId of statistics.byCombatantId.keys()) {
                const drill = composeDrillReading(statistics, roster, metric, combatantId);
                if (drill === null) continue;
                const rows: { part: NamedPart; figure: number; opensPart: boolean }[] = [
                    ...drill.bySkill.rows,
                    ...drill.byElement.rows.map((one) => ({
                        part: { kind: "element" as const, element: one.element },
                        figure: one.figure,
                        opensPart: one.opensPart,
                    })),
                ];
                for (const row of rows) {
                    const held = composePartReading(
                        statistics,
                        roster,
                        metric,
                        combatantId,
                        row.part,
                    );
                    if (!row.opensPart) {
                        assertEquals(held, null, `${path}: a row marked shut opens nothing`);
                        continue;
                    }
                    assertExists(held, `${path}: a part marked as opening opens`);
                    const seen = `${metric} ${row.part.kind}`;
                    levels.set(seen, (levels.get(seen) ?? 0) + 1);
                    assertEquals(
                        held.total,
                        row.figure,
                        `${path}: ${metric} states the figure of the row it was opened from`,
                    );
                    const reached = held.byOpponent.rows.reduce((sum, one) => sum + one.figure, 0);
                    assertEquals(
                        reached + (held.byOpponent.unnamed?.figure ?? 0),
                        held.total,
                        `${path}: and the people under it come to the whole of it`,
                    );
                    const own = held.byOpponent.rows.find((one) => one.combatantId === combatantId);
                    if (own !== undefined) withSelf += 1;
                }
            }
        }
    }
    // Every kind of part on every screen that keeps a cut of it, so a walk that stopped reaching
    // one of them is a failure here rather than a smaller number nobody counted.
    assertEquals(
        [...levels.keys()].sort(),
        [
            "damageDealtApplied element",
            "damageDealtApplied skill",
            "damageTakenApplied element",
            "damageTakenApplied skill",
            "healthGiven skill",
            "healthGiven source",
            "healthRestored skill",
        ],
        "the corpus opens a level of every shape the statistics keep",
    );
    assert(withSelf > 0, "and some of them reached whoever the row was opened from");
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
                    // A key counts nothing, and opens onto whom it reached on the one screen that
                    // keeps a key per person — the giving side, where the pair names whose cause
                    // it is. The receiving side keeps the key flat, so there is nobody to list.
                    if (row.part.kind !== "source") continue;
                    assertEquals(row.uses, null, `${path}: a key counts nothing`);
                    assertEquals(
                        row.opensPart,
                        metric === "healthGiven",
                        `${path}: and opens where the screen keeps a cut of it`,
                    );
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
            assertExists(drill, "a row on a healing screen opens");
            for (const other of drill.byOpponent.rows) {
                const pair = composePairReading(
                    statistics,
                    roster,
                    metric,
                    row.combatantId,
                    other.combatantId,
                );
                assertExists(pair, "and every row of its cut names a pair");
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
    assertExists(given, "the healer's own screen states the pair");
    assertExists(received, "and so does the healed combatant's");
    assertEquals(given.total, received.total, "at one figure, whichever end asks");
    assertEquals(given.parts, received.parts, "made of the same parts, in the same order");
});

/**
 * The pair a healing row opens onto is where a reader learns **what** the health moved under, and
 * the commonest shape of it is one person healing themselves under one key — a level that repeats
 * the figure over it and names the one thing the row above does not.
 */
Deno.test("a healing pair opens whatever its level holds, one key included", () => {
    let repeats = 0;
    let opened = 0;
    let keys = 0;
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
                    assertExists(pair, "a row of the cut names a pair");
                    assert(other.opensPair, `${path}: and the row above it says so`);
                    opened += 1;
                    assertEquals(pair.total, other.figure, `${path}: at the figure pressed`);
                    if (pair.parts.length > 1) continue;
                    repeats += 1;
                    if (pair.parts[0]?.part.kind === "source") keys += 1;
                }
            }
        }
    }
    assert(opened > 0, "the corpus holds healing pairs to open");
    assert(repeats > 0, "some of them hold one row, at the figure that was pressed");
    assert(keys > 0, "and some of those name a key, which is the row this level was opened for");
});

/**
 * A shape the recordings do not carry, held by a fight built by hand.
 *
 * Measured over `captures/` on 2026-08-29: one announced heal restores anything at all, and it
 * restores it to the combatant who announced it. So an announcement reaching somebody **else** is
 * written out here rather than waiting for a recording of it.
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

Deno.test("a skill opens onto whom it reached, a self-cast onto whoever announced it", () => {
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
    assertExists(drill, "the healer's row opens");
    const row = drill.bySkill.rows.find((one) =>
        one.part.kind === "skill" && one.part.name === announced.skillName
    );
    assertExists(row, "onto the skill they announced");
    assertEquals(row.figure, 500, "at what it put back");
    assertEquals(row.uses, 1, "and how many times it was announced");
    assert(row.opensPart, "and it opens, because there is a level under it");

    const part = { kind: "skill" as const, name: announced.skillName };
    const skill = composePartReading(statistics, roster, "healthGiven", healer, part);
    assertExists(skill, "the skill opens");
    assertEquals(skill.total, 500, "at the figure the row that opened it stated");
    assertEquals(skill.byOpponent.rows.length, 1, "onto the one person it reached");
    assertEquals(skill.byOpponent.rows[0]?.combatantId, healed, "who is that person");
    assert(!(skill.byOpponent.rows[0]?.opensPair ?? true), "and nothing on this rung opens");

    // The same skill cast on nobody but the one who announced it: the level names them, which is
    // what a reader asking what somebody healed themselves with came to find out.
    const alone = composeFightStatistics([composeAnnouncedHeal(announced, healer)], new Map());
    const own = composeDrillReading(alone, roster, "healthGiven", healer);
    assertExists(own, "a self-cast still opens the healer's own row");
    assert(own.bySkill.rows[0]?.opensPart ?? false, "and the skill on it opens too");
    const cast = composePartReading(alone, roster, "healthGiven", healer, part);
    assertExists(cast, "which is what asking for that level answers");
    assertEquals(cast.total, 500, "at the whole of what the announcement put back");
    assertEquals(cast.byOpponent.rows.length, 1, "onto the one person it reached");
    assertEquals(cast.byOpponent.rows[0]?.combatantId, healer, "who is the one who announced it");
});

/**
 * Another shape the recordings do not carry: over `captures/` on 2026-08-31 no kind of damage
 * taken is both dealt by somebody named and ticked with nobody named — the 58 kind rows that open
 * onto nothing are bare movements and nothing else. So the level closing against the row rather
 * than against its own rows is written out here.
 */
Deno.test("a kind opened states the whole of the row, nobody's share included", () => {
    const { roster } = readFight(HILDUR);
    const [striker, struck] = [...roster.byId.keys()];
    assert(striker !== undefined && struck !== undefined, "the fight holds two people");
    const statistics = composeFightStatistics([
        {
            kind: "attack",
            actorId: striker,
            targetId: struck,
            actorHealthPercent: null,
            targetHealthPercent: null,
            raw: [{ element: "poison", amount: 300 }],
            applied: [{ element: "poison", amount: 300 }],
            prevented: [],
            destroyed: [],
            procs: [],
            declared: [],
            announced: null,
        },
        {
            kind: "health-change",
            combatantId: struck,
            amount: -200,
            healthPercent: null,
            source: "poison",
            declared: [],
            announced: null,
        },
    ], new Map());

    const drill = composeDrillReading(statistics, roster, "damageTakenApplied", struck);
    assertExists(drill, "the struck combatant's row opens");
    const kind = drill.byElement.rows.find((one) => one.element === "poison");
    assertExists(kind, "onto the kind both movements were made of");
    assertEquals(kind.figure, 500, "at the two of them together");
    assert(kind.opensPart, "and it opens, because one of them named who dealt it");

    const part = composePartReading(statistics, roster, "damageTakenApplied", struck, {
        kind: "element",
        element: "poison",
    });
    assertExists(part, "the kind opens");
    assertEquals(part.total, 500, "at the figure the row that opened it stated");
    assertEquals(part.byOpponent.rows.length, 1, "onto the one striker the protocol named");
    assertEquals(part.byOpponent.rows[0]?.figure, 300, "at what they dealt");
    assertEquals(
        part.byOpponent.unnamed?.figure,
        200,
        "and the tick nobody was named for stands beside them, so the column comes to a hundred",
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
 * The same two doubts, charged to the row they are about. A cast is the one that turns on the
 * screen: it puts back health, so beside a damage figure it would qualify a figure that cannot
 * carry it — which is the rule the fight's own warnings follow one level up.
 */
Deno.test("a doubt about one person qualifies the screens their figure is on", () => {
    const { roster } = readFight(HILDUR);
    const events = decodeFightMessages([
        "1=50.00;1=50.00;tspell=Fala leczenia;skillId=199;healall_per=30",
    ], roster);
    const statistics = composeFightStatistics(events, new Map());
    const reading = composePanelReading(
        statistics,
        roster,
        "healthGiven",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    const caster = reading.rows.find((row) => row.combatantId === 1);
    assertExists(caster, "the caster is on the list");
    assertEquals(caster.detail.castsUnplaced, 1, "carrying the cast nobody could place");

    assert(getRowHasDoubt(caster.detail, "healthGiven"), "which marks their row where it counts");
    assert(getRowHasDoubt(caster.detail, "healthRestored"), "on either healing screen");
    assert(!getRowHasDoubt(caster.detail, "damageDealtApplied"), "and on neither damage one");
    assert(!getRowHasDoubt(caster.detail, "damageTakenApplied"), "where it qualifies no figure");

    const said = composeRowWarnings(caster.detail, "healthGiven");
    assertEquals(said.length, 1, "and the mark opens onto one sentence");
    assert(said[0]?.includes("jej leczenia"), "saying whose leczenie is short, not the fight's");
    assertEquals(composeRowWarnings(caster.detail, "damageDealtApplied"), [], "and nothing else");
});

Deno.test("a message that went unread marks the rows it named, on every screen", () => {
    const { roster } = readFight(HILDUR);
    const events = decodeFightMessages(["1=100.00;2=100.00;whatever_per=30"], roster);
    const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
    for (const metric of SCREENS) {
        const reading = composePanelReading(
            statistics,
            roster,
            metric,
            "everyone",
            null,
            NOTHING_MISSED,
        );
        const named = reading.rows.filter((row) => getRowHasDoubt(row.detail, metric));
        assertEquals(named.length, 2, `${metric}: the two ends the message named, and nobody else`);
        const first = named[0];
        assertExists(first, `${metric}: one of them is a row the panel draws`);
        const said = composeRowWarnings(first.detail, metric);
        assert(said[0]?.includes("z jej udziałem"), `${metric}: the sentence says whose it is`);
    }
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

/**
 * The card is handed the turn count and not another counter beside it. Nothing else in the tree
 * catches this: the card's own test is handed a `RowDetail` written by hand, so a reading that
 * copied `blowsStruck` under the turn's name drew a wrong number everywhere and stayed green —
 * **W4**, and this is the test that answer asks for.
 */
Deno.test("a row's card states the turns the figures hold, and not a count beside them", () => {
    const { roster, statistics } = readFight(HILDUR);
    const reading = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    let differed = 0;
    for (const row of reading.rows) {
        const figures = statistics.byCombatantId.get(row.combatantId);
        if (figures === undefined) continue;
        assertEquals(
            row.detail.turnsTaken,
            figures.turnsTaken,
            `${row.combatantId}: the card states the turns the aggregate counted`,
        );
        if (figures.turnsTaken !== figures.blowsStruck) differed += 1;
    }
    assert(differed > 0, "and the fight tells the two counts apart, so the check is a check");
});
