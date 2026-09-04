/**
 * What stands in a fight, as the window beside the panel reads it.
 *
 * The figures come off a real recording through every layer under the window, because the joins
 * this stands on — a cast to the published table, a charge to its own combatant — are the parts a
 * hand-written fixture would fake.
 */

import { assert, assertEquals } from "@std/assert";
import { composeAuraTurnsBySkillId } from "@/src/core/aura-standing.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import {
    addPayloadToSession,
    composeBattleSession,
    getFightFromSession,
} from "@/src/game/battle-session.ts";
import { composeStandingReading, SUBJECT } from "@/src/ui/panel-standing.ts";
import { FROZEN_AURA_TURNS } from "@/frozen/aura-turns.ts";
import { getRecordedEngineUpdates } from "@/tests/recorded-fight.ts";

/** Two casters put `Piętno bestii` up one message apart here, three times over. */
const TWO_MARKS = "captures/2026-08-26-luvia-grupa-vs-draugr-53XkBRxF-0.8.1.json";
const AURA_TURNS = composeAuraTurnsBySkillId(FROZEN_AURA_TURNS.skills);

function readFight(path: string, upTo: number) {
    const session = composeBattleSession();
    for (const payload of getRecordedEngineUpdates(path).slice(0, upTo)) {
        addPayloadToSession(session, payload);
    }
    const fight = getFightFromSession(session);
    assert(fight !== null, "a recording of a fight reads as one");
    const roster = composeCombatantRoster([...fight.roster.byId.values()]);
    const statistics = composeFightStatistics(
        fight.events,
        composeTeamHeals(fight.events, roster),
        fight.statusEpisodes,
        AURA_TURNS,
    );
    return { statistics, roster, readerSide: fight.readerSide };
}

Deno.test("two casters of one skill are two rows under one heading", () => {
    // The whole recording: what is left running at the end is what the strip would be drawing.
    const { statistics, roster, readerSide } = readFight(TWO_MARKS, Number.MAX_SAFE_INTEGER);
    const marks = statistics.auraStandings.filter((one) => one.skillName === "Piętno bestii");
    assert(marks.length > 0, "the recording leaves a mark standing, or this test checks nothing");
    const reading = composeStandingReading(statistics, roster, readerSide);
    const group = reading.groups.find((one) => one.title === "Piętno bestii");
    assert(group !== undefined, "the skill has a heading of its own");
    assertEquals(group.rows.length, marks.length, "and a row for each cast still running");
    assertEquals(
        new Set(group.rows.map((row) => row.name)).size,
        group.rows.length,
        "one row per caster, never one caster twice",
    );
});

Deno.test("a row says whose cast it is and how far through it is", () => {
    const { statistics, roster, readerSide } = readFight(TWO_MARKS, Number.MAX_SAFE_INTEGER);
    const reading = composeStandingReading(statistics, roster, readerSide);
    assert(reading.rows > 0, "something is running, or this test checks nothing");
    for (const group of reading.groups) {
        assert(group.title.length > 0, "a group is named after what it is a group of");
        for (const row of group.rows) {
            if (row.figure.kind !== "elapsed") continue;
            assert(row.figure.turnsStated > 0, "a cast runs for a stated number of turns");
            assert(row.figure.turnsElapsed >= 0, "and has run no fewer than none of them");
            assert(
                row.figure.turnsElapsed <= row.figure.turnsStated,
                "and never past what the table states",
            );
            assert(row.name !== "", "and stands under whoever the game named");
        }
    }
});

/**
 * Zero is a boundary, and the window's answer to it changed: it stands and says nothing is
 * standing rather than going away — **ADR 0054**. What the reading owes is an empty list of
 * groups; the line saying so is the element's.
 */
Deno.test("a fight with nothing standing reads as no groups, and still as a reading", () => {
    const roster = composeCombatantRoster([]);
    const quiet = composeFightStatistics([], new Map(), [], AURA_TURNS);
    const reading = composeStandingReading(quiet, roster, null);
    assertEquals(reading.rows, 0, "nobody cast anything, so nothing is standing");
    assertEquals(reading.groups, [], "and there is no heading either");
    assert(reading.subjects.length > 0, "but the watchlist still offers what could be watched");
});

/** One is the boundary beside it: a cast this very turn has run one of its turns, not none. */
Deno.test("a cast is drawn from the turn it was made on, and never before it", () => {
    const { statistics, roster, readerSide } = readFight(TWO_MARKS, 6);
    const reading = composeStandingReading(statistics, roster, readerSide);
    const elapsed = reading.groups.flatMap((group) => group.rows)
        .flatMap((row) => row.figure.kind === "elapsed" ? [row.figure.turnsElapsed] : []);
    assert(elapsed.length > 0, "something has been cast by now");
    assert(elapsed.every((turns) => turns >= 1), "and each of them has run at least its own turn");
});

Deno.test("a side is read off the roster, and is nobody's where the game never said", () => {
    const { statistics, roster } = readFight(TWO_MARKS, Number.MAX_SAFE_INTEGER);
    const said = composeStandingReading(statistics, roster, 1);
    const unsaid = composeStandingReading(statistics, roster, null);
    assert(said.rows > 0, "there is a cast to ask about");
    assert(
        said.groups.some((group) => group.rows.some((row) => row.isReaderSide !== null)),
        "a reader whose side the game stated sees which casts are theirs",
    );
    assertEquals(
        unsaid.groups.flatMap((group) => group.rows).filter((row) => row.isReaderSide !== null),
        [],
        "and a reader whose side it never stated earns neither hue",
    );
});

/** The colossus fight: the other side charges four skills in a cycle, and the game states each. */
const CHARGING = "captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json";

Deno.test("a charge reaches the window as the game's own figure, and never as turns", () => {
    const { statistics, roster, readerSide } = readFight(CHARGING, Number.MAX_SAFE_INTEGER);
    assert(
        statistics.chargeStandings.length > 0,
        "the recording ends mid-charge, or this checks nothing",
    );
    const reading = composeStandingReading(statistics, roster, readerSide);
    const group = reading.groups.find((one) => one.subject === SUBJECT.charge);
    assert(group !== undefined, "what the other side is making ready has a heading of its own");
    for (const row of group.rows) {
        assert(
            row.figure.kind === "percent",
            "and a charge is drawn as the percent the game states",
        );
        assert(row.figure.percent >= 0, "which is not below nothing");
        assert(row.figure.percent <= 100, "and not past the whole of it");
        assert(row.name !== null, "and the row is named after the skill the game named");
    }
});

/**
 * Both sides of the rule measured on `captures/` 2026-09-04: a blow spends a full charge and
 * leaves a partial one standing, because the game strikes while it charges.
 */
Deno.test("a blow spends a full charge and leaves a partial one alone", () => {
    const bearer = -10003615;
    const charge = (percent: number) => ({
        kind: "declaration" as const,
        combatantId: bearer,
        healthPercent: null,
        declared: [{ effect: "prepare", amount: null, text: `Chapnięcie(${percent}%)` }],
    });
    const blow = {
        kind: "skill-used" as const,
        actorId: bearer,
        targetId: null,
        actorHealthPercent: null,
        targetHealthPercent: null,
        skillId: null,
        skillName: "Chapnięcie",
        declared: [],
    };
    const full = composeFightStatistics([charge(100), blow], new Map(), [], AURA_TURNS);
    assertEquals(
        full.chargeStandings,
        [],
        "a charge the game called full is spent by the next blow",
    );
    const partial = composeFightStatistics([charge(50), blow], new Map(), [], AURA_TURNS);
    assertEquals(partial.chargeStandings.length, 1, "and a partial one is still being made ready");
    assertEquals(partial.chargeStandings[0]?.percent, 50, "at the figure the game last stated");
});

Deno.test("a subject turned off takes its rows away and still says how many stand", () => {
    const { statistics, roster, readerSide } = readFight(CHARGING, Number.MAX_SAFE_INTEGER);
    const watched = composeStandingReading(statistics, roster, readerSide);
    const charging = watched.groups.find((one) => one.subject === SUBJECT.charge);
    assert(charging !== undefined, "there is a charge to turn off, or this test checks nothing");
    const hidden = composeStandingReading(statistics, roster, readerSide, {
        [SUBJECT.charge]: false,
    });
    assertEquals(
        hidden.groups.filter((one) => one.subject === SUBJECT.charge),
        [],
        "a subject nobody is watching draws no group",
    );
    assertEquals(hidden.rows, watched.rows - charging.rows.length, "and its rows go with it");
    const listed = hidden.subjects.find((one) => one.key === SUBJECT.charge);
    assert(listed !== undefined, "but it stays on the watchlist");
    assert(!listed.isWatched, "marked as the reader left it");
    assertEquals(
        listed.standing,
        charging.rows.length,
        "and saying how much of it stands, so a quiet fight and a hidden one are not one picture",
    );
});

/** Statuses are the one subject that starts off, so the default reading must leave them out. */
Deno.test("statuses are offered and unwatched until a reader says otherwise", () => {
    const { statistics, roster, readerSide } = readFight(CHARGING, Number.MAX_SAFE_INTEGER);
    const standing = statistics.statusRuns.filter((run) => run.isStanding);
    assert(standing.length > 0, "the recording leaves a status standing, or this checks nothing");
    const reading = composeStandingReading(statistics, roster, readerSide);
    assertEquals(
        reading.groups.filter((one) => one.subject === SUBJECT.status),
        [],
        "nothing from the mask is drawn before a reader asks for it",
    );
    const asked = composeStandingReading(statistics, roster, readerSide, {
        [SUBJECT.status]: true,
    });
    assert(
        asked.groups.some((one) => one.subject === SUBJECT.status),
        "and it is there the moment they do",
    );
});
