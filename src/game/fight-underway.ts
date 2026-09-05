/**
 * One fight, accumulated payload by payload.
 *
 * This file spells four of the client's names and nothing else does: `init`, which opens a
 * fight, `endBattle`, which ends one, `m`, the messages a payload carries, and `myteam`, the side
 * the reader is on. A payload carrying `init` starts a fight over; a payload arriving before one
 * has been seen is read all the same, because the reader may have joined a fight in progress.
 */

import { assert } from "@std/assert/assert";
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
import { readCombatantsFromPayload } from "@/src/game/engine-warrior.ts";

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
 * Which side is the reader's own, which the protocol never says and the client does. Stated on
 * the payload that opens a fight in all 28 recordings and on none of the others, 2026-08-29 — so
 * it is kept once seen, and a later payload saying nothing about it never takes it away.
 */
/** The client's own name for the reader's side, spelled here and read from here — **N13**. */
export const READER_SIDE_KEY = "myteam";
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

export interface FightUnderway {
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

export function composeFightUnderway(): FightUnderway {
    const underway: FightUnderway = {
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

function readMessageCountFromPayload(payload: Record<string, unknown>): number {
    const stated = payload[MESSAGE_INDEX_KEY];
    if (!Array.isArray(stated)) return 0;
    assert(stated.length <= MAXIMUM_EVENTS, "a payload states no more messages than a fight holds");
    return stated.length;
}

function resetFight(underway: FightUnderway): void {
    underway.combatants = [];
    underway.events = [];
    underway.messagesByPayload = [];
    underway.messagesLost = 0;
    underway.hasJoinedInProgress = false;
    underway.isOver = false;
    underway.payloads = 0;
    underway.readerSide = null;
    assert(underway.events.length === 0, "a fight opens holding nothing");
    assert(underway.combatants.length === 0, "and knowing nobody until its payload states them");
}

/**
 * The side the reader is on, as this payload states it. Read from text and from number both: the
 * recordings state `"1"` and the client compares loosely, so a stricter reading would quietly
 * stop finding it the day the game sends the other one.
 */
function readReaderSideFromPayload(payload: Record<string, unknown>): number | null {
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

export function addPayloadToFight(underway: FightUnderway, payload: unknown): void {
    if (!isRecord(payload)) return;
    if (isFightStart(payload)) resetFight(underway);
    // `init` arrives once, so only the first payload of a fight can answer this.
    if (underway.payloads === 0) underway.hasJoinedInProgress = !isFightStart(payload);
    underway.hasFight = true;
    underway.payloads += 1;
    for (const combatant of readCombatantsFromPayload(payload)) underway.combatants.push(combatant);
    // Kept once seen, because only the opening payload carries it: a fragment saying nothing
    // about the side would otherwise take the reader's own away mid-fight.
    underway.readerSide = readReaderSideFromPayload(payload) ?? underway.readerSide;
    const roster = composeCombatantRoster(underway.combatants);
    const messages = readMessagesFromPayload(payload);
    underway.messagesByPayload.push(messages);
    const stated = readMessageCountFromPayload(payload);
    if (stated > messages.length) underway.messagesLost += stated - messages.length;
    assert(underway.messagesLost >= 0, "what a payload stated and nobody read is never negative");
    for (const event of decodeFightMessages(messages, roster)) underway.events.push(event);
    if (FIGHT_ENDS_KEY in payload) underway.isOver = true;
    assert(underway.events.length <= MAXIMUM_EVENTS, "a fight stays inside its stated bound");
    assert(underway.messagesByPayload.length <= MAXIMUM_EVENTS, "and so does what it kept");
    assert(underway.payloads > 0, "a payload that was read is counted");
    assert(underway.hasFight, "and leaves a fight behind it, however little it stated");
}

/** Null until a payload has arrived: a fight nobody has seen is not a fight with no figures. */
export function getReadingFromFight(underway: FightUnderway): FightReading | null {
    if (!underway.hasFight) return null;
    assert(underway.payloads > 0, "a fight that exists was built from something");
    assert(underway.events.length <= MAXIMUM_EVENTS, "a fight stays inside its stated bound");
    return {
        roster: composeCombatantRoster(underway.combatants),
        events: underway.events,
        messagesByPayload: underway.messagesByPayload,
        messagesLost: underway.messagesLost,
        hasJoinedInProgress: underway.hasJoinedInProgress,
        isOver: underway.isOver,
        payloads: underway.payloads,
        readerSide: underway.readerSide,
    };
}
