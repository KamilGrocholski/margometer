/**
 * What one skill put on more than one combatant, and for how long it has stood.
 *
 * The corpus test is what states this over every recording; the samples below are the two edges
 * a reading over a whole fight cannot show — a cast that has just landed, and one that has run
 * out. **W5**: zero turns elapsed is a boundary and has one turn beside it.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
    composeAuraTurnsBySkillId,
    composeFightStandings,
    composeShoutsBySkillId,
    getReachFromEffects,
    getStatedTurnsFromEffects,
    isTeamWideKey,
    type StatedSkills,
} from "@/src/core/aura-standing.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { type Combatant, composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { FROZEN_AURA_TURNS } from "@/frozen/aura-turns.ts";
import {
    getRecordedCombatants,
    getRecordedPayloads,
    readRecordingPaths,
} from "@/tests/recorded-fight.ts";

const DATED: StatedSkills = {
    turnsBySkillId: composeAuraTurnsBySkillId(FROZEN_AURA_TURNS.skills),
    shoutsBySkillId: composeShoutsBySkillId(FROZEN_AURA_TURNS.shouts),
};

const OURS = 1;
const THEIRS = 2;

/** As many on each side as a sample asks for, so the count has a side to be read against. */
function composeRoster(ours: number, theirs: number) {
    const combatants: Combatant[] = [];
    for (let at = 0; at < ours; at += 1) {
        combatants.push(composeCombatant(1 + at, OURS));
    }
    for (let at = 0; at < theirs; at += 1) {
        combatants.push(composeCombatant(9 - at, THEIRS));
    }
    return composeCombatantRoster(combatants);
}

function composeCombatant(id: number, side: number): Combatant {
    return { id, name: `Ktoś ${id}`, side, profession: "w", level: 40, healthMaximum: 100 };
}

/** Two on the reader's side and one against, which is every recording in `captures/`. */
const ROSTER = composeRoster(2, 1);

/** What a sample dates, as the two frozen readings would. */
function composeStated(
    skills: readonly { id: number; turns: number }[],
    shouts: readonly { id: number; turns: number; coverageMinimum: number }[] = [],
): StatedSkills {
    return {
        turnsBySkillId: composeAuraTurnsBySkillId(skills),
        shoutsBySkillId: composeShoutsBySkillId(shouts),
    };
}

/**
 * `shouted` is the value a shout carries — the characters it named, as the game writes them: a
 * comma and a space between each. It rides the `shout` effect's text and nowhere else.
 */
function composeCast(
    actorId: number,
    skillId: number,
    effect: string,
    targetId: number | null = null,
    shouted: string | null = null,
): BattleEvent {
    return {
        kind: "skill-used",
        actorId,
        targetId,
        actorHealthPercent: 100,
        targetHealthPercent: null,
        skillName: "Cast",
        skillId,
        declared: effect.split(" ").map((one) => ({
            effect: one,
            amount: 8,
            text: one === "shout" ? shouted : null,
        })),
    };
}

/** A blow standing behind no announcement, which is what opens the caster's next turn. */
function composeBlow(actorId: number): BattleEvent {
    return {
        kind: "attack",
        actorId,
        targetId: 2,
        actorHealthPercent: 100,
        targetHealthPercent: 90,
        raw: [{ element: "physical", amount: 10 }],
        applied: [{ element: "physical", amount: 10 }],
        prevented: [],
        destroyed: [],
        procs: [],
        declared: [],
        announced: null,
    };
}

Deno.test("a key reaches a side by its opening, its ending, or by being one of the three", () => {
    assert(isTeamWideKey("aura-sa_per"), "the opening the table and the wire share");
    assert(isTeamWideKey("taken_dmg_per-all"), "the table's spelling of what the wire calls -all");
    assert(isTeamWideKey("+spell-taken_dmg-all"), "and the wire's own");
    assert(isTeamWideKey("lowheal_per-enemies"), "an ending reaching the other side");
    assert(isTeamWideKey("shout"), "and a name carrying neither shape");
    assert(!isTeamWideKey("cooldown"), "a skill's own cooldown reaches nobody");
    assert(!isTeamWideKey("healall_per"), "and healing is health rather than something standing");
});

Deno.test("a skill stating several durations is over when the longest of them is", () => {
    // `Wyzywający okrzyk` runs one effect for three turns and two for five. The shortest would
    // call the skill over while part of it is still standing.
    const stated = getStatedTurnsFromEffects([
        { key: "shout", turns: [3, 3] },
        { key: "alllowdmg", turns: [5, 5] },
        { key: "red-sa", turns: [] },
    ]);
    assertStrictEquals(stated, 5, "the longest of the two that reach a side");
    assertStrictEquals(
        getStatedTurnsFromEffects([{ key: "cooldown", turns: [6] }]),
        null,
        "and nothing where no effect reaches one",
    );
});

Deno.test("a cast stands from its own turn, and leaves when its turns have passed", () => {
    const dated = composeStated([{ id: 264, turns: 2 }]);
    const cast = composeCast(1, 264, "+spell-taken_dmg-all");
    assertEquals(
        composeFightStandings([cast], dated, ROSTER).standings.map((one) => one.turnsElapsed),
        [0],
        "nothing has passed on the turn it was cast",
    );
    assertEquals(
        composeFightStandings([cast, composeBlow(1)], dated, ROSTER).standings.map((one) =>
            one.turnsElapsed
        ),
        [1],
        "and one turn of the caster's later, one has",
    );
    assertEquals(
        composeFightStandings([cast, composeBlow(1), composeBlow(1)], dated, ROSTER).standings,
        [],
        "at the turns it was given it is no longer standing",
    );
});

Deno.test("another's turn moves nothing, and a second cast refreshes rather than adds", () => {
    const dated = composeStated([{ id: 264, turns: 8 }]);
    const cast = composeCast(1, 264, "+spell-taken_dmg-all");
    assertEquals(
        composeFightStandings([cast, composeBlow(2), composeBlow(2)], dated, ROSTER).standings
            .map((one) => one.turnsElapsed),
        [0],
        "the length is counted in the caster's own turns and nobody else's",
    );
    const refreshed = composeFightStandings([cast, composeBlow(1), cast], dated, ROSTER).standings;
    assertStrictEquals(refreshed.length, 1, "a second cast by the same caster is one row");
    assertStrictEquals(refreshed[0]?.turnsElapsed, 0, "and it starts again");
});

Deno.test("a cast the table dates no duration for reaches no row", () => {
    const cast = composeCast(1, 999, "aura-sa_per");
    assertEquals(
        composeFightStandings([cast], DATED, ROSTER).standings,
        [],
        "an id the frozen table does not name",
    );
    assertEquals(
        composeFightStandings([composeCast(1, 264, "+dmg")], DATED, ROSTER).standings,
        [],
        "and a skill whose effects reach one combatant",
    );
});

Deno.test("every recording answers, and nothing stands longer than the table gives it", () => {
    let stood = 0;
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const events: BattleEvent[] = [];
        for (const messages of getRecordedPayloads(path)) {
            events.push(...decodeFightMessages(messages, roster));
        }
        for (const one of composeFightStandings(events, DATED, ROSTER).standings) {
            stood += 1;
            assert(one.turnsElapsed >= 0, `${path}: a length is never below nothing`);
            assert(one.turnsElapsed < one.turnsStated, `${path}: and never past what was stated`);
            assert(one.skillName.length > 0, `${path}: a standing names the skill the game named`);
            assert(
                DATED.turnsBySkillId.has(one.skillId),
                `${path}: and one the published table dates`,
            );
        }
    }
    assert(stood > 0, "the corpus leaves something standing at the end of a fight");
});

Deno.test("which side a cast reaches is the register's word, and never a guess", () => {
    // `docs/protocol-keys.md` records each of these against the published help.
    assertStrictEquals(
        getReachFromEffects([{ effect: "+spell-taken_dmg-all" }]),
        "other-side",
        "an effect the help gives as applying to all opponents",
    );
    assertStrictEquals(
        getReachFromEffects([{ effect: "aura-ac_per" }]),
        "casters-side",
        "and an aura raising a statistic of the caster's own team",
    );
    assertStrictEquals(
        getReachFromEffects([{ effect: "+dmg" }]),
        null,
        "a key nothing settles reaches nothing stated, rather than a side picked for it",
    );
});

Deno.test("a skill whose keys disagree reaches both sides, which is not a failed reading", () => {
    // `Wyzywający okrzyk` points its own side at somebody and lowers the opposing team's damage in
    // the same announcement. Calling that unknown would hide one of the two.
    assertStrictEquals(
        getReachFromEffects([{ effect: "shout" }, { effect: "alllowdmg" }]),
        "both-sides",
        "both halves are stated, so both are said",
    );
});

/** Both skills as the published table states them: three turns, and six characters covered. */
const SHOUTS = [
    { id: 25, turns: 3, coverageMinimum: 6 },
    { id: 188, turns: 3, coverageMinimum: 6 },
];

Deno.test("a shout holds every character its value names, and nobody else", () => {
    const dated = composeStated([{ id: 188, turns: 5 }], SHOUTS);
    const held = composeFightStandings(
        [composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9, Ktoś 8")],
        dated,
        composeRoster(2, 3),
    ).provocations;
    assertEquals(
        held.map((one) => one.provokedId).sort((left, right) => left - right),
        [8, 9],
        "the two the announcement listed, and never the third of that side",
    );
    assert(held.every((one) => one.casterId === 1), "all held by whoever shouted");
});

Deno.test("a value naming one holds one, which is every recording before this round", () => {
    const dated = composeStated([{ id: 188, turns: 5 }], SHOUTS);
    const held = composeFightStandings(
        [composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9")],
        dated,
        composeRoster(10, 1),
    ).provocations;
    assertEquals(held.map((one) => one.provokedId), [9], "the one it named");
});

/**
 * **W5 at the edge of the reading.** A name the roster cannot place is dropped rather than guessed
 * at, and a value naming nobody at all holds nobody — `getCombatantIdByName` answers null for a
 * name it does not know and for one two combatants answer to.
 */
Deno.test("a name the roster cannot place is dropped, and the rest of the list still holds", () => {
    const dated = composeStated([{ id: 188, turns: 5 }], SHOUTS);
    const roster = composeRoster(2, 3);
    const partly = composeFightStandings(
        [composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9, Nikt Taki")],
        dated,
        roster,
    ).provocations;
    assertEquals(partly.map((one) => one.provokedId), [9], "the name that resolves, and no other");

    const none = composeFightStandings(
        [composeCast(1, 188, "shout alllowdmg", 9, "Nikt Taki")],
        dated,
        roster,
    ).provocations;
    assertEquals(none, [], "and a value naming nobody the roster holds holds nobody");
});

Deno.test("a shout carrying no value at all holds nobody, rather than the target slot", () => {
    const dated = composeStated([{ id: 188, turns: 5 }], SHOUTS);
    const held = composeFightStandings(
        [composeCast(1, 188, "shout alllowdmg", 9, null)],
        dated,
        composeRoster(2, 3),
    ).provocations;
    assertEquals(held, [], "the value is the reading, and the target slot is not a stand-in");
});

Deno.test("a shout is dated by its own row, and never by the skill's longest effect", () => {
    // `Wyzywający okrzyk` runs `alllowdmg` for five turns and `shout` for three. Dated as an aura
    // it held a character two turns after the game had let them go.
    const dated = composeStated([{ id: 188, turns: 5 }], SHOUTS);
    const held = composeFightStandings(
        [composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9")],
        dated,
        ROSTER,
    ).provocations;
    assertStrictEquals(held[0]?.turnsStated, 3, "the shout's own turns");
});

Deno.test("a shout the table dates nowhere holds nobody, rather than standing on a side", () => {
    const dated = composeStated([{ id: 188, turns: 5 }], []);
    const events = [composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9")];
    assertEquals(
        composeFightStandings(events, dated, ROSTER).provocations,
        [],
        "an id the frozen shouts do not name",
    );
    assertEquals(
        composeFightStandings(events, dated, ROSTER).standings,
        [],
        "and it does not fall back to standing on a side either",
    );
});

/**
 * `captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json`: a Wojownik and a Paladyn shout
 * at one monster, interleaved — the only shape in the corpus where the overwrite is observable.
 */
const BOTH_OKRZYKI = "2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0";

/** The first fight between players in the corpus, and the first shout naming more than one. */
const AGAINST_TWO = "2026-09-09-tempest-duet-vs-wojownik-ne0iTNdg-0.14.0";

Deno.test("one shout holds a character, and the last of them is the one that does", () => {
    const dated = composeStated([{ id: 25, turns: 3 }, { id: 188, turns: 5 }], SHOUTS);
    const wojownik = composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9");
    const paladyn = composeCast(2, 25, "shout aura-adddmg2_per-meele", 9, "Ktoś 9");
    const held =
        composeFightStandings([wojownik, composeBlow(1), paladyn], dated, ROSTER).provocations;
    assertStrictEquals(held.length, 1, "two casters at one character is one provocation");
    assertStrictEquals(held[0]?.casterId, 2, "and the later shout is the one holding them");
    assertStrictEquals(held[0]?.skillId, 25, "whichever of the two skills it was");
    assertStrictEquals(held[0]?.turnsElapsed, 0, "counted from the turn it took over on");
});

Deno.test("a later shout takes over each character it names, and leaves the rest standing", () => {
    const dated = composeStated([{ id: 25, turns: 3 }, { id: 188, turns: 5 }], SHOUTS);
    const held = composeFightStandings(
        [
            composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9, Ktoś 8"),
            composeBlow(1),
            composeCast(2, 25, "shout aura-adddmg2_per-meele", 8, "Ktoś 8"),
        ],
        dated,
        composeRoster(2, 3),
    ).provocations;
    assertEquals(
        held.map((one) => [one.provokedId, one.casterId]).sort((a, b) => (a[0] ?? 0) - (b[0] ?? 0)),
        [[8, 2], [9, 1]],
        "the later shout took the one it named, and the other is still held by the first",
    );
});

Deno.test("a shout reaches the provocation and nothing else, so no cast is counted twice", () => {
    const dated = composeStated([{ id: 188, turns: 5 }, { id: 264, turns: 8 }], SHOUTS);
    const events = [
        composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9"),
        composeCast(1, 264, "+spell-taken_dmg-all"),
    ];
    assertEquals(
        composeFightStandings(events, dated, ROSTER).standings.map((one) => one.skillId),
        [264],
        "the okrzyk stands under the provocation rather than beside the whole-team casts",
    );
    assertStrictEquals(
        composeFightStandings(events, dated, ROSTER).provocations.length,
        1,
        "and there once",
    );
});

Deno.test("a target slot nobody shouted at holds nobody", () => {
    const dated = composeStated([{ id: 188, turns: 5 }, { id: 264, turns: 8 }], SHOUTS);
    // Every cast reaching a side names one end that is not the bearer: reading it would credit
    // the wrong combatant, which is what ADR 0010 measured and refused.
    const aimed = composeFightStandings(
        [composeCast(1, 264, "+spell-taken_dmg-all", 9)],
        dated,
        composeRoster(2, 3),
    ).provocations;
    assertEquals(aimed, [], "and no whole-team cast becomes a provocation by having a target");
});

Deno.test(`${AGAINST_TWO}: one shout holds both players it named`, () => {
    const path = `captures/${AGAINST_TWO}.json`;
    const roster = composeCombatantRoster(getRecordedCombatants(path));
    const events: BattleEvent[] = [];
    for (const messages of getRecordedPayloads(path)) {
        events.push(...decodeFightMessages(messages, roster));
    }
    const held = composeFightStandings(events, DATED, roster).provocations;
    assertStrictEquals(held.length, 2, "the value named two characters, so two are held");
    assertEquals(
        held.map((one) => roster.byId.get(one.provokedId)?.name).sort(),
        ["Gracz 2", "Gracz 3"],
        "both of the opposing side, by the names the announcement carried",
    );
    assert(
        held.every((one) => one.turnsStated === 3),
        "each dated by the shout's own row rather than the skill's longest",
    );
});

Deno.test(`${BOTH_OKRZYKI}: two casters at one monster leave one provocation standing`, () => {
    const path = `captures/${BOTH_OKRZYKI}.json`;
    const roster = composeCombatantRoster(getRecordedCombatants(path));
    const events: BattleEvent[] = [];
    for (const messages of getRecordedPayloads(path)) {
        events.push(...decodeFightMessages(messages, roster));
    }
    const held = composeFightStandings(events, DATED, roster).provocations;
    assertStrictEquals(held.length, 1, "a Wojownik and a Paladyn shouting at one monster is one");
    assertStrictEquals(
        roster.byId.get(held[0]?.provokedId ?? 0)?.name,
        "Amaimon Soploręki",
        "and the monster is who is held",
    );
    assert(
        composeFightStandings(events, DATED, roster).standings.every((one) => one.skillId !== 25),
        "with neither okrzyk standing a second time among the whole-team casts",
    );
});
