/**
 * What the decoder read, against the percentages the protocol states about itself.
 *
 * This is the only check on these figures that does not come from the same reading that produced
 * them: the protocol restates where a combatant stands every time it names them, and the
 * snapshots state the maximum. Where the two disagree, the disagreement is the finding.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import type { BattleEvent } from "#/src/core/battle-event.ts";
import {
    deriveHealthFromPercent,
    deriveHealthTolerance,
    getStatedHealthsFromEvent,
    indexTeamHeals,
} from "#/src/core/combatant-health.ts";
import { indexCombatantRoster } from "#/src/core/combatant-roster.ts";
import { decodePayloadMessages } from "#/src/core/fight-decoder.ts";
import { BLOWS_GRANTED } from "#/tests/frozen-tables.ts";
import { readRecordedFights, type RecordedFight } from "#/tests/recorded-fights.ts";

interface WitnessReading {
    compared: number;
    agreed: number;
    died: number;
    appeared: number;
    raised: number;
    vanished: string[];
    unexplained: string[];
}

interface Comparison {
    path: string;
    combatantId: number;
    healthMaximum: number;
    percentBefore: number;
    percentAfter: number;
    moved: number;
    doesCarryUnsizedShare: boolean;
    doesSpanPoolRaise: boolean;
}

/** The one key the decoder still names unread, and the reason health can appear from nowhere. */
const UNSIZED_SHARE_KEY = "healall_per";
/**
 * The key that raises the pool a percentage is read against, once, on the initiation layer. The
 * snapshots state the maximum **after** the raise and the protocol never restates one, so a
 * percentage stated before it is read against a maximum that had not grown yet
 * (`develop:docs/protocol-keys.md`).
 */
const POOL_RAISE_KEY = "hp_per-allies";
/** Two readings, each standing for a band of its own, so the distance between them is doubled. */
const READINGS_COMPARED = 2;

Deno.test("what was read agrees with the health the protocol states about itself", () => {
    const reading: WitnessReading = {
        compared: 0,
        agreed: 0,
        died: 0,
        appeared: 0,
        raised: 0,
        vanished: [],
        unexplained: [],
    };
    for (const fight of readRecordedFights()) witnessRecording(fight, reading);
    assert(reading.compared > 1000, "the recordings state health often enough to be checked");
    assertEquals(reading.unexplained, [], "a disagreement with no answer of the protocol's own");
    // 17,729 of 17,958 as the material stands, 2026-08-28. Stated as a share rather than a count
    // so it survives a recording being admitted, which is what `V4` asks of a figure like this.
    assert(reading.agreed * 50 > reading.compared * 49, "and all but a fiftieth agree outright");
    assert(reading.died > 0, "a killing blow lands more than the health that was left");
    assert(reading.appeared > 0, "and health still appears where a cast could not be sized");
    // The pool raise, which one recording carries: `hp_per-allies` grows the maximum the two
    // percentages either side of it are read against (`develop:docs/protocol-keys.md`).
    assert(reading.raised > 0, "and a pool that grew is read as a maximum that moved");
});

function witnessRecording(fight: RecordedFight, reading: WitnessReading): void {
    const path = fight.path;
    const combatants = fight.combatants;
    const roster = indexCombatantRoster(combatants);
    const healthMaximumById = new Map(combatants.map((one) => [one.id, one.healthMaximum]));
    const payloads = fight.payloads;
    const doesCarryUnsizedShare = payloads.some((payload) =>
        payload.some((message) => message.includes(UNSIZED_SHARE_KEY))
    );
    const percentById = new Map<number, number>();
    const pendingById = new Map<number, number>();
    // Whether the pool had already been raised when each percentage was stated, so only a
    // comparison that straddles the raise is excused by it.
    const wasRaisedById = new Map<number, boolean>();
    let isPoolRaised = false;
    // Every message decoded once, kept in order, so a cast stated about a side can be sized over
    // the whole fight and still applied at the message it landed on.
    const byMessage = payloads.flatMap((one) => one.map((message) => [message, one] as const))
        .map(([message]) =>
            decodePayloadMessages([message], { roster, standing: null, tables: BLOWS_GRANTED })
                .events
        );
    const heals = indexTeamHeals(byMessage.flat(), roster);
    for (const events of byMessage) {
        {
            const statedHere = new Map<number, number>();
            for (const event of events) {
                for (const [id, amount] of heals.get(event)?.restoredByCombatantId ?? []) {
                    pendingById.set(id, (pendingById.get(id) ?? 0) + amount);
                }
                for (const [id, amount] of getMovedHealth(event)) {
                    pendingById.set(id, (pendingById.get(id) ?? 0) + amount);
                }
                for (const [id, percent] of getStatedHealthsFromEvent(event)) {
                    statedHere.set(id, percent);
                }
                if (isPoolRaiseDeclared(event)) isPoolRaised = true;
            }
            for (const [combatantId, percentAfter] of statedHere) {
                const percentBefore = percentById.get(combatantId);
                const healthMaximum = healthMaximumById.get(combatantId) ?? null;
                const moved = pendingById.get(combatantId) ?? 0;
                const wasRaised = wasRaisedById.get(combatantId) ?? false;
                percentById.set(combatantId, percentAfter);
                pendingById.set(combatantId, 0);
                wasRaisedById.set(combatantId, isPoolRaised);
                if (percentBefore === undefined) continue;
                if (healthMaximum === null) continue;
                addComparison(reading, {
                    path,
                    combatantId,
                    healthMaximum,
                    percentBefore,
                    percentAfter,
                    moved,
                    doesCarryUnsizedShare,
                    doesSpanPoolRaise: isPoolRaised && !wasRaised,
                });
            }
        }
    }
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

/** The three kinds carrying declared effects, named rather than tested for the field. */
function isPoolRaiseDeclared(event: BattleEvent): boolean {
    if (event.kind === "declaration") return isPoolRaiseAmong(event.declared);
    if (event.kind === "skill-used") return isPoolRaiseAmong(event.declared);
    if (event.kind === "health-change") return isPoolRaiseAmong(event.declared);
    return false;
}

function isPoolRaiseAmong(declared: readonly { effect: string }[]): boolean {
    return declared.some((one) => one.effect === POOL_RAISE_KEY);
}

/**
 * Four kinds of disagreement have an answer, and each is the protocol's rather than ours: a
 * killing blow lands more than the health that was left, a share this decoder cannot size
 * restores health nobody can place, one payload moves health with no message at all, and a pool
 * raise moves the maximum the two percentages either side of it are read against.
 */
function addComparison(reading: WitnessReading, one: Comparison): void {
    const wasAt = deriveHealthFromPercent(one.percentBefore, one.healthMaximum);
    const isAt = deriveHealthFromPercent(one.percentAfter, one.healthMaximum);
    assertExists(wasAt, `${one.path}: a maximum that was read`);
    assertExists(isAt, `${one.path}: a maximum that was read`);
    reading.compared += 1;
    const stated = isAt - wasAt;
    const tolerance = deriveHealthTolerance(one.healthMaximum) * READINGS_COMPARED;
    if (Math.abs(stated - one.moved) <= tolerance) {
        reading.agreed += 1;
        return;
    }
    const found = `${one.path} ${one.combatantId}: stated ${stated}, read ${one.moved}`;
    if (one.percentAfter === 0) reading.died += 1;
    else if (stated < one.moved) reading.vanished.push(found);
    else if (one.doesCarryUnsizedShare) reading.appeared += 1;
    else if (one.doesSpanPoolRaise) reading.raised += 1;
    else reading.unexplained.push(found);
}

Deno.test("one payload moves health with no message saying so, and it is pinned here", () => {
    const reading: WitnessReading = {
        compared: 0,
        agreed: 0,
        died: 0,
        appeared: 0,
        raised: 0,
        vanished: [],
        unexplained: [],
    };
    for (const fight of readRecordedFights()) witnessRecording(fight, reading);
    assertEquals(reading.vanished.length, 1, "the material carries exactly one, and it is known");
    assert(
        reading.vanished[0]?.includes("2026-08-06-tempest-grupa-vs-hildur-1785244275300-none"),
        "entry 83 of that fight: the boss loses 8062 with both its messages about other people",
    );
});
