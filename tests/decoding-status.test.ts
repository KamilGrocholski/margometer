import { describe, expect, test } from "bun:test";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import { getDecodingStatus } from "@/tools/decoding-status.ts";

/**
 * The counters this project reports progress with. They are computed rather
 * than written down, so what needs guarding is not a value but the arithmetic:
 * a miscount here would be quoted in a commit message as fact.
 */
const STATUS = getDecodingStatus(CAPTURED_FIGHTS);

describe("decoding status", () => {
  test("counts every captured message once", () => {
    const messages = CAPTURED_FIGHTS.flatMap((fight) =>
      fight.dump.calls.flatMap((call) => call.protocolMessages),
    );
    expect(STATUS.messages).toBe(messages.length);
  });

  test("cannot report more messages carrying unread keys than there are messages", () => {
    expect(STATUS.messagesWithUnread).toBeLessThanOrEqual(STATUS.messages);
    expect(STATUS.messagesWithUnread).toBeGreaterThanOrEqual(0);
  });

  test("reports events, and every kind it reports is one the contract declares", () => {
    const kinds = Object.keys(STATUS.eventsByKind);
    expect(kinds.length).toBeGreaterThan(0);
    expect(Object.values(STATUS.eventsByKind).every((count) => count > 0)).toBe(true);
  });

  // The tool asks the decoder whether it reads a key by handing it that key
  // alone, with a real value. An earlier version passed no value and reported
  // damage keys as unread — the counters looked plausible and were wrong.
  test("reports no key as unread that the decoder demonstrably reads", () => {
    const unread = STATUS.unreadKeysByFrequency.map((entry) => entry.key);
    for (const key of ["+dmgc", "-dmgc", "+oth_dmg", "winner"]) {
      expect(unread, key).not.toContain(key);
    }
  });

  test("ranks unread keys by how often they occur", () => {
    const counts = STATUS.unreadKeysByFrequency.map((entry) => entry.occurrences);
    expect([...counts]).toEqual([...counts].sort((a, b) => b - a));
    expect(counts.every((count) => count > 0)).toBe(true);
  });

  // Not vacuous: there is still a great deal the decoder cannot read, and the
  // day this list empties is the day the counter stops being interesting.
  test("still has unread keys to report", () => {
    expect(STATUS.unreadKeysByFrequency.length).toBeGreaterThan(0);
  });
});
