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
import { decodeFight, UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

const ANNOUNCEMENT_KEY = "+injure";
const TICK_KEY = "injure";

/** A floor, not a rounding: 658 taken announces 98, where rounding would say 99. */
const WOUND_SHARE = 0.15;

/**
 * The two applied figures the share is **not** taken from.
 *
 * ⚠️ **The old three captures could not tell.** They carried `+injure` only on
 * blows with a single applied figure, so "a share of the damage this message
 * reports taken" fitted 17 of 17 and read as settled. The group fights of
 * 2026-08-12 land it beside an offhand blow and beside added damage, and there
 * the total is the wrong divisor: 1255 taken announces 37, which is the share of
 * the 252 the main hand landed and nothing like the share of the whole.
 *
 * Excluding both makes it 20 of 20, including every one of the original 17 —
 * neither key appears in those, so this narrows the rule without weakening what
 * it already held. The help calls the Third Blow's damage auxiliary and says
 * such damage is reduced by its own effects (`of-thirdatt`, read 2026-08-09);
 * the wound is a share of the main blow, not of everything that landed with it.
 */
const SHARE_EXCLUDES = ["-dmgo", "-dmga"];

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
        .filter(
          (parameter) =>
            parameter.key.startsWith("-dmg") &&
            !SHARE_EXCLUDES.includes(parameter.key) &&
            parameter.value !== null,
        )
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

  /**
   * Read, and read as a **declaration** — which is the distinction the whole
   * entry turns on. The wound arrives again, in full, as its own tick; counting
   * the announcement as damage as well would land it twice.
   *
   * This test used to assert the key was not read at all. That was the only way
   * to say "do not count this" while the contract had no slot for a stated
   * input; now there is one, and the claim it holds is the stronger of the two —
   * not *unseen*, but *seen and never totalled*.
   */
  test("is read as a declaration, and reaches no combatant's figures", () => {
    expect(UNDERSTOOD_PROTOCOL_KEYS).toContain(ANNOUNCEMENT_KEY);
    expect(UNDERSTOOD_PROTOCOL_KEYS).toContain(TICK_KEY);

    const [attack] = decodeFight(["1=90.00;2=50.00;+dmg=500;-dmg=400;+injure=60"]);
    expect(attack).toMatchObject({
      kind: "attack",
      declared: [{ effect: ANNOUNCEMENT_KEY, amount: 60, text: null }],
    });

    const statistics = composeFightStatistics(
      decodeFight(["1=90.00;2=50.00;+dmg=500;-dmg=400;+injure=60"]),
    );
    // 400 taken, and not one point more for the wound announced beside it.
    expect(statistics.byCombatantId.get(2)?.taken).toBe(400);
    expect(statistics.byCombatantId.get(1)?.dealtApplied).toBe(400);
    expect(statistics.reading.unreadableMessages).toBe(0);
  });
});
