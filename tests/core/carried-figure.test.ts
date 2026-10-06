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
import { type AuraStanding, replayAuraStandings } from "#/src/core/aura-standing.ts";
import type { BattleEvent } from "#/src/core/battle-event.ts";
import { indexKeyByStatusBit, tallyCarriedFigures } from "#/src/core/carried-figure.ts";
import { indexCombatantRoster } from "#/src/core/combatant-roster.ts";
import type { FightView } from "#/src/core/fight-session.ts";
import { addEventTurns, NO_TURN_STANDING } from "#/src/core/turn-clock.ts";
import { FROZEN_BUFF_BITS } from "#/frozen/buff-bits.ts";
import { STATED_SKILLS } from "#/tests/frozen-tables.ts";

const OURS = 1;
const THEIRS = 2;
const SPEED_BIT = 6;
const SLOW_BIT = 5;
const WITNESSED = indexKeyByStatusBit(FROZEN_BUFF_BITS.bits);

/** `Szadź` as the frozen table dates it, eight turns, cast from across the board. */
const FROST_SKILL_ID = 123;
const FROST_CASTER_ID = 21;
const BEARER_ID = 12;

const ROSTER = indexCombatantRoster([
    { id: 11, name: "Gracz 1", side: OURS, profession: "w", level: 40, healthMaximum: 100 },
    { id: 12, name: "Gracz 2", side: OURS, profession: "t", level: 40, healthMaximum: 100 },
    { id: 13, name: "Gracz 3", side: OURS, profession: "p", level: 40, healthMaximum: 100 },
    { id: 21, name: "Renegat 1", side: THEIRS, profession: "m", level: 40, healthMaximum: 100 },
]);

Deno.test("a cast reaching their side stands on the bearer while their own turns allow", () => {
    const figure = readFigure(
        [composeCast({ key: "aura-sa_per", amount: 20 })],
        SPEED_BIT,
        new Map([[12, 3]]),
    );
    assertStrictEquals(figure?.percent, 20, "one source, one figure, three of their turns in");
});

function readFigure(
    casts: readonly AuraStanding[],
    bit: number,
    turnsByCombatantId: ReadonlyMap<number, number>,
) {
    const figures = tallyCarriedFigures({
        statuses: [{ combatantId: 12, bit, turnsElapsed: 4 }],
        casts,
        roster: ROSTER,
        turnsByCombatantId,
        keyByStatusBit: WITNESSED,
    });
    return figures[0];
}

function composeCast(over: Partial<AuraStanding> & { key: string; amount: number }): AuraStanding {
    return {
        skillId: 89,
        skillName: "Podwójny dech",
        casterId: 11,
        turnsElapsed: 0,
        turnsStated: 8,
        reach: "casters-side",
        shoutTargetId: null,
        amountByKey: new Map([[over.key, over.amount]]),
        turnsAtCastByCombatantId: new Map([[11, 0], [12, 0], [13, 0], [21, 0]]),
        ...over,
    };
}

/**
 * ⚠️ **The failure this file was written for.** A cast whose caster stops taking turns never runs
 * out on the caster's clock — and a row dated from such a cast read `21 z 8 tur` over `captures/`.
 * Held to the bearer's clock it goes when it should, and takes its figure with it rather than
 * leaving one the clock will not back.
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
 * The published help gives whoever cast it half the speed-up. What the half rounds to is stated
 * nowhere, so the caster's own row carries no figure.
 */
Deno.test("the caster of a key the help halves for them gets no figure", () => {
    const standings = [composeCast({ key: "aura-sa_per", amount: 20, casterId: 12 })];
    const figure = readFigure(standings, SPEED_BIT, new Map([[12, 1]]));
    assertStrictEquals(figure?.percent, null, "half of twenty is not a figure anybody published");
});

/** Every dated cast is handed in, so the bearer's own is asked about only while it stands on them. */
Deno.test("a caster whose own haste has run out on them takes another's figure whole", () => {
    const standings = [
        composeCast({ key: "aura-sa_per", amount: 20, casterId: 12 }),
        composeCast({
            key: "aura-sa_per",
            amount: 20,
            turnsAtCastByCombatantId: new Map([[11, 8], [12, 8], [13, 8], [21, 8]]),
        }),
    ];
    const figure = readFigure(standings, SPEED_BIT, new Map([[12, 9]]));
    assertStrictEquals(figure?.percent, 20, "their own ran out at eight, the other is one turn in");
});

Deno.test("a status no key is witnessed on gets no row at all", () => {
    const figures = tallyCarriedFigures({
        statuses: [{ combatantId: 12, bit: 3, turnsElapsed: 4 }],
        casts: [composeCast({ key: "aura-sa_per", amount: 20 })],
        roster: ROSTER,
        turnsByCombatantId: new Map([[12, 1]]),
        keyByStatusBit: WITNESSED,
    });
    assertEquals(figures, [], "poisoning is moved by no key that states a figure");
});

/**
 * Probes, every one: each was a mutation that lit nothing until it was written out here, because
 * no sample above reached the branch it broke.
 */
Deno.test("the two highest add, whatever order they arrived in, and a third does not", () => {
    const standings = [5, 20, 19].map((amount, castIndex) =>
        composeCast({
            key: "aura-sa_per",
            amount,
            casterId: [11, 13, 11][castIndex] ?? 11,
            skillId: 89 + castIndex,
        })
    );
    const figure = readFigure(standings, SPEED_BIT, new Map([[12, 1]]));
    assertStrictEquals(figure?.percent, 39, "twenty and nineteen, and never the five");
});

/**
 * A probe: no key was ever held twice by one combatant over `captures/`
 * (`docs/auras-standing.md`), so only this sample tells a source from a cast.
 */
Deno.test("two casts by one caster are one source, at the higher of the two", () => {
    const byOneCaster = [
        composeCast({ key: "aura-sa_per", amount: 14, skillId: 123 }),
        composeCast({ key: "aura-sa_per", amount: 12, skillId: 298 }),
    ];
    const alone = readFigure(byOneCaster, SPEED_BIT, new Map([[12, 1]]));
    assertStrictEquals(alone?.percent, 14, "one character's two casts stand as the higher one");
    const another = composeCast({ key: "aura-sa_per", amount: 10, casterId: 13, skillId: 89 });
    const beside = readFigure([...byOneCaster, another], SPEED_BIT, new Map([[12, 1]]));
    assertStrictEquals(beside?.percent, 24, "and the second source is another character's");
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

/**
 * ⚠️ **The failure the bearer's clock was chosen for**: the side-wide standings drop a cast on its
 * caster's turns, so a caster who took eight turns while the slowed took six ended a `Szadź` the
 * bearer still carried, and the row stated no figure (`docs/auras-standing.md`).
 */
Deno.test("a caster who outruns the bearer leaves the figure standing on the bearer", () => {
    const events = [
        composeBlowBy(BEARER_ID),
        composeFrostCast(),
        ...Array.from({ length: 8 }, () => composeBlowBy(FROST_CASTER_ID)),
        ...Array.from({ length: 6 }, () => composeBlowBy(BEARER_ID)),
    ];
    const figure = replayFrostFigure(events);
    assertStrictEquals(
        figure?.percent,
        14,
        "six of the bearer's eight turns, whatever the caster's",
    );
});

/** The figure on the bearer's slow, off the walk the tooltip reads and the clock the view keeps. */
function replayFrostFigure(events: readonly BattleEvent[]) {
    const turnsByCombatantId = new Map<number, number>();
    let turnStanding = NO_TURN_STANDING;
    for (const event of events) {
        turnStanding = addEventTurns(turnsByCombatantId, event, turnStanding);
    }
    const view: FightView = {
        roster: ROSTER,
        events,
        unread: { "unknown-key": 0, "no-parameter": 0, "grammar-refused": 0 },
        messagesLost: 0,
        messagesRead: events.length,
        hasJoinedInProgress: false,
        isOver: false,
        readerSide: null,
        turnStatement: null,
        isOnAuto: false,
        payloadsApplied: 1,
        chargedSkills: [],
        carriedStatuses: [{ combatantId: BEARER_ID, bit: SLOW_BIT, turnsElapsed: 1 }],
        legendaryStandings: [],
        turnsByCombatantId,
    };
    const figures = tallyCarriedFigures({
        statuses: view.carriedStatuses,
        casts: replayAuraStandings(view, STATED_SKILLS).casts,
        roster: ROSTER,
        turnsByCombatantId,
        keyByStatusBit: WITNESSED,
    });
    return figures[0];
}

function composeFrostCast(): BattleEvent {
    return {
        kind: "skill-used",
        actorId: FROST_CASTER_ID,
        targetId: BEARER_ID,
        actorHealthPercent: 100,
        targetHealthPercent: null,
        skillName: "Szadź",
        skillId: FROST_SKILL_ID,
        declared: [{ effect: "allslow_per", amount: 14, text: null }],
    };
}

/** A blow standing behind no announcement, which opens a turn of whoever struck it. */
function composeBlowBy(actorId: number): BattleEvent {
    return {
        kind: "attack",
        actorId,
        targetId: actorId === BEARER_ID ? FROST_CASTER_ID : BEARER_ID,
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

Deno.test("a bearer who outruns the caster has the figure gone", () => {
    const events = [
        composeBlowBy(BEARER_ID),
        composeFrostCast(),
        ...Array.from({ length: 2 }, () => composeBlowBy(FROST_CASTER_ID)),
        ...Array.from({ length: 8 }, () => composeBlowBy(BEARER_ID)),
    ];
    const figure = replayFrostFigure(events);
    assertStrictEquals(figure?.percent, null, "eight of their eight, though the caster took two");
});
