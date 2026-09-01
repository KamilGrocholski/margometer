/**
 * How much of the protocol the decoder reads, counted rather than remembered.
 *
 *     deno task decoding [recording.json …]
 *
 * The corpus by default, any recording you name instead — and the second is what makes the first
 * reachable: a fresh recording has to pass intake before it is material, and what this answers is
 * whether that intake is worth starting. Every figure moves with each batch of keys, which is why
 * none of them belongs in prose (**V5**).
 */

import { assert } from "@std/assert";
import { BATTLE_EVENT_KINDS } from "@/src/core/battle-event.ts";
import { composeIntegerText } from "@/libs/number-text.ts";
import {
    composeReplayedMaterial,
    type FightReplay,
    type ReplayedMaterial,
} from "@/tools/fight-replay.ts";

/** Wide enough for every count the corpus produces, and for the ones a longer one will. */
const COUNT_WIDTH = 7;
/** A fight decodes to hundreds of events; a corpus of them to tens of thousands. */
const MAXIMUM_TALLY = 1000000;

/** What a run counted, before anything is worded. */
export interface DecodingStatus {
    recordings: number;
    payloads: number;
    messages: number;
    /** Messages a payload stated and the session never saw. Beside the rest, never added to it. */
    messagesLost: number;
    /** Messages carrying something the decoder could not read, whole or in part. */
    messagesWithUnread: number;
    /** Of those, the ones the **grammar** refused — a refusal is no claim about any key. */
    messagesRefused: number;
    eventsByKind: ReadonlyMap<string, number>;
    unreadKeysByFrequency: readonly (readonly [string, number])[];
}

/** Descending by count, then by the key itself, so two runs of the same material read alike. */
function getTallyOrder(one: readonly [string, number], other: readonly [string, number]): number {
    if (one[1] !== other[1]) return other[1] - one[1];
    if (one[0] < other[0]) return -1;
    if (one[0] > other[0]) return 1;
    return 0;
}

function addToTally(tally: Map<string, number>, key: string, amount: number): void {
    assert(key.length > 0, "a tally is kept under a name");
    assert(amount > 0, "and counts something that happened");
    tally.set(key, (tally.get(key) ?? 0) + amount);
    assert(tally.size <= MAXIMUM_TALLY, "a tally stays inside its stated bound");
}

/**
 * Every kind there is, seeded at zero. A family that has stopped being read shows as a nought on
 * a line that used to carry a figure; a table of only what occurred would show nothing at all.
 */
function composeEmptyEventTally(): Map<string, number> {
    const tally = new Map<string, number>();
    for (const kind of BATTLE_EVENT_KINDS) tally.set(kind, 0);
    assert(tally.size === BATTLE_EVENT_KINDS.length, "every kind the union holds has a line");
    assert(tally.size > 0, "and there is at least one of them");
    return tally;
}

export function composeDecodingStatus(replays: readonly FightReplay[]): DecodingStatus {
    assert(replays.length > 0, "a status is counted over something");
    const eventsByKind = composeEmptyEventTally();
    const unreadKeys = new Map<string, number>();
    const status = {
        recordings: replays.length,
        payloads: 0,
        messages: 0,
        messagesLost: 0,
        messagesWithUnread: 0,
        messagesRefused: 0,
    };
    for (const replay of replays) {
        status.payloads += replay.reading.payloads;
        status.messagesLost += replay.reading.messagesLost;
        for (const carried of replay.reading.messagesByPayload) status.messages += carried.length;
        for (const event of replay.reading.events) {
            eventsByKind.set(event.kind, (eventsByKind.get(event.kind) ?? 0) + 1);
            if (event.kind !== "unknown-message") continue;
            status.messagesWithUnread += 1;
            if (event.unreadKeys.length === 0) status.messagesRefused += 1;
            for (const key of event.unreadKeys) addToTally(unreadKeys, key, 1);
        }
    }
    assert(status.messagesRefused <= status.messagesWithUnread, "a refusal is one of them");
    assert(status.payloads >= replays.length, "every recording carried at least one payload");
    return {
        ...status,
        eventsByKind,
        unreadKeysByFrequency: [...unreadKeys].sort(getTallyOrder),
    };
}

function composeCountLine(caption: string, count: number): string {
    assert(caption.length > 0, "a figure is stated under a caption");
    assert(count >= 0, "and is never fewer than none");
    return `${caption.padEnd(18)}${composeIntegerText(count).padStart(COUNT_WIDTH)}`;
}

function composeTallyLines(tally: readonly (readonly [string, number])[]): string[] {
    assert(tally.length <= MAXIMUM_TALLY, "a tally stays inside its stated bound");
    const lines = tally.map(([key, count]) =>
        `  ${composeIntegerText(count).padStart(COUNT_WIDTH)}  ${key}`
    );
    assert(lines.length === tally.length, "every row of the tally is written down");
    return lines;
}

/**
 * The report as lines, so a guard reads what this states without running it. `console.log` is the
 * entry's alone (**W6**: nothing here parses another program's output, because it is ours).
 */
export function composeStatusReport(replayed: ReplayedMaterial): string[] {
    const status = composeDecodingStatus(replayed.replays);
    assert(replayed.material.length > 0, "a report names the material it was taken on");
    const unread = status.unreadKeysByFrequency;
    assert(unread.length <= MAXIMUM_TALLY, "and a list of unread keys stays inside it too");
    return [
        `material          ${replayed.material}`,
        composeCountLine("recordings", status.recordings),
        composeCountLine("payloads", status.payloads),
        composeCountLine("messages", status.messages),
        composeCountLine("carrying unread", status.messagesWithUnread),
        // Beside the count above rather than inside it: the grammar refusing a message says
        // nothing about any key, so a reader chasing a key would be sent to the wrong place.
        composeCountLine("grammar refused", status.messagesRefused),
        // And beside both: this is what never reached the decoder at all.
        composeCountLine("messages lost", status.messagesLost),
        "",
        "events by kind",
        ...composeTallyLines([...status.eventsByKind].sort(getTallyOrder)),
        "",
        "unread keys, most frequent first",
        ...(unread.length === 0 ? ["  every key was read"] : composeTallyLines(unread)),
    ];
}

if (import.meta.main) {
    for (const line of composeStatusReport(composeReplayedMaterial(Deno.args))) console.log(line);
}
