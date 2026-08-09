import { describe, expect, test } from "bun:test";
import { FightDumpFormatError, readFightDump } from "@/tools/fight-dump-reader.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

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
      expect(Number.isNaN(Date.parse(fight.dump.capturedAt))).toBe(false);
    });

    test("carries engine calls", () => {
      expect(fight.dump.calls.length).toBeGreaterThan(0);
    });

    test("carries protocol messages", () => {
      const messages = fight.dump.calls.flatMap((call) => call.protocolMessages);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.every((message) => message.length > 0)).toBe(true);
    });

    // The whole reason a capture is a file and not a code module: maximum
    // health is never stated in the protocol, so without the snapshots there is
    // no way to check the decoder against anything but itself.
    test("carries maximum health per combatant", () => {
      expect(fight.maximumHealthById.size).toBeGreaterThan(0);
      for (const [id, maximum] of fight.maximumHealthById) {
        expect(maximum, `combatant ${id}`).toBeGreaterThan(0);
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

describe("fight dump reader", () => {
  test("refuses text that is not JSON", () => {
    expect(() => readFightDump("not json")).toThrow(FightDumpFormatError);
  });

  // A reader that hands back a half-read object turns a broken capture into
  // wrong numbers further down, where the cause is no longer visible.
  test("names the exact path of a bad field", () => {
    const dump = {
      wersja: 1,
      przy: "2026-08-04T12:28:13.631Z",
      swiat: "tempest",
      build: "1",
      wpisy: [{ nr: 0, komunikaty: [], wojownicyPrzed: [], wojownicyPo: [{ id: "x" }] }],
    };
    expect(() => readFightDump(JSON.stringify(dump))).toThrow(
      /wpisy\[0\]\.wojownicyPo\[0\]\.id: expected a finite number, got string/,
    );
  });

  test("refuses a missing top-level field instead of defaulting it", () => {
    expect(() => readFightDump(JSON.stringify({ wersja: 1 }))).toThrow(/przy: expected a string/);
  });

  test("accepts a capture without fight numbers", () => {
    const dump = {
      wersja: 1,
      przy: "2026-08-04T12:28:13.631Z",
      swiat: "tempest",
      build: "1",
      wpisy: [{ nr: 0, komunikaty: ["a"], wojownicyPrzed: [], wojownicyPo: [] }],
    };
    expect(readFightDump(JSON.stringify(dump)).calls[0]!.fightNumber).toBeNull();
  });
});
