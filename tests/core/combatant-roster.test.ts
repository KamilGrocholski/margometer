/**
 * The roster, over the fights that hold the cases worth holding.
 *
 * The ambiguous name is not invented for the test: one recording really does field two
 * combatants called the same thing, and one really does hold no snapshot at all.
 */

import { assert, assertEquals } from "@std/assert";
import {
    type Combatant,
    composeCombatantRoster,
    getCombatantIdByName,
} from "@/src/core/combatant-roster.ts";
import { getRecordedCombatants, getRecordingPaths } from "@/tests/recorded-fight.ts";

/** Two boars called `Odyniec`, and one player nobody shares a name with. */
const TWO_OF_A_NAME = "captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json";
/** One entry, no snapshot, and so no roster — the fight the panel can say nothing about. */
const NOBODY = "captures/2026-08-24-tempest-tropiciel-vs-centaury-auto-1786514810315-0.8.1.json";

function composeTestCombatant(id: number, name: string): Combatant {
    return { id, name, side: 1, profession: "w", level: 40, healthMaximum: 745 };
}

Deno.test("a name two combatants answer to resolves to nobody", () => {
    const roster = composeCombatantRoster(getRecordedCombatants(TWO_OF_A_NAME));
    assertEquals(getCombatantIdByName(roster, "Odyniec"), null, "a shared name names nobody");
    assertEquals(getCombatantIdByName(roster, "Gracz 1"), 482845, "a name of one resolves");
    assertEquals(getCombatantIdByName(roster, "Nikt"), null, "a name nobody holds resolves");
});

Deno.test("a roster of nothing holds nobody, and a roster of one holds one", () => {
    const empty = composeCombatantRoster(getRecordedCombatants(NOBODY));
    assertEquals(empty.byId.size, 0, "a recording with no snapshot states no combatant");
    assertEquals(getCombatantIdByName(empty, "Gracz 1"), null, "and resolves no name");
    const one = composeCombatantRoster([composeTestCombatant(1, "Gracz 1")]);
    assertEquals(one.byId.size, 1, "one combatant is a roster");
    assertEquals(getCombatantIdByName(one, "Gracz 1"), 1, "and answers to their own name");
});

Deno.test("the same person listed twice keeps their own name", () => {
    const twice = [composeTestCombatant(1, "Gracz 1"), composeTestCombatant(1, "Gracz 1")];
    const roster = composeCombatantRoster(twice);
    assertEquals(roster.byId.size, 1, "two sightings are one person");
    assertEquals(getCombatantIdByName(roster, "Gracz 1"), 1, "who still answers to their name");
});

Deno.test("a name that has gone ambiguous never comes back", () => {
    const listed = [
        composeTestCombatant(1, "Odyniec"),
        composeTestCombatant(2, "Odyniec"),
        composeTestCombatant(1, "Odyniec"),
    ];
    assertEquals(getCombatantIdByName(composeCombatantRoster(listed), "Odyniec"), null, "nobody");
});

Deno.test("every recording composes a roster of its own people", () => {
    const paths = getRecordingPaths();
    let largest = 0;
    let sidesSeen = 0;
    for (const path of paths) {
        const combatants = getRecordedCombatants(path);
        const roster = composeCombatantRoster(combatants);
        assertEquals(roster.byId.size, new Set(combatants.map((one) => one.id)).size, path);
        for (const [name, id] of roster.idByName) {
            if (id === null) continue;
            assertEquals(roster.byId.get(id)?.name, name, `${path}: a name resolves to its own`);
        }
        largest = Math.max(largest, roster.byId.size);
        sidesSeen = Math.max(sidesSeen, new Set(combatants.map((one) => one.side)).size);
    }
    assert(largest > 1, "the recordings hold fights of more than one person");
    assertEquals(sidesSeen, 2, "a fight has two sides, and neither is favoured here");
});
