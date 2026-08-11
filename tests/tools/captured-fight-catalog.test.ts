import { describe, expect, test } from "bun:test";
import { getMillisecondsFromIsoText } from "@/libs/timestamp.ts";
import { FightDumpFormatError, parseFightDump } from "@/tools/fight-dump-parser.ts";
import { CAPTURED_FIGHTS, composeRosterOfFight } from "@/tests/captured-fight-catalog.ts";

// Not an assertion inside the loop below: a loop over an empty directory is
// green and proves nothing. This is the test that notices the material is gone.
test("the capture directory holds material", () => {
  expect(CAPTURED_FIGHTS.length).toBeGreaterThan(0);
});

describe.each(CAPTURED_FIGHTS.map((fight) => [fight.name, fight] as const))(
  "%s",
  (_name, fight) => {
    test("states where it came from", () => {
      expect(fight.dump.world).not.toBe("");
      expect(fight.dump.gameBuild).not.toBe("");
      expect(getMillisecondsFromIsoText(fight.dump.capturedAt)).not.toBeNull();
    });

    test("carries engine calls", () => {
      expect(fight.dump.calls.length).toBeGreaterThan(0);
    });

    test("carries protocol messages", () => {
      const messages = fight.dump.calls.flatMap((call) => call.protocolMessages);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.every((message) => message.length > 0)).toBe(true);
    });

    /**
     * The trap `composeRosterOfFight` exists to avoid, held here rather than
     * described there. A combatant appears in every call's snapshots, and the
     * roster treats a name it meets twice as ambiguous — so composing from the
     * raw concatenation resolves **every** name to nobody. Nothing would throw:
     * the damage would simply arrive unattributed, and the totals would be right
     * while every row was empty.
     */
    test("its whole-fight roster still resolves names", () => {
      const roster = composeRosterOfFight(fight);
      const resolved = [...roster.idByName.values()].filter((id) => id !== null);
      expect(resolved.length).toBeGreaterThan(0);
    });

    // Sides are read from the material, not invented: a fight has more than one.
    test("its combatants fall on more than one side", () => {
      const roster = composeRosterOfFight(fight);
      const sides = new Set([...roster.byId.values()].map((combatant) => combatant.side));
      expect(sides.size).toBeGreaterThan(1);
    });

    // The whole reason a capture is a file and not a code module: maximum
    // health is never stated in the protocol, so without the snapshots there is
    // no way to check the decoder against anything but itself.
    test("carries maximum health per combatant", () => {
      expect(fight.maximumHealthByCombatantId.size).toBeGreaterThan(0);
      for (const [id, maximum] of fight.maximumHealthByCombatantId) {
        expect(maximum, `combatant ${id}`).toBeGreaterThan(0);
      }
    });

    test("carries the health each combatant started the fight with", () => {
      expect(fight.startingHealthByCombatantId.size).toBe(fight.maximumHealthByCombatantId.size);
      for (const [id, starting] of fight.startingHealthByCombatantId) {
        expect(starting, `combatant ${id}`).toBeGreaterThan(0);
        expect(starting, `combatant ${id}`).toBeLessThanOrEqual(
          fight.maximumHealthByCombatantId.get(id) ?? 0,
        );
      }
    });

    test("every combatant in a snapshot has a name and an id", () => {
      for (const call of fight.dump.calls) {
        for (const combatant of [...call.combatantsBefore, ...call.combatantsAfter]) {
          expect(combatant.name, `call ${call.index}`).not.toBe("");
          expect(combatant.id, `call ${call.index}`).not.toBe(0);
        }
      }
    });

    // The capture pipeline substitutes player nicknames before material enters
    // the repo. This is the check on the material itself — a rule guarded only
    // on the tooling side is a rule about code, not about the repository.
    test("no player nickname survived into the file", () => {
      const substituted = /^(Gracz|Player) \d+$/;
      for (const call of fight.dump.calls) {
        for (const combatant of [...call.combatantsBefore, ...call.combatantsAfter]) {
          // Monsters keep their real names — they are not people.
          if (combatant.id < 0) continue;
          expect(combatant.name, `call ${call.index}, id ${combatant.id}`).toMatch(substituted);
        }
      }
    });
  },
);

// Without this the new reader could return the maximum health map and every
// per-fight check above would still pass. Four of the eleven in the group
// capture entered below their maximum, and that gap is the whole reason the two
// are separate numbers.
test("starting health is not simply maximum health under another name", () => {
  const belowMaximum = CAPTURED_FIGHTS.flatMap((fight) =>
    [...fight.startingHealthByCombatantId].filter(
      ([id, starting]) => starting < (fight.maximumHealthByCombatantId.get(id) ?? 0),
    ),
  );
  expect(belowMaximum.length).toBeGreaterThan(0);
});

describe("fight dump parser", () => {
  test("refuses text that is not JSON", () => {
    expect(() => parseFightDump("not json")).toThrow(FightDumpFormatError);
  });

  // A parser that hands back a half-read object turns a broken capture into
  // wrong numbers further down, where the cause is no longer visible.
  test("names the exact path of a bad field", () => {
    const dump = {
      wersja: 1,
      przy: "2026-08-04T12:28:13.631Z",
      swiat: "tempest",
      build: "1",
      wpisy: [{ nr: 0, komunikaty: [], wojownicyPrzed: [], wojownicyPo: [{ id: "x" }] }],
    };
    expect(() => parseFightDump(JSON.stringify(dump))).toThrow(
      /wpisy\[0\]\.wojownicyPo\[0\]\.id: expected a whole number, got string/,
    );
  });

  // A combatant id is the same id the protocol states, and the protocol side
  // refuses both of these. Read more loosely here and a capture would join
  // against an id that cannot exist, which looks like a combatant nobody hit.
  test.each([1.5, 9007199254740993])("refuses %p as a combatant id", (id) => {
    const dump = {
      wersja: 1,
      przy: "2026-08-04T12:28:13.631Z",
      swiat: "tempest",
      build: "1",
      wpisy: [{ nr: 0, komunikaty: [], wojownicyPrzed: [], wojownicyPo: [{ id }] }],
    };
    expect(() => parseFightDump(JSON.stringify(dump))).toThrow(/\.id: expected a whole number/);
  });

  test("refuses a missing top-level field instead of defaulting it", () => {
    expect(() => parseFightDump(JSON.stringify({ wersja: 1 }))).toThrow(/przy: expected a string/);
  });

  test("accepts a capture without fight numbers", () => {
    const dump = {
      wersja: 1,
      przy: "2026-08-04T12:28:13.631Z",
      swiat: "tempest",
      build: "1",
      wpisy: [{ nr: 0, komunikaty: ["a"], wojownicyPrzed: [], wojownicyPo: [] }],
    };
    expect(parseFightDump(JSON.stringify(dump)).calls[0]!.fightNumber).toBeNull();
  });
});
