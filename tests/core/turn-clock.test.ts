/**
 * The one clock turns are counted on: which events open a turn, and what the next one is read
 * against. The events are written out in the shape the decoder hands over.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { type AttackEvent, BATTLE_EVENT, type BattleEvent } from "#/src/core/battle-event.ts";
import { composeTurnStanding, lookupTurnOpener, NO_TURN_STANDING } from "#/src/core/turn-clock.ts";

const ANNOUNCEMENT: BattleEvent = {
    kind: BATTLE_EVENT.skillUsed,
    actorId: 1,
    targetId: 9,
    actorHealthPercent: null,
    targetHealthPercent: null,
    skillName: "Cios",
    skillId: null,
    declared: [],
};

Deno.test("an announcement opens a turn, and the blows it sends open none", () => {
    const openers = lookupOpeners([ANNOUNCEMENT, composeBlow(1, true), composeBlow(1, true)]);
    assertEquals(openers, [1, null, null], "one turn, however many blows the skill sent");
});

/** Every event walked in order, with the turn each one opened. */
function lookupOpeners(events: readonly BattleEvent[]): (number | null)[] {
    let standing = NO_TURN_STANDING;
    const openers: (number | null)[] = [];
    for (const event of events) {
        openers.push(lookupTurnOpener(event, standing));
        standing = composeTurnStanding(event, standing);
    }
    return openers;
}

function composeBlow(actorId: number, isAnnounced: boolean): AttackEvent {
    const announced = isAnnounced ? { skillName: "Cios", skillId: null, actorId } : null;
    return {
        kind: BATTLE_EVENT.attack,
        actorId,
        targetId: 9,
        actorHealthPercent: null,
        targetHealthPercent: null,
        raw: [{ element: "dmg", amount: 1 }],
        applied: [{ element: "dmg", amount: 1 }],
        prevented: [],
        destroyed: [],
        procs: [],
        declared: [],
        announced,
    };
}

Deno.test("a plain blow opens a turn, and an extra attack straight after it does not", () => {
    const struck = lookupOpeners([composeBlow(1, false), composeBlow(2, false)]);
    assertEquals(struck, [1, 2], "two combatants, two turns");
    const extra = lookupOpeners([ANNOUNCEMENT, composeBlow(1, true), composeBlow(1, false)]);
    assertEquals(extra, [1, null, null], "the unannounced blow after its own skill is its extra");
    const extras = lookupOpeners([
        ANNOUNCEMENT,
        composeBlow(1, true),
        composeBlow(1, false),
        composeBlow(1, false),
    ]);
    assertEquals(extras, [1, null, null, null], "and so is each extra after it, however many");
    const again = lookupOpeners([composeBlow(1, false), composeBlow(1, false)]);
    assertEquals(again, [1, 1], "and a plain blow after a plain blow is a turn of its own");
});

Deno.test("a step opens a turn, and a preparation only where its combatant has not acted", () => {
    assertEquals(lookupOpeners([composeDeclaration(3, "step")]), [3], "a step is a turn");
    assertEquals(lookupOpeners([composeDeclaration(3, "prepare")]), [3], "so is a preparation");
    const beside = lookupOpeners([composeBlow(3, false), composeDeclaration(3, "prepare")]);
    assertEquals(beside, [3, null], "but one stated beside its own action rides it");
    const other = lookupOpeners([composeBlow(4, false), composeDeclaration(3, "prepare")]);
    assertEquals(other, [4, 3], "and one after somebody else's is a turn");
    assertEquals(lookupOpeners([composeDeclaration(3, "txt")]), [null], "a log line is none");
});

function composeDeclaration(combatantId: number, effect: string): BattleEvent {
    const declared = [{ effect, amount: null, text: null }];
    return { kind: BATTLE_EVENT.declaration, combatantId, healthPercent: null, declared };
}

Deno.test("an event that is nobody's action ends both halves of the standing", () => {
    const outcome: BattleEvent = {
        kind: BATTLE_EVENT.fightOutcome,
        result: "won",
        combatantNames: ["Gracz 1"],
    };
    const struck = composeTurnStanding(composeBlow(1, true), NO_TURN_STANDING);
    assertEquals(struck, { strikingId: 1, actingId: 1 }, "an announced blow is mid-strike");
    assertStrictEquals(composeTurnStanding(outcome, struck), NO_TURN_STANDING, "and it ends");
});

Deno.test("a declaration between an action and its preparation keeps who acted", () => {
    const openers = lookupOpeners([
        composeBlow(3, false),
        composeDeclaration(0, "txt"),
        composeDeclaration(3, "prepare"),
    ]);
    assertEquals(openers, [3, null, null], "the preparation still rides the action before it");
});
