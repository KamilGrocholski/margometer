/**
 * What the mask says somebody is carrying, and for how many of their own turns.
 *
 * The walk is fed the way the running fight feeds it — a payload's events, then its masks — and
 * what is checked is the two things nothing else can: that a run keeps the turn it lit on across
 * a refresh, and that a payload saying nothing about somebody takes nothing away from them.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
    addPayloadToCarriedStatuses,
    composeCarriedStatuses,
    composeCarriedStatusWalk,
    TURNS_STATED_BY_STATUS_NAME,
} from "@/src/core/carried-status.ts";
import { FROZEN_BUFF_BITS } from "@/frozen/buff-bits.ts";

const SPEED_UP = 6;
const POISONED = 3;
const SWOW_DOWN = 5;

function composeBlow(actorId: number): BattleEvent {
    return {
        kind: "attack",
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

/** A mask with those bits lit, which is how the payload states one. */
function composeMask(...bits: number[]): number {
    let mask = 0;
    for (const bit of bits) mask |= 1 << bit;
    return mask;
}

Deno.test("a status states the turns its carrier took, and nobody else's", () => {
    const walk = composeCarriedStatusWalk();
    addPayloadToCarriedStatuses(walk, [], new Map([[1, composeMask(SPEED_UP)], [2, 0]]));
    assertEquals(
        composeCarriedStatuses(walk),
        [{ combatantId: 1, bit: SPEED_UP, turnsElapsed: 0 }],
        "nothing of theirs has passed on the payload it lit in",
    );
    // Two turns of the carrier's and three of somebody else's: only their own are counted.
    addPayloadToCarriedStatuses(
        walk,
        [composeBlow(1), composeBlow(2), composeBlow(1)],
        new Map([
            [1, composeMask(SPEED_UP)],
        ]),
    );
    assertEquals(
        composeCarriedStatuses(walk).map((one) => one.turnsElapsed),
        [2],
        "two turns of their own passed, and the three blows of another combatant did not",
    );
});

/**
 * ⚠️ The trap this walk exists to avoid: a cast landing on a status already standing refreshes
 * nothing the mask can see, so re-reading the start would draw a length nobody carried.
 */
Deno.test("a status the game never let go of keeps the turn it lit on", () => {
    const walk = composeCarriedStatusWalk();
    addPayloadToCarriedStatuses(walk, [], new Map([[1, composeMask(SPEED_UP)]]));
    for (const at of [1, 2, 3]) {
        addPayloadToCarriedStatuses(walk, [composeBlow(1)], new Map([[1, composeMask(SPEED_UP)]]));
        assertStrictEquals(
            composeCarriedStatuses(walk)[0]?.turnsElapsed,
            at,
            `at their ${at}th turn the run is still the one that lit`,
        );
    }
});

Deno.test("a status that goes out and lights again is a new run, counted from then", () => {
    const walk = composeCarriedStatusWalk();
    addPayloadToCarriedStatuses(walk, [], new Map([[1, composeMask(SPEED_UP)]]));
    addPayloadToCarriedStatuses(walk, [composeBlow(1)], new Map([[1, 0]]));
    assertEquals(composeCarriedStatuses(walk), [], "a mask without the bit is carrying nothing");
    addPayloadToCarriedStatuses(walk, [composeBlow(1)], new Map([[1, composeMask(SPEED_UP)]]));
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
    const walk = composeCarriedStatusWalk();
    addPayloadToCarriedStatuses(walk, [], new Map([[1, composeMask(SPEED_UP)]]));
    addPayloadToCarriedStatuses(walk, [composeBlow(1)], new Map());
    assertEquals(
        composeCarriedStatuses(walk).map((one) => one.turnsElapsed),
        [1],
        "they go on carrying it, and their turn went on being counted",
    );
    addPayloadToCarriedStatuses(walk, [], new Map([[1, 0]]));
    assertEquals(composeCarriedStatuses(walk), [], "a mask that does state them is what lets go");
});

Deno.test("the rows are ordered by combatant and then by the client's own bit order", () => {
    const walk = composeCarriedStatusWalk();
    addPayloadToCarriedStatuses(
        walk,
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
    const walk = composeCarriedStatusWalk();
    addPayloadToCarriedStatuses(walk, [], new Map([[1, 0], [2, 0]]));
    const found = composeCarriedStatuses(walk);
    assertEquals(found, [], "nobody is carrying anything");
    assert(Array.isArray(found), "and the answer is a list rather than nothing at all");
});

/**
 * **Read both ways, because the two failures look nothing alike.** A name the client no longer
 * registers goes on stating a length for a bit nobody has, silently; a bit whose length the help
 * states and the table has lost draws no ceiling, equally silently. Neither is loud, so both are
 * asked for here.
 *
 * ⚠️ **The pair is named rather than counted.** A test reading the table's own size back
 * passes whatever the table holds, which is the shape that lets a third entry in unread.
 */
Deno.test("every status the help dates is one the client registers, and only those two are", () => {
    const dated = Object.keys(TURNS_STATED_BY_STATUS_NAME).sort();
    assertEquals(dated, ["poisoned", "wound"], "trucizna and głęboka rana, and nothing else");
    for (const name of dated) {
        assert(
            FROZEN_BUFF_BITS.bits.includes(name as (typeof FROZEN_BUFF_BITS.bits)[number]),
            `${name} is a status the client registers`,
        );
    }
});

/**
 * The figure itself, against the published help: _Są aplikowane na 5 tur_ for both weapon
 * attributes, and Głęboka rana's own extension capped at the same five (article `view,372`,
 * read 2026-09-22). A ceiling that drifts off that sentence is a number this repository invented.
 */
Deno.test("the length the help states is the length the table carries", () => {
    assertStrictEquals(TURNS_STATED_BY_STATUS_NAME.poisoned, 5, "trucizna runs five turns");
    assertStrictEquals(TURNS_STATED_BY_STATUS_NAME.wound, 5, "and głęboka rana the same five");
});
