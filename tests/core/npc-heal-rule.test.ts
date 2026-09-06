/**
 * `npc_heal`, and the occurrence stating nothing.
 *
 * A key read only where it states a figure passes every arithmetic check the witness makes and
 * still loses a restoration the game reported. The zero is what this file is here for
 * (`docs/protocol-keys.md`).
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import {
    getRecordedCombatants,
    getRecordedMessages,
    readRecordingPaths,
} from "@/tests/recorded-fight.ts";

const KEY = "npc_heal";
const NPC_HEAL = "captures/2026-08-25-luvia-grupa-vs-mamlambo-auto-none-0.8.1.json";
/** A share of the pool, in points of the percentage the client states about the same combatant. */
const POINTS_PER_CAST = 4;
const TOLERANCE = 0.01;

/** Every recording carrying the key, so a rule about it is read on all of them and not on one. */
function getRecordingsCarryingKey(): string[] {
    return readRecordingPaths().filter((path) =>
        getRecordedMessages(path).some((message) =>
            parseProtocolMessage(message).parameters.some((one) => one.key === KEY)
        )
    );
}

/** The messages that recording states the key on, which is what every rule below is read over. */
function getMessagesCarryingKey(path: string): string[] {
    return getRecordedMessages(path).filter((message) =>
        parseProtocolMessage(message).parameters.some((one) => one.key === KEY)
    );
}

Deno.test("the key is read wherever it stands, including where it states nothing", () => {
    const roster = composeCombatantRoster(getRecordedCombatants(NPC_HEAL));
    const restored = decodeFightMessages(getRecordedMessages(NPC_HEAL), roster).filter((event) =>
        event.kind === "health-change" && event.source === KEY
    );
    assertEquals(restored.length, 3, "every occurrence became an event, 2026-08-30");
    const figures = restored.map((event) => event.kind === "health-change" ? event.amount : null);
    assertEquals(figures.filter((one) => one === 0).length, 1, "one of them states nothing");
    assert(figures.every((one) => one !== null), "and none of the three was dropped");
});

/**
 * The message names a different combatant at each end, so a reading off the wrong slot credits
 * somebody the game never said was healed — and both slots are populated in every occurrence.
 *
 * Read over **every** recording carrying the key rather than over the one it was first found on:
 * a rule that holds on one fight and is never asked of the next is a coincidence with a test
 * around it.
 */
Deno.test("the restoration is the actor's, and the figure a share of their own pool", () => {
    const carrying = getRecordingsCarryingKey();
    assert(carrying.length > 0, "the material carries the key somewhere");
    for (const path of carrying) {
        const combatants = getRecordedCombatants(path);
        const roster = composeCombatantRoster(combatants);
        const messages = getMessagesCarryingKey(path);
        assert(messages.length > 0, `${path}: a carrier states the key at least once`);
        const actors = new Set<number>();
        const targets = new Set<number>();
        for (const message of messages) {
            const parsed = parseProtocolMessage(message);
            assertExists(parsed.actor, `${path}: each names an actor`);
            assertExists(parsed.target, `${path}: and a target, which makes the slot a choice`);
            actors.add(parsed.actor.combatantId);
            targets.add(parsed.target.combatantId);
        }
        assertEquals(actors.size, 1, `${path}: one combatant is restored throughout`);
        assert(targets.size > 1, `${path}: the other slot names several, so neither is the other`);

        const [healed] = [...actors];
        assertExists(healed, "a set of one has a member");
        const maximum = combatants.find((one) => one.id === healed)?.healthMaximum ?? null;
        assertExists(maximum, `${path}: the snapshot states that combatant's pool`);
        for (const event of decodeFightMessages(messages, roster)) {
            if (event.kind !== "health-change") continue;
            assertEquals(event.combatantId, healed, `${path}: every event lands on the actor`);
            assert(event.amount >= 0, `${path}: and puts health back rather than taking it`);
            if (event.amount === 0) continue;
            const points = (event.amount * 100) / maximum;
            assert(
                Math.abs(points - POINTS_PER_CAST) < TOLERANCE,
                `${path}: a cast worth ${points.toFixed(2)} points of the pool rather than four`,
            );
        }
    }
});

/**
 * Which recordings the reading rests on. Named rather than counted, so a third arriving is a
 * failure that says what to read next — the rule above is then asked of it too.
 */
Deno.test("the recordings carrying the key are the ones the reading was read on", () => {
    assertEquals(
        getRecordingsCarryingKey(),
        [NPC_HEAL, "captures/2026-09-06-luvia-grupa-5-vs-mamlambo-auto-ne0iTNdg-0.14.0.json"],
        "two recordings, and a third would want reading too, 2026-09-06",
    );
});
