/**
 * The two legendary bonuses a fighter's own tooltip can be honest about: the one still running,
 * and the one already spent.
 *
 * Neither rides a `skillId`, so the published skill table dates neither and nothing in
 * `develop:src/core/aura-standing.ts` has a row for them. What is checked here is the three things
 * only this walk answers — that the run is counted by the heals it gives the holder, that a second
 * declaration is the game doing it again rather than the same run going on, and that a bonus
 * which fires once stays fired.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { type AttackEvent, BATTLE_EVENT, type BattleEvent } from "#/src/core/battle-event.ts";
import {
    composeLegendaryStandings,
    HOLYTOUCH_HEALS_STATED,
    type LegendaryWalk,
    NO_LEGENDARY_WALK,
    prepareLegendaryWalk,
    tallyLegendaryBonuses,
} from "#/src/core/legendary-standing.ts";
import { LEGENDARY_BONUS_SHOWING, lookupLegendaryBonus } from "#/src/core/protocol-key.ts";
import { readRecordedFights, tallyRecordedFight } from "#/tests/recorded-fights.ts";

const HOLDER = 11;
const SOMEBODY_ELSE = 12;

Deno.test("the effect stands for the heals the help gives it, and goes with the last", () => {
    let walk = NO_LEGENDARY_WALK;
    walk = prepareLegendaryWalk(walk, [composeDeclaringBlow(HOLDER)]);
    assertStrictEquals(readStanding(walk, HOLDER)?.holytouchHealsReceived, 0, "lit, and none yet");
    walk = prepareLegendaryWalk(walk, [composeHeal(HOLDER)]);
    assertStrictEquals(readStanding(walk, HOLDER)?.holytouchHealsReceived, 1, "one heal is one");
    for (let heal = 2; heal < HOLYTOUCH_HEALS_STATED; heal += 1) {
        walk = prepareLegendaryWalk(walk, [composeHeal(HOLDER)]);
    }
    const inside = readStanding(walk, HOLDER);
    assertStrictEquals(
        inside?.holytouchHealsReceived,
        HOLYTOUCH_HEALS_STATED - 1,
        "still standing",
    );
    // **W5**: the bound is a boundary, so the heal reaching it is asserted beside the one under.
    walk = prepareLegendaryWalk(walk, [composeHeal(HOLDER)]);
    assertStrictEquals(
        readStanding(walk, HOLDER),
        undefined,
        "and gone on the payload of the last",
    );
});

/** The blow that declares the effect. It rides the **holder's own** attack — article `view,372`. */
function composeDeclaringBlow(actorId: number): AttackEvent {
    return {
        kind: BATTLE_EVENT.attack,
        actorId,
        targetId: 21,
        actorHealthPercent: 100,
        targetHealthPercent: 90,
        raw: [{ element: "physical", amount: 10 }],
        applied: [{ element: "physical", amount: 10 }],
        prevented: [],
        destroyed: [],
        procs: [],
        declared: [{ effect: "+legbon_holytouch", amount: null, text: null }],
        announced: null,
    };
}

function readStanding(walk: LegendaryWalk, combatantId: number) {
    return composeLegendaryStandings(walk).find((standing) => standing.combatantId === combatantId);
}

/** One heal under the effect. A full holder is healed for nought, and that is still a heal. */
function composeHeal(combatantId: number, amount = 976): BattleEvent {
    return {
        kind: BATTLE_EVENT.healthChange,
        combatantId,
        amount,
        healthPercent: 100,
        source: "legbon_holytouch_heal",
        declared: [],
        announced: null,
    };
}

/**
 * ⚠️ **Seven runs over `captures/` gave all three heals inside the payload that lit
 * them**, so the order inside one payload is what places them: a heal after the lighting is that
 * run's.
 */
Deno.test("a whole run inside one payload is counted, and leaves with it", () => {
    let walk = NO_LEGENDARY_WALK;
    const heals = Array.from({ length: HOLYTOUCH_HEALS_STATED }, () => composeHeal(HOLDER, 0));
    walk = prepareLegendaryWalk(walk, [composeDeclaringBlow(HOLDER), ...heals]);
    assertStrictEquals(readStanding(walk, HOLDER), undefined, "three heals of nought are three");
});

Deno.test("a heal with no lighting before it opens no run", () => {
    let walk = NO_LEGENDARY_WALK;
    walk = prepareLegendaryWalk(walk, [composeHeal(HOLDER)]);
    assertEquals(composeLegendaryStandings(walk), [], "nothing dates where it began");
    walk = prepareLegendaryWalk(walk, [composeHeal(HOLDER), composeDeclaringBlow(HOLDER)]);
    assertStrictEquals(
        readStanding(walk, HOLDER)?.holytouchHealsReceived,
        0,
        "the one before is not",
    );
});

/**
 * ⚠️ **A second declaration is the game applying it again**, so the run a reader is in restarts.
 * Reading it as one long run would count heals from an effect that has already ended once.
 */
Deno.test("a second declaration restarts the run rather than lengthening it", () => {
    let walk = NO_LEGENDARY_WALK;
    walk = prepareLegendaryWalk(walk, [composeDeclaringBlow(HOLDER), composeHeal(HOLDER)]);
    walk = prepareLegendaryWalk(walk, [composeHeal(HOLDER)]);
    walk = prepareLegendaryWalk(walk, [composeDeclaringBlow(HOLDER)]);
    walk = prepareLegendaryWalk(walk, [composeHeal(HOLDER)]);
    const standing = readStanding(walk, HOLDER);
    assertStrictEquals(standing?.holytouchHealsReceived, 1, "one heal since the later of the two");
});

Deno.test("the heals are counted on the holder and on nobody else", () => {
    let walk = NO_LEGENDARY_WALK;
    walk = prepareLegendaryWalk(walk, [
        composeDeclaringBlow(HOLDER),
        composeHeal(SOMEBODY_ELSE),
    ]);
    const standings = composeLegendaryStandings(walk);
    assertEquals(
        standings.map((standing) => standing.combatantId),
        [HOLDER],
        "one row, and it is theirs",
    );
    assertStrictEquals(standings[0]?.holytouchHealsReceived, 0, "and somebody else's heal is not");
});

Deno.test("a bonus that fires once stays fired, and says nothing of any length", () => {
    let walk = NO_LEGENDARY_WALK;
    walk = prepareLegendaryWalk(walk, [composeLastheal(HOLDER)]);
    walk = prepareLegendaryWalk(walk, []);
    const spent = readStanding(walk, HOLDER);
    assertStrictEquals(spent?.hasSpentLastheal, true, "spent a payload later is still spent");
    assertStrictEquals(spent?.holytouchHealsReceived, null, "and the other bonus says nothing");
});

/** The bonus that heals once a fight, read off the value and never off a slot. */
function composeLastheal(targetId: number): BattleEvent {
    return {
        kind: BATTLE_EVENT.healingToNamedCombatant,
        targetName: "Gracz 1",
        targetId,
        targetHealthPercent: 40,
        amount: 5000,
        source: "legbon_lastheal",
    };
}

/** The two are one row where one combatant carries both, and the row states each of them. */
Deno.test("a holder of both is one row, and it says both", () => {
    let walk = NO_LEGENDARY_WALK;
    walk = prepareLegendaryWalk(walk, [
        composeDeclaringBlow(HOLDER),
        composeLastheal(HOLDER),
    ]);
    const standings = composeLegendaryStandings(walk);
    assertStrictEquals(standings.length, 1, "one combatant, one row");
    assertStrictEquals(standings[0]?.hasSpentLastheal, true, "the bonus that fired");
    assertStrictEquals(standings[0]?.holytouchHealsReceived, 0, "and the one still running");
});

/**
 * **W5: zero is a boundary.** A fight nothing has fired in states no row, which is a different
 * answer from a row saying nothing.
 */
Deno.test("a walk nothing has happened in states no standing at all", () => {
    let walk = NO_LEGENDARY_WALK;
    walk = prepareLegendaryWalk(walk, []);
    assertEquals(composeLegendaryStandings(walk), [], "nothing stands");
});

/**
 * ⚠️ **A blow by somebody else does not light it on them.** The declaration rides the holder's
 * own attack, so the actor is the holder and the target is nobody's business here.
 */
Deno.test("the blow's own thrower is the holder, and not whoever it was thrown at", () => {
    let walk = NO_LEGENDARY_WALK;
    walk = prepareLegendaryWalk(walk, [composeDeclaringBlow(SOMEBODY_ELSE)]);
    const standings = composeLegendaryStandings(walk);
    assertEquals(
        standings.map((standing) => standing.combatantId),
        [SOMEBODY_ELSE],
        "it lit on the thrower",
    );
});

/** Preparing touches nothing, which is what lets a session drop a payload that failed halfway. */
Deno.test("the walk handed in is left as it was, and the same input prepares the same walk", () => {
    const before = prepareLegendaryWalk(NO_LEGENDARY_WALK, [composeDeclaringBlow(HOLDER)]);
    const kept = copyWalk(before);
    const events = [composeHeal(HOLDER), composeLastheal(SOMEBODY_ELSE)];
    const firstWalk = prepareLegendaryWalk(before, events);
    const secondWalk = prepareLegendaryWalk(before, events);
    assertEquals(
        copyWalk(firstWalk),
        copyWalk(secondWalk),
        "the same input prepares the same walk",
    );
    assertEquals(copyWalk(before), kept, "and the walk it was prepared from is unchanged");
    assertEquals(copyWalk(NO_LEGENDARY_WALK), { heals: [], spent: [] }, "as is the empty walk");
});

function copyWalk(walk: LegendaryWalk) {
    return {
        heals: [...walk.holytouchHealsByBearerId],
        spent: [...walk.lastHealSpentCombatantIds],
    };
}

/**
 * Whose a bonus is comes off the table and never off the sign, and a blow carries bonuses two ways:
 * as procs and as declarations. ADR 0029.
 */
Deno.test("each legendary bonus is counted on its holder, whichever way the blow carries it", () => {
    const blow: BattleEvent = {
        ...composeDeclaringBlow(HOLDER),
        targetId: SOMEBODY_ELSE,
        procs: ["+legbon_verycrit", "-legbon_cleanse"],
        declared: [
            { effect: "-legbon_facade", amount: 13, text: null },
            { effect: "+legbon_puncture", amount: 12, text: null },
            { effect: "+injure", amount: 40, text: null },
        ],
    };
    const counts = tallyLegendaryBonuses([blow, composeLastheal(HOLDER)]);
    assertEquals(
        [...counts.get(HOLDER) ?? []],
        [["+legbon_verycrit", 1], ["+legbon_puncture", 1], ["legbon_lastheal", 1]],
        "the striker holds what fires when they strike, and the rescue is the one it healed",
    );
    assertEquals(
        [...counts.get(SOMEBODY_ELSE) ?? []],
        [["-legbon_cleanse", 1], ["-legbon_facade", 1]],
        "and the struck holds what fires when they are struck",
    );
    assertStrictEquals(counts.size, 2, "and a key that is no bonus reaches nobody");
});

/** **W5**: nothing is a boundary, and a bonus whose holder the message names nobody at is too. */
Deno.test("no event counts nothing, and a bonus on an end nobody stands at is nobody's", () => {
    assertStrictEquals(tallyLegendaryBonuses([]).size, 0, "no events, no holders");
    const unheld: BattleEvent = {
        ...composeDeclaringBlow(HOLDER),
        actorId: null,
        procs: ["+legbon_curse"],
    };
    assertStrictEquals(
        tallyLegendaryBonuses([unheld]).size,
        0,
        "and an actor nobody is holds none",
    );
    const twice = tallyLegendaryBonuses([
        composeDeclaringBlow(HOLDER),
        composeDeclaringBlow(HOLDER),
    ]);
    assertStrictEquals(twice.get(HOLDER)?.get("+legbon_holytouch"), 2, "one blow is one, two two");
});

/**
 * The seam: the decoder's spelling against the table's, over every recording. The figures are the
 * `_Shape:_` lines of `docs/protocol-keys.md`, and a bonus held for the whole fight stands once on
 * its holder or not at all — which is what keeps it out of the counted ones on the card.
 */
Deno.test("the recordings count each legendary bonus as the register states it", () => {
    const totals = new Map<string, number>();
    for (const fight of readRecordedFights()) {
        const statistics = tallyRecordedFight(fight.path).statistics;
        for (const counts of statistics.legendaryBonusesByCombatantId.values()) {
            for (const [key, count] of counts) {
                totals.set(key, (totals.get(key) ?? 0) + count);
                const bonus = lookupLegendaryBonus(key);
                assert(bonus !== null, `${fight.path}: ${key} is a bonus the table names`);
                if (bonus.showing === LEGENDARY_BONUS_SHOWING.held) {
                    assertStrictEquals(count, 1, `${fight.path}: ${key} stands once on a holder`);
                }
            }
        }
    }
    assertEquals(
        Object.fromEntries([...totals].sort()),
        {
            "+legbon_anguish": 21,
            "+legbon_curse": 17,
            "+legbon_holytouch": 70,
            "+legbon_puncture": 11,
            "+legbon_verycrit": 30,
            "-legbon_cleanse": 25,
            "-legbon_critred": 17,
            "-legbon_facade": 17,
            "-legbon_glare": 8,
            "legbon_lastheal": 14,
        },
        "every occurrence the register counts, on somebody's row",
    );
});
