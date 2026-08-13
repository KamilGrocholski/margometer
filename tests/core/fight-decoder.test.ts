import { describe, expect, test } from "bun:test";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { CAPTURED_FIGHTS, composeRosterOfFight } from "@/tests/captured-fight-catalog.ts";

/**
 * Decoder rules that the captured material cannot pin down on its own, because
 * it happens to contain only one or two examples of them.
 *
 * The health witness proves the numbers; this proves the parts of the reading
 * that produce no number and would otherwise be inert.
 */

/**
 * ⚠️ **This block used to say "half understood is not understood", and reported
 * the key unread whenever a second figure sat beside the health one.**
 *
 * That was the right answer to a question nobody had measured. What is measured
 * now: both calls carrying such a value — `poison=140,14` and `heal=3065,-45`,
 * the only two in the material — are judged by the health witness and agree, on
 * the very messages that carry them. The first member accounts for all the
 * health movement, so the second moves none.
 *
 * So the two claims are separated. *Not understood* it remains: what the member
 * states is unknown, and this file does not guess. *Unaccounted* it is not, and
 * saying so would mark a fight where nothing is missing — which is the warning
 * that costs the warnings that matter.
 */
describe("a health figure with a second figure beside it", () => {
  const events = decodeFight(["1=50.00;0;poison=140,14"]);

  test("is read as the first component", () => {
    expect(events.filter((event) => event.kind === "health-change")).toEqual([
      {
        kind: "health-change",
        announced: null,
        combatantId: 1,
        amount: -140,
        source: "poison",
        declared: [{ effect: "poison", amount: 14, text: null }],
      },
    ]);
  });

  test("carries the second beside it, and reports nothing unread", () => {
    expect(events.filter((event) => event.kind === "unknown-message")).toEqual([]);
    expect(events.length).toBe(1);
  });

  // The shape is still checked: a member that is not a number is not carried.
  test("a second member that is not a figure is reported unread", () => {
    const odd = decodeFight(["1=50.00;0;poison=140,quite a lot"]);
    expect(odd.some((event) => event.kind === "unknown-message")).toBe(true);
    expect(odd).toContainEqual(expect.objectContaining({ unreadKeys: ["poison"] }));
  });

  test("a lone figure is not reported unread", () => {
    const lone = decodeFight(["1=50.00;0;poison=140"]);
    expect(lone.filter((event) => event.kind === "unknown-message")).toEqual([]);
  });
});

describe("damage stated against a name, with a roster to resolve it", () => {
  const message = "1=100.00;2=50.00;+oth_dmg=247,a,Odyniec(50.00%)";

  test("resolves to the combatant that name belongs to", () => {
    const roster = composeCombatantRoster([
      { id: 2, name: "Odyniec", side: 2, profession: null, level: null },
      { id: 3, name: "Locha", side: 2, profession: null, level: null },
    ]);
    const [event] = decodeFight([message], roster);
    expect(event).toMatchObject({ targetName: "Odyniec", targetId: 2 });
  });

  // Two boars answer to the same name in one of the captured fights. Picking
  // either would put real damage on the wrong combatant, which is worse than
  // putting it on nobody.
  test("resolves to nobody when two combatants answer to the name", () => {
    const roster = composeCombatantRoster([
      { id: 2, name: "Odyniec", side: 2, profession: null, level: null },
      { id: 3, name: "Odyniec", side: 2, profession: null, level: null },
    ]);
    const [event] = decodeFight([message], roster);
    expect(event).toMatchObject({ targetName: "Odyniec", targetId: null });
  });

  test("resolves to nobody when the roster has never heard the name", () => {
    const roster = composeCombatantRoster([{ id: 3, name: "Locha", side: 2, profession: null, level: null }]);
    const [event] = decodeFight([message], roster);
    expect(event).toMatchObject({ targetId: null });
  });

  /**
   * ⚠️ **The kind field arrives blank, and the game does not mind.** It spends
   * that member on the CSS class `dmg{kind}`, where `"dmg "` and `"dmg"` are the
   * same class — so a space there means the plain element and not a new one.
   * Read literally it made a second physical element carrying six figures of
   * damage under a label indistinguishable from the first.
   */
  test("a blank kind is the plain element, not a second one", () => {
    const [blank] = decodeFight(["1=100.00;2=50.00;+oth_dmg=4439, ,Odyniec(66.95%)"]);
    expect(blank).toMatchObject({ damage: { damageType: "dmg", amount: 4439 } });

    const [stated] = decodeFight([message]);
    expect(stated).toMatchObject({ damage: { damageType: "dmga", amount: 247 } });
  });
});

/**
 * The same, over the material rather than over one written-out message: no
 * element the captures produce may carry whitespace, because a label is all a
 * reader has to tell two of them apart.
 */
describe("every element the captures decode", () => {
  test.each(CAPTURED_FIGHTS)("$name names no element with a blank in it", (fight) => {
    const messages = fight.dump.calls.flatMap((call) => call.protocolMessages);
    const elements = new Set<string>();
    for (const event of decodeFight(messages, composeRosterOfFight(fight))) {
      if (event.kind === "attack")
        for (const damage of [...event.dealt, ...event.taken]) elements.add(damage.damageType);
      if (event.kind === "damage-to-named-combatant") elements.add(event.damage.damageType);
    }
    expect(elements.size).toBeGreaterThan(0);
    for (const element of elements) expect(element).toBe(element.trim());
  });
});
