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
import { type AuraStanding } from "#/src/core/aura-standing.ts";
import { indexWitnessedKeyByBit, tallyCarriedFigures } from "#/src/core/carried-figure.ts";
import { indexCombatantRoster } from "#/src/core/combatant-roster.ts";
import { BUFF_BITS } from "#/tests/frozen-tables.ts";

const OURS = 1;
const THEIRS = 2;
const SPEED_BIT = 6;
const SLOW_BIT = 5;
const WITNESSED = indexWitnessedKeyByBit(BUFF_BITS);

const ROSTER = indexCombatantRoster([
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
    const found = tallyCarriedFigures({
        statuses: [{ combatantId: 12, bit, turnsElapsed: 4 }],
        standings,
        roster: ROSTER,
        turnsByCombatantId,
        witnessed: WITNESSED,
    });
    return found[0];
}

Deno.test("a cast reaching their side stands on the bearer while their own turns allow", () => {
    const figure = readFigure(
        [composeCast({ key: "aura-sa_per", amount: 20 })],
        SPEED_BIT,
        new Map([[12, 3]]),
    );
    assertStrictEquals(figure?.percent, 20, "one source, one figure, three of their turns in");
});

/**
 * ⚠️ **The failure this file was written for.** A standing is dropped on the **caster's** turns
 * (`develop ADR 0101`), so a cast whose caster stops taking them stands on for ever — and a row
 * dated from it read `21 z 8 tur` over `develop:captures/`. Held to the bearer's clock it goes when
 * it should, and takes its figure with it rather than leaving one the clock will not back.
 */
Deno.test("a cast the bearer has outrun says nothing", () => {
    const standings = [composeCast({ key: "aura-sa_per", amount: 20 })];
    const figure = readFigure(standings, SPEED_BIT, new Map([[12, 21]]));
    assertStrictEquals(figure?.percent, null, "no figure from a cast that is over for them");
});

/** **W5: zero is a boundary.** The turn a cast lands on is nought of the bearer's, not none. */
Deno.test("a cast that has just landed stands on the bearer", () => {
    const figure = readFigure(
        [composeCast({ key: "aura-sa_per", amount: 20 })],
        SPEED_BIT,
        new Map([[12, 0]]),
    );
    assertStrictEquals(figure?.percent, 20, "nought of eight is inside the eight");
});

Deno.test("two sources add", () => {
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
});

/**
 * The published help: _Na Postać rzucającą efekt, wartość przyspieszenia jest o połowę niższa._
 * What the half rounds to is stated nowhere, so the caster's own row carries no figure.
 */
Deno.test("the caster of a key the help halves for them gets no figure", () => {
    const standings = [composeCast({ key: "aura-sa_per", amount: 20, casterId: 12 })];
    const figure = readFigure(standings, SPEED_BIT, new Map([[12, 1]]));
    assertStrictEquals(figure?.percent, null, "half of twenty is not a figure anybody published");
});

Deno.test("a status no key is witnessed on gets no row at all", () => {
    const found = tallyCarriedFigures({
        statuses: [{ combatantId: 12, bit: 3, turnsElapsed: 4 }],
        standings: [composeCast({ key: "aura-sa_per", amount: 20 })],
        roster: ROSTER,
        turnsByCombatantId: new Map([[12, 1]]),
        witnessed: WITNESSED,
    });
    assertEquals(found, [], "poisoning is moved by no key that states a figure");
});

/**
 * Probes, every one: each was a mutation that lit nothing until it was written out here, because
 * no sample above reached the branch it broke.
 */
Deno.test("the two highest add, whatever order they arrived in, and a third does not", () => {
    const standings = [5, 20, 19].map((amount, at) =>
        composeCast({
            key: "aura-sa_per",
            amount,
            casterId: [11, 13, 11][at] ?? 11,
            skillId: 89 + at,
        })
    );
    const figure = readFigure(standings, SPEED_BIT, new Map([[12, 1]]));
    assertStrictEquals(figure?.percent, 39, "twenty and nineteen, and never the five");
});

Deno.test("a cast reaching the caster's side stands on nobody across the board", () => {
    const standings = [composeCast({ key: "aura-sa_per", amount: 20, casterId: 21 })];
    const figure = readFigure(standings, SPEED_BIT, new Map([[12, 1]]));
    assertStrictEquals(figure?.percent, null, "their side's haste does not hasten this one");
});

Deno.test("a slow cast from across the board stands on the bearer", () => {
    const standings = [composeCast({
        key: "allslow_per",
        amount: 14,
        casterId: 21,
        skillId: 123,
        skillName: "Szadź",
        reach: "other-side",
    })];
    const figure = readFigure(standings, SLOW_BIT, new Map([[12, 1]]));
    assertStrictEquals(figure?.percent, 14, "the other side's slow is the one that slows them");
});

Deno.test("a cast dated after the bearer's own count stands on nothing yet", () => {
    const standings = [composeCast({
        key: "aura-sa_per",
        amount: 20,
        turnsAtCastByCombatantId: new Map([[11, 0], [12, 5], [13, 0], [21, 0]]),
    })];
    const figure = readFigure(standings, SPEED_BIT, new Map([[12, 3]]));
    assertStrictEquals(figure?.percent, null, "a clock behind the cast is no clock inside it");
});
