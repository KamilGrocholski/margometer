/**
 * One fight, accumulated payload by payload.
 *
 * This file spells four of the client's names and nothing else does: `init`, which opens a
 * fight, `endBattle`, which ends one, `m`, the messages a payload carries, and `myteam`, the side
 * the reader is on. A payload carrying `init` starts a fight over; a payload arriving before one
 * has been seen is read all the same, because the reader may have joined a fight in progress.
 */

import { assert } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
    type Combatant,
    type CombatantRoster,
    composeCombatantRoster,
} from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { getIntegerFromText } from "@/libs/number-text.ts";
import {
    getNumberFromUnknown,
    getStatedTextFromUnknown,
    isRecord,
} from "@/libs/unknown-reading.ts";
import { getCombatantsFromPayload } from "@/src/game/engine-warrior.ts";

const FIGHT_OPENS_KEY = "init";
const FIGHT_ENDS_KEY = "endBattle";
const MESSAGES_KEY = "m";
/**
 * The companion list the client itself never reads, and the only witness that a payload stated
 * messages at all. Measured over `captures/`, 2026-08-28: present in exactly the 1048 payloads
 * `m` is, absent from the same 60, and the same length as `m` in every one of them.
 *
 * It is read as positive evidence and nothing else, so a rename that takes it costs a witness and
 * can never invent an alarm — while a rename that takes `m` is caught here rather than reaching a
 * reader as a fight of zeroes.
 */
const MESSAGE_COUNT_KEY = "mi";
/**
 * Which side is the reader's own, which the protocol never says and the client does. Stated on
 * the payload that opens a fight in all 28 recordings and on none of the others, 2026-08-29 — so
 * it is kept once seen, and a later payload saying nothing about it never takes it away.
 */
const READER_SIDE_KEY = "myteam";
/** The longest fight in `captures/` decodes to 811 events, 2026-08-28. */
const MAXIMUM_EVENTS = 65536;

export interface FightReading {
    roster: CombatantRoster;
    events: readonly BattleEvent[];
    messagesByPayload: readonly (readonly string[])[];
    /** Messages a payload said it carried and this reader did not read. Zero is the answer. */
    messagesLost: number;
    /** True where the reading began after the fight did, short by an amount nothing states. */
    hasJoinedInProgress: boolean;
    isOver: boolean;
    payloads: number;
    /** Null where the client never said, which leaves the panel unable to tell one side apart. */
    readerSide: number | null;
}

export interface BattleSession {
    combatants: Combatant[];
    events: BattleEvent[];
    messagesByPayload: string[][];
    messagesLost: number;
    hasJoinedInProgress: boolean;
    isOver: boolean;
    payloads: number;
    hasFight: boolean;
    readerSide: number | null;
}

export function composeBattleSession(): BattleSession {
    const session: BattleSession = {
        combatants: [],
        events: [],
        messagesByPayload: [],
        messagesLost: 0,
        hasJoinedInProgress: false,
        isOver: false,
        payloads: 0,
        hasFight: false,
        readerSide: null,
    };
    assert(session.events.length === 0, "a session starts holding no fight of its own");
    assert(!session.hasFight, "and says so, rather than reading as a fight with no figures");
    return session;
}

function getMessagesFromPayload(payload: Record<string, unknown>): string[] {
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

function getMessageCountFromPayload(payload: Record<string, unknown>): number {
    const stated = payload[MESSAGE_COUNT_KEY];
    if (!Array.isArray(stated)) return 0;
    assert(stated.length >= 0, "a list states a length");
    return stated.length;
}

function resetSession(session: BattleSession): void {
    session.combatants = [];
    session.events = [];
    session.messagesByPayload = [];
    session.messagesLost = 0;
    session.hasJoinedInProgress = false;
    session.isOver = false;
    session.payloads = 0;
    session.readerSide = null;
    assert(session.events.length === 0, "a fight opens holding nothing");
    assert(session.combatants.length === 0, "and knowing nobody until its payload states them");
}

/**
 * The side the reader is on, as this payload states it. Read from text and from number both: the
 * recordings state `"1"` and the client compares loosely, so a stricter reading would quietly
 * stop finding it the day the game sends the other one.
 */
function getReaderSideFromPayload(payload: Record<string, unknown>): number | null {
    assert(READER_SIDE_KEY.length > 0, "the reader's own side is stated under a key with a name");
    const stated = payload[READER_SIDE_KEY];
    const side = typeof stated === "string"
        ? getIntegerFromText(stated)
        : getNumberFromUnknown(stated);
    assert(side === null || Number.isFinite(side), "a side that was read is a number");
    return side;
}

export function isFightStart(payload: unknown): boolean {
    if (!isRecord(payload)) return false;
    assert(FIGHT_OPENS_KEY.length > 0, "a fight is opened by a key with a name");
    return FIGHT_OPENS_KEY in payload;
}

export function addPayloadToSession(session: BattleSession, payload: unknown): void {
    if (!isRecord(payload)) return;
    if (isFightStart(payload)) resetSession(session);
    // `init` arrives once, so only the first payload of a fight can answer this.
    if (session.payloads === 0) session.hasJoinedInProgress = !isFightStart(payload);
    session.hasFight = true;
    session.payloads += 1;
    for (const combatant of getCombatantsFromPayload(payload)) session.combatants.push(combatant);
    // Kept once seen, because only the opening payload carries it: a fragment saying nothing
    // about the side would otherwise take the reader's own away mid-fight.
    session.readerSide = getReaderSideFromPayload(payload) ?? session.readerSide;
    const roster = composeCombatantRoster(session.combatants);
    const messages = getMessagesFromPayload(payload);
    session.messagesByPayload.push(messages);
    const stated = getMessageCountFromPayload(payload);
    if (stated > messages.length) session.messagesLost += stated - messages.length;
    assert(session.messagesLost >= 0, "what a payload stated and nobody read is never negative");
    for (const event of decodeFightMessages(messages, roster)) session.events.push(event);
    if (FIGHT_ENDS_KEY in payload) session.isOver = true;
    assert(session.events.length <= MAXIMUM_EVENTS, "a fight stays inside its stated bound");
    assert(session.messagesByPayload.length <= MAXIMUM_EVENTS, "and so does what it kept");
    assert(session.payloads > 0, "a payload that was read is counted");
    assert(session.hasFight, "and leaves a fight behind it, however little it stated");
}

/** Null until a payload has arrived: a fight nobody has seen is not a fight with no figures. */
export function getFightFromSession(session: BattleSession): FightReading | null {
    if (!session.hasFight) return null;
    assert(session.payloads > 0, "a fight that exists was built from something");
    assert(session.events.length <= MAXIMUM_EVENTS, "a fight stays inside its stated bound");
    return {
        roster: composeCombatantRoster(session.combatants),
        events: session.events,
        messagesByPayload: session.messagesByPayload,
        messagesLost: session.messagesLost,
        hasJoinedInProgress: session.hasJoinedInProgress,
        isOver: session.isOver,
        payloads: session.payloads,
        readerSide: session.readerSide,
    };
}
