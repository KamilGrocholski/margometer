/**
 * What rides a skill announcement, and which spelling of one.
 *
 * Two spellings announce a skill: the game's own table, and a name it did not take from there. A
 * reading that expects only the first misses the declarations riding the second
 * (`docs/protocol-keys.md`).
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { getRecordedMessages, getRecordingPaths } from "@/tests/recorded-fight.ts";

const TABLE_NAME_KEY = "tspell";
const CUSTOM_NAME_KEY = "tcustom";
const COUNT_KEY = "combo-max";
const REDUCER_KEY = "lowheal_per-enemies";
/**
 * ⚠️ **The floor is what separates a count from a quantity, and it is low on purpose.** The
 * protocol's quantities are health and damage, which run to five digits here; a count of
 * combination points is spent one at a time. Anything between the two would be neither, and is
 * what this refuses.
 */
const QUANTITY_FLOOR = 100;

function isAnnouncement(keys: readonly string[]): boolean {
    if (keys.includes(TABLE_NAME_KEY)) return true;
    return keys.includes(CUSTOM_NAME_KEY);
}

Deno.test("what a skill spends stands on its announcement and nowhere else", () => {
    let stated = 0;
    for (const path of getRecordingPaths()) {
        for (const message of getRecordedMessages(path)) {
            const parsed = parseProtocolMessage(message);
            const keys = parsed.parameters.map((one) => one.key);
            if (!keys.includes(COUNT_KEY)) continue;
            stated += 1;
            assert(isAnnouncement(keys), `${path}: a count on a message announcing no skill`);
        }
    }
    assertEquals(stated, 434, "every count the material carries, 2026-08-30");
});

/**
 * ⚠️ **The register names the values 1, 2 and 3**, read 2026-08-19. The material has carried a 4
 * since, so what is asserted is the range rather than the set: a new value is the protocol saying
 * something, and a value in the quantities' range would be the reading being wrong.
 */
Deno.test("what a skill spends is a count, never a quantity", () => {
    const values = new Set<number>();
    for (const path of getRecordingPaths()) {
        for (const message of getRecordedMessages(path)) {
            for (const one of parseProtocolMessage(message).parameters) {
                if (one.key !== COUNT_KEY) continue;
                assertExists(one.value, `${path}: a count stating nothing`);
                const spent = Number(one.value);
                assert(Number.isSafeInteger(spent), `${path}: a count spelled ${one.value}`);
                assert(spent > 0, `${path}: a skill spending no points states none`);
                assert(spent < QUANTITY_FLOOR, `${path}: ${spent} is a quantity, not a count`);
                values.add(spent);
            }
        }
    }
    assert(values.size > 1, "the material states more than one, or the key states a constant");
});

/**
 * The two recordings that refuted it. Before them a declaration had only ever been seen riding the
 * game's own name, and reading that as the rule would have lost four keys — two of which had no
 * entry in the register at all.
 */
Deno.test("a declaration rides a name the game did not take from its own table", () => {
    const found: string[] = [];
    for (const path of getRecordingPaths()) {
        for (const message of getRecordedMessages(path)) {
            const parsed = parseProtocolMessage(message);
            const keys = parsed.parameters.map((one) => one.key);
            if (!keys.includes(CUSTOM_NAME_KEY)) continue;
            assert(!keys.includes(TABLE_NAME_KEY), `${path}: a message spelling the name twice`);
            for (const one of parsed.parameters) {
                const isName = one.key === CUSTOM_NAME_KEY;
                if (isName) continue;
                if (one.value === null) continue;
                found.push(one.key);
            }
        }
    }
    for (const key of ["aura-ac_per", "aura-resall", "critval-allies", "critmval-allies"]) {
        assert(found.includes(key), `${key} rides a custom name in the material and was not found`);
    }
});

/**
 * ⚠️ **An announcement is not always the message before.** These three state their figure on the
 * announcement itself, so a reading that only carried one message forward left every point of
 * them with no giver and no name — 353,990 over `captures/`, until 2026-08-30.
 */
Deno.test("three keys state their figure on the announcement itself, and name an actor", () => {
    const counted = new Map<string, number>();
    for (const path of getRecordingPaths()) {
        for (const message of getRecordedMessages(path)) {
            const parsed = parseProtocolMessage(message);
            const keys = parsed.parameters.map((one) => one.key);
            for (const key of ["heal_target", "healall_per", "bandage"]) {
                if (!keys.includes(key)) continue;
                assert(isAnnouncement(keys), `${path}: ${key} on a message announcing no skill`);
                assertExists(parsed.actor, `${path}: ${key} on a message naming no actor`);
                counted.set(key, (counted.get(key) ?? 0) + 1);
            }
        }
    }
    assertEquals(counted.get("heal_target"), 117, "every occurrence the material carries");
    assertEquals(counted.get("healall_per"), 115, "for each of the three, 2026-08-30");
    assertEquals(counted.get("bandage"), 1, "the last of them stated once");
});

Deno.test("the reducer of a side's healing stands on an announcement too", () => {
    let stated = 0;
    for (const path of getRecordingPaths()) {
        for (const message of getRecordedMessages(path)) {
            const parsed = parseProtocolMessage(message);
            const keys = parsed.parameters.map((one) => one.key);
            if (!keys.includes(REDUCER_KEY)) continue;
            stated += 1;
            assert(isAnnouncement(keys), `${path}: a reduction on a message announcing no skill`);
        }
    }
    assertEquals(stated, 4, "every occurrence the material carries, 2026-08-30");
});
