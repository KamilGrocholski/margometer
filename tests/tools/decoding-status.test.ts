/**
 * What the decoder could not read, counted — proved on a sample it must flag and one it must not.
 *
 * The second is the corpus, which is read whole; without it a reader that had stopped finding its
 * subject would pass every run. The first is the probe shape `tests/core/fight-decoder.test.ts`
 * keeps: a real announcement with a key the register has never seen put beside it, which is what
 * the next protocol change will look like.
 */

import { assert, assertArrayIncludes, assertEquals } from "@std/assert";
import { BATTLE_EVENT_KINDS } from "@/src/core/battle-event.ts";
import { composeDecodingStatus, composeStatusReport } from "@/tools/decoding-status.ts";
import { composeFightReplay, composeReplayedMaterial } from "@/tools/fight-replay.ts";

/** A key the register has never seen, on an announcement that is otherwise a real one. */
const UNREAD = "469657=87.63;469657=87.63;tspell=Zdrowa atmosfera;skillId=79;whatever_per=30";
/** A message whose grammar fails before any key is reached. */
const REFUSED = "gracz;0;step";
const READ = "482845=100.00;0;heal=99";

function replayOf(messages: readonly string[]) {
    return composeFightReplay({
        name: "a fight nobody recorded",
        calls: [{ init: 1, m: messages }],
    });
}

Deno.test("the corpus reads whole, and the report says so rather than staying silent", () => {
    const status = composeDecodingStatus(composeReplayedMaterial([]).replays);
    assertEquals(status.unreadKeysByFrequency, [], "no key of the material goes unread");
    assertEquals(status.messagesWithUnread, 0, "and no message carries anything unread");
    assertEquals(status.messagesRefused, 0, "nor does the grammar refuse one");
    assert(status.messages > status.payloads, "a payload carries more than one message");

    const report = composeStatusReport(composeReplayedMaterial([]));
    assertArrayIncludes(report, ["  every key was read"], "an empty tally is an answer, not a gap");
    assert(report.some((line) => line.startsWith("material          captures/")), "material named");
});

Deno.test("a key the register has never seen is reported, naming it", () => {
    const status = composeDecodingStatus([replayOf([UNREAD, UNREAD, READ])]);
    assertEquals(status.unreadKeysByFrequency, [["whatever_per", 2]], "one entry per occurrence");
    assertEquals(status.messagesWithUnread, 2, "on the two messages that carried it");
    assertEquals(status.messagesRefused, 0, "and the grammar refused neither");
    assertEquals(status.messages, 3, "the message that read fine is still counted");

    const lines = composeStatusReport({ material: "a probe", replays: [replayOf([UNREAD])] });
    assert(lines.some((line) => line.endsWith("  whatever_per")), "the key reaches the report");
    assert(!lines.includes("  every key was read"), "which is not what a read corpus says");
});

/** Two different failures: one says a key has no meaning yet, the other reached no key at all. */
Deno.test("a message the grammar refused is counted apart from a key nobody has read", () => {
    const status = composeDecodingStatus([replayOf([REFUSED, UNREAD])]);
    assertEquals(status.messagesWithUnread, 2, "both messages carry something unread");
    assertEquals(status.messagesRefused, 1, "and exactly one of them is a refusal");
    assertEquals(status.unreadKeysByFrequency, [["whatever_per", 1]], "a refusal names no key");
});

/** **W5**: zero is a boundary, and a family that stopped being read shows as a nought. */
Deno.test("every kind the union holds has a line, at whatever it came to", () => {
    const status = composeDecodingStatus([replayOf([READ])]);
    assertEquals(status.eventsByKind.size, BATTLE_EVENT_KINDS.length, "one line per kind");
    assertEquals(status.eventsByKind.get("health-change"), 1, "the one this message produced");
    assertEquals(status.eventsByKind.get("attack"), 0, "and a nought for the ones it did not");
    assertEquals(status.eventsByKind.get("unknown-message"), 0, "nothing here went unread");
});

Deno.test("what never reached the decoder is stated beside what it could not read", () => {
    const replay = composeFightReplay({
        name: "a payload that lost one",
        // The companion list states three where `m` carries two, which is a message the session
        // never saw — a different failure from one it saw and could not read.
        calls: [{ init: 1, mi: [0, 0, 0], m: [READ, READ] }],
    });
    const status = composeDecodingStatus([replay]);
    assertEquals(status.messagesLost, 1, "the payload said it carried one more");
    assertEquals(status.messagesWithUnread, 0, "and nothing that arrived went unread");
    assertEquals(status.messages, 2, "only what arrived is counted as a message");
});
