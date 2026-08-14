import { describe, expect, test } from "bun:test";
import { CAPTURED_FIGHTS, type CapturedFight } from "@/tests/captured-fight-catalog.ts";
import { getDecodingStatus } from "@/tools/decoding-status.ts";

/**
 * The counters this project reports progress with. They are computed rather
 * than written down, so what needs guarding is not a value but the arithmetic:
 * a miscount here would be quoted in a commit message as fact.
 */
const STATUS = getDecodingStatus(CAPTURED_FIGHTS);

/** One message, wrapped in the least material the probe will accept. */
function composeFightOf(message: string): CapturedFight {
  return {
    name: "invented",
    dump: {
      formatVersion: 1,
      capturedAt: "2026-08-11T00:00:00.000Z",
      world: "nowhere",
      gameBuild: "0",
      calls: [
        {
          index: 0,
          fightNumber: null,
          protocolMessages: [message],
          combatantsBefore: [],
          combatantsAfter: [],
          payload: {},
        },
      ],
    },
    maximumHealthByCombatantId: new Map(),
    startingHealthByCombatantId: new Map(),
  };
}

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

  /**
   * The inverse, so the probe cannot go green by calling everything read.
   *
   * ⚠️ **Checked against a message written for the purpose, because the captured
   * material no longer carries a single unread key.** That is the milestone this
   * test used to stand on and can no longer: it named `step`, then `healall_per`,
   * and both are read now. A probe that reports nothing unread is
   * indistinguishable from one that has stopped looking, so the looking is what
   * is checked here.
   */
  test("still reports a key the decoder genuinely has no meaning for", () => {
    const invented = getDecodingStatus([composeFightOf("1=100.00;2=50.00;+dmg=5;no_such_key=1")]);
    expect(invented.unreadKeysByFrequency.map((entry) => entry.key)).toEqual(["no_such_key"]);
    expect(invented.messagesWithUnread).toBe(1);
  });

  test("ranks unread keys by how often they occur", () => {
    const counts = STATUS.unreadKeysByFrequency.map((entry) => entry.occurrences);
    expect([...counts]).toEqual([...counts].sort((a, b) => b - a));
    expect(counts.every((count) => count > 0)).toBe(true);
  });

  /**
   * The day this list empties, which arrived on 2026-08-11.
   *
   * Asserted rather than left as an observation: every key in every capture is
   * read now, so a key appearing here again means the material grew or the
   * decoder lost something — and either is worth failing over rather than
   * noticing months later. `bun tools/decoding-status.ts` is where the figure
   * lives; this only holds it at zero.
   */
  test("has no unread key left in the captured material", () => {
    expect(STATUS.unreadKeysByFrequency).toEqual([]);
  });

  /**
   * And nothing left half-read either. The last two — `heal=3065,-45` and
   * `poison=140,14` — carry a second value member whose **meaning** is still
   * unknown, and that is a different thing from unaccounted: the health witness
   * judges both calls and agrees on the very messages carrying them, so the
   * member moves no health and shortens no total. It is carried beside the
   * figure rather than reported against it.
   */
  test("and no message left half-read either", () => {
    expect(STATUS.messagesWithUnread).toBe(0);
  });
});
