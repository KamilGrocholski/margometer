/**
 * How much of the protocol the decoder reads, counted rather than remembered.
 *
 * Every figure here changes with each batch of keys, which is exactly why none
 * of them belongs in prose (AGENTS.md §5). Run the tool instead of quoting a
 * number that was true last week.
 */

import { composeJsonText } from "@/libs/json.ts";
import { assertDefined } from "@/libs/assert.ts";
import { composeIntegerText } from "@/libs/number.ts";
import { getTextOrder } from "@/libs/text-order.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import {
  composeProtocolMessage,
  parseProtocolMessage,
} from "@/src/core/protocol-message.ts";
import {
  CAPTURED_FIGHTS,
  getMessagesOfFight,
  type CapturedFight,
} from "@/tests/captured-fight-catalog.ts";
import { setRunningTotal } from "@/libs/running-total.ts";

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

/** Everything a message yielded except the notice saying what was not read. */
function composeReadingOf(message: string): string {
  return composeJsonText(
    decodeFight([message]).filter((event) => event.kind !== "unknown-message"),
  );
}

/**
 * The same message with one key taken out of it.
 *
 * ⚠️ **Through the grammar's owner, not through `split(";")`.** This used to
 * spell the separator, the `=` split and the rule that the first two segments
 * are the sides — every one of them a fact `src/core/protocol-message.ts` owns,
 * in a file that already imports it. §9.4 makes the `parse`/`decode` split
 * load-bearing precisely so the grammar lives in one place, and a change to it
 * would have left this tool reporting against the old one
 * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F19).
 */
function composeMessageWithoutKey(message: string, key: string): string {
  const parsed = parseProtocolMessage(message);
  return composeProtocolMessage({
    ...parsed,
    parameters: parsed.parameters.filter((parameter) => parameter.key !== key),
  });
}

/**
 * Whether the decoder has a meaning for a key, asked by taking it out of a real
 * message that carried it and seeing whether the reading changes.
 *
 * **Not by handing it the key on its own**, which is what this did until
 * `skillId` arrived: that key is read only in the company of `tspell`, alone it
 * is deliberately unread, and the probe reported all 182 of its occurrences as
 * a key the decoder has no meaning for. A tool feeding the queue of "what to
 * investigate next" sending someone back to a settled key is the same wrong
 * number this project refuses everywhere else. The earlier version of the same
 * bug passed no value at all and reported damage keys as unread.
 *
 * The unknown notice is excluded from the comparison on purpose: removing an
 * unread key changes the list of keys that notice names, so leaving it in would
 * make every key look read.
 *
 * Deliberately not read out of that notice's `reason` either — the text is meant
 * for a person, and parsing it back would tie this tool to its wording.
 */
function isKeyRead(key: string, sampleMessage: string): boolean {
  return composeReadingOf(sampleMessage) !== composeReadingOf(
    composeMessageWithoutKey(sampleMessage, key),
  );
}

export function getDecodingStatus(fights: readonly CapturedFight[]): DecodingStatus {
  const eventsByKind: Record<string, number> = {};
  const occurrences = new Map<string, number>();
  const sampleMessages = new Map<string, string>();
  let messages = 0;
  let messagesWithUnread = 0;

  for (const fight of fights) {
    for (const message of getMessagesOfFight(fight)) {
      messages += 1;

      const events = decodeFight([message]);
      for (const event of events) {
        eventsByKind[event.kind] = (eventsByKind[event.kind] ?? 0) + 1;
      }
      if (events.some((event) => event.kind === "unknown-message")) messagesWithUnread += 1;

      for (const { key } of parseProtocolMessage(message).parameters) {
        setRunningTotal(occurrences, key, 1);
        if (!sampleMessages.has(key)) sampleMessages.set(key, message);
      }
    }
  }

  const unreadOccurrences = new Map(
    [...occurrences].filter(([key]) => {
      // A key counted but never sampled cannot happen — both come from the same
      // loop over the same parameters — so it is an assertion, not a branch.
      const sample = assertDefined(
        sampleMessages.get(key),
        "every counted key was sampled from the message it occurred in",
      );
      return !isKeyRead(key, sample);
    }),
  );

  return {
    messages,
    messagesWithUnread,
    eventsByKind,
    unreadKeysByFrequency: [...unreadOccurrences]
      .map(([key, occurrences]) => ({ key, occurrences }))
      .sort((a, b) => b.occurrences - a.occurrences || getTextOrder(a.key, b.key)),
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
