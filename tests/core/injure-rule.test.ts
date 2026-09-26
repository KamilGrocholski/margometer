/**
 * `injure`, and the wound its tick belongs to.
 *
 * The help says a victim carries one wound at a time and the freshest overwrites it, so the
 * freshest `+injure` against a victim is whose wound is ticking and the figure says which one it
 * is. This file holds that over the material, and pins where the reading stops
 * (`docs/protocol-keys.md`).
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { indexCombatantRoster } from "#/src/core/combatant-roster.ts";
import { decodePayloadMessages } from "#/src/core/fight-decoder.ts";
import {
    type FightStatistics,
    tallyFightStatistics,
    verifyFightStatistics,
} from "#/src/core/fight-statistics.ts";
import { WOUND_ANNOUNCEMENT_KEY, WOUND_TICK_KEY as TICK_KEY } from "#/src/core/protocol-key.ts";
import { parseProtocolMessage, type ProtocolMessage } from "#/src/core/protocol-message.ts";
import { BLOWS_GRANTED } from "#/tests/frozen-tables.ts";
import { lookupRecordedFight, readRecordedFights } from "#/tests/recorded-fights.ts";

/** A victim wounded by three different attackers, which is what makes *freshest* a claim. */
const THREE_ATTACKERS = "captures/2026-08-15-tempest-grupa-vs-hildur-3-1786514810315-none.json";

/**
 * The two sides of the rule, on messages small enough to read. A tick states the figure its wound
 * announced, so one stating anything else belongs to no wound this reading can name, and it stays
 * charged to nobody rather than to the attacker standing nearest (`develop ADR 0022`).
 */
const ATTACKER = 1;
const VICTIM = -2;
const WOUND =
    `${ATTACKER}=100.00;${VICTIM}=99.41;+dmgd=1553;${WOUND_ANNOUNCEMENT_KEY}=98;-dmgd=658`;

Deno.test("every tick lands on a victim already wounded, stating what that wound announced", () => {
    let ticks = 0;
    let wounds = 0;
    for (const fight of readRecordedFights()) {
        const path = fight.path;
        const freshestByVictim = new Map<number, string>();
        for (const message of fight.messages) {
            const parsed = parseOrFail(message, path);
            const announced = parsed.parameters.filter((one) => one.key === WOUND_ANNOUNCEMENT_KEY);
            // The walk below takes the first and would drop a second without a word.
            assert(announced.length <= 1, `${path}: two wounds announced in one message`);
            const applied = announced[0];
            if (applied !== undefined) {
                assertExists(parsed.target, `${path}: a wound naming nobody to carry it`);
                assertExists(applied.value, `${path}: a wound announcing no figure`);
                freshestByVictim.set(parsed.target.combatantId, applied.value);
                wounds += 1;
            }
            const ticked = parsed.parameters.filter((one) => one.key === TICK_KEY);
            assert(ticked.length <= 1, `${path}: two wounds ticking in one message`);
            const tick = ticked[0];
            if (tick === undefined) continue;
            assertExists(parsed.actor, `${path}: a tick naming nobody`);
            ticks += 1;
            const wound = freshestByVictim.get(parsed.actor.combatantId);
            assertExists(wound, `${path}: a tick on a victim carrying no wound`);
            assertEquals(tick.value, wound, `${path}: a tick stating what no wound announced`);
        }
    }
    assert(ticks > 0, "an empty reading of the material is a finding, not a pass");
    assert(wounds > 0, "and a walk finding no wound to tick against is another");
});

function parseOrFail(text: string, path: string): ProtocolMessage {
    const parsed = parseProtocolMessage(text);
    assert(!(parsed instanceof Error), `${path}: every recorded message parses`);
    return parsed;
}

Deno.test("a victim carries one wound at a time, however many attackers wounded them", () => {
    const attackers = new Map<number, Set<number>>();
    for (const message of lookupRecordedFight(THREE_ATTACKERS).messages) {
        const parsed = parseOrFail(message, THREE_ATTACKERS);
        if (!parsed.parameters.some((one) => one.key === WOUND_ANNOUNCEMENT_KEY)) continue;
        assertExists(parsed.actor, "a wound has somebody who dealt it");
        assertExists(parsed.target, "and somebody who carries it");
        const seen = attackers.get(parsed.target.combatantId) ?? new Set<number>();
        seen.add(parsed.actor.combatantId);
        attackers.set(parsed.target.combatantId, seen);
    }
    const most = Math.max(...[...attackers.values()].map((one) => one.size));
    assertEquals(most, 3, "three attackers wound one victim here, so freshest is a claim");
});

/**
 * The join itself, re-earned from the material rather than read off the code: the freshest wound
 * against a victim is walked out of the messages here, and what it charges is compared with what
 * the figures hold (`develop ADR 0022`).
 */
Deno.test("every tick stands against the attacker whose wound was ticking", () => {
    const fight = lookupRecordedFight(THREE_ATTACKERS);
    const expected = tallyExpectedTicks(fight.messages);
    let ticked = 0;
    for (const amount of expected.values()) ticked += amount;
    assertEquals(ticked, 2132, `${THREE_ATTACKERS}: what the wounds ticked for, 2026-08-30`);
    assertEquals(expected.size, 3, "charged to the three attackers who wounded, and nobody else");

    const roster = indexCombatantRoster(fight.combatants);
    const context = { roster, standing: null, tables: BLOWS_GRANTED };
    const events = decodePayloadMessages(fight.messages, context).events;
    const statistics = tallyFightStatistics(events, new Map());
    verifyFightStatistics(statistics);
    for (const [attackerId, amount] of expected) {
        const figures = statistics.byCombatantId.get(attackerId);
        assertExists(figures, "an attacker whose wound ticked has a row");
        assertEquals(
            figures.damageDealtByElement.get(TICK_KEY),
            amount,
            "holding what their own wound ticked for, and nothing anybody else's did",
        );
    }
});

/** What the freshest wound against each victim charges, walked out of the messages by hand. */
function tallyExpectedTicks(messages: readonly string[]): Map<number, number> {
    const freshestByVictim = new Map<number, { attackerId: number; amount: string }>();
    const expected = new Map<number, number>();
    for (const message of messages) {
        const parsed = parseOrFail(message, THREE_ATTACKERS);
        const applied = parsed.parameters.find((one) => one.key === WOUND_ANNOUNCEMENT_KEY);
        if (applied !== undefined) {
            assertExists(parsed.actor, "a wound is left by somebody");
            assertExists(parsed.target, "on somebody");
            assertExists(applied.value, "and it announces a figure");
            const standing = { attackerId: parsed.actor.combatantId, amount: applied.value };
            freshestByVictim.set(parsed.target.combatantId, standing);
        }
        const tick = parsed.parameters.find((one) => one.key === TICK_KEY);
        if (tick === undefined) continue;
        assertExists(parsed.actor, "a tick names its victim");
        const wound = freshestByVictim.get(parsed.actor.combatantId);
        assertExists(wound, "and the wound it belongs to is standing");
        assertEquals(tick.value, wound.amount, "stating what that wound announced");
        const amount = Number(wound.amount);
        expected.set(wound.attackerId, (expected.get(wound.attackerId) ?? 0) + amount);
    }
    return expected;
}

Deno.test("a tick stating what the wound announced is charged to whoever left it", () => {
    const statistics = tallyFightWithTick("98");
    const attacker = statistics.byCombatantId.get(ATTACKER);
    const victim = statistics.byCombatantId.get(VICTIM);
    assertExists(attacker, "the attacker has a row");
    assertExists(victim, "and so does the victim");
    assertEquals(attacker.damageDealtByElement.get(TICK_KEY), 98, "the tick is dealt by them");
    const pair = victim.damageTakenByOpponentAndKind.get(`${ATTACKER}`);
    assertExists(pair, "and the pair holds what passed between the two");
    assertEquals(pair.get(TICK_KEY), 98, "the tick standing apart from the blow that left it");
    assertEquals(victim.damageTakenByOpponent.get(`${ATTACKER}`), 756, "which is 658 and 98");
    assertEquals(victim.damageTakenFromNobody, 0, "so no part of it is taken from nobody");
    assertEquals(statistics.dealtByNobody, 0, "and none of it is dealt by nobody");
});

function tallyFightWithTick(tick: string): FightStatistics {
    const messages = [WOUND, `${VICTIM}=99.00;0;${TICK_KEY}=${tick}`];
    const context = { roster: null, standing: null, tables: BLOWS_GRANTED };
    const statistics = tallyFightStatistics(
        decodePayloadMessages(messages, context).events,
        new Map(),
    );
    verifyFightStatistics(statistics);
    return statistics;
}

Deno.test("a tick stating anything else is charged to nobody, not to the nearest attacker", () => {
    const statistics = tallyFightWithTick("97");
    const attacker = statistics.byCombatantId.get(ATTACKER);
    const victim = statistics.byCombatantId.get(VICTIM);
    assertExists(attacker, "the attacker still has a row, from the blow");
    assertExists(victim, "and so does the victim");
    assertEquals(
        attacker.damageDealtByElement.get(TICK_KEY),
        undefined,
        "nothing is dealt by them",
    );
    assertEquals(victim.damageTakenByOpponent.get(`${ATTACKER}`), 658, "only the blow is theirs");
    assertEquals(victim.damageTakenFromNobody, 97, "the tick is taken from nobody");
    assertEquals(statistics.dealtByNobody, 97, "and dealt by nobody");
});
