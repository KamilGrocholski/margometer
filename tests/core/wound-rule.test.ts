/**
 * `wound`, held to the percentages the protocol states about the combatant it ticks on.
 *
 * The health witness cannot judge the one fight carrying this key — it arrives as a single engine
 * call with no opening snapshot, so the replay seeds no running total. The evidence chains from a
 * stated percentage instead, and this is where that chain is walked (`docs/protocol-keys.md`).
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { getStatedHealthFromEvent } from "@/src/core/combatant-health.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { getRecordedCombatants, getRecordedMessages } from "@/tests/recorded-fight.ts";

const WOUND = "captures/2026-08-24-tempest-tropiciel-vs-centaur-1786514810315-none.json";
const TICK_KEY = "wound";
/** Two places of a percentage, so the reading is allowed the rounding the client did. */
const TOLERANCE = 0.007;

Deno.test("every tick takes the percentage stated before it down by its own figure", () => {
    const combatants = getRecordedCombatants(WOUND);
    const roster = composeCombatantRoster(combatants);
    const maximumById = new Map(combatants.map((one) => [one.id, one.healthMaximum]));
    const percentById = new Map<number, number>();
    let closed = 0;
    let past = 0;
    for (const event of decodeFightMessages(getRecordedMessages(WOUND), roster)) {
        const isTick = event.kind === "health-change" && event.source === TICK_KEY;
        if (isTick) {
            assertStrictEquals(event.kind, "health-change", "a tick is a health change");
            assert(event.amount < 0, "and takes health rather than putting it back");
            const id = event.combatantId;
            assertExists(id, "a tick names whose health moved");
            const before = percentById.get(id);
            const maximum = maximumById.get(id) ?? null;
            assertExists(before, "the protocol stated this combatant before the tick");
            assertExists(maximum, "and the snapshot beside it states their pool");
            assertExists(event.healthPercent, "the tick states where they stand after it");
            const expected = before + (event.amount * 100) / maximum;
            // The killing tick is the one the arithmetic cannot reach: the figure would take the
            // player past zero and the game states zero, which is the floor and not a reading.
            if (expected < 0) {
                assertEquals(event.healthPercent, 0, "a tick past zero is stated as zero");
                past += 1;
            } else {
                const off = Math.abs(expected - event.healthPercent);
                assert(off <= TOLERANCE, `a tick off by ${off.toFixed(4)} points`);
                closed += 1;
            }
        }
        for (const [id, percent] of getStatedHealthFromEvent(event)) percentById.set(id, percent);
    }
    assertEquals(closed, 14, "every tick the arithmetic can reach closes on it, 2026-08-30");
    assertEquals(past, 1, "and the one it cannot is the killing tick");
});

Deno.test("the key is read as damage, and all of it lands on the combatant it ticks on", () => {
    const roster = composeCombatantRoster(getRecordedCombatants(WOUND));
    const ticked = decodeFightMessages(getRecordedMessages(WOUND), roster).filter((event) =>
        event.kind === "health-change" && event.source === TICK_KEY
    );
    assertEquals(ticked.length, 15, "the material carries this many ticks, 2026-08-30");
    const victims = new Set<number>();
    for (const event of ticked) {
        assertStrictEquals(event.kind, "health-change", "a tick is a health change");
        assertExists(event.combatantId, "naming whose health moved");
        victims.add(event.combatantId);
    }
    assertEquals(victims.size, 1, "and every one of them names the same combatant");
});
