/**
 * The union against what actually arrives.
 *
 * A variant nothing produces is dead weight the tests themselves would keep alive, so the
 * corpus is what decides which kinds may exist.
 */

import { assert, assertEquals } from "@std/assert";
import { BATTLE_EVENT_KINDS } from "@/src/core/battle-event.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import {
    getRecordedCombatants,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

Deno.test("every variant the union holds is produced by the recordings", () => {
    const produced = new Set<string>();
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        for (const payload of getRecordedPayloads(path)) {
            for (const event of decodeFightMessages(payload, roster)) produced.add(event.kind);
        }
    }
    const listed: readonly string[] = BATTLE_EVENT_KINDS;
    assertEquals(listed.filter((kind) => !produced.has(kind)), [], "a variant nothing produces");
    assertEquals([...produced].filter((kind) => !listed.includes(kind)), [], "an unlisted kind");
    assert(produced.size > 1, "the recordings exercise more than one variant");
});
