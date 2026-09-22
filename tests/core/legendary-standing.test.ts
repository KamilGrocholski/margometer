/**
 * The two legendary bonuses a fighter's own tooltip can be honest about: the one still running,
 * and the one already spent.
 *
 * Neither rides a `skillId`, so the published skill table dates neither and nothing in
 * `core/aura-standing.ts` has a row for them. What is checked here is the three things only this
 * walk answers — that the run is dated on the holder's own clock, that a second declaration is
 * the game doing it again rather than the same run going on, and that a bonus which fires once
 * stays fired.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
    addPayloadToLegendaryStandings,
    composeLegendaryStandings,
    composeLegendaryWalk,
    HOLYTOUCH_TURNS_STATED,
} from "@/src/core/legendary-standing.ts";

const HOLDER = 11;
const SOMEBODY_ELSE = 12;

/** The blow that declares the effect. It rides the **holder's own** attack — article `view,372`. */
function composeDeclaringBlow(actorId: number): BattleEvent {
    return {
        kind: "attack",
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

/** The bonus that heals once a fight, read off the value and never off a slot. */
function composeLastheal(targetId: number): BattleEvent {
    return {
        kind: "healing-to-named-combatant",
        targetName: "Gracz 1",
        targetId,
        targetHealthPercent: 40,
        amount: 5000,
        source: "legbon_lastheal",
    };
}

function readStanding(
    walk: ReturnType<typeof composeLegendaryWalk>,
    turnsByCombatantId: ReadonlyMap<number, number>,
    combatantId: number,
) {
    return composeLegendaryStandings(walk, turnsByCombatantId).find((one) =>
        one.combatantId === combatantId
    );
}

Deno.test("the effect stands for the turns the table gives it, and goes on the one past", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(walk, [composeDeclaringBlow(HOLDER)], new Map([[HOLDER, 4]]));
    const atLighting = readStanding(walk, new Map([[HOLDER, 4]]), HOLDER);
    assertStrictEquals(atLighting?.holytouchTurnsElapsed, 0, "nought of their turns have passed");
    const inside = readStanding(walk, new Map([[HOLDER, 4 + HOLYTOUCH_TURNS_STATED - 1]]), HOLDER);
    assertStrictEquals(inside?.holytouchTurnsElapsed, HOLYTOUCH_TURNS_STATED - 1, "still standing");
    // **W5**: the bound is a boundary, so the turn past it is asserted beside the one under it.
    const past = readStanding(walk, new Map([[HOLDER, 4 + HOLYTOUCH_TURNS_STATED]]), HOLDER);
    assertStrictEquals(past, undefined, "and the row is gone on the turn its length runs out");
});

/**
 * ⚠️ **A second declaration is the game applying it again**, so the run a reader is in restarts.
 * Reading it as one long run would date the row from an effect that has already ended once.
 */
Deno.test("a second declaration restarts the run rather than lengthening it", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(walk, [composeDeclaringBlow(HOLDER)], new Map([[HOLDER, 1]]));
    addPayloadToLegendaryStandings(walk, [composeDeclaringBlow(HOLDER)], new Map([[HOLDER, 2]]));
    const standing = readStanding(walk, new Map([[HOLDER, 3]]), HOLDER);
    assertStrictEquals(standing?.holytouchTurnsElapsed, 1, "one turn since the later of the two");
});

Deno.test("the effect is dated on the holder's clock and on nobody else's", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(walk, [composeDeclaringBlow(HOLDER)], new Map([[HOLDER, 2]]));
    const standings = composeLegendaryStandings(walk, new Map([[HOLDER, 3], [SOMEBODY_ELSE, 9]]));
    assertEquals(standings.map((one) => one.combatantId), [HOLDER], "one row, and it is theirs");
    assertStrictEquals(standings[0]?.holytouchTurnsElapsed, 1, "counted where it lit, not on nine");
});

Deno.test("a bonus that fires once stays fired, and says nothing of any length", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(walk, [composeLastheal(HOLDER)], new Map([[HOLDER, 1]]));
    const spent = readStanding(walk, new Map([[HOLDER, 40]]), HOLDER);
    assertStrictEquals(spent?.hasSpentLastheal, true, "spent forty turns later is still spent");
    assertStrictEquals(spent?.holytouchTurnsElapsed, null, "and the other bonus says nothing");
});

/** The two are one row where one combatant carries both, and the row states each of them. */
Deno.test("a holder of both is one row, and it says both", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(walk, [
        composeDeclaringBlow(HOLDER),
        composeLastheal(HOLDER),
    ], new Map([[HOLDER, 1]]));
    const standings = composeLegendaryStandings(walk, new Map([[HOLDER, 1]]));
    assertStrictEquals(standings.length, 1, "one combatant, one row");
    assertStrictEquals(standings[0]?.hasSpentLastheal, true, "the bonus that fired");
    assertStrictEquals(standings[0]?.holytouchTurnsElapsed, 0, "and the one still running");
});

/**
 * **W5: zero is a boundary.** A fight nothing has fired in states no row, which is a different
 * answer from a row saying nothing.
 */
Deno.test("a walk nothing has happened in states no standing at all", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(walk, [], new Map());
    assertEquals(composeLegendaryStandings(walk, new Map()), [], "nothing stands");
});

/**
 * ⚠️ **A blow by somebody else does not light it on them.** The declaration rides the holder's
 * own attack, so the actor is the holder and the target is nobody's business here.
 */
Deno.test("the blow's own thrower is the holder, and not whoever it was thrown at", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(
        walk,
        [composeDeclaringBlow(SOMEBODY_ELSE)],
        new Map([[SOMEBODY_ELSE, 1]]),
    );
    const standings = composeLegendaryStandings(walk, new Map([[SOMEBODY_ELSE, 1], [21, 5]]));
    assertEquals(standings.map((one) => one.combatantId), [SOMEBODY_ELSE], "it lit on the thrower");
});
