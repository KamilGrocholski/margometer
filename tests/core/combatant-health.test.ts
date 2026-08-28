/**
 * The health arithmetic, against the client's own three figures.
 *
 * Every snapshot in `captures/` states health, its maximum and the percentage the protocol would
 * carry — so the reading can be checked against the client rather than against itself.
 */

import { assert, assertEquals } from "@std/assert";
import {
    composeFightEntryHealth,
    getHealthFromPercent,
    getHealthToleranceFromMaximum,
    getStatedHealthFromEvent,
} from "@/src/core/combatant-health.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import {
    getRecordedCombatants,
    getRecordedHealthReadings,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

const PERCENT_PLACES = 100;

Deno.test("zero is a reading, and a maximum nobody stated is not", () => {
    assertEquals(getHealthFromPercent(0, 745), 0, "nothing left is a measurement");
    assertEquals(getHealthFromPercent(100, 745), 745, "a full pool reads back exactly");
    assertEquals(getHealthFromPercent(50, 745), 373, "a half is rounded, not truncated");
    assertEquals(getHealthFromPercent(50, null), null, "no maximum, no reading, and never zero");
    assertEquals(getHealthToleranceFromMaximum(0), 1, "a pool of nothing still rounds");
    assertEquals(getHealthToleranceFromMaximum(745), 1, "a small pool is read to the point");
});

Deno.test("a wider pool is read less exactly, and says so", () => {
    assert(
        getHealthToleranceFromMaximum(325584) > getHealthToleranceFromMaximum(745),
        "the band a percentage stands for is a share of the pool",
    );
    assertEquals(getHealthToleranceFromMaximum(325584), 17, "the widest pool in `captures/`");
});

Deno.test("the client's own percentage is its health rounded to two places", () => {
    let read = 0;
    for (const path of getRecordingPaths()) {
        for (const reading of getRecordedHealthReadings(path)) {
            assert(reading.healthMaximum > 0, `${path}: a pool of nothing`);
            const exact = (reading.health / reading.healthMaximum) * 100;
            const rounded = Math.round(exact * PERCENT_PLACES) / PERCENT_PLACES;
            assertEquals(reading.healthPercent, rounded, `${path}: ${reading.combatantId}`);
            read += 1;
        }
    }
    assert(read > 0, "the recordings state health");
});

Deno.test("a stated percentage reads back to the health the client holds", () => {
    let exact = 0;
    let approximate = 0;
    for (const path of getRecordingPaths()) {
        for (const reading of getRecordedHealthReadings(path)) {
            const health = getHealthFromPercent(reading.healthPercent, reading.healthMaximum);
            assert(health !== null, `${path}: a stated maximum reads`);
            const distance = Math.abs(health - reading.health);
            const tolerance = getHealthToleranceFromMaximum(reading.healthMaximum);
            assert(distance <= tolerance, `${path}: ${distance} past a bound of ${tolerance}`);
            if (distance === 0) exact += 1;
            else approximate += 1;
        }
    }
    assert(exact > approximate, "most readings land on the figure itself");
    assert(approximate > 0, "and some do not, which is the whole reason for a tolerance");
});

Deno.test("every combatant in every recording is stated before anything happens to them", () => {
    let entered = 0;
    let full = 0;
    let hurt = 0;
    for (const path of getRecordingPaths()) {
        const cast = getRecordedCombatants(path);
        const roster = composeCombatantRoster(cast);
        const events = getRecordedPayloads(path).flatMap((one) => decodeFightMessages(one, roster));
        const health = composeFightEntryHealth(events, roster);
        for (const combatant of cast) {
            const held = health.get(combatant.id);
            assert(held !== undefined, `${path}: ${combatant.id} was never stated`);
            assert(combatant.healthMaximum !== null, `${path}: and has a pool`);
            assert(held <= combatant.healthMaximum, `${path}: nobody enters above their own pool`);
            entered += 1;
            if (held === combatant.healthMaximum) full += 1;
            else hurt += 1;
        }
    }
    assert(entered > 200, "the recordings hold enough people to say this of");
    assert(full > hurt, "most walk in whole");
    assert(hurt > 0, "and some are first stated already short, which is why this is not assumed");
});

Deno.test("what states a combatant first is usually an event with no figure at all", () => {
    const firstBy = new Map<string, number>();
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const seen = new Set<number>();
        for (const payload of getRecordedPayloads(path)) {
            for (const event of decodeFightMessages(payload, roster)) {
                for (const [combatantId] of getStatedHealthFromEvent(event)) {
                    if (seen.has(combatantId)) continue;
                    seen.add(combatantId);
                    firstBy.set(event.kind, (firstBy.get(event.kind) ?? 0) + 1);
                }
            }
        }
    }
    // A step and a skill announcement state where somebody stands and no figure of their own,
    // which is the whole reason those two events carry a health percentage at all.
    const quiet = (firstBy.get("declaration") ?? 0) + (firstBy.get("skill-used") ?? 0);
    assert(
        quiet > (firstBy.get("attack") ?? 0),
        "more people are first named by one than by a blow",
    );
    assert(
        (firstBy.get("declaration") ?? 0) > 0,
        "a step states somebody before anything hits them",
    );
    assert((firstBy.get("skill-used") ?? 0) > 0, "and so does an announcement");
});

Deno.test("a combatant nothing states is left out rather than guessed at", () => {
    const roster = composeCombatantRoster([{
        id: 1,
        name: "Gracz 1",
        side: 1,
        profession: "w",
        level: 40,
        healthMaximum: 745,
    }]);
    assertEquals(
        composeFightEntryHealth([], roster).size,
        0,
        "a fight nobody spoke of enters none",
    );
    const unstated = composeFightEntryHealth([{
        kind: "declaration",
        combatantId: 1,
        healthPercent: null,
        declared: [{ effect: "step", amount: null, text: null }],
    }], roster);
    assertEquals(unstated.size, 0, "and neither does an event that names somebody and no health");
});

Deno.test("the first statement is the one that counts, whatever came after", () => {
    const roster = composeCombatantRoster([{
        id: 1,
        name: "Gracz 1",
        side: 1,
        profession: "w",
        level: 40,
        healthMaximum: 1000,
    }]);
    const events = decodeFightMessages(["1=80.00;0;heal=50", "1=30.00;0;poison=500"], roster);
    assertEquals(
        composeFightEntryHealth(events, roster).get(1),
        800,
        "eight tenths, and not three",
    );
    assertEquals(getStatedHealthFromEvent(events[0] ?? events[1] ?? events[0]!)[0]?.[1], 80, "80");
});
