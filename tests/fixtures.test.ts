import { describe, expect, test } from "bun:test";
import { DumpFormatError, readDump } from "../tools/dump.ts";
import { FIXTURES } from "./fixtures.ts";

// Not an assertion inside the loop below: a loop over an empty directory is
// green and proves nothing. This is the test that notices the material is gone.
test("the fixture directory holds material", () => {
  expect(FIXTURES.length).toBeGreaterThan(0);
});

describe.each(FIXTURES.map((f) => [f.name, f] as const))("%s", (_name, fixture) => {
  test("states where it came from", () => {
    expect(fixture.dump.world).not.toBe("");
    expect(fixture.dump.build).not.toBe("");
    expect(Number.isNaN(Date.parse(fixture.dump.capturedAt))).toBe(false);
  });

  test("carries engine calls", () => {
    expect(fixture.dump.entries.length).toBeGreaterThan(0);
  });

  test("carries protocol messages", () => {
    const messages = fixture.dump.entries.flatMap((e) => e.messages);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.every((m) => m.length > 0)).toBe(true);
  });

  // The whole reason a fixture is a file and not a code module: `hp.max` is
  // never stated in the protocol, so without the snapshots there is no way to
  // check the decoder against anything but itself.
  test("carries maximum health per combatant", () => {
    expect(fixture.maxHp.size).toBeGreaterThan(0);
    for (const [id, max] of fixture.maxHp) {
      expect(max, `combatant ${id}`).toBeGreaterThan(0);
    }
  });

  test("every combatant in a snapshot has a name and an id", () => {
    for (const entry of fixture.dump.entries) {
      for (const warrior of [...entry.before, ...entry.after]) {
        expect(warrior.name, `call ${entry.nr}`).not.toBe("");
        expect(warrior.id, `call ${entry.nr}`).not.toBe(0);
      }
    }
  });

  // The capture pipeline substitutes player nicknames before material enters
  // the repo. This is the check on the material itself — a rule guarded only on
  // the tooling side is a rule about code, not about the repository.
  test("no player nickname survived into the file", () => {
    const substituted = /^(Gracz|Player) \d+$/;
    for (const entry of fixture.dump.entries) {
      for (const warrior of [...entry.before, ...entry.after]) {
        // Monsters keep their real names — they are not people.
        if (warrior.id < 0) continue;
        expect(warrior.name, `call ${entry.nr}, id ${warrior.id}`).toMatch(substituted);
      }
    }
  });
});

describe("reader", () => {
  test("refuses text that is not JSON", () => {
    expect(() => readDump("not json")).toThrow(DumpFormatError);
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
    expect(() => readDump(JSON.stringify(dump))).toThrow(
      /wpisy\[0\]\.wojownicyPo\[0\]\.id: expected a finite number, got string/,
    );
  });

  test("refuses a missing top-level field instead of defaulting it", () => {
    expect(() => readDump(JSON.stringify({ wersja: 1 }))).toThrow(/przy: expected a string/);
  });

  test("accepts a capture without fight numbers", () => {
    const dump = {
      wersja: 1,
      przy: "2026-08-04T12:28:13.631Z",
      swiat: "tempest",
      build: "1",
      wpisy: [{ nr: 0, komunikaty: ["a"], wojownicyPrzed: [], wojownicyPo: [] }],
    };
    expect(readDump(JSON.stringify(dump)).entries[0]!.fight).toBeNull();
  });
});
