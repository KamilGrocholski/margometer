/**
 * What the decoder read, against the percentages the protocol states about itself.
 *
 * This is the only check on these figures that does not come from the same reading that produced
 * them: the protocol restates where a combatant stands every time it names them, and the
 * snapshots state the maximum. Where the two disagree, the disagreement is the finding.
 */

import { assert, assertEquals } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
    getHealthFromPercent,
    getHealthToleranceFromMaximum,
} from "@/src/core/combatant-health.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import {
    getRecordedCombatants,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

/** The one key the decoder still names unread, and the reason health can appear from nowhere. */
const UNSIZED_SHARE_KEY = "healall_per";
/** Two readings, each standing for a band of its own, so the distance between them is doubled. */
const READINGS_COMPARED = 2;

interface WitnessReading {
    compared: number;
    agreed: number;
    died: number;
    appeared: number;
    vanished: string[];
    unexplained: string[];
}

/** Where a combatant stands, as each event states it. */
function getStatedHealth(event: BattleEvent): [number, number][] {
    const stated: [number, number][] = [];
    if (event.kind === "attack" || event.kind === "skill-used") {
        if (event.actorId !== null && event.actorHealthPercent !== null) {
            stated.push([event.actorId, event.actorHealthPercent]);
        }
        if (event.targetId !== null && event.targetHealthPercent !== null) {
            stated.push([event.targetId, event.targetHealthPercent]);
        }
    }
    if (event.kind === "health-change" || event.kind === "declaration") {
        if (event.combatantId !== null && event.healthPercent !== null) {
            stated.push([event.combatantId, event.healthPercent]);
        }
    }
    if (event.kind === "damage-to-named-combatant" || event.kind === "healing-to-named-combatant") {
        if (event.targetId !== null && event.targetHealthPercent !== null) {
            stated.push([event.targetId, event.targetHealthPercent]);
        }
    }
    return stated;
}

/** Health the event moved, signed: restored is positive and lost is negative. */
function getMovedHealth(event: BattleEvent): [number, number][] {
    if (event.kind === "attack" && event.targetId !== null) {
        let applied = 0;
        for (const figure of event.applied) applied += figure.amount;
        return [[event.targetId, -applied]];
    }
    if (event.kind === "damage-to-named-combatant" && event.targetId !== null) {
        return [[event.targetId, -event.damage.amount]];
    }
    if (event.kind === "health-change" && event.combatantId !== null) {
        return [[event.combatantId, event.amount]];
    }
    if (event.kind === "healing-to-named-combatant" && event.targetId !== null) {
        return [[event.targetId, event.amount]];
    }
    return [];
}

interface Comparison {
    path: string;
    combatantId: number;
    healthMaximum: number;
    percentBefore: number;
    percentAfter: number;
    moved: number;
    carriesUnsizedShare: boolean;
}

/**
 * Three kinds of disagreement have an answer, and each is the protocol's rather than ours: a
 * killing blow lands more than the health that was left, a share this decoder cannot size
 * restores health nobody can place, and one payload moves health with no message at all.
 */
function addComparison(reading: WitnessReading, one: Comparison): void {
    const wasAt = getHealthFromPercent(one.percentBefore, one.healthMaximum);
    const isAt = getHealthFromPercent(one.percentAfter, one.healthMaximum);
    assert(wasAt !== null, `${one.path}: a maximum that was read`);
    assert(isAt !== null, `${one.path}: a maximum that was read`);
    reading.compared += 1;
    const stated = isAt - wasAt;
    const tolerance = getHealthToleranceFromMaximum(one.healthMaximum) * READINGS_COMPARED;
    if (Math.abs(stated - one.moved) <= tolerance) {
        reading.agreed += 1;
        return;
    }
    const found = `${one.path} ${one.combatantId}: stated ${stated}, read ${one.moved}`;
    if (one.percentAfter === 0) reading.died += 1;
    else if (stated < one.moved) reading.vanished.push(found);
    else if (one.carriesUnsizedShare) reading.appeared += 1;
    else reading.unexplained.push(found);
}

function witnessRecording(path: string, reading: WitnessReading): void {
    const combatants = getRecordedCombatants(path);
    const roster = composeCombatantRoster(combatants);
    const maximumById = new Map(combatants.map((one) => [one.id, one.healthMaximum]));
    const payloads = getRecordedPayloads(path);
    const carriesUnsizedShare = payloads.some((payload) =>
        payload.some((message) => message.includes(UNSIZED_SHARE_KEY))
    );
    const percentById = new Map<number, number>();
    const pendingById = new Map<number, number>();
    for (const payload of payloads) {
        for (const message of payload) {
            const statedHere = new Map<number, number>();
            for (const event of decodeFightMessages([message], roster)) {
                for (const [id, amount] of getMovedHealth(event)) {
                    pendingById.set(id, (pendingById.get(id) ?? 0) + amount);
                }
                for (const [id, percent] of getStatedHealth(event)) statedHere.set(id, percent);
            }
            for (const [combatantId, percentAfter] of statedHere) {
                const percentBefore = percentById.get(combatantId);
                const healthMaximum = maximumById.get(combatantId) ?? null;
                const moved = pendingById.get(combatantId) ?? 0;
                percentById.set(combatantId, percentAfter);
                pendingById.set(combatantId, 0);
                if (percentBefore === undefined) continue;
                if (healthMaximum === null) continue;
                addComparison(reading, {
                    path,
                    combatantId,
                    healthMaximum,
                    percentBefore,
                    percentAfter,
                    moved,
                    carriesUnsizedShare,
                });
            }
        }
    }
}

Deno.test("what was read agrees with the health the protocol states about itself", () => {
    const reading: WitnessReading = {
        compared: 0,
        agreed: 0,
        died: 0,
        appeared: 0,
        vanished: [],
        unexplained: [],
    };
    for (const path of getRecordingPaths()) witnessRecording(path, reading);
    assert(reading.compared > 1000, "the recordings state health often enough to be checked");
    assertEquals(reading.unexplained, [], "a disagreement with no answer of the protocol's own");
    assert(reading.agreed * 20 > reading.compared * 19, "and the great majority agree outright");
    assert(reading.died > 0, "a killing blow lands more than the health that was left");
    assert(reading.appeared > 0, "and a share nobody can size restores health nobody can place");
});

Deno.test("one payload moves health with no message saying so, and it is pinned here", () => {
    const reading: WitnessReading = {
        compared: 0,
        agreed: 0,
        died: 0,
        appeared: 0,
        vanished: [],
        unexplained: [],
    };
    for (const path of getRecordingPaths()) witnessRecording(path, reading);
    assertEquals(reading.vanished.length, 1, "the material carries exactly one, and it is known");
    assert(
        reading.vanished[0]?.includes("2026-08-06-tempest-grupa-vs-hildur"),
        "entry 83 of that fight: the boss loses 8062 with both its messages about other people",
    );
});
