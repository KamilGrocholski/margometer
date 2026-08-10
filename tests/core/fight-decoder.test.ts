import { describe, expect, test } from "bun:test";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";

/**
 * Decoder rules that the captured material cannot pin down on its own, because
 * it happens to contain only one or two examples of them.
 *
 * The health witness proves the numbers; this proves the parts of the reading
 * that produce no number and would otherwise be inert.
 */

describe("a health figure with a second figure beside it", () => {
  // Two messages in the captures carry `poison=140,14` and `heal=3065,-45`.
  // Reading the first component closes the arithmetic and the second explains
  // nothing we know, so the number is used and the key is *still* reported
  // unread. Half understood is not understood.
  const events = decodeFight(["1=50.00;0;poison=140,14"]);

  test("is read as the first component", () => {
    expect(events.filter((event) => event.kind === "health-change")).toEqual([
      { kind: "health-change", combatantId: 1, amount: -140, source: "poison" },
    ]);
  });

  test("is reported unread as well, because the second figure is not understood", () => {
    const unknown = events.filter((event) => event.kind === "unknown-message");
    expect(unknown.length).toBe(1);
    expect(unknown[0]?.reason).toContain("poison");
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
      { id: 2, name: "Odyniec", side: 2, profession: null },
      { id: 3, name: "Locha", side: 2, profession: null },
    ]);
    const [event] = decodeFight([message], roster);
    expect(event).toMatchObject({ targetName: "Odyniec", targetId: 2 });
  });

  // Two boars answer to the same name in one of the captured fights. Picking
  // either would put real damage on the wrong combatant, which is worse than
  // putting it on nobody.
  test("resolves to nobody when two combatants answer to the name", () => {
    const roster = composeCombatantRoster([
      { id: 2, name: "Odyniec", side: 2, profession: null },
      { id: 3, name: "Odyniec", side: 2, profession: null },
    ]);
    const [event] = decodeFight([message], roster);
    expect(event).toMatchObject({ targetName: "Odyniec", targetId: null });
  });

  test("resolves to nobody when the roster has never heard the name", () => {
    const roster = composeCombatantRoster([{ id: 3, name: "Locha", side: 2, profession: null }]);
    const [event] = decodeFight([message], roster);
    expect(event).toMatchObject({ targetId: null });
  });
});
