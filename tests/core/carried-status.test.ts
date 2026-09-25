/**
 * What the mask says somebody is carrying, and for how many of their own turns.
 *
 * The walk is fed the way the session feeds it — a payload's events, then its masks — and what is
 * checked is the two things nothing else can: that a run keeps the turn it lit on across a
 * refresh, and that a payload saying nothing about somebody takes nothing away from them.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { BATTLE_EVENT, type BattleEvent } from "#/src/core/battle-event.ts";
import {
    type CarriedStatusWalk,
    composeCarriedStatuses,
    NO_CARRIED_STATUS_WALK,
    prepareCarriedStatuses,
} from "#/src/core/carried-status.ts";

const SPEED_UP = 6;
const POISONED = 3;
const SWOW_DOWN = 5;

Deno.test("a status states the turns its carrier took, and nobody else's", () => {
    let walk = NO_CARRIED_STATUS_WALK;
    walk = prepareCarriedStatuses(walk, [], new Map([[1, composeMask(SPEED_UP)], [2, 0]]));
    assertEquals(
        composeCarriedStatuses(walk),
        [{ combatantId: 1, bit: SPEED_UP, turnsElapsed: 0 }],
        "nothing of theirs has passed on the payload it lit in",
    );
    // Two turns of the carrier's and one of somebody else's: only their own are counted.
    walk = prepareCarriedStatuses(
        walk,
        [composeBlow(1), composeBlow(2), composeBlow(1)],
        new Map([[1, composeMask(SPEED_UP)]]),
    );
    assertEquals(
        composeCarriedStatuses(walk).map((one) => one.turnsElapsed),
        [2],
        "two turns of their own passed, and the blow of another combatant did not",
    );
});

/** A mask with those bits lit, which is how the payload states one. */
function composeMask(...bits: number[]): number {
    let mask = 0;
    for (const bit of bits) mask |= 1 << bit;
    return mask;
}

function composeBlow(actorId: number): BattleEvent {
    return {
        kind: BATTLE_EVENT.attack,
        actorId,
        targetId: 99,
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

/**
 * ⚠️ The trap this walk exists to avoid: a cast landing on a status already standing refreshes
 * nothing the mask can see, so re-reading the start would draw a length nobody carried.
 */
Deno.test("a status the game never let go of keeps the turn it lit on", () => {
    let walk = prepareCarriedStatuses(
        NO_CARRIED_STATUS_WALK,
        [],
        new Map([[1, composeMask(SPEED_UP)]]),
    );
    for (const at of [1, 2, 3]) {
        walk = prepareCarriedStatuses(
            walk,
            [composeBlow(1)],
            new Map([[1, composeMask(SPEED_UP)]]),
        );
        assertStrictEquals(
            composeCarriedStatuses(walk)[0]?.turnsElapsed,
            at,
            `at their ${at}th turn the run is still the one that lit`,
        );
    }
});

Deno.test("a status that goes out and lights again is a new run, counted from then", () => {
    let walk = NO_CARRIED_STATUS_WALK;
    walk = prepareCarriedStatuses(walk, [], new Map([[1, composeMask(SPEED_UP)]]));
    walk = prepareCarriedStatuses(walk, [composeBlow(1)], new Map([[1, 0]]));
    assertEquals(composeCarriedStatuses(walk), [], "a mask without the bit is carrying nothing");
    walk = prepareCarriedStatuses(walk, [composeBlow(1)], new Map([[1, composeMask(SPEED_UP)]]));
    assertEquals(
        composeCarriedStatuses(walk).map((one) => one.turnsElapsed),
        [0],
        "and the run that lights after it starts from the turn it lit on",
    );
});

/**
 * **W5: zero is a boundary**, and so is silence. A payload stating only what moved states no mask
 * for anybody else, and clearing them on that would take a status away every time one arrived.
 */
Deno.test("a payload saying nothing about somebody takes nothing away from them", () => {
    let walk = NO_CARRIED_STATUS_WALK;
    walk = prepareCarriedStatuses(walk, [], new Map([[1, composeMask(SPEED_UP)]]));
    walk = prepareCarriedStatuses(walk, [composeBlow(1)], new Map());
    assertEquals(
        composeCarriedStatuses(walk).map((one) => one.turnsElapsed),
        [1],
        "they go on carrying it, and their turn went on being counted",
    );
    walk = prepareCarriedStatuses(walk, [], new Map([[1, 0]]));
    assertEquals(composeCarriedStatuses(walk), [], "a mask that does state them is what lets go");
});

Deno.test("the rows are ordered by combatant and then by the client's own bit order", () => {
    const walk = prepareCarriedStatuses(
        NO_CARRIED_STATUS_WALK,
        [],
        new Map([[2, composeMask(SWOW_DOWN)], [1, composeMask(SPEED_UP, POISONED)]]),
    );
    assertEquals(
        composeCarriedStatuses(walk).map((one) => [one.combatantId, one.bit]),
        [[1, POISONED], [1, SPEED_UP], [2, SWOW_DOWN]],
        "whoever the payload named first is not what orders them",
    );
});

Deno.test("a mask with nothing lit carries nothing, which is a reading and not a silence", () => {
    const walk = prepareCarriedStatuses(NO_CARRIED_STATUS_WALK, [], new Map([[1, 0], [2, 0]]));
    const found = composeCarriedStatuses(walk);
    assertEquals(found, [], "nobody is carrying anything");
    assert(Array.isArray(found), "and the answer is a list rather than nothing at all");
});

/** Preparing touches nothing, which is what lets a session drop a payload that failed halfway. */
Deno.test("the walk handed in is left as it was, and the same input prepares the same walk", () => {
    const before = prepareCarriedStatuses(
        NO_CARRIED_STATUS_WALK,
        [composeBlow(1)],
        new Map([[1, composeMask(SPEED_UP)]]),
    );
    const kept = copyWalk(before);
    const events = [composeBlow(1), composeBlow(2)];
    const masks = new Map([[1, 0], [2, composeMask(POISONED)]]);
    const first = prepareCarriedStatuses(before, events, masks);
    const second = prepareCarriedStatuses(before, events, masks);
    assertEquals(copyWalk(first), copyWalk(second), "the same input prepares the same walk");
    assertEquals(copyWalk(before), kept, "and the walk it was prepared from is unchanged");
    assertEquals(copyWalk(NO_CARRIED_STATUS_WALK).turns, [], "as is the walk nothing started");
});

function copyWalk(walk: CarriedStatusWalk) {
    return {
        standing: { ...walk.standing },
        turns: [...walk.turnsByCombatantId],
        held: [...walk.heldByCombatantId].map(([id, held]) => [id, [...held]]),
    };
}

/** A status gone is a key removed and never an empty entry, which the carrier bound counts. */
Deno.test("a combatant whose mask lets everything go is no longer held at all", () => {
    let walk = prepareCarriedStatuses(
        NO_CARRIED_STATUS_WALK,
        [],
        new Map([[1, composeMask(SPEED_UP)], [2, composeMask(POISONED)]]),
    );
    assertEquals([...walk.heldByCombatantId.keys()], [1, 2], "two carriers while both hold one");
    walk = prepareCarriedStatuses(walk, [], new Map([[1, 0]]));
    assertEquals([...walk.heldByCombatantId.keys()], [2], "and one once the other lets go");
});
