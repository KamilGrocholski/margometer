/**
 * The running fight's own combatants, copied for a recording.
 *
 * The battles here are written by hand in the shape the client holds, and the last case holds the
 * snapshots the recordings carry to what the same calls' payloads state.
 */

import {
    assert,
    assertEquals,
    assertFalse,
    assertNotStrictEquals,
    assertStrictEquals,
} from "@std/assert";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import { readPayloadEnvelope } from "#/src/game/payload-envelope.ts";
import { readWarriorSnapshot, WARRIOR_FAILURE } from "#/src/game/warrior-snapshot.ts";
import { readRecordedFights } from "#/tests/recorded-fights.ts";

/** The fields every recording's snapshot carries, in the order it carries them. */
const RECORDED_KEYS = ["id", "name", "team", "prof", "lvl", "hp", "mana", "energy", "ac"];

function composeWarrior(id: number, name: string): Record<string, unknown> {
    return {
        id,
        name,
        team: 1,
        prof: "w",
        lvl: 60,
        hp: { max: 100, cur: 90 },
        mana: 5,
        energy: 6,
        ac: { cur: 3 },
        npc: 0,
        engine: { page: "held by reference" },
    };
}

function readNames(battle: unknown): unknown[] {
    const snapshot = readWarriorSnapshot(battle);
    assert(snapshot.ok, "the battle states a collection of warriors");
    return snapshot.value.map((one) => one.name);
}

Deno.test("the list the client fills is asked first, and the other where it says nothing", () => {
    const listed = {
        warriorsList: { 1: composeWarrior(1, "A") },
        warriors: { 2: composeWarrior(2, "B") },
    };
    assertEquals(readNames(listed), ["A"], "`warriorsList` answers first");
    const empty = { warriorsList: {}, warriors: { 2: composeWarrior(2, "B") } };
    assertEquals(readNames(empty), ["B"], "and `warriors` where the first holds nobody");
    const unnamed = { warriorsList: { 1: { id: 1 } }, warriors: { 2: composeWarrior(2, "B") } };
    assertEquals(readNames(unnamed), ["B"], "and where the first holds nobody named");
});

Deno.test("a warrior with no name is passed over, and the rest of the fight is read", () => {
    const battle = {
        warriorsList: {
            1: composeWarrior(1, "A"),
            2: { ...composeWarrior(2, ""), name: "" },
            3: { ...composeWarrior(3, "C"), name: 7 },
            4: "not a warrior",
            5: composeWarrior(5, "E"),
        },
    };
    assertEquals(readNames(battle), ["A", "E"], "only those the client named");
});

Deno.test("a fight holding no collection of warriors is refused, not read as nobody", () => {
    const absent = { kind: WARRIOR_FAILURE.warriorsAbsent };
    assertEquals(readWarriorSnapshot(null), { ok: false, error: absent }, "no battle at all");
    assertEquals(readWarriorSnapshot([]), { ok: false, error: absent }, "a list is no battle");
    assertEquals(readWarriorSnapshot({}), { ok: false, error: absent }, "no collection");
    const nobody = { warriorsList: { 1: { id: 1 } }, warriors: [composeWarrior(1, "A")] };
    assertEquals(readWarriorSnapshot(nobody), { ok: false, error: absent }, "and none named");
});

Deno.test("a fight of twenty is read, and one of twenty-one is refused", () => {
    const cast = (count: number) =>
        Object.fromEntries(
            Array.from({ length: count }, (_, at) => [at + 1, composeWarrior(at + 1, `P${at}`)]),
        );
    const full = readWarriorSnapshot({ warriorsList: cast(COMBATANTS_MAXIMUM) });
    assert(full.ok, "a full fight is read");
    assertStrictEquals(full.value.length, COMBATANTS_MAXIMUM, "everybody in it");
    const past = readWarriorSnapshot({ warriorsList: cast(COMBATANTS_MAXIMUM + 1) });
    assertEquals(past, {
        ok: false,
        error: {
            kind: WARRIOR_FAILURE.warriorsExceeded,
            count: COMBATANTS_MAXIMUM + 1,
            maximum: COMBATANTS_MAXIMUM,
        },
    }, "one past it is refused, saying by how much");
});

Deno.test("what the game goes on changing is copied, not held by reference", () => {
    const warrior = composeWarrior(1, "A");
    const battle = { warriorsList: { 1: warrior } };
    const snapshot = readWarriorSnapshot(battle);
    assert(snapshot.ok, "the fight is read");
    const [held] = snapshot.value;
    assert(held !== undefined, "with its one warrior");
    assertNotStrictEquals(held.hp, warrior.hp, "health is a copy");
    assertNotStrictEquals(held.ac, warrior.ac, "and so is armour");
    Object.assign(warrior.hp as object, { cur: 10 });
    Object.assign(warrior.ac as object, { cur: 0 });
    assertEquals(held.hp, { max: 100, cur: 90 }, "the snapshot keeps health as it stood");
    assertEquals(held.ac, { cur: 3 }, "and armour as it stood");
    assertFalse("engine" in held, "and nothing reaching back into the page is kept");
});

Deno.test("an id is read where it is stated, and the original one where it is not", () => {
    const stated = readWarriorSnapshot({ warriorsList: { 1: composeWarrior(1, "A") } });
    assert(stated.ok, "a warrior with an id is read");
    assertStrictEquals(stated.value[0]?.id, 1, "under it");
    const { id: _, ...unnumbered } = composeWarrior(1, "A");
    const original = readWarriorSnapshot({ warriorsList: { 1: { ...unnumbered, originalId: 7 } } });
    assert(original.ok, "and one carrying only the id it was cloned from");
    assertStrictEquals(original.value[0]?.id, 7, "is read under that");
    const both = readWarriorSnapshot({
        warriorsList: { 1: { ...composeWarrior(3, "A"), originalId: 7 } },
    });
    assert(both.ok, "one carrying both is read");
    assertStrictEquals(both.value[0]?.id, 3, "under its own");
    const nameless = readWarriorSnapshot({ warriorsList: { 1: unnumbered } });
    assert(nameless.ok, "one stating neither is read all the same");
    assertStrictEquals(nameless.value[0]?.id, null, "and says it could not be numbered");
});

Deno.test("a snapshot is written in the fields and the order the recordings carry", () => {
    const snapshot = readWarriorSnapshot({ warriorsList: { 1: { name: "A" } } });
    assert(snapshot.ok, "a warrior stating only a name is read");
    const [held] = snapshot.value;
    assertEquals(Object.keys(held ?? {}), RECORDED_KEYS, "every recorded field, in order");
    assertStrictEquals(
        held?.hp,
        null,
        "and what the client did not state is null, never undefined",
    );
    assertStrictEquals(held?.team, null, "a plain field as much as a live object");
    assertStrictEquals(
        held?.mana,
        null,
        "which a file then writes, where undefined writes nothing",
    );
    let checked = 0;
    for (const fight of readRecordedFights()) {
        const document = JSON.parse(readRecordedText(fight.path));
        for (const call of document.calls ?? []) {
            for (const combatant of call.combatantsAfter ?? []) {
                assertEquals(Object.keys(combatant), RECORDED_KEYS, `${fight.path}: a snapshot`);
                checked += 1;
            }
        }
    }
    assert(checked > 0, "the recordings carry snapshots to compare against");
});

/** The recording as git holds it, for the snapshots `tests/recorded-fights.ts` folds away. */
function readRecordedText(path: string): string {
    const args = ["show", `fa1dcce:${path}`];
    const output = new Deno.Command("git", { args, stdout: "piped" }).outputSync();
    assert(output.success, `git show ${path}`);
    return new TextDecoder().decode(output.stdout);
}

Deno.test("what a payload states about a combatant is what the snapshot states", () => {
    let compared = 0;
    let withoutSnapshot = 0;
    for (const fight of readRecordedFights()) {
        const snapshots = new Map(fight.combatants.map((one) => [one.id, one]));
        for (const update of fight.updates) {
            const record = readPayloadEnvelope(update);
            assert(record.ok, `${fight.path}: a recorded call is read`);
            for (const combatant of record.value.combatants) {
                const snapshot = snapshots.get(combatant.id);
                if (snapshot === undefined) {
                    withoutSnapshot += 1;
                    // A fight the game had already run itself arrives in a single call and
                    // snapshots nobody, so its whole cast is held back and none of it compared.
                    assertEquals(
                        snapshots.size,
                        0,
                        `${fight.path}: only a fight snapshotting nobody`,
                    );
                    continue;
                }
                assertEquals(
                    combatant,
                    snapshot,
                    `${fight.path}: the two shapes state one combatant`,
                );
                compared += 1;
            }
        }
    }
    assert(compared > 100, "the recordings state their people twice over, and often");
    assertEquals(withoutSnapshot, 14, "and all of them in the recordings that snapshot nobody");
});
