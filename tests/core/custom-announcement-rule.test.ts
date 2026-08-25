/**
 * The second spelling of an announcement, and the one condition it is read under.
 *
 * `tcustom` names what a combatant used, the way `tspell` does, and the decoder
 * puts both into the same event. What makes it a different key rather than a
 * synonym is which slot the client reads the name against: production build
 * `53XkBRxF` composes `tspell` with the **actor** interpolated and this one
 * with the **target** (`msg_tcustom_target %target% %val%`). So on a message
 * naming two different combatants the protocol would not say whose use it was,
 * and taking the actor — which is what the event's ranking would do with it —
 * would be §5's guess.
 *
 * ⚠️ **The reading is therefore narrowed to a message naming exactly one
 * combatant**, which is every occurrence the captures carry: both ends the same,
 * or one end unstated, and either way no second name to get wrong. That narrowing
 * is asserted here from both sides — the material, so a recording that brings the
 * other shape fails rather than being read under a rule it invalidates, and the
 * decoder, so the refusal is a refusal and not a docblock.
 *
 * The names themselves stay out of this file: they are the operator's, and a
 * hand-written one stands in wherever a name is needed (NOTICE.md,
 * `tests/tools/source-layout.test.ts`).
 */

import { describe, expect, test } from "bun:test";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS, getMessagesOfFight } from "@/tests/captured-fight-catalog.ts";

// Restated rather than imported: this file asserts what the decoder reads, and a
// test reading the decoder's own list agrees with it by construction (§9.3).
const CUSTOM_NAME_KEY = "tcustom";

type Occurrence = {
  fight: string;
  message: string;
  actorId: number | null;
  targetId: number | null;
  value: string | null;
};

const OCCURRENCES: Occurrence[] = CAPTURED_FIGHTS.flatMap((fight) =>
  getMessagesOfFight(fight).flatMap((message) => {
    const parsed = parseProtocolMessage(message);
    const stated = parsed.parameters.find((parameter) => parameter.key === CUSTOM_NAME_KEY);
    if (stated === undefined) return [];
    return [
      {
        fight: fight.name,
        message,
        actorId: parsed.actor?.combatantId ?? null,
        targetId: parsed.target?.combatantId ?? null,
        value: stated.value,
      },
    ];
  }),
);

describe("an announcement the game named itself", () => {
  // Without this every assertion below passes over an empty list, which is what a
  // guard over material nobody records looks like right up until it matters.
  test("the captures carry announcements to check", () => {
    expect(OCCURRENCES.length).toBeGreaterThan(0);
  });

  /**
   * The load-bearing shape. One combatant named is what makes the use somebody's
   * without an inference; two would need the client's slot to be trusted, and the
   * slot is the thing this key differs from `tspell` in.
   */
  test("every one of them names exactly one combatant", () => {
    const ambiguous = OCCURRENCES.filter(
      (announcement) =>
        announcement.actorId !== null &&
        announcement.targetId !== null &&
        announcement.actorId !== announcement.targetId,
    );
    expect(ambiguous.map((announcement) => announcement.message)).toEqual([]);
  });

  test("and every one of them states a name", () => {
    const nameless = OCCURRENCES.filter(
      (announcement) => announcement.value === null || announcement.value === "",
    );
    expect(nameless.map((announcement) => announcement.message)).toEqual([]);
  });

  /**
   * Read off the events rather than off the decoder's tables: what is under test
   * is that the announcement reaches the panel as one somebody used, which is a
   * property of the output.
   */
  test("each reaches the reading as one combatant's use of what it names", () => {
    const announced = CAPTURED_FIGHTS.flatMap((fight) =>
      decodeFight(getMessagesOfFight(fight), null).filter((event) => event.kind === "skill-used"),
    );
    const byName = new Map(announced.map((event) => [event.skillName, event]));

    for (const announcement of OCCURRENCES) {
      const event = byName.get(announcement.value ?? "");
      expect(event, announcement.message).toBeDefined();
      expect(event?.actorId ?? event?.targetId, announcement.message).not.toBeNull();
    }
  });

  /**
   * The whole message, not only its name. Every key riding one of these is one the
   * register holds, so an announcement of this kind leaves nothing behind that
   * would mark a row — which is the state `docs/protocol-keys.md` records for the
   * cleanses beside it.
   */
  test("nothing on such a message is left unread", () => {
    const unread = CAPTURED_FIGHTS.flatMap((fight) =>
      decodeFight(getMessagesOfFight(fight), null)
        .filter((event) => event.kind === "unknown-message")
        .filter((event) => event.message.includes(`${CUSTOM_NAME_KEY}=`))
        .map((event) => event.message),
    );
    expect(unread).toEqual([]);
  });
});

describe("the decoder against a message the captures have not sent", () => {
  // The name is ours, not the game's, so it can be written down here.
  const NAME = "Czar testowy";

  test("announces nothing where two different combatants are named", () => {
    const events = decodeFight([`1=90.00;2=50.00;${CUSTOM_NAME_KEY}=${NAME}`], null);

    expect(events.filter((event) => event.kind === "skill-used")).toEqual([]);
    const unknown = events.filter((event) => event.kind === "unknown-message");
    expect(unknown.flatMap((event) => event.unreadKeys)).toEqual([CUSTOM_NAME_KEY]);
  });

  // The positive control. Without it the refusal above is satisfied by a decoder
  // that reads this key on no message at all.
  test("announces where the message names one combatant twice", () => {
    const events = decodeFight([`1=90.00;1=90.00;${CUSTOM_NAME_KEY}=${NAME}`], null);
    const announced = events.filter((event) => event.kind === "skill-used");

    expect(announced.map((event) => event.skillName)).toEqual([NAME]);
    expect(events.filter((event) => event.kind === "unknown-message")).toEqual([]);
  });

  test("and refuses a name that is no name", () => {
    const events = decodeFight([`1=90.00;1=90.00;${CUSTOM_NAME_KEY}=`], null);

    expect(events.filter((event) => event.kind === "skill-used")).toEqual([]);
    expect(
      events.filter((event) => event.kind === "unknown-message").flatMap((event) => event.unreadKeys),
    ).toEqual([CUSTOM_NAME_KEY]);
  });
});
