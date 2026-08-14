import { describe, expect, test } from "bun:test";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { CAPTURED_FIGHTS, composeRosterOfFight, getMessagesOfFight, } from "@/tests/captured-fight-catalog.ts";

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
 * Healing stated against a name, at the edges nothing had reached.
 *
 * ⚠️ **Every one of these came out of `bun tools/mutation-sweep.ts`.** The rules
 * were right and untested, and two of them guard the boundary this project keeps
 * paying for: a figure of **zero** is a measurement, and refusing it turns "the
 * game said nothing happened" into "we could not read it".
 */
describe("healing stated against a name, at its edges", () => {
  const composeMessage = (value: string): string => `1=100.00;2=50.00;legbon_lastheal=${value}`;

  test("a heal of zero is a heal that happened and measured nothing", () => {
    // Kills `amount < 0` → `<= 0` and → `< 1`. A skill that fired and restored
    // nothing is a real outcome; dropping it would take the event away entirely
    // and leave the panel with no sign the skill was ever used.
    const [event] = decodeFight([composeMessage("0,Odyniec(50.00%)")]);

    expect(event).toMatchObject({ kind: "healing-to-named-combatant", amount: 0 });
  });

  test("a heal that took health away is this reader misunderstanding its key", () => {
    expect(decodeFight([composeMessage("-40,Odyniec(50.00%)")])[0]).toMatchObject({
      kind: "unknown-message",
    });
  });

  /**
   * Kills `rawPercent !== undefined` → `===`. With that flipped, a name carrying
   * **no** percentage is refused — and the percentage is the optional half. The
   * material always states it, so nothing here would have noticed the day a
   * message arrived without one.
   */
  test("a name with no percentage beside it is still a name", () => {
    const [event] = decodeFight([composeMessage("120,Odyniec")]);

    expect(event).toMatchObject({
      kind: "healing-to-named-combatant",
      targetName: "Odyniec",
      targetHealthPercent: null,
      amount: 120,
    });
  });

  test("but a percentage that is not a number is not a name we can trust", () => {
    expect(decodeFight([composeMessage("120,Odyniec(nonsense%)")])[0]).toMatchObject({
      targetName: "Odyniec(nonsense%)",
    });
  });
});

/**
 * ⚠️ **A key whose value is blank is not a key we read.** `shout` names a
 * combatant, so an empty one would travel on as somebody nobody can find — the
 * same fault as a blank skill name, and the reason both are refused rather than
 * carried. Kills `value === null || value === ""` → `&&`, which let the empty
 * string through as a declaration.
 */
describe("a key that arrived with nothing in it", () => {
  // `shout` says nothing on its own — it rides a skill announcement, the way
  // `skillId` does. So the pair is what both cases are built from.
  const composeMessage = (shout: string): string => `1=100.00;0;tspell=Okrzyk;shout=${shout}`;

  test("a blank shout is named as unread rather than carried as a name", () => {
    const events = decodeFight([composeMessage("")]);

    expect(events).toMatchObject([
      { kind: "skill-used", declared: [] },
      { kind: "unknown-message", unreadKeys: ["shout"] },
    ]);
  });

  test("while a shout with a name in it rides the announcement", () => {
    expect(decodeFight([composeMessage("Odyniec")])).toMatchObject([
      { kind: "skill-used", declared: [{ effect: "shout", text: "Odyniec" }] },
    ]);
  });
});

/**
 * The same, over the material rather than over one written-out message: no
 * element the captures produce may carry whitespace, because a label is all a
 * reader has to tell two of them apart.
 */
describe("every element the captures decode", () => {
  test.each(CAPTURED_FIGHTS)("$name names no element with a blank in it", (fight) => {
    const messages = getMessagesOfFight(fight);
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
