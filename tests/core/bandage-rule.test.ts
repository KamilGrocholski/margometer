/**
 * `bandage`, held to the percentage the client states about the combatant it healed.
 *
 * The figure is health in this protocol's units and not a share of anything, which the one
 * occurrence settles by arithmetic: it raises its subject's stated percentage by what that many
 * points of their pool comes to (`docs/protocol-keys.md`).
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { indexCombatantRoster } from "#/src/core/combatant-roster.ts";
import { getStatedHealthsFromEvent } from "#/src/core/combatant-health.ts";
import { decodePayloadMessages } from "#/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "#/src/core/protocol-message.ts";
import { BLOWS_GRANTED } from "#/tests/frozen-tables.ts";
import { lookupRecordedFight, readRecordedFights } from "#/tests/recorded-fights.ts";

const KEY = "bandage";
const BANDAGE = "captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json";
const TOLERANCE = 0.01;

Deno.test("the figure is health, and raises the percentage stated before it by its share", () => {
    const combatants = lookupRecordedFight(BANDAGE).combatants;
    const roster = indexCombatantRoster(combatants);
    const healthMaximumById = new Map(combatants.map((one) => [one.id, one.healthMaximum]));
    const percentById = new Map<number, number>();
    let healed = 0;
    for (
        const event of decodePayloadMessages(lookupRecordedFight(BANDAGE).messages, {
            roster,
            standing: null,
            tables: BLOWS_GRANTED,
        }).events
    ) {
        if (event.kind === "health-change" && event.source === KEY) {
            const id = event.combatantId;
            assertExists(id, "the healing names whose health moved");
            const before = percentById.get(id);
            const maximum = healthMaximumById.get(id) ?? null;
            assertExists(before, "the protocol stated them before it");
            assertExists(maximum, "and the snapshot states their pool");
            assertExists(event.healthPercent, "and it says where they stand after");
            assert(event.amount > 0, "health came back rather than going out");
            const expected = before + (event.amount * 100) / maximum;
            const off = Math.abs(expected - event.healthPercent);
            assert(off <= TOLERANCE, `the reading is off by ${off.toFixed(3)} points`);
            healed += 1;
        }
        for (const [id, percent] of getStatedHealthsFromEvent(event)) percentById.set(id, percent);
    }
    assertEquals(healed, 1, "the one occurrence the material carries, 2026-08-30");
});

Deno.test("one recording carries it, and a second would have to be read as well", () => {
    const carrying = readRecordedFights().filter((fight) =>
        fight.messages.some((message) => {
            const parsed = parseProtocolMessage(message);
            if (parsed instanceof Error) return false;
            return parsed.parameters.some((one) => one.key === KEY);
        })
    ).map((fight) => fight.path);
    assertEquals(carrying, [BANDAGE], "one, and the reading rests on it");
});
