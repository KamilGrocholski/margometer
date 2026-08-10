/**
 * The rule `docs/protocol-keys.md` states for `+injure`, re-earned on every run.
 *
 * The help supplied the rule and the captures confirmed it; prose would leave it
 * at that. This is the part a machine can check (AGENTS.md §7.5), and it is
 * worth checking because the entry's conclusion — that the key must stay unread
 * — is the kind that looks like an oversight to whoever meets it next.
 */

import { describe, expect, test } from "bun:test";
import { getIntegerFromText } from "@/libs/number.ts";
import { UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

const ANNOUNCEMENT_KEY = "+injure";
const TICK_KEY = "injure";

/** A floor, not a rounding: 658 taken announces 98, where rounding would say 99. */
const WOUND_SHARE = 0.15;

type Announcement = { stated: number; taken: number; message: string };

const ANNOUNCEMENTS: Announcement[] = CAPTURED_FIGHTS.flatMap((fight) =>
  fight.dump.calls.flatMap((call) =>
    call.protocolMessages.flatMap((message) => {
      const { parameters } = parseProtocolMessage(message);

      const announced = parameters.find((parameter) => parameter.key === ANNOUNCEMENT_KEY);
      if (announced === undefined || announced.value === null) return [];
      const stated = getIntegerFromText(announced.value);
      if (stated === null) return [];

      // The figure health actually moves by, which is the side the witness adds
      // up as taken — not the raw roll the same message also carries.
      const taken = parameters
        .filter((parameter) => parameter.key.startsWith("-dmg") && parameter.value !== null)
        .map((parameter) => getIntegerFromText(parameter.value ?? "") ?? 0)
        .reduce((total, amount) => total + amount, 0);

      return [{ stated, taken, message }];
    }),
  ),
);

describe("what `+injure` announces", () => {
  test("the captures carry applications to check", () => {
    expect(ANNOUNCEMENTS.length).toBeGreaterThan(0);
  });

  test("is a share of the damage its own message reports taken", () => {
    const disagreeing = ANNOUNCEMENTS.filter(
      ({ stated, taken }) => Math.floor(taken * WOUND_SHARE) !== stated,
    );
    expect(disagreeing).toEqual([]);
  });

  // Without this the check above would pass on a fight where nothing was ever
  // reduced, comparing zero against zero and proving nothing about the share.
  test("the damage it is a share of is not zero", () => {
    expect(ANNOUNCEMENTS.every(({ taken }) => taken > 0)).toBe(true);
  });

  // The reason the entry says "deliberately not read". The wound arrives again,
  // in full, as its own tick; counting the announcement too doubles it.
  test("stays unread, because the tick that follows is what moves health", () => {
    expect(UNDERSTOOD_PROTOCOL_KEYS).not.toContain(ANNOUNCEMENT_KEY);
    expect(UNDERSTOOD_PROTOCOL_KEYS).toContain(TICK_KEY);
  });
});
