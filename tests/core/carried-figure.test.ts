/**
 * What a status comes to on the combatant it is drawn beside, and every shape that comes to
 * nothing.
 *
 * The mask says on whom and never how much; an announcement says how much and never on whom. The
 * rules here are what keeps the join honest: the cast must reach their side, it must still be
 * inside its own turns **counted on theirs**, and the caster of a key the help halves for them
 * gets no figure at all.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { type AuraStanding } from "@/src/core/aura-standing.ts";
import { composeCarriedFigures, composeWitnessedKeyByBit } from "@/src/core/carried-figure.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";

const OURS = 1;
const THEIRS = 2;
const SPEED_BIT = 6;
const SLOW_BIT = 5;
/** The nine the client registers, in its own order — `frozen/buff-bits.ts` holds the real one. */
const BITS = [
    "deep_wound",
    "wound",
    "critical_deep_wound",
    "poisoned",
    "fire",
    "swow_down",
    "speed_up",
    "frostbite",
    "shock",
];
const WITNESSED = composeWitnessedKeyByBit(BITS);

const ROSTER = composeCombatantRoster([
    { id: 11, name: "Gracz 1", side: OURS, profession: "w", level: 40, healthMaximum: 100 },
    { id: 12, name: "Gracz 2", side: OURS, profession: "t", level: 40, healthMaximum: 100 },
    { id: 13, name: "Gracz 3", side: OURS, profession: "p", level: 40, healthMaximum: 100 },
    { id: 21, name: "Renegat 1", side: THEIRS, profession: "m", level: 40, healthMaximum: 100 },
]);

function composeCast(over: Partial<AuraStanding> & { key: string; amount: number }): AuraStanding {
    return {
        skillId: 89,
        skillName: "Podwójny dech",
        casterId: 11,
        turnsElapsed: 0,
        turnsStated: 8,
        reach: "casters-side",
        chosenTargetId: null,
        amountByKey: new Map([[over.key, over.amount]]),
        turnsAtCastByCombatantId: new Map([[11, 0], [12, 0], [13, 0], [21, 0]]),
        ...over,
    };
}

function readFigure(
    standings: readonly AuraStanding[],
    bit: number,
    turnsByCombatantId: ReadonlyMap<number, number>,
) {
    const found = composeCarriedFigures({
        statuses: [{ combatantId: 12, bit, turnsElapsed: 4 }],
        standings,
        roster: ROSTER,
        turnsByCombatantId,
        witnessed: WITNESSED,
    });
    return found[0];
}

Deno.test("a cast reaching their side dates the status on the bearer's own turns", () => {
    const figure = readFigure(
        [composeCast({ key: "aura-sa_per", amount: 20 })],
        SPEED_BIT,
        new Map([[12, 3]]),
    );
    assertStrictEquals(figure?.percent, 20, "one source, one figure");
    assertEquals(figure?.length, { turnsElapsed: 3, turnsStated: 8 }, "three of their turns");
});

/**
 * ⚠️ **The failure this file was written for.** A standing is dropped on the **caster's** turns
 * (**ADR 0101**), so a cast whose caster stops taking them stands on for ever — and a row dated
 * from it read `21 z 8 tur` over `captures/`. Held to the bearer's clock it goes when it should,
 * and takes its figure with it rather than leaving one the clock will not back.
 */
Deno.test("a cast the bearer has outrun says nothing, figure and length alike", () => {
    const standings = [composeCast({ key: "aura-sa_per", amount: 20 })];
    const figure = readFigure(standings, SPEED_BIT, new Map([[12, 21]]));
    assertStrictEquals(figure?.percent, null, "no figure from a cast that is over for them");
    assertStrictEquals(figure?.length, null, "and no length either");
});

/** **W5: zero is a boundary.** The turn a cast lands on is nought of the bearer's, not none. */
Deno.test("a cast that has just landed is nought of its turns and not nothing", () => {
    const figure = readFigure(
        [composeCast({ key: "aura-sa_per", amount: 20 })],
        SPEED_BIT,
        new Map([[12, 0]]),
    );
    assertEquals(figure?.length, { turnsElapsed: 0, turnsStated: 8 }, "nought of eight");
});

Deno.test("two sources add, and the freshest of them dates the row", () => {
    const standings = [
        composeCast({ key: "aura-sa_per", amount: 20 }),
        composeCast({
            key: "aura-sa_per",
            amount: 19,
            casterId: 13,
            turnsAtCastByCombatantId: new Map([[11, 2], [12, 2], [13, 2], [21, 2]]),
        }),
    ];
    const figure = readFigure(standings, SPEED_BIT, new Map([[12, 3]]));
    assertStrictEquals(figure?.percent, 39, "the two highest add");
    assertEquals(figure?.length, { turnsElapsed: 1, turnsStated: 8 }, "dated by the later cast");
});

Deno.test("a cast reaching the other side is not read as standing on this one", () => {
    const standings = [composeCast({
        key: "allslow_per",
        amount: 14,
        skillId: 123,
        skillName: "Szadź",
        reach: "other-side",
    })];
    const figure = readFigure(standings, SLOW_BIT, new Map([[12, 1]]));
    assertStrictEquals(figure?.percent, null, "their own side's cast does not slow them");
    assertStrictEquals(figure?.length, null, "and dates nothing on them");
});

/**
 * The published help: _Na Postać rzucającą efekt, wartość przyspieszenia jest o połowę niższa._
 * What the half rounds to is stated nowhere, so the caster's own row carries no figure.
 */
Deno.test("the caster of a key the help halves for them gets no figure", () => {
    const standings = [composeCast({ key: "aura-sa_per", amount: 20, casterId: 12 })];
    const figure = readFigure(standings, SPEED_BIT, new Map([[12, 1]]));
    assertStrictEquals(figure?.percent, null, "half of twenty is not a figure anybody published");
    assertEquals(figure?.length, { turnsElapsed: 1, turnsStated: 8 }, "the length still holds");
});

Deno.test("a status no key is witnessed on gets no row at all", () => {
    const found = composeCarriedFigures({
        statuses: [{ combatantId: 12, bit: 3, turnsElapsed: 4 }],
        standings: [composeCast({ key: "aura-sa_per", amount: 20 })],
        roster: ROSTER,
        turnsByCombatantId: new Map([[12, 1]]),
        witnessed: WITNESSED,
    });
    assertEquals(found, [], "poisoning is moved by no key that states a figure");
});
