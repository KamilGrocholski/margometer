/**
 * The two legendary bonuses a fighter's own tooltip can be honest about: the one still running,
 * and the one already spent.
 *
 * Neither rides a `skillId`, so the published skill table dates neither and nothing in
 * `core/aura-standing.ts` has a row for them. What is checked here is the three things only this
 * walk answers — that the run is counted by the heals it gives the holder, that a second
 * declaration is the game doing it again rather than the same run going on, and that a bonus
 * which fires once stays fired.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
    addPayloadToLegendaryStandings,
    composeLegendaryStandings,
    composeLegendaryWalk,
    HOLYTOUCH_HEALS_STATED,
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

/** One heal under the effect. A full holder is healed for nought, and that is still a heal. */
function composeHeal(combatantId: number, amount = 976): BattleEvent {
    return {
        kind: "health-change",
        combatantId,
        amount,
        healthPercent: 100,
        source: "legbon_holytouch_heal",
        declared: [],
        announced: null,
    };
}

function readStanding(walk: ReturnType<typeof composeLegendaryWalk>, combatantId: number) {
    return composeLegendaryStandings(walk).find((one) => one.combatantId === combatantId);
}

Deno.test("the effect stands for the heals the help gives it, and goes with the last", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(walk, [composeDeclaringBlow(HOLDER)]);
    assertStrictEquals(readStanding(walk, HOLDER)?.holytouchHealsGiven, 0, "lit, and none yet");
    addPayloadToLegendaryStandings(walk, [composeHeal(HOLDER)]);
    assertStrictEquals(readStanding(walk, HOLDER)?.holytouchHealsGiven, 1, "one heal is one");
    for (let heal = 2; heal < HOLYTOUCH_HEALS_STATED; heal += 1) {
        addPayloadToLegendaryStandings(walk, [composeHeal(HOLDER)]);
    }
    const inside = readStanding(walk, HOLDER);
    assertStrictEquals(inside?.holytouchHealsGiven, HOLYTOUCH_HEALS_STATED - 1, "still standing");
    // **W5**: the bound is a boundary, so the heal reaching it is asserted beside the one under.
    addPayloadToLegendaryStandings(walk, [composeHeal(HOLDER)]);
    assertStrictEquals(
        readStanding(walk, HOLDER),
        undefined,
        "and gone on the payload of the last",
    );
});

/**
 * ⚠️ **Seven runs over `captures/` gave all three heals inside the payload that lit them**, so
 * the order inside one payload is what places them: a heal after the lighting is that run's.
 */
Deno.test("a whole run inside one payload is counted, and leaves with it", () => {
    const walk = composeLegendaryWalk();
    const heals = Array.from({ length: HOLYTOUCH_HEALS_STATED }, () => composeHeal(HOLDER, 0));
    addPayloadToLegendaryStandings(walk, [composeDeclaringBlow(HOLDER), ...heals]);
    assertStrictEquals(readStanding(walk, HOLDER), undefined, "three heals of nought are three");
});

Deno.test("a heal with no lighting before it opens no run", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(walk, [composeHeal(HOLDER)]);
    assertEquals(composeLegendaryStandings(walk), [], "nothing dates where it began");
    addPayloadToLegendaryStandings(walk, [composeHeal(HOLDER), composeDeclaringBlow(HOLDER)]);
    assertStrictEquals(readStanding(walk, HOLDER)?.holytouchHealsGiven, 0, "the one before is not");
});

/**
 * ⚠️ **A second declaration is the game applying it again**, so the run a reader is in restarts.
 * Reading it as one long run would count heals from an effect that has already ended once.
 */
Deno.test("a second declaration restarts the run rather than lengthening it", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(walk, [composeDeclaringBlow(HOLDER), composeHeal(HOLDER)]);
    addPayloadToLegendaryStandings(walk, [composeHeal(HOLDER)]);
    addPayloadToLegendaryStandings(walk, [composeDeclaringBlow(HOLDER)]);
    addPayloadToLegendaryStandings(walk, [composeHeal(HOLDER)]);
    const standing = readStanding(walk, HOLDER);
    assertStrictEquals(standing?.holytouchHealsGiven, 1, "one heal since the later of the two");
});

Deno.test("the heals are counted on the holder and on nobody else", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(walk, [
        composeDeclaringBlow(HOLDER),
        composeHeal(SOMEBODY_ELSE),
    ]);
    const standings = composeLegendaryStandings(walk);
    assertEquals(standings.map((one) => one.combatantId), [HOLDER], "one row, and it is theirs");
    assertStrictEquals(standings[0]?.holytouchHealsGiven, 0, "and somebody else's heal is not");
});

Deno.test("a bonus that fires once stays fired, and says nothing of any length", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(walk, [composeLastheal(HOLDER)]);
    addPayloadToLegendaryStandings(walk, []);
    const spent = readStanding(walk, HOLDER);
    assertStrictEquals(spent?.hasSpentLastheal, true, "spent a payload later is still spent");
    assertStrictEquals(spent?.holytouchHealsGiven, null, "and the other bonus says nothing");
});

/** The two are one row where one combatant carries both, and the row states each of them. */
Deno.test("a holder of both is one row, and it says both", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(walk, [
        composeDeclaringBlow(HOLDER),
        composeLastheal(HOLDER),
    ]);
    const standings = composeLegendaryStandings(walk);
    assertStrictEquals(standings.length, 1, "one combatant, one row");
    assertStrictEquals(standings[0]?.hasSpentLastheal, true, "the bonus that fired");
    assertStrictEquals(standings[0]?.holytouchHealsGiven, 0, "and the one still running");
});

/**
 * **W5: zero is a boundary.** A fight nothing has fired in states no row, which is a different
 * answer from a row saying nothing.
 */
Deno.test("a walk nothing has happened in states no standing at all", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(walk, []);
    assertEquals(composeLegendaryStandings(walk), [], "nothing stands");
});

/**
 * ⚠️ **A blow by somebody else does not light it on them.** The declaration rides the holder's
 * own attack, so the actor is the holder and the target is nobody's business here.
 */
Deno.test("the blow's own thrower is the holder, and not whoever it was thrown at", () => {
    const walk = composeLegendaryWalk();
    addPayloadToLegendaryStandings(walk, [composeDeclaringBlow(SOMEBODY_ELSE)]);
    const standings = composeLegendaryStandings(walk);
    assertEquals(standings.map((one) => one.combatantId), [SOMEBODY_ELSE], "it lit on the thrower");
});
