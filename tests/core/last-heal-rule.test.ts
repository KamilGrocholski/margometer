/**
 * `legbon_lastheal`, and which damage in its message belongs to it.
 *
 * The health witness cannot see this key: the recording that carried it first arrives as one
 * engine call with no snapshot before its messages, so the replay produces no comparison. The
 * arithmetic is held here instead (`docs/protocol-keys.md`).
 */

import { assert, assertEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import {
    getRecordedCombatants,
    getRecordedMessages,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

const HEAL_KEY = "legbon_lastheal";
const NAMED_DAMAGE_KEY = "+oth_dmg";
/** A share stated about a whole side, which moves health nothing else in the protocol states. */
const UNSIZED_SHARE_KEY = "healall_per";
/** The share of the pool the help documents the bonus firing under. */
const THRESHOLD = 0.18;
/** Two places of a percentage over the largest pool here, which is what the client rounds to. */
const TOLERANCE = 0.01;
/** Where a percentage stated to two places can differ and still be the same percentage. */
const SAME_PERCENT = 0.005;

/**
 * ⚠️ The member layout is restated here rather than read off the decoder: a test that asks the
 * decoder how it splits a value holds it to itself (`tests/AGENTS.md`). The healing states
 * `amount,name(percent%)` and the named damage `amount,element,name(percent%)`, so the name and
 * the percentage are the last member in both and the element is what differs.
 */
function readNamed(value: string): { amount: number; name: string; percent: number } {
    const members = value.split(",");
    const last = members[members.length - 1];
    assert(last !== undefined, "a value that split has a last member");
    const open = last.lastIndexOf("(");
    const close = last.lastIndexOf("%)");
    assert(open > 0, "the name is followed by the percentage it was left on");
    assert(close > open, "and that percentage is closed");
    return {
        amount: Number(members[0]),
        name: last.slice(0, open),
        percent: Number(last.slice(open + 1, close)),
    };
}

interface Occurrence {
    path: string;
    heal: { amount: number; name: string; percent: number };
    healthMaximum: number;
    /** Segments naming the healed combatant at the bonus's own percentage. */
    paired: number[];
    /** Segments naming them at any other percentage, before the bonus and after it. */
    past: number[];
    /** The last percentage the protocol stated for them before the bonus, in this fight. */
    percentBefore: number | null;
    /**
     * True where that percentage is older than a share nothing states the size of, so the health
     * between the two moved by an amount no chain can carry.
     */
    isChainBroken: boolean;
}

function getOccurrences(): Occurrence[] {
    const found: Occurrence[] = [];
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        // The running statement, because the blow that fired the bonus is not always a segment of
        // the bonus's own message: where it is not, the percentage before it is the last one the
        // protocol stated about that combatant at all.
        const percentByName = new Map<string, number>();
        const sinceUnsized = new Set<string>();
        for (const message of getRecordedMessages(path)) {
            const parsed = parseProtocolMessage(message);
            const stated = new Map(percentByName);
            const broken = new Set(sinceUnsized);
            for (const side of [parsed.actor, parsed.target]) {
                if (side === null) continue;
                if (side.healthPercent === null) continue;
                const named = roster.byId.get(side.combatantId)?.name;
                if (named === undefined) continue;
                percentByName.set(named, side.healthPercent);
                sinceUnsized.delete(named);
            }
            for (const other of parsed.parameters) {
                if (other.key !== NAMED_DAMAGE_KEY) continue;
                const hit = readNamed(String(other.value));
                percentByName.set(hit.name, hit.percent);
                sinceUnsized.delete(hit.name);
            }
            for (const [at, one] of parsed.parameters.entries()) {
                if (one.key !== HEAL_KEY) continue;
                assert(one.value !== null, `${path}: a bonus stating nothing`);
                const heal = readNamed(one.value);
                const id = roster.idByName.get(heal.name) ?? null;
                assert(id !== null, `${path}: the bonus names somebody in the fight`);
                const healthMaximum = roster.byId.get(id)?.healthMaximum ?? null;
                assert(healthMaximum !== null, `${path}: and the snapshot states their pool`);
                const named = (from: number, to: number) =>
                    parsed.parameters.slice(from, to)
                        .filter((other) => other.key === NAMED_DAMAGE_KEY)
                        .map((other) => readNamed(String(other.value)))
                        .filter((other) => other.name === heal.name);
                const here = named(0, parsed.parameters.length);
                const isSame = (percent: number) => Math.abs(percent - heal.percent) < SAME_PERCENT;
                const before = named(0, at).filter((other) => !isSame(other.percent));
                found.push({
                    path,
                    heal,
                    healthMaximum,
                    paired: here.filter((other) => isSame(other.percent)).map((o) => o.amount),
                    past: here.filter((other) => !isSame(other.percent)).map((o) => o.amount),
                    percentBefore: before[before.length - 1]?.percent ??
                        stated.get(heal.name) ?? null,
                    // A segment of this message is stated after any earlier share, so only a
                    // percentage taken from the running statement can be older than one.
                    isChainBroken: before.length === 0 && broken.has(heal.name),
                });
                percentByName.set(heal.name, heal.percent);
                sinceUnsized.delete(heal.name);
            }
            if (!parsed.parameters.some((one) => one.key === UNSIZED_SHARE_KEY)) continue;
            for (const one of roster.byId.values()) sinceUnsized.add(one.name);
        }
    }
    return found;
}

Deno.test("the bonus fires under the share of the pool the help documents", () => {
    const occurrences = getOccurrences();
    assertEquals(occurrences.length, 13, "every occurrence the material carries, 2026-08-30");
    let closest = 0;
    for (const one of occurrences) {
        // What they hold after, less what was put back, is what the blow left them on.
        const left = (one.heal.percent * one.healthMaximum) / 100 - one.heal.amount;
        const share = left / one.healthMaximum;
        assert(share >= 0, `${one.path}: a bonus putting back more than the pool holds`);
        assert(share < THRESHOLD, `${one.path}: fired at ${share.toFixed(4)} of the pool`);
        closest = Math.max(closest, share);
    }
    // A bound nothing approaches is a bound this material cannot see. Two sit just under it.
    assert(closest > 0.16, "the material reaches the threshold rather than staying clear of it");
});

Deno.test("the damage that pairs with the bonus is the segments stating its own percentage", () => {
    let closed = 0;
    let refused = 0;
    for (const one of getOccurrences()) {
        if (one.percentBefore === null) continue;
        if (one.paired.length === 0) continue;
        if (one.isChainBroken) {
            refused += 1;
            continue;
        }
        const left = (one.heal.percent * one.healthMaximum) / 100 - one.heal.amount;
        const paired = one.paired.reduce((sum, amount) => sum + amount, 0);
        const reconstructed = ((left + paired) / one.healthMaximum) * 100;
        const off = Math.abs(reconstructed - one.percentBefore);
        assert(off <= TOLERANCE, `${one.path}: the chain is off by ${off.toFixed(4)} points`);
        closed += 1;
    }
    assertEquals(closed, 6, "every occurrence the segments can chain, 2026-08-30");
    assertEquals(refused, 1, "and the one a share of the side moved out of reach first");
});

/**
 * ⚠️ **The segment order is not the order of events.** The bonus is stated before the blow that
 * fired it, and a combatant struck again in the same message states a third percentage after both.
 * Charging that later hit to the bonus's own gap is what this refuses.
 */
Deno.test("a segment past the bonus's percentage is another blow, and breaks the chain", () => {
    const struckAgain = getOccurrences().filter((one) =>
        one.past.length > 0 && one.paired.length > 0 && one.percentBefore !== null
    );
    assert(struckAgain.length > 0, "the material carries one, or this rule is about nothing");
    for (const one of struckAgain) {
        const left = (one.heal.percent * one.healthMaximum) / 100 - one.heal.amount;
        const paired = one.paired.reduce((sum, amount) => sum + amount, 0);
        const everything = one.past.reduce((sum, amount) => sum + amount, paired);
        assert(one.percentBefore !== null, "a chain with a percentage to close on");
        const wrong = Math.abs(((left + everything) / one.healthMaximum) * 100 - one.percentBefore);
        assert(wrong > TOLERANCE, `${one.path}: taking every segment closed anyway`);
    }
});
