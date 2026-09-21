/**
 * One fight, accumulated payload by payload.
 *
 * This file spells the client's envelope names and nothing else does (**N13**).
 *
 * A payload carrying `init` starts a fight over; a payload arriving before one has been seen is
 * read all the same, because the reader may have joined a fight in progress.
 */

import { assert } from "@std/assert/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
    type Combatant,
    type CombatantRoster,
    composeCombatantRoster,
    MAXIMUM_COMBATANTS,
} from "@/src/core/combatant-roster.ts";
import { decodeFightMessages, MAXIMUM_MESSAGES } from "@/src/core/fight-decoder.ts";
import { getIntegerFromText } from "@/libs/number-text.ts";
import {
    getNumberFromUnknown,
    getStatedTextFromUnknown,
    isRecord,
} from "@/libs/unknown-reading.ts";
import {
    readChargedSkillStatements,
    readCombatantsFromPayload,
} from "@/src/game/engine-warrior.ts";
import {
    type ChargedSkillStanding,
    composeChargedSkills,
    MAXIMUM_CHARGED_SKILLS,
} from "@/src/core/charged-skill.ts";

export const FIGHT_OPENS_KEY = "init";
export const FIGHT_ENDS_KEY = "endBattle";
export const MESSAGES_KEY = "m";
/**
 * The companion list the client itself never reads, and the only witness that a payload stated
 * messages at all. Measured over `captures/`, 2026-08-28: present in exactly the 1048 payloads
 * `m` is, absent from the same 60, and the same length as `m` in every one of them.
 *
 * Here only its **length** is read, as positive evidence and nothing else, so a rename that takes
 * it costs a witness and can never invent an alarm — while a rename that takes `m` is caught here
 * rather than reaching a reader as a fight of zeroes. Its **values** are a running index over the
 * fight, and `tools/turn-count.ts` reads those: a break in them is the game numbering messages it
 * did not send here. Exported so the two readings spell the key once (**N13**).
 */
export const MESSAGE_INDEX_KEY = "mi";
/**
 * The client's own name for the reader's side, spelled here and read from here (**N13**) — which
 * the protocol never says and the client does. Stated on the payload that opens a fight in every
 * recording and on none of the others, 2026-08-29, so it is kept once seen, and a later payload
 * saying nothing about it never takes it away.
 */
export const READER_SIDE_KEY = "myteam";
/**
 * Whether the game is running this fight itself, handed over on the auto key — `F` in the client's
 * own binding, build `Cl9U89Zr`, read 2026-09-09. Read from text and from number both, as the
 * client does through `parseInt`.
 */
export const AUTO_FIGHT_KEY = "auto";
/**
 * The queue of turns the client draws as its prediction list (published help, article 372 §1.1,
 * read 2026-09-02), spelled here because this is where the envelope is read (**N13**) — it is an
 * envelope key and not a message key, which is why `docs/protocol-keys.md` has no entry for it.
 *
 * ⚠️ **Only its least entry is a statement.** The nine above it are the client's forecast, and
 * measured over `captures/` on 2026-09-08 the step one ahead is wrong 11 times in 451 and the
 * ninth 100 times in 277. Nothing here reads past the least.
 */
export const TURN_QUEUE_KEY = "turns_warriors";
/** The longest fight in `captures/` decodes to 811 events, 2026-08-28. */
const MAXIMUM_EVENTS = 65536;
/** The queue is ten entries wide in all 1022 payloads carrying it, 2026-09-02. */
const MAXIMUM_QUEUE = 1024;

/** What the game stated about the turn in progress when a payload arrived. */
export interface TurnStatement {
    ordinal: number;
    combatantId: number;
}

/**
 * The turn in progress, as the payload's envelope states it: the queue's least ordinal, and whose
 * it is. Null where the payload carries no queue — five recordings carry none at all, and the
 * first payload of a fight is one of them everywhere else.
 */
export function readTurnStatement(payload: unknown): TurnStatement | null {
    if (!isRecord(payload)) return null;
    const queue = payload[TURN_QUEUE_KEY];
    if (!isRecord(queue)) return null;
    const ordinals = Object.keys(queue);
    assert(ordinals.length <= MAXIMUM_QUEUE, "a queue stays inside its stated bound");
    let least: number | null = null;
    for (const stated of ordinals) {
        const ordinal = getIntegerFromText(stated);
        if (ordinal === null) return null;
        if (least === null) least = ordinal;
        else if (ordinal < least) least = ordinal;
    }
    if (least === null) return null;
    const combatantId = getNumberFromUnknown(queue[`${least}`]);
    if (combatantId === null) return null;
    return { ordinal: least, combatantId };
}

export interface FightReading {
    roster: CombatantRoster;
    events: readonly BattleEvent[];
    messagesByPayload: readonly (readonly string[])[];
    /** Messages a payload said it carried and this reader did not read. Zero is the answer. */
    messagesLost: number;
    /** And what it did read, which is what a count of what it could not read is out of. */
    messagesRead: number;
    /** True where the reading began after the fight did, short by an amount nothing states. */
    hasJoinedInProgress: boolean;
    isOver: boolean;
    payloads: number;
    /** Null where the client never said, which leaves the panel unable to tell one side apart. */
    readerSide: number | null;
    /** The turn the newest payload stated, or null where it stated none. */
    turnStatement: TurnStatement | null;
    /** True while the game is running the fight itself, which is a fight it numbers no turn on. */
    isOnAuto: boolean;
    /** What a combatant is making ready, and the two ends of it the protocol names. */
    chargedSkills: readonly ChargedSkillStanding[];
}

export interface FightUnderway {
    combatants: Combatant[];
    events: BattleEvent[];
    messagesByPayload: string[][];
    messagesLost: number;
    messagesRead: number;
    hasJoinedInProgress: boolean;
    isOver: boolean;
    payloads: number;
    hasFight: boolean;
    readerSide: number | null;
    turnStatement: TurnStatement | null;
    isOnAuto: boolean;
    chargedSkills: ChargedSkillStanding[];
}

export function composeFightUnderway(): FightUnderway {
    const underway: FightUnderway = {
        combatants: [],
        events: [],
        messagesByPayload: [],
        messagesLost: 0,
        messagesRead: 0,
        hasJoinedInProgress: false,
        isOver: false,
        payloads: 0,
        hasFight: false,
        readerSide: null,
        turnStatement: null,
        isOnAuto: false,
        chargedSkills: [],
    };
    return underway;
}

function readMessagesFromPayload(payload: Record<string, unknown>): string[] {
    const carried = payload[MESSAGES_KEY];
    if (!Array.isArray(carried)) return [];
    const messages: string[] = [];
    for (const message of carried) {
        const text = getStatedTextFromUnknown(message);
        if (text === null) continue;
        messages.push(text);
    }
    assert(messages.length <= carried.length, "a payload carries no more than it stated");
    assert(messages.every((one) => one.length > 0), "a message that was read says something");
    return messages;
}

/**
 * How many messages the envelope says it carries, or null where it says nothing about it.
 *
 * ⚠️ **Never zero for an envelope that did not state one** (**E10**). Zero is a measurement — an
 * envelope stating an empty index — and what the caller does with the two is not the same: a
 * count that was never stated is nothing to compare against, and reading it as zero would say
 * *nothing was lost* where the truth is *nobody knows*. Measured over `captures/` 2026-09-13: of
 * 1 234 payloads, 65 state no index and not one of those carries a message, so the two answers
 * have never yet parted on this material.
 */
function readMessageCountFromPayload(payload: Record<string, unknown>): number | null {
    const stated = payload[MESSAGE_INDEX_KEY];
    if (!Array.isArray(stated)) return null;
    assert(stated.length <= MAXIMUM_MESSAGES, "a payload states no more messages than one carries");
    return stated.length;
}

function resetFight(underway: FightUnderway): void {
    underway.combatants = [];
    underway.events = [];
    underway.messagesByPayload = [];
    underway.messagesLost = 0;
    underway.messagesRead = 0;
    underway.hasJoinedInProgress = false;
    underway.isOver = false;
    underway.payloads = 0;
    underway.readerSide = null;
    underway.turnStatement = null;
    underway.isOnAuto = false;
    underway.chargedSkills = [];
    assert(underway.payloads === 0, "a fight reset stands on no payload");
}

/**
 * The side the reader is on, as this payload states it. Read from text and from number both: the
 * recordings state `"1"` and the client compares loosely, so a stricter reading would quietly
 * stop finding it the day the game sends the other one.
 */
function readReaderSideFromPayload(payload: Record<string, unknown>): number | null {
    const stated = payload[READER_SIDE_KEY];
    const side = typeof stated === "string"
        ? getIntegerFromText(stated)
        : getNumberFromUnknown(stated);
    assert(side === null || Number.isFinite(side), "a side that was read is a number");
    return side;
}

/** Null where it says nothing, which 1086 of `captures/`'s 1135 payloads do, 2026-09-09. */
function readAutoFightFromPayload(payload: Record<string, unknown>): boolean | null {
    const stated = payload[AUTO_FIGHT_KEY];
    const said = typeof stated === "string"
        ? getIntegerFromText(stated)
        : getNumberFromUnknown(stated);
    if (said === null) return null;
    assert(Number.isFinite(said), "a fight that stated this stated a number");
    return said !== 0;
}

export function isFightStart(payload: unknown): boolean {
    if (!isRecord(payload)) return false;
    return FIGHT_OPENS_KEY in payload;
}

/** One payload read against what stood before it, with nothing written yet. */
interface PayloadReading {
    arriving: Combatant[];
    messages: string[];
    /** How many the envelope said it carried, or null where it said nothing about it. */
    stated: number | null;
    decoded: BattleEvent[];
    isOnAuto: boolean;
    turnStatement: TurnStatement | null;
    chargedSkills: ChargedSkillStanding[];
}

/**
 * ⚠️ **Everything that can throw is read here, before anything is written**, so a payload lands
 * whole or not at all. A bound tripped part way through leaves a fight counting a payload whose
 * events never arrived, and an `endBattle` that never closed it — a fight that decodes wrong,
 * where this boundary promises one that decodes no further (**E5**, **A7**). The reset is one of
 * the writes: ahead of the reads it left `hasFight` standing over no payload, which is the one
 * state `getReadingFromFight` asserts against, on every draw until the next payload.
 */
function readPayloadAgainst(
    before: FightUnderway,
    payload: Record<string, unknown>,
    blowsGrantedBySkillId: ReadonlyMap<number, number>,
): PayloadReading {
    const arriving = readCombatantsFromPayload(payload);
    const roster = composeCombatantRoster([...before.combatants, ...arriving]);
    const messages = readMessagesFromPayload(payload);
    const decoded = decodeFightMessages(messages, roster, blowsGrantedBySkillId);
    // Kept once seen: a payload saying nothing about it would otherwise end the auto fight a
    // reader is watching, and only the game's own word for it takes it away.
    const isOnAuto = readAutoFightFromPayload(payload) ?? before.isOnAuto;
    // No payload states an auto fight and a queue at once, `captures/` 2026-09-09, so what the
    // game stated before it took the fight over is not the turn in hand (**ADR 0072**). Off auto,
    // a payload stating no queue leaves the turn the one before it stated standing, rather than
    // taking the reading away mid-fight.
    const turnStatement = isOnAuto ? null : (readTurnStatement(payload) ?? before.turnStatement);
    // The charge is stated in the envelope and its ending is in this payload's own messages, so
    // both halves are read here, where the two are together for the only time.
    const chargedSkills = composeChargedSkills(
        before.chargedSkills,
        readChargedSkillStatements(payload),
        decoded,
        turnStatement?.ordinal ?? null,
    );
    assert(
        before.events.length + decoded.length <= MAXIMUM_EVENTS,
        "a fight stays inside its bound",
    );
    assert(before.messagesByPayload.length < MAXIMUM_EVENTS, "and so does what it kept");
    return {
        arriving,
        messages,
        stated: readMessageCountFromPayload(payload),
        decoded,
        isOnAuto,
        turnStatement,
        chargedSkills,
    };
}

export function addPayloadToFight(
    underway: FightUnderway,
    payload: unknown,
    blowsGrantedBySkillId: ReadonlyMap<number, number>,
): void {
    if (!isRecord(payload)) return;
    const isStart = isFightStart(payload);
    const before = isStart ? composeFightUnderway() : underway;
    assert(
        !isStart || before.payloads === 0,
        "a fight that opens is read against nothing standing",
    );
    const read = readPayloadAgainst(before, payload, blowsGrantedBySkillId);
    if (isStart) resetFight(underway);
    // `init` arrives once, so only the first payload of a fight can answer this.
    if (underway.payloads === 0) underway.hasJoinedInProgress = !isStart;
    underway.hasFight = true;
    underway.payloads += 1;
    setCastFromArrivals(underway, read.arriving);
    // Kept once seen, because only the opening payload carries it: a fragment saying nothing
    // about the side would otherwise take the reader's own away mid-fight.
    underway.readerSide = readReaderSideFromPayload(payload) ?? underway.readerSide;
    underway.isOnAuto = read.isOnAuto;
    underway.turnStatement = read.turnStatement;
    underway.chargedSkills = read.chargedSkills;
    underway.messagesByPayload.push(read.messages);
    underway.messagesRead += read.messages.length;
    // An envelope that stated no count is nothing to measure the reading against, so nothing is
    // counted lost — which is not the same claim as a count of zero, and is why the read answers
    // null rather than one.
    if (read.stated !== null && read.stated > read.messages.length) {
        underway.messagesLost += read.stated - read.messages.length;
    }
    for (const event of read.decoded) underway.events.push(event);
    if (FIGHT_ENDS_KEY in payload) underway.isOver = true;
    assert(underway.messagesLost >= 0, "what a payload stated and nobody read is never negative");
    assert(underway.messagesRead >= read.messages.length, "and what it did read is counted once");
    assert(underway.payloads > 0, "a payload that was read is counted");
    assert(
        !isStart || underway.payloads === 1,
        "and a fight that opened has the one that opened it",
    );
    assert(underway.hasFight, "and leaves a fight behind it, however little it stated");
}

/**
 * The cast a payload leaves standing. **A second sighting replaces the first rather than joining
 * it.** The roster keys people by id and the last sighting already won there, so a list that grew
 * with every restatement counted sightings where the bound counts people: over `captures/` on
 * 2026-09-13 exactly one payload per recording states a cast in full, at most eleven of them, so
 * nothing in the material reaches twenty — and a fight of ten against ten reaches it on the cast
 * alone, with a single restatement past that refusing the whole fight (**E5**).
 */
function setCastFromArrivals(underway: FightUnderway, arriving: readonly Combatant[]): void {
    for (const combatant of arriving) {
        const seen = underway.combatants.findIndex((one) => one.id === combatant.id);
        if (seen === -1) {
            underway.combatants.push(combatant);
            continue;
        }
        underway.combatants[seen] = combatant;
    }
    assert(underway.combatants.length <= MAXIMUM_COMBATANTS, "a cast stays inside its bound");
}

/** Null until a payload has arrived: a fight nobody has seen is not a fight with no figures. */
export function getReadingFromFight(underway: FightUnderway): FightReading | null {
    if (!underway.hasFight) return null;
    assert(underway.payloads > 0, "a fight that exists was built from something");
    assert(underway.events.length <= MAXIMUM_EVENTS, "a fight stays inside its stated bound");
    assert(underway.chargedSkills.length <= MAXIMUM_CHARGED_SKILLS, "and so does what it charges");
    return {
        roster: composeCombatantRoster(underway.combatants),
        events: underway.events,
        messagesByPayload: underway.messagesByPayload,
        messagesLost: underway.messagesLost,
        messagesRead: underway.messagesRead,
        hasJoinedInProgress: underway.hasJoinedInProgress,
        isOver: underway.isOver,
        payloads: underway.payloads,
        readerSide: underway.readerSide,
        turnStatement: underway.turnStatement,
        isOnAuto: underway.isOnAuto,
        chargedSkills: underway.chargedSkills,
    };
}
