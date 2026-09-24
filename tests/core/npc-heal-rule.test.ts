/**
 * `npc_heal`, and the occurrence stating nothing.
 *
 * A key read only where it states a figure passes every arithmetic check the witness makes and
 * still loses a restoration the game reported. The zero is what this file is here for
 * (`develop:docs/protocol-keys.md`).
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { indexCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodePayloadMessages } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import {
    BLOWS_GRANTED,
    lookupRecordedFight,
    readRecordedFights,
    type RecordedFight,
} from "@/tests/recorded-fights.ts";

const KEY = "npc_heal";
const NPC_HEAL = "captures/2026-08-25-luvia-grupa-vs-mamlambo-auto-none-0.8.1.json";

function isCarryingKey(message: string): boolean {
    const parsed = parseProtocolMessage(message);
    if (!parsed.ok) return false;
    return parsed.value.parameters.some((one) => one.key === KEY);
}

/** Every recording carrying the key, so a rule about it is read on all of them and not on one. */
function getRecordingsCarryingKey(): RecordedFight[] {
    return readRecordedFights().filter((fight) => fight.messages.some(isCarryingKey));
}

Deno.test("the key is read wherever it stands, including where it states nothing", () => {
    const fight = lookupRecordedFight(NPC_HEAL);
    const roster = indexCombatantRoster(fight.combatants);
    const context = { roster, standing: null, tables: BLOWS_GRANTED };
    const restored = decodePayloadMessages(fight.messages, context).events
        .filter((event) => event.kind === "health-change" && event.source === KEY);
    assertEquals(restored.length, 3, "every occurrence became an event, 2026-08-30");
    const figures = restored.map((event) => event.kind === "health-change" ? event.amount : null);
    assertEquals(figures.filter((one) => one === 0).length, 1, "one of them states nothing");
    assert(figures.every((one) => one !== null), "and none of the three was dropped");
});

/**
 * The message names a different combatant at each end, so a reading off the wrong slot credits
 * somebody the game never said was healed, and both slots are populated in every occurrence.
 *
 * Read over **every** recording carrying the key rather than over the one it was first found on:
 * a rule that holds on one fight and is never asked of the next is a coincidence with a test
 * around it.
 */
Deno.test("the restoration is the actor's, whichever combatant the other slot names", () => {
    const carrying = getRecordingsCarryingKey();
    assert(carrying.length > 0, "the material carries the key somewhere");
    for (const fight of carrying) {
        const path = fight.path;
        const roster = indexCombatantRoster(fight.combatants);
        const messages = fight.messages.filter(isCarryingKey);
        assert(messages.length > 0, `${path}: a carrier states the key at least once`);
        const actors = new Set<number>();
        const targets = new Set<number>();
        for (const message of messages) {
            const parsed = parseProtocolMessage(message);
            assert(parsed.ok, `${path}: a message carrying the key parses`);
            assertExists(parsed.value.actor, `${path}: each names an actor`);
            assertExists(
                parsed.value.target,
                `${path}: and a target, which makes the slot a choice`,
            );
            actors.add(parsed.value.actor.combatantId);
            targets.add(parsed.value.target.combatantId);
        }
        assertEquals(actors.size, 1, `${path}: one combatant is restored throughout`);
        assert(targets.size > 1, `${path}: the other slot names several, so neither is the other`);

        const [healed] = [...actors];
        assertExists(healed, "a set of one has a member");
        const context = { roster, standing: null, tables: BLOWS_GRANTED };
        for (const event of decodePayloadMessages(messages, context).events) {
            if (event.kind !== "health-change") continue;
            assertEquals(event.combatantId, healed, `${path}: every event lands on the actor`);
            assert(event.amount >= 0, `${path}: and puts health back rather than taking it`);
        }
    }
});

/**
 * Which recordings the reading rests on. Named rather than counted, so one more arriving is a
 * failure that says what to read next: the rule above is then asked of it too.
 */
Deno.test("the recordings carrying the key are the ones the reading was read on", () => {
    assertEquals(
        getRecordingsCarryingKey().map((fight) => fight.path),
        [
            NPC_HEAL,
            "captures/2026-09-06-luvia-grupa-5-vs-mamlambo-auto-ne0iTNdg-0.14.0.json",
            "captures/2026-09-14-luvia-grupa-vs-mamlambo-auto-Cl9U89Zr-0.16.0.json",
        ],
        "three recordings, and a fourth would want reading too, 2026-09-14",
    );
});
