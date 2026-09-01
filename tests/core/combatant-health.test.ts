/**
 * The health arithmetic, against the client's own three figures.
 *
 * Every snapshot in `captures/` states health, its maximum and the percentage the protocol would
 * carry — so the reading can be checked against the client rather than against itself.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import {
    composeFightEntryHealth,
    composeTeamHeals,
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
            assertExists(health, `${path}: a stated maximum reads`);
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
            assertExists(held, `${path}: ${combatant.id} was never stated`);
            assertExists(combatant.healthMaximum, `${path}: and has a pool`);
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

/** A side of two and an opponent, so a cast has somebody to reach and somebody to miss. */
function composeSideRoster() {
    return composeCombatantRoster([
        { id: 1, name: "Gracz 1", side: 1, profession: "w", level: 40, healthMaximum: 23874 },
        { id: 2, name: "Gracz 2", side: 1, profession: "m", level: 40, healthMaximum: 10000 },
        { id: 3, name: "Potwór", side: 2, profession: "w", level: 40, healthMaximum: 50000 },
    ]);
}

Deno.test("a share is of the maximum, floored, and reaches the caster's own side", () => {
    const roster = composeSideRoster();
    const events = decodeFightMessages([
        "1=100.00;2=100.00;tspell=Coś;skillId=1",
        "1=50.00;0;poison=11937",
        "2=50.00;0;poison=5000",
        "3=100.00;0;step",
        "1=50.00;1=50.00;tspell=Zdrowa atmosfera;skillId=79;healall_per=30",
    ], roster);
    const heals = [...composeTeamHeals(events, roster).values()];
    assertEquals(heals.length, 1, "one cast");
    assertEquals(
        heals[0]?.restoredByCombatantId.get(1),
        7162,
        "thirty hundredths of 23874, floored",
    );
    assertEquals(heals[0]?.restoredByCombatantId.get(2), 3000, "and of 10000 for the other");
    assertEquals(heals[0]?.restoredByCombatantId.has(3), false, "the other side is not reached");
    assertEquals(heals[0]?.isWhole, true, "and every member of the side was sized");
});

Deno.test("a cast cannot put back more than a combatant walked in with", () => {
    const roster = composeSideRoster();
    const events = decodeFightMessages([
        "1=100.00;2=100.00;tspell=Coś;skillId=1",
        "1=95.00;0;poison=1194",
        "2=50.00;0;poison=5000",
        "1=95.00;1=95.00;tspell=Zdrowa atmosfera;skillId=79;healall_per=30",
    ], roster);
    const heals = [...composeTeamHeals(events, roster).values()];
    assertEquals(
        heals[0]?.restoredByCombatantId.get(1),
        1194,
        "what was lost, not what a share is",
    );
    assertEquals(
        heals[0]?.restoredByCombatantId.get(2),
        3000,
        "while the share still binds below it",
    );
});

Deno.test("a member nobody can size leaves the cast saying so", () => {
    const roster = composeCombatantRoster([
        { id: 1, name: "Gracz 1", side: 1, profession: "w", level: 40, healthMaximum: 1000 },
        { id: 2, name: "Gracz 2", side: 1, profession: "m", level: 40, healthMaximum: null },
    ]);
    const events = decodeFightMessages([
        "1=100.00;0;step",
        "2=100.00;0;step",
        "1=50.00;0;poison=500",
        "1=50.00;1=50.00;tspell=Zdrowa atmosfera;skillId=79;healall_per=30",
    ], roster);
    const heals = [...composeTeamHeals(events, roster).values()];
    assertEquals(heals[0]?.restoredByCombatantId.get(1), 300, "the one that could be sized is");
    assertEquals(heals[0]?.restoredByCombatantId.has(2), false, "the one that could not is not");
    assertEquals(heals[0]?.isWhole, false, "and the cast goes on saying it is short");
});

Deno.test("a cast on a side a reducer reached is refused whole", () => {
    const roster = composeSideRoster();
    const reduced = decodeFightMessages([
        "1=100.00;0;step",
        "2=100.00;0;step",
        "3=100.00;3=100.00;tspell=Jadowity podmuch;skillId=219;lowheal_per-enemies=27",
        "1=50.00;0;poison=11937",
        "1=50.00;1=50.00;tspell=Zdrowa atmosfera;skillId=79;healall_per=30",
    ], roster);
    assertEquals(composeTeamHeals(reduced, roster).size, 0, "nothing is sized where it was cut");

    const theirOwn = decodeFightMessages([
        "1=100.00;0;step",
        "2=100.00;0;step",
        "1=100.00;3=100.00;tspell=Jadowity podmuch;skillId=219;lowheal_per-enemies=27",
        "1=50.00;0;poison=11937",
        "1=50.00;1=50.00;tspell=Zdrowa atmosfera;skillId=79;healall_per=30",
    ], roster);
    assertEquals(
        composeTeamHeals(theirOwn, roster).size,
        1,
        "a reducer of ours cuts theirs, not ours",
    );
});

Deno.test("every cast in the recordings is sized, and the cap is what does the work", () => {
    let casts = 0;
    let whole = 0;
    let capped = 0;
    let atShare = 0;
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const events = getRecordedPayloads(path).flatMap((one) => decodeFightMessages(one, roster));
        for (const heal of composeTeamHeals(events, roster).values()) {
            casts += 1;
            if (heal.isWhole) whole += 1;
            for (const [combatantId, amount] of heal.restoredByCombatantId) {
                const maximum = roster.byId.get(combatantId)?.healthMaximum ?? 0;
                if (amount < Math.floor(heal.declaredShare * maximum / 100)) capped += 1;
                else atShare += 1;
            }
        }
    }
    assertEquals(casts, 115, "every occurrence the corpus holds is sized");
    assertEquals(whole, casts, "and every one of them reaches its whole side");
    assert(capped > atShare, "the cap binds more figures than the share does");
});
