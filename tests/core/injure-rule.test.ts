/**
 * The rule `docs/protocol-keys.md` states for `+injure`, re-earned on every run.
 *
 * The help supplied the rule and the captures confirmed it; prose would leave it
 * at that. This is the part a machine can check (AGENTS.md §7.5), and it is
 * worth checking because the entry's conclusion — that the key must stay unread
 * — is the kind that looks like an oversight to whoever meets it next.
 */

import { describe, expect, test } from "bun:test";
import { composeIntegerText, getIntegerFromText } from "@/libs/number.ts";
import { decodeFight, UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS, composeStatisticsOfFight } from "@/tests/captured-fight-catalog.ts";

// Restated rather than imported: this file asserts what the decoder reads, and a
// test that reads the decoder's own list agrees with it by construction (§9.3).
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

/**
 * Which application a tick belongs to — the join the announcement makes possible.
 *
 * The entry above settles what `+injure` states; this settles that the wound
 * arriving later can be traced back to it. The help supplies the rule and it is
 * the overwrite that makes the join a reading rather than a search: article
 * `view,372` at the engine name `injure` (read 2026-08-18) says the damage effect
 * does not accumulate and is overwritten by the freshest value applied **to that
 * given opponent**, so at any moment a victim carries exactly one wound and the
 * freshest application is whose it is.
 *
 * Nothing reads this yet. It is measured first because the conclusion — that a
 * figure the panel draws as `Nieznany sprawca` has an attacker the protocol
 * already named — is one that has to be checked before anything depends on it.
 */
type Wound = { attackerId: number; amount: number };

/** A tick, with the wound its victim was carrying when it arrived. */
type TickAgainstWound = { amount: number; wound: Wound | null; victimId: number };

/**
 * Per fight rather than per capture: a dump can hold more than one, and a wound
 * cannot survive the fight it was applied in. Folded in arrival order, which is
 * the only order the overwrite rule can be read in.
 */
const TICKS_AGAINST_WOUNDS: TickAgainstWound[] = CAPTURED_FIGHTS.flatMap((fight) => {
  const ticks: TickAgainstWound[] = [];
  const woundByVictimId = new Map<number, Wound>();
  let fightNumber: number | null = null;

  for (const call of fight.dump.calls) {
    if (call.fightNumber !== fightNumber) {
      woundByVictimId.clear();
      fightNumber = call.fightNumber;
    }

    for (const message of call.protocolMessages) {
      const { actor, target, parameters } = parseProtocolMessage(message);

      for (const parameter of parameters) {
        if (parameter.value === null) continue;
        const amount = getIntegerFromText(parameter.value);
        if (amount === null) continue;

        // The announcement names both ends; the tick names the victim in the
        // actor slot and nobody at the other, which is why the two are read from
        // different sides of the same message shape.
        if (parameter.key === ANNOUNCEMENT_KEY && actor !== null && target !== null) {
          woundByVictimId.set(target.combatantId, {
            attackerId: actor.combatantId,
            amount,
          });
        }
        if (parameter.key === TICK_KEY && actor !== null) {
          ticks.push({
            amount,
            wound: woundByVictimId.get(actor.combatantId) ?? null,
            victimId: actor.combatantId,
          });
        }
      }
    }
  }

  return ticks;
});

describe("which wound a tick belongs to", () => {
  test("the captures carry ticks to check", () => {
    expect(TICKS_AGAINST_WOUNDS.length).toBeGreaterThan(0);
  });

  test("every tick lands on a victim already carrying a wound", () => {
    expect(TICKS_AGAINST_WOUNDS.filter(({ wound }) => wound === null)).toEqual([]);
  });

  /**
   * The identity that would have to break before the freshest application stopped
   * being the right one. A tick states the same figure its announcement did, so a
   * wound the fold got wrong shows up as a figure that does not match rather than
   * as an attribution nobody can see.
   */
  test("a tick states exactly what the wound it carries announced", () => {
    const disagreeing = TICKS_AGAINST_WOUNDS.filter(
      ({ amount, wound }) => wound !== null && wound.amount !== amount,
    );
    expect(disagreeing).toEqual([]);
  });

  /**
   * ⚠️ **Without this the two tests above prove nothing about *freshest*.** On a
   * corpus where every victim is wounded by one attacker who never varies the
   * figure, keeping the first application, the last, or any of them agrees — and
   * the rule would read as settled while never having been asked the only question
   * it exists to answer.
   */
  test("some victim was wounded by more than one attacker", () => {
    const attackerIdsByVictimId = new Map<number, Set<number>>();
    for (const fight of CAPTURED_FIGHTS) {
      for (const call of fight.dump.calls) {
        for (const message of call.protocolMessages) {
          const { actor, target, parameters } = parseProtocolMessage(message);
          if (actor === null || target === null) continue;
          if (!parameters.some((parameter) => parameter.key === ANNOUNCEMENT_KEY)) continue;
          const attackerIds = attackerIdsByVictimId.get(target.combatantId) ?? new Set<number>();
          attackerIds.add(actor.combatantId);
          attackerIdsByVictimId.set(target.combatantId, attackerIds);
        }
      }
    }
    const contested = [...attackerIdsByVictimId.values()].filter((ids) => ids.size > 1);
    expect(contested.length).toBeGreaterThan(0);
  });
});

/**
 * What the aggregate does with the join — §9.6's fourth clause, in the three
 * shapes the captures cannot show and the one they can.
 *
 * The corpus has no fight joined mid-wound, no figure that disagrees and no
 * announcement whose attacker fails to resolve, because every name in all
 * seventeen resolves and every tick has its announcement. Those are exactly the
 * shapes where a wrong reading would charge somebody with damage they did not do,
 * so they are built by hand.
 */
describe("who a wound is charged to", () => {
  const composeWound = (attacker: string, victim: number, amount: number) =>
    `${attacker};${victim}=50.00;+dmg=500;-dmg=400;+injure=${composeIntegerText(amount)}`;
  const composeTick = (victim: number, amount: number) =>
    `${composeIntegerText(victim)}=40.00;0;injure=${composeIntegerText(amount)}`;
  const composeStatistics = (messages: string[]) => composeFightStatistics(decodeFight(messages));

  test("the attacker who announced it is charged, and the victim still lost it", () => {
    const statistics = composeStatistics([composeWound("1=90.00", 3, 60), composeTick(3, 60)]);
    expect(statistics.byCombatantId.get(1)?.healthLostCaused).toBe(60);
    expect(statistics.byCombatantId.get(3)?.healthLost).toBe(60);
    expect([...(statistics.byCombatantId.get(3)?.healthLostByActorId.get(1) ?? [])]).toEqual([
      [TICK_KEY, 60],
    ]);
    // The blow it rode is untouched: the announcement is counted as nothing, and
    // the wound is not a swing.
    expect(statistics.byCombatantId.get(1)?.dealtApplied).toBe(400);
    expect(statistics.byCombatantId.get(1)?.blowsStruck).toBe(1);
  });

  test("a tick nothing announced is charged to nobody", () => {
    const statistics = composeStatistics([composeTick(3, 60)]);
    expect(statistics.byCombatantId.get(3)?.healthLost).toBe(60);
    expect(statistics.byCombatantId.get(3)?.healthLostByActorId.size).toBe(0);
  });

  /**
   * The figure is what identifies the application, so a figure that is not the one
   * announced is not the wound being held — and a tick we cannot identify is one we
   * cannot place.
   */
  test("a tick stating anything else is charged to nobody", () => {
    const statistics = composeStatistics([composeWound("1=90.00", 3, 60), composeTick(3, 50)]);
    expect(statistics.byCombatantId.get(3)?.healthLost).toBe(50);
    expect(statistics.byCombatantId.get(3)?.healthLostByActorId.size).toBe(0);
    expect(statistics.byCombatantId.get(1)?.healthLostCaused).toBe(0);
  });

  /** The help's overwrite rule, which is what makes *freshest* the right one. */
  test("the freshest application is whose it is, and the one it replaced is nobody's", () => {
    const statistics = composeStatistics([
      composeWound("1=90.00", 3, 60),
      composeWound("2=90.00", 3, 40),
      composeTick(3, 40),
      composeTick(3, 60),
    ]);
    expect(statistics.byCombatantId.get(2)?.healthLostCaused).toBe(40);
    expect(statistics.byCombatantId.get(1)?.healthLostCaused).toBe(0);
    // 100 lost, 40 of it charged: the tick stating the replaced figure is on
    // nobody, which is the honest answer rather than the previous attacker's.
    expect(statistics.byCombatantId.get(3)?.healthLost).toBe(100);
  });

  /**
   * ⚠️ **The wound is replaced even where the fresh one cannot be charged.** The
   * game overwrites it whoever landed it, so an application whose actor did not
   * resolve has to displace the one before it — dropping it instead would let a
   * stale wound go on claiming ticks that are somebody else's.
   */
  test("an application nobody is named for still replaces the one before it", () => {
    const statistics = composeStatistics([composeWound("1=90.00", 3, 60), composeWound("0", 3, 60), composeTick(3, 60)]);
    expect(statistics.byCombatantId.get(1)?.healthLostCaused).toBe(0);
    expect(statistics.byCombatantId.get(3)?.healthLost).toBe(60);
    expect(statistics.byCombatantId.get(3)?.healthLostByActorId.size).toBe(0);
  });

  /**
   * And over the material: every point the key states reaches the attacker who
   * announced it. Asserted as an equality between two different fields of the
   * aggregate rather than as a figure, so a recording that broke it — a tick
   * arriving with no announcement, a figure that disagrees — fails here rather
   * than quietly moving damage onto the pinned row.
   */
  test("every point of it reaches an attacker, on every capture", () => {
    let lost = 0;
    let charged = 0;
    for (const fight of CAPTURED_FIGHTS) {
      const statistics = composeStatisticsOfFight(fight);
      for (const row of statistics.byCombatantId.values()) {
        lost += row.healthLostBySource.get(TICK_KEY) ?? 0;
        for (const byTarget of row.healthLostCausedByTargetId.values()) {
          charged += byTarget.get(TICK_KEY) ?? 0;
        }
      }
    }
    expect(lost).toBeGreaterThan(0);
    expect(charged).toBe(lost);
  });
});
