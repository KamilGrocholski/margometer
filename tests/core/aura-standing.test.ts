/**
 * What one skill put on more than one combatant, and for how long it has stood.
 *
 * The corpus test is what states this over every recording; the samples below are the two edges
 * a reading over a whole fight cannot show — a cast that has just landed, and one that has run
 * out. **W5**: zero turns elapsed is a boundary and has one turn beside it.
 */

import {
    assert,
    assertEquals,
    AssertionError,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import type { BattleEvent } from "#/src/core/battle-event.ts";
import {
    type FightStandings,
    indexAuraTurnsBySkillId,
    indexShoutsBySkillId,
    lookupReachOfEffects,
    replayFightStandings,
    type StatedSkills,
} from "#/src/core/aura-standing.ts";
import {
    type Combatant,
    type CombatantRoster,
    indexCombatantRoster,
} from "#/src/core/combatant-roster.ts";
import type { FightView } from "#/src/core/fight-session.ts";
import * as protocolKeys from "#/src/core/protocol-key.ts";
import { isTeamWideKey, PROVOCATION_KEY } from "#/src/core/protocol-key.ts";
import { STATED_SKILLS } from "#/tests/frozen-tables.ts";
import {
    decodeRecordedFight,
    lookupRecordedFight,
    readRecordedFights,
} from "#/tests/recorded-fights.ts";

const DATED: StatedSkills = STATED_SKILLS;

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
    return indexCombatantRoster(combatants);
}

function composeCombatant(id: number, side: number): Combatant {
    return { id, name: `Ktoś ${id}`, side, profession: "w", level: 40, healthMaximum: 100 };
}

/** Two on the reader's side and one against, which is every recording in `develop:captures/`. */
const ROSTER = composeRoster(2, 1);

/** What a sample dates, as the two frozen readings would. */
function composeStated(
    skills: readonly { id: number; turns: number }[],
    shouts: readonly { id: number; turns: number; coverageMinimum: number }[] = [],
): StatedSkills {
    return {
        turnsBySkillId: indexAuraTurnsBySkillId(skills),
        shoutsBySkillId: indexShoutsBySkillId(shouts),
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

/** As many of that caster's own turns as a sample needs to pass, each opened by a blow. */
function composeTurns(actorId: number, turns: number): BattleEvent[] {
    const found: BattleEvent[] = [];
    for (let at = 0; at < turns; at += 1) found.push(composeBlow(actorId));
    return found;
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

/** A view holding the events and the cast a sample states, and nothing the walk does not read. */
function composeView(events: readonly BattleEvent[], roster: CombatantRoster): FightView {
    return {
        roster,
        events,
        unread: { "unknown-key": 0, "no-parameter": 0, "grammar-refused": 0 },
        messagesLost: 0,
        messagesRead: events.length,
        hasJoinedInProgress: false,
        isOver: false,
        readerSide: null,
        turnStatement: null,
        isOnAuto: false,
        payloadsApplied: 1,
        chargedSkills: [],
        carriedStatuses: [],
        legendaryStandings: [],
        turnsByCombatantId: new Map(),
    };
}

/** develop's `composeFightStandings`, which took the events and the cast apart. */
function replayStandings(
    events: readonly BattleEvent[],
    stated: StatedSkills,
    roster: CombatantRoster,
): FightStandings {
    return replayFightStandings(composeView(events, roster), stated);
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

Deno.test("a cast stands from its own turn, and leaves when its turns have passed", () => {
    const dated = composeStated([{ id: 264, turns: 2 }]);
    const cast = composeCast(1, 264, "+spell-taken_dmg-all");
    assertEquals(
        replayStandings([cast], dated, ROSTER).standings.map((one) => one.turnsElapsed),
        [0],
        "nothing has passed on the turn it was cast",
    );
    assertEquals(
        replayStandings([cast, composeBlow(1)], dated, ROSTER).standings.map((one) =>
            one.turnsElapsed
        ),
        [1],
        "and one turn of the caster's later, one has",
    );
    assertEquals(
        replayStandings([cast, composeBlow(1), composeBlow(1)], dated, ROSTER).standings,
        [],
        "at the turns it was given it is no longer standing",
    );
});

Deno.test("another's turn moves nothing, and a second cast refreshes rather than adds", () => {
    const dated = composeStated([{ id: 264, turns: 8 }]);
    const cast = composeCast(1, 264, "+spell-taken_dmg-all");
    assertEquals(
        replayStandings([cast, composeBlow(2), composeBlow(2)], dated, ROSTER).standings
            .map((one) => one.turnsElapsed),
        [0],
        "the length is counted in the caster's own turns and nobody else's",
    );
    const refreshed = replayStandings([cast, composeBlow(1), cast], dated, ROSTER).standings;
    assertStrictEquals(refreshed.length, 1, "a second cast by the same caster is one row");
    assertStrictEquals(refreshed[0]?.turnsElapsed, 0, "and it starts again");
});

Deno.test("a cast the table dates no duration for reaches no row", () => {
    const cast = composeCast(1, 999, "aura-sa_per");
    assertEquals(
        replayStandings([cast], DATED, ROSTER).standings,
        [],
        "an id the frozen table does not name",
    );
    assertEquals(
        replayStandings([composeCast(1, 264, "+dmg")], DATED, ROSTER).standings,
        [],
        "and a skill whose effects reach one combatant",
    );
});

Deno.test("every recording answers, and nothing stands longer than the table gives it", () => {
    let stood = 0;
    for (const fight of readRecordedFights()) {
        const path = fight.path;
        const roster = indexCombatantRoster(fight.combatants);
        const events = decodeRecordedFight(fight).events;
        for (const one of replayStandings(events, DATED, roster).standings) {
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
    // `develop:docs/protocol-keys.md` records each of these against the published help.
    assertStrictEquals(
        lookupReachOfEffects([{ effect: "+spell-taken_dmg-all" }]),
        "other-side",
        "an effect the help gives as applying to all opponents",
    );
    assertStrictEquals(
        lookupReachOfEffects([{ effect: "aura-ac_per" }]),
        "casters-side",
        "and an aura raising a statistic of the caster's own team",
    );
    assertStrictEquals(
        lookupReachOfEffects([{ effect: "+dmg" }]),
        null,
        "a key nothing settles reaches nothing stated, rather than a side picked for it",
    );
});

Deno.test("a skill whose keys disagree reaches both sides, which is not a failed reading", () => {
    // `Prowokujący okrzyk` provokes the other side and raises its own side's melee damage in one
    // announcement. Calling that unknown would hide one of the two.
    assertStrictEquals(
        lookupReachOfEffects([{ effect: "shout" }, { effect: "aura-adddmg2_per-meele" }]),
        "both-sides",
        "both halves are stated, so both are said",
    );
});

/**
 * ⚠️ **This pair used to be the one above, on a reading that was backwards.** `shout` was held to
 * reach the caster's side — the help has the affected attacking whoever cast it, and over
 * `develop:captures/` 168 of 168 named characters stand opposite the caster — so `Wyzywający
 * okrzyk`, whose every key faces the other side, reaches only that side and never both.
 */
Deno.test("a skill whose keys all face the other side reaches that side alone", () => {
    assertStrictEquals(
        lookupReachOfEffects([{ effect: "shout" }, { effect: "alllowdmg" }]),
        "other-side",
        "a shout and a team-wide debuff both land there",
    );
});

/** Both skills as the published table states them: three turns, and six characters covered. */
const SHOUTS = [
    { id: 25, turns: 3, coverageMinimum: 6 },
    { id: 188, turns: 3, coverageMinimum: 6 },
];

Deno.test("a shout holds every character its value names, and nobody else", () => {
    const dated = composeStated([{ id: 188, turns: 5 }], SHOUTS);
    const held = replayStandings(
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
    const held = replayStandings(
        [composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9")],
        dated,
        // Eight a side rather than develop's ten: its ten reused the id the other side starts at,
        // which a roster now refuses as one combatant named twice.
        composeRoster(8, 1),
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
    const partly = replayStandings(
        [composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9, Nikt Taki")],
        dated,
        roster,
    ).provocations;
    assertEquals(partly.map((one) => one.provokedId), [9], "the name that resolves, and no other");

    const none = replayStandings(
        [composeCast(1, 188, "shout alllowdmg", 9, "Nikt Taki")],
        dated,
        roster,
    ).provocations;
    assertEquals(none, [], "and a value naming nobody the roster holds holds nobody");
});

Deno.test("a shout carrying no value at all holds nobody, rather than the target slot", () => {
    const dated = composeStated([{ id: 188, turns: 5 }], SHOUTS);
    const held = replayStandings(
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
    const held = replayStandings(
        [composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9")],
        dated,
        ROSTER,
    ).provocations;
    assertStrictEquals(held[0]?.turnsStated, 3, "the shout's own turns");
});

Deno.test("a shout the table dates nowhere holds nobody, and its other half still stands", () => {
    const dated = composeStated([{ id: 188, turns: 5 }], []);
    const events = [composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9")];
    assertEquals(
        replayStandings(events, dated, ROSTER).provocations,
        [],
        "an id the frozen shouts do not name holds nobody",
    );
    assertEquals(
        replayStandings(events, dated, ROSTER).standings.map((one) => one.turnsStated),
        [5],
        "and the debuff on the same announcement is dated by itself, so it stands",
    );
});

Deno.test("a cast the aura table dates nowhere still shouts, and stands on no side", () => {
    const dated = composeStated([], SHOUTS);
    const events = [composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9")];
    assertStrictEquals(
        replayStandings(events, dated, ROSTER).provocations.length,
        1,
        "the half the table does date is the half that is read",
    );
    assertEquals(
        replayStandings(events, dated, ROSTER).standings,
        [],
        "and an undated side-wide half stands nowhere rather than borrowing the shout's turns",
    );
});

Deno.test("an okrzyk dated on neither half is no cast at all", () => {
    const dated = composeStated([], []);
    const held = replayStandings(
        [composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9")],
        dated,
        ROSTER,
    );
    assertEquals(held.provocations, [], "nothing holds anybody");
    assertEquals(held.standings, [], "and nothing stands");
});

/**
 * `develop:captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json`: a Wojownik and a
 * Paladyn shout at one monster, interleaved — the only shape in the corpus where the overwrite is
 * observable.
 */
const BOTH_OKRZYKI = "2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0";

/** The first fight between players in the corpus, and the first shout naming more than one. */
const AGAINST_TWO = "2026-09-09-tempest-duet-vs-wojownik-ne0iTNdg-0.14.0";

Deno.test("one shout holds a character, and the last of them is the one that does", () => {
    const dated = composeStated([{ id: 25, turns: 3 }, { id: 188, turns: 5 }], SHOUTS);
    const wojownik = composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9");
    const paladyn = composeCast(2, 25, "shout aura-adddmg2_per-meele", 9, "Ktoś 9");
    const held = replayStandings([wojownik, composeBlow(1), paladyn], dated, ROSTER).provocations;
    assertStrictEquals(held.length, 1, "two casters at one character is one provocation");
    assertStrictEquals(held[0]?.casterId, 2, "and the later shout is the one holding them");
    assertStrictEquals(held[0]?.skillId, 25, "whichever of the two skills it was");
    assertStrictEquals(held[0]?.turnsElapsed, 0, "counted from the turn it took over on");
});

Deno.test("a later shout takes over each character it names, and leaves the rest standing", () => {
    const dated = composeStated([{ id: 25, turns: 3 }, { id: 188, turns: 5 }], SHOUTS);
    const held = replayStandings(
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

/**
 * ⚠️ **This is the test develop ADR 0097 turned round.** It read the other way until 2026-09-18 —
 * the okrzyk stood under the provocation and nowhere else, so that one announcement was one thing.
 * The published table dates its two halves apart, which is what makes them two.
 */
Deno.test("an okrzyk stands beside the whole-team casts as well as holding somebody", () => {
    const dated = composeStated([{ id: 188, turns: 5 }, { id: 264, turns: 8 }], SHOUTS);
    const events = [
        composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9"),
        composeCast(1, 264, "+spell-taken_dmg-all"),
    ];
    assertEquals(
        replayStandings(events, dated, ROSTER).standings.map((one) => one.skillId).sort(),
        [188, 264],
        "the okrzyk's side-wide half stands where every other cast reaching a side does",
    );
    assertStrictEquals(
        replayStandings(events, dated, ROSTER).provocations.length,
        1,
        "and it holds the character it named exactly once",
    );
});

/**
 * The whole of what `develop ADR 0097` is for, and now on two clocks as well as two lengths: the
 * shout runs on the turns of whoever it holds (`develop ADR 0103`) while the debuff runs on the
 * caster's, so one announcement is two counts that do not move together. **W5**: the turn each runs
 * out on is a boundary, and the turn before it stands beside it.
 */
Deno.test("an okrzyk's two halves run out apart, and on two different clocks", () => {
    const dated = composeStated([{ id: 188, turns: 5 }], SHOUTS);
    const cast = composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9");
    for (const elapsed of [0, 1, 2, 3]) {
        const held = replayStandings([cast, ...composeTurns(9, elapsed)], dated, ROSTER);
        assertStrictEquals(held.provocations.length, 1, `at ${elapsed} of their own turns, held`);
    }
    const freed = replayStandings([cast, ...composeTurns(9, 4)], dated, ROSTER);
    assertEquals(freed.provocations, [], "and a fourth turn of theirs is where the game let go");

    // Whatever the held character does, the debuff goes on running on the caster's own turns.
    for (const elapsed of [0, 1, 2, 3, 4]) {
        const held = replayStandings([cast, ...composeTurns(1, elapsed)], dated, ROSTER);
        assertStrictEquals(held.standings[0]?.turnsElapsed, elapsed, `the debuff at ${elapsed}`);
    }
    const over = replayStandings([cast, ...composeTurns(1, 5)], dated, ROSTER);
    assertEquals(over.standings, [], "and at five the debuff has run out too");
});

Deno.test("a target slot nobody shouted at holds nobody", () => {
    const dated = composeStated([{ id: 188, turns: 5 }, { id: 264, turns: 8 }], SHOUTS);
    // Every cast reaching a side names one end that is not the bearer: reading it would credit
    // the wrong combatant, which is what develop ADR 0010 measured and refused.
    const aimed = replayStandings(
        [composeCast(1, 264, "+spell-taken_dmg-all", 9)],
        dated,
        composeRoster(2, 3),
    ).provocations;
    assertEquals(aimed, [], "and no whole-team cast becomes a provocation by having a target");
});

/**
 * Every event of a recording, and where its last shout stands among them. A provocation now runs on
 * the held character's own turns (`develop ADR 0103`), so a claim about **whom** a shout named is
 * read where it was announced — by the end of a long fight the game has let them go.
 */
function composeEventsAndShout(path: string): {
    roster: CombatantRoster;
    events: BattleEvent[];
    lastShout: number;
} {
    const fight = lookupRecordedFight(path);
    const roster = indexCombatantRoster(fight.combatants);
    const events = decodeRecordedFight(fight).events;
    let lastShout = -1;
    for (const [at, event] of events.entries()) {
        if (event.kind !== "skill-used") continue;
        if (event.declared.some((one) => one.effect === PROVOCATION_KEY)) lastShout = at;
    }
    assert(lastShout >= 0, `${path} carries a shout to read`);
    return { roster, events, lastShout };
}

Deno.test(`${AGAINST_TWO}: one shout holds both players it named`, () => {
    const path = `captures/${AGAINST_TWO}.json`;
    const { roster, events, lastShout } = composeEventsAndShout(path);
    const announced = events.slice(0, lastShout + 1);
    const held = replayStandings(announced, DATED, roster).provocations;
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
    // `develop ADR 0103`: two characters held by one shout run out on two clocks, so by the end of
    // this fight they are not both still held — which the caster's clock could never have shown.
    const ended = replayStandings(events, DATED, roster).provocations;
    assert(ended.length < held.length, "and by the end the game has let go of at least one");
});

Deno.test(`${BOTH_OKRZYKI}: two casters at one monster leave one provocation standing`, () => {
    const path = `captures/${BOTH_OKRZYKI}.json`;
    const { roster, events, lastShout } = composeEventsAndShout(path);
    const announced = events.slice(0, lastShout + 1);
    const held = replayStandings(announced, DATED, roster).provocations;
    assertStrictEquals(held.length, 1, "a Wojownik and a Paladyn shouting at one monster is one");
    assertStrictEquals(
        roster.byId.get(held[0]?.provokedId ?? 0)?.name,
        "Amaimon Soploręki",
        "and the monster is who is held",
    );
    // develop ADR 0097: the okrzyk holding the monster stands among the whole-team casts as well,
    // on the side-wide half's own turns — 2 by the frozen table, where its shout is dated 3 — so
    // the two halves of one announcement run out apart, which is the whole of what that decision
    // states.
    const standing = replayStandings(announced, DATED, roster).standings;
    assertEquals(
        standing.filter((one) => one.skillId === 25).map((one) => one.turnsStated),
        [2],
        "the okrzyk that is holding somebody also stands on its caster's side, once",
    );
});

/**
 * The table is keyed by skill id, so two rows sharing one would silently collapse and the later
 * one would win — a duration read off a row nobody meant. The assertion that says so reads `===`
 * and never `<=`, which a map filled from a list satisfies whatever it dropped.
 */
Deno.test("a table naming one skill twice is refused rather than folded", () => {
    assertThrows(
        () => indexAuraTurnsBySkillId([{ id: 7, turns: 2 }, { id: 7, turns: 5 }]),
        AssertionError,
        "named once",
    );
    assertThrows(
        () =>
            indexShoutsBySkillId([
                { id: 7, turns: 2, coverageMinimum: 3 },
                { id: 7, turns: 5, coverageMinimum: 3 },
            ]),
        AssertionError,
        "named once",
    );
    assertStrictEquals(
        indexAuraTurnsBySkillId([{ id: 7, turns: 2 }, { id: 8, turns: 5 }]).size,
        2,
        "and two rows naming two skills are two",
    );
});

/** The names that state a side by themselves, so a reader needs nothing beside them. */
const SIDE_IN_THE_NAME = ["-enemies", "-all", "-allies", "aura-"];
/** Where the table lives, read as text because what is checked is the comment beside a value. */
const REACH_SOURCE = "src/core/protocol-key.ts";
const REACH_OPENER =
    "const REACH_BY_KEY: ReadonlyMap<string, KeyReach> = new Map<string, KeyReach>([";
const REACH_CLOSER = "]);";
const COMMENT_OPENER = "//";

interface ReachEntries {
    entries: number;
    bare: string[];
}

/**
 * The entries of the table in `source`, and the ones standing with neither a side in their name
 * nor a comment above them. An entry spelled as an identifier is the key that identifier holds,
 * looked up among `keys`; one nothing resolves is reported under its identifier.
 */
function lookupBareReachEntries(
    source: string,
    keys: Readonly<Record<string, unknown>>,
): ReachEntries {
    const opened = source.indexOf(REACH_OPENER);
    assert(opened !== -1, "the table is where this guard expects it");
    const lines = source.slice(opened + REACH_OPENER.length).split("\n");
    const found: ReachEntries = { entries: 0, bare: [] };
    let commented = false;
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith(REACH_CLOSER)) break;
        if (trimmed.startsWith(COMMENT_OPENER)) {
            commented = true;
            continue;
        }
        if (!trimmed.startsWith("[")) continue;
        const named = readReachEntryKey(trimmed, keys);
        if (named.length === 0) continue;
        found.entries += 1;
        const saysItsSide = SIDE_IN_THE_NAME.some((mark) => named.includes(mark));
        if (!saysItsSide) {
            if (!commented) found.bare.push(named);
        }
        commented = false;
    }
    return found;
}

/** `["alllowdmg", …]` names its key; `[HEALING_REDUCER_KEY, …]` names what the constant holds. */
function readReachEntryKey(trimmed: string, keys: Readonly<Record<string, unknown>>): string {
    const inside = trimmed.slice(1, trimmed.indexOf(","));
    if (inside.startsWith('"')) return inside.slice(1, inside.indexOf('"', 1));
    const held = keys[inside];
    return typeof held === "string" ? held : inside;
}

Deno.test("the entry reader flags a bare key, and passes one with a reason or a side", () => {
    const sample = [
        REACH_OPENER,
        '    ["plainkey", "other-side"],',
        "    // Measured, and cited here.",
        '    ["explained", "other-side"],',
        '    ["heal-allies", "casters-side"],',
        '    [NAMED_KEY, "other-side"],',
        '    [LEFT_ALONE, "other-side"],',
        REACH_CLOSER,
        '    ["after", "other-side"],',
    ].join("\n");
    const read = lookupBareReachEntries(sample, { NAMED_KEY: "debuff-enemies" });
    assertStrictEquals(read.entries, 5, "every entry inside the table, and none after it");
    assertEquals(
        read.bare,
        ["plainkey", "LEFT_ALONE"],
        "and only the two with nothing beside them",
    );
});

/**
 * ⚠️ **A key with no side in its name carries a citation or a measurement** (`develop ADR 0106`),
 * and the entry that record exists for was the one without either. Read over the source rather
 * than over the table, because what a value needs is the **reason beside it**, and a reason is a
 * comment. A key added without one reddens this.
 */
Deno.test("a reach with no side in its name is entered with its reason", () => {
    const read = lookupBareReachEntries(Deno.readTextFileSync(REACH_SOURCE), protocolKeys);
    assert(read.entries > 10, `the table was read: ${read.entries} entries`);
    assertEquals(read.bare, [], "every key that does not name its side is entered with a reason");
});

/**
 * Probes, every one: each was a mutation that lit nothing until it was written out here, because
 * no sample above reached the branch it broke.
 */
Deno.test("a name nobody holds is skipped wherever it stands in the list", () => {
    const dated = composeStated([{ id: 188, turns: 5 }], SHOUTS);
    const first = replayStandings(
        [composeCast(1, 188, "shout alllowdmg", 9, "Nikt Taki, Ktoś 9")],
        dated,
        composeRoster(2, 3),
    ).provocations;
    assertEquals(first.map((one) => one.provokedId), [9], "a name after an unplaced one holds");
    const trailing = replayStandings(
        [composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9, ")],
        dated,
        composeRoster(2, 3),
    ).provocations;
    assertEquals(trailing.map((one) => one.provokedId), [9], "and an empty name is no name");
});

Deno.test("the target slot is read beside a shout, and on no other cast", () => {
    const dated = composeStated([{ id: 188, turns: 5 }, { id: 264, turns: 8 }], SHOUTS);
    const plain = replayStandings([composeCast(1, 264, "+spell-taken_dmg-all", 9)], dated, ROSTER);
    assertStrictEquals(plain.standings[0]?.chosenTargetId, null, "a cast reaching a side");
    const shouted = replayStandings(
        [composeCast(1, 188, "shout alllowdmg", 9, "Ktoś 9")],
        dated,
        ROSTER,
    );
    assertStrictEquals(shouted.standings[0]?.chosenTargetId, 9, "and the shout's own slot");
});

Deno.test("a standing carries the figures its announcement stated", () => {
    const dated = composeStated([{ id: 264, turns: 8 }]);
    const held = replayStandings([composeCast(1, 264, "+spell-taken_dmg-all")], dated, ROSTER);
    assertEquals(
        [...(held.standings[0]?.amountByKey ?? [])],
        [["+spell-taken_dmg-all", 8]],
        "each key at the figure it was stated at",
    );
});

Deno.test("the turns a cast stood on are the turns as it stood, not as the fight ended", () => {
    const dated = composeStated([{ id: 264, turns: 8 }]);
    const events = [composeCast(1, 264, "+spell-taken_dmg-all"), ...composeTurns(2, 3)];
    const held = replayStandings(events, dated, ROSTER).standings[0];
    assertStrictEquals(held?.turnsAtCastByCombatantId.get(1), 1, "the caster's turn of the cast");
    assertStrictEquals(held?.turnsAtCastByCombatantId.get(2), undefined, "and nobody else's yet");
});

Deno.test("a turn lost is a turn that passed for whoever is carrying a cast", () => {
    const dated = composeStated([{ id: 264, turns: 8 }]);
    const lost: BattleEvent = { kind: "turn-lost", combatantId: 1 };
    const held = replayStandings(
        [composeCast(1, 264, "+spell-taken_dmg-all"), lost],
        dated,
        ROSTER,
    );
    assertStrictEquals(held.standings[0]?.turnsElapsed, 1, "one of the caster's turns went by");
});

Deno.test("the slow a Szadź casts reaches the other side", () => {
    assertStrictEquals(
        lookupReachOfEffects([{ effect: "allslow_per" }]),
        "other-side",
        "the one reach settled by measurement rather than by the register",
    );
});
