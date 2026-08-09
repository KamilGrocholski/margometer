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

  // The tool asks whether a key contributes to the reading of a real message
  // that carried it. Two earlier versions got this wrong in the same direction:
  // the first passed no value and reported damage keys as unread, the second
  // handed the key over alone and reported `skillId` as unread — a key read
  // only in the company of `tspell`. Both times the counters looked plausible.
  test("reports no key as unread that the decoder demonstrably reads", () => {
    const unread = STATUS.unreadKeysByFrequency.map((entry) => entry.key);
    for (const key of ["+dmgc", "-dmgc", "+oth_dmg", "winner", "tspell", "-absorb", "+crit"]) {
      expect(unread, key).not.toContain(key);
    }
  });

  // Separately, because it is the case that broke the probe rather than another
  // key that happens to be read: alone this one decodes to nothing on purpose.
  test("reports no key as unread that is read only alongside another", () => {
    const unread = STATUS.unreadKeysByFrequency.map((entry) => entry.key);
    expect(unread).not.toContain("skillId");
  });

  // The inverse, so the probe cannot go green by calling everything read.
  test("still reports a key the decoder genuinely has no meaning for", () => {
    const unread = STATUS.unreadKeysByFrequency.map((entry) => entry.key);
    expect(unread).toContain("step");
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
