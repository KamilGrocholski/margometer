/**
 * How much of the protocol the decoder reads, counted rather than remembered:
 * `develop:tools/decoding-status.ts` at `RECORDINGS_REVISION`, written line for line so
 * `deno task fight:develop` holds the two to one text. Named files are what makes it worth
 * running before an intake: a fresh recording is asked whether taking it in is worth starting.
 * The material and the add-on's reading of it are `tools/recorded-material.ts`'s.
 *
 *     deno task fight:decoding [recording.json …]
 */

import { assert, assertStrictEquals } from "@std/assert";
import { formatInteger } from "#/libs/number-text.ts";
import { BATTLE_EVENT, UNREAD_CAUSE } from "#/src/core/battle-event.ts";
import { getRankedOrder } from "#/src/ui/ranked-order.ts";
import {
    formatRecordingName,
    readRecordedMaterial,
    type RecordedMaterial,
    type ReplayedFight,
    replayRecordedMaterial,
} from "./recorded-material.ts";

/** What a run counted, before anything is worded. */
export interface DecodingStatus {
    recordings: number;
    payloads: number;
    messages: number;
    /** Messages a payload stated and the session never saw. Beside the rest, never added to it. */
    messagesLost: number;
    /** Messages carrying something the decoder could not read, whole or in part. */
    messagesWithUnread: number;
    /** Of those, the ones the **grammar** refused: a refusal is no claim about any key. */
    messagesRefused: number;
    /** And the ones taken apart whole that carried nothing to read. Neither is a key. */
    messagesWithoutParameter: number;
    eventsByKind: ReadonlyMap<string, number>;
    unreadKeysByFrequency: readonly (readonly [string, number])[];
}

type Tally = readonly (readonly [string, number])[];

/** Wide enough for every count the corpus produces, and for the ones a longer one will. */
const COUNT_WIDTH = 7;
const CAPTION_WIDTH = 18;
/** A fight decodes to hundreds of events; a corpus of them to tens of thousands. */
const TALLY_MAXIMUM = 1_000_000;
const BATTLE_EVENTS = Object.values(BATTLE_EVENT);

/** Every figure of the report, over every fight of the material. */
export function tallyDecodingStatus(replayed: readonly ReplayedFight[]): DecodingStatus {
    assert(replayed.length > 0, "a status is counted over something");
    // Every kind seeded at zero: a family that stopped being read shows as a nought on its line.
    const eventsByKind = new Map<string, number>(BATTLE_EVENTS.map((kind) => [kind, 0]));
    const unreadKeys = new Map<string, number>();
    const status = {
        recordings: replayed.length,
        payloads: 0,
        messages: 0,
        messagesLost: 0,
        messagesWithUnread: 0,
        messagesRefused: 0,
        messagesWithoutParameter: 0,
    };
    for (const { reading } of replayed) {
        status.payloads += reading.view.payloadsApplied;
        status.messagesLost += reading.view.messagesLost;
        for (const carried of reading.messagesByPayload) status.messages += carried.length;
        for (const event of reading.view.events) {
            eventsByKind.set(event.kind, (eventsByKind.get(event.kind) ?? 0) + 1);
            if (event.kind !== BATTLE_EVENT.unknownMessage) continue;
            status.messagesWithUnread += 1;
            if (event.unreadCause === UNREAD_CAUSE.grammarRefused) status.messagesRefused += 1;
            if (event.unreadCause === UNREAD_CAUSE.noParameter) {
                status.messagesWithoutParameter += 1;
            }
            for (const key of event.unreadKeys) unreadKeys.set(key, (unreadKeys.get(key) ?? 0) + 1);
            assert(unreadKeys.size <= TALLY_MAXIMUM, "a tally stays inside its stated bound");
        }
    }
    assertStrictEquals(eventsByKind.size, BATTLE_EVENTS.length, "every kind has one line");
    assert(status.messagesRefused <= status.messagesWithUnread, "a refusal is one of them");
    assert(status.messagesWithoutParameter <= status.messagesWithUnread, "and so is an empty one");
    return { ...status, eventsByKind, unreadKeysByFrequency: sortTally([...unreadKeys]) };
}

/** Largest first, ties by name, so two runs over one material read alike. */
function sortTally(tally: [string, number][]): Tally {
    assert(tally.length <= TALLY_MAXIMUM, "a tally sorted stays inside its stated bound");
    return tally.sort((one, other) => getRankedOrder(one[1], other[1], one[0], other[0]));
}

/** The report as lines, so a test reads what it states without running it. */
export function formatStatusReport(
    material: RecordedMaterial,
    replayed: readonly ReplayedFight[],
): string[] {
    const status = tallyDecodingStatus(replayed);
    assertStrictEquals(material.fights.length, status.recordings, "every file read was replayed");
    const unread = status.unreadKeysByFrequency;
    const shelved = material.fights
        .filter((fight) => !fight.hasSnapshot)
        .map((fight) => formatRecordingName(fight.path));
    return [
        `${"material".padEnd(CAPTION_WIDTH)}${material.material}`,
        formatStatusCountLine("recordings", status.recordings),
        // Printed at nought as well: a file stating no cast reads whole, so every figure below it
        // looks like a recording worth admitting, and an intake refuses it days later.
        formatStatusCountLine("no snapshot", shelved.length),
        formatStatusCountLine("payloads", status.payloads),
        formatStatusCountLine("messages", status.messages),
        formatStatusCountLine("carrying unread", status.messagesWithUnread),
        formatStatusCountLine("grammar refused", status.messagesRefused),
        formatStatusCountLine("no parameter", status.messagesWithoutParameter),
        formatStatusCountLine("messages lost", status.messagesLost),
        "",
        "recordings stating no snapshot, which an intake refuses (ADR 0053)",
        ...(shelved.length === 0
            ? ["  every recording states one"]
            : shelved.map((name) => `  ${name}`)),
        "",
        "events by kind",
        ...formatStatusTallyLines(sortTally([...status.eventsByKind])),
        "",
        "unread keys, most frequent first",
        ...(unread.length === 0 ? ["  every key was read"] : formatStatusTallyLines(unread)),
    ];
}

function formatStatusCountLine(caption: string, count: number): string {
    assert(caption.length > 0, "a figure is stated under a caption");
    assert(count >= 0, "and is never fewer than none");
    return `${caption.padEnd(CAPTION_WIDTH)}${formatInteger(count).padStart(COUNT_WIDTH)}`;
}

function formatStatusTallyLines(tally: Tally): string[] {
    const lines = tally.map(([key, count]) =>
        `  ${formatInteger(count).padStart(COUNT_WIDTH)}  ${key}`
    );
    assertStrictEquals(lines.length, tally.length, "every row of the tally is written down");
    return lines;
}

/** Every recording where no path was named, the files named otherwise, as a terminal prints it. */
export function formatDecodingStatus(paths: readonly string[]): string {
    const material = readRecordedMaterial(paths);
    const lines = formatStatusReport(material, replayRecordedMaterial(material));
    assert(lines.length > 0, "a report says something");
    return `${lines.join("\n")}\n`;
}

if (import.meta.main) {
    await Deno.stdout.write(new TextEncoder().encode(formatDecodingStatus(Deno.args)));
}
