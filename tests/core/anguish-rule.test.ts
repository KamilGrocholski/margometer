/**
 * `anguish` read as a health figure, and read as belonging to nobody.
 *
 * The arithmetic is not this file's to prove. `tests/core/health-witness.test.ts`
 * reaches 421 comparisons in the one recording that carries this key and every
 * one of them agrees; flipping either the sign or the slot breaks it. Repeating
 * that here would be a second copy of a measurement, which is what §7.1 refuses.
 *
 * What the witness cannot see is who the figure is charged to. It sums health per
 * combatant, so a tick charged to the player who applied the bleed and a tick
 * charged to nobody move the same pool by the same amount and the replay closes
 * either way. That is the whole subject of this file — and it matters, because
 * this key arrives in the one shape §9.6's fourth clause was written for: a tick
 * naming its victim and nobody else, with an earlier message that named both
 * ends.
 *
 * ⚠️ **What disqualifies it is a fact about the announcement, not a preference.**
 * `+injure` states the figure that says which application is ticking; the wound
 * rule rests entirely on that. `+legbon_anguish` states nothing — production build
 * `1786514810315` composes `msg_+legbon_anguish %val%`, so the client expects one,
 * and every occurrence in the material sends none. With no figure there is nothing
 * to match a tick against, and charging it to the nearest earlier application
 * would be §5's guess. That absence is asserted below rather than described,
 * because the day a value arrives is the day this reading has to be looked at
 * again (`docs/protocol-keys.md`, `src/core/fight-decoder.ts`).
 *
 * The other thing the witness cannot see is that the ticks arrive **half-named**
 * at all — one end stated, the other nobody — which is what puts them on the
 * panel's `Nieznany sprawca` row rather than in a combatant's ranking
 * (`docs/half-named-figures.md`).
 */

import { describe, expect, test } from "bun:test";
import { getIntegerFromText } from "@/libs/number.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS, getMessagesOfFight } from "@/tests/captured-fight-catalog.ts";

// Restated rather than imported: this file asserts what the decoder reads, and a
// test reading the decoder's own list agrees with it by construction (§9.3).
const TICK_KEY = "anguish";
const ANNOUNCEMENT_KEY = "+legbon_anguish";

type Occurrence = {
  fight: string;
  message: string;
  /** Every key on the message, so "alone but for the ends" can be checked. */
  keys: string[];
  actorId: number | null;
  targetId: number | null;
  value: string | null;
};

function composeOccurrences(key: string): Occurrence[] {
  return CAPTURED_FIGHTS.flatMap((fight) =>
    fight.dump.calls.flatMap((call) =>
      call.protocolMessages.flatMap((message) => {
        const parsed = parseProtocolMessage(message);
        const stated = parsed.parameters.find((parameter) => parameter.key === key);
        if (stated === undefined) return [];
        return [
          {
            fight: fight.name,
            message,
            keys: parsed.parameters.map((parameter) => parameter.key),
            actorId: parsed.actor?.combatantId ?? null,
            targetId: parsed.target?.combatantId ?? null,
            value: stated.value,
          },
        ];
      }),
    ),
  );
}

const TICKS = composeOccurrences(TICK_KEY);
const ANNOUNCEMENTS = composeOccurrences(ANNOUNCEMENT_KEY);

describe("the bleed a legendary bonus lays on", () => {
  // Either half going to zero turns every assertion below green without it
  // comparing anything.
  test("the captures carry ticks and applications to check", () => {
    expect(TICKS.length).toBeGreaterThan(0);
    expect(ANNOUNCEMENTS.length).toBeGreaterThan(0);
  });

  test("every tick names its victim and nobody at the other end", () => {
    const wrong = TICKS.filter((tick) => tick.actorId === null || tick.targetId !== null);
    expect(wrong.map((tick) => tick.message)).toEqual([]);
  });

  // The half-named shape is the whole message, not one key inside a busier one: a
  // tick sharing a message with a blow would let the blow's ends name it.
  test("a tick rides a message of its own", () => {
    const shared = TICKS.filter((tick) => tick.keys.length !== 1);
    expect(shared.map((tick) => tick.message)).toEqual([]);
  });

  test("every tick states a whole number", () => {
    const unreadable = TICKS.filter(
      (tick) => tick.value === null || getIntegerFromText(tick.value) === null,
    );
    expect(unreadable.map((tick) => tick.message)).toEqual([]);
  });

  /**
   * The load-bearing absence. Written as an assertion about the material and not
   * as a sentence in a docblock, so a recording that brings a figure fails here
   * rather than passing quietly under a reading it invalidates.
   */
  test("no application states a figure a tick could be matched against", () => {
    const stated = ANNOUNCEMENTS.filter((announcement) => announcement.value !== null);
    expect(stated.map((announcement) => announcement.message)).toEqual([]);
  });

  test("an application names both ends, which is what makes the absence matter", () => {
    const halfNamed = ANNOUNCEMENTS.filter(
      (announcement) => announcement.actorId === null || announcement.targetId === null,
    );
    expect(halfNamed.map((announcement) => announcement.message)).toEqual([]);
  });

  /**
   * And the decoder does not quietly do what the paragraph above says it must not.
   *
   * Read off the events rather than off the decoder's tables: what is being
   * checked is that a tick's health movement is attributed to the combatant the
   * message named and to no one else, which is a property of the output.
   */
  test("a tick is charged to its victim and never to whoever applied it", () => {
    const appliers = new Set(
      ANNOUNCEMENTS.map((announcement) => announcement.actorId).filter(
        (id): id is number => id !== null,
      ),
    );
    expect(appliers.size).toBeGreaterThan(0);

    const charged = CAPTURED_FIGHTS.flatMap((fight) =>
      decodeFight(getMessagesOfFight(fight), null)
        .filter((event) => event.kind === "health-change" && event.source === TICK_KEY)
        .map((event) => (event.kind === "health-change" ? event.combatantId : null)),
    );

    expect(charged.length).toBe(TICKS.length);
    expect(charged.filter((id) => id === null)).toEqual([]);
    expect(charged.filter((id) => id !== null && appliers.has(id))).toEqual([]);
  });
});
