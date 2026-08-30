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
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import {
    getRecordedCombatants,
    getRecordedMessages,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

const TICK_KEY = "injure";
const WOUND_KEY = "+injure";
/** A victim wounded by three different attackers, which is what makes *freshest* a claim. */
const THREE_ATTACKERS = "captures/2026-08-15-tempest-grupa-vs-hildur-3.json";

Deno.test("every tick lands on a victim already wounded, stating what that wound announced", () => {
    let ticks = 0;
    let wounds = 0;
    for (const path of getRecordingPaths()) {
        const freshestByVictim = new Map<number, string>();
        for (const message of getRecordedMessages(path)) {
            const parsed = parseProtocolMessage(message);
            const applied = parsed.parameters.find((one) => one.key === WOUND_KEY);
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
        if (!parsed.parameters.some((one) => one.key === WOUND_KEY)) continue;
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
 * ⚠️ **The join the register describes is not made in this tree.** `docs/protocol-keys.md` states
 * the cause of a tick as the wound's attacker; nothing under `src/core/` reads `injure` past the
 * health it moves, so the damage stands against the victim and is dealt by nobody. The material
 * above says the join is available; this says it is not taken, so the day it is, this fails rather
 * than passing under a reading it no longer describes.
 */
Deno.test("the tick is charged to nobody today, which is where the reading stops", () => {
    const roster = composeCombatantRoster(getRecordedCombatants(THREE_ATTACKERS));
    const events = decodeFightMessages(getRecordedMessages(THREE_ATTACKERS), roster);
    const ticked = events.filter((event) =>
        event.kind === "health-change" && event.source === TICK_KEY
    );
    assert(ticked.length > 0, "the fight carries ticks to be charged");
    let total = 0;
    for (const event of ticked) {
        assert(event.kind === "health-change", "a tick is a health change");
        assertEquals(event.announced, null, "nothing announced the tick itself");
        assert(event.combatantId !== null, "and it names the victim, never the attacker");
        total += -event.amount;
    }
    const statistics = composeFightStatistics(events, new Map());
    assert(statistics.dealtByNobody >= total, "the whole of it is dealt by nobody the panel names");
});
