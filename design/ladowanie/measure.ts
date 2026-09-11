/**
 * What `captures/` says about a charged special blow and about its interruption, written to
 * `measured.json` so the artboards beside it state readings rather than remembered numbers.
 *
 * Run by hand — `deno run -A design/ladowanie/measure.ts`. It has one consumer, this design
 * round, so it earns no `deno task` entry (**C9**). What stands is read off the payload's own
 * envelope, which `tools/fight-replay.ts` does not carry, so the walk is here rather than asked.
 */

import { assert } from "@std/assert";
import { getJsonReading } from "@/libs/json-text.ts";
import {
    getNumberFromUnknown,
    getStatedTextFromUnknown,
    isRecord,
} from "@/libs/unknown-reading.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { addPayloadToFight, composeFightUnderway } from "@/src/game/fight-underway.ts";

const WRITTEN_TO = "design/ladowanie/measured.json";
/** Far past any roster the game fields, so a walk stays bounded (**S2**, **S11**). */
const MAXIMUM_WARRIORS = 64;
/** Far past any fight the corpus holds, so the payload walk is bounded too. */
const MAXIMUM_PAYLOADS = 4096;

/**
 * The names the game gives this, spelled here once because this file is the only reader of them
 * (**N13**). `super_cast` is the envelope's field; the rest are message keys and
 * `docs/protocol-keys.md` owns what each means.
 */
const CHARGE_FIELD = "super_cast";
const PREPARE_KEY = "prepare";
const DISPEL_KEY = "+superspell-dispel";
const PREVENTED_KEY = "+superspell-prevented";
/**
 * What the published help names as able to break a charge: Ogłuszenie/Zamrożenie, Klątwa,
 * Oślepienie and Wytrącenie z równowagi (article `view,372`, read 2026-09-11). These are the
 * keys the first two arrive under; the other two are named by no key the corpus carries.
 */
const STUN_KEYS = ["+stun", "+stun2", "+freeze"];
const CURSE_KEYS = ["+mcurse", "+legbon_curse"];
const SKILL_NAME_KEYS = ["tspell", "tcustom"];
const OUTCOME_KEYS = ["winner", "loser"];
/**
 * The envelope's queue of forecast turns. Only its least ordinal is read, which is the turn in
 * hand — `src/game/fight-underway.ts` owns why the nine above it are not (**ADR 0053**).
 */
const TURN_QUEUE_FIELD = "turns_warriors";
/** How far past an interruption the window could stand, in the game's own turns. */
const TURN_STEPS = [1, 2, 5, 10];
const WHOLE_PERCENT = 100;

interface Charge {
    name: string;
    turn: number;
    totalTurns: number;
    openedAt: number;
}

interface Message {
    /** Null where the protocol named nobody at that end, which `0` is its spelling for. */
    actorId: string | null;
    targetId: string | null;
    keys: { key: string; value: string | null }[];
}

interface Widest {
    charges: number;
    recording: string;
}

interface Named {
    name: string;
    letters: number;
}

interface Measured {
    readAt: string;
    recordings: number;
    payloads: number;
    charge: {
        statements: number;
        recordings: number;
        runs: number;
        runsOpeningAtNothing: number;
        bySkill: { name: string; totalTurns: number; statements: number }[];
        totalTurnsStated: number[];
        mostAtOnce: Widest;
        onCombatantsTheGameCallsNpc: number;
        onEverybodyElse: number;
        longestName: Named;
    };
    prepare: {
        messages: number;
        recordings: number;
        fromNpc: number;
        fromEverybodyElse: number;
        byPercent: { percent: number; messages: number }[];
        agreeingWithTheCharge: number;
        differingByOneStep: number;
        differingByMore: number;
    };
    ending: {
        endings: number;
        fired: number;
        interrupted: number;
        firedAndInterrupted: number;
        casterFell: number;
        fightEnded: number;
        unexplained: number;
        lostAt: { turn: number; totalTurns: number; endings: number }[];
    };
    dispel: {
        occurrences: number;
        recordings: number;
        endingACharge: number;
        whileAChargeStood: number;
        withNoChargeInFlight: number;
        inTheOpeningPayload: number;
        namingAnActor: number;
        actorIsTheTarget: number;
        alsoStunningOrFreezing: number;
        alsoCursing: number;
        ridingNeither: number;
        stunsAndFreezesOnACharge: number;
        distinctActors: number;
        mostByOneActor: number;
        recordingsCarryingOne: number;
        mostInOneRecording: number;
    };
    afterwards: {
        gapsMeasured: number;
        smallestGap: number;
        middleGap: number;
        largestGap: number;
        gaps: number[];
        /** Payloads from an interruption until the game's own turn number has moved that far. */
        turnAdvance: { turns: number; measured: number; smallest: number; middle: number; largest: number }[];
        /**
         * How long a mark the panel actually draws stands for, asked of the shipped band rather
         * than walked again here — so a figure on an artboard is a figure the panel would draw.
         */
        markStood: { payloads: number; marks: number }[];
    };
    prevented: {
        occurrences: number;
    };
}

function readPayloads(path: string): Record<string, unknown>[] {
    const reading = getJsonReading(Deno.readTextFileSync(path));
    if (!reading.isOk) throw new Error(`${path} is not JSON: ${String(reading.cause)}`);
    const envelope = reading.value;
    if (!isRecord(envelope)) return [];
    const calls = envelope["calls"];
    if (!Array.isArray(calls)) return [];
    const payloads: Record<string, unknown>[] = [];
    for (const call of calls) {
        assert(payloads.length <= MAXIMUM_PAYLOADS, "a recording stays inside the stated bound");
        if (!isRecord(call)) continue;
        const payload = call["payload"];
        if (isRecord(payload)) payloads.push(payload);
    }
    return payloads;
}

/**
 * The grammar is `src/core/protocol-message.ts`'s and is asked rather than walked again here, so
 * a figure on an artboard is a figure the decoder would read (**C17**). Ids come back as numbers
 * and the envelope keys them as text, so both ends are spelled the way `w` spells them.
 */
function readMessages(payload: Record<string, unknown>): Message[] {
    const stated = payload["m"];
    if (!Array.isArray(stated)) return [];
    const found: Message[] = [];
    for (const one of stated) {
        const text = getStatedTextFromUnknown(one);
        if (text === null) continue;
        const parsed = parseProtocolMessage(text);
        found.push({
            actorId: parsed.actor === null ? null : String(parsed.actor.combatantId),
            targetId: parsed.target === null ? null : String(parsed.target.combatantId),
            keys: parsed.parameters,
        });
    }
    return found;
}

function readWarriors(payload: Record<string, unknown>): [string, Record<string, unknown>][] {
    const stated = payload["w"];
    if (!isRecord(stated)) return [];
    const found: [string, Record<string, unknown>][] = [];
    for (const [id, one] of Object.entries(stated)) {
        assert(found.length <= MAXIMUM_WARRIORS, "a payload stays inside the stated bound");
        if (isRecord(one)) found.push([id, one]);
    }
    return found;
}

function readCharge(record: Record<string, unknown>, at: number): Charge | null {
    const stated = record[CHARGE_FIELD];
    if (!isRecord(stated)) return null;
    const name = getStatedTextFromUnknown(stated["name"]);
    const turn = getNumberFromUnknown(stated["turn"]);
    const totalTurns = getNumberFromUnknown(stated["total_turns"]);
    if (name === null) return null;
    if (turn === null) return null;
    if (totalTurns === null) return null;
    return { name, turn, totalTurns, openedAt: at };
}

/** `prepare=Nazwa(50%)` — the name is the client's display text and is not kept, the figure is. */
function readPreparePercent(value: string): number | null {
    const opened = value.lastIndexOf("(");
    if (opened === -1) return null;
    if (!value.endsWith("%)")) return null;
    const percent = getNumberFromUnknown(Number(value.slice(opened + 1, value.length - 2)));
    if (percent === null) return null;
    if (!Number.isFinite(percent)) return null;
    return percent;
}

function hasKey(message: Message, wanted: string): boolean {
    return message.keys.some((held) => held.key === wanted);
}

function hasAnyKey(message: Message, wanted: readonly string[]): boolean {
    return message.keys.some((held) => wanted.includes(held.key));
}

function getMiddle(sorted: readonly number[]): number {
    if (sorted.length === 0) return 0;
    const at = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted[at] ?? 0;
    return ((sorted[at - 1] ?? 0) + (sorted[at] ?? 0)) / 2;
}

function addCount<Key>(into: Map<Key, number>, key: Key): void {
    into.set(key, (into.get(key) ?? 0) + 1);
}

/** Every tally this round keeps, in one place, so the walk below reads as one pass. */
class Tallies {
    readonly bySkill = new Map<string, { totalTurns: number; statements: number }>();
    readonly totalTurns = new Set<number>();
    readonly chargeRecordings = new Set<string>();
    readonly prepareRecordings = new Set<string>();
    readonly dispelRecordings = new Set<string>();
    readonly dispelActors = new Set<string>();
    readonly dispelsByActor = new Map<string, number>();
    readonly dispelsByRecording = new Map<string, number>();
    readonly byPercent = new Map<number, number>();
    readonly lostAt = new Map<string, { turn: number; totalTurns: number; endings: number }>();
    readonly gaps: number[] = [];
    readonly advances = new Map<number, number[]>();
    readonly figures = new Map<string, number>();
    mostAtOnce: Widest = { charges: 0, recording: "" };
    longestName: Named = { name: "", letters: 0 };

    add(figure: string): void {
        addCount(this.figures, figure);
    }

    get(figure: string): number {
        return this.figures.get(figure) ?? 0;
    }
}

function addChargeStatement(tallies: Tallies, charge: Charge, isNpc: boolean): void {
    tallies.add("chargeStatements");
    tallies.add(isNpc ? "chargeOnNpc" : "chargeOnEverybodyElse");
    tallies.totalTurns.add(charge.totalTurns);
    const held = tallies.bySkill.get(charge.name) ??
        { totalTurns: charge.totalTurns, statements: 0 };
    held.statements += 1;
    tallies.bySkill.set(charge.name, held);
    if (charge.name.length > tallies.longestName.letters) {
        tallies.longestName = { name: charge.name, letters: charge.name.length };
    }
}

/**
 * Which of the six ends a charge came to. The order is the evidence's: an announcement of the
 * charge's own name is the game firing it, and a dispel aimed at the caster in the same payload
 * is the game stopping it. The rest are the cases neither key claims.
 */
function addEnding(
    tallies: Tallies,
    charge: Charge,
    ends: { isFired: boolean; isDispelled: boolean; hasFallen: boolean; isFightOver: boolean },
): void {
    tallies.add("endings");
    if (ends.isFired) {
        tallies.add(ends.isDispelled ? "firedAndInterrupted" : "fired");
        return;
    }
    if (ends.isDispelled) {
        tallies.add("interrupted");
        const key = `${charge.turn}/${charge.totalTurns}`;
        const held = tallies.lostAt.get(key) ??
            { turn: charge.turn, totalTurns: charge.totalTurns, endings: 0 };
        held.endings += 1;
        tallies.lostAt.set(key, held);
        return;
    }
    if (ends.hasFallen) {
        tallies.add("casterFell");
        return;
    }
    tallies.add(ends.isFightOver ? "fightEnded" : "unexplained");
}

function readIsNpc(record: Record<string, unknown>, id: string, npcById: Map<string, boolean>): boolean {
    const stated = getNumberFromUnknown(record["npc"]);
    if (stated !== null) npcById.set(id, stated !== 0);
    const held = npcById.get(id);
    if (held !== undefined) return held;
    // Every monster in the corpus is stated at a negative id; the flag itself rides the opening
    // payload only, so an id seen before that one is read off its sign.
    return Number(id) < 0;
}

/** The turn the game is numbering, or null where it numbers none — a fight fought on the auto key. */
function readTurnOrdinal(payload: Record<string, unknown>): number | null {
    const stated = payload[TURN_QUEUE_FIELD];
    if (!isRecord(stated)) return null;
    let least: number | null = null;
    for (const key of Object.keys(stated)) {
        const ordinal = getNumberFromUnknown(Number(key));
        if (ordinal === null) continue;
        if (!Number.isFinite(ordinal)) continue;
        if (least === null || ordinal < least) least = ordinal;
    }
    return least;
}

function hasFallen(record: Record<string, unknown>): boolean {
    const stated = record["hp"];
    if (!isRecord(stated)) return false;
    return getNumberFromUnknown(stated["cur"]) === 0;
}

function walkPrepare(
    tallies: Tallies,
    messages: readonly Message[],
    charges: Map<string, Charge>,
    npcById: Map<string, boolean>,
    path: string,
): void {
    for (const message of messages) {
        for (const held of message.keys) {
            if (held.key !== PREPARE_KEY) continue;
            if (held.value === null) continue;
            tallies.add("prepareMessages");
            tallies.prepareRecordings.add(path);
            // A preparation with no actor is not a shape the corpus has; if one ever arrives it
            // is counted and placed nowhere, rather than charged to whoever the walk saw last.
            if (message.actorId === null) continue;
            const isNpc = npcById.get(message.actorId) ?? Number(message.actorId) < 0;
            tallies.add(isNpc ? "prepareFromNpc" : "prepareFromEverybodyElse");
            const percent = readPreparePercent(held.value);
            if (percent === null) continue;
            addCount(tallies.byPercent, percent);
            const charge = charges.get(message.actorId);
            if (charge === undefined) continue;
            if (charge.totalTurns === 0) continue;
            const stated = Math.round(charge.turn / charge.totalTurns * WHOLE_PERCENT);
            const step = Math.round(WHOLE_PERCENT / charge.totalTurns);
            if (percent === stated) tallies.add("prepareAgreeing");
            else if (Math.abs(percent - stated) <= step) tallies.add("prepareOneStep");
            else tallies.add("prepareFurther");
        }
    }
}

/**
 * Every dispel in one payload, classified against the charge state on both sides of that
 * payload's own update.
 *
 * ⚠️ **The key alone is not the claim.** A dispel is `docs/protocol-keys.md`'s "dispel fired
 * alongside the blow" and fires against combatants carrying no charge at all — so what says a
 * charge was stopped is the **conjunction** of the key with a charge that ended under it, and
 * the four figures below are what keep the two apart.
 *
 * ⚠️ **The opening payload carries the whole earlier log.** A reader walking into a fight gets
 * every message that came before in one call, with only the state of that moment beside it, so a
 * dispel there has nothing to be compared against and is counted on its own.
 */
function walkDispel(
    tallies: Tallies,
    messages: readonly Message[],
    standing: ReadonlySet<string>,
    ended: ReadonlySet<string>,
    isOpening: boolean,
    path: string,
): void {
    for (const message of messages) {
        const target = message.targetId;
        const isCharging = target !== null && standing.has(target);
        if (hasKey(message, PREVENTED_KEY)) tallies.add("prevented");
        if (hasAnyKey(message, STUN_KEYS)) {
            if (isCharging) tallies.add("stunsAndFreezesOnACharge");
        }
        if (!hasKey(message, DISPEL_KEY)) continue;
        tallies.add("dispels");
        tallies.dispelRecordings.add(path);
        addCount(tallies.dispelsByRecording, path);
        if (isOpening) tallies.add("dispelsInTheOpeningPayload");
        else if (target !== null && ended.has(target)) tallies.add("dispelsEndingACharge");
        else if (isCharging) tallies.add("dispelsWhileAChargeStood");
        else tallies.add("dispelsWithNoCharge");
        if (hasAnyKey(message, STUN_KEYS)) tallies.add("dispelsStunning");
        else if (hasAnyKey(message, CURSE_KEYS)) tallies.add("dispelsCursing");
        else tallies.add("dispelsRidingNeither");
        if (message.actorId !== null) {
            tallies.add("dispelsNamingAnActor");
            tallies.dispelActors.add(message.actorId);
            addCount(tallies.dispelsByActor, message.actorId);
        }
        if (message.actorId === message.targetId) tallies.add("dispelsOnItsOwnActor");
    }
}

function walkRecording(tallies: Tallies, path: string): number {
    const payloads = readPayloads(path);
    const charges = new Map<string, Charge>();
    const npcById = new Map<string, boolean>();
    const interruptedAt = new Map<string, number>();
    const marks: { at: number; ordinal: number; left: Set<number> }[] = [];
    let at = 0;
    for (const payload of payloads) {
        const messages = readMessages(payload);
        const announced = new Set<string>();
        let isFightOver = false;
        for (const message of messages) {
            for (const held of message.keys) {
                if (SKILL_NAME_KEYS.includes(held.key) && held.value !== null) {
                    announced.add(held.value);
                }
                if (OUTCOME_KEYS.includes(held.key)) isFightOver = true;
            }
        }
        const standingBefore = new Set(charges.keys());
        const ended = new Set<string>();
        const dispelledHere = new Set<string>();
        for (const one of messages) {
            if (!hasKey(one, DISPEL_KEY)) continue;
            if (one.targetId === null) continue;
            dispelledHere.add(one.targetId);
        }
        for (const [id, record] of readWarriors(payload)) {
            const isNpc = readIsNpc(record, id, npcById);
            const charge = readCharge(record, at);
            const standing = charges.get(id);
            if (charge !== null) {
                addChargeStatement(tallies, charge, isNpc);
                tallies.chargeRecordings.add(path);
                if (standing === undefined || standing.name !== charge.name) {
                    tallies.add("runs");
                    if (charge.turn === 0) tallies.add("runsOpeningAtNothing");
                    const since = interruptedAt.get(id);
                    if (since !== undefined) {
                        tallies.gaps.push(at - since);
                        interruptedAt.delete(id);
                    }
                }
                charges.set(id, { ...charge, openedAt: standing?.openedAt ?? at });
                continue;
            }
            if (standing === undefined) continue;
            const isDispelled = dispelledHere.has(id);
            addEnding(tallies, standing, {
                isFired: announced.has(standing.name),
                isDispelled,
                hasFallen: hasFallen(record),
                isFightOver,
            });
            if (isDispelled) {
                interruptedAt.set(id, at);
                const ordinal = readTurnOrdinal(payload);
                if (ordinal !== null) marks.push({ at, ordinal, left: new Set(TURN_STEPS) });
            }
            ended.add(id);
            charges.delete(id);
        }
        const nowOrdinal = readTurnOrdinal(payload);
        if (nowOrdinal !== null) {
            for (const mark of marks) {
                for (const step of [...mark.left]) {
                    if (nowOrdinal < mark.ordinal + step) continue;
                    const held = tallies.advances.get(step) ?? [];
                    held.push(at - mark.at);
                    tallies.advances.set(step, held);
                    mark.left.delete(step);
                }
            }
        }
        walkDispel(tallies, messages, standingBefore, ended, at === 0, path);
        walkPrepare(tallies, messages, charges, npcById, path);
        if (charges.size > tallies.mostAtOnce.charges) {
            tallies.mostAtOnce = { charges: charges.size, recording: path };
        }
        at += 1;
    }
    return payloads.length;
}

function composeCharge(tallies: Tallies): Measured["charge"] {
    return {
        statements: tallies.get("chargeStatements"),
        recordings: tallies.chargeRecordings.size,
        runs: tallies.get("runs"),
        runsOpeningAtNothing: tallies.get("runsOpeningAtNothing"),
        bySkill: [...tallies.bySkill.entries()]
            .map(([name, held]) => ({ name, totalTurns: held.totalTurns, statements: held.statements }))
            .sort((left, right) => right.statements - left.statements),
        totalTurnsStated: [...tallies.totalTurns].sort((left, right) => left - right),
        mostAtOnce: tallies.mostAtOnce,
        onCombatantsTheGameCallsNpc: tallies.get("chargeOnNpc"),
        onEverybodyElse: tallies.get("chargeOnEverybodyElse"),
        longestName: tallies.longestName,
    };
}

function composeDispel(tallies: Tallies): Measured["dispel"] {
    const byActor = [...tallies.dispelsByActor.values()];
    const byRecording = [...tallies.dispelsByRecording.values()];
    return {
        occurrences: tallies.get("dispels"),
        recordings: tallies.dispelRecordings.size,
        endingACharge: tallies.get("dispelsEndingACharge"),
        whileAChargeStood: tallies.get("dispelsWhileAChargeStood"),
        withNoChargeInFlight: tallies.get("dispelsWithNoCharge"),
        inTheOpeningPayload: tallies.get("dispelsInTheOpeningPayload"),
        namingAnActor: tallies.get("dispelsNamingAnActor"),
        actorIsTheTarget: tallies.get("dispelsOnItsOwnActor"),
        alsoStunningOrFreezing: tallies.get("dispelsStunning"),
        alsoCursing: tallies.get("dispelsCursing"),
        ridingNeither: tallies.get("dispelsRidingNeither"),
        stunsAndFreezesOnACharge: tallies.get("stunsAndFreezesOnACharge"),
        distinctActors: tallies.dispelActors.size,
        mostByOneActor: byActor.length === 0 ? 0 : Math.max(...byActor),
        recordingsCarryingOne: tallies.dispelRecordings.size,
        mostInOneRecording: byRecording.length === 0 ? 0 : Math.max(...byRecording),
    };
}

/**
 * The band as it ships: every payload replayed through `src/game/fight-underway.ts`, counting how
 * many payloads each mark it leaves is drawn for. One mark is one ending, keyed by what ended it.
 */
function composeMarksStood(paths: readonly string[]): Map<number, number> {
    const stood = new Map<number, number>();
    for (const path of paths) {
        const underway = composeFightUnderway();
        const drawn = new Map<string, number>();
        for (const payload of readPayloads(path)) {
            addPayloadToFight(underway, payload);
            for (const held of underway.chargedSkills) {
                if (held.state === "charging") continue;
                const key = `${held.combatantId}/${held.skillName}/${held.endedAtOrdinal}`;
                drawn.set(key, (drawn.get(key) ?? 0) + 1);
            }
        }
        for (const payloads of drawn.values()) {
            stood.set(payloads, (stood.get(payloads) ?? 0) + 1);
        }
    }
    return stood;
}

function compose(): Measured {
    const paths = readRecordingPaths();
    const tallies = new Tallies();
    let payloads = 0;
    for (const path of paths) {
        payloads += walkRecording(tallies, path);
    }
    assert(paths.length > 0, "there are recordings to read");
    assert(payloads > 0, "and they carry payloads");

    const gaps = [...tallies.gaps].sort((left, right) => left - right);
    const stood = composeMarksStood(paths);
    return {
        readAt: new Date().toISOString().slice(0, 10),
        recordings: paths.length,
        payloads,
        charge: composeCharge(tallies),
        prepare: {
            messages: tallies.get("prepareMessages"),
            recordings: tallies.prepareRecordings.size,
            fromNpc: tallies.get("prepareFromNpc"),
            fromEverybodyElse: tallies.get("prepareFromEverybodyElse"),
            byPercent: [...tallies.byPercent.entries()]
                .map(([percent, messages]) => ({ percent, messages }))
                .sort((left, right) => left.percent - right.percent),
            agreeingWithTheCharge: tallies.get("prepareAgreeing"),
            differingByOneStep: tallies.get("prepareOneStep"),
            differingByMore: tallies.get("prepareFurther"),
        },
        ending: {
            endings: tallies.get("endings"),
            fired: tallies.get("fired"),
            interrupted: tallies.get("interrupted"),
            firedAndInterrupted: tallies.get("firedAndInterrupted"),
            casterFell: tallies.get("casterFell"),
            fightEnded: tallies.get("fightEnded"),
            unexplained: tallies.get("unexplained"),
            lostAt: [...tallies.lostAt.values()].sort((left, right) =>
                right.endings - left.endings || left.turn - right.turn
            ),
        },
        dispel: composeDispel(tallies),
        afterwards: {
            gapsMeasured: gaps.length,
            smallestGap: gaps[0] ?? 0,
            middleGap: getMiddle(gaps),
            largestGap: gaps[gaps.length - 1] ?? 0,
            gaps,
            turnAdvance: TURN_STEPS.map((turns) => {
                const held = [...(tallies.advances.get(turns) ?? [])].sort((left, right) =>
                    left - right
                );
                return {
                    turns,
                    measured: held.length,
                    smallest: held[0] ?? 0,
                    middle: getMiddle(held),
                    largest: held[held.length - 1] ?? 0,
                };
            }),
            markStood: [...stood.entries()]
                .sort((left, right) => left[0] - right[0])
                .map(([payloads, marks]) => ({ payloads, marks })),
        },
        prevented: { occurrences: tallies.get("prevented") },
    };
}

if (import.meta.main) {
    const measured = compose();
    Deno.writeTextFileSync(WRITTEN_TO, `${JSON.stringify(measured, null, 4)}\n`);
    console.log(
        `${WRITTEN_TO}: ${measured.recordings} recordings, ${measured.payloads} payloads, ` +
            `${measured.charge.statements} charge statements, ${measured.dispel.occurrences} dispels`,
    );
}
