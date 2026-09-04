/**
 * What a skill put on a side, as the strip beside the panel reads it.
 *
 * The figures come off a real recording through every layer under the strip, because the join
 * this stands on — a cast to the published table — is the part a hand-written fixture would fake.
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
import { composeAuraReading } from "@/src/ui/panel-aura.ts";
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
    const reading = composeAuraReading(statistics, roster, readerSide);
    const group = reading.groups.find((one) => one.skillName === "Piętno bestii");
    assert(group !== undefined, "the skill has a heading of its own");
    assertEquals(group.rows.length, marks.length, "and a row for each cast still running");
    assertEquals(
        new Set(group.rows.map((row) => row.casterName)).size,
        group.rows.length,
        "one row per caster, never one caster twice",
    );
});

Deno.test("a row says whose cast it is and how far through it is", () => {
    const { statistics, roster, readerSide } = readFight(TWO_MARKS, Number.MAX_SAFE_INTEGER);
    const reading = composeAuraReading(statistics, roster, readerSide);
    assert(reading.rows > 0, "something is running, or this test checks nothing");
    for (const group of reading.groups) {
        assert(group.skillName.length > 0, "a group is named after the skill the game named");
        for (const row of group.rows) {
            assert(row.turnsStated > 0, "a cast runs for a stated number of turns");
            assert(row.turnsElapsed >= 0, "and has run no fewer than none of them");
            assert(row.turnsElapsed <= row.turnsStated, "and never past what the table states");
            assert(row.casterName !== "", "and stands under whoever the game named");
        }
    }
});

/** Zero is a boundary: a fight nobody has cast anything into draws no strip at all. */
Deno.test("a fight with nothing running reads as no strip rather than an empty one", () => {
    const roster = composeCombatantRoster([]);
    const quiet = composeFightStatistics([], new Map(), [], AURA_TURNS);
    const reading = composeAuraReading(quiet, roster, null);
    assertEquals(reading.rows, 0, "nobody cast anything, so nothing is running");
    assertEquals(reading.groups, [], "and there is no heading either");
});

/** One is the boundary beside it: a cast this very turn has run one of its turns, not none. */
Deno.test("a cast is drawn from the turn it was made on, and never before it", () => {
    const { statistics, roster, readerSide } = readFight(TWO_MARKS, 6);
    const reading = composeAuraReading(statistics, roster, readerSide);
    const elapsed = reading.groups.flatMap((group) => group.rows).map((row) => row.turnsElapsed);
    assert(elapsed.length > 0, "something has been cast by now");
    assert(elapsed.every((turns) => turns >= 1), "and each of them has run at least its own turn");
});

Deno.test("a side is read off the roster, and is nobody's where the game never said", () => {
    const { statistics, roster } = readFight(TWO_MARKS, Number.MAX_SAFE_INTEGER);
    const said = composeAuraReading(statistics, roster, 1);
    const unsaid = composeAuraReading(statistics, roster, null);
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
