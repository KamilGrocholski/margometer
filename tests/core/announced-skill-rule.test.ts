/**
 * The rule that lets a figure name the skill it came from.
 *
 * It is a **reading**, not an inference: the client itself appends the message
 * after one carrying `skillId` and renders the pair as one action. What is ours
 * is the narrowing — the glued message must belong to the same combatant — and
 * that narrowing is what these tests are mostly about, because without it an
 * announcement quietly takes somebody else's blow.
 *
 * Fixtures here are written by hand rather than taken from the captures for the
 * shape tests: the material has no example of an announcement followed by
 * another combatant's *damage*, and the whole point is what happens then.
 */

import { describe, expect, test } from "bun:test";
import { decodeFight, SELF_SOURCED_HEALING_KEYS } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS, composeRosterOfFight, getMessagesOfFight, } from "@/tests/captured-fight-catalog.ts";
import { setRunningTotal } from "@/libs/running-total.ts";

const ANNOUNCEMENT = "7=100.00;8=100.00;tspell=Skill;skillId=42";

describe("what the game glues to an announcement", () => {
  test("binds the blow on the next message from the same combatant", () => {
    const events = decodeFight([ANNOUNCEMENT, "7=100.00;8=90.00;+dmg=500;-dmg=300"]);
    const blow = events.find((event) => event.kind === "attack");

    expect(blow?.announced).toEqual({ skillName: "Skill", skillId: 42, actorId: 7 });
  });

  /**
   * The one that would go wrong silently. Measured on the group capture: 32 of
   * the announcements are followed by a message belonging to somebody else, so
   * a rule that skipped this check would misattribute in every fight, not in a
   * corner case.
   */
  test("binds nothing when the next message belongs to another combatant", () => {
    const events = decodeFight([ANNOUNCEMENT, "9=100.00;8=90.00;+dmg=500;-dmg=300"]);
    const blow = events.find((event) => event.kind === "attack");

    expect(blow?.actorId).toBe(9);
    expect(blow?.announced).toBeNull();
  });

  test("reaches exactly one message forward", () => {
    const events = decodeFight([
      ANNOUNCEMENT,
      "7=100.00;8=90.00;+dmg=500;-dmg=300",
      "7=100.00;8=80.00;+dmg=400;-dmg=200",
    ]);
    const blows = events.filter((event) => event.kind === "attack");

    expect(blows).toHaveLength(2);
    expect(blows[0]?.announced).not.toBeNull();
    expect(blows[1]?.announced).toBeNull();
  });

  test("binds the figures riding the announcement itself", () => {
    const events = decodeFight([
      "7=100.00;8=100.00;tspell=Skill;skillId=42;+oth_dmg=247,a,Kto(71.86%)",
    ]);
    const damage = events.find((event) => event.kind === "damage-to-named-combatant");

    expect(damage?.announced?.skillId).toBe(42);
  });

  /**
   * A heal names the healed and never the healer, so the actor slot of its
   * message is the only thing that can stand for one — and checking the event
   * instead of the message would bind the skill to whoever received it.
   */
  test("a heal is bound to the announcer, not to the combatant it restored", () => {
    const events = decodeFight([ANNOUNCEMENT, "7=100.00;8=90.00;heal_target=1200"]);
    const heal = events.find((event) => event.kind === "health-change");

    expect(heal?.combatantId).toBe(8);
    expect(heal?.announced?.actorId).toBe(7);
  });

  /**
   * ⚠️ **The case the message-level check exists for, and the only one.**
   *
   * For a blow the check is redundant — the event carries its own striker, and
   * a blow by somebody else fails that comparison anyway. A heal carries no
   * healer at all, so nothing about the event itself can refuse it: without
   * asking whose *message* it arrived on, the previous combatant's skill would
   * be credited with a heal it had nothing to do with.
   *
   * Written after removing the check lit nothing (AGENTS.md §7.5): the rule was
   * right and the test was missing.
   */
  test("binds no heal that arrived on somebody else's message", () => {
    const events = decodeFight([ANNOUNCEMENT, "9=100.00;0;heal=1200"]);
    const heal = events.find((event) => event.kind === "health-change");

    expect(heal?.combatantId).toBe(9);
    expect(heal?.announced).toBeNull();
  });

  test("an announcement that opens a fight binds nothing before it", () => {
    const events = decodeFight(["7=100.00;8=90.00;+dmg=500;-dmg=300", ANNOUNCEMENT]);
    const blow = events.find((event) => event.kind === "attack");

    expect(blow?.announced).toBeNull();
  });
});

describe.each(CAPTURED_FIGHTS)("$name", (fight) => {
  const roster = composeRosterOfFight(fight);
  const messages = getMessagesOfFight(fight);
  const events = decodeFight(messages, roster);
  const statistics = composeFightStatistics(events, roster);
  const rows = [...statistics.byCombatantId.values()];

  /**
   * The measurement the narrowing rests on, re-taken on every run rather than
   * quoted: an announcement whose neighbour belongs to somebody else is not a
   * hypothetical, and if the material ever stops containing one, the rule that
   * exists for it should be re-argued rather than inherited.
   */
  test("the glue is refused whenever the next message changes hands", () => {
    let announcements = 0;
    let sameActor = 0;
    let otherActor = 0;

    for (const call of fight.dump.calls) {
      const parsed = call.protocolMessages.map((message) => parseProtocolMessage(message));
      parsed.forEach((message, index) => {
        if (!message.parameters.some((one) => one.key === "tspell")) return;
        announcements += 1;
        const next = parsed[index + 1];
        if (next === undefined) return;
        if (next.parameters.some((one) => one.key === "tspell")) return;
        if ((next.actor?.combatantId ?? null) === (message.actor?.combatantId ?? null)) sameActor += 1;
        else otherActor += 1;
      });
    }

    // The boar fight announces nothing at all, which is itself worth stating:
    // the rule has to be harmless where nobody uses a skill.
    if (announcements === 0) {
      expect(sameActor + otherActor).toBe(0);
      return;
    }

    /**
     * ⚠️ **This read `toBe(197)` and could only ever be true of one capture.**
     * The comment above already claimed the measurement was re-taken rather than
     * quoted, and it was quoted — from the only fight in the corpus that
     * announced anything. Four more group fights arrived and it failed on all
     * four, for the one reason a test must not: they announce a different number
     * of times, which is not a fault.
     *
     * ⚠️ **And then `otherActor` was asserted here too, which was the same mistake
     * one level down.** It read `toBeGreaterThan(0)` per fight on the strength of
     * "every fight that announces at all carries some", measured over a corpus of
     * group fights where somebody else always acts next.
     * `2026-08-24-tempest-tropiciel-vs-centaur` is a duel: two combatants, strictly
     * alternating, and every one of its announcements is followed by its own
     * announcer's blow. Nought is the right answer there, and the narrowing is
     * still needed — what has to hold is that the case exists in the **material**,
     * which is asserted once below rather than fight by fight.
     */
    expect(sameActor + otherActor).toBeLessThanOrEqual(announcements);
    expect(sameActor).toBeGreaterThan(0);
  });

  /**
   * The property that makes a per-skill breakdown safe to draw: it can be short
   * of the row, never over it. Short is expected and has a name in the panel —
   * blows nothing announced.
   */
  test("what the skills add up to never exceeds what the combatant landed", () => {
    for (const row of rows) {
      const bySkill = [...row.skills.values()].reduce((sum, skill) => sum + skill.dealtApplied, 0);
      expect(bySkill).toBeLessThanOrEqual(row.dealtApplied);
    }
  });

  test("every skill's targets add up to what that skill landed", () => {
    for (const row of rows) {
      for (const skill of row.skills.values()) {
        const byTarget = [...skill.dealtByTargetId.values()].reduce((sum, one) => sum + one, 0);
        // A blow at nobody lands nowhere to put it, so this is a ceiling rather
        // than an equality — and in this material the two agree exactly.
        expect(byTarget).toBeLessThanOrEqual(skill.dealtApplied);
      }
    }
  });

  test("healing with a healer never exceeds the healing that arrived", () => {
    for (const row of rows) {
      const named = [...row.healedByHealerId.values()].reduce((sum, one) => sum + one, 0);
      expect(named).toBeLessThanOrEqual(row.healed);
    }
  });

  /**
   * The two ends of the same figure: what a skill says it restored to somebody
   * has to be what that somebody's row credits to its announcer. They are built
   * from the same event in different places, which is exactly where a drift
   * would hide.
   */
  test("healing given by a skill matches the healing credited to its caster", () => {
    const givenByCaster = new Map<number, number>();
    for (const [id, row] of statistics.byCombatantId) {
      givenByCaster.set(
        id,
        [...row.skills.values()].reduce((sum, skill) => sum + skill.healed, 0),
      );
    }

    const creditedByCaster = new Map<number, number>();
    for (const row of statistics.byCombatantId.values()) {
      for (const [healer, amount] of row.healedByHealerId) {
        setRunningTotal(creditedByCaster, healer, amount);
      }
    }

    /**
     * ⚠️ **Over the union, with a missing caster read as zero — the `> 0` filter
     * that used to build the left side was the bug.** A heal cast on somebody
     * already at full health restores nothing and the protocol says so:
     * `heal_target=0` in `2026-08-15-tempest-grupa-vs-hildur-1`. The aggregate
     * credited that healer with 0, correctly — a heal that reached you and gave
     * you nothing is not the same as no heal — while the filter dropped the very
     * same 0 from the other side, so the two derivations of one figure disagreed
     * on the one case where the figure is zero.
     *
     * §7.5's rule, in the layer it had not yet been paid for in: a comparison
     * against `0` needs a test standing either side of it, and here zero is the
     * neutral element of the sum, so nothing moved and only the key sets parted.
     *
     * ⚠️ **And less the healing no skill announced, which is the other end of the
     * same figure.** The three keys the help calls the healed combatant's own are
     * credited to that combatant as a healer without any skill having said so
     * (`docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`), so the two
     * sides part by exactly that much and by nothing else.
     *
     * Subtracted rather than filtered out: an equality with a term on both sides
     * still breaks if either derivation drifts, where dropping the rows carrying
     * self-sourced healing would stop checking the very combatants who heal most.
     * It also states a second thing — **no self-sourced heal in these recordings
     * is announced.** One that was would take its credit from the announcer, the
     * subtraction would overshoot, and this would go red rather than quiet.
     */
    const casters = new Set([...givenByCaster.keys(), ...creditedByCaster.keys()]);
    for (const id of casters) {
      const healedBySource = statistics.byCombatantId.get(id)?.healedBySource;
      const selfSourced = SELF_SOURCED_HEALING_KEYS.reduce(
        (sum, key) => sum + (healedBySource?.get(key) ?? 0),
        0,
      );
      expect(givenByCaster.get(id) ?? 0, String(id)).toBe(
        (creditedByCaster.get(id) ?? 0) - selfSourced,
      );
    }
  });

  test("a use is counted for every announcement, and only for those", () => {
    const uses = rows.reduce(
      (sum, row) => sum + [...row.skills.values()].reduce((count, skill) => count + skill.uses, 0),
      0,
    );
    const announced = rows.reduce((sum, row) => sum + row.skillsUsed, 0);

    expect(uses).toBe(announced);
  });
});

/**
 * Both sides of the boundary the test above compares across, over the whole
 * material rather than per fight — because only one capture has the near side.
 *
 * Comparing two derivations with a default of zero on each passes just as
 * happily when nothing in the material is zero, and that is precisely how a heal
 * of nothing went unnoticed: for eleven captures there was no such case, the
 * left-hand map filtered `> 0`, and the two sides could not disagree because
 * they never met on one. `heal_target=0` in `2026-08-15-tempest-grupa-vs-hildur-1`
 * is the first heal in this repository's material that reached somebody and
 * restored nothing, and §9.6 turns on that being a different thing from no heal
 * at all.
 */
describe("a heal that restored nothing", () => {
  const everyFight = CAPTURED_FIGHTS.map((fight) =>
    composeFightStatistics(
      fight.dump.calls.flatMap((call) =>
        decodeFight(call.protocolMessages, composeRosterOfFight(fight)),
      ),
    ),
  );

  const restoredBySource = everyFight.flatMap((statistics) =>
    [...statistics.byCombatantId.values()].flatMap((row) => [...row.healedBySource.values()]),
  );
  const creditedEverywhere = everyFight.flatMap((statistics) =>
    [...statistics.byCombatantId.values()].flatMap((row) => [...row.healedByHealerId.values()]),
  );

  /**
   * ⚠️ **Read off the source map, because the healer-keyed one stopped being able
   * to show it.** A combatant's self-sourced healing is credited to that
   * combatant, so their own `heal` and their own zero-restoring `heal_target` now
   * share one key in `healedByHealerId` and sum to something positive — the zero
   * is still there, it is just no longer alone under that key
   * (`docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`). `healedBySource`
   * keeps them apart because the protocol keys differ, which is what this test
   * needs and the reason it moved rather than being weakened.
   */
  test("is kept as zero under its own key, and is not the only kind there is", () => {
    expect(restoredBySource.filter((amount) => amount === 0).length).toBeGreaterThan(0);
    expect(restoredBySource.filter((amount) => amount > 0).length).toBeGreaterThan(0);
    expect(restoredBySource.filter((amount) => amount < 0)).toEqual([]);
  });

  /** And nothing anywhere is credited to a healer as a negative. */
  test("is never credited to a healer as a loss", () => {
    expect(creditedEverywhere.filter((amount) => amount < 0)).toEqual([]);
    expect(creditedEverywhere.filter((amount) => amount > 0).length).toBeGreaterThan(0);
  });
});

/**
 * The case the narrowing exists for, asserted over the corpus and not over each
 * fight in it.
 *
 * An announcement whose very next message belongs to somebody else is what makes
 * "glue only to the same actor" a rule rather than a decoration: without one in
 * the material, the branch that refuses the glue is never taken and could be
 * deleted with everything still green. A duel carries none of them — the two
 * combatants alternate and each announcement is followed by its own blow — so the
 * property is about the material as a whole.
 */
describe("the material the narrowing rests on", () => {
  test("carries an announcement whose next message changes hands", () => {
    let handsChanged = 0;
    let announcements = 0;

    for (const fight of CAPTURED_FIGHTS) {
      for (const call of fight.dump.calls) {
        const parsed = call.protocolMessages.map((message) => parseProtocolMessage(message));
        parsed.forEach((message, index) => {
          if (!message.parameters.some((one) => one.key === "tspell")) return;
          announcements += 1;
          const next = parsed[index + 1];
          if (next === undefined) return;
          if (next.parameters.some((one) => one.key === "tspell")) return;
          if ((next.actor?.combatantId ?? null) !== (message.actor?.combatantId ?? null)) {
            handsChanged += 1;
          }
        });
      }
    }

    expect(announcements).toBeGreaterThan(0);
    expect(handsChanged).toBeGreaterThan(0);
  });
});
