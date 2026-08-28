/**
 * A fight assembled the way the game delivers it: one payload at a time, in order.
 *
 * The recordings hold every call the engine made, so a session fed from them is the add-on's own
 * path end to end — the roster comes from the payloads rather than from the snapshots, which is
 * the difference that matters in the last test here.
 */

import { assert, assertEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import {
    addPayloadToSession,
    composeBattleSession,
    getFightFromSession,
} from "@/src/game/battle-session.ts";
import {
    getRecordedCombatants,
    getRecordedEngineUpdates,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

/** The one recording whose calls carry no snapshot, so its roster can only come from a payload. */
const NO_SNAPSHOTS = "captures/2026-08-24-tempest-tropiciel-vs-centaury-auto.json";

function replay(path: string) {
    const session = composeBattleSession();
    for (const update of getRecordedEngineUpdates(path)) addPayloadToSession(session, update);
    return getFightFromSession(session);
}

Deno.test("a fight nobody has seen is not a fight holding nothing", () => {
    assertEquals(getFightFromSession(composeBattleSession()), null, "there is no fight to read");
    const session = composeBattleSession();
    addPayloadToSession(session, null);
    assertEquals(getFightFromSession(session), null, "and what is not a payload starts none");
});

Deno.test("a recording replayed call by call reads as the whole of itself", () => {
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        let decoded = 0;
        for (const payload of getRecordedPayloads(path)) {
            decoded += decodeFightMessages(payload, roster).length;
        }
        const fight = replay(path);
        assert(fight !== null, `${path}: the replay produced a fight`);
        assertEquals(fight.events.length, decoded, `${path}: the session lost or invented one`);
        assertEquals(fight.payloads, getRecordedEngineUpdates(path).length, `${path}: every call`);
        assert(fight.isOver, `${path}: every recording carries the end of its fight`);
    }
});

Deno.test("a fight that opens replaces the one standing before it", () => {
    const [first, second] = getRecordingPaths();
    assert(first !== undefined && second !== undefined, "two recordings to run together");
    const session = composeBattleSession();
    for (const update of getRecordedEngineUpdates(first)) addPayloadToSession(session, update);
    const opened = getFightFromSession(session);
    for (const update of getRecordedEngineUpdates(second)) addPayloadToSession(session, update);
    const replaced = getFightFromSession(session);
    assert(opened !== null && replaced !== null, "both fights were read");
    assertEquals(replaced.payloads, getRecordedEngineUpdates(second).length, "only the second");
    const alone = replay(second);
    assertEquals(replaced.events.length, alone?.events.length, "and it reads as it would alone");
});

Deno.test("a fight whose calls carry no snapshot still has a cast", () => {
    const fight = replay(NO_SNAPSHOTS);
    assert(fight !== null, "the recording produced a fight");
    assertEquals(getRecordedCombatants(NO_SNAPSHOTS).length, 0, "the snapshots state nobody");
    assertEquals(fight.roster.byId.size, 3, "and the opening payload states all three");
    const placed = fight.events.filter((event) =>
        event.kind === "damage-to-named-combatant" && event.targetId !== null
    );
    assertEquals(placed.length, 1, "so the figure stated against a name lands on somebody");
});
