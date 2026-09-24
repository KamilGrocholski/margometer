/**
 * The window beside the panel, as a reading: the two sides counted apart, and the states a fight
 * can leave it in.
 *
 * `develop:tests/ui/panel-standing.test.ts`, less what only a drawn window can show — the cards,
 * the presses, the fold and the rows a sheet styles. Where a case there asserted a drawn cell the
 * reading already carries, the claim is asserted here on the reading.
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import type { ProvocationStanding } from "@/src/core/aura-standing.ts";
import { CHARGED_SKILL_STATE, type ChargedSkillStanding } from "@/src/core/charged-skill.ts";
import { COMBATANTS_MAXIMUM, indexCombatantRoster } from "@/src/core/combatant-roster.ts";
import type { TurnStatement } from "@/src/core/fight-session.ts";
import { lookupColourForProfession, SIGNAL } from "@/src/ui/panel-palette.ts";
import { SIDE_PART } from "@/src/ui/panel-reading.ts";
import {
    presentStanding,
    PROVOKED_MAXIMUM,
    STANDING_TURN_STATE,
    type StandingTurn,
} from "@/src/ui/panel-standing.ts";
import { getWordsForTurnState, PANEL_WORDS } from "@/src/ui/panel-words.ts";

const OURS = 1;
const THEIRS = 2;

const ROSTER = indexCombatantRoster([
    { id: 11, name: "Gracz 1", side: OURS, profession: "m", level: 40, healthMaximum: 100 },
    { id: 12, name: "Gracz 2", side: OURS, profession: "w", level: 40, healthMaximum: 100 },
    { id: 21, name: "Renegat 1", side: THEIRS, profession: "t", level: 40, healthMaximum: 100 },
]);

function composeProvocation(
    provokedId: number,
    casterId: number,
    over: Partial<ProvocationStanding> = {},
): ProvocationStanding {
    return {
        provokedId,
        skillId: 188,
        skillName: "Wyzywający okrzyk",
        casterId,
        turnsElapsed: 2,
        // The shout's own three and not the five its debuff runs: one okrzyk states both, and a
        // fixture carrying the wrong one of them reads as the bug `develop ADR 0097` was about.
        turnsStated: 3,
        ...over,
    };
}

/** A fight underway, numbered or not — what the window is handed wherever the turn is not it. */
function composeTurn(
    statement: TurnStatement | null,
    over: Partial<StandingTurn> = {},
): StandingTurn {
    return { statement, isOver: false, isOnAuto: false, ...over };
}

function composeCharge(over: Partial<ChargedSkillStanding> = {}): ChargedSkillStanding {
    return {
        combatantId: 21,
        skillName: "Lodowe Pandemonium",
        turnsElapsed: 2,
        turnsStated: 4,
        state: CHARGED_SKILL_STATE.charging,
        endedAtOrdinal: null,
        ...over,
    };
}

Deno.test("whoever holds the turn is a person, hue, side and all", () => {
    // ⚠️ The `Teraz` row drew a bare name: no cap and no rule, so the one character a reader is
    // watching hardest was the one the window said least about (`develop ADR 0065`).
    const reading = presentStanding(
        [],
        [],
        ROSTER,
        OURS,
        composeTurn({ ordinal: 48, combatantId: 21 }),
    );
    assertEquals(reading.holder, {
        name: "Renegat 1",
        colour: lookupColourForProfession("t"),
        sidePart: SIDE_PART.opposing,
    }, "the roster places whoever holds it, in their own hue and on their own side");
    // **W5: zero is a boundary.** The same turn, on a fight with no seat to read from: the hue
    // stands, because it is theirs, and the side does not, because nothing can place them.
    const seatless = presentStanding(
        [],
        [],
        ROSTER,
        null,
        composeTurn({ ordinal: 48, combatantId: 21 }),
    );
    assertStrictEquals(seatless.holder?.colour, lookupColourForProfession("t"), "the hue stands");
    assertStrictEquals(seatless.holder?.sidePart, SIDE_PART.nobody, "and no side does");
});

/**
 * `develop ADR 0072`. Both halves of the boundary: the same statement stands while the fight is
 * being fought, and stands on nothing the moment the game stops numbering — which it does when the
 * fight ends and when the reader hands it over on the auto key.
 */
Deno.test("a turn the game has stopped numbering is not stated, and the state says why", () => {
    const stated = { ordinal: 267, combatantId: 21 };
    const underway = presentStanding([], [], ROSTER, OURS, composeTurn(stated));
    assertStrictEquals(underway.turnState, STANDING_TURN_STATE.held, "a fight being numbered");
    assertStrictEquals(underway.turnOrdinal, 267, "so the ordinal is stated");
    assertEquals(underway.holder?.name, "Renegat 1", "and whoever the game numbered it for");

    const after = presentStanding([], [], ROSTER, OURS, composeTurn(stated, { isOver: true }));
    assertStrictEquals(after.turnState, STANDING_TURN_STATE.afterFight, "an ended fight");
    assertStrictEquals(after.turnOrdinal, null, "so the last ordinal is not stated as now");
    assertStrictEquals(after.holder, null, "and nobody is holding it");

    const running = presentStanding([], [], ROSTER, OURS, composeTurn(stated, { isOnAuto: true }));
    assertStrictEquals(running.turnState, STANDING_TURN_STATE.onAuto, "a fight the game runs");
    assertStrictEquals(running.turnOrdinal, null, "so what it stated before is not stated either");

    // Both are true of every fight fought on the auto key, and only one of them says why there
    // is no turn to draw.
    const both = presentStanding(
        [],
        [],
        ROSTER,
        OURS,
        composeTurn(stated, { isOver: true, isOnAuto: true }),
    );
    assertStrictEquals(both.turnState, STANDING_TURN_STATE.onAuto, "so it says that");
});

/** **W5**: the same two states on a fight the game never numbered at all. */
Deno.test("a fight nobody numbered says what it is, and never that it went unread", () => {
    const unread = presentStanding([], [], ROSTER, OURS, composeTurn(null));
    assertStrictEquals(unread.turnState, STANDING_TURN_STATE.unread, "this read none");
    const auto = presentStanding(
        [],
        [],
        ROSTER,
        OURS,
        composeTurn(null, { isOver: true, isOnAuto: true }),
    );
    assertStrictEquals(auto.turnState, STANDING_TURN_STATE.onAuto, "and the game stated none");
    assert(
        getWordsForTurnState(STANDING_TURN_STATE.onAuto) !==
            getWordsForTurnState(STANDING_TURN_STATE.unread),
        "which are two answers, said in two sentences",
    );
});

Deno.test("a shout stands under whoever is holding it, and the turns are the held's", () => {
    const reading = presentStanding(
        [composeProvocation(21, 11)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    assertEquals(reading.provoked, [{
        casterId: 11,
        casterName: "Gracz 1",
        skillId: 188,
        skillName: "Wyzywający okrzyk",
        casterColour: lookupColourForProfession("m"),
        casterSidePart: SIDE_PART.reader,
        provoked: [{
            provokedId: 21,
            name: "Renegat 1",
            colour: lookupColourForProfession("t"),
            sidePart: SIDE_PART.opposing,
            turnsElapsed: 2,
            turnsStated: 3,
        }],
    }], "whoever is holding, named with the okrzyk, and under them whom, with the length");
});

/**
 * The corpus holds no moment where one caster shouted both okrzyki — `develop ADR 0067` measured
 * 0 — so this is constructed. Fold by the caster and one group would stand under one name for two
 * casts. `develop ADR 0097`.
 */
Deno.test("one caster shouting both okrzyki is two groups, each under its own name", () => {
    const other = { skillId: 25, skillName: "Prowokujący okrzyk" };
    const reading = presentStanding(
        [composeProvocation(21, 11), composeProvocation(12, 11, other)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    assertEquals(
        reading.provoked.map((one) => [one.casterName, one.skillName]),
        [["Gracz 1", "Wyzywający okrzyk"], ["Gracz 1", "Prowokujący okrzyk"]],
        "one group per cast, in the order the fight named them",
    );
});

Deno.test("one cast holding two characters states a length for each of them", () => {
    // The case the fold exists for. `develop:captures/` holds it once, in the fight written from
    // side 2: one shout naming two players, measured 2026-09-09.
    const reading = presentStanding(
        [composeProvocation(11, 21), composeProvocation(12, 21)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    assertStrictEquals(reading.provoked.length, 1, "one caster, so one group");
    // `develop ADR 0103`: the figure is on whoever is carrying it, and two of them are not the
    // same turns in.
    assertEquals(
        reading.provoked[0]?.provoked.map((one) => [one.name, one.turnsElapsed, one.turnsStated]),
        [["Gracz 1", 2, 3], ["Gracz 2", 2, 3]],
        "holding both of them, one figure per character held",
    );
});

Deno.test("two casters holding apart stand apart, in the order the fight named them", () => {
    const reading = presentStanding(
        [composeProvocation(21, 12), composeProvocation(11, 21)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    assertEquals(
        reading.provoked.map((one) => one.casterName),
        ["Gracz 2", "Renegat 1"],
        "a group first named stands higher, so none moves under the hand",
    );
});

Deno.test("a holder the roster cannot place is still stated, and says so", () => {
    const reading = presentStanding(
        [composeProvocation(21, -1)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    // **A11**: this layer asserts nothing, so a caster nobody can place falls back rather than
    // taking the section down with it.
    const group = reading.provoked[0];
    assertExists(group, "the shout is still holding somebody, whoever threw it");
    assertStrictEquals(group.casterName, PANEL_WORDS.withoutActor, "under the words for nobody");
    assertStrictEquals(group.casterSidePart, SIDE_PART.nobody, "and on no side");
    assertStrictEquals(group.provoked[0]?.name, "Renegat 1", "over whoever they hold");
});

/**
 * ⚠️ **The bound is counted off what the game can put up, and the point is that nobody types it.**
 * It was once a figure off the corpus, and it was short: 12 where a fabricated ten a side stands
 * 20. A test over a derived bound cannot fail while it stays derived (**A12**), so what it holds
 * is the derivation: a literal typed back in reddens it.
 */
Deno.test("the provoked bound covers everybody, which is what two shouts can hold", () => {
    assert(
        PROVOKED_MAXIMUM >= COMBATANTS_MAXIMUM,
        `two shouts hold a board between them, and ${PROVOKED_MAXIMUM} does not cover ` +
            `${COMBATANTS_MAXIMUM}`,
    );
});

Deno.test("the provoked stop at their stated maximum, and one under it is stated whole", () => {
    // **W5**: the bound is a boundary, so the row below it is asserted beside it. The clamp is
    // what stands in for an assertion here, because this layer asserts nothing (**A11**).
    const many: ProvocationStanding[] = [];
    for (let at = 0; at < PROVOKED_MAXIMUM + 4; at += 1) many.push(composeProvocation(21, 11));
    // Counted in characters and not in groups: the clamp stands before the fold, so the bound is
    // on the people the section draws however few casts they arrive under (`develop ADR 0067`).
    const countHeld = (reading: ReturnType<typeof presentStanding>) =>
        reading.provoked.reduce((sum, one) => sum + one.provoked.length, 0);
    const over = presentStanding(many, [], ROSTER, OURS, composeTurn(null));
    assertStrictEquals(countHeld(over), PROVOKED_MAXIMUM, "past it, the rest are dropped");
    const under = presentStanding(
        many.slice(0, PROVOKED_MAXIMUM - 1),
        [],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    assertStrictEquals(countHeld(under), PROVOKED_MAXIMUM - 1, "one below it, all of them");
});

Deno.test("a charge wears the hue of whoever is making it, and says which side", () => {
    const reading = presentStanding([], [composeCharge()], ROSTER, OURS, composeTurn(null));
    const charged = reading.chargedSkills[0];
    assertExists(charged, "the band states the charge the fight states");
    assertStrictEquals(charged.colour, lookupColourForProfession("t"), "in the maker's own hue");
    assertStrictEquals(charged.sidePart, SIDE_PART.opposing, "and says which side is making it");
    assertStrictEquals(charged.name, "Renegat 1", "and who, for the card");
    assertEquals([charged.turnsElapsed, charged.turnsStated], [2, 4], "and the game's figures");
});

Deno.test("a charge that is over wears no hue, and states which end it came to", () => {
    for (const state of [CHARGED_SKILL_STATE.struck, CHARGED_SKILL_STATE.broken]) {
        const reading = presentStanding(
            [],
            [composeCharge({ state, endedAtOrdinal: 12 })],
            ROSTER,
            OURS,
            composeTurn(null),
        );
        const charged = reading.chargedSkills[0];
        assertExists(charged, `a ${state} charge is still stated for its turn`);
        assertStrictEquals(charged.colour, SIGNAL.unknown, "in no profession's hue");
        assertStrictEquals(charged.state, state, "and says which end it came to");
    }
});

Deno.test("a fight charging nothing states no band at all", () => {
    const reading = presentStanding([], [], ROSTER, OURS, composeTurn(null));
    assertEquals(reading.chargedSkills, [], "nothing is being made ready");
});

/**
 * **W5: zero is a boundary.** A shout lands on the caster's turn, so between it and the held
 * character's next turn nothing of theirs has passed — the figure is `0` and the row stands, which
 * is a different state from the row being gone.
 */
Deno.test("a character shouted at before they have moved is held, at none of their turns", () => {
    const reading = presentStanding(
        [composeProvocation(21, 11, { turnsElapsed: 0 })],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    assertStrictEquals(reading.provoked.length, 1, "the shout holds them from the moment it lands");
    const held = reading.provoked[0]?.provoked[0];
    assertExists(held, "and they stand under whoever is holding them");
    assertEquals([held.turnsElapsed, held.turnsStated], [0, 3], "with all three still to run");
});

/**
 * A probe for **W4**: nothing above made ready more than one blow at once, so the band's own
 * bound moved to one with nothing going red. Four is past every charge the corpus has held at
 * once, and past what `src/core/charged-skill.ts` clamps to; **W5** puts the row at it beside the
 * row past it.
 */
Deno.test("the band stops at its stated maximum, and one at it is stated whole", () => {
    const charges = [11, 12, 21, 11, 12].map((combatantId, at) =>
        composeCharge({ combatantId, skillName: `Cios ${at}` })
    );
    const over = presentStanding([], charges, ROSTER, OURS, composeTurn(null));
    assertEquals(
        over.chargedSkills.map((one) => one.skillName),
        ["Cios 0", "Cios 1", "Cios 2", "Cios 3"],
        "past it, the rest are dropped, in the order the fight named them",
    );
    const at = presentStanding([], charges.slice(0, 4), ROSTER, OURS, composeTurn(null));
    assertStrictEquals(at.chargedSkills.length, 4, "at it, all of them");
    const nameless = presentStanding(
        [],
        [composeCharge({ skillName: "" })],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    assertEquals(nameless.chargedSkills, [], "and a charge naming no blow is not a row");
});
