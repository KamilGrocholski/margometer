/**
 * How much of the protocol the decoder reads, counted rather than remembered.
 *
 * Every figure here changes with each batch of keys, which is exactly why none
 * of them belongs in prose (AGENTS.md §5). Run the tool instead of quoting a
 * number that was true last week.
 *
 * **It counts the captured material by default and any recording you name
 * instead.** The second route is what makes the first one reachable: a fresh
 * dump has to pass intake before it becomes a capture — redaction, a register
 * entry, `docs/captured-fights.md` — and until this argument existed there was
 * no way to ask what a recording carried before paying that. The order was
 * backwards, since what the answer decides is whether the intake is worth
 * starting: a session that met `flee` or a resource key is material, and one
 * that met nothing new is a file to delete
 * (`docs/specs/2026-08-27-somebody-else-read-the-same-protocol.md`).
 *
 * A named recording is **not** material and nothing here pretends otherwise. It
 * is parsed by the same reader the captures are (§9.1), reported on, and
 * forgotten; §9.2 still decides what enters the repository.
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
  getMessagesOfDump,
  getMessagesOfFight,
} from "@/tests/captured-fight-catalog.ts";
import { parseFightDump } from "@/tools/fight-dump-parser.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";
import { setRunningTotal } from "@/libs/running-total.ts";
import { existsSync, readFileSync } from "node:fs";

export class DecodingStatusError extends MargoMeterToolError {
  constructor(reason: string, options?: ErrorOptions) {
    super("DecodingStatus", reason, options);
  }
}

/** Wide enough for every count the captured material produces. */
const COLUMN_WIDTH = 5;

export type DecodingStatus = {
  messages: number;
  /** Messages producing at least one unknown event — fully or partly unread. */
  messagesWithUnread: number;
  eventsByKind: Record<string, number>;
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
 * ⚠️ **Through the grammar's owner, not through `split(";")`.** This used to spell the
 * separator, the `=` split and the rule that the first two segments are the sides —
 * every one of them a fact `src/core/protocol-message.ts` owns, in a file that already
 * imports it. §9.4 makes the `parse`/`decode` split load-bearing precisely so the
 * grammar lives in one place, and a change to it would have left this tool reporting
 * against the old one.
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

/**
 * The status of a flat list of messages, whatever they were read out of.
 *
 * Messages rather than fights, and the argument narrowed when the path route
 * arrived: this counts messages and has never looked at anything else a
 * `CapturedFight` carries. Asking for one meant the probe over an invented
 * message had to build a whole recording around it — a format version, a world,
 * an empty roster, an entry health of nobody — none of which the answer
 * depended on. A signature that asks for more than it reads is one the next
 * caller has to satisfy with fiction.
 */
export function getDecodingStatus(messages: readonly string[]): DecodingStatus {
  const eventsByKind: Record<string, number> = {};
  const occurrences = new Map<string, number>();
  const sampleMessages = new Map<string, string>();
  let messagesRead = 0;
  let messagesWithUnread = 0;

  for (const message of messages) {
    messagesRead += 1;

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
    messages: messagesRead,
    messagesWithUnread,
    eventsByKind,
    unreadKeysByFrequency: [...unreadOccurrences]
      .map(([key, occurrences]) => ({ key, occurrences }))
      .sort((a, b) => b.occurrences - a.occurrences || getTextOrder(a.key, b.key)),
  };
}

/**
 * Every message of the captured material, in the order the catalog holds it.
 *
 * The default, and the only reading that is a claim about this repository — a
 * report over anything else names what it was taken on, which is §3's rule and
 * the reason `writeStatusReport` prints the material before it prints a figure.
 */
export function getMessagesOfCapturedMaterial(): string[] {
  return CAPTURED_FIGHTS.flatMap((fight) => getMessagesOfFight(fight));
}

/**
 * Every message of one recording named by path, which need not be material.
 *
 * Read with `parseFightDump`, so a file this tool accepts is a file the captures
 * directory would accept too — a recording that refuses here would have refused
 * at intake, and finding that out before the redaction step is the point (§9.1
 * permits the import, and the live and offline paths must not disagree about
 * what a recording says).
 *
 * The missing-file refusal is its own, and it is worth having: `readFileSync`
 * throws a Node error whose brand says nothing about this program, and §9.5
 * asks a tool handed bad material to refuse it under a name a reader can place.
 */
export function getMessagesOfDumpAt(path: string): string[] {
  if (!existsSync(path)) throw new DecodingStatusError(`${path} is not there`);
  return getMessagesOfDump(parseFightDump(readFileSync(path, "utf8")));
}

function writeStatusReport(status: DecodingStatus, material: string): void {
  const read = status.messages - status.messagesWithUnread;
  console.log(`material          ${material}`);
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

if (import.meta.main) {
  const paths = process.argv.slice(2);
  writeStatusReport(
    getDecodingStatus(
      paths.length === 0
        ? getMessagesOfCapturedMaterial()
        : paths.flatMap((path) => getMessagesOfDumpAt(path)),
    ),
    paths.length === 0 ? "tests/captured-fights/" : paths.join(" "),
  );
}
