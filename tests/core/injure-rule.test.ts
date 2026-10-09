/**
 * `injure`, and the wound its tick belongs to.
 *
 * The help says a combatant carries one wound at a time and the freshest overwrites it, so the
 * freshest `+injure` against a combatant is whose wound is ticking and the figure says which one it
 * is. This file holds that over the material, and pins where the reading stops
 * (`docs/protocol-keys.md`).
 */

import { assert, assertExists, assertStrictEquals } from "@std/assert";
import { indexCombatantRoster } from "#/src/core/combatant-roster.ts";
import {
    decodePayloadMessages,
    parseProtocolMessage,
    type ProtocolMessage,
} from "#/src/core/fight-decoder.ts";
import {
    type FightStatistics,
    tallyFightStatistics,
    verifyFightStatistics,
} from "#/src/core/fight-statistics.ts";
import { WOUND_ANNOUNCEMENT_KEY, WOUND_TICK_KEY as TICK_KEY } from "#/src/core/protocol-key.ts";
import { BLOWS_GRANTED } from "#/tests/frozen-tables.ts";
import {
    lookupRecordedFight,
    readRecordedFights,
    tallyRecordedFight,
} from "#/tests/recorded-fights.ts";

/** A combatant wounded by three others, which is what makes *freshest* a claim. */
const WOUNDED_THRICE = "captures/2026-08-15-tempest-grupa-vs-hildur-3-1786514810315-none.json";

/**
 * The two sides of the rule, on messages small enough to read. A tick states the figure its wound
 * announced, so one stating anything else belongs to no wound this reading can name, and it stays
 * charged to nobody rather than to the actor standing nearest (`develop ADR 0022`).
 */
const ACTOR = 1;
const TARGET = -2;
const WOUND = `${ACTOR}=100.00;${TARGET}=99.41;+dmgd=1553;${WOUND_ANNOUNCEMENT_KEY}=98;-dmgd=658`;

Deno.test("every tick lands on a combatant already wounded, stating what that wound announced", () => {
    let ticks = 0;
    let wounds = 0;
    let weakened = 0;
    for (const fight of readRecordedFights()) {
        const path = fight.path;
        const freshestByWounded = new Map<number, string>();
        for (const message of fight.messages) {
            const parsed = parseOrFail(message, path);
            const announced = parsed.parameters.filter((parameter) =>
                parameter.key === WOUND_ANNOUNCEMENT_KEY
            );
            // The walk below takes the first and would drop a second without a word.
            assert(announced.length <= 1, `${path}: two wounds announced in one message`);
            const applied = announced[0];
            if (applied !== undefined) {
                assertExists(parsed.target, `${path}: a wound naming nobody to carry it`);
                assertExists(applied.value, `${path}: a wound announcing no figure`);
                freshestByWounded.set(parsed.target.combatantId, applied.value);
                wounds += 1;
            }
            const ticked = parsed.parameters.filter((parameter) => parameter.key === TICK_KEY);
            assert(ticked.length <= 1, `${path}: two wounds ticking in one message`);
            const tick = ticked[0];
            if (tick === undefined) continue;
            assertExists(parsed.actor, `${path}: a tick naming nobody`);
            ticks += 1;
            const wound = freshestByWounded.get(parsed.actor.combatantId);
            assertExists(wound, `${path}: a tick on a combatant carrying no wound`);
            assertExists(tick.value, `${path}: a tick stating no figure`);
            assertStrictEquals(
                tick.value,
                formatTickExpected(wound, tick.value),
                `${path}: a tick stating what no wound announced`,
            );
            if (tick.value !== wound) weakened += 1;
        }
    }
    assert(ticks > 0, "an empty reading of the material is a finding, not a pass");
    assert(wounds > 0, "and a walk finding no wound to tick against is another");
    assertStrictEquals(weakened, 23, "the ticks the material states weakened, 2026-10-04");
});

/**
 * What a tick against that wound states, worked out here rather than read off the code. The client
 * composes a second member as the percentage the figure was weakened by
 * (`msg_injure %name% %val0% %val1%`), and the figure before it is the wound's, weakened and
 * rounded up.
 */
function formatTickExpected(announced: string, tickValue: string): string {
    const members = tickValue.split(",");
    if (members.length === 1) return announced;
    assertStrictEquals(members.length, 2, "a tick states its figure and one weakening at most");
    const weakeningPercent = Number(members[1]);
    const ticking = Math.ceil((Number(announced) * (100 - weakeningPercent)) / 100);
    return `${ticking},${members[1]}`;
}

function parseOrFail(text: string, path: string): ProtocolMessage {
    const parsed = parseProtocolMessage(text);
    assert(!(parsed instanceof Error), `${path}: every recorded message parses`);
    return parsed;
}

Deno.test("a combatant carries one wound at a time, however many others wounded them", () => {
    const actorsByTargetId = new Map<number, Set<number>>();
    for (const message of lookupRecordedFight(WOUNDED_THRICE).messages) {
        const parsed = parseOrFail(message, WOUNDED_THRICE);
        if (!parsed.parameters.some((parameter) => parameter.key === WOUND_ANNOUNCEMENT_KEY)) {
            continue;
        }
        assertExists(parsed.actor, "a wound has somebody who dealt it");
        assertExists(parsed.target, "and somebody who carries it");
        const seen = actorsByTargetId.get(parsed.target.combatantId) ?? new Set<number>();
        seen.add(parsed.actor.combatantId);
        actorsByTargetId.set(parsed.target.combatantId, seen);
    }
    const most = Math.max(...[...actorsByTargetId.values()].map((actorIds) => actorIds.size));
    assertStrictEquals(most, 3, "three combatants wound one here, so freshest is a claim");
});

/**
 * The join itself, re-earned from the material rather than read off the code: the freshest wound
 * against a target is walked out of the messages here, and what it charges is compared with what
 * the figures hold (`develop ADR 0022`).
 */
Deno.test("every tick stands against whoever applied the wound that was ticking", () => {
    const fight = lookupRecordedFight(WOUNDED_THRICE);
    const expected = tallyExpectedTicks(fight.messages);
    let ticked = 0;
    for (const amount of expected.values()) ticked += amount;
    assertStrictEquals(ticked, 2132, `${WOUNDED_THRICE}: what the wounds ticked for, 2026-08-30`);
    assertStrictEquals(
        expected.size,
        3,
        "charged to the three who applied a wound, and nobody else",
    );

    const roster = indexCombatantRoster(fight.combatants);
    const context = { roster, announcementStanding: null, tables: BLOWS_GRANTED };
    const events = decodePayloadMessages(fight.messages, context).events;
    const statistics = tallyFightStatistics(events, new Map());
    verifyFightStatistics(statistics);
    for (const [actorId, amount] of expected) {
        const figures = statistics.byCombatantId.get(actorId);
        assertExists(figures, "whoever applied a wound that ticked has a row");
        assertStrictEquals(
            figures.damageDealtByKind.get(TICK_KEY),
            amount,
            "holding what their own wound ticked for, and nothing anybody else's did",
        );
    }
});

/** What the freshest wound against each combatant charges, walked out of the messages by hand. */
function tallyExpectedTicks(messages: readonly string[]): Map<number, number> {
    const freshestByWounded = new Map<number, { actorId: number; amount: string }>();
    const expected = new Map<number, number>();
    for (const message of messages) {
        const parsed = parseOrFail(message, WOUNDED_THRICE);
        const applied = parsed.parameters.find((parameter) =>
            parameter.key === WOUND_ANNOUNCEMENT_KEY
        );
        if (applied !== undefined) {
            assertExists(parsed.actor, "a wound is left by somebody");
            assertExists(parsed.target, "on somebody");
            assertExists(applied.value, "and it announces a figure");
            const standing = { actorId: parsed.actor.combatantId, amount: applied.value };
            freshestByWounded.set(parsed.target.combatantId, standing);
        }
        const tick = parsed.parameters.find((parameter) => parameter.key === TICK_KEY);
        if (tick === undefined) continue;
        assertExists(parsed.actor, "a tick names the combatant it wounds");
        const wound = freshestByWounded.get(parsed.actor.combatantId);
        assertExists(wound, "and the wound it belongs to is standing");
        assertStrictEquals(tick.value, wound.amount, "stating what that wound announced");
        const amount = Number(wound.amount);
        expected.set(wound.actorId, (expected.get(wound.actorId) ?? 0) + amount);
    }
    return expected;
}

Deno.test("a tick stating what the wound announced is charged to whoever left it", () => {
    const statistics = tallyFightWithTick("98");
    const actor = statistics.byCombatantId.get(ACTOR);
    const target = statistics.byCombatantId.get(TARGET);
    assertExists(actor, "the actor has a row");
    assertExists(target, "and so does the target");
    assertStrictEquals(actor.damageDealtByKind.get(TICK_KEY), 98, "the tick is dealt by them");
    const pair = target.damageTakenByOpponentAndKind.get(`${ACTOR}`);
    assertExists(pair, "and the pair holds what passed between the two");
    assertStrictEquals(
        pair.get(TICK_KEY),
        98,
        "the tick standing apart from the blow that left it",
    );
    assertStrictEquals(target.damageTakenByOpponent.get(`${ACTOR}`), 756, "which is 658 and 98");
    assertStrictEquals(target.damageTakenFromNobody, 0, "so no part of it is taken from nobody");
    assertStrictEquals(statistics.damageDealtByNobody, 0, "and none of it is dealt by nobody");
});

function tallyFightWithTick(tick: string): FightStatistics {
    const messages = [WOUND, `${TARGET}=99.00;0;${TICK_KEY}=${tick}`];
    const context = { roster: null, announcementStanding: null, tables: BLOWS_GRANTED };
    const statistics = tallyFightStatistics(
        decodePayloadMessages(messages, context).events,
        new Map(),
    );
    verifyFightStatistics(statistics);
    return statistics;
}

Deno.test("a tick stating anything else is charged to nobody, not to the nearest actor", () => {
    const statistics = tallyFightWithTick("97");
    const actor = statistics.byCombatantId.get(ACTOR);
    const target = statistics.byCombatantId.get(TARGET);
    assertExists(actor, "the actor still has a row, from the blow");
    assertExists(target, "and so does the target");
    assertStrictEquals(
        actor.damageDealtByKind.get(TICK_KEY),
        undefined,
        "nothing is dealt by them",
    );
    assertStrictEquals(
        target.damageTakenByOpponent.get(`${ACTOR}`),
        658,
        "only the blow is theirs",
    );
    assertStrictEquals(target.damageTakenFromNobody, 97, "the tick is taken from nobody");
    assertStrictEquals(statistics.damageDealtByNobody, 97, "and dealt by nobody");
});

/**
 * A tick weakened by a percentage it states beside the figure: 98 weakened by 10 is 88.2, and the
 * game rounds it up. 88 is what rounding to nearest or down would state, so it is the sample that
 * must not join.
 */
Deno.test("a tick weakened as it says, rounded up, is charged to whoever left the wound", () => {
    const statistics = tallyFightWithTick("89,10");
    const actor = statistics.byCombatantId.get(ACTOR);
    assertExists(actor, "the actor has a row");
    assertStrictEquals(
        actor.damageDealtByKind.get(TICK_KEY),
        89,
        "the weakened tick is dealt by them",
    );
    assertStrictEquals(statistics.damageDealtByNobody, 0, "and none of it is dealt by nobody");

    const rounded = tallyFightWithTick("88,10");
    const roundedActor = rounded.byCombatantId.get(ACTOR);
    assertExists(roundedActor, "the actor still has a row, from the blow");
    assertStrictEquals(
        roundedActor.damageDealtByKind.get(TICK_KEY),
        undefined,
        "88 is not theirs",
    );
    assertStrictEquals(rounded.damageDealtByNobody, 88, "and is dealt by nobody");
});

Deno.test("a weakening of 0 or 1 leaves the wound its own, and one of 100 joins nothing", () => {
    const whole = tallyFightWithTick("98,0");
    assertStrictEquals(
        whole.byCombatantId.get(ACTOR)?.damageDealtByKind.get(TICK_KEY),
        98,
        "a weakening of nothing leaves the wound's own figure, charged to who left it",
    );
    assertStrictEquals(whole.damageDealtByNobody, 0, "the whole wound is theirs");
    const weakened = tallyFightWithTick("98,1");
    assertStrictEquals(
        weakened.byCombatantId.get(ACTOR)?.damageDealtByKind.get(TICK_KEY),
        98,
        "a weakening of one percent is still charged to who left the wound",
    );
    assertStrictEquals(
        weakened.damageDealtByNobody,
        0,
        "97.02 rounds up to the wound's own figure",
    );
    const emptied = tallyFightWithTick("1,100");
    assertStrictEquals(
        emptied.damageDealtByNobody,
        1,
        "weakened by all of it, no wound is ticking",
    );
});

/** The join over the material: a tick the rule above holds is a tick charged to somebody. */
Deno.test("no recording charges a wound's tick to nobody", () => {
    let recordings = 0;
    for (const fight of readRecordedFights()) {
        const statistics = tallyRecordedFight(fight.path).statistics;
        for (const [combatantId, figures] of statistics.byCombatantId) {
            assertStrictEquals(
                figures.damageTakenFromNobodyByKind.get(TICK_KEY),
                undefined,
                `${fight.path}: ${combatantId} took a wound's tick from nobody`,
            );
        }
        recordings += 1;
    }
    assert(recordings > 0, "the material holds a recording to ask");
});
