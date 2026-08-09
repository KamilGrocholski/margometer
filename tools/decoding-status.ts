/**
 * How much of the protocol the decoder reads, counted rather than remembered.
 *
 * Every figure here changes with each batch of keys, which is exactly why none
 * of them belongs in prose (AGENTS.md §5). Run the tool instead of quoting a
 * number that was true last week.
 */

import { composeIntegerText } from "@/libs/number.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS, type CapturedFight } from "@/tests/captured-fight-catalog.ts";

/** Wide enough for every count the captured material produces. */
const COLUMN_WIDTH = 5;

export type DecodingStatus = {
  messages: number;
  /** Messages producing at least one unknown event — fully or partly unread. */
  messagesWithUnread: number;
  eventsByKind: Record<string, number>;
  /** Keys the decoder has no meaning for, most frequent first. */
  unreadKeysByFrequency: Array<{ key: string; occurrences: number }>;
};

/**
 * Whether the decoder has a meaning for a key, asked by handing it that key on
 * its own — with a real value from the material, because several keys are only
 * readable when they carry one.
 *
 * Deliberately not read out of the unknown event's `reason`: that text is meant
 * for a person, and parsing it back would tie this tool to its wording.
 */
function isKeyRead(key: string, sampleValue: string | null): boolean {
  const segment = sampleValue === null ? key : `${key}=${sampleValue}`;
  return decodeFight([`0;0;${segment}`]).some((event) => event.kind !== "unknown-message");
}

export function getDecodingStatus(fights: readonly CapturedFight[]): DecodingStatus {
  const eventsByKind: Record<string, number> = {};
  const occurrences = new Map<string, number>();
  const sampleValues = new Map<string, string | null>();
  let messages = 0;
  let messagesWithUnread = 0;

  for (const fight of fights) {
    for (const call of fight.dump.calls) {
      for (const message of call.protocolMessages) {
        messages += 1;

        const events = decodeFight([message]);
        for (const event of events) {
          eventsByKind[event.kind] = (eventsByKind[event.kind] ?? 0) + 1;
        }
        if (events.some((event) => event.kind === "unknown-message")) messagesWithUnread += 1;

        for (const { key, value } of parseProtocolMessage(message).parameters) {
          occurrences.set(key, (occurrences.get(key) ?? 0) + 1);
          if (!sampleValues.has(key)) sampleValues.set(key, value);
        }
      }
    }
  }

  const unreadOccurrences = new Map(
    [...occurrences].filter(([key]) => !isKeyRead(key, sampleValues.get(key) ?? null)),
  );

  return {
    messages,
    messagesWithUnread,
    eventsByKind,
    unreadKeysByFrequency: [...unreadOccurrences]
      .map(([key, occurrences]) => ({ key, occurrences }))
      .sort((a, b) => b.occurrences - a.occurrences || a.key.localeCompare(b.key)),
  };
}

function writeStatusReport(status: DecodingStatus): void {
  const read = status.messages - status.messagesWithUnread;
  console.log(`messages          ${status.messages}`);
  console.log(`fully read        ${read}`);
  console.log(`carrying unread   ${status.messagesWithUnread}`);
  console.log();
  console.log("events by kind");
  for (const [kind, count] of Object.entries(status.eventsByKind).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${composeIntegerText(count).padStart(COLUMN_WIDTH)}  ${kind}`);
  }
  console.log();
  console.log("unread keys, most frequent first");
  for (const { key, occurrences } of status.unreadKeysByFrequency) {
    console.log(`  ${composeIntegerText(occurrences).padStart(COLUMN_WIDTH)}  ${key}`);
  }
}

if (import.meta.main) writeStatusReport(getDecodingStatus(CAPTURED_FIGHTS));
