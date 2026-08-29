/**
 * One fight, accumulated payload by payload.
 *
 * This file spells three of the client's names and nothing else does: `init`, which opens a
 * fight, `endBattle`, which ends one, and `m`, the messages a payload carries. A payload
 * carrying `init` starts a fight over; a payload arriving before one has been seen is read all
 * the same, because the reader may have joined a fight already in progress.
 */

import { assert } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
    type Combatant,
    type CombatantRoster,
    composeCombatantRoster,
} from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { getTextFromUnknown, isRecord } from "@/src/core/unknown-reading.ts";
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
/** The longest fight in `captures/` decodes to 811 events, 2026-08-28. */
const MAXIMUM_EVENTS = 65536;

export interface FightReading {
    roster: CombatantRoster;
    events: readonly BattleEvent[];
    /** What the game said, kept as it arrived, so a fight can be put on a shelf and read again. */
    messagesByPayload: readonly (readonly string[])[];
    /** Messages a payload said it carried and this reader did not read. Zero is the answer. */
    messagesLost: number;
    /** The game has stated the fight is over. Payloads may still arrive after it. */
    isOver: boolean;
    payloads: number;
}

export interface BattleSession {
    combatants: Combatant[];
    events: BattleEvent[];
    messagesByPayload: string[][];
    messagesLost: number;
    isOver: boolean;
    payloads: number;
    hasFight: boolean;
}

export function composeBattleSession(): BattleSession {
    const session: BattleSession = {
        combatants: [],
        events: [],
        messagesByPayload: [],
        messagesLost: 0,
        isOver: false,
        payloads: 0,
        hasFight: false,
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
        const text = getTextFromUnknown(message);
        if (text === null) continue;
        messages.push(text);
    }
    assert(messages.length <= carried.length, "a payload carries no more than it stated");
    assert(messages.every((one) => one.length > 0), "a message that was read says something");
    return messages;
}

/** How many messages the payload says it carried, or none where it says nothing about it. */
function getMessageCountFromPayload(payload: Record<string, unknown>): number {
    const stated = payload[MESSAGE_COUNT_KEY];
    if (!Array.isArray(stated)) return 0;
    assert(stated.length >= 0, "a list states a length");
    return stated.length;
}

/** A fight that opens replaces whatever stood before it, roster, events and all. */
function resetSession(session: BattleSession): void {
    session.combatants = [];
    session.events = [];
    session.messagesByPayload = [];
    session.messagesLost = 0;
    session.isOver = false;
    session.payloads = 0;
    assert(session.events.length === 0, "a fight opens holding nothing");
    assert(session.combatants.length === 0, "and knowing nobody until its payload states them");
}

/** Whether a payload opens a fight, so a recording clears where the session does. */
export function isFightStart(payload: unknown): boolean {
    if (!isRecord(payload)) return false;
    assert(FIGHT_OPENS_KEY.length > 0, "a fight is opened by a key with a name");
    return FIGHT_OPENS_KEY in payload;
}

export function addPayloadToSession(session: BattleSession, payload: unknown): void {
    if (!isRecord(payload)) return;
    if (isFightStart(payload)) resetSession(session);
    session.hasFight = true;
    session.payloads += 1;
    for (const combatant of getCombatantsFromPayload(payload)) session.combatants.push(combatant);
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
        isOver: session.isOver,
        payloads: session.payloads,
    };
}
