/**
 * The health arithmetic, against the client's own three figures.
 *
 * Every snapshot in `captures/` states health, its maximum and the percentage the protocol would
 * carry — so the reading can be checked against the client rather than against itself.
 */

import { assert, assertEquals } from "@std/assert";
import {
    getHealthFromPercent,
    getHealthToleranceFromMaximum,
} from "@/src/core/combatant-health.ts";
import { getRecordedHealthReadings, getRecordingPaths } from "@/tests/recorded-fight.ts";

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
