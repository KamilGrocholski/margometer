/**
 * The roster, over the fights that hold the cases worth holding.
 *
 * The ambiguous name is not invented for the test: one recording really does field two
 * combatants called the same thing, and one really does hold no snapshot at all.
 */

import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import { AssertionError } from "@std/assert/assertion-error";
import {
    type Combatant,
    COMBATANTS_MAXIMUM,
    indexCombatantRoster,
    lookupCombatantIdByName,
} from "#/src/core/combatant-roster.ts";
import { lookupRecordedFight, readRecordedFights } from "#/tests/recorded-fights.ts";

/** Two boars called `Odyniec`, and one player nobody shares a name with. */
const TWO_OF_A_NAME = "captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json";
/** One entry, no snapshot, and so no roster: the fight the panel can say nothing about. */
const NOBODY = "captures/2026-08-24-tempest-tropiciel-vs-centaury-auto-1786514810315-0.8.1.json";

Deno.test("a name two combatants answer to resolves to nobody", () => {
    const roster = indexCombatantRoster(lookupRecordedFight(TWO_OF_A_NAME).combatants);
    assertEquals(lookupCombatantIdByName(roster, "Odyniec"), null, "a shared name names nobody");
    assertEquals(lookupCombatantIdByName(roster, "Gracz 1"), 482845, "a name of one resolves");
    assertEquals(lookupCombatantIdByName(roster, "Nikt"), null, "a name nobody holds resolves");
});

Deno.test("a roster of nothing holds nobody, and a roster of one holds one", () => {
    const empty = indexCombatantRoster(lookupRecordedFight(NOBODY).combatants);
    assertEquals(empty.byId.size, 0, "a recording with no snapshot states no combatant");
    assertEquals(lookupCombatantIdByName(empty, "Gracz 1"), null, "and resolves no name");
    const one = indexCombatantRoster([composeTestCombatant(1, "Gracz 1")]);
    assertEquals(one.byId.size, 1, "one combatant is a roster");
    assertEquals(lookupCombatantIdByName(one, "Gracz 1"), 1, "and answers to their own name");
});

function composeTestCombatant(id: number, name: string): Combatant {
    return { id, name, side: 1, profession: "w", level: 40, healthMaximum: 745 };
}

Deno.test("a cast naming one combatant twice is a broken invariant, not a second sighting", () => {
    const twice = [composeTestCombatant(1, "Gracz 1"), composeTestCombatant(1, "Gracz 1")];
    assertThrows(
        () => indexCombatantRoster(twice),
        AssertionError,
        "a cast names each combatant once",
    );
    const distinct = [composeTestCombatant(1, "Gracz 1"), composeTestCombatant(2, "Gracz 2")];
    assertStrictEquals(indexCombatantRoster(distinct).byId.size, 2, "two ids are two people");
});

Deno.test("a cast is held up to its stated bound, and refused one past it", () => {
    const full = indexCombatantRoster(composeTestCast(COMBATANTS_MAXIMUM));
    assertStrictEquals(full.byId.size, COMBATANTS_MAXIMUM, "a full cast is a roster");
    assertThrows(
        () => indexCombatantRoster(composeTestCast(COMBATANTS_MAXIMUM + 1)),
        AssertionError,
        "a cast stays inside its stated bound",
    );
});

function composeTestCast(count: number): Combatant[] {
    return Array.from({ length: count }, (_, index) => composeTestCombatant(index + 1, "Gracz"));
}

Deno.test("a name that has gone ambiguous never comes back", () => {
    const listed = [
        composeTestCombatant(1, "Odyniec"),
        composeTestCombatant(2, "Odyniec"),
        composeTestCombatant(3, "Odyniec"),
    ];
    assertEquals(lookupCombatantIdByName(indexCombatantRoster(listed), "Odyniec"), null, "nobody");
});

Deno.test("every recording composes a roster of its own people", () => {
    let largest = 0;
    let sidesSeen = 0;
    for (const fight of readRecordedFights()) {
        const combatants = fight.combatants;
        const roster = indexCombatantRoster(combatants);
        assertEquals(roster.byId.size, new Set(combatants.map((one) => one.id)).size, fight.path);
        for (const [name, id] of roster.idByName) {
            if (id === null) continue;
            assertEquals(
                roster.byId.get(id)?.name,
                name,
                `${fight.path}: a name resolves to its own`,
            );
        }
        largest = Math.max(largest, roster.byId.size);
        sidesSeen = Math.max(sidesSeen, new Set(combatants.map((one) => one.side)).size);
    }
    assert(largest > 1, "the recordings hold fights of more than one person");
    assertEquals(sidesSeen, 2, "a fight has two sides, and neither is favoured here");
});
