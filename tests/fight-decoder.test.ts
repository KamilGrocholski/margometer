import { describe, expect, test } from "bun:test";
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
