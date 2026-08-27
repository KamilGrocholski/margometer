/**
 * The counters this project reports progress with. They are computed rather
 * than written down, so what needs guarding is not a value but the arithmetic:
 * a miscount here would be quoted in a commit message as fact.
 */

import { describe, expect, test } from "bun:test";
import {
  CAPTURED_FIGHTS,
  CAPTURED_FIGHTS_DIRECTORY,
  getMessagesOfFight,
} from "@/tests/captured-fight-catalog.ts";
import {
  DecodingStatusError,
  getDecodingStatus,
  getMessagesOfCapturedMaterial,
  getMessagesOfDumpAt,
} from "@/tools/decoding-status.ts";
import { assertDefined } from "@/libs/assert.ts";
import { DAMAGE_TO_NAMED_KEY } from "@/src/core/fight-decoder.ts";

const STATUS = getDecodingStatus(getMessagesOfCapturedMaterial());

describe("decoding status", () => {
  test("counts every captured message once", () => {
    const messages = CAPTURED_FIGHTS.flatMap((fight) =>
      getMessagesOfFight(fight),
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
  // Spelled here rather than imported, for the reason `tests/core/` spells them:
  // the claim is that the tool finds these read, and a list taken from the
  // decoder would be a list of what the decoder says it reads (§9.3).
  test("reports no key as unread that the decoder demonstrably reads", () => {
    const unread = STATUS.unreadKeysByFrequency.map((entry) => entry.key);
    for (const key of ["+dmgc", "-dmgc", DAMAGE_TO_NAMED_KEY, "winner", "tspell", "-absorb", "+crit"]) {
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
    const invented = getDecodingStatus(["1=100.00;2=50.00;+dmg=5;no_such_key=1"]);
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

/**
 * The route that lets a recording be measured before it is material.
 *
 * A fresh dump has to pass intake to become a capture, and intake is the
 * expensive half — so the tool has to be able to read a file that is not in the
 * material directory, or the answer that decides whether intake is worth
 * starting arrives only after it is finished.
 *
 * ⚠️ **Checked against a capture, which is the one dump this test can name and
 * still be reading the tool rather than a fixture it wrote itself.** Nothing
 * here says the file is outside the directory — what is checked is that naming a
 * path and going through the catalog produce the same reading, which is the
 * claim the route rests on. The file is reached through
 * `CAPTURED_FIGHTS_DIRECTORY` and a name off the catalog, never a name written
 * down here (§9.2).
 */
describe("a recording named by path", () => {
  const fight = assertDefined(CAPTURED_FIGHTS[0], "the material is not empty");
  const path = `${CAPTURED_FIGHTS_DIRECTORY}${fight.name}.json`;

  test("reads the same messages the catalog reads out of the same file", () => {
    expect(getMessagesOfDumpAt(path)).toEqual(getMessagesOfFight(fight));
  });

  test("reports on it without the rest of the material coming with it", () => {
    const status = getDecodingStatus(getMessagesOfDumpAt(path));
    expect(status.messages).toBe(getMessagesOfFight(fight).length);
    expect(status.messages).toBeLessThan(STATUS.messages);
  });

  // Branded, because a bare Node `ENOENT` names no program and §9.5 asks a tool
  // to refuse under a name a reader can place.
  test("refuses a path that is not there, under this tool's own name", () => {
    expect(() => getMessagesOfDumpAt(`${path}.no-such-file`)).toThrow(DecodingStatusError);
  });
});
