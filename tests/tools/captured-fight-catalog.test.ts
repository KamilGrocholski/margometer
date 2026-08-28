import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { getValueFromJsonText } from "@/libs/json.ts";
import { getRecordFromValue } from "@/libs/record.ts";
import { composeJsonText } from "@/libs/json.ts";
import { getMillisecondsFromIsoText } from "@/libs/timestamp.ts";
import { isEveryCharacterIn } from "@/libs/text-runs.ts";
import {
  DUMP_FIELDS,
  FightDumpFormatError,
  PAYLOAD_FIELDS,
  parseFightDump,
} from "@/tools/fight-dump-parser.ts";
import { composeRosterFragmentFromBattle } from "@/src/game/engine-roster.ts";
import { CAPTURED_FIGHTS, composeRosterOfFight, getMessagesOfFight, } from "@/tests/captured-fight-catalog.ts";

// Not an assertion inside the loop below: a loop over an empty directory is
// green and proves nothing. This is the test that notices the material is gone.
test("the capture directory holds material", () => {
  expect(CAPTURED_FIGHTS.length).toBeGreaterThan(0);
});

/**
 * The field names the parser owns, against the files themselves.
 *
 * They are the recordings' own Polish names (§9.2) and they are now spelled in one
 * place because a second speller had drifted into existence. Spelling them once is only
 * safe while they are the names on disk, and nothing else asks the disk — the parser
 * refuses a file that lacks them, but a name changed on *both* sides of a rename would
 * make it refuse every recording rather than quietly read none, and this says which of
 * the two happened.
 *
 * ⚠️ **The names are written out here on purpose.** Reading them from the same constant
 * would agree with any rename, which is the shape §9.3 asks about before a duplicate
 * spelling in a test is collapsed.
 */
const CAPTURED_FIGHTS_DIRECTORY = new URL("../captured-fights/", import.meta.url).pathname;

const DIGITS = "0123456789";

/**
 * Both words a redaction has ever written into this material, and deliberately
 * not the one word `tools/captured-fight-intake.ts` writes today: this reads the
 * files as they are, where the older captures carry the older word, and a guard
 * that borrowed the tool's spelling would refuse the material rather than the
 * tool.
 */
const SUBSTITUTED_NAMES = ["Gracz ", "Player "];

function isSubstitutedName(name: string): boolean {
  return SUBSTITUTED_NAMES.some(
    (label) => name.startsWith(label) && isEveryCharacterIn(name.slice(label.length), DIGITS),
  );
}

describe("the names a recording carries", () => {
  const ON_DISK = {
    formatVersion: "wersja",
    capturedAt: "przy",
    world: "swiat",
    gameBuild: "build",
    place: "mapa",
    placeMapName: "nazwa",
    placeX: "x",
    placeY: "y",
    calls: "wpisy",
    callIndex: "nr",
    fightNumber: "walka",
    protocolMessages: "komunikaty",
    combatantsBefore: "wojownicyPrzed",
    combatantsAfter: "wojownicyPo",
    payload: "ladunek",
  } as const;

  test("are what the parser spells", () => {
    expect(DUMP_FIELDS).toEqual(ON_DISK);
  });

  /**
   * The other list, and it is a different kind of name: these are the game's own,
   * recorded verbatim inside `ladunek`, where the ones above are the envelope this
   * repository writes and freezes. `npc` is the one that matters — it is the only
   * thing that tells a player from a monster, which is what
   * `tools/captured-fight-intake.ts` refuses to write a file without.
   */
  const IN_THE_PAYLOAD = {
    combatants: "w",
    combatantId: "id",
    nonPlayerFlag: "npc",
  } as const;

  test("include the payload's own, which the game chose and we did not", () => {
    expect(PAYLOAD_FIELDS).toEqual(IN_THE_PAYLOAD);
  });

  // The parsed shape carries our names and not the file's, so the file is read as
  // text and asked directly — which is the boundary this is about.
  test.each(CAPTURED_FIGHTS.map((fight) => [fight.name] as const))(
    "%s states them at its top level, and every call states the rest",
    (name) => {
      const text = readFileSync(`${CAPTURED_FIGHTS_DIRECTORY}${name}.json`, "utf8");
      const { value } = getValueFromJsonText(text);
      const dump = getRecordFromValue(value);
      expect(dump).not.toBeNull();
      for (const field of [
        ON_DISK.formatVersion,
        ON_DISK.capturedAt,
        ON_DISK.world,
        ON_DISK.gameBuild,
        ON_DISK.calls,
      ]) {
        expect(Object.keys(dump ?? {}), field).toContain(field);
      }

      const calls = dump?.[ON_DISK.calls];
      expect(Array.isArray(calls)).toBe(true);
      const [first] = Array.isArray(calls) ? calls : [];
      const call = getRecordFromValue(first);
      expect(call).not.toBeNull();
      for (const field of [
        ON_DISK.callIndex,
        ON_DISK.protocolMessages,
        ON_DISK.combatantsBefore,
        ON_DISK.combatantsAfter,
      ]) {
        expect(Object.keys(call ?? {}), field).toContain(field);
      }
    },
  );
});

describe.each(CAPTURED_FIGHTS.map((fight) => [fight.name, fight] as const))(
  "%s",
  (_name, fight) => {
    test("states where it came from", () => {
      expect(fight.dump.world).not.toBe("");
      // A build a recording could not read is `null` and says so; a build spelled
      // as nothing is a recording claiming to know one it does not. `not.toBe("")`
      // alone stopped separating the two the day the parser started admitting the
      // first (`docs/specs/2026-08-25-a-recording-that-names-no-build.md`).
      expect(fight.dump.gameBuild === null || fight.dump.gameBuild.length > 0).toBe(true);
      expect(getMillisecondsFromIsoText(fight.dump.capturedAt)).not.toBeNull();
    });

    test("carries engine calls", () => {
      expect(fight.dump.calls.length).toBeGreaterThan(0);
    });

    test("carries protocol messages", () => {
      const messages = getMessagesOfFight(fight);
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

    /**
     * ⚠️ **This used to hold the health each combatant was *first seen* with, and
     * that is a different figure.** The opening payload of a fight carries its own
     * messages, so the first snapshot is the state after them — first-seen is too
     * low for everyone in a fight that opens with an attack, which is most group
     * fights. The catalog now unwinds those messages back off
     * (`src/core/combatant-health.ts`), through the very reader the add-on uses, so
     * the offline path and the live one cannot mean different things by it.
     *
     * ⚠️ **The sentence here said two captures give an empty map, and none does.**
     * Every capture states an entry health for every combatant it knows a maximum
     * for — measured on the eighteen held on 2026-08-22, after a clamped snapshot
     * and a rounded percentage stopped refusing a combatant outright
     * (`src/core/combatant-health.ts`). The test below is still written as *less
     * than or equal*, on purpose: a recording that could answer for nobody is a
     * recording this reader cannot open, and the test two screens down is the one
     * that fails over it. What is held here is that whoever is in the map is in it
     * with a health a combatant could have entered on.
     */
    test("carries the health each combatant entered the fight with", () => {
      expect(fight.entryHealthByCombatantId.size).toBeLessThanOrEqual(
        fight.maximumHealthByCombatantId.size,
      );
      for (const [id, entry] of fight.entryHealthByCombatantId) {
        expect(entry, `combatant ${id}`).toBeGreaterThan(0);
        expect(entry, `combatant ${id}`).toBeLessThanOrEqual(
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
      for (const call of fight.dump.calls) {
        for (const combatant of [...call.combatantsBefore, ...call.combatantsAfter]) {
          // Monsters keep their real names — they are not people.
          if (combatant.id < 0) continue;
          expect(
            isSubstitutedName(combatant.name),
            `call ${call.index}, id ${combatant.id}: ${combatant.name}`,
          ).toBe(true);
        }
      }
    });
  },
);

// Without this the reader could return the maximum health map and every per-fight
// check above would still pass. Some combatants enter a fight below their
// maximum, and that gap is the whole reason the two are separate numbers.
test("entry health is not simply maximum health under another name", () => {
  const belowMaximum = CAPTURED_FIGHTS.flatMap((fight) =>
    [...fight.entryHealthByCombatantId].filter(
      ([id, entry]) => entry < (fight.maximumHealthByCombatantId.get(id) ?? 0),
    ),
  );
  expect(belowMaximum.length).toBeGreaterThan(0);
});

// ⚠️ **Every capture states one now, and this used to assert the opposite.**
// Some open with a payload carrying the whole fight and no snapshot beside it,
// and one carries no snapshot at all; their entry health is unwound from the
// first health percentage the messages state instead, so the map is full rather
// than empty. Kept pointing at the same place from the other side: a capture that
// fell back to nothing would be a recording this reader cannot open, and that is
// worth failing over.
test("every capture states an entry health for somebody", () => {
  const empty = CAPTURED_FIGHTS.filter((fight) => fight.entryHealthByCombatantId.size === 0);
  expect(empty.map((fight) => fight.name)).toEqual([]);
});

/**
 * The offline reading of a recording, against the live one.
 *
 * ⚠️ **The guard this round was missing, and the round is what it costs to not
 * have it.** The panel reads its roster from `ladunek.w`
 * (`src/game/battle-session.ts`); everything under `tests/` read it from the
 * snapshots the capture takes either side of the engine call. That held for as
 * long as every recorded fight ran over several calls — and it stopped the day a
 * fight fought on auto arrived in one, with `init`, `endBattle` and `close`
 * together and no battle object on either side of the call to snapshot. The
 * recording was complete and the panel that made it had drawn three combatants;
 * offline it was a fight of nobody, and what said so was a register refusing to
 * state a shape for it rather than anything pointed at the reading itself.
 *
 * ⚠️ **The live reader is the other side on purpose, and the first draft of this
 * had no other side at all.** Comparing the roster against
 * `composeCombatantsOfPayloads` — the reader the roster is now built from — is
 * §7.5's rule about a test reading a string back from the module that writes it,
 * in structural form: the two agree by construction. Mutating the level that
 * reader takes was reported killed by four tests and by neither of these. So the
 * fields are checked against `src/game/engine-roster.ts`, which parses the same
 * payload independently and is what the panel is actually handed.
 */
describe("the roster a recording is read with", () => {
  test.each(CAPTURED_FIGHTS.map((fight) => [fight.name, fight] as const))(
    "%s names everyone the panel would be handed, as the panel has them",
    (_name, fight) => {
      // What the live session holds once every payload of the recording has gone
      // through it — the reading the panel draws, read by the game layer's own
      // parser rather than by the one the offline roster uses.
      const live = new Map(
        fight.dump.calls.flatMap((call) =>
          composeRosterFragmentFromBattle(call.payload).combatants.map(
            (combatant) => [combatant.id, combatant] as const,
          ),
        ),
      );
      // Not an assertion inside the loop: a recording whose payloads named nobody
      // would pass that by drawing no comparison at all.
      expect(live.size).toBeGreaterThan(0);

      const roster = composeRosterOfFight(fight);
      for (const [id, combatant] of live) {
        const offline = roster.byId.get(id);
        expect(offline?.name, combatant.name).toBe(combatant.name);
        expect(offline?.side, combatant.name).toBe(combatant.side);
        expect(offline?.level, combatant.name).toBe(combatant.level);
        expect(offline?.maximumHealth, combatant.name).toBe(combatant.maximumHealth);
      }
    },
  );
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
    expect(() => parseFightDump(composeJsonText(dump))).toThrow(
      "wpisy[0].wojownicyPo[0].id: expected a whole number, got string",
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
    expect(() => parseFightDump(composeJsonText(dump))).toThrow(".id: expected a whole number");
  });

  test("refuses a missing top-level field instead of defaulting it", () => {
    expect(() => parseFightDump(composeJsonText({ wersja: 1 }))).toThrow("przy: expected a string");
  });

  test("accepts a capture without fight numbers", () => {
    const dump = {
      wersja: 1,
      przy: "2026-08-04T12:28:13.631Z",
      swiat: "tempest",
      build: "1",
      wpisy: [{ nr: 0, komunikaty: ["a"], wojownicyPrzed: [], wojownicyPo: [] }],
    };
    expect(parseFightDump(composeJsonText(dump)).calls[0]!.fightNumber).toBeNull();
  });

  /**
   * The build, whose three answers are three different things.
   *
   * `null` is the add-on saying the page did not state one, and reading it is
   * what lets a fight from a client we cannot identify still be material. The
   * other two are not that: a recording with no such field is a format nothing
   * here has seen, and a build that is not text is a field this parser cannot
   * read — both stop the read rather than becoming the first answer, which is the
   * separation `docs/specs/2026-08-25-a-recording-that-names-no-build.md` turns
   * on.
   */
  const composeDumpWithBuild = (build: unknown): string =>
    composeJsonText({
      wersja: 1,
      przy: "2026-08-04T12:28:13.631Z",
      swiat: "tempest",
      ...(build === undefined ? {} : { build }),
      wpisy: [{ nr: 0, komunikaty: ["a"], wojownicyPrzed: [], wojownicyPo: [] }],
    });

  test("reads a capture that names no build", () => {
    expect(parseFightDump(composeDumpWithBuild(null)).gameBuild).toBeNull();
  });

  test("refuses a capture with no build field at all", () => {
    expect(() => parseFightDump(composeDumpWithBuild(undefined))).toThrow(
      "build: expected a string, got undefined",
    );
  });

  // Wrapped one deep because `test.each` spreads an array case into arguments,
  // and the empty one then arrives as no argument at all — which bun reads as a
  // callback asking for `done` and times out rather than failing.
  test.each([[1786514810315], [[]], [{}]])("refuses %p as a build", (build) => {
    expect(() => parseFightDump(composeDumpWithBuild(build))).toThrow("build: expected a string");
  });
});
