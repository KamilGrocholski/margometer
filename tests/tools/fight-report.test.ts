/**
 * The report states both readings the panel warns about, and states them at zero.
 *
 * Written because the report had been printing one of the two. A panel warns
 * that healing is short by an amount the game never stated; the report printed
 * `unreadable messages` and stopped, so the one reading that is a certainty
 * rather than a suspicion was invisible to the tool this repository reads a
 * capture with (`TODO.md`, closed by the commit that carries this file).
 *
 * ⚠️ **Zero is the case that matters here.** Every capture in this material
 * reads at zero on both counts, so a block that printed only what is non-zero
 * would be byte-for-byte the block that never learned to state it — the fault
 * would come back unnoticed the moment a recording carries one. That is why the
 * corpus assertion below is about the caption and not about a figure.
 *
 * The per-key tallies are exercised on hand-made readings rather than on
 * material: `ReadingGaps` is our own contract, so a value built here is a
 * legitimate input and not a guess about somebody else's output (§7.5).
 */

import { describe, expect, test } from "bun:test";
import {
  CAPTURED_FIGHTS,
  CAPTURED_FIGHTS_DIRECTORY,
  composeStatisticsOfFight,
} from "@/tests/captured-fight-catalog.ts";
import { assertDefined } from "@/libs/assert.ts";
import {
  composeEmptyCombatantStatistics,
  type ReadingGaps,
} from "@/src/core/fight-statistics.ts";
import {
  composeReadingLines,
  composeRowReadingLines,
  FightReportError,
  getFightAt,
} from "@/tools/fight-report.ts";

function composeReading(overrides: Partial<ReadingGaps> = {}): ReadingGaps {
  return {
    unreadableMessages: 0,
    messagesByReason: new Map(),
    occurrencesByUnreadKey: new Map(),
    unaccountedHealthBySource: new Map(),
    ...overrides,
  };
}

describe("fight report reading block", () => {
  test("names both readings even where nothing was missed", () => {
    const text = composeReadingLines(composeReading()).join("\n");
    expect(text).toContain("unaccounted healing: 0 casts");
    expect(text).toContain("unreadable messages: 0");
  });

  test("every capture's report states both, on material that misses neither", () => {
    expect(CAPTURED_FIGHTS.length).toBeGreaterThan(0);
    for (const fight of CAPTURED_FIGHTS) {
      const text = composeReadingLines(composeStatisticsOfFight(fight).reading).join("\n");
      expect(text).toContain("unaccounted healing:");
      expect(text).toContain("unreadable messages:");
    }
  });

  // The certain claim above the suspicion, which is the order `src/ui/panel-view.ts`
  // puts its sentences in. A report that ranked them the other way would read as
  // if the unreadable message were the larger finding.
  test("puts unaccounted healing before unreadable messages", () => {
    const lines = composeReadingLines(
      composeReading({
        unreadableMessages: 2,
        messagesByReason: new Map([["no grammar", 2]]),
        unaccountedHealthBySource: new Map([["healall_per", 3]]),
      }),
    );
    const unaccounted = lines.findIndex((line) => line.includes("unaccounted healing:"));
    const unreadable = lines.findIndex((line) => line.includes("unreadable messages:"));
    expect(unaccounted).toBeGreaterThanOrEqual(0);
    expect(unaccounted).toBeLessThan(unreadable);
  });

  test("counts the casts and lists every key that stated one", () => {
    const lines = composeReadingLines(
      composeReading({
        unaccountedHealthBySource: new Map([
          ["healall_per", 3],
          ["healall_other", 1],
        ]),
      }),
    );
    expect(lines[0]).toContain("unaccounted healing: 4 casts");
    // Busiest first, and the key kept whole: a truncated key cannot be looked up
    // in `docs/protocol-keys.md`, which is the only reason to print it.
    expect(lines[1]).toContain("healall_per");
    expect(lines[2]).toContain("healall_other");
  });

  // Zero and one, both sides of the boundary: at zero the caption stands alone,
  // at one it has a line under it. A block that printed the caption and dropped
  // the tally would pass the first of these and fail the second.
  test("lists no key at zero and one key at one", () => {
    expect(composeReadingLines(composeReading())).toHaveLength(2);
    expect(
      composeReadingLines(composeReading({ unaccountedHealthBySource: new Map([["heal", 1]]) })),
    ).toHaveLength(3);
  });

  test("orders equal counts by their key, so the report reads the same twice", () => {
    const tallies = new Map([
      ["zzz", 1],
      ["aaa", 1],
    ]);
    const lines = composeReadingLines(composeReading({ unaccountedHealthBySource: tallies }));
    expect(lines[1]).toContain("aaa");
    expect(lines[2]).toContain("zzz");
  });
});

/**
 * The same two readings, on the row rather than on the fight.
 *
 * The panel marks a combatant's row when something naming them could not be read
 * or a cast of theirs could not be sized, and this is where an offline reading
 * says the same thing — so a mark somebody reports can be found in the report they
 * are asked for (`docs/specs/2026-08-24-a-warning-on-the-row-it-shortens.md`).
 *
 * ⚠️ **Silent at zero, and deliberately unlike the block above.** The fight-wide
 * counts print at zero because a missing line there is indistinguishable from a
 * tool that never stated them; a row line at zero would repeat itself under every
 * combatant of every capture and bury the table. The corpus assertion is that
 * nothing prints at all.
 */
describe("fight report row readings", () => {
  const clean = composeEmptyCombatantStatistics();

  test("says nothing about a row nothing was missed on", () => {
    expect(composeRowReadingLines(clean)).toEqual([]);
  });

  test("counts the messages naming them that nothing could read", () => {
    const lines = composeRowReadingLines({ ...clean, unreadableMessages: 3 }).join("\n");
    expect(lines).toContain("unreadable messages naming them: 3");
  });

  test("counts the casts of theirs nobody could size", () => {
    const lines = composeRowReadingLines({ ...clean, unaccountedHealingCasts: 2 }).join("\n");
    expect(lines).toContain("casts nobody could size: 2");
  });

  /**
   * ⚠️ **No capture prints, and the empty list is the claim.** One did for a day:
   * `2026-08-27-luvia-grupa-vs-amaimon-2` declares `lowheal_per-enemies`, and
   * while a fight declaring the reducer anywhere had none of its casts sized, its
   * two casters carried the count between them. The reducer is declared by one of
   * theirs at the monster, so nothing of theirs was reduced and all three casts
   * are sized now
   * (`docs/specs/2026-08-27-a-reduction-lands-on-the-other-side.md`).
   *
   * Asserted as the whole list rather than dropped, because it is the tool and the
   * panel held to the same rows: a line printing here for a combatant the panel
   * does not mark would be the report and the screen disagreeing about what was
   * missed. The lines themselves are held by the three tests above, on rows built
   * by hand.
   */
  test("no capture prints a row reading, because every cast in them is sized", () => {
    expect(CAPTURED_FIGHTS.length).toBeGreaterThan(0);
    const printed = CAPTURED_FIGHTS.flatMap((fight) =>
      [...composeStatisticsOfFight(fight).byCombatantId.values()].flatMap((row) =>
        composeRowReadingLines(row).map((line) => `${fight.name}: ${line.trim()}`),
      ),
    );
    expect(printed.sort()).toEqual([]);
  });
});

/**
 * The route that lets a recording be read before it is material.
 *
 * The same argument `tools/decoding-status.ts` carries, and here it costs more
 * than a list of messages: a report needs the roster and the entry health too,
 * and the entry health is unwound rather than stated. So what is checked is that
 * a fight read off a path is the **same fight** the catalog holds for that file,
 * down to the health the unwinding produced — a second spelling of it would make
 * the tool answer differently before and after intake, which is the one
 * comparison the argument exists to serve.
 *
 * ⚠️ **Checked against a capture, because it is the one recording this test can
 * name without writing a fixture of its own.** The file is reached through
 * `CAPTURED_FIGHTS_DIRECTORY` and a name off the catalog, never a filename
 * written down here (§9.2).
 */
describe("a recording named by path", () => {
  /**
   * ⚠️ **Every capture, not the first one.** Written against `CAPTURED_FIGHTS[0]`
   * to begin with, beside a second test putting the statistics of both readings
   * against each other — and emptying the entry health on this route killed the
   * first test and left the second green. The reason is the material: entry
   * health reaches a figure only through team-heal sizing, and the oldest
   * recording declares no team heal, so the whole unwinding could be discarded
   * without moving a number in the table (§7.5 — a mutation that lights nothing
   * is a finding).
   *
   * The second test was the redundant one and is gone: `composeStatisticsOfFight`
   * is a pure function of the fight, so a table that differed after a fight that
   * did not is not a thing this tool can do. What is worth checking is the fight
   * itself, and worth checking on material that actually exercises the unwinding
   * — which is found by reading them all rather than by naming the one that does
   * (§9.2).
   */
  test.each(CAPTURED_FIGHTS.map((fight) => [fight.name, fight] as const))(
    "%s reads the same off a path as out of the catalog",
    (name, fight) => {
      const read = getFightAt(`${CAPTURED_FIGHTS_DIRECTORY}${name}.json`);
      expect(read.name).toBe(name);
      expect(read.dump).toEqual(fight.dump);
      expect(read.maximumHealthByCombatantId).toEqual(fight.maximumHealthByCombatantId);
      expect(read.entryHealthByCombatantId).toEqual(fight.entryHealthByCombatantId);
    },
  );

  // Branded, because a bare Node `ENOENT` names no program and §9.5 asks a tool
  // to refuse under a name a reader can place.
  test("refuses a path that is not there, under this tool's own name", () => {
    const fight = assertDefined(CAPTURED_FIGHTS[0], "the material is not empty");
    expect(() =>
      getFightAt(`${CAPTURED_FIGHTS_DIRECTORY}${fight.name}.json.no-such-file`),
    ).toThrow(FightReportError);
  });
});
