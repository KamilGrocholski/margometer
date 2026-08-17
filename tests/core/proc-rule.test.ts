/**
 * What the decoder is allowed to read as a proc, re-earned on every run.
 *
 * A proc is a fact with no number attached, so the whole family rests on one
 * property: the protocol states the key and stops.
 *
 * What this actually guards is the **branch**, not the list. Admitting a key
 * that carries a figure lights nothing here, because the decoder sends such a
 * key back to unread rather than into `procs` — checked by mutation, and worth
 * recording because the test reads as though it caught that. Delete the
 * `value === null` check and these tests go red; a wrong entry in the list is
 * caught by the register instead, which holds every decoded key to an entry.
 */

import { describe, expect, test } from "bun:test";
import { decodeFight, isDamageKey } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

/**
 * The key the client composes with a `%val%` hole while our own material carries
 * no value for it — production build `1785244275300`. It looks exactly like a
 * proc here and is not one, which is why it is named rather than described.
 */
const LOOKS_LIKE_A_PROC = "+legbon_holytouch";

type Landed = { proc: string; keys: { key: string; value: string | null }[]; isOnBlow: boolean };

const LANDED: Landed[] = CAPTURED_FIGHTS.flatMap((fight) =>
  fight.dump.calls.flatMap((call) =>
    call.protocolMessages.flatMap((message) => {
      const { parameters } = parseProtocolMessage(message);
      const procs = decodeFight([message])
        .filter((event) => event.kind === "attack")
        .flatMap((event) => event.procs);
      return procs.map((proc) => ({
        proc,
        keys: parameters,
        isOnBlow: parameters.some((parameter) => isDamageKey(parameter.key)),
      }));
    }),
  ),
);

describe("what lands in `procs`", () => {
  test("the captures produce procs to check", () => {
    expect(LANDED.length).toBeGreaterThan(0);
  });

  /**
   * The property the family is defined by. `procs` drops the sign, so the check
   * goes back to the message and asks whether the key it came from stated a
   * value — reading the sign off the proc name instead would test our own
   * slicing rather than the protocol.
   */
  test("every one came from a key that stated no value", () => {
    const withFigure = LANDED.filter(
      ({ proc, keys }) =>
        !keys.some((parameter) => parameter.key.slice(1) === proc && parameter.value === null),
    );
    expect(withFigure).toEqual([]);
  });

  // A proc annotates a blow. One arriving on a message with no damage at all
  // would mean the family has drifted into something else.
  test("every one arrived on a message that also carries damage", () => {
    expect(LANDED.filter(({ isOnBlow }) => !isOnBlow)).toEqual([]);
  });
});

describe("the key that looks like a proc and is not", () => {
  const carrying = CAPTURED_FIGHTS.flatMap((fight) =>
    fight.dump.calls.flatMap((call) =>
      call.protocolMessages.filter((message) =>
        parseProtocolMessage(message).parameters.some(
          (parameter) => parameter.key === LOOKS_LIKE_A_PROC,
        ),
      ),
    ),
  );

  test("the captures carry it", () => {
    expect(carrying.length).toBeGreaterThan(0);
  });

  // Why it is tempting: on our material it is indistinguishable from a proc.
  test("arrives with no value, exactly like a proc does", () => {
    for (const message of carrying) {
      const stated = parseProtocolMessage(message).parameters.find(
        (parameter) => parameter.key === LOOKS_LIKE_A_PROC,
      );
      expect(stated?.value).toBeNull();
    }
  });

  /**
   * And why it is still refused the flag family: the client states a figure for
   * it, so reading it as a bare flag would settle from our one sample what the
   * game settles. It is read as a **declaration** instead — which claims only
   * that no total counts it, measured by the health arithmetic closing exactly on
   * the message that carries it — and **only while it carries no value**.
   */
  test("is not read as one, and a value sends it back to unread", () => {
    for (const message of carrying) {
      const events = decodeFight([message]);
      const procs = events
        .filter((event) => event.kind === "attack")
        .flatMap((event) => event.procs);
      expect(procs).not.toContain(LOOKS_LIKE_A_PROC.slice(1));
      expect(events.some((event) => event.kind === "unknown-message")).toBe(false);
      expect(
        events
          .filter((event) => event.kind === "attack")
          .flatMap((event) => event.declared)
          .map((declared) => declared.effect),
      ).toContain(LOOKS_LIKE_A_PROC);
    }

    // The disagreement the entry is about: the day a figure arrives, it is loud.
    const withFigure = decodeFight([`1=90.00;2=50.00;+dmg=5;-dmg=4;${LOOKS_LIKE_A_PROC}=7`]);
    expect(withFigure.some((event) => event.kind === "unknown-message")).toBe(true);
    expect(withFigure).toContainEqual(
      expect.objectContaining({ unreadKeys: [LOOKS_LIKE_A_PROC] }),
    );
  });
});
