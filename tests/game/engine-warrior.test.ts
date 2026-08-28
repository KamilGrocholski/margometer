/**
 * The client's own field names, read out of the payloads the recordings carry.
 *
 * A recording holds the same combatants twice over — in the payload the engine received and in
 * the snapshot taken after it — so what this reader makes of one can be held against the other.
 */

import { assert, assertEquals } from "@std/assert";
import { getCombatantFromWarrior, getCombatantsFromPayload } from "@/src/game/engine-warrior.ts";
import {
    getRecordedCombatants,
    getRecordedEngineUpdates,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

/** The one recording whose calls carry no snapshot at all, so nothing can be held against them. */
const NO_SNAPSHOTS = "captures/2026-08-24-tempest-tropiciel-vs-centaury-auto.json";

Deno.test("a warrior missing what a row needs is refused, not filled in", () => {
    const whole = { id: 1, name: "Gracz 1", team: 2, prof: "w", lvl: 40, hp: { max: 745 } };
    assertEquals(getCombatantFromWarrior(whole)?.healthMaximum, 745, "a whole warrior reads");
    assertEquals(getCombatantFromWarrior({ ...whole, team: undefined }), null, "no side, no row");
    assertEquals(getCombatantFromWarrior({ ...whole, name: "" }), null, "an empty name is none");
    assertEquals(getCombatantFromWarrior(null), null, "and `null` is not a warrior");
    const bare = getCombatantFromWarrior({ id: 1, name: "Gracz 1", team: 2 });
    assertEquals(bare?.healthMaximum, null, "what the game did not state stays unstated");
    assertEquals(bare?.level, null, "rather than standing in as a zero");
});

Deno.test("a payload states the whole cast or none of it", () => {
    assertEquals(getCombatantsFromPayload(null), [], "nothing is not a payload");
    assertEquals(getCombatantsFromPayload({}), [], "and neither is a payload with no warriors");
    let whole = 0;
    let moved = 0;
    for (const path of getRecordingPaths()) {
        for (const update of getRecordedEngineUpdates(path)) {
            if (getCombatantsFromPayload(update).length > 0) whole += 1;
            else moved += 1;
        }
    }
    assertEquals(whole, getRecordingPaths().length, "each recording opens with its cast, once");
    assert(moved > whole, "and every call after it states only what moved");
});

Deno.test("what a payload states about a combatant is what the snapshot states", () => {
    let compared = 0;
    let withoutSnapshot = 0;
    for (const path of getRecordingPaths()) {
        const snapshots = new Map(getRecordedCombatants(path).map((one) => [one.id, one]));
        for (const update of getRecordedEngineUpdates(path)) {
            for (const combatant of getCombatantsFromPayload(update)) {
                const snapshot = snapshots.get(combatant.id);
                if (snapshot === undefined) {
                    withoutSnapshot += 1;
                    assertEquals(path, NO_SNAPSHOTS, "only that one recording holds nothing back");
                    continue;
                }
                assertEquals(combatant, snapshot, `${path}: the two shapes state one combatant`);
                compared += 1;
            }
        }
    }
    assert(compared > 100, "the recordings state their people twice over, and often");
    assertEquals(withoutSnapshot, 3, "three, and all of them in the recording with no snapshots");
});
