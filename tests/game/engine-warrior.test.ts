/**
 * The client's own field names, read out of the payloads the recordings carry.
 *
 * A recording holds the same combatants twice over — in the payload the engine received and in
 * the snapshot taken after it — so what this reader makes of one can be held against the other.
 */

import { assert, assertEquals } from "@std/assert";
import { readCombatantFromWarrior, readCombatantsFromPayload } from "@/src/game/engine-warrior.ts";
import {
    getRecordedCombatants,
    getRecordedEngineUpdates,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

/** The one recording whose calls carry no snapshot at all, so nothing can be held against them. */
const NO_SNAPSHOTS =
    "captures/2026-08-24-tempest-tropiciel-vs-centaury-auto-1786514810315-0.8.1.json";

Deno.test("a warrior missing what a row needs is refused, not filled in", () => {
    const whole = { id: 1, name: "Gracz 1", team: 2, prof: "w", lvl: 40, hp: { max: 745 } };
    assertEquals(readCombatantFromWarrior(whole)?.healthMaximum, 745, "a whole warrior reads");
    assertEquals(readCombatantFromWarrior({ ...whole, team: undefined }), null, "no side, no row");
    assertEquals(readCombatantFromWarrior({ ...whole, name: "" }), null, "an empty name is none");
    assertEquals(readCombatantFromWarrior(null), null, "and `null` is not a warrior");
    const bare = readCombatantFromWarrior({ id: 1, name: "Gracz 1", team: 2 });
    assertEquals(bare?.healthMaximum, null, "what the game did not state stays unstated");
    assertEquals(bare?.level, null, "rather than standing in as a zero");
});

Deno.test("a cast is a cast, keyed by id or listed in order", () => {
    const whole = { id: 1, name: "Gracz 1", team: 2, prof: "w", lvl: 40, hp: { max: 745 } };
    const keyed = readCombatantsFromPayload({ w: { "1": whole } });
    const listed = readCombatantsFromPayload({ w: [whole] });
    assertEquals(keyed.length, 1, "the client keys them by id, which is what every payload does");
    assertEquals(listed, keyed, "and a list of the same people reads as the same cast");
    assertEquals(readCombatantsFromPayload({ w: "one" }), [], "text is neither, and states nobody");
});

Deno.test("a payload states the whole cast or none of it", () => {
    assertEquals(readCombatantsFromPayload(null), [], "nothing is not a payload");
    assertEquals(readCombatantsFromPayload([]), [], "a list is not a payload either");
    assertEquals(readCombatantsFromPayload({}), [], "and neither is a payload with no warriors");
    let whole = 0;
    let moved = 0;
    for (const path of getRecordingPaths()) {
        for (const update of getRecordedEngineUpdates(path)) {
            if (readCombatantsFromPayload(update).length > 0) whole += 1;
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
            for (const combatant of readCombatantsFromPayload(update)) {
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
