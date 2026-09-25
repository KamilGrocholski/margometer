/**
 * The client's own field names on one warrior entry, read into the roster's shape, with the mask
 * and the charge the entry carries.
 *
 * A payload restates only what moved, so an entry missing what the roster needs is passed over:
 * that is how the game writes, and never a fault in what it wrote.
 */

import { assert, assertEquals } from "@std/assert";
import { readWarriorEntries } from "#/src/game/engine-warrior.ts";
import { readPayloadEnvelope } from "#/src/game/payload-envelope.ts";
import { readRecordedFights } from "#/tests/recorded-fights.ts";

const WHOLE = { id: 1, name: "Gracz 1", team: 2, prof: "w", lvl: 40, hp: { max: 745 } };

Deno.test("a warrior missing what a row needs is passed over, not filled in", () => {
    assertEquals(readOne(WHOLE)?.healthMaximum, 745, "a whole warrior reads");
    assertEquals(readOne({ ...WHOLE, team: undefined }), null, "no side, no row");
    assertEquals(readOne({ ...WHOLE, name: "" }), null, "an empty name is none");
    assertEquals(readOne({ ...WHOLE, name: 7 }), null, "and a name that is no text is none");
    assertEquals(readOne({ ...WHOLE, id: "1" }), null, "an id that is no number is none");
    assertEquals(readOne(null), null, "and `null` is not a warrior");
    const bare = readOne({ id: 1, name: "Gracz 1", team: 2 });
    assertEquals(bare?.healthMaximum, null, "what the game did not state stays unstated");
    assertEquals(bare?.level, null, "rather than standing in as a zero");
    assertEquals(bare?.profession, null, "and a profession nobody stated is none");
});

function readOne(entry: unknown) {
    return readWarriorEntries([entry]).combatants[0] ?? null;
}

Deno.test("a cast is a cast, keyed by id or listed in order", () => {
    const keyed = readPayloadEnvelope({ w: { "1": WHOLE } });
    const listed = readPayloadEnvelope({ w: [WHOLE] });
    assert(keyed.ok, "the client keys them by id, which is what every payload does");
    assert(listed.ok, "and a list of the same people is read");
    assertEquals(keyed.value.combatants.length, 1, "one combatant");
    assertEquals(listed.value.combatants, keyed.value.combatants, "the same cast either way");
});

Deno.test("a payload states the whole cast or none of it", () => {
    let whole = 0;
    let moved = 0;
    const fights = readRecordedFights();
    for (const fight of fights) {
        for (const update of fight.updates) {
            const record = readPayloadEnvelope(update);
            assert(record.ok, `${fight.path}: a recorded call is read`);
            if (record.value.combatants.length > 0) whole += 1;
            else moved += 1;
        }
    }
    assertEquals(whole, fights.length, "each recording opens with its cast, once");
    assert(moved > whole, "and every call after it states only what moved");
});

Deno.test("a pool of nothing is a pool nobody stated, never an assertion", () => {
    assertEquals(readOne({ ...WHOLE, hp: { max: 0 } })?.healthMaximum, null, "nothing");
    assertEquals(readOne({ ...WHOLE, hp: { max: -5 } })?.healthMaximum, null, "below it");
    assertEquals(readOne({ ...WHOLE, hp: { max: 1 } })?.healthMaximum, 1, "and one is a pool");
});

/**
 * ⚠️ **A combatant who has fallen carries nothing, whatever their mask still says.** The payload
 * goes on stating one (44 entries of 113 at zero health carry a lit mask over `captures/`,
 * 2026-09-22), and the client takes the icons down at exactly that point.
 */
Deno.test("a combatant at nothing carries nothing, whatever their mask states", () => {
    assertEquals(readMasks({ cur: 0, max: 500 }, 64), [[11, 0]], "clear rather than lit");
});

/** A payload's own entry for one combatant, in the shape every recording carries. */
function readMasks(health: unknown, mask: unknown): [number, number][] {
    const entry = { id: 11, name: "Gracz 1", team: 1, hp: health, buffs: mask };
    return [...readWarriorEntries([entry]).statusMasksByCombatantId];
}

/** W5: zero is a boundary. One point left is somebody standing, and they keep what they hold. */
Deno.test("a combatant on their last point is standing, and keeps what they carry", () => {
    assertEquals(readMasks({ cur: 1, max: 500 }, 64), [[11, 64]], "a point is not nothing");
});

/** Saying nothing about health is not saying they fell: silence there is not read as a zero. */
Deno.test("an entry stating no health at all states its mask like any other", () => {
    assertEquals(readMasks(undefined, 32), [[11, 32]], "the mask stands");
});

Deno.test("a mask that is no whole count of bits is no mask", () => {
    assertEquals(readMasks(undefined, -1), [], "below nothing");
    assertEquals(readMasks(undefined, 1.5), [], "a fraction");
    assertEquals(readMasks(undefined, "64"), [], "and text");
    assertEquals(readMasks(undefined, 0), [[11, 0]], "while nothing lit is a mask");
});

Deno.test("a charge is read in full, or as none", () => {
    const full = { name: "Cios", turn: 1, total_turns: 3 };
    assertEquals(readCharge(full), {
        combatantId: 5,
        charge: { skillName: "Cios", turnsElapsed: 1, turnsStated: 3 },
    }, "all three stated");
    assertEquals(readCharge(undefined).charge, null, "an entry stating none ends one");
    assertEquals(readCharge({ ...full, name: "" }).charge, null, "a nameless charge is none");
    assertEquals(readCharge({ ...full, turn: undefined }).charge, null, "half the pair is none");
    assertEquals(readCharge({ ...full, total_turns: "3" }).charge, null, "and so is text");
    assertEquals(readCharge({ ...full, turn: -1 }).charge, null, "a count below nothing is none");
    assertEquals(readCharge({ ...full, turn: 4 }).charge, null, "and one past the whole is none");
    assertEquals(readCharge({ ...full, turn: 3 }).charge?.turnsElapsed, 3, "the whole is not");
    assertEquals(readCharge({ ...full, turn: 0 }).charge?.turnsElapsed, 0, "nor is none elapsed");
});

function readCharge(stated: unknown) {
    const entry = { id: 5, super_cast: stated };
    const [statement] = readWarriorEntries([entry]).chargeStatements;
    assert(statement !== undefined, "every entry with an id states a charge or none");
    return statement;
}

Deno.test("an entry naming nobody by id states nothing about anybody", () => {
    const nameless = { name: "Gracz 1", team: 1, buffs: 4, super_cast: { name: "Cios" } };
    const reading = readWarriorEntries([nameless]);
    assertEquals(reading.combatants, [], "no combatant");
    assertEquals([...reading.statusMasksByCombatantId], [], "no mask");
    assertEquals(reading.chargeStatements, [], "and no charge, because nobody holds it");
});
