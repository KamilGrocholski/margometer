/**
 * What a skill announcement carries, and what `combo-max` is doing on it.
 *
 * This file exists because the register was wrong. It said an announcement
 * carries no damage at all and that whatever the skill does arrives in a later
 * message — true of the damage family, which is what had been measured, and
 * false of the protocol: damage aimed at a **name** rides the announcement
 * itself, and so does healing. The claim and its correction are both held here,
 * because the wrong version was the kind that reads as settled.
 */

import { describe, expect, test } from "bun:test";
import { getIntegerFromText } from "@/libs/number.ts";
import { decodeFight, UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import { getKeysWithHealthEffect } from "@/tests/protocol-key-register.ts";

const SKILL_NAME_KEY = "tspell";
const COMBO_LIMIT_KEY = "combo-max";
const DAMAGE_TO_NAMED_KEY = "+oth_dmg";

/** The decoder's own shape rule, so "damage key" means here what it means there. */
function isShapeDamageKey(key: string): boolean {
  return key.slice(1, 4) === "dmg";
}

/**
 * A count of combination points, not a quantity of anything. Far below what the
 * protocol's figures look like — absorption destruction runs into the thousands
 * — which is the property that keeps the two families apart by inspection.
 */
const MOST_POINTS_A_SKILL_CAN_SPEND = 100;

/** Every value the message states for the limit, so a repeat cannot hide behind the first. */
type Message = { keys: string[]; comboLimits: (string | null)[] };

const MESSAGES: Message[] = CAPTURED_FIGHTS.flatMap((fight) =>
  fight.dump.calls.flatMap((call) =>
    call.protocolMessages.map((message) => {
      const { parameters } = parseProtocolMessage(message);
      return {
        keys: parameters.map((parameter) => parameter.key),
        comboLimits: parameters
          .filter((parameter) => parameter.key === COMBO_LIMIT_KEY)
          .map((parameter) => parameter.value),
      };
    }),
  ),
);

const ANNOUNCEMENTS = MESSAGES.filter(({ keys }) => keys.includes(SKILL_NAME_KEY));

/** Restated here rather than exported: a guard that imports the list it guards
 * against agrees with the decoder by construction and checks nothing. */
const DECLARATION_KEYS = [
  "active_decblock_per",
  "active_decblock_per-enemies",
  "active_block_per",
  "alllowdmg",
  "allslow_per",
  "aura-ac_per",
  "aura-resall",
  "aura-sa_per",
  "mana",
  "energy",
  "shout",
];

describe("what a skill announcement carries", () => {
  test("the captures carry announcements to check", () => {
    expect(ANNOUNCEMENTS.length).toBeGreaterThan(0);
  });

  // The half of the old claim that survived measuring it again.
  test("never carries a key from the damage family", () => {
    const withDamage = ANNOUNCEMENTS.filter(({ keys }) => keys.some(isShapeDamageKey));
    expect(withDamage).toEqual([]);
  });

  /**
   * The half that did not. `+oth_dmg` is damage — the register lists it as moving
   * health — and it rides the announcement, in the same message, not a later one.
   * Asserted as a presence rather than a count so the file does not go stale on
   * new material; asserted at all so nobody restores the flat denial.
   */
  test("does carry damage aimed at a name, in the same message", () => {
    const withNamedDamage = ANNOUNCEMENTS.filter(({ keys }) =>
      keys.includes(DAMAGE_TO_NAMED_KEY),
    );
    expect(withNamedDamage.length).toBeGreaterThan(0);
  });

  test("and carries keys the register says move health", () => {
    const movingHealth = getKeysWithHealthEffect("moves health");
    const withHealth = ANNOUNCEMENTS.filter(({ keys }) =>
      keys.some((key) => key !== DAMAGE_TO_NAMED_KEY && movingHealth.includes(key)),
    );
    expect(withHealth.length).toBeGreaterThan(0);
  });
});

describe("`combo-max` on that announcement", () => {
  const carrying = MESSAGES.filter(({ comboLimits }) => comboLimits.length > 0);

  test("the captures carry it at all", () => {
    expect(carrying.length).toBeGreaterThan(0);
  });

  // Where it rides is the reason it is not read: it qualifies the skill being
  // announced, and there is no blow in the message to attach it to.
  test("rides only a skill announcement", () => {
    const elsewhere = carrying.filter(({ keys }) => !keys.includes(SKILL_NAME_KEY));
    expect(elsewhere).toEqual([]);
  });

  test("states a small whole count, not a quantity", () => {
    for (const stated of carrying.flatMap(({ comboLimits }) => comboLimits)) {
      const points = stated === null ? null : getIntegerFromText(stated);
      expect(points).not.toBeNull();
      expect(points).toBeGreaterThan(0);
      expect(points).toBeLessThan(MOST_POINTS_A_SKILL_CAN_SPEND);
    }
  });

  /**
   * Read as a declaration: a count of points the skill will spend, which is an
   * input. What the points come to arrives as ordinary figures, already computed,
   * so nothing totals this — the second assertion is the one that matters.
   */
  test("is read as a declaration, and counts towards nothing", () => {
    expect(UNDERSTOOD_PROTOCOL_KEYS).toContain(COMBO_LIMIT_KEY);

    const statistics = composeFightStatistics(
      decodeFight([`1=100.00;0;tspell=Something;${COMBO_LIMIT_KEY}=3`]),
    );
    expect(statistics.byCombatantId.get(1)?.skillsUsed).toBe(1);
    expect(statistics.byCombatantId.get(1)?.dealtApplied).toBe(0);
    expect(statistics.reading.unreadableMessages).toBe(0);
  });
});

/**
 * The eleven keys an announcement states about the skill itself.
 *
 * They are read — `SkillUsedEvent.declared` — and they are still not figures.
 * Both halves are held here, because the first without the second is how a
 * declaration becomes a statistic: `alllowdmg=5` says a skill will lower the
 * other side's damage, not that anybody's damage fell by five of anything.
 */
describe("what an announcement declares about its skill", () => {
  const DECLARED = CAPTURED_FIGHTS.flatMap((fight) =>
    decodeFight(fight.dump.calls.flatMap((call) => call.protocolMessages)).flatMap((event) =>
      event.kind === "skill-used" ? event.declared : [],
    ),
  );

  test("the captures carry declarations to check", () => {
    expect(DECLARED.length).toBeGreaterThan(0);
  });

  /**
   * Every occurrence rides an announcement, which is the measurement the whole
   * reading rests on: a declaration on a blow would be a declaration next to a
   * figure, and that is the join the protocol never states.
   */
  test("every one of them arrived on a skill announcement", () => {
    const onAnnouncements = MESSAGES.filter(({ keys }) =>
      keys.some((key) => DECLARATION_KEYS.includes(key)),
    );
    expect(onAnnouncements.length).toBeGreaterThan(0);
    for (const message of onAnnouncements) {
      expect(message.keys, message.keys.join(";")).toContain(SKILL_NAME_KEY);
    }
  });

  // The cost the game states is a fall, and it states it as one.
  test("`mana` states a fall, never a price to be added", () => {
    const mana = DECLARED.filter((declaration) => declaration.effect === "mana");
    expect(mana.length).toBeGreaterThan(0);
    for (const declaration of mana) expect(declaration.amount).toBeLessThan(0);
  });

  // The one whose value names somebody rather than counting something.
  test("`shout` carries a name and no figure", () => {
    const shouts = DECLARED.filter((declaration) => declaration.effect === "shout");
    expect(shouts.length).toBeGreaterThan(0);
    for (const shout of shouts) {
      expect(shout.amount).toBeNull();
      expect(shout.text).not.toBe("");
      expect(shout.text).not.toBeNull();
    }
  });

  /**
   * The half that keeps a declaration from becoming a measurement: no figure any
   * of these states reaches any combatant's row, or the unattributed bucket, or
   * a side's totals.
   */
  test("nothing a declaration states reaches a statistic", () => {
    const announced = decodeFight([
      "1=100.00;0;tspell=Something;alllowdmg=5;aura-ac_per=20;mana=-3;energy=0",
    ]);
    const statistics = composeFightStatistics(announced);
    const row = statistics.byCombatantId.get(1);

    expect(announced[0]?.kind).toBe("skill-used");
    expect(row?.skillsUsed).toBe(1);
    expect(row?.dealtRaw).toBe(0);
    expect(row?.dealtApplied).toBe(0);
    expect(row?.taken).toBe(0);
    expect(row?.healed).toBe(0);
    expect(statistics.unattributed.taken).toBe(0);
    expect(statistics.reading.unreadableMessages).toBe(0);
  });

  /**
   * A declaration with no announcement has nowhere to belong, so it goes back to
   * being unread rather than being dropped. Never seen in the captures — the test
   * above is what says so — but the decoder must not lose one if it ever is.
   */
  test("a declaration with no skill to belong to is reported unread", () => {
    const [event] = decodeFight(["1=100.00;0;alllowdmg=5"]);
    expect(event?.kind).toBe("unknown-message");
    expect(event).toMatchObject({ unreadKeys: ["alllowdmg"] });
  });

  // The shape is checked, not assumed: the day one of these carries something
  // else, it is loud rather than quietly read as a declaration of nothing.
  test("a declaration whose value is not a figure is reported unread", () => {
    const events = decodeFight(["1=100.00;0;tspell=Something;alllowdmg=quite a lot"]);
    expect(events.map((event) => event.kind)).toEqual(["skill-used", "unknown-message"]);
    expect(events[1]).toMatchObject({ unreadKeys: ["alllowdmg"] });
  });
});
