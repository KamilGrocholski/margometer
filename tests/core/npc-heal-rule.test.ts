/**
 * `npc_heal`, and the occurrence stating nothing.
 *
 * A key read only where it states a figure passes every arithmetic check the witness makes and
 * still loses a restoration the game reported. The zero is what this file is here for
 * (`docs/protocol-keys.md`).
 */

import { assert, assertEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import {
    getRecordedCombatants,
    getRecordedMessages,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

const KEY = "npc_heal";
const NPC_HEAL = "captures/2026-08-25-luvia-grupa-vs-mamlambo-auto-none-0.8.1.json";
/** A share of the pool, in points of the percentage the client states about the same combatant. */
const POINTS_PER_CAST = 4;
const TOLERANCE = 0.01;

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
 * somebody the game never said was healed — and both slots are populated in all three.
 */
Deno.test("the restoration is the actor's, and the figure a share of their own pool", () => {
    const combatants = getRecordedCombatants(NPC_HEAL);
    const roster = composeCombatantRoster(combatants);
    const messages = getRecordedMessages(NPC_HEAL).filter((message) =>
        parseProtocolMessage(message).parameters.some((one) => one.key === KEY)
    );
    assertEquals(messages.length, 3, "the three the material carries");
    const actors = new Set<number>();
    const targets = new Set<number>();
    for (const message of messages) {
        const parsed = parseProtocolMessage(message);
        assert(parsed.actor !== null, "each names an actor");
        assert(parsed.target !== null, "and a target, which is what makes the slot a choice");
        actors.add(parsed.actor.combatantId);
        targets.add(parsed.target.combatantId);
    }
    assertEquals(actors.size, 1, "one combatant is restored in all three");
    assert(targets.size > 1, "while the other slot names several, so the two cannot be confused");

    const [healed] = [...actors];
    assert(healed !== undefined, "a set of one has a member");
    const maximum = combatants.find((one) => one.id === healed)?.healthMaximum ?? null;
    assert(maximum !== null, "the snapshot beside the fight states that combatant's pool");
    for (const event of decodeFightMessages(messages, roster)) {
        if (event.kind !== "health-change") continue;
        assertEquals(event.combatantId, healed, "every event lands on the actor slot's combatant");
        assert(event.amount >= 0, "and puts health back rather than taking it");
        if (event.amount === 0) continue;
        const points = (event.amount * 100) / maximum;
        assert(
            Math.abs(points - POINTS_PER_CAST) < TOLERANCE,
            `a cast worth ${points.toFixed(2)} points of the pool rather than four`,
        );
    }
});

Deno.test("no other recording carries the key, so the reading rests on this one", () => {
    const carrying = getRecordingPaths().filter((path) =>
        getRecordedMessages(path).some((message) =>
            parseProtocolMessage(message).parameters.some((one) => one.key === KEY)
        )
    );
    assertEquals(carrying, [NPC_HEAL], "one recording, and a second would want reading too");
});
