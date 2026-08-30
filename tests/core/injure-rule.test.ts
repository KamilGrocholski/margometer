/**
 * `injure`, and the wound its tick belongs to.
 *
 * The help says a victim carries one wound at a time and the freshest overwrites it, so the
 * freshest `+injure` against a victim is whose wound is ticking and the figure says which one it
 * is. This file holds that over the material, and pins where the reading stops
 * (`docs/protocol-keys.md`).
 */

import { assert, assertEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import {
    decodeFightMessages,
    WOUND_ANNOUNCEMENT_KEY,
    WOUND_TICK_KEY as TICK_KEY,
} from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import {
    getRecordedCombatants,
    getRecordedMessages,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

/** A victim wounded by three different attackers, which is what makes *freshest* a claim. */
const THREE_ATTACKERS = "captures/2026-08-15-tempest-grupa-vs-hildur-3-1786514810315-none.json";

Deno.test("every tick lands on a victim already wounded, stating what that wound announced", () => {
    let ticks = 0;
    let wounds = 0;
    for (const path of getRecordingPaths()) {
        const freshestByVictim = new Map<number, string>();
        for (const message of getRecordedMessages(path)) {
            const parsed = parseProtocolMessage(message);
            const applied = parsed.parameters.find((one) => one.key === WOUND_ANNOUNCEMENT_KEY);
            if (applied !== undefined) {
                assert(parsed.target !== null, `${path}: a wound naming nobody to carry it`);
                assert(applied.value !== null, `${path}: a wound announcing no figure`);
                freshestByVictim.set(parsed.target.combatantId, applied.value);
                wounds += 1;
            }
            const tick = parsed.parameters.find((one) => one.key === TICK_KEY);
            if (tick === undefined) continue;
            assert(parsed.actor !== null, `${path}: a tick naming nobody`);
            ticks += 1;
            const wound = freshestByVictim.get(parsed.actor.combatantId);
            assert(wound !== undefined, `${path}: a tick on a victim carrying no wound`);
            assertEquals(tick.value, wound, `${path}: a tick stating what no wound announced`);
        }
    }
    assertEquals(ticks, 184, "every tick the material carries, 2026-08-30");
    assertEquals(wounds, 76, "and every wound announced before one, 2026-08-30");
});

Deno.test("a victim carries one wound at a time, however many attackers wounded them", () => {
    const attackers = new Map<number, Set<number>>();
    for (const message of getRecordedMessages(THREE_ATTACKERS)) {
        const parsed = parseProtocolMessage(message);
        if (!parsed.parameters.some((one) => one.key === WOUND_ANNOUNCEMENT_KEY)) continue;
        assert(parsed.actor !== null, "a wound has somebody who dealt it");
        assert(parsed.target !== null, "and somebody who carries it");
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
 * the figures hold. **ADR 0022.**
 */
Deno.test("every tick stands against the attacker whose wound was ticking", () => {
    const roster = composeCombatantRoster(getRecordedCombatants(THREE_ATTACKERS));
    const messages = getRecordedMessages(THREE_ATTACKERS);
    const freshestByVictim = new Map<number, { attackerId: number; amount: string }>();
    const expected = new Map<number, number>();
    let ticked = 0;
    for (const message of messages) {
        const parsed = parseProtocolMessage(message);
        const applied = parsed.parameters.find((one) => one.key === WOUND_ANNOUNCEMENT_KEY);
        if (applied !== undefined) {
            assert(parsed.actor !== null, "a wound is left by somebody");
            assert(parsed.target !== null, "on somebody");
            assert(applied.value !== null, "and it announces a figure");
            freshestByVictim.set(parsed.target.combatantId, {
                attackerId: parsed.actor.combatantId,
                amount: applied.value,
            });
        }
        const tick = parsed.parameters.find((one) => one.key === TICK_KEY);
        if (tick === undefined) continue;
        assert(parsed.actor !== null, "a tick names its victim");
        const wound = freshestByVictim.get(parsed.actor.combatantId);
        assert(wound !== undefined, "and the wound it belongs to is standing");
        assertEquals(tick.value, wound.amount, "stating what that wound announced");
        const amount = Number(wound.amount);
        expected.set(wound.attackerId, (expected.get(wound.attackerId) ?? 0) + amount);
        ticked += amount;
    }
    assertEquals(ticked, 2132, `${THREE_ATTACKERS}: what the wounds ticked for, 2026-08-30`);
    assertEquals(
        expected.size,
        3,
        "charged to the three attackers who wounded, and to nobody else",
    );

    const events = decodeFightMessages(messages, roster);
    const statistics = composeFightStatistics(events, new Map());
    for (const [attackerId, amount] of expected) {
        const figures = statistics.byCombatantId.get(attackerId);
        assert(figures !== undefined, "an attacker whose wound ticked has a row");
        assertEquals(
            figures.damageDealtByElement.get(TICK_KEY),
            amount,
            "holding what their own wound ticked for, and nothing anybody else's did",
        );
    }
});

/**
 * The two sides of the rule, on messages small enough to read. A tick states the figure its wound
 * announced, so one stating anything else belongs to no wound this reading can name — and it stays
 * charged to nobody rather than to the attacker standing nearest. **ADR 0022.**
 */
const ATTACKER = 1;
const VICTIM = -2;
const WOUND =
    `${ATTACKER}=100.00;${VICTIM}=99.41;+dmgd=1553;${WOUND_ANNOUNCEMENT_KEY}=98;-dmgd=658`;

function getFightWithTick(tick: string) {
    const events = decodeFightMessages([WOUND, `${VICTIM}=99.00;0;${TICK_KEY}=${tick}`], null);
    return composeFightStatistics(events, new Map());
}

Deno.test("a tick stating what the wound announced is charged to whoever left it", () => {
    const statistics = getFightWithTick("98");
    const attacker = statistics.byCombatantId.get(ATTACKER);
    const victim = statistics.byCombatantId.get(VICTIM);
    assert(attacker !== undefined, "the attacker has a row");
    assert(victim !== undefined, "and so does the victim");
    assertEquals(attacker.damageDealtByElement.get(TICK_KEY), 98, "the tick is dealt by them");
    const pair = victim.damageTakenByOpponentAndKind.get(`${ATTACKER}`);
    assert(pair !== undefined, "and the pair holds what passed between the two");
    assertEquals(pair.get(TICK_KEY), 98, "the tick standing apart from the blow that left it");
    assertEquals(victim.damageTakenByOpponent.get(`${ATTACKER}`), 756, "which is 658 and 98");
    assertEquals(victim.damageTakenFromNobody, 0, "so no part of it is taken from nobody");
    assertEquals(statistics.dealtByNobody, 0, "and none of it is dealt by nobody");
});

Deno.test("a tick stating anything else is charged to nobody, not to the nearest attacker", () => {
    const statistics = getFightWithTick("97");
    const attacker = statistics.byCombatantId.get(ATTACKER);
    const victim = statistics.byCombatantId.get(VICTIM);
    assert(attacker !== undefined, "the attacker still has a row, from the blow");
    assert(victim !== undefined, "and so does the victim");
    assertEquals(
        attacker.damageDealtByElement.get(TICK_KEY),
        undefined,
        "nothing is dealt by them",
    );
    assertEquals(victim.damageTakenByOpponent.get(`${ATTACKER}`), 658, "only the blow is theirs");
    assertEquals(victim.damageTakenFromNobody, 97, "the tick is taken from nobody");
    assertEquals(statistics.dealtByNobody, 97, "and dealt by nobody");
});
