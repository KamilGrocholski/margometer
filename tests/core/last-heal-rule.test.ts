/**
 * `legbon_lastheal`, and which damage in its message belongs to it.
 *
 * The health witness cannot see this key: the recording that carried it first arrives as one
 * engine call with no snapshot before its messages, so the replay produces no comparison. The
 * arithmetic is held here instead (`docs/protocol-keys.md`).
 */

import { assert, assertExists, assertStrictEquals } from "@std/assert";
import { type CombatantRoster, indexCombatantRoster } from "#/src/core/combatant-roster.ts";
import { parseProtocolMessage, type ProtocolMessage } from "#/src/core/fight-decoder.ts";
import { readRecordedFights } from "#/tests/recorded-fights.ts";

interface NamedFigure {
    amount: number;
    name: string;
    percent: number;
}

interface Occurrence {
    path: string;
    heal: NamedFigure;
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

/**
 * The running statement, because the blow that fired the bonus is not always a segment of the
 * bonus's own message: where it is not, the percentage before it is the last one the protocol
 * stated about that combatant at all.
 */
interface RunningStatement {
    path: string;
    roster: CombatantRoster;
    percentByName: Map<string, number>;
    sinceUnsized: Set<string>;
}

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

Deno.test("the bonus fires under the share of the pool the help documents", () => {
    const occurrences = getOccurrences();
    assertStrictEquals(occurrences.length, 14, "every occurrence the material carries, 2026-09-09");
    let closest = 0;
    for (const occurrence of occurrences) {
        // What they hold after, less what was put back, is what the blow left them on.
        const left = (occurrence.heal.percent * occurrence.healthMaximum) / 100 -
            occurrence.heal.amount;
        const share = left / occurrence.healthMaximum;
        assert(share >= 0, `${occurrence.path}: a bonus putting back more than the pool holds`);
        assert(share < THRESHOLD, `${occurrence.path}: fired at ${share.toFixed(4)} of the pool`);
        closest = Math.max(closest, share);
    }
    // A bound nothing approaches is a bound this material cannot see. Two sit just under it.
    assert(closest > 0.16, "the material reaches the threshold rather than staying clear of it");
});

function getOccurrences(): Occurrence[] {
    const occurrences: Occurrence[] = [];
    for (const fight of readRecordedFights()) {
        const running: RunningStatement = {
            path: fight.path,
            roster: indexCombatantRoster(fight.combatants),
            percentByName: new Map(),
            sinceUnsized: new Set(),
        };
        for (const message of fight.messages) {
            const parsed = parseProtocolMessage(message);
            assert(!(parsed instanceof Error), `${fight.path}: a recorded message parses`);
            occurrences.push(...getOccurrencesOfMessage(running, parsed));
        }
    }
    return occurrences;
}

function getOccurrencesOfMessage(running: RunningStatement, parsed: ProtocolMessage): Occurrence[] {
    const stated = new Map(running.percentByName);
    const broken = new Set(running.sinceUnsized);
    for (const side of [parsed.actor, parsed.target]) {
        if (side === null) continue;
        if (side.healthPercent === null) continue;
        const named = running.roster.byId.get(side.combatantId)?.name;
        if (named === undefined) continue;
        running.percentByName.set(named, side.healthPercent);
        running.sinceUnsized.delete(named);
    }
    for (const parameter of parsed.parameters) {
        if (parameter.key !== NAMED_DAMAGE_KEY) continue;
        const hit = readNamed(String(parameter.value));
        running.percentByName.set(hit.name, hit.percent);
        running.sinceUnsized.delete(hit.name);
    }
    const occurrences: Occurrence[] = [];
    for (const [position, parameter] of parsed.parameters.entries()) {
        if (parameter.key !== HEAL_KEY) continue;
        assertExists(parameter.value, `${running.path}: a bonus stating nothing`);
        const heal = readNamed(parameter.value);
        occurrences.push(getOccurrence(running, parsed, position, heal, stated, broken));
        running.percentByName.set(heal.name, heal.percent);
        running.sinceUnsized.delete(heal.name);
    }
    if (parsed.parameters.some((parameter) => parameter.key === UNSIZED_SHARE_KEY)) {
        for (const combatant of running.roster.byId.values()) {
            running.sinceUnsized.add(combatant.name);
        }
    }
    return occurrences;
}

/**
 * ⚠️ The member layout is restated here rather than read off the decoder: a test that asks the
 * decoder how it splits a value holds it to itself (`develop:tests/AGENTS.md`). The healing
 * states `amount,name(percent%)` and the named damage `amount,element,name(percent%)`, so the
 * name and the percentage are the last member in both and the element is what differs.
 */
function readNamed(figureText: string): NamedFigure {
    const members = figureText.split(",");
    const lastMember = members[members.length - 1];
    assertExists(lastMember, "a value that split has a last member");
    const open = lastMember.lastIndexOf("(");
    const close = lastMember.lastIndexOf("%)");
    assert(open > 0, "the name is followed by the percentage it was left on");
    assert(close > open, "and that percentage is closed");
    return {
        amount: Number(members[0]),
        name: lastMember.slice(0, open),
        percent: Number(lastMember.slice(open + 1, close)),
    };
}

function getOccurrence(
    running: RunningStatement,
    parsed: ProtocolMessage,
    position: number,
    heal: NamedFigure,
    stated: ReadonlyMap<string, number>,
    broken: ReadonlySet<string>,
): Occurrence {
    const path = running.path;
    const id = running.roster.idByName.get(heal.name) ?? null;
    assertExists(id, `${path}: the bonus names somebody in the fight`);
    const healthMaximum = running.roster.byId.get(id)?.healthMaximum ?? null;
    assertExists(healthMaximum, `${path}: and the snapshot states their pool`);
    const named = (from: number, to: number) =>
        parsed.parameters.slice(from, to)
            .filter((parameter) => parameter.key === NAMED_DAMAGE_KEY)
            .map((parameter) => readNamed(String(parameter.value)))
            .filter((figure) => figure.name === heal.name);
    const here = named(0, parsed.parameters.length);
    const isSame = (percent: number) => Math.abs(percent - heal.percent) < SAME_PERCENT;
    const before = named(0, position).filter((figure) => !isSame(figure.percent));
    return {
        path,
        heal,
        healthMaximum,
        paired: here.filter((figure) => isSame(figure.percent)).map((o) => o.amount),
        past: here.filter((figure) => !isSame(figure.percent)).map((o) => o.amount),
        percentBefore: before[before.length - 1]?.percent ?? stated.get(heal.name) ?? null,
        // A segment of this message is stated after any earlier share, so only a percentage
        // taken from the running statement can be older than one.
        isChainBroken: before.length === 0 ? broken.has(heal.name) : false,
    };
}

Deno.test("the damage that pairs with the bonus is the segments stating its own percentage", () => {
    let closed = 0;
    let refused = 0;
    for (const occurrence of getOccurrences()) {
        if (occurrence.percentBefore === null) continue;
        if (occurrence.paired.length === 0) continue;
        if (occurrence.isChainBroken) {
            refused += 1;
            continue;
        }
        const left = (occurrence.heal.percent * occurrence.healthMaximum) / 100 -
            occurrence.heal.amount;
        const paired = occurrence.paired.reduce((sum, amount) => sum + amount, 0);
        const reconstructed = ((left + paired) / occurrence.healthMaximum) * 100;
        const off = Math.abs(reconstructed - occurrence.percentBefore);
        assert(
            off <= TOLERANCE,
            `${occurrence.path}: the chain is off by ${off.toFixed(4)} points`,
        );
        closed += 1;
    }
    assertStrictEquals(closed, 6, "every occurrence the segments can chain, 2026-08-30");
    assertStrictEquals(refused, 1, "and the one a share of the side moved out of reach first");
});

/**
 * ⚠️ **The segment order is not the order of events.** The bonus is stated before the blow that
 * fired it, and a combatant struck again in the same message states a third percentage after both.
 * Charging that later hit to the bonus's own gap is what this refuses.
 */
Deno.test("a segment past the bonus's percentage is another blow, and breaks the chain", () => {
    const struckAgain = getOccurrences().filter(isStruckAgain);
    assert(struckAgain.length > 0, "the material carries one, or this rule is about nothing");
    for (const occurrence of struckAgain) {
        const left = (occurrence.heal.percent * occurrence.healthMaximum) / 100 -
            occurrence.heal.amount;
        const paired = occurrence.paired.reduce((sum, amount) => sum + amount, 0);
        const everything = occurrence.past.reduce((sum, amount) => sum + amount, paired);
        assertExists(occurrence.percentBefore, "a chain with a percentage to close on");
        const wrong = Math.abs(
            ((left + everything) / occurrence.healthMaximum) * 100 - occurrence.percentBefore,
        );
        assert(wrong > TOLERANCE, `${occurrence.path}: taking every segment closed anyway`);
    }
});

function isStruckAgain(occurrence: Occurrence): boolean {
    if (occurrence.past.length === 0) return false;
    if (occurrence.paired.length === 0) return false;
    return occurrence.percentBefore !== null;
}
